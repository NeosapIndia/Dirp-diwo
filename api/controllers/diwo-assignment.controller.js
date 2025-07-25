const {
	Market,
	Country,
	Op,
	Currency,
	Client,
	User,
	sequelize,
	Role,
	Pathway,
	Course,
	Course_workbook_mapping,
	PathwayCourseMapping,
	Workbook,
	Worksheet,
	DiwoModule,
	User_group,
	DiwoAsset,
	DiwoAssignment,
	DiwoAssignUserGroupMapping,
	DiwoModuleAssign,
	LearnerAssignment,
	SessionUser,
	Question,
	Option,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	Session,
	SessionWorksheet,
	SessionQuestion,
	SessionOption,
	SessionAsset,
	UserGroupMapping,
	WorkbookTrainerMapping,
	CourseStatus,
	PathwayStatus,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
const { getDiwoClientAppBrandingByClientId, getAllSubChildClientIds } = require('../services/client.service');
const moment = require('moment');
const shortid = require('shortid');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');
const { createNotificationforDiwo, getAllDiwoUserIdsForNotification } = require('../services/notification.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');
const {
	sendModalAssignEmailToTrainer,
	reminder07DaysSendEmailToLearner,
	reminder01DaysSendEmailToLearner,
	CourseCompletitionSendEmailToLearner,
} = require('../services/mailer.service');
const config_feature = require('../config/SiteConfig.json');
const Joi = require('joi');
const { copy } = require('../routes/v1');
//get  Diwo Pathways By Using ID for assignment

const getDiwoPathwayByIdForAssignment = async function (req, res) {
	try {
		let err, pathwayData, pathwayCourseModuleData, assignmentData;
		let pathwayId = req.params.pathwayId;
		let finalAssignmentData = [];

		[err, pathwayCourseModuleData] = await to(
			PathwayCourseMapping.findAll({
				where: {
					PathwayId: pathwayId,
				},
				order: [['ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, pathwayData] = await to(
			Pathway.findOne({
				where: {
					id: pathwayId,
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
				],
				attributes: [
					'id',
					'title',
					'l_outcomes',
					'e_duration',
					'avatar',
					'avatar_file_name',
					'customFields',
					'version',
					'status',
					'createdAt',
					'updatedAt',
				],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let pathwaysDetail = pathwayData.convertToJSON();
		[err, localUser] = await to(
			dbInstance[pathwaysDetail.User.Market.db_name].User_master.findOne({
				where: {
					id: pathwaysDetail.User.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		pathwaysDetail.author = localUser.first + ' ' + localUser.last;
		delete pathwaysDetail.User;

		return ResponseSuccess(res, {
			data: {
				pathwaysDetail,
				pathwayCourseModuleData,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoPathwayByIdForAssignment = getDiwoPathwayByIdForAssignment;

//get  Diwo Course By Using ID for assignment
const getDiwoCourseByIdForAssignment = async function (req, res) {
	try {
		let err, courseData, courseModuleData;
		let courseId = req.params.courseId;
		let finalAssignmentData = [];

		[err, courseModuleData] = await to(
			Course_workbook_mapping.findAll({
				where: {
					CourseId: courseId,
				},
				include: [{ model: Workbook, attributes: ['id', 'BaseWorkbookId', 'default', 'version'] }],
				order: [['ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, courseData] = await to(
			Course.findOne({
				where: {
					id: courseId,
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
				],
				attributes: [
					'id',
					'title',
					'l_outcomes',
					'e_duration',
					'avatar',
					'avatar_file_name',
					'customFields',
					'version',
					'status',
					'createdAt',
					'updatedAt',
				],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let courseDetail = courseData.convertToJSON();
		[err, localUser] = await to(
			dbInstance[courseDetail.User.Market.db_name].User_master.findOne({
				where: {
					id: courseDetail.User.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		courseDetail.author = localUser.first + ' ' + localUser.last;
		delete courseDetail.User;

		return ResponseSuccess(res, {
			data: {
				courseDetail,
				courseModuleData,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoCourseByIdForAssignment = getDiwoCourseByIdForAssignment;

//get  Diwo  list for assignment
const getDiwoAssignmentList = async function (req, res) {
	try {
		let err, assignmentData;
		let finalAssignmentData = [];

		let offset = 0;
		let limit = parseInt(req.query.limit);
		let page = parseInt(req.query.page);

		if (limit == 'all') {
			offset = undefined;
			limit = undefined;
		} else {
			if (page != NaN && page >= 1) offset = (page - 1) * limit;
		}

		let whereCondition = [];
		let CourseId;
		let ModuleId;
		let PathwayId;

		if (req.query.moduleId) {
			ModuleId = parseInt(req.query.moduleId);
			//Get All version of the Workbook
			let allVersion = [];
			let payload = [];
			[err, allVersion] = await to(
				Workbook.findAll({
					where: {
						BaseWorkbookId: ModuleId,
					},
					attributes: ['id', 'BaseWorkbookId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (allVersion?.length > 0) {
				for (let data of allVersion) {
					payload.push(data.id);
				}
			} else {
				payload.push(ModuleId);
			}
			whereCondition.push({
				WorkbookId: payload,
			});
		} else if (req.query.courseId) {
			CourseId = parseInt(req.query.courseId);
			whereCondition.push({
				CourseId: CourseId,
			});
		} else if (req.query.pathwayId) {
			PathwayId = parseInt(req.query.pathwayId);
			whereCondition.push({
				PathwayId: PathwayId,
			});
		}

		[err, assignmentData] = await to(
			DiwoAssignment.findAndCountAll({
				where: whereCondition,
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
						model: DiwoAssignUserGroupMapping,
						include: [
							{
								model: User_group,
							},
						],
					},
				],
				order: [['id', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (assignmentData && assignmentData.rows && assignmentData.rows.length > 0) {
			for (let assignment of assignmentData.rows) {
				let updatedAssignment = assignment.convertToJSON();

				[err, localUser] = await to(
					dbInstance[updatedAssignment.User.Market.db_name].User_master.findOne({
						where: {
							id: updatedAssignment.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					updatedAssignment.author = localUser.first + ' ' + localUser.last;
				}

				let groupList = [];
				for (let group of updatedAssignment.DiwoAssignUserGroupMappings) {
					groupList.push(group.User_group.title);
				}

				updatedAssignment.learnerGroupName = groupList.toString();

				delete updatedAssignment.DiwoAssignUserGroupMapping;
				delete updatedAssignment.User;
				finalAssignmentData.push(updatedAssignment);
			}
		}

		return ResponseSuccess(res, {
			data: finalAssignmentData,
			count: assignmentData.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoAssignmentList = getDiwoAssignmentList;

//get  Diwo MOdule By Using ID for assignment
const getDiwoModuleByIdForAssignment = async function (req, res) {
	try {
		let err, workbook;
		let workbookId = req.params.workbookId;
		let finalAssignmentData = [];

		[err, workbook] = await to(
			Workbook.findOne({
				where: {
					BaseWorkbookId: parseInt(workbookId),
					default: true,
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
						model: DiwoModule,
						attributes: ['id', 'type'],
					},
				],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let _workbook = workbook.convertToJSON();

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
					WorkbookId: _workbook.id,
				},
				attributes: ['id', 'fileName', 'path'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (diwoAsset && diwoAsset.length > 0) {
			_workbook.DiwoAssets = diwoAsset;
		} else {
			_workbook.DiwoAssets = [];
		}

		[err, localUser] = await to(
			dbInstance[_workbook.User.Market.db_name].User_master.findOne({
				where: {
					id: _workbook.User.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		_workbook.author = localUser.first + ' ' + localUser.last;
		delete _workbook.User;
		return ResponseSuccess(res, {
			data: {
				_workbook,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoModuleByIdForAssignment = getDiwoModuleByIdForAssignment;

const getLearnerGroupForAssignment = async function (req, res) {
	try {
		let userId = req.query.userId;
		let roleId = req.query.roleId;
		let clientId = req.query.clientId;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);
		let learner_;
		let learnerGroups;
		let list = [];
		let type = req.query.type;

		[err, learnerGroups] = await to(
			User_group.findAll({
				where: {
					// UserId: userId,
					is_deleted: false,
					// RoleId: roleId,
					ClientId: allSubClientIds,
					forDiwo: true,
				},
				include: [
					{
						model: User,
						through: 'User_group_mapping',
						attributes: ['id'],
						where: {
							forDiwo: true,
						},
					},
					{
						model: Client,
						attributes: ['name'],
						where: {
							DiwoAccess: true,
						},
					},
				],
				attributes: ['id', 'title', 'userCount', 'forDiwo'],
				order: [['createdAt', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		for (let learner of learnerGroups) {
			learner_ = learner.convertToJSON();
			learner_.title =
				learner_.id +
				' - ' +
				learner_.title +
				' (' +
				learner_.userCount +
				')' +
				' - ' +
				'(' +
				learner_.Client.name +
				')';
			list.push(learner_);
		}

		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupForAssignment = getLearnerGroupForAssignment;

//Create Diwo Assignment
const createDiwoAssignment = async function (req, res) {
	try {
		let UserId = req.user.id;
		let ClientId = req.user.ClientId;
		let RoleId = req.user.RoleId;
		let assingmentTypeId = parseInt(req.params.id);
		let assignType = req.params.assignType;
		let trainerIds = [];
		let groupLearner = [];

		let assignmentDetail = req.body.assignmentDetails;
		let selectedModules = req.body.selectedModuleList;

		let assignmentCopy = {};
		//security check
		//learner Group Selection

		let diwoAssignmnetPayload = {
			PathwayId: null,
			CourseId: null,
			ModuleId: null,
			UserId: UserId,
			ClientId: ClientId,
			RoleId: RoleId,
			StartDate: assignmentDetail && assignmentDetail[0].assignmentStartDateTime,
			EndDate: assignmentDetail && assignmentDetail[0].assignmentEndDateTime,
			status: assignmentDetail && assignmentDetail[0].status,
		};

		// Need to Update Course and Pathway Versionn Also
		if (assignType == 'Pathway') {
			diwoAssignmnetPayload.PathwayId = assingmentTypeId;

			[err, pathwayVersion] = await to(
				Pathway.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, pathwayCourse] = await to(
				PathwayCourseMapping.findAll({
					where: {
						PathwayId: assingmentTypeId,
					},
					include: [{ model: Course }],
					attributes: ['id', 'PathwayId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (pathwayVersion) {
				assignmentCopy.Pathway = pathwayVersion.convertToJSON();
				diwoAssignmnetPayload.version = pathwayVersion.version;
			}

			assignmentCopy.Courses = [];
			if (pathwayCourse) {
				for (let courseDetail of pathwayCourse) {
					courseDetail = courseDetail.convertToJSON();
					if (courseDetail?.Course) {
						let flag = true;
						for (let temp of assignmentCopy.Courses) {
							if (temp.id == courseDetail.Course.id) {
								flag = false;
								break;
							}
						}
						if (flag) {
							assignmentCopy.Courses.push(courseDetail.Course);
						}
					}
				}
			}
		} else if (assignType == 'Course') {
			diwoAssignmnetPayload.CourseId = assingmentTypeId;

			[err, courseVersion] = await to(
				Course.findOne({
					where: {
						id: assingmentTypeId,
					},
					// attributes: ['id', 'version'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (courseVersion) {
				assignmentCopy.Course = courseVersion.convertToJSON();
				diwoAssignmnetPayload.version = courseVersion.version;
			}
		} else if (assignType == 'Module') {
			// diwoAssignmnetPayload.WorkbookId = assingmentTypeId;

			[err, moduleVersion] = await to(
				Workbook.findOne({
					where: {
						BaseWorkbookId: assingmentTypeId,
						default: true,
					},
					// attributes: ['id', 'version'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (moduleVersion) {
				diwoAssignmnetPayload.version = moduleVersion.version;
				assignmentCopy.Module = moduleVersion.convertToJSON();
				diwoAssignmnetPayload.WorkbookId = moduleVersion.id;
			}
		}

		// console.log('---assignmentCopy--', assignmentCopy);
		diwoAssignmnetPayload.assignmentCopy = JSON.stringify(assignmentCopy);
		diwoAssignmnetPayload.StartDate = moment(new Date(diwoAssignmnetPayload.StartDate)).format();
		diwoAssignmnetPayload.EndDate = moment(new Date(diwoAssignmnetPayload.EndDate)).format();

		[err, createDiwo_Assignment] = await to(DiwoAssignment.create(diwoAssignmnetPayload));
		if (err) return ResponseError(res, err, 500, true);

		let DiwoAssignmentId = createDiwo_Assignment.id;

		// Add Learner Group Details
		if (
			assignmentDetail &&
			assignmentDetail[0].selectedLearnerGroup &&
			assignmentDetail[0].selectedLearnerGroup.length > 0
		) {
			let userGroupAssignMappings = [];
			for (let userGroup of assignmentDetail[0].selectedLearnerGroup) {
				let userGroup_Payload = {
					DiwoAssignmentId: DiwoAssignmentId,
					UserGroupId: userGroup,
				};

				userGroupAssignMappings.push(userGroup_Payload);
			}

			[err, createDiwoUserGroupAssignMapping] = await to(
				DiwoAssignUserGroupMapping.bulkCreate(userGroupAssignMappings)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		// Add Every selected Module Entry into the DiwoModuleAssign Table
		if (selectedModules && selectedModules.length > 0) {
			let diwoModules = [];
			for (let item of selectedModules) {
				let payload = {
					DiwoAssignmentId: DiwoAssignmentId,
					WorkbookId: item.WorkbookId,
					ModuleName: item.ModuleName,
					ModuleTypeName: item.ModuleTypeName,
					ModuleStartDate: item.ModuleStartDateTime,
					ModuleEndDate: item.ModuleEndtDateTime,
					ModuleIndex: item.ModuleIndex ? item.ModuleIndex : 0,
					CourseId: item.CourseId,
					CourseIndex: item.CourseIndex ? item.CourseIndex : 0,
					CourseName: item.CourseName,
					DiwoModuleId: item.DiwoModuleId,
					TrainerId: item.TrainerId,
					isAssignmentCertification: item.isCertificationModule,
					ModuleDepedencyIndex:
						item.ModuleDepedencyIndex && !item.isCertificationModule
							? item.ModuleDepedencyIndex.toString()
							: item.isCertificationModule
							? 'ALL'
							: null,
					ModuleOperation:
						item.ModuleOperation && !item.isCertificationModule
							? item.ModuleOperation
							: item.isCertificationModule
							? 'AND'
							: null,
					isPublish: false,
					CourseVersion: item.CourseVersion ? item.CourseVersion : null,
				};
				trainerIds.push(item.trainerIds);
				diwoModules.push(payload);
			}

			[err, createDiwoCourseModule] = await to(DiwoModuleAssign.bulkCreate(diwoModules));
			if (err) return ResponseError(res, err, 500, true);
		}

		//create Learner Assignment

		if (assignmentDetail && assignmentDetail[0].status != 'Draft') {
			// Save All Learners who's present in the Learner Group
			// saveLearnersAgainestDiwoAssignment(DiwoAssignmentId, false);
			createDiwoLearnerAssignment(createDiwo_Assignment, assignmentDetail, DiwoAssignmentId);
		}

		//For Notification
		[err, getUserData] = await to(
			User.findOne({
				where: {
					id: UserId,
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

		[err, localUserData] = await to(
			dbInstance[getUserData.Market.db_name].User_master.findOne({
				where: {
					id: getUserData.local_user_id,
				},
				attributes: ['first', 'last', 'email'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// const appBrandingData = await getDiwoClientAppBrandingByClientId(ClientId);
		// const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;

		let userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
			localUserData && localUserData.last ? localUserData.last : ''
		}`;

		let userGroupId =
			assignmentDetail && assignmentDetail[0].selectedLearnerGroup ? assignmentDetail[0].selectedLearnerGroup : [];

		let learner_user_ids = [];

		//Get  User Groups
		if (userGroupId && userGroupId.length > 0) {
			[err, groupLearner] = await to(
				User.findAll({
					where: {
						is_deleted: false,
						cStatus: 'Active',
						forDiwo: true,
					},
					include: [
						{
							model: User_group,
							through: 'User_group_mapping',
							where: {
								id: userGroupId,
								forDiwo: true,
							},
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (err) {
				console.log('--------error while fetch diwo assing user group.. ---------', err);
			}
		}

		for (let learner of groupLearner) {
			learner_user_ids.push(learner.id);
		}

		if (assignType == 'Pathway') {
			[err, pathwayDetails] = await to(
				Pathway.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_PATHWAY_CREATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{pathway_name}}', pathwayDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_PATHWAY_CREATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{pathway_name}}', pathwayDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_PATHWAY_CREATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{pathway_name}}', pathwayDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		} else if (assignType == 'Course') {
			[err, courseDetails] = await to(
				Course.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_COURSE_CREATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{course_name}}', courseDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_COURSE_CREATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{course_name}}', courseDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_COURSE_CREATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{course_name}}', courseDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		} else if (assignType == 'Module') {
			[err, moduleDetails] = await to(
				Workbook.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_MODULE_CREATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{module_name}}', moduleDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_MODULE_CREATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{module_name}}', moduleDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_MODULE_CREATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{module_name}}', moduleDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		}

		// Sending reminder emails to learners 7 days before their scheduled workbook assignment
		if (learner_user_ids && learner_user_ids.length > 0) {
			ReminderMailSendToAssignedWorkbooksNotification(req, res);
		}

		/////////////////////////////////////////////////////////

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Assignment`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DiwoAssignmentId: DiwoAssignmentId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.ASSIGNMENT_CREATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDiwoAssignment = createDiwoAssignment;

const ReminderMailSendToAssignedWorkbooksNotification = async function (req, res) {
	try {
		let assignmentDetail = req.body.assignmentDetails;
		let selectedModulesDetail = req.body.selectedModuleList;
		let learner_user_ids = [];
		let allLocalUserData = [];

		let workbookTitle = '',
			projectName = '',
			assignmentEndDateTime = '',
			assignmentStartDateTime = '';

		for (let workbook of selectedModulesDetail) {
			workbookTitle = workbook.ModuleName;
		}

		for (let assignment of assignmentDetail) {
			// assignmentEndDateTime = assignment.assignmentEndDate.endDate;
			assignmentEndDateTime = assignment.assignmentEndDate.startDate;
			assignmentStartDateTime = assignment.assignmentStartDate.startDate;

			console.log('assignment.assignmentStartDate.', assignment.assignmentStartDate);
			console.log('assignment.assignmentEndDate.', assignment.assignmentEndDate);
		}

		let AssignmentstartDate = assignmentStartDateTime.split('T')[0]; // '2025-04-23'
		let AssignmentendDate = assignmentEndDateTime.split('T')[0];

		console.log('assignmentStartDateTime', assignmentStartDateTime);
		console.log('assignmentEndDateTime', assignmentEndDateTime);

		for (let userGroup of assignmentDetail) {
			if (userGroup && userGroup.selectedLearnerGroup.length > 0) {
				let [err, groupLearners] = await to(
					User.findAll({
						where: {
							is_deleted: false,
							cStatus: 'Active',
							forDiwo: true,
						},
						include: [
							{
								model: User_group,
								through: 'User_group_mapping',
								where: {
									id: userGroup.selectedLearnerGroup,
									forDiwo: true,
								},
							},
							{
								model: Market,
								attributes: ['db_name'],
							},
							{
								model: SessionUser,
								where: {
									ModuleStatus: 'Not Started',
								},
							},
						],
						attributes: ['local_user_id'],
					})
				);
				if (err) {
					console.log('Error while fetching group learners', err);
					return ResponseError(res, err, 500, true);
				}

				if (groupLearners && groupLearners.length > 0) {
					for (let learner of groupLearners) {
						learner_user_ids.push(learner.local_user_id);

						const [err, localUserData] = await to(
							dbInstance[learner.Market?.db_name].User_master.findOne({
								where: { id: learner.local_user_id },
								attributes: ['first', 'last', 'email'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (localUserData) {
							allLocalUserData.push(localUserData);
						}
					}
				}
			}
		}

		// console.log('All Local User Data:', allLocalUserData);

		let emailSignatureText = '';

		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData.EmailSignatureText;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData.EmailSignatureText;
		}

		if (config_feature?.configurable_feature?.saas) {
			if (req.user.type == 'drip') {
				projectName = 'Drip';
			} else if (req.user.type == 'diwo') {
				projectName = 'Diwo';
			}
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		// const diffInDays = moment(assignmentEndDateTime).format('YYYY-MM-DD');
		// const today = moment().format('YYYY-MM-DD'); in ist format
		// const daysLeft = moment(diffInDays).diff(moment(today), 'days');

		const diffInDays = moment.utc(assignmentEndDateTime).format('YYYY-MM-DD');
		const today = moment.utc().format('YYYY-MM-DD'); // in utc format coming from the payload
		const daysLeft = moment(diffInDays).diff(moment(today), 'days');

		console.log('diffInDays', diffInDays);
		console.log('today', today);
		console.log('daysLeft', daysLeft);

		const now = moment.utc();
		const assignmentEndMoment = moment.utc(assignmentEndDateTime);
		const duration = moment.duration(assignmentEndMoment.diff(now));
		const totalSeconds = duration.asSeconds();

		console.log('now', now);
		console.log('duration', duration);
		console.log('totalSeconds', totalSeconds);

		if (daysLeft === 7 && allLocalUserData && allLocalUserData.length > 0) {
			for (let user of allLocalUserData) {
				let userPayload = {
					email: user.dataValues.email,
					firstName: user.dataValues.first,
					signature: emailSignatureText,
					projectName: projectName,
					workbookTitle: workbookTitle,
					assigned_date: AssignmentendDate,
				};

				console.log('assigned_date', userPayload.assigned_date);

				[err, mailedReminder07DyasToLearnerText] = await to(
					reminder07DaysSendEmailToLearner(userPayload, req.user.type)
				);
				if (err) {
					console.log('--------Error in Sendgrid--------------', err);
					failed = 'e-mail';
				} else {
					success = 'e-mail';
				}

				// console.log('mailedReminder07DyasToLearnerText', mailedReminder07DyasToLearnerText)
			}
		}

		// if (daysLeft === 1 && allLocalUserData && allLocalUserData.length > 0) {
		if (totalSeconds >= 86340 && totalSeconds <= 86460 && allLocalUserData && allLocalUserData.length > 0) {
			for (let user of allLocalUserData) {
				let userPayload = {
					email: user.dataValues.email,
					firstName: user.dataValues.first,
					signature: emailSignatureText,
					projectName: projectName,
					workbookTitle: workbookTitle,
					assigned_date: AssignmentendDate,
				};

				console.log('assigned_date', userPayload.assigned_date);

				[err, mailedReminder01DyasToLearnerText] = await to(
					reminder01DaysSendEmailToLearner(userPayload, req.user.type)
				);
				if (err) {
					console.log('--------Error in Sendgrid--------------', err);
					failed = 'e-mail';
				} else {
					success = 'e-mail';
				}

				// console.log('mailedReminder01DyasToLearnerText', mailedReminder01DyasToLearnerText);
			}
		}

		// return ResponseSuccess(res, {
		// 	Message: MESSAGE.REMINDER_MAIL_07_DAYS_SEND_TO_ASSIGNED_WORKBOOKS_NOTIFICATION,
		// });
	} catch (error) {
		console.error('Unhandled error:', error);
		// return ResponseError(res, error, 500, true);
	}
};
module.exports.ReminderMailSendToAssignedWorkbooksNotification = ReminderMailSendToAssignedWorkbooksNotification;

//Update Diwo Assignment
const updateDiwoAssignment = async function (req, res) {
	try {
		let UserId = req.user.id;
		let ClientId = req.user.ClientId;
		let RoleId = req.user.RoleId;
		let assingmentTypeId = req.params.id;
		let DiwoAssignmentId = req.params.assignmetId;
		let assignType = req.params.assignType;
		let updateNewVersion = req.body.updateNewVersion;
		let trainerIds = [];
		let groupLearner = [];
		let assignmentCopy = {};

		let assignmentDetail = req.body.assignmentDetails;
		let selectedModules = req.body.selectedModuleList;

		let diwoAssignmnetPayload = {
			PathwayId: null,
			CourseId: null,
			ModuleId: null,
			UserId: UserId,
			ClientId: ClientId,
			RoleId: RoleId,
			StartDate: assignmentDetail && assignmentDetail[0].assignmentStartDateTime,
			EndDate: assignmentDetail && assignmentDetail[0].assignmentEndDateTime,
			status: assignmentDetail && assignmentDetail[0].status,
			// version: assignmentDetail.version,
		};

		// Get DiwoAssignment assignmentCopy
		[err, copyData] = await to(
			DiwoAssignment.findOne({
				where: { id: DiwoAssignmentId },
				attributes: ['id', 'assignmentCopy'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (copyData?.assignmentCopy != null) {
			assignmentCopy = JSON.parse(copyData.assignmentCopy);
		}
		if (diwoAssignmnetPayload.status !== 'Draft') {
			if (moment().isAfter(diwoAssignmnetPayload.StartDate) && moment().isBefore(diwoAssignmnetPayload.EndDate)) {
				diwoAssignmnetPayload.status = 'Assigned';
			} else if (moment().isAfter(diwoAssignmnetPayload.EndDate)) {
				diwoAssignmnetPayload.status = 'Finished';
			} else if (moment().isBefore(diwoAssignmnetPayload.StartDate)) {
				diwoAssignmnetPayload.status = 'Scheduled';
			}
		}
		if (assignType == 'Pathway') {
			diwoAssignmnetPayload.PathwayId = assingmentTypeId;
			if (updateNewVersion) {
				[err, pathwayVersion] = await to(
					Pathway.findOne({
						where: {
							id: assingmentTypeId,
						},
						// attributes: ['id', 'version'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// if (pathwayVersion) {
				// 	diwoAssignmnetPayload.version = pathwayVersion.version;
				// }

				[err, pathwayCourse] = await to(
					PathwayCourseMapping.findAll({
						where: {
							PathwayId: assingmentTypeId,
						},
						include: [{ model: Course }],
						attributes: ['id', 'PathwayId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (pathwayVersion) {
					// if (assignmentCopy.Pathway == undefined || !assignmentCopy.Pathway) {
					assignmentCopy.Pathway = pathwayVersion.convertToJSON();
					// }
					diwoAssignmnetPayload.version = pathwayVersion.version;
				}

				// if (assignmentCopy.Courses == undefined) {
				assignmentCopy.Courses = [];
				// }
				if (pathwayCourse) {
					for (let courseDetail of pathwayCourse) {
						courseDetail = courseDetail.convertToJSON();
						if (courseDetail?.Course) {
							let flag = true;
							for (let temp of assignmentCopy.Courses) {
								if (temp.id == courseDetail.Course.id) {
									flag = false;
									break;
								}
							}
							if (flag) {
								assignmentCopy.Courses.push(courseDetail.Course);
							}
						}
					}
				}
			}
		} else if (assignType == 'Course') {
			diwoAssignmnetPayload.CourseId = assingmentTypeId;
			if (updateNewVersion) {
				[err, courseVersion] = await to(
					Course.findOne({
						where: {
							id: assingmentTypeId,
						},
						// attributes: ['id', 'version'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// if (courseVersion) {
				// 	diwoAssignmnetPayload.version = courseVersion.version;
				// }

				if (courseVersion) {
					// if (assignmentCopy.Course == undefined || !assignmentCopy.Course) {
					assignmentCopy.Course = courseVersion.convertToJSON();
					// }
					diwoAssignmnetPayload.version = courseVersion.version;
				}
			}
		} else if (assignType == 'Module') {
			// diwoAssignmnetPayload.WorkbookId = assingmentTypeId;
			if (updateNewVersion) {
				[err, moduleVersion] = await to(
					Workbook.findOne({
						where: {
							BaseWorkbookId: assingmentTypeId,
							default: true,
						},
						// attributes: ['id', 'version'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (moduleVersion) {
					diwoAssignmnetPayload.version = moduleVersion.version;
					assignmentCopy.Module = moduleVersion.convertToJSON();
					diwoAssignmnetPayload.WorkbookId = moduleVersion.id;
				}
			}
		}

		diwoAssignmnetPayload.StartDate = moment(new Date(diwoAssignmnetPayload.StartDate)).format();
		diwoAssignmnetPayload.EndDate = moment(new Date(diwoAssignmnetPayload.EndDate)).format();

		diwoAssignmnetPayload.assignmentCopy = JSON.stringify(assignmentCopy);
		[err, update_DiwoAssignment] = await to(
			DiwoAssignment.update(diwoAssignmnetPayload, {
				where: {
					id: DiwoAssignmentId,
				},
				returning: true,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get All Existing DiwoAssignModule
		[err, getAllDiwoModuleAssign] = await to(
			DiwoModuleAssign.findAll({
				where: {
					DiwoAssignmentId: DiwoAssignmentId,
				},
				include: [{ model: Workbook, attributes: ['id', 'BaseWorkbookId', 'version', 'default'] }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (updateNewVersion) {
			if (assignType == '') {
				////////////////////////////////////////////////////////////////
				/// Need to change the code for Course Assignment Version Control
				/////////////////////////////////////////////////////////////////
				let needtoDeleteAssignmentIds = [];
				let createNewModuleEntry = [];
				for (let workbook of selectedModules) {
					//Latest Data
					let previousModule;
					for (let wk of getAllDiwoModuleAssign) {
						if (wk.id == workbook?.id) {
							previousModule = wk;
							break;
						}
					}
					// Need to Delete From the DiwoAssignModule Table
					if (
						workbook.id &&
						workbook?.deleted &&
						!workbook?.isPublish &&
						!workbook?.isNew &&
						!workbook?.fromNewVersion
					) {
						if (!previousModule?.isPublish) {
							needtoDeleteAssignmentIds.push(workbook.id);
						}
					} else if (
						workbook.id &&
						!workbook?.isNew &&
						!workbook?.fromNewVersion &&
						previousModule &&
						(previousModule.WorkbookId != workbook.WorkbookId || previousModule.ModuleIndex != workbook.ModuleIndex)
					) {
						let updateCondition = {
							ModuleEndDate: workbook.ModuleEndtDateTime,
						};

						//Chekc ModuleIndex is Changed or Not
						if (workbook.ModuleIndex != previousModule.ModuleIndex) {
							updateCondition.ModuleIndex = workbook.ModuleIndex;
						}

						if (!previousModule?.isPublish) {
							updateCondition.ModuleStartDate = workbook.ModuleStartDateTime;
							//Also Check For update new version of the Module.. then also update Workbook Id in the DiwoAssignModule Table
							//Condition For this is not publish the same module
							if (previousModule.WorkbookId != workbook.WorkbookId) {
								updateCondition.WorkbookId = workbook.WorkbookId;
							}

							//Update Module New Version
							if (workbook?.isUpdateNewVersion) {
								//Update Workbook New Version
								updateCondition.WorkbookId = workbook.WorkbookId;
								updateCondition.ModuleName = workbook.ModuleName;
								updateCondition.TrainerId = workbook.TrainerId;
							}
						}

						// Update in the  DiwoModuleAssign
						[err, updateModuleIndex] = await to(
							DiwoModuleAssign.update(updateCondition, {
								where: {
									id: workbook.id,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (previousModule.isPublish) {
							//Update New ModuleIndex in the SessionUser (ModuleIndex)
							if (Workbook.ModuleIndex != previousModule.ModuleIndex) {
								[err, updateModuleIndex] = await to(
									SessionUser.update(
										{ ModuleIndex: workbook.ModuleIndex },
										{
											where: {
												DiwoModuleAssignId: workbook.id,
											},
										}
									)
								);
								if (err) return ResponseError(res, err, 500, true);
							}

							if (previousModule.DiwoModuleId != 1) {
								//Update End Date in the Session Table
								[err, updateEndDate] = await to(
									Session.update(
										{ enddateWithTime: workbook.ModuleEndtDateTime, dateWithTime: workbook.ModuleStartDateTime },
										{
											where: {
												DiwoAssignmentId: previousModule.DiwoAssignmentId,
												DiwoModuleAssignId: previousModule.id,
											},
										}
									)
								);
								if (err) return ResponseError(res, err, 500, true);
							}
						}
					} else if (workbook.isNew && workbook.fromNewVersion && !workbook?.deleted && !workbook?.isDeleted) {
						let payload = {
							DiwoAssignmentId: DiwoAssignmentId,
							WorkbookId: workbook.WorkbookId,
							ModuleName: workbook.ModuleName,
							ModuleTypeName: workbook.ModuleTypeName,
							ModuleStartDate: workbook.ModuleStartDateTime,
							ModuleEndDate: workbook.ModuleEndtDateTime,
							ModuleIndex: workbook.ModuleIndex ? workbook.ModuleIndex : 0,
							CourseId: workbook.CourseId,
							CourseIndex: workbook?.CourseIndex ? workbook.CourseIndex : 0,
							CourseName: workbook?.CourseName ? workbook.CourseName : null,
							DiwoModuleId: workbook.DiwoModuleId,
							TrainerId: workbook.TrainerId,
							isAssignmentCertification: workbook.isCertificationModule,
							ModuleDepedencyIndex:
								workbook?.ModuleDepedencyIndex && !workbook.isCertificationModule
									? workbook.ModuleDepedencyIndex.toString()
									: workbook.isCertificationModule
									? 'ALL'
									: null,
							ModuleOperation:
								workbook.ModuleOperation && !workbook.isCertificationModule
									? workbook.ModuleOperation
									: workbook.isCertificationModule
									? 'AND'
									: null,
							CourseVersion: workbook.CourseVersion ? workbook.CourseVersion : null,
						};
						createNewModuleEntry.push(payload);
					}
				}
				if (needtoDeleteAssignmentIds.length > 0) {
					//Also need to delete from Session User and Session Table
					[err, deleteSessionUser] = await to(
						SessionUser.destroy({
							where: {
								DiwoModuleAssignId: needtoDeleteAssignmentIds,
								DiwoAssignmentId: DiwoAssignmentId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					[err, deleteSession] = await to(
						Session.destroy({
							where: {
								DiwoModuleAssignId: needtoDeleteAssignmentIds,
								DiwoAssignmentId: DiwoAssignmentId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					[err, deleteDiwoAssignModule] = await to(
						DiwoModuleAssign.destroy({ where: { id: needtoDeleteAssignmentIds, isPublish: false } })
					);
					if (err) return ResponseError(res, err, 500, true);
				}
				if (createNewModuleEntry.length > 0) {
					[err, createDiwoCourseModule] = await to(DiwoModuleAssign.bulkCreate(createNewModuleEntry));
					if (err) return ResponseError(res, err, 500, true);
				}
			} else if (assignType == 'Pathway' || assignType == 'Course' || assignType == 'Module') {
				console.log('-----In to The Pathway and Course Assignments------');
				console.log('-------getAllDiwoModuleAssign---------', getAllDiwoModuleAssign.length);
				console.log('-------selectedModules---------', selectedModules.length);
				//Need to Edit Module Details
				// If Already published then only End Date
				//if not Publish then can update start Date and End date
				let needtoDeleteAssignmentIds = [];
				for (let module of getAllDiwoModuleAssign) {
					let canDelete = true;
					for (let newModule of selectedModules) {
						if (
							newModule.CourseId == module.CourseId &&
							newModule.WorkbookId == module.WorkbookId &&
							newModule.ModuleIndex == module.ModuleIndex &&
							(newModule.CourseIndex == module.CourseIndex || newModule?.CourseIndex == undefined)
						) {
							canDelete = false;
							//Update Start Date and End Date
							let updatePayload = {
								ModuleEndDate: newModule.ModuleEndtDateTime,
								TrainerId: newModule?.TrainerId ? newModule.TrainerId : null,
							};
							if (!module.isPublish) {
								updatePayload.ModuleStartDate = newModule.ModuleStartDateTime;
								updatePayload.ModuleDepedencyIndex = newModule.ModuleDepedencyIndex;
							}

							[err, updateModuleDates] = await to(
								DiwoModuleAssign.update(updatePayload, {
									where: {
										id: module.id,
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							// console.log('-module-', module);
							// console.log('-newModule-', newModule);
							// console.log('-DiwoAssignmentId-', DiwoAssignmentId);

							//Addde New Code

							if (!module.isPublish && module.DiwoModuleId != 1) {
								//Update Start Date and End Date in the Session Table
								[err, updateEndDate] = await to(
									Session.update(
										{ enddateWithTime: newModule.ModuleEndtDateTime, dateWithTime: newModule.ModuleStartDateTime },
										{
											where: {
												DiwoAssignmentId: DiwoAssignmentId,
												DiwoModuleAssignId: module.id,
											},
										}
									)
								);
								if (err) return ResponseError(res, err, 500, true);
							}
						}
					}

					if (!module.isPublish) {
						if (canDelete) {
							needtoDeleteAssignmentIds.push(module.id);
						}
					}
				}

				//Delete Moduel Form COurse-Pathways
				if (needtoDeleteAssignmentIds.length > 0) {
					[err, deleteSessionUser] = await to(
						SessionUser.destroy({
							where: {
								DiwoModuleAssignId: needtoDeleteAssignmentIds,
								DiwoAssignmentId: DiwoAssignmentId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					[err, deleteSession] = await to(
						Session.destroy({
							where: {
								DiwoModuleAssignId: needtoDeleteAssignmentIds,
								DiwoAssignmentId: DiwoAssignmentId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					[err, deleteModuleFromAssignment] = await to(
						DiwoModuleAssign.destroy({
							where: {
								id: needtoDeleteAssignmentIds,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				//Create new Module entry
				let createNewModuleEntry = [];
				for (let module of selectedModules) {
					if (module.isPublish) {
						//Add Any Changes if required
					} else {
						//Check Module is already present or not
						if (
							getAllDiwoModuleAssign.findIndex(
								(data) =>
									data.ModuleIndex == module.ModuleIndex &&
									data.WorkbookId == module.WorkbookId &&
									data.CourseId == module.CourseId &&
									(data.CourseIndex == module.CourseIndex || module?.CourseIndex == undefined)
							) == -1
						) {
							let payload = {
								DiwoAssignmentId: DiwoAssignmentId,
								WorkbookId: module.WorkbookId,
								ModuleName: module.ModuleName,
								ModuleTypeName: module.ModuleTypeName,
								ModuleStartDate: module.ModuleStartDateTime,
								ModuleEndDate: module.ModuleEndtDateTime,
								ModuleIndex: module.ModuleIndex ? module.ModuleIndex : 0,
								CourseId: module.CourseId,
								CourseIndex: module?.CourseIndex ? module.CourseIndex : 0,
								CourseName: module?.CourseName ? module.CourseName : null,
								DiwoModuleId: module.DiwoModuleId,
								TrainerId: module.TrainerId ? module.TrainerId : null, // Need to Check this thing
								isAssignmentCertification: module.isCertificationModule,
								///////////////////////////////Need to Check this////////////////////////////////
								///////////////////////////////Need to Check this////////////////////////////////
								///////////////////////////////Need to Check this////////////////////////////////
								ModuleDepedencyIndex: module.ModuleDepedencyIndex,
								ModuleOperation: module.ModuleOperation,
								// ModuleDepedencyIndex:
								// 	module?.ModuleDepedencyIndex && !module.isCertificationModule
								// 		? module.ModuleDepedencyIndex.toString()
								// 		: module.isCertificationModule
								// 		? 'ALL'
								// 		: null,
								// ModuleOperation:
								// 	module.ModuleOperation && !module.isCertificationModule
								// 		? module.ModuleOperation
								// 		: module.isCertificationModule
								// 		? 'AND'
								// 		: null,
								///////////////////////////////Need to Check this////////////////////////////////
								///////////////////////////////Need to Check this////////////////////////////////
								///////////////////////////////Need to Check this////////////////////////////////
								CourseVersion: module.CourseVersion ? module.CourseVersion : null,
							};
							createNewModuleEntry.push(payload);
						}
					}
				}

				if (createNewModuleEntry.length > 0) {
					[err, entryNewModules] = await to(DiwoModuleAssign.bulkCreate(createNewModuleEntry));
					if (err) return ResponseError(res, err, 500, true);

					//Check need to create Session and SessionUser or Not
				}
			}
		} else {
			// For Normal Update
			// Update TrainerId, StartDate(if Not publish), End Data
			for (let workbook of selectedModules) {
				let previousModule;
				for (let wk of getAllDiwoModuleAssign) {
					if (wk.id == workbook.id) {
						previousModule = wk;
						break;
					}
				}

				let updateCondition = {
					ModuleEndDate: workbook.ModuleEndtDateTime,
					TrainerId: workbook.TrainerId,
				};
				if (!previousModule?.isPublish) {
					updateCondition.ModuleStartDate = workbook.ModuleStartDateTime;
				}

				// Update in the  DiwoModuleAssign
				[err, updateModuleIndex] = await to(
					DiwoModuleAssign.update(updateCondition, {
						where: {
							id: workbook.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (previousModule?.isPublish) {
					if (previousModule?.DiwoModuleId != 1) {
						//Update End Date in the Session Table
						[err, updateEndDate] = await to(
							Session.update(
								{ enddateWithTime: workbook.ModuleEndtDateTime, dateWithTime: workbook.ModuleStartDateTime },
								{
									where: {
										DiwoAssignmentId: previousModule.DiwoAssignmentId,
										DiwoModuleAssignId: previousModule.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
			}
		}

		//Need to Think About it
		const updatedDiwoAssignment = update_DiwoAssignment[1][0]; // Extract the updated object
		if (diwoAssignmnetPayload.status == 'Scheduled') {
			// Delete Old Learner Group Data and Add New One
			[err, deleteDiwoAssignUserGroupMapping] = await to(
				DiwoAssignUserGroupMapping.destroy({
					where: {
						DiwoAssignmentId: DiwoAssignmentId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (
				assignmentDetail &&
				assignmentDetail[0].selectedLearnerGroup &&
				assignmentDetail[0].selectedLearnerGroup.length > 0
			) {
				let userGroupAssignMappings = [];
				for (let userGroup of assignmentDetail[0].selectedLearnerGroup) {
					let userGroup_Payload = {
						DiwoAssignmentId: DiwoAssignmentId,
						UserGroupId: userGroup,
					};
					userGroupAssignMappings.push(userGroup_Payload);
				}
				[err, createDiwoUserGroupAssignMapping] = await to(
					DiwoAssignUserGroupMapping.bulkCreate(userGroupAssignMappings)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			[err, deleteLearnerAssignment] = await to(
				LearnerAssignment.destroy({
					where: { DiwoAssignmentId: DiwoAssignmentId },
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Delete Session and SessionUser Details also

			createDiwoLearnerAssignment(updatedDiwoAssignment, assignmentDetail, DiwoAssignmentId);
		} else if (diwoAssignmnetPayload.status != 'Scheduled' && diwoAssignmnetPayload.status != 'Finished') {
			//Create New Added Module Session and SessionUser
			//Get  User Groups
			[err, Assign_UserGrouplist] = await to(
				DiwoAssignUserGroupMapping.findAll({
					where: {
						// UserGroupId: userGroupId,
						DiwoAssignmentId: DiwoAssignmentId,
					},
					include: [
						{
							model: User_group,
							attributes: ['id'],
							include: [
								{
									model: User,
									where: {
										cStatus: 'Active',
									},
									attributes: ['id'],
								},
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			let learner_user_ids = [];
			for (let userAssignlist of Assign_UserGrouplist) {
				if (userAssignlist.User_group && userAssignlist.User_group.Users.length > 0) {
					for (let user of userAssignlist.User_group.Users) {
						if (!learner_user_ids.includes(user.id)) learner_user_ids.push(user.id);
					}
				}
			}
			createSessionForLearner(updatedDiwoAssignment, learner_user_ids);
		}

		//For Notification
		[err, getUserData] = await to(
			User.findOne({
				where: {
					id: UserId,
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

		[err, localUserData] = await to(
			dbInstance[getUserData.Market.db_name].User_master.findOne({
				where: {
					id: getUserData.local_user_id,
				},
				attributes: ['first', 'last', 'email'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// const appBrandingData = await getDiwoClientAppBrandingByClientId(ClientId);
		// const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;

		let userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
			localUserData && localUserData.last ? localUserData.last : ''
		}`;

		let userGroupId =
			assignmentDetail && assignmentDetail[0].selectedLearnerGroup ? assignmentDetail[0].selectedLearnerGroup : [];

		let learner_user_ids = [];

		//Get  User Groups
		if (userGroupId && userGroupId.length > 0) {
			[err, groupLearner] = await to(
				User.findAll({
					where: {
						is_deleted: false,
						cStatus: 'Active',
						forDiwo: true,
					},
					include: [
						{
							model: User_group,
							through: 'User_group_mapping',
							where: {
								id: userGroupId,
								forDiwo: true,
							},
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (err) {
				console.log('--------error while fetch diwo assing user group.. ---------', err);
			}
		}

		for (let learner of groupLearner) {
			learner_user_ids.push(learner.id);
		}

		if (assignType == 'Pathway') {
			[err, pathwayDetails] = await to(
				Pathway.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_PATHWAY_UPDATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{pathway_name}}', pathwayDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_PATHWAY_UPDATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{pathway_name}}', pathwayDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_PATHWAY_UPDATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{pathway_name}}', pathwayDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		} else if (assignType == 'Course') {
			[err, courseDetails] = await to(
				Course.findOne({
					where: {
						id: assingmentTypeId,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_COURSE_UPDATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{course_name}}', courseDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_COURSE_UPDATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{course_name}}', courseDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_COURSE_UPDATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{course_name}}', courseDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		} else if (assignType == 'Module') {
			[err, moduleDetails] = await to(
				Workbook.findOne({
					where: {
						BaseWorkbookId: assingmentTypeId,
						default: true,
					},
				})
			);

			let notifcationMessage_1 = MESSAGE.ASSIGNMENT_MODULE_UPDATE_NOTIFICATION1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{module_name}}', moduleDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [UserId]);

			let notifcationMessage_3 = MESSAGE.ASSIGNMENT_MODULE_UPDATE_NOTIFICATION2;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{module_name}}', moduleDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learner_user_ids);

			if (trainerIds && trainerIds.length > 0) {
				let notifcationMessage_2 = MESSAGE.ASSIGNMENT_MODULE_UPDATE_NOTIFICATION1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{module_name}}', moduleDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);
			}
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Assignment`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DiwoAssignmentId: DiwoAssignmentId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.ASSIGNMENT_CREATED,
		});

		// [err, deleteDiwoModuleAssign] = await to(
		// 	DiwoModuleAssign.destroy({
		// 		where: {
		// 			DiwoAssignmentId: DiwoAssignmentId,
		// 		},
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// if (selectedModules && selectedModules.length > 0) {
		// 	let diwoModulesCopy = [];
		// 	for (let item of selectedModules) {
		// 		let payload = {
		// 			DiwoAssignmentId: DiwoAssignmentId,
		// 			WorkbookId: item.WorkbookId,
		// 			ModuleName: item.ModuleName,
		// 			ModuleTypeName: item.ModuleTypeName,
		// 			ModuleStartDate: item.ModuleStartDateTime,
		// 			ModuleEndDate: item.ModuleEndtDateTime,
		// 			ModuleIndex: item.ModuleIndex ? item.ModuleIndex : 0,
		// 			CourseId: item.CourseId,
		// 			CourseIndex: item.CourseIndex ? item.CourseIndex : 0,
		// 			CourseName: item.CourseName,
		// 			DiwoModuleId: item.DiwoModuleId,
		// 			TrainerId: item.TrainerId,
		// 			isAssignmentCertification: item.isCertificationModule,
		// 			ModuleDepedencyIndex:
		// 				item.ModuleDepedencyIndex && !item.isCertificationModule
		// 					? item.ModuleDepedencyIndex.toString()
		// 					: item.isCertificationModule
		// 					? 'ALL'
		// 					: null,
		// 			ModuleOperation:
		// 				item.ModuleOperation && !item.isCertificationModule
		// 					? item.ModuleOperation
		// 					: item.isCertificationModule
		// 					? 'AND'
		// 					: null,
		// 			CourseVersion: item.CourseVersion ? item.CourseVersion : null,
		// 		};
		// 		diwoModulesCopy.push(payload);
		// 	}
		// 	[err, createDiwoCourseModule] = await to(DiwoModuleAssign.bulkCreate(diwoModulesCopy));
		// 	if (err) return ResponseError(res, err, 500, true);
		// }
		// //create Learner Assignment

		// if (assignmentDetail && assignmentDetail[0].status != 'Draft') {
		// 	//Remove Existing Data

		// 	let sessionIds = [];
		// 	let sessionUserIds = [];
		// 	let sessionWorksheetIds = [];
		// 	let sessionAssetIds = [];
		// 	let sessionQuestionIds = [];

		// 	if (DiwoAssignmentId) {
		// 		let sessionQuery = `SELECT ARRAY (SELECT "id" FROM "Sessions" WHERE "DiwoAssignmentId" IN (${DiwoAssignmentId}));`;
		// 		[sessionid] = await sequelize.query(sessionQuery);
		// 		sessionIds = sessionid[0]?.array || [];
		// 	}

		// 	if (sessionIds.length > 0) {
		// 		let sessionUserQuery = `SELECT ARRAY (SELECT "id" FROM "SessionUsers" WHERE "SessionId" IN (${sessionIds.join(
		// 			','
		// 		)}) AND "forTrainer" = false);`;
		// 		[sessionuserid] = await sequelize.query(sessionUserQuery);
		// 		sessionUserIds = sessionuserid[0]?.array || [];
		// 	}

		// 	if (sessionUserIds.length > 0) {
		// 		let sessionWorksheetQuery = `SELECT ARRAY (SELECT "id" FROM "SessionWorksheets" WHERE "SessionUserId" IN (${sessionUserIds.join(
		// 			','
		// 		)}));`;
		// 		[sessionworksheetid] = await sequelize.query(sessionWorksheetQuery);
		// 		sessionWorksheetIds = sessionworksheetid[0]?.array || [];
		// 	}

		// 	if (sessionWorksheetIds.length > 0) {
		// 		let sessionAssetQuery = `SELECT ARRAY (SELECT "id" FROM "SessionAssets" WHERE "SessionWorksheetId" IN (${sessionWorksheetIds.join(
		// 			','
		// 		)}));`;
		// 		[sessionassetid] = await sequelize.query(sessionAssetQuery);
		// 		sessionAssetIds = sessionassetid[0]?.array || [];

		// 		let sessionQuestionQuery = `SELECT ARRAY (SELECT "id" FROM "SessionQuestions" WHERE "SessionWorksheetId" IN (${sessionWorksheetIds.join(
		// 			','
		// 		)}));`;
		// 		[sessionquestionid] = await sequelize.query(sessionQuestionQuery);
		// 		sessionQuestionIds = sessionquestionid[0]?.array || [];
		// 	}

		// 	// Ensure only non-empty arrays are passed to the destroy calls
		// 	if (sessionQuestionIds.length > 0) {
		// 		[err, deleteSessionOption] = await to(
		// 			SessionOption.destroy({
		// 				where: { SessionQuestionId: sessionQuestionIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);

		// 		[err, deleteSessionQuestion] = await to(
		// 			SessionQuestion.destroy({
		// 				where: { id: sessionQuestionIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	if (sessionAssetIds.length > 0) {
		// 		[err, deleteSessionAsset] = await to(
		// 			SessionAsset.destroy({
		// 				where: { id: sessionAssetIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	if (sessionWorksheetIds.length > 0) {
		// 		[err, deleteSessionWorksheet] = await to(
		// 			SessionWorksheet.destroy({
		// 				where: { id: sessionWorksheetIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	if (sessionUserIds.length > 0) {
		// 		[err, deleteSessionUser] = await to(
		// 			SessionUser.destroy({
		// 				where: { id: sessionUserIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	if (sessionIds.length > 0) {
		// 		[err, deleteSession] = await to(
		// 			Session.destroy({
		// 				where: { id: sessionIds },
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	[err, deleteLearnerAssignment] = await to(
		// 		LearnerAssignment.destroy({
		// 			where: { DiwoAssignmentId: DiwoAssignmentId },
		// 		})
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);

		// 	if (update_DiwoAssignment[1].length > 0) {
		// 		const updatedDiwoAssignment = update_DiwoAssignment[1][0]; // Extract the updated object
		// 		// saveLearnersAgainestDiwoAssignment(DiwoAssignmentId, true);
		// 		createDiwoLearnerAssignment(updatedDiwoAssignment, assignmentDetail, DiwoAssignmentId);
		// 	}
		// }
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDiwoAssignment = updateDiwoAssignment;

const createDiwoLearnerAssignment = async function (DiwoAssignment, assignmentDetail, DiwoAssignmentId) {
	try {
		let userGroupId =
			assignmentDetail && assignmentDetail[0].selectedLearnerGroup ? assignmentDetail[0].selectedLearnerGroup : [];

		let learner_user_ids = [];
		let Assign_UserGrouplist;

		//Get  User Groups
		[err, Assign_UserGrouplist] = await to(
			DiwoAssignUserGroupMapping.findAll({
				where: {
					UserGroupId: userGroupId,
					DiwoAssignmentId: DiwoAssignmentId,
				},
				include: [
					{
						model: User_group,
						attributes: ['id'],
						include: [
							{
								model: User,
								where: {
									cStatus: 'Active',
								},
								attributes: ['id'],
							},
						],
					},
				],
			})
		);

		if (err) {
			console.log('--------error while fetch diwo assing user group mapping ---------', err);
		}

		for (let userAssignlist of Assign_UserGrouplist) {
			if (userAssignlist.User_group && userAssignlist.User_group.Users.length > 0) {
				for (let user of userAssignlist.User_group.Users) {
					if (!learner_user_ids.includes(user.id)) learner_user_ids.push(user.id);
				}
			}
		}

		if (learner_user_ids && learner_user_ids.length > 0) {
			let diwoLeanerAssignment = [];
			for (let item of learner_user_ids) {
				let payload = {
					DiwoAssignmentId: DiwoAssignmentId,
					UserId: item,
					ClientId: DiwoAssignment.ClientId,
					StartDate: assignmentDetail && assignmentDetail[0].assignmentStartDateTime,
					EndDate: assignmentDetail && assignmentDetail[0].assignmentEndDateTime,
				};
				diwoLeanerAssignment.push(payload);

				if (diwoLeanerAssignment.length >= 50) {
					[err, createLeanerAssignment] = await to(LearnerAssignment.bulkCreate(diwoLeanerAssignment));
					if (err) {
						console.log('--------error while create learner assignment -----1----', err);
					}
					diwoLeanerAssignment = [];
				}
			}

			if (diwoLeanerAssignment.length > 0) {
				[err, createLeanerAssignment] = await to(LearnerAssignment.bulkCreate(diwoLeanerAssignment));
				if (err) {
					console.log('--------error while create learner assignment ----2-----', err);
				}
			}
		}

		createSessionForLearner(DiwoAssignment, learner_user_ids);

		return;
	} catch (error) {
		console.log('--------error---------', error);
	}
};

const randomString = async function (length, chars) {
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
};

// old Code
const createSessionForLearner = async function (diwoAssignment, LearnerUserIds) {
	try {
		let DiwoModuleData;
		[err, DiwoModuleData] = await to(
			DiwoModuleAssign.findAll({
				where: {
					DiwoAssignmentId: diwoAssignment.id,
				},
				order: [['ModuleIndex', 'ASC']],
				include: [{ model: DiwoAssignment, attributes: ['id', 'PathwayId', 'CourseId', 'WorkbookId'] }],
			})
		);
		if (err) {
			console.log('--------error while fetch Diwo Module Assign ---------', err);
		}

		if (DiwoModuleData?.length == 0) {
			return;
		}

		let ConvertedDiwoModuleData = [];
		for (let workbook_ of DiwoModuleData) {
			ConvertedDiwoModuleData.push(workbook_.convertToJSON());
		}

		//Create Session For Every Module

		for (let workbook of ConvertedDiwoModuleData) {
			let WBData;
			let sessionUserEntry;
			let diwoAssets;
			let create_session;
			let sessionUserRecord;
			//Check Already Session is Created or not

			[err, sessionUserRecord] = await to(
				SessionUser.findOne({
					where: {
						DiwoModuleAssignId: workbook.id,
						DiwoAssignmentId: diwoAssignment.id,
					},
				})
			);
			if (err) {
				console.log('--sessionUserRecord---error----', err);
			}

			if (sessionUserRecord) {
				console.log('--continue---');
				workbook.isNotApplicable = true;
				continue;
			} else {
				workbook.isNotApplicable = false;
			}
			console.log('--Not continue--Created New Session-');
			//create only for VBT,WBT,Assignment

			[err, workbookDetails] = await to(
				Workbook.findOne({
					where: {
						id: workbook.WorkbookId,
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

			if (err) {
				console.log('--------error while fetch Workbook for assignment---------', err);
			}

			if (workbookDetails) {
				workbookDetail_ = workbookDetails.convertToJSON();
				for (let worksheet_ of workbookDetail_.Worksheets) {
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
					if (err) {
						console.log('--------error while fetch Question for assignment---------', err);
					}
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
							WorkbookId: workbook.WorkbookId,
						},
					})
				);

				if (err) {
					console.log('--------error while fetch DiwoAsset for assignment---------', err);
				}

				if (diwoAsset && diwoAsset.length > 0) {
					workbookDetail_.DiwoAssets = diwoAsset;
				} else {
					workbookDetail_.DiwoAssets = [];
				}
				WBData = workbookDetail_;
			}

			const rNumber = await randomString(6, '0123456789');
			let sessionName = `${workbook.ModuleName}_${rNumber}_${diwoAssignment.id}`;

			// let sessionName = diwoAssignment.id + '-' + (workbook.ModuleIndex + 1) + ' ' + workbook.ModuleName;
			let generatedlinkpath = shortid.generate();
			let code = generatedlinkpath.toLowerCase();
			let link = `${CONFIG.diwo_host}?workbook_code=${code}`;
			workbook.WBData = WBData;

			if (workbook.DiwoModuleId !== 1) {
				let sessionPayload = {
					title: sessionName,
					location: null,
					dateWithTime: workbook.ModuleStartDate,
					link: link,
					WorkbookId: workbook.WorkbookId,
					status: 'Planned', //Live
					isDeleted: false,
					UserId: workbook.TrainerId,
					CreatedBy: diwoAssignment.UserId,
					ClientId: diwoAssignment.ClientId,
					RoleId: diwoAssignment.RoleId,
					workbookData: JSON.stringify(WBData),
					step: 6,
					SessionStartDate: diwoAssignment.StartDate,
					SessionEndDate: diwoAssignment.EndDate,
					language: 'English',
					code: code,
					enddateWithTime: workbook.ModuleEndDate,
					DiwoAssignmentId: diwoAssignment.id,
					DiwoModuleId: workbook.DiwoModuleId,
					DiwoModuleAssignId: workbook.id,
					isAssignmentCertification: workbook.isAssignmentCertification,
				};
				[err, create_session] = await to(Session.create(sessionPayload));
				if (err) {
					console.log('-Error While CReate Session on Asignment-', err);
				}
				workbook.SessionId = create_session.id;
				workbook.isAssignmentCertification = create_session.isAssignmentCertification;
			} else {
				workbook.SessionId = null;
			}
		}

		for (let learner of LearnerUserIds) {
			let CourseStatusId = null;
			let PathwayStatusId = null;
			let courseId = null;
			let currentDate = moment();
			let futureDate = moment(currentDate).add(1, 'y');
			let expiryDate_ = futureDate;

			//Check PathwayStatusId
			[err, checkPathwayStatusId] = await to(
				SessionUser.findOne({
					where: {
						UserId: learner,
						DiwoAssignmentId: diwoAssignment.id,
					},
					attributes: ['id', 'UserId', 'DiwoAssignmentId', 'PathwayStatusId'],
				})
			);
			if (err) {
				console.log('-----checkPathwayStatusId---Error--', err);
			}

			if (checkPathwayStatusId?.PathwayStatusId) {
				PathwayStatusId = checkPathwayStatusId.PathwayStatusId;
			}

			for (let workbook of ConvertedDiwoModuleData) {
				if (workbook.isNotApplicable) {
					console.log('--SKIP Create SessionUser Record--');
					continue;
				}
				if (PathwayStatusId == null && workbook?.DiwoAssignment?.PathwayId) {
					//Create Pathway  Status Record
					[err, createPathwayStatus] = await to(PathwayStatus.create({ status: 'Not Started' }));
					if (err) {
						console.log('-----createPathwayStatus---Error--', err);
					}
					PathwayStatusId = createPathwayStatus?.id ? createPathwayStatus?.id : null;
				}

				if (workbook?.CourseId || workbook.DiwoAssignment?.PathwayId) {
					//Check Prea

					//Create Course  Status Record
					if (CourseStatusId == null) {
						//Get All Module DiwoModuleAssigmnet id present in the same Course
						let diwoModuleAssigmentIds = [];
						for (let data of ConvertedDiwoModuleData) {
							if (data.CourseIndex == workbook.CourseIndex) {
								diwoModuleAssigmentIds.push(data.id);
							}
						}
						if (diwoModuleAssigmentIds?.length > 0) {
							[err, checkCourseStatusId] = await to(
								SessionUser.findOne({
									where: {
										UserId: learner,
										DiwoAssignmentId: diwoAssignment.id,
										DiwoModuleAssignId: diwoModuleAssigmentIds,
									},
									attributes: ['id', 'UserId', 'DiwoAssignmentId', 'CourseStatusId'],
								})
							);
							if (err) {
								console.log('-----checkCourseStatusId---Error--', err);
							}

							if (checkCourseStatusId?.CourseStatusId) {
								CourseStatusId = checkCourseStatusId.CourseStatusId;
								courseId = workbook.CourseId;
							}
						}
					}

					if (courseId == null || courseId != workbook?.CourseId) {
						[err, createCourseStatus] = await to(CourseStatus.create({ status: 'Not Started' }));
						if (err) {
							console.log('-----createPathwayStatus---Error--', err);
						}
						CourseStatusId = createCourseStatus?.id ? createCourseStatus?.id : null;
						courseId = workbook.CourseId;
					}
				}

				let payload = {
					WorkbookId: workbook.WorkbookId,
					UserId: learner,
					status: workbook.DiwoModuleId !== 1 ? 'Approved' : 'Pre Assign',
					attendanceStatus: workbook.DiwoModuleId !== 1 ? 'Present' : null,
					title: workbook.ModuleName,
					descrip: null,
					ClientId: diwoAssignment.ClientId,
					forTrainer: false,
					isPreAssigned: workbook.DiwoModuleId !== 1 ? false : true,
					newRegister: false,
					SessionId: workbook?.SessionId ? workbook.SessionId : null,
					expiryDate: expiryDate_,
					DiwoModuleAssignId: workbook.id,

					isAppliedBadge: workbook.WBData.isAppliedBadge,
					isAppliedCertificate: workbook.WBData.isAppliedCertificate,
					haveCertificate: workbook.WBData.haveCertificate,
					BadgeId: workbook.WBData.BadgeId,
					// CertificateId: workbook.WBData.CertificateId,
					CertificateLine1: workbook.WBData.CertificateLine1,
					CertificateLine2: workbook.WBData.CertificateLine2,
					CertificateLine3: workbook.WBData.CertificateLine3,

					isAddSignature: workbook.WBData.isAddSignature,

					signatureName1: workbook.WBData.signatureName1,
					signatureDesignation1: workbook.WBData.signatureDesignation1,
					signaturePath1: workbook.WBData.signaturePath1,
					signaturePathName1: workbook.WBData.signaturePathName1,

					signatureName2: workbook.WBData.signatureName2,
					signatureDesignation2: workbook.WBData.signatureDesignation2,
					signaturePath2: workbook.WBData.signaturePath2,
					signaturePathName2: workbook.WBData.signaturePathName2,

					certificateData: workbook.WBData.certificateData,
					condition: workbook.WBData.condition,
					CourseStatusId: CourseStatusId,
					PathwayStatusId: PathwayStatusId,
					ModuleStatus: 'Not Started',
					ModuleIndex: workbook.ModuleIndex,
					ModuleDepedencyIndex: workbook.ModuleDepedencyIndex,
					ModuleOperation: workbook.ModuleOperation,
					isAccess: true,
					isAllowedPDF: workbook.WBData.isAllowedPDF,
					DiwoAssignmentId: diwoAssignment.id,
					isPublish: false,
				};

				if (
					(workbook.ModuleDepedencyIndex !== null && workbook.ModuleDepedencyIndex != 'No Dependency') ||
					workbook.isAssignmentCertification
				) {
					payload.isAccess = false;
				}

				let sessionUserData;
				[err, sessionUserData] = await to(SessionUser.create(payload));
				if (err) {
					console.log('-Error While CReate SessionUser on Asignment-', err);
				}

				sessionUserData = sessionUserData.convertToJSON();
				let index = 0;

				[err, workBookAssets] = await to(
					DiwoAsset.findAll({
						where: {
							WorkbookId: sessionUserData.WorkbookId,
							WorksheetId: {
								[Op.eq]: null,
							},
							QuestionId: {
								[Op.eq]: null,
							},
						},
					})
				);

				if (workBookAssets && workBookAssets.length > 0) {
					let sessionWorkBookAsset = [];

					for (let workBookAsset of workBookAssets) {
						sessionWorkBookAsset.push({
							ClientId: diwoAssignment.ClientId,
							SessionUserId: sessionUserData.id,
							path: workBookAsset.path,
							fileName: workBookAsset.fileName,
							type: workBookAsset.type,
							forBrief: workBookAsset.forBrief,
							isTranscoding: workBookAsset.isTranscoding,
							vmoVideoId: workBookAsset.vmoVideoId ? workBookAsset.vmoVideoId : null,
							cmsVideoId: workBookAsset.cmsVideoId ? workBookAsset.cmsVideoId : null,
							MediaCMSUploadQueueId: workBookAsset.MediaCMSUploadQueueId ? workBookAsset.MediaCMSUploadQueueId : null,
						});
					}

					[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
					if (err) return ResponseError(res, err, 500, true);
				}

				// if (workbook.DiwoModuleId == 1) {
				// 	continue;
				// }
				// for (let worksheet of workbook.WBData.Worksheets) {
				// 	let worksheetPayload = {
				// 		SessionUserId: sessionUserData.id,
				// 		SessionId: workbook?.SessionId ? workbook.SessionId : null,
				// 		description: worksheet.description,
				// 		chart: worksheet.chart,
				// 		trainerInst: worksheet.trainerInst,
				// 		flgFav: worksheet.flgFav,
				// 		flgBookmark: worksheet.flgBookmark,
				// 		flgImp: worksheet.flgImp,
				// 		flgGroupActivty: worksheet.flgGroupActivty,
				// 		type: worksheet.type,
				// 		ClientId: null,
				// 		isGraded: worksheet.isGraded,
				// 		brief: worksheet.brief,
				// 		publishResult: worksheet.publishResult,
				// 		sessionFeedback: worksheet.sessionFeedback,
				// 		sessionFeedBackMinCount: worksheet.sessionFeedBackMinCount,
				// 		sessionFeedBackMaxCount: worksheet.sessionFeedBackMaxCount,
				// 		anonymous: worksheet.anonymous,
				// 		trainerSurvey: worksheet.trainerSurvey,
				// 		trainerSurveyComp: worksheet.trainerSurveyComp,
				// 		activityTemplate: worksheet.activityTemplate,
				// 		noOfTimeSpinWheel: worksheet.noOfTimeSpinWheel,
				// 		index: index,
				// 		keepSurveyOn: worksheet.keepSurveyOn,
				// 		keepSurveyOnDays: worksheet.keepSurveyOnDays,
				// 		mediaWorkSheet: worksheet.mediaWorkSheet,
				// 		mediaProfilesData: worksheet.mediaProfilesData,

				// 		isAssessment: worksheet.isAssessment,
				// 		certificateData: worksheet.certificateData,
				// 		worksheetStatus: 'Not Started',

				// 		WorksheetId: worksheet.id,
				// 		videoComplition: worksheet.videoComplition,

				// 		isShowScore: worksheet.isShowScore,
				// 		timeToShowOption: worksheet.timeToShowOption,
				// 	};

				// 	[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
				// 	if (err) {
				// 		console.log('-Error While CReate SessionWorksheet on Asignment-', err);
				// 	}
				// 	index++;

				// 	if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
				// 		let assetList = [];
				// 		for (let asset of worksheet.DiwoAssets) {
				// 			let payload = {
				// 				ClientId: diwoAssignment.ClientId,
				// 				SessionWorksheetId: createSessionWorksheet.id,
				// 				path: asset.path,
				// 				fileName: asset.fileName,
				// 				type: asset.type,
				// 				forBrief: asset.forBrief,
				// 			};
				// 			assetList.push(payload);
				// 		}
				// 		[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
				// 		if (err) {
				// 			console.log('-Error While CReate SessionAsset on Asignment-', err);
				// 		}
				// 	}

				// 	if (worksheet.type == 'Quiz (Randomised)') {
				// 		const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
				// 		randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
				// 	} else {
				// 		randomData = worksheet.Questions;
				// 	}

				// 	for (let question of randomData) {
				// 		let createSessionQuestion;
				// 		let questionPayload = {
				// 			question: question.question,
				// 			questionType: question.questionType,
				// 			answerCount: question.answerCount,
				// 			SessionWorksheetId: createSessionWorksheet.id,
				// 			ClientId: null,
				// 			allowFileTypes: question.allowFileTypes,
				// 			fileSize: question.fileSize,
				// 			numberOfFiles: question.numberOfFiles,
				// 			isTextResponse: question.isTextResponse,
				// 			isFileSubmission: question.isFileSubmission,
				// 			multipleOption: question.multipleOption,
				// 			surveyCharLimit: question.surveyCharLimit,
				// 			queGroupIndex: question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null,
				// 			queGroupName: question?.SurveyQueGroup?.group_name ? question.SurveyQueGroup.group_name : null,
				// 			spinCatIndex: question?.DiwoSpinWheelCat?.category_index
				// 				? question.DiwoSpinWheelCat.category_index
				// 				: null,
				// 			spinCatName: question?.DiwoSpinWheelCat?.category_name ? question.DiwoSpinWheelCat.category_name : null,
				// 			spinQueScore: question?.spinQueScore ? question.spinQueScore : null,
				// 			QuestionId: question.id,
				// 		};

				// 		[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
				// 		if (err) {
				// 			console.log('-Error While CReate SessionQuestion on Asignment-', err);
				// 		}

				// 		if (question.DiwoAssets && question.DiwoAssets.length > 0) {
				// 			let assetList2 = [];
				// 			for (let asset of question.DiwoAssets) {
				// 				let payload = {
				// 					path: asset.path,
				// 					fileName: asset.fileName,
				// 					type: asset.type,
				// 					SessionQuestionId: createSessionQuestion.id,
				// 					forBrief: asset.forBrief,
				// 				};
				// 				assetList2.push(payload);

				// 				if (assetList2.length == 50) {
				// 					[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
				// 					if (err) {
				// 						console.log('-Error While CReate SessionAsset Question on Asignment-1', err);
				// 					}
				// 					assetList2 = [];
				// 				}
				// 			}
				// 			if (assetList2.length > 0) {
				// 				[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
				// 				if (err) {
				// 					console.log('-Error While CReate SessionAsset Question on Asignment-2', err);
				// 				}
				// 			}
				// 		}

				// 		let optionPayload = [];
				// 		for (let option of question.Options) {
				// 			let payload = {
				// 				text: option.text,
				// 				correctAns: option.isCorrectAnswer,
				// 				assetPath: option.assetPath,
				// 				assetName: option.assetName,
				// 				assetType: option.assetType,
				// 				userAnswer: option.userAnswer,
				// 				selectedAns: option.userSelectedAns,
				// 				sr_no: option.sr_no,
				// 				SessionQuestionId: createSessionQuestion.id,
				// 				OptionId: option.id,
				// 				SessionWorksheetId: createSessionWorksheet.id,
				// 			};
				// 			optionPayload.push(payload);

				// 			if (optionPayload.length == 50) {
				// 				[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
				// 				if (err) {
				// 					console.log('-Error While CReate SessionOption on Asignment-1', err);
				// 				}

				// 				optionPayload = [];
				// 			}
				// 		}
				// 		if (optionPayload.length > 0) {
				// 			[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
				// 			if (err) {
				// 				console.log('-Error While CReate SessionOption on Asignment-2', err);
				// 			}
				// 		}
				// 	}
				// }
				// }

				if (workbook?.TrainerId != null && workbook?.TrainerId != '' && workbook?.TrainerId != undefined) {
					[err, deleteTrainer] = await to(
						WorkbookTrainerMapping.destroy({
							where: {
								WorkbookId: workbook.WorkbookId,
							},
						})
					);

					if (err) {
						console.log('-Error While destroy VBT,WBT and Work Task WorkbookTrainerMapping on Asignment-', err);
					}

					let payload = {
						WorkbookId: workbook.WorkbookId,
						UserId: workbook.TrainerId,
					};

					[err, addUserGroup] = await to(WorkbookTrainerMapping.create(payload));

					if (err) {
						console.log('-Error While Create VBT,WBT and Work Task WorkbookTrainerMapping on Asignment-', err);
					}
				}
			}
		}
		// 		console.log('---4--');

		return;
		// 		////////////////////////////////////Old Code////////////////////////////////////////
		// 		////////////////////////////////////Old Code////////////////////////////////////////
		// 		////////////////////////////////////Old Code////////////////////////////////////////

		// 		// let DiwoModuleData;
		// 		// [err, DiwoModuleData] = await to(
		// 		// 	DiwoModuleAssign.findAll({
		// 		// 		where: {
		// 		// 			DiwoAssignmentId: diwoAssignment.id,
		// 		// 		},
		// 		// 		order: [['ModuleIndex', 'ASC']],
		// 		// 		include: [{ model: DiwoAssignment, attributes: ['id', 'PathwayId', 'CourseId', 'WorkbookId'] }],
		// 		// 	})
		// 		// );
		// 		// if (err) {
		// 		// 	console.log('--------error while fetch Diwo Module Assign ---------', err);
		// 		// }

		// 		// if (DiwoModuleData?.length == 0) {
		// 		// 	return;
		// 		// }

		// 		// for (let workbook_ of DiwoModuleData) {
		// 		// 	let workbook = workbook_.convertToJSON();
		// 		// 	let WBData;
		// 		// 	let sessionUserEntry;
		// 		// 	let diwoAssets;

		// 		// 	//create only for VBT,WBT,Assignment
		// 		// 	if (workbook.DiwoModuleId !== 1) {
		// 		// 		[err, workbookDetails] = await to(
		// 		// 			Workbook.findOne({
		// 		// 				where: {
		// 		// 					id: workbook.WorkbookId,
		// 		// 				},
		// 		// 				include: [
		// 		// 					{
		// 		// 						model: Worksheet,
		// 		// 						include: [
		// 		// 							{
		// 		// 								model: DiwoAsset,
		// 		// 							},
		// 		// 						],
		// 		// 					},
		// 		// 				],
		// 		// 				order: [
		// 		// 					[
		// 		// 						{
		// 		// 							model: Worksheet,
		// 		// 						},
		// 		// 						'id',
		// 		// 						'ASC',
		// 		// 					],
		// 		// 				],
		// 		// 			})
		// 		// 		);

		// 		// 		if (err) {
		// 		// 			console.log('--------error while fetch Workbook for assignment---------', err);
		// 		// 		}

		// 		// 		if (workbookDetails) {
		// 		// 			workbookDetail_ = workbookDetails.convertToJSON();
		// 		// 			for (let worksheet_ of workbookDetail_.Worksheets) {
		// 		// 				[err, question] = await to(
		// 		// 					Question.findAll({
		// 		// 						where: {
		// 		// 							WorksheetId: worksheet_.id,
		// 		// 						},
		// 		// 						include: [
		// 		// 							{
		// 		// 								model: DiwoAsset,
		// 		// 							},
		// 		// 							{
		// 		// 								model: Option,
		// 		// 							},
		// 		// 							{
		// 		// 								model: SurveyQueGroup,
		// 		// 							},
		// 		// 							{
		// 		// 								model: DiwoSpinWheelCat,
		// 		// 							},
		// 		// 						],
		// 		// 						order: [
		// 		// 							['id', 'ASC'],
		// 		// 							[
		// 		// 								{
		// 		// 									model: Option,
		// 		// 								},
		// 		// 								'id',
		// 		// 								'ASC',
		// 		// 							],
		// 		// 						],
		// 		// 					})
		// 		// 				);
		// 		// 				if (err) {
		// 		// 					console.log('--------error while fetch Question for assignment---------', err);
		// 		// 				}
		// 		// 				worksheet_.Questions = question;
		// 		// 			}

		// 		// 			// Workbook Assets
		// 		// 			[err, diwoAsset] = await to(
		// 		// 				DiwoAsset.findAll({
		// 		// 					where: {
		// 		// 						WorksheetId: null,
		// 		// 						QuestionId: null,
		// 		// 						WorkbookId: workbook.WorkbookId,
		// 		// 					},
		// 		// 				})
		// 		// 			);

		// 		// 			if (err) {
		// 		// 				console.log('--------error while fetch DiwoAsset for assignment---------', err);
		// 		// 			}

		// 		// 			if (diwoAsset && diwoAsset.length > 0) {
		// 		// 				workbookDetail_.DiwoAssets = diwoAsset;
		// 		// 			} else {
		// 		// 				workbookDetail_.DiwoAssets = [];
		// 		// 			}
		// 		// 			WBData = workbookDetail_;
		// 		// 		}

		// 		// 		const rNumber = await randomString(6, '0123456789');
		// 		// 		let sessionName = `${workbook.ModuleName}_${rNumber}_${diwoAssignment.id}`;

		// 		// 		// let sessionName = diwoAssignment.id + '-' + (workbook.ModuleIndex + 1) + ' ' + workbook.ModuleName;
		// 		// 		let generatedlinkpath = shortid.generate();
		// 		// 		let code = generatedlinkpath.toLowerCase();
		// 		// 		let link = `${CONFIG.diwo_host}?workbook_code=${code}`;

		// 		// 		let sessionPayload = {
		// 		// 			title: sessionName,
		// 		// 			location: null,
		// 		// 			dateWithTime: workbook.ModuleStartDate,
		// 		// 			link: link,
		// 		// 			WorkbookId: workbook.WorkbookId,
		// 		// 			status: 'Planned', //Live
		// 		// 			isDeleted: false,
		// 		// 			UserId: diwoAssignment.UserId,
		// 		// 			ClientId: diwoAssignment.ClientId,
		// 		// 			RoleId: diwoAssignment.RoleId,
		// 		// 			workbookData: JSON.stringify(WBData),
		// 		// 			step: 6,
		// 		// 			SessionStartDate: diwoAssignment.StartDate,
		// 		// 			SessionEndDate: diwoAssignment.EndDate,
		// 		// 			language: 'English',
		// 		// 			code: code,
		// 		// 			enddateWithTime: workbook.ModuleEndDate,
		// 		// 			DiwoAssignmentId: diwoAssignment.id,
		// 		// 			DiwoModuleId: workbook.DiwoModuleId,
		// 		// 			DiwoModuleAssignId: workbook.id,

		// 		// 			isAssignmentCertification: workbook.isAssignmentCertification,
		// 		// 		};

		// 		// 		[err, create_session] = await to(Session.create(sessionPayload));
		// 		// 		if (err) {
		// 		// 			console.log('-Error While CReate Session on Asignment-', err);
		// 		// 		}

		// 		// 		let currentDate = moment();
		// 		// 		let futureDate = moment(currentDate).add(1, 'y');
		// 		// 		let expiryDate_ = futureDate;

		// 		// 		let list = [];
		// 		// 		for (let learner of LearnerUserIds) {
		// 		// 			let CourseStatusId = null;
		// 		// 			let PathwayStatusId = null;

		// 		// 			if (workbook?.DiwoAssignment?.PathwayId) {
		// 		// 				//Create Pathway  Status Record

		// 		// 				[err, createPathwayStatus] = await to(PathwayStatus.create({ status: 'Not Started' }));
		// 		// 				if (err) {
		// 		// 					console.log('-----createPathwayStatus---Error--', err);
		// 		// 				}
		// 		// 				PathwayStatusId = createPathwayStatus?.id ? createPathwayStatus?.id : null;
		// 		// 			}
		// 		// 			if (workbook?.DiwoAssignment?.CourseId || workbook?.DiwoAssignment?.PathwayId) {
		// 		// 				//Create Course  Status Record

		// 		// 				[err, createCourseStatus] = await to(CourseStatus.create({ status: 'Not Started' }));
		// 		// 				if (err) {
		// 		// 					console.log('-----createPathwayStatus---Error--', err);
		// 		// 				}
		// 		// 				CourseStatusId = createCourseStatus?.id ? createCourseStatus?.id : null;
		// 		// 			}

		// 		// 			let payload = {
		// 		// 				WorkbookId: workbook.WorkbookId,
		// 		// 				UserId: learner,
		// 		// 				status: 'Approved',
		// 		// 				attendanceStatus: 'Present',
		// 		// 				title: workbook.ModuleName,
		// 		// 				descrip: null,
		// 		// 				ClientId: diwoAssignment.ClientId,
		// 		// 				forTrainer: false,
		// 		// 				isPreAssigned: false,
		// 		// 				newRegister: false,
		// 		// 				SessionId: create_session.id,
		// 		// 				expiryDate: expiryDate_,
		// 		// 				DiwoModuleAssignId: workbook.id,

		// 		// 				isAppliedBadge: WBData.isAppliedBadge,
		// 		// 				isAppliedCertificate: WBData.isAppliedCertificate,
		// 		// 				haveCertificate: WBData.haveCertificate,
		// 		// 				BadgeId: WBData.BadgeId,
		// 		// 				// CertificateId: WBData.CertificateId,
		// 		// 				CertificateLine1: WBData.CertificateLine1,
		// 		// 				CertificateLine2: WBData.CertificateLine2,
		// 		// 				CertificateLine3: WBData.CertificateLine3,
		// 		// 				certificateData: WBData.certificateData,
		// 		// 				condition: WBData.condition,
		// 		// 				CourseStatusId: CourseStatusId,
		// 		// 				PathwayStatusId: PathwayStatusId,
		// 		// 				ModuleStatus: 'Not Started',
		// 		// 			};

		// 		// 			list.push(payload);
		// 		// 		}

		// 		// 		[err, sessionUserEntry] = await to(
		// 		// 			SessionUser.bulkCreate(list, {
		// 		// 				returning: true,
		// 		// 			})
		// 		// 		);
		// 		// 		if (err) {
		// 		// 			console.log('-Error While CReate SessionUser on Asignment-', err);
		// 		// 		}

		// 		// 		if (workbook.TrainerId != null && workbook.TrainerId != '' && workbook.TrainerId != undefined) {
		// 		// 			[err, deleteTrainer] = await to(
		// 		// 				WorkbookTrainerMapping.destroy({
		// 		// 					where: {
		// 		// 						WorkbookId: workbook.WorkbookId,
		// 		// 					},
		// 		// 				})
		// 		// 			);

		// 		// 			if (err) {
		// 		// 				console.log('-Error While destroy VBT,WBT and Work Task WorkbookTrainerMapping on Asignment-', err);
		// 		// 			}

		// 		// 			let payload = {
		// 		// 				WorkbookId: workbook.WorkbookId,
		// 		// 				UserId: workbook.TrainerId,
		// 		// 			};

		// 		// 			[err, addUserGroup] = await to(WorkbookTrainerMapping.create(payload));

		// 		// 			if (err) {
		// 		// 				console.log('-Error While Create VBT,WBT and Work Task WorkbookTrainerMapping on Asignment-', err);
		// 		// 			}
		// 		// 		}

		// 		// 		for (let sessionUserData of sessionUserEntry) {
		// 		// 			sessionUserData = sessionUserData.convertToJSON();
		// 		// 			let index = 0;

		// 		// 			[err, workBookAssets] = await to(
		// 		// 				DiwoAsset.findAll({
		// 		// 					where: {
		// 		// 						WorkbookId: sessionUserData.WorkbookId,
		// 		// 						WorksheetId: null,
		// 		// 						QuestionId: null,
		// 		// 					},
		// 		// 				})
		// 		// 			);

		// 		// 			if (workBookAssets && workBookAssets.length > 0) {
		// 		// 				let sessionWorkBookAsset = [];

		// 		// 				for (let workBookAsset of workBookAssets) {
		// 		// 					sessionWorkBookAsset.push({
		// 		// 						ClientId: diwoAssignment.ClientId,
		// 		// 						SessionUserId: sessionUserData.id,
		// 		// 						path: workBookAsset.path,
		// 		// 						fileName: workBookAsset.fileName,
		// 		// 						type: workBookAsset.type,
		// 		// 						forBrief: workBookAsset.forBrief,
		// 		// 					});
		// 		// 				}

		// 		// 				[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
		// 		// 				if (err) return ResponseError(res, err, 500, true);
		// 		// 			}

		// 		// 			for (let worksheet of WBData.Worksheets) {
		// 		// 				let worksheetPayload = {
		// 		// 					SessionUserId: sessionUserData.id,
		// 		// 					SessionId: create_session.id,
		// 		// 					description: worksheet.description,
		// 		// 					chart: worksheet.chart,
		// 		// 					trainerInst: worksheet.trainerInst,
		// 		// 					flgFav: worksheet.flgFav,
		// 		// 					flgBookmark: worksheet.flgBookmark,
		// 		// 					flgImp: worksheet.flgImp,
		// 		// 					flgGroupActivty: worksheet.flgGroupActivty,
		// 		// 					type: worksheet.type,
		// 		// 					ClientId: null,
		// 		// 					isGraded: worksheet.isGraded,
		// 		// 					brief: worksheet.brief,
		// 		// 					publishResult: worksheet.publishResult,
		// 		// 					sessionFeedback: worksheet.sessionFeedback,
		// 		// 					sessionFeedBackMinCount: worksheet.sessionFeedBackMinCount,
		// 		// 					sessionFeedBackMaxCount: worksheet.sessionFeedBackMaxCount,
		// 		// 					anonymous: worksheet.anonymous,
		// 		// 					trainerSurvey: worksheet.trainerSurvey,
		// 		// 					trainerSurveyComp: worksheet.trainerSurveyComp,
		// 		// 					activityTemplate: worksheet.activityTemplate,
		// 		// 					noOfTimeSpinWheel: worksheet.noOfTimeSpinWheel,
		// 		// 					index: index,
		// 		// 					keepSurveyOn: worksheet.keepSurveyOn,
		// 		// 					keepSurveyOnDays: worksheet.keepSurveyOnDays,
		// 		// 					mediaWorkSheet: worksheet.mediaWorkSheet,
		// 		// 					mediaProfilesData: worksheet.mediaProfilesData,

		// 		// 					isAssessment: worksheet.isAssessment,
		// 		// 					certificateData: worksheet.certificateData,
		// 		// 					worksheetStatus: 'Not Started',
		// 		// 				};

		// 		// 				[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
		// 		// 				if (err) {
		// 		// 					console.log('-Error While CReate SessionWorksheet on Asignment-', err);
		// 		// 				}
		// 		// 				index++;

		// 		// 				if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
		// 		// 					let assetList = [];
		// 		// 					for (let asset of worksheet.DiwoAssets) {
		// 		// 						let payload = {
		// 		// 							ClientId: diwoAssignment.ClientId,
		// 		// 							SessionWorksheetId: createSessionWorksheet.id,
		// 		// 							path: asset.path,
		// 		// 							fileName: asset.fileName,
		// 		// 							type: asset.type,
		// 		// 							forBrief: asset.forBrief,
		// 		// 						};
		// 		// 						assetList.push(payload);
		// 		// 					}
		// 		// 					[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
		// 		// 					if (err) {
		// 		// 						console.log('-Error While CReate SessionAsset on Asignment-', err);
		// 		// 					}
		// 		// 				}

		// 		// 				if (worksheet.type == 'Quiz (Randomised)') {
		// 		// 					const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
		// 		// 					randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
		// 		// 				} else {
		// 		// 					randomData = worksheet.Questions;
		// 		// 				}

		// 		// 				for (let question of randomData) {
		// 		// 					let createSessionQuestion;
		// 		// 					let questionPayload = {
		// 		// 						question: question.question,
		// 		// 						questionType: question.questionType,
		// 		// 						answerCount: question.answerCount,
		// 		// 						SessionWorksheetId: createSessionWorksheet.id,
		// 		// 						ClientId: null,
		// 		// 						allowFileTypes: question.allowFileTypes,
		// 		// 						fileSize: question.fileSize,
		// 		// 						numberOfFiles: question.numberOfFiles,
		// 		// 						isTextResponse: question.isTextResponse,
		// 		// 						isFileSubmission: question.isFileSubmission,
		// 		// 						multipleOption: question.multipleOption,
		// 		// 						surveyCharLimit: question.surveyCharLimit,
		// 		// 						queGroupIndex: question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null,
		// 		// 						queGroupName: question?.SurveyQueGroup?.group_name ? question.SurveyQueGroup.group_name : null,
		// 		// 						spinCatIndex: question?.DiwoSpinWheelCat?.category_index
		// 		// 							? question.DiwoSpinWheelCat.category_index
		// 		// 							: null,
		// 		// 						spinCatName: question?.DiwoSpinWheelCat?.category_name ? question.DiwoSpinWheelCat.category_name : null,
		// 		// 						spinQueScore: question?.spinQueScore ? question.spinQueScore : null,
		// 		// 					};

		// 		// 					[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
		// 		// 					if (err) {
		// 		// 						console.log('-Error While CReate SessionQuestion on Asignment-', err);
		// 		// 					}

		// 		// 					if (question.DiwoAssets && question.DiwoAssets.length > 0) {
		// 		// 						let assetList2 = [];
		// 		// 						for (let asset of question.DiwoAssets) {
		// 		// 							let payload = {
		// 		// 								path: asset.path,
		// 		// 								fileName: asset.fileName,
		// 		// 								type: asset.type,
		// 		// 								SessionQuestionId: createSessionQuestion.id,
		// 		// 								forBrief: asset.forBrief,
		// 		// 							};
		// 		// 							assetList2.push(payload);
		// 		// 						}

		// 		// 						[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
		// 		// 						if (err) {
		// 		// 							console.log('-Error While CReate SessionAsset Question on Asignment-', err);
		// 		// 						}
		// 		// 					}

		// 		// 					let optionPayload = [];
		// 		// 					for (let option of question.Options) {
		// 		// 						let payload = {
		// 		// 							text: option.text,
		// 		// 							correctAns: option.isCorrectAnswer,
		// 		// 							assetPath: option.assetPath,
		// 		// 							assetName: option.assetName,
		// 		// 							assetType: option.assetType,
		// 		// 							userAnswer: option.userAnswer,
		// 		// 							selectedAns: option.userSelectedAns,
		// 		// 							sr_no: option.sr_no,
		// 		// 							SessionQuestionId: createSessionQuestion.id,
		// 		// 						};
		// 		// 						optionPayload.push(payload);
		// 		// 					}

		// 		// 					[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
		// 		// 					if (err) {
		// 		// 						console.log('-Error While CReate SessionOption on Asignment-', err);
		// 		// 					}
		// 		// 				}
		// 		// 			}
		// 		// 		}
		// 		// 	} else {
		// 		// 		//PreAssign ONly ILT MODULE

		// 		// 		let currentDate = moment();
		// 		// 		let futureDate = moment(currentDate).add(1, 'y');
		// 		// 		let expiryDate_ = futureDate;

		// 		// 		[err, workbookDetails] = await to(
		// 		// 			Workbook.findOne({
		// 		// 				where: {
		// 		// 					id: workbook.WorkbookId,
		// 		// 				},
		// 		// 				// include: [
		// 		// 				// 	{
		// 		// 				// 		model: Worksheet,
		// 		// 				// 		include: [
		// 		// 				// 			{
		// 		// 				// 				model: DiwoAsset,
		// 		// 				// 			},
		// 		// 				// 		],
		// 		// 				// 	},
		// 		// 				// ],
		// 		// 				// order: [
		// 		// 				// 	[
		// 		// 				// 		{
		// 		// 				// 			model: Worksheet,
		// 		// 				// 		},
		// 		// 				// 		'id',
		// 		// 				// 		'ASC',
		// 		// 				// 	],
		// 		// 				// ],
		// 		// 			})
		// 		// 		);

		// 		// 		if (err) {
		// 		// 			console.log('--------error while fetch Workbook for assignment 2---------', err);
		// 		// 		}

		// 		// 		let list = [];
		// 		// 		for (let learner of LearnerUserIds) {
		// 		// 			let payload = {
		// 		// 				WorkbookId: workbook.WorkbookId,
		// 		// 				UserId: learner,
		// 		// 				status: 'Pre Assign',
		// 		// 				isPreAssigned: true,
		// 		// 				title: workbook.ModuleName,
		// 		// 				descrip: null,
		// 		// 				ClientId: diwoAssignment.ClientId,
		// 		// 				forTrainer: false,
		// 		// 				isPreAssigned: false,
		// 		// 				newRegister: false,
		// 		// 				expiryDate: expiryDate_,
		// 		// 				DiwoModuleAssignId: workbook.id,

		// 		// 				isAppliedBadge: workbookDetails.isAppliedBadge,
		// 		// 				isAppliedCertificate: workbookDetails.isAppliedCertificate,
		// 		// 				haveCertificate: workbookDetails.haveCertificate,
		// 		// 				BadgeId: workbookDetails.BadgeId,
		// 		// 				// CertificateId: workbookDetails.CertificateId,

		// 		// 				CertificateLine1: workbookDetails.CertificateLine1,
		// 		// 				CertificateLine2: workbookDetails.CertificateLine2,
		// 		// 				CertificateLine3: workbookDetails.CertificateLine3,

		// 		// 				certificateData: workbookDetails.certificateData,
		// 		// 				condition: workbookDetails.condition,
		// 		// 			};

		// 		// 			list.push(payload);
		// 		// 		}

		// 		// 		[err, sessionUserEntry] = await to(
		// 		// 			SessionUser.bulkCreate(list, {
		// 		// 				returning: true,
		// 		// 			})
		// 		// 		);
		// 		// 		if (err) {
		// 		// 			console.log('-Error While CReate SessionUser on ILT Asignment-', err);
		// 		// 		}

		// 		// 		[err, diwoAssets] = await to(
		// 		// 			DiwoAsset.findAll({
		// 		// 				where: {
		// 		// 					WorksheetId: null,
		// 		// 					QuestionId: null,
		// 		// 					WorkbookId: workbook.WorkbookId,
		// 		// 				},
		// 		// 			})
		// 		// 		);
		// 		// 		if (err) {
		// 		// 			console.log('-Error While Find diwo assets on ILT Asignment-', err);
		// 		// 		}

		// 		// 		if (diwoAssets && diwoAssets.length > 0) {
		// 		// 			let sessionWorkBookAsset = [];
		// 		// 			for (let workBookAsset of diwoAssets) {
		// 		// 				for (let allowNewLearner of sessionUserEntry) {
		// 		// 					sessionWorkBookAsset.push({
		// 		// 						ClientId: diwoAssignment.ClientId,
		// 		// 						SessionUserId: allowNewLearner.id,
		// 		// 						path: workBookAsset.path,
		// 		// 						fileName: workBookAsset.fileName,
		// 		// 						type: workBookAsset.type,
		// 		// 						forBrief: workBookAsset.forBrief,
		// 		// 					});
		// 		// 				}
		// 		// 			}

		// 		// 			[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
		// 		// 			if (err) {
		// 		// 				console.log('-Error While Create diwo assets on ILT Asignment-', err);
		// 		// 			}
		// 		// 		}
		// 		// 	}
		// 		// }
	} catch (error) {
		console.log('--------error while create session for VBT,WBT,Assignment---------', error);
	}
};

// Run Flow Type "Conversational" Scheduler
let conversational_schedulor = schedule.scheduleJob('30 * * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>> Create Assignment Session schedulor', fireDate);
	// createNewSessionForLearner();
	createUsersAssignmentdata();
});
module.exports.conversational_schedulor = conversational_schedulor;

const createUsersAssignmentdata = async function () {
	try {
		let today = moment(new Date()).add(1, 'hours').format();
		// console.log('------today---', today);
		//Get Correct Data Query

		[err, allDiwoAssignmentData] = await to(
			DiwoAssignment.findAll({
				include: [
					{
						model: DiwoModuleAssign,
						where: {
							ModuleStartDate: {
								[Op.lte]: today,
							},
							isPublish: false,
						},
						required: true,
					},
					{
						model: LearnerAssignment,
						attributes: ['id', 'DiwoAssignmentId', 'UserId'],
					},
				],
				attributes: [
					'id',
					'PathwayId',
					'CourseId',
					'WorkbookId',
					'UserId',
					'RoleId',
					'ClientId',
					'StartDate',
					'EndDate',
				],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);

		for (let diwoAssignment of allDiwoAssignmentData) {
			for (let diwoModuleAssign of diwoAssignment.DiwoModuleAssigns) {
				//Find All SessionUser Data
				[err, sessionUserData] = await to(
					SessionUser.findAll({
						where: {
							isPublish: false,
							DiwoAssignmentId: diwoAssignment.id,
							DiwoModuleAssignId: diwoModuleAssign.id,
						},
					})
				);
				if (err) {
					console.log('-----Get sessionUserData------', err);
				}

				if (sessionUserData.length > 0) {
					//Get Worksheet , Question and Option and Asset data
					[err, allWorksheetData] = await to(
						Worksheet.findAll({
							where: {
								WorkbookId: diwoModuleAssign.WorkbookId,
							},
							include: [
								{
									model: DiwoAsset,
								},
							],
							order: [['id', 'ASC']],
						})
					);
					if (err) {
						console.log('-------allWorksheetData-------', err);
					}
					allWorksheetData = JSON.parse(JSON.stringify(allWorksheetData));
					//find all Question and Options and there Asset
					for (let worksheet_ of allWorksheetData) {
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
						if (err) {
							console.log('--------error while fetch Question for assignment---------', err);
						}
						if (question?.length > 0) {
							worksheet_.Questions = JSON.parse(JSON.stringify(question));
						} else {
							worksheet_.Questions = [];
						}
					}

					for (let sessionUser of sessionUserData) {
						let index = 0;
						for (let worksheet of allWorksheetData) {
							let worksheetPayload = {
								SessionUserId: sessionUser.id,
								SessionId: sessionUser?.SessionId ? sessionUser.SessionId : null,
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
								trainerSurvey: worksheet.trainerSurvey,
								trainerSurveyComp: worksheet.trainerSurveyComp,
								activityTemplate: worksheet.activityTemplate,
								noOfTimeSpinWheel: worksheet.noOfTimeSpinWheel,

								// index: diwoModuleAssign.ModuleIndex,
								index: index,

								keepSurveyOn: worksheet.keepSurveyOn,
								keepSurveyOnDays: worksheet.keepSurveyOnDays,
								mediaWorkSheet: worksheet.mediaWorkSheet,
								mediaProfilesData: worksheet.mediaProfilesData,

								isAssessment: worksheet.isAssessment,
								certificateData: worksheet.certificateData,
								worksheetStatus: 'Not Started',

								WorksheetId: worksheet.id,
								videoComplition: worksheet.videoComplition,

								isShowScore: worksheet.isShowScore,
								timeToShowOption: worksheet.timeToShowOption,

								isQuizCompletion: worksheet.isQuizCompletion,
								maxReAttemptsAllowed: worksheet.maxReAttemptsAllowed,

								isGuideWorksheet: worksheet.isGuideWorksheet,
								GuideId: worksheet.GuideId,
							};

							[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
							if (err) {
								console.log('-Error While CReate SessionWorksheet on Asignment-', err);
							}

							index++;
							//Create Session Worksheet Asset Entry
							if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
								let assetList = [];
								for (let asset of worksheet.DiwoAssets) {
									let payload = {
										ClientId: diwoAssignment.ClientId,
										SessionWorksheetId: createSessionWorksheet.id,
										path: asset.path,
										fileName: asset.fileName,
										type: asset.type,
										forBrief: asset.forBrief,
										isTranscoding: asset.isTranscoding,
										vmoVideoId: asset.vmoVideoId ? asset.vmoVideoId : null,
										cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
										MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
									};
									assetList.push(payload);
								}
								[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
								if (err) {
									console.log('-Error While CReate SessionAsset on Asignment-', err);
								}
							}

							///Create Questions and Options
							if (worksheet.Questions.length == 0) {
								continue;
							}
							let randomData = [];
							if (worksheet.type == 'Quiz (Randomised)') {
								const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
								randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
							} else {
								randomData = worksheet.Questions;
							}

							//Create Question
							for (let question of randomData) {
								let createSessionQuestion;
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
									multipleOption: question.multipleOption,
									surveyCharLimit: question.surveyCharLimit,
									queGroupIndex: question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null,
									queGroupName: question?.SurveyQueGroup?.group_name ? question.SurveyQueGroup.group_name : null,
									spinCatIndex: question?.DiwoSpinWheelCat?.category_index
										? question.DiwoSpinWheelCat.category_index
										: null,
									spinCatName: question?.DiwoSpinWheelCat?.category_name
										? question.DiwoSpinWheelCat.category_name
										: null,
									spinQueScore: question?.spinQueScore ? question.spinQueScore : null,
									QuestionId: question.id,
									uploadOnVimeo: question?.uploadOnVimeo ? question.uploadOnVimeo : false,
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
								if (err) {
									console.log('-Error While CReate SessionQuestion on Asignment-', err);
								}

								if (question.DiwoAssets && question.DiwoAssets.length > 0) {
									let assetList2 = [];
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
										assetList2.push(payload);

										if (assetList2.length == 50) {
											[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
											if (err) {
												console.log('-Error While CReate SessionAsset Question on Asignment-1', err);
											}
											assetList2 = [];
										}
									}
									if (assetList2.length > 0) {
										[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
										if (err) {
											console.log('-Error While CReate SessionAsset Question on Asignment-2', err);
										}
									}
								}

								//create Question's Option
								let optionPayload = [];
								for (let option of question.Options) {
									let payload = {
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
									optionPayload.push(payload);

									if (optionPayload.length == 50) {
										[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
										if (err) {
											console.log('-Error While CReate SessionOption on Asignment-1', err);
										}

										optionPayload = [];
									}
								}

								if (optionPayload.length > 0) {
									[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
									if (err) {
										console.log('-Error While CReate SessionOption on Asignment-2', err);
									}
								}
							}
						}
						//Update isPublish in the SessionUser Table
						[err, updateIsPublish] = await to(
							SessionUser.update(
								{
									isPublish: true,
								},
								{
									where: {
										id: sessionUser.id,
									},
								}
							)
						);
						if (err) {
							console.log('------------updateIsPublish-----------------', err);
						}
					}
				}
				//update isPublish
				[err, updateIsPublish] = await to(
					DiwoModuleAssign.update(
						{
							isPublish: true,
						},
						{
							where: {
								id: diwoModuleAssign.id,
							},
						}
					)
				);
				if (err) {
					console.log('------------updateIsPublish-----------------', err);
				}
			}
		}
	} catch (error) {
		console.log('------createUsersAssignmentdata-----', error);
	}
};

const createNewSessionForLearner = async function () {
	try {
		let today = moment(new Date()).add(1, 'hours').format();
		// console.log('------today---', today);
		//Get Correct Data Query

		[err, allDiwoAssignmentData] = await to(
			DiwoAssignment.findAll({
				include: [
					{
						model: DiwoModuleAssign,
						where: {
							ModuleStartDate: {
								[Op.lte]: today,
							},
							isPublish: false,
						},
						required: true,
					},
					{
						model: LearnerAssignment,
						attributes: ['id', 'DiwoAssignmentId', 'UserId'],
					},
				],
				attributes: [
					'id',
					'PathwayId',
					'CourseId',
					'WorkbookId',
					'UserId',
					'RoleId',
					'ClientId',
					'StartDate',
					'EndDate',
				],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);

		// console.log('------', allDiwoAssignmentData.length);

		if (allDiwoAssignmentData.length > 0) {
			for (let data of allDiwoAssignmentData) {
				// console.log('----data---', data.convertToJSON());
			}
		}

		if (allDiwoAssignmentData?.length > 0) {
			// For Loop for DiwoAssignment
			for (let diwoAssignment of allDiwoAssignmentData) {
				if (diwoAssignment?.DiwoModuleAssigns?.length > 0) {
					let createPathwayStatusId = true;

					if (!diwoAssignment.PathwayId) {
						createPathwayStatusId = false;
					}

					let checkPathawayStatus;
					if (createPathwayStatusId) {
						[err, checkPathawayStatus] = await to(
							SessionUser.findOne({
								where: { DiwoAssignmentId: diwoAssignment.id, PathwayStatusId: { [Op.ne]: null } },
								attributes: ['id', 'DiwoAssignmentId'],
							})
						);
						if (err) {
							console.log('---err-checkPathawayStatus--', err);
						}
					}

					if (checkPathawayStatus) {
						createPathwayStatusId = false;
					}

					//For Loop For DiwoModuleAssign

					for (let diwoModuleAssign of diwoAssignment.DiwoModuleAssigns) {
						let createCourseStatusId = true;
						let commanCourseAssignmentIds = [];

						for (let temp of diwoAssignment.DiwoModuleAssigns) {
							if (temp.CourseIndex == diwoModuleAssign.CourseIndex) {
								commanCourseAssignmentIds.push(temp.id);
							}
						}

						if (!createPathwayStatusId) {
							[err, checkCourseStatus] = await to(
								SessionUser.findOne({
									where: {
										DiwoAssignmentId: diwoAssignment.id,
										CourseStatusId: { [Op.ne]: null },
										DiwoModuleAssignId: commanCourseAssignmentIds,
									},
									attributes: ['id', 'DiwoAssignmentId', 'CourseStatusId', 'DiwoModuleAssignId'],
								})
							);
							if (err) {
								console.log('---err-checkPathawayStatus--', err);
							}

							if (checkCourseStatus) {
								createCourseStatusId = false;
							}
						}

						diwoModuleAssign = diwoModuleAssign.convertToJSON();
						// Get Module (Workbook) All data for Assignment
						[err, workbookData] = await to(
							Workbook.findOne({
								where: {
									id: diwoModuleAssign.WorkbookId,
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
						if (err) {
							console.log('--Err--workbookData-', err);
						}

						if (workbookData) {
							workbookData = workbookData.convertToJSON();
							// Find Question and Other WorkSheet Details details
							for (let worksheet_ of workbookData.Worksheets) {
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
								if (err) {
									console.log('--------error while fetch Question for assignment---------', err);
								}
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
										WorkbookId: workbookData.id,
									},
								})
							);
							if (err) {
								console.log('--------error while fetch DiwoAsset for assignment------2---', err);
							}

							if (diwoAsset && diwoAsset.length > 0) {
								workbookData.DiwoAssets = diwoAsset;
							} else {
								workbookData.DiwoAssets = [];
							}

							// Check Module Type And Create Session
							if (workbookData.DiwoModuleId != 1) {
								// If Module is Not ILT the Create Session
								const rNumber = await randomString(6, '0123456789');
								let sessionName = `${diwoModuleAssign.ModuleName}_${rNumber}_${diwoAssignment.id}`;

								// let sessionName = diwoAssignment.id + '-' + (workbook.ModuleIndex + 1) + ' ' + workbook.ModuleName;
								let generatedlinkpath = shortid.generate();
								let code = generatedlinkpath.toLowerCase();
								let link = `${CONFIG.diwo_host}?workbook_code=${code}`;

								let sessionPayload = {
									title: sessionName,
									location: null,
									dateWithTime: diwoModuleAssign.ModuleStartDate,
									link: link,
									WorkbookId: diwoModuleAssign.WorkbookId,
									status: 'Planned', //Live
									isDeleted: false,
									UserId: diwoModuleAssign.TrainerId,
									CreatedBy: diwoAssignment.UserId,
									ClientId: diwoAssignment.ClientId,
									RoleId: diwoAssignment.RoleId,
									workbookData: JSON.stringify(workbookData),
									step: 6,
									SessionStartDate: diwoAssignment.StartDate,
									SessionEndDate: diwoAssignment.EndDate,
									language: 'English',
									code: code,
									enddateWithTime: diwoModuleAssign.ModuleEndDate,
									DiwoAssignmentId: diwoAssignment.id,
									DiwoModuleId: diwoModuleAssign.DiwoModuleId,
									DiwoModuleAssignId: diwoModuleAssign.id,
									isAssignmentCertification: diwoModuleAssign.isAssignmentCertification,
								};

								[err, create_session] = await to(Session.create(sessionPayload));
								if (err) {
									console.log('-Error While CReate Session on Asignment-', err);
								}

								diwoModuleAssign.SessionId = create_session.id;
								diwoModuleAssign.isAssignmentCertification = create_session.isAssignmentCertification;
							} else {
								diwoModuleAssign.SessionId = null;
							}

							if (diwoAssignment?.LearnerAssignments?.length > 0) {
								for (let learner of diwoAssignment.LearnerAssignments) {
									let alreadyPresent;
									//Check Already Present or not and Do What is Needed

									[err, alreadyPresent] = await to(
										SessionUser.findOne({
											where: {
												WorkbookId: workbookData.id,
												UserId: learner.UserId,
												status: 'Pre Assign',
												SessionId: {
													[Op.eq]: null,
												},
											},
											attributes: ['id'],
										})
									);
									if (err) {
										console.log('---alreadyPresent-err--', err);
									}

									if (alreadyPresent) {
										//Update DiwoAssignmentId and DiwoModuleAssignId
										let futureDate = moment(new Date()).add(1, 'y');
										let expiryDate_ = futureDate;
										[err, alreadyPresentUpdate] = await to(
											SessionUser.update(
												{
													DiwoModuleAssignId: diwoModuleAssign.id,
													DiwoAssignmentId: diwoAssignment.id,
													expiryDate: expiryDate_,
												},
												{
													where: {
														id: alreadyPresent.id,
													},
													attributes: ['id'],
												}
											)
										);
										if (err) {
											console.log('---alreadyPresentUpdate-err--', err);
										}
									} else {
										let CourseStatusId = null;
										let PathwayStatusId = null;
										let courseId = null;
										let currentDate = moment();
										let futureDate = moment(currentDate).add(1, 'y');
										let expiryDate_ = futureDate;

										if (createPathwayStatusId) {
											[err, createPathwayStatus] = await to(PathwayStatus.create({ status: 'Not Started' }));
											if (err) {
												console.log('-----createPathwayStatus---Error--', err);
											}
											PathwayStatusId = createPathwayStatus?.id ? createPathwayStatus?.id : null;
										} else if (diwoAssignment?.PathwayId) {
											[err, pathwaytatus] = await to(
												SessionUser.findOne({
													where: {
														UserId: learner.UserId,
														DiwoAssignmentId: diwoAssignment.id,
														PathwayStatusId: {
															[Op.ne]: null,
														},
													},
													attributes: ['id', 'UserId', 'DiwoAssignmentId', 'PathwayStatusId'],
												})
											);
											if (err) {
												console.log('-----courseStatus---Error--', err);
											}

											if (pathwaytatus) {
												PathwayStatusId = pathwaytatus.PathwayStatusId;
											}
										}

										if (createCourseStatusId) {
											[err, createCourseStatus] = await to(CourseStatus.create({ status: 'Not Started' }));
											if (err) {
												console.log('-----createPathwayStatus---Error--', err);
											}
											CourseStatusId = createCourseStatus?.id ? createCourseStatus?.id : null;
											// courseId = workbook.CourseId;
										} else {
											[err, courseStatus] = await to(
												SessionUser.findOne({
													where: {
														UserId: learner.UserId,
														DiwoModuleAssignId: commanCourseAssignmentIds,
														CourseStatusId: {
															[Op.ne]: null,
														},
													},
													attributes: ['id', 'UserId', 'DiwoModuleAssignId', 'CourseStatusId'],
												})
											);
											if (err) {
												console.log('-----courseStatus---Error--', err);
											}

											if (courseStatus) {
												CourseStatusId = courseStatus.CourseStatusId;
											}
										}

										//Wright a code for Course Status

										// Create SessionUser Payload
										let payload = {
											WorkbookId: diwoModuleAssign.WorkbookId,
											UserId: learner.UserId,
											status: diwoModuleAssign.DiwoModuleId !== 1 ? 'Approved' : 'Pre Assign',
											attendanceStatus: diwoModuleAssign.DiwoModuleId !== 1 ? 'Present' : null,
											title: diwoModuleAssign.ModuleName,
											descrip: null,
											ClientId: diwoAssignment.ClientId,
											forTrainer: false,
											isPreAssigned: diwoModuleAssign.DiwoModuleId !== 1 ? false : true,
											newRegister: false,
											SessionId: diwoModuleAssign?.SessionId ? diwoModuleAssign.SessionId : null,
											expiryDate: expiryDate_,
											DiwoModuleAssignId: diwoModuleAssign.id,

											isAppliedBadge: workbookData.isAppliedBadge,
											isAppliedCertificate: workbookData.isAppliedCertificate,
											haveCertificate: workbookData.haveCertificate,
											BadgeId: workbookData.BadgeId,
											// CertificateId: workbookData.CertificateId,
											CertificateLine1: workbookData.CertificateLine1,
											CertificateLine2: workbookData.CertificateLine2,
											CertificateLine3: workbookData.CertificateLine3,
											certificateData: workbookData.certificateData,
											condition: workbookData.condition,
											CourseStatusId: CourseStatusId,
											PathwayStatusId: PathwayStatusId,
											ModuleStatus: 'Not Started',
											ModuleIndex: diwoModuleAssign.ModuleIndex,
											ModuleDepedencyIndex: diwoModuleAssign.ModuleDepedencyIndex,
											ModuleOperation: diwoModuleAssign.ModuleOperation,
											isAccess: true,
											isAllowedPDF: workbookData.isAllowedPDF,
											DiwoAssignmentId: diwoAssignment.id,
										};

										if (
											(diwoModuleAssign.ModuleDepedencyIndex !== null &&
												diwoModuleAssign.ModuleDepedencyIndex != 'No Dependency') ||
											diwoModuleAssign.isAssignmentCertification
										) {
											payload.isAccess = false;
										}

										let sessionUserData;
										[err, sessionUserData] = await to(SessionUser.create(payload));
										if (err) {
											console.log('-Error While CReate SessionUser on Asignment-', err);
										}

										//Create Workbook Asset Entry
										if (workbookData?.DiwoAssets?.length > 0) {
											let sessionWorkBookAsset = [];

											for (let workBookAsset of workbookData.DiwoAssets) {
												sessionWorkBookAsset.push({
													ClientId: diwoAssignment.ClientId,
													SessionUserId: sessionUserData.id,
													path: workBookAsset.path,
													fileName: workBookAsset.fileName,
													type: workBookAsset.type,
													forBrief: workBookAsset.forBrief,
													isTranscoding: workBookAsset.isTranscoding,
													vmoVideoId: workBookAsset.vmoVideoId ? workBookAsset.vmoVideoId : null,
													cmsVideoId: workBookAsset.cmsVideoId ? workBookAsset.cmsVideoId : null,
													MediaCMSUploadQueueId: workBookAsset.MediaCMSUploadQueueId
														? workBookAsset.MediaCMSUploadQueueId
														: null,
												});
											}
											[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
											if (err) return ResponseError(res, err, 500, true);
										}

										//Cretae All WorkSheet Entry
										for (let worksheet of workbookData.Worksheets) {
											let worksheetPayload = {
												SessionUserId: sessionUserData.id,
												SessionId: diwoModuleAssign?.SessionId ? diwoModuleAssign.SessionId : null,
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
												trainerSurvey: worksheet.trainerSurvey,
												trainerSurveyComp: worksheet.trainerSurveyComp,
												activityTemplate: worksheet.activityTemplate,
												noOfTimeSpinWheel: worksheet.noOfTimeSpinWheel,
												index: diwoModuleAssign.ModuleIndex,
												keepSurveyOn: worksheet.keepSurveyOn,
												keepSurveyOnDays: worksheet.keepSurveyOnDays,
												mediaWorkSheet: worksheet.mediaWorkSheet,
												mediaProfilesData: worksheet.mediaProfilesData,

												isAssessment: worksheet.isAssessment,
												certificateData: worksheet.certificateData,
												worksheetStatus: 'Not Started',

												WorksheetId: worksheet.id,
												videoComplition: worksheet.videoComplition,

												isShowScore: worksheet.isShowScore,
												timeToShowOption: worksheet.timeToShowOption,

												isQuizCompletion: worksheet.isQuizCompletion,
												maxReAttemptsAllowed: worksheet.maxReAttemptsAllowed,

												isGuideWorksheet: worksheet.isGuideWorksheet,
												GuideId: worksheet.GuideId,
											};

											[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
											if (err) {
												console.log('-Error While CReate SessionWorksheet on Asignment-', err);
											}

											//Create Session Worksheet Asset Entry
											if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
												let assetList = [];
												for (let asset of worksheet.DiwoAssets) {
													let payload = {
														ClientId: diwoAssignment.ClientId,
														SessionWorksheetId: createSessionWorksheet.id,
														path: asset.path,
														fileName: asset.fileName,
														type: asset.type,
														forBrief: asset.forBrief,
														isTranscoding: asset.isTranscoding,
														vmoVideoId: asset.vmoVideoId ? asset.vmoVideoId : null,
														cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
														MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
													};
													assetList.push(payload);
												}
												[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
												if (err) {
													console.log('-Error While CReate SessionAsset on Asignment-', err);
												}
											}
											let randomData = [];
											if (worksheet.type == 'Quiz (Randomised)') {
												const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
												randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
											} else {
												randomData = worksheet.Questions;
											}

											//Create Question
											for (let question of randomData) {
												let createSessionQuestion;
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
													multipleOption: question.multipleOption,
													surveyCharLimit: question.surveyCharLimit,
													queGroupIndex: question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null,
													queGroupName: question?.SurveyQueGroup?.group_name
														? question.SurveyQueGroup.group_name
														: null,
													spinCatIndex: question?.DiwoSpinWheelCat?.category_index
														? question.DiwoSpinWheelCat.category_index
														: null,
													spinCatName: question?.DiwoSpinWheelCat?.category_name
														? question.DiwoSpinWheelCat.category_name
														: null,
													spinQueScore: question?.spinQueScore ? question.spinQueScore : null,
													QuestionId: question.id,
													uploadOnVimeo: question?.uploadOnVimeo ? question.uploadOnVimeo : false,
												};

												[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
												if (err) {
													console.log('-Error While CReate SessionQuestion on Asignment-', err);
												}

												if (question.DiwoAssets && question.DiwoAssets.length > 0) {
													let assetList2 = [];
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
														assetList2.push(payload);

														if (assetList2.length == 50) {
															[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
															if (err) {
																console.log('-Error While CReate SessionAsset Question on Asignment-1', err);
															}
															assetList2 = [];
														}
													}
													if (assetList2.length > 0) {
														[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
														if (err) {
															console.log('-Error While CReate SessionAsset Question on Asignment-2', err);
														}
													}
												}

												//create Question's Option
												let optionPayload = [];
												for (let option of question.Options) {
													let payload = {
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
													optionPayload.push(payload);

													if (optionPayload.length == 50) {
														[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
														if (err) {
															console.log('-Error While CReate SessionOption on Asignment-1', err);
														}

														optionPayload = [];
													}
												}

												if (optionPayload.length > 0) {
													[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
													if (err) {
														console.log('-Error While CReate SessionOption on Asignment-2', err);
													}
												}
											}
										}
									}
								}
							}
						}

						//Update isPublish in the DiwoModuleAssign
						[err, updateFlag] = await to(
							DiwoModuleAssign.update(
								{ isPublish: true },
								{
									where: {
										id: diwoModuleAssign.id,
									},
								}
							)
						);
						//For Loop Foe LearnerAsssignment
						createPathwayStatusId = false;
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('--------error while create session for VBT,WBT,Assignment---------', error);
	}
};

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

//get  Diwo Assingment By AssingmentID for assignment
const getDiwoAssignmentByAssignmentId = async function (req, res) {
	try {
		let err, assignmentData;
		let assignmentId = parseInt(req.params.assignmentId);

		[err, assignmentData] = await to(
			DiwoAssignment.findAll({
				where: {
					id: assignmentId,
				},
				include: [
					{
						model: DiwoAssignUserGroupMapping,
					},
					{
						model: DiwoModuleAssign,
						include: [
							{
								model: Workbook,
								attributes: ['id', 'BaseWorkbookId', 'default', 'version'],
							},
						],
					},
				],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: {
				assignmentData,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoAssignmentByAssignmentId = getDiwoAssignmentByAssignmentId;

const deleteDiwoAssignment = async function (req, res) {
	try {
		let DiwoAssignmentId = req.body.assignmentId;

		let sessionIds = [];
		let sessionUserIds = [];
		let sessionWorksheetIds = [];
		let sessionAssetIds = [];
		let sessionQuestionIds = [];

		if (DiwoAssignmentId) {
			// let sessionQuery = `SELECT ARRAY (SELECT "id" FROM "Sessions" WHERE "DiwoAssignmentId" IN (${DiwoAssignmentId}));`;
			// [sessionid] = await sequelize.query(sessionQuery);

			let sessionQuery = `
				SELECT ARRAY (
					SELECT "id" FROM "Sessions"
					WHERE "DiwoAssignmentId" IN (:DiwoAssignmentIds)
				);
			`;

			const sessionid = await sequelize.query(sessionQuery, {
				replacements: { DiwoAssignmentIds: Array.isArray(DiwoAssignmentId) ? DiwoAssignmentId : [DiwoAssignmentId] },
				type: sequelize.QueryTypes.SELECT,
			});

			sessionIds = sessionid[0]?.array || [];
		}

		if (sessionIds.length > 0) {
			// let sessionUserQuery = `SELECT ARRAY (SELECT "id" FROM "SessionUsers" WHERE "SessionId" IN (${sessionIds.join(
			// 	','
			// )}) AND "forTrainer" = false);`;
			// [sessionuserid] = await sequelize.query(sessionUserQuery);
			let sessionUserQuery = `
			SELECT ARRAY (
				SELECT "id" FROM "SessionUsers"
				WHERE "SessionId" IN (:sessionIds) AND "forTrainer" = false
			);
			`;

			const sessionuserid = await sequelize.query(sessionUserQuery, {
				replacements: { sessionIds: sessionIds.length ? sessionIds : [null] }, // Prevents SQL error on empty array
				type: sequelize.QueryTypes.SELECT,
			});

			sessionUserIds = sessionuserid[0]?.array || [];
		}

		// if (sessionUserIds.length > 0) {
		// 	let sessionWorksheetQuery = `SELECT ARRAY (SELECT "id" FROM "SessionWorksheets" WHERE "SessionUserId" IN (${sessionUserIds.join(
		// 		','
		// 	)}));`;
		// 	[sessionworksheetid] = await sequelize.query(sessionWorksheetQuery);

		// 	sessionWorksheetIds = sessionworksheetid[0]?.array || [];
		// }

		if (sessionUserIds.length > 0) {
			let sessionWorksheetQuery = `
				SELECT ARRAY (
					SELECT "id" FROM "SessionWorksheets"
					WHERE "SessionUserId" IN (:sessionUserIds)
				);
			`;
			let sessionworksheetid = await sequelize.query(sessionWorksheetQuery, {
				replacements: { sessionUserIds },
				type: sequelize.QueryTypes.SELECT,
			});

			sessionWorksheetIds = sessionworksheetid[0]?.array || [];
		}

		// if (sessionWorksheetIds.length > 0) {
		// 	let sessionAssetQuery = `SELECT ARRAY (SELECT "id" FROM "SessionAssets" WHERE "SessionWorksheetId" IN (${sessionWorksheetIds.join(
		// 		','
		// 	)}));`;
		// 	[sessionassetid] = await sequelize.query(sessionAssetQuery);

		// 	sessionAssetIds = sessionassetid[0]?.array || [];

		// 	let sessionQuestionQuery = `SELECT ARRAY (SELECT "id" FROM "SessionQuestions" WHERE "SessionWorksheetId" IN (${sessionWorksheetIds.join(
		// 		','
		// 	)}));`;
		// 	[sessionquestionid] = await sequelize.query(sessionQuestionQuery);

		// 	sessionQuestionIds = sessionquestionid[0]?.array || [];
		// }

		if (sessionWorksheetIds.length > 0) {
			let sessionAssetQuery = `
				SELECT ARRAY (
					SELECT "id" FROM "SessionAssets"
					WHERE "SessionWorksheetId" IN (:sessionWorksheetIds)
				);
			`;
			let sessionassetid = await sequelize.query(sessionAssetQuery, {
				replacements: { sessionWorksheetIds },
				type: sequelize.QueryTypes.SELECT,
			});

			sessionAssetIds = sessionassetid[0]?.array || [];

			let sessionQuestionQuery = `
				SELECT ARRAY (
					SELECT "id" FROM "SessionQuestions"
					WHERE "SessionWorksheetId" IN (:sessionWorksheetIds)
				);
			`;
			let sessionquestionid = await sequelize.query(sessionQuestionQuery, {
				replacements: { sessionWorksheetIds },
				type: sequelize.QueryTypes.SELECT,
			});

			sessionQuestionIds = sessionquestionid[0]?.array || [];
		}

		// Ensure only non-empty arrays are passed to the destroy calls
		if (sessionQuestionIds.length > 0) {
			[err, deleteSessionOption] = await to(
				SessionOption.destroy({
					where: { SessionQuestionId: sessionQuestionIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, deleteSessionQuestion] = await to(
				SessionQuestion.destroy({
					where: { id: sessionQuestionIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (sessionAssetIds.length > 0) {
			[err, deleteSessionAsset] = await to(
				SessionAsset.destroy({
					where: { id: sessionAssetIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (sessionWorksheetIds.length > 0) {
			[err, deleteSessionWorksheet] = await to(
				SessionWorksheet.destroy({
					where: { id: sessionWorksheetIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (sessionUserIds.length > 0) {
			[err, deleteSessionUser] = await to(
				SessionUser.destroy({
					where: { id: sessionUserIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (sessionIds.length > 0) {
			[err, deleteSession] = await to(
				Session.destroy({
					where: { id: sessionIds },
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, deleteLearnerAssignment] = await to(
			LearnerAssignment.destroy({
				where: { DiwoAssignmentId: DiwoAssignmentId },
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteDiwoModuleAssign] = await to(
			DiwoModuleAssign.destroy({
				where: {
					DiwoAssignmentId: DiwoAssignmentId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteDiwoAssignUserGroupMapping] = await to(
			DiwoAssignUserGroupMapping.destroy({
				where: {
					DiwoAssignmentId: DiwoAssignmentId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteDiwoAssignment_] = await to(
			DiwoAssignment.destroy({
				where: { id: DiwoAssignmentId },
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Assignment`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					assignmentId: DiwoAssignmentId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.ASSIGNMENT_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteDiwoAssignment = deleteDiwoAssignment;

// Run Assignment Status Scheduler every 30min
let check_diwo_assignment_status_schedular = schedule.scheduleJob('*/30 * * * *', async function (fireDate) {
	console.log(
		'---------------------------------------------------------------------------------------------------------------------------'
	);
	console.log('Run Scheduler ---<<<<<<-----Diwo Assignment Check Status Schedulor--->>>>---', fireDate);
	console.log(
		'---------------------------------------------------------------------------------------------------------------------------'
	);

	try {
		await checkAssignmentStatus();
	} catch (error) {
		console.error('---Error during checkAssignment status scheduler execution----:', error);
	}
});
module.exports.check_diwo_assignment_status_schedular = check_diwo_assignment_status_schedular;

const checkAssignmentStatus = async function () {
	try {
		let newStatus;

		[err, assignmetData] = await to(
			DiwoAssignment.findAll({
				where: {
					status: ['Assigned', 'Scheduled'],
				},
				attributes: ['id', 'StartDate', 'EndDate', 'status'],
			})
		);

		if (err) {
			console.log('--get assignmetData status--', err);
		}

		for (let assignment_ of assignmetData) {
			// if (moment().isAfter(assignment_.StartDate) && moment().isBefore(assignment_.EndDate)) {
			// 	newStatus = 'Assigned';
			// } else if (moment().isAfter(assignment_.EndDate)) {
			// 	newStatus = 'Finished';
			// }

			const currentUtcTime = moment.utc();
			const assignmentStart = moment.utc(assignment_.StartDate);
			const assignmentEnd = moment.utc(assignment_.EndDate);

			let newStatus = '';

			if (currentUtcTime.isAfter(assignmentStart) && currentUtcTime.isBefore(assignmentEnd)) {
				newStatus = 'Assigned';
			} else if (currentUtcTime.isAfter(assignmentEnd)) {
				newStatus = 'Finished';
			}

			if (assignment_.status === newStatus || !newStatus) {
				continue;
			}

			[err, updateStatus] = await to(
				DiwoAssignment.update(
					{
						status: newStatus,
					},
					{
						where: {
							id: assignment_.id,
						},
					}
				)
			);

			if (err) {
				console.log('--error while update diwo assignment status--', err);
			}
		}
		return;
	} catch (error) {
		console.log('--checkAssignmentStatus-', error);
		return;
	}
};
module.exports.checkAssignmentStatus = checkAssignmentStatus;

// Run Diwo Assignment Session Start Date Scheduler every 30min
let check_diwo_assignment_session_startdate_schedular = schedule.scheduleJob('*/30 * * * *', async function (fireDate) {
	console.log(
		'---------------------------------------------------------------------------------------------------------------------------'
	);
	console.log('Run Scheduler ---<<<<<<-----Check Diwo Assignmenent Session Start Date Schedulor--->>>>---', fireDate);
	console.log(
		'---------------------------------------------------------------------------------------------------------------------------'
	);

	try {
		await checkDiwoAssignmentSessionStartDate();
	} catch (error) {
		console.error('---Error during checkAssignment session status scheduler execution----:', error);
	}
});
module.exports.check_diwo_assignment_session_startdate_schedular = check_diwo_assignment_session_startdate_schedular;

//check session status
const checkDiwoAssignmentSessionStartDate = async function () {
	try {
		let sessionData;
		let newStatus;

		[err, sessionData] = await to(
			Session.findAll({
				where: {
					status: ['Planned', 'Live'],
					DiwoModuleId: {
						[Op.ne]: 1,
					},
				},
				attributes: ['id', 'dateWithTime', 'enddateWithTime', 'status'],
			})
		);
		if (err) {
			console.log('--get session startDate to start session for assignemnt--', err);
		}

		if (sessionData && sessionData.length > 0) {
			for (let session_ of sessionData) {
				let session = session_.convertToJSON();
				// if (moment().isAfter(session.dateWithTime) && moment().isBefore(session.enddateWithTime)) {
				// 	newStatus = 'Live';
				// } else if (moment().isAfter(session.enddateWithTime)) {
				// 	newStatus = 'Closed';
				// }

				const currentUtcTime = moment.utc();
				const sessionStart = moment.utc(session.dateWithTime);
				const sessionEnd = moment.utc(session.enddateWithTime);

				let newStatus = '';

				if (currentUtcTime.isAfter(sessionStart) && currentUtcTime.isBefore(sessionEnd)) {
					newStatus = 'Live';
				} else if (currentUtcTime.isAfter(sessionEnd)) {
					newStatus = 'Closed';
				}

				if (session.status === newStatus || !newStatus) {
					continue;
				}

				[err, updateStatus] = await to(
					Session.update(
						{
							status: newStatus,
						},
						{
							where: {
								id: session.id,
							},
						}
					)
				);

				if (err || !updateStatus) {
					console.log('--error while update session status for assignment--', err);
					continue;
				} else {
					console.log('--session status updated successfully for assignment--', session.id);
				}

				[err, updateSessionStatus] = await to(
					SessionUser.update(
						{
							SessionStatus: newStatus,
						},
						{
							where: {
								SessionId: session.id,
							},
						}
					)
				);
				if (err) {
					console.log('--error while update session user sesesionstatus for assignment--', err);
				}
			}
		}
		return;
	} catch (error) {
		console.log('---get session startDate to start session for assignemnt-', error);
		return;
	}
};
module.exports.checkDiwoAssignmentSessionStartDate = checkDiwoAssignmentSessionStartDate;

const updatePathwayAssignment = async function (req, res) {
	try {
		let schema = Joi.object({
			DiwoAssignmentId: Joi.number().integer().positive().required(),
			PathwayId: Joi.number().integer().positive().required(),
		});

		const data = {
			DiwoAssignmentId: req.body.DiwoAssignmentId,
			PathwayId: req.body.PathwayId,
		};

		const { error, value } = schema.validate(data);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		let { DiwoAssignmentId, PathwayId } = value;

		let err, pathwayAssignmentData, pathwayData;
		let finalList = [];
		let DiwoModuleAssigns = [];
		[err, pathwayAssignmentData] = await to(
			DiwoAssignment.findOne({
				where: { id: DiwoAssignmentId },
				include: [
					{
						model: DiwoModuleAssign,
						required: true,
						include: [{ model: Workbook, attributes: ['id', 'default', 'version', 'BaseWorkbookId'] }],
					},
				],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);
		if (err) {
			console.log('---error while get pathway assignment data--', err);
			return ResponseError(res, err, 500, true);
		}

		if (!pathwayAssignmentData) {
			return ResponseError(res, MESSAGE.ASSIGNMENT_NOT_FOUND, 404, true);
		} else {
			for (let data of pathwayAssignmentData.DiwoModuleAssigns) {
				DiwoModuleAssigns.push(data.convertToJSON());
			}
			finalList = JSON.parse(JSON.stringify(DiwoModuleAssigns));
		}

		[err, pathwayData] = await to(
			PathwayCourseMapping.findAll({
				where: { PathwayId: PathwayId },
				include: [{ model: Workbook, attributes: ['id', 'default', 'version', 'BaseWorkbookId'] }],
				order: [['ModuleIndex', 'ASC']],
			})
		);

		if (err) {
			console.log('---error while get pathway data--', err);
			return ResponseError(res, err, 500, true);
		}

		if (pathwayData.length == 0) {
			return ResponseError(res, MESSAGE.PATHWAY_NOT_FOUND, 404, true);
		} else {
			pathwayData = JSON.parse(JSON.stringify(pathwayData));
		}

		finalList = await addDependencyDataInTheObject(finalList);
		pathwayData = await addDependencyDataInTheObject(pathwayData);

		// return;

		let finalListCertificate = finalList.find((data) => data.isAssignmentCertification == true);
		let pathwayCertificate = pathwayData.find((data) => data.isCertificationModule == true);

		//remove Certificate From FinalList and PathwayData
		finalList = finalList.filter((data) => data.isAssignmentCertification == false);
		pathwayData = pathwayData.filter((data) => data.isCertificationModule == false);

		//Update Dependency Index in the finalList if Module is not present
		for (let module of finalList) {
			let indexId = pathwayData.findIndex(
				(data) => data.CourseId == module.CourseId && data.WorkbookId == module.WorkbookId
			);
			if (indexId > -1) {
				module.ModuleDepedencyIndex = pathwayData[indexId].ModuleDepedencyIndex;
				module.dependencyDetails = pathwayData[indexId].dependencyDetails;
			}
		}

		({ finalList, pathwayData } = await checkModuleVersion(finalList, pathwayData));
		// console.log('---finalList--checkModuleVersion-', finalList);
		// console.log('---pathwayData--checkModuleVersion-', pathwayData);
		({ finalList, pathwayData } = await checkNewCourseIsAddedOrNot(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--checkNewCourseIsAddedOrNot-', finalList);
		// console.log('---pathwayData--checkNewCourseIsAddedOrNot-', pathwayData);
		({ finalList, pathwayData } = await checkNewModuleIsAddedOrNot(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--checkNewModuleIsAddedOrNot-', finalList);
		// console.log('---pathwayData--checkNewModuleIsAddedOrNot-', pathwayData);
		({ finalList, pathwayData } = await checkDeleteAnyCourseIsAddedOrNot(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--checkDeleteAnyCourseIsAddedOrNot-', finalList);
		// console.log('---pathwayData--checkDeleteAnyCourseIsAddedOrNot-', pathwayData);
		({ finalList, pathwayData } = await checkDeleteAnyModuleIsAddedOrNot(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--checkDeleteAnyModuleIsAddedOrNot-', finalList);
		({ finalList, pathwayData } = await CheckCourseSequencyChages(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--CheckCourseSequencyChages-', finalList);
		({ finalList, pathwayData } = await CheckModuleSequencyInCourseChages(finalList, pathwayData, DiwoAssignmentId));
		// console.log('---finalList--CheckModuleSequencyInCourseChages-', finalList);
		({ finalList, pathwayData } = await CheckCertification(
			finalList,
			pathwayData,
			finalListCertificate,
			pathwayCertificate
		));
		// console.log('---finalList--CheckCertification-', finalList);
		finalList = await updateDependencyIndexAsPerNewObject(finalList);
		// console.log('---finalList--222-', finalList);
		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		console.log('---error while update pathway assignment--', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updatePathwayAssignment = updatePathwayAssignment;

const checkModuleVersion = async function (finalList, pathwayData) {
	try {
		//Normal Version Update
		let index = 0;
		for (index = 0; index < finalList.length; index++) {
			if (
				finalList[index].isPublish == false &&
				pathwayData[index] &&
				finalList[index].CourseId == pathwayData[index].CourseId &&
				finalList[index].ModuleIndex == pathwayData[index].ModuleIndex &&
				finalList[index].CourseIndex == pathwayData[index].CourseIndex &&
				finalList[index].WorkbookId != pathwayData[index].WorkbookId &&
				finalList[index].Workbook.BaseWorkbookId == pathwayData[index].Workbook.BaseWorkbookId
			) {
				// console.log(
				// 	'-----------------------------------Update Module--------------------------------------------------------------'
				// );
				//Update Workbook Version Update
				finalList[index].WorkbookId = pathwayData[index].WorkbookId;
				finalList[index].ModuleName = pathwayData[index].ModuleName;
				finalList[index].Workbook = pathwayData[index].Workbook;
				// finalList[index].CourseVersion = pathwayData[index]?.CourseVersion ? pathwayData[index].CourseVersion : null;

				// finalList[index].ModuleTypeName = pathwayData[index].ModuleTypeName;
				// finalList[index].DiwoModuleId = pathwayData[index].DiwoModuleId;
			}
		}

		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--CheckModuleVersion--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const checkNewCourseIsAddedOrNot = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		//---------------------------Check New Course is Added or not------------------------------------
		let newAddedCourseModules = [[]];
		for (let module of pathwayData) {
			// module = module.convertToJSON();
			let flag = false;
			for (let assign of finalList) {
				if (module.CourseId == assign.CourseId) {
					flag = true;
					break;
				}
			}
			if (!flag) {
				if (newAddedCourseModules[0].length == 0) {
					newAddedCourseModules[0].push(module);
					// console.log('----module-----', module);
				} else {
					let temp = false;
					for (let l1 of newAddedCourseModules) {
						for (let l2 of l1) {
							if (l2.CourseId == module.CourseId) {
								l1.push(module);
								temp = true;
								break;
							}
						}
						if (temp) {
							break;
						}
					}
					if (!temp) {
						newAddedCourseModules.push([module]);
					}
				}
			}
		}

		// console.log('---newAddedCourseModules--', newAddedCourseModules.length);
		if (newAddedCourseModules[0].length > 0) {
			// First need to check - we can add this Course or Not
			// Course 2 Should not be published.
			// If adding Course at the last position, then previous course's last module must be not published.
			// First need to check - we can add this Course or Not
			// console.log('---newAddedCourseModules--', newAddedCourseModules[0].length);
			// console.log('---newAddedCourseModules--', newAddedCourseModules[0]);

			//Code For adding New course at the Start

			for (let courseData of newAddedCourseModules) {
				let CanChange = true;

				if (courseData.length > 0) {
					if (courseData[0].CourseIndex == 0) {
						//For First Position
						for (let temp of finalList) {
							if (temp.isPublish) {
								CanChange = false;
								break;
							}
						}
						// console.log('------First Position-------', CanChange);
						if (CanChange) {
							//Adding New Course Module at the starting the Array
							let index = 0;
							const random4Digit = Math.floor(1000 + Math.random() * 9000);
							for (let module of courseData) {
								// module = module.convertToJSON();
								let temp = module;
								temp.CourseIndex = random4Digit;
								finalList.splice(index, 0, temp);
								index++;
							}
						}
					} else if (courseData[0].CourseIndex > finalList[finalList.length - 1].CourseIndex) {
						//For Last Postion
						if (finalList[finalList.length - 1].isAssignmentCertification == false) {
							if (finalList[finalList.length - 1].isPublish) {
								CanChange = false;
							}
						} else {
							if (finalList[finalList.length - 2].isPublish) {
								CanChange = false;
							}
						}
						// console.log('------Last Position-------', CanChange);
						if (CanChange) {
							//Adding New Course Module at the Last Postion of the Array
							const random4Digit = Math.floor(1000 + Math.random() * 9000);
							for (let module of courseData) {
								// module = module.convertToJSON();
								let temp = module;
								temp.CourseIndex = random4Digit;
								finalList.push(temp);
							}
						}
					} else {
						//for Middle Postion
						// console.log('----------------2-22222222222222222222---------');
						let previousModule = true;
						let nextModule = true;
						let lastIndex = 0;
						//For Previous Module Status
						for (let i = finalList.length - 1; i >= 0; i--) {
							// console.log('---1--', i);
							if (finalList[i].CourseIndex == courseData[0].CourseIndex - 1) {
								// console.log('---2--');
								lastIndex = i + 1;
								if (finalList[i].isPublish) {
									previousModule = false;
								}
								break;
							}
						}

						if (!previousModule) {
							//Check for Next Module Status
							for (let temp of finalList) {
								if (temp.CourseIndex == courseData[0].CourseIndex) {
									if (temp.isPublish) {
										nextModule = false;
										break;
									}
								}
							}
						}

						if (previousModule || nextModule) {
							CanChange = true;
						} else {
							CanChange = false;
						}
						// console.log('------Middle Position-------', CanChange);
						if (CanChange) {
							const random4Digit = Math.floor(1000 + Math.random() * 9000);
							for (let module of courseData) {
								// module = module.convertToJSON();
								let temp = module;
								temp.CourseIndex = random4Digit;
								finalList.splice(lastIndex, 0, temp);
								lastIndex++;
							}
						}
					}
					finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
				}
			}
		}
		//---------------------------End Check New Course is Added or Not----------------------------------

		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--checkNewCourseIsAddedOrNot--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const checkNewModuleIsAddedOrNot = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		//---------------------------Check new Module is Added or Not--------------------------------------
		let newAddedModules = [];
		let pathwayDetails = [...pathwayData];
		// console.log('------finalList-----', finalList);
		for (let module of pathwayData) {
			// module = module.convertToJSON();
			// console.log('=---=module=----', module);
			let flag = true;
			let isCoursePresent = false;
			for (let assign of finalList) {
				if (module.CourseId == assign.CourseId) {
					isCoursePresent = true;
					if (
						module.Workbook.BaseWorkbookId == assign.Workbook.BaseWorkbookId ||
						module.WorkbookId == assign.WorkbookId
					) {
						flag = false;
						break;
					}
				}
			}
			if (flag && isCoursePresent) {
				newAddedModules.push({ ...module });
			}
		}

		// console.log('----------newAddedModules--------------', newAddedModules);

		if (newAddedModules.length > 0) {
			for (let module of newAddedModules) {
				//For first position of the Pathway
				let CanChange = true;
				if (module.ModuleIndex == 0) {
					for (let temp of finalList) {
						if (temp.isPublish) {
							CanChange = false;
							break;
						}
					}
					if (CanChange) {
						let temp = module;
						let finalCourseData_ = finalList.filter((data) => data.CourseId == module.CourseId);
						temp.CourseIndex = finalCourseData_[0].CourseIndex;
						finalList.splice(0, 0, temp);
					}
				} else {
					//Need to find the Module Position in the Course
					// console.log('-------9999999999999999999-------');

					let finalCourseData_ = finalList.filter((data) => data.CourseId == module.CourseId);
					let pathwayCoursedata = pathwayData.filter((data) => data.CourseId == module.CourseId);
					let newPostionIndex = pathwayCoursedata.findIndex(
						(data) => data.ModuleIndex == module.ModuleIndex && data.WorkbookId == module.WorkbookId
					);

					if (newPostionIndex == 0) {
						for (let temp of finalCourseData_) {
							if (temp.isPublish) {
								CanChange = false;
								break;
							}
						}
					} else if (newPostionIndex == finalCourseData_.length) {
						if (finalCourseData_[finalCourseData_.length - 1].isPublish) {
							CanChange = false;
						}
					} else {
						// console.log('--------finalCourseData_--------', finalCourseData_);
						// console.log('--------newPostionIndex--------', newPostionIndex);
						if (finalCourseData_[newPostionIndex].isPublish) {
							CanChange = false;
						}
					}

					if (CanChange) {
						module.CourseIndex = finalCourseData_[0].CourseIndex;
						finalList.splice(newPostionIndex + finalCourseData_[0].ModuleIndex, 0, module);
					}

					// let position = 0;
					// let courseModules = [];
					// let tempFlag = true;
					// for (let module_ of pathwayData) {
					// 	if (module_.CourseIndex == module.CourseIndex) {
					// 		courseModules.push(module_);
					// 		if (tempFlag) {
					// 			position++;
					// 		}
					// 		if (module_.WorkbookId == module.WorkbookId || module_.ModuleIndex == module.ModuleIndex) {
					// 			tempFlag = false;
					// 		}
					// 	}
					// }

					// let previousModule = true;
					// let nextModule = true;

					// for (let module_ of finalList) {
					// 	if (module_.ModuleIndex == module.ModuleIndex - 1) {
					// 		if (module_.isPublish) {
					// 			previousModule = false;
					// 		}
					// 	} else if (module_.ModuleIndex == module.ModuleIndex) {
					// 		if (module_.isPublish) {
					// 			nextModule = false;
					// 		}
					// 		break;
					// 	}
					// }

					// if (position == 1 || position < courseModules.length) {
					// 	//First Position in the Course Or Middle in the course
					// 	if (previousModule || nextModule) {
					// 		CanChange = true;
					// 	} else {
					// 		CanChange = false;
					// 	}
					// } else if (position == courseModules.length) {
					// 	// console.log('0---------------Last---Position---');
					// 	//Last Position in the Course
					// 	if (previousModule) {
					// 		CanChange = true;
					// 	} else {
					// 		CanChange = false;
					// 	}
					// }

					// // console.log('---CanChange-----', CanChange);
					// // console.log('---previousModule-----', previousModule);
					// // console.log('---nextModule-----', nextModule);

					// if (CanChange) {
					// 	let temp = module;
					// 	finalList.splice(module.ModuleIndex, 0, temp);
					// }
				}
			}
			finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
		}
		// console.log('---New Module Added---finalList-----', finalList);
		//---------------------------End  Check new Module is Added or Not--------------------------------------

		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--checkNewModuleIsAddedOrNot--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const checkDeleteAnyCourseIsAddedOrNot = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		//---------------------------Check delete Courses -------------------------------------------
		// let deletedCourseModules = [[]];

		// for (let module of finalList) {
		// 	let flag = true;
		// 	for (let module_ of pathwayData) {
		// 		if (module_.CourseId == module.CourseId) {
		// 			flag = false;
		// 			break;
		// 		}
		// 	}
		// 	if (flag) {
		// 		let flag_ = true;
		// 		for (let module__ of finalList) {
		// 			if (module__.CourseId == module.CourseId && module__.isPublish) {
		// 				flag_ = false;
		// 				break;
		// 			}
		// 		}
		// 		if (flag_) {
		// 			if (deletedCourseModules[0].length == 0) {
		// 				deletedCourseModules[0].push(module);
		// 			} else {
		// 				let flag = true;
		// 				for (let temp of deletedCourseModules) {
		// 					if (temp[0].CourseId == module.CourseId) {
		// 						temp.push(module);
		// 						flag = false;
		// 						break;
		// 					}
		// 				}
		// 				if (flag) {
		// 					deletedCourseModules.push([module]);
		// 				}
		// 			}
		// 		}
		// 	}
		// }

		// if (deletedCourseModules[0].length > 0) {
		// 	// console.log('-deletedCourseModules---', deletedCourseModules);
		// 	//Is Course at First Position
		// 	//Is Course at last Position
		// 	//Is Course at Middle Position
		// 	for (let courseData_ of deletedCourseModules) {
		// 		let CanChange = true;
		// 		if (courseData_ && courseData_[0] && courseData_[0].CourseIndex == 0) {
		// 			//Check for Course  at 1 position or not
		// 			for (let module of finalList) {
		// 				if (module.isPublish) {
		// 					CanChange = false;
		// 					break;
		// 				}
		// 			}

		// 			if (CanChange) {
		// 				finalList = finalList.filter((module) => module.CourseIndex != courseData_[0].CourseIndex);
		// 			}
		// 		} else if (
		// 			courseData_ &&
		// 			courseData_[0] &&
		// 			courseData_[0].CourseIndex == finalList[finalList.length - 1].CourseIndex
		// 		) {
		// 			//Check Before CourseIndex have any modulewith not publish
		// 			for (let i = finalList.length - 1; i >= 0; i--) {
		// 				if (finalList[i].CourseIndex == courseData_[0].CourseIndex - 1) {
		// 					if (!finalList[i].isPublish) {
		// 						CanChange = true;
		// 					} else {
		// 						CanChange = false;
		// 					}
		// 					break;
		// 				}
		// 			}

		// 			if (CanChange) {
		// 				finalList = finalList.filter((module) => module.CourseIndex != courseData_[0].CourseIndex);
		// 			}
		// 		} else {
		// 			let previousModule = true;
		// 			let nextModule = true;

		// 			for (let i = finalList.length - 1; i >= 0; i--) {
		// 				if (finalList[i].CourseIndex == courseData_[0].CourseIndex - 1) {
		// 					if (finalList[i].isPublish) {
		// 						previousModule = false;
		// 					}
		// 					break;
		// 				}
		// 			}

		// 			for (let module of finalList) {
		// 				if (module.CourseIndex == courseData_[0].CourseIndex + 1) {
		// 					if (module.isPublish) {
		// 						nextModule = false;
		// 					}
		// 					break;
		// 				}
		// 			}

		// 			if (previousModule || nextModule) {
		// 				CanChange = true;
		// 			} else {
		// 				CanChange = false;
		// 			}

		// 			if (CanChange) {
		// 				finalList = finalList.filter((module) => module.CourseIndex != courseData_[0].CourseIndex);
		// 			}
		// 		}
		// 	}
		// 	finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
		// }

		let deleteCourseId = [];

		for (let module of finalList) {
			if (!pathwayData.some((data) => data.CourseId == module.CourseId)) {
				if (!deleteCourseId.some((data) => data.CourseId == module.CourseId)) {
					let canDelete = true;
					//Check Any Module is Publish or not in the Course;
					if (finalList.some((data) => data.CourseId == module.CourseId && data.isPublish == true)) {
						canDelete = false;
					} else if (module.CourseIndex == 0) {
						if (finalList.some((data) => data.isPublish == true)) {
							canDelete = false;
						}
					} else if (module.CourseIndex == finalList[finalList.length - 1].CourseIndex) {
						if (!finalList.some((data) => data.CourseIndex == module.CourseIndex - 1 && data.isPublish == false)) {
							canDelete = false;
						}
					}
					deleteCourseId.push({ CourseId: module.CourseId, canDelete });
				}
			}
		}

		if (deleteCourseId?.length > 0) {
			deleteCourseId.forEach((deletedCourseData) => {
				if (deletedCourseData.canDelete === true) {
					finalList = finalList.filter((data) => data.CourseId !== deletedCourseData.CourseId);
				}
			});
		}
		finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
		//---------------------------End  Check delete Courses -------------------------------------------
		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--checkDeleteAnyCourseIsAddedOrNot--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const checkDeleteAnyModuleIsAddedOrNot = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		let deletedModuleFromCourse = [];

		for (let module of finalList) {
			let flag = true;
			let isCoursePresent = false;
			if (module.isPublish) {
				flag = false;
				continue;
			}
			for (let module_ of pathwayData) {
				if (module_.CourseId == module.CourseId) {
					isCoursePresent = true;
				}
				if (
					module.CourseId == module_.CourseId &&
					module.WorkbookId == module_.WorkbookId
					// &&
					// module.ModuleIndex == module_.ModuleIndex
				) {
					flag = false;
					break;
				}
			}
			if (flag && isCoursePresent) {
				deletedModuleFromCourse.push({ ...module });
			}
		}

		// console.log('--------------deletedModuleFromCourse-------------------', deletedModuleFromCourse);

		if (deletedModuleFromCourse.length > 0) {
			for (let module of deletedModuleFromCourse) {
				//for First Postion
				// console.log('--------------module-------------------', module);
				// console.log('--------------finalList-------------------', finalList);
				let CanChange = true;
				if (module.ModuleIndex == 0) {
					for (let temp of finalList) {
						if (temp.isPublish) {
							CanChange = false;
						}
					}
					if (CanChange) {
						finalList = finalList.filter((module_) => module_.id != module.id);
					}
				} else if (module.ModuleIndex == finalList[finalList.length - 1].ModuleIndex) {
					if (finalList[finalList.length - 2].isPublish) {
						CanChange = false;
					}
					if (CanChange) {
						finalList = finalList.filter((module_) => module_.id != module.id);
					}
				} else {
					//For Middel Postion
					//Need to Check Module Postion in the Course
					let coursedata = finalList.filter((module_) => module_.CourseIndex == module.CourseIndex);
					let position = coursedata.findIndex(
						(data) => data.id == module.id && data.CourseIndex == module.CourseIndex && data.CourseId == module.CourseId
					);
					// console.log('=----------coursedata--------', coursedata);
					// console.log('=----------position--------', position);
					if (position == 0) {
						// console.log('-------------0--------------');
						//First in the Course
						for (let temp of coursedata) {
							if (temp.isPublish) {
								CanChange = false;
								break;
							}
						}
					} else if (position == coursedata.length - 1) {
						// console.log('-------------Last--------------');
						//Last in the Course
						if (coursedata[coursedata.length - 2].isPublish) {
							CanChange = false;
						}
					} else {
						//Middle in the course
						// console.log('-------------Middel--------------');

						if (coursedata[position - 1].isPublish && coursedata[position + 1].isPublish) {
							CanChange = false;
						}
					}

					if (CanChange) {
						finalList = finalList.filter((module_) => module_.id != module.id);
					}
				}

				finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
			}
		}
		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--checkDeleteAnyModuleIsAddedOrNot--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const CheckCourseSequencyChages = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		/////////////////////////////Need to check the find Updated Sequency////////////////////////////
		// let publishedCourseIndex = -1;
		// for (let module of finalList) {
		// 	if (module.isPublish) {
		// 		publishedCourseIndex = module.CourseIndex;
		// 	}
		// }

		// let pathwayCourseList = pathwayData.filter(
		// 	(data) => finalList.findIndex((data_) => data.CourseId == data_.CourseId) >= 0
		// );
		// pathwayCourseList = await updateCourseIndexAndModuleIndex(pathwayCourseList, DiwoAssignmentId);

		// for (let module of pathwayCourseList) {
		// 	let flag = true;
		// 	let currentCourseIndex = -1;
		// 	let newCourseIndex = module.CourseIndex;

		// 	let CourseIsPresent = false;
		// 	for (let module_ of finalList) {
		// 		if (module.CourseId == module_.CourseId) {
		// 			CourseIsPresent = true;
		// 		}
		// 		if (module.CourseId == module_.CourseId && module.CourseIndex == module_.CourseIndex) {
		// 			flag = false;
		// 		}
		// 		if (module.CourseId == module_.CourseId) {
		// 			currentCourseIndex = module_.CourseIndex;
		// 		}
		// 	}

		// 	if (flag && CourseIsPresent) {
		// 		if (
		// 			currentCourseIndex > -1 &&
		// 			currentCourseIndex > publishedCourseIndex &&
		// 			newCourseIndex > publishedCourseIndex
		// 		) {
		// 			if (newCourseIndex <= finalList[finalList.length - 1].CourseIndex) {
		// 				let moduleData = finalList.filter((data) => data.CourseIndex == currentCourseIndex);
		// 				finalList = finalList.filter((data) => data.CourseIndex != currentCourseIndex);

		// 				if (newCourseIndex == 0) {
		// 					finalList.splice(0, 0, ...moduleData);
		// 				}
		// 				else {
		// 					for (let i = finalList.length - 1; i >= 0; i--) {
		// 						if (finalList[i].CourseIndex == newCourseIndex - 1) {
		// 							finalList.splice(i + 1, 0, ...moduleData);
		// 							break;
		// 						}
		// 					}
		// 				}
		// 			}
		// 		}
		// 		finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
		// 	}
		// }

		// finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);

		//--------------------------- End Course Sequence Modules -------------------------------------------

		// console.log('--------pathwayData---------', pathwayData);

		let pathwayDetails = pathwayData.filter((data, index) => {
			if (finalList.some((_data) => data.CourseId == _data.CourseId && data.WorkbookId == _data.WorkbookId)) {
				return data;
			}
		});
		pathwayDetails = await updateCourseIndexAndModuleIndex(pathwayDetails, DiwoAssignmentId);

		// console.log('----pathwayDetails----', pathwayDetails);
		// console.log('----finalList----', finalList);

		let courseNotFoundindex = 0;
		let courseIdList = [];
		let addCheck = 0;
		for (let i = 0; i < finalList.length; i++) {
			// console.log('------i------', i);
			// console.log('------addCheck------', addCheck);
			if (addCheck >= finalList.length * 2) {
				break;
			}
			let notPresent = true;
			let CanChange = false;
			let newCourseIndex = null;

			for (let module of pathwayDetails) {
				if (module.CourseId == finalList[i].CourseId) {
					notPresent = false;
					if (finalList[i].isPublish == undefined || finalList[i].isPublish == false) {
						if (module.CourseIndex + courseNotFoundindex != finalList[i].CourseIndex) {
							CanChange = true;
							newCourseIndex = module.CourseIndex + courseNotFoundindex;
						}
					}
				}
			}

			if (CanChange) {
				//First Check have any module is publish or Not
				if (!finalList.some((data) => data.CourseId == finalList[i].CourseId && data.isPublish == true)) {
					let flag = false;
					if (newCourseIndex == 0) {
						if (!finalList.some((data) => data.isPublish == true)) {
							flag = true;
						}
					} else if (newCourseIndex == finalList[finalList.length - 1].CourseIndex) {
						if (
							finalList[finalList.length - 1].isPublish == false ||
							finalList[finalList.length - 1].isPublish == undefined
						) {
							flag = true;
						}
					} else if (newCourseIndex > 0) {
						if (!finalList.some((data) => data.CourseIndex == newCourseIndex && data.isPublish == true)) {
							flag = true;
						}
					}

					if (flag) {
						// console.log('---------------flag--------------------', flag);
						let shiftCourseData = finalList.filter((data) => data.CourseId == finalList[i].CourseId);
						finalList = finalList.filter((data) => data.CourseId != finalList[i].CourseId);
						const newIndex = finalList.findIndex((data) => data.CourseIndex == newCourseIndex);
						// console.log('---------------newIndex--------------------', newIndex);
						// console.log('---------------newCourseIndex--------------------', newCourseIndex);
						// console.log('---------------courseNotFoundindex--------------------', courseNotFoundindex);
						if (newIndex >= 0) {
							finalList.splice(newIndex, 0, ...shiftCourseData);
							// console.log(
							// 	'-----------------------finalListfinalList----------------------------------------------',
							// 	finalList
							// );
							finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
							// console.log(
							// 	'-----------------------finalListfinalListfinalList----------------------------------------------',
							// 	finalList
							// );

							addCheck++;
							// i = 0;
						}
					}
				}
			}

			if (notPresent) {
				if (courseIdList.indexOf(finalList[i].CourseId) == -1) {
					courseIdList.push(finalList[i].CourseId);
					courseNotFoundindex++;
				}
			}
		}

		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--CheckCourseSequencyChages--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const CheckModuleSequencyInCourseChages = async function (finalList, pathwayData, DiwoAssignmentId) {
	try {
		//------------------- Need to Find the Module Dequency within the course------------------------------

		//Equal the PathwayData nad FinalData

		// let pathwayFilterdata = pathwayData.filter(
		// 	(data) =>
		// 		finalList.findIndex((data_) => data_.CourseId == data.CourseId && data_.WorkbookId == data.WorkbookId) >= 0
		// );
		// pathwayFilterdata = await updateCourseIndexAndModuleIndex(pathwayFilterdata, DiwoAssignmentId);

		// for (let module of pathwayFilterdata) {
		// 	let CanChange = false;
		// 	let finalCourseList = finalList.filter(
		// 		(data) => data.CourseIndex == module.CourseIndex && data.CourseId == module.CourseId
		// 	);
		// 	let pathwayCourseList = pathwayData.filter(
		// 		(data) =>
		// 			data.CourseIndex == module.CourseIndex &&
		// 			data.CourseId == module.CourseId &&
		// 			finalCourseList.findIndex((data_) => data_.WorkbookId == data.WorkbookId) >= 0
		// 	);

		// 	if (
		// 		pathwayCourseList.findIndex((data) => data.WorkbookId == module.WorkbookId) !=
		// 		finalCourseList.findIndex((data) => data.WorkbookId == module.WorkbookId)
		// 	) {
		// 		CanChange = true;
		// 	}

		// 	for (let data of finalCourseList) {
		// 		if (data.WorkbookId == module.WorkbookId && data.isPublish) {
		// 			CanChange = false;
		// 			break;
		// 		}
		// 	}

		// 	console.log('----------finalCourseList--------------', finalCourseList.length);
		// 	console.log('----------pathwayCourseList--------------', pathwayCourseList.length);
		// 	console.log('----------CanChange--------------', CanChange);

		// 	// for (let module_ of finalList) {
		// 	// 	if (
		// 	// 		module_.CourseIndex == module.CourseIndex &&
		// 	// 		module_.CourseId == module.CourseId &&
		// 	// 		module_.WorkbookId == module.WorkbookId
		// 	// 	) {
		// 	// 		if (module_.isPublish) {
		// 	// 			break;
		// 	// 		}
		// 	// 		if (module_.ModuleIndex != module.ModuleIndex) {
		// 	// 			console.log('----------Check Module Sequency-----------');
		// 	// 			console.log('----------Check Module module_-----------', module_);
		// 	// 			console.log('----------Check Module module-----------', module);
		// 	// 			CanChange = true;
		// 	// 		}
		// 	// 	}
		// 	// }

		// 	if (CanChange) {
		// 		//Check Module Postion in the Course
		// 		let courseData = finalList.filter((data) => data.CourseIndex == module.CourseIndex);
		// 		let currentPosition = courseData.findIndex((data) => data.WorkbookId == module.WorkbookId);
		// 		let CurrentModuleIndex = finalList.findIndex(
		// 			(data) =>
		// 				data.CourseId == module.CourseId &&
		// 				data.CourseIndex == module.CourseIndex &&
		// 				data.WorkbookId == module.WorkbookId
		// 		);

		// 		let newModuleIndex = pathwayFilterdata.findIndex(
		// 			(data) => data.CourseId == module.CourseId && data.WorkbookId == module.WorkbookId
		// 		);

		// 		if (currentPosition == 0) {
		// 			let flag = true;
		// 			for (let temp of courseData) {
		// 				if (temp.isPublish) {
		// 					flag = false;
		// 					break;
		// 				}
		// 			}
		// 			if (flag) {
		// 				// Can Update Module Sequency

		// 				if (CurrentModuleIndex >= 0) {
		// 					finalList.splice(CurrentModuleIndex, 1); //Delete From Original Position
		// 					finalList.splice(
		// 						courseData[0].ModuleIndex,
		// 						0,
		// 						courseData.find((data) => data.WorkbookId == module.WorkbookId)
		// 					); //Add into the new Position
		// 				}
		// 			}
		// 		} else if (currentPosition == courseData.length - 1) {
		// 			//Last Position
		// 			if (courseData[currentPosition].isPublish == false) {
		// 				if (newModuleIndex == 0 || finalList[newModuleIndex].isPublish == false) {
		// 					//Can update Module Sequency
		// 					if (CurrentModuleIndex >= 0) {
		// 						finalList.splice(CurrentModuleIndex, 1); //Delete From Original Position
		// 						finalList.splice(
		// 							newModuleIndex,
		// 							0,
		// 							courseData.find((data) => data.WorkbookId == module.WorkbookId)
		// 						); //Add into the new Position
		// 					}
		// 				}
		// 			}
		// 		} else {
		// 			if (
		// 				courseData[currentPosition + 1].isPublish == false &&
		// 				(finalList[module.ModuleIndex - 1] == false || finalList[module.ModuleIndex] == false)
		// 			) {
		// 				if (CurrentModuleIndex >= 0) {
		// 					finalList.splice(CurrentModuleIndex, 1); //Delete From Original Position
		// 					finalList.splice(
		// 						module.ModuleIndex,
		// 						0,
		// 						courseData.find((data) => data.WorkbookId == module.WorkbookId)
		// 					); //Add into the new Position
		// 				}
		// 			}
		// 		}
		// 		finalList = await updateCourseIndexAndModuleIndex(finalList, req.body.DiwoAssignmentId);
		// 	}
		// }

		let pathwayDetails = pathwayData.filter((data, index) => {
			if (finalList.some((_data) => data.CourseId == _data.CourseId && data.WorkbookId == _data.WorkbookId)) {
				return data;
			}
		});
		pathwayDetails = await updateCourseIndexAndModuleIndex(pathwayDetails, DiwoAssignmentId);

		let checkCourseIds = [];
		for (let i = 0; i < finalList.length; i++) {
			if (finalList[i].isPublish == false && checkCourseIds.indexOf(finalList[i].CourseId) == -1) {
				let coursePathwayData = pathwayDetails
					.filter((data) => data.CourseId == finalList[i].CourseId)
					.map((data, index) => {
						data.ModuleIndex = index;
						return data;
					});

				let finalCourseData = finalList
					.filter((data) => data.CourseId == finalList[i].CourseId)
					.map((data, index) => {
						data.ModuleIndex = index;
						return data;
					});
				checkCourseIds.push(finalList[i].CourseId);
				// if (coursePathwayData.length > 0) {
				// 	let workbookNotFoundIndex = 0;
				// 	for (let j = 0; j < finalCourseData.length; j++) {
				// 		let presentWorkbook = true;
				// 		let CanChange = false;
				// 		let newModuleIndex = null;
				// 		for (let _module of coursePathwayData) {
				// 			if (finalCourseData[j].WorkbookId == _module.WorkbookId) {
				// 				presentWorkbook = false;
				// 				if (finalCourseData[j].ModuleIndex != _module.ModuleIndex + workbookNotFoundIndex) {
				// 					newModuleIndex = _module.ModuleIndex + workbookNotFoundIndex;
				// 					if (finalCourseData[j].isPublish == false) {
				// 						CanChange = true;
				// 						break;
				// 					}
				// 				}
				// 			}
				// 		}

				// 		if (CanChange && newModuleIndex >= 0) {
				// 			let flag = true;
				// 			if (newModuleIndex == 0) {
				// 				//First Position
				// 				if (finalCourseData.some((data) => data.isPublish == true)) {
				// 					flag = false;
				// 				}
				// 			} else if (finalCourseData[newModuleIndex].isPublish == true) {
				// 				flag = false;
				// 			}

				// 			if (flag) {
				// 				let module_ = finalCourseData.splice(finalCourseData[j].ModuleIndex, 1);
				// 				finalCourseData.splice(newModuleIndex, 0, module_[0]);
				// 				finalCourseData = await updateCourseIndexAndModuleIndex(finalCourseData, DiwoAssignmentId, false);
				// 				console.log('-----finalCourseDatafinalCourseData--------------', finalCourseData);
				// 			}
				// 		}

				// 		if (presentWorkbook) {
				// 			workbookNotFoundIndex++;
				// 		}
				// 	}

				// 	//need to update in the Final List
				// 	let updateModuleIndex = 0;

				// 	if (finalList[i].CourseIndex != 0) {
				// 		for (let module of finalList) {
				// 			if (module.CourseIndex == finalList[i].CourseIndex - 1) {
				// 				console.log('----module.ModuleIndex------', module.ModuleIndex);
				// 				updateModuleIndex = module.ModuleIndex + 1;
				// 			}
				// 		}
				// 	}
				// 	console.log('-------updateModuleIndex-----------', updateModuleIndex);
				// 	finalList = finalList.filter((data) => data.CourseId != finalList[i].CourseId);
				// 	finalList.splice(updateModuleIndex, 0, ...finalCourseData);
				// 	finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
				// }

				if (coursePathwayData?.length > 0 && finalCourseData.length > 0) {
					({ finalList: finalCourseData, courseData: coursePathwayData } = await checkSequency(
						finalCourseData,
						coursePathwayData,
						DiwoAssignmentId
					));
					finalCourseData = await updateCourseIndexAndModuleIndex(finalCourseData, DiwoAssignmentId, false);
					let updateModuleIndex = 0;
					if (finalList[i].CourseIndex != 0) {
						for (let module of finalList) {
							if (module.CourseIndex == finalList[i].CourseIndex - 1) {
								updateModuleIndex = module.ModuleIndex + 1;
							}
						}
					}
					finalList = finalList.filter((data) => data.CourseId != finalList[i].CourseId);
					finalList.splice(updateModuleIndex, 0, ...finalCourseData);
					finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
				}
			} else if (finalList[i].isPublish == true) {
				checkCourseIds.push(finalList[i].CourseId);
			}
		}
		finalList = await updateCourseIndexAndModuleIndex(finalList, DiwoAssignmentId);
		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--CheckModuleSequencyInCourseChages--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const CheckCertification = async function (finalList, pathwayData, finalListCertificate, pathwayCertificate) {
	try {
		if (!finalListCertificate && pathwayCertificate) {
			if (finalList[finalList.length - 1].isPublish == false) {
				pathwayCertificate.ModuleIndex = finalList.length;
				finalList.push(pathwayCertificate);
			}
		} else if (finalListCertificate && !pathwayCertificate) {
			if (finalList[finalList.length - 1].isPublish == true || finalListCertificate.isPublish) {
				finalListCertificate.ModuleIndex = finalList.length;
				finalList.push(finalListCertificate);
			}
		} else if (finalListCertificate && pathwayCertificate) {
			if (finalListCertificate.WorkbookId != pathwayCertificate.WorkbookId) {
				if (finalList[finalList.length - 1].isPublish == false) {
					pathwayCertificate.ModuleIndex = finalList.length;
					finalList.push(pathwayCertificate);
				}
			} else {
				finalListCertificate.ModuleIndex = finalList.length;
				finalList.push(finalListCertificate);
			}
		}
		return { finalList, pathwayData };
	} catch (error) {
		console.log('--Error--CheckCertification--', error);
		return { finalList, pathwayData }; // Safe fallback
	}
};

const updateCourseIndexAndModuleIndex = async function (data, DiwoAssignmentId, changeCourseIndex = true) {
	try {
		let moduleIndex = 0;
		let courseIndex = 0;
		let currentCourseIndex = null;
		if (!changeCourseIndex) {
			currentCourseIndex = data.CourseIndex;
		}
		for (let module of data) {
			module.ModuleIndex = moduleIndex;
			moduleIndex++;
			if (currentCourseIndex != module.CourseIndex) {
				if (currentCourseIndex != null) {
					courseIndex++;
				}
				currentCourseIndex = module.CourseIndex;
			}
			if (module?.isCertificationModule == false || module?.isAssignmentCertification == false) {
				module.isCertificationModule = false;
				module.isAssignmentCertification = false;
				if (changeCourseIndex) {
					module.CourseIndex = courseIndex;
				}
			} else {
				module.isCertificationModule = true;
				module.isAssignmentCertification = true;
				module.CourseIndex = 0;
			}

			if (module['isPublish'] == undefined) {
				delete module.id;
				delete module.createdAt;
				delete module.updatedAt;

				module.isPublish = false;
			}
			if (module['DiwoAssignmentId'] == undefined) {
				module.DiwoAssignmentId = DiwoAssignmentId;
			}
			if (module['ModuleStartDate'] == undefined) {
				module.ModuleStartDate = null;
			}
			if (module['ModuleEndDate'] == undefined) {
				module.ModuleEndDate = null;
			}
			// Need to Check this
			// if (module['isAssignmentCertification'] == undefined) {
			// 	module.isAssignmentCertification = module.isCertificationModule;
			// }
		}
		// console.log('---------data-----------', data);
		data = await addDependencyDataInTheObject(data);
		return data;
	} catch (error) {
		console.log('- Error--updateCourseIndexAndModuleIndex--', error);
	}
};

const addDependencyDataInTheObject = async function (data) {
	try {
		for (let temp of data) {
			if (
				temp.ModuleDepedencyIndex != 'No Dependency' &&
				(temp?.isCertificationModule == false || temp?.isAssignmentCertification == false)
			) {
				let moduleIndex = temp.ModuleDepedencyIndex.split(',');
				// console.log('-----------moduleIndex------------', moduleIndex);
				temp.dependencyDetails = [];
				if (moduleIndex.length > 0) {
					for (let index of moduleIndex) {
						if (index.trim() != '' && !isNaN(index)) {
							for (let temp2 of data) {
								if (temp2.ModuleIndex == parseInt(index)) {
									temp.dependencyDetails.push({ CourseId: temp2.CourseId, WorkbookId: temp2.WorkbookId });
									break;
								}
							}
						}
					}
				}
			} else if (temp?.isCertificationModule == true || temp?.isAssignmentCertification == true) {
				temp.dependencyDetails = [];
				temp.ModuleDepedencyIndex = 'ALL';
				temp.ModuleOperation = 'AND';
			}
		}
		return data;
	} catch (error) {
		console.log('---------Error--addDependencyDataInTheObject--', error);
	}
};

const updateDependencyIndexAsPerNewObject = async function (data) {
	try {
		if (data.length > 0) {
			for (let module of data) {
				if (module?.dependencyDetails?.length > 0) {
					module.ModuleDepedencyIndex = [];
					for (let dependency of module.dependencyDetails) {
						for (let temp of data) {
							if (
								temp.CourseId == dependency.CourseId &&
								temp.WorkbookId == dependency.WorkbookId &&
								temp.ModuleIndex < module.ModuleIndex
							) {
								module.ModuleDepedencyIndex.push(temp.ModuleIndex);
								break;
							}
						}
					}

					if (module.ModuleDepedencyIndex.length > 0) {
						module.ModuleDepedencyIndex = module.ModuleDepedencyIndex.join(',');
					} else {
						// console.log('----1-----');
						module.ModuleDepedencyIndex = 'No Dependency';
					}
				} else if (module?.isAssignmentCertification || module?.isCertificationModule) {
					// console.log('----Certificate Dependency-----');
					module.ModuleDepedencyIndex = 'ALL';
					module.ModuleOperation = 'AND';
				} else {
					// console.log('----2-----');
					module.ModuleDepedencyIndex = 'No Dependency';
				}
			}
		}
		return data;
	} catch (error) {
		console.log('----Error updateDependencyIndexAsPerNewObject', error);
	}
};

const updateCourseAssignment = async function (req, res) {
	try {
		let schema = Joi.object({
			DiwoAssignmentId: Joi.number().integer().positive().required(),
			CourseId: Joi.number().integer().positive().required(),
		});

		const data = {
			DiwoAssignmentId: req.body.DiwoAssignmentId,
			CourseId: req.body.CourseId,
		};

		const { error, value } = schema.validate(data);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		let { DiwoAssignmentId, CourseId } = value;

		let finalList = [];
		let DiwoModuleAssigns = [];
		let finalCertificate;
		let courseCertificate;
		[err, courseAssignmentData] = await to(
			DiwoAssignment.findOne({
				where: { id: DiwoAssignmentId },
				include: [
					{
						model: DiwoModuleAssign,
						required: true,
						include: [{ model: Workbook, attributes: ['id', 'default', 'version', 'BaseWorkbookId'] }],
					},
				],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);
		if (err) {
			console.log('---error while get pathway assignment data--', err);
			return ResponseError(res, err, 500, true);
		}

		if (!courseAssignmentData) {
			return ResponseError(res, MESSAGE.ASSIGNMENT_NOT_FOUND, 404, true);
		} else {
			for (let data of courseAssignmentData.DiwoModuleAssigns) {
				DiwoModuleAssigns.push(data.convertToJSON());
			}
			finalList = JSON.parse(JSON.stringify(DiwoModuleAssigns));
		}

		//Find Course Latest data
		[err, courseData] = await to(
			Course_workbook_mapping.findAll({
				where: {
					CourseId: CourseId,
				},
				include: [
					{ model: Workbook, attributes: ['id', 'default', 'version', 'BaseWorkbookId'] },
					{ model: Course, attributes: ['id', 'version', 'title'] },
				],
				order: [['ModuleIndex', 'ASC']],
			})
		);
		if (err) {
			console.log('---error while get Course assignment data--', err);
			return ResponseError(res, err, 500, true);
		}

		if (courseData.length == 0) {
			return ResponseError(res, MESSAGE.COURSE_NOT_FOUND, 404, true);
		} else {
			courseData = JSON.parse(JSON.stringify(courseData)).map((data) => {
				data.CourseIndex = 0;
				data.CourseVersion = data.Course.version;
				data.CourseName = data.Course.title;
				delete data.Course;
				return data;
			});
		}

		//Certificate seperate
		if (
			courseData[courseData.length - 1]?.isAssignmentCertification == true ||
			courseData[courseData.length - 1]?.isCertificationModule == true
		) {
			courseCertificate = courseData.splice(courseData.length - 1, 1);
			courseCertificate = courseCertificate[0];
		}

		if (
			finalList[finalList.length - 1]?.isAssignmentCertification == true ||
			finalList[finalList.length - 1]?.isCertificationModule == true
		) {
			finalCertificate = finalList.splice(finalList.length - 1, 1);
			finalCertificate = finalCertificate[0];
			// console.log('--finalCertificate---finalCertificate--', finalCertificate);
		}

		//Module Upgrades
		({ finalList, courseData } = await checkModuleVersionForCourse(finalList, courseData, DiwoAssignmentId));
		// console.log('-----------courseData-------------', courseData);
		// console.log('-----------finalList-------------', finalList);
		({ finalList, courseData } = await checkAddAnyNewModule(finalList, courseData, DiwoAssignmentId));
		// console.log('-----------Add new Module-------------', finalList);
		({ finalList, courseData } = await checkAnyDeleteModule(finalList, courseData, DiwoAssignmentId));
		// console.log('-----------Delete Any Module-------------', finalList);

		({ finalList, courseData } = await checkSequency(finalList, courseData, DiwoAssignmentId));
		// console.log('-----------checkSequency Module-------------', finalList);
		//Check Module Sequency
		({ finalList, courseData } = await checkCertificate(
			finalList,
			courseData,
			courseCertificate,
			finalCertificate,
			DiwoAssignmentId
		));
		// console.log('-----------Certificate Module-------------', finalList);
		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		console.log('-------ErrorupdateCourseAssignment---', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateCourseAssignment = updateCourseAssignment;

const checkSequency = async function (finalList, courseData, DiwoAssignmentId) {
	try {
		let index = 0;
		const courseList = courseData
			.filter((data) => {
				if (finalList.some((_data) => data.WorkbookId == _data.WorkbookId)) {
					return data;
				}
			})
			.map((data) => {
				data.ModuleIndex = index;
				index++;
				return data;
			});
		// console.log('-------courseList---checkSequency---', courseList);

		// for (let module of courseList) {
		// 	let flag = true;
		// 	for (let _module of finalList) {
		// 		if (module.WorkbookId == _module.WorkbookId && _module.isPublish) {
		// 			flag = false;
		// 			break;
		// 		} else if (module.WorkbookId == _module.WorkbookId && module.ModuleIndex != _module.ModuleIndex) {
		// 			console.log('------------------module.ModuleIndex----------------------', module.ModuleIndex);
		// 			break;
		// 		} else if (module.WorkbookId == _module.WorkbookId && module.ModuleIndex == _module.ModuleIndex) {
		// 			flag = false;
		// 			break;
		// 		}

		// 	}
		// 	console.log('-------module-----------', module);
		// 	if (flag) {
		// 		//find Original Copy Of Module

		// 		let canChange = false;
		// 		if (module.ModuleIndex == 0) {
		// 			if (!finalList.some((data) => data?.isPublish == true)) {
		// 				canChange = true;
		// 			}
		// 		} else if (module.ModuleIndex == finalList.length - 1) {
		// 			if (finalList[finalList.length - 2]?.isPublish == false && finalList[finalList.length - 1]?.isPublish == false) {
		// 				canChange = true;
		// 			}
		// 		} else {
		// 			if (
		// 				finalList[module.ModuleIndex]?.isPublish == false ||
		// 				finalList[module.ModuleIndex - 1]?.isPublish == false
		// 			) {
		// 				canChange = true;
		// 			}
		// 		}

		// 		if (canChange) {
		// 			let index = finalList.findIndex((data) => data.WorkbookId == module.WorkbookId);
		// 			let finalModuleCopy = finalList.splice(index, 1);
		// 			finalList.splice(module.ModuleIndex, 0, finalModuleCopy[0]);
		// 			finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
		// 		}
		// 	}
		// }
		let tempIndex = 0;
		let tempModuleIndexId = [];
		let addCheck = 0;
		for (let i = 0; i < finalList.length; i++) {
			if (addCheck >= finalList.length * 2) {
				break;
			}
			let notPresent = true;
			let flag = true;
			let newModuleIndex = null;

			for (let _module of courseList) {
				if (_module.WorkbookId == finalList[i].WorkbookId) {
					notPresent = false;
				}
				if (_module.WorkbookId == finalList[i].WorkbookId && finalList[i].isPublish) {
					flag = false;
					break;
				} else if (
					_module.WorkbookId == finalList[i].WorkbookId &&
					_module.ModuleIndex + tempIndex != finalList[i].ModuleIndex
				) {
					newModuleIndex = _module.ModuleIndex + tempIndex;
					break;
				} else if (
					_module.WorkbookId == finalList[i].WorkbookId &&
					_module.ModuleIndex + tempIndex == finalList[i].ModuleIndex
				) {
					flag = false;
					break;
				}
			}

			if (flag) {
				let canChange = false;
				if (newModuleIndex == 0) {
					if (!finalList.some((data) => data?.isPublish == true)) {
						canChange = true;
					}
				} else if (newModuleIndex == finalList.length - 1) {
					if (
						finalList[finalList.length - 2]?.isPublish == false ||
						finalList[finalList.length - 1]?.isPublish == false
					) {
						canChange = true;
					}
				} else {
					if (finalList[newModuleIndex]?.isPublish == false || finalList[newModuleIndex - 1]?.isPublish == false) {
						canChange = true;
					}
				}

				if (canChange) {
					let index = finalList.findIndex((data) => data.WorkbookId == finalList[i].WorkbookId);
					let finalModuleCopy = finalList.splice(index, 1);
					finalList.splice(newModuleIndex, 0, finalModuleCopy[0]);
					finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
					i--;
				}
			}

			if (notPresent) {
				if (tempModuleIndexId.indexOf(finalList[i].WorkbookId) == -1) {
					tempModuleIndexId.push(finalList[i].WorkbookId);
					tempIndex++;
				}
			}
			addCheck++;
		}
		// for (let module of finalList) {
		// 	let notPresent = true;
		// 	let flag = true;
		// 	let newModuleIndex = null;
		// 	// if (module.isPublish) {
		// 	// 	continue;
		// 	// }
		// 	for (let _module of courseList) {
		// 		if (_module.WorkbookId == module.WorkbookId) {
		// 			notPresent = false;
		// 		}
		// 		if (_module.WorkbookId == module.WorkbookId && module.isPublish) {
		// 			flag = false;
		// 			break;
		// 		} else if (_module.WorkbookId == module.WorkbookId && _module.ModuleIndex + tempIndex != module.ModuleIndex) {
		// 			newModuleIndex = _module.ModuleIndex + tempIndex;
		// 			break;
		// 		} else if (_module.WorkbookId == module.WorkbookId && _module.ModuleIndex + tempIndex == module.ModuleIndex) {
		// 			flag = false;
		// 			break;
		// 		}
		// 	}

		// 	if (flag) {
		// 		let canChange = false;
		// 		if (newModuleIndex == 0) {
		// 			if (!finalList.some((data) => data?.isPublish == true)) {
		// 				canChange = true;
		// 			}
		// 		} else if (newModuleIndex == finalList.length - 1) {
		// 			if (
		// 				finalList[finalList.length - 2]?.isPublish == false ||
		// 				finalList[finalList.length - 1]?.isPublish == false
		// 			) {
		// 				canChange = true;
		// 			}
		// 		} else {
		// 			if (finalList[newModuleIndex]?.isPublish == false || finalList[newModuleIndex - 1]?.isPublish == false) {
		// 				canChange = true;
		// 			}
		// 		}

		// 		if (canChange) {
		// 			let index = finalList.findIndex((data) => data.WorkbookId == module.WorkbookId);
		// 			let finalModuleCopy = finalList.splice(index, 1);
		// 			finalList.splice(newModuleIndex, 0, finalModuleCopy[0]);
		// 			finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
		// 		}
		// 	}

		// 	if (notPresent) {
		// 		tempIndex++;
		// 	}
		// }
		return { finalList, courseData };
	} catch (error) {
		return { finalList, courseData };
	}
};

const checkCertificate = async function (finalList, courseData, courseCertificate, finalCertificate, DiwoAssignmentId) {
	try {
		// console.log('-----finalCertificate------', finalCertificate);
		// console.log('-----courseCertificate------', courseCertificate);

		if (courseCertificate && finalCertificate) {
			if (finalCertificate.isPublish || courseCertificate.WorkbookId == finalCertificate.WorkbookId) {
				// console.log('------11------');
				finalList.push(finalCertificate);
			} else if (courseCertificate.WorkbookId != finalCertificate.WorkbookId) {
				// console.log('------22------');

				finalList.push(courseCertificate);
			}
		} else if (!courseCertificate && finalCertificate) {
			if (finalList[finalList.length - 1].isPublish) {
				// console.log('------33------');

				finalList.push(finalCertificate);
			}
		} else if (courseCertificate && !finalCertificate) {
			if (
				finalList[finalList.length - 1]?.isPublish == false ||
				finalList[finalList.length - 1]?.isPublish == undefined
			) {
				// console.log('------44------');

				finalList.push(courseCertificate);
			}
		}
		finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
		return { finalList, courseData };
	} catch (error) {
		console.log('--Error--checkCertificate--', error);
		return { finalList, courseData };
	}
};

const checkModuleVersionForCourse = async function (finalList, courseData, DiwoAssignmentId) {
	try {
		//Normal Version Update
		let index = 0;
		for (index = 0; index < finalList.length; index++) {
			if (
				finalList[index].isPublish == false &&
				courseData[index] &&
				finalList[index].CourseId == courseData[index].CourseId &&
				finalList[index].ModuleIndex == courseData[index].ModuleIndex &&
				finalList[index].CourseIndex == courseData[index].CourseIndex &&
				finalList[index].WorkbookId != courseData[index].WorkbookId &&
				finalList[index].Workbook.BaseWorkbookId == courseData[index].Workbook.BaseWorkbookId
			) {
				// console.log(
				// 	'-----------------------------------Update Module--------------------------------------------------------------'
				// );
				//Update Workbook Version Update
				finalList[index].WorkbookId = courseData[index].WorkbookId;
				finalList[index].ModuleName = courseData[index].ModuleName;
				finalList[index].Workbook = courseData[index].Workbook;
				finalList[index].CourseVersion = courseData[index]?.CourseVersion ? courseData[index].CourseVersion : null;

				// finalList[index].ModuleTypeName = courseData[index].ModuleTypeName;
				// finalList[index].DiwoModuleId = courseData[index].DiwoModuleId;
			}
		}

		return { finalList, courseData };
	} catch (error) {
		console.log('--Error--CheckModuleVersion--', error);
		return { finalList, courseData }; // Safe fallback
	}
};

const checkAddAnyNewModule = async function (finalList, courseData, DiwoAssignmentId) {
	try {
		for (let module of courseData) {
			let flag = true;
			for (let _module of finalList) {
				if (_module.WorkbookId == module.WorkbookId) {
					flag = false;
					break;
				}
			}
			if (flag) {
				let canChange = true;
				//For First Position
				if (module.ModuleIndex == 0) {
					for (let module of finalList) {
						if (module?.isPublish == true) {
							canChange = false;
						}
					}
				} else if (module.ModuleIndex >= finalList.length) {
					//For last Position
					if (finalList[finalList.length - 1]?.isPublish == true) {
						canChange = false;
					}
				} else {
					let previousModule = true;
					let nextModule = true;

					if (finalList[module.ModuleIndex - 1]?.isPublish == true) {
						previousModule = false;
					}
					if (finalList[module.ModuleIndex]?.isPublish == true) {
						nextModule = false;
					}
					if (!previousModule && !nextModule) {
						canChange = false;
					}
				}
				if (canChange) {
					finalList.splice(module.ModuleIndex, 0, module);
				}

				finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
			}
		}
		return { finalList, courseData }; // Safe fallback
	} catch (error) {
		console.log('--Error---', error);
		return { finalList, courseData }; // Safe fallback
	}
};

const checkAnyDeleteModule = async function (finalList, courseData, DiwoAssignmentId) {
	try {
		finalList = finalList.filter((data, index) => {
			const exists = courseData.some((obj) => obj.WorkbookId == data.WorkbookId);

			if (!exists) {
				//Check for first position
				//Chek or Last Postions
				//Check for middle Position
				if (index == 0) {
					if (data.isPublish) {
						return data;
					}
				} else if (index == finalList.length - 1) {
					if (data.isPublish || finalList[finalList.length - 2].isPublish) {
						return data;
					}
				} else {
					if (data.isPublish) {
						return data;
					}
				}
			} else {
				return data;
			}
		});
		finalList = await correctModuleIndex(finalList, DiwoAssignmentId);
		return { finalList, courseData }; // Safe fallback
	} catch (error) {
		console.log('--Error---', error);
		return { finalList, courseData }; // Safe fallback
	}
};

const correctModuleIndex = async function (finalList, DiwoAssignmentId) {
	try {
		let index = 0;
		finalList = finalList.map((data) => {
			data.ModuleIndex = index;
			index++;
			if (data?.isCertificationModule == true || data?.isAssignmentCertification == true) {
				data.isAssignmentCertification = true;
				data.isCertificationModule = true;
			} else {
				data.isAssignmentCertification = false;
				data.isCertificationModule = false;
			}

			if (data?.DiwoAssignmentId == undefined) {
				data.DiwoAssignmentId = DiwoAssignmentId;
				data.ModuleStartDate = null;
				data.ModuleEndDate = null;
				data.CourseName;
				data.ModuleDepedencyIndex = null;
				data.ModuleOperation = null;
				data.isPublish = false;
				delete data.createdAt;
				delete data.updatedAt;
				delete data.id;
			}
			return data;
		});
		return finalList;
	} catch (error) {
		return finalList; // Safe fallback
	}
};
