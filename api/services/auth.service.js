const { User, Role, Market, Country, Op, Client, User_role_client_mapping, Session, sequelize } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');

const validator = require('validator');
const { to, ThrowException, ResponseError } = require('../services/util.service');
const MESSAGE = require('../config/message');
const Joi = require('joi');
const {
	getLearnerValidaionOnCreateLearnerForDiwo,
	getAddOneLearnerCountForDiwo,
} = require('../services/license.service');

const { getAllSubBranchAccountLists } = require('../services/client.service');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const bcrypt = require('bcrypt');
const bcrypt_p = require('bcrypt-promise');
// const { access } = require('node:fs');
const Sequelize = require('sequelize');
const sanitizeHtml = require('sanitize-html');

const createUser = async (userInfo) => {
	let err, globalUser, role, marketInfo;
	userInfo.remaining_calls = 1;

	[err, markets] = await to(
		Market.findOne({
			where: {
				status: true,
			},
			include: [
				{
					model: Country,
					attributes: ['id', 'name'],
					where: {
						name: userInfo.country,
					},
					required: true,
				},
			],
		})
	);
	if (err) {
		if (err.message == 'Validation error') err = MESSAGE.DUPLICATE_USER;
		return ThrowException(err.message);
	}

	if (!userInfo.phone) {
		userInfo.phone = '';
	}

	[err, localUser] = await to(dbInstance[markets.db_name].User_master.create(userInfo));
	if (err) return ThrowException(err.message);

	localUser.associated_acc = localUser.id;
	[err, localUser] = await to(localUser.save());
	if (err) return ThrowException(err.message);

	let userObj = {
		country: userInfo.country,
		MarketId: markets.id,
		CountryId: markets.Countries[0].id,
		type: 'Normal User',
		local_user_id: localUser.id,
		access_level: 'Full',
		// associated_acc: localUser.associated_acc,
		status: true,
		account_id: '0',
	};
	[err, globalUser] = await to(User.create(userObj));

	//Update Account Id
	await updateUserAccountId();
	if (err) {
		if (err.message == 'Validation error') err = MESSAGE.DUPLICATE_USER;
		return ThrowException(err.message);
	}
	let id = globalUser.id;
	[err, isUpdated] = await to(
		globalUser.update({
			associated_acc: id,
		})
	);

	[err, role] = await to(
		Role.findOne({
			where: {
				name: userInfo.role,
			},
		})
	);
	if (err) return ThrowException(err.message);
	if (!role) return ThrowException(MESSAGE.REQUEST_FAILED);

	[err] = await to(role.addUser(globalUser));

	if (err) return ThrowException(MESSAGE.REQUEST_FAILED);

	return {
		localUser: localUser.convertToJSON(),
		globalUser: globalUser.convertToJSON(),
		market: markets.convertToJSON(),
	};
};
module.exports.createUser = createUser;

// const regenarateOtp = async (userInfo, pwa_login, type) => {
// 	let auth_info, err, medium, markets;
// 	let status;
// 	let user;
// 	let user_role;
// 	auth_info = {};
// 	auth_info.status = 'updated';

// 	if (userInfo.otp) {
// 		let salt;
// 		let hash;
// 		[err, salt] = await to(bcrypt.genSalt(10));
// 		if (err) ThrowException(err.message);
// 		[err, hash] = await to(bcrypt.hash(userInfo.otp, salt));
// 		if (err) ThrowException(err.message);
// 		userInfo.otp = hash;
// 	}
// 	if (!userInfo.phone) {
// 		medium = {
// 			//email: {
// 			//	[Op.iLike]: userInfo.email.toLowerCase(),
// 			//},
// 			email: userInfo.email.toLowerCase(),
// 		};
// 	} else {
// 		medium = {
// 			phone: userInfo.phone,
// 		};
// 	}
// 	medium.isDeleted = false;

// 	[err, markets] = await to(
// 		Market.findOne({
// 			where: {
// 				status: true,
// 			},
// 			include: [
// 				{
// 					model: Country,
// 					attributes: ['id', 'name'],
// 					where: {
// 						name: userInfo.country,
// 					},
// 					required: true,
// 				},
// 			],
// 		})
// 	);

// 	if (err) {
// 		return ThrowException(MESSAGE.MARKET_NOT_AVAILABLE);
// 	}

// 	[err, userDetails] = await to(
// 		dbInstance[markets.db_name].User_master.findOne({
// 			where: {
// 				...medium,
// 				status: true,
// 				type: 'Admin',
// 			},
// 		})
// 	);

// 	if (err) {
// 		ThrowException(err.message);
// 	}

// 	if (userDetails) {
// 		if (type == 'drip') {
// 			[err, user] = await to(
// 				User.findOne({
// 					where: {
// 						local_user_id: userDetails.id,
// 						MarketId: markets.id,
// 						forDrip: true,
// 					},
// 				})
// 			);
// 		} else if (type == 'diwo') {
// 			[err, user] = await to(
// 				User.findOne({
// 					where: {
// 						local_user_id: userDetails.id,
// 						MarketId: markets.id,
// 						forDiwo: true,
// 					},
// 				})
// 			);
// 		}

