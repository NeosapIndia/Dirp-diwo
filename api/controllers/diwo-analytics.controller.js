const {
	Op,
	sequelize,
	Campaign,
	User,
	Role,
	User_group,
	User_role_client_mapping,
	User_group_mapping,
	Client,
	Client_job_role,
	Market,
	Worksheet,
	Workbook,
	Option,
	Course,
	Question,
	DiwoAsset,
	Course_workbook_mapping,
	WorkbookUserGroupMapping,
	WorkbookTrainerMapping,
	SessionUser,
	SessionAsset,
	Session,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	DiwoModule,
	Badge,
	Pathway,
	Country,
	DiwoAssignment,
	LearnerAchievement,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const {
	getValidationForAssignWorkbook,
	getRemoveWorkbookByCount,
	getAddOneWorkbookInLicense,
} = require('../services/license.service');

const { createNotificationforDiwo, getAllDiwoUserIdsForNotification } = require('../services/notification.service');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const targetBaseUrl = CONFIG.web_host + '/#/';
const shortid = require('shortid');
var fs = require('fs');

const { getAllSubClientAndBranchAccountLists, getAccountCustomField } = require('../services/client.service');
const { getAllSubBranchClientIds } = require('../controllers/analytics.controller');

const axios = require('axios');
const Sequelize = require('sequelize');

const getAllDiwoAnalyticsCountByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err;
		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		[err, allUserData] = await to(
			User_role_client_mapping.count({
				where: {
					ClientId: allSubChildClientIds,
					RoleId: {
						[Op.eq]: 1,
					},
					forDiwo: true,
				},
				include: [
					{
						model: User,
						where: {
							status: true,
							is_deleted: false,
							cStatus: 'Active',
							forDiwo: true,
						},
					},
					{
						model: Client,
						where: {
							DiwoAccess: true,
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allPathwayCount] = await to(
			Pathway.count({
				where: {
					ClientId: allSubChildClientIds,
					status: 'Published',
					isDeleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allCourseCount] = await to(
			Course.count({
				where: {
					ClientId: allSubChildClientIds,
					status: 'Published',
					isDeleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allWorkBookCount] = await to(
			Workbook.count({
				where: {
					ClientId: allSubChildClientIds,
					status: 'Published',
					isDeleted: false,
					default: true,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allSessioncount] = await to(
			Session.count({
				where: {
					ClientId: allSubChildClientIds,
					status: ['Live', 'Closed'],
					isDeleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, certifiedLearners] = await to(
			SessionUser.count({
				where: {
					ClientId: allSubChildClientIds,
					ModuleStatus: 'Certified',
					isDeleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, assignedWorkbookCount] = await to(
			SessionUser.count({
				where: {
					ClientId: allSubChildClientIds,
					status: 'Approved',
					isDeleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allCertificateCount] = await to(
			LearnerAchievement.count({
				where: {
					ClientId: allSubChildClientIds,
					isCertificate: true,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allBadgeCount] = await to(
			LearnerAchievement.count({
				where: {
					ClientId: allSubChildClientIds,
					isBadge: true,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			pathwayCount: 0,
			courseCount: 0,
			activeLearer: 0,
			workbookCount: 0,
			sessionCount: 0,
			certifiedLearners: 0,
			assignWorkbookCount: 0,
			assignedCertificateCount: 0,
			assignedBadgeCount: 0,
		};
		payload.pathwayCount = allPathwayCount;
		payload.courseCount = allCourseCount;
		payload.activeLearer = allUserData;
		payload.workbookCount = allWorkBookCount;
		payload.sessionCount = allSessioncount;
		payload.certifiedLearners = certifiedLearners;
		payload.assignWorkbookCount = assignedWorkbookCount;
		payload.assignedCertificateCount = allCertificateCount;
		payload.assignedBadgeCount = allBadgeCount;

		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoAnalyticsCountByClientId = getAllDiwoAnalyticsCountByClientId;

const getDiwoFilterListdata = async function (req, res) {
	try {
		// Need to find Branch List
		let clientId = req.user.ClientId;
		let getJobRoles = [];
		let getCountries = [];
		let ClientsDetail = [];
		let ClientdId = [];
		let err;

		[ClientsDetail, ClientdId] = await getAllSubBranchClientIds(clientId, req.user.type);

		// Need to find Country List
		[err, getCountries] = await to(
			Country.findAll({
				attributes: ['id', 'name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// Need to find Job Role List
		if (ClientdId.length > 0) {
			// const query_1 = `
			// SELECT  "Client_job_roles".id  AS id,
			// 		"Clients".name || ' - ' || "Client_job_roles".job_role_name as job_role_name,
			// 		"Client_job_roles"."ClientId" AS client_id

			// FROM "Client_job_roles"
			//   		JOIN "Clients" ON "Client_job_roles"."ClientId" = "Clients".id

			// WHERE "Client_job_roles".is_deleted = false
			// 	  AND "Client_job_roles".job_role_name IS NOT NULL
			// 	  AND "Client_job_roles".job_role_name != ''
			// 	  AND "Client_job_roles"."ClientId" IN (${ClientdId.toString()})
			// 	  AND "Client_job_roles"."forDiwo" = true;`;

			// [getJobRoles] = await sequelize.query(query_1);

			const query_1 = `
				SELECT "Client_job_roles".id AS id,
					"Clients".name || ' - ' || "Client_job_roles".job_role_name AS job_role_name,
					"Client_job_roles"."ClientId" AS client_id
				FROM "Client_job_roles"
				JOIN "Clients" ON "Client_job_roles"."ClientId" = "Clients".id
				WHERE "Client_job_roles".is_deleted = false
					AND "Client_job_roles".job_role_name IS NOT NULL
					AND "Client_job_roles".job_role_name != ''
					AND "Client_job_roles"."ClientId" IN (:clientIds)
					AND "Client_job_roles"."forDiwo" = true;
			`;

			getJobRoles = await sequelize.query(query_1, {
				replacements: {
					clientIds: Array.isArray(ClientdId) ? ClientdId : [], // Ensure it's an array
				},
				type: sequelize.QueryTypes.SELECT,
			});
		}

		//Need to Find modules As per Client Id
		// [err, moduleDetails] = await to(
		// 	Workbook.findAll({
		// 		where: { ClientId: ClientdId, status: 'Published', isDeleted: false },

		// 		attributes: ['id', 'title', [sequelize.literal(`CAST(id AS text) || ' - ' || title`), 'ModuleIdTitle']],
		// 		order: [['id', 'DESC']],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		let module_query = `
				SELECT DISTINCT "Workbook"."id", "Workbook"."title", CAST("Workbook"."id" AS text) || ' - ' || "Workbook"."title" AS "ModuleIdTitle"
						FROM "Workbooks" AS "Workbook"
						JOIN "Sessions" AS "Session" ON "Session"."WorkbookId" = "Workbook".id
						WHERE "Workbook"."ClientId" IN (:clientIds)
						AND "Workbook"."status" = 'Published'
						AND "Workbook"."isDeleted" = false
						ORDER BY "Workbook"."id" DESC;
				`;

		moduleDetails = await sequelize.query(module_query, {
			replacements: {
				clientIds: Array.isArray(ClientdId) ? ClientdId : [],
			},
			type: sequelize.QueryTypes.SELECT,
		});

		//Need to Find Courses As per Client Id
		[err, coursesDetails] = await to(
			Course.findAll({
				where: { ClientId: ClientdId, status: 'Published', isDeleted: false },
				attributes: ['id', 'title', [sequelize.literal(`CAST(id AS text) || ' - ' || title`), 'CourseIdTitle']],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Need to Find Pathways As per Client Id
		[err, pathwayDetails] = await to(
			Pathway.findAll({
				where: { ClientId: ClientdId, status: 'Published', isDeleted: false },
				attributes: ['id', 'title', [sequelize.literal(`CAST(id AS text) || ' - ' || title`), 'PathwayIdTitle']],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get Custom Fields
		let customFields = await getAccountCustomField(clientId);
		let customFieldsData = [];
		if (customFields && customFields.length > 0) {
			for (let field of customFields) {
				if (field.dataType == 'Dropdown select' && field.isHide == false) {
					let options = [];
					for (let option of field.options) {
						if (option.isHide == false) {
							options.push(option);
						}
					}
					customFieldsData.push({
						dataType: field.dataType,
						label: field.label,
						options: options,
					});
				}
			}
		}

		let payload = {
			BranchList: ClientsDetail,
			CountryList: getCountries,
			JobRoleList: getJobRoles,
			ModuleList: moduleDetails,
			CourseList: coursesDetails,
			PathwayList: pathwayDetails,
			customFields: customFieldsData,
		};

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoFilterListdata = getDiwoFilterListdata;

const getDiwoFilterAssignmentIdsdata = async function (req, res) {
	try {
		const schema = Joi.object({
			type: Joi.string().valid('Modules', 'Courses', 'Pathways').required(),
		});

		const { error, value } = schema.validate({
			type: req.params.type,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { type } = value;

		let clientId = req.user.ClientId;
		let assignmentIds = [];
		let ClientdId = [];
		let err;

		[ClientsDetail, ClientdId] = await getAllSubBranchClientIds(clientId, req.user.type);

		if (type == 'Modules') {
			//Need to Find Assignment As per Client Id and type
			// const query_1 = `
			// 		SELECT
			// 			assignment_detail.id AS id
			// 		FROM
			// 			"Workbooks" module_detail
			// 		INNER JOIN
			// 			"DiwoAssignments" assignment_detail ON module_detail.id = assignment_detail."WorkbookId"
			// 		WHERE
			// 			module_detail."ClientId" IN (${ClientdId.toString()})
			// 			AND module_detail.status = 'Published'
			// 			AND module_detail."isDeleted" = false
			// 		ORDER BY
			// 			assignment_detail.id DESC;
			// 		`;

			// // console.log('-query_1-', query_1);

			// [assignmentIds] = await sequelize.query(query_1);

			const query_1 = `
				SELECT 
					assignment_detail.id AS id
				FROM 
					"Workbooks" module_detail
				INNER JOIN 
					"DiwoAssignments" assignment_detail 
					ON module_detail.id = assignment_detail."WorkbookId"
				WHERE 
					module_detail."ClientId" IN (:clientIds)
					AND module_detail.status = 'Published' 
					AND module_detail."isDeleted" = false
				ORDER BY 
					assignment_detail.id DESC;
			`;

			assignmentIds = await sequelize.query(query_1, {
				replacements: {
					clientIds: Array.isArray(ClientdId) ? ClientdId : [], // Ensure it's an array
				},
				type: sequelize.QueryTypes.SELECT,
			});
		} else if (type == 'Courses') {
			//Need to Find Assignment As per Client Id and type
			// const query_2 = `
			// 		SELECT
			// 			assignment_detail.id AS id
			// 		FROM
			// 			"Courses" course_detail
			// 		INNER JOIN
			// 			"DiwoAssignments" assignment_detail ON course_detail.id = assignment_detail."CourseId"
			// 		WHERE
			// 			course_detail."ClientId" IN (${ClientdId.toString()})
			// 			AND course_detail.status = 'Published'
			// 			AND course_detail."isDeleted" = false
			// 		ORDER BY
			// 			assignment_detail.id DESC;
			// 		`;

			// // console.log('-query_2-', query_2);

			// [assignmentIds] = await sequelize.query(query_2);

			const query_2 = `
				SELECT 
					assignment_detail.id AS id
				FROM 
					"Courses" course_detail
				INNER JOIN 
					"DiwoAssignments" assignment_detail 
					ON course_detail.id = assignment_detail."CourseId"
				WHERE 
					course_detail."ClientId" IN (:clientIds)
					AND course_detail.status = 'Published' 
					AND course_detail."isDeleted" = false
				ORDER BY 
					assignment_detail.id DESC;
			`;

			assignmentIds = await sequelize.query(query_2, {
				replacements: {
					clientIds: Array.isArray(ClientdId) ? ClientdId : [],
				},
				type: sequelize.QueryTypes.SELECT,
			});
		} else if (type == 'Pathways') {
			// const query_3 = `
			// 		SELECT
			// 			assignment_detail.id AS id
			// 		FROM
			// 			"Pathways" pathway_detail
			// 		INNER JOIN
			// 			"DiwoAssignments" assignment_detail ON pathway_detail.id = assignment_detail."PathwayId"
			// 		WHERE
			// 			pathway_detail."ClientId" IN (${ClientdId.toString()})
			// 			AND pathway_detail.status = 'Published'
			// 			AND pathway_detail."isDeleted" = false
			// 		ORDER BY
			// 			assignment_detail.id DESC;
			// 		`;

			// // console.log('-query_3-', query_3);

			// [assignmentIds] = await sequelize.query(query_3);

			const query_3 = `
				SELECT 
					assignment_detail.id AS id
				FROM 
					"Pathways" pathway_detail
				INNER JOIN 
					"DiwoAssignments" assignment_detail 
					ON pathway_detail.id = assignment_detail."PathwayId"
				WHERE 
					pathway_detail."ClientId" IN (:clientIds)
					AND pathway_detail.status = 'Published' 
					AND pathway_detail."isDeleted" = false
				ORDER BY 
					assignment_detail.id DESC;
			`;

			assignmentIds = await sequelize.query(query_3, {
				replacements: {
					clientIds: Array.isArray(ClientdId) ? ClientdId : [],
				},
				type: sequelize.QueryTypes.SELECT,
			});
		}

		let payload = {
			AssignmentIdsList: assignmentIds,
		};

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoFilterAssignmentIdsdata = getDiwoFilterAssignmentIdsdata;

const getAllModuleCoursePathwaysForAnalytics = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			viewedBy: Joi.string().valid('Modules', 'Courses', 'Pathways').required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			viewedBy: req.params.viewedBy,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientId, viewedBy } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let query = '';
		let assignModuleCoursePathway = [];
		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		// if (viewedBy == 'Modules') {
		// 	query = `
		// 		SELECT
		// 			"Workbooks".id AS id,
		// 			"Workbooks".title AS workbook_title,
		// 			CAST("Workbooks".id AS TEXT) || ' - ' || "Workbooks".title AS "IdTitle",
		// 			'Module' AS type
		// 		FROM
		// 			"DiwoAssignments"
		// 		JOIN
		// 			"Workbooks" ON "Workbooks".id = "DiwoAssignments"."WorkbookId"
		// 		WHERE
		// 			"DiwoAssignments"."ClientId" IN (${allSubChildClientIds.toString()})
		// 		ORDER BY
		// 			"DiwoAssignments".id DESC;
		// 		`;
		// } else if (viewedBy == 'Courses') {
		// 	query = `
		// 		SELECT
		// 			"Courses".id AS id,
		// 			"Courses".title AS course_title,
		// 			CAST("Courses".id AS TEXT) || ' - ' || "Courses".title AS "IdTitle",
		// 			'Course' AS type
		// 		FROM
		// 			"DiwoAssignments"
		// 		JOIN
		// 			"Courses" ON "Courses".id = "DiwoAssignments"."CourseId"
		// 		WHERE
		// 			"DiwoAssignments"."ClientId" IN (${allSubChildClientIds.toString()})
		// 		ORDER BY
		// 			"DiwoAssignments".id DESC;
		// 		`;
		// } else if (viewedBy == 'Pathways') {
		// 	query = `
		// 	SELECT
		// 		"Pathways".id AS id,
		// 		"Pathways".title AS pathway_title,
		// 		CAST("Pathways".id AS TEXT) || ' - ' || "Pathways".title AS "IdTitle",
		// 		'Pathway' AS type
		// 	FROM
		// 		"DiwoAssignments"
		// 	JOIN
		// 		"Pathways" ON "Pathways".id = "DiwoAssignments"."PathwayId"
		// 	WHERE
		// 		"DiwoAssignments"."ClientId" IN (${allSubChildClientIds.toString()})
		// 	ORDER BY
		// 		"DiwoAssignments".id DESC;
		// 	`;
		// }

		// [data] = await sequelize.query(query);

		if (viewedBy === 'Modules') {
			query = `
				SELECT
					"Workbooks".id AS id,
					"Workbooks".title AS workbook_title,
					CAST("Workbooks".id AS TEXT) || ' - ' || "Workbooks".title AS "IdTitle",
					'Module' AS type
				FROM
					"DiwoAssignments"
				JOIN
					"Workbooks" ON "Workbooks".id = "DiwoAssignments"."WorkbookId"
				WHERE
					"DiwoAssignments"."ClientId" IN (:clientIds) AND
					"DiwoAssignments"."status" != 'Draft'
				ORDER BY
					"DiwoAssignments".id DESC; `;
		} else if (viewedBy === 'Courses') {
			query = `
				SELECT
					"Courses".id AS id,
					"Courses".title AS course_title,
					CAST("Courses".id AS TEXT) || ' - ' || "Courses".title AS "IdTitle",
					'Course' AS type
				FROM
					"DiwoAssignments"
				JOIN
					"Courses" ON "Courses".id = "DiwoAssignments"."CourseId"
				WHERE
					"DiwoAssignments"."ClientId" IN (:clientIds)
				ORDER BY
					"DiwoAssignments".id DESC; `;
		} else if (viewedBy === 'Pathways') {
			query = `
				SELECT
					"Pathways".id AS id,
					"Pathways".title AS pathway_title,
					CAST("Pathways".id AS TEXT) || ' - ' || "Pathways".title AS "IdTitle",
					'Pathway' AS type
				FROM
					"DiwoAssignments"
				JOIN
					"Pathways" ON "Pathways".id = "DiwoAssignments"."PathwayId"
				WHERE
					"DiwoAssignments"."ClientId" IN (:clientIds)
				ORDER BY
					"DiwoAssignments".id DESC; `;
		}

		data = await sequelize.query(query, {
			replacements: { clientIds: allSubChildClientIds },
			type: sequelize.QueryTypes.SELECT,
		});

		assignModuleCoursePathway = [...data];

		const uniqueList = [];
		for (let i = 0; i < assignModuleCoursePathway.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < uniqueList.length; j++) {
				if (JSON.stringify(assignModuleCoursePathway[i]) === JSON.stringify(uniqueList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				uniqueList.push(assignModuleCoursePathway[i]);
			}
		}

		return ResponseSuccess(res, { data: uniqueList }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllModuleCoursePathwaysForAnalytics = getAllModuleCoursePathwaysForAnalytics;

//Get Assigmnet Detail for analytics by ModuleId
const getModuleDataForAnalyticsByModuleId = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);
		// let id = req.body.id;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			moduleId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			moduleId: req.body.id,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		let { clientId, moduleId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		let query = `
			SELECT
				"Workbooks".id AS "workbookId",
				"Workbooks".title AS "workbookTitle",
				"DiwoAssignments".id AS "DiwoAssignmentId",
				"DiwoAssignments"."StartDate" AS "StartDate",
				"DiwoAssignments"."EndDate" AS "EndDate",
				"DiwoAssignments"."status" AS "status",
				STRING_AGG(DISTINCT "User_groups".title, ', ') AS "userGroupTitle",
				COUNT(DISTINCT "Badges".id) AS "badgeCount",
				COUNT(DISTINCT "SessionUsers".id) AS nominatedLearnerCount,
				SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Not Started' THEN 1 ELSE 0 END) AS learnerNotStartedCount,
				SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'In Progress' THEN 1 ELSE 0 END) AS learnerInProgressCount,
				SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Completed' THEN 1 ELSE 0 END) AS learnerCompletedCount,
				SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Certified' THEN 1 ELSE 0 END) AS learnerCertifiedCount,
				CASE
					WHEN COUNT(DISTINCT "SessionUsers".id) > 0 THEN
						ROUND((SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Completed' THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT "SessionUsers".id), 2)
					ELSE 0
				END || '%' AS completedPercentage
			FROM "Workbooks"
				INNER JOIN "DiwoAssignments" ON "DiwoAssignments"."WorkbookId" = "Workbooks".id
				INNER JOIN "Sessions" ON "Sessions"."DiwoAssignmentId" = "DiwoAssignments".id
				LEFT JOIN "SessionUsers" ON "SessionUsers"."SessionId" = "Sessions".id AND "SessionUsers"."ModuleIndex" = 0
				LEFT JOIN "DiwoAssignUserGroupMappings" ON "DiwoAssignUserGroupMappings"."DiwoAssignmentId" = "DiwoAssignments".id
				LEFT JOIN "User_groups" ON "User_groups".id = "DiwoAssignUserGroupMappings"."UserGroupId"
				LEFT JOIN "LearnerAchievements" ON "LearnerAchievements"."DiwoAssignmentId" = "DiwoAssignments".id
					AND "LearnerAchievements"."isBadge" = TRUE
				LEFT JOIN "Badges" ON "Badges".id = "LearnerAchievements"."BadgeId"
			WHERE "Workbooks"."ClientId" IN (:clientIds) AND "Workbooks".id = :workbookId
			GROUP BY
				"Workbooks".id, "Workbooks".title, "DiwoAssignments".id,
				"DiwoAssignments"."StartDate", "DiwoAssignments"."EndDate", "DiwoAssignments"."status"
			ORDER BY "Workbooks".id DESC; `;

		const moduledetail = await sequelize.query(query, {
			replacements: {
				clientIds: Array.isArray(allSubChildClientIds) ? allSubChildClientIds : [],
				workbookId: moduleId,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		return ResponseSuccess(res, { data: moduledetail }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getModuleDataForAnalyticsByModuleId = getModuleDataForAnalyticsByModuleId;

//Get Assigmnet Detail for analytics by CourseId
const getCourseDataForAnalyticsByCourseId = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);
		// let courseId = req.body.id;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			courseId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			courseId: req.body.id,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		let { clientId, courseId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		// INNER JOIN "Sessions" ON "Sessions"."DiwoAssignmentId" = "DiwoAssignments".id
		// LEFT JOIN "SessionUsers" ON "SessionUsers"."SessionId" = "Sessions".id AND "SessionUsers"."ModuleIndex" = 0

		const query = `
			SELECT
				"Courses".id AS "courseId",
				"Courses".title AS "courseTitle",
				"DiwoAssignments".id AS "DiwoAssignmentId",
				"DiwoAssignments"."StartDate" AS "StartDate",
				"DiwoAssignments"."EndDate" AS "EndDate",
				"DiwoAssignments"."status" AS "status",
				STRING_AGG(DISTINCT "User_groups".title, ', ') AS "userGroupTitle",
				COUNT(DISTINCT "Badges".id) AS "badgeCount",
				COUNT(DISTINCT "SessionUsers".id) AS nominatedLearnerCount,
				SUM(CASE WHEN cs.status = 'Not Started' THEN 1 ELSE 0 END) AS learnerNotStartedCount,
				SUM(CASE WHEN cs.status = 'In Progress' THEN 1 ELSE 0 END) AS learnerInProgressCount,
				SUM(CASE WHEN cs.status = 'Completed' THEN 1 ELSE 0 END) AS learnerCompletedCount,
				SUM(CASE WHEN cs.status = 'Certified' THEN 1 ELSE 0 END) AS learnerCertifiedCount,
				CASE
					WHEN COUNT(DISTINCT "SessionUsers".id) > 0 THEN
						ROUND((SUM(CASE WHEN cs.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT "SessionUsers".id), 2)
					ELSE 0
				END || '%' AS completedPercentage
			FROM "Courses"
			INNER JOIN "DiwoAssignments" ON "DiwoAssignments"."CourseId" = "Courses".id
			LEFT JOIN "SessionUsers" ON "SessionUsers"."DiwoAssignmentId" = "DiwoAssignments".id AND "SessionUsers"."ModuleIndex" = 0
			LEFT JOIN "DiwoAssignUserGroupMappings" ON "DiwoAssignUserGroupMappings"."DiwoAssignmentId" = "DiwoAssignments".id
			LEFT JOIN "User_groups" ON "User_groups".id = "DiwoAssignUserGroupMappings"."UserGroupId"
			LEFT JOIN "LearnerAchievements" ON "LearnerAchievements"."DiwoAssignmentId" = "DiwoAssignments".id
				AND "LearnerAchievements"."isBadge" = TRUE
			LEFT JOIN "Badges" ON "Badges".id = "LearnerAchievements"."BadgeId"
			LEFT JOIN "CourseStatuses" cs ON cs.id = "SessionUsers"."CourseStatusId"
			WHERE "Courses"."ClientId" IN (:allSubChildClientIds)
				AND "Courses".id = :courseId
			GROUP BY
				"Courses".id, "Courses".title, "DiwoAssignments".id,
				"DiwoAssignments"."StartDate", "DiwoAssignments"."EndDate", "DiwoAssignments"."status"
			ORDER BY "Courses".id DESC;
		`;

		// Using parameterized values to prevent SQL injection
		const replacements = {
			allSubChildClientIds: Array.isArray(allSubChildClientIds) ? allSubChildClientIds : [], // Ensure this is an array
			courseId: courseId,
		};

		const coursedetail = await sequelize.query(query, {
			replacements,
			type: sequelize.QueryTypes.SELECT,
		});

		return ResponseSuccess(res, { data: [coursedetail] }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCourseDataForAnalyticsByCourseId = getCourseDataForAnalyticsByCourseId;

//Get Assigmnet Detail for analytics by PathwayId
const getPathwaysDataForAnalyticsById = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);
		// let pathwayId = req.body.id;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			pathwayId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			pathwayId: req.body.id,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		let { clientId, pathwayId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(parseInt(clientId), false);

		const query = `
			SELECT
				"Pathways".id AS "pathwayId",
				"Pathways".title AS "pathwayTitle",
				"DiwoAssignments".id AS "DiwoAssignmentId",
				"DiwoAssignments"."StartDate" AS "StartDate",
				"DiwoAssignments"."EndDate" AS "EndDate",
				"DiwoAssignments"."status" AS "status",
				STRING_AGG(DISTINCT "User_groups".title, ', ') AS "userGroupTitle",
				COUNT(DISTINCT "Badges".id) AS "badgeCount",
				COUNT(DISTINCT "SessionUsers".id) AS nominatedLearnerCount,
				COUNT(DISTINCT CASE WHEN ps.status = 'Not Started' THEN "SessionUsers".id ELSE NULL END) AS learnerNotStartedCount,
				COUNT(DISTINCT CASE WHEN ps.status = 'In Progress' THEN "SessionUsers".id ELSE NULL END) AS learnerInProgressCount,
				COUNT(DISTINCT CASE WHEN ps.status = 'Completed' THEN "SessionUsers".id ELSE NULL END) AS learnerCompletedCount,
				COUNT(DISTINCT CASE WHEN ps.status = 'Certified' THEN "SessionUsers".id ELSE NULL END) AS learnerCertifiedCount,
				CASE
					WHEN COUNT(DISTINCT "SessionUsers".id) > 0 THEN
						ROUND((COUNT(DISTINCT CASE WHEN ps.status = 'Completed' THEN "SessionUsers".id ELSE NULL END) * 100.0) / COUNT(DISTINCT "SessionUsers".id), 2)
					ELSE 0
				END || '%' AS completedPercentage
			FROM "Pathways"
			INNER JOIN "DiwoAssignments" ON "DiwoAssignments"."PathwayId" = "Pathways".id
			LEFT JOIN "SessionUsers" ON "SessionUsers"."DiwoAssignmentId" = "DiwoAssignments".id AND "SessionUsers"."ModuleIndex" = 0
			LEFT JOIN "DiwoAssignUserGroupMappings" ON "DiwoAssignUserGroupMappings"."DiwoAssignmentId" = "DiwoAssignments".id
			LEFT JOIN "User_groups" ON "User_groups".id = "DiwoAssignUserGroupMappings"."UserGroupId"
			LEFT JOIN "LearnerAchievements" ON "LearnerAchievements"."DiwoAssignmentId" = "DiwoAssignments".id
				AND "LearnerAchievements"."isBadge" = TRUE
			LEFT JOIN "Badges" ON "Badges".id = "LearnerAchievements"."BadgeId"
			LEFT JOIN "PathwayStatuses" ps ON ps.id = "SessionUsers"."PathwayStatusId"
			WHERE 
				"Pathways"."ClientId" IN (:allSubChildClientIds) AND "Pathways".id = :pathwayId
			GROUP BY
				"Pathways".id, "Pathways".title, "DiwoAssignments".id,
				"DiwoAssignments"."StartDate", "DiwoAssignments"."EndDate", "DiwoAssignments"."status"
			ORDER BY
				"Pathways".id DESC;
		`;

		const replacements = {
			allSubChildClientIds: Array.isArray(allSubChildClientIds) ? allSubChildClientIds : [], // Ensure it's an array
			pathwayId: pathwayId,
		};

		const pathwaydetail = await sequelize.query(query, {
			replacements,
			type: sequelize.QueryTypes.SELECT,
		});

		return ResponseSuccess(res, { data: [pathwaydetail] }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getPathwaysDataForAnalyticsById = getPathwaysDataForAnalyticsById;

const getDiwoAnalyticsData = async function (req, res) {
	try {
		let clientId = req.user.ClientId;

		const schema = Joi.object({
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
			viewedBy: Joi.string().valid('Modules', 'Courses', 'Pathways').required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			startDate: req.body.date.startDate,
			endDate: req.body.date.endDate,
			viewedBy: req.body.viewedBy,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes, extract values, extract values
		let startDate = moment(value.startDate);
		let endDate = moment(value.endDate);
		let viewedBy = value.viewedBy;

		let filterdata = req.body.filterData;

		let branchId = [];
		let countryId = [];
		let jobRoleId = [];
		let moduleIds = [];
		let courseIds = [];
		let pathwayIds = [];
		let assignmentIds = [];
		let customFields = [];
		let tag = '';

		let finalQuery1 = ``;
		let query_1;
		let certif_workbookIds = [];
		let certif_assignmentIds = [];

		//Get All Sub Branch Client Ids
		let ClientsDetails = [];
		let ClientdIds = [];

		[ClientsDetails, ClientdIds] = await getAllSubBranchClientIds(clientId, req.user.type);

		if (branchId && branchId.length > 0) {
			ClientdIds = [];
			ClientdIds = branchId;
		}

		if (filterdata && filterdata.length > 0) {
			let moduleCertification = false;
			let assignmentModuleCertification = false;

			for (let item of filterdata) {
				if (item.filterType == 'Account') {
					for (let branch of item.selectedData) {
						if (branchId.indexOf(branch.id) == -1) {
							branchId.push(branch.id);
						}
					}
				} else if (item.filterType == 'Country') {
					for (let country of item.selectedData) {
						if (countryId.indexOf(country.id) == -1) {
							countryId.push(country.id);
						}
					}
				} else if (item.filterType == 'Job Role') {
					for (let jobRole of item.selectedData) {
						if (jobRoleId.indexOf(jobRole.id) == -1) {
							jobRoleId.push(jobRole.id);
						}
					}
				} else if (item.filterType == 'Modules') {
					for (let module_ of item.selectedData) {
						if (moduleIds.indexOf(module_.id) == -1) {
							moduleIds.push(module_.id);
						}

						if (module_.title == 'All modules with certifications') {
							moduleCertification = true;
						}
					}
				} else if (item.filterType == 'Courses') {
					for (let course_ of item.selectedData) {
						if (course_.title != 'All courses with certifications') {
							if (courseIds.indexOf(course_.id) == -1) {
								courseIds.push(course_.id);
							}
						}

						if (course_.title == 'All courses with certifications') {
							assignmentModuleCertification = true;
						}
					}
				} else if (item.filterType == 'Pathways') {
					for (let pathway_ of item.selectedData) {
						if (pathway_.title != 'All pathways with certifications') {
							if (pathwayIds.indexOf(pathway_.id) == -1) {
								pathwayIds.push(pathway_.id);
							}
						}

						if (pathway_.title == 'All pathways with certifications') {
							assignmentModuleCertification = true;
						}
					}
				} else if (item.filterType == 'Assignment ID') {
					for (let assignment of item.selectedData) {
						if (assignment.title != 'All assignment with certifications') {
							if (assignmentIds.indexOf(assignment.id) == -1) {
								assignmentIds.push(assignment.id);
							}
						} else if (assignment.title == 'All assignment with certifications') {
							assignmentModuleCertification = true;
						}
					}
				} else if (item.filterType == 'Tags') {
					tag = item.searchByText.split(',');
				} else if (item.isCustomField) {
					let flag = true;
					for (let already of customFields) {
						if (already.label == item.filterType) {
							already.selectedOption = already.selectedOption.concat(item.selectedData);
							flag = false;
							break;
						}
					}
					if (flag) {
						customFields.push({ label: item.filterType, selectedOption: item.selectedData });
					}
				}
			}

			if (moduleCertification) {
				let WId = [];
				const Wb_query = `SELECT DISTINCT "id" FROM "Workbooks"
			      WHERE "haveCertificate" = true AND
			    "ClientId" IN (${ClientdIds.toString()})`;
				[WId] = await sequelize.query(Wb_query);
				moduleIds = WId.length > 0 ? WId.map((row) => row.id) : [0];
			}

			if (assignmentModuleCertification) {
				let selectFields = ``;
				let certificatesData = [];

				if (viewedBy === 'Modules') {
					selectFields = `"da"."id","da"."WorkbookId","dma"."WorkbookId"`;
				} else if (viewedBy === 'Courses') {
					selectFields = `"da"."id","da"."CourseId","dma"."WorkbookId"`;
				} else if (viewedBy === 'Pathways') {
					selectFields = `"da"."id","da"."PathwayId","dma"."WorkbookId"`;
				}

				const certificate_query = `
						SELECT DISTINCT ${selectFields}
						FROM "DiwoAssignments" AS da
						JOIN "DiwoModuleAssigns" AS dma ON da.id = dma."DiwoAssignmentId"
						JOIN "Workbooks" AS w ON dma."WorkbookId" = w.id
						WHERE
							da."ClientId" IN (${ClientdIds.toString()})
							${
								viewedBy === 'Courses'
									? `AND da."CourseId" IN (
										SELECT DISTINCT da_inner."CourseId"
										FROM "DiwoAssignments" AS da_inner
										JOIN "DiwoModuleAssigns" AS dma_inner ON da_inner.id = dma_inner."DiwoAssignmentId"
										JOIN "Workbooks" AS w_inner ON dma_inner."WorkbookId" = w_inner.id
										WHERE w_inner."haveCertificate" = true
									)`
									: viewedBy === 'Pathways'
									? `AND da."PathwayId" IN (
										SELECT DISTINCT da_inner."PathwayId"
										FROM "DiwoAssignments" AS da_inner
										JOIN "DiwoModuleAssigns" AS dma_inner ON da_inner.id = dma_inner."DiwoAssignmentId"
										JOIN "Workbooks" AS w_inner ON dma_inner."WorkbookId" = w_inner.id
										WHERE w_inner."haveCertificate" = true
									)`
									: `AND dma."WorkbookId" IN (
										SELECT DISTINCT dma_inner."WorkbookId"
										FROM "DiwoModuleAssigns" AS dma_inner
										JOIN "Workbooks" AS w_inner ON dma_inner."WorkbookId" = w_inner.id
										WHERE w_inner."haveCertificate" = true
									)`
							}
							${
								viewedBy === 'Courses'
									? `AND da."CourseId" IS NOT NULL`
									: viewedBy === 'Pathways'
									? `AND da."PathwayId" IS NOT NULL`
									: ``
							}
						${
							viewedBy === 'Courses'
								? `ORDER BY da."CourseId", dma."WorkbookId"`
								: viewedBy === 'Pathways'
								? `ORDER BY da."PathwayId", dma."WorkbookId"`
								: `ORDER BY dma."WorkbookId"`
						};
					`;
				// console.log('--certificate_query--', certificate_query);
				[certificatesData] = await sequelize.query(certificate_query);
				// console.log('--certificatesData--', certificatesData);

				if (viewedBy === 'Modules') {
					certif_workbookIds = certificatesData.map((row) => row.WorkbookId);
				} else if (viewedBy === 'Courses') {
					courseIds = certificatesData.map((row) => row.CourseId);
					certif_workbookIds = certificatesData.map((row) => row.WorkbookId);
					certif_assignmentIds = certificatesData.map((row) => row.id);
				} else if (viewedBy === 'Pathways') {
					pathwayIds = certificatesData.map((row) => row.PathwayId);
					certif_workbookIds = certificatesData.map((row) => row.WorkbookId);
					certif_assignmentIds = certificatesData.map((row) => row.id);
				}

				// console.log('--Workbook IDs Array--', certif_workbookIds);
				// console.log('--Course IDs Array--', courseIds);
				// console.log('--Pathway IDs Array--', pathwayIds);
			}
		}

		// console.log('---branchId-----------', branchId);
		// console.log('---countryId-----------', countryId);
		// console.log('---jobRoleId-----------', jobRoleId);
		// console.log('---tag-----------', tag);
		// console.log('---moduleIds-----------', moduleIds);
		// console.log('---assignmentIds-----------', assignmentIds);
		// console.log('---customFields-----------', customFields);
		// console.log('-----------------startDate', startDate.format('YYYY-MM-DD'));
		// console.log('-----------------endDate', endDate.format('YYYY-MM-DD'));

		/////////////////////////////////////////////////// JOIN VBT WT QUERY  ///////////////////////////////////////////////////////

		const UserJoinQuery = `
		JOIN "Users" ON "Users".id = "SessionUsers"."UserId"`;

		const CountryFilterJoinQuery = `
		JOIN "Countries" ON "Users"."CountryId" = "Countries".id`;

		const JobRoleFilterJoinQuery = `
		JOIN "User_job_role_mappings" ON "Users".id = "User_job_role_mappings"."UserId"`;

		const SessionUsersQuery = `
			JOIN "SessionUsers" ON "SessionUsers"."SessionId" = "Sessions".id`;

		/////////////////////////////////////////////////// WHERE VBT WT QUERY  ///////////////////////////////////////////////////////

		const ModuleIdFilterWhereQuery = `
		AND "SessionUsers"."WorkbookId" IN (${moduleIds.toString()})`;

		const CertifModuleIdFilterWhereQuery = `
		AND "SessionUsers"."WorkbookId" IN (${certif_workbookIds.toString()})`;

		const CourseIdFilterWhereQuery = `
		AND "DiwoAssignments"."CourseId" IN (${courseIds.toString()})`;

		const PathwayIdFilterWhereQuery = `
		AND "DiwoAssignments"."PathwayId" IN (${pathwayIds.toString()})`;

		const AssignmentIdFilterWhereQuery = `
		AND "DiwoAssignments"."id" IN (${assignmentIds.toString()})`;

		const ClientFilterWhereQuery = `
		AND "SessionUsers"."ClientId" IN (${ClientdIds.toString()})`;

		const CountryFilterWhereQuery = ` 
		AND "Countries".id IN (${countryId.toString()})`;

		const JobRoleFilterWhereQuery = ` 
			AND "User_job_role_mappings"."ClientJobRoleId" IN  (${jobRoleId.toString()}) AND "User_job_role_mappings"."forDiwo" = true`;

		let TagFilterWhereQuery = ``;
		if (tag && tag.length > 0) {
			for (let tag_ of tag) {
				TagFilterWhereQuery =
					TagFilterWhereQuery +
					`
					AND "Users".tags ILIKE '%${tag_}%'`;
			}
		}

		let customFilterWhereQuery = ``;
		if (customFields && customFields.length > 0) {
			for (let field of customFields) {
				if (field.selectedOption && field.selectedOption.length > 0) {
					let selectedOption = field.selectedOption;
					let selectedOptionList = ``;
					for (let option of selectedOption) {
						if (selectedOptionList == '') {
							selectedOptionList = `'${option.label}'`;
						} else {
							selectedOptionList = selectedOptionList + `,'${option.label}'`;
						}
					}
					customFilterWhereQuery =
						customFilterWhereQuery +
						`
						AND "Users"."customFields"->>'${field.label}' IN (${selectedOptionList})`;
				}
			}
		}

		/////////////////////////////////////////////////// Graph VBT WT QUERY  ///////////////////////////////////////////////////////
		// INNER JOIN "Workbooks" ON "Workbooks".id = "DiwoAssignments"."WorkbookId"
		if (viewedBy === 'Modules') {
			query_1 = `
					SELECT
							SUM(CASE WHEN "SessionUsers"."status" = 'Approved' THEN 1 ELSE 0 END) AS "AssignCount",
							SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'In Progress' THEN 1 ELSE 0 END) AS "InProgressCount",
							SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Completed' THEN 1 ELSE 0 END) AS "CompletedCount",
							SUM(CASE WHEN "SessionUsers"."ModuleStatus" = 'Certified' THEN 1 ELSE 0 END) AS "CertifiedCount"
					FROM "SessionUsers"
							INNER JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
							INNER JOIN "DiwoAssignments" ON "DiwoAssignments".id = "Sessions"."DiwoAssignmentId"
							${
								(countryId && countryId.length > 0) ||
								(jobRoleId && jobRoleId.length > 0) ||
								(customFields && customFields.length > 0) ||
								(tag && tag != '')
									? `${UserJoinQuery}`
									: ''
							}
							${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
							${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
					WHERE
						
						"Sessions"."status" != 'Planned' AND
						DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
                                              AND DATE '${endDate.format('YYYY-MM-DD')}'
				`;
		} else if (viewedBy === 'Courses') {
			// INNER JOIN "Courses" ON "Courses".id = "DiwoAssignments"."CourseId"
			query_1 = `
					SELECT
							NULLIF(COUNT(DISTINCT "SessionUsers".id), 0) AS "AssignCount",
							SUM(CASE WHEN "CourseStatuses"."status" = 'In Progress' THEN 1 ELSE 0 END) AS "InProgressCount",
							SUM(CASE WHEN "CourseStatuses"."status" = 'Completed' THEN 1 ELSE 0 END) AS "CompletedCount",
							SUM(CASE WHEN "CourseStatuses"."status" = 'Certified' THEN 1 ELSE 0 END) AS "CertifiedCount"
					FROM "SessionUsers"
							INNER JOIN "CourseStatuses" ON "CourseStatuses".id = "SessionUsers"."CourseStatusId"
							INNER JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
							INNER JOIN "DiwoAssignments" ON "DiwoAssignments".id = "Sessions"."DiwoAssignmentId"
							${
								(countryId && countryId.length > 0) ||
								(jobRoleId && jobRoleId.length > 0) ||
								(customFields && customFields.length > 0) ||
								(tag && tag != '')
									? `${UserJoinQuery}`
									: ''
							}
							${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
							${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
					WHERE 
							
							DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
                                              AND DATE '${endDate.format('YYYY-MM-DD')}'
				`;
		} else if (viewedBy === 'Pathways') {
			query_1 = `
					SELECT
								NULLIF(COUNT(DISTINCT "SessionUsers".id), 0) AS "AssignCount",
								SUM(CASE WHEN "PathwayStatuses"."status" = 'In Progress' THEN 1 ELSE 0 END) AS "InProgressCount",
								SUM(CASE WHEN "PathwayStatuses"."status" = 'Completed' THEN 1 ELSE 0 END) AS "CompletedCount",
								SUM(CASE WHEN "PathwayStatuses"."status" = 'Certified' THEN 1 ELSE 0 END) AS "CertifiedCount"
					FROM "SessionUsers"
								INNER JOIN "PathwayStatuses" ON "PathwayStatuses".id = "SessionUsers"."PathwayStatusId"
								INNER JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
								INNER JOIN "DiwoAssignments" ON "DiwoAssignments".id = "Sessions"."DiwoAssignmentId"
								INNER JOIN "Pathways" ON "Pathways".id = "DiwoAssignments"."PathwayId"
								${
									(countryId && countryId.length > 0) ||
									(jobRoleId && jobRoleId.length > 0) ||
									(customFields && customFields.length > 0) ||
									(tag && tag != '')
										? `${UserJoinQuery}`
										: ''
								}
								${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
								${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
						WHERE 
							
								DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
												AND DATE '${endDate.format('YYYY-MM-DD')}'
				`;
		}

		////////////////////////////////////////////////// Final VBT WT Query ////////////////////////////////////////////////////////////////

		let analyticsData = [];
		let ILTAnalyticsData = [];

		let ILTSessionCount = 0;
		let ILTAttendance = 0;
		let sessionFeedbackScore = 0;
		let sessionFeedbackTotalCount = 0;
		let LearningHours = 0;

		if (viewedBy && query_1) {
			finalQuery1 = query_1;

			if (moduleIds && moduleIds.length > 0) {
				finalQuery1 = finalQuery1 + ModuleIdFilterWhereQuery;
			}

			if (viewedBy == 'Modules' && certif_workbookIds && certif_workbookIds.length > 0) {
				finalQuery1 = finalQuery1 + CertifModuleIdFilterWhereQuery;
			}

			if (courseIds && courseIds.length > 0) {
				finalQuery1 = finalQuery1 + CourseIdFilterWhereQuery;
			}

			if (pathwayIds && pathwayIds.length > 0) {
				finalQuery1 = finalQuery1 + PathwayIdFilterWhereQuery;
			}

			if (assignmentIds && assignmentIds.length > 0) {
				finalQuery1 = finalQuery1 + AssignmentIdFilterWhereQuery;
			}

			if (ClientdIds && ClientdIds.length > 0) {
				finalQuery1 = finalQuery1 + ClientFilterWhereQuery;
			}

			if (countryId && countryId.length > 0) {
				finalQuery1 = finalQuery1 + CountryFilterWhereQuery;
			}

			if (jobRoleId && jobRoleId.length > 0) {
				finalQuery1 = finalQuery1 + JobRoleFilterWhereQuery;
			}

			if (tag) {
				finalQuery1 = finalQuery1 + TagFilterWhereQuery;
			}

			if (customFields && customFields.length > 0) {
				finalQuery1 = finalQuery1 + customFilterWhereQuery;
			}

			// console.log('-----------finalQuery-1--------------', finalQuery1);
			try {
				[analyticsData] = await sequelize.query(finalQuery1);
			} catch (error) {
				console.error('---Error executing sequelize query-----:', error);
				return ResponseError(res, error, 500, true);
			}
		} else {
			analyticsData = [];
		}

		////////////////////////////////////////////////// ILT Query's START ////////////////////////////////////////////////////////////////

		let finalILTResult = {
			ILTSessionCount: ILTSessionCount,
			ILTAttendance: ILTAttendance,
			sessionFeedbackScore: sessionFeedbackScore,
			sessionFeedbackTotalCount: sessionFeedbackTotalCount,
			LearningHours: LearningHours,
		};

		//////////////////////////////////////////////////  ILT BOXES JOIN Query ////////////////////////////////////////////////////////////////

		const ILTModuleIdFilterWhereQuery = `
			AND "Sessions"."WorkbookId" IN (${moduleIds.toString()})`;

		const ILTClientFilterWhereQuery = `
			"Sessions"."ClientId" IN (${ClientdIds.toString()})`;

		const ILTUserJoinQuery = `
			JOIN "Users" ON "Users".id = "Sessions"."UserId"`;

		const ILTCountryFilterWhereQuery = `
			AND "Countries".id IN (${countryId.toString()})`;

		const ILTJobRoleFilterWhereQuery = `
				AND "User_job_role_mappings"."ClientJobRoleId" IN  (${jobRoleId.toString()}) AND "User_job_role_mappings"."forDiwo" = true`;

		////////////////////////////////////////// Common ILT WHERE CODITION /////////////////////////////////////////////////

		let whereClause = '';
		let whereClauseSessionCount = '';
		let whereClauseSessionFeedBack = '';
		let whereClauseVBTHourse = '';

		whereClause = whereClause + `${ILTClientFilterWhereQuery}`;
		whereClause = whereClause + ` AND "Sessions"."DiwoModuleId" = 1`;
		whereClause =
			whereClause +
			`  AND DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
											AND DATE '${endDate.format('YYYY-MM-DD')}'`;

		///////////////////////////////////////////// ILT Session Count BOX ///////////////////////////////////////

		whereClauseSessionCount = ` AND "Sessions"."status" != 'Planned'`;
		let ILTSessionCountQuery = `
						SELECT COUNT(DISTINCT "Sessions".id) AS "ILTSessionCount"
   						FROM "Sessions"
						
							${
								(assignmentIds && assignmentIds.length > 0) ||
								(courseIds && courseIds.length > 0) ||
								(pathwayIds && pathwayIds.length > 0)
									? `${SessionUsersQuery}`
									: ''
							}
							${
								(countryId && countryId.length > 0) ||
								(jobRoleId && jobRoleId.length > 0) ||
								(customFields && customFields.length > 0) ||
								(tag && tag != '')
									? `${ILTUserJoinQuery}`
									: ''
							}
							
							${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
							${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
						WHERE `;

		//////////////////////////////////////////////// ILT Attendance BOX //////////////////////////////////

		let ILTAttendanceQuery = `
						SELECT COUNT(DISTINCT "SessionUsers".id) AS "ILTAttendance"
						FROM "SessionUsers"
							JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
							${
								(countryId && countryId.length > 0) ||
								(jobRoleId && jobRoleId.length > 0) ||
								(customFields && customFields.length > 0) ||
								(tag && tag != '')
									? `${UserJoinQuery}`
									: ''
							}
							${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
							${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
						WHERE `;

		//////////////////////////////////////////////// Session FeedBack Box //////////////////////////////////

		whereClauseSessionFeedBack = whereClauseSessionFeedBack + `${ILTClientFilterWhereQuery}`;
		whereClauseSessionFeedBack =
			whereClauseSessionFeedBack +
			`  AND DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
											AND DATE '${endDate.format('YYYY-MM-DD')}'`;
		whereClauseSessionFeedBack = whereClauseSessionFeedBack + ` AND "SessionWorksheets"."sessionFeedback" = true`;
		whereClauseSessionFeedBack = whereClauseSessionFeedBack + ` AND "SessionWorksheets".type = 'Survey'`;
		whereClauseSessionFeedBack = whereClauseSessionFeedBack + ` AND "SessionWorksheets".submit = true`;
		whereClauseSessionFeedBack = whereClauseSessionFeedBack + ` AND "SessionQuestions"."questionType" = 'Rating scale'`;

		//////////////////////////////////////////////// VBT WT Hourse Box //////////////////////////////////

		whereClauseVBTHourse = whereClauseVBTHourse + `${ILTClientFilterWhereQuery}`;
		whereClauseVBTHourse =
			whereClauseVBTHourse +
			`  AND DATE("Sessions"."SessionStartDate") BETWEEN DATE '${startDate.format('YYYY-MM-DD')}' 
											AND DATE '${endDate.format('YYYY-MM-DD')}'`;
		whereClauseVBTHourse = whereClauseVBTHourse + ` AND "Sessions"."DiwoModuleId" IN (2, 3, 4)`;
		whereClauseVBTHourse = whereClauseVBTHourse + ` AND "SessionUsers"."ModuleStatus" IN ('Completed', 'Certified')`;

		//////////////////////////////////////////////// Filter Where Conditions //////////////////////////////////

		let selectFields = ``;
		let assignmentData = [];

		let workbookIdsArray = [];
		let pathwayIdsArray = [];

		let course_pathway_assignmentData = [];

		if (assignmentIds?.length) {
			if (viewedBy === 'Modules') {
				selectFields = `"da"."WorkbookId","dma"."WorkbookId"`;
			} else if (viewedBy === 'Courses') {
				selectFields = `"da"."CourseId","dma"."WorkbookId"`;
			} else if (viewedBy === 'Pathways') {
				selectFields = `"da"."PathwayId","dma"."WorkbookId"`;
			}

			const assignment_query = `
					SELECT DISTINCT ${selectFields}
					FROM "DiwoAssignments" AS da
					JOIN "DiwoModuleAssigns" AS dma ON da.id = dma."DiwoAssignmentId"
					WHERE
						da."ClientId" IN (${ClientdIds.toString()}) AND
						da.id IN (${assignmentIds.toString()}) AND
						${
							viewedBy === 'Modules'
								? `da."WorkbookId" IS NOT NULL`
								: viewedBy === 'Courses'
								? `da."CourseId" IS NOT NULL`
								: `da."PathwayId" IS NOT NULL`
						}
				`;

			console.log('--assignment_query--', assignment_query);
			// [assignmentData] = await sequelize.query(assignment_query);
			// console.log('--assignmentData--', assignmentData);

			if (viewedBy === 'Modules') {
				workbookIdsArray = assignmentData.map((row) => row.WorkbookId);
			} else if (viewedBy === 'Courses') {
				workbookIdsArray = assignmentData.map((row) => row.WorkbookId);
			} else if (viewedBy === 'Pathways') {
				pathwayIdsArray = assignmentData.map((row) => row.PathwayId);
				workbookIdsArray = assignmentData.map((row) => row.WorkbookId);
			}

			// console.log('--Workbook IDs Array--', workbookIdsArray);
			// console.log('--Pathway IDs Array--', pathwayIdsArray);
		}

		if ((courseIds?.length || pathwayIds?.length) && ClientdIds?.length) {
			const idType = courseIds?.length ? 'CourseId' : 'PathwayId';
			const ids = courseIds?.length ? courseIds : pathwayIds;

			const course_pathway_assignment_query = `
				SELECT DISTINCT "da"."id", "da"."${idType}", "dma"."WorkbookId"
				FROM "DiwoAssignments" AS da
				JOIN "DiwoModuleAssigns" AS dma ON da.id = dma."DiwoAssignmentId"
				WHERE da."ClientId" IN (${ClientdIds}) 
				AND da."${idType}" IN (${ids}) 
				AND da."${idType}" IS NOT NULL
			`;

			// console.log('--course_pathway_assignment_query--', course_pathway_assignment_query);
			[course_pathway_assignmentData] = await sequelize.query(course_pathway_assignment_query);
			// console.log('--course_pathway_assignmentData--', course_pathway_assignmentData);

			workbookIdsArray = course_pathway_assignmentData.map((row) => row.WorkbookId);
			assignmentIds = course_pathway_assignmentData.map((row) => row.id);

			// let CourseQuery = `SELECT
			// 		dma."DiwoAssignmentId",
			// 		dma."WorkbookId"
			// 	FROM
			// 		"DiwoModuleAssigns" AS dma
			// 	JOIN "DiwoAssignments" AS da ON da.id = dma."DiwoAssignmentId"
			// 	WHERE
			// 		da."ClientId" IN (${ClientdIds})
			// 		AND dma."CourseId" IN (${courseIds})`;

			// [CourseQueryData] = await sequelize.query(CourseQuery);
			// console.log('--CourseQueryData--', CourseQueryData);

			// workbookIdsArray = CourseQueryData.map((row) => row.WorkbookId);
			// assignmentIds = CourseQueryData.map((row) => row.DiwoAssignmentId);
		}

		if (moduleIds?.length) {
			whereClause = whereClause + ILTModuleIdFilterWhereQuery;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + ILTModuleIdFilterWhereQuery;
			whereClauseVBTHourse = whereClauseVBTHourse + ILTModuleIdFilterWhereQuery;
		}

		if (workbookIdsArray.length) {
			const workbookFilterQuery = `AND "Sessions"."WorkbookId" IN (${workbookIdsArray.toString()}) AND "SessionUsers"."DiwoAssignmentId" IN (${assignmentIds.toString()})`;
			whereClause = whereClause + workbookFilterQuery;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + workbookFilterQuery;
			whereClauseVBTHourse = whereClauseVBTHourse + workbookFilterQuery;
		}

		if (certif_workbookIds.length) {
			let workbookFilterQuery = ``;
			if (viewedBy == 'Modules') {
				workbookFilterQuery = `AND "Sessions"."WorkbookId" IN (${certif_workbookIds.toString()})`;
			} else {
				workbookFilterQuery = `AND "Sessions"."WorkbookId" IN (${certif_workbookIds.toString()}) AND "SessionUsers"."DiwoAssignmentId" IN (${certif_assignmentIds.toString()})`;
			}
			whereClause = whereClause + workbookFilterQuery;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + workbookFilterQuery;
			whereClauseVBTHourse = whereClauseVBTHourse + workbookFilterQuery;
		}

		if (countryId && countryId.length > 0) {
			whereClause = whereClause + `${ILTCountryFilterWhereQuery}`;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + `${ILTCountryFilterWhereQuery}`;
			whereClauseVBTHourse = whereClauseVBTHourse + `${ILTCountryFilterWhereQuery}`;
		}

		if (jobRoleId && jobRoleId.length > 0) {
			whereClause = whereClause + `${ILTJobRoleFilterWhereQuery}`;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + `${ILTJobRoleFilterWhereQuery}`;
			whereClauseVBTHourse = whereClauseVBTHourse + `${ILTJobRoleFilterWhereQuery}`;
		}

		if (tag) {
			whereClause = whereClause + `${TagFilterWhereQuery}`;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + `${TagFilterWhereQuery}`;
			whereClauseVBTHourse = whereClauseVBTHourse + `${TagFilterWhereQuery}`;
		}

		if (customFields && customFields.length > 0) {
			whereClause = whereClause + `${customFilterWhereQuery}`;
			whereClauseSessionFeedBack = whereClauseSessionFeedBack + `${customFilterWhereQuery}`;
			whereClauseVBTHourse = whereClauseVBTHourse + `${customFilterWhereQuery}`;
		}

		////////////////////////////////////////////////ILT Feedback Query////////////////////////////////////////////////////////////

		let sessionFeedBackDataQuery = `
				WITH SessionData AS (
					SELECT
						"SessionUsers".id AS session_user_id,
						SUM(CASE WHEN "SessionOptions"."selectedAns" THEN
									CASE WHEN "SessionWorksheets"."sessionFeedBackMinCount" = 0 THEN "SessionOptions".sr_no - 1
										ELSE "SessionOptions".sr_no END ELSE 0 END ) AS sessionScore,
						COUNT(DISTINCT "SessionQuestions".id) * MAX("SessionWorksheets"."sessionFeedBackMaxCount") AS sessionTotalScore
					FROM "SessionUsers"
						JOIN "SessionWorksheets" ON "SessionUsers".id = "SessionWorksheets"."SessionUserId"
						JOIN "SessionQuestions" ON "SessionWorksheets".id = "SessionQuestions"."SessionWorksheetId"
						JOIN "SessionOptions" ON "SessionQuestions".id = "SessionOptions"."SessionQuestionId"
						JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
						${
							(countryId && countryId.length > 0) ||
							(jobRoleId && jobRoleId.length > 0) ||
							(customFields && customFields.length > 0) ||
							(tag && tag != '')
								? `${UserJoinQuery}`
								: ''
						}
						${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
						${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
					WHERE ${whereClauseSessionFeedBack}
					GROUP BY "SessionUsers".id )
					SELECT
						ROUND(AVG(sessionScore), 2) AS "sessionFeedbackScore",
						ROUND(AVG(sessionTotalScore), 0) AS "sessionFeedbackTotalCount"
					FROM SessionData;
			`;

		//////////////////////////////////////////////// VBT WT HOurse Query////////////////////////////////////////////////////////////

		let VBTWTHourseQuery = `
			SELECT
					COALESCE(SUM(CASE WHEN "Workbooks"."e_duration" IS NOT NULL THEN "Workbooks"."e_duration" ELSE 0 END), 0) AS "LearningHours"
				FROM
					"SessionUsers"
					JOIN "Sessions" ON "Sessions".id = "SessionUsers"."SessionId"
					JOIN "Workbooks" ON "Workbooks".id = "Sessions"."WorkbookId"
					${
						(countryId && countryId.length > 0) ||
						(jobRoleId && jobRoleId.length > 0) ||
						(customFields && customFields.length > 0) ||
						(tag && tag != '')
							? `${UserJoinQuery}`
							: ''
					}
					${countryId && countryId.length > 0 ? `${CountryFilterJoinQuery}` : ''}
					${jobRoleId && jobRoleId.length > 0 ? `${JobRoleFilterJoinQuery}` : ''}
			WHERE ${whereClauseVBTHourse} `;

		//////////////////////////////////////////////// final ILT Boxes Query  //////////////////////////////////

		try {
			//////////////////////////////////////  1  ///////////////////////////////////////////////

			ILTSessionCountQuery = ILTSessionCountQuery + whereClause + whereClauseSessionCount;
			ILTSessionCountQuery = ILTSessionCountQuery + ';';

			// console.log('-ILTSessionCountQuery-', ILTSessionCountQuery);
			const [ILTSessionCountResult] = await sequelize.query(ILTSessionCountQuery);
			ILTSessionCount = ILTSessionCountResult[0].ILTSessionCount || 0;

			//////////////////////////////////////  2  ///////////////////////////////////////////////

			ILTAttendanceQuery = ILTAttendanceQuery + whereClause;
			ILTAttendanceQuery = ILTAttendanceQuery + ';';

			// console.log('-ILTAttendanceQuery-', ILTAttendanceQuery);
			const [ILTAttendanceQueryResult] = await sequelize.query(ILTAttendanceQuery);
			ILTAttendance = ILTAttendanceQueryResult[0].ILTAttendance || 0;

			//////////////////////////////////////  3  ///////////////////////////////////////////////

			sessionFeedBackDataQuery = sessionFeedBackDataQuery + ';';
			// console.log('--sessionFeedBackDataQuery--', sessionFeedBackDataQuery);
			const [sessionFeedBackDataResult] = await sequelize.query(sessionFeedBackDataQuery);
			sessionFeedbackScore = sessionFeedBackDataResult[0].sessionFeedbackScore || 0;
			sessionFeedbackTotalCount = sessionFeedBackDataResult[0].sessionFeedbackTotalCount || 0;

			//////////////////////////////////////  4  ///////////////////////////////////////////////
			// console.log('--VBTWTHourseQuery--', VBTWTHourseQuery);
			const [VBTWTHourseDataResult] = await sequelize.query(VBTWTHourseQuery);
			LearningHours = VBTWTHourseDataResult[0].LearningHours || 0;
		} catch (error) {
			return ResponseError(res, error, 500, true);
		}

		///////////////////////////////////////////////////////////////////////////////////////////////////////////

		finalILTResult.ILTSessionCount = ILTSessionCount;
		finalILTResult.ILTAttendance = ILTAttendance;
		finalILTResult.sessionFeedbackScore = sessionFeedbackScore;
		finalILTResult.sessionFeedbackTotalCount = sessionFeedbackTotalCount;
		finalILTResult.LearningHours = LearningHours;

		ILTAnalyticsData.push(finalILTResult);

		let payload = {
			analyticsData: analyticsData,
			ILTAnalyticsData: ILTAnalyticsData,
		};

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoAnalyticsData = getDiwoAnalyticsData;
