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
	User_group,
	User_group_mapping,
	Upload_learner,
	PolicyChangeLog,
	System_branding,
	DiwoSystemBranding,
	Update_learner,
	UplodedOnlyOnDripApp,
	UplodedDripAppEmail,
	UplodedDripAppWhatsapp,
	UplodedOnlyOnWhatsapp,
	UplodedLinkAsset,
	ClientTeamSetup,
	TeamSetup,
	TeamChatDetail,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
const Joi = require('joi');
const fs = require('fs');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const schedule = require('node-schedule');
const CONFIG = require('../config/config')[env];
const { sendDripEmail } = require('../services/mailer.service');
const {
	getAllSubChildClientIds,
	getClientAppBrandingByClientId,
	getDiwoClientAppBrandingByClientId,
	getAllSubClientAndBranchAccountLists,
	getAccountCustomField,
	getUpperLevelAccountDetailsUptoClientAccount,
} = require('../services/client.service');
const {
	getAddOneLearnerCount,
	getRemoveOneLearnerCount,
	getRemoveOneLearnerCountForDiwo,
	getLearnerValidaionOnCreateLearner,
	getClientChildVilidation,
	getLearnerValidaionOnCreateLearnerForDiwo,
	getAddOneLearnerCountForDiwo,
	getAddMultipalLearnerCount,
	getAddMultipalLearnerCountForDiwo,
	getLearnerValidaionCount,
	getLearnerValidaionCountForDiwo,
} = require('../services/license.service');
const {
	learnerAddedIntoGroupCampaignStartRule,
	learnerAddedTagsCampaignStartRule,
	getReservedTags,
} = require('../services/campaign.service');
const { learnerOptInLog, learnerOptInLogBulkCreate } = require('../services/log.service');
const { capitalFirstLatter } = require('../services/auth.service');
const {
	getAllUserIdsForNotification,
	createNotification,
	createNotificationforDiwo,
	getAllDiwoUserIdsForNotification,
} = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const { updateUserAccountId } = require('../services/auth.service');
const { getChatIdByTeamUserId } = require('../services/microsoft-team.service');
const {
	generatePassword,
	hashPassword,
	triggerLearnerResetPassWordLink,
	triggerAdminUserResetPassWordLink,
} = require('../services/login.service');
const { getTeamUserIdByUsingEmail, getTeamAccessTokenByClientId } = require('./microsoft-teams.controller');
const {
	sendUserWelcomeEmailToLearner,
	sendCreatePassEmailToLearner,
	bulksendCreatePassEmailToLearner,
	bulksendUserWelcomeEmailToLearner,
} = require('../services/mailer.service');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const shortid = require('shortid');
const Sequelize = require('sequelize');
const { use } = require('passport');
const { file } = require('pdfkit');
const { isValidPhoneNumber } = require('libphonenumber-js');

const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');

const validationConstant = require('../config/validationConstant.json');
const config_feature = require('../config/SiteConfig.json');

