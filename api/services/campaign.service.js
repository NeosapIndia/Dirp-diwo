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
	Campaign,
	Campaign_post_mapping,
	Campaign_user_group_mapping,
	Post,
	Assigned_post_to_user,
	Drip_native,
	Drip_whatsapp_native,
	Drip_only_email,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Asset,
	Asset_detail,
	Drip_camp,
	DripOption,
	DripQuestion,
	DripUserQuestion,
	DripUserOption,
	CampWhatsAppEmailDrip,
	CampUserGroupStartRule,
	CampaignTagMapping,
	CampTakeAction,
	DripCampUserGroupAction,
	WhatsAppSetup,
	System_branding,
	WhatsAppEmailNotifications,
	DripSharingOnTeam,
	DripOnlyTeam,
	TeamSetup,
	TeamChatDetail,
	CampChannelMapping,
	TeamChannel,
	Post_asset_mapping,
	DripSpinWheelCat,
	Ticket,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const { updateDripMultipleCountInLicense, getValidationForSendDripWithCount } = require('../services/license.service');
const {
	sendDripEmail,
	notificationEmail,
	sendDripBroadSideEmail,
	sendOnlyEmailDrip,
} = require('../services/mailer.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
const fs = require('fs');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');
const axios = require('axios');
const { createNotification, getAllProductOwnerIdsForNotification } = require('../services/notification.service');
const FormData = require('form-data');
const { removeLearnerCount } = require('../services/license.service');
const { getClientAppBrandingByClientId, getDiwoClientAppBrandingByClientId } = require('../services/client.service');
const Bottleneck = require('bottleneck');
const { getAllSubClientAndBranchAccountLists } = require('../services/client.service');

const { renewAccessToken, getChatIdByTeamUserId } = require('../services/microsoft-team.service');
const Sequelize = require('sequelize');
const limiterForQuiz = new Bottleneck({ maxConcurrent: parseInt(CONFIG.quiz_throttled_count), minTime: 50 });
const { JSDOM } = require('jsdom');
const config_feature = require('../config/SiteConfig.json');

const limiterForRandomQuiz = new Bottleneck({
	maxConcurrent: parseInt(CONFIG.random_quiz_throttled_count),
	minTime: 50,
});

let isCampaignSchedulerWorkDone = true;
let isConversationalSchedulerWorkDone = true;

//Run Flow Type "Campaign" Scheduler
let campaign_schedulor = schedule.scheduleJob(CONFIG.main_scheduler_config, async function (fireDate) {
	const flow_type = 'Campaign';
	console.log('Run Scheduler --->>>-->>>  campaign schedulor', fireDate, '----', flow_type);
	if (!isCampaignSchedulerWorkDone) {
		console.log(
			'---------------------------------------------------------------------------------------------------------------------------'
		);
		console.log(
			'------------------------Previous -- "Campaign" -- scheduler work is not done. Skipping this iteration.---------------------'
		);
		console.log(
			'---------------------------------------------------------------------------------------------------------------------------'
		);
		return;
	}
	try {
		isCampaignSchedulerWorkDone = false;
		await flowScheduler(flow_type, false);
	} catch (error) {
		console.log('---Error in Campaign Scheduler---', error);
		isCampaignSchedulerWorkDone = true;
	} finally {
		isCampaignSchedulerWorkDone = true;
	}
});
module.exports.campaign_schedulor = campaign_schedulor;

// Run Flow Type "Conversational" Scheduler
let conversational_schedulor = schedule.scheduleJob(CONFIG.conversational_scheduler_config, async function (fireDate) {
	const flow_type = 'Conversational';
	console.log('Run Scheduler --->>>-->>>  conversational schedulor', fireDate, '----', flow_type);
	if (!isConversationalSchedulerWorkDone) {
		console.log(
			'---------------------------------------------------------------------------------------------------------------------------'
		);
		console.log(
			'------------------------Previous -- "conversational" -- scheduler work is not done. Skipping this iteration.---------------------'
		);
		console.log(
			'---------------------------------------------------------------------------------------------------------------------------'
		);
		return;
	}
	try {
		isConversationalSchedulerWorkDone = false;
		await flowScheduler(flow_type, false);
	} catch (error) {
		console.log('---Error in Campaign Scheduler---', error);
		isConversationalSchedulerWorkDone = true;
	} finally {
		isConversationalSchedulerWorkDone = true;
	}
});
module.exports.conversational_schedulor = conversational_schedulor;

const flowScheduler = async function (flow_type, forTest = false) {
	try {
		await checkScheduledCampaignStatus();

		if (!forTest) {
			await dripNotReadOrNotTackActionShedular(flow_type);
		}

		await runWhatsAppAndEmailShedulor(flow_type, forTest);

		if (!forTest) {
			await runCampaignTakeActionShedular(flow_type);
			await checkRunningCampaignStatus(flow_type);
		}
	} catch (error) {
		console.log('---Error in Flow Scheduler Scheduler---', error);
	}
};
module.exports.flowScheduler = flowScheduler;
// Send WhatsApp, Team And Email by using Shedulor
const runWhatsAppAndEmailShedulor = async function (flow_type, forTest) {
	try {
		const todayDate = new Date();
		if (config_feature?.configurable_feature?.whatsApp) {
			await runPostAssignShedulorForDripWhatsappNative(todayDate, flow_type, forTest);
			await runPostAssignShedulorForDripWhatsappNonNatives(todayDate, flow_type, forTest);
		}

		// For SendGrid Email
		await runPostAssignShedulorForSendGridNonNativeEmail(todayDate, flow_type, forTest);
		//For SendGrid Only Email
		await runPostAssignShedulorForSendGridOnlyEmail(todayDate, flow_type, forTest);

		if (config_feature?.configurable_feature?.broadside) {
			//For BrodeSide Only Email
			await runPostAssignShedulorForBroadSideOnlyEmail(todayDate, flow_type, forTest);
			//For Broadside Email
			await runPostAssignShedulorForBroadSideEmail(todayDate, flow_type, forTest);
		}

		await runPostAssignShedulorForNative(todayDate, flow_type, forTest);

		if (config_feature?.configurable_feature?.teams) {
			await runPostAssignShedulorForOnlyTeams(todayDate, flow_type, forTest);
			await runPostAssignShedulorForDripWithTeams(todayDate, flow_type, forTest);
		}

		if (flow_type === 'Campaign' && config_feature?.configurable_feature?.teams) {
			await runOnlyTeamsChannelMessage(todayDate, flow_type, forTest);
		}

		await updateCampaignStaus(flow_type);

		return;
	} catch (error) {
		console.log('---Error in Run WhatsAppAnd Email Shedular---', error);
		return;
	}
};

const runPostAssignShedulorForDripWhatsappNative = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;

		// For Campaign
		if (flow_type === 'Campaign') {
			[err, allCampaign] = await to(
				Campaign.findAll({
					where: {
						status: 'Running',
						flowType: flow_type,
						forTest: forTest,
					},
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							required: true,
							include: [
								{
									model: Post,
									required: true,
									drip_status: 'Published',
									include: [
										{
											model: Drip_whatsapp_native,
											include: [
												{
													model: WhatsAppSetup,
													where: {
														status: 'Active',
													},
													attributes: [
														'user_id',
														'password',
														'sendNtOptIn',
														'isMeta',
														'MTPNoId',
														'MTToken',
														'MTAccId',
														'MTAppId',
													],
												},
											],
											required: true,
											attributes: [
												'id',
												'templateStatus',
												'header_type',
												'tempName',
												'mediaId',
												'headerFileName',
												'headerPath',
												'body',
												'footer',
												'type',
												'interaction',
												'header_text',
												'quickReply1',
												'quickReply2',
												'quickReply3',
												'quickReply4',
												'quickReply5',
												'quickReply6',
												'quickReply7',
												'quickReply8',
												'quickReply9',
												'quickReply10',
												'quickReplyFirst',

												'longitude',
												'latitude',
												'locName',
												'address',

												'callphonetext',
												'callphoneno',
												'callphonetype',

												'callToActionText',
												'hyper_link',
												'trackableLink',
												'callToActionText2',
												'hyper_link2',
												'trackableLink2',
												'cta_sequence',

												'zoomMeetLink',
												'callToActionZoomText',
												'zoomTrackable',

												'zoomMeetLink2',
												'callToActionZoomText2',
												'zoomTrackable2',
											],
										},
									],
									attributes: ['id', 'ClientId', 'tempType'],
								},
								{
									model: CampWhatsAppEmailDrip,
									required: true,
									attributes: ['id', 'retryCount', 'code', 'TicketId', 'status', 'errorMessage'],
									where: {
										publishOn: {
											[Op.lte]: todayDate,
										},
										isTriggered: false,
										CampaignId: {
											[Op.ne]: null,
										},
										UserId: {
											[Op.ne]: null,
										},
										campaignPaused: false,
										dripType: 'Only WhatsApp',
									},
									include: [
										{
											model: User,
											where: {
												is_deleted: false,
												status: true,
												cStatus: 'Active',
												is_archive: false,
											},
											attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
											include: [
												{
													model: Market,
													attributes: ['id', 'db_name'],
												},
												{
													model: Country,
													attributes: ['callingCode'],
												},
												{ model: Client_job_role, through: 'User_job_role_mapping' },
											],
										},
									],
								},
							],
							attributes: ['id'],
						},
					],
					attributes: ['id', 'ClientId'],
					//logging: true,
				})
			);
			if (err) {
				console.log('----Error when get allCampaign--', err);
				return;
			}
		} else if (flow_type === 'Conversational') {
			// For Conversational
			[err, allCampaign] = await to(
				Campaign.findAll({
					where: {
						status: 'Running',
						flowType: flow_type,
						forTest: forTest,
					},
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							required: true,
							include: [
								{
									model: Post,
									required: true,
									drip_status: 'Published',
									include: [
										{
											model: Drip_whatsapp_native,
											include: [
												{
													model: WhatsAppSetup,
													where: {
														status: 'Active',
													},
													attributes: [
														'user_id',
														'password',
														'sendNtOptIn',
														'isMeta',
														'MTPNoId',
														'MTToken',
														'MTAccId',
														'MTAppId',
													],
												},
											],
											required: true,
											attributes: [
												'id',
												'templateStatus',
												'header_type',
												'tempName',
												'mediaId',
												'headerFileName',
												'headerPath',
												'body',
												'footer',
												'type',
												'interaction',
												'header_text',
												'quickReply1',
												'quickReply2',
												'quickReply3',
												'quickReply4',
												'quickReply5',
												'quickReply6',
												'quickReply7',
												'quickReply8',
												'quickReply9',
												'quickReply10',
												'quickReplyFirst',

												'longitude',
												'latitude',
												'locName',
												'address',

												'callphonetext',
												'callphoneno',
												'callphonetype',

												'callToActionText',
												'hyper_link',
												'trackableLink',
												'callToActionText2',
												'hyper_link2',
												'trackableLink2',
												'cta_sequence',

												'zoomMeetLink',
												'callToActionZoomText',
												'zoomTrackable',

												'zoomMeetLink2',
												'callToActionZoomText2',
												'zoomTrackable2',
											],
										},
									],
									attributes: ['id', 'ClientId', 'tempType'],
								},
								{
									model: CampWhatsAppEmailDrip,
									required: true,
									attributes: ['id', 'retryCount', 'code', 'TicketId', 'status', 'errorMessage'],
									where: {
										publishOn: {
											[Op.lte]: todayDate,
										},
										isTriggered: false,
										CampaignId: {
											[Op.ne]: null,
										},
										UserId: {
											[Op.ne]: null,
										},
										campaignPaused: false,
										dripType: 'Only WhatsApp',
									},
									include: [
										{
											model: User,
											where: {
												is_deleted: false,
												status: true,
												cStatus: 'Active',
												is_archive: false,
											},
											attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
											include: [
												{
													model: Market,
													attributes: ['id', 'db_name'],
												},
												{
													model: Country,
													attributes: ['callingCode'],
												},
												{ model: Client_job_role, through: 'User_job_role_mapping' },
											],
										},
										{
											model: Ticket,
											attributes: ['id', 'ContactId', 'UserId', 'status', 'createdAt', 'query', 'comment'],
										},
									],
								},
							],
							attributes: ['id', 'systemActionType'],
						},
					],
					attributes: ['id', 'ClientId'],
					//logging: true,
				})
			);
			if (err) {
				console.log('----Error when get allCampaign--', err);
				return;
			}
		}

		if (!allCampaign || allCampaign.length === 0) return;
		let templateNotEnabledCampWhatsAppEmailDripIds = [];
		let phoneNotFindCampWhatsAppEmailDripIds = [];
		let userNotOptInCampWhatsAppEmailDripIds = [];
		let whatsAPPcredentialsFiledCampWhatsAppEmailDripIds = [];

		for (let data of allCampaign) {
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_whatsapp_natives[0];
				if (postDetails.templateStatus === 'Enabled' || dripCamp.systemActionType == 'When ticket comment is updated') {
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						let userData = user.User;

						//Check For Whats App OPT-In
						if (userData.opt_in || postDetails.WhatsAppSetup.sendNtOptIn || postDetails.WhatsAppSetup.isMeta) {
							[err, localUser] = await to(
								dbInstance[userData.Market.db_name].User_master.findOne({
									where: {
										id: userData.local_user_id,
									},
									attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
								})
							);
							if (err) console.log('---Error in get User Local Data----', err);
							if (localUser.phone != '' && localUser.phone != null) {
								let userPhone = `${userData.Country.callingCode}${localUser.phone}`;
								userPhone = userPhone.replace('+', '').replace('-', '');
								let error = '';
								let missingVariable = false;
								let response = '';

								let messageData = Object.assign({}, postDetails.convertToJSON());
								let ticketDetails;
								let userOtherData = {};
								userOtherData = localUser.convertToJSON();
								userOtherData.customFields = userData.customFields ? userData.customFields : {};
								if (userData.tags) {
									userOtherData.tags = userData.tags.split(',');
								} else {
									userOtherData.tags = [];
								}
								userOtherData.job_role = '';

								if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
									userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
								}

								if (user?.Ticket?.id) {
									ticketDetails = user.Ticket;
								}

								if (messageData.header_text) {
									if (messageData?.WhatsAppSetup?.isMeta == false) {
										messageData.header_text = await CheckAndUpdateWhatsAppVariableWithUSerData(
											messageData.header_text,
											userOtherData,
											false,
											ticketDetails
										);
									} else {
										messageData.header_text_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
											messageData.header_text,
											userOtherData,
											false,
											ticketDetails
										);
									}

									if (messageData.header_text === false) {
										missingVariable = true;
									}
								}
								if (messageData.body) {
									if (messageData?.WhatsAppSetup?.isMeta == false) {
										messageData.body = await CheckAndUpdateWhatsAppVariableWithUSerData(
											messageData.body,
											userOtherData,
											false,
											ticketDetails
										);
									} else {
										messageData.body_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
											messageData.body,
											userOtherData,
											false,
											ticketDetails
										);
									}

									if (messageData.body === false) {
										missingVariable = true;
									}
								}

								if (missingVariable == false) {
									response = await sendWhatsAppNativeDripNew(userPhone, messageData, user, true);
									console.log('------------WhatsappNative response------------.', response);

									if (
										(response &&
											(response?.response?.details === 'Authentication failed due to invalid userId or password.' ||
												response?.response?.details === 'The method "SENDMESSAGE" is not supported.' ||
												response?.response?.id === '106' ||
												response?.response?.id === '102')) ||
										//Meta Errors
										(response?.success === false &&
											response?.error?.error &&
											(response?.error?.error?.code === 190 || // OAuth token expired / invalid
												(response?.error?.error?.type === 'OAuthException' &&
													(response?.error?.error?.message?.toLowerCase().includes('access token') ||
														response?.error?.error?.message?.toLowerCase().includes('authentication')))))
									) {
										whatsAPPcredentialsFiledCampWhatsAppEmailDripIds.push(user.id);
										const startDate = moment().format('YYYY-MM-DD') + 'T00:00:00.000Z';
										const endDate = moment().format('YYYY-MM-DD') + 'T23:59:59.000Z';
										[err, emailNotification] = await to(
											WhatsAppEmailNotifications.findOne({
												where: {
													ClientId: dripCamp.Post.ClientId,
													type: 'whatsapp',
													createdAt: {
														[Op.between]: [startDate, endDate],
													},
												},
												attributes: ['id'],
											})
										);
										if (err) return ResponseError(res, err, 500, true);
										if (!emailNotification) {
											let getClient;
											[err, getClient] = await to(
												Client.findOne({
													where: {
														id: dripCamp.Post.ClientId,
													},
													attributes: ['name'],
												})
											);

											if (getClient) {
												let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
												notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
												let userIds = await getAllProductOwnerIdsForNotification(dripCamp.Post.ClientId);
												await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
												const appBrandingData = await getClientAppBrandingByClientId(dripCamp.Post.ClientId);
												const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
												[err, getUser] = await to(
													User.findAll({
														where: {
															id: userIds,
														},
														attributes: ['local_user_id', 'MarketId'],
														include: [
															{
																model: Market,
																attributes: ['db_name'],
															},
														],
													})
												);
												if (err) return ResponseError(res, err, 500, true);

												let finalEmailList = [];
												for (let dataValue of getUser) {
													[err, localUser] = await to(
														dbInstance[dataValue.Market.db_name].User_master.findOne({
															where: {
																id: dataValue.local_user_id,
															},
															attributes: ['first', 'last', 'email'],
														})
													);
													if (err) return ResponseError(res, err, 500, true);

													let personalisations = {};
													personalisations.to = localUser.email;
													if (personalisations.to != null && personalisations.to != '') {
														personalisations.dynamic_template_data = {
															first_name: localUser.first,
															client_name: getClient.name,
															client_signature: signature,
														};
														if (localUser.email) finalEmailList.push(personalisations);
													}
												}

												[err, emailNotification] = await to(
													WhatsAppEmailNotifications.create({
														ClientId: dripCamp.Post.ClientId,
														type: 'whatsapp',
													})
												);
												if (err) return ResponseError(res, err, 500, true);
												try {
													await notificationEmail(
														finalEmailList,
														'WhatsApp Account Login Filed',
														dripCamp.Post.ClientId,
														'drip'
													);
												} catch (error) {}
											}
										}
									} else if (
										response?.response?.details ===
											'An unknown exception has occurred. Please retry the request after some time.' ||
										response?.response?.id === '100' ||
										// meta errors
										response?.error?.error?.message?.toLowerCase().includes('rate') ||
										response?.error?.error?.message?.toLowerCase().includes('frequency') ||
										response?.error?.error?.code === 80007
									) {
										error = 'An unknown exception has occurred. Please retry the request after some time.';
									}

									if (response == false) {
										error = 'Somthing went worng when trigger DripApp with sharing on WhatsApp Message,';
									} else if (response?.response?.status == 'success') {
										isTriggered = true;
										const whatsAppTriggerId = response.response.id;
										let retryCount = user.retryCount;
										if (user.status === 'Retrying') {
											retryCount = retryCount + 1;
										}
										[err, allDrips] = await to(
											CampWhatsAppEmailDrip.update(
												{
													retryCount: retryCount,
													errorMessage: null,
													isTriggered: true,
													WAppTriggerId: whatsAppTriggerId,
													WTriggerTime: moment().format(),
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									} else if (response?.response?.messages?.[0]?.message_status == 'accepted') {
										const whatsAppTriggerId = response?.response?.messages[0]?.id;
										let retryCount = user.retryCount;
										if (user.status === 'Retrying') {
											retryCount = retryCount + 1;
										}
										[err, allDrips] = await to(
											CampWhatsAppEmailDrip.update(
												{
													retryCount: retryCount,
													errorMessage: null,
													isTriggered: true,
													WAppTriggerId: whatsAppTriggerId,
													WTriggerTime: moment().format(),
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									}
								} else {
									error = 'Notification not sent because of missing variable';
								}

								if (error) {
									if (error === 'An unknown exception has occurred. Please retry the request after some time.') {
										let retryCount = user && user.retryCount ? user.retryCount : 0;
										retryCount++;
										[err, updateDrip] = await to(
											CampWhatsAppEmailDrip.update(
												{
													errorMessage: error,
													isTriggered: retryCount <= 2 ? false : true,
													retryCount: retryCount,
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									} else {
										[err, allDrips] = await to(
											CampWhatsAppEmailDrip.update(
												{
													isTriggered: true,
													errorMessage: error,
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									}
								} else if (response.success == false) {
									const errorDetail = response?.error?.error?.error_data?.details
										? response.error.error.error_data.details
										: JSON.stringify(response.error);

									[err, allDrips] = await to(
										CampWhatsAppEmailDrip.update(
											{
												isTriggered: true,
												errorMessage: errorDetail,
											},
											{
												where: {
													id: user.id,
												},
											}
										)
									);
								}
							} else {
								// 'User Mobile Number not found'
								phoneNotFindCampWhatsAppEmailDripIds.push(user.id);
							}
						} else {
							// 'User is Not Opt-In.'
							userNotOptInCampWhatsAppEmailDripIds.push(user.id);
						}
					}
				} else {
					// Template is not enabled
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						templateNotEnabledCampWhatsAppEmailDripIds.push(user.id);
					}
				}
			}
		}
		if (templateNotEnabledCampWhatsAppEmailDripIds.length > 0) {
			// Template is not enabled
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Template is not enabled.',
					},
					{
						where: {
							id: templateNotEnabledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (phoneNotFindCampWhatsAppEmailDripIds.length > 0) {
			// 'User Mobile Number not found'
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Mobile Number not found',
					},
					{
						where: {
							id: phoneNotFindCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (userNotOptInCampWhatsAppEmailDripIds.length > 0) {
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User is Not Opt-In.',
					},
					{
						where: {
							id: userNotOptInCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (whatsAPPcredentialsFiledCampWhatsAppEmailDripIds.length > 0) {
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Authentication failed due to invalid userId or password.',
					},
					{
						where: {
							id: whatsAPPcredentialsFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Drip WhatsappNatives---', error);
		return;
	}
};

const CheckAndUpdateWhatsAppVariableWithUSerData = async function (text, user, details = false, ticket = null) {
	try {
		let variableList = {
			'First Name': user.first && user.first != '' && user.first != null ? user.first : '',
			'Last Name': user.last && user.last != '' && user.last != null ? user.last : '',
			Country: user.country && user.country != '' && user.country != null ? user.country : '',
			State: user.state && user.state != '' && user.state != null ? user.state : '',
			City: user.city && user.city != '' && user.city != null ? user.city : '',
			'Job Role': user.job_role && user.job_role != '' && user.job_role != null ? user.job_role : '',

			//////////////// For Ticket/////////////////
			'Ticket Contact Name': ' ',
			'Ticket Created Date Time': ticket?.createdAt ? moment(ticket.createdAt).format('YYYY-MM-DDTHH:mm:ss[Z]') : '',
			'Ticket Query': ticket?.query ? ticket.query : '',
			'Ticket Id': ticket?.id ? ticket.id : '',
			'Ticket Comment': ticket?.comment ? ticket.comment : '',
			//////////////// For Ticket/////////////////
		};
		let forDetails = {};
		for (let i = 1; i <= 20; i++) {
			if (user.tags[i - 1]) {
				variableList[`Tag ${i}`] = user.tags[i - 1];
			} else {
				variableList[`Tag ${i}`] = '';
			}
		}

		//Add Custom Fields
		if (user.customFields && Object.keys(user.customFields).length > 0) {
			variableList = { ...variableList, ...user.customFields };
		}
		for (let variable in variableList) {
			if (text.includes(`{{${variable}}}`)) {
				if (variable == 'Ticket Contact Name') {
					// need to Get User First name and Last name
					if (ticket?.ContactId) {
						//Get User Personal Details
						[err, userDetails] = await to(
							User.findOne({
								where: {
									id: ticket.ContactId,
								},
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
								attributes: ['id', 'local_user_id'],
							})
						);

						if (userDetails) {
							[err, localUser] = await to(
								dbInstance[userDetails.Market.db_name].User_master.findOne({
									where: {
										id: userDetails.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);

							if (localUser) {
								forDetails[variable] = localUser.first + ' ' + localUser.last;
								text = text.replaceAll(`{{${variable}}}`, localUser.first + ' ' + localUser.last);
							}
						}
					}
				} else {
					forDetails[variable] = variableList[variable];
					text = text.replaceAll(`{{${variable}}}`, variableList[variable]);
				}
			}
		}
		if (details) {
			return forDetails;
		}
		return text;
	} catch (error) {
		console.log('---Error in CheckAndUpdateWhatsAppVariableWithUSerData---', error);
		return text;
	}
};
module.exports.CheckAndUpdateWhatsAppVariableWithUSerData = CheckAndUpdateWhatsAppVariableWithUSerData;

const CheckAndUpdateMeta_WhatsAppUserVariables = async function (text, user, details = false, ticket = null) {
	try {
		let variableList = {
			'First Name': user.first || '',
			'Last Name': user.last || '',
			Country: user.country || '',
			State: user.state || '',
			City: user.city || '',
			'Job Role': user.job_role || '',

			//////////////// For Ticket/////////////////
			'Ticket Contact Name': ' ',
			'Ticket Created Date Time': ticket?.createdAt ? moment(ticket.createdAt).format('YYYY-MM-DDTHH:mm:ss[Z]') : '',
			'Ticket Query': ticket?.query || '',
			'Ticket Id': ticket?.id || '',
			'Ticket Comment': ticket?.comment || '',
			//////////////// For Ticket/////////////////
		};

		for (let i = 1; i <= 20; i++) {
			variableList[`Tag ${i}`] = user.tags && user.tags[i - 1] ? user.tags[i - 1] : '';
		}

		if (user.customFields && Object.keys(user.customFields).length > 0) {
			variableList = { ...variableList, ...user.customFields };
		}

		let parameters = [];
		const matches = text.match(/{{(.*?)}}/g) || [];

		for (let i = 0; i < matches.length; i++) {
			let variableName = matches[i].replace('{{', '').replace('}}', '').trim();

			if (variableName === 'Ticket Contact Name' && ticket?.ContactId) {
				// Fetch user details for this variable
				[err, userDetails] = await to(
					User.findOne({
						where: { id: ticket.ContactId },
						include: [{ model: Market, attributes: ['db_name'] }],
						attributes: ['id', 'local_user_id'],
					})
				);

				if (userDetails) {
					[err, localUser] = await to(
						dbInstance[userDetails.Market.db_name].User_master.findOne({
							where: { id: userDetails.local_user_id },
							attributes: ['first', 'last'],
						})
					);

					if (localUser) {
						variableList['Ticket Contact Name'] = `${localUser.first} ${localUser.last}`;
					}
				}
			}

			// Prepare WhatsApp parameter object
			parameters.push({
				type: 'text',
				text: variableList[variableName] || '',
			});
		}

		return parameters;
	} catch (error) {
		console.log('---Error in CheckAndUpdateMeta_WhatsAppUserVariables---', error);
		return [];
	}
};
module.exports.CheckAndUpdateMeta_WhatsAppUserVariables = CheckAndUpdateMeta_WhatsAppUserVariables;

const runPostAssignShedulorForDripWhatsappNonNatives = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								required: true,
								drip_status: 'Published',
								include: [
									{
										model: Drip_whatsapp_non_native,
										include: [
											{
												model: WhatsAppSetup,
												required: true,
												where: {
													status: 'Active',
												},
												// attributes: [
												// 	'user_id',
												// 	'password',
												// 	'sendNtOptIn',
												// 	'isMeta',
												// 	'MTPNoId',
												// 	'MTToken',
												// 	'MTAccId',
												// 	'MTAppId',
												// ],
											},
										],
										required: true,
										attributes: [
											'id',
											'templateStatus',
											'tempName',
											'mediaId',
											'header_type',
											'headerFileName',
											'headerPath',
											'body',
											'footer',
											'type',
											'header_text',
											'longitude',
											'latitude',
											'locName',
											'address',
										],
									},
								],
								attributes: ['id', 'ClientId', 'tempType'],
							},
							{
								model: CampWhatsAppEmailDrip,
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'DripApp with sharing on WhatsApp',
								},
								required: true,
								attributes: ['id', 'retryCount', 'code', 'TicketId', 'status', 'errorMessage'],
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
										include: [
											{
												model: Market,
												attributes: ['id', 'db_name'],
											},
											{
												model: Country,
												attributes: ['callingCode'],
											},
											{ model: Client_job_role, through: 'User_job_role_mapping' },
										],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
				// logging: true
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}

		if (!allCampaign || allCampaign.length === 0) return;
		let templateNotEnabledCampWhatsAppEmailDripIds = [];
		let phoneNotFindCampWhatsAppEmailDripIds = [];
		let userNotOptInCampWhatsAppEmailDripIds = [];
		let whatsAPPcredentialsFiledCampWhatsAppEmailDripIds = [];
		let count = 0;
		let totalUserCount = 50000;
		for (let data of allCampaign) {
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_whatsapp_non_natives[0];
				if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
					totalUserCount = parseInt(CONFIG.random_quiz_throttled_count) * 600;
				} else {
					totalUserCount = parseInt(CONFIG.quiz_throttled_count) * 600;
				}

				if (postDetails.templateStatus === 'Enabled') {
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						if (count < totalUserCount) {
							let userData = user.User;
							//Check For Whats App OPT-In
							if (userData.opt_in || postDetails.WhatsAppSetup.sendNtOptIn || postDetails.WhatsAppSetup.isMeta) {
								[err, localUser] = await to(
									dbInstance[userData.Market.db_name].User_master.findOne({
										where: {
											id: userData.local_user_id,
										},
										attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
									})
								);
								if (err) console.log('---Error in get User Local Data----', err);
								if (localUser.phone != '' && localUser.phone != null) {
									let userPhone = `${userData.Country.callingCode}${localUser.phone}`;
									userPhone = userPhone.replace('+', '').replace('-', '');
									let error = '';
									let missingVariable = false;
									let response = '';
									//Send Msg

									let messageData = Object.assign({}, postDetails.convertToJSON());

									let userOtherData = {};
									userOtherData = localUser.convertToJSON();
									userOtherData.customFields = userData.customFields ? userData.customFields : {};
									if (userData.tags) {
										userOtherData.tags = userData.tags.split(',');
									} else {
										userOtherData.tags = [];
									}
									userOtherData.job_role = '';

									if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
										userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
									}

									if (messageData.header_text) {
										if (messageData?.WhatsAppSetup?.isMeta == false) {
											messageData.header_text = await CheckAndUpdateWhatsAppVariableWithUSerData(
												messageData.header_text,
												userOtherData,
												false
											);
										} else {
											messageData.header_text_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
												messageData.header_text,
												userOtherData,
												false
											);
										}

										if (messageData.header_text === false) {
											missingVariable = true;
										}
									}
									if (messageData.body) {
										if (messageData?.WhatsAppSetup?.isMeta == false) {
											messageData.body = await CheckAndUpdateWhatsAppVariableWithUSerData(
												messageData.body,
												userOtherData,
												false
											);
										} else {
											messageData.body_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
												messageData.body,
												userOtherData,
												false
											);
										}
										if (messageData.body === false) {
											missingVariable = true;
										}
									}

									if (missingVariable == false) {
										if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
											response = await throttledForSendWhatsAppNonNativeRandomQuizDrip(
												userPhone,
												messageData,
												user.code
											);
										} else if (
											dripCamp.Post.tempType === 'Quiz' ||
											dripCamp.Post.tempType === 'Poll' ||
											dripCamp.Post.tempType === 'Offline Task' ||
											dripCamp.Post.tempType === 'Survey'
										) {
											response = await throttledForSendWhatsAppNonNativeQuizDrip(userPhone, messageData, user.code);
										} else {
											response = await sendWhatsAppNonNativeDripNew(userPhone, messageData, user.code);
										}

										count++;
										console.log('------------WhatsappNonNative response----------', response);
										if (
											(response &&
												(response?.response?.details === 'Authentication failed due to invalid userId or password.' ||
													response?.response?.details === 'The method "SENDMESSAGE" is not supported.' ||
													response?.response?.id === '106' ||
													response?.response?.id === '102')) ||
											//Meta Errors
											(response?.success === false &&
												response?.error?.error &&
												(response?.error?.error?.code === 190 || // OAuth token expired / invalid
													(response?.error?.error?.type === 'OAuthException' &&
														(response?.error?.error?.message?.toLowerCase().includes('access token') ||
															response?.error?.error?.message?.toLowerCase().includes('authentication')))))
										) {
											whatsAPPcredentialsFiledCampWhatsAppEmailDripIds.push(user.id);
											const startDate = moment().format('YYYY-MM-DD') + 'T00:00:00.000Z';
											const endDate = moment().format('YYYY-MM-DD') + 'T23:59:59.000Z';
											[err, emailNotification] = await to(
												WhatsAppEmailNotifications.findOne({
													where: {
														ClientId: dripCamp.Post.ClientId,
														type: 'whatsapp',
														createdAt: {
															[Op.between]: [startDate, endDate],
														},
													},
													attributes: ['id'],
												})
											);
											if (err) return ResponseError(res, err, 500, true);
											if (!emailNotification) {
												let getClient;
												[err, getClient] = await to(
													Client.findOne({
														where: {
															id: dripCamp.Post.ClientId,
														},
														attributes: ['name'],
													})
												);

												if (getClient) {
													let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
													notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
													let userIds = await getAllProductOwnerIdsForNotification(dripCamp.Post.ClientId);
													await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
													const appBrandingData = await getClientAppBrandingByClientId(dripCamp.Post.ClientId);
													const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
													[err, getUser] = await to(
														User.findAll({
															where: {
																id: userIds,
															},
															attributes: ['local_user_id', 'MarketId'],
															include: [
																{
																	model: Market,
																	attributes: ['db_name'],
																},
															],
														})
													);
													if (err) return ResponseError(res, err, 500, true);

													let finalEmailList = [];
													for (let dataValue of getUser) {
														[err, localUser] = await to(
															dbInstance[dataValue.Market.db_name].User_master.findOne({
																where: {
																	id: dataValue.local_user_id,
																},
																attributes: ['first', 'last', 'email'],
															})
														);
														if (err) return ResponseError(res, err, 500, true);

														let personalisations = {};
														personalisations.to = localUser.email;
														if (personalisations.to != null && personalisations.to != '') {
															personalisations.dynamic_template_data = {
																first_name: localUser.first,
																client_name: getClient.name,
																client_signature: signature,
															};
															if (localUser.email) finalEmailList.push(personalisations);
														}
													}

													[err, emailNotification] = await to(
														WhatsAppEmailNotifications.create({
															ClientId: dripCamp.Post.ClientId,
															type: 'whatsapp',
														})
													);
													if (err) return ResponseError(res, err, 500, true);
													try {
														await notificationEmail(
															finalEmailList,
															'WhatsApp Account Login Filed',
															dripCamp.Post.ClientId,
															'drip'
														);
													} catch (error) {}
												}
											}
										} else if (
											response?.response?.details ===
												'An unknown exception has occurred. Please retry the request after some time.' ||
											response?.response?.id === '100' ||
											// meta errors
											response?.error?.error?.message?.toLowerCase().includes('rate') ||
											response?.error?.error?.message?.toLowerCase().includes('frequency') ||
											response?.error?.error?.code === 80007
										) {
											error = 'An unknown exception has occurred. Please retry the request after some time.';
										}
										if (response == false) {
											error = 'Somthing went worng when trigger DripApp with sharing on WhatsApp Message,';
										} else if (response?.response?.status == 'success') {
											isTriggered = true;
											const whatsAppTriggerId = response.response.id;
											let retryCount = user.retryCount;
											if (user.status === 'Retrying') {
												retryCount = retryCount + 1;
											}
											[err, allDrips] = await to(
												CampWhatsAppEmailDrip.update(
													{
														retryCount: retryCount,
														errorMessage: null,
														isTriggered: true,
														WAppTriggerId: whatsAppTriggerId,
														WTriggerTime: moment().format(),
													},
													{
														where: {
															id: user.id,
														},
													}
												)
											);
										} else if (response?.response?.messages?.[0]?.message_status == 'accepted') {
											const whatsAppTriggerId = response?.response?.messages[0]?.id;
											let retryCount = user.retryCount;
											if (user.status === 'Retrying') {
												retryCount = retryCount + 1;
											}
											[err, allDrips] = await to(
												CampWhatsAppEmailDrip.update(
													{
														retryCount: retryCount,
														errorMessage: null,
														isTriggered: true,
														WAppTriggerId: whatsAppTriggerId,
														WTriggerTime: moment().format(),
													},
													{
														where: {
															id: user.id,
														},
													}
												)
											);
										}
									} else {
										error = 'Notification not sent because of missing variable';
									}

									if (error) {
										if (error === 'An unknown exception has occurred. Please retry the request after some time.') {
											let retryCount = user && user.retryCount ? user.retryCount : 0;
											retryCount++;
											[err, updateDrip] = await to(
												CampWhatsAppEmailDrip.update(
													{
														errorMessage: error,
														isTriggered: retryCount <= 2 ? false : true,
														retryCount: retryCount,
													},
													{
														where: {
															id: user.id,
														},
													}
												)
											);
										} else {
											[err, allDrips] = await to(
												CampWhatsAppEmailDrip.update(
													{
														isTriggered: true,
														errorMessage: error,
													},
													{
														where: {
															id: user.id,
														},
													}
												)
											);
										}
									} else if (response.success == false) {
										const errorDetail = response?.error?.error?.error_data?.details
											? response.error.error.error_data.details
											: JSON.stringify(response.error);

										[err, allDrips] = await to(
											CampWhatsAppEmailDrip.update(
												{
													isTriggered: true,
													errorMessage: errorDetail,
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									}
								} else {
									// 'User Mobile Number not found'
									phoneNotFindCampWhatsAppEmailDripIds.push(user.id);
								}
							} else {
								// 'User is Not Opt-In.'
								userNotOptInCampWhatsAppEmailDripIds.push(user.id);
							}
						}
					}
				} else {
					// Template is not enabled
					if (data?.Drip_camps?.CampWhatsAppEmailDrips?.length > 0) {
						for (let user of data.Drip_camps.CampWhatsAppEmailDrips) {
							templateNotEnabledCampWhatsAppEmailDripIds.push(user.id);
						}
					}
				}
			}
		}
		if (templateNotEnabledCampWhatsAppEmailDripIds.length > 0) {
			// Template is not enabled
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Template is not enabled.',
					},
					{
						where: {
							id: templateNotEnabledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (phoneNotFindCampWhatsAppEmailDripIds.length > 0) {
			// 'User Mobile Number not found'
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Mobile Number not found',
					},
					{
						where: {
							id: phoneNotFindCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (userNotOptInCampWhatsAppEmailDripIds.length > 0) {
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User is Not Opt-In.',
					},
					{
						where: {
							id: userNotOptInCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (whatsAPPcredentialsFiledCampWhatsAppEmailDripIds.length > 0) {
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Authentication failed due to invalid userId or password.',
					},
					{
						where: {
							id: whatsAPPcredentialsFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Drip WhatsappNonNatives---', error);
		return;
	}
};

const runPostAssignShedulorForSendGridNonNativeEmail = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: Drip_email_non_native,
										required: true,
										attributes: ['id', 'email_subject_line', 'email_body', 'callToActionText', 'hyper_link'],
									},
									{
										model: Client,
										required: true,
										where: {
											useSendGrid: true,
										},
										attributes: ['id'],
									},
								],
								attributes: ['id', 'ClientId', 'tempType'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'retryCount', 'code'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'DripApp with sharing on Email',
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
										include: [
											{
												model: Market,
												attributes: ['id', 'db_name'],
											},
											{ model: Client_job_role, through: 'User_job_role_mapping' },
										],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}
		if (!allCampaign || allCampaign.length === 0) return;

		let emailErrorCampWhatsAppEmailDripIds = [];
		let emailFiledCampWhatsAppEmailDripIds = [];
		let errorCampWhatsAppEmailDripIds = [];
		let missingVariableCampWhatsAppEmailDripIds = [];
		let count = 0;
		let totalUserCount = 50000;
		for (let data of allCampaign) {
			const emailDetails = await getClientEmailConfigrationDetails(data.ClientId);
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_email_non_natives[0];
				if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
					totalUserCount = parseInt(CONFIG.random_quiz_throttled_count) * 600;
				} else {
					totalUserCount = parseInt(CONFIG.quiz_throttled_count) * 600;
				}
				//Send Email
				if (emailDetails) {
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						let personalisations = {};
						let emailData = [];
						if (count < totalUserCount) {
							let userData = user.User;
							[err, localUser] = await to(
								dbInstance[userData.Market.db_name].User_master.findOne({
									where: {
										id: userData.local_user_id,
									},
									attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
								})
							);
							if (err) console.log('---Error in get User Local Data----', err);
							if (localUser && localUser.email != '' && localUser.email != null) {
								//Check And Update Personalisation of user
								let missingVariable = false;
								let messageData = Object.assign({}, postDetails.convertToJSON());
								let userOtherData = {};
								userOtherData = localUser.convertToJSON();
								userOtherData.customFields = userData.customFields ? userData.customFields : {};
								if (userData.tags) {
									userOtherData.tags = userData.tags.split(',');
								} else {
									userOtherData.tags = [];
								}
								userOtherData.job_role = '';

								if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
									userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
								}

								if (messageData.email_subject_line) {
									messageData.email_subject_line = await CheckAndUpdateWhatsAppVariableWithUSerData(
										messageData.email_subject_line,
										userOtherData,
										false
									);
									if (messageData.email_subject_line === false) {
										missingVariable = true;
									}
								}
								if (messageData.email_body) {
									messageData.email_body = await CheckAndUpdateWhatsAppVariableWithUSerData(
										messageData.email_body,
										userOtherData,
										false
									);
									if (messageData.email_body === false) {
										missingVariable = true;
									}
								}
								if (missingVariable === false) {
									personalisations.to = localUser.email;
									if (personalisations.to != '') {
										personalisations.dynamic_template_data = {
											Subject: messageData.email_subject_line,
											Body: messageData.email_body,
											Button_Name: messageData.callToActionText,
											Button_URL: messageData.hyper_link,
										};
										if (user.code) {
											personalisations.dynamic_template_data.Button_URL = CONFIG.drip_host + '?drip_code=' + user.code;
										}
										emailData.push(personalisations);
										count++;
									}
									try {
										const emailD = await sendDripEmail(emailData, emailDetails);
										// console.log('---emailD---', emailD[0].toJSON());
										if (emailD && emailD[0]) {
											const EmailTriggerId = emailD[0].toJSON().headers['x-message-id'];
											[err, allDrips] = await to(
												CampWhatsAppEmailDrip.update(
													{
														isTriggered: true,
														EmailTriggerId: EmailTriggerId,
													},
													{
														where: {
															id: user.id,
														},
													}
												)
											);
										}
									} catch (error) {
										console.log('--trriger email--error--', error);
										// 'Somthing went worng when trigger DripApp with sharing on Email Message.'
										emailFiledCampWhatsAppEmailDripIds.push(user.id);
									}
								} else {
									missingVariableCampWhatsAppEmailDripIds.push(user.id);
								}
							} else {
								// 'User Email Address not found'
								emailErrorCampWhatsAppEmailDripIds.push(user.id);
							}
						}
					}
				} else {
					// Not fount Email Sender Details
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						errorCampWhatsAppEmailDripIds.push(user.id);
					}
				}
			}
		}

		if (emailErrorCampWhatsAppEmailDripIds.length > 0) {
			// User Email Address not found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Email Address not found',
					},
					{
						where: {
							id: emailErrorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (emailFiledCampWhatsAppEmailDripIds.length > 0) {
			// Somthing went worng when trigger DripApp with sharing on Email Message.
			const errorString = 'Somthing went worng when trigger DripApp with sharing on Email Message.';
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: errorString,
					},
					{
						where: {
							id: emailFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (errorCampWhatsAppEmailDripIds.length > 0) {
			// Not fount Email Sender Details
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Not fount Email Sender Details',
					},
					{
						where: {
							id: errorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		if (missingVariableCampWhatsAppEmailDripIds.length > 0) {
			// Missing Variable
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Email not sent because of missing variable',
					},
					{
						where: {
							id: missingVariableCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Email---', error);
		return;
	}
};

const runPostAssignShedulorForSendGridOnlyEmail = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: Drip_only_email,
										required: true,
										attributes: ['id', 'email_subject_line', 'email_body'],
									},
									{
										model: Client,
										required: true,
										where: {
											useSendGrid: true,
										},
										attributes: ['id'],
									},
								],
								attributes: ['id', 'ClientId', 'tempType'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'retryCount', 'code', 'TicketId'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'Only Email',
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
										include: [
											{
												model: Market,
												attributes: ['id', 'db_name'],
											},
											{ model: Client_job_role, through: 'User_job_role_mapping' },
										],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}
		if (!allCampaign || allCampaign.length === 0) return;
		console.log('--allCampaign--', allCampaign.length);
		let emailErrorCampWhatsAppEmailDripIds = [];
		let emailFiledCampWhatsAppEmailDripIds = [];
		let errorCampWhatsAppEmailDripIds = [];
		let missingVariableCampWhatsAppEmailDripIds = [];
		// let count = 0;
		// let totalUserCount = 50000;
		for (let data of allCampaign) {
			const emailDetails = await getClientEmailConfigrationDetails(data.ClientId);
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_only_emails[0];
				// if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
				// 	totalUserCount = parseInt(CONFIG.random_quiz_throttled_count) * 600;
				// } else {
				// 	totalUserCount = parseInt(CONFIG.quiz_throttled_count) * 600;
				// }
				//Send Email

				if (emailDetails) {
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						let personalisations = {};
						let emailData = [];
						// if (count < totalUserCount) {
						let userData = user.User;
						[err, localUser] = await to(
							dbInstance[userData.Market.db_name].User_master.findOne({
								where: {
									id: userData.local_user_id,
								},
								attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
							})
						);
						if (err) console.log('---Error in get User Local Data----', err);

						if (localUser && localUser.email != '' && localUser.email != null) {
							//Check And Update Personalisation of user
							let missingVariable = false;
							let messageData = Object.assign({}, postDetails.convertToJSON());
							let userOtherData = {};
							userOtherData = localUser.convertToJSON();
							userOtherData.customFields = userData.customFields ? userData.customFields : {};
							if (userData.tags) {
								userOtherData.tags = userData.tags.split(',');
							} else {
								userOtherData.tags = [];
							}
							userOtherData.job_role = '';

							if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
								userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
							}
							if (messageData.email_subject_line) {
								messageData.email_subject_line = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_subject_line,
									userOtherData,
									false
								);
								if (messageData.email_subject_line === false) {
									missingVariable = true;
								}
							}

							if (messageData.email_body) {
								messageData.email_body = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_body,
									userOtherData,
									false
								);
								if (messageData.email_body === false) {
									missingVariable = true;
								}
							}

							if (missingVariable === false) {
								personalisations.to = localUser.email;
								if (personalisations.to != '') {
									personalisations.dynamic_template_data = {
										Subject: messageData.email_subject_line,
										Body: messageData.email_body,
										// Button_Name: messageData.callToActionText,
										// Button_URL: messageData.hyper_link,
									};
									// if (user.code) {
									// 	personalisations.dynamic_template_data.Button_URL = CONFIG.drip_host + '?drip_code=' + user.code;
									// }
									emailData.push(personalisations);
									// count++;
								}
								try {
									const emailD = await sendOnlyEmailDrip(emailData, emailDetails);
									if (emailD && emailD[0]) {
										const EmailTriggerId = emailD[0].toJSON().headers['x-message-id'];
										[err, allDrips] = await to(
											CampWhatsAppEmailDrip.update(
												{
													isTriggered: true,
													EmailTriggerId: EmailTriggerId,
												},
												{
													where: {
														id: user.id,
													},
												}
											)
										);
									}
								} catch (error) {
									console.log('--trriger email--error--', error);
									// 'Somthing went worng when trigger DripApp with sharing on Email Message.'
									emailFiledCampWhatsAppEmailDripIds.push(user.id);
								}
							} else {
								missingVariableCampWhatsAppEmailDripIds.push(user.id);
							}
						} else {
							// 'User Email Address not found'
							emailErrorCampWhatsAppEmailDripIds.push(user.id);
						}
						// }
					}
				} else {
					// Not fount Email Sender Details
					for (let user of dripCamp.CampWhatsAppEmailDrips) {
						errorCampWhatsAppEmailDripIds.push(user.id);
					}
				}
			}
		}

		if (emailErrorCampWhatsAppEmailDripIds.length > 0) {
			// User Email Address not found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Email Address not found',
					},
					{
						where: {
							id: emailErrorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (emailFiledCampWhatsAppEmailDripIds.length > 0) {
			// Somthing went worng when trigger DripApp with sharing on Email Message.
			const errorString = 'Somthing went worng when trigger DripApp with sharing on Email Message.';
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: errorString,
					},
					{
						where: {
							id: emailFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (errorCampWhatsAppEmailDripIds.length > 0) {
			// Not fount Email Sender Details
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Not fount Email Sender Details',
					},
					{
						where: {
							id: errorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		if (missingVariableCampWhatsAppEmailDripIds.length > 0) {
			// Missing Variable
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Email not sent because of missing variable',
					},
					{
						where: {
							id: missingVariableCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Email---', error);
		return;
	}
};

const runPostAssignShedulorForBroadSideOnlyEmail = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		let limitToSendEmailAtATime = 500;

		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: Drip_only_email,
										required: true,
										attributes: [
											'id',
											'email_subject_line',
											'email_body',
											'brodEmailAssetPath',
											'brodEmailTemplatePath',
											'brodEmailAttachmentPath',
										],
									},
									{
										model: Client,
										required: true,
										where: {
											useSendGrid: false,
										},
										attributes: ['id'],
									},
								],
								attributes: ['id', 'ClientId', 'tempType'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'retryCount', 'code', 'TicketId'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'Only Email',
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
										include: [
											{
												model: Market,
												attributes: ['id', 'db_name'],
											},
											{ model: Client_job_role, through: 'User_job_role_mapping' },
										],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}
		if (!allCampaign || allCampaign.length === 0) return;
		let emailErrorCampWhatsAppEmailDripIds = [];
		let emailFiledCampWhatsAppEmailDripIds = [];
		let errorCampWhatsAppEmailDripIds = [];
		let missingVariableCampWhatsAppEmailDripIds = [];
		let accessTokenNotFount = [];
		let count = 0;
		let totalUserCount = 50000;
		//get Access Token
		const accessToken = await getBroadSideEmailAccessToken();
		for (let data of allCampaign) {
			// const emailDetails = await getClientEmailConfigrationDetails(data.ClientId);
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_only_emails[0];
				if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
					totalUserCount = parseInt(CONFIG.random_quiz_throttled_count) * 600;
				} else {
					totalUserCount = parseInt(CONFIG.quiz_throttled_count) * 600;
				}
				let sendEmailPayload = [];
				//Send Email
				// if (emailDetails) {
				const randomString = await generateRandomString(5);
				for (let user of dripCamp.CampWhatsAppEmailDrips) {
					let emailData = {
						to: '',
						body: '',
						subject: '',
						txId: randomString + '_' + user.id,
						params: {},
						cid: [],
						template: '',
						attachments: [],
					};
					if (count < totalUserCount) {
						let userData = user.User;
						[err, localUser] = await to(
							dbInstance[userData.Market.db_name].User_master.findOne({
								where: {
									id: userData.local_user_id,
								},
								attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
							})
						);
						if (err) console.log('---Error in get User Local Data----', err);
						if (localUser && localUser.email != '' && localUser.email != null) {
							//Check And Update Personalisation of user
							let missingVariable = false;
							let messageData = Object.assign({}, postDetails.convertToJSON());
							let userOtherData = {};
							userOtherData = localUser.convertToJSON();
							userOtherData.customFields = userData.customFields ? userData.customFields : {};
							if (userData.tags) {
								userOtherData.tags = userData.tags.split(',');
							} else {
								userOtherData.tags = [];
							}
							userOtherData.job_role = '';

							if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
								userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
							}

							if (messageData.email_subject_line) {
								let params = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_subject_line,
									userOtherData,
									true
								);
								if (Object.keys(params).length > 0) {
									emailData.params = params;
									for (let key in params) {
										let newKey = '{{' + key + '}}';
										let newUpdatedKey = '${' + key + '}';
										messageData.email_subject_line = messageData.email_subject_line.replace(newKey, newUpdatedKey);
									}
								}
								if (messageData.email_subject_line === false) {
									missingVariable = true;
								}
							}
							if (messageData.email_body) {
								let params = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_body,
									userOtherData,
									true
								);
								if (Object.keys(params).length > 0) {
									emailData.params = { ...emailData.params, ...params };
								}

								if (user.code) {
									// emailData.params['Drip Code'] = CONFIG.drip_host + '?drip_code=' + user.code;
									// emailData.params['Button Label'] = messageData.callToActionText;
								}
								if (messageData.email_body === false) {
									missingVariable = true;
								}
							}

							if (messageData.brodEmailAssetPath) {
								emailData.cid = messageData.brodEmailAssetPath;
							}

							if (messageData.brodEmailTemplatePath) {
								emailData.template = messageData.brodEmailTemplatePath;
							}

							if (messageData.brodEmailAttachmentPath) {
								emailData.attachments = messageData.brodEmailAttachmentPath;
							}

							if (!accessToken || accessToken == null) {
								accessTokenNotFount.push(user.id);
								continue;
							}

							if (missingVariable === false && accessToken) {
								if (localUser?.email) {
									emailData.to = localUser.email;
									emailData.body = messageData.email_body;
									emailData.subject = messageData.email_subject_line;
									count++;
								}

								if (emailData.cid && emailData.cid.length > 0) {
									for (let i = 0; i < emailData.cid.length; i++) {
										emailData.body = emailData.body.replace(emailData.cid[i].filePath, `cid:cid-${i}`);
									}
								}

								try {
									if (emailData.to == null || emailData.to == '') {
										emailErrorCampWhatsAppEmailDripIds.push(user.id);
										continue;
									}
									sendEmailPayload.push(emailData);
									if (sendEmailPayload.length >= limitToSendEmailAtATime) {
										console.log('------' + limitToSendEmailAtATime + ' Trigger Email Start at-----------', Date.now());
										const response = await sendDripBroadSideEmail(sendEmailPayload, accessToken);
										console.log('------' + limitToSendEmailAtATime + ' Trigger Email End at-----------', Date.now());
										//Clear Payload
										sendEmailPayload = [];
										await updateBrodsideEmailStatus(response, randomString);
									}
								} catch (error) {
									console.log('--trriger email--error--', error);
									// 'Somthing went worng when trigger DripApp with sharing on Email Message.'
									emailFiledCampWhatsAppEmailDripIds.push(user.id);
								}
							} else {
								missingVariableCampWhatsAppEmailDripIds.push(user.id);
							}
						} else {
							// 'User Email Address not found'
							emailErrorCampWhatsAppEmailDripIds.push(user.id);
						}
					}
				}

				if (sendEmailPayload.length > 0) {
					console.log('------Remaining Trigger Email START AT-----------', Date.now());
					const response = await sendDripBroadSideEmail(sendEmailPayload, accessToken);
					console.log('------Remaining Trigger Email END AT-----------', Date.now());
					//Clear Payload
					sendEmailPayload = [];
					await updateBrodsideEmailStatus(response, randomString);
				}
			}
		}

		if (emailErrorCampWhatsAppEmailDripIds.length > 0) {
			// User Email Address not found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Email Address not found',
					},
					{
						where: {
							id: emailErrorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (accessTokenNotFount.length > 0) {
			// Access Token Not Found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Access Token Not Found',
					},
					{
						where: {
							id: accessTokenNotFount,
						},
					}
				)
			);
		}
		if (emailFiledCampWhatsAppEmailDripIds.length > 0) {
			// Somthing went worng when trigger DripApp with sharing on Email Message.
			const errorString = 'Somthing went worng when trigger DripApp with sharing on Email Message.';
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: errorString,
					},
					{
						where: {
							id: emailFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (errorCampWhatsAppEmailDripIds.length > 0) {
			// Not fount Email Sender Details
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Not fount Email Sender Details',
					},
					{
						where: {
							id: errorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		if (missingVariableCampWhatsAppEmailDripIds.length > 0) {
			// Missing Variable
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Email not sent because of missing variable',
					},
					{
						where: {
							id: missingVariableCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Broadside Only Email---', error);
		return;
	}
};

const updateBrodsideEmailStatus = async function (emailTriggerResponse, randomString) {
	try {
		if (emailTriggerResponse && emailTriggerResponse.length > 0) {
			let successId = [];
			let errorId = [];
			for (let res of emailTriggerResponse) {
				if (res.success == 'true' || res.success == true) {
					successId.push(res.txId.split('_')[1]);
				} else {
					errorId.push(res.txId.split('_')[1]);
				}
			}
			// if (successId.length > 0) {
			// 	if (successId.length > 0) {
			// 		let successQuery = `UPDATE "CampWhatsAppEmailDrips" SET "isTriggered" = true, "EmailTriggerId" = '${randomString}' || '_' ||  id WHERE id IN (${successId.join(
			// 			','
			// 		)})`;
			// 		[successQueryUpdate] = await sequelize.query(successQuery);
			// 	}

			// 	if (errorId.length > 0) {
			// 		let errorQuery = `UPDATE "CampWhatsAppEmailDrips" SET "isTriggered" = true, "EmailTriggerId" = '${randomString}' || '_' ||  id, "errorMessage" = 'Somthing went worng when trigger DripApp with sharing on Email Message.' WHERE id IN (${errorId.join(
			// 			','
			// 		)})`;
			// 		[errorQueryUpdate] = await sequelize.query(errorQuery);
			// 	}
			// }

			if (successId.length > 0 || errorId.length > 0) {
				// If there are success IDs, update those records
				if (successId.length > 0) {
					let successQuery = `
					  UPDATE "CampWhatsAppEmailDrips"
					  SET "isTriggered" = true,
						  "EmailTriggerId" = CONCAT(:randomString, '_', "id")
					  WHERE "id" IN (:successIds);
					`;
					// Execute the success update query
					await sequelize.query(successQuery, {
						replacements: {
							randomString: randomString,
							successIds: successId,
						},
						type: Sequelize.QueryTypes.UPDATE,
					});
				}

				// If there are error IDs, update those records
				if (errorId.length > 0) {
					let errorQuery = `
					  UPDATE "CampWhatsAppEmailDrips"
					  SET "isTriggered" = true,
						  "EmailTriggerId" = CONCAT(:randomString, '_', "id"),
						  "errorMessage" = 'Something went wrong when triggering DripApp with sharing on Email Message.'
					  WHERE "id" IN (:errorIds);
					`;
					// Execute the error update query
					await sequelize.query(errorQuery, {
						replacements: {
							randomString: randomString,
							errorIds: errorId,
						},
						type: Sequelize.QueryTypes.UPDATE,
					});
				}
			}
		}
		return;
	} catch (error) {
		console.log('---Error in updateBrodsideEmailStatus---', error);
	}
};
const runPostAssignShedulorForBroadSideEmail = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		let limitToSendEmailAtATime = 500;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: Drip_email_non_native,
										required: true,
										attributes: [
											'id',
											'email_subject_line',
											'email_body',
											'callToActionText',
											'hyper_link',
											'brodEmailAssetPath',
											'brodEmailTemplatePath',
											'brodEmailAttachmentPath',
										],
									},
									{
										model: Client,
										required: true,
										where: {
											useSendGrid: false,
										},
										attributes: ['id'],
									},
								],
								attributes: ['id', 'ClientId', 'tempType'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'retryCount', 'code'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'DripApp with sharing on Email',
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id', 'local_user_id', 'CountryId', 'MarketId', 'opt_in', 'tags', 'customFields'],
										include: [
											{
												model: Market,
												attributes: ['id', 'db_name'],
											},
											{ model: Client_job_role, through: 'User_job_role_mapping' },
										],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}
		if (!allCampaign || allCampaign.length === 0) return;
		let emailErrorCampWhatsAppEmailDripIds = [];
		let emailFiledCampWhatsAppEmailDripIds = [];
		let errorCampWhatsAppEmailDripIds = [];
		let missingVariableCampWhatsAppEmailDripIds = [];
		let accessTokenNotFount = [];
		let count = 0;
		let totalUserCount = 50000;
		//get Access Token
		const accessToken = await getBroadSideEmailAccessToken();

		for (let data of allCampaign) {
			// const emailDetails = await getClientEmailConfigrationDetails(data.ClientId);
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.Drip_email_non_natives[0];
				if (dripCamp.Post.tempType === 'Quiz (Randomised)') {
					totalUserCount = parseInt(CONFIG.random_quiz_throttled_count) * 600;
				} else {
					totalUserCount = parseInt(CONFIG.quiz_throttled_count) * 600;
				}
				const randomString = await generateRandomString(5);
				let sendEmailPayload = [];
				//Send Email
				// if (emailDetails) {
				for (let user of dripCamp.CampWhatsAppEmailDrips) {
					let emailData = {
						to: '',
						body: '',
						subject: '',
						txId: randomString + '_' + user.id,
						params: {},
						cid: [],
						template: '',
						attachments: [],
					};
					if (count < totalUserCount) {
						let userData = user.User;
						[err, localUser] = await to(
							dbInstance[userData.Market.db_name].User_master.findOne({
								where: {
									id: userData.local_user_id,
								},
								attributes: ['id', 'email', 'phone', 'first', 'last', 'country', 'city', 'state'],
							})
						);
						if (err) console.log('---Error in get User Local Data----', err);
						if (localUser && localUser.email != '' && localUser.email != null) {
							//Check And Update Personalisation of user
							let missingVariable = false;
							let messageData = Object.assign({}, postDetails.convertToJSON());
							let userOtherData = {};
							userOtherData = localUser.convertToJSON();
							userOtherData.customFields = userData.customFields ? userData.customFields : {};
							if (userData.tags) {
								userOtherData.tags = userData.tags.split(',');
							} else {
								userOtherData.tags = [];
							}
							userOtherData.job_role = '';

							if (userData.Client_job_roles && userData.Client_job_roles.length > 0) {
								userOtherData.job_role = JSON.parse(JSON.stringify(userData.Client_job_roles[0])).job_rol;
							}

							if (messageData.email_subject_line) {
								let params = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_subject_line,
									userOtherData,
									true
								);
								if (Object.keys(params).length > 0) {
									emailData.params = params;
									for (let key in params) {
										let newKey = '{{' + key + '}}';
										let newUpdatedKey = '${' + key + '}';
										messageData.email_subject_line = messageData.email_subject_line.replace(newKey, newUpdatedKey);
									}
								}
								if (messageData.email_subject_line === false) {
									missingVariable = true;
								}
							}
							if (messageData.email_body) {
								let params = await CheckAndUpdateWhatsAppVariableWithUSerData(
									messageData.email_body,
									userOtherData,
									true
								);
								if (Object.keys(params).length > 0) {
									emailData.params = { ...params, ...emailData.params };
								}
								if (user.code) {
									let codeData = {};
									codeData['Drip Code'] = CONFIG.drip_host + '?drip_code=' + user.code;
									codeData['Button Label'] = messageData.callToActionText;
									emailData.params = { ...codeData, ...emailData.params };
								}
								if (messageData.email_body === false) {
									missingVariable = true;
								}

								console.log('---emailData.params---', emailData.params);
							}

							if (messageData.brodEmailAssetPath) {
								emailData.cid = messageData.brodEmailAssetPath;
							}

							if (messageData.brodEmailTemplatePath) {
								emailData.template = messageData.brodEmailTemplatePath;
							}

							if (messageData.brodEmailAttachmentPath) {
								emailData.attachments = messageData.brodEmailAttachmentPath;
							}

							if (!accessToken || accessToken == null) {
								accessTokenNotFount.push(user.id);
								continue;
							}

							if (missingVariable === false && accessToken) {
								if (localUser?.email) {
									emailData.to = localUser.email;
									emailData.body = messageData.email_body;
									emailData.subject = messageData.email_subject_line;
									count++;
								}

								if (emailData.cid && emailData.cid.length > 0) {
									for (let i = 0; i < emailData.cid.length; i++) {
										emailData.body = emailData.body.replace(emailData.cid[0].filePath, `cid:cid-${i}`);
									}
								}

								try {
									if (emailData.to == null || emailData.to == '') {
										emailErrorCampWhatsAppEmailDripIds.push(user.id);
										continue;
									}
									sendEmailPayload.push(emailData);
									if (sendEmailPayload.length >= limitToSendEmailAtATime) {
										console.log('------' + limitToSendEmailAtATime + ' Trigger Email Start at-----------', Date.now());
										const response = await sendDripBroadSideEmail(sendEmailPayload, accessToken);
										console.log('------' + limitToSendEmailAtATime + ' Trigger Email End at-----------', Date.now());
										//Clear Payload
										sendEmailPayload = [];
										await updateBrodsideEmailStatus(response, randomString);
									}
									// console.log('------1---------', emailData.txId, '--', Date.now());
									// const response = await sendDripBroadSideEmail(emailData, accessToken);
									// console.log('------2---------', emailData.txId, '--', Date.now());
								} catch (error) {
									console.log('--trriger email--error--', error);
									// 'Somthing went worng when trigger DripApp with sharing on Email Message.'
									emailFiledCampWhatsAppEmailDripIds.push(user.id);
								}
							} else {
								missingVariableCampWhatsAppEmailDripIds.push(user.id);
							}
						} else {
							// 'User Email Address not found'
							emailErrorCampWhatsAppEmailDripIds.push(user.id);
						}
					}
				}

				if (sendEmailPayload.length > 0) {
					console.log('------Remaining Trigger Email START AT-----------', Date.now());
					const response = await sendDripBroadSideEmail(sendEmailPayload, accessToken);
					console.log('------Remaining Trigger Email END AT-----------', Date.now());
					//Clear Payload
					sendEmailPayload = [];
					await updateBrodsideEmailStatus(response, randomString);
				}
				// } else {
				// 	// Not fount Email Sender Details
				// 	for (let user of dripCamp.CampWhatsAppEmailDrips) {
				// 		errorCampWhatsAppEmailDripIds.push(user.id);
				// 	}
				// }
			}
		}

		if (emailErrorCampWhatsAppEmailDripIds.length > 0) {
			// User Email Address not found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'User Email Address not found',
					},
					{
						where: {
							id: emailErrorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (accessTokenNotFount.length > 0) {
			// Access Token Not Found
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Access Token Not Found',
					},
					{
						where: {
							id: accessTokenNotFount,
						},
					}
				)
			);
		}
		if (emailFiledCampWhatsAppEmailDripIds.length > 0) {
			// Somthing went worng when trigger DripApp with sharing on Email Message.
			const errorString = 'Somthing went worng when trigger DripApp with sharing on Email Message.';
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: errorString,
					},
					{
						where: {
							id: emailFiledCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}

		if (errorCampWhatsAppEmailDripIds.length > 0) {
			// Not fount Email Sender Details
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Not fount Email Sender Details',
					},
					{
						where: {
							id: errorCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		if (missingVariableCampWhatsAppEmailDripIds.length > 0) {
			// Missing Variable
			[err, allDrips] = await to(
				CampWhatsAppEmailDrip.update(
					{
						isTriggered: true,
						errorMessage: 'Email not sent because of missing variable',
					},
					{
						where: {
							id: missingVariableCampWhatsAppEmailDripIds,
						},
					}
				)
			);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Email---', error);
		return;
	}
};

const getBroadSideEmailAccessToken = async function () {
	try {
		const url = `http://52.66.123.174:8081/login`;
		//Send BroadSide Email
		const form = new FormData();
		form.append('username', 'bablrin_api');
		form.append('password', 'DHgTSG39');
		const response = await axios.post(url, form);
		return response.data.token;
	} catch (error) {
		console.log('----error---', error);
		return null;
	}
};
const runPostAssignShedulorForNative = async function (todayDate, flow_type, forTest) {
	try {
		[err, allDrips] = await to(
			CampWhatsAppEmailDrip.update(
				{
					isTriggered: true,
				},
				{
					where: {
						publishOn: {
							[Op.lte]: todayDate,
						},
						isTriggered: false,
						CampaignId: {
							[Op.ne]: null,
						},
						PostId: {
							[Op.ne]: null,
						},
						UserId: {
							[Op.ne]: null,
						},
						campaignPaused: false,
						dripType: 'Only DripApp',
					},
					include: [
						{
							model: Campaign,
							attributes: ['id'],
							where: {
								flowType: flow_type,
							},
							required: true,
						},
						{
							model: Drip_camp,
							required: true,
							include: [
								{
									model: Post,
									drip_status: 'Published',
									required: true,
									include: [
										{
											model: Drip_native,
											required: true,
										},
									],
								},
							],
						},
						{
							model: User,
							where: {
								is_deleted: false,
								status: true,
								cStatus: 'Active',
								is_archive: false,
							},
						},
					],
				}
			)
		);
		if (err) console.log('----Error when update CampWhatsAppEmailDrip--', err);

		[err, allDrips] = await to(
			CampWhatsAppEmailDrip.update(
				{
					isTriggered: true,
					errorMessage: 'Drip is Deleted',
				},
				{
					where: {
						publishOn: {
							[Op.lte]: todayDate,
						},
						isTriggered: false,
						CampaignId: {
							[Op.ne]: null,
						},
						PostId: {
							[Op.ne]: null,
						},
						UserId: {
							[Op.ne]: null,
						},
						campaignPaused: false,
						dripType: 'Only DripApp',
					},
					include: [
						{
							model: Drip_camp,
							required: true,
							include: [
								{
									model: Post,
									required: true,
									drip_status: 'Deleted',
									include: [
										{
											model: Drip_native,
											required: true,
										},
									],
								},
							],
						},
						{
							model: User,
							where: {
								is_deleted: false,
								status: true,
								cStatus: 'Active',
								is_archive: false,
							},
						},
					],
				}
			)
		);
		if (err) console.log('----Error when update CampWhatsAppEmailDrip--', err);
		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Native---', error);
		return;
	}
};

const runPostAssignShedulorForOnlyTeams = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: DripOnlyTeam,
										required: true,
										// attributes: ['id', 'email_subject_line', 'email_body', 'callToActionText', 'hyper_link'],
										include: [{ model: TeamSetup }],
									},
								],
								attributes: ['id', 'ClientId'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'code'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'Only Teams',
									errorMessage: {
										[Op.eq]: null,
									},
									isChannelMsg: false,
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: [
											'id',
											'local_user_id',
											'CountryId',
											'MarketId',
											'opt_in',
											'tags',
											'customFields',
											'team_id',
										],
										include: [{ model: TeamChatDetail }],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}

		if (!allCampaign || allCampaign.length === 0) return;
		let accessTokenNotFoundError = [];
		let userNotSignInIntoMicrosoftTeamError = [];
		let chatDetailsNotFound = [];
		let contactTeamUserIdNotFound = [];
		for (let data of allCampaign) {
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.DripOnlyTeams[0];
				const teamUserToken = postDetails.TeamSetup;
				//get Access_token by using Refresh Token and Save new Access Token

				const accessTokenDetail = await renewAccessToken(teamUserToken);
				for (let user of dripCamp.CampWhatsAppEmailDrips) {
					if (!accessTokenDetail) {
						//Add Error
						accessTokenNotFoundError.push(user.id);
						continue;
					}

					if (!teamUserToken) {
						//Add Error
						userNotSignInIntoMicrosoftTeamError.push(user.id);
						continue;
					}
					const teamUserId = user.User.team_id;
					if (!teamUserId || teamUserId == '' || teamUserId == null) {
						contactTeamUserIdNotFound.push(user.id);
						continue;
					}

					//Get Chat Id By using Team User Id
					let chatId;
					if (user?.User?.TeamChatDetails?.length > 0) {
						for (let chat of user.User.TeamChatDetails) {
							chat = chat.convertToJSON();
							if (chat.TeamSetu === postDetails.TeamSetupId) {
								chatId = chat.chat_id;
								break;
							}
						}
					}

					if (chatId) {
						//Send Team Message
						const response = await sendMicrosoftTeamsMessage(
							postDetails,
							chatId,
							accessTokenDetail.accessToken,
							user.code
						);

						if (response && response.id) {
							//Update Status and Message Id
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update(
									{
										TeamTiggerId: response.id,
										isTriggered: true,
										WTriggerTime: moment().format(),
									},
									{ where: { id: user.id } }
								)
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 1---', err);
							}
						} else if (response && response.error) {
							//Save Error into Database
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update({ errorMessage: response.error.message }, { where: { id: user.id } })
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 2---', err);
							}
						} else {
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update({ errorMessage: 'Something went wrong.' }, { where: { id: user.id } })
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 3---', err);
							}
						}
					} else {
						//Add Error
						chatDetailsNotFound.push(user.id);
					}
				}
			}
		}

		//Error update into Database
		if (accessTokenNotFoundError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Access Token not found.' },
					{ where: { id: accessTokenNotFoundError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 5---', err);
			}
		}

		if (userNotSignInIntoMicrosoftTeamError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'User not sign in into the microsoft team.' },
					{ where: { id: userNotSignInIntoMicrosoftTeamError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 6---', err);
			}
		}

		if (chatDetailsNotFound.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Chat details not found.' },
					{ where: { id: chatDetailsNotFound } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 4---', err);
			}
		}

		if (contactTeamUserIdNotFound.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Team user id not found.' },
					{ where: { id: contactTeamUserIdNotFound } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 7---', err);
			}
		}

		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Only Teams---', error);
		return;
	}
};