// 		if (user && user.cStatus != 'Active') {
// 			ThrowException(MESSAGE.USER_NOT_ACTIVE);
// 		} else if (!user) {
// 			ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 		}
// 		status = user.status;
// 	}

// 	if (pwa_login) {
// 		if (type == 'drip') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: 1,
// 						UserId: user.id,
// 						forDrip: true,
// 					},
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		} else if (type == 'diwo') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: 1,
// 						UserId: user.id,
// 						forDiwo: true,
// 					},
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		}

// 		if (!user_role) {
// 			ThrowException(MESSAGE.NOT_LEARNER_USER);
// 		}
// 	} else {
// 		if (type == 'drip') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: {
// 							[Op.ne]: 1,
// 						},
// 						UserId: user.id,
// 						forDrip: true,
// 					},
// 					include: [
// 						{
// 							model: Client,
// 							where: {
// 								status: 'Active',
// 								is_deleted: false,
// 							},
// 						},
// 					],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		} else if (type == 'diwo') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: {
// 							[Op.ne]: 1,
// 						},
// 						UserId: user.id,
// 						forDiwo: true,
// 					},
// 					include: [
// 						{
// 							model: Client,
// 							where: {
// 								status: 'Active',
// 								is_deleted: false,
// 							},
// 						},
// 					],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		}

// 		if (!user_role) {
// 			ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 		}
// 	}

// 	if (userDetails) {
// 		[err, user] = await to(
// 			dbInstance[markets.db_name].User_master.update(
// 				{
// 					otp: userInfo.otp,
// 				},
// 				{
// 					where: {
// 						...medium,
// 						type: 'Admin',
// 					},
// 				}
// 			)
// 		);

// 		if (err) ThrowException(err.message);

// 		let UserDetails = userDetails.convertToJSON();
// 		UserDetails.status = status;
// 		return UserDetails;
// 	} else {
// 		ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 	}
// };
// module.exports.regenarateOtp = regenarateOtp;

// const regenaratePWAOtp = async function (userInfo, pwa_login, type) {
// 	try {
// 		let err, markets;
// 		let user_role;
// 		let session;
// 		let sessionData;
// 		let checkCount;
// 		let medium = { isDeleted: false };
// 		let userAllPersnalDatas = [];
// 		let localUserIds = [];
// 		let userGlobalDataDetail;

// 		if (userInfo.otp) {
// 			let salt;
// 			let hash;
// 			[err, salt] = await to(bcrypt.genSalt(10));
// 			if (err) ThrowException(err.message);
// 			[err, hash] = await to(bcrypt.hash(userInfo.otp, salt));
// 			if (err) ThrowException(err.message);
// 			userInfo.otp = hash;
// 		} else {
// 			return ThrowException(MESSAGE.SOMTHING_WENT_WRONG);
// 		}

// 		// For Test User

// 		if (!userInfo.phone) {
// 			medium = {
// 				email: userInfo.email.toLowerCase(),
// 			};
// 		} else {
// 			medium = {
// 				phone: userInfo.phone,
// 			};
// 		}

// 		[err, markets] = await to(
// 			Market.findOne({
// 				where: {
// 					status: true,
// 				},
// 				include: [
// 					{
// 						model: Country,
// 						attributes: ['id', 'name'],
// 						where: {
// 							name: userInfo.country,
// 						},
// 						required: true,
// 					},
// 				],
// 			})
// 		);

// 		if (err || !markets) {
// 			return ThrowException(MESSAGE.MARKET_NOT_AVAILABLE);
// 		}

// 		[err, userAllPersnalDatas] = await to(
// 			dbInstance[markets.db_name].User_master.findAll({
// 				where: {
// 					...medium,
// 					status: true,
// 				},
// 				order: [['id', 'DESC']],
// 			})
// 		);

// 		if (err) ThrowException(err.message);

// 		if (userAllPersnalDatas.length > 0) {
// 			for (let localUser of userAllPersnalDatas) {
// 				localUserIds.push(localUser.id);
// 			}
// 		} else {
// 			if (type == 'drip') {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}
// 		}

// 		///For Drip Login Machanism For PWA
// 		if (type == 'drip') {
// 			if (userAllPersnalDatas.length == 0) {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 				return;
// 			}
// 			[err, userGlobalDataDetail] = await to(
// 				User.findOne({
// 					where: {
// 						local_user_id: localUserIds,
// 						MarketId: markets.id,
// 						forDrip: true,
// 						cStatus: 'Active',
// 					},
// 					attributes: ['id', 'local_user_id', 'MarketId'],
// 					order: [['id', 'DESC']],
// 				})
// 			);

// 			if (userGlobalDataDetail) {
// 				[err, user_role] = await to(
// 					User_role_client_mapping.findOne({
// 						where: {
// 							RoleId: 1,
// 							UserId: userGlobalDataDetail.id,
// 							forDrip: true,
// 						},
// 						include: [
// 							{
// 								model: Client,
// 								where: {
// 									status: 'Active',
// 									is_deleted: false,
// 								},
// 							},
// 						],
// 					})
// 				);
// 				if (err) ThrowException(err.message);

// 				if (!user_role) {
// 					ThrowException(MESSAGE.NOT_LEARNER_USER);
// 				}

