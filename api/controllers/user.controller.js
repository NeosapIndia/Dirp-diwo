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
	SessionUser,
	SessionAsset,
	DiwoAsset,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess, ThrowException } = require('../services/util.service');
const { getDiwoClientAppBrandingByClientId } = require('../services/client.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const { sendDripEmail } = require('../services/mailer.service');
const authService = require('../services/auth.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { sendMessage } = require('../services/message.service');

const { sendUserWelcomeEmailToAdmin, sendEditingUserEmailToAdmin } = require('../services/mailer.service');
const {
	getAllSubChildClientIds,
	getAllSubChildClientIdsForDrip,
	getAllSubBranchAccountLists,
} = require('../services/client.service');
const { createNotification, createNotificationforDiwo } = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const { capitalFirstLatter } = require('../services/auth.service');
const {
	getAddOneLearnerCount,
	getRemoveOneLearnerCount,
	getRemoveOneLearnerCountForDiwo,
	getLearnerValidaionOnCreateLearner,
	getClientChildVilidation,
	getLearnerValidaionOnCreateLearnerForDiwo,
	getAddOneLearnerCountForDiwo,
} = require('../services/license.service');

const { updateUserAccountId } = require('../services/auth.service');
const { getClientAppBrandingByClientId } = require('../services/client.service');
const axios = require('axios');
const { updateDripMultipleCountInLicense, getValidationForSendDripWithCount } = require('../services/license.service');
const Sequelize = require('sequelize');
const validationConstant = require('../config/validationConstant.json');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const {
	generatePassword,
	hashPassword,
	triggerAdminUserResetPassWordLink,
	triggerAdminUserCreatePassWordLink,
} = require('../services/login.service');
const config_feature = require('../config/SiteConfig.json');

// Genrate Otp
// const genarateOtp = async function (req, res) {
// 	try {
// 		// Validation Of Project Type
// 		// country, email
// 		// registration
// 		// Check project type validity

// 		const type = req.params.type;
// 		if (!checkProjectNameByType(type)) {
// 			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 400);
// 		}

// 		const schema = Joi.object({
// 			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
// 			registration: Joi.boolean().required(),
// 			email: Joi.string().email().required(),
// 		});
// 		const { error, value } = schema.validate(req.body);
// 		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

// 		let err, data;
// 		let userDetails, markets;
// 		let random = Math.floor(1000 + Math.random() * 9000);

// 		data = req.body;
// 		data.otp = random.toString();

// 		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
// 			data.otp = '9999';
// 		}

// 		// if (env == 'local') {
// 		// 	data.otp = '9999';
// 		// }

// 		let pwa_login = false;
// 		if (req.body && req.body.app && req.body.app == true) {
// 			pwa_login = true;
// 		}
// 		if (!req.body.phone) {
// 			if (!req.body.email) {
// 				return ResponseError(
// 					res,
// 					{
// 						message: MESSAGE.DETAILS,
// 					},
// 					400
// 				);
// 			}
// 		}

// 		if (CONFIG.MAINTMODE === true || CONFIG.MAINTMODE === 'true') {
// 			if (!CONFIG.MAINTMODE_ALLOWEDUSERS.includes(req.body.phone)) {
// 				let message = CONFIG.MAINTMODE_MESSAGE;
// 				return ResponseError(res, message, 500);
// 			}
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
// 							name: req.body.country,
// 						},
// 						required: true,
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			return ResponseError(res, err, 500);
// 		}

// 		[err, userDetails] = await to(authService.regenarateOtp(data, pwa_login, type));
// 		if (err) {
// 			if (err.message == 'Validation error') {
// 				err = MESSAGE.OTP_GENERATE_FAIL;
// 				return ResponseError(res, err, 500);
// 			} else if (err.message == MESSAGE.NOT_LEARNER_USER) {
// 				err = type === 'drip' ? MESSAGE.NOT_CONTACT_USER : MESSAGE.NOT_LEARNER_USER;
// 				return ResponseError(res, err, 500);
// 			} else if (err.message == MESSAGE.USER_NOT_REGISTERED) {
// 				err = MESSAGE.USER_NOT_REGISTERED;
// 				return ResponseError(res, err, 500);
// 			}
// 		}
// 		if (userDetails && userDetails.status != true) {
// 			return ResponseError(res, {
// 				message: MESSAGE.USER_NOT_ACTIVE,
// 			});
// 		}

// 		//Need to change it for tester Account;
// 		if (req.body.email && req.body.email === CONFIG.devops_tester_user_email) {
// 			return ResponseSuccess(res, {
// 				message: MESSAGE.OTP_SENT,
// 			});
// 		} else if (req.body.phone && req.body.phone === CONFIG.devops_tester_user_phone) {
// 			return ResponseSuccess(res, {
// 				message: MESSAGE.OTP_SENT,
// 			});
// 		}

// 		// if (userDetails) {
// 		//     if (userDetails.status != true) return ResponseError(res, { message: MESSAGE.USER_NOT_ACTIVE });

// 		//     return ResponseSuccess(res, { message: 'New Otp: ' + random.toString() });
// 		// } else {
// 		//     return ResponseError(res, { message: MESSAGE.INVALID_REQUEST }, 400);
// 		// }

// 		// Remove Commits for Production

// 		// if (env == 'local') {
// 		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
// 			if (userDetails) {
// 				if (userDetails.status != true)
// 					return ResponseError(res, {
// 						message: MESSAGE.USER_NOT_ACTIVE,
// 					});

// 				return ResponseSuccess(res, {
// 					// message: 'New Otp: ' + random.toString(),
// 					message: 'New Otp: ' + '9999',
// 				});
// 			} else {
// 				return ResponseError(
// 					res,
// 					{
// 						message: MESSAGE.USER_NOT_REGISTERED,
// 					},
// 					400
// 				);
// 			}
// 		} else {
// 			if (userDetails && !req.body.registration) {
// 				if (userDetails.type == null && req.body.app == true)
// 					return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 				let phone_number = req.body.phone;
// 				let email = req.body.email;
// 				let country_code = '+91';
// 				let via = 'sms';
// 				let success;
// 				let failed;
// 				if (email || phone_number) {
// 					///check if email or phone oring
// 					if (phone_number && country_code && via) {
// 						[err, sendOTP] = await to(sendMessage(data.phone, '', random.toString(), null, type));
// 						if (err) {
// 							console.log('Error in Karix', err);
// 							failed = 'SMS';
// 						} else success = 'SMS';
// 					} else if (userDetails.otp && userDetails.email && userDetails.email.length > 0) {
// 						[err, mailedOTP] = await to(sendOTPMail(userDetails.email, random.toString(), type));
// 						if (err) {
// 							console.log('Error in Sendgrid', err);
// 							failed = 'e-mail';
// 						} else success = 'e-mail';
// 					}

// 					let msg = failed ? `${failed}  ${MESSAGE.OTP_FAIL}  ${success}` : `${MESSAGE.SENT_IN_EMAIL}`;
// 					if (success)
// 						return ResponseSuccess(res, {
// 							message: MESSAGE.OTP_SENT,
// 							data: msg,
// 						});
// 					else
// 						return ResponseError(
// 							res,
// 							{
// 								message: MESSAGE.OTP_GENERATE_FAIL,
// 							},
// 							400
// 						);
// 				} else {
// 					return ResponseError(
// 						res,
// 						{
// 							message: MESSAGE.OTP_GENERATE_FAIL,
// 						},
// 						400
// 					);
// 				}
// 			} else {
// 				if (userDetails && userDetails.status != true)
// 					return ResponseError(res, {
// 						message: MESSAGE.USER_NOT_ACTIVE,
// 					});
// 				return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 			}

// 			// else if (userDetails && req.body.registration) {
// 			//     if (userDetails.type == null && req.body.app == true) return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 			//     let phone_number = req.body.phone;
// 			//     let country_code = "+91";
// 			//     let via = "sms";

// 			//     [err, sendOTP] = await to(sendMessage(data.phone, '', random.toString()));
// 			//     if (err) {
// 			//         console.log('Error in Karix', err);
// 			//         failed = 'SMS';
// 			//     } else success = 'SMS';

// 			//     msg = failed ? `${failed} failed. but One Time Password sent in ${success}` : `Sent in SMS.`;
// 			//     if (success) return ResponseSuccess(res, { message: MESSAGE.OTP_SENT, data: msg });
// 			//     else return ResponseError(res, { message: MESSAGE.OTP_GENERATE_FAIL }, 400);
// 			// } else {
// 			//     [err, userDetails] = await to(dbInstance[markets.db_name].User_master.findOne({ where: { phone: "" + req.body.phone, status: false } }));
// 			//     if (userDetails)
// 			//         return ResponseError(res, { message: MESSAGE.USER_NOT_ACTIVE }, 400);

// 			//     return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 			// }
// 		}
// 	} catch (err) {
// 		return ResponseError(res, err, 500, true);
// 	}
// };
// module.exports.genarateOtp = genarateOtp;

const convertSpecialChar = function (text) {
	try {
		return text.replaceAll('%', '%25').replaceAll('+', '%2B');
	} catch (error) {
		console.log('---Error Convert Special Char---', error);
	}
};

// Genrate PWA Otp
// const genaratePWAOtp = async function (req, res) {
// 	try {
// 		let err, data;
// 		let userDetails;
// 		let random = Math.floor(1000 + Math.random() * 9000);
// 		let type = req.params.type;
// 		data = req.body;
// 		data.otp = random.toString();

// 		if (env == 'development' || env == 'dev' || env == 'local' || env == 'staging') {
// 			data.otp = '9999';
// 		}

// 		let pwa_login = false;
// 		if (req.body && req.body.app && req.body.app == true) {
// 			pwa_login = true;
// 		}
// 		if (!req.body.phone && !req.body.email) {
// 			return ResponseError(
// 				res,
// 				{
// 					message: MESSAGE.DETAILS,
// 				},
// 				400
// 			);
// 		}

// 		//Need to change it for tester Account;
// 		if (req.body.email == CONFIG.devops_tester_user_email) {
// 			return ResponseSuccess(res, {
// 				message: MESSAGE.OTP_SENT,
// 			});
// 		} else if (req.body.phone == CONFIG.devops_tester_user_phone) {
// 			return ResponseSuccess(res, {
// 				message: MESSAGE.OTP_SENT,
// 			});
// 		}

// 		[err, userDetails] = await to(authService.regenaratePWAOtp(data, pwa_login, type));
// 		if (err) {
// 			if (err.message == 'Validation error') {
// 				err = MESSAGE.OTP_GENERATE_FAIL;
// 				return ResponseError(res, err, 500);
// 			} else if (err.message == MESSAGE.NOT_LEARNER_USER) {
// 				err = type === 'drip' ? MESSAGE.NOT_CONTACT_USER : MESSAGE.NOT_LEARNER_USER;
// 				return ResponseError(res, err, 500);
// 			} else if (err.message == MESSAGE.USER_NOT_REGISTERED) {
// 				err = MESSAGE.USER_NOT_REGISTERED;
// 				return ResponseError(res, err, 500);
// 			}
// 		}
// 		if (userDetails && userDetails.error) {
// 			return ResponseError(res, {
// 				message: userDetails.error,
// 			});
// 		}
// 		if (userDetails && userDetails.status != true) {
// 			return ResponseError(res, {
// 				message: MESSAGE.USER_NOT_ACTIVE,
// 			});
// 		}

// 		// Remove Commits for Production
// 		if (
// 			env == 'development' ||
// 			env == 'dev' ||
// 			env == 'local' ||
// 			env == 'test' ||
// 			env == 'loadtest' ||
// 			env == 'staging'
// 		) {
// 			if (userDetails) {
// 				if (userDetails.status != true)
// 					return ResponseError(res, {
// 						message: MESSAGE.USER_NOT_ACTIVE,
// 					});

// 				return ResponseSuccess(res, {
// 					// message: 'New Otp: ' + random.toString(),
// 					message: 'New Otp: ' + '9999',
// 				});
// 			} else {
// 				return ResponseError(
// 					res,
// 					{
// 						message: MESSAGE.USER_NOT_REGISTERED,
// 					},
// 					400
// 				);
// 			}
// 		} else {
// 			if (userDetails) {
// 				if (userDetails.type == null && req.body.app == true) {
// 					return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 				}
// 				let phone_number = req.body.phone;
// 				let email = req.body.email;
// 				let country_code = '+91';
// 				let success;
// 				let failed;
// 				let appBranding;
// 				let client_WhatsAppSetup_;
// 				let sendingPlatform = '';
// 				let countries;

// 				if (userDetails && userDetails.clientId && type == 'drip') {
// 					appBranding = await getClientAppBrandingByClientId(userDetails.clientId);
// 				}

// 				//////////////////////////////////////////////////Old Code///////////////////////////////////////////////////////
// 				// [err, countries] = await to(
// 				// 	Country.findAll({
// 				// 		attributes: ['id', 'name', 'callingCode'],
// 				// 		order: [['name', 'ASC']],
// 				// 	})
// 				// );
// 				// if (err) return ResponseError(res, err, 500, true);

// 				// if (countries && countries.length > 0) {
// 				// 	for (let country of countries) {
// 				// 		let country_ = country.convertToJSON();
// 				// 		if (country_.name == userDetails.country) {
// 				// 			country_code = country_.callingCode;
// 				// 		}
// 				// 	}
// 				// }

// 				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 				if (email || phone_number) {
// 					///check if email or phone or whatsapp origin
// 					if (phone_number && appBranding && appBranding.isWhatsAppOTP) {
// 						[err, countries] = await to(
// 							Country.findOne({
// 								where: {
// 									name: userDetails.country,
// 								},
// 								attributes: ['id', 'name', 'callingCode'],
// 								order: [['name', 'ASC']],
// 							})
// 						);
// 						if (err) return ResponseError(res, err, 500, true);

// 						if (countries) {
// 							country_code = countries.callingCode;
// 						}

// 						let isValidLicence;
// 						// isValidLicence = await getValidationForSendDripWithCount(userDetails.clientId, 'Only WhatsApp');
// 						// let count = isValidLicence.count;
// 						// console.log('--isValidLicence---', isValidLicence);
// 						// console.log('--count---', count);
// 						console.log('-----send otp on whatsapp---');
// 						// if (isValidLicence.unlimited || count > 0) {
// 						[err, client_WhatsAppSetup_] = await to(
// 							ClientWhatsAppSetup.findOne({
// 								where: {
// 									ClientId: userDetails.clientId,
// 								},
// 								include: [
// 									{
// 										model: WhatsAppSetup,
// 										where: {
// 											status: 'Active',
// 										},
// 										attributes: ['id', 'user_id', 'password'],
// 									},
// 								],
// 								attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
// 							})
// 						);
// 						if (err) return ResponseError(res, err, 500, true);
// 						if (
// 							client_WhatsAppSetup_ &&
// 							client_WhatsAppSetup_.WhatsAppSetup &&
// 							client_WhatsAppSetup_.WhatsAppSetup.user_id
// 						) {
// 							let msgString = 'is your verification code. For your security, do not share this code.';
// 							let params = {
// 								userid: parseInt(client_WhatsAppSetup_.WhatsAppSetup.user_id),
// 								password: client_WhatsAppSetup_.WhatsAppSetup.password,
// 								send_to: country_code + phone_number,
// 								v: `1.1`,
// 								format: `json`,
// 								msg_type: 'TEXT',
// 								method: 'SENDMESSAGE',
// 								msg: `${random.toString()}` + ' ' + convertSpecialChar(msgString),
// 								isTemplate: true,
// 							};

// 							console.log('-<<<<---SEND WhatsApp OTP Params-->>>>-', params);

// 							console.log(
// 								'<<<<<----Url-- ---WhatsApp-OTP--SEND -->>>>>>>>>>>>>>',
// 								`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
// 							);

// 							const response = await axios.get(
// 								`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
// 							);
// 							console.log('-<<<<--Send WhatsApp OTP response--->>>>-', response.data);
// 							sendingPlatform = 'WhatsApp';
// 							if (response && response.data.response.status == 'success') {
// 								//consume one count in only whatsapp count
// 								// await updateDripMultipleCountInLicense(userDetails.clientId, 'Only WhatsApp', 1);
// 								success = 'WhatsAppMSG';
// 								console.log('--success-', success);
// 							} else {
// 								failed = 'WhatsAppMSG';
// 								console.log('--failed-', failed);
// 							}
// 						} else {
// 							failed = 'WhatsAppMSG';
// 							console.log('--Invalid Whatsapp Setup--');
// 						}
// 						// } else {
// 						// 	failed = 'WhatsAppMSG';
// 						// 	console.log('--Invalid License to send OTP-');
// 						// }
// 					} else if (phone_number && userDetails.country == 'India') {
// 						console.log('-userDetails-', userDetails);
// 						console.log('-----send otp on sms---');
// 						sendingPlatform = 'SMS';
// 						[err, sendOTP] = await to(sendMessage(data.phone, '', random.toString(), userDetails.clientId, type));
// 						if (err) {
// 							console.log('Error in Karix', err);
// 							failed = 'SMS';
// 						} else {
// 							success = 'SMS';
// 						}
// 					} else if (email && userDetails.otp && userDetails.email && userDetails.email.length > 0) {
// 						console.log('-----send otp on email---');
// 						sendingPlatform = 'Email';
// 						[err, mailedOTP] = await to(sendOTPMail(userDetails.email, random.toString(), type));
// 						if (err) {
// 							console.log('Error in Sendgrid', err);
// 							failed = 'e-mail';
// 						} else {
// 							success = 'e-mail';
// 						}
// 					}

// 					let msg = failed ? `${failed}  ${MESSAGE.OTP_FAIL}  ${success}` : `${MESSAGE.SENT_IN_EMAIL}`;
// 					if (success) {
// 						return ResponseSuccess(res, {
// 							message: MESSAGE.OTP_SENT,
// 							data: msg,
// 							sendingPlatform: sendingPlatform,
// 						});
// 					} else {
// 						if (phone_number && userDetails.country !== 'India') {
// 							return ResponseError(
// 								res,
// 								{
// 									message: MESSAGE.MOBILE_NO_LOGIN_NOT_SUPPORTED,
// 								},
// 								400
// 							);
// 						} else {
// 							return ResponseError(
// 								res,
// 								{
// 									message: MESSAGE.OTP_GENERATE_FAIL,
// 								},
// 								400
// 							);
// 						}
// 					}
// 				} else {
// 					return ResponseError(
// 						res,
// 						{
// 							message: MESSAGE.OTP_GENERATE_FAIL,
// 						},
// 						400
// 					);
// 				}
// 			} else {
// 				if (userDetails && userDetails.status != true) {
// 					return ResponseError(res, {
// 						message: MESSAGE.USER_NOT_ACTIVE,
// 					});
// 				} else {
// 					return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
// 				}
// 			}
// 		}
// 	} catch (err) {
// 		return ResponseError(res, err, 500, true);
// 	}
// };
// module.exports.genaratePWAOtp = genaratePWAOtp;

// API to login with phone number and One Time Password

// const login = async function (req, res) {
// 	try {
// 		const type = req.params.type;

// 		if (!checkProjectNameByType(type)) {
// 			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 400);
// 		}

// 		const schema = Joi.object({
// 			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
// 			momentDate: Joi.string()
// 				.pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4} ([01][0-9]|2[0-3]):([0-5][0-9])$/)
// 				.message('Date must be in DD-MM-YYYY HH:mm format')
// 				.required(),
// 			email: Joi.string().email().required(),
// 			otp: Joi.string().min(4).max(4).required(),
// 		});
// 		const { error, value } = schema.validate(req.body);
// 		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

// 		const body = req.body;
// 		let err, child, roles, children;
// 		// let type = req.params.type;
// 		var user;
// 		[err, user] = await to(authService.authUser(req.body));
// 		if (err) return ResponseError(res, err, 500);
// 		let user_info = {};
// 		[err, roles] = await to(user.globalUser.getRoles());
// 		if (err) return ResponseError(res, err, 500, true);
// 		let userRoles = [];
// 		for (let i in roles) {
// 			if (roles[i].User_role_client_mapping.RoleId != 1) {
// 				[err, client] = await to(
// 					Client.findOne({
// 						where: {
// 							id: roles[i].User_role_client_mapping.ClientId,
// 						},
// 						include: [
// 							{
// 								model: Country,
// 								through: 'Client_country_mapping',
// 							},
// 						],
// 					})
// 				);
// 				if (type == 'drip' && roles[i].dripRole && client.DripAccess) {
// 					userRoles.push({
// 						role: roles[i].name,
// 						client: client,
// 						roleId: roles[i].id,
// 					});
// 				} else if (type == 'diwo' && roles[i].diwoRole && client.DiwoAccess) {
// 					userRoles.push({
// 						role: roles[i].name,
// 						client: client,
// 						roleId: roles[i].id,
// 					});
// 				}
// 			}
// 		}
// 		user_info = user.localUser.convertToJSON();
// 		user_info.roles = userRoles;
// 		user_info.id = user.globalUser.id;
// 		user_info.isReg_Completed = user.globalUser.isReg_Completed;
// 		user_info.Market = user.market;
// 		user_info.client = user.client;
// 		user_info.userPolicyDetails = user.globalUser.userPolicyDetails;
// 		user_info.acceptPolicy = user.globalUser.acceptPolicy;
// 		user_info.opt_in = user.globalUser.opt_in;
// 		user_info.opt_out = user.globalUser.opt_out;
// 		user_info.account_id = user.globalUser.account_id;
// 		user_info.acceptOptInByUser = user.globalUser.acceptOptInByUser;
// 		user_info.firstLogin = user.globalUser.firstLogin;
// 		user_info.lastLogin = user.globalUser.lastLogin;
// 		if (user.globalUser.access_token && user.globalUser.refresh_token) {
// 			user_info.access_token = true;
// 		} else {
// 			user_info.access_token = false;
// 		}
// 		delete user_info.otp;

// 		if (user_info) {
// 			if (!user_info.firstLogin) {
// 				user_info.firstLogin = moment().format('YYYY-MM-DD HH:mm:ss');
// 			}
// 			user_info.lastLogin = moment().format('YYYY-MM-DD HH:mm:ss');
// 			[err, UpdateUserDetails] = await to(
// 				User.update(
// 					{
// 						firstLogin: user_info.firstLogin,
// 						lastLogin: user_info.lastLogin,
// 					},
// 					{
// 						where: {
// 							id: user_info.id,
// 						},
// 					}
// 				)
// 			);
// 			if (err) return ResponseError(res, err, 500, true);
// 		}

// 		let notifcationMessage = MESSAGE.LOGIN;
// 		notifcationMessage = notifcationMessage.replace('{{date}}', req.body.momentDate);
// 		if (type == 'drip') {
// 			await createNotification(notifcationMessage, ['Bell'], [user_info.id]);

// 			console.log('--userRoles--', userRoles[0].client.convertToJSON().id);

// 			if (userRoles && userRoles.length === 1) {
// 				[err, newLog] = await to(
// 					createlog(
// 						user_info.id,
// 						userRoles[0].client.id,
// 						userRoles[0].roleId,
// 						`Admin Login`,
// 						req.ip,
// 						req.useragent,
// 						'drip',
// 						null
// 					)
// 				);
// 				if (err) return ResponseError(res, err, 500, true);
// 			}
// 		} else if (type == 'diwo') {
// 			await createNotificationforDiwo(notifcationMessage, ['Bell'], [user_info.id]);

// 			if (userRoles && userRoles.length === 1) {
// 				[err, newLog] = await to(
// 					createlog(
// 						user_info.id,
// 						userRoles[0].client.id,
// 						userRoles[0].roleId,
// 						`Admin Login`,
// 						req.ip,
// 						req.useragent,
// 						'diwo',
// 						null
// 					)
// 				);
// 				if (err) return ResponseError(res, err, 500, true);
// 			}
// 		}
// 		const token = user.globalUser.getJWT(user_info.roles[0].roleId, user_info.roles[0].client.id, type);
// 		// Set token as an HTTP-only cookie
// 		res.cookie('jwt', token, {
// 			httpOnly: true, // Prevent JavaScript access
// 			secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
// 			sameSite: 'Lax', // Prevent CSRF attacks
// 			maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
// 			//domain: 'qa11.gobablr.com',
// 		});

// 		return ResponseSuccess(res, { user: user_info });

// 		// console.log('-user.globalUser-', user.globalUser);
// 		// return ResponseSuccess(res, {
// 		// 	token: user.globalUser.getJWT(user_info.roles[0].roleId, user_info.roles[0].client.id, type),
// 		// 	user: user_info,
// 		// });
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.login = login;

const logout = async function (req, res) {
	try {
		let text = 'Admin Logout';

		//need to Clear a JWT Cookie
		res.clearCookie('jwt', {
			httpOnly: true,
			secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
			sameSite: 'Lax', // Prevent CSRF attacks
		});

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, text, req.ip, req.useragent, req.user.type, null)
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { message: 'Logout Successfully!!' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.logout = logout;

const PWALogout = async function (req, res) {
	try {
		let text = 'PWA Logout';

		const schema = Joi.object({
			UserId: Joi.number().integer().positive().required(),
			ClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			UserId: req.body.UserId,
			ClientId: req.body.ClientId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { UserId, ClientId } = value;

		//need to Clear a JWT Cookie
		// let UserId = req.body.UserId;
		// let ClientId = req.body.ClientId;
		let RoleId = 1;
		let type = req.body.type;

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		res.clearCookie('jwt', {
			httpOnly: true,
			secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
			sameSite: 'Lax', // Prevent CSRF attacks
		});

		[err, newLog] = await to(createlog(UserId, ClientId, RoleId, text, req.ip, req.useragent, type, null));
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, { message: 'Logout Successfully!!' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.PWALogout = PWALogout;

const updateAdminUserToken = async function (req, res) {
	try {
		const schema = Joi.object({
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			roleId: req.body.RoleId,
			clientId: req.body.ClientId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { roleId, clientId } = value;

		// if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
		// 	return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		// }

		let userId = req.user.id;
		// let clientId = req.body.ClientId;
		// let roleId = req.body.RoleId;
		let type = req.user.type;

		//Check this combination is valid or not
		let whereCondition = {
			UserId: userId,
			ClientId: clientId,
			RoleId: roleId,
		};
		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}
		[err, checkCombination] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [{ model: User }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (checkCombination) {
			[err, newLog] = await to(createlog(userId, clientId, roleId, `Admin Login`, req.ip, req.useragent, type, null));
			if (err) return ResponseError(res, err, 500, true);

			//Clear First JWT tokken
			// res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'Strict' });

			const token = checkCombination.User.getJWT(roleId, clientId, type);
			// Set token as an HTTP-only cookie
			res.cookie('jwt', token, {
				httpOnly: true, // Prevent JavaScript access
				secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
				sameSite: env == 'development' || env == 'dev' || env == 'local' ? 'Lax' : 'Strict', // Prevent CSRF attacks
				maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
				//domain: 'qa11.gobablr.com',
			});

			return ResponseSuccess(res, {
				// token: checkCombination.User.getJWT(roleId, clientId, type),
			});
		} else {
			return ResponseError(res, MESSAGE.USER_NOT_REGISTERED, 400);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateAdminUserToken = updateAdminUserToken;

// API to login with phone number and One Time Password
// const pwaLogin = async function (req, res) {
// 	try {
// 		const body = req.body;
// 		let err, userClientRoleDetails; // Declare variables
// 		let type = req.params.type;

// 		// Authenticate user using authService
// 		const all_user_ids = await to(authService.pwaAuthUser(req.body, type));

// 		if (all_user_ids[0]) {
// 			// Check for error in authService
// 			return ResponseError(res, all_user_ids[0], 500); // Handle error
// 		}

// 		// Define where conditions based on type
// 		let whereCondition = {
// 			UserId: all_user_ids[1],
// 		};
// 		if (type === 'drip') {
// 			whereCondition.forDrip = true;
// 			whereCondition.RoleId = 1;
// 		} else if (type === 'diwo') {
// 			whereCondition.forDiwo = true;
// 			whereCondition.RoleId = [1, 11];
// 		}

// 		// Fetch user details with client and role information
// 		[err, userClientRoleDetails] = await to(
// 			User_role_client_mapping.findAll({
// 				where: whereCondition,
// 				include: [
// 					{ model: Client },
// 					{ model: Role, attributes: ['id', 'name'] },
// 					{
// 						model: User,
// 						include: [
// 							{
// 								model: Market,
// 								attributes: ['id', 'name', 'db_name', 'tosUrl', 'privacyPolicyUrl', 'dpaUrl', 'cookiePolicyUrl'],
// 							},
// 						],
// 					},
// 				],
// 			})
// 		);
// 		if (err) {
// 			return ResponseError(res, err, 500); // Handle error
// 		}

// 		if (userClientRoleDetails.length == 1) {
// 			//Get Personal data
// 			[err, localData] = await to(
// 				dbInstance[userClientRoleDetails[0].User.Market.db_name].User_master.findOne({
// 					where: {
// 						id: userClientRoleDetails[0].User.local_user_id,
// 					},
// 					attributes: ['first', 'last', 'phone', 'email', 'city', 'country', 'imagePath', 'isDeleted'],
// 				})
// 			);
// 			if (err) ThrowException(err.message);
// 			let user_info = userClientRoleDetails[0].User.convertToJSON();
// 			user_info = { ...user_info, ...localData.convertToJSON() };

// 			user_info.roles = [
// 				{
// 					role: userClientRoleDetails[0].Role.name,
// 					client: userClientRoleDetails[0].Client,
// 					roleId: userClientRoleDetails[0].Role.id,
// 				},
// 			];

// 			user_info.Market = userClientRoleDetails[0].User.Market;
// 			user_info.client = userClientRoleDetails[0].Client;

// 			delete user_info.otp;

// 			//Update First Login and Last Login Date and Time
// 			if (user_info) {
// 				if (!user_info.firstLogin) {
// 					user_info.firstLogin = moment().format('YYYY-MM-DD HH:mm:ss');
// 				}
// 				user_info.lastLogin = moment().format('YYYY-MM-DD HH:mm:ss');
// 				[err, UpdateUserDetails] = await to(
// 					User.update(
// 						{
// 							firstLogin: user_info.firstLogin,
// 							lastLogin: user_info.lastLogin,
// 						},
// 						{
// 							where: {
// 								id: user_info.id,
// 							},
// 						}
// 					)
// 				);
// 				if (err) return ResponseError(res, err, 500, true);
// 			}

// 			// Create a notification message based on 'type' and call respective notification function
// 			let notificationMessage = MESSAGE.LOGIN.replace('{{date}}', req.body.momentDate);
// 			if (type === 'drip') {
// 				createNotification(notificationMessage, ['Bell'], [user_info.id]);
// 			} else if (type === 'diwo') {
// 				createNotificationforDiwo(notificationMessage, ['Bell'], [user_info.id]);
// 			}

// 			/// Create Log For System Logs
// 			createlog(
// 				user_info.id,
// 				userClientRoleDetails[0].Client.id,
// 				userClientRoleDetails[0].Role.id,
// 				`PWA Login`,
// 				req.ip,
// 				req.useragent,
// 				type,
// 				null
// 			);

// 			// Sending JWT token and formatted user info in the response

// 			const token = await userClientRoleDetails[0].User.getJWT(
// 				userClientRoleDetails[0].RoleId,
// 				userClientRoleDetails[0].ClientId,
// 				type
// 			);

// 			// Set token as an HTTP-only cookie
// 			res.cookie('jwt', token, {
// 				httpOnly: true, // Prevent JavaScript access
// 				secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
// 				sameSite: 'Lax', // Prevent CSRF attacks
// 				maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
// 				//domain: 'qa11.gobablr.com',
// 			});

// 			return ResponseSuccess(res, {
// 				// token: token,
// 				user: userClientRoleDetails,
// 			});
// 		}

// 		return ResponseSuccess(res, {
// 			user: userClientRoleDetails, // Send user details in response
// 		});
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true); // Handle catch error
// 	}
// };
// module.exports.pwaLogin = pwaLogin;

//Get JWT Token for PWALearner based on user type (drip or diwo)
const getPWALearnerJWTToken = async function (req, res) {
	try {
		const schema = Joi.object({
			UserId: Joi.number().integer().positive().required(),
			ClientId: Joi.number().integer().positive().required(),
			RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
		});

		const { error, value } = schema.validate({
			UserId: req.body.UserId,
			ClientId: req.body.ClientId,
			RoleId: req.body.RoleId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { UserId, ClientId, RoleId } = value;

		let type = req.params.type;

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let whereCondition = {
			UserId: UserId,
			ClientId: ClientId,
			RoleId: RoleId,
		};

		// Setting condition based on 'type'
		if (type === 'drip') {
			whereCondition.forDrip = true;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
		}

		// Fetching user details with role, client, and market information
		[err, validateUserInfo] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [
					{ model: Client },
					{
						model: User,
						include: [
							{
								model: Market,
								attributes: ['id', 'name', 'db_name', 'tosUrl', 'privacyPolicyUrl', 'dpaUrl', 'cookiePolicyUrl'],
							},
						],
					},
					{ model: Role },
				],
			})
		);
		if (err) return ResponseError(res, err, 500);

		// Handling case when user info is not found
		if (!validateUserInfo) {
			return ThrowException(MESSAGE.NOT_LEARNER_USER);
		} else {
			// Extracting and formatting user information
			[err, localData] = await to(
				dbInstance[validateUserInfo.User.Market.db_name].User_master.findOne({
					where: {
						id: validateUserInfo.User.local_user_id,
					},
				})
			);

			if (err) ThrowException(err.message);

			let user_info = validateUserInfo.User.convertToJSON();
			user_info.first = localData.first;
			user_info.last = localData.last;
			user_info.phone = localData.phone;
			user_info.email = localData.email;
			user_info.city = localData.city;
			user_info.country = localData.country;
			user_info.imagePath = localData.imagePath;
			user_info.isDeleted = localData.isDeleted;

			user_info.roles = [
				{ role: validateUserInfo.Role.name, client: validateUserInfo.Client, roleId: validateUserInfo.Role.id },
			];

			user_info.Market = validateUserInfo.User.Market;
			user_info.client = validateUserInfo.Client;
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

			// Create a notification message based on 'type' and call respective notification function
			let notificationMessage = MESSAGE.LOGIN.replace('{{date}}', req.body.momentDate);
			if (type === 'drip') {
				await createNotification(notificationMessage, ['Bell'], [user_info.id]);
				//For Log
				[err, newLog] = await to(
					createlog(user_info.id, req.body.ClientId, req.body.RoleId, `PWA Login`, req.ip, req.useragent, 'drip', null)
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type === 'diwo') {
				await createNotificationforDiwo(notificationMessage, ['Bell'], [user_info.id]);
				//For Log
				[err, newLog] = await to(
					createlog(user_info.id, req.body.ClientId, req.body.RoleId, `PWA Login`, req.ip, req.useragent, 'diwo', null)
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			const token = await validateUserInfo.User.getJWT(req.body.RoleId, req.body.ClientId, type);

			// Set token as an HTTP-only cookie
			res.cookie('jwt', token, {
				httpOnly: true, // Prevent JavaScript access
				secure: env == 'development' || env == 'dev' || env == 'local' ? false : true,
				sameSite: env == 'development' || env == 'dev' || env == 'local' ? 'Lax' : 'Strict',
				maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
				//domain: 'qa11.gobablr.com',
			});

			// Sending JWT token and formatted user info in the response
			return ResponseSuccess(res, {
				// token: validateUserInfo.User.getJWT(req.body.RoleId, req.body.ClientId, type),
				user: user_info,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getPWALearnerJWTToken = getPWALearnerJWTToken;

const registerLearnerForSessionCode = async function (req, res) {
	try {
		let userInfo = req.body;
		let dripCheckCount;
		let checkCount;
		let random = Math.floor(1000 + Math.random() * 9000);
		userInfo.otp = random.toString();
		let userdata;
		let userAllPersnalDatas = [];
		let localUserIds = [];
		let userGlobalDataDetail;
		let session;
		let sessionUser_;

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

		if (userInfo && userInfo.sessioncode) {
			//Check Session Client id and User Client Id and then deside need to creating new user or not
			let userIds = [];
			let user_roles;
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

			//Get all Branch id under the session client
			let branchIds = await getAllSubBranchAccountLists(session.Client.id, false);

			// Get all user role for the user
			if (userIds.length > 0) {
				[err, user_roles] = await to(
					User_role_client_mapping.findOne({
						where: {
							ClientId: branchIds,
							UserId: userIds,
							forDiwo: true,
							RoleId: [1, 11],
						},
					})
				);
				if (err) ThrowException(err.message);
			}

			// Check if user already present in the session client

			sessionData = session.convertToJSON();

			let workbookData_ = JSON.parse(sessionData.workbookData);
			checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(sessionData.ClientId);

			if (userInfo.addForDrip) {
				dripCheckCount = await getLearnerValidaionOnCreateLearner(userInfo.branch);
				if (dripCheckCount) {
					userInfo.addForDrip = true;
				} else {
					userInfo.addForDrip = false;
				}
			}

			if (workbookData_.allowNewLearner == true && checkCount) {
				userdata = userInfo;
				userdata.MarketId = markets.id;
				userdata.CountryId = markets.Countries[0].id;
				userdata.status = true;
				userdata.is_verified = false;
				userdata.is_deleted = false;
				userdata.type = 'Learner';
				userdata.account_id = '0';
				userdata.local_user_id = null;
				userdata.cStatus = 'Active';
				userdata.forDiwo = true;
				userdata.isReg_Completed = false;

				userdata.first = await capitalFirstLatter(userdata.first);
				userdata.last = await capitalFirstLatter(userdata.last);

				userdata.tags = userdata && userdata.tags ? userdata.tags.join(',') : null;
				userdata.customFields = userdata && userdata.customFields ? userdata.customFields : null;
				userdata.addForDrip = userdata.addForDrip;

				if (workbookData_.allowNewLearner && !workbookData_.newRegProvisional) {
					userdata.spotReg = 'Approved';
				} else if (workbookData_.allowNewLearner && workbookData_.newRegProvisional) {
					userdata.spotReg = 'Provisional';
					userdata.isLeanerSpotReg = true;
				} else {
					userdata.spotReg = 'NA';
				}

				[err, userGlobalDataDetail] = await to(User.create(userdata));
				if (err) ThrowException(err.message);

				await updateUserAccountId();
				userdata.password = await hashPassword(userdata.password);
				console.log('-- Hashed Password spot registration--', userdata.password);

				[err, createLocalUser] = await to(dbInstance[markets.db_name].User_master.create(userdata));
				if (err) ThrowException(err.message);

				userGlobalDataDetail.local_user_id = createLocalUser.id;
				localUserId = createLocalUser.id;
				userAllPersnalDatas.push(createLocalUser);
				localUserIds.push(createLocalUser.id);

				[err, updateUser] = await to(
					User.update(
						{
							local_user_id: createLocalUser.id,
						},
						{
							where: {
								id: userGlobalDataDetail.id,
							},
						}
					)
				);
				if (err) ThrowException(err.message);

				if (userdata && userdata.jobRole) {
					let payload = {
						job_role_name: userdata.jobRole.job_role_name,
						details: userdata.jobRole.details,
						ClientId: userdata.branch,
						forDiwo: true,
						forDrip: userdata.addForDrip,
					};

					[err, createRole] = await to(Client_job_role.create(payload));
					if (err) return ResponseError(res, err, 500, true);

					[err, addUserJobRole] = await to(
						User_job_role_mapping.create({
							UserId: userId,
							ClientJobRoleId: createRole.id,
							forDiwo: true,
							forDrip: userDetails.addForDrip,
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				// Create User Role
				let payload = {
					RoleId: 1, //Learner Role
					UserId: userGlobalDataDetail.id,
					forDiwo: true,
					ClientId: branchIds[0],
				};

				[err, create_user_role] = await to(User_role_client_mapping.create(payload));
				if (err) ThrowException(err.message);

				if (checkCount) {
					await getAddOneLearnerCountForDiwo(sessionData.ClientId);
				}

				if (dripCheckCount) {
					await getAddOneLearnerCount(userdata.branch);
				}

				[err, workBookAssets] = await to(
					DiwoAsset.findAll({
						where: {
							WorkbookId: session.WorkbookId,
							WorksheetId: {
								[Op.eq]: null,
							},
							QuestionId: {
								[Op.eq]: null,
							},
						},
					})
				);

				console.log('-workBookAssets-', workBookAssets);

				[err, sessionUser_] = await to(
					SessionUser.findOne({
						where: {
							WorkbookId: session.WorkbookId,
						},
						attributes: ['id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				console.log('-sessionUser_-', sessionUser_);

				if (workBookAssets && workBookAssets.length > 0) {
					let sessionWorkBookAsset = [];

					for (let workBookAsset of workBookAssets) {
						sessionWorkBookAsset.push({
							ClientId: session.ClientId,
							SessionUserId: sessionUser_ ? sessionUser_.id : null,
							path: workBookAsset.path,
							filename: workBookAsset.fileName,
							type: workBookAsset.type,
							forBrief: workBookAsset.forBrief,
							isTranscoding: workBookAsset.isTranscoding,
							vmoVideoId: workBookAsset.vmoVideoId ? workBookAsset.vmoVideoId : null,
							cmsVideoId: workBookAsset.cmsVideoId ? workBookAsset.cmsVideoId : null,
							MediaCMSUploadQueueId: workBookAsset.MediaCMSUploadQueueId ? workBookAsset.MediaCMSUploadQueueId : null,
						});
					}

					console.log('-sessionWorkBookAsset-', sessionWorkBookAsset);
					[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
					if (err) return ResponseError(res, err, 500, true);
				}

				[err, localUsers] = await to(
					dbInstance[markets.db_name].User_master.findOne({
						where: {
							id: createLocalUser.id,
						},
						attributes: ['first', 'email', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, clientData] = await to(
					User_role_client_mapping.findOne({
						where: {
							RoleId: 1,
							UserId: userGlobalDataDetail.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (clientData && clientData.ClientId) {
					checkAndTriggeredWelcomeEmailForDiwo([localUsers.email], clientData.ClientId);
				}
			} else if (workbookData_.allowNewLearner == false) {
				return ResponseError(res, { error: MESSAGE.YOU_ARE_NOT_REGISTERED_LEARNER_PLEASE_CONTACT_TRAINING_ADMIN });
			} else {
				return ResponseError(res, { error: MESSAGE.NO_PERMISSION_TO_CREATE_SPOT_REGISRATION });
			}
			// }
		}

		console.log('-userdata-', userdata);
		// return;

		// [err, userInfo] = await to(
		// 	User.findOne({
		// 		where: {
		// 			id: userId,
		// 			status: true,
		// 			is_deleted: false,
		// 			cStatus: 'Active',
		// 		},
		// 		include: [
		// 			{
		// 				model: Market,
		// 				attributes: ['db_name'],
		// 			},
		// 		],
		// 		attributes: ['id', 'local_user_id', 'status', 'is_deleted'],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// forDripLicense Add Count
		// if (userDetails.addForDrip) {
		// 	dripCheckCount = await getLearnerValidaionOnCreateLearner(userDetails.branch);
		// 	if (dripCheckCount) {
		// 		userDetails.addForDrip = true;
		// 	} else {
		// 		userDetails.addForDrip = false;
		// 	}
		// }

		// if (userInfo) {
		// 	let learnerTags_ = userDetails && userDetails.tags ? userDetails.tags.join(',') : null;
		// 	let customFields_ = userDetails && userDetails.customFields ? userDetails.customFields : null;
		// 	[err, UpdateUserDetails] = await to(
		// 		User.update(
		// 			{
		// 				tags: learnerTags_,
		// 				isReg_Completed: true,
		// 				customFields: customFields_,
		// 				forDrip: userDetails.addForDrip,
		// 			},
		// 			{
		// 				where: {
		// 					id: userInfo.id,
		// 				},
		// 			}
		// 		)
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);

		// 	userDetails.first = await capitalFirstLatter(userDetails.first);
		// 	userDetails.last = await capitalFirstLatter(userDetails.last);

		// 	[err, localUser] = await to(
		// 		dbInstance[userInfo.Market.db_name].User_master.update(userDetails, {
		// 			where: {
		// 				id: userInfo.local_user_id,
		// 			},
		// 		})
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);

		// 	let payload = {};
		// 	if (userDetails && userDetails.branch != null && userDetails.branch != undefined && userDetails.branch != '') {
		// 		payload.ClientId = userDetails.branch;
		// 		payload.forDrip = userDetails.addForDrip;
		// 	}

		// 	[err, create_user_role] = await to(
		// 		User_role_client_mapping.update(payload, {
		// 			where: {
		// 				RoleId: 1,
		// 				UserId: userId,
		// 				forDiwo: true,
		// 			},
		// 		})
		// 	);
		// 	if (err) ThrowException(err.message);

		// 	if (userDetails && userDetails.jobRole) {
		// 		let payload = {
		// 			job_role_name: userDetails.jobRole.job_role_name,
		// 			details: userDetails.jobRole.details,
		// 			ClientId: userDetails.branch,
		// 			forDiwo: true,
		// 			forDrip: userDetails.addForDrip,
		// 		};

		// 		[err, createRole] = await to(Client_job_role.create(payload));
		// 		if (err) return ResponseError(res, err, 500, true);

		// 		[err, addUserJobRole] = await to(
		// 			User_job_role_mapping.create({
		// 				UserId: userId,
		// 				ClientJobRoleId: createRole.id,
		// 				forDiwo: true,
		// 				forDrip: userDetails.addForDrip,
		// 			})
		// 		);
		// 		if (err) return ResponseError(res, err, 500, true);
		// 	}

		// 	if (dripCheckCount) {
		// 		await getAddOneLearnerCount(userDetails.branch);
		// 	}

		// 	[err, localUsers] = await to(
		// 		dbInstance[userInfo.Market.db_name].User_master.findOne({
		// 			where: {
		// 				id: userInfo.local_user_id,
		// 			},
		// 			attributes: ['first', 'email', 'last'],
		// 		})
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);

		// 	[err, clientData] = await to(
		// 		User_role_client_mapping.findOne({
		// 			where: {
		// 				RoleId: 1,
		// 				UserId: userInfo.id,
		// 			},
		// 		})
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);
		// 	if (clientData && clientData.ClientId)
		// 		checkAndTriggeredWelcomeEmailForDiwo([localUsers.email], clientData.ClientId);
		// }

		return ResponseSuccess(res, {
			isCreated: true,
			message: MESSAGE.LEARNER_REGISTER,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.registerLearnerForSessionCode = registerLearnerForSessionCode;

const checkAndTriggeredWelcomeEmailForDiwo = async function (userEmail, clientId) {
	try {
		let appBranding;
		let flag = true;
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [
					{
						model: DiwoSystemBranding,
						attributes: [
							'id',
							'welcomeEmail',
							'welcomeSubject',
							'welcomeBody',
							'welcomeButton',
							'EmailSenderId',
							'EmailSenderName',
							'EmailTemplateId',
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.SystemBrandingId) {
			appBranding = client.DiwoSystemBranding.convertToJSON();
		} else {
			let parentClientId = client.Associate_client_id;

			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
						include: [
							{
								model: DiwoSystemBranding,
								attributes: [
									'id',
									'welcomeEmail',
									'welcomeSubject',
									'welcomeBody',
									'welcomeButton',
									'EmailSenderId',
									'EmailSenderName',
									'EmailTemplateId',
								],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClient && parentClient.SystemBrandingId) {
					appBranding = parentClient.DiwoSystemBranding.convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
		if (appBranding && appBranding.welcomeEmail) {
			// Send Email
			//Create A Log
			// let emailDetails = await getClientEmailConfigrationDetails(clientId);
			let personalisations = {};
			let emailData = [];
			let redirct_url = `${CONFIG.drip_host}`;
			for (let email of userEmail) {
				personalisations.to = email;
				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						Subject: appBranding.welcomeSubject,
						Body: appBranding.welcomeBody,
						Button_Name: appBranding.welcomeButton,
						Button_URL: redirct_url,
					};
					emailData.push(personalisations);
				}
			}
			sendDripEmail(emailData, appBranding);
			isTriggered = true;
		}
	} catch (error) {
		console.log('----Error when Check and Triggered Welcome Email--', error);
	}
};
module.exports.checkAndTriggeredWelcomeEmailForDiwo = checkAndTriggeredWelcomeEmailForDiwo;

// const paginate = function (array, page_size, page_number) {
// 	return array.slice((page_number - 1) * page_size, page_number * page_size);
// };

const getClientAllAdminUser = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});
		const { error, value } = schema.validate({
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;
		const type = req.user.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		//Check Client Access
		if (!(await checkClientIdAccess(clientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allUserData, err;
		let allData = [];
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClientsId = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let offset = 0;
		let response;

		offset = (page - 1) * limit;

		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: childClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		// Main Parent Client Id;
		if (type == 'drip' && ClientsDetail.DripAccess) {
			finalArrayOfClientsId.push(ClientsDetail.id);
		} else if (type == 'diwo' && ClientsDetail.DiwoAccess) {
			finalArrayOfClientsId.push(ClientsDetail.id);
		}

		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				if (ClientsDetail[i] && ClientsDetail[i].id) {
					childClientId.push(ClientsDetail[i].id);
					let client = ClientsDetail[i];
					let client_ = client.convertToJSON();
					[err, parentClientsDetail] = await to(
						Client.findOne({
							where: {
								is_deleted: false,
								id: client_.Associate_client_id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (parentClientsDetail) {
						client_.Parent_client = parentClientsDetail.convertToJSON();
						if (type == 'drip' && client_.DripAccess) {
							finalArrayOfClientsId.push(client_.id);
						} else if (type == 'diwo' && client_.DiwoAccess) {
							finalArrayOfClientsId.push(client_.id);
						}
					}
				} else {
					continue;
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}

		if (type == 'drip') {
			[err, allUserData] = await to(
				User_role_client_mapping.findAndCountAll({
					where: {
						ClientId: finalArrayOfClientsId,
						RoleId: {
							[Op.ne]: 1,
						},
						forDrip: true,
					},

					include: [
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
								forDrip: true,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
						{
							model: Role,
							where: {
								dripRole: true,
							},
						},
						{
							model: Client,
							where: {
								DripAccess: true,
							},
						},
					],
					order: [
						[
							{
								model: User,
							},
							'createdAt',
							'DESC',
						],
					],
					offset: offset,
					limit: limit,
					subQuery: false,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, allUserData] = await to(
				User_role_client_mapping.findAndCountAll({
					where: {
						ClientId: finalArrayOfClientsId,
						RoleId: {
							[Op.ne]: 1,
						},
						forDiwo: true,
					},

					include: [
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
								forDiwo: true,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
						{
							model: Role,
							where: {
								diwoRole: true,
							},
						},
						{
							model: Client,
							where: {
								DiwoAccess: true,
							},
						},
					],
					order: [
						[
							{
								model: User,
							},
							'createdAt',
							'DESC',
						],
					],
					offset: offset,
					limit: limit,
					subQuery: false,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (allUserData && allUserData.rows.length > 0) {
			for (let allUser of allUserData.rows) {
				let userDetail = allUser.convertToJSON();
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					userDetail.User.first = localUser.first;
					userDetail.User.last = localUser.last;
					userDetail.User.email = localUser.email;
					userDetail.User.phone = localUser.phone;
					userDetail.User.imagePath = localUser.imagePath;
					userDetail.User.city = localUser.city;
				}

				allData.push(userDetail);
			}
		}
		// response = paginate(allData, limit, page);
		return ResponseSuccess(res, {
			data: allData,
			count: allUserData.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientAllAdminUser = getClientAllAdminUser;

const getClientAllAdminUserForEdit = async function (req, res) {
	try {
		const schema = Joi.object({
			parentClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			parentClientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { parentClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, parentClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allUserData, err;
		let allData = [];
		// let parentClientId = req.params.clientId;
		let flag = true;
		let finalArrayOfClientsId = [];
		let childClientId = [];

		// let type = req.params.type;

		let type = req.user.type;

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		childClientId.push(parentClientId);
		[err, ClientsDetail] = await to(
			Client.findOne({
				where: {
					is_deleted: false,
					id: childClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		// Main Parent Client Id;
		finalArrayOfClientsId.push(ClientsDetail.id);

		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
					if (type == 'drip' && client_.DripAccess) {
						finalArrayOfClientsId.push(client_.id);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						finalArrayOfClientsId.push(client_.id);
					}
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}

		let whereCondition = {
			status: true,
			is_deleted: false,
		};
		let whereConditionForRole = {};
		let whereConditionForClient = {};
		if (type == 'drip') {
			whereCondition.forDrip = true;
			whereConditionForRole.dripRole = true;
			whereConditionForClient.DripAccess = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
			whereConditionForRole.diwoRole = true;
			whereConditionForClient.DiwoAccess = true;
		}

		[err, allUserData] = await to(
			User_role_client_mapping.findAll({
				where: {
					ClientId: finalArrayOfClientsId,
					RoleId: {
						[Op.ne]: 1,
					},
				},

				include: [
					{
						model: User,
						where: whereCondition,
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
					{
						model: Role,
						where: whereConditionForRole,
					},
					{
						model: Client,
						where: whereConditionForClient,
					},
				],
				order: [
					[
						{
							model: User,
						},
						'createdAt',
						'DESC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (allUserData && allUserData.length > 0) {
			for (let allUser of allUserData) {
				let userDetail = allUser.convertToJSON();
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					userDetail.User.first = localUser.first;
					userDetail.User.last = localUser.last;
					userDetail.User.email = localUser.email;
					userDetail.User.phone = localUser.phone;
					userDetail.User.imagePath = localUser.imagePath;
					userDetail.User.city = localUser.city;
				}

				allData.push(userDetail);
			}
		}
		return ResponseSuccess(res, {
			data: allData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientAllAdminUserForEdit = getClientAllAdminUserForEdit;

const getSingleUserById = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { userId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let userId = parseInt(req.params.userId);
		// let clientId = parseInt(req.params.clientId);

		let type = req.user.type;
		let finalClientList = [];
		let userDetails;
		let err, ClientsDetail;
		let parentClientIds = [];

		let flag = true;
		let ArrayOfLastClient = [];
		let lastClientList = [];
		let UserLearnerClient;

		let whereCond = {
			forDrip: false,
			forDiwo: false,
		};

		if (type == 'drip') {
			whereCond.forDrip = true;
		} else if (type == 'diwo') {
			whereCond.forDiwo = true;
		}

		[err, user_details] = await to(
			User_role_client_mapping.findAll({
				where: {
					UserId: userId,
					[sequelize.Op.or]: whereCond,
				},
				include: [
					{
						model: User,
						where: {
							status: true,
							is_deleted: false,
						},
						attributes: ['id', 'type', 'country', 'status', 'local_user_id', 'account_id', 'MarketId'],
						include: [
							{
								model: Market,
								attributes: ['id', 'name', 'db_name'],
							},
							{
								model: Country,
								attributes: ['id', 'name'],
							},
						],
					},
					{
						model: Role,
						attributes: ['id', 'name'],
					},
					{
						model: Client,
						attributes: ['id', 'name', 'details', 'Associate_client_id', 'client_id', 'DripAccess', 'DiwoAccess'],
					},
				],
				order: [['createdAt', 'ASC']],
			})
		);

		if (err) return ResponseError(res, err, 500, true);
		if (user_details && user_details.length > 0) {
			for (let user of user_details) {
				if (finalClientList.length == 0) {
					let payload = {
						Client: user.Client,
						Roles: [user.Role.id],
						isAccess: false,
					};

					if (user.forDrip == true && user.forDiwo == true) {
						payload.isAccess = true;
					} else {
						payload.isAccess = false;
					}

					finalClientList.push(payload);
				} else {
					let flag = true;
					for (let client of finalClientList) {
						if (client.Client.id == user.Client.id) {
							flag = false;
							client.Roles.push(user.Role.id);
						}
					}
					if (flag) {
						let payload = {
							Client: user.Client,
							Roles: [user.Role.id],
							isAccess: false,
						};

						if (user.forDrip == true && user.forDiwo == true) {
							payload.isAccess = true;
						} else {
							payload.isAccess = false;
						}

						finalClientList.push(payload);
					}
				}
			}

			[err, parentClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: clientId,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			let parentClientsDetailJson = [];
			let Parentclient = [];
			for (let paratClient of parentClientsDetail) {
				parentClientsDetailJson.push(paratClient.convertToJSON());
			}

			for (let client of finalClientList) {
				let flag = false;
				for (let parentClient of parentClientsDetailJson) {
					if (parentClient.id == client.Client.id) {
						flag = true;
					}
				}
				if (!flag) {
					let whileflag = true;
					let clientId = client.Client.Associate_client_id;
					if (clientId) {
						let totalClientCount;
						let count = 0;

						[err, totalClientCount] = await to(Client.count());

						while (whileflag) {
							count++;
							if (count > totalClientCount) {
								flag = false;
								break;
							}

							[err, parentClientDetail] = await to(
								Client.findOne({
									where: {
										is_deleted: false,
										id: clientId,
									},
								})
							);

							if (err) return ResponseError(res, err, 500, true);

							if (parentClientDetail) {
								for (let parentClient of parentClientsDetailJson) {
									if (parentClient.id == parentClientDetail.id) {
										client.parentClient = parentClient;
										parentClientIds.push(parentClient.id);
										whileflag = false;
									}
								}
								if (whileflag) {
									if (parentClientDetail.Associate_client_id) {
										clientId = parentClientDetail.Associate_client_id;
									} else {
										whileflag = false;
									}
								}
							} else {
								whileflag = false;
							}
						}
					}
				}
			}

			[err, localUser] = await to(
				dbInstance[user_details[0].User.Market.db_name].User_master.findOne({
					where: {
						id: user_details[0].User.local_user_id,
					},
					attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode', 'country'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, user_Learnerdetails] = await to(
				User_role_client_mapping.findOne({
					where: {
						UserId: userId,
						RoleId: {
							[Op.eq]: 1,
						},
					},
					include: [
						{
							model: Client,
						},
					],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			for (let client of parentClientIds) {
				[err, ClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							Associate_client_id: client,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (!ClientsDetail) {
					[err, ClientsDetail] = await to(
						Client.findOne({
							where: {
								is_deleted: false,
								id: client,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					ArrayOfLastClient.push(ClientsDetail);
				}
			}

			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}

				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							is_deleted: false,
							Associate_client_id: parentClientIds,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				parentClientIds = [];

				if (ClientsDetail && ClientsDetail.length <= 0) {
					flag = false;
				}

				for (let i in ClientsDetail) {
					parentClientIds.push(ClientsDetail[i].id);
					let client = ClientsDetail[i];
					let client_ = client.convertToJSON();
					[err, parentClientsDetail] = await to(
						Client.findOne({
							where: {
								is_deleted: false,
								id: client_.Associate_client_id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					if (parentClientsDetail) {
						client_.Parent_client = parentClientsDetail.convertToJSON();
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						ArrayOfLastClient.push(client_);
					}
				}

				if (parentClientIds.length <= 0) {
					flag = false;
				}
			}

			for (let client of ArrayOfLastClient) {
				[err, parentClients] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							Associate_client_id: client.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (!parentClients) {
					if (lastClientList.length == 0) {
						lastClientList.push(client);
					} else {
						let flag = true;
						for (let client_ of lastClientList) {
							if (client.id == client_.id) {
								flag = false;
							}
						}
						if (flag) {
							lastClientList.push(client);
						}
					}
				}
			}

			if (err) return ResponseError(res, err, 500, true);

			userDetails = localUser.convertToJSON();
			if (user_Learnerdetails) {
				UserLearnerClient = user_Learnerdetails.Client;
			}
			LearnerClientList = lastClientList;
			userDetails.CountryId = user_details[0].User.Country.id;
		}
		return ResponseSuccess(res, {
			data: finalClientList,
			User: userDetails,
			UserLearnerClient: UserLearnerClient,
			LearnerClientList: LearnerClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSingleUserById = getSingleUserById;

const createUser = async function (req, res) {
	try {
		// Declare variables for potential errors and user creation
		let err, createUser;

		// Variables to store whether a phone number or email already exists locally
		let localUserPhoneExits;
		let localUserEmailExits;

		// Define the validation schema for user details using Joi
		const schema = Joi.object({
			first: Joi.string().trim().min(validationConstant.first.min).max(validationConstant.first.max).required(), // First name (2-50 characters, required)
			last: Joi.string().trim().min(validationConstant.last.min).max(validationConstant.first.max).required(), // Last name (2-50 characters, required)
			email: Joi.string().email(), // Valid email format
			phone: Joi.number().integer(), // Integer phone number (optional)
			city: Joi.string().trim().min(validationConstant.city.min).max(validationConstant.city.max).allow(null).allow(''), // Max 100 characters for city (optional)
			state: Joi.string()
				.trim()
				.min(validationConstant.state.min)
				.max(validationConstant.state.max)
				.allow(null)
				.allow(''), // Max 100 characters for state (optional)
			zipCode: Joi.string()
				.trim()
				.min(validationConstant.zipCode.min)
				.max(validationConstant.zipCode.max)
				.allow(null)
				.allow(''), // Max 20 characters for zip code (optional)
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			CountryId: Joi.number()
				.integer()
				.min(validationConstant.CountryId.min)
				.max(validationConstant.CountryId.max)
				.required(), // Country ID (integer, max 250, required)
			forDrip: Joi.boolean().required(), // Boolean flag for Drip (required)
			forDiwo: Joi.boolean().required(), // Boolean flag for Diwo (required)
			clientIdForLearnerRole: Joi.alternatives().try(
				Joi.string().allow(''),
				Joi.string().allow(null),
				Joi.number().integer().positive()
			), // Optional client ID for learner role
		});

		// Validate user details using the defined schema
		const { error, value } = schema.validate({
			...req.body.userDetails, // Extract user details from the request body
			clientIdForLearnerRole: req.body.clientIdForLearnerRole, // Add learner role client ID
		});

		// If validation fails, return an error response
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		// Store the validated user details
		let user_details = value;

		// Remove clientIdForLearnerRole from the user details (not needed further)
		delete user_details.clientIdForLearnerRole;

		// Check if the user has access to the provided client ID
		if (req.body.clientIdForLearnerRole) {
			if (!(await checkClientIdAccess(req.user.ClientId, req.body.clientIdForLearnerRole))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		// Validate client details if provided in the request body
		if (req?.body?.clientDetails?.length > 0) {
			// Define the validation schema for each client detail object
			const objectSchema = Joi.object({
				role: Joi.array()
					.items(Joi.number().integer().min(req.user.RoleId).max(validationConstant.role.max).required())
					.required(), // Array of at least one role ID (integer)
				clientId: Joi.number().integer().positive().required(), // Required client ID (integer)
				branchClientId: Joi.number().integer().positive().allow(null), // Allows null for branchClientId
				parentSubClientList: Joi.array().items(Joi.any()).required(), // Array of any values for parentSubClientList
				// isParentError: Joi.boolean().required(), // Boolean flag indicating parent error
				// isRoleError: Joi.boolean().required(), // Boolean flag indicating role error
				showAccess: Joi.boolean().required(), // Boolean flag for access visibility
				isAccess: Joi.boolean().required(), // Boolean flag for access permission
			});

			// Define an array schema that requires at least one valid client detail object
			const arraySchema = Joi.array().items(objectSchema).min(1).required();

			// Validate the client details array from the request
			const { error, value } = arraySchema.validate(req.body.clientDetails, { abortEarly: false });

			// If validation fails, return an error response
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			// Iterate through the client details to check if the user has access to each client ID
			for (let user of req.body.clientDetails) {
				if (!(await checkClientIdAccess(req.user.ClientId, user.clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		} else {
			// Return an error if no client details are selected
			return ResponseError(res, { message: MESSAGE.NOT_SELECTED_CLIENT }, 400);
		}

		// Store client role details after validation
		let client_Role_details = req.body.clientDetails;

		// Get the user type from the request
		let type = req.user.type;

		// Check if the project name matches the expected user type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let errorMessage;
		[err, market] = await to(
			Market.findOne({
				include: [
					{
						model: Country,
						where: {
							id: user_details.CountryId,
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (market) {
			let marketUser = market.convertToJSON();
			[err, localUserEmailExits] = await to(
				dbInstance[marketUser.db_name].User_master.findOne({
					where: {
						email: user_details.email,
						isDeleted: false,
					},
					attributes: ['email'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (user_details && user_details.phone) {
				[err, localUserPhoneExits] = await to(
					dbInstance[marketUser.db_name].User_master.findOne({
						where: {
							phone: user_details.phone.toString(),
							isDeleted: false,
						},
						attributes: ['phone'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (!localUserEmailExits && !localUserPhoneExits) {
				// Create User

				user_details.MarketId = market.id;
				user_details.status = true;
				user_details.is_verified = false;
				user_details.is_deleted = false;
				user_details.type = 'Admin';
				user_details.cStatus = 'Active';
				user_details.account_id = '0';
				//	if (type == 'drip') {
				//		user_details.forDrip = true;
				//	} else if (type == 'diwo') {
				//		user_details.forDiwo = true;
				//	}
				// Add Check to User is alredy exits or not
				//Add Policy
				user_details.userPolicyDetails = await getAllLatestPolicyByMarketId(market.id);

				if (err) return ResponseError(res, err, 500, true);

				///////////////////////////////////////// Gernerate Password ////////////////////////////////////////////////

				if (config_feature?.configurable_feature?.web_password) {
					try {
						const password = await generatePassword();
						// console.log('---Generated Password--', password);

						user_details.password = await hashPassword(password);
						// console.log('-- Hashed Password--', user_details.password);
					} catch (error) {
						console.error('----Error while generating or hashing password on admin user creation:----', error.message);
						ThrowException(error.message);
					}
				}

				[err, createUser] = await to(User.create(user_details));
				if (err) return ResponseError(res, err, 500, true);

				//Update User Account Id
				await updateUserAccountId();
				user_details.first = await capitalFirstLatter(user_details.first);
				user_details.last = await capitalFirstLatter(user_details.last);
				user_details.email = user_details.email ? user_details.email.toLowerCase() : null;
				if (err) return ResponseError(res, err, 500, true);

				[err, createLocalUser] = await to(dbInstance[market.db_name].User_master.create(user_details));
				if (err) return ResponseError(res, err, 500, true);

				[err, updateUser] = await to(
					createUser.update({
						local_user_id: createLocalUser.id,
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, user] = await to(
					User.findOne({
						where: {
							id: createUser.id,
						},
						include: [
							{
								model: Client_job_role,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let userDetail = user.convertToJSON();
				[err, localUser] = await to(
					dbInstance[market.db_name].User_master.findOne({
						where: {
							id: user.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					userDetail.first = localUser.first;
					userDetail.last = localUser.last;
					userDetail.email = localUser.email;
					userDetail.phone = localUser.phone;
					userDetail.imagePath = localUser.imagePath;
					userDetail.city = localUser.city;
				}

				// Create User Role

				// [{role: [1], clientId: 4}]
				let userId = createUser.id;

				for (let client_role of client_Role_details) {
					for (let role of client_role.role) {
						let payload = {
							RoleId: role,
							UserId: userId,
							ClientId: client_role.clientId,
						};
						if (type == 'drip') {
							payload.forDrip = true;
							payload.forDiwo = client_role.isAccess;
						} else if (type == 'diwo') {
							payload.forDiwo = true;
							payload.forDrip = client_role.isAccess;
						}

						[err, cretae_user_role] = await to(User_role_client_mapping.create(payload));
						if (err) return ResponseError(res, err, 500, true);
					}
				}

				if (req.body.clientIdForLearnerRole) {
					//check Learner Lince and Add One Count in Linces
					if (type == 'drip') {
						checkCount = await getLearnerValidaionOnCreateLearner(req.body.clientIdForLearnerRole);
					} else if (type == 'diwo') {
						//Add Check in To Diwo
						checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(req.body.clientIdForLearnerRole);
					}
					if (checkCount) {
						let payload = {
							RoleId: 1,
							UserId: userId,
							ClientId: req.body.clientIdForLearnerRole,
						};
						if (type == 'drip') {
							payload.forDrip = true;
						} else if (type == 'diwo') {
							payload.forDiwo = true;
						}
						[err, cretae_user_role] = await to(User_role_client_mapping.create(payload));
						if (err) return ResponseError(res, err, 500, true);

						if (type == 'drip') {
							[err, updateUser] = await to(
								User.update(
									{
										opt_in: false,
										optTrigger: false,
										optError: null,
										haveWhatsAppOptIn: true,
										opt_out: false,
										optOutTrigger: false,
									},
									{
										where: {
											id: userId,
											status: true,
											is_deleted: false,
											cStatus: 'Active',
										},
									}
								)
							);
							if (err) return ResponseError(res, err, 500, true);
						}

						if (type == 'drip') {
							await getAddOneLearnerCount(req.body.clientIdForLearnerRole);
						} else if (type == 'diwo') {
							await getAddOneLearnerCountForDiwo(req.body.clientIdForLearnerRole);
						}
					} else {
						errorMessage = 'Admin user created successfully. Learner creation failed due to insufficient capacity.';
					}
				}

				/////////////////--------------Send Password Reset Link---------------////////////////////

				console.log('client_Role_details', client_Role_details);

				let ClientsDetails = [];
				let Clients_detail, Roles_detail;

				for (let clientDetail of req.body.clientDetails) {
					// Get client name and id
					[err, Clients_detail] = await to(
						Client.findAll({
							where: {
								id: clientDetail.clientId,
								is_deleted: false,
							},
							attributes: ['name', 'id'],
						})
					);

					if (err) return ResponseError(res, err, 500, true);

					const clientRecord = Clients_detail?.[0];
					if (!clientRecord) continue;

					const clientName = clientRecord.name;
					const clientId = clientRecord.id;

					let clientRoles = [];

					// Get roles for this client
					if (Array.isArray(clientDetail.role) && clientDetail.role.length > 0) {
						[err, Roles_detail] = await to(
							Role.findAll({
								where: {
									id: { [Op.in]: clientDetail.role },
								},
								attributes: ['name'],
							})
						);

						if (err) return ResponseError(res, err, 500, true);

						clientRoles = Roles_detail.map((role) => role.name);
					}

					// Push grouped client data with id
					ClientsDetails.push({
						id: clientId,
						name: clientName,
						roles: clientRoles,
					});
				}

				if (
					user_details &&
					user_details.email &&
					user_details.cStatus == 'Active' &&
					client_Role_details &&
					client_Role_details.length > 0
				) {
					// if (config_feature?.configurable_feature?.web_password) {
					// 	triggerAdminUserResetPassWordLink(
					// 		userId,
					// 		client_Role_details[0].clientId,
					// 		type,
					// 		CONFIG.jwt_expiration_reset_password_admin,
					// 		'adminUserAdded'
					// 	);
					// }

					if (config_feature?.configurable_feature?.web_password) {
						triggerAdminUserCreatePassWordLink(
							userId,
							ClientsDetails,
							type,
							CONFIG.jwt_expiration_reset_password_admin,
							'adminUserAdded'
						);
					}
				}

				[err, role] = await to(
					User_role_client_mapping.findAll({
						where: {
							UserId: userId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				userDetail.role = role;

				// Rajesh code
				[err, roleIds] = await to(
					User_role_client_mapping.findAll({
						where: {
							UserId: userId,
						},
						attributes: ['RoleId', 'ClientId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				console.log('req.user.type', req.user.type);

				// rajesh code for Sending welcome Admin user email

				if (req?.body?.userDetails?.email && req.user.type == 'diwo' && config_feature?.configurable_feature?.web_otp) {
					AdminUserWelcomeMailNotification(req, res);
				} else if (
					req?.body?.userDetails?.email &&
					req.user.type == 'drip' &&
					config_feature?.configurable_feature?.web_otp
				) {
					AdminUserWelcomeMailNotification(req, res);
				}

				[err, newLog] = await to(
					createlog(
						req.user.id,
						req.user.ClientId,
						req.user.RoleId,
						`Create Admin User`,
						req.ip,
						req.useragent,
						req.user.type,
						{
							UserId: userId,
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				return ResponseSuccess(res, {
					data: userDetail,
					errorMessage: errorMessage,
				});
			} else {
				let mesg;
				if (localUserEmailExits && !localUserPhoneExits) {
					mesg = MESSAGE.EMAIL_EXITS;
				} else if (!localUserEmailExits && localUserPhoneExits) {
					mesg = MESSAGE.PHONE_EXITS;
				} else {
					mesg = MESSAGE.EMAIL_AND_PHONE_EXITS;
				}
				return ResponseError(
					res,
					{
						message: mesg,
					},
					500
				);
			}
		} else {
			return ResponseError(
				res,
				{
					message: MESSAGE.MARKET_NOT_FIND,
				},
				500,
				true
			);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createUser = createUser;

const updateAdminUser = async function (req, res) {
	try {
		// Define the validation schema for user details using Joi
		const schema = Joi.object({
			first: Joi.string().trim().min(validationConstant.first.min).max(validationConstant.first.max).required(), // First name (2-50 characters, required)
			last: Joi.string().trim().min(validationConstant.last.min).max(validationConstant.first.max).required(), // Last name (2-50 characters, required)
			email: Joi.string().email(), // Valid email format
			phone: Joi.number().integer(), // Integer phone number (optional)
			city: Joi.string().trim().min(validationConstant.city.min).max(validationConstant.city.max).allow(null).allow(''), // Max 100 characters for city (optional)
			state: Joi.string()
				.trim()
				.min(validationConstant.state.min)
				.max(validationConstant.state.max)
				.allow(null)
				.allow(''), // Max 100 characters for state (optional)
			zipCode: Joi.string()
				.trim()
				.min(validationConstant.zipCode.min)
				.max(validationConstant.zipCode.max)
				.allow(null)
				.allow(''), // Max 20 characters for zip code (optional)
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			CountryId: Joi.number()
				.integer()
				.min(validationConstant.CountryId.min)
				.max(validationConstant.CountryId.max)
				.required(), // Country ID (integer, max 250, required)
			forDrip: Joi.boolean().required(), // Boolean flag for Drip (required)
			forDiwo: Joi.boolean().required(), // Boolean flag for Diwo (required)
			clientIdForLearnerRole: Joi.alternatives().try(
				Joi.string().allow(''),
				Joi.string().allow(null),
				Joi.number().integer().positive()
			), // Optional client ID for learner role
			userId: Joi.number().integer().required(),
		});

		// Validate user details using the defined schema
		const { error, value } = schema.validate({
			...req.body.userDetails, // Extract user details from the request body
			clientIdForLearnerRole: req.body.clientIdForLearnerRole,
			userId: req.params.userId, // Add learner role client ID
		});

		// If validation fails, return an error response
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		let user_details = value;
		delete user_details.clientIdForLearnerRole;
		delete user_details.userId;

		// Check if the user has access to the provided client ID
		if (req.body.clientIdForLearnerRole) {
			if (!(await checkClientIdAccess(req.user.ClientId, req.body.clientIdForLearnerRole))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		// Validate client details if provided in the request body
		if (req?.body?.clientDetails?.length > 0) {
			// Define the validation schema for each client detail object
			const objectSchema = Joi.object({
				role: Joi.array()
					.items(Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required())
					.required(), // Array of at least one role ID (integer)
				clientId: Joi.number().integer().positive().required(), // Required client ID (integer)
				branchClientId: Joi.number().integer().positive().allow(null), // Allows null for branchClientId
				parentSubClientList: Joi.array().items(Joi.any()).optional(), // Array of any values for parentSubClientList
				showAccess: Joi.boolean().required(), // Boolean flag for access visibility
				isAccess: Joi.boolean().required(), // Boolean flag for access permission
			});

			// Define an array schema that requires at least one valid client detail object
			const arraySchema = Joi.array().items(objectSchema).min(1).required();

			// Validate the client details array from the request
			const { error, value } = arraySchema.validate(req.body.clientDetails, { abortEarly: false });

			// If validation fails, return an error response
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			// Iterate through the client details to check if the user has access to each client ID
			for (let user of req.body.clientDetails) {
				if (!(await checkClientIdAccess(req.user.ClientId, user.clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		} else {
			// Return an error if no client details are selected
			return ResponseError(res, { message: MESSAGE.NOT_SELECTED_CLIENT }, 400);
		}
		// Get the user type from the request
		let type = req.user.type;
		// Check if the project name matches the expected user type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let err;

		let userId = parseInt(req.params.userId);
		let client_Role_details = req.body.clientDetails;

		let getUserAsLearner;
		let errorMessage;
		[err, UserData] = await to(
			User.findAll({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		let payload = {
			forDrip: user_details.forDrip,
			forDiwo: user_details.forDiwo,
		};

		[err, updateUserDeatils] = await to(
			User.update(payload, {
				where: {
					id: userId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		user_details.type = 'Admin';
		user_details.first = await capitalFirstLatter(user_details.first);
		user_details.last = await capitalFirstLatter(user_details.last);
		user_details.email = user_details.email ? user_details.email.toLowerCase() : null;
		if (err) return ResponseError(res, err, 500, true);

		for (user of UserData) {
			let userMarket = user.convertToJSON();
			[err, updateLocalUser] = await to(
				dbInstance[userMarket.Market.db_name].User_master.update(user_details, {
					where: {
						id: user.local_user_id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		//Need to Change here
		//need to check user role mapping is use in another client or not
		// if (type == 'drip') {
		// 	[err, DeleteUserRoleMap] = await to(
		// 		User_role_client_mapping.destroy({
		// 			where: {
		// 				UserId: userId,
		// 				forDrip: true,
		// 				RoleId: {
		// 					[Op.ne]: 1,
		// 				},
		// 			},
		// 		})
		// 	);

		// 	if (err) return ResponseError(res, err, 500, true);
		// } else if (type == 'diwo') {
		// 	[err, DeleteUserRoleMap] = await to(
		// 		User_role_client_mapping.destroy({
		// 			where: {
		// 				UserId: userId,
		// 				forDiwo: true,
		// 				RoleId: {
		// 					[Op.ne]: 1,
		// 				},
		// 			},
		// 		})
		// 	);

		// 	if (err) return ResponseError(res, err, 500, true);
		// }

		//First Get Existing User Role
		[err, userRole] = await to(
			User_role_client_mapping.findAll({
				where: {
					UserId: userId,
					//comment by bhushan
					// RoleId: {
					// 	[Op.ne]: 1,
					// },
				},
			})
		);

		let createNewRole = false;
		//Add New Role
		for (let client_role of client_Role_details) {
			for (let role of client_role.role) {
				let flag = true;
				for (let exitsUserRole of userRole) {
					if (exitsUserRole.RoleId == role && exitsUserRole.ClientId === client_role.clientId) {
						flag = false;

						if (
							(exitsUserRole.forDrip != client_role.isAccess && type == 'diwo') ||
							(exitsUserRole.forDiwo != client_role.isAccess && type == 'drip')
						) {
							let updatePayload = {};
							if (type == 'drip') {
								updatePayload.forDrip = true;
								updatePayload.forDiwo = client_role.isAccess;
							} else if (type == 'diwo') {
								updatePayload.forDiwo = true;
								updatePayload.forDrip = client_role.isAccess;
							}

							console.log('-----updatePayload-------', updatePayload);
							[err, DeleteUserRoleMap] = await to(
								User_role_client_mapping.update(updatePayload, {
									where: {
										UserId: exitsUserRole.UserId,
										RoleId: exitsUserRole.RoleId,
										ClientId: exitsUserRole.ClientId,
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							[err, newLog] = await to(
								createlog(
									req.user.id,
									req.user.ClientId,
									req.user.RoleId,
									`Update Admin User Role`,
									req.ip,
									req.useragent,
									req.user.type,
									{
										UserId: exitsUserRole.UserId,
									}
								)
							);
							if (err) return ResponseError(res, err, 500, true);
						}
					}
				}
				if (flag) {
					createNewRole = true;
					let payload = {
						RoleId: role,
						UserId: userId,
						ClientId: client_role.clientId,
					};

					if (type == 'drip') {
						payload.forDrip = true;
						payload.forDiwo = client_role.isAccess;
					} else if (type == 'diwo') {
						payload.forDiwo = true;
						payload.forDrip = client_role.isAccess;
					}
					[err, cretae_user_role] = await to(User_role_client_mapping.create(payload));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (createNewRole) {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Add Admin User Role`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						UserId: userId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		//Reomve or update unselected Role
		for (let exitsUserRole of userRole) {
			let flag = true;
			for (let client_role of client_Role_details) {
				for (let role of client_role.role) {
					if (exitsUserRole.RoleId == role && exitsUserRole.ClientId === client_role.clientId) {
						flag = false;
					}
				}
			}

			if (flag) {
				if (exitsUserRole.forDrip && exitsUserRole.forDiwo) {
					//Update Admin User Roles as Per Project Type
					let updatePayload = {
						forDrip: true,
						forDiwo: true,
					};

					if (type == 'drip') {
						updatePayload.forDrip = false;
					} else if (type == 'diwo') {
						updatePayload.forDiwo = false;
					}
					[err, DeleteUserRoleMap] = await to(
						User_role_client_mapping.update(updatePayload, {
							where: {
								UserId: exitsUserRole.UserId,
								RoleId: exitsUserRole.RoleId,
								ClientId: exitsUserRole.ClientId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Update Admin User Role`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								UserId: exitsUserRole.UserId,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				} else {
					//Destroyed Unwanted Admin User Roles
					[err, DeleteUserRoleMap] = await to(
						User_role_client_mapping.destroy({
							where: {
								UserId: exitsUserRole.UserId,
								RoleId: exitsUserRole.RoleId,
								ClientId: exitsUserRole.ClientId,
							},
						})
					);

					if (err) return ResponseError(res, err, 500, true);

					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Update Admin User Role`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								UserId: exitsUserRole.UserId,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (type == 'drip') {
			[err, getUserAsLearner] = await to(
				User_role_client_mapping.findOne({
					where: {
						UserId: userId,
						RoleId: 1,
						forDrip: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, getUserAsLearner] = await to(
				User_role_client_mapping.findOne({
					where: {
						UserId: userId,
						RoleId: 1,
						forDiwo: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (req.body.clientIdForLearnerRole) {
			//check Learner Lince and Add One Count in Linces
			let flag = true;
			if (getUserAsLearner && getUserAsLearner.ClientId == req.body.clientIdForLearnerRole) {
				flag = false;
			} else if (getUserAsLearner && getUserAsLearner.ClientId != req.body.clientIdForLearnerRole) {
				//Remove From Linces
				if (type == 'drip') {
					await getRemoveOneLearnerCount(getUserAsLearner.ClientId);
				} else if (type == 'diwo') {
					await getRemoveOneLearnerCountForDiwo(getUserAsLearner.ClientId);
				}

				if (type == 'drip') {
					if (getUserAsLearner.forDiwo && getUserAsLearner.forDrip) {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.update(
								{ forDrip: false },
								{
									where: {
										UserId: userId,
										RoleId: 1,
										forDrip: true,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.destroy({
								where: {
									UserId: userId,
									RoleId: 1,
									forDrip: true,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				} else if (type == 'diwo') {
					if (getUserAsLearner.forDiwo && getUserAsLearner.forDrip) {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.update(
								{ forDiwo: false },
								{
									where: {
										UserId: userId,
										RoleId: 1,
										forDiwo: true,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.destroy({
								where: {
									UserId: userId,
									RoleId: 1,
									forDiwo: true,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
				flag = true;
			}
			if (flag) {
				if (type == 'drip') {
					checkCount = await getLearnerValidaionOnCreateLearner(req.body.clientIdForLearnerRole);
				} else if (type == 'diwo') {
					checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(req.body.clientIdForLearnerRole);
				}
				if (checkCount) {
					let payload = {
						RoleId: 1,
						UserId: userId,
						ClientId: req.body.clientIdForLearnerRole,
					};
					if (type == 'drip') {
						payload.forDrip = true;
					} else if (type == 'diwo') {
						payload.forDiwo = true;
					}
					[err, cretae_user_role] = await to(User_role_client_mapping.create(payload));
					if (err) return ResponseError(res, err, 500, true);

					if (type == 'drip') {
						[err, updateUser] = await to(
							User.update(
								{
									opt_in: false,
									optTrigger: false,
									optError: null,
									haveWhatsAppOptIn: true,
									opt_out: false,
									optOutTrigger: false,
								},
								{
									where: {
										id: userId,
										status: true,
										is_deleted: false,
										cStatus: 'Active',
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}

					if (type == 'drip') {
						await getAddOneLearnerCount(req.body.clientIdForLearnerRole);
					} else if (type == 'diwo') {
						await getAddOneLearnerCountForDiwo(req.body.clientIdForLearnerRole);
					}
				} else {
					errorMessage = 'Admin user created successfully. Learner creation failed due to insufficient capacity.';
				}
			}
		} else {
			if (getUserAsLearner) {
				if (type == 'drip') {
					if (getUserAsLearner.forDiwo && getUserAsLearner.forDrip) {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.update(
								{ forDrip: false },
								{
									where: {
										UserId: userId,
										RoleId: 1,
										forDrip: true,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, deleteUserAsLearner] = await to(
							User_role_client_mapping.destroy({
								where: {
									UserId: userId,
									RoleId: 1,
									forDrip: true,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}

					await getRemoveOneLearnerCount(getUserAsLearner.ClientId);
				} else if (type == 'diwo') {
					if (getUserAsLearner.forDiwo && getUserAsLearner.forDrip) {
						[err, getUserAsLearner] = await to(
							User_role_client_mapping.update(
								{ forDiwo: false },
								{
									where: {
										UserId: userId,
										RoleId: 1,
										forDiwo: true,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, deleteUserAsLearner] = await to(
							User_role_client_mapping.destroy({
								where: {
									UserId: userId,
									RoleId: 1,
									forDiwo: true,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, newLog] = await to(
							createlog(
								req.user.id,
								req.user.ClientId,
								req.user.RoleId,
								`Update Admin User Role`,
								req.ip,
								req.useragent,
								req.user.type,
								{
									UserId: userId,
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}

					await getRemoveOneLearnerCountForDiwo(getUserAsLearner.ClientId);
				}
			}
		}

		if (req?.body?.userDetails?.email && req.user.type == 'diwo') {
			AdminUserEditMailNotification(req, res);
		} else if (req?.body?.userDetails?.email && req.user.type == 'drip') {
			AdminUserEditMailNotification(req, res);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Admin User`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserId: userId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			Message: MESSAGE.USER_UPDATED,
			errorMessage: errorMessage,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateAdminUser = updateAdminUser;

// Triggering mail functions for Admin User

const AdminUserWelcomeMailNotification = async function (req, res) {
	try {
		let userPayload = {
			firstName: req.body.userDetails.first,
			email_id: req.body.userDetails.email,
			ClientsDetails: [], // store objects with name + roles
		};

		let Clients_detail, Roles_detail;
		for (let clientDetail of req.body.clientDetails) {
			// Get client name
			[err, Clients_detail] = await to(
				Client.findAll({
					where: {
						id: clientDetail.clientId,
						is_deleted: false,
					},
					attributes: ['name'],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			let clientName = Clients_detail?.[0]?.name || null;
			if (!clientName) continue;

			let clientRoles = [];

			// Get roles for this client
			if (Array.isArray(clientDetail.role) && clientDetail.role.length > 0) {
				[err, Roles_detail] = await to(
					Role.findAll({
						where: {
							id: { [Op.in]: clientDetail.role },
						},
						attributes: ['name'],
					})
				);

				if (err) return ResponseError(res, err, 500, true);

				clientRoles = Roles_detail.map((role) => role.name);
			}

			// Push grouped client data
			userPayload.ClientsDetails.push({
				name: clientName,
				roles: clientRoles,
			});
		}

		let projectName = '';
		let emailSignatureText = '';

		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData?.EmailSignatureText;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData?.EmailSignatureText;
		}

		userPayload.emailSignatureText = emailSignatureText;

		if (config_feature?.configurable_feature?.saas) {
			if (req.user.type == 'drip') {
				projectName = 'Drip';
			} else if (req.user.type == 'diwo') {
				projectName = 'Diwo';
			}
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		userPayload.projectName = projectName;

		console.log('userPayload', userPayload);

		if (userPayload && userPayload?.email_id && req.user.type == 'diwo') {
			let mailedWelcomeTextemail;
			[err, mailedWelcomeTextemail] = await to(sendUserWelcomeEmailToAdmin(userPayload, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			console.log('mailedWelcomeTextemail', mailedWelcomeTextemail);
		}

		if (userPayload && userPayload?.email_id && req.user.type == 'drip') {
			let mailedWelcomeTextemailDrip;
			[err, mailedWelcomeTextemailDrip] = await to(sendUserWelcomeEmailToAdmin(userPayload, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			console.log('mailedWelcomeTextemailDrip', mailedWelcomeTextemailDrip);
		}

		// return ResponseSuccess(res, {
		// 	Message: MESSAGE.WELCOME_ADMIN_MAIL_SENT,
		// });
	} catch (error) {
		// return ResponseError(res, error, 500, true);
		console.log('Error in sending email:', error);
	}
};
module.exports.AdminUserWelcomeMailNotification = AdminUserWelcomeMailNotification;

const AdminUserEditMailNotification = async function (req, res) {
	try {
		// rajesh code for Editing Admin user

		// for the actual user who changed the role
		[err, local_user_detail] = await to(
			User.findOne({
				where: {
					id: req.user.id,
					is_deleted: false,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
				attributes: ['local_user_id'],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		let local_user_Detail = local_user_detail.convertToJSON();

		[err, actual_user_detail] = await to(
			dbInstance[local_user_Detail.Market.db_name].User_master.findOne({
				where: {
					id: local_user_Detail.local_user_id,
					isDeleted: false,
				},
				attributes: ['first', 'last'],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		let actual_user_Detail = actual_user_detail.convertToJSON();

		// Initialize userPayload AFTER getting required data
		let userPayload = {
			firstName: req.body.userDetails.first,
			email_id: req.body.userDetails.email,
			ClientsDetails: [],
			// roleDetails: [],
			user_name_of_one_who_changed_role: `${actual_user_Detail.first} ${actual_user_Detail.last}`,
		};

		// for the user whose role is changed
		let changed_local_user_detail = null;

		[err, changed_local_user_detail] = await to(
			User.findOne({
				where: {
					id: req.params.userId,
					is_deleted: false,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
				attributes: ['local_user_id'],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		let changed_local_user_Detail = changed_local_user_detail.convertToJSON();

		[err, changed_user_detail] = await to(
			dbInstance[changed_local_user_Detail.Market.db_name].User_master.findOne({
				where: {
					id: changed_local_user_Detail.local_user_id,
					isDeleted: false,
				},
				attributes: ['first', 'last'],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		let changed_user_Detail = changed_user_detail.convertToJSON();
		userPayload.user_name_one_one_whose_role_changed = `${changed_user_Detail.first} ${changed_user_Detail.last}`;

		// Loop through clients
		let details = [];
		for (let client of req.body.clientDetails) {
			if (client?.clientId && client?.role?.length > 0) {
				let payload = {
					ClientName: null,
					RoleName: [],
				};
				[err, Clients_detail] = await to(
					Client.findOne({
						where: {
							id: client.clientId,
							is_deleted: false,
						},
						attributes: ['name'],
					})
				);

				if (err) return ResponseError(res, err, 500, true);

				if (Clients_detail) {
					payload.ClientName = Clients_detail.name;
				}

				[err, Roles_detail] = await to(
					Role.findAll({
						where: {
							id: client.role,
						},
						attributes: ['name'],
					})
				);

				if (err) return ResponseError(res, err, 500, true);

				if (Roles_detail?.length > 0) {
					for (let roleName of Roles_detail) {
						payload.RoleName.push(roleName.name);
					}
				}

				details.push(payload);
				console.log('details', details);
			}
		}

		// Push all details at once after the loop
		userPayload.ClientsDetails = details;

		console.log('userPayload clientDetails', userPayload);

		let emailSignatureText = '';

		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.user.ClientId);
			emailSignatureText = appBrandingData.EmailSignatureText;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.user.ClientId);
			emailSignatureText = appBrandingData.EmailSignatureText;
		}

		userPayload.emailSignatureText = emailSignatureText;

		console.log('userPayload', userPayload);

		// Send email if everything's ready
		if (userPayload && userPayload?.user_name_of_one_who_changed_role && req.user.type == 'diwo') {
			[err, mailedWelcomeTextDiwo] = await to(sendEditingUserEmailToAdmin(userPayload, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}
			console.log('mailedWelcomeTextDiwo', mailedWelcomeTextDiwo);
		}

		if (userPayload && userPayload?.user_name_of_one_who_changed_role && req.user.type == 'drip') {
			[err, mailedWelcomeTextDrip] = await to(sendEditingUserEmailToAdmin(userPayload, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}
			console.log('mailedWelcomeTextDrip', mailedWelcomeTextDrip);
		}
		///////////////////////////////////////

		// return ResponseSuccess(res, {
		// 	Message: MESSAGE.EDIT_ADMIN_MAIL_SENT,
		// });
	} catch (error) {
		console.log('----Error when Check and Triggered Editing Admin user--', error);
		// return ResponseError(res, error, 500, true);
	}
};
module.exports.AdminUserEditMailNotification = AdminUserEditMailNotification;

// End of Triggering mail functions for Admin User

const deleteUser = async function (req, res) {
	try {
		const schema = Joi.array().items(
			Joi.object({
				UserId: Joi.number().integer().positive().required(),
				RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
				ClientId: Joi.number().integer().positive().required(),
			})
		);

		const { error, value } = schema.validate(req.body);

		if (error) {
			return res.status(400).json({ error: error.details.map((err) => err.message) });
		}

		let UserId = [];
		let RoleId = [];
		let ClientId = [];

		let type = req.user.type;

		for (let item of value) {
			UserId.push(item.UserId);
			RoleId.push(item.RoleId);
			ClientId.push(item.ClientId);
		}

		let whereCondition = {
			UserId: UserId,
			RoleId: RoleId,
			ClientId: ClientId,
		};

		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}
		[err, User_Details] = await to(
			User_role_client_mapping.destroy({
				where: whereCondition,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Set Delete Flag in Global and Local Database
		[err, updateUser] = await to(
			User.update(
				{ status: false, is_deleted: true, cStatus: 'Deleted' },
				{
					where: {
						id: UserId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, getAdminUsers] = await to(
			User.findAll({
				where: {
					id: UserId,
				},
				include: [{ model: Market, attributes: ['id', 'db_name'] }],
				attributes: ['id', 'local_user_id', 'MarketId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (getAdminUsers && getAdminUsers.length > 0) {
			for (let user of getAdminUsers) {
				[err, localUser] = await to(
					dbInstance[user.Market.db_name].User_master.update(
						{ isDeleted: true, status: false },
						{
							where: {
								id: user.local_user_id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Admin User`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserId: UserId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.USER_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteUser = deleteUser;

const getAllLatestPolicyByMarketId = async function (marketId) {
	try {
		[err, allPolicy] = await to(
			PolicyChangeLog.findAll({
				where: {
					MarketId: marketId,
				},
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) {
			console.log('----', err);
		}
		let cookiePolicy;
		let termsAndConditionPolicy;
		let DPAPolicy;
		let privacyPolicy;
		for (let policy of allPolicy) {
			if (policy.policyTitle == 'Cookie Policy') {
				if (!cookiePolicy) {
					cookiePolicy = policy;
				} else if (cookiePolicy.policyChangeDate < policy.policyChangeDate) {
					cookiePolicy = policy;
				}
			} else if (policy.policyTitle == 'Terms and Conditions') {
				if (!termsAndConditionPolicy) {
					termsAndConditionPolicy = policy;
				} else if (termsAndConditionPolicy.policyChangeDate < policy.policyChangeDate) {
					termsAndConditionPolicy = policy;
				}
			} else if (policy.policyTitle == 'Data Processing Agreement') {
				if (!DPAPolicy) {
					DPAPolicy = policy;
				} else if (DPAPolicy.policyChangeDate < policy.policyChangeDate) {
					DPAPolicy = policy;
				}
			} else if (policy.policyTitle == 'Privacy Policy') {
				if (!privacyPolicy) {
					privacyPolicy = policy;
				} else if (privacyPolicy.policyChangeDate < policy.policyChangeDate) {
					privacyPolicy = policy;
				}
			}
		}
		let payload = [
			{
				'Cookie Policy': {
					PolicyChangeLogId: cookiePolicy ? cookiePolicy.id : null,
					acceptedByUser: false,
				},
			},
			{
				'Terms and Conditions': {
					PolicyChangeLogId: termsAndConditionPolicy ? termsAndConditionPolicy.id : null,
					acceptedByUser: false,
				},
			},
			{
				'Data Processing Agreement': {
					PolicyChangeLogId: DPAPolicy ? DPAPolicy.id : null,
					acceptedByUser: false,
				},
			},
			{
				'Privacy Policy': {
					PolicyChangeLogId: privacyPolicy ? privacyPolicy.id : null,
					acceptedByUser: false,
				},
			},
		];
		return JSON.stringify(payload);
	} catch (error) {
		console.log('--Error When GetAll Latest Policy By Market--', error);
	}
};
module.exports.getAllLatestPolicyByMarketId = getAllLatestPolicyByMarketId;

const getAllSearchAdminUsersbyClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
			selectedDate: Joi.alternatives()
				.try(
					Joi.object({
						startDate: Joi.date().required(),
						endDate: Joi.date().allow(null),
					}),
					Joi.allow(null) // Allows selectedDate to be explicitly null
				)
				.optional(),
		});
		const { error, value } = schema.validate({
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
			selectedDate: req.body.selectedDate,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, selectedDate } = value;
		const type = req.user.type;

		let searchKey = req.body.searchKey.split(' ');
		let allUserData, err;
		let allData = [];
		let parentClientId = clientId;
		let childClientId = [];
		childClientId.push(parentClientId);
		let userDetailId = [];
		let allSubClientIds = await getAllSubChildClientIds(parentClientId);
		allSubClientIds.push(parentClientId);
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let finalClient = [];
		let ClientsDetail;
		let UserDetail;
		let RoleDetail;
		let Clients_Details;
		let Role_Details;
		let User_Details;
		let RoleId = [];
		let whereConditionForUser = [];
		// let selectedDate = req.body.selectedDate;
		let UpdatedUser_Details;
		let dateCondition = [];
		let UpdatedClientId = [];
		let UpdatedUserId = [];
		let UpdatedRoleId = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		// let type = req.params.type;

		dateCondition.push({
			createdAt: {
				[Op.ne]: null,
			},
		});

		if (selectedDate.startDate != null && selectedDate.endDate != null) {
			dateCondition.push({
				createdAt: {
					[Op.between]: [selectedDate.startDate, selectedDate.endDate],
				},
			});
		}

		if (filterColumn.indexOf('parentname') > -1) {
			let whereCondtionForParentClient = {
				name: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
				id: allSubClientIds,
				is_deleted: false,
			};

			if (type == 'drip') {
				whereCondtionForParentClient.DripAccess = true;
			} else if (type == 'diwo') {
				whereCondtionForParentClient.DiwoAccess = true;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: whereCondtionForParentClient,
					attributes: ['id'],
				})
			);

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let Client of ClientsDetail) {
					finalClient.push(Client.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('account_id') || filterColumn.indexOf('is_deleted') || filterColumn.indexOf('country')) {
			if (filterColumn.indexOf('account_id') > -1) {
				whereConditionForUser.push({
					account_id: {
						[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
					},
				});
			}

			if (filterColumn.indexOf('country') > -1) {
				whereConditionForUser.push({
					country: {
						[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
					},
				});
			}

			if (filterColumn.indexOf('is_deleted') > -1) {
				let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
				let active = 'active';
				let deleted = 'deleted';
				if (active.includes(key)) {
					whereConditionForUser.push({
						is_deleted: false,
					});
				} else if (deleted.includes(key)) {
					whereConditionForUser.push({
						is_deleted: true,
					});
				}
			}

			if (type == 'drip') {
				[err, UserDetail] = await to(
					User.findAll({
						where: {
							[sequelize.Op.or]: whereConditionForUser,
							forDrip: true,
						},
						attributes: ['id'],
					})
				);
			} else if (type == 'diwo') {
				[err, UserDetail] = await to(
					User.findAll({
						where: {
							[sequelize.Op.or]: whereConditionForUser,
							forDiwo: true,
						},
						attributes: ['id'],
					})
				);
			}

			if (UserDetail && UserDetail.length > 0) {
				for (let User of UserDetail) {
					let UpdatedUsers = User.convertToJSON();
					userDetailId.push(UpdatedUsers.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('role') > -1) {
			let whereConditionForRole = {
				name: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			};

			if (type == 'drip') {
				whereConditionForRole.dripRole = true;
			} else if (type == 'diwo') {
				whereConditionForRole.diwoRole = true;
			}

			[err, RoleDetail] = await to(
				Role.findAll({
					where: whereConditionForRole,
				})
			);

			if (RoleDetail && RoleDetail.length > 0) {
				for (let Roles of RoleDetail) {
					let UpdatedRoles = Roles.convertToJSON();
					RoleId.push(UpdatedRoles.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		//Search User By market
		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (filterColumn.indexOf('first') > -1) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();
					[err, localUser] = await to(
						dbInstance[marketUser.db_name].User_master.findAll({
							where: {
								[sequelize.Op.or]: {
									first: {
										[sequelize.Op.iLike]: '%' + searchKey[0] + '%',
									},
									last: {
										[sequelize.Op.iLike]: '%' + searchKey[0] + '%',
									},
								},
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					let LocalUserId = [];
					if (localUser && localUser.length > 0) {
						for (let User of localUser) {
							LocalUserId.push(User.id);
						}
					}

					if (type == 'drip') {
						[err, UserDetail] = await to(
							User.findAll({
								where: {
									local_user_id: LocalUserId,
									MarketId: market.id,
									forDrip: true,
								},
								attributes: ['id'],
							})
						);
					} else if (type == 'diwo') {
						[err, UserDetail] = await to(
							User.findAll({
								where: {
									local_user_id: LocalUserId,
									MarketId: market.id,
									forDiwo: true,
								},
								attributes: ['id'],
							})
						);
					}

					if (UserDetail && UserDetail.length > 0) {
						for (let User of UserDetail) {
							userDetailId.push(User.id);
						}
					}

					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (ClientsDetail && ClientsDetail.length > 0) {
			if (type == 'drip') {
				[err, Clients_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: finalClient,
							[Op.and]: dateCondition,
							forDrip: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDrip: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									dripRole: true,
								},
							},
							{
								model: Client,
								where: {
									DripAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, Clients_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: finalClient,
							[Op.and]: dateCondition,
							forDiwo: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDiwo: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									diwoRole: true,
								},
							},
							{
								model: Client,
								where: {
									DiwoAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		if (RoleDetail && RoleDetail.length > 0) {
			if (type == 'drip') {
				[err, Role_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							[Op.and]: dateCondition,
							forDrip: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDrip: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									[sequelize.Op.or]: [
										{
											id: {
												[Op.ne]: 1,
											},
											id: RoleId,
										},
									],
									dripRole: true,
								},
							},
							{
								model: Client,
								where: {
									DripAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, Role_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							[Op.and]: dateCondition,
							forDiwo: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDiwo: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									[sequelize.Op.or]: [
										{
											id: {
												[Op.ne]: 1,
											},
											id: RoleId,
										},
									],
									diwoRole: true,
								},
							},
							{
								model: Client,
								where: {
									DiwoAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (userDetailId && userDetailId.length > 0) {
			if (type == 'drip') {
				[err, User_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							UserId: userDetailId,
							[Op.and]: dateCondition,
							forDrip: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDrip: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									dripRole: true,
								},
							},
							{
								model: Client,
								where: {
									DripAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, User_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							UserId: userDetailId,
							[Op.and]: dateCondition,
							forDiwo: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDiwo: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									diwoRole: true,
								},
							},
							{
								model: Client,
								where: {
									DiwoAccess: true,
								},
							},
						],
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (Clients_Details && Clients_Details.length > 0) {
			for (let clients_detail of Clients_Details) {
				allData.push(clients_detail);
			}
		}

		if (Role_Details && Role_Details.length > 0) {
			for (let role_detail of Role_Details) {
				let flag = true;
				for (let data of allData) {
					if (data.User.id == role_detail.User.id && data.Role.id == role_detail.Role.id) {
						flag = false;
					}
				}
				if (flag) {
					allData.push(role_detail);
				}
			}
		}

		if (User_Details && User_Details.length > 0) {
			for (let user_details of User_Details) {
				let flag = true;
				for (let data of allData) {
					if (data.User.id == user_details.User.id && data.Role.id == user_details.Role.id) {
						flag = false;
					}
				}
				if (flag) {
					allData.push(user_details);
				}
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedClientId.push(item_.ClientId);
			UpdatedUserId.push(item_.UserId);
			UpdatedRoleId.push(item_.RoleId);
		}

		if (allData && allData.length > 0) {
			if (type == 'drip') {
				[err, UpdatedUser_Details] = await to(
					User_role_client_mapping.findAndCountAll({
						where: {
							UserId: UpdatedUserId,
							ClientId: UpdatedClientId,
							RoleId: UpdatedRoleId,
							forDrip: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDrip: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									dripRole: true,
								},
							},
							{
								model: Client,
								where: {
									DripAccess: true,
								},
							},
						],
						offset: offset,
						limit: limit,
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, UpdatedUser_Details] = await to(
					User_role_client_mapping.findAndCountAll({
						where: {
							UserId: UpdatedUserId,
							ClientId: UpdatedClientId,
							RoleId: UpdatedRoleId,
							forDiwo: true,
						},
						include: [
							{
								model: User,
								where: {
									status: true,
									is_deleted: false,
									forDiwo: true,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.ne]: 1,
									},
									diwoRole: true,
								},
							},
							{
								model: Client,
								where: {
									DiwoAccess: true,
								},
							},
						],
						offset: offset,
						limit: limit,
						order: [
							[
								{
									model: User,
								},
								'createdAt',
								'DESC',
							],
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let newList = [];
		if (UpdatedUser_Details && UpdatedUser_Details.rows && UpdatedUser_Details.rows.length > 0) {
			for (let user_Details of UpdatedUser_Details.rows) {
				let user_Details_ = user_Details.convertToJSON();
				newList.push(user_Details_);
			}
		}

		let allRecords = [];
		if (err) return ResponseError(res, err, 500, true);
		if (newList && newList.length > 0) {
			for (let allUser of newList) {
				let userDetail = allUser;
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					userDetail.User.first = localUser.first;
					userDetail.User.last = localUser.last;
				}
				allRecords.push(userDetail);
			}
		}

		let count;
		if (UpdatedUser_Details != undefined) {
			count = UpdatedUser_Details.count;
		} else {
			count = 0;
		}
		return ResponseSuccess(res, {
			data: allRecords,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchAdminUsersbyClientId = getAllSearchAdminUsersbyClientId;

const getLearnerByLearnerIdForAdminUser = async function (req, res) {
	try {
		const schema = Joi.object({
			learnerId: Joi.string().required(),
		});

		const { error, value } = schema.validate({
			learnerId: req.params.learnerId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { learnerId } = value;

		let type = req.user.type;
		// let learnerId = req.params.learnerId;
		let clientId = req.user.ClientId;
		let allSubChildClientIds = await getAllSubChildClientIds(clientId);
		allSubChildClientIds.push(clientId);
		let message_;

		[err, userInfo] = await to(
			User.findOne({
				where: {
					account_id: learnerId,
					status: true,
					is_deleted: false,
					cStatus: 'Active',
				},
				attributes: ['id', 'forDrip', 'forDiwo'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let whereCondition = {
			account_id: learnerId,
			forDrip: false,
			forDiwo: false,
			cStatus: 'Active',
			status: true,
			is_deleted: false,
		};

		if (type == 'drip' || (type == 'diwo' && userInfo && userInfo.forDrip)) {
			whereCondition.forDrip = true;
		}

		if (type == 'diwo' || (type == 'drip' && userInfo && userInfo.forDiwo)) {
			whereCondition.forDiwo = true;
		}

		[err, user_detail] = await to(
			User_role_client_mapping.findOne({
				where: {
					ClientId: allSubChildClientIds,
				},
				include: [
					{
						model: User,
						where: whereCondition,
						attributes: ['id', 'local_user_id', 'MarketId'],
						// include: [{ model: Market, attributes: ['id', 'db_name'] }],
					},
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (user_detail && user_detail != null) {
			if (err) return ResponseError(res, err, 500, true);
			if (type == 'drip') {
				message_ = MESSAGE.USER_DATA_FETCH_SUCCESS;
			} else if (type == 'diwo') {
				message_ = MESSAGE.USER_DATA_FETCH_SUCCESS;
			}
			return ResponseSuccess(res, {
				data: user_detail,
				message: message_,
			});
		} else {
			if (type == 'drip') {
				message_ = MESSAGE.INVALID_USER;
			} else if (type == 'diwo') {
				message_ = MESSAGE.INVALID_USER;
			}
			return ResponseError(res, {
				message: message_,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerByLearnerIdForAdminUser = getLearnerByLearnerIdForAdminUser;

const getUserPersonalDetails = async function (req, res) {
	try {
		let userId = req.user.id;
		let userPersonalData;
		[err, getPersonaldetails] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				attributes: ['id', 'MarketId', 'local_user_id', 'account_id'],
				include: [{ model: Market, attributes: ['id', 'db_name'] }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getPersonaldetails) {
			[err, localUser] = await to(
				dbInstance[getPersonaldetails.Market.db_name].User_master.findOne({
					where: {
						id: getPersonaldetails.local_user_id,
					},
					attributes: ['first', 'last', 'email', 'phone'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				userPersonalData = localUser.convertToJSON();
				userPersonalData.account_id = getPersonaldetails.account_id;
			}
		}
		return ResponseSuccess(res, {
			data: userPersonalData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserPersonalDetails = getUserPersonalDetails;