const runOnlyTeamsChannelMessage = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: DripOnlyTeam,
										required: true,
										// attributes: ['id', 'email_subject_line', 'email_body', 'callToActionText', 'hyper_link'],
										include: [{ model: TeamSetup }],
									},
								],
								attributes: ['id', 'ClientId'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'code'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'Only Teams',
									errorMessage: {
										[Op.eq]: null,
									},
									isChannelMsg: true,
								},
								include: [{ model: TeamChannel, required: true }],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}

		if (!allCampaign || allCampaign.length === 0) return;

		let accessTokenNotFoundError = [];
		let userNotSignInIntoMicrosoftTeamError = [];
		let channeldetailsNotFound = [];
		let teamSetupNotFoundDripCampIds = [];
		for (let data of allCampaign) {
			// Get TeamId and Channel Id
			for (let dripCamp of data.Drip_camps) {
				let accessTokenDetail;
				const postDetails = dripCamp.Post.DripOnlyTeams[0];
				const teamUserToken = postDetails.TeamSetup;
				//get Access_token by using Refresh Token and Save new Access Token
				if (teamUserToken) {
					accessTokenDetail = await renewAccessToken(teamUserToken);
				} else {
					teamSetupNotFoundDripCampIds.push(dripCamp.id);
					continue;
				}
				for (let user of dripCamp.CampWhatsAppEmailDrips) {
					if (!accessTokenDetail) {
						//Add Error
						accessTokenNotFoundError.push(user.id);
						continue;
					}

					if (!teamUserToken) {
						//Add Error
						userNotSignInIntoMicrosoftTeamError.push(user.id);
						continue;
					}

					if (!user?.TeamChannel || !user?.TeamChannel?.team_id || !user?.TeamChannel?.channel_id) {
						channeldetailsNotFound.push(user.id);
						continue;
					}

					//Send Team channel  Message
					const response = await sendMicrosoftTeamsChannelMessage(
						postDetails,
						user.TeamChannel.team_id,
						user.TeamChannel.channel_id,
						accessTokenDetail.accessToken,
						user.code
					);

					if (response && response.id) {
						//Update Status and Message Id
						[err, updateDetails] = await to(
							CampWhatsAppEmailDrip.update({ TeamTiggerId: response.id, isTriggered: true }, { where: { id: user.id } })
						);
						if (err) {
							console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 1---', err);
						}
					} else if (response && response.error) {
						//Save Error into Database
						[err, updateDetails] = await to(
							CampWhatsAppEmailDrip.update({ errorMessage: response.error.message }, { where: { id: user.id } })
						);
						if (err) {
							console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 2---', err);
						}
					} else {
						[err, updateDetails] = await to(
							CampWhatsAppEmailDrip.update({ errorMessage: 'Something went wrong.' }, { where: { id: user.id } })
						);
						if (err) {
							console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 3---', err);
						}
					}
				}
			}
		}

		//Error update into Database
		if (accessTokenNotFoundError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Access Token not found.' },
					{ where: { id: accessTokenNotFoundError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 5---', err);
			}
		}

		if (userNotSignInIntoMicrosoftTeamError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'User not sign in into the microsoft team.' },
					{ where: { id: userNotSignInIntoMicrosoftTeamError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 6---', err);
			}
		}

		if (channeldetailsNotFound.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Channel Details not found.' },
					{ where: { id: channeldetailsNotFound } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 7---', err);
			}
		}

		if (teamSetupNotFoundDripCampIds.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Team Setup not found.' },
					{ where: { DripCampId: teamSetupNotFoundDripCampIds } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 7---', err);
			}
		}

		return;
	} catch (error) {
		console.log('---Error in Run Only Teams Channel Message---', error);
	}
};

