const {
	Market,
	Country,
	Op,
	Currency,
	Province,
	sequelize,
	Client,
	User,
	Role,
	User_role_client_mapping,
	User_job_role_mapping,
	Client_job_role,
	User_group,
	User_group_mapping,
	Campaign,
	Campaign_drip_camp_mapping,
	Drip_camp,
	Campaign_user_group_mapping,
	Post,
	Drip_native,
	Drip_whatsapp_native,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Asset,
	Asset_detail,
	Assigned_post_to_user,
	CampUserGroupStartRule,
	CampaignTagMapping,
	DripCampUserGroupAction,
	DripUserQuestion,
	DripUserOption,
	CampWhatsAppEmailDrip,
	CampTakeAction,
	Cookie,
	License,
	UserBriefFile,
	DripQuestion,
	DripOption,
	Ticket,
	TicketConversation,
	DripSpinWheelCat,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { createNotification, getAllUserIdsForNotification } = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const { getAccountCustomField } = require('../services/client.service');
const fs = require('fs');
const archiver = require('archiver');
const Sequelize = require('sequelize');
const shortid = require('shortid');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

const getAllSubBranchClientIds = async function (clientId, type) {
	try {
		// console.log('---getAllSubBranchClientIds---', clientId, type);
		let err, ClientsDetail;
		let parentClientIds = clientId;
		let flag = true;
		let ArrayOfLastClient = [];
		let ArrayOfLastClientIds = [];
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());
		if (err) return ResponseError(res, err, 500, true);

		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: clientId,
					// category: 'Branch Account',
				},
				attributes: [
					'id',
					'name',
					'client_id',
					'category',
					'Associate_client_id',
					'DripAccess',
					'DiwoAccess',
					[sequelize.literal(`CAST(client_id AS text) || ' - ' || name`), 'account_name_with_id'],
				],
			})
		);
		if (err) console.log('--Error--getAllSubBranchClientIds - --', err);

		if (ClientsDetail) {
			ArrayOfLastClient.push(ClientsDetail);
			ArrayOfLastClientIds.push(ClientsDetail.id);
		}

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
						Associate_client_id: parentClientIds,
					},
					attributes: [
						'id',
						'name',
						'client_id',
						'category',
						'Associate_client_id',
						'DripAccess',
						'DiwoAccess',
						[sequelize.literal(`CAST(client_id AS text) || ' - ' || name`), 'account_name_with_id'],
					],
				})
			);
			if (err) console.log('--Error--getAllSubBranchClientIds--- - --', err);

			parentClientIds = [];

			if (!ClientsDetail || (ClientsDetail && ClientsDetail.length <= 0)) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				parentClientIds.push(ClientsDetail[i].id);
				let client_ = ClientsDetail[i].convertToJSON();

				// [err, parentClientsDetail] = await to(
				// 	Client.findOne({
				// 		where: {
				// 			is_deleted: false,
				// 			id: client_.Associate_client_id,
				// 		},
				// 		attributes: ['id', 'name', 'client_id', 'category', 'Associate_client_id', 'DripAccess', 'DiwoAccess'],
				// 	})
				// );
				// if (err) return ResponseError(res, err, 500, true);

				// client_.Parent_client = parentClientsDetail ? parentClientsDetail.convertToJSON() : null;
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;

				if (client_.category == 'Branch Account' || client_.category == 'Client Account') {
					if (type == 'drip' && client_.DripAccess) {
						ArrayOfLastClient.push(client_);
						ArrayOfLastClientIds.push(client_.id);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						ArrayOfLastClient.push(client_);
						ArrayOfLastClientIds.push(client_.id);
					}
				}
			}
			if (parentClientIds.length <= 0) {
				flag = false;
			}
		}
		return [ArrayOfLastClient, ArrayOfLastClientIds];
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};
module.exports.getAllSubBranchClientIds = getAllSubBranchClientIds;

// const getFilterListdata = async function (req, res) {
// 	try {
// 		// Need to find Branch List

// 		let clientId = req.user.ClientId;
// 		let getJobRoles = [];
// 		let getCountries = [];
// 		let ClientsDetail = [];
// 		let ClientdId = [];
// 		let err;

// 		[ClientsDetail, ClientdId] = await getAllSubBranchClientIds(clientId, req.user.type);

// 		// Need to find Country List
// 		[err, getCountries] = await to(
// 			Country.findAll({
// 				attributes: ['id', 'name'],
// 			})
// 		);
// 		if (err) return ResponseError(res, err, 500, true);

// 		// Need to find Job Role List
// 		if (ClientdId.length > 0) {
// 			// let whereCondition = { is_deleted: false, ClientId: ClientdId, job_role_name: { [Op.ne]: null } };
// 			// if (req.user.type == 'diwo') {
// 			// 	whereCondition.forDiwo = true;
// 			// } else if (req.user.type == 'drip') {
// 			// 	whereCondition.forDrip = true;
// 			// }
// 			// [err, getJobRoles] = await to(
// 			// 	Client_job_role.findAll({
// 			// 		where: whereCondition,
// 			// 		attributes: ['id', 'job_role_name', 'ClientId'],
// 			// 		include: [{model: Client, attributes: ['id', 'name']}]
// 			// 	})
// 			// );
// 			// if (err) return ResponseError(res, err, 500, true);

// 			const query_1 = `
// 			SELECT  "Client_job_roles".id  AS id,
// 					"Clients".name || ' - ' || "Client_job_roles".job_role_name as job_role_name,
// 					"Client_job_roles"."ClientId" AS client_id

// 	 		FROM "Client_job_roles"
// 			  		JOIN "Clients" ON "Client_job_roles"."ClientId" = "Clients".id

// 	 		WHERE "Client_job_roles".is_deleted = false
// 	   			  AND "Client_job_roles".job_role_name IS NOT NULL
// 				  AND "Client_job_roles".job_role_name != ''
// 				  AND "Client_job_roles"."ClientId" IN (${ClientdId.toString()})
// 				  AND "Client_job_roles"."forDrip" = true;`;

// 			[getJobRoles] = await sequelize.query(query_1);
// 		}

// 		//Need to Find Drip As per Client Id
// 		[err, dripDeatils] = await to(
// 			Post.findAll({
// 				where: { ClientId: ClientdId, drip_status: 'Published', is_deleted: false },
// 				attributes: ['id', 'drip_title', [sequelize.literal(`CAST(id AS text) || ' - ' || drip_title`), 'dripIdTitle']],
// 				order: [['id', 'DESC']],
// 			})
// 		);
// 		if (err) return ResponseError(res, err, 500, true);

// 		//Need to Find Campaign As per Client Id
// 		// [err, campaignDeatils] = await to(
// 		// 	Campaign.findAll({
// 		// 		where: {
// 		// 			ClientId: ClientdId,
// 		// 			isDeleted: false,
// 		// 			// status: {
// 		// 			// 	[Op.ne]: ['Draft', 'Paused', 'Deleted'],
// 		// 			// },
// 		// 		},
// 		// 		attributes: ['id', 'title', [sequelize.literal(`CAST(id AS text) || ' - ' || title`), 'campaignIdTitle']],
// 		// 		order: [['id', 'DESC']],
// 		// 	})
// 		// );
// 		// if (err) return ResponseError(res, err, 500, true);

// 		const query_2 = `
// 		SELECT "Campaigns".id AS id ,
// 			   "Campaigns".title AS title,
// 			   "Campaigns".id || ' - ' || "Campaigns".title || ' (' || "Clients".name || ')'    AS campaign_id_title
// 		FROM
// 		       "Campaigns"
// 		JOIN
// 		       "Clients" ON "Campaigns"."ClientId" = "Clients".id
// 		WHERE
//     		   "Campaigns"."isDeleted" = false AND
//       		   "Campaigns"."ClientId" IN(${ClientdId.toString()})
// 		ORDER BY
// 			   "Campaigns".id DESC ;`;

// 		[campaignDeatils] = await sequelize.query(query_2);

// 		//Get Custom Fields
// 		let customFields = await getAccountCustomField(clientId);
// 		let customFieldsData = [];
// 		if (customFields && customFields.length > 0) {
// 			for (let field of customFields) {
// 				if (field.dataType == 'Dropdown select' && field.isHide == false) {
// 					let options = [];
// 					for (let option of field.options) {
// 						if (option.isHide == false) {
// 							options.push(option);
// 						}
// 					}
// 					customFieldsData.push({
// 						dataType: field.dataType,
// 						label: field.label,
// 						options: options,
// 					});
// 				}
// 			}
// 		}

// 		let payload = {
// 			BranchList: ClientsDetail,
// 			CountryList: getCountries,
// 			JobRoleList: getJobRoles,
// 			DripList: dripDeatils,
// 			CampaignList: campaignDeatils,
// 			customFields: customFieldsData,
// 		};

// 		return ResponseSuccess(res, { data: payload }, 200);
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.getFilterListdata = getFilterListdata;