const createLearner = async function (req, res) {
	try {
		// let clientId = parseInt(req.params.clientId);
		let clientId = req.user.ClientId;
		let err, createUser;
		// let user_details = req.body.userDetails;
		// let client_Role_details = req.body.clientDetails;
		let localUserPhoneExits;
		let localUserEmailExits;
		let localUserNameExits;
		let checkCount;

		// Validate all Payload Data
		const schema = Joi.object({
			first: Joi.string().trim().min(validationConstant.first.min).max(validationConstant.first.max).required(),
			last: Joi.string().trim().min(validationConstant.last.min).max(validationConstant.last.max).required(),
			email: Joi.string().email(),
			phone: Joi.number().integer().allow(null).allow(''),
			city: Joi.string().trim().min(validationConstant.city.min).max(validationConstant.city.max).allow(null).allow(''),
			state: Joi.string()
				.trim()
				.min(validationConstant.state.min)
				.max(validationConstant.state.max)
				.allow(null)
				.allow(''),
			zipCode: Joi.string()
				.trim()
				.min(validationConstant.zipCode.min)
				.max(validationConstant.zipCode.max)
				.allow(null)
				.allow(''),
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(),
			CountryId: Joi.number()
				.integer()
				.min(validationConstant.CountryId.min)
				.max(validationConstant.CountryId.max)
				.required(),
			job_role_id: Joi.number().integer().positive().allow(null),
			clientId: Joi.number().integer().positive().required(),
			tags: Joi.alternatives().try(Joi.string().trim().allow(null).allow(''), Joi.array().items(Joi.string())),
			haveWhatsAppOptIn: Joi.boolean().required().allow(null),
			triggerOptInMsg: Joi.boolean().allow(null),
			haveEmailPer: Joi.boolean().allow(null),
			forDrip: Joi.boolean().required(),
			forDiwo: Joi.boolean().required(),
			groupId: Joi.array().items(Joi.number().integer().positive()).allow(null),
			team_id: Joi.alternatives().try(
				Joi.string().min(validationConstant.team_id.min).max(validationConstant.team_id.max),
				Joi.allow(null)
			),
			username: Joi.string()
				.trim()
				.min(validationConstant.username.min)
				.max(validationConstant.username.max)
				.allow(null)
				.allow(''),
			customFields: Joi.object().allow(null, {}),
		});
		const { error, value } = schema.validate(req.body.userDetails);
		let user_details = value;
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);
		// let type = req.params.type;

		//Check Learner ClientId and User ClientId
		//Check Client Access
		if (!(await checkClientIdAccess(clientId, user_details.clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let validlicenseForUnification = true;
		if (type == 'drip') {
			checkCount = await getLearnerValidaionOnCreateLearner(user_details.clientId);
		} else if (type == 'diwo') {
			//Add Check in To Diwo
			checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(user_details.clientId);
		}

		[err, market] = await to(
			Market.findOne({
				include: [
					{
						model: Country,
						where: {
							id: user_details.CountryId,
						},
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (market) {
			user_details.email = user_details.email ? user_details.email.toLowerCase() : null;

			let payload = {
				email: user_details.email ? user_details.email : null,
				phone: user_details.phone ? user_details.phone.toString() : null,
				username: user_details.username ? user_details.username.toString() : null,
			};
			let checkLearnerCanCreateOrNot = await checkDuplicateLearnerDetails(user_details.clientId, payload, type);

			// console.log('---checkLearnerCanCreateOrNot---', checkLearnerCanCreateOrNot);

			if (checkLearnerCanCreateOrNot) {
				// Create User
				user_details.MarketId = market.id;
				user_details.status = true;
				user_details.is_verified = false;
				user_details.is_deleted = false;
				user_details.type = 'Learner';
				user_details.account_id = '0';
				if (checkCount) {
					user_details.cStatus = 'Active';
				} else {
					user_details.cStatus = 'Unlicensed';
				}
				if (type == 'drip') {
					user_details.forDrip = true;
				} else if (type == 'diwo') {
					user_details.forDiwo = true;
				}

				//forDiwoLicense Add Count
				if (type == 'drip' && user_details.forDiwo) {
					let diwoCheckCount = await getLearnerValidaionOnCreateLearnerForDiwo(user_details.clientId);
					if (diwoCheckCount) {
						await getAddOneLearnerCountForDiwo(user_details.clientId);
						user_details.forDiwo = true;
					} else {
						user_details.forDiwo = false;
						validlicenseForUnification = false;
					}
				}

				//for Drip License Add Count
				if (type == 'diwo' && user_details.forDrip) {
					let dripCheckCount = await getLearnerValidaionOnCreateLearner(user_details.clientId);
					if (dripCheckCount) {
						await getAddOneLearnerCount(user_details.clientId);
						user_details.forDrip = true;
					} else {
						user_details.forDrip = false;
						validlicenseForUnification = false;
					}
				}

				//For Team Id

				let team_id = user_details.team_id;
				if (!team_id) {
					user_details.team_id = await getTeamUserIdByUsingEmail(user_details.clientId, user_details.email);
					team_id = user_details.team_id;
				}

				//Update Team Chat Details
				//Get Team Setup
				//Get User Team Id
				//Get Chat Id
				//Update Team Id and Chat Id
				[err, getTeamSetup] = await to(
					ClientTeamSetup.findOne({
						where: {
							ClientId: user_details.clientId,
						},
						include: [{ model: TeamSetup }],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				let chatId;
				if (getTeamSetup) {
					if (team_id) {
						const payload_01 = {
							access_token: getTeamSetup.TeamSetup.access_token,
							team_id: getTeamSetup.TeamSetup.team_id,
						};
						chatId = await getChatIdByTeamUserId(team_id, payload_01);
					}
				}
				//Add Policy
				// user_details.userPolicyDetails = await getAllLatestPolicyByMarketId(market.id);
				user_details.acceptPolicy = false;
				[err, createUser] = await to(User.create(user_details));
				if (err) return ResponseError(res, err, 500, true);

				//Update Learner Account Id
				await updateUserAccountId();

				user_details.first = await capitalFirstLatter(user_details.first);
				user_details.last = await capitalFirstLatter(user_details.last);

				///////////////////////////////////////// Gernerate Password ////////////////////////////////////////////////
				if (config_feature?.configurable_feature?.pwa_password) {
					try {
						const password = await generatePassword();
						// console.log('---Generated Password--', password);

						user_details.password = await hashPassword(password);
						// console.log('-- Hashed Password--', user_details.password);
					} catch (error) {
						console.error('----Error while generating or hashing password:----', error.message);
						ThrowException(error.message);
					}
				}

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
				let userId = createUser.id;

				//Update Chat id
				if (chatId) {
					[err, saveChatDetails] = await to(
						TeamChatDetail.create({
							UserId: userId,
							chat_id: chatId,
							ClientId: user_details.clientId,
							TeamSetupId: getTeamSetup.TeamSetupId,
						})
					);
				}

				let payload = {
					RoleId: 1, //Learner Role
					UserId: userId,
					ClientId: user_details.clientId,
				};

				payload.forDrip = createUser.forDrip;
				payload.forDiwo = createUser.forDiwo;

				[err, create_user_role] = await to(User_role_client_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);

				//Create User Job Role
				if (user_details.job_role_id) {
					let payload_ = {
						UserId: userId,
						ClientJobRoleId: user_details.job_role_id,
						forDrip: false,
						forDiwo: false,
					};

					if (type == 'drip') {
						payload_.forDrip = true;
					} else if (type == 'diwo') {
						payload_.forDiwo = true;
					}

					payload_.forDrip = createUser.forDrip;
					payload_.forDiwo = createUser.forDiwo;

					[err, addUserJobRole] = await to(User_job_role_mapping.create(payload_));
					if (err) return ResponseError(res, err, 500, true);

					// if (type == 'drip') {
					// 	[err, addUserJobRole] = await to(
					// 		User_job_role_mapping.create(payload_)
					// 	);
					// 	if (err) return ResponseError(res, err, 500, true);
					// } else if (type == 'diwo') {
					// 	[err, addUserJobRole] = await to(
					// 		User_job_role_mapping.create(payload_)
					// 	);
					// 	if (err) return ResponseError(res, err, 500, true);
					// }
				}

				//Add Learner into Default Learner Group
				if (checkCount) {
					await addNewLearnerIntoDefaultLeanrerGroup([userId], type);
				}

				if (type == 'drip') {
					if (user_details && user_details.tags) {
						learnerAddedTagsCampaignStartRule(user_details.tags, user_details.clientId, userId);
					}
				}

				if (type == 'drip') {
					if (checkCount) {
						await getAddOneLearnerCount(user_details.clientId);
					}
				} else if (type == 'diwo') {
					if (checkCount) {
						await getAddOneLearnerCountForDiwo(user_details.clientId);
					}
				}

				//Learner Opt-In Part

				//If Admin user have permission of learner OPT-In log
				//Maintain OptIn Log
				if (user_details.haveWhatsAppOptIn && user_details.cStatus == 'Active') {
					if (type == 'drip') {
						let payload = {
							acceptDate: new Date(),
							UserId: userId,
							type: 'WhatsApp OPT-IN',
							policyType: 'OPT-IN',
							// ipAddress:''
							// macAddress:'',
							ClientId: user_details.clientId,
							acceptanceType: 'Declaration by Client',
						};
						await learnerOptInLog(payload, type);
					}
					let payload_ = {
						acceptDate: new Date(),
						UserId: userId,
						type: 'Email Permission',
						policyType: 'Email Permission',
						// ipAddress:''
						// macAddress:'',
						ClientId: user_details.clientId,
						acceptanceType: 'Declaration by Client',
					};
					await learnerOptInLog(payload_, type);
				}

				if (user_details.cStatus == 'Active' && user_details.triggerOptInMsg && user_details.phone) {
					//Trigger Whats APP OPT-In Message
					if (type == 'drip') {
						sendWhatsAppOptInMsg([user_details.phone], clientId, req.user.id);
					}
				}

				//Check For Welcome Email
				//Get Client App Branding
				if (user_details && user_details.email) {
					if (type == 'drip') {
						checkAndTriggeredWelcomeEmail([user_details.email], clientId);
					} else if (type == 'diwo') {
						checkAndTriggeredWelcomeEmailForDiwo([user_details.email], clientId);
					}
				}

				/////////////////--------------Send Password Reset Link---------------////////////////////
				// if (user_details && user_details.email && user_details.cStatus == 'Active') {
				// 	if (config_feature?.configurable_feature?.pwa_password) {
				// 		triggerLearnerResetPassWordLink(
				// 			userId,
				// 			user_details.clientId,
				// 			type,
				// 			CONFIG.jwt_expiration_reset_password_admin,
				// 			'learnerAdded'
				// 		);
				// 	}
				// }

				//Add (Learner/contact) to (Learner/Contact) Group
				if (checkCount) {
					if (user_details.cStatus == 'Active') {
						//for update userCount In Group
						[err, learnerGroup_] = await to(
							User_group.findAll({
								where: {
									id: user_details.groupId,
								},
								attributes: ['id', 'userCount'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (learnerGroup_ && learnerGroup_.length > 0) {
							for (let group of learnerGroup_) {
								let group_ = group.convertToJSON();

								let userCountPayload = {
									userCount: group_.userCount + 1,
								};

								[err, updateUserGroup] = await to(
									User_group.update(userCountPayload, {
										where: {
											id: group_.id,
										},
									})
								);
								if (err) return ResponseError(res, err, 500, true);
							}
						}

						if (user_details?.groupId?.length > 0) {
							for (let groupId of user_details.groupId) {
								let payload = {
									UserId: createUser.id,
									UserGroupId: groupId,
								};

								[err, addLearnerIntoGroup] = await to(User_group_mapping.create(payload));
								if (err) return ResponseError(res, err, 500, true);

								if (addLearnerIntoGroup) {
									if (type == 'drip') {
										learnerAddedIntoGroupCampaignStartRule(addLearnerIntoGroup.UserGroupId, [createUser.id]);
									}
								}
							}
						}
					}
				}

				//Notification
				[err, getUser] = await to(
					User.findOne({
						where: {
							id: req.user.id,
						},
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

				[err, localUserData] = await to(
					dbInstance[getUser.Market.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				const userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
					localUserData && localUserData.last ? localUserData.last : ''
				}`;
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: user_details.clientId,
						},
						attributes: ['name'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				let notifcationMessage = MESSAGE.Learner_Created;
				notifcationMessage = notifcationMessage.replace('{{count}}', 1);
				notifcationMessage = notifcationMessage.replace('{{branch_name}}', parentClient.name);
				notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
				notifcationMessage = notifcationMessage.replace('{{Tag_Learner_Created}}', '');
				if (type == 'drip') {
					notifcationMessage = notifcationMessage.replace('{{type}}', 'contact');
					userIds = await getAllUserIdsForNotification(clientId);
					var index = userIds.indexOf(req.user.id);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotification(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.Learner_Created;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', 1);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', parentClient.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{type}}', 'contact');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{Tag_Learner_Created}}', '');
					await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
				} else if (type == 'diwo') {
					notifcationMessage = notifcationMessage.replace('{{type}}', 'learner');
					userIds = await getAllDiwoUserIdsForNotification(clientId);
					var index = userIds.indexOf(req.user.id);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.Learner_Created;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', 1);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', parentClient.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{type}}', 'learner');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{Tag_Learner_Created}}', '');
					await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
				}

				// Sending welcome email to learner user email with otp
				if (req?.body?.userDetails?.email && config_feature?.configurable_feature?.pwa_otp && req.user.type == 'diwo') {
					learnerUserWelcomeMailNotification(req, res);
				}

				// Sending welcome email to learner user email with create password link
				if (
					req?.body?.userDetails?.email &&
					config_feature?.configurable_feature?.pwa_password &&
					req.user.type == 'diwo'
				) {
					learnerUserMailWithCreatePassWordLinkNotification(req, res);
				}

				// Sending welcome email to learner user email with otp drip
				if (req?.body?.userDetails?.email && config_feature?.configurable_feature?.pwa_otp && req.user.type == 'drip') {
					learnerUserWelcomeMailNotification(req, res);
				}

				// Sending welcome email to learner user email with create password link drip
				if (
					req?.body?.userDetails?.email &&
					config_feature?.configurable_feature?.pwa_password &&
					req.user.type == 'drip'
				) {
					learnerUserMailWithCreatePassWordLinkNotification(req, res);
				}

				[err, newLog] = await to(
					createlog(
						req.user.id,
						req.user.ClientId,
						req.user.RoleId,
						`Create Learner`,
						req.ip,
						req.useragent,
						req.user.type,
						{
							UserId: createUser.id,
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				return ResponseSuccess(res, {
					data: userDetail,
					validlicenseForUnification: validlicenseForUnification,
				});
			} else {
				let marketUser = market.convertToJSON();

				if (user_details.email) {
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
				}

				if (user_details.phone) {
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

				if (config_feature?.configurable_feature?.pwa_username) {
					if (user_details.username) {
						[err, localUserNameExits] = await to(
							dbInstance[marketUser.db_name].User_master.findOne({
								where: {
									username: user_details.username,
									isDeleted: false,
								},
								attributes: ['username'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}

				let mesg;
				if (localUserEmailExits && !localUserPhoneExits && !localUserNameExits) {
					mesg = MESSAGE.EMAIL_EXITS;
				} else if (!localUserEmailExits && localUserPhoneExits && !localUserNameExits) {
					mesg = MESSAGE.PHONE_EXITS;
				} else if (!localUserEmailExits && !localUserPhoneExits && localUserNameExits) {
					mesg = MESSAGE.USERNAME_EXITS;
				} else if (localUserEmailExits && localUserPhoneExits && !localUserNameExits) {
					mesg = MESSAGE.EMAIL_AND_PHONE_EXITS;
				} else if (localUserEmailExits && !localUserPhoneExits && localUserNameExits) {
					mesg = MESSAGE.EMAIL_AND_USERNAME_EXITS;
				} else if (!localUserEmailExits && localUserPhoneExits && localUserNameExits) {
					mesg = MESSAGE.PHONE_AND_USERNAME_EXITS;
				} else if (localUserEmailExits && localUserPhoneExits && localUserNameExits) {
					mesg = MESSAGE.EMAIL_PHONE_AND_USERNAME_EXITS;
				} else {
					mesg = MESSAGE.INVALID_USER;
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
module.exports.createLearner = createLearner;

const updateLearner = async function (req, res) {
	try {
		let err;
		// let user_details = req.body.userDetails;
		// let client_Role_details = req.body.clientDetails;
		// let learnerId = parseInt(req.params.learnerId);
		let clientId = parseInt(req.user.ClientId);
		let adminUserId = parseInt(req.user.id);
		// let job_role_name = req.body.userDetails;
		let user_;
		// let type = req.params.type;
		// Validate all Payload Data
		const schema = Joi.object({
			first: Joi.string().trim().min(validationConstant.first.min).max(validationConstant.first.max).required(),
			last: Joi.string().trim().min(validationConstant.last.min).max(validationConstant.last.max).required(),
			email: Joi.string().email(),
			phone: Joi.number().integer().allow(null).allow(''),
			city: Joi.string().trim().min(validationConstant.city.min).max(validationConstant.city.max).allow(null).allow(''),
			state: Joi.string()
				.trim()
				.min(validationConstant.state.min)
				.max(validationConstant.state.max)
				.allow(null)
				.allow(''),
			zipCode: Joi.string()
				.trim()
				.min(validationConstant.zipCode.min)
				.max(validationConstant.zipCode.max)
				.allow(null)
				.allow(''),
			country: Joi.string().trim().min(validationConstant.country.min).max(validationConstant.country.max).required(),
			CountryId: Joi.number()
				.integer()
				.min(validationConstant.CountryId.min)
				.max(validationConstant.CountryId.max)
				.required(),
			job_role_id: Joi.number().integer().positive().allow(null),
			clientId: Joi.number().integer().positive().required(),
			tags: Joi.alternatives().try(Joi.string().trim().allow(null).allow(''), Joi.array().items(Joi.string())),
			haveWhatsAppOptIn: Joi.boolean().required().allow(null),
			triggerOptInMsg: Joi.boolean().allow(null),
			haveEmailPer: Joi.boolean().allow(null),
			forDrip: Joi.boolean().required(),
			forDiwo: Joi.boolean().required(),
			groupId: Joi.array().items(Joi.number().integer().positive()).allow(null),
			team_id: Joi.alternatives().try(
				Joi.string().min(validationConstant.team_id.min).max(validationConstant.team_id.max),
				Joi.allow(null)
			),
			customFields: Joi.object().allow(null, {}),
			learnerId: Joi.number().integer().positive(),
			username: Joi.string()
				.trim()
				.min(validationConstant.username.min)
				.max(validationConstant.username.max)
				.allow(null)
				.allow(''),
		});
		const { error, value } = schema.validate({ ...req.body.userDetails, ...{ learnerId: req.params.learnerId } });

		let user_details = value;
		let learnerId = user_details.learnerId;
		delete user_details.learnerId;

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);
		// let type = req.params.type;

		//Check Learner ClientId and User ClientId
		//Check Client Access
		if (!(await checkClientIdAccess(clientId, user_details.clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let localUserPhoneExits;
		let localUserEmailExits;
		let localUserNameExits;
		let user;
		let validlicenseForUnification = true;
		[err, market] = await to(
			Market.findOne({
				include: [
					{
						model: Country,
						where: {
							id: user_details.CountryId,
						},
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, user] = await to(
			User.findOne({
				where: {
					id: learnerId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (market) {
			user_details.email = user_details.email ? user_details.email.toLowerCase() : null;
			user_details.MarketId = market.id;
			user_details.status = true;
			user_details.is_verified = false;
			user_details.is_deleted = false;

			//Check Tag Start Rule Campaign

			if (user_details && user_details.tags) {
				[err, user_] = await to(
					User.findOne({
						where: {
							id: learnerId,
						},
						attributes: ['id', 'tags', 'opt_in'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				let newTags = [];
				if (user_) {
					let beforeUpdateTags;
					let afterUpdateTags;
					if (user_ && user_.tags) {
						beforeUpdateTags = user_.tags.split(',');
					}

					if (user_details && user_details.tags) {
						afterUpdateTags = user_details.tags.split(',');
					}

					if (afterUpdateTags && afterUpdateTags.length > 0 && beforeUpdateTags && beforeUpdateTags.length > 0) {
						for (let afterTag of afterUpdateTags) {
							let flag = true;
							for (let beforeTag of beforeUpdateTags) {
								if (beforeTag == afterTag) {
									flag = false;
								}
							}
							if (flag) {
								newTags.push(afterTag);
							}
						}
					} else if (afterUpdateTags && afterUpdateTags.length > 0) {
						for (let afterTag of afterUpdateTags) {
							newTags.push(afterTag);
						}
					}
					if (newTags && newTags.length > 0) {
						let tag = newTags.toString();
						learnerAddedTagsCampaignStartRule(tag, user_details.clientId, learnerId);
					}
				}
			}

			if (type == 'drip') {
				user_details.forDrip = true;
				if (user.cStatus == 'Active') {
					if (user_details.haveWhatsAppOptIn == true) {
						if (user.opt_in == false) {
							user_details.opt_in = false;
							user_details.optTrigger = false;
							user_details.optError = null;
							user_details.opt_out = false;
							user_details.optOutTrigger = false;
						}
					} else if (user_details.haveWhatsAppOptIn == false) {
						if (user.opt_in == true) {
							user_details.opt_in = false;
							user_details.optTrigger = false;
							user_details.optError = null;
							user_details.opt_out = true;
							user_details.optOutTrigger = false;
						}
					}
					// else {
					// 	user_details.opt_in = true;
					// 	user_details.optTrigger = true;
					// }
				}
			} else if (type == 'diwo') {
				user_details.forDiwo = true;
			}

			//forDiwoLicense Remove Count
			if (type == 'drip' && user.forDiwo && !user_details.forDiwo) {
				await getRemoveOneLearnerCountForDiwo(user_details.clientId);
			} else if (type == 'drip' && !user.forDiwo && user_details.forDiwo) {
				let diwoCheckCount = await getLearnerValidaionOnCreateLearnerForDiwo(user_details.clientId);
				if (diwoCheckCount) {
					await getAddOneLearnerCountForDiwo(user_details.clientId);
					user_details.forDiwo = true;
				} else {
					user_details.forDiwo = false;
					validlicenseForUnification = false;
				}
			}

			//for Drip License Remove Count
			if (type == 'diwo' && user.forDrip && !user_details.forDrip) {
				await getRemoveOneLearnerCount(user_details.clientId);
			} else if (type == 'diwo' && !user.forDrip && user_details.forDrip) {
				let dripCheckCount = await getLearnerValidaionOnCreateLearner(user_details.clientId);
				if (dripCheckCount) {
					await getAddOneLearnerCount(user_details.clientId);
					user_details.forDrip = true;
				} else {
					user_details.forDrip = false;
					validlicenseForUnification = false;
				}
			}

			[err, updateUser] = await to(
				User.update(user_details, {
					where: {
						id: learnerId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let marketUser = market.convertToJSON();

			if (user_details.email) {
				[err, localUserEmailExits] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: {
							email: user_details.email,
							isDeleted: false,
						},
						attributes: ['email', 'id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (user_details.phone) {
				[err, localUserPhoneExits] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: {
							phone: user_details.phone.toString(),
							isDeleted: false,
						},
						attributes: ['phone', 'id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (user_details.username) {
				[err, localUserNameExits] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: {
							phone: user_details.username.toString(),
							isDeleted: false,
						},
						attributes: ['username', 'id'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			let flag = true;
			let Emailflag = true;
			if (user_details.email && localUserEmailExits.length > 0) {
				Emailflag = false;
				for (let record of localUserEmailExits) {
					if (record.id == user.local_user_id) {
						Emailflag = true;
					}
				}
			}

			let Phoneflag = true;
			if (user_details.phone && localUserPhoneExits.length > 0) {
				Phoneflag = false;

				for (let record of localUserPhoneExits) {
					if (record.id == user.local_user_id) {
						Phoneflag = true;
					}
				}
			}

			let UserNameflag = true;
			if (user_details.phone && localUserPhoneExits.length > 0) {
				UserNameflag = false;

				for (let record of localUserPhoneExits) {
					if (record.id == user.local_user_id) {
						UserNameflag = true;
					}
				}
			}

			if (!Emailflag || !Phoneflag || !UserNameflag) {
				let mesg;
				flag = false;
				// if (!Emailflag && !Phoneflag) {
				// 	mesg = MESSAGE.EMAIL_AND_PHONE_EXITS;
				// } else if (!Phoneflag) {
				// 	mesg = MESSAGE.PHONE_EXITS;
				// } else if (!Emailflag) {
				// 	mesg = MESSAGE.EMAIL_EXITS;
				// }

				if (!Emailflag && Phoneflag && UserNameflag) {
					mesg = MESSAGE.EMAIL_EXITS;
				} else if (Emailflag && !Phoneflag && UserNameflag) {
					mesg = MESSAGE.PHONE_EXITS;
				} else if (Emailflag && Phoneflag && !UserNameflag) {
					mesg = MESSAGE.USERNAME_EXITS;
				} else if (!Emailflag && !Phoneflag && UserNameflag) {
					mesg = MESSAGE.EMAIL_AND_PHONE_EXITS;
				} else if (!Emailflag && Phoneflag && !UserNameflag) {
					mesg = MESSAGE.EMAIL_AND_USERNAME_EXITS;
				} else if (Emailflag && !Phoneflag && !UserNameflag) {
					mesg = MESSAGE.PHONE_AND_USERNAME_EXITS;
				} else if (!Emailflag && !Phoneflag && !UserNameflag) {
					mesg = MESSAGE.EMAIL_PHONE_AND_USERNAME_EXITS;
				} else {
					mesg = MESSAGE.INVALID_USER;
				}

				let payload = {
					email: !Emailflag && user_details.email ? user_details.email : null,
					phone: !Phoneflag && user_details.phone ? user_details.phone.toString() : null,
					username: !UserNameflag && user_details.username ? user_details.username.toString() : null,
				};
				let checkLearnerCanUpdateOrNot = await checkDuplicateLearnerDetails(user_details.clientId, payload, type);
				if (checkLearnerCanUpdateOrNot == false) {
					return ResponseError(
						res,
						{
							message: mesg,
						},
						500
					);
				} else {
					flag = true;
				}
			}

			if (flag) {
				[err, localUser] = await to(
					dbInstance[market.db_name].User_master.findOne({
						where: {
							id: user.local_user_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser && localUser.phone) {
					if (localUser.phone != user_details.phone) {
						[err, updateUser] = await to(
							User.update(
								{
									optTrigger: false,
									opt_in: false,
									opt_id: null,
									optError: null,
								},
								{
									where: {
										id: learnerId,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}

				user_details.first = await capitalFirstLatter(user_details.first);
				user_details.last = await capitalFirstLatter(user_details.last);

				[err, updateLocalUser] = await to(
					dbInstance[market.db_name].User_master.update(user_details, {
						where: {
							id: user.local_user_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let userDetail = user.convertToJSON();
				[err, localUser] = await to(
					dbInstance[market.db_name].User_master.findOne({
						where: {
							id: user.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
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
					userDetail.state = localUser.state;
					userDetail.zipCode = localUser.zipCode;
				}

				// Create User Role

				let userId = learnerId;
				let payload = {
					ClientId: user_details.clientId,
				};

				payload.forDrip = user_details.forDrip;
				payload.forDiwo = user_details.forDiwo;

				[err, create_user_role] = await to(
					User_role_client_mapping.update(payload, {
						where: {
							RoleId: 1,
							UserId: userId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// Destroy User Job Role
				if (type == 'drip') {
					[err, destroyJobRole] = await to(
						User_job_role_mapping.destroy({
							where: {
								UserId: userId,
								forDrip: true,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo') {
					[err, destroyJobRole] = await to(
						User_job_role_mapping.destroy({
							where: {
								UserId: userId,
								forDiwo: true,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				//Create User Job Role
				if (user_details.job_role_id) {
					let payload_ = {
						UserId: userId,
						ClientJobRoleId: user_details.job_role_id,
						forDrip: false,
						forDiwo: false,
					};

					if (type == 'drip') {
						payload_.forDrip = true;
					} else if (type == 'diwo') {
						payload_.forDiwo = true;
					}

					payload_.forDrip = user_details.forDrip;
					payload_.forDiwo = user_details.forDiwo;

					[err, addUserJobRole] = await to(User_job_role_mapping.create(payload_));
				}

				//update Learner Group
				if (user.cStatus == 'Active') {
					//Get all Old User Data Data
					let clientUserGroupIds = [];

					if (type == 'drip') {
						[err, clientUserGroup] = await to(
							User_group.findAll({
								where: {
									forDrip: true,
									is_deleted: false,
									ClientId: clientId,
									UserId: adminUserId,
									defaultGroupForDiwo: false,
									defaultGroupForDrip: false,
								},
								attributes: ['id'],
							})
						);
					} else if (type == 'diwo') {
						[err, clientUserGroup] = await to(
							User_group.findAll({
								where: {
									forDiwo: true,
									is_deleted: false,
									ClientId: clientId,
									UserId: adminUserId,
									defaultGroupForDiwo: false,
									defaultGroupForDrip: false,
								},
								attributes: ['id'],
							})
						);
					}

					if (clientUserGroup && clientUserGroup.length > 0) {
						for (let data of clientUserGroup) {
							clientUserGroupIds.push(data.id);
						}
					}

					// console.log('--clientUserGroupIds-', clientUserGroupIds);

					if (clientUserGroupIds && clientUserGroupIds.length > 0) {
						let exstingId;
						// const query1 = ` SELECT ARRAY(SELECT "UserGroupId"
						// 				FROM "User_group_mappings"
						// 				JOIN "User_groups" ON "User_group_mappings"."UserGroupId" = "User_groups".id
						// 				WHERE "User_group_mappings"."UserId" = ${learnerId}
						// 				AND "UserGroupId" IN (${clientUserGroupIds.toString()})
						// 				AND "User_groups"."defaultGroupForDrip" = false
						// 				AND "User_groups"."defaultGroupForDiwo" = false);;`;
						// [exstingId] = await sequelize.query(query1);

						const query1 = `
							SELECT ARRAY (
								SELECT "UserGroupId"
								FROM "User_group_mappings"
								JOIN "User_groups" ON "User_group_mappings"."UserGroupId" = "User_groups".id
								WHERE "User_group_mappings"."UserId" = :learnerId
								AND "UserGroupId" IN (:clientUserGroupIds)
								AND "User_groups"."defaultGroupForDrip" = false
								AND "User_groups"."defaultGroupForDiwo" = false
							);
						`;

						exstingId = await sequelize.query(query1, {
							replacements: {
								learnerId,
								clientUserGroupIds,
							},
							type: sequelize.QueryTypes.SELECT,
						});

						// console.log('---------exstingId-----------', exstingId[0].array);
						let addedIds =
							user_details && user_details.groupId
								? user_details.groupId.filter((id) => !exstingId[0].array.includes(id))
								: [];

						// console.log('---------addedIds-----------', addedIds);
						let removedIds =
							exstingId && exstingId.length > 0
								? exstingId[0].array.filter((id) => !user_details.groupId.includes(id))
								: [];

						// console.log('---------removedIds-----------', removedIds);

						//addNew Learner To Learner Group
						if (addedIds && addedIds.length > 0) {
							for (let groupId of addedIds) {
								let payload = {
									UserId: learnerId,
									UserGroupId: groupId,
								};

								[err, addLearnerIntoGroup] = await to(User_group_mapping.create(payload));
								if (err) return ResponseError(res, err, 500, true);

								if (addLearnerIntoGroup) {
									if (type == 'drip') {
										learnerAddedIntoGroupCampaignStartRule(addLearnerIntoGroup.UserGroupId, [learnerId]);
									}
								}
							}

							//For Update Count
							[err, learnerGroup_] = await to(
								User_group.findAll({
									where: {
										id: addedIds,
									},
									attributes: ['id', 'userCount'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (learnerGroup_ && learnerGroup_.length > 0) {
								for (let group of learnerGroup_) {
									let group_ = group.convertToJSON();

									let userCountPayload = {
										userCount: group_.userCount + 1,
									};

									[err, updateUserGroup] = await to(
										User_group.update(userCountPayload, {
											where: {
												id: group_.id,
											},
										})
									);
									if (err) return ResponseError(res, err, 500, true);
								}
							}
						}

						//destroy learner from LearnerGroup
						if (removedIds && removedIds.length > 0) {
							[err, destroyOldLearnerGroupMapping] = await to(
								User_group_mapping.destroy({
									where: {
										UserId: learnerId,
										UserGroupId: removedIds,
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							//For Update Count
							[err, learnerGroup_] = await to(
								User_group.findAll({
									where: {
										id: removedIds,
									},
									attributes: ['id', 'userCount'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (learnerGroup_ && learnerGroup_.length > 0) {
								for (let group of learnerGroup_) {
									let group_ = group.convertToJSON();

									let userCountPayload = {
										userCount: group_.userCount - 1,
									};

									[err, updateUserGroup] = await to(
										User_group.update(userCountPayload, {
											where: {
												id: group_.id,
											},
										})
									);
									if (err) return ResponseError(res, err, 500, true);
								}
							}
						}
					}
				}

				[err, getUser] = await to(
					User.findOne({
						where: {
							id: req.user.id,
						},
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
				[err, localUserData] = await to(
					dbInstance[getUser.Market.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, clientData] = await to(
					Client.findOne({
						where: {
							id: user_details.clientId,
						},
						attributes: ['name'],
					})
				);

				const userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
					localUserData && localUserData.last ? localUserData.last : ''
				}`;
				let userIds = [];
				let notifcationMessage = MESSAGE.LEARNER_EDITED;
				notifcationMessage = notifcationMessage.replace('{{count}}', 1);
				notifcationMessage = notifcationMessage.replace('{{branch_name}}', clientData.name);
				notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
				notifcationMessage = notifcationMessage.replace('{{Tag_Learner_Updated}}', '');
				if (type == 'drip') {
					notifcationMessage = notifcationMessage.replace('{{type}}', 'contact');
					userIds = await getAllUserIdsForNotification(clientId);
					const index = userIds.indexOf(req.user.id);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotification(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.LEARNER_EDITED;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', 1);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{type}}', 'contact');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{Tag_Learner_Updated}}', '');
					await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
				} else if (type == 'diwo') {
					notifcationMessage = notifcationMessage.replace('{{type}}', 'learner');
					userIds = await getAllDiwoUserIdsForNotification(clientId);
					const index = userIds.indexOf(req.user.id);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.LEARNER_EDITED;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', 1);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{type}}', 'learner');
					notifcationMessageForUser = notifcationMessageForUser.replace('{{Tag_Learner_Updated}}', '');
					await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
				}

				[err, newLog] = await to(
					createlog(
						req.user.id,
						req.user.ClientId,
						req.user.RoleId,
						`Update Learner`,
						req.ip,
						req.useragent,
						req.user.type,
						{
							UserId: learnerId,
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				return ResponseSuccess(res, {
					data: userDetail,
					validlicenseForUnification: validlicenseForUnification,
				});
			}
			// else {
			// 	let mesg;
			// 	if (
			// 		localUserEmailExits &&
			// 		localUserEmailExits.id != user.local_user_id &&
			// 		localUserPhoneExits &&
			// 		localUserPhoneExits.id != user.local_user_id
			// 	) {
			// 		mesg = MESSAGE.EMAIL_AND_PHONE_EXITS;
			// 	} else if (localUserPhoneExits && localUserPhoneExits.id != user.local_user_id) {
			// 		mesg = MESSAGE.PHONE_EXITS;
			// 	} else if (localUserEmailExits && localUserEmailExits.id != user.local_user_id) {
			// 		mesg = MESSAGE.EMAIL_EXITS;
			// 	}

			// 	let payload = {
			// 		email: user_details.email ? user_details.email : null,
			// 		phone: user_details.phone ? user_details.phone.toString() : null,
			// 	};
			// 	let checkLearnerCanCreateOrNot = await checkDuplicateLearnerDetails(user_details.clientId, payload, type);
			// 	if(checkLearnerCanCreateOrNot == false){
			// 		return ResponseError(
			// 			res,
			// 			{
			// 				message: mesg,
			// 			},
			// 			500
			// 		);
			// 	}
			// }
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
module.exports.updateLearner = updateLearner;

const deleteLearner = async function (req, res) {
	try {
		const schema = Joi.array().items(
			Joi.object({
				UserId: Joi.number().integer().positive().required(),
				RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
				ClientId: Joi.number().integer().positive().required(),
				Status: Joi.string().required(),
				forDrip: Joi.boolean().required(),
				forDiwo: Joi.boolean().required(),
			})
		);

		const { error, value } = schema.validate(req.body);

		if (error) {
			return res.status(400).json({ error: error.details.map((err) => err.message) });
		}

		const clientId_schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error: clientId_error, value: clientId_value } = clientId_schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (clientId_error) {
			res.status(400).json({ error: clientId_error.details[0].message });
		}

		const { clientId } = clientId_value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let UserId = [];
		let RoleId = [];
		let ClientId = [];
		// let clientId = parseInt(req.params.clientId);

		let type = req.user.type;

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		for (let item of value) {
			UserId.push(item.UserId);
			RoleId.push(item.RoleId);
			ClientId.push(item.ClientId);

			[err, User_Details] = await to(
				User_role_client_mapping.destroy({
					where: {
						UserId: item.UserId,
						RoleId: item.RoleId,
						ClientId: item.ClientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//consume license drip diwo
			if (type == 'drip' || (type == 'diwo' && item.forDrip == true)) {
				await getRemoveOneLearnerCount(item.ClientId);
			}

			if (type == 'diwo' || (type == 'drip' && item.forDiwo == true)) {
				await getRemoveOneLearnerCountForDiwo(item.ClientId);
			}

			//For Update Count
			[err, userGroupDetails] = await to(
				User_group_mapping.findAll({
					where: {
						UserId: item.UserId,
					},
					include: [{ model: User_group, attributes: ['id', 'userCount'] }],
					attributes: ['UserGroupId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (userGroupDetails && userGroupDetails.length > 0) {
				for (let groupdetails of userGroupDetails) {
					let groupdetails_ = groupdetails.convertToJSON();
					//For Update Count
					// [err, learnerGroup_] = await to(
					// 	User_group.findOne({
					// 		where: {
					// 			id: learnerIds.UserGroupId,
					// 		},
					// 		attributes: ['id', 'userCount'],
					// 	})
					// );
					// if (err) return ResponseError(res, err, 500, true);

					let userCountPayload = {
						userCount: groupdetails_.User_group.userCount - 1,
					};

					[err, updateUserGroup] = await to(
						User_group.update(userCountPayload, {
							where: {
								id: groupdetails_.UserGroupId,
							},
						})
					);
				}
			}

			if (err) return ResponseError(res, err, 500, true);

			[err, Deleted_AdminUser] = await to(
				User.update(
					{
						is_deleted: true,
						status: false,
						cStatus: 'Deleted',
					},
					{
						where: {
							id: item.UserId,
						},
					}
				)
			);
		}

		// [err, User_group_Details] = await to(
		// 	User_group_mapping.destroy({
		// 		where: {
		// 			UserId: UserId,
		// 		},
		// 	})
		// );

		//Set Delete Flag into Local Database
		[err, getLearners] = await to(
			User.findAll({
				where: {
					id: UserId,
				},
				include: [{ model: Market, attributes: ['id', 'db_name'] }],
				attributes: ['id', 'local_user_id', 'MarketId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getLearners && getLearners.length > 0) {
			for (let user of getLearners) {
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

		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
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

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, clientData] = await to(
			Client.findAll({
				where: {
					id: ClientId,
				},
				attributes: ['name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let branchName = '';
		for (let data of clientData) {
			if (branchName.length === 0) {
				branchName = data.name;
			} else {
				branchName = branchName + ', ' + data.name;
			}
		}

		const userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let userIds = [];
		let notifcationMessage = MESSAGE.Learner_Deleted;
		notifcationMessage = notifcationMessage.replace('{{count}}', UserId.length);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{branch_name}}', branchName);
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', UserId.length === 1 ? 'contact' : 'contacts');
			userIds = await getAllUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotification(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Deleted;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', UserId.length);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				UserId.length === 1 ? 'contact' : 'contacts'
			);
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', UserId.length === 1 ? 'learner' : 'learners');
			userIds = await getAllDiwoUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Deleted;
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{count}}',
				UserId.length === 1 ? 'contact' : 'contacts'
			);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				UserId.length === 1 ? 'learner' : 'learners'
			);
			await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Learner`,
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
			message: type === 'drip' ? MESSAGE.CONTACT_DELETED : MESSAGE.LEARNER_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteLearner = deleteLearner;

const createdripdiwouser = async function (req, res) {
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

		const clientId_schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { clientId_error, clientId_value } = clientId_schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (clientId_error) {
			res.status(400).json({ error: clientId_error.details[0].message });
		}

		const { clientId } = clientId_value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let UserId = [];
		let RoleId = [];
		let ClientId = [];
		let checkCount;
		let validlicenseForUnification = true;

		for (let item of value) {
			UserId.push(item.UserId);
			RoleId.push(item.RoleId);
			ClientId.push(item.ClientId);

			[err, ClientsDetail] = await to(
				Client.findOne({
					where: {
						is_deleted: false,
						id: item.ClientId,
						DiwoAccess: true,
						DripAccess: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (Client && Client !== null) {
				let payload = {
					cStatus: '',
					forDrip: true,
					forDiwo: true,
					cStatus: 'Active',
				};

				[err, updateUser] = await to(
					User.update(payload, {
						where: {
							id: item.UserId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//consume learner count for unification
				if (type == 'drip') {
					checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(item.ClientId);
					if (checkCount) {
						await getAddOneLearnerCountForDiwo(item.ClientId);
					} else {
						validlicenseForUnification = false;
					}
				} else if (type == 'diwo') {
					checkCount = await getLearnerValidaionOnCreateLearner(item.ClientId);
					if (checkCount) {
						await getAddOneLearnerCount(item.ClientId);
					} else {
						validlicenseForUnification = false;
					}
				}

				if (checkCount) {
					let payload2 = {
						forDrip: true,
						forDiwo: true,
					};

					[err, User_Details] = await to(
						User_role_client_mapping.update(payload2, {
							where: {
								UserId: item.UserId,
								RoleId: item.RoleId,
								ClientId: item.ClientId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (checkCount) {
			//Set Flag into Local Database
			[err, getLearners] = await to(
				User.findAll({
					where: {
						id: UserId,
					},
					include: [{ model: Market, attributes: ['id', 'db_name'] }],
					attributes: ['id', 'local_user_id', 'MarketId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, getUser] = await to(
				User.findOne({
					where: {
						id: req.user.id,
					},
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

			[err, localUser] = await to(
				dbInstance[getUser.Market.db_name].User_master.findOne({
					where: {
						id: getUser.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, clientData] = await to(
				Client.findAll({
					where: {
						id: ClientId,
					},
					attributes: ['name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			let branchName = '';
			for (let data of clientData) {
				if (branchName.length === 0) {
					branchName = data.name;
				} else {
					branchName = branchName + ', ' + data.name;
				}
			}

			const userName = `${localUser && localUser.first ? localUser.first : ''} ${
				localUser && localUser.last ? localUser.last : ''
			}`;
			let userIds = [];
			let notifcationMessage = MESSAGE.Add_Drip_Diwo_Learner;
			notifcationMessage = notifcationMessage.replace('{{count}}', UserId.length);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			notifcationMessage = notifcationMessage.replace('{{branch_name}}', branchName);
			if (type == 'drip') {
				notifcationMessage = notifcationMessage.replace('{{type}}', UserId.length === 1 ? 'contact' : 'contacts');
				userIds = await getAllUserIdsForNotification(clientId);
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotification(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.Add_Drip_Diwo_Learner;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', UserId.length);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
				notifcationMessageForUser = notifcationMessageForUser.replace(
					'{{type}}',
					UserId.length === 1 ? 'contact' : 'contacts'
				);
				await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
			} else if (type == 'diwo') {
				notifcationMessage = notifcationMessage.replace('{{type}}', UserId.length === 1 ? 'learner' : 'learners');
				userIds = await getAllDiwoUserIdsForNotification(clientId);
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.Add_Drip_Diwo_Learner;
				notifcationMessageForUser = notifcationMessageForUser.replace(
					'{{count}}',
					UserId.length === 1 ? 'contact' : 'contacts'
				);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
				notifcationMessageForUser = notifcationMessageForUser.replace(
					'{{type}}',
					UserId.length === 1 ? 'learner' : 'learners'
				);
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}

			if (err) return ResponseError(res, err, 500, true);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Added Drip_Diwo Learner`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						UserId: UserId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: type === 'drip' ? MESSAGE.CONTACT_ADDED : MESSAGE.LEARNER_ADDED,
			validlicenseForUnification: validlicenseForUnification,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createdripdiwouser = createdripdiwouser;

const archiveLearner = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			status: Joi.string().valid('active', 'unlicensed').required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			status: req.params.archivestatus,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientId, status } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let status = req.params.archivestatus;
		// let clientId = parseInt(req.params.clientId);
		let message;
		// let type = req.params.type;

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let clientIds = [];
		let userId = [];
		for (let user of req.body) {
			if (status == 'unlicensed') {
				[err, user_Learnerdetails] = await to(
					User_role_client_mapping.findAll({
						where: {
							UserId: user.UserId,
							ClientId: clientId,
						},
					})
				);

				if (err) return ResponseError(res, err, 500, true);

				if (user_Learnerdetails && user_Learnerdetails.length > 1) {
					[err, deleteUserAsLearner] = await to(
						User_role_client_mapping.destroy({
							where: {
								UserId: user.UserId,
								RoleId: 1,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else {
					[err, updateArchiveLearnerUser] = await to(
						User.update(
							{
								is_archive: true,
								cStatus: 'Unlicensed',
							},
							{
								where: {
									id: user.UserId,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				// if (type == 'drip') {
				// 	await getRemoveOneLearnerCount(user.ClientId);
				// } else if (type == 'diwo') {
				// 	await getRemoveOneLearnerCountForDiwo(user.ClientId);
				// }

				//consume license
				if (type == 'drip' || (type == 'diwo' && user.forDrip == true)) {
					await getRemoveOneLearnerCount(user.ClientId);
				}

				if (type == 'diwo' || (type == 'drip' && user.forDiwo == true)) {
					await getRemoveOneLearnerCountForDiwo(user.ClientId);
				}

				if (!clientIds.includes(user.ClientId)) clientIds.push(user.ClientId);

				//For Update Count
				[err, userGroupDetails] = await to(
					User_group_mapping.findAll({
						where: {
							UserId: user.UserId,
						},
						include: [{ model: User_group, attributes: ['id', 'userCount'] }],
						attributes: ['UserGroupId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (userGroupDetails && userGroupDetails.length > 0) {
					for (let groupdetails of userGroupDetails) {
						let groupdetails_ = groupdetails.convertToJSON();
						//For Update Count
						// [err, learnerGroup_] = await to(
						// 	User_group.findOne({
						// 		where: {
						// 			id: learnerIds.UserGroupId,
						// 		},
						// 		attributes: ['id', 'userCount'],
						// 	})
						// );
						// if (err) return ResponseError(res, err, 500, true);

						let userCountPayload = {
							userCount: groupdetails_.User_group.userCount - 1,
						};

						[err, updateUserGroup] = await to(
							User_group.update(userCountPayload, {
								where: {
									id: groupdetails_.UserGroupId,
								},
							})
						);
					}
				}

				//delete From Learner Group
				[err, deleteFromGroup] = await to(
					User_group_mapping.destroy({
						where: {
							UserId: user.UserId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				message = 'Learner Successfully Unlicensed!';
				if (err) return ResponseError(res, err, 500, true);
			} else {
				let checkCountStatus;
				if (type == 'drip' && !user.forDiwo) {
					checkCountStatus = await getLearnerValidaionOnCreateLearner(user.ClientId);
				} else if (type == 'diwo' && !user.forDrip) {
					checkCountStatus = await getLearnerValidaionOnCreateLearnerForDiwo(user.ClientId);
				}

				let checkCountForDrip;
				let checkCountForDiwo;
				if (type == 'drip' && user.forDiwo) {
					checkCountForDiwo = await getLearnerValidaionOnCreateLearnerForDiwo(user.ClientId);
					checkCountForDrip = await getLearnerValidaionOnCreateLearner(user.ClientId);
				} else if (type == 'diwo' && user.forDrip) {
					checkCountForDiwo = await getLearnerValidaionOnCreateLearnerForDiwo(user.ClientId);
					checkCountForDrip = await getLearnerValidaionOnCreateLearner(user.ClientId);
				}

				if (checkCountStatus == true || (checkCountForDrip && checkCountForDiwo)) {
					[err, updateArchiveLearnerUser] = await to(
						User.update(
							{
								is_archive: false,
								cStatus: 'Active',
							},
							{
								where: {
									id: user.UserId,
								},
							}
						)
					);
					userId.push(user.UserId);
					if (err) return ResponseError(res, err, 500, true);
					if (type == 'drip' || (type == 'diwo' && checkCountForDrip)) {
						await getAddOneLearnerCount(user.ClientId);
					}

					if (type == 'diwo' || (type == 'drip' && checkCountForDiwo)) {
						await getAddOneLearnerCountForDiwo(user.ClientId);
					}

					message = 'Learner Successfully Activated!';
				} else {
					[err, updateArchiveLearnerUser] = await to(
						User.update(
							{
								is_archive: false,
								cStatus: 'Unlicensed',
							},
							{
								where: {
									id: user.UserId,
								},
							}
						)
					);
					message = 'You do not have valid license!';
					if (err) return ResponseError(res, err, 500, true);
				}
			}
			userId.push(user.UserId);
		}

		//For Notifcation
		if (status == 'unlicensed') {
			// let notifcationMessage = `${req.body.length} Unlicensed Learner. `;
			// if (type == 'drip') {
			// 	await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
			// } else if (type == 'diwo') {
			// 	await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
			// }
			[err, getUser] = await to(
				User.findOne({
					where: {
						id: req.user.id,
					},
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

			[err, localUser] = await to(
				dbInstance[getUser.Market.db_name].User_master.findOne({
					where: {
						id: getUser.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			const userName = `${localUser && localUser.first ? localUser.first : ''} ${
				localUser && localUser.last ? localUser.last : ''
			}`;

			[err, clientData] = await to(
				Client.findAll({
					where: {
						id: clientIds,
					},
					attributes: ['name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			let branchName = '';
			for (let data of clientData) {
				if (branchName.length === 0) {
					branchName = data.name;
				} else {
					branchName = branchName + ', ' + data.name;
				}
			}

			let userIds = [];
			let notifcationMessage = MESSAGE.Unlicensed_Learner;
			notifcationMessage = notifcationMessage.replace('{{count}}', req.body.length);
			//notifcationMessage = notifcationMessage.replace('{{count}}', 1);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			notifcationMessage = notifcationMessage.replace('{{branch_name}}', branchName);
			if (type == 'drip') {
				notifcationMessage = notifcationMessage.replace('{{type}}', req.body.length === 1 ? 'contact' : 'contacs');
				userIds = await getAllUserIdsForNotification(clientId);
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotification(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.Unlicensed_Learner;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', req.body.length);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
				notifcationMessageForUser = notifcationMessageForUser.replace(
					'{{type}}',
					req.body.length === 1 ? 'contact' : 'contacs'
				);
				await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
			} else if (type == 'diwo') {
				notifcationMessage = notifcationMessage.replace('{{type}}', req.body.length === 1 ? 'learner' : 'learners');
				userIds = await getAllDiwoUserIdsForNotification(clientId);
				const index = userIds.indexOf(req.user.id);
				if (index !== -1) {
					userIds.splice(index, 1);
				}
				await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
				let notifcationMessageForUser = MESSAGE.Unlicensed_Learner;
				notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', req.body.length);
				notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
				notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', branchName);
				notifcationMessageForUser = notifcationMessageForUser.replace(
					'{{type}}',
					req.body.length === 1 ? 'learner' : 'learners'
				);
				await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
			}
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Unlicense Learner`,
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
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Active Learner`,
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

		return ResponseSuccess(res, {
			data: message,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.archiveLearner = archiveLearner;

const moveLearner = async function (req, res) {
	try {
		const schema = Joi.object({
			branchAccountId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			branchAccountId: parseInt(req.params.branchAccountId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { branchAccountId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let branchAccountId = parseInt(req.params.branchAccountId);
		// let clientId = req.params.clientId;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		///////////////////////////////////////////////////////////////

		const User_schema = Joi.array().items(
			Joi.object({
				UserId: Joi.number().integer().positive().required(),
				RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
				ClientId: Joi.number().integer().positive().required(),
				Status: Joi.string().required(),
				forDrip: Joi.boolean().required(),
				forDiwo: Joi.boolean().required(),
			})
		);

		const { error: User_error, value: User_value } = User_schema.validate(req.body);

		if (User_error) {
			return res.status(400).json({ error: User_error.details.map((err) => err.message) });
		}

		let tempList = [];
		let learnerId = [];

		// for (let item of req.body) {
		// 	tempList.push(item.UserId);
		// }

		for (let item of User_value) {
			tempList.push(item.UserId);
		}

		let whereCondtion = {
			id: tempList,
		};

		if (type == 'drip') {
			whereCondtion.forDrip = true;
		} else if (type == 'diwo') {
			whereCondtion.forDiwo = true;
		}

		[err, allUsers] = await to(
			User.findAll({
				where: whereCondtion,
				include: [{ model: Market, attributes: ['db_name'] }],
				attributes: ['id', 'MarketId', 'local_user_id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let user of allUsers) {
			[err, getLocalData] = await to(
				dbInstance[user.Market.db_name].User_master.findOne({
					where: { id: user.local_user_id },
					attributes: ['id', 'email', 'phone'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// if (getLocalData && (await checkDuplicateLearnerDetails(branchAccountId, getLocalData, type))) {
			// 	learnerId.push(user.id);
			// }

			if (getLocalData) {
				learnerId.push(user.id);
			}
		}

		[err, updateBranchLearnerUser] = await to(
			User_role_client_mapping.update(
				{
					ClientId: branchAccountId,
				},
				{
					where: {
						RoleId: 1,
						UserId: learnerId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Notification

		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
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

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		const userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let userIds = [];
		let notifcationMessage = MESSAGE.Learner_Move;
		notifcationMessage = notifcationMessage.replace('{{count}}', learnerId.length);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', learnerId.length === 1 ? 'contact' : 'contacts');
			userIds = await getAllUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotification(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Move;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', learnerId.length);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				learnerId.length === 1 ? 'contact' : 'contacs'
			);
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', learnerId.length === 1 ? 'learner' : 'learners');
			userIds = await getAllDiwoUserIdsForNotification(clientId);
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Move;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', learnerId.length);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				learnerId.length === 1 ? 'learner' : 'learners'
			);
			await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		if (learnerId.length > 0) {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Move Learner`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						UserId: learnerId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: MESSAGE.MOVE_LEARNER,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.moveLearner = moveLearner;

// const getClientAllLearnerUser = async function (req, res) {
// 	try {
// 		// let type = req.params.type;
// 		let type = req.user.type;
// 		//Check Project Type
// 		if (!checkProjectNameByType(type)) {
// 			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
// 		}

// 		let allUserData, err;
// 		let allData = [];
// 		let parentClientId = req.params.clientId;
// 		let flag = true;
// 		let finalArrayOfClientsId = [];
// 		let childClientId = [];
// 		childClientId.push(parentClientId);
// 		let offset = 0;
// 		let response;
// 		let limit = parseInt(req.query.limit);
// 		let page = parseInt(req.query.page);
// 		// Add Validation limit and page
// 		if (limit == 'all') {
// 			offset = undefined;
// 			limit = undefined;
// 		} else {
// 			if (page != NaN && page >= 1) {
// 				offset = (page - 1) * limit;
// 			}
// 		}

// 		[err, ClientsDetail] = await to(
// 			Client.findOne({
// 				where: {
// 					is_deleted: false,
// 					id: childClientId,
// 				},
// 			})
// 		);
// 		if (err) return ResponseError(res, err, 500, true);
// 		// Main Parent Client Id;
// 		if (type == 'drip' && ClientsDetail.DripAccess) {
// 			finalArrayOfClientsId.push(ClientsDetail.id);
// 		} else if (type == 'diwo' && ClientsDetail.DiwoAccess) {
// 			finalArrayOfClientsId.push(ClientsDetail.id);
// 		}

// 		let totalClientCount;
// 		let count = 0;

// 		[err, totalClientCount] = await to(Client.count());

// 		while (flag) {
// 			count++;
// 			if (count > totalClientCount) {
// 				flag = false;
// 				break;
// 			}
// 			[err, ClientsDetail] = await to(
// 				Client.findAll({
// 					where: {
// 						is_deleted: false,
// 						Associate_client_id: childClientId,
// 					},
// 				})
// 			);
// 			if (err) return ResponseError(res, err, 500, true);

// 			childClientId = [];

// 			if (ClientsDetail && ClientsDetail.length <= 0) {
// 				flag = false;
// 			}

// 			for (let i in ClientsDetail) {
// 				childClientId.push(ClientsDetail[i].id);
// 				let client = ClientsDetail[i];
// 				let client_ = client.convertToJSON();
// 				[err, parentClientsDetail] = await to(
// 					Client.findOne({
// 						where: {
// 							is_deleted: false,
// 							id: client_.Associate_client_id,
// 						},
// 					})
// 				);
// 				if (err) return ResponseError(res, err, 500, true);
// 				if (parentClientsDetail) {
// 					client_.Parent_client = parentClientsDetail.convertToJSON();
// 					if (type == 'drip' && client_.DripAccess) {
// 						finalArrayOfClientsId.push(client_.id);
// 					} else if (type == 'diwo' && client_.DiwoAccess) {
// 						finalArrayOfClientsId.push(client_.id);
// 					}
// 				}
// 			}

// 			if (childClientId.length <= 0) {
// 				flag = false;
// 			}
// 		}
// 		if (type == 'drip') {
// 			[err, allUserData] = await to(
// 				User_role_client_mapping.findAndCountAll({
// 					where: {
// 						ClientId: finalArrayOfClientsId,
// 						RoleId: 1,
// 						forDrip: true,
// 					},
// 					include: [
// 						{
// 							model: User,
// 							where: {
// 								status: true,
// 								is_deleted: false,
// 								forDrip: true,
// 							},
// 							include: [
// 								{
// 									model: Market,
// 									attributes: ['db_name'],
// 								},
// 								{
// 									model: Client_job_role,
// 									where: {
// 										forDrip: true,
// 									},
// 									required: false,
// 								},
// 							],
// 						},
// 						{
// 							model: Role,
// 							where: {
// 								dripRole: true,
// 							},
// 						},
// 						{
// 							model: Client,
// 							where: {
// 								DripAccess: true,
// 							},
// 						},
// 					],

// 					order: [
// 						[
// 							{
// 								model: User,
// 							},
// 							'createdAt',
// 							'DESC',
// 						],
// 					],
// 					offset: offset,
// 					limit: limit,
// 					subQuery: false,
// 				})
// 			);
// 			if (err) return ResponseError(res, err, 500, true);
// 		} else if (type == 'diwo') {
// 			[err, allUserData] = await to(
// 				User_role_client_mapping.findAndCountAll({
// 					where: {
// 						ClientId: finalArrayOfClientsId,
// 						RoleId: 1,
// 						forDiwo: true,
// 					},
// 					include: [
// 						{
// 							model: User,
// 							where: {
// 								status: true,
// 								is_deleted: false,
// 								forDiwo: true,
// 							},
// 							include: [
// 								{
// 									model: Market,
// 									attributes: ['db_name'],
// 								},
// 								{
// 									model: Client_job_role,
// 									where: {
// 										forDiwo: true,
// 									},
// 									required: false,
// 								},
// 							],
// 						},
// 						{
// 							model: Role,
// 							where: {
// 								diwoRole: true,
// 							},
// 						},
// 						{
// 							model: Client,
// 							where: {
// 								DiwoAccess: true,
// 							},
// 						},
// 					],
// 					order: [
// 						[
// 							{
// 								model: User,
// 							},
// 							'createdAt',
// 							'DESC',
// 						],
// 					],
// 					offset: offset,
// 					limit: limit,
// 					subQuery: false,
// 				})
// 			);
// 			if (err) return ResponseError(res, err, 500, true);
// 		}

// 		if (allUserData && allUserData.rows.length > 0) {
// 			for (let allUser of allUserData.rows) {
// 				let userDetail = allUser.convertToJSON();
// 				[err, localUser] = await to(
// 					dbInstance[allUser.User.Market.db_name].User_master.findOne({
// 						where: {
// 							id: allUser.User.local_user_id,
// 						},
// 						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
// 					})
// 				);
// 				if (err) return ResponseError(res, err, 500, true);

// 				if (localUser) {
// 					userDetail.User.first = localUser.first;
// 					userDetail.User.last = localUser.last;
// 					userDetail.User.email = localUser.email;
// 					userDetail.User.phone = localUser.phone;
// 					userDetail.User.imagePath = localUser.imagePath;
// 					userDetail.User.city = localUser.city;
// 					userDetail.User.state = localUser.state;
// 					userDetail.User.zipCode = localUser.zipCode;
// 				}

// 				allData.push(userDetail);
// 			}
// 		}

// 		//Check Client Have Team Setup Or Not
// 		[err, checkTeamSetup] = await to(
// 			ClientTeamSetup.findOne({
// 				where: {
// 					ClientId: req.user.ClientId,
// 				},
// 				attributes: ['id'],
// 			})
// 		);
// 		if (err) return ResponseError(res, err, 500, true);

// 		return ResponseSuccess(res, {
// 			data: allData,
// 			count: allUserData.count,
// 			haveTeamSetup: checkTeamSetup ? true : false,
// 		});
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.getClientAllLearnerUser = getClientAllLearnerUser;

//Read Update Learner List Excel Sheet

const getClientAllLearnerUser = async (req, res) => {
	try {
		// Validate request parameters
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
			return ResponseError(res, { message: 'Invalid project type parameter.' }, 400);
		}

		//Check Client Access
		if (!(await checkClientIdAccess(clientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// Pagination logic
		const offset = (page - 1) * limit;
		const parsedLimit = parseInt(limit);

		// Fetch Parent Client Details
		const [err, clientDetail] = await to(
			Client.findOne({
				where: { id: clientId, is_deleted: false },
			})
		);
		if (err) return ResponseError(res, err, 500);
		if (!clientDetail) return ResponseError(res, { message: 'Client not found.' }, 404);

		// Check access based on type
		const finalArrayOfClientsId = [];
		if ((type === 'drip' && clientDetail.DripAccess) || (type === 'diwo' && clientDetail.DiwoAccess)) {
			finalArrayOfClientsId.push(clientDetail.id);
		}

		// Recursive function to fetch child clients
		const getChildClients = async (clientIds) => {
			let resultIds = [];
			let [err, childClients] = await to(
				Client.findAll({
					where: { is_deleted: false, Associate_client_id: { [Op.in]: clientIds } },
					attributes: ['id', 'Associate_client_id', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) return [];

			for (const client of childClients) {
				if ((type === 'drip' && client.DripAccess) || (type === 'diwo' && client.DiwoAccess)) {
					resultIds.push(client.id);
				}
			}
			if (childClients.length > 0) {
				const moreChildIds = await getChildClients(resultIds);
				resultIds = [...resultIds, ...moreChildIds];
			}
			return resultIds;
		};

		const childClientIds = await getChildClients([clientId]);
		finalArrayOfClientsId.push(...childClientIds);

		// Query user mappings based on project type
		const whereConditions = {
			ClientId: finalArrayOfClientsId,
			RoleId: 1,
			...(type === 'drip' ? { forDrip: true } : { forDiwo: true }),
		};

		const [errUser, allUserData] = await to(
			User_role_client_mapping.findAndCountAll({
				where: whereConditions,
				include: [
					{
						model: User,
						where: { status: true, is_deleted: false, ...(type === 'drip' ? { forDrip: true } : { forDiwo: true }) },
						include: [
							{ model: Market, attributes: ['db_name'] },
							{
								model: Client_job_role,
								where: type === 'drip' ? { forDrip: true } : { forDiwo: true },
								required: false,
							},
						],
					},
					{ model: Role, where: type === 'drip' ? { dripRole: true } : { diwoRole: true } },
					{ model: Client, where: type === 'drip' ? { DripAccess: true } : { DiwoAccess: true } },
				],
				order: [[User, 'createdAt', 'DESC']],
				offset,
				limit: parsedLimit,
				subQuery: false,
			})
		);
		if (errUser) return ResponseError(res, errUser, 500);

		// Process user details
		const allData = [];
		for (let allUser of allUserData.rows) {
			let userDetail = allUser.toJSON();

			// Fetch additional user details from the respective market database
			const marketDb = dbInstance[allUser.User.Market.db_name];
			if (marketDb) {
				const [errLocalUser, localUser] = await to(
					marketDb.User_master.findOne({
						where: { id: allUser.User.local_user_id },
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode', 'username'],
					})
				);
				if (errLocalUser) return ResponseError(res, errLocalUser, 500);

				if (localUser) {
					Object.assign(userDetail.User, localUser.toJSON());
				}
			}

			allData.push(userDetail);
		}

		// Check if the client has team setup
		const [errTeamSetup, checkTeamSetup] = await to(
			ClientTeamSetup.findOne({
				where: { ClientId: req.user.ClientId },
				attributes: ['id'],
			})
		);
		if (errTeamSetup) return ResponseError(res, errTeamSetup, 500);

		// Send response
		return ResponseSuccess(res, {
			data: allData,
			count: allUserData.count,
			haveTeamSetup: !!checkTeamSetup,
		});
	} catch (error) {
		return ResponseError(res, error, 500);
	}
};

module.exports.getClientAllLearnerUser = getClientAllLearnerUser;

const checkAndTriggeredWelcomeEmail = async function (userEmail, clientId) {
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
						model: System_branding,
						attributes: ['id', 'welcomeEmail', 'welcomeSubject', 'welcomeBody', 'welcomeButton'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.SystemBrandingId) {
			appBranding = client.System_branding.convertToJSON();
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
								model: System_branding,
								attributes: ['id', 'welcomeEmail', 'welcomeSubject', 'welcomeBody', 'welcomeButton'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClient && parentClient.SystemBrandingId) {
					appBranding = parentClient.System_branding.convertToJSON();
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
			let emailDetails = await getClientEmailConfigrationDetails(clientId);
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
			sendDripEmail(emailData, emailDetails);
			//isTriggered = true;
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Welcome Email--', error);
		return;
	}
};
module.exports.checkAndTriggeredWelcomeEmail = checkAndTriggeredWelcomeEmail;

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
				if (parentClient && parentClient.DiwoSystemBrandingId) {
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
			//isTriggered = true;
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Welcome Email--', error);
		return;
	}
};
module.exports.checkAndTriggeredWelcomeEmailForDiwo = checkAndTriggeredWelcomeEmailForDiwo;

const getClientEmailConfigrationDetails = async function (clientId) {
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
						model: System_branding,
						attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.SystemBrandingId) {
			appBranding = client.System_branding.convertToJSON();
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
								model: System_branding,
								attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClient && parentClient.SystemBrandingId) {
					appBranding = parentClient.System_branding.convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}

		return appBranding;
	} catch (error) {
		console.log('---Error When Get Client Email Configration details--', error);
	}
};
module.exports.getClientEmailConfigrationDetails = getClientEmailConfigrationDetails;

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

const getAllContentFileNameForUpdateLearner = async function (req, res) {
	const filename = CONFIG.imagePath + '/uploads/excel/' + req.file.filename;
	exceltojson = xlsxtojson;
	try {
		const roleId = req.user.RoleId;
		const userId = req.user.id;
		const clientId = req.user.ClientId;

		const type = req.user.type;
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		exceltojson(
			{
				input: filename,
				output: null,
				lowerCaseHeaders: true,
			},
			async function (err, rows) {
				if (err) return;

				bulkUpdateLearners(rows, parseInt(roleId), parseInt(userId), parseInt(clientId), type, req, res);

				fs.unlink(filename, (err) => {
					if (err) {
						console.log('Error', err);
					}
				});

				return ResponseSuccess(res, {
					message: MESSAGE.REQUEST_IS_IN_PROGRESS,
				});
			}
		);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllContentFileNameForUpdateLearner = getAllContentFileNameForUpdateLearner;

const bulkUpdateLearners = async function (rows, roleId, userId, clientId, type, req, res) {
	try {
		const forbiddenWords = [
			// 'select',
			// 'insert',
			// 'update',
			// 'delete',
			// 'drop',
			// 'alter',
			// 'exec',
			// 'union',
			'utl_inaddr',
			'get_host_name',
			'randomblob',
			'xp_cmdshell',
			'execute',
			'document.cookie',
			'onerror=',
			'onclick=',
			'<script>',
			'<iframe>',
			'<img src=x onerror=alert(1)>',
		];

		const forbiddenSymbols = [
			'--',
			'/*',
			'*/',
			';',
			'|',
			'<',
			'>',
			// '/',
			'&',
			// '(',
			// ')',
			// '{',
			// '}',
			// '[',
			// ']',
			'$',
			'--',
			';',
			'\\',
			// '_',
		];

		if (!rows || rows.length === 0) return;
		let customFields = await getAccountCustomField(clientId, type);

		//Need to Get all Reserved tag list
		let reservedTags = await getReservedTags(clientId);
		// Check All Valid Header with rows
		let finalData = [];
		let updateLearners = [];
		let invalidHeader = false;
		let hearderList = [
			'sr. no',
			'first name',
			'last name',
			'email',
			'mobile',
			'country',
			'state',
			'city',
			'zip code',
			'tags',
			'parent id',
			'parent account',
			'job role',
			// 'whatapp opt in',
			// 'whatsapp permission',
			// 'email permission',
			'added date',
			'first login',
			'last login',
			'status(licensed/unlicensed)',
			'action(edit/delete/unchange)',
		];

		if (type == 'drip') {
			hearderList.push('contact id');
			hearderList.push('contact group id');
			hearderList.push('whatapp opt in');
			hearderList.push('whatsapp permission');
			hearderList.push('email permission');
		} else {
			hearderList.push('learner id');
			hearderList.push('learner group id');
		}
		for (let key of hearderList) {
			if (rows[0][key] == undefined) {
				invalidHeader = true;
			}
		}

		for (let key of customFields) {
			if (!key.isHide && rows[0][key.label.toLowerCase()] == undefined) {
				invalidHeader = true;
			}
		}
		//Add Check Header Invalid
		if (!invalidHeader) {
			let clientUserGroupIds = [];
			if (type == 'drip') {
				[err, clientUserGroup] = await to(
					User_group.findAll({
						where: {
							forDrip: true,
							is_deleted: false,
							ClientId: clientId,
							UserId: userId,
						},
						attributes: ['id'],
					})
				);
				if (err) console.log('---Error When Check USer Group---', err);
			} else if (type == 'diwo') {
				[err, clientUserGroup] = await to(
					User_group.findAll({
						where: {
							forDiwo: true,
							is_deleted: false,
							ClientId: clientId,
							UserId: userId,
						},
						attributes: ['id'],
					})
				);
				if (err) console.log('---Error When Check USer Group---', err);
			}

			for (let data of clientUserGroup) {
				clientUserGroupIds.push(data.id);
			}

			console.log('-----clientUserGroupIds------', clientUserGroupIds);

			let UserGroupMappingObject = [];
			let userGroupIds_ = [];
			for (let row of rows) {
				let error = false;
				let errorList = [];
				let groupIds = [];
				let flag_1 = true;
				let market;
				let checkLearner;
				let checkClient;

				for (let key in row) {
					if (row[key] != '' && row[key] != null) {
						let data = row[key].toLowerCase();
						//Check forbiddenWords
						for (let word of forbiddenWords) {
							if (data.includes(word)) {
								errorList.push(`Special Word "${word}" Not Allowed.`);
								error = true;
								break;
							}
						}
						//check forbiddenSymbols
						for (let symbol of forbiddenSymbols) {
							if (data.includes(symbol)) {
								errorList.push(`Special Symbol "${symbol}" Not Allowed.`);
								error = true;
								break;
							}
						}
					}
				}

				for (let key in row) {
					if (row[key] != null && row[key] != '') {
						flag_1 = false;
					}
				}
				if (flag_1) {
					break;
				}

				if (row['action(edit/delete/unchange)'] == '' || row['action(edit/delete/unchange)'] == null) {
					error = true;
					errorList.push(MESSAGE.ACTION_REQUIRED);
				}

				if (row['contact id']) {
					row['learner id'] = row['contact id'];
				}

				if (row['learner id'] == '' || row['learner id'] == null) {
					error = true;
					errorList.push(MESSAGE.LEARNER_ID_REQUIRED);
				} else {
					//Check Valid Learner Id Need to Check
					[err, checkLearner] = await to(
						User.findOne({
							where: {
								account_id: row['learner id'],
								status: true,
								is_deleted: false,
							},
							attributes: ['id', 'account_id', 'MarketId', 'local_user_id', 'forDrip', 'forDiwo', 'cStatus'],
						})
					);
					if (err) console.log('---Error when check Learner Id.');

					if (!checkLearner) {
						error = true;
						errorList.push(MESSAGE.INVALID_ACCOUNT_ID);
					}
				}

				if (
					row['action(edit/delete/unchange)'].toLowerCase() == 'edit' ||
					row['action(edit/delete/unchange)'].toLowerCase() == 'delete'
				) {
					if (row['parent id'] == '' || row['parent id'] == null) {
						error = true;
						errorList.push(MESSAGE.PARENT_ID_REQUIRED);
					}

					if (row['parent account'] == '' || row['parent account'] == null) {
						error = true;
						errorList.push(MESSAGE.PARENT_ACCOUNT_REQUIRED);
					}

					if (
						row['parent id'] != '' &&
						row['parent id'] != null &&
						row['parent account'] != '' &&
						row['parent account'] != null
					) {
						//Check Valid Cliend id
						[err, checkClient] = await to(
							Client.findOne({
								where: {
									client_id: row['parent id'],
								},
								attributes: ['id', 'client_id', 'name'],
							})
						);
						if (err) console.log('---Error when get Client Data----', err);
						if (!checkClient) {
							error = true;
							errorList.push(MESSAGE.INVALID_PARENT_ACCOUNT);
						}
					}

					if (row['country'] == '' || row['country'] == null) {
						error = true;
						errorList.push(MESSAGE.COUNTRY_REQUIRED);
					} else {
						[err, market] = await to(
							Market.findOne({
								where: {
									status: true,
								},
								include: [
									{
										model: Country,
										attributes: ['id', 'name'],
										where: {
											name: {
												[sequelize.Op.iLike]: row['country'],
											},
										},
										required: true,
									},
								],
								attributes: ['id', 'db_name'],
							})
						);
						if (err) console.log('--error when check country--', err);

						if (!market) {
							error = true;
							errorList.push(MESSAGE.INVALID_COUNTRY);
						}
					}
				}

				if (row['action(edit/delete/unchange)'].toLowerCase() == 'edit') {
					if (row['contact group id']) {
						row['learner group id'] = row['contact group id'];
					}
					if (row['first name'] == '' || row['first name'] == null) {
						error = true;
						errorList.push(MESSAGE.FIRST_NAME_REQUIRED);
					}

					if (row['last name'] == '' || row['last name'] == null) {
						error = true;
						errorList.push(MESSAGE.LAST_NAME_REQUIRED);
					}

					if ((row['email'] == '' || row['email'] == null) && (row['mobile'] == '' || row['mobile'] == null)) {
						error = true;
						errorList.push(MESSAGE.EMAIL_OR_MOBILE_REQUIRED);
					}

					// Check Learner Market Is Valid Or Not
					if (checkLearner && market) {
						[err, checkValidLearner] = await to(
							User.findOne({
								where: {
									id: checkLearner.id,
									MarketId: market.id,
								},
								attributes: ['id', 'MarketId'],
							})
						);

						if (err) console.log('---Error When Check Learner And Market Mapping is Valid Or Not---', err);
						if (!checkValidLearner) {
							error = true;
							errorList.push(MESSAGE.INVALID_COUNTRY_OR_LEARNER);
						}
					}

					//Check Learner and Client Mapping is Valid Or Not

					if (checkLearner && checkClient) {
						[err, checkClientMapping] = await to(
							User_role_client_mapping.findOne({
								where: {
									UserId: checkLearner.id,
									ClientId: checkClient.id,
									RoleId: 1,
								},
							})
						);
						if (err) console.log('--Error when check Learner and Client Mapping is Valid or Not');

						if (!checkClientMapping) {
							error = true;
							errorList.push(MESSAGE.LEARNER_NOT_FOUND);
						}
					}

					//Check Learner Persanal Data
					if (checkLearner && market) {
						//Get Learner Persnale Data
						[err, localUser] = await to(
							dbInstance[market.db_name].User_master.findOne({
								where: {
									id: checkLearner.local_user_id,
								},
								attributes: ['id', 'first', 'last', 'country', 'email', 'phone'],
							})
						);

						if (!localUser) {
							error = true;
							errorList.push(MESSAGE.LEARNER_DETAILS_NOT_FOUND);
						} else {
							//Check Persanl Data
							if (
								row['first name'].toLowerCase().trimStart().trimEnd() ==
									localUser.first.toLowerCase().trimStart().trimEnd() &&
								row['last name'].toLowerCase().trimStart().trimEnd() ==
									localUser.last.toLowerCase().trimStart().trimEnd() &&
								row['country'].toLowerCase().trimStart().trimEnd() ==
									localUser.country.toLowerCase().trimStart().trimEnd()
								// ((localUser.state &&
								// 	row['state'].toLowerCase().trimStart().trimEnd() ==
								// 		localUser.state.toLowerCase().trimStart().trimEnd()) ||
								// 	((localUser.state == null || localUser.state == '') &&
								// 		(row['state'] == null || row['state'] == ''))) &&
								// ((localUser.city &&
								// 	row['city'].toLowerCase().trimStart().trimEnd() ==
								// 		localUser.city.toLowerCase().trimStart().trimEnd()) ||
								// 	((localUser.city == null || localUser.city == '') && (row['city'] == null || row['city'] == ''))) &&
								// ((localUser.code &&
								// 	row['code'].toLowerCase().trimStart().trimEnd() ==
								// 		localUser.code.toLowerCase().trimStart().trimEnd()) ||
								// 	((localUser.code == null || localUser.code == '') && (row['code'] == null || row['code'] == '')))

								// row['state'].toLowerCase().trimStart().trimEnd() == localUser.state.toLowerCase().trimStart().trimEnd() &&
								// row['city'].toLowerCase().trimStart().trimEnd() == localUser.city.toLowerCase().trimStart().trimEnd() &&
								// row['zip code'].toLowerCase().trimStart().trimEnd() == localUser.zipCode.toLowerCase().trimStart().trimEnd()
							) {
								//Check Mobile ANd Email
								if (row['email'] != '' && row['email'] != null) {
									if (row['email'].toLowerCase() != localUser.email.toLowerCase()) {
										error = true;
										errorList.push(MESSAGE.LEARNER_EMAIL_NOT_MATCH);
									}
								}
								if (row['mobile'] != '' && row['mobile'] != null) {
									if (row['mobile'].toLowerCase() != localUser.phone.toLowerCase()) {
										error = true;
										errorList.push(MESSAGE.LEARNER_MOBILE_NOT_MATCH);
									}
								}
							} else {
								error = true;
								errorList.push(MESSAGE.LEARNER_PERSONAL_DATA_NOT_MATCH);
							}
						}
					}

					//Check Custome Field

					//Check Required Field
					//Check Validation As Per type of custom Field
					row['customFields'] = {};

					if (customFields && customFields.length > 0) {
						for (let field of customFields) {
							// For Required Field
							if (field.isHide) {
								continue;
							}
							if (
								field.isRequired &&
								(row[field.label.toLowerCase()] == '' ||
									row[field.label.toLowerCase()] == null ||
									row[field.label.toLowerCase()] == ' ')
							) {
								error = true;
								errorList.push(`Custom Field ${field.label} is Required`);
							} else if (field.dataType == 'Number' || field.dataType == 'Percentage') {
								//For Required Field

								if (
									field.isRequired &&
									(row[field.label.toLowerCase()] == '' ||
										row[field.label.toLowerCase()] == null ||
										row[field.label.toLowerCase()] == ' ')
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Required`);
								} else if (row[field.label.toLowerCase()] && isNaN(row[field.label.toLowerCase()])) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.setMinValue &&
									row[field.label.toLowerCase()] < parseInt(field.setMinValue)
								) {
									// fOR Min Value
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.setMaxValue &&
									row[field.label.toLowerCase()] > parseInt(field.setMaxValue)
								) {
									// fOR Max Value
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}

								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.decimalValue &&
									parseFloat(row[field.label.toLowerCase()]) &&
									parseFloat(row[field.label.toLowerCase()]).toString().split('.')[1].length >
										parseInt(field.decimalValue)
								) {
									// For Deciaml
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
							} else if (field.dataType == 'Currency') {
								if (
									field.isRequired &&
									(row[field.label.toLowerCase()] == '' ||
										row[field.label.toLowerCase()] == null ||
										row[field.label.toLowerCase()] == ' ')
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
								if (row[field.label.toLowerCase()] && isNaN(row[field.label.toLowerCase()])) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
							} else if (field.dataType == 'Date picker') {
								if (
									field.isRequired &&
									(row[field.label.toLowerCase()] == null ||
										row[field.label.toLowerCase()] == '' ||
										row[field.label.toLowerCase()] == 'null')
								) {
									// ////////For Required Field/////////////
									error = true;
									errorList.push(`Custom Field ${field.label} is Required`);
								} else if (row[field.label.toLowerCase()] && isValidDate(row[field.label.toLowerCase()])) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								} else if (field.datePickerValidationType == 'Any Date') {
								} else if (field.datePickerValidationType == 'Future Date Only') {
									// Any future date
									// Any date after buffer time
									// Any date in a rolling date range
									// datePickerValidationType == 'Future Date Only'
									// futureDateValidationType == "Any future date",
									// futureDateValidationType == "Any date after buffer time",
									// futureDateValidationType == "Any date in a rolling date range",

									if (
										row[field.label.toLowerCase()] &&
										isValidDate(row[field.label.toLowerCase()]) &&
										field.futureDateValidationType == 'Any future date'
									) {
										//Testing Done
										if (row[field.label.toLowerCase()] && new Date(row[field.label.toLowerCase()]) < new Date()) {
											error = true;
											errorList.push(`Custom Field ${field.label} is Invalid`);
										}
									} else if (
										row[field.label.toLowerCase()] &&
										isValidDate(row[field.label.toLowerCase()]) &&
										field.futureDateValidationType == 'Any date after buffer time'
									) {
										//Testing Done
										let date = moment(new Date(row[field.label.toLowerCase()]));
										let requiredDate = moment(new Date()).add(field.dayCount, 'days');
										let currentDate = moment(new Date());
										if (date < requiredDate || date < currentDate) {
											error = true;
											errorList.push(`Custom Field ${field.label} is Invalid`);
										}
									} else if (
										row[field.label.toLowerCase()] &&
										isValidDate(row[field.label.toLowerCase()]) &&
										field.futureDateValidationType == 'Any date in a rolling date range'
									) {
										//Testing Done
										let date = moment(new Date(row[field.label.toLowerCase()]));
										let requiredDate = moment(new Date()).add(field.dayCount, 'days');
										let currentDate = moment(new Date());

										if (date > requiredDate || date < currentDate) {
											error = true;
											errorList.push(`Custom Field ${field.label} is Invalid`);
										}
									}
								} else if (
									row[field.label.toLowerCase()] &&
									isValidDate(row[field.label.toLowerCase()]) &&
									field.datePickerValidationType == 'Past Date Only'
								) {
									//Check Date is Past date Only
									// Testing Done
									if (new Date(row[field.label.toLowerCase()]) > new Date()) {
										error = true;
										errorList.push(`Custom Field ${field.label} is Invalid`);
									}
								} else if (field.datePickerValidationType == 'Specific Date Range') {
									//Check Date is in specific Date Range
									// Testing Done
									let startDate = moment(new Date(field.startDate));
									let endDate = moment(new Date(field.endDate));
									let date = moment(new Date(row[field.label.toLowerCase()]));
									if (date < startDate || date > endDate) {
										error = true;
										errorList.push(`Custom Field ${field.label} is Invalid`);
									}
								}
							} else if (field.dataType == 'Single-line text' || field.dataType == 'Multi-line text') {
								if (
									field.isRequired &&
									(row[field.label.toLowerCase()] == '' ||
										row[field.label.toLowerCase()] == null ||
										row[field.label.toLowerCase()] == ' ')
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Required`);
								}

								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.maxLength &&
									row[field.label.toLowerCase()].length > parseInt(field.maxLength)
								) {
									error = true;

									errorList.push(`Custom Field ${field.label} is Invalid`);
								}

								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.minLength &&
									row[field.label.toLowerCase()].length < parseInt(field.minLength)
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}

								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.restrictSpecialChar &&
									row[field.label.toLowerCase()] &&
									!/^[a-zA-Z0-9 ]*$/.test(row[field.label.toLowerCase()])
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}

								if (
									row[field.label.toLowerCase()] &&
									field &&
									field.restrictNumber &&
									row[field.label.toLowerCase()] &&
									/\d/.test(row[field.label.toLowerCase()])
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Invalid`);
								}
							} else if (field.dataType == 'Radio select' || field.dataType == 'Dropdown select') {
								if (
									field.isRequired &&
									(row[field.label.toLowerCase()] == '' ||
										row[field.label.toLowerCase()] == null ||
										row[field.label.toLowerCase()] == ' ')
								) {
									error = true;
									errorList.push(`Custom Field ${field.label} is Required`);
								} else if (row[field.label.toLowerCase()]) {
									//Check Valid Value
									let flag = true;
									for (let option of field.options) {
										if (!option.isHide && option.label == row[field.label.toLowerCase()]) {
											flag = false;
											break;
										}
									}
									if (flag) {
										error = true;
										errorList.push(`Custom Field ${field.label} is Invalid`);
									}
								}
							}

							if (row[field.label.toLowerCase()]) {
								row['customFields'][field.label] = row[field.label.toLowerCase()];
							}
						}
					}

					if (error == false) {
						//Update Custom Fields
						[err, updateTags] = await to(
							User.update(
								{ customFields: row['customFields'] },
								{
									where: {
										id: checkLearner.id,
									},
								}
							)
						);
						if (err) console.log('--Error When Update Leanrer Tags--', err);
					}

					let licenseStatus;
					// Check Status type
					if (row['status(licensed/unlicensed)'] == null || row['status(licensed/unlicensed)'] == '') {
						error = true;
						errorList.push(MESSAGE.STATUS_REQUIRED);
					} else {
						//Check Valid Status Type
						let statusTypes = ['Licensed', 'Unlicensed'];
						let flag = false;
						for (let type of statusTypes) {
							if (type.toLowerCase() == row['status(licensed/unlicensed)'].toLowerCase()) {
								flag = true;
								if (type == 'Licensed') {
									licenseStatus = 'Active';
								} else {
									licenseStatus = 'Unlicensed';
								}
								break;
							}
						}

						if (!flag) {
							error = true;
							errorList.push(MESSAGE.INVALID_STATUS);
						}
					}

					//check license unlicense count
					if (error == false) {
						//consume license
						if (licenseStatus == 'Unlicensed' && checkLearner.cStatus == 'Active') {
							[err, updateArchiveLearnerUser] = await to(
								User.update(
									{
										is_archive: true,
										cStatus: 'Unlicensed',
									},
									{
										where: {
											id: checkLearner.id,
										},
									}
								)
							);

							if (type == 'drip' || (type == 'diwo' && checkLearner.forDrip)) {
								await getRemoveOneLearnerCount(checkClient.id);
							}
							if (type == 'diwo' || (type == 'drip' && checkLearner.forDiwo)) {
								await getRemoveOneLearnerCountForDiwo(checkClient.id);
							}

							//For Update Count
							[err, userGroupDetails] = await to(
								User_group_mapping.findAll({
									where: {
										UserId: checkLearner.id,
									},
									attributes: ['UserGroupId'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);

							if (userGroupDetails && userGroupDetails.length > 0) {
								for (let groupdetails of userGroupDetails) {
									userGroupIds_.push(groupdetails.UserGroupId);
								}
							}

							//delete From Learner Group
							[err, deleteFromGroup] = await to(
								User_group_mapping.destroy({
									where: {
										UserId: checkLearner.id,
									},
								})
							);
							if (err) return ResponseError(res, err, 500, true);
						} else if (licenseStatus == 'Active' && checkLearner.cStatus == 'Unlicensed') {
							let checkCountStatus;
							if (type == 'drip' && !checkLearner.forDiwo) {
								checkCountStatus = await getLearnerValidaionOnCreateLearner(checkClient.id);
							} else if (type == 'diwo' && !checkLearner.forDrip) {
								checkCountStatus = await getLearnerValidaionOnCreateLearnerForDiwo(checkClient.id);
							}

							let checkCountForDrip;
							let checkCountForDiwo;
							if (type == 'drip' && checkLearner.forDiwo) {
								checkCountForDiwo = await getLearnerValidaionOnCreateLearnerForDiwo(checkClient.id);
								checkCountForDrip = await getLearnerValidaionOnCreateLearner(checkClient.id);
							} else if (type == 'diwo' && checkLearner.forDrip) {
								checkCountForDiwo = await getLearnerValidaionOnCreateLearnerForDiwo(checkClient.id);
								checkCountForDrip = await getLearnerValidaionOnCreateLearner(checkClient.id);
							}

							if (checkCountStatus == true || (checkCountForDrip && checkCountForDiwo)) {
								[err, updateArchiveLearnerUser] = await to(
									User.update(
										{
											is_archive: false,
											cStatus: 'Active',
										},
										{
											where: {
												id: checkLearner.id,
											},
										}
									)
								);

								if (type == 'drip' || (type == 'diwo' && checkCountForDrip)) {
									await getAddOneLearnerCount(checkClient.id);
								}

								if (type == 'diwo' || (type == 'drip' && checkCountForDiwo)) {
									await getAddOneLearnerCountForDiwo(checkClient.id);
								}
							} else {
								error = true;
								errorList.push(MESSAGE.INVALID_LICENSE);
							}
						}
					}

					//Check Job Role
					if (error == false) {
						if (row['job role'] != '' && row['job role'] != null && row['job role'] != '-') {
							[err, job_role] = await to(
								Client_job_role.findOne({
									where: {
										job_role_name: row['job role'],
										ClientId: checkClient.id,
									},
									attributes: ['id'],
								})
							);
							if (err) console.log('--Error When Check Job role is present or Not--', err);

							if (job_role) {
								//Clear Job Role
								[err, clearRoleJob] = await to(
									User_job_role_mapping.destroy({
										where: {
											UserId: checkLearner.id,
										},
									})
								);

								if (type == 'drip') {
									[err, addUserJobRole] = await to(
										User_job_role_mapping.create({
											UserId: checkLearner.id,
											ClientJobRoleId: job_role.id,
											forDrip: true,
										})
									);
									if (err) {
										console.log('-addUserJobRole--', err);
									}
								} else if (type == 'diwo') {
									[err, addUserJobRole] = await to(
										User_job_role_mapping.create({
											UserId: checkLearner.id,
											ClientJobRoleId: job_role.id,
											forDiwo: true,
										})
									);
									if (err) {
										console.log('-addUserJobRole--', err);
									}
								}
							} else {
								error = true;
								errorList.push(MESSAGE.INVALID_JOB_ROLE);
							}
						} else {
							//Clear Job Role
							[err, clearRoleJob] = await to(
								User_job_role_mapping.destroy({
									where: {
										UserId: checkLearner.id,
									},
								})
							);
						}
					}

					if (error == false) {
						//Update Tags
						let canTagUpdateFlag = true;
						//Check Learner tags (Tag is reserved or Not)
						if (row['tags'] && row['tags'] != '' && row['tags'] != undefined && row['tags'] != null) {
							let userTags = row['tags'].split(',');
							let useReservedTagsList = [];
							if (reservedTags && reservedTags.length > 0) {
								for (let tag of reservedTags) {
									if (userTags.indexOf(tag) > -1) {
										useReservedTagsList.push(tag);
									}
								}
								if (useReservedTagsList.length > 0) {
									errorList.push(MESSAGE.TAG_USED_IN_CONVERSATIONAL_FLOW);
									error = true;
									canTagUpdateFlag = false;
								}
							}
						}

						// else {
						// 	canTagUpdateFlag = false;
						// }

						if (canTagUpdateFlag) {
							//Update Tags
							[err, updateTags] = await to(
								User.update(
									{ tags: row['tags'] },
									{
										where: {
											id: checkLearner.id,
										},
									}
								)
							);
							if (err) console.log('--Error When Update Leanrer Tags--', err);
						}
					}

					if (error == false) {
						//For Learner Group
						if (
							row['learner group id'] != null &&
							row['learner group id'] != '' &&
							row['learner group id'] != NaN &&
							row['learner group id'] != undefined &&
							row['status(licensed/unlicensed)'].toLowerCase() != 'unlicensed' &&
							row['action(edit/delete/unchange)'].toLowerCase() != 'delete'
						) {
							let _groupIds = row['learner group id'].split(',');

							if (_groupIds && _groupIds.length > 0) {
								let flag = false;

								for (let learnerGroupId of _groupIds) {
									if (parseInt(learnerGroupId) == NaN) {
										flag = true;
									} else {
										groupIds.push(parseInt(learnerGroupId));
									}
								}

								// console.log('------groupIds----', groupIds);
								if (flag) {
									error = true;
									errorList.push(MESSAGE.LEARNER_GROUP_ID_INVALID);
								} else {
									//check all Learner Group is valid with learner Client
									groupIds = [...new Set(groupIds)];

									if (type == 'drip') {
										[err, checkGroupCount] = await to(
											User_group.count({
												where: {
													id: groupIds,
													forDrip: true,
													is_deleted: false,
													ClientId: clientId,
													UserId: userId,
												},
											})
										);
										if (err) console.log('--Error When check Leanrer group Ids is valid or not--', err);
									} else if (type == 'diwo') {
										[err, checkGroupCount] = await to(
											User_group.count({
												where: {
													id: groupIds,
													forDiwo: true,
													is_deleted: false,
													ClientId: clientId,
													UserId: userId,
												},
											})
										);
										if (err) console.log('--Error When check Leanrer group Ids is valid or not--', err);
									}

									if (groupIds.length == checkGroupCount) {
										let newLearnerGroupIds = [];
										//Get Learner Current Groups
										[err, learnerCurrentGroups] = await to(
											User_group_mapping.findAll({
												where: {
													UserId: checkLearner.id,
													UserGroupId: clientUserGroupIds,
												},
											})
										);

										// console.log('------learnerCurrentGroups----', learnerCurrentGroups);

										if (learnerCurrentGroups && learnerCurrentGroups.length > 0) {
											//Find New Groups in update
											for (let groupId of groupIds) {
												let flag = false;
												for (let currentGroup of learnerCurrentGroups) {
													if (groupId == currentGroup.UserGroupId) {
														flag = true;
													}
												}
												if (!flag) {
													newLearnerGroupIds.push(groupId);
												}
											}
										} else {
											if (groupIds.length > 0) {
												for (let groupId of groupIds) {
													newLearnerGroupIds.push(groupId);
												}
											}
										}

										console.log('------newLearnerGroupIds----', newLearnerGroupIds);
										learnerAddedIntoGroupCampaignStartRule(newLearnerGroupIds, [checkLearner.id]);
										[err, destroyOldLearnerGroupMapping] = await to(
											User_group_mapping.destroy({
												where: {
													UserId: checkLearner.id,
													UserGroupId: clientUserGroupIds,
												},
											})
										);
										if (err) console.log('---Error when destroy old learner group mpping--', err);
										for (let id of groupIds) {
											// console.log('-----checkLearner------', checkLearner.id);
											// console.log('-----id------', id);
											let payload = {
												UserId: checkLearner.id,
												UserGroupId: parseInt(id),
											};
											UserGroupMappingObject.push(payload);
										}

										if (UserGroupMappingObject.length >= 1000) {
											[err, createGroupLearnerMapping] = await to(
												User_group_mapping.bulkCreate(UserGroupMappingObject)
											);
											if (err) console.log('----Error when create Learner and group mapping.--', err);
											UserGroupMappingObject = [];
										}
									} else {
										error = true;
										errorList.push(MESSAGE.LEARNER_GROUP_NOT_ASSOCIATED);
									}
								}
							}
						} else {
							[err, destroyOldLearnerGroupMapping] = await to(
								User_group_mapping.destroy({
									where: {
										UserId: checkLearner.id,
										UserGroupId: clientUserGroupIds,
									},
								})
							);
							if (err) console.log('---Error when destroy old learner group mpping--', err);
						}
					}
				} else if (row['action(edit/delete/unchange)'].toLowerCase() == 'delete') {
					if (error == false) {
						[err, User_Details] = await to(
							User_role_client_mapping.destroy({
								where: {
									UserId: checkLearner.id,
									RoleId: 1,
									ClientId: checkClient.id,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, Update_User] = await to(
							User.update(
								{
									is_deleted: true,
									status: false,
									cStatus: 'Deleted',
								},
								{
									where: {
										id: checkLearner.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, localUser] = await to(
							dbInstance[market.db_name].User_master.update(
								{ isDeleted: true, status: false },
								{
									where: {
										id: checkLearner.local_user_id,
									},
								}
							)
						);

						if (err) return ResponseError(res, err, 500, true);

						//consume license drip diwo
						if (type == 'drip' || (type == 'diwo' && checkLearner.forDrip)) {
							await getRemoveOneLearnerCount(checkClient.id);
						}
						if (type == 'diwo' || (type == 'drip' && checkLearner.forDiwo)) {
							await getRemoveOneLearnerCountForDiwo(checkClient.id);
						}

						//For Update Count
						[err, userGroupDetails] = await to(
							User_group_mapping.findAll({
								where: {
									UserId: checkLearner.id,
								},
								attributes: ['UserGroupId'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						if (userGroupDetails && userGroupDetails.length > 0) {
							for (let groupdetails of userGroupDetails) {
								userGroupIds_.push(groupdetails.UserGroupId);
							}
						}

						//delete From Learner Group
						[err, deleteFromGroup] = await to(
							User_group_mapping.destroy({
								where: {
									UserId: checkLearner.id,
								},
							})
						);

						if (err) return ResponseError(res, err, 500, true);
					}
				}

				updateLearners.push(checkLearner.id);
				let Payload = {
					srNo: row['sr. no'],
					first: row['first name'],
					last: row['last name'],
					email: row['email'],
					mobile: row['mobile'],
					country: row['country'],
					state: row['state'],
					city: row['city'],
					zipCode: row['zip code'],
					tags: row['tags'],
					client_id: row['parent id'],
					clientName: row['parent account'],
					jobRole: row['job role'],
					learnerId: row['learner id'],
					whatappOptIn: row['whatapp opt in'],
					whatsappPermission: row['whatsapp permission'] && row['whatsapp permission'] == 'FALSE' ? false : true,
					emailPermission: row['email permission'] && row['email permission'] == 'FALSE' ? false : true,
					isError: error,
					errorMsg: errorList.toString(),
					isUpdated: !error,
					UserId: userId,
					ClientId: clientId,
					RoleId: roleId,
					forDrip: type == 'drip' ? true : false,
					forDiwo: type == 'diwo' ? true : false,
					customFields: row['customFields'],
					team_id: row['team user id'] ? row['team user id'] : null,
					status: row['status(licensed/unlicensed)'],
					action: row['action(edit/delete/unchange)'],
				};
				finalData.push(Payload);
			}

			if (userGroupIds_ && userGroupIds_.length > 0) {
				for (let groupId of userGroupIds_) {
					//For Update Count
					[err, userGroupCount] = await to(
						User_group_mapping.count({
							where: {
								UserGroupId: groupId,
							},
						})
					);

					if (err) return ResponseError(res, err, 500, true);

					let userCountPayload = {
						userCount: userGroupCount,
					};

					console.log('--userCountPayloadBHushan-', userCountPayload);

					[err, updateUserGroup] = await to(
						User_group.update(userCountPayload, {
							where: {
								id: groupId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}

			// console.log('-----UserGroupMappingObject-------', UserGroupMappingObject);

			if (UserGroupMappingObject.length > 0) {
				[err, createGroupLearnerMapping] = await to(User_group_mapping.bulkCreate(UserGroupMappingObject));
				if (err) console.log('----Error when create Learner and group mapping.--', err);
				UserGroupMappingObject = [];
			}

			if (finalData && finalData.length > 0) {
				[err, updateIntoDatBase] = await to(Update_learner.bulkCreate(finalData));
				if (err) console.log('---Error Update Learner Error When Update into Database', err);

				// let notifcationMessage = `Learner Bulk Update finished at {{date}}.Verify recent updates here.`;
				// if (type == 'drip') {
				// 	await createNotification(notifcationMessage, ['Bell'], [userId]);
				// } else if (type == 'diwo') {
				// 	await createNotificationforDiwo(notifcationMessage, ['Bell'], [userId]);
				// }
				[err, getUser] = await to(
					User.findOne({
						where: {
							id: userId,
						},
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
				[err, localUserData] = await to(
					dbInstance[getUser.Market.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, clientData] = await to(
					Client.findOne({
						where: {
							id: clientId,
						},
						attributes: ['name'],
					})
				);

				const userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
					localUserData && localUserData.last ? localUserData.last : ''
				}`;
				let userIds = [];
				let notifcationMessage = MESSAGE.LEARNER_EDITED;
				notifcationMessage = notifcationMessage.replace('{{count}}', finalData.length);
				notifcationMessage = notifcationMessage.replace('{{branch_name}}', clientData.name);
				notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
				if (type == 'drip') {
					notifcationMessage = notifcationMessage.replace('{{type}}', finalData.length === 1 ? 'contact' : 'contacts');
					userIds = await getAllUserIdsForNotification(clientId);
					const index = userIds.indexOf(userId);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotification(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.LEARNER_EDITED;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', finalData.length);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace(
						'{{type}}',
						finalData.length === 1 ? 'contact' : 'contacts'
					);
					await createNotification(notifcationMessageForUser, ['Bell'], [userId]);
				} else if (type == 'diwo') {
					notifcationMessage = notifcationMessage.replace('{{type}}', finalData.length === 1 ? 'learner' : 'learners');
					userIds = await getAllDiwoUserIdsForNotification(clientId);
					const index = userIds.indexOf(userId);
					if (index !== -1) {
						userIds.splice(index, 1);
					}
					await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
					let notifcationMessageForUser = MESSAGE.LEARNER_EDITED;
					notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', finalData.length);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
					notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
					notifcationMessageForUser = notifcationMessageForUser.replace(
						'{{type}}',
						finalData.length === 1 ? 'learner' : 'learners'
					);
					await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [userId]);
				}
			}
			updateLearnerGroupUserCountByType(type, clientId);

			if (updateLearners && updateLearners.length > 0) {
				[err, newLog] = await to(
					createlog(userId, clientId, roleId, `Update Learners`, req.ip, req.useragent, type, {
						UserId: updateLearners,
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
	} catch (error) {
		console.log('bulk Update Error', error);
	}
};

//Read Uploaded Learner List Excel Sheet
const getAllContentFileName = async function (req, res) {
	const filename = CONFIG.imagePath + '/uploads/excel/' + req.file.filename;
	exceltojson = xlsxtojson;
	try {
		const roleId = req.user.RoleId;
		const userId = req.user.id;
		const clientId = req.user.ClientId;
		const type = req.user.type;

		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		exceltojson(
			{
				input: filename,
				output: null,
				lowerCaseHeaders: true,
			},
			async function (err, rows) {
				if (err) return;

				bulkUploadLearner(rows, parseInt(roleId), parseInt(userId), parseInt(clientId), type, req);

				fs.unlink(filename, (err) => {
					if (err) {
						console.log('Error', err);
					}
				});

				return ResponseSuccess(res, {
					message: MESSAGE.REQUEST_IS_IN_PROGRESS,
				});
			}
		);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllContentFileName = getAllContentFileName;

const isValidDate = function (dateString) {
	if (dateString != null && dateString != '' && dateString != 'null' && dateString != 'NULL') {
		const parts = dateString.split('-');
		const date = new Date(parts[2], parts[1] - 1, parts[0]);
		return !isNaN(date.getTime());
	} else {
		return false;
	}
};

const bulkUploadLearner = async function (rows, roleId, userId, clientId, type, req) {
	try {
		const forbiddenWords = [
			// 'select',
			// 'insert',
			// 'update',
			// 'delete',
			// 'drop',
			// 'alter',
			// 'exec',
			// 'union',
			'utl_inaddr',
			'get_host_name',
			'randomblob',
			'xp_cmdshell',
			'execute',
			'document.cookie',
			'onerror=',
			'onclick=',
			'<script>',
			'<iframe>',
			'<img src=x onerror=alert(1)>',
		];

		const forbiddenSymbols = [
			'--',
			'/*',
			'*/',
			';',
			'|',
			'<',
			'>',
			// '/',
			'&',
			// '(',
			// ')',
			// '{',
			// '}',
			// '[',
			// ']',
			'$',
			'--',
			';',
			'\\',
			// '_',
		];

		let userEmailIdForWelcomeEmail = [];
		let createdLearnerIds = [];
		let appBranding;
		let clientDetails;
		let market;
		let finalDripDiwoAccessClient = [];
		let reservedTags = await getReservedTags(clientId);
		if (type == 'drip') {
			appBranding = await getClientAppBrandingByClientId(clientId);
		} else if (type == 'diwo') {
			appBranding = await getDiwoClientAppBrandingByClientId(clientId);
		}

		let finalArrayOfClients = await getAllSubClientAndBranchAccountLists(parseInt(clientId), true);
		let finalList = [];
		let customFields = await getAccountCustomField(clientId, type);

		finalList.push(parseInt(clientId));
		for (let client of finalArrayOfClients) {
			if (type == 'drip' && client.DripAccess) {
				finalList.push(client.id);
			} else if (type == 'diwo' && client.DiwoAccess) {
				finalList.push(client.id);
			}

			if (client.DripAccess && client.DiwoAccess) {
				finalDripDiwoAccessClient.push(client.id);
			}
		}

		let learnerList = [];
		let multipalLearnerCount = 0;
		let emailListArray = [];
		let phoneListArray = [];
		let usernameListArray = [];

		for (let row of rows) {
			//Check row is empty or not
			let isEmpty = false;
			for (let key in row) {
				if (row[key] != null && row[key] != '') {
					isEmpty = true;
					break;
				}
			}
			if (!isEmpty) {
				continue;
			}

			let user_details = {};
			user_details.errorMsg = [];
			user_details.isError = false;
			user_details.isEmail_invalid = false;
			user_details.isPhone_invalid = false;
			user_details.customFields = {};
			/////////////////Check Special Char Present Or not
			for (let key in row) {
				if (row[key] != '' && row[key] != null) {
					let data = row[key].toLowerCase();
					//Check forbiddenWords
					for (let word of forbiddenWords) {
						if (data.includes(word)) {
							user_details.errorMsg.push(`Special Word "${word}" Not Allowed.`);
							user_details.isError = true;
							break;
						}
					}
					//check forbiddenSymbols
					for (let symbol of forbiddenSymbols) {
						if (data.includes(symbol)) {
							user_details.errorMsg.push(`Special Symbol "${symbol}" Not Allowed.`);
							user_details.isError = true;
							break;
						}
					}
				}
			}

			if (
				row &&
				(row['*sr. no'] == undefined ||
					row['*first name'] == undefined ||
					row['*branch id'] == undefined ||
					row['*last name'] == undefined ||
					(appBranding && appBranding.compEmail && row['*email'] == undefined) ||
					(appBranding && !appBranding.compEmail && row['email'] == undefined) ||
					// (!appBranding && row['*email'] == undefined) ||
					(appBranding && appBranding.compMobNo && row['*mobile'] == undefined) ||
					(appBranding && !appBranding.compMobNo && row['mobile'] == undefined) ||
					(config_feature?.configurable_feature?.pwa_username && row['username'] == undefined) ||
					row['*country'] == undefined ||
					row['city'] == undefined ||
					row['state'] == undefined ||
					row['zip code'] == undefined ||
					row['job role'] == undefined ||
					// row['have the opt-in permission (yes/no)'] == undefined ||
					row['have email permission (yes/no)'] == undefined ||
					// row['send opt-in message (yes/no)'] == undefined ||
					row['tags'] == undefined)
			) {
				user_details.errorMsg.push(MESSAGE.COLUMN_HEADERS_INVALID);
				user_details.isError = true;
				user_details.status = true;
				user_details.is_verified = false;
				user_details.is_deleted = false;
				user_details.type = 'Learner';
				user_details.first = row && row['*first name'] ? row['*first name'] : '-';
				user_details.last = row && row['*last name'] ? row['*last name'] : '-';
				user_details.email =
					appBranding && appBranding.compEmail && row && row['*email']
						? row['*email']
						: appBranding && !appBranding.compEmail && row && row['email']
						? row['email']
						: !appBranding && row && row['*email']
						? row['*email']
						: '-';
				user_details.phone =
					appBranding && appBranding.compMobNo && row && row['*mobile']
						? row['*mobile']
						: appBranding && !appBranding.compMobNo && row && row['mobile']
						? row['mobile']
						: !appBranding && row && row['*mobile']
						? row['*mobile']
						: '-';

				if (config_feature?.configurable_feature?.pwa_username) {
					user_details.username = row && row['username'] ? row['username'] : '-';
				}

				user_details.country = row && row['*country'] ? row['*country'] : '-';
				user_details.city = row && row['city'] ? row['city'] : '-';
				user_details.state = row && row['state'] ? row['state'] : '-';
				user_details.zipCode = row && row['zip code'] ? row['zip code'] : '-';
				user_details.Client_Id = row && row['*branch id'] ? row['*branch id'] : '-';
				user_details.jobrole = row && row['job role'] ? row['job role'] : '-';
				user_details.tags = row && row['tags'];
				user_details.RoleId = roleId;
				user_details.UserId = userId;
				user_details.ClientId = clientId;
				user_details.haveWhatsAppOptIn =
					row &&
					row['have the opt-in permission (yes/no)'] &&
					row &&
					row['have the opt-in permission (yes/no)'].toLowerCase() == 'yes'
						? true
						: false;
				user_details.haveEmailPer =
					row &&
					row['have email permission (yes/no)'] &&
					row &&
					row['have email permission (yes/no)'].toLowerCase() == 'yes'
						? true
						: false;
				// user_details.triggerOptInMsg = row && row['send opt-in message (yes/no)'] && row['send opt-in message (yes/no)'].toLowerCase() == 'yes' ? true : false;
			}

			//Check Header For Custom Field
			if (customFields && customFields.length > 0) {
				let flag = false;
				for (let field of customFields) {
					if (field.isHide) {
						continue;
					}
					if (field.isRequired && row && row['*' + field.label.toLowerCase()] == undefined) {
						user_details.errorMsg.push(`*${field.label} is required`);
						flag = true;
					} else if (!field.isRequired && row && row[field.label.toLowerCase()] == undefined) {
						user_details.errorMsg.push(`${field.label} is required`);
						flag = true;
					} else {
						if (row[field.label.toLowerCase()]) {
							user_details.customFields[field.label] = row[field.label.toLowerCase()];
						} else if (row['*' + field.label.toLowerCase()]) {
							user_details.customFields[field.label] = row['*' + field.label.toLowerCase()];
						} else {
							user_details.customFields[field.label] = null;
						}
					}

					// if (!flag) {
					// Add Validation for Custom Field
					////////////////////////////////////////////Validation For Single-line and Muti-line////////////////////////////////////////////

					if (field.dataType == 'Single-line text' || field.dataType == 'Multi-line text') {
						// Check Required Field
						// Check Min Char Limit
						// Check Max Char Limit
						// Check Special Char
						// Check Number

						if (
							field.isRequired &&
							(user_details.customFields[field.label] == null ||
								user_details.customFields[field.label] == '' ||
								user_details.customFields[field.label] == 'null')
						) {
							// ////////For Required Field/////////////
							user_details.errorMsg.push(`${field.label} is required`);
							flag = true;
						} else if (
							user_details.customFields[field.label] &&
							field.minCharLimit &&
							field.minCharLimit != '' &&
							field.minCharLimit != null &&
							user_details.customFields[field.label].length < field.minCharLimit
						) {
							// ////////For Min Char limit Check/////////////

							user_details.errorMsg.push(`${field.label} should be min ${field.minCharLimit} characters`);
							flag = true;
						} else if (
							user_details.customFields[field.label] &&
							field.maxCharLimit != '' &&
							field.maxCharLimit != null &&
							user_details.customFields[field.label].length > field.maxCharLimit
						) {
							// ////////For Max Char limit Check/////////////
							user_details.errorMsg.push(`${field.label} should be max ${field.maxCharLimit} characters`);
							flag = true;
						} else if (
							field.restrictSpecialChar &&
							user_details.customFields[field.label] &&
							!/^[a-zA-Z0-9 ]*$/.test(user_details.customFields[field.label])
						) {
							// ////////For Special Char Check/////////////
							user_details.errorMsg.push(`${field.label} should not contain special characters`);
							flag = true;
						} else if (
							field.restrictNumber &&
							user_details.customFields[field.label] &&
							/\d/.test(user_details.customFields[field.label])
						) {
							// ////////For Checking Number is present or not/////////////
							user_details.errorMsg.push(`${field.label} should not contain a number`);
							flag = true;
						}
					}
					if (field.dataType == 'Number' || field.dataType == 'Percentage') {
						//Check reuqiured Field
						//Check min Value
						//Check Max Value
						//Check Decimal Value

						if (
							field.isRequired &&
							(user_details.customFields[field.label] == null ||
								user_details.customFields[field.label] == '' ||
								user_details.customFields[field.label] == 'null')
						) {
							// ////////For Required Field/////////////
							user_details.errorMsg.push(`${field.label} is required`);
							flag = true;
						} else if (
							user_details.customFields[field.label] &&
							field.setMinValue &&
							parseFloat(user_details.customFields[field.label]) &&
							parseFloat(user_details.customFields[field.label]) < parseFloat(field.setMinValue)
						) {
							// ////////For Min Value Check/////////////
							user_details.errorMsg.push(`${field.label} should be min ${field.setMinValue}`);
							flag = true;
						} else if (
							user_details.customFields[field.label] &&
							field.setMaxValue &&
							parseFloat(user_details.customFields[field.label]) &&
							parseFloat(user_details.customFields[field.label]) > parseFloat(field.setMaxValue)
						) {
							// ////////For Max Value Check/////////////
							user_details.errorMsg.push(`${field.label} should be max ${field.setMaxValue}`);
							flag = true;
						} else if (
							user_details.customFields[field.label] &&
							field.decimalValue &&
							parseFloat(user_details.customFields[field.label]) &&
							parseFloat(user_details.customFields[field.label]).toString().split('.')[1].length > field.decimalValue
						) {
							user_details.errorMsg.push(`${field.label} should have at most ${field.decimalValue} decimal places`);
							flag = true;
						}
					}
					if (field.dataType == 'Currency') {
						//Check Required Field
						//Check Valid Currency NUmber

						if (
							field.isRequired &&
							(user_details.customFields[field.label] == null ||
								user_details.customFields[field.label] == '' ||
								user_details.customFields[field.label] == 'null')
						) {
							// ////////For Required Field/////////////
							user_details.errorMsg.push(`${field.label} is required`);
							flag = true;
						} else if (user_details.customFields[field.label] && isNaN(user_details.customFields[field.label])) {
							user_details.errorMsg.push(`${field.label} should be a valid currency number`);
							flag = true;
						}
					}
					if (field.dataType == 'Radio select' || field.dataType == 'Dropdown select') {
						//Check Required Field
						//Check Valid Option
						if (
							field.isRequired &&
							(user_details.customFields[field.label] == null ||
								user_details.customFields[field.label] == '' ||
								user_details.customFields[field.label] == 'null')
						) {
							// ////////For Required Field/////////////
							user_details.errorMsg.push(`${field.label} is required`);
							flag = true;
						} else if (user_details.customFields[field.label] && field.options && field.options.length > 0) {
							let validOption = true;
							for (let option of field.options) {
								if (!option.isHide && option.label == user_details.customFields[field.label]) {
									validOption = false;
									break;
								}
							}
							if (validOption) {
								user_details.errorMsg.push(`${field.label} should be a valid option`);
								flag = true;
							}
						}
					}
					if (field.dataType == 'Date picker') {
						//Check Required Field
						//Check Valid Date
						if (
							field.isRequired &&
							(user_details.customFields[field.label] == null ||
								user_details.customFields[field.label] == '' ||
								user_details.customFields[field.label] == 'null')
						) {
							// ////////For Required Field/////////////
							user_details.errorMsg.push(`${field.label} is required`);
							flag = true;
						} else if (user_details.customFields[field.label] && !isValidDate(user_details.customFields[field.label])) {
							user_details.errorMsg.push(`${field.label} should be a valid date`);
							flag = true;
						} else if (field.datePickerValidationType == 'Any Date') {
						} else if (field.datePickerValidationType == 'Future Date Only') {
							// Any future date
							// Any date after buffer time
							// Any date in a rolling date range
							// datePickerValidationType == 'Future Date Only'
							// futureDateValidationType == "Any future date",
							// futureDateValidationType == "Any date after buffer time",
							// futureDateValidationType == "Any date in a rolling date range",

							if (
								isValidDate(user_details.customFields[field.label]) &&
								field.futureDateValidationType == 'Any future date'
							) {
								//Testing Done
								if (new Date(user_details.customFields[field.label]) < new Date()) {
									user_details.errorMsg.push(`${field.label} should be a future date`);
									flag = true;
								}
							} else if (
								isValidDate(user_details.customFields[field.label]) &&
								field.futureDateValidationType == 'Any date after buffer time'
							) {
								//Testing Done
								let date = moment(new Date(user_details.customFields[field.label]));
								let requiredDate = moment(new Date()).add(field.dayCount, 'days');
								let currentDate = moment(new Date());
								if (date < requiredDate || date < currentDate) {
									user_details.errorMsg.push(`${field.label} should be a future date`);
									flag = true;
								}
							} else if (
								isValidDate(user_details.customFields[field.label]) &&
								field.futureDateValidationType == 'Any date in a rolling date range'
							) {
								//Testing Done
								let date = moment(new Date(user_details.customFields[field.label]));
								let requiredDate = moment(new Date()).add(field.dayCount, 'days');
								let currentDate = moment(new Date());

								if (date > requiredDate || date < currentDate) {
									user_details.errorMsg.push(`${field.label} should be a future date`);
									flag = true;
								}
							}
						} else if (
							isValidDate(user_details.customFields[field.label]) &&
							field.datePickerValidationType == 'Past Date Only'
						) {
							//Check Date is Past date Only
							// Testing Done
							if (new Date(user_details.customFields[field.label]) > new Date()) {
								user_details.errorMsg.push(`${field.label} should be a past date`);
								flag = true;
							}
						} else if (field.datePickerValidationType == 'Specific Date Range') {
							//Check Date is in specific Date Range
							// Testing Done
							let startDate = moment(new Date(field.startDate));
							let endDate = moment(new Date(field.endDate));
							let date = moment(new Date(user_details.customFields[field.label]));
							if (date < startDate || date > endDate) {
								user_details.errorMsg.push(`${field.label} should be in specific date range`);
								flag = true;
							}
						}
					}
					// }
				}
				if (flag) {
					// user_details.errorMsg.push(MESSAGE.COLUMN_HEADERS_INVALID);
					user_details.isError = true;
					user_details.status = true;
					user_details.is_verified = false;
					user_details.is_deleted = false;
				}
			}
			// if (
			// 	row['*first name'] != undefined &&
			// 	row['*first name'] != '' &&
			// 	row['*last name'] != undefined &&
			// 	row['*last name'] != '' &&
			// 	row['*country'] != undefined &&
			// 	row['*country'] != '' &&
			// 	row['*branch id'] != undefined &&
			// 	row['*branch id'] != ''
			// ) {

			//Check Learner tags (Tag is reserved or Not)
			if (row['tags'] && row['tags'] != '' && row['tags'] != undefined && row['tags'] != null) {
				if (reservedTags && reservedTags.length > 0) {
					let userTags = row['tags'].split(',');
					let useReservedTags = [];
					for (let tag of userTags) {
						if (reservedTags.indexOf(tag) > -1) {
							useReservedTags.push(tag);
						}
					}
					if (useReservedTags.length > 0) {
						user_details.errorMsg.push(MESSAGE.TAG_USED_IN_CONVERSATIONAL_FLOW);
						flag = true;
					}
				}
			}

			user_details.status = true;
			user_details.is_verified = false;
			user_details.is_deleted = false;
			user_details.type = 'Learner';
			user_details.srNo = row['*sr. no'];
			user_details.first = row['*first name'];
			user_details.last = row['*last name'];
			// user_details.email = row['*email'];
			// user_details.phone = row['*mobile'];
			user_details.email =
				appBranding && appBranding.compEmail && row && row['*email']
					? row['*email']
					: appBranding && !appBranding.compEmail && row && row['email']
					? row['email']
					: !appBranding && row && row['*email']
					? row['*email']
					: '';
			user_details.phone =
				appBranding && appBranding.compMobNo && row && row['*mobile']
					? row['*mobile']
					: appBranding && !appBranding.compMobNo && row && row['mobile']
					? row['mobile']
					: !appBranding && row && row['*mobile']
					? row['*mobile']
					: '';
			if (config_feature?.configurable_feature?.pwa_username) {
				user_details.username = row['username'];
			}

			user_details.country = row['*country'];
			user_details.city = row['city'];
			user_details.state = row['state'];
			user_details.zipCode = row['zip code'];
			user_details.Client_Id = row['*branch id'];
			user_details.jobrole = row['job role'];
			user_details.tags = row['tags'];
			user_details.RoleId = roleId;
			user_details.UserId = userId;
			user_details.ClientId = clientId;
			user_details.haveWhatsAppOptIn =
				row['have the opt-in permission (yes/no)'] && row['have the opt-in permission (yes/no)'].toLowerCase() == 'yes'
					? true
					: false;
			user_details.haveEmailPer =
				row['have email permission (yes/no)'] && row['have email permission (yes/no)'].toLowerCase() == 'yes'
					? true
					: false;
			// user_details.triggerOptInMsg = row['send opt-in message (yes/no)'] && row['send opt-in message (yes/no)'].toLowerCase() == 'yes' ? true : false;

			//Remaining Validation for Phone
			// if (appBranding && appBranding.compEmail == true && (row['*email'] == undefined || row['*email'] == '')) {
			// 	user_details.errorMsg.push('Email address is required');
			// 	user_details.isError = true;
			// }
			// if (appBranding && appBranding.compMobNo == true && (row['*mobile'] == undefined || row['*mobile'] == '')) {
			// 	user_details.errorMsg.push('Mobile Number is required');
			// 	user_details.isError = true;
			// }

			if (row['*country'] != undefined && row['*country'] != '') {
				[err, market] = await to(
					Market.findOne({
						where: {
							status: true,
						},
						include: [
							{
								model: Country,
								attributes: ['id', 'name', 'callingCode', 'countryCode'],
								where: {
									name: {
										[sequelize.Op.iLike]: row['*country'],
									},
								},
								required: true,
							},
						],
						attributes: ['id', 'db_name'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (market) {
					user_details.MarketId = market.id;
					user_details.db_name = market.db_name;
					user_details.country = market.Countries[0].name;
					user_details.CountryId = market.Countries[0].id;
				} else {
					user_details.errorMsg.push(MESSAGE.INVALID_COUNTRY);
					user_details.isError = true;
				}
			} else {
				user_details.errorMsg.push(MESSAGE.COUNTRY_REQUIRED);
				user_details.isError = true;
			}

			if (row['*first name'] == undefined || row['*first name'] == '') {
				user_details.errorMsg.push(MESSAGE.FIRST_NAME_REQUIRED);
				user_details.isError = true;
			}

			if (row['*last name'] == undefined || row['*last name'] == '') {
				user_details.errorMsg.push(MESSAGE.LAST_NAME_REQUIRED);
				user_details.isError = true;
			}

			if (row['*sr. no'] == undefined || row['*sr. no'] == '') {
				user_details.errorMsg.push(MESSAGE.SR_NO_REQUIRED);
				user_details.isError = true;
			}

			// user_details.email = user_details.email.replace(' ', '');
			if (user_details.email) {
				user_details.email = user_details.email.toLowerCase().replace(' ', '');
			} else {
				user_details.email = null;
			}

			let array = [
				'[',
				']',
				'{',
				'}',
				'#',
				'$',
				'%',
				'^',
				'&',
				'*',
				'(',
				')',
				'!',
				'`',
				'~',
				'/',
				',',
				'|',
				'<',
				'>',
				'?',
				'+',
				';',
				':',
				'"',
				"'",
			];

			if (appBranding && appBranding.compEmail === true) {
				if (user_details.email == '') {
					user_details.isEmail_invalid = true;
					user_details.errorMsg.push(MESSAGE.EMAIL_REQUIRED);
					user_details.isError = true;
				} else if (
					user_details.email.indexOf('@') >= 1 &&
					user_details.email.lastIndexOf('.') > user_details.email.indexOf('@') + 1 &&
					user_details.email.length >= user_details.email.lastIndexOf('.') + 3 &&
					user_details.email.indexOf('@') == user_details.email.lastIndexOf('@')
				) {
					let invalid = false;
					for (let char of array) {
						if (user_details.email.indexOf(char) != -1) {
							invalid = true;
						}
					}
					if (!invalid) {
						user_details.isEmail_invalid = false;
					} else {
						user_details.isEmail_invalid = true;
						user_details.errorMsg.push(MESSAGE.INVALID_EMAIL);
						user_details.isError = true;
					}
				} else {
					user_details.isEmail_invalid = true;
					user_details.errorMsg.push(MESSAGE.INVALID_EMAIL);
					user_details.isError = true;
				}
			} else {
				if (user_details.email !== '' && user_details.email !== null) {
					if (
						user_details.email.indexOf('@') >= 1 &&
						user_details.email.lastIndexOf('.') > user_details.email.indexOf('@') + 1 &&
						user_details.email.length >= user_details.email.lastIndexOf('.') + 3 &&
						user_details.email.indexOf('@') == user_details.email.lastIndexOf('@')
					) {
						let invalid = false;
						for (let char of array) {
							if (user_details.email.indexOf(char) != -1) {
								invalid = true;
							}
						}
						if (!invalid) {
							user_details.isEmail_invalid = false;
						} else {
							user_details.isEmail_invalid = true;
							user_details.errorMsg.push(MESSAGE.INVALID_EMAIL);
							user_details.isError = true;
						}
					} else {
						user_details.isEmail_invalid = true;
						user_details.errorMsg.push(MESSAGE.INVALID_EMAIL);
						user_details.isError = true;
					}
				}
			}

			if (appBranding && appBranding.compMobNo == true) {
				if (user_details.phone == '') {
					user_details.isPhone_invalid = true;
					user_details.errorMsg.push(MESSAGE.MOBILE_REQUIRED);
					user_details.isError = true;
				} else {
					var pattern = /^[6,7,8,9][0-9]{9}$/;
					let mob = parseInt(user_details.phone);
					let userPhone = market?.Countries[0].callingCode + user_details.phone;
					//Add Phone Validation
					//First Need to find User's Country Details

					// if (!pattern.test(mob)) {
					// 	user_details.isPhone_invalid = true;
					// 	user_details.errorMsg.push(MESSAGE.INVALID_MOBILE);
					// 	user_details.isError = true;
					// }

					if (
						!market ||
						isValidPhoneNumber(userPhone, market?.Countries[0].countryCode) === false ||
						(market?.Countries[0].countryCode == 'IN' && !pattern.test(mob))
					) {
						user_details.isPhone_invalid = true;
						if (market?.Countries[0].countryCode == 'IN' && !pattern.test(mob)) {
							user_details.errorMsg.push(MESSAGE.INVALID_MOBILE);
						} else {
							user_details.errorMsg.push(MESSAGE.INVALID_MOBILE_1);
						}
						user_details.isError = true;
					}
				}
			} else {
				if (user_details.phone != '') {
					var pattern = /^[6,7,8,9][0-9]{9}$/;
					let mob = parseInt(user_details.phone);
					let userPhone = market?.Countries[0].callingCode + user_details.phone;

					//Add Phone Validation
					//First Need to find User's Country Details

					// if (!pattern.test(mob)) {
					// 	user_details.isPhone_invalid = true;
					// 	user_details.errorMsg.push(MESSAGE.INVALID_MOBILE);
					// 	user_details.isError = true;
					// }

					if (
						!market ||
						isValidPhoneNumber(userPhone, market?.Countries[0].countryCode) === false ||
						(market?.Countries[0].countryCode == 'IN' && !pattern.test(mob))
					) {
						user_details.isPhone_invalid = true;
						if (market?.Countries[0].countryCode == 'IN' && !pattern.test(mob)) {
							console.log('-11');
							user_details.errorMsg.push(MESSAGE.INVALID_MOBILE);
						} else {
							console.log('-21');

							user_details.errorMsg.push(MESSAGE.INVALID_MOBILE_1);
						}
						user_details.isError = true;
					}
				}
			}

			if (row['*branch id'] != undefined && row['*branch id'] != '') {
				[err, _client] = await to(
					Client.findOne({
						where: {
							client_id: user_details.Client_Id,
						},
						attributes: ['id', 'category'],
						include: [{ model: ClientTeamSetup }],
					})
				);
				if (_client && finalList.indexOf(_client.id) != -1) {
					//Check Client Access Of Not

					if (_client.category !== 'Branch Account') {
						user_details.errorMsg.push(MESSAGE.INVALID_ACCOUNT);
						user_details.isError = true;
					} else {
						let checkChild = await getClientChildVilidation(_client);
						//Check Client Access
						if (!(await checkClientIdAccess(clientId, _client.id))) {
							user_details.errorMsg.push(MESSAGE.INVALID_ACCOUNT);
							user_details.isError = true;
						}
						if (checkChild) {
							user_details.errorMsg.push(MESSAGE.INVALID_ACCOUNT);
							user_details.isError = true;
						} else {
							//Add Code For Team Setup
						}
					}
				} else if (!_client) {
					user_details.errorMsg.push(MESSAGE.INVALID_ACCOUNT_ID);
					user_details.isError = true;
				}
			} else {
				user_details.errorMsg.push(MESSAGE.ACCOUNT_REQUIRED);
				user_details.isError = true;
			}

			if (
				(row && row['add to drip (yes/no)'] != undefined && row['add to drip (yes/no)'] != '') ||
				(row && row['add to diwo (yes/no)'] != undefined && row['add to diwo (yes/no)'] != '')
			) {
				[err, _client] = await to(
					Client.findOne({
						where: {
							client_id: user_details.Client_Id,
						},
						attributes: ['id', 'category'],
					})
				);

				if (_client && finalDripDiwoAccessClient.indexOf(_client.id) != -1) {
					if (_client.category !== 'Branch Account') {
						user_details.errorMsg.push(MESSAGE.INVALID_ACCOUNT);
						user_details.isError = true;
					} else {
						if (row && row['add to drip (yes/no)'] != undefined && row['add to drip (yes/no)'] != '') {
							user_details.forDrip = row['add to drip (yes/no)'].toLowerCase() == 'yes' ? true : false;
						} else if (row && row['add to diwo (yes/no)'] != undefined && row['add to diwo (yes/no)'] != '') {
							user_details.forDiwo = row['add to diwo (yes/no)'].toLowerCase() == 'yes' ? true : false;
						}
					}
				} else if (!_client) {
					user_details.errorMsg.push(MESSAGE.NO_ACCESS_ACCOUNT_);
					user_details.isError = true;
				}
			}

			user_details.first = await capitalFirstLatter(user_details.first);
			user_details.last = await capitalFirstLatter(user_details.last);

			// }
			//  else {
			// 	user_details.errorMsg.push('Please fill all required data.');
			// 	user_details.isError = true;
			// }

			if (type == 'drip') {
				user_details.forDrip = true;
			} else if (type == 'diwo') {
				user_details.forDiwo = true;
			}

			//forDiwoLicense Add Count
			if (type == 'drip' && user_details.forDiwo) {
				let diwoCheckCount = await getLearnerValidaionCountForDiwo(user_details.Client_Id);
				if (!diwoCheckCount.flag || diwoCheckCount.count == 0) {
					user_details.errorMsg.push('do not have a valid drip license for additional learners');
				}
			}

			//for Drip License Add Count
			if (type == 'diwo' && user_details.forDrip) {
				let dripCheckCount = await getLearnerValidaionCount(user_details.Client_Id);
				if (!dripCheckCount.flag || dripCheckCount.count == 0) {
					user_details.errorMsg.push('do not have a valid drip license for additional learners');
				}
			}

			if (emailListArray.length > 0) {
				if (
					emailListArray.indexOf(user_details.email) != -1 &&
					user_details.email !== '' &&
					user_details.email !== null
				) {
					//Duplicate Email is available in Excel
					user_details.errorMsg.push(MESSAGE.EMAIL_EXITS);
					user_details.isError = true;
				}
			}

			emailListArray.push(user_details.email);

			if (phoneListArray.length > 0) {
				if (
					phoneListArray.indexOf(user_details.phone) != -1 &&
					user_details.phone !== '' &&
					user_details.phone !== null
				) {
					//Duplicate Phone is available in Excel
					user_details.errorMsg.push(MESSAGE.PHONE_EXITS);
					user_details.isError = true;
				}
			}

			phoneListArray.push(user_details.phone);

			if (config_feature?.configurable_feature?.pwa_username) {
				if (usernameListArray.length > 0) {
					if (
						usernameListArray.indexOf(user_details.username) != -1 &&
						user_details.username !== '' &&
						user_details.username !== null
					) {
						//Duplicate Username is available in Excel
						user_details.errorMsg.push(MESSAGE.USERNAME_EXITS);
						user_details.isError = true;
					}
				}

				usernameListArray.push(user_details.username);
			}

			user_details.errorMsg = user_details.errorMsg.toString();

			learnerList.push(user_details);

			multipalLearnerCount++;
			if (learnerList.length === 500) {
				[err, createLocalUser] = await to(Upload_learner.bulkCreate(learnerList));
				if (err) console.log('---Error When Create Learner in Bulk--', err);
				learnerList = [];
			}
		}

		if (learnerList.length > 0) {
			[err, createLocalUser] = await to(Upload_learner.bulkCreate(learnerList));
			if (err) console.log('---Error When Create Learner in Bulk--', err);
			learnerList = [];
		}

		[err, Uploadlearners] = await to(
			Upload_learner.findAll({
				where: {
					RoleId: roleId,
					UserId: userId,
					ClientId: clientId,
					isEmail_invalid: false,
					isPhone_invalid: false,
					isCreated: false,
					isError: false,
				},
				attributes: ['email', 'phone', 'username', 'Client_Id'],
			})
		);
		if (err) console.log('---Error when gets New Uploaded Learner --', err);
		let emailArray = [];
		let phoneArray = [];
		let usernameArray = [];
		let client_IdArray = [];

		if (Uploadlearners && Uploadlearners.length > 0) {
			for (let learner of Uploadlearners) {
				if (learner.email && learner.email != null && learner.email != '') {
					emailArray.push(learner.email);
				}
				if (learner.phone && learner.phone != null && learner.phone != '') {
					phoneArray.push(learner.phone);
				}

				if (config_feature?.configurable_feature?.pwa_username) {
					if (learner.username && learner.username != null && learner.username != '') {
						usernameArray.push(learner.username);
					}
				}

				client_IdArray.push(learner.Client_Id);
			}
		}
		client_IdArray = [...new Set(client_IdArray)];

		[err, clientDetails] = await to(
			Client.findAll({
				where: {
					client_id: client_IdArray,
				},
				include: [{ model: ClientTeamSetup, include: [{ model: TeamSetup }] }],
			})
		);
		if (err) console.log('---Error when gets Client List --', err);

		[err, marketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['db_name', 'id'],
			})
		);
		if (err) console.log('---Error when gets market Details --', err);
		//step for check duplicate record

		//emailArray
		let emailList = emailArray;
		let phoneList = phoneArray;
		let usernameList = usernameArray;

		let list = [];

		if (marketDetails && marketDetails.length > 0) {
			for (let email of emailList) {
				for (let market of marketDetails) {
					let marketUser = market.convertToJSON();
					[err, localUserEmail] = await to(
						dbInstance[marketUser.db_name].User_master.findAll({
							where: {
								email: email,
								isDeleted: false,
							},
							attributes: ['email'],
						})
					);
					if (err) console.log('---Error when gets local User Email --', err);
					//Check Email
					let emailExits = [];
					if (localUserEmail && localUserEmail.length > 0) {
						for (let localUser_email of localUserEmail) {
							let client_id;
							for (let user of Uploadlearners) {
								if (user.email === localUser_email.email) {
									client_id = user.Client_Id;
									break;
								}
							}

							for (let client of clientDetails) {
								if (client.client_id == client_id) {
									if (!(await checkDuplicateLearnerDetails(client.id, { email: localUser_email.email }, type))) {
										emailExits.push(localUser_email.email);
									}
									break;
								}
							}
						}
					}

					[err, updateEmailStatus] = await to(
						Upload_learner.update(
							{
								isEmail_exits: true,
								isError: true,
								emailError: 'Email is already exist.',
							},
							{
								where: {
									email: emailExits,
									isCreated: false,
								},
							}
						)
					);
					if (err) console.log('---Error when Updated update Email Status--', err);
				}
			}

			for (let phone of phoneList) {
				for (let market of marketDetails) {
					let marketUser = market.convertToJSON();

					[err, localUserPhone] = await to(
						dbInstance[marketUser.db_name].User_master.findAll({
							where: {
								phone: phone,
								isDeleted: false,
							},
							attributes: ['phone'],
						})
					);
					if (err) console.log('---Error when gets local User Phone --', err);

					//Check Phone
					let phoneExits = [];
					if (localUserPhone && localUserPhone.length > 0) {
						for (let localUser_phone of localUserPhone) {
							if (localUser_phone.phone != '') {
								let client_id;
								for (let user of Uploadlearners) {
									if (user.phone === localUser_phone.phone) {
										client_id = user.Client_Id;
										break;
									}
								}
								for (let client of clientDetails) {
									if (client.client_id == client_id) {
										if (!(await checkDuplicateLearnerDetails(client.id, { phone: localUser_phone.phone }, type))) {
											phoneExits.push(localUser_phone.phone);
										}
										break;
									}
								}
							}
						}
					}

					[err, updatePhoneStatus] = await to(
						Upload_learner.update(
							{
								isPhone_exits: true,
								PhoneError: 'Mobile Number already exists.',
								isError: true,
							},
							{
								where: {
									phone: phoneExits,
									isCreated: false,
								},
							}
						)
					);
					if (err) console.log('---Error when Updated update Phone Status--', err);
				}
			}

			if (config_feature?.configurable_feature?.pwa_username) {
				for (let username of usernameList) {
					for (let market of marketDetails) {
						let marketUser = market.convertToJSON();

						[err, localUserName] = await to(
							dbInstance[marketUser.db_name].User_master.findAll({
								where: {
									username: username,
									isDeleted: false,
								},
								attributes: ['username'],
							})
						);
						if (err) console.log('---Error when gets local User username --', err);

						//Check Phone
						let usernameExits = [];
						if (localUserName && localUserName.length > 0) {
							for (let localUser_name of localUserName) {
								if (localUser_name.username != '') {
									let client_id;
									for (let user of Uploadlearners) {
										if (user.username === localUser_name.username) {
											client_id = user.Client_Id;
											break;
										}
									}
									for (let client of clientDetails) {
										if (client.client_id == client_id) {
											if (
												!(await checkDuplicateLearnerDetails(client.id, { username: localUser_name.username }, type))
											) {
												usernameExits.push(localUser_name.username);
											}
											break;
										}
									}
								}
							}
						}

						[err, updateUsernameStatus] = await to(
							Upload_learner.update(
								{
									isUseraname_exits: true,
									UsernameError: 'UserName already exists.',
									isError: true,
								},
								{
									where: {
										username: usernameExits,
										isCreated: false,
									},
								}
							)
						);
						if (err) console.log('---Error when Updated update Username Status--', err);
					}
				}
			}

			//valid upload learner
			[err, uploadLearnerDetails] = await to(
				Upload_learner.findAll({
					where: {
						isEmail_invalid: false,
						isPhone_invalid: false,
						isEmail_exits: false,
						isPhone_exits: false,
						isUseraname_exits: false,
						RoleId: roleId,
						UserId: userId,
						ClientId: clientId,
						isCreated: false,
						isError: false,
					},
				})
			);
			if (err) console.log('---Error when get all upload Learner Detailss--', err);

			if (uploadLearnerDetails && uploadLearnerDetails.length > 0) {
				let clientIds = [];
				let updateCountObject = [];
				let learnerOptInLogList = [];
				let uploadLearnerIds = [];
				let userRoleMapping = [];
				let createdLearnerIds = [];
				let jobRoleNotFindLearnerIds = [];
				let createJobRole = [];
				let licenceCountData = [];
				for (let client of clientDetails) {
					let checkCount;
					if (type == 'drip') {
						checkCount = await getLearnerValidaionCount(client.id);
					} else if (type == 'diwo') {
						checkCount = await getLearnerValidaionCountForDiwo(client.id);
					}
					licenceCountData.push({
						client_id: client.client_id,
						count: checkCount.count,
						unlimetedFlage: checkCount.flag,
						id: client.id,
						ClientTeamSetup: client.ClientTeamSetups,
					});
				}
				for (let uploadLearner of uploadLearnerDetails) {
					let userDetail = uploadLearner.convertToJSON();
					let learnerTableId = userDetail.id;
					for (let client of licenceCountData) {
						if (client.client_id == uploadLearner.Client_Id) {
							let checkCount = false;
							if (client.unlimetedFlage) {
								checkCount = true;
							} else if (client.count > 0) {
								checkCount = true;
							}
							// if (type == 'drip') {
							// 	checkCount = await getLearnerValidaionOnCreateLearner(client.id);
							// 	userDetail.forDrip = true;
							// } else if (type == 'diwo') {
							// 	checkCount = await getLearnerValidaionOnCreateLearnerForDiwo(client.id);
							// 	userDetail.forDiwo = true;
							// }

							let dripDiwoCheckCount = false;
							//forDiwoLicense Add Count
							if (type == 'drip' && userDetail.forDiwo) {
								let diwoCheckCount = await getLearnerValidaionCountForDiwo(client.id);
								if (diwoCheckCount.flag || diwoCheckCount.count > 0) {
									dripDiwoCheckCount = true;
									userDetail.forDiwo = true;
								} else {
									dripDiwoCheckCount = false;
									userDetail.forDiwo = false;
								}
							}

							//for Drip License Add Count
							if (type == 'diwo' && userDetail.forDrip) {
								let dripCheckCount = await getLearnerValidaionCount(client.id);
								if (dripCheckCount.flag || dripCheckCount.count > 0) {
									dripDiwoCheckCount = true;
									userDetail.forDrip = true;
								} else {
									dripDiwoCheckCount = false;
									userDetail.forDrip = false;
								}
							}

							if (checkCount) {
								userDetail.cStatus = 'Active';
							} else {
								userDetail.cStatus = 'Unlicensed';
							}

							userDetail.account_id = '0';
							userDetail.acceptPolicy = false;

							///////////////////////////////////////// Gernerate Password ////////////////////////////////////////////////

							if (config_feature?.configurable_feature?.pwa_password) {
								const password = await generatePassword();
								console.log('---bulk Generated Password--', password);

								userDetail.password = await hashPassword(password);
								console.log('-- bulk Hashed Password--', userDetail.password);
							}

							uploadLearnerIds.push(learnerTableId);
							delete userDetail.id;

							// console.log('-userDetail--2---', userDetail);

							//Add Policy
							// userDetail.userPolicyDetails = await getAllLatestPolicyByMarketId(userDetail.MarketId);

							/////////////////////////////////////////////////////////////////
							[err, createLocalUser] = await to(dbInstance[userDetail.db_name].User_master.create(userDetail));
							if (err) console.log('---Error when Create Local User--', err);

							///////////////////////////////////////////////////////////////////////////////////////////

							userDetail.local_user_id = createLocalUser.id;

							//Get User Team Id
							if (
								userDetail.email &&
								userDetail.email != '' &&
								userDetail.email != null &&
								client?.ClientTeamSetup?.length > 0
							) {
								userDetail.team_id = await getTeamUserIdByUsingEmail(null, userDetail.email, client.ClientTeamSetup[0]);
							}

							///////////////////////////////////////////////////////

							[err, createUser] = await to(User.create(userDetail));
							if (err) console.log('---Error when Create User--', err);

							///////////////////////////////////////////////////////////////

							if (userDetail.team_id) {
								let teamSetupDetails = {
									access_token: client.ClientTeamSetup[0].TeamSetup.access_token,
									team_id: client.ClientTeamSetup[0].TeamSetup.team_id,
								};
								const chatId = await getChatIdByTeamUserId(userDetail.team_id, teamSetupDetails);
								if (chatId) {
									[err, saveChatDetails] = await to(
										TeamChatDetail.create({
											UserId: createUser.id,
											chat_id: chatId,
											ClientId: client.id,
											TeamSetupId: client.ClientTeamSetup[0].TeamSetupId,
										})
									);
									if (err) {
										console.log('-----------update Chat Ids By Using New Token Error 2------------', err);
										continue;
									}
								}
							}
							//Check and get ChatId
							//Welcome Email
							if (userDetail && userDetail.email) {
								userEmailIdForWelcomeEmail.push(userDetail.email);
							}
							if (checkCount || dripDiwoCheckCount) {
								client.count = client.count - 1;
								if (clientIds.includes(client.id)) {
									let index = clientIds.indexOf(client.id);
									updateCountObject[index].count = updateCountObject[index].count + 1;
								} else {
									updateCountObject.push({
										clientId: client.id,
										count: 1,
									});
									clientIds.push(client.id);
								}
							}

							//Maintain Tag Log
							if (createUser && createUser.cStatus == 'Active' && createUser.haveWhatsAppOptIn) {
								if (type == 'drip') {
									let payload = {
										acceptDate: new Date(),
										UserId: createUser.id,
										type: 'WhatsApp OPT-IN',
										policyType: 'OPT-IN',
										// ipAddress:''
										// macAddress:'',
										ClientId: clientId,
										acceptanceType: 'Declaration by Client',
									};

									payload.forDrip = createUser.forDrip;
									payload.forDiwo = createUser.forDiwo;

									if (type == 'drip') {
										payload.forDrip = true;
									} else if (type == 'diwo') {
										payload.forDiwo = true;
									}
									learnerOptInLogList.push(payload);
									//await learnerOptInLog(payload, type);
								}

								let payload_ = {
									acceptDate: new Date(),
									UserId: createUser.id,
									type: 'Email Permission',
									policyType: 'Email Permission',
									// ipAddress:''
									// macAddress:'',
									ClientId: clientId,
									acceptanceType: 'Declaration by Client',
								};
								//await learnerOptInLog(payload_, type);

								payload_.forDrip = createUser.forDrip;
								payload_.forDiwo = createUser.forDiwo;

								if (type == 'drip') {
									payload_.forDrip = true;
								} else if (type == 'diwo') {
									payload_.forDiwo = true;
								}
								learnerOptInLogList.push(payload_);
								if (learnerOptInLogList.length === 1000) {
									await learnerOptInLogBulkCreate(learnerOptInLogList);
									learnerOptInLogList = [];
								}
							}

							if (createUser && createUser.cStatus == 'Active' && createUser.triggerOptInMsg) {
								if (type == 'drip') {
									await sendWhatsAppOptInMsg([userDetail.phone], clientId, userId);
								}
								///////////////////////////////////////////////////////////////////////////////////////////////////
								///////////////////////////////////Trrigger OPT_IN WhatsApp Msg OR Email///////////////////////////
								///////////////////////////////////////////////////////////////////////////////////////////////////
							}

							let payload = {
								RoleId: 1, //Learner Role
								UserId: createUser.id,
								ClientId: client.id,
							};

							payload.forDrip = createUser.forDrip;
							payload.forDiwo = createUser.forDiwo;

							if (type == 'drip') {
								payload.forDrip = true;
							} else if (type == 'diwo') {
								payload.forDiwo = true;
							}

							userRoleMapping.push(payload);
							createdLearnerIds.push(createUser.id);
							if (userRoleMapping.length === 1000) {
								[err, create_user_role] = await to(User_role_client_mapping.bulkCreate(userRoleMapping));
								if (err) console.log('-create_user_role--', err);

								//Add Into default Learner Group
								await addNewLearnerIntoDefaultLeanrerGroup(createdLearnerIds, type);

								/////////////////--------------Send Password Reset Link---------------////////////////////
								// if (config_feature?.configurable_feature?.pwa_password) {
								// 	for (let data of userRoleMapping) {
								// 		await triggerLearnerResetPassWordLink(
								// 			data.UserId,
								// 			data.ClientId,
								// 			type,
								// 			CONFIG.jwt_expiration_reset_password_admin
								// 		);
								// 	}
								// }

								// Sending welcome email to learner user email with create password link
								if (
									config_feature?.configurable_feature?.pwa_password ||
									config_feature?.configurable_feature?.pwa_otp
								) {
									for (let data of userRoleMapping) {
										await bulkuploadlearnerUserMailWithCreatePassWordLinkNotification(
											data.UserId,
											data.ClientId,
											type,
											CONFIG.jwt_expiration_reset_password_admin,
											'bulkUploadLearnerFor1000Learners'
										);
									}
								}

								userRoleMapping = [];
								createdLearnerIds = [];
							}

							if (userDetail.jobrole) {
								[err, job_role] = await to(
									Client_job_role.findOne({
										where: {
											job_role_name: {
												[sequelize.Op.iLike]: userDetail.jobrole,
											},
											ClientId: client.id,
										},
										attributes: ['id'],
									})
								);
								if (err) console.log('-job_role--', err);

								if (job_role) {
									// if (type == 'drip') {
									// 	createJobRole.push({
									// 		UserId: createUser.id,
									// 		ClientJobRoleId: job_role.id,
									// 		forDrip: true,
									// 	});
									// } else if (type == 'diwo') {
									// 	createJobRole.push({
									// 		UserId: createUser.id,
									// 		ClientJobRoleId: job_role.id,
									// 		forDiwo: true,
									// 	});
									// }

									let payload = {
										UserId: createUser.id,
										ClientJobRoleId: job_role.id,
										forDrip: createUser.forDrip,
										forDiwo: createUser.forDiwo,
									};

									if (type == 'drip') {
										payload.forDrip = true;
									} else if (type == 'diwo') {
										payload.forDiwo = true;
									}

									createJobRole.push(payload);

									if (createJobRole.length === 1000) {
										[err, addUserJobRole] = await to(User_job_role_mapping.bulkCreate(createJobRole));
										if (err) console.log('-addUserJobRole--', err);
										createJobRole = [];
									}
								} else {
									jobRoleNotFindLearnerIds.push(learnerTableId);
								}
							}
						}
					}
				}

				//Update Learner Account Id
				await updateUserAccountId();
				for (let data of updateCountObject) {
					if (type == 'drip') {
						await getAddMultipalLearnerCount(data.clientId, data.count);
					} else if (type == 'diwo') {
						await getAddMultipalLearnerCountForDiwo(data.clientId, data.count);
					}
				}
				if (learnerOptInLogList.length > 0) {
					await learnerOptInLogBulkCreate(learnerOptInLogList);
					learnerOptInLogList = [];
				}
				[err, updateStatus] = await to(
					Upload_learner.update(
						{
							isCreated: true,
						},
						{
							where: {
								id: uploadLearnerIds,
							},
						}
					)
				);
				if (err) console.log('-updateStatus--', err);
				if (userRoleMapping.length > 0) {
					[err, create_user_role] = await to(User_role_client_mapping.bulkCreate(userRoleMapping));
					if (err) console.log('-create_user_role--', err);

					//Remaining Leanrer Add Into default Learner Group
					await addNewLearnerIntoDefaultLeanrerGroup(createdLearnerIds, type);

					/////////////////--------------Send Password Reset Link---------------////////////////////
					// if (config_feature?.configurable_feature?.pwa_password) {
					// 	for (let data of userRoleMapping) {
					// 		await triggerLearnerResetPassWordLink(
					// 			data.UserId,
					// 			data.ClientId,
					// 			type,
					// 			CONFIG.jwt_expiration_reset_password_admin
					// 		);
					// 	}
					// }

					// Sending welcome email to learner user email with create password link
					if (config_feature?.configurable_feature?.pwa_password || config_feature?.configurable_feature?.pwa_otp) {
						for (let data of userRoleMapping) {
							await bulkuploadlearnerUserMailWithCreatePassWordLinkNotification(
								data.UserId,
								data.ClientId,
								type,
								CONFIG.jwt_expiration_reset_password_admin,
								'bulkUploadLearners'
							);
						}
					}

					userRoleMapping = [];
					createdLearnerIds = [];
				}
				[err, updateStatus] = await to(
					Upload_learner.update(
						{
							isCreated: true,
							isError: true,
							jobRoleErr: 'Job role not find',
						},
						{
							where: {
								id: jobRoleNotFindLearnerIds,
							},
						}
					)
				);
				if (err) console.log('-updateStatus--', err);
				if (createJobRole.length > 0) {
					[err, addUserJobRole] = await to(User_job_role_mapping.bulkCreate(createJobRole));
					if (err) console.log('-addUserJobRole--', err);
					createJobRole = [];
				}
			}
		}

		//Trigger WelCome Email
		if (userEmailIdForWelcomeEmail && userEmailIdForWelcomeEmail.length > 0) {
			if (type == 'drip') {
				checkAndTriggeredWelcomeEmail(userEmailIdForWelcomeEmail, clientId);
			} else if (type == 'diwo') {
				checkAndTriggeredWelcomeEmailForDiwo(userEmailIdForWelcomeEmail, clientId);
			}
		}

		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
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
		[err, localUserData] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, clientData] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['name'],
			})
		);

		const userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
			localUserData && localUserData.last ? localUserData.last : ''
		}`;
		let userIds = [];
		let notifcationMessage = MESSAGE.Learner_Uploaded;
		notifcationMessage = notifcationMessage.replace('{{count}}', multipalLearnerCount);
		notifcationMessage = notifcationMessage.replace('{{branch_name}}', clientData.name);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', multipalLearnerCount === 1 ? 'Contact' : 'Contacts');
			userIds = await getAllUserIdsForNotification(clientId);
			const index = userIds.indexOf(userId);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotification(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Uploaded;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', multipalLearnerCount);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				multipalLearnerCount === 1 ? 'Contact' : 'Contacts'
			);
			await createNotification(notifcationMessageForUser, ['Bell', 'PopUp'], [userId]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', multipalLearnerCount === 1 ? 'Learner' : 'Learners');
			userIds = await getAllDiwoUserIdsForNotification(clientId);
			const index = userIds.indexOf(userId);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.Learner_Uploaded;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{count}}', multipalLearnerCount);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{branch_name}}', clientData.name);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			notifcationMessageForUser = notifcationMessageForUser.replace(
				'{{type}}',
				multipalLearnerCount === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessageForUser, ['Bell', 'PopUp'], [userId]);
		}

		if (createdLearnerIds && createdLearnerIds.length > 0) {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					'Upload Learners',
					req.ip,
					req.useragent,
					req.user.type,
					{
						UserId: createdLearnerIds,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
		if (err) {
			console.log('----ERROR----', err);
		}

		return {
			message: type == 'drip' ? MESSAGE.CREATE_ALL_CONTACT_USER : MESSAGE.CREATE_ALL_LEARNER_USER,
		};
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const getAllLearnerByClientIdAndJobRoleId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
			jobRoleIds: Joi.array().items(Joi.number().integer().positive()),
			customField: Joi.array().allow(null, {}),
			tags: Joi.alternatives().try(Joi.string().trim().allow(null).allow(''), Joi.array().items(Joi.string())),
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
			clientIds: req.body.clientIds,
			jobRoleIds: req.body.jobRoleIds,
			customField: req.body.customField,
			tags: req.body.tags,
			limit: req.query.limit,
			page: req.query.page,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		let { clientIds, jobRoleIds, customField, tags, limit, page } = value;

		let err, learners;
		// let clientIds = req.body.clientIds;
		// let jobRoleIds = req.body.jobRoleIds;
		// let customField = req.body.customField;
		// let tags = req.body.tags;

		let offset = 0;
		// let limit = req.query.limit;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		offset = (page - 1) * limit;

		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (req.query.page != NaN && req.query.page >= 1) offset = (parseInt(req.query.page) - 1) * limit;
		// }

		if (jobRoleIds.length > 0) {
			if (type == 'drip') {
				let whereCondition = { cStatus: 'Active', forDrip: true };
				if (tags.length > 0) {
					whereCondition.tags = {
						[Op.ne]: '',
					};
				}

				let customFieldQuery = '';
				for (let item of customField) {
					if (customFieldQuery == '') {
						customFieldQuery = `"User"."customFields"->> '${item.label}' IN (${item.option
							.map((item) => `'${item}'`)
							.join(',')})`;
					} else {
						customFieldQuery =
							customFieldQuery +
							` AND "User"."customFields"->> '${item.label}' IN (${item.option.map((item) => `'${item}'`).join(',')})`;
					}
				}

				if (customField.length > 0) {
					whereCondition.customFields = sequelize.literal(customFieldQuery);
				}

				console.log('---------whereConditionDripJobRole------', whereCondition);

				[err, learners] = await to(
					User.findAndCountAll({
						where: whereCondition,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
							{
								model: Client,
								where: {
									id: clientIds,
									DripAccess: true,
								},
							},
							{
								model: Client_job_role,
								where: {
									id: jobRoleIds,
									forDrip: true,
								},
							},
							{
								model: Role,
								where: {
									id: 1,
								},
								through: 'User_role_client_mapping',
							},
						],
						order: [['id', 'ASC']],
						// offset: offset,
						// limit: limit
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				let whereCondition = { cStatus: 'Active', forDiwo: true };
				if (tags.length > 0) {
					whereCondition.tags = {
						[Op.ne]: '',
					};
				}

				let customFieldQuery = '';
				for (let item of customField) {
					if (customFieldQuery == '') {
						customFieldQuery = `"User"."customFields"->> '${item.label}' IN (${item.option
							.map((item) => `'${item}'`)
							.join(',')})`;
					} else {
						customFieldQuery =
							customFieldQuery +
							` AND "User"."customFields"->> '${item.label}' IN (${item.option.map((item) => `'${item}'`).join(',')})`;
					}
				}

				if (customField.length > 0) {
					whereCondition.customFields = sequelize.literal(customFieldQuery);
				}

				[err, learners] = await to(
					User.findAndCountAll({
						where: whereCondition,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
							{
								model: Client,
								where: {
									id: clientIds,
									DiwoAccess: true,
								},
							},
							{
								model: Client_job_role,
								where: {
									id: jobRoleIds,
									forDiwo: true,
								},
							},
							{
								model: Role,
								where: {
									id: 1,
								},
								through: 'User_role_client_mapping',
							},
						],
						order: [['id', 'ASC']],
						// offset: offset,
						// limit: limit
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else {
			if (type == 'drip') {
				let whereCondition = { cStatus: 'Active', forDrip: true };
				if (tags.length > 0) {
					whereCondition.tags = {
						[Op.ne]: '',
					};
				}

				let customFieldQuery = '';
				for (let item of customField) {
					if (customFieldQuery == '') {
						customFieldQuery = `"User"."customFields"->> '${item.label}' IN (${item.option
							.map((item) => `'${item}'`)
							.join(',')})`;
					} else {
						customFieldQuery =
							customFieldQuery +
							` AND "User"."customFields"->> '${item.label}' IN (${item.option.map((item) => `'${item}'`).join(',')})`;
					}
				}

				// customFieldQuery = "customfields->>'Birthday Week' = 'Sunday'";
				if (customField.length > 0) {
					whereCondition.customFields = sequelize.literal(customFieldQuery);
				}

				[err, learners] = await to(
					User.findAndCountAll({
						where: whereCondition,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
							{
								model: Client,
								where: {
									id: clientIds,
									DripAccess: true,
								},
							},
							{
								model: Client_job_role,
								where: {
									forDrip: true,
								},
								required: false,
							},
							{
								model: Role,
								where: {
									id: 1,
								},
								through: 'User_role_client_mapping',
							},
						],
						order: [['id', 'ASC']],
						// offset: offset,
						// limit: limit
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				let whereCondition = { cStatus: 'Active', forDiwo: true };
				if (tags.length > 0) {
					whereCondition.tags = {
						[Op.ne]: '',
					};
				}

				let customFieldQuery = '';
				for (let item of customField) {
					if (customFieldQuery == '') {
						customFieldQuery = `"User"."customFields"->> '${item.label}' IN (${item.option
							.map((item) => `'${item}'`)
							.join(',')})`;
					} else {
						customFieldQuery =
							customFieldQuery +
							` AND "User"."customFields"->> '${item.label}' IN (${item.option.map((item) => `'${item}'`).join(',')})`;
					}
				}

				if (customField.length > 0) {
					whereCondition.customFields = sequelize.literal(customFieldQuery);
				}

				[err, learners] = await to(
					User.findAndCountAll({
						where: whereCondition,
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
							{
								model: Client,
								where: {
									id: clientIds,
									DiwoAccess: true,
								},
							},
							{
								model: Client_job_role,
								where: {
									forDiwo: true,
								},
								required: false,
							},
							{
								model: Role,
								where: {
									id: 1,
								},
								through: 'User_role_client_mapping',
							},
						],
						order: [['id', 'ASC']],

						// offset: offset,
						// limit: limit
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let finalLearnerList = [];
		let tagsFlag = false;
		if (tags.length > 0) {
			tagsFlag = true;
		}
		let marketList;
		[err, marketList] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['id', 'db_name'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let marketWiseData = [];
		for (let market of marketList) {
			marketWiseData.push({ ids: [[]], MarketId: market.id, db_name: market.db_name, finalData: [] });
		}

		for (let user of learners.rows) {
			if (user.Market) {
				if (marketWiseData[user.Market.id - 1].ids[marketWiseData[user.Market.id - 1].ids.length - 1].length >= 100) {
					marketWiseData[user.Market.id - 1].ids.push([]);
				}
				marketWiseData[user.Market.id - 1].ids[marketWiseData[user.Market.id - 1].ids.length - 1].push(
					user.local_user_id
				);
			}
		}

		for (let market of marketWiseData) {
			if (market.ids.length > 0) {
				for (let ids of market.ids) {
					if (ids.length == 0) {
						break;
					}
					let query = `SELECT id, "first", "email", "last", "phone", "imagePath", "city" FROM "User_masters" AS "User_master" WHERE "User_master"."id" IN (${ids.toString()}) ORDER BY "User_master"."id" DESC;`;
					let localUsers = await dbInstance[market.db_name].query(query);

					if (localUsers && localUsers[0].length > 0) {
						market.finalData = [...market.finalData, ...localUsers[0]];
					}
				}
			}
		}

		for (let learner of learners.rows) {
			let learnerUser = learner.convertToJSON();
			let localUser;
			// [err, localUser] = await to(
			// 	dbInstance[learnerUser.Market.db_name].User_master.findOne({
			// 		where: {
			// 			id: learnerUser.local_user_id,
			// 		},
			// 		attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
			// 	})
			// );
			// if (err) return ResponseError(res, err, 500, true);

			for (let i = 0; i < marketWiseData[learner.Market.id - 1].finalData.length; i++) {
				if (marketWiseData[learner.Market.id - 1].finalData[i].id == learner.local_user_id) {
					localUser = marketWiseData[learner.Market.id - 1].finalData[i];
					marketWiseData[learner.Market.id - 1].finalData.splice(i, 1);
					break;
				}
			}

			if (localUser) {
				learnerUser.first = localUser.first;
				learnerUser.last = localUser.last;
				learnerUser.email = localUser.email;
				learnerUser.phone = localUser.phone;
				learnerUser.imagePath = localUser.imagePath;
				learnerUser.city = localUser.city;
			}
			if (tagsFlag) {
				let flag = false;
				let userTags = learner.tags;
				if (userTags != '' && userTags != null) {
					userTags = userTags.split(',');
					for (let tag of userTags) {
						if (tags.indexOf(tag) > -1) {
							flag = true;
						}
					}
				}
				if (flag) {
					finalLearnerList.push(learnerUser);
				}
			} else {
				finalLearnerList.push(learnerUser);
			}
		}

		return ResponseSuccess(res, {
			data: finalLearnerList,
			count: learners.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllLearnerByClientIdAndJobRoleId = getAllLearnerByClientIdAndJobRoleId;

const createLearnerGroup = async function (req, res) {
	try {
		// =========================
		// Selected Learner, Selected Job Role Id, Selected ClientId Validation
		// =========================
		const schema = Joi.object({
			selectAllFlag: Joi.boolean(), // Boolean flag to determine if all users are selected
			selectedUserIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer user IDs
			jobRoleIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer job role IDs
			clientIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer client IDs
		});

		// Validate the request body against the schema
		const { error, value } = schema.validate({
			selectedUserIds: req.body.selectedUserIds,
			selectAllFlag: req.body.selectAllFlag,
			jobRoleIds: req.body.jobRoleIds,
			clientIds: req.body.clientIds,
		});

		// If validation fails, return an error response
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		// Extract validated values
		const { selectAllFlag, selectedUserIds, jobRoleIds, clientIds } = value;

		// =========================
		// Learner Group Details Validation
		// =========================

		// Check if learnerGroupInfo is present in the request body
		if (!req.body.learnerGroupInfo) return ResponseError(res, { message: 'Learner Group Data Missing' }, 400);

		let leanerGroupData = req.body.learnerGroupInfo;

		const otherschema = Joi.object({
			id: Joi.equal(null), // Ensures that 'id' must be null (likely for new entries)
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(), // Title with min/max length validation
			description: Joi.string().trim().max(validationConstant.description.max).allow(null).allow(''), // Optional description with max length
			ClientId: Joi.number().integer().positive().required(), // Mandatory positive integer for ClientId
			RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(), // Mandatory positive integer for RoleId
			UserId: Joi.number().integer().positive().required(), // Mandatory positive integer for UserId
		});

		// Validate the learner group data
		const { error: error_1, value: value_1 } = otherschema.validate({
			id: leanerGroupData.id,
			title: leanerGroupData.title,
			description: leanerGroupData.description,
			ClientId: leanerGroupData.ClientId,
			RoleId: leanerGroupData.RoleId,
			UserId: leanerGroupData.UserId,
		});

		// If validation fails, return an error response
		if (error_1) return ResponseError(res, { message: error_1.details[0].message }, 400);

		// Assign the validated data back
		leanerGroupData = value_1;

		// =========================
		// Check Client Access
		// =========================

		// Ensure that the user has access to all specified client IDs
		if (clientIds?.length > 0) {
			for (let clientId of clientIds) {
				if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		}

		// Ensure that the user has access to the client ID in the learner group data
		if (leanerGroupData.ClientId) {
			if (!(await checkClientIdAccess(req.user.ClientId, leanerGroupData.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		let type = req.user.type;

		if (type == 'drip') {
			leanerGroupData.forDrip = true;
		} else if (type == 'diwo') {
			leanerGroupData.forDiwo = true;
		}

		leanerGroupData.title = await capitalFirstLatter(leanerGroupData.title);
		leanerGroupData.userCount = selectedUserIds.length;

		[err, createUserGroup] = await to(User_group.create(leanerGroupData));
		if (err) return ResponseError(res, err, 500, true);

		if (selectAllFlag) {
			if (jobRoleIds.length > 0) {
				if (type == 'drip') {
					[err, learners] = await to(
						User.findAll({
							where: {
								forDrip: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DripAccess: true,
									},
								},
								{
									model: Client_job_role,
									where: {
										id: jobRoleIds,
									},
								},
							],
							order: [['createdAt', 'desc']],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo') {
					[err, learners] = await to(
						User.findAll({
							where: {
								forDiwo: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DiwoAccess: true,
									},
								},
								{
									model: Client_job_role,
									where: {
										id: jobRoleIds,
									},
								},
							],
							order: [['createdAt', 'desc']],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else {
				let whereConditionForClient = {
					id: clientIds,
				};
				if (type == 'drip') {
					whereConditionForClient.DripAccess = true;
				} else if (type == 'diwo') {
					whereConditionForClient.DiwoAccess = true;
				}

				[err, learners] = await to(
					User.findAll({
						include: [
							{
								model: Market,
							},
							{
								model: Client,
								where: whereConditionForClient,
							},
							{
								model: Client_job_role,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
			for (let learner of learners) {
				let payload = {
					UserId: learner.id,
					UserGroupId: createUserGroup.id,
				};
				[err, addLearnerIntoGroup] = await to(User_group_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else {
			for (let learner of selectedUserIds) {
				let payload = {
					UserId: learner,
					UserGroupId: createUserGroup.id,
				};
				[err, addLearnerIntoGroup] = await to(User_group_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		[err, learnerGroup] = await to(
			User_group.findOne({
				where: {
					id: createUserGroup.id,
				},
				include: [
					{
						model: User,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Notification
		// [err, getUser] = await to(
		// 	User.findOne({
		// 		where: {
		// 			id: req.user.id,
		// 		},
		// 		attributes: ['MarketId', 'local_user_id'],
		// 		include: [
		// 			{
		// 				model: Market,
		// 				attributes: ['db_name'],
		// 			},
		// 		],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// [err, localUser] = await to(
		// 	dbInstance[getUser.Market.db_name].User_master.findOne({
		// 		where: {
		// 			id: getUser.local_user_id,
		// 		},
		// 		attributes: ['first', 'last'],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// [err, clientData] = await to(
		// 	Client.findOne({
		// 		where: {
		// 			id: client.Associate_client_id,
		// 		},
		// 		attributes: ['name'],
		// 	})
		// );

		// const userName = `${localUser && localUser.first ? localUser.first : ''} ${
		// 	localUser && localUser.last ? localUser.last : ''
		// }`;
		let notifcationMessage = MESSAGE.Learner_Group_Created;
		notifcationMessage = notifcationMessage.replace('{{group_names}}', leanerGroupData.title);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'contact');
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'learner');
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Learner Group`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserGroupId: createUserGroup.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: learnerGroup,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createLearnerGroup = createLearnerGroup;

const updateLearnerGroup = async function (req, res) {
	try {
		// =========================
		// Selected Learner, Selected Job Role Id, Selected ClientId Validation
		// =========================
		const schema = Joi.object({
			selectAllFlag: Joi.boolean(), // Boolean flag to determine if all users are selected
			selectedUserIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer user IDs
			jobRoleIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer job role IDs
			clientIds: Joi.array().items(Joi.number().integer().positive()).required(), // Array of positive integer client IDs
		});

		// Validate the request body against the schema
		const { error, value } = schema.validate({
			selectedUserIds: req.body.selectedUserIds,
			selectAllFlag: req.body.selectAllFlag,
			jobRoleIds: req.body.jobRoleIds,
			clientIds: req.body.clientIds,
		});

		// If validation fails, return an error response
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		// Extract validated values
		const { selectAllFlag, selectedUserIds, jobRoleIds, clientIds } = value;

		// =========================
		// Learner Group Details Validation
		// =========================

		// Check if learnerGroupInfo is present in the request body
		if (!req.body.learnerGroupInfo) return ResponseError(res, { message: 'Learner Group Data Missing' }, 400);

		let leanerGroupData = req.body.learnerGroupInfo;

		const otherschema = Joi.object({
			id: Joi.number().integer().positive().required(), // Ensures that 'id' must be null (likely for new entries)
			title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(), // Title with min/max length validation
			description: Joi.string().trim().max(validationConstant.description.max).allow(null).allow(''), // Optional description with max length
			ClientId: Joi.number().integer().positive().required(), // Mandatory positive integer for ClientId
			RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(), // Mandatory positive integer for RoleId
			UserId: Joi.number().integer().positive().required(), // Mandatory positive integer for UserId
		});

		// Validate the learner group data
		const { error: error_1, value: value_1 } = otherschema.validate({
			id: leanerGroupData.id,
			title: leanerGroupData.title,
			description: leanerGroupData.description,
			ClientId: leanerGroupData.ClientId,
			RoleId: leanerGroupData.RoleId,
			UserId: leanerGroupData.UserId,
		});

		// If validation fails, return an error response
		if (error_1) return ResponseError(res, { message: error_1.details[0].message }, 400);

		// Assign the validated data back
		leanerGroupData = value_1;

		// =========================
		// Check Client Access
		// =========================

		// Ensure that the user has access to all specified client IDs
		if (clientIds?.length > 0) {
			for (let clientId of clientIds) {
				if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		}

		// Ensure that the user has access to the client ID in the learner group data
		if (leanerGroupData.ClientId) {
			if (!(await checkClientIdAccess(req.user.ClientId, leanerGroupData.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		let type = req.user.type;

		let learnerUserIds = selectedUserIds;
		let newLearnerIds = [];
		let learners;

		leanerGroupData.title = await capitalFirstLatter(leanerGroupData.title);
		leanerGroupData.userCount = learnerUserIds.length;

		[err, updateUserGroup] = await to(
			User_group.update(leanerGroupData, {
				where: {
					id: leanerGroupData.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get all Old User Data Data

		[err, oldLearnerGroup] = await to(
			User_group_mapping.findAll({
				where: {
					UserGroupId: leanerGroupData.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, addLearnerIntoGroup] = await to(
			User_group_mapping.destroy({
				where: {
					UserGroupId: leanerGroupData.id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (selectAllFlag) {
			if (jobRoleIds.length > 0) {
				if (type == 'drip') {
					[err, learners] = await to(
						User.findAll({
							where: {
								forDrip: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DripAccess: true,
									},
								},
								{
									model: Client_job_role,
									where: {
										id: jobRoleIds,
									},
								},
							],
							order: [['createdAt', 'desc']],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo') {
					[err, learners] = await to(
						User.findAll({
							where: {
								forDiwo: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DiwoAccess: true,
									},
								},
								{
									model: Client_job_role,
									where: {
										id: jobRoleIds,
									},
								},
							],
							order: [['createdAt', 'desc']],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else {
				if (type == 'drip') {
					[err, learners] = await to(
						User.findAndCountAll({
							where: {
								forDrip: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DripAccess: true,
									},
								},
								{
									model: Client_job_role,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo') {
					[err, learners] = await to(
						User.findAndCountAll({
							where: {
								forDiwo: true,
							},
							include: [
								{
									model: Market,
								},
								{
									model: Client,
									where: {
										id: clientIds,
										DiwoAccess: true,
									},
								},
								{
									model: Client_job_role,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}

			//Check Which user is newly added in this Group
			for (let learner of learners) {
				let flag = true;
				for (let oldLearner of oldLearnerGroup) {
					if (oldLearner.UserId == learner.id) {
						flag = false;
					}
				}
				if (flag) {
					newLearnerIds.push(learner.id);
				}
			}

			let finalData = [];
			for (let learner of learners) {
				let payload = {
					UserId: learner.id,
					UserGroupId: createUserGroup.id,
				};
				finalData.push(payload);
			}
			if (finalData && finalData.length > 0) {
				[err, addLearnerIntoGroup] = await to(User_group_mapping.bulkCreate(finalData));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else {
			//Check Which user is newly added in this Group
			if (oldLearnerGroup && oldLearnerGroup.length == 0 && learnerUserIds && learnerUserIds.length > 0) {
				newLearnerIds = learnerUserIds;
			} else {
				for (let learnerId of learnerUserIds) {
					let flag = true;
					for (let oldLearner of oldLearnerGroup) {
						if (oldLearner.UserId == learnerId) {
							flag = false;
						}
					}
					if (flag) {
						newLearnerIds.push(learnerId);
					}
				}
			}

			for (let learner of learnerUserIds) {
				let payload = {
					UserId: learner,
					UserGroupId: leanerGroupData.id,
				};

				[err, addLearnerIntoGroup] = await to(User_group_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (newLearnerIds && newLearnerIds.length > 0) {
			if (type == 'drip') {
				learnerAddedIntoGroupCampaignStartRule(leanerGroupData.id, newLearnerIds);
			}
		}

		[err, learnerGroup] = await to(
			User_group.findOne({
				where: {
					id: leanerGroupData.id,
				},
				include: [
					{
						model: User,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Notification
		let notifcationMessage = MESSAGE.Learner_Group_Update;
		notifcationMessage = notifcationMessage.replace('{{group_names}}', leanerGroupData.title);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'contact');
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'learner');
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Learner Group`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserGroupId: leanerGroupData.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: learnerGroup,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateLearnerGroup = updateLearnerGroup;

const getLearnerGroupNameByUserId = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: req.query.userId,
			roleId: req.query.roleId,
			clientId: req.query.clientId,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let userId = req.query.userId;
		// let roleId = req.query.roleId;
		// let clientId = req.query.clientId;
		let learner_;
		let learnerGroups;
		let list = [];

		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		if (type == 'drip') {
			[err, learnerGroups] = await to(
				User_group.findAll({
					where: {
						UserId: userId,
						is_deleted: false,
						RoleId: roleId,
						ClientId: clientId,
						forDrip: true,
					},
					attributes: ['id', 'title', 'is_deleted', 'description'],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, learnerGroups] = await to(
				User_group.findAll({
					where: {
						UserId: userId,
						is_deleted: false,
						RoleId: roleId,
						ClientId: clientId,
						forDiwo: true,
					},
					attributes: ['id', 'title', 'is_deleted', 'description'],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: list,
			count: learnerGroups.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupNameByUserId = getLearnerGroupNameByUserId;

const getLearnerGroupByUserId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit['250Max'])
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
		});
		const { error, value } = schema.validate({
			clientId: req.query.clientId,
			limit: req.query.limit,
			page: req.query.page,
			userId: req.query.userId,
			roleId: req.query.roleId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, userId, roleId } = value;

		const type = req.user.type;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_PROJECT_TYPE }, 400);
		}

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let learner_;
		let learnerGroups;
		let list = [];
		let offset = 0;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		offset = (page - 1) * limit;

		if (type == 'drip') {
			[err, learnerGroups] = await to(
				User_group.findAndCountAll({
					where: {
						UserId: userId,
						is_deleted: false,
						RoleId: roleId,
						ClientId: clientId,
						forDrip: true,
					},
					offset: offset,
					limit: limit,
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, learnerGroups] = await to(
				User_group.findAndCountAll({
					where: {
						UserId: userId,
						is_deleted: false,
						RoleId: roleId,
						ClientId: clientId,
						forDiwo: true,
					},
					offset: offset,
					limit: limit,
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		for (let learner of learnerGroups.rows) {
			learner_ = learner.convertToJSON();
			list.push(learner_);
		}
		return ResponseSuccess(res, {
			data: list,
			count: learnerGroups.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupByUserId = getLearnerGroupByUserId;

const getLearnerGroupByUserIdforCampaign = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			forCampaignTest_: Joi.boolean().optional(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit['250Max'])
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
		});

		const { error, value } = schema.validate({
			clientId: req.query.clientId,
			forCampaignTest_: req.query.forCampaignTest,
			limit: req.query.limit,
			page: req.query.page,
			userId: req.query.userId,
			roleId: req.query.roleId,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { clientId, forCampaignTest_, limit, page } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// const clientId = req.query.clientId;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);
		let forCampaignTest = forCampaignTest_ ? true : false;
		let learner_;
		let learnerGroups;
		let list = [];
		let offset = 0;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (page != NaN && page >= 1) offset = (page - 1) * limit;
		// }

		offset = (page - 1) * limit;

		let whereCondition = {
			is_deleted: false,
			ClientId: allSubClientIds,
			forDrip: true,
		};

		if (forCampaignTest) {
			whereCondition.userCount = {
				[Op.gt]: 0,
				[Op.lte]: 10,
			};
		}

		[err, learnerGroups] = await to(
			User_group.findAll({
				distinct: true,
				where: whereCondition,
				offset: offset,
				limit: limit,
				order: [
					['defaultGroupForDrip', 'DESC'],
					['defaultGroupForDiwo', 'DESC'],
					['id', 'DESC'],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let learner of learnerGroups) {
			learner_ = learner.convertToJSON();
			learner_.title = learner_.title + ' (' + learner_.userCount + ')';
			list.push(learner_);
		}

		//Get Channel Details
		// let query = `SELECT DISTINCT ON ("TeamChannels".id)
		// 			"TeamChannels".id,
		// 			"TeamChannels".title,
		// 			--"TeamChannels".channel_id,
		// 			--"TeamChannels".team_id,
		// 			"TeamChannels"."TeamSetupId"
		// 		FROM "ClientTeamSetups"
		// 		JOIN "TeamSetups" ON "ClientTeamSetups"."TeamSetupId" = "TeamSetups".id
		// 		JOIN "Clients" ON "ClientTeamSetups"."ClientId" = "Clients".id
		// 		JOIN "TeamChannels" ON "TeamSetups".id = "TeamChannels"."TeamSetupId"
		// 		WHERE "ClientTeamSetups"."ClientId" IN (${allSubClientIds.toString()})
		// 		ORDER BY "TeamChannels".id, "TeamSetups".id;`;

		// [data] = await sequelize.query(query);

		const query = `
			SELECT DISTINCT ON ("TeamChannels".id)
				"TeamChannels".id,
				"TeamChannels".title,
				"TeamChannels"."TeamSetupId"
			FROM "ClientTeamSetups"
			JOIN "TeamSetups" ON "ClientTeamSetups"."TeamSetupId" = "TeamSetups".id
			JOIN "Clients" ON "ClientTeamSetups"."ClientId" = "Clients".id
			JOIN "TeamChannels" ON "TeamSetups".id = "TeamChannels"."TeamSetupId"
			WHERE "ClientTeamSetups"."ClientId" IN (:allSubClientIds)
			ORDER BY "TeamChannels".id, "TeamSetups".id;
		`;

		let data = await sequelize.query(query, {
			replacements: { allSubClientIds },
			type: sequelize.QueryTypes.SELECT,
		});

		if (data.length > 0) {
			for (let channel of data) {
				channel.isChannel = true;
				channel.defaultGroupForDiwo = false;
				channel.defaultGroupForDrip = false;
				channel.is_deleted = false;
				list.push(channel);
			}
		}

		return ResponseSuccess(res, {
			data: list,
			count: list.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupByUserIdforCampaign = getLearnerGroupByUserIdforCampaign;

const getLearnerGroupForWorkbookByUserId = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: req.query.userId,
			roleId: req.query.roleId,
			clientId: req.query.clientId,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let userId = req.query.userId;
		// let roleId = req.query.roleId;
		// let clientId = req.query.clientId;

		let learner_;
		let learnerGroups;
		let list = [];

		let type = req.query.type;

		[err, learnerGroups] = await to(
			User_group.findAll({
				where: {
					UserId: userId,
					is_deleted: false,
					RoleId: roleId,
					ClientId: clientId,
					forDiwo: true,
				},
				include: [
					{
						model: User,
						through: 'User_group_mapping',
						include: [
							{
								model: Client_job_role,
								through: 'User_job_role_mapping',
								required: false,
							},
						],
						where: {
							forDiwo: true,
						},
					},
				],
				order: [['createdAt', 'desc']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		for (let learner of learnerGroups) {
			learner_ = learner.convertToJSON();
			learner_.job_role = [];
			for (let user of learner.Users) {
				if (user && user.Client_job_roles && user.Client_job_roles.length > 0) {
					for (let role of user.Client_job_roles) {
						if (learner_.job_role.indexOf(role.job_role_name) == -1) {
							learner_.job_role.push(role.job_role_name);
						}
					}
				}
			}
			learner_.job_role = learner_.job_role.toString();
			if (learner_ && learner_.Users && learner_.Users.length > 0) {
				learner_.count = learner_.Users.length;
			} else {
				learner_.count = 0;
			}
			list.push(learner_);
		}

		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupForWorkbookByUserId = getLearnerGroupForWorkbookByUserId;

const deleteLearnerUserGroup = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			learnerGroupIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			learnerGroupIds: req.body,
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, learnerGroupIds } = value;

		// let userId = req.params.userId;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		// let learnerGroupId = req.body;

		[err, learnerGroups] = await to(
			User_group.update(
				{
					is_deleted: true,
				},
				{
					where: {
						UserId: userId,
						id: learnerGroupIds,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, getLearnerGroupDetail] = await to(
			User_group.findAll({
				where: {
					UserId: userId,
					id: learnerGroupIds,
				},
				attributes: ['title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let AllLearnerGroupNames = [];
		for (let group of getLearnerGroupDetail) {
			AllLearnerGroupNames.push(group.title);
		}
		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
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

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// [err, clientData] = await to(
		// 	Client.findOne({
		// 		where: {
		// 			id: client.Associate_client_id,
		// 		},
		// 		attributes: ['name'],
		// 	})
		// );

		const userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.Learner_Group_Deleted;
		notifcationMessage = notifcationMessage.replace('{{group_names}}', AllLearnerGroupNames.toString());
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		if (type == 'drip') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'contact');
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
		} else if (type == 'diwo') {
			notifcationMessage = notifcationMessage.replace('{{type}}', 'learner');
			await createNotificationforDiwo(notifcationMessage, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Learner Group`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					UserGroupId: learnerGroupIds,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: type == 'drip' ? MESSAGE.CONTACT_GROUP_DELETED : MESSAGE.LEARNER_GROUP_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteLearnerUserGroup = deleteLearnerUserGroup;

const getLearnerGroup = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			groupId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			groupId: parseInt(req.params.learnerGroupId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, groupId } = value;

		// let userId = req.params.userId;
		// let groupId = req.params.learnerGroupId;

		let learnerGroup;
		[err, learnerGroup] = await to(
			User_group.findOne({
				where: {
					UserId: userId,
					is_deleted: false,
					id: groupId,
				},
				include: [
					{
						model: User,
						where: {
							is_deleted: false,
						},
						through: 'User_group_mapping',
						include: [
							{
								model: Market,
							},
							{
								model: Client,
							},
						],
						required: false,
					},
				],
				order: [
					[
						{
							model: User,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let marketList;
		[err, marketList] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['id', 'db_name'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let marketWiseData = [];
		for (let market of marketList) {
			marketWiseData.push({ ids: [[]], MarketId: market.id, db_name: market.db_name, finalData: [] });
		}

		if (learnerGroup && learnerGroup.Users && learnerGroup.Users.length > 0) {
			for (let user of learnerGroup.Users) {
				if (user.Market) {
					if (marketWiseData[user.Market.id - 1].ids[marketWiseData[user.Market.id - 1].ids.length - 1].length >= 200) {
						marketWiseData[user.Market.id - 1].ids.push([]);
					}
					marketWiseData[user.Market.id - 1].ids[marketWiseData[user.Market.id - 1].ids.length - 1].push(
						user.local_user_id
					);
				}
			}
		}

		for (let market of marketWiseData) {
			if (market.ids.length > 0) {
				for (let ids of market.ids) {
					if (ids.length == 0) {
						break;
					}
					let query = `SELECT id, "first", "email", "last", "phone", "imagePath", "city" FROM "User_masters" AS "User_master" WHERE "User_master"."id" IN (${ids.toString()}) ORDER BY "User_master"."id" DESC;`;
					let localUsers = await dbInstance[market.db_name].query(query);

					if (localUsers && localUsers[0].length > 0) {
						market.finalData = [...market.finalData, ...localUsers[0]];
					}
				}
			}
		}
		let LeanerUsers = [];
		if (learnerGroup?.Users && learnerGroup.Users.length > 0) {
			for (let learner of learnerGroup.Users) {
				let learnerUser = learner.convertToJSON();
				let localUser;
				// [err, localUser] = await to(
				// 	dbInstance[learnerUser.Market.db_name].User_master.findOne({
				// 		where: {
				// 			id: learnerUser.local_user_id,
				// 		},
				// 		attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
				// 	})
				// );
				// if (err) return ResponseError(res, err, 500, true);

				for (let i = 0; i < marketWiseData[learner.Market.id - 1].finalData.length; i++) {
					if (marketWiseData[learner.Market.id - 1].finalData[i].id == learner.local_user_id) {
						localUser = marketWiseData[learner.Market.id - 1].finalData[i];
						marketWiseData[learner.Market.id - 1].finalData.splice(i, 1);
						break;
					}
				}

				if (localUser) {
					learnerUser.first = localUser.first;
					learnerUser.last = localUser.last;
					learnerUser.email = localUser.email;
					learnerUser.phone = localUser.phone;
					learnerUser.imagePath = localUser.imagePath;
					learnerUser.city = localUser.city;
				}
				LeanerUsers.push(learnerUser);
			}
			learnerGroup = learnerGroup.convertToJSON();
			learnerGroup.Users = LeanerUsers;
		} else {
			learnerGroup.Users = [];
		}

		return ResponseSuccess(res, {
			data: learnerGroup,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroup = getLearnerGroup;

const getLearnerGroupDetials = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			groupId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			groupId: parseInt(req.params.learnerGroupId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, groupId } = value;

		// const userId = req.params.userId;
		// const groupId = req.params.learnerGroupId;

		[err, learnerGroup] = await to(
			User_group.findOne({
				where: {
					UserId: userId,
					is_deleted: false,
					id: groupId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (learnerGroup) {
			learnerGroup = learnerGroup.convertToJSON();
		}

		return ResponseSuccess(res, {
			data: learnerGroup,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLearnerGroupDetials = getLearnerGroupDetials;

const getAllSearchLearnerGroupByClientId = async function (req, res) {
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

		let searchKey = req.body.searchKey;
		let userId = req.user.id;
		// let clientId = req.query.clientId;
		let roleId = req.user.RoleId;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereCondition = [];
		let learner_;
		let learnerGroup_Id = [];
		let allData = [];
		let list = [];
		let learnerGroupsList;
		let UpdatedLearnerGroupId = [];
		let learnerGroups;
		let jobRoleDetails;
		// let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let offset = (page - 1) * limit;
		let response;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		// let type = req.params.type;
		// let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

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

		if (filterColumn.indexOf('title') > -1) {
			whereCondition.push({
				title: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (!isNaN(req.body.searchKey)) {
			if (filterColumn.indexOf('id') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereCondition.push({
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('jobroles') > -1) {
			let whereCondition = {
				UserId: userId,
				is_deleted: false,
				RoleId: roleId,
				ClientId: clientId,
				[Op.and]: dateCondition,
			};
			if (type == 'drip') {
				whereCondition.forDrip = true;
			} else if (type == 'diwo') {
				whereCondition.forDiwo = true;
			}

			[err, jobRoleDetails] = await to(
				User_group.findAll({
					where: whereCondition,
					include: [
						{
							model: User,
							through: 'User_group_mapping',
							required: true,
							include: [
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									where: {
										[Op.and]: [
											{
												job_role_name: {
													[sequelize.Op.iLike]: '%' + searchKey + '%',
												},
											},
											{
												job_role_name: {
													[sequelize.Op.ne]: null,
												},
											},
										],
									},
									required: true,
								},
							],
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (whereCondition && whereCondition.length > 0) {
			let whereCondition_ = {
				[sequelize.Op.or]: whereCondition,
				UserId: userId,
				is_deleted: false,
				RoleId: roleId,
				ClientId: clientId,
				[Op.and]: dateCondition,
			};
			if (type == 'drip') {
				whereCondition_.forDrip = true;
			} else if (type == 'diwo') {
				whereCondition_.forDiwo = true;
			}

			[err, learnerGroups] = await to(
				User_group.findAll({
					where: whereCondition_,
					include: [
						{
							model: User,
							through: 'User_group_mapping',
							include: [
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									required: false,
								},
							],
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (learnerGroups && learnerGroups.length > 0) {
			for (let learner_group of learnerGroups) {
				allData.push(learner_group);
			}
		}
		if (jobRoleDetails && jobRoleDetails.length > 0) {
			for (let job_details of jobRoleDetails) {
				let flag = true;
				for (let data of allData) {
					if (data.id == job_details.id) {
						flag = false;
					}
				}
				if (flag) {
					allData.push(job_details);
				}
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedLearnerGroupId.push(item_.id);
		}

		if (UpdatedLearnerGroupId && UpdatedLearnerGroupId.length > 0) {
			let whereCondition = {
				id: UpdatedLearnerGroupId,
			};
			if (type == 'drip') {
				whereCondition.forDrip = true;
			} else if (type == 'diwo') {
				whereCondition.forDiwo = true;
			}

			[err, learnerGroupsList] = await to(
				User_group.findAndCountAll({
					where: whereCondition,
					include: [
						{
							model: User,
							through: 'User_group_mapping',
							include: [
								{
									model: Client_job_role,
									through: 'User_job_role_mapping',
									required: false,
								},
							],
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'desc']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (learnerGroupsList && learnerGroupsList.rows && learnerGroupsList.rows.length > 0) {
			for (let workbook of learnerGroupsList.rows) {
				let workbook_ = workbook.convertToJSON();
				newList.push(workbook_);
			}
		}

		for (let learner of newList) {
			learner_ = learner;
			learner_.job_role = [];
			for (let user of learner.Users) {
				if (user && user.Client_job_roles && user.Client_job_roles.length > 0) {
					for (let role of user.Client_job_roles) {
						if (learner_.job_role.indexOf(role.job_role_name) == -1) {
							learner_.job_role.push(role.job_role_name);
						}
					}
				}
			}
			learner_.job_role = learner_.job_role.toString();
			if (learner_ && learner_.Users && learner_.Users.length > 0) {
				learner_.count = learner_.Users.length;
			} else {
				learner_.count = 0;
			}
			list.push(learner_);
		}
		let count;
		if (learnerGroupsList != undefined) {
			count = learnerGroupsList.count;
		} else {
			count = 0;
		}

		return ResponseSuccess(res, {
			data: list,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchLearnerGroupByClientId = getAllSearchLearnerGroupByClientId;

const getAllSearchLearnerByClientId = async function (req, res) {
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
		let err;
		let allUserData = [];
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClientsId = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let allSubClientIds = await getAllSubChildClientIds(parentClientId);
		allSubClientIds.push(parseInt(parentClientId));
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let finalClient = [];
		let userDetailId = [];
		let ClientsDetail;
		let UserDetail;
		let JobroleId = [];
		let Clients_Details;
		let Job_Details;
		// let selectedDate = req.body.selectedDate;
		let User_Details;
		let Learner_Job_Details;
		let dateCondition = [];
		let UpdatedClientId = [];
		let UpdatedUserId = [];
		let UpdatedRoleId = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		// let type = req.params.type;
		// let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		//seperate out custom Fields Column Values
		let keepValues = ['first', 'phone', 'parentname', 'jobrole', 'account_id', 'cStatus', 'opt_in'];
		let customFiledValues = filterColumn.filter((obj) => !keepValues.includes(obj));

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
			if (type == 'drip') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							name: {
								[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
							},
							id: allSubClientIds,
							is_deleted: false,
							DripAccess: true,
						},
						attributes: ['id'],
					})
				);
			} else if (type == 'diwo') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							name: {
								[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
							},
							id: allSubClientIds,
							is_deleted: false,
							DiwoAccess: true,
						},
						attributes: ['id'],
					})
				);
			}

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let Clients of ClientsDetail) {
					let UpdatedClients = Clients.convertToJSON();
					finalClient.push(UpdatedClients.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('account_id') || filterColumn.indexOf('cStatus') || filterColumn.indexOf('opt_in')) {
			let whereConditionForUser = [];
			if (filterColumn.indexOf('account_id') > -1) {
				whereConditionForUser.push({
					account_id: {
						[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
					},
				});
			}
			if (filterColumn.indexOf('cStatus') > -1) {
				let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
				let licensed = 'licensed';
				let Active = 'active';

				if (licensed.includes(key)) {
					whereConditionForUser.push({
						cStatus: {
							[sequelize.Op.iLike]: '%' + Active + '%',
						},
					});
				} else {
					whereConditionForUser.push({
						cStatus: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					});
				}
			}

			if (filterColumn.indexOf('opt_in') > -1) {
				let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
				let pending = 'pending';
				let optedin = 'opted in';
				let optedout = 'opted out';
				if (pending.includes(key)) {
					whereConditionForUser.push({
						opt_in: false,
						opt_out: false,
					});
				} else if (optedin.includes(key)) {
					whereConditionForUser.push({
						opt_in: true,
						opt_out: false,
					});
				} else if (optedout.includes(key)) {
					whereConditionForUser.push({
						opt_in: false,
						opt_out: true,
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

		//custom Field Search
		if (customFiledValues && customFiledValues.length > 0) {
			let customFieldQuery = '';
			for (let item of customFiledValues) {
				if (customFieldQuery == '') {
					customFieldQuery = `"User"."customFields"->> '${item}'  LIKE '%${searchKey}%'`;
				} else {
					customFieldQuery = customFieldQuery + ` OR "User"."customFields"->> '${item}' LIKE '%${searchKey}%'`;
				}
			}

			// console.log('customFieldQuery', customFieldQuery);

			if (type == 'drip') {
				let whereCondition = { forDrip: true };
				whereCondition.customFields = sequelize.literal(customFieldQuery);

				[err, UserDetail] = await to(
					User.findAll({
						where: whereCondition,
						attributes: ['id'],
					})
				);
			} else if (type == 'diwo') {
				let whereCondition = { forDiwo: true };
				whereCondition.customFieldQuery = sequelize.literal(customFieldQuery);
				[err, UserDetail] = await to(
					User.findAll({
						where: whereCondition,
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

		if (filterColumn.indexOf('jobrole') > -1) {
			[err, JobRoleDetail] = await to(
				Client_job_role.findAll({
					where: {
						job_role_name: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
				})
			);

			if (JobRoleDetail && JobRoleDetail.length > 0) {
				for (let Jobrole of JobRoleDetail) {
					let updatedJobrole = Jobrole.convertToJSON();
					JobroleId.push(updatedJobrole.id);
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

		if (
			filterColumn.indexOf('first') > -1 ||
			filterColumn.indexOf('phone') > -1 ||
			filterColumn.indexOf('email') > -1
		) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();

					if (filterColumn.indexOf('first') > -1) {
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
									isDeleted: false,
								},
							})
						);

						if (err) return ResponseError(res, err, 500, true);
					}

					if (filterColumn.indexOf('phone') > -1) {
						[err, localUserPhone] = await to(
							dbInstance[marketUser.db_name].User_master.findAll({
								where: {
									[sequelize.Op.or]: {
										phone: {
											[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
										},
									},
									isDeleted: false,
								},
							})
						);

						if (err) return ResponseError(res, err, 500, true);
					}

					if (filterColumn.indexOf('email') > -1) {
						[err, localUser] = await to(
							dbInstance[marketUser.db_name].User_master.findAll({
								where: {
									[sequelize.Op.or]: {
										email: {
											[sequelize.Op.iLike]: '%' + searchKey[0] + '%',
										},
									},
									isDeleted: false,
								},
							})
						);

						if (err) return ResponseError(res, err, 500, true);
					}

					let LocalUserId = [];

					if (localUser && localUser.length > 0) {
						for (let User of localUser) {
							LocalUserId.push(User.id);
						}
					}

					if (localUserPhone && localUserPhone.length > 0) {
						for (let User of localUserPhone) {
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

		if (err) return ResponseError(res, err, 500, true);

		if (ClientsDetail && ClientsDetail.length > 0) {
			if (type == 'drip') {
				[err, Clients_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: finalClient,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},

							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			} else if (type == 'diwo') {
				[err, Clients_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: finalClient,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},

							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
									},
									diwoRole: true,
								},
							},
							{
								model: Client,
								where: {
									id: finalArrayOfClientsId,
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
			}
		}

		if (userDetailId && userDetailId.length > 0) {
			if (type == 'drip') {
				[err, User_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			} else if (type == 'diwo') {
				[err, User_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			}
		}

		if (JobroleId && JobroleId.length > 0) {
			if (type == 'drip') {
				[err, Job_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							RoleId: 1,
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
									{
										model: Client_job_role,
										where: {
											id: JobroleId,
										},
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			} else if (type == 'diwo') {
				[err, Job_Details] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: allSubClientIds,
							RoleId: 1,
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
									{
										model: Client_job_role,
										where: {
											id: JobroleId,
										},
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			}
		}
		if (err) return ResponseError(res, err, 500, true);

		if (Clients_Details && Clients_Details.length > 0) {
			for (let clients_detail of Clients_Details) {
				allUserData.push(clients_detail);
			}
		}

		if (Job_Details && Job_Details.length > 0) {
			for (let job_details of Job_Details) {
				let flag = true;
				for (let data of allUserData) {
					if (
						data.User.Client_job_roles.id == job_details.User.Client_job_roles.id &&
						data.User.id == job_details.User.id
					) {
						flag = false;
					}
				}
				if (flag) {
					allUserData.push(job_details);
				}
			}
		}

		if (User_Details && User_Details.length > 0) {
			for (let user_details of User_Details) {
				let flag = true;
				for (let data of allUserData) {
					if (data.User.id == user_details.User.id) {
						flag = false;
					}
				}
				if (flag) {
					allUserData.push(user_details);
				}
			}
		}

		for (let item of allUserData) {
			let item_ = item.convertToJSON();
			UpdatedClientId.push(item_.Client.id);
			UpdatedUserId.push(item_.User.id);
			UpdatedRoleId.push(item_.Role.id);
		}

		if (allUserData && allUserData.length > 0) {
			if (type == 'drip') {
				[err, Learner_Job_Details] = await to(
					User_role_client_mapping.findAndCountAll({
						distinct: true,
						subQuery: false,
						where: {
							UserId: UpdatedUserId,
							ClientId: UpdatedClientId,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			} else if (type == 'diwo') {
				[err, Learner_Job_Details] = await to(
					User_role_client_mapping.findAndCountAll({
						distinct: true,
						subQuery: false,
						where: {
							UserId: UpdatedUserId,
							ClientId: UpdatedClientId,
							RoleId: 1,
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
									{
										model: Client_job_role,
									},
								],
							},
							{
								model: Role,
								where: {
									id: {
										[Op.eq]: 1,
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
			}
		}
		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (Learner_Job_Details && Learner_Job_Details.rows && Learner_Job_Details.rows.length > 0) {
			for (let job_Details of Learner_Job_Details.rows) {
				let job_Details_ = job_Details.convertToJSON();
				newList.push(job_Details_);
			}
		}

		let allRecords = [];
		if (newList && newList.length > 0) {
			for (let allUser of newList) {
				let userDetail = allUser;
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode', 'username'],
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
					userDetail.User.state = localUser.state;
					userDetail.User.zipCode = localUser.zipCode;
					userDetail.User.username = localUser.username;
				}
				allRecords.push(userDetail);
			}
		}

		let count;
		if (Learner_Job_Details != undefined) {
			count = Learner_Job_Details.count;
		} else {
			count = 0;
		}
		//Check Client Have Team Setup Or Not
		[err, checkTeamSetup] = await to(
			ClientTeamSetup.findOne({
				where: {
					ClientId: req.user.ClientId,
				},
				attributes: ['id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: allRecords,
			count: count,
			haveTeamSetup: checkTeamSetup ? true : false,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchLearnerByClientId = getAllSearchLearnerByClientId;

const getCheckUploadedLearnerData = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			roleId: parseInt(req.params.roleId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let roleId = req.params.roleId;
		// let userId = req.params.userId;
		// let clientId = req.params.clientId;
		// let type = req.params.type;

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let whereCondition = {
			RoleId: roleId,
			UserId: userId,
			ClientId: clientId,
		};
		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}
		[err, UploadLearnerDetail] = await to(
			Upload_learner.findAll({
				where: whereCondition,
				attributes: ['id'],
			})
		);
		let status;
		if (UploadLearnerDetail && UploadLearnerDetail.length > 0) {
			status = true;
		} else {
			status = false;
		}
		return ResponseSuccess(res, {
			status: status,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCheckUploadedLearnerData = getCheckUploadedLearnerData;

const getCheckNotificationReportData = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			roleId: parseInt(req.params.roleId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let roleId = req.params.roleId;
		// let userId = req.params.userId;
		// let clientId = req.params.clientId;
		// let type = req.params.type;

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let uploadLearner = false;
		let updateLearner = false;
		let onlyWhatsApp = false;
		let WhatsAppWithDrip = false;
		let emailWithDrip = false;
		let onlyDrip = false;
		let uploadedLink = false;

		let whereCondition = {
			RoleId: roleId,
			UserId: userId,
			ClientId: clientId,
		};
		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		//Upload Learner
		[err, UploadLearnerDetail] = await to(
			Upload_learner.count({
				where: whereCondition,
			})
		);

		if (UploadLearnerDetail > 0) {
			uploadLearner = true;
		}

		//Update Learner
		[err, UpdateLearnerDetail] = await to(
			Update_learner.count({
				where: whereCondition,
			})
		);

		if (UpdateLearnerDetail > 0) {
			updateLearner = true;
		}

		if (type == 'drip') {
			delete whereCondition.forDrip;
		} else if (type == 'diwo') {
			delete whereCondition.forDiwo;
		}

		//Only WhatsApp
		[err, OnlyOnWhatsApp] = await to(
			UplodedOnlyOnWhatsapp.count({
				where: whereCondition,
			})
		);

		if (OnlyOnWhatsApp > 0) {
			onlyWhatsApp = true;
		}

		//Whats App With Drip
		[err, WhatsAppWithDrip_] = await to(
			UplodedDripAppWhatsapp.count({
				where: whereCondition,
			})
		);

		if (WhatsAppWithDrip_ > 0) {
			WhatsAppWithDrip = true;
		}

		//Email App With Drip
		[err, EmailWithDrip] = await to(
			UplodedDripAppEmail.count({
				where: whereCondition,
			})
		);

		if (EmailWithDrip > 0) {
			emailWithDrip = true;
		}

		//Only Drip
		[err, OnlyDrip] = await to(
			UplodedOnlyOnDripApp.count({
				where: whereCondition,
			})
		);

		if (OnlyDrip > 0) {
			onlyDrip = true;
		}

		delete whereCondition.RoleId;

		//Bulk Link Upload
		[err, UploadedLink] = await to(
			UplodedLinkAsset.count({
				where: whereCondition,
			})
		);

		if (UploadedLink > 0) {
			uploadedLink = true;
		}

		let payload = {
			uploadLearner: uploadLearner,
			updateLearner: updateLearner,
			onlyWhatsApp: onlyWhatsApp,
			onlyDrip: onlyDrip,
			WhatsAppWithDrip: WhatsAppWithDrip,
			emailWithDrip: emailWithDrip,
			uploadedLink: uploadedLink,
		};
		return ResponseSuccess(res, { data: payload });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCheckNotificationReportData = getCheckNotificationReportData;

const downloadUploadedLearnerData = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			roleId: parseInt(req.params.roleId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// const roleId = req.params.roleId;
		// const userId = req.params.userId;
		// const clientId = req.params.clientId;
		// let type = req.params.type;

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let data = [];
		let whereCondition = {
			RoleId: roleId,
			UserId: userId,
			ClientId: clientId,
		};
		if (type == 'drip') {
			whereCondition.forDrip = true;
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
		}
		[err, downloadLearnerDetail] = await to(
			Upload_learner.findAll({
				where: whereCondition,
				attributes: [
					'srNo',
					'first',
					'last',
					'email',
					'phone',
					'username',
					'country',
					'state',
					'city',
					'zipCode',
					'Client_Id',
					'jobrole',
					'isCreated',
					'errorMsg',
					'emailError',
					'PhoneError',
					'UsernameError',
					'createdAt',
					'customFields',
				],
				order: [['createdAt', 'DESC']],
			})
		);

		if (downloadLearnerDetail && downloadLearnerDetail.length > 0) {
			for (let item of downloadLearnerDetail) {
				data.push(item.convertToJSON());
			}
		}

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadUploadedLearnerData = downloadUploadedLearnerData;

const downloadUpdateedLearnerData = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
			roleId: parseInt(req.params.roleId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId, roleId, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// const roleId = req.params.roleId;
		// const userId = req.params.userId;
		// const clientId = req.params.clientId;
		// let type = req.params.type;

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let data = [];
		let learner_Data;
		let whereCondition = {
			RoleId: roleId,
			UserId: userId,
			ClientId: clientId,
		};
		let typeForQuery = '';
		if (type == 'drip') {
			whereCondition.forDrip = true;
			typeForQuery = 'forDrip';
		} else if (type == 'diwo') {
			whereCondition.forDiwo = true;
			typeForQuery = 'forDiwo';
		}
		[err, downloadLearnerDetail] = await to(
			Update_learner.findAll({
				where: whereCondition,
				order: [['createdAt', 'DESC']],
			})
		);

		if (downloadLearnerDetail && downloadLearnerDetail.length > 0) {
			for (let item of downloadLearnerDetail) {
				learner_Data = item.convertToJSON();
				// let query = `SELECT ARRAY(SELECT "User_group"."id"
				// FROM "User_groups" AS "User_group"
				// 		 INNER JOIN ( "User_group_mappings" AS "Users->User_group_mapping" INNER JOIN "Users" AS "Users" ON "Users"."id" = "Users->User_group_mapping"."UserId")
				// 					ON "User_group"."id" = "Users->User_group_mapping"."UserGroupId" AND "Users"."account_id" = '${learner_Data.learnerId}'
				// WHERE "User_group"."is_deleted" = false
				//   AND "User_group"."${typeForQuery}" = true);`;
				// [ids] = await sequelize.query(query);

				learner_Data.learnerGroupIds = item.groupIds;
				data.push(learner_Data);
			}
		}

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadUpdateedLearnerData = downloadUpdateedLearnerData;

let upload_update_learner_schedulor = schedule.scheduleJob('30 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>> Destroy Bulk Uploaded Status', fireDate);

	checkUploadAndUpdateLearnerDataStatus();
});
module.exports.upload_update_learner_schedulor = upload_update_learner_schedulor;

const checkUploadAndUpdateLearnerDataStatus = async function () {
	const sevenDaysBefore = moment().subtract(7, 'days');
	[err, upload_details] = await to(
		Upload_learner.destroy({
			where: {
				createdAt: {
					[Op.lte]: sevenDaysBefore,
				},
			},
		})
	);
	if (err) {
		console.log('-----destroys record before 8 days---', err);
	}

	[err, update_details] = await to(
		Update_learner.destroy({
			where: {
				createdAt: {
					[Op.lte]: sevenDaysBefore,
				},
			},
		})
	);
	if (err) {
		console.log('-----destroys record before 8 days---', err);
	}
};

const optinSelectedUser = async function (req, res) {
	try {
		const schema = Joi.object({
			Users: Joi.array()
				.items(
					Joi.object({
						UserId: Joi.number().integer().positive().required(),
						RoleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
						ClientId: Joi.number().integer().positive().required(),
						Status: Joi.string().required(),
						forDrip: Joi.boolean().required(),
						forDiwo: Joi.boolean().required(),
					})
				)
				.required(),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// let userDetails = req.body.Users;
		let userIds = [];
		for (let user of value.Users) {
			userIds.push(user.UserId);
		}

		if (userIds.length > 0) {
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
							id: userIds,
							status: true,
							is_deleted: false,
							cStatus: 'Active',
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.CONTACT_OPT_IN,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.optinSelectedUser = optinSelectedUser;

const getAllSearchLearnerByClientIdAndJobRoleId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
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
			clientIds: req.body.clientIds,
			limit: req.query.limit,
			page: req.query.page,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientIds, limit, page } = value;

		if (clientIds?.length > 0) {
			for (let clientId of clientIds) {
				if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
					return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
				}
			}
		}

		let err, learners;
		// let clientIds = req.body.clientIds;
		let searchKey = req.params.searchKey.split(' ');
		let offset = 0;
		offset = (page - 1) * limit;

		// let limit = req.query.limit;
		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let userDetailId = [];

		// if (limit == 'all') {
		// 	offset = undefined;
		// 	limit = undefined;
		// } else {
		// 	if (req.query.page != NaN && req.query.page >= 1) offset = (parseInt(req.query.page) - 1) * limit;
		// }

		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (MarketDetails && MarketDetails.length > 0) {
			for (let market of MarketDetails) {
				let marketUser = market.convertToJSON();
				[err, localUser] = await to(
					dbInstance[marketUser.db_name].User_master.findAll({
						where: {
							[sequelize.Op.or]: {
								first: {
									[sequelize.Op.iLike]: searchKey[0] + '%',
								},
								last: {
									[sequelize.Op.iLike]: searchKey[1] + '%',
								},
								email: {
									[sequelize.Op.iLike]: '%' + searchKey + '%',
								},
								phone: {
									[sequelize.Op.iLike]: '%' + searchKey + '%',
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
				}

				if (UserDetail && UserDetail.length > 0) {
					for (let User of UserDetail) {
						userDetailId.push(User.id);
					}
				}
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		[err, userAccountId] = await to(
			User.findAll({
				where: {
					account_id: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (userAccountId && userAccountId.length > 0) {
			for (let User of userAccountId) {
				userDetailId.push(User.id);
			}
		}

		[err, client_details] = await to(
			Client.findAll({
				where: {
					name: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				},
				include: [
					{
						model: User,
						through: 'User_role_client_mapping',
					},
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		if (client_details && client_details.length > 0) {
			for (let client of client_details) {
				let client_detail = client.convertToJSON();
				for (let user of client_detail.Users) {
					userDetailId.push(user.id);
				}
			}
		}

		if (type == 'drip') {
			[err, learners] = await to(
				User.findAndCountAll({
					where: {
						cStatus: 'Active',
						forDrip: true,
						id: userDetailId,
					},
					include: [
						{
							model: Market,
						},
						{
							model: Client,
							where: {
								id: clientIds,
								DripAccess: true,
							},
						},
						{
							model: Client_job_role,
							where: {
								forDrip: true,
							},
							required: false,
						},
						{
							model: Role,
							where: {
								id: 1,
							},
							through: 'User_role_client_mapping',
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, learners] = await to(
				User.findAndCountAll({
					where: {
						cStatus: 'Active',
						forDiwo: true,
						id: userDetailId,
					},
					include: [
						{
							model: Market,
						},
						{
							model: Client,
							where: {
								id: clientIds,
								DiwoAccess: true,
							},
						},
						{
							model: Client_job_role,
							where: {
								forDiwo: true,
							},
							required: false,
						},
						{
							model: Role,
							where: {
								id: 1,
							},
							through: 'User_role_client_mapping',
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let finalLearnerList = [];

		for (let learner of learners.rows) {
			let learnerUser = learner.convertToJSON();

			[err, localUser] = await to(
				dbInstance[learnerUser.Market.db_name].User_master.findOne({
					where: {
						id: learnerUser.local_user_id,
					},
					attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				learnerUser.first = localUser.first;
				learnerUser.last = localUser.last;
				learnerUser.email = localUser.email;
				learnerUser.phone = localUser.phone;
				learnerUser.imagePath = localUser.imagePath;
				learnerUser.city = localUser.city;
			}
			finalLearnerList.push(learnerUser);
		}

		return ResponseSuccess(res, {
			data: finalLearnerList,
			count: learners.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchLearnerByClientIdAndJobRoleId = getAllSearchLearnerByClientIdAndJobRoleId;

const downloadAllLearnersByClient = async function (req, res) {
	try {
		// Validate request parameters
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			learnerId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit['10000Max'])
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});
		const { error, value } = schema.validate({
			clientId: req.user.ClientId,
			learnerId: req.user.id,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, learnerId } = value;

		//Check Learner ClientId and User ClientId

		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let allUserData, err;
		let allData = [];
		let parentClientId = clientId;
		let userId = req.user.id;

		//Get All Under Client and Branch Accounts
		let allSubClientIds = await getAllSubClientAndBranchAccountLists(parentClientId, false);

		//Get Custom Fields
		let customFields = await getAccountCustomField(parentClientId, type);

		let offset = 0;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		if (limit == 'all') {
			offset = undefined;
			limit = undefined;
		} else {
			if (page != NaN && page >= 1) offset = (page - 1) * limit;
		}

		[err, marketList] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['id', 'db_name'],
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let data of allSubClientIds) {
			if (type == 'drip') {
				[err, allUserData] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: data,
							RoleId: 1,
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
										attributes: ['id', 'db_name'],
									},
									{
										model: Client_job_role,
										where: {
											forDrip: true,
										},
										required: false,
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
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, allUserData] = await to(
					User_role_client_mapping.findAll({
						where: {
							ClientId: data,
							RoleId: 1,
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
										attributes: ['id', 'db_name'],
									},
									{
										model: Client_job_role,
										where: {
											forDiwo: true,
										},
										required: false,
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
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
						// order: [
						// 	[
						// 		{
						// 			model: User,
						// 		},
						// 		'createdAt',
						// 		'DESC',
						// 	],
						// ],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
			if (allUserData && allUserData.length > 0) {
				//find All Market

				let marketWiseData = [];
				for (let market of marketList) {
					marketWiseData.push({ ids: [[]], MarketId: market.id, db_name: market.db_name, finalData: [] });
				}
				for (let user of allUserData) {
					if (user.User.Market) {
						if (
							marketWiseData[user.User.Market.id - 1].ids[marketWiseData[user.User.Market.id - 1].ids.length - 1]
								.length >= 100
						) {
							marketWiseData[user.User.Market.id - 1].ids.push([]);
						}
						marketWiseData[user.User.Market.id - 1].ids[marketWiseData[user.User.Market.id - 1].ids.length - 1].push(
							user.User.local_user_id
						);
					}
				}

				for (let market of marketWiseData) {
					if (market.ids.length > 0) {
						for (let ids of market.ids) {
							if (ids.length == 0) {
								break;
							}
							let query = `SELECT id, "first", "email", "last", "phone", "username", "imagePath", "city", "state", "zipCode" FROM "User_masters" AS "User_master" WHERE "User_master"."id" IN (${ids.toString()}) ORDER BY "User_master"."id" DESC;`;
							let localUsers = await dbInstance[market.db_name].query(query);

							if (localUsers && localUsers[0].length > 0) {
								market.finalData = [...market.finalData, ...localUsers[0]];
							}
						}
					}
				}

				for (let allUser of allUserData) {
					let userDetail = allUser.convertToJSON();

					let localUser;
					for (let i = 0; i < marketWiseData[allUser.User.Market.id - 1].finalData.length; i++) {
						if (marketWiseData[allUser.User.Market.id - 1].finalData[i].id == allUser.User.local_user_id) {
							localUser = marketWiseData[allUser.User.Market.id - 1].finalData[i];
							marketWiseData[allUser.User.Market.id - 1].finalData.splice(i, 1);
							break;
						}
					}

					if (localUser) {
						userDetail.User.first = localUser.first;
						userDetail.User.last = localUser.last;
						userDetail.User.email = localUser.email;
						userDetail.User.phone = localUser.phone;
						userDetail.User.imagePath = localUser.imagePath;
						userDetail.User.city = localUser.city;
						userDetail.User.state = localUser.state;
						userDetail.User.zipCode = localUser.zipCode;

						if (config_feature?.configurable_feature?.pwa_username) {
							userDetail.User.username = localUser.username;
						}
					}

					if (userDetail.User.customFields == null) {
						userDetail.User.customFields = {};
					}
					let typeForQuery;
					if (type == 'drip') {
						typeForQuery = 'forDrip';
					} else if (type == 'diwo') {
						typeForQuery = 'forDiwo';
					}

					// if (userDetail.Client && userDetail.Client.customFields && userDetail.Client.customFields.length > 0) {
					// 	ClientCustomFields = userDetail.Client.customFields;
					// }

					if (customFields.length > 0) {
						for (let field of customFields) {
							if (!field.isHide) {
								if (userDetail.User.customFields && field.label in userDetail.User.customFields) {
									// userDetail.User.customFields[field.label] = userDetail.User.customFields[field.label];
								} else {
									userDetail.User.customFields[field.label] = '';
								}
							} else if (userDetail.User.customFields && field.label in userDetail.User.customFields) {
								delete userDetail.User.customFields[field.label];
							}
						}
					}
					//Add Custom Fields
					//Check already present or nor in the user if not then add empty Custom Fields

					// let query = `SELECT ARRAY(SELECT "User_group"."id"
					// FROM "User_groups" AS "User_group"
					// 		 INNER JOIN ( "User_group_mappings" AS "Users->User_group_mapping" INNER JOIN "Users" AS "Users" ON "Users"."id" = "Users->User_group_mapping"."UserId")
					// 					ON "User_group"."id" = "Users->User_group_mapping"."UserGroupId" AND "Users"."id" = ${userDetail.User.id}
					// WHERE "User_group"."is_deleted" = false
					//   AND "User_group"."${typeForQuery}" = true  AND "User_group"."ClientId" = :clientId AND "User_group"."UserId" = :learnerId);`;

					// // [ids] = await sequelize.query(query);

					// const ids = await sequelize.query(query, {
					// 	replacements: { clientId: parentClientId, learnerId: userId, userId: userDetail.User.id },
					// 	type: Sequelize.QueryTypes.SELECT,
					// });

					const query = `
						SELECT ARRAY(
							SELECT "User_group"."id"
							FROM "User_groups" AS "User_group"
							INNER JOIN (
								"User_group_mappings" AS "Users->User_group_mapping"
								INNER JOIN "Users" AS "Users" 
								ON "Users"."id" = "Users->User_group_mapping"."UserId"
							)
							ON "User_group"."id" = "Users->User_group_mapping"."UserGroupId" 
							AND "Users"."id" = :userId
							WHERE "User_group"."is_deleted" = false
							AND "User_group"."ClientId" = :clientId
							AND "User_group"."UserId" = :learnerId
							AND "User_group"."${typeForQuery}"= true
						); `;

					ids = await sequelize.query(query, {
						replacements: {
							userId: userDetail.User.id,
							clientId: clientId,
							learnerId: learnerId,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					userDetail.learnerGroupIds = ids[0].array.join(', ');

					allData.push(userDetail);
				}
			}
		}
		return ResponseSuccess(res, {
			data: allData,
			count: allData.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadAllLearnersByClient = downloadAllLearnersByClient;

const transeferLearnerGroupToAnotherUser = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			userId: Joi.number().integer().positive().required(),
			learnerGroupId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.body.clientId),
			roleId: parseInt(req.body.roleId),
			userId: parseInt(req.body.userId),
			learnerGroupId: parseInt(req.body.groupId),
		});

		if (error) {
			return res.status(400).json({ error: error.details });
		}

		const { clientId, roleId, userId, learnerGroupId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let type = req.user.type;

		// Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		let updateData = { UserId: userId, RoleId: roleId, ClientId: clientId };
		let whereCondition = { id: learnerGroupId };

		if (type === 'drip') {
			whereCondition.forDrip = true;
		} else if (type === 'diwo') {
			whereCondition.forDiwo = true;
		}

		const [err, learnerGroups] = await to(User_group.update(updateData, { where: whereCondition }));

		if (err) {
			return ResponseError(res, err, 500, true);
		}

		const successMessage = type === 'drip' ? MESSAGE.CONTACT_LEARNER_GROUP : MESSAGE.TRANSFER_LEARNER_GROUP;

		return ResponseSuccess(res, { message: successMessage });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.transeferLearnerGroupToAnotherUser = transeferLearnerGroupToAnotherUser;

//Check for duplicate learner details before adding them to the system.
const checkDuplicateLearnerDetails = async function (tringToAddClientId, userInfo, type) {
	try {
		let tryToAddClientIds = parseInt(tringToAddClientId);
		let addingNewLearnerCilentAccountId;
		let totleClientCount;
		let duplicateLearnerLocaldataIds = [];
		let dulicateUserIds = [];
		let presentClientIds = [];
		let whereCondition;

		// Set up condition based on provided user info
		// if (
		// 	userInfo.email != null &&
		// 	userInfo.email != '' &&
		// 	userInfo.phone != null &&
		// 	userInfo.phone != '' &&
		// 	userInfo.username != null &&
		// 	userInfo.username != ''
		// ) {
		// 	whereCondition = {
		// 		[sequelize.Op.or]: {
		// 			email: userInfo.email,
		// 			phone: userInfo.phone,
		// 			username: userInfo.username,
		// 		},
		// 	};
		// } else if (userInfo.email) {
		// 	whereCondition.email = userInfo.email;
		// } else if (userInfo.phone) {
		// 	whereCondition.phone = userInfo.phone;
		// } else if (userInfo.username) {
		// 	whereCondition.username = userInfo.username;
		// }

		// Check if all fields are provided
		if (userInfo.email?.trim() && userInfo.phone?.trim() && userInfo.username?.trim()) {
			whereCondition = {
				[sequelize.Op.or]: [{ email: userInfo.email }, { phone: userInfo.phone }, { username: userInfo.username }],
			};
		} else {
			// Apply OR condition for each field if only one field is provided
			let orConditions = [];
			if (userInfo.email?.trim()) orConditions.push({ email: userInfo.email });
			if (userInfo.phone?.trim()) orConditions.push({ phone: userInfo.phone });
			if (userInfo.username?.trim()) orConditions.push({ username: userInfo.username });

			if (orConditions.length > 0) {
				whereCondition = { [sequelize.Op.or]: orConditions };
			}
		}

		whereCondition.isDeleted = false;

		// Fetch market database names
		[err, markets] = await to(Market.findAll({ attributes: ['db_name'] }));
		if (err) return ResponseError(res, err, 500, true);

		// console.log('-whereCondition-', whereCondition);

		// Find users with similar details across markets
		for (let market of markets) {
			[err, localUserEmailOrPhoneIsExits] = await to(
				dbInstance[market.db_name].User_master.findAll({
					where: whereCondition,
					attributes: ['id'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUserEmailOrPhoneIsExits && localUserEmailOrPhoneIsExits.length > 0) {
				for (let localUser of localUserEmailOrPhoneIsExits) {
					duplicateLearnerLocaldataIds.push(localUser.id);
				}
			}
		}

		// Return true if no duplicate user details found
		if (duplicateLearnerLocaldataIds.length == 0) {
			return true;
		} else {
			console.log('---duplicateLearnerLocaldataIds---', duplicateLearnerLocaldataIds);
			// Fetch related user and client IDs
			// let query_1;

			// if (type === 'drip') {
			// 	query_1 = `SELECT ARRAY (SELECT "id" FROM "Users" WHERE "forDrip" = true AND  local_user_id IN (${duplicateLearnerLocaldataIds.toString()}));`;
			// } else if (type === 'diwo') {
			// 	query_1 = `SELECT ARRAY (SELECT "id" FROM "Users" WHERE  "forDiwo" = true AND local_user_id IN (${duplicateLearnerLocaldataIds.toString()}));`;
			// }

			// [ids] = await sequelize.query(query_1);

			let query_1;

			if (type === 'drip') {
				query_1 = `SELECT ARRAY (SELECT "id" FROM "Users" WHERE "forDrip" = true AND local_user_id IN (:learnerIds));`;
			} else if (type === 'diwo') {
				query_1 = `SELECT ARRAY (SELECT "id" FROM "Users" WHERE "forDiwo" = true AND local_user_id IN (:learnerIds));`;
			}

			const ids = await sequelize.query(query_1, {
				replacements: { learnerIds: duplicateLearnerLocaldataIds },
				type: sequelize.QueryTypes.SELECT,
			});

			dulicateUserIds = [...dulicateUserIds, ...ids[0].array];
			console.log('---dulicateUserIds---', dulicateUserIds);
			if (dulicateUserIds.length > 0) {
				// let query_2;
				// if (type == 'drip') {
				// 	query_2 = `SELECT ARRAY (SELECT "ClientId" FROM "User_role_client_mappings" WHERE "forDrip" = true AND "UserId" IN (${dulicateUserIds.toString()}));`;
				// } else if (type == 'diwo') {
				// 	query_2 = `SELECT ARRAY (SELECT "ClientId" FROM "User_role_client_mappings" WHERE "forDiwo" = true AND "UserId" IN (${dulicateUserIds.toString()}));`;
				// }

				// [ids_] = await sequelize.query(query_2);
				let query_2;

				if (type === 'drip') {
					query_2 = `SELECT ARRAY (SELECT "ClientId" FROM "User_role_client_mappings" WHERE "forDrip" = true AND "UserId" IN (:userIds));`;
				} else if (type === 'diwo') {
					query_2 = `SELECT ARRAY (SELECT "ClientId" FROM "User_role_client_mappings" WHERE "forDiwo" = true AND "UserId" IN (:userIds));`;
				}

				const ids_ = await sequelize.query(query_2, {
					replacements: { userIds: dulicateUserIds },
					type: sequelize.QueryTypes.SELECT,
				});

				presentClientIds = [...new Set(ids_[0].array)];
			} else {
				return true;
			}
		}

		// Check for associations when adding a new learner
		if (tryToAddClientIds) {
			[err, branchAccount] = await to(
				Client.findOne({
					where: {
						id: tryToAddClientIds,
					},
					attributes: ['id', 'Associate_client_id'],
				})
			);
			if (err) return false;

			if (branchAccount) {
				[err, totleClientCount] = await to(Client.count());
				let count = 0;

				let flag = true;
				let associate_client_id = branchAccount.Associate_client_id;

				// Traverse client hierarchy to find direct client account
				while (flag) {
					count++;
					[err, parentAccount] = await to(
						Client.findOne({
							where: {
								id: associate_client_id,
							},
							attributes: ['id', 'Associate_client_id', 'category'],
						})
					);
					if (err) return false;

					if (parentAccount && parentAccount.category === 'Client Account') {
						addingNewLearnerCilentAccountId = parentAccount.id;
						flag = false;
					} else if (parentAccount && parentAccount.category === 'Branch Account') {
						associate_client_id = parentAccount.Associate_client_id;
					} else {
						flag = false;
					}
					if (count > totleClientCount) {
						flag = false;
						return false;
					}
				}
			} else {
				// Invalid Client Details
				return false;
			}

			if (addingNewLearnerCilentAccountId) {
				// Check associations of other existing branches
				if (presentClientIds && presentClientIds.length > 0) {
					let canCreateNewLearner = true;
					for (let account of presentClientIds) {
						[err, branchAccountDetails] = await to(
							Client.findOne({
								where: {
									id: account,
								},
								attributes: ['id', 'Associate_client_id', 'category'],
							})
						);
						if (err) return false;

						if (branchAccountDetails) {
							let count = 0;
							let flag = true;
							let associate_client_id = branchAccountDetails.Associate_client_id;
							while (flag) {
								count++;
								let parentAccount;
								[err, parentAccount] = await to(
									Client.findOne({
										where: {
											id: associate_client_id,
										},
										attributes: ['id', 'Associate_client_id', 'category'],
									})
								);
								if (err) return false;

								if (parentAccount && parentAccount.category === 'Client Account') {
									if (addingNewLearnerCilentAccountId == parentAccount.id) {
										canCreateNewLearner = false;
										return false;
									}
									flag = false;
								} else if (parentAccount && parentAccount.category === 'Branch Account') {
									associate_client_id = parentAccount.Associate_client_id;
								} else {
									flag = false;
								}
								if (count > totleClientCount) {
									flag = false;
								}
							}
						}
					}

					if (canCreateNewLearner) {
						return true;
					} else {
						return false;
					}
				}
			} else {
				return false;
			}
		}
	} catch (error) {
		console.log('----Error when Check Duplicate Learner Details---', error);
	}
};

module.exports.checkDuplicateLearnerDetails = checkDuplicateLearnerDetails;

const updateLearnerGroupUserCountByType = async function (type, clientId) {
	try {
		let learner_;
		let learnerGroups;
		if (type === 'drip') {
			[err, learnerGroups] = await to(
				User_group.findAll({
					where: {
						forDrip: true,
						ClientId: clientId,
					},
					attributes: ['id'],
					include: [
						{
							model: User,
							through: 'User_group_mapping',
							where: {
								forDrip: true,
							},
							attributes: ['id'],
							required: false,
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) console.log('get drip learner Groups err....', err);
		} else if (type === 'diwo') {
			[err, learnerGroups] = await to(
				User_group.findAll({
					where: {
						forDiwo: true,
						ClientId: clientId,
					},
					attributes: ['id'],
					include: [
						{
							model: User,
							through: 'User_group_mapping',
							where: {
								forDiwo: true,
							},
							attributes: ['id'],
							required: false,
						},
					],
					order: [['createdAt', 'desc']],
				})
			);
			if (err) console.log('get diwo learner Groups err....', err);
		}

		if (learnerGroups && learnerGroups.length > 0) {
			for (let learner of learnerGroups) {
				learner_ = learner.convertToJSON();
				[err, updateUserGroup] = await to(
					User_group.update(
						{
							userCount: learner_.Users.length,
						},
						{
							where: {
								id: learner.id,
							},
						}
					)
				);
				if (err) console.log('update learner error...........', err);
			}
		}
	} catch (error) {
		console.log('error updateLearnerGroupUserCountByType....', error);
	}
};
module.exports.updateLearnerGroupUserCountByType = updateLearnerGroupUserCountByType;

const updateLearnerGroupUserCount = async function (req, res) {
	try {
		let learner_;
		let learnerGroups;
		let typeList = ['drip', 'diwo'];
		for (let type of typeList) {
			if (type == 'drip') {
				[err, learnerGroups] = await to(
					User_group.findAll({
						where: {
							forDrip: true,
						},
						include: [
							{
								model: User,
								through: 'User_group_mapping',
								where: {
									forDrip: true,
								},
								required: false,
							},
						],
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, learnerGroups] = await to(
					User_group.findAll({
						where: {
							forDiwo: true,
						},
						include: [
							{
								model: User,
								through: 'User_group_mapping',
								where: {
									forDiwo: true,
								},
								required: false,
							},
						],
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			for (let learner of learnerGroups) {
				learner_ = learner.convertToJSON();
				[err, updateUserGroup] = await to(
					User_group.update(
						{
							userCount: learner_.Users.length,
						},
						{
							where: {
								id: learner.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}
		return ResponseSuccess(res, {
			message: 'Count update sucessfully',
		});
	} catch (error) {
		console.log('error updateLearnerGroupUserCount....', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateLearnerGroupUserCount = updateLearnerGroupUserCount;

//Upload Learner ExcelSheet
const createUploadLearnerTemplate = async function (req, res) {
	try {
		const clientId = req.user.ClientId;
		const fileName = shortid.generate() + '.csv';
		const filePath = CONFIG.imagePath + '/uploads/excel/' + fileName;

		let totalClientCount = 0;
		let header = [{ title: '*Sr. No' }, { title: '*First Name' }, { title: '*Last Name' }];
		let clientDetails;
		let clientDetails_;

		//Need to Check Which One is Required Email or Phone By Using App branding
		if (req.user.type === 'drip') {
			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					include: [{ model: System_branding, attributes: ['id', 'compMobNo', 'compEmail'] }],
					attributes: ['id', 'Associate_client_id', 'name', 'category', 'customFields'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (clientDetails) {
				if (clientDetails?.System_branding) {
					if (clientDetails.System_branding.compMobNo) {
						header.push({ title: '*Mobile' });
					} else {
						header.push({ title: 'Mobile' });
					}
					if (clientDetails.System_branding.compEmail) {
						header.push({ title: '*Email' });
					} else {
						header.push({ title: 'Email' });
					}
				} else {
					let flag = true;
					let clientId_ = clientDetails.Associate_client_id;
					let count = 0;

					[err, totalClientCount] = await to(Client.count());
					while (flag) {
						count++;
						[err, clientDetails_] = await to(
							Client.findOne({
								where: {
									id: clientId_,
								},
								include: [{ model: System_branding, attributes: ['id', 'compMobNo', 'compEmail'] }],
								attributes: ['id', 'Associate_client_id', 'name', 'category', 'customFields'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						if (clientDetails_?.System_branding) {
							if (clientDetails_.System_branding.compMobNo) {
								header.push({ title: '*Mobile' });
							} else {
								header.push({ title: 'Mobile' });
							}
							if (clientDetails_.System_branding.compEmail) {
								header.push({ title: '*Email' });
							} else {
								header.push({ title: 'Email' });
							}

							flag = false;
							// break;
						} else if (clientDetails_.Associate_client_id) {
							clientId_ = clientDetails_.Associate_client_id;
						}

						if (count > totalClientCount) {
							flag = false;
							// break;
						}
					}
				}
			}
		} else if (req.user.type === 'diwo') {
			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					include: [{ model: DiwoSystemBranding, attributes: ['id', 'compMobNo', 'compEmail'] }],
					attributes: ['id', 'Associate_client_id', 'name', 'category', 'customFields'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (clientDetails) {
				if (clientDetails?.DiwoSystemBranding) {
					if (clientDetails.DiwoSystemBranding.compMobNo) {
						header.push({ title: '*Mobile' });
					} else {
						header.push({ title: 'Mobile' });
					}
					if (clientDetails.DiwoSystemBranding.compEmail) {
						header.push({ title: '*Email' });
					} else {
						header.push({ title: 'Email' });
					}
				} else {
					let flag = true;
					let clientId_ = clientDetails.Associate_client_id;
					let count = 0;

					[err, totalClientCount] = await to(Client.count());
					while (flag) {
						count++;
						[err, clientDetails_] = await to(
							Client.findOne({
								where: {
									id: clientId_,
								},
								include: [{ model: DiwoSystemBranding, attributes: ['id', 'compMobNo', 'compEmail'] }],
								attributes: ['id', 'Associate_client_id', 'name', 'category', 'customFields'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						if (clientDetails_?.DiwoSystemBranding) {
							if (clientDetails_.DiwoSystemBranding.compMobNo) {
								header.push({ title: '*Mobile' });
							} else {
								header.push({ title: 'Mobile' });
							}
							if (clientDetails_.DiwoSystemBranding.compEmail) {
								header.push({ title: '*Email' });
							} else {
								header.push({ title: 'Email' });
							}

							flag = false;
							break;
						} else if (clientDetails_.Associate_client_id) {
							clientId_ = clientDetails_.Associate_client_id;
						}

						if (count > totalClientCount) {
							flag = false;
							break;
						}
					}
				}
			}
		}

		//Add Country, State, City, ZipCode, Address, For drip and diwo

		if (config_feature?.configurable_feature?.pwa_username) {
			header.push({ title: 'Username' });
		}

		header.push({ title: '*Country' });
		header.push({ title: 'State' });
		header.push({ title: 'City' });
		header.push({ title: 'Zip Code' });
		header.push({ title: '*Branch Id' });
		header.push({ title: 'Tags' });
		header.push({ title: 'Job Role' });

		//Add Other Details as per Drip and diwo
		[err, client_details] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [{ model: System_branding, attributes: ['id', 'compMobNo', 'compEmail'] }],
				attributes: ['id', 'DripAccess', 'DiwoAccess'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (req.user.type === 'drip') {
			header.push({ title: 'Have the OPT-IN permission (yes/no)' });
			header.push({ title: 'Have Email Permission (yes/no)' });
			if (client_details.DiwoAccess) {
				header.push({ title: 'Add to Diwo (yes/no)' });
			}
		} else if (req.user.type === 'diwo') {
			header.push({ title: 'Have Email Permission (yes/no)' });
			if (client_details.DripAccess) {
				header.push({ title: 'Have the OPT-IN permission (yes/no)' });
				header.push({ title: 'Add to Drip (yes/no)' });
			}
		}

		//Find Custom Details
		let customFields = await getAccountCustomField(clientId, req.user.type);

		if (customFields && customFields.length > 0) {
			for (let customField of customFields) {
				if (!customField.isHide) {
					if (customField.isRequired) {
						header.push({ title: '*' + customField.label });
					} else {
						header.push({ title: customField.label });
					}
				}
			}
		}

		const csvWriter = createCsvWriter({
			path: filePath,
			header: header,
		});

		const records = [];

		csvWriter
			.writeRecords(records) // returns a promise
			.then(() => {
				console.log('...Done');
				//Need to to send to Frontend
				res.download(filePath);
			});
	} catch (error) {
		console.log('error createUploadLearnerTemplate....', error);
		// return ResponseError(res, error, 500, true);
	}
};
module.exports.createUploadLearnerTemplate = createUploadLearnerTemplate;

const getCustomFieldByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let customFields = await getAccountCustomField(clientId, req.user.type);
		//Get Teams Details by Using ClientId
		const haveTeamAccessToken = await getTeamAccessTokenByClientId(clientId);

		return ResponseSuccess(res, {
			data: customFields,
			haveTeamAccessToken: haveTeamAccessToken,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomFieldByClientId = getCustomFieldByClientId;

// Send WhatsApp Optin MSG
const sendWhatsAppOptInMsg = async function (userPhones, clientId, userId) {
	try {
		[err, getWhatsAppSetup] = await to(
			ClientWhatsAppSetup.findOne({
				where: {
					ClientId: clientId,
					forDrip: true,
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
					},
				],
			})
		);

		if (getWhatsAppSetup) {
			let params = {
				userid: getWhatsAppSetup.WhatsAppSetup.user_id,
				password: getWhatsAppSetup.WhatsAppSetup.password,
				v: `1.1`,
				format: `json`,
				isTemplate: true,
			};

			params.method = 'SENDMESSAGE';
			params.msg = getWhatsAppSetup.WhatsAppSetup.optInMsg;
			params.isTemplate = true;

			params.send_to = userPhones.toString();
			console.log('----Url--', `${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`);

			try {
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);
				return response.data;
			} catch (error) {
				return false;
			}
		} else {
			//We Can Trigger The Notification For User "Whats Setup Not Found"
			let message = `You requested that we send a message to your learners asking for their permission to send WhatsApp message. However, your Whatsapp Setup is still not added. To trigger this message, please contact customer support and request them to add your WhatsApp setup.`;
			await createNotification(message, ['Bell'], [userId]);
			return;
		}
	} catch (error) {
		console.log(new Date(), 'Error --->>>>Campaign Scheduler --->>>-->>>  Only WhatsApp', error);
		return;
	}
};
module.exports.sendWhatsAppOptInMsg = sendWhatsAppOptInMsg;

const getAllUserGroupForLearnerUpdate = async function (req, res) {
	try {
		const schema = Joi.object({
			userId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			userId: parseInt(req.params.userId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { userId } = value;

		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		// let userId = req.params.userId;
		let adminUserId = req.user.id;
		let allUserData, err;
		let allData = [];
		if (type == 'drip') {
			[err, allUserData] = await to(
				User_group_mapping.findAll({
					where: {
						UserId: userId,
					},
					include: [
						{
							model: User_group,
							where: {
								defaultGroupForDrip: false,
								defaultGroupForDiwo: false,
								ClientId: req.user.ClientId,
								forDrip: true,
								UserId: adminUserId,
							},
							required: true,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, allUserData] = await to(
				User_group_mapping.findAll({
					where: {
						UserId: userId,
					},
					include: [
						{
							model: User_group,
							where: {
								defaultGroupForDrip: false,
								defaultGroupForDiwo: false,
								ClientId: req.user.ClientId,
								forDiwo: true,
								UserId: adminUserId,
							},
							required: true,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: allUserData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllUserGroupForLearnerUpdate = getAllUserGroupForLearnerUpdate;

const createDefaultLearnerGroup = async function (clientId, type, userId, roleId) {
	try {
		//Get Account Details
		//Get All Under Client and Branch Accounts
		//Get All Learner Under in accounts
		//Create new Learner Group

		//Get Account Details
		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['id', 'name', 'category'],
			})
		);
		if (err) {
			console.log('------Get Client Data Error----', err);
			return false;
		}

		if (!clientDetails) {
			return false;
		}

		//Get All Under Client and Branch Accounts
		let allSubClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		//Get All Learner Under in accounts
		[err, getLearnerIds] = await to(
			User_role_client_mapping.findAll({
				where: {
					RoleId: 1,
					ClientId: allSubClientIds,
				},
				attributes: ['UserId'],
			})
		);
		if (err) {
			console.log('------Get Leraner Data Error----', err);
			return false;
		}

		let createObject = {
			title: '',
			ClientId: clientId,
			UserId: userId,
			RoleId: roleId,
			forDrip: false,
			forDiwo: false,
			userCount: getLearnerIds && getLearnerIds.length > 0 ? getLearnerIds.length : 0,
			defaultGroupForDrip: false,
			defaultGroupForDiwo: false,
		};
		if (type == 'drip') {
			createObject.forDrip = true;
			createObject.title = `All Contacts - ${clientDetails.name}`;
			createObject.defaultGroupForDrip = true;
		} else if (type == 'diwo') {
			createObject.forDiwo = true;
			createObject.title = `All Learners - ${clientDetails.name}`;
			createObject.defaultGroupForDiwo = true;
		}
		let createLearnerGroup;

		//Create new Learner Group
		[err, createLearnerGroup] = await to(User_group.create(createObject));
		if (err) {
			console.log('------Create Learner Group Error----', err);
			return false;
		}

		console.log('--------Default Learner Group is Created-------');

		let mappingDate = [];
		if (getLearnerIds && getLearnerIds.length > 0) {
			for (let learner of getLearnerIds) {
				let payload = {
					UserId: learner.UserId,
					UserGroupId: createLearnerGroup.id,
				};
				mappingDate.push(payload);
			}

			if (mappingDate.length > 0) {
				[err, createLearnerGroupMapping] = await to(User_group_mapping.bulkCreate(mappingDate));
				if (err) {
					console.log('------Create Learner Group Mapping Error----', err);
					return false;
				}
			}
		}

		return true;
	} catch (error) {
		console.log('error createDefaultLearnerGroup....', error);
		return false;
	}
};
module.exports.createDefaultLearnerGroup = createDefaultLearnerGroup;

const addNewLearnerIntoDefaultLeanrerGroup = async function (learnerIds, type) {
	try {
		//Get All Learner's Branch Account By using Manul Query
		//Get All Default Learner Group as per Account ids List and Project (Drip / Diwo)
		//Add Learner into Default Learner Group and Update User Count
		let allData;
		// let query = `SELECT "ClientId",  array_agg("UserId") as UserIds
		// 				FROM "User_role_client_mappings"
		// 				JOIN "Clients" ON "User_role_client_mappings"."ClientId" = "Clients".id
		// 				WHERE "UserId" IN (${learnerIds.toString()})
		// 				GROUP BY "ClientId"`;

		// console.log('---------query- addNewLearnerIntoDefaultLeanrerGroup---------', query);

		// [allData] = await sequelize.query(query);

		let query = `
			SELECT "ClientId", array_agg("UserId") AS "UserIds"
			FROM "User_role_client_mappings"
			JOIN "Clients" ON "User_role_client_mappings"."ClientId" = "Clients".id
			WHERE "UserId" IN (:learnerIds)
			GROUP BY "ClientId";
		`;

		// console.log('---------query- addNewLearnerIntoDefaultLeanrerGroup---------', query);

		allData = await sequelize.query(query, {
			replacements: { learnerIds },
			type: sequelize.QueryTypes.SELECT,
		});

		if (allData && allData.length > 0) {
			for (let data of allData) {
				let allUpperUpToClientAccountIds = await getUpperLevelAccountDetailsUptoClientAccount(data.ClientId);
				//Find All Upper side Account Ids (Upto Client Account)

				if (!allUpperUpToClientAccountIds || allUpperUpToClientAccountIds.length == 0) {
					continue;
				}

				//Get All Default Learner Group as per Account ids List and Project (Drip / Diwo)
				let whereCondtion = {
					ClientId: allUpperUpToClientAccountIds,
				};
				if (type === 'drip') {
					whereCondtion['forDrip'] = true;
					whereCondtion['defaultGroupForDrip'] = true;
				} else if (type === 'diwo') {
					whereCondtion['forDiwo'] = true;
					whereCondtion['defaultGroupForDiwo'] = true;
				}

				// console.log('---------whereCondtion----------', whereCondtion);

				[err, allDefaultLearnerGroups] = await to(
					User_group.findAll({
						where: whereCondtion,
						attributes: ['id', 'userCount', 'ClientId'],
					})
				);

				if (err) {
					console.log('------Get Default Learner Group Error----', err);
					continue;
				}

				if (!allDefaultLearnerGroups || allDefaultLearnerGroups.length == 0) {
					continue;
				}

				for (let defaultGroup of allDefaultLearnerGroups) {
					if (data.userids && data.userids.length > 0) {
						let addLernerIntoGroup = [];

						for (let learnerId of data.userids) {
							let payload = {
								UserId: learnerId,
								UserGroupId: defaultGroup.id,
							};
							addLernerIntoGroup.push(payload);
						}

						if (addLernerIntoGroup.length > 0) {
							//Add Learner into Default Learner Group
							[err, createLearnerGroupMapping] = await to(User_group_mapping.bulkCreate(addLernerIntoGroup));
							if (err) {
								console.log('------Create Learner Group Mapping Error----', err);
								continue;
							}

							//Update Learner Count into Learner Group
							let updateLearnerGroup;
							[err, updateLearnerGroup] = await to(
								User_group.update(
									{ userCount: defaultGroup.userCount + addLernerIntoGroup.length },
									{ where: { id: defaultGroup.id } }
								)
							);
							if (err) {
								console.log('------Update Learner Group Error----', err);
								continue;
							}
						}
					} else {
						continue;
					}
				}
			}
		}

		return true;
	} catch (error) {
		console.log('error addNewLearnerIntoDefaultLeanrerGroup....', error);
		return false;
	}
};
module.exports.addNewLearnerIntoDefaultLeanrerGroup = addNewLearnerIntoDefaultLeanrerGroup;

// Define an asynchronous function to check a learner's previous upload status
const checkPreviousLearnerUploadStatus = async function (req, res) {
	try {
		// Extract user ID and type from the request object
		const userId = req.user.id;
		const type = req.user.type;

		// Initialize whereCondition with default criteria for finding uploads
		let whereCondition = {
			UserId: userId, // Match the user ID
			isCreated: false, // Filter out records that haven't been created
			isError: false, // Filter out records without errors
		};

		// Adjust whereCondition based on the user's type
		if (type == 'drip') {
			whereCondition['forDrip'] = true; // Specific condition for 'drip' type users
		} else if (type == 'diwo') {
			whereCondition['forDiwo'] = true; // Specific condition for 'diwo' type users
		}

		// Use the Upload_learner model to count records matching the whereCondition
		[err, checkCount] = await to(
			Upload_learner.count({
				where: whereCondition,
			})
		);
		// If an error occurs, return a 500 response with the error
		if (err) return ResponseError(res, err, 500, true);

		// Based on the count, determine if the user can upload a learner
		if (checkCount == 0) {
			// If no records are found, the user can upload a learner
			return ResponseSuccess(res, {
				canUploadLearner: true,
			});
		} else {
			// If one or more records are found, the user cannot upload a learner
			return ResponseSuccess(res, {
				canUploadLearner: false,
			});
		}
	} catch (error) {
		// Catch and return any errors that occur during execution
		return ResponseError(res, error, 500, true);
	}
};
// Export the function for use in other parts of the application
module.exports.checkPreviousLearnerUploadStatus = checkPreviousLearnerUploadStatus;

// Triggering mail functions for Learner User
const learnerUserWelcomeMailNotification = async function (req, res) {
	try {
		//Send Welcome Email To While adding Learner
		let userPayload = {
			firstName: req.body.userDetails.first,
			email: req.body.userDetails.email,
		};

		if (req.user.type == 'drip' && req.body.userDetails.clientId) {
			//Get All Learner Under in accounts
			[err, getContactDetails] = await to(
				Client.findOne({
					where: {
						id: req.body.userDetails.clientId,
					},
					attributes: ['name'],
				})
			);
			if (err) {
				console.log('------Get Leraner Data Error----', err);
				return false;
			}

			userPayload.clientName = getContactDetails.name;
			console.log('userPayload', userPayload.clientName);
		}

		let signature = '';

		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.body.userDetails.clientId);
			signature = `${appBrandingData.EmailSignatureText}`;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.user.ClientId);
			signature = `${appBrandingData.EmailSignatureText}`;
		}

		userPayload.signature = signature;

		console.log('userPayload', userPayload);

		if (userPayload && userPayload?.email && config_feature?.configurable_feature?.pwa_otp && req.user.type == 'diwo') {
			console.log('userPayload in email', userPayload);
			if (req.user.type == 'diwo') {
				[err, mailedWelcomeText] = await to(sendUserWelcomeEmailToLearner(userPayload, req.user.type));
				if (err) {
					console.log('--------Error in Sendgrid--------------', err);
					failed = 'e-mail';
				} else {
					success = 'e-mail';
				}

				console.log('mailedWelcomeTextemail', mailedWelcomeText);
			}
		}

		if (userPayload && userPayload?.email && config_feature?.configurable_feature?.pwa_otp && req.user.type == 'drip') {
			console.log('userPayload in email', userPayload);

			[err, mailedWelcomeText] = await to(sendUserWelcomeEmailToLearner(userPayload, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			console.log('mailedWelcomeTextemail', mailedWelcomeText);
		}

		// return ResponseSuccess(res, {
		// 	Message: MESSAGE.WELCOME_LEARNER_MAIL_SENT,
		// });
	} catch (error) {
		// return ResponseError(res, error, 500, true);
		console.log('error', error);
	}
};
module.exports.learnerUserWelcomeMailNotification = learnerUserWelcomeMailNotification;

const learnerUserMailWithCreatePassWordLinkNotification = async function (req, res) {
	try {
		// Send Welcome Email with create password
		let projectName = '';

		let userPayload02 = {
			firstName: req.body.userDetails.first,
			email: req.body.userDetails.email,
		};

		if (config_feature?.configurable_feature?.saas) {
			if (req.user.type == 'drip') {
				projectName = 'Drip';
			} else if (req.user.type == 'diwo') {
				projectName = 'Diwo';
			}
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		userPayload02.projectName = projectName;

		if (req.user.type == 'drip' && req?.body?.userDetails?.clientId) {
			//Get All Learner Under in accounts
			[err, getContactDetails] = await to(
				Client.findOne({
					where: {
						id: req?.body?.userDetails?.clientId,
					},
					attributes: ['name'],
				})
			);
			if (err) {
				console.log('------Get Leraner Data Error----', err);
				return false;
			}

			userPayload02.clientName = getContactDetails.name;
			console.log('userPayload clientName', userPayload02.clientName);
		}

		let emailSignatureTextForLearner = '';
		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.body.userDetails.clientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureTextForLearner = appBrandingData.EmailSignatureText;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.body.userDetails.clientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureTextForLearner = appBrandingData.EmailSignatureText;
		}

		userPayload02.emailSignatureTextForLearner = emailSignatureTextForLearner;

		let host_name = '';
		if (req.user.type == 'drip') {
			host_name = CONFIG.drip_host;
		} else if (req.user.type == 'diwo') {
			host_name = CONFIG.diwo_host;
		}

		let getUserDetails, learnerLocalUserData, learnerGlobalUserData;
		// trying to get the learner data
		[err, getUserDetails] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
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

		[err, learnerLocalUserData] = await to(
			dbInstance[getUserDetails.Market.db_name].User_master.findOne({
				where: {
					email: req.body.userDetails.email,
					isDeleted: false,
				},
				attributes: ['id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, learnerGlobalUserData] = await to(
			User.findOne({
				where: {
					local_user_id: learnerLocalUserData.id,
				},
				attributes: ['id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Check this combination is valid or not
		let whereCondition = {
			UserId: learnerGlobalUserData.id,
			ClientId: req.body.userDetails.clientId,
			RoleId: 1,
		};

		if (req.user.type == 'drip') {
			whereCondition.forDrip = true;
		} else if (req.user.type == 'diwo') {
			whereCondition.forDiwo = true;
		}

		console.log('whereCondition in checkCombination', whereCondition);

		[err, checkCombination] = await to(
			User_role_client_mapping.findOne({
				where: whereCondition,
				include: [{ model: User }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let tokenexpiryForLearner = CONFIG.jwt_expiration_reset_password_admin;
		let token = '';

		if (checkCombination?.User) {
			token = checkCombination.User.getJWT(1, req.body.userDetails.clientId, req.user.type, tokenexpiryForLearner);
		}

		console.log('token in checkCombination', checkCombination);
		console.log('req.body.userDetails.clientId', req.body.userDetails.clientId);
		console.log('req.user.type', req.user.type);
		console.log('tokenexpiryForLearner', tokenexpiryForLearner);

		let pageMode = 'Create';
		let IsResetPassword = true;

		let redirect_url = `${host_name}?type=${req.user.type}&isResetPassword=${IsResetPassword}&token=${token}&pageMode=${pageMode}`;

		userPayload02.redirect_url = redirect_url;

		console.log('userPayload02', userPayload02);

		if (
			userPayload02 &&
			userPayload02?.email &&
			config_feature?.configurable_feature?.pwa_password &&
			req.user.type == 'diwo'
		) {
			[err, mailedCreatePasswordTextDiwo] = await to(sendCreatePassEmailToLearner(userPayload02, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			console.log('mailedCreatePasswordTextDiwo', mailedCreatePasswordTextDiwo);
		}

		if (
			userPayload02 &&
			userPayload02?.email &&
			config_feature?.configurable_feature?.pwa_password &&
			req.user.type == 'drip'
		) {
			[err, mailedCreatePasswordTextDrip] = await to(sendCreatePassEmailToLearner(userPayload02, req.user.type));
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			console.log('mailedCreatePasswordTextDrip', mailedCreatePasswordTextDrip);
		}

		/////////////////////////////////////////

		// return ResponseSuccess(res, {
		// 		Message: MESSAGE.WELCOME_LEARNER_WITH_PASSWORD_MAIL_SENT,
		// 	});
	} catch (error) {
		// return ResponseError(res, error, 500, true);
		console.log('error', error);
	}
};
module.exports.learnerUserMailWithCreatePassWordLinkNotification = learnerUserMailWithCreatePassWordLinkNotification;

const bulkuploadlearnerUserMailWithCreatePassWordLinkNotification = async function (
	userId,
	clientId,
	type,
	tokenexpiry,
	comingFrom
) {
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

			let projectName = '';

			if (config_feature?.configurable_feature?.saas) {
				if (type == 'drip') {
					projectName = 'Drip';
				} else if (type == 'diwo') {
					projectName = 'Diwo';
				}
			} else if (config_feature?.configurable_feature?.sles) {
				projectName = 'TASL Leap';
			}

			let emailSignatureTextForLearner = '';
			if (type == 'drip') {
				const appBrandingData = await getClientAppBrandingByClientId(clientId);
				// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
				emailSignatureTextForLearner = appBrandingData.EmailSignatureText;
			} else if (type == 'diwo') {
				const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
				// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
				emailSignatureTextForLearner = appBrandingData.EmailSignatureText;
			}

			let pageMode = '';

			if (comingFrom == 'forgotPassword') {
				pageMode = 'Reset';
			} else if (comingFrom == 'resetLockout' || comingFrom == 'resetLockout Admin unlock Learner account') {
				pageMode = 'Reset';
			} else {
				pageMode = 'Create';
			}

			let redirect_url = `${host_name}?type=${type}&isResetPassword=${true}&token=${token}&pageMode=${pageMode}`;
			for (let email of userEmail) {
				personalisations.to = email;

				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						firstName: userDetail.first,
						clientName: client_.name,
						projectName: projectName,
						emailSignatureTextForLearner: emailSignatureTextForLearner,
						redirect_url: redirect_url,
						email: email,
					};
					emailData.push(personalisations);
				}
			}

			console.log('--emailData-', emailData);

			if (config_feature?.configurable_feature?.pwa_password && type == 'diwo') {
				let mailedCreatePasswordTextDiwo, err;

				for (let email of emailData) {
					[err, mailedCreatePasswordTextDiwo] = await to(bulksendCreatePassEmailToLearner(email, type));
					if (err) {
						console.log('--------Error in Sendgrid--------------', err);
						failed = 'e-mail';
					} else {
						success = 'e-mail';
					}
				}

				console.log('mailedCreatePasswordTextDiwo', mailedCreatePasswordTextDiwo);
			}

			if (config_feature?.configurable_feature?.pwa_password && type == 'drip') {
				let mailedCreatePasswordTextDrip, err;

				for (let email of emailData) {
					[err, mailedCreatePasswordTextDrip] = await to(bulksendCreatePassEmailToLearner(email, type));
					if (err) {
						console.log('--------Error in Sendgrid--------------', err);
						failed = 'e-mail';
					} else {
						success = 'e-mail';
					}
				}

				console.log('mailedCreatePasswordTextDrip', mailedCreatePasswordTextDrip);
			}

			if (config_feature?.configurable_feature?.pwa_otp && type === 'diwo') {
				let mailedWelcomeText;
				let err;

				for (const email of emailData) {
					[err, mailedWelcomeText] = await to(bulksendUserWelcomeEmailToLearner(email, type));

					if (err) {
						console.error('--------Error in Sendgrid--------------', err);
						failed = 'e-mail';
					} else {
						success = 'e-mail';
					}
				}

				console.log('mailedWelcomeTextemail', mailedWelcomeText);
			}

			if (config_feature?.configurable_feature?.pwa_otp && type == 'drip') {
				let mailedWelcomeText, err;

				for (let email of emailData) {
					[err, mailedWelcomeText] = await to(bulksendUserWelcomeEmailToLearner(email, type));
					if (err) {
						console.log('--------Error in Sendgrid--------------', err);
						failed = 'e-mail';
					} else {
						success = 'e-mail';
					}
				}

				console.log('mailedWelcomeTextemail', mailedWelcomeText);
			}
		}
		return;
	} catch (error) {
		console.log('----Error when Check and Triggered Reset Password Email--', error);
		return;
	}
};
module.exports.bulkuploadlearnerUserMailWithCreatePassWordLinkNotification =
	bulkuploadlearnerUserMailWithCreatePassWordLinkNotification;
