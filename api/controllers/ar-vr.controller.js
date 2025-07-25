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
	DiwoAssignment,
	SessionWorksheet,
	SessionUser,
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
const axios = require('axios');
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

const { updateCourseAndPathwayStatus } = require('../services/diwo-assignment.service');

// API to login with email,phone,uername and if OTP in config
const newARVRLogin = async function (req, res) {
	try {
		///Add Check
		//Only for TASL
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}
		let schema = Joi.object({
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(), // Country (required)
			// app: Joi.boolean().required(),
			// app_version: Joi.string().trim().min(5).max(10).required(), // Country (required)
			// type: Joi.string().required(),
			momentDate: Joi.string()
				.pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4} ([01][0-9]|2[0-3]):([0-5][0-9])$/)
				.message('Date must be in DD-MM-YYYY HH:mm format'),
			// sessioncode: Joi.string().trim().min(3).max(15),
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
		const type = body?.type ? body.type : 'diwo';

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
				`AR-VR Login`,
				req.ip,
				req.useragent,
				type,
				null
			);

			// Sending JWT token and formatted user info in the response
			const token = await userClientRoleDetails[0].User.getJWT(
				userClientRoleDetails[0].RoleId,
				userClientRoleDetails[0].ClientId,
				type,
				6 * 60 * 60 * 1000,
				'AR-VR'
			);

			// res.cookie('jwt', token, {
			// 	httpOnly: true, // Prevent JavaScript access
			// 	secure: env == 'development' || env == 'dev' || env == 'local' ? false : true, // Send only over HTTPS
			// 	sameSite: env == 'development' || env == 'dev' || env == 'local' ? 'Lax' : 'Strict',
			// 	maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
			// 	// path: '/',
			// });
			const userPersonalDetails = {
				first: user_info.first,
				last: user_info.last,
			};
			return ResponseSuccess(res, {
				// token: token,
				user: userPersonalDetails,
				token,
			});
		}

		return ResponseSuccess(res, {
			user: userClientRoleDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.newARVRLogin = newARVRLogin;

//Admin Site Get API
const getGuidList = async function (req, res) {
	try {
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}

		//Sample Guide List
		let response = [
			{
				id: 1,
				name: 'Guide 1',
				isDeleted: false,
			},
			{
				id: 2,
				name: 'Guide 2',
				isDeleted: false,
			},
			{
				id: 3,
				name: 'Guide 3',
				isDeleted: false,
			},
			{
				id: 4,
				name: 'Guide 4',
				isDeleted: false,
			},
		];

		if (response) {
		} else {
			response;
		}
		return ResponseSuccess(res, {
			data: response,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getGuidList = getGuidList;

const getAssignedModuleList = async function (req, res) {
	try {
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}
		//
		const UserId = req.user.id;

		[err, data] = await to(
			SessionUser.findAll({
				where: {
					UserId: UserId,
					isDeleted: false,
				},
				include: [
					{
						model: SessionWorksheet,
						where: {
							type: 'Learning Content',
							GuideId: {
								[Op.ne]: null,
							},
							// attendGuide: true,
						},
						attributes: [
							'id',
							'SessionUserId',
							'type',
							'submit',
							'score',
							'seconds',
							'percent',
							'duration',
							'index',
							'worksheetStatus',
							'GuideId',
							'attendGuide',
						],
						required: true,
					},
				],
				order: [
					[
						{
							model: SessionWorksheet,
						},
						'id',
						'ASC',
					],
				],
				attributes: [
					'id',
					'UserId',
					'SessionId',
					'status',
					'isDeleted',
					'SessionStatus',
					'attendanceStatus',
					'expiryDate',
					'ModuleStatus',
					'isAccess',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let payload = [];
		if (data?.length > 0) {
			for (let sessionUser of data) {
				let temp = sessionUser.convertToJSON();
				delete temp.SessionWorksheets;
				delete temp.id;
				console.log(sessionUser);
				for (let sw of sessionUser.SessionWorksheets) {
					payload.push({ ...sw.convertToJSON(), ...temp });
				}
			}
		}
		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAssignedModuleList = getAssignedModuleList;

const updateWorksheetStatus = async function (req, res) {
	try {
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}

		/*
            data = [
                {
                    id: 23,
                    seconds: 34.904.
                    percent: 30,
                    duration: 60,
                    worksheetStatus: 'Completed','In Progress',
                    SessionUserId:293,
					GuideId:2
                }]
        */

		if (req?.body?.length > 0) {
			//update worksheetStatus, duration, percentage, seconds
			for (let data of req.body) {
				if (data?.id) {
					let payload = data;
					// If Required
					// if (payload.worksheetStatus == 'Completed') {
					// 	payload.submit = true;
					// } else {
					// 	payload.submit = false;
					// }

					[err, updateData] = await to(
						SessionWorksheet.update(payload, {
							where: {
								id: payload.id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					//need to check all SessionWorksheet and SessionUser and Course Pathway Status

					if (payload.worksheetStatus == 'Completed' && payload?.SessionUserId) {
						updateCourseAndPathwayStatus(payload.SessionUserId);
					}
				}
			}
		}

		return ResponseSuccess(res, {
			message: MESSAGE.UPDATE,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateWorksheetStatus = updateWorksheetStatus;

const ARVRLogout = async function (req, res) {
	try {
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}
		let text = 'AR-VR Logout';

		const schema = Joi.object({
			UserId: Joi.number().integer().positive().required(),
			ClientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			UserId: req.user.id,
			ClientId: req.user.ClientId,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { UserId, ClientId } = value;

		let RoleId = req?.user?.RoleId ? req.user.RoleId : 1;
		let type = req?.user?.type ? req.user.type : 'diwo';

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		[err, newLog] = await to(createlog(UserId, ClientId, RoleId, text, req.ip, req.useragent, type, null));
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: 'Logout Successfully!!' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.ARVRLogout = ARVRLogout;

const updateAtentGuideFlag = async function (req, res) {
	try {
		if (config_feature?.configurable_feature?.sles == false && config_feature?.configurable_feature?.arvr == false) {
			return ResponseError(res, { message: MESSAGE.SERVICE_NOT_AVALIBLE }, 401);
		}
		const schema = Joi.object({
			SessionWorkSheetId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			SessionWorkSheetId: req.body.SessionWorkSheetId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { SessionWorkSheetId } = value;

		[err, updateFlag] = await to(
			SessionWorksheet.update(
				{ attendGuide: true },
				{
					where: {
						id: SessionWorkSheetId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: 'Guid Update Successfully!!' });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateAtentGuideFlag = updateAtentGuideFlag;
