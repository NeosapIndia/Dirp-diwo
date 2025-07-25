const { User, User_log, Market, CustomerPolicyLog, Client } = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ThrowException } = require('../services/util.service');
const MESSAGE = require('../config/message');
const Sequelize = require('sequelize');

/**
 * Creates a log entry for user actions.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} clientId - The client ID associated with the action.
 * @param {string} roleId - The role ID related to the action.
 * @param {string} description - The description of the action.
 * @param {string} ip - The IP address of the user.
 * @param {object} useragent - The user agent information.
 * @param {string} project - The name of the project.
 * @param {Array|string|null} referenceIds - The reference IDs associated with the action.
 * @returns {Promise<object|null>} Returns a promise resolving to the created log entry or null if failed.
 */
const createlog = async (userId, clientId, roleId, description, ip, useragent, project, referenceIds) => {
	try {
		let err;
		// Initialize log object with required properties
		let log = {
			UserId: userId,
			description: description,
			ClientId: clientId,
			RoleId: roleId,
			ProjectName: project,
			count: undefined, // Set to desired initial value
			deviceType: undefined, // Initialize to undefined
			osType: undefined, // Initialize to undefined
		};

		// Determine Device Type
		if (
			useragent &&
			(useragent?.isMobile ||
				useragent?.isMobileNative ||
				useragent?.isiPhone ||
				useragent?.isiPhoneNative ||
				useragent?.isAndroid ||
				useragent?.isAndroidNative ||
				useragent?.isBlackberry)
		) {
			log.deviceType = 'Mobile';
		} else if (
			useragent &&
			(useragent?.isTablet || useragent?.isAndroidTablet || useragent?.isTablet || useragent?.isTablet)
		) {
			log.deviceType = 'Tablet';
		} else if (
			useragent &&
			(useragent?.isWindows || useragent?.isDesktop || useragent?.isLinux || useragent?.isLinux64 || useragent?.isMac)
		) {
			log.deviceType = 'Desktop';
		}
		// else {
		// 	log.deviceType = 'Desktop';
		// }

		// Determine OS Type
		if (useragent && (useragent?.isiPhone || useragent?.isiPhoneNative || useragent?.isMac)) {
			log.osType = 'Mac-OS';
		} else if (useragent && useragent?.isWindows) {
			log.osType = 'Windows';
		} else if (useragent && (useragent?.isLinux || useragent?.isLinux64)) {
			log.osType = 'Linux';
		}

		// Spread useragent properties into log
		log = { ...log, ...useragent };

		// Convert geoIp to JSON string or set to empty string if undefined
		log.geoIp = log.geoIp ? JSON.stringify(log.geoIp) : '';

		// Convert IP to string
		if (ip) {
			log.ip = ip.toString();
		}

		if (referenceIds) {
			if (Object.keys(referenceIds)[0] != ['DateRange'] && Array.isArray(referenceIds[Object.keys(referenceIds)[0]])) {
				log.count = referenceIds[Object.keys(referenceIds)[0]].length;
			}
			log.referenceIds = JSON.stringify(referenceIds);
		} else {
			log.referenceIds = null;
		}

		// Create new log entry in the database
		[err, newLog] = await to(User_log.create(log));
		if (err) {
			return ThrowException(err.message);
		}
		if (!newLog) {
			return ThrowException(MESSAGE.LOG_FAIL);
		}

		return newLog;
	} catch (error) {
		// Handle errors and log if necessary
		console.error('Error in createlog:', error);
		return ThrowException(error.message);
	}
};

module.exports.createlog = createlog;

// To get user logs
// @param userId (int), offsetcount (int), **privileged (bool)
const getUserLogs = async (userId, offset, privileged) => {
	let where = { UserId: userId };
	if (privileged == undefined) where.privileged = false;
	[err, logs] = await to(
		User_log.findAll({
			where: where,
			include: [{ model: User, include: [{ model: Market }] }],
			order: [
				['createdAt', 'desc'],
				['id', 'desc'],
			],
			// limit: 10,
			// offset: offset
		})
	);
	for (let i in logs) {
		[err, localUser] = await to(
			dbInstance[logs[i].User.Market.db_name].User_master.findById(logs[i].User.local_user_id)
		);
		let userData = logs[i].User;
		userData.first = localUser.first;
		userData.last = localUser.last;
		logs[i].User = userData;
	}

	if (err) return ThrowException(err.message, true);
	if (!logs) return ThrowException(MESSAGE.LOG_FAIL);
	return logs;
};
module.exports.getUserLogs = getUserLogs;

//Learner Opt-In log
const learnerOptInLog = async function (details, type) {
	try {
		if (type == 'drip') {
			details.forDrip = true;
		} else if (type == 'diwo') {
			details.forDiwo = true;
		}
		[err, maintainOptinLog] = await to(CustomerPolicyLog.create(details));
		if (err) return ThrowException(err.message);
		if (!maintainOptinLog) return ThrowException(MESSAGE.LOG_FAIL);
		return maintainOptinLog;
	} catch (error) {
		console.log('---Error when Mainitain Learner Opt in Log--', error);
	}
};
module.exports.learnerOptInLog = learnerOptInLog;

//Learner Opt-In log bulk create
const learnerOptInLogBulkCreate = async function (details) {
	try {
		[err, maintainOptinLog] = await to(CustomerPolicyLog.bulkCreate(details));
		if (err) return ThrowException(err.message);
		if (!maintainOptinLog) return ThrowException(MESSAGE.LOG_FAIL);
		return maintainOptinLog;
	} catch (error) {
		console.log('---Error when Mainitain Learner Opt in Log--', error);
	}
};
module.exports.learnerOptInLogBulkCreate = learnerOptInLogBulkCreate;
