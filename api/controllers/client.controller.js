const {
	Client,
	Op,
	sequelize,
	Client_job_role,
	User_role_client_mapping,
	Client_country_mapping,
	Country,
	System_branding,
	menu_mappings,
	Menu,
	User,
	Market,
	DiwoSystemBranding,
	Session,
	ClientCustomReport,
	ClientTeamSetup,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let avatarPath = 'uploads/client_avatar/';
let systemBrandingPath = 'uploads/system_branding/';
const {
	getAllSubChildClientIds,
	getAllSubBranchClientIds,
	getClientAppBrandingByClientId,
	getDiwoClientAppBrandingByClientId,
	getAllSubClientAndBranchAccountLists,
	getAccountCustomField,
} = require('../services/client.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const {
	getAllUserIdsForNotification,
	createNotification,
	createNotificationforDiwo,
	getAllDiwoUserIdsForNotification,
} = require('../services/notification.service');

const { capitalFirstLatter } = require('../services/auth.service');
const { createlog } = require('../services/log.service');
const Sequelize = require('sequelize');
const { createDefaultLearnerGroup } = require('./learner.controller');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
// Upload Avatar
const uploadAvatar = async function (req, res) {
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
module.exports.uploadAvatar = uploadAvatar;

//Create Client
const createClient = async function (req, res) {
	try {
		const jobRoleSchema = Joi.object({
			id: Joi.number().integer().allow(null),
			job_role_name: Joi.string().allow(null).allow(''),
			details: Joi.string().allow(null, ''),
		});

		const schema = Joi.object({
			id: Joi.number().integer().allow(null).required(),
			name: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			details: Joi.string().allow(null, ''),
			parentClientId: Joi.number().integer().positive().required(),
			parentSubClientId: Joi.number().integer().positive().allow(null),
			share_flag: Joi.boolean().required(),
			client_share_flag: Joi.boolean().required(),
			client_country: Joi.number().integer().required(),
			avatar: Joi.string().allow(null),
			avatar_file_name: Joi.string().allow(null, ''),
			category: Joi.string().required(),
			drip_share_flag: Joi.boolean().required(),
			workbookshareflag: Joi.boolean().required(),
			DripAccess: Joi.boolean().required(),
			DiwoAccess: Joi.boolean().required(),
			defaultGroupForDrip: Joi.boolean().required(),
			defaultGroupForDiwo: Joi.boolean().required(),
			enableChatBot: Joi.boolean().required(),
			useSendGrid: Joi.boolean().required(),
			percentage: Joi.number().integer().allow(null),
			videoComplition: Joi.boolean().required(),
			Associate_client_id: Joi.number().integer().required(),
			Client_job_roles: Joi.array().items(jobRoleSchema).optional(),
			customFields: Joi.array().items(Joi.object().allow(null, {})),
			documentCustomFields: Joi.array().items(Joi.object().allow(null, {})),
			createdDate: Joi.any().allow(null),

			isQuizCompletion: Joi.boolean().required(),
			quizPercentage: Joi.number().integer().allow(null),
			maxReAttemptsAllowed: Joi.number().integer().allow(null),
		});

		const { error, value } = schema.validate({ ...req.body });
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const client_details = value;

		let type = req.params.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let err, create_client;
		let update_clientFolderId;
		// let client_details = req.body;
		let jobRole = client_details.Client_job_roles;
		let country = client_details.client_country;
		let payload2;
		let clientId = parseInt(req.params.clientId);
		client_details.client_id = (parseInt(await getLastClientId()) + 1).toString();

		client_details.avatar_path =
			client_details.avatar_file_name != '' && client_details.avatar_file_name != null
				? avatarPath + client_details.avatar_file_name
				: '';

		client_details.status = 'Active';

		if (type == 'drip') {
			client_details.DripAccess = true;
		} else if (type == 'diwo') {
			client_details.DiwoAccess = true;
		}

		// client_details.name = await capitalFirstLatter(client_details.name);

		[err, create_client] = await to(Client.create(client_details));
		if (err) return ResponseError(res, err, 500, true);

		if (jobRole && jobRole.length > 0) {
			for (let job_role of jobRole) {
				let payload = {
					job_role_name: job_role.job_role_name,
					details: job_role.details,
					ClientId: create_client.id,
				};

				//comment if loop for unification

				// if (type == 'drip') {
				payload.forDrip = create_client.DripAccess;
				// } else if (type == 'diwo') {
				payload.forDiwo = create_client.DiwoAccess;
				// }

				[err, createRole] = await to(Client_job_role.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let payload = {
			ClientId: create_client.id,
			CountryId: country,
		};

		[err, clientCountryMapping] = await to(Client_country_mapping.create(payload));
		if (err) return ResponseError(res, err, 500, true);

		//Check and Create New Default Learner Group
		if (client_details.defaultGroupForDrip || client_details.defaultGroupForDiwo) {
			await createDefaultLearnerGroup(create_client.id, type, req.user.id, req.user.RoleId);
		}

		[err, client] = await to(
			Client.findOne({
				where: {
					id: create_client.id,
				},
				include: [
					{
						model: Client_job_role,
					},
					{
						model: Country,
						through: 'Client_country_mapping',
					},
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		// For Notification
		if (client_details.category !== 'Product Owner Account') {
			[err, getUser] = await to(
				User.findOne({
					where: {
						id: req.user.id,
					},
					attributes: ['MarketId', 'local_user_id'],
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

			[err, clientData] = await to(
				Client.findOne({
					where: {
						id: client.Associate_client_id,
					},
					attributes: ['name'],
				})
			);

			const userName = `${localUser && localUser.first ? localUser.first : ''} ${
				localUser && localUser.last ? localUser.last : ''
			}`;
			const clientName = client_details.name;
			let notifcationMessage = MESSAGE.CREATE_CLIENT;
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			notifcationMessage = notifcationMessage.replace('{{category}}', client.category);
			notifcationMessage = notifcationMessage.replace('{{branch_name}}', clientName);
			notifcationMessage = notifcationMessage.replace('{{parent_branch_name}}', clientData.name);
			let userIds = [];
			if (type == 'drip') {
				userIds = await getAllUserIdsForNotification(clientId);
				var index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotification(notifcationMessage, ['Bell'], userIds);

				let notifcationMessageForUser = MESSAGE.CREATE_CLIENT;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientName);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{category}}', client.category);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{parent_branch_name}}', clientData.name);
				await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
			} else if (type == 'diwo') {
				userIds = await getAllDiwoUserIdsForNotification(clientId);
				var index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);

				let notifcationMessageForUser = MESSAGE.CREATE_CLIENT;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientName);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{category}}', client.category);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{parent_branch_name}}', clientData.name);
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create Account`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						ClientId: create_client.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: client,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createClient = createClient;

//Update Client
const updateClient = async function (req, res) {
	try {
		const jobRoleSchema = Joi.object({
			id: Joi.number().integer().allow(null).allow(''),
			job_role_name: Joi.string().allow(null).allow(''),
			details: Joi.string().allow(null, ''),
			is_deleted: Joi.boolean().optional(),
			forDrip: Joi.boolean().optional(),
			forDiwo: Joi.boolean().optional(),
			createdAt: Joi.date().allow(null, ''),
			updatedAt: Joi.date().allow(null, ''),
			ClientId: Joi.number().integer().allow(null).allow(''),
		});

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			id: Joi.number().integer().required(),
			name: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			details: Joi.string().allow(null, ''),
			parentSubClientId: Joi.number().integer().positive().allow(null),
			share_flag: Joi.boolean().required(),
			client_share_flag: Joi.boolean().required(),
			client_country: Joi.number().integer().required(),
			avatar: Joi.string().allow(null),
			avatar_file_name: Joi.string().allow(null, ''),
			drip_share_flag: Joi.boolean().required(),
			workbookshareflag: Joi.boolean().required(),
			DripAccess: Joi.boolean().required(),
			DiwoAccess: Joi.boolean().required(),
			defaultGroupForDrip: Joi.boolean().required(),
			defaultGroupForDiwo: Joi.boolean().required(),
			enableChatBot: Joi.boolean().required(),
			useSendGrid: Joi.boolean().required(),
			percentage: Joi.number().integer().allow(null),
			videoComplition: Joi.boolean().required(),
			Associate_client_id: Joi.number().integer().required(),
			Client_job_roles: Joi.array().items(jobRoleSchema).optional(),
			customFields: Joi.array().items(Joi.object().allow(null, {})),
			documentCustomFields: Joi.array().items(Joi.object().allow(null, {})),
			createdDate: Joi.any().allow(null),

			isQuizCompletion: Joi.boolean().required(),
			quizPercentage: Joi.number().integer().allow(null),
			maxReAttemptsAllowed: Joi.number().integer().allow(null),
		});

		const { error, value } = schema.validate({ clientId: parseInt(req.params.clientId), ...req.body });
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		// const { client_details, clientId } = value;
		const client_details = value; // Assigning the entire validated object as client_details

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, client_details.clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.params.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let err, update_client;
		// let client_details = req.body;
		// let clientId = parseInt(req.params.clientId);
		let jobRole = client_details.Client_job_roles;
		let country = client_details.client_country;
		// let type = req.params.type;

		client_details.avatar_path =
			client_details.avatar_file_name != '' && client_details.avatar_file_name != null
				? avatarPath + client_details.avatar_file_name
				: '';

		if (type == 'drip') {
			client_details.DripAccess = true;
		} else if (type == 'diwo') {
			client_details.DiwoAccess = true;
		}

		// client_details.name = await capitalFirstLatter(client_details.name);

		//Before Update Client Details We need to Check Custom Field Label Name Changes and Also need to check All options of Dropdown option changes and as per changes in Custom Field data update Contanct Data
		//Get Old Custom Field Data
		[err, oldClientDetails] = await to(
			Client.findOne({ where: { id: client_details.id }, attributes: ['customFields'] })
		);
		if (err) return ResponseError(res, err, 500, true);

		if (
			oldClientDetails &&
			oldClientDetails.customFields &&
			client_details.category === 'Client Account' &&
			client_details.customFields
		) {
			await updateContactCustomFieldData(oldClientDetails.customFields, client_details.customFields, client_details.id);
		}

		//Check and Create New Default Learner Group
		[err, oldClientData] = await to(
			Client.findOne({
				where: {
					id: client_details.id,
				},
				attributes: ['id', 'defaultGroupForDrip', 'defaultGroupForDiwo'],
			})
		);
		if (
			(oldClientData.defaultGroupForDrip == false && client_details.defaultGroupForDrip == true) ||
			(oldClientData.defaultGroupForDiwo == false && client_details.defaultGroupForDiwo == true)
		) {
			await createDefaultLearnerGroup(oldClientData.id, type, req.user.id, req.user.RoleId);
		}

		[err, update_client] = await to(
			Client.update(client_details, {
				where: {
					id: client_details.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Destory invalid Job Role
		let allJobRoleIds;
		let query;
		// if (type == 'drip') {
		// 	query = `SELECT  ARRAY  (SELECT "id" FROM "Client_job_roles" AS "Client_job_role" WHERE "Client_job_role"."forDrip" = true AND "Client_job_role"."ClientId" = ${client_details.id});`;
		// } else if (type == 'diwo') {
		// 	query = `SELECT  ARRAY  (SELECT "id" FROM "Client_job_roles" AS "Client_job_role" WHERE "Client_job_role"."forDiwo" = true AND "Client_job_role"."ClientId" = ${client_details.id});`;
		// }

		// [ids] = await sequelize.query(query);

		if (type === 'drip') {
			query = `
				SELECT ARRAY (
					SELECT "id" FROM "Client_job_roles" AS "Client_job_role"
					WHERE "Client_job_role"."forDrip" = true
					AND "Client_job_role"."ClientId" = :clientId
				);
			`;
		} else if (type === 'diwo') {
			query = `
				SELECT ARRAY (
					SELECT "id" FROM "Client_job_roles" AS "Client_job_role"
					WHERE "Client_job_role"."forDiwo" = true
					AND "Client_job_role"."ClientId" = :clientId
				);
			`;
		}

		const ids = await sequelize.query(query, {
			replacements: { clientId: client_details.id }, // ? Safe parameter binding
			type: sequelize.QueryTypes.SELECT,
		});

		allJobRoleIds = ids[0].array;

		if (allJobRoleIds.length > 0) {
			let job_role_ids = [];
			for (let job_role of jobRole) {
				if (job_role.id && job_role.id != null && job_role.id != 'null') {
					job_role_ids.push(job_role.id);
				}
			}
			for (let roleId of allJobRoleIds) {
				if (job_role_ids.indexOf(roleId) == -1) {
					[err, deleteJobRole] = await to(
						Client_job_role.destroy({
							where: {
								ClientId: client_details.id,
								id: roleId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		//Update and Create Job Role
		for (let job_role of jobRole) {
			let payload = {
				job_role_name: job_role.job_role_name,
				details: job_role.details ? job_role.details : null,
				ClientId: client_details.id,
			};

			//comment if loop for unification
			// if (type == 'drip') {
			payload.forDrip = client_details.DripAccess;
			// } else if (type == 'diwo') {
			payload.forDiwo = client_details.DiwoAccess;
			// }

			if (job_role && (job_role.id == null || job_role.id == 'null')) {
				[err, createRole] = await to(Client_job_role.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			} else {
				delete payload.ClientId;
				[err, createRole] = await to(
					Client_job_role.update(payload, {
						where: {
							id: job_role.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let payload = {
			CountryId: country,
		};

		[err, clientCountryMapping] = await to(
			Client_country_mapping.update(payload, {
				where: {
					ClientId: client_details.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// For Notification
		if (client_details.category !== 'Product Owner Account') {
			[err, getUser] = await to(
				User.findOne({
					where: {
						id: req.user.id,
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

			const userName = `${localUser && localUser.first ? localUser.first : ''} ${
				localUser && localUser.last ? localUser.last : ''
			}`;
			const clientName = client_details.name;
			const clientCategory = client_details.category;
			let notifcationMessage = MESSAGE.UPDATE_CLIENT;
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			notifcationMessage = notifcationMessage.replace('{{branch_name}}', clientName);
			notifcationMessage = notifcationMessage.replace('{{branch_category}}', clientCategory);

			let userIds = [];
			if (type == 'drip') {
				userIds = await getAllUserIdsForNotification(client_details.clientId);
				var index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotification(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.UPDATE_CLIENT;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientName);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_category}}', clientCategory);
				await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
			} else if (type == 'diwo') {
				userIds = await getAllDiwoUserIdsForNotification(client_details.clientId);
				var index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.UPDATE_CLIENT;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientName);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_category}}', clientCategory);
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Account`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					ClientId: client_details.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			Message: '',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateClient = updateClient;

const updateContactCustomFieldData = async function (oldCustomField, newCustomField, clientId) {
	try {
		// If add new Custom Field
		// If Update new Custom Field
		// If Delete Custom Field
		//Find All Branch account under the Client Account
		let allSubClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		if (oldCustomField.length > 0) {
			for (let i = 0; i < oldCustomField.length; i++) {
				//For Check Changes in Custom Field Label Name
				if (oldCustomField[i].label !== newCustomField[i].label) {
					//Update Custom Field Label Name
					let old_name = oldCustomField[i].label;
					let new_name = newCustomField[i].label;
					// let query_1 = `
					// UPDATE "Users"
					// 	SET "customFields" = "customFields"::jsonb - '${old_name}' || jsonb_build_object('${new_name}', "customFields"->'${old_name}')
					// 	FROM "User_role_client_mappings"
					// 	WHERE "Users".id = "User_role_client_mappings"."UserId" AND "User_role_client_mappings"."RoleId" = 1 AND "User_role_client_mappings"."ClientId" IN (${allSubClientIds.toString()}) AND "customFields" ? '${old_name}';`;

					// const details = await sequelize.query(query_1);
					const query_1 = `
						UPDATE "Users"
						SET "customFields" = "customFields"::jsonb - :old_name 
							|| jsonb_build_object(:new_name, "customFields"->:old_name)
						FROM "User_role_client_mappings"
						WHERE "Users".id = "User_role_client_mappings"."UserId"
						AND "User_role_client_mappings"."RoleId" = 1
						AND "User_role_client_mappings"."ClientId" IN (:allSubClientIds)
						AND "customFields" ? :old_name;
					`;

					const details = await sequelize.query(query_1, {
						replacements: {
							old_name, // No need to add quotes manually
							new_name,
							allSubClientIds,
						},
						type: sequelize.QueryTypes.UPDATE,
					});
				}

				if (
					oldCustomField[i].dataType == 'Dropdown select' &&
					newCustomField[i].dataType == 'Dropdown select' &&
					oldCustomField[i].options.length > 0
				) {
					//For Check Options Changes in Dropdown Select
					for (let j = 0; j < oldCustomField[i].options.length; j++) {
						if (oldCustomField[i].options[j].label != newCustomField[i].options[j].label) {
							//Update Options Label
							let old_option = oldCustomField[i].options[j].label;
							let new_option = newCustomField[i].options[j].label;
							let fieldLabel = oldCustomField[i].label;
							let query_2 = `
							UPDATE "Users"
								SET "customFields" = jsonb_set("customFields"::jsonb, '{${fieldLabel}}', '"${new_option}"', false)
								WHERE "customFields"::jsonb ? '${fieldLabel}' AND "customFields"::jsonb->>'${fieldLabel}' = '${old_option}';`;

							const details = await sequelize.query(query_2);
						}
					}
				}
			}
		}

		return;
	} catch (error) {
		console.log('error', error);
		return error;
	}
};

const getLastClientId = async function () {
	try {
		[err, lastClient] = await to(
			Client.findOne({
				where: {
					client_id: {
						[Op.ne]: null,
					},
				},
				attributes: ['client_id'],
				order: [['createdAt', 'desc']],
				// raw: true
			})
		);
		return lastClient.client_id;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

// Get All Clients list
const getAllClient = async function (req, res) {
	try {
		let err, ClientsDetail;
		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
				},
				include: ['System_branding', 'Client_Package'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let clients_json = [];
		for (let i in ClientsDetail) {
			let client = ClientsDetail[i];
			let client_ = client.convertToJSON();
			clients_json.push(client_);
		}
		return ResponseSuccess(res, {
			data: clients_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllClient = getAllClient;

// Get All Child Clients list
const getAllChildClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, ClientsDetail;
		// let parentClientId = req.params.parentClientId;

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					Associate_client_id: parentClientId,
				},
				include: ['System_branding', 'Client_Package'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let clients_json = [];
		for (let i in ClientsDetail) {
			let client = ClientsDetail[i];
			let client_ = client.convertToJSON();
			client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
			if (type == 'drip' && client_.DripAccess) {
				clients_json.push(client_);
			} else if (type == 'diwo' && client_.DiwoAccess) {
				clients_json.push(client_);
			}
		}
		return ResponseSuccess(res, {
			data: clients_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllChildClient = getAllChildClient;

// Get All Child Clients list for admin users
const getAllChildClientForAdmin = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let type = req.params.type;
		let type = req.user.type;
		let err, ClientsDetail;
		// let parentClientId = req.params.parentClientId;
		let allSubClientIds = await getAllSubChildClientIds(parentClientId);
		allSubClientIds.push(parentClientId);

		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					Associate_client_id: allSubClientIds,
				},
				include: ['System_branding', 'Client_Package'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let clients_json = [];
		for (let i in ClientsDetail) {
			let client = ClientsDetail[i];
			let client_ = client.convertToJSON();
			client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
			if (type == 'drip' && client_.DripAccess) {
				clients_json.push(client_);
			} else if (type == 'diwo' && client_.DiwoAccess) {
				clients_json.push(client_);
			}
		}
		return ResponseSuccess(res, {
			data: clients_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllChildClientForAdmin = getAllChildClientForAdmin;

const getAllBranchClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;
		let err, clientsDetail;
		let client_;
		// let parentClientId = req.params.parentClientId;
		// let type = req.params.type;
		let allSubClientIds = await getAllSubBranchClientIds(parentClientId, type);

		// console.log("allSubClientIds", allSubClientIds);
		[err, clientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: parentClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (clientsDetail) {
			client_ = clientsDetail.convertToJSON();
			if (client_.category == 'Branch Account') {
				if (type == 'drip' && client_.DripAccess) {
					allSubClientIds.push(client_);
				} else if (type == 'diwo' && client_.DiwoAccess) {
					allSubClientIds.push(client_);
				}
			}
		}

		return ResponseSuccess(res, {
			data: allSubClientIds,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllBranchClient = getAllBranchClient;

// Get Child Clients list. Remove Client from response, If any learner user belongs from one this perticlular Client
const getChildClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, ClientsDetail, learnerUser;
		// let parentClientId = req.params.parentClientId;
		let type = req.user.type;
		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					Associate_client_id: parentClientId,
				},
				include: ['System_branding', 'Client_Package'],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let clients_json = [];
		for (let i in ClientsDetail) {
			let client = ClientsDetail[i];
			let client_ = client.convertToJSON();
			client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
			[err, learnerUser] = await to(
				User_role_client_mapping.findOne({
					where: {
						RoleId: 1, //Learner Role Id
						ClientId: client_.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!learnerUser) {
				if (type == 'drip' && client_.DripAccess) {
					clients_json.push(client_);
				} else if (type == 'diwo' && client_.DiwoAccess) {
					clients_json.push(client_);
				}
			}
		}
		return ResponseSuccess(res, {
			data: clients_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getChildClient = getChildClient;

// Get Child Clients list with parent Client List. Remove Client from response, If any learner user belongs from one this perticlular Client
const getChildClientWithParentClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.params.type;
		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, ClientsDetail, learnerUser;
		// let parentClientId = req.params.parentClientId;
		let clients_json = [];
		let client;
		let client_;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: parentClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (ClientsDetail) {
			[err, learnerUser] = await to(
				User_role_client_mapping.count({
					where: {
						RoleId: 1,
						ClientId: ClientsDetail.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!learnerUser) {
				ClientsDetail = ClientsDetail.convertToJSON();
				ClientsDetail.clientIdWithName = ClientsDetail.client_id + ' - ' + ClientsDetail.name;
				if (type == 'drip' && ClientsDetail.DripAccess) {
					finalArrayOfClient.push(ClientsDetail);
				} else if (type == 'diwo' && ClientsDetail.DiwoAccess) {
					finalArrayOfClient.push(ClientsDetail);
				}
			}
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
						Associate_client_id: childClientId,
					},
					attributes: ['id', 'Associate_client_id', 'name', 'client_id', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, learnerUser] = await to(
					User_role_client_mapping.count({
						where: {
							RoleId: 1,
							ClientId: client_.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (learnerUser == 0) {
					client_.clientIdWithName = client_.client_id + ' - ' + client_.name;

					if (type == 'drip' && client_.DripAccess) {
						finalArrayOfClient.push(client_);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						finalArrayOfClient.push(client_);
					}
				}
			}
		}

		return ResponseSuccess(res, {
			data: finalArrayOfClient,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getChildClientWithParentClient = getChildClientWithParentClient;

const paginate = function (array, page_size, page_number) {
	return array.slice((page_number - 1) * page_size, page_number * page_size);
};

// Get All Child Clients list
const getAllSubChildClient = async function (req, res) {
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

		let err, ClientsDetail;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let offset = 0;
		let response;

		let type = req.user.type;
		//Check Account Permission By Using Role Id
		[err, menu_] = await to(
			menu_mappings.findAll({
				where: {
					RoleId: parseInt(req.user.RoleId),
					MenuId: [2, 3, 4, 5],
				},
				include: [
					{
						model: Menu,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let menuNames = [];
		for (let role of menu_) {
			menuNames.push(role.Menu.name.replaceAll('Accounts', 'Account'));
		}

		offset = (page - 1) * limit;

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
						{
							model: Country,
							through: 'Client_country_mapping',
						},
						{
							model: System_branding,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				client_.Parent_client = parentClientsDetail.convertToJSON();
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});

				if (menuNames.indexOf(client_.category) > -1) {
					if (type == 'drip' && client_.DripAccess) {
						finalArrayOfClient.push(client_);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						finalArrayOfClient.push(client_);
					}
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		response = paginate(finalArrayOfClient, limit, page);
		return ResponseSuccess(res, {
			data: response,
			count: finalArrayOfClient.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSubChildClient = getAllSubChildClient;

const getAllSubChildClientForAnalytics = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let parentClientId = parseInt(req.params.parentClientId);
		let allSubClientIdsList = await getAllSubChildClientIds(parentClientId);
		allSubClientIdsList.push(parentClientId);
		// console.log('-allSubClientIdsList-', allSubClientIdsList);
		let finalArray = [];
		[err, allClient] = await to(
			Client.findAll({
				where: {
					id: allSubClientIdsList,
					is_deleted: false,
				},
				attributes: ['id', 'name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let client of allClient) {
			finalArray.push(client);
		}
		return ResponseSuccess(res, {
			data: finalArray,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSubChildClientForAnalytics = getAllSubChildClientForAnalytics;

const getAllSubChildClientForEditUser = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, ClientsDetail;
		// let parentClientId = req.params.parentClientId;
		let flag = true;
		let finalArrayOfClient = [];
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
					// include: ['System_branding', 'Client_Package']
					include: [
						{
							model: Client_job_role,
						},
						{
							model: Country,
							through: 'Client_country_mapping',
						},
						{
							model: System_branding,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				client_.Parent_client = parentClientsDetail.convertToJSON();
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});
				if (type == 'drip' && client_.DripAccess) {
					finalArrayOfClient.push(client_);
				} else if (type == 'diwo' && client_.DiwoAccess) {
					finalArrayOfClient.push(client_);
				}
			}

			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		return ResponseSuccess(res, {
			data: finalArrayOfClient,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSubChildClientForEditUser = getAllSubChildClientForEditUser;

// Get Sub Child Clients list. Remove Client from response, If any learner user belongs from one this perticlular Client
const getSubChildClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.parentClientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, ClientsDetail;
		// let parentClientId = req.params.parentClientId;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		let learnerUser;
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
					// include: ['System_branding', 'Client_Package']
					include: [
						{
							model: Client_job_role,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				client_.Parent_client = parentClientsDetail.convertToJSON();
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;

				[err, learnerUser] = await to(
					User_role_client_mapping.findOne({
						where: {
							RoleId: 1, //Learner Role Id
							ClientId: client_.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!learnerUser) {
					if (type == 'drip' && client_.DripAccess) {
						finalArrayOfClient.push(client_);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						finalArrayOfClient.push(client_);
					}
				}
			}

			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		return ResponseSuccess(res, {
			data: finalArrayOfClient,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSubChildClient = getSubChildClient;

// Get  Clients By Name
const getClientByName = async function (req, res) {
	try {
		const schema = Joi.object({
			clientName: Joi.string().required(),
		});

		const { error, value } = schema.validate({
			clientName: req.params.name,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientName } = value;

		let err, ClientsDetail;
		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					name: clientName,
				},
				include: ['System_branding', 'Client_Package'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: ClientsDetail.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientByName = getClientByName;

// Get  Clients By Name
const getClientById = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.id),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		// if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
		// 	return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		// }

		let err, ClientsDetail;
		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: parentClientId,
				},
				include: ['System_branding'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: ClientsDetail.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientById = getClientById;

//Get only last Client
const getOnlyLastClient = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			parentClientIds: req.body.parentClientId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		let { parentClientIds } = value;

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, ClientsDetail;
		// let parentClientIds = req.body.parentClientId;
		let flag = true;
		let ArrayOfLastClient = [];
		let childClientId = [];
		let lastClientList = [];

		if (parentClientIds?.length > 0) {
			for (let clientId of parentClientIds) {
				if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		}

		for (let client of parentClientIds) {
			[err, ClientsDetail] = await to(
				Client.findOne({
					where: {
						is_deleted: false,
						Associate_client_id: client,
					},
					include: [{ model: ClientTeamSetup, attributes: ['id'] }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!ClientsDetail) {
				[err, ClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client,
						},
						include: [{ model: ClientTeamSetup, attributes: ['id'] }],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (ClientsDetail) {
					let temp = ClientsDetail.convertToJSON();
					temp.clientIdWithName = temp.client_id + ' - ' + temp.name;
					ArrayOfLastClient.push(temp);
				}
			}
		}

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
						Associate_client_id: parentClientIds,
					},
					include: [{ model: ClientTeamSetup, attributes: ['id'] }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientIds = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				parentClientIds.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
						include: [{ model: ClientTeamSetup, attributes: ['id'] }],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				client_.Parent_client = parentClientsDetail.convertToJSON();
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				if (client_.category == 'Branch Account') {
					ArrayOfLastClient.push(client_);
				}
			}

			if (parentClientIds.length <= 0) {
				flag = false;
			}
		}

		for (let client of ArrayOfLastClient) {
			[err, parentClients] = await to(
				Client.findOne({
					where: {
						is_deleted: false,
						Associate_client_id: client.id,
					},
					include: [{ model: ClientTeamSetup, attributes: ['id'] }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!parentClients) {
				if (lastClientList.length == 0 && client.category == 'Branch Account') {
					if (type == 'drip' && client.DripAccess) {
						lastClientList.push(client);
					} else if (type == 'diwo' && client.DiwoAccess) {
						lastClientList.push(client);
					}
				} else {
					let flag = true;
					for (let client_ of lastClientList) {
						if (client.id == client_.id) {
							flag = false;
						}
					}
					if (flag && client.category == 'Branch Account') {
						if (type == 'drip' && client.DripAccess) {
							lastClientList.push(client);
						} else if (type == 'diwo' && client.DiwoAccess) {
							lastClientList.push(client);
						}
					}
				}
			}
		}

		return ResponseSuccess(res, {
			data: lastClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getOnlyLastClient = getOnlyLastClient;

//Get all Job Role By   Client
const getAlljobRoleByClient = async function (req, res) {
	try {
		const schema = Joi.object({
			clientIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			clientIds: req.body.ClientId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientIds } = value;

		if (clientIds?.length > 0) {
			for (let clientId of clientIds) {
				if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		}

		let err, ClientsDetail;

		// let clientIds = req.body.ClientId;
		let type = req.user.type;
		let allJobRole;
		let finalData = [];
		let customFields;
		if (type == 'drip') {
			[err, allJobRole] = await to(
				Client_job_role.findAll({
					where: {
						ClientId: clientIds,
						forDrip: true,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'client_id'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, allJobRole] = await to(
				Client_job_role.findAll({
					where: {
						ClientId: clientIds,
						forDiwo: true,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'client_id'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		for (let jobRole of allJobRole) {
			let role = jobRole.convertToJSON();
			role.nameWithClientId = role.Client.client_id + ' - ' + role.job_role_name;
			finalData.push(role);
		}

		if (type == 'drip') {
			//Get User Tags
			[err, getTagsData] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: clientIds,
						RoleId: 1,
						forDrip: true,
					},
					include: [
						{
							model: User,
							where: {
								cStatus: 'Active',
								is_deleted: false,
								is_archive: false,
								status: true,
								forDrip: true,
								[Op.and]: {
									tags: {
										[Op.ne]: null,
									},
									tags: {
										[Op.ne]: '',
									},
								},
							},
							attributes: ['id', 'tags'],
						},
						{
							model: Client,
							attributes: ['id', 'client_id'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			//Get User Tags
			[err, getTagsData] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: clientIds,
						RoleId: 1,
						forDiwo: true,
					},
					include: [
						{
							model: User,
							where: {
								cStatus: 'Active',
								is_deleted: false,
								is_archive: false,
								status: true,
								forDiwo: true,
								[Op.and]: {
									tags: {
										[Op.ne]: null,
									},
									tags: {
										[Op.ne]: '',
									},
								},
							},
							attributes: ['id', 'tags'],
						},
						{
							model: Client,
							attributes: ['id', 'client_id'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let tagsList = [];
		let temp = [];
		if (getTagsData && getTagsData.length > 0) {
			for (let userList of getTagsData) {
				let tags = userList.User.tags.split(',');
				for (let tagsList_ of tags) {
					let tagName = userList.Client.client_id + ' - ' + tagsList_;
					if (temp.indexOf(tagName) == -1) {
						temp.push(tagName);
						tagsList.push({ tagName: tagsList_, nameWithClientId: tagName });
					}
				}
			}
		}

		customFields = await getAccountCustomField(clientIds, req.user.type);

		return ResponseSuccess(res, {
			data: finalData,
			tagData: tagsList,
			customFieldData: customFields,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAlljobRoleByClient = getAlljobRoleByClient;

/////////////////////////////////////////////////////////// App Branding / System Baranding////////////////////////////////////////////////

// Upload Avatar
const uploadSystemBrandingImage = async function (req, res) {
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
module.exports.uploadSystemBrandingImage = uploadSystemBrandingImage;

//Create Client System Branding
const createSystemBranding = async function (req, res) {
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

		let err, system_branding;
		let system_branding_Details = req.body;
		let clientCustomReports = req.body.clientCustomReports;
		// let clientId = req.params.clientId;
		let type = req.query.type;

		if (system_branding_Details && system_branding_Details.theme_image_name) {
			system_branding_Details.theme_image_path = systemBrandingPath + system_branding_Details.theme_image_name;
		} else {
			system_branding_Details.theme_image_path = null;
		}

		if (system_branding_Details && system_branding_Details.signature_image_name) {
			system_branding_Details.signature_image_path = systemBrandingPath + system_branding_Details.signature_image_name;
		} else {
			system_branding_Details.signature_image_path = null;
		}

		if (system_branding_Details && system_branding_Details.learner_app_icon_name) {
			system_branding_Details.learner_app_icon_path =
				systemBrandingPath + system_branding_Details.learner_app_icon_name;
		} else {
			system_branding_Details.learner_app_icon_path = null;
		}
		if (system_branding_Details && system_branding_Details.admin_side_header_logo_name) {
			system_branding_Details.admin_side_header_logo_path =
				systemBrandingPath + system_branding_Details.admin_side_header_logo_name;
		} else {
			system_branding_Details.admin_side_header_logo_path = null;
		}

		system_branding_Details.ClientId = parseInt(clientId);

		// Create System Branding
		if (type == 'drip') {
			[err, system_branding] = await to(System_branding.create(system_branding_Details));
			if (err) return ResponseError(res, err, 500, true);

			// Update in to Client
			[err, client] = await to(
				Client.update(
					{
						SystemBrandingId: system_branding.id,
					},
					{
						where: {
							id: clientId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			//Client Custom Report
			for (let report of clientCustomReports) {
				let payload = {
					ClientId: system_branding_Details.clientId,
					SystemBrandingId: system_branding.id,
					report_name: report.report_name,
				};
				[err, clientCustomReports] = await to(ClientCustomReport.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (type == 'diwo') {
			[err, system_branding] = await to(DiwoSystemBranding.create(system_branding_Details));
			if (err) return ResponseError(res, err, 500, true);

			// Update in to Client
			[err, client] = await to(
				Client.update(
					{
						DiwoSystemBrandingId: system_branding.id,
					},
					{
						where: {
							id: clientId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create General Setting `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					System_brandingId: system_branding.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: system_branding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createSystemBranding = createSystemBranding;

//Update Client System Branding
const updateSystemBranding = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			id: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			id: parseInt(req.params.id),
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientId, id } = value;
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}
		let err, system_branding;
		let system_branding_Details = req.body;
		let clientCustomReports = req.body.clientCustomReports;
		// let id = parseInt(req.params.id);
		// let clientId = parseInt(req.params.clientId);
		let type = req.query.type;
		if (system_branding_Details && system_branding_Details.theme_image_name) {
			system_branding_Details.theme_image_path = systemBrandingPath + system_branding_Details.theme_image_name;
		} else {
			system_branding_Details.theme_image_path = null;
		}
		if (system_branding_Details && system_branding_Details.signature_image_name) {
			system_branding_Details.signature_image_path = systemBrandingPath + system_branding_Details.signature_image_name;
		} else {
			system_branding_Details.signature_image_path = null;
		}

		if (system_branding_Details && system_branding_Details.learner_app_icon_name) {
			system_branding_Details.learner_app_icon_path =
				systemBrandingPath + system_branding_Details.learner_app_icon_name;
		} else {
			system_branding_Details.learner_app_icon_path = null;
		}
		if (system_branding_Details && system_branding_Details.admin_side_header_logo_name) {
			system_branding_Details.admin_side_header_logo_path =
				systemBrandingPath + system_branding_Details.admin_side_header_logo_name;
		} else {
			system_branding_Details.admin_side_header_logo_path = null;
		}
		// system_branding_Details.ClientId = clientId;

		// Update System Branding
		if (type == 'drip') {
			[err, system_branding] = await to(
				System_branding.update(system_branding_Details, {
					where: {
						id: id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Client Custom Report
			[err, deleteClientCustomReport] = await to(
				ClientCustomReport.destroy({
					where: {
						SystemBrandingId: id,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let report of clientCustomReports) {
				let payload = {
					ClientId: system_branding_Details.clientId,
					SystemBrandingId: id,
					report_name: report.report_name,
				};
				[err, clientCustomReports] = await to(ClientCustomReport.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (type == 'diwo') {
			[err, system_branding] = await to(
				DiwoSystemBranding.update(system_branding_Details, {
					where: {
						id: id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
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

		[err, getClient] = await to(
			Client.findOne({
				where: {
					SystemBrandingId: id,
				},
				attributes: ['name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let account_name = getClient && getClient.name ? getClient.name : '';
		let notifcationMessage = MESSAGE.Settings_Updated;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{account_name}}', account_name);
		if (type == 'drip') {
			userIds = await getAllUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotification(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Settings_Updated;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace('{{account_name}}', account_name);
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			userIds = await getAllDiwoUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Settings_Updated;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace('{{account_name}}', account_name);
			await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update General Setting `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					System_brandingId: id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: system_branding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateSystemBranding = updateSystemBranding;

const getClientListOfWithoutAppBranding = async function (req, res) {
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

		let type = req.query.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, clientList;
		// let parentClientId = req.params.clientId;
		let finalClientList = [];

		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		let ClientsDetail;
		childClientId.push(parentClientId);

		[err, parentClient] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				attributes: [
					'id',
					'client_id',
					'name',
					'Associate_client_id',
					'SystemBrandingId',
					'DiwoSystemBrandingId',
					'details',
					'category',
					'DripAccess',
					'DiwoAccess',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (type == 'drip') {
			if (
				parentClient &&
				(!parentClient.SystemBrandingId || parentClient.SystemBrandingId == null || parentClient.SystemBrandingId == '')
			) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalClientList.push(client);
			}
		} else if (type == 'diwo') {
			if (
				parentClient &&
				(!parentClient.DiwoSystemBrandingId ||
					parentClient.DiwoSystemBrandingId == null ||
					parentClient.DiwoSystemBrandingId == '')
			) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalClientList.push(client);
			}
		}

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
					attributes: [
						'id',
						'client_id',
						'name',
						'Associate_client_id',
						'SystemBrandingId',
						'DiwoSystemBrandingId',
						'details',
						'DripAccess',
						'DiwoAccess',
						'category',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				if (type == 'drip' && client_.DripAccess) {
					if (
						client_ &&
						(!client_.SystemBrandingId || client_.SystemBrandingId == null || client_.SystemBrandingId == '')
					) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalClientList.push(client_);
					}
				} else if (type == 'diwo' && client_.DiwoAccess) {
					if (
						client_ &&
						(!client_.DiwoSystemBrandingId ||
							client_.DiwoSystemBrandingId == null ||
							client_.DiwoSystemBrandingId == '')
					) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalClientList.push(client_);
					}
				}
			}

			if (childClientId.length <= 0) {
				flag = false;
			}
		}

		return ResponseSuccess(res, {
			data: finalClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientListOfWithoutAppBranding = getClientListOfWithoutAppBranding;

const getClientListForAppBranding = async function (req, res) {
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

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err, clientList;
		// let parentClientId = req.params.clientId;
		let finalClientList = [];
		let client_;
		let childClientId = [];
		let ClientsDetail;

		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					id: {
						[Op.ne]: 1,
					},
				},
			})
		);

		for (let i in ClientsDetail) {
			childClientId.push(ClientsDetail[i].id);
			let client = ClientsDetail[i];
			let client_ = client.convertToJSON();
			if (client_) {
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				if (type == 'drip' && client_.DripAccess) {
					finalClientList.push(client_);
				} else if (type == 'diwo' && client_.DiwoAccess) {
					finalClientList.push(client_);
				}
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientListForAppBranding = getClientListForAppBranding;

const getAllSystemBranding = async function (req, res) {
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

		let parentClientId = clientId;
		let err, client;
		let childClientId = [];
		let ClientsDetail;
		let flag = true;

		let offset = (page - 1) * limit;
		let response;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		// let type = req.query.type;

		childClientId.push(parentClientId);
		let finalArray = [];
		if (type == 'drip') {
			[err, parentClient] = await to(
				Client.findOne({
					where: {
						id: parentClientId,
						DripAccess: true,
					},
					attributes: ['id', 'client_id', 'name', 'Associate_client_id', 'SystemBrandingId', 'details'],
					include: [
						{
							model: System_branding,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (parentClient.SystemBrandingId != null) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalArray.push(client);
			}

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
							DripAccess: true,
						},
						attributes: ['id', 'client_id', 'name', 'Associate_client_id', 'SystemBrandingId', 'details'],
						include: [
							{
								model: System_branding,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				childClientId = [];

				if (ClientsDetail && ClientsDetail.length <= 0) {
					flag = false;
				}

				for (let i in ClientsDetail) {
					childClientId.push(ClientsDetail[i].id);
					let client = ClientsDetail[i];
					let client_ = client.convertToJSON();
					if (client_ && client_.SystemBrandingId) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalArray.push(client_);
					}
				}

				if (childClientId.length <= 0) {
					flag = false;
				}
			}
			response = paginate(finalArray, limit, page);
			return ResponseSuccess(res, {
				data: response,
				count: finalArray.length,
			});
		} else if (type == 'diwo') {
			[err, parentClient] = await to(
				Client.findOne({
					where: {
						id: parentClientId,
						DiwoAccess: true,
					},
					attributes: ['id', 'client_id', 'name', 'Associate_client_id', 'DiwoSystemBrandingId', 'details'],
					include: [
						{
							model: DiwoSystemBranding,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (parentClient.DiwoSystemBrandingId != null) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalArray.push(client);
			}

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
							DiwoAccess: true,
						},
						attributes: ['id', 'client_id', 'name', 'Associate_client_id', 'DiwoSystemBrandingId', 'details'],
						include: [
							{
								model: DiwoSystemBranding,
							},
						],
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				childClientId = [];

				if (ClientsDetail && ClientsDetail.length <= 0) {
					flag = false;
				}

				for (let i in ClientsDetail) {
					childClientId.push(ClientsDetail[i].id);
					let client = ClientsDetail[i];
					let client_ = client.convertToJSON();
					if (client_ && client_.DiwoSystemBrandingId) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalArray.push(client_);
					}
				}

				if (childClientId.length <= 0) {
					flag = false;
				}
			}
			response = paginate(finalArray, limit, page);
			return ResponseSuccess(res, {
				data: response,
				count: finalArray.length,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSystemBranding = getAllSystemBranding;

const getAllSearchSystemBranding = async function (req, res) {
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

		let parentClientId = clientId;
		let allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);
		let err, client;
		let childClientId = [];
		let ClientsDetail;
		let flag = true;
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereConditionForClient = [];
		let System_branding_ClientIds = [];
		let offset = (page - 1) * limit;
		let FinalClientsDetail;
		let count;
		let newList = [];
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		// let type = req.query.type;
		let clientIds = [];

		childClientId.push(parentClientId);

		if (filterColumn.indexOf('name') > -1) {
			whereConditionForClient.push({
				name: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('client_id') > -1) {
			whereConditionForClient.push({
				client_id: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (whereConditionForClient && whereConditionForClient.length > 0) {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						[sequelize.Op.or]: whereConditionForClient,
						is_deleted: false,
						id: allChildClientList,
					},
					attributes: ['id'],
				})
			);

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let client of ClientsDetail) {
					clientIds.push(client.id);
				}
			}
		}

		if (clientIds && clientIds.length > 0) {
			if (type == 'drip') {
				[err, FinalClientsDetail] = await to(
					Client.findAndCountAll({
						where: {
							id: clientIds,
							DripAccess: true,
						},
						include: [
							{
								model: System_branding,
								required: true,
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'ASC']],
					})
				);

				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, FinalClientsDetail] = await to(
					Client.findAndCountAll({
						where: {
							id: clientIds,
							DiwoAccess: true,
						},
						include: [
							{
								model: DiwoSystemBranding,
								required: true,
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'ASC']],
					})
				);

				if (err) return ResponseError(res, err, 500, true);
			}

			if (FinalClientsDetail && FinalClientsDetail.rows && FinalClientsDetail.rows.length > 0) {
				for (let clientsDetail of FinalClientsDetail.rows) {
					let clients_ = clientsDetail.convertToJSON();
					newList.push(clients_);
				}
			}

			if (FinalClientsDetail != undefined) {
				count = FinalClientsDetail.count;
			} else {
				count = 0;
			}
		}

		return ResponseSuccess(res, {
			data: newList,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchSystemBranding = getAllSearchSystemBranding;

const getClientAppBranding = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			type: Joi.string().trim().max(4).required(),
		});
		const { error, value } = schema.validate({
			clientId: req.params.clientId,
			type: req.query.type,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}
		const { clientId, type } = value;

		// if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
		// 	return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		// }

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		// let clientId = req.params.clientId;
		// let type = req.query.type;
		if (type == 'drip') {
			let appBranding = await getClientAppBrandingByClientId(clientId);
			return ResponseSuccess(res, {
				data: appBranding,
			});
		} else if (type == 'diwo') {
			let appBranding = await getDiwoClientAppBrandingByClientId(clientId);
			return ResponseSuccess(res, {
				data: appBranding,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientAppBranding = getClientAppBranding;

// Get Search Client
const getAllSearchClient = async function (req, res) {
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

		let err;
		let searchKey = req.body.searchKey;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		let allData = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereConditionForClient = [];
		let countryId = [];
		let UpdatedParentClientId = [];
		let ClientsCountryDetail;
		let ClientsDetail;
		let ClientsParentDetail;
		let countryDetail;
		let allSubClientIds = await getAllSubChildClientIds(parentClientId);
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		// let type = req.params.type;

		if (filterColumn.indexOf('name') > -1) {
			whereConditionForClient.push({
				name: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('category') > -1) {
			whereConditionForClient.push({
				category: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('client_id') > -1) {
			whereConditionForClient.push({
				client_id: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('is_deleted') > -1) {
			let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
			let active = 'active';
			let deleted = 'deleted';
			if (active.includes(key)) {
				whereConditionForClient.push({
					is_deleted: false,
				});
			} else if (deleted.includes(key)) {
				whereConditionForClient.push({
					is_deleted: true,
				});
			}
		}

		if (filterColumn.indexOf('country') > -1) {
			[err, countryDetail] = await to(
				Country.findAll({
					where: {
						name: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
				})
			);

			if (countryDetail && countryDetail.length > 0) {
				for (let country of countryDetail) {
					let Updatedcountry = country.convertToJSON();
					countryId.push(Updatedcountry.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('parentclient') > -1) {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						name: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
				})
			);

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let client of ClientsDetail) {
					let Updatedclient = client.convertToJSON();
					UpdatedParentClientId.push(Updatedclient.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);
		}

		if (countryDetail && countryDetail.length > 0) {
			[err, ClientsCountryDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: allSubClientIds,
					},
					include: [
						{
							model: Country,
							through: 'Client_country_mapping',
							where: {
								id: countryId,
							},
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let client of ClientsCountryDetail) {
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);

				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				}
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});
				finalArrayOfClient.push(client_);
			}
		}

		if (UpdatedParentClientId && UpdatedParentClientId.length > 0) {
			[err, ClientsParentDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: allSubClientIds,
						Associate_client_id: UpdatedParentClientId,
					},
					include: [
						{
							model: Country,
							through: 'Client_country_mapping',
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let client of ClientsParentDetail) {
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);

				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				}
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});
				finalArrayOfClient.push(client_);
			}
		}

		if (whereConditionForClient && whereConditionForClient.length > 0) {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						[sequelize.Op.or]: whereConditionForClient,
						is_deleted: false,
						id: allSubClientIds,
					},
					include: [
						{
							model: Country,
							through: 'Client_country_mapping',
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let client of ClientsDetail) {
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);

				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				}
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});
				finalArrayOfClient.push(client_);
			}
		}

		let UpdatedfinalArrayOfClientId = [];
		for (let item of finalArrayOfClient) {
			UpdatedfinalArrayOfClientId.push(item.id);
		}

		let newUpdatedfinalArrayOfClientId = [];
		if (UpdatedfinalArrayOfClientId && UpdatedfinalArrayOfClientId.length > 0) {
			[err, ClientsDetail] = await to(
				Client.findAndCountAll({
					distinct: true,
					subQuery: false,
					where: {
						id: UpdatedfinalArrayOfClientId,
					},
					include: [
						{
							model: Country,
							through: 'Client_country_mapping',
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let client of ClientsDetail.rows) {
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);

				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				}
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				client_.client_country = client_.Countries.map((country) => {
					return country.id;
				});
				if (type == 'drip' && client_.DripAccess) {
					newUpdatedfinalArrayOfClientId.push(client_);
				} else if (type == 'diwo' && client_.DiwoAccess) {
					newUpdatedfinalArrayOfClientId.push(client_);
				}
			}
		}
		let count;
		if (ClientsDetail != undefined) {
			count = ClientsDetail.count;
		} else {
			count = 0;
		}
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: newUpdatedfinalArrayOfClientId,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchClient = getAllSearchClient;

const getSingleClientByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		let type = req.user.type;
		let client;
		if (type == 'drip') {
			[err, client] = await to(
				Client.findOne({
					where: {
						id: clientId,
						DripAccess: true,
					},
					include: [
						{
							model: Client_job_role,
							where: {
								forDrip: true,
							},
							required: false,
						},
						{
							model: Country,
							through: 'Client_country_mapping',
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, client] = await to(
				Client.findOne({
					where: {
						id: clientId,
						DiwoAccess: true,
					},
					include: [
						{
							model: Client_job_role,
							where: {
								forDiwo: true,
							},
							required: false,
						},
						{
							model: Country,
							through: 'Client_country_mapping',
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let client_ = client.convertToJSON();
		[err, parentClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: client_.Associate_client_id,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);
		client_.Parent_client = parentClientsDetail.convertToJSON();

		return ResponseSuccess(res, {
			data: client_,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSingleClientByClientId = getSingleClientByClientId;

const getAllClientAccounts = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		let err;
		// let clientId = parseInt(req.params.clientId);
		let allSubClientIds = [];
		allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);

		let allClientAccount;
		if (type == 'drip') {
			[err, allClientAccount] = await to(
				Client.findAll({
					where: {
						id: allSubClientIds,
						category: 'Client Account',
						DripAccess: true,
					},
					attributes: ['id', 'name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, allClientAccount] = await to(
				Client.findAll({
					where: {
						id: allSubClientIds,
						category: 'Client Account',
						DiwoAccess: true,
					},
					attributes: ['id', 'name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: allClientAccount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllClientAccounts = getAllClientAccounts;

// Get  Clients By Name
const getAllClientById = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, ClientsDetail;
		// let ChildClientId = req.params.clientId;

		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					id: {
						[Op.ne]: 1,
					},
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: ClientsDetail,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllClientById = getAllClientById;

const getAppBrandingById = async function (req, res) {
	try {
		const schema = Joi.object({
			appBrandingId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			appBrandingId: parseInt(req.params.appBrandingId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { appBrandingId } = value;

		let type = req.params.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		// let appBrandingId = req.params.appBrandingId;
		let err, appBranding;
		let childClientId = [];
		if (type == 'drip') {
			[err, appBranding] = await to(
				System_branding.findOne({
					where: {
						id: appBrandingId,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'category', 'DripAccess', 'DiwoAccess'],
							include: [
								{
									model: ClientCustomReport,
									attributes: ['id', 'ClientId', 'report_name'],
								},
								{
									model: ClientTeamSetup,
									attributes: ['id'],
								},
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, appBranding] = await to(
				DiwoSystemBranding.findOne({
					where: {
						id: appBrandingId,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'category', 'DripAccess', 'DiwoAccess'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: appBranding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAppBrandingById = getAppBrandingById;

const supendAccount = async function (req, res) {
	try {
		const schema = Joi.object({
			status: Joi.string().trim().required(),
			AccountId: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		// Validate the request body
		const { error, value } = schema.validate({
			status: req.params.status,
			AccountId: req.body,
		});
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		const { status, AccountId } = value;

		// let status = req.params.status;
		// let AccountId = req.body;
		let message;
		let type = req.user.type;
		if (type == 'drip') {
			if (status == 'suspend') {
				[err, updateAccount] = await to(
					Client.update(
						{
							status: 'Suspend',
						},
						{
							where: {
								id: AccountId,
								DripAccess: true,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				message = 'Account Successfully Suspended';
			} else {
				[err, updateAccount] = await to(
					Client.update(
						{
							status: 'Active',
						},
						{
							where: {
								id: AccountId,
								DripAccess: true,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				message = 'Account Successfully Activated';
			}
		} else if (type == 'diwo') {
			if (status == 'suspend') {
				[err, updateAccount] = await to(
					Client.update(
						{
							status: 'Suspend',
						},
						{
							where: {
								id: AccountId,
								DiwoAccess: true,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				message = 'Account Successfully Suspended';
			} else {
				[err, updateAccount] = await to(
					Client.update(
						{
							status: 'Active',
						},
						{
							where: {
								id: AccountId,
								DiwoAccess: true,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				message = 'Account Successfully Activated';
			}
		}

		// //For Notifcation
		// if (status == 'archive') {
		//     let notifcationMessage = `${userId.length} Learner Archived. `;
		//     await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		// }
		return ResponseSuccess(res, {
			data: message,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.supendAccount = supendAccount;

const getAllSubClientAndBranchAccountList = async function (req, res) {
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

		let type = req.user.type;
		// let parentClientId = parseInt(req.params.clientId);
		let finalArrayOfClients = await getAllSubClientAndBranchAccountLists(parseInt(parentClientId), true);
		let finalList = [];
		for (let client of finalArrayOfClients) {
			if (type == 'drip' && client.DripAccess) {
				finalList.push(client);
			} else if (type == 'diwo' && client.DiwoAccess) {
				finalList.push(client);
			}
		}

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSubClientAndBranchAccountList = getAllSubClientAndBranchAccountList;

const getAllSubClientAndBranchAdminUserList = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.params.roleId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId, roleId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err;
		// let clientId = parseInt(req.params.clientId);
		// let roleId = parseInt(req.params.roleId);
		let finalList = [];
		[err, userList] = await to(
			User_role_client_mapping.findAll({
				where: {
					RoleId: roleId,
					ClientId: clientId,
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
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (userList.length > 0) {
			for (let user of userList) {
				if (user.User.local_user_id) {
					[err, localUser] = await to(
						dbInstance[user.User.Market.db_name].User_master.findOne({
							where: {
								id: user.User.local_user_id,
							},
							attributes: ['first', 'last', 'email'],
						})
					);

					if (localUser) {
						let payload = {
							id: user.User.id,
							fullName: localUser.first + ' ' + localUser.last,
							ClientId: user.ClientId,
							RoleId: user.RoleId,
							AccountId: user.User.account_id,
						};
						finalList.push(payload);
					}
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
module.exports.getAllSubClientAndBranchAdminUserList = getAllSubClientAndBranchAdminUserList;

const getAllBranchNameForSporRegistarion = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId } = value;

		// if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
		// 	return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		// }

		// let clientId = req.params.clientId;
		let finalArrayOfClients = await getAllSubBranchClientIds(clientId, 'diwo');
		return ResponseSuccess(res, {
			data: finalArrayOfClients,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllBranchNameForSporRegistarion = getAllBranchNameForSporRegistarion;

const getAppBrandingForSpotRegBySessionCode = async function (req, res) {
	try {
		const schema = Joi.object({
			code: Joi.string().trim().min(2).required(), // Must be > 0
		});

		const { error, value } = schema.validate({
			code: req.params.sessionCode,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId, code } = value;

		// if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
		// 	return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		// }

		// let clientId = req.params.clientId;
		// let code = req.params.sessionCode;
		let appBranding;
		let flag = true;
		let session;
		let sessionData;
		let client;

		[err, session] = await to(
			Session.findOne({
				where: {
					code: code,
				},
				include: [
					{
						model: Client,
						attributes: ['id', 'avatar_file_name', 'avatar_path'],
					},
				],
			})
		);
		if (err) ThrowException(err.message);

		sessionData = session.convertToJSON();

		[err, client] = await to(
			Client.findOne({
				where: {
					id: sessionData.Client.id,
				},
				include: [
					{
						model: DiwoSystemBranding,
					},
				],
			})
		);

		if (err) {
			console.log('-----Error 01 Get Client App Branding By Client Id--', err);
		}

		if (client && client.DiwoSystemBrandingId && client.category == 'Client Account') {
			// appBranding = client.DiwoSystemBranding.convertToJSON();
			let client_ = client.convertToJSON();
			appBranding = client_.DiwoSystemBranding;
			appBranding.customFields = client_.customFields;
		} else {
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
								model: DiwoSystemBranding,
							},
						],
					})
				);
				if (err) {
					console.log('-----Error 02 Get Client App Branding By Client Id--', err);
				}

				if (parentClient && parentClient.DiwoSystemBrandingId && parentClient.category == 'Client Account') {
					let parentClient_ = parentClient.convertToJSON();
					appBranding = parentClient_.DiwoSystemBranding;
					appBranding.customFields = parentClient_.customFields;
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}

		appBranding.Client = sessionData.Client;
		return ResponseSuccess(res, {
			data: appBranding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAppBrandingForSpotRegBySessionCode = getAppBrandingForSpotRegBySessionCode;

const disableWhatsAppDefaultReplyToggle = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// const clientId = req.params.clientId;
		//Get App Bracding by using Client Id
		// Disable WhatsApp Default Reply Toggle
		let appBranding = await getClientAppBrandingByClientId(clientId);
		if (appBranding) {
			[err, updateValue] = await to(
				System_branding.update(
					{
						setDefaultReply: false,
						dripIdForDefaultReply: null,
					},
					{
						where: {
							id: appBranding.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: 'WhatsApp Default Reply Toggle Disabled Successfully',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.disableWhatsAppDefaultReplyToggle = disableWhatsAppDefaultReplyToggle;
