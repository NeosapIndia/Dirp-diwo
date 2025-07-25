const {
	Op,
	License,
	sequelize,
	Client,
	User,
	Market,
	VimeoCredential,
	DiwoVimeoCredential,
	MediaCMSUploadQueue,
	DiwoAsset,
	SessionAsset,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const schedule = require('node-schedule');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const axios = require('axios');

const { createlog } = require('../services/log.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const config_feature = require('../config/SiteConfig.json');

const {
	mediaCMSVideoTranscodingStatus,
	getClientVimeoTokenService,
	getDiwoClientVimeoTokenService,
} = require('../services/vimeo.service');

const getVimeoUserIdFromUrl = async function (url) {
	const parts = url.split('/');
	return parts.at(-1);
};
const si = require('systeminformation');

const FormData = require('form-data');
const fs = require('fs');
let imagePath = 'uploads/assets/';
let documentPath = 'uploads/document/';
let isMediaCMSUploadInProgress = false;

const createvimeoCredential = async function (req, res) {
	try {
		let err, create_vimeo_credential;
		let vimeo_credentialDetails = req.body.vimeoCredentialDetails;
		let payload, payload2;
		let type = req.user.type;

		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}
		let schema;
		if (config_feature?.configurable_feature?.vimeo) {
			schema = Joi.object({
				vimeoUserId: Joi.number().integer().positive().required(),
				vimeoClientId: Joi.string().trim().required(),
				clientId: Joi.number().integer().positive().required(),
				vimeoToken: Joi.string().trim().required(),
				vimeoClientSecretKey: Joi.string().trim().required(),
				id: Joi.number().integer().positive().allow(null).required(),
				CMSPassword: Joi.string().trim().allow(null).required(),
				CMSUserName: Joi.string().trim().allow(null).required(),
			});
		} else if (config_feature?.configurable_feature?.mediaCMS) {
			schema = Joi.object({
				vimeoUserId: Joi.number().integer().positive().allow(null).required(),
				vimeoClientId: Joi.string().trim().allow(null).required(),
				clientId: Joi.number().integer().positive().required(),
				vimeoToken: Joi.string().trim().allow(null).required(),
				vimeoClientSecretKey: Joi.string().trim().allow(null).required(),
				id: Joi.number().integer().positive().allow(null).required(),
				CMSPassword: Joi.string().trim().required(),
				CMSUserName: Joi.string().trim().required(),
			});
		}
		const { error, value } = schema.validate(vimeo_credentialDetails);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);
		vimeo_credentialDetails = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, vimeo_credentialDetails.clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		if (vimeo_credentialDetails) {
			if (config_feature?.configurable_feature?.vimeo) {
				payload = {
					vUserId: vimeo_credentialDetails.vimeoUserId,
					vClientId: vimeo_credentialDetails.vimeoClientId,
					ClientId: vimeo_credentialDetails.clientId,
					vToken: vimeo_credentialDetails.vimeoToken,
					vClientSecKey: vimeo_credentialDetails.vimeoClientSecretKey,
				};
			} else if (config_feature?.configurable_feature?.mediaCMS) {
				payload = {
					CMSUserName: vimeo_credentialDetails.CMSUserName,
					CMSPassword: vimeo_credentialDetails.CMSPassword,
					ClientId: vimeo_credentialDetails.clientId,
				};
			}
		}
		if (type == 'drip') {
			[err, create_vimeo_credential] = await to(VimeoCredential.create(payload));
			if (err) return ResponseError(res, err, 500, true);

			// Update in to Client
			[err, client] = await to(
				Client.update(
					{
						VimeoCredentialId: create_vimeo_credential.id,
					},
					{
						where: {
							id: vimeo_credentialDetails.clientId,
						},
					}
				)
			);

			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, create_vimeo_credential] = await to(DiwoVimeoCredential.create(payload));
			if (err) return ResponseError(res, err, 500, true);

			// Update in to Client
			[err, client] = await to(
				Client.update(
					{
						DiwoVimeoCredentialId: create_vimeo_credential.id,
					},
					{
						where: {
							id: vimeo_credentialDetails.clientId,
						},
					}
				)
			);

			if (err) return ResponseError(res, err, 500, true);
		}

		//Create Folder on Vimeo
		if (create_vimeo_credential && config_feature?.configurable_feature?.vimeo) {
			let response = await createClientFolderId(payload, type);

			if (response != null) {
				let folderId = await getVimeoUserIdFromUrl(response.data.uri);
				if (type == 'drip') {
					payload2 = {
						folderId: folderId,
					};
				} else if (type == 'diwo') {
					payload2 = {
						DiwoFolderId: folderId,
					};
				}
				if (folderId) {
					[err, update_clientFolderId] = await to(
						Client.update(payload2, {
							where: {
								id: client.id,
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}

			let response_2 = await createPresetForVimeo(create_vimeo_credential, type);
			if (response_2?.data) {
				if (type == 'drip') {
					[err, updatePresets] = await to(
						VimeoCredential.update(
							{
								presetId: response_2.data.uri.replace('/presets/', ''),
								presetName: response_2.data.name,
							},
							{
								where: {
									id: create_vimeo_credential.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo') {
					[err, updatePresets] = await to(
						DiwoVimeoCredential.update(
							{
								presetId: response_2.data.uri.replace('/presets/', ''),
								presetName: response_2.data.name,
							},
							{
								where: {
									id: create_vimeo_credential.id,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		} else if (create_vimeo_credential && config_feature?.configurable_feature?.mediaCMS) {
			//Create a Playlist on MediaCMS
			const playlistId = await createMediaCamPlaylist(payload, type);
			if (type == 'drip' && playlistId) {
				[err, updatePlayListId] = await to(
					VimeoCredential.update(
						{
							CMSPlaylistId: playlistId,
							playListCount: 1,
						},
						{
							where: {
								id: create_vimeo_credential.id,
							},
						}
					)
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo' && playlistId) {
				[err, updatePlayListId] = await to(
					DiwoVimeoCredential.update(
						{
							CMSPlaylistId: playlistId,
							playListCount: 1,
						},
						{
							where: {
								id: create_vimeo_credential.id,
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
				`Create Vimeo Credential `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					VimeoCredentialId: create_vimeo_credential.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: create_vimeo_credential,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createvimeoCredential = createvimeoCredential;

const updatevimeoCredential = async function (req, res) {
	try {
		let err, update_vimeo_credential;
		// let vimeo_credentialDetails = req.body.vimeoCredentialDetails;
		let VimeoCredentialId = parseInt(req.params.vimeoCredentialId);
		let payload;
		let beforUpdate;
		let type = req.user.type;

		let schema;
		if (config_feature?.configurable_feature?.vimeo) {
			schema = Joi.object({
				vimeoUserId: Joi.number().integer().positive().required(),
				vimeoClientId: Joi.string().trim().required(),
				clientId: Joi.number().integer().positive().required(),
				vimeoToken: Joi.string().trim().required(),
				vimeoClientSecretKey: Joi.string().trim().required(),
				id: Joi.number().integer().positive().allow(null).required(),
				CMSPassword: Joi.string().trim().allow(null).required(),
				CMSUserName: Joi.string().trim().allow(null).required(),
			});
		} else if (config_feature?.configurable_feature?.mediaCMS) {
			schema = Joi.object({
				vimeoUserId: Joi.number().integer().positive().allow(null).required(),
				vimeoClientId: Joi.string().trim().allow(null).required(),
				clientId: Joi.number().integer().positive().required(),
				vimeoToken: Joi.string().trim().allow(null).required(),
				vimeoClientSecretKey: Joi.string().trim().allow(null).required(),
				id: Joi.number().integer().positive().allow(null).required(),
				CMSPassword: Joi.string().trim().required(),
				CMSUserName: Joi.string().trim().required(),
			});
		}
		const { error, value } = schema.validate(req.body.vimeoCredentialDetails);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);
		vimeo_credentialDetails = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, vimeo_credentialDetails.clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}
		if (vimeo_credentialDetails) {
			if (config_feature?.configurable_feature?.vimeo) {
				payload = {
					vUserId: vimeo_credentialDetails.vimeoUserId,
					vClientId: vimeo_credentialDetails.vimeoClientId,
					ClientId: vimeo_credentialDetails.clientId,
					vToken: vimeo_credentialDetails.vimeoToken,
					vClientSecKey: vimeo_credentialDetails.vimeoClientSecretKey,
				};
			} else if (config_feature?.configurable_feature?.mediaCMS) {
				payload = {
					CMSUserName: vimeo_credentialDetails.CMSUserName,
					CMSPassword: vimeo_credentialDetails.CMSPassword,
					ClientId: vimeo_credentialDetails.clientId,
				};
			}
		}

		if (type == 'drip') {
			[err, beforUpdate] = await to(
				VimeoCredential.findOne({
					where: {
						id: VimeoCredentialId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, update_vimeo_credential] = await to(
				VimeoCredential.update(payload, {
					where: {
						id: VimeoCredentialId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, beforUpdate] = await to(
				DiwoVimeoCredential.findOne({
					where: {
						id: VimeoCredentialId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, update_vimeo_credential] = await to(
				DiwoVimeoCredential.update(payload, {
					where: {
						id: VimeoCredentialId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, clientDetails] = await to(
			Client.findOne({
				where: {
					id: vimeo_credentialDetails.clientId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (
			config_feature?.configurable_feature?.vimeo &&
			clientDetails &&
			(clientDetails.folderId == null ||
				clientDetails.DiwoFolderId == null ||
				beforUpdate.vUserId != payload.vUserId ||
				beforUpdate.vClientId != payload.vClientId)
		) {
			if (payload) {
				let response = await createClientFolderId(payload, type);

				if (response != null) {
					let folderId = await getVimeoUserIdFromUrl(response.data.uri);
					let payload2;
					if (type == 'drip') {
						payload2 = {
							folderId: folderId,
						};
					} else if (type == 'diwo') {
						payload2 = {
							DiwoFolderId: folderId,
						};
					}
					if (folderId) {
						[err, update_clientFolderId] = await to(
							Client.update(payload2, {
								where: {
									id: clientDetails.id,
								},
							})
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}

				let response_2 = await createPresetForVimeo(payload, type);
				if (response_2?.data) {
					if (type == 'drip') {
						[err, updatePresets] = await to(
							VimeoCredential.update(
								{
									presetId: response_2.data.uri.replace('/presets/', ''),
									presetName: response_2.data.name,
								},
								{
									where: {
										id: VimeoCredentialId,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					} else if (type == 'diwo') {
						[err, updatePresets] = await to(
							DiwoVimeoCredential.update(
								{
									presetId: response_2.data.uri.replace('/presets/', ''),
									presetName: response_2.data.name,
								},
								{
									where: {
										id: VimeoCredentialId,
									},
								}
							)
						);
						if (err) return ResponseError(res, err, 500, true);
					}
				}
			}
		} else if (config_feature?.configurable_feature?.mediaCMS) {
			if (
				payload &&
				(beforUpdate.CMSPlaylistId == null ||
					beforUpdate.CMSUserName != payload.CMSUserName ||
					beforUpdate.CMSPassword != payload.CMSPassword)
			) {
				//Create a Playlist on MediaCMS
				const playlistId = await createMediaCamPlaylist(payload, type);

				if (type == 'drip' && playlistId) {
					[err, updatePlayListId] = await to(
						VimeoCredential.update(
							{
								CMSPlaylistId: playlistId,
								playListCount: 1,
							},
							{
								where: {
									id: VimeoCredentialId,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				} else if (type == 'diwo' && playlistId) {
					[err, updatePlayListId] = await to(
						DiwoVimeoCredential.update(
							{
								CMSPlaylistId: playlistId,
								playListCount: 1,
							},
							{
								where: {
									id: VimeoCredentialId,
								},
							}
						)
					);
					if (err) return ResponseError(res, err, 500, true);
				}
			}
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Vimeo Credential `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					VimeoCredentialId: VimeoCredentialId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: update_vimeo_credential,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updatevimeoCredential = updatevimeoCredential;

const createClientFolderId = async function (vimeoData, type) {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${vimeoData.vToken}`,
			},
		};

		[err, client] = await to(
			Client.findOne({
				where: {
					id: vimeoData.ClientId,
				},
			})
		);
		let payload = {
			name: env + '-' + type + '-' + client.client_id,
		};

		const response = await axios.post(
			`${CONFIG.create_video_folder_on_vimeo}/${vimeoData.vUserId}/projects`,
			payload,
			config
		);

		return response;
	} catch (error) {
		console.log('----error--', error);
	}
};
module.exports.createClientFolderId = createClientFolderId;

const createMediaCamPlaylist = async function (payload, type) {
	try {
		const [err, client] = await to(
			Client.findOne({
				where: { id: payload.ClientId },
				attributes: ['id', 'client_id'],
			})
		);

		if (err) {
			console.error('Error fetching client:', err);
			return null;
		}

		if (!client) {
			console.warn('Client not found for ID:', payload.ClientId);
			return null;
		}

		const name = `${env}-${type}-${client.client_id}-${payload?.playListCount ? payload.playListCount : 1}`;

		const response = await axios.post(
			`${CONFIG.media_cms_url}/api/v1/playlists/`,
			{
				title: name,
				description: '',
				is_public: true,
			},
			{
				auth: {
					username: payload.CMSUserName,
					password: payload.CMSPassword,
				},
			}
		);

		if (!response?.data?.url) {
			console.warn('Playlist creation failed. No URL returned.');
			return null;
		}

		// Extract and return the playlist ID from the URL
		return response.data.url.replace('/playlists/', '');
	} catch (error) {
		console.error('Error in createMediaCamPlaylist:', error.message);
		return null;
	}
};
module.exports.createMediaCamPlaylist = createMediaCamPlaylist;

const createPresetForVimeo = async function (vimeoData, type) {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${vimeoData.vToken}`,
			},
		};
		let payload = {
			'embed.buttons.embed': false,
			'embed.buttons.fullscreen': true,
			'embed.buttons.hd': false,
			'embed.buttons.like': false,
			'embed.buttons.scaling': false,
			'embed.buttons.share': false,
			'embed.buttons.watchlater': false,
			'embed.color': '#f2f2f2',
			'embed.logos.custom.active': false,
			'embed.logos.custom.sticky': false,
			'embed.logos.vimeo': false,
			'embed.playbar': true,
			'embed.title.name': 'hide',
			'embed.title.owner': 'hide',
			'embed.title.portrait': 'hide',
			'embed.volume': true,
			'embed.picture_in_picture': false,
			'embed.colors.color_four': '#f2f2f2',
			name: env + '-' + type + '-preset-' + client.client_id,
		};

		const response = await axios.post(
			`https://api.vimeo.com/users/${vimeoData.vUserId}/presets`,
			new URLSearchParams(payload),
			config
		);
		return response;
	} catch (error) {
		console.log('----error--', error);
	}
};
module.exports.createPresetForVimeo = createPresetForVimeo;

const getClientListOfWithoutVimeoCredential = async function (req, res) {
	try {
		let err, clientList;
		let parentClientId = req.params.clientId;
		let finalClientList = [];
		let type = req.query.type;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		let ClientsDetail;

		childClientId.push(parentClientId);

		[err, parentClient] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				attributes: [
					'id',
					'client_id',
					'name',
					'Associate_client_id',
					'VimeoCredentialId',
					'DiwoVimeoCredentialId',
					'details',
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (type == 'drip') {
			if (
				parentClient &&
				(!parentClient.VimeoCredentialId ||
					parentClient.VimeoCredentialId == null ||
					parentClient.VimeoCredentialId == '')
			) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalClientList.push(client);
			}
		} else if (type == 'diwo') {
			if (
				parentClient &&
				(!parentClient.DiwoVimeoCredentialId ||
					parentClient.DiwoVimeoCredentialId == null ||
					parentClient.DiwoVimeoCredentialId == '')
			) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalClientList.push(client);
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

			if (type == 'drip') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							is_deleted: false,
							Associate_client_id: childClientId,
							DripAccess: true,
						},
						attributes: [
							'id',
							'client_id',
							'name',
							'Associate_client_id',
							'VimeoCredentialId',
							'DiwoVimeoCredentialId',
							'details',
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							is_deleted: false,
							Associate_client_id: childClientId,
							DiwoAccess: true,
						},
						attributes: [
							'id',
							'client_id',
							'name',
							'Associate_client_id',
							'VimeoCredentialId',
							'DiwoVimeoCredentialId',
							'details',
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				if (type == 'drip') {
					if (
						client_ &&
						(!client_.VimeoCredentialId || client_.VimeoCredentialId == null || client_.VimeoCredentialId == '')
					) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalClientList.push(client_);
					}
				} else if (type == 'diwo') {
					if (
						client_ &&
						(!client_.DiwoVimeoCredentialId ||
							client_.DiwoVimeoCredentialId == null ||
							client_.DiwoVimeoCredentialId == '')
					) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalClientList.push(client_);
					}
				}
			}

			if (childClientId.length <= 0) {
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
module.exports.getClientListOfWithoutVimeoCredential = getClientListOfWithoutVimeoCredential;

const paginate = function (array, page_size, page_number) {
	return array.slice((page_number - 1) * page_size, page_number * page_size);
};

const getAllVideoCredential = async function (req, res) {
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

		let parentClientId = clientId;
		let err, client;
		let childClientId = [];
		let ClientsDetail;
		let flag = true;
		const type = req.user.type;

		childClientId.push(parentClientId);
		let finalArray = [];

		let offset = (page - 1) * limit;
		let response;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		[err, parentClient] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				attributes: [
					'id',
					'client_id',
					'name',
					'Associate_client_id',
					'VimeoCredentialId',
					'DiwoVimeoCredentialId',
					'details',
				],
				include: [
					{
						model: VimeoCredential,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (type == 'drip') {
			if (parentClient.VimeoCredentialId != null && parentClient.VimeoCredential) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalArray.push(client);
			}
		} else if (type == 'diwo') {
			if (parentClient.DiwoVimeoCredentialId != null && parentClient.DiwoVimeoCredential) {
				let client = parentClient.convertToJSON();
				client.clientIdWithName = client.client_id + ' - ' + client.name;
				finalArray.push(client);
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
			let ClientsDetail;
			if (type == 'drip') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							is_deleted: false,
							Associate_client_id: childClientId,
						},
						attributes: [
							'id',
							'client_id',
							'name',
							'Associate_client_id',
							'VimeoCredentialId',
							'DiwoVimeoCredentialId',
							'details',
						],
						include: [
							{
								model: VimeoCredential,
							},
						],
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, ClientsDetail] = await to(
					Client.findAll({
						where: {
							is_deleted: false,
							Associate_client_id: childClientId,
						},
						attributes: [
							'id',
							'client_id',
							'name',
							'Associate_client_id',
							'VimeoCredentialId',
							'DiwoVimeoCredentialId',
							'details',
						],
						include: [
							{
								model: DiwoVimeoCredential,
							},
						],
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();

				if (type == 'drip') {
					if (client_ && client_.VimeoCredentialId && client_.VimeoCredential) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalArray.push(client_);
					}
				} else if (type == 'diwo') {
					if (client_ && client_.DiwoVimeoCredentialId && client_.DiwoVimeoCredential) {
						client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
						finalArray.push(client_);
					}
				}
			}

			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		response = paginate(finalArray, limit, page);
		return ResponseSuccess(res, {
			data: response,
			count: finalArray.length,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllVideoCredential = getAllVideoCredential;

const deleteVimeoCredentail = async function (req, res) {
	try {
		let err;
		let clientId = req.params.clientId;
		let vimeoId = req.body;

		let type = req.query.type;
		if (type == 'drip') {
			[err, asset] = await to(
				VimeoCredential.destroy({
					where: {
						id: vimeoId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, asset] = await to(
				DiwoVimeoCredential.destroy({
					where: {
						id: vimeoId,
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
				`Delete Vimeo Credential `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					VimeoCredentialId: vimeoId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// let notifcationMessage = `${assetId.length} Vimeo Deleted Successfully.`;
		// await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		return ResponseSuccess(res, {
			message: MESSAGE.VIMEO_CREDENTIALS_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteVimeoCredentail = deleteVimeoCredentail;

////////////////////////////MEDIA CMS TRANSCODING  STATUS////////////////////////////

const getDripMediaCMSTranscodingStatus = async function (req, res) {
	try {
		schema = Joi.object({
			cmsVideoId: Joi.array().items(Joi.string()).required(),
			credentailId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			cmsVideoId: req.body.cmsVideoId,
			credentailId: req.body.credentailId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { cmsVideoId, credentailId } = value;

		let err, CredentialDetail;

		let type = req.user.type;

		if (type == 'drip') {
			[err, CredentialDetail] = await to(
				VimeoCredential.findOne({
					where: {
						id: credentailId,
					},
					attributes: ['id', 'CMSUserName', 'CMSPassword'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, CredentialDetail] = await to(
				DiwoVimeoCredential.findOne({
					where: {
						id: credentailId,
					},
					attributes: ['id', 'CMSUserName', 'CMSPassword'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (CredentialDetail) {
			let credential_detail = CredentialDetail.convertToJSON();

			const checkStatus = await mediaCMSVideoTranscodingStatus(credential_detail, cmsVideoId);

			return ResponseSuccess(res, {
				data: checkStatus,
			});
		} else {
			return ResponseError(res, { message: MESSAGE.MEDIA_CMS_VIDEO_CREDENTAIL_NOT_FOUND }, 400);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDripMediaCMSTranscodingStatus = getDripMediaCMSTranscodingStatus;

const getDiwoMediaCMSTranscodingStatus = async function (req, res) {
	try {
		schema = Joi.object({
			queueIds: Joi.array().items(Joi.any()).required(),
		});

		const { error, value } = schema.validate({
			queueIds: req.body.MediaCMSUploadQueueIds,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { queueIds } = value;

		let err, queueItem;
		let videoData = [];

		let type = req.user.type;

		if (type == 'drip') {
		} else if (type == 'diwo') {
			[err, queueItem] = await to(
				MediaCMSUploadQueue.findAll({
					where: {
						id: queueIds,
					},
					order: [['id', 'ASC']],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			if (queueItem && queueItem.length > 0) {
				for (let item of queueItem) {
					videoData.push({
						MediaCMSUploadQueueId: item.id,
						isTranscoding: item.isTranscoding,
						path: item.path,
						cmsVideoId: item.cmsVideoId,
						MediaUploadStatus: item.status,
					});
				}
			}
		}

		return ResponseSuccess(res, {
			data: videoData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoMediaCMSTranscodingStatus = getDiwoMediaCMSTranscodingStatus;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////      MediaCMS    ////////////////////////////////////////////////////////////

// Upload Video on MediaCMS Assets
const uploadDripVideoOnMediacms = async function (req, res) {
	try {
		// Validate clientId
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		console.log('-----------clientId-----', clientId);
		console.log('-----------req.user.ClientId-----', req.user.ClientId);

		if (!config_feature?.configurable_feature?.mediaCMS) {
			return ResponseError(res, { message: MESSAGE.MEDIA_CMS_DISABLED }, 400);
		}

		let type = req.user.type;
		let cmscredential;

		// Get CMS credentials
		if (type == 'drip') {
			cmscredential = await getClientVimeoTokenService(clientId);
		} else if (type == 'diwo') {
			cmscredential = await getDiwoClientVimeoTokenService(clientId);
		}
		if (!cmscredential) {
			return ResponseError(res, { message: MESSAGE.CMS_CREDENTIAL_NOT_FOUND }, 500);
		}

		// Prepare form data
		const videoFile = req.files?.Video?.[0];
		if (!videoFile) {
			return ResponseError(res, { message: MESSAGE.VIDEO_FILE_NOT_FOUND }, 500);
		}

		const path = `${CONFIG.imagePath}${imagePath + videoFile.filename}`;
		const formData = new FormData();
		formData.append('media_file', fs.createReadStream(path));
		formData.append('description', req.body.description || '');
		formData.append('title', req.body.title || '');

		// Upload video to MediaCMS
		const response = await axios.post(`${CONFIG.media_cms_url}/api/v1/media`, formData, {
			auth: {
				username: cmscredential.CMSUserName,
				password: cmscredential.CMSPassword,
			},
		});

		if (response.status !== 201) {
			return ResponseError(res, { message: MESSAGE.ASSETS_CREATED }, 400);
		}

		// Clean up uploaded file
		fs.unlink(path, (err) => {
			if (err) console.error('Error deleting file:', err);
		});

		// Add video to playlist
		const videoId = response.data.friendly_token;
		const playlistResponse = await addVideoIntoThePlaylist(cmscredential, videoId, type);

		if (!playlistResponse) {
			return ResponseError(res, { message: MESSAGE.PLAYLIST_UPDATE_FAILED }, 500);
		}

		// Return success response
		return ResponseSuccess(res, {
			data: { ...videoFile, videoId },
		});
	} catch (error) {
		console.error('Error in uploadVideoOnMediacms:', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadDripVideoOnMediacms = uploadDripVideoOnMediacms;

////////////////////////////////////////////////////////////////////////////
///////////////////////     DIWO MEDIA CMS //////////////////////////////////

// Upload Diwo Video on MediaCMS Assets
const uploadDiwoVideoOnMediacms = async function (req, res) {
	try {
		// Validate clientId
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		console.log('-----------clientId-----', clientId);
		console.log('-----------req.user.ClientId-----', req.user.ClientId);

		console.log('-----------req.body-----', req.body);

		if (!config_feature?.configurable_feature?.mediaCMS) {
			return ResponseError(res, { message: MESSAGE.MEDIA_CMS_DISABLED }, 400);
		}

		let type = req.user.type;
		let cmscredential;

		// Get CMS credentials
		if (type == 'diwo') {
			cmscredential = await getDiwoClientVimeoTokenService(clientId);
		}

		if (!cmscredential) {
			return ResponseError(res, { message: MESSAGE.CMS_CREDENTIAL_NOT_FOUND }, 500);
		}

		// Prepare form data
		const videoFile = req.files?.Video?.[0];
		if (!videoFile) {
			return ResponseError(res, { message: MESSAGE.VIDEO_FILE_NOT_FOUND }, 500);
		}

		let videoPath;
		let originalname;
		let mediaCMSAsset;

		if (req.files && req.files.Video && req.files.Video.length > 0) {
			originalname = req.files.Video[0].originalname;
			videoPath = `${CONFIG.imagePath}${imagePath + req.files.Video[0].filename}`;
		}

		let payload = {
			fileName: originalname,
			filePath: videoPath,
			status: 'queued',
			UserId: req.user.id,
			ClientId: req.user.ClientId,
			isUploaded: false,
			isTranscoding: false,
			isUploadError: false,
			isTransodingError: false,
			ErrorMessage: null,
		};

		[err, mediaCMSAsset] = await to(MediaCMSUploadQueue.create(payload));
		if (err) return ResponseError(res, err, 500, true);

		let MediaCMSUploadQueueId = mediaCMSAsset.id;
		let videoId = null;

		// Return success response
		return ResponseSuccess(res, {
			data: { ...videoFile, videoId, MediaCMSUploadQueueId },
		});
	} catch (error) {
		console.error('-------Error in upload Video OnMediacms---------', error);
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadDiwoVideoOnMediacms = uploadDiwoVideoOnMediacms;

///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// MEDIA CMS Scheduler /////////////////////////////////////////

if (config_feature?.configurable_feature?.mediaCMS) {
	let mediaCMS_Upload_schedulor = schedule.scheduleJob(
		CONFIG.mediacms_upload_schedulor_config,
		async function (fireDate) {
			console.log('--<<<<<<<<<<------Run Scheduler---->>>------Media CMS Upload Schedular------', fireDate);

			console.log(
				'//////////////////////////////////////--isMediaCMSUploadInProgress--/////////////////////////////',
				isMediaCMSUploadInProgress
			);

			if (isMediaCMSUploadInProgress) {
				console.log(
					'---------------------------------------------------------------------------------------------------------------------------'
				);
				console.log('--------Media CMS Video Upload is already in progress. Skipping this Schedular run.------');
				console.log(
					'---------------------------------------------------------------------------------------------------------------------------'
				);
				return;
			}
			await UploadMediaCMSVideo();
		}
	);
	module.exports.mediaCMS_Upload_schedulor = mediaCMS_Upload_schedulor;
} else {
	console.log('-------------MEDIA CMS Scheduler is disabled.------------');
}

const UploadMediaCMSVideo = async function () {
	try {
		if (isMediaCMSUploadInProgress) {
			console.log('------Another upload is in progress. Skipping this run.------');
			return;
		}

		isMediaCMSUploadInProgress = true;

		console.log(
			'---------Checking MediaCMS upload queue isMediaCMSUploadInProgress-----------',
			isMediaCMSUploadInProgress
		);
		console.log('---------Checking MediaCMS upload queue-----------');

		let err,
			queueItem,
			uploadingStatusUpdate,
			uploadingFileStatus,
			diskFullStatus,
			updateMediaDetail,
			updateMediaTranscodingDetail;

		[err, queueItem] = await to(
			MediaCMSUploadQueue.findOne({
				where: {
					status: 'queued',
					isUploaded: false,
					isUploading: false,
					isTranscoding: false,
					retryCount: {
						[Op.lt]: 3,
					},
				},
				order: [['id', 'ASC']],
			})
		);

		if (err || !queueItem) {
			if (err) {
				console.log('-----Error While Getting MediaCMS Detail in Upload Que---------------', err);
			}
			isMediaCMSUploadInProgress = false;
			return null;
		}

		console.log('------Uploading video---------', queueItem.id);

		[err, uploadingStatusUpdate] = await to(
			MediaCMSUploadQueue.update(
				{ status: 'processing', isUploading: true },
				{
					where: {
						id: queueItem.id,
					},
				}
			)
		);

		if (err) {
			console.error('------Error While Marking as Uploading------', err);
			isMediaCMSUploadInProgress = false;
			return null;
		}

		if (!fs.existsSync(queueItem.filePath)) {
			let filePayload = {
				status: 'failed',
				isUploadError: true,
				isUploading: false,
				errorMessage: 'File not found on disk',
				retryCount: queueItem.retryCount + 1,
			};

			[err, uploadingFileStatus] = await to(
				MediaCMSUploadQueue.update(filePayload, {
					where: {
						id: queueItem.id,
					},
				})
			);

			if (err) {
				console.log('------Error While Updating File Not Found Error in Queue------', err);
			}

			isMediaCMSUploadInProgress = false;
			return null;
		}

		let diskSpace = await hasSufficientDiskSpace();

		const diskUsagePercent = Number(diskSpace.Disk_usage_in_percentage);

		if (diskUsagePercent >= parseInt(CONFIG.video_upload_disk_threshold)) {
			let diskFullPayload = {
				status: 'disk_full',
				isUploadError: true,
				isUploading: false,
				retryCount: queueItem.retryCount + 1,
				errorMessage: 'Insufficient disk space',
			};

			[err, diskFullStatus] = await to(
				MediaCMSUploadQueue.update(diskFullPayload, {
					where: {
						id: queueItem.id,
					},
				})
			);

			if (err) {
				console.log('------Error While Updating Disk Full Error in Queue------', err);
			}

			console.log('----Disk full. Skipping processing for-------', queueItem.fileName);
			isMediaCMSUploadInProgress = false;
			return null;
		}

		try {
			let cmscredential;
			let type = 'diwo';

			if (type == 'diwo') {
				cmscredential = await getDiwoClientVimeoTokenService(queueItem.ClientId);
			}

			if (!cmscredential) {
				let credentialMissingPayload = {
					status: 'failed',
					isUploadError: true,
					isUploading: false,
					errorMessage: 'CMS Credentials missing',
					retryCount: queueItem.retryCount + 1,
				};

				[err, updateMediaDetail] = await to(
					MediaCMSUploadQueue.update(credentialMissingPayload, {
						where: {
							id: queueItem.id,
						},
					})
				);

				if (err) {
					console.error('------Error While Updating CMS Credential Missing Error in Queue------', err);
				}
				isMediaCMSUploadInProgress = false;
				return null;
			}

			const formData = new FormData();
			formData.append('media_file', fs.createReadStream(queueItem.filePath));
			formData.append('title', queueItem.fileName);
			formData.append('description', queueItem.fileName);

			let uploadMediaCMSURL = `${CONFIG.media_cms_url}/api/v1/media`;

			console.log('--->>>-->>>  MediaCMS upload URL---', uploadMediaCMSURL);

			const response = await axios.post(uploadMediaCMSURL, formData, {
				auth: {
					username: cmscredential.CMSUserName,
					password: cmscredential.CMSPassword,
				},
				headers: formData.getHeaders(),
			});

			if (response.status === 201) {
				const videoId = response.data.friendly_token;
				const transcodingResponse = await waitForTranscoding(cmscredential, videoId);
				console.log(`----Transcoding status for ${videoId}: ${transcodingResponse ? 'Success' : 'Failed'}----`);

				if (!transcodingResponse) {
					let notTranscodePayload = {
						status: 'failed',
						isTranscodingError: true,
						isTranscoding: false,
						isUploading: false,
						errorMessage: 'Transcoding timeout or failed',
						retryCount: queueItem.retryCount + 1,
						cmsVideoId: videoId,
					};

					[err, updateMediaTranscodingDetail] = await to(
						MediaCMSUploadQueue.update(notTranscodePayload, {
							where: {
								id: queueItem.id,
							},
						})
					);

					if (err) {
						console.error('------Error While Updating Transcoding Failure------', err);
					}

					await updateDiwoAssetsWithMediaCMSData(queueItem.id, videoId, false, null, type);

					isMediaCMSUploadInProgress = false;
					return null;
				} else {
					let updateSuccess = {
						status: 'completed',
						isUploading: false,
						isTranscoding: true,
						isUploadError: false,
						isUploaded: true,
						path: transcodingResponse.path,
						cmsVideoId: transcodingResponse.cmsVideoId,
					};

					[err, updateFinalDetail] = await to(
						MediaCMSUploadQueue.update(updateSuccess, {
							where: {
								id: queueItem.id,
							},
						})
					);

					if (err) {
						console.error('------Error While Finalizing Success Update------', err);
					}

					const playlistResponse = await addVideoIntoThePlaylist(cmscredential, videoId, type);

					if (!playlistResponse) {
						let uploadPlaylistFailPayload = {
							status: 'failed',
							isUploadError: true,
							isUploading: false,
							errorMessage: 'failed adding to playlist',
							retryCount: queueItem.retryCount + 1,
						};

						[err, updateMediaDetail] = await to(
							MediaCMSUploadQueue.update(uploadPlaylistFailPayload, {
								where: {
									id: queueItem.id,
								},
							})
						);

						if (err) {
							console.error('------Error While Media CMS Video Fail Into Playlist while in Queue------', err);
						}
					}

					await updateDiwoAssetsWithMediaCMSData(
						queueItem.id,
						transcodingResponse.cmsVideoId,
						true,
						transcodingResponse.path,
						type
					);

					isMediaCMSUploadInProgress = false;
					return null;
				}
			} else {
				let uploadFailPayload = {
					status: 'queued',
					isUploadError: false,
					isUploading: false,
					errorMessage: '',
					retryCount: queueItem.retryCount + 1,
				};

				if (queueItem.retryCount + 1 == 3) {
					uploadFailPayload.status = 'failed';
					uploadFailPayload.isUploadError = true;
					uploadFailPayload.isUploading = false;
					uploadFailPayload.errorMessage = 'Upload failed';
				}

				[err, updateMediaDetail] = await to(
					MediaCMSUploadQueue.update(uploadFailPayload, {
						where: {
							id: queueItem.id,
						},
					})
				);

				if (err) {
					console.error('------Error While Updating Uploaded Media CMS Video Fail while in Queue------', err);
				}
				isMediaCMSUploadInProgress = false;
				return null;
			}
		} catch (error) {
			console.error('------Upload failed------', error);
			let uploadFailPayload_1 = {
				status: 'queued',
				isUploadError: false,
				isUploading: false,
				errorMessage: '',
				retryCount: queueItem.retryCount + 1,
			};

			if (queueItem.retryCount + 1 == 3) {
				uploadFailPayload_1.status = 'failed';
				uploadFailPayload_1.isUploadError = true;
				uploadFailPayload_1.isUploading = false;
				uploadFailPayload_1.errorMessage = 'Upload failed';
			}

			[err, updateMediaDetail] = await to(
				MediaCMSUploadQueue.update(uploadFailPayload_1, {
					where: {
						id: queueItem.id,
					},
				})
			);

			if (err) {
				console.error('------Error While Updating Uploaded Media CMS Video Fail while in Queue------', err);
			}
			isMediaCMSUploadInProgress = false;
			return null;
		}
	} catch (error) {
		console.error('Error in addVideoIntoThePlaylist:', error);
		isMediaCMSUploadInProgress = false;
		return null;
	}
};

const waitForTranscoding = async function (cmscredential, videoId, maxTries = 30, intervalMs = 15000) {
	let tries = 0;

	return new Promise((resolve) => {
		const interval = setInterval(async () => {
			tries++;

			console.log(`----------------------------------------------------`);
			console.log(`------[Media CMS Transcoding Attempt ${tries}]------`);
			console.log(`----------------------------------------------------`);

			try {
				const auth = {
					username: cmscredential.CMSUserName,
					password: cmscredential.CMSPassword,
				};

				const url = `${CONFIG.media_cms_url}/api/v1/media/${videoId}`;

				console.log(`----------------------------------------------------`);
				console.log('--->>>-->>>  MediaCMS video transcoding status URL <<<<<--', url);
				console.log(`----------------------------------------------------`);

				const response = await axios.get(url, { auth });
				console.log('--->>>-->>>  MediaCMS video transcoding status:', response.data.encoding_status);

				if (response?.data?.encoding_status === 'success') {
					console.log('--->>>-->>>  MediaCMS video transcoding successful for videoId:', videoId);

					if (response?.data?.hls_info?.master_file) {
						const videoDetail = {
							isTranscoding: true,
							path: `${CONFIG.media_cms_url}${response.data.hls_info.master_file}`,
							cmsVideoId: videoId,
						};

						clearInterval(interval);
						console.log(`----------------------------------------------------`);
						console.log(`----Media CMS Transcoding Done For ${videoId}----`);
						console.log(`----------------------------------------------------`);

						resolve(videoDetail);
					} else {
						// File not yet generated
						console.log(`----Master file not found yet for ${videoId}----`);
						clearInterval(interval);
						resolve(null);
					}
				} else {
					console.log(`----------------------------------------------------`);
					console.log(`----Media CMS Video ${videoId} still processing...----`);
					console.log(`----------------------------------------------------`);

					if (tries >= maxTries) {
						clearInterval(interval);
						resolve(null);
					}
				}
			} catch (err) {
				clearInterval(interval);
				console.error('----Error checking Media CMS transcoding status----', err);
				resolve(null);
			}
		}, intervalMs);
	});
};

const hasSufficientDiskSpace = async () => {
	try {
		const [disk] = await Promise.all([si.fsSize()]);

		let totalSpace = 0;
		let usedSpace = 0;
		let freeSpace = 0;

		disk.forEach((disk) => {
			totalSpace += disk.size;
			usedSpace += disk.used;
			freeSpace += disk.size - disk.used;
		});

		const usedPercentage = (usedSpace / totalSpace) * 100;

		const systemData = {
			Disk_usage_in_percentage: usedPercentage, //📀 Disk Usage (%)
			Disk_used: (usedSpace / 1024 ** 3).toFixed(2), //📀 Disk Use GB
			Disk_total_size: (totalSpace / 1024 ** 3).toFixed(2), // //📀 Totle Disk size in GB
		};

		return systemData;
	} catch (error) {
		console.error('------Error checking disk space----------', error);
		return false;
	}
};

const canUploadVideo = async function (req, res) {
	try {
		let diskSpace = await hasSufficientDiskSpace();

		const diskUsagePercent = Number(diskSpace.Disk_usage_in_percentage);

		if (diskUsagePercent >= parseInt(CONFIG.video_upload_disk_threshold)) {
			return ResponseSuccess(res, {
				canUpload: false,
				spaceUsed: diskUsagePercent,
			});
		} else {
			return ResponseSuccess(res, {
				canUpload: true,
				spaceUsed: diskUsagePercent,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.canUploadVideo = canUploadVideo;

const updateDiwoAssetsWithMediaCMSData = async function (MediaCMSUploadQueueId, videoId, isTranscoding, path, type) {
	try {
		if (type == 'drip') {
		} else if (type == 'diwo') {
			[err, MediaCMSItem] = await to(
				MediaCMSUploadQueue.findOne({
					where: {
						id: MediaCMSUploadQueueId,
					},
					attributes: ['id', 'cmsVideoId', 'isTranscoding', 'path', 'status'],
					order: [['id', 'ASC']],
				})
			);
			if (err) {
				console.log('-----Error While Getting MediaCMS Detail in DiwoAssets in Upload Que---------------', err);
			}

			let updatePayload = {
				cmsVideoId: MediaCMSItem.cmsVideoId,
				isTranscoding: MediaCMSItem.isTranscoding,
				path: MediaCMSItem.path,
				MediaUploadStatus: MediaCMSItem.status,
			};

			console.log('-updatePayload-', updatePayload);

			// Update DiwoAssets
			[err, updateDiwoAssetsCMS] = await to(
				DiwoAsset.update(updatePayload, {
					where: {
						MediaCMSUploadQueueId: MediaCMSUploadQueueId,
					},
				})
			);
			if (err) {
				console.log('-----Error While Updating MediaCMS Detail in DiwoAssets in Upload Que---------------', err);
			}

			// Update SessionAssets
			[err, updateSessionAssetsCMS] = await to(
				SessionAsset.update(updatePayload, {
					where: {
						MediaCMSUploadQueueId: MediaCMSUploadQueueId,
					},
				})
			);
			if (err) {
				console.log('-----Error While Updating MediaCMS Detail in SessionAssets in Upload Que---------------', err);
			}
		}

		return null;
	} catch (error) {
		console.log('-----Error While Updating MediaCMS Detail in Both Assets Table in Upload Que---------------', error);
		return false;
	}
};

////////////////////////////////////////////////////////////////
/////////////////////// Common for Drip and Diwo ///////////////////////

const addVideoIntoThePlaylist = async function (cmscredential, videoId, type) {
	try {
		if (!cmscredential?.CMSPlaylistId) {
			return null;
		}
		const response = await axios.put(
			`${CONFIG.media_cms_url}/api/v1/playlists/${cmscredential.CMSPlaylistId}`,
			{
				media_friendly_token: videoId,
				type: 'add',
			},
			{
				auth: {
					username: cmscredential.CMSUserName,
					password: cmscredential.CMSPassword,
				},
			}
		);
		updatePlayListCountAndCreateNewPlayList(cmscredential, type);
		return response.data;
	} catch (error) {
		console.error('---------Error in add Video Into The Playlist------------', error);
		return null;
	}
};
module.exports.addVideoIntoThePlaylist = addVideoIntoThePlaylist;

const updatePlayListCountAndCreateNewPlayList = async function (cmscredential, type) {
	try {
		let limit = 65;
		if (type == 'drip') {
			[err, updateCmsDetails] = await to(
				VimeoCredential.update(
					{ playListVideoCount: cmscredential.playListVideoCount + 1 },
					{
						where: {
							id: cmscredential.id,
						},
					}
				)
			);
			if (err) {
				console.log('-----Error---------------', err);
			}

			if (cmscredential.playListVideoCount + 1 >= limit) {
				//Creat New Playlist
				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							VimeoCredentialId: cmscredential.id,
						},
					})
				);
				if (clientDetails && cmscredential?.CMSUserName && cmscredential?.CMSPassword) {
					cmscredential.ClientId = clientDetails.id;
					cmscredential.playListCount = cmscredential.playListCount + 1;
					const playlistId = await createMediaCamPlaylist(cmscredential, type);
					if (playlistId) {
						[err, updateCmsDetails] = await to(
							VimeoCredential.update(
								{ playListCount: cmscredential.playListCount, CMSPlaylistId: playlistId, playListVideoCount: 0 },
								{
									where: {
										id: cmscredential.id,
									},
								}
							)
						);
						if (err) {
							console.log('-----Error---------------', err);
						}
					}
				}
			}
		} else if (type == 'diwo') {
			[err, updateCmsDetails] = await to(
				DiwoVimeoCredential.update(
					{ playListVideoCount: cmscredential.playListVideoCount + 1 },
					{
						where: {
							id: cmscredential.id,
						},
					}
				)
			);
			if (err) {
				console.log('-----Error---------------', err);
			}

			if (cmscredential.playListVideoCount + 1 >= limit) {
				//Creat New Playlist
				[err, clientDetails] = await to(
					Client.findOne({
						where: {
							DiwoVimeoCredentialId: cmscredential.id,
						},
					})
				);
				if (clientDetails && cmscredential?.CMSUserName && cmscredential?.CMSPassword) {
					cmscredential.ClientId = clientDetails.id;
					cmscredential.playListCount = cmscredential.playListCount + 1;
					const playlistId = await createMediaCamPlaylist(cmscredential, type);
					if (playlistId) {
						[err, updateCmsDetails] = await to(
							DiwoVimeoCredential.update(
								{ playListCount: cmscredential.playListCount, CMSPlaylistId: playlistId, playListVideoCount: 0 },
								{
									where: {
										id: cmscredential.id,
									},
								}
							)
						);
						if (err) {
							console.log('-----Error---------------', err);
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('--updatePlayListCountAndCreateNewPlayList---', error);
	}
};

///////////////////////// DELETE MEDIA CMS Physical File Schedular //////////////////////////

if (config_feature?.configurable_feature?.mediaCMS) {
	let mediaCMS_Delete_PhysicalFile_schedulor = schedule.scheduleJob(
		CONFIG.mediacms_delete_physicalfile_schedulor_config,
		async function (fireDate) {
			console.log(
				'--<<<<<<<<<<------Run Scheduler---->>>------Media CMS Delete Physical Files Schedular------',
				fireDate
			);
			await deleteMediaCMSUploadedPhysicalFiles();
		}
	);
	module.exports.mediaCMS_Delete_PhysicalFile_schedulor = mediaCMS_Delete_PhysicalFile_schedulor;
} else {
	console.log('-------------Media CMS Upload Physical Files Schedular is disabled.------------');
}

const deleteMediaCMSUploadedPhysicalFiles = async function () {
	try {
		[err, MediaCMSData] = await to(
			MediaCMSUploadQueue.findAll({
				where: {
					status: 'completed',
					isUploaded: true,
					isTranscoding: true,
					isPhysicalFileDeleted: false,
				},
				attributes: ['id', 'filePath'],
				order: [['id', 'ASC']],
			})
		);
		if (err) {
			console.log('-----Error While getting MediaCMSUploadQueue Data For Deleting Completed Files---------------', err);
		}

		if (MediaCMSData && MediaCMSData.length > 0) {
			for (let item of MediaCMSData) {
				if (item.filePath) {
					// Clean up uploaded file
					fs.unlink(item.filePath, (err) => {
						if (err) console.error('---------Error deleting MediaCMSUploadQueue file------', err);
					});
				}

				// Update MediaCMSUploadQueue
				[err, updateMediaCMSDeleteStatus] = await to(
					MediaCMSUploadQueue.update(
						{
							isPhysicalFileDeleted: true,
						},
						{
							where: { id: item.id },
						}
					)
				);

				if (err) {
					console.log('--------Error while updating MediaCMSUploadQueue-------', err);
				}
			}
		}
	} catch (error) {
		console.log('------Error in delete MediaCMS Uploaded PhysicalFiles---', error); // Corrected log
	}
};