const runPostAssignShedulorForDripWithTeams = async function (todayDate, flow_type, forTest) {
	try {
		let allCampaign;
		[err, allCampaign] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					flowType: flow_type,
					forTest: forTest,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: true,
								include: [
									{
										model: DripSharingOnTeam,
										required: true,
										// attributes: ['id', 'email_subject_line', 'email_body', 'callToActionText', 'hyper_link'],
										include: [{ model: TeamSetup }],
									},
								],
								attributes: ['id', 'ClientId'],
							},
							{
								model: CampWhatsAppEmailDrip,
								required: true,
								attributes: ['id', 'code'],
								where: {
									publishOn: {
										[Op.lte]: todayDate,
									},
									isTriggered: false,
									CampaignId: {
										[Op.ne]: null,
									},
									UserId: {
										[Op.ne]: null,
									},
									campaignPaused: false,
									dripType: 'DripApp with sharing on Teams',
									errorMessage: {
										[Op.eq]: null,
									},
									isChannelMsg: false,
								},
								include: [
									{
										model: User,
										where: {
											is_deleted: false,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: [
											'id',
											'local_user_id',
											'CountryId',
											'MarketId',
											'opt_in',
											'tags',
											'customFields',
											'team_id',
										],
										include: [{ model: TeamChatDetail }],
									},
								],
							},
						],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'ClientId'],
			})
		);
		if (err) {
			console.log('----Error when get allCampaign--', err);
			return;
		}

		if (!allCampaign || allCampaign.length === 0) return;
		let accessTokenNotFoundError = [];
		let userNotSignInIntoMicrosoftTeamError = [];
		let chatDetailsNotFound = [];
		let contactTeamUserIdNotFound = [];
		for (let data of allCampaign) {
			for (let dripCamp of data.Drip_camps) {
				const postDetails = dripCamp.Post.DripSharingOnTeams[0];
				const teamUserToken = postDetails.TeamSetup;
				//get Access_token by using Refresh Token and Save new Access Token

				const accessTokenDetail = await renewAccessToken(teamUserToken);
				for (let user of dripCamp.CampWhatsAppEmailDrips) {
					if (!accessTokenDetail) {
						accessTokenNotFoundError.push(user.id);
						continue;
					}

					if (!teamUserToken) {
						userNotSignInIntoMicrosoftTeamError.push(user.id);
						continue;
					}
					const teamUserId = user.User.team_id;

					if (!teamUserId || teamUserId == '' || teamUserId == null) {
						contactTeamUserIdNotFound.push(user.id);
						continue;
					}

					//Get Chat Id By using Team User Id
					let chatId;
					if (user?.User?.TeamChatDetails?.length > 0) {
						for (let chat of user.User.TeamChatDetails) {
							chat = chat.convertToJSON();
							if (chat.TeamSetu === postDetails.TeamSetupId) {
								chatId = chat.chat_id;
								break;
							}
						}
					}

					if (chatId) {
						//Send Team Message
						const response = await sendMicrosoftTeamsMessage(
							postDetails,
							chatId,
							accessTokenDetail.accessToken,
							user.code
						);

						if (response && response.id) {
							//Update Status and Message Id
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update(
									{
										TeamTiggerId: response.id,
										isTriggered: true,
										WTriggerTime: moment().format(),
									},
									{ where: { id: user.id } }
								)
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 1---', err);
							}
						} else if (response && response.error) {
							//Save Error into Database
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update({ errorMessage: response.error.message }, { where: { id: user.id } })
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 2---', err);
							}
						} else {
							[err, updateDetails] = await to(
								CampWhatsAppEmailDrip.update({ errorMessage: 'Something went wrong.' }, { where: { id: user.id } })
							);
							if (err) {
								console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 3---', err);
							}
						}
					} else {
						//Add Error
						chatDetailsNotFound.push(user.id);
					}
				}
			}
		}

		//Error update into Database
		if (accessTokenNotFoundError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Access Token not found.' },
					{ where: { id: accessTokenNotFoundError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 5---', err);
			}
		}

		if (userNotSignInIntoMicrosoftTeamError.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'User not sign in into the microsoft team.' },
					{ where: { id: userNotSignInIntoMicrosoftTeamError } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 6---', err);
			}
		}

		if (chatDetailsNotFound.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Chat details not found.' },
					{ where: { id: chatDetailsNotFound } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 4---', err);
			}
		}

		if (contactTeamUserIdNotFound.length > 0) {
			[err, updateDetails] = await to(
				CampWhatsAppEmailDrip.update(
					{ errorMessage: 'Team user id not found.' },
					{ where: { id: contactTeamUserIdNotFound } }
				)
			);
			if (err) {
				console.log('---Error in Update CampWhatsAppEmailDrip in to send only Team Message 7---', err);
			}
		}

		return;
	} catch (error) {
		console.log('---Error in Run Post Assign Shedulor For Drip With Teams---', error);
		return;
	}
};

// To take Action by using Scheduler
const runCampaignTakeActionShedular = async function (flow_type) {
	try {
		const todayDate = new Date();
		[err, allTakenActionData] = await to(
			CampTakeAction.findAll({
				where: {
					isTriggered: false,
					campaignPaused: false,
					takeActionOn: {
						[Op.lte]: todayDate,
					},
					actionType: ['Unlicense learner', 'Add to group', 'Delete from group', 'Add Tag', 'Delete Tag'],
				},
				attributes: ['id'],
				include: [
					{
						model: Campaign,
						attributes: ['id'],
						where: {
							flowType: flow_type,
						},
						required: true,
					},
				],
			})
		);
		if (err) console.log('--Error at get all Take Action Data--1', err);
		if (!allTakenActionData || allTakenActionData.length === 0) return;
		let ids = [];
		for (let takeAction of allTakenActionData) {
			ids.push(takeAction.id);
		}
		await runCampaignTakeActionShedularForAddAndDeleteTag(todayDate, flow_type);
		await runCampaignTakeActionShedularForUnlicenseLearner(todayDate, flow_type);
		await runCampaignTakeActionShedularForDeleteFromGroup(todayDate, flow_type);
		await runCampaignTakeActionShedularForAddInGroup(todayDate, flow_type);

		[err, updateTakAction] = await to(
			CampTakeAction.update(
				{
					isTriggered: true,
				},
				{
					where: {
						id: ids,
					},
				}
			)
		);
		await baseOnpreviseAction(flow_type);
		await updateCampaignStaus(flow_type);
		return;
	} catch (error) {
		console.log('---Error in Run Campaign Taken Action Shedular---', error);
	}
};

const runCampaignTakeActionShedularForAddInGroup = async function (todayDate, flow_type) {
	try {
		let allTakenActionData;
		[err, allTakenActionData] = await to(
			CampTakeAction.findAll({
				where: {
					isTriggered: false,
					campaignPaused: false,
					takeActionOn: {
						[Op.lte]: todayDate,
					},
					actionType: 'Add to group',
				},
				include: [
					{
						model: Campaign,
						attributes: ['id'],
						where: {
							flowType: flow_type,
						},
						required: true,
					},
					{
						model: Drip_camp,
						include: [
							{
								model: User_group,
								through: 'DripCampUserGroupAction',
								attributes: ['id'],
							},
						],
						attributes: ['id'],
					},
					{
						model: User,
						where: {
							status: true,
							is_archive: false,
							cStatus: 'Active',
						},
						attributes: ['id'],
					},
				],
				attributes: ['id', 'UserId'],
			})
		);
		if (err) console.log('--Error at get all Take Action Data--2', err);
		if (!allTakenActionData || allTakenActionData.length === 0) return;

		let groupIds = [];
		let groupObject = [];
		for (let takeAction of allTakenActionData) {
			if (
				takeAction.Drip_camp &&
				takeAction.Drip_camp.User_groups &&
				takeAction.Drip_camp.User_groups[0] &&
				takeAction.Drip_camp.User_groups[0].id
			) {
				for (let group of takeAction.Drip_camp.User_groups) {
					let groupId = group.id;
					if (groupIds.includes(groupId)) {
						let index = groupIds.indexOf(groupId);
						if (!groupObject[index].userIds.includes(takeAction.User.id))
							groupObject[index].userIds.push(takeAction.User.id);
					} else {
						groupIds.push(groupId);
						groupObject.push({
							GroupId: groupId,
							userIds: [takeAction.User.id],
						});
					}
				}
			}
		}

		for (let data of groupObject) {
			let count = 0;
			[err, checkGroup] = await to(
				User_group_mapping.findAll({
					where: {
						UserGroupId: data.GroupId,
						UserId: data.userIds,
					},
					attributes: ['UserId'],
				})
			);
			if (err) console.log('----error check  Group--', err);
			let groupUserId = [];
			let userGroupMappingData = [];
			let takeActionUser = [];
			for (let value of checkGroup) {
				groupUserId.push(value.UserId);
			}
			for (let user of data.userIds) {
				if (!groupUserId.includes(user)) {
					userGroupMappingData.push({
						UserGroupId: data.GroupId,
						UserId: user,
					});
					takeActionUser.push(user);
					count++;
				}
			}
			if (userGroupMappingData.length > 0) {
				[err, addUserGroup] = await to(User_group_mapping.bulkCreate(userGroupMappingData));
				if (err) console.log('----error add user into User Group--', err);

				await learnerAddedIntoGroupCampaignStartRule(data.GroupId, takeActionUser);
			}
			[err, getUserGroup] = await to(
				User_group.findOne({
					where: {
						id: data.GroupId,
					},
					attributes: ['userCount'],
				})
			);
			if (err) console.log('----error getUserGroup--', err);
			if (getUserGroup) {
				[err, updateUserGroup] = await to(
					User_group.update(
						{
							userCount: getUserGroup.userCount + count,
						},
						{
							where: {
								id: data.GroupId,
							},
						}
					)
				);
				if (err) console.log('----error updateUserGroup --', err);
			}
		}
		return;
	} catch (error) {
		console.log('---Error in Run Campaign Taken Action Shedular for add in group---', error);
		return;
	}
};

const runCampaignTakeActionShedularForDeleteFromGroup = async function (todayDate, flow_type) {
	try {
		let allTakenActionData;
		[err, allTakenActionData] = await to(
			CampTakeAction.findAll({
				where: {
					isTriggered: false,
					campaignPaused: false,
					takeActionOn: {
						[Op.lte]: todayDate,
					},
					actionType: 'Delete from group',
				},
				include: [
					{
						model: Campaign,
						attributes: ['id'],
						where: {
							flowType: flow_type,
						},
						required: true,
					},
					{
						model: Drip_camp,
						include: [
							{
								model: User_group,
								through: 'DripCampUserGroupAction',
								attributes: ['id'],
							},
						],
						attributes: ['id'],
					},
					{
						model: User,
						where: {
							status: true,
							is_archive: false,
							cStatus: 'Active',
						},
						attributes: ['id'],
					},
				],
				attributes: ['id', 'UserId'],
			})
		);
		if (err) console.log('--Error at get all Take Action Data--3', err);
		if (!allTakenActionData || allTakenActionData.length === 0) return;

		let groupIds = [];
		let groupObject = [];
		for (let takeAction of allTakenActionData) {
			if (
				takeAction.Drip_camp &&
				takeAction.Drip_camp.User_groups &&
				takeAction.Drip_camp.User_groups[0] &&
				takeAction.Drip_camp.User_groups[0].id
			) {
				for (let group of takeAction.Drip_camp.User_groups) {
					let groupId = group.id;
					if (groupIds.includes(groupId)) {
						let index = groupIds.indexOf(groupId);
						if (!groupObject[index].userIds.includes(takeAction.User.id))
							groupObject[index].userIds.push(takeAction.User.id);
					} else {
						groupIds.push(groupId);
						groupObject.push({
							GroupId: groupId,
							userIds: [takeAction.User.id],
						});
					}
				}
			}
		}

		for (let data of groupObject) {
			[err, deleteUserGroup] = await to(
				User_group_mapping.destroy({
					where: {
						UserId: data.userIds,
						UserGroupId: data.GroupId,
					},
				})
			);
			if (err) console.log('----error Delete user into User Group--', err);
			[err, getUserGroup] = await to(
				User_group.findOne({
					where: {
						id: data.GroupId,
					},
					attributes: ['userCount'],
				})
			);
			if (err) console.log('----error getUserGroup--', err);
			if (getUserGroup) {
				[err, updateUserGroup] = await to(
					User_group.update(
						{
							userCount: getUserGroup.userCount - data.userIds.length,
						},
						{
							where: {
								id: data.GroupId,
							},
						}
					)
				);
				if (err) console.log('----error updateUserGroup --', err);
			}
		}
		return;
	} catch (error) {
		console.log('---Error in Run Campaign Taken Action Shedular for delete from group---', error);
		return;
	}
};

const runCampaignTakeActionShedularForUnlicenseLearner = async function (todayDate, flow_type) {
	try {
		let allTakenActionData;
		[err, allTakenActionData] = await to(
			CampTakeAction.findAll({
				where: {
					isTriggered: false,
					campaignPaused: false,
					takeActionOn: {
						[Op.lte]: todayDate,
					},
					actionType: 'Unlicense learner',
				},
				include: [
					{
						model: Campaign,
						attributes: ['id'],
						where: {
							flowType: flow_type,
						},
						required: true,
					},
					{
						model: User,
						where: {
							status: true,
							is_archive: false,
							cStatus: 'Active',
						},
						attributes: ['id'],
					},
				],
				attributes: ['ClientId'],
			})
		);
		if (err) console.log('--Error at get all Take Action Data--4', err);
		if (!allTakenActionData || allTakenActionData.length === 0) return;

		let userIds = [];
		let clientIds = [];
		let clientIdObject = [];
		for (let takeAction of allTakenActionData) {
			userIds.push(takeAction.User.id);
			if (clientIds.includes(takeAction.ClientId)) {
				let index = clientIds.indexOf(takeAction.ClientId);
				clientIdObject[index].count = clientIdObject[index].count + 1;
			} else {
				clientIds.push(takeAction.ClientId);
				clientIdObject.push({
					ClientId: takeAction.ClientId,
					count: 1,
				});
			}
		}
		[err, updateUser] = await to(
			User.update(
				{
					cStatus: 'Unlicensed',
				},
				{
					where: {
						id: userIds,
					},
				}
			)
		);
		if (err) console.log('----Error update User Archive--');

		for (let client of clientIdObject) {
			await removeLearnerCount(client.ClientId, client.count);
		}
		return;
	} catch (error) {
		console.log('---Error in Run Campaign Taken Action Shedular for Unlicense Learner---', error);
		return;
	}
};

const runCampaignTakeActionShedularForAddAndDeleteTag = async function (todayDate, flow_type) {
	try {
		let allTakenActionData;
		[err, allTakenActionData] = await to(
			CampTakeAction.findAll({
				where: {
					isTriggered: false,
					campaignPaused: false,
					takeActionOn: {
						[Op.lte]: todayDate,
					},
					actionType: ['Add Tag', 'Delete Tag'],
				},
				include: [
					{
						model: Campaign,
						attributes: ['id'],
						where: {
							flowType: flow_type,
						},
						required: true,
					},
					{
						model: User,
						where: {
							status: true,
							is_archive: false,
							cStatus: 'Active',
						},
						attributes: ['id', 'tags'],
					},
				],
				attributes: [
					'id',
					'tagsForAction',
					'actionType',
					'ClientId',
					'UserId',
					'DripCampIndex',
					'CampaignId',
					'DripCampId',
				],
			})
		);
		if (err) console.log('--Error at get all Take Action Data--5', err);

		if (!allTakenActionData || allTakenActionData.length === 0) return;

		for (let takeAction of allTakenActionData) {
			if (takeAction.actionType == 'Add Tag') {
				[err, getTag] = await to(
					User.findOne({
						where: {
							id: takeAction.User.id,
						},
						attributes: ['tags', 'id'],
					})
				);
				let userTag = getTag.tags;
				let addTag = takeAction.tagsForAction;
				if (userTag) {
					userTag = userTag.split(',');
					addTag = addTag.split(',');
					userTag = [userTag, ...addTag];
				} else {
					userTag = addTag;
				}

				[err, updateTag] = await to(
					User.update(
						{
							tags: userTag.toString(),
						},
						{
							where: {
								id: takeAction.User.id,
							},
						}
					)
				);
				if (err) console.log('----Error update User Tag--');
				await learnerAddedTagsCampaignStartRule(userTag.toString(), takeAction.ClientId, takeAction.User.id);
			} else if (takeAction.actionType == 'Delete Tag') {
				[err, getTag] = await to(
					User.findOne({
						where: {
							id: takeAction.User.id,
						},
						attributes: ['tags'],
					})
				);
				let userTag = getTag.tags;
				let deleteTag = takeAction.tagsForAction;
				if (userTag) {
					let userTagArray = userTag.split(',');
					deleteTag = deleteTag.split(',');
					let finalArray = [];
					for (let value of userTagArray) {
						if (!deleteTag.includes(value)) {
							finalArray.push(value);
						}
					}
					userTag = finalArray.toString();
				} else {
					userTag = null;
				}

				[err, updateTag] = await to(
					User.update(
						{
							tags: userTag,
						},
						{
							where: {
								id: takeAction.User.id,
							},
						}
					)
				);
				if (err) console.log('----Error Delete User Tag--');
			}
		}
		return;
	} catch (error) {
		console.log('---Error in Run Campaign Taken Action Shedular for add and delete tag---', error);
		return;
	}
};

