const {
	Op,
	sequelize,
	Post,
	Post_detail,
	Post_header,
	Post_header_mapping,
	Campaign,
	User,
	User_group,
	User_group_mapping,
	User_role_client_mapping,
	Role,
	Asset,
	Asset_detail,
	Post_asset_mapping,
	Client,
	Client_job_role,
	Drip_native,
	DripOnlyTeam,
	DripSharingOnTeam,
	Drip_whatsapp_native,
	Drip_only_email,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Drip_camp,
	DripQuestion,
	DripOption,
	WhatsAppSetup,
	ClientWhatsAppSetup,
	Market,
	User_master,
	UplodedOnlyOnWhatsapp,
	UplodedDripAppWhatsapp,
	UplodedDripAppEmail,
	UplodedOnlyOnDripApp,
	PostBriefAsset,
	Bot_message,
	DripSpinWheelCat,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const { createWhatsAppTemplate, updateWhatsAppTemplate } = require('../services/whats-app.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const { createNotification, getAllUserIdsForNotification } = require('../services/notification.service');

const {
	getAllSubChildClientIdsForDrip,
	getAllSubClientAndBranchAccountLists,
	getClientAppBrandingByClientId,
} = require('../services/client.service');
const xlsxtojson = require('xlsx-to-json-lc');
const fs = require('fs');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const targetBaseUrl = CONFIG.web_host + '/#/';
const schedule = require('node-schedule');
const { capitalFirstLatter } = require('../services/auth.service');
const { createlog } = require('../services/log.service');
const axios = require('axios');
const shortid = require('shortid');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');

const trimStartAndEnd = async function (drip_data) {
	try {
		return drip_data.trimStart().trimEnd();
	} catch (error) {
		throw error;
	}
};
//  Cretae Drip

const createDrip = async function (req, res) {
	try {
		// Validate request parameters
		const schema = Joi.object({
			ClientId: Joi.number().integer().positive().required(),
		});
		const { error: paramError, value: paramValue } = schema.validate({
			ClientId: parseInt(req.params.clientId),
		});
		if (paramError) return ResponseError(res, { message: paramError.details[0].message }, 400);

		const { ClientId } = paramValue;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// Drip Details Payload Validation
		const dripValidationSchema = Joi.object({
			id: Joi.number().integer().allow(null).required(),
			drip_title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			drip_type: Joi.string()
				.valid(
					'Only WhatsApp',
					'DripApp with sharing on WhatsApp',
					'Only Email',
					'DripApp with sharing on Email',
					'Only DripApp',
					'Only Teams',
					'DripApp with sharing on Teams'
				)
				.required(),
			drip_description: Joi.string().allow(null, '').max(1000),
			drip_status: Joi.string().valid('Draft', 'Published', 'PFA').required(),
			requiredLogging: Joi.boolean().required(),
			externalLinkFlag: Joi.boolean().required(),
			externalLinkLabel1: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink1: Joi.string().uri().allow(null, ''),
			externalLinkLabel2: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink2: Joi.string().uri().allow(null, ''),
			externalLinkLabel3: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink3: Joi.string().uri().allow(null, ''),
			externalLinkLabel4: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink4: Joi.string().uri().allow(null, ''),
			externalLinkLabel5: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink5: Joi.string().uri().allow(null, ''),
			externalLinkLabel6: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink6: Joi.string().uri().allow(null, ''),
			externalLinkLabel7: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink7: Joi.string().uri().allow(null, ''),
			externalLinkLabel8: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink8: Joi.string().uri().allow(null, ''),
			externalLinkLabel9: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink9: Joi.string().uri().allow(null, ''),
			externalLinkLabel10: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink10: Joi.string().uri().allow(null, ''),
			showBackButton: Joi.boolean().required(), // Required boolean
			custTempPlaceholders: Joi.any(),
			customTemplate: Joi.any(),
			selected_asset_for_drip: Joi.any(),
		});

		const { error: dripValidationError, value: dripValidationValue } = dripValidationSchema.validate(
			req.body.drip_data
		);
		if (dripValidationError) return ResponseError(res, { message: dripValidationError.details[0].message }, 400);

		if (req.body.drip_data.drip_type == 'Only DripApp') {
			const onlyDripAppValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				OtherDripType: Joi.boolean().required(),
				existingDripId: Joi.number().integer().allow(null),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Video',
					// 	'Text',
					// 	'Poll',
					// 	'Quiz',
					// 	'Survey',
					// 	'Quiz (Randomised)',
					// 	'Offline task',
					// 	'Spin The Wheel'
					// )
					.required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1000),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				submitText: Joi.string().trim().max(validationConstant.title.max).required(),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
				htmlstring: Joi.string().required(),
			});
			const { error: onlyDripAppValidationerror, value: onlyDripAppValidationValue } =
				onlyDripAppValidationSchema.validate(req.body.native_drip_data);

			if (onlyDripAppValidationerror)
				return ResponseError(res, { message: onlyDripAppValidationerror.details[0].message }, 400);
		} else if (req.body.drip_data.drip_type == 'Only WhatsApp') {
			const onlyWhatsAppValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				header_type: Joi.string().valid('None', 'Text', 'Image', 'Video', 'Document', 'Location').required(),
				header_text: Joi.string().trim().max(60).allow(null).required(),
				body: Joi.string().trim().max(1024).required(),
				footer: Joi.string().trim().max(60).allow(null, ''),
				AssetId: Joi.number().integer().allow(null),
				quickReply1: Joi.string().trim().max(25).allow(null, ''),
				quickReply2: Joi.string().trim().max(25).allow(null, ''),
				quickReply3: Joi.string().trim().max(25).allow(null, ''),
				quickReply4: Joi.string().trim().max(25).allow(null, ''),
				quickReply5: Joi.string().trim().max(25).allow(null, ''),
				quickReply6: Joi.string().trim().max(25).allow(null, ''),
				quickReply7: Joi.string().trim().max(25).allow(null, ''),
				quickReply8: Joi.string().trim().max(25).allow(null, ''),
				quickReply9: Joi.string().trim().max(25).allow(null, ''),
				quickReply10: Joi.string().trim().max(25).allow(null, ''),
				templateStatus: Joi.string()
					.valid('Not Created', 'Pending', 'Approved', 'Rejected', 'Disabled', 'Flagged', 'Enabled')
					.required(),
				templateId: Joi.string().allow(null, ''),
				headerPath: Joi.string().allow(null, ''),
				headerFileName: Joi.string().allow(null, ''),
				interaction: Joi.string().allow(null, ''),
				callToActionText: Joi.string().trim().max(25).allow(null, ''),
				hyper_link: Joi.string().uri().allow(null, '').required(),
				callToActionText2: Joi.string().trim().max(25).allow(null, ''),
				hyper_link2: Joi.string().uri().allow(null, ''),
				tempCategory: Joi.string().trim().max(25).required(),
				tempLang: Joi.string().trim().max(10).required(),
				WhatsAppSetupId: Joi.number().integer().required(),
				tempName: Joi.string().trim().max(validationConstant.title.max).required(),
				trackableLink: Joi.boolean().required(),
				trackableLink2: Joi.boolean().required(),
				longitude: Joi.number().allow(null),
				latitude: Joi.number().allow(null),
				locName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				address: Joi.string().trim().max(500).allow(null, ''),
				callphonetext: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				callphoneno: Joi.string().trim().max(15).allow(null, ''),
				callphonetype: Joi.string().valid('Work', 'Home', 'Mobile').allow(null, ''),
				zoomMeetLink: Joi.string().uri().allow(null, ''),
				callToActionZoomText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				zoomTrackable: Joi.boolean().required(),
				ZoomMeetId: Joi.string().allow(null, ''),
				zoomMeetLink2: Joi.string().uri().allow(null, ''),
				callToActionZoomText2: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				zoomTrackable2: Joi.boolean().required(),
				ZoomMeetId2: Joi.string().allow(null, ''),
				quality: Joi.string().allow(null).required(),
				cta_sequence: Joi.string().required(),
				quickReplyFirst: Joi.boolean().required(),
			});

			const { error: onlyWhatsAppValidationError, value: onlyWhatsAppValidationValue } =
				onlyWhatsAppValidationSchema.validate(req.body.whatsApp_native_drip_data);
			if (onlyWhatsAppValidationError) {
				return ResponseError(res, { message: onlyWhatsAppValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'Only Email') {
			const onlyEmailValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				email_subject_line: Joi.string().trim().max(validationConstant.title.max).required(),
				email_body: Joi.string().trim().required(),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				caption: Joi.string().trim().allow(null, ''),
				templateType: Joi.string().allow(null, ''),
				isSendGridTemplate: Joi.boolean().required(),
				brod_attach_type: Joi.string(),
				brod_attach_path: Joi.string().allow(null, ''),
				brodEmailAssetPath: Joi.array().items(Joi.string()).allow(null),
				brodEmailAttachmentPath: Joi.array().items(Joi.string()).allow(null),
			});

			const { error: onlyEmailValidationError, value: onlyEmailValidationValue } = onlyEmailValidationSchema.validate(
				req.body.only_email_drip_data
			);

			if (onlyEmailValidationError) {
				return ResponseError(res, { message: onlyEmailValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'DripApp with sharing on WhatsApp') {
			const dripAppWhatsAppValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				header_type: Joi.string().valid('None', 'Text', 'Image', 'Video', 'Document', 'Location').required(),
				header_text: Joi.string().trim().max(60).allow(null, ''),
				AssetId: Joi.number().integer().allow(null),
				body: Joi.string().trim().max(1024).required(),
				footer: Joi.string().trim().max(60).allow(null, ''),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				interaction: Joi.string().valid('Call to Action', 'None').required(),
				callToActionText: Joi.string().trim().max(25).allow(null, ''),
				hyper_link: Joi.string().uri().allow(null, ''),
				OtherDripType: Joi.boolean().required(),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				existingDripId: Joi.number().integer().allow(null),
				templateStatus: Joi.string()
					.valid('Not Created', 'Pending', 'Approved', 'Rejected', 'Disabled', 'Flagged', 'Enabled')
					.required(),
				templateId: Joi.string().allow(null, ''),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Video',
					// 	'Text',
					// 	'Poll',
					// 	'Quiz',
					// 	'Spin The Wheel',
					// 	'Offline Task',
					// 	'Quiz (Randomised)',
					// 	'Survey',
					// 	'Custom Template'
					// )
					.required(),
				headerPath: Joi.string().allow(null, ''),
				headerFileName: Joi.string().allow(null, ''),
				tempCategory: Joi.string().trim().max(validationConstant.title.max).required(),
				tempLang: Joi.string().trim().max(10).required(),
				WhatsAppSetupId: Joi.number().integer().required(),
				tempName: Joi.string().trim().max(validationConstant.title.max).required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1024),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				longitude: Joi.number().allow(null),
				latitude: Joi.number().allow(null),
				locName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				address: Joi.string().trim().max(500).allow(null, ''),
				isZoomMeeting: Joi.boolean().required(),
				zoomMeetLink: Joi.string().uri().allow(null, ''),
				ZoomMeetText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				ZoomMeetId: Joi.string().allow(null, ''),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				quality: Joi.string().allow(null).required(),
				submitText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
			});
			const { error: dripAppWhatsAppValidationError, value: dripAppWhatsAppValidationValue } =
				dripAppWhatsAppValidationSchema.validate(req.body.whatsApp_non_native_drip_data);
			if (dripAppWhatsAppValidationError) {
				return ResponseError(res, { message: dripAppWhatsAppValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'DripApp with sharing on Email') {
			const dripAppEmailValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				email_subject_line: Joi.string().trim().max(validationConstant.title.max).required(),
				email_body: Joi.string().trim().required(),
				callToActionText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				hyper_link: Joi.string().allow(null, ''),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				OtherDripType: Joi.boolean().required(),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				existingDripId: Joi.number().integer().allow(null),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Video',
					// 	'Survey',
					// 	'Text',
					// 	'Poll',
					// 	'Quiz',
					// 	'Quiz (Randomised)',
					// 	'Offline task',
					// 	'Spin The Wheel'
					// )
					.required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1000),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				isSendGridTemplate: Joi.boolean().required(),
				brod_attach_type: Joi.string(),
				brod_attach_path: Joi.string().allow(null, ''),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				submitText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
				brodEmailAssetPath: Joi.array().items(Joi.string()).allow(null),
				brodEmailAttachmentPath: Joi.array().items(Joi.string()).allow(null),
				htmlstring: Joi.string().required(),
			});

			const { error: dripAppEmailValidationError, value: dripAppEmailValidationValue } =
				dripAppEmailValidationSchema.validate(req.body.email_non_native_drip_data);
			if (dripAppEmailValidationError) {
				return ResponseError(res, { message: dripAppEmailValidationError.details[0].message }, 400);
			}
		}

		let err;
		let WhatsAppTemplateErrorMsg;
		let drip_data = dripValidationValue;
		let selected_asset_for_drip = req.body.selected_asset_for_drip;
		let whatsApp_native_drip_data = req.body.whatsApp_native_drip_data;
		let whatsApp_non_native_drip_data = req.body.whatsApp_non_native_drip_data;
		let only_email_drip_data = req.body.only_email_drip_data;

		let email_non_native_drip_data = req.body.email_non_native_drip_data;
		let native_drip_data = req.body.native_drip_data;
		let only_teams_drip_data = req.body.only_teams_drip_data;
		let sharing_on_teams_drip_data = req.body.sharing_on_teams_drip_data;
		let question = req.body.DripQuestions;
		let spinWheelQueCategory = req.body.spinWheelQueCategory;
		let postBriefAssets = req.body.PostBriefAsset;
		// let ClientId = req.params.clientId;
		let userId = req.user.id;
		let isZoomMeeting = false;
		let client;

		// Add ClientId
		drip_data.ClientId = ClientId;
		drip_data.UserId = userId;
		whatsApp_native_drip_data.ClientId = ClientId;
		whatsApp_non_native_drip_data.ClientId = ClientId;
		only_email_drip_data.ClientId = ClientId;
		email_non_native_drip_data.ClientId = ClientId;
		native_drip_data.ClientId = ClientId;
		only_teams_drip_data.ClientId = ClientId;
		sharing_on_teams_drip_data.ClientId = ClientId;
		//check Only WhatsApp  Zoom Link
		if (whatsApp_native_drip_data?.zoomMeetLink || whatsApp_native_drip_data?.zoomMeetLink2) {
			isZoomMeeting = true;
		}

		// Add CaptionIto Post
		if (whatsApp_non_native_drip_data.caption) {
			drip_data.caption = whatsApp_non_native_drip_data.caption;
		} else if (email_non_native_drip_data.caption) {
			drip_data.caption = email_non_native_drip_data.caption;
		} else if (native_drip_data.caption) {
			drip_data.caption = native_drip_data.caption;
		} else if (sharing_on_teams_drip_data.caption) {
			drip_data.caption = sharing_on_teams_drip_data.caption;
		}

		//Add Brief
		if (whatsApp_non_native_drip_data.brief) {
			drip_data.brief = whatsApp_non_native_drip_data.brief;
		} else if (email_non_native_drip_data.brief) {
			drip_data.brief = email_non_native_drip_data.brief;
		} else if (native_drip_data.brief) {
			drip_data.brief = native_drip_data.brief;
		} else if (sharing_on_teams_drip_data.brief) {
			drip_data.brief = sharing_on_teams_drip_data.brief;
		}

		if (whatsApp_non_native_drip_data.templateType) {
			drip_data.tempType = whatsApp_non_native_drip_data.templateType;
		} else if (email_non_native_drip_data.templateType) {
			drip_data.tempType = email_non_native_drip_data.templateType;
		} else if (native_drip_data.templateType) {
			drip_data.tempType = native_drip_data.templateType;
		} else if (sharing_on_teams_drip_data.templateType) {
			drip_data.tempType = sharing_on_teams_drip_data.templateType;
		}

		//Add Should Show Correct Answer After Submit
		if (whatsApp_non_native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = whatsApp_non_native_drip_data.showCorrectAns;
		} else if (email_non_native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = email_non_native_drip_data.showCorrectAns;
		} else if (native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = native_drip_data.showCorrectAns;
		} else if (sharing_on_teams_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = sharing_on_teams_drip_data.showCorrectAns;
		} else {
			drip_data.showCorrectAns = false;
		}

		//Quiz show correct incorrect base on type
		if (whatsApp_non_native_drip_data.quizResultType) {
			drip_data.quizResultType = whatsApp_non_native_drip_data.quizResultType;
		} else if (email_non_native_drip_data.quizResultType) {
			drip_data.quizResultType = email_non_native_drip_data.quizResultType;
		} else if (native_drip_data.quizResultType) {
			drip_data.quizResultType = native_drip_data.quizResultType;
		} else if (sharing_on_teams_drip_data.quizResultType) {
			drip_data.quizResultType = sharing_on_teams_drip_data.quizResultType;
		}

		if (whatsApp_non_native_drip_data.timehours) {
			drip_data.timehours = whatsApp_non_native_drip_data.timehours;
		} else if (email_non_native_drip_data.timehours) {
			drip_data.timehours = email_non_native_drip_data.timehours;
		} else if (native_drip_data.timehours) {
			drip_data.timehours = native_drip_data.timehours;
		} else if (sharing_on_teams_drip_data.timehours) {
			drip_data.timehours = sharing_on_teams_drip_data.timehours;
		}

		if (whatsApp_non_native_drip_data.pollResultType) {
			drip_data.pollResultType = whatsApp_non_native_drip_data.pollResultType;
		} else if (email_non_native_drip_data.pollResultType) {
			drip_data.pollResultType = email_non_native_drip_data.pollResultType;
		} else if (native_drip_data.pollResultType) {
			drip_data.pollResultType = native_drip_data.pollResultType;
		} else if (sharing_on_teams_drip_data.pollResultType) {
			drip_data.pollResultType = sharing_on_teams_drip_data.pollResultType;
		}

		if (whatsApp_non_native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(whatsApp_non_native_drip_data.quizRandCount);
		} else if (email_non_native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(email_non_native_drip_data.quizRandCount);
		} else if (native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(native_drip_data.quizRandCount);
		} else if (sharing_on_teams_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(sharing_on_teams_drip_data.quizRandCount);
		}

		// Add header to Post
		if (whatsApp_non_native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = whatsApp_non_native_drip_data.pwaheadtxt;
		} else if (email_non_native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = email_non_native_drip_data.pwaheadtxt;
		} else if (native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = native_drip_data.pwaheadtxt;
		} else if (sharing_on_teams_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = sharing_on_teams_drip_data.pwaheadtxt;
		}

		// Add Survey Submit Text to Post
		if (whatsApp_non_native_drip_data.submitText) {
			drip_data.submitText = whatsApp_non_native_drip_data.submitText;
		} else if (email_non_native_drip_data.submitText) {
			drip_data.submitText = email_non_native_drip_data.submitText;
		} else if (native_drip_data.submitText) {
			drip_data.submitText = native_drip_data.submitText;
		} else if (sharing_on_teams_drip_data.submitText) {
			drip_data.submitText = sharing_on_teams_drip_data.submitText;
		}

		// Add html string to Post
		if (whatsApp_non_native_drip_data.htmlstring) {
			drip_data.htmlstring = whatsApp_non_native_drip_data.htmlstring;
		} else if (email_non_native_drip_data.htmlstring) {
			drip_data.htmlstring = email_non_native_drip_data.htmlstring;
		} else if (native_drip_data.htmlstring) {
			drip_data.htmlstring = native_drip_data.htmlstring;
		} else if (sharing_on_teams_drip_data.htmlstring) {
			drip_data.htmlstring = sharing_on_teams_drip_data.htmlstring;
		}

		if (whatsApp_non_native_drip_data.isZoomMeeting) {
			isZoomMeeting = true;
		}
		drip_data.drip_title = await capitalFirstLatter(drip_data.drip_title);
		drip_data.SystemBrandingId = null;
		let appBranding = await getClientAppBrandingByClientId(drip_data.ClientId);

		drip_data.isZoomMeeting = isZoomMeeting;

		if (appBranding) drip_data.SystemBrandingId = appBranding.id;

		[err, _createDrip] = await to(Post.create(drip_data));
		if (err) return ResponseError(res, err, 500, true);

		let dripId = _createDrip.id;

		// Add Drip Id
		whatsApp_native_drip_data.PostId = dripId;
		whatsApp_non_native_drip_data.PostId = dripId;
		only_email_drip_data.PostId = dripId;
		email_non_native_drip_data.PostId = dripId;
		native_drip_data.PostId = dripId;
		only_teams_drip_data.PostId = dripId;
		sharing_on_teams_drip_data.PostId = dripId;

		//Check and Add offline Task Brief Asset Mapping
		if (postBriefAssets && postBriefAssets.length > 0) {
			let count = 1;
			let briefData = [];
			for (let asset of postBriefAssets) {
				let payload = {
					PostId: dripId,
					AssetId: asset.AssetId,
					index: count,
					forPreview: asset.forPreview,
				};
				briefData.push(payload);
				count++;
			}
			if (briefData && briefData.length > 0) {
				[err, addBriefPostMapping] = await to(PostBriefAsset.bulkCreate(briefData));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		// `${environment.appUrl}?dripId=${drip.Client.client_id + '-' + drip.id}`;
		let hyper_link = ``;
		[err, client] = await to(
			Client.findOne({
				//Check Code and Add attrbute
				where: {
					id: ClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		hyper_link = `${CONFIG.pwa_base_url}?dripId=${client.client_id}-${dripId}`;

		if (
			whatsApp_non_native_drip_data.contentType == 'Hyperlink to other content' ||
			whatsApp_non_native_drip_data.contentType == 'Use Existing Drip'
		) {
			hyper_link = whatsApp_non_native_drip_data.hyper_link;
		} else if (
			email_non_native_drip_data.contentType == 'Hyperlink to other content' ||
			email_non_native_drip_data.contentType == 'Use Existing Drip'
		) {
			hyper_link = email_non_native_drip_data.hyper_link;
		}

		if (hyper_link) {
			[err, update_drip] = await to(
				Post.update(
					{
						hyper_link: hyper_link,
					},
					{
						where: {
							id: dripId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		whatsApp_non_native_drip_data.hyper_link = hyper_link;
		email_non_native_drip_data.hyper_link = hyper_link;
		sharing_on_teams_drip_data.hyper_link = hyper_link;
		let index = 0;
		if (selected_asset_for_drip && selected_asset_for_drip.length > 0) {
			for (let asset of selected_asset_for_drip) {
				index++;
				let payload = {
					PostId: dripId,
					AssetId: asset.AssetId,
					index: index,
				};

				[err, drip_asset] = await to(Post_asset_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (whatsApp_native_drip_data.body) {
			// whatsApp_native_drip_data.body = whatsApp_native_drip_data.body.trimStart().trimEnd();
			whatsApp_native_drip_data.body = await trimStartAndEnd(whatsApp_native_drip_data.body);
		}
		if (whatsApp_native_drip_data.footer) {
			// whatsApp_native_drip_data.footer = whatsApp_native_drip_data.footer.trimStart().trimEnd();
			whatsApp_native_drip_data.footer = await trimStartAndEnd(whatsApp_native_drip_data.footer);
		}
		if (whatsApp_native_drip_data.header_text) {
			// whatsApp_native_drip_data.header_text = whatsApp_native_drip_data.header_text.trimStart().trimEnd();
			whatsApp_native_drip_data.header_text = await trimStartAndEnd(whatsApp_native_drip_data.header_text);
		}
		if (whatsApp_native_drip_data.callToActionText) {
			// whatsApp_native_drip_data.callToActionText = whatsApp_native_drip_data.callToActionText.trimStart().trimEnd();
			whatsApp_native_drip_data.callToActionText = await trimStartAndEnd(whatsApp_native_drip_data.callToActionText);
		}

		if (whatsApp_native_drip_data.callToActionText2) {
			// whatsApp_native_drip_data.callToActionText2 = whatsApp_native_drip_data.callToActionText2.trimStart().trimEnd();
			whatsApp_native_drip_data.callToActionText2 = await trimStartAndEnd(whatsApp_native_drip_data.callToActionText2);
		}

		if (whatsApp_native_drip_data.quickReply1) {
			// whatsApp_native_drip_data.quickReply1 = whatsApp_native_drip_data.quickReply1.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply1 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply1);
		}

		if (whatsApp_native_drip_data.quickReply2) {
			// whatsApp_native_drip_data.quickReply2 = whatsApp_native_drip_data.quickReply2.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply2 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply2);
		}

		if (whatsApp_native_drip_data.quickReply3) {
			// whatsApp_native_drip_data.quickReply3 = whatsApp_native_drip_data.quickReply3.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply3 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply3);
		}

		if (whatsApp_native_drip_data.quickReply4) {
			// whatsApp_native_drip_data.quickReply4 = whatsApp_native_drip_data.quickReply4.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply4 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply4);
		}

		if (whatsApp_native_drip_data.quickReply5) {
			// whatsApp_native_drip_data.quickReply5 = whatsApp_native_drip_data.quickReply5.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply5 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply5);
		}

		if (whatsApp_native_drip_data.quickReply6) {
			// whatsApp_native_drip_data.quickReply6 = whatsApp_native_drip_data.quickReply6.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply6 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply6);
		}

		if (whatsApp_native_drip_data.quickReply7) {
			// whatsApp_native_drip_data.quickReply7 = whatsApp_native_drip_data.quickReply7.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply7 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply7);
		}

		if (whatsApp_native_drip_data.quickReply8) {
			// whatsApp_native_drip_data.quickReply8 = whatsApp_native_drip_data.quickReply8.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply8 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply8);
		}

		if (whatsApp_native_drip_data.quickReply9) {
			// whatsApp_native_drip_data.quickReply9 = whatsApp_native_drip_data.quickReply9.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply9 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply9);
		}

		if (whatsApp_native_drip_data.quickReply10) {
			// whatsApp_native_drip_data.quickReply10 = whatsApp_native_drip_data.quickReply10.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply10 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply10);
		}

		if (whatsApp_native_drip_data?.trackableLink || whatsApp_native_drip_data?.trackableLink2) {
			whatsApp_native_drip_data.type = 'dynamic';
		} else {
			whatsApp_native_drip_data.type = 'static';
		}

		if (whatsApp_non_native_drip_data.body) {
			// whatsApp_non_native_drip_data.body = whatsApp_non_native_drip_data.body.trimStart().trimEnd();
			whatsApp_non_native_drip_data.body = await trimStartAndEnd(whatsApp_non_native_drip_data.body);
		}
		if (whatsApp_non_native_drip_data.footer) {
			// whatsApp_non_native_drip_data.footer = whatsApp_non_native_drip_data.footer.trimStart().trimEnd();
			whatsApp_non_native_drip_data.footer = await trimStartAndEnd(whatsApp_non_native_drip_data.footer);
		}
		if (whatsApp_non_native_drip_data.header_text) {
			// whatsApp_non_native_drip_data.header_text = whatsApp_non_native_drip_data.header_text.trimStart().trimEnd();
			whatsApp_non_native_drip_data.header_text = await trimStartAndEnd(whatsApp_non_native_drip_data.header_text);
		}
		if (whatsApp_non_native_drip_data.callToActionText) {
			// whatsApp_non_native_drip_data.callToActionText = whatsApp_non_native_drip_data.callToActionText
			// 	.trimStart()
			// 	.trimEnd();
			whatsApp_non_native_drip_data.callToActionText = await trimStartAndEnd(
				whatsApp_non_native_drip_data.callToActionText
			);
		}

		if (whatsApp_non_native_drip_data.quickReply1) {
			// whatsApp_non_native_drip_data.quickReply1 = whatsApp_non_native_drip_data.quickReply1.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply1 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply1);
		}

		if (whatsApp_non_native_drip_data.quickReply2) {
			// whatsApp_non_native_drip_data.quickReply2 = whatsApp_non_native_drip_data.quickReply2.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply2 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply2);
		}

		if (whatsApp_non_native_drip_data.quickReply3) {
			// whatsApp_non_native_drip_data.quickReply3 = whatsApp_non_native_drip_data.quickReply3.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply3 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply3);
		}

		//---------------Teams Only Drip type------------
		if (only_teams_drip_data.body) {
			only_teams_drip_data.body = await trimStartAndEnd(only_teams_drip_data.body);
		}

		if (only_teams_drip_data.header_text) {
			only_teams_drip_data.header_text = await trimStartAndEnd(only_teams_drip_data.header_text);
		}
		if (only_teams_drip_data.callToActionText1) {
			only_teams_drip_data.callToActionText1 = await trimStartAndEnd(only_teams_drip_data.callToActionText1);
		}

		if (only_teams_drip_data.callToActionText2) {
			only_teams_drip_data.callToActionText2 = await trimStartAndEnd(only_teams_drip_data.callToActionText2);
		}
		if (only_teams_drip_data.callToActionText3) {
			only_teams_drip_data.callToActionText3 = await trimStartAndEnd(only_teams_drip_data.callToActionText3);
		}

		//---------------Teams Sharing Drip type------------
		if (sharing_on_teams_drip_data.body) {
			sharing_on_teams_drip_data.body = await trimStartAndEnd(sharing_on_teams_drip_data.body);
		}

		if (sharing_on_teams_drip_data.header_text) {
			sharing_on_teams_drip_data.header_text = await trimStartAndEnd(sharing_on_teams_drip_data.header_text);
		}
		if (sharing_on_teams_drip_data.callToActionText) {
			sharing_on_teams_drip_data.callToActionText = await trimStartAndEnd(sharing_on_teams_drip_data.callToActionText);
		}

		if (drip_data.drip_type == 'Only WhatsApp') {
			[err, _create_whatsApp_native_drip] = await to(Drip_whatsapp_native.create(whatsApp_native_drip_data));
			if (err) return ResponseError(res, err, 500, true);

			let post = _createDrip.convertToJSON();
			post.hyper_link = hyper_link;

			[err, getWhatsAppNative] = await to(
				Drip_whatsapp_native.findOne({
					where: {
						id: _create_whatsApp_native_drip.id,
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
								'canChangeTempCat',
								'isMeta',
								'MTPNoId',
								'MTToken',
								'MTAccId',
								'MTAppId',
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (
				getWhatsAppNative &&
				getWhatsAppNative.WhatsAppSetup &&
				(post.drip_status == 'Published' || post.drip_status == 'PFA')
			) {
				let response = await createWhatsAppTemplate(getWhatsAppNative.convertToJSON(), post, 'Only WhatsApp', ClientId);
				console.log('-response-', response);
				if (response && response.template_id) {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_native.update(
							{
								templateId: response.template_id.toString(),
								templateStatus: 'Pending',
							},
							{
								where: {
									id: getWhatsAppNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				} else {
					console.log('----Error when Update WhatsApp Template Id--', response.details);
					WhatsAppTemplateErrorMsg = response.details;
					[err, updateErrorMsg] = await to(
						Drip_whatsapp_native.update(
							{
								errorMsg: response.details,
							},
							{
								where: {
									id: getWhatsAppNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);

					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				}
			} else if (!getWhatsAppNative || (getWhatsAppNative && getWhatsAppNative.WhatsAppSetupId == null)) {
				WhatsAppTemplateErrorMsg = 'WhatsApp Setup Not Found.';
				[err, updateErrorMsg] = await to(
					Drip_whatsapp_native.update(
						{
							errorMsg: 'WhatsApp Setup Not Found.',
						},
						{
							where: {
								id: getWhatsAppNative.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				if (post && post.id) {
					[err, updateDripStatus] = await to(
						Post.update(
							{
								drip_status: 'PFA',
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
				}
			}
		} else if (drip_data.drip_type == 'DripApp with sharing on WhatsApp') {
			whatsApp_non_native_drip_data.interaction = 'Call to Action';
			whatsApp_non_native_drip_data.type = 'dynamic';
			[err, _create_whatsApp_non_native_drip] = await to(
				Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
			);
			if (err) return ResponseError(res, err, 500, true);

			let post = _createDrip.convertToJSON();
			post.hyper_link = hyper_link;
			[err, getWhatsAppNonNative] = await to(
				Drip_whatsapp_non_native.findOne({
					where: {
						id: _create_whatsApp_non_native_drip.id,
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
								'canChangeTempCat',
								'isMeta',
								'MTPNoId',
								'MTToken',
								'MTAccId',
								'MTAppId',
							],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (
				getWhatsAppNonNative &&
				getWhatsAppNonNative.WhatsAppSetup &&
				(post.drip_status == 'Published' || post.drip_status == 'PFA')
			) {
				let response = await createWhatsAppTemplate(
					getWhatsAppNonNative,
					post,
					'DripApp with sharing on WhatsApp',
					ClientId
				);

				console.log('----WhatsApp Non Native Template Create Response--', response);

				if (response && response.template_id) {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_non_native.update(
							{
								templateId: response.template_id.toString(),
								templateStatus: 'Pending',
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);

					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				} else {
					console.log('----Error when Update WhatsApp Template Id--', response?.details);
					WhatsAppTemplateErrorMsg = response?.details;
					[err, updateTemplateId] = await to(
						Drip_whatsapp_non_native.update(
							{
								errorMsg: response?.details,
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				}
			} else if (!getWhatsAppNonNative || (getWhatsAppNonNative && getWhatsAppNonNative.WhatsAppSetupId == null)) {
				WhatsAppTemplateErrorMsg = 'WhatsApp Setup Not Found.';
				[err, updateErrorMsg] = await to(
					Drip_whatsapp_non_native.update(
						{
							errorMsg: 'WhatsApp Setup Not Found.',
						},
						{
							where: {
								id: getWhatsAppNonNative.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
				if (post && post.id) {
					[err, updateDripStatus] = await to(
						Post.update(
							{
								drip_status: 'PFA',
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
				}
			}

			if (whatsApp_non_native_drip_data.OtherDripType) {
				[err, _create_email_non_native_drip] = await to(Drip_email_non_native.create(email_non_native_drip_data));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (drip_data.drip_type == 'Only Email') {
			[err, _create_only_email_drip] = await to(Drip_only_email.create(only_email_drip_data));
			if (err) return ResponseError(res, err, 500, true);

			//only email broadside template upload to broadside server
			if (_create_only_email_drip && only_email_drip_data.email_body && !client.useSendGrid) {
				const response = await uploadBroadSideEmailTemplateFileOnServer(
					_create_only_email_drip.id,
					only_email_drip_data,
					'Only Email'
				);
				// console.log('----Only Email Template Upload Response----', response.data);
			}
		} else if (drip_data.drip_type == 'DripApp with sharing on Email') {
			[err, _create_email_non_native_drip] = await to(Drip_email_non_native.create(email_non_native_drip_data));
			if (err) return ResponseError(res, err, 500, true);

			if (email_non_native_drip_data.OtherDripType) {
				whatsApp_non_native_drip_data.interaction = 'Call to Action';
				whatsApp_non_native_drip_data.type = 'dynamic';
				[err, _create_whatsApp_non_native_drip] = await to(
					Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
				);
				if (err) return ResponseError(res, err, 500, true);

				let post = _createDrip.convertToJSON();
				post.hyper_link = hyper_link;

				[err, getWhatsAppNonNative] = await to(
					Drip_whatsapp_non_native.findOne({
						where: {
							id: _create_whatsApp_non_native_drip.id,
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
									'canChangeTempCat',
									'isMeta',
									'MTPNoId',
									'MTToken',
									'MTAccId',
									'MTAppId',
								],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (
					getWhatsAppNonNative &&
					getWhatsAppNonNative.WhatsAppSetup &&
					(post.drip_status == 'Published' || post.drip_status == 'PFA')
				) {
					let response = await createWhatsAppTemplate(
						getWhatsAppNonNative,
						post,
						'DripApp with sharing on WhatsApp',
						ClientId
					);

					console.log('----WhatsApp Non Native Template Create Response--', response);

					if (response && response.template_id) {
						[err, updateTemplateId] = await to(
							Drip_whatsapp_non_native.update(
								{
									templateId: response.template_id.toString(),
									templateStatus: 'Pending',
								},
								{
									where: {
										id: getWhatsAppNonNative.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);

						if (post && post.id) {
							[err, updateDripStatus] = await to(
								Post.update(
									{
										drip_status: 'PFA',
									},
									{
										where: {
											id: post.id,
										},
									}
								)
							);
						}
					} else {
						console.log('----Error when Update WhatsApp Template Id--', response.details);
						WhatsAppTemplateErrorMsg = response.details;
						[err, updateTemplateId] = await to(
							Drip_whatsapp_non_native.update(
								{
									errorMsg: response.details,
									templateStatus: 'Not Created',
								},
								{
									where: {
										id: getWhatsAppNonNative.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
						if (post && post.id) {
							[err, updateDripStatus] = await to(
								Post.update(
									{
										drip_status: 'PFA',
									},
									{
										where: {
											id: post.id,
										},
									}
								)
							);
						}
					}
				} else {
					WhatsAppTemplateErrorMsg = MESSAGE.DRIP_WHATSAPP_SETUP_NOT_FOUND;
					[err, updateErrorMsg] = await to(
						Drip_whatsapp_non_native.update(
							{
								errorMsg: 'WhatsApp Setup Not Found.',
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				}
			}

			//native email broadside template upload to broadside server
			if (_create_email_non_native_drip && email_non_native_drip_data.email_body && !client.useSendGrid) {
				const response = await uploadBroadSideEmailTemplateFileOnServer(
					_create_email_non_native_drip.id,
					email_non_native_drip_data,
					'DripApp with sharing on Email'
				);
				// console.log('----DripApp with sharing on Email Template Upload Response----', response.data);
			}
		} else if (drip_data.drip_type == 'Only DripApp') {
			[err, _create_drip_native] = await to(Drip_native.create(native_drip_data));
			if (err) return ResponseError(res, err, 500, true);

			if (native_drip_data.OtherDripType) {
				whatsApp_non_native_drip_data.interaction = 'Call to Action';
				whatsApp_non_native_drip_data.type = 'dynamic';
				[err, _create_whatsApp_non_native_drip] = await to(
					Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
				);
				if (err) return ResponseError(res, err, 500, true);

				let post = _createDrip.convertToJSON();
				post.hyper_link = hyper_link;

				[err, getWhatsAppNonNative] = await to(
					Drip_whatsapp_non_native.findOne({
						where: {
							id: _create_whatsApp_non_native_drip.id,
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
									'canChangeTempCat',
									'isMeta',
									'MTPNoId',
									'MTToken',
									'MTAccId',
									'MTAppId',
								],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (
					getWhatsAppNonNative &&
					getWhatsAppNonNative.WhatsAppSetup &&
					(post.drip_status == 'Published' || post.drip_status == 'PFA')
				) {
					let response = await createWhatsAppTemplate(
						getWhatsAppNonNative,
						post,
						'DripApp with sharing on WhatsApp',
						ClientId
					);

					console.log('----WhatsApp Non Native Template Create Response--', response);

					if (response && response.template_id) {
						[err, updateTemplateId] = await to(
							Drip_whatsapp_non_native.update(
								{
									templateId: response.template_id.toString(),
									templateStatus: 'Pending',
								},
								{
									where: {
										id: getWhatsAppNonNative.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
						if (post && post.id) {
							[err, updateDripStatus] = await to(
								Post.update(
									{
										drip_status: 'PFA',
									},
									{
										where: {
											id: post.id,
										},
									}
								)
							);
						}
					} else {
						console.log('----Error when Update WhatsApp Template Id--', response.details);
						WhatsAppTemplateErrorMsg = response.details;
						[err, updateTemplateId] = await to(
							Drip_whatsapp_non_native.update(
								{
									errorMsg: response.details,
								},
								{
									where: {
										id: getWhatsAppNonNative.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
						if (post && post.id) {
							[err, updateDripStatus] = await to(
								Post.update(
									{
										drip_status: 'PFA',
									},
									{
										where: {
											id: post.id,
										},
									}
								)
							);
						}
					}
				} else {
					WhatsAppTemplateErrorMsg = 'WhatsApp Setup Not Found.';
					[err, updateErrorMsg] = await to(
						Drip_whatsapp_non_native.update(
							{
								errorMsg: 'WhatsApp Setup Not Found.',
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				[err, _create_email_non_native_drip] = await to(Drip_email_non_native.create(email_non_native_drip_data));
				if (err) return ResponseError(res, err, 500, true);

				if (post && post.id) {
					[err, updateDripStatus] = await to(
						Post.update(
							{
								drip_status: 'PFA',
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
				}
			}
		} else if (drip_data.drip_type == 'Only Teams') {
			[err, _create_only_teams_drip] = await to(DripOnlyTeam.create(only_teams_drip_data));
			if (err) return ResponseError(res, err, 500, true);
		} else if (drip_data.drip_type == 'DripApp with sharing on Teams') {
			[err, _create_drip_sharing_on_teams] = await to(DripSharingOnTeam.create(sharing_on_teams_drip_data));
			if (err) return ResponseError(res, err, 500, true);
		}

		//Create Spin The Wheel question Category
		if (spinWheelQueCategory && drip_data.tempType == 'Spin The Wheel' && spinWheelQueCategory.length > 0) {
			let spinWheelQueCategoryArray = [];
			for (let question_category of spinWheelQueCategory) {
				// Create Question Category
				spinWheelQueCategoryArray.push({
					PostId: dripId,
					category_index: question_category.category_index,
					category_name: question_category.category_name.trimStart().trimEnd(),
					totalquestion: question_category.totalquestion,
					totalscore: question_category.totalscore,
					characterRemain: question_category.characterRemain,
				});
			}

			[err, createSpinCategory] = await to(DripSpinWheelCat.bulkCreate(spinWheelQueCategoryArray, { returning: true }));
			if (err) return ResponseError(res, err, 500, true);

			// Iterate over each Spin Category
			for (const queCategory_ of createSpinCategory) {
				const queCategory = queCategory_.convertToJSON();
				for (let que of question) {
					if (queCategory.category_index === que.spinCatIndex) {
						que.DripSpinWheelCatId = queCategory.id;
					}
				}
			}
		}

		if (question && question.length > 0) {
			for (let que of question) {
				if (que.question && que.questionType) {
					let payload = {
						PostId: dripId,
						question: que.question,
						questionType: que.questionType,
						ClientId: ClientId,
						AssetId: que.AssetId,
						allowFileTypes: que.allowFileTypes,
						fileSize: que.fileSize,
						numberOfFiles: que.numberOfFiles,
						isTextResponse: que.isTextResponse,
						isFileSubmission: que.isFileSubmission,
						surveyCharLimit: que.surveyCharLimit,
						multipleOption: que.multipleOption,
						ratingScaleMinCount: que.ratingScaleMinCount,
						ratingScaleMaxCount: que.ratingScaleMaxCount,
						isQuesRequired: que.isQuesRequired,
						zoomLinkTo: que.zoomLinkTo,
						UploadOnVimeo: que.UploadOnVimeo,
						showTranscript: que.showTranscript,
						aiReview: que.aiReview,
						expectedAnswer: que.expectedAnswer,
						spinCatIndex: que.spinCatIndex,
						spinQueScore: que.spinQueScore,
						DripSpinWheelCatId: que.DripSpinWheelCatId,
						ratingType: que.ratingType,
						ratingMinLabel: que.ratingMinLabel,
						ratingMaxLabel: que.ratingMaxLabel,
					};
					[err, create_question] = await to(DripQuestion.create(payload));
					if (err) return ResponseError(res, err, 500, true);
					let count = 1;
					for (let opt of que.DripOptions) {
						let payload = {
							PostId: dripId,
							ClientId: ClientId,
							DripQuestionId: create_question.id,
							isCorrectAnswer: opt.isCorrectAnswer,
							AssetId: opt.AssetId,
							text: opt.text,
							sr_no: count,
							skipQueType: opt.skipQueType,
						};
						[err, create_option] = await to(DripOption.create(payload));
						if (err) return ResponseError(res, err, 500, true);
						count++;
					}
				}
			}
		}

		//For Notification
		[err, getUser] = await to(
			User.findOne({
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

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// let userIds = await getAllUserIdsForNotification(parseInt(ClientId));
		// await createNotification(notifcationMessage, ['Bell'], userIds);
		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.CREATE_DRIP;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		notifcationMessage = notifcationMessage.replace('{{drip_name}}', drip_data.drip_title);

		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Create Drip`, req.ip, req.useragent, req.user.type, {
				PostId: dripId,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIP_CREATED,
			TemplateErrorMsg: WhatsAppTemplateErrorMsg,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDrip = createDrip;

//  Update Drip
const updateDrip = async function (req, res) {
	try {
		// Validate request parameters
		const schema = Joi.object({
			ClientId: Joi.number().integer().positive().required(),
		});
		const { error: paramError, value: paramValue } = schema.validate({
			ClientId: parseInt(req.params.clientId),
		});
		if (paramError) return ResponseError(res, { message: paramError.details[0].message }, 400);

		const { ClientId } = paramValue;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// Drip Details Payload Validation
		const dripValidationSchema = Joi.object({
			id: Joi.number().integer().required(),
			drip_title: Joi.string().trim().min(validationConstant.title.min).max(validationConstant.title.max).required(),
			drip_type: Joi.string()
				.valid(
					'Only WhatsApp',
					'DripApp with sharing on WhatsApp',
					'Only Email',
					'DripApp with sharing on Email',
					'Only DripApp',
					'Only Teams',
					'DripApp with sharing on Teams'
				)
				.required(),
			drip_description: Joi.string().allow(null, '').max(1000),
			drip_status: Joi.string().valid('Draft', 'Published', 'PFA').required(),
			requiredLogging: Joi.boolean().required(),
			externalLinkFlag: Joi.boolean().required(),
			externalLinkLabel1: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink1: Joi.string().uri().allow(null, ''),
			externalLinkLabel2: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink2: Joi.string().uri().allow(null, ''),
			externalLinkLabel3: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink3: Joi.string().uri().allow(null, ''),
			externalLinkLabel4: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink4: Joi.string().uri().allow(null, ''),
			externalLinkLabel5: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink5: Joi.string().uri().allow(null, ''),
			externalLinkLabel6: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink6: Joi.string().uri().allow(null, ''),
			externalLinkLabel7: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink7: Joi.string().uri().allow(null, ''),
			externalLinkLabel8: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink8: Joi.string().uri().allow(null, ''),
			externalLinkLabel9: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink9: Joi.string().uri().allow(null, ''),
			externalLinkLabel10: Joi.string().allow(null, '').max(validationConstant.title.max),
			externalLink10: Joi.string().uri().allow(null, ''),
			showBackButton: Joi.boolean().required(), // Required boolean
			custTempPlaceholders: Joi.any(),
			customTemplate: Joi.any(),
			selected_asset_for_drip: Joi.any(),
		});

		const { error: dripValidationError, value: dripValidationValue } = dripValidationSchema.validate(
			req.body.drip_data
		);
		if (dripValidationError) return ResponseError(res, { message: dripValidationError.details[0].message }, 400);

		if (req.body.drip_data.drip_type == 'Only DripApp') {
			const onlyDripAppValidationSchema = Joi.object({
				id: Joi.number().integer(),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				OtherDripType: Joi.boolean().required(),
				existingDripId: Joi.number().integer().allow(null),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Video',
					// 	'Text',
					// 	'Survey',
					// 	'Poll',
					// 	'Quiz',
					// 	'Quiz (Randomised)',
					// 	'Offline task',
					// 	'Spin The Wheel'
					// )
					.required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1000),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				submitText: Joi.string().trim().max(validationConstant.title.max).required(),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
				htmlstring: Joi.string().required(),
			});
			const { error: onlyDripAppValidationerror, value: onlyDripAppValidationValue } =
				onlyDripAppValidationSchema.validate(req.body.native_drip_data);

			if (onlyDripAppValidationerror)
				return ResponseError(res, { message: onlyDripAppValidationerror.details[0].message }, 400);
		} else if (req.body.drip_data.drip_type == 'Only WhatsApp') {
			const onlyWhatsAppValidationSchema = Joi.object({
				id: Joi.number().integer(),
				header_type: Joi.string().valid('None', 'Text', 'Image', 'Video', 'Document', 'Location').required(),
				header_text: Joi.string().trim().max(60).allow(null).required(),
				body: Joi.string().trim().max(1024).required(),
				footer: Joi.string().trim().max(60).allow(null, ''),
				AssetId: Joi.number().integer().allow(null),
				quickReply1: Joi.string().trim().max(25).allow(null, ''),
				quickReply2: Joi.string().trim().max(25).allow(null, ''),
				quickReply3: Joi.string().trim().max(25).allow(null, ''),
				quickReply4: Joi.string().trim().max(25).allow(null, ''),
				quickReply5: Joi.string().trim().max(25).allow(null, ''),
				quickReply6: Joi.string().trim().max(25).allow(null, ''),
				quickReply7: Joi.string().trim().max(25).allow(null, ''),
				quickReply8: Joi.string().trim().max(25).allow(null, ''),
				quickReply9: Joi.string().trim().max(25).allow(null, ''),
				quickReply10: Joi.string().trim().max(25).allow(null, ''),
				templateStatus: Joi.string()
					.valid('Not Created', 'Pending', 'Approved', 'Rejected', 'Disabled', 'Flagged', 'Enabled')
					.required(),
				templateId: Joi.string().allow(null, ''),
				headerPath: Joi.string().allow(null, ''),
				headerFileName: Joi.string().allow(null, ''),
				interaction: Joi.string().allow(null, ''),
				callToActionText: Joi.string().trim().max(25).allow(null, ''),
				hyper_link: Joi.string().uri().allow(null, '').required(),
				callToActionText2: Joi.string().trim().max(25).allow(null, ''),
				hyper_link2: Joi.string().uri().allow(null, ''),
				tempCategory: Joi.string().trim().max(25).required(),
				tempLang: Joi.string().trim().max(10).required(),
				WhatsAppSetupId: Joi.number().integer().required(),
				tempName: Joi.string().trim().max(validationConstant.title.max).required(),
				trackableLink: Joi.boolean().required(),
				trackableLink2: Joi.boolean().required(),
				longitude: Joi.number().allow(null),
				latitude: Joi.number().allow(null),
				locName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				address: Joi.string().trim().max(500).allow(null, ''),
				callphonetext: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				callphoneno: Joi.string().trim().max(15).allow(null, ''),
				callphonetype: Joi.string().valid('Work', 'Home', 'Mobile').allow(null, ''),
				zoomMeetLink: Joi.string().uri().allow(null, ''),
				callToActionZoomText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				zoomTrackable: Joi.boolean().required(),
				ZoomMeetId: Joi.string().allow(null, ''),
				zoomMeetLink2: Joi.string().uri().allow(null, ''),
				callToActionZoomText2: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				zoomTrackable2: Joi.boolean().required(),
				ZoomMeetId2: Joi.string().allow(null, ''),
				quality: Joi.string().allow(null).required(),
				cta_sequence: Joi.string().required(),
				quickReplyFirst: Joi.boolean().required(),
			});

			const { error: onlyWhatsAppValidationError, value: onlyWhatsAppValidationValue } =
				onlyWhatsAppValidationSchema.validate(req.body.whatsApp_native_drip_data);
			if (onlyWhatsAppValidationError) {
				return ResponseError(res, { message: onlyWhatsAppValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'Only Email') {
			const onlyEmailValidationSchema = Joi.object({
				id: Joi.number().integer(),
				email_subject_line: Joi.string().trim().max(validationConstant.title.max).required(),
				email_body: Joi.string().trim().required(),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				caption: Joi.string().trim().allow(null, ''),
				templateType: Joi.string().allow(null, ''),
				isSendGridTemplate: Joi.boolean().required(),
				brod_attach_type: Joi.string(),
				brod_attach_path: Joi.string().allow(null, ''),
				brodEmailAssetPath: Joi.array().items(Joi.string()).allow(null),
				brodEmailAttachmentPath: Joi.array().items(Joi.string()).allow(null),
			});

			const { error: onlyEmailValidationError, value: onlyEmailValidationValue } = onlyEmailValidationSchema.validate(
				req.body.only_email_drip_data
			);

			if (onlyEmailValidationError) {
				return ResponseError(res, { message: onlyEmailValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'DripApp with sharing on WhatsApp') {
			const dripAppWhatsAppValidationSchema = Joi.object({
				id: Joi.number().integer(),
				header_type: Joi.string().valid('None', 'Text', 'Image', 'Video', 'Document', 'Location').required(),
				header_text: Joi.string().trim().max(60).allow(null, ''),
				AssetId: Joi.number().integer().allow(null),
				body: Joi.string().trim().max(1024).required(),
				footer: Joi.string().trim().max(60).allow(null, ''),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				interaction: Joi.string().valid('Call to Action', 'None').required(),
				callToActionText: Joi.string().trim().max(25).allow(null, ''),
				hyper_link: Joi.string().uri().allow(null, ''),
				OtherDripType: Joi.boolean().required(),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				existingDripId: Joi.number().integer().allow(null),
				templateStatus: Joi.string()
					.valid('Not Created', 'Pending', 'Approved', 'Rejected', 'Disabled', 'Flagged', 'Enabled')
					.required(),
				templateId: Joi.string().allow(null, ''),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Video',
					// 	'Text',
					// 	'Poll',
					// 	'Quiz',
					// 	'Spin The Wheel',
					// 	'Offline Task',
					// 	'Survey',
					// 	'Custom Template',
					// 	'Quiz (Randomised)'
					// )
					.required(),
				headerPath: Joi.string().allow(null, ''),
				headerFileName: Joi.string().allow(null, ''),
				tempCategory: Joi.string().trim().max(validationConstant.title.max).required(),
				tempLang: Joi.string().trim().max(10).required(),
				WhatsAppSetupId: Joi.number().integer().required(),
				tempName: Joi.string().trim().max(validationConstant.title.max).required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1024),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				longitude: Joi.number().allow(null),
				latitude: Joi.number().allow(null),
				locName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				address: Joi.string().trim().max(500).allow(null, ''),
				isZoomMeeting: Joi.boolean().required(),
				zoomMeetLink: Joi.string().uri().allow(null, ''),
				ZoomMeetText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				ZoomMeetId: Joi.string().allow(null, ''),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				quality: Joi.string().allow(null).required(),
				submitText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
			});
			const { error: dripAppWhatsAppValidationError, value: dripAppWhatsAppValidationValue } =
				dripAppWhatsAppValidationSchema.validate(req.body.whatsApp_non_native_drip_data);
			if (dripAppWhatsAppValidationError) {
				return ResponseError(res, { message: dripAppWhatsAppValidationError.details[0].message }, 400);
			}
		} else if (req.body.drip_data.drip_type == 'DripApp with sharing on Email') {
			const dripAppEmailValidationSchema = Joi.object({
				id: Joi.number().integer().allow(null),
				email_subject_line: Joi.string().trim().max(validationConstant.title.max).required(),
				email_body: Joi.string().trim().required(),
				callToActionText: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				hyper_link: Joi.string().allow(null, ''),
				contentType: Joi.string().valid('Create New Drip', 'Use Existing Drip').required(),
				OtherDripType: Joi.boolean().required(),
				pwaheadtxt: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				caption: Joi.string().trim().allow(null, '').required(),
				existingDripId: Joi.number().integer().allow(null),
				templateType: Joi.string()
					// .valid(
					// 	'Single Image',
					// 	'Carousel',
					// 	'Survey',
					// 	'Video',
					// 	'Text',
					// 	'Poll',
					// 	'Quiz',
					// 	'Quiz (Randomised)',
					// 	'Offline task',
					// 	'Spin The Wheel'
					// )
					.required(),
				showCorrectAns: Joi.boolean().required(),
				brief: Joi.string().allow(null, '').max(1000),
				quizResultType: Joi.string().valid('Upon Submission', 'After the Deadline').allow(null),
				timehours: Joi.number().integer().allow(null),
				quizRandCount: Joi.number().integer().allow(null),
				pollResultType: Joi.string().valid('Scale Chart', 'Bar Chart', 'Pie Chart', 'None').allow(null),
				isSendGridTemplate: Joi.boolean().required(),
				brod_attach_type: Joi.string(),
				brod_attach_path: Joi.string().allow(null, ''),
				noOfTimeSpin: Joi.number().integer().allow(null),
				noOfQueForCat: Joi.number().integer().allow(null),
				submitText: Joi.string().trim().max(validationConstant.title.max).allow(null, '').required(),
				custTempId: Joi.number().max(validationConstant.title.max).allow(null, ''),
				brodEmailAssetPath: Joi.array().items(Joi.string()).allow(null),
				brodEmailAttachmentPath: Joi.array().items(Joi.string()).allow(null),
				htmlstring: Joi.string().required(),
			});
			const { error: dripAppEmailValidationError, value: dripAppEmailValidationValue } =
				dripAppEmailValidationSchema.validate(req.body.email_non_native_drip_data);
			if (dripAppEmailValidationError) {
				return ResponseError(res, { message: dripAppEmailValidationError.details[0].message }, 400);
			}
		}

		let err;
		let templateError;
		let drip_data = dripValidationValue;
		let selected_asset_for_drip = req.body.selected_asset_for_drip;
		let whatsApp_native_drip_data = req.body.whatsApp_native_drip_data;
		let whatsApp_non_native_drip_data = req.body.whatsApp_non_native_drip_data;
		let only_email_drip_data = req.body.only_email_drip_data;
		let email_non_native_drip_data = req.body.email_non_native_drip_data;
		let native_drip_data = req.body.native_drip_data;
		let only_teams_drip_data = req.body.only_teams_drip_data;
		let sharing_on_teams_drip_data = req.body.sharing_on_teams_drip_data;
		let question = req.body.DripQuestions;
		let spinWheelQueCategory = req.body.spinWheelQueCategory;
		let postBriefAssets = req.body.PostBriefAsset;
		// let ClientId = req.params.clientId;
		let dripId = parseInt(req.params.dripId);
		let isZoomMeeting = false;
		let client;
		// Add ClientId
		// drip_data.ClientId = ClientId;
		whatsApp_native_drip_data.ClientId = ClientId;
		whatsApp_non_native_drip_data.ClientId = ClientId;
		only_email_drip_data.ClientId = ClientId;
		email_non_native_drip_data.ClientId = ClientId;
		native_drip_data.ClientId = ClientId;
		only_teams_drip_data.ClientId = ClientId;
		sharing_on_teams_drip_data.ClientId = ClientId;

		//For Template Type Static Or Dynamic
		if (whatsApp_native_drip_data?.trackableLink) {
			whatsApp_native_drip_data.type = 'dynamic';
		} else {
			whatsApp_native_drip_data.type = 'static';
		}

		if (whatsApp_native_drip_data?.zoomMeetLink || whatsApp_native_drip_data?.zoomMeetLink2) {
			isZoomMeeting = true;
		}

		// Add CaptionIto Post
		if (whatsApp_non_native_drip_data.caption) {
			drip_data.caption = whatsApp_non_native_drip_data.caption;
		} else if (email_non_native_drip_data.caption) {
			drip_data.caption = email_non_native_drip_data.caption;
		} else if (native_drip_data.caption) {
			drip_data.caption = native_drip_data.caption;
		} else if (sharing_on_teams_drip_data.caption) {
			drip_data.caption = sharing_on_teams_drip_data.caption;
		}

		// Add Header to Post
		if (whatsApp_non_native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = whatsApp_non_native_drip_data.pwaheadtxt;
		} else if (email_non_native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = email_non_native_drip_data.pwaheadtxt;
		} else if (native_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = native_drip_data.pwaheadtxt;
		} else if (sharing_on_teams_drip_data.pwaheadtxt) {
			drip_data.pwaheadtxt = sharing_on_teams_drip_data.pwaheadtxt;
		}

		// Add Survey Submit Text to Post
		if (whatsApp_non_native_drip_data.submitText) {
			drip_data.submitText = whatsApp_non_native_drip_data.submitText;
		} else if (email_non_native_drip_data.submitText) {
			drip_data.submitText = email_non_native_drip_data.submitText;
		} else if (native_drip_data.submitText) {
			drip_data.submitText = native_drip_data.submitText;
		} else if (sharing_on_teams_drip_data.submitText) {
			drip_data.submitText = sharing_on_teams_drip_data.submitText;
		}

		//Add Brief
		if (whatsApp_non_native_drip_data.brief) {
			drip_data.brief = whatsApp_non_native_drip_data.brief;
		} else if (email_non_native_drip_data.brief) {
			drip_data.brief = email_non_native_drip_data.brief;
		} else if (native_drip_data.brief) {
			drip_data.brief = native_drip_data.brief;
		} else if (sharing_on_teams_drip_data.brief) {
			drip_data.brief = sharing_on_teams_drip_data.brief;
		}

		if (whatsApp_non_native_drip_data.templateType) {
			drip_data.tempType = whatsApp_non_native_drip_data.templateType;
		} else if (email_non_native_drip_data.templateType) {
			drip_data.tempType = email_non_native_drip_data.templateType;
		} else if (native_drip_data.templateType) {
			drip_data.tempType = native_drip_data.templateType;
		} else if (sharing_on_teams_drip_data.templateType) {
			drip_data.tempType = sharing_on_teams_drip_data.templateType;
		}

		//Add Should Show Correct Answer After Submit
		if (whatsApp_non_native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = whatsApp_non_native_drip_data.showCorrectAns;
		} else if (email_non_native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = email_non_native_drip_data.showCorrectAns;
		} else if (native_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = native_drip_data.showCorrectAns;
		} else if (sharing_on_teams_drip_data.showCorrectAns) {
			drip_data.showCorrectAns = sharing_on_teams_drip_data.showCorrectAns;
		} else {
			drip_data.showCorrectAns = false;
		}

		//Quiz show correct incorrect base on type
		if (whatsApp_non_native_drip_data.quizResultType) {
			drip_data.quizResultType = whatsApp_non_native_drip_data.quizResultType;
		} else if (email_non_native_drip_data.quizResultType) {
			drip_data.quizResultType = email_non_native_drip_data.quizResultType;
		} else if (native_drip_data.quizResultType) {
			drip_data.quizResultType = native_drip_data.quizResultType;
		} else if (sharing_on_teams_drip_data.quizResultType) {
			drip_data.quizResultType = sharing_on_teams_drip_data.quizResultType;
		}

		if (whatsApp_non_native_drip_data.timehours) {
			drip_data.timehours = whatsApp_non_native_drip_data.timehours;
		} else if (email_non_native_drip_data.timehours) {
			drip_data.timehours = email_non_native_drip_data.timehours;
		} else if (native_drip_data.timehours) {
			drip_data.timehours = native_drip_data.timehours;
		} else if (sharing_on_teams_drip_data.timehours) {
			drip_data.timehours = sharing_on_teams_drip_data.timehours;
		}

		if (whatsApp_non_native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(whatsApp_non_native_drip_data.quizRandCount);
		} else if (email_non_native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(email_non_native_drip_data.quizRandCount);
		} else if (native_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(native_drip_data.quizRandCount);
		} else if (sharing_on_teams_drip_data.quizRandCount) {
			drip_data.quizRandCount = parseInt(sharing_on_teams_drip_data.quizRandCount);
		}

		if (whatsApp_non_native_drip_data.pollResultType) {
			drip_data.pollResultType = whatsApp_non_native_drip_data.pollResultType;
		} else if (email_non_native_drip_data.pollResultType) {
			drip_data.pollResultType = email_non_native_drip_data.pollResultType;
		} else if (native_drip_data.pollResultType) {
			drip_data.pollResultType = native_drip_data.pollResultType;
		} else if (sharing_on_teams_drip_data.pollResultType) {
			drip_data.pollResultType = sharing_on_teams_drip_data.pollResultType;
		}

		// Add html string to Post
		if (whatsApp_non_native_drip_data.htmlstring) {
			drip_data.htmlstring = whatsApp_non_native_drip_data.htmlstring;
		} else if (email_non_native_drip_data.htmlstring) {
			drip_data.htmlstring = email_non_native_drip_data.htmlstring;
		} else if (native_drip_data.htmlstring) {
			drip_data.htmlstring = native_drip_data.htmlstring;
		} else if (sharing_on_teams_drip_data.htmlstring) {
			drip_data.htmlstring = sharing_on_teams_drip_data.htmlstring;
		}

		//Add Zoom meeting Check
		if (whatsApp_non_native_drip_data.isZoomMeeting) {
			isZoomMeeting = true;
		}

		drip_data.drip_title = await capitalFirstLatter(drip_data.drip_title);

		drip_data.isZoomMeeting = isZoomMeeting;
		[err, _createDrip] = await to(
			Post.update(drip_data, {
				where: {
					id: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// Delete All Other Data

		[err, deleteBriefAsset] = await to(
			PostBriefAsset.destroy({
				where: {
					PostId: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (postBriefAssets && postBriefAssets.length > 0) {
			let count = 1;
			let briefData = [];
			for (let asset of postBriefAssets) {
				let payload = {
					PostId: dripId,
					AssetId: asset.AssetId,
					index: count,
					forPreview: asset.forPreview,
				};
				briefData.push(payload);
				count++;
			}
			if (briefData && briefData.length > 0) {
				[err, addBriefPostMapping] = await to(PostBriefAsset.bulkCreate(briefData));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		[err, deleteAsset] = await to(
			Post_asset_mapping.destroy({
				where: {
					PostId: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (whatsApp_native_drip_data && whatsApp_native_drip_data.id == null) {
			[err, deleteWhatsAppNative] = await to(
				Drip_whatsapp_native.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (whatsApp_non_native_drip_data && whatsApp_non_native_drip_data.id == null) {
			[err, deleteWhatsAppNonNative] = await to(
				Drip_whatsapp_non_native.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (only_email_drip_data && only_email_drip_data.id == null) {
			[err, deleteOnlyEmail] = await to(
				Drip_only_email.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (email_non_native_drip_data && email_non_native_drip_data.id == null) {
			[err, deleteEmailNonNative] = await to(
				Drip_email_non_native.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (native_drip_data && native_drip_data.id == null) {
			[err, deleteDripNative] = await to(
				Drip_native.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		//For Team Drip Type
		// let only_teams_drip_data = req.body.only_teams_drip_data;
		// let sharing_on_teams_drip_data = req.body.sharing_on_teams_drip_data;

		if (only_teams_drip_data && only_teams_drip_data.id == null) {
			[err, deleteOnlyTeamDrip] = await to(
				DripOnlyTeam.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (sharing_on_teams_drip_data && sharing_on_teams_drip_data.id == null) {
			[err, deleteTeamWithDrip] = await to(
				DripSharingOnTeam.destroy({
					where: {
						PostId: dripId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, deleteOption] = await to(
			DripOption.destroy({
				where: {
					PostId: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteDripSpinWheelCat] = await to(
			DripSpinWheelCat.destroy({
				where: {
					PostId: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, deleteQuestion] = await to(
			DripQuestion.destroy({
				where: {
					PostId: dripId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		// ------------------------------------------------------------------------------------
		// Add Drip Id
		whatsApp_native_drip_data.PostId = dripId;
		whatsApp_non_native_drip_data.PostId = dripId;
		only_email_drip_data.PostId = dripId;
		email_non_native_drip_data.PostId = dripId;
		native_drip_data.PostId = dripId;
		only_teams_drip_data.PostId = dripId;
		sharing_on_teams_drip_data.PostId = dripId;

		let hyper_link = ``;
		[err, client] = await to(
			Client.findOne({
				where: {
					id: ClientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		hyper_link = `${CONFIG.pwa_base_url}?dripId=${client.client_id}-${dripId}`;

		if (
			whatsApp_non_native_drip_data.contentType == 'Hyperlink to other content' ||
			whatsApp_non_native_drip_data.contentType == 'Use Existing Drip'
		) {
			hyper_link = whatsApp_non_native_drip_data.hyper_link;
		} else if (
			email_non_native_drip_data.contentType == 'Hyperlink to other content' ||
			email_non_native_drip_data.contentType == 'Use Existing Drip'
		) {
			hyper_link = email_non_native_drip_data.hyper_link;
		}

		if (hyper_link) {
			[err, update_drip] = await to(
				Post.update(
					{
						hyper_link: hyper_link,
					},
					{
						where: {
							id: dripId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		whatsApp_non_native_drip_data.hyper_link = hyper_link;
		email_non_native_drip_data.hyper_link = hyper_link;
		sharing_on_teams_drip_data.hyper_link = hyper_link;
		let index = 0;
		if (selected_asset_for_drip && selected_asset_for_drip.length > 0) {
			for (let asset of selected_asset_for_drip) {
				index++;
				let payload = {
					PostId: dripId,
					AssetId: asset.AssetId,
					index: index,
				};

				[err, drip_asset] = await to(Post_asset_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (whatsApp_native_drip_data.body) {
			// whatsApp_native_drip_data.body = whatsApp_native_drip_data.body.trimStart().trimEnd();
			whatsApp_native_drip_data.body = await trimStartAndEnd(whatsApp_native_drip_data.body);
		}
		if (whatsApp_native_drip_data.footer) {
			// whatsApp_native_drip_data.footer = whatsApp_native_drip_data.footer.trimStart().trimEnd();
			whatsApp_native_drip_data.footer = await trimStartAndEnd(whatsApp_native_drip_data.footer);
		}
		if (whatsApp_native_drip_data.header_text) {
			// whatsApp_native_drip_data.header_text = whatsApp_native_drip_data.header_text.trimStart().trimEnd();
			whatsApp_native_drip_data.header_text = await trimStartAndEnd(whatsApp_native_drip_data.header_text);
		}
		if (whatsApp_native_drip_data.callToActionText) {
			// whatsApp_native_drip_data.callToActionText = whatsApp_native_drip_data.callToActionText.trimStart().trimEnd();
			whatsApp_native_drip_data.callToActionText = await trimStartAndEnd(whatsApp_native_drip_data.callToActionText);
		}

		if (whatsApp_native_drip_data.callToActionText2) {
			// whatsApp_native_drip_data.callToActionText2 = whatsApp_native_drip_data.callToActionText2.trimStart().trimEnd();
			whatsApp_native_drip_data.callToActionText2 = await trimStartAndEnd(whatsApp_native_drip_data.callToActionText2);
		}

		if (whatsApp_native_drip_data.quickReply1) {
			// whatsApp_native_drip_data.quickReply1 = whatsApp_native_drip_data.quickReply1.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply1 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply1);
		}

		if (whatsApp_native_drip_data.quickReply2) {
			// whatsApp_native_drip_data.quickReply2 = whatsApp_native_drip_data.quickReply2.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply2 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply2);
		}

		if (whatsApp_native_drip_data.quickReply3) {
			// whatsApp_native_drip_data.quickReply3 = whatsApp_native_drip_data.quickReply3.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply3 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply3);
		}

		if (whatsApp_native_drip_data.quickReply4) {
			// whatsApp_native_drip_data.quickReply4 = whatsApp_native_drip_data.quickReply4.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply4 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply4);
		}

		if (whatsApp_native_drip_data.quickReply5) {
			// whatsApp_native_drip_data.quickReply5 = whatsApp_native_drip_data.quickReply5.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply5 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply5);
		}

		if (whatsApp_native_drip_data.quickReply6) {
			// whatsApp_native_drip_data.quickReply6 = whatsApp_native_drip_data.quickReply6.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply6 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply6);
		}

		if (whatsApp_native_drip_data.quickReply7) {
			// whatsApp_native_drip_data.quickReply7 = whatsApp_native_drip_data.quickReply7.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply7 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply7);
		}

		if (whatsApp_native_drip_data.quickReply8) {
			// whatsApp_native_drip_data.quickReply8 = whatsApp_native_drip_data.quickReply8.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply8 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply8);
		}

		if (whatsApp_native_drip_data.quickReply9) {
			// whatsApp_native_drip_data.quickReply9 = whatsApp_native_drip_data.quickReply9.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply9 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply9);
		}

		if (whatsApp_native_drip_data.quickReply10) {
			// whatsApp_native_drip_data.quickReply10 = whatsApp_native_drip_data.quickReply10.trimStart().trimEnd();
			whatsApp_native_drip_data.quickReply10 = await trimStartAndEnd(whatsApp_native_drip_data.quickReply10);
		}

		if (whatsApp_non_native_drip_data.body) {
			// whatsApp_non_native_drip_data.body = whatsApp_non_native_drip_data.body.trimStart().trimEnd();
			whatsApp_non_native_drip_data.body = await trimStartAndEnd(whatsApp_non_native_drip_data.body);
		}

		if (whatsApp_non_native_drip_data.footer) {
			// whatsApp_non_native_drip_data.footer = whatsApp_non_native_drip_data.footer.trimStart().trimEnd();
			whatsApp_non_native_drip_data.footer = await trimStartAndEnd(whatsApp_non_native_drip_data.footer);
		}
		if (whatsApp_non_native_drip_data.header_text) {
			// whatsApp_non_native_drip_data.header_text = whatsApp_non_native_drip_data.header_text.trimStart().trimEnd();
			whatsApp_non_native_drip_data.header_text = await trimStartAndEnd(whatsApp_non_native_drip_data.header_text);
		}
		if (whatsApp_non_native_drip_data.callToActionText) {
			// whatsApp_non_native_drip_data.callToActionText = whatsApp_non_native_drip_data.callToActionText
			// 	.trimStart()
			// 	.trimEnd();
			whatsApp_non_native_drip_data.callToActionText = await trimStartAndEnd(
				whatsApp_non_native_drip_data.callToActionText
			);
		}

		if (whatsApp_non_native_drip_data.quickReply1) {
			// whatsApp_non_native_drip_data.quickReply1 = whatsApp_non_native_drip_data.quickReply1.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply1 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply1);
		}

		if (whatsApp_non_native_drip_data.quickReply2) {
			// whatsApp_non_native_drip_data.quickReply2 = whatsApp_non_native_drip_data.quickReply2.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply2 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply2);
		}

		if (whatsApp_non_native_drip_data.quickReply3) {
			// whatsApp_non_native_drip_data.quickReply3 = whatsApp_non_native_drip_data.quickReply3.trimStart().trimEnd();
			whatsApp_non_native_drip_data.quickReply3 = await trimStartAndEnd(whatsApp_non_native_drip_data.quickReply3);
		}

		//---------------Teams Only Drip type------------
		if (only_teams_drip_data.body) {
			only_teams_drip_data.body = await trimStartAndEnd(only_teams_drip_data.body);
		}

		if (only_teams_drip_data.header_text) {
			only_teams_drip_data.header_text = await trimStartAndEnd(only_teams_drip_data.header_text);
		}
		if (only_teams_drip_data.callToActionText) {
			only_teams_drip_data.callToActionText = await trimStartAndEnd(only_teams_drip_data.callToActionText);
		}

		if (only_teams_drip_data.callToActionText2) {
			only_teams_drip_data.callToActionText2 = await trimStartAndEnd(only_teams_drip_data.callToActionText2);
		}

		//---------------Teams Sharing Drip type------------
		if (sharing_on_teams_drip_data.body) {
			sharing_on_teams_drip_data.body = await trimStartAndEnd(sharing_on_teams_drip_data.body);
		}

		if (sharing_on_teams_drip_data.header_text) {
			sharing_on_teams_drip_data.header_text = await trimStartAndEnd(sharing_on_teams_drip_data.header_text);
		}
		if (sharing_on_teams_drip_data.callToActionText) {
			sharing_on_teams_drip_data.callToActionText = await trimStartAndEnd(sharing_on_teams_drip_data.callToActionText);
		}

		// console.log('---only_teams_drip_data---', only_teams_drip_data);

		if (drip_data.drip_type == 'Only WhatsApp') {
			let whatsAppNativeDripId;
			let requiredUpdate = false;
			if (whatsApp_native_drip_data && whatsApp_native_drip_data.id) {
				whatsAppNativeDripId = whatsApp_native_drip_data.id;
				delete whatsApp_native_drip_data.id;
				let changeDetect = false;
				let changeInCapOrTenplateType = false;
				//Check To any changes in WhataApp Template Data

				[err, details_whatsApp_native_drip] = await to(
					Drip_whatsapp_native.findOne({
						where: {
							id: whatsAppNativeDripId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (details_whatsApp_native_drip) {
					for (let key in whatsApp_native_drip_data) {
						if (key != 'ClientId' && key != 'errorMsg') {
							if (whatsApp_native_drip_data[key] != details_whatsApp_native_drip[key]) {
								if (key == 'caption' || key == 'templateType') {
									changeInCapOrTenplateType = true;
								} else {
									requiredUpdate = true;
									changeDetect = true;
								}
							}
						}
					}
					if (drip_data.drip_status == 'PFA' && whatsApp_native_drip_data.templateStatus == 'Not Created') {
						requiredUpdate = true;
					} else if (
						drip_data.drip_status == 'PFA' &&
						whatsApp_native_drip_data.templateStatus == 'Enabled' &&
						changeDetect == false
					) {
						[err, update_drip] = await to(
							Post.update(
								{
									drip_status: 'Published',
								},
								{
									where: {
										id: dripId,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
				if (requiredUpdate || changeInCapOrTenplateType) {
					[err, _update_whatsApp_native_drip] = await to(
						Drip_whatsapp_native.update(whatsApp_native_drip_data, {
							where: {
								id: whatsAppNativeDripId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else {
				requiredUpdate = true;
				[err, _create_whatsApp_native_drip] = await to(Drip_whatsapp_native.create(whatsApp_native_drip_data));
				if (err) return ResponseError(res, err, 500, true);
				whatsAppNativeDripId = _create_whatsApp_native_drip.id;
			}
			if (requiredUpdate) {
				if (drip_data.drip_status != 'Draft') {
					console.log('----Update-WhastApp Only--');
					await WhatsAppNativeTemplate(drip_data, whatsAppNativeDripId, hyper_link, req, res);
				}
			}
		} else if (drip_data.drip_type == 'DripApp with sharing on WhatsApp') {
			let whatsAppNonNativedripId;
			let requiredUpdate = false;
			if (whatsApp_non_native_drip_data && whatsApp_non_native_drip_data.id) {
				whatsAppNonNativedripId = whatsApp_non_native_drip_data.id;
				delete whatsApp_non_native_drip_data.id;
				let changeDetect = false;
				let changeInCapOrTenplateType = false;

				[err, details_whatsApp_non_native_drip] = await to(
					Drip_whatsapp_non_native.findOne({
						where: {
							id: whatsAppNonNativedripId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (details_whatsApp_non_native_drip) {
					for (let key in whatsApp_non_native_drip_data) {
						if (key != 'ClientId' && key != 'errorMsg') {
							if (whatsApp_non_native_drip_data[key] != details_whatsApp_non_native_drip[key]) {
								if (key == 'caption' || key == 'templateType') {
									changeInCapOrTenplateType = true;
								} else {
									requiredUpdate = true;
									changeDetect = true;
								}
							}
						}
					}
					if (drip_data.drip_status == 'PFA' && details_whatsApp_non_native_drip.templateStatus == 'Not Created') {
						requiredUpdate = true;
					} else if (
						drip_data.drip_status == 'PFA' &&
						details_whatsApp_non_native_drip.templateStatus == 'Enabled' &&
						changeDetect == false
					) {
						[err, update_drip] = await to(
							Post.update(
								{
									drip_status: 'Published',
								},
								{
									where: {
										id: dripId,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
				if (requiredUpdate || changeInCapOrTenplateType) {
					[err, _update_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.update(whatsApp_non_native_drip_data, {
							where: {
								id: whatsAppNonNativedripId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else {
				requiredUpdate = true;
				whatsApp_non_native_drip_data.interaction = 'Call to Action';
				whatsApp_non_native_drip_data.type = 'dynamic';
				[err, _create_whatsApp_non_native_drip] = await to(
					Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
				);
				if (err) return ResponseError(res, err, 500, true);
				whatsAppNonNativedripId = _create_whatsApp_non_native_drip.id;
			}

			if (requiredUpdate) {
				if (drip_data.drip_status != 'Draft') {
					// console.log('----Update-WhastApp with Drip--');
					await WhatsAppNonNativeTemplate(drip_data, whatsAppNonNativedripId, hyper_link, req, res);
				}
			}
		} else if (drip_data.drip_type == 'Only Email') {
			if (only_email_drip_data && only_email_drip_data.id) {
				let onlyEmailId = only_email_drip_data.id;
				delete only_email_drip_data.id;
				[err, _update_only_email_drip] = await to(
					Drip_only_email.update(only_email_drip_data, {
						where: {
							id: onlyEmailId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, _only_email_drip] = await to(
					Drip_only_email.findOne({
						where: {
							id: onlyEmailId,
						},
						attributes: ['email_body'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//only email broadside template upload to broadside server
				if (_only_email_drip.email_body != only_email_drip_data.email_body && !client.useSendGrid) {
					const response = await uploadBroadSideEmailTemplateFileOnServer(
						onlyEmailId,
						only_email_drip_data,
						'Only Email'
					);
					// console.log('----Only Email Template Upload Response----', response.data);
				}
			} else {
				[err, _create_only_email_drip] = await to(Drip_only_email.create(only_email_drip_data));
				if (err) return ResponseError(res, err, 500, true);

				//only email broadside template upload to broadside server
				if (_create_only_email_drip && only_email_drip_data.email_body && !client.useSendGrid) {
					const response = await uploadBroadSideEmailTemplateFileOnServer(
						_create_only_email_drip.id,
						only_email_drip_data,
						'Only Email'
					);
					// console.log('----Only Email Template Upload Response----', response.data);
				}
			}
		} else if (drip_data.drip_type == 'DripApp with sharing on Email') {
			if (email_non_native_drip_data && email_non_native_drip_data.id) {
				let emailNonNativeId = email_non_native_drip_data.id;
				delete email_non_native_drip_data.id;
				[err, _update_email_non_native_drip] = await to(
					Drip_email_non_native.update(email_non_native_drip_data, {
						where: {
							id: emailNonNativeId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				[err, _native_email_drip] = await to(
					Drip_email_non_native.findOne({
						where: {
							id: emailNonNativeId,
						},
						attributes: ['email_body'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//only email broadside template upload to broadside server
				if (_native_email_drip.email_body != email_non_native_drip_data.email_body && !client.useSendGrid) {
					const response = await uploadBroadSideEmailTemplateFileOnServer(
						emailNonNativeId,
						email_non_native_drip_data,
						'DripApp with sharing on Email'
					);
					// console.log('----Native Email Template Upload Response----', response.data);
				}
			} else {
				[err, _create_email_non_native_drip] = await to(Drip_email_non_native.create(email_non_native_drip_data));
				if (err) return ResponseError(res, err, 500, true);

				//only email broadside template upload to broadside server
				if (_create_email_non_native_drip && email_non_native_drip_data.email_body && !client.useSendGrid) {
					const response = await uploadBroadSideEmailTemplateFileOnServer(
						_create_email_non_native_drip.id,
						email_non_native_drip_data,
						'DripApp with sharing on Email'
					);
					// console.log('----Native Email Template Upload Response----', response.data);
				}
			}

			if (email_non_native_drip_data.OtherDripType) {
				let whatsAppNonNativeId;
				let requiredUpdate = false;
				if (whatsApp_non_native_drip_data && whatsApp_non_native_drip_data.id) {
					whatsAppNonNativeId = whatsApp_non_native_drip_data.id;
					delete whatsApp_non_native_drip_data.id;

					[err, details_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.findOne({
							where: {
								id: whatsAppNonNativeId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (details_whatsApp_non_native_drip) {
						for (let key in whatsApp_non_native_drip_data) {
							if (key != 'ClientId') {
								if (whatsApp_non_native_drip_data[key] != details_whatsApp_non_native_drip[key]) {
									requiredUpdate = true;
									break;
								}
							}
						}
					}
					if (requiredUpdate) {
						[err, _update_whatsApp_non_native_drip] = await to(
							Drip_whatsapp_non_native.update(whatsApp_non_native_drip_data, {
								where: {
									id: whatsAppNonNativeId,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				} else {
					requiredUpdate = true;
					whatsApp_non_native_drip_data.interaction = 'Call to Action';
					whatsApp_non_native_drip_data.type = 'dynamic';
					[err, _create_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
					);
					if (err) return ResponseError(res, err, 500, true);
					whatsAppNonNativeId = _create_whatsApp_non_native_drip.id;
				}
				if (requiredUpdate) {
					await WhatsAppNonNativeTemplate(drip_data, whatsAppNonNativeId, hyper_link, req, res);
				}
			}
		} else if (drip_data.drip_type == 'Only DripApp') {
			if (native_drip_data && native_drip_data.id) {
				let nativeDripId = native_drip_data.id;
				delete native_drip_data.id;
				[err, _update_drip_native] = await to(
					Drip_native.update(native_drip_data, {
						where: {
							id: nativeDripId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, _create_drip_native] = await to(Drip_native.create(native_drip_data));
				if (err) return ResponseError(res, err, 500, true);
			}

			if (native_drip_data.OtherDripType) {
				let whatsNonNativeDripId;
				let requiredUpdate = false;
				if (whatsApp_non_native_drip_data && whatsApp_non_native_drip_data.id) {
					whatsNonNativeDripId = whatsApp_non_native_drip_data.id;
					delete whatsApp_non_native_drip_data.id;

					[err, details_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.findOne({
							where: {
								id: whatsNonNativeDripId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (details_whatsApp_non_native_drip) {
						for (let key in whatsApp_non_native_drip_data) {
							if (key != 'ClientId') {
								if (whatsApp_non_native_drip_data[key] != details_whatsApp_non_native_drip[key]) {
									requiredUpdate = true;
									break;
								}
							}
						}
					}

					[err, _update_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.update(whatsApp_non_native_drip_data, {
							where: {
								id: whatsNonNativeDripId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else {
					requiredUpdate = true;
					whatsApp_non_native_drip_data.interaction = 'Call to Action';
					whatsApp_non_native_drip_data.type = 'dynamic';
					[err, _create_whatsApp_non_native_drip] = await to(
						Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
					);
					if (err) return ResponseError(res, err, 500, true);
					whatsNonNativeDripId = _create_whatsApp_non_native_drip.id;
				}

				if (requiredUpdate) {
					await WhatsAppNonNativeTemplate(drip_data, whatsNonNativeDripId, hyper_link, req, res);
				}

				if (email_non_native_drip_data && email_non_native_drip_data.id) {
					let emailNonNativeId = email_non_native_drip_data.id;
					delete email_non_native_drip_data.id;

					[err, _update_email_non_native_drip] = await to(
						Drip_email_non_native.update(email_non_native_drip_data, {
							where: {
								id: emailNonNativeId,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				} else {
					[err, _create_email_non_native_drip] = await to(Drip_email_non_native.create(email_non_native_drip_data));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		} else if (drip_data.drip_type == 'Only Teams') {
			if (only_teams_drip_data && only_teams_drip_data.id) {
				let onlyDripTeamId = only_teams_drip_data.id;
				delete only_teams_drip_data.id;
				[err, _update_drip_native] = await to(
					DripOnlyTeam.update(only_teams_drip_data, {
						where: {
							id: onlyDripTeamId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, _create_drip_native] = await to(DripOnlyTeam.create(only_teams_drip_data));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (drip_data.drip_type == 'DripApp with sharing on Teams') {
			if (sharing_on_teams_drip_data && sharing_on_teams_drip_data.id) {
				let sharingDripTeamId = sharing_on_teams_drip_data.id;
				delete sharing_on_teams_drip_data.id;
				[err, _update_drip_sharing_on_teams] = await to(
					DripSharingOnTeam.update(sharing_on_teams_drip_data, {
						where: {
							id: sharingDripTeamId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, _create_drip_sharing_on_teams] = await to(DripSharingOnTeam.create(sharing_on_teams_drip_data));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		//Create Spin The Wheel question Category
		if (spinWheelQueCategory && drip_data.tempType == 'Spin The Wheel' && spinWheelQueCategory.length > 0) {
			let spinWheelQueCategoryArray = [];
			for (let question_category of spinWheelQueCategory) {
				// Create Question Category
				spinWheelQueCategoryArray.push({
					PostId: dripId,
					category_index: question_category.category_index,
					category_name: question_category.category_name.trimStart().trimEnd(),
					totalquestion: question_category.totalquestion,
					totalscore: question_category.totalscore,
					characterRemain: question_category.characterRemain,
				});
			}

			[err, createSpinCategory] = await to(DripSpinWheelCat.bulkCreate(spinWheelQueCategoryArray, { returning: true }));
			if (err) return ResponseError(res, err, 500, true);

			// Iterate over each Spin Category
			for (const queCategory_ of createSpinCategory) {
				const queCategory = queCategory_.convertToJSON();
				for (let que of question) {
					if (queCategory.category_index === que.spinCatIndex) {
						que.DripSpinWheelCatId = queCategory.id;
					}
				}
			}
		}

		if (question && question.length > 0) {
			for (let que of question) {
				if (que.question && que.questionType) {
					let payload = {
						PostId: dripId,
						question: que.question,
						questionType: que.questionType,
						ClientId: ClientId,
						AssetId: que.AssetId,
						allowFileTypes: que.allowFileTypes,
						fileSize: que.fileSize,
						numberOfFiles: que.numberOfFiles,
						isTextResponse: que.isTextResponse,
						isFileSubmission: que.isFileSubmission,
						surveyCharLimit: que.surveyCharLimit,
						multipleOption: que.multipleOption,
						ratingScaleMinCount: que.ratingScaleMinCount,
						ratingScaleMaxCount: que.ratingScaleMaxCount,
						isQuesRequired: que.isQuesRequired,
						zoomLinkTo: que.zoomLinkTo,
						UploadOnVimeo: que.UploadOnVimeo,
						showTranscript: que.showTranscript,
						aiReview: que.aiReview,
						expectedAnswer: que.expectedAnswer,
						spinCatIndex: que.spinCatIndex,
						spinQueScore: que.spinQueScore,
						DripSpinWheelCatId: que.DripSpinWheelCatId,
						ratingType: que.ratingType,
						ratingMinLabel: que.ratingMinLabel,
						ratingMaxLabel: que.ratingMaxLabel,
					};
					[err, create_question] = await to(DripQuestion.create(payload));
					if (err) return ResponseError(res, err, 500, true);
					let count = 1;
					for (let opt of que.DripOptions) {
						let payload = {
							PostId: dripId,
							ClientId: ClientId,
							DripQuestionId: create_question.id,
							isCorrectAnswer: opt.isCorrectAnswer,
							AssetId: opt.AssetId,
							text: opt.text,
							sr_no: count,
							skipQueType: opt.skipQueType,
						};
						[err, create_option] = await to(DripOption.create(payload));
						if (err) return ResponseError(res, err, 500, true);
						count++;
					}
				}
			}
		}

		[err, drip_detail] = await to(
			Post.findOne({
				where: {
					id: dripId,
				},
				include: [
					{
						model: Drip_whatsapp_native,
					},
					{
						model: Drip_whatsapp_non_native,
					},
					{
						model: Drip_only_email,
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
			})
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

		// let notifcationMessage = `Drip Updated by ${localUser && localUser.first ? localUser.first : ''} ${
		// 	localUser && localUser.last ? localUser.last : ''
		// }.`;
		// let userIds = await getAllUserIdsForNotification(parseInt(ClientId));
		// await createNotification(notifcationMessage, ['Bell'], userIds);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.UPDATE_DRIP;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		notifcationMessage = notifcationMessage.replace('{{drip_name}}', drip_data.drip_title);
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Update Drip`, req.ip, req.useragent, req.user.type, {
				PostId: dripId,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: drip_detail.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDrip = updateDrip;

const WhatsAppNonNativeTemplate = async function (drip_data, whatsAppNonNativedripId, hyper_link, req, res) {
	try {
		let post = drip_data;
		post.hyper_link = hyper_link;

		[err, getWhatsAppNonNative] = await to(
			Drip_whatsapp_non_native.findOne({
				where: {
					id: whatsAppNonNativedripId,
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
							'canChangeTempCat',
							'isMeta',
							'MTPNoId',
							'MTToken',
							'MTAccId',
							'MTAppId',
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getWhatsAppNonNative && getWhatsAppNonNative.WhatsAppSetup) {
			let response;
			let isUpdate = false;
			if (
				getWhatsAppNonNative.templateId &&
				getWhatsAppNonNative.templateId != null &&
				getWhatsAppNonNative.templateId != ''
			) {
				isUpdate = true;
				// console.log('--WhatsApp Non Native UPdate Template--');

				response = await updateWhatsAppTemplate(
					getWhatsAppNonNative.convertToJSON(),
					post,
					'DripApp with sharing on WhatsApp',
					req.user.ClientId
				);
			} else if (getWhatsAppNonNative) {
				isUpdate = false;
				// console.log('--WhatsApp Non Native Create Template--');

				response = await createWhatsAppTemplate(
					getWhatsAppNonNative.convertToJSON(),
					post,
					'DripApp with sharing on WhatsApp',
					req.user.ClientId
				);
			}

			console.log('----WhatsApp Non Native Template Create Response--', response);

			if (response && response.template_id) {
				[err, updateTemplateId] = await to(
					Drip_whatsapp_non_native.update(
						{
							templateId: response.template_id.toString(),
							templateStatus: 'Pending',
						},
						{
							where: {
								id: getWhatsAppNonNative.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				if (post && post.id) {
					[err, updatePost] = await to(
						Post.update(
							{
								drip_status: 'PFA',
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			} else {
				console.log('----Error when Update Drip With WhatsApp Template Id--', response.details);
				templateError = response.details;
				if (isUpdate) {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_non_native.update(
							{
								errorMsg: response.details,
								// templateStatus: 'Not Created'
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);

					if (post && post.id) {
						[err, updatePost] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				} else {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_non_native.update(
							{
								errorMsg: response.details,
								templateStatus: 'Not Created',
							},
							{
								where: {
									id: getWhatsAppNonNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					if (post && post.id) {
						[err, updatePost] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
			}
		} else {
			templateError = 'WhatsApp Setup Not Found.';
			[err, updateTemplateId] = await to(
				Drip_whatsapp_non_native.update(
					{
						errorMsg: 'WhatsApp Setup Not Found.',
						templateStatus: 'Not Created',
					},
					{
						where: {
							id: getWhatsAppNonNative.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.WhatsAppNonNativeTemplate = WhatsAppNonNativeTemplate;

const WhatsAppNativeTemplate = async function (drip_data, whatsAppNativedripId, hyper_link, req, res) {
	try {
		let post = drip_data;
		post.hyper_link = hyper_link;

		[err, getWhatsAppNative] = await to(
			Drip_whatsapp_native.findOne({
				where: {
					id: whatsAppNativedripId,
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
							'canChangeTempCat',
							'isMeta',
							'MTPNoId',
							'MTToken',
							'MTAccId',
							'MTAppId',
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getWhatsAppNative && getWhatsAppNative.WhatsAppSetup) {
			let response;
			let isUpdate = false;
			if (getWhatsAppNative.templateId && getWhatsAppNative.templateId != null && getWhatsAppNative.templateId != '') {
				isUpdate = true;
				console.log('--WhatsApp Native UPdate Template--');

				response = await updateWhatsAppTemplate(
					getWhatsAppNative.convertToJSON(),
					post,
					'Only WhatsApp',
					req.user.ClientId
				);
			} else if (getWhatsAppNative) {
				isUpdate = false;
				console.log('--WhatsApp Native Create Template--');

				response = await createWhatsAppTemplate(
					getWhatsAppNative.convertToJSON(),
					post,
					'Only WhatsApp',
					req.user.ClientId
				);
			}

			console.log('----WhatsApp Native Template Create Response--', response);

			if (response && response.template_id) {
				[err, updateTemplateId] = await to(
					Drip_whatsapp_native.update(
						{
							templateId: response.template_id.toString(),
							templateStatus: 'Pending',
						},
						{
							where: {
								id: getWhatsAppNative.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);

				if (post && post.id) {
					[err, updateDripStatus] = await to(
						Post.update(
							{
								drip_status: 'PFA',
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
				}
			} else {
				console.log('----Error when Update Only WhatsApp Template Id--', response.details);
				templateError = response.details;

				if (isUpdate) {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_native.update(
							{
								errorMsg: response.details,
								// templateStatus: 'Not Created'
							},
							{
								where: {
									id: getWhatsAppNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				} else {
					[err, updateTemplateId] = await to(
						Drip_whatsapp_native.update(
							{
								errorMsg: response.details,
								templateStatus: 'Not Created',
							},
							{
								where: {
									id: getWhatsAppNative.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);

					if (post && post.id) {
						[err, updateDripStatus] = await to(
							Post.update(
								{
									drip_status: 'PFA',
								},
								{
									where: {
										id: post.id,
									},
								}
							)
						);
					}
				}
			}
		} else {
			templateError = 'WhatsApp Setup Not Found.';
			[err, updateTemplateId] = await to(
				Drip_whatsapp_native.update(
					{
						errorMsg: 'WhatsApp Setup Not Found.',
						templateStatus: 'Not Created',
					},
					{
						where: {
							id: getWhatsAppNative.id,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.WhatsAppNativeTemplate = WhatsAppNativeTemplate;

// Get All Post list by Client
const getAllPostByClient = async function (req, res) {
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
			clientId: req.params.clientId,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;

		let err;
		// let clientId = parseInt(req.params.clientId);

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDrip(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let allPost;

		[err, allPost] = await to(
			Post.findAndCountAll({
				distinct: true,
				where: {
					ClientId: allSubClientIds,
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
						model: User,
						attributes: ['local_user_id', 'MarketId'],
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
				],
				limit: limit,
				offset: offset,
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = [];
		if (allPost && allPost.rows && allPost.rows.length > 0) {
			for (let allUser of allPost.rows) {
				let userDetail = allUser.convertToJSON();
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
				payload.push(userDetail);
			}
		}

		return ResponseSuccess(res, {
			data: payload,
			count: allPost.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllPostByClient = getAllPostByClient;

const getAllSubChildClientIds = async function (clientId) {
	try {
		let err, ClientsDetail;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClientIds = [];
		let childClientId = [];
		childClientId.push(parentClientId);
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
					attributes: ['id', 'DripAccess'],
					// include: [
					// 	{
					// 		model: Client_job_role,
					// 		attributes: ['job_role_name'],
					// 	},
					// ],
				})
			);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				if (client.DripAccess) {
					finalArrayOfClientIds.push(client.id);
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		return finalArrayOfClientIds;
	} catch (error) {
		return [];
	}
};

const deleteDrip = async function (req, res) {
	try {
		let err;

		const schema = Joi.object({
			ClientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			ClientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { ClientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, ClientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let ClientId = parseInt(req.params.clientId);
		let postId = req.body;

		[err, delete_post] = await to(
			Post.update(
				{
					is_deleted: true,
					drip_status: 'Deleted',
				},
				{
					where: {
						ClientId: ClientId,
						id: postId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// Changes Status into Campaign Drip mapping Table
		// Into campaign drip mapping table have status is Scheduled or PFA then we set Status to Deleted
		[err, update_status_drip_from_campaign] = await to(
			Drip_camp.update(
				{
					status: 'Deleted',
				},
				{
					where: {
						PostId: postId,
						// drip_published: false
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// Inot Campaign drip mapping table have status published the we set only is_deleted flag to be true.
		// [err, update_status_drip_from_campaign] = await to(Drip_camp.update({ is_deleted: true }, {
		//     where: {
		//         PostId: postId,
		//         status: 'Delivered'
		//     }
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		// Change WhatsApp Template Status into Only WhatsApp and WhatsApp Non Native Drip
		[err, update_whatsapp_template_status] = await to(
			Drip_whatsapp_native.update(
				{
					templateStatus: 'Disabled',
				},
				{
					where: {
						PostId: postId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, update_whatsapp_template_status] = await to(
			Drip_whatsapp_non_native.update(
				{
					templateStatus: 'Disabled',
				},
				{
					where: {
						PostId: postId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// let notifcationMessage = `${postId.length} Drips Deleted Successfully.`;
		// let userIds = await getAllUserIdsForNotification(ClientId);
		// await createNotification(notifcationMessage, ['Bell'], userIds);

		[err, postDetails] = await to(
			Post.findAll({
				where: {
					ClientId: ClientId,
					id: postId,
				},
				attributes: ['drip_title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let drip of postDetails) {
			let notifcationMessage = MESSAGE.DELETE_DRIP;
			notifcationMessage = notifcationMessage.replace('{{count}}', postId.length);
			notifcationMessage = notifcationMessage.replace('{{drip_name}}', drip.drip_title);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Delete Drip`, req.ip, req.useragent, req.user.type, {
				PostId: postId,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIP_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteDrip = deleteDrip;

// Get All Post list by Client
const getAllPostByClientAndpostType = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			post_type: Joi.string()
				.valid(
					'Only WhatsApp',
					'DripApp with sharing on WhatsApp',
					'Only Email',
					'DripApp with sharing on Email',
					'Only DripApp',
					'Only Teams',
					'DripApp with sharing on Teams',
					'null'
				)
				.required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			post_type: req.params.post_type,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, post_type } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err;
		let allPost;
		// let clientId = parseInt(req.params.clientId);
		let limit, offset;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDrip(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		if (post_type === 'Only Teams' && (req?.query?.isChannelFlow === true || req?.query?.isChannelFlow === 'true')) {
			let whereCondition = {
				trackableLink1: false,
				trackableLink2: false,
				trackableLink3: false,
			};
			[err, allPost] = await to(
				Post.findAll({
					where: {
						ClientId: allSubClientIds,
						drip_type: post_type,
						drip_status: ['Published', 'PFA'],
						is_deleted: false,
					},
					include: [
						{
							model: DripOnlyTeam,
							where: whereCondition,
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
					limit: limit,
					offset: offset,
					order: [['id', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else {
			[err, allPost] = await to(
				Post.findAll({
					where: {
						ClientId: allSubClientIds,
						drip_type: post_type,
						drip_status: ['Published', 'PFA'],
						is_deleted: false,
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
						{
							model: DripQuestion,
							include: [
								{
									model: DripOption,
								},
							],
						},
					],
					limit: limit,
					offset: offset,
					order: [['id', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		let payload = [];
		for (let post of allPost) {
			payload.push(post.convertToJSON());
		}

		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllPostByClientAndpostType = getAllPostByClientAndpostType;

// Get Post by Post Id
const getpDripByDripId = async function (req, res) {
	try {
		const schema = Joi.object({
			dripId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			dripId: parseInt(req.params.dripId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { dripId } = value;
		let err;
		// let dripId = req.params.dripId;
		[err, drip_detail] = await to(
			Post.findOne({
				where: {
					id: dripId,
				},
				include: [
					{
						model: Drip_whatsapp_native,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
					},
					{
						model: Drip_whatsapp_non_native,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
					},
					{
						model: DripOnlyTeam,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
					},
					{
						model: DripSharingOnTeam,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
					},
					{
						model: Drip_only_email,
					},
					{
						model: Drip_email_non_native,
					},
					{
						model: Drip_native,
					},
					{
						model: Asset,
						through: 'Post_asset_mapping',
						include: [
							{
								model: Asset_detail,
							},
						],
					},
					{
						model: Asset,
						through: 'PostBriefAsset',
						include: [
							{
								model: Asset_detail,
							},
						],
						as: 'Post_brief_assets',
					},
					{
						model: DripSpinWheelCat,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		drip_detail = drip_detail.convertToJSON();
		if (drip_detail) {
			[err, getQuestion] = await to(
				DripQuestion.findAll({
					where: {
						PostId: dripId,
					},
					include: [
						{
							model: DripOption,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
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
					order: [
						['id', 'ASC'],
						[
							{
								model: DripOption,
							},
							'id',
							'ASC',
						],
					],
				})
			);

			if (getQuestion) {
				drip_detail.DripQuestions = getQuestion;
			} else {
				drip_detail.DripQuestions = [];
			}
		}

		return ResponseSuccess(res, {
			data: drip_detail,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getpDripByDripId = getpDripByDripId;

// Get Post by Post Id
const getAllWhatsAppTemplate = async function (req, res) {
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

		let err;

		let finalList = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let allDrip;
		let count = 0;

		[err, dripWhatspp] = await to(
			Post.findAll({
				where: {
					ClientId: clientId,
					is_deleted: false,
				},
				include: [
					{
						model: Drip_whatsapp_native,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
						required: true,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		[err, allDripNonWhatsapp] = await to(
			Post.findAll({
				where: {
					ClientId: clientId,
					is_deleted: false,
				},
				include: [
					{
						model: Drip_whatsapp_non_native,
						include: [
							{
								model: Asset,
								include: [
									{
										model: Asset_detail,
									},
								],
							},
						],
						required: true,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let dripId = [];
		for (let item of allDripNonWhatsapp) {
			dripId.push(item.id);
		}

		for (let item of dripWhatspp) {
			dripId.push(item.id);
		}

		if (dripId && dripId.length > 0) {
			[err, allDrip] = await to(
				Post.findAndCountAll({
					distinct: true,
					where: {
						id: dripId,
					},
					include: [
						{
							model: Drip_whatsapp_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
						{
							model: Drip_whatsapp_non_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		if (allDrip && allDrip.rows && allDrip.rows.length > 0) {
			for (let drip of allDrip.rows) {
				if (drip.Drip_whatsapp_natives && drip.Drip_whatsapp_natives.length > 0) {
					let _drip = drip.convertToJSON();

					_drip.whatsApp_template_data = _drip.Drip_whatsapp_natives[0];
					_drip.whatsApp_template_data.type = 'Only WhatsApp';

					delete _drip.Drip_whatsapp_non_natives;
					delete _drip.Drip_whatsapp_natives;

					finalList.push(_drip);
				}
				if (drip.Drip_whatsapp_non_natives && drip.Drip_whatsapp_non_natives.length > 0) {
					let _drip = drip.convertToJSON();

					_drip.whatsApp_template_data = _drip.Drip_whatsapp_non_natives[0];
					_drip.whatsApp_template_data.type = 'DripApp with sharing on WhatsApp';

					delete _drip.Drip_whatsapp_non_natives;
					delete _drip.Drip_whatsapp_natives;

					finalList.push(_drip);
				}
			}

			if (allDrip != undefined) {
				count = allDrip.count;
			} else {
				count = 0;
			}
		}

		return ResponseSuccess(res, {
			data: finalList,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllWhatsAppTemplate = getAllWhatsAppTemplate;

// Change Whats App status and Add WhatsApp Template ID
const updateWhatsAppStatus = async function (req, res) {
	try {
		let err;
		let data = req.body;
		let dripId = req.params.dripId;

		if (data.whatsApp_template_data && data.whatsApp_template_data.type == 'DripApp with sharing on WhatsApp') {
			[err, updateStatus] = await to(
				Drip_whatsapp_non_native.update(data.whatsApp_template_data, {
					where: {
						id: data.whatsApp_template_data.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (data.whatsApp_template_data && data.whatsApp_template_data.type == 'Only WhatsApp') {
			[err, updateStatus] = await to(
				Drip_whatsapp_native.update(data.whatsApp_template_data, {
					where: {
						id: data.whatsApp_template_data.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (data.whatsApp_template_data.templateStatus == 'Enabled') {
			[err, drip_detail] = await to(
				Post.findOne({
					where: {
						id: dripId,
						drip_status: 'PFA',
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (drip_detail) {
				[err, drip_detail] = await to(
					Post.update(
						{
							drip_status: 'Published',
						},
						{
							where: {
								id: dripId,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (data.whatsApp_template_data.templateStatus != 'Enabled') {
			[err, drip_detail] = await to(
				Post.findOne({
					where: {
						id: dripId,
						drip_status: ['Published'],
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (drip_detail) {
				[err, drip_detail] = await to(
					Post.update(
						{
							drip_status: 'PFA',
						},
						{
							where: {
								id: dripId,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		return ResponseSuccess(res, {
			data: MESSAGE.WHATSAPP_TEMPLATE_STATUS_UPDATE,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateWhatsAppStatus = updateWhatsAppStatus;

// Get All Search Drip
const getAllSearchDripByClientId = async function (req, res) {
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

		let err;
		// let clientId = parseInt(req.params.clientId);
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDrip(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let searchKey = req.body.searchKey.split(' ');
		let userDetailId = [];
		let whereCondition = [];
		let whereConditionTemplate = [];
		let dripwhatsappNativeId = [];
		let allData = [];
		let allPost;
		let UpdatedDripId = [];
		let DripWhatsAppNativeAllPost;
		let dripwhatsappNaive;
		let userDetailAllPost;
		let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let UpdatedallPost = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

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
				drip_title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('driptype') > -1) {
			whereCondition.push({
				drip_type: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('drip_status') > -1) {
			whereCondition.push({
				drip_status: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
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

		if (filterColumn.indexOf('templatestatus') > -1) {
			whereConditionTemplate.push({
				templateStatus: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		[err, dripwhatsappNaive] = await to(
			Drip_whatsapp_native.findAll({
				where: {
					[sequelize.Op.or]: whereConditionTemplate,
				},
				attributes: ['PostId'],
			})
		);

		if (dripwhatsappNaive && dripwhatsappNaive.length > 0) {
			for (let Drip of dripwhatsappNaive) {
				dripwhatsappNativeId.push(Drip.PostId);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		[err, dripwhatsappNonNative] = await to(
			Drip_whatsapp_non_native.findAll({
				where: {
					[sequelize.Op.or]: whereConditionTemplate,
				},
				attributes: ['PostId'],
			})
		);

		if (dripwhatsappNonNative && dripwhatsappNonNative.length > 0) {
			for (let drip of dripwhatsappNonNative) {
				dripwhatsappNativeId.push(drip.PostId);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

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
										[sequelize.Op.iLike]: searchKey[0] + '%',
									},
									last: {
										[sequelize.Op.iLike]: searchKey[1] + '%',
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

					[err, UserDetail] = await to(
						User.findAll({
							where: {
								local_user_id: LocalUserId,
								forDrip: true,
								MarketId: market.id,
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

		if (userDetailId && userDetailId.length > 0) {
			[err, userDetailAllPost] = await to(
				Post.findAll({
					where: {
						ClientId: allSubClientIds,
						UserId: userDetailId,
						[Op.and]: dateCondition,
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
						{
							model: Client,
						},
						{
							model: User,
							where: {
								forDrip: true,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (dripwhatsappNativeId && dripwhatsappNativeId.length > 0) {
			[err, DripWhatsAppNativeAllPost] = await to(
				Post.findAll({
					where: {
						ClientId: allSubClientIds,
						id: dripwhatsappNativeId,
						[Op.and]: dateCondition,
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
						{
							model: Client,
						},
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, allPost] = await to(
				Post.findAll({
					where: {
						ClientId: allSubClientIds,
						[sequelize.Op.or]: whereCondition,
						[Op.and]: dateCondition,
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
						{
							model: Client,
						},
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (userDetailAllPost && userDetailAllPost.length > 0) {
			for (let userdetail_allPost of userDetailAllPost) {
				allData.push(userdetail_allPost);
			}
		}

		if (DripWhatsAppNativeAllPost && DripWhatsAppNativeAllPost.length > 0) {
			for (let dripWhats_appnative_allpost of DripWhatsAppNativeAllPost) {
				allData.push(dripWhats_appnative_allpost);
			}
		}

		if (allPost && allPost.length > 0) {
			for (let allpost_ of allPost) {
				let flag = true;
				for (let data of allData) {
					if (data.id == allpost_.id) {
						flag = false;
					}
				}
				if (flag) {
					allData.push(allpost_);
				}
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedDripId.push(item_.id);
		}

		if (UpdatedDripId && UpdatedDripId.length > 0) {
			[err, UpdatedallPost] = await to(
				Post.findAndCountAll({
					distinct: true,
					where: {
						id: UpdatedDripId,
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
						{
							model: Client,
						},
						{
							model: User,
							where: {
								status: true,
								is_deleted: false,
							},
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						},
					],
					limit: limit,
					offset: offset,
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (UpdatedallPost && UpdatedallPost.rows && UpdatedallPost.rows.length > 0) {
			for (let allPost of UpdatedallPost.rows) {
				let allPost_ = allPost.convertToJSON();
				newList.push(allPost_);
			}
		}

		let payload = [];
		if (newList && newList.length > 0) {
			for (let allUser of newList) {
				let userDetail = allUser;
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
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
				}
				payload.push(userDetail);
			}
		}

		let count;
		if (UpdatedallPost != undefined) {
			count = UpdatedallPost.count;
		} else {
			count = 0;
		}

		return ResponseSuccess(res, {
			data: payload,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchDripByClientId = getAllSearchDripByClientId;

// Get get All WhatsApp Template
const getAllSearchWhatsAppTemplate = async function (req, res) {
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

		let err;
		// let clientId = req.params.clientId;
		let finalList = [];
		let allData = [];
		let dripwhatsappNativeId = [];
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereCondition = [];
		let whereConditionTemplate = [];
		let TemplateAllDrip;
		let UpdatedTemplatedripId = [];
		let UpdatedallDrip;
		let Drip_whatsapp_nativeAll;
		let allDrip;

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		if (filterColumn.indexOf('drip_title') > -1) {
			whereCondition.push({
				drip_title: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('dripId') > -1) {
				let searchKeys = parseInt(searchKey);
				whereCondition.push({
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('templateId') > -1) {
			whereConditionTemplate.push({
				templateId: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('mediatype') > -1) {
			whereConditionTemplate.push({
				header_type: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('templateStatus') > -1) {
			whereConditionTemplate.push({
				templateStatus: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		[err, dripwhatsappNaive] = await to(
			Drip_whatsapp_native.findAll({
				where: {
					[sequelize.Op.or]: whereConditionTemplate,
				},
				attributes: ['PostId'],
			})
		);

		if (dripwhatsappNaive && dripwhatsappNaive.length > 0) {
			for (let Drip of dripwhatsappNaive) {
				dripwhatsappNativeId.push(Drip.PostId);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		[err, dripwhatsappNonNative] = await to(
			Drip_whatsapp_non_native.findAll({
				where: {
					[sequelize.Op.or]: whereConditionTemplate,
				},
				attributes: ['PostId'],
			})
		);

		if (dripwhatsappNonNative && dripwhatsappNonNative.length > 0) {
			for (let drip of dripwhatsappNonNative) {
				dripwhatsappNativeId.push(drip.PostId);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		if (dripwhatsappNativeId && dripwhatsappNativeId.length > 0) {
			[err, TemplateAllDrip] = await to(
				Post.findAll({
					where: {
						ClientId: clientId,
						[sequelize.Op.or]: {
							id: dripwhatsappNativeId,
						},
						is_deleted: false,
					},
					include: [
						{
							model: Drip_whatsapp_non_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
							required: true,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (dripwhatsappNativeId && dripwhatsappNativeId.length > 0) {
			[err, Drip_whatsapp_nativeAll] = await to(
				Post.findAll({
					where: {
						ClientId: clientId,
						[sequelize.Op.or]: {
							id: dripwhatsappNativeId,
						},
						is_deleted: false,
					},
					include: [
						{
							model: Drip_whatsapp_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
							required: true,
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, allDrip] = await to(
				Post.findAll({
					where: {
						ClientId: clientId,
						[sequelize.Op.or]: whereCondition,
						is_deleted: false,
					},
					include: [
						{
							model: Drip_whatsapp_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
						{
							model: Drip_whatsapp_non_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (TemplateAllDrip && TemplateAllDrip.length > 0) {
			for (let template_allDrip of TemplateAllDrip) {
				allData.push(template_allDrip);
			}
		}

		if (Drip_whatsapp_nativeAll && Drip_whatsapp_nativeAll.length > 0) {
			for (let template_allDrip of Drip_whatsapp_nativeAll) {
				allData.push(template_allDrip);
			}
		}

		if (allDrip && allDrip.length > 0) {
			for (let allDrip_ of allDrip) {
				allData.push(allDrip_);
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedTemplatedripId.push(item_.id);
		}

		if (UpdatedTemplatedripId && UpdatedTemplatedripId.length > 0) {
			[err, UpdatedallDrip] = await to(
				Post.findAndCountAll({
					distinct: true,
					SubQuery: false,
					where: {
						id: UpdatedTemplatedripId,
					},
					include: [
						{
							model: Drip_whatsapp_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
						{
							model: Drip_whatsapp_non_native,
							include: [
								{
									model: Asset,
									include: [
										{
											model: Asset_detail,
										},
									],
								},
							],
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);
		}
		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (UpdatedallDrip && UpdatedallDrip.rows && UpdatedallDrip.rows.length > 0) {
			for (let drip of UpdatedallDrip.rows) {
				let drip_ = drip.convertToJSON();
				newList.push(drip_);
			}
		}

		if (newList && newList.length > 0) {
			for (let drip of newList) {
				if (drip.Drip_whatsapp_natives && drip.Drip_whatsapp_natives.length > 0) {
					let _drip = drip;

					_drip.whatsApp_template_data = _drip.Drip_whatsapp_natives[0];
					_drip.whatsApp_template_data.type = 'Only WhatsApp';

					delete _drip.Drip_whatsapp_non_natives;
					delete _drip.Drip_whatsapp_natives;

					finalList.push(_drip);
				}
				if (drip.Drip_whatsapp_non_natives && drip.Drip_whatsapp_non_natives.length > 0) {
					let _drip = drip;

					_drip.whatsApp_template_data = _drip.Drip_whatsapp_non_natives[0];
					_drip.whatsApp_template_data.type = 'DripApp with sharing on WhatsApp';

					delete _drip.Drip_whatsapp_non_natives;
					delete _drip.Drip_whatsapp_natives;

					finalList.push(_drip);
				}
			}
		}

		let count;
		if (UpdatedallDrip != undefined) {
			count = UpdatedallDrip.count;
		} else {
			count = 0;
		}

		return ResponseSuccess(res, {
			data: finalList,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchWhatsAppTemplate = getAllSearchWhatsAppTemplate;

const checkTemplateName = async function (req, res) {
	try {
		const schema = Joi.object({
			clienId: Joi.number().integer().positive().required(),
			templateName: Joi.string().required(),
		});
		const { error, value } = schema.validate({
			clienId: parseInt(req.params.clientId),
			templateName: req.params.templateName,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clienId, templateName } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clienId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clienId = parseInt(req.params.clientId);
		// let templateName = req.params.templateName;
		let valid = true;

		if (templateName.length >= 3 && templateName.length <= 250) {
			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clienId,
					},
					include: [
						{
							model: ClientWhatsAppSetup,
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (clientDetails) {
				[err, getAllClientList] = await to(
					ClientWhatsAppSetup.findAll({
						where: {
							WhatsAppSetupId: clientDetails.ClientWhatsAppSetups[0].WhatsAppSetupId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let ClientListId = [];
				if (getAllClientList && getAllClientList.length > 0) {
					for (let client of getAllClientList) {
						ClientListId.push(client.ClientId);
					}
				}
				if (ClientListId && ClientListId.length > 0) {
					//for WhatsApp Native
					[err, getWhatsAppNativeExitingDrip] = await to(
						Post.findOne({
							where: {
								ClientId: ClientListId,
							},
							include: [
								{
									model: Drip_whatsapp_native,
									where: {
										tempName: templateName,
									},
									required: true,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					if (!getWhatsAppNativeExitingDrip) {
						//For WhatsApp Non Native
						[err, getWhatsAppNonNativeExitingDrip] = await to(
							Post.findOne({
								where: {
									ClientId: ClientListId,
								},
								include: [
									{
										model: Drip_whatsapp_non_native,
										where: {
											tempName: templateName,
										},
										required: true,
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						if (getWhatsAppNonNativeExitingDrip) {
							valid = false;
						}
					} else {
						valid = false;
					}
				}
			}
		} else {
			valid = false;
		}

		let payload = {
			valid: valid,
		};
		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkTemplateName = checkTemplateName;

// Get All Post list by Client for Post
const getAllPostByClientForPost = async function (req, res) {
	try {
		let err;

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

		// let clientId = req.params.clientId;
		let allSubChildClientIds = await getAllSubChildClientIds(clientId);
		allSubChildClientIds.push(parseInt(clientId));

		let limit, offset;
		[err, allPost] = await to(
			Post.findAll({
				where: {
					ClientId: allSubChildClientIds,
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
					{
						model: Client,
					},
					{
						model: User,
						where: {
							status: true,
							is_deleted: false,
						},
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = [];
		if (allPost && allPost.length > 0) {
			for (let allUser of allPost) {
				let userDetail = allUser.convertToJSON();
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
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
				}
				payload.push(userDetail);
			}
		}

		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllPostByClientForPost = getAllPostByClientForPost;

// Get All Post list by Client for use Exsiting Post
const getAllPostByClientForUseExstingPost = async function (req, res) {
	try {
		let err;

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

		// let clientId = req.params.clientId;
		let allSubChildClientIds = await getAllSubChildClientIds(clientId);
		allSubChildClientIds.push(parseInt(clientId));

		[err, allPost] = await to(
			Post.findAll({
				where: {
					ClientId: allSubChildClientIds,
					drip_status: 'Published',
					drip_type: 'Only DripApp',
				},
				include: [
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
					{
						model: Client,
					},
					{
						model: User,
						where: {
							status: true,
							is_deleted: false,
						},
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = [];
		if (allPost && allPost.length > 0) {
			for (let allUser of allPost) {
				let userDetail = allUser.convertToJSON();
				[err, localUser] = await to(
					dbInstance[allUser.User.Market.db_name].User_master.findOne({
						where: {
							id: allUser.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
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
				}
				payload.push(userDetail);
			}
		}

		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllPostByClientForUseExstingPost = getAllPostByClientForUseExstingPost;

// Get All Post list by Client for use Exsiting Post
const getAllDripByClientAndTemplateTypeForUseExstingDrip = async function (req, res) {
	try {
		let err;

		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			template: Joi.string()
				.valid(
					'Single Image',
					'Carousel',
					'Video',
					'Poll',
					'Quiz',
					'Offline Task',
					'Survey',
					'Spin The Wheel',
					'Quiz (Randomised)',
					'Custom Template'
				)
				.required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			template: req.params.templateType,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, template } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let templateType = [];

		if (req.params.templateType === 'Quiz (Randomised)') {
			templateType = ['Quiz', req.params.templateType];
		} else {
			templateType.push(req.params.templateType);
		}

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDrip(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);
		[err, allPost] = await to(
			Post.findAll({
				where: {
					ClientId: allSubClientIds,
					drip_status: 'Published',
					drip_type: ['Only DripApp', 'DripApp with sharing on Email', 'DripApp with sharing on WhatsApp'],
					tempType: templateType,
				},
				include: [
					{
						model: DripQuestion,
						include: [
							{
								model: DripOption,
								include: [
									{
										model: Asset,
										include: [
											{
												model: Asset_detail,
											},
										],
									},
								],
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
					},

					{
						model: Asset,
						include: [
							{
								model: Asset_detail,
							},
						],
					},
					{
						model: Asset,
						through: 'PostBriefAsset',
						include: [
							{
								model: Asset_detail,
							},
						],
						as: 'Post_brief_assets',
					},
				],
				order: [
					['id', 'DESC'],
					[
						{
							model: DripQuestion,
						},
						'id',
						'ASC',
					],
					[
						DripQuestion,
						{
							model: DripOption,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let payload = [];
		if (allPost && allPost.length > 0) {
			for (let allUser of allPost) {
				let userDetail = allUser.convertToJSON();
				payload.push(userDetail);
			}
		}

		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDripByClientAndTemplateTypeForUseExstingDrip = getAllDripByClientAndTemplateTypeForUseExstingDrip;

const checkDripIsUsedOrNot = async function (req, res) {
	try {
		let dripIds = req.body.dripIds;
		[err, checkStatus] = await to(
			Campaign.findAll({
				include: [
					{
						model: Drip_camp,
						where: {
							PostId: dripIds,
						},
						through: 'Campaign_drip_camp_mapping',
						attributes: [],
					},
				],
				attributes: ['id', 'title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: checkStatus,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkDripIsUsedOrNot = checkDripIsUsedOrNot;

//Read Uploaded drip List Excel Sheet
const uploadDripsExcel = async function (req, res) {
	let filename = CONFIG.imagePath + '/uploads/excel/' + req.file.filename;
	exceltojson = xlsxtojson;
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.params.roleId),
			userId: parseInt(req.params.userId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, userId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let roleId = req.params.roleId;
		// let userId = req.params.userId;
		// let clientId = req.params.clientId;

		const options = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Only on Whatsapp',
		};

		const options2 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Drip App With Whatsapp',
		};

		const options3 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Drip App With Email',
		};

		const options4 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'On DripApp',
		};

		//Only on WhatsApp
		exceltojson(options, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					OnlyOnWhatsAppbulkUpload(rows, roleId, userId, clientId, req, res);
				}
			}
		});

		//Drip App with Sharing on WhatsApp
		exceltojson(options2, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					OnDripAppWithSharingOnWhatsAppbulkUpload(rows, roleId, userId, clientId, req, res);
				}
			}
		});

		// //Drip App with Sharing on Email
		exceltojson(options3, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					OnDripAppWithSharingOnEmailbulkUpload(rows, roleId, userId, clientId, req, res);
				}
			}
		});

		// //Only on Drip App
		exceltojson(options4, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					OnlyOnDripAppbulkUpload(rows, roleId, userId, clientId, req, res);
				}
			}
		});

		fs.unlink(filename, (err) => {
			if (err) {
				console.log('Error', err);
			}
		});

		return ResponseSuccess(res, {
			message: MESSAGE.REQUEST_IS_IN_PROGRESS,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadDripsExcel = uploadDripsExcel;

const OnlyOnWhatsAppbulkUpload = async function (data, roleId, userId, clientId, req, res) {
	try {
		let dripList = [];
		let clientDetails;
		let _createPost;
		let createdPostIds = [];
		let excelHearders = [
			'sr. no.',
			'*account id',
			'*drip name',
			'drip description',
			'*language',
			'*whatsapp template category(utility/marketing/authentication)',
			'*header type(text/image/video/document)',
			'*header(if text)',
			'*body',
			'footer',
			'*interaction(call to action/quick replies)',
			'quick reply 1',
			'quick reply 2',
			'quick reply 3',
			'call to action',
			'link',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('header', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let drip_detail = {
					srNo: rows[i]['sr. no.'],
					account_id: rows[i]['*account id'],
					dripName: rows[i]['*drip name'],
					description: rows[i]['drip description'],
					language: rows[i]['*language'],
					whatsappTemplateCategory: rows[i]['*whatsapp template category(utility/marketing/authentication)'],
					headerType: rows[i]['*header type(text/image/video/document)'],
					headerText: rows[i]['*header(if text)'],
					body: rows[i]['*body'],
					footer: rows[i]['footer'],
					interaction: rows[i]['*interaction(call to action/quick replies)'],
					quickReply1: rows[i]['quick reply 1'],
					quickReply2: rows[i]['quick reply 2'],
					quickReply3: rows[i]['quick reply 3'],
					callToAction: rows[i]['call to action'],
					WhatsAppSetupId: null,
					cta_link: rows[i]['link'],
					errorMsg: [],
					isError: false,
					isCreated: false,
					RoleId: parseInt(roleId),
					UserId: parseInt(userId),
					ClientId: clientId,
				};

				//Check Client Details ==>> Valid Ciient Id, Client categery is Client Account or Branch Account
				if (await checkDataIsValidOrNot(drip_detail.account_id)) {
					if (parseInt(drip_detail.account_id) == NaN) {
						drip_detail.errorMsg.push('Account Id is must be in numerical form.');
						drip_detail.isError = true;
					} else {
						[err, clientDetails] = await to(
							Client.findOne({
								where: {
									client_id: drip_detail.account_id,
								},
							})
						);

						if (!clientDetails) {
							drip_detail.errorMsg.push('Account Id is invalid.');
							drip_detail.isError = true;
						} else if (clientDetails) {
							drip_detail.ClientId = clientDetails.id;
							if (clientDetails.category == 'Client Account' || clientDetails.category == 'Branch Account') {
								if (!clientDetails.DripAccess) {
									drip_detail.errorMsg.push("This Account don't have Drip Access.");
									drip_detail.isError = true;
								}
							} else {
								drip_detail.errorMsg.push('Account should be Client or Branch Account.');
								drip_detail.isError = true;
							}
						}
					}
				} else {
					drip_detail.errorMsg.push('Account Id is required.');
					drip_detail.isError = true;
				}

				if (clientDetails) {
					let clientId = clientDetails.id;
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
									attributes: [
										'id',
										'user_id',
										'password',
										'canChangeTempCat',
										'isMeta',
										'MTPNoId',
										'MTToken',
										'MTAccId',
										'MTAppId',
									],
									required: true,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					// console.log("-getWhatsAppSetup--",getWhatsAppSetup.convertToJSON());

					if (!getWhatsAppSetup) {
						drip_detail.errorMsg.push('WhatsApp Setup is not found.');
						drip_detail.isError = true;
					} else {
						if (getWhatsAppSetup && getWhatsAppSetup.WhatsAppSetup && getWhatsAppSetup.WhatsAppSetup.id) {
							drip_detail.WhatsAppSetupId = getWhatsAppSetup.WhatsAppSetup.id;
						} else {
							drip_detail.errorMsg.push('Somthings wents wrong with WhatsApp Setup.');
							drip_detail.isError = true;
						}
					}
				}

				// Check Drip Name
				if ((await checkDataIsValidOrNot(drip_detail.dripName)) == false) {
					drip_detail.errorMsg.push('Drip Name is required.');
					drip_detail.isError = true;
				} else {
					drip_detail.dripName = await capitalFirstLatter(drip_detail.dripName);
				}

				// Check  WhatsApp Template category
				if ((await checkDataIsValidOrNot(drip_detail.whatsappTemplateCategory)) == false) {
					drip_detail.errorMsg.push('Whatsapp Template Category is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = ['Utility', 'Marketing', 'Authentication'];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.whatsappTemplateCategory.toLowerCase()) {
							flag = true;
							drip_detail.whatsappTemplateCategory = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Whatsapp Template Category is invalid.');
						drip_detail.isError = true;
					}
				}

				// Check  Header Type
				if ((await checkDataIsValidOrNot(drip_detail.headerType)) == false) {
					drip_detail.errorMsg.push('Header type is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = ['None', 'Text', 'Image', 'Video', 'Document'];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.headerType.toLowerCase()) {
							flag = true;
							drip_detail.headerType = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Header type is invalid.');
						drip_detail.isError = true;
					}
				}

				// Check Header Text
				if (drip_detail.headerType.toLowerCase() == 'text') {
					if ((await checkDataIsValidOrNot(drip_detail.headerText)) == false) {
						drip_detail.errorMsg.push('Header Text is required.');
						drip_detail.isError = true;
					} else if (drip_detail.headerText.length > 60) {
						drip_detail.errorMsg.push('header Text characters is greater than 60');
						drip_detail.isError = true;
					}
				}

				if ((await checkDataIsValidOrNot(drip_detail.body)) == false) {
					drip_detail.errorMsg.push('Body is required.');
					drip_detail.isError = true;
				} else {
					if (drip_detail.body.length > 1024) {
						drip_detail.errorMsg.push('Body characters is greater than 1024');
						drip_detail.isError = true;
					}
				}

				if (drip_detail.footer.length > 60) {
					drip_detail.errorMsg.push('Footer Characters is greater than 60.');
					drip_detail.isError = true;
				}

				if (drip_detail.quickReply1.length > 25) {
					drip_detail.errorMsg.push('Quick Reply 1 characters is greater than 25');
					drip_detail.isError = true;
				}

				if (drip_detail.quickReply2.length > 25) {
					drip_detail.errorMsg.push('Quick Reply 2 characters is greater than 25');
					drip_detail.isError = true;
				}

				if (drip_detail.quickReply3.length > 25) {
					drip_detail.errorMsg.push('Quick Reply 3 characters is greater than 25');
					drip_detail.isError = true;
				}

				if (
					drip_detail.interaction.toLowerCase() == 'quick replies' &&
					(await checkDataIsValidOrNot(drip_detail.quickReply1)) == false &&
					(await checkDataIsValidOrNot(drip_detail.quickReply2)) == false &&
					(await checkDataIsValidOrNot(drip_detail.quickReply3)) == false
				) {
					drip_detail.errorMsg.push('At least add one quick reply.');
					drip_detail.isError = true;
				} else if (
					drip_detail.interaction.toLowerCase().indexOf('qui') >= 0 ||
					drip_detail.interaction.toLowerCase().indexOf('quick repl') >= 0 ||
					drip_detail.interaction.toLowerCase().indexOf('quick replies') >= 0
				) {
					drip_detail.interaction = 'Quick Replies';
				}

				if (
					(await checkDataIsValidOrNot(drip_detail.callToAction)) == false &&
					drip_detail.interaction.toLowerCase() == 'call to action'
				) {
					drip_detail.errorMsg.push('Call to action is required.');
					drip_detail.isError = true;
				} else if (
					drip_detail.interaction.toLowerCase().indexOf('cal') >= 0 ||
					drip_detail.interaction.toLowerCase().indexOf('call to') >= 0 ||
					drip_detail.interaction.toLowerCase().indexOf('call to action') >= 0
				) {
					drip_detail.interaction = 'Call to Action';
				} else {
					if (drip_detail.callToAction.length > 25) {
						drip_detail.errorMsg.push('CTA Characters is greater than 25');
						drip_detail.isError = true;
					}
				}

				drip_detail.errorMsg = drip_detail.errorMsg.toString();
				dripList.push(drip_detail);
			}

			if (dripList && dripList.length > 0) {
				[err, uploadBulkDrip] = await to(UplodedOnlyOnWhatsapp.bulkCreate(dripList));

				if (err) {
					console.log('----uploadBulkDrip----', err);
				}

				[err, uplodedDripDetails] = await to(
					UplodedOnlyOnWhatsapp.findAll({
						where: {
							RoleId: roleId,
							UserId: userId,
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							isCreated: false,
							isError: false,
						},
					})
				);

				let uploadDripIds = [];

				if (uplodedDripDetails && uplodedDripDetails.length > 0) {
					for (let dripDetail of uplodedDripDetails) {
						let drip_data = {
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							UserId: userId,
							drip_status: 'Draft',
							is_deleted: false,
							drip_description: dripDetail.description,
							drip_title: dripDetail.dripName,
							drip_type: 'Only WhatsApp',
						};

						[err, _createPost] = await to(Post.create(drip_data));

						if (err) {
							console.log('-createPost--', err);
						}
						if (_createPost) {
							createdPostIds.push(_createPost.id);
							let whatsApp_native_drip_data = {
								body: dripDetail.body,
								footer: dripDetail.footer,
								header_type: dripDetail.headerType,
								header_text: dripDetail && dripDetail.headerType.toLowerCase() == 'text' ? dripDetail.headerText : null,
								quickReply1: dripDetail.quickReply1,
								quickReply2: dripDetail.quickReply2,
								quickReply3: dripDetail.quickReply3,
								templateStatus: 'Not Created',
								PostId: _createPost.id,
								interaction: dripDetail.interaction,
								callToActionText: dripDetail.callToAction,
								tempLang: 'en',
								tempCategory: dripDetail.whatsappTemplateCategory,
								WhatsAppSetupId: dripDetail.WhatsAppSetupId,
								hyper_link: dripDetail.cta_link,
							};

							// console.log("--whatsApp_native_drip_data--",whatsApp_native_drip_data);
							if (dripDetail.body) {
								whatsApp_native_drip_data.body = whatsApp_native_drip_data.body.trimStart().trimEnd();
							}

							if (dripDetail.footer) {
								whatsApp_native_drip_data.footer = whatsApp_native_drip_data.footer.trimStart().trimEnd();
							}

							if (dripDetail && dripDetail.headerType.toLowerCase() == 'text' && dripDetail.headerText) {
								whatsApp_native_drip_data.header_text = whatsApp_native_drip_data.header_text.trimStart().trimEnd();
							}

							if (dripDetail.quickReply1) {
								whatsApp_native_drip_data.quickReply1 = whatsApp_native_drip_data.quickReply1.trimStart().trimEnd();
							}

							if (dripDetail.quickReply2) {
								whatsApp_native_drip_data.quickReply2 = whatsApp_native_drip_data.quickReply2.trimStart().trimEnd();
							}

							if (dripDetail.quickReply3) {
								whatsApp_native_drip_data.quickReply3 = whatsApp_native_drip_data.quickReply3.trimStart().trimEnd();
							}

							if (dripDetail.interaction) {
								whatsApp_native_drip_data.callToActionText = whatsApp_native_drip_data.callToActionText
									.trimStart()
									.trimEnd();
							}

							[err, _create_whatsApp_native_drip] = await to(Drip_whatsapp_native.create(whatsApp_native_drip_data));

							if (err) {
								console.log('-createPost--', err);
							}

							uploadDripIds.push(dripDetail.id);
						}
					}

					if (uploadDripIds && uploadDripIds.length > 0) {
						[err, updateStatus] = await to(
							UplodedOnlyOnWhatsapp.update(
								{
									isCreated: true,
								},
								{
									where: {
										id: uploadDripIds,
									},
								}
							)
						);

						if (err) {
							console.log('-updateStatus--', err);
						}
					}
				}

				let notifcationMessage = MESSAGE.drip_bulk_upload;
				notifcationMessage = notifcationMessage.replace('{{drip_type}}', 'Only on WhatsApp');
				notifcationMessage = notifcationMessage.replace('{{count}}', uploadDripIds.length);
				notifcationMessage = notifcationMessage.replace('{{drip}}', uploadDripIds.length === 1 ? 'Drip' : 'Drips');
				await createNotification(notifcationMessage, ['Bell'], [userId]);
				if (createdPostIds && createdPostIds.length > 0) {
					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Upload Drip (Only on WhatsApp)`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								PostId: createdPostIds,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}

				if (err) {
					console.log('----ERROR----', err);
				}

				return {
					message: MESSAGE.CREATE_ALL_DRIP_EXCEL,
				};
			}
		} else {
			// return ResponseError(res, { message: MESSAGE.INVALID_DRIP_EXCEL_HEADER }, 500, true);
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const OnDripAppWithSharingOnWhatsAppbulkUpload = async function (data, roleId, userId, clientId, req, res) {
	try {
		let dripList = [];
		let clientDetails;
		let createdPostIds = [];
		let _createPost;
		let excelHearders = [
			'sr. no.',
			'*account id',
			'*drip name',
			'drip description',
			'*language',
			'login required(yes/no)',
			'*whatsapp template category(utility/marketing/authentication)',
			'*header type(text/image/video/document)',
			'*header(if text)',
			'*body',
			'footer',
			'*call to action',
			'*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)',
			'caption',
			'select result layout for pwa(scale chart/pie chart/bar chart)',
			'show correct answers and scores on pwa(yes/no)',
			'timing to show(upon submission/after the deadline)',
			'number of random questions for each contact',
			'task brief',
			'question no.',
			'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)',
			'questions text',
			'option no.',
			'options text',
			'answer key',
			'text response required(yes/no)',
			'file submission required(yes/no)',
			'allow only specific file types (pdf/video/image)',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('headerDripWIthWhasApp', header);
				validHeader = false;
			}
		}
		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let drip_detail = {
					srNo: rows[i]['sr. no.'],
					dripName: rows[i]['*drip name'],
					description: rows[i]['drip description'],
					loginRequired: rows[i]['login required(yes/no)'],
					language: 'English',
					whatsappTemplateCategory: rows[i]['*whatsapp template category(utility/marketing/authentication)'],
					headerType: rows[i]['*header type(text/image/video/document)'],
					headerText: rows[i]['*header(if text)'],
					body: rows[i]['*body'],
					footer: rows[i]['footer'],
					callToAction: rows[i]['*call to action'],
					templateType:
						rows[i]['*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)'],
					caption: rows[i]['caption'],
					errorMsg: [],
					isError: false,
					isCreated: false,
					RoleId: parseInt(roleId),
					UserId: parseInt(userId),
					ClientId: clientId,
					account_id: rows[i]['*account id'],
					WhatsAppSetupId: null,
					Questions: [],
					pollResultType: rows[i]['select result layout for pwa(scale chart/pie chart/bar chart)'],
					showCorrectAns: rows[i]['show correct answers and scores on pwa(yes/no)'],
					quizResultType: rows[i]['timing to show(upon submission/after the deadline)'],
					quizRandCount: rows[i]['number of random questions for each contact'],
					brief: rows[i]['task brief'],
					isTextResponse: rows[i]['text response required(yes/no)'],
					isFileSubmission: rows[i]['file submission required(yes/no)'],
					allowFileTypes: rows[i]['allow only specific file types (pdf/video/image)'],
				};

				//Check Client Details ==>> Valid Ciient Id, Client categery is Client Account or Branch Account
				if (await checkDataIsValidOrNot(drip_detail.account_id)) {
					if (parseInt(drip_detail.account_id) == NaN) {
						drip_detail.errorMsg.push('Account Id is must be in numerical form.');
						drip_detail.isError = true;
					} else {
						[err, clientDetails] = await to(
							Client.findOne({
								where: {
									client_id: drip_detail.account_id,
								},
							})
						);

						if (!clientDetails) {
							drip_detail.errorMsg.push('Account Id is invalid.');
							drip_detail.isError = true;
						} else if (clientDetails) {
							drip_detail.ClientId = clientDetails.id;
							if (clientDetails.category == 'Client Account' || clientDetails.category == 'Branch Account') {
								if (!clientDetails.DripAccess) {
									drip_detail.errorMsg.push("This Account don't have Drip Access.");
									drip_detail.isError = true;
								}
							} else {
								drip_detail.errorMsg.push('Account should be Client or Branch Account.');
								drip_detail.isError = true;
							}
						}
					}
				} else {
					drip_detail.errorMsg.push('Account Id is required.');
					drip_detail.isError = true;
				}

				if (clientDetails) {
					let clientId = clientDetails.id;
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
									attributes: [
										'id',
										'user_id',
										'password',
										'canChangeTempCat',
										'isMeta',
										'MTPNoId',
										'MTToken',
										'MTAccId',
										'MTAppId',
									],
									required: true,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (!getWhatsAppSetup) {
						drip_detail.errorMsg.push('WhatsApp Setup is not found.');
						drip_detail.isError = true;
					} else {
						if (getWhatsAppSetup && getWhatsAppSetup.WhatsAppSetup && getWhatsAppSetup.WhatsAppSetup.id) {
							drip_detail.WhatsAppSetupId = getWhatsAppSetup.WhatsAppSetup.id;
						} else {
							drip_detail.errorMsg.push('Somthings wents wrong with WhatsApp Setup.');
							drip_detail.isError = true;
						}
					}
				}

				// Check Drip Name
				if ((await checkDataIsValidOrNot(drip_detail.dripName)) == false) {
					drip_detail.errorMsg.push('Drip Name is required.');
					drip_detail.isError = true;
				} else {
					drip_detail.dripName = await capitalFirstLatter(drip_detail.dripName);
				}

				// Check  Header Type
				if ((await checkDataIsValidOrNot(drip_detail.headerType)) == false) {
					drip_detail.errorMsg.push('Header type is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = ['None', 'Text', 'Image', 'Video', 'Document'];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.headerType.toLowerCase()) {
							flag = true;
							drip_detail.headerType = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Header type is invalid.');
						drip_detail.isError = true;
					}
				}

				// Check Header Text
				if (drip_detail.headerType.toLowerCase() == 'text') {
					if ((await checkDataIsValidOrNot(drip_detail.headerText)) == false) {
						drip_detail.errorMsg.push('Header Text is required.');
						drip_detail.isError = true;
					} else if (drip_detail.headerText.length > 60) {
						drip_detail.errorMsg.push('header Text characters is greater than 60');
						drip_detail.isError = true;
					}
				}

				// Check Content Template
				if ((await checkDataIsValidOrNot(drip_detail.templateType)) == false) {
					drip_detail.errorMsg.push('Content Template is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = [
						'Single Image',
						'Carousel',
						'Video',
						'Poll',
						'Quiz',
						'Quiz (Randomised)',
						'Survey',
						'Offline Task',
					];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.templateType.toLowerCase()) {
							flag = true;
							drip_detail.templateType = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Content Template is invalid.');
						drip_detail.isError = true;
					}
				}

				// Check Poll  Result Layout
				if (drip_detail.templateType == 'Poll' && (await checkDataIsValidOrNot(drip_detail.pollResultType)) == false) {
					drip_detail.errorMsg.push('Poll Result Layout is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Reult Layout  Type
					let resultTypes = ['Scale Chart', 'Pie Chart', 'Bar Chart'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.pollResultType.toLowerCase()) {
							flag = true;
							drip_detail.pollResultType = type;
							break;
						}
					}
				}

				// Check  Template category
				if ((await checkDataIsValidOrNot(drip_detail.whatsappTemplateCategory)) == false) {
					drip_detail.errorMsg.push('Whatsapp Template Category is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = ['Utility', 'Marketing', 'Authentication'];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.whatsappTemplateCategory.toLowerCase()) {
							flag = true;
							drip_detail.whatsappTemplateCategory = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Whatsapp Template Category is invalid.');
						drip_detail.isError = true;
					}
				}

				if (drip_detail.footer.length > 60) {
					drip_detail.errorMsg.push('Footer Characters is greater than 60.');
					drip_detail.isError = true;
				}

				if ((await checkDataIsValidOrNot(drip_detail.body)) == false) {
					drip_detail.errorMsg.push('Body is required.');
					drip_detail.isError = true;
				} else {
					if (drip_detail.body.length > 1024) {
						drip_detail.errorMsg.push('Body Copy Characters is greater than 1024.');
						drip_detail.isError = true;
					}
				}

				if ((await checkDataIsValidOrNot(drip_detail.callToAction)) == false) {
					drip_detail.errorMsg.push('Call To Action  is required.');
					drip_detail.isError = true;
				} else {
					if (drip_detail.callToAction.length > 25) {
						drip_detail.errorMsg.push('Call to Action Characters is greater than 25.');
						drip_detail.isError = true;
					}
				}

				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					(await checkDataIsValidOrNot(
						rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
					)) == false
				) {
					drip_detail.errorMsg.push('Question Type is required.');
					drip_detail.isError = true;
				} else if (drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') {
					let quizType = ['MCQ', 'Drag and Drop'];
					let flag = false;
					for (let type of quizType) {
						if (
							type.toLowerCase() ==
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
						) {
							flag = true;
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] = type;
							break;
						}
					}
				}

				// Check Quiz Show Correct Incorrect On PWA
				drip_detail.showCorrectAns = drip_detail.showCorrectAns ? drip_detail.showCorrectAns.toLowerCase() : '';
				if (
					drip_detail.showCorrectAns == '' ||
					drip_detail.showCorrectAns == 'no' ||
					drip_detail.showCorrectAns == 'false' ||
					drip_detail.showCorrectAns == false
				) {
					drip_detail.showCorrectAns = false;
				} else {
					drip_detail.showCorrectAns = true;
				}

				// Check Quiz Show Timing On PWA
				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					drip_detail.showCorrectAns &&
					(await checkDataIsValidOrNot(drip_detail.quizResultType)) == false
				) {
					drip_detail.errorMsg.push('Timing To Show is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Show  Type
					let resultTypes = ['Upon Submission', 'After the Deadline'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.quizResultType.toLowerCase()) {
							flag = true;
							drip_detail.quizResultType = type;
							break;
						}
					}
				}

				if (drip_detail.templateType == 'Quiz (Randomised)') {
					if (await checkDataIsValidOrNot(drip_detail.quizRandCount)) {
						if (isNaN(drip_detail.quizRandCount)) {
							drip_detail.errorMsg.push('Random question number must be in numerical form.');
							drip_detail.isError = true;
						} else {
							drip_detail.quizRandCount = parseInt(drip_detail.quizRandCount);
						}
					} else {
						drip_detail.errorMsg.push('Random question number is required.');
						drip_detail.isError = true;
					}
				}

				// Check Caption
				if ((await checkDataIsValidOrNot(drip_detail.caption)) == false) {
					drip_detail.errorMsg.push('Caption is required.');
					drip_detail.isError = true;
				}

				drip_detail.loginRequired = drip_detail.loginRequired.toLowerCase();
				if (
					drip_detail.loginRequired == '' ||
					drip_detail.loginRequired == 'no' ||
					drip_detail.loginRequired == 'false' ||
					drip_detail.loginRequired == false
				) {
					drip_detail.loginRequired = false;
				} else {
					drip_detail.loginRequired = true;
				}

				//Code For Poll and Quiz

				if (
					drip_detail.templateType.toLowerCase() == 'poll' ||
					drip_detail.templateType.toLowerCase() == 'quiz' ||
					drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
					drip_detail.templateType.toLowerCase() == 'offline task' ||
					drip_detail.templateType.toLowerCase() == 'survey'
				) {
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;
					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							if (
								rows[j]['question no.'] ||
								rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] ||
								rows[j]['questions text']
							) {
								//Question Validation

								if (rows[j]['question no.'] == '') {
									drip_detail.errorMsg.push('Question No. is required.');
									drip_detail.isError = true;
								} else if (parseInt(rows[j]['question no.']) == NaN) {
									drip_detail.errorMsg.push('Question No. is invalid.');
									drip_detail.isError = true;
								}

								if (
									rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] == '' &&
									(drip_detail.templateType == 'Quiz' ||
										drip_detail.templateType == 'Quiz (Randomised)' ||
										drip_detail.templateType == 'Survey')
								) {
									drip_detail.errorMsg.push('Question Type is required.');
									drip_detail.isError = true;
								}

								if (rows[j]['questions text'] == '') {
									drip_detail.errorMsg.push('questions text is required.');
									drip_detail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											isTextResponse:
												drip_detail.isTextResponse != '' && drip_detail.isTextResponse != null
													? drip_detail.isTextResponse
													: false,
											isFileSubmission:
												drip_detail.isFileSubmission != '' && drip_detail.isFileSubmission != null
													? drip_detail.isFileSubmission
													: false,
											allowFileTypes: rows[j]['allow only specific file types (pdf/video/image)'],
										},
										Options: options,
									};

									drip_detail.Questions.push(payload);

									question_text = null;
									question_type = null;

									if (options.length < 2) {
										drip_detail.errorMsg.push('Please add mininmum 2 Options.');
										drip_detail.isError = true;
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];

									options = [];
								} else if (drip_detail.templateType == 'Offline Task') {
									drip_detail.isTextResponse = rows[j]['text response required(yes/no)']
										? rows[j]['text response required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isTextResponse == '' ||
										drip_detail.isTextResponse == 'no' ||
										drip_detail.isTextResponse == 'false' ||
										drip_detail.isTextResponse == false
									) {
										drip_detail.isTextResponse = false;
									} else {
										drip_detail.isTextResponse = true;
									}

									drip_detail.isFileSubmission = rows[j]['file submission required(yes/no)']
										? rows[j]['file submission required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isFileSubmission == '' ||
										drip_detail.isFileSubmission == 'no' ||
										drip_detail.isFileSubmission == 'false' ||
										drip_detail.isFileSubmission == false
									) {
										drip_detail.isFileSubmission = false;
									} else {
										drip_detail.isFileSubmission = true;
									}

									// Check File Upload Type for Offline task
									if (
										drip_detail.templateType == 'Offline Task' &&
										drip_detail.isFileSubmission &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let question_type = null;
									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: question_type,
											isTextResponse: drip_detail.isTextResponse,
											isFileSubmission: drip_detail.isFileSubmission,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: [],
									};

									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else if (
									drip_detail.templateType == 'Survey' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'mcq' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'rating scale'
								) {
									// Check File Upload Type for Survey
									if (
										drip_detail.templateType == 'Survey' &&
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload' &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: questionType,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: options,
									};
									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else {
									let questionType = '';

									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];
								}
							}

							if (
								drip_detail.templateType.toLowerCase() == 'poll' ||
								drip_detail.templateType.toLowerCase() == 'quiz' ||
								drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
								(drip_detail.templateType.toLowerCase() == 'survey' &&
									(question_type == 'MCQ' || question_type == 'Rating scale'))
							) {
								if (rows[j]['option no.'] || rows[j]['options text']) {
									//Option Validation

									let answer = false;

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										question_type == 'MCQ' &&
										rows[j]['answer key'] == ''
									) {
										drip_detail.errorMsg.push('Answer Key is required.');
										drip_detail.isError = true;
									}

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										rows[j]['answer key'] != '' &&
										question_type == 'MCQ'
									) {
										let key = rows[j]['answer key'].toLowerCase();
										if (key == 'no' || key == 'false' || key == false) {
											answer = false;
										}
										if (key == 'yes' || key == 'true' || key == true) {
											answer = true;
										}
									}

									if (rows[j]['option no.'] == '') {
										drip_detail.errorMsg.push('Option No. is required.');
										drip_detail.isError = true;
									} else if (parseInt(rows[j]['option no.']) == NaN) {
										drip_detail.errorMsg.push('Option No. is invalid.');
										drip_detail.isError = true;
									}

									if (rows[j]['options text'] == '') {
										drip_detail.errorMsg.push('Option Text is required.');
										drip_detail.isError = true;
									}

									let payload = {
										no: rows[j]['option no.'],
										text: rows[j]['options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
											},
											Options: options,
										};

										if (options.length < 2) {
											drip_detail.errorMsg.push('Please add mininmum 2 Options.');
											drip_detail.isError = true;
										}

										drip_detail.Questions.push(payload);

										const QuestionsArray = drip_detail.Questions;

										if (
											drip_detail.templateType == 'Quiz (Randomised)' &&
											parseInt(drip_detail.quizRandCount) > QuestionsArray.length
										) {
											drip_detail.errorMsg.push('Please add random question as per random number.');
											drip_detail.isError = true;
										}

										options = [];
										i = j;
										flag = false;
									}
								} else {
									drip_detail.errorMsg.push('Please provide options all details.');
									drip_detail.isError = true;
								}
							}
						}
					}
				}

				drip_detail.errorMsg = drip_detail.errorMsg.toString();
				drip_detail.Questions = JSON.stringify(drip_detail.Questions);
				dripList.push(drip_detail);
			}

			if (dripList && dripList.length > 0) {
				[err, uploadBulkDrip] = await to(UplodedDripAppWhatsapp.bulkCreate(dripList));
				if (err) {
					console.log('----uploadBulkDrip----', err);
				}

				// return;
				[err, uplodedDripDetails] = await to(
					UplodedDripAppWhatsapp.findAll({
						where: {
							RoleId: roleId,
							UserId: userId,
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							isCreated: false,
							isError: false,
						},
					})
				);

				let uploadDripIds = [];
				if (uplodedDripDetails && uplodedDripDetails.length > 0) {
					for (let dripDetail of uplodedDripDetails) {
						let drip_data_native = {
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							UserId: userId,
							drip_status: 'Draft',
							is_deleted: false,
							drip_description: dripDetail.description,
							drip_title: dripDetail.dripName,
							drip_type: 'DripApp with sharing on WhatsApp',
							caption: dripDetail.caption,
							tempType: dripDetail.templateType,
							requiredLogging: dripDetail.loginRequired,
							pollResultType: dripDetail.pollResultType,
							showCorrectAns: dripDetail.showCorrectAns,
							quizResultType: dripDetail.quizResultType,
							brief: dripDetail.brief,
							quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
						};

						[err, _createPost] = await to(Post.create(drip_data_native));

						if (err) {
							console.log('-createPost--', err);
						}

						if (_createPost) {
							createdPostIds.push(_createPost.id);

							let whatsApp_non_native_drip_data = {
								body: dripDetail.body,
								footer: dripDetail.footer,
								header_type: dripDetail.headerType,
								header_text: dripDetail && dripDetail.headerType.toLowerCase() == 'text' ? dripDetail.headerText : null,
								contentType: 'Create New Drip',
								templateStatus: 'Not Created',
								PostId: _createPost.id,
								callToActionText: dripDetail.callToAction,
								caption: dripDetail.caption,
								templateType: dripDetail.templateType,
								tempLang: 'en',
								tempCategory: dripDetail.whatsappTemplateCategory,
								WhatsAppSetupId: dripDetail.WhatsAppSetupId,
								pollResultType: dripDetail.pollResultType,
								showCorrectAns: dripDetail.showCorrectAns,
								quizResultType: dripDetail.quizResultType,
								brief: dripDetail.brief,
								quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
							};

							if (dripDetail.body) {
								whatsApp_non_native_drip_data.body = whatsApp_non_native_drip_data.body.trimStart().trimEnd();
							}

							if (dripDetail.footer) {
								whatsApp_non_native_drip_data.footer = whatsApp_non_native_drip_data.footer.trimStart().trimEnd();
							}

							if (dripDetail && dripDetail.headerType.toLowerCase() == 'text' && dripDetail.headerText) {
								whatsApp_non_native_drip_data.header_text = whatsApp_non_native_drip_data.header_text
									.trimStart()
									.trimEnd();
							}
							whatsApp_non_native_drip_data.interaction = 'Call to Action';
							whatsApp_non_native_drip_data.type = 'dynamic';
							[err, _create_whatsApp_non_native_drip_data] = await to(
								Drip_whatsapp_non_native.create(whatsApp_non_native_drip_data)
							);

							if (err) {
								console.log('-_create_drip_native--', err);
							}

							uploadDripIds.push(dripDetail.id);

							if (
								dripDetail.templateType == 'Poll' ||
								dripDetail.templateType == 'Quiz' ||
								dripDetail.templateType == 'Quiz (Randomised)' ||
								dripDetail.templateType == 'Offline Task' ||
								dripDetail.templateType == 'Survey'
							) {
								if (dripDetail.Questions) {
									let questions = JSON.parse(dripDetail.Questions);
									if (questions && questions.length > 0) {
										for (let que of questions) {
											if (que.Question.text) {
												let payload = {
													PostId: _createPost.id,
													question: que.Question.text,
													questionType: que.Question.type ? que.Question.type : null,
													ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
													AssetId: null,
													isTextResponse:
														que.Question.isTextResponse != '' && que.Question.isTextResponse != null
															? que.Question.isTextResponse
															: false,
													isFileSubmission:
														que.Question.isFileSubmission != '' && que.Question.isFileSubmission != null
															? que.Question.isFileSubmission
															: false,
													allowFileTypes: que.Question.allowFileTypes,
												};
												[err, create_question] = await to(DripQuestion.create(payload));
												// if (err) return ResponseError(res, err, 500, true);
												let count = 1;
												let optionData = [];
												for (let opt of que.Options) {
													let payload = {
														PostId: _createPost.id,
														ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
														DripQuestionId: create_question.id,
														isCorrectAnswer: opt.isCurrectAnswer,
														AssetId: null,
														text: opt.text,
														sr_no: count,
													};
													optionData.push(payload);

													count++;
												}
												if (optionData && optionData.length > 0) {
													[err, create_option] = await to(DripOption.bulkCreate(optionData));
													// if (err) return ResponseError(res, err, 500, true);
												}
											}
										}
									}
								}
							}
						}
					}

					if (uploadDripIds && uploadDripIds.length > 0) {
						[err, updateStatus] = await to(
							UplodedDripAppWhatsapp.update(
								{
									isCreated: true,
								},
								{
									where: {
										id: uploadDripIds,
									},
								}
							)
						);

						if (err) {
							console.log('-updateStatus--', err);
						}
					}
				}

				let notifcationMessage = MESSAGE.drip_bulk_upload;
				notifcationMessage = notifcationMessage.replace('{{drip_type}}', 'On Drip App with sharing on WhatsApp');
				notifcationMessage = notifcationMessage.replace('{{count}}', uploadDripIds.length);
				notifcationMessage = notifcationMessage.replace('{{drip}}', uploadDripIds.length === 1 ? 'Drip' : 'Drips');
				await createNotification(notifcationMessage, ['Bell'], [userId]);
				if (createdPostIds && createdPostIds.length > 0) {
					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Upload Drip ('On Drip App with sharing on WhatsApp)`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								PostId: createdPostIds,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
				if (err) {
					console.log('----ERROR----', err);
				}

				return {
					message: MESSAGE.CREATE_ALL_DRIP_EXCEL,
				};
			}
		} else {
			// return ResponseError(res, { message: MESSAGE.INVALID_DRIP_EXCEL_HEADER }, 500, true);
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const OnDripAppWithSharingOnEmailbulkUpload = async function (data, roleId, userId, clientId, req, res) {
	try {
		let dripList = [];
		let clientDetails;
		let createdPostIds = [];
		let _createPost;
		let excelHearders = [
			'sr. no.',
			'*account id',
			'*drip name',
			'drip description',
			'login required(yes/no)',
			'*subject line',
			'*body copy',
			'*call to action',
			'*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)',
			'caption',
			'select result layout for pwa(scale chart/pie chart/bar chart)',
			'show correct answers and scores on pwa(yes/no)',
			'timing to show(upon submission/after the deadline)',
			'number of random questions for each contact',
			'task brief',
			'question no.',
			'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)',
			'questions text',
			'option no.',
			'options text',
			'answer key',
			'text response required(yes/no)',
			'file submission required(yes/no)',
			'allow only specific file types (pdf/video/image)',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log(header);
				validHeader = false;
			}
		}
		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let drip_detail = {
					srNo: rows[i]['sr. no.'],
					dripName: rows[i]['*drip name'],
					description: rows[i]['drip description'],
					loginRequired: rows[i]['login required(yes/no)'],
					subjectline: rows[i]['*subject line'],
					bodycopy: rows[i]['*body copy'],
					callToAction: rows[i]['*call to action'],
					errorMsg: [],
					isError: false,
					isCreated: false,
					RoleId: parseInt(roleId),
					UserId: parseInt(userId),
					ClientId: clientId,
					account_id: rows[i]['*account id'],
					templateType:
						rows[i]['*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)'],
					caption: rows[i]['caption'],
					Questions: [],
					pollResultType: rows[i]['select result layout for pwa(scale chart/pie chart/bar chart)'],
					showCorrectAns: rows[i]['show correct answers and scores on pwa(yes/no)'],
					quizResultType: rows[i]['timing to show(upon submission/after the deadline)'],
					quizRandCount: rows[i]['number of random questions for each contact'],
					brief: rows[i]['task brief'],
					isTextResponse: rows[i]['text response required(yes/no)'],
					isFileSubmission: rows[i]['file submission required(yes/no)'],
					allowFileTypes: rows[i]['allow only specific file types (pdf/video/image)'],
				};

				//Check Client Details ==>> Valid Ciient Id, Client categery is Client Account or Branch Account
				if (await checkDataIsValidOrNot(drip_detail.account_id)) {
					if (parseInt(drip_detail.account_id) == NaN) {
						drip_detail.errorMsg.push('Account Id is must be in numerical form.');
						drip_detail.isError = true;
					} else {
						[err, clientDetails] = await to(
							Client.findOne({
								where: {
									client_id: drip_detail.account_id,
								},
							})
						);

						if (!clientDetails) {
							drip_detail.errorMsg.push('Account Id is invalid.');
							drip_detail.isError = true;
						} else if (clientDetails) {
							drip_detail.ClientId = clientDetails.id;
							if (clientDetails.category == 'Client Account' || clientDetails.category == 'Branch Account') {
								if (!clientDetails.DripAccess) {
									drip_detail.errorMsg.push("This Account don't have Drip Access.");
									drip_detail.isError = true;
								}
							} else {
								drip_detail.errorMsg.push('Account should be Client or Branch Account.');
								drip_detail.isError = true;
							}
						}
					}
				} else {
					drip_detail.errorMsg.push('Account Id is required.');
					drip_detail.isError = true;
				}

				// Check Drip Name
				if ((await checkDataIsValidOrNot(drip_detail.dripName)) == false) {
					drip_detail.errorMsg.push('Drip Name is required.');
					drip_detail.isError = true;
				} else {
					drip_detail.dripName = await capitalFirstLatter(drip_detail.dripName);
				}

				// Check Content Template
				if ((await checkDataIsValidOrNot(drip_detail.templateType)) == false) {
					drip_detail.errorMsg.push('Content Template is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = [
						'Single Image',
						'Carousel',
						'Video',
						'Poll',
						'Quiz',
						'Quiz (Randomised)',
						'Survey',
						'Offline Task',
					];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.templateType.toLowerCase()) {
							flag = true;
							drip_detail.templateType = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Content Template is invalid.');
						drip_detail.isError = true;
					}
				}

				if ((await checkDataIsValidOrNot(drip_detail.subjectline)) == false) {
					drip_detail.errorMsg.push('Subject Line  is required.');
					drip_detail.isError = true;
				}

				if ((await checkDataIsValidOrNot(drip_detail.bodycopy)) == false) {
					drip_detail.errorMsg.push('Body Copy  is required.');
					drip_detail.isError = true;
				} else {
					if (drip_detail.bodycopy.length > 1024) {
						drip_detail.errorMsg.push('Body Copy Characters is greater than 1024.');
						drip_detail.isError = true;
					}
				}

				if ((await checkDataIsValidOrNot(drip_detail.callToAction)) == false) {
					drip_detail.errorMsg.push('Call To Action  is required.');
					drip_detail.isError = true;
				} else {
					if (drip_detail.callToAction.length > 25) {
						drip_detail.errorMsg.push('Call to Action Characters is greater than 25.');
						drip_detail.isError = true;
					}
				}

				// Check Poll  Result Layout
				if (drip_detail.templateType == 'Poll' && (await checkDataIsValidOrNot(drip_detail.pollResultType)) == false) {
					drip_detail.errorMsg.push('Poll Result Layout is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Reult Layout  Type
					let resultTypes = ['Scale Chart', 'Pie Chart', 'Bar Chart'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.pollResultType.toLowerCase()) {
							flag = true;
							drip_detail.pollResultType = type;
							break;
						}
					}
				}

				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					(await checkDataIsValidOrNot(
						rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
					)) == false
				) {
					drip_detail.errorMsg.push('Question Type is required.');
					drip_detail.isError = true;
				} else if (drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') {
					let quizType = ['MCQ', 'Drag and Drop'];
					let flag = false;
					for (let type of quizType) {
						if (
							type.toLowerCase() ==
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
						) {
							flag = true;
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] = type;
							break;
						}
					}
				}

				// Check Quiz Show Correct Incorrect On PWA
				drip_detail.showCorrectAns = drip_detail.showCorrectAns ? drip_detail.showCorrectAns.toLowerCase() : '';
				if (
					drip_detail.showCorrectAns == '' ||
					drip_detail.showCorrectAns == 'no' ||
					drip_detail.showCorrectAns == 'false' ||
					drip_detail.showCorrectAns == false
				) {
					drip_detail.showCorrectAns = false;
				} else {
					drip_detail.showCorrectAns = true;
				}

				// Check Quiz Show Timing On PWA
				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					drip_detail.showCorrectAns &&
					(await checkDataIsValidOrNot(drip_detail.quizResultType)) == false
				) {
					drip_detail.errorMsg.push('Timing To Show is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Show  Type
					let resultTypes = ['Upon Submission', 'After the Deadline'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.quizResultType.toLowerCase()) {
							flag = true;
							drip_detail.quizResultType = type;
							break;
						}
					}
				}

				if (drip_detail.templateType == 'Quiz (Randomised)') {
					if (await checkDataIsValidOrNot(drip_detail.quizRandCount)) {
						if (parseInt(drip_detail.quizRandCount) == NaN) {
							drip_detail.errorMsg.push('Random question number must be in numerical form.');
							drip_detail.isError = true;
						} else {
							drip_detail.quizRandCount = parseInt(drip_detail.quizRandCount);
						}
					} else {
						drip_detail.errorMsg.push('Random question number is required.');
						drip_detail.isError = true;
					}
				}

				// Check Caption
				if ((await checkDataIsValidOrNot(drip_detail.caption)) == false) {
					drip_detail.errorMsg.push('Caption is required.');
					drip_detail.isError = true;
				}

				drip_detail.loginRequired = drip_detail.loginRequired.toLowerCase();
				if (
					drip_detail.loginRequired == '' ||
					drip_detail.loginRequired == 'no' ||
					drip_detail.loginRequired == 'false' ||
					drip_detail.loginRequired == false
				) {
					drip_detail.loginRequired = false;
				} else {
					drip_detail.loginRequired = true;
				}

				//Code For Poll and Quiz

				if (
					drip_detail.templateType.toLowerCase() == 'poll' ||
					drip_detail.templateType.toLowerCase() == 'quiz' ||
					drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
					drip_detail.templateType.toLowerCase() == 'offline task' ||
					drip_detail.templateType.toLowerCase() == 'survey'
				) {
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;
					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							if (
								rows[j]['question no.'] ||
								rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] ||
								rows[j]['questions text']
							) {
								//Question Validation

								if (rows[j]['question no.'] == '') {
									drip_detail.errorMsg.push('Question No. is required.');
									drip_detail.isError = true;
								} else if (parseInt(rows[j]['question no.']) == NaN) {
									drip_detail.errorMsg.push('Question No. is invalid.');
									drip_detail.isError = true;
								}

								if (
									rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] == '' &&
									(drip_detail.templateType == 'Quiz' ||
										drip_detail.templateType == 'Quiz (Randomised)' ||
										drip_detail.templateType == 'Survey')
								) {
									drip_detail.errorMsg.push('Question Type is required.');
									drip_detail.isError = true;
								}

								if (rows[j]['questions text'] == '') {
									drip_detail.errorMsg.push('questions text is required.');
									drip_detail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											isTextResponse:
												drip_detail.isTextResponse != '' && drip_detail.isTextResponse != null
													? drip_detail.isTextResponse
													: false,
											isFileSubmission:
												drip_detail.isFileSubmission != '' && drip_detail.isFileSubmission != null
													? drip_detail.isFileSubmission
													: false,
											allowFileTypes: rows[j]['allow only specific file types (pdf/video/image)'],
										},
										Options: options,
									};

									drip_detail.Questions.push(payload);

									question_text = null;
									question_type = null;

									if (options.length < 2) {
										drip_detail.errorMsg.push('Please add mininmum 2 Options.');
										drip_detail.isError = true;
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];

									options = [];
								} else if (drip_detail.templateType == 'Offline Task') {
									drip_detail.isTextResponse = rows[j]['text response required(yes/no)']
										? rows[j]['text response required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isTextResponse == '' ||
										drip_detail.isTextResponse == 'no' ||
										drip_detail.isTextResponse == 'false' ||
										drip_detail.isTextResponse == false
									) {
										drip_detail.isTextResponse = false;
									} else {
										drip_detail.isTextResponse = true;
									}

									drip_detail.isFileSubmission = rows[j]['file submission required(yes/no)']
										? rows[j]['file submission required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isFileSubmission == '' ||
										drip_detail.isFileSubmission == 'no' ||
										drip_detail.isFileSubmission == 'false' ||
										drip_detail.isFileSubmission == false
									) {
										drip_detail.isFileSubmission = false;
									} else {
										drip_detail.isFileSubmission = true;
									}

									// Check File Upload Type for Offline task
									if (
										drip_detail.templateType == 'Offline Task' &&
										drip_detail.isFileSubmission &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let question_type = null;
									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: question_type,
											isTextResponse: drip_detail.isTextResponse,
											isFileSubmission: drip_detail.isFileSubmission,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: [],
									};

									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else if (
									drip_detail.templateType == 'Survey' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'mcq' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'rating scale'
								) {
									// Check File Upload Type for Survey
									if (
										drip_detail.templateType == 'Survey' &&
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload' &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: questionType,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: options,
									};
									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else {
									let questionType = '';

									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];
								}
							}

							if (
								drip_detail.templateType.toLowerCase() == 'poll' ||
								drip_detail.templateType.toLowerCase() == 'quiz' ||
								drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
								(drip_detail.templateType.toLowerCase() == 'survey' &&
									(question_type == 'MCQ' || question_type == 'Rating scale'))
							) {
								if (rows[j]['option no.'] || rows[j]['options text']) {
									//Option Validation

									let answer = false;

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										question_type == 'MCQ' &&
										rows[j]['answer key'] == ''
									) {
										drip_detail.errorMsg.push('Answer Key is required.');
										drip_detail.isError = true;
									}

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										rows[j]['answer key'] != '' &&
										question_type == 'MCQ'
									) {
										let key = rows[j]['answer key'].toLowerCase();
										if (key == 'no' || key == 'false' || key == false) {
											answer = false;
										}
										if (key == 'yes' || key == 'true' || key == true) {
											answer = true;
										}
									}

									if (rows[j]['option no.'] == '') {
										drip_detail.errorMsg.push('Option No. is required.');
										drip_detail.isError = true;
									} else if (parseInt(rows[j]['option no.']) == NaN) {
										drip_detail.errorMsg.push('Option No. is invalid.');
										drip_detail.isError = true;
									}

									if (rows[j]['options text'] == '') {
										drip_detail.errorMsg.push('Option Text is required.');
										drip_detail.isError = true;
									}

									let payload = {
										no: rows[j]['option no.'],
										text: rows[j]['options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
											},
											Options: options,
										};

										if (options.length < 2) {
											drip_detail.errorMsg.push('Please add mininmum 2 Options.');
											drip_detail.isError = true;
										}

										drip_detail.Questions.push(payload);

										const QuestionsArray = drip_detail.Questions;

										if (
											drip_detail.templateType == 'Quiz (Randomised)' &&
											parseInt(drip_detail.quizRandCount) > QuestionsArray.length
										) {
											drip_detail.errorMsg.push('Please add random question as per random number.');
											drip_detail.isError = true;
										}

										options = [];
										i = j;
										flag = false;
									}
								} else {
									drip_detail.errorMsg.push('Please provide options all details.');
									drip_detail.isError = true;
								}
							}
						}
					}
				}

				drip_detail.errorMsg = drip_detail.errorMsg.toString();
				drip_detail.Questions = JSON.stringify(drip_detail.Questions);
				dripList.push(drip_detail);
			}

			if (dripList && dripList.length > 0) {
				[err, uploadBulkDrip] = await to(UplodedDripAppEmail.bulkCreate(dripList));
				if (err) {
					console.log('----uploadBulkDrip----', err);
				}

				// return;
				[err, uplodedDripDetails] = await to(
					UplodedDripAppEmail.findAll({
						where: {
							RoleId: roleId,
							UserId: userId,
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							isCreated: false,
							isError: false,
						},
					})
				);

				let uploadDripIds = [];
				if (uplodedDripDetails && uplodedDripDetails.length > 0) {
					for (let dripDetail of uplodedDripDetails) {
						let drip_data_email = {
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							UserId: userId,
							drip_status: 'Draft',
							is_deleted: false,
							drip_description: dripDetail.description,
							drip_title: dripDetail.dripName,
							drip_type: 'DripApp with sharing on Email',
							// hyper_link : ''
							caption: dripDetail.caption,
							tempType: dripDetail.templateType,
							requiredLogging: dripDetail.loginRequired,
							pollResultType: dripDetail.pollResultType,
							showCorrectAns: dripDetail.showCorrectAns,
							quizResultType: dripDetail.quizResultType,
							brief: dripDetail.brief,
							quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
						};

						[err, _createPost] = await to(Post.create(drip_data_email));

						if (err) {
							console.log('-createPost--', err);
						}

						if (_createPost) {
							createdPostIds.push(_createPost.id);

							let email_non_native_drip_data = {
								email_body: dripDetail.bodycopy,
								email_subject_line: dripDetail.subjectline,
								contentType: 'Create New Drip',
								templateStatus: 'NA',
								PostId: _createPost.id,
								callToActionText: dripDetail.callToAction,
								caption: dripDetail.caption,
								templateType: dripDetail.templateType,
								pollResultType: dripDetail.pollResultType,
								showCorrectAns: dripDetail.showCorrectAns,
								quizResultType: dripDetail.quizResultType,
								brief: dripDetail.brief,
								quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
							};

							[err, _create_drip_native] = await to(Drip_email_non_native.create(email_non_native_drip_data));

							if (err) {
								console.log('-_create_drip_native--', err);
							}

							uploadDripIds.push(dripDetail.id);

							if (
								dripDetail.templateType == 'Poll' ||
								dripDetail.templateType == 'Quiz' ||
								dripDetail.templateType == 'Quiz (Randomised)' ||
								dripDetail.templateType == 'Offline Task' ||
								dripDetail.templateType == 'Survey'
							) {
								if (dripDetail.Questions) {
									let questions = JSON.parse(dripDetail.Questions);
									if (questions && questions.length > 0) {
										for (let que of questions) {
											if (que.Question.text) {
												let payload = {
													PostId: _createPost.id,
													question: que.Question.text,
													questionType: que.Question.type ? que.Question.type : null,
													ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
													AssetId: null,
													isTextResponse:
														que.Question.isTextResponse != '' && que.Question.isTextResponse != null
															? que.Question.isTextResponse
															: false,
													isFileSubmission:
														que.Question.isFileSubmission != '' && que.Question.isFileSubmission != null
															? que.Question.isFileSubmission
															: false,
													allowFileTypes: que.Question.allowFileTypes,
												};
												[err, create_question] = await to(DripQuestion.create(payload));
												// if (err) return ResponseError(res, err, 500, true);
												let count = 1;
												let optionData = [];
												for (let opt of que.Options) {
													let payload = {
														PostId: _createPost.id,
														ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
														DripQuestionId: create_question.id,
														isCorrectAnswer: opt.isCurrectAnswer,
														AssetId: null,
														text: opt.text,
														sr_no: count,
													};
													optionData.push(payload);

													count++;
												}
												if (optionData && optionData.length > 0) {
													[err, create_option] = await to(DripOption.bulkCreate(optionData));
													// if (err) return ResponseError(res, err, 500, true);
												}
											}
										}
									}
								}
							}
						}
					}

					if (uploadDripIds && uploadDripIds.length > 0) {
						[err, updateStatus] = await to(
							UplodedDripAppEmail.update(
								{
									isCreated: true,
								},
								{
									where: {
										id: uploadDripIds,
									},
								}
							)
						);

						if (err) {
							console.log('-updateStatus--', err);
						}
					}
				}

				let notifcationMessage = MESSAGE.drip_bulk_upload;
				notifcationMessage = notifcationMessage.replace('{{drip_type}}', 'On Drip App with sharing on Email');
				notifcationMessage = notifcationMessage.replace('{{count}}', uploadDripIds.length);
				notifcationMessage = notifcationMessage.replace('{{drip}}', uploadDripIds.length === 1 ? 'Drip' : 'Drips');
				await createNotification(notifcationMessage, ['Bell'], [userId]);
				if (createdPostIds && createdPostIds.length > 0) {
					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Upload Drip (On Drip App with sharing on Email)`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								PostId: createdPostIds,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
				if (err) {
					console.log('----ERROR----', err);
				}

				return {
					message: MESSAGE.CREATE_ALL_DRIP_EXCEL,
				};
			}
		} else {
			// return ResponseError(res, { message: MESSAGE.INVALID_DRIP_EXCEL_HEADER }, 500, true);
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const OnlyOnDripAppbulkUpload = async function (data, roleId, userId, clientId, req, res) {
	try {
		let dripList = [];
		let clientDetails;
		let createdPostIds = [];
		let _createPost;
		let excelHearders = [
			'sr. no.',
			'*account id',
			'*drip name',
			'drip description',
			'login required(yes/no)',
			'*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)',
			'caption',
			'select result layout for pwa(scale chart/pie chart/bar chart)',
			'show correct answers and scores on pwa(yes/no)',
			'timing to show(upon submission/after the deadline)',
			'number of random questions for each contact',
			'task brief',
			'question no.',
			'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)',
			'questions text',
			'option no.',
			'options text',
			'answer key',
			'text response required(yes/no)',
			'file submission required(yes/no)',
			'allow only specific file types (pdf/video/image)',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('header', header);
				validHeader = false;
			}
		}
		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let drip_detail = {
					srNo: rows[i]['sr. no.'],
					dripName: rows[i]['*drip name'],
					description: rows[i]['drip description'],
					loginRequired: rows[i]['login required(yes/no)'],
					errorMsg: [],
					isError: false,
					isCreated: false,
					RoleId: parseInt(roleId),
					UserId: parseInt(userId),
					ClientId: clientId,
					account_id: rows[i]['*account id'],
					templateType:
						rows[i]['*content template(single image/carousel/video/quiz/quiz (randomised)/poll/survey/offline task)'],
					caption: rows[i]['caption'],
					pollResultType: rows[i]['select result layout for pwa(scale chart/pie chart/bar chart)'],
					showCorrectAns: rows[i]['show correct answers and scores on pwa(yes/no)'],
					quizResultType: rows[i]['timing to show(upon submission/after the deadline)'],
					quizRandCount: rows[i]['number of random questions for each contact'],
					brief: rows[i]['task brief'],
					isTextResponse: rows[i]['text response required(yes/no)'],
					isFileSubmission: rows[i]['file submission required(yes/no)'],
					allowFileTypes: rows[i]['allow only specific file types (pdf/video/image)'],
					Questions: [],
				};

				//Check Client Details ==>> Valid Ciient Id, Client categery is Client Account or Branch Account
				if (await checkDataIsValidOrNot(drip_detail.account_id)) {
					if (parseInt(drip_detail.account_id) == NaN) {
						drip_detail.errorMsg.push('Account Id is must be in numerical form.');
						drip_detail.isError = true;
					} else {
						[err, clientDetails] = await to(
							Client.findOne({
								where: {
									client_id: drip_detail.account_id,
								},
							})
						);

						if (!clientDetails) {
							drip_detail.errorMsg.push('Account Id is invalid.');
							drip_detail.isError = true;
						} else if (clientDetails) {
							drip_detail.ClientId = clientDetails.id;
							if (clientDetails.category == 'Client Account' || clientDetails.category == 'Branch Account') {
								if (!clientDetails.DripAccess) {
									drip_detail.errorMsg.push("This Account don't have Drip Access.");
									drip_detail.isError = true;
								}
							} else {
								drip_detail.errorMsg.push('Account should be Client or Branch Account.');
								drip_detail.isError = true;
							}
						}
					}
				} else {
					drip_detail.errorMsg.push('Account Id is required.');
					drip_detail.isError = true;
				}

				// Check Drip Name
				if ((await checkDataIsValidOrNot(drip_detail.dripName)) == false) {
					drip_detail.errorMsg.push('Drip Name is required.');
					drip_detail.isError = true;
				} else {
					drip_detail.dripName = await capitalFirstLatter(drip_detail.dripName);
				}

				// Check Content Template
				if ((await checkDataIsValidOrNot(drip_detail.templateType)) == false) {
					drip_detail.errorMsg.push('Content Template is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Content Template Type
					let contentTypes = [
						'Single Image',
						'Carousel',
						'Video',
						'Poll',
						'Quiz',
						'Quiz (Randomised)',
						'Survey',
						'Offline Task',
					];
					let flag = false;
					for (let type of contentTypes) {
						if (type.toLowerCase() == drip_detail.templateType.toLowerCase()) {
							flag = true;
							drip_detail.templateType = type;
							break;
						}
					}

					if (!flag) {
						drip_detail.errorMsg.push('Content Template is invalid.');
						drip_detail.isError = true;
					}
				}

				// Check Poll  Result Layout
				if (drip_detail.templateType == 'Poll' && (await checkDataIsValidOrNot(drip_detail.pollResultType)) == false) {
					drip_detail.errorMsg.push('Poll Result Layout is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Reult Layout  Type
					let resultTypes = ['Scale Chart', 'Pie Chart', 'Bar Chart'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.pollResultType.toLowerCase()) {
							flag = true;
							drip_detail.pollResultType = type;
							break;
						}
					}
				}

				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					(await checkDataIsValidOrNot(
						rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
					)) == false
				) {
					drip_detail.errorMsg.push('Question Type is required.');
					drip_detail.isError = true;
				} else if (drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') {
					let quizType = ['MCQ', 'Drag and Drop'];
					let flag = false;
					for (let type of quizType) {
						if (
							type.toLowerCase() ==
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)']
						) {
							flag = true;
							rows[i]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] = type;
							break;
						}
					}
				}

				// Check Quiz Show Correct Incorrect On PWA

				drip_detail.showCorrectAns = drip_detail.showCorrectAns ? drip_detail.showCorrectAns.toLowerCase() : '';
				if (
					drip_detail.showCorrectAns == '' ||
					drip_detail.showCorrectAns == 'no' ||
					drip_detail.showCorrectAns == 'false' ||
					drip_detail.showCorrectAns == false
				) {
					drip_detail.showCorrectAns = false;
				} else {
					drip_detail.showCorrectAns = true;
				}

				// Check Quiz Show Timing On PWA
				if (
					(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
					drip_detail.showCorrectAns &&
					(await checkDataIsValidOrNot(drip_detail.quizResultType)) == false
				) {
					drip_detail.errorMsg.push('Timing To Show is required.');
					drip_detail.isError = true;
				} else {
					//Check Valid Show  Type
					let resultTypes = ['Upon Submission', 'After the Deadline'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == drip_detail.quizResultType.toLowerCase()) {
							flag = true;
							drip_detail.quizResultType = type;
							break;
						}
					}
				}

				if (drip_detail.templateType == 'Quiz (Randomised)') {
					if (await checkDataIsValidOrNot(drip_detail.quizRandCount)) {
						if (parseInt(drip_detail.quizRandCount) == NaN) {
							drip_detail.errorMsg.push('Random question number must be in numerical form.');
							drip_detail.isError = true;
						} else {
							drip_detail.quizRandCount = parseInt(drip_detail.quizRandCount);
						}
					} else {
						drip_detail.errorMsg.push('Random question number is required.');
						drip_detail.isError = true;
					}
				}

				// Check Caption
				if ((await checkDataIsValidOrNot(drip_detail.caption)) == false) {
					drip_detail.errorMsg.push('Caption is required.');
					drip_detail.isError = true;
				}

				drip_detail.loginRequired = drip_detail.loginRequired.toLowerCase();
				if (
					drip_detail.loginRequired == '' ||
					drip_detail.loginRequired == 'no' ||
					drip_detail.loginRequired == 'false' ||
					drip_detail.loginRequired == false
				) {
					drip_detail.loginRequired = false;
				} else {
					drip_detail.loginRequired = true;
				}

				//Code For Poll and Quiz
				if (
					drip_detail.templateType.toLowerCase() == 'poll' ||
					drip_detail.templateType.toLowerCase() == 'quiz' ||
					drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
					drip_detail.templateType.toLowerCase() == 'offline task' ||
					drip_detail.templateType.toLowerCase() == 'survey'
				) {
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;

					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							if (
								rows[j]['question no.'] ||
								rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] ||
								rows[j]['questions text']
							) {
								//Question Validation

								if (rows[j]['question no.'] == '') {
									drip_detail.errorMsg.push('Question No. is required.');
									drip_detail.isError = true;
								} else if (parseInt(rows[j]['question no.']) == NaN) {
									drip_detail.errorMsg.push('Question No. is invalid.');
									drip_detail.isError = true;
								}

								if (
									rows[j]['question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'] == '' &&
									(drip_detail.templateType == 'Quiz' ||
										drip_detail.templateType == 'Quiz (Randomised)' ||
										drip_detail.templateType == 'Survey')
								) {
									drip_detail.errorMsg.push('Question Type is required.');
									drip_detail.isError = true;
								}

								if (rows[j]['questions text'] == '') {
									drip_detail.errorMsg.push('questions text is required.');
									drip_detail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											isTextResponse:
												drip_detail.isTextResponse != '' && drip_detail.isTextResponse != null
													? drip_detail.isTextResponse
													: false,
											isFileSubmission:
												drip_detail.isFileSubmission != '' && drip_detail.isFileSubmission != null
													? drip_detail.isFileSubmission
													: false,
											allowFileTypes: rows[j]['allow only specific file types (pdf/video/image)'],
										},
										Options: options,
									};

									drip_detail.Questions.push(payload);

									question_text = null;
									question_type = null;

									if (options.length < 2) {
										drip_detail.errorMsg.push('Please add mininmum 2 Options.');
										drip_detail.isError = true;
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];
									options = [];
								} else if (drip_detail.templateType == 'Offline Task') {
									drip_detail.isTextResponse = rows[j]['text response required(yes/no)']
										? rows[j]['text response required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isTextResponse == '' ||
										drip_detail.isTextResponse == 'no' ||
										drip_detail.isTextResponse == 'false' ||
										drip_detail.isTextResponse == false
									) {
										drip_detail.isTextResponse = false;
									} else {
										drip_detail.isTextResponse = true;
									}

									drip_detail.isFileSubmission = rows[j]['file submission required(yes/no)']
										? rows[j]['file submission required(yes/no)'].toLowerCase()
										: '';
									if (
										drip_detail.isFileSubmission == '' ||
										drip_detail.isFileSubmission == 'no' ||
										drip_detail.isFileSubmission == 'false' ||
										drip_detail.isFileSubmission == false
									) {
										drip_detail.isFileSubmission = false;
									} else {
										drip_detail.isFileSubmission = true;
									}

									// Check File Upload Type for Offline task
									if (
										drip_detail.templateType == 'Offline Task' &&
										drip_detail.isFileSubmission &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let question_type = null;
									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: question_type,
											isTextResponse: drip_detail.isTextResponse,
											isFileSubmission: drip_detail.isFileSubmission,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: [],
									};

									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else if (
									drip_detail.templateType == 'Survey' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'mcq' &&
									rows[j][
										'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
									].toLowerCase() != 'rating scale'
								) {
									// Check File Upload Type for Survey
									if (
										drip_detail.templateType == 'Survey' &&
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload' &&
										rows[j]['allow only specific file types (pdf/video/image)'] == ''
									) {
										drip_detail.errorMsg.push('Allow File Type is required.');
										drip_detail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() == rows[j]['allow only specific file types (pdf/video/image)'].toLowerCase()
											) {
												flag = true;
												drip_detail.allowFileTypes = type;
												break;
											}
										}
									}

									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									let payload = {
										Question: {
											text: rows[j]['questions text'],
											type: questionType,
											allowFileTypes: drip_detail.allowFileTypes,
										},
										Options: options,
									};
									i = j;
									drip_detail.Questions.push(payload);
									options = [];
								} else {
									let questionType = '';
									if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'mcq'
									) {
										questionType = 'MCQ';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'drag and drop'
									) {
										questionType = 'Drag and Drop';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'rating scale'
									) {
										questionType = 'Rating scale';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'short answer'
									) {
										questionType = 'Short answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'long answer'
									) {
										questionType = 'Long answer';
									} else if (
										rows[j][
											'question type(mcq/drag &drop/rating scale/short answer/long answer/file upload)'
										].toLowerCase() == 'file upload'
									) {
										questionType = 'File upload';
									}

									question_type = questionType;
									question_text = rows[j]['questions text'];
								}
							}

							if (
								drip_detail.templateType.toLowerCase() == 'poll' ||
								drip_detail.templateType.toLowerCase() == 'quiz' ||
								drip_detail.templateType.toLowerCase() == 'quiz (randomised)' ||
								(drip_detail.templateType.toLowerCase() == 'survey' &&
									(question_type == 'MCQ' || question_type == 'Rating scale'))
							) {
								if (rows[j]['option no.'] || rows[j]['options text']) {
									//Option Validation

									let answer = false;

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										question_type == 'MCQ' &&
										rows[j]['answer key'] == ''
									) {
										drip_detail.errorMsg.push('Answer Key is required.');
										drip_detail.isError = true;
									}

									if (
										(drip_detail.templateType == 'Quiz' || drip_detail.templateType == 'Quiz (Randomised)') &&
										rows[j]['answer key'] != '' &&
										question_type == 'MCQ'
									) {
										let key = rows[j]['answer key'].toLowerCase();
										if (key == 'no' || key == 'false' || key == false) {
											answer = false;
										}
										if (key == 'yes' || key == 'true' || key == true) {
											answer = true;
										}
									}

									if (rows[j]['option no.'] == '') {
										drip_detail.errorMsg.push('Option No. is required.');
										drip_detail.isError = true;
									} else if (parseInt(rows[j]['option no.']) == NaN) {
										drip_detail.errorMsg.push('Option No. is invalid.');
										drip_detail.isError = true;
									}

									if (rows[j]['options text'] == '') {
										drip_detail.errorMsg.push('Option Text is required.');
										drip_detail.isError = true;
									}

									let payload = {
										no: rows[j]['option no.'],
										text: rows[j]['options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
											},
											Options: options,
										};

										if (options.length < 2) {
											drip_detail.errorMsg.push('Please add mininmum 2 Options.');
											drip_detail.isError = true;
										}

										drip_detail.Questions.push(payload);

										let QuestionsArray = drip_detail.Questions;

										if (
											drip_detail.templateType == 'Quiz (Randomised)' &&
											parseInt(drip_detail.quizRandCount) > QuestionsArray.length
										) {
											drip_detail.errorMsg.push('Please add random question as per random number.');
											drip_detail.isError = true;
										}

										options = [];
										i = j;
										flag = false;
									}
								} else {
									drip_detail.errorMsg.push('Please provide options all details.');
									drip_detail.isError = true;
								}
							}
						}
					}
				}

				drip_detail.errorMsg = drip_detail.errorMsg.toString();
				drip_detail.Questions = JSON.stringify(drip_detail.Questions);
				dripList.push(drip_detail);
			}

			if (dripList && dripList.length > 0) {
				[err, uploadBulkDrip] = await to(UplodedOnlyOnDripApp.bulkCreate(dripList));
				if (err) {
					console.log('----uploadBulkDrip----', err);
				}

				// return;
				[err, uplodedDripDetails] = await to(
					UplodedOnlyOnDripApp.findAll({
						where: {
							RoleId: roleId,
							UserId: userId,
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							isCreated: false,
							isError: false,
						},
					})
				);

				let uploadDripIds = [];
				if (uplodedDripDetails && uplodedDripDetails.length > 0) {
					for (let dripDetail of uplodedDripDetails) {
						let drip_data_on_dripApp = {
							ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
							UserId: userId,
							drip_status: 'Draft',
							is_deleted: false,
							drip_description: dripDetail.description,
							drip_title: dripDetail.dripName,
							drip_type: 'Only DripApp',
							caption: dripDetail.caption,
							tempType: dripDetail.templateType,
							requiredLogging: dripDetail.loginRequired,
							pollResultType: dripDetail.pollResultType,
							showCorrectAns: dripDetail.showCorrectAns,
							quizResultType: dripDetail.quizResultType,
							brief: dripDetail.brief,
							quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
						};

						[err, _createPost] = await to(Post.create(drip_data_on_dripApp));

						if (err) {
							console.log('-createPost--', err);
						}

						if (_createPost) {
							createdPostIds.push(_createPost.id);

							let native_drip_data = {
								contentType: 'Create New Drip',
								templateStatus: 'NA',
								PostId: _createPost.id,
								caption: dripDetail.caption,
								templateType: dripDetail.templateType,
								pollResultType: dripDetail.pollResultType,
								showCorrectAns: dripDetail.showCorrectAns,
								quizResultType: dripDetail.quizResultType,
								brief: dripDetail.brief,
								quizRandCount: dripDetail.quizRandCount ? parseInt(dripDetail.quizRandCount) : null,
							};

							[err, _create_drip_native] = await to(Drip_native.create(native_drip_data));

							if (err) {
								console.log('-_create_drip_native--', err);
							}

							uploadDripIds.push(dripDetail.id);

							if (
								dripDetail.templateType == 'Poll' ||
								dripDetail.templateType == 'Quiz' ||
								dripDetail.templateType == 'Quiz (Randomised)' ||
								dripDetail.templateType == 'Offline Task' ||
								dripDetail.templateType == 'Survey'
							) {
								if (dripDetail.Questions) {
									let questions = JSON.parse(dripDetail.Questions);
									if (questions && questions.length > 0) {
										for (let que of questions) {
											if (que.Question.text) {
												let payload = {
													PostId: _createPost.id,
													question: que.Question.text,
													questionType: que.Question.type ? que.Question.type : null,
													ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
													AssetId: null,
													isTextResponse:
														que.Question.isTextResponse != '' && que.Question.isTextResponse != null
															? que.Question.isTextResponse
															: false,
													isFileSubmission:
														que.Question.isFileSubmission != '' && que.Question.isFileSubmission != null
															? que.Question.isFileSubmission
															: false,
													allowFileTypes: que.Question.allowFileTypes,
												};
												[err, create_question] = await to(DripQuestion.create(payload));

												// if (err) return ResponseError(res, err, 500, true);
												let count = 1;
												let optionData = [];
												for (let opt of que.Options) {
													let payload = {
														PostId: _createPost.id,
														ClientId: clientDetails && clientDetails.id ? clientDetails.id : null,
														DripQuestionId: create_question.id,
														isCorrectAnswer: opt.isCurrectAnswer,
														AssetId: null,
														text: opt.text,
														sr_no: count,
													};
													optionData.push(payload);

													count++;
												}
												if (optionData && optionData.length > 0) {
													[err, create_option] = await to(DripOption.bulkCreate(optionData));
													// if (err) return ResponseError(res, err, 500, true);
												}
											}
										}
									}
								}
							}
						}
					}

					if (uploadDripIds && uploadDripIds.length > 0) {
						[err, updateStatus] = await to(
							UplodedOnlyOnDripApp.update(
								{
									isCreated: true,
								},
								{
									where: {
										id: uploadDripIds,
									},
								}
							)
						);

						if (err) {
							console.log('-updateStatus--', err);
						}
					}
				}

				let notifcationMessage = MESSAGE.drip_bulk_upload;
				notifcationMessage = notifcationMessage.replace('{{drip_type}}', 'Only On Drip App');
				notifcationMessage = notifcationMessage.replace('{{count}}', uploadDripIds.length);
				notifcationMessage = notifcationMessage.replace('{{drip}}', uploadDripIds.length === 1 ? 'Drip' : 'Drips');
				await createNotification(notifcationMessage, ['Bell'], [userId]);
				if (createdPostIds && createdPostIds.length > 0) {
					[err, newLog] = await to(
						createlog(
							req.user.id,
							req.user.ClientId,
							req.user.RoleId,
							`Upload Drip (Only On Drip App)`,
							req.ip,
							req.useragent,
							req.user.type,
							{
								PostId: createdPostIds,
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
				if (err) {
					console.log('----ERROR----', err);
				}

				return {
					message: MESSAGE.CREATE_ALL_DRIP_EXCEL,
				};
			}
		} else {
			// return ResponseError(res, { message: MESSAGE.INVALID_DRIP_EXCEL_HEADER }, 500, true);
		}

		// console.log("uplodedDripDetails", uplodedDripDetails);
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const checkDataIsValidOrNot = async function (data) {
	try {
		if (data == 'null' || data == '' || data == undefined || data == null) {
			return false;
		} else {
			return true;
		}
	} catch (error) {}
};

const checkDatailsPresentOrNot = async function (data) {
	try {
		let flag = false;
		for (let key in data) {
			if (data[key] != '') {
				flag = true;
			}
		}
		return flag;
	} catch (error) {}
};

const downloadUploadedOnlyOnWhatAppData = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.params.roleId),
			userId: parseInt(req.params.userId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, userId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let roleId = req.params.roleId;
		// let userId = req.params.userId;
		// let clientId = req.params.clientId;
		let type = req.params.type;
		let whereCondition = {
			RoleId: roleId,
			UserId: userId,
		};
		let data = [];
		let drip_Data;

		if (type == 'Only-On-WhatsApp') {
			[err, downloadedOnlyOnWhatsAppDetail] = await to(
				UplodedOnlyOnWhatsapp.findAll({
					where: whereCondition,
					attributes: [
						'srNo',
						'account_id',
						'dripName',
						'description',
						'language',
						'whatsappTemplateCategory',
						'headerType',
						'headerText',
						'body',
						'footer',
						'interaction',
						'quickReply1',
						'quickReply2',
						'quickReply3',
						'callToAction',
						'isCreated',
						'errorMsg',
						'isError',
						'createdAt',
					],
					order: [['id', 'DESC']],
				})
			);

			if (downloadedOnlyOnWhatsAppDetail && downloadedOnlyOnWhatsAppDetail.length > 0) {
				for (let item of downloadedOnlyOnWhatsAppDetail) {
					drip_Data = item.convertToJSON();
					data.push(drip_Data);
				}
			}
		} else if (type == 'On-Drip-App-with-sharing-on-WhatsApp') {
			[err, downloadedDripAppWithWhatsAppDetail] = await to(
				UplodedDripAppWhatsapp.findAll({
					where: whereCondition,
					attributes: [
						'srNo',
						'account_id',
						'dripName',
						'description',
						'language',
						'loginRequired',
						'whatsappTemplateCategory',
						'headerType',
						'headerText',
						'body',
						'footer',
						'callToAction',
						'templateType',
						'caption',
						'Questions',
						'pollResultType',
						'showCorrectAns',
						'quizResultType',
						'brief',
						'quizRandCount',
						'isCreated',
						'errorMsg',
						'isError',
						'createdAt',
					],
					order: [['id', 'DESC']],
				})
			);

			if (downloadedDripAppWithWhatsAppDetail && downloadedDripAppWithWhatsAppDetail.length > 0) {
				for (let item of downloadedDripAppWithWhatsAppDetail) {
					drip_Data = item.convertToJSON();
					data.push(drip_Data);
				}
			}
		} else if (type == 'On-Drip-App-with-sharing-on-Email') {
			[err, downloadedDripAppWithEmailDetail] = await to(
				UplodedDripAppEmail.findAll({
					where: whereCondition,
					attributes: [
						'srNo',
						'account_id',
						'dripName',
						'description',
						'loginRequired',
						'subjectline',
						'bodycopy',
						'callToAction',
						'templateType',
						'caption',
						'Questions',
						'pollResultType',
						'showCorrectAns',
						'quizResultType',
						'brief',
						'quizRandCount',
						'isCreated',
						'errorMsg',
						'isError',
						'createdAt',
					],
					order: [['id', 'DESC']],
				})
			);

			if (downloadedDripAppWithEmailDetail && downloadedDripAppWithEmailDetail.length > 0) {
				for (let item of downloadedDripAppWithEmailDetail) {
					drip_Data = item.convertToJSON();
					data.push(drip_Data);
				}
			}
		} else if (type == 'Only-On-Drip-App') {
			[err, downloadedOnlyOnDripAppDetail] = await to(
				UplodedOnlyOnDripApp.findAll({
					where: whereCondition,
					attributes: [
						'srNo',
						'account_id',
						'dripName',
						'description',
						'loginRequired',
						'templateType',
						'caption',
						'Questions',
						'pollResultType',
						'showCorrectAns',
						'quizResultType',
						'brief',
						'quizRandCount',
						'isCreated',
						'errorMsg',
						'isError',
						'createdAt',
					],
					order: [['id', 'DESC']],
				})
			);

			if (downloadedOnlyOnDripAppDetail && downloadedOnlyOnDripAppDetail.length > 0) {
				for (let item of downloadedOnlyOnDripAppDetail) {
					drip_Data = item.convertToJSON();
					data.push(drip_Data);
				}
			}
		}

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadUploadedOnlyOnWhatAppData = downloadUploadedOnlyOnWhatAppData;

let upload_drip_schedulor = schedule.scheduleJob('30 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>> Destroy Bulk Uploaded Status', fireDate);

	checkUploadDripDataStatus();
});
module.exports.upload_drip_schedulor = upload_drip_schedulor;

const checkUploadDripDataStatus = async function () {
	let sevenDaysBefore = moment().subtract(7, 'days');
	[err, upload_details] = await to(
		UplodedOnlyOnDripApp.destroy({
			where: {
				createdAt: {
					[Op.lte]: sevenDaysBefore,
				},
			},
		})
	);

	[err, upload_details] = await to(
		UplodedDripAppEmail.destroy({
			where: {
				createdAt: {
					[Op.lte]: sevenDaysBefore,
				},
			},
		})
	);

	[err, upload_details] = await to(
		UplodedDripAppWhatsapp.destroy({
			where: {
				createdAt: {
					[Op.lte]: sevenDaysBefore,
				},
			},
		})
	);

	[err, upload_details] = await to(
		UplodedOnlyOnWhatsapp.destroy({
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

const assignSystemBradingToDrip = async function (req, res) {
	try {
		let postDetails, err;
		[err, postDetails] = await to(
			Post.findAll({
				where: {
					SystemBrandingId: {
						[Op.eq]: null,
					},
				},
				attributes: ['ClientId', 'id'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (postDetails && postDetails.length > 0) {
			for (let post of postDetails) {
				let appBranding = await getClientAppBrandingByClientId(post.ClientId);

				if (appBranding) {
					[err, updateDetails] = await to(
						Post.update(
							{
								SystemBrandingId: appBranding.id,
							},
							{
								where: {
									id: post.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		return ResponseSuccess(res, { message: 'sucess' });
	} catch (error) {
		console.log('assignSystemBradingToDrip error.....', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.assignSystemBradingToDrip = assignSystemBradingToDrip;

const getAllWhatAppPostByClientForOptIn = async function (req, res) {
	try {
		let postDetails, err;

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

		// let clientId = req.params.clientId;

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDrip(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		[err, postDetails] = await to(
			Post.findAll({
				where: {
					ClientId: allSubClientIds,
					drip_type: 'Only WhatsApp',
				},
				include: [
					{
						model: Drip_whatsapp_native,
						where: {
							trackableLink: false,
							trackableLink2: false,
							zoomTrackable: false,
							zoomTrackable2: false,
							templateStatus: 'Enabled',
						},
					},
				],
				attributes: ['id', 'drip_title'],
				order: [['id', 'DESC']],
			})
		);

		let data = [];
		for (let item of postDetails) {
			let payload = item.convertToJSON();
			payload.dripIdTitle = payload.id + ' - ' + payload.drip_title;
			data.push(payload);
		}

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllWhatAppPostByClientForOptIn = getAllWhatAppPostByClientForOptIn;

//Upload Image Documents on broadside server
const createEmailAssetOnBroadSide = async function (req, res) {
	try {
		let asset = req.body;
		let loginResponse_;
		try {
			const url_ = `http://52.66.123.174:8081/login`;
			//Send BroadSide Email
			const form = new FormData();
			form.append('username', 'bablrin_api');
			form.append('password', 'DHgTSG39');
			loginResponse_ = await axios.post(url_, form);
		} catch (error) {
			console.error(`----Error fetching broadside email token-----------`, error);
			return ResponseError(res, error, 500, true);
		}

		const url = `http://52.66.123.174:8082/api/doc/upload`;
		let payload = {
			refId: asset.refId,
			fileName: asset.fileName,
			content: asset.content,
			purpose: asset.purpose,
			description: asset.description,
		};
		const config = {
			headers: {
				Authorization: `Bearer ${loginResponse_.data.token}`,
				'Content-Type': 'application/json',
			},
		};
		console.log('-----BroadSide Asset url----', url);
		//console.log('-----BroadSide Asset Payload----', payload);
		// console.log('--config-', config);
		let response = await axios.post(url, payload, config);
		console.log('----Broadside asset response data----', response.data);
		if (response && response.data && response.data.status == 'error') {
			return ResponseError(res, error, 500, true);
		} else {
			return ResponseSuccess(res, { data: response.data });
		}
	} catch (error) {
		console.log('-----Error When Create Asset on BroadSide------', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createEmailAssetOnBroadSide = createEmailAssetOnBroadSide;

//Upload BroadSide Email Body Template
const uploadBroadSideEmailTemplateFileOnServer = async function (_create_email_drip_id, email_drip_data, type) {
	try {
		let fileName = `broadside_template_${shortid.generate()}.html`;

		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let randomRefId = '';
		const charactersLength = characters.length;
		for (let i = 0; i < 5; i++) {
			randomRefId += characters.charAt(Math.floor(Math.random() * charactersLength));
		}

		if (email_drip_data.brodEmailAssetPath && email_drip_data.brodEmailAssetPath.length > 0) {
			for (let i = 0; i < email_drip_data.brodEmailAssetPath.length; i++) {
				email_drip_data.email_body = email_drip_data.email_body.replace(
					email_drip_data.brodEmailAssetPath[i].filePath,
					`cid:cid-${i}`
				);
			}
		}

		const convertedEmailTemplateToBase64 = Buffer.from(email_drip_data.email_body).toString('base64');

		const url_ = `http://52.66.123.174:8081/login`;

		const form = new FormData();
		form.append('username', 'bablrin_api');
		form.append('password', 'DHgTSG39');
		const loginResponse_ = await axios.post(url_, form);

		const url = `http://52.66.123.174:8082/api/doc/upload`;

		let payload = {
			refId: 'ABC' + '-' + randomRefId,
			fileName: fileName,
			content: convertedEmailTemplateToBase64,
			purpose: {
				type: 'attachment',
			},
			description: null,
		};

		const config = {
			headers: {
				Authorization: `Bearer ${loginResponse_.data.token}`,
				'Content-Type': 'application/json',
			},
		};
		// console.log('-----BroadSide Asset url----', url);
		// console.log('-----Email Template Send payload----', payload);
		// console.log('--config-', config);
		let uploadEmailTemplateOnServerResponse = await axios.post(url, payload, config);

		// console.log('---Upload Email Template File Response----', uploadEmailTemplateOnServerResponse.data);
		if (uploadEmailTemplateOnServerResponse && uploadEmailTemplateOnServerResponse.data.status == 'error') {
			// console.log('---Upload Email Template File Response status----', uploadEmailTemplateOnServerResponse.data.status);
			return false;
		} else {
			let paload = {
				brodEmailTemplatePath: `/var/warehouse/data/${fileName}`,
			};

			if (type == 'Only Email') {
				[err, _update_only_email_drip] = await to(
					Drip_only_email.update(paload, {
						where: {
							id: _create_email_drip_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'DripApp with sharing on Email') {
				[err, _update_native_email_drip] = await to(
					Drip_email_non_native.update(paload, {
						where: {
							id: _create_email_drip_id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			return uploadEmailTemplateOnServerResponse.data;
		}
	} catch (error) {
		console.log('--Error When Uploading Email Template .html File on Server--', error);
		return false;
	}
};
module.exports.uploadBroadSideEmailTemplateFileOnServer = uploadBroadSideEmailTemplateFileOnServer;
