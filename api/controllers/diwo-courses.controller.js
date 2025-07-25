const {
	Market,
	Country,
	Op,
	Currency,
	User,
	sequelize,
	Role,
	Course,
	Course_workbook_mapping,
	Workbook,
	DiwoModule,
	DiwoAssignment,
	PathwayCourseMapping,
	Pathway,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
const { getUpperLevelAccountDetailsUptoClientAccount, getAllSubChildClientIds } = require('../services/client.service');
const { createNotificationforDiwo, getAllDiwoUserIdsForNotification } = require('../services/notification.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

// Create Diwo Course
const createDiwoCourse = async function (req, res) {
	try {
		const courseDataSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			subtitle: Joi.string().allow(null),
			description: Joi.string().trim().max(1000).allow(null).allow(''),
			l_outcomes: Joi.string().allow(null).allow(''),
			avatar: Joi.string().required(),
			avatar_file_name: Joi.string().required(),
			haveCertification: Joi.boolean().required(),
			status: Joi.string().valid('Draft', 'Published').required(),
			customFields: Joi.object().allow(null, {}),
			version: Joi.any().allow(null),
		});

		const courseModuleSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			ModuleTypeId: Joi.number().integer().required(),
			ModuleId: Joi.number().integer().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			ModuleName: Joi.string().required(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleLastUpdated: Joi.date().required(),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			default: Joi.any().allow(null),
			BaseWorkbookId: Joi.any().allow(null),
			version: Joi.any().allow(null),
		});

		const courseCertificationSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			WorkbookId: Joi.number().integer().optional().allow(null),
			ModuleId: Joi.number().integer().required(),
			ModuleIndex: Joi.any().allow(null),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			isOpen: Joi.boolean().optional(),
			ModuleTypeId: Joi.number().integer().optional().allow(null),
			ModulePublishDate: Joi.date().optional().allow(null),
			isCertificationModule: Joi.boolean().optional().allow(null),
			ModuleLastUpdated: Joi.date().optional().allow(null),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			default: Joi.any().allow(null),
			BaseWorkbookId: Joi.number().integer().positive().optional().allow(null),
			version: Joi.any().allow(null),
		});

		const schema = Joi.object({
			courseData: courseDataSchema.required(),
			courseModuleData: Joi.array().items(courseModuleSchema).min(1).required(),
			courseCertificationDetails: Joi.array().items(courseCertificationSchema).optional(),
		});

		const { courseData, courseModuleData, courseCertificationDetails } = req.body;

		const { error } = schema.validate({ courseData, courseModuleData, courseCertificationDetails });

		if (error) {
			return res.status(400).json({ error: error.details.map((detail) => detail.message) });
		}

		let clientId = req.user.ClientId;
		let userId = req.user.id;

		// let courseData = req.body.courseData;
		// let courseModuleData = req.body.courseModuleData;
		// let courseCertificationDetails = req.body.courseCertificationDetails;

		courseData.ClientId = clientId;
		courseData.UserId = userId;
		courseData.totalModules = courseModuleData ? courseModuleData.length : 0;
		courseData.version = 1;
		if (courseModuleData && courseModuleData.length > 0) {
			let uniqueWorkbookIds = [...new Set(courseModuleData.map((item) => item.ModuleId))];

			// console.log('-uniqueWorkbookIds-', uniqueWorkbookIds);

			if (
				courseCertificationDetails &&
				courseCertificationDetails.length > 0
				// !uniqueWorkbookIds.includes(courseCertificationDetails.ModuleId)
			) {
				courseData.totalModules++;
			}

			if (uniqueWorkbookIds && uniqueWorkbookIds.length > 0) {
				[err, workbookData] = await to(
					Workbook.findAll({
						where: {
							id: uniqueWorkbookIds,
						},
						attributes: ['e_duration'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (workbookData && workbookData.length > 0) {
					let total_eduration = 0;
					for (let course of workbookData) {
						let course_ = course.convertToJSON();
						total_eduration = total_eduration + course_.e_duration;
					}
					courseData.e_duration = total_eduration;
				}
			}
		}

		[err, createCourse] = await to(Course.create(courseData));
		if (err) return ResponseError(res, err, 500, true);

		for (let module_ of courseModuleData) {
			let payload = {
				CourseId: createCourse.id,
				WorkbookId: module_.ModuleId,
				DiwoModuleId: module_.ModuleTypeId,
				ModuleName: module_.ModuleName,
				ModuleTypeName: module_.ModuleTypeName,
				ModuleIndex: module_.ModuleIndex,
				ModuleLastUpdated: module_.ModuleLastUpdated,
			};

			[err, course_module_map] = await to(Course_workbook_mapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
		}

		for (let module_ of courseCertificationDetails) {
			let payload = {
				CourseId: createCourse.id,
				WorkbookId: module_.ModuleId,
				DiwoModuleId: module_.DiwoModuleId,
				ModuleName: module_.ModuleName,
				ModuleTypeName: module_.ModuleTypeName,
				ModuleIndex: courseModuleData.length,
				ModuleLastUpdated: module_.ModuleLastUpdated,
				isCertificationModule: true,
			};

			[err, course_module_map] = await to(Course_workbook_mapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
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

		let notifcationMessage = MESSAGE.COURSE_CREATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{course_name}}', courseData.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.COURSE_CREATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{course_name}}', courseData.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Course`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CourseId: createCourse.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: createCourse,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDiwoCourse = createDiwoCourse;

const updateDiwoCourse = async function (req, res) {
	try {
		const courseDataSchema = Joi.object({
			id: Joi.number().integer().positive().required(),
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			subtitle: Joi.string().allow(null),
			description: Joi.string().trim().max(1000).allow(null).allow(''),
			l_outcomes: Joi.string().allow(null).allow(''),
			avatar: Joi.string().required(),
			avatar_file_name: Joi.string().required(),
			haveCertification: Joi.boolean().required(),
			status: Joi.string().valid('Draft', 'Published').required(),
			customFields: Joi.object().allow(null, {}),
			version: Joi.any().allow(null),
		});

		const courseModuleSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			ModuleTypeId: Joi.number().integer().required(),
			ModuleId: Joi.number().integer().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			ModuleName: Joi.string().required(),
			ModuleIndex: Joi.number().integer().min(0).required(),
			ModuleLastUpdated: Joi.date().required(),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			default: Joi.any().allow(null),
			BaseWorkbookId: Joi.any().allow(null),
			version: Joi.any().allow(null),
		});

		const courseCertificationSchema = Joi.object({
			id: Joi.number().integer().positive().optional().allow(null),
			WorkbookId: Joi.number().integer().optional().allow(null),
			ModuleId: Joi.number().required(),
			ModuleIndex: Joi.any().allow(null),
			ModuleName: Joi.string().required(),
			ModuleTypeName: Joi.string().required(),
			DiwoModuleId: Joi.number().integer().optional().allow(null), // made optional
			isOpen: Joi.boolean().optional(),
			ModuleTypeId: Joi.number().integer().optional().allow(null),
			ModulePublishDate: Joi.date().optional().allow(null),
			isCertificationModule: Joi.boolean().optional().allow(null),
			ModuleLastUpdated: Joi.date().optional().allow(null),
			createdAt: Joi.date().optional().allow(null),
			updatedAt: Joi.date().optional().allow(null),
			default: Joi.any().allow(null),
			BaseWorkbookId: Joi.number().integer().positive().optional().allow(null),
			version: Joi.any().allow(null),
		});

		const schema = Joi.object({
			courseData: courseDataSchema.required(),
			courseModuleData: Joi.array().items(courseModuleSchema).min(1).required(),
			courseCertificationDetails: Joi.array().items(courseCertificationSchema).optional(),
		});

		const { courseData, courseModuleData, courseCertificationDetails } = req.body;

		const { error } = schema.validate({ courseData, courseModuleData, courseCertificationDetails });

		if (error) {
			return res.status(400).json({ error: error.details.map((detail) => detail.message) });
		}

		let clientId = req.user.ClientId;
		let userId = req.user.id;
		let updateCourse;
		let courseId;
		// let courseData = req.body.courseData;
		courseId = courseData.id;
		// let courseModuleData = req.body.courseModuleData;
		// let courseCertificationDetails = req.body.courseCertificationDetails;
		delete courseData.id;
		courseData.ClientId = clientId;
		courseData.UserId = userId;
		courseData.totalModules = courseModuleData ? courseModuleData.length : 0;

		//Get Course version and Status before updating
		[err, courseDetails] = await to(
			Course.findOne({
				where: {
					id: courseId,
				},
				attributes: ['id', 'version', 'status'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (courseDetails.status != 'Draft') {
			courseData.version = courseDetails.version + 1;
		}
		// if (courseData && courseData.l_outcomes) {
		// 	courseData.l_outcomes = courseData.l_outcomes.split(',');
		// }

		if (courseModuleData && courseModuleData.length > 0) {
			let uniqueWorkbookIds = [...new Set(courseModuleData.map((item) => item.ModuleId))];

			if (courseCertificationDetails && courseCertificationDetails.length > 0) {
				courseData.totalModules++;
			}

			if (uniqueWorkbookIds && uniqueWorkbookIds.length > 0) {
				[err, workbookData] = await to(
					Workbook.findAll({
						where: {
							id: uniqueWorkbookIds,
						},
						attributes: ['e_duration'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (workbookData && workbookData.length > 0) {
					let total_eduration = 0;
					for (let course of workbookData) {
						let course_ = course.convertToJSON();
						total_eduration = total_eduration + course_.e_duration;
					}
					courseData.e_duration = total_eduration;
				}
			}
		}

		[err, updateCourse] = await to(
			Course.update(courseData, {
				where: {
					id: courseId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteCourseModuleMap] = await to(
			Course_workbook_mapping.destroy({
				where: {
					CourseId: courseId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let module_ of courseModuleData) {
			let payload = {
				CourseId: courseId,
				WorkbookId: module_.ModuleId,
				DiwoModuleId: module_.ModuleTypeId,
				ModuleName: module_.ModuleName,
				ModuleTypeName: module_.ModuleTypeName,
				ModuleIndex: module_.ModuleIndex,
				ModuleLastUpdated: module_.ModuleLastUpdated,
			};

			// if (module_ && module_.id) {
			// [err, course_module_map] = await to(
			// 	Course_workbook_mapping.update(payload, {
			// 		where: {
			// 			id: module_.id,
			// 		},
			// 	})
			// );
			// if (err) return ResponseError(res, err, 500, true);
			// } else {
			[err, course_module_map] = await to(Course_workbook_mapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
			// }
		}

		for (let module_ of courseCertificationDetails) {
			let payload = {
				CourseId: courseId,
				WorkbookId: module_.ModuleId,
				DiwoModuleId: module_.DiwoModuleId,
				ModuleName: module_.ModuleName,
				ModuleTypeName: module_.ModuleTypeName,
				ModuleIndex: courseModuleData.length,
				ModuleLastUpdated: module_.ModuleLastUpdated,
				isCertificationModule: true,
			};

			[err, course_module_map] = await to(Course_workbook_mapping.create(payload));
			if (err) return ResponseError(res, err, 500, true);
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

		let notifcationMessage = MESSAGE.COURSE_UPDATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{course_name}}', courseData.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.COURSE_UPDATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{course_name}}', courseData.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Course`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CourseId: updateCourse.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: updateCourse,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDiwoCourse = updateDiwoCourse;

//get all diwo courses
const getAllDiwoCoursesByClientId = async function (req, res) {
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
		const type = req.user.type;

		let err, coursesData;
		let parentClientId = clientId;
		let finalCoursesList = [];
		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let offset = (page - 1) * limit;
		// let limit = req.query.limit;

		[err, coursesData] = await to(
			Course.findAndCountAll({
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
					{
						model: Pathway,
						through: 'PathwayCourseMapping',
						attributes: ['id'],
					},
				],
				order: [['id', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let course of coursesData.rows) {
			let courseDetail = course.convertToJSON();
			[err, localUser] = await to(
				dbInstance[course.User.Market.db_name].User_master.findOne({
					where: {
						id: course.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			courseDetail.author = localUser.first + ' ' + localUser.last;

			if (courseDetail.DiwoAssignments && courseDetail.DiwoAssignments.length > 0) {
				courseDetail.totalAssignment = courseDetail.DiwoAssignments.length;
			} else {
				courseDetail.totalAssignment = 0;
			}

			if (courseDetail.Pathways && courseDetail.Pathways[0]) {
				courseDetail.isAddedInPathway = true;
			} else {
				courseDetail.isAddedInPathway = false;
			}

			finalCoursesList.push(courseDetail);

			delete courseDetail.Pathways;
			delete courseDetail.DiwoAssignments;
			delete courseDetail.User;
		}

		[err, coursecount] = await to(
			Course.count({
				where: {
					ClientId: allChildClientList,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalCoursesList,
			count: coursecount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoCoursesByClientId = getAllDiwoCoursesByClientId;

//get  Diwo Course By Using Id
const getDiwoCourseById = async function (req, res) {
	try {
		const schema = Joi.object({
			courseId: Joi.number().integer().min(1).positive().required(), // Must be > 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			courseId: parseInt(req.params.courseId),
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { courseId } = value;

		let err, courseData, courseModuleData;
		// let courseId = req.params.courseId;

		[err, courseModuleData] = await to(
			Course_workbook_mapping.findAll({
				where: {
					CourseId: courseId,
				},
				include: [{ model: Workbook, attributes: ['id', 'version', 'default', 'BaseWorkbookId'] }],
				order: [['ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, courseData] = await to(
			Course.findOne({
				where: {
					id: courseId,
				},
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: {
				courseData,
				courseModuleData,
			},
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoCourseById = getDiwoCourseById;

const deleteCourses = async function (req, res) {
	try {
		const schema = Joi.object({
			courseIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			courseIds: req.body,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { courseIds } = value;

		let err;
		// let courseIds = req.body;
		let userId = req.user.id;

		let payload = {
			status: 'Deleted',
			isDeleted: true,
		};

		if (req.body && req.body.length > 0) {
			[err, updateCourse] = await to(
				Course.update(payload, {
					where: {
						id: courseIds,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//For Notification
			[err, courseDetails] = await to(
				Course.findAll({
					where: {
						id: courseIds,
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

			for (let course of courseDetails) {
				let notifcationMessage = MESSAGE.COURSE_DELETE_NOTIFICATION;
				notifcationMessage = notifcationMessage.replace('{{course_name}}', course.title);
				notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
				let userIds = await getAllDiwoUserIdsForNotification(parseInt(req.params.clientId));
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.COURSE_DELETE_NOTIFICATION;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{course_name}}', course.title);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Delete Course`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						CourseId: courseIds,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.COURSE_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteCourses = deleteCourses;

// Upload Avatar
const uploadCourseAvatar = async function (req, res) {
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
module.exports.uploadCourseAvatar = uploadCourseAvatar;

const getAllSeachDiwoCourse = async function (req, res) {
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
		const type = req.user.type;

		let parentClientId = clientId;
		let finalCoursesList = [];
		let allChildClientList = [];

		// let selectedDate = req.body.selectedDate;

		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let whereCondition = [];

		let MarketDetails;
		let userDetailId = [];
		let dateCondition = [];

		let finalCoursesData;

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
			if (filterColumn.indexOf('courseId') > -1) {
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

		[err, finalCoursesData] = await to(
			Course.findAndCountAll({
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
					{
						model: Pathway,
						through: 'PathwayCourseMapping',
						attributes: ['id'],
					},
				],
				order: [['id', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		for (let course of finalCoursesData.rows) {
			let courseDetail = course.convertToJSON();
			[err, localUser] = await to(
				dbInstance[course.User.Market.db_name].User_master.findOne({
					where: {
						id: course.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			courseDetail.author = localUser.first + ' ' + localUser.last;

			if (courseDetail.DiwoAssignments && courseDetail.DiwoAssignments.length > 0) {
				courseDetail.totalAssignment = courseDetail.DiwoAssignments.length;
			} else {
				courseDetail.totalAssignment = 0;
			}

			if (courseDetail.Pathways && courseDetail.Pathways[0]) {
				courseDetail.isAddedInPathway = true;
			} else {
				courseDetail.isAddedInPathway = false;
			}

			finalCoursesList.push(courseDetail);

			delete courseDetail.Pathways;
			delete courseDetail.DiwoAssignments;
			delete courseDetail.User;
		}

		[err, coursecount] = await to(
			Course.count({
				where: whereCondition_,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalCoursesList,
			count: coursecount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSeachDiwoCourse = getAllSeachDiwoCourse;