// 				//Update OTP
// 				[err, updateOTP] = await to(
// 					dbInstance[markets.db_name].User_master.update(
// 						{
// 							otp: userInfo.otp,
// 						},
// 						{
// 							where: {
// 								id: userGlobalDataDetail.local_user_id,
// 							},
// 						}
// 					)
// 				);
// 				if (err) ThrowException(err.message);

// 				let userData;

// 				for (let persnalData of userAllPersnalDatas) {
// 					if (persnalData.id === userGlobalDataDetail.local_user_id) {
// 						userData = persnalData.convertToJSON();
// 					}
// 				}
// 				userData.otp = userInfo.otp;
// 				userData.status = true;
// 				userData.clientId = user_role && user_role.ClientId ? user_role.ClientId : null;
// 				return userData;
// 			} else {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}
// 		} else if (type == 'diwo') {
// 			//For Diwo Login Machanism For PWA
// 			let localUserId;
// 			[err, userGlobalDataDetail] = await to(
// 				User.findAll({
// 					where: {
// 						local_user_id: localUserIds,
// 						MarketId: markets.id,
// 						forDiwo: true,
// 						cStatus: 'Active',
// 					},
// 					attributes: ['id', 'local_user_id', 'MarketId'],
// 					order: [['id', 'DESC']],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 			if (userInfo && userInfo.sessioncode) {
// 				//Check Session Client id and User Client Id and then deside need to creating new user or not
// 				let userIds = [];
// 				let user_roles;
// 				[err, session] = await to(
// 					Session.findOne({
// 						where: {
// 							code: userInfo.sessioncode,
// 						},
// 						include: [{ model: Client }],
// 					})
// 				);
// 				if (err) ThrowException(err.message);

// 				if (!session) {
// 					ThrowException(MESSAGE.INVALID_SESSION_CODE);
// 				}

// 				if (userGlobalDataDetail.length > 0) {
// 					localUserId = userGlobalDataDetail[0].local_user_id;
// 					for (let user of userGlobalDataDetail) {
// 						userIds.push(user.id);
// 					}
// 				}

// 				//Get all Branch id under the session client
// 				// let branchIds = await getAllSubBranchAccountLists(session.Client.id, false);

// 				//Get all user role for the user
// 				// if (userIds.length > 0) {
// 				// 	[err, user_roles] = await to(
// 				// 		User_role_client_mapping.findOne({
// 				// 			where: {
// 				// 				ClientId: branchIds,
// 				// 				UserId: userIds,
// 				// 				forDiwo: true,
// 				// 				RoleId: [1, 11],
// 				// 			},
// 				// 		})
// 				// 	);
// 				// 	if (err) ThrowException(err.message);
// 				// }

// 				//Check if user already present in the session client
// 				// if (!user_roles || user_roles.length == 0 || userIds.length == 0) {
// 				// sessionData = session.convertToJSON();

// 				// let workbookData_ = JSON.parse(sessionData.workbookData);
// 				// checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(sessionData.ClientId);

// 				// if (workbookData_.allowNewLearner == true && checkCount) {
// 				// 	let userdata = userInfo;
// 				// 	userdata.MarketId = markets.id;
// 				// 	userdata.CountryId = markets.Countries[0].id;
// 				// 	userdata.status = true;
// 				// 	userdata.is_verified = false;
// 				// 	userdata.is_deleted = false;
// 				// 	userdata.type = 'Learner';
// 				// 	userdata.account_id = '0';
// 				// 	userdata.local_user_id = null;
// 				// 	userdata.cStatus = 'Active';
// 				// 	userdata.forDiwo = true;
// 				// 	userdata.isReg_Completed = false;

// 				// 	// userdata.first = newUserAccountId;

// 				// 	userdata.last = session.id.toString();
// 				// 	if (workbookData_.allowNewLearner && !workbookData_.newRegProvisional) {
// 				// 		userdata.spotReg = 'Approved';
// 				// 	} else if (workbookData_.allowNewLearner && workbookData_.newRegProvisional) {
// 				// 		userdata.spotReg = 'Provisional';
// 				// 		userdata.isLeanerSpotReg = true;
// 				// 	} else {
// 				// 		userdata.spotReg = 'NA';
// 				// 	}

// 				// 	[err, userGlobalDataDetail] = await to(User.create(userdata));
// 				// 	if (err) ThrowException(err.message);

// 				// 	await updateUserAccountId();

// 				// 	userdata.first = userGlobalDataDetail.id + 1000000;

// 				// 	[err, createLocalUser] = await to(dbInstance[markets.db_name].User_master.create(userdata));
// 				// 	if (err) ThrowException(err.message);

// 				// 	userGlobalDataDetail.local_user_id = createLocalUser.id;
// 				// 	localUserId = createLocalUser.id;
// 				// 	userAllPersnalDatas.push(createLocalUser);
// 				// 	localUserIds.push(createLocalUser.id);

// 				// 	[err, updateUser] = await to(
// 				// 		User.update(
// 				// 			{
// 				// 				local_user_id: createLocalUser.id,
// 				// 			},
// 				// 			{
// 				// 				where: {
// 				// 					id: userGlobalDataDetail.id,
// 				// 				},
// 				// 			}
// 				// 		)
// 				// 	);
// 				// 	if (err) ThrowException(err.message);

