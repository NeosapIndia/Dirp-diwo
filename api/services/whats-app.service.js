const {
	Op,
	Market,
	Country,
	User,
	Drip_whatsapp_native,
	WhatsAppSetup,
	Drip_whatsapp_non_native,
	Post,
	ClientWhatsAppSetup,
	Client,
	Campaign,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');
const Request = require('request');
const FormData = require('form-data');
const axios = require('axios');
const config_feature = require('../config/SiteConfig.json');
const { createNotification, getAllProductOwnerIdsForNotification } = require('../services/notification.service');
const { notificationEmail } = require('../services/mailer.service');
const { CheckAndUpdateMeta_WhatsAppUserVariables } = require('../services/campaign.service');
const {
	getClientAppBrandingByClientId,
	getDiwoClientAppBrandingByClientId,
	getAccountCustomField,
} = require('../services/client.service');
const Sequelize = require('sequelize');
//Run WhatsAPP OPT-IN Scheduler
if (config_feature?.configurable_feature?.whatsApp) {
	let whtsapp_opt_in_schedulor = schedule.scheduleJob('*/5 * * * *', function (fireDate) {
		console.log('Run Scheduler --->>>-->>>  WhatsApp Opt-In schedulor', fireDate);
		WhastAppOptInOfUsers();
	});
	module.exports.whtsapp_opt_in_schedulor = whtsapp_opt_in_schedulor;
} else {
	console.log('----------WhatsApp Opt-In Scheduler is disabled.-------------');
}

const WhastAppOptInOfUsers = async function () {
	try {
		let drip_details;
		[err, clientWhatsAppSetup] = await to(
			ClientWhatsAppSetup.findAll({
				where: {
					forDrip: true,
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'password', 'sendNtOptIn', 'isMeta', 'MTPNoId', 'MTToken'],
					},
					{
						model: Client,
						attributes: ['id'],
						include: [
							{
								model: User,
								through: 'User_role_client_mapping',
								attributes: [
									'id',
									'cStatus',
									'local_user_id',
									'account_id',
									'status',
									'opt_in',
									'optTrigger',
									'otp_update_at',
									'haveWhatsAppOptIn',
									'triggerOptInMsg',
									'opt_out',
									'optOutTrigger',
								],
								where: {
									opt_in: false,
									optTrigger: false,
									cStatus: 'Active',
								},
								include: [
									{
										model: Market,
										attributes: ['id', 'db_name'],
									},
									{
										model: Country,
										attributes: ['id', 'callingCode'],
									},
								],
							},
						],
					},
				],
				attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
			})
		);

		for (let client of clientWhatsAppSetup) {
			let clientDetails = client.convertToJSON();
			if (
				clientDetails &&
				clientDetails.Client &&
				clientDetails.Client.Users &&
				clientDetails.Client.Users.length > 0
			) {
				//Hite Direct API

				for (let i = 0; i < clientDetails.Client.Users.length; i = i + 200) {
					let userList = clientDetails.Client.Users.slice(i, i + 200);
					let appBranding = await getClientAppBrandingByClientId(clientDetails.Client.id);
					// console.log('appBranding', appBranding);
					//find app braning with client id
					// drip find id
					// if id get all post with drip id
					// check welcome msg of post
					if (appBranding && appBranding.sendoptinconfm && appBranding.optinconfmdrip) {
						[err, postDetails] = await to(
							Post.findOne({
								where: {
									id: appBranding.optinconfmdrip,
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
					}
					let allUserIds = [];
					let userIdsHavePhone = [];
					let userMobileNos = [];
					let notFoundPhoneUserIds = [];
					let notNeedToTriggerOptInApi = [];
					for (let user of userList) {
						if (user.haveWhatsAppOptIn || user.triggerOptInMsg || clientDetails.WhatsAppSetup.sendNtOptIn) {
							let userPhoneNumber;
							allUserIds.push(user.id);
							[err, localUser] = await to(
								dbInstance[user.Market.db_name].User_master.findOne({
									where: {
										id: user.local_user_id,
									},
								})
							);
							if (err) {
								console.log('Error --- Fatching User Local Data', err);
							}

							if (localUser && localUser.phone && localUser.phone != '' && localUser.phone != null) {
								userPhoneNumber = `${user.Country.callingCode}${localUser.phone}`;
								userPhoneNumber = userPhoneNumber.replace('+', '').replace('-', '');
								if (userPhoneNumber) {
									userMobileNos.push(userPhoneNumber);
									userIdsHavePhone.push(user.id);
								} else {
									notFoundPhoneUserIds.push(user.id);
								}
							} else {
								notFoundPhoneUserIds.push(user.id);
							}
						} else {
							notNeedToTriggerOptInApi.push(user.id);
						}
					}
					//Update Not Need to Trigger Optin API
					if (notNeedToTriggerOptInApi && notNeedToTriggerOptInApi.length > 0) {
						await updateUserErrorOptInStatus(notNeedToTriggerOptInApi, 'No need to trigger WhatsApp OPT-IN API.');
					}

					//Update Not Found Phone Number
					if (notFoundPhoneUserIds && notFoundPhoneUserIds.length > 0) {
						await updateUserErrorOptInStatus(notFoundPhoneUserIds, 'Phone Number Not Found.');
					}

					if (userMobileNos && userMobileNos.length > 0) {
						let allMobileNumber = userMobileNos.toString();
						// let data = await whatsAppAptInAPI(
						// 	clientDetails.WhatsAppSetup.user_id,
						// 	clientDetails.WhatsAppSetup.password,
						// 	allMobileNumber,
						// 	drip_details
						// );
						let data = await whatsAppAptInAPI(clientDetails.WhatsAppSetup, allMobileNumber, drip_details);
						//for 200 Users

						if (data && data.status == true) {
							await updateUserOptInStatus(userIdsHavePhone, data.opt_id);
						} else {
							//for 50 Users

							for (let j = 0; j < userMobileNos.length; j = j + 50) {
								let user_50_mobile_number = userMobileNos.slice(j, j + 50);
								let user_50_ids = userIdsHavePhone.slice(j, j + 50);
								allMobileNumber = user_50_mobile_number.toString();

								// data = await whatsAppAptInAPI(
								// 	clientDetails.WhatsAppSetup.user_id,
								// 	clientDetails.WhatsAppSetup.password,
								// 	allMobileNumber,
								// 	drip_details
								// );

								data = await whatsAppAptInAPI(clientDetails.WhatsAppSetup, allMobileNumber, drip_details);

								if (data && data.status == true) {
									await updateUserOptInStatus(user_50_ids, data.opt_id);
								} else {
									//For 25 Users

									for (let k = 0; k < user_50_mobile_number.length; k = k + 25) {
										let user_25_mobile_number = user_50_mobile_number.slice(k, k + 25);
										let user_25_ids = user_50_ids.slice(k, k + 25);
										allMobileNumber = user_25_mobile_number.toString();

										// data = await whatsAppAptInAPI(
										// 	clientDetails.WhatsAppSetup.user_id,
										// 	clientDetails.WhatsAppSetup.password,
										// 	allMobileNumber,
										// 	drip_details
										// );
										data = await whatsAppAptInAPI(clientDetails.WhatsAppSetup, allMobileNumber, drip_details);
										if (data && data.status == true) {
											await updateUserOptInStatus(user_25_ids, data.opt_id);
										} else {
											// for 10 Users

											for (let l = 0; l < user_25_mobile_number.length; l = l + 10) {
												let user_10_mobile_number = user_25_mobile_number.slice(l, l + 10);
												let user_10_ids = user_25_ids.slice(l, l + 10);
												allMobileNumber = user_10_mobile_number.toString();

												// data = await whatsAppAptInAPI(
												// 	clientDetails.WhatsAppSetup.user_id,
												// 	clientDetails.WhatsAppSetup.password,
												// 	allMobileNumber,
												// 	drip_details
												// );

												data = await whatsAppAptInAPI(clientDetails.WhatsAppSetup, allMobileNumber, drip_details);

												if (data && data.status == true) {
													await updateUserOptInStatus(user_10_ids, data.opt_id);
												} else {
													//for 5 Users

													for (let m = 0; m < user_10_mobile_number.length; m = m + 5) {
														let user_5_mobile_number = user_10_mobile_number.slice(m, m + 5);
														let user_5_ids = user_10_ids.slice(m, m + 5);
														allMobileNumber = user_5_mobile_number.toString();
														// data = await whatsAppAptInAPI(
														// 	clientDetails.WhatsAppSetup.user_id,
														// 	clientDetails.WhatsAppSetup.password,
														// 	allMobileNumber,
														// 	drip_details
														// );

														data = await whatsAppAptInAPI(clientDetails.WhatsAppSetup, allMobileNumber, drip_details);

														if (data && data.status == true) {
															await updateUserOptInStatus(user_5_ids, data.opt_id);
														} else {
															//For Single User

															for (let n = 0; n < user_5_mobile_number.length; n++) {
																allMobileNumber = user_5_mobile_number[n].toString();
																// data = await whatsAppAptInAPI(
																// 	clientDetails.WhatsAppSetup.user_id,
																// 	clientDetails.WhatsAppSetup.password,
																// 	allMobileNumber,
																// 	drip_details
																// );
																data = await whatsAppAptInAPI(
																	clientDetails.WhatsAppSetup,
																	allMobileNumber,
																	drip_details
																);
																if (data && data.status == true) {
																	await updateUserOptInStatus([user_5_ids[n]], data.opt_id);
																} else {
																	await updateUserErrorOptInStatus([user_5_ids[n]], data?.error);
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---error--', error);
	}
};

const whatsAppAptInAPI = async function (whatsAppSetup, allMobileNumber, drip_details) {
	try {
		if (whatsAppSetup?.isMeta == false) {
			let url = `${CONFIG.gupshup_whatsup_app_api_url}?method=OPT_IN&format=json&userid=${whatsAppSetup.user_id}&password=${whatsAppSetup.password}&phone_number=${allMobileNumber}&v=1.1&auth_scheme=plain&channel=WHATSAPP`;
			console.log('OPT-IN-url', url);
			try {
				const response = await axios.get(url);
				if (response.data && response.data.response && response.data.response.status == 'success') {
					if (drip_details !== null && drip_details !== undefined && drip_details !== '') {
						// const sendResponse = await sendWhatsAppdripToNewContact(
						// 	whatsAppSetup.user_id,
						// 	whatsAppSetup.password,
						// 	allMobileNumber,
						// 	drip_details[0]
						// );
						const sendResponse = await sendWhatsAppdripToNewContact(whatsAppSetup, allMobileNumber, drip_details[0]);
					}

					return {
						status: true,
						opt_id: response.data.response.id,
					};
				} else {
					return {
						status: false,
						error: response.data.response.details,
					};
				}
			} catch (error) {
				console.log('---Error--Whats OPT-IN API Trigger Error---', error);
			}
		} else if (whatsAppSetup?.isMeta == true) {
		}
	} catch (error) {
		console.log('----Error WhatsApp OPT-IN Api Error--', error);
	}
};

// ----------Send Welcome WhatsApp Native drip to new contacts----------------//
const sendWhatsAppdripToNewContact = async function (whatsAppSetup, userPhones, drip_details) {
	if (whatsAppSetup?.isMeta == false) {
		try {
			let sendOtherDetails = false;
			let params = {
				userid: whatsAppSetup.user_id,
				password: whatsAppSetup.password,
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

			// if (drip_details.interaction) {
			// 	params.isTemplate = true;
			// }

			let quickReplies = [];
			for (let i = 1; i <= 10; i++) {
				if (drip_details[`quickReply${i}`]) {
					quickReplies.push(drip_details[`quickReply${i}`]);
				}
			}

			if (quickReplies.length > 3) {
				sendOtherDetails = true;
			}

			let CTAs = [];

			if (drip_details.cta_sequence) {
				cta_sequence = JSON.parse(drip_details.cta_sequence);

				if (cta_sequence.length > 0) {
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

			if (quickReplies.length > 0 || CTAs.length > 0) {
				params.isTemplate = true;
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
							sendOtherDetails = true;
							wa_template_json.components.push({
								sub_type: 'url',
								index: `${index}`,
								type: 'button',
								parameters: [{ text: '', type: 'text' }],
							});
						}
						index++;
					}
				} else {
					for (let cta of CTAs) {
						if ((cta.type === 'callToActionText' || cta.type === 'callToActionText2') && cta.trackableLink) {
							sendOtherDetails = true;

							wa_template_json.components.push({
								sub_type: 'url',
								index: `${index}`,
								type: 'button',
								parameters: [{ text: '', type: 'text' }],
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

				if (sendOtherDetails || (quickReplies.length > 0 && cta_sequence.length > 0)) {
					params.wa_template_json = JSON.stringify(wa_template_json);
				} else if (sendOtherDetails) {
					// params.buttonUrlParam = '?drip_code=' + user.code;
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

			params.send_to = userPhones.toString();
			console.log(
				'<<<<<----Url-- ---WhatsApp-Native--for--Sending-Drip-->>>>>>>>>>>>>>',
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
			console.log(new Date(), 'Error --->>>>Drip Sent To New Contacts --->>>-->>>  Only WhatsApp', error);
			return error;
		}
	} else if (whatsAppSetup?.isMeta == true) {
		///////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		//////////////////////////////NEED TO DO FOR META/////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

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
				to: userPhones.toString(),
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
module.exports.sendWhatsAppdripToNewContact = sendWhatsAppdripToNewContact;

const updateUserOptInStatus = async function (userIds, opt_in_id) {
	try {
		[err, updateUser] = await to(
			User.update(
				{
					opt_in: true,
					otp_update_at: moment().format(),
					opt_id: opt_in_id,
					optTrigger: true,
				},
				{
					where: {
						id: userIds,
					},
				}
			)
		);
		if (err) console.log('---Error Update User opt in Status--', err);
		return;
	} catch (error) {
		console.log('---Error Update User Opt In Status---', error);
		return;
	}
};

const updateUserErrorOptInStatus = async function (userIds, optInError) {
	try {
		[err, updateUser] = await to(
			User.update(
				{
					optTrigger: true,
					optError: optInError,
				},
				{
					where: {
						id: userIds,
					},
				}
			)
		);
		if (err) console.log('---Error Update User Error opt in Status--', err);
		return;
	} catch (error) {
		console.log('-update User Error OptIn Status--', error);
		return;
	}
};

///////////////////////////////////////////////////////////////////////////////
//----------------------WhatsApp opt-out users Functions Start------------//

//Run Whatsapp OptOut Scheduler at every night 11 PM
// */30 * * * * *
if (config_feature?.configurable_feature?.whatsApp) {
	let WhatsApp_OptOut_Schedular = schedule.scheduleJob('0 23 * * *', async function (fireDate) {
		console.log('Run Scheduler --->>>-->>>  Whatsapp OptOut schedulor', fireDate);
		await WhatsAppOptOutOfUsers();
	});
	module.exports.WhatsApp_OptOut_Schedular = WhatsApp_OptOut_Schedular;
} else {
	console.log('-------------WhatsApp Opt-Out Scheduler is disabled.------------');
}

const WhatsAppOptOutOfUsers = async function () {
	try {
		[err, clientWhatsAppSetup] = await to(
			ClientWhatsAppSetup.findAll({
				where: {
					forDrip: true,
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'password', 'sendNtOptIn', 'isMeta', 'MTPNoId', 'MTToken'],
					},
					{
						model: Client,
						attributes: ['id'],
						include: [
							{
								model: User,
								through: 'User_role_client_mapping',
								attributes: [
									'id',
									'cStatus',
									'local_user_id',
									'account_id',
									'status',
									'haveWhatsAppOptIn',
									'triggerOptInMsg',
									'opt_in',
									'optTrigger',
									'opt_out',
									'optOutTrigger',
									'otp_out_at',
								],
								where: {
									opt_in: false,
									opt_out: true,
									optOutTrigger: false,
									cStatus: 'Active',
								},
								include: [
									{
										model: Market,
										attributes: ['id', 'db_name'],
									},
									{
										model: Country,
										attributes: ['id', 'callingCode'],
									},
								],
							},
						],
					},
				],
				attributes: ['id', 'ClientId', 'WhatsAppSetupId'],
			})
		);

		for (let client of clientWhatsAppSetup) {
			let clientDetails = client.convertToJSON();
			if (
				clientDetails &&
				clientDetails.Client &&
				clientDetails.Client.Users &&
				clientDetails.Client.Users.length > 0
			) {
				for (let i = 0; i < clientDetails.Client.Users.length; i = i + 200) {
					let userList = clientDetails.Client.Users.slice(i, i + 200);

					let allUserIds = [];
					let userIdsHavePhone = [];
					let userMobileNos = [];
					let notFoundPhoneUserIds = [];
					let notNeedToTriggerOptInApi = [];
					for (let user of userList) {
						// user.haveWhatsAppOptIn || user.triggerOptInMsg || clientDetails.WhatsAppSetup.sendNtOptIn
						if (user.opt_out && !user.optOutTrigger) {
							let userPhoneNumber;
							allUserIds.push(user.id);
							[err, localUser] = await to(
								dbInstance[user.Market.db_name].User_master.findOne({
									where: {
										id: user.local_user_id,
									},
								})
							);
							if (err) {
								console.log('Error --- Fatching User Local Data', err);
							}

							if (localUser && localUser.phone && localUser.phone != '' && localUser.phone != null) {
								userPhoneNumber = `${user.Country.callingCode}${localUser.phone}`;
								userPhoneNumber = userPhoneNumber.replace('+', '').replace('-', '');
								if (userPhoneNumber) {
									userMobileNos.push(userPhoneNumber);
									userIdsHavePhone.push(user.id);
								} else {
									notFoundPhoneUserIds.push(user.id);
								}
							} else {
								notFoundPhoneUserIds.push(user.id);
							}
						} else {
							notNeedToTriggerOptInApi.push(user.id);
						}
					}

					//Update Not Need to Trigger OptOUt API
					if (notNeedToTriggerOptInApi && notNeedToTriggerOptInApi.length > 0) {
						await updateUserOptOutErrorStatus(notNeedToTriggerOptInApi, 'No need to trigger WhatsApp OPT-OUT API.');
					}

					//Update Not Found Phone Number
					if (notFoundPhoneUserIds && notFoundPhoneUserIds.length > 0) {
						await updateUserOptOutErrorStatus(notFoundPhoneUserIds, 'Phone Number Not Found.');
					}

					if (userMobileNos && userMobileNos.length > 0) {
						let allMobileNumber = userMobileNos.toString();
						let data = await whatsAppOptOutAPI(
							clientDetails.WhatsAppSetup.user_id,
							clientDetails.WhatsAppSetup.password,
							allMobileNumber
						);
						//for 200 Users

						if (data && data.status == true) {
							await updateUserOptOutStatus(userIdsHavePhone, data.opt_out_id);
						} else {
							//for 50 Users

							for (let j = 0; j < userMobileNos.length; j = j + 50) {
								let user_50_mobile_number = userMobileNos.slice(j, j + 50);
								let user_50_ids = userIdsHavePhone.slice(j, j + 50);
								allMobileNumber = user_50_mobile_number.toString();

								data = await whatsAppOptOutAPI(
									clientDetails.WhatsAppSetup.user_id,
									clientDetails.WhatsAppSetup.password,
									allMobileNumber
								);
								if (data && data.status == true) {
									await updateUserOptOutStatus(user_50_ids, data.opt_out_id);
								} else {
									//For 25 Users

									for (let k = 0; k < user_50_mobile_number.length; k = k + 25) {
										let user_25_mobile_number = user_50_mobile_number.slice(k, k + 25);
										let user_25_ids = user_50_ids.slice(k, k + 25);
										allMobileNumber = user_25_mobile_number.toString();

										data = await whatsAppOptOutAPI(
											clientDetails.WhatsAppSetup.user_id,
											clientDetails.WhatsAppSetup.password,
											allMobileNumber
										);
										if (data && data.status == true) {
											await updateUserOptOutStatus(user_25_ids, data.opt_out_id);
										} else {
											// for 10 Users

											for (let l = 0; l < user_25_mobile_number.length; l = l + 10) {
												let user_10_mobile_number = user_25_mobile_number.slice(l, l + 10);
												let user_10_ids = user_25_ids.slice(l, l + 10);
												allMobileNumber = user_10_mobile_number.toString();

												data = await whatsAppOptOutAPI(
													clientDetails.WhatsAppSetup.user_id,
													clientDetails.WhatsAppSetup.password,
													allMobileNumber
												);
												if (data && data.status == true) {
													await updateUserOptOutStatus(user_10_ids, data.opt_out_id);
												} else {
													//for 5 Users

													for (let m = 0; m < user_10_mobile_number.length; m = m + 5) {
														let user_5_mobile_number = user_10_mobile_number.slice(m, m + 5);
														let user_5_ids = user_10_ids.slice(m, m + 5);
														allMobileNumber = user_5_mobile_number.toString();
														data = await whatsAppOptOutAPI(
															clientDetails.WhatsAppSetup.user_id,
															clientDetails.WhatsAppSetup.password,
															allMobileNumber
														);

														if (data && data.status == true) {
															await updateUserOptOutStatus(user_5_ids, data.opt_out_id);
														} else {
															//For Single User

															for (let n = 0; n < user_5_mobile_number.length; n++) {
																allMobileNumber = user_5_mobile_number[n].toString();
																data = await whatsAppOptOutAPI(
																	clientDetails.WhatsAppSetup.user_id,
																	clientDetails.WhatsAppSetup.password,
																	allMobileNumber
																);
																if (data && data.status == true) {
																	await updateUserOptOutStatus([user_5_ids[n]], data.opt_out_id);
																} else {
																	await updateUserOptOutErrorStatus([user_5_ids[n]], data.error);
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---error--', error);
	}
};

const whatsAppOptOutAPI = async function (whatsAppSetupUserId, whatsAppSetupPassword, allMobileNumber) {
	try {
		let url = `${CONFIG.gupshup_whatsup_app_api_url}?method=OPT_OUT&format=json&userid=${whatsAppSetupUserId}&password=${whatsAppSetupPassword}&phone_number=${allMobileNumber}&v=1.1&auth_scheme=plain&channel=WHATSAPP`;
		console.log('-----optouturl---', url);
		try {
			const response = await axios.get(url);
			if (response.data && response.data.response && response.data.response.status == 'success') {
				return {
					status: true,
					opt_out_id: response.data.response.id,
				};
			} else {
				return {
					status: false,
					error: response.data.response.details,
				};
			}
		} catch (error) {
			console.log('---Error--Whats OPT-OUT API Trigger Error---', error);
		}
	} catch (error) {
		console.log('----Error WhatsApp OPT-OUT Api Error--', error);
	}
};

const updateUserOptOutStatus = async function (userIds, optOut_id) {
	try {
		[err, updateUser] = await to(
			User.update(
				{
					otp_out_at: moment().format(),
					opt_out_id: optOut_id,
					optOutTrigger: true,
					haveWhatsAppOptIn: false,
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

const updateUserOptOutErrorStatus = async function (userIds, optOutError) {
	try {
		[err, updateUser] = await to(
			User.update(
				{
					optOutTrigger: true,
					optOutError: optOutError,
					haveWhatsAppOptIn: false,
				},
				{
					where: {
						id: userIds,
					},
				}
			)
		);
		if (err) console.log('---Error Update User Error opt Out Status--', err);
		return;
	} catch (error) {
		console.log('-update User Error Opt Out Status--', error);
		return;
	}
};

//----------------------WhatsApp opt-out users Functions End------------------//
///////////////////////////////////////////////////////////////////////////////

//Run WhatsAPP Template Status Check Scheduler
// let whtsapp_template_status_check_schedulor = schedule.scheduleJob('*/1 * * * *', function (fireDate) {
// 	console.log('Run Scheduler --->>>-->>>  WhatsApp check template schedulor', fireDate);
// 	checkTemplateStatus();
// });
// module.exports.whtsapp_template_status_check_schedulor = whtsapp_template_status_check_schedulor;

const checkTemplateStatus = async function (templateId) {
	try {
		// For WhatsApp Native
		console.log('---templateId-', templateId);
		let whatsAppNative;
		[err, whatsAppNative] = await to(
			Drip_whatsapp_native.findOne({
				where: {
					templateId: templateId,
					// templateStatus: 'Pending',
				},
				include: [
					{
						model: WhatsAppSetup,
						where: {
							status: 'Active',
						},
						attributes: ['id', 'user_id', 'password', 'canChangeTempCat', 'isMeta', 'MTPNoId', 'MTToken'],
					},
				],
			})
		);
		if (err) {
			console.log('---Error-- When Get WhatsApp Native Data for check Template Status---', err);
		}

		if (whatsAppNative) {
			console.log('--whatsAppNative.id-----------------------------', whatsAppNative.id);
			let params = {
				id: parseInt(whatsAppNative.templateId),
				userid: parseInt(whatsAppNative.WhatsAppSetup.user_id),
				password: whatsAppNative.WhatsAppSetup.password,
				method: `get_whatsapp_hsm`,
			};
			const tempName = whatsAppNative.tempName;
			const tempCategory = whatsAppNative.tempCategory;
			const PostId = whatsAppNative.PostId;
			const templateId = whatsAppNative.templateId;

			try {
				const response = await axios.get(
					`${CONFIG.gupshup_whatsup_app_api_url_for_template}?${new URLSearchParams(params).toString()}`
				);
				console.log('------- Check WhatsApp Template Status by API---------------', response.data.data[0]);
				if (response.data && response.data.data && response.data.data[0] && response.data.data[0].status) {
					let status = response.data.data[0].status.toLowerCase();
					let status_ = status.charAt(0).toUpperCase() + status.slice(1);

					let category = response.data.data[0].category.toLowerCase();
					let category_ = category.charAt(0).toUpperCase() + category.slice(1);

					[err, updateTemplateStatus] = await to(
						Drip_whatsapp_native.update(
							{
								templateStatus: status_,
								tempCategory: category_,
							},
							{
								where: {
									id: whatsAppNative.id,
								},
							}
						)
					);
					if (err) console.log('---Error ate update WhatsApp Template status----', err);

					if (status_ === 'Enabled') {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'Published',
								},
								{
									where: {
										id: whatsAppNative.PostId,
									},
								}
							)
						);
						if (err) console.log('----Error When update Drip Status---', err);

						[err, postData] = await to(
							Post.findOne({
								where: {
									id: PostId,
								},
								attributes: ['UserId', 'drip_title'],
							})
						);
						let notifcationMessage = MESSAGE.Template_Approved;
						if (category_ !== tempCategory) {
							notifcationMessage = MESSAGE.Template_Approved_With_Change_Category;
							notifcationMessage = notifcationMessage.replace('{{old_Category_name}}', tempCategory);
							notifcationMessage = notifcationMessage.replace('{{new_Category_name}}', category_);
						}
						//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
						notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
						await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
					} else if (status_ === 'Rejected') {
						[err, postData] = await to(
							Post.findOne({
								where: {
									id: PostId,
								},
								attributes: ['UserId', 'ClientId', 'drip_title'],
							})
						);
						let notifcationMessage = MESSAGE.Template_Rejected;
						//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
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
						if (err) return ResponseError(res, err, 500, true);
						[err, localUser] = await to(
							dbInstance[getUser.Market.db_name].User_master.findOne({
								where: {
									id: getUser.local_user_id,
								},
								attributes: ['first', 'last', 'email'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
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
				}
			} catch (error) {
				console.log('----Error When fetch WhatsApp Template check status API---', error);
			}
		}
		if (!whatsAppNative) {
			// For WhatsApp Non Native
			[err, whatsAppNonNative] = await to(
				Drip_whatsapp_non_native.findOne({
					where: {
						templateId: templateId,
					},
					include: [
						{
							model: WhatsAppSetup,
							where: {
								status: 'Active',
							},
							attributes: ['id', 'user_id', 'password', 'canChangeTempCat', 'isMeta', 'MTPNoId', 'MTToken'],
						},
					],
				})
			);
			if (err) console.log('---Error-- When Get WhatsApp Native Data for check Template Status---', err);

			if (whatsAppNonNative) {
				let params = {
					id: parseInt(whatsAppNonNative.templateId),
					userid: parseInt(whatsAppNonNative.WhatsAppSetup.user_id),
					password: whatsAppNonNative.WhatsAppSetup.password,
					method: `get_whatsapp_hsm`,
				};
				const tempName = whatsAppNonNative.tempName;
				const tempCategory = whatsAppNonNative.tempCategory;
				const PostId = whatsAppNonNative.PostId;
				const templateId = whatsAppNonNative.templateId;

				try {
					const response = await axios.get(
						`${CONFIG.gupshup_whatsup_app_api_url_for_template}?${new URLSearchParams(params).toString()}`
					);

					if (response.data && response.data.data && response.data.data[0] && response.data.data[0].status) {
						let status = response.data.data[0].status.toLowerCase();
						let status_ = status.charAt(0).toUpperCase() + status.slice(1);

						let category = response.data.data[0].category.toLowerCase();
						let category_ = category.charAt(0).toUpperCase() + category.slice(1);

						[err, updateTemplateStatus] = await to(
							Drip_whatsapp_non_native.update(
								{
									templateStatus: status_,
									tempCategory: category_,
								},
								{
									where: {
										id: whatsAppNonNative.id,
									},
								}
							)
						);
						if (err) console.log('---Error ate update WhatsApp Template status----', err);
						if (status_ == 'Enabled') {
							[err, updateDripStatus] = await to(
								Post.update(
									{
										drip_status: 'Published',
									},
									{
										where: {
											id: whatsAppNonNative.PostId,
										},
									}
								)
							);
							if (err) console.log('----Error When update Drip Status---', err);
							[err, postData] = await to(
								Post.findOne({
									where: {
										id: PostId,
									},
									attributes: ['UserId', 'drip_title'],
								})
							);
							let notifcationMessage = MESSAGE.Template_Approved;
							if (category_ !== tempCategory) {
								notifcationMessage = MESSAGE.Template_Approved_With_Change_Category;
								notifcationMessage = notifcationMessage.replace('{{old_Category_name}}', tempCategory);
								notifcationMessage = notifcationMessage.replace('{{new_Category_name}}', category_);
							}
							//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
							notifcationMessage = notifcationMessage.replace('{{drip_name}}', postData.drip_title);
							await createNotification(notifcationMessage, ['Bell'], [postData.UserId]);
						} else if (status_ === 'Rejected') {
							[err, postData] = await to(
								Post.findOne({
									where: {
										id: PostId,
									},
									attributes: ['UserId', 'drip_name', 'ClientId'],
								})
							);
							let notifcationMessage = MESSAGE.Template_Rejected;
							//notifcationMessage = notifcationMessage.replace('{{template_name}}', tempName);
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
							if (err) return ResponseError(res, err, 500, true);
							[err, localUser] = await to(
								dbInstance[getUser.Market.db_name].User_master.findOne({
									where: {
										id: getUser.local_user_id,
									},
									attributes: ['first', 'last', 'email'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);
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
					}
				} catch (error) {
					console.log('----Error When fetch WhatsApp Template check status API---', error);
				}
			}
		}
	} catch (error) {
		console.log('----Error- when Check Template STatus---', error);
	}
};
module.exports.checkTemplateStatus = checkTemplateStatus;

const createWhatsAppTemplate = async function (drip_details, drip, drip_type, clientId) {
	if (drip_details?.WhatsAppSetup?.isMeta == false) {
		try {
			let headerFile = false;
			let params = {
				userid: parseInt(drip_details.WhatsAppSetup.user_id),
				password: drip_details.WhatsAppSetup.password,
				method: 'create_whatsapp_hsm',
				category: drip_details.tempCategory,
				language: drip_details.tempLang,
				template_name: drip_details.tempName,
				allow_category_change: drip_details.WhatsAppSetup.canChangeTempCat,
				template: convertSpecialChar(drip_details.body),
			};

			//Find Custom Field
			let customFields = await getAccountCustomField(clientId, 'drip');
			//Check variable For Template body
			let bodyData = await CheckAndUpdateWhatsAppVariable(params.template, customFields);
			console.log('----Create WhatsApp Template Body---', bodyData);
			if (bodyData.text && bodyData.variable_examples.length > 0) {
				params.template = bodyData.text;
				params.template_variable_examples = JSON.stringify(bodyData.variable_examples);
			}

			//For Template Footer
			if (drip_details.footer != null && drip_details.footer != '') {
				params.footer = convertSpecialChar(drip_details.footer);
			}

			//For header Type ==>> Text
			if (drip_details.header_type == 'Text' || drip_details.header_type == 'None') {
				params.type = 'text';
				//For Text Header
				if (drip_details.header_text != null && drip_details.header_text != '') {
					params.header = convertSpecialChar(drip_details.header_text);
					let headerData = await CheckAndUpdateWhatsAppVariable(params.header, customFields);
					console.log('----Create WhatsApp Template Header---', headerData);
					if (headerData.text && headerData.variable_examples.length > 0) {
						params.header = headerData.text;
						params.header_examples = JSON.stringify(headerData.variable_examples);
					}
				}
			} else if (drip_details.header_type == 'Image' && drip_details.tempCategory != 'Authentication') {
				params.type = 'image';
				headerFile = true;
			} else if (drip_details.header_type == 'Video' && drip_details.tempCategory != 'Authentication') {
				params.type = 'video';
				headerFile = true;
			} else if (drip_details.header_type == 'Document' && drip_details.tempCategory != 'Authentication') {
				params.type = 'document';
				headerFile = true;
			} else if (drip_details.header_type == 'Location' && drip_details.tempCategory != 'Authentication') {
				params.type = 'location';
				params.type_category = 'MEDIA';
			}

			if (drip_type === 'Only WhatsApp') {
				// For Quick Replay

				let quickReplies = [];
				for (let i = 1; i <= 10; i++) {
					if (drip_details['quickReply' + i] != null && drip_details['quickReply' + i] != '') {
						quickReplies.push(convertSpecialChar(drip_details['quickReply' + i]));
					}
				}
				if (quickReplies.length > 0) {
					params.quick_reply_buttons = JSON.stringify(quickReplies);
				}

				// params.quickReplyFirst = drip_details.quickReplyFirst;

				// For Call to Action
				if (drip_details.cta_sequence && JSON.parse(drip_details.cta_sequence).length > 0) {
					let payload = [];
					let data = JSON.parse(drip_details.cta_sequence);
					for (let cta of data) {
						if (cta.value === 'callphonetext') {
							payload.push({
								text: convertSpecialChar(drip_details.callphonetext),
								type: 'phone_number',
								phone_number: drip_details.callphoneno,
							});
						} else if (cta.value === 'callToActionText') {
							let url = '';
							if (drip_details.trackableLink === false) {
								url = new URL(drip_details.hyper_link);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.trackableLink === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						} else if (cta.value === 'callToActionText2') {
							let url = '';
							if (drip_details.trackableLink2 === false) {
								url = new URL(drip_details.hyper_link2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText2),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.trackableLink2 === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText2),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						}

						// -------------------------------------------------------For Zoom Meeting Link Configration-------------------------------------------------------
						else if (cta.value === 'zoomMeetLink') {
							let url = '';
							if (drip_details.zoomTrackable === false) {
								url = new URL(drip_details.zoomMeetLink);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionZoomText),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.zoomTrackable === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionZoomText),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						} else if (cta.value === 'zoomMeetLink2') {
							let url = '';
							if (drip_details.zoomTrackable2 === false) {
								url = new URL(drip_details.zoomMeetLink2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionZoomText2),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.zoomTrackable2 === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionZoomText2),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						}
					}
					params.call_to_action_buttons = JSON.stringify(payload);
				}

				if (params?.quick_reply_buttons && params?.call_to_action_buttons) {
					params.quickReplyFirst = drip_details.quickReplyFirst;
				}
			} else {
				if (drip_details.interaction == 'Quick Replies') {
					let quickReplies = [];
					if (drip_details.quickReply1 != null && drip_details.quickReply1 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply1));
					}
					if (drip_details.quickReply2 != null && drip_details.quickReply2 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply2));
					}
					if (drip_details.quickReply3 != null && drip_details.quickReply3 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply3));
					}
					if (quickReplies.length > 0) {
						params.quick_reply_buttons = JSON.stringify(quickReplies);
					}
				} else if (drip_details.interaction == 'Call to Action') {
					let url = '';
					let payload = [];
					if (drip_details.type === 'static') {
						url = new URL(drip_details.hyper_link);
						payload.push({
							text: convertSpecialChar(drip_details.callToActionText),
							type: 'url',
							urlType: drip_details.type,
							url: url,
						});
					} else {
						url = CONFIG.drip_host;
						if (url.charAt(url.length - 1) !== '/') url = url + '/';
						let param = Math.random().toString(36).slice(2);
						// example = {baseUrl}/?id={randamId}
						// utl = baseUrl with /
						payload.push({
							text: drip_details.callToActionText,
							type: 'url',
							urlType: drip_details.type,
							url: url,
							example: [url + '?drip_code=' + param],
						});
					}
					params.call_to_action_buttons = JSON.stringify(payload);
				}
			}
			console.log('----Create WhatsApp Template Params---', params);
			let formData = new FormData();
			for (let key in params) {
				formData.append(key, params[key] + '');
			}

			if (headerFile) {
				let path = `${CONFIG.imagePath}${drip_details.headerPath}`;
				formData.append('header_examples', fs.createReadStream(path));
			}

			console.log('----for Testing---', formData);

			try {
				const response = await axios.post(`${CONFIG.gupshup_whatsup_app_api_url_for_template}`, formData);
				console.log('---Create a WhatsApp Template response----', response.data);
				if (
					response.data.details == 'Authentication failed due to invalid userId or password.' ||
					response.data.id === '401'
				) {
					let getPost;
					[err, getPost] = await to(
						Post.findOne({
							where: {
								id: drip.id,
							},
							attributes: ['ClientId', 'UserId'],
						})
					);
					let getClient;
					[err, getClient] = await to(
						Client.findOne({
							where: {
								id: getPost.ClientId,
							},
							attributes: ['name'],
						})
					);

					if (getClient) {
						let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
						notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
						let userIds = await getAllProductOwnerIdsForNotification(getPost.ClientId);
						await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
						const appBrandingData = await getClientAppBrandingByClientId(getPost.ClientId);
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
						for (let data of getUser) {
							[err, localUser] = await to(
								dbInstance[data.Market.db_name].User_master.findOne({
									where: {
										id: data.local_user_id,
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
						await notificationEmail(finalEmailList, 'WhatsApp Account Login Filed', getPost.ClientId, 'drip');
					}
				}
				let templateDetails;
				if (response.data.status == 'success') {
					templateDetails = response.data.details[0];
					return templateDetails;
				} else {
					return response.data;
				}
			} catch (error) {
				console.log('------Catch Error when Create a WhatsApp Template----', error);
				return false;
			}
		} catch (error) {
			console.log('----Error when Create WhatsApp Template---', error);
			return false;
		}
	} else {
		/////////////////////////////////////// For META Template Creation ////////////////////////////////////////////////
		try {
			console.log('-----Meta Create Template drip_details------', drip_details);

			let payload = {
				name: drip_details.tempName.toLowerCase().replace(/[\s]/g, '_'),
				language: drip_details.tempLang,
				category: drip_details.tempCategory.toUpperCase(),
				components: [],
			};

			const customFields = await getAccountCustomField(clientId, 'drip');

			// HEADER
			if (drip_details.header_type === 'Text') {
				const headerData = await CheckAndUpdateWhatsAppVariable(drip_details.header_text, customFields);
				payload.components.push({
					type: 'HEADER',
					format: 'TEXT',
					text: headerData.text,
					example: headerData.variable_examples.length > 0 ? { header_text: headerData.variable_examples } : undefined,
				});
			} else if (['Image', 'Video', 'Document'].includes(drip_details.header_type)) {
				//////////////////////////// File Upload Need While Creating Media Template //////////////////////////////

				const filePath = `${CONFIG.imagePath}${drip_details.headerPath}`;
				console.log('---Create Template filePath----', filePath);
				const fileInfo = await getFileInfoForMetaTemplate(filePath);
				console.log('---Create Template fileInfo---', fileInfo);

				const fileBuffer = fs.readFileSync(filePath);

				const uploadResult = await uploadSessionMediaToMeta(
					fileBuffer,
					fileInfo?.fileName,
					fileInfo?.mimeType,
					fileInfo?.fileSize,
					drip_details?.WhatsAppSetup?.MTAppId,
					drip_details?.WhatsAppSetup?.MTToken
				);

				console.log('---uploadResult---', uploadResult);

				if (!uploadResult.success) {
					return {
						success: false,
						details: uploadResult.error,
					};
				}

				payload.components.push({
					type: 'HEADER',
					format: drip_details.header_type.toUpperCase(),
					example: {
						header_handle: [uploadResult?.handle],
					},
				});

				//////////////////////////// File Upload Need While Sending Message //////////////////////////////

				const mediaUploadDetail = await uploadMediaFileToMeta(
					fileBuffer,
					fileInfo?.mimeType,
					drip_details?.WhatsAppSetup?.MTPNoId,
					drip_details?.WhatsAppSetup?.MTToken
				);

				console.log('---Create Template Media UploadDetail---', mediaUploadDetail);

				if (!mediaUploadDetail.success) {
					return {
						success: false,
						details: mediaUploadDetail.error,
					};
				}

				if (mediaUploadDetail && mediaUploadDetail?.id && drip_type === 'Only WhatsApp') {
					[err, updateMediaId] = await to(
						Drip_whatsapp_native.update(
							{
								mediaId: mediaUploadDetail.id,
							},
							{
								where: {
									id: drip_details.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (mediaUploadDetail && mediaUploadDetail?.id && drip_type === 'DripApp with sharing on WhatsApp') {
					[err, updateMediaId] = await to(
						Drip_whatsapp_non_native.update(
							{
								mediaId: mediaUploadDetail.id,
							},
							{
								where: {
									id: drip_details.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else if (drip_details.header_type === 'Location') {
				payload.components.push({
					type: 'HEADER',
					format: 'LOCATION',
					example: {
						header_handle: ['example_location'],
					},
				});
			}

			// BODY
			const bodyData = await CheckAndUpdateWhatsAppVariable(drip_details.body, customFields);

			console.log('-bodyData-', bodyData);

			if (bodyData?.text) {
				payload.components.push({
					type: 'BODY',
					text: bodyData.text,
					example: bodyData.variable_examples.length > 0 ? { body_text: [bodyData.variable_examples] } : undefined,
				});
			}

			// FOOTER
			if (drip_details.footer != null && drip_details.footer != '') {
				payload.components.push({
					type: 'FOOTER',
					text: drip_details.footer,
				});
			}

			let quickReplies = [];
			let buttons = [];
			let dynamicButtonParams = []; // Store dynamic button params separately

			if (drip_type === 'Only WhatsApp') {
				// Quick Replies
				for (let i = 1; i <= 10; i++) {
					const qr = drip_details[`quickReply${i}`];
					if (qr) {
						quickReplies.push({
							type: 'QUICK_REPLY',
							text: qr,
						});
					}
				}

				// CTA Buttons
				if (drip_details.cta_sequence && JSON.parse(drip_details.cta_sequence).length > 0) {
					const ctas = JSON.parse(drip_details.cta_sequence);

					for (const cta of ctas) {
						if (cta.value === 'callphonetext') {
							buttons.push({
								type: 'PHONE_NUMBER',
								text: drip_details.callphonetext,
								phone_number: drip_details.callphoneno,
							});
						} else if (cta.value === 'callToActionText' || cta.value === 'callToActionText2') {
							const isSecond = cta.value === 'callToActionText2';
							const trackable = isSecond ? drip_details.trackableLink2 : drip_details.trackableLink;
							let url = isSecond ? drip_details.hyper_link2 : drip_details.hyper_link;
							let text = isSecond ? drip_details.callToActionText2 : drip_details.callToActionText;

							if (trackable) {
								const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
								let paramValue = Math.random().toString(36).slice(2);
								let paramIndex = dynamicButtonParams.length + 1; // Meta expects 1, 2, 3 as placeholders

								buttons.push({
									type: 'URL',
									text: text,
									url: `${baseUrl}?drip_code={{${paramIndex}}}`,
									example: [paramValue],
								});

								dynamicButtonParams.push({
									paramIndex: paramIndex,
									paramValue: paramValue,
								});
							} else {
								buttons.push({
									type: 'URL',
									text: text,
									url: url,
								});
							}
						} else if (cta.value === 'zoomMeetLink' || cta.value === 'zoomMeetLink2') {
							const isSecond = cta.value === 'zoomMeetLink2';
							const trackable = isSecond ? drip_details.zoomTrackable2 : drip_details.zoomTrackable;
							let url = isSecond ? drip_details.zoomMeetLink2 : drip_details.zoomMeetLink;
							let text = isSecond ? drip_details.callToActionZoomText2 : drip_details.callToActionZoomText;

							if (trackable) {
								const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
								let paramValue = Math.random().toString(36).slice(2);
								let paramIndex = dynamicButtonParams.length + 1;

								buttons.push({
									type: 'URL',
									text: text,
									url: `${baseUrl}?drip_code={{${paramIndex}}}`,
									example: [paramValue],
								});

								dynamicButtonParams.push({
									paramIndex: paramIndex,
									paramValue: paramValue,
								});
							} else {
								buttons.push({
									type: 'URL',
									text: text,
									url: url,
								});
							}
						}
					}
				}
			} else {
				if (drip_details.interaction === 'Call to Action') {
					let url = '';
					if (drip_details.type === 'static') {
						url = drip_details.hyper_link;
						buttons.push({
							type: 'URL',
							text: drip_details.callToActionText,
							url: url,
						});
					} else {
						const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
						let paramValue = Math.random().toString(36).slice(2);
						let paramIndex = dynamicButtonParams.length + 1;

						buttons.push({
							type: 'URL',
							text: drip_details.callToActionText,
							url: `${baseUrl}?drip_code={{${paramIndex}}}`,
							example: [paramValue],
						});

						dynamicButtonParams.push({
							paramIndex: paramIndex,
							paramValue: paramValue,
						});
					}
				}
			}

			let combinedButtons = [];
			if (quickReplies.length > 0 && drip_details.quickReplyFirst) {
				combinedButtons = [...quickReplies, ...buttons];
			} else if (buttons.length > 0 && !drip_details.quickReplyFirst) {
				combinedButtons = [...buttons, ...quickReplies];
			}

			if (combinedButtons.length > 0) {
				payload.components.push({
					type: 'BUTTONS',
					buttons: combinedButtons,
				});
			}

			console.log('--Meta Whatsapp Template Create payload--', payload);
			console.log('--Meta Whatsapp Template Create payload componets--', payload.components);

			//Find the BUTTONS component
			const buttonsComponent = payload.components.find((c) => c.type === 'BUTTONS');

			//Check if it exists and has buttons
			if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) {
				buttonsComponent.buttons.forEach((btn, index) => {
					console.log(`Button ${index + 1}:`);
					console.log('Type:', btn.type);
					console.log('Text:', btn.text);
					if (btn.url) console.log('URL:', btn.url);
					if (btn.phone_number) console.log('Phone:', btn.phone_number);
				});
			}

			// ✅ You can now use dynamicButtonParams later for send API
			console.log('----Create Templare Dynamic Button Params:', dynamicButtonParams);

			let metaTemplateCreatingURL = `https://graph.facebook.com/v23.0/${drip_details?.WhatsAppSetup?.MTAccId}/message_templates`;

			console.log('---------metaTemplateCreatingURL----------', metaTemplateCreatingURL);

			try {
				const response = await axios.post(metaTemplateCreatingURL, payload, {
					headers: {
						Authorization: `Bearer ${drip_details?.WhatsAppSetup?.MTToken}`,
					},
				});

				console.log('---Create a Meta WhatsApp Template response----', response.data);

				if (['PENDING', 'APPROVED'].includes(response.data.status)) {
					return {
						success: true,
						template_id: response.data.id,
						details: response.data,
					};
				} else {
					return {
						success: true,
						template_id: response.data.id,
						details: response.data,
					};
				}
			} catch (error) {
				console.log('------Catch Error when Create a Meta WhatsApp Template----', error);
				console.log(
					'<<<---Catch Error when Create a Meta WhatsApp Template response Error---->>>',
					error.response?.data
				);

				const isGraphAuthError =
					error?.response?.status === 401 ||
					error?.response?.data?.error?.code === 190 ||
					(error?.response?.data?.error?.type === 'OAuthException' &&
						(error?.response?.data?.error?.message?.toLowerCase()?.includes('access token') ||
							error?.response?.data?.error?.message?.toLowerCase()?.includes('authentication')));

				if (isGraphAuthError) {
					let getPost;
					[err, getPost] = await to(
						Post.findOne({
							where: {
								id: drip.id,
							},
							attributes: ['ClientId', 'UserId'],
						})
					);
					let getClient;
					[err, getClient] = await to(
						Client.findOne({
							where: {
								id: getPost.ClientId,
							},
							attributes: ['name'],
						})
					);

					if (getClient) {
						let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
						notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
						let userIds = await getAllProductOwnerIdsForNotification(getPost.ClientId);
						await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
						const appBrandingData = await getClientAppBrandingByClientId(getPost.ClientId);
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
						for (let data of getUser) {
							[err, localUser] = await to(
								dbInstance[data.Market.db_name].User_master.findOne({
									where: {
										id: data.local_user_id,
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
						await notificationEmail(finalEmailList, 'Meta WhatsApp Account Login Filed', getPost.ClientId, 'drip');
					}
				}

				return {
					success: false,
					details: error.response?.data?.error?.message
						? JSON.stringify(error.response.data.error.message)
						: JSON.stringify(error.response.data),
				};
			}
		} catch (error) {
			console.log('----Error when Create Meta WhatsApp Template---', error);
			return false;
		}
	}
};
module.exports.createWhatsAppTemplate = createWhatsAppTemplate;

const updateWhatsAppTemplate = async function (drip_details, drip, drip_type, clientId) {
	if (drip_details?.WhatsAppSetup?.isMeta == false) {
		try {
			let headerFile = false;
			let params = {
				userid: parseInt(drip_details.WhatsAppSetup.user_id),
				password: drip_details.WhatsAppSetup.password,
				method: 'update_whatsapp_hsm',
				category: drip_details.tempCategory,
				language: drip_details.tempLang,
				template_name: drip_details.tempName,
				allow_category_change: drip_details.WhatsAppSetup.canChangeTempCat,
				template: convertSpecialChar(drip_details.body),
				id: parseInt(drip_details.templateId),
			};

			let customFields = await getAccountCustomField(clientId, 'drip');
			//Check variable For Template body
			let bodyData = await CheckAndUpdateWhatsAppVariable(params.template, customFields);
			if (bodyData.text && bodyData.variable_examples.length > 0) {
				params.template = bodyData.text;
				params.template_variable_examples = JSON.stringify(bodyData.variable_examples);
			}

			//For Template Footer
			if (drip_details.footer != null && drip_details.footer != '') {
				params.footer = convertSpecialChar(drip_details.footer);
			}

			//For header Type ==>> Text
			if (drip_details.header_type == 'Text' || drip_details.header_type == 'None') {
				params.type = 'text';
				//For Text Header
				if (drip_details.header_text != null && drip_details.header_text != '') {
					params.header = convertSpecialChar(drip_details.header_text);
					if (drip_details.header_text != null && drip_details.header_text != '') {
						params.header = convertSpecialChar(params.header);

						//For variable for Template Header
						let headerData = await CheckAndUpdateWhatsAppVariable(drip_details.body, customFields);
						if (headerData.text && headerData.variable_examples.length > 0) {
							params.header = headerData.text;
							params.header_examples = JSON.stringify(headerData.variable_examples);
						}
					}
				}
			} else if (drip_details.header_type == 'Image' && drip_details.tempCategory != 'Authentication') {
				params.type = 'image';
				headerFile = true;
				//Need to add media Media URL Path
			} else if (drip_details.header_type == 'Video' && drip_details.tempCategory != 'Authentication') {
				params.type = 'video';
				headerFile = true;
				//Need to add media Media URL Path
			} else if (drip_details.header_type == 'Document' && drip_details.tempCategory != 'Authentication') {
				params.type = 'document';
				headerFile = true;
				//Need to add media Media URL Path
			} else if (drip_details.header_type == 'Location' && drip_details.tempCategory != 'Authentication') {
				params.type = 'location';
				params.type_category = 'MEDIA';
			}

			// if (drip_details.interaction == 'Quick Replies') {
			// 	let quickReplies = [];
			// 	if (drip_details.quickReply1 != null && drip_details.quickReply1 != '') {
			// 		quickReplies.push(convertSpecialChar(drip_details.quickReply1));
			// 	}
			// 	if (drip_details.quickReply2 != null && drip_details.quickReply2 != '') {
			// 		quickReplies.push(convertSpecialChar(drip_details.quickReply2));
			// 	}
			// 	if (drip_details.quickReply3 != null && drip_details.quickReply3 != '') {
			// 		quickReplies.push(convertSpecialChar(drip_details.quickReply3));
			// 	}
			// 	if (quickReplies.length > 0) {
			// 		params.quick_reply_buttons = JSON.stringify(quickReplies);
			// 	}
			// } else if (drip_details.interaction == 'Call to Action') {
			// 	let url = '';
			// 	let payload = [];
			// 	if (drip_details.type === 'static') {
			// 		url = new URL(drip_details.hyper_link);
			// 		payload.push({
			// 			text: drip_details.callToActionText,
			// 			type: 'url',
			// 			urlType: drip_details.type,
			// 			url: url,
			// 		});
			// 	} else {
			// 		url = CONFIG.drip_host;
			// 		if (url.charAt(url.length - 1) !== '/') url = url + '/';
			// 		let param = Math.random().toString(36).slice(2);
			// 		payload.push({
			// 			text: drip_details.callToActionText,
			// 			type: 'url',
			// 			urlType: drip_details.type,
			// 			url: url,
			// 			example: [url + '?drip_code=' + param],
			// 		});
			// 	}
			// 	params.call_to_action_buttons = JSON.stringify(payload);
			// }

			if (drip_type === 'Only WhatsApp') {
				// For Quick Replay

				let quickReplies = [];
				for (let i = 1; i <= 10; i++) {
					if (drip_details['quickReply' + i] != null && drip_details['quickReply' + i] != '') {
						quickReplies.push(convertSpecialChar(drip_details['quickReply' + i]));
					}
				}
				if (quickReplies.length > 0) {
					params.quick_reply_buttons = JSON.stringify(quickReplies);
				}

				// params.quickReplyFirst = drip_details.quickReplyFirst;

				// For Call to Action
				if (drip_details.cta_sequence && JSON.parse(drip_details.cta_sequence).length > 0) {
					let payload = [];
					let data = JSON.parse(drip_details.cta_sequence);
					for (let cta of data) {
						if (cta.value === 'callphonetext') {
							payload.push({
								text: convertSpecialChar(drip_details.callphonetext),
								type: 'phone_number',
								phone_number: drip_details.callphoneno,
							});
						} else if (cta.value === 'callToActionText') {
							let url = '';
							if (drip_details.trackableLink === false) {
								url = new URL(drip_details.hyper_link);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.trackableLink === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						} else if (cta.value === 'callToActionText2') {
							let url = '';
							if (drip_details.trackableLink2 === false) {
								url = new URL(drip_details.hyper_link2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText2),
									type: 'url',
									urlType: 'static',
									url: url,
								});
							} else if (drip_details.trackableLink2 === true) {
								url = CONFIG.drip_host;
								if (url.charAt(url.length - 1) !== '/') url = url + '/';
								let param = Math.random().toString(36).slice(2);
								payload.push({
									text: convertSpecialChar(drip_details.callToActionText2),
									type: 'url',
									urlType: 'dynamic',
									url: url,
									example: [url + '?drip_code=' + param],
								});
							}
						}
					}
					params.call_to_action_buttons = JSON.stringify(payload);
				}

				if (params?.quick_reply_buttons && params?.call_to_action_buttons) {
					params.quickReplyFirst = drip_details.quickReplyFirst;
				}
			} else {
				if (drip_details.interaction == 'Quick Replies') {
					let quickReplies = [];
					if (drip_details.quickReply1 != null && drip_details.quickReply1 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply1));
					}
					if (drip_details.quickReply2 != null && drip_details.quickReply2 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply2));
					}
					if (drip_details.quickReply3 != null && drip_details.quickReply3 != '') {
						quickReplies.push(convertSpecialChar(drip_details.quickReply3));
					}
					if (quickReplies.length > 0) {
						params.quick_reply_buttons = JSON.stringify(quickReplies);
					}
				} else if (drip_details.interaction == 'Call to Action') {
					let url = '';
					let payload = [];
					if (drip_details.type === 'static') {
						url = new URL(drip_details.hyper_link);
						payload.push({
							text: convertSpecialChar(drip_details.callToActionText),
							type: 'url',
							urlType: drip_details.type,
							url: url,
						});
					} else {
						url = CONFIG.drip_host;
						if (url.charAt(url.length - 1) !== '/') url = url + '/';
						let param = Math.random().toString(36).slice(2);
						// example = {baseUrl}/?id={randamId}
						// utl = baseUrl with /
						payload.push({
							text: drip_details.callToActionText,
							type: 'url',
							urlType: drip_details.type,
							url: url,
							example: [url + '?drip_code=' + param],
						});
					}
					params.call_to_action_buttons = JSON.stringify(payload);
				}
			}
			console.log('----Create WhatsApp Template Params---', params);

			let formData = new FormData();
			for (let key in params) {
				formData.append(key, params[key] + '');
			}

			if (headerFile) {
				let path = `${CONFIG.imagePath}${drip_details.headerPath}`;
				formData.append('header_examples', fs.createReadStream(path));
			}

			try {
				const response = await axios.post(`${CONFIG.gupshup_whatsup_app_api_url_for_template}`, formData);
				let templateDetails;
				console.log('---Update WhatsApp Template response--', response.data);
				if (
					response.data.details === 'Authentication failed due to invalid userId or password.' ||
					response.data.id === '401'
				) {
					let getPost;
					[err, getPost] = await to(
						Post.findOne({
							where: {
								id: drip.id,
							},
							attributes: ['ClientId', 'UserId'],
						})
					);

					let getClient;
					[err, getClient] = await to(
						Client.findOne({
							where: {
								id: getPost.ClientId,
							},
							attributes: ['name'],
						})
					);

					if (getClient) {
						let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
						notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
						let userIds = await getAllProductOwnerIdsForNotification(getPost.ClientId);
						await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
						const appBrandingData = await getClientAppBrandingByClientId(getPost.ClientId);
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
						for (let data of getUser) {
							[err, localUser] = await to(
								dbInstance[data.Market.db_name].User_master.findOne({
									where: {
										id: data.local_user_id,
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
						await notificationEmail(finalEmailList, 'WhatsApp Account Login Filed', getPost.ClientId, 'drip');
					}
				}
				if (response.data.status == 'success') {
					templateDetails = response.data.details[0];
					return templateDetails;
				} else {
					return response.data;
				}
			} catch (error) {
				console.log('------Catch Error when Update a WhatsApp Template----', error);
				return false;
			}
		} catch (error) {
			console.log('----Error when Create WhatsApp Template---', error);
			return false;
		}
	} else {
		/////////////////////////////////////// For META Template Updation ////////////////////////////////////////////////

		try {
			console.log('------Meta Update Template drip_details-----', drip_details);

			const payload = {
				name: drip_details.tempName.toLowerCase().replace(/[\s]/g, '_'),
				language: drip_details.tempLang,
				category: drip_details.tempCategory.toUpperCase(),
				components: [],
			};

			const customFields = await getAccountCustomField(clientId, 'drip');

			// HEADER
			if (drip_details.header_type === 'Text') {
				const headerData = await CheckAndUpdateWhatsAppVariable(drip_details.header_text, customFields);
				payload.components.push({
					type: 'HEADER',
					format: 'TEXT',
					text: headerData.text,
					example: headerData.variable_examples.length > 0 ? { header_text: headerData.variable_examples } : undefined,
				});
			} else if (['Image', 'Video', 'Document'].includes(drip_details.header_type)) {
				//////////////////////////// File Upload Need While Creating Media Template //////////////////////////////

				const filePath = `${CONFIG.imagePath}${drip_details.headerPath}`;
				console.log('---Update Template filePath----', filePath);
				const fileInfo = await getFileInfoForMetaTemplate(filePath);
				console.log('---Update Template fileInfo---', fileInfo);

				const fileBuffer = fs.readFileSync(filePath);

				const uploadResult = await uploadSessionMediaToMeta(
					fileBuffer,
					fileInfo?.fileName,
					fileInfo?.mimeType,
					fileInfo?.fileSize,
					drip_details?.WhatsAppSetup?.MTAppId,
					drip_details?.WhatsAppSetup?.MTToken
				);

				console.log('---uploadResult---', uploadResult);

				if (!uploadResult.success) {
					return {
						success: false,
						details: uploadResult.error,
					};
				}

				payload.components.push({
					type: 'HEADER',
					format: drip_details.header_type.toUpperCase(),
					example: {
						header_handle: [uploadResult?.handle],
					},
				});

				//////////////////////////// File Upload Need While Sending Message //////////////////////////////

				const mediaUploadDetail = await uploadMediaFileToMeta(
					fileBuffer,
					fileInfo?.mimeType,
					drip_details?.WhatsAppSetup?.MTPNoId,
					drip_details?.WhatsAppSetup?.MTToken
				);

				console.log('---Update Template Media UploadDetail---', mediaUploadDetail);

				if (!mediaUploadDetail.success) {
					return {
						success: false,
						details: mediaUploadDetail.error,
					};
				}

				if (mediaUploadDetail && mediaUploadDetail?.id && drip_type === 'Only WhatsApp') {
					[err, updateMediaId] = await to(
						Drip_whatsapp_native.update(
							{
								mediaId: mediaUploadDetail.id,
							},
							{
								where: {
									id: drip_details.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (mediaUploadDetail && mediaUploadDetail?.id && drip_type === 'DripApp with sharing on WhatsApp') {
					[err, updateMediaId] = await to(
						Drip_whatsapp_non_native.update(
							{
								mediaId: mediaUploadDetail.id,
							},
							{
								where: {
									id: drip_details.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else if (drip_details.header_type === 'Location') {
				payload.components.push({
					type: 'HEADER',
					format: 'LOCATION',
					example: {
						header_handle: ['example_location'],
					},
				});
			}

			// BODY
			const bodyData = await CheckAndUpdateWhatsAppVariable(drip_details.body, customFields);
			if (bodyData?.text) {
				payload.components.push({
					type: 'BODY',
					text: bodyData.text,
					example: bodyData.variable_examples.length > 0 ? { body_text: bodyData.variable_examples } : undefined,
				});
			}

			// FOOTER
			if (drip_details.footer != null && drip_details.footer != '') {
				payload.components.push({
					type: 'FOOTER',
					text: drip_details.footer,
				});
			}

			let quickReplies = [];
			let buttons = [];
			let dynamicButtonParams = []; // Store dynamic button params separately

			if (drip_type === 'Only WhatsApp') {
				// Quick Replies
				for (let i = 1; i <= 10; i++) {
					const qr = drip_details[`quickReply${i}`];
					if (qr) {
						quickReplies.push({
							type: 'QUICK_REPLY',
							text: qr,
						});
					}
				}

				// CTA Buttons
				if (drip_details.cta_sequence && JSON.parse(drip_details.cta_sequence).length > 0) {
					const ctas = JSON.parse(drip_details.cta_sequence);

					for (const cta of ctas) {
						if (cta.value === 'callphonetext') {
							buttons.push({
								type: 'PHONE_NUMBER',
								text: drip_details.callphonetext,
								phone_number: drip_details.callphoneno,
							});
						} else if (cta.value === 'callToActionText' || cta.value === 'callToActionText2') {
							const isSecond = cta.value === 'callToActionText2';
							const trackable = isSecond ? drip_details.trackableLink2 : drip_details.trackableLink;
							let url = isSecond ? drip_details.hyper_link2 : drip_details.hyper_link;
							let text = isSecond ? drip_details.callToActionText2 : drip_details.callToActionText;

							if (trackable) {
								const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
								let paramValue = Math.random().toString(36).slice(2);
								let paramIndex = dynamicButtonParams.length + 1; // Meta expects 1, 2, 3 as placeholders

								buttons.push({
									type: 'URL',
									text: text,
									url: `${baseUrl}?drip_code={{${paramIndex}}}`,
									example: [paramValue],
								});

								dynamicButtonParams.push({
									paramIndex: paramIndex,
									paramValue: paramValue,
								});
							} else {
								buttons.push({
									type: 'URL',
									text: text,
									url: url,
								});
							}
						} else if (cta.value === 'zoomMeetLink' || cta.value === 'zoomMeetLink2') {
							const isSecond = cta.value === 'zoomMeetLink2';
							const trackable = isSecond ? drip_details.zoomTrackable2 : drip_details.zoomTrackable;
							let url = isSecond ? drip_details.zoomMeetLink2 : drip_details.zoomMeetLink;
							let text = isSecond ? drip_details.callToActionZoomText2 : drip_details.callToActionZoomText;

							if (trackable) {
								const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
								let paramValue = Math.random().toString(36).slice(2);
								let paramIndex = dynamicButtonParams.length + 1;

								buttons.push({
									type: 'URL',
									text: text,
									url: `${baseUrl}?drip_code={{${paramIndex}}}`,
									example: [paramValue],
								});

								dynamicButtonParams.push({
									paramIndex: paramIndex,
									paramValue: paramValue,
								});
							} else {
								buttons.push({
									type: 'URL',
									text: text,
									url: url,
								});
							}
						}
					}
				}
			} else {
				if (drip_details.interaction === 'Call to Action') {
					let url = '';
					if (drip_details.type === 'static') {
						url = drip_details.hyper_link;
						buttons.push({
							type: 'URL',
							text: drip_details.callToActionText,
							url: url,
						});
					} else {
						const baseUrl = CONFIG.drip_host.endsWith('/') ? CONFIG.drip_host : CONFIG.drip_host + '/';
						let paramValue = Math.random().toString(36).slice(2);
						let paramIndex = dynamicButtonParams.length + 1;

						buttons.push({
							type: 'URL',
							text: drip_details.callToActionText,
							url: `${baseUrl}?drip_code={{${paramIndex}}}`,
							example: [paramValue],
						});

						dynamicButtonParams.push({
							paramIndex: paramIndex,
							paramValue: paramValue,
						});
					}
				}
			}

			let combinedButtons = [];
			if (quickReplies.length > 0 && drip_details.quickReplyFirst) {
				combinedButtons = [...quickReplies, ...buttons];
			} else if (buttons.length > 0 && !drip_details.quickReplyFirst) {
				combinedButtons = [...buttons, ...quickReplies];
			}

			if (combinedButtons.length > 0) {
				payload.components.push({
					type: 'BUTTONS',
					buttons: combinedButtons,
				});
			}

			console.log('--Meta Whatsapp Template Update payload--', payload);
			console.log('--Meta Whatsapp Template Update payload componets--', payload.components);

			//Find the BUTTONS component
			const buttonsComponent = payload.components.find((c) => c.type === 'BUTTONS');

			//Check if it exists and has buttons
			if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) {
				buttonsComponent.buttons.forEach((btn, index) => {
					console.log(`Button ${index + 1}:`);
					console.log('Type:', btn.type);
					console.log('Text:', btn.text);
					if (btn.url) console.log('URL:', btn.url);
					if (btn.phone_number) console.log('Phone:', btn.phone_number);
				});
			}

			// ✅ You can now use dynamicButtonParams later for send API
			console.log('------Update Template Dynamic Button Params---', dynamicButtonParams);

			const tempId = parseInt(drip_details.templateId);

			let metaTemplateUpdatingURL = `https://graph.facebook.com/v23.0/${tempId}`;
			console.log('---------metaTemplateUpdatingURL----------', metaTemplateUpdatingURL);

			try {
				const response = await axios.post(metaTemplateUpdatingURL, payload, {
					headers: {
						Authorization: `Bearer ${drip_details?.WhatsAppSetup?.MTToken}`, // Replace with your actual token or config var
					},
				});

				console.log('---Update a Meta WhatsApp Template response----', response.data);

				if (['PENDING', 'APPROVED'].includes(response.data.status)) {
					return {
						success: true,
						template_id: response.data.id,
						details: response.data,
					};
				} else {
					return {
						success: true,
						template_id: response.data.id,
						details: response.data,
					};
				}
			} catch (error) {
				console.log('------Catch Error when Update a Meta WhatsApp Template----', error);
				console.log(
					'<<<---Catch Error when Update a Meta WhatsApp Template response Error---->>>',
					error.response?.data
				);

				const isGraphAuthError =
					error?.response?.status === 401 ||
					error?.response?.data?.error?.code === 190 ||
					(error?.response?.data?.error?.type === 'OAuthException' &&
						(error?.response?.data?.error?.message?.toLowerCase()?.includes('access token') ||
							error?.response?.data?.error?.message?.toLowerCase()?.includes('authentication')));

				if (isGraphAuthError) {
					let getPost;
					[err, getPost] = await to(
						Post.findOne({
							where: {
								id: drip.id,
							},
							attributes: ['ClientId', 'UserId'],
						})
					);
					let getClient;
					[err, getClient] = await to(
						Client.findOne({
							where: {
								id: getPost.ClientId,
							},
							attributes: ['name'],
						})
					);

					if (getClient) {
						let notifcationMessage = MESSAGE.WhatsApp_Login_Filed;
						notifcationMessage = notifcationMessage.replace('{{client_name}}', getClient.name);
						let userIds = await getAllProductOwnerIdsForNotification(getPost.ClientId);
						await createNotification(notifcationMessage, ['Bell', 'PopUp'], userIds);
						const appBrandingData = await getClientAppBrandingByClientId(getPost.ClientId);
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
						for (let data of getUser) {
							[err, localUser] = await to(
								dbInstance[data.Market.db_name].User_master.findOne({
									where: {
										id: data.local_user_id,
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
						await notificationEmail(finalEmailList, 'Meta WhatsApp Account Login Filed', getPost.ClientId, 'drip');
					}
				}

				return {
					success: false,
					details: error.response?.data
						? JSON.stringify(error.response.data, null, 2)
						: JSON.stringify({ message: error.message }),
				};
			}
		} catch (error) {
			console.log('----Error when Update Meta WhatsApp Template---', error);
			return false;
		}
	}
};
module.exports.updateWhatsAppTemplate = updateWhatsAppTemplate;

////////////////////////////////////////////// FOR META UPLOAD MEDIA /////////////////////////////////////////

const uploadSessionMediaToMeta = async (fileBuffer, fileName, mimeType, fileSize, businessId, accessToken) => {
	try {
		let payload = {
			file_name: fileName,
			file_type: mimeType,
			file_length: fileSize,
			access_mode: 'PUBLIC',
		};

		// Step 1: Initiate upload
		const resumableUploadSession = await axios.post(`https://graph.facebook.com/v23.0/${businessId}/uploads`, payload, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		console.log('---resumableUploadSession---', resumableUploadSession);

		const resumableUploadId = resumableUploadSession.data.id;

		console.log('---resumableUploadId---', resumableUploadId);

		console.log('---fileBuffer---', fileBuffer);

		let resumableUploadSessionURL = `https://graph.facebook.com/v23.0/${resumableUploadId}`;

		console.log('---resumableUploadSessionURL---', resumableUploadSessionURL);

		// Step 2: Upload media
		const uploadFileByResumableSession = await axios.post(resumableUploadSessionURL, fileBuffer, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': mimeType,
				file_offset: 0,
			},
		});

		console.log('---uploadFileByResumableSession---', uploadFileByResumableSession);

		// Step 3: Get handle from session response
		return {
			success: true,
			handle: uploadFileByResumableSession.data.h,
		};
	} catch (error) {
		console.log('------Error in Meta Resumable Upload--------', error.response?.data || error.message);
		return {
			success: false,
			error: error.response?.data || error.message,
		};
	}
};

const uploadMediaFileToMeta = async (fileBuffer, mimeType, whatsappPhoneNo, accessToken) => {
	try {
		console.log('---Enter in uploadMediaFileToMeta function---');

		const form = new FormData();
		form.append('file', fileBuffer, { filename: 'mediafile', contentType: mimeType });
		form.append('type', mimeType);
		form.append('messaging_product', 'whatsapp');

		// Step 1: Initiate upload
		const UploadedMediaDetail = await axios.post(`https://graph.facebook.com/v23.0/${whatsappPhoneNo}/media`, form, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		console.log('---Meta Uploaded Media Detail---', UploadedMediaDetail.data);

		const UploadedMediaId = UploadedMediaDetail.data.id;

		console.log('---Meta UploadedMediaId---', UploadedMediaId);

		return {
			success: true,
			id: UploadedMediaId,
		};
	} catch (error) {
		console.log('------Error in Meta Resumable Upload--------', error.response?.data || error.message);
		return {
			success: false,
			error: error.response?.data || error.message,
		};
	}
};

const getFileInfoForMetaTemplate = async function (filePath) {
	try {
		// Resolve the full path (optional)
		const resolvedPath = path.resolve(filePath);

		// Get file size
		const stats = fs.statSync(resolvedPath);
		const fileSize = stats.size; // in bytes

		// Get file name and extension
		const fileName = path.basename(resolvedPath); // e.g. WjCfFKgLS_1749809112581.mp4
		const fileExtension = path.extname(resolvedPath); // e.g. .mp4

		// Get MIME type
		const mimeType = mime.getType(resolvedPath); // e.g. video/mp4

		return {
			fileName,
			fileSize,
			fileExtension,
			mimeType,
			fullPath: resolvedPath,
		};
	} catch (error) {
		console.error('----Error reading resumanble file info----', error);
		return null;
	}
};

////////////////////////////////////////////// FOR META UPLOAD MEDIA CLOSED /////////////////////////////////////////

const CheckAndUpdateWhatsAppVariable = async function (text, customFields) {
	try {
		let variableList = ['First Name', 'Last Name', 'Country', 'State', 'City', 'Job Role'];

		let dummyTagData = {
			'First Name': 'John',
			'Last Name': 'Doe',
			Country: 'India',
			State: 'Maharashtra',
			City: 'Pune',
			'Job Role': 'Software Engineer',
			'Tag 1': 'AO Delhi NCR',
			'Tag 2': '10928933',
			'Tag 3': 'Sales Manager',
			'Tag 4': 'North',
			'Tag 5': 'South',
			'Tag 6': 'East',
			'Tag 7': 'West',
			'Tag 8': 'Team lead',
			'Tag 9': 'SP2_IVF Specialist',
			'Tag 10': 'T8_IN_Ferti_KAM_N_01_Delhi_Pool',
			'Tag 11': 'AO Delhi NCR',
			'Tag 12': '10928933',
			'Tag 13': 'Sales Manager',
			'Tag 14': 'North',
			'Tag 15': 'South',
			'Tag 16': 'East',
			'Tag 17': 'West',
			'Tag 18': 'Team lead',
			'Tag 19': 'SP2_IVF Specialist',
			'Tag 20': 'T8_IN_Ferti_KAM_N_01_Delhi_Pool',
		};

		for (let i = 1; i <= 20; i++) {
			variableList.push(`Tag ${i}`);
		}

		//Add In the Custom Fields For Bot Conversational Drip
		customFields.push({ label: 'Ticket Contact Name', dataType: 'First Name' });
		customFields.push({ label: 'Ticket Query', dataType: 'Ticket Query' });
		customFields.push({ label: 'Ticket Created Date Time', dataType: 'Date picker' });
		customFields.push({ label: 'Ticket Id', dataType: 'Number' });
		customFields.push({ label: 'Ticket Comment', dataType: 'Ticket Comment' });

		//Add Custom Fields in Variable List
		if (customFields && customFields.length > 0) {
			for (let field of customFields) {
				variableList.push(field.label);

				if (field.dataType === 'Number') {
					dummyTagData[field.label] = '123456';
				} else if (field.dataType === 'Percentage') {
					dummyTagData[field.label] = '90%';
				} else if (field.dataType === 'Currency') {
					dummyTagData[field.label] = '$100';
				} else if (field.dataType === 'Date picker') {
					dummyTagData[field.label] = '2021-10-10';
				} else if (field.dataType === 'Single-line text') {
					dummyTagData[field.label] = 'Sales Manager';
				} else if (field.dataType === 'Multi-line text') {
					dummyTagData[field.label] = 'Sales Manager';
				} else if (field.dataType === 'Dropdown select') {
					dummyTagData[field.label] = field.options[0].label;
				} else if (field.dataType === 'First Name') {
					dummyTagData[field.label] = 'Johnson';
				} else if (field.dataType === 'Ticket Query') {
					dummyTagData[field.label] = 'Hello, I want a sample of XYZ tablets.';
				} else if (field.dataType === 'Ticket Comment') {
					dummyTagData[field.label] = 'We are working on your request and will update you within the next 24 hours.';
				}
			}
		}
		let variables = [];
		let variable_examples = [];
		let tag = 1;
		let count = 0;
		flag = true;

		// console.log('---Variable List---', variableList);
		// console.log('---dummyTagData---', dummyTagData);

		while (flag) {
			let present = false;
			count++;
			for (let variable of variableList) {
				if (text.indexOf(`{{${variable}}}`) > -1) {
					present = true;
					variables.push({
						variable: variable,
						index: text.indexOf(variable),
						tag: `{{${tag}}}`,
						sampleData: dummyTagData[variable],
					});
					text = text.replace(`{{${variable}}}`, `{{${tag}}}`);
					tag++;
				}
			}
			if (!present || count > 25) {
				flag = false;
			}
		}

		if (variables.length > 0) {
			for (let variable of variables) {
				variable_examples.push(variable.sampleData);
			}
			return { text: text, variable_examples: variable_examples };
		} else {
			return { text: text, variable_examples: [] };
		}
	} catch (error) {
		console.log('---Error when Check and Update WhatsApp Variable---', error);
		return { text: text, variable_examples: [] };
	}
};

const convertSpecialChar = function (text) {
	try {
		return text.replaceAll('%', '%25').replaceAll('+', '%2B');
	} catch (error) {
		console.log('---Error Convert Special Char---', error);
	}
};
