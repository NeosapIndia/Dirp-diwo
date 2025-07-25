const { User, Role, Market, Country, Op, Client, User_role_client_mapping, Session, sequelize } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');

const validator = require('validator');
const { to, ThrowException, ResponseError } = require('../services/util.service');
const MESSAGE = require('../config/message');
const Sequelize = require('sequelize');
const { getAllSubBranchAccountLists } = require('../services/client.service');
const {
	sendPasswordResetEmail,
	sendPasswordResetEmailForDrip,
	sendForgotPasswordEmail,
	sendAdminForgotPasswordEmail,
	sendResetLockoutEmailToLearnerAsAdminUnlockAccount,
	sendResetLockoutEmail,
	sendResetLockoutEmailToAdmin,
	sendCreatePasswordEmailToAdmin,
	sendResetLockoutEmailForDrip
} = require('../services/mailer.service');
const { createlog } = require('../services/log.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const bcrypt = require('bcrypt');
const bcrypt_p = require('bcrypt-promise');
const config_feature = require('../config/SiteConfig.json');
const { getClientAppBrandingByClientId } = require('../services/client.service');
const { getDiwoClientAppBrandingByClientId, getAllSubChildClientIds } = require('../services/client.service');

///////////////////////////////////////////// PWA LOGIN OTP GENERATION /////////////////////////////////////////

//PassWord Reset Link
const triggerLearnerResetPassWordLink = async function (userId, clientId, type, tokenexpiry, comingFrom) {
	try {
		let userEmail;
		let client;
		let getUser;
		let err;

		let whereUserCondition = {
			id: userId,
			status: true,
			is_deleted: false,
			cStatus: 'Active',
		};

		if (type == 'drip') {
			whereUserCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereUserCondition.forDiwo = true;
		}

		[err, getUser] = await to(
			User.findOne({
				where: whereUserCondition,
				attributes: ['MarketId', 'local_user_id', 'type'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userDetail = getUser.convertToJSON();
		let localUser;

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'email'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (localUser) {
			userEmail = [localUser.email];
			userDetail.first = localUser.first;
		}

		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let whereCondition = {
			UserId: userId,
			ClientId: clientId,
			RoleId: 1,
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		console.log('-whereCondition-', whereCondition);
		console.log('-tokenexpiry-', tokenexpiry);
		let checkCombination;

		[err, checkCombination] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [{ model: User }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let token = checkCombination.User.getJWT(1, clientId, type, tokenexpiry);
		if (userDetail && userEmail && client) {
			let client_ = client.convertToJSON();
			let personalisations = {};
			let emailData = [];
			let host_name = CONFIG.drip_host;
			if (type == 'drip') {
				host_name = CONFIG.drip_host;
			} else if (type == 'diwo') {
				host_name = CONFIG.diwo_host;
			}

			let pageMode = '';

			if (comingFrom == 'forgotPassword') {
				pageMode = 'Reset';
			} else if (comingFrom == 'resetLockout' || comingFrom == 'resetLockout Admin unlock Learner account') {
				pageMode = 'Reset';
			} else {
				pageMode = 'Create';
			}

			let redirct_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;
			for (let email of userEmail) {
				personalisations.to = email;
			
				if (personalisations.to != '') {
					if (comingFrom === 'resetLockout') {
						let emailSignatureText = '';
						let redirct_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;
			
						if (type === 'diwo') {
							const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
							emailSignatureText = appBrandingData.EmailSignatureText;
			
							personalisations.dynamic_template_data = {
								Reset_Password: redirct_url,
								first_name: userDetail.first,
								Signature: emailSignatureText
							};
							emailData.push(personalisations);
			
						} else if (type === 'drip') {
							const appBrandingData = await getClientAppBrandingByClientId(clientId);
							emailSignatureText = appBrandingData.EmailSignatureText;
			
							console.log('redirct_url', redirct_url);
							console.log('first_name', userDetail.first);
							console.log('Signature', emailSignatureText);
			
							personalisations.dynamic_template_data = {
								reset_password: redirct_url,
								first_name: userDetail.first,
								Signature: emailSignatureText
							};
							emailData.push(personalisations);
						}
					}
					else if(comingFrom === 'resetLockout Admin unlock Learner account') {
						let emailSignatureText = '';
						let redirct_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;
			
						if (type === 'diwo') {
							const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
							emailSignatureText = appBrandingData.EmailSignatureText;
			
							personalisations.dynamic_template_data = {
								create_password: redirct_url,
								First_Name: userDetail.first,
								Signature: emailSignatureText
							};
							emailData.push(personalisations);
			
						} else if (type === 'drip') {
							const appBrandingData = await getClientAppBrandingByClientId(clientId);
							emailSignatureText = appBrandingData.EmailSignatureText;
			
							console.log('redirct_url', redirct_url);
							console.log('first_name', userDetail.first);
							console.log('Signature', emailSignatureText);
			
							personalisations.dynamic_template_data = {
								create_password: redirct_url,
								First_name: userDetail.first,
								Signature: emailSignatureText
							};
							emailData.push(personalisations);
						}
					}
					else if (comingFrom === 'forgotPassword' && type === 'drip') {
						personalisations.dynamic_template_data = {
							reset_password: redirct_url,
							first_name: userDetail.first,
							Client_Name: client_.name
						};
						emailData.push(personalisations);
					}else if (comingFrom === 'forgotPassword' && type === 'diwo') {

						let emailSignatureText = '';
						const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							Reset_Password: redirct_url,
							first_name: userDetail.first,
							Client_Name: client_.name,
							Signature: emailSignatureText,
							userType: userDetail.type
						};
						emailData.push(personalisations); 									
					}else {
						// Any other general case except resetLockout and forgotPassword with drip
						personalisations.dynamic_template_data = {
							create_password: redirct_url,
							First_Name: userDetail.first,
							Client_Name: client_.name
						};
						emailData.push(personalisations);
					}
				}
			}
			
			console.log('--emailData-', emailData);
			

			if (comingFrom == 'forgotPassword' && type == 'diwo' && userDetail.type === 'Admin') {
				sendAdminForgotPasswordEmail(emailData);
			} 
			else if (comingFrom == 'resetLockout Admin unlock Learner account'){
				sendResetLockoutEmailToLearnerAsAdminUnlockAccount(emailData)
			}
			else if(comingFrom == 'forgotPassword' && type == 'diwo' && userDetail.type !== 'Admin'){				
				sendForgotPasswordEmail(emailData);
			}
			else if (comingFrom == 'resetLockout' && type == 'drip') {
				sendResetLockoutEmailForDrip(emailData);
			} else if (comingFrom == 'resetLockout' && type == 'diwo') {
				sendResetLockoutEmail(emailData);
			} else if (comingFrom == 'forgotPassword' && type == 'drip') {
				sendPasswordResetEmailForDrip(emailData);
			} 			
			else {
				sendPasswordResetEmail(emailData);
			}
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Reset Password Email--', error);
		return;
	}
};
module.exports.triggerLearnerResetPassWordLink = triggerLearnerResetPassWordLink;

const generatePWAOtp = async function (userInfo, type, req) {
	try {
		let err, markets;
		let user_role;
		let session;

		let medium = {
			isDeleted: false,
			status: true,
			email: null,
			phone: null,
			username: null,
		};
		let userAllPersnalDatas = [];
		let localUserIds = [];
		let userGlobalDataDetail;

		if (userInfo.otp) {
			let salt;
			let hash;
			[err, salt] = await to(bcrypt.genSalt(10));
			if (err) ThrowException(err.message);
			[err, hash] = await to(bcrypt.hash(userInfo.otp, salt));
			if (err) ThrowException(err.message);
			userInfo.otp = hash;
		} else {
			return ThrowException(MESSAGE.SOMTHING_WENT_WRONG);
		}

		if (userInfo.email) {
			medium.email = userInfo.email.toLowerCase();
			delete medium.phone;
			delete medium.username;
		} else if (userInfo.phone) {
			medium.phone = userInfo.phone;
			delete medium.email;
			delete medium.username;
		} else {
			medium.username = userInfo.username.toLowerCase();
			delete medium.email;
			delete medium.phone;
		}

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

		if (err || !markets) {
			return ThrowException(MESSAGE.MARKET_NOT_AVAILABLE);
		}

		[err, userAllPersnalDatas] = await to(
			dbInstance[markets.db_name].User_master.findAll({
				where: medium,
				order: [['id', 'DESC']],
			})
		);

		if (err) ThrowException(err.message);

		if (userAllPersnalDatas.length > 0) {
			for (let localUser of userAllPersnalDatas) {
				localUserIds.push(localUser.id);
			}
		} else {
			if (type == 'drip') {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			} else if (type == 'diwo') {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
		}

		///For Drip Login Machanism For PWA
		if (type == 'drip') {
			if (userAllPersnalDatas.length == 0) {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
				return;
			}

			[err, userGlobalDataDetail] = await to(
				User.findOne({
					where: {
						local_user_id: localUserIds,
						MarketId: markets.id,
						forDrip: true,
						cStatus: 'Active',
					},
					attributes: ['id', 'local_user_id', 'MarketId', 'failed_attempts', 'isLockout'],
					order: [['id', 'DESC']],
				})
			);

			if (userGlobalDataDetail) {
				if (config_feature?.configurable_feature?.pwa_password) {
					if (userGlobalDataDetail.isLockout) {
						ThrowException(MESSAGE.ACCOUNT_LOCKED);
					}
				}

				[err, user_role] = await to(
					User_role_client_mapping.findOne({
						where: {
							RoleId: 1,
							UserId: userGlobalDataDetail.id,
							forDrip: true,
						},
						include: [
							{
								model: Client,
								where: {
									status: 'Active',
									is_deleted: false,
								},
							},
						],
					})
				);
				if (err) ThrowException(err.message);

				if (!user_role) {
					ThrowException(MESSAGE.NOT_LEARNER_USER);
				}

				///////////////////////////////////// Drip Check Password START ////////////////////////////////////////////////////

				if (config_feature?.configurable_feature?.pwa_password) {
					if (userAllPersnalDatas.length > 0) {
						let isMatched = false;
						for (let user of userAllPersnalDatas) {
							if (user.id === userGlobalDataDetail.local_user_id) {
								if (user.password && user.password != null) {
									const isMatch = await comparePassword(userInfo.password, user.password);

									if (isMatch) {
										console.log('------Password Matched!-----');
										isMatched = true;
										break;
									} else {
										console.log('------Password NoT Matched!-----');
									}
								}
							}
						}
						if (!isMatched) {
							// Increment failed attempts

							const newFailedAttempts = userGlobalDataDetail.failed_attempts + 1;

							[err, updateUser] = await to(
								User.update({ failed_attempts: newFailedAttempts }, { where: { id: userGlobalDataDetail.id } })
							);

							// Check if the user should be locked
							if (newFailedAttempts >= config_feature.configurable_feature.pwa_lockout_attempts) {
								[err, updateUser] = await to(
									User.update({ isLockout: true }, { where: { id: userGlobalDataDetail.id } })
								);

								[err, newLog] = await to(
									createlog(userGlobalDataDetail.id, null, 1, `User Lockout PWA`, req.ip, req.useragent, type, {
										LockoutAttempt: newFailedAttempts,
									})
								);
								if (err) return ResponseError(res, err, 500, true);

								ThrowException(MESSAGE.ACCOUNT_LOCKED);
							}

							ThrowException(MESSAGE.PASSWORD_MISMATCH_ERROR);
						}
					}
				}

				///////////////////////////////////// Drip Check Password END ////////////////////////////////////////////////////

				//Update OTP
				[err, updateOTP] = await to(
					dbInstance[markets.db_name].User_master.update(
						{
							otp: userInfo.otp,
						},
						{
							where: {
								id: userGlobalDataDetail.local_user_id,
							},
						}
					)
				);
				if (err) ThrowException(err.message);

				let userData;
				for (let persnalData of userAllPersnalDatas) {
					if (persnalData.id === userGlobalDataDetail.local_user_id) {
						userData = persnalData.convertToJSON();
					}
				}

				userData.otp = userInfo.otp;
				userData.status = true;
				userData.clientId = user_role && user_role.ClientId ? user_role.ClientId : null;
				return userData;
			} else {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
		} else if (type == 'diwo') {
			//For Diwo Login Machanism For PWA

			let localUserId;
			[err, userGlobalDataDetail] = await to(
				User.findAll({
					where: {
						local_user_id: localUserIds,
						MarketId: markets.id,
						forDiwo: true,
						cStatus: 'Active',
					},
					attributes: ['id', 'local_user_id', 'MarketId', 'failed_attempts', 'isLockout'],
					order: [['id', 'DESC']],
				})
			);
			if (err) ThrowException(err.message);

			if (config_feature?.configurable_feature?.pwa_password) {
				if (userGlobalDataDetail.length > 0 && userGlobalDataDetail[0].isLockout) {
					ThrowException(MESSAGE.ACCOUNT_LOCKED);
				}
			}

			///////////////////////////////////// Diwo Check Password START ////////////////////////////////////////////////////

			if (config_feature?.configurable_feature?.pwa_password) {
				if (userAllPersnalDatas.length > 0) {
					let isMatched = false;
					for (let localuser of userAllPersnalDatas) {
						for (let user of userGlobalDataDetail) {
							if (localuser.id === user.local_user_id) {
								if (localuser.password && localuser.password != null) {
									const isMatch = await comparePassword(userInfo.password, localuser.password);

									if (isMatch) {
										console.log('------Password Matched!-----');
										isMatched = true;
										break;
									} else {
										console.log('------Password NoT Matched!-----');
									}
								}
							}
						}
					}
					if (!isMatched) {
						// Increment failed attempts

						const newFailedAttempts = userGlobalDataDetail[0].failed_attempts + 1;

						[err, updateUser] = await to(
							User.update({ failed_attempts: newFailedAttempts }, { where: { id: userGlobalDataDetail[0].id } })
						);

						// Check if the user should be locked
						if (newFailedAttempts >= config_feature.configurable_feature.pwa_lockout_attempts) {
							[err, updateUser] = await to(
								User.update({ isLockout: true }, { where: { id: userGlobalDataDetail[0].id } })
							);

							[err, newLog] = await to(
								createlog(userGlobalDataDetail[0].id, null, 1, `User Lockout PWA`, req.ip, req.useragent, type, {
									LockoutAttempt: newFailedAttempts,
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							ThrowException(MESSAGE.ACCOUNT_LOCKED);
						}

						ThrowException(MESSAGE.PASSWORD_MISMATCH_ERROR);
					}
				}
			}

			///////////////////////////////////// Diwo Check Password END ////////////////////////////////////////////////////

			if (userInfo && userInfo.sessioncode) {
				let userIds = [];
				[err, session] = await to(
					Session.findOne({
						where: {
							code: userInfo.sessioncode,
						},
						include: [{ model: Client }],
					})
				);
				if (err) ThrowException(err.message);

				if (!session) {
					ThrowException(MESSAGE.INVALID_SESSION_CODE);
				}

				if (userGlobalDataDetail.length > 0) {
					localUserId = userGlobalDataDetail[0].local_user_id;
					for (let user of userGlobalDataDetail) {
						userIds.push(user.id);
					}
				}
			} else if (userGlobalDataDetail.length > 0) {
				userGlobalDataDetail = userGlobalDataDetail[0];
				localUserId = userGlobalDataDetail.local_user_id;
			} else {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}

			[err, updateOTP] = await to(
				dbInstance[markets.db_name].User_master.update(
					{
						otp: userInfo.otp,
					},
					{
						where: {
							id: localUserId,
						},
					}
				)
			);
			if (err) ThrowException(err.message);

			let userData;

			for (let persnalData of userAllPersnalDatas) {
				if (persnalData.id === localUserId) {
					userData = persnalData.convertToJSON();
				}
			}
			userData.otp = userInfo.otp;
			userData.status = true;
			userData.clientId = user_role && user_role.ClientId ? user_role.ClientId : null;
			userData.UserId = userGlobalDataDetail ? userGlobalDataDetail.id : null;
			return userData;
		}
	} catch (error) {
		throw error;
	}
};
module.exports.generatePWAOtp = generatePWAOtp;

const pwaValidateUser = async function (userInfo, type, req) {
	try {
		let err;
		let localUserData;
		let globalUsers = [];
		let userAllPersnalDatas = [];

		let medium = {
			isDeleted: false,
			status: true,
			email: null,
			phone: null,
			username: null,
		};

		if (userInfo.email) {
			medium.email = userInfo.email.toLowerCase();
			delete medium.phone;
			delete medium.username;
		} else if (userInfo.phone) {
			medium.phone = userInfo.phone;
			delete medium.email;
			delete medium.username;
		} else {
			medium.username = userInfo.username.toLowerCase();
			delete medium.email;
			delete medium.phone;
		}

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
				attributes: ['id', 'db_name'],
			})
		);
		if (err) {
			return ThrowException(MESSAGE.MARKET_NOT_FIND);
		}

		// let err, user;
		[err, userAllPersnalDatas] = await to(
			dbInstance[markets.db_name].User_master.findAll({
				where: medium,
				order: [['id', 'DESC']],
			})
		);
		if (err) {
			ThrowException(MESSAGE.USER_NOT_ACTIVE);
		}
		if (userAllPersnalDatas.length == 0) {
			ThrowException(MESSAGE.USER_NOT_REGISTERED);
		}

		let localUserIds = [];
		for (let data of userAllPersnalDatas) {
			localUserIds.push(data.id);
		}

		if (type === 'drip') {
			[err, globalUsers] = await to(
				User.findAll({
					where: {
						local_user_id: localUserIds,
						MarketId: markets.id,
						forDrip: true,
						cStatus: 'Active',
					},
					attributes: [
						'id',
						'local_user_id',
						'MarketId',
						'is_verified',
						'firstLogin',
						'lastLogin',
						'failed_attempts',
						'isLockout',
					],
					order: [['id', 'DESC']],
				})
			);
			if (err) {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
		} else if (type === 'diwo') {
			[err, globalUsers] = await to(
				User.findAll({
					where: {
						local_user_id: localUserIds,
						MarketId: markets.id,
						forDiwo: true,
						cStatus: 'Active',
					},
					attributes: [
						'id',
						'local_user_id',
						'MarketId',
						'is_verified',
						'firstLogin',
						'lastLogin',
						'failed_attempts',
						'isLockout',
					],
					order: [['id', 'DESC']],
				})
			);
			if (err) {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
		}

		if (globalUsers.length > 0) {
			for (let localData of userAllPersnalDatas) {
				if (localData.id == globalUsers[0].local_user_id) {
					localUserData = localData;
					break;
				}
			}
		} else {
			if (err) {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
		}

		if (config_feature?.configurable_feature?.pwa_otp) {
			if (userInfo.email == CONFIG.devops_tester_user_email && userInfo.otp == CONFIG.devops_tester_user_otp) {
				return {
					localUser: localUserData,
					globalUser: [globalUsers[0].id],
				};
			} else if (userInfo.phone == CONFIG.devops_tester_user_phone && userInfo.otp == CONFIG.devops_tester_user_otp) {
				return {
					localUser: localUserData,
					globalUser: [globalUsers.id],
				};
			}

			[err, user] = await to(localUserData.comparePassword(userInfo.otp));
			if (err) {
				ThrowException(MESSAGE.OTP_MISMATCH_ERROR);
			}
		}

		if (config_feature?.configurable_feature?.pwa_password && !config_feature?.configurable_feature?.pwa_otp) {
			if (globalUsers.length > 0 && globalUsers[0].isLockout) {
				ThrowException(MESSAGE.ACCOUNT_LOCKED);
			}
		}

		if (config_feature?.configurable_feature?.pwa_password && !config_feature?.configurable_feature?.pwa_otp) {
			if (userAllPersnalDatas.length > 0) {
				let isMatched = false;
				for (let localuser of userAllPersnalDatas) {
					for (let user of globalUsers) {
						if (localuser.id === user.local_user_id) {
							if (localuser.password && localuser.password != null) {
								const isMatch = await comparePassword(userInfo.password, localuser.password);
								if (isMatch) {
									console.log('------Password Matched!-----');
									isMatched = true;
									break;
								} else {
									console.log('------Password NoT Matched!-----');
								}
							}
						}
					}
				}
				if (!isMatched) {
					// Increment failed attempts

					const newFailedAttempts = globalUsers[0].failed_attempts + 1;

					[err, updateUser] = await to(
						User.update({ failed_attempts: newFailedAttempts }, { where: { id: globalUsers[0].id } })
					);

					// Check if the user should be locked
					if (newFailedAttempts >= config_feature.configurable_feature.pwa_lockout_attempts) {
						[err, updateUser] = await to(User.update({ isLockout: true }, { where: { id: globalUsers[0].id } }));

						// Have to add account lockout mail for 5 attempts

						if(type === 'diwo') {							
							[err, globalUsersMappingClientData] = await to(
								User_role_client_mapping.findOne({
									where: {
										UserId: globalUsers[0].id,
										forDiwo: true,
										RoleId: 1,
									},
									attributes: ['ClientId'],
								})
							);
							
							if (err) return ResponseError(res, err, 500, true);

							console.log('globalUsersMappingClientData in diwo', globalUsersMappingClientData.ClientId);						
								
							await triggerLearnerResetPassWordLink(
								globalUsers[0].id,
								globalUsersMappingClientData.ClientId,
								'diwo',
								CONFIG.jwt_expiration_reset_password_admin,
								'resetLockout'
							);
						}

						if(type === 'drip') {							
							[err, globalUsersMappingClientData] = await to(
								User_role_client_mapping.findOne({
									where: {
										UserId: globalUsers[0].id,
										forDrip: true,
										RoleId: 1,
									},
									attributes: ['ClientId'],
								})
							);
							
							if (err) return ResponseError(res, err, 500, true);

							console.log('globalUsersMappingClientData in drip', globalUsersMappingClientData.ClientId);						
								
							await triggerLearnerResetPassWordLink(
								globalUsers[0].id,
								globalUsersMappingClientData.ClientId,
								'drip',
								CONFIG.jwt_expiration_reset_password_admin,
								'resetLockout'
							);
						}
						
						//End of account lockout mail for 5 attempts

						[err, newLog] = await to(
							createlog(globalUsers[0].id, null, 1, `User Lockout PWA`, req.ip, req.useragent, type, {
								LockoutAttempt: newFailedAttempts,
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						ThrowException(MESSAGE.ACCOUNT_LOCKED);
					}

					ThrowException(MESSAGE.PASSWORD_MISMATCH_ERROR);
				}
			}
		}

		let userIds = [];
		for (let userId of globalUsers) {
			userIds.push(userId.id);
		}

		return userIds;
	} catch (error) {
		console.log('---Error PWA Validate User---', error);
		throw error;
	}
};
module.exports.pwaValidateUser = pwaValidateUser;

/////////////////////////////////////////////  WEB  LOGIN OTP GENERATION  /////////////////////////////////////////

//admin user passWord Reset Link
const triggerAdminUserResetPassWordLink = async function (userId, clientId, type, tokenexpiry, comingFrom) {
	try {
		let userEmail;
		let client;
		let getUser;
		let err;

		let whereUserCondition = {
			id: userId,
			status: true,
			is_deleted: false,
			cStatus: 'Active',
		};

		if (type == 'drip') {
			whereUserCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereUserCondition.forDiwo = true;
		}

		[err, getUser] = await to(
			User.findOne({
				where: whereUserCondition,
				attributes: ['MarketId', 'local_user_id', 'type'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) {
			console.log('--Error When get user for admin reset link-', err);
			ThrowException(err.message);
		}

		let userDetail = getUser.convertToJSON();
		let localUser;

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'email'],
			})
		);
		if (err) {
			console.log('--Error When get local user for admin reset link-', err);
			ThrowException(err.message);
		}

		if (localUser) {
			userEmail = [localUser.email];
			userDetail.first = localUser.first;			 
		}

		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['name'],
			})
		);
		if (err) {
			console.log('--Error When get client for admin reset link-', err);
			ThrowException(err.message);
		}

		let whereCondition = {
			UserId: userId,
			ClientId: clientId,
			RoleId: {
				[Op.ne]: 1,
			},
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		console.log('-whereCondition-', whereCondition);
		console.log('-tokenexpiry-', tokenexpiry);
		let checkCombination;

		[err, checkCombination] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [{ model: User }],
			})
		);
		if (err) {
			console.log('--Error When get user role client mapping for admin reset link-', err);
			ThrowException(err.message);
		}

		let token = checkCombination.User.getJWT(1, clientId, type, tokenexpiry);
		if (userDetail && userEmail && client) {
			let client_ = client.convertToJSON();
			let personalisations = {};
			let emailData = [];
			let host_name = CONFIG.drip_web_host;
			if (type == 'drip') {
				host_name = CONFIG.drip_web_host;
			} else if (type == 'diwo') {
				host_name = CONFIG.diwo_web_host;
			}

			let pageMode = '';

			if (comingFrom == 'forgotPassword') {
				pageMode = 'Reset';
			} else if (comingFrom == 'resetLockout') {
				pageMode = 'Reset';
			} else {
				pageMode = 'Create';
			}

			let redirct_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;

			for (let email of userEmail) {
				personalisations.to = email;
				if (personalisations.to != '') {

					if(comingFrom === 'forgotPassword' && type === 'diwo'){
						let emailSignatureText = '';
						const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							Reset_Password: redirct_url,
							first_name: userDetail.first,
							Client_Name: client_.name,
							Signature: emailSignatureText,							
						};
						emailData.push(personalisations);
					}
					else if(comingFrom === 'forgotPassword' && type === 'drip'){
						let emailSignatureText = '';
						const appBrandingData = await getClientAppBrandingByClientId(clientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							Reset_Password: redirct_url,
							first_name: userDetail.first,
							Client_Name: client_.name,
							Signature: emailSignatureText,							
						};
						emailData.push(personalisations);
					}
					else if(comingFrom === 'resetLockout' && type === 'diwo'){
						let emailSignatureText = '';
						const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							Reset_Password: redirct_url,
							first_name: userDetail.first,
							// Client_Name: client_.name,
							Signature: emailSignatureText
						};
						emailData.push(personalisations);
					}

					else if(comingFrom === 'adminUserAdded' && type === 'diwo' && config_feature?.configurable_feature?.web_password){
						let emailSignatureText = '';
						const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							create_password: redirct_url,
							first_name: userDetail.first,
							client_name: client_.name,
							Signature: emailSignatureText
						};
						emailData.push(personalisations);
					}
					else {
						personalisations.dynamic_template_data = {
							create_password: redirct_url,
							First_Name: userDetail.first,
							Client_Name: client_.name,
						};
						emailData.push(personalisations);
					}					
				}				
			}
			console.log('--emailData-', emailData);

			console.log('--userDetail.type-', userDetail.type);

			if (comingFrom == 'forgotPassword' && userDetail.type !== 'Admin') {
				sendForgotPasswordEmail(emailData);
			}else if (comingFrom == 'forgotPassword' && userDetail.type === 'Admin') {
				sendAdminForgotPasswordEmail(emailData);
			}
			else if (comingFrom == 'resetLockout' && userDetail.type !== 'Admin') {
				sendResetLockoutEmail(emailData);
			}else if (comingFrom == 'resetLockout' && userDetail.type === 'Admin'){
				sendResetLockoutEmailToAdmin(emailData);
			}
			else if (comingFrom == 'adminUserAdded' && userDetail.type === 'Admin'){
				sendCreatePasswordEmailToAdmin(emailData);
			} else {
				sendPasswordResetEmail(emailData);
			}
						
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Reset Password Email--', error);
		return;
	}
};
module.exports.triggerAdminUserResetPassWordLink = triggerAdminUserResetPassWordLink;


//admin user Create Password Link
const triggerAdminUserCreatePassWordLink = async function (userId, ClientsDetails, type, tokenexpiry, comingFrom) {
	try {
		let userEmail;
		let client;
		let getUser;
		let err;

		let whereUserCondition = {
			id: userId,
			status: true,
			is_deleted: false,
			cStatus: 'Active',
		};

		if (type == 'drip') {
			whereUserCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereUserCondition.forDiwo = true;
		}

		[err, getUser] = await to(
			User.findOne({
				where: whereUserCondition,
				attributes: ['MarketId', 'local_user_id', 'type'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) {
			console.log('--Error When get user for admin reset link-', err);
			ThrowException(err.message);
		}

		let userDetail = getUser.convertToJSON();
		let localUser;

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'email'],
			})
		);
		if (err) {
			console.log('--Error When get local user for admin reset link-', err);
			ThrowException(err.message);
		}

		if (localUser) {
			userEmail = [localUser.email];
			userDetail.first = localUser.first;			 
		}

		// Set the Client_name's  Workspace as role
		const formattedClientRoleInfo = ClientsDetails.map(client => {
			const roleText = Array.isArray(client.roles) ? client.roles.join(', ') : client.roles;
			return `${client.name}'s workspace as a ${roleText}`;
		}).join('<br>');
		
		client_name = formattedClientRoleInfo; 

		// End of Client_name's  Workspace as role

		console.log('formattedClientRoleInfo', client_name);
		
		// Pick First Client who had EmailSignature		
		let selectedClientId = null;
		let emailSignatureText = null;
		let ClientId = null;

		for (let validClientSignature of ClientsDetails) {
			let clientId = validClientSignature.id;
			ClientId = clientId; // track the last client id

			let appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);

			console.log('appBrandingData', appBrandingData);

			if (appBrandingData?.EmailSignatureText) {
				emailSignatureText = appBrandingData.EmailSignatureText;
				selectedClientId = clientId;
				break; // exit early if we got what we wanted
			}
		}

		// Fallback if no EmailSignatureText was found
		if (!selectedClientId) {
		selectedClientId = ClientId;
		}

		// Got the Client who had EmailSignature
		console.log('selectedClientId', selectedClientId);

		[err, client] = await to(
			Client.findAll({
				where: {
					id: selectedClientId,
				},
				attributes: ['name'],
			})
		);
		if (err) {
			console.log('--Error When get client for admin reset link-', err);
			ThrowException(err.message);
		}

		let whereCondition = {
			UserId: userId,
			ClientId: selectedClientId,
			RoleId: {
				[Op.ne]: 1,
			},
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		console.log('-whereCondition-', whereCondition);
		console.log('-tokenexpiry-', tokenexpiry);
		let checkCombination;

		[err, checkCombination] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [{ model: User }],
			})
		);
		if (err) {
			console.log('--Error When get user role client mapping for admin reset link-', err);
			ThrowException(err.message);
		}

		let token = checkCombination.User.getJWT(1, selectedClientId, type, tokenexpiry);

		if (userDetail && userEmail && selectedClientId) {
			let client_ = selectedClientId && typeof selectedClientId === 'object' && typeof selectedClientId.convertToJSON === 'function' 
						? selectedClientId.convertToJSON() : selectedClientId;
			let personalisations = {};
			let emailData = [];
			let host_name = CONFIG.drip_web_host;
			if (type == 'drip') {
				host_name = CONFIG.drip_web_host;
			} else if (type == 'diwo') {
				host_name = CONFIG.diwo_web_host;
			}

			let pageMode = '';

			if (comingFrom == 'forgotPassword') {
				pageMode = 'Reset';
			} else if (comingFrom == 'resetLockout') {
				pageMode = 'Reset';
			} else {
				pageMode = 'Create';
			}

			let redirct_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;

			for (let email of userEmail) {
				personalisations.to = email;
				if (personalisations.to != '') {

					// if(comingFrom === 'forgotPassword' && type === 'diwo'){
					// 	let emailSignatureText = '';
					// 	const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
					// 	emailSignatureText = appBrandingData.EmailSignatureText;

					// 	personalisations.dynamic_template_data = {
					// 		Reset_Password: redirct_url,
					// 		first_name: userDetail.first,
					// 		Client_Name: client_.name,
					// 		Signature: emailSignatureText
					// 	};
					// 	emailData.push(personalisations);
					// }
					// else if(comingFrom === 'resetLockout' && type === 'diwo'){
					// 	let emailSignatureText = '';
					// 	const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
					// 	emailSignatureText = appBrandingData.EmailSignatureText;

					// 	personalisations.dynamic_template_data = {
					// 		Reset_Password: redirct_url,
					// 		first_name: userDetail.first,
					// 		// Client_Name: client_.name,
					// 		Signature: emailSignatureText
					// 	};
					// 	emailData.push(personalisations);
					// }

					if(comingFrom === 'adminUserAdded' && type === 'diwo' && config_feature?.configurable_feature?.web_password){
						let emailSignatureText = '';
						const appBrandingData = await getDiwoClientAppBrandingByClientId(selectedClientId);
						emailSignatureText = appBrandingData.EmailSignatureText;

						personalisations.dynamic_template_data = {
							create_password: redirct_url,
							first_name: userDetail.first,
							client_name: client_name,
							Signature: emailSignatureText || ''
						};
						emailData.push(personalisations);
					}
					else {
						personalisations.dynamic_template_data = {
							create_password: redirct_url,
							First_Name: userDetail.first,
							Client_Name: client_.name,
						};
						emailData.push(personalisations);
					}					
				}				
			}
			console.log('--emailData-', emailData);

			// if (comingFrom == 'forgotPassword') {
			// 	sendForgotPasswordEmail(emailData);
			// } else if (comingFrom == 'resetLockout') {
			// 	sendResetLockoutEmail(emailData);
			// }else if (comingFrom == 'resetLockout' && userDetail.type === 'Admin'){
			// 	sendResetLockoutEmailToAdmin(emailData);
			// }
			if (comingFrom == 'adminUserAdded' && userDetail.type === 'Admin'){
				sendCreatePasswordEmailToAdmin(emailData);
			} else {
				sendPasswordResetEmail(emailData);
			}
						
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Reset Password Email--', error);
		return;
	}
};
module.exports.triggerAdminUserCreatePassWordLink = triggerAdminUserCreatePassWordLink;

//OTP Generation For Web Login
const genarateWEBOtp = async (userInfo, type) => {
	try {
		let auth_info, err, medium, markets;
		let status;
		let user;
		let user_role;
		auth_info = {};
		auth_info.status = 'updated';

		if (userInfo.otp) {
			let salt;
			let hash;
			[err, salt] = await to(bcrypt.genSalt(10));
			if (err) ThrowException(err.message);
			[err, hash] = await to(bcrypt.hash(userInfo.otp, salt));
			if (err) ThrowException(err.message);
			userInfo.otp = hash;
		}
		if (!userInfo.phone) {
			medium = {
				email: userInfo.email.toLowerCase(),
			};
		} else {
			medium = {
				phone: userInfo.phone,
			};
		}
		medium.isDeleted = false;

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
			return ThrowException(MESSAGE.MARKET_NOT_AVAILABLE);
		}

		[err, userDetails] = await to(
			dbInstance[markets.db_name].User_master.findOne({
				where: {
					...medium,
					status: true,
					type: 'Admin',
				},
			})
		);

		if (err) {
			ThrowException(MESSAGE.USER_NOT_REGISTERED);
		}

		if (!userDetails) {
			ThrowException(MESSAGE.USER_NOT_REGISTERED);
		}

		if (userDetails) {
			if (type == 'drip') {
				[err, user] = await to(
					User.findOne({
						where: {
							local_user_id: userDetails.id,
							MarketId: markets.id,
							forDrip: true,
						},
					})
				);
			} else if (type == 'diwo') {
				[err, user] = await to(
					User.findOne({
						where: {
							local_user_id: userDetails.id,
							MarketId: markets.id,
							forDiwo: true,
						},
					})
				);
			}

			if (user && user.cStatus != 'Active') {
				ThrowException(MESSAGE.USER_NOT_ACTIVE);
			} else if (!user) {
				ThrowException(MESSAGE.USER_NOT_REGISTERED);
			}
			status = user.status;
		}

		if (config_feature?.configurable_feature?.web_password) {
			if (user.isLockout) {
				ThrowException(MESSAGE.ACCOUNT_LOCKED);
			}
		}

		if (type == 'drip') {
			[err, user_role] = await to(
				User_role_client_mapping.findOne({
					where: {
						RoleId: {
							[Op.ne]: 1,
						},
						UserId: user.id,
						forDrip: true,
					},
					include: [
						{
							model: Client,
							where: {
								status: 'Active',
								is_deleted: false,
							},
						},
					],
				})
			);
			if (err) ThrowException(err.message);
		} else if (type == 'diwo') {
			[err, user_role] = await to(
				User_role_client_mapping.findOne({
					where: {
						RoleId: {
							[Op.ne]: 1,
						},
						UserId: user.id,
						forDiwo: true,
					},
					include: [
						{
							model: Client,
							where: {
								status: 'Active',
								is_deleted: false,
							},
						},
					],
				})
			);
			if (err) ThrowException(err.message);
		}

		if (!user_role) {
			ThrowException(MESSAGE.USER_NOT_REGISTERED);
		}

		///////////////////////////////////// Check Password START ////////////////////////////////////////////////////

		if (config_feature?.configurable_feature?.web_password) {
			if (userDetails) {
				let isMatched = false;
				if (user.local_user_id === userDetails.id) {
					if (userDetails.password && userDetails.password != null) {
						const isMatch = await comparePassword(userInfo.password, userDetails.password);

						if (isMatch) {
							console.log('------Password Matched!-----');
							isMatched = true;
						} else {
							console.log('------Password NoT Matched!-----');
						}
					}
				}
				if (!isMatched) {
					// Increment failed attempts
					const newFailedAttempts = user.failed_attempts + 1;

					[err, updateUser] = await to(User.update({ failed_attempts: newFailedAttempts }, { where: { id: user.id } }));

					// Check if the user should be locked
					if (newFailedAttempts >= config_feature.configurable_feature.web_lockout_attempts) {
						[err, updateUser] = await to(User.update({ isLockout: true }, { where: { id: user.id } }));

						[err, newLog] = await to(
							createlog(user.id, null, 1, `User Lockout Web`, req.ip, req.useragent, type, {
								LockoutAttempt: newFailedAttempts,
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						ThrowException(MESSAGE.ACCOUNT_LOCKED);
					}

					ThrowException(MESSAGE.PASSWORD_MISMATCH_ERROR);
				}
			}
		}

		///////////////////////////////////// Check Password END ////////////////////////////////////////////////////

		if (userDetails) {
			[err, user] = await to(
				dbInstance[markets.db_name].User_master.update(
					{
						otp: userInfo.otp,
					},
					{
						where: {
							...medium,
							type: 'Admin',
						},
					}
				)
			);

			if (err) ThrowException(err.message);

			let UserDetails = userDetails.convertToJSON();
			UserDetails.status = status;
			return UserDetails;
		} else {
			ThrowException(MESSAGE.USER_NOT_REGISTERED);
		}
	} catch (error) {
		throw error;
	}
};
module.exports.genarateWEBOtp = genarateWEBOtp;

const webValidateUser = async function (userInfo, req) {
	try {
		let medium, globalUser, err;
		if (!userInfo.phone) {
			medium = {
				email: userInfo.email.toLowerCase(),
			};
		} else {
			medium = {
				phone: userInfo.phone,
			};
		}

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
			return ThrowException(MESSAGE.MARKET_NOT_FIND);
		}

		// let err, user;
		[err, user] = await to(
			dbInstance[markets.db_name].User_master.findOne({
				where: {
					...medium,
					status: true,
					type: 'Admin',
				},
			})
		);

		if (err) ThrowException(MESSAGE.USER_NOT_ACTIVE);
		if (!user) ThrowException(MESSAGE.USER_NOT_REGISTERED);

		user.Market = markets;

		[err, globalUser] = await to(
			User.findOne({
				where: {
					local_user_id: user.id,
					MarketId: markets.id,
				},
				include: [
					{
						model: Client,
						include: ['System_branding', 'Client_Package'],
					},
					{
						model: Role,
					},
				],
			})
		);
		if (err) ThrowException(MESSAGE.USER_NOT_REGISTERED);

		if (config_feature?.configurable_feature?.web_otp) {
			if (userInfo.email == CONFIG.devops_tester_user_email && userInfo.otp == CONFIG.devops_tester_user_otp) {
				return {
					localUser: user,
					globalUser: globalUser,
					market: markets,
					client: globalUser.Clients,
				};
			} else if (userInfo.phone == CONFIG.devops_tester_user_phone && userInfo.otp == CONFIG.devops_tester_user_otp) {
				return {
					localUser: user,
					globalUser: globalUser,
					market: markets,
					client: globalUser.Clients,
				};
			}

			[err, user] = await to(user.comparePassword(userInfo.otp));
			if (err) ThrowException(MESSAGE.OTP_MISMATCH_ERROR);
		}

		if (config_feature?.configurable_feature?.web_password && !config_feature?.configurable_feature?.web_otp) {
			if (globalUser.isLockout) {
				ThrowException(MESSAGE.ACCOUNT_LOCKED);
			}
		}

		///////////////////////////////////// Check Password START ////////////////////////////////////////////////////

		if (config_feature?.configurable_feature?.web_password && !config_feature?.configurable_feature?.web_otp) {
			if (globalUser) {
				let isMatched = false;
				if (globalUser.local_user_id === user.id) {
					if (user.password && user.password != null) {
						const isMatch = await comparePassword(userInfo.password, user.password);

						if (isMatch) {
							console.log('------Password Matched!-----');
							isMatched = true;
						} else {
							console.log('------Password NoT Matched!-----');
						}
					}
				}
				if (!isMatched) {
					// Increment failed attempts
					const newFailedAttempts = globalUser.failed_attempts + 1;

					[err, updateUser] = await to(
						User.update({ failed_attempts: newFailedAttempts }, { where: { id: globalUser.id } })
					);

					// console.log('globalUser', globalUser);

					// Check if the user should be locked
					if (newFailedAttempts >= config_feature.configurable_feature.web_lockout_attempts) {
						[err, updateUser] = await to(User.update({ isLockout: true }, { where: { id: globalUser.id } }));


						// Have to add account lockout mail for 5 attempts

						console.log('globalUser.forDiwo', globalUser.forDiwo);

						if(globalUser.forDiwo) {
							
							[err, globalUsersMappingClientData] = await to(
								User_role_client_mapping.findAll({
									where: {
										UserId: globalUser.id,
										forDiwo: true,									
									},
									attributes: ['ClientId'],
								})
							);
							
							if (err) return ResponseError(res, err, 500, true);

							// console.log('globalUsersMappingClientData', globalUsersMappingClientData);	
																					
							let selectedClientId = null;
							let emailSignatureText = '';

							for (let globalUser of globalUsersMappingClientData) {
								let clientId = globalUser.ClientId;

								let appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);

								if (appBrandingData?.EmailSignatureText) {
									emailSignatureText = appBrandingData.EmailSignatureText;
									selectedClientId = clientId;
									break; 
								}
							}
															
							await triggerAdminUserResetPassWordLink(
								globalUser.id,
								selectedClientId,
								'diwo',
								CONFIG.jwt_expiration_reset_password_admin,
								'resetLockout'
							);
						}					
						
						//End of account lockout mail for 5 attempts

						const type = globalUser.forDiwo ? 'diwo' : globalUser.forDrip ? 'drip' : null;

						[err, newLog] = await to(
							createlog(globalUser.id, null, 1, `User Lockout Web`, req.ip, req.useragent, type, {
								LockoutAttempt: newFailedAttempts,
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						ThrowException(MESSAGE.ACCOUNT_LOCKED);
					}

					ThrowException(MESSAGE.PASSWORD_MISMATCH_ERROR);
				}
			}
		}

		///////////////////////////////////// Check Password END ////////////////////////////////////////////////////

		[err, isUpdated] = await to(
			globalUser.update({
				is_verified: true,
			})
		);
		if (err) console.log('is_verified update err', err);

		if (err) ThrowException(MESSAGE.INVALID_REQUEST);
		let users = {
			localUser: user,
			globalUser: globalUser,
			market: markets,
			client: globalUser.Clients,
		};
		return users;
	} catch (error) {
		throw error;
	}
};
module.exports.webValidateUser = webValidateUser;

async function comparePassword(pw, storedHash) {
	const [err, pass] = await to(bcrypt.compare(pw, storedHash));
	if (err) throw new Error(err);
	return pass;
}

const hashPassword = async function (password) {
	try {
		let salt = await bcrypt.genSalt(10);
		let hash = await bcrypt.hash(password, salt);
		return hash;
	} catch (err) {
		console.log(`Error generating or hashing password: ${err.message}`);
		return null;
	}
};
module.exports.hashPassword = hashPassword;

const generatePassword = async function (length = 12) {
	if (length < 8 || length > 64) {
		throw new Error('Password length must be between 8 and 64 characters');
	}

	const lower = 'abcdefghijklmnopqrstuvwxyz';
	const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numbers = '0123456789';
	const special = '!@#$%^&*()_+[]{}|;:,.<>?';

	const allChars = lower + upper + numbers + special;

	let password = [
		lower[Math.floor(Math.random() * lower.length)],
		upper[Math.floor(Math.random() * upper.length)],
		numbers[Math.floor(Math.random() * numbers.length)],
		special[Math.floor(Math.random() * special.length)],
	];

	for (let i = password.length; i < length; i++) {
		password.push(allChars[Math.floor(Math.random() * allChars.length)]);
	}

	// Shuffle the password to avoid predictable patterns
	password = password.sort(() => Math.random() - 0.5).join('');
	return password;
};
module.exports.generatePassword = generatePassword;