// 				// 	// Create User Role

// 				// 	let userId = userGlobalDataDetail.id;
// 				// 	let payload = {
// 				// 		RoleId: 1, //Learner Role
// 				// 		UserId: userId,
// 				// 		forDiwo: true,
// 				// 		ClientId: branchIds[0],
// 				// 	};

// 				// 	[err, create_user_role] = await to(User_role_client_mapping.create(payload));
// 				// 	if (err) ThrowException(err.message);

// 				// 	if (checkCount) {
// 				// 		await getAddOneLearnerCountForDiwo(sessionData.ClientId);
// 				// 	}
// 				// } else if (workbookData_.allowNewLearner == false) {
// 				// 	return { error: MESSAGE.YOU_ARE_NOT_REGISTERED_LEARNER_PLEASE_CONTACT_TRAINING_ADMIN };
// 				// } else {
// 				// 	return { error: MESSAGE.NO_PERMISSION_TO_CREATE_SPOT_REGISRATION };
// 				// }
// 				// }
// 			} else if (userGlobalDataDetail.length > 0) {
// 				//select first user
// 				userGlobalDataDetail = userGlobalDataDetail[0];
// 				localUserId = userGlobalDataDetail.local_user_id;
// 			} else {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}

// 			[err, updateOTP] = await to(
// 				dbInstance[markets.db_name].User_master.update(
// 					{
// 						otp: userInfo.otp,
// 					},
// 					{
// 						where: {
// 							id: localUserId,
// 						},
// 					}
// 				)
// 			);
// 			if (err) ThrowException(err.message);

// 			let userData;

// 			for (let persnalData of userAllPersnalDatas) {
// 				if (persnalData.id === localUserId) {
// 					userData = persnalData.convertToJSON();
// 				}
// 			}
// 			userData.otp = userInfo.otp;
// 			userData.status = true;
// 			userData.clientId = user_role && user_role.ClientId ? user_role.ClientId : null;
// 			return userData;
// 		}
// 	} catch (error) {
// 		return ResponseError(error, 500, true);
// 	}
// };
// module.exports.regenaratePWAOtp = regenaratePWAOtp;

// const regenaratePWAOtp = async (userInfo, pwa_login, type) => {
// 	let auth_info, err, medium, markets;
// 	let status;
// 	let user;
// 	let user_role;
// 	let session;
// 	auth_info = {};
// 	auth_info.status = 'updated';
// 	let sessionData;
// 	let checkCount;

// 	if (userInfo.otp) {
// 		let salt;
// 		let hash;
// 		[err, salt] = await to(bcrypt.genSalt(10));
// 		if (err) ThrowException(err.message);
// 		[err, hash] = await to(bcrypt.hash(userInfo.otp, salt));
// 		if (err) ThrowException(err.message);
// 		userInfo.otp = hash;
// 	}
// 	if (!userInfo.phone) {
// 		medium = {
// 			email: {
// 				[Op.iLike]: userInfo.email,
// 			},
// 		};
// 	} else {
// 		medium = {
// 			phone: userInfo.phone,
// 		};
// 	}

// 	medium.isDeleted = false;
// 	[err, markets] = await to(
// 		Market.findOne({
// 			where: {
// 				status: true,
// 			},
// 			include: [
// 				{
// 					model: Country,
// 					attributes: ['id', 'name'],
// 					where: {
// 						name: userInfo.country,
// 					},
// 					required: true,
// 				},
// 			],
// 		})
// 	);

// 	if (err) {
// 		return ThrowException(MESSAGE.MARKET_NOT_AVAILABLE);
// 	}

// 	[err, userDetails_] = await to(
// 		dbInstance[markets.db_name].User_master.findOne({
// 			where: {
// 				...medium,
// 				status: true,
// 			},
// 		})
// 	);

// 	if (err) ThrowException(err.message);

// 	if (!userDetails_ && type == 'diwo') {
// 		if (markets) {
// 			[err, session] = await to(
// 				Session.findOne({
// 					where: {
// 						code: userInfo.sessioncode,
// 					},
// 					include: [{ model: Client }],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 			if (session) {
// 				sessionData = session.convertToJSON();

// 				let workbookData_ = JSON.parse(sessionData.workbookData);
// 				checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(sessionData.ClientId);

// 				if (workbookData_.allowNewLearner == true && checkCount) {
// 					let userdata = userInfo;
// 					let lastUserAccountId = await getLastAccountId();
// 					let newUserAccountId = (parseInt(lastUserAccountId) + 1).toString();
// 					userdata.MarketId = markets.id;
// 					userdata.CountryId = markets.Countries[0].id;
// 					userdata.status = true;
// 					userdata.is_verified = false;
// 					userdata.is_deleted = false;
// 					userdata.type = 'Learner';
// 					userdata.account_id = newUserAccountId;
// 					userdata.cStatus = 'Active';
// 					userdata.forDiwo = true;
// 					userdata.isReg_Completed = false;
// 					userdata.first = newUserAccountId;
// 					userdata.last = session.id.toString();

// 					[err, createUser_] = await to(User.create(userdata));
// 					if (err) ThrowException(err.message);