const dripNotReadOrNotTackActionShedular = async function (flow_type) {
	console.log('dripNotReadOrNotTackActionShedular...............', moment().format());
	try {
		[err, campaignDetail] = await to(
			Campaign.findAll({
				where: {
					isDeleted: false,
					status: 'Running',
					flowType: flow_type,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							userAction: [
								'Drip Action not taken',
								'Not read on drip app',
								'Not read on channel',
								'Drip submit Action not taken',
							],
						},
						attributes: [
							'id',
							'userAction',
							'dripActionEndDate',
							'dependencyDripIndex',
							'sendAfter',
							'index',
							'actionType',
							'unAssignDayCount',
							'dripType',
						],
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: false,
								attributes: ['id'],
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		// Delivered Delivering Performed Performing
		if (err) {
			console.log('-----Error Get Campaign Details at Check Read Action By Learner---', err);
			return;
		}
		for (let campaign of campaignDetail) {
			for (let temp of campaign.Drip_camps) {
				temp_Drip_camp = temp;

				if (temp_Drip_camp.userAction === 'Not read on drip app') {
					// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "Assigned_post_to_users" WHERE "CampaignId" = ${campaign.id} AND "DripCampIndex" = ${temp_Drip_camp.dependencyDripIndex} AND "isRead" = false);`;
					// let query_2 = `SELECT  ARRAY  (SELECT "UserId" FROM "CampWhatsAppEmailDrips" WHERE "CampaignId" = ${campaign.id} AND "DripCampIndex" = ${temp_Drip_camp.dependencyDripIndex} AND "isTriggered" = true AND "clickExternalLink" = false);`;

					// [ids] = await sequelize.query(query);
					// [ids_2] = await sequelize.query(query_2);

					let query = `
						SELECT ARRAY (
							SELECT "UserId"
							FROM "Assigned_post_to_users"
							WHERE "CampaignId" = :campaignId
							AND "DripCampIndex" = :dripCampIndex
							AND "isRead" = false
						);
						`;

					let query_2 = `
						SELECT ARRAY (
							SELECT "UserId"
							FROM "CampWhatsAppEmailDrips"
							WHERE "CampaignId" = :campaignId
							AND "DripCampIndex" = :dripCampIndex
							AND "isTriggered" = true
							AND "clickExternalLink" = false
						);
						`;

					const ids = await sequelize.query(query, {
						replacements: {
							campaignId: campaign.id,
							dripCampIndex: temp_Drip_camp.dependencyDripIndex,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					const ids_2 = await sequelize.query(query_2, {
						replacements: {
							campaignId: campaign.id,
							dripCampIndex: temp_Drip_camp.dependencyDripIndex,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					let getAssignedPost = ids[0].array;
					getAssignedPost = getAssignedPost.concat(ids_2[0].array);

					if (temp_Drip_camp.dripActionEndDate && getAssignedPost.length > 0) {
						let endData = moment(temp_Drip_camp.dripActionEndDate).format();

						if (moment().isSameOrAfter(endData)) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							if (!temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												isPublished: false,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip--', err);

								[err, updateTriggerDate] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);

								if (err) console.log('-Update Published Date Assigned Drip 02--', err);
							}

							if (temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												UserId: getAssignedPost,
												actionType: temp_Drip_camp.actionType,
												isTriggered: false,
												DripCampId: temp_Drip_camp.id,
												takeActionOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update takeActionOn Date in CampTakeAction table--', err);
							}
						}
					}
				} else if (temp_Drip_camp.userAction === 'Drip Action not taken') {
					// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "Assigned_post_to_users" WHERE "CampaignId" = ${campaign.id} AND "DripCampIndex" = ${temp_Drip_camp.dependencyDripIndex} AND "isDripClickAction" = false);`;
					// [ids] = await sequelize.query(query);

					let query = `
						SELECT ARRAY (
							SELECT "UserId"
							FROM "Assigned_post_to_users"
							WHERE "CampaignId" = :campaignId
							AND "DripCampIndex" = :dripCampIndex
							AND "isDripClickAction" = false
						);
						`;

					const ids = await sequelize.query(query, {
						replacements: {
							campaignId: campaign.id,
							dripCampIndex: temp_Drip_camp.dependencyDripIndex,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					let getAssignedPost = ids[0].array;
					if (temp_Drip_camp.dripActionEndDate && getAssignedPost.length > 0) {
						let endData = moment(temp_Drip_camp.dripActionEndDate).format();
						if (moment().isSameOrAfter(endData)) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							if (!temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												isPublished: false,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip--', err);

								[err, updateTriggerDate] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip 02--', err);
							}

							if (temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												UserId: getAssignedPost,
												actionType: temp_Drip_camp.actionType,
												isTriggered: false,
												DripCampId: temp_Drip_camp.id,
												takeActionOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update takeActionOn Date in CampTakeAction table--', err);
							}
						}
					}
				} else if (temp_Drip_camp.userAction === 'Drip submit Action not taken') {
					// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "Assigned_post_to_users" WHERE "CampaignId" = ${campaign.id} AND "DripCampIndex" = ${temp_Drip_camp.dependencyDripIndex} AND "submit" = false);`;
					// [ids] = await sequelize.query(query);

					let query = `
						SELECT ARRAY (
							SELECT "UserId"
							FROM "Assigned_post_to_users"
							WHERE "CampaignId" = :campaignId
							AND "DripCampIndex" = :dripCampIndex
							AND "submit" = false
						);
						`;

					const ids = await sequelize.query(query, {
						replacements: {
							campaignId: campaign.id,
							dripCampIndex: temp_Drip_camp.dependencyDripIndex,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					let getAssignedPost = ids[0].array;
					if (temp_Drip_camp.dripActionEndDate && getAssignedPost.length > 0) {
						let endData = moment(temp_Drip_camp.dripActionEndDate).format();
						if (moment().isSameOrAfter(endData)) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							if (!temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												isPublished: false,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip--', err);

								[err, updateTriggerDate] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip 02--', err);
							}

							if (temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												UserId: getAssignedPost,
												actionType: temp_Drip_camp.actionType,
												isTriggered: false,
												DripCampId: temp_Drip_camp.id,
												takeActionOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update takeActionOn Date in CampTakeAction table--', err);
							}
						}
					}
				} else if (temp_Drip_camp.userAction === 'Not read on channel') {
					// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "CampWhatsAppEmailDrips" WHERE "CampaignId" = ${campaign.id} AND "DripCampIndex" = ${temp_Drip_camp.dependencyDripIndex} AND "readDate" is null);`;
					// [ids] = await sequelize.query(query);

					let query = `SELECT ARRAY (
						SELECT "UserId"
						FROM "CampWhatsAppEmailDrips"
						WHERE "CampaignId" = :campaignId
						  AND "DripCampIndex" = :dripCampIndex
						  AND "readDate" IS NULL
					  )`;

					const ids = await sequelize.query(query, {
						replacements: {
							campaignId: campaign.id,
							dripCampIndex: temp_Drip_camp.dependencyDripIndex,
						},
						type: sequelize.QueryTypes.SELECT,
					});

					let getAssignedPost = ids[0].array;

					if (temp_Drip_camp.dripActionEndDate && getAssignedPost.length > 0) {
						let endData = moment(temp_Drip_camp.dripActionEndDate).format();
						if (!getAssignedPost.readDate && moment().isSameOrAfter(endData)) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							if (!temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												isPublished: false,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip--', err);

								[err, updateTriggerDate] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												UserId: getAssignedPost,
												publishOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update Published Date Assigned Drip 02--', err);
							}

							if (temp_Drip_camp.actionType) {
								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaign.id,
												DripCampIndex: temp_Drip_camp.index,
												UserId: getAssignedPost,
												actionType: temp_Drip_camp.actionType,
												isTriggered: false,
												DripCampId: temp_Drip_camp.id,
												takeActionOn: {
													[Op.eq]: null,
												},
											},
										}
									)
								);
								if (err) console.log('-Update takeActionOn Date in CampTakeAction table--', err);
							}
						}
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('dripNotReadOrNotTackActionShedular error......', error);
		return;
	}
};

const MCQOptionSelectedAction = async function (UserId, CampaignId, DripCampIndex, text, PostId, questionId = null) {
	try {
		let whereCondtion = {
			status: ['Scheduled', 'Delivering', 'Performing'],
			userAction: ['Activity Outcome'],
			pollOption: text,
		};

		if (questionId) {
			whereCondtion = { ...whereCondtion, DripQuestionId: questionId };
		}

		console.log('--whereCondtion--', whereCondtion);

		[err, campaignDetail] = await to(
			Campaign.findOne({
				where: {
					isDeleted: false,
					status: 'Running',
					id: CampaignId,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: whereCondtion,
						include: [
							{
								model: Post,
								drip_status: 'Published',
								required: false,
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		if (err) {
			console.log('-----Error Get Campaign Details at Check Read Action By Learner---', err);
			return;
		}
		if (campaignDetail) {
			for (let temp of campaignDetail.Drip_camps) {
				temp_Drip_camp = temp;
				if (temp_Drip_camp.userAction === 'Activity Outcome') {
					[err, getAssignedPost] = await to(
						Assigned_post_to_user.findOne({
							where: {
								CampaignId: campaignDetail.id,
								DripCampIndex: temp_Drip_camp.dependencyDripIndex,
								UserId,
							},
							attributes: ['id', 'PostId'],
						})
					);
					if (getAssignedPost.PostId === PostId) {
						let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
						if (
							['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(temp_Drip_camp.dripType)
						) {
							let date = await getNextFiftineMinSlot();
							triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();
						}
						index_ = temp_Drip_camp.index;
						let expiredOn = null;
						if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
							expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
						}
						if (!temp_Drip_camp.actionType) {
							[err, updateTriggerDate] = await to(
								Assigned_post_to_user.update(
									{
										publishOn: triggerDate,
										isPublished: true,
										expiredOn: expiredOn,
									},
									{
										where: {
											CampaignId: campaignDetail.id,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
											isPublished: false,
											UserId,
										},
									}
								)
							);
							if (err) console.log('-Update Published Date Assigned Drip--', err);

							[err, updateTriggerDate] = await to(
								CampWhatsAppEmailDrip.update(
									{
										publishOn: triggerDate,
									},
									{
										where: {
											CampaignId: campaignDetail.id,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
											UserId,
										},
									}
								)
							);
							if (err) console.log('-Update Published Date Assigned Drip 02--', err);
						}

						if (temp_Drip_camp.actionType) {
							[err, updateTriggerDate] = await to(
								CampTakeAction.update(
									{
										takeActionOn: triggerDate,
									},
									{
										where: {
											CampaignId: campaignDetail.id,
											DripCampIndex: temp_Drip_camp.index,
											UserId: UserId,
											actionType: temp_Drip_camp.actionType,
											isTriggered: false,
											DripCampId: temp_Drip_camp.id,
										},
									}
								)
							);
							if (err) console.log('-Update takeActionOn Date CampTakeAction', err);
						}
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('MCQOptionSelectedAction error......', error);
		return;
	}
};
module.exports.MCQOptionSelectedAction = MCQOptionSelectedAction;

//For Update Campign Drip status
const updateCampaignStaus = async function (flow_type) {
	try {
		console.log('------------------Update Campaign Drip Status-------', flow_type);
		//////////////////For 'Send on date' ==>> "Send a Drip" ==>> "Start on date"//////////////////////////
		let query_1 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
						INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
						"Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
						ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
						"Drip_camps"."dripFlowType" = 'Send a Drip' AND "Drip_camps"."status" = 'Scheduled' AND
						"Drip_camps"."dripTriggerRule"='Send on date'
						INNER JOIN "CampWhatsAppEmailDrips" AS "Drip_camps->CampWhatsAppEmailDrips"
						ON "Drip_camps"."id" = "Drip_camps->CampWhatsAppEmailDrips"."DripCampId" AND
						"Drip_camps->CampWhatsAppEmailDrips"."isTriggered" = true
						WHERE "Campaign"."startRule" IN ('Start on date')
						AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}') ;`;

		[Drip_camps_ids] = await sequelize.query(query_1);
		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];

			console.log('--query_1--', array.length);
			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Delivered',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 01--', err);
			}
		}

		//////////////////For 'Send on date' ==>> "Send a Drip" ==>>'Send based on user activity','Send based on system activity'//////////////////////////
		let query_2 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
                        INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
                        "Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
                        ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
                        "Drip_camps"."dripFlowType" = 'Send a Drip' AND "Drip_camps"."status" = 'Scheduled' AND 
                        "Drip_camps"."dripTriggerRule" IN('Send based on user activity','Send based on system activity','Send based on contact milestone')
                        INNER JOIN "CampWhatsAppEmailDrips" AS "Drip_camps->CampWhatsAppEmailDrips"
                        ON "Drip_camps"."id" = "Drip_camps->CampWhatsAppEmailDrips"."DripCampId" AND
                        "Drip_camps->CampWhatsAppEmailDrips"."isTriggered" = true
                        WHERE "Campaign"."startRule" IN ('Start on date')
                        AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}' );`;

		[Drip_camps_ids] = await sequelize.query(query_2);
		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];
			console.log('--query_2--', array.length);

			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Delivering',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 02--', err);
			}
		}

		//////////////////For 'Send on date' ==>> "Take Action" ==>>'Start on date'//////////////////////////
		let query_3 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
                        INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
                        "Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
                        ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
                        "Drip_camps"."dripFlowType" = 'Take Action' AND "Drip_camps"."status" = 'Scheduled' AND 
                        "Drip_camps"."actionTriggerRule"='Take action on date'
                        INNER JOIN "CampTakeActions" AS "Drip_camps->CampTakeActions"
                        ON "Drip_camps"."id" = "Drip_camps->CampTakeActions"."DripCampId" AND
                        "Drip_camps->CampTakeActions"."isTriggered" = true
                        WHERE "Campaign"."startRule" IN ('Start on date')
                        AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}');`;

		[Drip_camps_ids] = await sequelize.query(query_3);
		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];
			console.log('--query_3--', array.length);
			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Performed',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 03--', err);
			}
		}

		//////////////////For 'Send on date' ==>> "Take Action" ==>>'Send based on user activity','Send based on system activity'//////////////////////////
		let query_4 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
                        INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
                        "Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
                        ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
                        "Drip_camps"."dripFlowType" = 'Take Action' AND "Drip_camps"."status" = 'Scheduled' AND 
                        "Drip_camps"."actionTriggerRule" IN ('Take action based on system activity','Take action based on user activity')
                        INNER JOIN "CampTakeActions" AS "Drip_camps->CampTakeActions"
                        ON "Drip_camps"."id" = "Drip_camps->CampTakeActions"."DripCampId" AND
                        "Drip_camps->CampTakeActions"."isTriggered" = true
                        WHERE "Campaign"."startRule" IN ('Start on date')
                        AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}');`;

		[Drip_camps_ids] = await sequelize.query(query_4);
		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];
			console.log('--query_4--', array.length);
			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Performing',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 04--', err);
			}
		}

		//////////////////For 'Start when tag is added to learner', 'Start when learner is added to group' "Send a Drip"//////////////////////////
		let query_5 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
                        INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
                        "Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
                        ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
                        "Drip_camps"."dripFlowType" = 'Send a Drip' AND "Drip_camps"."status" = 'Scheduled'
                        INNER JOIN "CampWhatsAppEmailDrips" AS "Drip_camps->CampWhatsAppEmailDrips"
                        ON "Drip_camps"."id" = "Drip_camps->CampWhatsAppEmailDrips"."DripCampId" AND
                       "Drip_camps->CampWhatsAppEmailDrips"."isTriggered" = true
                        WHERE "Campaign"."startRule" IN ('Start when tag is added to learner', 'Start when learner is added to group')
                        AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}');`;

		[Drip_camps_ids] = await sequelize.query(query_5);
		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];
			console.log('--query_5--', array.length);
			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Delivering',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 05--', err);
			}
		}

		//////////////////For 'Start when tag is added to learner', 'Start when learner is added to group' "Take Action"//////////////////////////

		let query_6 = `SELECT ARRAY (SELECT "Drip_camps"."id" AS "Drip_camps.id" FROM "Campaigns" AS "Campaign"
                        INNER JOIN ( "Campaign_drip_camp_mappings" AS "Drip_camps->Campaign_drip_camp_mapping" INNER JOIN "Drip_camps" AS "Drip_camps" ON
                        "Drip_camps"."id" = "Drip_camps->Campaign_drip_camp_mapping"."DripCampId")
                        ON "Campaign"."id" = "Drip_camps->Campaign_drip_camp_mapping"."CampaignId" AND
                        "Drip_camps"."dripFlowType" = 'Take Action' AND "Drip_camps"."status" = 'Scheduled'
                        INNER JOIN "CampTakeActions" AS "Drip_camps->CampTakeActions"
                        ON "Drip_camps"."id" = "Drip_camps->CampTakeActions"."DripCampId" AND
                       "Drip_camps->CampTakeActions"."isTriggered" = true
                        WHERE "Campaign"."startRule" IN ('Start when tag is added to learner', 'Start when learner is added to group')
                        AND "Campaign"."isDeleted" = false AND
						"Campaign"."flowType" = '${flow_type}');`;

		[Drip_camps_ids] = await sequelize.query(query_6);

		if (Drip_camps_ids[0].array.length > 0) {
			let array = [...new Set(Drip_camps_ids[0].array)];
			console.log('--query_6--', array.length);
			[err, updateDripCamp] = await to(
				Drip_camp.update(
					{
						status: 'Performing',
					},
					{
						where: {
							id: array,
						},
					}
				)
			);
			if (err) {
				console.log('--update Campaign Staus Query 06--', err);
			}
		}
	} catch (error) {
		console.log('----Error when update Campaign Status---', error);
	}
};
// Send WhatsApp Native drip
const sendWhatsAppNativeDripNew = async function (userPhones, drip_details, user, isTemplate = true) {
	console.log('----Native sending drip_details-----', drip_details);
	if (drip_details?.WhatsAppSetup?.isMeta == false) {
		try {
			let sendOtherDetails = false;
			let cta_sequence = [];
			let presentTrackableLink = false;
			let params = {
				userid: drip_details.WhatsAppSetup.user_id,
				password: drip_details.WhatsAppSetup.password,
				v: `1.1`,
				format: `json`,
			};

			// Check Header Type
			if (
				drip_details.header_type == 'Image' ||
				drip_details.header_type == 'Video' ||
				drip_details.header_type == 'Document'
			) {
				// Set Messgae Type
				if (drip_details.header_type == 'Image') {
					params.msg_type = 'IMAGE';
				} else if (drip_details.header_type == 'Video') {
					params.msg_type = 'VIDEO';
				} else if (drip_details.header_type == 'Document') {
					params.msg_type = 'DOCUMENT';
					params.filename = drip_details.headerFileName;
				}

				// Media File Link
				let filePath = '';
				filePath = `${CONFIG.image_host}${drip_details.headerPath}`;

				// Add Asset Path into Param
				params.media_url = filePath;
				params.method = 'SENDMEDIAMESSAGE';
				params.caption = drip_details.body;
				// params.isTemplate = true;
			} else if (drip_details.header_type == 'Location') {
				params.msg_type = 'LOCATION';
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				// params.isTemplate = true;
				let payload = {
					longitude: drip_details.longitude,
					latitude: drip_details.latitude,
					name: drip_details.locName,
					address: drip_details.address,
				};
				params.location = JSON.stringify(payload);
			} else if (drip_details.header_type == 'Text') {
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				params.header = drip_details.header_text;
				if (isTemplate) {
					params.isTemplate = isTemplate;
				}
				params.msg_type = 'TEXT';
			} else if (drip_details.header_type == 'None') {
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				// params.isTemplate = true;
				params.msg_type = 'TEXT';
			}

			if (drip_details.footer != null && drip_details.footer != '') {
				params.footer = drip_details.footer;
				if (isTemplate) {
					params.isTemplate = isTemplate;
				}
			}

			// if (drip_details.interaction) {
			// 	params.isTemplate = true;
			// }

			let quickReplies = [];
			for (let i = 1; i <= 10; i++) {
				if (drip_details[`quickReply${i}`]) {
					quickReplies.push(drip_details[`quickReply${i}`]);
				}
			}

			let CTAs = [];

			if (drip_details.cta_sequence) {
				cta_sequence = JSON.parse(drip_details.cta_sequence);

				if (cta_sequence.length > 0) {
					if (
						drip_details?.trackableLink ||
						drip_details?.trackableLink2 ||
						drip_details?.zoomTrackable ||
						drip_details?.zoomTrackable2
					) {
						presentTrackableLink = true;
					}
					for (let ct of cta_sequence) {
						let payload = {};

						if (ct.value == 'callToActionText') {
							payload.type = 'callToActionText';
							payload.text = drip_details.callToActionText;
							payload.hyper_link = drip_details.hyper_link;
							payload.trackableLink = drip_details.trackableLink;
						} else if (ct.value === 'callToActionText2') {
							payload.type = 'callToActionText2';
							payload.text = drip_details.callToActionText2;
							payload.hyper_link = drip_details.hyper_link2;
							payload.trackableLink = drip_details.trackableLink2;
						} else if (ct.value === 'callphonetext') {
							payload.type = 'callphonetext';
							payload.text = drip_details.callphonetext;
							payload.callphoneno = drip_details.callphoneno;
							payload.callphonetype = drip_details.callphonetype;
						}
						// ----------------------------------------For Zoom Meeting Link Configration----------------------------------------
						else if (ct.value == 'zoomMeetLink') {
							payload.type = 'callToActionText';
							payload.text = drip_details.callToActionZoomText;
							payload.hyper_link = drip_details.zoomMeetLink;
							payload.trackableLink = drip_details.zoomTrackable;
						} else if (ct.value === 'zoomMeetLink2') {
							payload.type = 'callToActionText2';
							payload.text = drip_details.callToActionZoomText2;
							payload.hyper_link = drip_details.zoomMeetLink2;
							payload.trackableLink = drip_details.zoomTrackable2;
						}
						if (
							payload.text ||
							payload.callphoneno ||
							payload.hyper_link ||
							payload.trackableLink ||
							payload.callphonetype
						) {
							CTAs.push(payload);
						}
					}
				}
			}
			console.log('---CTAs---', CTAs);
			if (quickReplies.length > 3) {
				sendOtherDetails = true;
			} else if (quickReplies.length >= 1 && CTAs.length >= 1) {
				sendOtherDetails = true;
			}

			if (quickReplies.length > 0 || CTAs.length > 0) {
				if (isTemplate) {
					params.isTemplate = true;
				}
				let wa_template_json = {
					components: [],
				};
				let index = 0;
				if (drip_details.quickReplyFirst) {
					for (let quickReply of quickReplies) {
						wa_template_json.components.push({
							sub_type: 'quick_reply',
							index: `${index}`,
							type: 'button',
							parameters: [{ payload: '', type: 'payload' }],
						});
						index++;
					}

					for (let cta of CTAs) {
						if ((cta.type === 'callToActionText' || cta.type === 'callToActionText2') && cta.trackableLink) {
							// sendOtherDetails = true;
							wa_template_json.components.push({
								sub_type: 'url',
								index: `${index}`,
								type: 'button',
								parameters: [{ text: `?drip_code=${user.code}`, type: 'text' }],
							});
						}
						index++;
					}
				} else {
					for (let cta of CTAs) {
						if ((cta.type === 'callToActionText' || cta.type === 'callToActionText2') && cta.trackableLink) {
							// sendOtherDetails = true;
							wa_template_json.components.push({
								sub_type: 'url',
								index: `${index}`,
								type: 'button',
								parameters: [{ text: `?drip_code=${user.code}`, type: 'text' }],
							});
						}
						index++;
					}

					for (let quickReply of quickReplies) {
						wa_template_json.components.push({
							sub_type: 'quick_reply',
							index: `${index}`,
							type: 'button',
							parameters: [{ payload: '', type: 'payload' }],
						});
						index++;
					}
				}

				if (sendOtherDetails) {
					params.wa_template_json = JSON.stringify(wa_template_json);
				} else if (CTAs.length > 1 && presentTrackableLink) {
					params.wa_template_json = JSON.stringify(wa_template_json);
				} else if (presentTrackableLink) {
					params.buttonUrlParam = '?drip_code=' + user.code;
				}
			}

			// if (
			// 	drip_details.trackableLink &&
			// 	drip_details.type &&
			// 	drip_details.type === 'dynamic' &&
			// 	user.code &&
			// 	drip_details.interaction &&
			// 	drip_details.interaction != 'Quick Replies'
			// ) {
			// 	params.buttonUrlParam = '?drip_code=' + user.code;
			// }

			if (!isTemplate) {
				params.isHSM = false;
				params.auth_scheme = 'plain';
			}

			params.send_to = userPhones;
			console.log(
				'----Url-- WhatsApp-Native--Campaign-Service--',
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);

			try {
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);
				return response.data;
			} catch (error) {
				return error;
			}
		} catch (error) {
			console.log(new Date(), 'Error --->>>>Campaign Scheduler --->>>-->>>  Only WhatsApp', error);
			return error;
		}
	} else {
		//////////////       SEND MESSAGE ///////////////////////////////////////////////////
		try {
			const language = drip_details.tempLang || 'en';
			let components = [];

			// ---------------- HEADER ----------------
			if (drip_details.header_type === 'Text') {
				components.push({
					type: 'HEADER',
					parameters: drip_details.header_text_parameters,
				});
			} else if (['Image', 'Video', 'Document'].includes(drip_details.header_type)) {
				let mediaType = drip_details.header_type.toLowerCase();
				components.push({
					type: 'HEADER',
					parameters: [
						{
							type: mediaType,
							[mediaType]: {
								id: `${drip_details.mediaId}`,
							},
						},
					],
				});
			} else if (drip_details.header_type === 'Location') {
				components.push({
					type: 'HEADER',
					parameters: [
						{
							type: 'location',
							location: {
								longitude: drip_details.longitude,
								latitude: drip_details.latitude,
								name: drip_details.locName || '',
								address: drip_details.address || '',
							},
						},
					],
				});
			}

			// ---------------- BODY ----------------
			if (drip_details.body) {
				components.push({
					type: 'BODY',
					parameters: drip_details.body_parameters,
				});
			}

			// ---------------- FOOTER ----------------
			if (drip_details.footer) {
				components.push({
					type: 'FOOTER',
				});
			}

			let quickReplies = [];
			for (let i = 1; i <= 10; i++) {
				const reply = drip_details[`quickReply${i}`];
				if (reply) {
					quickReplies.push({
						type: 'quick_reply',
						reply: {
							id: `qr_${i}`,
							title: reply,
						},
					});
				}
			}

			// ======== CTA BUTTONS ========
			let buttons = [];
			if (drip_details.cta_sequence && JSON.parse(drip_details.cta_sequence).length > 0) {
				let cta_sequence = JSON.parse(drip_details.cta_sequence);

				for (const ct of cta_sequence) {
					if (ct.value === 'callToActionText' && drip_details.hyper_link) {
						// STATIC URL – SKIP from payload later
						if (drip_details.type == 'static') {
							buttons.push({
								type: 'url_static',
								url_button: {
									text: drip_details.callToActionText,
									url: drip_details.hyper_link + `?drip_code=${user?.code || ''}`,
								},
							});
						} else if (drip_details.type == 'dynamic') {
							buttons.push({
								type: 'url_dynamic',
								url_button: {
									text: drip_details.callToActionText2,
									param: user?.code || '',
								},
							});
						}
					} else if (ct.value === 'callphonetext' && drip_details.callphoneno) {
						// VOICE CALL
						buttons.push({
							type: 'phone_number',
							phone_number_button: {
								text: drip_details.callphonetext,
								phone_number: drip_details.callphoneno,
							},
						});
					} else if (ct.value === 'callToActionText2' && drip_details.hyper_link2) {
						if (drip_details.type == 'static') {
							buttons.push({
								type: 'url_static',
								url_button: {
									text: drip_details.callToActionText,
									url: drip_details.hyper_link + `?drip_code=${user?.code || ''}`,
								},
							});
						} else if (drip_details.type == 'dynamic') {
							// DYNAMIC URL
							buttons.push({
								type: 'url_dynamic',
								url_button: {
									text: drip_details.callToActionText2,
									param: user?.code || '',
								},
							});
						}
					}
				}
			}

			// ======== MERGE & BUILD BUTTON COMPONENTS ========
			let combinedButtons = drip_details.quickReplyFirst
				? [...quickReplies, ...buttons]
				: [...buttons, ...quickReplies];

			let buttonIndex = 0;

			for (const btn of combinedButtons) {
				if (btn.type === 'quick_reply') {
					components.push({
						type: 'BUTTON',
						sub_type: 'QUICK_REPLY',
						index: `${buttonIndex}`,
						parameters: [
							{
								type: 'payload',
								payload: btn.reply.id,
							},
						],
					});
				} else if (btn.type === 'url_static') {
					// Skip static URLs (Meta does not allow parameters)
					// But still increment buttonIndex so following buttons align with template
				} else if (btn.type === 'url_dynamic') {
					components.push({
						type: 'BUTTON',
						sub_type: 'URL',
						index: `${buttonIndex}`,
						parameters: [
							{
								type: 'text',
								text: btn.url_button.param,
							},
						],
					});
				} else if (btn.type === 'phone_number') {
					components.push({
						type: 'BUTTON',
						sub_type: 'VOICE_CALL',
						index: `${buttonIndex}`,
						parameters: [
							{
								type: 'text',
								text: btn.phone_number_button.phone_number,
							},
						],
					});
				}

				// Always increment index to match Meta template structure
				buttonIndex++;
			}

			let payload = {
				messaging_product: 'whatsapp',
				to: userPhones,
				type: 'template',
				template: {
					name: drip_details.tempName?.trim().toLowerCase().replace(/\s/g, '_'),
					language: {
						code: language,
					},
					components: components,
				},
			};

			let metaWhatsappNativeSendingURL = `https://graph.facebook.com/v23.0/${drip_details?.WhatsAppSetup?.MTPNoId}/messages`;

			console.log('---- Meta With Only WhatsApp Send URL ----', metaWhatsappNativeSendingURL);
			console.log(JSON.stringify(payload, null, 2));

			const token = drip_details?.WhatsAppSetup?.MTToken;

			if (!token || typeof token !== 'string') {
				console.error('❌ MTToken is missing or invalid');
				return;
			}

			let headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			};

			console.log('-token-', token);

			const response = await axios.post(metaWhatsappNativeSendingURL, payload, { headers });

			console.log('---- Meta With Only Whatsapp Message Sent Successfully ----');
			console.log('---Meta With Only Whatsapp Message Response-----', response.data);

			if (response.data?.messages[0]?.id) {
				return {
					success: true,
					message_id: response.data.messages[0].id,
					response: response.data,
				};
			} else {
				return {
					success: false,
					response: response.data,
				};
			}
		} catch (error) {
			console.log('---- Error --->>>>Campaign Scheduler ---->>> Sending Meta With Only WhatsApp Message ----');
			console.log(error?.response?.data || error.message);
			return {
				success: false,
				error: error?.response?.data || error.message,
			};
		}
	}
};
module.exports.sendWhatsAppNativeDripNew = sendWhatsAppNativeDripNew;

