const {
	Op,
	Client,
	License,
	sequelize,
	VimeoCredential,
	DiwoVimeoCredential,
	ZoomAppDetail,
	ZoomUserToken,
	Drip_whatsapp_non_native,
	Post,
	Assigned_post_to_user,
	User_role_client_mapping,
	ZoomRegistration,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const schedule = require('node-schedule');
const Sequelize = require('sequelize');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const axios = require('axios');
const { createlog } = require('../services/log.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

const createZoomAppCredential = async function (req, res) {
	try {
		let err, create_zomm_app_credential, newLog;
		let zommAppcredentialDetails = req.body.zoomAppCredentialDetails;
		let type = req.query.type;

		zommAppcredentialDetails.UserId = req.user.id;

		if (type == 'drip') {
			[err, create_zomm_app_credential] = await to(ZoomAppDetail.create(zommAppcredentialDetails));
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Zoom App Credential `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					ZoomAppDetailId: create_zomm_app_credential.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: create_zomm_app_credential,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createZoomAppCredential = createZoomAppCredential;

const updateZoomAppCredential = async function (req, res) {
	try {
		let err, create_zomm_app_credential, newLog;
		let zommAppcredentialDetails = req.body.zoomAppCredentialDetails;
		let type = req.query.type;
		delete zommAppcredentialDetails.ClientId;
		if (type == 'drip') {
			[err, create_zomm_app_credential] = await to(
				ZoomAppDetail.update(zommAppcredentialDetails, {
					where: {
						id: zommAppcredentialDetails.id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Zoom App Credential `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					ZoomAppDetailId: create_zomm_app_credential.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: create_zomm_app_credential,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateZoomAppCredential = updateZoomAppCredential;

const getClientListOfWithoutZoomAppCredential = async function (req, res) {
	try {
		let err, clientList;
		let parentClientId = [req.params.clientId];
		let finalClientList = [];
		let type = req.query.type;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		let ClientsDetail;

		let count = 0;
		let maxCount = 0;

		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				include: [{ model: ZoomAppDetail, required: false }],
				attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (clientDetails?.ZoomAppDetails?.length == 0) {
			let data = clientDetails.convertToJSON();
			data.clientIdWithName = data.client_id + ' - ' + data.name;
			finalClientList.push(data);
		}

		[err, maxCount] = await to(Client.count());

		if (err) return ResponseError(res, err, 500, true);

		while (flag) {
			count++;
			[err, clientList] = await to(
				Client.findAll({
					where: {
						Associate_client_id: parentClientId,
					},
					include: [{ model: ZoomAppDetail, required: false }],
					attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientId = [];

			if (clientList.length > 0) {
				for (let client of clientList) {
					parentClientId.push(client.id);
					if (client?.ZoomAppDetails?.length == 0) {
						if ((type == 'drip' && client.DripAccess == true) || (type == 'diwo' && client.DiwoAccess == true)) {
							let data = client.convertToJSON();
							data.clientIdWithName = data.client_id + ' - ' + data.name;
							finalClientList.push(data);
						}
					}
				}
			} else {
				flag = false;
			}

			if (count > maxCount) {
				flag = false;
			}
		}

		return ResponseSuccess(res, {
			data: finalClientList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientListOfWithoutZoomAppCredential = getClientListOfWithoutZoomAppCredential;

const getAllZoomAppCredential = async function (req, res) {
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

		let err, clientList;
		let parentClientId = [clientId];
		let finalClientList = [];
		let type = req.query.type;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		let ClientsDetail;

		let count = 0;
		let maxCount = 0;

		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				include: [{ model: ZoomAppDetail, required: false }],
				attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (clientDetails?.ZoomAppDetails?.length == 1) {
			let data = clientDetails.convertToJSON();
			finalClientList.push(data);
		}

		[err, maxCount] = await to(Client.count());

		if (err) return ResponseError(res, err, 500, true);

		while (flag) {
			count++;
			[err, clientList] = await to(
				Client.findAll({
					where: {
						Associate_client_id: parentClientId,
					},
					include: [{ model: ZoomAppDetail, required: false }],
					attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientId = [];

			if (clientList.length > 0) {
				for (let client of clientList) {
					parentClientId.push(client.id);
					if (client?.ZoomAppDetails?.length == 1) {
						if ((type == 'drip' && client.DripAccess == true) || (type == 'diwo' && client.DiwoAccess == true)) {
							let data = client.convertToJSON();
							finalClientList.push(data);
						}
					}
				}
			} else {
				flag = false;
			}

			if (count > maxCount) {
				flag = false;
			}
		}

		return ResponseSuccess(res, {
			data: finalClientList,
			count: finalClientList.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllZoomAppCredential = getAllZoomAppCredential;

const getZoomRedirectURL = async function (req, res) {
	try {
		let clientId = req.params.clientId;
		let apiHost = encodeURIComponent(req.body.host + '/zoom/callback');
		//Check User's client have zoon app details or not

		const zoomAppDetails = await getZoomAppCredential(clientId);

		if (!zoomAppDetails) {
			return ResponseSuccess(res, { error: MESSAGE.ZOOM_APP_NOT_FOUND });
		}

		let userDetails = encodeURI(
			JSON.stringify({
				UserId: req.user.id,
				ClientId: clientId,
				RoleId: req.user.RoleId,
				redirectURL: req.body.host + '/zoom/callback',
			})
		);

		let redirectUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomAppDetails.zoom_client_id}&redirect_uri=${apiHost}&state=${userDetails}`;

		return ResponseSuccess(res, {
			redirectUrl: redirectUrl,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getZoomRedirectURL = getZoomRedirectURL;

const zoomCallBack = async function (req, res) {
	try {
		console.log('---------------------zoomCallBack------------------------', req.query);
		console.log('---------------------zoomCallBack------------------------', JSON.parse(decodeURI(req.query.state)));

		//need to zoom app details by using clientId
		let details = JSON.parse(decodeURI(req.query.state));

		const zoomAppDetails = await getZoomAppCredential(details.ClientId);

		if (!zoomAppDetails) {
			return ResponseError(res, MESSAGE.ZOOM_APP_NOT_FOUND, 404, true);
		}

		try {
			// How to get Access Token
			const authCode = req.query.code;

			const response = await axios.post('https://zoom.us/oauth/token', null, {
				params: {
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: details.redirectURL,
				},
				auth: {
					username: zoomAppDetails.zoom_client_id,
					password: zoomAppDetails.zoom_client_secret_id,
				},
			});
			details = { ...details, ...response.data };
			console.log('---details---', details);

			//First Check Client Account have Zoom User Token or not
			[err, checkAlreadyExist] = await to(ZoomUserToken.findOne({ where: { ClientId: details.ClientId } }));
			if (err) return ResponseError(res, err, 500, true);

			if (checkAlreadyExist) {
				[err, saveUserToken] = await to(ZoomUserToken.update(details, { where: { ClientId: details.ClientId } }));
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, saveUserToken] = await to(ZoomUserToken.create(details));
				if (err) return ResponseError(res, err, 500, true);
			}

			// setTimeout(async () => {
			// 	let response_ = await axios.post('https://zoom.us/oauth/token', null, {
			// 		params: {
			// 			grant_type: 'refresh_token',
			// 			refresh_token: response.data.refresh_token,
			// 		},
			// 		auth: {
			// 			username: CLIENT_ID,
			// 			password: CLIENT_SECRET,
			// 		},
			// 	});
			// 	console.log('---Refresh access_token--', response_.data.access_token);
			// 	console.log('---Refresh refresh_token--', response_.data.refresh_token);
			// 	console.log('---Refresh scope--', response_.data.scope);
			// }, 5000);

			res.redirect(CONFIG.drip_web_host);
		} catch (error) {
			console.log('-error---------------------', error);
		}
	} catch (error) {
		console.log('---error--', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.zoomCallBack = zoomCallBack;

const getZoomAppCredential = async function (ClientId) {
	try {
		[err, zoomAppDetails] = await to(
			ZoomAppDetail.findOne({
				where: {
					ClientId: ClientId,
				},
				attributes: ['id', 'zoom_client_id', 'zoom_client_secret_id', 'ClientId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (zoomAppDetails) {
			return zoomAppDetails.convertToJSON();
		} else {
			//get Zoom App data from Neosap Account
			[err, zoomAppDetails] = await to(
				ZoomAppDetail.findOne({
					where: {
						ClientId: 1,
					},
					attributes: ['id', 'zoom_client_id', 'zoom_client_secret_id', 'ClientId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (zoomAppDetails) {
				return zoomAppDetails.convertToJSON();
			} else {
				return null;
			}
		}
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
	}
};

const getZoomUserToken = async function (ClientId) {
	try {
		let err, zoonUserToken;

		[err, zoonUserToken] = await to(
			ZoomUserToken.findOne({
				where: {
					ClientId: ClientId,
				},
				attributes: ['id', 'access_token', 'refresh_token', 'ClientId'],
			})
		);
		if (err) {
			console.log('---->Error when getting Zoom User Token<--12--', err);
			return null;
		}

		if (zoonUserToken) {
			return zoonUserToken.convertToJSON();
		}

		//If Not Found then get Client Account Token
		//First need to Find Client Accoun of the Current Branch Account
		let flag = true;
		let count = 0;
		let maxCount;

		[err, maxCount] = await to(Client.count());
		if (err) {
			console.log('---->Error when getting Client Count<----', err);
			return null;
		}

		while (flag) {
			count++;
			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: ClientId,
					},
					attributes: ['id', 'Associate_client_id', 'category'],
				})
			);
			if (err) {
				console.log('---->Error when getting Client Details<----', err);
				return null;
			}

			if (clientDetails) {
				if (clientDetails.category == 'Branch Account') {
					ClientId = clientDetails.Associate_client_id;
				} else if (clientDetails.category == 'Client Account') {
					ClientId = clientDetails.id;
					flag = false;
				} else {
					ClientId = null;
					flag = false;
				}
			} else {
				ClientId = null;
				flag = false;
			}
		}

		if (ClientId) {
			[err, zoonUserToken] = await to(
				ZoomUserToken.findOne({
					where: {
						ClientId: ClientId,
					},
					attributes: ['id', 'access_token', 'refresh_token', 'ClientId'],
				})
			);
			if (err) {
				console.log('---->Error when getting Zoom User Token<----', err);
				return null;
			}
			if (zoonUserToken) {
				return zoonUserToken.convertToJSON();
			} else {
				return null;
			}
		} else {
			return null;
		}
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
	}
};

const checkValidZoomMeeting = async function (meeting, access_token) {
	try {
		let currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
		let isValidMeeting = false;
		let requiredRegistration = true;
		let requiredRegistrationData = {};
		//If Meeting is Recurring then need to check next meeting
		//Need to get Next All Meetings
		let meetingDetail = await axios.get(`https://api.zoom.us/v2/meetings/${meeting.id}`, {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		//Meeting is Live or not
		if (meeting.start_time && moment(meeting.start_time).isSameOrAfter(currentDateTime)) {
			isValidMeeting = true;
		} else if (meetingDetail?.data?.occurrences?.length > 0) {
			for (let occurrence of meetingDetail.data.occurrences) {
				if (moment(occurrence.start_time).isSameOrAfter(currentDateTime)) {
					isValidMeeting = true;
					break;
				}
			}
		}

		//Check Registor Type
		//approval_type = 0 => Automatically approve
		//approval_type = 1 => Manually approve
		//approval_type = 2 => No registration required

		if (meetingDetail?.data?.settings?.approval_type == 2) {
			requiredRegistration = false;
		} else {
			//Get Resgistration Required Data By Using Meeting Id
			let meetingRegistrationDetail = await axios.get(
				`https://api.zoom.us/v2/meetings/${meeting.id}/registrants/questions`,
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				}
			);

			if (meetingRegistrationDetail?.data) {
				requiredRegistrationData = meetingRegistrationDetail.data;
			}
		}

		return [isValidMeeting, requiredRegistration, requiredRegistrationData];
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
		return [false, true, {}];
	}
};

const checkZoomMeetingList = async function (req, res) {
	try {
		//Get User Access Token and Zoom App Credential
		let clientId = parseInt(req.params.clientId);
		let zoomUserToken = await getZoomUserToken(clientId);
		let access_token = zoomUserToken.access_token;
		let zoomMeetingList = req.body.meetingList;
		let withOutRegistrationZoomMeeting = [];
		let withRegistrationZoomMeeting = [];

		if (zoomMeetingList && zoomMeetingList.length > 0) {
			for (let meeting of zoomMeetingList) {
				let isValid, requiredRegistration;
				[isValid, requiredRegistration, requiredRegistrationData] = await checkValidZoomMeeting(meeting, access_token);
				if (isValid) {
					if (Object.keys(requiredRegistrationData).length > 0) {
						meeting.registrationData = requiredRegistrationData;
					}
					if (requiredRegistration) {
						withRegistrationZoomMeeting.push(meeting);
					} else {
						withOutRegistrationZoomMeeting.push(meeting);
					}
				}
			}
			return ResponseSuccess(res, {
				data: {
					withOutRegistrationZoomMeeting: withOutRegistrationZoomMeeting,
					withRegistrationZoomMeeting: withRegistrationZoomMeeting,
				},
			});
		} else {
			return ResponseSuccess(res, {
				data: {
					withOutRegistrationZoomMeeting: [],
					withRegistrationZoomMeeting: [],
				},
			});
		}
	} catch (error) {
		console.log('----error when check Zoom Meetin gList----', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkZoomMeetingList = checkZoomMeetingList;

const getListOfZoomMeeting = async function (req, res) {
	try {
		let err, updateZoomUserToken, response;

		// Validate request parameters
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Learner ClientId and User ClientId
		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		let zoomUserToken = await getZoomUserToken(clientId);
		let access_token;
		if (!zoomUserToken) {
			return ResponseSuccess(res, {
				data: {
					meetings: [],
				},
			});
		}
		//Need Find Zoom App Client Id
		let zoomAppDetails = await getZoomAppCredential(clientId);

		if (!zoomAppDetails) {
			return ResponseSuccess(res, {
				data: {
					meetings: [],
					error: MESSAGE.ZOOM_APP_NOT_FOUND,
				},
			});
		}

		//Get new Access Token by using Refresh Token
		response = await axios.post('https://zoom.us/oauth/token', null, {
			params: {
				grant_type: 'refresh_token',
				refresh_token: zoomUserToken.refresh_token,
			},
			auth: {
				username: zoomAppDetails.zoom_client_id,
				password: zoomAppDetails.zoom_client_secret_id,
			},
		});

		if (response.data.error) {
			return ResponseSuccess(res, {
				data: {
					meetings: [],
					error: 'Something went wrong',
				},
			});
		}

		if (response.data && response.data.access_token && response.data.refresh_token) {
			access_token = response.data.access_token;
			//Update on the DataBase
			[err, updateZoomUserToken] = await to(
				ZoomUserToken.update(response.data, {
					where: {
						id: zoomUserToken.id,
					},
				})
			);
			if (err) {
				return ResponseError(res, err, 500, true);
			}
		}

		//Ge Meeting List
		if (access_token) {
			//Get All Active Zoom Meeting
			const meetings = await getAllActiveZoomMeeting(access_token);

			return ResponseSuccess(res, {
				data: {
					meetings: meetings,
				},
			});
		} else {
			return ResponseSuccess(res, {
				data: {
					meetings: [],
					error: 'Sonthing went wrong',
				},
			});
		}
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getListOfZoomMeeting = getListOfZoomMeeting;

const getAllActiveZoomMeeting = async function (access_token) {
	try {
		let allMeetingList = [];
		let flag = true;
		let count = 0;
		let maxLoop = 0;
		let next_page_token = '';
		let page_number = 1;
		let page_size = 100;
		let meetingType = 'upcoming_meetings';
		while (flag) {
			count++;
			let zoomURL = ``;
			if (page_number > 1 && next_page_token != '') {
				zoomURL = `https://api.zoom.us/v2/users/me/meetings?page_size=${page_size}&type=${meetingType}&page_number=${page_number}&next_page_token=${next_page_token}`;
			} else {
				zoomURL = `https://api.zoom.us/v2/users/me/meetings?page_size=${page_size}&type=${meetingType}`;
			}
			let meetings = await axios.get(zoomURL, {
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			});

			if (meetings && meetings.data) {
				if (maxLoop == 0 && meetings.data.total_records > page_size) {
					maxLoop = Math.ceil(meetings.data.total_records / page_size);
				}
				if (meetings.data && meetings.data.meetings && meetings.data.meetings.length > 0) {
					for (let meeting of meetings.data.meetings) {
						allMeetingList.push(meeting);
					}
				}
				if (meetings?.data?.total_records > allMeetingList.length) {
					if (meetings.data && meetings.data.next_page_token) {
						//Get Next Page Token
						next_page_token = meetings.data.next_page_token;
						page_number++;
					} else {
						flag = false;
					}
				} else {
					flag = false;
				}
			} else {
				flag = false;
			}
			if (count > maxLoop) {
				flag = false;
			}
		}
		return allMeetingList;
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
		return false;
	}
};
module.exports.getAllActiveZoomMeeting = getAllActiveZoomMeeting;

const registerUserIntoZoomMeeting = async function (AssignedPostToUserId, userRegisterData) {
	try {
		let meetingId;
		let meetingLink;

		[err, assignedPostToUser] = await to(
			Assigned_post_to_user.findOne({
				where: { id: AssignedPostToUserId },
				include: [
					{
						model: Post,
						include: [{ model: Drip_whatsapp_non_native, attributes: ['id', 'zoomMeetLink', 'ZoomMeetId'] }],
						attributes: ['id'],
					},
				],
				attributes: ['id', 'UserId', 'PostId', 'CampaignId'],
			})
		);
		if (err) {
			console.log('----error when getting Error App Credential----', err);
			return false;
		}

		if (assignedPostToUser) {
			meetingId = assignedPostToUser.Post.Drip_whatsapp_non_natives[0].ZoomMeetId;
			meetingLink = assignedPostToUser.Post.Drip_whatsapp_non_natives[0].zoomMeetLink;

			if (userRegisterData?.length > 0) {
				let payload = {
					custom_questions: [],
				};
				for (let user of userRegisterData) {
					if (user.zoomLinkTo === 'First Name') {
						payload['first_name'] = user.surveyNote;
					} else if (user.zoomLinkTo === 'Last Name') {
						payload['last_name'] = user.surveyNote;
					} else if (user.zoomLinkTo === 'Email') {
						payload['email'] = user.surveyNote;
					} else if (user.zoomLinkTo === 'Address') {
						payload['address'] = user.surveyNote;
					} else if (user.zoomLinkTo === 'Phone') {
						payload['phone'] = user.surveyNote;
					} else if (user.zoomLinkTo === 'Questions And Comments') {
						payload['comments'] = user.surveyNote;
					} else {
						//Other Questions
						payload.custom_questions.push({ title: user.zoomLinkTo, value: user.surveyNote });
					}
				}

				[err, userClient] = await to(
					User_role_client_mapping.findOne({ where: { UserId: assignedPostToUser.UserId, RoleId: 1 } })
				);
				if (err) {
					console.log('----error when getting Error App Credential----', err);
					return false;
				}

				if (userClient) {
					//Need to Get Zoom App Credential
					let zoomAppDetails = await getZoomAppCredential(userClient.ClientId);
					if (!zoomAppDetails) {
						console.log('------Zoom App Not Found-------', userClient.ClientId);
						return false;
					}

					console.log('------userClient.ClientId-------', userClient.ClientId);
					//Get Zoom User Token
					let zoomUserToken = await getZoomUserToken(userClient.ClientId);
					if (!zoomUserToken) {
						console.log('------User Token Not Found-------', userClient.ClientId);
						return false;
					}
					//Get new Access Token by using Refresh Token
					let response = await axios.post('https://zoom.us/oauth/token', null, {
						params: {
							grant_type: 'refresh_token',
							refresh_token: zoomUserToken.refresh_token,
						},
						auth: {
							username: zoomAppDetails.zoom_client_id,
							password: zoomAppDetails.zoom_client_secret_id,
						},
					});
					if (response.data.error) {
						console.log('----response.data.error---refresh_token-', response.data.error);
						return false;
					}
					if (response.data && response.data.access_token && response.data.refresh_token) {
						access_token = response.data.access_token;
						//Update on the DataBase
						[err, updateZoomUserToken] = await to(
							ZoomUserToken.update(response.data, {
								where: {
									id: zoomUserToken.id,
								},
							})
						);
						if (err) {
							console.log('----error when getting Error App Credential----', err);
							console.log('---4---');

							return false;
						}
					}

					//Register User into Zoom Meeting
					let registerUser = await axios.post(`https://api.zoom.us/v2/meetings/${meetingId}/registrants`, payload, {
						headers: {
							Authorization: `Bearer ${access_token}`,
						},
					});

					if (registerUser.data && registerUser.data.id) {
						let payload = registerUser.data;
						payload.zoomMeetId = payload.id;
						delete payload.id;
						payload.UserId = assignedPostToUser.UserId;
						payload.PostId = assignedPostToUser.PostId;
						payload.CampaignId = assignedPostToUser.CampaignId;
						payload.AssignedPostToUserId = AssignedPostToUserId;

						[err, addRegistration] = await to(ZoomRegistration.create(payload));
						if (err) {
							console.log('----error when getting Error App Credential----', err);
							return false;
						}
						// return addRegistration.convertToJSON();
						return true;
					}
				}
			}
		} else {
			return false;
		}
	} catch (error) {
		console.log('----error when getting Error App Credential----', error);
		return false;
	}
};
module.exports.registerUserIntoZoomMeeting = registerUserIntoZoomMeeting;

const getZoomSignInDetailsByClientId = async function (req, res) {
	try {
		const clientId = parseInt(req.params.clientId);
		let zoomAppDetails = await getZoomAppCredential(clientId);
		if (!zoomAppDetails) {
			return ResponseSuccess(res, { message: MESSAGE.ZOOM_APP_NOT_FOUND, zoomAppNotFound: true });
		}
		[err, zoomUserToken] = await to(
			ZoomUserToken.findOne({
				where: {
					ClientId: clientId,
				},
				attributes: ['id', 'access_token', 'refresh_token', 'ClientId'],
			})
		);

		if (err) {
			return ResponseError(res, err, 500, true);
		}
		return ResponseSuccess(res, {
			data: zoomUserToken,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getZoomSignInDetailsByClientId = getZoomSignInDetailsByClientId;

const revokeZoomSignIn = async function (req, res) {
	try {
		let id = parseInt(req.params.id);

		[err, deleteZoomUserToken] = await to(ZoomUserToken.destroy({ where: { id: id } }));
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			message: 'Revoke Zoom Sign In Successfully.',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.revokeZoomSignIn = revokeZoomSignIn;

const zoomWebhook = async function (req, res) {
	try {
		if (req?.body) {
			console.log('---------------------zoomWebhook------------------------', req.body);
		}
		return ResponseSuccess(res);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.zoomWebhook = zoomWebhook;