// 					[err, createLocalUser] = await to(dbInstance[markets.db_name].User_master.create(userdata));
// 					if (err) ThrowException(err.message);

// 					[err, updateUser] = await to(
// 						User.update(
// 							{
// 								local_user_id: createLocalUser.id,
// 							},
// 							{
// 								where: {
// 									id: createUser_.id,
// 								},
// 							}
// 						)
// 					);
// 					if (err) ThrowException(err.message);

// 					// Create User Role

// 					let userId = createUser_.id;
// 					let payload = {
// 						RoleId: 1, //Learner Role
// 						UserId: userId,
// 						forDiwo: true,
// 					};
// 					if (sessionData.Client.category == 'Branch Account') {
// 						payload.ClientId = sessionData.ClientId;
// 					} else {
// 						//Find Branch Account

// 						let flag = true;
// 						let clientCount;
// 						[err, clientCount] = await to(Client.count());

// 						let count = 0;
// 						let parentClientId = sessionData.Client.id;

// 						while (flag) {
// 							count++;
// 							if (count > clientCount) {
// 								flag = false;
// 							}

// 							[err, clientDeatils] = await to(
// 								Client.findOne({
// 									where: {
// 										Associate_client_id: parentClientId,
// 									},
// 									order: [['createdAt', 'DESC']],
// 								})
// 							);
// 							if (clientDeatils && clientDeatils.category == 'Branch Account') {
// 								payload.ClientId = clientDeatils.id;
// 								flag = false;
// 							} else if (clientDeatils && clientDeatils.Associate_client_id) {
// 								parentClientId = clientDeatils.id;
// 							} else {
// 								flag = false;
// 							}
// 						}
// 					}

// 					[err, create_user_role] = await to(User_role_client_mapping.create(payload));
// 					if (err) ThrowException(err.message);

// 					if (checkCount) {
// 						await getAddOneLearnerCountForDiwo(sessionData.ClientId);
// 					}
// 				} else if (workbookData_.allowNewLearner == false) {
// 					return { error: MESSAGE.YOU_ARE_NOT_REGISTERED_LEARNER_PLEASE_CONTACT_TRAINING_ADMIN };
// 				} else {
// 					return { error: MESSAGE.NO_PERMISSION_TO_CREATE_SPOT_REGISRATION };
// 				}
// 			} else {
// 				return { error: MESSAGE.INVALID_SESSION_CODE };
// 			}
// 		}
// 	}

// 	[err, userDetails] = await to(
// 		dbInstance[markets.db_name].User_master.findOne({
// 			where: {
// 				...medium,
// 				status: true,
// 			},
// 		})
// 	);

// 	if (userDetails) {
// 		if (type == 'drip') {
// 			[err, user] = await to(
// 				User.findOne({
// 					where: {
// 						local_user_id: userDetails.id,
// 						MarketId: markets.id,
// 						forDrip: true,
// 					},
// 				})
// 			);
// 		} else if (type == 'diwo') {
// 			[err, user] = await to(
// 				User.findOne({
// 					where: {
// 						local_user_id: userDetails.id,
// 						MarketId: markets.id,
// 						forDiwo: true,
// 					},
// 				})
// 			);
// 		}

// 		if (user && user.cStatus != 'Active') {
// 			ThrowException(MESSAGE.USER_NOT_ACTIVE);
// 		} else if (!user) {
// 			ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 		}

// 		status = user.status;
// 	}

// 	if (pwa_login) {
// 		if (type == 'drip') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: 1,
// 						UserId: user.id,
// 						forDrip: true,
// 					},
// 					include: [
// 						{
// 							model: Client,
// 							where: {
// 								status: 'Active',
// 								is_deleted: false,
// 							},
// 						},
// 					],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		} else if (type == 'diwo') {
// 			[err, user_role] = await to(
// 				User_role_client_mapping.findOne({
// 					where: {
// 						RoleId: [1, 11],
// 						UserId: user.id,
// 						forDiwo: true,
// 					},
// 					include: [
// 						{
// 							model: Client,
// 							where: {
// 								status: 'Active',
// 								is_deleted: false,
// 							},
// 						},
// 					],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 		}

// 		if (!user_role) {
// 			ThrowException(MESSAGE.NOT_LEARNER_USER);
// 		}
// 	}

// 	if (userDetails) {
// 		[err, user] = await to(
// 			dbInstance[markets.db_name].User_master.update(
// 				{
// 					otp: userInfo.otp,
// 				},
// 				{
// 					where: {
// 						...medium,
// 					},
// 				}
// 			)
// 		);

// 		if (err) ThrowException(err.message);

// 		[err, clientData] = await to(
// 			User_role_client_mapping.findOne({
// 				where: {
// 					RoleId: 1,
// 					UserId: userDetails.convertToJSON().id,
// 				},
// 			})
// 		);
// 		if (err) return ResponseError(res, err, 500, true);
// 		let UserDetails = userDetails.convertToJSON();
// 		UserDetails.otp = userInfo.otp;
// 		UserDetails.status = status;
// 		UserDetails.clientId = clientData && clientData.ClientId ? clientData.ClientId : null;
// 		return UserDetails;
// 	} else {
// 		ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 	}
// };
// module.exports.regenaratePWAOtp = regenaratePWAOtp;