const getFilterListdata = async function (req, res) {
	try {
		let clientId = req.user.ClientId;
		let getCountries = [];
		let ClientsDetail = [];
		let ClientId = [];
		let err;

		[ClientsDetail, ClientId] = await getAllSubBranchClientIds(clientId, req.user.type);

		// Get Country List
		[err, getCountries] = await to(Country.findAll({ attributes: ['id', 'name'] }));
		if (err) return ResponseError(res, err, 500, true);

		// Get Job Role List (Only if ClientId exists)
		let getJobRoles = [];
		if (ClientId.length > 0) {
			const query_1 = `
				SELECT "Client_job_roles".id AS id,
					   "Clients".name || ' - ' || "Client_job_roles".job_role_name AS job_role_name,
					   "Client_job_roles"."ClientId" AS client_id
				FROM "Client_job_roles"
				JOIN "Clients" ON "Client_job_roles"."ClientId" = "Clients".id
				WHERE "Client_job_roles".is_deleted = false
					  AND "Client_job_roles".job_role_name IS NOT NULL
					  AND "Client_job_roles".job_role_name != ''
					  AND "Client_job_roles"."ClientId" IN (:ClientId)
					  AND "Client_job_roles"."forDrip" = true;
			`;

			getJobRoles = await sequelize.query(query_1, {
				replacements: { ClientId: Array.isArray(ClientId) ? ClientId : [ClientId] },
				type: Sequelize.QueryTypes.SELECT,
			});
		}

		// Get Drip Details
		[err, dripDetails] = await to(
			Post.findAll({
				where: { ClientId: ClientId, drip_status: 'Published', is_deleted: false },
				attributes: ['id', 'drip_title', [sequelize.literal(`CAST(id AS text) || ' - ' || drip_title`), 'dripIdTitle']],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// Get Campaign Details (Using replacements for security)
		const query_2 = `
			SELECT "Campaigns".id AS id,
				   "Campaigns".title AS title,
				   "Campaigns".id || ' - ' || "Campaigns".title || ' (' || "Clients".name || ')' AS campaign_id_title
			FROM "Campaigns"
			JOIN "Clients" ON "Campaigns"."ClientId" = "Clients".id
			WHERE "Campaigns"."isDeleted" = false
				  AND "Campaigns"."ClientId" IN (:ClientId)
			ORDER BY "Campaigns".id DESC;
		`;

		const campaignDetails = await sequelize.query(query_2, {
			replacements: { ClientId: Array.isArray(ClientId) ? ClientId : [ClientId] },
			type: Sequelize.QueryTypes.SELECT,
		});

		// Get Custom Fields
		let customFields = await getAccountCustomField(clientId);
		let customFieldsData = [];

		if (customFields && customFields.length > 0) {
			for (let field of customFields) {
				if (field.dataType === 'Dropdown select' && field.isHide === false) {
					let options = (field.options || []).filter((option) => !option.isHide);
					customFieldsData.push({
						dataType: field.dataType,
						label: field.label,
						options: options,
					});
				}
			}
		}

		// Prepare Payload
		let payload = {
			BranchList: ClientsDetail,
			CountryList: getCountries,
			JobRoleList: getJobRoles || [],
			DripList: dripDetails || [],
			CampaignList: campaignDetails || [],
			customFields: customFieldsData || [],
		};

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getFilterListdata = getFilterListdata;

// const getAllCampaignForDropdownByClientIdForAnalytics = async function (req, res) {
// 	try {
// 		let err, campaign;
// 		let ClientsDetail = [];
// 		let ClientIds = [];
// 		let clientId = parseInt(req.params.clientId);
// 		[ClientsDetail, ClientIds] = await getAllSubBranchClientIds(clientId, req.user.type);
// 		const query_1 = `
// 		SELECT "Campaigns".id AS id ,
// 			   "Campaigns".title AS title,
// 			   "Campaigns".id || ' - ' || "Campaigns".title || ' (' || "Clients".name || ')'    AS campaign_id_title
// 		FROM
// 		       "Campaigns"
// 		JOIN
// 		       "Clients" ON "Campaigns"."ClientId" = "Clients".id
// 		WHERE
//     		   "Campaigns"."isDeleted" = false AND
//       		   "Campaigns"."ClientId" IN(${ClientIds.toString()})
// 		ORDER BY
// 			   "Campaigns".id DESC ;`;

// 		[campaign] = await sequelize.query(query_1);

// 		let payload = {
// 			BranchList: ClientsDetail,
// 			CampaignList: campaign,
// 		};
// 		return ResponseSuccess(res, {
// 			data: payload,
// 		});
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.getAllCampaignForDropdownByClientIdForAnalytics = getAllCampaignForDropdownByClientIdForAnalytics;

const getAllCampaignForDropdownByClientIdForAnalytics = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let ClientsDetail = [];
		let ClientIds = [];
		let campaign;

		[ClientsDetail, ClientIds] = await getAllSubBranchClientIds(clientId, type);

		const query_1 = `
			SELECT "Campaigns".id AS id,
				   "Campaigns".title AS title,
				   "Campaigns".id || ' - ' || "Campaigns".title || ' (' || "Clients".name || ')' AS campaign_id_title
			FROM "Campaigns"
			JOIN "Clients" ON "Campaigns"."ClientId" = "Clients".id
			WHERE "Campaigns"."isDeleted" = false
				  AND "Campaigns"."ClientId" IN (:ClientIds)
			ORDER BY "Campaigns".id DESC;
		`;

		// console.log('---getAllCampaignForDropdownByClientIdForAnalytics--ClientIds----=', ClientIds);

		campaign = await sequelize.query(query_1, {
			replacements: { ClientIds: Array.isArray(ClientIds) ? ClientIds : [ClientIds] },
			type: Sequelize.QueryTypes.SELECT,
			logging: true,
		});

		let payload = {
			BranchList: ClientsDetail,
			CampaignList: campaign,
		};

		return ResponseSuccess(res, { data: payload });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getAllCampaignForDropdownByClientIdForAnalytics = getAllCampaignForDropdownByClientIdForAnalytics;

const getDripAnalyticsData = async function (req, res) {
	try {
		// let startDate = moment(req.body.date.startDate);
		// let endDate = moment(req.body.date.endDate);

		const schema = Joi.object({
			startDate: Joi.date().required(),
			endDate: Joi.date().required(),
		});

		// Example usage:
		const { error, value } = schema.validate({
			startDate: req.body.date.startDate,
			endDate: req.body.date.endDate,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		// If validation passes
		let startDate = moment(value.startDate);
		let endDate = moment(value.endDate);

		let clientId = req.user.ClientId;

		let filterdata = req.body.filterData;
		let branchId = [];
		let countryId = [];
		let jobRoleId = [];
		let dripTypes = [];
		let campaignId = [];
		let dripId = [];
		let customFields = [];
		let dripTypeList = ``;
		let tag = '';

		if (filterdata && filterdata.length > 0) {
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
				} else if (item.filterType == 'Channel') {
					for (let channel of item.selectedData) {
						if (dripTypes.indexOf(channel.id) == -1) {
							dripTypes.push(channel.id);
						}
					}
				} else if (item.filterType == 'Drip Flows') {
					for (let campaign of item.selectedData) {
						if (campaignId.indexOf(campaign.id) == -1) {
							campaignId.push(campaign.id);
						}
					}
				} else if (item.filterType == 'Drips') {
					for (let drip of item.selectedData) {
						if (dripId.indexOf(drip.id) == -1) {
							dripId.push(drip.id);
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
		}

		if (dripTypes.length > 0) {
			for (let i = 0; i < dripTypes.length; i++) {
				if (dripTypes[i] == 1) {
					dripTypes[i] = 'Only WhatsApp';
				} else if (dripTypes[i] == 2) {
					dripTypes[i] = 'DripApp with sharing on WhatsApp';
				} else if (dripTypes[i] == 7) {
					dripTypes[i] = 'Only Email';
				} else if (dripTypes[i] == 3) {
					dripTypes[i] = 'DripApp with sharing on Email';
				} else if (dripTypes[i] == 4) {
					dripTypes[i] = 'Only DripApp';
				} else if (dripTypes[i] == 5) {
					dripTypes[i] = 'Only Teams';
				} else if (dripTypes[i] == 6) {
					dripTypes[i] = 'DripApp with sharing on Teams';
				}
			}
		}

		if (dripTypes && dripTypes.length > 0) {
			for (let i = 0; i < dripTypes.length; i++) {
				if (i == 0) {
					dripTypeList = `'${dripTypes[i]}'`;
				} else {
					dripTypeList = dripTypeList + `,'` + dripTypes[i] + `'`;
				}
			}
		}

		// console.log('-----------------startDate', startDate.format('YYYY-MM-DD'));
		// console.log('-----------------endDate', endDate.format('YYYY-MM-DD'));

		// console.log('---branchId-----------', branchId);
		// console.log('---countryId-----------', countryId);
		// console.log('---jobRoleId-----------', jobRoleId);
		// console.log('---tag-----------', tag);
		// console.log('---dripTypes-----------', dripTypes);
		// console.log('---campaignId-----------', campaignId);
		// console.log('---customFields-----------', customFields);
		//Get All Sub Branch Client Ids
		let ClientsDetails = [];
		let ClientdIds = [];

		[ClientsDetails, ClientdIds] = await getAllSubBranchClientIds(clientId, req.user.type);

		if (branchId && branchId.length > 0) {
			ClientdIds = [];
			ClientdIds = branchId;
		}

		// console.log('---ClientdIds--', ClientdIds);

		//Get All data By Month

		let finalQuery = ``;

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let intervalType = 'day';
		let x_axix_column_configration = `
			date,
			TO_CHAR(d.date, 'Mon DD') AS x_axis`;
		if (endDate.diff(startDate, 'days') > 35) {
			intervalType = 'month';
			x_axix_column_configration = `
				DATE_TRUNC('month', d.date) AS month,
				TO_CHAR(DATE_TRUNC('month', d.date), 'Mon YYYY') AS x_axis`;
		}

		const query_1 = `
		SELECT 
			${x_axix_column_configration},
			COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."publishOn" IS NOT NULL) AS scheduled,
			COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."isTriggered" = true OR "CampWhatsAppEmailDrips"."sentDate" IS NOT NULL) OR ("Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP) ) AS sent,
			COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)) AS delivered,
			 COUNT(*) FILTER (WHERE (("CampWhatsAppEmailDrips"."readDate" IS NOT NULL OR "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true) AND
                            "CampWhatsAppEmailDrips"."dripType" IN ('DripApp with sharing on WhatsApp', 'DripApp with sharing on Email', 'DripApp with sharing on Teams')) OR
                           ("CampWhatsAppEmailDrips"."readDate" IS NOT NULL AND "CampWhatsAppEmailDrips"."dripType" IN ('Only WhatsApp', 'Only Email', 'Only Teams'))) AS engaged,
			COALESCE(
                   (CAST(COUNT(*) FILTER (WHERE (("CampWhatsAppEmailDrips"."readDate" IS NOT NULL OR "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true) AND
                            "CampWhatsAppEmailDrips"."dripType" IN ('DripApp with sharing on WhatsApp', 'DripApp with sharing on Email', 'DripApp with sharing on Teams')) OR
                           ("CampWhatsAppEmailDrips"."readDate" IS NOT NULL AND "CampWhatsAppEmailDrips"."dripType" IN ('Only WhatsApp', 'Only Email', 'Only Teams'))) AS FLOAT)  / NULLIF(
                                    COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL OR
                                                           ("Assigned_post_to_users"."isPublished" = true AND
                                                            "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)),
                                    0)) * 100, 0 )  AS engaged_in_per
			
	 	FROM
		 	(
				SELECT generate_series(
					DATE '${startDate.format('YYYY-MM-DD')}',
					DATE '${endDate.format('YYYY-MM-DD')}', 
					INTERVAL '1 day'
				) AS date
			) AS d
				JOIN "CampWhatsAppEmailDrips" ON DATE("CampWhatsAppEmailDrips"."publishOn") = d.date
				LEFT JOIN "Assigned_post_to_users" ON "Assigned_post_to_users".id = "CampWhatsAppEmailDrips"."AssignedPostToUserId"
				JOIN "Campaigns" ON "Campaigns".id = "CampWhatsAppEmailDrips"."CampaignId"
				JOIN "Clients" ON "Campaigns"."ClientId" = "Clients".id`;

		////////////////////////////////////////////////// JOIN TABLE Query///////////////////////////////////////////////

		const UserJoin = `
		JOIN "Users" ON "Users".id = "CampWhatsAppEmailDrips"."UserId"`;

		const CountryFilterJoinQuery = `
		JOIN "Countries" ON "Users"."CountryId" = "Countries".id`;

		const JobRoleFilterJoinQuery = `
		JOIN "User_job_role_mappings" ON "Users".id = "User_job_role_mappings"."UserId"`;

		////////////////////////////////////////////////// WHERE Query///////////////////////////////////////////////

		const baseWhereQuery = `
			WHERE "CampWhatsAppEmailDrips"."UserId" IS NOT NULL 
				AND "CampWhatsAppEmailDrips"."CampaignId" IS NOT NULL 
				AND "CampWhatsAppEmailDrips"."campaignPaused" = false
				AND "Campaigns"."isDeleted" = false 
				AND "Campaigns"."forTest" = false`;

		const CountryFilterWhereQuery = ` 
			AND "Countries".id IN (${countryId.toString()})`;

		const JobRoleFilterWhereQuery = ` 
			AND "User_job_role_mappings"."ClientJobRoleId" IN  (${jobRoleId.toString()})`;

		let TagFilterWhereQuery = ``;
		if (tag && tag.length > 0) {
			for (let tag_ of tag) {
				TagFilterWhereQuery =
					TagFilterWhereQuery +
					`
					AND "Users".tags ILIKE '%${tag_}%'`;
			}
		}
		const CampaignFilterWhereQuery = `
			AND  "Campaigns".id IN (${campaignId.toString()})`;

		const DripTypeFilterWhereQuery = `
			AND "CampWhatsAppEmailDrips"."dripType" IN (${dripTypeList})`;

		const ClientFilterWhereQuery = `
			AND "Campaigns"."ClientId" IN (${ClientdIds.toString()})`;

		const DripIdFilterWhereQuery = `
			AND "CampWhatsAppEmailDrips"."PostId" IN (${dripId.toString()})`;

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

		////////////////////////////////////////////////// GROUP BY Query///////////////////////////////////////////////

		let GroupByANDOrderByQuery = `
			GROUP BY d.date
			ORDER BY d.date ASC ;
		`;
		if (intervalType == 'month') {
			GroupByANDOrderByQuery = `
				GROUP BY month
            	ORDER BY month ASC ;
		`;
		}

		////////////////////////////////////////////////// Final Query///////////////////////////////////////////////

		finalQuery = query_1;

		///Join Query
		if (
			(countryId && countryId.length > 0) ||
			(jobRoleId && jobRoleId.length > 0) ||
			tag ||
			(customFields && customFields.length > 0)
		) {
			finalQuery = finalQuery + UserJoin;
			if (countryId && countryId.length > 0) {
				finalQuery = finalQuery + CountryFilterJoinQuery;
			}
			if (jobRoleId && jobRoleId.length > 0) {
				finalQuery = finalQuery + JobRoleFilterJoinQuery;
			}
		}

		///Where Query
		finalQuery = finalQuery + baseWhereQuery;
		if (countryId && countryId.length > 0) {
			finalQuery = finalQuery + CountryFilterWhereQuery;
		}

		if (jobRoleId && jobRoleId.length > 0) {
			finalQuery = finalQuery + JobRoleFilterWhereQuery;
		}

		if (tag) {
			finalQuery = finalQuery + TagFilterWhereQuery;
		}

		if (campaignId && campaignId.length > 0) {
			finalQuery = finalQuery + CampaignFilterWhereQuery;
		}

		if (dripTypes && dripTypes.length > 0) {
			finalQuery = finalQuery + DripTypeFilterWhereQuery;
		}

		if (ClientdIds && ClientdIds.length > 0) {
			finalQuery = finalQuery + ClientFilterWhereQuery;
		}

		if (dripId && dripId.length > 0) {
			finalQuery = finalQuery + DripIdFilterWhereQuery;
		}
		if (customFields && customFields.length > 0) {
			finalQuery = finalQuery + customFilterWhereQuery;
		}
		///Group By and Order By Query
		finalQuery = finalQuery + GroupByANDOrderByQuery;

		// console.log('-----------finalQuery---------------', finalQuery);
		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////
		let analyticsDataByMonth = [];
		[analyticsDataByMonth] = await sequelize.query(finalQuery);
		// if (err) return ResponseError(res, err, 500, true);

		const payload = await mergeWithDBData(analyticsDataByMonth, startDate, endDate, intervalType);

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripAnalyticsData = getDripAnalyticsData;

const mergeWithDBData = async function (analyticsDataByMonth, startDate, endDate, intervalType) {
	try {
		let CreateAllDateDate = [];

		let x_axis = [];
		let value = [];
		if (intervalType == 'month') {
			for (let i = 0; i < endDate.diff(startDate, `months`) + 1; i++) {
				const date = moment(startDate).add(i, 'months').format('MMM YYYY');
				CreateAllDateDate.push({ name: date });
				x_axis.push(date);
				value.push(0);
			}
		} else {
			for (let i = 0; i < endDate.diff(startDate, `days`) + 1; i++) {
				const date = moment(startDate).add(i, 'days').format('MMM DD');
				CreateAllDateDate.push({ name: date });
				x_axis.push(date);
				value.push(0);
			}
		}
		let payload = [
			{ name: 'Drips Scheduled', data: [...value] },
			{ name: 'Drips Sent', data: [...value] },
			{ name: 'Drips Delivered', data: [...value] },
			{ name: 'Drips Engaged', data: [...value] },
			{ name: 'Drips Engaged Rate', data: [...value] },
			{ name: 'X-Axis', data: x_axis },
		];

		for (let data of analyticsDataByMonth) {
			let index = CreateAllDateDate.findIndex((x) => x.name == data.x_axis);

			payload[0].data[index] = parseInt(data.scheduled);
			payload[1].data[index] = parseInt(data.sent);
			payload[2].data[index] = parseInt(data.delivered);
			payload[3].data[index] = parseInt(data.engaged);
			payload[4].data[index] = parseInt(data.engaged_in_per);
		}

		return payload;
	} catch (error) {
		console.log('---error---', error);
		return false;
	}
};

const getDripAnalyticsDataByCampaignId = async function (req, res) {
	try {
		const schema = Joi.object({
			campaignId: Joi.array().items(Joi.number().integer().positive().required()).required(),
		});
		const { error, value } = schema.validate({ campaignId: req.body.campaignId });
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { campaignId } = value;

		//Get Campign's all Drips Count Data by using CampaignId

		// let finalQuery = `
		// 	SELECT

		// 		"Drip_camps".id AS id,
		// 		"Drip_camps".index AS node_index,
		// 		"Drip_camps"."dripType" AS drip_type,
		// 		"Drip_camps"."dripName" AS node_name,
		// 		"Drip_camps".status AS node_status,
		// 		"Drip_camps"."dripTriggerDate" AS node_send_date,
		// 		("Drip_camps"."dripType" = 'Only WhatsApp' AND (
		// 			"Drip_whatsapp_natives"."quickReply1" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply2" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply3" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply4" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply5" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply6" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply7" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply8" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply9" IS NOT NULL OR
		// 			"Drip_whatsapp_natives"."quickReply10" IS NOT NULL )) AS have_quick_replay,
		// 		MAX("CampWhatsAppEmailDrips"."CampaignId") AS campaign_id,
		//         MAX("CampWhatsAppEmailDrips"."PostId") AS post_id,
		//         MAX("CampWhatsAppEmailDrips"."DripCampIndex") AS drip_camp_index,
		// 		MAX("CampWhatsAppEmailDrips"."DripCampId") AS drip_camp_id,
		// 		MAX("Posts"."tempType") AS template_type,
		// 		COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."createdAt" IS NOT NULL) AS scheduled,
		// 		COUNT(*) FILTER (WHERE ( "CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND ("CampWhatsAppEmailDrips"."isTriggered" = true OR "CampWhatsAppEmailDrips"."sentDate" IS NOT NULL)) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)) AS sent,
		// 		COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)) AS delivered,
		// 		COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."readDate" IS NOT NULL) AS read_on_every_day_channel,
		// 		(CAST(COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."readDate" IS NOT NULL) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL), 0)) * 100 AS read_rate_on_every_day_channel,
		// 		COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true ) AS read_on_drip_app,
		// 		(CAST(COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)), 0)) * 100 AS read_rate_on_drip_app,
		// 		COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isDripClickAction" = true) AS action_intent_displayed,
		// 		COUNT(*) FILTER (WHERE "Assigned_post_to_users".submit = true) AS action_taken,
		// 		(CAST(SUM("Assigned_post_to_users".score) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "Assigned_post_to_users".submit = true), 0)) AS average_action_score,
		// 		(CAST(COUNT(*) FILTER (WHERE "Assigned_post_to_users"."submit" = true) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)), 0)) * 100 AS rate_action_taken

		// 	From "Drip_camps"

		// 		JOIN "CampWhatsAppEmailDrips" ON "CampWhatsAppEmailDrips"."DripCampId" = "Drip_camps".id
		// 		LEFT JOIN "Assigned_post_to_users" ON "Assigned_post_to_users".id = "CampWhatsAppEmailDrips"."AssignedPostToUserId"
		// 		JOIN "Campaigns" ON "Campaigns".id = "CampWhatsAppEmailDrips"."CampaignId"
		// 		JOIN "Posts" ON "Drip_camps"."PostId" = "Posts".id
		// 		LEFT JOIN "Drip_whatsapp_natives" ON "Drip_whatsapp_natives"."PostId" = "Posts".id

		// 	WHERE
		// 		"Drip_camps"."dripFlowType" = 'Send a Drip' AND
		// 		"Campaigns".id IN (${campaignId.toString()})

		// 	GROUP BY "Drip_camps".id,
		// 		"Drip_camps".index,
		// 		"Drip_whatsapp_natives"."quickReply1",
		// 		"Drip_whatsapp_natives"."quickReply2",
		// 		"Drip_whatsapp_natives"."quickReply3",
		// 		"Drip_whatsapp_natives"."quickReply4",
		// 		"Drip_whatsapp_natives"."quickReply5",
		// 		"Drip_whatsapp_natives"."quickReply6",
		// 		"Drip_whatsapp_natives"."quickReply7",
		// 		"Drip_whatsapp_natives"."quickReply8",
		// 		"Drip_whatsapp_natives"."quickReply9",
		// 		"Drip_whatsapp_natives"."quickReply10"

		// 	ORDER BY "Drip_camps".id ASC;`;
		// console.log('---finalQuery---', finalQuery);
		// let getCampaignDripData = [];
		// [getCampaignDripData] = await sequelize.query(finalQuery);

		let finalQuery = `
    SELECT
        "Drip_camps".id AS id,
        "Drip_camps".index AS node_index,
        "Drip_camps"."dripType" AS drip_type,
        "Drip_camps"."dripName" AS node_name,
        "Drip_camps".status AS node_status,
        "Drip_camps"."dripTriggerDate" AS node_send_date,
        ("Drip_camps"."dripType" = 'Only WhatsApp' AND (
            "Drip_whatsapp_natives"."quickReply1" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply2" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply3" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply4" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply5" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply6" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply7" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply8" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply9" IS NOT NULL OR
            "Drip_whatsapp_natives"."quickReply10" IS NOT NULL )) AS have_quick_replay,
        MAX("CampWhatsAppEmailDrips"."CampaignId") AS campaign_id,
        MAX("CampWhatsAppEmailDrips"."PostId") AS post_id,
        MAX("CampWhatsAppEmailDrips"."DripCampIndex") AS drip_camp_index,
        MAX("CampWhatsAppEmailDrips"."DripCampId") AS drip_camp_id,
        MAX("Posts"."tempType") AS template_type,
        COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."createdAt" IS NOT NULL) AS scheduled,
        COUNT(*) FILTER (WHERE ( "CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND ("CampWhatsAppEmailDrips"."isTriggered" = true OR "CampWhatsAppEmailDrips"."sentDate" IS NOT NULL)) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)) AS sent,
        COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)) AS delivered,
        COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."readDate" IS NOT NULL) AS read_on_every_day_channel,
        (CAST(COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."readDate" IS NOT NULL) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL), 0)) * 100 AS read_rate_on_every_day_channel,
        COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true ) AS read_on_drip_app,
        (CAST(COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isRead" = true OR "Assigned_post_to_users"."isLoadOnHome" = true) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)), 0)) * 100 AS read_rate_on_drip_app,
        COUNT(*) FILTER (WHERE "Assigned_post_to_users"."isDripClickAction" = true) AS action_intent_displayed,
        COUNT(*) FILTER (WHERE "Assigned_post_to_users".submit = true) AS action_taken,
        (CAST(SUM("Assigned_post_to_users".score) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "Assigned_post_to_users".submit = true), 0)) AS average_action_score,
        (CAST(COUNT(*) FILTER (WHERE "Assigned_post_to_users"."submit" = true) AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE ("CampWhatsAppEmailDrips"."dripType" != 'Only DripApp' AND "CampWhatsAppEmailDrips"."deliveryDate" IS NOT NULL) OR ("CampWhatsAppEmailDrips"."dripType" = 'Only DripApp' AND "Assigned_post_to_users"."isPublished" = true AND "Assigned_post_to_users"."publishOn" <= CURRENT_TIMESTAMP)), 0)) * 100 AS rate_action_taken

    FROM "Drip_camps"
    
    JOIN "CampWhatsAppEmailDrips" ON "CampWhatsAppEmailDrips"."DripCampId" = "Drip_camps".id
    LEFT JOIN "Assigned_post_to_users" ON "Assigned_post_to_users".id = "CampWhatsAppEmailDrips"."AssignedPostToUserId"
    JOIN "Campaigns" ON "Campaigns".id = "CampWhatsAppEmailDrips"."CampaignId"
    JOIN "Posts" ON "Drip_camps"."PostId" = "Posts".id
    LEFT JOIN "Drip_whatsapp_natives" ON "Drip_whatsapp_natives"."PostId" = "Posts".id
    
    WHERE "Drip_camps"."dripFlowType" = 'Send a Drip' 
    AND "Campaigns".id IN (:campaignIds)

    GROUP BY "Drip_camps".id,
        "Drip_camps".index,
        "Drip_whatsapp_natives"."quickReply1",
        "Drip_whatsapp_natives"."quickReply2",
        "Drip_whatsapp_natives"."quickReply3",
        "Drip_whatsapp_natives"."quickReply4",
        "Drip_whatsapp_natives"."quickReply5",
        "Drip_whatsapp_natives"."quickReply6",
        "Drip_whatsapp_natives"."quickReply7",
        "Drip_whatsapp_natives"."quickReply8",
        "Drip_whatsapp_natives"."quickReply9",
        "Drip_whatsapp_natives"."quickReply10"

    ORDER BY "Drip_camps".id ASC;
`;

		// console.log('---finalQuery---', finalQuery);

		let getCampaignDripData = [];
		getCampaignDripData = await sequelize.query(finalQuery, {
			replacements: { campaignIds: Array.isArray(campaignId) ? campaignId : [campaignId] },
			type: Sequelize.QueryTypes.SELECT,
		});

		//Get Campaign other Data like name status, start date, end date, learner group names

		// let groupAndCampaignDetailsQuery = `
		//     SELECT
		// 		"User_groups".id                               AS group_id,
		// 		"User_groups".title                            AS group_name,
		// 		COUNT(DISTINCT "User_group_mappings"."UserId") AS user_count,
		// 		"Campaigns".id                                 AS campaign_id,
		// 		"Campaigns".title                              AS campaign_title,
		// 		"Campaigns".status                             AS campaign_status,
		// 		"Campaigns"."startDate"                        AS campaign_start_date,
		// 		"Campaigns"."endDate"                          AS campaign_end_date,
		// 		"Campaigns"."successMetrics"                   AS success_metrics,
		// 		"Campaigns"."successMetricsList"               AS success_metrics_list
		// 	FROM "User_groups"
		// 			JOIN "Campaign_user_group_mappings" ON "User_groups".id = "Campaign_user_group_mappings"."UserGroupId"
		// 			JOIN "Campaigns" ON "Campaign_user_group_mappings"."CampaignId" = "Campaigns".id
		// 			LEFT JOIN "User_group_mappings" ON "User_groups".id = "User_group_mappings"."UserGroupId"

		// 	WHERE "Campaign_user_group_mappings"."CampaignId" IN (${campaignId.toString()})
		// 	GROUP BY "User_groups".id, "Campaigns".id
		// 	ORDER BY "User_groups".id;
		// `;

		// console.log('---groupAndCampaignDetailsQuery---', groupAndCampaignDetailsQuery);
		// let campaignDetails = [];
		// [campaignDetails] = await sequelize.query(groupAndCampaignDetailsQuery);

		let groupAndCampaignDetailsQuery = `
		SELECT 
			"User_groups".id                               AS group_id,
			"User_groups".title                            AS group_name,
			COUNT(DISTINCT "User_group_mappings"."UserId") AS user_count,
			"Campaigns".id                                 AS campaign_id,
			"Campaigns".title                              AS campaign_title,
			"Campaigns".status                             AS campaign_status,
			"Campaigns"."startDate"                        AS campaign_start_date,
			"Campaigns"."endDate"                          AS campaign_end_date,
			"Campaigns"."successMetrics"                   AS success_metrics,
			"Campaigns"."successMetricsList"               AS success_metrics_list
		FROM "User_groups"
		JOIN "Campaign_user_group_mappings" ON "User_groups".id = "Campaign_user_group_mappings"."UserGroupId"
		JOIN "Campaigns" ON "Campaign_user_group_mappings"."CampaignId" = "Campaigns".id
		LEFT JOIN "User_group_mappings" ON "User_groups".id = "User_group_mappings"."UserGroupId"
		WHERE "Campaign_user_group_mappings"."CampaignId" IN (:campaignIds)
		GROUP BY "User_groups".id, "Campaigns".id
		ORDER BY "User_groups".id;
	`;

		// console.log('---groupAndCampaignDetailsQuery---', groupAndCampaignDetailsQuery);

		let campaignDetails = [];
		campaignDetails = await sequelize.query(groupAndCampaignDetailsQuery, {
			replacements: { campaignIds: Array.isArray(campaignId) ? campaignId : [campaignId] }, // Ensure campaignId is always an array
			type: Sequelize.QueryTypes.SELECT, // Specify query type for better performance
		});

		let totalLearnerCount = 0;
		let groupNames = [];
		if (campaignDetails && campaignDetails.length > 0) {
			for (let item of campaignDetails) {
				groupNames.push(item.group_name);
				totalLearnerCount = totalLearnerCount + parseInt(item.user_count);
			}
		}

		//For Test Drip Flow For Self Test
		// if (campaignDetails.length == 0) {
		// 	let groupAndCampaignDetailsQuery_2 = `
		// 		SELECT
		// 			"Campaigns".id                                 AS campaign_id,
		// 			"Campaigns".title                              AS campaign_title,
		// 			"Campaigns".status                             AS campaign_status,
		// 			"Campaigns"."startDate"                        AS campaign_start_date,
		// 			"Campaigns"."endDate"                          AS campaign_end_date,
		// 			"Campaigns"."successMetrics"                   AS success_metrics,
		// 			"Campaigns"."successMetricsList"               AS success_metrics_list
		// 		FROM "Campaigns"
		// 		WHERE "Campaigns".id IN (${campaignId.toString()})
		// 		ORDER BY "Campaigns".id;
		// 	`;
		// 	[campaignDetails] = await sequelize.query(groupAndCampaignDetailsQuery_2);
		// }

		if (campaignDetails.length == 0) {
			let groupAndCampaignDetailsQuery_2 = `
				SELECT 
					"Campaigns".id                                 AS campaign_id,
					"Campaigns".title                              AS campaign_title,
					"Campaigns".status                             AS campaign_status,
					"Campaigns"."startDate"                        AS campaign_start_date,
					"Campaigns"."endDate"                          AS campaign_end_date,
					"Campaigns"."successMetrics"                   AS success_metrics,
					"Campaigns"."successMetricsList"               AS success_metrics_list
				FROM "Campaigns"
				WHERE "Campaigns".id IN (:campaignIds)
				ORDER BY "Campaigns".id;
			`;

			campaignDetails = await sequelize.query(groupAndCampaignDetailsQuery_2, {
				replacements: { campaignIds: campaignId }, // Use replacements to safely pass parameters
				type: Sequelize.QueryTypes.SELECT, // Ensures it's a SELECT query
			});
		}

		//For Success Metrics
		let successMetricsData = [];

		if (campaignDetails[0]?.success_metrics === true) {
			let noNeedToRunQueryType = [
				'Scheduled',
				'Sent',
				'Sent Rate',
				'Delivered',
				'Delivered Rate',
				'Read on Channel',
				'Read Rate on Channel',
				'Read on Drip App',
				'Read Rate on Drip App',
				'Average Score',
			];
			for (let metric of campaignDetails[0].success_metrics_list) {
				if (noNeedToRunQueryType.indexOf(metric.metrics) > -1) {
					let value = 0;
					let totalSent = 0;
					let totalDelivered = 0;
					let totalScheduled = 0;
					let readOnChannel = 0;
					let readOnDripApp = 0;
					for (let index of metric.DripCampIndex) {
						for (let data of getCampaignDripData) {
							if (data.node_index === index) {
								if (metric.metrics === 'Scheduled') {
									value = value + parseInt(data.scheduled);
								} else if (metric.metrics === 'Sent') {
									value = value + parseInt(data.sent);
								} else if (metric.metrics === 'Sent Rate') {
									totalSent = totalSent + parseInt(data.sent);
									totalScheduled = totalScheduled + parseInt(data.scheduled);
								} else if (metric.metrics === 'Delivered') {
									value = value + parseInt(data.delivered);
								} else if (metric.metrics === 'Delivered Rate') {
									totalDelivered = totalDelivered + parseInt(data.delivered);
									totalSent = totalSent + parseInt(data.sent);
								} else if (metric.metrics === 'Read on Channel') {
									value = value + parseInt(data.read_on_every_day_channel);
								} else if (metric.metrics === 'Read Rate on Channel') {
									readOnChannel = readOnChannel + parseInt(data.read_on_every_day_channel);
									totalDelivered = totalDelivered + parseInt(data.delivered);
								} else if (metric.metrics === 'Read on Drip App') {
									value = value + parseInt(data.read_on_drip_app);
								} else if (metric.metrics === 'Read Rate on Drip App') {
									readOnDripApp = readOnDripApp + parseInt(data.read_on_drip_app);
									totalDelivered = totalDelivered + parseInt(data.delivered);
									// value = value + parseInt(data.read_rate_on_drip_app);
								} else if (metric.metrics === 'Average Score') {
									value = value + parseInt(data.average_action_score);
								}
							}
						}
					}

					if (metric.metrics === 'Sent Rate') {
						value = (totalSent / totalScheduled) * 100;
					} else if (metric.metrics === 'Delivered Rate') {
						value = (totalDelivered / totalSent) * 100;
					} else if (metric.metrics === 'Read Rate on Channel') {
						value = (readOnChannel / totalDelivered) * 100;
					} else if (metric.metrics === 'Read Rate on Drip App') {
						value = (readOnDripApp / totalDelivered) * 100;
					}

					successMetricsData.push({
						label: metric.label,
						metrics: metric.metrics,
						value: value,
					});
				} else {
					// Learning Content And Other All (Commans)
					// 'External Link Click'
					// 'External Link Click Rate'
					// Single Image, Carousal, Video

					let value = 0;

					for (let index of metric.DripCampIndex) {
						let query = ``;
						for (let data of getCampaignDripData) {
							if (data.node_index === index) {
								const CampaignId = data.campaign_id;
								const DripCampIndex = data.drip_camp_index;

								// 'External Link Click' 'External Link Click Rate' ==>> 'Single Image', 'Carousel', 'Video'
								if (metric.metrics === 'External Link Click') {
									if (['Single Image', 'Carousel', 'Video'].indexOf(data.template_type) > -1) {
										query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users"."clickExternalLink" = true AND
													"CampaignId" = ${CampaignId} AND
													"DripCampIndex" = ${DripCampIndex};`;
									}
								} else if (metric.metrics === 'External Link Click Rate') {
									//External Link Click Rate
									if (['Single Image', 'Carousel', 'Video'].indexOf(data.template_type) > -1) {
										query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "clickExternalLink" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio`;
									}
								}

								//'Read on Drip App/External Source' 'Read Rate on Drip App/External Source' ==>> Only WhatsApp
								else if (metric.metrics === 'Read on Drip App/External Source') {
									if (data.drip_type === 'Only WhatsApp') {
										query = `
										SELECT COUNT(*)
											FROM "CampWhatsAppEmailDrips"
											WHERE ("CampWhatsAppEmailDrips"."clickExternalLink" = true AND "CampWhatsAppEmailDrips"."readDate" IS NOT NULL)
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex};`;
									}
								} else if (metric.metrics === 'Read Rate on Drip App/External Source') {
									if (data.drip_type === 'Only WhatsApp') {
										query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "CampWhatsAppEmailDrips"
											WHERE ("clickExternalLink" = true AND "CampWhatsAppEmailDrips"."readDate" IS NOT NULL)
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "CampWhatsAppEmailDrips"
													WHERE "deliveryDate" is NOT NULL
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100
											AS ratio;`;
									}
								}

								//For Carousal
								// 'Swipe Intent on Carousal' 'Swipe Intent Rate' 'Average No. of Swipes' ==>> 'Carousal'
								else if (metric.metrics === 'Swipe Intent on Carousal') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users"."isDripClickAction" = true AND
													"CampaignId" = ${CampaignId} AND
													"DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Swipe Intent Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "isDripClickAction" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio`;
								} else if (metric.metrics === 'Average No. of Swipes') {
									query = `
											SELECT AVG(score)
												FROM "Assigned_post_to_users"
												WHERE "isRead" = true AND "CampaignId" = ${CampaignId}
																AND "DripCampIndex" = ${DripCampIndex};
												`;
								}

								//For Quiz
								else if (metric.metrics === 'Quiz Attempted') {
									query = `
									SELECT COUNT(*)
										FROM "Assigned_post_to_users"
										WHERE "Assigned_post_to_users"."isDripClickAction" = true
										AND "CampaignId" = ${CampaignId}
										AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Quiz Attempt Rate') {
									query = `
									SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
										FROM "Assigned_post_to_users"
										WHERE "isDripClickAction" = true AND
										"CampaignId" = ${CampaignId} AND
										"DripCampIndex" = ${DripCampIndex}) /
									NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "isRead" = true AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Quiz Submitted') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users".submit = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Quiz Submitted Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "submit" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								}

								// else if (metric.metrics === 'Average Score') {
								// 	query = `
								// 			SELECT AVG(score)
								// 				FROM "Assigned_post_to_users"
								// 				WHERE "isRead" = true AND "CampaignId" = ${CampaignId}
								// 								AND "DripCampIndex" = ${DripCampIndex};
								// 				`;
								// }

								//For Spin The Wheel
								else if (metric.metrics === 'Spin The Wheel Attempted') {
									query = `
									SELECT COUNT(*)
										FROM "Assigned_post_to_users"
										WHERE "Assigned_post_to_users"."isDripClickAction" = true
										AND "CampaignId" = ${CampaignId}
										AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Spin The Wheel Attempt Rate') {
									query = `
									SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
										FROM "Assigned_post_to_users"
										WHERE "isDripClickAction" = true AND
										"CampaignId" = ${CampaignId} AND
										"DripCampIndex" = ${DripCampIndex}) /
									NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "isRead" = true AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Spin The Wheel Submitted') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users".submit = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Spin The Wheel Submitted Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "submit" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Score is greater than/less than/equal to') {
									let condition = ``;
									if (metric.activityScoreType === 'Greater than') {
										condition = `>`;
									} else if (metric.activityScoreType === 'Less than') {
										condition = `<`;
									} else if (metric.activityScoreType === 'Equal') {
										condition = `=`;
									}

									query = `
											SELECT COUNT(*)
												FROM "Assigned_post_to_users"
												WHERE "Assigned_post_to_users".score ${condition} ${parseInt(metric.score)}
												AND "isRead" = true
												AND "CampaignId" = ${CampaignId}
												AND "DripCampIndex" = ${DripCampIndex};`;
								}

								//Video
								// 'Total Number of Video Plays' 'Video Play Rate' 'Average Watch Time' 'Watched more than/less than'
								else if (metric.metrics === 'Total Number of Video Plays') {
									query = `
									SELECT COUNT(*)
										FROM "Assigned_post_to_users"
										WHERE "Assigned_post_to_users"."isDripClickAction" = true
										AND "CampaignId" = ${CampaignId}
										AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Video Play Rate') {
									query = `
									SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
										FROM "Assigned_post_to_users"
										WHERE "isDripClickAction" = true AND
										"CampaignId" = ${CampaignId} AND
										"DripCampIndex" = ${DripCampIndex}) /
									NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "isRead" = true AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Average Watch Time') {
									query = `
											SELECT AVG(seconds)
												FROM "Assigned_post_to_users"
												WHERE "isRead" = true AND "CampaignId" = ${CampaignId}
																AND "DripCampIndex" = ${DripCampIndex};
												`;
								} else if (metric.metrics === 'Watched more than/less than') {
									let condition = ``;
									if (metric.activityScoreType === 'Greater than') {
										condition = `>`;
									} else if (metric.activityScoreType === 'Less than') {
										condition = `<`;
									}

									query = `
											SELECT COUNT(*)
												FROM "Assigned_post_to_users"
												WHERE "Assigned_post_to_users".seconds ${condition} ${parseInt(metric.score)}
												AND "isRead" = true
												AND "CampaignId" = ${CampaignId}
												AND "DripCampIndex" = ${DripCampIndex};`;
								}

								//Poll
								// 'Poll Attempted' 'Poll Attempt Rate' 'Poll Submitted' 'Poll Submission Rate' 'Option Selected'
								else if (metric.metrics === 'Poll Attempted') {
									query = `
										SELECT COUNT(*)
											FROM "Assigned_post_to_users"
											WHERE "Assigned_post_to_users"."isDripClickAction" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Poll Attempt Rate') {
									query = `
											SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
												FROM "Assigned_post_to_users"
												WHERE "isDripClickAction" = true AND
												"CampaignId" = ${CampaignId} AND
												"DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true AND
													"CampaignId" = ${CampaignId} AND
													"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Poll Submitted') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users".submit = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Poll Submission Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "submit" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Option Selected' && data.template_type === 'Poll') {
									query = `
										SELECT COUNT(DISTINCT "Assigned_post_to_users"."UserId")
											FROM "Assigned_post_to_users"
											JOIN "DripUserQuestions" ON "Assigned_post_to_users"."id" = "DripUserQuestions"."AssignedPostToUserId"
											JOIN "DripUserOptions" ON "DripUserQuestions"."id" = "DripUserOptions"."DripUserQuestionId"
											WHERE "DripUserOptions"."selectedAns" = true AND "DripUserOptions"."DripOptionId" = ${metric.DripOptionId} AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex};`;
								}

								//Survey 'Survey Initiated' 'Survey Inititated Rate', 'Survey Submitted' 'Survey Submission Rate' 'Option Selected' 'Rating is more than/less than/equal to'
								else if (metric.metrics === 'Survey Initiated') {
									query = `
										SELECT COUNT(*)
											FROM "Assigned_post_to_users"
											WHERE "Assigned_post_to_users"."isDripClickAction" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Survey Inititated Rate') {
									query = `
											SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
												FROM "Assigned_post_to_users"
												WHERE "isDripClickAction" = true AND
												"CampaignId" = ${CampaignId} AND
												"DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true AND
													"CampaignId" = ${CampaignId} AND
													"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Survey Submitted') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users".submit = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Survey Submission Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "submit" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Option Selected' && data.template_type === 'Survey') {
									query = `
										SELECT COUNT(DISTINCT "Assigned_post_to_users"."UserId")
											FROM "Assigned_post_to_users"
											JOIN "DripUserQuestions" ON "Assigned_post_to_users"."id" = "DripUserQuestions"."AssignedPostToUserId"
											JOIN "DripUserOptions" ON "DripUserQuestions"."id" = "DripUserOptions"."DripUserQuestionId"
											WHERE "DripUserOptions"."selectedAns" = true AND "DripUserOptions"."DripOptionId" = ${metric.DripOptionId} AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Rating is more than/less than/equal to') {
									let condition = ``;
									if (metric.activityScoreType === 'Greater than') {
										condition = `>`;
									} else if (metric.activityScoreType === 'Less than') {
										condition = `<`;
									} else if (metric.activityScoreType === 'Equal') {
										condition = `=`;
									}

									query = `
										SELECT COUNT(DISTINCT "Assigned_post_to_users"."UserId")
											FROM "Assigned_post_to_users"
											JOIN "DripUserQuestions" ON "Assigned_post_to_users"."id" = "DripUserQuestions"."AssignedPostToUserId"
											JOIN "DripUserOptions" ON "DripUserQuestions"."id" = "DripUserOptions"."DripUserQuestionId"
											WHERE "DripUserOptions"."selectedAns" = true AND "DripUserOptions".sr_no ${condition} ${parseInt(metric.score)} AND
											"CampaignId" = ${CampaignId} AND
											"DripCampIndex" = ${DripCampIndex};`;
									// console.log('---query---', query);
								}

								//Offline Task 'Task Attempted' 'Task Attempted Rate' 'Task Submitted' 'Task Submission Rate' 'Grade is'
								else if (metric.metrics === 'Task Attempted') {
									query = `
										SELECT COUNT(*)
											FROM "Assigned_post_to_users"
											WHERE "Assigned_post_to_users"."isDripClickAction" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Task Attempted Rate') {
									query = `
											SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
												FROM "Assigned_post_to_users"
												WHERE "isDripClickAction" = true AND
												"CampaignId" = ${CampaignId} AND
												"DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true AND
													"CampaignId" = ${CampaignId} AND
													"DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Task Submitted') {
									query = `SELECT COUNT(*)
													FROM "Assigned_post_to_users"
													WHERE "Assigned_post_to_users".submit = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex};`;
								} else if (metric.metrics === 'Task Submission Rate') {
									query = `
										SELECT ((SELECT CAST(COUNT(*) AS FLOAT)
											FROM "Assigned_post_to_users"
											WHERE "submit" = true
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex}) /
											NULLIF((SELECT CAST(COUNT(*) AS FLOAT)
													FROM "Assigned_post_to_users"
													WHERE "isRead" = true
													AND "CampaignId" = ${CampaignId}
													AND "DripCampIndex" = ${DripCampIndex}), 0)) * 100 AS ratio;`;
								} else if (metric.metrics === 'Grade is') {
									//Need to Check With Sir
									query = `SELECT COUNT(*)
												FROM "UserBriefFiles"
												WHERE "CampaignId" = ${CampaignId}
												AND "DripCampIndex" = ${DripCampIndex}
												AND grade ilike '${metric.offlineTaskText}';`;
								}

								//For Only WhatsApp
								else if (metric.metrics === 'Quick Reply Selected') {
									query = `
										SELECT COUNT(*)
											FROM "CampWhatsAppEmailDrips"
											WHERE "CampWhatsAppEmailDrips"."readDate" IS NOT NULL
											AND ("CampWhatsAppEmailDrips"."quickReplyResponse" ILIKE '%${metric.quickReply}%' )
											AND "CampaignId" = ${CampaignId}
											AND "DripCampIndex" = ${DripCampIndex};`;
								}

								break;
							}
						}
						// console.log('--getCampaignDripData--', getCampaignDripData);
						if (query) {
							[data] = await sequelize.query(query);

							if (data[0] && data[0].count && data[0].count != null) {
								//For Count
								value = value + parseInt(data[0].count);
							} else if (data[0] && data[0].ratio && data[0].ratio != null) {
								//For Ratio
								value = value + parseFloat(data[0].ratio).toFixed(2);
							} else if (data[0] && data[0].avg && data[0].avg != null) {
								// For Average
								value = value + parseFloat(data[0].avg).toFixed(2);
							}
							query = null;
						}
					}

					successMetricsData.push({
						label: metric.label,
						metrics: metric.metrics,
						value: value,
					});
				}
			}
		}

		//Check Data from Main Query
		//If array of data is empty then get data by using Manual Query By using CampaignId
		if (campaignId && getCampaignDripData.length === 0) {
			let getDetails;
			//Get Campaign data
			[err, getDetails] = await to(
				Campaign.findOne({
					where: { id: parseInt(campaignId) },
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							where: { dripFlowType: 'Send a Drip' },
							include: [
								{
									model: Post,
									attributes: ['id', 'tempType'],
									include: [{ model: DripQuestion, attributes: ['questionType'] }],
								},
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (getDetails) {
				for (let dripDetails of getDetails.Drip_camps) {
					let dripData = {};
					let downloadFileForOfflineTask = false;
					if (dripDetails.Post.tempType === 'Offline Task') {
						if (dripDetails.Post?.DripQuestions) {
							for (let question of dripDetails.Post.DripQuestions) {
								if (question.questionType != 'Voice Input') {
									downloadFileForOfflineTask = true;
									break;
								}
							}
						}
					}
					dripData.action_intent_displayed = '0';
					dripData.action_taken = '0';
					dripData.average_action_score = null;
					dripData.campaign_id = campaignId;
					dripData.delivered = '0';
					dripData.drip_camp_id = dripDetails.id;
					dripData.drip_camp_index = dripDetails.index;
					dripData.drip_type = dripDetails.dripType;
					dripData.have_quick_replay = false;
					dripData.id = dripDetails.id;
					dripData.node_index = dripDetails.index;
					dripData.node_name = dripDetails.dripName;
					dripData.node_send_date = dripDetails.dripTriggerDate;
					dripData.node_status = dripDetails.status;
					dripData.post_id = dripDetails.PostId;
					dripData.rate_action_taken = '0';
					dripData.read_on_drip_app = '0';
					dripData.read_on_every_day_channel = '0';
					dripData.read_rate_on_drip_app = '0';
					dripData.read_rate_on_every_day_channel = '0';
					dripData.scheduled = '0';
					dripData.sent = '0';
					dripData.template_type = dripDetails.Post.tempType;
					dripData.downloadFileForOfflineTask = downloadFileForOfflineTask;
					getCampaignDripData.push(dripData);
				}
			}
		} else {
			for (let data of getCampaignDripData) {
				//Check for Offline Task Download Files option
				if (data.template_type == 'Offline Task') {
					let downloadFileForOfflineTask = false;
					//Get Question Data
					[err, QuestionDetails] = await to(
						DripQuestion.findAll({
							where: {
								PostId: data.post_id,
							},
							attributes: ['questionType', 'isFileSubmission'],
						})
					);
					if (err) {
						return ResponseError(res, err, 500, true);
					}

					for (let questionType of QuestionDetails) {
						if (questionType.questionType != 'Voice Input' && questionType.isFileSubmission == true) {
							downloadFileForOfflineTask = true;
							break;
						}
					}
					data.downloadFileForOfflineTask = downloadFileForOfflineTask;
				} else {
					data.downloadFileForOfflineTask = false;
				}
			}
		}

		let payload = {
			campaignDetails: campaignDetails,
			campaignDripData: getCampaignDripData,
			totalLearnerCount: totalLearnerCount,
			lernerGroupNames: groupNames,
			successMetrics: successMetricsData,
		};

		return ResponseSuccess(res, { data: payload }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripAnalyticsDataByCampaignId = getDripAnalyticsDataByCampaignId;

const getDripQuizDataByUsingDripIndexAndCampaignId = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be > 0
			post_id: Joi.number().integer().positive().required(), // Must be > 0
			drip_camp_Index: Joi.number().integer().min(0).required(), // Must be >= 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Extract validated values
		let { campaign_id: CampaignId, post_id: DripId, drip_camp_Index: DripCampIndex } = value;

		let finalQuery = ``;

		//Get All Question's Data By using CampaignId, DripId, DripCampIndex
		[err, questionList] = await to(
			Post.findOne({
				where: { id: DripId },
				include: [{ model: DripQuestion, attributes: ['id', 'question', 'questionType'] }],
				attributes: ['id', 'tempType', 'quizRandCount'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let question_scores = `
		WITH question_scores AS (
			SELECT
				"Users".id AS user_id,
				"Users".account_id AS account_id,
				"Assigned_post_to_users"."PostId" AS post_id,
				"Assigned_post_to_users"."CampaignId" AS campaign_id,
				"DripUserQuestions".question,
				"Assigned_post_to_users".submit,
				"Assigned_post_to_users".hyperlink AS hyper_link,
				"Posts"."tempType",
				"DripUserQuestions"."questionType",
				SUM(CASE WHEN "DripUserOptions"."correctAns" = true THEN 1 ELSE 0 END) as correct_count,
				SUM(CASE WHEN "DripUserOptions"."correctAns" = true AND "DripUserOptions"."selectedAns" = true THEN 1 ELSE 0 END) as selected_correct_count,
				SUM(CASE WHEN "DripUserOptions"."selectedAns" = true  THEN 1 ELSE 0 END) as selected_option_count,
				SUM(CASE WHEN "DripUserOptions".id IS NOT NULL  THEN 1 ELSE 0 END) as option_count,
				SUM(CASE WHEN "DripUserOptions".sr_no = "DripUserOptions"."userSeq" THEN 1 ELSE 0 END) as correct_sequence_count,
				STRING_AGG(CASE WHEN  "Assigned_post_to_users".submit = true AND "DripUserOptions"."selectedAns" = true THEN CAST("DripUserOptions".sr_no AS VARCHAR) ELSE NULL END, ',' ORDER BY "DripUserOptions".sr_no ASC ) AS selected_options,
		        STRING_AGG(CASE WHEN  "Assigned_post_to_users".submit = true AND"DripUserOptions"."userSeq" > 0 THEN CAST("DripUserOptions"."userSeq" AS VARCHAR) ELSE NULL END, ',' ORDER BY "DripUserOptions".sr_no ASC) AS user_sequence


			FROM "Assigned_post_to_users"
			JOIN "DripUserQuestions" ON "DripUserQuestions"."AssignedPostToUserId" = "Assigned_post_to_users".id
			JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
			JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
			JOIN "Posts" ON "Posts".id = "Assigned_post_to_users"."PostId"
			WHERE "Assigned_post_to_users"."CampaignId" = ${CampaignId} And "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex}
			GROUP BY "Users".id , "DripUserQuestions".question, "Assigned_post_to_users".submit, "Posts"."tempType", "DripUserQuestions"."questionType" , "Assigned_post_to_users"."PostId", "Assigned_post_to_users"."CampaignId",  "Users".account_id, "Assigned_post_to_users".hyperlink
		)`;

		//Create Question text logic by using question list

		let questionText = `
			SELECT
				user_id,
				account_id,
				post_id,
				campaign_id,
				hyper_link,
			`;
		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			for (let question of questionList.DripQuestions) {
				count++;
				if (question.question != null && question.question != '') {
					let que = question.question.replaceAll("'", "''");
					questionText =
						questionText +
						`
					MAX(CASE
						WHEN submit = false AND question = '${que}' THEN 0
						WHEN question = '${que}' AND "tempType" IN('Quiz','Quiz (Randomised)') AND "questionType" = 'MCQ' AND correct_count = 1 AND selected_correct_count = 1 THEN 2
                        WHEN question = '${que}' AND "tempType" IN('Quiz','Quiz (Randomised)') AND "questionType" = 'MCQ' AND correct_count > 1 AND correct_count = selected_correct_count AND selected_option_count = correct_count  THEN 2
                        WHEN question = '${que}' AND "tempType" IN('Quiz','Quiz (Randomised)') AND "questionType" = 'MCQ' AND correct_count > 1 AND  selected_correct_count >= 1  THEN 1
                        WHEN question = '${que}' AND "tempType" IN('Quiz','Quiz (Randomised)') AND "questionType" = 'Drag and Drop' AND option_count = correct_sequence_count THEN 2
						ELSE 0
					END) AS question_${count} ,
					`;
					if (question.questionType === 'Drag and Drop') {
						questionText =
							questionText +
							`
						MAX(CASE WHEN question = '${que}' THEN user_sequence END) AS question_${count}_selected_options`;
					} else if (question.questionType === 'MCQ') {
						questionText =
							questionText +
							`
						MAX(CASE WHEN question = '${que}' THEN selected_options END) AS question_${count}_selected_options`;
					}
					if (count < questionList.DripQuestions.length) {
						questionText = questionText + `,`;
					}
				}
			}
		}

		///////////////////////////////////////GROUP BY AND ORDER BY Query///////////////////////////////////////////////
		let lastGroupAndOrderByQuery = `
		FROM question_scores
			GROUP BY user_id, post_id, campaign_id, account_id, hyper_link
			ORDER BY user_id;`;

		///////////////////////////////////////Final Query///////////////////////////////////////////////
		finalQuery = question_scores + questionText + lastGroupAndOrderByQuery;

		// console.log('-----------finalQuery---------------', finalQuery);
		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////
		let quizDripData = [];
		[quizDripData] = await sequelize.query(finalQuery);
		let srNo = 0;
		let maximumPossibleScore = questionList.DripQuestions.length * 2;
		if (questionList.tempType === 'Quiz (Randomised)') {
			maximumPossibleScore = questionList.quizRandCount * 2;
		}
		if (quizDripData && quizDripData.length > 0) {
			let addHyperLinkColumn = false;
			for (let data of quizDripData) {
				if (data['hyper_link'] && data['hyper_link'] != null) {
					addHyperLinkColumn = true;
					break;
				}
			}
			for (let data of quizDripData) {
				srNo++;
				data['SR NO'] = srNo;
				data[`CONTACT ID`] = data[`account_id`];
				data[`DRIP ID`] = data['post_id'];
				data[`DRIP FLOW ID`] = data['campaign_id'];

				let totalScore = 0;
				for (let i = 1; i <= questionList.DripQuestions.length; i++) {
					totalScore = totalScore + data[`question_${i}`];
					data[`Q${i} - ${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`] = data[
						`question_${i}_selected_options`
					]
						? data[`question_${i}_selected_options`]
						: '';
					data[`Q${i} - SCORE`] = data[`question_${i}`];
					delete data[`question_${i}`];
					delete data[`question_${i}_selected_options`];
				}
				data['MAXIMUM POSSIBLE SCORE'] = maximumPossibleScore;
				data['TOTAL SCORE'] = totalScore;
				if (addHyperLinkColumn) {
					data['HYPERLINK CLICK'] = data['hyper_link'] ? data['hyper_link'] : ' ';
				}

				delete data[`account_id`];
				delete data[`post_id`];
				delete data['campaign_id'];
				delete data[`user_id`];
				delete data['hyper_link'];
			}
		}

		return ResponseSuccess(res, { data: quizDripData }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripQuizDataByUsingDripIndexAndCampaignId = getDripQuizDataByUsingDripIndexAndCampaignId;

//Drip SPin The Wheel Report Data
const getSpinTheWheelDataByDripIndexAndCampaignId = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be > 0
			post_id: Joi.number().integer().positive().required(), // Must be > 0
			drip_camp_Index: Joi.number().integer().min(0).required(), // Must be >= 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Extract validated values
		let { campaign_id: CampaignId, post_id: DripId, drip_camp_Index: DripCampIndex } = value;

		let finalQuery = ``;

		//Get All Question's Data By using CampaignId, DripId, DripCampIndex
		[err, questionList] = await to(
			Post.findOne({
				where: { id: DripId },
				include: [
					{
						model: DripQuestion,
						include: [
							{
								model: DripSpinWheelCat,
								attributes: ['id', 'category_name', 'category_index'],
							},
						],
						attributes: ['id', 'question', 'questionType', 'spinQueScore'],
					},
				],
				attributes: ['id', 'tempType'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let question_scores = `
		WITH question_scores AS (
			SELECT
				"Users".id AS user_id,
				"Users".account_id AS account_id,
				"Assigned_post_to_users"."PostId" AS post_id,
				"Assigned_post_to_users"."CampaignId" AS campaign_id,
				"Assigned_post_to_users"."assignSpinQue" AS assign_spin_que,
				"Assigned_post_to_users".score AS score,
				"DripUserQuestions".question,
				"Assigned_post_to_users".submit,
				"Assigned_post_to_users".hyperlink AS hyper_link,
				"Posts"."tempType",
				"DripUserQuestions"."questionType",
				SUM(CASE WHEN "DripUserOptions"."correctAns" = true THEN 1 ELSE 0 END) as correct_count,
				SUM(CASE WHEN "DripUserOptions"."correctAns" = true AND "DripUserOptions"."selectedAns" = true THEN 1 ELSE 0 END) as selected_correct_count,
				SUM(CASE WHEN "DripUserOptions"."selectedAns" = true  THEN 1 ELSE 0 END) as selected_option_count,
				SUM(CASE WHEN "DripUserOptions".id IS NOT NULL  THEN 1 ELSE 0 END) as option_count,
				SUM(CASE WHEN "DripUserOptions".sr_no = "DripUserOptions"."userSeq" THEN 1 ELSE 0 END) as correct_sequence_count,
				STRING_AGG(CASE WHEN  "Assigned_post_to_users".submit = true AND "DripUserOptions"."selectedAns" = true THEN CAST("DripUserOptions".sr_no AS VARCHAR) ELSE NULL END, ',' ORDER BY "DripUserOptions".sr_no ASC ) AS selected_options,
		        STRING_AGG(CASE WHEN  "Assigned_post_to_users".submit = true AND"DripUserOptions"."userSeq" > 0 THEN CAST("DripUserOptions"."userSeq" AS VARCHAR) ELSE NULL END, ',' ORDER BY "DripUserOptions".sr_no ASC) AS user_sequence


			FROM "Assigned_post_to_users"
			JOIN "DripUserQuestions" ON "DripUserQuestions"."AssignedPostToUserId" = "Assigned_post_to_users".id
			JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
			JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
			JOIN "Posts" ON "Posts".id = "Assigned_post_to_users"."PostId"
			WHERE "Assigned_post_to_users"."CampaignId" = ${CampaignId} And "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex}
			GROUP BY "Users".id , "DripUserQuestions".question, "Assigned_post_to_users".submit, "Posts"."tempType", "DripUserQuestions"."questionType" , "Assigned_post_to_users"."PostId", "Assigned_post_to_users"."CampaignId",  "Users".account_id, "Assigned_post_to_users".hyperlink,
			"Assigned_post_to_users"."assignSpinQue","Assigned_post_to_users".score
		)`;

		//Create Question text logic by using question list
		let questionText = `
			SELECT
				user_id,
				account_id,
				post_id,
				campaign_id,
				hyper_link,
				score,
				assign_spin_que,
			`;
		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			for (let question of questionList.DripQuestions) {
				count++;
				if (question.question != null && question.question != '') {
					let que = question.question.replaceAll("'", "''");
					questionText =
						questionText +
						`
					MAX(CASE
						WHEN submit = false AND question = '${que}' THEN 0
						WHEN question = '${que}' AND "tempType" IN('Spin The Wheel') AND "questionType" = 'MCQ' AND correct_count = 1 AND selected_correct_count = 1 THEN ${question.spinQueScore}
                        WHEN question = '${que}' AND "tempType" IN('Spin The Wheel') AND "questionType" = 'MCQ' AND correct_count > 1 AND correct_count = selected_correct_count AND selected_option_count = correct_count  THEN ${question.spinQueScore}
                        WHEN question = '${que}' AND "tempType" IN('Spin The Wheel') AND "questionType" = 'MCQ' AND correct_count > 1 AND  selected_correct_count >= 1  THEN  ROUND( ${question.spinQueScore} * 1.0/ 2, 1)
                        WHEN question = '${que}' AND "tempType" IN('Spin The Wheel') AND "questionType" = 'Drag and Drop' AND option_count = correct_sequence_count THEN ${question.spinQueScore}
						ELSE 0
					END) AS question_${count} ,
					`;
					if (question.questionType === 'Drag and Drop') {
						questionText =
							questionText +
							`
						MAX(CASE WHEN question = '${que}' THEN user_sequence END) AS question_${count}_selected_options`;
					} else if (question.questionType === 'MCQ') {
						questionText =
							questionText +
							`
						MAX(CASE WHEN question = '${que}' THEN selected_options END) AS question_${count}_selected_options`;
					}
					if (count < questionList.DripQuestions.length) {
						questionText = questionText + `,`;
					}
				}
			}
		}

		///////////////////////////////////////GROUP BY AND ORDER BY Query///////////////////////////////////////////////
		let lastGroupAndOrderByQuery = `
		FROM question_scores
			GROUP BY user_id, post_id, campaign_id, account_id, hyper_link, score, assign_spin_que
			ORDER BY user_id;`;

		///////////////////////////////////////Final Query///////////////////////////////////////////////
		finalQuery = question_scores + questionText + lastGroupAndOrderByQuery;

		// console.log('-----------finalQuery---------------', finalQuery);
		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////
		let spinWheelDripData = [];
		[spinWheelDripData] = await sequelize.query(finalQuery);
		let srNo = 0;
		let maximumPossibleScore = 0;
		if (spinWheelDripData && spinWheelDripData.length > 0) {
			let addHyperLinkColumn = false;
			for (let data of spinWheelDripData) {
				if (data['hyper_link'] && data['hyper_link'] != null) {
					addHyperLinkColumn = true;
					break;
				}
			}
			for (let data of spinWheelDripData) {
				// console.log('--data--', data);
				srNo++;
				data['SR NO'] = srNo;
				data[`CONTACT ID`] = data[`account_id`];
				data[`DRIP ID`] = data['post_id'];
				data[`DRIP FLOW ID`] = data['campaign_id'];

				let totalScore = 0;
				totalScore = data.score;
				maximumPossibleScore = 0;
				for (let i = 1; i <= questionList.DripQuestions.length; i++) {
					data[`Q${i} - ${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`] = data[
						`question_${i}_selected_options`
					]
						? data[`question_${i}_selected_options`]
						: '';

					data[`Q${i} - SCORE`] = data[`question_${i}`];

					if (
						data.assign_spin_que &&
						JSON.parse(data.assign_spin_que).indexOf(
							questionList.DripQuestions[i - 1].DripSpinWheelCat.category_index
						) != -1
					) {
						maximumPossibleScore = maximumPossibleScore + questionList.DripQuestions[i - 1].spinQueScore;
					} else {
						data[`Q${i} - ${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`] = 'NA';
						data[`Q${i} - SCORE`] = 'NA';
					}

					delete data[`question_${i}`];
					delete data[`question_${i}_selected_options`];
				}

				// for (let i = 1; i <= questionList.DripQuestions.length; i++) {
				// 	const questionLabel = `Q${i} (${
				// 		questionList.DripQuestions[i - 1].DripSpinWheelCat.category_name
				// 	}) - ${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`;
				// 	data[questionLabel] = data[`question_${i}_selected_options`] ? data[`question_${i}_selected_options`] : '';
				// 	data[`Q${i} - SCORE`] = data[`question_${i}`];

				// 	if (data.assign_spin_que && JSON.parse(data.assign_spin_que).indexOf(i) != -1) {
				// 		maximumPossibleScore = maximumPossibleScore + questionList.DripQuestions[i - 1].spinQueScore;
				// 	} else {
				// 		data[questionLabel] = 'NA';
				// 		data[`Q${i} - SCORE`] = 'NA';
				// 	}

				// 	delete data[`question_${i}`];
				// 	delete data[`question_${i}_selected_options`];
				// }

				data['MAXIMUM POSSIBLE SCORE'] = maximumPossibleScore;
				data['TOTAL SCORE'] = totalScore;
				if (addHyperLinkColumn) {
					data['HYPERLINK CLICK'] = data['hyper_link'] ? data['hyper_link'] : ' ';
				}

				delete data[`account_id`];
				delete data[`post_id`];
				delete data['campaign_id'];
				delete data[`user_id`];
				delete data['hyper_link'];
				delete data[`score`];
				delete data[`assign_spin_que`];
			}
		}

		return ResponseSuccess(res, { data: spinWheelDripData }, 200);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSpinTheWheelDataByDripIndexAndCampaignId = getSpinTheWheelDataByDripIndexAndCampaignId;

//For Custom Template Report
const getCustomTemplteDataByDripIndexAndCampaignId = async function (req, res) {
	// try {
	// 	let CampaignId = req.body.campaign_id;
	// 	let DripId = req.body.post_id;
	// 	let DripCampIndex = req.body.drip_camp_Index;

	// 	const query_1 = `
	// 	SELECT
	// 		ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
	// 		"Users".account_id AS "CONTACT ID",
	// 		"PostId" AS "DRIP ID",
	// 		"CampaignId" AS "DRIP FLOW ID",
	// 		"Assigned_post_to_users"."custTempPageViewed" as "PAGE VIEWED"
	// 	FROM "Assigned_post_to_users"
	// 		JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
	// 	WHERE
	// 		("PostId" = ${DripId} AND
	// 		"CampaignId" = ${CampaignId} AND
	// 		"DripCampIndex" = ${DripCampIndex});
	// 	`;

	// 	console.log('-----------finalQuery---Custom Template------------', query_1);
	// 	let customTempData = [];
	// 	[customTempData] = await sequelize.query(query_1);

	// 	for (let i = 0; i < customTempData.length; i++) {
	// 		let item = customTempData[i];
	// 		if (item['PAGE VIEWED']) {
	// 			for (let j = 0; j < item['PAGE VIEWED'].length; j++) {
	// 				let page = item['PAGE VIEWED'][j];
	// 				for (let key in page) {
	// 					let upperCaseKey = key.toUpperCase();
	// 					item[upperCaseKey] = page[key];
	// 				}
	// 			}
	// 			delete item['PAGE VIEWED'];
	// 		}
	// 	}
	// 	return ResponseSuccess(res, {
	// 		data: customTempData,
	// 	});
	// } catch (error) {
	// 	return ResponseError(res, error, 500, true);
	// }
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be > 0
			post_id: Joi.number().integer().positive().required(), // Must be > 0
			drip_camp_Index: Joi.number().integer().min(0).required(), // Must be >= 0
		});

		// Validate the request body
		const { error, value } = schema.validate({
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Extract validated values
		let { campaign_id: CampaignId, post_id: DripId, drip_camp_Index: DripCampIndex } = value;

		// const query_1 = `
		// SELECT
		// 	ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
		// 	"Users".account_id AS "CONTACT ID",
		// 	"PostId" AS "DRIP ID",
		// 	"CampaignId" AS "DRIP FLOW ID",
		// 	"Assigned_post_to_users"."custTempPageViewed" as "PAGE VIEWED"
		// FROM "Assigned_post_to_users"
		// 	JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
		// WHERE
		// 	("PostId" = ${DripId} AND
		// 	"CampaignId" = ${CampaignId} AND
		// 	"DripCampIndex" = ${DripCampIndex});
		// `;

		// console.log('-----------finalQuery---Custom Template------------', query_1);
		// let customTempData = [];
		// [customTempData] = await sequelize.query(query_1);

		const query_1 = `
    SELECT
        ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
        "Users".account_id AS "CONTACT ID",
        "PostId" AS "DRIP ID",
        "CampaignId" AS "DRIP FLOW ID",
        "Assigned_post_to_users"."custTempPageViewed" AS "PAGE VIEWED"
    FROM "Assigned_post_to_users"
    JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
    WHERE
        ("PostId" = :DripId AND
        "CampaignId" = :CampaignId AND
        "DripCampIndex" = :DripCampIndex);
`;

		// console.log('-----------finalQuery---Custom Template------------', query_1);
		let customTempData = [];
		customTempData = await sequelize.query(query_1, {
			replacements: {
				DripId: DripId,
				CampaignId: CampaignId,
				DripCampIndex: DripCampIndex,
			},
			type: Sequelize.QueryTypes.SELECT,
		});

		for (let i = 0; i < customTempData.length; i++) {
			let item = customTempData[i];

			// Check if PAGE VIEWED is null or missing, delete it and assign PAGE1_VIEWED as 'FALSE'
			if (!item['PAGE VIEWED'] || item['PAGE VIEWED'] === null) {
				item['PAGE1_VIEWED'] = 'NO'; // Set as uppercase 'FALSE'
				delete item['PAGE VIEWED']; // Delete the PAGE VIEWED key if it is null
			} else {
				for (let j = 0; j < item['PAGE VIEWED'].length; j++) {
					let page = item['PAGE VIEWED'][j];
					for (let key in page) {
						let upperCaseKey = key.toUpperCase();
						// Convert the value of the key to uppercase as well
						item[upperCaseKey] = page[key].toString().toUpperCase();
					}
				}

				delete item['PAGE VIEWED']; // Delete PAGE VIEWED after processing its content
			}
		}

		return ResponseSuccess(res, {
			data: customTempData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomTemplteDataByDripIndexAndCampaignId = getCustomTemplteDataByDripIndexAndCampaignId;

//For Survey Data
const getSurveyDripCampaignData = async function (req, res) {
	try {
		// let campaignId = req.body.campaign_id;
		// let dripCampId = req.body.drip_camp_id;
		// let dripCampIndex = req.body.drip_camp_Index;
		// let dripId = req.body.post_id;

		const schema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			dripCampId: Joi.number().integer().positive().required(),
			dripCampIndex: Joi.number().integer().min(0).required(), // Can be 0 or positive
			dripId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const data = {
			campaignId: req.body.campaign_id,
			dripCampId: req.body.drip_camp_id,
			dripCampIndex: req.body.drip_camp_Index,
			dripId: req.body.post_id,
		};

		const { error, value } = schema.validate(data);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let { campaignId, dripCampId, dripCampIndex, dripId } = value;

		let allData = [];
		let questionList;
		[err, questionList] = await to(
			Post.findOne({
				where: { id: dripId },
				include: [{ model: DripQuestion, attributes: ['id', 'question', 'questionType', 'isQuesRequired'] }],
				attributes: ['id', 'tempType', 'quizRandCount'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		//Get All Survey's Data By using CampaignId, DripCampId, DripCampIndex
		let finalQuery = ``;

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let column_list = `
		SELECT
			"Users".account_id AS account_id,
			"Assigned_post_to_users"."PostId" AS drip_id,
			"Assigned_post_to_users"."CampaignId" AS drip_flow_id,
			 SUM(DISTINCT CASE WHEN "DripUserQuestions"."questionType" = 'Rating scale' AND "Assigned_post_to_users".submit = true THEN COALESCE("DripUserQuestions"."surveyUserRating", 0)
        	 ELSE 0
    		 END) AS total_rating,
			"Assigned_post_to_users".hyperlink AS hyper_link, `;

		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			for (let question of questionList.DripQuestions) {
				count++;
				if (question.question != null && question.question != '') {
					let que = question.question.replaceAll("'", "''");
					// column_list =
					// 	column_list +
					// 	`
					// 	MAX(CASE
					// 		WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN('Short answer','Long answer','Date','Date Time','Email','Mobile No') THEN REPLACE("DripUserQuestions"."surveyNote", ',', ' ')
					// 		WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN('File upload')   THEN (CASE WHEN "UserBriefFiles".id IS NOT NULL THEN 'YES' ELSE 'NO' END)
					// 		WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN ('MCQ','Drop Down') THEN (CASE WHEN "DripUserOptions"."selectedAns" = true THEN "DripUserOptions".text ELSE ''  END)
					// 		WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" = 'Geo Tag' THEN REPLACE("DripUserQuestions"."geoLocation", ',', ' ')
					// 		WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" = 'Rating scale' THEN CAST("DripUserQuestions"."surveyUserRating" AS TEXT)
					// 		ELSE ''
					// 		END) AS question_${count},
					// 	MAX(CASE WHEN "DripUserQuestions"."questionType" = 'Geo Tag' AND "Assigned_post_to_users".submit = true THEN (CAST("DripUserQuestions".latitude AS TEXT) || ', ' || CAST("DripUserQuestions".longitude AS TEXT)) ELSE '-' END) AS location_${count}

					// `;

					column_list =
						column_list +
						`
					MAX(CASE WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN('Short answer','Long answer','Date','Date Time','Email','Mobile No') THEN REPLACE("DripUserQuestions"."surveyNote", ',', ' ')
							WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN('File upload') THEN (CASE WHEN "UserBriefFiles".id IS NOT NULL THEN 'YES' ELSE 'NO' END)
							WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" IN ('MCQ','Drop Down') THEN (SELECT STRING_AGG("DripUserOptions".text, ', ') FROM "DripUserOptions" WHERE "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
							AND "DripUserOptions"."selectedAns" = true)
							WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" = 'Geo Tag' THEN REPLACE("DripUserQuestions"."geoLocation", ',', ' ')
							WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}' AND "DripUserQuestions"."questionType" = 'Rating scale' THEN CAST("DripUserQuestions"."surveyUserRating" AS TEXT)
							ELSE ''
							END) AS question_${count},
							MAX(CASE WHEN "DripUserQuestions"."questionType" = 'Geo Tag' AND "Assigned_post_to_users".submit = true THEN (CAST("DripUserQuestions".latitude AS TEXT) || ', ' || CAST("DripUserQuestions".longitude AS TEXT)) ELSE '-' END) AS location_${count}
       						 `;

					if (count < questionList.DripQuestions.length) {
						column_list = column_list + `,`;
					} else {
						column_list =
							column_list +
							`
						FROM "Assigned_post_to_users"
						JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
						JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
						LEFT JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
						LEFT JOIN "UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"`;
					}
				}
			}
		}

		///////////////////////////////////////WHERE CONDITION///////////////////////////////////////////////

		let whereCondition = `
		WHERE
			"Assigned_post_to_users".submit = true AND
			"Assigned_post_to_users"."CampaignId" = ${campaignId} AND
			"Assigned_post_to_users"."DripCampIndex" = ${dripCampIndex}
		`;

		///////////////////////////////////////GROUP BY AND ORDER BY Query///////////////////////////////////////////////

		let lastGroupAndOrderByQuery = `
		GROUP BY
    		"Assigned_post_to_users"."UserId", account_id, drip_id, drip_flow_id, hyper_link

		ORDER BY
    		"Assigned_post_to_users"."UserId" ASC ;`;

		///////////////////////////////////////Final Query///////////////////////////////////////////////
		finalQuery = column_list + whereCondition + lastGroupAndOrderByQuery;

		console.log('-----------finalQuery---Surevy------------', finalQuery);
		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////
		let surveyDripData = [];
		[surveyDripData] = await sequelize.query(finalQuery);

		let srNo = 0;
		let addTotalRating = false;
		if (surveyDripData && surveyDripData.length > 0) {
			let addHyperLinkColumn = false;
			for (let data of surveyDripData) {
				if (data['hyper_link'] && data['hyper_link'] != null) {
					addHyperLinkColumn = true;
					break;
				}
			}
			for (let data of surveyDripData) {
				srNo++;
				data['SR NO'] = srNo;
				data[`CONTACT ID`] = data[`account_id`];
				data[`DRIP ID`] = data['drip_id'];
				data[`DRIP FLOW ID`] = data['drip_flow_id'];

				for (let i = 1; i <= questionList.DripQuestions.length; i++) {
					if (questionList.DripQuestions[i - 1].questionType === 'Rating scale') {
						addTotalRating = true;
					}

					if (questionList.DripQuestions[i - 1].isQuesRequired) {
						data[
							`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')} (${
								questionList.DripQuestions[i - 1].questionType
							}) *`
						] = data[`question_${i}`];
					} else {
						data[
							`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')} (${
								questionList.DripQuestions[i - 1].questionType
							})`
						] = data[`question_${i}`];
					}

					if (questionList.DripQuestions[i - 1].questionType === 'Geo Tag') {
						data[`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')} (Coordinates)`] =
							data[`location_${i}`];
					}

					delete data[`question_${i}`];
					delete data[`location_${i}`];
				}

				if (addTotalRating) {
					data['TOTAL RATING'] = data['total_rating'];
				}
				if (addHyperLinkColumn) {
					data['HYPERLINK CLICK'] = data['hyper_link'] ? data['hyper_link'] : ' ';
				}
				delete data[`total_rating`];
				delete data[`account_id`];
				delete data[`drip_id`];
				delete data['drip_id'];
				delete data['drip_flow_id'];
				delete data['hyper_link'];
			}
		} else {
			//Need to create empty data
			let emptyObject = {
				'SR NO': '',
				'CONTACT ID': '',
				'DRIP ID': '',
				'DRIP FLOW ID': '',
			};

			for (let i = 1; i <= questionList.DripQuestions.length; i++) {
				if (questionList.DripQuestions[i - 1].questionType === 'Rating scale') {
					addTotalRating = true;
				}
				emptyObject[
					`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')} (${
						questionList.DripQuestions[i - 1].questionType
					})`
				] = '';
			}
			addTotalRating['TOTAL RATING'] = ' ';
			surveyDripData = [emptyObject];
			// console.log('---surveyDripData---', surveyDripData);
		}

		return ResponseSuccess(res, {
			data: surveyDripData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSurveyDripCampaignData = getSurveyDripCampaignData;

const downloadSuerveyUploadeddataByLearner = async function (req, res) {
	try {
		// let campaignId = req.body.campaign_id;
		// // let dripCampId = req.body.drip_camp_id;
		// let dripCampIndex = req.body.drip_camp_Index;
		// //let dripId = req.body.post_id;

		// Define validation schema
		const schema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			dripCampIndex: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Validate request body
		const data = {
			campaignId: req.body.campaign_id,
			dripCampIndex: req.body.drip_camp_Index,
		};

		const { error, value } = schema.validate(data);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let { campaignId, dripCampIndex } = value;

		// let finalQuery = `
		// SELECT "Users".account_id                    AS account_id,
		// 	   "UserBriefFiles".path                 AS path,
		// 	   "Assigned_post_to_users"."CampaignId" AS campaign_id,
		// 	   ROW_NUMBER() OVER(PARTITION BY "Users".account_id ORDER BY "DripUserQuestions".id) AS question_serial_no

		// FROM "Assigned_post_to_users"
		//   	JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
		//   	JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
		//   	JOIN "UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"

		// WHERE  "Assigned_post_to_users".submit = true
		// 	   AND "Assigned_post_to_users"."CampaignId" = ${campaignId}
		// 	   AND "Assigned_post_to_users"."DripCampIndex" = ${dripCampIndex}

		// GROUP BY "Assigned_post_to_users"."UserId", account_id, campaign_id, path,  "DripUserQuestions".id

		// ORDER BY "Assigned_post_to_users"."UserId" ASC;`;

		// let surveyDripUploadedData = [];
		// [surveyDripUploadedData] = await sequelize.query(finalQuery);

		let finalQuery = `
    SELECT 
        "Users".account_id AS account_id,
        "UserBriefFiles".path AS path,
        "Assigned_post_to_users"."CampaignId" AS campaign_id,
        ROW_NUMBER() OVER(PARTITION BY "Users".account_id ORDER BY "DripUserQuestions".id) AS question_serial_no
    FROM "Assigned_post_to_users"
        JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
        JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
        JOIN "UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"
    WHERE 
        "Assigned_post_to_users".submit = true
        AND "Assigned_post_to_users"."CampaignId" = :campaignId
        AND "Assigned_post_to_users"."DripCampIndex" = :dripCampIndex
    GROUP BY "Assigned_post_to_users"."UserId", account_id, campaign_id, path, "DripUserQuestions".id
    ORDER BY "Assigned_post_to_users"."UserId" ASC;
`;

		// Execute query using replacements
		let surveyDripUploadedData = [];
		surveyDripUploadedData = await sequelize.query(finalQuery, {
			replacements: { campaignId, dripCampIndex },
			type: sequelize.QueryTypes.SELECT,
		});

		let random_string = shortid.generate();
		var archive = archiver.create('zip', {});
		archive.on('error', function (err) {
			throw err;
		});
		var output = fs.createWriteStream(CONFIG.imagePath + `/uploads/zip_files/${random_string}_${campaignId}.zip`);

		output.on('close', function () {
			console.log(archive.pointer() + ' total bytes');
			console.log('archiver has been finalized and the output file descriptor has closed.');
			res.download(CONFIG.imagePath + `/uploads/zip_files/${random_string}_${campaignId}.zip`);
		});

		archive.pipe(output);
		for (let file of surveyDripUploadedData) {
			let fileType = file.path.split('.');
			archive.append(fs.createReadStream(CONFIG.imagePath + file.path), {
				name: `${file.account_id}_${file.question_serial_no}.${fileType[fileType.length - 1]}`,
			});
		}

		archive.finalize();
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadSuerveyUploadeddataByLearner = downloadSuerveyUploadeddataByLearner;

//For Poll
const getPollDripCampaignData = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values first
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		let finalQuery = ``;
		//Get Question
		[err, questionList] = await to(
			Post.findOne({
				where: { id: DripId },
				include: [{ model: DripQuestion, attributes: ['id', 'question', 'questionType'] }],
				attributes: ['id', 'tempType', 'quizRandCount'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		// let que = '';
		// if (questionList.DripQuestions[0].question) {
		// 	que = questionList.DripQuestions[0].question.replaceAll("'", "''");
		// }

		// const finalQuery = `
		// SELECT "Users".account_id                    AS account_id,
		// 	   "Assigned_post_to_users"."PostId"     AS drip_id,
		// 	   "Assigned_post_to_users"."CampaignId" AS drip_flow_id,
		// 	   "Assigned_post_to_users".hyperlink AS hyper_link,
		// 		MAX(CASE
		// 				WHEN "Assigned_post_to_users".submit = true AND "DripUserQuestions".question = '${que}'
		// 					THEN (CASE WHEN "DripUserOptions"."selectedAns" = true THEN "DripUserOptions".text ELSE '' END)
		// 				ELSE ''
		// 			END)                             AS question_1

		// FROM "Assigned_post_to_users"
		// 	JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
		// 	JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
		// 	JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
		// 	LEFT JOIN "UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"

		// WHERE
		// 	"Assigned_post_to_users".submit = true
		// 	AND "Assigned_post_to_users"."CampaignId" = ${CampaignId}
		// 	AND "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex}

		// GROUP BY
		// 	"Assigned_post_to_users"."UserId", account_id, drip_id, drip_flow_id, hyper_link

		// ORDER BY
		// 	"Assigned_post_to_users"."UserId" ASC;`;

		let question_scores = `
				WITH DripAnswers AS (
				SELECT
					"Users".account_id                    AS account_id,
					"Assigned_post_to_users"."PostId"     AS drip_id,
					"Assigned_post_to_users"."CampaignId" AS drip_flow_id,
					"Assigned_post_to_users".hyperlink AS hyper_link,
					"DripUserQuestions".question          AS question_text,
					(CASE
						WHEN "Assigned_post_to_users".submit = true AND "DripUserOptions"."selectedAns" = true
							THEN "DripUserOptions".text
						ELSE ''
					END) AS answer
				FROM
					"Assigned_post_to_users"
				JOIN
					"Users" ON "Users".id = "Assigned_post_to_users"."UserId"
				JOIN
					"DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
				JOIN
					"DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
				LEFT JOIN
					"UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"
				WHERE
					"Assigned_post_to_users".submit = true
					AND "Assigned_post_to_users"."CampaignId" = ${CampaignId}
					AND "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex}
			)
		`;

		let questionText = `
				SELECT
				account_id,
				drip_id,
				drip_flow_id,
				hyper_link,
			`;

		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			for (let question of questionList.DripQuestions) {
				count++;
				if (question.question != null && question.question !== '') {
					let que = question.question.replaceAll("'", "''"); // Escaping single quotes
					questionText += `MAX(CASE WHEN question_text = '${que}' THEN answer ELSE '' END) AS question_${count}, `;
				}
			}
		}

		questionText = questionText.slice(0, -2);
		questionText += `
			FROM DripAnswers
			GROUP BY account_id, drip_id, drip_flow_id, hyper_link ORDER BY account_id ASC;`;

		// Combine question_scores and questionText to form the final query
		finalQuery = question_scores + questionText;

		// console.log('-----------finalQuery---Poll------------', finalQuery);

		let pollDripData = [];
		[pollDripData] = await sequelize.query(finalQuery);

		let srNo = 0;

		if (pollDripData && pollDripData.length > 0) {
			let addHyperLinkColumn = false;
			for (let data of pollDripData) {
				if (data['hyper_link'] && data['hyper_link'] != null) {
					addHyperLinkColumn = true;
					break;
				}
			}
			for (let data of pollDripData) {
				srNo++;
				data['SR NO'] = srNo;
				data[`CONTACT ID`] = data[`account_id`];
				data[`DRIP ID`] = data['drip_id'];
				data[`DRIP FLOW ID`] = data['drip_flow_id'];

				for (let i = 1; i <= questionList.DripQuestions.length; i++) {
					data[`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`] = data[`question_${i}`];

					delete data[`question_${i}`];
				}

				if (addHyperLinkColumn) {
					data['HYPERLINK CLICK'] = data['hyper_link'] ? data['hyper_link'] : ' ';
				}
				delete data[`account_id`];
				delete data[`drip_id`];
				delete data['drip_id'];
				delete data['drip_flow_id'];
				delete data['hyper_link'];
			}
		} else {
			//Need to create empty data
			let emptyObject = {
				'SR NO': '',
				'CONTACT ID': '',
				'DRIP ID': '',
				'DRIP FLOW ID': '',
			};

			for (let i = 1; i <= questionList.DripQuestions.length; i++) {
				emptyObject[`${questionList.DripQuestions[i - 1].question.replaceAll(',', ' ')}`] = '';
			}
			pollDripData = [emptyObject];
		}

		return ResponseSuccess(res, {
			data: pollDripData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getPollDripCampaignData = getPollDripCampaignData;

const getPollGraphData = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values first
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		//Get Question
		[err, questionList] = await to(
			Post.findOne({
				where: { id: DripId },
				include: [
					{
						model: DripQuestion,
						attributes: ['id', 'question', 'questionType'],
						include: [{ model: DripOption, attributes: ['id', 'text'] }],
					},
				],
				attributes: ['id', 'tempType', 'quizRandCount'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);

		let finalQuery = ``;

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let optionCondition = ``;
		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			optionCondition = `
			SELECT`;
			for (let question of questionList.DripQuestions) {
				for (let option of question.DripOptions) {
					const optionText = option.text.replaceAll("'", "''");
					count++;
					optionCondition =
						optionCondition +
						`
					SUM(CASE WHEN "DripUserOptions".text = '${optionText}' AND "DripUserOptions"."selectedAns" = true THEN 1 ELSE 0 END ) option_${count}`;

					if (count < question.DripOptions.length) {
						optionCondition = optionCondition + `,`;
					}
				}
			}
		}

		///////////////////////////////////////WHERE CONDITION///////////////////////////////////////////////
		let joinAndWhereCondition = `
			FROM "Assigned_post_to_users"
				JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
				JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id

			WHERE 
				"Assigned_post_to_users".submit = true
				AND "Assigned_post_to_users"."CampaignId" = ${CampaignId}
				AND "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex};`;

		///////////////////////////////////////fINAL qUERY///////////////////////////////////////////////
		finalQuery = optionCondition + joinAndWhereCondition;

		// console.log('-----------finalQuery---Poll------------', finalQuery);
		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////
		let pollGraphDripData = [];
		[pollGraphDripData] = await sequelize.query(finalQuery);

		// console.log('-------pollGraphDripData--------', pollGraphDripData);
		// [
		// 	{
		// 	  "name": "Germany",
		// 	  "value": 40632,
		// 	  "extra": {
		// 		"code": "de"
		// 	  }
		// 	},]
		let graphData = [];
		let count = 0;
		for (let option of questionList.DripQuestions[0].DripOptions) {
			count++;
			value = 0;
			for (let data of pollGraphDripData) {
				value = data[`option_${count}`];
			}
			graphData.push({ name: option.text, value: value });
		}

		return ResponseSuccess(res, {
			data: graphData,
			question: questionList.DripQuestions[0].question,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getPollGraphData = getPollGraphData;

//Get Offline Task Data for report
const getOfflineTaskDataForReport = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values first
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		[err, questionList] = await to(
			Post.findOne({
				where: { id: DripId },
				include: [
					{
						model: DripQuestion,
						attributes: ['id', 'question', 'questionType'],
					},
				],
				attributes: ['id', 'tempType', 'quizRandCount'],
				order: [[DripQuestion, 'id', 'ASC']],
			})
		);

		let finalQuery = ``;

		////////////////////////////////////////////////// Comman SELECT Query///////////////////////////////////////////////
		let selectQuery = `
		SELECT 
			"Users".account_id                    AS account_id,
			"Assigned_post_to_users"."PostId"     AS drip_id,
			"Assigned_post_to_users"."CampaignId" AS drip_flow_id,
			MAX(CASE WHEN "Assigned_post_to_users".submit = true THEN 'Submitted' ELSE 'Not Submitted' END) AS submited_status,
			"Assigned_post_to_users".hyperlink AS hyper_link,`;

		if (questionList && questionList.DripQuestions && questionList.DripQuestions.length > 0) {
			let count = 0;
			for (let question of questionList.DripQuestions) {
				const que = question.question.replaceAll("'", "''");
				count++;
				selectQuery =
					selectQuery +
					`	
			MAX(CASE
					WHEN "DripUserQuestions".question = '${que}'
						THEN "DripUserQuestions"."offlineTaskNote"
					ELSE ''
				END) AS                              response_${count},
			
			MAX(CASE
					WHEN "DripUserQuestions".question = '${que}'
						THEN "UserBriefFiles".transcript
					ELSE ''
				END) AS                              transcript_${count},	
	 
			MAX(CASE
					WHEN "DripUserQuestions".question = '${que}'
						THEN (CASE WHEN "UserBriefFiles".id IS NOT NULL THEN 'YES' ELSE 'NO' END)
					ELSE ''
				END) AS                              upload_media_${count},
	 
			MAX(CASE
					WHEN "DripUserQuestions".question = '${que}'
						THEN (CASE
								  WHEN "UserBriefFiles".id IS NOT NULL AND "UserBriefFiles".grade IS NOT NULL
									  THEN "UserBriefFiles".grade
								  ELSE '-' END)
					ELSE ''
				END) AS                              grade_${count}
				`;

				if (count < questionList.DripQuestions.length) {
					selectQuery = selectQuery + `,`;
				}
			}
		}

		///////////////////////////////////////WHERE CONDITION///////////////////////////////////////////////
		let joinAndWhereCondition = `
		FROM "Assigned_post_to_users"
				JOIN "Users" ON "Users".id = "Assigned_post_to_users"."UserId"
				JOIN "DripUserQuestions" ON "Assigned_post_to_users".id = "DripUserQuestions"."AssignedPostToUserId"
				JOIN "DripUserOptions" ON "DripUserOptions"."DripUserQuestionId" = "DripUserQuestions".id
				LEFT JOIN "UserBriefFiles" ON "DripUserQuestions".id = "UserBriefFiles"."DripUserQuestionId"

		WHERE 
			"Assigned_post_to_users"."CampaignId" = ${CampaignId}
			AND "Assigned_post_to_users"."DripCampIndex" = ${DripCampIndex}


		GROUP BY 
			"Assigned_post_to_users"."UserId", account_id, drip_id, drip_flow_id, "Assigned_post_to_users".submit, hyper_link

		ORDER BY 
			"Assigned_post_to_users"."UserId" ASC;`;

		///////////////////////////////////////fINAL qUERY///////////////////////////////////////////////
		finalQuery = selectQuery + joinAndWhereCondition;

		console.log('-----------finalQuery---Offline Task------------', finalQuery);

		////////////////////////////////////////////////// Final Query Done///////////////////////////////////////////////

		let offlineTaskData = [];
		[offlineTaskData] = await sequelize.query(finalQuery);

		let srNo = 0;

		if (offlineTaskData && offlineTaskData.length > 0) {
			let addHyperLinkColumn = false;
			for (let data of offlineTaskData) {
				if (data['hyper_link'] && data['hyper_link'] != null) {
					addHyperLinkColumn = true;
					break;
				}
			}
			for (let data of offlineTaskData) {
				srNo++;
				data['SR NO'] = srNo;
				data[`CONTACT ID`] = data[`account_id`];
				data[`DRIP ID`] = data['drip_id'];
				data[`DRIP FLOW ID`] = data['drip_flow_id'];
				data[`TASK RESPONSE`] = data[`submited_status`];
				for (let i = 1; i <= questionList.DripQuestions.length; i++) {
					data[`Q${i} TEXT RESPONSE`] =
						data[`response_${i}`] && data[`response_${i}`] != null ? data[`response_${i}`] : ' ';

					data[`Q${i} MEDIA RESPONSE`] = data[`upload_media_${i}`];

					data[`Q${i} GRADE`] = data[`grade_${i}`];

					if (questionList.DripQuestions[i - 1].questionType === 'Voice Input') {
						data[`Q${i} TRANSCRIPT`] = data[`transcript_${i}`];
					}

					delete data[`response_${i}`];
					delete data[`upload_media_${i}`];
					delete data[`grade_${i}`];
					delete data[`transcript_${i}`];
				}
				if (addHyperLinkColumn) {
					data['HYPERLINK CLICK'] = data['hyper_link'] ? data['hyper_link'] : ' ';
				}
				delete data[`account_id`];
				delete data[`drip_id`];
				delete data['drip_id'];
				delete data['drip_flow_id'];
				delete data['submited_status'];
				delete data['hyper_link'];
			}
		}

		return ResponseSuccess(res, {
			data: offlineTaskData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getOfflineTaskDataForReport = getOfflineTaskDataForReport;

//Get Offline Taks All Data
const getOfflineTaskOrSurveyAllDataForAnalytics = async function (req, res) {
	try {
		// let campaignId = req.body.details.campaign_id;
		// let dripCampIndex = req.body.details.drip_camp_Index;
		// let campDripId = req.body.details.drip_camp_id;
		// let dripId = req.body.details.post_id;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
			drip_camp_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
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

		// Extract values from req.body.details
		const requestData = {
			campaign_id: req.body.details.campaign_id,
			drip_camp_Index: req.body.details.drip_camp_Index,
			drip_camp_id: req.body.details.drip_camp_id,
			post_id: req.body.details.post_id,
			limit: req.query.limit,
			page: req.query.page,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let campaignId = value.campaign_id;
		let dripCampIndex = value.drip_camp_Index;
		let campDripId = value.drip_camp_id;
		let dripId = value.post_id;
		let limit = value.limit;
		let page = value.page;

		let questionData = [];
		let finalData = [];
		let selectedQuestion = req.body.selectedQuestion;
		let searchKey = req.body.searchKey;
		let offset = 0;
		offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let assets;
		let uploadedOnVimeo = false;
		let questionListData;
		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (page != NaN && page >= 1) offset = (page - 1) * limit;
		// }

		if (req.body.details.type == 'Offline Task') {
			[err, questionListData] = await to(
				Assigned_post_to_user.findOne({
					where: {
						CampaignId: campaignId,
						DripCampIndex: dripCampIndex,
						PostId: dripId,
					},
					include: [
						{ model: DripUserQuestion, where: { isFileSubmission: true, questionType: 'Text and File Input' } },
						{ model: Post, attributes: ['id', 'brief'] },
					],
					attributes: ['id', 'PostId'],
					order: [[{ model: DripUserQuestion }, 'id', 'ASC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);
		} else if (req.body.details.type == 'Survey') {
			[err, questionListData] = await to(
				Assigned_post_to_user.findOne({
					where: {
						CampaignId: campaignId,
						DripCampIndex: dripCampIndex,
						PostId: dripId,
					},
					include: [
						{ model: DripUserQuestion, where: { questionType: 'File upload' } },
						{ model: Post, attributes: ['id', 'brief'] },
					],
					attributes: ['id', 'PostId'],
					order: [[{ model: DripUserQuestion }, 'id', 'ASC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (questionListData && questionListData.DripUserQuestions && questionListData.DripUserQuestions.length > 0) {
			for (let question of questionListData.DripUserQuestions) {
				questionData.push(question.convertToJSON());
			}
			if (selectedQuestion == undefined || selectedQuestion == '' || selectedQuestion == null) {
				selectedQuestion = questionData[0].question;
			}
		}

		let whereConditionForUser = {
			forDrip: true,
			cStatus: 'Active',
		};

		if (searchKey != '' && searchKey != null && searchKey != undefined) {
			whereConditionForUser.account_id = {
				[sequelize.Op.iLike]: '%' + searchKey + '%',
			};
		}

		let whereConditionForUserBriefFile = {
			question: selectedQuestion,
		};

		if (req.body.details.type == 'Offline Task') {
			whereConditionForUserBriefFile.isFileSubmission = true;
		} else if (req.body.details.type == 'Survey') {
			whereConditionForUserBriefFile.questionType = 'File upload';
		}

		[err, getAllData] = await to(
			UserBriefFile.findAndCountAll({
				include: [
					{
						model: DripUserQuestion,
						attributes: ['id', 'question', 'offlineTaskNote', 'isFileSubmission', 'UploadOnVimeo'],
						where: whereConditionForUserBriefFile,
						include: [
							{
								model: Assigned_post_to_user,
								where: {
									CampaignId: campaignId,
									DripCampIndex: dripCampIndex,
									PostId: dripId,
									submit: true,
								},
								include: [
									{
										model: User,
										where: whereConditionForUser,
										include: [{ model: Market, attributes: ['id', 'db_name'] }],
										required: true,
										attributes: ['id', 'local_user_id', 'MarketId', 'account_id'],
									},
								],
								attributes: ['id', 'UserId', 'PostId', 'CampaignId'],
							},
						],
					},
				],
				attributes: [
					'id',
					'fileType',
					'path',
					'grade',
					'fileName',
					'fileSize',
					'isTranscoding',
					'thumbnail',
					'UploadedOnS3',
				],
				limit: limit,
				offset: offset,
				order: [['id', 'DESC']],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (getAllData && getAllData.rows && getAllData.rows.length > 0) {
			for (let data of getAllData.rows) {
				let temp = data.convertToJSON();

				if (
					temp &&
					temp.DripUserQuestion &&
					temp.DripUserQuestion.Assigned_post_to_user &&
					temp.DripUserQuestion.Assigned_post_to_user.User &&
					temp.DripUserQuestion.Assigned_post_to_user.User.Market
				) {
					temp.User = temp.DripUserQuestion.Assigned_post_to_user.User;
					uploadedOnVimeo = temp.DripUserQuestion.UploadOnVimeo;
					delete temp.DripUserQuestion;
					temp.User.fullName = null;

					[err, localUser] = await to(
						dbInstance[temp.User.Market.db_name].User_master.findOne({
							where: {
								id: temp.User.local_user_id,
							},
							attributes: ['first', 'last'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					delete temp.User.Market;
					if (localUser) {
						if (localUser.first && localUser.last) {
							temp.User.fullName = localUser.first + ' ' + localUser.last;
						} else if (localUser.first) {
							temp.User.fullName = localUser.first;
						} else if (localUser.last) {
							temp.User.fullName = localUser.last;
						}
					}
				}
				finalData.push(temp);
			}
		}

		//Count For Grade and NonGrade
		[err, totalGradedableCount] = await to(
			UserBriefFile.count({
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: Assigned_post_to_user,
								where: {
									CampaignId: campaignId,
									DripCampIndex: dripCampIndex,
									PostId: dripId,
									submit: true,
								},
								required: true,
							},
						],
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Count For Grade and NonGrade
		[err, GradeCount] = await to(
			UserBriefFile.count({
				where: {
					grade: {
						[Op.ne]: null,
					},
				},
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: Assigned_post_to_user,

								where: {
									CampaignId: campaignId,
									DripCampIndex: dripCampIndex,
									PostId: dripId,
									submit: true,
								},
								required: true,
							},
						],
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//All Question List
		//gradedCount
		//NonGrandedCount
		//First Question Data with Limimtaion
		let payload = {
			allQuestions: questionData,
			brief: questionListData?.Post.brief,
			questionData: finalData,
			totalQuestionDataCount: getAllData?.count,
			gradeCount: GradeCount,
			totalGradedableCount: totalGradedableCount,
			uploadedOnVimeo: uploadedOnVimeo,
		};
		return ResponseSuccess(res, payload);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getOfflineTaskOrSurveyAllDataForAnalytics = getOfflineTaskOrSurveyAllDataForAnalytics;

// Get Video Data fot Date
const getVideoDataForReport = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values from req.body
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		// const query_1 = `
		// SELECT
		// 	ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
		// 	"Users".account_id AS "CONTACT ID",
		// 	"PostId" AS "DRIP ID",
		// 	"CampaignId" AS "DRIP FLOW ID",
		// 	COALESCE(max, 0) AS "TOTAL DURATION IN SEC",
		// 	COALESCE(consumed, 0) AS "WATCH TIME IN SEC",
		// 	COALESCE(ROUND(CAST(COALESCE(percent, 0) * 100 AS NUMERIC), 2), 0) || '%' AS "WATCH TIME IN PERCENTAGE",
		// 	"externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
		//     "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
		//     "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
		//     "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
		// 	      "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
		//     "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
		//     "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
		//     "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
		//     "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
		//     "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
		// 	"Assigned_post_to_users".hyperlink as "HYPERLINK CLICK"

		// FROM "Assigned_post_to_users"
		// 	JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id

		// WHERE "PostId" = ${DripId} AND "CampaignId" = ${CampaignId} AND "DripCampIndex" = ${DripCampIndex}

		// ORDER BY "Assigned_post_to_users"."UserId" ASC;`;

		// console.log('-----------finalQuery---Video------------', query_1);
		// let videoData = [];
		// [videoData] = await sequelize.query(query_1);

		const query_1 = `
    SELECT
        ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
        "Users".account_id AS "CONTACT ID",
        "PostId" AS "DRIP ID",
        "CampaignId" AS "DRIP FLOW ID",
        COALESCE(max, 0) AS "TOTAL DURATION IN SEC",
        COALESCE(consumed, 0) AS "WATCH TIME IN SEC",
        COALESCE(ROUND(CAST(COALESCE(percent, 0) * 100 AS NUMERIC), 2), 0) || '%' AS "WATCH TIME IN PERCENTAGE",
        "externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
        "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
        "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
        "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
        "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
        "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
        "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
        "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
        "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
        "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
        "Assigned_post_to_users".hyperlink AS "HYPERLINK CLICK"
    FROM "Assigned_post_to_users"
        JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
    WHERE "PostId" = :DripId
        AND "CampaignId" = :CampaignId
        AND "DripCampIndex" = :DripCampIndex
    ORDER BY "Assigned_post_to_users"."UserId" ASC;`;

		console.log('-----------finalQuery---Video------------', query_1);

		let videoData = [];
		videoData = await sequelize.query(query_1, {
			replacements: {
				DripId: DripId,
				CampaignId: CampaignId,
				DripCampIndex: DripCampIndex,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		[err, checkPostHaveExternalLinkOrNot] = await to(
			Post.findOne({
				where: {
					id: DripId,
				},
				attributes: [
					'id',
					'externalLink1',
					'externalLink2',
					'externalLink3',
					'externalLink4',
					'externalLink5',
					'externalLink6',
					'externalLink7',
					'externalLink8',
					'externalLink9',
					'externalLink10',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: videoData,
			haveExternalLink: checkPostHaveExternalLinkOrNot,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getVideoDataForReport = getVideoDataForReport;

const getCarouselDataForReport = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values from req.body
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		// const query_1 = `
		// SELECT
		// 	ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
		// 	"Users".account_id AS "CONTACT ID",
		// 	"PostId" AS "DRIP ID",
		// 	"CampaignId" AS "DRIP FLOW ID",
		// 	COALESCE(max, 0) AS "TOTAL SWIPE COUNT",
		// 	COALESCE(consumed, 0) AS "TOTAL SWIPED",
		// 	CASE
		//         WHEN COALESCE(max, 0) = 0 THEN '0%'
		//         ELSE ROUND(CAST(COALESCE(consumed, 0) * 100.0 / COALESCE(max, 0) AS NUMERIC), 2) || '%'
		//     END AS "SWIPED PERCENTAGE",
		// 	"externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
		//     "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
		//     "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
		//     "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
		// 	      "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
		//     "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
		//     "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
		//     "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
		//     "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
		//     "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
		// 	"Assigned_post_to_users".hyperlink as "HYPERLINK CLICK"

		// FROM "Assigned_post_to_users"
		// 	JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
		// WHERE
		// 	("PostId" = ${DripId} AND
		// 	"CampaignId" = ${CampaignId} AND
		// 	"DripCampIndex" = ${DripCampIndex})`;

		// 		const query_1 = ` SELECT
		//     ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
		//     "Users".account_id AS "CONTACT ID",
		//     "PostId" AS "DRIP ID",
		//     "CampaignId" AS "DRIP FLOW ID",
		//     GREATEST(COALESCE(max, 0) - 1, 0) AS "TOTAL SWIPE COUNT",
		//     COALESCE(consumed, 0) AS "TOTAL SWIPED",
		//     CASE
		//         WHEN GREATEST(COALESCE(max, 0) - 1, 0) = 0 THEN '0%'
		//         ELSE ROUND(CAST(COALESCE(consumed, 0) * 100.0 / GREATEST(COALESCE(max, 0) - 1, 0) AS NUMERIC), 2) || '%'
		//     END AS "SWIPED PERCENTAGE",
		//     "externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
		//     "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
		//     "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
		//     "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
		//     "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
		//     "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
		//     "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
		//     "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
		//     "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
		//     "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
		//     "Assigned_post_to_users".hyperlink as "HYPERLINK CLICK"
		// FROM "Assigned_post_to_users"
		//     JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
		// WHERE
		//     ("PostId" = ${DripId} AND
		//     "CampaignId" = ${CampaignId} AND
		//     "DripCampIndex" = ${DripCampIndex})`;

		// 		console.log('-----------finalQuery---Video------------', query_1);
		// 		let videoData = [];
		// 		[videoData] = await sequelize.query(query_1);

		const query_1 = ` 
    SELECT
        ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
        "Users".account_id AS "CONTACT ID",
        "PostId" AS "DRIP ID",
        "CampaignId" AS "DRIP FLOW ID",
        GREATEST(COALESCE(max, 0) - 1, 0) AS "TOTAL SWIPE COUNT",
        COALESCE(consumed, 0) AS "TOTAL SWIPED",
        CASE 
            WHEN GREATEST(COALESCE(max, 0) - 1, 0) = 0 THEN '0%'
            ELSE ROUND(CAST(COALESCE(consumed, 0) * 100.0 / GREATEST(COALESCE(max, 0) - 1, 0) AS NUMERIC), 2) || '%'
        END AS "SWIPED PERCENTAGE",
        "externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
        "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
        "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
        "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
        "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
        "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
        "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
        "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
        "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
        "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
        "Assigned_post_to_users".hyperlink AS "HYPERLINK CLICK"
    FROM "Assigned_post_to_users"
    JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
    WHERE 
        "PostId" = :DripId
        AND "CampaignId" = :CampaignId
        AND "DripCampIndex" = :DripCampIndex`;

		// console.log('-----------finalQuery---Video------------', query_1);

		let videoData = [];
		videoData = await sequelize.query(query_1, {
			replacements: {
				DripId: DripId,
				CampaignId: CampaignId,
				DripCampIndex: DripCampIndex,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		[err, checkPostHaveExternalLinkOrNot] = await to(
			Post.findOne({
				where: {
					id: DripId,
				},
				attributes: [
					'id',
					'externalLink1',
					'externalLink2',
					'externalLink3',
					'externalLink4',
					'externalLink5',
					'externalLink6',
					'externalLink7',
					'externalLink8',
					'externalLink9',
					'externalLink10',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: videoData,
			haveExternalLink: checkPostHaveExternalLinkOrNot,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCarouselDataForReport = getCarouselDataForReport;

const getSingleImageDataForReport = async function (req, res) {
	try {
		// let CampaignId = req.body.campaign_id;
		// let DripId = req.body.post_id;
		// let DripCampIndex = req.body.drip_camp_Index;

		const schema = Joi.object({
			campaign_id: Joi.number().integer().positive().required(), // Must be a positive integer
			post_id: Joi.number().integer().positive().required(), // Must be a positive integer
			drip_camp_Index: Joi.number().integer().min(0).required(), // Can be 0 or positive
		});

		// Extract values from req.body
		const requestData = {
			campaign_id: req.body.campaign_id,
			post_id: req.body.post_id,
			drip_camp_Index: req.body.drip_camp_Index,
		};

		// Validate extracted object
		const { error, value } = schema.validate(requestData);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let CampaignId = value.campaign_id;
		let DripId = value.post_id;
		let DripCampIndex = value.drip_camp_Index;

		// const query_1 = `
		// SELECT
		// 	ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
		// 	"Users".account_id AS "CONTACT ID",
		// 	"PostId" AS "DRIP ID",
		// 	"CampaignId" AS "DRIP FLOW ID",
		// 	"externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
		//     "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
		//     "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
		//     "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
		// 	"externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
		//     "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
		//     "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
		//     "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
		//     "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
		//     "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
		// 	"Assigned_post_to_users".hyperlink as "HYPERLINK CLICK"

		// FROM "Assigned_post_to_users"
		// 	JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
		// WHERE
		// 	("PostId" = ${DripId} AND
		// 	"CampaignId" = ${CampaignId} AND
		// 	"DripCampIndex" = ${DripCampIndex});
		// `;

		// console.log('-----------finalQuery---Video------------', query_1);
		// let videoData = [];
		// [videoData] = await sequelize.query(query_1);

		const query_1 = `
    SELECT
        ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS "SR NO",
        "Users".account_id AS "CONTACT ID",
        "PostId" AS "DRIP ID",
        "CampaignId" AS "DRIP FLOW ID",
        "externalLink"->>'externalLinkClick1' AS "EXTERNAL LINK BUTTON CLICK 1",
        "externalLink"->>'externalLinkClick2' AS "EXTERNAL LINK BUTTON CLICK 2",
        "externalLink"->>'externalLinkClick3' AS "EXTERNAL LINK BUTTON CLICK 3",
        "externalLink"->>'externalLinkClick4' AS "EXTERNAL LINK BUTTON CLICK 4",
        "externalLink"->>'externalLinkClick5' AS "EXTERNAL LINK BUTTON CLICK 5",
        "externalLink"->>'externalLinkClick6' AS "EXTERNAL LINK BUTTON CLICK 6",
        "externalLink"->>'externalLinkClick7' AS "EXTERNAL LINK BUTTON CLICK 7",
        "externalLink"->>'externalLinkClick8' AS "EXTERNAL LINK BUTTON CLICK 8",
        "externalLink"->>'externalLinkClick9' AS "EXTERNAL LINK BUTTON CLICK 9",
        "externalLink"->>'externalLinkClick10' AS "EXTERNAL LINK BUTTON CLICK 10",
        "Assigned_post_to_users".hyperlink AS "HYPERLINK CLICK"
    FROM "Assigned_post_to_users"
    JOIN "Users" ON "Assigned_post_to_users"."UserId" = "Users".id
    WHERE 
        "PostId" = :DripId
        AND "CampaignId" = :CampaignId
        AND "DripCampIndex" = :DripCampIndex;
`;

		// console.log('-----------finalQuery---Video------------', query_1);

		let videoData = [];
		videoData = await sequelize.query(query_1, {
			replacements: {
				DripId: DripId,
				CampaignId: CampaignId,
				DripCampIndex: DripCampIndex,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		[err, checkPostHaveExternalLinkOrNot] = await to(
			Post.findOne({
				where: {
					id: DripId,
				},
				attributes: [
					'id',
					'externalLink1',
					'externalLink2',
					'externalLink3',
					'externalLink4',
					'externalLink5',
					'externalLink6',
					'externalLink7',
					'externalLink8',
					'externalLink9',
					'externalLink10',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: videoData,
			haveExternalLink: checkPostHaveExternalLinkOrNot,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSingleImageDataForReport = getSingleImageDataForReport;

//Get All Only WhatsApp Drip  for report
const getAllOnlyWhatsAppDripReport = async function (req, res) {
	try {
		// let campaignId = req.body.details.campaign_id;
		// let dripCampIndex = req.body.details.drip_camp_Index;
		// let dripId = req.body.details.post_id;

		const schema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			dripCampIndex: Joi.number().integer().min(0).required(), // Can be 0 or positive
			dripId: Joi.number().integer().positive().required(),
		});

		// Validate request body
		const { error, value } = schema.validate({
			campaignId: req.body.details.campaign_id,
			dripCampIndex: req.body.details.drip_camp_Index,
			dripId: req.body.details.post_id,
		});

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let campaignId = value.campaignId;
		let dripCampIndex = value.dripCampIndex;
		let dripId = value.dripId;

		[err, getAllQuestions] = await to(
			CampWhatsAppEmailDrip.findAll({
				where: {
					CampaignId: campaignId,
					DripCampIndex: dripCampIndex,
					PostId: dripId,
				},
				include: [
					{
						model: User,
						attributes: ['id', 'local_user_id', 'MarketId', 'account_id'],
						where: {
							forDrip: true,
							cStatus: 'Active',
						},
						required: true,
					},
				],
				attributes: ['id', 'PostId', 'CampaignId', 'quickReplyResponse', 'WTriggerTime'],
				order: [[{ model: User }, 'id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			data: getAllQuestions,
		};
		return ResponseSuccess(res, payload);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllOnlyWhatsAppDripReport = getAllOnlyWhatsAppDripReport;

//Get Analytics 4 card Count Data
const getAllDripAnalyticsCountByClientId = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
		});

		// Validate request params
		const { error, value } = schema.validate({ clientId: parseInt(req.params.clientId) });

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
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

		let err;
		let allData = [];

		[ClientsDetail, allSubChildClientIds] = await getAllSubBranchClientIds(clientId, type);
		// let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		[err, allUserData] = await to(
			User_role_client_mapping.count({
				where: {
					ClientId: allSubChildClientIds,
					RoleId: {
						[Op.eq]: 1,
					},
					forDrip: true,
				},
				include: [
					{
						model: User,
						where: {
							status: true,
							is_deleted: false,
							cStatus: 'Active',
							forDrip: true,
						},
					},
					{
						model: Client,
						where: {
							DripAccess: true,
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allCampaignData] = await to(
			Campaign.count({
				where: {
					ClientId: allSubChildClientIds,
					status: 'Running',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allPostData] = await to(
			Post.count({
				where: {
					ClientId: allSubChildClientIds,
					drip_status: 'Published',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, allAssetData] = await to(
			Asset.count({
				where: {
					ClientId: allSubChildClientIds,
					is_deleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			activeLearer: 0,
			LiveDripFlow: 0,
			UniqueDrips: 0,
			UniqueAssets: 0,
		};

		payload.activeLearer = allUserData;
		payload.LiveDripFlow = allCampaignData;
		payload.UniqueDrips = allPostData;
		payload.UniqueAssets = allAssetData;

		allData.push(payload);

		return ResponseSuccess(res, {
			data: allData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDripAnalyticsCountByClientId = getAllDripAnalyticsCountByClientId;

const getTicketDataForReport = async function (req, res) {
	try {
		// Get All Client Ids and Sub Client Ids
		// let clientId = req.user.ClientId;
		// let startDate = moment(req.body.startDate).format();
		// let endDate = moment(req.body.endDate).format();

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
			startDate: Joi.date().iso().required(), // Must be a valid ISO 8601 date
			endDate: Joi.date().iso().required(), // Must be a valid ISO 8601 date
		});

		// Extract values
		let dataToValidate = {
			clientId: req.user.ClientId,
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		};

		// Validate data
		const { error, value } = schema.validate(dataToValidate);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let { clientId, startDate, endDate } = value;

		startDate = moment(startDate).format();
		endDate = moment(endDate).format();

		let err;
		let allData = [];
		[ClientsDetail, allSubChildClientIds] = await getAllSubBranchClientIds(clientId, req.user.type);
		// let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		[err, getTicketDetails] = await to(
			Ticket.findAll({
				where: {
					ClientId: allSubChildClientIds,
					createdAt: {
						[Op.between]: [startDate, endDate],
					},
				},
				attributes: ['id', 'ContactId', 'UserId', 'functionName', 'status', 'createdAt', 'query', 'comment'],
				include: [
					{
						model: User,
						attributes: ['id', 'account_id'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let count = 0;
		for (let ticket of getTicketDetails) {
			count++;
			let temp = ticket.convertToJSON();
			[err, contactId] = await to(
				User.findOne({
					where: {
						id: temp.ContactId,
					},
					attributes: ['account_id'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			temp['SR NO'] = count;
			temp['TICKET ID'] = temp.id;
			temp['FUNCTION NAME'] = temp.functionName;
			temp['STATUS'] = temp.status;
			temp['CREATED DATE'] = temp.createdAt;
			temp['ADMIN USER ID'] = temp.User.account_id;
			temp['CONTACT ID'] = contactId?.account_id ? contactId.account_id : '';
			temp['QUERY'] = temp.query ? temp.query : '';
			temp['COMMENT'] = temp.comment ? temp.comment : '';

			delete temp.id;
			delete temp.ContactId;
			delete temp.UserId;
			delete temp.functionName;
			delete temp.query;
			delete temp.comment;
			delete temp.status;

			delete temp.User;
			delete temp.createdAt;
			delete temp.User;
			allData.push(temp);
		}

		return ResponseSuccess(res, {
			data: allData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTicketDataForReport = getTicketDataForReport;
