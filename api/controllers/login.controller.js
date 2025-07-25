const {
	Market,
	Country,
	Op,
	Currency,
	Province,
	sequelize,
	Client,
	User,
	Role,
	User_role_client_mapping,
	User_job_role_mapping,
	Client_job_role,
	PolicyChangeLog,
	DiwoSystemBranding,
	ClientWhatsAppSetup,
	WhatsAppSetup,
	Session,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess, ThrowException } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const config_feature = require('../config/SiteConfig.json');
const { createNotification, createNotificationforDiwo } = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');

const {
	hashPassword,
	triggerLearnerResetPassWordLink,
	generatePWAOtp,
	pwaValidateUser,
	triggerAdminUserResetPassWordLink,
	genarateWEBOtp,
	webValidateUser,
} = require('../services/login.service');
const { sendMessage } = require('../services/message.service');
const { sendRegistrationMail, sendOTPMail, notificationEmail } = require('../services/mailer.service');
const { getClientAppBrandingByClientId } = require('../services/client.service');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const axios = require('axios');

const convertSpecialChar = function (text) {
	try {
		return text.replaceAll('%', '%25').replaceAll('+', '%2B');
	} catch (error) {
		console.log('---Error Convert Special Char---', error);
	}
};

//learner Reser password
const checklearnerResetPasswordTokenValidity = async function (req, res) {
	try {
		const schema = Joi.object({
			token: Joi.string().required(),
		});
		const { error, value } = schema.validate({
			token: req.body.token,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { token } = value;

		let decoded;
		if (token) {
			try {
				decoded = jwt.verify(token, CONFIG.jwt_encryption);
				return ResponseSuccess(res, { message: MESSAGE.VALID_TOKEN }, 200);
			} catch (err) {
				if (err.name === 'TokenExpiredError') {
					return ResponseError(res, { message: MESSAGE.TOKEN_EXPIRED }, 401);
				} else if (err.name === 'JsonWebTokenError') {
					return ResponseError(res, { message: MESSAGE.INVALID_TOKEN }, 401);
				} else {
					return ResponseError(res, { message: MESSAGE.TOKEN_VERIFICATION_FAIL }, 500);
				}
			}
		} else {
			return ResponseError(res, { message: MESSAGE.TOKEN_MISSING }, 400);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checklearnerResetPasswordTokenValidity = checklearnerResetPasswordTokenValidity;

const learnerResetPassword = async function (req, res) {
	try {
		const schema = Joi.object({
			token: Joi.string().required(),
			type: Joi.string().required(),
			pass: Joi.any().required(),
		});
		const { error, value } = schema.validate({
			token: req.body.token,
			type: req.body.type,
			pass: req.body.pass,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { token, type, pass } = value;

		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let decoded;
		if (token) {
			try {
				decoded = jwt.verify(token, CONFIG.jwt_encryption);
			} catch (err) {
				if (err.name === 'TokenExpiredError') {
					return ResponseError(res, { message: MESSAGE.TOKEN_EXPIRED }, 401);
				} else if (err.name === 'JsonWebTokenError') {
					return ResponseError(res, { message: MESSAGE.INVALID_TOKEN }, 401);
				} else {
					return ResponseError(res, { message: MESSAGE.TOKEN_VERIFICATION_FAIL }, 500);
				}
			}
		} else {
			return ResponseError(res, { message: MESSAGE.TOKEN_MISSING }, 400);
		}
		let userId = decoded.user_id;
		// let type = req.body.type;
		// let pass = req.body.pass;
		let getUser;
		let hashpass;
		let err;

		// console.log('--pass1--', pass);
		hashpass = await hashPassword(pass);
		// console.log('--pass2--', hashpass);
		// console.log('-req.user-', decoded);

		let whereCondition = {
			id: userId,
			status: true,
			is_deleted: false,
			cStatus: 'Active',
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		[err, getUser] = await to(
			User.findOne({
				where: whereCondition,
				attributes: ['MarketId', 'local_user_id'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, updateUser] = await to(User.update({ isLockout: false, failed_attempts: 0 }, { where: { id: userId } }));
		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			password: hashpass,
		};

		[err, updateLocalUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.update(payload, {
				where: {
					id: getUser.local_user_id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				decoded.user_id,
				decoded.ClientId,
				decoded.RoleId,
				`User Change PWA Password`,
				req.ip,
				req.useragent,
				decoded.type,
				null
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: MESSAGE.LEARNER_RESET_PASSWORD });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.learnerResetPassword = learnerResetPassword;

//learner forgot password
const learnerForgotPassword = async function (req, res) {
	try {
		const schema = Joi.object({
			email: Joi.string().email().optional(),
			phone: Joi.string().optional(),
			username: Joi.string().optional(),
			type: Joi.string().required(),
		});
		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const userInfo = value;

		if (!checkProjectNameByType(userInfo.type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		// const userInfo = req.body;
		const type = userInfo.type;
		let err, marketDetails, userAllPersonalData, getUser, localUser, getUserClient;
		let userFound = false;

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

		[err, marketDetails] = await to(
			Market.findAll({
				where: { status: true },
				attributes: ['db_name', 'id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (marketDetails && marketDetails.length > 0) {
			for (const market of marketDetails) {
				const marketUser = market.convertToJSON();
				[err, userAllPersonalData] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: medium,
						attributes: ['id', 'email', 'phone', 'username'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!userAllPersonalData || userAllPersonalData.length === 0) continue;

				const localUserIds = userAllPersonalData.map((data) => data.id);

				const whereCondition = {
					local_user_id: localUserIds,
					status: true,
					is_deleted: false,
					cStatus: 'Active',
					type: 'Learner',
				};

				if (type === 'drip') {
					whereCondition.forDrip = true;
				} else if (type === 'diwo') {
					whereCondition.forDiwo = true;
				}

				[err, getUser] = await to(
					User.findOne({
						where: whereCondition,
						attributes: ['id', 'local_user_id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!getUser) continue;

				const getUser_ = getUser.convertToJSON();

				[err, localUser] = await to(
					dbInstance[marketUser.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['email'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!localUser) continue;

				const whereClientCondition = {
					UserId: getUser_.id,
					RoleId: 1,
				};

				[err, getUserClient] = await to(
					User_role_client_mapping.findOne({
						where: whereClientCondition,
						attributes: ['ClientId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!getUserClient) continue;

				const getUser_Client = getUserClient.convertToJSON();

				if (getUser_ && getUser_Client && getUser_.id && getUser_Client.ClientId) {
					triggerLearnerResetPassWordLink(
						getUser_.id,
						getUser_Client.ClientId,
						type,
						CONFIG.jwt_expiration_reset_password_learner,
						'forgotPassword'
					);
					userFound = true;
					break;
				}
			}
		}

		if (!userFound) {
			return ResponseError(res, { message: MESSAGE.INVALID_USER_CREDENTIAL }, 500);
		}

		return ResponseSuccess(res, { data: localUser, message: MESSAGE.LEARNER_FORGOT_PASSWORD });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.learnerForgotPassword = learnerForgotPassword;

const learnerResetLockoutFlag = async function (req, res) {
	try {
		let userDetails = req.body;
		let err;

		triggerLearnerResetPassWordLink(
			userDetails.learnerId,
			userDetails.clientId,
			userDetails.type,
			CONFIG.jwt_expiration_reset_password_admin,
			'resetLockout Admin unlock Learner account'
		);

		[err, updateUser] = await to(
			User.update({ isLockout: false, failed_attempts: 0 }, { where: { id: userDetails.learnerId } })
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: MESSAGE.LEARNER_RESET_LOCKOUT });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.learnerResetLockoutFlag = learnerResetLockoutFlag;

// API to login with phone number Email and username to  generate OTP
const newPWALoginOTP = async function (req, res) {
	try {
		let schema = Joi.object({
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			app: Joi.boolean().required(),
			app_version: Joi.string().trim().min(5).max(10).required(), // Country (required)
			type: Joi.string().required(),
			momentDate: Joi.string()
				.pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4} ([01][0-9]|2[0-3]):([0-5][0-9])$/)
				.message('Date must be in DD-MM-YYYY HH:mm format'),
			sessioncode: Joi.string().trim().min(3).max(15),
		});

		let flag_1 = true;

		if (config_feature?.configurable_feature?.pwa_username && req?.body?.username) {
			flag_1 = false;
			schema = schema.append({ username: Joi.string().trim().min(3).required() });
		} else if (config_feature?.configurable_feature?.pwa_phone && req?.body?.phone) {
			flag_1 = false;
			schema = schema.append({
				phone: Joi.string()
					.pattern(/^[0-9]{10}$/)
					.required(),
			});
		} else if (config_feature?.configurable_feature?.pwa_email && req?.body?.email) {
			flag_1 = false;
			schema = schema.append({ email: Joi.string().email().required() });
		}

		if (config_feature?.configurable_feature?.pwa_password && req?.body?.password) {
			schema = schema.append({
				password: Joi.string().required(),
			});
		}

		if (flag_1) {
			return ResponseError(res, {
				message: 'Please provide correct information for login',
			});
		}

		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const data = value;
		// const data = req.body;

		let err;
		let userDetails;
		let random = Math.floor(1000 + Math.random() * 9000);

		let type = data.type;
		data.otp = random.toString();

		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
			data.otp = '9999';
		}

		// if (env == 'local') {
		// 	data.otp = '9999';
		// }

		if (!data.phone && !data.email && !data.username) {
			return ResponseError(
				res,
				{
					message: MESSAGE.DETAILS,
				},
				400
			);
		}

		// //Need to change it for tester Account;
		if (data.email && data.email === CONFIG.devops_tester_user_email) {
			return ResponseSuccess(res, {
				message: MESSAGE.OTP_SENT,
			});
		} else if (data.phone && data.phone === CONFIG.devops_tester_user_phone) {
			return ResponseSuccess(res, {
				message: MESSAGE.OTP_SENT,
			});
		}

		/////////////////////////////////////////////////////////////////////////////////

		[err, userDetails] = await to(generatePWAOtp(data, type, req));

		///////////////////////////////////////////////////////////////////////////////////
		if (err) {
			if (err) {
				return ResponseError(res, err.message, 500);
			}
			if (userDetails && userDetails.error) {
				return ResponseError(res, {
					message: userDetails.error,
				});
			}
			if (userDetails && userDetails.status != true) {
				return ResponseError(res, {
					message: MESSAGE.USER_NOT_ACTIVE,
				});
			}
		}

		if (userDetails && userDetails.error) {
			return ResponseError(res, {
				message: userDetails.error,
			});
		}

		if (userDetails && userDetails.status != true) {
			return ResponseError(res, {
				message: MESSAGE.USER_NOT_ACTIVE,
			});
		}

		// Remove Commits for Production
		if (
			env == 'development' ||
			env == 'dev' ||
			env == 'local' ||
			env == 'test' ||
			env == 'loadtest' ||
			env == 'staging'
		) {
			if (userDetails) {
				if (userDetails.status != true)
					return ResponseError(res, {
						message: MESSAGE.USER_NOT_ACTIVE,
					});

				[err, newLog] = await to(
					createlog(userDetails.UserId, null, 1, `User Generated PWA OTP`, req.ip, req.useragent, type, null)
				);
				if (err) return ResponseError(res, err, 500, true);

				return ResponseSuccess(res, {
					// message: 'New Otp: ' + random.toString(),
					message: 'New Otp: ' + '9999',
				});
			} else {
				return ResponseError(
					res,
					{
						message: MESSAGE.USER_NOT_REGISTERED,
					},
					400
				);
			}
		} else {
			//check if otp in config
			if (userDetails) {
				if (userDetails.type == null && req.body.app == true) {
					return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
				}
				let phone_number = req.body.phone;
				let email = req.body.email;
				let country_code = '+91';
				let success;
				let failed;
				let appBranding;
				let client_WhatsAppSetup_;
				let sendingPlatform = '';
				let countries;

				if (userDetails && userDetails.clientId && type == 'drip') {
					appBranding = await getClientAppBrandingByClientId(userDetails.clientId);
				}

				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

				if (email || phone_number) {
					///check if email or phone or whatsapp origin
					if (phone_number && appBranding && appBranding.isWhatsAppOTP) {
						[err, countries] = await to(
							Country.findOne({
								where: {
									name: userDetails.country,
								},
								attributes: ['id', 'name', 'callingCode'],
								order: [['name', 'ASC']],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (countries) {
							country_code = countries.callingCode;
						}

						console.log('-----send otp on whatsapp---');

						[err, client_WhatsAppSetup_] = await to(
							ClientWhatsAppSetup.findOne({
								where: {
									ClientId: userDetails.clientId,
								},
								include: [
									{
										model: WhatsAppSetup,
										where: {
											status: 'Active',
										},
										attributes: [
											'id',
											'user_id',
											'password',
											'otpTempId',
											'isMeta',
											'MTToken',
											'templateName',
											'MTPNoId',
										],
									},
								],
								attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (
							client_WhatsAppSetup_ &&
							client_WhatsAppSetup_.WhatsAppSetup &&
							!client_WhatsAppSetup_.WhatsAppSetup.isMeta
						) {
							if (
								client_WhatsAppSetup_ &&
								client_WhatsAppSetup_.WhatsAppSetup &&
								client_WhatsAppSetup_.WhatsAppSetup.user_id &&
								client_WhatsAppSetup_.WhatsAppSetup.otpTempId
							) {
								let msgString = 'is your verification code. For your security, do not share this code.';
								let params = {
									userid: parseInt(client_WhatsAppSetup_.WhatsAppSetup.user_id),
									password: client_WhatsAppSetup_.WhatsAppSetup.password,
									send_to: country_code + phone_number,
									v: `1.1`,
									format: `json`,
									msg_type: 'TEXT',
									method: 'SENDMESSAGE',
									msg: `${random.toString()}` + ' ' + convertSpecialChar(msgString),
									isTemplate: true,
								};

								console.log('-<<<<---SEND WhatsApp OTP Params-->>>>-', params);

								console.log(
									'<<<<<----Url-- ---WhatsApp-OTP--SEND -->>>>>>>>>>>>>>',
									`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
								);

								const response = await axios.get(
									`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
								);
								console.log('-<<<<--Send WhatsApp OTP response--->>>>-', response.data);
								sendingPlatform = 'WhatsApp';
								if (response && response.data.response.status == 'success') {
									success = 'WhatsAppMSG';
									console.log('--success-', success);
								} else {
									failed = 'WhatsAppMSG';
									console.log('--failed-', failed);
								}
							} else {
								failed = 'WhatsAppMSG';
								console.log('--Invalid Whatsapp Setup--');
							}
						} else {
							if (
								client_WhatsAppSetup_ &&
								client_WhatsAppSetup_.WhatsAppSetup &&
								client_WhatsAppSetup_.WhatsAppSetup.user_id &&
								client_WhatsAppSetup_.WhatsAppSetup.otpTempId
							) {
								const accessToken = client_WhatsAppSetup_.WhatsAppSetup.MTToken;
								const templateName = client_WhatsAppSetup_.WhatsAppSetup.templateName;
								const phoneId = client_WhatsAppSetup_.WhatsAppSetup.MTPNoId;

								const phone = `${country_code}${phone_number}`;
								const randomCode = `${random.toString()}`;
								console.log('-random.toString()-', random.toString());
								const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;

								const payload = {
									messaging_product: 'whatsapp',
									to: phone,
									type: 'template',
									template: {
										name: templateName,
										language: { code: 'en_US' },
										components: [
											{
												type: 'body',
												parameters: [{ type: 'text', text: randomCode }],
											},
											{
												type: 'button',
												sub_type: 'url',
												index: '0',
												parameters: [{ type: 'text', text: randomCode }],
											},
										],
									},
								};

								console.log('-<<<<---SEND WhatsApp OTP Meta Params-->>>>-', payload);
								console.log('<<<<<<---Meta OTP Send URL-->>>>>>', url);

								let response;
								try {
									response = await axios.post(url, payload, {
										headers: {
											Authorization: `Bearer ${accessToken}`,
											'Content-Type': 'application/json',
										},
									});
									console.log('-<<<<--Meta Send WhatsApp OTP Response--->>>>-', response.data);
									sendingPlatform = 'WhatsApp';

									if (response?.data?.messages?.[0]?.id) {
										success = 'WhatsAppMSG';
										console.log('--success-', success);
									} else {
										failed = 'WhatsAppMSG';
										console.log('--failed-', failed);
									}
								} catch (apiError) {
									console.log('--Meta OTP send error--', apiError?.response?.data || apiError);
									failed = 'WhatsAppMSG';
								}
							} else {
								failed = 'WhatsAppMSG';
								console.log('--Invalid Meta WhatsApp Setup or Template ID--');
							}
						}
					} else if (phone_number && userDetails.country == 'India') {
						sendingPlatform = 'SMS';
						[err, sendOTP] = await to(sendMessage(data.phone, '', random.toString(), userDetails.clientId, type));
						if (err) {
							console.log('-----------Error in Karix------------', err);
							failed = 'SMS';
						} else {
							success = 'SMS';
						}
					} else if (email && userDetails.otp && userDetails.email && userDetails.email.length > 0) {
						console.log('-----send otp on email---');
						sendingPlatform = 'Email';
						[err, mailedOTP] = await to(sendOTPMail(userDetails.email, random.toString(), type));
						if (err) {
							console.log('--------Error in Sendgrid--------------', err);
							failed = 'e-mail';
						} else {
							success = 'e-mail';
						}
					}

					let msg = failed ? `${failed}  ${MESSAGE.OTP_FAIL}  ${success}` : `${MESSAGE.SENT_IN_EMAIL}`;
					if (success) {
						return ResponseSuccess(res, {
							message: MESSAGE.OTP_SENT,
							data: msg,
							sendingPlatform: sendingPlatform,
						});
					} else {
						if (phone_number && userDetails.country !== 'India') {
							return ResponseError(
								res,
								{
									message: MESSAGE.MOBILE_NO_LOGIN_NOT_SUPPORTED,
								},
								400
							);
						} else {
							return ResponseError(
								res,
								{
									message: MESSAGE.OTP_GENERATE_FAIL,
								},
								400
							);
						}
					}
				} else {
					return ResponseError(
						res,
						{
							message: MESSAGE.OTP_GENERATE_FAIL,
						},
						400
					);
				}
			} else {
				if (userDetails && userDetails.status != true) {
					return ResponseError(res, {
						message: MESSAGE.USER_NOT_ACTIVE,
					});
				} else {
					return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
				}
			}
		}
	} catch (err) {
		return ResponseError(res, err, 500, true);
	}
};
module.exports.newPWALoginOTP = newPWALoginOTP;

// API to login with email,phone,uername and if OTP in config
const newPWALogin = async function (req, res) {
	try {
		let schema = Joi.object({
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			app: Joi.boolean().required(),
			app_version: Joi.string().trim().min(5).max(10).required(), // Country (required)
			type: Joi.string().required(),
			momentDate: Joi.string()
				.pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4} ([01][0-9]|2[0-3]):([0-5][0-9])$/)
				.message('Date must be in DD-MM-YYYY HH:mm format'),
			sessioncode: Joi.string().trim().min(3).max(15),
		});

		let flag_1 = true;
		let flag_2 = true;

		if (config_feature?.configurable_feature?.pwa_username && req?.body?.username) {
			flag_1 = false;
			schema = schema.append({ username: Joi.string().trim().min(3).required() });
		} else if (config_feature?.configurable_feature?.pwa_phone && req?.body?.phone) {
			flag_1 = false;
			schema = schema.append({
				phone: Joi.string()
					.pattern(/^[0-9]{10}$/)
					.required(),
			});
		} else if (config_feature?.configurable_feature?.pwa_email && req?.body?.email) {
			flag_1 = false;
			schema = schema.append({ email: Joi.string().email().required() });
		}

		if (config_feature?.configurable_feature?.pwa_password && req?.body?.password) {
			flag_2 = false;
			schema = schema.append({
				password: Joi.string().required(),
			});
		}
		if (config_feature?.configurable_feature?.pwa_otp && req?.body?.otp) {
			flag_2 = false;
			schema = schema.append({
				otp: Joi.string().min(4).max(4).required(),
			});
		}

		if (flag_1 || flag_2) {
			return ResponseError(res, {
				message: 'Please provide correct information for login',
			});
		}

		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const body = value;
		// const body = req.body;

		let err, userClientRoleDetails;
		let type = body.type;

		// Authenticate user using authService
		const all_user_ids = await to(pwaValidateUser(body, type, req));

		if (all_user_ids[0]) {
			// Check for error in authService
			return ResponseError(res, all_user_ids[0], 500);
		}

		// Define where conditions based on type
		let whereCondition = {
			UserId: all_user_ids[1],
		};
		if (type === 'drip') {
			whereCondition.forDrip = true;
			whereCondition.RoleId = 1;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
			whereCondition.RoleId = [1, 11];
		}

		// Fetch user details with client and role information
		[err, userClientRoleDetails] = await to(
			User_role_client_mapping.findAll({
				where: whereCondition,
				include: [
					{ model: Client },
					{ model: Role, attributes: ['id', 'name'] },
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['id', 'name', 'db_name', 'tosUrl', 'privacyPolicyUrl', 'dpaUrl', 'cookiePolicyUrl'],
							},
						],
					},
				],
			})
		);
		if (err) {
			return ResponseError(res, err, 500);
		}

		if (userClientRoleDetails.length == 1) {
			//Get Personal data
			[err, localData] = await to(
				dbInstance[userClientRoleDetails[0].User.Market.db_name].User_master.findOne({
					where: {
						id: userClientRoleDetails[0].User.local_user_id,
					},
					attributes: ['first', 'last', 'phone', 'email', 'city', 'country', 'imagePath', 'isDeleted'],
				})
			);
			if (err) ThrowException(err.message);
			let user_info = userClientRoleDetails[0].User.convertToJSON();
			user_info = { ...user_info, ...localData.convertToJSON() };

			user_info.roles = [
				{
					role: userClientRoleDetails[0].Role.name,
					client: userClientRoleDetails[0].Client,
					roleId: userClientRoleDetails[0].Role.id,
				},
			];

			user_info.Market = userClientRoleDetails[0].User.Market;
			user_info.client = userClientRoleDetails[0].Client;

			delete user_info.otp;

			//Update First Login and Last Login Date and Time
			if (user_info) {
				if (!user_info.firstLogin) {
					user_info.firstLogin = moment().format('YYYY-MM-DD HH:mm:ss');
				}
				user_info.lastLogin = moment().format('YYYY-MM-DD HH:mm:ss');
				[err, UpdateUserDetails] = await to(
					User.update(
						{
							firstLogin: user_info.firstLogin,
							lastLogin: user_info.lastLogin,
						},
						{
							where: {
								id: user_info.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			// Create a notification message based on 'type' and call respective notification function
			let notificationMessage = MESSAGE.LOGIN.replace('{{date}}', body.momentDate);
			if (type === 'drip') {
				createNotification(notificationMessage, ['Bell'], [user_info.id]);
			} else if (type === 'diwo') {
				createNotificationforDiwo(notificationMessage, ['Bell'], [user_info.id]);
			}

			/// Create Log For System Logs
			createlog(
				user_info.id,
				userClientRoleDetails[0].Client.id,
				userClientRoleDetails[0].Role.id,
				`PWA Login`,
				req.ip,
				req.useragent,
				type,
				null
			);

			// Sending JWT token and formatted user info in the response
			const token = await userClientRoleDetails[0].User.getJWT(
				userClientRoleDetails[0].RoleId,
				userClientRoleDetails[0].ClientId,
				type
			);

			res.cookie('jwt', token, {
				httpOnly: true, // Prevent JavaScript access
				secure: env == 'development' || env == 'dev' || env == 'local' ? false : true, // Send only over HTTPS
				sameSite: env == 'development' || env == 'dev' || env == 'local' ? 'Lax' : 'Strict',
				maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
				// path: '/',
			});

			return ResponseSuccess(res, {
				// token: token,
				user: user_info,
			});
		}

		return ResponseSuccess(res, {
			user: userClientRoleDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.newPWALogin = newPWALogin;

///////////////////////////////////////////////////////////////////////-----WEB----------/////////////////////////////////////////////

//admin User Reser password
const checkAdminResetPasswordTokenValidity = async function (req, res) {
	try {
		const schema = Joi.object({
			token: Joi.string().required(),
		});
		const { error, value } = schema.validate({
			token: req.body.token,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { token } = value;

		let decoded;
		if (token) {
			try {
				decoded = jwt.verify(token, CONFIG.jwt_encryption);
				return ResponseSuccess(res, { message: MESSAGE.VALID_TOKEN }, 200);
			} catch (err) {
				if (err.name === 'TokenExpiredError') {
					return ResponseError(res, { message: MESSAGE.TOKEN_EXPIRED }, 400);
				} else if (err.name === 'JsonWebTokenError') {
					return ResponseError(res, { message: MESSAGE.INVALID_TOKEN }, 400);
				} else {
					return ResponseError(res, { message: MESSAGE.TOKEN_VERIFICATION_FAIL }, 500);
				}
			}
		} else {
			return ResponseError(res, { message: MESSAGE.TOKEN_MISSING }, 400);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkAdminResetPasswordTokenValidity = checkAdminResetPasswordTokenValidity;

//admin user chnaged password
const adminUserResetPassword = async function (req, res) {
	try {
		const schema = Joi.object({
			token: Joi.string().required(),
			type: Joi.string().required(),
			pass: Joi.any().required(),
		});
		const { error, value } = schema.validate({
			token: req.body.token,
			type: req.body.type,
			pass: req.body.pass,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { token, type, pass } = value;

		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let decoded;
		if (token) {
			try {
				decoded = jwt.verify(token, CONFIG.jwt_encryption);
			} catch (err) {
				if (err.name === 'TokenExpiredError') {
					return ResponseError(res, { message: MESSAGE.TOKEN_EXPIRED }, 401);
				} else if (err.name === 'JsonWebTokenError') {
					return ResponseError(res, { message: MESSAGE.INVALID_TOKEN }, 401);
				} else {
					return ResponseError(res, { message: MESSAGE.TOKEN_VERIFICATION_FAIL }, 500);
				}
			}
		} else {
			return ResponseError(res, { message: MESSAGE.TOKEN_MISSING }, 400);
		}
		let userId = decoded.user_id;
		// let type = req.body.type;
		// let pass = req.body.pass;
		let getUser;
		let hashpass;
		let err;

		// console.log('--pass1--', pass);
		hashpass = await hashPassword(pass);
		// console.log('--pass2--', hashpass);
		// console.log('-req.user-', decoded);

		let whereCondition = {
			id: userId,
			status: true,
			is_deleted: false,
			cStatus: 'Active',
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		[err, getUser] = await to(
			User.findOne({
				where: whereCondition,
				attributes: ['MarketId', 'local_user_id'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, updateUser] = await to(User.update({ isLockout: false, failed_attempts: 0 }, { where: { id: userId } }));
		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			password: hashpass,
		};

		[err, updateLocalUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.update(payload, {
				where: {
					id: getUser.local_user_id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				decoded.user_id,
				decoded.ClientId,
				decoded.RoleId,
				`User Change Admin Password`,
				req.ip,
				req.useragent,
				decoded.type,
				null
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: MESSAGE.ADMIN_RESET_PASSWORD });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.adminUserResetPassword = adminUserResetPassword;

//admin user forgot password link
const adminUserForgotPassword = async function (req, res) {
	try {
		const schema = Joi.object({
			email: Joi.string().email().required(),
			type: Joi.string().required(),
		});
		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const userInfo = value;

		if (!checkProjectNameByType(userInfo.type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		// const userInfo = req.body;

		const type = userInfo.type;
		let err, marketDetails, userAllPersonalData, getUser, getUserClient;
		let userFound = false;

		let medium = {
			isDeleted: false,
			status: true,
			email: null,
		};

		if (userInfo.email) {
			medium.email = userInfo.email.toLowerCase();
		}

		[err, marketDetails] = await to(
			Market.findAll({
				where: { status: true },
				attributes: ['db_name', 'id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (marketDetails && marketDetails.length > 0) {
			for (const market of marketDetails) {
				const marketUser = market.convertToJSON();
				[err, userAllPersonalData] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: medium,
						attributes: ['id', 'email'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!userAllPersonalData || userAllPersonalData.length === 0) continue;

				const localUserIds = userAllPersonalData.map((data) => data.id);

				const whereCondition = {
					local_user_id: localUserIds,
					status: true,
					is_deleted: false,
					cStatus: 'Active',
					type: 'Admin',
				};

				if (type === 'drip') {
					whereCondition.forDrip = true;
				} else if (type === 'diwo') {
					whereCondition.forDiwo = true;
				}

				[err, getUser] = await to(
					User.findOne({
						where: whereCondition,
						attributes: ['id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!getUser) continue;

				const getUser_ = getUser.convertToJSON();

				const whereClientCondition = {
					UserId: getUser_.id,
					RoleId: {
						[Op.ne]: 1,
					},
				};

				[err, getUserClient] = await to(
					User_role_client_mapping.findOne({
						where: whereClientCondition,
						attributes: ['ClientId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (!getUserClient) continue;

				const getUser_Client = getUserClient.convertToJSON();

				if (getUser_ && getUser_Client && getUser_.id && getUser_Client.ClientId) {
					triggerAdminUserResetPassWordLink(
						getUser_.id,
						getUser_Client.ClientId,
						type,
						CONFIG.jwt_expiration_reset_password_learner,
						'forgotPassword'
					);
					userFound = true;
					break;
				}
			}
		}

		if (!userFound) {
			return ResponseError(res, { message: MESSAGE.INVALID_USER_CREDENTIAL }, 500);
		}

		return ResponseSuccess(res, { message: MESSAGE.ADMIN_FORGOT_PASSWORD });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.adminUserForgotPassword = adminUserForgotPassword;

//Web admin user login With OTP
const newWebLoginOtp = async function (req, res) {
	try {
		let schema = Joi.object({
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(),
			registration: Joi.boolean().required(),
			email: Joi.string().email().required(),
			type: Joi.string().required(),
		});

		if (config_feature?.configurable_feature?.pwa_password && req?.body?.password) {
			schema = schema.append({
				password: Joi.string().required(),
			});
		} else {
			schema = schema.append({
				password: Joi.string().allow(null).allow(''),
			});
		}

		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const data = value;

		if (!checkProjectNameByType(data.type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 400);
		}

		let err;
		let userDetails, markets;
		let random = Math.floor(1000 + Math.random() * 9000);
		data.otp = random.toString();

		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
			data.otp = '9999';
		}

		if (!data.phone) {
			if (!data.email) {
				return ResponseError(
					res,
					{
						message: MESSAGE.DETAILS,
					},
					400
				);
			}
		}

		if (CONFIG.MAINTMODE === true || CONFIG.MAINTMODE === 'true') {
			if (!CONFIG.MAINTMODE_ALLOWEDUSERS.includes(data.phone)) {
				let message = CONFIG.MAINTMODE_MESSAGE;
				return ResponseError(res, message, 500);
			}
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
							name: data.country,
						},
						required: true,
					},
				],
			})
		);
		if (err) {
			return ResponseError(res, err, 500);
		}

		[err, userDetails] = await to(genarateWEBOtp(data, data.type));

		if (err) {
			if (err.message == 'Validation error') {
				err = MESSAGE.OTP_GENERATE_FAIL;
				return ResponseError(res, err, 500);
			} else if (err.message == MESSAGE.NOT_LEARNER_USER) {
				err = data.type === 'drip' ? MESSAGE.NOT_CONTACT_USER : MESSAGE.NOT_LEARNER_USER;
				return ResponseError(res, err, 500);
			} else if (err.message == MESSAGE.USER_NOT_REGISTERED) {
				err = MESSAGE.USER_NOT_REGISTERED;
				return ResponseError(res, err, 500);
			} else {
				return ResponseError(res, err.message, 500);
			}
		}

		if (userDetails && userDetails.status != true) {
			return ResponseError(res, {
				message: MESSAGE.USER_NOT_ACTIVE,
			});
		}

		//Need to change it for tester Account;
		if (data.email && data.email === CONFIG.devops_tester_user_email) {
			return ResponseSuccess(res, {
				message: MESSAGE.OTP_SENT,
			});
		} else if (data.phone && data.phone === CONFIG.devops_tester_user_phone) {
			return ResponseSuccess(res, {
				message: MESSAGE.OTP_SENT,
			});
		}

		// Remove Commits for Production
		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
			if (userDetails) {
				if (userDetails.status != true)
					return ResponseError(res, {
						message: MESSAGE.USER_NOT_ACTIVE,
					});

				return ResponseSuccess(res, {
					// message: 'New Otp: ' + random.toString(),
					message: 'New Otp: ' + '9999',
				});
			} else {
				return ResponseError(res, { message: MESSAGE.USER_NOT_REGISTERED }, 400);
			}
		} else {
			if (userDetails && !data.registration) {
				if (userDetails.type == null && data.app == true) return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
				let phone_number = data.phone;
				let email = data.email;
				let country_code = '+91';
				let via = 'sms';
				let success;
				let failed;
				if (email || phone_number) {
					///check if email or phone oring
					if (phone_number && country_code && via) {
						[err, sendOTP] = await to(sendMessage(data.phone, '', random.toString(), null, data.type));
						if (err) {
							failed = 'SMS';
						} else success = 'SMS';
					} else if (userDetails.otp && userDetails.email && userDetails.email.length > 0) {
						[err, mailedOTP] = await to(sendOTPMail(userDetails.email, random.toString(), data.type));
						if (err) {
							failed = 'e-mail';
						} else success = 'e-mail';
					}

					let msg = failed ? `${failed}  ${MESSAGE.OTP_FAIL}  ${success}` : `${MESSAGE.SENT_IN_EMAIL}`;
					if (success)
						return ResponseSuccess(res, {
							message: MESSAGE.OTP_SENT,
							data: msg,
						});
					else
						return ResponseError(
							res,
							{
								message: MESSAGE.OTP_GENERATE_FAIL,
							},
							400
						);
				} else {
					return ResponseError(
						res,
						{
							message: MESSAGE.OTP_GENERATE_FAIL,
						},
						400
					);
				}
			} else {
				if (userDetails && userDetails.status != true)
					return ResponseError(res, {
						message: MESSAGE.USER_NOT_ACTIVE,
					});
				return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
			}
		}
	} catch (err) {
		return ResponseError(res, err, 500, true);
	}
};
module.exports.newWebLoginOtp = newWebLoginOtp;

const newWebLogin = async function (req, res) {
	try {
		let schema = Joi.object({
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			momentDate: Joi.string()
				.pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4} ([01][0-9]|2[0-3]):([0-5][0-9])$/)
				.message('Date must be in DD-MM-YYYY HH:mm format')
				.required(),
			email: Joi.string().email().required(),
			type: Joi.string().required(),
		});

		if (config_feature?.configurable_feature?.web_otp && req?.body?.otp) {
			schema = schema.append({
				otp: Joi.string().min(4).max(4).required(),
			});
		} else {
			schema = schema.append({
				otp: Joi.string().allow(null).allow(''),
			});
		}

		if (config_feature?.configurable_feature?.pwa_password && req?.body?.password) {
			schema = schema.append({
				password: Joi.string().required(),
			});
		} else {
			schema = schema.append({
				password: Joi.string().allow(null).allow(''),
			});
		}

		const { error, value } = schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const data = value;

		if (!checkProjectNameByType(data.type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 400);
		}

		let err, child, roles, children;
		var user;

		[err, user] = await to(webValidateUser(data, req));
		if (err) return ResponseError(res, err, 500);

		let user_info = {};
		[err, roles] = await to(user.globalUser.getRoles());
		if (err) return ResponseError(res, err, 500, true);

		let userRoles = [];
		for (let i in roles) {
			if (roles[i].User_role_client_mapping.RoleId != 1) {
				[err, client] = await to(
					Client.findOne({
						where: {
							id: roles[i].User_role_client_mapping.ClientId,
						},
						include: [
							{
								model: Country,
								through: 'Client_country_mapping',
							},
						],
					})
				);
				if (data.type == 'drip' && roles[i].dripRole && client.DripAccess) {
					userRoles.push({
						role: roles[i].name,
						client: client,
						roleId: roles[i].id,
					});
				} else if (data.type == 'diwo' && roles[i].diwoRole && client.DiwoAccess) {
					userRoles.push({
						role: roles[i].name,
						client: client,
						roleId: roles[i].id,
					});
				}
			}
		}
		user_info = user.localUser.convertToJSON();
		user_info.roles = userRoles;
		user_info.id = user.globalUser.id;
		user_info.isReg_Completed = user.globalUser.isReg_Completed;
		user_info.Market = user.market;
		user_info.client = user.client;
		user_info.userPolicyDetails = user.globalUser.userPolicyDetails;
		user_info.acceptPolicy = user.globalUser.acceptPolicy;
		user_info.opt_in = user.globalUser.opt_in;
		user_info.opt_out = user.globalUser.opt_out;
		user_info.account_id = user.globalUser.account_id;
		user_info.acceptOptInByUser = user.globalUser.acceptOptInByUser;
		user_info.firstLogin = user.globalUser.firstLogin;
		user_info.lastLogin = user.globalUser.lastLogin;

		if (user.globalUser.access_token && user.globalUser.refresh_token) {
			user_info.access_token = true;
		} else {
			user_info.access_token = false;
		}
		delete user_info.otp;

		if (user_info) {
			if (!user_info.firstLogin) {
				user_info.firstLogin = moment().format('YYYY-MM-DD HH:mm:ss');
			}
			user_info.lastLogin = moment().format('YYYY-MM-DD HH:mm:ss');
			[err, UpdateUserDetails] = await to(
				User.update(
					{
						firstLogin: user_info.firstLogin,
						lastLogin: user_info.lastLogin,
					},
					{
						where: {
							id: user_info.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let notifcationMessage = MESSAGE.LOGIN;
		notifcationMessage = notifcationMessage.replace('{{date}}', data.momentDate);
		if (data.type == 'drip') {
			await createNotification(notifcationMessage, ['Bell'], [user_info.id]);

			console.log('--userRoles--', userRoles[0].client.convertToJSON().id);

			if (userRoles && userRoles.length === 1) {
				[err, newLog] = await to(
					createlog(
						user_info.id,
						userRoles[0].client.id,
						userRoles[0].roleId,
						`Admin Login`,
						req.ip,
						req.useragent,
						'drip',
						null
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (data.type == 'diwo') {
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [user_info.id]);

			if (userRoles && userRoles.length === 1) {
				[err, newLog] = await to(
					createlog(
						user_info.id,
						userRoles[0].client.id,
						userRoles[0].roleId,
						`Admin Login`,
						req.ip,
						req.useragent,
						'diwo',
						null
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		const token = user.globalUser.getJWT(user_info.roles[0].roleId, user_info.roles[0].client.id, data.type);
		// Set token as an HTTP-only cookie
		res.cookie('jwt', token, {
			httpOnly: true, // Prevent JavaScript access
			secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
			sameSite: env == 'development' || env == 'dev' || env == 'local' ? 'Lax' : 'Strict',
			maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
		});

		return ResponseSuccess(res, { user: user_info });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.newWebLogin = newWebLogin;