// const authUser = async function (userInfo) {
// 	try {
// 		let medium, isUpdated, globalUser, err;
// 		if (!userInfo.phone) {
// 			medium = {
// 				email: {
// 					[Op.iLike]: userInfo.email.toLowerCase(),
// 				},
// 			};
// 		} else {
// 			medium = {
// 				phone: userInfo.phone,
// 			};
// 		}

// 		[err, markets] = await to(
// 			Market.findOne({
// 				where: {
// 					status: true,
// 				},
// 				include: [
// 					{
// 						model: Country,
// 						attributes: ['id', 'name'],
// 						where: {
// 							name: userInfo.country,
// 						},
// 						required: true,
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			return ThrowException(MESSAGE.MARKET_NOT_FIND);
// 		}

// 		// let err, user;
// 		[err, user] = await to(
// 			dbInstance[markets.db_name].User_master.findOne({
// 				where: {
// 					...medium,
// 					status: true,
// 					type: 'Admin',
// 				},
// 			})
// 		);
// 		if (err) ThrowException(MESSAGE.USER_NOT_ACTIVE);
// 		if (!user) ThrowException(MESSAGE.INVALID_REQUEST);
// 		user.Market = markets;
// 		[err, globalUser] = await to(
// 			User.findOne({
// 				where: {
// 					local_user_id: user.id,
// 					MarketId: markets.id,
// 				},
// 				include: [
// 					{
// 						model: Client,
// 						include: ['System_branding', 'Client_Package'],
// 					},
// 					{
// 						model: Role,
// 					},
// 				],
// 			})
// 		);
// 		if (err) ThrowException(MESSAGE.USER_NOT_REGISTERED);

// 		// if (err) ThrowException(MESSAGE.USER_NOT_REGISTERED);

// 		if (userInfo.email == CONFIG.devops_tester_user_email && userInfo.otp == CONFIG.devops_tester_user_otp) {
// 			return {
// 				localUser: user,
// 				globalUser: globalUser,
// 				market: markets,
// 				client: globalUser.Clients,
// 			};
// 		} else if (userInfo.phone == CONFIG.devops_tester_user_phone && userInfo.otp == CONFIG.devops_tester_user_otp) {
// 			return {
// 				localUser: user,
// 				globalUser: globalUser,
// 				market: markets,
// 				client: globalUser.Clients,
// 			};
// 		}

// 		[err, user] = await to(user.comparePassword(userInfo.otp));
// 		if (err) ThrowException(MESSAGE.OTP_MISMATCH_ERROR);

// 		[err, isUpdated] = await to(
// 			globalUser.update({
// 				is_verified: true,
// 			})
// 		);
// 		if (err) console.log('is_verified update err', err);

// 		if (err) ThrowException(MESSAGE.INVALID_REQUEST);
// 		let users = {
// 			localUser: user,
// 			globalUser: globalUser,
// 			market: markets,
// 			client: globalUser.Clients,
// 		};
// 		return users;
// 	} catch (error) {
// 		throw error;
// 	}
// };

// module.exports.authUser = authUser;

// const pwaAuthUser = async function (userInfo, type) {
// 	try {
// 		let err;
// 		let localUserData;
// 		let globalUsers = [];
// 		let userAllPersnalDatas = [];

// 		let medium = {
// 			isDeleted: false,
// 			status: true,
// 			email: null,
// 			phone: null,
// 		};
// 		if (!userInfo.phone) {
// 			medium.email = userInfo.email.toLowerCase();
// 			delete medium.phone;
// 		} else {
// 			medium.phone = userInfo.phone;
// 			delete medium.email;
// 		}

// 		[err, markets] = await to(
// 			Market.findOne({
// 				where: {
// 					status: true,
// 				},
// 				include: [
// 					{
// 						model: Country,
// 						attributes: ['id', 'name'],
// 						where: {
// 							name: userInfo.country,
// 						},
// 						required: true,
// 					},
// 				],
// 				attributes: ['id', 'db_name'],
// 			})
// 		);
// 		if (err) {
// 			return ThrowException(MESSAGE.MARKET_NOT_FIND);
// 		}

// 		// let err, user;
// 		[err, userAllPersnalDatas] = await to(
// 			dbInstance[markets.db_name].User_master.findAll({
// 				where: medium,
// 				order: [['id', 'DESC']],
// 			})
// 		);
// 		if (err) {
// 			ThrowException(MESSAGE.USER_NOT_ACTIVE);
// 		}
// 		if (userAllPersnalDatas.length == 0) ThrowException(MESSAGE.INVALID_REQUEST);

// 		// user.Market = markets;

// 		let localUserIds = [];

// 		for (let data of userAllPersnalDatas) {
// 			localUserIds.push(data.id);
// 		}

