const {
	Op,
	sequelize,
	Client,
	User,
	Market,
	CampWhatsAppEmailDrip,
	Post,
	Drip_email_non_native,
	Drip_only_email,
	Drip_whatsapp_native,
	Drip_whatsapp_non_native,
	User_role_client_mapping,
	Course,
	Session,
	Workbook,
	Scorm_tracking,
	Scorm_interaction,
	SessionUser,
	SessionWorksheet,
	Client_job_role,
	SessionQuestion,
	Bot_send_msg,
	Drip_camp,
	Campaign,
	Campaign_user_group_mapping,
	User_group,
	Assigned_post_to_user,
	Drip_native,
	SessionOption,
	System_branding,
	ClientCustomReport,
	DiwoModule,
	DiwoModuleAssign,
	DiwoAssignment,
	Pathway,
	PathwayStatus,
	CourseStatus,
	LearnerAchievement,
	Badge,
	LearnerAssignment,
	SessionQuestionSubmission,
	ClientWhatsAppSetup,
	WhatsAppSetup,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');
const { createlog } = require('../services/log.service');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const archiver = require('archiver');
const {
	getAllSubChildClientIds,
	getAllSubClientAndBranchAccountLists,
	getAccountCustomField,
} = require('../services/client.service');
const moment = require('moment');

const shortid = require('shortid');
const { createNotification, createNotificationforDiwo } = require('../services/notification.service');
const Joi = require('joi');
const client = require('@jsreport/nodejs-client')(
	CONFIG.js_report_api_url,
	CONFIG.js_report_user_id,
	CONFIG.js_report_password
);
const Sequelize = require('sequelize');
//const client = require('@jsreport/nodejs-client')('http://localhost:5488');

//Only WhatsApp
const dripActivityReportOfOnlyWhatsApp = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});
		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		// let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND  "CampWhatsAppEmailDrip"."dripType"= 'Only WhatsApp');`;
		// [allPosts] = await sequelize.query(query_);

		const query_ = `
			SELECT ARRAY(
				SELECT "CampWhatsAppEmailDrip"."PostId" 
				FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" 
				INNER JOIN "Posts" AS "Post" 
					ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" 
					AND "Post"."ClientId" IN (:clientIds) 
				WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN :startDate AND :endDate
				AND "CampWhatsAppEmailDrip"."dripType" = 'Only WhatsApp'
			);
		`;

		const allPosts = await sequelize.query(query_, {
			replacements: {
				// clientIds, // Make sure it's an array
				// startDateUTC,
				// endDateUTC,
				clientIds: clientIds,
				startDate: startDateUTC,
				endDate: endDateUTC,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];

		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'Only WhatsApp',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: Drip_whatsapp_native,
							attributes: ['templateStatus'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'WHATSAPP TEMPLATE STATUS':
								postData.Drip_whatsapp_natives && postData.Drip_whatsapp_natives.length > 0
									? postData.Drip_whatsapp_natives[0].templateStatus
									: '',
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': '',
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': '',
							'TOTAL DRIPS SENT': '',
							'TOTAL DRIPS DELIVERED': '',
							'TOTAL DRIPS READ ON WHATSAPP': '',
							'TOTAL DRIPS ENGAGED': '',
							//"TOTAL DRIPS WHERE ACTION INTENT DISPLAYED": "",
							// 'DRIP AVERAGE ACTION SCORE': '',
						};
						if (dripCampData.Campaigns.length > 0) {
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered', 'quickReplyResponse'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let intentCount = 0;
								let totalClickExternalLink = 0;
								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}
									if (data.quickReplyResponse && data.quickReplyResponse != null && data.quickReplyResponse != '') {
										intentCount++;
									}
									if (data.clickExternalLink) {
										totalClickExternalLink++;
									}
								}

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['TOTAL DRIPS READ ON WHATSAPP'] = engagedCount;
								payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								// payload["TOTAL DRIPS WHERE ACTION INTENT DISPLAYED"] =
								//   intentCount;
								payload['TOTAL LINK CLICKS ON WHATSAPP'] = totalClickExternalLink;
								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												// include: [
												// 	{
												// 		model: User,
												// 		attributes: ['id'],
												// 	},
												// ],
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_Only_on_WhatsApp;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (Only WhatsApp)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfOnlyWhatsApp = dripActivityReportOfOnlyWhatsApp;

//WhatsApp With Drip
const dripActivityReportOfWhatsAppWithDrip = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(), // Ensures it's a valid ISO date
			endDate: Joi.date().greater(Joi.ref('startDate')).required(), // Ensures endDate > startDate
		});
		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDateUTC}' AND '${endDateUTC}' AND  "CampWhatsAppEmailDrip"."dripType"= 'DripApp with sharing on WhatsApp');`;
		[allPosts] = await sequelize.query(query_);

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'DripApp with sharing on WhatsApp',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: Drip_whatsapp_non_native,
							attributes: ['templateStatus'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);
			//console.log('-----1---', allPostData.length);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'WHATSAPP TEMPLATE STATUS':
								postData.Drip_whatsapp_non_natives && postData.Drip_whatsapp_non_natives.length > 0
									? postData.Drip_whatsapp_non_natives[0].templateStatus
									: '',
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': '',
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'TOTAL DRIPS READ ON WHATSAPP': 0,
							'TOTAL DRIPS READ ON DRIP APP': 0,
							'TOTAL DRIPS ENGAGED': 0,
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED': '',
							'ACTION INTENT VALUES': 0,
							'ACTION TAKEN': 0,
							'DRIP AVERAGE ACTION SCORE': 0,
							//'TOTAL BUTTON CLICKS ON DRIP APP': 0,
							'EXTERNAL LINK BUTTON CLICKS 1': 0,
							'EXTERNAL LINK BUTTON CLICKS 2': 0,
							'EXTERNAL LINK BUTTON CLICKS 3': 0,
							'EXTERNAL LINK BUTTON CLICKS 4': 0,
							'EXTERNAL LINK BUTTON CLICKS 5': 0,
							'EXTERNAL LINK BUTTON CLICKS 6': 0,
							'EXTERNAL LINK BUTTON CLICKS 7': 0,
							'EXTERNAL LINK BUTTON CLICKS 8': 0,
							'EXTERNAL LINK BUTTON CLICKS 9': 0,
							'EXTERNAL LINK BUTTON CLICKS 10': 0,
						};
						if (dripCampData.Campaigns.length > 0) {
							let allLearnerAssignedData;
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [
										{ model: Post, attributes: ['id', 'tempType'] },
										{
											model: Assigned_post_to_user,
											attributes: ['id', 'score', 'submit', 'externalLink', 'consumed'],
										},
									],
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let score = 0;
								let totalScoredCount = 0;
								let consumed = 0;
								let totalConsumedCount = 0;
								let actiontaken = 0;
								let scoreCount = 0;
								let externalLink1 = 0;
								let externalLink2 = 0;
								let externalLink3 = 0;
								let externalLink4 = 0;
								let externalLink5 = 0;
								let externalLink6 = 0;
								let externalLink7 = 0;
								let externalLink8 = 0;
								let externalLink9 = 0;
								let externalLink10 = 0;

								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}

									if (data && data.Assigned_post_to_user && data.Assigned_post_to_user.submit) {
										actiontaken++;
									}

									if (
										data &&
										data.Post &&
										['Quiz', 'Video', 'Carousel', 'Single Image'].indexOf(data.Post.tempType) > -1 &&
										data.Assigned_post_to_user &&
										(data.Assigned_post_to_user.score || data.Assigned_post_to_user.consumed)
									) {
										if (data?.Assigned_post_to_user?.consumed != null && data.Assigned_post_to_user.consumed > 0) {
											consumed = consumed + parseInt(data.Assigned_post_to_user.consumed);
											totalConsumedCount++;
										}

										if (data?.Assigned_post_to_user?.score != null && data.Assigned_post_to_user.score > 0) {
											score = score + parseInt(data.Assigned_post_to_user.score);
											totalScoredCount++;
										}
									}

									if (
										data?.Assigned_post_to_user?.externalLink &&
										data?.Assigned_post_to_user?.externalLink != null &&
										data?.Assigned_post_to_user?.externalLink != ''
									) {
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick1) {
											externalLink1++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick2) {
											externalLink2++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick3) {
											externalLink3++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick4) {
											externalLink4++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick5) {
											externalLink5++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick6) {
											externalLink6++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick7) {
											externalLink7++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick8) {
											externalLink8++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick9) {
											externalLink9++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick10) {
											externalLink10++;
										}
									}
								}

								payload['EXTERNAL LINK BUTTON CLICKS 1'] = externalLink1;
								payload['EXTERNAL LINK BUTTON CLICKS 2'] = externalLink2;
								payload['EXTERNAL LINK BUTTON CLICKS 3'] = externalLink3;
								payload['EXTERNAL LINK BUTTON CLICKS 4'] = externalLink4;
								payload['EXTERNAL LINK BUTTON CLICKS 5'] = externalLink5;
								payload['EXTERNAL LINK BUTTON CLICKS 6'] = externalLink6;
								payload['EXTERNAL LINK BUTTON CLICKS 7'] = externalLink7;
								payload['EXTERNAL LINK BUTTON CLICKS 8'] = externalLink8;
								payload['EXTERNAL LINK BUTTON CLICKS 9'] = externalLink9;
								payload['EXTERNAL LINK BUTTON CLICKS 10'] = externalLink10;

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['TOTAL DRIPS READ ON WHATSAPP'] = engagedCount;
								payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								payload['ACTION TAKEN'] = actiontaken;

								//Old Code for Action Score
								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / engagedCount).toFixed(2);
								// }

								if (['Video', 'Carousel', 'Single Image'].indexOf(allLearnerAssignedData[0].Post.tempType) > -1) {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / actiontaken).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = consumed > 0 ? Number(consumed) : 0;
								} else {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / totalScoredCount).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = score > 0 ? Number(score) : 0;
								}

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / scoreCount).toFixed(2);
								// 	payload['ACTION INTENT VALUES'] = Number(score);
								// } else {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = 0;
								// 	payload['ACTION INTENT VALUES'] = 0;
								// }

								//All Drip Count Related Drip App
								[err, allLearnerAssignedData] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											// DripCampId: dripCampData.id,
											DripCampIndex: dripCampData.index,
											isRead: true,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);
								payload['TOTAL DRIPS READ ON DRIP APP'] = allLearnerAssignedData;

								// Check Intent Count by Using Template type
								let wherConditionForIntent = {
									CampaignId: dripCampData.Campaigns[0].id,
									// DripCampId: dripCampData.id,
									DripCampIndex: dripCampData.index,
									publishOn: {
										[Op.between]: [startDate, endDate],
									},
								};

								if (['Single Image'].indexOf(postData.tempType) > -1) {
									wherConditionForIntent.isRead = true;
								} else if (
									['Quiz', 'Poll', 'Offline Task', 'Survey', 'Quiz (Randomised)', 'Video', 'Carousel'].indexOf(
										postData.tempType
									) > -1
								) {
									wherConditionForIntent.isDripClickAction = true;
								}
								// else if (['Video'].indexOf(postData.tempType) > -1) {
								// 	wherConditionForIntent.actionStatus = 'Watched';
								// }

								[err, allLearnerIntentCount] = await to(
									Assigned_post_to_user.count({
										where: wherConditionForIntent,
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								payload['TOTAL DRIPS WHERE ACTION INTENT DISPLAYED'] = allLearnerIntentCount;

								[err, allLearnerExternalClickCount] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											DripCampIndex: dripCampData.index,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
											clickExternalLink: true,
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								//payload['TOTAL BUTTON CLICKS ON DRIP APP'] = allLearnerExternalClickCount;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												// include: [
												// 	{
												// 		model: User,
												// 		attributes: ['id'],
												// 	},
												// ],
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;

								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_On_Drip_App_with_sharing_on_WhatsApp;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (DripApp with sharing on WhatsApp)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfWhatsAppWithDrip = dripActivityReportOfWhatsAppWithDrip;

//Email With Drip
const dripActivityReportOfEmailWithDrip = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});
		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND  "CampWhatsAppEmailDrip"."dripType"= 'DripApp with sharing on Email');`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "CampWhatsAppEmailDrip"."PostId" 
				FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip"
				INNER JOIN "Posts" AS "Post" 
					ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id"
					AND "Post"."ClientId" IN (:clientIds)
				WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN :startDate AND :endDate
				AND "CampWhatsAppEmailDrip"."dripType" = 'DripApp with sharing on Email'
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds,
				startDate: startDateUTC,
				endDate: endDateUTC,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'DripApp with sharing on Email',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);
			//console.log('-----1---', allPostData.length);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': 0,
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'DRIPS READ ON EMAIL': 0,
							'TOTAL DRIPS READ ON DRIP APP': 0,
							'TOTAL DRIPS ENGAGED': 0,
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED': '',
							'ACTION INTENT VALUES': 0,
							'ACTION TAKEN': 0,
							'DRIP AVERAGE ACTION SCORE': 0,
							//'TOTAL BUTTON CLICKS ON DRIP APP': 0,
							/////////////////////////////////////////////
							'EXTERNAL LINK BUTTON CLICKS 1': 0,
							'EXTERNAL LINK BUTTON CLICKS 2': 0,
							'EXTERNAL LINK BUTTON CLICKS 3': 0,
							'EXTERNAL LINK BUTTON CLICKS 4': 0,
							'EXTERNAL LINK BUTTON CLICKS 5': 0,
							'EXTERNAL LINK BUTTON CLICKS 6': 0,
							'EXTERNAL LINK BUTTON CLICKS 7': 0,
							'EXTERNAL LINK BUTTON CLICKS 8': 0,
							'EXTERNAL LINK BUTTON CLICKS 9': 0,
							'EXTERNAL LINK BUTTON CLICKS 10': 0,
							/////////////////////////////////////////////
						};
						if (dripCampData.Campaigns.length > 0) {
							let allLearnerAssignedData;
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [
										{ model: Post, attributes: ['id', 'tempType'] },
										{
											model: Assigned_post_to_user,
											attributes: ['id', 'score', 'submit', 'externalLink', 'consumed', 'max', 'percent'],
										},
									],
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let score = 0;
								let totalScoredCount = 0;
								let consumed = 0;
								let totalConsumedCount = 0;
								let actiontaken = 0;
								let scoreCount = 0;
								let externalLink1 = 0;
								let externalLink2 = 0;
								let externalLink3 = 0;
								let externalLink4 = 0;
								let externalLink5 = 0;
								let externalLink6 = 0;
								let externalLink7 = 0;
								let externalLink8 = 0;
								let externalLink9 = 0;
								let externalLink10 = 0;
								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}

									if (data && data.Assigned_post_to_user && data.Assigned_post_to_user.submit) {
										actiontaken++;
									}

									if (
										data &&
										data.Post &&
										['Quiz', 'Video', 'Carousel', 'Single Image'].indexOf(data.Post.tempType) > -1 &&
										data.Assigned_post_to_user &&
										(data.Assigned_post_to_user.score || data.Assigned_post_to_user.consumed)
									) {
										if (data.Assigned_post_to_user.consumed != null && data.Assigned_post_to_user.consumed > 0) {
											consumed = consumed + parseInt(data.Assigned_post_to_user.consumed);
											totalConsumedCount++;
										}
										if (data.Assigned_post_to_user.score != null && data.Assigned_post_to_user.score > 0) {
											score = score + parseInt(data.Assigned_post_to_user.score);
											totalScoredCount++;
										}
									}

									if (data?.Assigned_post_to_user?.externalLink != null) {
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick1) {
											externalLink1++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick2) {
											externalLink2++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick3) {
											externalLink3++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick4) {
											externalLink4++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick5) {
											externalLink5++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick6) {
											externalLink6++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick7) {
											externalLink7++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick8) {
											externalLink8++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick9) {
											externalLink9++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick10) {
											externalLink10++;
										}
									}
								}
								payload['EXTERNAL LINK BUTTON CLICKS 1'] = externalLink1;
								payload['EXTERNAL LINK BUTTON CLICKS 2'] = externalLink2;
								payload['EXTERNAL LINK BUTTON CLICKS 3'] = externalLink3;
								payload['EXTERNAL LINK BUTTON CLICKS 4'] = externalLink4;
								payload['EXTERNAL LINK BUTTON CLICKS 5'] = externalLink5;
								payload['EXTERNAL LINK BUTTON CLICKS 6'] = externalLink6;
								payload['EXTERNAL LINK BUTTON CLICKS 7'] = externalLink7;
								payload['EXTERNAL LINK BUTTON CLICKS 8'] = externalLink8;
								payload['EXTERNAL LINK BUTTON CLICKS 9'] = externalLink9;
								payload['EXTERNAL LINK BUTTON CLICKS 10'] = externalLink10;

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['DRIPS READ ON EMAIL'] = engagedCount;
								payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								payload['ACTION TAKEN'] = actiontaken;

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / engagedCount).toFixed(2);
								// }

								if (['Video', 'Carousel', 'Single Image'].indexOf(allLearnerAssignedData[0].Post.tempType) > -1) {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / actiontaken).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = Number(consumed);
								} else {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / totalScoredCount).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = score > 0 ? Number(score) : 0;
								}

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / scoreCount).toFixed(2);
								// 	payload['ACTION INTENT VALUES'] = Number(score);
								// } else {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = 0;
								// 	payload['ACTION INTENT VALUES'] = 0;
								// }

								// Check Intent Count by Using Template type
								let wherConditionForIntent = {
									CampaignId: dripCampData.Campaigns[0].id,
									// DripCampId: dripCampData.id,
									DripCampIndex: dripCampData.index,
									publishOn: {
										[Op.between]: [startDate, endDate],
									},
								};

								if (['Single Image'].indexOf(postData.tempType) > -1) {
									wherConditionForIntent.isRead = true;
								} else if (
									['Quiz', 'Poll', 'Offline Task', 'Survey', 'Quiz (Randomised)', 'Video', 'Carousel'].indexOf(
										postData.tempType
									) > -1
								) {
									wherConditionForIntent.isDripClickAction = true;
								}
								// else if (['Video'].indexOf(postData.tempType) > -1) {
								// 	wherConditionForIntent.actionStatus = 'Watched';
								// }

								[err, allLearnerIntentCount] = await to(
									Assigned_post_to_user.count({
										where: wherConditionForIntent,
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								payload['TOTAL DRIPS WHERE ACTION INTENT DISPLAYED'] = allLearnerIntentCount;

								[err, allLearnerExternalClickCount] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											DripCampIndex: dripCampData.index,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
											clickExternalLink: true,
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								//payload['TOTAL BUTTON CLICKS ON DRIP APP'] = allLearnerExternalClickCount;
								//All Drip Count Related Drip App
								[err, allLearnerAssignedData] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											// DripCampId: dripCampData.id,
											DripCampIndex: dripCampData.index,
											isRead: true,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);
								payload['TOTAL DRIPS READ ON DRIP APP'] = allLearnerAssignedData;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												// include: [
												// 	{
												// 		model: User,
												// 		attributes: ['id'],
												// 	},
												// ],
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_On_Drip_App_with_sharing_on_Email;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (DripApp with sharing on Email)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfEmailWithDrip = dripActivityReportOfEmailWithDrip;

//Only Drip App
const dripActivityReportOfOnlyhDripApp = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY (  SELECT  "Assigned_post_to_user"."PostId" FROM "Assigned_post_to_users" AS "Assigned_post_to_user" INNER JOIN "Posts" AS "Post" ON "Assigned_post_to_user"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "Assigned_post_to_user"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND "Post"."drip_type"= 'Only DripApp');`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "Assigned_post_to_user"."PostId"
				FROM "Assigned_post_to_users" AS "Assigned_post_to_user"
				INNER JOIN "Posts" AS "Post"
					ON "Assigned_post_to_user"."PostId" = "Post"."id"
					AND "Post"."ClientId" IN (:clientIds)
				WHERE "Assigned_post_to_user"."publishOn" BETWEEN :startDate AND :endDate
				AND "Post"."drip_type" = 'Only DripApp'
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
				startDate: startDateUTC, // ISO formatted date string
				endDate: endDateUTC, // ISO formatted date string
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'Only DripApp',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									where: {
										status: {
											[Op.notIn]: ['Scheduled'],
										},
									},
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);
			//console.log('-----1---', allPostData.length);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': 0,
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'TOTAL DRIPS READ ON HOME FEED': 0,
							'TOTAL DRIPS READ ON DRIP APP': 0,
							'TOTAL DRIPS ENGAGED': 0,
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED': '',
							'ACTION INTENT VALUES': 0, //==>> ACTION iNTENET vALUEs
							'ACTION TAKEN': 0,
							'DRIP AVERAGE ACTION SCORE': 0,
							//'TOTAL BUTTON CLICKS ON DRIP APP': 0, // ==> Remove

							/////////////////////////////////////////////
							'EXTERNAL LINK BUTTON CLICKS 1': 0,
							'EXTERNAL LINK BUTTON CLICKS 2': 0,
							'EXTERNAL LINK BUTTON CLICKS 3': 0,
							'EXTERNAL LINK BUTTON CLICKS 4': 0,
							'EXTERNAL LINK BUTTON CLICKS 5': 0,
							'EXTERNAL LINK BUTTON CLICKS 6': 0,
							'EXTERNAL LINK BUTTON CLICKS 7': 0,
							'EXTERNAL LINK BUTTON CLICKS 8': 0,
							'EXTERNAL LINK BUTTON CLICKS 9': 0,
							'EXTERNAL LINK BUTTON CLICKS 10': 0,

							/////////////////////////////////////////////
						};
						if (dripCampData.Campaigns.length > 0) {
							let allLearnerAssignedData;
							[err, allLearnerAssignedData] = await to(
								Assigned_post_to_user.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										// DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [{ model: Post, attributes: ['id', 'tempType'] }],
									attributes: [
										'isRead',
										'isDripClickAction',
										'publishOn',
										'isPublished',
										'isLoadOnHome',
										'score',
										'submit',
										'externalLink',
										'consumed',
									],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let homeFeedCount = 0;
								let score = 0;
								let totalScoredCount = 0;
								let consumed = 0;
								let totalConsumedCount = 0;
								let actiontaken = 0;
								let scoreCount = 0;
								let externalLinkClick1 = 0;
								let externalLinkClick2 = 0;
								let externalLinkClick3 = 0;
								let externalLinkClick4 = 0;
								let externalLinkClick5 = 0;
								let externalLinkClick6 = 0;
								let externalLinkClick7 = 0;
								let externalLinkClick8 = 0;
								let externalLinkClick9 = 0;
								let externalLinkClick10 = 0;

								for (let data of allLearnerAssignedData) {
									if (data.isDripClickAction) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.isRead) {
										deliveredCount++;
										sentCount++;
									} else if (moment().isSameOrAfter(data.publishOn) && data.isPublished) {
										sentCount++;
									}
									if (data.isLoadOnHome) {
										homeFeedCount++;
									}

									if (data && data.submit) {
										actiontaken++;
									}

									if (
										data &&
										data.Post &&
										['Quiz', 'Video', 'Carousel', 'Single Image'].indexOf(data.Post.tempType) > -1 &&
										(data.score || data.consumed)
									) {
										if (data.consumed != null && data.consumed > 0) {
											consumed = consumed + parseInt(data.consumed);
											totalConsumedCount++;
										}
										if (data.score != null && data.score > 0) {
											score = score + parseInt(data.score);
											totalScoredCount++;
										}
									}

									if (data.externalLink != null) {
										if (data?.externalLink?.externalLinkClick1) {
											externalLinkClick1++;
										}
										if (data?.externalLink?.externalLinkClick2) {
											externalLinkClick2++;
										}
										if (data?.externalLink?.externalLinkClick3) {
											externalLinkClick3++;
										}
										if (data?.externalLink?.externalLinkClick4) {
											externalLinkClick4++;
										}
										if (data?.externalLink?.externalLinkClick5) {
											externalLinkClick5++;
										}
										if (data?.externalLink?.externalLinkClick6) {
											externalLinkClick6++;
										}
										if (data?.externalLink?.externalLinkClick7) {
											externalLinkClick7++;
										}
										if (data?.externalLink?.externalLinkClick8) {
											externalLinkClick8++;
										}
										if (data?.externalLink?.externalLinkClick9) {
											externalLinkClick9++;
										}
										if (data?.externalLink?.externalLinkClick10) {
											externalLinkClick10++;
										}
									}
								}

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['TOTAL DRIPS READ ON HOME FEED'] = homeFeedCount;
								payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								payload['ACTION TAKEN'] = actiontaken;
								payload['EXTERNAL LINK BUTTON CLICKS 1'] = externalLinkClick1;
								payload['EXTERNAL LINK BUTTON CLICKS 2'] = externalLinkClick2;
								payload['EXTERNAL LINK BUTTON CLICKS 3'] = externalLinkClick3;
								payload['EXTERNAL LINK BUTTON CLICKS 4'] = externalLinkClick4;
								payload['EXTERNAL LINK BUTTON CLICKS 5'] = externalLinkClick5;
								payload['EXTERNAL LINK BUTTON CLICKS 6'] = externalLinkClick6;
								payload['EXTERNAL LINK BUTTON CLICKS 7'] = externalLinkClick7;
								payload['EXTERNAL LINK BUTTON CLICKS 8'] = externalLinkClick8;
								payload['EXTERNAL LINK BUTTON CLICKS 9'] = externalLinkClick9;
								payload['EXTERNAL LINK BUTTON CLICKS 10'] = externalLinkClick10;

								// if (score && score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / engagedCount).toFixed(2);
								// }

								if (['Video', 'Carousel', 'Single Image'].indexOf(allLearnerAssignedData[0].Post.tempType) > -1) {
									if (consumed > 0) {
										payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / actiontaken).toFixed(2) : 0;
										payload['ACTION INTENT VALUES'] = consumed > 0 ? Number(consumed) : 0;
									} else {
										payload['DRIP AVERAGE ACTION SCORE'] = 0;
										payload['ACTION INTENT VALUES'] = 0;
									}
								} else {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / totalScoredCount).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = score > 0 ? Number(score) : 0;
								}

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / scoreCount).toFixed(2);
								// 	payload['ACTION INTENT VALUES'] = Number(score);
								// } else {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = 0;
								// 	payload['ACTION INTENT VALUES'] = 0;
								// }

								//All Drip Count Related Drip App
								[err, allLearnerAssignedData] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											// DripCampId: dripCampData.id,
											DripCampIndex: dripCampData.index,
											isRead: true,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);
								payload['TOTAL DRIPS READ ON DRIP APP'] = allLearnerAssignedData;

								// Check Intent Count by Using Template type
								let wherConditionForIntent = {
									CampaignId: dripCampData.Campaigns[0].id,
									// DripCampId: dripCampData.id,
									DripCampIndex: dripCampData.index,
									publishOn: {
										[Op.between]: [startDate, endDate],
									},
								};

								if (['Single Image'].indexOf(postData.tempType) > -1) {
									wherConditionForIntent.isRead = true;
								} else if (
									['Quiz', 'Poll', 'Offline Task', 'Survey', 'Quiz (Randomised)', 'Video', 'Carousel'].indexOf(
										postData.tempType
									) > -1
								) {
									wherConditionForIntent.isDripClickAction = true;
								}
								// else if (['Video'].indexOf(postData.tempType) > -1) {
								// 	wherConditionForIntent.actionStatus = 'Watched';
								// }

								[err, allLearnerIntentCount] = await to(
									Assigned_post_to_user.count({
										where: wherConditionForIntent,
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								payload['TOTAL DRIPS WHERE ACTION INTENT DISPLAYED'] = allLearnerIntentCount;

								[err, allLearnerExternalClickCount] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											DripCampIndex: dripCampData.index,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
											clickExternalLink: true,
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								//payload['TOTAL BUTTON CLICKS ON DRIP APP'] = allLearnerExternalClickCount;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												// include: [
												// 	{
												// 		model: User,
												// 		attributes: ['id'],
												// 	},
												// ],
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_Only_on_Drip_App;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (Only DripApp)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfOnlyhDripApp = dripActivityReportOfOnlyhDripApp;

//Only Email Drip
const dripActivityReportOfOnlyEmailDrip = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		// let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND  "CampWhatsAppEmailDrip"."dripType"= 'Only Email');`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "CampWhatsAppEmailDrip"."PostId"
				FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip"
				INNER JOIN "Posts" AS "Post"
					ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id"
					AND "Post"."ClientId" IN (:clientIds)
				WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN :startDate AND :endDate
				AND "CampWhatsAppEmailDrip"."dripType" = 'Only Email'
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
				startDate: startDateUTC, // ISO formatted date string
				endDate: endDateUTC, // ISO formatted date string
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'Only Email',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);
			//console.log('-----1---', allPostData.length);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': 0,
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'DRIPS READ ON EMAIL': 0,
						};
						if (dripCampData.Campaigns.length > 0) {
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [{ model: Post, attributes: ['id', 'tempType'] }],
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let score = 0;
								// let actiontaken = 0;
								let scoreCount = 0;
								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}

									// if (data && data.Assigned_post_to_user && data.Assigned_post_to_user.submit) {
									// 	actiontaken++;
									// }

									// if (
									// 	data &&
									// 	data.Post &&
									// 	['Quiz', 'Video', 'Carousel'].indexOf(data.Post.tempType) > -1 &&
									// 	data.Assigned_post_to_user &&
									// 	data.Assigned_post_to_user.score
									// ) {
									// 	if (data.Assigned_post_to_user.score > 0) {
									// 		score = score + parseInt(data.Assigned_post_to_user.score);
									// 		scoreCount++;
									// 	}
									// }
								}

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['DRIPS READ ON EMAIL'] = engagedCount;
								// payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								// payload['ACTION TAKEN'] = actiontaken;

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / engagedCount).toFixed(2);
								// }

								// if (score > 0) {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = Number(score / scoreCount).toFixed(2);
								// 	payload['ACTION INTENT VALUES'] = Number(score);
								// } else {
								// 	payload['DRIP AVERAGE ACTION SCORE'] = 0;
								// 	payload['ACTION INTENT VALUES'] = 0;
								// }

								// Check Intent Count by Using Template type
								// let wherConditionForIntent = {
								// 	CampaignId: dripCampData.Campaigns[0].id,
								// 	// DripCampId: dripCampData.id,
								// 	DripCampIndex: dripCampData.index,
								// 	publishOn: {
								// 		[Op.between]: [startDate, endDate],
								// 	},
								// };

								// if (['Single Image', 'Carousel'].indexOf(postData.tempType) > -1) {
								// 	wherConditionForIntent.isRead = true;
								// } else if (
								// 	['Quiz', 'Poll', 'Offline Task', 'Survey', 'Quiz (Randomised)'].indexOf(postData.tempType) > -1
								// ) {
								// 	wherConditionForIntent.isDripClickAction = true;
								// } else if (['Video'].indexOf(postData.tempType) > -1) {
								// 	wherConditionForIntent.actionStatus = 'Watched';
								// }

								// [err, allLearnerIntentCount] = await to(
								// 	Assigned_post_to_user.count({
								// 		where: wherConditionForIntent,
								// 	})
								// );
								// if (err) return ResponseError(res, err, 500, true);

								// payload['TOTAL DRIPS WHERE ACTION INTENT DISPLAYED'] = allLearnerIntentCount;

								// [err, allLearnerExternalClickCount] = await to(
								// 	Assigned_post_to_user.count({
								// 		where: {
								// 			CampaignId: dripCampData.Campaigns[0].id,
								// 			DripCampIndex: dripCampData.index,
								// 			publishOn: {
								// 				[Op.between]: [startDate, endDate],
								// 			},
								// 			clickExternalLink: true,
								// 		},
								// 	})
								// );
								// if (err) return ResponseError(res, err, 500, true);

								// payload['TOTAL BUTTON CLICKS ON DRIP APP'] = allLearnerExternalClickCount;
								//All Drip Count Related Drip App
								// [err, allLearnerAssignedData] = await to(
								// 	Assigned_post_to_user.count({
								// 		where: {
								// 			CampaignId: dripCampData.Campaigns[0].id,
								// 			// DripCampId: dripCampData.id,
								// 			DripCampIndex: dripCampData.index,
								// 			isRead: true,
								// 			publishOn: {
								// 				[Op.between]: [startDate, endDate],
								// 			},
								// 		},
								// 	})
								// );
								// if (err) return ResponseError(res, err, 500, true);
								// payload['TOTAL DRIPS READ ON DRIP APP'] = allLearnerAssignedData;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												// include: [
												// 	{
												// 		model: User,
												// 		attributes: ['id'],
												// 	},
												// ],
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_On_Only_on_Email;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (Only Email)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfOnlyEmailDrip = dripActivityReportOfOnlyEmailDrip;

