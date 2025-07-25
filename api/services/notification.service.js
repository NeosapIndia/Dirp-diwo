const { Market, Op, sequelize, Client, User, Notification, User_role_client_mapping } =
	require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const { getValidationForSendDrip, updateDripCountInLicense } = require('../services/license.service');
const { sendDripEmail } = require('../services/mailer.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
const fs = require('fs');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');
const axios = require('axios');
const Sequelize = require('sequelize');

const createNotification = async function (message, notificationTypes, userIds) {
	try {
		if (userIds && userIds.length > 0) {
			let list = [];
			for (let userId of userIds) {
				let payload = {
					message: message,
					UserId: userId,
					isRead: false,
					forDrip: true,
					forDiwo: false,
				};
				for (let notificationType of notificationTypes) {
					if (notificationType == 'Email') {
						payload.isEmail = true;
					}
					if (notificationType == 'Bell') {
						payload.isBell = true;
					}
					if (notificationType == 'PopUp') {
						payload.isPopup = true;
					}
				}
				list.push(payload);
			}

			if (list.length > 0) {
				[err, createAllNotification] = await to(Notification.bulkCreate(list));
				if (err) {
					console.log('---Error When Create a user Notifcation ---', err);
				}
			}
		}
		return true;
	} catch (error) {
		console.log('---Error In Create Notification---', error);
	}
};
module.exports.createNotification = createNotification;

const createNotificationforDiwo = async function (message, notificationTypes, userIds, LearnerAchievementId = null) {
	try {
		if (userIds && userIds.length > 0) {
			let list = [];
			for (let userId of userIds) {
				let payload = {
					message: message,
					UserId: userId,
					isRead: false,
					forDiwo: true,
					forDrip: false,
					LearnerAchievementId: LearnerAchievementId,
				};
				for (let notificationType of notificationTypes) {
					if (notificationType == 'Email') {
						payload.isEmail = true;
					}
					if (notificationType == 'Bell') {
						payload.isBell = true;
					}
					if (notificationType == 'PopUp') {
						payload.isPopup = true;
					}
				}
				list.push(payload);
			}

			if (list.length > 0) {
				[err, createAllNotification] = await to(Notification.bulkCreate(list));
				if (err) {
					console.log('---Error When Create a user Notifcation ---', err);
				}
			}
		}
		return true;
	} catch (error) {
		console.log('---Error In Create Notification---', error);
	}
};
module.exports.createNotificationforDiwo = createNotificationforDiwo;

//For Drip
const getAllUserIdsForNotification = async function (clientId) {
	try {
		let allClientIds = [];
		let allUserIds = [];
		allClientIds.push(parseInt(clientId));

		[err, getClient] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['id', 'Associate_client_id'],
			})
		);

		let flag = true;
		if (getClient && getClient.Associate_client_id) {
			let AssociateClientId = getClient.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							id: AssociateClientId,
						},
						attributes: ['id', 'Associate_client_id', 'category', 'DripAccess'],
					})
				);
				if (clientDetails && clientDetails.id == 1) {
					allClientIds.push(parseInt(clientDetails.id));
					flag = false;
				} else if (clientDetails && clientDetails.Associate_client_id) {
					AssociateClientId = clientDetails.Associate_client_id;
					if (
						(clientDetails.category == 'Client Account' ||
							clientDetails.category == 'Branch Account' ||
							clientDetails.category == 'Partner Account' ||
							clientDetails.category === 'Product Owner Account') &&
						clientDetails.DripAccess
					) {
						allClientIds.push(parseInt(clientDetails.id));
					}
				} else {
					flag = false;
				}
			}
			// console.log('--all Client Id For Notification--', allClientIds);
		}
		if (allClientIds.length > 0) {
			[err, getAllUSerIds] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: allClientIds,
						RoleId: {
							[Op.ne]: 1,
						},
						forDrip: true,
					},
					attributes: ['UserId'],
				})
			);
			if (getAllUSerIds && getAllUSerIds.length) {
				for (let user of getAllUSerIds) {
					allUserIds.push(user.UserId);
				}
			}
			allUserIds = [...new Set(allUserIds)];
			// console.log('--all User Ids For Notifcation---', allUserIds);
		}
		return allUserIds;
	} catch (error) {
		console.log('---Error In Get All User Ids for Notification ---', error);
	}
};
module.exports.getAllUserIdsForNotification = getAllUserIdsForNotification;