// Send WhatsApp Non Native drip
const sendWhatsAppNonNativeDripNew = async function (userPhones, drip_details, code) {
	console.log('--Non Native sending drip_details-', drip_details);

	if (drip_details?.WhatsAppSetup?.isMeta == false) {
		try {
			let details = JSON.parse(JSON.stringify(drip_details.WhatsAppSetup));
			let params = {
				userid: details.user_id,
				password: details.passwor, //Need to check After Some Time
				v: `1.1`,
				format: `json`,
				isTemplate: true,
			};
			console.log('---params---', params);
			// Check Header Type
			if (
				drip_details.header_type == 'Image' ||
				drip_details.header_type == 'Video' ||
				drip_details.header_type == 'Document'
			) {
				// Set Messgae Type
				if (drip_details.header_type == 'Image') {
					params.msg_type = 'IMAGE';
				} else if (drip_details.header_type == 'Video') {
					params.msg_type = 'VIDEO';
				} else if (drip_details.header_type == 'Document') {
					params.msg_type = 'DOCUMENT';
					params.filename = drip_details.headerFileName;
				}

				// Media File Link
				let filePath = '';
				filePath = `${CONFIG.image_host}${drip_details.headerPath}`;

				// Add Asset Path into Param
				params.media_url = filePath;
				params.method = 'SENDMEDIAMESSAGE';
				params.caption = drip_details.body;
			} else if (drip_details.header_type == 'Location') {
				params.msg_type = 'LOCATION';
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				let payload = {
					longitude: drip_details.longitude,
					latitude: drip_details.latitude,
					name: drip_details.locName,
					address: drip_details.address,
				};
				params.location = JSON.stringify(payload);
			} else if (drip_details.header_type == 'Text') {
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				params.header = drip_details.header_text;
				params.msg_type = 'TEXT';
			} else if (drip_details.header_type == 'None') {
				params.method = 'SENDMESSAGE';
				params.msg = drip_details.body;
				params.msg_type = 'TEXT';
			}

			if (drip_details.footer != null && drip_details.footer != '') {
				params.footer = drip_details.footer;
			}

			if (drip_details.type && drip_details.type === 'dynamic' && code) {
				params.buttonUrlParam = '?drip_code=' + code;
			}

			params.send_to = userPhones;
			console.log(
				'----Url--WhatsApp-Non-Native--',
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);
			try {
				// ======================================Uncommited for Dev / Staging / Production=======================================
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);
				// ======================================Uncommited for Dev / Staging / Production=======================================

				return response.data;

				// console.log('==>>Before Sent Message ==>>', moment().format('DD-MM-YYYY HH:mm:ss.SSS'));
				// await new Promise((resolve) => setTimeout(resolve, 20)); // Wait for 20 seconds
				// console.log('==>>After Sent Message ==>>', moment().format('DD-MM-YYYY HH:mm:ss.SSS'));
				// const payload = {
				// 	response: {
				// 		phone: userPhones,
				// 		details: '',
				// 		id: moment().format('DD-MM-YYYY HH:mm:ss.SSS') + '-' + code,
				// 		status: 'success',
				// 	},
				// };
				// return payload;
			} catch (error) {
				return error;
			}
		} catch (error) {
			console.log(new Date(), 'Error --->>>>Campaign Scheduler --->>>-->>>  DripApp With WhatsApp', error);
			return error;
		}
	} else {
		//////////////       SEND MESSAGE ///////////////////////////////////////////////////

		try {
			const language = drip_details.tempLang || 'en';

			let headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${drip_details?.WhatsAppSetup?.MTToken}`,
			};

			let components = [];

			// ---------------- HEADER ----------------
			if (drip_details.header_type === 'Text') {
				components.push({
					type: 'HEADER',
					parameters: drip_details.header_text_parameters,
				});
			} else if (['Image', 'Video', 'Document'].includes(drip_details.header_type)) {
				let mediaType = drip_details.header_type.toLowerCase();
				components.push({
					type: 'HEADER',
					parameters: [
						{
							type: mediaType,
							[mediaType]: {
								id: `${drip_details.mediaId}`,
							},
						},
					],
				});
			} else if (drip_details.header_type === 'Location') {
				components.push({
					type: 'HEADER',
					parameters: [
						{
							type: 'location',
							location: {
								longitude: drip_details.longitude,
								latitude: drip_details.latitude,
								name: drip_details.locName || '',
								address: drip_details.address || '',
							},
						},
					],
				});
			}

			// ---------------- BODY ----------------
			if (drip_details.body) {
				components.push({
					type: 'BODY',
					parameters: drip_details.body_parameters,
				});
			}

			// ---------------- FOOTER ----------------
			if (drip_details.footer) {
				components.push({
					type: 'FOOTER',
				});
			}

			let buttons = [];
			let urlParamIndex = 1;

			// === PUSH BUTTONS ===
			if (drip_details.type === 'dynamic') {
				buttons.push({
					type: 'url_dynamic',
					url_button: {
						text: drip_details.callToActionText,
						param: code || '',
						index: urlParamIndex,
					},
				});
			} else {
				buttons.push({
					type: 'url_static',
					url_button: {
						text: drip_details.callToActionText,
						url: drip_details.hyper_link + `?drip_code=${code || ''}`,
					},
				});
			}

			let combinedButtons = [...buttons];

			// === BUILD BUTTON COMPONENTS ===
			let buttonIndex = 0;

			for (let i = 0; i < combinedButtons.length; i++) {
				const btn = combinedButtons[i];

				if (btn.type === 'url_static') {
					// DO NOT push static URL into payload
					//But increment index to keep sequence aligned
				} else if (btn.type === 'url_dynamic') {
					components.push({
						type: 'BUTTON',
						sub_type: 'URL',
						index: `${buttonIndex}`,
						parameters: [
							{
								type: 'text',
								text: btn.url_button.param,
							},
						],
					});
				}

				//Always increment index (even if skipped)
				buttonIndex++;
			}

			let payload = {
				messaging_product: 'whatsapp',
				to: userPhones,
				type: 'template',
				template: {
					name: drip_details.tempName?.trim().toLowerCase().replace(/\s/g, '_'),
					language: {
						code: language,
					},
					components: components,
				},
			};

			let metaWhatsappNonNativeSendingURL = `https://graph.facebook.com/v23.0/${drip_details?.WhatsAppSetup?.MTPNoId}/messages`;

			console.log('---- Meta Drip App With Whatsapp Send URL ----', metaWhatsappNonNativeSendingURL);
			console.log(JSON.stringify(payload, null, 2));

			const response = await axios.post(metaWhatsappNonNativeSendingURL, payload, { headers });

			console.log('---- Meta Drip App With Whatsapp Message Sent Successfully ----');
			console.log('---Meta Drip App With Whatsapp Message Response-----', response.data);

			if (response.data?.messages[0]?.id) {
				return {
					success: true,
					message_id: response.data.messages[0].id,
					response: response.data,
				};
			} else {
				return {
					success: false,
					response: response.data,
				};
			}
		} catch (error) {
			console.log('---- Error --->>>>Campaign Scheduler ---->>> Sending Meta With Only WhatsApp Message ----');
			console.log(error?.response?.data || error.message);
			return {
				success: false,
				error: error?.response?.data || error.message,
			};
		}
	}
};
module.exports.sendWhatsAppNonNativeDripNew = sendWhatsAppNonNativeDripNew;

// This Function is called when create a Campaign with starting Rule is Send on date
const assignDripToLearnerByUsingCampaign = async function (campaignId, userId = null) {
	try {
		let campaignDetails;
		let learner_user_ids = [];
		let user_group_camp_list;
		let endDate = new Date();
		[err, campaignDetails] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					startRule: 'Start on date',
					isDeleted: false,
					status: 'Scheduled',
					endDate: {
						[Op.gte]: endDate,
					},
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: 'Scheduled',
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: {
										[Op.ne]: 'Draft',
									},
								},
								include: [
									{
										model: Drip_whatsapp_native,
									},
									{
										model: Drip_whatsapp_non_native,
									},
									{
										model: Drip_email_non_native,
									},
									{
										model: Drip_native,
									},
									{
										model: DripOnlyTeam,
									},
									{
										model: DripSharingOnTeam,
									},
									{
										model: Asset,
										include: [
											{
												model: Asset_detail,
											},
										],
									},
								],
								required: false,
							},
						],
					},
					{ model: CampChannelMapping, required: false },
				],
			})
		);
		if (err) console.log('---Error at Get Campaign Details', err);

		if (campaignDetails) {
			campaignDetails = campaignDetails.convertToJSON();
			//Get Campaign User Groups
			[err, user_group_camp_list] = await to(
				Campaign_user_group_mapping.findAll({
					where: {
						CampaignId: campaignId,
					},
					include: [
						{
							model: User_group,
							attributes: ['id'],
							include: [
								{
									model: User,
									where: {
										cStatus: 'Active',
									},
									attributes: ['id'],
								},
							],
						},
					],
					attributes: ['UserGroupId', 'CampaignId'],
				})
			);
			if (err) console.log('-----user_groups---', err);

			for (let camp_user_group of user_group_camp_list) {
				if (camp_user_group.User_group && camp_user_group.User_group.Users.length > 0) {
					for (let user of camp_user_group.User_group.Users) {
						if (!learner_user_ids.includes(user.id)) learner_user_ids.push(user.id);
					}
				}
			}

			if (userId) {
				learner_user_ids.push(userId);
			}
			if (learner_user_ids && learner_user_ids.length > 0) {
				for (let drip_camp of campaignDetails.Drip_camps) {
					// Drip Flow Type ==>> Send a Drip
					if (drip_camp.dripFlowType == 'Send a Drip') {
						if (drip_camp.dripTriggerRule == 'Send on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							await assignDripToLearnerOnCreateCampaign(
								learner_user_ids,
								campaignId,
								triggerDate,
								drip_camp,
								campaignDetails.ClientId
							);
						} else if (
							drip_camp.dripTriggerRule == 'Send based on system activity' &&
							drip_camp.index == 0
							// && drip_camp.systemActionType != 'Based on tags added'
						) {
							if (campaignDetails && campaignDetails.startRule == 'Start on date') {
								let triggerDate = null;
								if (drip_camp.systemActionType != 'Based on tags added') {
									triggerDate = moment(new Date(campaignDetails.startDate))
										.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
										.format();
								}
								await assignDripToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							} else {
								await assignDripToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (
							drip_camp.dripTriggerRule == 'Send based on system activity' &&
							drip_camp.systemActionType != 'Based on tags added'
						) {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignDripToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							} else {
								await assignDripToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on user activity') {
							await assignDripToLearnerOnCreateCampaign(
								learner_user_ids,
								campaignId,
								null,
								drip_camp,
								campaignDetails.ClientId
							);
						} else if (drip_camp.dripTriggerRule == 'Send based on contact milestone') {
							await assignDripToLearnerOnCreateCampaign(
								[...learner_user_ids],
								campaignId,
								null,
								drip_camp,
								campaignDetails.ClientId
							);
						}
						// Drip Flow Type ==>> Take Action
					} else if (drip_camp.dripFlowType == 'Take Action') {
						if (drip_camp.actionTriggerRule == 'Take action on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							await assignTakeActionToLearnerOnCreateCampaign(
								learner_user_ids,
								campaignId,
								triggerDate,
								drip_camp,
								campaignDetails.ClientId
							);
						} else if (
							drip_camp.actionTriggerRule == 'Take action based on system activity' &&
							drip_camp.index == 0 &&
							drip_camp.systemActionType != 'Based on tags added'
						) {
							if (campaignDetails && campaignDetails.startRule == 'Start on date') {
								let triggerDate = moment(new Date(campaignDetails.startDate))
									.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
									.format();
								await assignTakeActionToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							} else {
								await assignTakeActionToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (
							drip_camp.actionTriggerRule == 'Take action based on system activity' &&
							drip_camp.systemActionType != 'Based on tags added'
						) {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignTakeActionToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							} else {
								await assignTakeActionToLearnerOnCreateCampaign(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (drip_camp.actionTriggerRule == 'Take action based on user activity') {
							await assignTakeActionToLearnerOnCreateCampaign(
								learner_user_ids,
								campaignId,
								null,
								drip_camp,
								campaignDetails.ClientId
							);
						}
					}
				}
				let notifcationMessage = `Your Drip Flow assinment finished at {{date}}.`;
				await createNotification(notifcationMessage, ['Bell'], [campaignDetails.UserId]);
			} else if (campaignDetails?.CampChannelMappings?.length > 0) {
				for (let drip_camp of campaignDetails.Drip_camps) {
					if (drip_camp.dripFlowType == 'Send a Drip') {
						if (drip_camp.dripTriggerRule == 'Send on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							await assignDripToChannelOnCreateCampaign(
								campaignDetails.CampChannelMappings,
								campaignId,
								triggerDate,
								drip_camp,
								campaignDetails.ClientId
							);
						}
					}
				}
			}
		} else {
			console.log('---Campaign Details Not Found---');
		}

		return;
	} catch (error) {
		console.log('---Assign Drip To Learner Error--', error);
	}
};
module.exports.assignDripToLearnerByUsingCampaign = assignDripToLearnerByUsingCampaign;

// This Function is called when Edit a Campaign with starting Rule is Send on date
const editAssignDripToLearnerByUsingCampaign = async function (campaignId) {
	try {
		let campaignDetails;
		let user_group_id = [];
		let learner_user_ids = [];
		let user_group_camp_list;
		let todayDate = new Date();
		let todayDateInMoment = moment().format();
		let endDate = new Date();
		[err, campaignDetails] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					startRule: 'Start on date',
					isDeleted: false,
					status: ['Scheduled', 'Running'],
					endDate: {
						[Op.gte]: endDate,
					},
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: 'Scheduled',
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								include: [
									{
										model: Drip_whatsapp_native,
									},
									{
										model: Drip_whatsapp_non_native,
									},
									{
										model: Drip_email_non_native,
									},
									{
										model: Drip_native,
									},
									{
										model: Asset,
										include: [
											{
												model: Asset_detail,
											},
										],
									},
								],
								required: false,
							},
						],
					},
					{
						model: CampChannelMapping,
					},
				],
			})
		);
		if (err) {
			console.log('---Error at Get Campaign Details', err);
		}

		if (!campaignDetails) return;
		let drip_campIndex = [];
		for (let drip_camp of campaignDetails.Drip_camps) {
			drip_campIndex.push(drip_camp.index);
		}

		//Delete All Unpublished Drip

		[err, removeOldAssignedDrip] = await to(
			Assigned_post_to_user.destroy({
				where: {
					CampaignId: campaignId,
					publishOn: {
						[Op.gt]: todayDate,
					},
					DripCampIndex: drip_campIndex,
				},
			})
		);
		if (err) console.log('---Error Remove Old Assigned Drip When Edit Drip Flow--1-', err);

		[err, removeOldAssignedDrip] = await to(
			CampWhatsAppEmailDrip.destroy({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					DripCampIndex: drip_campIndex,
				},
			})
		);
		if (err) {
			console.log('---Error Remove Old Assigned Drip When Edit Drip Flow--2-', err);
		}

		[err, removeOldAssignedDrip] = await to(
			CampTakeAction.destroy({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					DripCampIndex: drip_campIndex,
				},
			})
		);
		if (err) console.log('---Error Remove Old Assigned Drip When Edit Drip Flow--2-', err);

		if (campaignDetails) {
			campaignDetails = campaignDetails.convertToJSON();
			//Get Campaign User Groups
			[err, user_group_camp_list] = await to(
				Campaign_user_group_mapping.findAll({
					where: {
						CampaignId: campaignId,
					},
					include: [
						{
							model: User_group,
							attributes: ['id'],
							include: [
								{
									model: User,
									where: {
										cStatus: 'Active',
									},
									attributes: ['id'],
								},
							],
						},
					],
					attributes: ['UserGroupId', 'CampaignId'],
				})
			);
			if (err) console.log('-----user_groups---', err);

			for (let camp_user_group of user_group_camp_list) {
				if (camp_user_group.User_group && camp_user_group.User_group.Users.length > 0) {
					for (let user of camp_user_group.User_group.Users) {
						if (!learner_user_ids.includes(user.id)) learner_user_ids.push(user.id);
					}
				}
			}
			if (learner_user_ids && learner_user_ids.length > 0) {
				for (let drip_camp of campaignDetails.Drip_camps) {
					// Drip Flow Type ==>> Send a Drip
					if (drip_camp.dripFlowType == 'Send a Drip') {
						if (drip_camp.dripTriggerRule == 'Send on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							if (triggerDate > todayDateInMoment) {
								await assignDripToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on system activity' && drip_camp.index == 0) {
							if (campaignDetails && campaignDetails.startRule == 'Start on date') {
								let triggerDate = moment(new Date(campaignDetails.startDate))
									.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
									.format();
								if (triggerDate > todayDateInMoment) {
									await assignDripToLearner(
										learner_user_ids,
										campaignId,
										triggerDate,
										drip_camp,
										campaignDetails.ClientId
									);
								}
							} else {
								await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, campaignDetails.ClientId);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on system activity') {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);

							if (triggerDate) {
								if (triggerDate > todayDateInMoment) {
									await assignDripToLearner(
										learner_user_ids,
										campaignId,
										triggerDate,
										drip_camp,
										campaignDetails.ClientId
									);
								}
							} else {
								await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, campaignDetails.ClientId);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on user activity') {
							await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, campaignDetails.ClientId);
						} else if (drip_camp.dripTriggerRule == 'Send based on contact milestone') {
							await assignDripToLearner([...learner_user_ids], campaignId, null, drip_camp, campaignDetails.ClientId);
						}

						// Drip Flow Type ==>> Take Action
					} else if (drip_camp.dripFlowType == 'Take Action') {
						if (drip_camp.actionTriggerRule == 'Take action on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							if (triggerDate > todayDateInMoment) {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (drip_camp.actionTriggerRule == 'Take action based on system activity' && drip_camp.index == 0) {
							if (campaignDetails && campaignDetails.startRule == 'Start on date') {
								let triggerDate = moment(new Date(campaignDetails.startDate))
									.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
									.format();
								if (triggerDate > todayDateInMoment) {
									await assignTakeActionToLearner(
										learner_user_ids,
										campaignId,
										triggerDate,
										drip_camp,
										campaignDetails.ClientId
									);
								}
							} else {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (
							drip_camp.actionTriggerRule == 'Take action based on system activity' &&
							drip_camp.systemActionType != 'Based on tags added'
						) {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									campaignDetails.ClientId
								);
							} else {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									campaignDetails.ClientId
								);
							}
						} else if (drip_camp.actionTriggerRule == 'Take action based on user activity') {
							await assignTakeActionToLearner(learner_user_ids, campaignId, null, drip_camp, campaignDetails.ClientId);
						}
					}
				}
			} else if (campaignDetails?.CampChannelMappings?.length > 0) {
				for (let drip_camp of campaignDetails.Drip_camps) {
					if (drip_camp.dripFlowType == 'Send a Drip') {
						if (drip_camp.dripTriggerRule == 'Send on date') {
							let triggerDate = moment(new Date(drip_camp.dripTriggerDate)).add(drip_camp.sendAfter, 'days').format();
							await assignDripToChannelOnCreateCampaign(
								campaignDetails.CampChannelMappings,
								campaignId,
								triggerDate,
								drip_camp,
								campaignDetails.ClientId
							);
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Assign Drip To Learner Error--', error);
	}
};
module.exports.editAssignDripToLearnerByUsingCampaign = editAssignDripToLearnerByUsingCampaign;

// This function is use to maintain the Take Action Data with respect to User
const assignTakeActionToLearner = async function (
	learnerIds,
	campaignId,
	triggerOn,
	drip_camp,
	clientId,
	ticketDetails = null
) {
	try {
		let allLearnerIds = [];
		for (let id of learnerIds) {
			allLearnerIds.push(parseInt(id));
		}
		// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "CampTakeActions" WHERE "UserId" IN (${allLearnerIds.toString()}) AND "CampaignId" = ${campaignId} AND "DripCampIndex" = ${
		// 	drip_camp.index
		// } AND "DripCampId" = ${drip_camp.id})`;
		// [ids] = await sequelize.query(query);

		let query = `SELECT ARRAY (
			SELECT "UserId"
			FROM "CampTakeActions"
			WHERE "UserId" IN (:allLearnerIds)
			  AND "CampaignId" = :campaignId
			  AND "DripCampIndex" = :dripCampIndex
			  AND "DripCampId" = :dripCampId
		  )`;

		const ids = await sequelize.query(query, {
			replacements: {
				allLearnerIds: allLearnerIds, // Array of user IDs passed as a parameter
				campaignId: campaignId,
				dripCampIndex: drip_camp.index,
				dripCampId: drip_camp.id,
			},
			type: sequelize.QueryTypes.SELECT,
		});

		let findData = ids[0].array;
		allLearnerIds = [];

		if (triggerOn !== null && drip_camp.within && drip_camp.dripActionEndDate === null) {
			[err, dripCamp] = await to(
				Drip_camp.update(
					{
						dripActionEndDate: moment(publishOn).add(drip_camp.within, 'hours').format(),
					},
					{
						where: {
							id: drip_camp.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
		let assignTakeActionToLearners = [];
		if (learnerIds && learnerIds.length > 0) {
			for (let learnerId of learnerIds) {
				let payload = {
					actionType: drip_camp.actionType,
					tagsForAction: drip_camp.tagsForAction,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					UserId: learnerId,
					DripCampIndex: drip_camp.index,
					DripCampId: drip_camp.id,
					CampaignId: campaignId,
					isTriggered: false,
					takeActionOn: triggerOn,
					ClientId: clientId,
					TicketId: ticketDetails?.id ? ticketDetails.id : null,
				};
				if (!findData.includes(parseInt(learnerId))) assignTakeActionToLearners.push(payload);
				if (assignTakeActionToLearners.length === 500) {
					[err, addTakeAction] = await to(CampTakeAction.bulkCreate(assignTakeActionToLearners));
					if (err) console.log('-----Error Assign Take Action To Learner---', err);
					assignTakeActionToLearners = [];
				}
			}
			if (assignTakeActionToLearners.length > 0) {
				[err, addTakeAction] = await to(CampTakeAction.bulkCreate(assignTakeActionToLearners));
				if (err) console.log('-----Error Assign Take Action To Learner---', err);
				assignTakeActionToLearners = [];
			}
		}
	} catch (error) {
		console.log('----Error into assign take action to learner----', error);
	}
};
module.exports.assignTakeActionToLearner = assignTakeActionToLearner;

// This Function is use for assign drip to user
const assignDripToLearner = async function (
	learnerIds,
	campaignId,
	date,
	drip_camp,
	clientId,
	isChatBoat = false,
	ticketDetails = null
) {
	try {
		let publishOn = date;
		let isContactMilestone = false;
		let isZoomMeeting = false;
		let carousleMaxCount;
		if (
			publishOn &&
			['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(drip_camp.dripType)
		) {
			publishOn = await getNextFiftineMinSlot(date, isChatBoat);

			console.log('---date--', date);
			console.log('---Publish On--', publishOn);
		}
		if (publishOn !== null && drip_camp.within && drip_camp.dripActionEndDate === null) {
			[err, dripCamp] = await to(
				Drip_camp.update(
					{
						dripActionEndDate: moment(publishOn).add(drip_camp.within, 'hours').format(),
					},
					{
						where: {
							id: drip_camp.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let isMeta = false;
		let whatsAppNative = null;
		let whatsAppNonNative = null;

		if (drip_camp.dripType === 'Only WhatsApp') {
			[err, whatsAppNative] = await to(
				Drip_whatsapp_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_native data---', err);
			}
		} else if (drip_camp.dripType === 'DripApp with sharing on WhatsApp') {
			[err, whatsAppNonNative] = await to(
				Drip_whatsapp_non_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_non_native data---', err);
			}
		}

		if (whatsAppNative?.WhatsAppSetup?.isMeta == true || whatsAppNonNative?.WhatsAppSetup?.isMeta == true) {
			isMeta = true;
		}

		if (learnerIds && learnerIds.length > 0) {
			let campWhatsAppEmailDrips = [];
			let assignDripToLearner;
			let isValidLicence;
			isValidLicence = await getValidationForSendDripWithCount(clientId, drip_camp.dripType);
			let count = isValidLicence.count;
			let licenceCount = 0;
			let allQuestion = [];
			let addOptionList = [];
			let quationTypeOfPost = false;
			if (
				drip_camp &&
				drip_camp.dripType != 'Only WhatsApp' &&
				drip_camp.dripType != 'Only Teams' &&
				drip_camp.Post &&
				(drip_camp.Post.tempType === 'Poll' ||
					drip_camp.Post.tempType === 'Quiz' ||
					drip_camp.Post.tempType === 'Quiz (Randomised)' ||
					drip_camp.Post.tempType === 'Spin The Wheel' ||
					drip_camp.Post.tempType === 'Offline Task' ||
					drip_camp.Post.tempType == 'Survey')
			) {
				quationTypeOfPost = true;
				if (drip_camp.Post.tempType === 'Quiz (Randomised)') {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: {
								model: DripOption,
							},
							order: [sequelize.random(), ['id', 'ASC']],
							limit: drip_camp.Post.quizRandCount ? drip_camp.Post.quizRandCount : 20,
						})
					);
					if (allQuestionList && allQuestionList.length > 0) {
						for (let question of allQuestionList) {
							let payload = question.convertToJSON();
							let options = question.DripOptions.sort((a, b) => {
								if (a.id < b.id) {
									return -1;
								}
							});
							payload.DripOptions = [];
							payload.DripOptions = options;
							allQuestion.push(payload);
						}
					}
				} else if (drip_camp.Post.tempType === 'Spin The Wheel') {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: [
								{
									model: DripOption,
								},
								{
									model: DripSpinWheelCat,
								},
							],
							order: [
								['id', 'ASC'],
								[{ model: DripOption }, 'id', 'ASC'],
							],
						})
					);
				} else {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: {
								model: DripOption,
							},
							order: [
								['id', 'ASC'],
								[{ model: DripOption }, 'id', 'ASC'],
							],
						})
					);
					allQuestion = allQuestionList;
				}
			}
			if (err) console.log('--Error--Getting Question', err);

			let assignPostToUserList = [];
			let allLearnerIds = [];
			for (let id of learnerIds) {
				allLearnerIds.push(parseInt(id));
			}

			let findData = [];
			if (!isChatBoat) {
				// let query = `SELECT  ARRAY  (SELECT "UserId" FROM "CampWhatsAppEmailDrips" WHERE "UserId" IN (${allLearnerIds.toString()}) AND "CampaignId" = ${campaignId} AND "DripCampIndex" = ${
				// 	drip_camp.index
				// } AND "DripCampId" = ${drip_camp.id}  AND "PostId" = ${drip_camp.PostId});`;
				// [ids] = await sequelize.query(query);

				let query = `SELECT ARRAY (
								SELECT "UserId" 
								FROM "CampWhatsAppEmailDrips" 
								WHERE "UserId" IN (:allLearnerIds) 
								AND "CampaignId" = :campaignId 
								AND "DripCampIndex" = :dripCampIndex 
								AND "DripCampId" = :dripCampId 
								AND "PostId" = :dripCampPostId
							);`;

				ids = await sequelize.query(query, {
					replacements: {
						allLearnerIds: allLearnerIds, // Use the array safely
						campaignId: campaignId,
						dripCampIndex: drip_camp.index,
						dripCampId: drip_camp.id,
						dripCampPostId: drip_camp.PostId,
					},
					type: sequelize.QueryTypes.SELECT,
				});

				findData = ids[0].array;
			}

			/////////////////////////////////////////////////////////////////Changes For Testing////////////////////////////////////////////////

			allLearnerIds = [];

			//Check dripTriggerRule is Send based on contact milestone or not
			if (drip_camp?.dripTriggerRule === 'Send based on contact milestone') {
				// Find Learner Custom Fields
				isContactMilestone = true;
				learnerIds = await getLearnerMilestone(learnerIds, drip_camp, campaignId);
				console.log('assignDripToLearnerOnCreateCampaign--  learnerIds', learnerIds);
			}

			for (let learner_id of learnerIds) {
				let learnerId = learner_id;
				let triggerError = null;
				if (isContactMilestone) {
					learnerId = learner_id.UserId;
					publishOn = learner_id[drip_camp.milestoneField];
					if (publishOn == null) {
						triggerError = 'Milestone Field is not found.';
					}
				}
				let isPublished = true;
				if (publishOn == null) {
					isPublished = false;
				}
				let postId = drip_camp.PostId;
				let noOfTimeSpinWheel = 0;

				if (drip_camp.Post && drip_camp.Post?.isZoomMeeting) {
					isZoomMeeting = true;
				}

				if (
					drip_camp.Post &&
					drip_camp.Post.Drip_whatsapp_non_natives &&
					drip_camp.Post.Drip_whatsapp_non_natives.length > 0
				) {
					if (drip_camp.Post.Drip_whatsapp_non_natives[0].existingDripId) {
						postId = drip_camp.Post.Drip_whatsapp_non_natives[0].existingDripId;
					}
					if (drip_camp.Post.Drip_whatsapp_non_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_whatsapp_non_natives[0].noOfTimeSpin;
					}
				} else if (
					drip_camp.Post &&
					drip_camp.Post.Drip_email_non_natives &&
					drip_camp.Post.Drip_email_non_natives.length > 0
				) {
					if (drip_camp.Post.Drip_email_non_natives[0].existingDripId) {
						postId = drip_camp.Post.Drip_email_non_natives[0].existingDripId;
					}
					if (drip_camp.Post.Drip_email_non_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_email_non_natives[0].noOfTimeSpin;
					}
				} else if (drip_camp.Post && drip_camp.Post.Drip_natives && drip_camp.Post.Drip_natives.length > 0) {
					if (drip_camp.Post.Drip_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_natives[0].noOfTimeSpin;
					}
				}

				if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Carousel') {
					[err, carousleMaxCount] = await to(
						Post_asset_mapping.count({
							where: {
								PostId: postId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				let externalLink = {
					externalLinkClick1: false,
					externalLinkClick2: false,
					externalLinkClick3: false,
					externalLinkClick4: false,
					externalLinkClick5: false,
					externalLinkClick6: false,
					externalLinkClick7: false,
					externalLinkClick8: false,
					externalLinkClick9: false,
					externalLinkClick10: false,
				};

				let custTempPageViewed = {};

				if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.customTemplate &&
					drip_camp.Post.tempType == 'Custom Template'
				) {
					const dom = new JSDOM(drip_camp.Post.customTemplate);
					const doc = dom.window.document;

					let pageElements = doc.querySelectorAll('div[id^="page"]');

					pageElements.forEach((pageElement, index) => {
						let pageNumber = index + 1; // Pages are named page1, page2, etc.
						custTempPageViewed[`page${pageNumber}_viewed`] = 'NO';
					});
				}

				let payload_1 = {
					UserId: parseInt(learnerId),
					PostId: postId,
					DripCampId: drip_camp.id,
					CampaignId: campaignId,
					is_deleted: false,
					isLiked: false,
					isBookmarked: false,
					submit: false,
					score: 0,
					DripCampIndex: drip_camp.index,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					publishOn: publishOn,
					isPublished: isPublished,
					code: Math.random().toString(36).slice(2),
					actionStatus: 'NA',
					actionIntent: 'NA',
					isZoomMeeting: isZoomMeeting,
					externalLink: externalLink,
					max: carousleMaxCount ? carousleMaxCount : null,
					noOfTimeSpin: noOfTimeSpinWheel,
					custTempPageViewed: [custTempPageViewed],
				};

				if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Single Image') {
					payload_1.actionStatus = 'NA';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					!drip_camp.Post.externalLink1 &&
					!drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Carousel'
				) {
					payload_1.actionStatus = 'NA';
					payload_1.actionIntent = 'Not Swiped';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.externalLink1 &&
					drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Carousel'
				) {
					payload_1.actionStatus = 'Button Not Clicked';
					payload_1.actionIntent = 'Not Swiped';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					!drip_camp.Post.externalLink1 &&
					!drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Video'
				) {
					payload_1.actionStatus = 'NA';
					payload_1.actionIntent = 'Not Watched';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.externalLink1 &&
					drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Video'
				) {
					payload_1.actionStatus = 'Button Not Clicked';
					payload_1.actionIntent = 'Not Watched';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Poll') {
					payload_1.actionStatus = 'Not Submitted';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					(drip_camp.Post.tempType == 'Quiz' || drip_camp.Post.tempType == 'Quiz (Randomised)')
				) {
					payload_1.actionStatus = 'Not Submitted';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Offline Task') {
					payload_1.actionStatus = 'Not Submitted';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Survey') {
					payload_1.actionStatus = 'Not Submitted';
				}
				if (['Only WhatsApp', 'Only Teams', 'Only Email'].indexOf(drip_camp.dripType) == -1) {
					if (
						payload_1.publishOn &&
						payload_1.publishOn != null &&
						drip_camp.unAssignDayCount &&
						drip_camp.unAssignDayCount != null
					) {
						payload_1.expiredOn = moment(new Date(payload_1.publishOn))
							.add(drip_camp.unAssignDayCount, 'days')
							.format();
					}
					if (isValidLicence.unlimited || count > 0) {
						if (!findData.includes(parseInt(learnerId))) {
							//if (quationTypeOfPost) {
							[err, assignDripToLearner] = await to(Assigned_post_to_user.create(payload_1));
							if (err) console.log('-----Error Assign Drip To Learner---', err);

							licenceCount++;

							if (quationTypeOfPost) {
								for (let question of allQuestion) {
									let questionPayload = {
										question: question.question,
										questionType: question.questionType,
										answerCount: question.answerCount,
										PostId: question.PostId,
										AssignedPostToUserId: assignDripToLearner.id,
										AssetId: question.AssetId,
										allowFileTypes: question.allowFileTypes,
										fileSize: question.fileSize,
										numberOfFiles: question.numberOfFiles,
										isTextResponse: question.isTextResponse,
										isFileSubmission: question.isFileSubmission,
										surveyCharLimit: question.surveyCharLimit,
										multipleOption: question.multipleOption,
										DripQuestionId: question.id,
										isQuesRequired: question.isQuesRequired,
										zoomLinkTo: question.zoomLinkTo,
										UploadOnVimeo: question.UploadOnVimeo,
										showTranscript: question.showTranscript,
										aiReview: question.aiReview,
										spinCatIndex:
											question && question.DripSpinWheelCat && question.DripSpinWheelCat.category_index
												? question.DripSpinWheelCat.category_index
												: null,
										spinCatName:
											question && question.DripSpinWheelCat && question.DripSpinWheelCat.category_name
												? question.DripSpinWheelCat.category_name
												: null,
										spinQueScore: question.spinQueScore ? question.spinQueScore : null,
										ratingType: question.ratingType,
										ratingMinLabel: question.ratingMinLabel,
										ratingMaxLabel: question.ratingMaxLabel,
										ratingScaleMinCount: question.ratingScaleMinCount,
										ratingScaleMaxCount: question.ratingScaleMaxCount,
									};
									let addQuestion;
									[err, addQuestion] = await to(DripUserQuestion.create(questionPayload));
									if (err) {
										console.log('--Error---Drip Native---assigned Question to User', err);
									}
									let questionId = addQuestion.id;
									for (let option of question.DripOptions) {
										let optionPayload = {
											text: option.text,
											correctAns: option.isCorrectAnswer,
											userAnswer: null,
											selectedAns: false,
											sr_no: option.sr_no,
											userSeq: 0,
											AssetId: option.AssetId,
											DripUserQuestionId: questionId,
											AssignedPostToUserId: assignDripToLearner.id,
											DripOptionId: option.id,
											skipQueType: option.skipQueType,
										};
										addOptionList.push(optionPayload);
									}

									if (addOptionList.length === 500) {
										[err, addOption] = await to(DripUserOption.bulkCreate(addOptionList));
										if (err) console.log('--Error---Drip Native---Add Option', err);
										addOptionList = [];
									}
								}
							}
							// } else {
							// 	assignPostToUserList.push(payload_1);
							// 	licenceCount++;
							// 	if (assignPostToUserList.length === 500) {
							// 		[err, assignDripToLearner] = await to(Assigned_post_to_user.bulkCreate(assignPostToUserList));
							// 		if (err) console.log('-----Error Assign Drip To Learner---', err);
							// 		assignPostToUserList = [];
							// 	}
							// }
						}
					} else {
						console.log('----Not Valid Licence----');
					}
				} else {
					assignDripToLearner = null;
				}

				let payload_2 = {
					dripType: drip_camp.dripType,
					CampaignId: campaignId,
					DripCampId: drip_camp.id,
					PostId: drip_camp.PostId,
					DripCampIndex: drip_camp.index,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					publishOn: publishOn,
					UserId: parseInt(learnerId),
					isTriggered: false,
					errorMessage: triggerError,
					AssignedPostToUserId: assignDripToLearner && assignDripToLearner.id ? assignDripToLearner.id : null,
					code:
						assignDripToLearner && assignDripToLearner.code
							? assignDripToLearner.code
							: Math.random().toString(36).slice(2),
					TicketId: ticketDetails?.id ? ticketDetails.id : null,
					isMeta: isMeta,
				};

				if (isValidLicence.unlimited || count > 0) {
					if (!findData.includes(parseInt(learnerId))) campWhatsAppEmailDrips.push(payload_2);
					if (campWhatsAppEmailDrips.length === 500) {
						[err, camp_whatsApp_email_drip_] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
						if (err) console.log('-----Error Campaign WhatsApp Email Drip ---', err);
						campWhatsAppEmailDrips = [];
					}
					//add incremental Count of Drip
					if (drip_camp.dripType == 'Only WhatsApp' || drip_camp.dripType == 'Only Teams') {
						licenceCount++;
					}
				} else {
					console.log('-----Not Valid License is avalible---');
				}
				count--;
			}
			if (campWhatsAppEmailDrips && campWhatsAppEmailDrips.length > 0) {
				[err, camp_whatsApp_email_drip_] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
				if (err) console.log('-----Error Campaign WhatsApp Email Drip ---', err);
				campWhatsAppEmailDrips = [];
			}
			// if (assignPostToUserList.length > 0) {
			// 	[err, assignDripToLearner] = await to(Assigned_post_to_user.bulkCreate(assignPostToUserList));
			// 	if (err) console.log('-----Error Assign Drip To Learner---', err);
			// 	assignPostToUserList = [];
			// }
			if (addOptionList.length > 0) {
				[err, addOption] = await to(DripUserOption.bulkCreate(addOptionList));
				if (err) console.log('--Error---Drip Native---Add Option', err);
				addOptionList = [];
			}
			if (licenceCount > 0) await updateDripMultipleCountInLicense(clientId, drip_camp.dripType, licenceCount);
		}
	} catch (error) {
		console.log('----Error into assign drip to learner----', error);
	}
};
module.exports.assignDripToLearner = assignDripToLearner;

//Get Trigger Date of drip by using Campaign and selected drip Data
const getTriggerDateOfDrip = async function (campaignDetails, dripCamp) {
	try {
		const notTackAction = [
			'Not read on channel',
			'Not read on drip app',
			'Drip Action not taken',
			'Drip submit Action not taken',
		];
		let triggerDate;
		if (
			(dripCamp.dripTriggerRule == 'Send based on system activity' && dripCamp.dripFlowType == 'Send a Drip') ||
			(dripCamp.actionTriggerRule == 'Take action based on system activity' && dripCamp.dripFlowType == 'Take Action')
		) {
			let flag = true;
			let dependencyIndex = dripCamp.dependencyDripIndex;
			let count = 0;
			let dayCount = 0;

			while (flag) {
				for (let temp of campaignDetails.Drip_camps) {
					if (dependencyIndex == temp.index) {
						let temp_Drip_camp = temp;

						if (temp_Drip_camp.dripFlowType == 'Send a Drip') {
							if (temp_Drip_camp.dripTriggerRule == 'Send on date') {
								dayCount = dayCount + temp_Drip_camp.sendAfter + dripCamp.sendAfter;
								triggerDate = moment(new Date(temp_Drip_camp.dripTriggerDate)).add(dayCount, 'days').format();
								flag = false;
							} else if (
								(temp_Drip_camp.dripTriggerRule == 'Send based on system activity' &&
									temp_Drip_camp.systemActionType != 'Based on tags added' &&
									temp_Drip_camp.index == 0) ||
								temp_Drip_camp.dripTriggerRule === 'Send on drip flow start date'
							) {
								if (campaignDetails && campaignDetails.startRule == 'Start on date') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment(new Date(campaignDetails.startDate)).add(dayCount, 'days').format();
									flag = false;
								} else if (campaignDetails && campaignDetails.startRule == 'Start when learner is added to group') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment().add(dayCount, 'days').format();
									flag = false;
								} else if (campaignDetails && campaignDetails.startRule == 'Start when tag is added to learner') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment().add(dayCount, 'days').format();
									flag = false;
								} else {
									return false;
								}
							} else if (
								temp_Drip_camp.dripTriggerRule == 'Send based on system activity' &&
								temp_Drip_camp.systemActionType != 'Based on tags added'
							) {
								if (
									temp_Drip_camp.systemActionType == 'Based on drip sent' ||
									temp_Drip_camp.systemActionType == 'Based on previous action taken'
								) {
									dependencyIndex = temp_Drip_camp.dependencyDripIndex;
									dayCount = dayCount + temp_Drip_camp.sendAfter;
								}
							} else if (temp_Drip_camp.dripTriggerRule == 'Send based on user activity') {
								return false;
							}
						} else if (temp_Drip_camp.dripFlowType == 'Take Action') {
							if (temp_Drip_camp.actionTriggerRule == 'Take action on date') {
								dayCount = dayCount + temp_Drip_camp.sendAfter + dripCamp.sendAfter;
								triggerDate = moment(new Date(temp_Drip_camp.dripTriggerDate)).add(dayCount, 'days').format();
								flag = false;
							} else if (
								temp_Drip_camp.actionTriggerRule == 'Take action based on system activity' &&
								temp_Drip_camp.systemActionType != 'Based on tags added' &&
								temp_Drip_camp.index == 0
							) {
								if (campaignDetails && campaignDetails.startRule == 'Start on date') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment(new Date(campaignDetails.startDate)).add(dayCount, 'days').format();
									flag = false;
								} else if (campaignDetails && campaignDetails.startRule == 'Start when learner is added to group') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment().add(dayCount, 'days').format();
									flag = false;
								} else if (campaignDetails && campaignDetails.startRule == 'Start when tag is added to learner') {
									dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
									triggerDate = moment().add(dayCount, 'days').format();
									flag = false;
								} else {
									flag = false;
								}
							} else if (
								temp_Drip_camp.actionTriggerRule == 'Take action based on system activity' &&
								temp_Drip_camp.systemActionType != 'Based on tags added'
							) {
								if (
									temp_Drip_camp.systemActionType == 'Based on drip sent' ||
									temp_Drip_camp.systemActionType == 'Based on previous action taken'
								) {
									dependencyIndex = temp_Drip_camp.dependencyDripIndex;
									dayCount = dayCount + temp_Drip_camp.sendAfter;
								}
							} else if (
								temp_Drip_camp.actionTriggerRule === 'Take action on drip flow start date' &&
								temp_Drip_camp.startRule !== 'Start on date'
							) {
								dayCount = dayCount + temp_Drip_camp.sendAfter + campaignDetails.startAfter + dripCamp.sendAfter;
								triggerDate = moment(new Date()).add(dayCount, 'days').format();
								flag = false;
							} else if (temp_Drip_camp.actionTriggerRule == 'Take action based on user activity') {
								return false;
							}
						}
					}
				}

				count++;
				if (count == campaignDetails.Drip_camps.length) {
					flag = false;
				}
			}
			if (triggerDate) {
				return triggerDate;
			} else {
				return false;
			}
		} else if (
			(dripCamp.dripTriggerRule == 'Send based on user activity' &&
				dripCamp.dripFlowType == 'Send a Drip' &&
				notTackAction.includes(dripCamp.userAction)) ||
			(dripCamp.actionTriggerRule == 'Take action based on user activity' &&
				dripCamp.dripFlowType == 'Take Action' &&
				notTackAction.includes(dripCamp.userAction))
		) {
			let flag = true;
			let dependencyIndex = dripCamp.dependencyDripIndex;
			let count = 0;
			let dayCount = 0;
			while (flag) {
				for (let temp of campaignDetails.Drip_camps) {
					let temp_Drip_camp = temp;
					if (dependencyIndex == temp.index) {
						triggerDate = temp_Drip_camp.dripTriggerDate
							? moment(new Date(temp_Drip_camp.dripTriggerDate)).add(dripCamp.within, 'hours').format()
							: moment(new Date()).add(dripCamp.within, 'hours').format();
						flag = false;

						[err, dripCampUpdate] = await to(
							Drip_camp.update(
								{
									dripActionEndDate: moment(triggerDate).format(),
								},
								{
									where: {
										id: dripCamp.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}

				if (count == campaignDetails.Drip_camps.length) {
					flag = false;
				}
				count++;
			}
			return false;
		} else {
			console.log('--------Get Trigger Date Of Drip return FALSE------');
			return false;
		}
	} catch (error) {
		console.log('--Error Get Trigger Date Of Drip---', error);
		return false;
	}
};
module.exports.getTriggerDateOfDrip = getTriggerDateOfDrip;

// when user take any action in drip then this function will call for take required action
const actionByLearner = async function (userId, campaignId, index, actionType, score) {
	try {
		[err, campaignDetail] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					isDeleted: false,
					status: 'Running',
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							dependencyDripIndex: index,
							userAction: actionType,
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		// Delivered Delivering Performed Performing
		if (err) console.log('-----Error Get Campaign Details at Check Read Action By Learner---', err);
		let index_ = index;

		let flag = true;
		if (campaignDetail) {
			//let count = 0;
			//while (flag) {
			for (let temp of campaignDetail.Drip_camps) {
				if (temp.dependencyDripIndex == index_) {
					temp_Drip_camp = temp;
					if (actionType != 'Activity Outcome') {
						if (
							temp_Drip_camp.dripFlowType == 'Send a Drip' &&
							((temp_Drip_camp.dripTriggerRule == 'Send based on user activity' && index == index_) ||
								temp_Drip_camp.dripTriggerRule == 'Send based on system activity')
						) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							//index_ = temp_Drip_camp.index;
							if (
								['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(temp_Drip_camp.dripType)
							) {
								let date = await getNextFiftineMinSlot();
								triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();
							}
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							[err, updateTriggerDate] = await to(
								Assigned_post_to_user.update(
									{
										publishOn: triggerDate,
										isPublished: true,
										expiredOn: expiredOn,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
											isPublished: false,
										},
									}
								)
							);
							if (err) console.log('-Update Published Date Assigned Drip--', err);

							[err, updateTriggerDate] = await to(
								CampWhatsAppEmailDrip.update(
									{
										publishOn: triggerDate,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
											isTriggered: false,
										},
									}
								)
							);
							if (err) console.log('-Update Published Date Assigned Drip 02--', err);

							await baseOnDripSend(parseInt(userId), campaignId, temp_Drip_camp.index);
						} else if (
							temp_Drip_camp.dripFlowType == 'Take Action' &&
							((temp_Drip_camp.actionTriggerRule == 'Take action based on user activity' && index == index_) ||
								temp_Drip_camp.actionTriggerRule == 'Take action based on system activity')
						) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							//index_ = temp_Drip_camp.index;
							[err, updateTriggerDate] = await to(
								CampTakeAction.update(
									{
										takeActionOn: triggerDate,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											isTriggered: false,
										},
									}
								)
							);
							if (err) {
								console.log('-Update Trigger Date OF Take Action--', err);
							}
							await baseOnDripSend(parseInt(userId), campaignId, temp_Drip_camp.index);
						} else {
							flag = false;
						}
					} else {
						if (
							temp_Drip_camp.dripFlowType == 'Send a Drip' &&
							((temp_Drip_camp.dripTriggerRule == 'Send based on user activity' && index == index_) ||
								temp_Drip_camp.dripTriggerRule == 'Send based on system activity')
						) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							if (
								['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(temp_Drip_camp.dripType)
							) {
								let date = await getNextFiftineMinSlot();
								triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();
							}
							if (
								(temp_Drip_camp.activityScoreType == 'Less than' && temp_Drip_camp.score > score) ||
								(temp_Drip_camp.activityScoreType == 'Greater than' && temp_Drip_camp.score < score) ||
								(temp_Drip_camp.activityScoreType == 'Equal' && temp_Drip_camp.score == score)
							) {
								//index_ = temp_Drip_camp.index;
								let expiredOn = null;
								if (
									triggerDate &&
									triggerDate != null &&
									temp_Drip_camp.unAssignDayCount &&
									temp_Drip_camp.unAssignDayCount != null
								) {
									expiredOn = moment(new Date(triggerDate)).add(temp_Drip_camp.unAssignDayCount, 'days').format();
								}
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												UserId: parseInt(userId),
												CampaignId: campaignId,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
												isPublished: false,
											},
										}
									)
								);
								if (err) {
									console.log('-Update Published Date Assigned Drip--', err);
								}

								[err, updateTriggerDate] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
										},
										{
											where: {
												UserId: parseInt(userId),
												CampaignId: campaignId,
												DripCampIndex: temp_Drip_camp.index,
												PostId: temp_Drip_camp.Post.id,
											},
										}
									)
								);
								if (err) {
									console.log('-Update Published Date Assigned Drip 02--', err);
								}
								await baseOnDripSend(parseInt(userId), campaignId, temp_Drip_camp.index);
							}
						} else if (
							temp_Drip_camp.dripFlowType == 'Take Action' &&
							((temp_Drip_camp.actionTriggerRule == 'Take action based on user activity' && index == index_) ||
								temp_Drip_camp.actionTriggerRule == 'Take action based on system activity')
						) {
							let date = await getNextFiftineMinSlot();
							let triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();

							if (
								(temp_Drip_camp.activityScoreType == 'Less than' && temp_Drip_camp.score > score) ||
								(temp_Drip_camp.activityScoreType == 'Greater than' && temp_Drip_camp.score < score) ||
								(temp_Drip_camp.activityScoreType == 'Equal' && temp_Drip_camp.score == score)
							) {
								//index_ = temp_Drip_camp.index;

								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												UserId: parseInt(userId),
												CampaignId: campaignId,
												DripCampIndex: temp_Drip_camp.index,
												isTriggered: false,
											},
										}
									)
								);
								if (err) {
									console.log('-Update Trigger Date OF Take Action--', err);
								}
								await baseOnDripSend(parseInt(userId), campaignId);
							}
						} else {
							flag = false;
						}
					}
				}
			}
			// if (count >= campaignDetail.Drip_camps.length) {
			// 	flag = false;
			// }
			// count++;
			//}
		}

		return true;
	} catch (error) {
		console.log('--Error Read action by learner--', error);
	}
};
module.exports.actionByLearner = actionByLearner;

