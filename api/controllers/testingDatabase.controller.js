const {
	Client,
	Market,
	User,
	Alert_popup,
	Custom_email,
	Promotional_banner,
	sign_in_message,
	Client_job_role,
	Campaign,
	User_group,
	User_group_mapping,
	CustomerPolicyLog,
	PolicyChangeLog,
	Country,
	Province,
	Outbound_message,
	System_branding,
	User_log,
	Post,
	Asset,
	Asset_detail,
	Post_asset_mapping,
	User_job_role_mapping,
	sequelize,
	Client_country_mapping,
	Drip_native,
	Drip_whatsapp_native,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Campaign_drip_mapping,
	Drip_mapping,
	Campaign_drip_camp_mapping,
	Drip_camp,
	Op,
	menu_mappings,
	Menu,
	WhatsAppSetup,
	ClientWhatsAppSetup,
	DiwoLicense,
	Bot_send_msg,
	CampWhatsAppEmailDrip,
	Assigned_post_to_user,
	DripVideoLog,
	WhatsAppDeliveryStatus,
	Bot_message,
	Neo_Phoenix_vs_competitor,
	CampTakeAction,
	User_role_client_mapping,
	Drip_only_email,
	ClientAgentMapping,
	Agent,
} = require('../models1/connectionPool')['global'];
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const axios = require('axios');
const moment = require('moment');

const { to, ResponseSuccess, ResponseError } = require('../services/util.service');
const dbInstance = require('../models1/connectionPool');
const {
	getAddOneLearnerCount,
	getRemoveOneLearnerCount,
	getLearnerValidaionOnCreateLearner,
	getClientChildVilidation,
} = require('../services/license.service');
const { getAllSubChildClientIds } = require('../services/client.service');

const fs = require('fs');
const FileType = require('file-type');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const geoip = require('geoip-lite');
const { parsePhoneNumber } = require('libphonenumber-js');

const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const { Client: langChainClient } = require('@langchain/langgraph-sdk');

const deleteTestingBotData = async function (req, res) {
	try {
		if (env == 'local' || env == 'development' || env == 'dev') {
			let allUser = req.params.flag; // 'true' or 'false'
			let userIds = req.params.userId; // '[1234,1234]'

			let dripflowIds = [2364, 2365, 2366, 2367, 2393, 2394, 2395, 2398, 2393, 2399, 2441, 2523, 2529, 2559];
			if (allUser == 'true' || allUser == true) {
				[err, deleteData] = await to(
					CampWhatsAppEmailDrip.destroy({
						where: {
							CampaignId: dripflowIds,
						},
					})
				);
				if (err) console.log('---error----', err);

				[err, deleteData] = await to(
					CampTakeAction.destroy({
						where: {
							CampaignId: dripflowIds,
						},
					})
				);
				if (err) console.log('---error----', err);

				[err, deleteData] = await to(
					Assigned_post_to_user.destroy({
						where: {
							CampaignId: dripflowIds,
						},
					})
				);
				if (err) console.log('---error----', err);
			} else {
				userIds = userIds.split(',');

				[err, userIds_] = await to(
					User.findAll({
						where: {
							account_id: userIds,
						},
						attributes: ['id'],
					})
				);

				userIds = [];
				for (let user of userIds_) {
					userIds.push(user.id);
				}
				if (userIds_.length > 0) {
					[err, deleteData] = await to(
						CampWhatsAppEmailDrip.destroy({
							where: {
								CampaignId: dripflowIds,
								UserId: userIds,
							},
						})
					);
					if (err) console.log('---error----2', err);

					[err, deleteData] = await to(
						CampTakeAction.destroy({
							where: {
								CampaignId: dripflowIds,
								UserId: userIds,
							},
						})
					);
					if (err) console.log('---error----2', err);

					[err, deleteData] = await to(
						Assigned_post_to_user.destroy({
							where: {
								CampaignId: dripflowIds,
								UserId: userIds,
							},
						})
					);
					if (err) console.log('---error----2', err);
				}
			}
			return ResponseSuccess(res, {
				message: 'Success!!',
			});
		} else {
			return ResponseError(res, 'You are not authorized to delete this data', 401, true);
		}
	} catch (error) {
		console.log('---error deleteTestingBotData--', error);
		return ResponseError(res, err, 500, true);
	}
};
module.exports.deleteTestingBotData = deleteTestingBotData;

//////////////////////////////////////////////////////////////////Code For Load Testing Testing///////////////////////////////////////////

const updateTackActionFlage = async function (req, res) {
	try {
		let postIds = [];
		[err, assignPostToUserData] = await to(
			Assigned_post_to_user.findAll({
				where: {
					isDripClickAction: false,
				},
				include: [
					{
						model: Post,
						required: true,
						where: {
							tempType: ['Poll', 'Quiz'],
						},
					},
				],
				attributes: ['id'],
			})
		);
		for (let data of assignPostToUserData) {
			postIds.push(data.id);
		}

		[err, assignPostToUserData] = await to(
			Assigned_post_to_user.update(
				{
					isDripClickAction: true,
				},
				{
					where: {
						id: postIds,
					},
				}
			)
		);

		return ResponseSuccess(res, {
			message: 'success',
		});
	} catch (error) {
		console.log('--error', error);
	}
};
module.exports.updateTackActionFlage = updateTackActionFlage;

