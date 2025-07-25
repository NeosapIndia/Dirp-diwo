const { User, User_group, Client, User_role_client_mapping } = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');

const interplay = async function (req, res) {
	try {
		let data = req.body;
		if (data.AccessFor.toLowerCase() == 'drip') {
			if (data.UserIds) {
				let userIds = JSON.parse(data.UserIds);
				[err, updateUsers] = await to(
					User.update(
						{
							forDrip: true,
						},
						{
							where: {
								id: userIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, updateUserRoles] = await to(
					User_role_client_mapping.update(
						{
							forDrip: true,
						},
						{
							where: {
								UserId: userIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (data.Clients) {
				let clients = JSON.parse(data.Clients);

				[err, updateUserRoles] = await to(
					Client.update(
						{
							DripAccess: true,
						},
						{
							where: {
								id: clients,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (data.UserGroups) {
				let userGroupIds = JSON.parse(data.UserGroups);

				[err, updateUserRoles] = await to(
					User_group.update(
						{
							forDrip: true,
						},
						{
							where: {
								id: userGroupIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (data.AccessFor.toLowerCase() == 'diwo') {
			if (data.UserIds) {
				let userIds = JSON.parse(data.UserIds);
				[err, updateUsers] = await to(
					User.update(
						{
							forDiwo: true,
						},
						{
							where: {
								id: userIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, updateUserRoles] = await to(
					User_role_client_mapping.update(
						{
							forDiwo: true,
						},
						{
							where: {
								UserId: userIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (data.Clients) {
				let clients = JSON.parse(data.Clients);

				[err, updateUserRoles] = await to(
					Client.update(
						{
							DiwoAccess: true,
						},
						{
							where: {
								id: clients,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (data.UserGroups) {
				let userGroupIds = JSON.parse(data.UserGroups);

				[err, updateUserRoles] = await to(
					User_group.update(
						{
							forDiwo: true,
						},
						{
							where: {
								id: userGroupIds,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		return ResponseSuccess(res, {
			message: 'Succesfully Done!!',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.interplay = interplay;