const selectQuickReplyByLearner = async function (userId, campaignId, index, actionType, selectedQuickReplyByLearner) {
	try {
		console.log('---------Into Quick Replay function----------');
		let campaignDetail;
		[err, campaignDetail] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					isDeleted: false,
					status: 'Running',
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							dependencyDripIndex: index,
							userAction: actionType,
							quickReply: {
								[sequelize.Op.iLike]: selectedQuickReplyByLearner,
							},
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		// Delivered Delivering Performed Performing
		if (err) console.log('-----Error Get Campaign Details at Check Read Action By Learner---', err);

		let index_ = index;
		if (campaignDetail?.Drip_camps?.length > 0) {
			for (let temp of campaignDetail.Drip_camps) {
				if (temp.dependencyDripIndex == index_) {
					temp_Drip_camp = temp;

					if (
						temp_Drip_camp.dripFlowType == 'Send a Drip' &&
						((temp_Drip_camp.dripTriggerRule == 'Send based on user activity' && index == index_) ||
							temp_Drip_camp.dripTriggerRule == 'Send based on system activity')
					) {
						let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
						//index_ = temp_Drip_camp.index;
						if (
							['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(temp_Drip_camp.dripType)
						) {
							let date = await getNextFiftineMinSlot();
							triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();
						}
						let expiredOn = null;
						if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
							expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
						}
						[err, updateTriggerDate] = await to(
							Assigned_post_to_user.update(
								{
									publishOn: triggerDate,
									isPublished: true,
									expiredOn: expiredOn,
								},
								{
									where: {
										UserId: parseInt(userId),
										CampaignId: campaignId,
										DripCampIndex: temp_Drip_camp.index,
										PostId: temp_Drip_camp.Post.id,
										isPublished: false,
									},
								}
							)
						);
						if (err) console.log('-Update Published Date Assigned Drip--', err);

						[err, updateTriggerDate] = await to(
							CampWhatsAppEmailDrip.update(
								{
									publishOn: triggerDate,
								},
								{
									where: {
										UserId: parseInt(userId),
										CampaignId: campaignId,
										DripCampIndex: temp_Drip_camp.index,
										PostId: temp_Drip_camp.Post.id,
										isTriggered: false,
									},
								}
							)
						);
						if (err) console.log('-Update Published Date Assigned Drip 02--', err);
						await baseOnDripSend(parseInt(userId), campaignId, temp_Drip_camp.index);
					} else if (
						temp_Drip_camp.dripFlowType == 'Take Action' &&
						((temp_Drip_camp.actionTriggerRule == 'Take action based on user activity' && index == index_) ||
							temp_Drip_camp.actionTriggerRule == 'Take action based on system activity')
					) {
						let date = await getNextFiftineMinSlot();
						let triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();

						//index_ = temp_Drip_camp.index;
						[err, updateTriggerDate] = await to(
							CampTakeAction.update(
								{
									takeActionOn: triggerDate,
								},
								{
									where: {
										UserId: parseInt(userId),
										CampaignId: campaignId,
										DripCampIndex: temp_Drip_camp.index,
										isTriggered: false,
									},
								}
							)
						);
						if (err) {
							console.log('-Update Trigger Date OF Take Action--', err);
						}
						await baseOnDripSend(parseInt(userId), campaignId, temp_Drip_camp.index);
					} else {
						flag = false;
					}
				}
			}
		}
	} catch (error) {
		console.log('--select Quick Reply By Learner--Error===>>>', error);
	}
};
module.exports.selectQuickReplyByLearner = selectQuickReplyByLearner;

//This function is called when any user added into then Learner Group
const learnerAddedIntoGroupCampaignStartRule = async function (groupId, learner_user_ids) {
	try {
		console.log('---groupIdStartRule---', groupId);
		console.log('---learner_user_idsStartRule---', learner_user_ids);

		[err, learnerGroups] = await to(
			CampUserGroupStartRule.findAll({
				where: {
					UserGroupId: groupId,
				},
				include: [
					{
						model: Campaign,
						where: {
							startRule: 'Start when learner is added to group',
							isDeleted: false,
							status: 'Running',
							flowType: 'Campaign',
							endDate: {
								[Op.gte]: new Date(),
							},
						},
						include: {
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							where: {
								status: ['Scheduled', 'Delivering', 'Performing'],
							},
							include: [
								{
									model: Post,
									drip_status: 'Published',
									required: false,
									attributes: ['tempType', 'id', 'drip_status', 'drip_type'],
								},
							],
							order: [['id', 'ASC']],
						},
					},
				],
				attributes: ['UserGroupId'],
			})
		);
		if (err) console.log('--Error at Get All Campaign start Rule with Learner Group --', err);

		if (learnerGroups && learnerGroups.length > 0) {
			for (let learnerGroup of learnerGroups) {
				for (let drip_camp of learnerGroup.Campaign.Drip_camps) {
					// Check Campagin Drip Type
					let campaignId = learnerGroup.Campaign.id;
					let clientId = learnerGroup.Campaign.ClientId;
					let campaignDetails = learnerGroup.Campaign;
					if (drip_camp.dripFlowType == 'Send a Drip') {
						if (drip_camp.dripTriggerRule == 'Send on drip flow start date') {
							let triggerDate = moment(new Date(campaignDetails.startDate)).add(drip_camp.sendAfter, 'days').format();
							await assignDripToLearner(learner_user_ids, campaignId, triggerDate, drip_camp, clientId);
						} else if (
							drip_camp.dripTriggerRule == 'Send based on system activity' &&
							drip_camp.index == 0 &&
							drip_camp.systemActionType !== 'Based on tags added'
						) {
							if (campaignDetails && campaignDetails.startRule == 'Start when learner is added to group') {
								let triggerDate = moment(new Date())
									.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
									.format();
								await assignDripToLearner(learner_user_ids, campaignId, triggerDate, drip_camp, clientId);
							} else {
								await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, clientId);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on system activity') {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignDripToLearner(learner_user_ids, campaignId, triggerDate, drip_camp, clientId);
							} else {
								await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, clientId);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on user activity') {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignDripToLearner(learner_user_ids, campaignId, triggerDate, drip_camp, clientId);
							} else {
								await assignDripToLearner(learner_user_ids, campaignId, null, drip_camp, clientId);
							}
						} else if (drip_camp.dripTriggerRule == 'Send based on contact milestone') {
							await assignDripToLearner([...learner_user_ids], campaignId, null, drip_camp, clientId);
						}
						// Take Action
					} else if (drip_camp.dripFlowType == 'Take Action') {
						if (drip_camp.actionTriggerRule == 'Take action on drip flow start date') {
							let triggerDate = moment(new Date(campaignDetails.startDate)).add(drip_camp.sendAfter, 'days').format();
							await assignTakeActionToLearner(
								learner_user_ids,
								campaignId,
								triggerDate,
								drip_camp,
								learnerGroup.Campaign.ClientId
							);
						} else if (
							drip_camp.actionTriggerRule == 'Take action based on system activity' &&
							drip_camp.index == 0 &&
							drip_camp.systemActionType !== 'Based on tags added'
						) {
							if (campaignDetails && campaignDetails.startRule == 'Start when learner is added to group') {
								let triggerDate = moment(new Date())
									.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
									.format();
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							} else {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							}
						} else if (drip_camp.actionTriggerRule == 'Take action based on system activity') {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);

							if (triggerDate) {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							} else {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							}
						} else if (drip_camp.actionTriggerRule == 'Take action based on user activity') {
							let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
							if (triggerDate) {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									triggerDate,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							} else {
								await assignTakeActionToLearner(
									learner_user_ids,
									campaignId,
									null,
									drip_camp,
									learnerGroup.Campaign.ClientId
								);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('----Eroor Other Campaign Start Rule---', error);
	}
};
module.exports.learnerAddedIntoGroupCampaignStartRule = learnerAddedIntoGroupCampaignStartRule;

//Get all uuper level Client Id
const getAllUpperLevelClientId = async function (clientId) {
	try {
		let flag = true;
		let parentClientId = clientId;
		let clientListIds = [];
		clientListIds.push(parentClientId);
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, client] = await to(
				Client.findOne({
					where: {
						id: parentClientId,
					},
				})
			);
			if (err) {
				console.log('- Errr When Get Client--', err);
			}

			if (client && client.Associate_client_id) {
				parentClientId = client.Associate_client_id;
				clientListIds.push(parentClientId);
			} else {
				flag = false;
			}
		}
		return clientListIds;
	} catch (error) {
		console.log('---Error When Get all upper level client ids--', error);
	}
};
module.exports.getAllUpperLevelClientId = getAllUpperLevelClientId;

//This function is called when any new tag added into any User. This function use for only when campaign starting rule is tag
const learnerAddedTagsCampaignStartRule = async function (
	tag,
	clientId,
	userId,
	isChatBoat = false,
	ticketDetails = null
) {
	try {
		console.log('-------------In Tags-----------');
		let tags;
		console.log('----Client Id-1--', clientId);
		tags = tag.split(',');
		let clientIds = await getAllUpperLevelClientId(clientId);
		let err;
		// check FLow Type
		let flow_type = 'Campaign';

		if (isChatBoat) {
			flow_type = 'Conversational';
		}

		await systemActionBasedOnTagAdded(tags, clientIds, userId, isChatBoat);

		[err, campaigns] = await to(
			Campaign.findAll({
				where: {
					startRule: 'Start when tag is added to learner',
					isDeleted: false,
					status: 'Running',
					ClientId: clientIds,
					flowType: flow_type,
					endDate: {
						[Op.gte]: new Date(),
					},
				},
				include: [
					{
						model: CampaignTagMapping,
						where: {
							tag: tags,
						},
					},
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
						order: [['id', 'ASC']],
					},
				],
			})
		);
		if (err) {
			console.log('--Error Get all Campaign List into Learner Assed Tags Campaign Start Rule ---', err);
		}

		if (campaigns && campaigns.length > 0) {
			for (let campaignDetails of campaigns) {
				[err, userGroups] = await to(
					Campaign_user_group_mapping.findAll({
						where: {
							CampaignId: campaignDetails.id,
						},
						include: [
							{
								model: User_group,
								include: [
									{
										model: User,
										through: 'User_group_mapping',
										where: {
											id: userId,
											status: true,
											cStatus: 'Active',
											is_archive: false,
										},
										attributes: ['id'],
									},
								],
								required: true,
								attributes: ['id', 'title', 'UserId'],
							},
						],
						attributes: ['CampaignId'],
					})
				);
				if (err) {
					console.log('--Error When Get Details of USer Groups----', err);
				}

				if (userGroups && userGroups.length > 0) {
					campaignDetails = campaignDetails.convertToJSON();
					let flag = true;
					if (campaignDetails.operator == 'OR') {
					} else if (campaignDetails.operator == 'AND') {
						[err, getAllTags] = await to(
							CampaignTagMapping.findAll({
								where: {
									CampaignId: campaignDetails.id,
								},
								attributes: ['tag'],
							})
						);
						if (err) {
							console.log('-----Error----', err);
						}

						for (let tag of getAllTags) {
							if (tags.indexOf(tag.tag) <= -1) {
								flag = false;
							}
						}
					}
					if (flag) {
						for (let drip_camp of campaignDetails.Drip_camps) {
							// Check Campagin Drip Type
							let campaignId = campaignDetails.id;
							let clientId = campaignDetails.ClientId;
							if (drip_camp.dripFlowType == 'Send a Drip') {
								if (drip_camp.dripTriggerRule == 'Send on drip flow start date') {
									let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
									console.log('---triggerDate--', triggerDate);
									console.log('---drip_camp.sendAfter--', drip_camp.sendAfter);
									await assignDripToLearner(
										[userId],
										campaignId,
										triggerDate,
										drip_camp,
										clientId,
										isChatBoat,
										ticketDetails
									);
								} else if (
									drip_camp.dripTriggerRule == 'Send based on system activity' &&
									drip_camp.index == 0 &&
									drip_camp.systemActionType != 'Based on tags added'
								) {
									if (campaignDetails && campaignDetails.startRule == 'Start when tag is added to learner') {
										let triggerDate = moment(new Date())
											.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
											.format();
										await assignDripToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									} else {
										await assignDripToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									}
								} else if (
									drip_camp.dripTriggerRule == 'Send based on system activity' &&
									drip_camp.systemActionType != 'Based on tags added'
								) {
									let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
									if (triggerDate) {
										await assignDripToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									} else {
										await assignDripToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									}
								} else if (drip_camp.dripTriggerRule == 'Send based on user activity') {
									let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
									if (triggerDate) {
										await assignDripToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									} else {
										await assignDripToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											clientId,
											isChatBoat,
											ticketDetails
										);
									}
								} else if (drip_camp.dripTriggerRule == 'Send based on contact milestone') {
									await assignDripToLearner([userId], campaignId, null, drip_camp, clientId, isChatBoat, ticketDetails);
								}
							} else if (drip_camp.dripFlowType == 'Take Action') {
								if (drip_camp.actionTriggerRule == 'Take action on drip flow start date') {
									let triggerDate = moment(new Date(campaignDetails.startDate))
										.add(drip_camp.sendAfter, 'days')
										.format();
									await assignTakeActionToLearner(
										[userId],
										campaignId,
										triggerDate,
										drip_camp,
										campaignDetails.ClientId
									);
								} else if (
									drip_camp.actionTriggerRule == 'Take action based on system activity' &&
									drip_camp.index == 0 &&
									drip_camp.systemActionType !== 'Based on tags added'
								) {
									if (campaignDetails && campaignDetails.startRule == 'Start when tag is added to learner') {
										let triggerDate = moment(new Date())
											.add(drip_camp.sendAfter + campaignDetails.startAfter, 'days')
											.format();
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											campaignDetails.ClientId,
											ticketDetails
										);
									} else {
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											campaignDetails.ClientId,
											ticketDetails
										);
									}
								} else if (drip_camp.actionTriggerRule == 'Take action based on system activity') {
									let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
									if (triggerDate) {
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											campaignDetails.ClientId
										);
									} else {
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											campaignDetails.ClientId,
											ticketDetails
										);
									}
								} else if (drip_camp.actionTriggerRule == 'Take action based on user activity') {
									let triggerDate = await getTriggerDateOfDrip(campaignDetails, drip_camp);
									if (triggerDate) {
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											triggerDate,
											drip_camp,
											campaignDetails.ClientId
										);
									} else {
										await assignTakeActionToLearner(
											[userId],
											campaignId,
											null,
											drip_camp,
											campaignDetails.ClientId,
											ticketDetails
										);
									}
								}
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Error at Learner Added Tags Campaign Start Rule----', error);
	}
};
module.exports.learnerAddedTagsCampaignStartRule = learnerAddedTagsCampaignStartRule;

