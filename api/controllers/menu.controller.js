const { Menu, menu_mappings, Role, Op } = require('../models1/connectionPool')['global'];
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const menuService = require('../services/menu.service');
const MESSAGE = require('../config/message');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');
const Joi = require('joi');

//  API to get menu based on role
const menu = async function (req, res) {
	try {
		let err, menus;
		let role = req.params.role;

		[err, menus] = await to(menuService.getMenu(role));
		if (err) return ResponseError(res, err, 500, true);

		let menu_info = [];
		for (let menu of menus) {
			menu = menu.convertToJSON();
			menu_info.push({
				Role: menu.Role.name,
				Menu: menu.Menu.name,
				module_code: menu.Menu.code,
				permission: menu.permission,
				details: menu.Role.details ? JSON.parse(menu.Role.details) : {},
			});
		}
		return ResponseSuccess(res, {
			menu: menu_info,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.menu = menu;

const getAccountTypeByRoleId = async function (req, res) {
	try {
		let err;
		let roleId = parseInt(req.params.roleId);
		let list = [];
		[err, getAccuntType] = await to(
			menu_mappings.findAll({
				where: {
					RoleId: roleId,
					MenuId: [2, 3, 4, 5],
					permission: 'RW',
				},
				include: [
					{
						model: Menu,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getAccuntType && getAccuntType.length > 0) {
			for (let menu of getAccuntType) {
				list.push({
					name: menu.Menu.name.replaceAll('Accounts', 'Account'),
				});
			}
		}
		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAccountTypeByRoleId = getAccountTypeByRoleId;

const getOneLevelDownRoleList = async function (req, res) {
	try {
		let roleId = parseInt(req.params.roleId);
		let projectName = req.query.projectName;
		let isDrip = false;
		let isDiwo = false;
		if (projectName == 'drip') {
			isDrip = true;
		} else if (projectName == 'diwo') {
			isDiwo = true;
		}

		[err, roles] = await to(
			Role.findAll({
				where: {
					id: {
						[Op.gt]: roleId,
					},
					dripRole: isDrip,
					diwoRole: isDiwo,
				},
				attributes: ['id', 'name'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let list = [];
		if (roles && roles.length > 0) {
			for (let role of roles) {
				list.push({
					id: role.id,
					name: role.name,
				});
			}
		}
		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getOneLevelDownRoleList = getOneLevelDownRoleList;

const getPermission = async function (req, res) {
	try {
		const schema = Joi.object({
			menuId: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
			roleId: Joi.number().integer().positive().required(),
			permission: Joi.string().trim().required(),
		});

		const { error, value } = schema.validate({
			menuId: req.body.menuId,
			roleId: parseInt(req.body.roleId),
			permission: req.body.permission,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { menuId, roleId, permission } = value;

		let err, menuPermission;
		// let menuId = req.body.menuId;
		// let roleId = req.body.roleId;
		// let permission = req.body.permission;

		[err, menuPermission] = await to(
			menu_mappings.findOne({
				where: {
					MenuId: menuId,
					RoleId: roleId,
					permission: permission,
				},
			})
		);

		let ispermission;
		if (menuPermission) {
			ispermission = true;
		} else {
			ispermission = false;
		}
		if (
			(menuPermission &&
				(menuPermission.MenuId == 15 || menuPermission.MenuId == '15') &&
				(menuPermission.RoleId == 6 || menuPermission.RoleId == '6')) ||
			(menuPermission &&
				(menuPermission.MenuId == 27 || menuPermission.MenuId == '27') &&
				(menuPermission.RoleId == 2 ||
					menuPermission.RoleId == '2' ||
					menuPermission.RoleId == 3 ||
					menuPermission.RoleId == '3' ||
					menuPermission.RoleId == 4 ||
					menuPermission.RoleId == '4' ||
					menuPermission.RoleId == 5 ||
					menuPermission.RoleId == '5' ||
					menuPermission.RoleId == 6 ||
					menuPermission.RoleId == '6'))
		) {
			ispermission = {
				ispermission: ispermission,
				menuPermission: menuPermission,
			};
		} else {
			ispermission = ispermission;
		}

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: ispermission });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getPermission = getPermission;
