const {
	Market,
	Country,
	Op,
	Currency,
	User,
	sequelize,
	Role,
	Pathway,
	Course,
	Course_workbook_mapping,
	PathwayCourseMapping,
	Workbook,
	DiwoModule,
	DiwoAsset,
	DiwoAssignment,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
const { getAllSubChildClientIds } = require('../services/client.service');
const { createNotificationforDiwo, getAllDiwoUserIdsForNotification } = require('../services/notification.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');
// Create Diwo Pathway
const createDiwoPathway = async function (req, res) {
	try {
		const pathwaysDataSchema = Joi.object({
			id: Joi.number().integer().positive().allow(null),
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			subtitle: Joi.string().allow(null),
			description: Joi.string().trim().max(1000).allow(null).allow(''),
			l_outcomes: Joi.string().allow(null).allow(''),
			avatar: Joi.string().required(),
			avatar_file_name: Joi.string().required(),
			haveCertification: Joi.boolean().optional(),
			status: Joi.string().valid('Draft', 'Published').required(),
			customFields: Joi.object().allow(null, {}),
		});

		const pathwayCourseModuleSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			CourseId: Joi.number().integer().positive().required(),
			CourseIndex: Joi.number().integer().min(0).required(),
			CourseName: Joi.string().required(),
			isPartCourse: Joi.boolean().allow(null).optional(),
			WorkbookId: Joi.number().integer().positive().required(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			ModuleDepedencyIndex: Joi.array().items(Joi.any()).optional(),
			Dependency: Joi.boolean().optional(),
			ModuleOperation: Joi.any().allow(null),
			Added: Joi.boolean().optional(),
			isOpen: Joi.boolean().optional(),
			isDepedencyError: Joi.boolean().optional(),
			isDepedencyOperationError: Joi.boolean().optional(),
			ModuleAsset: Joi.string().required(),
			ModulePublishDate: Joi.date().required(),
			isCertificationModule: Joi.boolean().required(),
			moduleDependecyName: Joi.string().allow('').allow(null),
			haveCertificate: Joi.boolean().optional(),
			isShowCertifiedDropDown: Joi.boolean().optional(),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			CourseVersion: Joi.number().integer().optional().allow(null), // made optional
			CurrentCourseVersion: Joi.number().integer().optional().allow(null), // made optional
		});

		const pathwayCertificationSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			WorkbookId: Joi.number().integer().optional().allow(null),
			CourseId: Joi.number().integer().positive().optional().allow(null),
			CourseIndex: Joi.any().valid(null),
			CourseName: Joi.any().valid(null),
			CourseVersion: Joi.any().valid(null),
			isPartCourse: Joi.boolean().allow(null).optional(),
			ModuleDepedencyIndex: Joi.array().items(Joi.any()).optional(),
			Dependency: Joi.boolean(),
			ModuleOperation: Joi.any().optional(),
			Added: Joi.boolean().optional(),
			isOpen: Joi.boolean().optional(),
			isDepedencyError: Joi.boolean().optional(),
			isDepedencyOperationError: Joi.boolean().optional(),
			ModuleAsset: Joi.string().allow(null),
			isCertificationModule: Joi.boolean().optional(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			isOpen: Joi.boolean().optional(),
			ModuleTypeId: Joi.number().integer().optional().allow(null),
			ModulePublishDate: Joi.date().optional().allow(null),
			isCertificationModule: Joi.boolean().optional().allow(null),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			BaseWorkbookId: Joi.number().integer().optional().allow(null),
			version: Joi.number().integer().optional().allow(null),
		});

		const schema = Joi.object({
			pathwaysData: pathwaysDataSchema.required(),
			pathwayCourseModuleData: Joi.array().items(pathwayCourseModuleSchema).min(1).required(),
			pathwayCertificationDetails: Joi.array().items(pathwayCertificationSchema).optional(),
		});

		const { pathwaysData, pathwayCourseModuleData, pathwayCertificationDetails } = req.body;

		const { error } = schema.validate({ pathwaysData, pathwayCourseModuleData, pathwayCertificationDetails });

		if (error) {
			return res.status(400).json({ error: error.details.map((detail) => detail.message) });
		}

		let clientId = req.user.ClientId;
		let userId = req.user.id;

		// let pathwaysData = req.body.pathwaysData;
		// let pathwayCourseModuleData = req.body.pathwayCourseModuleData;
		// let pathwayCertificationDetails = req.body.pathwayCertificationDetails;

		pathwaysData.ClientId = clientId;
		pathwaysData.UserId = userId;
		pathwaysData.version = 1;
		if (pathwayCourseModuleData && pathwayCourseModuleData.length > 0) {
			pathwaysData.totalModules = pathwayCourseModuleData.length;
			pathwaysData.totalCourses = new Set(pathwayCourseModuleData.map((item) => item.CourseId)).size;

			let uniqueCourseIds = [...new Set(pathwayCourseModuleData.map((item) => item.CourseId))];

			if (pathwayCourseModuleData && pathwayCourseModuleData.length > 0) {
				// let uniqueCourseIds = [...new Set(pathwayCourseModuleData.map((item) => item.CourseId))];

				if (
					pathwayCertificationDetails &&
					pathwayCertificationDetails.length > 0
					// !uniqueCourseIds.includes(pathwayCertificationDetails.WorkbookId)
				) {
					pathwaysData.totalModules++;
				}
			}

			if (uniqueCourseIds && uniqueCourseIds.length > 0) {
				[err, courseData] = await to(
					Course.findAll({
						where: {
							id: uniqueCourseIds,
						},
						attributes: ['e_duration'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// console.log('-courseData-', courseData);

				if (courseData && courseData.length > 0) {
					let total_eduration = 0;
					for (let course of courseData) {
						let course_ = course.convertToJSON();
						total_eduration = total_eduration + course_.e_duration;
					}
					pathwaysData.e_duration = total_eduration;
				}
			}
		}

		[err, createPathway] = await to(Pathway.create(pathwaysData));
		if (err) return ResponseError(res, err, 500, true);

		for (let pathway of pathwayCourseModuleData) {
			let payload = {
				PathwayId: createPathway.id,
				CourseId: pathway.CourseId,
				CourseIndex: pathway.CourseIndex,
				CourseName: pathway.CourseName,
				isPartCourse: pathway.isPartCourse,
				Dependency: pathway.Dependency,
				ModuleDepedencyIndex: pathway.ModuleDepedencyIndex ? pathway.ModuleDepedencyIndex.toString() : null,
				ModuleIndex: pathway.ModuleIndex,
				ModuleName: pathway.ModuleName,
				ModuleOperation: pathway.ModuleOperation,
				ModuleTypeName: pathway.ModuleTypeName,
				DiwoModuleId: pathway.DiwoModuleId,
				WorkbookId: pathway.WorkbookId,
				CourseVersion: pathway.CourseVersion,
				isShowCertifiedDropDown: pathway.isShowCertifiedDropDown,
			};

			[err, pathway_course_mapping] = await to(PathwayCourseMapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
		}

		//Check If Certification Module is Selected Then Add it into PathwayCourseMapping Table
		if (pathwayCertificationDetails?.length > 0) {
			for (let pathway of pathwayCertificationDetails) {
				let payload = {
					PathwayId: createPathway.id,
					// CourseId: pathway.CourseId,
					// CourseIndex: pathway.CourseIndex,
					// CourseName: pathway.CourseName,
					// isPartCourse: pathway.isPartCourse,
					// Dependency: pathway.Dependency,
					// ModuleDepedencyIndex: pathway.ModuleDepedencyIndex ? pathway.ModuleDepedencyIndex.toString() : null,
					ModuleIndex: pathwayCourseModuleData.length,
					ModuleName: pathway.ModuleName,
					// ModuleOperation: pathway.ModuleOperation,
					ModuleTypeName: pathway.ModuleTypeName,
					DiwoModuleId: pathway.DiwoModuleId,
					WorkbookId: pathway.WorkbookId,
					isCertificationModule: true,
				};

				[err, pathway_course_mapping] = await to(PathwayCourseMapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

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

		let notifcationMessage = MESSAGE.PATHWAY_CREATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{pathway_name}}', pathwaysData.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.PATHWAY_CREATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{pathway_name}}', pathwaysData.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Pathway`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					PathwayId: createPathway.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: createPathway,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDiwoPathway = createDiwoPathway;

const updateDiwoPathway = async function (req, res) {
	try {
		const pathwaysDataSchema = Joi.object({
			id: Joi.number().integer().positive().required(),
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			subtitle: Joi.string().allow(null),
			description: Joi.string().trim().max(1000).allow(null).allow(''),
			l_outcomes: Joi.string().allow(null).allow(''),
			avatar: Joi.string().required(),
			avatar_file_name: Joi.string().required(),
			haveCertification: Joi.boolean().optional(),
			status: Joi.string().valid('Draft', 'Published').required(),
			customFields: Joi.object().allow(null, {}),
		});

		const pathwayCourseModuleSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			CourseId: Joi.number().integer().positive().required(),
			CourseIndex: Joi.number().integer().min(0).required(),
			CourseName: Joi.string().required(),
			isPartCourse: Joi.boolean().allow(null).optional(),
			WorkbookId: Joi.number().integer().positive().required(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().positive().required(),
			ModuleDepedencyIndex: Joi.array().items(Joi.any()).optional(),
			Dependency: Joi.boolean().optional(),
			ModuleOperation: Joi.any().allow(null),
			Added: Joi.boolean().optional(),
			isOpen: Joi.boolean().optional(),
			isDepedencyError: Joi.boolean().optional(),
			isDepedencyOperationError: Joi.boolean().optional(),
			ModuleAsset: Joi.string().required(),
			ModulePublishDate: Joi.date().required(),
			isCertificationModule: Joi.boolean().required(),
			moduleDependecyName: Joi.string().allow('').allow(null),
			haveCertificate: Joi.boolean().optional(),
			isShowCertifiedDropDown: Joi.boolean().optional(),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			CourseVersion: Joi.number().integer().optional().allow(null), // made optional
			CurrentCourseVersion: Joi.number().integer().optional().allow(null), // made optional
		});

		const pathwayCertificationSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			WorkbookId: Joi.number().integer().optional().allow(null),
			CourseId: Joi.number().integer().positive().optional().allow(null),
			CourseIndex: Joi.any().valid(null),
			CourseName: Joi.any().valid(null),
			CourseVersion: Joi.any().valid(null),
			isPartCourse: Joi.boolean().allow(null).optional(),
			ModuleDepedencyIndex: Joi.array().items(Joi.any()).optional(),
			Dependency: Joi.boolean(),
			ModuleOperation: Joi.any().optional(),
			Added: Joi.boolean().optional(),
			isOpen: Joi.boolean().optional(),
			isDepedencyError: Joi.boolean().optional(),
			isDepedencyOperationError: Joi.boolean().optional(),
			ModuleAsset: Joi.string().allow(null),
			isCertificationModule: Joi.boolean().optional(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			isOpen: Joi.boolean().optional(),
			ModuleTypeId: Joi.number().integer().optional().allow(null),
			ModulePublishDate: Joi.date().optional().allow(null),
			isCertificationModule: Joi.boolean().optional().allow(null),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			BaseWorkbookId: Joi.number().integer().optional().allow(null),
			version: Joi.number().integer().optional().allow(null),
		});

		const schema = Joi.object({
			pathwaysData: pathwaysDataSchema.required(),
			pathwayCourseModuleData: Joi.array().items(pathwayCourseModuleSchema).min(1).required(),
			pathwayCertificationDetails: Joi.array().items(pathwayCertificationSchema).optional(),
		});

		const { pathwaysData, pathwayCourseModuleData, pathwayCertificationDetails } = req.body;

		const { error } = schema.validate({ pathwaysData, pathwayCourseModuleData, pathwayCertificationDetails });

		if (error) {
			return res.status(400).json({ error: error.details.map((detail) => detail.message) });
		}

		let clientId = req.user.ClientId;
		let userId = req.user.id;

		// let pathwaysData = req.body.pathwaysData;
		// let pathwayCourseModuleData = req.body.pathwayCourseModuleData;
		// let pathwayCertificationDetails = req.body.pathwayCertificationDetails;
		let pathwayId = pathwaysData.id;
		delete pathwaysData.id;
		pathwaysData.ClientId = clientId;
		pathwaysData.UserId = userId;

		if (pathwayCourseModuleData && pathwayCourseModuleData.length > 0) {
			pathwaysData.totalModules = pathwayCourseModuleData.length;
			pathwaysData.totalCourses = new Set(pathwayCourseModuleData.map((item) => item.CourseId)).size;

			let uniqueCourseIds = [...new Set(pathwayCourseModuleData.map((item) => item.CourseId))];

			if (pathwayCourseModuleData && pathwayCourseModuleData.length > 0) {
				// let uniqueCourseIds = [...new Set(pathwayCourseModuleData.map((item) => item.CourseId))];

				if (
					pathwayCertificationDetails &&
					pathwayCertificationDetails.length > 0
					// !uniqueCourseIds.includes(pathwayCertificationDetails.WorkbookId)
				) {
					pathwaysData.totalModules++;
				}
			}

			// console.log('uniqueCourseIds', uniqueCourseIds);
			if (uniqueCourseIds && uniqueCourseIds.length > 0) {
				[err, courseData] = await to(
					Course.findAll({
						where: {
							id: uniqueCourseIds,
						},
						attributes: ['e_duration'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// console.log('-courseData-', courseData);

				if (courseData && courseData.length > 0) {
					let total_eduration = 0;
					for (let course of courseData) {
						let course_ = course.convertToJSON();
						total_eduration = total_eduration + course_.e_duration;
					}
					pathwaysData.e_duration = total_eduration;
				}
			}
		}

		//Get Pathway version and Status before updating
		[err, pathwayDetails] = await to(
			Pathway.findOne({
				where: {
					id: pathwayId,
				},
				attributes: ['id', 'version', 'status'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (pathwayDetails.status != 'Draft') {
			pathwaysData.version = pathwayDetails.version + 1;
		}

		// return;
		[err, updatePathway] = await to(
			Pathway.update(pathwaysData, {
				where: {
					id: pathwayId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deletePathwayCourseMapping] = await to(
			PathwayCourseMapping.destroy({
				where: {
					PathwayId: pathwayId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let pathway of pathwayCourseModuleData) {
			let payload = {
				PathwayId: pathwayId,
				CourseId: pathway.CourseId,
				CourseIndex: pathway.CourseIndex,
				CourseName: pathway.CourseName,
				isPartCourse: pathway.isPartCourse,
				Dependency: pathway.Dependency,
				ModuleDepedencyIndex: pathway.ModuleDepedencyIndex ? pathway.ModuleDepedencyIndex.toString() : null,
				ModuleIndex: pathway.ModuleIndex,
				ModuleName: pathway.ModuleName,
				ModuleOperation: pathway.ModuleOperation,
				ModuleTypeName: pathway.ModuleTypeName,
				DiwoModuleId: pathway.DiwoModuleId,
				WorkbookId: pathway.WorkbookId,
				CourseVersion: pathway.CourseVersion,
				isShowCertifiedDropDown: pathway.isShowCertifiedDropDown,
			};

			[err, pathway_course_mapping] = await to(PathwayCourseMapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
		}

		//Check If Certification Module is Selected Then Add it into PathwayCourseMapping Table
		if (pathwayCertificationDetails?.length > 0) {
			for (let pathway of pathwayCertificationDetails) {
				let payload = {
					PathwayId: pathwayId,
					// CourseId: pathway.CourseId,
					// CourseIndex: pathway.CourseIndex,
					// CourseName: pathway.CourseName,
					// isPartCourse: pathway.isPartCourse,
					// Dependency: pathway.Dependency,
					// ModuleDepedencyIndex: pathway.ModuleDepedencyIndex ? pathway.ModuleDepedencyIndex.toString() : null,
					ModuleIndex: pathwayCourseModuleData.length,
					ModuleName: pathway.ModuleName,
					// ModuleOperation: pathway.ModuleOperation,
					ModuleTypeName: pathway.ModuleTypeName,
					DiwoModuleId: pathway.DiwoModuleId,
					WorkbookId: pathway.WorkbookId,
					isCertificationModule: true,
				};

				[err, pathway_course_mapping] = await to(PathwayCourseMapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

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

		let notifcationMessage = MESSAGE.PATHWAY_UPDATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{pathway_name}}', pathwaysData.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.PATHWAY_UPDATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{pathway_name}}', pathwaysData.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Pathway`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					PathwayId: updatePathway.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: updatePathway,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDiwoPathway = updateDiwoPathway;

//get all diwo pathways for table
const getAllDiwoPathwayByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
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
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;

		let err, pathwaysData;
		let parentClientId = clientId;
		let finalPathwayList = [];
		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let offset = (page - 1) * limit;
		// let limit = req.query.limit;

		[err, pathwaysData] = await to(
			Pathway.findAndCountAll({
				where: {
					ClientId: allChildClientList,
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
						attributes: ['MarketId', 'local_user_id'],
					},
					{
						model: DiwoAssignment,
						attributes: ['id'],
					},
				],
				order: [['id', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let pathways of pathwaysData.rows) {
			let pathwaysDetail = pathways.convertToJSON();
			[err, localUser] = await to(
				dbInstance[pathways.User.Market.db_name].User_master.findOne({
					where: {
						id: pathways.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			pathwaysDetail.author = localUser.first + ' ' + localUser.last;

			if (pathwaysDetail.DiwoAssignments && pathwaysDetail.DiwoAssignments.length > 0) {
				pathwaysDetail.totalAssignment = pathwaysDetail.DiwoAssignments.length;
			} else {
				pathwaysDetail.totalAssignment = 0;
			}

			finalPathwayList.push(pathwaysDetail);
			delete pathwaysDetail.DiwoAssignments;
			delete pathwaysDetail.User;
		}

		[err, pathwaycount] = await to(
			Pathway.count({
				where: {
					ClientId: allChildClientList,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalPathwayList,
			count: pathwaycount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoPathwayByClientId = getAllDiwoPathwayByClientId;

//get  Diwo Pathways By Using Client Id
const getDiwoPathwayById = async function (req, res) {
	try {
		const schema = Joi.object({
			pathwayId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			pathwayId: parseInt(req.params.pathwayId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { pathwayId } = value;

		let err, pathwayData, pathwayCourseModuleData;
		// let pathwayId = req.params.pathwayId;

		[err, pathwayCourseModuleData] = await to(
			PathwayCourseMapping.findAll({
				where: {
					PathwayId: pathwayId,
				},
				include: [
					{
						model: Workbook,
						attributes: ['id', 'createdAt', 'haveCertificate'],
						include: [
							{
								model: DiwoAsset,
								where: {
									forBrief: false,
									WorksheetId: {
										[Op.eq]: null,
									},
									type: 'Image',
								},
								attributes: ['id', 'fileName', 'path'],
							},
						],
					},
				],
				order: [['ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, pathwayData] = await to(
			Pathway.findOne({
				where: {
					id: pathwayId,
				},
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: {
				pathwayData,
				pathwayCourseModuleData,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoPathwayById = getDiwoPathwayById;

const deletePathway = async function (req, res) {
	try {
		const schema = Joi.object({
			pathwayIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			pathwayIds: req.body,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { pathwayIds } = value;

		let err;
		// let pathwayIds = req.body;
		let userId = req.user.id;

		let payload = {
			status: 'Deleted',
			isDeleted: true,
		};

		if (req.body && req.body.length > 0) {
			[err, updatePathway] = await to(
				Pathway.update(payload, {
					where: {
						id: pathwayIds,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//For Notification
			[err, pathwayDetails] = await to(
				Pathway.findAll({
					where: {
						id: pathwayIds,
					},
					attributes: ['title'],
				})
			);

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

			for (let pathway of pathwayDetails) {
				let notifcationMessage = MESSAGE.PATHWAY_DELETE_NOTIFICATION;
				notifcationMessage = notifcationMessage.replace('{{pathway_name}}', pathway.title);
				notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
				let userIds = await getAllDiwoUserIdsForNotification(parseInt(req.params.clientId));
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.PATHWAY_DELETE_NOTIFICATION;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{pathway_name}}', pathway.title);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Delete Pathway`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						PathwayId: pathwayIds,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.PATHWAY_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deletePathway = deletePathway;

//get search pthways
const getAllSeachDiwoPathway = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
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
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
			selectedDate: req.body.selectedDate,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, selectedDate } = value;

		let parentClientId = clientId;
		let finalPathwayList = [];
		let allChildClientList = [];
		// let selectedDate = req.body.selectedDate;
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let whereCondition = [];

		let MarketDetails;
		let userDetailId = [];
		let dateCondition = [];

		let finalPathwayData;

		let searchKey = req.body.searchKey.split(' ');
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		dateCondition.push({
			updatedAt: {
				[Op.ne]: null,
			},
		});

		if (selectedDate.startDate != null && selectedDate.endDate != null) {
			dateCondition.push({
				updatedAt: {
					[Op.between]: [selectedDate.startDate, selectedDate.endDate],
				},
			});
		}

		//Search User By market
		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('title') > -1) {
			whereCondition.push({
				title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('author') > -1) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();
					if (searchKey.length > 1) {
						[err, localUser] = await to(
							dbInstance[marketUser.db_name].User_master.findAll({
								where: {
									[sequelize.Op.or]: {
										first: {
											[sequelize.Op.iLike]: searchKey[0] + '%',
										},
										last: {
											[sequelize.Op.iLike]: searchKey[1] + '%',
										},
									},
								},
							})
						);
					} else {
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
					}

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
							userDetailId.push(User.id);
						}
					}
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('totalmodules') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereCondition.push({
					totalModules: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('totalcourses') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereCondition.push({
					totalCourses: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('estimateduration') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereCondition.push({
					e_duration: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('pathwayId') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereCondition.push({
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('status') > -1) {
			whereCondition.push({
				status: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (userDetailId && userDetailId.length > 0) {
			whereCondition.push({
				UserId: userDetailId,
			});
		}

		let whereCondition_ = {
			[sequelize.Op.or]: whereCondition,
			ClientId: allChildClientList,
			[Op.and]: dateCondition,
		};

		[err, finalPathwayData] = await to(
			Pathway.findAndCountAll({
				where: whereCondition_,
				include: [
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
						attributes: ['MarketId', 'local_user_id'],
					},
					{
						model: DiwoAssignment,
						attributes: ['id'],
					},
				],
				attributes: ['id', 'title', 'totalCourses', 'totalModules', 'e_duration', 'createdAt', 'updatedAt', 'status'],
				order: [['id', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let pathway of finalPathwayData.rows) {
			let pathwayDetail = pathway.convertToJSON();
			[err, localUser] = await to(
				dbInstance[pathway.User.Market.db_name].User_master.findOne({
					where: {
						id: pathway.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			pathwayDetail.author = localUser.first + ' ' + localUser.last;
			finalPathwayList.push(pathwayDetail);

			delete pathwayDetail.User;
		}

		[err, pathwaycount] = await to(
			Pathway.count({
				where: whereCondition_,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalPathwayList,
			count: pathwaycount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSeachDiwoPathway = getAllSeachDiwoPathway;

//get all diwo courses for pathway
const getAllDiwoCoursesForPathways = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, coursesData;
		// let parentClientId = req.params.clientId;
		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		[err, coursesData] = await to(
			Course.findAll({
				where: {
					ClientId: allChildClientList,
					status: 'Published',
					isDeleted: false,
				},
				attributes: ['id', 'title', 'e_duration', 'version'],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: coursesData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoCoursesForPathways = getAllDiwoCoursesForPathways;

//get all diwo modules for pathway by courseId
const getAllDiwoModuleForPathwaysByCourseId = async function (req, res) {
	try {
		const schema = Joi.object({
			courseId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			courseId: parseInt(req.params.courseId),
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { courseId } = value;

		let err, moduleData;
		// let courseId = req.params.courseId;
		let finalModuleList = [];

		[err, moduleData] = await to(
			Course_workbook_mapping.findAll({
				where: {
					CourseId: courseId,
					isCertificationModule: false,
				},
				include: [
					{
						model: Course,
						attributes: ['id', 'title'],
					},
					{
						model: Workbook,
						where: {
							status: 'Published',
							isDeleted: false,
						},
						attributes: ['id', 'createdAt', 'haveCertificate'],
						include: [
							{
								model: DiwoAsset,
								where: {
									forBrief: false,
									WorksheetId: {
										[Op.eq]: null,
									},
									type: 'Image',
								},
								attributes: ['id', 'fileName', 'path'],
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

		for (let module_ of moduleData) {
			let moduleDetail = module_.convertToJSON();
			moduleDetail.CourseName = moduleDetail?.Course?.title;
			moduleDetail.ModuleTypeName = moduleDetail?.DiwoModule?.type;
			moduleDetail.DiwoModuleId = moduleDetail?.DiwoModule?.id;
			finalModuleList.push(moduleDetail);
			delete moduleDetail.Course;
			delete moduleDetail.DiwoModule;
		}

		return ResponseSuccess(res, {
			data: finalModuleList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoModuleForPathwaysByCourseId = getAllDiwoModuleForPathwaysByCourseId;

// Upload Avatar
const UploadDiwoPathwaysThumbnails = async function (req, res) {
	try {
		if (req.body.files) {
			req.files = req.body.files;
			delete req.body.files;
		}
		return ResponseSuccess(res, {
			data: req.files,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.UploadDiwoPathwaysThumbnails = UploadDiwoPathwaysThumbnails;
