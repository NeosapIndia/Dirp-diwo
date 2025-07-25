const { Op, sequelize, WhatsAppSetup, Client, ClientWhatsAppSetup, User, Market } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { getAllSubChildClientIds } = require('../services/client.service');
const {
	createNotification,
	getAllUserIdsForNotification,
	getAllProductOwnerIdsForNotification,
} = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const Sequelize = require('sequelize');
const { getTeamAccessTokenByClientId } = require('./microsoft-teams.controller');
const axios = require('axios');
const schedule = require('node-schedule');
const shortid = require('shortid');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const config_feature = require('../config/SiteConfig.json');

const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

const createWhatsAppSetupForClient = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			id: Joi.number().integer().allow(null),
			ClientId: Joi.number().integer().positive().required(),
			user_id: Joi.any().required(),
			password: Joi.any().required(),
			status: Joi.string().valid('Active', 'Inactive').required(),
			canSelectTempType: Joi.boolean().required(),
			canChangeTempCat: Joi.boolean().required(),
			category: Joi.any(),
			sendNtOptIn: Joi.boolean().required(),
			optInRedirectUrl: Joi.string().uri().allow(null),
			optInMsg: Joi.string().trim().allow(null, ''),
			messenger_id: Joi.string().trim().max(255).required(),
			messenger_password: Joi.string().trim().max(255).required(),
			messenger_template: Joi.string().trim().max(1000).required(),
			waNumber: Joi.any().required(),
			otpTempId: Joi.string().allow(null),
			otpTempStatus: Joi.string().allow(null),
			messageLimit: Joi.string().valid('TIER_1K', 'TIER_10K', 'TIER_100K', 'TIER_UNLIMITED').allow(null).allow(''),
			enableRetry: Joi.boolean().required(),
			retryInterval: Joi.number().integer().allow(null),
			retryFrequency: Joi.number().integer().allow(null),

			isMeta: Joi.boolean().required(),
			MTPNoId: Joi.string().allow(null),
			MTToken: Joi.string().allow(null),
			MTAccId: Joi.string().allow(null),
			MTAppId: Joi.string().allow(null),
		});

		const { error, value } = validationSchema.validate(req.body.whatsAppSetupDetails);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		let data = value;

		//check Client Access
		//Check ClientId access
		if (!(await checkClientIdAccess(req.user.ClientId, data.ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let childClient = req.body.selectedChildClient;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let finalList = [];
		// if ((data.user_id && data.password && data.ClientId && type === 'drip') || (type == 'diwo' && data.ClientId)) {

		if (
			(((!data.isMeta && data.user_id && data.password) || (data.isMeta && data.MTToken && data.MTAccId)) &&
				data.ClientId &&
				type === 'drip') ||
			(type == 'diwo' && data.ClientId)
		) {
			[err, createWhatsAppSetup] = await to(WhatsAppSetup.create(data));
			if (err) return ResponseError(res, err, 500, true);

			let payloadForMain = {
				ClientId: data.ClientId,
				WhatsAppSetupId: createWhatsAppSetup.id,
				mainClient: true,
			};
			if (type === 'drip') {
				payloadForMain.forDrip = true;
				payloadForMain.forDiwo = false;
			} else if (type === 'diwo') {
				payloadForMain.forDrip = false;
				payloadForMain.forDiwo = true;
			}
			finalList.push(payloadForMain);

			if (childClient && childClient.length > 0) {
				for (let client of childClient) {
					//Check ClientId access

					if (client.isSelected) {
						if (!(await checkClientIdAccess(data.ClientId, client.id))) {
							return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
						}
						let payload = {
							ClientId: client.id,
							WhatsAppSetupId: createWhatsAppSetup.id,
							mainClient: false,
						};
						if (type === 'drip') {
							payload.forDrip = true;
							payload.forDiwo = false;
						} else if (type === 'diwo') {
							payload.forDrip = false;
							payload.forDiwo = true;
						}
						finalList.push(payload);
					}
				}
			}
			if (finalList && finalList.length > 0) {
				[err, addList] = await to(ClientWhatsAppSetup.bulkCreate(finalList));
			}
			if (err) return ResponseError(res, err, 500, true);
		} else {
			return ResponseError(
				res,
				{
					message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
				},
				500,
				true
			);
		}

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create WhatsApp Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: createWhatsAppSetup.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (req.user.type === 'diwo') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create Message Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: createWhatsAppSetup.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.WHATSAPP_SETUP_CREATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createWhatsAppSetupForClient = createWhatsAppSetupForClient;

const updateWhatsAppSetupForClient = async function (req, res) {
	try {
		const clientIdSchema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error: clientIdError, value: clientIdValue } = clientIdSchema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (clientIdError) return ResponseError(res, { message: clientIdError.details[0].message }, 400);

		const { clientId } = clientIdValue;

		const validationSchema = Joi.object({
			id: Joi.number().integer(),
			ClientId: Joi.number().integer().positive().required(),
			user_id: Joi.any().required(),
			password: Joi.any().required(),
			status: Joi.string().valid('Active', 'Inactive').required(),
			canSelectTempType: Joi.boolean().required(),
			canChangeTempCat: Joi.boolean().required(),
			category: Joi.any(),
			sendNtOptIn: Joi.boolean().required(),
			optInRedirectUrl: Joi.string().uri().allow(null),
			optInMsg: Joi.string().trim().allow(null, ''),
			messenger_id: Joi.string().trim().max(255).required(),
			messenger_password: Joi.string().trim().max(255).required(),
			messenger_template: Joi.string().trim().max(1000).required(),
			waNumber: Joi.any().required(),
			otpTempId: Joi.string().allow(null),
			otpTempStatus: Joi.string().allow(null),
			messageLimit: Joi.string().valid('TIER_1K', 'TIER_10K', 'TIER_100K', 'TIER_UNLIMITED').allow(null).allow(''),
			enableRetry: Joi.boolean().required(),
			retryInterval: Joi.number().integer().allow(null),
			retryFrequency: Joi.number().integer().allow(null),

			isMeta: Joi.boolean().required(),
			MTPNoId: Joi.string().allow(null),
			MTToken: Joi.string().allow(null),
			MTAccId: Joi.string().allow(null),
			MTAppId: Joi.string().allow(null),
		});

		const { error, value } = validationSchema.validate(req.body.whatsAppSetupDetails);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		let data = value;

		// let clientId = parseInt(req.params.clientId);

		//Check ClientId access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let data = req.body.whatsAppSetupDetails;
		let childClient = req.body.selectedChildClient;

		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		if (type === 'drip') {
			[err, whatsAppSetupDetails] = await to(
				WhatsAppSetup.findOne({
					where: {
						id: parseInt(req.params.id),
						status: 'Active',
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (whatsAppSetupDetails && whatsAppSetupDetails.isMeta !== data.isMeta) {
				// Meta flag has changed
				if (data.isMeta === true) {
					// Switching from Gupshup → Meta
					data.user_id = null;
					data.password = null;
					data.otpTempId = null;
					data.otpTempStatus = null;
				} else if (data.isMeta === false) {
					// Switching from Meta → Gupshup
					data.MTPNoId = null;
					data.MTToken = null;
					data.MTAccId = null;
					data.MTAppId = null;
					data.otpTempId = null;
					data.otpTempStatus = null;
				}
			}
		}

		let finalList = [];
		if (
			(((!data.isMeta && data.user_id && data.password) || (data.isMeta && data.MTToken && data.MTAccId)) &&
				data.ClientId &&
				type === 'drip') ||
			(type == 'diwo' && data.ClientId)
		) {
			[err, updateWhatsAppSetup] = await to(
				WhatsAppSetup.update(data, {
					where: {
						id: parseInt(req.params.id),
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Delete Old Data
			[err, deleteOldSetup] = await to(
				ClientWhatsAppSetup.destroy({
					where: {
						WhatsAppSetupId: parseInt(req.params.id),
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let payloadForMain = {
				ClientId: data.ClientId,
				WhatsAppSetupId: parseInt(req.params.id),
				mainClient: true,
			};
			if (type === 'drip') {
				payloadForMain.forDrip = true;
				payloadForMain.forDiwo = false;
			} else if (type === 'diwo') {
				payloadForMain.forDrip = false;
				payloadForMain.forDiwo = true;
			}
			finalList.push(payloadForMain);

			if (childClient && childClient.length > 0) {
				for (let client of childClient) {
					if (client.isSelected) {
						if (!(await checkClientIdAccess(data.ClientId, client.id))) {
							return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
						}

						let payload = {
							ClientId: client.id,
							WhatsAppSetupId: parseInt(req.params.id),
							mainClient: false,
						};
						if (type === 'drip') {
							payload.forDrip = true;
							payload.forDiwo = false;
						} else if (type === 'diwo') {
							payload.forDrip = false;
							payload.forDiwo = true;
						}
						finalList.push(payload);
					}
				}
			}

			if (finalList && finalList.length > 0) {
				[err, addList] = await to(ClientWhatsAppSetup.bulkCreate(finalList));
			}

			if (err) return ResponseError(res, err, 500, true);

			//For Notifcation
			[err, parentClient] = await to(
				Client.findOne({
					where: {
						id: data.ClientId,
					},
					attributes: ['name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
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
			let notifcationMessage = MESSAGE.WhatsApp_Setup_Updated;
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			notifcationMessage = notifcationMessage.replace('{{account_name}}', parentClient.name);
			let userIds = await getAllProductOwnerIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotification(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.WhatsApp_Setup_Updated;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace('{{account_name}}', parentClient.name);
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		} else {
			return ResponseError(
				res,
				{
					message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
				},
				500,
				true
			);
		}

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Update WhatsApp Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: parseInt(req.params.id),
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (req.user.type === 'diwo') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Update Message Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: parseInt(req.params.id),
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.WHATSAPP_SETUP_UPDATE,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateWhatsAppSetupForClient = updateWhatsAppSetupForClient;

const getAllClientListWithOutWhatsSetup = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = validationSchema.validate({ clientId: parseInt(req.params.clientId) });

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		let parentClientId = clientId;

		//Check ClientId access
		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, ClientsDetail;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		//Get All Child Client Id With parentClientId;
		let allChildClientIds = [];
		allChildClientIds = await getAllSubChildClientIds(parentClientId);
		allChildClientIds.push(parentClientId);

		let whereCondition = {
			ClientId: allChildClientIds,
			forDrip: true,
			forDiwo: true,
		};

		if (type === 'drip') {
			whereCondition.forDiwo = false;
		} else if (type === 'diwo') {
			whereCondition.forDrip = false;
		}

		[err, whatsAppSetupDetails] = await to(
			ClientWhatsAppSetup.findAll({
				where: whereCondition,
				attributes: ['ClientId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (whatsAppSetupDetails && whatsAppSetupDetails.length > 0) {
			for (let whatsSetup of whatsAppSetupDetails) {
				allChildClientIds.splice(allChildClientIds.indexOf(whatsSetup.ClientId), 1);
			}
		}

		// let whereCOnditionForClient = {
		// 	is_deleted: false,
		// 	id: allChildClientIds,
		// 	DripAccess: true,
		// 	DiwoAccess: true,
		// };

		// if (type === 'drip') {
		// 	whereCOnditionForClient.DiwoAccess = false;
		// } else if (type === 'diwo') {
		// 	whereCOnditionForClient.DripAccess = false;
		// }

		if (type === 'drip') {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: allChildClientIds,
						DripAccess: true,
					},
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);
		} else if (type === 'diwo') {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: allChildClientIds,
						DiwoAccess: true,
					},
					order: [['createdAt', 'DESC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: ClientsDetail,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllClientListWithOutWhatsSetup = getAllClientListWithOutWhatsSetup;

const getAllChildClientListWithWhatsAppSetupDetails = async function (req, res) {
	try {
		let parentClientId = parseInt(req.params.clientId);
		let allChildClientIds = [];
		allChildClientIds = await getAllSubChildClientIds(parentClientId);
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let whereCondition = {
			id: allChildClientIds,
		};

		if (type === 'drip') {
			whereCondition.DripAccess = true;
		} else if (type === 'diwo') {
			whereCondition.DiwoAccess = true;
		}

		[err, clientList] = await to(
			Client.findAll({
				where: whereCondition,
				include: [
					{
						model: ClientWhatsAppSetup,
						require: false,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		for (let clientDetail of clientList) {
			if (clientDetail && clientDetail.ClientWhatsAppSetups && clientDetail.ClientWhatsAppSetups.length == 0) {
				let data = clientDetail.convertToJSON();
				delete data.ClientWhatsAppSetups;
				data.isSelected = false;
				finalList.push(data);
			} else if (clientDetail && clientDetail.ClientWhatsAppSetups && clientDetail.ClientWhatsAppSetups.length != 0) {
				let flag = true;
				for (let setup of clientDetail.ClientWhatsAppSetups) {
					if (setup.forDrip == true && type === 'drip') {
						flag = false;
					} else if (setup.forDiwo == true && type === 'diwo') {
						flag = false;
					}
				}
				if (flag) {
					let data = clientDetail.convertToJSON();
					delete data.ClientWhatsAppSetups;
					data.isSelected = false;
					finalList.push(data);
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
module.exports.getAllChildClientListWithWhatsAppSetupDetails = getAllChildClientListWithWhatsAppSetupDetails;

const deleteWhatsAppSetup = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			id: Joi.number().integer().positive().required(),
		});

		const { error, value } = validationSchema.validate({
			id: parseInt(req.params.id),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { id } = value;

		// let id = parseInt(req.params.id);

		[err, deleteWhatsAppSetup_] = await to(
			ClientWhatsAppSetup.destroy({
				where: {
					WhatsAppSetupId: id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, updateWhatsAppSetupStatus] = await to(
			WhatsAppSetup.destroy({
				where: {
					id: id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Delete WhatsApp Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (req.user.type === 'diwo') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Delete Message Setup`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WhatsAppSetupId: id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.WHATSAPP_SETUP_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteWhatsAppSetup = deleteWhatsAppSetup;

const getWhatsAppSetupById = async function (req, res) {
	try {
		let whatsAppSetupId = parseInt(req.params.id);
		[err, whatsAppSetup] = await to(
			WhatsAppSetup.findOne({
				where: {
					id: whatsAppSetupId,
				},
				include: [
					{
						model: ClientWhatsAppSetup,
						include: [
							{
								model: Client,
								attributes: ['id', 'name', 'client_id'],
							},
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: whatsAppSetup,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWhatsAppSetupById = getWhatsAppSetupById;

const getAllWhatsAppSetup = async function (req, res) {
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

		let parentClientId = clientId;
		let allChildClientList = [];
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let whatsAppSetups;

		let whereCondition = {
			ClientId: allChildClientList,
			mainClient: true,
		};
		let whereConditonForClient = {};

		if (type === 'drip') {
			whereCondition.forDrip = true;
			whereConditonForClient.DripAccess = true;
		} else if (type === ' diwo') {
			whereCondition.forDiwo = true;
			whereConditonForClient.DiwoAccess = true;
		}

		[err, whatsAppSetups] = await to(
			ClientWhatsAppSetup.findAndCountAll({
				where: whereCondition,
				include: [
					{
						model: Client,
						where: whereConditonForClient,
					},
					{
						model: WhatsAppSetup,
					},
				],
				offset: offset,
				limit: limit,
				order: [['createdAt', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		if (whatsAppSetups && whatsAppSetups.rows && whatsAppSetups.rows.length > 0) {
			for (let whatsAppSetup of whatsAppSetups.rows) {
				let whatsAppSetUp_ = whatsAppSetup.convertToJSON();

				whatsAppSetUp_.parentClient = {};

				if (whatsAppSetUp_ && whatsAppSetUp_.Client && whatsAppSetUp_.Client.Associate_client_id) {
					[err, parentClient] = await to(
						Client.findOne({
							where: {
								id: whatsAppSetUp_.Client.Associate_client_id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (parentClient) {
						whatsAppSetUp_.parentClient.name = parentClient.name;
						whatsAppSetUp_.parentClient.client_id = parentClient.client_id;
					}
				}
				finalList.push(whatsAppSetUp_);
			}
		}

		let count;
		if (whatsAppSetups != undefined) {
			count = whatsAppSetups.count;
		} else {
			count = 0;
		}
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { data: finalList, count: count });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllWhatsAppSetup = getAllWhatsAppSetup;

const getAllWhatsAppSetupByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Learner ClientId and User ClientId
		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);

		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let whereCondition = {
			ClientId: clientId,
		};

		if (type === 'drip') {
			whereCondition.forDrip = true;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
		}

		[err, getWhatsAppSetup] = await to(
			ClientWhatsAppSetup.findOne({
				where: whereCondition,
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get Teams Details by Using ClientId
		const haveTeamAccessToken = await getTeamAccessTokenByClientId(clientId);

		if (getWhatsAppSetup) {
			let finalData = getWhatsAppSetup.WhatsAppSetup;
			delete finalData.password;
			delete finalData.user_id;
			return ResponseSuccess(res, {
				data: finalData,
				haveTeamAccessToken: haveTeamAccessToken,
			});
		} else {
			return ResponseSuccess(res, {
				messgae: MESSAGE.WHATSAPP_SETUP_NOT_FOUND,
				haveTeamAccessToken: haveTeamAccessToken,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllWhatsAppSetupByClientId = getAllWhatsAppSetupByClientId;

const getWhatsAppSetupByClientId = async function (req, res) {
	try {
		let clientId = parseInt(req.params.clientId);
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let whereCondition = {
			ClientId: clientId,
		};
		if (type === 'drip') {
			whereCondition.forDrip = true;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
		}
		let data = null;
		[err, whatsAppSetup] = await to(
			ClientWhatsAppSetup.findOne({
				where: whereCondition,
				include: [
					{
						model: WhatsAppSetup,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (whatsAppSetup) {
			data = whatsAppSetup.convertToJSON();
		}

		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWhatsAppSetupByClientId = getWhatsAppSetupByClientId;

const getAllSearchWhatsAppSetup = async function (req, res) {
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
		let allChildClientList = [];
		// let type = req.params.type;
		// let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);
		let whereConditionForClient = [];
		let UpdatedClientId = [];
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let whatsAppSetups;

		if (filterColumn.indexOf('client_id') > -1) {
			whereConditionForClient.push({
				client_id: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('name') > -1) {
			whereConditionForClient.push({
				name: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('status') > -1) {
			[err, whatsAppSetupsDetail] = await to(
				WhatsAppSetup.findAll({
					where: {
						status: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
					},
				})
			);

			if (whatsAppSetupsDetail && whatsAppSetupsDetail.length > 0) {
				for (let setup of whatsAppSetupsDetail) {
					let Updatedsetup = setup.convertToJSON();
					UpdatedClientId.push(Updatedsetup.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('client_id') > -1 || filterColumn.indexOf('name') > -1) {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						[sequelize.Op.or]: whereConditionForClient,
					},
				})
			);

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let client of ClientsDetail) {
					let Updatedclient = client.convertToJSON();
					UpdatedClientId.push(Updatedclient.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);
		}

		let whereCondition = {
			ClientId: UpdatedClientId,
			mainClient: true,
		};
		if (type === 'drip') {
			whereCondition.forDrip = true;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
		}

		[err, whatsAppSetups] = await to(
			ClientWhatsAppSetup.findAndCountAll({
				where: whereCondition,
				include: [
					{
						model: Client,
						where: {
							id: allChildClientList,
						},
					},
					{
						model: WhatsAppSetup,
					},
				],
				offset: offset,
				limit: limit,
				order: [['createdAt', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		if (whatsAppSetups && whatsAppSetups.rows && whatsAppSetups.rows.length > 0) {
			for (let whatsAppSetup of whatsAppSetups.rows) {
				let whatsAppSetUp_ = whatsAppSetup.convertToJSON();

				whatsAppSetUp_.parentClient = {};

				if (whatsAppSetUp_ && whatsAppSetUp_.Client && whatsAppSetUp_.Client.Associate_client_id) {
					[err, parentClient] = await to(
						Client.findOne({
							where: {
								id: whatsAppSetUp_.Client.Associate_client_id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (parentClient) {
						whatsAppSetUp_.parentClient.name = parentClient.name;
						whatsAppSetUp_.parentClient.client_id = parentClient.client_id;
					}
				}
				finalList.push(whatsAppSetUp_);
			}
		}

		let count;
		if (whatsAppSetups != undefined) {
			count = whatsAppSetups.count;
		} else {
			count = 0;
		}
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { data: finalList, count: count });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchWhatsAppSetup = getAllSearchWhatsAppSetup;

const checkWhatsAppSetupIsPresentOrNot = async function (req, res) {
	try {
		let clientIds = req.body.ClientIds;
		clientIds = [...new Set(clientIds)];
		[err, clientList] = await to(
			Client.findAll({
				where: {
					id: clientIds,
				},
				include: [
					{
						model: ClientWhatsAppSetup,
						required: true,
						include: [
							{
								model: WhatsAppSetup,
								where: {
									status: 'Active',
								},
							},
						],
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (clientList.length == clientIds.length) {
			return ResponseSuccess(res, { canOptIn: true });
		} else {
			return ResponseSuccess(res, { canOptIn: false });
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkWhatsAppSetupIsPresentOrNot = checkWhatsAppSetupIsPresentOrNot;

const getClientWhatAppSetupForOTP = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;

		//Check ClientId access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let type = req.params.type;
		let clientWhatsAppSetup_;
		let access = false;

		let whereCondition = {
			ClientId: clientId,
		};
		if (type === 'drip') {
			whereCondition.forDrip = true;
		}

		[err, clientWhatsAppSetup_] = await to(
			ClientWhatsAppSetup.findOne({
				where: whereCondition,
				include: [
					{
						model: WhatsAppSetup,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let message;
		if (clientWhatsAppSetup_ && clientWhatsAppSetup_.WhatsAppSetup) {
			if (clientWhatsAppSetup_.WhatsAppSetup.otpTempId == null || clientWhatsAppSetup_.WhatsAppSetup.otpTempId == '') {
				access = false;
				message = MESSAGE.WHATSAPP_OTP_TEMP_NOT_CREATED;
			} else if (clientWhatsAppSetup_.WhatsAppSetup.otpTempStatus != 'Enabled') {
				access = false;
				message = MESSAGE.WHATSAPP_OTP_TEMP_NOT_ENABLED;
			} else {
				access = true;
			}
		} else {
			access = false;
			message = MESSAGE.WHATSAPP_SETUP_NOT_FOUND;
		}

		return ResponseSuccess(res, {
			data: access,
			message: message,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientWhatAppSetupForOTP = getClientWhatAppSetupForOTP;

const createWhatsAppOTPTemplate = async function (req, res) {
	let clientId = parseInt(req.params.clientId);
	let client_WhatsAppSetup_;
	let err;

	[err, client_WhatsAppSetup_] = await to(
		ClientWhatsAppSetup.findOne({
			where: {
				ClientId: clientId,
				forDrip: true,
			},
			include: [
				{
					model: WhatsAppSetup,
					where: {
						status: 'Active',
					},
					attributes: [
						'id',
						'user_id',
						'password',
						'sendNtOptIn',
						'isMeta',
						'MTPNoId',
						'MTToken',
						'MTAccId',
						'MTAppId',
					],
				},
			],
		})
	);
	if (err) return ResponseError(res, err, 500, true);

	if (
		client_WhatsAppSetup_ &&
		client_WhatsAppSetup_.WhatsAppSetup &&
		client_WhatsAppSetup_.WhatsAppSetup.isMeta == false
	) {
		try {
			if (client_WhatsAppSetup_ && client_WhatsAppSetup_.WhatsAppSetup && client_WhatsAppSetup_.WhatsAppSetup.user_id) {
				let optButtons = [{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copy code' }];
				let params = {
					userid: parseInt(client_WhatsAppSetup_.WhatsAppSetup.user_id),
					password: client_WhatsAppSetup_.WhatsAppSetup.password,
					method: 'create_whatsapp_hsm',
					template_name: `WhatsAppOTPTemplate_${Date.now()}`,
					category: 'authentication',
					type: 'text',
					language: 'en_US',
					template: `{{${1}}} is your verification code.`,
					quickReplyFirst: true,
					otp_buttons: JSON.stringify(optButtons),
					message_send_ttl_seconds: -1,
					allow_category_change: false,
					add_security_recommendation: true,
				};

				console.log('----Create WhatsApp OTP Template Params---', params);
				let formData = new FormData();
				for (let key in params) {
					formData.append(key, params[key] + '');
				}

				console.log(
					'<<<<<----Url-- ---WhatsApp-OTP--SEND -->>>>>>>>>>>>>>',
					(`${CONFIG.gupshup_whatsup_app_api_url_for_template}`, formData)
				);

				const response = await axios.post(`${CONFIG.gupshup_whatsup_app_api_url_for_template}`, formData);
				console.log('---Create a WhatsApp OTP Template response----', response.data);

				if (response && response.data.status == 'success' && response.data.details[0].template_id) {
					[err, updateTemplateId] = await to(
						WhatsAppSetup.update(
							{
								otpTempId: response.data.details[0].template_id.toString(),
								otpTempStatus: 'Pending',
							},
							{
								where: {
									id: client_WhatsAppSetup_.WhatsAppSetup.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					return ResponseSuccess(res, {
						message: MESSAGE.WHATSAPP_OTP_TEMPLATE_CREATED,
					});
				} else {
					return ResponseError(res, {
						message: response.data.details,
					});
				}
			} else {
				return ResponseError(res, {
					message: MESSAGE.WHATSAPP_SETUP_NOT_FOUND,
				});
			}
		} catch (error) {
			console.log('----Error when Create WhatsApp Template---', error);
			return ResponseError(res, error, 500, true);
		}
	} else {
		try {
			if (client_WhatsAppSetup_ && client_WhatsAppSetup_.WhatsAppSetup) {
				// Replace with dynamic values if needed
				let businessId = client_WhatsAppSetup_.WhatsAppSetup.MTPNoId;
				let accessToken = client_WhatsAppSetup_.WhatsAppSetup.MTToken;

				const templateName = `meta_otp_template_${Date.now()}`;

				let payload = {
					name: templateName,
					category: 'AUTHENTICATION',
					language: 'en_US',
					components: [
						{
							type: 'BODY',
							add_security_recommendation: true,
						},
						{
							type: 'FOOTER',
							code_expiration_minutes: 15,
						},
						{
							type: 'BUTTONS',
							buttons: [
								{
									type: 'OTP',
									otp_type: 'COPY_CODE',
									text: 'Copy code',
								},
							],
						},
					],
				};

				console.log('----Meta Create WhatsApp OTP Template Params---', payload);

				const url = `https://graph.facebook.com/v23.0/${businessId}/message_templates`;

				let response;
				try {
					response = await axios.post(url, payload, {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
					});
				} catch (apiError) {
					console.log('---Meta Template Creation Error---', apiError?.response?.data || apiError);
					return ResponseError(res, {
						message: apiError?.response?.data?.error?.message || 'Meta template creation failed',
						details: apiError?.response?.data || apiError,
					});
				}

				console.log('---Meta WhatsApp OTP Template Response---', response?.data);

				if (response?.data?.id) {
					[err, updateTemplateId] = await to(
						WhatsAppSetup.update(
							{
								otpTempId: response.data.id,
								otpTempStatus: 'Pending',
								templateName: templateName,
							},
							{
								where: {
									id: client_WhatsAppSetup_.WhatsAppSetup.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);

					return ResponseSuccess(res, {
						message: MESSAGE.WHATSAPP_OTP_TEMPLATE_CREATED,
					});
				} else {
					return ResponseError(res, {
						message: 'Meta response missing template ID',
						details: response?.data,
					});
				}
			} else {
				return ResponseError(res, {
					message: MESSAGE.WHATSAPP_SETUP_NOT_FOUND,
				});
			}
		} catch (error) {
			console.log('----Error when Creating Meta WhatsApp Template---', error?.response?.data || error);
			return ResponseError(res, error?.response?.data || error, 500, true);
		}
	}
};
module.exports.createWhatsAppOTPTemplate = createWhatsAppOTPTemplate;

if (config_feature?.configurable_feature?.whatsApp) {
	//Run WhatsAPP Template Status Check Scheduler
	let whtsapp_template_status_check_schedulor = schedule.scheduleJob('*/1 * * * *', function (fireDate) {
		console.log('Run Scheduler --->>>-->>>  WhatsApp OTP check template schedulor', fireDate);
		checkWhatsAppOTPTemplateStatus();
	});
	module.exports.whtsapp_template_status_check_schedulor = whtsapp_template_status_check_schedulor;
} else {
	console.log('-----------Check WhatsApp OTP Template Status Scheduler is disabled.----------------');
}

const checkWhatsAppOTPTemplateStatus = async function () {
	try {
		// For WhatsAppSetup
		[err, whatsAppsetups_] = await to(
			WhatsAppSetup.findAll({
				where: {
					otpTempId: {
						[Op.ne]: null,
					},
					otpTempStatus: 'Pending',
					status: 'Active',
				},
				attributes: ['id', 'user_id', 'password', 'otpTempId', 'isMeta', 'MTPNoId', 'MTToken', 'MTAccId', 'MTAppId'],
			})
		);
		if (err) {
			console.log('---Error-- When Get WhatsApp OTP check Template Status---', err);
		}

		if (whatsAppsetups_ && whatsAppsetups_.length > 0) {
			for (let whatsAppsetup of whatsAppsetups_) {
				if (!whatsAppsetup.isMeta) {
					let params = {
						id: parseInt(whatsAppsetup.otpTempId),
						userid: parseInt(whatsAppsetup.user_id),
						password: whatsAppsetup.password,
						method: `get_whatsapp_hsm`,
					};

					const response = await axios.get(
						`${CONFIG.gupshup_whatsup_app_api_url_for_template}?${new URLSearchParams(params).toString()}`
					);

					if (response && response.data && response.data.data && response.data.data?.[0]?.status) {
						let status = response.data.data[0].status.toLowerCase();
						let status_ = status.charAt(0).toUpperCase() + status.slice(1);

						[err, updateTemplateStatus] = await to(
							WhatsAppSetup.update(
								{
									otpTempStatus: status_,
								},
								{
									where: {
										id: whatsAppsetup.id,
									},
								}
							)
						);
						if (err) console.log('---Error at update WhatsApp OTP Template status----', err);

						// if (status_ === 'Enabled') {
						// 	[err, updateDripStatus] = await to(
						// 		Post.update(
						// 			{
						// 				drip_status: 'Published',
						// 			},
						// 			{
						// 				where: {
						// 					id: whatsAppNative.PostId,
						// 				},
						// 			}
						// 		)
						// 	);
						// 	if (err) console.log('----Error When update Drip Status---', err);

						// 	[err, postData] = await to(
						// 		Post.findOne({
						// 			where: {
						// 				id: PostId,
						// 			},
						// 			attributes: ['UserId', 'drip_title'],
						// 		})
						// 	);
						// 	let notifcationMessage = MESSAGE.Template_Approved;
						// 	if (category_ !== tempCategory) {
						// 		notifcationMessage = MESSAGE.Template_Approved_With_Change_Category;
						// 		notifcationMessage = notifcationMessage.replace('{{old_Category_name}}', tempCategory);
						// 		notifcationMessage = notifcationMessage.replace('{{new_Category_name}}', category_);
						// 	}
						// 	//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
						// 	notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
						// 	await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
						// } else if (status_ === 'Rejected') {
						// 	[err, postData] = await to(
						// 		Post.findOne({
						// 			where: {
						// 				id: PostId,
						// 			},
						// 			attributes: ['UserId', 'ClientId', 'drip_title'],
						// 		})
						// 	);
						// 	let notifcationMessage = MESSAGE.Template_Rejected;
						// 	//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
						// 	notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
						// 	await createNotification(notifcationMessage, ['Bell', 'PopUp'], [postData.UserId]);

						// 	const appBrandingData = await getClientAppBrandingByClientId(postData.ClientId);
						// 	const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
						// 	[err, getUser] = await to(
						// 		User.findOne({
						// 			where: {
						// 				id: postData.UserId,
						// 			},
						// 			attributes: ['local_user_id', 'MarketId', 'id'],
						// 			include: [
						// 				{
						// 					model: Market,
						// 					attributes: ['db_name'],
						// 				},
						// 			],
						// 		})
						// 	);
						// 	if (err) return ResponseError(res, err, 500, true);
						// 	[err, localUser] = await to(
						// 		dbInstance[getUser.Market.db_name].User_master.findOne({
						// 			where: {
						// 				id: getUser.local_user_id,
						// 			},
						// 			attributes: ['first', 'last', 'email'],
						// 		})
						// 	);
						// 	if (err) return ResponseError(res, err, 500, true);
						// 	let finalEmailList = [];
						// 	let personalisations = {};
						// 	personalisations.to = localUser.email;
						// 	if (personalisations.to != null && personalisations.to != '') {
						// 		personalisations.dynamic_template_data = {
						// 			first_name: localUser.first,
						// 			drip_name: tempName,
						// 			drip_id: templateId,
						// 			client_signature: signature,
						// 		};
						// 		if (localUser.email) finalEmailList.push(personalisations);
						// 	}
						// 	await notificationEmail(finalEmailList, 'Template Reject', postData.ClientId, 'drip');
						// }
					}
				} else {
					try {
						const response = await axios.get(`https://graph.facebook.com/v23.0/${whatsAppsetup.otpTempId}`, {
							headers: {
								Authorization: `Bearer ${whatsAppsetup.MTToken}`,
							},
						});

						const status = response?.data?.status?.toLowerCase();

						if (status) {
							let status_ = status.charAt(0).toUpperCase() + status.slice(1);

							console.log('----META OTP Template status-----', status_);

							let templateStatus = 'Pending';

							if (status_ === 'Approved') {
								templateStatus = 'Enabled';
							} else if (status_ === 'Rejected') {
								templateStatus = 'Rejected';
							}

							const payload = {
								otpTempStatus: templateStatus,
							};

							[err, updateTemplateStatus] = await to(
								WhatsAppSetup.update(payload, {
									where: { id: whatsAppsetup.id },
								})
							);

							if (err) {
								console.log(`---Error updating OTP Template status for ID ${id}---`, err);
							}
						}
					} catch (error) {
						console.log(
							`---Error fetching Meta template status for ID ${whatsAppsetup.otpTempId}---`,
							error?.response?.data || error
						);
					}
				}
			}
		}
	} catch (error) {
		console.log('----Error- when Check OTP Template STatus---', error);
	}
};
module.exports.checkWhatsAppOTPTemplateStatus = checkWhatsAppOTPTemplateStatus;