//For Drip
const getAllProductOwnerIdsForNotification = async function (clientId) {
	try {
		let allClientIds = [];
		let allUserIds = [];
		//allClientIds.push(clientId);

		[err, getClient] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['id', 'Associate_client_id'],
			})
		);

		let flag = true;
		if (getClient && getClient.Associate_client_id) {
			let AssociateClientId = getClient.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							id: AssociateClientId,
						},
						attributes: ['id', 'Associate_client_id', 'category', 'DripAccess'],
					})
				);
				if (clientDetails && clientDetails.id == 1) {
					allClientIds.push(parseInt(clientDetails.id));
					flag = false;
				} else if (clientDetails && clientDetails.Associate_client_id) {
					AssociateClientId = clientDetails.Associate_client_id;
					if (clientDetails.category === 'Product Owner Account' && clientDetails.DripAccess) {
						allClientIds.push(parseInt(clientDetails.id));
					}
				} else {
					flag = false;
				}
			}
			// console.log('--all Client Id For Notification--', allClientIds);
		}
		if (allClientIds.length > 0) {
			[err, getAllUSerIds] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: allClientIds,
						RoleId: [2, 3],
						forDrip: true,
					},
					attributes: ['UserId'],
				})
			);
			if (getAllUSerIds && getAllUSerIds.length) {
				for (let user of getAllUSerIds) {
					allUserIds.push(user.UserId);
				}
			}
			allUserIds = [...new Set(allUserIds)];
			// console.log('--all User Ids For Notifcation---', allUserIds);
		}
		return allUserIds;
	} catch (error) {
		console.log('---Error In Get All User Ids for Notification ---', error);
	}
};
module.exports.getAllProductOwnerIdsForNotification = getAllProductOwnerIdsForNotification;

//For Diwo
const getAllDiwoUserIdsForNotification = async function (clientId) {
	try {
		let allClientIds = [];
		let allUserIds = [];
		allClientIds.push(parseInt(clientId));

		[err, getClient] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['id', 'Associate_client_id'],
			})
		);

		let flag = true;
		if (getClient && getClient.Associate_client_id) {
			let AssociateClientId = getClient.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							id: AssociateClientId,
						},
						attributes: ['id', 'Associate_client_id', 'category', 'DiwoAccess'],
					})
				);
				if (clientDetails && clientDetails.id == 1) {
					allClientIds.push(parseInt(clientDetails.id));
					flag = false;
				} else if (clientDetails && clientDetails.Associate_client_id) {
					AssociateClientId = clientDetails.Associate_client_id;
					if (
						(clientDetails.category == 'Client Account' ||
							clientDetails.category == 'Branch Account' ||
							clientDetails.category == 'Partner Account' ||
							clientDetails.category === 'Product Owner Account') &&
						clientDetails.DiwoAccess
					) {
						allClientIds.push(parseInt(clientDetails.id));
					}
				} else {
					flag = false;
				}
			}
			// console.log('--all Client Id For Notification--', allClientIds);
		}
		if (allClientIds.length > 0) {
			[err, getAllUSerIds] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: allClientIds,
						RoleId: {
							[Op.ne]: 1,
						},
						forDiwo: true,
					},
					attributes: ['UserId'],
				})
			);
			if (getAllUSerIds && getAllUSerIds.length) {
				for (let user of getAllUSerIds) {
					allUserIds.push(user.UserId);
				}
			}
			allUserIds = [...new Set(allUserIds)];
			// console.log('--all User Ids For Notifcation---', allUserIds);
		}
		return allUserIds;
	} catch (error) {
		console.log('---Error In Get All User Ids for Notification ---', error);
	}
};
module.exports.getAllDiwoUserIdsForNotification = getAllDiwoUserIdsForNotification;
