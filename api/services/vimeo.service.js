const {
	Client,
	VimeoCredential,
	Asset_detail,
	Asset,
	DiwoVimeoCredential,
	DiwoAsset,
	SessionAsset,
	UserBriefFile,
	Campaign,
	Op,
	SessionQuestionSubmission,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
var Excel = require('excel4node');
const moment = require('moment');
const fs = require('fs');
const xlsxtojson = require('xlsx-to-json-lc');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const schedule = require('node-schedule');

const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const axios = require('axios');
const Sequelize = require('sequelize');
const config_feature = require('../config/SiteConfig.json');

const getClientVimeoTokenService = async function (ClientId) {
	try {
		let clientId = ClientId;
		let VimeoCredentialDetails;
		let credentialDetail;
		let client;
		let flag = true;

		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [
					{
						model: VimeoCredential,
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.VimeoCredential) {
			credentialDetail = client.VimeoCredential;
		}

		if (credentialDetail && credentialDetail != null) {
			return credentialDetail;
		} else {
			return false;
		}
	} catch (error) {
		console.log('--Error in geting vimeo token----', error);
	}
};
module.exports.getClientVimeoTokenService = getClientVimeoTokenService;

const getDiwoClientVimeoTokenService = async function (ClientId) {
	try {
		let clientId = ClientId;
		let VimeoCredentialDetails;
		let credentialDetail;
		let client;
		let flag = true;

		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [
					{
						model: DiwoVimeoCredential,
					},
				],
			})
		);

		if (err) return ResponseError(res, err, 500, true);
		if (client && client.DiwoVimeoCredential) {
			credentialDetail = client.DiwoVimeoCredential;
		}

		if (credentialDetail && credentialDetail != null) {
			return credentialDetail;
		} else {
			return false;
		}
	} catch (error) {
		console.log('--Error in geting vimeo token----', error);
	}
};
module.exports.getDiwoClientVimeoTokenService = getDiwoClientVimeoTokenService;

//Run Campaign Scheduler
let Vimeo_video_trancoding_checking_status_schedulor = schedule.scheduleJob(
	'*/30 * * * * *',
	async function (fireDate) {
		console.log('Run Scheduler --->>>-->>>  Vimeo video trancoding checking status  schedulor', fireDate);
		await checkVimeoVideoisTranscodingStatus();
		await checkDiwoVimeoVideoisTranscodingStatus();
		await checkDripLearnerOfflineTaskisTranscodingStatus();
	}
);
module.exports.Vimeo_video_trancoding_checking_status_schedulor = Vimeo_video_trancoding_checking_status_schedulor;

