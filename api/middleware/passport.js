const { ExtractJwt, Strategy } = require('passport-jwt');
const { User, Client, User_role_client_mapping, Role } = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { to } = require('../services/util.service');

// module.exports = function (passport) {
// 	var opts = {};
// 	opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// 	opts.secretOrKey = CONFIG.jwt_encryption;
// 	passport.use(
// 		'jwt-header',
// 		new Strategy(opts, async function (jwt_payload, done) {
// 			console.log('---jwt_payload---', jwt_payload);
// 			let err, user;
// 			[err, user] = await to(
// 				User.findOne({
// 					where: {
// 						id: jwt_payload.user_id,
// 					},
// 				})
// 			);
// 			if (err) return done(err, false);
// 			if (user) {
// 				if (user.type == jwt_payload.type) {
// 					let userdetails = user;
// 					userdetails.RoleId = jwt_payload.RoleId ? jwt_payload.RoleId : null;
// 					userdetails.ClientId = jwt_payload.ClientId ? jwt_payload.ClientId : null;
// 					userdetails.type = jwt_payload.type ? jwt_payload.type : null;
// 					return done(null, userdetails);
// 				} else {
// 					return done(null, false);
// 				}
// 			} else {
// 				return done(null, false);
// 			}
// 		})
// 	);
// };

// module.exports = function (passport) {
// 	passport.use(
// 		'jwt',
// 		new Strategy(
// 			{
// 				jwtFromRequest: (req) => req.cookies.jwt, // Extract JWT from cookies
// 				secretOrKey: CONFIG.jwt_encryption,
// 			},
// 			async (jwt_payload, done) => {
// 				try {
// 					// Validate User
// 					//For Scope
// 					if (jwt_payload?.scope !== 'Normal') {
// 						return done(null, false);
// 					}

// 					const user = await User.findOne({
// 						where: {
// 							id: jwt_payload.user_id,
// 							cStatus: 'Active',
// 							is_archive: false,
// 						},
// 						attributes: [
// 							'id',
// 							'cStatus',
// 							'is_archive',
// 							'forDrip',
// 							'forDiwo',
// 							'local_user_id',
// 							'MarketId',
// 							'account_id',
// 						],
// 					});

// 					if (!user) return done(null, false);

// 					// Validate Role and Client Mapping
// 					const validMapping = await User_role_client_mapping.findOne({
// 						where: {
// 							UserId: jwt_payload.user_id,
// 							RoleId: jwt_payload.RoleId,
// 							ClientId: jwt_payload.ClientId,
// 						},
// 						include: [{ model: Role, attributes: ['id', 'name'] }],
// 					});

// 					if (!validMapping || !['drip', 'diwo'].includes(jwt_payload.type)) return done(null, false);

// 					// Return Valid Payload
// 					return done(null, {
// 						id: jwt_payload.user_id,
// 						RoleId: jwt_payload.RoleId,
// 						ClientId: jwt_payload.ClientId,
// 						type: jwt_payload.type,
// 						Role: validMapping.Role.name,
// 						local_user_id: user.local_user_id,
// 						MarketId: user.MarketId,
// 						account_id: user.account_id,
// 						forDrip: user.forDrip,
// 						forDiwo: user.forDiwo,
// 					});
// 				} catch (error) {
// 					return done(error, false);
// 				}
// 			}
// 		)
// 	);
// };

module.exports = function (passport) {
	// === STRATEGY 1: JWT from Cookies ===
	passport.use(
		'jwt',
		new Strategy(
			{
				jwtFromRequest: (req) => req.cookies.jwt, // Extract JWT from cookies
				secretOrKey: CONFIG.jwt_encryption,
			},
			async (jwt_payload, done) => {
				try {
					if (jwt_payload?.scope !== 'Normal') return done(null, false);

					const user = await User.findOne({
						where: {
							id: jwt_payload.user_id,
							cStatus: 'Active',
							is_archive: false,
						},
						attributes: [
							'id',
							'cStatus',
							'is_archive',
							'forDrip',
							'forDiwo',
							'local_user_id',
							'MarketId',
							'account_id',
						],
					});

					if (!user) return done(null, false);

					const validMapping = await User_role_client_mapping.findOne({
						where: {
							UserId: jwt_payload.user_id,
							RoleId: jwt_payload.RoleId,
							ClientId: jwt_payload.ClientId,
						},
						include: [{ model: Role, attributes: ['id', 'name'] }],
					});

					if (!validMapping || !['drip', 'diwo'].includes(jwt_payload.type)) return done(null, false);

					return done(null, {
						id: jwt_payload.user_id,
						RoleId: jwt_payload.RoleId,
						ClientId: jwt_payload.ClientId,
						type: jwt_payload.type,
						Role: validMapping.Role.name,
						local_user_id: user.local_user_id,
						MarketId: user.MarketId,
						account_id: user.account_id,
						forDrip: user.forDrip,
						forDiwo: user.forDiwo,
					});
				} catch (error) {
					return done(error, false);
				}
			}
		)
	);

	// === STRATEGY 2: JWT from Authorization Header (Bearer) ===
	passport.use(
		'jwt-header',
		new Strategy(
			{
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from Authorization Bearer
				secretOrKey: CONFIG.jwt_encryption,
			},
			async (jwt_payload, done) => {
				try {
					if (jwt_payload?.scope !== 'AR-VR') return done(null, false);

					const user = await User.findOne({
						where: {
							id: jwt_payload.user_id,
							cStatus: 'Active',
							is_archive: false,
						},
						attributes: [
							'id',
							'cStatus',
							'is_archive',
							'forDrip',
							'forDiwo',
							'local_user_id',
							'MarketId',
							'account_id',
						],
					});

					if (!user) return done(null, false);

					const validMapping = await User_role_client_mapping.findOne({
						where: {
							UserId: jwt_payload.user_id,
							RoleId: jwt_payload.RoleId,
							ClientId: jwt_payload.ClientId,
						},
						include: [{ model: Role, attributes: ['id', 'name'] }],
					});

					if (!validMapping || !['drip', 'diwo'].includes(jwt_payload.type)) return done(null, false);

					return done(null, {
						id: jwt_payload.user_id,
						RoleId: jwt_payload.RoleId,
						ClientId: jwt_payload.ClientId,
						type: jwt_payload.type,
						Role: validMapping.Role.name,
						local_user_id: user.local_user_id,
						MarketId: user.MarketId,
						account_id: user.account_id,
						forDrip: user.forDrip,
						forDiwo: user.forDiwo,
					});
				} catch (error) {
					return done(error, false);
				}
			}
		)
	);
};
