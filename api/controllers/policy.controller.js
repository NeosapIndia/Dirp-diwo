const { Op, sequelize, Asset, Asset_detail, Client, User, Market, PolicyChangeLog, CustomerPolicyLog } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let imagePath = 'uploads/assets/';
var Excel = require('excel4node');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
let policyPath = 'uploads/policy/';
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { policyChangeNotificationEmail } = require('../services/mailer.service');
const { createNotification, createNotificationforDiwo } = require('../services/notification.service');
const { getAllUserIdsForNotification } = require('../services/notification.service');

const { getAllSubChildClientIds } = require('../services/client.service');
const { createlog } = require('../services/log.service');
const Sequelize = require('sequelize');

const changePolicyOfAllUser = async function (req, res) {
	try {
		let policy_type_array = req.body.policy_type.split(',');
		let data = req.body;
		let allUser;
		let allUserId = [];
		let createdPolicyLogIds = [];
		let policyLog;
		let MarketId = req.body.MarketId;
		let policyNamesForEmail = [];
		let userAllPolicyStructor = [
			{
				'Cookie Policy': {
					PolicyChangeLogId: null,
					acceptedByUser: true,
				},
			},
			{
				'Terms and Conditions': {
					PolicyChangeLogId: null,
					acceptedByUser: true,
				},
			},
			{
				'Data Processing Agreement': {
					PolicyChangeLogId: null,
					acceptedByUser: true,
				},
			},
			{
				'Privacy Policy': {
					PolicyChangeLogId: null,
					acceptedByUser: true,
				},
			},
		];

		[err, allUser] = await to(
			User.findAll({
				where: {
					status: true,
					is_deleted: false,
					is_archive: false,
					cStatus: 'Active',
					MarketId: MarketId,
				},
				attributes: ['id', 'userPolicyDetails', 'acceptPolicy'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// let query_ = `SELECT ARRAY ( Select id FROM "Users" WHERE status = true and is_deleted= false AND is_archive = false AND "cStatus" = 'Active' );`;
		// [allUserId] = await sequelize.query( query_);

		// for (let user of allUser) {
		//     allUserId.push(user.id);
		// }

		for (let policy of policy_type_array) {
			let file = req.files[policy.replace(/\s/g, '') + '_file'];
			let filePath = policyPath + file[0].filename;
			let policyLogDetails = {
				policyChangeDate: new Date(),
				UserId: req.body.userId,
				policyTitle: policy,
				// ipAddress: req.body.ip_address,
				// macAddress: req.body.mac_address,
				filePath: filePath,
				activeUserCount: allUser.length,
				acceptedPolicyCount: 0,
				RoleId: req.body.RoleId,
				ClientId: req.body.ClientId,
				MarketId: MarketId,
			};
			[err, policyLog] = await to(PolicyChangeLog.create(policyLogDetails));
			if (err) return ResponseError(res, err, 500, true);

			if (
				req.body[policy.replace(/\s/g, '') + 'AcceptTerms'] == true ||
				req.body[policy.replace(/\s/g, '') + 'AcceptTerms'] == 'true'
			) {
				policyNamesForEmail.push(policy);
			}

			createdPolicyLogIds.push({
				policyName: policy,
				id: policyLog.id,
				notificationToAllUser: req.body[policy.replace(/\s/g, '') + 'AcceptTerms'],
			});
		}
		for (let user of allUser) {
			if (user.userPolicyDetails == null) {
				let userPolicy = userAllPolicyStructor;
				for (let policy of createdPolicyLogIds) {
					for (let userAllPolicy of userPolicy) {
						if (Object.keys(userAllPolicy) == policy.policyName) {
							if (policy.notificationToAllUser == 'true' || policy.notificationToAllUser == true) {
								userAllPolicy[policy.policyName].PolicyChangeLogId = policy.id;
								userAllPolicy[policy.policyName].acceptedByUser = false;
							}
						}
					}
				}
				[err, user] = await to(
					User.update(
						{
							userPolicyDetails: JSON.stringify(userPolicy),
							acceptPolicy: false,
						},
						{
							where: {
								id: user.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				let userPolicy = JSON.parse(user.userPolicyDetails);
				let acceptPolicyFlag = user.acceptPolicy;
				for (let policy of createdPolicyLogIds) {
					for (let userAllPolicy of userPolicy) {
						if (Object.keys(userAllPolicy) == policy.policyName) {
							if (policy.notificationToAllUser == 'true' || policy.notificationToAllUser == true) {
								acceptPolicyFlag = false;
								userAllPolicy[policy.policyName].PolicyChangeLogId = policy.id;
								userAllPolicy[policy.policyName].acceptedByUser = false;
							}
						}
					}
				}
				[err, user] = await to(
					User.update(
						{
							userPolicyDetails: JSON.stringify(userPolicy),
							acceptPolicy: acceptPolicyFlag,
						},
						{
							where: {
								id: user.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		if (policyNamesForEmail && policyNamesForEmail.length > 0) {
			sendPolicyChangeNotificationEmail(policyNamesForEmail, MarketId);
		}

		// For Notification
		// if (client_details.category !== 'Product Owner Account') {

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

		let notifcationMessage = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		} change ${policyNamesForEmail.toString()} policy.`;
		let userIds = await getAllUserIdsForNotification(req.body.ClientId);
		console.log('--UserIds--', userIds);
		await createNotification(notifcationMessage, ['Bell'], userIds);
		// }

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Change policy`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					PolicyChangeLogId: policyLog.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.UPDATE_SUCCESS,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.changePolicyOfAllUser = changePolicyOfAllUser;

const sendPolicyChangeNotificationEmail = async function (policyNames, marketId) {
	try {
		policyNames = policyNames.toString();
		[err, allMarketUsers] = await to(
			User.findAll({
				where: {
					status: true,
					is_deleted: false,
					is_archive: false,
					cStatus: 'Active',
					MarketId: marketId,
				},
				include: [
					{
						model: Market,
						attributes: ['id', 'name', 'db_name'],
					},
				],
				attributes: ['id', 'MarketId', 'local_user_id'],
			})
		);
		if (err) {
			console.log('---Error When get All User on send Policy Change Notification email---', err);
		}

		[err, market] = await to(
			Market.findOne({
				where: {
					id: marketId,
				},
			})
		);
		if (err) {
			console.log('--Error when get Market Data By Market Id---', err);
		}

		let finalEmailList = [];
		for (let user of allMarketUsers) {
			[err, localUser] = await to(
				dbInstance[user.Market.db_name].User_master.findOne({
					where: {
						id: user.local_user_id,
					},
					attributes: ['first', 'last', 'email'],
				})
			);
			if (err) {
				console.log('---Error When Get user local Data--', err);
			}
			if (localUser) {
				let personalisations = {};
				personalisations.to = localUser.email;
				if (personalisations.to != null && personalisations.to != '') {
					personalisations.dynamic_template_data = {
						User_Name: localUser.first + localUser.last,
						List: policyNames,
						Privacy_Button: 'Privacy Policy',
						DPA_Button: 'Data Processing Agreement',
						Cookie_Button: 'Cookie Policy',
						TOS_Button: 'Terms and Conditions',
						Privacy_URL: market.privacyPolicyUrl,
						DPA_URL: market.dpaUrl,
						Cookie_URL: market.cookiePolicyUrl,
						TOS_URL: market.tosUrl,
					};
					finalEmailList.push(personalisations);
				}
			}
		}
		policyChangeNotificationEmail(finalEmailList);
	} catch (error) {
		console.log('---Error when Send Policy Change Notification---', error);
	}
};
module.exports.sendPolicyChangeNotificationEmail = sendPolicyChangeNotificationEmail;

const acceptPolicyByUser = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			type: Joi.string().trim().max(4).required(),
		});
		const { error, value } = schema.validate({
			clientId: req.params.clientId,
			type: req.params.type,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, type } = value;
		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}
		let err;
		// let type = req.params.type;
		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: 'Invalid project type parameter.' }, 400);
		}
		// let clientId = parseInt(req.params.clientId);
		[err, _user] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
				attributes: ['id', 'userPolicyDetails'],
			})
		);
		if (err) {
			return ResponseError(res, err, 500, true);
		}
		if (_user && _user.userPolicyDetails != null && _user.userPolicyDetails != '') {
			let policyDetails = JSON.parse(_user.userPolicyDetails);

			for (let policy of policyDetails) {
				let policyType;
				let key = Object.keys(policy)[0];
				if (policy[key].acceptedByUser == 'false' || policy[key].acceptedByUser == false) {
					if (key == 'Cookie Policy') {
						policyType = 'Policy Change';
					} else if (key == 'Terms and Conditions') {
						policyType = 'User Registration';
					} else if (key == 'Privacy Policy') {
						policyType = 'User Registration';
					}

					[err, policyUpdateCount] = await to(
						PolicyChangeLog.findOne({
							where: {
								id: policy[key].PolicyChangeLogId,
							},
						})
					);
					if (err) {
						return ResponseError(res, err, 500, true);
					}

					if (policyUpdateCount) {
						let policyLogDetails = {
							acceptDate: new Date(),
							UserId: req.user.id,
							type: 'Policy Change',
							policyType: Object.keys(policy)[0],
							ipAddress: req.body.ipAddress,
							macAddress: req.body.macAddress,
							PolicyChangeLogId: policy[key].PolicyChangeLogId,
							ClientId: clientId,
							acceptanceType: 'By the User',
						};

						if (type == 'drip') {
							policyLogDetails.forDrip = true;
						} else if (type == 'diwo') {
							policyLogDetails.forDiwo = true;
						}

						let policyLog;

						[err, policyLog] = await to(CustomerPolicyLog.create(policyLogDetails));
						if (err) {
							return ResponseError(res, err, 500, true);
						}

						let count = policyUpdateCount.acceptedPolicyCount;
						count++;
						[err, policyUpdate] = await to(
							PolicyChangeLog.update(
								{
									acceptedPolicyCount: count,
								},
								{
									where: {
										id: policy[key].PolicyChangeLogId,
									},
								}
							)
						);
						if (err) {
							return ResponseError(res, err, 500, true);
						}
					}
				}
			}

			for (let policy of policyDetails) {
				let key = Object.keys(policy)[0];
				if (policy[key].acceptedByUser == 'false' || policy[key].acceptedByUser == false) {
					policy[key].acceptedByUser = true;
				}
			}

			[err, userUpdate] = await to(
				User.update(
					{
						userPolicyDetails: JSON.stringify(policyDetails),
						acceptPolicy: true,
					},
					{
						where: {
							id: req.user.id,
						},
					}
				)
			);
			if (err) {
				return ResponseError(res, err, 500, true);
			}
		} else {
			let policyList = req.body.list;
			for (let policyName of policyList) {
				let policyLogDetails = {
					acceptDate: new Date(),
					UserId: req.user.id,
					type: 'User Registration',
					policyType: policyName,
					ipAddress: req.body.ipAddress,
					macAddress: req.body.macAddress,
					// PolicyChangeLogId: policy[key].PolicyChangeLogId,
					ClientId: clientId,
					acceptanceType: 'By the User',
				};
				let policyLog;
				if (type == 'drip') {
					policyLogDetails.forDrip = true;
				} else if (type == 'diwo') {
					policyLogDetails.forDiwo = true;
				}
				[err, policyLog] = await to(CustomerPolicyLog.create(policyLogDetails));
				if (err) {
					return ResponseError(res, err, 500, true);
				}
			}
			[err, userUpdate] = await to(
				User.update(
					{
						acceptPolicy: true,
					},
					{
						where: {
							id: req.user.id,
						},
					}
				)
			);
			if (err) {
				return ResponseError(res, err, 500, true);
			}
		}
		let notifcationMessage = MESSAGE.POLICY_ACCEPTED;
		if (type == 'drip') {
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.UPDATE_SUCCESS,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.acceptPolicyByUser = acceptPolicyByUser;

const getAllPolicyChangeLog = async function (req, res) {
	try {
		[err, allPolicyChangeLogs] = await to(
			PolicyChangeLog.findAll({
				include: [
					{
						model: Market,
						attributes: ['name'],
					},
					{
						model: User,
						attributes: ['id', 'MarketId', 'local_user_id'],
						include: [
							{
								model: Market,
							},
						],
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) {
			return ResponseError(res, err, 500, true);
		}

		let finalList = [];
		for (let policyChange of allPolicyChangeLogs) {
			let temp = policyChange.convertToJSON();
			[err, localUser] = await to(
				dbInstance[policyChange.User.Market.db_name].User_master.findOne({
					where: {
						id: policyChange.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			delete temp.User;
			if (localUser) {
				temp.UserName = localUser.first + ' ' + localUser.last;
			}
			finalList.push(temp);
		}

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllPolicyChangeLog = getAllPolicyChangeLog;

const getAllSearchPolicyChangeLog = async function (req, res) {
	try {
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let userDetailId = [];
		let MarketIds = [];
		let Market_Details;
		let User_Details;
		let PolicyType_Details;
		let allUserData = [];
		let UpdatedMarketId = [];
		let UpdatedUserId = [];
		let UpdatedPolicyId = [];
		let allPolicyChangeLogs;

		//Search User By market

		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('name') > -1) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();
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
								forDrip: true,
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

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('market') > -1) {
			[err, MarketDetails] = await to(
				Market.findAll({
					where: {
						name: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			if (MarketDetails && MarketDetails.length > 0) {
				for (let market_ of MarketDetails) {
					MarketIds.push(market_.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('policyType') > -1) {
			[err, PolicyType_Details] = await to(
				PolicyChangeLog.findAll({
					where: {
						policyTitle: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
					},
					include: [
						{
							model: Market,
							attributes: ['name', 'id'],
						},
						{
							model: User,
							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (MarketIds && MarketIds.length > 0) {
			[err, Market_Details] = await to(
				PolicyChangeLog.findAll({
					include: [
						{
							model: Market,
							where: {
								id: MarketIds,
							},
							attributes: ['name', 'id'],
						},
						{
							model: User,
							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (userDetailId && userDetailId.length > 0) {
			[err, User_Details] = await to(
				PolicyChangeLog.findAll({
					include: [
						{
							model: Market,
							attributes: ['name'],
						},
						{
							model: User,
							where: {
								id: userDetailId,
							},
							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (Market_Details && Market_Details.length > 0) {
			for (let market_details of Market_Details) {
				let flag = true;
				for (let data of allUserData) {
					if (data.Market.id == market_details.Market.id) {
						flag = false;
					}
				}
				if (flag) {
					allUserData.push(market_details);
				}
			}
		}

		if (User_Details && User_Details.length > 0) {
			for (let user_details of User_Details) {
				let flag = true;
				for (let data of allUserData) {
					if (data.User.id == user_details.User.id) {
						flag = false;
					}
				}
				if (flag) {
					allUserData.push(user_details);
				}
			}
		}

		if (PolicyType_Details && PolicyType_Details.length > 0) {
			for (let policyType_details of PolicyType_Details) {
				let flag = true;
				for (let data of allUserData) {
					if (data.id == policyType_details.id) {
						flag = false;
					}
				}
				if (flag) {
					allUserData.push(policyType_details);
				}
			}
		}

		for (let item of allUserData) {
			let item_ = item.convertToJSON();
			UpdatedMarketId.push(item_.Market.id);
			UpdatedUserId.push(item_.User.id);
			UpdatedPolicyId.push(item.id);
		}

		if (UpdatedMarketId && UpdatedMarketId.length > 0) {
			[err, allPolicyChangeLogs] = await to(
				PolicyChangeLog.findAll({
					include: [
						{
							model: Market,
							where: {
								id: UpdatedMarketId,
							},
							attributes: ['name'],
						},
						{
							model: User,

							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (UpdatedUserId && UpdatedUserId.length > 0) {
			[err, allPolicyChangeLogs] = await to(
				PolicyChangeLog.findAll({
					include: [
						{
							model: Market,
							attributes: ['name'],
						},
						{
							model: User,
							where: {
								id: UpdatedUserId,
							},
							attributes: ['id', 'MarketId', 'local_user_id'],
							include: [
								{
									model: Market,
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let newList = [];
		if (allPolicyChangeLogs && allPolicyChangeLogs.length > 0) {
			for (let policyData of allPolicyChangeLogs) {
				let policy_data = policyData.convertToJSON();
				newList.push(policy_data);
			}
		}

		let finalList = [];
		for (let policyChange of newList) {
			let temp = policyChange;
			[err, localUser] = await to(
				dbInstance[policyChange.User.Market.db_name].User_master.findOne({
					where: {
						id: policyChange.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			delete temp.User;
			if (localUser) {
				temp.UserName = localUser.first + ' ' + localUser.last;
			}
			finalList.push(temp);
		}

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchPolicyChangeLog = getAllSearchPolicyChangeLog;

const getAcceptanceDataByClientId = async function (req, res) {
	try {
		let err;
		let clientId = parseInt(req.params.clientId);
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		allSubClientIds.push(clientId);

		// [err, accceptanceLogs] = await to(User.findAll({
		//     include: {
		//         model: CustomerPolicyLog,
		//         where: {
		//             ClientId: allSubClientIds
		//         },
		//         include: [{
		//             model: Client,
		//             attributes: ['id', 'name']
		//         }]
		//     },
		//     attributes: ['id', 'account_id', 'userPolicyDetails', 'type']
		// }));
		// if (err) return ResponseError(res, err, 500, true);
		// return ResponseSuccess(res, {
		//     data: accceptanceLogs
		// });

		if (type == 'drip') {
			[err, acceptaneLogs] = await to(
				CustomerPolicyLog.findAll({
					where: {
						ClientId: allSubClientIds,
						forDrip: true,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'name', 'client_id'],
							where: {
								DripAccess: true,
							},
						},
						{
							model: User,
							attributes: ['id', 'account_id', 'local_user_id', 'type'],
							where: {
								forDrip: true,
							},
						},
						{
							model: PolicyChangeLog,
							attributes: ['id', 'policyTitle'],
						},
					],
					attributes: [
						'id',
						'acceptDate',
						'type',
						'policyType',
						'acceptanceType',
						'UserId',
						'ClientId',
						'PolicyChangeLogId',
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, acceptaneLogs] = await to(
				CustomerPolicyLog.findAll({
					where: {
						ClientId: allSubClientIds,
						forDiwo: true,
					},
					include: [
						{
							model: Client,
							attributes: ['id', 'name', 'client_id'],
							where: {
								DiwoAccess: true,
							},
						},
						{
							model: User,
							attributes: ['id', 'account_id', 'local_user_id', 'type'],
							where: {
								forDiwo: true,
							},
						},
						{
							model: PolicyChangeLog,
							attributes: ['id', 'policyTitle'],
						},
					],
					attributes: [
						'id',
						'acceptDate',
						'type',
						'policyType',
						'acceptanceType',
						'UserId',
						'ClientId',
						'PolicyChangeLogId',
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Download Acceptance Log`,
				req.ip,
				req.useragent,
				req.user.type,
				null
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: acceptaneLogs,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAcceptanceDataByClientId = getAcceptanceDataByClientId;

const checkUserIsExistingOrNot = async function (req, res) {
	try {
		let err;
		let userId = parseInt(req.params.userId);
		let type = req.params.type;
		let users;

		if (type == 'drip') {
			[err, users] = await to(
				CustomerPolicyLog.findOne({
					where: {
						UserId: userId,
						forDrip: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, users] = await to(
				CustomerPolicyLog.findOne({
					where: {
						UserId: userId,
						forDiwo: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let message;
		if (users) {
			message = 'Existing User';
		} else {
			message = 'New User';
		}
		return ResponseSuccess(res, { message: message });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkUserIsExistingOrNot = checkUserIsExistingOrNot;
