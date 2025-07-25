const { Role, Menu, menu_mappings } = require('../models1/connectionPool')['global'];
const { to } = require('../services/util.service');
const MESSAGE = require('../config/message');
const Sequelize = require('sequelize');
const getMenu = async (userrole) => {
	let err;

	return new Promise(async (resolve, reject) => {
		[err, role] = await to(Role.findOne({ where: { name: userrole } }));
		if (err) return reject(err);
		if (!role) return reject(MESSAGE.NO_ROLE);

		[err, menus] = await to(
			menu_mappings.findAll({
				where: { RoleId: role.id },
				include: [{ model: Menu }, { model: Role }],
			})
		);
		if (err) return reject(err);

		resolve(menus);
	});
};
module.exports.getMenu = getMenu;
