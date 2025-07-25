const {
	Op,
	sequelize,
	Post,
	Post_detail,
	Post_header,
	Post_header_mapping,
	Campaign,
	User,
	User_group,
	User_group_mapping,
	Asset,
	Asset_detail,
	Post_asset_mapping,
	Client,
	Client_job_role,
	Drip_native,
	Drip_whatsapp_native,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Drip_camp,
	Market,
	Worksheet,
	Workbook,
	Scorm_tracking,
	Scorm_interaction,
	Option,
	Course,
	Question,
	DiwoAsset,
	Course_workbook_mapping,
	Session,
	SessionUser,
	SessionQuestion,
	SessionWorksheet,
	SessionOption,
	SessionAsset,
	WorkbookTrainerMapping,
	WorkbookUserGroupMapping,
	SessionPhotograph,
	SessionQuestionSubmission,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	DiwoAssignment,
	DiwoModule,
	Pathway,
	PathwayCourseMapping,
	LearnerAssignment,
	LearnerAchievement,
	DiwoModuleAssign,
	User_role_client_mapping,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const { getAddOneWorkbookInLicense, getRemoveWorkbookByCount } = require('../services/license.service');
let imagePath = 'uploads/SessionPhotographs/';
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const targetBaseUrl = CONFIG.web_host + '/#/';
const { getAllSubClientAndBranchAccountLists } = require('../services/client.service');
const shortid = require('shortid');
const { getDiwoClientVimeoTokenService } = require('../services/vimeo.service');
const { getAllDiwoUserIdsForNotification, createNotificationforDiwo } = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const { getAllSubChildClientIdsForDiwo } = require('../services/client.service');
const { getDiwoClientAppBrandingByClientId } = require('../services/client.service');
const { updateCourseAndPathwayStatus } = require('../services/diwo-assignment.service');
const Sequelize = require('sequelize');
const puppeteer = require('puppeteer');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { CertificationCompletitionSendEmailToLearner } = require('../services/mailer.service');

const { generateLevelCertificate } = require('./diwo-certificate.controller');
const config_feature = require('../config/SiteConfig.json');
// Create Session
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

const createSession = async function (req, res) {
	try {
		const schema = Joi.object({
			ClientId: Joi.number().integer().min(1).positive().required(),
			id: Joi.number().integer().allow(null),
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			location: Joi.string().required(),
			date: Joi.object({
				startDate: Joi.date().iso().required(),
				endDate: Joi.date().iso().allow(null),
			}).required(),
			time: Joi.number().integer().required(),
			dateWithTime: Joi.number().integer().required(),
			link: Joi.string().uri().allow(null),
			status: Joi.string().allow(null),
			isDeleted: Joi.boolean().required(),
			WorkbookId: Joi.number().integer().required(),
			CourseId: Joi.number().integer().allow(null),
			language: Joi.string().allow(null),
			DiwoModuleId: Joi.number().integer().required(),
		});

		const { error, value } = schema.validate({
			ClientId: parseInt(req.params.clientId),
			...req.body,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		// const { clientId } = value;
		const session_details = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, session_details.ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let clientId = session_details.ClientId;
		let workbook;
		// let session_details = req.body;

		const userId = req.user.id;
		const roleId = req.user.RoleId;

		session_details.UserId = userId;
		session_details.CreatedBy = userId;
		session_details.RoleId = roleId;
		// session_details.ClientId = clientId;

		//Create Workbook Meta Data

		[err, workbook] = await to(
			Workbook.findOne({
				where: {
					id: session_details.WorkbookId,
				},
				include: [
					{
						model: Worksheet,
						include: [
							{
								model: DiwoAsset,
							},
						],
					},
				],
				order: [
					[
						{
							model: Worksheet,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (workbook) {
			workbook = workbook.convertToJSON();
			for (let worksheet_ of workbook.Worksheets) {
				[err, question] = await to(
					Question.findAll({
						where: {
							WorksheetId: worksheet_.id,
						},
						include: [
							{
								model: DiwoAsset,
							},
							{
								model: Option,
							},
							{
								model: SurveyQueGroup,
							},
							{
								model: DiwoSpinWheelCat,
							},
						],
						order: [
							['id', 'ASC'],
							[
								{
									model: Option,
								},
								'id',
								'ASC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				worksheet_.Questions = question;
			}

			// Workbook Assets
			[err, diwoAsset] = await to(
				DiwoAsset.findAll({
					where: {
						WorksheetId: {
							[Op.eq]: null,
						},
						QuestionId: {
							[Op.eq]: null,
						},
						WorkbookId: session_details.WorkbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (diwoAsset && diwoAsset.length > 0) {
				session_details.DiwoAssets = diwoAsset;
			} else {
				session_details.DiwoAssets = [];
			}
			session_details.workbookData = JSON.stringify(workbook);
		}

		session_details.status = 'Planned';

		let generatedlinkpath = shortid.generate();
		let code = generatedlinkpath.toLowerCase();
		session_details.code = code;
		session_details.link = `${CONFIG.diwo_host}?workbook_code=${code}`;
		session_details.step = 4;
		[err, create_session] = await to(Session.create(session_details));
		if (err) return ResponseError(res, err, 500, true);

		// let link = `${CONFIG.pwa_base_url}?workbook=${req.body.WorkbookId}&session=${create_session.id}`;

		// [err, update_session] = await to(Session.update({
		//     link: link
		// }, {
		//     where: {
		//         id: create_session.id
		//     }
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		// Add One set of Workbook for Trainer
		///////////////////////////////////////////

		// [err, addSessionUser] = await to(SessionUser.create({
		//     SessionId: create_session.id,
		//     WorkbookId: session_details.WorkbookId,
		//     SessionStatus: 'Planned',
		//     forTrainer: true,
		//     status: 'Pre Assign',
		//     title: workbook.title,
		//     descrip: workbook.descrip,
		//     ClientId: clientId,
		//     UserId: null,
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		[err, session] = await to(
			Session.findOne({
				where: {
					id: create_session.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;

		let sessionName = create_session.title;
		let notifcationMessage = MESSAGE.SESSION_CREATED_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{session_name}}', sessionName);
		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.SESSION_CREATED_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{session_name}}', sessionName);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: create_session.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: session.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createSession = createSession;

// Update Session
const updateSession = async function (req, res) {
	try {
		let session_details;

		if (req.body.isSessionClosed && req.body.stepCount == 3) {
			const schema = Joi.object({
				ClientId: Joi.number().integer().positive().required(),
				sessionId: Joi.number().integer().positive().required(),
				id: Joi.number().integer().allow(null),
				title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
				location: Joi.string().required(),
				date: Joi.object({
					startDate: Joi.date().iso().required(),
					endDate: Joi.date().iso().allow(null),
				}).required(),
				enddate: Joi.object({
					startDate: Joi.date().iso().required(),
					endDate: Joi.date().iso().allow(null),
				}).required(),
				time: Joi.number().integer().required(),

				dateWithTime: Joi.number().integer().required(),
				enddateWithTime: Joi.number().integer().required(),
				endtime: Joi.number().integer().required(),
				isSessionClosed: Joi.boolean().required(),
				latitude: Joi.number().allow(null),
				longitude: Joi.number().allow(null),
				geoLocation: Joi.number().integer().allow(null),
				stepCount: Joi.number().integer().allow(null),
				language: Joi.string().allow(null),
			});

			const { error, value } = schema.validate({
				ClientId: parseInt(req.params.clientId),
				sessionId: parseInt(req.params.sessionId),
				...req.body,
			});
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			session_details = value;
		} else if (req.body.isBackStep && (req.body.stepCount == 2 || req.body.stepCount == 3)) {
			const schema = Joi.object({
				ClientId: Joi.number().integer().min(1).positive().required(),
				sessionId: Joi.number().integer().positive().required(),
				id: Joi.number().allow(null),
				isDeleted: Joi.boolean().required(),
				isBackStep: Joi.boolean().allow(null),
				stepCount: Joi.number().allow(null),
				link: Joi.string().uri().required(),
				status: Joi.string().allow(null),
			});

			const { error, value } = schema.validate({
				ClientId: parseInt(req.params.clientId),
				...req.body,
			});
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			session_details = value;
		} else if (req.body.isForwardStep && (req.body.stepCount == 2 || req.body.stepCount == 3)) {
			const schema = Joi.object({
				ClientId: Joi.number().integer().min(1).positive().required(),
				sessionId: Joi.number().integer().positive().required(),
				id: Joi.number().allow(null),
				isDeleted: Joi.boolean().required(),
				isForwardStep: Joi.boolean().allow(null),
				stepCount: Joi.number().allow(null),
				link: Joi.string().uri().required(),
				status: Joi.string().allow(null),
			});

			const { error, value } = schema.validate({
				ClientId: parseInt(req.params.clientId),
				...req.body,
			});
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			session_details = value;
		}

		// const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, session_details.ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let clientId = session_details.ClientId;
		let sessionId = session_details.sessionId;

		let flag = false;
		let userId = req.user.id;
		let roleId = req.user.RoleId;
		let update_session;

		// let clientId = req.params.clientId;
		// let session_details = req.body;

		// const schema = Joi.object({
		// 	sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		// 	clientId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		// });

		// // Validate the request body
		// const { error, value } = schema.validate({
		// 	sessionId: parseInt(req.params.sessionId),
		// 	clientId: parseInt(req.params.clientId),
		// });
		// if (error) {
		// 	return res.status(400).json({ error: error.details[0].message });
		// }
		// const { sessionId, clientId } = value;
		// let sessionId = parseInt(req.params.sessionId);

		if (session_details.isSessionClosed) {
			flag = true;
		}

		if (!flag) {
			session_details.UserId = userId;
		}

		delete session_details.WorkbookId;
		[err, update_session] = await to(
			Session.update(session_details, {
				where: {
					id: sessionId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, session] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: sessionId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: session.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateSession = updateSession;

const getRandomDataFromArray = async function (dataArray, numberOfRecords) {
	try {
		const shuffledArray = [...dataArray];
		for (let i = shuffledArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
		}
		const randomRecords = shuffledArray.slice(0, numberOfRecords);
		return randomRecords;
	} catch {
		return [];
	}
};

const startSession = async function (req, res) {
	try {
		let userId = req.user.id;
		// let sessionId = parseInt(req.params.sessionId);

		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(),
		});

		const { error, value } = schema.validate({ sessionId: parseInt(req.params.sessionId) });
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const { sessionId } = value;

		let session;

		[err, start_session] = await to(
			Session.update(
				{
					status: 'Live',
					SessionStartDate: moment().format(),
				},
				{
					where: {
						id: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, start_session] = await to(
			SessionUser.update(
				{
					SessionStatus: 'Live',
				},
				{
					where: {
						SessionId: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, session] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let workbook = JSON.parse(session.workbookData);

		let flag = false;
		for (let worksheet of workbook.Worksheets) {
			if (worksheet.trainerSurvey && !flag) {
				[err, start_session] = await to(
					Session.update(
						{
							trainerSurvey: true,
						},
						{
							where: {
								id: sessionId,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				flag = true;
			}
		}

		let randomData;
		if (workbook?.Worksheets?.length > 0) {
			let index = 0;
			for (let worksheet of workbook.Worksheets) {
				if (worksheet.trainerSurvey) {
					let worksheetPayload = {
						description: worksheet.description,
						chart: worksheet.chart,
						trainerInst: worksheet.trainerInst,
						flgFav: worksheet.flgFav,
						flgBookmark: worksheet.flgBookmark,
						flgImp: worksheet.flgImp,
						flgGroupActivty: worksheet.flgGroupActivty,
						type: worksheet.type,
						ClientId: null,
						isGraded: worksheet.isGraded,
						brief: worksheet.brief,
						publishResult: worksheet.publishResult,
						sessionFeedback: worksheet.sessionFeedback,
						sessionFeedBackMinCount: worksheet.sessionFeedBackMinCount,
						sessionFeedBackMaxCount: worksheet.sessionFeedBackMaxCount,
						anonymous: worksheet.anonymous,
						SessionId: sessionId,
						trainerSurvey: worksheet.trainerSurvey,
						trainerSurveyComp: worksheet.trainerSurveyComp,
						index: index,
						isAssessment: worksheet.isAssessment,
						certificateData: worksheet.certificateData,
						worksheetStatus: 'Not Started',
						WorksheetId: worksheet.id,
						videoComplition: worksheet.videoComplition,
						isShowScore: worksheet.isShowScore,
						timeToShowOption: worksheet.timeToShowOption,
						isPdf: worksheet.isPdf,
						isAttachFile: worksheet.isAttachFile,

						isQuizCompletion: worksheet.isQuizCompletion,
						maxReAttemptsAllowed: worksheet.maxReAttemptsAllowed,

						isGuideWorksheet: worksheet.isGuideWorksheet,
						GuideId: worksheet.GuideId,
					};
					[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
					if (err) return ResponseError(res, err, 500, true);

					index++;
					//Add Session Worksheet Asset
					if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
						let assetList = [];
						for (let asset of worksheet.DiwoAssets) {
							let payload = {
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								SessionWorksheetId: createSessionWorksheet.id,
								forBrief: asset.forBrief,
								isTranscoding: asset.isTranscoding,
								vmoVideoId: asset.vmoVideoId ? asset.vmoVideoId : null,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
							};
							assetList.push(payload);
						}
						[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
						if (err) return ResponseError(res, err, 500, true);
					}

					if (worksheet.type == 'Quiz (Randomised)') {
						const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
						randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
					} else {
						randomData = worksheet.Questions;
					}

					for (let question of randomData) {
						let questionPayload = {
							question: question.question,
							questionType: question.questionType,
							answerCount: question.answerCount,
							SessionWorksheetId: createSessionWorksheet.id,
							ClientId: null,
							allowFileTypes: question.allowFileTypes,
							fileSize: question.fileSize,
							numberOfFiles: question.numberOfFiles,
							isTextResponse: question.isTextResponse,
							isFileSubmission: question.isFileSubmission,
							uploadOnVimeo: question.uploadOnVimeo,
							multipleOption: question.multipleOption,
							surveyCharLimit: question.surveyCharLimit,
							queGroupIndex: question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null,
							queGroupName: question?.SurveyQueGroup?.group_name ? question.SurveyQueGroup.group_name : null,
							QuestionId: question.id,
							SurveyRatingType: question.SurveyRatingType,
							ratingMinLabel: question.ratingMinLabel,
							ratingMaxLabel: question.ratingMaxLabel,
							// userRatingArray : question.userRatingArray ? JSON.stringify(question.userRatingArray) : JSON.stringify([]),
							userRatingArray:
								typeof question.userRatingArray !== 'string'
									? Array.isArray(question.userRatingArray) &&
									  question.userRatingArray.length > 0 &&
									  question.userRatingArray[0] != null
										? question.userRatingArray.toString()
										: ''
									: question.userRatingArray, // in case it's already a string
						};

						[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
						if (err) return ResponseError(res, err, 500, true);

						//Add Session Question Asset

						//Add Session Worksheet Asset
						if (question.DiwoAssets && question.DiwoAssets.length > 0) {
							let assetList = [];
							for (let asset of question.DiwoAssets) {
								let payload = {
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									SessionQuestionId: createSessionQuestion.id,
									forBrief: asset.forBrief,
									isTranscoding: asset.isTranscoding,
									vmoVideoId: asset.vmoVideoId ? asset.vmoVideoId : null,
									cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
									MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								};
								assetList.push(payload);
							}
							[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
							if (err) return ResponseError(res, err, 500, true);
						}

						for (let option of question.Options) {
							let optionPayload = {
								text: option.text,
								correctAns: option.isCorrectAnswer,
								assetPath: option.assetPath,
								assetName: option.assetName,
								assetType: option.assetType,
								userAnswer: option.userAnswer,
								selectedAns: option.userSelectedAns,
								sr_no: option.sr_no,
								SessionQuestionId: createSessionQuestion.id,
								OptionId: option.id,
								SessionWorksheetId: createSessionWorksheet.id,
							};

							[err, createSessionOption] = await to(SessionOption.create(optionPayload));
							if (err) return ResponseError(res, err, 500, true);
						}
					}
				}
			}
		}

		// delete Pre-Assignment User Group link with Workbook
		[err, deleteLink] = await to(
			WorkbookUserGroupMapping.destroy({
				where: {
					WorkbookId: session.WorkbookId,
				},
			})
		);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				attributes: ['local_user_id', 'MarketId'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;

		// let query_1 = `SELECT  ARRAY (SELECT "UserId" FROM "SessionUsers"  WHERE "SessionId" = ${sessionId} AND "forTrainer" = false);`;
		// [ids] = await sequelize.query(query_1);

		// Use parameterized query to prevent SQL injection
		let query_1 = `SELECT ARRAY (SELECT "UserId" 
				FROM "SessionUsers"  
				WHERE "SessionId" = :sessionId 
				AND "forTrainer" = false);`;

		// Execute the query with a parameterized value for sessionId
		const ids = await sequelize.query(query_1, {
			replacements: { sessionId },
			type: sequelize.QueryTypes.SELECT,
		});

		let userIds = ids[0].array;
		let notifcationMessage = MESSAGE.SESSION_STARTED_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{session_name}}', session.title);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);

		// for Trainer-- Add Trianer Id in SeesionUser
		///////////////////////////////////////////
		// [err, updateUserId] = await to(SessionUser.update({
		//     UserId: userId,
		//     status: 'Approved'
		// }, {
		//     where: {
		//         UserId: null,
		//         SessionId: sessionId,
		//         WorkbookId: workbook.id,
		//         forTrainer: true
		//     }
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		// update SessionUserTable
		////////////////////////////////////////////////
		// if (workbook) {

		//     [err, updateSessionUser] = await to(SessionUser.update({
		//         title: workbook.title,
		//         descrip: workbook.descrip,
		//         allowWithoutPreAssign: workbook.allowWithoutPreAssign,
		//         allowNewLearner: workbook.allowNewLearner,
		//         newRegProvisional: workbook.newRegProvisional,
		//         // SessionStatus: 'Live',
		//         SessionId: sessionId,
		//         attendanceStatus: 'Present'
		//     }, {
		//         where: {
		//             WorkbookId: workbook.id,
		//             SessionStatus: 'Live',
		//             forTrainer: true,
		//         }
		//     }));
		//     if (err) return ResponseError(res, err, 500, true);

		//     //For Trainer
		//     [err, user] = await to(SessionUser.findOne({
		//         where: {
		//             SessionId: sessionId,
		//             WorkbookId: workbook.id,
		//             forTrainer: true
		//         }
		//     }));
		//     if (err) return ResponseError(res, err, 500, true);

		//     //For Trainer
		//     if (user) {
		//         let sessionUserId = user.id;
		//         if (workbook && workbook.Worksheets && workbook.Worksheets.length > 0) {

		//             for (let worksheet of workbook.Worksheets) {

		//                 let worksheetPayload = {
		//                     SessionUserId: sessionUserId,
		//                     description: worksheet.description,
		//                     chart: worksheet.chart,
		//                     trainerInst: worksheet.trainerInst,
		//                     flgFav: worksheet.flgFav,
		//                     flgBookmark: worksheet.flgBookmark,
		//                     flgImp: worksheet.flgImp,
		//                     flgGroupActivty: worksheet.flgGroupActivty,
		//                     type: worksheet.type,
		//                     ClientId: null,
		//                     isGraded: worksheet.isGraded,
		//                     brief: worksheet.brief
		//                 };

		//                 [err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
		//                 if (err) return ResponseError(res, err, 500, true);

		//                 //Add Session Worksheet Asset
		//                 if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
		//                     let assetList = [];
		//                     for (let asset of worksheet.DiwoAssets) {
		//                         let payload = {
		//                             path: asset.path,
		//                             fileName: asset.fileName,
		//                             type: asset.type,
		//                             SessionWorksheetId: createSessionWorksheet.id
		//                         }
		//                         assetList.push(payload);
		//                     }
		//                     [err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
		//                     if (err) return ResponseError(res, err, 500, true);
		//                 }

		//                 for (let question of worksheet.Questions) {
		//                     let questionPayload = {
		//                         question: question.question,
		//                         questionType: question.questionType,
		//                         answerCount: question.answerCount,
		//                         SessionWorksheetId: createSessionWorksheet.id,
		//                         ClientId: null,
		//                         allowFileTypes: question.allowFileTypes,
		//                         fileSize: question.fileSize,
		//                         numberOfFiles: question.numberOfFiles,
		//                         isTextResponse: question.isTextResponse,
		//                         isFileSubmission: question.isFileSubmission,
		//						   uploadOnVimeo: question.uploadOnVimeo,
		//                         multipleOption: question.multipleOption
		//                     };

		//                     [err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
		//                     if (err) return ResponseError(res, err, 500, true);

		//                     //Add Session Question Asset

		//                     //Add Session Worksheet Asset
		//                     if (question.DiwoAssets && question.DiwoAssets.length > 0) {

		//                         let assetList = [];
		//                         for (let asset of question.DiwoAssets) {
		//                             let payload = {
		//                                 path: asset.path,
		//                                 fileName: asset.fileName,
		//                                 type: asset.type,
		//                                 SessionQuestionId: createSessionQuestion.id,
		//                             }
		//                             assetList.push(payload);
		//                         }
		//                         [err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
		//                         if (err) return ResponseError(res, err, 500, true);

		//                     }

		//                     for (let option of question.Options) {
		//                         let optionPayload = {
		//                             text: option.text,
		//                             correctAns: option.isCorrectAnswer,
		//                             assetPath: option.assetPath,
		//                             assetName: option.assetName,
		//                             assetType: option.assetType,
		//                             userAnswer: option.userAnswer,
		//                             selectedAns: option.userSelectedAns,
		//                             sr_no: option.sr_no,
		//                             SessionQuestionId: createSessionQuestion.id
		//                         };

		//                         [err, createSessionOption] = await to(SessionOption.create(optionPayload));
		//                         if (err) return ResponseError(res, err, 500, true);

		//                     }
		//                 }

		//             }
		//         }

		//     }

		//     //For Notification
		//     let query_1 = `SELECT  ARRAY (SELECT "UserId" FROM "SessionUsers"  WHERE "SessionId" = ${sessionId} AND "forTrainer" = false AND "attendanceStatus" = 'Present');`;
		//     [ids] = await sequelize.query(query_1);
		//     let userIds = ids[0].array;
		//     let notifcationMessage = `${session.title} ${MESSAGE.SESSION_STARTED_NOTIFICATION}`;
		//     await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);

		// }

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Start Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: sessionId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.SESSION_START,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.startSession = startSession;

const getAllSessionByClientIdAndUserId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let userId = req.user.id;
		let RoleId = req.user.RoleId;
		// let clientId = req.params.clientId;
		let allSubClientIds = await getAllSubChildClientIds(parseInt(clientId));
		allSubClientIds.push(parseInt(clientId));
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let sessionList;

		const whereCondition = {
			[Op.or]: [
				{
					DiwoModuleId: 1,
				},
				{
					DiwoModuleId: { [Op.ne]: 1 },
					status: {
						[Op.in]: ['Live', 'Closed'],
					},
				},
			],
			ClientId: allSubClientIds,
		};

		const whereConditionTrainer = {
			[Op.or]: [
				{
					DiwoModuleId: 1,
				},
				{
					DiwoModuleId: { [Op.ne]: 1 },
					status: {
						[Op.in]: ['Live', 'Closed'],
					},
				},
			],
			UserId: userId,
		};

		//check for trainer login or other
		if (RoleId == 11) {
			[err, sessionList] = await to(
				Session.findAndCountAll({
					distinct: true,
					where: whereConditionTrainer,
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
							required: false,
						},
						{
							model: SessionUser,
							attributes: ['id'],
							where: {
								forTrainer: false,
							},
							required: false,
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					attributes: [
						'id',
						'title',
						'location',
						'dateWithTime',
						'status',
						'UserId',
						'ClientId',
						'WorkbookId',
						'createdAt',
						'updatedAt',
						'DiwoModuleId',
						'DiwoModuleAssignId',
					],
					order: [['createdAt', 'DESC']],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else {
			[err, sessionList] = await to(
				Session.findAndCountAll({
					distinct: true,
					where: whereCondition,
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
							where: {
								forTrainer: false,
							},
							required: false,
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					attributes: [
						'id',
						'title',
						'location',
						'dateWithTime',
						'status',
						'UserId',
						'ClientId',
						'WorkbookId',
						'createdAt',
						'updatedAt',
						'DiwoAssignmentId',
						'DiwoModuleId',
						'DiwoModuleAssignId',
					],
					order: [['createdAt', 'DESC']],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let list = [];
		if (sessionList && sessionList.rows && sessionList.rows.length > 0) {
			for (let session of sessionList.rows) {
				let session_ = session.convertToJSON();
				let payload = {
					id: session_.id,
					title: session_.title,
					location: session_.location,
					dateWithTime: session_.dateWithTime,
					status: session_.status,
					UserId: session_.UserId,
					sessionType: null,
					DiwoAssignmentId: session_.DiwoAssignmentId,
				};

				if (session.User) {
					[err, localUser] = await to(
						dbInstance[session.User.Market.db_name].User_master.findOne({
							where: {
								id: session.User.local_user_id,
							},
							attributes: ['first', 'email', 'last', 'phone'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (localUser) {
						payload.facilitator = localUser.first + ' ' + localUser.last;
					}
				}

				let courseList = [];

				if (
					session_ &&
					session_.DiwoModuleAssign &&
					session_.DiwoModuleAssign.Course &&
					session_.DiwoModuleAssign.Course.title
				) {
					// for (let course of session_.DiwoModuleAssign.Courses) {
					// 	courseList.push(course.title);
					// }
					payload.courseName = session_.DiwoModuleAssign.Course.title;
				}

				if (session_.SessionUsers && session_.SessionUsers.length > 0) {
					payload.count = session_.SessionUsers.length;
				} else {
					payload.count = 0;
				}

				if (session_ && session_.DiwoModule) {
					payload.sessionType = session_.DiwoModule?.type;
				}

				list.push(payload);
			}
		}
		return ResponseSuccess(res, {
			data: list,
			count: sessionList.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSessionByClientIdAndUserId = getAllSessionByClientIdAndUserId;

const getAllSubChildClientIds = async function (clientId) {
	try {
		let err, ClientsDetail;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClientIds = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					include: [
						{
							model: Client_job_role,
						},
					],
				})
			);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				if (client.DiwoAccess) {
					finalArrayOfClientIds.push(client.id);
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		return finalArrayOfClientIds;
	} catch (error) {
		return [];
	}
};

const deleteSession = async function (req, res) {
	try {
		// let sessionIds = req.body;
		const schema = Joi.object({
			sessionIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			sessionIds: req.body,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { sessionIds } = value;

		[err, delete_session] = await to(
			Session.update(
				{
					status: 'Deleted',
				},
				{
					where: {
						id: sessionIds,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, delete_session_user] = await to(
			SessionUser.update(
				{
					SessionStatus: 'Deleted',
				},
				{
					where: {
						SessionId: sessionIds,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: sessionIds,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.SESSION_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteSession = deleteSession;

const closeSession = async function (req, res) {
	try {
		// let sessionId = parseInt(req.params.sessionId);

		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(), // Ensures sessionId is an integer and required
			trainerNote: Joi.string().trim().allow(null).allow(''),
		});

		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
			trainerNote: req.body.trainerNote,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const { sessionId, trainerNote } = value;

		let userId = req.user.id;
		[err, sessionTitle] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				attributes: ['id', 'title', 'code'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let url = CONFIG.web_host;
		if (url.charAt(url.length - 1) !== '/') url = url + '/';
		[err, closed_session] = await to(
			Session.update(
				{
					status: 'Closed',
					ClosedBy: userId,
					trainerNote: trainerNote,
					SessionEndDate: moment().format(),
					adminLink: url + '#/session-details/' + sessionTitle.code,
					password: Math.random().toString(36).slice(7),
				},
				{
					where: {
						id: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		if (sessionTitle) {
			let notifcationMessage_1 = MESSAGE.SESSION_CLOSED_NOTIFICATION;
			notifcationMessage_1 = notifcationMessage_1.replace('{{session_name}}', sessionTitle.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [userId]);

			// let query_1 = `SELECT  ARRAY (SELECT "UserId" FROM "SessionUsers"  WHERE "SessionId" = ${sessionId} AND "forTrainer" = false AND "attendanceStatus" = 'Present');`;
			// [ids] = await sequelize.query(query_1);

			let query_1 = `SELECT ARRAY (SELECT "UserId" 
						FROM "SessionUsers"  
						WHERE "SessionId" = :sessionId 
						AND "forTrainer" = false 
						AND "attendanceStatus" = 'Present');`;

			// Execute the query with a parameterized value for sessionId
			const ids = await sequelize.query(query_1, {
				replacements: { sessionId },
				type: sequelize.QueryTypes.SELECT,
			});

			let userIds = ids[0].array;
			let notifcationMessage_2 = `${sessionTitle.title} ${MESSAGE.SESSION__NOTIFICATION}`;
			notifcationMessage_2 = notifcationMessage_2.replace('{{session_name}}', sessionTitle.title);
			await createNotificationforDiwo(notifcationMessage_2, ['Bell'], userIds);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Closed Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: sessionId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.SESSION_CLOSED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.closeSession = closeSession;

const endSession = async function (req, res) {
	try {
		// let sessionId = parseInt(req.params.sessionId);

		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(),
			trainerNote: Joi.string().trim().allow(null).allow(''),
			status: Joi.string().valid('Ended').required(),
		});

		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
			trainerNote: req.body.trainerNote,
			status: req.body.status,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const { sessionId, trainerNote, status } = value;

		// let status = req.body.status;
		let userId = req.user.id;
		// let trainerNote = req.body.trainerNote;

		[err, sessionTitle] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				attributes: ['id', 'title', 'code'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, end_session] = await to(
			Session.update(
				{ status: status, trainerNote: trainerNote },
				{
					where: {
						id: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		if (sessionTitle) {
			let notifcationMessage_1 = MESSAGE.SESSION_ENDED_NOTIFICATION;
			notifcationMessage_1 = notifcationMessage_1.replace('{{session_name}}', sessionTitle.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [userId]);

			// let query_1 = `SELECT  ARRAY (SELECT "UserId" FROM "SessionUsers"  WHERE "SessionId" = ${sessionId} AND "forTrainer" = false AND "attendanceStatus" = 'Present');`;
			// [ids] = await sequelize.query(query_1);

			// Use parameterized query to prevent SQL injection
			let query_1 = `SELECT ARRAY (SELECT "UserId" 
										FROM "SessionUsers"  
										WHERE "SessionId" = :sessionId 
										AND "forTrainer" = false 
										AND "attendanceStatus" = 'Present');`;

			// Execute the query with a parameterized value for sessionId
			const ids = await sequelize.query(query_1, {
				replacements: { sessionId },
				type: sequelize.QueryTypes.SELECT,
			});

			let userIds = ids[0].array;
			let notifcationMessage_2 = `${sessionTitle.title} ${MESSAGE.SESSION__NOTIFICATION}`;
			notifcationMessage_2 = notifcationMessage_2.replace('{{session_name}}', sessionTitle.title);
			await createNotificationforDiwo(notifcationMessage_2, ['Bell'], userIds);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Ended Session`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					SessionId: sessionId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.SESSION_ENDED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.endSession = endSession;

const checkandUpdateModulePassingStatusOfLearner = async function (req, res) {
	try {
		const schema = Joi.object({
			SessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			SessionId: parseInt(req.params.sessionId),
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { SessionId } = value;

		// let SessionId = req.params.sessionId;
		let ClientId = req.user.ClientId;
		let err;
		let sessionDetails, getSessionWorksheetData;
		let passingSessionWorksheetIds = [];
		let getUserData = [];
		let addEntrys = [];

		//Get Session Data By Using Session Id
		[err, sessionDetails] = await to(
			Session.findOne({
				where: {
					id: SessionId,
				},
				attributes: [
					'id',
					'title',
					'status',
					'workbookData',
					'isAssignmentCertification',
					'DiwoAssignmentId',
					'DiwoModuleId',
				],
				include: [
					{
						model: SessionUser,
						attributes: ['id'],
					},
					{
						model: DiwoAssignment,
						attributes: ['id'],
						include: [
							{
								model: Pathway,
								attributes: ['id', 'title'],
							},
							{
								model: Course,
								attributes: ['id', 'title'],
							},
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let workbook = JSON.parse(sessionDetails.workbookData);

		let Notification = null;
		if (
			sessionDetails &&
			sessionDetails.DiwoAssignment &&
			sessionDetails.DiwoAssignment.Pathway &&
			sessionDetails.DiwoAssignment.Pathway != null
		) {
			let title = sessionDetails.DiwoAssignment.Pathway.title;
			Notification = `Well done! You have completed the certification module in ${title}. Check your profile to view your certificate or badge.`;
		} else if (
			sessionDetails &&
			sessionDetails.DiwoAssignment &&
			sessionDetails.DiwoAssignment.Course &&
			sessionDetails.DiwoAssignment.Course != null
		) {
			let title = sessionDetails.DiwoAssignment.Course.title;
			Notification = `Well done! You have completed the certification module in ${title}. Check your profile to view your certificate or badge.`;
		} else {
			Notification = `Well done! You have completed the certification in ${workbook.title}. Check your profile to view your certificate or badge.`;
		}

		//Get All Certification SessionWorksheets Data
		//Check Passing Marks And Update it

		//For Quiz and Quiz (Randomised)
		[err, getSessionWorksheetData] = await to(
			SessionWorksheet.findAll({
				where: {
					SessionId: SessionId,
					isAssessment: true,
					submit: true,
					type: ['Quiz', 'Quiz (Randomised)'],
					isLearnerPassed: false,
				},
				attributes: ['id', 'score', 'certificateData'],
				include: [
					{
						model: SessionUser,
						where: {
							LearnerAchievementId: {
								[Op.eq]: null,
							},
						},
						attributes: ['id'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getSessionWorksheetData.length > 0) {
			for (let data of getSessionWorksheetData) {
				if (data?.certificateData?.passingMarks >= 0 && data.score != null) {
					if (data.certificateData.passingMarks <= data.score) {
						passingSessionWorksheetIds.push(data.id);
					}
				}
			}
		}

		//For Offline Task
		[err, getSessionWorksheetData_] = await to(
			SessionWorksheet.findAll({
				where: {
					SessionId: SessionId,
					isAssessment: true,
					submit: true,
					type: ['Offline Task'],
					isLearnerPassed: false,
				},
				attributes: ['id', 'score', 'certificateData'],
				include: [
					{
						model: SessionQuestionSubmission,
						attributes: ['id', 'grade'],
					},
					{
						model: SessionQuestion,
						attributes: ['id', 'isTextResponse', 'grade'],
						// where: {
						// 	isTextResponse: true,
						// },
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getSessionWorksheetData_.length > 0) {
			for (let data of getSessionWorksheetData_) {
				let total = 0;
				if (data.score) {
					total = data.score;
				}
				if (data?.certificateData?.passingMarks >= 0) {
					if (data?.SessionQuestionSubmissions.length > 0) {
						for (let grade of data.SessionQuestionSubmissions) {
							if (grade?.grade && parseInt(grade.grade) >= 0) {
								total = total + parseInt(grade.grade);
							}
						}
					}
					if (data?.SessionQuestions.length > 0) {
						for (let grade of data.SessionQuestions) {
							if (grade?.grade && parseInt(grade.grade) >= 0) {
								total = total + parseInt(grade.grade);
							}
						}
					}
					if (data.certificateData.passingMarks <= total) {
						passingSessionWorksheetIds.push(data.id);
					}
				}
				console.log('-----total------', total);
			}
		}

		//Update Passing Flag into SessionWorksheet
		if (passingSessionWorksheetIds.length > 0) {
			[eer, updatePassingFlag] = await to(
				SessionWorksheet.update(
					{
						isLearnerPassed: true,
					},
					{
						where: {
							id: passingSessionWorksheetIds,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		//Also need to Check And Update Workbook level Passing (Certifications)
		//For Or ing
		// let query_for_or = `UPDATE "SessionUsers"
		// 		SET "eligibleForCertification" = true ,
		// 		"ModuleStatus" = 'Certified'
		// 		WHERE condition = 'OR' AND
		// 		"SessionId" = ${SessionId}
		// 		AND "haveCertificate" = true
		// 		AND "eligibleForCertification" = false
		// 		AND "LearnerAchievementId" IS NULL
		// 		AND EXISTS (
		// 			SELECT 1
		// 			FROM "SessionWorksheets" sw
		// 			WHERE sw."SessionUserId" = "SessionUsers".id
		// 			AND sw."isLearnerPassed" = true
		// 			AND sw."isAssessment" = true
		// 		);`;

		// //For AND ing
		// let query_for_and = `UPDATE "SessionUsers"
		// 			SET "eligibleForCertification" = true ,
		// 			"ModuleStatus" = 'Certified'
		// 			WHERE condition = 'AND' AND
		// 			"SessionId" = ${SessionId}
		// 			AND "haveCertificate" = true
		// 			AND "eligibleForCertification" = false
		// 			AND "LearnerAchievementId" IS NULL
		// 			AND NOT EXISTS (
		// 				SELECT 1
		// 				FROM "SessionWorksheets" sw
		// 				WHERE sw."SessionUserId" = "SessionUsers".id
		// 				AND sw."isLearnerPassed" = false
		// 				AND sw."isAssessment" = true
		// 			);`;

		// [forOring] = await sequelize.query(query_for_or);
		// [forAnding] = await sequelize.query(query_for_and);

		// Query for OR condition
		let query_for_or = `UPDATE "SessionUsers"
		SET "eligibleForCertification" = true,
			"ModuleStatus" = 'Certified'
		WHERE condition = 'OR'
			AND "SessionId" = :SessionId
			AND "haveCertificate" = true
			AND "eligibleForCertification" = false
			AND "LearnerAchievementId" IS NULL
			AND EXISTS (
				SELECT 1
				FROM "SessionWorksheets" sw
				WHERE sw."SessionUserId" = "SessionUsers".id
				AND sw."isLearnerPassed" = true
				AND sw."isAssessment" = true
			);`;

		// Query for AND condition
		let query_for_and = `UPDATE "SessionUsers"
		SET "eligibleForCertification" = true,
			"ModuleStatus" = 'Certified'
		WHERE condition = 'AND'
			AND "SessionId" = :SessionId
			AND "haveCertificate" = true
			AND "eligibleForCertification" = false
			AND "LearnerAchievementId" IS NULL
			AND NOT EXISTS (
				SELECT 1
				FROM "SessionWorksheets" sw
				WHERE sw."SessionUserId" = "SessionUsers".id
				AND sw."isLearnerPassed" = false
				AND sw."isAssessment" = true
			);`;

		// Execute the queries with parameterized value for sessionId
		forOring = await sequelize.query(query_for_or, {
			replacements: { SessionId },
			type: sequelize.QueryTypes.UPDATE,
		});

		forAnding = await sequelize.query(query_for_and, {
			replacements: { SessionId },
			type: sequelize.QueryTypes.UPDATE,
		});

		// Also Need to Check And Assign Certification As per Assignment (PathWay Assingnment, Course Assingment and Module Assignment, Als Pre-Assignment)

		//Get UserId From SessionUser which user have eligibleForCertification
		[err, getUserData] = await to(
			SessionUser.findAll({
				where: {
					SessionId: SessionId,
					eligibleForCertification: true,
					LearnerAchievementId: {
						[Op.eq]: null,
					},
				},
				attributes: [
					'id',
					'UserId',
					'SessionId',
					'BadgeId',
					'CertificateLine1',
					'CertificateLine2',
					'CertificateLine3',
					'WorkbookId',
					'isAppliedBadge',
					'isAppliedCertificate',

					'isAddSignature',

					'signatureName1',
					'signatureDesignation1',
					'signaturePath1',
					'signaturePathName1',

					'signatureName2',
					'signatureDesignation2',
					'signaturePath2',
					'signaturePathName2',
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (getUserData?.length > 0) {
			let UserIds = [];
			let assignmentCertification = [];

			for (let data of getUserData) {
				UserIds.push(data.UserId);
				let payload = {
					SessionId: SessionId,
					UserId: data.UserId,
					ClientId: ClientId,
					SessionUserId: data.id,
					WorkbookId: data.WorkbookId,
					DiwoAssignmentId: sessionDetails.DiwoAssignmentId,
					data: {
						CertificateLine1: data.CertificateLine1,
						CertificateLine2: data.CertificateLine2,
						CertificateLine3: data.CertificateLine3,

						isAddSignature: data.isAddSignature,

						signatureName1: data.signatureName1,
						signatureDesignation1: data.signatureDesignation1,
						signaturePath1: data.signaturePath1,
						signaturePathName1: data.signaturePathName1,

						signatureName2: data.signatureName2,
						signatureDesignation2: data.signatureDesignation2,
						signaturePath2: data.signaturePath2,
						signaturePathName2: data.signaturePathName2,
					},
					BadgeId: data.BadgeId,
					isAssignmentCertification: sessionDetails.isAssignmentCertification,
					isBadge: data.isAppliedBadge,
					isCertificate: data.isAppliedCertificate,
				};
				assignmentCertification.push(payload);
			}

			//update eligibleForCertification flag in the LeanerAssignment
			if (sessionDetails.isAssignmentCertification) {
				[err, updateCertificationData] = await to(
					LearnerAssignment.update(
						{ eligibleForCertification: true },
						{
							where: {
								DiwoAssignmentId: sessionDetails.DiwoAssignmentId,
								UserId: UserIds,
							},
						}
					)
				);
			}
			if (err) return ResponseError(res, err, 500, true);

			//Add Assingment Certification Entry into the LearnerAchievement Table

			[err, addEntrys] = await to(LearnerAchievement.bulkCreate(assignmentCertification, { returning: true }));
			if (err) {
				console.log('------err- error When add entry of Learner Achievement--', err);
			}

			createDiwoCertificate(addEntrys, Notification);

			// for (let entry of addEntrys) {
			// 	[err, updateEntry] = await to(
			// 		SessionUser.update(
			// 			{ LearnerAchievementId: entry.id },
			// 			{
			// 				where: {
			// 					id: entry.SessionUserId,
			// 				},
			// 			}
			// 		)
			// 	);
			// 	if (err) return ResponseError(res, err, 500, true);

			// 	//Add Nofitication With LearnerAchievement Id
			// 	let notifcationMessage = Notification;
			// 	// 'Congratulations on successfully completing the module! Your hard work and dedication have paid off.';
			// 	await createNotificationforDiwo(notifcationMessage, ['Bell'], [entry.UserId], entry.id);
			// }

			//Call Update Course And Pathway Status
			if (sessionDetails?.SessionUsers) {
				for (let data of sessionDetails.SessionUsers) {
					// console.log('-------In checkandUpdateModulePassingStatusOfLearner----data-------------', data.id);
					await updateCourseAndPathwayStatus(data.id);
				}
			}

			// If we need to add this certification into the Learner Notification
			//then Need to Get data from above bluck Query and Add into the New Notification
		}

		return ResponseSuccess(res, {
			message: 'Done',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkandUpdateModulePassingStatusOfLearner = checkandUpdateModulePassingStatusOfLearner;

// const checkandUpdateModulePassingStatusOfOnlyQuizLearner = async function (SessionId, ClientId, SessionUserId) {
// 	try {
// 		let err;
// 		let sessionDetails, getSessionWorksheetData;
// 		let passingSessionWorksheetIds = [];
// 		let getUserData = [];
// 		let addEntrys = [];

// 		//Get Session Data By Using Session Id
// 		[err, sessionDetails] = await to(
// 			Session.findOne({
// 				where: {
// 					id: SessionId,
// 				},
// 				attributes: [
// 					'id',
// 					'title',
// 					'status',
// 					'workbookData',
// 					'isAssignmentCertification',
// 					'DiwoAssignmentId',
// 					'DiwoModuleId',
// 				],
// 				include: [
// 					{
// 						model: SessionUser,
// 						attributes: ['id'],
// 						where: {
// 							id: SessionUserId,
// 						},
// 					},
// 					{
// 						model: DiwoAssignment,
// 						attributes: ['id'],
// 						include: [
// 							{
// 								model: Pathway,
// 								attributes: ['id', 'title'],
// 							},
// 							{
// 								model: Course,
// 								attributes: ['id', 'title'],
// 							},
// 						],
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			console.log('-------ERROR---1----', err);
// 		}
// 		// if (err) return ResponseError(res, err, 500, true);

// 		let workbook = JSON.parse(sessionDetails.workbookData);

// 		//Check Have Offline Task is Present or Not
// 		if (workbook?.Worksheets?.length > 0) {
// 			for (let WS of workbook.Worksheets) {
// 				if (WS.type == 'Offline Task') {
// 					return;
// 				}
// 			}
// 		}

// 		let Notification = null;
// 		if (
// 			sessionDetails &&
// 			sessionDetails.DiwoAssignment &&
// 			sessionDetails.DiwoAssignment.Pathway &&
// 			sessionDetails.DiwoAssignment.Pathway != null
// 		) {
// 			let title = sessionDetails.DiwoAssignment.Pathway.title;
// 			Notification = `Well done! You have completed the certification module in ${title}. Check your profile to view your certificate or badge.`;
// 		} else if (
// 			sessionDetails &&
// 			sessionDetails.DiwoAssignment &&
// 			sessionDetails.DiwoAssignment.Course &&
// 			sessionDetails.DiwoAssignment.Course != null
// 		) {
// 			let title = sessionDetails.DiwoAssignment.Course.title;
// 			Notification = `Well done! You have completed the certification module in ${title}. Check your profile to view your certificate or badge.`;
// 		} else {
// 			Notification = `Well done! You have completed the certification in ${workbook.title}. Check your profile to view your certificate or badge.`;
// 		}

// 		//Get All Certification SessionWorksheets Data
// 		//Check Passing Marks And Update it

// 		//For Quiz and Quiz (Randomised)
// 		[err, getSessionWorksheetData] = await to(
// 			SessionWorksheet.findAll({
// 				where: {
// 					SessionId: SessionId,
// 					isAssessment: true,
// 					submit: true,
// 					type: ['Quiz', 'Quiz (Randomised)'],
// 					isLearnerPassed: false,
// 				},
// 				attributes: ['id', 'score', 'certificateData'],
// 				include: [
// 					{
// 						model: SessionUser,
// 						where: {
// 							LearnerAchievementId: {
// 								[Op.eq]: null,
// 							},
// 						},
// 						attributes: ['id'],
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			console.log('-------ERROR---2----', err);
// 		}
// 		// if (err) return ResponseError(res, err, 500, true);

// 		if (getSessionWorksheetData.length > 0) {
// 			for (let data of getSessionWorksheetData) {
// 				if (data?.certificateData?.passingMarks >= 0 && data.score != null) {
// 					if (data.certificateData.passingMarks <= data.score) {
// 						passingSessionWorksheetIds.push(data.id);
// 					}
// 				}
// 			}
// 		}

// 		//For Offline Task
// 		[err, getSessionWorksheetData_] = await to(
// 			SessionWorksheet.findAll({
// 				where: {
// 					SessionId: SessionId,
// 					isAssessment: true,
// 					submit: true,
// 					type: ['Offline Task'],
// 					isLearnerPassed: false,
// 				},
// 				attributes: ['id', 'score', 'certificateData'],
// 				include: [
// 					{
// 						model: SessionQuestionSubmission,
// 						attributes: ['id', 'grade'],
// 					},
// 					{
// 						model: SessionQuestion,
// 						attributes: ['id', 'isTextResponse', 'grade'],
// 						// where: {
// 						// 	isTextResponse: true,
// 						// },
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			console.log('-------ERROR---3----', err);
// 		}
// 		// if (err) return ResponseError(res, err, 500, true);

// 		if (getSessionWorksheetData_.length > 0) {
// 			for (let data of getSessionWorksheetData_) {
// 				let total = 0;
// 				if (data.score) {
// 					total = data.score;
// 				}
// 				if (data?.certificateData?.passingMarks >= 0) {
// 					if (data?.SessionQuestionSubmissions.length > 0) {
// 						for (let grade of data.SessionQuestionSubmissions) {
// 							if (grade?.grade && parseInt(grade.grade) >= 0) {
// 								total = total + parseInt(grade.grade);
// 							}
// 						}
// 					}
// 					if (data?.SessionQuestions.length > 0) {
// 						for (let grade of data.SessionQuestions) {
// 							if (grade?.grade && parseInt(grade.grade) >= 0) {
// 								total = total + parseInt(grade.grade);
// 							}
// 						}
// 					}
// 					if (data.certificateData.passingMarks <= total) {
// 						passingSessionWorksheetIds.push(data.id);
// 					}
// 				}
// 				console.log('-----total------', total);
// 			}
// 		}

// 		//Update Passing Flag into SessionWorksheet
// 		if (passingSessionWorksheetIds.length > 0) {
// 			[eer, updatePassingFlag] = await to(
// 				SessionWorksheet.update(
// 					{
// 						isLearnerPassed: true,
// 					},
// 					{
// 						where: {
// 							id: passingSessionWorksheetIds,
// 						},
// 					}
// 				)
// 			);
// 			if (err) {
// 				console.log('-------ERROR---4----', err);
// 			}
// 			// if (err) return ResponseError(res, err, 500, true);
// 		}

// 		//Also need to Check And Update Workbook level Passing (Certifications)
// 		//For Or ing
// 		// let query_for_or = `UPDATE "SessionUsers"
// 		// 		SET "eligibleForCertification" = true ,
// 		// 		"ModuleStatus" = 'Certified'
// 		// 		WHERE condition = 'OR' AND
// 		// 		"SessionId" = ${SessionId}
// 		// 		AND "haveCertificate" = true
// 		// 		AND "eligibleForCertification" = false
// 		// 		AND "LearnerAchievementId" IS NULL
// 		// 		AND EXISTS (
// 		// 			SELECT 1
// 		// 			FROM "SessionWorksheets" sw
// 		// 			WHERE sw."SessionUserId" = "SessionUsers".id
// 		// 			AND sw."isLearnerPassed" = true
// 		// 			AND sw."isAssessment" = true
// 		// 		);`;

// 		// //For AND ing
// 		// let query_for_and = `UPDATE "SessionUsers"
// 		// 			SET "eligibleForCertification" = true ,
// 		// 			"ModuleStatus" = 'Certified'
// 		// 			WHERE condition = 'AND' AND
// 		// 			"SessionId" = ${SessionId}
// 		// 			AND "haveCertificate" = true
// 		// 			AND "eligibleForCertification" = false
// 		// 			AND "LearnerAchievementId" IS NULL
// 		// 			AND NOT EXISTS (
// 		// 				SELECT 1
// 		// 				FROM "SessionWorksheets" sw
// 		// 				WHERE sw."SessionUserId" = "SessionUsers".id
// 		// 				AND sw."isLearnerPassed" = false
// 		// 				AND sw."isAssessment" = true
// 		// 			);`;

// 		// [forOring] = await sequelize.query(query_for_or);
// 		// [forAnding] = await sequelize.query(query_for_and);

// 		// Query for OR condition
// 		let query_for_or = `UPDATE "SessionUsers"
// 		SET "eligibleForCertification" = true,
// 			"ModuleStatus" = 'Certified'
// 		WHERE condition = 'OR'
// 			AND "SessionId" = :SessionId
// 			AND "haveCertificate" = true
// 			AND "eligibleForCertification" = false
// 			AND "LearnerAchievementId" IS NULL
// 			AND EXISTS (
// 				SELECT 1
// 				FROM "SessionWorksheets" sw
// 				WHERE sw."SessionUserId" = "SessionUsers".id
// 				AND sw."isLearnerPassed" = true
// 				AND sw."isAssessment" = true
// 			);`;

// 		// Query for AND condition
// 		let query_for_and = `UPDATE "SessionUsers"
// 		SET "eligibleForCertification" = true,
// 			"ModuleStatus" = 'Certified'
// 		WHERE condition = 'AND'
// 			AND "SessionId" = :SessionId
// 			AND "haveCertificate" = true
// 			AND "eligibleForCertification" = false
// 			AND "LearnerAchievementId" IS NULL
// 			AND NOT EXISTS (
// 				SELECT 1
// 				FROM "SessionWorksheets" sw
// 				WHERE sw."SessionUserId" = "SessionUsers".id
// 				AND sw."isLearnerPassed" = false
// 				AND sw."isAssessment" = true
// 			);`;

// 		// Execute the queries with parameterized value for sessionId
// 		forOring = await sequelize.query(query_for_or, {
// 			replacements: { SessionId },
// 			type: sequelize.QueryTypes.UPDATE,
// 		});

// 		forAnding = await sequelize.query(query_for_and, {
// 			replacements: { SessionId },
// 			type: sequelize.QueryTypes.UPDATE,
// 		});

// 		// Also Need to Check And Assign Certification As per Assignment (PathWay Assingnment, Course Assingment and Module Assignment, Als Pre-Assignment)

// 		//Get UserId From SessionUser which user have eligibleForCertification
// 		[err, getUserData] = await to(
// 			SessionUser.findAll({
// 				where: {
// 					SessionId: SessionId,
// 					eligibleForCertification: true,
// 					LearnerAchievementId: {
// 						[Op.eq]: null,
// 					},
// 				},
// 				attributes: [
// 					'id',
// 					'UserId',
// 					'SessionId',
// 					'BadgeId',
// 					'CertificateLine1',
// 					'CertificateLine2',
// 					'CertificateLine3',
// 					'WorkbookId',
// 					'isAppliedBadge',
// 					'isAppliedCertificate',

// 					'isAddSignature',

// 					'signatureName1',
// 					'signatureDesignation1',
// 					'signaturePath1',
// 					'signaturePathName1',

// 					'signatureName2',
// 					'signatureDesignation2',
// 					'signaturePath2',
// 					'signaturePathName2',
// 				],
// 			})
// 		);
// 		if (err) {
// 			console.log('-------ERROR---5----', err);
// 		}
// 		// if (err) return ResponseError(res, err, 500, true);

// 		if (getUserData?.length > 0) {
// 			let UserIds = [];
// 			let assignmentCertification = [];

// 			for (let data of getUserData) {
// 				UserIds.push(data.UserId);
// 				let payload = {
// 					SessionId: SessionId,
// 					UserId: data.UserId,
// 					ClientId: ClientId,
// 					SessionUserId: data.id,
// 					WorkbookId: data.WorkbookId,
// 					DiwoAssignmentId: sessionDetails.DiwoAssignmentId,
// 					data: {
// 						CertificateLine1: data.CertificateLine1,
// 						CertificateLine2: data.CertificateLine2,
// 						CertificateLine3: data.CertificateLine3,

// 						isAddSignature: data.isAddSignature,

// 						signatureName1: data.signatureName1,
// 						signatureDesignation1: data.signatureDesignation1,
// 						signaturePath1: data.signaturePath1,
// 						signaturePathName1: data.signaturePathName1,

// 						signatureName2: data.signatureName2,
// 						signatureDesignation2: data.signatureDesignation2,
// 						signaturePath2: data.signaturePath2,
// 						signaturePathName2: data.signaturePathName2,
// 					},
// 					BadgeId: data.BadgeId,
// 					isAssignmentCertification: sessionDetails.isAssignmentCertification,
// 					isBadge: data.isAppliedBadge,
// 					isCertificate: data.isAppliedCertificate,
// 				};
// 				assignmentCertification.push(payload);
// 			}

// 			//update eligibleForCertification flag in the LeanerAssignment
// 			if (sessionDetails.isAssignmentCertification) {
// 				[err, updateCertificationData] = await to(
// 					LearnerAssignment.update(
// 						{ eligibleForCertification: true },
// 						{
// 							where: {
// 								DiwoAssignmentId: sessionDetails.DiwoAssignmentId,
// 								UserId: UserIds,
// 							},
// 						}
// 					)
// 				);
// 			}
// 			// if (err) return ResponseError(res, err, 500, true);

// 			//Add Assingment Certification Entry into the LearnerAchievement Table

// 			[err, addEntrys] = await to(LearnerAchievement.bulkCreate(assignmentCertification, { returning: true }));
// 			if (err) {
// 				console.log('------err- error When add entry of Learner Achievement--', err);
// 			}

// 			createDiwoCertificate(addEntrys, Notification);

// 			// for (let entry of addEntrys) {
// 			// 	[err, updateEntry] = await to(
// 			// 		SessionUser.update(
// 			// 			{ LearnerAchievementId: entry.id },
// 			// 			{
// 			// 				where: {
// 			// 					id: entry.SessionUserId,
// 			// 				},
// 			// 			}
// 			// 		)
// 			// 	);
// 			// 	if (err) return ResponseError(res, err, 500, true);

// 			// 	//Add Nofitication With LearnerAchievement Id
// 			// 	let notifcationMessage = Notification;
// 			// 	// 'Congratulations on successfully completing the module! Your hard work and dedication have paid off.';
// 			// 	await createNotificationforDiwo(notifcationMessage, ['Bell'], [entry.UserId], entry.id);
// 			// }

// 			//Call Update Course And Pathway Status
// 			if (sessionDetails?.SessionUsers) {
// 				for (let data of sessionDetails.SessionUsers) {
// 					// console.log('-------In checkandUpdateModulePassingStatusOfLearner----data-------------', data.id);
// 					await updateCourseAndPathwayStatus(data.id);
// 				}
// 			}

// 			// If we need to add this certification into the Learner Notification
// 			//then Need to Get data from above bluck Query and Add into the New Notification
// 		}

// 		return;
// 		// return ResponseSuccess(res, {
// 		// 	message: 'Done',
// 		// });
// 	} catch (error) {
// 		// return ResponseError(res, error, 500, true);
// 		if (err) {
// 			console.log('----Error---checkandUpdateModulePassingStatusOfOnlyQuizLearner------', error);
// 		}
// 	}
// };
// module.exports.checkandUpdateModulePassingStatusOfOnlyQuizLearner = checkandUpdateModulePassingStatusOfOnlyQuizLearner;

const createDiwoCertificate = async function (addEntrys, Notification) {
	try {
		// Update LearnerAchievementId in the SessionUser Table
		for (let entry of addEntrys) {
			//Need to Find User Personal Data
			//need to Find User's Client App Branding
			//Need to Find Certification Data
			//Create Certificate

			let LearnerAchievementId = entry.id;

			// Get Certification details
			[err, getCertificateData] = await to(
				LearnerAchievement.findOne({
					where: {
						id: LearnerAchievementId,
					},
					attributes: ['id', 'data', 'createdAt', 'UserId', 'filePath'],
					include: [
						{
							model: User,
							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
						},
					],
				})
			);
			if (err) {
				console.log('--get getCertificateData--', err);
			}

			if (getCertificateData?.User?.Market) {
				//Find User Personal data

				[err, localUser] = await to(
					dbInstance[getCertificateData.User.Market.db_name].User_master.findOne({
						where: {
							id: getCertificateData.User.local_user_id,
						},
						attributes: ['first', 'last', 'email'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//Find Learner Branch Details

				[err, learnerBranch] = await to(
					User_role_client_mapping.findOne({
						where: {
							UserId: getCertificateData.UserId,
							RoleId: 1,
							forDiwo: true,
						},
						attributes: ['ClientId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (learnerBranch) {
					/// branch Not Found Error
					// Get AppBranding Color and Logo File
					let appBranding = await getDiwoClientAppBrandingByClientId(learnerBranch.ClientId);

					let learnerName = localUser.first + '_' + localUser.last;
					let email = localUser.email;

					if (config_feature?.configurable_feature?.saas) {
						projectName = 'Diwo';
					} else if (config_feature?.configurable_feature?.sles) {
						projectName = 'TASL Leap';
					}

					let fileName = 'uploads/learner_submission/' + learnerName + Date.now() + '.pdf';
					let payload = {
						data: {
							date: getCertificateData.createdAt,
							CertificateLine1: getCertificateData?.data?.CertificateLine1
								? getCertificateData.data.CertificateLine1
								: ' ',
							CertificateLine2: getCertificateData?.data?.CertificateLine2
								? getCertificateData.data.CertificateLine2
								: ' ',
							CertificateLine3: getCertificateData?.data?.CertificateLine3
								? getCertificateData.data.CertificateLine3
								: ' ',
							name: localUser.first + ' ' + localUser.last,
							color: appBranding?.accent_color ? appBranding.accent_color : '#6513e1',
							logoUrl: CONFIG.image_host + appBranding.signature_image_path,
							fileName: CONFIG.imagePath + fileName,
							firstName: localUser.first,
							email: localUser.email,
							emailSignatureText: appBranding?.EmailSignatureText,
							projectName: projectName,
							type: 'Diwo',
							signatureName1: getCertificateData?.data?.signatureName1 ? getCertificateData.data.signatureName1 : ' ',
							signatureDesignation1: getCertificateData?.data?.signatureDesignation1
								? getCertificateData.data.signatureDesignation1
								: ' ',
							signaturePath1: getCertificateData?.data?.signaturePath1
								? CONFIG.image_host + getCertificateData.data.signaturePath1
								: ' ',

							signatureName2: getCertificateData?.data?.signatureName2 ? getCertificateData.data.signatureName2 : ' ',
							signatureDesignation2: getCertificateData?.data?.signatureDesignation2
								? getCertificateData.data.signatureDesignation2
								: ' ',
							signaturePath2: getCertificateData?.data?.signaturePath2
								? CONFIG.image_host + getCertificateData.data.signaturePath2
								: ' ',
						},
					};
					// console.log('--Certificate-payload------', payload);
					//Need to Save File Name fileName into the DataBase

					// call your function mail send here
					if (email && getCertificateData) {
						await AlertEmailForCertificateCompletition(payload);
					}

					await generateLevelCertificate(payload);
					[err, updateCertificationDetails] = await to(
						LearnerAchievement.update(
							{
								filePath: fileName,
							},
							{
								where: {
									id: LearnerAchievementId,
								},
							}
						)
					);
					if (err) {
						console.log('--Error Learner Certifcate -----', err);
					}
				}
			}

			[err, updateEntry] = await to(
				SessionUser.update(
					{ LearnerAchievementId: entry.id },
					{
						where: {
							id: entry.SessionUserId,
						},
					}
				)
			);
			if (err) {
				console.log('--Update LearnerAchievemtId--', err);
			}
			await createNotificationforDiwo(Notification, ['Bell'], [entry.UserId], entry.id);
		}

		return;
	} catch (error) {
		console.log('-----------Error-- createDiwoCertificate'.error);
	}
};
module.exports.createDiwoCertificate = createDiwoCertificate;

// Alert email for certificate completion
const AlertEmailForCertificateCompletition = async function (payload) {
	try {
		console.log(payload);

		const userPayload = payload.data;

		console.log('assigned_date', userPayload.date);

		const [err, CertificationCompletitionSendEmailToLearnerText] = await to(
			CertificationCompletitionSendEmailToLearner(userPayload, userPayload.type)
		);
		if (err) {
			console.log('--------Error in Sendgrid--------------', err);
		} else {
			console.log('Email sent successfully:', CertificationCompletitionSendEmailToLearnerText);
		}

		// console.log('CertificationCompletitionSendEmailToLearnerText', CertificationCompletitionSendEmailToLearnerText);
	} catch (error) {
		console.error('Unhandled error:', error);
		// return ResponseError(res, error, 500, true);
	}
};

const checkModulePassingStatusOfLearner = async function (req, res) {
	try {
		const schema = Joi.object({
			SessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			SessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { SessionId } = value;

		// let SessionId = req.params.sessionId;
		let err;
		let getSessionWorksheetData;
		let passingSessionWorksheetIds = [];

		//For Quiz and Quiz (Randomised)
		[err, getSessionWorksheetData] = await to(
			SessionWorksheet.findAll({
				where: {
					SessionId: SessionId,
					isAssessment: true,
					submit: true,
					type: ['Quiz', 'Quiz (Randomised)'],
					isLearnerPassed: false,
				},
				attributes: ['id', 'score', 'certificateData'],
				include: [
					{
						model: SessionUser,
						where: {
							LearnerAchievementId: {
								[Op.eq]: null,
							},
						},
						attributes: ['id'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getSessionWorksheetData.length > 0) {
			for (let data of getSessionWorksheetData) {
				if (data?.certificateData?.passingMarks >= 0 && data.score != null) {
					if (data.certificateData.passingMarks <= data.score) {
						passingSessionWorksheetIds.push(data.id);
					}
				}
			}
		}

		//For Offline Task
		[err, getSessionWorksheetData_] = await to(
			SessionWorksheet.findAll({
				where: {
					SessionId: SessionId,
					isAssessment: true,
					submit: true,
					type: ['Offline Task'],
					isLearnerPassed: false,
				},
				attributes: ['id', 'score', 'certificateData'],
				include: [
					{
						model: SessionQuestionSubmission,
						attributes: ['id', 'grade'],
					},
					{
						model: SessionUser,
						where: {
							LearnerAchievementId: {
								[Op.eq]: null,
							},
						},
						attributes: ['id'],
					},
					{
						model: SessionQuestion,
						attributes: ['id', 'isTextResponse', 'grade'],
						// where: {
						// 	isTextResponse: true,
						// },
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getSessionWorksheetData_.length > 0) {
			for (let data of getSessionWorksheetData_) {
				let total = 0;
				if (data.score) {
					total = data.score;
				}
				if (data?.certificateData?.passingMarks >= 0) {
					if (data?.SessionQuestionSubmissions.length > 0) {
						for (let grade of data.SessionQuestionSubmissions) {
							if (grade.grade && parseInt(grade.grade) >= 0) {
								total = total + parseInt(grade.grade);
							}
						}
					}

					if (data?.SessionQuestions.length > 0) {
						for (let grade of data.SessionQuestions) {
							if (grade.grade && parseInt(grade.grade) >= 0) {
								total = total + parseInt(grade.grade);
							}
						}
					}
					// console.log('----------totle----', total);
					if (data.certificateData.passingMarks <= total) {
						passingSessionWorksheetIds.push(data.id);
					}
				}
			}
		}

		if (passingSessionWorksheetIds.length > 0) {
			[err, userDetails] = await to(
				SessionUser.findAll({
					include: [
						{
							model: SessionWorksheet,
							attributes: ['id'],
							where: {
								id: passingSessionWorksheetIds,
							},
						},
						{
							model: User,
							attributes: ['id', 'local_user_id', 'MarketId', 'account_id'],
							include: [{ model: Market, attributes: ['db_name'] }],
						},
					],
					attributes: ['id', 'title', 'condition'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else {
			return ResponseSuccess(res, {
				data: [],
			});
		}

		let finalData = [];

		//Find Count
		[err, certificateWorksheetCount] = await to(
			SessionUser.findOne({
				where: {
					SessionId: SessionId,
				},
				include: [
					{
						model: SessionWorksheet,
						where: {
							isAssessment: true,
						},
						attributes: ['id', 'SessionUserId'],
					},
				],
				attributes: ['id', 'condition'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let condition = 'AND';
		let paasingCount = 0;
		if (certificateWorksheetCount) {
			console.log('-----certificateWorksheetCount---', certificateWorksheetCount.convertToJSON());
			console.log('-----certificateWorksheetCount---', certificateWorksheetCount.SessionWorksheets.length);
			condition = certificateWorksheetCount.condition;
			paasingCount = certificateWorksheetCount.SessionWorksheets.length;
		}

		for (let userData of userDetails) {
			//Need to Check Anding and Oring
			let passingFlag = false;
			// for (let worksheet of userData.SessionWorksheets) {
			// if (passingSessionWorksheetIds.indexOf(worksheet.id) != -1) {
			// 	passingFlag = true;
			// } else {
			// 	passingFlag = false;
			// }
			// if (passingFlag && userData.condition == 'OR') {
			// 	break;
			// } else if (!passingFlag && userData.condition == 'AND') {
			// 	break;
			// }

			// }
			if (condition == 'OR' && userData.SessionWorksheets.length > 0) {
				passingFlag = true;
			} else if (condition == 'AND' && userData.SessionWorksheets.length == paasingCount) {
				passingFlag = true;
			} else {
				passingFlag = false;
			}

			if (!passingFlag) {
				continue;
			}
			[err, localUser] = await to(
				dbInstance[userData.User.Market.db_name].User_master.findOne({
					where: {
						id: userData.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			let payload = {
				id: userData.User.id,
				first: localUser?.first ? localUser.first : null,
				last: localUser?.last ? localUser.last : null,
				account_id: userData.User.account_id,
				SessionUserId: userData.id,
				title: userData.title,
			};
			finalData.push(payload);
		}

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkModulePassingStatusOfLearner = checkModulePassingStatusOfLearner;

const getSessionByCode = async function (req, res) {
	try {
		const schema = Joi.object({
			code: Joi.string().trim().min(2).required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			code: req.params.code,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { code } = value;

		// let code = req.params.code;
		[err, sessionData] = await to(
			Session.findOne({
				where: {
					code: code,
				},
				attributes: ['id', 'title', 'code'],
			})
		);
		if (!sessionData) return ResponseError(res, { message: MESSAGE.DETAILS_NOT_FIND }, 500, true);

		return ResponseSuccess(res, {
			data: sessionData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSessionByCode = getSessionByCode;

const checkSesstionPassword = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(),
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: req.body.sessionId,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let data = req.body;

		[err, sessionData] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				attributes: ['id', 'title', 'password'],
			})
		);
		if (!sessionData) return ResponseError(res, { message: MESSAGE.DETAILS_NOT_FIND }, 500, true);
		if (sessionData.password && sessionData.password === data.password) {
			return ResponseSuccess(res, {
				sucess: true,
			});
		} else {
			return ResponseError(res, { message: MESSAGE.PASSWORD_NOT_MATCH }, 500, true);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkSesstionPassword = checkSesstionPassword;

const listOfParticipants = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { sessionId } = value;

		// let sessionId = req.params.sessionId;
		[err, userList] = await to(
			SessionUser.findAll({
				where: {
					SessionId: sessionId,
					// forTrainer: false
				},
				include: [
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
						],
						attributes: ['id', 'local_user_id', 'MarketId', 'account_id'],
					},
				],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let list = [];
		if (userList && userList.length > 0) {
			for (let user of userList) {
				let userDetails = user.convertToJSON();
				if (userDetails && userDetails.User) {
					[err, localUser] = await to(
						dbInstance[userDetails.User.Market.db_name].User_master.findOne({
							where: {
								id: userDetails.User.local_user_id,
							},
							attributes: ['first', 'email', 'last', 'phone'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					userDetails.User.fullName = localUser.first + ' ' + localUser.last;
					list.push(userDetails);
				}
			}
		}

		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.listOfParticipants = listOfParticipants;

const changeParticipantStatus = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionUserId: Joi.number().integer().min(1).positive().required(), // Must be > 0
			status: Joi.string().trim().min(2).required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionUserId: parseInt(req.params.sessionUserId),
			status: req.params.status,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionUserId, status } = value;

		// let sessionUserId = parseInt(req.params.sessionUserId);

		[err, updateSeesionUser] = await to(
			SessionUser.update(
				{
					status: status,
				},
				{
					where: {
						id: sessionUserId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, findClientId] = await to(
			SessionUser.findOne({
				where: {
					id: sessionUserId,
				},
				include: [
					{
						model: User,
						attributes: ['id'],
					},
					{
						model: Session,
						attributes: ['id', 'title'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let clientId = findClientId.ClientId;

		[err, WorksheetCount] = await to(
			SessionWorksheet.count({
				where: {
					SessionUserId: sessionUserId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (status == 'Not Approved') {
			//For Notification
			let notifcationMessage = MESSAGE.TRAINER_NOT_APPROVE;
			notifcationMessage = notifcationMessage.replace('{{session_title}}', findClientId.Session.title);
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [findClientId.User.id]);

			//Decrease Workbook Count
			await getRemoveWorkbookByCount(clientId, WorksheetCount);
		} else if (status == 'Approved') {
			//For Notification
			let notifcationMessage = MESSAGE.TRAINER_APPROVE;
			notifcationMessage = notifcationMessage.replace('{{session_title}}', findClientId.Session.title);
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [findClientId.User.id]);

			//Increase Workbook Count
			await getAddOneWorkbookInLicense(clientId, WorksheetCount);
		}

		return ResponseSuccess(res, {
			messange: MESSAGE.SESSION_STATUS_CHANGED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.changeParticipantStatus = changeParticipantStatus;

const addUserNoteByTrainer = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionUserId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionUserId: parseInt(req.params.sessionUserId),
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { sessionUserId } = value;

		// let sessionUserId = parseInt(req.params.sessionUserId);

		[err, updateSeesionUserNote] = await to(
			SessionUser.update(req.body, {
				where: {
					id: sessionUserId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			messange: MESSAGE.ADD_USER_NOTE,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.addUserNoteByTrainer = addUserNoteByTrainer;

const changeParticipantAttendanceStatus = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionUserId: Joi.number().integer().min(1).positive().required(), // Must be > 0
			status: Joi.string().trim().min(2).required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionUserId: parseInt(req.params.sessionUserId),
			status: req.params.status,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionUserId, status } = value;

		// let sessionUserId = parseInt(req.params.sessionUserId);

		[err, updateSeesionUser] = await to(
			SessionUser.update(
				{
					attendanceStatus: status,
				},
				{
					where: {
						id: sessionUserId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			messange: MESSAGE.SESSION_STATUS_CHANGED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.changeParticipantAttendanceStatus = changeParticipantAttendanceStatus;

const getSeesionBySeesionId = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let sessionId = parseInt(req.params.sessionId);
		let finalData;
		[err, session] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				include: [
					{
						model: Workbook,
						attributes: ['id', 'title', 'geoTag', 'DiwoModuleId', 'haveCertificate'],
						include: [
							{
								model: Course,
								through: 'Course_workbook_mapping',
								attributes: ['id', 'title'],
							},
						],
					},
					{
						model: SessionPhotograph,
					},
					// {
					// 	model: SessionWorksheet,
					// },
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
						],
						attributes: ['id', 'MarketId', 'local_user_id'],
					},
				],
			})
		);

		if (session) {
			finalData = session.convertToJSON();
			if (finalData && finalData.User) {
				[err, localUser] = await to(
					dbInstance[finalData.User.Market.db_name].User_master.findOne({
						where: {
							id: finalData.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					finalData.User.fullName = localUser.first + ' ' + localUser.last;
				}
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSeesionBySeesionId = getSeesionBySeesionId;

const getWorksheetsBySeesionId = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let sessionId = parseInt(req.params.sessionId);
		[err, session] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				attributes: ['id', 'workbookData'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let workSheets = [];
		if (session) {
			workSheets = JSON.parse(session.workbookData).Worksheets;
			for (let data of workSheets) {
				if (data.DiwoAssets && data.DiwoAssets.length > 0) {
					data.DiwoAssets.sort((a, b) => {
						if (a.id < b.id) {
							return -1;
						}
					});
				}
			}
		}
		return ResponseSuccess(res, {
			data: workSheets,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWorksheetsBySeesionId = getWorksheetsBySeesionId;

const getSessionAllUserData = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit['10000Max'])
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
			limit: req.query.limit,
			page: req.query.page,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId, limit, page } = value;

		// let sessionId = req.params.sessionId;

		let offset = 0;
		offset = (page - 1) * limit;

		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (page != NaN && page >= 1) offset = (page - 1) * limit;
		// }

		[err, worbooks] = await to(
			SessionUser.findAll({
				where: {
					SessionId: sessionId,
					forTrainer: false,
				},
				include: [
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
						],
						attributes: ['id', 'local_user_id', 'account_id'],
					},
				],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let list = [];
		if (worbooks && worbooks.length > 0) {
			for (let workbook of worbooks) {
				let WB = workbook.convertToJSON();
				if (WB.User && WB.User.Market) {
					[err, localUser] = await to(
						dbInstance[WB.User.Market.db_name].User_master.findOne({
							where: {
								id: WB.User.local_user_id,
							},
							attributes: ['first', 'email', 'last', 'phone'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					WB.User.fullName = '';
					if (localUser) {
						WB.User.fullName = localUser.first + ' ' + localUser.last;
					}
					delete WB.User.Market;
				}

				[err, sessionWorksheet] = await to(
					SessionWorksheet.findAll({
						where: {
							SessionUserId: workbook.id,
						},
						include: [
							{
								model: SessionQuestion,
								include: [
									{
										model: SessionOption,
									},
									{
										model: SessionQuestionSubmission,
									},
								],
							},
						],
						order: [
							['id', 'ASC'],
							[
								{
									model: SessionQuestion,
								},
								'id',
								'ASC',
							],
							[
								SessionQuestion,
								{
									model: SessionOption,
								},
								'id',
								'ASC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (sessionWorksheet && sessionWorksheet.length > 0) {
					WB.SessionWorksheets = sessionWorksheet;
				} else {
					WB.SessionWorksheets = [];
				}

				list.push(WB);
			}
		}
		return ResponseSuccess(res, {
			data: list,
			count: worbooks.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSessionAllUserData = getSessionAllUserData;

const getSessionOfflineData = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
			index: Joi.number().integer().min(0).required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
			index: parseInt(req.params.index),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId, index } = value;

		// let sessionId = req.params.sessionId;
		// let index = req.params.index;

		//Need to Get All Question With
		[err, getQuestiondata] = await to(
			SessionWorksheet.findAll({
				where: {
					SessionId: sessionId,
					index: index,
					submit: true,
				},
				attributes: ['id', 'SessionUserId', 'submit', 'score', 'brief'],
				include: [
					{
						model: SessionQuestion,
						// where: {
						// 	[Op.or]: {
						// 		isTextResponse: true,
						// 		isFileSubmission: true,
						// 	},
						// },
						attributes: [
							'id',
							'SessionWorksheetId',
							'question',
							'allowFileTypes',
							'fileSize',
							'isTextResponse',
							'isFileSubmission',
							'offlineTaskNote',
							'grade',
						],
						include: [
							{
								model: SessionQuestionSubmission,
								attributes: [
									'id',
									'path',
									'type',
									'SessionQuestionId',
									'SessionWorksheetId',
									'fileName',
									'thumnail',
									'UploadedOnS3',
									'grade',
									'isTranscoding',
									'vimeoPath',
									'vmoVideoId',
								],
							},
						],
					},
					{
						model: SessionUser,
						attributes: ['id', 'UserId'],
						include: [
							{
								model: User,
								attributes: ['id', 'MarketId', 'local_user_id', 'account_id'],
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
						],
					},
				],
				order: [[{ model: SessionQuestion }, 'id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		for (let data_ of getQuestiondata) {
			let data = data_.convertToJSON();

			if (data?.SessionUser?.User?.Market?.db_name) {
				let personalData;
				[err, personalData] = await to(
					dbInstance[data.SessionUser.User.Market.db_name].User_master.findOne({
						where: {
							id: data.SessionUser.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (personalData) {
					data.User = data.SessionUser.User;
					data.User.fullName = personalData.first + ' ' + personalData.last;
					data.User.first = personalData.first;
					data.User.last = personalData.last;
					delete data.SessionUser;
					delete data.User.Market;
				}
			}
			finalList.push(data);
		}

		let taskBrief = null;
		if (finalList.length) {
			taskBrief = finalList[0].brief;
		}

		return ResponseSuccess(res, {
			data: { finalList, taskBrief },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSessionOfflineData = getSessionOfflineData;

const updateSessionOfflineTaskGrade = async function (req, res) {
	try {
		const schema = Joi.object({
			gradeData: Joi.array()
				.items(
					Joi.object({
						id: Joi.number().integer().positive().required(), // Must be > 0
						grade: Joi.any().required(), // Required string
						isFileSubmission: Joi.boolean().required(), // Must be true or false
						isTextResponse: Joi.boolean().required(), // Must be true or false
					})
				)
				.min(1)
				.required(), // At least one item required
		});

		// Validate the request body
		const { error, value } = schema.validate(req.body);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { gradeData } = value;

		// let gradeData = req.body.gradeData;

		for (let data of gradeData) {
			if (data.isFileSubmission) {
				[err, updateGrade] = await to(
					SessionQuestionSubmission.update(
						{
							grade: data.grade,
						},
						{
							where: {
								id: data.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (data.isTextResponse) {
				[err, updateGrade] = await to(
					SessionQuestion.update(
						{
							grade: data.grade,
						},
						{
							where: {
								id: data.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		return ResponseSuccess(res, {
			message: 'Grade successfully updated.',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateSessionOfflineTaskGrade = updateSessionOfflineTaskGrade;

const updateSessionStep = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
			step: Joi.number()
				.integer()
				.min(validationConstant.seessionstep.min)
				.max(validationConstant.seessionstep.max)
				.default(validationConstant.seessionstep.default),
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
			step: req.body.step,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId, step } = value;

		// let sessionId = req.params.sessionId;
		// let step = req.body.step;

		[err, update] = await to(
			Session.update(
				{
					step: step,
				},
				{
					where: {
						id: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			message: MESSAGE.SESSION_STEP_UPDATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateSessionStep = updateSessionStep;

const getSessionCourseListbyClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: req.params.clientId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let clientIds = [];
		//need to find parent client Account as well.
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.category === 'Client Account') {
			clientIds.push(clientId);
		} else if (client) {
			clientIds.push(clientId);
			let parentClientId = client.Associate_client_id;
			let count = 0;
			let flag = true;
			[err, totalClientCount] = await to(Client.count());
			if (err) return ResponseError(res, err, 500, true);

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
				}

				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (clientDetails && clientDetails.category === 'Client Account') {
					clientIds.push(clientDetails.id);
					flag = false;
				} else {
					parentClientId = clientDetails.Associate_client_id;
				}
			}
		}

		[err, CoourseList] = await to(
			Course.findAll({
				where: {
					ClientId: clientIds,
					status: 'Published',
					isDeleted: false,
				},
				include: [
					{
						model: Workbook,
						required: true,
					},
				],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: CoourseList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSessionCourseListbyClientId = getSessionCourseListbyClientId;

const getAllSearchSessionbyClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
			selectedDate: Joi.alternatives()
				.try(
					Joi.object({
						startDate: Joi.date().required(),
						endDate: Joi.date().allow(null),
					}),
					Joi.allow(null) // Allows selectedDate to be explicitly null
				)
				.optional(),
		});
		const { error, value } = schema.validate({
			clientId: req.params.clientId,
			limit: req.query.limit,
			page: req.query.page,
			selectedDate: req.body.selectedDate,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, selectedDate } = value;
		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let searchKey = req.body.searchKey.split(' ');
		// let clientId = req.params.clientId;
		let allSubClientIds = await getAllSubChildClientIds(parseInt(clientId));
		allSubClientIds.push(parseInt(clientId));
		let userId = req.user.id;
		let roleId = req.user.RoleId;
		let UserDetailId = [];
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereConditionForColumn = [];
		let UserDetail;
		let courseList;

		let pathwayList;
		let pathwayId = [];
		let pathwayAssignmetList;
		let pathwayAssignmentId = [];
		let PathwaySessionList;

		let CourseSessionList;
		let UserSessionList;
		let sessionList;
		let courseId = [];

		let TypeSessionList;
		let sessionTypeList;
		let sessionTypeId = [];
		let courseWorkbookId = [];

		// let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let allData = [];
		let UpdatedsessionId = [];
		let UpdatedSessionList;
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		dateCondition.push({
			dateWithTime: {
				[Op.ne]: null,
			},
		});

		if (selectedDate.startDate != null && selectedDate.endDate != null) {
			dateCondition.push({
				dateWithTime: {
					[Op.between]: [selectedDate.startDate, selectedDate.endDate],
				},
			});
		}

		if (filterColumn.indexOf('title') > -1) {
			whereConditionForColumn.push({
				ClientId: allSubClientIds,
				title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('id') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereConditionForColumn.push({
					ClientId: allSubClientIds,
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('assignmentId') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereConditionForColumn.push({
					ClientId: allSubClientIds,
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('status') > -1) {
			whereConditionForColumn.push({
				ClientId: allSubClientIds,
				status: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('first') > -1) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();
					[err, localUser] = await to(
						dbInstance[marketUser.db_name].User_master.findAll({
							where: {
								[sequelize.Op.or]: {
									first: {
										[sequelize.Op.iLike]: '%' + searchKey[0] + '%',
									},
									last: {
										[sequelize.Op.iLike]: '%' + searchKey[0] + '%',
									},
								},
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					let LocalUserId = [];
					if (localUser && localUser.length > 0) {
						for (let User of localUser) {
							LocalUserId.push(User.id);
						}
					}

					[err, UserDetail] = await to(
						User.findAll({
							where: {
								local_user_id: LocalUserId,
								MarketId: market.id,
								forDiwo: true,
							},
							attributes: ['id'],
						})
					);

					if (UserDetail && UserDetail.length > 0) {
						for (let User of UserDetail) {
							UserDetailId.push(User.id);
						}
					}

					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('course') > -1) {
			[err, courseList] = await to(
				Course.findAll({
					where: {
						ClientId: allSubClientIds,
						title: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
					order: [['createdAt', 'DESC']],
				})
			);
			if (courseList && courseList.length > 0) {
				for (let course of courseList) {
					courseId.push(course.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);

			if (courseId && courseId.length > 0) {
				[err, courseWorkbookData] = await to(
					Course_workbook_mapping.findAll({
						where: {
							CourseId: courseId,
						},
						attributes: ['WorkbookId'],
					})
				);

				if (courseWorkbookData && courseWorkbookData.length > 0) {
					for (let courseWorkbookData_ of courseWorkbookData) {
						courseWorkbookId.push(courseWorkbookData_.WorkbookId);
					}
				}
				// console.log('-courseWorkbookId-', courseWorkbookId);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (filterColumn.indexOf('pathway') > -1) {
			[err, pathwayList] = await to(
				Pathway.findAll({
					where: {
						ClientId: allSubClientIds,
						title: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
					order: [['createdAt', 'DESC']],
				})
			);
			if (pathwayList && pathwayList.length > 0) {
				for (let pathway of pathwayList) {
					pathwayId.push(pathway.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);

			if (pathwayId && pathwayId.length > 0) {
				[err, pathwayAssignmetList] = await to(
					DiwoAssignment.findAll({
						where: {
							PathwayId: pathwayId,
						},
						attributes: ['id'],
					})
				);

				if (pathwayAssignmetList && pathwayAssignmetList.length > 0) {
					for (let pathway_assingment of pathwayAssignmetList) {
						pathwayAssignmentId.push(pathway_assingment.id);
					}
				}
				// console.log('-pathwayAssignmentId-', pathwayAssignmentId);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (filterColumn.indexOf('sessionType') > -1) {
			[err, sessionTypeList] = await to(
				DiwoModule.findAll({
					where: {
						type: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
					order: [['createdAt', 'DESC']],
				})
			);
			if (sessionTypeList && sessionTypeList.length > 0) {
				for (let type of sessionTypeList) {
					sessionTypeId.push(type.id);
				}
			}
		}

		if (pathwayAssignmentId && pathwayAssignmentId.length > 0) {
			[err, PathwaySessionList] = await to(
				Session.findAll({
					where: {
						DiwoAssignmentId: pathwayAssignmentId,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
						},
						{
							model: Workbook,
							// include: [
							// 	{
							// 		model: Course,
							// 		through: 'Course_workbook_mapping',
							// 	},
							// ],
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (UserDetail && UserDetail.length > 0) {
			[err, UserSessionList] = await to(
				Session.findAll({
					where: {
						UserId: UserDetailId,
						ClientId: allSubClientIds,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (courseList && courseList.length > 0) {
			[err, CourseSessionList] = await to(
				Session.findAll({
					where: {
						WorkbookId: courseWorkbookId,
						ClientId: allSubClientIds,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (sessionTypeList && sessionTypeList.length > 0) {
			[err, TypeSessionList] = await to(
				Session.findAll({
					where: {
						DiwoModuleId: sessionTypeId,
						ClientId: allSubClientIds,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (whereConditionForColumn && whereConditionForColumn.length > 0) {
			[err, sessionList] = await to(
				Session.findAll({
					where: {
						[sequelize.Op.or]: whereConditionForColumn,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
									attributes: ['id', 'db_name'],
								},
							],
							attributes: ['id', 'local_user_id'],
						},
						{
							model: SessionUser,
							attributes: ['id'],
						},
						{
							model: Workbook,
						},
						{
							model: DiwoModuleAssign,
							include: [
								{
									model: Course,
									attributes: ['id', 'title'],
								},
							],
							attributes: ['id'],
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		if (UserSessionList && UserSessionList.length > 0) {
			for (let User_Session_List of UserSessionList) {
				allData.push(User_Session_List);
			}
		}

		if (CourseSessionList && CourseSessionList.length > 0) {
			for (let Course_Session_List of CourseSessionList) {
				allData.push(Course_Session_List);
			}
		}

		if (PathwaySessionList && PathwaySessionList.length > 0) {
			for (let pathway_Session_List of PathwaySessionList) {
				allData.push(pathway_Session_List);
			}
		}

		if (TypeSessionList && TypeSessionList.length > 0) {
			for (let session_type_list of TypeSessionList) {
				allData.push(session_type_list);
			}
		}

		if (sessionList && sessionList.length > 0) {
			for (let session_List_ of sessionList) {
				allData.push(session_List_);
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedsessionId.push(item_.id);
		}

		if (UpdatedsessionId && UpdatedsessionId.length > 0) {
			//check for trainer login or other
			if (roleId == 11) {
				[err, UpdatedSessionList] = await to(
					Session.findAndCountAll({
						distinct: true,
						where: {
							id: UpdatedsessionId,
							[Op.or]: [
								{
									DiwoModuleId: 1,
								},
								{
									DiwoModuleId: { [Op.ne]: 1 },
									status: {
										[Op.in]: ['Live', 'Closed'],
									},
								},
							],
							UserId: userId,
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['id', 'db_name'],
									},
								],
								attributes: ['id', 'local_user_id'],
							},
							{
								model: SessionUser,
								attributes: ['id'],
							},
							{
								model: Workbook,
								// include: [
								// 	{
								// 		model: Course,
								// 		through: 'Course_workbook_mapping',
								// 	},
								// ],
							},
							{
								model: DiwoModuleAssign,
								include: [
									{
										model: Course,
										attributes: ['id', 'title'],
									},
								],
								attributes: ['id'],
							},
							{
								model: DiwoModule,
								attributes: ['type'],
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
					})
				);
			} else {
				[err, UpdatedSessionList] = await to(
					Session.findAndCountAll({
						distinct: true,
						where: {
							id: UpdatedsessionId,
							[Op.or]: [
								{
									DiwoModuleId: 1,
								},
								{
									DiwoModuleId: { [Op.ne]: 1 },
									status: {
										[Op.in]: ['Live', 'Closed'],
									},
								},
							],
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['id', 'db_name'],
									},
								],
								attributes: ['id', 'local_user_id'],
							},
							{
								model: SessionUser,
								attributes: ['id'],
							},
							{
								model: Workbook,
								// include: [
								// 	{
								// 		model: Course,
								// 		through: 'Course_workbook_mapping',
								// 	},
								// ],
							},
							{
								model: DiwoModuleAssign,
								include: [
									{
										model: Course,
										attributes: ['id', 'title'],
									},
								],
								attributes: ['id'],
							},
							{
								model: DiwoModule,
								attributes: ['type'],
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
					})
				);
			}
		}
		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (UpdatedSessionList && UpdatedSessionList.rows && UpdatedSessionList.rows.length > 0) {
			for (let session of UpdatedSessionList.rows) {
				let session_ = session.convertToJSON();
				newList.push(session_);
			}
		}

		let list = [];
		if (newList && newList.length > 0) {
			for (let session of newList) {
				let session_ = session;
				let payload = {
					id: session_.id,
					title: session_.title,
					location: session_.location,
					dateWithTime: session_.dateWithTime,
					status: session_.status,
					sessionType: null,
					DiwoAssignmentId: session_.DiwoAssignmentId,
				};

				if (session.User) {
					[err, localUser] = await to(
						dbInstance[session.User.Market.db_name].User_master.findOne({
							where: {
								id: session.User.local_user_id,
							},
							attributes: ['first', 'last'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (localUser) {
						payload.facilitator = localUser.first + ' ' + localUser.last;
					}
				}

				let courseList = [];
				// if (session_ && session_.Workbook && session_.Workbook.Courses && session_.Workbook.Courses.length > 0) {
				// 	for (let course of session_.Workbook.Courses) {
				// 		courseList.push(course.title);
				// 	}
				// }
				// payload.courseName = courseList.toString();

				if (
					session_ &&
					session_.DiwoModuleAssign &&
					session_.DiwoModuleAssign.Course &&
					session_.DiwoModuleAssign.Course.title
				) {
					// for (let course of session_.DiwoModuleAssign.Courses) {
					// 	courseList.push(course.title);
					// }
					payload.courseName = session_.DiwoModuleAssign.Course.title;
				}

				if (session.SessionUsers && session.SessionUsers.length > 0) {
					payload.count = session.SessionUsers.length;
				} else {
					payload.count = 0;
				}

				if (session_ && session_.DiwoModule) {
					payload.sessionType = session_.DiwoModule?.type;
				}

				list.push(payload);
			}
		}
		let count;
		if (UpdatedSessionList != undefined) {
			count = UpdatedSessionList.count;
		} else {
			count = 0;
		}

		return ResponseSuccess(res, {
			data: list,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getAllSearchSessionbyClientId = getAllSearchSessionbyClientId;

const getTrainerSessionUserId = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		[err, sessionUser] = await to(
			SessionUser.findOne({
				where: {
					SessionId: sessionId,
					forTrainer: true,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: sessionUser,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getTrainerSessionUserId = getTrainerSessionUserId;

// Upload Avatar
const uploadSessionPhotos = async function (req, res) {
	try {
		let path;
		let originalname;
		let fieldname;

		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let sessionId = parseInt(req.params.sessionId);
		let sessionPhotographAssets;
		if (req.files && req.files.Image && req.files.Image.length > 0) {
			path = imagePath + req.files.Image[0].filename;
			originalname = req.files.Image[0].originalname;
			fieldname = req.files.Image[0].fieldname;
		} else if (req.files && req.files.Video && req.files.Video.length > 0) {
			path = imagePath + req.files.Video[0].filename;
			originalname = req.files.Video[0].originalname;
			fieldname = req.files.Video[0].fieldname;
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			path = imagePath + req.files.PDF[0].filename;
			originalname = req.files.PDF[0].originalname;
			fieldname = req.files.PDF[0].fieldname;
		} else if (req.files && req.files.PPT && req.files.PPT.length > 0) {
			path = imagePath + req.files.PPT[0].filename;
			originalname = req.files.PPT[0].originalname;
			fieldname = req.files.PPT[0].fieldname;
		}
		if (req.files) {
			let payload = {
				path: path,
				fieldname: fieldname,
				filename: originalname,
				SessionId: sessionId,
			};

			[err, sessionPhotographAssets] = await to(SessionPhotograph.create(payload));
		}

		// if (req.files && req.files.image && req.files.image.length > 0) {
		// 	path = imagePath + req.files.image[0].filename;
		// 	originalname = req.files.image[0].originalname;
		// 	let payload = {
		// 		path: path,
		// 		fieldname: 'Image',
		// 		filename: originalname,
		// 		SessionId: sessionId,
		// 	};
		// 	[err, sessionPhotographAssets] = await to(SessionPhotograph.create(payload));
		// 	if (err) return ResponseError(res, err, 500, true);
		// }
		return ResponseSuccess(res, {
			data: sessionPhotographAssets,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadSessionPhotos = uploadSessionPhotos;

const removeSessionPhotgraphs = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionPhotgraphId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionPhotgraphId: parseInt(req.params.sessionPhotgraphId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionPhotgraphId } = value;

		// let sessionPhotgraphId = parseInt(req.params.sessionPhotgraphId);
		let removesessionPhotograph;

		[err, removesessionPhotograph] = await to(
			SessionPhotograph.destroy({
				where: {
					id: sessionPhotgraphId,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: removesessionPhotograph,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.removeSessionPhotgraphs = removeSessionPhotgraphs;

const getAllDiwoActivityByClientIdForAnalytics = async function (req, res) {
	try {
		let err, campaign;
		// let clientId = parseInt(req.params.clientId);

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: req.params.clientId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		let dateArray = [];
		let count = req.params.months;
		let workbookIds = [];
		let dataToSend = [];
		if (allSubChildClientIds.length > 0) {
			// let query_ = `SELECT ARRAY ( Select id FROM "Workbooks" WHERE "ClientId" IN (${allSubChildClientIds.toString()}) );`;

			// [allWorkBooks] = await sequelize.query(query_);

			// Assuming allSubChildClientIds is an array of client IDs
			let query_ = `
			SELECT ARRAY (
			SELECT id
			FROM "Workbooks"
			WHERE "ClientId" IN (:clientIds)
			);
			`;

			const allWorkBooks = await sequelize.query(query_, {
				replacements: { clientIds: allSubChildClientIds },
				type: sequelize.QueryTypes.SELECT,
			});

			workbookIds = allWorkBooks[0].array;
		}

		for (let dateCount = count; dateCount >= 0; dateCount--) {
			let selectedMonth = moment().subtract(dateCount, 'months');
			let firstDateOfselectedMonth = moment(selectedMonth).startOf('month').format('YYYY-MM-DD');
			let lastDateForselectedMonth = moment(selectedMonth).endOf('month').format('YYYY-MM-DD');
			dateArray.push({
				startDate: firstDateOfselectedMonth,
				endDate: lastDateForselectedMonth,
			});
		}

		let finalData = [
			{
				name: 'Content Worksheet Assinged',
				series: [],
			},
			{
				name: 'Content Worksheet Engaged',
				series: [],
			},
			{
				name: 'Enteractive Worksheet Assinged',
				series: [],
			},
			{
				name: 'Enteractive  Worksheet Engaged',
				series: [],
			},
		];
		for (let dateDetails of dateArray) {
			let sessionIds = [];
			let sessionUserIds = [];
			let assignedLearneringCount = 0;
			let engagedLearneringCount = 0;
			let assignedNotLearneringCount = 0;
			let engagedNotLearneringCount = 0;
			// if (workbookIds.length > 0) {
			// 	let query_1 = `SELECT ARRAY (SELECT "id" FROM "Sessions" AS "Session" WHERE "Session"."WorkbookId" IN (${workbookIds.toString()}) AND "Session"."SessionStartDate" BETWEEN '${
			// 		dateDetails.startDate
			// 	}' AND '${dateDetails.endDate}');`;
			// 	[sessionId] = await sequelize.query(query_1);
			// 	sessionIds = sessionId[0].array;

			// 	if (sessionIds.length > 0) {
			// 		let query_2 = `SELECT ARRAY ( SELECT "id" FROM "SessionUsers" AS "SessionUser" WHERE "SessionUser"."SessionId" IN (${sessionIds.toString()}) AND "SessionUser"."forTrainer" = false AND "SessionUser"."attendanceStatus" = 'Present' AND "SessionUser"."isDeleted" = false);`;
			// 		[sessionUsers] = await sequelize.query(query_2);
			// 		sessionUserIds = sessionUsers[0].array;
			// 	}
			// }

			if (workbookIds.length > 0) {
				// Refactored query for fetching session IDs
				let query_1 = `
				  SELECT ARRAY (
					SELECT "id"
					FROM "Sessions" AS "Session"
					WHERE "Session"."WorkbookId" IN (:workbookIds)
					  AND "Session"."SessionStartDate" BETWEEN :startDate AND :endDate
				  );
				`;

				sessionId = await sequelize.query(query_1, {
					replacements: {
						workbookIds: workbookIds, // array of workbookIds
						startDate: dateDetails.startDate,
						endDate: dateDetails.endDate,
					},
					type: sequelize.QueryTypes.SELECT,
				});

				sessionIds = sessionId[0].array;

				if (sessionIds.length > 0) {
					// Refactored query for fetching session user IDs
					let query_2 = `
					SELECT ARRAY (
					  SELECT "id"
					  FROM "SessionUsers" AS "SessionUser"
					  WHERE "SessionUser"."SessionId" IN (:sessionIds)
						AND "SessionUser"."forTrainer" = false
						AND "SessionUser"."attendanceStatus" = 'Present'
						AND "SessionUser"."isDeleted" = false
					);
				  `;

					sessionUsers = await sequelize.query(query_2, {
						replacements: { sessionIds: sessionIds },
						type: sequelize.QueryTypes.SELECT,
					});

					sessionUserIds = sessionUsers[0].array;
				}
			}

			if (sessionUserIds.length > 0) {
				//For Learnering Content
				[err, assignedLearneringCount] = await to(
					SessionWorksheet.count({
						where: {
							SessionUserId: sessionUserIds,
							type: 'Learning Content',
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, engagedLearneringCount] = await to(
					SessionWorksheet.count({
						where: {
							SessionUserId: sessionUserIds,
							type: 'Learning Content',
							isRead: true,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//For Not Learnering Content
				[err, assignedNotLearneringCount] = await to(
					SessionWorksheet.count({
						where: {
							SessionUserId: sessionUserIds,
							type: {
								[Op.ne]: 'Learning Content',
							},
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, engagedNotLearneringCount] = await to(
					SessionWorksheet.count({
						where: {
							SessionUserId: sessionUserIds,
							type: {
								[Op.ne]: 'Learning Content',
							},
							isRead: true,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			let getmonth = moment(dateDetails.startDate, 'YYYY/MM/DD');
			let month = getmonth.format('MMM');

			finalData[0].series.push({
				value: assignedLearneringCount,
				name: month,
			});
			finalData[1].series.push({
				value: engagedLearneringCount,
				name: month,
			});
			finalData[2].series.push({
				value: assignedNotLearneringCount,
				name: month,
			});
			finalData[3].series.push({
				value: engagedNotLearneringCount,
				name: month,
			});
		}

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoActivityByClientIdForAnalytics = getAllDiwoActivityByClientIdForAnalytics;

const getAllSessionListByClientList = async function (req, res) {
	try {
		let err;
		// let clientId = parseInt(req.params.clientId);

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: req.params.clientId,
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		let finalList = [];
		let workbookIds = [];
		if (allSubChildClientIds.length > 0) {
			let allWorkBooks;
			// let query_ = `SELECT ARRAY ( Select id FROM "Workbooks" WHERE "ClientId" IN (${allSubChildClientIds.toString()}) );`;

			// [allWorkBooks] = await sequelize.query(query_);

			let query_ = `
				SELECT ARRAY (
					SELECT "id"
					FROM "Workbooks"
					WHERE "ClientId" IN (:allSubChildClientIds)
				);
				`;

			allWorkBooks = await sequelize.query(query_, {
				replacements: { allSubChildClientIds: allSubChildClientIds },
				type: sequelize.QueryTypes.SELECT,
			});

			workbookIds = allWorkBooks[0].array;
			if (workbookIds.length > 0) {
				[err, sessionList] = await to(
					Session.findAll({
						where: {
							WorkbookId: workbookIds,
							isDeleted: false,
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
								attributes: ['id', 'account_id', 'MarketId', 'local_user_id', 'CountryId', 'cStatus'],
							},
							{
								model: Workbook,
								include: [
									{
										model: Course,
										through: 'Course_workbook_mapping',
									},
								],
								attributes: ['id'],
							},
							{
								model: SessionPhotograph,
							},
						],
						attributes: ['id', 'title', 'location', 'dateWithTime', 'trainerNote', 'status'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				for (let session of sessionList) {
					let session_ = session.convertToJSON();
					if (session_) {
						[err, localUser] = await to(
							dbInstance[session_.User.Market.db_name].User_master.findOne({
								where: {
									id: session_.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							session_.User.fullName = localUser.first + ' ' + localUser.last;
						}
					}

					finalList.push(session_);
				}
			}
		}

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSessionListByClientList = getAllSessionListByClientList;

const getSessionCardDataByUsingSessionId = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let sessionId = parseInt(req.params.sessionId);
		[err, ParticipantsApprovedCount] = await to(
			SessionUser.count({
				where: {
					SessionId: sessionId,
					status: 'Approved',
					isDeleted: false,
					forTrainer: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, ParticipantsAttendCount] = await to(
			SessionUser.count({
				where: {
					SessionId: sessionId,
					status: 'Approved',
					isDeleted: false,
					attendanceStatus: 'Present',
					forTrainer: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let totalDurationInSeconds = 0;
		let totalScore = 0;
		let learnerLessonCompletitionstatusCount = 0;

		// Get Session time completion data
		[err, getSessionUserData] = await to(
			SessionUser.findAll({
				where: {
					SessionId: sessionId,
					status: 'Approved',
					isDeleted: false,
					forTrainer: false,
				},
				attributes: ['id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let session_user of getSessionUserData) {
			let sessionUserScormData;
			[err, sessionUserScormData] = await to(
				Scorm_tracking.findAll({
					where: {
						sessionUserId: session_user.id,
					},
					attributes: ['score_raw', 'total_time', 'lesson_status'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			for (let scormEntry of sessionUserScormData) {
				const timeStr = scormEntry.total_time;
				const rawScore = scormEntry.score_raw;
				const lessonStatus = scormEntry.lesson_status;

				console.log('timeStr', timeStr);

				if (timeStr) {
					if (timeStr.includes(':')) {
						// Handle format like "00:13:06.85"
						const [hours, minutes, seconds] = timeStr.split(':').map(Number);
						const totalSeconds = hours * 3600 + minutes * 60 + seconds;
						totalDurationInSeconds += totalSeconds;
					} else {
						// Handle plain seconds string like "148.18"
						const totalSeconds = parseFloat(timeStr);
						if (!isNaN(totalSeconds)) {
							totalDurationInSeconds += totalSeconds;
						}
					}
				}

				console.log('totalDurationInSeconds', totalDurationInSeconds);

				if (rawScore) {
					totalScore += parseFloat(rawScore);
				}

				if (lessonStatus?.trim().toLowerCase() === 'completed') {
					learnerLessonCompletitionstatusCount += 1;
				}
			}
		}

		let AverageTimeSpent = 0;
		let AverageScore = 0;
		let LessonCompletitionstatusCount = 0;

		console.log('ParticipantsAttendCount', ParticipantsAttendCount);

		if (ParticipantsAttendCount > 0) {
			AverageTimeSpent = Number(totalDurationInSeconds / ParticipantsAttendCount).toFixed(2);
			AverageScore = Number(totalScore / ParticipantsAttendCount).toFixed(2);
			LessonCompletitionstatusCount = Number(learnerLessonCompletitionstatusCount);
		}

		//Get Session Feed BAck Data
		[err, getSessionFeedbackData] = await to(
			SessionUser.findAll({
				where: {
					SessionId: sessionId,
					status: 'Approved',
					isDeleted: false,
					forTrainer: false,
				},
				include: [
					{
						model: SessionWorksheet,
						where: {
							sessionFeedback: true,
							type: 'Survey',
							submit: true,
						},
						attributes: ['id', 'type', 'sessionFeedBackMinCount', 'sessionFeedBackMaxCount'],
						include: [
							{
								model: SessionQuestion,
								where: {
									questionType: 'Rating scale',
								},
								attributes: ['id'],
								// attributes: ['id', 'surveyUserRating', 'surveyMaxScale'],
								include: [
									{ model: SessionOption, where: { selectedAns: true }, attributes: ['id', 'selectedAns', 'sr_no'] },
									// { model: SessionOption, where: { selectedAns: true }, attributes: ['id', 'selectedAns', 'sr_no'], required: false },
								],
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let sessionScore = 0;
		let sessionTotalScore = 0;
		if (getSessionFeedbackData && getSessionFeedbackData.length > 0) {
			sessionTotalScore =
				getSessionFeedbackData[0].SessionWorksheets[0].SessionQuestions.length *
				getSessionFeedbackData[0].SessionWorksheets[0].sessionFeedBackMaxCount;
		}

		for (let data of getSessionFeedbackData) {
			for (let worksheet of data.SessionWorksheets) {
				for (let question of worksheet.SessionQuestions) {
					// if(question.SurveyRatingType != 'Text'){
					// 	sessionScore += question.surveyUserRating ?? 0;
					// }

					for (let option of question.SessionOptions) {
						if (option.selectedAns) {
							if (worksheet.sessionFeedBackMinCount == 0) {
								sessionScore = sessionScore + option.sr_no - 1;
							} else {
								sessionScore = sessionScore + option.sr_no;
							}
						}
					}
				}
			}
		}
		// console.log('--sessionScore-', sessionScore);
		if (sessionScore > 0) {
			sessionScore = Number(sessionScore / getSessionFeedbackData.length).toFixed(2);
		}
		let payload = {
			ParticipantsApprovedCount: ParticipantsApprovedCount,
			ParticipantsAttendCount: ParticipantsAttendCount,
			sessionFeedbackScore: sessionScore,
			sessionFeedbackTotalCount: sessionTotalScore,
			ParticipantsEngagementCount: 0,
			averageTimeInSeconds: Number(AverageTimeSpent),
			averageScore: AverageScore,
			lessonCompletitionstatusCount: LessonCompletitionstatusCount,
		};
		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSessionCardDataByUsingSessionId = getSessionCardDataByUsingSessionId;

const getTrainerMasterSession = async function (req, res) {
	try {
		const schema = Joi.object({
			workbookId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			workbookId: parseInt(req.params.workbookId),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { workbookId } = value;

		let userId = req.user.id;
		let getDetails;
		// let workbookId = parseInt(req.params.workbookId);

		[err, getDetails] = await to(
			SessionUser.findOne({
				where: {
					UserId: userId,
					WorkbookId: workbookId,
					forTrainer: true,
				},
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: getDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTrainerMasterSession = getTrainerMasterSession;

const getCourseListFOrWorkbookCreationbyClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDiwo(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		[err, CoourseList] = await to(
			Course.findAll({
				where: {
					ClientId: allSubClientIds,
					status: 'Published',
					isDeleted: false,
				},
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: CoourseList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCourseListFOrWorkbookCreationbyClientId = getCourseListFOrWorkbookCreationbyClientId;

const getTrainerOnlySessionReport = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			sessionId: parseInt(req.params.sessionId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { sessionId } = value;

		// let sessionId = parseInt(req.params.sessionId);
		let data;
		let SessionQuestionSubmission_;

		[err, SessionList] = await to(
			Session.findOne({
				where: {
					id: sessionId,
				},
				include: [
					{
						model: User,
						include: [
							{
								model: Market,
							},
						],
					},
					{
						model: SessionWorksheet,
						include: [
							{
								model: SessionQuestion,
								include: [
									{
										model: SessionOption,
									},
								],
							},
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (SessionList) {
			data = SessionList.convertToJSON();

			for (let sessionWorksheet of data.SessionWorksheets) {
				for (let SessionQuestion of sessionWorksheet.SessionQuestions) {
					[err, SessionQuestionSubmission_] = await to(
						SessionQuestionSubmission.findAll({
							where: {
								SessionQuestionId: SessionQuestion.id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					SessionQuestion.SessionQuestionSubmissions = SessionQuestionSubmission_;
				}
			}

			[err, localUser] = await to(
				dbInstance[data.User.Market.db_name].User_master.findOne({
					where: {
						id: data.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				data.User.fullName = localUser.first + ' ' + localUser.last;
			}
		}

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTrainerOnlySessionReport = getTrainerOnlySessionReport;

const getLearnerResponseBySessionId = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(),
			index: Joi.number().integer().min(0).required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit['10000Max'])
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});
		const { error, value } = schema.validate({
			sessionId: req.body.sessionId,
			index: req.body.index,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { sessionId, index, limit, page } = value;

		// const sessionId = req.body.sessionId;
		// const index = req.body.index;
		let offset = 0;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		offset = (page - 1) * limit;

		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (page != NaN && page >= 1) offset = (page - 1) * limit;
		// }

		// const query_1 = `
		// 		SELECT "SessionUsers"."UserId" as user_id,
		// 		"Users".local_user_id as local_id,
		// 		CASE
		// 			WHEN "SessionWorksheets".submit THEN 'Submitted'
		// 				ELSE 'Not Submitted'
		// 			END AS submit_status,
		// 			"Markets".db_name as db_name

		// 		FROM "SessionUsers"
		// 		JOIN "SessionWorksheets" ON "SessionUsers".id = "SessionWorksheets"."SessionUserId"
		// 		JOIN "Users" ON "SessionUsers"."UserId" = "Users".id
		// 		JOIN "Markets" ON "Users"."MarketId" = "Markets".id

		// 		WHERE "SessionUsers"."SessionId" = ${sessionId} AND
		// 			"SessionWorksheets".index = ${index}
		// 			LIMIT ${limit} OFFSET ${offset};`;

		const query_1 = `
    SELECT 
        "SessionUsers"."UserId" as user_id,
        "Users".local_user_id as local_id,
		    "Users".account_id as account_id,
        CASE
            WHEN "SessionWorksheets".submit THEN 'Submitted'
            ELSE 'Not Submitted'
        END AS submit_status,
        "Markets".db_name as db_name
    FROM "SessionUsers"
    JOIN "SessionWorksheets" ON "SessionUsers".id = "SessionWorksheets"."SessionUserId"
    JOIN "Users" ON "SessionUsers"."UserId" = "Users".id
    JOIN "Markets" ON "Users"."MarketId" = "Markets".id
    WHERE "SessionUsers"."SessionId" = ${sessionId} AND
          "SessionWorksheets".index = ${index}
    LIMIT ${limit} OFFSET ${offset};
`;

		const query_total_count = `
    SELECT 
        COUNT(*) AS total_count
    FROM "SessionUsers"
    JOIN "SessionWorksheets" ON "SessionUsers".id = "SessionWorksheets"."SessionUserId"
    JOIN "Users" ON "SessionUsers"."UserId" = "Users".id
    JOIN "Markets" ON "Users"."MarketId" = "Markets".id
    WHERE "SessionUsers"."SessionId" = ${sessionId} AND
          "SessionWorksheets".index = ${index};
`;

		let learnerResponse = [];
		let totalCountResult = [];
		[learnerResponse] = await sequelize.query(query_1);
		[totalCountResult] = await sequelize.query(query_total_count);

		let finalData = [];
		if (learnerResponse.length > 0) {
			for (let learner of learnerResponse) {
				//Get User Name From Local Database
				[err, localUser] = await to(
					dbInstance[learner.db_name].User_master.findOne({
						where: {
							id: learner.local_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					learner.fullName = localUser.first + ' ' + localUser.last;
				} else {
					learner.fullName = '-';
				}

				finalData.push(learner);
			}
		}

		let count = 0;
		if (totalCountResult && totalCountResult[0].total_count) {
			count = parseInt(totalCountResult[0].total_count);
		} else {
			count = 0;
		}

		return ResponseSuccess(res, {
			data: finalData,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerResponseBySessionId = getLearnerResponseBySessionId;

const getClientVimeoTokenByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let data = await getDiwoClientVimeoTokenService(clientId);
		if (!data) {
			return ResponseSuccess(res, {
				data: data,
				message: MESSAGE.NOT_VIMEO_CREDENTIALS,
			});
		} else {
			return ResponseSuccess(res, {
				data: data,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientVimeoTokenByClientId = getClientVimeoTokenByClientId;

const getAllCertificateModuleByModuleType = async function (req, res) {
	try {
		//Get All Client Id Name

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			moduleTypeId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			moduleTypeId: parseInt(req.params.moduleType),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, moduleTypeId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		let moduleDetails = [];
		let allSubClientIds = await getAllSubChildClientIds(parseInt(clientId));
		allSubClientIds.push(parseInt(clientId));

		//Find all Modules
		[err, moduleDetails] = await to(
			Workbook.findAll({
				where: {
					ClientId: allSubClientIds,
					DiwoModuleId: parseInt(moduleTypeId),
					haveCertificate: true,
					isDeleted: false,
					status: 'Published',
					allowNewLearner: false,
					allowWithoutPreAssign: false,
				},
				attributes: ['id', 'title', 'descrip', 'createdAt', 'updatedAt'],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: moduleDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllCertificateModuleByModuleType = getAllCertificateModuleByModuleType;

const recordSessionLink = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(),
			recordedSessionLink: Joi.string().uri().allow(null).allow(''), // Ensure it's a valid URL
		});

		const { error, value } = schema.validate({
			sessionId: parseInt(req.body.sessionId),
			recordedSessionLink: req.body.recordedSessionLink,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { sessionId, recordedSessionLink } = value;

		// let sessionDetails = req.body;
		[err, update] = await to(
			Session.update(
				{
					recordedLink: recordedSessionLink,
				},
				{
					where: {
						id: sessionId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: recordedSessionLink,
			message: MESSAGE.SESSION_RECORD_LINK_UPDATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.recordSessionLink = recordSessionLink;

const unlockLearnerQuizReattempts = async function (req, res) {
	try {
		const schema = Joi.object({
			sessionId: Joi.number().integer().positive().required(),
			index: Joi.number().integer().required(),
			worksheetId: Joi.number().allow(null).allow(''),
			SessionUserId: Joi.number().allow(null).allow(''),
		});

		const { error, value } = schema.validate({
			sessionId: parseInt(req.body.sessionId),
			index: req.body.index,
			worksheetId: req.body.worksheetId,
			SessionUserId: req.body.SessionUserId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { sessionId, index, worksheetId, SessionUserId } = value;

		let payload = {
			reAttemptsCount: 0,
			isReattemptLocked: false,
		};

		let whereCondition = {
			SessionId: sessionId,
			index: index,
			isQuizCompletion: true,
			reAttemptsCount: {
				[Op.ne]: 0,
			},
			isReattemptLocked: true,
			worksheetStatus: {
				[Op.ne]: 'Completed',
			},
		};

		if (worksheetId !== null && worksheetId !== '' && worksheetId !== undefined) {
			whereCondition.worksheetId = worksheetId;
		}

		if (SessionUserId !== null && SessionUserId !== '' && SessionUserId !== undefined) {
			whereCondition.SessionUserId = SessionUserId;
		}

		console.log('whereCondition', whereCondition);

		[err, sessionWorksheetUpdate] = await to(
			SessionWorksheet.update(payload, {
				where: whereCondition,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Learner Quiz Reattempt Unlock`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserId: req.user.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.LEARNER_REATTEMPTS_UNLOCKED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.unlockLearnerQuizReattempts = unlockLearnerQuizReattempts;