// 		if (type === 'drip') {
// 			[err, globalUsers] = await to(
// 				User.findAll({
// 					where: {
// 						local_user_id: localUserIds,
// 						MarketId: markets.id,
// 						forDrip: true,
// 						cStatus: 'Active',
// 					},
// 					attributes: ['id', 'local_user_id', 'MarketId', 'is_verified', 'firstLogin', 'lastLogin'],
// 					order: [['id', 'DESC']],
// 				})
// 			);
// 			if (err) {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}
// 		} else if (type === 'diwo') {
// 			[err, globalUsers] = await to(
// 				User.findAll({
// 					where: {
// 						local_user_id: localUserIds,
// 						MarketId: markets.id,
// 						forDiwo: true,
// 						cStatus: 'Active',
// 					},
// 					attributes: ['id', 'local_user_id', 'MarketId', 'is_verified', 'firstLogin', 'lastLogin'],
// 					order: [['id', 'DESC']],
// 				})
// 			);
// 			if (err) {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}
// 		}

// 		if (globalUsers.length > 0) {
// 			for (let localData of userAllPersnalDatas) {
// 				if (localData.id == globalUsers[0].local_user_id) {
// 					localUserData = localData;
// 					break;
// 				}
// 			}
// 		} else {
// 			if (err) {
// 				ThrowException(MESSAGE.USER_NOT_REGISTERED);
// 			}
// 		}

// 		// if (err) ThrowException(MESSAGE.USER_NOT_REGISTERED);

// 		if (userInfo.email == CONFIG.devops_tester_user_email && userInfo.otp == CONFIG.devops_tester_user_otp) {
// 			return {
// 				localUser: localUserData,
// 				globalUser: [globalUsers[0].id],
// 			};
// 		} else if (userInfo.phone == CONFIG.devops_tester_user_phone && userInfo.otp == CONFIG.devops_tester_user_otp) {
// 			return {
// 				localUser: localUserData,
// 				globalUser: [globalUsers.id],
// 			};
// 		}

// 		[err, user] = await to(localUserData.comparePassword(userInfo.otp));
// 		if (err) {
// 			ThrowException(MESSAGE.OTP_MISMATCH_ERROR);
// 		}

// 		//At this stage OTP is Correct know get User and Client All Combination and send in the response

// 		// if (!globalUsers.is_verified) {
// 		// 		[err, isUpdated] = await to(
// 		// 			User.update(
// 		// 				{
// 		// 					is_verified: true,
// 		// 				},
// 		// 				{
// 		// 					where: {
// 		// 						id: globalUsers.id,
// 		// 					},
// 		// 				}
// 		// 			)
// 		// 		);
// 		// 		if (err) console.log('is_verified update err', err);
// 		// 	}
// 		// if (err) ThrowException(MESSAGE.INVALID_REQUEST);

// 		let userIds = [];
// 		for (let userId of globalUsers) {
// 			userIds.push(userId.id);
// 		}

// 		return userIds;
// 	} catch (error) {
// 		console.log('---Error pwaAuthUser---', error);
// 		throw error;
// 	}
// };
// module.exports.pwaAuthUser = pwaAuthUser;

const capitalFirstLatter = async function (letter) {
	try {
		let string = letter;
		const arr = string ? string.split(' ') : [];
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == 'of') {
				arr[i] = arr[i].toLowerCase();
			} else {
				arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1).toLowerCase();
			}
		}
		const str2 = arr.join(' ');
		return str2;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};
module.exports.capitalFirstLatter = capitalFirstLatter;

