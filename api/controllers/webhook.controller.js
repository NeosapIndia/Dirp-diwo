const {
	Op,
	CampWhatsAppEmailDrip,
	Market,
	Bot_message,
	User_role_client_mapping,
	User,
	sequelize,
	Bot_send_msg,
	Post,
	WhatsAppSetup,
	Drip_whatsapp_non_native,
	Drip_whatsapp_native,
	ClientWhatsAppSetup,
	Assigned_post_to_user,
	WhatsAppDeliveryStatus,
	EmailDeliveryStatus,
	Client_job_role,
	Client,
	User_job_role_mapping,
	TicketConversation,
	Ticket,
	ClientAgentMapping,
	UserThread,
	Campaign,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { getAllSubChildClientIds } = require('../services/client.service');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const axios = require('axios');
const xlsxtojson = require('xlsx-to-json-lc');
var Excel = require('excel4node');
const shortid = require('shortid');
const fs = require('fs');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { checkTemplateStatus } = require('../services/whats-app.service');
const config_feature = require('../config/SiteConfig.json');

const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');
const { notificationEmail } = require('../services/mailer.service');
const { createNotification } = require('../services/notification.service');
const {
	CheckAndUpdateWhatsAppVariableWithUSerData,
	CheckAndUpdateMeta_WhatsAppUserVariables,
} = require('../services/campaign.service');
// ///////////////////////////////////////////////////////Change in the Code//////////////////////////////////////////////////////////////

const { actionByLearner, selectQuickReplyByLearner } = require('../services/campaign.service');

// ///////////////////////////////////////////////////////Change in the Code//////////////////////////////////////////////////////////////

const {
	sendDripFlow,
	sendDrip,
	checkAndSendMsgFromAIAssistant,
	sendLocationAndContactOnWhatsAppMessage,
	closedTicket,
} = require('../services/chatbot.service');
const schedule = require('node-schedule');
const moment = require('moment');
const { getClientAppBrandingByClientId } = require('../services/client.service');
const { sendWhatsAppdripToNewContact } = require('../services/whats-app.service');

const saveWhatsAppDeliveryStatus = async function (req, res) {
	try {
		console.log('-----WhatsApp Delivery Status-----', req.body);
		if (req?.body?.length > 0) {
			saveDeliveryStatusToDatabase(req.body);
		}

		return ResponseSuccess(res);
	} catch (error) {
		console.log('---Error ---WhatsApp Delivery Status---', error);
		return ResponseError(res, error, 500, true);
	}
};

module.exports.saveWhatsAppDeliveryStatus = saveWhatsAppDeliveryStatus;

const saveDeliveryStatusToDatabase = async function (data) {
	try {
		const payload = data.map((whatsAppResponse) => ({ statusData: JSON.stringify(whatsAppResponse) }));
		await to(WhatsAppDeliveryStatus.bulkCreate(payload));
		return;
	} catch (error) {
		console.log('--- Entry Into Database Error----', error);
	}
};

const saveEmailDeliveryStatus = async function (req, res) {
	try {
		console.log('-----Email Delivery Status-----', req.body);
		if (req?.body?.length > 0) {
			saveEmailDeliveryStatusToDatabase(req.body);
		}
		return ResponseSuccess(res);
	} catch (error) {
		console.log('---Error ---Email Delivery Status---', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.saveEmailDeliveryStatus = saveEmailDeliveryStatus;

const saveEmailDeliveryStatusToDatabase = async function (data) {
	try {
		const payload = data.map((emailResponse) => ({ statusData: JSON.stringify(emailResponse) }));
		await to(EmailDeliveryStatus.bulkCreate(payload));
		return;
	} catch (error) {
		console.log('--- Entry Into Database Error----', error);
	}
};

let campaign_schedulor = schedule.scheduleJob(CONFIG.webhook_scheduler_config, async function (fireDate) {
	console.log('Run Scheduler --->>>-->>>  Update WhatsApp Delivery Status schedulor', fireDate);
	if (config_feature?.configurable_feature?.whatsApp) {
		await updateWhatsAppDeliveryStatus();
	}
	await updateEmailDeliveryStatus();
});
module.exports.campaign_schedulor = campaign_schedulor;

// const updateWhatsAppDeliveryStatus = async function () {
// 	try {
// 		[err, count] = await to(WhatsAppDeliveryStatus.count({ where: { isProcessed: false } }));
// 		if (err) console.log('----error when get Count of unProcessed Data---', err);
// 		let loop = 0;
// 		const limit = 500;
// 		if (count) {
// 			loop = Math.ceil(count / limit);
// 		}

// 		if (loop > 0) {
// 			for (let i = 0; i < loop; i++) {
// 				[err, getAllData] = await to(
// 					WhatsAppDeliveryStatus.findAll({
// 						where: { isProcessed: false },
// 						limit: limit,
// 						order: [['createdAt', 'ASC']],
// 					})
// 				);
// 				if (err) console.log('----get All Data from WhatsAppDeliveryStatus error', err);

// 				let updateStatus;
// 				if (getAllData?.length > 0) {
// 					//Update isProcessed Flag to true

// 					for (let data of getAllData) {
// 						let whatsAppResponse = JSON.parse(data.statusData);
// 						let payload = {
// 							status:
// 								whatsAppResponse && whatsAppResponse.eventType
// 									? whatsAppResponse.eventType.charAt(0).toUpperCase() +
// 									  whatsAppResponse.eventType.slice(1).toLowerCase()
// 									: null,
// 							cause:
// 								whatsAppResponse && whatsAppResponse.cause
// 									? whatsAppResponse.cause.charAt(0).toUpperCase() + whatsAppResponse.cause.slice(1).toLowerCase()
// 									: null,
// 							deliveryCode:
// 								whatsAppResponse && whatsAppResponse.errorCode ? parseInt(whatsAppResponse.errorCode) : null,
// 							channel:
// 								whatsAppResponse && whatsAppResponse.channel
// 									? whatsAppResponse.channel.charAt(0).toUpperCase() + whatsAppResponse.channel.slice(1).toLowerCase()
// 									: null,
// 						};

// 						let getDetails = null;
// 						let botMessage = false;
// 						[err, details] = await to(
// 							CampWhatsAppEmailDrip.findOne({
// 								where: {
// 									WAppTriggerId: whatsAppResponse.externalId,
// 								},
// 								attributes: ['id', 'sentDate', 'deliveryDate', 'readDate', 'failDate'],
// 							})
// 						);
// 						if (err) {
// 							console.log('--Error-- When get data from CampWhatsAppEmailDrip--', err);
// 						}
// 						getDetails = details;
// 						if (!details) {
// 							botMessage = true;
// 							[err, details] = await to(
// 								Bot_send_msg.findOne({
// 									where: {
// 										messageId: whatsAppResponse.externalId,
// 									},
// 									attributes: ['id', 'sentDate', 'deliveryDate', 'readDate', 'failDate'],
// 								})
// 							);
// 							if (err) {
// 								console.log('--Error-- When get data from CampWhatsAppEmailDrip--', err);
// 							}
// 							getDetails = details;
// 						}
// 						if (getDetails) {
// 							if (getDetails?.sentDate) {
// 								payload.sentDate = getDetails.sentDate;
// 							}

// 							if (getDetails?.deliveryDate) {
// 								payload.deliveryDate = getDetails.deliveryDate;
// 							}

// 							if (getDetails?.readDate) {
// 								payload.readDate = getDetails.readDate;
// 							}

// 							if (getDetails?.failDate) {
// 								payload.failDate = getDetails.failDate;
// 							}
// 						}

// 						if (whatsAppResponse.eventType == 'SENT') {
// 							payload.sentDate =
// 								whatsAppResponse && whatsAppResponse.eventTs
// 									? new Date(parseInt(whatsAppResponse.eventTs))
// 									: new Date();
// 						} else if (whatsAppResponse.eventType == 'DELIVERED') {
// 							payload.deliveryDate =
// 								whatsAppResponse && whatsAppResponse.eventTs
// 									? new Date(parseInt(whatsAppResponse.eventTs))
// 									: new Date();
// 						} else if (whatsAppResponse.eventType == 'READ') {
// 							payload.readDate =
// 								whatsAppResponse && whatsAppResponse.eventTs
// 									? new Date(parseInt(whatsAppResponse.eventTs))
// 									: new Date();
// 						} else if (whatsAppResponse.eventType == 'FAILED') {
// 							let errorMessage = '';
// 							payload.sentDate = null;
// 							if (whatsAppResponse && whatsAppResponse.cause == 'UNKNOWN_SUBSCRIBER') {
// 								errorMessage = 'Unknown/invalid number/does not exist on WhatsApp';
// 							} else if (whatsAppResponse && whatsAppResponse.cause == 'DEFERRED') {
// 								errorMessage = 'Messages that could not be sent to WhatsApp';
// 							} else if (whatsAppResponse && whatsAppResponse.cause == 'OTHER') {
// 								errorMessage =
// 									"Message that are sent to WhatsApp but could not be delivered for reasons that don't fall under any mentioned category";
// 							} else if (whatsAppResponse && whatsAppResponse.cause == 'BLOCKED_FOR_USER') {
// 								errorMessage = 'Blocked by user';
// 							} else if (whatsAppResponse && whatsAppResponse.cause.toLowerCase() == 'wa_frequencycapping') {
// 								errorMessage = whatsAppResponse.cause;
// 								/////////////////////////////////////////////////////////////////////////////
// 								/////////////////////////////////////////////////////////////////////////////
// 								const flag = await retryTriggerWhatsAppMessage(whatsAppResponse.externalId, errorMessage);

// 								//Update WhatsApp Temp Data

// 								[err, updateProceedIds] = await to(
// 									WhatsAppDeliveryStatus.update(
// 										{ isProcessed: true, status: 'Success' },
// 										{
// 											where: {
// 												id: data.id,
// 												isProcessed: false,
// 											},
// 										}
// 									)
// 								);
// 								if (err) console.log('----error when update WhatsApp Status report--1', err);
// 								if (flag) {
// 									continue;
// 								}
// 								/////////////////////////////////////////////////////////////////////////////
// 								/////////////////////////////////////////////////////////////////////////////////
// 							}
// 							// else if (whatsAppResponse && whatsAppResponse.cause.toLowerCase() == 'wa_experiment_fail') {
// 							// 	errorMessage = whatsAppResponse.cause;
// 							// }
// 							else {
// 								errorMessage = whatsAppResponse.cause;
// 							}

// 							payload.errorMessage = errorMessage;
// 							payload.failDate =
// 								whatsAppResponse && whatsAppResponse.eventTs
// 									? new Date(parseInt(whatsAppResponse.eventTs))
// 									: new Date();
// 						} else {
// 							payload.errorMessage = whatsAppResponse && whatsAppResponse.cause;
// 							payload.failDate =
// 								whatsAppResponse && whatsAppResponse.eventTs
// 									? new Date(parseInt(whatsAppResponse.eventTs))
// 									: new Date();
// 						}

// 						if (payload.failDate) {
// 							payload.status = 'Failed';
// 							payload.cause = 'Failed';
// 						} else if (payload.readDate) {
// 							payload.status = 'Read';
// 							payload.cause = 'Read';
// 							payload.deliveryCode = 26;
// 						} else if (payload.deliveryDate) {
// 							payload.status = 'Delivered';
// 							payload.cause = 'Success';
// 							payload.deliveryCode = null;
// 						} else if (payload.sentDate) {
// 							payload.status = 'Sent';
// 							payload.cause = 'Sent';
// 							payload.deliveryCode = 25;
// 						}

// 						if (payload.channel == 'Sms') {
// 							payload.channel = 'Whatsapp';
// 						}

// 						console.log('<<<<<<<<<-----BOATMSGpayload-------->>>>>>', payload);

// 						if (!botMessage) {
// 							[err, updateStatus] = await to(
// 								CampWhatsAppEmailDrip.update(payload, {
// 									where: {
// 										WAppTriggerId: whatsAppResponse.externalId,
// 									},
// 								})
// 							);
// 							if (err) console.log('----Error when Update WhatsApp Status-----', err);
// 							if (updateStatus && updateStatus[0] != 0) {
// 								if (payload.status === 'Read') {
// 									[err, post] = await to(
// 										CampWhatsAppEmailDrip.findOne({
// 											where: {
// 												WAppTriggerId: whatsAppResponse.externalId,
// 											},
// 											attributes: ['id', 'AssignedPostToUserId', 'CampaignId', 'DripCampIndex', 'UserId'],
// 										})
// 									);
// 									if (err) console.log('----Error when get Camp WhatsApp Drip Data --', err);

// 									if (post) actionByLearner(post.UserId, post.CampaignId, post.DripCampIndex, 'Read on channel', null);
// 								}
// 							}
// 						} else {
// 							[err, updateStatus] = await to(
// 								Bot_send_msg.update(payload, {
// 									where: {
// 										messageId: whatsAppResponse.externalId,
// 									},
// 								})
// 							);
// 							if (err) console.log('----Error at update Bot send msg ------', err);
// 						}

// 						if (updateStatus && updateStatus[0] != 0) {
// 							[err, updateProceedIds] = await to(
// 								WhatsAppDeliveryStatus.update(
// 									{ isProcessed: true, status: 'Success' },
// 									{
// 										where: {
// 											id: data.id,
// 											isProcessed: false,
// 										},
// 									}
// 								)
// 							);
// 							if (err) console.log('----error when update WhatsApp Status report--1', err);
// 						} else {
// 							[err, updateProceedIds] = await to(
// 								WhatsAppDeliveryStatus.update(
// 									{ isProcessed: true, status: 'Not Found' },
// 									{
// 										where: {
// 											id: data.id,
// 											isProcessed: false,
// 										},
// 									}
// 								)
// 							);
// 							if (err) console.log('----error when update WhatsApp Status report--2', err);
// 						}
// 					}
// 				}
// 			}
// 		}
// 		return;
// 	} catch (error) {
// 		console.log('---Error ---updateWhatsAppDeliveryStatus--', error);
// 	}
// };
// module.exports.updateWhatsAppDeliveryStatus = updateWhatsAppDeliveryStatus;

const updateWhatsAppDeliveryStatus = async function () {
	try {
		[err, count] = await to(WhatsAppDeliveryStatus.count({ where: { isProcessed: false } }));
		if (err) console.log('----error when get Count of unProcessed Data---', err);
		let loop = 0;
		const limit = 500;
		if (count) {
			loop = Math.ceil(count / limit);
		}

		if (loop > 0) {
			for (let i = 0; i < loop; i++) {
				[err, getAllData] = await to(
					WhatsAppDeliveryStatus.findAll({
						where: { isProcessed: false },
						limit: limit,
						order: [['createdAt', 'ASC']],
					})
				);
				if (err) {
					console.log('----get All Data from WhatsAppDeliveryStatus error', err);
				}

				let updateStatus;
				if (getAllData?.length > 0) {
					//Update isProcessed Flag to true

					for (let data of getAllData) {
						let whatsAppResponse = JSON.parse(data.statusData);
						let isMeta = data.isMeta; // check if source is meta
						let payload = {
							status:
								whatsAppResponse && whatsAppResponse.eventType
									? whatsAppResponse.eventType.charAt(0).toUpperCase() +
									  whatsAppResponse.eventType.slice(1).toLowerCase()
									: null,
							cause:
								whatsAppResponse && whatsAppResponse.cause
									? whatsAppResponse.cause.charAt(0).toUpperCase() + whatsAppResponse.cause.slice(1).toLowerCase()
									: null,
							deliveryCode:
								whatsAppResponse && whatsAppResponse.errorCode ? parseInt(whatsAppResponse.errorCode) : null,
							channel:
								whatsAppResponse && whatsAppResponse.channel
									? whatsAppResponse.channel.charAt(0).toUpperCase() + whatsAppResponse.channel.slice(1).toLowerCase()
									: null,
						};

						console.log(`[${data.id}] --whatsAppResponse--`, whatsAppResponse);

						// -------------------- META BLOCK START --------------------
						if (isMeta && whatsAppResponse?.changes?.[0]?.value?.statuses?.length) {
							const metaStatus = whatsAppResponse.changes[0].value.statuses[0];
							console.log(`[${data.id}] --metaStatus--`, metaStatus);

							if (metaStatus.status) {
								const statusLower = metaStatus.status.toLowerCase();
								const statusFormatted = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
								payload.status = statusFormatted;

								if (metaStatus.timestamp) {
									const ts = new Date(parseInt(metaStatus.timestamp) * 1000);
									if (statusLower === 'sent') {
										payload.sentDate = ts;
									} else if (statusLower === 'delivered') {
										payload.deliveryDate = ts;
									} else if (statusLower === 'read') {
										payload.readDate = ts;
									} else if (statusLower === 'failed') {
										payload.failDate = ts;
									}
								}
							}

							payload.cause = 'Meta';
							payload.channel = 'Whatsapp';

							if (metaStatus.errors && metaStatus.errors.length > 0) {
								const errorCode = metaStatus.errors[0]?.code;
								const errorTitle = metaStatus.errors[0]?.title;
								if (errorCode === 131045) {
									payload.errorMessage = 'Unknown/invalid number/does not exist on WhatsApp';
								} else if (errorCode === 131047) {
									payload.errorMessage = 'Blocked by user';
								} else if (errorCode === 131051) {
									payload.errorMessage = 'Messages that could not be sent to WhatsApp';
								} else if (errorCode === 131048) {
									payload.errorMessage = 'Message expired';
								} else if (
									errorTitle &&
									errorTitle.toLowerCase() == 'this message was not delivered to maintain healthy ecosystem engagement.'
								) {
									errorMessage = whatsAppResponse.errorTitle;

									/////////////////////////////////////////////////////////////////////////////
									/////////////////////////////////////////////////////////////////////////////
									const flag = await retryTriggerWhatsAppMessage(whatsAppResponse.externalId, errorMessage);
									//Update WhatsApp Temp Data

									[err, updateProceedIds] = await to(
										WhatsAppDeliveryStatus.update(
											{ isProcessed: true, status: 'Success' },
											{
												where: {
													id: data.id,
													isProcessed: false,
												},
											}
										)
									);
									if (err) console.log('----error when update WhatsApp Status report--1', err);
									if (flag) {
										continue;
									}
									/////////////////////////////////////////////////////////////////////////////
									/////////////////////////////////////////////////////////////////////////////
								} else {
									payload.errorMessage = errorTitle || null;
								}
							} else {
								console.log(`[${data.id}] Meta status had no errors`, metaStatus);
								payload.errorMessage = null;
							}

							if (metaStatus.id) {
								whatsAppResponse.externalId = metaStatus.id;
							}
						}
						// -------------------- META BLOCK END --------------------

						if (!whatsAppResponse.externalId) {
							continue;
						}

						let getDetails = null;
						let botMessage = false;
						[err, details] = await to(
							CampWhatsAppEmailDrip.findOne({
								where: {
									WAppTriggerId: whatsAppResponse.externalId,
								},
								attributes: ['id', 'sentDate', 'deliveryDate', 'readDate', 'failDate'],
							})
						);
						if (err) {
							console.log('--Error-- When get data from CampWhatsAppEmailDrip--', err);
						}
						getDetails = details;

						if (!details) {
							console.log('--details--', details);

							botMessage = true;
							[err, details] = await to(
								Bot_send_msg.findOne({
									where: {
										messageId: whatsAppResponse.externalId,
									},
									attributes: ['id', 'sentDate', 'deliveryDate', 'readDate', 'failDate'],
								})
							);
							if (err) {
								console.log('--Error-- When get data from CampWhatsAppEmailDrip--', err);
							}
							getDetails = details;
						}

						if (getDetails) {
							console.log('--getDetails--');
							if (getDetails?.sentDate) {
								payload.sentDate = getDetails.sentDate;
							}

							if (getDetails?.deliveryDate) {
								payload.deliveryDate = getDetails.deliveryDate;
							}

							if (getDetails?.readDate) {
								payload.readDate = getDetails.readDate;
							}

							if (getDetails?.failDate) {
								payload.failDate = getDetails.failDate;
							}
						}

						// ===== PATCH START: Gupshup fallback logic should not run for Meta =====
						if (!isMeta) {
							const evt = whatsAppResponse.eventType?.toLowerCase();
							if (evt === 'sent') {
								payload.sentDate =
									whatsAppResponse && whatsAppResponse.eventTs
										? new Date(parseInt(whatsAppResponse.eventTs))
										: new Date();
							} else if (evt === 'delivered') {
								payload.deliveryDate =
									whatsAppResponse && whatsAppResponse.eventTs
										? new Date(parseInt(whatsAppResponse.eventTs))
										: new Date();
							} else if (evt === 'read') {
								payload.readDate =
									whatsAppResponse && whatsAppResponse.eventTs
										? new Date(parseInt(whatsAppResponse.eventTs))
										: new Date();
							} else if (evt === 'failed') {
								let errorMessage = '';
								payload.sentDate = null;
								console.log(
									'---------------whatsAppResponse.cause-----------------------',
									whatsAppResponse.cause.toLowerCase()
								);
								if (whatsAppResponse && whatsAppResponse.cause == 'UNKNOWN_SUBSCRIBER') {
									errorMessage = 'Unknown/invalid number/does not exist on WhatsApp';
								} else if (whatsAppResponse && whatsAppResponse.cause == 'DEFERRED') {
									errorMessage = 'Messages that could not be sent to WhatsApp';
								} else if (whatsAppResponse && whatsAppResponse.cause == 'OTHER') {
									errorMessage =
										"Message that are sent to WhatsApp but could not be delivered for reasons that don't fall under any mentioned category";
								} else if (whatsAppResponse && whatsAppResponse.cause == 'BLOCKED_FOR_USER') {
									errorMessage = 'Blocked by user';
								} else if (whatsAppResponse && whatsAppResponse.cause.toLowerCase() == 'wa_frequencycapping') {
									errorMessage = whatsAppResponse.cause;

									/////////////////////////////////////////////////////////////////////////////
									/////////////////////////////////////////////////////////////////////////////
									const flag = await retryTriggerWhatsAppMessage(whatsAppResponse.externalId, errorMessage);
									//Update WhatsApp Temp Data

									[err, updateProceedIds] = await to(
										WhatsAppDeliveryStatus.update(
											{ isProcessed: true, status: 'Success' },
											{
												where: {
													id: data.id,
													isProcessed: false,
												},
											}
										)
									);
									if (err) console.log('----error when update WhatsApp Status report--1', err);
									if (flag) {
										continue;
									}
									/////////////////////////////////////////////////////////////////////////////
									/////////////////////////////////////////////////////////////////////////////
								} else {
									errorMessage = whatsAppResponse.cause;
								}
								payload.errorMessage = errorMessage;
								payload.failDate =
									whatsAppResponse && whatsAppResponse.eventTs
										? new Date(parseInt(whatsAppResponse.eventTs))
										: new Date();
							}
						}
						// ===== PATCH END: Gupshup fallback logic should not run for Meta =====

						// ===== PATCH START: Skip failDate override for Meta =====
						if (!isMeta && payload.failDate) {
							payload.status = 'Failed';
							payload.cause = 'Failed';
						}
						// ===== PATCH END: Skip failDate override for Meta =====

						if (payload.readDate) {
							payload.status = 'Read';
							payload.cause = 'Read';
							payload.deliveryCode = 26;
						} else if (payload.deliveryDate) {
							payload.status = 'Delivered';
							payload.cause = 'Success';
							payload.deliveryCode = null;
						} else if (payload.sentDate) {
							payload.status = 'Sent';
							payload.cause = 'Sent';
							payload.deliveryCode = 25;
						}

						if (payload.channel == 'Sms') {
							payload.channel = 'Whatsapp';
						}

						console.log('<<<<<<<<<-----BOATMSGpayload-------->>>>>>', payload);

						if (!botMessage) {
							[err, updateStatus] = await to(
								CampWhatsAppEmailDrip.update(payload, {
									where: {
										WAppTriggerId: whatsAppResponse.externalId,
									},
								})
							);
							if (err) console.log('----Error when Update WhatsApp Status-----', err);
							if (updateStatus && updateStatus[0] != 0) {
								if (payload.status === 'Read') {
									[err, post] = await to(
										CampWhatsAppEmailDrip.findOne({
											where: {
												WAppTriggerId: whatsAppResponse.externalId,
											},
											attributes: ['id', 'AssignedPostToUserId', 'CampaignId', 'DripCampIndex', 'UserId'],
										})
									);
									if (err) console.log('----Error when get Camp WhatsApp Drip Data --', err);

									if (post) actionByLearner(post.UserId, post.CampaignId, post.DripCampIndex, 'Read on channel', null);
								}
							}
						} else {
							[err, updateStatus] = await to(
								Bot_send_msg.update(payload, {
									where: {
										messageId: whatsAppResponse.externalId,
									},
								})
							);
							if (err) console.log('----Error at update Bot send msg ------', err);
						}

						if (updateStatus && updateStatus[0] != 0) {
							[err, updateProceedIds] = await to(
								WhatsAppDeliveryStatus.update(
									{ isProcessed: true, status: 'Success' },
									{
										where: {
											id: data.id,
											isProcessed: false,
										},
									}
								)
							);
							if (err) console.log('----error when update WhatsApp Status report--1', err);
						} else {
							[err, updateProceedIds] = await to(
								WhatsAppDeliveryStatus.update(
									{ isProcessed: true, status: 'Not Found' },
									{
										where: {
											id: data.id,
											isProcessed: false,
										},
									}
								)
							);
							if (err) console.log('----error when update WhatsApp Status report--2', err);
						}
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('---Error ---updateWhatsAppDeliveryStatus--', error);
	}
};
module.exports.updateWhatsAppDeliveryStatus = updateWhatsAppDeliveryStatus;

const updateEmailDeliveryStatus = async function () {
	try {
		[err, count] = await to(EmailDeliveryStatus.count({ where: { isProcessed: false } }));
		if (err) console.log('----error when get Count of unProcessed Data---', err);
		let loop = 0;
		const limit = 500;
		if (count) {
			loop = Math.ceil(count / limit);
		}
		if (loop > 0) {
			for (let i = 0; i < loop; i++) {
				[err, getAllData] = await to(
					EmailDeliveryStatus.findAll({
						where: { isProcessed: false },
						limit: limit,
						order: [['createdAt', 'ASC']],
					})
				);
				if (err) console.log('----get All Data from update Email Delivery Status error', err);
				if (getAllData?.length > 0) {
					//Update isProcessed Flag to true

					for (let data of getAllData) {
						let emailWebHook = JSON.parse(data.statusData);
						let updateStatus;
						let payload = {
							templateId: emailWebHook && emailWebHook.sg_template_id ? emailWebHook.sg_template_id : null,
							templateName: emailWebHook && emailWebHook.sg_template_name ? emailWebHook.sg_template_name : null,
							mailMessageId: emailWebHook && emailWebHook.sg_message_id ? emailWebHook.sg_message_id : null,
							emailEventId: emailWebHook && emailWebHook.sg_event_id ? emailWebHook.sg_event_id : null,
						};
						if (emailWebHook.event.toLowerCase() == 'processed') {
							payload.status = 'Sent';
							payload.sentDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'delivered') {
							payload.status = 'Delivered';
							payload.deliveryDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'open') {
							payload.status = 'Open';
							payload.readDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'click') {
							payload.status = 'Click';
							payload.clickDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'bounce') {
							payload.status = 'Bounce';
							payload.errorMessage =
								emailWebHook && emailWebHook.bounce_classification ? emailWebHook.bounce_classification : null;
							payload.failDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'dropped') {
							payload.status = 'Dropped';
							payload.errorMessage = emailWebHook && emailWebHook.reason ? emailWebHook.reason : null;
							payload.failDate = new Date();
						} else if (emailWebHook.event.toLowerCase() == 'spamreport') {
							payload.status = 'Spam Report';
						} else if (emailWebHook.event.toLowerCase() == 'unsubscribe') {
							payload.status = 'Unsubscribe';
						} else if (emailWebHook.event.toLowerCase() == 'group_unsubscribe') {
							payload.status = 'Group Unsubscribe';
						} else if (emailWebHook.event.toLowerCase() == 'group_resubscribe') {
							payload.status = 'Group Resubscribe';
						}
						if (emailWebHook.sg_message_id) {
							[err, updateStatus] = await to(
								CampWhatsAppEmailDrip.update(payload, {
									where: {
										EmailTriggerId: emailWebHook.sg_message_id.split('.')[0],
									},
								})
							);
							if (err) console.log('----Error at Update Status CampWhatsAppEmailDrip', err);

							if (payload.status === 'Open') {
								[err, post] = await to(
									CampWhatsAppEmailDrip.findOne({
										where: {
											EmailTriggerId: emailWebHook.sg_message_id.split('.')[0],
										},
										attributes: ['id', 'AssignedPostToUserId', 'CampaignId', 'DripCampIndex', 'UserId'],
									})
								);
								if (err) console.log('----Error at Update Status CampWhatsAppEmailDrip 2', err);
								if (post) actionByLearner(post.UserId, post.CampaignId, post.DripCampIndex, 'Read on channel', null);
							}
						}

						if (updateStatus) {
							[err, updateProceedIds] = await to(
								EmailDeliveryStatus.update(
									{ isProcessed: true, status: 'Success' },
									{
										where: {
											id: data.id,
											isProcessed: false,
										},
									}
								)
							);
							if (err) console.log('----error when update WhatsApp Status report--', err);
						} else {
							[err, updateProceedIds] = await to(
								EmailDeliveryStatus.update(
									{ isProcessed: true, status: 'Not Found' },
									{
										where: {
											id: data.id,
											isProcessed: false,
										},
									}
								)
							);
							if (err) console.log('----error when update WhatsApp Status report--', err);
						}
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('---Error ---updateEmailDeliveryStatus--', error);
	}
};
module.exports.updateEmailDeliveryStatus = updateEmailDeliveryStatus;

const whatsAppReplayStatus = async function (req, res) {
	try {
		console.log('-----Whats App Replay Status-----', req.body);
		let optOutResponse = false;
		let appBranding;
		if (req && req.body) {
			console.log('---------1----------');
			let clientData;
			const data = req.body;
			if (!data.mobile) return ResponseSuccess(res);
			[err, markets] = await to(
				Market.findAll({
					where: {
						status: true,
					},
					attributes: ['id', 'db_name'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let userFind = false;
			let localUserData;
			let userData;
			let marketId;
			for (let market of markets) {
				// const query = `select id, first, last, country, city, state, "zipCode"  from "User_masters" WHERE position(phone in '${data.mobile}') > 0 AND phone is not null AND phone != '' AND "isDeleted" = false;`;
				// [localUser] = await dbInstance[market.db_name].sequelize.query(query);

				const query = `
						SELECT id, first, last, country, city, state, "zipCode"  
						FROM "User_masters" 
						WHERE position(phone in :mobile) > 0 
							AND phone IS NOT NULL 
							AND phone != '' 
							AND "isDeleted" = false;
						`;

				const localUser = await dbInstance[market.db_name].sequelize.query(query, {
					replacements: { mobile: data.mobile },
					type: dbInstance[market.db_name].sequelize.QueryTypes.SELECT,
				});

				if (localUser.length > 0) {
					userFind = true;
					marketId = market.id;
					localUserData = localUser[0];
					break;
				}
			}
			if (!userFind) return ResponseSuccess(res);
			console.log('---------2----------', localUserData.id);
			console.log('---------marketId----------', marketId);

			[err, lastUser] = await to(
				User.findOne({
					where: {
						local_user_id: localUserData.id,
						status: true,
						is_deleted: false,
						cStatus: 'Active',
						forDrip: true,
						MarketId: marketId,
					},
					include: [{ model: Client_job_role, through: 'User_job_role_mapping' }, { model: UserThread }],
					attributes: ['id', 'tags', 'customFields'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (!lastUser) return ResponseSuccess(res);

			userData = lastUser.convertToJSON();
			userData.first = localUserData.first ? localUserData.first : '';
			userData.last = localUserData.last ? localUserData.last : '';
			userData.country = localUserData.country ? localUserData.country : '';
			userData.city = localUserData.city ? localUserData.city : '';
			userData.state = localUserData.state ? localUserData.state : '';
			userData.zipCode = localUserData.zipCode ? localUserData.zipCode : '';
			userData.tags = lastUser.tags ? lastUser.tags.split(',') : [];
			userData.job_role = '';
			userData.phone = data.mobile ? data.mobile : '';
			userData.customFields = lastUser.customFields ? lastUser.customFields : {};

			// For Users Multiple Thread
			userData.UserThreads = lastUser.UserThreads;

			if (lastUser.Client_job_roles && lastUser.Client_job_roles.length > 0) {
				userData.job_role = lastUser.Client_job_roles[0].job_role_name;
			}

			console.log('----------userData----------', userData);
			let tag = null;
			let originalTag = null;
			let id = null;
			let msgType = data.type;
			let url = null;
			let isaudio = false;
			let isReplyToMessage = false;
			let isSelectQuickReply = false;
			if (data.type === 'interactive') {
				const optionBody = JSON.parse(data.interactive);
				originalTag = optionBody.list_reply.title;
				tag = optionBody.list_reply.title.toLowerCase();
				id = parseInt(optionBody.list_reply.id);
			} else if (data.type === 'text') {
				originalTag = data.text;
				tag = data.text.toLowerCase().trimStart().trimEnd();
				////////////////////////
				////////////////////////
				// Add The Code for any reply for any message by user
				// data.context = '{"from":"919324640424","id":"3bda66bb-8450-499c-9597-b165fa1ddbfa"}'
				if (data?.context) {
					isReplyToMessage = true;
				}
				////////////////////////
				////////////////////////
			} else if (data.type === 'button') {
				const optionBody = JSON.parse(data.button);
				// const optionBody = data.button;
				originalTag = optionBody.text;
				tag = optionBody.text.toLowerCase();
				id = parseInt(optionBody.id);
				////////////////////////
				////////////////////////
				// data.button: '{"payload":"Closed Ticket","text":"Closed Ticket"}',
				isSelectQuickReply = true;
				////////////////////////
				////////////////////////
			} else if (data.type === 'image') {
				const optionBody = JSON.parse(data.image);
				url = optionBody.url + '' + optionBody.signature;
			} else if (data.type === 'video') {
				const optionBody = JSON.parse(data.video);
				url = optionBody.url + '' + optionBody.signature;
			} else if (data.type === 'document') {
				const optionBody = JSON.parse(data.document);
				url = optionBody.url + '' + optionBody.signature;
			} else if (data.type === 'voice') {
				const optionBody = JSON.parse(data.voice);
				url = optionBody.url + '' + optionBody.signature;
				isaudio = true;
			} else if (data.type === 'audio') {
				const optionBody = JSON.parse(data.audio);
				url = optionBody.url + '' + optionBody.signature;
				isaudio = true;
			} else if (data.type === 'location') {
				tag = data.location;
				originalTag = data.location;
			} else if (data.type === 'contacts') {
				tag = data.contacts;
				originalTag = data.contacts;
			}

			[err, clientData] = await to(
				User_role_client_mapping.findOne({
					where: {
						RoleId: 1,
						UserId: userData.id,
					},
					attributes: ['ClientId'],
					include: [
						{
							model: Client,
							attributes: ['id', 'name', 'enableChatBot', 'openAISecretKey', 'assistantId'],
							include: [
								{
									model: ClientAgentMapping,
									required: false,
								},
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//-------------------------Get User Response for OPT-OUT----------------------------------------//

			if (clientData && clientData.ClientId && userData && tag) {
				[optOutResponse, appBranding] = await userOptOutMethod(clientData, userData, tag);
				// console.log('<<<<<<<<---optOutResponse--->>>>', optOutResponse);
				// console.log('<<<<<<<<---appBranding--->>>>', appBranding);
			}

			//-----------------------------------OPT-OUT End----------------------------------------------//

			[err, incommingMessageLog] = await to(
				Bot_send_msg.create({
					messageId: data.messageId,
					UserId: userData.id,
					type: 'received',
					data: tag,
					PostId: null,
					msgType: msgType,
					ClientId: clientData && clientData.ClientId ? clientData.ClientId : null,
					url,
					status: null,
					cause: null,
					deliveryCode: null,
					channel: null,
					sentDate: null,
					deliveryDate: null,
					readDate: null,
					failDate: null,
					errorMessage: null,
				})
			);

			if (optOutResponse == false) {
				let details;
				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				// Add Check as per Project environment
				// if ((env == 'dev' || env == 'development' || env == 'local') && tag) {
				// 	if (
				// 		['i want to buy phoenix', 'unsure about decision', 'purchased another vehicle'].indexOf(tag) == -1 &&
				// 		tag
				// 	) {
				// 		[err, details] = await to(
				// 			CampWhatsAppEmailDrip.findOne({
				// 				where: {
				// 					WAppTriggerId: data.replyId + '-' + data.messageId,
				// 				},
				// 				attributes: [
				// 					'id',
				// 					'quickReplyResponse',
				// 					'AssignedPostToUserId',
				// 					'WAppTriggerId',
				// 					'PostId',
				// 					'CampaignId',
				// 					'DripCampIndex',
				// 					'DripCampId',
				// 					'UserId',
				// 				],
				// 			})
				// 		);
				// 	}
				// } else

				if (tag) {
					[err, details] = await to(
						CampWhatsAppEmailDrip.findOne({
							where: {
								WAppTriggerId: data.replyId + '-' + data.messageId,
							},
							attributes: [
								'id',
								'quickReplyResponse',
								'AssignedPostToUserId',
								'WAppTriggerId',
								'PostId',
								'CampaignId',
								'DripCampIndex',
								'DripCampId',
								'UserId',
								'TicketId',
							],
							include: [
								{
									model: Ticket,
									attributes: ['id', 'ContactId', 'UserId', 'status', 'query', 'comment'],
								},
							],
						})
					);
				}

				if (details) {
					////////////////////////
					////////////////////////

					if (isSelectQuickReply) {
						////////////////////////
						////////////////////////

						let quickReplyResponse = details.quickReplyResponse ? details.quickReplyResponse : '';

						if (quickReplyResponse && tag) {
							quickReplyResponse = quickReplyResponse + ',' + tag;
						} else if (tag) {
							quickReplyResponse = tag;
						}

						[err, updateStatus] = await to(
							CampWhatsAppEmailDrip.update(
								{
									quickReplyResponse: quickReplyResponse,
								},
								{
									where: {
										WAppTriggerId: details.WAppTriggerId,
									},
								}
							)
						);
						if (details.AssignedPostToUserId) {
							[err, updateActionLink] = await to(
								Assigned_post_to_user.update(
									{
										isDripClickAction: true,
									},
									{
										where: {
											id: details.AssignedPostToUserId,
										},
									}
								)
							);
						}
					}
					////////////////////////
					////////////////////////

					//Add Check if details?.TicketId and isReplyToMessage or isSelectQuickReply  this flag is true then Closed the Ticket and Send to Contact
					if (details?.TicketId) {
						if (isReplyToMessage || isSelectQuickReply) {
							if (details?.Ticket?.status !== 'Closed') {
								// Also add the record in to the Ticket conversation Table
								const payload = {
									UserId: details.UserId,
									isAdminUser: details?.Ticket?.UserId == details.UserId ? true : false,
									message: originalTag,
									TicketId: details.TicketId,
								};

								[err, addTicketConversation] = await to(TicketConversation.create(payload));

								if (err) {
									console.log('--Error When Add Ticket Conversation Record');
									return ResponseSuccess(res);
								}

								// then Closed the ticket and inform to Contact
								await closedTicket(details.Ticket, originalTag);
							}
						}
						////////////////////////
						////////////////////////
					} else {
						//Call Other Function For Check Quick Reply Action Outcome
						// Parameter:- UserId, CampaignId, DripCampIndex, Action :-- Activity Outcome, PostId

						await to(
							selectQuickReplyByLearner(
								details.UserId,
								details.CampaignId,
								details.DripCampIndex,
								'Activity Outcome',
								tag
							)
						);
					}

					return ResponseSuccess(res);
				}

				if (!tag && !isaudio) return ResponseSuccess(res);

				if (clientData?.Client?.enableChatBot == true) {
					[err, botMessages] = await to(
						Bot_message.findAll({
							where: {
								status: true,
								number: data.waNumber,
								tag: tag,
							},
							order: [['id', 'DESC']],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					// console.log('------botMessages-------', botMessages.length);

					if (botMessages.length === 0) {
						////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						// Add Check as per Project environment
						if (
							clientData?.Client &&
							clientData?.Client?.enableChatBot == true &&
							clientData?.Client?.ClientAgentMappings &&
							clientData?.Client?.ClientAgentMappings?.length > 0 &&
							tag
						) {
							checkAndSendMsgFromAIAssistant(
								data.mobile,
								userData,
								tag,
								clientData.ClientId,
								data.waNumber,
								incommingMessageLog,
								url,
								isaudio
							);
						} else {
							// Check For The Default WhatsApp Message
							console.log('-------Check and Send Default WhatsApp Message 1--------');
							const details = await checkForDefaultWhatsAppMessage(clientData, userData, appBranding);
							console.log('-------Check and Send Default WhatsApp Message 2--------', details);
							let messageId_ = null;
							if (details?.messages?.length > 0) {
								messageId_ = details.messages[0].id;
								isMeta = true;
							} else if (response?.data?.response?.id) {
								messageId_ = details.response.id;
							}
							if (details) {
								[err, defaultwhatsAppReply] = await to(
									Bot_send_msg.create({
										messageId: messageId_,
										UserId: userData.id,
										type: 'sent',
										data: null,
										PostId: null,
										msgType: 'default reply',
										ClientId: clientData && clientData.ClientId ? clientData.ClientId : null,
										url,
										status: null,
										cause: null,
										deliveryCode: null,
										channel: null,
										sentDate: null,
										deliveryDate: null,
										readDate: null,
										failDate: null,
										errorMessage: null,
									})
								);
							}
						}
						return ResponseSuccess(res);
					}

					if (botMessages.length === 1) {
						let botdata = botMessages[0];
						if (botdata.startIngId) {
							[err, botMessages] = await to(Bot_message.findOne({ where: { id: botdata.startIngId } }));
							if (err) return ResponseError(res, err, 500, true);
							if (botMessages) {
								botdata = botMessages;
							}
						}
						if (['location', 'contact'].indexOf(botdata.type) > -1) {
							await sendLocationAndContactOnWhatsAppMessage(botdata, data.mobile, userData.id);
						} else if (botdata.isDripFlow) {
							await sendDripFlow(botdata, userData, clientData.ClientId);
						} else if (botdata.isDrip) {
							await sendDrip(botdata, data, userData, clientData.ClientId);
						} else if (!botdata.option || botdata.option === '' || botdata.option === null) {
							await sendWhatsAppOnlyTextMessage(botdata, data.mobile, userData.id, clientData.ClientId);
						} else {
							await sendWhatsAppMessage(botdata, data.mobile, userData.id);
						}
					} else {
						if (clientData && clientData.ClientId) {
							for (let bot of botMessages) {
								console.log('-----bot---', bot.convertToJSON());
								bot = bot.convertToJSON();

								if (bot.startIngId) {
									[err, botMessage] = await to(Bot_message.findOne({ where: { id: bot.startIngId } }));
									if (err) return ResponseError(res, err, 500, true);
									if (botMessage) {
										bot = botMessage.convertToJSON();
									}
								}

								if ((!bot.ClientId || bot.ClientId === clientData.ClientId) && (!bot.lastQuestion || id === bot.id)) {
									if (['location', 'contact'].indexOf(botMessages[0].type) > -1) {
										await sendLocationAndContactOnWhatsAppMessage(botMessages[0], data.mobile, userData.id);
									} else if (botMessages[0].isDripFlow) {
										await sendDripFlow(botMessages[0], userData, clientData.ClientId);
									} else if (bot.isDrip) {
										await sendDrip(bot, data, userData, clientData.ClientId);
									} else if (!bot.option || bot.option === '' || bot.option === null) {
										await sendWhatsAppOnlyTextMessage(bot, data.mobile, userData.id, clientData.ClientId);
									} else {
										await sendWhatsAppMessage(bot, data.mobile, userData.id);
									}
									break;
								}
							}
						}
					}
					return ResponseSuccess(res);
				} else {
					// Check For The Default WhatsApp Message
					console.log('-------Check and Send Default WhatsApp Message 3--------');
					const details = await checkForDefaultWhatsAppMessage(clientData, userData, appBranding);
					console.log('-------Check and Send Default WhatsApp Message 4--------', details);
					let messageId_ = null;
					if (details?.messages?.length > 0) {
						messageId_ = details.messages[0].id;
						isMeta = true;
					} else if (response?.data?.response?.id) {
						messageId_ = details.response.id;
					}
					if (details) {
						[err, defaultwhatsAppReply] = await to(
							Bot_send_msg.create({
								messageId: messageId_,
								UserId: userData.id,
								type: 'sent',
								data: null,
								PostId: null,
								msgType: 'default reply',
								ClientId: clientData && clientData.ClientId ? clientData.ClientId : null,
								url,
								status: null,
								cause: null,
								deliveryCode: null,
								channel: null,
								sentDate: null,
								deliveryDate: null,
								readDate: null,
								failDate: null,
								errorMessage: null,
							})
						);
					}
				}
				return ResponseSuccess(res);
			}
		}
		return ResponseSuccess(res);
	} catch (error) {
		console.log('---Error ---whatsAppReplayStatus--', error);
	}
};
module.exports.whatsAppReplayStatus = whatsAppReplayStatus;

////////////////////////////////////////////////////////////////////////////////
//------------------User OPT-OUT functions Start -----------------------------//
const userOptOutMethod = async function (clientData, userData, tag) {
	try {
		console.log('<<<---OPTOUT---Inside-function--->>>');
		let keywordsArray = [];
		let custkeywords_;
		let clientWhatsAppSetup;

		let appBranding = await getClientAppBrandingByClientId(clientData.ClientId);
		if (appBranding && appBranding.sendoptinconfm && appBranding.custkeywords) {
			console.log('<<<<<<<<,--------sendoptinconfm---->>>>>>>>>.', appBranding.sendoptinconfm);
			console.log('<<<<<<<<,--------optoutconfmdrip---->>>>>>>>>.', appBranding.optoutconfmdrip);
			custkeywords_ = appBranding.custkeywords;
			keywordsArray = custkeywords_.split(',').map((keyword) => keyword.trim().toLowerCase());
			console.log('<<<<<<<<<<<---keywordsArray---->>>>>>>>>.', keywordsArray);
			if (keywordsArray.indexOf(tag) > -1) {
				console.log('<<<<<,,,,...KeyWords match.....>>>>>');

				[err, clientWhatsAppSetup] = await to(
					ClientWhatsAppSetup.findOne({
						where: {
							ClientId: clientData.ClientId,
						},
						include: [
							{
								model: WhatsAppSetup,
								where: {
									status: 'Active',
								},
								attributes: ['id', 'user_id', 'password', 'isMeta', 'MTPNoId', 'MTToken'],
							},
						],
						attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
					})
				);

				if (err) return ResponseError(res, err, 500, true);

				if (appBranding.sendoptoutconfm && appBranding.optoutconfmdrip) {
					[err, postDetails] = await to(
						Post.findOne({
							where: {
								id: appBranding.optoutconfmdrip,
							},
							include: [
								{
									model: Drip_whatsapp_native,
								},
							],
						})
					);
					let dripData = postDetails.convertToJSON();
					drip_details = dripData.Drip_whatsapp_natives;
					if (err) return ResponseError(res, err, 500, true);

					// console.log('<<<<<<<<,----drip_details---->>>>>>>>>.', drip_details);

					await sendWhatsAppdripToNewContact(clientWhatsAppSetup.WhatsAppSetup, userData.phone, drip_details[0]);
				}

				await updateUserOptOutStatus(userData.id);
				return [true, appBranding];
			} else {
				console.log('<<<<<<<<....KeyWords not match...>>>>>');
				return [false, appBranding];
			}
		}

		return [false, appBranding];
	} catch (error) {
		console.log('-update User Error Opt Out Status--', error);
		return;
	}
};

//////////////////////////////////////Check and Send WhatsApp default Message ////////////////////////////////////////
const checkForDefaultWhatsAppMessage = async function (clientData, userData, appBranding) {
	try {
		// console.log('<<<---Check and Send WhatsApp Default Reply---Inside-function--->>>', appBranding);
		let clientWhatsAppSetup;
		let postDetails;
		// let appBranding = await getClientAppBrandingByClientId(clientData.ClientId);
		if (appBranding && appBranding?.setDefaultReply && appBranding?.dripIdForDefaultReply) {
			// console.log('<<<<<<<<,--------dripIdForDefaultReply---->>>>>>>>>.', appBranding.dripIdForDefaultReply);
			// console.log('<<<<<<<<,--------setDefaultReply---->>>>>>>>>.', appBranding.setDefaultReply);

			[err, clientWhatsAppSetup] = await to(
				ClientWhatsAppSetup.findOne({
					where: {
						ClientId: clientData.ClientId,
					},
					include: [
						{
							model: WhatsAppSetup,
							where: {
								status: 'Active',
							},
							attributes: ['id', 'user_id', 'password', 'isMeta', 'MTPNoId', 'MTToken'],
						},
					],
					attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
				})
			);
			if (err) {
				console.log('--clientWhatsAppSetup-checkForDefaultWhatsAppMessage---', err);
			}
			// if (err) return ResponseError(res, err, 500, true);

			[err, postDetails] = await to(
				Post.findOne({
					where: {
						id: appBranding.dripIdForDefaultReply,
					},
					include: [
						{
							model: Drip_whatsapp_native,
						},
					],
				})
			);

			if (postDetails && postDetails?.Drip_whatsapp_natives) {
				let dripData = postDetails.convertToJSON();
				drip_details = dripData.Drip_whatsapp_natives;
				if (err) return ResponseError(res, err, 500, true);

				console.log('<<<<<<<<,----drip_details---->>>>>>>>>.', drip_details);

				//For Header Text
				if (drip_details[0].header_text) {
					if (clientWhatsAppSetup?.WhatsAppSetup?.isMeta == false) {
						drip_details[0].header_text = await CheckAndUpdateWhatsAppVariableWithUSerData(
							drip_details[0].header_text,
							userData,
							false
						);
					} else if (clientWhatsAppSetup?.WhatsAppSetup?.isMeta == true) {
						drip_details[0].header_text_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
							drip_details[0].header_text,
							userData,
							false
						);
					}
				}

				// For Message Body
				if (drip_details[0].body) {
					if (clientWhatsAppSetup?.WhatsAppSetup?.isMeta == false) {
						drip_details[0].body = await CheckAndUpdateWhatsAppVariableWithUSerData(
							drip_details[0].body,
							userData,
							false
						);
					} else if (clientWhatsAppSetup?.WhatsAppSetup?.isMeta == true) {
						drip_details[0].body_parameters = await CheckAndUpdateMeta_WhatsAppUserVariables(
							drip_details[0].body,
							userOtherData,
							false
						);
					}
				}

				return await sendWhatsAppdripToNewContact(clientWhatsAppSetup.WhatsAppSetup, userData.phone, drip_details[0]);
			} else {
				console.log('--Check and Send WhatsApp Default Reply----Valid Drip Not Found----');
				return false;
			}
		}
		return false;
	} catch (error) {
		console.log('----Check and Send WhatsApp Default Reply------update User Error Opt Out Status--', error);
		return false;
	}
};

const sendWhatsAppResponsedripToNewContact = async function (
	whatsAppSetupUserId,
	whatsAppSetupPassword,
	userPhones,
	drip_details
) {
	try {
		let params = {
			userid: whatsAppSetupUserId,
			password: whatsAppSetupPassword,
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
		} else if (drip_details.header_type == 'Text') {
			params.method = 'SENDMESSAGE';
			params.msg = drip_details.body;
			params.header = drip_details.header_text;
			params.isTemplate = true;
			params.msg_type = 'TEXT';
		} else if (drip_details.header_type == 'None') {
			params.method = 'SENDMESSAGE';
			params.msg = drip_details.body;
			// params.isTemplate = true;
			params.msg_type = 'TEXT';
		}

		if (drip_details.footer != null && drip_details.footer != '') {
			params.footer = drip_details.footer;
			params.isTemplate = true;
		}

		if (drip_details.interaction) {
			params.isTemplate = true;
		}

		params.send_to = userPhones.toString();
		console.log(
			'----Url-- WhatsApp-Native--',
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
		console.log(new Date(), 'Error --->>>>Response Drip Sent To New Contacts --->>>-->>>  Only WhatsApp', error);
		return error;
	}
};

const updateUserOptOutStatus = async function (userIds) {
	try {
		[err, updateUser] = await to(
			User.update(
				{
					opt_in: false,
					opt_out: true,
				},
				{
					where: {
						id: userIds,
					},
				}
			)
		);
		if (err) console.log('---Error Update User opt out Status--', err);
		return;
	} catch (error) {
		console.log('---Error Update User Opt out Status---', error);
		return;
	}
};

//------------------User OPT-OUT functions end -----------------------------//
//////////////////////////////////////////////////////////////////////////////

const sendWhatsAppOnlyTextMessage = async function (botData, userMobile, userId, ClientId) {
	try {
		//WhatsApp Setup;
		[err, getWhatsAppSetup] = await to(
			ClientWhatsAppSetup.findOne({
				where: {
					ClientId: ClientId,
					forDrip: true,
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['user_id', 'password', 'isMeta', 'MTPNoId', 'MTToken'],
						required: true,
					},
				],
			})
		);
		if (err) {
			console.log('----Error---When Get WhatsSetup Details in bot--', err);
			return;
		}

		if (getWhatsAppSetup?.WhatsAppSetup?.isMeta == false) {
			let params = {
				userid: getWhatsAppSetup.WhatsAppSetup.user_id,
				password: getWhatsAppSetup.WhatsAppSetup.password,
				v: `1.1`,
				auth_scheme: `plain`,
				method: 'SendMessage',
				send_to: userMobile,
				msg: botData.msg ? botData.msg : '',
				msg_type: 'DATA_TEXT',
				format: 'JSON',
				data_encoding: 'text',
			};

			console.log(
				'----Url--WhatsApp-Non-Native--',
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);

			try {
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);
			} catch (error) {
				console.log('----Error when Sending WhatsApp Message by using WhatsApp Api---', error);
				return false;
			}

			await to(
				Bot_send_msg.create({
					// messageId: res.id,
					UserId: userId,
					type: 'sent',
					data: botData.msg ? botData.msg : null,
					PostId: null,
					msgType: botData.type,
					ClientId: ClientId,
					url: null,
					status: null,
					cause: null,
					deliveryCode: null,
					channel: null,
					sentDate: null,
					deliveryDate: null,
					readDate: null,
					failDate: null,
					errorMessage: null,
				})
			);
			return;
		} else if (getWhatsAppSetup?.WhatsAppSetup?.isMeta == true) {
			const headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${getWhatsAppSetup.WhatsAppSetup.MTToken}`,
			};
			const payload = {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: `${userMobile}`,
				type: 'text',
				text: {
					preview_url: false,
					body: `${botData.msg ? botData.msg : null}`,
				},
			};
			const url = `https://graph.facebook.com/v23.0/${getWhatsAppSetup.WhatsAppSetup.MTPNoId}/messages`;
			try {
				const response = await axios.post(url, payload, { headers });
				console.log('--sendWhatsAppMessage-Meta Response--', response);
				if (response.data.messages.length > 0 && response.data.messages[0].id) {
					await to(
						Bot_send_msg.create({
							messageId: response.data.messages[0].id,
							UserId: userId,
							type: 'sent',
							data: botData.msg ? botData.msg : null,
							PostId: null,
							msgType: botData.type,
							ClientId: ClientId,
							url: null,
							status: null,
							cause: null,
							deliveryCode: null,
							channel: null,
							sentDate: null,
							deliveryDate: null,
							readDate: null,
							failDate: null,
							errorMessage: null,
							isMeta: true,
						})
					);
				}
				return;
			} catch (error) {
				console.log('-----Error-----sendWhatsAppMessage---', error);
				return false;
			}
		}
	} catch (error) {
		console.log('---error in Send WhatsApp Only Text Message---', error);
		return;
	}
};
module.exports.sendWhatsAppOnlyTextMessage = sendWhatsAppOnlyTextMessage;

const sendWhatsAppMessage = async function (data, phone, userId) {
	try {
		[err, botMessages] = await to(
			Bot_message.findAll({
				where: {
					lastQuestion: data.id,
				},
			})
		);
		if (err) return;
		[err, clientData] = await to(
			User_role_client_mapping.findOne({
				where: {
					RoleId: 1,
					UserId: userId,
				},
				attributes: ['ClientId'],
			})
		);
		if (err) return;
		let option = data.option;
		console.log('------botMessages----', botMessages.length);

		if (option) {
			if (botMessages.length > 0) {
				let optionDetals = JSON.parse(option);
				let optionData = optionDetals;
				if (data.type === 'list') {
					optionData = optionData.sections[0].rows;
				} else if (data.type === 'dr_button') {
					optionData = optionData.buttons;
				}
				for (let msg of optionData) {
					if (data.type === 'list') {
						let count = 0;
						let msgArray = [];
						for (let value of botMessages) {
							if (value.tag === msg.title.toLowerCase()) {
								count++;
								msgArray.push(value);
							}
						}
						if (count > 0) {
							if (count === 1) {
								msg.id = msgArray[0].id + '';
							} else {
								for (let value of msgArray) {
									if (value.ClientId === clientData.ClientId) msg.id = value.id + '';
								}
							}
						}
					} else if (data.type === 'dr_button') {
						let count = 0;
						let msgArray = [];
						for (let value of botMessages) {
							if (value.tag === msg.reply.title.toLowerCase()) {
								count++;
								msgArray.push(value);
							}
						}
						if (count > 0) {
							if (count === 1) {
								msg.reply.id = msgArray[0].id + '';
							} else {
								for (let value of msgArray) {
									if (value.ClientId === clientData.ClientId) msg.reply.id = value.id + '';
								}
							}
						}
					}
				}

				if (data.type === 'list') {
					optionDetals.sections[0].rows = optionData;
				} else if (data.type === 'dr_button') {
					optionDetals.buttons = optionData;
				}
				option = JSON.stringify(optionDetals);
			}

			console.log('---Option--', option);

			[err, getWhatsAppSetup] = await to(
				ClientWhatsAppSetup.findOne({
					where: {
						ClientId: clientData.ClientId,
						forDrip: true,
					},
					include: [
						{
							model: WhatsAppSetup,
							where: {
								status: 'Active',
							},
							required: true,
						},
					],
				})
			);
			if (err) return;

			if (getWhatsAppSetup?.WhatsAppSetup?.id && getWhatsAppSetup?.WhatsAppSetup?.isMeta == false) {
				let params = {
					userid: getWhatsAppSetup.WhatsAppSetup.user_id,
					password: getWhatsAppSetup.WhatsAppSetup.password,
					v: `1.1`,
					auth_scheme: `plain`,
					method: 'SendMessage',
					send_to: phone,
					msg: data.msg ? data.msg : '',
					action: option,
					interactive_type: data.type,
					msg_type: 'text',
					format: 'JSON',
					header: data.header ? data.header : '',
					data_encoding: 'Text',
				};
				console.log(
					'----Url--WhatsApp-Non-Native--',
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);
				try {
					const response = await axios.get(
						`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
					);
					if (response && response.data) {
						let res = response.data.response;
						if (res.status === 'success') {
							if (data.option) {
								let optionDetails = [];
								let optionData = [];
								let msgType = '';
								if (data.type === 'list') {
									msgType = 'interactive';
									optionData = JSON.parse(data.option).sections[0].rows;
									for (let value of optionData) {
										optionDetails.push(value.title);
									}
								} else if (data.type === 'dr_button') {
									msgType = 'button';
									optionData = JSON.parse(data.option).buttons;
									for (let value of optionData) {
										optionDetails.push(value.reply.title);
									}
								}
								await to(
									Bot_send_msg.create({
										messageId: res.id,
										UserId: userId,
										type: 'sent',
										data: optionDetails.length > 0 ? JSON.stringify(optionDetails) : null,
										PostId: null,
										msgType,
										ClientId: clientData.ClientId,
										url: null,
										status: null,
										cause: null,
										deliveryCode: null,
										channel: null,
										sentDate: null,
										deliveryDate: null,
										readDate: null,
										failDate: null,
										errorMessage: null,
									})
								);
							}
						}
					}
					return;
				} catch (error) {
					return;
				}
			} else if (getWhatsAppSetup?.WhatsAppSetup?.id && getWhatsAppSetup?.WhatsAppSetup?.isMeta == true) {
				const headers = {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${getWhatsAppSetup.WhatsAppSetup.MTToken}`,
				};
				const payload = {
					messaging_product: 'whatsapp',
					recipient_type: 'individual',
					to: `${phone}`,
					type: 'interactive',
					interactive: {
						type: 'list',
						header: {
							type: 'text',
							text: `${data.header ? data.header : ''}`,
						},
						body: {
							text: `${data.msg ? data.msg : ''}`,
						},
						action: option,
					},
				};
				console.log('----payload---', payload);
				const url = `https://graph.facebook.com/v23.0/${getWhatsAppSetup.WhatsAppSetup.MTPNoId}/messages`;
				try {
					const response = await axios.post(url, payload, { headers });
					console.log('--sendWhatsAppMessage-Meta Response--', response);
					if (response.data.messages.length > 0 && response.data.messages[0].id) {
						if (data.option) {
							let optionDetails = [];
							let optionData = [];
							let msgType = '';
							if (data.type === 'list') {
								msgType = 'interactive';
								optionData = JSON.parse(data.option).sections[0].rows;
								for (let value of optionData) {
									optionDetails.push(value.title);
								}
							} else if (data.type === 'dr_button') {
								msgType = 'button';
								optionData = JSON.parse(data.option).buttons;
								for (let value of optionData) {
									optionDetails.push(value.reply.title);
								}
							}
							await to(
								Bot_send_msg.create({
									messageId: response.data.messages[0].id,
									UserId: userId,
									type: 'sent',
									data: optionDetails.length > 0 ? JSON.stringify(optionDetails) : null,
									PostId: null,
									msgType,
									ClientId: clientData.ClientId,
									url: null,
									status: null,
									cause: null,
									deliveryCode: null,
									channel: null,
									sentDate: null,
									deliveryDate: null,
									readDate: null,
									failDate: null,
									errorMessage: null,
									isMeta: true,
								})
							);
						}
					}
					return;
				} catch (error) {
					console.log('-----Error-----sendWhatsAppMessage---', error);
					return false;
				}
			}
		}
		return;
	} catch (error) {
		console.log(new Date(), 'Error --->>>>sendWhatsAppMessage --->>>-->>>', error);
		return;
	}
};
module.exports.sendWhatsAppMessage = sendWhatsAppMessage;

// Send WhatsApp Native drip
const sendWhatsAppNativeDripNew = async function (userPhones, drip_details) {
	try {
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

		params.send_to = userPhones;
		params.isHSM = false;
		params.auth_scheme = 'plain';
		console.log(
			'----Url-- WhatsApp-Native--',
			`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
		);

		try {
			const response = await axios.get(
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);
			return response.data;
		} catch (error) {
			return false;
		}
	} catch (error) {
		console.log(new Date(), 'Error --->>>>webhook --->>>-->>>  Only WhatsApp', error);
		return null;
	}
};
module.exports.sendWhatsAppNativeDripNew = sendWhatsAppNativeDripNew;

// Send WhatsApp Non Native drip
const sendWhatsAppNonNativeDripNew = async function (userPhones, drip_details) {
	try {
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

		params.send_to = userPhones;
		params.isHSM = false;
		params.auth_scheme = 'plain';
		console.log(
			'----Url--WhatsApp-Non-Native--',
			`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
		);
		try {
			const response = await axios.get(
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);
			return response.data;
		} catch (error) {
			return false;
		}
	} catch (error) {
		console.log(new Date(), 'Error --->>>>webhook --->>>-->>>  Only WhatsApp', error);
		return null;
	}
};
module.exports.sendWhatsAppNonNativeDripNew = sendWhatsAppNonNativeDripNew;

const readBotMessageExcel = async function (environment_) {
	console.log('start..........');
	let filename;
	if (environment_ == 'dev') {
		filename = 'C:/Drip_Diwo_Workspace/Testing Upgrand Project/api/public/Bot_Query_Sheet_Dev.xlsx';
		//For TEST
		// filename = 'C:/Drip_Diwo_Workspace/Testing Upgrand Project/api/public/Bot_Query_Testing_branch_Sheet_Dev_test.xlsx';
	} else if (environment_ == 'staging') {
		filename = 'C:/Drip_Diwo_Workspace/Testing Upgrand Project/api/public/Bot_Query_Sheet_Staging.xlsx';
	} else if (environment_ == 'prod') {
		filename = 'C:/Drip_Diwo_Workspace/Testing Upgrand Project/api/public/Bot_Query_Sheet_Production.xlsx';
		//For Test
		// filename =
		// 	'C:/Drip_Diwo_Workspace/Testing Upgrand Project/api/public/Bot_Query_Testing_branch_Sheet_Prod_test.xlsx';
	}
	exceltojson = xlsxtojson;
	try {
		let workbook = new Excel.Workbook();
		let fontStyle = workbook.createStyle({
			font: {
				color: '#000000',
				size: 12,
			},
		});
		let worksheet = workbook.addWorksheet('Query');
		let cellData = '';
		let count = 1;
		let queryList = [];
		exceltojson(
			{
				input: filename,
				output: null,
				lowerCaseHeaders: true,
			},
			async function (err, rows) {
				if (err) return;
				for (let row of rows) {
					let id = row.id;
					let msg = row.msg ? "'" + row.msg + "'" : null;
					let header = row.header ? "'" + row.header + "'" : null;
					let type = row.type;
					let number = row.number;
					let option = '';
					let tag = row.tag.toLowerCase();
					let isDrip = row.isdrip ? row.isdrip : false;
					// let isDripflow = row.isdripflow ? row.isdripflow : null;
					let isDripflow = false;
					let userTag = row.usertag ? "'" + row.usertag + "'" : null;
					let ClientId = row.clientid ? row.clientid : null;
					// let ClientId = null;
					let PostId = row.postid ? row.postid : null;
					// let PostId = null;
					let lastQuestion = row.lastquestion ? row.lastquestion : null;
					let startIngId = row.startingid ? row.startingid : null;
					if (row.option && type !== 'location') {
						let optionData = JSON.parse(row.option);
						let optionDetals = [];
						if (type === 'list') {
							for (let data in optionData) {
								optionDetals.push({ id: `id${data + 1}`, title: optionData[data], description: '' });
							}
						} else if (type === 'dr_button') {
							for (let data in optionData) {
								optionDetals.push({ type: 'reply', reply: { id: `id${data + 1}`, title: optionData[data] } });
							}
						}
						if (type === 'list') {
							option = {
								button: 'List',
								sections: [
									{
										rows: optionDetals,
									},
								],
							};
						} else if (type === 'dr_button') {
							option = {
								buttons: optionDetals,
							};
						}
						option = JSON.stringify(option);
					} else if (type === 'location') {
						option = row.option;
					}
					let query = `INSERT INTO "Bot_messages" (id, msg, header, type, number, option, tag, "isDrip", "ClientId", status, "createdAt", "updatedAt", "PostId", "lastQuestion","isDripFlow","tagForContact", "startIngId") VALUES (${id}, ${msg}, ${header}, '${type}', '${number}', '${option}', '${tag}', ${isDrip}, ${ClientId}, true, '2023-10-16 06:17:22.521000 +00:00', '2023-10-16 06:17:22.521000 +00:00', ${PostId}, ${lastQuestion}, ${isDripflow},'${userTag}',${startIngId});`;
					cellData = cellData + query + '\n';
					count++;
					// if (count === 50) {
					queryList.push(cellData);
					// count = 1;
					cellData = '';
					// }
				}
				if (cellData) queryList.push(cellData);
				let line = 1;
				for (let data of queryList) {
					worksheet.cell(line, 1).string(data).style(fontStyle);
					line++;
				}
				let fileName = 'D:/queryFile_PROD.xlsx';
				if (environment_ == 'dev') {
					fileName = 'D:/queryFile_DEV.xlsx';
				} else if (environment_ == 'staging') {
					fileName = 'D:/queryFile_STAGING.xlsx';
				}
				workbook.write(fileName, (err, stats) => {
					if (err) {
						return console.log('Error caught in Youtube checker ', err);
					}
				});
				console.log('end..........');
			}
		);
		return;
	} catch (error) {
		console.log('readBotMessageExcel error..........', error);
		return;
	}
};
module.exports.readBotMessageExcel = readBotMessageExcel;

// readBotMessageExcel('prod');

let deleteWebhookData = schedule.scheduleJob('0 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>>  Delete Webhook Data', fireDate);
	deleteWhatsAppAndEmailWebhookData();
});
module.exports.deleteWebhookData = deleteWebhookData;

const deleteWhatsAppAndEmailWebhookData = async function () {
	try {
		let threeDaysBeforeData = moment().subtract(3, 'days');

		if (config_feature?.configurable_feature?.whatsApp) {
			[err, deleteWhatsAppWebhookData] = await to(
				WhatsAppDeliveryStatus.destroy({
					where: {
						// isProcessed: true,
						createdAt: {
							[Op.lte]: threeDaysBeforeData,
						},
					},
				})
			);
			if (err) console.log('---delete WhatsApp Webhook Data error---', err);
		}

		//Destory Email Webhook Data
		[err, deleteEmailAppWebhookData] = await to(
			EmailDeliveryStatus.destroy({
				where: {
					// isProcessed: true,
					createdAt: {
						[Op.lte]: threeDaysBeforeData,
					},
				},
			})
		);
		if (err) console.log('---delete Email Webhook Data error---', err);
	} catch (error) {
		console.log('--error--', error);
	}
};

// Run BroadSide Email Status Report Scheduler every day at 11:30PM
if (config_feature?.configurable_feature?.broadside) {
	let broadside_message_email_schedulor = schedule.scheduleJob(
		CONFIG.broadside_email_schedulor_config,
		async function (fireDate) {
			console.log(
				'Run Scheduler --->>>-->>>-<<<<<<<<<<<---Broadside Email Status Report schedulor--->>>>---',
				fireDate
			);
			await updateBroadSideEmailDeliveryStatus();
		}
	);
	module.exports.broadside_message_email_schedulor = broadside_message_email_schedulor;
}

const updateBroadSideEmailDeliveryStatus = async function () {
	try {
		const url = `https://reports2.in.broadside.co/api/report`;

		let sDate = moment().subtract(2, 'days').startOf('day');
		let eDate = moment().endOf('day');

		const startDate = sDate.format('YYYY-MM-DDTHH:mm:ss[Z]');
		const endDate = eDate.format('YYYY-MM-DDTHH:mm:ss[Z]');

		console.log('Start of Yesterday:', startDate);
		console.log('End of Yesterday:', endDate);

		let payload = {
			params: {
				otype: 'json',
				nrec: 4999,
			},
			data: {
				bml_app: '140',
				bml_dispatchedat: `[${startDate} TO ${endDate}]`,
			},
		};

		const config = {
			headers: {
				Authorization: `Bearer ${CONFIG.broadside_email_report_api_token}`,
				'Content-Type': 'application/json',
			},
		};
		console.log('-----BroadSide Report url----', url);
		let response = await axios.post(url, payload, config);
		console.log('----Broadside Report response data----', response.data);

		if (
			response &&
			response.data &&
			response.data.response &&
			response.data.response.docs &&
			response.data.response.docs.length > 0
		) {
			//Update Status
			for (let data of response.data.response.docs) {
				let emailWebHook = data;
				let payload = {
					status: null,
					sentDate: null,
					deliveryDate: null,
					failDate: null,
					clickDate: null,
					errorMessage: null,
				};

				if (emailWebHook.bml_dispatchedat) {
					payload.status = 'Sent';
					const originalTime = moment.utc(emailWebHook.bml_dispatchedat);
					const UTC_Time = originalTime.subtract(5, 'hours').subtract(30, 'minutes');
					payload.sentDate = UTC_Time.format();
				}

				if (emailWebHook.bml_sentat) {
					payload.status = 'Delivered';
					const originalTime = moment.utc(emailWebHook.bml_sentat);
					const UTC_Time = originalTime.subtract(5, 'hours').subtract(30, 'minutes');
					payload.deliveryDate = UTC_Time.format();
				}

				if (emailWebHook.broadside_viewedat_dts) {
					payload.status = 'Read';
					const originalTime = moment.utc(emailWebHook.broadside_viewedat_dts[0]);
					const UTC_Time = originalTime.subtract(5, 'hours').subtract(30, 'minutes');
					payload.readDate = UTC_Time.format();
				}

				if (emailWebHook.broadside_clickthruat_dts) {
					payload.status = 'Click';
					const originalTime = moment.utc(emailWebHook.broadside_clickthruat_dts[0]);
					const UTC_Time = originalTime.subtract(5, 'hours').subtract(30, 'minutes');
					payload.clickDate = UTC_Time.format();
					payload.errorMessage = emailWebHook && emailWebHook.bml_bouncedwhy ? emailWebHook.bml_bouncedwhy : null;
				}

				if (emailWebHook.bml_boncedat) {
					payload.status = 'Failed';
					const originalTime = moment.utc(emailWebHook.bml_boncedat);
					const UTC_Time = originalTime.subtract(5, 'hours').subtract(30, 'minutes');
					payload.failDate = UTC_Time.format();

					if (emailWebHook.bml_status.toLowerCase() == 'bounced') {
						payload.errorMessage = emailWebHook && emailWebHook.bml_bouncedwhy ? emailWebHook.bml_bouncedwhy : null;
					} else if (emailWebHook.bml_status.toLowerCase() == 'rejected') {
						payload.errorMessage = emailWebHook && emailWebHook.bml_rejerrdesc ? emailWebHook.bml_rejerrdesc : null;
					} else if (emailWebHook.bml_status.toLowerCase() == 'skipped') {
						payload.errorMessage = emailWebHook && emailWebHook.bml_rejerrdesc ? emailWebHook.bml_rejerrdesc : null;
					}

					if (emailWebHook.bml_status) {
						console.log('--email broadside status--', emailWebHook.bml_status);
					}
				}

				if (payload.sentDate) {
					payload.status = 'Sent';
					payload.cause = 'Sent';
				}

				if (payload.deliveryDate) {
					payload.status = 'Delivered';
					payload.cause = 'Success';
				}
				if (payload.readDate) {
					payload.status = 'Read';
					payload.cause = 'Read';
				}

				if (payload.clickDate) {
					payload.status = 'Click';
					payload.cause = 'Click';
				}

				if (payload.failDate) {
					payload.status = 'Failed';
					payload.cause = 'Failed';
				}

				if (emailWebHook.adt_tx_id) {
					[err, updateStatus] = await to(
						CampWhatsAppEmailDrip.update(payload, {
							where: {
								EmailTriggerId: emailWebHook.adt_tx_id,
							},
						})
					);
					if (err) console.log('----Error at Update Status BroadSide Email Status in CampWhatsAppEmailDrip', err);

					if (payload.status === 'Read') {
						[err, post] = await to(
							CampWhatsAppEmailDrip.findOne({
								where: {
									EmailTriggerId: emailWebHook.adt_tx_id,
								},
								attributes: ['id', 'AssignedPostToUserId', 'CampaignId', 'DripCampIndex', 'UserId'],
							})
						);
						if (err) console.log('----Error at Update Status CampWhatsAppEmailDrip 2', err);
						if (post) actionByLearner(post.UserId, post.CampaignId, post.DripCampIndex, 'Read on channel', null);
					}
				}
			}
		}
		return;
	} catch (error) {
		console.log('---Error ---update BroadSide Email Delivery Status----', error);
	}
};

// Update WhatsApp Template Status, Update Template Qulaity, Phone Number Messaging Limit Update, Template Category Update
const updateWhatsAppTemplateDetails = async function (req, res) {
	try {
		// console.log('-----req---req--req----', req.body);
		if (req?.body?.length > 0) {
			getActionAsPerEvent(req.body);
			return ResponseSuccess(res);
		} else {
			return ResponseError(res, 'Invalid Request', 400, true);
		}
	} catch (error) {
		console.log('---Error---updateWhatsAppTemplateDetails--', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateWhatsAppTemplateDetails = updateWhatsAppTemplateDetails;

const getActionAsPerEvent = async function (data) {
	try {
		console.log('---Data---', data);
		for (let event of data) {
			if (event?.field == 'message_template_status_update') {
				//Update Template Status
				return updateWhatsAppTemplateDetail(event, 1);
			} else if (event?.field == 'message_template_quality_update') {
				//Update Template Quality
				return updateWhatsAppTemplateDetail(event, 2);
			} else if (event?.field == 'template_category_update' && event?.meta_proposed_category) {
				//Update Template Category
				return updateWhatsAppTemplateDetail(event, 3);
			} else if (event?.field == 'phone_number_messaging_limit_update') {
				//Update Phone Number Messaging Limit
				return updatePhoneNumberMessagingLimit(event);
			}
		}
	} catch (error) {
		console.log('---Error---getActionAsPerEvent--', error);
		return false;
	}
};

const updateWhatsAppTemplateDetail = async function (templateData, type) {
	try {
		if (templateData?.message_template_id) {
			console.log('---Type--', type);

			let updatedetails;
			let updateCondition = {};
			let isWhatsAppNative = true;
			if (type == 1) {
				updatedetails = templateData?.event.toLowerCase();
				updatedetails = updatedetails.charAt(0).toUpperCase() + updatedetails.slice(1);
				updateCondition.templateStatus = updatedetails;
			} else if (type == 2) {
				updatedetails = templateData?.new_quality_score.toLowerCase();
				updateCondition.quality = updatedetails.charAt(0).toUpperCase() + updatedetails.slice(1);
			} else if (type == 3) {
				updatedetails = templateData?.meta_proposed_category.toLowerCase();
				updateCondition.tempCategory = updatedetails.charAt(0).toUpperCase() + updatedetails.slice(1);
			}

			if (!updatedetails || updatedetails == '' || updatedetails == null) {
				return false;
			}

			// [err, updateStatus] = await to(
			// 	Drip_whatsapp_native.update(updateCondition, {
			// 		where: {
			// 			templateId: templateData.message_template_id.toString(),
			// 		},
			// 	})
			// );
			// if (err) console.log('---Error at Update WhatsApp Template Details in Drip_whatsapp_native', err);

			// if (!updateStatus || updateStatus == 0) {
			// 	isWhatsAppNative = false;
			// 	[err, updateStatus] = await to(
			// 		Drip_whatsapp_non_native.update(updateCondition, {
			// 			where: {
			// 				templateId: templateData.message_template_id.toString(),
			// 			},
			// 		})
			// 	);
			// 	if (err) console.log('---Error at Update  WhatsApp Template Details in Drip_whatsapp_non_native', err);
			// }

			//If Type == 1 and updatedetails == 'Enabled' then also need to update Template Catagery.
			// if (type === 1 && updatedetails === 'Enabled') {
			// 	checkTemplateStatus(templateData.message_template_id.toString(), isWhatsAppNative);
			// }
			if (type === 1) {
				setTimeout(() => {
					checkTemplateStatus(templateData.message_template_id.toString());
				}, 10000);
			}

			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error---updateWhatsAppTemplateStatus--', error);
		return false;
	}
};

const updatePhoneNumberMessagingLimit = async function (templateData) {
	try {
		if (templateData?.waba_number && templateData?.current_limit) {
			// templateData.current_limit
			// templateData.waba_number
			[err, updateLimit] = await to(
				WhatsAppSetup.update(
					{ messageLimit: templateData.current_limit },
					{
						where: {
							waNumber: templateData.waba_number,
						},
					}
				)
			);
			if (err) console.log('---Error at Update Phone Number Messaging Limit in WhatsAppSetup', err);
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error---updateWhatsAppTemplateQuality--', error);
		return false;
	}
};

//get all chats data
const getAllChatsData = async function (req, res) {
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

		let err, chatsData;
		let parentClientId = clientId;
		let whereCondition;
		let finalChatList = [];
		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let offset = (parseInt(page) - 1) * limit;
		// let limit = req.query.limit;

		let latestCreatedAtSubquery;
		let id = [];

		// let query = `SELECT *
		// 			FROM (
		// 				SELECT DISTINCT ON ("Bot_send_msg"."UserId")
		// 					"Bot_send_msg".*, "Users"."id" AS "UserId"
		// 				FROM "Bot_send_msgs" AS "Bot_send_msg"
		// 				JOIN "Users" ON "Users"."id" = "Bot_send_msg"."UserId"
		// 				WHERE "Bot_send_msg"."ClientId" IN (${allChildClientList.toString()})
		// 				AND "Bot_send_msg"."type" = 'received'
		// 				AND "Bot_send_msg"."isQuickReply" = false
		// 				AND "Bot_send_msg"."runId" IS NULL
		// 				AND "Bot_send_msg"."threadId" IS NULL
		// 				AND "Bot_send_msg"."openAIMessageId" IS NULL
		// 				AND "Users"."status" = true
		// 				AND "Users"."is_deleted" = false
		// 				AND "Users"."forDrip" = true
		// 				ORDER BY "Bot_send_msg"."UserId", "Bot_send_msg"."id" DESC
		// 			) AS latest_entries
		// 			ORDER BY "latest_entries"."id" DESC  -- Specify which id to order by from the Bot_send_msg
		// 			LIMIT ${limit} OFFSET ${offset};`;

		// [latestCreatedAtSubquery] = await sequelize.query(query);

		// let countQuery = `SELECT COUNT(DISTINCT "Bot_send_msg"."UserId") AS "count"
		// 					FROM "Bot_send_msgs" AS "Bot_send_msg"
		// 					JOIN "Users" ON "Users".id = "Bot_send_msg"."UserId"
		// 					WHERE "Bot_send_msg"."ClientId" IN (${allChildClientList.toString()})
		// 					AND "Bot_send_msg"."type" = 'received'
		// 					AND "Bot_send_msg"."isQuickReply" = false
		// 					AND "Bot_send_msg"."runId" IS NULL
		// 					AND "Bot_send_msg"."threadId" IS NULL
		// 					AND "Bot_send_msg"."openAIMessageId" IS NULL
		// 					AND "Users".status = true
		// 					AND "Users".is_deleted = false
		// 					AND "Users"."forDrip" = true;`;

		// [count] = await sequelize.query(countQuery);

		let query = `
			SELECT *
			FROM (
				SELECT DISTINCT ON ("Bot_send_msg"."UserId")
				"Bot_send_msg".*, "Users"."id" AS "UserId"
				FROM "Bot_send_msgs" AS "Bot_send_msg"
				JOIN "Users" ON "Users"."id" = "Bot_send_msg"."UserId"
				WHERE "Bot_send_msg"."ClientId" IN (:clientIds)
				AND "Bot_send_msg"."type" = 'received'
				AND "Bot_send_msg"."isQuickReply" = false
				AND "Bot_send_msg"."runId" IS NULL
				AND "Bot_send_msg"."threadId" IS NULL
				AND "Bot_send_msg"."openAIMessageId" IS NULL
				AND "Users"."status" = true
				AND "Users"."is_deleted" = false
				AND "Users"."forDrip" = true
				ORDER BY "Bot_send_msg"."UserId", "Bot_send_msg"."id" DESC
			) AS latest_entries
			ORDER BY "latest_entries"."id" DESC
			LIMIT :limit OFFSET :offset;
			`;

		let countQuery = `
			SELECT COUNT(DISTINCT "Bot_send_msg"."UserId") AS "count"
			FROM "Bot_send_msgs" AS "Bot_send_msg"
			JOIN "Users" ON "Users".id = "Bot_send_msg"."UserId"
			WHERE "Bot_send_msg"."ClientId" IN (:clientIds)
			AND "Bot_send_msg"."type" = 'received'
			AND "Bot_send_msg"."isQuickReply" = false
			AND "Bot_send_msg"."runId" IS NULL
			AND "Bot_send_msg"."threadId" IS NULL
			AND "Bot_send_msg"."openAIMessageId" IS NULL
			AND "Users".status = true
			AND "Users".is_deleted = false
			AND "Users"."forDrip" = true;
			`;

		// Execute queries using replacements for parameterized queries
		latestCreatedAtSubquery = await sequelize.query(query, {
			replacements: {
				clientIds: allChildClientList, // Directly using the array
				limit: limit,
				offset: offset,
			},
		});

		count = await sequelize.query(countQuery, {
			replacements: {
				clientIds: allChildClientList, // Directly using the array
			},
		});

		for (let data of latestCreatedAtSubquery[0]) {
			id.push(data.id);
		}

		[err, chatsData] = await to(
			Bot_send_msg.findAll({
				where: {
					id: id,
				},
				include: [
					{
						model: User,
						// where: {
						// 	status: true,
						// 	is_deleted: false,
						// 	forDrip: true,
						// },
						attributes: ['id', 'local_user_id'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
				],
				order: [['id', 'DESC']], // Ensure it's ordered by latest `createdAt`
				attributes: [
					'id',
					'ClientId',
					'PostId',
					'UserId',
					'type',
					'msgType',
					'data',
					'isReplied',
					'respStatus',
					'createdAt',
					'updatedAt',
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		for (let chat of chatsData) {
			let chatDetail = chat.convertToJSON();
			[err, localUser] = await to(
				dbInstance[chatDetail.User.Market.db_name].User_master.findOne({
					where: {
						id: chatDetail.User.local_user_id,
					},
					attributes: ['first', 'last', 'phone'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				chatDetail.first = localUser.first;
				chatDetail.last = localUser.last;
				chatDetail.phone = localUser.phone;
			}

			finalChatList.push(chatDetail);
		}

		return ResponseSuccess(res, {
			data: finalChatList,
			count: parseInt(count[0].count),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllChatsData = getAllChatsData;

//get Single Chat
const getSingleUserChatData = async function (req, res) {
	try {
		let err, send_receive_chats;
		let parentClientId = req.params.clientId;
		let userId = req.params.userId;
		let finalChatList = [];
		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		// Fetch received messages
		[err, send_receive_chats] = await to(
			Bot_send_msg.findAll({
				where: {
					ClientId: allChildClientList,
					UserId: userId,
					type: ['received', 'sent_reply'],
					isQuickReply: false,
					runId: {
						[Op.eq]: null,
					},
					threadId: {
						[Op.eq]: null,
					},
					openAIMessageId: {
						[Op.eq]: null,
					},
				},
				order: [['id', 'ASC']],
				attributes: ['id', 'ClientId', 'PostId', 'UserId', 'type', 'msgType', 'data', 'isReplied', 'createdAt'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// Fetch sent messages
		// [err, sentChats] = await to(
		// 	Bot_send_msg.findAll({
		// 		where: {
		// 			ClientId: allChildClientList,
		// 			UserId: userId,
		// 			type: 'sent_reply',
		// 			isQuickReply: false,
		// 		},
		// 		order: [['createdAt', 'DESC']],
		// 		attributes: ['id', 'ClientId', 'PostId', 'UserId', 'type', 'msgType', 'data', 'isReplied', 'createdAt'],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// let combinedChats = [];
		// for (let i = 0; i < receivedChats.length; i++) {
		// 	combinedChats.push(receivedChats[i]);
		// }

		// for (let i = 0; i < sentChats.length; i++) {
		// 	combinedChats.push(sentChats[i]);/
		// }

		// // Sort combinedChats by createdAt in ascending order using a for loop
		// for (let i = 0; i < combinedChats.length - 1; i++) {
		// 	for (let j = i + 1; j < combinedChats.length; j++) {
		// 		if (new Date(combinedChats[i].createdAt) > new Date(combinedChats[j].createdAt)) {
		// 			// Swap the two chat objects if they are out of order
		// 			let temp = combinedChats[i];
		// 			combinedChats[i] = combinedChats[j];
		// 			combinedChats[j] = temp;
		// 		}
		// 	}
		// }

		for (let chat of send_receive_chats) {
			let chatDetail = chat.convertToJSON();
			finalChatList.push(chatDetail);
		}

		return ResponseSuccess(res, {
			data: finalChatList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSingleUserChatData = getSingleUserChatData;

const convertSpecialChar = function (text) {
	try {
		return text.replaceAll('%', '%25').replaceAll('+', '%2B');
	} catch (error) {
		console.log('---Error Convert Special Char---', error);
	}
};

// ----------Send WhatsApp Reply Message----------------
const sendWhatsappChatReply = async function (req, res) {
	try {
		let clientId = req.params.clientId;
		let userId = req.body.UserId;
		let replyMessage = req.body.sendReplyMessage;
		let phone_number = req.body.selectedPhoneNo;
		let bot_id = req.body.bot_id;

		[err, client_WhatsAppSetup_] = await to(
			ClientWhatsAppSetup.findOne({
				where: {
					ClientId: clientId,
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'password', 'isMeta', 'MTPNoId', 'MTToken'],
					},
				],
				attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (
			client_WhatsAppSetup_?.WhatsAppSetup &&
			client_WhatsAppSetup_?.WhatsAppSetup?.user_id &&
			client_WhatsAppSetup_?.WhatsAppSetup?.isMeta == false
		) {
			let params = {
				userid: parseInt(client_WhatsAppSetup_.WhatsAppSetup.user_id),
				password: client_WhatsAppSetup_.WhatsAppSetup.password,
				send_to: phone_number,
				v: `1.1`,
				format: `json`,
				msg_type: 'DATA_TEXT',
				method: 'SENDMESSAGE',
				auth_scheme: 'Plain',
				msg: convertSpecialChar(replyMessage),
			};

			console.log(
				'<<<<<----Url-- ---WhatsApp-MESSAGE-REPLY--SEND -->>>>>>>>>>>>>>',
				`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
			);

			try {
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url}?${new URLSearchParams(params).toString()}`
				);

				if (response.data.response.status == 'success') {
					let payload = {
						isReplied: true,
						respStatus: 'Replied',
					};

					[err, updateStatus] = await to(
						Bot_send_msg.update(payload, {
							where: {
								id: bot_id,
							},
						})
					);
					if (err) console.log('----Error at update Bot send msg reply------', err);

					await to(
						Bot_send_msg.create({
							// messageId: res.id,
							UserId: userId,
							data: replyMessage ? replyMessage : null,
							PostId: null,
							// msgType,
							ClientId: clientId,
							url: null,
							status: null,
							cause: null,
							deliveryCode: null,
							channel: null,
							sentDate: null,
							deliveryDate: null,
							readDate: null,
							failDate: null,
							errorMessage: null,
							type: 'sent_reply',
						})
					);
				}

				return ResponseSuccess(res, { data: response.data });
			} catch (error) {
				return error;
			}
		} else if (
			client_WhatsAppSetup_?.WhatsAppSetup?.isMeta == true &&
			client_WhatsAppSetup_?.WhatsAppSetup?.MTPNoId &&
			client_WhatsAppSetup_?.WhatsAppSetup?.MTToken
		) {
			const headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${client_WhatsAppSetup_.WhatsAppSetup.MTToken}`,
			};
			const payload = {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: `${phone_number}`,
				type: 'text',
				text: {
					preview_url: false,
					body: convertSpecialChar(replyMessage),
				},
			};
			const url = `https://graph.facebook.com/v23.0/${client_WhatsAppSetup_.WhatsAppSetup.MTPNoId}/messages`;
			try {
				const response = await axios.post(url, payload, { headers });
				console.log('--sendWhatsAppMessage-Meta Response--', response);
				if (response.data.messages.length > 0 && response.data.messages[0].id) {
					await to(
						Bot_send_msg.create({
							messageId: response.data.messages[0].id,
							UserId: userId,
							data: replyMessage ? replyMessage : null,
							ClientId: clientId,
							url: null,
							status: null,
							cause: null,
							deliveryCode: null,
							channel: null,
							sentDate: null,
							deliveryDate: null,
							readDate: null,
							failDate: null,
							errorMessage: null,
							PostId: null,
							type: 'sent_reply',
						})
					);
				}
				return;
			} catch (error) {
				console.log('-----Error-----sendWhatsAppMessage---', error);
				return false;
			}
		} else {
			return ResponseError(res, { message: MESSAGE.DRIP_WHATSAPP_SETUP_NOT_FOUND }, 500);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.sendWhatsappChatReply = sendWhatsappChatReply;

const whatsappChatMarkAsRead = async function (req, res) {
	try {
		let clientId = req.params.clientId;
		let chatId = req.params.chatId;
		let payload = {
			respStatus: 'Read',
		};

		[err, updateStatus] = await to(
			Bot_send_msg.update(payload, {
				where: {
					id: chatId,
				},
			})
		);
		return ResponseSuccess(res);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.whatsappChatMarkAsRead = whatsappChatMarkAsRead;

const getAllSeachWhatappChats = async function (req, res) {
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

		let parentClientId = clientId;
		let finalChatList = [];
		let allChildClientList = [];
		// let type = req.user.type;
		let selectedDate = req.body.selectedDate;
		allChildClientList = await getAllSubChildClientIds(parentClientId);
		allChildClientList.push(parentClientId);

		let whereCondition = [];

		let MarketDetails;
		let userDetailId = [];
		let dateCondition = [];

		let chatsData;
		let userDetails;
		let allData = [];
		let UpdatedChatId = [];
		let finalchatsData;

		let searchKey = req.body.searchKey.split(' ');
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});

		let offset = (page - 1) * limit;

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
					if (searchKey.length > 1) {
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
									},
								},
							})
						);
					} else {
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
					}

					if (err) return ResponseError(res, err, 500, true);

					let LocalUserId = [];
					if (localUser && localUser.length > 0) {
						for (let User of localUser) {
							LocalUserId.push(User.id);
						}
					}

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

					if (UserDetail && UserDetail.length > 0) {
						for (let User of UserDetail) {
							userDetailId.push(User.id);
						}
					}
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (filterColumn.indexOf('messagepreview') > -1) {
			whereCondition.push({
				data: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('status') > -1) {
			let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
			let active = 'active';
			let inactive = 'inactive';
			// let resolved = 'resolved';

			if (active.includes(key)) {
				whereCondition.push({
					createdAt: {
						[Op.gte]: moment().subtract(24, 'hours').toDate(),
					},
				});
			} else if (inactive.includes(key)) {
				whereCondition.push({
					createdAt: {
						[Op.lt]: moment().subtract(24, 'hours').toDate(),
					},
				});
			}

			// else if (resolved.includes(key)) {
			// 	whereCondition.push({
			// 		isReplied: true,
			// 	});
			// }
		}

		if (filterColumn.indexOf('responsestatus') > -1) {
			let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
			let unread = 'unread';
			let read = 'read';

			if (read.includes(key)) {
				whereCondition.push({
					respStatus: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				});
			} else if (unread.includes(key)) {
				whereCondition.push({
					respStatus: {
						[Op.eq]: null,
					},
				});
			} else {
				whereCondition.push({
					respStatus: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				});
			}
		}

		const latestCreatedAtSubquery = await Bot_send_msg.findAll({
			attributes: ['UserId', [sequelize.fn('MAX', sequelize.col('createdAt')), 'latestCreatedAt']],
			where: {
				ClientId: allChildClientList,
				type: 'received',
				isQuickReply: false,
			},
			group: ['UserId'],
			raw: true,
			offset: offset,
			limit: limit,
		});

		const latestUserIds = latestCreatedAtSubquery.map((entry) => ({
			UserId: entry.UserId,
			createdAt: entry.latestCreatedAt,
		}));

		let whereCondition_ = {
			[sequelize.Op.or]: whereCondition,
			ClientId: allChildClientList,
			type: 'received',
			isQuickReply: false,
			[Op.and]: dateCondition,
		};

		let whereCondition_User = {
			ClientId: allChildClientList,
			type: 'received',
			isQuickReply: false,
			[Op.and]: dateCondition,
		};

		if (userDetailId && userDetailId.length > 0) {
			[err, userDetails] = await to(
				Bot_send_msg.findAll({
					where: whereCondition_User,
					include: [
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
								forDrip: true,
								id: userDetailId,
							},
							attributes: ['id', 'local_user_id'],
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
					attributes: [
						'id',
						'ClientId',
						'PostId',
						'UserId',
						'type',
						'msgType',
						'data',
						'isReplied',
						'createdAt',
						'updatedAt',
					],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, chatsData] = await to(
				Bot_send_msg.findAll({
					where: whereCondition_,
					include: [
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
								forDrip: true,
							},
							attributes: ['id', 'local_user_id'],
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
					attributes: [
						'id',
						'ClientId',
						'PostId',
						'UserId',
						'type',
						'msgType',
						'data',
						'isReplied',
						'createdAt',
						'updatedAt',
					],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (userDetails && userDetails.length > 0) {
			for (let userDetails_ of userDetails) {
				allData.push(userDetails_);
			}
		}

		if (chatsData && chatsData.length > 0) {
			for (let chatsData_ of chatsData) {
				allData.push(chatsData_);
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedChatId.push(item_.id);
		}

		if (UpdatedChatId && UpdatedChatId.length > 0) {
			[err, finalchatsData] = await to(
				Bot_send_msg.findAndCountAll({
					where: {
						id: UpdatedChatId,
						[Op.or]: latestUserIds,
					},
					include: [
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
								forDrip: true,
							},
							attributes: ['id', 'local_user_id'],
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
					attributes: [
						'id',
						'ClientId',
						'PostId',
						'UserId',
						'type',
						'msgType',
						'data',
						'isReplied',
						'respStatus',
						'createdAt',
						'updatedAt',
					],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		for (let chat of finalchatsData.rows) {
			let chatDetail = chat.convertToJSON();
			[err, localUser] = await to(
				dbInstance[chatDetail.User.Market.db_name].User_master.findOne({
					where: {
						id: chatDetail.User.local_user_id,
					},
					attributes: ['first', 'last', 'phone'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				chatDetail.first = localUser.first;
				chatDetail.last = localUser.last;
				chatDetail.phone = localUser.phone;
			}

			finalChatList.push(chatDetail);
		}

		return ResponseSuccess(res, {
			data: finalChatList,
			count: finalchatsData.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSeachWhatappChats = getAllSeachWhatappChats;

const retryTriggerWhatsAppMessage = async function (WAppTriggerId, errorMessage) {
	try {
		let triggerDetails;
		let drip_details;
		let retryCount;
		let newTriggerTime;
		let flag = false;
		[err, triggerDetails] = await to(
			CampWhatsAppEmailDrip.findOne({
				where: {
					WAppTriggerId: WAppTriggerId,
				},
				include: [{ model: Campaign, where: { flowType: 'Campaign' }, attributes: ['id', 'flowType'] }],
				attributes: [
					'id',
					'AssignedPostToUserId',
					'CampaignId',
					'DripCampIndex',
					'UserId',
					'retryCount',
					'isTriggered',
					'publishOn',
					'dripType',
					'PostId',
				],
			})
		);
		if (err) console.log('----Error when get Camp WhatsApp Drip Data --', err);

		if (triggerDetails) {
			if (triggerDetails.dripType == 'Only WhatsApp') {
				[err, drip_details] = await to(
					Drip_whatsapp_native.findOne({
						where: {
							PostId: triggerDetails.PostId,
						},
						include: [{ model: WhatsAppSetup, attributes: ['id', 'enableRetry', 'retryInterval', 'retryFrequency'] }],
						attributes: ['id', 'WhatsAppSetupId'],
					})
				);
				if (err) console.log('--retryTriggerWhatsAppMessage--Error 1 ------', err);
			} else if (triggerDetails.dripType == 'DripApp with sharing on WhatsApp') {
				[err, drip_details] = await to(
					Drip_whatsapp_non_native.findOne({
						where: {
							PostId: triggerDetails.PostId,
						},
						include: [{ model: WhatsAppSetup, attributes: ['id', 'enableRetry', 'retryInterval', 'retryFrequency'] }],
						attributes: ['id', 'WhatsAppSetupId'],
					})
				);
				if (err) console.log('--retryTriggerWhatsAppMessage--Error 2------', err);
			}
		}

		if (drip_details) {
			if (drip_details?.WhatsAppSetup?.enableRetry) {
				if (drip_details?.WhatsAppSetup?.retryFrequency) {
					if (triggerDetails?.retryCount >= drip_details?.WhatsAppSetup?.retryFrequency) {
						return flag;
					}

					let retryInterval = drip_details.WhatsAppSetup.retryInterval;
					if (!retryInterval || retryInterval < 0) {
						retryInterval = 0;
					}

					newTriggerTime = moment(triggerDetails.publishOn).add(retryInterval, 'hours').format();
					flag = true;
					[err, updateDetails] = await to(
						CampWhatsAppEmailDrip.update(
							{
								// retryCount,
								publishOn: newTriggerTime,
								isTriggered: false,
								sentDate: null,
								deliveryDate: null,
								readDate: null,
								failDate: null,
								status: 'Retrying',
								errorMessage: errorMessage,
							},
							{
								where: {
									id: triggerDetails.id,
								},
							}
						)
					);
					if (err) console.log('--retryTriggerWhatsAppMessage--Error 3------', err);
				}
			}
		}

		return flag;
	} catch (error) {
		console.log('---retryTriggerWhatsAppMessage---', error);
	}
};

///////////////////////////////////////////////                         ////////////////////////////////////////////////////
/////////////////////////////////////////////// Meta Webhook Functions /////////////////////////////////////////////////////

// Response to Meta WhatsApp webhooks for setup
const resMetaWhatsAppWebhook = async function (req, res) {
	try {
		// ====== PATCH: Handle Meta GET verification ======
		if (req.method === 'GET') {
			const VERIFY_TOKEN = 'meta_verify_2025'; // Use the same token you enter in Meta
			const mode = req.query['hub.mode'];
			const token = req.query['hub.verify_token'];
			const challenge = req.query['hub.challenge'];

			if (mode === 'subscribe' && token === VERIFY_TOKEN) {
				console.log('✅ Meta Webhook verified');
				return res.status(200).send(challenge);
			} else {
				console.log('❌ Meta Webhook verification failed');
				return res.sendStatus(403);
			}
		}
		// ====== END PATCH ======
	} catch (error) {
		console.log('---Error at Update Meta WhatsApp Webhook Details--', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.resMetaWhatsAppWebhook = resMetaWhatsAppWebhook;

// get all type Meta WhatsApp webhooks details
const updateMetaWhatsAppWebhookDetails = async function (req, res) {
	try {
		// Handle POST webhook payload
		console.log('---Meta WhatsApp Webhook Req----', req.body);

		if (req?.body?.object === 'whatsapp_business_account' && req?.body?.entry?.length > 0) {
			// 👇 forward the webhook body to your internal function
			await getMetaWhatsappActionAsPerEvent(req.body);
			return ResponseSuccess(res);
		} else {
			console.log('--Server Error-- Invalid Request structure---');
			return ResponseError(res, 'Invalid Request', 400, true);
		}
	} catch (error) {
		console.log('---Error at Update Meta WhatsApp Webhook Details--', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateMetaWhatsAppWebhookDetails = updateMetaWhatsAppWebhookDetails;

const getMetaWhatsappActionAsPerEvent = async function (webhookData) {
	try {
		console.log('---Meta Webhook Received---', JSON.stringify(webhookData, null, 2));

		for (let entry of webhookData?.entry) {
			if (!entry.changes) {
				continue;
			}

			for (let change of entry.changes) {
				const field = change.field;
				const value = change.value;

				if (field === 'message_template_status_update') {
					await updateMetaWhatsAppTemplateStatus(value);
				} else if (field === 'message_template_quality_update') {
					// await handleMessageTemplateQualityUpdate(value);
				} else if (field === 'template_category_update') {
					await updateMetaWhatsAppTemplateCategory(value);
				} else if (field === 'phone_number_messaging_limit_update') {
					await updateMetaWhatsAppPhoneNumberMessagingLimit(value);
				} else if (field === 'messages') {
					if (value?.statuses?.length > 0) {
						await updateMetaWhatsAppMessagesWebhooks(entry);
					} else if (value?.messages?.length > 0) {
						await updateMetaWhatsAppReplayStatus(entry);
					}
				}
			}
		}

		return true;
	} catch (error) {
		console.error('------Error at Meta Action Webhook---------', error);
		return false;
	}
};

const updateMetaWhatsAppTemplateStatus = async function (templateData) {
	try {
		let updatedStatusDetail;
		let updateNativeStatus;
		let updateNonNativeStatus;
		let whatsAppNative;
		let whatsAppNonNative;

		if (templateData?.message_template_id) {
			updatedStatusDetail = templateData?.event?.toLowerCase();
			if (!updatedStatusDetail) return false;

			updatedStatusDetail = updatedStatusDetail.charAt(0).toUpperCase() + updatedStatusDetail.slice(1);

			let templateStatus = 'Pending';

			if (updatedStatusDetail === 'Approved') {
				templateStatus = 'Enabled';
			} else if (updatedStatusDetail === 'Rejected') {
				templateStatus = 'Rejected';
			}

			let updateCondition = {
				templateStatus: templateStatus,
			};

			console.log('---updateCondition---', updateCondition);

			//////////////////////////////////// Only Whatsapp Template Update ///////////////////////////////////////

			[err, updateNativeStatus] = await to(
				Drip_whatsapp_native.update(updateCondition, {
					where: {
						templateId: templateData.message_template_id.toString(),
					},
				})
			);
			if (err) {
				console.log('---Error at Update Meta WhatsApp Template Details in Drip_whatsapp_native', err);
			}

			console.log('---updateNativeStatus---', updateNativeStatus);

			if (updateNativeStatus && updateNativeStatus[0] > 0) {
				let payload = {
					message_template_id: templateData.message_template_id.toString(),
					templateStatus: templateStatus,
				};

				console.log('--TEST--');
				await triggerEmailNotificationWithOnlyWhatsAppForCategoryaAndStatus(payload, 'UpdateTemplateStatus');
			}

			//////////////////////////////////// Drip App With Whatsapp Native Template Update ///////////////////////////////////////

			//Only if not updated in native, check non-native
			if (updateNativeStatus && updateNativeStatus[0] === 0) {
				[err, updateNonNativeStatus] = await to(
					Drip_whatsapp_non_native.update(updateCondition, {
						where: {
							templateId: templateData.message_template_id.toString(),
						},
					})
				);
				if (err) {
					console.log('---Error at Update Meta WhatsApp Template Details in Drip_whatsapp_non_native', err);
				}

				if (updateNonNativeStatus && updateNonNativeStatus[0] > 0) {
					let payload = {
						message_template_id: templateData.message_template_id.toString(),
						templateStatus: templateStatus,
					};

					await triggerEmailNotificationWithDripAppWithWhatsAppForCategoryaAndStatus(payload, 'UpdateTemplateStatus');
				}
			}

			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error at Update Meta WhatsApp Template Status--', error);
		return false;
	}
};

const updateMetaWhatsAppTemplateCategory = async function (templateData) {
	try {
		let updateNativeStatus;
		let updateNonNativeStatus;

		if (templateData?.message_template_id) {
			let updatedCategoryDetail = templateData?.meta_proposed_category?.toLowerCase();
			if (!updatedCategoryDetail) return false;

			updatedCategoryDetail = updatedCategoryDetail.charAt(0).toUpperCase() + updatedCategoryDetail.slice(1);

			let updateCondition = {
				tempCategory: updatedCategoryDetail,
			};

			//////////////////////////////////// Only Whatsapp Template Update ///////////////////////////////////////

			[err, updateNativeStatus] = await to(
				Drip_whatsapp_native.update(updateCondition, {
					where: {
						templateId: templateData.message_template_id.toString(),
					},
				})
			);
			if (err) {
				console.log('---Error at Update Meta WhatsApp Template Category in Drip_whatsapp_native', err);
			}

			if (updateNativeStatus && updateNativeStatus[0] > 0) {
				let payload = {
					message_template_id: templateData.message_template_id.toString(),
					templateStatus: null,
					newtempCategory: updatedCategoryDetail,
				};

				await triggerEmailNotificationWithOnlyWhatsAppForCategoryaAndStatus(payload, 'UpdateTemplateCategory');
			}

			//////////////////////////////////// Drip App With Whatsapp Native Template Update ///////////////////////////////////////

			//Only if not updated in native, check non-native
			if (updateNativeStatus && updateNativeStatus[0] === 0) {
				[err, updateNonNativeStatus] = await to(
					Drip_whatsapp_non_native.update(updateCondition, {
						where: {
							templateId: templateData.message_template_id.toString(),
						},
					})
				);
				if (err) {
					console.log('---Error at Update Meta WhatsApp Template Category in Drip_whatsapp_non_native', err);
				}

				if (updateNonNativeStatus && updateNonNativeStatus[0] > 0) {
					let payload = {
						message_template_id: templateData.message_template_id.toString(),
						templateStatus: null,
						newtempCategory: updatedCategoryDetail,
					};

					await triggerEmailNotificationWithDripAppWithWhatsAppForCategoryaAndStatus(payload, 'UpdateTemplateCategory');
				}
			}

			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error at Update Meta WhatsApp Template Category--', error);
		return false;
	}
};

const updateMetaWhatsAppPhoneNumberMessagingLimit = async function (templateData) {
	try {
		if (templateData?.phone_number && templateData?.current_limit) {
			// Extract data from webhook
			const phoneNumber = templateData.phone_number;
			const limit = templateData.current_limit;

			let [err, updateLimit] = await to(
				WhatsAppSetup.update(
					{ messageLimit: limit },
					{
						where: {
							metaPhoneNumber: phoneNumber,
						},
					}
				)
			);

			if (err) {
				console.log('---Error at Update Meta Phone Number Messaging Limit in WhatsApp Setup---', err);
			}

			return true;
		} else {
			console.log('---Missing phone_number or current_limit in Meta Webhook data---');
			return false;
		}
	} catch (error) {
		console.log('---Error at update Meta WhatsApp Phone Number Messaging Limit---', error);
		return false;
	}
};

const updateMetaWhatsAppMessagesWebhooks = async function (data) {
	try {
		const payload = [
			{
				statusData: JSON.stringify(data),
				isMeta: true,
			},
		];
		await to(WhatsAppDeliveryStatus.bulkCreate(payload));
	} catch (error) {
		console.log('--- Error When Inserting Meta Messages Entries  ----', error);
	}
};

const updateMetaWhatsAppReplayStatus = async function (incoming_data) {
	try {
		console.log('-----Whats App Replay Status-----', JSON.stringify(incoming_data, null, 2));
		let optOutResponse = false;
		let appBranding;
		let err;

		// ===== Meta WhatsApp Message Handling =====
		let data = {};
		const change = incoming_data?.changes?.[0];
		const message = change?.value?.messages?.[0];
		const metadata = change?.value?.metadata;
		const waba_number = metadata?.display_phone_number;
		data.waNumber = waba_number;
		if (!message || !metadata) {
			console.log('-------No message or metadata found--------');
			return false;
		}

		const mobile = message?.from;
		if (!mobile) {
			console.log('-------No mobile found----------');
			return false;
		}

		data.mobile = mobile;
		data.messageId = message?.id;
		data.type = message?.type;
		data.context = message?.context;
		data.replyId = message?.context?.id;

		if (message?.type === 'text') {
			data.text = message.text.body;
		} else if (message?.type === 'button') {
			data.button = JSON.stringify({
				text: message?.button?.text,
				payload: message?.button?.payload,
				id: message?.button?.payload,
			});
		} else if (message?.type === 'interactive') {
			data.interactive = JSON.stringify(message?.interactive);
		} else if (['image', 'video', 'document', 'audio', 'voice', 'location', 'contacts'].indexOf(message?.type) != -1) {
			data[message.type] = JSON.stringify(message[message.type]);
		}

		incoming_data = data;

		let clientData;
		if (!data.mobile) {
			console.log('-------No mobile in parsed data---------');
			return false;
		}

		[err, markets] = await to(
			Market.findAll({
				where: { status: true },
				attributes: ['id', 'db_name'],
			})
		);
		if (err) {
			console.log('----------Error finding markets--------', err);
			return false;
		}

		let userFind = false;
		let localUserData;
		let userData;
		let marketId;

		for (let market of markets) {
			const query = `
				SELECT id, first, last, country, city, state, "zipCode"  
				FROM "User_masters" 
				WHERE position(phone in :mobile) > 0 
					AND phone IS NOT NULL 
					AND phone != '' 
					AND "isDeleted" = false;
			`;

			const localUser = await dbInstance[market.db_name].sequelize.query(query, {
				replacements: { mobile: data.mobile },
				type: dbInstance[market.db_name].sequelize.QueryTypes.SELECT,
			});

			if (localUser.length > 0) {
				userFind = true;
				marketId = market.id;
				localUserData = localUser[0];
				break;
			}
		}

		if (!userFind) {
			console.log('----No matching user found in any market DB--------');
			return false;
		}

		[err, lastUser] = await to(
			User.findOne({
				where: {
					local_user_id: localUserData.id,
					status: true,
					is_deleted: false,
					cStatus: 'Active',
					forDrip: true,
					MarketId: marketId,
				},
				include: [{ model: Client_job_role, through: 'User_job_role_mapping' }, { model: UserThread }],
				attributes: ['id', 'tags', 'customFields'],
			})
		);
		if (err || !lastUser) {
			console.log('-------Error or no last user found----------', err);
			return false;
		}

		userData = lastUser.convertToJSON();
		userData.first = localUserData.first || '';
		userData.last = localUserData.last || '';
		userData.country = localUserData.country || '';
		userData.city = localUserData.city || '';
		userData.state = localUserData.state || '';
		userData.zipCode = localUserData.zipCode || '';
		userData.tags = lastUser.tags ? lastUser.tags.split(',') : [];
		userData.job_role = '';
		userData.phone = data.mobile;
		userData.customFields = lastUser.customFields || {};
		userData.UserThreads = lastUser.UserThreads;

		if (lastUser.Client_job_roles?.length > 0) {
			userData.job_role = lastUser.Client_job_roles[0].job_role_name;
		}

		let tag = null;
		let originalTag = null;
		let id = null;
		let msgType = data.type;
		let url = null;
		let isaudio = false;
		let isReplyToMessage = false;
		let isSelectQuickReply = false;

		if (data.type === 'interactive') {
			const optionBody = JSON.parse(data.interactive);
			originalTag = optionBody.list_reply.title;
			tag = optionBody.list_reply.title.toLowerCase();
			id = parseInt(optionBody.list_reply.id);
		} else if (data.type === 'text') {
			originalTag = data.text;
			tag = data.text.toLowerCase().trim();
			if (data?.context) isReplyToMessage = true;
		} else if (data.type === 'button') {
			//////////////////////////////////////////////
			const optionBody = JSON.parse(data.button);
			originalTag = optionBody.text;
			tag = optionBody.text.toLowerCase();
			id = parseInt(optionBody.id);
			isSelectQuickReply = true;
			/////////////////////////////////////////////
		} else if (['image', 'video', 'document', 'audio', 'voice'].includes(data.type)) {
			const media = JSON.parse(data[data.type]);
			console.log('--------media----------', media);
			console.log('--------data----------', data);
			// url = media.url + '' + media.signature;
			url = media.id;
			isaudio = ['audio', 'voice'].includes(data.type);
		} else if (['location', 'contacts'].includes(data.type)) {
			// tag = data[data.type];
			originalTag = JSON.stringify(data[data.type]);
		}

		[err, clientData] = await to(
			User_role_client_mapping.findOne({
				where: { RoleId: 1, UserId: userData.id },
				attributes: ['ClientId'],
				include: [
					{
						model: Client,
						attributes: ['id', 'name', 'enableChatBot', 'openAISecretKey', 'assistantId'],
						include: [{ model: ClientAgentMapping, required: false }],
					},
				],
			})
		);
		if (err) {
			console.log('-----Error finding client mapping--------', err);
			return false;
		}

		[err, incommingMessageLog] = await to(
			Bot_send_msg.create({
				messageId: data.messageId,
				UserId: userData.id,
				type: 'received',
				data: tag ? tag : JSON.stringify(data[data.type]),
				PostId: null,
				msgType: msgType,
				ClientId: clientData?.ClientId || null,
				url,
				status: null,
				cause: null,
				deliveryCode: null,
				channel: null,
				sentDate: null,
				deliveryDate: null,
				readDate: null,
				failDate: null,
				errorMessage: null,
				isMeta: true,
				WABANumber: data.waNumber,
			})
		);
		if (err) {
			console.log('Failed to insert Bot_send_msg:', err);
		}

		if (clientData && clientData.ClientId && userData && tag) {
			[optOutResponse, appBranding] = await userOptOutMethod(clientData, userData, tag);
			// console.log('<<<<<<<<---optOutResponse--->>>>', optOutResponse);
			// console.log('<<<<<<<<---appBranding--->>>>', appBranding);
		}

		if (!optOutResponse) {
			let details;
			if (tag) {
				[err, details] = await to(
					CampWhatsAppEmailDrip.findOne({
						where: { WAppTriggerId: data.messageId },
						attributes: [
							'id',
							'quickReplyResponse',
							'AssignedPostToUserId',
							'WAppTriggerId',
							'PostId',
							'CampaignId',
							'DripCampIndex',
							'DripCampId',
							'UserId',
							'TicketId',
						],
						include: [
							{
								model: Ticket,
								attributes: ['id', 'ContactId', 'UserId', 'status', 'query', 'comment'],
							},
						],
					})
				);
				if (err) console.log('------Error finding CampWhatsAppEmailDrip--------', err);
			}

			if (details) {
				if (isSelectQuickReply) {
					let quickReplyResponse = details.quickReplyResponse || '';
					quickReplyResponse = quickReplyResponse ? `${quickReplyResponse},${tag}` : tag;

					[err, updateDetails] = await to(
						// CampWhatsAppEmailDrip.update({ quickReplyResponse }, { where: { WAppTriggerId: details.WAppTriggerId } })
						CampWhatsAppEmailDrip.update({ quickReplyResponse }, { where: { id: details.id } })
					);
					if (err) console.log('-----Error updating quickReplyResponse------', err);

					if (details.AssignedPostToUserId) {
						[err, updateDetails] = await to(
							Assigned_post_to_user.update({ isDripClickAction: true }, { where: { id: details.AssignedPostToUserId } })
						);
						if (err) console.log('---------Error updating Assigned_post_to_user-------', err);
					}
				}

				//Add Check if details?.TicketId and isReplyToMessage or isSelectQuickReply  this flag is true then Closed the Ticket and Send to Contact
				if (details?.TicketId) {
					if (isReplyToMessage || isSelectQuickReply) {
						if (details?.Ticket?.status !== 'Closed') {
							// Also add the record in to the Ticket conversation Table
							const payload = {
								UserId: details.UserId,
								isAdminUser: details?.Ticket?.UserId == details.UserId ? true : false,
								message: originalTag,
								TicketId: details.TicketId,
							};

							[err, addTicketConversation] = await to(TicketConversation.create(payload));

							if (err) {
								console.log('--Error When Add Ticket Conversation Record');
								return false;
							}

							// then Closed the ticket and inform to Contact
							await closedTicket(details.Ticket, originalTag);
						}
					}
					////////////////////////
					////////////////////////
				} else {
					//Call Other Function For Check Quick Reply Action Outcome
					// Parameter:- UserId, CampaignId, DripCampIndex, Action :-- Activity Outcome, PostId

					await to(
						selectQuickReplyByLearner(
							details.UserId,
							details.CampaignId,
							details.DripCampIndex,
							'Activity Outcome',
							tag
						)
					);
				}

				return true;
			}

			if (!tag && !isaudio) {
				console.log('------No tag or audio to process----------');
				return false;
			}

			if (clientData?.Client?.enableChatBot == true) {
				[err, botMessages] = await to(
					Bot_message.findAll({
						where: {
							status: true,
							number: data.waNumber,
							tag: tag,
						},
						order: [['id', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				// console.log('------botMessages-------', botMessages.length);

				if (botMessages.length === 0) {
					////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					// Add Check as per Project environment
					if (
						clientData?.Client &&
						clientData?.Client?.enableChatBot == true &&
						clientData?.Client?.ClientAgentMappings &&
						clientData?.Client?.ClientAgentMappings?.length > 0 &&
						tag
					) {
						checkAndSendMsgFromAIAssistant(
							data.mobile,
							userData,
							tag,
							clientData.ClientId,
							data.waNumber,
							incommingMessageLog,
							url,
							isaudio
						);
					} else {
						// Check For The Default WhatsApp Message
						console.log('-------Check and Send Default WhatsApp Message 1--------');
						const details = await checkForDefaultWhatsAppMessage(clientData, userData, appBranding);
						console.log('-------Check and Send Default WhatsApp Message 2--------', details);

						let messageId_ = null;
						if (details?.messages?.length > 0) {
							messageId_ = details.messages[0].id;
							isMeta = true;
						} else if (response?.data?.response?.id) {
							messageId_ = details.response.id;
						}

						if (details) {
							[err, defaultwhatsAppReply] = await to(
								Bot_send_msg.create({
									messageId: messageId_,
									UserId: userData.id,
									type: 'sent',
									data: null,
									PostId: null,
									msgType: 'default reply',
									ClientId: clientData && clientData.ClientId ? clientData.ClientId : null,
									url,
									status: null,
									cause: null,
									deliveryCode: null,
									channel: null,
									sentDate: null,
									deliveryDate: null,
									readDate: null,
									failDate: null,
									errorMessage: null,
									isMeta: true,
									WABANumber: data.waNumber,
								})
							);
						}
					}
					return true;
				} else if (botMessages.length === 1) {
					let botdata = botMessages[0];
					if (botdata.startIngId) {
						[err, botMessages] = await to(Bot_message.findOne({ where: { id: botdata.startIngId } }));
						if (err) return ResponseError(res, err, 500, true);
						if (botMessages) {
							botdata = botMessages;
						}
					}
					if (['location', 'contact'].indexOf(botdata.type) > -1) {
						await sendLocationAndContactOnWhatsAppMessage(botdata, data.mobile, userData.id);
					} else if (botdata.isDripFlow) {
						await sendDripFlow(botdata, userData, clientData.ClientId);
					} else if (botdata.isDrip) {
						await sendDrip(botdata, data, userData, clientData.ClientId);
					} else if (!botdata.option || botdata.option === '' || botdata.option === null) {
						await sendWhatsAppOnlyTextMessage(botdata, data.mobile, userData.id, clientData.ClientId);
					} else {
						await sendWhatsAppMessage(botdata, data.mobile, userData.id);
					}
				} else {
					if (clientData && clientData.ClientId) {
						for (let bot of botMessages) {
							console.log('-----bot---', bot.convertToJSON());
							bot = bot.convertToJSON();

							if (bot.startIngId) {
								[err, botMessage] = await to(Bot_message.findOne({ where: { id: bot.startIngId } }));
								if (err) return ResponseError(res, err, 500, true);
								if (botMessage) {
									bot = botMessage.convertToJSON();
								}
							}

							if ((!bot.ClientId || bot.ClientId === clientData.ClientId) && (!bot.lastQuestion || id === bot.id)) {
								if (['location', 'contact'].indexOf(botMessages[0].type) > -1) {
									await sendLocationAndContactOnWhatsAppMessage(botMessages[0], data.mobile, userData.id);
								} else if (botMessages[0].isDripFlow) {
									await sendDripFlow(botMessages[0], userData, clientData.ClientId);
								} else if (bot.isDrip) {
									await sendDrip(bot, data, userData, clientData.ClientId);
								} else if (!bot.option || bot.option === '' || bot.option === null) {
									await sendWhatsAppOnlyTextMessage(bot, data.mobile, userData.id, clientData.ClientId);
								} else {
									await sendWhatsAppMessage(bot, data.mobile, userData.id);
								}
								break;
							}
						}
					}
				}
				return true;
			} else {
				// Check For The Default WhatsApp Message
				console.log('-------Check and Send Default WhatsApp Message 3--------');
				const details = await checkForDefaultWhatsAppMessage(clientData, userData, appBranding);
				console.log('-------Check and Send Default WhatsApp Message 4--------', details);

				let messageId_ = null;
				if (details?.messages?.length > 0) {
					messageId_ = details.messages[0].id;
					isMeta = true;
				} else if (response?.data?.response?.id) {
					messageId_ = details.response.id;
				}

				if (details) {
					[err, defaultwhatsAppReply] = await to(
						Bot_send_msg.create({
							messageId: messageId_,
							UserId: userData.id,
							type: 'sent',
							data: null,
							PostId: null,
							msgType: 'default reply',
							ClientId: clientData && clientData.ClientId ? clientData.ClientId : null,
							url,
							status: null,
							cause: null,
							deliveryCode: null,
							channel: null,
							sentDate: null,
							deliveryDate: null,
							readDate: null,
							failDate: null,
							errorMessage: null,
							isMeta: true,
							WABANumber: data.waNumber,
						})
					);
				}
			}

			console.log('-----Successfully processed Meta WhatsApp reply-------');
			return true;
		}

		console.log('--------Successfully processed (optOut true)--------');
		return true;
	} catch (error) {
		console.log('-------Exception in updateMetaWhatsAppReplayStatus-----', error);
		return false;
	}
};

// Trigger Email Notification with only WhatsApp for Categorya and Status after recived meta webhooks
const triggerEmailNotificationWithOnlyWhatsAppForCategoryaAndStatus = async function (templateData, actionType) {
	try {
		console.log('---Meta Only WhatsApp Template Data for Category and Status Update and Notification---', templateData);
		console.log('---Meta Only WhatsApp actionType Notification---', actionType);

		let whatsAppNative;

		[err, whatsAppNative] = await to(
			Drip_whatsapp_native.findOne({
				where: {
					templateId: templateData.message_template_id.toString(),
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'canChangeTempCat', 'isMeta', 'MTPNoId', 'MTToken'],
					},
				],
			})
		);
		if (err) {
			console.log('---Error-- When Get Meta WhatsApp Native Data for check webhook Template Status---', err);
		}

		if (whatsAppNative) {
			console.log('---------Meta whatsAppNative.id--------', whatsAppNative.id);

			const tempName = whatsAppNative.tempName;
			const tempCategory = whatsAppNative.tempCategory;
			const PostId = whatsAppNative.PostId;
			const templateId = whatsAppNative.templateId;

			[err, postData] = await to(
				Post.findOne({
					where: {
						id: PostId,
					},
					attributes: ['UserId', 'drip_title'],
				})
			);

			if (err) {
				console.log('----Error When get Meta Post WhatsApp Native Drip---', err);
			}

			if (templateData.templateStatus == 'Enabled') {
				[err, updateDripStatus] = await to(
					Post.update(
						{
							drip_status: 'Published',
						},
						{
							where: {
								id: PostId,
							},
						}
					)
				);
				if (err) {
					console.log('----Error When update Meta Post WhatsApp Native Drip Status---', err);
				}

				if (actionType == 'UpdateTemplateStatus') {
					let notifcationMessage = MESSAGE.Template_Approved;
					notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
					await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
				}
			}

			if (templateData.newtempCategory != tempCategory && actionType == 'UpdateTemplateCategory') {
				let notifcationMessage = MESSAGE.Template_Approved_With_Change_Category;

				notifcationMessage = notifcationMessage.replace('{{old_Category_name}}', tempCategory);
				notifcationMessage = notifcationMessage.replace('{{new_Category_name}}', templateData.newtempCategory);

				notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
				await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
			}

			if (templateData.templateStatus == 'Rejected') {
				[err, postData] = await to(
					Post.findOne({
						where: {
							id: PostId,
						},
						attributes: ['UserId', 'ClientId', 'drip_title'],
					})
				);

				if (err) {
					console.log('----Error When get Meta Post WhatsApp Native Drip---', err);
				}

				let notifcationMessage = MESSAGE.Template_Rejected;
				notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
				await createNotification(notifcationMessage, ['Bell', 'PopUp'], [postData.UserId]);

				const appBrandingData = await getClientAppBrandingByClientId(postData.ClientId);
				const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
				[err, getUser] = await to(
					User.findOne({
						where: {
							id: postData.UserId,
						},
						attributes: ['local_user_id', 'MarketId', 'id'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					})
				);
				if (err) {
					console.log('----Error When get Meta WhatsApp Native User Details for Template Reject Notification---', err);
				}
				[err, localUser] = await to(
					dbInstance[getUser.Market.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['first', 'last', 'email'],
					})
				);
				if (err) {
					console.log(
						'----Error When get Meta WhatsApp Native Local User Details for Template Reject Notification---',
						err
					);
				}
				let finalEmailList = [];
				let personalisations = {};
				personalisations.to = localUser.email;
				if (personalisations.to != null && personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: localUser.first,
						drip_name: tempName,
						drip_id: templateId,
						client_signature: signature,
					};
					if (localUser.email) finalEmailList.push(personalisations);
				}
				await notificationEmail(finalEmailList, 'Template Reject', postData.ClientId, 'drip');
			}

			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error when trigger Meta Only WhatsApp Email Notification---', error);
		return false;
	}
};

//Trigger Email Notification with Drip App With WhatsApp for Categorya and Status after recived meta webhooks
const triggerEmailNotificationWithDripAppWithWhatsAppForCategoryaAndStatus = async function (templateData, actionType) {
	try {
		console.log(
			'---Meta Drip App with WhatsApp Template Data for Category and Status Update and Notification---',
			templateData
		);
		console.log('---Meta Drip App with WhatsApp actionType Notification---', actionType);

		let whatsAppNonNative;

		// Check for WhatsApp Native Template
		[err, whatsAppNonNative] = await to(
			Drip_whatsapp_non_native.findOne({
				where: {
					templateId: templateData.message_template_id.toString(),
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'canChangeTempCat', 'isMeta', 'MTPNoId', 'MTToken'],
					},
				],
			})
		);
		if (err) console.log('---Error-- When Get WhatsApp Non Native Data for check Template Status---', err);

		if (whatsAppNonNative) {
			console.log('---------Meta whatsAppNonNative.id--------', whatsAppNonNative.id);

			const tempName = whatsAppNonNative.tempName;
			const tempCategory = whatsAppNonNative.tempCategory;
			const PostId = whatsAppNonNative.PostId;
			const templateId = whatsAppNonNative.templateId;

			[err, postData] = await to(
				Post.findOne({
					where: {
						id: PostId,
					},
					attributes: ['UserId', 'drip_title'],
				})
			);

			if (err) {
				console.log('----Error When get Meta Post Whatsapp Non Native Drip---', err);
			}

			if (templateData.templateStatus == 'Enabled') {
				[err, updateDripStatus] = await to(
					Post.update(
						{
							drip_status: 'Published',
						},
						{
							where: {
								id: PostId,
							},
						}
					)
				);
				if (err) {
					console.log('----Error When update Meta Post Whatsapp Non Native Drip Status---', err);
				}

				if (actionType == 'UpdateTemplateStatus') {
					let notifcationMessage = MESSAGE.Template_Approved;
					notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
					await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
				}
			}

			if (templateData.newtempCategory !== tempCategory && actionType == 'UpdateTemplateCategory') {
				let notifcationMessage = MESSAGE.Template_Approved_With_Change_Category;

				notifcationMessage = notifcationMessage.replace('{{old_Category_name}}', tempCategory);
				notifcationMessage = notifcationMessage.replace('{{new_Category_name}}', templateData.newtempCategory);

				notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
				await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
			}

			if (templateData.templateStatus == 'Rejected') {
				[err, postData] = await to(
					Post.findOne({
						where: {
							id: PostId,
						},
						attributes: ['UserId', 'ClientId', 'drip_title'],
					})
				);

				if (err) {
					console.log('----Error When get Meta Post Whatsapp Non Native Drip---', err);
				}

				let notifcationMessage = MESSAGE.Template_Rejected;
				notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
				await createNotification(notifcationMessage, ['Bell', 'PopUp'], [postData.UserId]);

				const appBrandingData = await getClientAppBrandingByClientId(postData.ClientId);
				const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
				[err, getUser] = await to(
					User.findOne({
						where: {
							id: postData.UserId,
						},
						attributes: ['local_user_id', 'MarketId', 'id'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					})
				);
				if (err) {
					console.log(
						'----Error When get Meta Whatsapp Non Native User Details for Template Reject Notification---',
						err
					);
				}
				[err, localUser] = await to(
					dbInstance[getUser.Market.db_name].User_master.findOne({
						where: {
							id: getUser.local_user_id,
						},
						attributes: ['first', 'last', 'email'],
					})
				);
				if (err) {
					console.log(
						'----Error When get Meta Whatsapp Non Native Local User Details for Template Reject Notification---',
						err
					);
				}
				let finalEmailList = [];
				let personalisations = {};
				personalisations.to = localUser.email;
				if (personalisations.to != null && personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: localUser.first,
						drip_name: tempName,
						drip_id: templateId,
						client_signature: signature,
					};
					if (localUser.email) finalEmailList.push(personalisations);
				}
				await notificationEmail(finalEmailList, 'Template Reject', postData.ClientId, 'drip');
			}

			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log('---Error when trigger Meta Only WhatsApp Email Notification---', error);
		return false;
	}
};

const metaCallBack = async function (req, res) {
	try {
		// const { code } = req.query;

		// if (!code) return res.status(400).send('No code provided');

		// try {
		// 	const result = await axios.get(`https://graph.facebook.com/v23.0/oauth/access_token`, {
		// 		params: {
		// 			client_id: '2528606894137998',
		// 			client_secret: 'bf77043e10ed21201ea128a8b739083d',
		// 			redirect_uri: 'https://803c882270da.ngrok-free.app/v1/meta/onboard/callback',
		// 			code,
		// 		},
		// 	});

		// 	const accessToken = result.data.access_token;

		// 	// Use this token to fetch business info
		// 	const profile = await axios.get(`https://graph.facebook.com/v23.0/me`, {
		// 		headers: { Authorization: `Bearer ${accessToken}` },
		// 	});

		// 	console.log('User profile:', profile.data);
		// 	//{ name: 'Tejas Nimkar', id: '122123904704884833' }
		// 	// Save token & WABA info securely to DB
		// 	console.log('accessToken', accessToken);
		// 	res.send('WhatsApp Onboarding Successful! You can close this window.');
		// } catch (err) {
		// 	console.error(err.response?.data || err);
		// 	res.status(500).send('Error during onboarding');
		// }
		try {
			const { code, state } = req.query;

			// 1. Exchange code for access token
			const tokenRes = await axios.get('https://graph.facebook.com/v23.0/oauth/access_token', {
				params: {
					client_id: '2528606894137998',
					client_secret: 'bf77043e10ed21201ea128a8b739083d',
					redirect_uri: 'https://5936f67a76fc.ngrok-free.app/v1/meta/onboard/callback',
					code,
				},
			});

			const accessToken = tokenRes.data.access_token;
			console.log('--accessToken--', tokenRes.data);
			console.log('--state--', state);

			//Save Access Token
			if (state && accessToken) {
				[err, updateWhatsAppSetupDetails] = await to(
					WhatsAppSetup.update(
						{ id: parseInt(state) },
						{
							where: {
								MTToken: accessToken,
							},
						}
					)
				);
				if (err) {
					console.log('-----err------', err);
				}
			}

			// 2. Get user profile
			const profileRes = await axios.get('https://graph.facebook.com/v23.0/me', {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			console.log('-------profileRes--------', profileRes.data);
			const userId = profileRes.data.id;

			// 3. Get business ID
			const businessRes = await axios.get(`https://graph.facebook.com/v23.0/${userId}/businesses`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			const businessId = businessRes.data.data[1]?.id;
			console.log('---businessRes-------', businessRes.data);
			if (!businessId) {
				return res.status(400).send('No Business ID found');
			}

			// 4. Get WABA ID
			const wabaRes = await axios.get(`https://graph.facebook.com/v23.0/${businessId}?fields=id,name`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			console.log('---wabaId-------', wabaRes.data);
			const wabaId = wabaRes.data.id;
			if (!wabaId) {
				return res.status(400).send('No WABA found');
			}

			// // 5. Get Phone Number ID and WhatsApp number
			// const phoneRes = await axios.get(`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers`, {
			// 	headers: { Authorization: `Bearer ${accessToken}` },
			// });
			// console.log('---phoneRes-------', phoneRes.data);
			// const phoneData = phoneRes.data;
			// if (!phoneData) {
			// 	return res.status(400).send('No phone number found');
			// }

			// const result = {
			// 	accessToken,
			// 	userId,
			// 	phoneData,
			// 	wabaId,
			// 	phoneNumberId: phoneData.id,
			// 	displayPhoneNumber: phoneData.display_phone_number,
			// 	customClientData: state, // your own identifier (optional)
			// };

			// console.log('✅ Onboarding Complete:', result);

			// Return this info or store it securely
			res.json({
				message: 'WhatsApp Onboarding Successful!',
				...result,
			});
		} catch (err) {
			console.error('❌ Error during WhatsApp onboarding:', err?.response?.data || err.message);
			res.status(500).send('❌ WhatsApp Onboarding Failed.');
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.metaCallBack = metaCallBack;
