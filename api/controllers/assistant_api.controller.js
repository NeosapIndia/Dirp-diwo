const {
	Op,
	Client,
	License,
	sequelize,
	VimeoCredential,
	DiwoVimeoCredential,
	ZoomAppDetail,
	ZoomUserToken,
	Drip_whatsapp_non_native,
	Post,
	Assigned_post_to_user,
	User_role_client_mapping,
	ZoomRegistration,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const schedule = require('node-schedule');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const axios = require('axios');
const { createlog } = require('../services/log.service');

const { getAllSubClientAndBranchAccountLists } = require('../services/client.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');

const getAllAssistantAPIDetails = async function (req, res) {
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

		//Get All Under Accounts Ids
		//Then get All Account Data wheren assistant api details present
		// let clientId = parseInt(req.params.clientId);
		let allSubClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);
		[err, accountDetails] = await to(
			Client.findAll({
				where: {
					id: allSubClientIds,
					openAISecretKey: {
						[Op.ne]: null,
					},
					assistantId: {
						[Op.ne]: null,
					},
				},
				attributes: ['id', 'assistantId', 'openAISecretKey', 'name', 'client_id', 'category'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalClientList = [];

		if (accountDetails?.length > 0) {
			for (let account of accountDetails) {
				let clientData = account.convertToJSON();
				finalClientList.push(clientData);
			}
		}

		return ResponseSuccess(res, {
			data: finalClientList,
			count: finalClientList.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAssistantAPIDetails = getAllAssistantAPIDetails;

const getClientListOfWithoutAssistantAPICredential = async function (req, res) {
	try {
		//Get All Under Accounts Ids
		//Then get All Account Data wheren assistant api details is NOT present
		let clientId = parseInt(req.params.clientId);
		let type = req.query.type;
		let allSubClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		[err, accountDetails] = await to(
			Client.findAll({
				where: {
					id: allSubClientIds,
					openAISecretKey: {
						[Op.eq]: null,
					},
					assistantId: {
						[Op.eq]: null,
					},
				},
				attributes: [
					'id',
					'assistantId',
					'openAISecretKey',
					'name',
					'client_id',
					'category',
					'DripAccess',
					'DiwoAccess',
				],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalClientList = [];

		if (accountDetails?.length > 0) {
			for (let account of accountDetails) {
				let clientData = account.convertToJSON();
				if ((type == 'drip' && clientData.DripAccess == true) || (type == 'diwo' && clientData.DiwoAccess == true)) {
					clientData.clientIdWithName = account.client_id + ' - ' + account.name;
					finalClientList.push(clientData);
				}
			}
		}

		return ResponseSuccess(res, {
			data: finalClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientListOfWithoutAssistantAPICredential = getClientListOfWithoutAssistantAPICredential;

const createUpdateAssistanceAPI = async function (req, res) {
	try {
		let clientId = req.body.id;

		[err, addEditAssistantAPI] = await to(
			Client.update(
				{ assistantId: req.body.assistantId, openAISecretKey: req.body.openAISecretKey },
				{ where: { id: clientId } }
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: 'Assistant API details create / update successfully.' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createUpdateAssistanceAPI = createUpdateAssistanceAPI;
