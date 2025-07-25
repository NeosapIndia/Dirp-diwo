const { ResponseError } = require('../services/util.service');
const MESSAGE = require('./../config/message');

module.exports = function (authorizedRoles) {
	return async function (req, res, next) {
		let user = req.user;
		let admin_roles = [
			'Product Owner Super Admin',
			'Product Owner Admin',
			'Partner Super Admin',
			'Partner Admin',
			'Client Admin',
			'Branch Admin',
			'Analyst',
			'Content Author',
			'Business Manager',
			'Facilitator',
			'Learner',
		];

		// console.log('-----------------user----------------', user);
		// console.log('-----------------authorizedRoles----------------', authorizedRoles);

		if (authorizedRoles.includes(user.Role) && admin_roles.includes(user.Role)) {
			return next();
		} else {
			return ResponseError(res, MESSAGE.UNAUTHORISED, 403);
		}
		// user.getRoles().then((associatedRoles) => {
		// 	let userRole = [];
		// 	associatedRoles.map((role) => {
		// 		userRole.push(role.convertToJSON().name);
		// 	});
		// 	if (userRole.length < 1) return ResponseError(res, MESSAGE.UNAUTHORISED, 403);

		// 	if (admin_roles.includes(req.headers.role)) {
		// 		userData = userRole.find((item) => item == req.user.Role);

		// 		if (userData && authorizedRoles.includes(userData)) {
		// 			req.user.role = userData;
		// 			return next();
		// 		}
		// 	} else {
		// 		if (authorizedRoles.includes(userRole[0])) {
		// 			req.user.role = userRole[0];
		// 			return next();
		// 		}
		// 	}
		// 	return ResponseError(res, MESSAGE.UNAUTHORISED, 403);
		// });
	};
};
