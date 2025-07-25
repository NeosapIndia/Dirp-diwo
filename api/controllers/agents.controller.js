const {
	Op,
	sequelize,
	WhatsAppSetup,
	Client,
	User,
	Market,
	Agent,
	ClientAgentMapping,
	ClientWhatsAppSetup,
	AgentVersion,
} = require('../models1/connectionPool')['global'];
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
const moment = require('moment');
const { getTeamAccessTokenByClientId } = require('./microsoft-teams.controller');
const axios = require('axios');
const schedule = require('node-schedule');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');

const { Client: langChainClient } = require('@langchain/langgraph-sdk');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');
const createAgents = async function (req, res) {
	try {
		let data = req.body.agentDetails;
		let childClient = req.body.selectedChildClient;
		let type = req.user.type;
		let versions = req.body.versions;
		let finalList = [];
		if ((!data.openAISecretKey || !data.assistantId || !data.ClientId) && data.type === 'OpenAI Assistant API') {
			return ResponseError(
				res,
				{
					message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
				},
				500,
				true
			);
		} else if ((!data.endPointURL || !data.customAssistantId || !data.ClientId) && data.type === 'Drip Custom Agent') {
			return ResponseError(
				res,
				{
					message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
				},
				500,
				true
			);
		}

		[err, createAgent] = await to(Agent.create(data));
		if (err) return ResponseError(res, err, 500, true);

		let payloadForMain = {
			ClientId: data.ClientId,
			AgentId: createAgent.id,
			mainClient: true,
		};
		if (type === 'drip') {
			payloadForMain.forDrip = true;
			payloadForMain.forDiwo = false;
		}
		finalList.push(payloadForMain);

		if (childClient && childClient.length > 0) {
			for (let client of childClient) {
				if (client.isSelected && data.ClientId != client.id) {
					let payload = {
						ClientId: client.id,
						AgentId: createAgent.id,
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
			[err, addList] = await to(ClientAgentMapping.bulkCreate(finalList));
		}
		if (err) return ResponseError(res, err, 500, true);

		//Add Version
		if (versions?.length > 0 && data.type === 'Drip Custom Agent') {
			let payload = [];
			for (let version of versions) {
				let tmp = {
					version: version.version,
					config: version.config,
					default: version.default,
					AgentId: createAgent.id,
					created_at: moment(version.created_at).format(),
					graph_id: version.graph_id,
				};
				payload.push(tmp);
			}

			[err, addVersionEntry] = await to(AgentVersion.bulkCreate(payload));
			if (err) return ResponseError(res, err, 500, true);
		}

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create Agent`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						AgentId: createAgent.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.AGENT_CREATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createAgents = createAgents;

const updateAgent = async function (req, res) {
	try {
		try {
			let data = req.body.agentDetails;
			let childClient = req.body.selectedChildClient;
			let type = req.user.type;
			let finalList = [];
			let versions = req.body.versions;

			if ((!data.openAISecretKey || !data.assistantId || !data.ClientId) && data.type === 'OpenAI Assistant API') {
				return ResponseError(
					res,
					{
						message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
					},
					500,
					true
				);
			} else if (
				(!data.endPointURL || !data.customAssistantId || !data.ClientId) &&
				data.type === 'Drip Custom Agent'
			) {
				return ResponseError(
					res,
					{
						message: MESSAGE.ADD_ALL_REQUIRED_FIELD,
					},
					500,
					true
				);
			}

			[err, updateWhatsAppSetup] = await to(
				Agent.update(data, {
					where: {
						id: parseInt(req.params.id),
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Delete Old Data
			[err, deleteOldSetup] = await to(
				ClientAgentMapping.destroy({
					where: {
						AgentId: parseInt(req.params.id),
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let payloadForMain = {
				ClientId: data.ClientId,
				AgentId: parseInt(req.params.id),
				mainClient: true,
			};
			if (type === 'drip') {
				payloadForMain.forDrip = true;
				payloadForMain.forDiwo = false;
			}
			finalList.push(payloadForMain);

			if (childClient && childClient.length > 0) {
				for (let client of childClient) {
					if (client.isSelected && data.ClientId != client.id) {
						let payload = {
							ClientId: client.id,
							AgentId: parseInt(req.params.id),
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
				[err, addList] = await to(ClientAgentMapping.bulkCreate(finalList));
			}
			if (err) return ResponseError(res, err, 500, true);

			//Destroy Previous One
			[err, deleteOldVersion] = await to(
				AgentVersion.destroy({
					where: {
						AgentId: parseInt(req.params.id),
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Add Version
			if (versions?.length > 0 && data.type === 'Drip Custom Agent') {
				let payload = [];
				for (let version of versions) {
					let tmp = {
						version: version.version,
						config: version.config,
						default: version.default,
						AgentId: parseInt(req.params.id),
						created_at: moment(version.created_at).format(),
						graph_id: version.graph_id,
					};
					payload.push(tmp);
				}

				[err, addVersionEntry] = await to(AgentVersion.bulkCreate(payload));
				if (err) return ResponseError(res, err, 500, true);
			}

			if (req.user.type === 'drip') {
				[err, newLog] = await to(
					createlog(
						req.user.id,
						req.user.ClientId,
						req.user.RoleId,
						`Update Agent`,
						req.ip,
						req.useragent,
						req.user.type,
						{
							AgentId: parseInt(req.params.id),
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			return ResponseSuccess(res, {
				message: MESSAGE.AGENT_UPDATE,
			});
		} catch (error) {
			return ResponseError(res, error, 500, true);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateAgent = updateAgent;

const deleteAgent = async function (req, res) {
	try {
		let id = req.body;
		// console.log('--------', req.body);
		[err, deleteAgent_] = await to(
			ClientAgentMapping.destroy({
				where: {
					AgentId: id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteAgentDetails] = await to(
			Agent.destroy({
				where: {
					id: id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Delete Agent`, req.ip, req.useragent, req.user.type, {
				AgentId: id,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.AGENT_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteAgent = deleteAgent;

const getAllAgents = async function (req, res) {
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
		let type = req.params.type;
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let agentsDetails;

		let whereCondition = {
			ClientId: allChildClientList,
			mainClient: true,
		};
		let whereConditonForClient = {};

		if (type === 'drip') {
			whereCondition.forDrip = true;
			whereConditonForClient.DripAccess = true;
		}

		[err, agentsDetails] = await to(
			ClientAgentMapping.findAndCountAll({
				where: whereCondition,
				include: [
					{
						model: Client,
						where: whereConditonForClient,
						attributes: ['id', 'name', 'client_id'],
					},
					{
						model: Agent,
						attributes: ['id', 'type'],
					},
				],
				offset: offset,
				limit: limit,
				order: [['createdAt', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		if (agentsDetails && agentsDetails.rows && agentsDetails.rows.length > 0) {
			for (let Agent of agentsDetails.rows) {
				let agentDetail = Agent.convertToJSON();
				finalList.push(agentDetail);
			}
		}

		let count;
		if (agentsDetails != undefined) {
			count = agentsDetails.count;
		} else {
			count = 0;
		}
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { data: finalList, count: count });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAgents = getAllAgents;

const getAgentById = async function (req, res) {
	try {
		const id = parseInt(req.params.id);

		[err, agentDetails] = await to(
			Agent.findOne({
				where: {
					id: id,
				},
				include: [
					{ model: ClientAgentMapping, include: [{ model: Client, attributes: ['id', 'name', 'client_id'] }] },
					{ model: AgentVersion },
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: agentDetails });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAgentById = getAgentById;

const getAllClientListWithOutAgent = async function (req, res) {
	try {
		let parentClientId = parseInt(req.params.clientId);
		let err, ClientsDetail;
		let type = req.params.type;

		//Get All Child Client Id With parentClientId;
		let allChildClientIds = [];
		allChildClientIds = await getAllSubChildClientIds(parentClientId);
		// allChildClientIds.push(parentClientId);

		let whereCondition = {
			ClientId: allChildClientIds,
			forDrip: true,
		};

		[err, agentDetails] = await to(
			ClientAgentMapping.findAll({
				where: whereCondition,
				attributes: ['ClientId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (agentDetails && agentDetails.length > 0) {
			for (let agent of agentDetails) {
				allChildClientIds.splice(allChildClientIds.indexOf(agent.ClientId), 1);
			}
		}
		[err, ClientsDetail] = await to(
			Client.findAll({
				where: {
					is_deleted: false,
					id: allChildClientIds,
					DripAccess: true,
				},
				attributes: ['id', 'name', 'client_id'],
				order: [['createdAt', 'DESC']],
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
module.exports.getAllClientListWithOutAgent = getAllClientListWithOutAgent;

const createDripCustomAssistance = async function (req, res) {
	try {
		const apiKey = req.body.customApiKey;
		const endPointURL = req.body.endPointURL;
		const assistantName = req.body.assistantName;
		const configuration = req.body.config;
		const client = new langChainClient({
			apiUrl: endPointURL,
			apiKey: apiKey,
		});

		let payload = {
			graphId: 'retrieval_graph',
			config: JSON.parse(configuration),
			metadata: {},
			name: assistantName,
		};

		// console.log('----payload--', payload);
		//Create Assistance
		const assistance = await client.assistants.create(payload);

		// console.log('-----assistance------', assistance);

		//Update Assistance
		// let config = JSON.parse(configuration);
		// config.configurable.retriever_provider = 'mongodb';
		// console.log('-----config------', config);
		// const updateAssistance = await client.assistants.update('a6a7c5d4-1504-487a-b3db-2f40b17db55a', { config });
		// console.log('---updateAssistance---', updateAssistance);

		//Set Version
		// const changeAssistantVersion = await client.assistants.setLatest('a6a7c5d4-1504-487a-b3db-2f40b17db55a', 2);
		// console.log('---changeAssistantVersion---', changeAssistantVersion);

		//Get All Version
		// const allVersion = await client.assistants.getVersions('a6a7c5d4-1504-487a-b3db-2f40b17db55a');
		// console.log('-------allVersion------------', allVersion);

		return ResponseSuccess(res, {
			data: assistance,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDripCustomAssistance = createDripCustomAssistance;

const updateDripCustomAssistance = async function (req, res) {
	try {
		// Update Assistance
		const apiKey = req.body.customApiKey;
		const endPointURL = req.body.endPointURL;
		const assistanceId = req.body.assistanceId;
		const configuration = req.body.config;

		const client = new langChainClient({
			apiUrl: endPointURL,
			apiKey: apiKey,
		});
		let config = JSON.parse(configuration);

		const updateAssistance = await client.assistants.update(assistanceId, { config });

		return ResponseSuccess(res, {
			data: updateAssistance,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDripCustomAssistance = updateDripCustomAssistance;

const getAssistantDetailsAndAllVersion = async function (req, res) {
	try {
		const apiKey = req.body.customApiKey;
		const endPointURL = req.body.endPointURL;
		const assistanceId = req.body.assistanceId;

		const client = new langChainClient({
			apiUrl: endPointURL,
			apiKey: apiKey,
		});

		//Get All Version
		const versions = await client.assistants.getVersions(assistanceId);

		//Get Assistant details
		const assistant = await client.assistants.get(assistanceId);

		return ResponseSuccess(res, {
			data: { versions, assistant },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAssistantDetailsAndAllVersion = getAssistantDetailsAndAllVersion;

const setAssistantVersion = async function (req, res) {
	try {
		const apiKey = req.body.customApiKey;
		const endPointURL = req.body.endPointURL;
		const assistanceId = req.body.assistanceId;
		const version = req.body.version;
		const client = new langChainClient({
			apiUrl: endPointURL,
			apiKey: apiKey,
		});
		const changeAssistantVersion = await client.assistants.setLatest(assistanceId, version);

		return ResponseSuccess(res, {
			data: changeAssistantVersion,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.setAssistantVersion = setAssistantVersion;

const getAllETLConfigration = async function (req, res) {
	try {
		let err, clientList;
		let parentClientId = [req.params.clientId];
		let finalClientList = [];
		let flag = true;
		let count = 0;
		let maxCount = 0;

		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
					DripAccess: true,
				},
				attributes: [
					'id',
					'name',
					'client_id',
					'category',
					'DripAccess',
					'DiwoAccess',
					'pipelineType',
					'pipelineOption',
					'AIApiKey',
					'chunkSize',
					'chunkOverlap',
					'LlamaParams',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (clientDetails.pipelineType && clientDetails.pipelineOption) {
			let data = clientDetails.convertToJSON();
			finalClientList.push(data);
		}

		[err, maxCount] = await to(Client.count());
		if (err) return ResponseError(res, err, 500, true);

		while (flag) {
			count++;
			[err, clientList] = await to(
				Client.findAll({
					where: {
						Associate_client_id: parentClientId,
					},
					attributes: [
						'id',
						'name',
						'client_id',
						'category',
						'DripAccess',
						'pipelineType',
						'pipelineOption',
						'AIApiKey',
						'chunkSize',
						'chunkOverlap',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientId = [];

			if (clientList.length > 0) {
				for (let client of clientList) {
					parentClientId.push(client.id);
					if (client.pipelineOption && client.pipelineType) {
						let data = client.convertToJSON();
						finalClientList.push(data);
					}
				}
			} else {
				flag = false;
			}

			if (count > maxCount) {
				flag = false;
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
module.exports.getAllETLConfigration = getAllETLConfigration;

const getAllWithoutETLConfigration = async function (req, res) {
	try {
		let err, clientList;
		let parentClientId = [req.params.clientId];
		let finalClientList = [];
		let flag = true;
		let count = 0;
		let maxCount = 0;

		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
					DripAccess: true,
				},
				attributes: [
					'id',
					'name',
					'client_id',
					'category',
					'DripAccess',
					'DiwoAccess',
					'pipelineType',
					'pipelineOption',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (!clientDetails?.pipelineType && !clientDetails?.pipelineOption) {
			let data = clientDetails.convertToJSON();
			data.clientIdWithName = data.client_id + ' - ' + data.name;
			finalClientList.push(data);
		}

		[err, maxCount] = await to(Client.count());
		if (err) return ResponseError(res, err, 500, true);

		while (flag) {
			count++;
			[err, clientList] = await to(
				Client.findAll({
					where: {
						Associate_client_id: parentClientId,
					},
					attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'pipelineType', 'pipelineOption'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientId = [];

			if (clientList.length > 0) {
				for (let client of clientList) {
					parentClientId.push(client.id);
					if (!client.pipelineOption && !client.pipelineType) {
						let data = client.convertToJSON();
						data.clientIdWithName = client.client_id + ' - ' + client.name;
						finalClientList.push(data);
					}
				}
			} else {
				flag = false;
			}

			if (count > maxCount) {
				flag = false;
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
module.exports.getAllWithoutETLConfigration = getAllWithoutETLConfigration;

const createUpdateETL = async function (req, res) {
	try {
		let clientId = req.body.ClientId;

		//Update Piple Details
		[err, updatedetails] = await to(
			Client.update(
				{
					pipelineType: req.body.pipelineType,
					pipelineOption: req.body.pipelineOption,
					AIApiKey: req.body.AIApiKey,
					chunkOverlap: req.body.chunkOverlap,
					chunkSize: req.body.chunkSize,
					EmbeddingModel: req.body.EmbeddingModel,
					EmbeddingProvider: req.body.EmbeddingProvider,
					LlamaParams: req?.body?.LlamaParams ? req?.body?.LlamaParams : null,
				},
				{
					where: {
						id: clientId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			message: 'ETL Configration Updated Successfully',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createUpdateETL = createUpdateETL;
