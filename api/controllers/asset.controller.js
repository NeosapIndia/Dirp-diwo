const {
	Op,
	sequelize,
	Asset,
	Asset_detail,
	Client,
	User,
	Market,
	VimeoCredential,
	DiwoVimeoCredential,
	UplodedLinkAsset,
	Campaign,
	Document,
	User_role_client_mapping,
	MediaCMSUploadQueue,
	DiwoAsset,
	SessionAsset,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
let imagePath = 'uploads/assets/';
let documentPath = 'uploads/document/';
var Excel = require('excel4node');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const AWS = require('aws-sdk');
const schedule = require('node-schedule');
const { getClientVimeoTokenService, getDiwoClientVimeoTokenService } = require('../services/vimeo.service');
const axios = require('axios');
const { createNotification } = require('../services/notification.service');

const xlsxtojson = require('xlsx-to-json-lc');
const fs = require('fs');
const { createlog } = require('../services/log.service');
const { getAllSubChildClientIds, getAllSubChildClientIdsForAssets } = require('../services/client.service');
const moment = require('moment');
const { capitalFirstLatter } = require('../services/auth.service');
const FormData = require('form-data');
const { createAndSaveVector, deleteVectorDataByDocumentId } = require('../services/langChain.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { createMediaCamPlaylist } = require('./vimeo.controller');

// const { HtmlToTextTransformer  } = require('@langchain/community/');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');
const config_feature = require('../config/SiteConfig.json');
const s3 = new AWS.S3({
	accessKeyId: CONFIG.aws_s3_bucket_access_key_id,
	secretAccessKey: CONFIG.aws_s3_bucket_secret_access_key_id,
	region: CONFIG.aws_s3_bucket_region,
});

//Run Campaign Scheduler
// let asset_video_transcode_status_schedulor = schedule.scheduleJob('*/15 * * * *', async function(fireDate) {

//     console.log('Run Scheduler --->>>-->>> Asset Video Transcode Status Schedulor', fireDate);

//     // checkTranscodeOfVideo();
// });
// module.exports.asset_video_transcode_status_schedulor = asset_video_transcode_status_schedulor;

// const checkTranscodeOfVideo = async function() {
//     [err, pendingTranscodeAsset] = await to(Asset_detail.findAll({
//         where: {
//             fieldname: 'Video',
//             isTranscoding: false,
//             videoUri: {
//                 [Op.ne]: null
//             }
//         }
//     }));
//     if (err) {
//         console.log("--Error When get Video Asset Details data--");
//     }

//     const client = new Vimeo(CONFIG.vimeo_client_id, CONFIG.vimeo_client_secret, CONFIG.vimeo_access_token);

//     for (let videoAsset of pendingTranscodeAsset) {
//         if (videoAsset && videoAsset.videoUri) {
//             client.request(videoAsset.videoUri + '?fields=transcode.status', function(error, body, status_code, headers) {

//                 if (body && body.transcode && body.transcode.status === 'complete') {
//                     console.log('Your video finished transcoding.')
//                     client.request(videoAsset.videoUri + '?fields=link', async function(error, body, statusCode, headers) {
//                         if (error) {
//                             console.log('There was an error making the request.')
//                             console.log('Server reported: ' + error)
//                             return
//                         }

//                         let finalVideoUrl = body.link;
//                         finalVideoUrl = finalVideoUrl.replace('https://vimeo.com/', '');
//                         finalVideoUrl = finalVideoUrl.replace('/', '?h=');
//                         finalVideoUrl = 'https://player.vimeo.com/video/' + finalVideoUrl;
//                         [err, updateAssetDetails] = await to(Asset_detail.update({
//                             isTranscoding: true,
//                             vimeoLink: finalVideoUrl
//                         }, {
//                             where: {
//                                 id: videoAsset.id
//                             }
//                         }));
//                         if (err) {
//                             console.log("--Error When update Video Asset Details data--");
//                         }
//                         console.log('Your video link is: ' + body.link)
//                     })
//                 } else if (body && body.transcode && body.transcode.status === 'in_progress') {
//                     console.log('Your video is still transcoding.')
//                 } else {
//                     console.log('Your video encountered an error during transcoding.')
//                 }
//             })
//         }
//     }
// }

// checkTranscodeOfVideo();

// const uploadVideo = async function(details) {
//     try {
//         let videoURL;
//         const client = new Vimeo(CONFIG.vimeo_client_id, CONFIG.vimeo_client_secret, CONFIG.vimeo_access_token);

//         [err, clientId] = await to(Client.findOne({
//             where: {
//                 id: details.ClientId
//             },
//             attributes: ['client_id']
//         }))
//         let fileName = ``;
//         fileName = `${details.title}-${clientId.client_id}-${details.AssetId}`;

//         client.upload(`${CONFIG.imagePath}/${details.path}`, { 'name': `${fileName}`, 'description': `${details.description}` },
//             async function(uri) {
//                 videoURL = uri;
//                 [err, updateVideoDetails] = await to(Asset_detail.update({ videoUri: videoURL }, {
//                     where: {
//                         id: details.id
//                     }
//                 }));
//                 if (err) {
//                     console.log("---err---", err);
//                 }
//             },
//             function(bytes_uploaded, bytes_total) {
//                 var percentage = (bytes_uploaded / bytes_total * 100).toFixed(2)
//                 console.log(bytes_uploaded, bytes_total, percentage + '%')
//             },
//             function(error) {
//                 console.log('Failed because: ' + error)
//             }
//         )
//     } catch (error) {
//         console.log("---error--", error);
//     }
// }
// module.exports.uploadVideo = uploadVideo;

// Upload Assets
const uploadAsset = async function (req, res) {
	try {
		if (req.body.files) {
			req.files = req.body.files;
			delete req.body.files;
		}
		return ResponseSuccess(res, {
			data: req.files,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadAsset = uploadAsset;

const createAsset = async function (req, res) {
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

		let err;
		let asset = req.body;
		// let clientId = req.params.clientId;
		let count = req.query.count;
		let userId = req.user.id;
		asset.field_name = asset.type;
		asset.is_deleted = false;
		asset.ClientId = clientId;
		let client;

		asset.UserId = userId;
		if (asset.tagName == 'null' || asset.tagName == null) {
			asset.tagName = null;
		}
		if (asset.description == 'null' || asset.description == null) {
			asset.description = null;
		}

		asset.title = await capitalFirstLatter(asset.title);

		if (asset.type == 'WhatsappVideo') {
			asset.type = 'Whatsapp Video';
			asset.field_name = 'Whatsapp Video';
		}

		[err, _asset] = await to(Asset.create(asset));
		if (err) return ResponseError(res, err, 500, true);
		let assetId = _asset.id;
		let path;
		let originalname;

		if (req.files && req.files.Image && req.files.Image.length > 0) {
			path = imagePath + req.files.Image[0].filename;
			originalname = req.files.Image[0].originalname;
		} else if (req.files && req.files.WhatsappVideo && req.files.WhatsappVideo.length > 0) {
			path = imagePath + req.files.WhatsappVideo[0].filename;
			originalname = req.files.WhatsappVideo[0].originalname;
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			path = imagePath + req.files.PDF[0].filename;
			originalname = req.files.PDF[0].originalname;
		}

		let payload;
		let size;
		if (asset && asset.type == 'Video' && config_feature?.configurable_feature?.mediaCMS) {
			size = (asset.size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Image && req.files.Image.length > 0) {
			size = (req.files.Image[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.WhatsappVideo && req.files.WhatsappVideo.length > 0) {
			size = (req.files.WhatsappVideo[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			size = (req.files.PDF[0].size / (1024 * 1024)).toFixed(3);
		}

		if (asset.type != 'Link') {
			if (asset.type == 'Image' || asset.type == 'PDF' || asset.type == 'Whatsapp Video') {
				payload = {
					AssetId: _asset.id,
					displayType: asset.type,
					sr_no: 1,
					fieldname: asset.type,
					path: path,
					name: originalname,
					size: size,
				};
			} else {
				payload = {
					AssetId: _asset.id,
					displayType: asset.type,
					sr_no: 1,
					fieldname: asset.type,
					path: asset.vimeoPath,
					name: asset.title,
					vmoVideoId: asset.vmoVideoId,
					size: (asset.size / (1024 * 1024)).toFixed(3),
					cmsVideoId: asset.cmsVideoId,
				};
			}
		} else {
			payload = {
				AssetId: _asset.id,
				displayType: asset.type,
				sr_no: 1,
				fieldname: asset.type,
				path: asset.path,
				name: null,
				selfHostedVideo: asset.selfHostedVideo,
			};
		}

		[err, asset_detail_create] = await to(Asset_detail.create(payload));
		if (err) return ResponseError(res, err, 500, true);

		if (asset && asset.type == 'Video' && config_feature?.configurable_feature?.vimeo) {
			[err, client] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					attributes: ['folderId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let data = await getClientVimeoTokenService(clientId);

			const config = {
				headers: {
					Authorization: `Bearer ${data.vToken}`,
				},
			};

			if (client && client.folderId != null && asset.type == 'Video') {
				let url = `https://api.vimeo.com/users/${data.vUserId}/projects/${client.folderId}/videos/${asset.vmoVideoId}`;
				const response = await axios.put(url, {}, config);
			}
		}

		//For Notification
		if (count != 0 && count != null && count != undefined && count != '0') {
			let notifcationMessage = MESSAGE.CREATE_ASSET;
			//notifcationMessage = notifcationMessage.replace('{{asset_type}}', asset.type);
			notifcationMessage = notifcationMessage.replace('{{count}}', parseInt(count));
			notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
			notifcationMessage = notifcationMessage.replace('{{asset}}', parseInt(count) === 1 ? 'Asset' : 'Assets');
			await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

			//get Before Asset Ids
			[err, assets] = await to(
				Asset.findAll({
					limit: parseInt(count),
					order: [['id', 'DESC']],
					attributes: ['id'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let assetIds = [];
			for (let asset of assets) {
				assetIds.push(asset.id);
			}
			assetIds = assetIds.reverse();
			// console.log('--assetIds--', assetIds);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create Assets `,
					req.ip,
					req.useragent,
					req.user.type,
					{
						AssetId: assetIds,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, assetDetails] = await to(
			Asset.findOne({
				where: {
					id: assetId,
				},
				include: [
					{
						model: Asset_detail,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.ASSETS_CREATED,
			data: assetDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createAsset = createAsset;

const updateAsset = async function (req, res) {
	try {
		// Validate request parameters
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			assetId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			assetId: parseInt(req.params.assetId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, assetId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let assets_Details;
		let client;
		let err;
		let asset = req.body;
		// let assetId = parseInt(req.params.assetId);
		// let clientId = parseInt(req.params.clientId);
		asset.field_name = asset.type;
		asset.is_deleted = false;

		asset.title = await capitalFirstLatter(asset.title);

		if (asset.type == 'WhatsappVideo') {
			asset.type = 'Whatsapp Video';
			asset.field_name = 'Whatsapp Video';
		}

		[err, _asset] = await to(
			Asset.update(asset, {
				where: {
					id: assetId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let path;
		let originalname;
		if (req.files && req.files.Image && req.files.Image.length > 0) {
			path = imagePath + req.files.Image[0].filename;
			originalname = req.files.Image[0].originalname;
		} else if (req.files && req.files.WhatsappVideo && req.files.WhatsappVideo.length > 0) {
			path = imagePath + req.files.WhatsappVideo[0].filename;
			originalname = req.files.WhatsappVideo[0].originalname;
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			path = imagePath + req.files.PDF[0].filename;
			originalname = req.files.PDF[0].originalname;
		}

		let payload;
		let size;
		if (req.files && req.files.Image && req.files.Image.length > 0) {
			size = (req.files.Image[0].size / (1024 * 1024)).toFixed(3);
		}

		if (asset.type != 'Link') {
			if (asset.type == 'Image' || asset.type == 'PDF' || asset.type == 'Whatsapp Video') {
				payload = {
					AssetId: _asset.id,
					displayType: asset.type,
					sr_no: 1,
					fieldname: asset.type,
					path: path,
					name: originalname,
					size: size,
				};
			} else {
				payload = {
					AssetId: _asset.id,
					displayType: asset.type,
					sr_no: 1,
					fieldname: asset.type,
					path: asset.vimeoPath,
					name: originalname,
					vmoVideoId: asset.vmoVideoId,
				};
			}
		} else {
			payload = {
				AssetId: assetId,
				displayType: asset.type,
				sr_no: 1,
				fieldname: asset.type,
				path: asset.path,
				name: null,
				size: null,
				selfHostedVideo: asset.selfHostedVideo,
			};
		}
		let data;
		let config;
		[err, assets_Details] = await to(
			Asset_detail.findOne({
				where: {
					AssetId: assetId,
					fieldname: 'Video',
				},
				attributes: ['vmoVideoId', 'fieldname'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (asset && asset.type == 'Video') {
			[err, client] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					attributes: ['folderId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (assets_Details) {
			data = await getClientVimeoTokenService(clientId);

			config = {
				headers: {
					Authorization: `Bearer ${data.vToken}`,
				},
			};

			let payload = {
				name: asset.title,
				description: asset.description,
			};
			if (
				asset &&
				asset.vmoVideoId == null &&
				assets_Details.vmoVideoId != null &&
				assets_Details.fieldname == 'Video'
			) {
				const response1 = await axios.patch(
					`${CONFIG.update_delete_video_on_vimeo}/${assets_Details.vmoVideoId}`,
					payload,
					config
				);
			}

			if (asset && asset.vmoVideoId != null && asset.type == 'Video') {
				const responseForDelete = await axios.delete(
					`${CONFIG.update_delete_video_on_vimeo}/${assets_Details.vmoVideoId}`,
					config
				);
				let url = `${CONFIG.create_video_folder_on_vimeo}/${data.vUserId}/projects/${client.folderId}/videos/${asset.vmoVideoId}`;
				const response2 = await axios.put(url, {}, config);
			}
		}

		[err, asset_detail_create] = await to(
			Asset_detail.update(payload, {
				where: {
					AssetId: assetId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//for Notification
		let notifcationMessage = MESSAGE.UPDATE_ASSET;
		//notifcationMessage = notifcationMessage.replace('{{asset_type}}', asset.type);
		notifcationMessage = notifcationMessage.replace('{{count}}', 1);
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		//for Log

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Update Asset`, req.ip, req.useragent, req.user.type, {
				AssetId: assetId,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: MESSAGE.ASSETS_UPDATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateAsset = updateAsset;

const getAssetByid = async function (req, res) {
	try {
		const schema = Joi.object({
			assetId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			assetId: parseInt(req.params.assetId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { assetId } = value;

		// let assetId = parseInt(req.params.assetId);

		[err, asset] = await to(
			Asset.findOne({
				where: {
					id: assetId,
				},
				include: [
					{
						model: Asset_detail,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: asset.convertToJSON(),
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAssetByid = getAssetByid;

const getAllAssetByClientForPost = async function (req, res) {
	try {
		let err;
		// Validate request parameters
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
		// const clientId = req.params.clientId;

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);

		[err, assets] = await to(
			Asset.findAll({
				where: {
					ClientId: allSubClientIds,
					is_deleted: false,
				},
				include: [
					{
						model: Asset_detail,
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

		let data = [];
		if (assets && assets.length > 0) {
			for (let asset of assets) {
				asset = asset.convertToJSON();
				asset.Client.clientIdWithName = asset.Client.client_id + ' - ' + asset.Client.name;
				[err, localUser] = await to(
					dbInstance[asset.User.Market.db_name].User_master.findOne({
						where: {
							id: asset.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					asset.User.first = localUser.first;
					asset.User.last = localUser.last;
					asset.User.email = localUser.email;
					asset.User.phone = localUser.phone;
					asset.User.imagePath = localUser.imagePath;
					asset.User.city = localUser.city;
					asset.User.state = localUser.state;
					asset.User.zipCode = localUser.zipCode;
				}
				data.push(asset);
			}
		}
		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAssetByClientForPost = getAllAssetByClientForPost;

const getAllAssetByClient = async function (req, res) {
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
		// const clientId = parseInt(req.params.clientId);
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForAssets(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// const page = parseInt(req.query.page);
		let assets;

		[err, assets] = await to(
			Asset.findAndCountAll({
				distinct: true,
				where: {
					ClientId: allSubClientIds,
					is_deleted: false,
				},
				include: [
					{
						model: Asset_detail,
						attributes: ['name', 'path', 'size'],
					},
					{
						model: Client,
						attributes: ['name', 'client_id'],
					},
					{
						model: User,
						attributes: ['MarketId', 'local_user_id'],
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
				offset: offset,
				limit: limit,
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let data = [];
		if (assets && assets.rows && assets.rows.length > 0) {
			for (let asset of assets.rows) {
				asset = asset.convertToJSON();
				asset.Client.clientIdWithName = asset.Client.client_id + ' - ' + asset.Client.name;
				[err, localUser] = await to(
					dbInstance[asset.User.Market.db_name].User_master.findOne({
						where: {
							id: asset.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					asset.User.first = localUser.first;
					asset.User.last = localUser.last;
				}
				data.push(asset);
			}
		}
		return ResponseSuccess(res, {
			data: data,
			count: assets.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAssetByClient = getAllAssetByClient;

const getAllAssetByType = async function (req, res) {
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

		// let clientId = parseInt(req.params.clientId);
		let type = req.params.type;
		let whereCondition;

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForAssets(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		if (type == 'Document') {
			type = 'PDF';
		}
		if (
			type == 'Poll' ||
			type == 'Quiz' ||
			type == 'Quiz (Randomised)' ||
			type == 'Single Image' ||
			type == 'Carousel' ||
			type == 'Offline Task' ||
			type == 'Survey' ||
			type == 'HTML' ||
			type == 'Spin The Wheel' ||
			type == 'Custom Template'
		) {
			type = 'Image';
		}

		if (type == 'Video') {
			whereCondition = {
				ClientId: allSubClientIds,
				[sequelize.Op.or]: {
					field_name: type,
					selfHostedVideo: true,
				},
				is_deleted: false,
			};
		} else {
			whereCondition = {
				ClientId: allSubClientIds,
				field_name: type,
				is_deleted: false,
			};
		}

		[err, assets] = await to(
			Asset.findAll({
				where: whereCondition,
				include: [
					{
						model: Asset_detail,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let data = [];
		for (let asset of assets) {
			data.push(asset.convertToJSON());
		}

		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAssetByType = getAllAssetByType;

const getAllAssetSearchByType = async function (req, res) {
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
		let type = req.params.type;
		let searchKey = req.params.searchKey;

		// let allSubClientIds = await getAllSubChildClientIds(clientId);
		// allSubClientIds.push(clientId);

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForAssets(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		if (type == 'Document') {
			type = 'PDF';
		}

		if (
			type == 'Poll' ||
			type == 'Quiz' ||
			type == 'Quiz (Randomised)' ||
			type == 'Single Image' ||
			type == 'Carousel' ||
			type == 'Offline Task' ||
			type == 'Survey' ||
			type == 'HTML' ||
			type == 'Spin The Wheel' ||
			type == 'Custom Template'
		) {
			type = 'Image';
		}

		[err, assets] = await to(
			Asset.findAll({
				where: {
					[sequelize.Op.or]: {
						title: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
						tagName: {
							[sequelize.Op.iLike]: '%' + searchKey + '%',
						},
					},
					ClientId: allSubClientIds,
					field_name: type,
					is_deleted: false,
				},
				include: [
					{
						model: Asset_detail,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let data = [];
		for (let asset of assets) {
			data.push(asset.convertToJSON());
		}

		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllAssetSearchByType = getAllAssetSearchByType;

const deleteAsset = async function (req, res) {
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
		let assetId = req.body;

		[err, assets_Details] = await to(
			Asset_detail.findAll({
				where: {
					AssetId: assetId,
					fieldname: 'Video',
				},
				attributes: ['vmoVideoId', 'fieldname'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (assets_Details && assets_Details.length > 0) {
			let data = await getClientVimeoTokenService(clientId);
			const config = {
				headers: {
					Authorization: `Bearer ${data.vToken}`,
				},
			};
			for (let asset_ of assets_Details) {
				if (asset_.vmoVideoId != null && asset_.fieldname == 'Video') {
					const response = await axios.delete(`${CONFIG.update_delete_video_on_vimeo}/${asset_.vmoVideoId}`, config);
				}
			}
		}

		[err, asset] = await to(
			Asset.update(
				{
					is_deleted: true,
				},
				{
					where: {
						id: assetId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
		let notifcationMessage = MESSAGE.DELETE_ASSET;
		notifcationMessage = notifcationMessage.replace('{{count}}', assetId.length);
		notifcationMessage = notifcationMessage.replace('{{asset}}', assetId.length === 1 ? 'Asset' : 'Assets');
		notifcationMessage = notifcationMessage.replace('{{user_name}}', 'You');
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(req.user.id, req.user.ClientId, req.user.RoleId, `Delete Asset`, req.ip, req.useragent, req.user.type, {
				AssetId: assetId,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.ASSETS_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteAsset = deleteAsset;

const downLoadAsset = async function (req, res) {
	try {
		let assetId = req.params.assetId;

		[err, asset] = await to(
			Asset.findOne({
				where: {
					id: assetId,
				},
				include: [
					{
						model: Asset_detail,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let assetPath;
		if (asset) {
			assetPath = asset.Asset_details[0].path;
		}

		return res.download(__dirname + `/../public/uploads/${assetPath}`);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downLoadAsset = downLoadAsset;

const getAllSearchAssetByClientId = async function (req, res) {
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

		let searchKey = req.body.searchKey.split(' ');
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let err;
		// let clientId = parseInt(req.params.clientId);

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForAssets(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let ClientsDetail_Id = [];
		let Assets_Details_Id = [];
		let whereCondition = [];
		let ClientsDetail;
		let userDetailId = [];
		let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let userDetailAssets;
		let ClientsDetailAssets;
		let Assets_DetailsAssets;
		let assets;
		let allData = [];
		let UpdatedAssetsId = [];
		let UpdatedAssets;
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
				title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('type') > -1) {
			whereCondition.push({
				field_name: {
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

		if (filterColumn.indexOf('size') > -1) {
			[err, Assets_Details] = await to(
				Asset_detail.findAll({
					where: {
						size: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					attributes: ['id'],
				})
			);

			if (Assets_Details && Assets_Details.length > 0) {
				for (let Assets of Assets_Details) {
					let UpdatedAssets_Details = Assets.convertToJSON();
					Assets_Details_Id.push(UpdatedAssets_Details.id);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('tags') > -1) {
			whereCondition.push({
				tagName: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('owner') > -1) {
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						name: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
						id: allSubClientIds,
						is_deleted: false,
					},
					attributes: ['id'],
				})
			);

			if (ClientsDetail && ClientsDetail.length > 0) {
				for (let Clients of ClientsDetail) {
					let UpdatedClients = Clients.convertToJSON();
					ClientsDetail_Id.push(UpdatedClients.id);
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

		if (ClientsDetail && ClientsDetail.length > 0) {
			[err, ClientsDetailAssets] = await to(
				Asset.findAll({
					where: {
						ClientId: ClientsDetail_Id,
						is_deleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Asset_detail,
						},
						{
							model: Client,
							where: {
								id: allSubClientIds,
							},
						},
						{
							model: User,
							where: {
								status: true,
								forDrip: true,
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
		}

		if (Assets_Details && Assets_Details.length > 0) {
			[err, Assets_DetailsAssets] = await to(
				Asset.findAll({
					where: {
						is_deleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Asset_detail,
							where: {
								id: Assets_Details_Id,
							},
						},
						{
							model: Client,
							where: {
								id: allSubClientIds,
							},
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
		}

		if (userDetailId && userDetailId.length > 0) {
			[err, userDetailAssets] = await to(
				Asset.findAll({
					where: {
						UserId: userDetailId,
						ClientId: clientId,
						is_deleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Asset_detail,
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
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, assets] = await to(
				Asset.findAll({
					where: {
						[sequelize.Op.or]: whereCondition,
						ClientId: allSubClientIds,
						is_deleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Asset_detail,
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
		}

		if (err) return ResponseError(res, err, 500, true);

		if (ClientsDetailAssets && ClientsDetailAssets.length > 0) {
			for (let Clients_detail_assets of ClientsDetailAssets) {
				allData.push(Clients_detail_assets);
			}
		}

		if (Assets_DetailsAssets && Assets_DetailsAssets.length > 0) {
			for (let Assets_Details_assets of Assets_DetailsAssets) {
				allData.push(Assets_Details_assets);
			}
		}

		if (userDetailAssets && userDetailAssets.length > 0) {
			for (let user_detail_assets of userDetailAssets) {
				allData.push(user_detail_assets);
			}
		}

		if (assets && assets.length > 0) {
			for (let assets_ of assets) {
				allData.push(assets_);
			}
		}

		for (let item of allData) {
			let item_ = item.convertToJSON();
			UpdatedAssetsId.push(item_.id);
		}

		if (UpdatedAssetsId && UpdatedAssetsId.length > 0) {
			[err, UpdatedAssets] = await to(
				Asset.findAndCountAll({
					distinct: true,
					where: {
						id: UpdatedAssetsId,
					},
					include: [
						{
							model: Asset_detail,
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
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (UpdatedAssets && UpdatedAssets.rows && UpdatedAssets.rows.length > 0) {
			for (let assets of UpdatedAssets.rows) {
				let assets_ = assets.convertToJSON();
				newList.push(assets_);
			}
		}

		let allRecords = [];
		if (newList && newList.length > 0) {
			for (let asset_ of newList) {
				asset = asset_;
				asset.Client.clientIdWithName = asset.Client.client_id + ' - ' + asset.Client.name;
				[err, localUser] = await to(
					dbInstance[asset.User.Market.db_name].User_master.findOne({
						where: {
							id: asset.User.local_user_id,
						},
						attributes: ['first', 'email', 'last', 'phone', 'imagePath', 'city', 'state', 'zipCode'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					asset.User.first = localUser.first;
					asset.User.last = localUser.last;
					asset.User.email = localUser.email;
					asset.User.phone = localUser.phone;
					asset.User.imagePath = localUser.imagePath;
					asset.User.city = localUser.city;
					asset.User.state = localUser.state;
					asset.User.zipCode = localUser.zipCode;
				}
				allRecords.push(asset);
			}
		}

		let count;
		if (UpdatedAssets != undefined) {
			count = UpdatedAssets.count;
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
module.exports.getAllSearchAssetByClientId = getAllSearchAssetByClientId;

const getClientVimeoToken = async function (req, res) {
	try {
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

		let data;
		let type = req.user.type;

		if (type == 'drip') {
			data = await getClientVimeoTokenService(clientId);
		} else if (type == 'diwo') {
			data = await getDiwoClientVimeoTokenService(clientId);
		}

		if (!data) {
			return ResponseSuccess(res, {
				data: data,
				message: MESSAGE.NOT_VIMEO_CREDENTIALS,
			});
		} else {
			return ResponseSuccess(res, {
				data: data,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientVimeoToken = getClientVimeoToken;

const getClientVimeoTokenByCampaignId = async function (req, res) {
	try {
		const schema = Joi.object({
			campaignId: Joi.number().integer().positive().required(),
			type: Joi.string().trim().max(4).required(),
		});
		const { error, value } = schema.validate({
			campaignId: req.params.campaignId,
			type: req.query.type,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { campaignId, type } = value;

		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: 'Invalid project type parameter.' }, 400);
		}

		// let campaignId = req.params.campaignId;
		let data = false;
		// let type = req.query.type;
		let clientId;

		[err, campaingDetails] = await to(
			Campaign.findOne({
				where: {
					id: campaignId,
				},
				attributes: ['ClientId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		if (campaingDetails) {
			clientId = campaingDetails.ClientId;
			if (type == 'drip') {
				data = await getClientVimeoTokenService(clientId);
			} else if (type == 'diwo') {
				data = await getDiwoClientVimeoTokenService(clientId);
			}
		}

		if (!data) {
			return ResponseSuccess(res, {
				data: data,
				message: MESSAGE.NOT_VIMEO_CREDENTIALS,
			});
		} else {
			return ResponseSuccess(res, {
				data: data,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientVimeoTokenByCampaignId = getClientVimeoTokenByCampaignId;

const getAllContentFileName = async function (req, res) {
	let filename = CONFIG.imagePath + '/uploads/excel/' + req.file.filename;
	exceltojson = xlsxtojson;
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			userId: parseInt(req.params.userId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, userId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let userId = req.params.userId;
		// let clientId = req.params.clientId;
		let assetList = [];

		exceltojson(
			{
				input: filename,
				output: null,
				lowerCaseHeaders: true,
			},
			async function (err, rows) {
				if (err) {
					return;
				}

				// console.log("----rows---", rows);
				let excelHearders = ['sr no', 'title', 'description', 'tags', 'link', 'self hosted video(yes/no)'];

				let validHeader = true;
				for (let header of excelHearders) {
					if (rows[0][header] == undefined) {
						console.log(header);
						validHeader = false;
					}
				}

				if (validHeader) {
					for (let row of rows) {
						let data = {
							srNo: row['sr no'],
							title: row['title'],
							description: row['description'],
							tags: row['tags'],
							link: row['link'],
							selfHostedVideo: row['self hosted video(yes/no)'],
							errorMsg: [],
							isError: false,
							isCreated: false,
							UserId: parseInt(userId),
							ClientId: parseInt(clientId),
						};

						if (data.title == '' || data.title == null || (data.title == 'null') | (data.title == undefined)) {
							data.errorMsg.push('Title is required.');
							data.isError = true;
						} else {
							data.title = await capitalFirstLatter(data.title);
						}

						if (data.link == '' || data.link == null || (data.link == 'null') | (data.link == undefined)) {
							data.errorMsg.push('Link is required.');
							data.isError = true;
						}

						if (data.link.toLowerCase().indexOf('http') != 0) {
							data.errorMsg.push('http is required.');
							data.isError = true;
						}

						data.selfHostedVideo = data.selfHostedVideo.toLowerCase();
						if (
							data.selfHostedVideo == '' ||
							data.selfHostedVideo == 'no' ||
							data.selfHostedVideo == 'false' ||
							data.selfHostedVideo == false
						) {
							data.selfHostedVideo = false;
						} else {
							data.selfHostedVideo = true;
						}

						const youtubeRegEx = new RegExp(
							/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
						);

						if (data.selfHostedVideo == true && !data.link.match(youtubeRegEx)) {
							data.errorMsg.push('We currently only support self hosted videos on YouTube. Please use a YouTube link');
							data.isError = true;
						}

						if (data.tags == 'null' || data.tags == null) {
							data.tags = null;
						}
						if (data.description == 'null' || data.description == null) {
							data.description = null;
						}

						data.errorMsg = data.errorMsg.toString();
						assetList.push(data);

						// [err, _asset] = await to(Asset.create(link));
						// if (err) return ResponseError(res, err, 500, true);

						// let payload = {
						//     AssetId: _asset.id,
						//     displayType: link.type,
						//     sr_no: 1,
						//     fieldname: link.type,
						//     path: link.link,
						//     name: null,
						// };

						// [err, asset_detail_create] = await to(Asset_detail.create(payload));
						// if (err) return ResponseError(res, err, 500, true);

						// }
					}

					if (assetList && assetList.length > 0) {
						[err, uploadBulkLink] = await to(UplodedLinkAsset.bulkCreate(assetList));

						if (err) {
							console.log('----uploadBulkLink----', err);
						}

						[err, uplodedLinkDetails] = await to(
							UplodedLinkAsset.findAll({
								where: {
									UserId: userId,
									ClientId: clientId,
									isCreated: false,
									isError: false,
								},
							})
						);

						if (uplodedLinkDetails && uplodedLinkDetails.length > 0) {
							let uploadAssetIds = [];
							for (let item of uplodedLinkDetails) {
								let asset_payload = {
									field_name: 'Link',
									type: 'Link',
									is_deleted: false,
									ClientId: clientId,
									UserId: userId,
									title: item.title,
									description: item.description,
									tagName: item.tags,
									selfHostedVideo: item.selfHostedVideo,
								};

								[err, _asset] = await to(Asset.create(asset_payload));
								if (err) return ResponseError(res, err, 500, true);

								let payload = {
									AssetId: _asset.id,
									displayType: asset_payload.type,
									sr_no: 1,
									fieldname: asset_payload.type,
									path: item.link,
									name: item.title,
									selfHostedVideo: item.selfHostedVideo,
								};

								[err, asset_detail_create] = await to(Asset_detail.create(payload));
								if (err) return ResponseError(res, err, 500, true);

								uploadAssetIds.push(item.id);
							}

							if (uploadAssetIds && uploadAssetIds.length > 0) {
								[err, updateStatus] = await to(
									UplodedLinkAsset.update(
										{
											isCreated: true,
										},
										{
											where: {
												id: uploadAssetIds,
											},
										}
									)
								);

								if (err) {
									console.log('-updateStatus--', err);
								}
							}
						}

						let notifcationMessage = `Link bulk upload finished at {{date}}.`;
						await createNotification(notifcationMessage, ['Bell'], [userId]);

						if (err) {
							console.log('----ERROR----', err);
						}
					}
				}
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

const downloadLinkAssetsData = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			userId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			userId: parseInt(req.params.userId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, userId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let userId = req.params.userId;
		// let clientId = req.params.clientId;
		let whereCondition = {
			ClientId: clientId,
			UserId: userId,
		};
		let data = [];
		let link_Data;

		[err, downloadedLinkAssetsDetail] = await to(
			UplodedLinkAsset.findAll({
				where: whereCondition,
				attributes: ['srNo', 'title', 'description', 'tags', 'link', 'isCreated', 'errorMsg', 'isError', 'createdAt'],
				order: [['createdAt', 'DESC']],
			})
		);

		if (downloadedLinkAssetsDetail && downloadedLinkAssetsDetail.length > 0) {
			for (let item of downloadedLinkAssetsDetail) {
				link_Data = item.convertToJSON();
				// link_Data.createdAt = moment(link_Data.createdAt).format('DD MM YYYY HH:mm');
				data.push(link_Data);
			}
		}

		return ResponseSuccess(res, { data: data });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadLinkAssetsData = downloadLinkAssetsData;

let upload_link_assets_schedulor = schedule.scheduleJob('30 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>> Destroy Bulk Link Assets Uploaded Status', fireDate);

	checkUploadLinkAssetDataStatus();
});
module.exports.upload_link_assets_schedulor = upload_link_assets_schedulor;

const checkUploadLinkAssetDataStatus = async function () {
	let sevenDaysBefore = moment().subtract(7, 'days');
	[err, upload_details] = await to(
		UplodedLinkAsset.destroy({
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

const generatePresignedUrl = async function (req, res) {
	try {
		// Configure AWS with your access and secret key

		const params = {
			Bucket: CONFIG.aws_s3_bucket_name,
			Key: req.body.fileName,
			Expires: 300, // expiration time in seconds
			ContentType: req.body.fileType,
		};
		s3.getSignedUrl('putObject', params, (err, url) => {
			if (err) {
				return res.status(500).json({ error: err });
			}
			return ResponseSuccess(res, { presignedUrl: url });
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.generatePresignedUrl = generatePresignedUrl;

const downloadDataFromAWSS3 = async function (req, res) {
	try {
		let files = req.body.files;
		try {
			const urls = await Promise.all(
				files.map(async (file) => {
					const params = {
						Bucket: CONFIG.aws_s3_bucket_name,
						Key: file,
						Expires: 60 * 5, // URL expires in 5 minutes
					};
					const payload = { url: await s3.getSignedUrlPromise('getObject', params), fileName: file };
					return payload;
				})
			);

			return ResponseSuccess(res, { urls: urls });
		} catch (err) {
			console.error(err);
			res.status(500).send('Error generating pre-signed URLs');
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadDataFromAWSS3 = downloadDataFromAWSS3;

////////////////////////////////////////////////////////////////Document APIs

const getAllDocumentByClientId = async function (req, res) {
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
		// const clientId = req.params.clientId;
		let allSubClientIds = await getAllSubChildClientIds(clientId);
		allSubClientIds.push(clientId);

		let offset = 0;
		// let limit = parseInt(req.query.limit);
		// const page = parseInt(req.query.page);
		let assets;

		offset = (page - 1) * limit;

		[err, documents] = await to(
			Document.findAndCountAll({
				where: {
					ClientId: allSubClientIds,
					is_deleted: false,
				},
				include: [
					{
						model: Client,
						attributes: ['id', 'name', 'client_id'],
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
						attributes: ['id', 'MarketId', 'local_user_id'],
					},
				],
				offset: offset,
				limit: limit,
				order: [['id', 'DESC']],
				attributes: ['id', 'title', 'type', 's3Path', 'createdAt', 'updatedAt'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let data = [];
		if (documents && documents.rows.length > 0) {
			for (let asset of documents.rows) {
				asset = asset.convertToJSON();
				asset.Client.clientIdWithName = asset.Client.client_id + ' - ' + asset.Client.name;
				[err, localUser] = await to(
					dbInstance[asset.User.Market.db_name].User_master.findOne({
						where: {
							id: asset.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					asset.User.first = localUser.first;
					asset.User.last = localUser.last;
				}
				delete asset.User.Market;
				data.push(asset);
			}
		}
		return ResponseSuccess(res, {
			data: data,
			count: documents.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDocumentByClientId = getAllDocumentByClientId;

const createDcument = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: req.body.ClientId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let payload = req.body;
		let path;
		let originalname;
		let size;
		if (req.files && req.files.Image && req.files.Image.length > 0) {
			path = documentPath + req.files.Image[0].filename;
			originalname = req.files.Image[0].originalname;
		} else if (req.files && req.files.Audio && req.files.Audio.length > 0) {
			path = documentPath + req.files.Audio[0].filename;
			originalname = req.files.Audio[0].originalname;
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			path = documentPath + req.files.PDF[0].filename;
			originalname = req.files.PDF[0].originalname;
		} else if (req.files && req.files.Video && req.files.Video.length > 0) {
			path = documentPath + req.files.Video[0].filename;
			originalname = req.files.Video[0].originalname;
		} else if (req.files && req.files.Document && req.files.Document.length > 0) {
			path = documentPath + req.files.Document[0].filename;
			originalname = req.files.Document[0].originalname;
		} else if (req.files && req.files.Presentation && req.files.Presentation.length > 0) {
			path = documentPath + req.files.Presentation[0].filename;
			originalname = req.files.Presentation[0].originalname;
		}

		if (req.files && req.files.Image && req.files.Image.length > 0) {
			size = (req.files.Image[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Audio && req.files.Audio.length > 0) {
			size = (req.files.Audio[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			size = (req.files.PDF[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Video && req.files.Video.length > 0) {
			size = (req.files.Video[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Document && req.files.Document.length > 0) {
			size = (req.files.Document[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Presentation && req.files.Presentation.length > 0) {
			size = (req.files.Presentation[0].size / (1024 * 1024)).toFixed(3);
		}
		if (payload.type != 'Link') {
			payload.path = path;
		}

		payload.name = originalname;
		payload.size = size;
		payload.UserId = req.user.id;
		payload.is_deleted = false;
		if (payload?.customFields) {
			payload.customFields = JSON.parse(payload.customFields);
		}

		if (payload?.LlamaParams) {
			payload.LlamaParams = JSON.parse(payload.LlamaParams);
		}
		console.log('-----Payload---', payload);

		[err, createDocument] = await to(Document.create(payload));
		if (err) return ResponseError(res, err, 500, true);

		//Create Vector And Save It
		createAndSaveVector(createDocument);

		let notifcationMessage = MESSAGE.CREATE_DOCUMENT;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Document `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DocumentId: createDocument.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: 'Document successfully created',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createDcument = createDcument;

const updateDocument = async function (req, res) {
	try {
		const schema = Joi.object({
			id: Joi.number().integer().positive().required(),
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			id: parseInt(req.params.id),
			clientId: req.body.ClientId,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { id, clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}
		// let id = req.params.id;
		let payload = req.body;
		let path;
		let originalname;
		let size;

		if (req.files && req.files.Image && req.files.Image.length > 0) {
			path = documentPath + req.files.Image[0].filename;
			originalname = req.files.Image[0].originalname;
		} else if (req.files && req.files.Audio && req.files.Audio.length > 0) {
			path = documentPath + req.files.Audio[0].filename;
			originalname = req.files.Audio[0].originalname;
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			path = documentPath + req.files.PDF[0].filename;
			originalname = req.files.PDF[0].originalname;
		} else if (req.files && req.files.Video && req.files.Video.length > 0) {
			path = documentPath + req.files.Video[0].filename;
			originalname = req.files.Video[0].originalname;
		} else if (req.files && req.files.Document && req.files.Document.length > 0) {
			path = documentPath + req.files.Document[0].filename;
			originalname = req.files.Document[0].originalname;
		} else if (req.files && req.files.Presentation && req.files.Presentation.length > 0) {
			path = documentPath + req.files.Presentation[0].filename;
			originalname = req.files.Presentation[0].originalname;
		}

		if (req.files && req.files.Image && req.files.Image.length > 0) {
			size = (req.files.Image[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Audio && req.files.Audio.length > 0) {
			size = (req.files.Audio[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			size = (req.files.PDF[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Video && req.files.Video.length > 0) {
			size = (req.files.Video[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Document && req.files.Document.length > 0) {
			size = (req.files.Document[0].size / (1024 * 1024)).toFixed(3);
		} else if (req.files && req.files.Presentation && req.files.Presentation.length > 0) {
			size = (req.files.Presentation[0].size / (1024 * 1024)).toFixed(3);
		}
		if (payload.type != 'Link' && path) {
			payload.path = path;
		}

		if (originalname) {
			payload.name = originalname;
		}

		if (size) {
			payload.size = size;
		}

		// payload.UserId = req.user.id;
		// payload.is_deleted = false;

		if (payload.id) {
			delete payload.id;
		}
		if (payload?.customFields) {
			payload.customFields = JSON.parse(payload.customFields);
		}

		if (payload?.LlamaParams) {
			payload.LlamaParams = JSON.parse(payload.LlamaParams);
		}

		[err, createDocument] = await to(
			Document.update(payload, {
				where: {
					id: id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, documentDetails] = await to(
			Document.findOne({
				where: {
					id: id,
				},
			})
		);

		createAndSaveVector(documentDetails, true);

		let notifcationMessage = MESSAGE.UPDATE_DOCUMENT;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Document `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DocumentId: id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: 'Document successfully updated',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateDocument = updateDocument;

const deleteDocument = async function (req, res) {
	try {
		let documentIds = req.body;
		[err, deleteDocuments] = await to(
			Document.update(
				{ is_deleted: true },
				{
					where: {
						id: documentIds,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		deleteVectorDataByDocumentId(documentIds);

		let notifcationMessage = MESSAGE.DELETE_DOCUMENT;
		await createNotification(notifcationMessage, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Document `,
				req.ip,
				req.useragent,
				req.user.type,
				{
					DocumentId: documentIds,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: 'Document successfully Deleted',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteDocument = deleteDocument;

const getDocumentCustomField = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		let { clientId } = value;

		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);
		let flag = true;
		let count = 0;
		let totleCount = 0;
		let customFieldData = [];
		[err, totleCount] = await to(Client.count());
		if (err) return ResponseError(res, err, 500, true);

		let forPipelinedetails;

		while (flag) {
			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
						DripAccess: true,
					},
					attributes: [
						'id',
						'DripAccess',
						'category',
						'client_id',
						'Associate_client_id',
						'name',
						'documentCustomFields',
						'pipelineType',
						'pipelineOption',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (clientId === clientId) {
				forPipelinedetails = clientDetails.convertToJSON();
			}

			clientId = null;

			if (clientDetails) {
				if (clientDetails.category == 'Client Account') {
					customFieldData = clientDetails.documentCustomFields;
					flag = false;
				} else {
					if (clientDetails.Associate_client_id) {
						clientId = clientDetails.Associate_client_id;
					} else {
						flag = false;
					}
				}
			} else {
				flag = false;
			}
			count++;

			if (count == totleCount) {
				flag = false;
			}
		}
		return ResponseSuccess(res, {
			data: { customFieldData, forPipelinedetails },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDocumentCustomField = getDocumentCustomField;

const getDocumentById = async function (req, res) {
	try {
		const id = parseInt(req.params.id);

		[err, documentdetails] = await to(
			Document.findOne({
				where: {
					id: id,
					is_deleted: false,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: documentdetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDocumentById = getDocumentById;

const getAllDocumentSearchByType = async function (req, res) {
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

		let searchKey = req.body.searchKey.split(' ');
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let err;
		// let clientId = parseInt(req.params.clientId);

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForAssets(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let ClientsDetail_Id = [];
		let Assets_Details_Id = [];
		let whereCondition = [];
		let ClientsDetail;
		let userDetailId = [];
		let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let userDetailAssets;
		let ClientsDetailAssets;
		let Assets_DetailsAssets;
		let assets;
		let allData = [];
		let UpdatedAssetsId = [];
		let UpdatedAssets;
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let finalDocumentList = [];
		let documentDetails = [];
		let selectedUserId = [];
		let documentDetailsByUserName = [];

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
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('type') > -1) {
			whereCondition.push({
				type: {
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

		if (filterColumn.indexOf('first') > -1) {
			let firstName = null;
			let lastName = null;
			if (req.body.searchKey.indexOf(' ') > -1) {
				firstName = req.body.searchKey.split(' ')[0];
				lastName = req.body.searchKey.split(' ')[1];
			} else {
				firstName = req.body.searchKey;
			}

			//Get All User's Local User Id
			[err, adminUserDetails] = await to(
				User_role_client_mapping.findAll({
					where: {
						ClientId: allSubClientIds,
						RoleId: {
							[Op.ne]: 1,
						},
						forDrip: true,
					},
					include: [{ model: User, attributes: ['id', 'local_user_id', 'MarketId'] }],
					attributes: ['RoleId', 'UserId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (adminUserDetails.length > 0) {
				// console.log('---adminUserDetails-----', adminUserDetails[0].convertToJSON());
				// Need to Find the All Market and Like quesry in the differnt Table
				[err, allMarket] = await to(
					Market.findAll({
						attributes: ['id', 'db_name'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let marketData = [];

				for (let marketDetails of allMarket) {
					marketData.push({ MarkerId: marketDetails.id, db_name: marketDetails.db_name, id: [] });
					for (let user of adminUserDetails) {
						if (
							user?.User?.MarketId == marketDetails.id &&
							marketData[marketData.length - 1].id.indexOf(user.User.local_user_id) == -1
						) {
							marketData[marketData.length - 1].id.push(user.User.local_user_id);
						}
					}
				}
				for (let data of marketData) {
					if (data.id.length > 0) {
						let wherCondtion = {
							id: data.id,
						};

						if (lastName) {
							wherCondtion[sequelize.Op.or] = {
								first: {
									[sequelize.Op.iLike]: '%' + firstName + '%',
								},
								last: {
									[sequelize.Op.iLike]: '%' + lastName + '%',
								},
							};
						} else {
							wherCondtion[sequelize.Op.or] = {
								first: {
									[sequelize.Op.iLike]: '%' + firstName + '%',
								},
							};
						}

						[err, userDetails] = await to(
							dbInstance[data.db_name].User_master.findAll({
								where: wherCondtion,
								attributes: ['id'],
							})
						);

						if (err) {
							console.log('--------Err-----', err);
						}

						if (userDetails?.length > 0) {
							for (let userPersonalData of userDetails) {
								for (let details of adminUserDetails) {
									if (
										details.User.local_user_id == userPersonalData.id &&
										details.User.MarketId == data.MarkerId &&
										selectedUserId.indexOf(details.UserId) == -1
									) {
										selectedUserId.push(details.UserId);
									}
								}
							}
						}
					}
				}
			}
		}

		// if (filterColumn.indexOf('owner') > -1) {
		// 	[err, ClientsDetail] = await to(
		// 		Client.findAll({
		// 			where: {
		// 				name: {
		// 					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
		// 				},
		// 				id: allSubClientIds,
		// 				is_deleted: false,
		// 			},
		// 			attributes: ['id'],
		// 		})
		// 	);

		// 	if (ClientsDetail && ClientsDetail.length > 0) {
		// 		for (let Clients of ClientsDetail) {
		// 			let UpdatedClients = Clients.convertToJSON();
		// 			ClientsDetail_Id.push(UpdatedClients.id);
		// 		}
		// 	}
		// 	if (err) return ResponseError(res, err, 500, true);
		// }

		//Search User By market

		// [err, MarketDetails] = await to(
		// 	Market.findAll({
		// 		where: {
		// 			status: true,
		// 		},
		// 	})
		// );

		// if (err) return ResponseError(res, err, 500, true);

		// if (filterColumn.indexOf('first') > -1) {
		// 	if (MarketDetails && MarketDetails.length > 0) {
		// 		for (let market of MarketDetails) {
		// 			let marketUser = market.convertToJSON();
		// 			[err, localUser] = await to(
		// 				dbInstance[marketUser.db_name].User_master.findAll({
		// 					where: {
		// 						[sequelize.Op.or]: {
		// 							first: {
		// 								[sequelize.Op.iLike]: searchKey[0] + '%',
		// 							},
		// 							last: {
		// 								[sequelize.Op.iLike]: searchKey[1] + '%',
		// 							},
		// 						},
		// 					},
		// 				})
		// 			);

		// 			if (err) return ResponseError(res, err, 500, true);

		// 			let LocalUserId = [];
		// 			if (localUser && localUser.length > 0) {
		// 				for (let User of localUser) {
		// 					LocalUserId.push(User.id);
		// 				}
		// 			}

		// 			[err, UserDetail] = await to(
		// 				User.findAll({
		// 					where: {
		// 						local_user_id: LocalUserId,
		// 						forDrip: true,
		// 						MarketId: market.id,
		// 					},
		// 					attributes: ['id'],
		// 				})
		// 			);

		// 			if (UserDetail && UserDetail.length > 0) {
		// 				for (let User of UserDetail) {
		// 					userDetailId.push(User.id);
		// 				}
		// 			}
		// 			if (err) return ResponseError(res, err, 500, true);
		// 		}
		// 	}
		// }

		if (selectedUserId?.length > 0) {
			[err, documentDetailsByUserName] = await to(
				Document.findAll({
					where: {
						ClientId: allSubClientIds,
						is_deleted: false,
						UserId: selectedUserId,
					},
					include: [
						{
							model: User,
							where: {
								status: true,
								forDrip: true,
								is_deleted: false,
							},
							attributes: ['id'],
						},
					],
					order: [['createdAt', 'DESC']],
					attributes: ['id'],
				})
			);
		}

		if (whereCondition && whereCondition.length > 0) {
			[err, documentDetails] = await to(
				Document.findAll({
					where: {
						[sequelize.Op.or]: whereCondition,
						ClientId: allSubClientIds,
						is_deleted: false,
						[Op.and]: dateCondition,
					},
					include: [
						{
							model: Client,
						},
						{
							model: User,
							where: {
								status: true,
								forDrip: true,
								is_deleted: false,
							},
							attributes: ['id'],
						},
					],
					order: [['createdAt', 'DESC']],
					attributes: ['id'],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		if (documentDetails && documentDetails.length > 0) {
			for (let document of documentDetails) {
				UpdatedAssetsId.push(document.id);
			}
		}

		if (documentDetailsByUserName?.length > 0) {
			for (let document of documentDetailsByUserName) {
				UpdatedAssetsId.push(document.id);
			}
		}

		// for (let item of allData) {
		// 	let item_ = item.convertToJSON();
		// 	UpdatedAssetsId.push(item_.id);
		// }

		if (UpdatedAssetsId && UpdatedAssetsId.length > 0) {
			[err, finalDocumentList] = await to(
				Document.findAndCountAll({
					distinct: true,
					where: {
						id: UpdatedAssetsId,
					},
					include: [
						{
							model: Client,
							attributes: ['id'],
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
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);
		}

		if (err) return ResponseError(res, err, 500, true);

		let newList = [];
		if (finalDocumentList && finalDocumentList.rows && finalDocumentList.rows.length > 0) {
			for (let document of finalDocumentList.rows) {
				let document_ = document.convertToJSON();
				newList.push(document_);
			}
		}

		let allRecords = [];
		if (newList && newList.length > 0) {
			for (let document_ of newList) {
				let document = document_;
				document.Client.clientIdWithName = document.Client.client_id + ' - ' + document.Client.name;
				[err, localUser] = await to(
					dbInstance[document.User.Market.db_name].User_master.findOne({
						where: {
							id: document.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (localUser) {
					document.User.first = localUser.first;
					document.User.last = localUser.last;
				}
				allRecords.push(document);
			}
		}

		let count;
		if (UpdatedAssets != undefined) {
			count = UpdatedAssets.count;
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
module.exports.getAllDocumentSearchByType = getAllDocumentSearchByType;