//Geting User Pernoanl Details By Client Id's
const getAllContactEmailAndMobileNumber = async function (req, res) {
	try {
		let clientId = req.body.ClientId;
		let userDetails;
		let finalData = [];

		let whereCondtion = {
			ClientId: clientId,
			RoleId: 1,
		};
		if (req.body.forDrip) {
			whereCondtion.forDrip = true;
		} else if (req.body.forDiwo) {
			whereCondtion.forDiwo = true;
		}

		//Get All Users Details With Market Id
		[err, userDetails] = await to(
			User_role_client_mapping.findAll({
				where: whereCondtion,
				include: [
					{
						model: User,
						where: {
							cStatus: 'Active',
							status: true,
						},
						attributes: ['id', 'local_user_id', 'MarketId', 'account_id'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let marketList;
		[err, marketList] = await to(
			Market.findAll({
				where: {
					status: true,
					id: 1,
				},
				attributes: ['id', 'db_name'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let marketWiseData = [];
		for (let market of marketList) {
			marketWiseData.push({ ids: [[]], MarketId: market.id, db_name: market.db_name, finalData: [] });
		}

		if (userDetails && userDetails.length > 0) {
			for (let user of userDetails) {
				if (user.User.MarketId) {
					if (
						marketWiseData[user.User.MarketId - 1].ids[marketWiseData[user.User.MarketId - 1].ids.length - 1].length >=
						100
					) {
						marketWiseData[user.User.MarketId - 1].ids.push([]);
					}
					marketWiseData[user.User.MarketId - 1].ids[marketWiseData[user.User.MarketId - 1].ids.length - 1].push(
						user.User.local_user_id
					);
				}
			}
		}
		if (userDetails.length > 0) {
			for (let market of marketWiseData) {
				if (market.ids.length > 0) {
					for (let ids of market.ids) {
						if (ids.length == 0) {
							break;
						}
						let query = `SELECT id, "first", "email", "last", "phone" FROM "User_masters" AS "User_master" WHERE "User_master"."id" IN (${ids.toString()}) ORDER BY "User_master"."id" DESC;`;
						let localUsers = await dbInstance[market.db_name].query(query);
						finalData = [...finalData, ...localUsers[0]];
						if (localUsers && localUsers[0].length > 0) {
							market.finalData = [...market.finalData, ...localUsers[0]];
						}
					}
				}
			}
			return ResponseSuccess(res, {
				message: 'success',
				totleCount: finalData.length,
				data: finalData,
			});
		}
		return ResponseSuccess(res, {
			message: 'success',
			totleCount: 0,
			data: [],
		});
	} catch (error) {
		// console.log('-	error-', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllContactEmailAndMobileNumber = getAllContactEmailAndMobileNumber;

const getDripCodeByUsingCampaignIdAndIndex = async function (req, res) {
	try {
		let campaignId = req.body.campaignId;
		let index = req.body.index;

		let finalData = [];

		[err, dripCodeData] = await to(
			CampWhatsAppEmailDrip.findAll({
				where: {
					CampaignId: campaignId,
					DripCampIndex: index,
				},
				attributes: ['id', 'code', 'UserId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: dripCodeData, message: 'success', totalCount: dripCodeData.length });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripCodeByUsingCampaignIdAndIndex = getDripCodeByUsingCampaignIdAndIndex;

const testingChatBot = async function () {
	try {
		console.log('------testingChatBot-------------');
		//Create Client
		const client = new langChainClient({
			apiUrl: 'https://drip-starter-template-e4e01092cb275230b637287667e076b7.default.us.langgraph.app',
			apiKey: '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',
		});

		//Get Assistant Data
		const assistants = await client.assistants.search({
			metadata: null,
			offset: 0,
			limit: 10,
		});

		//Create Thread
		// const thread = await client.threads.create();
		// // thread.thread_id
		// //Create Run
		// const run = await client.runs.create('960da6a5-a144-4616-bd59-7752d421c9d1', assistants[0].assistant_id, {
		// 	input: {
		// 		messages: [
		// 			{
		// 				role: 'human',
		// 				content: 'hey, Good Evening. Can you tell me the current time in India? Please',
		// 			},
		// 		],
		// 	},
		// });

		// const join = await client.runs.join(thread.thread_id, run.run_id);

		// console.log('------assistants-----', assistants[0]);
		// console.log('------thread-----', thread);
		// console.log('------run-----', run);
		// console.log('------join-----', join);
		// if (join) {
		// 	let response = null;
		// 	if (join.messages.length > 0) {
		// 		for (let message of join.messages) {
		// 			if (message.type === 'ai') {
		// 				response = message.content;
		// 			}
		// 		}
		// 	}
		// 	console.log('----AI response', response);
		// }

		[err, clientData] = await to(
			User_role_client_mapping.findOne({
				where: {
					RoleId: 1,
					UserId: 4992,
					forDrip: true,
				},
				attributes: ['ClientId'],
				include: [
					{
						model: Client,
						attributes: ['id', 'name', 'enableChatBot', 'openAISecretKey', 'assistantId'],
						include: [
							{
								model: ClientAgentMapping,
								required: false,
							},
						],
					},
				],
			})
		);

		console.log('---clientData----', clientData.convertToJSON());
	} catch (error) {
		console.log('--------------Error-----', error);
	}
};

// testingChatBot();
