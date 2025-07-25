const {
	Op,
	sequelize,
	TeamCredential,
	TeamSetup,
	TeamChatDetail,
	DripSharingOnTeam,
	DripOnlyTeam,
	Post,
	User_role_client_mapping,
	User,
	Client,
	ClientTeamSetup,
	Market,
	System_branding,
	TeamChannel,
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

const msal = require('@azure/msal-node');
const crypto = require('crypto');
// const { Client } = require('@hubspot/api-client');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { createNotification } = require('../services/notification.service');
const Sequelize = require('sequelize');
const {
	getAllSubBranchAccountLists,
	getAllSubClientAndBranchAccountLists,
	getClientAppBrandingByClientId,
} = require('../services/client.service');

const {
	getCCA,
	getChatIdByTeamUserId,
	renewAccessToken,
	setDefaultValues,
} = require('../services/microsoft-team.service');
const { count } = require('console');
const Joi = require('joi');

function base64UrlEncode(str) {
	return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate code verifier
const codeVerifier = base64UrlEncode(crypto.randomBytes(32));

// Generate code challenge
const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

const getAuthRedirectUrl = async function (req, res) {
	try {
		// State parameter to validate response from Authorization server
		const state = JSON.stringify({
			UserId: req.user.id,
			ClientId: req.user.ClientId,
			RoleId: req.user.RoleId,
			redirectUrl: req.body.redirectUrl + '/microsoft-teams/redirect',
		});

		const authCodeUrlParameters = {
			scopes: [
				'user.read',
				'chat.readwrite',
				'chat.create',
				'user.readbasic.all',
				'team.readbasic.all',
				'channel.readbasic.all',
				'channelmessage.send',
				'files.read',
				'files.read.all',
				'files.readwrite',
				'files.readwrite.all',
				'files.readwrite.appfolder',
				'sites.read.all',
			],
			redirectUri: req.body.redirectUrl + '/microsoft-teams/redirect',
			codeChallenge: codeChallenge,
			codeChallengeMethod: 'S256',
			state: state,
		};

		// Get the redirect URL with the authorization code parameters
		const cca = await getCCA();
		cca
			.getAuthCodeUrl(authCodeUrlParameters)
			.then((response) => {
				// console.log(response);
				return ResponseSuccess(res, {
					redirectUrl: response,
				});
			})
			.catch((error) => {
				console.log(JSON.stringify(error));
				return ResponseError(res, error, 500, true);
			});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAuthRedirectUrl = getAuthRedirectUrl;

const getAuthToken = async function (req, res) {
	try {
		let teamUserTokenId;
		let teamUserToken;
		const state = JSON.parse(req.query.state); // Retrieve the state parameter
		const code = req.query.code; // Retrieve the authorization code from the response query parameters
		console.log('-----------------state-----------------', state);

		const authorizationCodeRequest = {
			code: code, // The authorization code from the authorization response
			scopes: [
				'user.read',
				'chat.readwrite',
				'chat.create',
				'user.readbasic.all',
				'team.readbasic.all',
				'channel.readbasic.all',
				'channelmessage.send',
				'files.read',
				'files.read.all',
				'files.readwrite',
				'files.readwrite.all',
				'files.readwrite.appfolder',
				'sites.read.all',
			],
			redirectUri: state.redirectUrl, // Same redirect URI that was used for authorization code request
			codeVerifier: codeVerifier, // The code verifier from the authorization request
		};
		const cca = await getCCA();
		const authResponse = await cca.acquireTokenByCode(authorizationCodeRequest);
		// console.log('-------authResponseauthResponse00-----', authResponse);
		const catchToken = await cca.getTokenCache().serialize();
		const refreshToken =
			JSON.parse(catchToken).RefreshToken[Object.keys(JSON.parse(catchToken).RefreshToken)[0]].secret;
		const accessToken = authResponse.accessToken;
		const uniqueId = authResponse.uniqueId;
		// console.log('-----------------authResponse-----------------', authResponse);
		// console.log('-----------------Access Token-----------------', accessToken);
		// console.log('-----------------refreshToken-----------------', refreshToken);
		//save Access Token and Refresh Token in DB

		//Check if Record Exist or Not
		[err, teamUserToken] = await to(TeamSetup.findOne({ where: { team_id: uniqueId } }));
		if (err) {
			console.log('-----------Error------------', err);
			return;
		}
		if (teamUserToken) {
			teamUserTokenId = teamUserToken.id;
			//Update Record
			[err, teamUserToken] = await to(
				TeamSetup.update(
					{
						access_token: accessToken,
						refresh_token: refreshToken,
						// ClientId: state.ClientId,
						// RoleId: state.RoleId,
						// scope: authResponse.scopes.toString(),
						// team_id: uniqueId,
					},
					{ where: { id: teamUserToken.id } }
				)
			);
			if (err) {
				console.log('-----------Error-team User Token-Update----------', err);
				return;
			}

			await createNotification(MESSAGE.ALREADY_TEAM_SIGN_UP, ['Bell'], [state.UserId]);
			console.log('--------------------------------------');
			console.log('---------Already Team Sign up---------');
			console.log('--------------------------------------');

			res.redirect(CONFIG.drip_web_host);
			return;
		} else {
			//Create Record
			[err, teamUserToken] = await to(
				TeamSetup.create({
					UserId: state.UserId,
					access_token: accessToken,
					refresh_token: refreshToken,
					scope: authResponse.scopes.toString(),
					team_id: uniqueId,
					ClientId: state.ClientId,
					RoleId: state.RoleId,
				})
			);
			if (err) {
				console.log('-----------Error-team User Token-Create----------', err);
				return;
			}
			teamUserTokenId = teamUserToken.id;
			//Add Record Into ClientTeamSetup Table
		}
		[err, clientTeamSetup] = await to(
			ClientTeamSetup.create({
				ClientId: state.ClientId,
				UserId: state.UserId,
				TeamSetupId: teamUserTokenId,
				mainClient: true,
			})
		);

		if (err) {
			console.log('-----------Error-client Team Setup-Create----------', err);
			return;
		}

		//Update User team_id in User Table
		[err, updateUserTeamId] = await to(User.update({ team_id: uniqueId }, { where: { id: state.UserId } }));
		if (err) {
			console.log('-----------Error-Update User Team Id----------', err);
		}
		await updateUserTokenIdIntoPostTable(teamUserTokenId, state.ClientId);
		await updateAppBrandingEmailComplsory(state.ClientId);
		updateChatIdsByUsingNewToken(teamUserTokenId, state.ClientId);

		//Log Sign in Activity
		[err, newLog] = await to(
			createlog(state.UserId, state.ClientId, state.RoleId, `Sign In with Teams `, req.ip, req.useragent, 'drip', {
				TeamSetupId: teamUserTokenId,
			})
		);
		if (err) {
			console.log('------------Error When Create Log -----', err);
		}

		//Add Sign Out bell Notification
		await createNotification(MESSAGE.TEAM_SIGN_IN, ['Bell'], [state.UserId]);

		res.redirect(CONFIG.drip_web_host);
	} catch (error) {
		console.log('-----Teams get Auth Token Error------------', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAuthToken = getAuthToken;

const updateMicrosoftTeamsDetails = async function (req, res) {
	try {
		//Update Teams Details
		[err, updateDetails] = await to(TeamCredential.update(req.body, { where: { id: 1 } }));
		if (err) return ResponseError(res, err, 500, true);

		//Reset Default Values
		await setDefaultValues();

		//Also Need to Reset All Access_token, Refresh_token, Chat Details from Database

		return ResponseSuccess(res, {
			message: 'Microsoft Teams Details Updated Successfully',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateMicrosoftTeamsDetails = updateMicrosoftTeamsDetails;

const getMicrosoftTeamsDetails = async function (req, res) {
	try {
		//Update Teams Details
		[err, teamDetails] = await to(TeamCredential.findOne({ where: { id: 1 } }));
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: teamDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getMicrosoftTeamsDetails = getMicrosoftTeamsDetails;

const getMicrosoftTeamsUserToken = async function (req, res) {
	try {
		const ClientId = req.params.clientId;
		//Check if Record Exist or Not
		[err, teamUserToken] = await to(TeamSetup.findOne({ where: { ClientId: ClientId } }));
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: teamUserToken,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getMicrosoftTeamsUserToken = getMicrosoftTeamsUserToken;

const revokeTeamSignIn = async function (req, res) {
	try {
		let id = parseInt(req.params.id);
		//Need to Delete Record from Client Team Setup Tables
		[err, deleteClientTeamSetup] = await to(ClientTeamSetup.destroy({ where: { TeamSetupId: id } }));
		if (err) return ResponseError(res, err, 500, true);

		//Need to Delete Record from Chat Details Tables
		[err, deleteChatDetails] = await to(TeamChatDetail.destroy({ where: { TeamSetupId: id } }));
		if (err) return ResponseError(res, err, 500, true);

		//Need to Delete Record from User Token Tables
		[err, deleteZoomUserToken] = await to(TeamSetup.destroy({ where: { id: id } }));
		if (err) return ResponseError(res, err, 500, true);

		//Log Sign in Activity
		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Sign Out with Teams `,
				req.ip,
				req.useragent,
				'drip',
				null
			)
		);
		if (err) {
			console.log('------------Error When Create Log -----', err);
		}

		//Add Sign Out bell Notification
		await createNotification(MESSAGE.TEAM_SIGN_OUT, ['Bell'], [req.user.id]);

		return ResponseSuccess(res, {
			message: 'Microsoft Teams Token Revoked Successfully.',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.revokeTeamSignIn = revokeTeamSignIn;

const getTeamAccessTokenByClientId = async function (clientId) {
	try {
		//Check if Record Exist or Not
		[err, teamUserToken] = await to(
			ClientTeamSetup.findOne({
				where: { ClientId: clientId },
				attributes: ['id'],
				include: [{ model: TeamSetup, attributes: ['id'], required: true }],
			})
		);
		if (err) return null;
		if (!teamUserToken) return null;
		return { id: teamUserToken.TeamSetup.id };
	} catch (error) {
		console.log('-----------Error------------', error);
		return null;
	}
};
module.exports.getTeamAccessTokenByClientId = getTeamAccessTokenByClientId;

const updateUserTokenIdIntoPostTable = async function (TeamSetupId, clientId) {
	try {
		//Get Only Teams and Drip With Team Data by using Client Id
		[err, onlyTeamsData] = await to(
			Post.findAll({
				where: {
					ClientId: clientId,
				},
				include: [{ model: DripOnlyTeam, attributes: ['id'], required: true }],
				attributes: ['id'],
			})
		);

		if (err) {
			console.log('-----------update User Token Id Into Post Table Error 1------------', err);
			return;
		}

		[err, dripWithTeamsData] = await to(
			Post.findAll({
				where: {
					ClientId: clientId,
				},
				include: [{ model: DripSharingOnTeam, attributes: ['id'], required: true }],
				attributes: ['id'],
			})
		);
		if (err) {
			console.log('-----------update User Token Id Into Post Table Error 2------------', err);
			return;
		}

		//Update User Token Id Into Post Table
		//For Only Teams
		let OnlyTeamIds = [];
		for (let data of onlyTeamsData) {
			if (data.DripOnlyTeams?.length > 0) {
				OnlyTeamIds.push(data.DripOnlyTeams[0].id);
			}
		}
		[err, updateOnlyTeamsData] = await to(
			DripOnlyTeam.update({ TeamSetupId: TeamSetupId }, { where: { id: OnlyTeamIds } })
		);
		if (err) {
			console.log('-----------update User Token Id Into Post Table Error 3------------', err);
			return;
		}

		//For Drip With Teams
		let DripWithTeamIds = [];
		for (let data of dripWithTeamsData) {
			if (data.DripSharingOnTeams?.length > 0) {
				DripWithTeamIds.push(data.DripSharingOnTeams[0].id);
			}
		}
		[err, updateDripWithTeamsData] = await to(
			DripSharingOnTeam.update({ TeamSetupId: TeamSetupId }, { where: { id: DripWithTeamIds } })
		);
		if (err) {
			console.log('-----------update User Token Id Into Post Table Error 4------------', err);
			return;
		}
	} catch (error) {
		console.log('-----------update User Token Id Into Post Table Error------------', error);
	}
};

const updateChatIdsByUsingNewToken = async function (TeamsSetupId, clientId) {
	try {
		//Get All under all Account Ids
		//Need To Find all Learner Id with Team id
		//Create new Chat and Save into TeamsChatDetails Table With UserId , ChatId, ClientId, TeamSetupId
		const allClientIds = await getAllSubBranchAccountLists(clientId, false);

		[err, getTeamSetup] = await to(
			TeamSetup.findOne({ where: { id: TeamsSetupId }, attributes: ['access_token', 'team_id'] })
		);
		if (err) {
			console.log('-----------update Chat Ids By Using New Token Error 0------------', err);
		}
		if (!getTeamSetup) {
			return;
		}
		//Find All Learner With TeamId
		[err, allLearnerList] = await to(
			User_role_client_mapping.findAll({
				where: {
					ClientId: allClientIds,
					RoleId: 1,
				},
				include: [
					{
						model: User,
						attributes: ['id', 'team_id', 'local_user_id'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
				],
				order: [['UserId', 'DESC']],
			})
		);
		if (err) {
			console.log('-----------update Chat Ids By Using New Token Error 1------------', err);
			return;
		}

		console.log('-----------------allLearnerList-----------------', allLearnerList.length);

		//Create Chat Ids
		for (let learner of allLearnerList) {
			//Create Chat Id
			let teamId = learner.User.team_id;
			let payload = {
				access_token: getTeamSetup.access_token,
				team_id: getTeamSetup.team_id,
			};

			if ((teamId == null || teamId == '') && learner.User.Market.db_name) {
				//Get User Team Id
				[err, localUser] = await to(
					dbInstance[learner.User.Market.db_name].User_master.findOne({
						where: {
							id: learner.User.local_user_id,
						},
						attributes: ['email'],
					})
				);
				if (err) {
					console.log('-----------update Chat Ids By Using New Token Error 3------------', err);
					continue;
				}

				if (localUser?.email) {
					teamId = await getTeamUserIdByUsingEmail(clientId, localUser.email);
					if (teamId) {
						//Save into User Table
						[err, updateTeamId] = await to(User.update({ team_id: teamId }, { where: { id: learner.User.id } }));
						if (err) {
							console.log('-----------update Chat Ids By Using New Token Error 4------------', err);
							continue;
						}
					} else {
						continue;
					}
				} else {
					continue;
				}
			} else if (!learner.User.team_id) {
				continue;
			}

			const chatId = await getChatIdByTeamUserId(teamId, payload);
			//Save Chat Id into TeamsChatDetails Table
			if (chatId) {
				[err, saveChatDetails] = await to(
					TeamChatDetail.create({
						UserId: learner.User.id,
						chat_id: chatId,
						ClientId: clientId,
						TeamSetupId: TeamsSetupId,
					})
				);
				if (err) {
					console.log('-----------update Chat Ids By Using New Token Error 2------------', err);
					continue;
				}
			}
		}

		console.log('------------------------------------------------------------------------');
		console.log('---------------Complete Chat Sync Process-------------------------------');
		console.log('------------------------------------------------------------------------');
	} catch (error) {
		console.log('-----------update Chat Ids By Using New Token Error------------', error);
	}
};

const showOrNotSignInButton = async function (req, res) {
	try {
		//Get ClientId
		const ClientId = req.user.ClientId;
		[err, teamUserToken] = await to(ClientTeamSetup.findOne({ where: { ClientId: ClientId }, attributes: ['id'] }));
		if (err) return ResponseError(res, err, 500, true);
		if (!teamUserToken) return ResponseSuccess(res, { showSignInButton: true });
		return ResponseSuccess(res, { showSignInButton: false });
		//Check if Record Exist or Not
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.showOrNotSignInButton = showOrNotSignInButton;

const getTeamSetupList = async function (req, res) {
	try {
		const ClientId = req.user.ClientId;
		//Get All Under ClientIds
		let finalData = [];
		const allClientIds = await getAllSubClientAndBranchAccountLists(ClientId, false);
		//Get All Teams Setup Ids By using Client Id

		if (allClientIds.length == 0) {
			return ResponseSuccess(res, {
				data: [],
			});
		}

		[err, TeamSetupMappingList] = await to(
			ClientTeamSetup.findAll({ where: { ClientId: allClientIds }, attributes: ['id', 'ClientId', 'TeamSetupId'] })
		);
		if (err) return ResponseError(res, err, 500, true);

		// let query = `SELECT DISTINCT ON ("TeamSetups".id)
		// 		"TeamSetups".id,
		// 		"TeamSetups".access_token,
		// 		"Clients".client_id,
		// 		"Clients".name,
		// 		"Clients"."Associate_client_id" as parent_id
		// 	FROM "ClientTeamSetups"
		// 	JOIN "TeamSetups" ON "ClientTeamSetups"."TeamSetupId" = "TeamSetups".id
		// 	JOIN "Clients" ON "ClientTeamSetups"."ClientId" = "Clients".id
		// 	WHERE "ClientTeamSetups"."ClientId" IN (${allClientIds.toString()})
		// 	ORDER BY "TeamSetups".id, "ClientTeamSetups"."ClientId" ASC;`;

		// [data] = await sequelize.query(query);

		let query = `
			SELECT DISTINCT ON ("TeamSetups".id)
				"TeamSetups".id,
				"TeamSetups".access_token,
				"Clients".client_id,
				"Clients".name,
				"Clients"."Associate_client_id" AS parent_id
			FROM "ClientTeamSetups"
			JOIN "TeamSetups" ON "ClientTeamSetups"."TeamSetupId" = "TeamSetups".id
			JOIN "Clients" ON "ClientTeamSetups"."ClientId" = "Clients".id
			WHERE "ClientTeamSetups"."ClientId" IN (:allClientIds)
			ORDER BY "TeamSetups".id, "ClientTeamSetups"."ClientId" ASC;
		`;

		const data = await sequelize.query(query, {
			replacements: { allClientIds },
			type: sequelize.QueryTypes.SELECT,
		});

		//Get Client Parent Account Details
		if (data.length > 0) {
			for (let teamSetup of data) {
				let payload = teamSetup;
				//Get Parent Account Details
				if (!payload.parent_id) {
					payload.parent_name = '';
					payload.parent_client_id = '';
					finalData.push(payload);
					continue;
				}
				[err, parentAccountDetails] = await to(
					Client.findOne({
						where: {
							id: payload.parent_id,
						},
						attributes: ['name', 'client_id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (parentAccountDetails) {
					payload.parent_name = parentAccountDetails.name;
					payload.parent_client_id = parentAccountDetails.client_id;
				}

				finalData.push(payload);
			}
		}
		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTeamSetupList = getTeamSetupList;

const getTeamSetupById = async function (req, res) {
	try {
		//Get All Clients Team Setup Data by using Team Setup Id
		//Get User Details of Main Team Setup
		let finallyData = {
			teamSetupOtherClientData: [],
			userDetails: {},
			mainTeamSetup: {},
		};

		//Get All under Clients Id by using ClientId
		const allClients = await getAllSubClientAndBranchAccountLists(req.user.ClientId, true);

		[err, getAllTeamSetupData] = await to(
			ClientTeamSetup.findAll({
				where: { TeamSetupId: req.params.id },
				include: [{ model: Client, attributes: ['id', 'name', 'client_id'] }],
				order: [['mainClient', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get Main Team Setup User Details
		if (getAllTeamSetupData?.length > 0) {
			// finallyData.teamSetupOtherClientData = getAllTeamSetupData;
			if (getAllTeamSetupData[0].mainClient) {
				finallyData.mainTeamSetup = getAllTeamSetupData[0];

				//Get First Team Setup Details
				[err, mainSetupDetails] = await to(TeamSetup.findOne({ where: { id: req.params.id } }));
				if (err) return ResponseError(res, err, 500, true);

				//Get User Details By Using Team Access token
				const teamSetupDetails = await renewAccessToken(mainSetupDetails);

				//get User token by using User's Email ID

				const url = `https://graph.microsoft.com/v1.0/me`;
				try {
					const response = await axios.get(url, {
						headers: {
							Authorization: `Bearer ${teamSetupDetails.access_token}`,
							'Content-Type': 'application/json',
						},
					});
					finallyData.userDetails = response.data;
				} catch (error) {
					finallyData.userDetails = {};
				}
				// [err, userDetails] = await to(
				// 	User.findOne({
				// 		where: {
				// 			id: getAllTeamSetupData[0].UserId,
				// 		},
				// 		include: [{ model: Market, attributes: ['id', 'db_name'] }],
				// 		attributes: ['id', 'local_user_id', 'MarketId', 'account_id', 'team_id'],
				// 	})
				// );
				// if (err) return ResponseError(res, err, 500, true);

				// if (userDetails) {
				// 	[err, localUser] = await to(
				// 		dbInstance[userDetails.Market.db_name].User_master.findOne({
				// 			where: {
				// 				id: userDetails.local_user_id,
				// 			},
				// 			attributes: ['first', 'last', 'email', 'phone'],
				// 		})
				// 	);
				// 	if (err) return ResponseError(res, err, 500, true);
				// 	if (localUser) {
				// 		finallyData.userDetails.full_name = localUser.first + ' ' + localUser.last;
				// 		finallyData.userDetails.email = localUser.email;
				// 		finallyData.userDetails.phone = localUser.phone;
				// 		finallyData.userDetails.team_id = userDetails.team_id;
				// 	}
				// }
			}
		}

		if (allClients.length > 0 && getAllTeamSetupData.length > 0) {
			for (let client of allClients) {
				let payload = {
					ClientId: client.id,
					client_id: client.client_id,
					name: client.name,
					haveTeamSetup: false,
				};

				for (let teamSetup of getAllTeamSetupData) {
					if (teamSetup.mainClient) {
						continue;
					}
					if (teamSetup.ClientId === client.id) {
						payload.haveTeamSetup = true;
						break;
					}
				}
				if (finallyData.mainTeamSetup.ClientId !== client.id) {
					finallyData.teamSetupOtherClientData.push(payload);
				}
			}
		}

		//Add Other Client's Team Setup
		return ResponseSuccess(res, {
			data: finallyData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTeamSetupById = getTeamSetupById;

const updateTeamSetupById = async function (req, res) {
	try {
		const teamSetupId = req.params.id;
		let oldTeamSetupDetails;
		//Update Team Child Client Setup
		const teamSetupData = req.body;

		//Get Old Data of Team Setup
		//Then comparing with new data
		//then update data

		[err, oldTeamSetupDetails] = await to(
			ClientTeamSetup.findAll({ where: { TeamSetupId: teamSetupId, mainClient: false } })
		);
		if (err) return ResponseError(res, err, 500, true);

		let addClientEntrys = [];
		let deleteClientIdEntrys = [];
		if (oldTeamSetupDetails.length) {
			for (let newData of teamSetupData) {
				//Check if Record Exist or Not
				let checkChange = true;
				let flag = true;
				for (let teamSetup of oldTeamSetupDetails) {
					if (teamSetup.ClientId === newData.ClientId) {
						flag = false;
						if (newData.haveTeamSetup == true) {
							checkChange = false;
						}
						break;
					}
				}
				if (checkChange) {
					if (newData.haveTeamSetup == true) {
						let payload = {
							ClientId: newData.ClientId,
							UserId: req.user.id,
							TeamSetupId: teamSetupId,
							mainClient: false,
						};

						addClientEntrys.push(payload);
					} else if (!flag) {
						deleteClientIdEntrys.push(newData.ClientId);
					}
				}
			}
		} else {
			for (let newData of teamSetupData) {
				if (newData.haveTeamSetup == true) {
					let payload = {
						ClientId: newData.ClientId,
						UserId: req.user.id,
						TeamSetupId: teamSetupId,
						mainClient: false,
					};

					addClientEntrys.push(payload);
				}
			}
		}

		//Add New Entrys
		for (let client of addClientEntrys) {
			[err, addClientTeamSetup] = await to(ClientTeamSetup.create(client));
			if (err) return ResponseError(res, err, 500, true);

			await updateUserTokenIdIntoPostTable(teamSetupId, client.ClientId);
			await updateAppBrandingEmailComplsory(client.ClientId);
			updateChatIdsByUsingNewToken(teamSetupId, client.ClientId);
		}

		//Delete Old Entry
		for (let clientId of deleteClientIdEntrys) {
			[err, deleteClientTeamSetup] = await to(
				ClientTeamSetup.destroy({ where: { TeamSetupId: teamSetupId, ClientId: clientId, mainClient: false } })
			);
			if (err) return ResponseError(res, err, 500, true);

			//Need to Delete Record from Chat Details Tables
			[err, deleteChatDetails] = await to(
				TeamChatDetail.destroy({ where: { ClientId: clientId, TeamSetupId: teamSetupId } })
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		//Log Sign in Activity
		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Update Team Setup`, req.ip, req.useragent, 'drip', {
				TeamSetupId: teamSetupId,
			})
		);
		if (err) {
			console.log('------------Error When Create Log -----', err);
		}

		return ResponseSuccess(res, {
			message: 'Team Setup Updated Successfully.',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateTeamSetupById = updateTeamSetupById;

const getTeamUserIdByUsingEmail = async function (ClientId, email, team_setup = null) {
	try {
		//Get Team Setup details by using Client Id
		let getTeamSetup = team_setup;
		if (!getTeamSetup) {
			[err, getTeamSetup] = await to(
				ClientTeamSetup.findOne({
					where: { ClientId: ClientId },
					attributes: ['id'],
					include: [{ model: TeamSetup, required: true }],
				})
			);
			if (err) return null;
		}
		if (!getTeamSetup) return null;

		const teamSetupDetails = await renewAccessToken(getTeamSetup.TeamSetup);

		//get User token by using User's Email ID

		const url = `https://graph.microsoft.com/v1.0/users/${email}`;
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${teamSetupDetails.access_token}`,
				'Content-Type': 'application/json',
			},
		});

		if (response?.data) {
			return response.data.id;
		} else {
			return null;
		}
	} catch (error) {
		// console.log('-----------get Team User Id By Using Email Error------------', error.response.data);
		return null;
	}
};
module.exports.getTeamUserIdByUsingEmail = getTeamUserIdByUsingEmail;

const checkAndGetTeamUserIdByUsingEmail = async function (req, res) {
	try {
		const clientId = req.body.ClientId;
		const email = req.body.email;
		const teamUserId = await getTeamUserIdByUsingEmail(clientId, email);
		// console.log('teamUserId', teamUserId);
		if (teamUserId) {
			return ResponseSuccess(res, {
				teamUserId: teamUserId,
			});
		} else {
			return ResponseSuccess(res, { message: 'Team User Id Not Found' });
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkAndGetTeamUserIdByUsingEmail = checkAndGetTeamUserIdByUsingEmail;

const updateAppBrandingEmailComplsory = async function (ClientId) {
	try {
		//Get App Branding
		//Update Email Compulsory Toggle to TRUE value
		const appBrandingData = await getClientAppBrandingByClientId(ClientId);

		if (appBrandingData && appBrandingData.compEmail == false) {
			//update to true
			[err, updateSystem_branding] = await to(
				System_branding.update({ compEmail: true }, { where: { id: appBrandingData.id } })
			);
			if (err) {
				console.log('-----------update App Branding Email Complsory Error------------', err);
				return;
			}
		}
		return;
	} catch (error) {
		console.log('-----------update App Branding Email Complsory Error------------', error);
	}
};

const teamSync = async function (req, res) {
	try {
		processTeamSync(req.body, req.user.id);
		return ResponseSuccess(res, { message: 'Team Sycn prcess will be Completed.' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.teamSync = teamSync;

const processTeamSync = async function (data, UserId) {
	try {
		let clientTeamSetup;
		let chatDetails = [];
		const groupByClientId = data.reduce((acc, { ClientId, UserId, Status }) => {
			if (Status === 'Active') {
				if (!acc[ClientId]) {
					acc[ClientId] = [];
				}
				acc[ClientId].push(UserId);
			}
			return acc;
		}, {});

		const result = Object.entries(groupByClientId).map(([ClientId, UserIds]) => ({
			ClientId: parseInt(ClientId),
			UserId: UserIds,
		}));

		for (let client of result) {
			//Check Client have Team Setup or Not
			[err, clientTeamSetup] = await to(
				ClientTeamSetup.findOne({
					where: { ClientId: client.ClientId },
					include: [{ model: TeamSetup, required: true }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!clientTeamSetup) {
				console.log('-----------Client Not Have Team Setup------------');
				continue;
			}

			//Get User Personal Data Like Email
			[err, userPersonalData] = await to(
				User.findAll({
					where: { id: client.UserId },
					attributes: ['id', 'local_user_id'],
					include: [{ model: Market, attributes: ['db_name'] }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (!userPersonalData) {
				console.log('-----------User Personal Data Not Found------------');
				continue;
			}

			for (let userData of userPersonalData) {
				[err, localUser] = await to(
					dbInstance[userData.Market.db_name].User_master.findOne({
						where: {
							id: userData.local_user_id,
						},
						attributes: ['email'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!localUser) {
					console.log('-----------Local User Not Found------------');
					continue;
				}

				//Get Team Id and Chat Id And into Database
				//Delete Old Chat Id By using Client Id and User Id
				[err, deleteChatDetails] = await to(
					TeamChatDetail.destroy({ where: { UserId: userData.id, ClientId: client.ClientId } })
				);
				if (err) return ResponseError(res, err, 500, true);

				//Get Team Id By using Email
				const teamId = await getTeamUserIdByUsingEmail(client.ClientId, localUser.email, clientTeamSetup);
				// Update User team id
				[err, updateUserTeamId] = await to(User.update({ team_id: teamId }, { where: { id: userData.id } }));
				if (err) return ResponseError(res, err, 500, true);

				//Create Chat Id
				const chatId = await getChatIdByTeamUserId(teamId, clientTeamSetup.TeamSetup);
				//Save Chat Id into TeamsChatDetails Table
				let payload = {
					ClientId: client.ClientId,
					UserId: userData.id,
					chat_id: chatId,
					TeamSetupId: clientTeamSetup.TeamSetup.id,
				};
				chatDetails.push(payload);
			}
		}
		//Create Chat Ids
		if (chatDetails?.length > 0) {
			[err, saveChatDetails] = await to(TeamChatDetail.bulkCreate(chatDetails));
			if (err) return ResponseError(res, err, 500, true);
		}
		//Send Notification
		await createNotification(MESSAGE.SYNC_TEAM_PROCESS_COMPLETED, ['Bell'], [UserId]);
	} catch (error) {
		console.log('-----------process Team Sync Error------------', error);
	}
};

// Function to get teams and their channel details for a given ClientId from a request
const getTeamsAndChannelDetails = async function (req, res) {
	try {
		const ClientId = req.user.ClientId; // Correctly extract ClientId from the request user object

		// Attempt to find the client's team setup with error handling
		[err, getTeamSetup] = await to(
			ClientTeamSetup.findOne({
				where: { ClientId },
				attributes: ['id'],
				include: [{ model: TeamSetup, required: true }],
			})
		);

		// Handle potential errors during team setup fetch
		if (err) return ResponseError(res, err, 500, true);

		// Return an empty array if no team setup is found
		if (!getTeamSetup) return ResponseSuccess(res, { data: [] });

		// Renew the access token for the team setup
		const teamSetupDetails = await renewAccessToken(getTeamSetup.TeamSetup);

		// Fetch the list of teams from Microsoft Graph API
		const teamsResponse = await axios.get('https://graph.microsoft.com/v1.0/teams', {
			headers: {
				Authorization: `Bearer ${teamSetupDetails.access_token}`,
				'Content-Type': 'application/json',
			},
		});

		// Initialize the final list of teams with channel details
		let finalList = [];

		// Process each team if teams are found
		if (teamsResponse?.data?.value?.length > 0) {
			for (let team of teamsResponse.data.value) {
				try {
					// Fetch channels for each team
					const channelsResponse = await axios.get(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
						headers: {
							Authorization: `Bearer ${teamSetupDetails.access_token}`,
							'Content-Type': 'application/json',
						},
					});

					// Add channel details to the team object
					team.channelDetails = channelsResponse?.data?.value || [];
					finalList.push(team);
				} catch (error) {
					// Log errors related to fetching channels for a team
					console.error(`Error fetching channels for team ${team.id}:`, error.message);
					team.channelDetails = []; // Ensure channelDetails is an empty array in case of error
				}
			}
		}

		// Return the final list of teams with their channel details
		return ResponseSuccess(res, { data: finalList });
	} catch (error) {
		// Log the error and return an appropriate error response
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getTeamsAndChannelDetails = getTeamsAndChannelDetails;

const syncTeamsChannelDetails = async function (req, res) {
	try {
		//Team Setup Details By using TeamSetup Id
		[err, teamDetails] = await to(
			TeamSetup.findOne({
				where: { id: req.params.id },
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];

		if (!teamDetails) return ResponseSuccess(res, { message: 'Something went wrong.' });

		const teamSetupDetails = await renewAccessToken(teamDetails);

		// Fetch the list of teams from Microsoft Graph API
		const teamsResponse = await axios.get('https://graph.microsoft.com/v1.0/teams', {
			headers: {
				Authorization: `Bearer ${teamSetupDetails.access_token}`,
				'Content-Type': 'application/json',
			},
		});

		// Initialize the final list of teams with channel details

		// Process each team if teams are found
		if (teamsResponse?.data?.value?.length > 0) {
			for (let team of teamsResponse.data.value) {
				try {
					// Fetch channels for each team
					const channelsResponse = await axios.get(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
						headers: {
							Authorization: `Bearer ${teamSetupDetails.access_token}`,
							'Content-Type': 'application/json',
						},
					});

					// Add channel details to the team object
					team.channelDetails = channelsResponse?.data?.value || [];
					if (channelsResponse?.data?.value?.length > 0) {
						for (let channel of channelsResponse.data.value) {
							//Need to get Number of Members in Channel
							// const channelsMememberResponse = await axios.get(
							// 	`https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/members`,
							// 	{
							// 		headers: {
							// 			Authorization: `Bearer ${teamSetupDetails.access_token}`,
							// 			'Content-Type': 'application/json',
							// 		},
							// 	}
							// );
							// console.log(
							// 	'-----------------channelsMememberResponse-----------------',
							// 	channelsMememberResponse?.data?.value
							// );
							let payload = {
								title: channel.displayName + ' (Microsoft Team Channel)',
								team_id: team.id,
								channel_id: channel.id,
								// count: channelsMememberResponse?.data?.value?.length || 0,
								TeamSetupId: teamDetails.id,
							};

							//Check if Record Exist or Not
							[err, checkChannelExist] = await to(
								TeamChannel.findOne({
									where: { channel_id: channel.id, team_id: team.id },
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							if (!checkChannelExist) {
								finalList.push(payload);
							} else {
								//Update Only Team Setup Id
								[err, updateChannel] = await to(
									TeamChannel.update({ TeamSetupId: teamDetails.id }, { where: { id: checkChannelExist.id } })
								);
								if (err) return ResponseError(res, err, 500, true);
							}
						}

						if (finalList.length > 0) {
							[err, addintoChannelList] = await to(TeamChannel.bulkCreate(finalList));
							if (err) return ResponseError(res, err, 500, true);
						}
					}
				} catch (error) {
					// Log errors related to fetching channels for a team
					console.error(`Error fetching channels for team ${team.id}:`, error.message);
				}
			}
		}

		return ResponseSuccess(res, { message: 'Sync Team Channel details successfully.' });
	} catch (error) {
		console.log('-----------get Channel List By Using Client Ids Error------------', error.message);
		return null;
	}
};
module.exports.syncTeamsChannelDetails = syncTeamsChannelDetails;

//fetch all files from one Drive
const getAllOneDriveFilesForTeams = async function (req, res) {
	try {
		const ClientId = req.user.ClientId;
		const type = req.params.type;
		let extensions = [];
		let oneDriveFileList = [];
		let finalList = [];

		if (type == 'Video') {
			extensions = ["'.mp4'"];
		} else if (type == 'Document') {
			extensions = ["'.csv'", "'.pdf'", "'.xls'", "'.ppt'", "'.doc'"];
		}

		[err, getTeamSetup] = await to(
			ClientTeamSetup.findOne({
				where: { ClientId },
				attributes: ['id'],
				include: [{ model: TeamSetup, required: true }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (!getTeamSetup) return ResponseSuccess(res, { data: [] });

		const teamSetupDetails = await renewAccessToken(getTeamSetup.TeamSetup);
		let allResponse = [];
		for (const ext of extensions) {
			allResponse = await getFilesByMultipleExtensions(teamSetupDetails.access_token, ext);
			if (allResponse && allResponse.length > 0) {
				oneDriveFileList = [...oneDriveFileList, ...allResponse];
			}

			// console.log('--oneDriveFileList--', oneDriveFileList);
		}

		if (oneDriveFileList.length > 0) {
			let count = 0;
			for (let item of oneDriveFileList) {
				if (item.file && item.file.mimeType) {
					let payload = {
						id: count,
						type: type,
						subType: null,
						name: item.name,
						url: item.webUrl,
					};

					let VideoMimeType = 'video/mp4';

					let PDFMimeType = 'application/pdf';
					let PPTMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
					let PPTMimeType2 = 'application/vnd.ms-powerpoint';
					let ExcelMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
					let ExcelMimeType2 = 'application/vnd.ms-excel';
					let CSVMimeType = 'text/csv';
					let MSWordMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
					let MSWordMimeType2 = 'application/msword';

					if (type == 'Video' && item.file.mimeType == VideoMimeType) {
						count++;
						// Check if 'Forms' exists in the URL
						if (item.webUrl.includes('/Forms/DispForm')) {
							let encodedText = encodeURIComponent(item.name);
							let newUrl = item.webUrl.replace(/Forms\/.*$/, encodedText);
							payload.url = newUrl;
						}
						payload.subType = 'Video';
						finalList.push(payload);
					} else if (
						type == 'Document' &&
						(item.file.mimeType == PDFMimeType ||
							item.file.mimeType == PPTMimeType ||
							item.file.mimeType == PPTMimeType2 ||
							item.file.mimeType == ExcelMimeType ||
							item.file.mimeType == ExcelMimeType2 ||
							item.file.mimeType == CSVMimeType ||
							item.file.mimeType == MSWordMimeType ||
							item.file.mimeType == MSWordMimeType2)
					) {
						count++;
						if (item.file.mimeType == PDFMimeType) {
							payload.subType = 'PDF';
						} else if (item.file.mimeType == PPTMimeType || item.file.mimeType == PPTMimeType2) {
							payload.subType = 'PPT';
						} else if (item.file.mimeType == ExcelMimeType || item.file.mimeType == ExcelMimeType2) {
							payload.subType = 'MSEXCEL';
						} else if (item.file.mimeType == CSVMimeType) {
							payload.subType = 'CSV';
						} else if (item.file.mimeType == MSWordMimeType || item.file.mimeType == MSWordMimeType2) {
							payload.subType = 'MSWORD';
						}
						finalList.push(payload);
					}
				}
			}
		}

		return ResponseSuccess(res, { data: finalList });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllOneDriveFilesForTeams = getAllOneDriveFilesForTeams;

const getFilesByMultipleExtensions = async function (accessToken, extension) {
	try {
		let oneDriveUrl = `https://graph.microsoft.com/v1.0/me/drive/root/search(q=${extension})`;
		console.log('--oneDriveUrl--', oneDriveUrl);
		const oneDriveResponse = await axios.get(oneDriveUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (oneDriveResponse?.data?.value?.length > 0) {
			return oneDriveResponse.data.value;
		} else {
			return [];
		}
	} catch (error) {
		console.log('-------<<<<<<<<<---Error Fetching File From OneDrive--->>>>>>>>>---------', error);
		return null;
	}
};

const checkTeamAccessTokenByClientId = async function (req, res) {
	try {
		// let clientId = req.params.clientId;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
		});

		// Validate request params
		const { error, value } = schema.validate({ clientId: parseInt(req.params.clientId) });

		if (error) {
			res.status(400).json({ error: error.details });
		}

		// Assign validated value
		let clientId = value.clientId;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		[err, teamUserToken] = await to(
			ClientTeamSetup.findOne({
				where: { ClientId: clientId },
				include: [
					{
						model: TeamSetup,
						attributes: ['id'],
						required: true,
					},
				],
				attributes: ['id'],
			})
		);
		let response;
		if (teamUserToken) {
			response = teamUserToken;
		} else {
			response = false;
		}
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { data: response });
	} catch (error) {
		console.log('-----------Error------------', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkTeamAccessTokenByClientId = checkTeamAccessTokenByClientId;