const checkVimeoVideoisTranscodingStatus = async function () {
	try {
		[err, videoAssetList] = await to(
			Client.findAll({
				include: [
					{
						model: VimeoCredential,
					},
					{
						model: Asset,
						where: {
							field_name: 'Video',
						},
						attributes: ['id'],
						include: [
							{
								model: Asset_detail,
								where: {
									isTranscoding: false,
									displayType: 'Video',
									errorMessage: {
										[Op.eq]: null,
									},
								},
								attributes: ['id', 'isTranscoding', 'displayType', 'vmoVideoId', 'cmsVideoId'],
							},
						],
					},
				],
				attributes: ['id'],
			})
		);
		if (err) {
			console.log('-----Error Check Status Transcoding of Video----', err);
		}

		if (videoAssetList?.length > 0) {
			for (let client of videoAssetList) {
				if (
					client &&
					client.VimeoCredential &&
					(client.VimeoCredential.vToken || (client.VimeoCredential.CMSUserName && client.VimeoCredential.CMSPassword))
				) {
					for (let asset of client.Assets) {
						if (config_feature?.configurable_feature?.vimeo) {
							const config = {
								headers: {
									Authorization: `Bearer ${client.VimeoCredential.vToken}`,
								},
							};
							let videoId = asset.Asset_details[0].vmoVideoId;
							if (videoId) {
								try {
									const response = await axios.get(
										`https://api.vimeo.com/videos/${videoId}?fields=uri,upload.status,transcode.status`,
										config
									);
									if (response != null) {
										if (response.data.transcode && response.data.transcode.status.toLowerCase() == 'complete') {
											[err, updateAsset] = await to(
												Asset_detail.update(
													{
														isTranscoding: true,
													},
													{
														where: {
															id: asset.Asset_details[0].id,
														},
													}
												)
											);
											if (err) {
												console.log('--Error--When Update isTranscoding Status', err);
											}
										}
									}
								} catch (error) {
									console.log('---Video Id--', videoId);
									console.log('--Error in Check Video TransCoding Status---', error.response.data.error);
									[err, updateAsset] = await to(
										Asset_detail.update(
											{
												errorMessage: error.response.data.error,
											},
											{
												where: {
													id: asset.Asset_details[0].id,
												},
											}
										)
									);
									if (err) {
										console.log('--Error--When Update isTranscoding Status--2', err);
									}
								}
							}
						} else if (config_feature?.configurable_feature?.mediaCMS) {
							if (asset.Asset_details[0].cmsVideoId) {
								let videoId = asset.Asset_details[0].cmsVideoId;
								const checkStatus = await mediaCMSVideoTranscodingStatus(client.VimeoCredential, [videoId]);
								if (checkStatus && checkStatus.length == 1 && checkStatus[0].isTranscoding) {
									[err, updateAsset] = await to(
										Asset_detail.update(checkStatus[0], {
											where: {
												id: asset.Asset_details[0].id,
											},
										})
									);
									if (err) {
										console.log('--Error--When Update MediaCMS isTranscoding Status', err);
									}
								} else if (checkStatus == false) {
									[err, updateAsset] = await to(
										Asset_detail.update(
											{
												errorMessage: 'Error in MediaCMS video transcoding status',
											},
											{
												where: {
													id: asset.Asset_details[0].id,
												},
											}
										)
									);
									if (err) {
										console.log('--Error--When Update MediaCMS isTranscoding Status', err);
									}
								}
							} else {
								[err, updateAsset] = await to(
									Asset_detail.update(
										{
											errorMessage: 'Data not found',
										},
										{
											where: {
												id: asset.Asset_details[0].id,
											},
										}
									)
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status', err);
								}
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('--Error in Checking  vimeo Video transcoding status----', error);
	}
};
module.exports.checkVimeoVideoisTranscodingStatus = checkVimeoVideoisTranscodingStatus;

const checkDiwoVimeoVideoisTranscodingStatus = async function () {
	try {
		let sessions_;
		[err, DiwovideoAssetList] = await to(
			DiwoAsset.findAll({
				where: {
					isTranscoding: false,
					type: 'Video',
					errorMessage: {
						[Op.eq]: null,
					},
					cmsVideoId: {
						[Op.ne]: null,
					},
				},
				attributes: ['id', 'isTranscoding', 'type', 'vmoVideoId', 'WorkbookId', 'WorksheetId', 'cmsVideoId'],
				include: [
					{
						model: Client,
						include: [
							{
								model: DiwoVimeoCredential,
							},
						],
					},
				],
			})
		);
		if (err) {
			console.log('-----Error Check Status Transcoding of Diwo Video----', err);
		}

		if (DiwovideoAssetList.length > 0) {
			for (let diwoassets_ of DiwovideoAssetList) {
				if (
					diwoassets_ &&
					diwoassets_.Client &&
					diwoassets_.Client.DiwoVimeoCredential &&
					(diwoassets_.Client.DiwoVimeoCredential.vToken ||
						(diwoassets_.Client.DiwoVimeoCredential.CMSUserName && diwoassets_.Client.DiwoVimeoCredential.CMSPassword))
				) {
					if (config_feature?.configurable_feature?.vimeo) {
						const config = {
							headers: {
								Authorization: `Bearer ${diwoassets_.Client.DiwoVimeoCredential.vToken}`,
							},
						};
						let videoId = diwoassets_.vmoVideoId;
						if (videoId) {
							try {
								const response = await axios.get(
									`https://api.vimeo.com/videos/${videoId}?fields=uri,upload.status,transcode.status`,
									config
								);

								if (response != null) {
									if (response.data.transcode && response.data.transcode.status.toLowerCase() == 'complete') {
										[err, updateAsset] = await to(
											DiwoAsset.update(
												{
													isTranscoding: true,
												},
												{
													where: {
														id: diwoassets_.id,
													},
												}
											)
										);
										if (err) {
											console.log('--Error--When Update isTranscoding Status', err);
										}

										[err, sessions_] = await to(
											Session.findAll({
												where: {
													WorkbookId: diwoassets_.WorkbookId,
												},
											})
										);
										if (err) {
											console.log('-----Error while getting session data----', err);
										}
										for (let session of sessions_) {
											workbookData = JSON.parse(session.workbookData);
											for (let worksheet_ of workbookData.Worksheets) {
												for (let asset of worksheet_.DiwoAssets) {
													if (asset.id == diwoassets_.id) {
														asset.isTranscoding = true;
													}
												}

												let data = JSON.stringify(workbookData);
												[err, updateAsset] = await to(
													Session.update(
														{ workbookData: data },
														{
															where: {
																id: session.id,
															},
														}
													)
												);
											}

											if (err) {
												console.log('-----Error while transcoding in session----', err);
											}
										}
									}
								}
							} catch (error) {
								console.log('----Diwo Video Id--', videoId);
								console.log('----Diwo When check status of Video---', error);

								[err, updateAsset] = await to(
									DiwoAsset.update(
										{
											errorMessage: error.response.data.error,
										},
										{
											where: {
												id: diwoassets_.id,
											},
										}
									)
								);
								if (err) {
									console.log('--Error--When Update isTranscoding Status', err);
								}
							}
						}
					} else if (config_feature?.configurable_feature?.mediaCMS) {
						if (diwoassets_.cmsVideoId) {
							let videoId = diwoassets_.cmsVideoId;
							const checkStatus = await mediaCMSVideoTranscodingStatus(diwoassets_.Client.DiwoVimeoCredential, [
								videoId,
							]);
							if (checkStatus && checkStatus.length == 1 && checkStatus[0]?.isTranscoding) {
								[err, updateAsset] = await to(
									DiwoAsset.update(checkStatus[0], {
										where: {
											id: diwoassets_.id,
										},
									})
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status', err);
								}

								[err, updatesesionAsset] = await to(
									SessionAsset.update(checkStatus[0], {
										where: {
											cmsVideoId: diwoassets_.cmsVideoId,
										},
									})
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status in SessionAsset', err);
								}
							} else if (checkStatus == false) {
								[err, updateAsset] = await to(
									DiwoAsset.update(
										{
											errorMessage: 'Error in MediaCMS video transcoding status',
										},
										{
											where: {
												id: diwoassets_.id,
											},
										}
									)
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status', err);
								}

								[err, updatesesionAsset] = await to(
									SessionAsset.update(
										{
											errorMessage: 'Error in MediaCMS video transcoding status in SessionAsset',
										},
										{
											where: {
												cmsVideoId: diwoassets_.cmsVideoId,
											},
										}
									)
								);

								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status in SessionAsset', err);
								}
							}
						} else {
							[err, updateAsset] = await to(
								DiwoAsset.update(
									{
										errorMessage: 'Data not found',
									},
									{
										where: {
											id: diwoassets_.id,
										},
									}
								)
							);
							if (err) {
								console.log('--Error--When Update MediaCMS isTranscoding Status', err);
							}

							[err, updatesesionAsset] = await to(
								SessionAsset.update(
									{
										errorMessage: 'Data not found',
									},
									{
										where: {
											cmsVideoId: diwoassets_.cmsVideoId,
										},
									}
								)
							);
							if (err) {
								console.log('--Error--When Update MediaCMS isTranscoding Status in SessionAsset', err);
							}
						}
					}
				}
			}
		}

		//////Uploaded by Learner in the offline task
		[err, getAllUploadedData] = await to(
			SessionQuestionSubmission.findAll({
				where: {
					type: 'Video',
					isTranscoding: false,
					errorMessage: {
						[Op.eq]: null,
					},
					UploadedOnS3: false,
				},
				attributes: [
					'id',
					'vimeoPath',
					'vmoVideoId',
					'DiwoVimeoCredentialId',
					'isTranscoding',
					'errorMessage',
					'cmsVideoId',
				],
				include: [
					{ model: DiwoVimeoCredential, required: true, attributes: ['id', 'vToken', 'CMSUserName', 'CMSPassword'] },
				],
			})
		);
		if (err) {
			console.log('-------Error Error------', err);
		}

		if (getAllUploadedData?.length > 0) {
			for (let uploadedFile of getAllUploadedData) {
				if (config_feature?.configurable_feature?.vimeo) {
					if (uploadedFile.vmoVideoId && uploadedFile.DiwoVimeoCredential.vToken) {
						const config = {
							headers: {
								Authorization: `Bearer ${uploadedFile.DiwoVimeoCredential.vToken}`,
							},
						};
						let videoId = uploadedFile.vmoVideoId;

						if (videoId) {
							try {
								const response = await axios.get(
									`https://api.vimeo.com/videos/${videoId}?fields=uri,upload.status,transcode.status`,
									config
								);

								if (response != null) {
									if (response.data.transcode && response.data.transcode.status.toLowerCase() == 'complete') {
										[err, updateVideoStatus] = await to(
											SessionQuestionSubmission.update(
												{
													isTranscoding: true,
												},
												{
													where: {
														id: uploadedFile.id,
													},
												}
											)
										);
									}
								}
							} catch (error) {
								console.log('------Error When Check Videmo vimeo Video Status--------', error);
							}
						}
					} else {
						[err, updateAsset] = await to(
							SessionQuestionSubmission.update(
								{
									errorMessage: 'Data not found',
								},
								{
									where: {
										id: uploadedFile.id,
									},
								}
							)
						);
						if (err) {
							console.log('--Error--When Update Vimeo isTranscoding Status', err);
						}
					}
				} else if (config_feature?.configurable_feature?.mediaCMS) {
					if (uploadedFile.cmsVideoId) {
						let videoId = uploadedFile.cmsVideoId;
						const checkStatus = await mediaCMSVideoTranscodingStatus(uploadedFile.DiwoVimeoCredential, [videoId]);
						if (checkStatus && checkStatus.length == 1 && checkStatus[0].isTranscoding) {
							[err, updateAsset] = await to(
								SessionQuestionSubmission.update(checkStatus[0], {
									where: {
										id: uploadedFile.id,
									},
								})
							);
							if (err) {
								console.log('--Error--When Update MediaCMS isTranscoding Status', err);
							}
						} else if (checkStatus == false) {
							[err, updateAsset] = await to(
								SessionQuestionSubmission.update(
									{
										errorMessage: 'Error in MediaCMS video transcoding status',
									},
									{
										where: {
											id: uploadedFile.id,
										},
									}
								)
							);
							if (err) {
								console.log('--Error--When Update MediaCMS isTranscoding Status', err);
							}
						}
					} else {
						[err, updateAsset] = await to(
							SessionQuestionSubmission.update(
								{
									errorMessage: 'Data not found',
								},
								{
									where: {
										id: uploadedFile.id,
									},
								}
							)
						);
						if (err) {
							console.log('--Error--When Update MediaCMS isTranscoding Status', err);
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('--Error in Checking  vimeo Video transcoding status----', error);
	}
};
module.exports.checkDiwoVimeoVideoisTranscodingStatus = checkDiwoVimeoVideoisTranscodingStatus;

const checkDripLearnerOfflineTaskisTranscodingStatus = async function () {
	try {
		[err, getAllData] = await to(
			UserBriefFile.findAll({
				where: {
					isTranscoding: false,
					fileType: 'Video',
					errorMessage: {
						[Op.eq]: null,
					},
					UploadedOnS3: false,
				},
				include: [
					{
						model: Campaign,
						include: [
							{
								model: Client,
								include: [
									{
										model: VimeoCredential,
										attributes: ['id', 'vToken', 'CMSUserName', 'CMSPassword'],
									},
								],
								attributes: ['id', 'VimeoCredentialId'],
							},
						],
						attributes: ['id', 'ClientId'],
					},
				],
				attributes: ['id', 'CampaignId', 'isTranscoding', 'videoId', 'errorMessage', 'cmsVideoId'],
			})
		);
		if (err) console.log('---Error When Get All IsTanscoding False VIdeo List--', err);

		if (getAllData && getAllData.length > 0) {
			for (let file of getAllData) {
				if (
					file &&
					file.Campaign &&
					file.Campaign.Client &&
					file.Campaign.Client.VimeoCredential &&
					((file.Campaign.Client.VimeoCredential.vToken && file.videoId) ||
						(file.Campaign.Client.VimeoCredential.CMSUserName &&
							file.Campaign.Client.VimeoCredential.CMSPassword &&
							file.cmsVideoId))
				) {
					if (config_feature?.configurable_feature?.vimeo) {
						let videoId = file.videoId;
						if (videoId != null && videoId != '') {
							try {
								const config = {
									headers: {
										Authorization: `Bearer ${file.Campaign.Client.VimeoCredential.vToken}`,
									},
								};
								const response = await axios.get(
									`https://api.vimeo.com/videos/${videoId}?fields=uri,upload.status,transcode.status`,
									config
								);

								if (response != null) {
									if (response.data.transcode && response.data.transcode.status.toLowerCase() == 'complete') {
										[err, updateAsset] = await to(
											UserBriefFile.update(
												{
													isTranscoding: true,
												},
												{
													where: {
														id: file.id,
													},
												}
											)
										);
										if (err) {
											console.log('--Error--When Update isTranscoding Status', err);
										}
									}
								}
							} catch (error) {
								console.log('----Drip Video Id--', videoId);
								console.log('----Drip When check status of learner Uploaded Asset Video---', error);

								[err, updateAsset] = await to(
									UserBriefFile.update(
										{
											errorMessage: error.response.data.error,
										},
										{
											where: {
												id: file.id,
											},
										}
									)
								);
								if (err) {
									console.log('--Error--When Update isTranscoding Status', err);
								}
							}
						}
					} else if (config_feature?.configurable_feature?.mediaCMS) {
						if (file.cmsVideoId) {
							let videoId = file.cmsVideoId;
							const checkStatus = await mediaCMSVideoTranscodingStatus(file.Campaign.Client.VimeoCredential, [videoId]);
							if (checkStatus && checkStatus.length == 1 && checkStatus[0].isTranscoding == true) {
								[err, updateAsset] = await to(
									UserBriefFile.update(checkStatus[0], {
										where: {
											id: file.id,
										},
									})
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status', err);
								}
							} else if (checkStatus == false) {
								[err, updateAsset] = await to(
									UserBriefFile.update(
										{
											errorMessage: 'Error in MediaCMS video transcoding status',
										},
										{
											where: {
												id: file.id,
											},
										}
									)
								);
								if (err) {
									console.log('--Error--When Update MediaCMS isTranscoding Status', err);
								}
							}
						} else {
							[err, updateAsset] = await to(
								UserBriefFile.update(
									{
										errorMessage: 'Data not found',
									},
									{
										where: {
											id: file.id,
										},
									}
								)
							);
							if (err) {
								console.log('--Error--When Update MediaCMS isTranscoding Status', err);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('---Error When Check Drip Learner Offline Task Video IsTranscoding---', error);
	}
};
module.exports.checkDripLearnerOfflineTaskisTranscodingStatus = checkDripLearnerOfflineTaskisTranscodingStatus;

//////////// MediaCMS Video Transcoding Status //////////////
// This function checks the transcoding status of videos in MediaCMS.

const mediaCMSVideoTranscodingStatus = async function (CMSDetails, videoIds) {
	try {
		let videoStatus = [];
		if (videoIds.length > 0) {
			const auth = {
				username: CMSDetails.CMSUserName,
				password: CMSDetails.CMSPassword,
			};
			for (let videoId of videoIds) {
				const url = `${CONFIG.media_cms_url}/api/v1/media/${videoId}`;

				const response = await axios.get(url, { auth });
				console.log(
					'--->>>-->>>  MediaCMS video transcoding successful for videoId Status:',
					response.data.encoding_status
				);
				if (response?.data?.encoding_status === 'success') {
					console.log('--->>>-->>>  MediaCMS video transcoding successful for videoId:', videoId);
					if (response?.data?.hls_info?.master_file) {
						videoStatus.push({
							isTranscoding: true,
							path: `${CONFIG.media_cms_url}${response.data.hls_info.master_file}`,
							cmsVideoId: videoId,
						});
					} else {
						// return null;
					}
				} else if (response?.data?.encoding_status === 'pending') {
					// return null;
				} else {
					//send As a Error message to the asset table
					return false;
				}
			}
		}
		return videoStatus;
	} catch (error) {
		console.error('Error in mediaCMSVideoTranscodingStatus:', error.message || error);
		return false;
	}
};
module.exports.mediaCMSVideoTranscodingStatus = mediaCMSVideoTranscodingStatus;