const updateUserAccountId = async function () {
	try {
		const updateAccountIdQuery = `UPDATE "Users"
									  SET account_id = id + 1000000
									  WHERE  account_id = '0';`;
		[updateAccountIds] = await sequelize.query(updateAccountIdQuery);
		return updateAccountIds;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};
module.exports.updateUserAccountId = updateUserAccountId;

const checkProjectNameByType = async function (type) {
	try {
		if (['drip', 'diwo'].indexOf(type) != -1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('----------Error checkProjectNameByType---', error);
	}
};
module.exports.checkProjectNameByType = checkProjectNameByType;

const checkClientIdAccess = async function (userClientId, clientId) {
	try {
		// Input Validation
		const schema = Joi.object({
			userClientId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error } = schema.validate({ userClientId, clientId });
		if (error) return false;

		if (userClientId === clientId) {
			return true;
		}

		// Define variables
		const maxIterations = 75;
		let iterations = 0;
		let queue = [userClientId]; // Start with user's client ID
		let visited = new Set(queue); // Track visited client IDs

		while (queue.length > 0 && iterations < maxIterations) {
			[err, clientDetails] = await to(
				Client.findAll({
					where: { Associate_client_id: queue },
					attributes: ['id'],
				})
			);

			if (err) {
				return false;
			}

			if (!clientDetails || clientDetails.length === 0) {
				return false;
			}

			queue = [];
			for (let client of clientDetails) {
				if (client.id === clientId) {
					return true;
				}
				if (!visited.has(client.id)) {
					visited.add(client.id);
					queue.push(client.id);
				}
			}

			iterations++;
		}

		return false;
	} catch (error) {
		return false;
	}
};

module.exports.checkClientIdAccess = checkClientIdAccess;

/**
 * Centralized SQL Injection Patterns
 */
const sqlInjectionPatterns = [
	// Detects SQL commands followed by specific SQL entities
	/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION)\s+(\*|FROM|INTO|TABLE|DATABASE|SCHEMA|VIEW|VALUES)\b/i,

	// SQL Logical Operators (OR/AND 1=1, etc.)
	/\b(OR|AND)\s+[\'\"]?\d+[\'\"]?\s*[=<>]\s*[\'\"]?\d+[\'\"]?/i,

	// Comments that attackers use to hide malicious queries
	/;[\s\r\n]--[\s\r\n]$/,
	/--[\s\r\n]+/,
	/\/\*[\s\S]*?\*\//,
	/#[\s\r\n]*$/,

	// SQL Execution commands
	/\bEXEC\b\s+(\bxp_\b|\bsp_\b)/i,

	// Sleep() and Waitfor Delay Attacks
	/\bSLEEP\s*\(\s*\d+\s*\)/i,
	/\bWAITFOR\b\s+\bDELAY\b/i,

	// File manipulation via SQL
	/\bLOAD_FILE\s*\(/i,
	/\bINTO\b\s+\bOUTFILE\b/i,

	// Detect common SQL patterns
	/\bSELECT\b.+\bFROM\b/i,
	/\bINSERT\b.+\bINTO\b/i,
	/\bUPDATE\b.+\bSET\b/i,
	/\bDELETE\b.+\bFROM\b/i,
];

/**
 * Field Type Mapping
 * Define the expected type for each field (e.g., 'html', 'string', etc.)
 */
const fieldTypeMapping = {
	htmlField: 'html', // Fields expected to contain HTML
	description: 'html', // Another HTML field
	name: 'string', // Plain string fields
	email: 'string', // Plain string fields
};
/**
 * Function to check if input contains harmful SQL injection patterns or unsafe HTML.
 * Returns an object with `isUnsafe` and `reason`.
 */
const containsDangerousChars = async function (value, fieldName = '') {
	try {
		const fieldType = fieldTypeMapping[fieldName] || 'string'; // Default to 'string' if no mapping exists
		// console.log(`Field: ${fieldName}, Type: ${fieldType}`); // Debug log

		// Recursive check for arrays
		if (Array.isArray(value)) {
			for (const item of value) {
				const result = containsDangerousChars(item, fieldName);
				if (result.isUnsafe) return result;
			}
		}

		// Recursive check for objects
		if (typeof value === 'object' && value !== null) {
			for (const [key, item] of Object.entries(value)) {
				const result = containsDangerousChars(item, key);
				if (result.isUnsafe) return result;
			}
		}

		// Check for HTML input
		if (fieldType === 'html' && typeof value === 'string' && value !== '' && value !== null) {
			// Sanitize and validate HTML
			const sanitizedHtml = sanitizeAndValidateHtml(value);
			if (!sanitizedHtml) {
				// console.log('Blocked unsafe HTML input');
				return { isUnsafe: true, reason: 'Unsafe HTML detected' };
			}
			return { isUnsafe: false }; // HTML is safe
		}

		// Check for string input
		if (typeof value === 'string') {
			const lower = value.toLowerCase().trim();

			// ?? Context-aware SQL Injection Detection
			for (const pattern of sqlInjectionPatterns) {
				if (pattern.test(lower)) {
					// console.log('Blocked SQL Injection Pattern:', pattern);
					return { isUnsafe: true, reason: 'SQL injection pattern detected' };
				}
			}

			// ?? Block dangerous symbols
			const forbiddenSymbols = ['--', ';', '|', '$', 'randomblob'];
			for (const symbol of forbiddenSymbols) {
				if (lower.includes(symbol)) {
					console.log('Blocked Symbol:', symbol);
					return { isUnsafe: true, reason: 'Forbidden symbol detected' };
				}
			}

			// Extra check for extremely suspicious combinations
			if (/['"][=<>]['"]/.test(lower) || /'\s*OR\s*'/.test(lower)) {
				// console.log('Blocked suspicious combination');
				return { isUnsafe: true, reason: 'Suspicious combination detected' };
			}
		}

		return { isUnsafe: false }; // Input is safe
	} catch (error) {
		console.error('Error in containsDangerousChars:', error);
		return { isUnsafe: true, reason: 'Error during validation' }; // Assume unsafe if error occurs
	}
};
module.exports.containsDangerousChars = containsDangerousChars;

/**
 * Function to sanitize and validate HTML input.
 */
function sanitizeAndValidateHtml(value) {
	try {
		// console.log('Sanitizing HTML:', value); // Debug log
		// Define allowed tags and attributes
		const cleanHtml = sanitizeHtml(value, {
			allowedTags: [
				'b',
				'i',
				'em',
				'strong',
				'a',
				'p',
				'ul',
				'ol',
				'li',
				'br',
				'span',
				'div',
				'img',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
			],
			allowedAttributes: {
				a: ['href', 'target'], // Allow href and target for <a> tags
				img: ['src', 'alt', 'width', 'height'],
				'*': ['style', 'class'], // Allow style and class for all tags
			},
			allowedSchemes: ['http', 'https', 'mailto'], // Allow only safe URL schemes
		});

		// Check if the sanitized HTML is empty (indicating malicious input)
		if (!cleanHtml.trim() || cleanHtml.includes('<script')) {
			throw new Error('Invalid HTML input detected');
		}

		return cleanHtml; // Return sanitized HTML
	} catch (error) {
		console.error('Error in sanitizeAndValidateHtml:', error);
		return null; // Return null if sanitization fails
	}
}