//Only Teams Drip Report
const dripActivityReportOfOnlyTeamsDrip = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND  "CampWhatsAppEmailDrip"."dripType"= 'Only Teams');`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
		SELECT ARRAY (
			SELECT "CampWhatsAppEmailDrip"."PostId"
			FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip"
			INNER JOIN "Posts" AS "Post"
				ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id"
				AND "Post"."ClientId" IN (:clientIds)
			WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN :startDate AND :endDate
			AND "CampWhatsAppEmailDrip"."dripType" = 'Only Teams'
		);
	`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
				startDate: startDateUTC, // ISO formatted date string (YYYY-MM-DD)
				endDate: endDateUTC, // ISO formatted date string (YYYY-MM-DD)
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'Only Teams',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': 0,
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'DRIPS READ ON TEAMS': 0,
						};
						if (dripCampData.Campaigns.length > 0) {
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [{ model: Post, attributes: ['id', 'tempType'] }],
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let score = 0;

								let scoreCount = 0;
								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}
								}

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['DRIPS READ ON TEAMS'] = engagedCount;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_On_Only_on_Teams;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (Only Teams)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfOnlyTeamsDrip = dripActivityReportOfOnlyTeamsDrip;

//Teams With Drip
const dripActivityReportOfTeamsWithDrip = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalData = [];

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY (  SELECT  "CampWhatsAppEmailDrip"."PostId" FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip" INNER JOIN "Posts" AS "Post" ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id" AND "Post"."ClientId" IN (${clientIds.toString()}) WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN '${startDate}' AND '${endDate}' AND  "CampWhatsAppEmailDrip"."dripType"= 'DripApp with sharing on Teams');`;
		// [allPosts] = await sequelize.query(query_);
		let query_ = `
			SELECT ARRAY (
				SELECT "CampWhatsAppEmailDrip"."PostId"
				FROM "CampWhatsAppEmailDrips" AS "CampWhatsAppEmailDrip"
				INNER JOIN "Posts" AS "Post"
					ON "CampWhatsAppEmailDrip"."PostId" = "Post"."id"
					AND "Post"."ClientId" IN (:clientIds)
				WHERE "CampWhatsAppEmailDrip"."publishOn" BETWEEN :startDate AND :endDate
				AND "CampWhatsAppEmailDrip"."dripType" = 'DripApp with sharing on Teams'
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
				startDate: startDateUTC, // The start date in ISO format (YYYY-MM-DD)
				endDate: endDateUTC, // The end date in ISO format (YYYY-MM-DD)
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		allDripId = [...new Set(allDripId)];

		let postIdBatch = [];
		let idsList = [];
		for (let id of allDripId) {
			if (idsList.length !== 100) {
				idsList.push(id);
			} else {
				postIdBatch.push({
					ids: idsList,
				});
				idsList = [id];
			}
		}
		if (idsList.length > 0)
			postIdBatch.push({
				ids: idsList,
			});

		for (let data of postIdBatch) {
			[err, allPostData] = await to(
				Post.findAll({
					where: {
						id: data.ids,
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							where: {
								dripType: 'DripApp with sharing on Teams',
							},
							include: [
								{
									model: Campaign,
									include: [
										{
											model: User,
											attributes: ['id', 'local_user_id'],
											include: [{ model: Market, attributes: ['id', 'db_name'] }],
										},
									],
									attributes: ['id', 'title', 'createdAt', 'status'],
								},
							],
							attributes: ['id', 'index'],
						},
						{
							model: User,
							attributes: ['id', 'local_user_id'],
							include: [{ model: Market, attributes: ['id', 'db_name'] }],
						},
					],
					attributes: ['createdAt', 'drip_status', 'drip_title', 'id', 'tempType'],
					order: [['id', 'DESC']],
				})
			);
			if (err) console.log(err);
			//console.log('-----1---', allPostData.length);

			if (allPostData && allPostData.length > 0) {
				let count = 1;
				for (let postData of allPostData) {
					let postCreateBy = '';
					if (postData && postData.User && postData.User.Market) {
						[err, localUser] = await to(
							dbInstance[postData.User.Market.db_name].User_master.findOne({
								where: {
									id: postData.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUser) {
							postCreateBy = localUser.first + ' ' + localUser.last;
						}
					}
					//Collect Post Data
					for (let dripCampData of postData.Drip_camps) {
						let campaignCreateBy = '';
						if (
							dripCampData.Campaigns &&
							dripCampData.Campaigns.length > 0 &&
							dripCampData.Campaigns[0].User &&
							dripCampData.Campaigns[0].User.Market
						) {
							[err, localUser] = await to(
								dbInstance[dripCampData.Campaigns[0].User.Market.db_name].User_master.findOne({
									where: {
										id: dripCampData.Campaigns[0].User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (localUser) {
								campaignCreateBy = localUser.first + ' ' + localUser.last;
							}
						}

						let payload = {
							'SR NO': count,
							'DRIP ID': postData.id,
							'DRIP NAME': postData.drip_title,
							'DRIP STATUS': postData.drip_status,
							'DRIP CREATED BY': postCreateBy,
							'DRIP CREATED DATE': ' ' + moment(postData.createdAt).format('YYYY-MM-DD'),
							'DRIP FLOW ID': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].id : '',
							'DRIP FLOW NAME': dripCampData.Campaigns.length > 0 ? dripCampData.Campaigns[0].title : '',
							'DRIP FLOW CREATED BY': campaignCreateBy,
							'DRIP FLOW CREATED DATE':
								dripCampData.Campaigns.length > 0
									? ' ' + moment(dripCampData.Campaigns[0].createdAt).format('YYYY-MM-DD')
									: '',
							'CONTACT TARGETED IN DRIP FLOW': 0,
							'DRIP FLOW STATUS': dripCampData.Campaigns.length > 0 && dripCampData.Campaigns[0].status,
							'TOTAL DRIPS SCHEDULED': 0,
							'TOTAL DRIPS SENT': 0,
							'TOTAL DRIPS DELIVERED': 0,
							'DRIPS READ ON TEAMS': 0,
							'TOTAL DRIPS READ ON DRIP APP': 0,
							'TOTAL DRIPS ENGAGED': 0,
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED': '',
							'ACTION INTENT VALUES': 0,
							'ACTION TAKEN': 0,
							'DRIP AVERAGE ACTION SCORE': 0,

							/////////////////////////////////////////////
							'EXTERNAL LINK BUTTON CLICKS 1': 0,
							'EXTERNAL LINK BUTTON CLICKS 2': 0,
							'EXTERNAL LINK BUTTON CLICKS 3': 0,
							'EXTERNAL LINK BUTTON CLICKS 4': 0,
							'EXTERNAL LINK BUTTON CLICKS 5': 0,
							'EXTERNAL LINK BUTTON CLICKS 6': 0,
							'EXTERNAL LINK BUTTON CLICKS 7': 0,
							'EXTERNAL LINK BUTTON CLICKS 8': 0,
							'EXTERNAL LINK BUTTON CLICKS 9': 0,
							'EXTERNAL LINK BUTTON CLICKS 10': 0,
							/////////////////////////////////////////////
						};
						if (dripCampData.Campaigns.length > 0) {
							let allLearnerAssignedData;
							[err, allLearnerAssignedData] = await to(
								CampWhatsAppEmailDrip.findAll({
									where: {
										CampaignId: dripCampData.Campaigns[0].id,
										DripCampId: dripCampData.id,
										DripCampIndex: dripCampData.index,
										publishOn: {
											[Op.between]: [startDate, endDate],
										},
									},
									include: [
										{ model: Post, attributes: ['id', 'tempType'] },
										{
											model: Assigned_post_to_user,
											attributes: ['id', 'score', 'submit', 'externalLink', 'consumed', 'max', 'percent'],
										},
									],
									attributes: ['readDate', 'deliveryDate', 'sentDate', 'isTriggered'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//All Drip Count related WhatsApp
							if (allLearnerAssignedData && allLearnerAssignedData.length > 0) {
								let scheduledCount = allLearnerAssignedData.length;
								let sentCount = 0;
								let deliveredCount = 0;
								let engagedCount = 0;
								let score = 0;
								let totalScoredCount = 0;
								let consumed = 0;
								let totalConsumedCount = 0;
								let actiontaken = 0;
								let externalLink1 = 0;
								let externalLink2 = 0;
								let externalLink3 = 0;
								let externalLink4 = 0;
								let externalLink5 = 0;
								let externalLink6 = 0;
								let externalLink7 = 0;
								let externalLink8 = 0;
								let externalLink9 = 0;
								let externalLink10 = 0;
								for (let data of allLearnerAssignedData) {
									if (data.readDate) {
										engagedCount++;
										deliveredCount++;
										sentCount++;
									} else if (data.deliveryDate) {
										deliveredCount++;
										sentCount++;
									} else if (data.sentDate || data.isTriggered) {
										sentCount++;
									}

									if (data && data.Assigned_post_to_user && data.Assigned_post_to_user.submit) {
										actiontaken++;
									}

									if (
										data &&
										data.Post &&
										['Quiz', 'Video', 'Carousel', 'Single Image'].indexOf(data.Post.tempType) > -1 &&
										data.Assigned_post_to_user &&
										(data.Assigned_post_to_user.score || data.Assigned_post_to_user.consumed)
									) {
										if (data.Assigned_post_to_user.consumed != null && data.Assigned_post_to_user.consumed > 0) {
											consumed = consumed + parseInt(data.Assigned_post_to_user.consumed);
											totalConsumedCount++;
										}
										if (data.Assigned_post_to_user.score != null && data.Assigned_post_to_user.score > 0) {
											score = score + parseInt(data.Assigned_post_to_user.score);
											totalScoredCount++;
										}
									}

									if (data?.Assigned_post_to_user?.externalLink != null) {
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick1) {
											externalLink1++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick2) {
											externalLink2++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick3) {
											externalLink3++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick4) {
											externalLink4++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick5) {
											externalLink5++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick6) {
											externalLink6++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick7) {
											externalLink7++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick8) {
											externalLink8++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick9) {
											externalLink9++;
										}
										if (data?.Assigned_post_to_user?.externalLink?.externalLinkClick10) {
											externalLink10++;
										}
									}
								}

								payload['EXTERNAL LINK BUTTON CLICKS 1'] = externalLink1;
								payload['EXTERNAL LINK BUTTON CLICKS 2'] = externalLink2;
								payload['EXTERNAL LINK BUTTON CLICKS 3'] = externalLink3;
								payload['EXTERNAL LINK BUTTON CLICKS 4'] = externalLink4;
								payload['EXTERNAL LINK BUTTON CLICKS 5'] = externalLink5;
								payload['EXTERNAL LINK BUTTON CLICKS 6'] = externalLink6;
								payload['EXTERNAL LINK BUTTON CLICKS 7'] = externalLink7;
								payload['EXTERNAL LINK BUTTON CLICKS 8'] = externalLink8;
								payload['EXTERNAL LINK BUTTON CLICKS 9'] = externalLink9;
								payload['EXTERNAL LINK BUTTON CLICKS 10'] = externalLink10;

								payload['TOTAL DRIPS SCHEDULED'] = scheduledCount;
								payload['TOTAL DRIPS SENT'] = sentCount;
								payload['TOTAL DRIPS DELIVERED'] = deliveredCount;
								payload['DRIPS READ ON TEAMS'] = engagedCount;
								payload['TOTAL DRIPS ENGAGED'] = engagedCount;
								payload['ACTION TAKEN'] = actiontaken;

								if (['Video', 'Carousel', 'Single Image'].indexOf(allLearnerAssignedData[0].Post.tempType) > -1) {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / actiontaken).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = Number(consumed);
								} else {
									payload['DRIP AVERAGE ACTION SCORE'] = score > 0 ? Number(score / totalScoredCount).toFixed(2) : 0;
									payload['ACTION INTENT VALUES'] = score > 0 ? Number(score) : 0;
								}

								// Check Intent Count by Using Template type
								let wherConditionForIntent = {
									CampaignId: dripCampData.Campaigns[0].id,
									// DripCampId: dripCampData.id,
									DripCampIndex: dripCampData.index,
									publishOn: {
										[Op.between]: [startDate, endDate],
									},
								};

								if (['Single Image'].indexOf(postData.tempType) > -1) {
									wherConditionForIntent.isRead = true;
								} else if (
									['Quiz', 'Poll', 'Offline Task', 'Survey', 'Quiz (Randomised)', 'Video', 'Carousel'].indexOf(
										postData.tempType
									) > -1
								) {
									wherConditionForIntent.isDripClickAction = true;
								}

								[err, allLearnerIntentCount] = await to(
									Assigned_post_to_user.count({
										where: wherConditionForIntent,
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								payload['TOTAL DRIPS WHERE ACTION INTENT DISPLAYED'] = allLearnerIntentCount;

								[err, allLearnerExternalClickCount] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											DripCampIndex: dripCampData.index,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
											clickExternalLink: true,
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								//All Drip Count Related Drip App
								[err, allLearnerAssignedData] = await to(
									Assigned_post_to_user.count({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
											DripCampIndex: dripCampData.index,
											isRead: true,
											publishOn: {
												[Op.between]: [startDate, endDate],
											},
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);
								payload['TOTAL DRIPS READ ON DRIP APP'] = allLearnerAssignedData;

								//Campaign Target Learner Count Count
								[err, user_group_camp_list] = await to(
									Campaign_user_group_mapping.findAll({
										where: {
											CampaignId: dripCampData.Campaigns[0].id,
										},
										include: [
											{
												model: User_group,
												attributes: ['id', 'userCount'],
											},
										],
										attributes: ['CampaignId'],
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								let learnerCount = 0;
								if (user_group_camp_list && user_group_camp_list.length > 0) {
									for (let userGroup of user_group_camp_list) {
										learnerCount = learnerCount + userGroup.User_group.userCount;
									}
								}
								payload['CONTACT TARGETED IN DRIP FLOW'] = learnerCount;
								finalData.push(payload);
								count++;
							}
						}
					}
				}
			}
		}
		let notifcationMessage = MESSAGE.Report_On_Drip_App_with_sharing_on_Teams;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Channel Wise Activity Report (DripApp with sharing on Teams)`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripActivityReportOfTeamsWithDrip = dripActivityReportOfTeamsWithDrip;

const getWhatsAppDeliveryReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});
		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		let enableRetry = false;
		// let clientIds = await getAllSubChildClientIds(req.body.clientId);
		// clientIds.push(req.body.clientId);
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (${clientIds.toString()}) );`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "id"
				FROM "Posts"
				WHERE "ClientId" IN (:clientIds)
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
			},
			type: sequelize.QueryTypes.SELECT,
		});

		//Get WhatsApp Setup and Check Retry Toggle is Of or Not
		[err, whatsAppSetupDetails] = await to(
			ClientWhatsAppSetup.findOne({
				where: {
					ClientId: req.body.clientId,
				},
				include: [{ model: WhatsAppSetup, attributes: ['id', 'enableRetry'] }],
				attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		console.log('-------whatsAppSetupDetails--------', whatsAppSetupDetails.convertToJSON());

		if (whatsAppSetupDetails?.WhatsAppSetup?.enableRetry == true) {
			enableRetry = true;
		}

		let allDripId = allPosts[0].array;
		if (allDripId.length > 0) {
			[err, getDeliverData] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						PostId: allDripId,
						[Op.or]: {
							isTriggered: true,
							retryCount: {
								[Op.ne]: null,
							},
						},
						dripType: ['Only WhatsApp', 'DripApp with sharing on WhatsApp'],
						publishOn: {
							[Op.between]: [startDate, endDate],
						},
					},
					include: [
						{
							model: Post,
							include: [
								{
									model: Drip_whatsapp_native,
									attributes: [
										'id',
										'templateId',
										'templateStatus',
										'tempCategory',
										'tempLang',
										'tempName',
										'trackableLink',
										'trackableLink2',
									],
								},
								{
									model: Drip_whatsapp_non_native,
									attributes: ['id', 'templateId', 'templateStatus', 'tempCategory', 'tempLang', 'tempName'],
								},
							],
							attributes: ['id', 'ClientId', 'drip_status', 'drip_type'],
						},
						{
							model: User,
							attributes: ['id', 'account_id', 'tags'],
							include: [
								{
									model: Client,
									through: 'User_role_client_mapping',
									required: true,
									attributes: ['client_id'],
								},
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									required: false,
									attributes: ['job_role_name'],
								},
							],
						},
						{
							model: Campaign,
							attributes: ['ClientId'],
							include: [
								{
									model: Client,
									attributes: ['name'],
								},
							],
						},
					],
					order: [['publishOn', 'DESC']],
					attributes: [
						'id',
						'CampaignId',
						'PostId',
						'publishOn',
						'createdAt',
						'UserId',
						'status',
						'WAppTriggerId',
						'WTriggerTime',
						'sentDate',
						'deliveryDate',
						'readDate',
						'clickDate',
						'templateId',
						'templateName',
						'mailMessageId',
						'errorMessage',
						'cause',
						'clickExternalLink',
						'clickExternalLinkDate',
						'retryCount',
						'isTriggered',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			finalList = [];
			finalList = getDeliverData;
		}
		let notifcationMessage = MESSAGE.Report_Whatsapp_Delivery;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download WhatsApp Delivery Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
			enableRetry: enableRetry,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWhatsAppDeliveryReport = getWhatsAppDeliveryReport;

const getEmailDeliveryReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});
		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];

		// let clientIds = await getAllSubChildClientIds(req.body.clientId);
		// clientIds.push(req.body.clientId);
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (${clientIds.toString()}) );`;

		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "id"
				FROM "Posts"
				WHERE "ClientId" IN (:clientIds)
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Array of clientIds
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		if (allDripId.length > 0) {
			[err, getDeliverData] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						PostId: allDripId,
						isTriggered: true,
						// EmailTriggerId: {
						//   [Op.ne]: null,
						// },
						dripType: ['Only Email', 'DripApp with sharing on Email'],
						publishOn: {
							[Op.between]: [startDate, endDate],
						},
					},
					include: [
						{
							model: Post,
							include: [
								{
									model: Drip_only_email,
									attributes: ['id', 'email_subject_line'],
								},
								{
									model: Drip_email_non_native,
									attributes: ['id', 'email_subject_line'],
								},
							],
							attributes: ['id', 'ClientId', 'drip_status', 'drip_type'],
						},
						{
							model: User,
							attributes: ['id', 'account_id'],
						},
					],
					attributes: [
						'id',
						'CampaignId',
						'PostId',
						'publishOn',
						'createdAt',
						'UserId',
						'status',
						'EmailTriggerId',
						'sentDate',
						'deliveryDate',
						'readDate',
						'clickDate',
						'templateId',
						'templateName',
						'mailMessageId',
						'errorMessage',
					],
					order: [['publishOn', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			finalList = [];
			finalList = getDeliverData;
		}
		let notifcationMessage = MESSAGE.Report_Email_Delivery;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Email Delivery Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getEmailDeliveryReport = getEmailDeliveryReport;

const getTeamsDeliveryReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (${clientIds.toString()}) );`;
		// [allPosts] = await sequelize.query(query_);

		let query_ = `
			SELECT ARRAY (
				SELECT "id"
				FROM "Posts"
				WHERE "ClientId" IN (:clientIds)
			);
		`;

		allPosts = await sequelize.query(query_, {
			replacements: {
				clientIds: clientIds, // Pass the array of clientIds securely
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let allDripId = allPosts[0].array;
		if (allDripId.length > 0) {
			[err, getDeliverData] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						PostId: allDripId,
						isTriggered: true,
						dripType: ['Only Teams', 'DripApp with sharing on Teams'],
						publishOn: {
							[Op.between]: [startDate, endDate],
						},
					},
					include: [
						{
							model: Post,
							attributes: ['id', 'ClientId', 'drip_status', 'drip_type'],
						},
						{
							model: User,
							attributes: ['id', 'account_id', 'tags'],
							include: [
								{
									model: Client,
									through: 'User_role_client_mapping',
									required: true,
									attributes: ['client_id'],
								},
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									required: false,
									attributes: ['job_role_name'],
								},
							],
						},
					],
					order: [['publishOn', 'DESC']],
					attributes: [
						'id',
						'CampaignId',
						'PostId',
						'publishOn',
						'createdAt',
						'UserId',
						'status',
						'cause',
						'TeamTiggerId',
						'WTriggerTime',
						'sentDate',
						'deliveryDate',
						'readDate',
						'clickDate',
						'errorMessage',
						'clickExternalLink',
						'clickExternalLinkDate',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			finalList = [];
			finalList = getDeliverData;
		}
		let notifcationMessage = MESSAGE.Report_Teams_Delivery;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Microsoft Teams Delivery Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTeamsDeliveryReport = getTeamsDeliveryReport;

const getBotMessageReport = async function (req, res) {
	try {
		// let startDate = req.body.startDate;
		// let endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		[err, botMessageData] = await to(
			Bot_send_msg.findAll({
				where: {
					createdAt: {
						[Op.between]: [startDate, endDate],
					},
					ClientId: clientIds,
				},
				include: [
					{
						model: Post,
						attributes: ['id', 'drip_title'],
						required: false,
					},
					{
						model: User,
						attributes: ['id', 'account_id'],
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let notifcationMessage = MESSAGE.Report_Incoming_Messages;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Incoming Message Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: botMessageData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getBotMessageReport = getBotMessageReport;

const getWhatsAppOptInDeliveryReport = async function (req, res) {
	try {
		// let clientIds = await getAllSubChildClientIds(req.body.clientId);
		// clientIds.push(req.body.clientId);
		// let startDate = req.body.startDate;
		// let endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		if (startDate && endDate) {
			[err, allUsers] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: clientIds,
						RoleId: 1,
					},
					include: [
						{
							model: User,
							attributes: [
								'id',
								'account_id',
								'opt_in',
								'opt_id',
								'opt_out',
								'otp_update_at',
								'otp_out_at',
								'optTrigger',
								'optError',
								'haveWhatsAppOptIn',
								'createdAt',
							],
							where: {
								createdAt: {
									[Op.between]: [startDate, endDate],
								},
							},
						},
					],
					attributes: [],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else {
			[err, allUsers] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: clientIds,
						RoleId: 1,
					},
					include: [
						{
							model: User,
							attributes: [
								'id',
								'account_id',
								'opt_in',
								'opt_id',
								'opt_out',
								'otp_update_at',
								'otp_out_at',
								'optTrigger',
								'optError',
								'haveWhatsAppOptIn',
								'createdAt',
							],
						},
					],
					attributes: [],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}
		let notifcationMessage = MESSAGE.Report_Whatsapp_Opt_in_Status;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download WhatsApp Opt-in Status Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: allUsers,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWhatsAppOptInDeliveryReport = getWhatsAppOptInDeliveryReport;

const getCustomReport = async function (req, res) {
	try {
		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		const schema = Joi.object({
			selectedCustomReportName: Joi.string().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { selectedCustomReportName: templateName, startDate, endDate, clientId } = value;
		let finalList = [];

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		// let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (${clientIds.toString()}) );`;
		// [allPosts] = await sequelize.query(query_);
		// need to validtion for clientIds
		let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (:clientIds) );`;
		const allPosts = await sequelize.query(query_, {
			replacements: { clientIds },
			type: Sequelize.QueryTypes.SELECT,
		});

		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		let allDripId = allPosts[0].array;
		if (allDripId.length > 0) {
			[err, getDeliverData] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						PostId: allDripId,
						isTriggered: true,
						dripType: ['Only WhatsApp', 'DripApp with sharing on WhatsApp'],
						publishOn: {
							[Op.between]: [startDate, endDate],
						},
					},
					include: [
						{
							model: Post,
							include: [
								{
									model: Drip_whatsapp_native,
									attributes: [
										'id',
										'templateId',
										'templateStatus',
										'tempCategory',
										'tempLang',
										'tempName',
										'trackableLink',
										'trackableLink2',
									],
								},
								{
									model: Drip_whatsapp_non_native,
									attributes: ['id', 'templateId', 'templateStatus', 'tempCategory', 'tempLang', 'tempName'],
								},
							],
							attributes: ['id', 'ClientId', 'drip_status', 'drip_type'],
						},
						{
							model: User,
							attributes: ['id', 'account_id', 'tags'],
							include: [
								{
									model: Client,
									through: 'User_role_client_mapping',
									required: true,
									attributes: ['client_id', 'name'],
								},
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									required: false,
									attributes: ['job_role_name'],
								},
							],
						},
					],
					order: [['publishOn', 'DESC']],
					attributes: [
						'id',
						'CampaignId',
						'PostId',
						'publishOn',
						'createdAt',
						'UserId',
						'status',
						'WAppTriggerId',
						'WTriggerTime',
						'sentDate',
						'deliveryDate',
						'readDate',
						'clickDate',
						'templateId',
						'templateName',
						'mailMessageId',
						'errorMessage',
						'cause',
						'clickExternalLink',
						'clickExternalLinkDate',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			finalList = [];
			finalList = getDeliverData;
		}

		let finalData = [];
		let count = 0;
		for (let item_ of finalList) {
			let item = item_.convertToJSON();
			let templateId;
			let category;
			count++;

			if (item.Post && item.Post.Drip_whatsapp_natives && item.Post.Drip_whatsapp_natives.length > 0) {
				templateId = item.Post.Drip_whatsapp_natives[0].templateId;
				category = item.Post.Drip_whatsapp_natives[0].tempCategory;
			} else if (item.Post && item.Post.Drip_whatsapp_non_natives && item.Post.Drip_whatsapp_non_natives.length > 0) {
				templateId = item.Post.Drip_whatsapp_non_natives[0].templateId;
				category = item.Post.Drip_whatsapp_non_natives[0].tempCategory;
			}

			let tags = item.User && item.User.tags ? item.User.tags : null;
			let tagDatas = tags ? tags.split(',') : null;
			// let jobRole;

			//check job role based on delear code
			// if (templateName == 'HMCL') {
			// 	if (tagDatas && tagDatas[1] === '0') {
			// 		jobRole =
			// 			item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
			// 				? item.User.Client_job_roles[0].job_role_name
			// 				: null;
			// 	}
			// } else if (templateName == 'OnlyDealer') {
			// 	if (tagDatas && tagDatas[1] !== '0') {
			// 		jobRole =
			// 			item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
			// 				? item.User.Client_job_roles[0].job_role_name
			// 				: null;
			// 	}
			// }

			let payload = {
				SRNO: count,
				ACCOUNTID: item.User && item.User.account_id ? item.User.account_id : null,
				MESSAGEID: item.WAppTriggerId ? item.WAppTriggerId : null,
				TYPE: 'Template',
				DATE: item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : null,
				SENT: item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : null,
				DELIVERED: item.deliveryDate ? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss') : null,
				READ: item.readDate ? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss') : null,
				FAIL: item.failDate ? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss') : null,
				STATUS: item.status ? item.status : null,
				CAUSE: item.status ? item.status : null,
				CHANNEL: 'Whatsapp',
				TEMPLATEID: templateId ? templateId : null,
				DELIVERYCODE: item.deliveryCode ? item.deliveryCode : null,
				CATEGORY: category ? category : null,
				PRICINGCATEGORY: category ? category : null,
				NAME: null,
				MOBILENO: null,
				JOBROLE:
					item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
						? item.User.Client_job_roles[0].job_role_name
						: null,
				AREAOFFICE: tagDatas ? tagDatas[0] : null,
				DEALERCODE: tagDatas ? tagDatas[1] : null,
				DEALERNAME: tagDatas ? tagDatas[2] : null,
				ZONE: item.User && item.User.Clients && item.User.Clients.length > 0 ? item.User.Clients[0].name : null,
			};

			console.log('-----templateName--------', templateName);

			if (templateName == 'Report1(HMCL)') {
				if (
					tagDatas &&
					(tagDatas[1] == null || (tagDatas && tagDatas[1] == undefined) || (tagDatas && tagDatas[1] == ''))
				) {
					finalData.push(payload);
				}
			} else if (templateName == 'Report2(OnlyDealer)') {
				if (tagDatas && tagDatas[1] != null && tagDatas && tagDatas[1] != undefined && tagDatas && tagDatas[1] != '') {
					finalData.push(payload);
				}
			}
		}

		client
			.render({
				template: { name: templateName, recipe: 'xlsx' },
				data: {
					contactWAData: finalData,
				},
			})
			.then((report) => {
				let fileName = `${shortid.generate()}_${Date.now()}.xlsx`;
				const output = fs.createWriteStream(CONFIG.imagePath + `/uploads/jsReport/${fileName}`);
				report.pipe(output);
				output.on('finish', function () {
					res.download(output.path); // Send the file to the frontend
				});
			})
			.catch((err) => {
				console.error(err);
				return ResponseError(res, err, 500, true);
			});

		// let fileName = `${shortid.generate()}_${Date.now()}.xlsx`;
		// let file = report.pipe(fs.createWriteStream(CONFIG.imagePath + `/uploads/jsReport/${fileName}`));

		// setTimeout(() => {
		// 	if (file.path) {
		// 		let filePath = file.path;
		// 		res.download(filePath);
		// 	}
		// }, 100);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomReport = getCustomReport;

const getCustomReportNameByClientId = async function (req, res) {
	try {
		// let clientId = req.params.clientId;
		// let type = req.query.type;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
		});

		// Validate request params
		const { error, value } = schema.validate({ clientId: parseInt(req.params.clientId) });

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated value
		let clientId = value.clientId;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let client;

		if (type == 'drip') {
			let appBranding;
			let flag = true;
			[err, client] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					include: [
						{
							model: System_branding,
							include: [
								{
									model: ClientCustomReport,
									attributes: ['id', 'ClientId', 'SystemBrandingId', 'report_name'],
								},
							],
							attributes: ['id'],
						},
					],
					attributes: ['SystemBrandingId', 'Associate_client_id'],
				})
			);
			if (err) console.log('-----Error 01 Get Client App Branding By Client Id--', err);

			if (client && client.SystemBrandingId) {
				appBranding = client.System_branding;
			} else if (client && client.Associate_client_id) {
				let parentClientId = client.Associate_client_id;
				let totalClientCount;
				let count = 0;

				[err, totalClientCount] = await to(Client.count());

				while (flag) {
					count++;
					if (count > totalClientCount) {
						flag = false;
						break;
					}
					[err, parentClient] = await to(
						Client.findOne({
							where: {
								id: parentClientId,
							},
							include: [
								{
									model: System_branding,
									include: [
										{
											model: ClientCustomReport,
											attributes: ['id', 'ClientId', 'SystemBrandingId', 'report_name'],
										},
									],
									attributes: ['id'],
								},
							],
							attributes: ['SystemBrandingId', 'Associate_client_id'],
						})
					);
					if (err) console.log('-----Error 02 Get Client App Branding By Client Id--', err);
					if (parentClient && parentClient.SystemBrandingId) {
						appBranding = parentClient.System_branding;
						flag = false;
					} else if (parentClient && parentClient.Associate_client_id) {
						parentClientId = parentClient.Associate_client_id;
					} else {
						flag = false;
					}
				}
			}
			return ResponseSuccess(res, {
				data: appBranding,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomReportNameByClientId = getCustomReportNameByClientId;

//JS Report delete downloaded files\
let js_report_delete_schedulor = schedule.scheduleJob('6 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>>JS Report delete downloaded files----------', fireDate);
	deleteJSReportDownloadedFile();
});
module.exports.js_report_delete_schedulor = js_report_delete_schedulor;

const deleteJSReportDownloadedFile = async function () {
	const directoryPath = CONFIG.imagePath + '/uploads/jsReport';

	fs.readdir(directoryPath, (err, files) => {
		if (err) {
			console.error('--------Error reading JS Report directory------:', err);
			return;
		}

		files.forEach((file) => {
			const filePath = path.join(directoryPath, file);
			fs.unlink(filePath, (err) => {
				if (err) {
					console.error('----Error deleting JS Report file----:', err);
					return;
				}
				console.log('-------JS Report file deleted successfully-----', filePath);
			});
		});
	});
};

const dripContectWiseReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		const startDateUTC = moment(value.startDate).utc().format('YYYY-MM-DD HH:mm:ss');
		const endDateUTC = moment(value.endDate).utc().format('YYYY-MM-DD HH:mm:ss');

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		// let query = `
		// 		SELECT
		// 		account_id AS "Contact ID",
		// 		"Posts".id AS "Drip ID",
		// 		"Campaigns".id AS "Drip Flow ID",
		// 		"isRead" AS "Read On Drip App",
		// 		"isDripClickAction" AS "Action Intent",
		// 		CASE
		// 			WHEN "Posts"."tempType" IN ('Single Image', 'Carousel', 'Video') THEN 'NA'
		// 			ELSE submit::TEXT  -- Convert boolean to text to match 'NA'
		// 		END AS "Action Taken"
		// 			FROM "Assigned_post_to_users"
		// 		JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
		// 		JOIN "Posts" ON "Posts".id = "Assigned_post_to_users"."PostId"
		// 		JOIN "Campaigns" ON "CampaignId" = "Campaigns".id
		// 	WHERE
		// 		"Campaigns"."ClientId" IN (${clientIds.toString()}) AND
		// 		"Campaigns"."startDate" BETWEEN '${startDate}' AND '${endDate}'
		// 		ORDER BY "CampaignId" ASC;`;

		// console.log('---dripContectWiseReport Query-----', query);
		// let DripFlowData = [];
		// [DripFlowData] = await sequelize.query(query);

		let query = `
			SELECT 
				account_id AS "Contact ID",
				"Posts".id AS "Drip ID",
				"Campaigns".id AS "Drip Flow ID",
				"isRead" AS "Read On Drip App",
				"isDripClickAction" AS "Action Intent",
				CASE
					WHEN "Posts"."tempType" IN ('Single Image', 'Carousel', 'Video') THEN 'NA'
					ELSE submit::TEXT  -- Convert boolean to text to match 'NA'
				END AS "Action Taken"
			FROM "Assigned_post_to_users"
			JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
			JOIN "Posts" ON "Posts".id = "Assigned_post_to_users"."PostId"
			JOIN "Campaigns" ON "CampaignId" = "Campaigns".id
			WHERE 
				"Campaigns"."ClientId" IN (:clientIds) AND
				"Campaigns"."startDate" BETWEEN :startDate AND :endDate
			ORDER BY "CampaignId" ASC;
		`;

		console.log('---dripContectWiseReport Query-----', query);

		let DripFlowData = [];
		DripFlowData = await sequelize.query(query, {
			replacements: {
				clientIds: clientIds,
				startDate: startDateUTC,
				endDate: endDateUTC,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		return ResponseSuccess(res, {
			data: DripFlowData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.dripContectWiseReport = dripContectWiseReport;

//////////////////////////////////////////////////////// DIWO REPORT /////////////////////////////////////////////////////////////////


const getInteractionReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		const today = new Date();

		if (clientIds.length > 0) {
			let clientIdBatch = [];
			let idsList = [];
			for (let id of clientIds) {
				if (idsList.length !== 5) {
					idsList.push(id);
				} else {
					clientIdBatch.push({
						ids: idsList,
					});
					idsList = [id];
				}
			}
			if (idsList.length > 0)
				clientIdBatch.push({
					ids: idsList,
				});

			for (let data of clientIdBatch) {
				[err, getSessionAllData] = await to(
					Session.findAll({
						where: {
							ClientId: data.ids,
							SessionStartDate: {
								[Op.between]: [startDate, endDate],
							},
							DiwoModuleId: 5,
						},
						attributes: ['WorkbookId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);				

				if (getSessionAllData.length > 0) {
					for (let session_ of getSessionAllData) {						
						let session = session_.convertToJSON();

						console.log('session', session);

						[err, getScormInteractionData] = await to(
							Scorm_interaction.findAll({
								where: {
									WorkbookId: session.WorkbookId
								},								
							})
						);
						if (err) return ResponseError(res, err, 500, true);						
						
						if (getScormInteractionData.length > 0) {
							finalList.push(...getScormInteractionData); 
						}
					}
				}
				
			}

		}	

		let finalData = [];
		for (let item of finalList) {
			finalData.push(item.toJSON());
		}

		let notifcationMessage = MESSAGE.Scorm_Interaction_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
	
		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Sorm Interaction Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalData,
		});

	} catch (error) {
	return ResponseError(res, error, 500, true);
	}

}; 
module.exports.getInteractionReport = getInteractionReport;


const getScormSummaryReport = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		let err, getSessionAllData, getScormTrackingData, localUserData;

		const clientIds = await getAllSubClientAndBranchAccountLists(clientId, false);
		if (clientIds.length > 0) {
			let clientIdBatch = [];
			let idsList = [];

			for (let id of clientIds) {
				if (idsList.length !== 5) {
					idsList.push(id);
				} else {
					clientIdBatch.push({ ids: idsList });
					idsList = [id];
				}
			}
			if (idsList.length > 0) clientIdBatch.push({ ids: idsList });

			for (let data of clientIdBatch) {
				[err, getSessionAllData] = await to(
					Session.findAll({
						where: {
							ClientId: data.ids,
							SessionStartDate: {
								[Op.between]: [startDate, endDate],
							},
							DiwoModuleId: 5,
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['id', 'name', 'db_name'],
									},
								],
								attributes: ['id', 'MarketId', 'local_user_id', 'account_id'],
							},
						],
						
						attributes: ['WorkbookId', 'UserId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				console.log('getSessionAllData', getSessionAllData);


				if (getSessionAllData.length > 0) {
					for (let session_ of getSessionAllData) {
						let localUser;
						let session = session_.convertToJSON();

						[err, getScormTrackingData] = await to(
							Scorm_tracking.findAll({
								where: { WorkbookId: session.WorkbookId },
								include: [
									{
										model: Workbook,
										attributes: ['id', 'title'],
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);


						if (getScormTrackingData.length > 0) {
							for (let scormTracking_ of getScormTrackingData) {
								let scormTracking = scormTracking_.convertToJSON();								

								if (scormTracking && scormTracking.UserId) {

									[err, localUser] = await to(
										User.findOne({
											where: {
												account_id: scormTracking.UserId.toString(),
												is_deleted: false
											},
											include: 
											[
												{
													model: Market,
													attributes: ['id', 'name', 'db_name'],
												},
											],
											attributes: ['local_user_id', 'MarketId'],										
										})
									);
									if (err) return ResponseError(res, err, 500, true);

									console.log('localUser', localUser);

									if (localUser && localUser.local_user_id) {
										[err, localUserData] = await to(
											dbInstance[localUser.Market.db_name].User_master.findOne({
												where: {
													id: localUser.local_user_id,
												},
												attributes: ['first', 'last', 'email'],
											})
										)
										if (err) return ResponseError(res, err, 500, true);									
									}									
								}

								finalList.push({
									initialLaunchDate: scormTracking.initialLaunchDate || '',
									completion_time: scormTracking.completion_time || '',
									completion_status: scormTracking.completion_status || scormTracking.lesson_status || '',
									success_status: scormTracking.success_status || '',
									total_time: scormTracking.total_time || '',
									score_raw: scormTracking.score_raw || '',
									min_score: scormTracking.min_score || '',
									max_score: scormTracking.max_score || '',
									WorkbookId: scormTracking.Workbook?.id || '',
									WorkbookTitle: scormTracking.Workbook?.title || '',

									AccountId: scormTracking.UserId || '',
									MarketName: localUser?.Market?.name || '',							
									UserFirstName: localUserData?.first || '',
									UserLastName: localUserData?.last || '',
									Email: localUserData?.email || '',
								});
							}
						}

					}
				}


			}
		}

		let notifcationMessage = MESSAGE.Scorm_Summary_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Scorm Summary Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getScormSummaryReport = getScormSummaryReport;

	

const getActivityReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		const today = new Date();

		if (clientIds.length > 0) {
			let clientIdBatch = [];
			let idsList = [];
			for (let id of clientIds) {
				if (idsList.length !== 5) {
					idsList.push(id);
				} else {
					clientIdBatch.push({
						ids: idsList,
					});
					idsList = [id];
				}
			}
			if (idsList.length > 0)
				clientIdBatch.push({
					ids: idsList,
				});

			for (let data of clientIdBatch) {
				[err, getSessionAllData] = await to(
					Session.findAll({
						where: {
							ClientId: data.ids,
							SessionStartDate: {
								[Op.between]: [startDate, endDate],
							},
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
								model: Workbook,
								attributes: ['id', 'title', 'DiwoModuleId', 'BaseWorkbookId', 'version'],
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
							{
								model: DiwoAssignment,
								include: [
									{
										model: Pathway,
										attributes: ['id', 'title'],
									},
								],
								attributes: ['id'],
							},
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['id', 'name', 'db_name'],
									},
								],
								attributes: ['id', 'MarketId', 'local_user_id', 'account_id'],
							},
						],
						attributes: [
							'id',
							'title',
							'location',
							'dateWithTime',
							'enddateWithTime',
							'status',
							'trainerNote',
							'SessionStartDate',
							'SessionEndDate',
							'language',
							'latitude',
							'longitude',
							'geoLocation',
						],
						order: [['SessionEndDate', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (getSessionAllData.length > 0) {
					for (let session_ of getSessionAllData) {
						let localUser;
						let session = session_.convertToJSON();

						if (session && session.User && session.User.Market) {
							[err, localUser] = await to(
								dbInstance[session.User.Market.db_name].User_master.findOne({
									where: {
										id: session.User.local_user_id,
									},
									attributes: ['first', 'last', 'email'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);
						}

						if (session) {
							let nominatedLearnerCount;
							[err, nominatedLearnerCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										status: ['Approved', 'Pre Assign'],
									},
									include: [
										{
											model: Session,
											where: {
												DiwoModuleId: {
													[Op.ne]: 1,
												},
											},
										},
									],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							session.nominatedCount = nominatedLearnerCount != 0 ? nominatedLearnerCount : '-';

							let attendedLearnerCount;
							[err, attendedLearnerCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										status: 'Approved',
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							session.attendedCount = attendedLearnerCount;

							let learnerNotStartedCount;
							[err, learnerNotStartedCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										ModuleStatus: 'Not Started',
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							session.learnerNotStarted = learnerNotStartedCount;

							let learnerInProgressCount;
							[err, learnerInProgressCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										ModuleStatus: 'In Progress',
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							session.learnerInProgress = learnerInProgressCount;

							let learnerCompletedCount;
							[err, learnerCompletedCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										ModuleStatus: 'Completed',
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							session.learnerCompleted = learnerCompletedCount;

							let learnerCertifiedCount;
							[err, learnerCertifiedCount] = await to(
								SessionUser.count({
									where: {
										SessionId: session.id,
										ModuleStatus: 'Certified',
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							session.learnerCertified = learnerCertifiedCount;

							//Get Session Feed BAck Data
							[err, getSessionFeedbackData] = await to(
								SessionUser.findAll({
									where: {
										SessionId: session.id,
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
													include: [
														{
															model: SessionOption,
															where: { selectedAns: true },
															attributes: ['id', 'selectedAns', 'sr_no'],
														},
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

							for (let data of getSessionFeedbackData) {
								for (let worksheet of data.SessionWorksheets) {
									for (let question of worksheet.SessionQuestions) {
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
							//console.log('--sessionScore-', sessionScore);
							if (sessionScore > 0) {
								sessionScore = Number(sessionScore / getSessionFeedbackData.length).toFixed(2);
								session.sessionScore = sessionScore;
							} else {
								session.sessionScore = 0;
							}
						}
						delete session.User;
						if (localUser) {
							session.faciltiatorName = localUser.first + ' ' + localUser.last;
						} else {
							session.faciltiatorName = '';
						}
						finalList.push(session);
					}
				}
			}
		}

		let notifcationMessage = MESSAGE.Activity_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Activity Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getActivityReport = getActivityReport;

const learnerPerformanceReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		let allCustomFieldLabels = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		if (clientIds.length > 0) {
			let clientIdBatch = [];
			let idsList = [];
			for (let id of clientIds) {
				if (idsList.length !== 5) {
					idsList.push(id);
				} else {
					clientIdBatch.push({
						ids: idsList,
					});
					idsList = [id];
				}

				//Find Custom Details
				let customFields = await getAccountCustomField(id, req.user.type);

				if (customFields && customFields.length > 0) {
					for (let field of customFields) {
						if (!field.isHide) {
							let isDuplicate = false;
							for (let existingField of allCustomFieldLabels) {
								if (existingField.label === field.label) {
									isDuplicate = true;
									break;
								}
							}

							if (!isDuplicate) {
								let payload = {
									label: field.label,
								};
								allCustomFieldLabels.push(payload);
							}
						}
					}
				}
			}

			if (idsList.length > 0)
				clientIdBatch.push({
					ids: idsList,
				});

			for (let data of clientIdBatch) {
				[err, getSessionAllData] = await to(
					Session.findAll({
						where: {
							ClientId: data.ids,
							SessionStartDate: {
								[Op.between]: [startDate, endDate],
							},
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
								model: Workbook,
								attributes: ['id', 'title', 'DiwoModuleId'],
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
								required: false,
							},
							{
								model: DiwoAssignment,
								include: [
									{
										model: Pathway,
										attributes: ['id', 'title'],
									},
								],
								attributes: ['id'],
								required: false,
							},
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['id', 'name', 'db_name'],
									},
								],
								attributes: ['id', 'MarketId', 'local_user_id', 'account_id', 'createdAt'],
							},
							{
								model: SessionUser,
								include: [
									{
										model: User,
										where: {
											cStatus: 'Active',
											forDiwo: true,
											is_deleted: false,
										},
										include: [
											{
												model: Market,
												attributes: ['id', 'name', 'db_name'],
											},
											{
												model: Client_job_role,
												attributes: ['id', 'job_role_name'],
											},
											{
												model: Client,
												through: 'User_role_client_mapping',
												attributes: ['id', 'name'],
											},
										],
										attributes: ['id', 'MarketId', 'local_user_id', 'account_id', 'createdAt', 'customFields'],
									},
									{
										model: SessionWorksheet,
										where: {
											[Op.or]: [
												{
													type: ['Quiz', 'Quiz (Randomised)'],
													isGraded: true,
												},
												{ type: 'Offline Task' },
											],
										},
										include: [
											{
												model: SessionQuestion,
												attributes: ['id', 'spinQueScore'],
											},
										],
										attributes: ['id', 'type', 'isGraded', 'submit', 'score', 'isQuizCompletion'],
										required: false,
									},
								],
								required: false,
							},
						],
						attributes: [
							'id',
							'title',
							'location',
							'dateWithTime',
							'status',
							'trainerNote',
							'SessionStartDate',
							'SessionEndDate',
							'language',
						],
						order: [
							['SessionEndDate', 'DESC'],
							[SessionUser, { model: SessionWorksheet }, 'id', 'ASC'],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (getSessionAllData.length > 0) {
					for (let session_ of getSessionAllData) {
						let session = session_.convertToJSON();
						if (session && session.User && session.User.Market) {
							[err, localUser] = await to(
								dbInstance[session.User.Market.db_name].User_master.findOne({
									where: {
										id: session.User.local_user_id,
									},
									attributes: ['first', 'last', 'email'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);
						}

						if (localUser) {
							session.faciltiatorName = localUser.first + ' ' + localUser.last;
						} else {
							session.faciltiatorName = '';
						}

						if (session && session.SessionUsers && session.SessionUsers.length > 0) {
							for (let user of session.SessionUsers) {
								let learnerDetails = user;

								if (learnerDetails && learnerDetails.User && learnerDetails.User.Market) {
									[err, localUser] = await to(
										dbInstance[learnerDetails.User.Market.db_name].User_master.findOne({
											where: {
												id: learnerDetails.User.local_user_id,
											},
											attributes: ['first', 'last', 'email'],
										})
									);
									if (err) return ResponseError(res, err, 500, true);

									if (localUser) {
										learnerDetails.firstName = localUser.first;
										learnerDetails.lastName = localUser.last;
									}
								}

								let learnerFinalData = {};
								let jobRole = [];
								if (learnerDetails.User.Client_job_roles && learnerDetails.User.Client_job_roles.length > 0) {
									jobRole = learnerDetails.User.Client_job_roles.map((data) => {
										return data.job_role_name;
									});
								}

								learnerFinalData.account_id = learnerDetails.User.account_id;
								learnerFinalData.firstName = learnerDetails && learnerDetails.firstName ? learnerDetails.firstName : '';
								learnerFinalData.lastName = learnerDetails && learnerDetails.lastName ? learnerDetails.lastName : '';
								learnerFinalData.parentAccount =
									learnerDetails.User && learnerDetails.User.Clients && learnerDetails.User.Clients[0]
										? learnerDetails.User.Clients[0].name
										: '';
								learnerFinalData.jobRole = jobRole.toString();
								learnerFinalData.learnerAddedDate = learnerDetails.User.createdAt;
								learnerFinalData.DiwoAssignment = session && session.DiwoAssignment ? session.DiwoAssignment.id : '-';
								learnerFinalData.courseTitle =
									session.DiwoModuleAssign && session.DiwoModuleAssign.Course && session.DiwoModuleAssign.Course.title
										? session.DiwoModuleAssign.Course.title
										: '-';
								learnerFinalData.pathwayTitle =
									session.DiwoAssignment && session.DiwoAssignment.Pathway && session.DiwoAssignment.Pathway.title
										? session.DiwoAssignment.Pathway.title
										: '-';
								learnerFinalData.ModuleStatus = learnerDetails.ModuleStatus ? learnerDetails.ModuleStatus : '-';
								learnerFinalData.haveCertificate = learnerDetails.haveCertificate;
								learnerFinalData.workbookTitle = session.Workbook?.title;
								learnerFinalData.sessionId = session.id;
								learnerFinalData.sessionTitle = session.title ? session.title : '-';
								learnerFinalData.sessionLanguage = session.language;
								// learnerFinalData.attendanceMode =
								// 	user.isPreAssigned || (session && session.Workbook && session.Workbook.DiwoModuleId != 1)
								// 		? 'Pre Assigned'
								// 		: 'Spot Registration';
								learnerFinalData.attendanceMode =
									session && session.Workbook && session.Workbook.DiwoModuleId != 1
										? 'Assigned'
										: user.isPreAssigned || (session && session.Workbook && session.Workbook.DiwoModuleId === 1)
										? 'Assigned'
										: 'Spot Registration';
								learnerFinalData.facilitatorName = session.faciltiatorName;
								learnerFinalData.sessionStartDate = session.SessionStartDate;
								learnerFinalData.sessionEndDate = session.SessionEndDate;
								learnerFinalData.dateWithTime =
									session && session.Workbook && session.Workbook.DiwoModuleId != 1
										? session.SessionStartDate
										: session.dateWithTime;

								learnerFinalData.enddateWithTime =
									session && session.Workbook && session.Workbook.DiwoModuleId != 1
										? session.SessionEndDate
										: session.enddateWithTime;

								learnerFinalData.trainerNote = user.trainerNote && user.trainerNote ? user.trainerNote : '-';
								learnerFinalData.parentAccount =
									learnerDetails.User && learnerDetails.User.Clients && learnerDetails.User.Clients[0]
										? learnerDetails.User.Clients[0].name
										: '';

								learnerFinalData.SessionWorksheets = user && user.SessionWorksheets ? user.SessionWorksheets : '';
								learnerFinalData.customFields = learnerDetails.User.customFields
									? learnerDetails.User.customFields
									: '-';
								learnerFinalData.markMePresentDate = user && user.markMePresentDate ? user.markMePresentDate : null;
								if (user.SessionWorksheets && user.SessionWorksheets) {
									let quizCount = 0;
									let offlineCount = 0;
									for (let ws of user.SessionWorksheets) {
										if (ws.type == 'Offline Task') {
											offlineCount++;

											let grade = null;

											[err, SessionQuestion_] = await to(
												SessionQuestion.findAll({
													where: {
														SessionWorksheetId: ws.id,
													},
													attributes: ['id', 'SessionWorksheetId', 'grade', 'isTextResponse', 'isFileSubmission'],
													include: [
														{
															model: SessionQuestionSubmission,
															attributes: ['id', 'grade'],
														},
													],
												})
											);
											if (err) return ResponseError(res, err, 500, true);

											for (let question of SessionQuestion_) {
												if (question.isTextResponse) {
													if (question?.grade && parseInt(question.grade) > 0) {
														grade = grade + parseInt(question.grade);
													}
												}

												if (question.isFileSubmission) {
													if (question && question.SessionQuestionSubmissions.length > 0) {
														for (let file of question.SessionQuestionSubmissions) {
															if (file?.grade && parseInt(file.grade) > 0) {
																grade = grade + parseInt(file.grade);
															}
														}
													}
												}
											}
											learnerFinalData[`Offline Task ${offlineCount} Max`] = (SessionQuestion_.length * 5).toString();
											learnerFinalData[`Offline Task ${offlineCount} Score`] = grade !== null ? grade.toString() : '-';
											if (offlineCount >= 5) {
												break;
											}
										} else {
											quizCount++;
											let maxScore = 0;
											for (let ques of ws.SessionQuestions) {
												if (ques.spinQueScore !== null && ques.spinQueScore > 0) {
													maxScore = maxScore + ques.spinQueScore;
												}
											}
											learnerFinalData[`Quiz ${quizCount} Max`] = maxScore.toString();
											if (ws.isQuizCompletion) {
												learnerFinalData[`Quiz ${quizCount} Score`] =
													ws.score !== undefined ? ws.score.toString() : '-';
											} else {
												learnerFinalData[`Quiz ${quizCount} Score`] =
													ws.submit && ws.score !== undefined ? ws.score.toString() : '-';
											}

											if (quizCount >= 40) {
												break;
											}
										}
									}
								}
								finalList.push(learnerFinalData);
							}
						}
					}
				}
			}
		}

		let notifcationMessage = MESSAGE.Learner_Performance_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Learner Performance Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
			customFields: allCustomFieldLabels,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.learnerPerformanceReport = learnerPerformanceReport;

//Learner Performance Report Old

// const learnerPerformanceReport = async function (req, res) {
// 	try {
// 		const startDate = req.body.startDate;
// 		const endDate = req.body.endDate;
// 		let finalList = [];
// 		let allCustomFieldLabels = [];
// 		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(req.body.clientId), false);

// 		if (clientIds.length > 0) {
// 			let clientIdBatch = [];
// 			let idsList = [];
// 			for (let id of clientIds) {
// 				if (idsList.length !== 5) {
// 					idsList.push(id);
// 				} else {
// 					clientIdBatch.push({
// 						ids: idsList,
// 					});
// 					idsList = [id];
// 				}

// 				//Find Custom Details
// 				let customFields = await getAccountCustomField(id, req.user.type);

// 				if (customFields && customFields.length > 0) {
// 					for (let field of customFields) {
// 						if (!field.isHide) {
// 							let isDuplicate = false;
// 							for (let existingField of allCustomFieldLabels) {
// 								if (existingField.label === field.label) {
// 									isDuplicate = true;
// 									break;
// 								}
// 							}

// 							if (!isDuplicate) {
// 								let payload = {
// 									label: field.label,
// 								};
// 								allCustomFieldLabels.push(payload);
// 							}
// 						}
// 					}
// 				}
// 			}

// 			if (idsList.length > 0)
// 				clientIdBatch.push({
// 					ids: idsList,
// 				});

// 			for (let data of clientIdBatch) {
// 				[err, getSessionAllData] = await to(
// 					Session.findAll({
// 						where: {
// 							ClientId: data.ids,
// 							SessionEndDate: {
// 								[Op.between]: [startDate, endDate],
// 							},
// 						},
// 						include: [
// 							{
// 								model: Workbook,
// 								include: [
// 									{
// 										model: Course,
// 										attributes: ['id', 'title'],
// 									},
// 								],
// 								attributes: ['id', 'title'],
// 							},
// 							{
// 								model: User,
// 								include: [
// 									{
// 										model: Market,
// 										attributes: ['id', 'name', 'db_name'],
// 									},
// 								],
// 								attributes: ['id', 'MarketId', 'local_user_id', 'account_id'],
// 							},
// 							{
// 								model: SessionUser,
// 								include: [
// 									{
// 										model: User,
// 										where: {
// 											cStatus: 'Active',
// 											forDiwo: true,
// 											is_deleted: false,
// 										},
// 										include: [
// 											{
// 												model: Market,
// 												attributes: ['id', 'name', 'db_name'],
// 											},
// 											{
// 												model: Client_job_role,
// 												attributes: ['id', 'job_role_name'],
// 											},
// 											{
// 												model: Client,
// 												through: 'User_role_client_mapping',
// 												attributes: ['id', 'name'],
// 											},
// 										],
// 										attributes: ['id', 'MarketId', 'local_user_id', 'account_id', 'createdAt', 'customFields'],
// 									},
// 									{
// 										model: SessionWorksheet,
// 										where: {
// 											type: ['Quiz', 'Quiz (Randomised)'],
// 											isGraded: true,
// 										},
// 										include: [
// 											{
// 												model: SessionQuestion,
// 												attributes: ['id', 'spinQueScore'],
// 											},
// 										],
// 										attributes: ['id', 'type', 'isGraded', 'submit', 'score'],
// 										required: false,
// 									},
// 								],
// 							},
// 						],
// 						attributes: [
// 							'id',
// 							'title',
// 							'location',
// 							'dateWithTime',
// 							'status',
// 							'trainerNote',
// 							'SessionStartDate',
// 							'SessionEndDate',
// 							'language',
// 						],
// 						order: [
// 							['SessionEndDate', 'DESC'],
// 							[SessionUser, { model: SessionWorksheet }, 'id', 'ASC'],
// 						],
// 					})
// 				);
// 				if (err) return ResponseError(res, err, 500, true);

// 				if (getSessionAllData.length > 0) {
// 					for (let session_ of getSessionAllData) {
// 						let session = session_.convertToJSON();

// 						if (session && session.User && session.User.Market) {
// 							[err, localUser] = await to(
// 								dbInstance[session.User.Market.db_name].User_master.findOne({
// 									where: {
// 										id: session.User.local_user_id,
// 									},
// 									attributes: ['first', 'last', 'email'],
// 								})
// 							);
// 							if (err) return ResponseError(res, err, 500, true);
// 						}

// 						if (localUser) {
// 							session.faciltiatorName = localUser.first + ' ' + localUser.last;
// 						} else {
// 							session.faciltiatorName = '';
// 						}

// 						if (session && session.SessionUsers && session.SessionUsers.length > 0) {
// 							for (let user of session.SessionUsers) {
// 								let learnerDetails = user;

// 								if (learnerDetails && learnerDetails.User && learnerDetails.User.Market) {
// 									[err, localUser] = await to(
// 										dbInstance[learnerDetails.User.Market.db_name].User_master.findOne({
// 											where: {
// 												id: learnerDetails.User.local_user_id,
// 											},
// 											attributes: ['first', 'last', 'email'],
// 										})
// 									);
// 									if (err) return ResponseError(res, err, 500, true);

// 									if (localUser) {
// 										learnerDetails.firstName = localUser.first;
// 										learnerDetails.lastName = localUser.last;
// 									}
// 								}

// 								let learnerFinalData = {};
// 								let jobRole = [];
// 								if (learnerDetails.User.Client_job_roles && learnerDetails.User.Client_job_roles.length > 0) {
// 									jobRole = learnerDetails.User.Client_job_roles.map((data) => {
// 										return data.job_role_name;
// 									});
// 								}

// 								learnerFinalData.account_id = learnerDetails.User.account_id;
// 								learnerFinalData.firstName = learnerDetails && learnerDetails.firstName ? learnerDetails.firstName : '';
// 								learnerFinalData.lastName = learnerDetails && learnerDetails.lastName ? learnerDetails.lastName : '';
// 								learnerFinalData.parentAccount =
// 									learnerDetails.User && learnerDetails.User.Clients && learnerDetails.User.Clients[0]
// 										? learnerDetails.User.Clients[0].name
// 										: '';
// 								learnerFinalData.jobRole = jobRole.toString();
// 								learnerFinalData.learnerAddedDate = learnerDetails.User.createdAt;
// 								learnerFinalData.courseTitle =
// 									session.Workbook &&
// 									session.Workbook.Courses &&
// 									session.Workbook.Courses[0] &&
// 									session.Workbook.Courses[0].title
// 										? session.Workbook.Courses[0].title
// 										: '-';
// 								learnerFinalData.workbookTitle = session.Workbook?.title;
// 								learnerFinalData.sessionId = session.id;
// 								learnerFinalData.sessionTitle = session.title ? session.title : '-';
// 								learnerFinalData.sessionLanguage = session.language;
// 								learnerFinalData.attendanceMode = user.isPreAssigned ? 'Pre Assigned' : 'Spot Registration';
// 								learnerFinalData.facilitatorName = session.faciltiatorName;
// 								learnerFinalData.sessionStartDate = session.SessionStartDate;
// 								learnerFinalData.sessionEndDate = session.SessionEndDate;
// 								learnerFinalData.trainerNote = user.trainerNote && user.trainerNote ? user.trainerNote : '-';
// 								learnerFinalData.customFields = learnerDetails.User.customFields
// 									? learnerDetails.User.customFields
// 									: '-';
// 								if (user.SessionWorksheets && user.SessionWorksheets) {
// 									let count = 0;
// 									for (let ws of user.SessionWorksheets) {
// 										count++;
// 										let maxScore = 0;
// 										for (let ques of ws.SessionQuestions) {
// 											if (ques.spinQueScore !== null && ques.spinQueScore > 0) {
// 												maxScore = maxScore + ques.spinQueScore;
// 											}
// 										}
// 										learnerFinalData[`Quiz ${count} Max`] = maxScore.toString();
// 										learnerFinalData[`Quiz ${count} Score`] = ws.score !== undefined ? ws.score.toString() : '';
// 										if (count >= 5) {
// 											break;
// 										}
// 									}
// 								}
// 								finalList.push(learnerFinalData);
// 							}
// 						}
// 					}
// 				}
// 			}
// 		}

// 		let notifcationMessage = MESSAGE.Learner_Performance_Report;
// 		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

// 		[err, newLog] = await to(
// 			createlog(
// 				req.user.id,
// 				req.user.ClientId,
// 				req.user.RoleId,
// 				`Download Learner Performance Report`,
// 				req.ip,
// 				req.useragent,
// 				req.user.type,
// 				{
// 					DateRange: [startDate, endDate],
// 				}
// 			)
// 		);
// 		if (err) return ResponseError(res, err, 500, true);

// 		return ResponseSuccess(res, {
// 			data: finalList,
// 			customFields: allCustomFieldLabels,
// 		});
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.learnerPerformanceReport = learnerPerformanceReport;

//Pathway Wise Report

const pathwayWiseReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);
		[err, getAllPathwayDetails] = await to(
			Pathway.findAll({
				where: {
					ClientId: clientIds,
				},
				include: [
					{
						model: DiwoAssignment,
						where: {
							StartDate: {
								[Op.between]: [startDate, endDate],
							},
						},
						attributes: ['id'],
					},
				],
				attributes: ['id', 'title'],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getAllPathwayDetails && getAllPathwayDetails.length > 0) {
			for (let pathway_ of getAllPathwayDetails) {
				let pathway = pathway_.convertToJSON();

				console.log('-pathway-', pathway);

				let diwoAssignmentIds = [];
				for (let assignment of pathway.DiwoAssignments) {
					diwoAssignmentIds.push(assignment.id);
				}

				// [err, getSessionAllData] = await to(
				// 	Session.findAll({
				// 		where: {
				// 			DiwoAssignmentId: diwoAssignmentIds,
				// 		},
				// 		attributes: ['id'],
				// 	})
				// );
				// if (err) return ResponseError(res, err, 500, true);

				// let sessionIds = [];
				// for (let session of getSessionAllData) {
				// 	sessionIds.push(session.id);
				// }

				let nominatedLearnerCount;
				[err, nominatedLearnerCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
							status: ['Approved', 'Pre Assign'],
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				pathway.nominatedCount = nominatedLearnerCount;

				let learnerNotStartedCount;
				[err, learnerNotStartedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: PathwayStatus,
								as: 'PS',
								where: {
									status: 'Not Started',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				pathway.learnerNotStarted = learnerNotStartedCount;

				let learnerInProgressCount;
				[err, learnerInProgressCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: PathwayStatus,
								as: 'PS',
								where: {
									status: 'In Progress',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				pathway.learnerInProgress = learnerInProgressCount;

				let learnerCompletedCount;
				[err, learnerCompletedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: PathwayStatus,
								as: 'PS',
								where: {
									status: 'Completed',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				pathway.learnerCompleted = learnerCompletedCount;

				let learnerCertifiedCount;
				[err, learnerCertifiedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: PathwayStatus,
								as: 'PS',
								where: {
									status: 'Certified',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				pathway.learnerCertified = learnerCertifiedCount;

				if (nominatedLearnerCount != 0) {
					let completedPercentage = (learnerCompletedCount / nominatedLearnerCount) * 100;
					pathway.completedPercentage = completedPercentage + '%';
				} else {
					pathway.completedPercentage = 0 + '%';
				}

				finalList.push(pathway);
			}
		}

		let notifcationMessage = MESSAGE.Pathwaywise_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Pathwaywise Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.pathwayWiseReport = pathwayWiseReport;

//Course Wise Report
const courseWiseReport = async function (req, res) {
	try {
		// const startDate = req.body.startDate;
		// const endDate = req.body.endDate;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		const startDate = moment(value.startDate);
		const endDate = moment(value.endDate);
		const clientId = value.clientId;

		console.log('-startDatecourse -', startDate);
		console.log('-endDatecourse-', endDate);

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		let courseList = [];

		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		[err, getAllCourseDetails] = await to(
			LearnerAssignment.findAll({
				where: {
					ClientId: clientIds,
				},
				include: [
					{
						model: DiwoAssignment,
						where: {
							StartDate: {
								[Op.between]: [startDate, endDate],
							},
						},
						attributes: ['id', 'PathwayId', 'CourseId', 'StartDate', 'EndDate', 'status'],
						include: [
							{
								model: Course,
								attributes: ['id', 'title'],
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
						],
					},
				],
				attributes: ['id'],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getAllCourseDetails && getAllCourseDetails.length > 0) {
			for (let assignment_ of getAllCourseDetails) {
				let assignment = assignment_.convertToJSON();
				// console.log('-assignment-', assignment);

				let diwoAssignmentIds = [];

				diwoAssignmentIds.push(assignment.DiwoAssignment.id);
				console.log('-diwoAssignmentIds-', diwoAssignmentIds);

				// [err, getSessionAllData] = await to(
				// 	Session.findAll({
				// 		where: {
				// 			DiwoAssignmentId: diwoAssignmentIds,
				// 		},
				// 		attributes: ['id'],
				// 	})
				// );
				// if (err) return ResponseError(res, err, 500, true);

				// let sessionIds = [];
				// for (let session of getSessionAllData) {
				// 	sessionIds.push(session.id);
				// }
				// console.log('-sessionIds-', sessionIds);

				let nominatedLearnerCount;
				[err, nominatedLearnerCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
							status: ['Approved', 'Pre Assign'],
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				assignment.nominatedCount = nominatedLearnerCount;

				let learnerNotStartedCount;
				[err, learnerNotStartedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: CourseStatus,
								as: 'CS',
								where: {
									status: 'Not Started',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				assignment.learnerNotStarted = learnerNotStartedCount;

				let learnerInProgressCount;
				[err, learnerInProgressCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: CourseStatus,
								as: 'CS',
								where: {
									status: 'In Progress',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				assignment.learnerInProgress = learnerInProgressCount;

				let learnerCompletedCount;
				[err, learnerCompletedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: CourseStatus,
								as: 'CS',
								where: {
									status: 'Completed',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				assignment.learnerCompleted = learnerCompletedCount;

				let learnerCertifiedCount;
				[err, learnerCertifiedCount] = await to(
					SessionUser.count({
						where: {
							DiwoAssignmentId: diwoAssignmentIds,
							ModuleIndex: 0,
						},
						include: [
							{
								model: CourseStatus,
								as: 'CS',
								where: {
									status: 'Certified',
								},
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				assignment.learnerCertified = learnerCertifiedCount;

				if (nominatedLearnerCount != 0) {
					let completedPercentage = (learnerCompletedCount / nominatedLearnerCount) * 100;
					assignment.completedPercentage = completedPercentage + '%';
				} else {
					assignment.completedPercentage = 0 + '%';
				}

				if (assignment?.DiwoAssignment?.PathwayId != null) {
					if (assignment?.DiwoAssignment?.DiwoModuleAssigns.length > 0) {
						for (let item of assignment.DiwoAssignment.DiwoModuleAssigns) {
							if (item.Course) {
								let payload = {
									id: item.Course.id,
									title: item.Course.title,
									nominatedCount: assignment.nominatedCount,
									learnerNotStarted: assignment.learnerNotStarted,
									learnerInProgress: assignment.learnerInProgress,
									learnerCompleted: assignment.learnerCompleted,
									learnerCertified: assignment.learnerCertified,
									completedPercentage: assignment.completedPercentage,
								};
								courseList.push(payload);
							}
						}
					}
				} else if (assignment?.DiwoAssignment?.CourseId != null) {
					let payload = {
						id: assignment.DiwoAssignment.Course.id,
						title: assignment.DiwoAssignment.Course.title,
						nominatedCount: assignment.nominatedCount,
						learnerNotStarted: assignment.learnerNotStarted,
						learnerInProgress: assignment.learnerInProgress,
						learnerCompleted: assignment.learnerCompleted,
						learnerCertified: assignment.learnerCertified,
						completedPercentage: assignment.completedPercentage,
					};
					courseList.push(payload);
				}
			}
		}

		// finalList.push(assignment);

		for (let i = 0; i < courseList.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < finalList.length; j++) {
				if (JSON.stringify(courseList[i]) === JSON.stringify(finalList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				finalList.push(courseList[i]);
			}
		}

		let notifcationMessage = MESSAGE.Coursewise_Report;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Coursewise Report`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DateRange: [startDate, endDate],
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.courseWiseReport = courseWiseReport;

//LearnerwisBadges & Certificates Report
const LearnerwisBadgeCertificatesReport = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const clientId = value.clientId;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let finalList = [];
		const clientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		[err, getAllUserDetails] = await to(
			User_role_client_mapping.findAll({
				where: {
					ClientId: clientIds,
				},
				include: [
					{
						model: User,
						attributes: ['id', 'MarketId', 'local_user_id'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
							{
								model: LearnerAchievement,
								attributes: ['id', 'UserId', 'isBadge', 'isCertificate', 'data'],
								include: [
									{
										model: Badge,
										attributes: ['id', 'title', 'code', 'path'],
									},
								],
								required: true,
							},
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getAllUserDetails && getAllUserDetails.length > 0) {
			for (let allUser_ of getAllUserDetails) {
				let allUser = allUser_.convertToJSON();

				if (allUser.User) {
					let badgeList = [];
					for (let learnerachivment of allUser.User.LearnerAchievements) {
						if (learnerachivment.Badge && learnerachivment.isBadge) {
							badgeList.push(learnerachivment.Badge.title);
						}
					}

					allUser.badgeEarned = badgeList.toString();

					let certificateList = [];
					for (let learnerachivment of allUser.User.LearnerAchievements) {
						if (learnerachivment.data && learnerachivment.isCertificate) {
							certificateList.push(learnerachivment.data.CertificateLine2);
						}
					}

					allUser.certificateEarned = certificateList.toString();

					[err, localUser] = await to(
						dbInstance[allUser.User.Market.db_name].User_master.findOne({
							where: {
								id: allUser.User.local_user_id,
							},
							attributes: ['first', 'last'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (localUser) {
						allUser.LearnerName = localUser.first + ' ' + localUser.last;
					}

					delete allUser.User;
					finalList.push(allUser);
				}
			}
		}

		let notifcationMessage = MESSAGE.LearnerwisBadgesCertificates;
		await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download LearnerwisBadges & Certificates Report`,
				req.ip,
				req.useragent,
				req.user.type
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.LearnerwisBadgeCertificatesReport = LearnerwisBadgeCertificatesReport;

const downloadFile = async function (req, res) {
	try {
		let filePath = CONFIG.imagePath + req.body.path;
		res.download(filePath);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadFile = downloadFile;

const downloadZipFile = async function (req, res) {
	try {
		let sessionode = req.params.sessionCode;
		let random_string = shortid.generate();
		var archive = archiver.create('zip', {});
		archive.on('error', function (err) {
			throw err;
		});
		var output = fs.createWriteStream(CONFIG.imagePath + `/uploads/zip_files/${random_string}_${sessionode}.zip`);

		output.on('close', function () {
			console.log(archive.pointer() + ' total bytes');
			console.log('archiver has been finalized and the output file descriptor has closed.');
			res.download(CONFIG.imagePath + `/uploads/zip_files/${random_string}_${sessionode}.zip`);
		});

		archive.pipe(output);
		for (let file of req.body) {
			archive.append(fs.createReadStream(CONFIG.imagePath + file.path), {
				name: file.fileName,
			});
		}

		archive.finalize();
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadZipFile = downloadZipFile;