//This function is called when any new tag added into any User
const systemActionBasedOnTagAdded = async function (tags, clientIds, userId, isChatBoat = false) {
	try {
		let err;

		// check FLow Type
		let flow_type = 'Campaign';

		if (isChatBoat) {
			flow_type = 'Conversational';
		}

		[err, campaigns] = await to(
			Campaign.findAll({
				where: {
					isDeleted: false,
					status: 'Running',
					ClientId: clientIds,
					flowType: flow_type,
					endDate: {
						[Op.gte]: new Date(),
					},
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							systemActionType: 'Based on tags added',
							[sequelize.Op.or]: {
								dripTriggerRule: 'Send based on system activity',
								actionTriggerRule: 'Take action based on system activity',
							},
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
			})
		);
		if (err) {
			console.log('--Error Get all Campaign List into Learner Assed Tags Campaign System Action ---', err);
		}

		if (campaigns && campaigns.length > 0) {
			for (let campaign of campaigns) {
				let campaignId = campaign.id;
				let clientId = campaign.ClientId;
				if (campaign && campaign.Drip_camps && campaign.Drip_camps.length > 0) {
					for (let drip_camp of campaign.Drip_camps) {
						let flag = false;
						let drip_camp_tags = drip_camp.tagsForSystemAction.split(',');
						if (drip_camp_tags && drip_camp_tags.length > 0) {
							for (let tag of drip_camp_tags) {
								if (tags.indexOf(tag) > -1) {
									flag = true;
								}
							}
						}

						if (flag) {
							if (drip_camp.dripFlowType == 'Send a Drip') {
								[err, campWhatsAppEmailDripData] = await to(
									CampWhatsAppEmailDrip.findOne({
										where: {
											CampaignId: campaignId,
											PostId: drip_camp.Post.id,
											DripCampIndex: drip_camp.index,
											UserId: userId,
										},
									})
								);
								if (campWhatsAppEmailDripData) {
									console.log('---------Find Based on tags added----');
									if (!campWhatsAppEmailDripData.publishOn) {
										let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
										if (
											['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(drip_camp.dripType)
										) {
											let date = await getNextFiftineMinSlot(isChatBoat);
											triggerDate = moment(date).add(drip_camp.sendAfter, 'days').format();
										}
										if (!drip_camp.actionType) {
											let expiredOn = null;
											if (triggerDate && drip_camp.unAssignDayCount && drip_camp.unAssignDayCount != null) {
												expiredOn = moment(new Date(triggerDate)).add(drip_camp.unAssignDayCount, 'days').format();
											}
											[err, updateTriggerDate] = await to(
												Assigned_post_to_user.update(
													{
														publishOn: triggerDate,
														isPublished: true,
														expiredOn: expiredOn,
													},
													{
														where: {
															CampaignId: campaignId,
															DripCampId: drip_camp.id,
															isPublished: false,
															UserId: userId,
														},
													}
												)
											);
											if (err) console.log('-Update Published Date Assigned in assignTakeActionToLearner', err);

											[err, campaigns] = await to(
												CampWhatsAppEmailDrip.update(
													{
														publishOn: triggerDate,
													},
													{
														where: {
															CampaignId: campaignId,
															DripCampId: drip_camp.id,
															UserId: userId,
														},
													}
												)
											);

											if (err) console.log('-Update Published Date Assigned in assignTakeActionToLearner', err);
										}
										await updateDripToLearner(userId, campaignId, drip_camp);
									}
								} else {
									console.log('---------NOT NOT Find Based on tags added----');

									let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
									await assignDripToLearner([userId], campaignId, triggerDate, drip_camp, clientId, isChatBoat);
									await updateDripToLearner(userId, campaignId, drip_camp);
								}
							} else if (drip_camp.dripFlowType == 'Take Action') {
								let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
								[err, campWhatsAppEmailDripData] = await to(
									CampTakeAction.findOne({
										where: {
											CampaignId: campaignId,
											DripCampIndex: drip_camp.index,
											UserId: userId,
										},
									})
								);
								if (campWhatsAppEmailDripData) {
									if (!campWhatsAppEmailDripData.publishOn) {
										[err, updateTriggerDate] = await to(
											CampTakeAction.update(
												{
													takeActionOn: triggerDate,
												},
												{
													where: {
														isTriggered: false,
														UserId: userId,
														CampaignId: campaignId,
														DripCampId: drip_camp.id,
													},
												}
											)
										);
										if (err) console.log('-Update takeActionOn Date in assignTakeActionToLearner table--', err);
										await updateDripToLearner(userId, campaignId, drip_camp);
									}
								} else {
									await assignTakeActionToLearner([userId], campaignId, triggerDate, drip_camp, clientId);
									await updateDripToLearner(userId, campaignId, drip_camp);
								}
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Error System Action based on tag added----', error);
	}
};
module.exports.systemActionBasedOnTagAdded = systemActionBasedOnTagAdded;

const baseOnpreviseAction = async function (flow_type) {
	try {
		let err;
		[err, campaigns] = await to(
			Campaign.findAll({
				where: {
					isDeleted: false,
					status: 'Running',
					flowType: flow_type,
					endDate: {
						[Op.gte]: new Date(),
					},
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							systemActionType: 'Based on previous action taken',
							[sequelize.Op.or]: {
								dripTriggerRule: 'Send based on system activity',
								actionTriggerRule: 'Take action based on system activity',
							},
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
			})
		);
		if (err) console.log('--Error Get all Campaign List into Learner Assed Tags Campaign System Action ---', err);

		if (campaigns && campaigns.length > 0) {
			for (let campaign of campaigns) {
				let campaignId = campaign.id;
				let userIds = [];
				if (campaign && campaign.Drip_camps && campaign.Drip_camps.length > 0) {
					for (let drip_camp of campaign.Drip_camps) {
						[err, getActionData] = await to(
							CampTakeAction.findAll({
								where: {
									isTriggered: true,
									CampaignId: campaignId,
									DripCampIndex: drip_camp.dependencyDripIndex,
								},
							})
						);
						userIds = [];
						for (let data of getActionData) {
							userIds.push(data.UserId);
						}

						if (userIds.length > 0) {
							let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
							if (['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(drip_camp.dripType)) {
								let date = await getNextFiftineMinSlot();
								triggerDate = moment(date).add(drip_camp.sendAfter, 'days').format();
							}
							let expiredOn = null;
							if (triggerDate && drip_camp.unAssignDayCount && drip_camp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(drip_camp.unAssignDayCount, 'days').format();
							}

							if (drip_camp.dripFlowType !== 'Take Action') {
								[err, updateTriggerDate] = await to(
									Assigned_post_to_user.update(
										{
											publishOn: triggerDate,
											isPublished: true,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaignId,
												PostId: drip_camp.Post.id,
												DripCampIndex: drip_camp.index,
												DripCampId: drip_camp.id,
												isPublished: false,
												UserId: userIds,
											},
										}
									)
								);

								[err, campWhatsAppEmailDripData] = await to(
									CampWhatsAppEmailDrip.update(
										{
											publishOn: triggerDate,
											expiredOn: expiredOn,
										},
										{
											where: {
												CampaignId: campaignId,
												PostId: drip_camp.Post.id,
												DripCampIndex: drip_camp.index,
												DripCampId: drip_camp.id,
												UserId: userIds,
												isTriggered: false,
											},
										}
									)
								);
							}

							if (drip_camp.dripFlowType == 'Take Action') {
								[err, updateTriggerDate] = await to(
									CampTakeAction.update(
										{
											takeActionOn: triggerDate,
										},
										{
											where: {
												CampaignId: campaignId,
												DripCampId: drip_camp.id,
												DripCampIndex: drip_camp.index,
												UserId: userIds,
												isTriggered: false,
											},
										}
									)
								);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Error baseOnpreviseAction----', error);
	}
};
module.exports.baseOnpreviseAction = baseOnpreviseAction;

const baseOnDripSend = async function (userId, campaignId, index) {
	try {
		let err;
		[err, campaign] = await to(
			Campaign.findOne({
				where: {
					isDeleted: false,
					status: 'Running',
					endDate: {
						[Op.gte]: new Date(),
					},
					id: campaignId,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							systemActionType: 'Based on drip sent',
							[sequelize.Op.or]: {
								dripTriggerRule: 'Send based on system activity',
								actionTriggerRule: 'Take action based on system activity',
							},
							dependencyDripIndex: index,
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
			})
		);
		if (err) console.log('--Error Get all Campaign List into Learner Assed Tags Campaign System Action ---', err);

		if (campaign) {
			let userIds = [];
			let getActionData;
			if (campaign && campaign.Drip_camps && campaign.Drip_camps.length > 0) {
				for (let drip_camp of campaign.Drip_camps) {
					[err, getActionData] = await to(
						CampWhatsAppEmailDrip.findAll({
							where: {
								publishOn: {
									[Op.ne]: null,
								},
								UserId: userId,
								CampaignId: campaignId,
								DripCampIndex: drip_camp.dependencyDripIndex,
							},
						})
					);

					for (let data of getActionData) {
						userIds.push(data.UserId);
					}

					if (userIds.length > 0) {
						let triggerDate = moment(new Date()).add(drip_camp.sendAfter, 'days').format();
						if (['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(drip_camp.dripType)) {
							let date = await getNextFiftineMinSlot();
							triggerDate = moment(date).add(drip_camp.sendAfter, 'days').format();
						}
						let expiredOn = null;
						if (triggerDate && drip_camp.unAssignDayCount && drip_camp.unAssignDayCount != null) {
							expiredOn = moment(new Date(triggerDate)).add(drip_camp.unAssignDayCount, 'days').format();
						}

						if (drip_camp.dripFlowType !== 'Take Action') {
							[err, updateTriggerDate] = await to(
								Assigned_post_to_user.update(
									{
										publishOn: triggerDate,
										isPublished: true,
										expiredOn: expiredOn,
									},
									{
										where: {
											CampaignId: campaignId,
											PostId: drip_camp.Post.id,
											DripCampIndex: drip_camp.index,
											DripCampId: drip_camp.id,
											isPublished: false,
											UserId: userIds,
										},
									}
								)
							);

							[err, campWhatsAppEmailDripData] = await to(
								CampWhatsAppEmailDrip.update(
									{
										publishOn: triggerDate,
										expiredOn: expiredOn,
									},
									{
										where: {
											CampaignId: campaignId,
											PostId: drip_camp.Post.id,
											DripCampIndex: drip_camp.index,
											DripCampId: drip_camp.id,
											UserId: userIds,
										},
									}
								)
							);
						}

						if (drip_camp.dripFlowType == 'Take Action') {
							let date = await getNextFiftineMinSlot();
							triggerDate = moment(date).add(drip_camp.sendAfter, 'days').format();
							[err, updateTriggerDate] = await to(
								CampTakeAction.update(
									{
										takeActionOn: triggerDate,
									},
									{
										where: {
											CampaignId: campaignId,
											DripCampId: drip_camp.id,
											DripCampIndex: drip_camp.index,
											UserId: userIds,
											isTriggered: false,
										},
									}
								)
							);
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Error baseOnDripSend----', error);
	}
};
module.exports.baseOnDripSend = baseOnDripSend;

const updateDripToLearner = async function (userId, campaignId, drip_camp) {
	try {
		[err, campaignDetail] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					isDeleted: false,
					status: 'Running',
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							status: ['Scheduled', 'Delivering', 'Performing'],
							systemActionType: 'Based on drip sent',
						},
						include: [
							{
								model: Post,
								where: {
									drip_status: 'Published',
								},
								required: false,
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		let index = drip_camp.index;
		let index_ = index;
		let temp_Drip_camp;

		let flag = true;
		if (campaignDetail) {
			let count = 0;
			while (flag) {
				for (let temp of campaignDetail.Drip_camps) {
					if (temp.dependencyDripIndex == index_) {
						temp_Drip_camp = temp;
						if (
							temp_Drip_camp.dripFlowType == 'Send a Drip' &&
							((temp_Drip_camp.dripTriggerRule == 'Send based on user activity' && index == index_) ||
								temp_Drip_camp.dripTriggerRule == 'Send based on system activity')
						) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							if (
								['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(temp_Drip_camp.dripType)
							) {
								let date = await getNextFiftineMinSlot();
								triggerDate = moment(date).add(temp_Drip_camp.sendAfter, 'days').format();
							}
							let expiredOn = null;
							if (triggerDate && triggerDate != null && temp.unAssignDayCount && temp.unAssignDayCount != null) {
								expiredOn = moment(new Date(triggerDate)).add(temp.unAssignDayCount, 'days').format();
							}
							console.log('------1------');
							console.log('---campaignId---', campaignId);
							console.log('---temp_Drip_camp.index---', temp_Drip_camp.index);
							console.log('---temp_Drip_camp.Post.id---', temp_Drip_camp.Post.id);
							[err, updateTriggerDate] = await to(
								Assigned_post_to_user.update(
									{
										publishOn: triggerDate,
										isPublished: true,
										expiredOn: expiredOn,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
											isPublished: false,
										},
									}
								)
							);
							if (err) {
								console.log('-Update Published Date Assigned Drip--', err);
							}
							console.log('------2------');
							console.log('---campaignId---', campaignId);
							console.log('---temp_Drip_camp.index---', temp_Drip_camp.index);
							console.log('---temp_Drip_camp.Post.id---', temp_Drip_camp.Post.id);
							[err, updateTriggerDate] = await to(
								CampWhatsAppEmailDrip.update(
									{
										publishOn: triggerDate,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											PostId: temp_Drip_camp.Post.id,
										},
									}
								)
							);
							if (err) {
								console.log('-Update Published Date Assigned Drip 02--', err);
							}
						} else if (
							temp_Drip_camp.dripFlowType == 'Take Action' &&
							((temp_Drip_camp.actionTriggerRule == 'Take action based on user activity' && index == index_) ||
								temp_Drip_camp.actionTriggerRule == 'Take action based on system activity')
						) {
							let triggerDate = moment(new Date()).add(temp_Drip_camp.sendAfter, 'days').format();
							index_ = temp_Drip_camp.index;
							[err, updateTriggerDate] = await to(
								CampTakeAction.update(
									{
										takeActionOn: triggerDate,
									},
									{
										where: {
											UserId: parseInt(userId),
											CampaignId: campaignId,
											DripCampIndex: temp_Drip_camp.index,
											isTriggered: false,
										},
									}
								)
							);
							if (err) {
								console.log('-Update Trigger Date OF Take Action--', err);
							}
						} else {
							flag = false;
						}
					}
				}
				if (count >= campaignDetail.Drip_camps.length) {
					flag = false;
				}
				count++;
			}
		}
		if (err) console.log('-----Error Get Campaign Details at Check Read Action By Learner---', err);
	} catch (error) {
		console.log('---Error updateDripToLearner----', error);
	}
};
module.exports.updateDripToLearner = updateDripToLearner;

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
						attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId', 'OnlyEmailTemplateId'],
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
								attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId', 'OnlyEmailTemplateId'],
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

const checkCampaignStatus = async function (campaignId) {
	try {
		[err, campaignData] = await to(
			Campaign.findAll({
				where: {
					id: campaignId,
					status: ['Running', 'Scheduled'],
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						attributes: ['id', 'status'],
					},
				],
				attributes: ['id', 'startDate', 'endDate', 'status'],
			})
		);
		if (err) {
			console.log('--Update Campaign status--', err);
		}
		for (let camp of campaignData) {
			let status;
			if (moment().isAfter(camp.startDate) && moment().isBefore(camp.endDate)) {
				status = 'Running';
			} else if (moment().isAfter(camp.endDate)) {
				let flag = true;
				for (let dripCamp of camp.Drip_camps) {
					if (dripCamp.status == 'Scheduled' || dripCamp.status == 'PFA') {
						flag = false;
					}
				}
				if (flag) {
					status = 'Finished';
				} else {
					status = 'Expired';
				}
			} else if (moment().isBefore(camp.startDate)) {
				status = 'Scheduled';
			}
			if (status !== camp.status) {
				[err, updateStatus] = await to(
					Campaign.update(
						{
							status: status,
						},
						{
							where: {
								id: camp.id,
							},
						}
					)
				);
			}
		}
		return;
	} catch (error) {
		console.log('--checkCampaignStatus-', error);
		return;
	}
};
module.exports.checkCampaignStatus = checkCampaignStatus;

const checkRunningCampaignStatus = async function () {
	try {
		const today = moment().format();
		let campIds = [];
		let campaignData;

		[err, campaignData] = await to(
			Campaign.findAll({
				where: {
					status: 'Running',
					endDate: {
						[Op.lte]: today,
					},
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						required: true,
						where: {
							status: ['Scheduled', 'PFA'],
						},
						attributes: ['id', 'status'],
					},
				],
				attributes: ['id', 'startDate', 'endDate'],
			})
		);
		if (err) console.log('--get Campaign data--', err);

		for (let camp of campaignData) {
			let status;
			if (moment().isAfter(camp.startDate) && moment().isBefore(camp.endDate)) {
				status = 'Running';
			} else if (moment().isAfter(camp.endDate)) {
				let flag = true;
				for (let dripCamp of camp.Drip_camps) {
					if (dripCamp.status == 'Scheduled' || dripCamp.status == 'PFA') {
						flag = false;
					}
				}
				if (flag) {
					status = 'Finished';
				} else {
					status = 'Expired';
				}
			} else if (moment().isBefore(camp.startDate)) {
				status = 'Scheduled';
			}
			if (status === 'Expired') {
				campIds.push(camp.id);
			}
		}

		if (campIds.length > 0) {
			[err, campaignData] = await to(
				Campaign.update(
					{
						status: 'Expired',
					},
					{
						where: {
							status: 'Running',
							id: campIds,
						},
					}
				)
			);
			if (err) console.log('--Update Campaign status--', err);
		}

		[err, campaignData] = await to(
			Campaign.update(
				{
					status: 'Finished',
				},
				{
					where: {
						status: 'Running',
						endDate: {
							[Op.lte]: today,
						},
					},
				}
			)
		);
		if (err) console.log('--Update Campaign status--', err);
		return;
	} catch (error) {
		console.log('--checkRunningCampaignStatus-', error);
		return;
	}
};
module.exports.checkRunningCampaignStatus = checkRunningCampaignStatus;

const checkScheduledCampaignStatus = async function () {
	try {
		const startDate = moment().subtract(1, 'day').format();
		const endDate = moment().format();

		[err, campaignData] = await to(
			Campaign.update(
				{
					status: 'Running',
				},
				{
					where: {
						status: 'Scheduled',
						startDate: {
							[Op.between]: [startDate, endDate],
						},
					},
				}
			)
		);
		if (err) console.log('--Update Campaign status--', err);
		return;
	} catch (error) {
		console.log('--checkScheduledCampaignStatus-', error);
		return;
	}
};
module.exports.checkScheduledCampaignStatus = checkScheduledCampaignStatus;

const assignDripToLearnerOnCreateCampaign = async function (learnerIds, campaignId, date, drip_camp, clientId) {
	try {
		let publishOn = date;
		let isContactMilestone = false;
		let isZoomMeeting = false;
		let carousleMaxCount;
		// if (
		// 	publishOn &&
		// 	['DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'].includes(drip_camp.dripType)
		// ) {
		// 	publishOn = await getNextFiftineMinSlot();
		// }
		if (publishOn !== null && drip_camp.within && drip_camp.dripActionEndDate === null) {
			[err, dripCamp] = await to(
				Drip_camp.update(
					{
						dripActionEndDate: moment(publishOn).add(drip_camp.within, 'hours').format(),
					},
					{
						where: {
							id: drip_camp.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let isMeta = false;
		let whatsAppNative = null;
		let whatsAppNonNative = null;

		if (drip_camp.dripType === 'Only WhatsApp') {
			[err, whatsAppNative] = await to(
				Drip_whatsapp_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_native data---', err);
			}
		} else if (drip_camp.dripType === 'DripApp with sharing on WhatsApp') {
			[err, whatsAppNonNative] = await to(
				Drip_whatsapp_non_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_non_native data---', err);
			}
		}

		if (whatsAppNative?.WhatsAppSetup?.isMeta == true || whatsAppNonNative?.WhatsAppSetup?.isMeta == true) {
			isMeta = true;
		}

		//For Contact Milestone
		if (learnerIds && learnerIds.length > 0) {
			let campWhatsAppEmailDrips = [];
			let assignDripToLearner;
			let isValidLicence;
			isValidLicence = await getValidationForSendDripWithCount(clientId, drip_camp.dripType);
			let count = isValidLicence.count;
			let licenceCount = 0;
			let allQuestion = [];
			let addOptionList = [];
			let assignPostToUserList = [];
			let quationTypeOfPost = false;
			if (
				drip_camp &&
				drip_camp.dripType != 'Only WhatsApp' &&
				drip_camp.dripType != 'Only Teams' &&
				drip_camp.Post &&
				(drip_camp.Post.tempType === 'Poll' ||
					drip_camp.Post.tempType === 'Quiz' ||
					drip_camp.Post.tempType === 'Quiz (Randomised)' ||
					drip_camp.Post.tempType === 'Spin The Wheel' ||
					drip_camp.Post.tempType === 'Offline Task' ||
					drip_camp.Post.tempType == 'Survey')
			) {
				quationTypeOfPost = true;
				if (drip_camp.Post.tempType === 'Quiz (Randomised)') {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: {
								model: DripOption,
							},
							order: [sequelize.random(), ['id', 'ASC']],
							limit: drip_camp.Post.quizRandCount ? drip_camp.Post.quizRandCount : 20,
						})
					);
					if (allQuestionList && allQuestionList.length > 0) {
						for (let question of allQuestionList) {
							let payload = question.convertToJSON();
							let options = question.DripOptions.sort((a, b) => {
								if (a.id < b.id) {
									return -1;
								}
							});
							payload.DripOptions = [];
							payload.DripOptions = options;
							allQuestion.push(payload);
						}
					}
				} else if (drip_camp.Post.tempType === 'Spin The Wheel') {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: [
								{
									model: DripOption,
								},
								{
									model: DripSpinWheelCat,
								},
							],
							order: [
								['id', 'ASC'],
								[{ model: DripOption }, 'id', 'ASC'],
							],
						})
					);
					allQuestion = allQuestionList;
				} else {
					[err, allQuestionList] = await to(
						DripQuestion.findAll({
							where: {
								PostId: drip_camp.Post.id,
							},
							include: {
								model: DripOption,
							},
							order: [
								['id', 'ASC'],
								[{ model: DripOption }, 'id', 'ASC'],
							],
						})
					);
					allQuestion = allQuestionList;
				}
			}
			if (err) console.log('--Error--Getting Question', err);

			if (drip_camp?.dripTriggerRule === 'Send based on contact milestone') {
				// Find Learner Custom Fields
				isContactMilestone = true;
				learnerIds = await getLearnerMilestone(learnerIds, drip_camp, campaignId);
				console.log('assignDripToLearnerOnCreateCampaign--  learnerIds', learnerIds);
			}

			for (let learnerId of learnerIds) {
				let contanctId = learnerId;
				let triggerError = null;
				if (isContactMilestone) {
					contanctId = learnerId.UserId;
					publishOn = learnerId[drip_camp.milestoneField];
					if (publishOn == null) {
						triggerError = 'Milestone Field is not found.';
					}
				}
				let isPublished = true;
				if (publishOn == null) {
					isPublished = false;
				}
				let postId = drip_camp.PostId;
				let noOfTimeSpinWheel = 0;

				if (drip_camp.Post && drip_camp.Post?.isZoomMeeting) {
					isZoomMeeting = true;
				}

				if (
					drip_camp.Post &&
					drip_camp.Post.Drip_whatsapp_non_natives &&
					drip_camp.Post.Drip_whatsapp_non_natives.length > 0
				) {
					if (drip_camp.Post.Drip_whatsapp_non_natives[0].existingDripId) {
						postId = drip_camp.Post.Drip_whatsapp_non_natives[0].existingDripId;
					}
					if (drip_camp.Post.Drip_whatsapp_non_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_whatsapp_non_natives[0].noOfTimeSpin;
					}
				} else if (
					drip_camp.Post &&
					drip_camp.Post.Drip_email_non_natives &&
					drip_camp.Post.Drip_email_non_natives.length > 0
				) {
					if (drip_camp.Post.Drip_email_non_natives[0].existingDripId) {
						postId = drip_camp.Post.Drip_email_non_natives[0].existingDripId;
					}
					if (drip_camp.Post.Drip_email_non_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_email_non_natives[0].noOfTimeSpin;
					}
				} else if (drip_camp.Post && drip_camp.Post.Drip_natives && drip_camp.Post.Drip_natives.length > 0) {
					if (drip_camp.Post.Drip_natives[0].noOfTimeSpin) {
						noOfTimeSpinWheel = drip_camp.Post.Drip_natives[0].noOfTimeSpin;
					}
				}

				if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Carousel') {
					[err, carousleMaxCount] = await to(
						Post_asset_mapping.count({
							where: {
								PostId: postId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				let externalLink = {
					externalLinkClick1: false,
					externalLinkClick2: false,
					externalLinkClick3: false,
					externalLinkClick4: false,
					externalLinkClick5: false,
					externalLinkClick6: false,
					externalLinkClick7: false,
					externalLinkClick8: false,
					externalLinkClick9: false,
					externalLinkClick10: false,
				};

				let custTempPageViewed = {};

				if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.customTemplate &&
					drip_camp.Post.tempType == 'Custom Template'
				) {
					const dom = new JSDOM(drip_camp.Post.customTemplate);
					const doc = dom.window.document;

					let pageElements = doc.querySelectorAll('div[id^="page"]');

					pageElements.forEach((pageElement, index) => {
						let pageNumber = index + 1; // Pages are named page1, page2, etc.
						custTempPageViewed[`page${pageNumber}_viewed`] = 'NO';
					});
				}

				let payload_1 = {
					UserId: parseInt(contanctId),
					PostId: postId,
					DripCampId: drip_camp.id,
					CampaignId: campaignId,
					is_deleted: false,
					isLiked: false,
					isBookmarked: false,
					submit: false,
					score: 0,
					DripCampIndex: drip_camp.index,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					publishOn: publishOn,
					isPublished: isPublished,
					code: Math.random().toString(36).slice(2),
					actionStatus: 'NA',
					actionIntent: 'NA',
					isZoomMeeting: isZoomMeeting,
					externalLink: externalLink,
					max: carousleMaxCount ? carousleMaxCount : null,
					noOfTimeSpin: noOfTimeSpinWheel,
					custTempPageViewed: [custTempPageViewed],
				};

				if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Single Image') {
					payload_1.actionStatus = 'NA';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					!drip_camp.Post.externalLink1 &&
					!drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Carousel'
				) {
					payload_1.actionStatus = 'NA';
					payload_1.actionIntent = 'Not Swiped';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.externalLink1 &&
					drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Carousel'
				) {
					payload_1.actionStatus = 'Button Not Clicked';
					payload_1.actionIntent = 'Not Swiped';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.externalLink1 &&
					drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Video'
				) {
					payload_1.actionStatus = 'NA';
					payload_1.actionIntent = 'Not Watched';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					drip_camp.Post.externalLink1 &&
					drip_camp.Post.externalLinkLabel1 &&
					drip_camp.Post.tempType == 'Video'
				) {
					payload_1.actionStatus = 'Button Not Clicked';
					payload_1.actionIntent = 'Not Watched';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Poll') {
					payload_1.actionStatus = 'Not Submitted';
				} else if (
					drip_camp &&
					drip_camp.Post &&
					(drip_camp.Post.tempType == 'Quiz' || drip_camp.Post.tempType == 'Quiz (Randomised)')
				) {
					payload_1.actionStatus = 'Not Submitted';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Offline Task') {
					payload_1.actionStatus = 'Not Submitted';
				} else if (drip_camp && drip_camp.Post && drip_camp.Post.tempType == 'Survey') {
					payload_1.actionStatus = 'Not Submitted';
				}
				if (['Only WhatsApp', 'Only Teams', 'Only Email'].indexOf(drip_camp.dripType) == -1) {
					if (
						payload_1.publishOn &&
						payload_1.publishOn != null &&
						drip_camp.unAssignDayCount &&
						drip_camp.unAssignDayCount != null
					) {
						payload_1.expiredOn = moment(new Date(payload_1.publishOn))
							.add(drip_camp.unAssignDayCount, 'days')
							.format();
					}
					if (isValidLicence.unlimited || count > 0) {
						//if (quationTypeOfPost) {

						[err, assignDripToLearner] = await to(Assigned_post_to_user.create(payload_1));
						if (err) console.log('-----Error Assign Drip To Learner---', err);

						licenceCount++;

						if (quationTypeOfPost) {
							for (let question of allQuestion) {
								let questionPayload = {
									question: question.question,
									questionType: question.questionType,
									answerCount: question.answerCount,
									PostId: question.PostId,
									AssignedPostToUserId: assignDripToLearner.id,
									AssetId: question.AssetId,
									allowFileTypes: question.allowFileTypes,
									fileSize: question.fileSize,
									numberOfFiles: question.numberOfFiles,
									isTextResponse: question.isTextResponse,
									isFileSubmission: question.isFileSubmission,
									surveyCharLimit: question.surveyCharLimit,
									multipleOption: question.multipleOption,
									DripQuestionId: question.id,
									isQuesRequired: question.isQuesRequired,
									zoomLinkTo: question.zoomLinkTo,
									UploadOnVimeo: question.UploadOnVimeo,
									showTranscript: question.showTranscript,
									aiReview: question.aiReview,
									spinCatIndex:
										question && question.DripSpinWheelCat && question.DripSpinWheelCat.category_index
											? question.DripSpinWheelCat.category_index
											: null,
									spinCatName:
										question && question.DripSpinWheelCat && question.DripSpinWheelCat.category_name
											? question.DripSpinWheelCat.category_name
											: null,
									spinQueScore: question.spinQueScore ? question.spinQueScore : null,
									ratingType: question.ratingType,
									ratingMinLabel: question.ratingMinLabel,
									ratingMaxLabel: question.ratingMaxLabel,
									ratingScaleMinCount: question.ratingScaleMinCount,
									ratingScaleMaxCount: question.ratingScaleMaxCount,
								};
								let addQuestion;
								[err, addQuestion] = await to(DripUserQuestion.create(questionPayload));
								if (err) console.log('--Error---Drip Native---assigned Question to User', err);

								let questionId = addQuestion.id;
								for (let option of question.DripOptions) {
									let optionPayload = {
										text: option.text,
										correctAns: option.isCorrectAnswer,
										userAnswer: null,
										selectedAns: false,
										sr_no: option.sr_no,
										userSeq: 0,
										AssetId: option.AssetId,
										DripUserQuestionId: questionId,
										AssignedPostToUserId: assignDripToLearner.id,
										DripOptionId: option.id,
										skipQueType: option.skipQueType,
									};
									addOptionList.push(optionPayload);
								}
								if (addOptionList.length === 500) {
									[err, addOption] = await to(DripUserOption.bulkCreate(addOptionList));
									if (err) console.log('--Error---Drip Native---Add Option', err);
									addOptionList = [];
								}
							}
						}
						// } else {
						// 	assignPostToUserList.push(payload_1);
						// 	licenceCount++;
						// 	if (assignPostToUserList.length === 500) {
						// 		[err, assignDripToLearner] = await to(Assigned_post_to_user.bulkCreate(assignPostToUserList));
						// 		if (err) console.log('-----Error Assign Drip To Learner---', err);
						// 		assignPostToUserList = [];
						// 	}
						// }
					} else {
						console.log('----Not Valid Licence----');
					}
				} else {
					assignDripToLearner = null;
				}

				let payload_2 = {
					dripType: drip_camp.dripType,
					CampaignId: campaignId,
					DripCampId: drip_camp.id,
					PostId: drip_camp.PostId,
					DripCampIndex: drip_camp.index,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					publishOn: publishOn,
					UserId: parseInt(contanctId),
					isTriggered: false,
					errorMessage: triggerError,
					AssignedPostToUserId: assignDripToLearner && assignDripToLearner.id ? assignDripToLearner.id : null,
					code:
						assignDripToLearner && assignDripToLearner.code
							? assignDripToLearner.code
							: Math.random().toString(36).slice(2),
					isMeta: isMeta,
				};

				if (isValidLicence.unlimited || count > 0) {
					campWhatsAppEmailDrips.push(payload_2);
					if (campWhatsAppEmailDrips.length === 500) {
						[err, camp_whatsApp_email_drip_] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
						if (err) console.log('-----Error Campaign WhatsApp Email Drip ---', err);
						campWhatsAppEmailDrips = [];
					}
					//add incremental Count of Drip
					if (drip_camp.dripType == 'Only WhatsApp' || drip_camp.dripType == 'Only Teams') {
						licenceCount++;
					}
				} else {
					console.log('-----Not Valid License is avalible---');
				}
				count--;
			}
			if (campWhatsAppEmailDrips && campWhatsAppEmailDrips.length > 0) {
				[err, camp_whatsApp_email_drip_] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
				if (err) console.log('-----Error Campaign WhatsApp Email Drip ---', err);
				campWhatsAppEmailDrips = [];
			}
			// if (assignPostToUserList.length > 0) {
			// 	[err, assignDripToLearner] = await to(Assigned_post_to_user.bulkCreate(assignPostToUserList));
			// 	if (err) console.log('-----Error Assign Drip To Learner---', err);
			// 	assignPostToUserList = [];
			// }
			if (addOptionList.length > 0) {
				[err, addOption] = await to(DripUserOption.bulkCreate(addOptionList));
				if (err) console.log('--Error---Drip Native---Add Option', err);
				addOptionList = [];
			}
			if (licenceCount > 0) await updateDripMultipleCountInLicense(clientId, drip_camp.dripType, licenceCount);
		}
		return;
	} catch (error) {
		console.log('----Error into assign drip to learner----', error);
		return;
	}
};
module.exports.assignDripToLearnerOnCreateCampaign = assignDripToLearnerOnCreateCampaign;

const assignDripToChannelOnCreateCampaign = async function (ChannelDetails, campaignId, date, drip_camp, clientId) {
	try {
		// Initialize publish date
		let publishOn = date;

		// Update drip campaign end date if conditions are met
		if (publishOn !== null && drip_camp.within && drip_camp.dripActionEndDate === null) {
			[err, dripCamp] = await to(
				Drip_camp.update(
					{ dripActionEndDate: moment(publishOn).add(drip_camp.within, 'hours').format() },
					{ where: { id: drip_camp.id } }
				)
			);
			if (err) return ResponseError(res, err, 500, true); // Handle error
		}

		let isMeta = false;
		let whatsAppNative = null;
		let whatsAppNonNative = null;

		if (drip_camp.dripType === 'Only WhatsApp') {
			[err, whatsAppNative] = await to(
				Drip_whatsapp_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_native data---', err);
			}
		} else if (drip_camp.dripType === 'DripApp with sharing on WhatsApp') {
			[err, whatsAppNonNative] = await to(
				Drip_whatsapp_non_native.findOne({
					where: { PostId: drip_camp.Post.id },
					include: [
						{
							model: WhatsAppSetup,
							where: { status: 'Active' },
							attributes: ['id', 'isMeta'],
						},
					],
				})
			);
			if (err) {
				console.log('---Error getting Drip_whatsapp_non_native data---', err);
			}
		}

		if (whatsAppNative?.WhatsAppSetup?.isMeta == true || whatsAppNonNative?.WhatsAppSetup?.isMeta == true) {
			isMeta = true;
		}

		// Process channel details if available
		if (ChannelDetails && ChannelDetails.length > 0) {
			let campWhatsAppEmailDrips = [];
			let isValidLicence = await getValidationForSendDripWithCount(clientId, drip_camp.dripType);
			let count = isValidLicence.count;
			let licenceCount = 0;

			// Iterate through each channel to prepare drip payloads
			for (let channel of ChannelDetails) {
				const payload = {
					dripType: drip_camp.dripType,
					CampaignId: campaignId,
					DripCampId: drip_camp.id,
					PostId: drip_camp.PostId,
					DripCampIndex: drip_camp.index,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					publishOn: publishOn,
					isTriggered: false,
					code: Math.random().toString(36).slice(2),
					isChannelMsg: true,
					TeamChannelId: channel.TeamChannelId,
					isMeta: isMeta,
				};

				// Check license validity and count before pushing to drips array
				if (isValidLicence.unlimited || count > 0) {
					campWhatsAppEmailDrips.push(payload);
					// Bulk create when array reaches a size of 500
					if (campWhatsAppEmailDrips.length === 500) {
						[err, createData] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
						if (err) console.log('-----Error Campaign WhatsApp Email Drip 2---', err);
						campWhatsAppEmailDrips = []; // Reset array after bulk creation
					}
					licenceCount++; // Increment license count
				} else {
					console.log('-----Not Valid License is available---');
				}
				count--; // Decrement count
			}

			// Final bulk create for remaining drips not yet processed
			if (campWhatsAppEmailDrips.length > 0) {
				[err, createData] = await to(CampWhatsAppEmailDrip.bulkCreate(campWhatsAppEmailDrips));
				if (err) console.log('-----Error Campaign WhatsApp Email Drip ---', err);
			}

			// Update license count if applicable
			if (licenceCount > 0) await updateDripMultipleCountInLicense(clientId, drip_camp.dripType, licenceCount);
		}
	} catch (error) {
		console.log('----Error in assign drip to learner----', error);
	}
};
module.exports.assignDripToChannelOnCreateCampaign = assignDripToChannelOnCreateCampaign;

const getLearnerMilestone = async function (learnerIds, drip_camp, campaignId) {
	try {
		let fieldName = drip_camp.milestoneField;
		let targetTime = drip_camp.dripTriggerDate;

		//Get Campaign data
		let campaignData;
		[err, campaignData] = await to(
			Campaign.findOne({ where: { id: campaignId }, attributes: ['id', 'endDate', 'startDate', 'createdAt'] })
		);
		if (err) {
			console.log('---error--Geting Campaign Deails', err);
		}
		let startDate;
		let endDate;
		let startOnlyDate;
		let endOnlyDate;
		if (campaignData?.startDate) {
			startDate = moment(campaignData.startDate);
			startOnlyDate = moment(campaignData.startDate).format('YYYY-MM-DD');
		} else {
			startDate = moment(campaignData.createdAt);
			startOnlyDate = moment(campaignData.createdAt).format('YYYY-MM-DD');
		}

		endDate = moment(campaignData.endDate);
		endOnlyDate = moment(campaignData.endDate).format('YYYY-MM-DD');
		// Create 500 User Chunks for getting only 500 user data from Database
		let chunks = [];

		while (learnerIds.length) {
			chunks.push(learnerIds.splice(0, 500));
		}

		let finalOutput = [];
		for (let chunk of chunks) {
			[err, learnerData] = await to(
				User.findAll({
					where: {
						id: chunk,
					},
					attributes: ['id', 'customFields', 'createdAt'],
				})
			);
			if (err) {
				console.log('---error--Geting Users Deails', err);
			}

			if (learnerData.length == 0) {
				continue;
			}
			for (let data of learnerData) {
				if (
					data?.customFields &&
					data.customFields?.[fieldName] != null &&
					data.customFields[fieldName] != undefined &&
					data.customFields[fieldName] != '' &&
					moment(data.customFields[fieldName], moment.ISO_8601, true).isValid()
				) {
					let date = moment(targetTime);
					let customfieldDate = moment(data.customFields[fieldName]);

					//For Not Recurring
					if (drip_camp && !drip_camp.recurAnnually) {
						let payload = {
							UserId: data.id,
						};
						if (
							customfieldDate.isValid() &&
							date.isValid() &&
							customfieldDate.isSameOrBefore(endOnlyDate) &&
							customfieldDate.isSameOrAfter(startOnlyDate)
						) {
							date.set({ year: customfieldDate.year(), month: customfieldDate.month(), date: customfieldDate.date() });
							if (drip_camp.sendAfter != null) {
								date.add(drip_camp.sendAfter, 'days').format();
							} else {
								date.format();
							}
							if (date.isValid() && date.isSameOrBefore(endDate) && date.isSameOrAfter(startDate)) {
								payload[fieldName] = date;
							} else {
								payload[fieldName] = null;
							}
						} else {
							payload[fieldName] = null;
						}
						finalOutput.push(payload);
					} else {
						//For Recurring
						let endDate = moment(campaignData.endDate);
						let date = moment(targetTime);

						date.set({
							year: customfieldDate.year(),
							month: customfieldDate.month(),
							date: customfieldDate.date(),
						});

						if (drip_camp.sendAfter != null) {
							date.add(drip_camp.sendAfter, 'days').format();
						} else {
							date.format();
						}

						if (endDate.isValid() && customfieldDate.isValid() && date.isValid()) {
							let count = 0; // For Safety Purpose Only
							while (date.isSameOrBefore(endDate) && count < 25) {
								count++;
								let payload = {
									UserId: data.id,
								};
								if (date.isValid() && date.isSameOrBefore(endDate) && date.isSameOrAfter(startDate)) {
									payload[fieldName] = moment(new Date(date)).format();
								} else {
									payload[fieldName] = null;
								}
								finalOutput.push(payload);
								//Adding One Year
								date.add(1, 'year');
							}
						}
					}
				} else {
					let payload = {
						UserId: data.id,
					};
					payload[fieldName] = null;
					finalOutput.push(payload);
				}
			}
		}
		return finalOutput;
	} catch (error) {
		console.log('---error-in getLearnerMilestone-', error);
	}
};
module.exports.getLearnerMilestone = getLearnerMilestone;

const assignTakeActionToLearnerOnCreateCampaign = async function (
	learnerIds,
	campaignId,
	triggerOn,
	drip_camp,
	clientId
) {
	try {
		if (triggerOn !== null && drip_camp.within && drip_camp.dripActionEndDate === null) {
			[err, dripCamp] = await to(
				Drip_camp.update(
					{
						dripActionEndDate: moment(publishOn).add(drip_camp.within, 'hours').format(),
					},
					{
						where: {
							id: drip_camp.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
		let assignTakeActionToLearners = [];
		if (learnerIds && learnerIds.length > 0) {
			for (let learnerId of learnerIds) {
				let payload = {
					actionType: drip_camp.actionType,
					tagsForAction: drip_camp.tagsForAction,
					dependencyDripIndex: drip_camp.dependencyDripIndex,
					UserId: learnerId,
					DripCampIndex: drip_camp.index,
					DripCampId: drip_camp.id,
					CampaignId: campaignId,
					isTriggered: false,
					takeActionOn: triggerOn,
					ClientId: clientId,
				};
				assignTakeActionToLearners.push(payload);
				if (assignTakeActionToLearners.length === 500) {
					[err, addTakeAction] = await to(CampTakeAction.bulkCreate(assignTakeActionToLearners));
					if (err) console.log('-----Error Assign Take Action To Learner---', err);
					assignTakeActionToLearners = [];
				}
			}
			if (assignTakeActionToLearners.length > 0) {
				[err, addTakeAction] = await to(CampTakeAction.bulkCreate(assignTakeActionToLearners));
				if (err) console.log('-----Error Assign Take Action To Learner---', err);
				assignTakeActionToLearners = [];
			}
		}
		return;
	} catch (error) {
		console.log('----Error into assign take action to learner----', error);
		return;
	}
};
module.exports.assignTakeActionToLearnerOnCreateCampaign = assignTakeActionToLearnerOnCreateCampaign;

const checkReserveFlowTags = async function (clientId, tags, notCampaignId = null) {
	try {
		//First Find Client Account
		let allClientId = [];
		let flag_1 = true;
		let count = 0;
		let maxCount = 0;
		[err, maxCount] = await to(Client.count());
		while (flag_1) {
			count++;

			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					attributes: ['id', 'category', 'Associate_client_id'],
				})
			);
			if (err) {
				console.log('----------Error--1', err);
				return false;
			}

			if (clientDetails && clientDetails.category == 'Branch Account') {
				clientId = clientDetails.Associate_client_id;
			} else if (clientDetails && clientDetails.category == 'Client Account') {
				clientId = clientDetails.id;
				flag_1 = false;
			} else {
				flag_1 = false;
			}

			if (count > maxCount) {
				flag_1 = false;
			}
		}

		//Then Find All Under Branch Accounts
		allClientId = await getAllSubClientAndBranchAccountLists(clientId, false);
		let wherCondition = {
			ClientId: allClientId,
			isDeleted: false,
			flowType: 'Conversational',
			status: ['Running', 'Scheduled', 'Draft', 'Paused'],
		};

		if (notCampaignId) {
			wherCondition.id = {
				[Op.ne]: notCampaignId,
			};
		}

		//Then Check Tag is Used or not in Conversational Flow
		[err, checkTags] = await to(
			Campaign.findAll({
				where: wherCondition,
				attributes: ['id'],
				include: [{ model: CampaignTagMapping, where: { tag: tags }, attributes: ['id', 'CampaignId', 'tag'] }],
			})
		);
		if (err) {
			console.log('----------Error--2', err);
			return false;
		}

		if (checkTags && checkTags.length > 0) {
			let usedTags = [];
			for (let tags of checkTags) {
				for (let tag of tags.CampaignTagMappings) {
					usedTags.push(tag.tag);
				}
			}
			let notUseTags = [];
			for (let tag of tags) {
				if (!usedTags.includes(tag)) {
					notUseTags.push(tag);
				}
			}
			return {
				message: MESSAGE.TAG_USED_IN_CONVERSATIONAL_FLOW,
				canUse: false,
				usedTags: usedTags,
				notUseTags: notUseTags,
			};
		} else {
			return { message: MESSAGE.TAG_NOT_USED_IN_CONVERSATIONAL_FLOW, canUse: true };
		}
	} catch (error) {
		console.log('checkReserveFlowTags error....', error);
		return false;
	}
};
module.exports.checkReserveFlowTags = checkReserveFlowTags;

const getReservedTags = async function (clientId) {
	try {
		//First Find Client Account
		let allClientId = [];
		let flag_1 = true;
		let count = 0;
		let maxCount = 0;
		let tagsList = [];
		[err, maxCount] = await to(Client.count());
		while (flag_1) {
			count++;

			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					attributes: ['id', 'category', 'Associate_client_id'],
				})
			);
			if (err) {
				console.log('----------Error--1', err);
				return tagsList;
			}

			if (clientDetails && clientDetails.category == 'Branch Account') {
				clientId = clientDetails.Associate_client_id;
			} else if (clientDetails && clientDetails.category == 'Client Account') {
				clientId = clientDetails.id;
				flag_1 = false;
			} else {
				flag_1 = false;
			}

			if (count > maxCount) {
				flag_1 = false;
			}
		}

		//Then Find All Under Branch Accounts
		allClientId = await getAllSubClientAndBranchAccountLists(clientId, false);

		//Then Check Tag is Used or not in Conversational Flow
		[err, checkTags] = await to(
			Campaign.findAll({
				where: {
					ClientId: allClientId,
					isDeleted: false,
					flowType: 'Conversational',
				},
				attributes: ['id'],
				include: [{ model: CampaignTagMapping, attributes: ['id', 'CampaignId', 'tag'] }],
			})
		);
		if (err) {
			console.log('----------Error--2', err);
			return tagsList;
		}

		if (checkTags && checkTags.length > 0) {
			for (let tags of checkTags) {
				for (let tag of tags.CampaignTagMappings) {
					tagsList.push(tag.tag);
				}
			}
		}
		return tagsList;
	} catch (error) {
		console.log('getReservedTags error....', error);
		return false;
	}
};
module.exports.getReservedTags = getReservedTags;

const getNextFiftineMinSlot = async function (currentDate = new Date(), isChatBoat = false) {
	try {
		console.log('--isChatBoat--', isChatBoat);
		if (isChatBoat) {
			return moment().format();
		} else {
			let date = moment(currentDate);
			date = date.seconds(0);
			const minutes = new Date().getMinutes();
			let triggerDate = moment(date).format();
			if (minutes % 15 !== 0) {
				let min = 15 - (minutes % 15);
				triggerDate = moment(date).add(min, 'minutes').format();
			} else {
				triggerDate = moment(date).add(15, 'minutes').format();
			}
			return triggerDate;
		}
	} catch (error) {
		console.log('getNextFiftineMinSlot....', error);
	}
};
module.exports.getNextFiftineMinSlot = getNextFiftineMinSlot;

const sendMicrosoftTeamsMessage = async function (drip_data, chat_id, access_token, code) {
	try {
		const url = `https://graph.microsoft.com/v1.0/chats/${chat_id}/messages`;

		let data;

		if (drip_data.onlyTeamMsgType === 'Send Message') {
			//Get Send Message Code
			data = await bodyObjectForSendMessageType(drip_data, code);
		} else if (drip_data.onlyTeamMsgType === 'Send Card') {
			//Get Send Card Code
			data = await bodyObjectForSendCardType(drip_data, code);
		}
		if (data) {
			try {
				const response = await axios.post(url, data, {
					headers: {
						Authorization: `Bearer ${access_token}`,
						'Content-Type': 'application/json',
					},
				});
				// console.log('Message sent:', response.data);
				return response.data; // Returns the sent message object
			} catch (error) {
				console.log('Error sending message:', error.response ? error.response.data : error.message);
				return error.response.data; // Handle errors or return null
			}
		} else {
			return { error: { message: 'Data is not available' } }; // Handle errors or return null
		}
	} catch (error) {
		console.log('Error in sendMicrosoftTeamsMessage', error);
		return { error: { message: 'Error in sendMicrosoftTeamsMessage' } }; // Handle errors or return null
	}
};

const sendMicrosoftTeamsChannelMessage = async function (drip_data, team_id, channel_id, access_token, code) {
	try {
		const url = `https://graph.microsoft.com/v1.0/teams/${team_id}/channels/${channel_id}/messages`;

		let data;

		if (drip_data.onlyTeamMsgType === 'Send Message') {
			//Get Send Message Code
			data = await bodyObjectForSendMessageType(drip_data, code);
		} else if (drip_data.onlyTeamMsgType === 'Send Card') {
			//Get Send Card Code
			data = await bodyObjectForSendCardType(drip_data, code);
		}
		if (data) {
			try {
				const response = await axios.post(url, data, {
					headers: {
						Authorization: `Bearer ${access_token}`,
						'Content-Type': 'application/json',
					},
				});

				// console.log('Message sent:', response.data);
				return response.data; // Returns the sent message object
			} catch (error) {
				console.log('Error sending message:', error.response ? error.response.data : error.message);
				return error.response.data; // Handle errors or return null
			}
		} else {
			return { error: { message: 'Data is not available' } }; // Handle errors or return null
		}
	} catch (error) {
		console.log('Error in sendMicrosoftTeamsChannelMessage', error);
		return { error: { message: 'Error in sendMicrosoftTeamsChannelMessage' } }; // Handle errors or return null
	}
};

// const sendDripWithTeamsMessage = async function (drip_data, chat_id, access_token, code) {
// 	try {
// 		const url = `https://graph.microsoft.com/v1.0/chats/${chat_id}/messages`;

// 		let data;

// 		if (drip_data.onlyTeamMsgType === 'Send Message') {
// 			//Get Send Message Code
// 			data = await bodyObjectForSendMessageType(drip_data, code);
// 		} else if (drip_data.onlyTeamMsgType === 'Send Card') {
// 			//Get Send Card Code
// 			data = await bodyObjectForSendCardType(drip_data, code);
// 		}
// 		if (data) {
// 			try {
// 				const response = await axios.post(url, data, {
// 					headers: {
// 						Authorization: `Bearer ${access_token}`,
// 						'Content-Type': 'application/json',
// 					},
// 				});

// 				// console.log('Message sent:', response.data);
// 				return response.data; // Returns the sent message object
// 			} catch (error) {
// 				console.log('Error sending message:', error.response ? error.response.data : error.message);
// 				return error.response.data; // Handle errors or return null
// 			}
// 		} else {
// 			return { error: { message: 'Data is not available' } }; // Handle errors or return null
// 		}
// 	} catch (error) {
// 		console.log('Error in sendMicrosoftTeamsMessage', error);
// 		return { error: { message: 'Error in sendMicrosoftTeamsMessage' } }; // Handle errors or return null
// 	}
// };

// Create a body object for sending a message based on the message type
const bodyObjectForSendMessageType = async function (drip_data, code) {
	try {
		const assetUrl = `${CONFIG.image_host}${drip_data.headerPath}`;
		let content = ``;
		let attachments = ``;
		const ramdonId = await generateUUID();

		if (drip_data.header_type === 'Image') {
			//Need To Convert into Base64
			// const imageUrl = `${CONFIG.image_host}${drip_data.headerPath}`;
			// const imageUrl = 'https://app.staging.sendrip.com/images/uploads/assets/9DM-OUJp80_1697625134042.jpg';
			// const base64Image = await getBase64Image(imageUrl);
			//Add Image And Text Message into Message Body
			content = `${drip_data.body}<br><img src="${assetUrl}" alt="Image"/><br>`;
		} else if (drip_data.header_type === 'Video') {
			// Need To Check this code
			content = `${drip_data.body} <attachment id=\"${ramdonId}\"></attachment>`;
			attachments = [
				{
					id: ramdonId,
					contentType: 'reference',
					contentUrl: drip_data.headerPath,
					name: drip_data.headerFileName,
				},
			];
		} else if (drip_data.header_type === 'Document') {
			// Need To Check this code
			// content = `${drip_data.body}<br><a href="${assetUrl}"><br>Click here to watch the Document</a><br>`;
			content = `${drip_data.body} <attachment id=\"${ramdonId}\"></attachment>`;
			attachments = [
				{
					id: ramdonId,
					contentType: 'reference',
					contentUrl: drip_data.headerPath,
					name: drip_data.headerFileName,
				},
			];
		} else {
			content = `${drip_data.body}<br>`;
		}

		//Add Hyper Link
		const url = `${CONFIG.pwa_base_url}/?drip_code=${code}`;
		for (let i = 1; i <= 3; i++) {
			if (drip_data && drip_data[`hyper_link${i}`] && drip_data[`callToActionText${i}`]) {
				if (drip_data[`trackableLink${i}`]) {
					content = content + `<a href="${url}">${drip_data[`callToActionText${i}`]}</a><br>`;
				} else {
					content = content + `<a href="${drip_data[`hyper_link${i}`]}">${drip_data[`callToActionText${i}`]}</a><br>`;
				}
			}
		}

		//Add Drip Url
		if (drip_data?.callToActionText) {
			content = content + `<a href="${url}">${drip_data.callToActionText}</a><br>`;
		}
		content = await formatMessageForTeams(content);

		const data = {
			body: {
				content: content,
				contentType: 'html',
			},
		};

		if (drip_data.header_type === 'Video' || drip_data.header_type === 'Document') {
			data.attachments = attachments;
		}

		return data;
	} catch (error) {
		console.log('bodyObjectForSendMessageType error....', error);
	}
};

// Create a body object for sending a message based on the message type
const bodyObjectForSendCardType = async function (drip_data, code) {
	try {
		const ramdonId = generateRandomString(32);
		let cardJson = {
			type: 'AdaptiveCard',
			body: [
				{
					type: 'TextBlock',
					text: drip_data.cardTitle, // Assuming this is the title
					weight: 'Bolder', // Makes the text bold
					size: 'Medium', // Adjust the size as needed
				},
				{
					type: 'TextBlock',
					text: drip_data.cardSubTitle, // Assuming this is the subtitle
					weight: 'Bolder',
					size: 'Default',
					spacing: 'Small', // Adjust spacing as needed
					isSubtle: true, // Makes the text less prominent
				},
				// {
				// 	type: 'TextBlock',
				// 	text: drip_data.body, // Assuming you have the body text in drip_data.cardBody
				// 	wrap: true, // Allows the text to wrap to the next line
				// },
			],
			actions: [],
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.2',
		};

		cardJson.body[0].text = await formatMessageForTeams(cardJson.body[0].text);
		cardJson.body[1].text = await formatMessageForTeams(cardJson.body[1].text);

		let lines = drip_data.body.split('\n'); // Split by line breaks

		let body_line_breaks = lines.map((line) => {
			return {
				type: 'TextBlock',
				text: line.trim(),
				wrap: true,
			};
		});

		// Append the additional TextBlock items to the body array
		cardJson.body = cardJson.body.concat(body_line_breaks);

		//Add Button into Card
		for (let i = 1; i <= 3; i++) {
			let url = drip_data[`hyper_link${i}`];
			if (drip_data && drip_data[`hyper_link${i}`] && drip_data[`callToActionText${i}`]) {
				if (drip_data[`trackableLink${i}`]) {
					url = `${CONFIG.pwa_base_url}/?drip_code=${code}`;
				}

				let button = {
					type: 'Action.OpenUrl',
					title: drip_data[`callToActionText${i}`],
					url: url,
				};
				cardJson.actions.push(button);
			}
		}

		if (drip_data?.callToActionText) {
			let button = {
				type: 'Action.OpenUrl',
				title: drip_data.callToActionText,
				url: `${CONFIG.pwa_base_url}/?drip_code=${code}`,
			};
			cardJson.actions.push(button);
		}

		if (cardJson.actions.length == 0) {
			delete cardJson.actions;
		}

		let data = {
			body: {
				contentType: 'html',
				content: `<attachment id="${ramdonId}"></attachment>`,
			},
			attachments: [
				{
					id: ramdonId,
					contentType: 'application/vnd.microsoft.card.adaptive',
					contentUrl: null,
					content: JSON.stringify(cardJson),
				},
			],
		};
		return data;
	} catch (error) {
		console.log('bodyObjectForSendMessageType error....', error);
	}
};

async function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		let r = (Math.random() * 16) | 0,
			v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

async function formatMessageForTeams(message) {
	// Replace multiple spaces with &nbsp;
	let formattedMessage = message.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));

	// Replace blank lines with corresponding number of <br>
	formattedMessage = formattedMessage.replace(/\n\s*\n/g, (match) => '<br>'.repeat(match.split('\n').length - 1));

	// Ensure sentences starting at the beginning of a line are preserved
	formattedMessage = formattedMessage.replace(/\n/g, '<br>');

	return formattedMessage;
}

function generateRandomString(length) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

const getBase64Image = async function (imageUrl) {
	try {
		const response = await axios.get(imageUrl, {
			responseType: 'arraybuffer',
		});
		const base64 = Buffer.from(response.data, 'binary').toString('base64');
		return base64;
	} catch (error) {
		console.log('getBase64Image error....', error);
		return null;
	}
};

const throttledForSendWhatsAppNativeDrip = limiterForQuiz.wrap(sendWhatsAppNativeDripNew);
const throttledForSendWhatsAppNonNativeQuizDrip = limiterForQuiz.wrap(sendWhatsAppNonNativeDripNew);
const throttledForSendWhatsAppNonNativeRandomQuizDrip = limiterForRandomQuiz.wrap(sendWhatsAppNonNativeDripNew);
