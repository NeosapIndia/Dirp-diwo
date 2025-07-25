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
	Campaign_drip_camp_mapping,
	Drip_camp,
	Campaign_user_group_mapping,
	Post,
	Drip_native,
	Drip_whatsapp_native,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Asset,
	Asset_detail,
	Assigned_post_to_user,
	CampUserGroupStartRule,
	CampaignTagMapping,
	DripCampUserGroupAction,
	DripUserQuestion,
	DripUserOption,
	CampWhatsAppEmailDrip,
	CampTakeAction,
	Cookie,
	License,
	UserBriefFile,
	DripQuestion,
	DripOption,
	CampChannelMapping,
	TeamChannel,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
var Excel = require('excel4node');
const moment = require('moment');
const fs = require('fs');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { createNotification, getAllUserIdsForNotification } = require('../services/notification.service');
const { createlog } = require('../services/log.service');
const {
	assignDripToLearnerByUsingCampaign,
	editAssignDripToLearnerByUsingCampaign,
	checkCampaignStatus,
	checkReserveFlowTags,
	getNextFiftineMinSlot,
	flowScheduler,
} = require('../services/campaign.service');
const Sequelize = require('sequelize');
const { getAllSubClientAndBranchAccountLists } = require('../services/client.service');

const { getLearnerValidaionByClientId } = require('../services/license.service');
const { capitalFirstLatter } = require('../services/auth.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

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
					include: [
						{
							model: Client_job_role,
						},
					],
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

//create campaign
const createCampaign = async function (req, res) {
	try {
		//Client Id, UseriD and Role Id
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
			userId: Joi.number().integer().positive().required(), // Must be a positive integer
			roleId: Joi.number()
				.integer()
				.min(validationConstant.role.min)
				.max(validationConstant.role.max)
				.positive()
				.required(), // Must be a positive integer
		});

		// Convert params to numbers
		let dataToValidate = {
			clientId: parseInt(req.params.clientId), // Using Number() to ensure a proper conversion
			userId: parseInt(req.query.userId),
			roleId: parseInt(req.query.roleId),
		};

		// Validate the data
		const { error, value } = schema.validate(dataToValidate);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		// Assign validated values
		let { clientId, userId, roleId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		//Validation for campaign details

		const campaignDetailSchema = Joi.object({
			id: Joi.number().integer().allow(null),
			title: Joi.string().trim().max(validationConstant.title.max).required(),
			description: Joi.string().trim().max(1000).allow(null, ''),
			startDate: Joi.alternatives().try(Joi.date().iso(), Joi.number().integer().positive()).allow(null).required(),
			startTimeId: Joi.number().integer().allow(null, ''),
			endDate: Joi.alternatives().try(Joi.date().iso(), Joi.number().integer().positive()).allow(null),
			endTimeId: Joi.number().integer().allow(null, ''),
			learnerGroup: Joi.array().items(Joi.number().integer()).required(),
			startRule: Joi.string().allow(null, '').required(),
			startAfter: Joi.number().integer().allow(null),
			learnerGroupForRule: Joi.array().items(Joi.number().integer()).allow(null),
			tags: Joi.string().trim().allow(null, ''),
			operator: Joi.string().trim().allow(null, ''),
			successMetrics: Joi.boolean().required(),
			successMetricsList: Joi.array()
				.items(
					Joi.object({
						id: Joi.number().integer().allow(null),
						label: Joi.string().trim().max(validationConstant.title.max).required(),
						DripCampIndex: Joi.array().items(Joi.number().integer()).required(),
						PostId: Joi.number().integer().required(),
						metrics: Joi.string().allow(null, 'null', '').required(),
						tempType: Joi.string()
							.valid(
								'Survey',
								'Offline Task',
								'Spin The Wheel',
								'Quiz',
								'Poll',
								'Video',
								'Single Image',
								'Carousel',
								null
							)
							.required(),
						dripType: Joi.string()
							.valid(
								'Only WhatsApp',
								'DripApp with sharing on WhatsApp',
								'Only Email',
								'DripApp with sharing on Email',
								'Only DripApp',
								'Only Teams',
								'DripApp with sharing on Teams',
								'null',
								null
							)
							.required(),
						activityScoreType: Joi.string().allow(null, ''),
						score: Joi.number().integer().allow(null),
						DripOptionId: Joi.number().integer().allow(null),
						option: Joi.string().trim().allow(null, ''),
						DripQuestionId: Joi.number().integer().allow(null),
						question: Joi.string().trim().allow(null, ''),
						quickReply: Joi.string().trim().allow(null, ''),
						offlineTaskText: Joi.string().trim().allow(null, ''),
						status: Joi.string().valid('Scheduled', 'Draft', 'Completed').required(),
					})
				)
				.when('successMetrics', {
					is: true,
					then: Joi.array().min(1).required(),
					otherwise: Joi.array().allow(null).default([]),
				}),
			flowType: Joi.string().valid('Campaign', 'Conversational').required(),
			status: Joi.string().valid('Draft', 'Scheduled', 'Completed').required(),
		});

		const { error: campaignError, value: campaignValue } = campaignDetailSchema.validate(req.body.campaignDetails);
		if (campaignError) {
			return res.status(400).json({ error: campaignError.details[0].message });
		}

		//Drip and Action Validation
		const dripAndActionSchema = Joi.array().items(
			Joi.object({
				id: Joi.number().integer().allow(null),
				dripName: Joi.string().trim().max(validationConstant.title.max).required(),
				dripType: Joi.string()
					.valid(
						'Only WhatsApp',
						'DripApp with sharing on WhatsApp',
						'Only Email',
						'DripApp with sharing on Email',
						'Only DripApp',
						'Only Teams',
						'DripApp with sharing on Teams',
						'null',
						null
					)
					.allow(null),
				dripId: Joi.number().integer().allow(null),
				PostId: Joi.number().integer().allow(null),
				dripTriggerRule: Joi.string().allow(null),
				dripTriggerDate: Joi.number().integer().allow(null),
				dripTriggerTimeId: Joi.number().integer().allow(null),
				tempType: Joi.string()
					.valid('Survey', 'Offline Task', 'Spin The Wheel', 'Quiz', 'Poll', 'Video', 'Single Image', 'Carousel', null)
					.allow(null),
				actionType: Joi.string().allow(null),
				actionTriggerRule: Joi.string().allow(null),
				dependencyDripIndex: Joi.number().integer().allow(null),
				sendAfter: Joi.number().integer().allow(null),
				userAction: Joi.string().allow(null, ''),
				activityScoreType: Joi.string().allow(null, ''),
				score: Joi.number().integer().allow(null),
				dripFlowType: Joi.string().valid('Send a Drip', 'Take Action').required(),
				dripTriggerActualTime: Joi.string().trim().allow(null, ''),
				dripTitleName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				dripPublished: Joi.boolean(),
				status: Joi.string().valid('Scheduled', 'Draft', 'Completed').required(),
				templateStatus: Joi.string().allow(null, ''),
				whatsAppTemplateFlag: Joi.boolean().required(),
				assetVideoTranscoding: Joi.boolean(),
				dependencyIndex: Joi.number().integer().allow(null),
				showDependancyDD: Joi.boolean(),
				index: Joi.number().integer().required(),
				systemActionType: Joi.string().allow(null, ''),
				tagsForSystemAction: Joi.string().allow(null, ''),
				groupForAction: Joi.array().items(Joi.number().integer()).allow(null),
				tagsForAction: Joi.string().allow(null, ''),
				selected_send_drip_and_take_action_list: Joi.string().allow(null, ''),
				selected_send_a_drip_list: Joi.string().allow(null, ''),
				selected_activity_send_a_drip_list: Joi.string().allow(null, ''),
				unAssignDayCount: Joi.number().integer().allow(null),
				dripActionEndDate: Joi.any().allow(null),
				dripActionEndTimeId: Joi.number().integer().allow(null),
				poolOptionType: Joi.string().allow(null, ''),
				within: Joi.number().integer().allow(null),
				quickReplyList: Joi.any().allow(null, ''),
				quickReply: Joi.string().allow(null, ''),
				DripQuestionId: Joi.number().integer().allow(null),
				showTrackableLink: Joi.boolean(),
				milestoneField: Joi.string().allow(null, ''),
				recurAnnually: Joi.boolean(),
				dripDropDownTitle: Joi.string().trim().max(validationConstant.title.max),
				published: Joi.boolean().allow(null),
				pollOption: Joi.string().allow(null, ''),
			})
		);
		const { error: dripAndActionError, value: dripAndActionValue } = dripAndActionSchema.validate(req.body.dripDetails);

		if (dripAndActionError) {
			return res.status(400).json({ error: dripAndActionError.details[0].message });
		}

		let campaignDetails = req.body.campaignDetails;
		let dripDetails = req.body.dripDetails;
		let learnerGroupDetails = req.body.campaignDetails.learnerGroup;
		let learnerGroupDetailsForStartRule = req.body.campaignDetails.learnerGroupForRule;
		const isChannelFlow = req.body.isChannelFlow;
		let channelDetails = req.body.channelDetails;
		// const clientId = parseInt(req.params.clientId);
		const notTackAction = [
			'Not read on channel',
			'Not read on drip app',
			'Drip Action not taken',
			'Drip submit Action not taken',
		];

		if (
			campaignDetails.startRule === 'Start on date' &&
			campaignDetails.startDate &&
			moment().isSameOrAfter(campaignDetails.startDate)
		) {
			return ResponseError(
				res,
				{
					message: MESSAGE.INVALID_DRIP_FLOW_START_DATE,
				},
				500
			);
		}

		if (!campaignDetails.startDate && campaignDetails.status !== 'Draft') campaignDetails.status = 'Running';

		campaignDetails.startDate = campaignDetails.startDate
			? moment(new Date(campaignDetails.startDate)).format()
			: moment().format();

		campaignDetails.endDate = moment(new Date(campaignDetails.endDate)).format();
		campaignDetails.ClientId = clientId;
		campaignDetails.UserId = parseInt(req.query.userId);
		campaignDetails.RoleId = parseInt(req.query.roleId);
		campaignDetails.title = await capitalFirstLatter(campaignDetails.title);

		//Add default value for channel flow
		if (isChannelFlow) {
			campaignDetails.startRule = 'Start on date';
			campaignDetails.flowType = 'Campaign';
		}

		// Create New Campaign
		[err, create_campaign] = await to(Campaign.create(campaignDetails));
		if (err) return ResponseError(res, err, 500, true);

		// Create Campaign and Post Mapping

		for (let drip of dripDetails) {
			// console.log('--------Drip and Action Details-----', drip);
			let dripActionEndDate = null;
			let dripTriggerDate = drip.dripTriggerDate ? moment(new Date(drip.dripTriggerDate)).format() : null;
			if (drip.userAction && notTackAction.includes(drip.userAction)) {
				for (let previousDrip of dripDetails) {
					if (drip.dependencyDripIndex === previousDrip.index) {
						if (previousDrip.dripTriggerDate && drip.within)
							dripActionEndDate = moment(previousDrip.dripTriggerDate).add(drip.within, 'hours').format();
					}
				}
			}
			if (dripTriggerDate === 'Invalid date') {
				dripTriggerDate = null;
			}

			let payload = {
				PostId: drip.dripId,
				dripTriggerDate: dripTriggerDate,
				dripTriggerRule: drip.dripTriggerRule,
				dripType: drip.dripType,
				dripName: drip.dripName,
				status: drip.status,
				published: drip && drip.published ? drip.published : null,
				index: drip.index,
				dripFlowType: drip.dripFlowType,
				userAction: drip.userAction,
				sendAfter: drip.sendAfter,
				dependencyDripIndex: drip.dependencyDripIndex,
				actionTriggerRule: drip.actionTriggerRule,
				actionType: drip.actionType,
				activityScoreType: drip.activityScoreType,
				score: drip.score,
				tagsForAction: drip.tagsForAction,
				systemActionType: drip.systemActionType,
				tagsForSystemAction: drip.tagsForSystemAction,
				unAssignDayCount: drip.unAssignDayCount,
				dripActionEndDate: dripActionEndDate,
				pollOption: drip.poolOptionType,
				within: drip.within,
				quickReply: drip.quickReply,
				DripQuestionId: drip.DripQuestionId,
				milestoneField: drip.milestoneField,
				recurAnnually: drip.recurAnnually,
				// questionOptions:null
			};
			// console.log('--------Payload Drip and Action Details-----', payload);
			//Default Value For Channel Flow
			if (isChannelFlow) {
				payload.dripTriggerRule = 'Send on date';
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// Get All Drip Question and Options
			// let dripQuestion;
			// [err, dripQuestion] = await to(
			// 	DripQuestion.findAll({
			// 		where: {
			// 			PostId: drip.dripId,
			// 		},
			// 		include: [
			// 			{
			// 				model: Asset,
			// 				include: [
			// 					{
			// 						model: Asset_detail,
			// 					},
			// 				],
			// 			},
			// 			{
			// 				model: DripOption,
			// 				include: [
			// 					{
			// 						model: Asset,
			// 						include: [
			// 							{
			// 								model: Asset_detail,
			// 							},
			// 						],
			// 					},
			// 				],
			// 			},
			// 		],
			// 		order: [
			// 			['id', 'ASC'],
			// 			[
			// 				{
			// 					model: DripOption,
			// 				},
			// 				'id',
			// 				'ASC',
			// 			],
			// 		],
			// 	})
			// );
			// if (err) return ResponseError(res, err, 500, true);

			// if (dripQuestion && dripQuestion.length > 0) {
			// 	payload.questionOptions = dripQuestion;
			// }
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

			[err, drip_Cam] = await to(Drip_camp.create(payload));
			if (err) return ResponseError(res, err, 500, true);

			[err, campaignDripMapping] = await to(
				Campaign_drip_camp_mapping.create({
					DripCampId: drip_Cam.id,
					CampaignId: create_campaign.id,
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (drip_Cam.actionType == 'Add to group' || drip_Cam.actionType == 'Delete from group') {
				if (drip_Cam && drip.groupForAction.length > 0) {
					let list = [];
					for (let groupId of drip.groupForAction) {
						let payload = {
							DripCampId: drip_Cam.id,
							UserGroupId: groupId,
						};
						list.push(payload);
					}

					[err, addGroup] = await to(DripCampUserGroupAction.bulkCreate(list));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}
		if (!isChannelFlow && learnerGroupDetails && learnerGroupDetails.length > 0) {
			let learnerGroupList = [];
			for (let learnerGroupId of learnerGroupDetails) {
				let payload = {
					UserGroupId: learnerGroupId,
					CampaignId: create_campaign.id,
				};
				learnerGroupList.push(payload);
			}
			if (learnerGroupList.length > 0) {
				[err, campaignUserGroupMapping] = await to(Campaign_user_group_mapping.bulkCreate(learnerGroupList));
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (isChannelFlow && channelDetails?.length > 0) {
			let channelList = [];
			for (let channel of channelDetails) {
				let payload_3 = {
					TeamChannelId: channel.id,
					CampaignId: create_campaign.id,
				};
				channelList.push(payload_3);
			}
			if (channelList.length > 0) {
				[err, channelMapping] = await to(CampChannelMapping.bulkCreate(channelList));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		// Add Code for Start Rule Learner Group
		if (learnerGroupDetailsForStartRule?.length > 0) {
			let learnerGroupForStartRuleList = [];
			for (let learnerGroupId of learnerGroupDetailsForStartRule) {
				let payload = {
					UserGroupId: learnerGroupId,
					CampaignId: create_campaign.id,
				};
				learnerGroupForStartRuleList.push(payload);
			}
			if (learnerGroupForStartRuleList.length > 0) {
				[err, campaignUserGroupMapping] = await to(CampUserGroupStartRule.bulkCreate(learnerGroupForStartRuleList));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (campaignDetails && campaignDetails.tags) {
			let tags = campaignDetails.tags.split(',');
			let tagsList = [];
			for (let tag of tags) {
				let payload = {
					CampaignId: create_campaign.id,
					tag: tag,
				};
				tagsList.push(payload);
			}
			if (tagsList.length > 0) {
				[err, addTag] = await to(CampaignTagMapping.bulkCreate(tagsList));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (create_campaign && create_campaign.status == 'Scheduled') {
			assignDripToLearnerByUsingCampaign(create_campaign.id);
		}

		//Call Channel Function
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

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.DRIP_FLOW_CREATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{dripflow_title}}', campaignDetails.title);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);

		let userIds = await getAllUserIdsForNotification(clientId);
		var index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotification(notifcationMessage, ['Bell'], userIds);

		let notifcationMessageForUser = MESSAGE.DRIP_FLOW_CREATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{dripflow_title}}', campaignDetails.title);
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Drip Flow`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CampaignId: create_campaign.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIPFLOW_CREATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createCampaign = createCampaign;

//Update campaign
const updateCampaign = async function (req, res) {
	try {
		//Client Id, UseriD and Role Id
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(), // Must be a positive integer
			userId: Joi.number().integer().positive().required(), // Must be a positive integer
			roleId: Joi.number()
				.integer()
				.min(validationConstant.role.min)
				.max(validationConstant.role.max)
				.positive()
				.required(), // Must be a positive integer
			campaignId: Joi.number().integer().positive().required(), // Must be a positive integer
		});

		// Convert params to numbers
		let dataToValidate = {
			clientId: parseInt(req.params.clientId), // Using Number() to ensure a proper conversion
			userId: parseInt(req.query.userId),
			roleId: parseInt(req.query.roleId),
			campaignId: Number(req.params.campaignId),
		};

		// Validate the data
		const { error, value } = schema.validate(dataToValidate);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}
		// Assign validated values
		let { clientId, userId, roleId, campaignId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		//Validation for campaign details

		const campaignDetailSchema = Joi.object({
			id: Joi.number().integer().allow(null),
			title: Joi.string().trim().max(validationConstant.title.max).required(),
			description: Joi.string().trim().max(1000).allow(null, ''),
			startDate: Joi.alternatives().try(Joi.date().iso(), Joi.number().integer().positive()).allow(null).required(),
			startTimeId: Joi.number().integer().allow(null, ''),
			endDate: Joi.alternatives().try(Joi.date().iso(), Joi.number().integer().positive()).allow(null),
			endTimeId: Joi.number().integer().allow(null, ''),
			learnerGroup: Joi.array().items(Joi.number().integer()).required(),
			startRule: Joi.string().allow(null, '').required(),
			startAfter: Joi.number().integer().allow(null),
			learnerGroupForRule: Joi.array().items(Joi.number().integer()).allow(null),
			tags: Joi.string().trim().allow(null, ''),
			operator: Joi.string().trim().allow(null, ''),
			successMetrics: Joi.boolean().required(),
			successMetricsList: Joi.array()
				.items(
					Joi.object({
						id: Joi.number().integer().allow(null),
						label: Joi.string().trim().max(validationConstant.title.max).required(),
						DripCampIndex: Joi.array().items(Joi.number().integer()).required(),
						PostId: Joi.number().integer().required(),
						metrics: Joi.string().allow(null, 'null', '').required(),
						tempType: Joi.string()
							.valid(
								'Survey',
								'Offline Task',
								'Spin The Wheel',
								'Quiz',
								'Poll',
								'Video',
								'Single Image',
								'Carousel',
								null
							)
							.required(),
						dripType: Joi.string()
							.valid(
								'Only WhatsApp',
								'DripApp with sharing on WhatsApp',
								'Only Email',
								'DripApp with sharing on Email',
								'Only DripApp',
								'Only Teams',
								'DripApp with sharing on Teams',
								'null',
								null
							)
							.required(),
						activityScoreType: Joi.string().allow(null, ''),
						score: Joi.number().integer().allow(null),
						DripOptionId: Joi.number().integer().allow(null),
						option: Joi.string().trim().allow(null, ''),
						DripQuestionId: Joi.number().integer().allow(null),
						question: Joi.string().trim().allow(null, ''),
						quickReply: Joi.string().trim().allow(null, ''),
						offlineTaskText: Joi.string().trim().allow(null, ''),
						status: Joi.string().valid('Scheduled', 'Draft', 'Completed').required(),
					})
				)
				.when('successMetrics', {
					is: true,
					then: Joi.array().min(1).required(),
					otherwise: Joi.array().allow(null).default([]),
				}),
			flowType: Joi.string().valid('Campaign', 'Conversational').required(),
			status: Joi.string().valid('Draft', 'Scheduled', 'Completed').required(),
			createdAt: Joi.string().allow(null, ''),
			updatedAt: Joi.string().allow(null, ''),
		});

		const { error: campaignError, value: campaignValue } = campaignDetailSchema.validate(req.body.campaignDetails);
		if (campaignError) {
			return res.status(400).json({ error: campaignError.details[0].message });
		}

		//Drip and Action Validation
		const dripAndActionSchema = Joi.array().items(
			Joi.object({
				id: Joi.number().integer().allow(null),
				dripName: Joi.string().trim().max(validationConstant.title.max).required(),
				dripType: Joi.string()
					.valid(
						'Only WhatsApp',
						'DripApp with sharing on WhatsApp',
						'Only Email',
						'DripApp with sharing on Email',
						'Only DripApp',
						'Only Teams',
						'DripApp with sharing on Teams',
						'null',
						null
					)
					.allow(null),
				dripId: Joi.number().integer().allow(null),
				PostId: Joi.number().integer().allow(null),
				dripTriggerRule: Joi.string().allow(null),
				dripTriggerDate: Joi.number().integer().allow(null),
				dripTriggerTimeId: Joi.number().integer().allow(null),
				tempType: Joi.string()
					.valid('Survey', 'Offline Task', 'Spin The Wheel', 'Quiz', 'Poll', 'Video', 'Single Image', 'Carousel', null)
					.allow(null),
				actionType: Joi.string().allow(null),
				actionTriggerRule: Joi.string().allow(null),
				dependencyDripIndex: Joi.number().integer().allow(null),
				sendAfter: Joi.number().integer().allow(null),
				userAction: Joi.string().allow(null, ''),
				activityScoreType: Joi.string().allow(null, ''),
				score: Joi.number().integer().allow(null),
				dripFlowType: Joi.string().valid('Send a Drip', 'Take Action').required(),
				dripTriggerActualTime: Joi.string().trim().allow(null, ''),
				dripTitleName: Joi.string().trim().max(validationConstant.title.max).allow(null, ''),
				dripPublished: Joi.boolean(),
				status: Joi.string().valid('Scheduled', 'Draft', 'Completed').required(),
				templateStatus: Joi.string().allow(null, ''),
				whatsAppTemplateFlag: Joi.boolean().required(),
				assetVideoTranscoding: Joi.boolean(),
				dependencyIndex: Joi.number().integer().allow(null),
				showDependancyDD: Joi.boolean(),
				index: Joi.number().integer().required(),
				systemActionType: Joi.string().allow(null, ''),
				tagsForSystemAction: Joi.string().allow(null, ''),
				groupForAction: Joi.array().items(Joi.number().integer()).allow(null),
				tagsForAction: Joi.string().allow(null, ''),
				selected_send_drip_and_take_action_list: Joi.string().allow(null, ''),
				selected_send_a_drip_list: Joi.string().allow(null, ''),
				selected_activity_send_a_drip_list: Joi.string().allow(null, ''),
				unAssignDayCount: Joi.number().integer().allow(null),
				dripActionEndDate: Joi.any().allow(null),
				dripActionEndTimeId: Joi.number().integer().allow(null),
				poolOptionType: Joi.string().allow(null, ''),
				within: Joi.number().integer().allow(null),
				quickReplyList: Joi.any().allow(null, ''),
				quickReply: Joi.string().allow(null, ''),
				DripQuestionId: Joi.number().integer().allow(null),
				showTrackableLink: Joi.boolean(),
				milestoneField: Joi.string().allow(null, ''),
				recurAnnually: Joi.boolean(),
				dripDropDownTitle: Joi.string().trim().max(validationConstant.title.max),
				published: Joi.boolean().allow(null),
				pollOption: Joi.string().allow(null, ''),
				createdAt: Joi.date().allow(null),
				updatedAt: Joi.date().allow(null),
				Campaign_drip_camp_mapping: Joi.object().allow(null),
				Post: Joi.object().allow(null),
				User_groups: Joi.array().allow(null),
				createdAt: Joi.string().allow(null, ''),
				updatedAt: Joi.string().allow(null, ''),
			})
		);
		const { error: dripAndActionError, value: dripAndActionValue } = dripAndActionSchema.validate(req.body.dripDetails);

		if (dripAndActionError) {
			return res.status(400).json({ error: dripAndActionError.details[0].message });
		}

		// const schema = Joi.object({
		// 	campaignId: Joi.number().integer().positive().required(), // Must be a positive integer
		// 	clientId: Joi.number().integer().positive().required(), // Must be a positive integer
		// });

		// // Convert params to numbers
		// let dataToValidate = {
		// 	campaignId: Number(req.params.campaignId), // Using Number() to ensure a proper conversion
		// 	clientId: Number(req.params.clientId),
		// };
		// // Validate the data
		// const { error, value } = schema.validate(dataToValidate);

		// if (error) {
		// 	return res.status(400).json({ error: error.details[0].message });
		// }

		// Assign validated values
		// let { campaignId, clientId } = value;
		let campaignDetails = req.body.campaignDetails;
		let dripDetails = req.body.dripDetails;
		let learnerGroupDetails = req.body.campaignDetails.learnerGroup;
		// let campaignId = parseInt(req.params.campaignId);
		let learnerGroupDetailsForStartRule = req.body.campaignDetails.learnerGroupForRule;
		// let clientId = parseInt(req.params.clientId);

		const isChannelFlow = req.body.isChannelFlow;
		let channelDetails = req.body.channelDetails;

		const notTackAction = [
			'Not read on channel',
			'Not read on drip app',
			'Drip Action not taken',
			'Drip submit Action not taken',
		];

		if (!campaignDetails.startDate && campaignDetails.status !== 'Draft') campaignDetails.status = 'Running';

		campaignDetails.startDate = campaignDetails.startDate
			? moment(new Date(campaignDetails.startDate)).format()
			: moment().format();
		campaignDetails.endDate = moment(new Date(campaignDetails.endDate)).format();
		campaignDetails.ClientId = parseInt(req.params.clientId);
		campaignDetails.UserId = parseInt(req.query.userId);
		campaignDetails.RoleId = parseInt(req.query.roleId);

		campaignDetails.title = await capitalFirstLatter(campaignDetails.title);

		//Add default value for channel flow
		if (isChannelFlow) {
			campaignDetails.startRule = 'Start on date';
			campaignDetails.flowType = 'Campaign';
		}

		// Update Campaign
		[err, update_campaign] = await to(
			Campaign.update(campaignDetails, {
				where: {
					id: campaignId,
					UserId: parseInt(req.query.userId),
					RoleId: parseInt(req.query.roleId),
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		await checkCampaignStatus([campaignId]);
		// Update Campaign and Post Mapping

		[err, dripCamp] = await to(
			Campaign_drip_camp_mapping.findAll({
				where: {
					CampaignId: campaignId,
				},
				attribute: ['DripCampId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let dripCampIds = [];
		for (let i in dripCamp) {
			dripCampIds.push(dripCamp[i].DripCampId);
		}

		// [err, campaignPostMapping] = await to(Campaign_drip_camp_mapping.destroy({
		//     where: {
		//         CampaignId: campaignId
		//     },
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		[err, deleteDripCampaingUserGroupMapping] = await to(
			DripCampUserGroupAction.destroy({
				where: {
					DripCampId: dripCampIds,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// [err, deleteDripMapping] = await to(Drip_camp.destroy({
		//     where: {
		//         id: dripCampIds
		//     },
		// }));
		// if (err) return ResponseError(res, err, 500, true);

		let removeStatusIds = [];

		for (let drip of dripDetails) {
			let dripActionEndDate = null;
			let dripTriggerDate = drip.dripTriggerDate ? moment(new Date(drip.dripTriggerDate)).format() : null;
			if (drip.userAction && notTackAction.includes(drip.userAction)) {
				for (let previousDrip of dripDetails) {
					if (drip.dependencyDripIndex === previousDrip.index) {
						if (previousDrip.dripTriggerDate && drip.within)
							dripActionEndDate = moment(previousDrip.dripTriggerDate).add(drip.within, 'hours').format();
					}
				}
			}
			if (dripTriggerDate === 'Invalid date') {
				dripTriggerDate = null;
			}
			let payload = {
				CampaignId: campaignId,
				PostId: drip.dripId,
				dripTriggerDate: dripTriggerDate,
				dripTriggerRule: drip.dripTriggerRule,
				dripType: drip.dripType,
				dripName: drip.dripName,
				status: drip.status,
				published: drip && drip.published ? drip.published : null,
				index: drip.index,
				dripFlowType: drip.dripFlowType,
				userAction: drip.userAction,
				sendAfter: drip.sendAfter,
				dependencyDripIndex: drip.dependencyDripIndex,
				actionTriggerRule: drip.actionTriggerRule,
				actionType: drip.actionType,
				activityScoreType: drip.activityScoreType,
				score: drip.score,
				tagsForAction: drip.tagsForAction,
				systemActionType: drip.systemActionType,
				tagsForSystemAction: drip.tagsForSystemAction,
				unAssignDayCount: drip.unAssignDayCount,
				dripActionEndDate: dripActionEndDate,
				pollOption: drip.poolOptionType,
				within: drip.within,
				quickReply: drip.quickReply,
				DripQuestionId: drip.DripQuestionId,
				milestoneField: drip.milestoneField,
				recurAnnually: drip.recurAnnually,
			};

			if (isChannelFlow) {
				payload.dripTriggerRule = 'Send on date';
			}

			if (drip && drip.id) {
				[err, dripCamp] = await to(
					Drip_camp.update(payload, {
						where: {
							id: drip.id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, dripCamp] = await to(Drip_camp.create(payload));
				if (err) return ResponseError(res, err, 500, true);
				[err, campaignDripMapping] = await to(
					Campaign_drip_camp_mapping.create({
						DripCampId: dripCamp.id,
						CampaignId: campaignId,
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (drip.status == 'Removed') {
				removeStatusIds.push(drip.index);
			}

			if ((!isChannelFlow && payload.actionType == 'Add to group') || payload.actionType == 'Delete from group') {
				if (drip && drip.groupForAction.length > 0) {
					let list = [];
					for (let groupId of drip.groupForAction) {
						let dripCamId;
						if (drip && drip.id) {
							dripCamId = drip.id;
						} else {
							dripCamId = dripCamp.id;
						}
						let payload = {
							DripCampId: dripCamId,
							UserGroupId: groupId,
						};
						list.push(payload);
					}

					[err, addGroup] = await to(DripCampUserGroupAction.bulkCreate(list));
					if (err) return ResponseError(res, err, 500, true);
				}
			} else if (isChannelFlow && channelDetails?.length > 0) {
				let createChannelMapping = [];
				//Delete Old Channel Mapping

				[err, deleteChannelMapping] = await to(
					CampChannelMapping.destroy({
						where: {
							CampaignId: campaignId,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				//Create NewChannel Mapping
				for (let channel of channelDetails) {
					let payload_3 = {
						TeamChannelId: channel.id,
						CampaignId: campaignId,
					};
					createChannelMapping.push(payload_3);
				}
				if (createChannelMapping?.length) {
					[err, newChannelMapping] = await to(CampChannelMapping.bulkCreate(createChannelMapping));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		if (removeStatusIds && removeStatusIds.length > 0) {
			//console.log('----removeStatusIds---', removeStatusIds);
			[err, removeAssignedDrip] = await to(
				CampWhatsAppEmailDrip.destroy({
					where: {
						CampaignId: campaignId,
						DripCampIndex: removeStatusIds,
						isTriggered: false,
					},
				})
			);

			[err, removeAssignedDrip] = await to(
				CampTakeAction.destroy({
					where: {
						CampaignId: campaignId,
						DripCampIndex: removeStatusIds,
						isTriggered: false,
					},
				})
			);

			// let query_1 = `SELECT  ARRAY (SELECT "id" FROM "Assigned_post_to_users" AS "Assigned_post_to_user"
			//                 WHERE "Assigned_post_to_user"."CampaignId" = ${parseInt(campaignId)}
			//                 AND "Assigned_post_to_user"."DripCampIndex" IN (${removeStatusIds.toString()})
			//                 AND "Assigned_post_to_user"."publishOn" > '${moment().format()}');`;

			// [ids] = await sequelize.query(query_1);

			const query_1 = ` 
			SELECT ARRAY (
				SELECT "id" 
				FROM "Assigned_post_to_users" 
				WHERE "CampaignId" = :campaignId 
				AND "DripCampIndex" IN (:removeStatusIds) 
				AND "publishOn" > :publishOn
    		);`;

			// Using replacements to prevent SQL injection
			let ids = await sequelize.query(query_1, {
				replacements: {
					campaignId: parseInt(campaignId), // Ensuring it's a valid number
					removeStatusIds: removeStatusIds, // Sequelize handles array expansion
					publishOn: moment().format(), // Properly formatted date
				},
			});

			let assignToUserPostIds = ids[0].array;

			if (assignToUserPostIds && assignToUserPostIds.length > 0) {
				// let query_2 = `SELECT ARRAY(SELECT "id"
				//                 FROM "DripUserQuestions" AS "DripUserQuestion"
				//                  WHERE "DripUserQuestion"."AssignedPostToUserId" IN (${assignToUserPostIds.toString()}));`;

				// [ids] = await sequelize.query(query_2);

				const query_2 = `
					SELECT ARRAY (
						SELECT "id" 
						FROM "DripUserQuestions" 
						WHERE "AssignedPostToUserId" IN (:assignToUserPostIds)
					);
				`;

				ids = await sequelize.query(query_2, {
					replacements: { assignToUserPostIds: assignToUserPostIds }, // Sequelize safely handles arrays
				});

				let userQuestionIds = ids[0].array;
				if (userQuestionIds && userQuestionIds.length > 0) {
					[err, removeOption] = await to(
						DripUserOption.destroy({
							where: {
								DripUserQuestionId: userQuestionIds,
							},
						})
					);
					[err, removeQuestion] = await to(
						DripUserQuestion.destroy({
							where: {
								AssignedPostToUserId: assignToUserPostIds,
							},
						})
					);
				}

				[err, removeAssignedDrip] = await to(
					Assigned_post_to_user.destroy({
						where: {
							id: assignToUserPostIds,
						},
					})
				);
			}
		}

		//Remove Old Campaign User Group Mapping
		[err, campaignUserGroupMapping] = await to(
			Campaign_user_group_mapping.destroy({
				where: {
					CampaignId: campaignId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// Remove Old Campaign User Group For Drip Flow Start Rule
		[err, campaignUserGroupMapping] = await to(
			CampUserGroupStartRule.destroy({
				where: {
					CampaignId: campaignId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (!isChannelFlow && learnerGroupDetails && learnerGroupDetails.length > 0) {
			for (let learnerGroupId of learnerGroupDetails) {
				let payload = {
					UserGroupId: learnerGroupId,
					CampaignId: campaignId,
				};

				[err, campaignUserGroupMapping] = await to(Campaign_user_group_mapping.create(payload));
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		//Add Learner Group Foe Start Rule
		if (!isChannelFlow && learnerGroupDetailsForStartRule.length > 0) {
			let learnerGroupList = [];
			for (let learnerGroupId of learnerGroupDetailsForStartRule) {
				let payload = {
					UserGroupId: learnerGroupId,
					CampaignId: campaignId,
				};
				learnerGroupList.push(payload);
			}
			if (learnerGroupList.length > 0) {
				[err, campaignUserGroupMapping] = await to(CampUserGroupStartRule.bulkCreate(learnerGroupList));
				if (err) return ResponseError(res, err, 500, true);
				learnerGroupList = [];
			}
		}

		[err, addTag] = await to(
			CampaignTagMapping.destroy({
				where: {
					CampaignId: campaignId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (!isChannelFlow && campaignDetails && campaignDetails.tags) {
			let tags = campaignDetails.tags.split(',');
			let tagsList = [];
			for (let tag of tags) {
				let payload = {
					CampaignId: campaignId,
					tag: tag,
				};
				tagsList.push(payload);
			}
			if (tagsList.length > 0) {
				[err, addTag] = await to(CampaignTagMapping.bulkCreate(tagsList));
				if (err) return ResponseError(res, err, 500, true);
				tagsList = [];
			}
		}

		if (campaignDetails && campaignDetails.status == 'Scheduled') {
			//console.log('---In Edit---');
			editAssignDripToLearnerByUsingCampaign(campaignId);
		}
		// In Edit Check Assigned Code to USer and Edit it

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
				attributes: ['local_user_id'],
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

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.DRIP_FLOW_UPDATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{dripflow_title}}', campaignDetails.title);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);

		let userIds = await getAllUserIdsForNotification(clientId);
		var index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotification(notifcationMessage, ['Bell'], userIds);

		let notifcationMessageForUser = MESSAGE.DRIP_FLOW_UPDATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{dripflow_title}}', campaignDetails.title);
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Drip Flow`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CampaignId: campaignId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIPFLOW_UPDATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateCampaign = updateCampaign;

//Delete Campaign
const deleteCampaign = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: req.body,
			userId: parseInt(req.query.userId),
			roleId: parseInt(req.query.roleId),
			clientId: parseInt(req.query.clientId),
		};

		const { error, value } = validationSchema.validate(payload);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		let { campaignId, userId, roleId, clientId } = value;

		//check ClientId Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}
		let err;
		// const campaignId = req.body;
		// const userId = parseInt(req.query.userId);
		// const roleId = parseInt(req.query.roleId);
		// const clientId = parseInt(req.query.clientId);
		[err, delete_campaign] = await to(
			Campaign.update(
				{
					isDeleted: true,
					status: 'Deleted',
				},
				{
					where: {
						id: campaignId,
						UserId: userId,
						RoleId: roleId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Deleted all notPublish Data from Assigned_post_to_users and CampWhatsAppEmailDrips Table

		[err, deleteCampaignData] = await to(
			Assigned_post_to_user.destroy({
				where: {
					CampaignId: campaignId,
					isPublished: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Get Count of Assigned Drip For Add to Licence

		//For Only WhatsApp
		[err, countOfOnlyWhatsApp] = await to(
			CampWhatsAppEmailDrip.count({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					dripType: 'Only WhatsApp',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For WhatsApp with Drip
		[err, countOfWhatsAppWithDrip] = await to(
			CampWhatsAppEmailDrip.count({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					dripType: 'DripApp with sharing on WhatsApp',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Email with Drip
		[err, countOfEmailWithDrip] = await to(
			CampWhatsAppEmailDrip.count({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					dripType: 'DripApp with sharing on Email',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Only Drip
		[err, countOfOnlyDrip] = await to(
			CampWhatsAppEmailDrip.count({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
					dripType: 'Only DripApp',
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let licence = await getLearnerValidaionByClientId(clientId);

		if (licence) {
			//Update InTo Licence
			let payload = {
				useWhatsAppCount: licence.useWhatsAppCount - countOfOnlyWhatsApp,
				useSharWhatsAppCount: licence.useSharWhatsAppCount - countOfWhatsAppWithDrip,
				useEmailCount: licence.useEmailCount - countOfEmailWithDrip,
				useDripappCount: licence.useDripappCount - countOfOnlyDrip,
			};

			[err, updateLicenceCount] = await to(
				License.update(payload, {
					where: {
						id: licence.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, deleteCampaignData] = await to(
			CampWhatsAppEmailDrip.destroy({
				where: {
					CampaignId: campaignId,
					isTriggered: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: req.user.id,
				},
				attributes: ['local_user_id'],
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

		[err, get_campaign] = await to(
			Campaign.findAll({
				where: {
					id: campaignId,
					UserId: userId,
					RoleId: roleId,
				},
				attribute: ['title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let userIds = await getAllUserIdsForNotification(clientId);
		var index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		for (let name of get_campaign) {
			let notifcationMessage = MESSAGE.DRIP_FLOW_DELETE_NOTIFICATION;
			notifcationMessage = notifcationMessage.replace('{{dripflow_title}}', name.title);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			await createNotification(notifcationMessage, ['Bell'], userIds);

			let notifcationMessageForUser = MESSAGE.DRIP_FLOW_DELETE_NOTIFICATION;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{dripflow_title}}', name.title);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Drip Flow`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CampaignId: campaignId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIPFLOW_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteCampaign = deleteCampaign;

//Pause Campaign
const pausedCampaign = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.alternatives()
				.try(Joi.number().integer().positive(), Joi.array().items(Joi.number().integer().positive()))
				.required(),
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: req.body.dripFlowIds,
			userId: parseInt(req.query.userId),
			roleId: parseInt(req.query.roleId),
			clientId: parseInt(req.params.clientId),
		};

		const { error, value } = validationSchema.validate(payload);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		const { campaignId, userId, roleId, clientId } = value;

		//check ClientId Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err;
		// const campaignId = req.body.dripFlowIds;
		// const userId = parseInt(req.query.userId);
		// const roleId = parseInt(req.query.roleId);
		// const clientId = parseInt(req.params.clientId);
		[err, paused_campaign] = await to(
			Campaign.update(
				{
					is_deleted: false,
					status: 'Paused',
				},
				{
					where: {
						id: campaignId,
						UserId: userId,
						RoleId: roleId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in CampWhatsAppEmailDrip
		[err, updateCampaignStatus] = await to(
			CampWhatsAppEmailDrip.update(
				{
					campaignPaused: true,
				},
				{
					where: {
						CampaignId: campaignId,
						isTriggered: false,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in CampTakeAction
		[err, updateCampaignStatus] = await to(
			CampTakeAction.update(
				{
					campaignPaused: true,
				},
				{
					where: {
						CampaignId: campaignId,
						isTriggered: false,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in Assigned_post_to_user
		let todayDate = new Date();
		[err, updateCampaignStatus] = await to(
			Assigned_post_to_user.update(
				{
					campaignPaused: true,
				},
				{
					where: {
						CampaignId: campaignId,
						publishOn: {
							[Op.gt]: todayDate,
						},
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
				attributes: ['local_user_id'],
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

		[err, get_campaign] = await to(
			Campaign.findAll({
				where: {
					id: campaignId,
					UserId: userId,
					RoleId: roleId,
				},
				attribute: ['title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let userIds = await getAllUserIdsForNotification(clientId);
		var index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		for (let name of get_campaign) {
			let notifcationMessage = MESSAGE.DRIP_FLOW_PAUSED_NOTIFICATION;
			notifcationMessage = notifcationMessage.replace('{{dripflow_title}}', name.title);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			await createNotification(notifcationMessage, ['Bell'], userIds);

			let notifcationMessageForUser = MESSAGE.DRIP_FLOW_PAUSED_NOTIFICATION;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{dripflow_title}}', name.title);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			await createNotification(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Pause Drip Flow`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CampaignId: campaignId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			message: MESSAGE.DRIPFLOW_PAUSED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.pausedCampaign = pausedCampaign;

//resume Campaign
const resumeCampaign = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.alternatives()
				.try(Joi.number().integer().positive(), Joi.array().items(Joi.number().integer().positive()))
				.required(),
			userId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: req.body.dripFlowIds,
			userId: parseInt(req.query.userId),
			roleId: parseInt(req.query.roleId),
			clientId: parseInt(req.params.clientId),
		};

		const { error, value } = validationSchema.validate(payload);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		const { campaignId, userId, roleId, clientId } = value;

		let err;
		// const campaignId = req.body.dripFlowIds;
		// const userId = parseInt(req.query.userId);
		// const roleId = parseInt(req.query.roleId);
		// const clientId = parseInt(req.params.clientId);
		[err, resume_campaign] = await to(
			Campaign.update(
				{
					is_deleted: false,
					status: 'Scheduled',
				},
				{
					where: {
						id: campaignId,
						UserId: userId,
						RoleId: roleId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in CampWhatsAppEmailDrip
		[err, updateCampaignStatus] = await to(
			CampWhatsAppEmailDrip.update(
				{
					campaignPaused: false,
				},
				{
					where: {
						CampaignId: campaignId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in CampTakeAction
		[err, updateCampaignStatus] = await to(
			CampTakeAction.update(
				{
					campaignPaused: false,
				},
				{
					where: {
						CampaignId: campaignId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		//Paused Campaign Update in Assigned_post_to_user
		[err, updateCampaignStatus] = await to(
			Assigned_post_to_user.update(
				{
					campaignPaused: false,
				},
				{
					where: {
						CampaignId: campaignId,
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
				attributes: ['local_user_id'],
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

		let notifcationMessage = `Drip Flow Resumed by ${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}.`;
		let userIds = await getAllUserIdsForNotification(clientId);
		await createNotification(notifcationMessage, ['Bell'], userIds);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Resume Drip Flow`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					CampaignId: campaignId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.DRIPFLOW_PAUSED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.resumeCampaign = resumeCampaign;

const getAllCampaignByClientId = async function (req, res) {
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

		let campaigns;
		let err;
		// let clientId = req.params.clientId;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);
		let userId = req.user.UserId;
		let roleId = req.user.RoleId;
		let response;
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		[err, campaigns] = await to(
			Campaign.findAndCountAll({
				distinct: true,
				where: {
					ClientId: allSubClientIds,
					// UserId: userId,
					// RoleId: roleId,
					isDeleted: false,
					forTest: false,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						include: [
							{
								model: Post,
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
							},
						],
					},
					{ model: CampChannelMapping, include: [{ model: TeamChannel, attributes: ['id', 'title'] }] },
				],
				offset: offset,
				limit: limit,
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let finalList = [];
		if (campaigns && campaigns.rows && campaigns.rows.length > 0) {
			for (let campaign of campaigns.rows) {
				let temp = campaign.convertToJSON();
				temp.User_groups = [];
				[err, user_group_camp_list] = await to(
					Campaign_user_group_mapping.findAll({
						where: {
							CampaignId: campaign.id,
						},
						include: [
							{
								model: User_group,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (user_group_camp_list && user_group_camp_list.length > 0) {
					for (let groupList of user_group_camp_list) {
						temp.User_groups.push(groupList.User_group);
					}
				}
				finalList.push(temp);
			}
		}

		return ResponseSuccess(res, {
			data: finalList,
			count: campaigns.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllCampaignByClientId = getAllCampaignByClientId;

const getCampaignById = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
			RoleId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: parseInt(req.query.campaignId),
			userId: parseInt(req.query.userId),
			clientId: parseInt(req.query.clientId),
			RoleId: parseInt(req.query.roleId),
		};

		const { error, value } = validationSchema.validate(payload);

		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Assign validated values
		const { campaignId, userId, clientId, RoleId } = value;

		let err, campaign;
		// let campaignId = parseInt(req.query.campaignId);
		// let userId = parseInt(req.query.userId);
		// let clientId = parseInt(req.query.clientId);
		// let RoleId = parseInt(req.query.roleId);

		//check ClientId Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);
		[err, campaign] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
					// UserId: userId,
					// RoleId: RoleId,
					ClientId: allSubClientIds,
				},
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						include: [
							{
								model: Post,
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
										model: DripQuestion,
										include: [
											{
												model: DripOption,
											},
										],
									},
								],
							},
							{
								model: User_group,
								through: 'DripCampUserGroupAction',
								attributes: ['id', 'title'],
							},
						],
					},
					{
						model: CampaignTagMapping,
					},
					{ model: CampChannelMapping, include: [{ model: TeamChannel }] },
				],
				order: [
					[
						{
							model: Drip_camp,
						},
						'index',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		campaign = campaign.convertToJSON();
		campaign.User_groups = [];

		if (campaign && campaign.CampaignTagMappings.length > 0) {
			let tags = [];
			for (let tag of campaign.CampaignTagMappings) {
				tags.push(tag.tag);
			}
			campaign.tags = tags.toString();
		}

		[err, user_group_camp_list] = await to(
			Campaign_user_group_mapping.findAll({
				where: {
					CampaignId: campaignId,
				},
				include: [
					{
						model: User_group,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (user_group_camp_list && user_group_camp_list.length > 0) {
			for (let groupList of user_group_camp_list) {
				campaign.User_groups.push(groupList.User_group);
			}
		}

		[err, user_group_for_start_rule] = await to(
			CampUserGroupStartRule.findAll({
				where: {
					CampaignId: campaignId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (user_group_for_start_rule && user_group_for_start_rule.length > 0) {
			campaign.user_group_for_start_rule = user_group_for_start_rule;
		} else {
			campaign.user_group_for_start_rule = [];
		}

		return ResponseSuccess(res, {
			data: campaign,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCampaignById = getCampaignById;

const getAllSearchCampaignByClientId = async function (req, res) {
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
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);
		let userId = req.user.id;
		let roleId = req.user.RoleId;
		let UserGroupId = [];
		let whereCondition = [];
		let User_groupDetail;
		let DripCampDetail;
		let UpdatedDripCampId = [];
		let User_groupDetailCampaigns;
		let Dripcampaigns;
		let UpdatedCampaign;
		let campaigns;
		let allData = [];
		let UpdatedCampaignId = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		let User_groupDetailCampaignsfinalList = [];
		let DripcampaignsfinalList = [];
		let campaignsfinalList = [];
		let UpdatedcampaignsfinalList = [];

		let selectedDate = req.body.selectedDate;
		let dateCondition = [];
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

		if (filterColumn.indexOf('status') > -1) {
			whereCondition.push({
				status: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('id') > -1) {
				let searchKeys = parseInt(searchKey);
				whereCondition.push({
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('learnerGroup') > -1) {
			// [err, User_groupDetail] = await to(
			// 	User_group.findAll({
			// 		where: {
			// 			title: {
			// 				[sequelize.Op.iLike]: '%' + searchKey + '%',
			// 			},
			// 			ClientId: allSubClientIds,
			// 			// UserId: userId,
			// 			// RoleId: roleId,
			// 			is_deleted: false,
			// 		},
			// 		attributes: ['id'],
			// 	})
			// );

			[err, user_group_camp_list] = await to(
				Campaign_user_group_mapping.findAll({
					// where: dateCondition,
					include: [
						{
							model: User_group,
							where: {
								title: {
									[sequelize.Op.iLike]: '%' + searchKey + '%',
								},
								ClientId: allSubClientIds,
								is_deleted: false,
							},
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			for (let User_group of user_group_camp_list) {
				let UpdatedUser_group = User_group.convertToJSON();
				// console.log('--UpdatedUser_group--', UpdatedUser_group);
				UpdatedCampaignId.push(UpdatedUser_group.CampaignId);
			}

			// if (User_groupDetail && User_groupDetail.length > 0) {
			// 	for (let User_group of User_groupDetail) {
			// 		let UpdatedUser_group = User_group.convertToJSON();
			// 		UserGroupId.push(UpdatedUser_group.id);
			// 	}

			// 	[err, user_group_Data] = await to(
			// 		Campaign_user_group_mapping.findAll({
			// 			where: {
			// 				UserGroupId: UserGroupId,
			// 			},
			// 		})
			// 	);
			// 	if (err) return ResponseError(res, err, 500, true);

			// 	for (let item of user_group_Data) {
			// 		let item_ = item.convertToJSON();
			// 		UpdatedCampaignId.push(item_.CampaignId);
			// 	}

			// 	console.log('---UpdatedCampaignId--1--', UpdatedCampaignId);
			// }
			// if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('channels') > -1) {
			[err, DripCampDetail] = await to(
				Drip_camp.findAll({
					where: {
						dripType: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
					},
					attributes: ['id'],
				})
			);

			if (DripCampDetail && DripCampDetail.length > 0) {
				for (let dripCamp of DripCampDetail) {
					let UpdatedDripCamp = dripCamp.convertToJSON();
					UpdatedDripCampId.push(UpdatedDripCamp.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		// if (User_groupDetail && User_groupDetail.length > 0) {
		// 	[err, User_groupDetailCampaigns] = await to(
		// 		Campaign.findAll({
		// 			where: {
		// 				ClientId: allSubClientIds,
		// 				// UserId: userId,
		// 				// RoleId: roleId,
		// 				isDeleted: false,
		// 				[Op.and]: dateCondition,
		// 			},
		// 			include: [
		// 				// {
		// 				// 	model: User_group,
		// 				// 	where: {
		// 				// 		is_deleted: false,
		// 				// 		id: UserGroupId,
		// 				// 	},
		// 				// 	through: 'Campaign_user_group_mapping',
		// 				// },
		// 				{
		// 					model: Drip_camp,
		// 					through: 'Campaign_drip_camp_mapping',
		// 					include: [
		// 						{
		// 							model: Post,
		// 							include: [
		// 								{
		// 									model: Drip_whatsapp_native,
		// 								},
		// 								{
		// 									model: Drip_whatsapp_non_native,
		// 								},
		// 								{
		// 									model: Drip_email_non_native,
		// 								},
		// 								{
		// 									model: Drip_native,
		// 								},
		// 								{
		// 									model: Asset,
		// 									include: [
		// 										{
		// 											model: Asset_detail,
		// 										},
		// 									],
		// 								},
		// 							],
		// 						},
		// 					],
		// 				},
		// 			],
		// 			order: [['createdAt', 'DESC']],
		// 		})
		// 	);

		// 	if (User_groupDetailCampaigns && User_groupDetailCampaigns.length > 0) {
		// 		for (let campaign of User_groupDetailCampaigns) {
		// 			let temp = campaign.convertToJSON();
		// 			temp.User_groups = [];
		// 			[err, user_group_camp_list] = await to(
		// 				Campaign_user_group_mapping.findAll({
		// 					where: {
		// 						CampaignId: campaign.id,
		// 					},
		// 					include: [
		// 						{
		// 							model: User_group,
		// 						},
		// 					],
		// 				})
		// 			);
		// 			if (err) return ResponseError(res, err, 500, true);
		// 			if (user_group_camp_list && user_group_camp_list.length > 0) {
		// 				for (let groupList of user_group_camp_list) {
		// 					temp.User_groups.push(groupList.User_group);
		// 				}
		// 			}
		// 			User_groupDetailCampaignsfinalList.push(temp);
		// 		}
		// 	}
		// }

		if (UpdatedDripCampId && UpdatedDripCampId.length > 0) {
			[err, Dripcampaigns] = await to(
				Campaign.findAll({
					where: {
						ClientId: allSubClientIds,
						isDeleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							where: {
								id: UpdatedDripCampId,
							},
							include: [
								{
									model: Post,
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
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);

			if (Dripcampaigns && Dripcampaigns.length > 0) {
				for (let campaign of Dripcampaigns) {
					let temp = campaign.convertToJSON();
					temp.User_groups = [];
					[err, user_group_camp_list] = await to(
						Campaign_user_group_mapping.findAll({
							where: {
								CampaignId: campaign.id,
							},
							include: [
								{
									model: User_group,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (user_group_camp_list && user_group_camp_list.length > 0) {
						for (let groupList of user_group_camp_list) {
							temp.User_groups.push(groupList.User_group);
						}
					}
					DripcampaignsfinalList.push(temp);
				}
			}
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, campaigns] = await to(
				Campaign.findAll({
					where: {
						[sequelize.Op.or]: whereCondition,
						ClientId: allSubClientIds,
						isDeleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							include: [
								{
									model: Post,
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
								},
							],
						},
					],
					order: [['createdAt', 'DESC']],
				})
			);

			if (campaigns && campaigns.length > 0) {
				for (let campaign of campaigns) {
					let temp = campaign.convertToJSON();
					temp.User_groups = [];
					[err, user_group_camp_list] = await to(
						Campaign_user_group_mapping.findAll({
							where: {
								CampaignId: campaign.id,
							},
							include: [
								{
									model: User_group,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (user_group_camp_list && user_group_camp_list.length > 0) {
						for (let groupList of user_group_camp_list) {
							temp.User_groups.push(groupList.User_group);
						}
					}
					campaignsfinalList.push(temp);
				}
			}
		}

		if (User_groupDetailCampaignsfinalList && User_groupDetailCampaignsfinalList.length > 0) {
			for (let User_group_detail_campaigns of User_groupDetailCampaignsfinalList) {
				allData.push(User_group_detail_campaigns);
			}
		}

		if (DripcampaignsfinalList && DripcampaignsfinalList.length > 0) {
			for (let drip_campaigns of DripcampaignsfinalList) {
				allData.push(drip_campaigns);
			}
		}

		if (campaignsfinalList && campaignsfinalList.length > 0) {
			for (let campaigns_ of campaignsfinalList) {
				allData.push(campaigns_);
			}
		}

		for (let item of allData) {
			let item_ = item;
			UpdatedCampaignId.push(item_.id);
		}

		// console.log('---UpdatedCampaignId--2--', UpdatedCampaignId);
		if (UpdatedCampaignId && UpdatedCampaignId.length > 0) {
			[err, UpdatedCampaign] = await to(
				Campaign.findAndCountAll({
					distinct: true,
					where: {
						id: UpdatedCampaignId,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Drip_camp,
							through: 'Campaign_drip_camp_mapping',
							include: [
								{
									model: Post,
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
								},
							],
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);

			if (UpdatedCampaign && UpdatedCampaign.rows && UpdatedCampaign.rows.length > 0) {
				for (let campaign of UpdatedCampaign.rows) {
					let temp = campaign.convertToJSON();
					temp.User_groups = [];
					[err, user_group_camp_list] = await to(
						Campaign_user_group_mapping.findAll({
							where: {
								CampaignId: campaign.id,
							},
							include: [
								{
									model: User_group,
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (user_group_camp_list && user_group_camp_list.length > 0) {
						for (let groupList of user_group_camp_list) {
							temp.User_groups.push(groupList.User_group);
						}
					}
					UpdatedcampaignsfinalList.push(temp);
				}
			}
		}
		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (UpdatedcampaignsfinalList && UpdatedcampaignsfinalList.length > 0) {
			for (let campaign of UpdatedcampaignsfinalList) {
				let campaign_ = campaign;
				newList.push(campaign_);
			}
		}

		let count;
		if (UpdatedCampaign != undefined) {
			count = UpdatedCampaign.count;
		} else {
			count = 0;
		}
		return ResponseSuccess(res, {
			data: newList,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchCampaignByClientId = getAllSearchCampaignByClientId;

const getDripCampTitleByCampaignIdForAnalytics = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: parseInt(req.params.campaignId),
		};

		const { error, value } = validationSchema.validate(payload);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { campaignId } = value;

		let err, campaign;
		// let campaignId = parseInt(req.params.campaignId);
		let dataToSend = [];
		let dataToSend3 = [];
		[err, campaign] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
				},
				include: [
					{
						model: Drip_camp,
						where: {
							dripFlowType: 'Send a Drip',
						},
						through: 'Campaign_drip_camp_mapping',
						include: [
							{
								model: Post,
								include: [{ model: Drip_whatsapp_native, attributes: ['id', 'interaction'] }],
							},
						],
						require: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, user_group_camp_list] = await to(
			Campaign_user_group_mapping.findAll({
				where: {
					CampaignId: campaignId,
				},
				include: [
					{
						model: User_group,
						include: [
							{
								model: User,
								attributes: ['id'],
							},
						],
						attributes: ['id'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		// console.log('-----', learnerCount_);
		let learnerCount = 0;
		// This Can Change
		if (user_group_camp_list && user_group_camp_list.length > 0) {
			for (let userGroup of user_group_camp_list) {
				learnerCount = learnerCount + userGroup.User_group.Users.length;
			}
		}

		let finalData = campaign.convertToJSON();

		for (let dripcamp of finalData.Drip_camps) {
			[err, getCampaignAllData] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						CampaignId: campaignId,
						PostId: dripcamp.PostId,
						DripCampIndex: dripcamp.index,
					},
					include: [{ model: Assigned_post_to_user }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let isScheduled = getCampaignAllData.length;
			let isSent = 0;
			let isDelivered = 0;
			let isEngaged = 0;

			for (let data of getCampaignAllData) {
				let singleData = data.convertToJSON();

				if (singleData.dripType == 'Only WhatsApp') {
					if (singleData.readDate || singleData.clickExternalLink) {
						isSent++;
						isDelivered++;
						isEngaged++;
					} else if (singleData.deliveryDate) {
						isSent++;
						isDelivered++;
					} else if (singleData.isTriggered) {
						isSent++;
					}
				} else if (
					singleData.dripType == 'DripApp with sharing on WhatsApp' ||
					singleData.dripType == 'DripApp with sharing on Email'
				) {
					if (
						singleData.readDate ||
						singleData.Assigned_post_to_user.isDripClickAction ||
						singleData.Assigned_post_to_user.isLoadOnHome
					) {
						isSent++;
						isDelivered++;
						isEngaged++;
					} else if (
						singleData.deliveryDate
						// ||
						// (singleData.Assigned_post_to_user &&
						// 	singleData.Assigned_post_to_user.publishOn &&
						// 	moment().isSameOrAfter(singleData.Assigned_post_to_user.publishOn) &&
						// 	singleData.Assigned_post_to_user.isPublished)
					) {
						isSent++;
						isDelivered++;
					} else if (
						singleData.isTriggered &&
						singleData.Assigned_post_to_user &&
						singleData.Assigned_post_to_user.publishOn &&
						moment().isSameOrAfter(singleData.Assigned_post_to_user.publishOn) &&
						singleData.Assigned_post_to_user.isPublished
					) {
						isSent++;
					}
				} else if (singleData.dripType == 'Only DripApp' && singleData.Assigned_post_to_user) {
					if (singleData.Assigned_post_to_user.isDripClickAction || singleData.Assigned_post_to_user.isLoadOnHome) {
						isSent++;
						isDelivered++;
						isEngaged++;
					} else if (
						moment().isSameOrAfter(singleData.Assigned_post_to_user.publishOn) &&
						singleData.Assigned_post_to_user.isPublished
					) {
						isSent++;
						isDelivered++;
					}
				}
			}

			//Check This Post is First using in this Campaign Or Not
			// console.log("--dripcamp--", dripcamp);

			// [err, checkDripFirstTimeUse] = await to(
			// 	Campaign_drip_camp_mapping.findOne({
			// 		include: [
			// 			{
			// 				model: Drip_camp,
			// 				where: {
			// 					PostId: dripcamp.PostId,
			// 				},
			// 				attributes: ['id', 'PostId'],
			// 			},
			// 		],
			// 		order: [['createdAt', 'ASC']],
			// 	})
			// );
			// if (err) return ResponseError(res, err, 500, true);

			// if (checkDripFirstTimeUse && checkDripFirstTimeUse.CampaignId == campaignId) {
			// 	[err, unlistedLearnerPostData] = await to(
			// 		Assigned_post_to_user.findAll({
			// 			where: {
			// 				PostId: dripcamp.PostId,
			// 				UserId: null,
			// 				CampaignId: null,
			// 			},
			// 			include: [
			// 				{
			// 					model: Cookie,
			// 					required: true,
			// 					attributes: ['id'],
			// 				},
			// 			],
			// 			attributes: [
			// 				'id',
			// 				'CampaignId',
			// 				'UserId',
			// 				'PostId',
			// 				'CookieId',
			// 				'isDripClickAction',
			// 				'isLinkClick',
			// 				'isRead',
			// 			],
			// 		})
			// 	);
			// 	if (err) return ResponseError(res, err, 500, true);

			// 	if (unlistedLearnerPostData && unlistedLearnerPostData.length > 0) {
			// 		for (let data of unlistedLearnerPostData) {
			// 			finalData_ = data.convertToJSON();

			// 			if (finalData_.isDripClickAction == true) {
			// 				// dripSend = dripSend + 1;
			// 				isRead = isRead + 1;
			// 				isLinkClick = isLinkClick + 1;
			// 				isDripClickAction = isDripClickAction + 1;
			// 			} else if (finalData_.isLinkClick == true) {
			// 				// dripSend = dripSend + 1;
			// 				isRead = isRead + 1;
			// 				isLinkClick = isLinkClick + 1;
			// 			} else if (finalData_.isRead == true) {
			// 				// dripSend = dripSend + 1;
			// 				isRead = isRead + 1;
			// 			} else if (finalData_.isRead == false) {
			// 				// dripSend = dripSend + 1;
			// 			}
			// 		}
			// 	}
			// }
			payload = [
				{
					name: 'Drip Scheduled',
					value: parseInt(isScheduled),
				},
				{
					name: 'Drip Sent',
					value: parseInt(isSent),
				},
				{
					name: 'Drip Delivered',
					value: parseInt(isDelivered),
				},
				{
					name: 'Drip Engaged',
					value: parseInt(isEngaged),
				},
			];

			let payload2 = {
				drip_type: dripcamp.Post && dripcamp.Post.drip_type ? dripcamp.Post.drip_type : null,
				tempType: dripcamp.Post && dripcamp.Post.tempType ? dripcamp.Post.tempType : null,
				drip_name: dripcamp.dripName,
				status: dripcamp.status,
				interaction:
					dripcamp &&
					dripcamp.Post &&
					dripcamp.Post.Drip_whatsapp_natives &&
					dripcamp.Post.Drip_whatsapp_natives.length > 0 &&
					dripcamp.Post.Drip_whatsapp_natives[0].interaction
						? dripcamp.Post.Drip_whatsapp_natives[0].interaction
						: null,
			};
			let payload3 = {
				campaign_id: campaignId,
				drip_camp_id: dripcamp.id,
				post_id: dripcamp.PostId,
				drip_camp_Index: dripcamp.index,
			};
			let temp = {
				graphData: payload,
				dripPost: payload2,
				otherDetails: payload3,
			};
			dataToSend.push(temp);
		}

		let payload3 = {
			status: finalData.status,
			campaign_start_date: finalData.startDate,
			campaign_end_date: finalData.endDate,
		};

		dataToSend3.push(payload3);

		return ResponseSuccess(res, {
			data: dataToSend,
			learnerCount: learnerCount,
			campainData: dataToSend3,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripCampTitleByCampaignIdForAnalytics = getDripCampTitleByCampaignIdForAnalytics;

const getAllDripActivityByClientIdForAnalytics = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			clientId: parseInt(req.params.clientId),
		};

		const { error, value } = validationSchema.validate(payload);

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);
		const { clientId } = value;

		//Check Client Id Access
		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, campaign;
		// let clientId = parseInt(req.params.clientId);
		// let allSubChildClientIds = await getAllSubChildClientIds(clientId);
		// allSubChildClientIds.push(parseInt(clientId));
		let allSubChildClientIds = await getAllSubClientAndBranchAccountLists(clientId, false);

		let finalData_;
		let dataToSend = [];
		let dateArray = [];
		let count = 0;
		let mounthCount = req.params.months;
		let dripActivity = req.params.dripActivity;
		let campaignId = [];
		let postIds = [];

		if (allSubChildClientIds.length > 0) {
			// let query_ = `SELECT ARRAY ( Select id FROM "Campaigns" WHERE "ClientId" IN (${allSubChildClientIds.toString()}) );`;

			// [allCampaings] = await sequelize.query(query_);

			const query_ = `
				SELECT ARRAY (
					SELECT "id" FROM "Campaigns"
					WHERE "ClientId" IN (:allSubChildClientIds)
				);
			`;

			let allCampaings = await sequelize.query(query_, {
				replacements: { allSubChildClientIds }, // Safely binds the array
				type: sequelize.QueryTypes.SELECT,
			});
			campaignId = allCampaings[0].array;
		}

		//Get All PostId By Using ClientIds
		if (allSubChildClientIds.length > 0) {
			// let query_ = `SELECT ARRAY ( Select id FROM "Posts" WHERE "ClientId" IN (${allSubChildClientIds.toString()}) );`;

			// [allPosts] = await sequelize.query(query_);

			const query_ = `
			SELECT ARRAY (
				SELECT "id" FROM "Posts"
				WHERE "ClientId" IN (:allSubChildClientIds)
			);`;

			let allPosts = await sequelize.query(query_, {
				replacements: { allSubChildClientIds }, // Sequelize safely binds the array
				type: sequelize.QueryTypes.SELECT,
			});

			postIds = allPosts[0].array;
		}

		for (let dateCount = mounthCount; dateCount >= 0; dateCount--) {
			let selectedMonth = moment().subtract(dateCount, 'months');
			let firstDateOfselectedMonth = moment(selectedMonth).startOf('month').format('YYYY-MM-DD');
			let lastDateForselectedMonth = moment(selectedMonth).endOf('month').format('YYYY-MM-DD');
			dateArray.push({
				startDate: firstDateOfselectedMonth,
				endDate: lastDateForselectedMonth,
			});
		}

		for (let dateDetails of dateArray) {
			//For Other Type
			[err, dripSentDetails] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						dripType: ['Only WhatsApp', 'DripApp with sharing on WhatsApp', 'DripApp with sharing on Email'],
						CampaignId: campaignId,
						UserId: { [Op.ne]: null },
						PostId: { [Op.ne]: null },
						// [sequelize.Op.or]: {
						// 	readDate: {
						// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
						// 	},
						// 	deliveryDate: {
						// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
						// 	},
						// 	sentDate: {
						// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
						// 	},
						// 	publishOn: {
						// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
						// 	},
						// },
						publishOn: {
							[Op.between]: [dateDetails.startDate, dateDetails.endDate],
						},
						isTriggered: true,
						campaignPaused: false,
					},
					include: [{ model: Assigned_post_to_user, attributes: ['id', 'isDripClickAction', 'isLoadOnHome'] }],
					attributes: ['id', 'readDate', 'deliveryDate', 'sentDate', 'dripType', 'publishOn', 'isTriggered'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//For Only DripApp
			[err, dripSentDetailOnlyDrip] = await to(
				CampWhatsAppEmailDrip.findAll({
					where: {
						CampaignId: campaignId,
						UserId: { [Op.ne]: null },
						PostId: { [Op.ne]: null },
						campaignPaused: false,
						isTriggered: true,
						dripType: ['Only DripApp'],
					},
					include: [
						{
							model: Assigned_post_to_user,
							where: {
								isPublished: true,
								UserId: { [Op.ne]: null },
								PostId: { [Op.ne]: null },
								publishOn: {
									[Op.between]: [dateDetails.startDate, dateDetails.endDate],
								},
							},
							attributes: ['id', 'isRead', 'isLoadOnHome', 'UserId', 'PostId'],
							required: true,
						},
					],
					attributes: ['id', 'AssignedPostToUserId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let dripSend = 0;
			let dripDelivered = 0;
			let dripEngaged = 0;

			//For Other Type
			for (let data of dripSentDetails) {
				if (data.dripType === 'Only WhatsApp') {
					if (data.readDate) {
						dripEngaged++;
						dripDelivered++;
						dripSend++;
					} else if (data.deliveryDate) {
						dripDelivered++;
						dripSend++;
					} else if (data.sentDate || data.isTriggered) {
						dripSend++;
					}
				} else if (data.dripType === 'DripApp with sharing on WhatsApp') {
					if (
						data.readDate ||
						(data.Assigned_post_to_user &&
							(data.Assigned_post_to_user.isDripClickAction || data.Assigned_post_to_user.isLoadOnHome))
					) {
						dripEngaged++;
						dripDelivered++;
						dripSend++;
					} else if (data.deliveryDate) {
						dripDelivered++;
						dripSend++;
					} else if (data.sentDate || data.isTriggered) {
						dripSend++;
					}
				} else if (data.dripType === 'DripApp with sharing on Email') {
					if (
						data.readDate ||
						(data.Assigned_post_to_user &&
							(data.Assigned_post_to_user.isDripClickAction || data.Assigned_post_to_user.isLoadOnHome))
					) {
						dripEngaged++;
						dripDelivered++;
						dripSend++;
					} else if (data.deliveryDate) {
						dripDelivered++;
						dripSend++;
					} else if (data.sentDate || data.isTriggered) {
						dripSend++;
					}
				}
			}

			//For Only Drip App
			for (let data of dripSentDetailOnlyDrip) {
				if (
					data &&
					data.Assigned_post_to_user &&
					(data.Assigned_post_to_user.isRead || data.Assigned_post_to_user.isLoadOnHome)
				) {
					dripEngaged++;
					dripDelivered++;
					dripSend++;
				} else {
					dripSend++;
					dripDelivered++;
				}
			}
			let getmonth = moment(dateDetails.startDate, 'YYYY/MM/DD');
			let month = getmonth.format('MMM');
			let payload = {
				// dripScheduled: dripScheduled,
				dripSend: dripSend,
				dripDelivered: dripDelivered,
				dripEngaged: dripEngaged,
				month: month,
			};
			dataToSend.push(payload);
		}

		//For Type Drip Type One
		let dripTypes = [
			'Only DripApp',
			'DripApp with sharing on WhatsApp',
			'DripApp with sharing on Email',
			'Only WhatsApp',
		];
		let finalDripSendData = [];
		let data = [];
		for (let drip_type of dripTypes) {
			data = [];

			for (let dateDetails of dateArray) {
				if (dripActivity == 'Drip Sent') {
					if (drip_type == 'Only DripApp') {
						[err, count] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									isTriggered: true,
									campaignPaused: false,
								},
								include: [
									{
										model: Assigned_post_to_user,
										where: {
											publishOn: {
												[Op.between]: [dateDetails.startDate, dateDetails.endDate],
											},
											isPublished: true,
											UserId: { [Op.ne]: null },
											PostId: { [Op.ne]: null },
										},
										required: true,
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, count] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									// [sequelize.Op.or]: {
									// 	readDate: {
									// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									// 	},
									// 	deliveryDate: {
									// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									// 	},
									// 	sentDate: {
									// 		[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									// 	},
									// },
									publishOn: {
										[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									},
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									isTriggered: true,
									campaignPaused: false,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				} else if (dripActivity == 'Drip Delivered') {
					if (drip_type == 'Only DripApp') {
						[err, count] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									isTriggered: true,
									campaignPaused: false,
								},
								include: [
									{
										model: Assigned_post_to_user,
										where: {
											publishOn: {
												[Op.between]: [dateDetails.startDate, dateDetails.endDate],
											},
											isPublished: true,
											UserId: { [Op.ne]: null },
											PostId: { [Op.ne]: null },
										},
										required: true,
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, count_1] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									[sequelize.Op.or]: {
										readDate: {
											[Op.between]: [dateDetails.startDate, dateDetails.endDate],
										},
										deliveryDate: {
											[Op.between]: [dateDetails.startDate, dateDetails.endDate],
										},
									},
									isTriggered: true,
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									campaignPaused: false,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, count_2] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									readDate: {
										[Op.eq]: null,
									},
									deliveryDate: {
										[Op.eq]: null,
									},
									isTriggered: true,
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									campaignPaused: false,
								},
								include: [
									{
										model: Assigned_post_to_user,
										where: {
											publishOn: {
												[Op.between]: [dateDetails.startDate, dateDetails.endDate],
											},
											isPublished: true,
											UserId: { [Op.ne]: null },
											PostId: { [Op.ne]: null },
											[sequelize.Op.or]: {
												isLoadOnHome: true,
												isDripClickAction: true,
											},
										},
										required: true,
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						count = count_1 + count_2;
					}
				} else if (dripActivity == 'Drip Engaged') {
					if (drip_type == 'Only DripApp') {
						[err, count] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									isTriggered: true,
									campaignPaused: false,
								},
								include: [
									{
										model: Assigned_post_to_user,
										where: {
											publishOn: {
												[Op.between]: [dateDetails.startDate, dateDetails.endDate],
											},
											[sequelize.Op.or]: {
												isRead: true,
												isLoadOnHome: true,
											},
											isPublished: true,
											UserId: { [Op.ne]: null },
											PostId: { [Op.ne]: null },
										},
										required: true,
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					} else {
						[err, count_1] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									readDate: {
										[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									},
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									campaignPaused: false,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);

						[err, count_2] = await to(
							CampWhatsAppEmailDrip.count({
								where: {
									dripType: drip_type,
									CampaignId: campaignId,
									readDate: {
										[Op.eq]: null,
									},
									publishOn: {
										[Op.between]: [dateDetails.startDate, dateDetails.endDate],
									},
									UserId: { [Op.ne]: null },
									PostId: { [Op.ne]: null },
									campaignPaused: false,
									isTriggered: true,
								},
								include: [
									{
										model: Assigned_post_to_user,
										where: {
											[sequelize.Op.or]: {
												isDripClickAction: true,
												isLoadOnHome: true,
											},
											isPublished: true,
											publishOn: {
												[Op.between]: [dateDetails.startDate, dateDetails.endDate],
											},
										},
									},
								],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						count = count_1 + count_2;
					}
				}
				let getmonth = moment(dateDetails.startDate, 'YYYY/MM/DD');
				let month = getmonth.format('MMM');

				let payload = {
					value: count,
					name: month,
				};
				data.push(payload);
			}
			let payload_ = {
				name: drip_type,
				series: data,
			};

			finalDripSendData.push(payload_);
		}
		let totalArray = [];
		for (let dateDetails of dateArray) {
			let getmonth = moment(dateDetails.startDate, 'YYYY/MM/DD');
			let month = getmonth.format('MMM');
			let total = 0;
			for (let item of finalDripSendData) {
				for (let data of item.series) {
					if (data.name == month) {
						total = total + data.value;
					}
				}
			}
			let payload = {
				value: total,
				name: month,
			};
			totalArray.push(payload);
		}
		finalDripSendData.push({
			name: 'Total',
			series: totalArray,
		});

		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			vertical_graph_data: dataToSend,
			line_graph_data: finalDripSendData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};

module.exports.getAllDripActivityByClientIdForAnalytics = getAllDripActivityByClientIdForAnalytics;

//update Offline Taks All Data
const updateLearnerOfflineTaskAssetGrade = async function (req, res) {
	try {
		let details = req.body.details;
		let campaignId = req.body.data.campaign_id;
		let dripCampIndex = req.body.data.drip_camp_Index;
		let campDripId = req.body.data.drip_camp_id;
		let dripId = req.body.data.post_id;

		for (let leanrerGrade of details) {
			if (leanrerGrade && leanrerGrade.id) {
				if (leanrerGrade.grade == '' || leanrerGrade.grade == null) {
					leanrerGrade.grade = null;
				}
				[err, updateGrade] = await to(
					UserBriefFile.update(
						{ grade: leanrerGrade.grade },
						{
							where: {
								id: leanrerGrade.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		//Count For Grade and NonGrade
		[err, totalGradedableCount] = await to(
			UserBriefFile.count({
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: Assigned_post_to_user,
								where: {
									CampaignId: campaignId,
									DripCampIndex: dripCampIndex,
									PostId: dripId,
									submit: true,
								},
								required: true,
							},
						],
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		//Count For Grade and NonGrade
		[err, GradeCount] = await to(
			UserBriefFile.count({
				where: {
					grade: {
						[Op.ne]: null,
					},
				},
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: Assigned_post_to_user,

								where: {
									CampaignId: campaignId,
									DripCampIndex: dripCampIndex,
									PostId: dripId,
									submit: true,
								},
								required: true,
							},
						],
						required: true,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.UPDATE_SUCCESS,
			gradeCount: GradeCount,
			totalGradedableCount: totalGradedableCount,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateLearnerOfflineTaskAssetGrade = updateLearnerOfflineTaskAssetGrade;

const getCampaignDripData = async function (req, res) {
	try {
		const validationSchema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			dripCampId: Joi.number().integer().positive().required(),
			dripCampIndex: Joi.number().integer().positive().required(),
			postId: Joi.number().integer().positive().required(),
		});

		// Example usage
		const payload = {
			campaignId: req.body.campaign_id,
			dripCampId: req.body.drip_camp_id,
			dripCampIndex: req.body.drip_camp_Index,
			postId: req.body.post_id,
		};

		const { error, value } = validationSchema.validate(payload);
		if (error) {
			return ResponseError(res, error.details[0].message, 400, true);
		}

		const { campaignId, dripCampId, dripCampIndex, postId } = req.body;

		// let campaignId = req.body.campaign_id;
		// let dripCampId = req.body.drip_camp_id;
		// let dripCampIndex = req.body.drip_camp_Index;
		// let postId = req.body.post_id;
		let allData = [];
		[err, getQuestionData] = await to(
			Assigned_post_to_user.findAll({
				where: {
					PostId: postId,
					CampaignId: campaignId,
					DripCampIndex: dripCampIndex,
				},
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: DripUserOption,
								attributes: ['id', 'text', 'correctAns', 'userAnswer', 'selectedAns', 'sr_no', 'userSeq'],
							},
							{
								model: UserBriefFile,
								attributes: ['id', 'fileType', 'path', 'grade', 'fileName', 'fileSize', 'isTranscoding', 'thumbnail'],
							},
						],
					},
					{
						model: User,
						attributes: ['id', 'account_id'],
					},
				],
				order: [
					['UserId', 'ASC'],
					[{ model: DripUserQuestion }, 'id', 'ASC'],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getQuestionData && getQuestionData.length > 0) {
			// allData = getQuestionData;
			for (let allUser of getQuestionData) {
				let userDetail = allUser.convertToJSON();
				allData.push(userDetail);
			}
		}

		//Add Check Unlisted User Drip Data
		//Check This Post is First using in this Campaign Or Not

		// [err, checkDripFirstTimeUse] = await to(
		// 	Campaign_drip_camp_mapping.findOne({
		// 		include: [
		// 			{
		// 				model: Drip_camp,
		// 				where: {
		// 					PostId: postId,
		// 				},
		// 				attributes: ['id', 'PostId'],
		// 			},
		// 		],
		// 		order: [['createdAt', 'ASC']],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// if (checkDripFirstTimeUse && checkDripFirstTimeUse.CampaignId == campaignId) {
		// 	[err, unlistedLearnerPostData] = await to(
		// 		Assigned_post_to_user.findAll({
		// 			where: {
		// 				CampaignId: null,
		// 				PostId: postId,
		// 				CampaignId: null,
		// 			},
		// 			include: [
		// 				{
		// 					model: DripUserQuestion,
		// 					include: [
		// 						{
		// 							model: DripUserOption,
		// 						},
		// 					],
		// 				},
		// 				{
		// 					model: User,
		// 				},
		// 				{
		// 					model: Cookie,
		// 					required: true,
		// 					attributes: ['id'],
		// 				},
		// 			],
		// 		})
		// 	);
		// 	if (err) return ResponseError(res, err, 500, true);

		// 	if (unlistedLearnerPostData && unlistedLearnerPostData.length > 0) {
		// 		for (let allUser of unlistedLearnerPostData) {
		// 			let userDetail = allUser.convertToJSON();
		// 			let payload = {
		// 				fullName: 'Unidentified',
		// 			};

		// 			userDetail.User = payload;
		// 			allData.push(userDetail);
		// 		}
		// 	}
		// }

		return ResponseSuccess(res, {
			data: allData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCampaignDripData = getCampaignDripData;

const getTopperUserData = async function (req, res) {
	try {
		let allData = [];
		const accountId = req.body.userIds;
		[err, getUser] = await to(
			User.findAll({
				where: { account_id: accountId },
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
				attributes: ['id', 'local_user_id', 'account_id'],
			})
		);

		for (let allUser of getUser) {
			let userDetail = allUser.convertToJSON();
			[err, localUser] = await to(
				dbInstance[allUser.Market.db_name].User_master.findOne({
					where: {
						id: allUser.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser) {
				userDetail.fullName = localUser.first + ' ' + localUser.last;
			}
			allData.push(userDetail);
		}

		return ResponseSuccess(res, {
			data: allData,
		});
	} catch (error) {
		console.log('getTopperUserData error....', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTopperUserData = getTopperUserData;

const getCampaignDripDataForPWA = async function (req, res) {
	try {
		const schema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			dripCampId: Joi.number().integer().positive().required(),
			dripCampIndex: Joi.number().integer().positive().allow(0).required(),
			postId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			campaignId: req.body.campaign_id,
			dripCampId: req.body.drip_camp_id,
			dripCampIndex: req.body.drip_camp_Index,
			postId: req.body.post_id,
		});
		if (error) {
			return ResponseError(res, error.details[0].message, 400, true);
		}
		const { campaignId, dripCampId, dripCampIndex, postId } = value;

		// let campaignId = req.body.campaign_id;
		// let dripCampId = req.body.drip_camp_id;
		// let dripCampIndex = req.body.drip_camp_Index;
		// let postId = req.body.post_id;
		let allData = [];
		[err, getQuestionData] = await to(
			Assigned_post_to_user.findAll({
				where: {
					CampaignId: campaignId,
					PostId: postId,
					DripCampIndex: dripCampIndex,
				},
				include: [
					{
						model: DripUserQuestion,
						include: [
							{
								model: DripUserOption,
							},
							{
								model: UserBriefFile,
							},
						],
					},
				],
				order: [
					['id', 'ASC'],
					[{ model: DripUserQuestion }, 'id', 'ASC'],
					[DripUserQuestion, { model: DripUserOption }, 'id', 'ASC'],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getQuestionData && getQuestionData.length > 0) {
			for (let allUser of getQuestionData) {
				let userDetail = allUser.convertToJSON();
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
module.exports.getCampaignDripDataForPWA = getCampaignDripDataForPWA;

const transeferDripFlowToAnotherUser = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			roleId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
			dripFlowId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			clientId: req.body.clientId,
			roleId: req.body.roleId,
			userId: req.body.userId,
			dripFlowId: req.body.dripflowId,
		});

		if (error) {
			return ResponseError(res, error.details[0].message, 400, true);
		}

		const { clientId, roleId, userId, dripFlowId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.body.clientId);
		// let roleId = parseInt(req.body.roleId);
		// let userId = parseInt(req.body.userId);
		// let dripFlowId = parseInt(req.body.dripflowId);
		let dripFlowDetails;

		[err, dripFlowDetails] = await to(
			Campaign.update(
				{ UserId: userId, RoleId: roleId, ClientId: clientId },
				{
					where: {
						id: dripFlowId,
					},
				}
			)
		);

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, { message: MESSAGE.TRANSFER_DRIP_FLOW });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.transeferDripFlowToAnotherUser = transeferDripFlowToAnotherUser;

const checkConversationalFlowTags = async function (req, res) {
	try {
		//First Find Client Account
		//Then Find All Under Branch Accounts
		//Then Check Tag is Used or not in Conversational Flow

		let tags = req.body.tags.split(',');
		let clientId = req.params.clientId;

		let notCampaignId = req.body.CampaingId && req.body.CampaingId != null ? req.body.CampaingId : null;

		const response = await checkReserveFlowTags(clientId, tags, notCampaignId);
		if (!response) {
			return ResponseError(res, 'Something went wrong', 500, true);
		}
		return ResponseSuccess(res, response);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkConversationalFlowTags = checkConversationalFlowTags;

const runCampaignForTest = async function (req, res) {
	try {
		let campaignId = req.body.CampaignId;

		[err, campaignDetails] = await to(
			Campaign.findOne({
				where: { id: campaignId },
				include: [
					{
						model: Drip_camp,
						through: 'Campaign_drip_camp_mapping',
						where: {
							dripFlowType: 'Send a Drip',
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (!campaignDetails) {
			return ResponseError(res, 'Campaign not found', 404, true);
		}

		let campaignData = campaignDetails.convertToJSON();
		let drip_camps = campaignData.Drip_camps;

		delete campaignData.id;
		delete campaignData.createdAt;
		delete campaignData.updatedAt;

		campaignData.forTest = true;
		campaignData.status = 'Scheduled';
		campaignData.flowType = 'Campaign';
		campaignData.startRule = 'Start on date';
		campaignData.endDate = await getNextFiftineMinSlot();
		campaignData.startDate = moment(campaignData.endDate).subtract(15, 'minutes').format();
		campaignData.startAfter = 0;

		campaignData.title = '(Test) ' + campaignData.title;

		[err, newCampaign] = await to(Campaign.create(campaignData));
		if (err) return ResponseError(res, err, 500, true);

		if (!newCampaign) {
			return ResponseError(res, 'Campaign not created', 500, true);
		}
		const newCampaignId = newCampaign.id;

		if (drip_camps.length > 0) {
			for (let dripData of drip_camps) {
				delete dripData.id;
				delete dripData.createdAt;
				delete dripData.updatedAt;
				delete dripData.Campaign_drip_camp_mapping;

				dripData.dripTriggerDate = moment(new Date()).format();
				dripData.dripTriggerRule = 'Send on date';
				dripData.status = 'Scheduled';
				dripData.sendAfter = 0;
				dripData.within = 0;
				dripData.recurAnnually = false;
				dripData.dependencyDripIndex = null;
				dripData.userAction = null;
				dripData.actionType = null;
				dripData.actionTriggerRule = null;
				dripData.published = null;
				dripData.activityScoreType = null;
				dripData.tagsForAction = null;
				dripData.systemActionType = null;
				dripData.tagsForSystemAction = null;
				dripData.unAssignDayCount = null;
				dripData.dripActionEndDate = null;

				[err, newDrip] = await to(Drip_camp.create(dripData));
				if (err) return ResponseError(res, err, 500, true);

				if (!newDrip) {
					return ResponseError(res, 'Drip not created', 500, true);
				}
				const newDripId = newDrip.id;

				[err, campaignDripMapping] = await to(
					Campaign_drip_camp_mapping.create({
						CampaignId: newCampaignId,
						DripCampId: newDripId,
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		if (req.body.groupId) {
			[err, campaignUserGroupMapping] = await to(
				Campaign_user_group_mapping.create({
					UserGroupId: req.body.groupId,
					CampaignId: newCampaignId,
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (!campaignUserGroupMapping) {
				return ResponseError(res, 'Campaign User Group Mapping not created', 500, true);
			}
			await assignDripToLearnerByUsingCampaign(newCampaignId);
		} else if (req.body.UserId) {
			await assignDripToLearnerByUsingCampaign(newCampaignId, req.body.UserId);
		}
		//Assign Drip To Users By using Learner Group

		await flowScheduler(campaignData.flowType, true);
		//Send All Drips

		return ResponseSuccess(res, { message: MESSAGE.SENT_DRIPS });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.runCampaignForTest = runCampaignForTest;
