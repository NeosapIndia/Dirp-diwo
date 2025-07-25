const { Op, sequelize } = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let imagePath = 'uploads/assets/';
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');

const createUserGroup = async function (req, res) {
	try {
		let err;
		let clientId = req.params.clientId;

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: asset_.convertToJSON() });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createUserGroup = createUserGroup;

const updateUserGroup = async function (req, res) {
	try {
		let err;
		let clientId = req.params.clientId;
		let userGroup = req.params.userGroupId;
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: asset_.convertToJSON() });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateUserGroup = updateUserGroup;

const deleteUserGroup = async function (req, res) {
	try {
		let err;
		let clientId = req.params.clientId;
		let userGroup = req.params.userGroupId;
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: asset_.convertToJSON() });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteUserGroup = deleteUserGroup;
