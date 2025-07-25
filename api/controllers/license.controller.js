const { Op, Client, License, sequelize, Client_job_role, Country, DiwoLicense } =
	require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];

const { getLearnerValidaionOnCreateLearner } = require('../services/license.service');
const { getAllSubChildClientIds } = require('../services/client.service');
const { capitalFirstLatter } = require('../services/auth.service');
const { createlog } = require('../services/log.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');

// Get  Clients By Name
const geAllClientWithoutLicenseById = async function (req, res) {
	try {
		let err, ClientsDetail;
		let ChildClientId = req.params.clientId;
		let clientIds = [];
		let type = req.query.type;
		let lisenseDetail;

		if (type == 'drip') {
			[err, lisenseDetail] = await to(
				License.findAll({
					attributes: ['ClientId'],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			if (lisenseDetail && lisenseDetail.length > 0) {
				for (let lisense of lisenseDetail) {
					clientIds.push(lisense.ClientId);
				}
				clientIds.push(1);
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: {
							[Op.notIn]: clientIds,
						},
						DripAccess: true,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, lisenseDetail] = await to(
				DiwoLicense.findAll({
					attributes: ['ClientId'],
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			if (lisenseDetail && lisenseDetail.length > 0) {
				for (let lisense of lisenseDetail) {
					clientIds.push(lisense.ClientId);
				}
				clientIds.push(1);
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						id: {
							[Op.notIn]: clientIds,
						},
						DiwoAccess: true,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: ClientsDetail,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.geAllClientWithoutLicenseById = geAllClientWithoutLicenseById;

//Create License
const createLicense = async function (req, res) {
	try {
		let err, create_license;
		let licenseDetails;
		let type = req.user.type;

		if (type == 'drip') {
			const dripLicenseSchema = Joi.object({
				id: Joi.number().integer().positive().allow(null).required(),
				title: Joi.string().trim().max(validationConstant.title.max).required(),
				description: Joi.string().trim().max(1000).allow(null).allow(''),
				ClientId: Joi.number().integer().positive().required(),
				startDate: Joi.date().required(),
				endDate: Joi.date().required(),
				learnerCount: Joi.number().integer().positive().allow(null, 0),
				unlLearner: Joi.boolean().allow(null),
				whatsAppCount: Joi.number().integer().positive().allow(null, 0),
				whatsAppUnl: Joi.boolean().required(),
				sharWhatsAppCount: Joi.number().integer().positive().allow(null, 0),
				sharWhatsAppUnl: Joi.boolean().required(),
				onlyEmailCount: Joi.number().integer().positive().allow(null, 0).required(),
				onlyEmailUnl: Joi.boolean().required(),
				emailCount: Joi.number().integer().positive().allow(null, 0).required(),
				emailUnl: Joi.boolean().required(),
				dripappCount: Joi.number().integer().positive().allow(null, 0).required(),
				dripappUnl: Joi.boolean().required(),
				serverStrgCount: Joi.number().integer().positive().allow(null, 0),
				serverStorageUnl: Joi.boolean().required(),
				dataTransferCount: Joi.number().integer().positive().allow(null, 0),
				dataTransferUnl: Joi.boolean().required(),
				onlyTeamCount: Joi.number().integer().positive().allow(null, 0),
				dripWithTeamCount: Joi.number().integer().positive().allow(null, 0),
				onlyTeamUnl: Joi.boolean().required(),
				dripWithTeamUnl: Joi.boolean().required(),
				isSuspended: Joi.boolean(),
			});

			const { error, value } = dripLicenseSchema.validate(req.body.LicenseDetails);
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			licenseDetails = value;

			// //check Client Access
			if (!(await checkClientIdAccess(req.user.ClientId, licenseDetails.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		} else if (type == 'diwo') {
			const diwoLicenseSchema = Joi.object({
				id: Joi.number().integer().positive().allow(null).required(),
				title: Joi.string().trim().max(255).required(),
				description: Joi.string().trim().max(1000).allow(null).allow(''),
				ClientId: Joi.number().integer().positive().required(),
				startDate: Joi.date().required(),
				endDate: Joi.date().required(),
				learnerCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedLearner: Joi.boolean().required(),
				workbookCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedWorkbook: Joi.boolean().required(),
				serverStorageCount: Joi.number().integer().positive().allow(null, 0),
				UnlimitedServerStor: Joi.boolean().required(),
				DataTransferCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedDataTransfer: Joi.boolean().required(),
				isSuspended: Joi.boolean(),
			});

			const { error, value } = diwoLicenseSchema.validate(req.body.LicenseDetails);
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			licenseDetails = value;

			// //check Client Access
			if (!(await checkClientIdAccess(req.user.ClientId, licenseDetails.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		if (type == 'drip') {
			licenseDetails.learnerCount = parseInt(licenseDetails.learnerCount);
			licenseDetails.whatsAppCount = parseInt(licenseDetails.whatsAppCount);
			licenseDetails.sharWhatsAppCount = parseInt(licenseDetails.sharWhatsAppCount);
			licenseDetails.emailCount = parseInt(licenseDetails.emailCount);
			licenseDetails.dripappCount = parseInt(licenseDetails.dripappCount);
			licenseDetails.serverStrgCount = parseInt(licenseDetails.serverStrgCount);
			licenseDetails.dataTransferCount = parseInt(licenseDetails.dataTransferCount);

			if (
				licenseDetails.unlLearner == true &&
				licenseDetails.whatsAppUnl == true &&
				licenseDetails.sharWhatsAppUnl == true &&
				licenseDetails.emailUnl == true &&
				licenseDetails.dripappUnl == true &&
				licenseDetails.onlyTeamUnl == true &&
				licenseDetails.dripWithTeamUnl == true &&
				licenseDetails.onlyEmailUnl == true &&
				licenseDetails.serverStorageUnl == true &&
				licenseDetails.dataTransferUnl == true
			) {
				licenseDetails.dripVolume = 'Unlimited';
			} else if (
				licenseDetails.unlLearner == null &&
				licenseDetails.whatsAppUnl == null &&
				licenseDetails.sharWhatsAppUnl == null &&
				licenseDetails.emailUnl == null &&
				licenseDetails.dripappUnl == null &&
				licenseDetails.onlyTeamUnl == null &&
				licenseDetails.dripWithTeamUnl == null &&
				licenseDetails.onlyEmailUnl == null &&
				licenseDetails.serverStorageUnl == null &&
				licenseDetails.dataTransferUnl == null
			) {
				licenseDetails.dripVolume = 'Limited';
			} else {
				licenseDetails.dripVolume = 'Custom';
			}

			const startDate = moment(new Date(licenseDetails.startDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const endDate = moment(new Date(licenseDetails.endDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (today >= startDate && today <= endDate) {
				licenseDetails.status = 'Active';
			} else if (today < startDate) {
				licenseDetails.status = 'Upcoming';
			} else if (today > endDate) {
				licenseDetails.status = 'Expired';
			}

			licenseDetails.startDate = moment(new Date(licenseDetails.startDate)).format();
			licenseDetails.endDate = moment(new Date(licenseDetails.endDate)).format();

			licenseDetails.title = await capitalFirstLatter(licenseDetails.title);

			[err, create_license] = await to(License.create(licenseDetails));
			if (err) return ResponseError(res, err, 500, true);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						LicenseId: create_license.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			return ResponseSuccess(res, {
				data: create_license,
			});
		} else if (type == 'diwo') {
			licenseDetails.learnerCount = parseInt(licenseDetails.learnerCount);
			licenseDetails.workbookCount = parseInt(licenseDetails.workbookCount);
			licenseDetails.serverStorageCount = parseInt(licenseDetails.serverStorageCount);
			licenseDetails.DataTransferCount = parseInt(licenseDetails.DataTransferCount);

			if (
				licenseDetails.unlimitedLearner == true &&
				licenseDetails.unlimitedWorkbook == true &&
				licenseDetails.UnlimitedServerStor == true &&
				licenseDetails.unlimitedDataTransfer == true
			) {
				licenseDetails.diwoVolume = 'Unlimited';
			} else if (
				licenseDetails.unlimitedLearner == false &&
				licenseDetails.unlimitedWorkbook == false &&
				licenseDetails.UnlimitedServerStor == false &&
				licenseDetails.unlimitedDataTransfer == false
			) {
				licenseDetails.diwoVolume = 'Limited';
			} else {
				licenseDetails.diwoVolume = 'Custom';
			}

			const startDate = moment(new Date(licenseDetails.startDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const endDate = moment(new Date(licenseDetails.endDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (today >= startDate && today <= endDate) {
				licenseDetails.status = 'Active';
			} else if (today < startDate) {
				licenseDetails.status = 'Upcoming';
			} else if (today > endDate) {
				licenseDetails.status = 'Expired';
			}

			licenseDetails.startDate = moment(new Date(licenseDetails.startDate)).format();
			licenseDetails.endDate = moment(new Date(licenseDetails.endDate)).format();

			licenseDetails.title = await capitalFirstLatter(licenseDetails.title);

			[err, create_license] = await to(DiwoLicense.create(licenseDetails));
			if (err) return ResponseError(res, err, 500, true);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Create License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						DiwoLicenseId: create_license.id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			return ResponseSuccess(res, {
				data: create_license,
			});
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createLicense = createLicense;

//Update License
const updateLicense = async function (req, res) {
	try {
		const schema = Joi.object({ id: Joi.number().integer().positive().required() });
		const { error, value } = schema.validate({
			id: parseInt(req.params.id),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { id } = value;

		let type = req.user.type;
		let licenseDetails;

		if (type == 'drip') {
			const dripLicenseSchema = Joi.object({
				id: Joi.number().integer().positive().required(),
				title: Joi.string().trim().max(validationConstant.title.max).required(),
				description: Joi.string().trim().max(1000).allow(null).allow(''),
				ClientId: Joi.number().integer().positive().required(),
				startDate: Joi.date().required(),
				endDate: Joi.date().required(),
				learnerCount: Joi.number().integer().positive().allow(null, 0),
				unlLearner: Joi.boolean().allow(null),
				whatsAppCount: Joi.number().integer().positive().allow(null, 0),
				whatsAppUnl: Joi.boolean().required(),
				sharWhatsAppCount: Joi.number().integer().positive().allow(null, 0),
				sharWhatsAppUnl: Joi.boolean().required(),
				onlyEmailCount: Joi.number().integer().positive().allow(null, 0).required(),
				onlyEmailUnl: Joi.boolean().required(),
				emailCount: Joi.number().integer().positive().allow(null, 0).required(),
				emailUnl: Joi.boolean().required(),
				dripappCount: Joi.number().integer().positive().allow(null, 0).required(),
				dripappUnl: Joi.boolean().required(),
				serverStrgCount: Joi.number().integer().positive().allow(null, 0),
				serverStorageUnl: Joi.boolean().required(),
				dataTransferCount: Joi.number().integer().positive().allow(null, 0),
				dataTransferUnl: Joi.boolean().required(),
				onlyTeamCount: Joi.number().integer().positive().allow(null, 0),
				dripWithTeamCount: Joi.number().integer().positive().allow(null, 0),
				onlyTeamUnl: Joi.boolean().required(),
				dripWithTeamUnl: Joi.boolean().required(),
				isSuspended: Joi.boolean().required(),
			});

			const { error, value } = dripLicenseSchema.validate(req.body.LicenseDetails);
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			licenseDetails = value;

			// //check Client Access
			if (!(await checkClientIdAccess(req.user.ClientId, licenseDetails.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		} else if (type == 'diwo') {
			const diwoLicenseSchema = Joi.object({
				id: Joi.number().integer().positive().required(),
				title: Joi.string().trim().max(255).required(),
				description: Joi.string().trim().max(1000).allow(null).allow(''),
				ClientId: Joi.number().integer().positive().required(),
				startDate: Joi.date().required(),
				endDate: Joi.date().required(),
				learnerCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedLearner: Joi.boolean().required(),
				workbookCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedWorkbook: Joi.boolean().required(),
				serverStorageCount: Joi.number().integer().positive().allow(null, 0),
				UnlimitedServerStor: Joi.boolean().required(),
				DataTransferCount: Joi.number().integer().positive().allow(null, 0),
				unlimitedDataTransfer: Joi.boolean().required(),
				isSuspended: Joi.boolean().required(),
			});

			const { error, value } = diwoLicenseSchema.validate(req.body.LicenseDetails);
			if (error) return ResponseError(res, { message: error.details[0].message }, 400);

			licenseDetails = value;

			// //check Client Access
			if (!(await checkClientIdAccess(req.user.ClientId, licenseDetails.ClientId))) {
				return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
			}
		}

		let err;
		// let licenseDetails = req.body.LicenseDetails;
		// let id = req.params.clientId;

		let license;

		if (type == 'drip') {
			licenseDetails.learnerCount = parseInt(licenseDetails.learnerCount);
			licenseDetails.whatsAppCount = parseInt(licenseDetails.whatsAppCount);
			licenseDetails.sharWhatsAppCount = parseInt(licenseDetails.sharWhatsAppCount);
			licenseDetails.emailCount = parseInt(licenseDetails.emailCount);
			licenseDetails.dripappCount = parseInt(licenseDetails.dripappCount);
			licenseDetails.serverStrgCount = parseInt(licenseDetails.serverStrgCount);
			licenseDetails.dataTransferCount = parseInt(licenseDetails.dataTransferCount);

			if (
				licenseDetails.unlLearner == true &&
				licenseDetails.whatsAppUnl == true &&
				licenseDetails.sharWhatsAppUnl == true &&
				licenseDetails.emailUnl == true &&
				licenseDetails.dripappUnl == true &&
				licenseDetails.onlyTeamUnl == true &&
				licenseDetails.dripWithTeamUnl == true &&
				licenseDetails.onlyEmailUnl == true &&
				licenseDetails.serverStorageUnl == true &&
				licenseDetails.dataTransferUnl == true
			) {
				licenseDetails.dripVolume = 'Unlimited';
			} else if (
				licenseDetails.unlLearner == null &&
				licenseDetails.whatsAppUnl == null &&
				licenseDetails.sharWhatsAppUnl == null &&
				licenseDetails.emailUnl == null &&
				licenseDetails.dripappUnl == null &&
				licenseDetails.serverStorageUnl == null &&
				licenseDetails.dataTransferUnl == null
			) {
				licenseDetails.dripVolume = 'Limited';
			} else {
				licenseDetails.dripVolume = 'Custom';
			}

			const startDate = moment(new Date(licenseDetails.startDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const endDate = moment(new Date(licenseDetails.endDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (licenseDetails.isSuspended == false) {
				if (today >= startDate && today <= endDate) {
					licenseDetails.status = 'Active';
				} else if (today < startDate) {
					licenseDetails.status = 'Upcoming';
				} else if (today > endDate) {
					licenseDetails.status = 'Expired';
				}
			}

			licenseDetails.startDate = moment(new Date(licenseDetails.startDate)).format();
			licenseDetails.endDate = moment(new Date(licenseDetails.endDate)).format();

			[err, LicenseDetail] = await to(
				License.findOne({
					where: {
						id: id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (LicenseDetail) {
				license = LicenseDetail.convertToJSON();
			}

			let flag = true;
			if (license && license.status == 'Expired') {
				if (!licenseDetails.unlLearner) {
					if (license.learnerCount >= licenseDetails.learnerCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
				if (!licenseDetails.whatsAppUnl) {
					if (license.whatsAppCount >= licenseDetails.whatsAppCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
				if (!licenseDetails.sharWhatsAppUnl) {
					if (license.sharWhatsAppCount >= licenseDetails.sharWhatsAppCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
				if (!licenseDetails.emailUnl) {
					if (license.emailCount >= licenseDetails.emailCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
				if (!licenseDetails.dripappUnl) {
					if (license.dripappCount >= licenseDetails.dripappCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
			}

			licenseDetails.title = await capitalFirstLatter(licenseDetails.title);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Update License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						LicenseId: id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			if (flag) {
				[err, update_license] = await to(
					License.update(licenseDetails, {
						where: {
							id: id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				return ResponseSuccess(res, {
					data: update_license,
				});
			}
		} else if (type == 'diwo') {
			licenseDetails.learnerCount = parseInt(licenseDetails.learnerCount);
			licenseDetails.workbookCount = parseInt(licenseDetails.workbookCount);
			licenseDetails.serverStorageCount = parseInt(licenseDetails.serverStorageCount);
			licenseDetails.DataTransferCount = parseInt(licenseDetails.DataTransferCount);

			if (
				licenseDetails.unlimitedLearner == true &&
				licenseDetails.unlimitedWorkbook == true &&
				licenseDetails.UnlimitedServerStor == true &&
				licenseDetails.unlimitedDataTransfer == true
			) {
				licenseDetails.diwoVolume = 'Unlimited';
			} else if (
				licenseDetails.unlimitedLearner == false &&
				licenseDetails.unlimitedWorkbook == false &&
				licenseDetails.UnlimitedServerStor == false &&
				licenseDetails.unlimitedDataTransfer == false
			) {
				licenseDetails.diwoVolume = 'Limited';
			} else {
				licenseDetails.diwoVolume = 'Custom';
			}

			const startDate = moment(new Date(licenseDetails.startDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const endDate = moment(new Date(licenseDetails.endDate).toISOString().split('T')[0]).format('YYYY-MM-DD');
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (today >= startDate && today <= endDate) {
				licenseDetails.status = 'Active';
			} else if (today < startDate) {
				licenseDetails.status = 'Upcoming';
			} else if (today > endDate) {
				licenseDetails.status = 'Expired';
			}

			licenseDetails.startDate = moment(new Date(licenseDetails.startDate)).format();
			licenseDetails.endDate = moment(new Date(licenseDetails.endDate)).format();

			[err, LicenseDetail] = await to(
				DiwoLicense.findOne({
					where: {
						id: id,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (LicenseDetail) {
				license = LicenseDetail.convertToJSON();
			}

			let flag = true;
			if (license && license.status == 'Expired') {
				if (!licenseDetails.unlimitedLearner) {
					if (license.learnerCount >= licenseDetails.learnerCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
				if (!licenseDetails.unlimitedWorkbook) {
					if (license.workbookCount >= licenseDetails.workbookCount) {
						flag = false;
						return ResponseError(res, {
							message: MESSAGE.LICENSE_COUNT_INCRASE,
						});
					}
				}
			}

			licenseDetails.title = await capitalFirstLatter(licenseDetails.title);

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Update License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						DiwoLicenseId: id,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			if (flag) {
				[err, update_license] = await to(
					DiwoLicense.update(licenseDetails, {
						where: {
							id: id,
						},
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				return ResponseSuccess(res, {
					data: update_license,
				});
			}
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateLicense = updateLicense;

//Suspend Client License
const suspendClientLicense = async function (req, res) {
	try {
		const schema = Joi.object({
			licenseId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			licenseId: parseInt(req.params.licenseId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { licenseId } = value;

		// let licenseId = parseInt(req.params.licenseId);
		let type = req.user.type;

		if (type == 'drip') {
			[err, updateSuspendedClient] = await to(
				License.update(
					{
						isSuspended: true,
						status: 'Suspended',
					},
					{
						where: {
							id: licenseId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, updateSuspendedClient] = await to(
				DiwoLicense.update(
					{
						isSuspended: true,
						status: 'Suspended',
					},
					{
						where: {
							id: licenseId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Suspend License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						LicenseId: licenseId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (req.user.type === 'diwo') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Suspend License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						DiwoLicenseId: licenseId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			message: MESSAGE.LICENSE_SUSPENDED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.suspendClientLicense = suspendClientLicense;

//Activate Suspend Client License
const activateSuspendedClientLicense = async function (req, res) {
	try {
		const schema = Joi.object({
			licenseId: Joi.number().integer().positive().required(),
		});

		const { error, value } = schema.validate({
			licenseId: parseInt(req.params.licenseId),
		});

		if (error) {
			res.status(400).json({ error: error.details });
		}

		const { licenseId } = value;

		// let licenseId = req.params.licenseId;
		let type = req.user.type;
		let status;
		let message;

		if (type == 'drip') {
			[err, LicenseDetail] = await to(
				License.findOne({
					where: {
						id: licenseId,
					},
				})
			);

			let license = LicenseDetail.convertToJSON();
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (today > license.endDate) {
				status = 'Expired';
				message = 'License expired!';
			} else {
				status = 'Active';
				message = 'License activated!';
			}

			if (err) return ResponseError(res, err, 500, true);

			[err, updateSuspendedClient] = await to(
				License.update(
					{
						isSuspended: false,
						status: status,
					},
					{
						where: {
							id: licenseId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, DiwoLicenseDetail] = await to(
				DiwoLicense.findOne({
					where: {
						id: licenseId,
					},
				})
			);

			let license = DiwoLicenseDetail.convertToJSON();
			const today = moment(new Date()).format('YYYY-MM-DD');

			if (today > license.endDate) {
				status = 'Expired';
				message = 'License expired!';
			} else {
				status = 'Active';
				message = 'License activated!';
			}

			if (err) return ResponseError(res, err, 500, true);

			[err, updateSuspendedClient] = await to(
				DiwoLicense.update(
					{
						isSuspended: false,
						status: status,
					},
					{
						where: {
							id: licenseId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		if (req.user.type === 'drip') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Activate License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						LicenseId: licenseId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (req.user.type === 'diwo') {
			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Activate License`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						DiwoLicenseId: licenseId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
		return ResponseSuccess(res, {
			message: MESSAGE.LICENSE_ACTIVATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.activateSuspendedClientLicense = activateSuspendedClientLicense;

// Get  Clients with Licence
const geAllClientwithLicense = async function (req, res) {
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
		let offset = (page - 1) * limit;
		// let clientId = parseInt(req.params.clientId);
		// let type = req.query.type;
		// console.log('------clientId-----', clientId);
		let subClientIds = await getAllSubChildClientIds(clientId);
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let LicenseDetail;

		if (type == 'drip') {
			[err, LicenseDetail] = await to(
				License.findAndCountAll({
					distinct: true,
					include: [
						{
							model: Client,
							where: {
								id: subClientIds,
							},
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'desc']],
				})
			);
		} else if (type == 'diwo') {
			[err, LicenseDetail] = await to(
				DiwoLicense.findAndCountAll({
					distinct: true,
					include: [
						{
							model: Client,
							where: {
								id: subClientIds,
							},
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'desc']],
				})
			);
		}

		let list = [];
		if (LicenseDetail && LicenseDetail.rows && LicenseDetail.rows.length > 0) {
			for (let License of LicenseDetail.rows) {
				let license_ = License.convertToJSON();
				list.push(license_);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: list,
			count: LicenseDetail.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.geAllClientwithLicense = geAllClientwithLicense;

// Get  Single Clients with Licence
const getSingleClientbyClientId = async function (req, res) {
	try {
		let clientId = req.params.clientId;
		let type = req.query.type;
		if (type == 'drip') {
			[err, client] = await to(
				License.findOne({
					where: {
						id: clientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, client] = await to(
				DiwoLicense.findOne({
					where: {
						id: clientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: client,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSingleClientbyClientId = getSingleClientbyClientId;

// Get  Single Clients with Licence
const getClientViewSubscriptionbyClientId = async function (req, res) {
	try {
		let clientId = req.params.clientId;
		let payload;
		let finalArrayOfClient = [];

		// let type = req.params.type;
		let type = req.user.type;
		//Check Project Type
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: MESSAGE.INVALID_TYPE_PARAMETER }, 500);
		}

		if (type == 'drip') {
			[err, clientLicense] = await to(
				License.findOne({
					where: {
						ClientId: clientId,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			[err, client_details] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (client_details) {
				let client = client_details;
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
						include: [
							{
								model: Client_job_role,
							},
							{
								model: Country,
								through: 'Client_country_mapping',
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				} else {
					client_.Parent_client = null;
				}
				finalArrayOfClient.push(client_);
			}

			payload = {
				license: clientLicense,
				client: finalArrayOfClient,
			};
		} else if (type == 'diwo') {
			[err, clientLicense] = await to(
				DiwoLicense.findOne({
					where: {
						ClientId: clientId,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			[err, client_details] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (client_details) {
				let client = client_details;
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
						include: [
							{
								model: Client_job_role,
							},
							{
								model: Country,
								through: 'Client_country_mapping',
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClientsDetail) {
					client_.Parent_client = parentClientsDetail.convertToJSON();
				} else {
					client_.Parent_client = null;
				}
				finalArrayOfClient.push(client_);
			}

			payload = {
				license: clientLicense,
				client: finalArrayOfClient,
			};
		}

		// console.log("clientLicense",payload);
		return ResponseSuccess(res, {
			data: payload,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getClientViewSubscriptionbyClientId = getClientViewSubscriptionbyClientId;

//validation to add learner

// const getAddLearnerRestrict = async function (req, res) {
//     try {
//         let clientId = req.params.clientId;

//         let allClientLicense = await getLearnerValidaionOnCreateLearner(clientId);

//         if (allClientLicense == true) {
//             return ResponseSuccess(res, { data: true });
//         }
//         else {
//             return ResponseSuccess(res, { data: false });

//         }

//     } catch (error) {
//         return ResponseError(res, error, 500, true);
//     }
// }
// module.exports.getAddLearnerRestrict = getAddLearnerRestrict;

const getAllSearchLicenseByClientId = async function (req, res) {
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

		let err, clientDetail;
		let searchKey = req.body.searchKey;
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let client_Id = [];
		let whereCondition = [];
		let clientLicenseDetail;
		let LicenseDetail;
		let selectedDate = req.body.selectedDate;
		let whereConditionForClient = [];
		let UpdatedLicenseId = [];
		let UpdatedLicenses;
		// let type = req.query.type;
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		let dateCondition = [];
		dateCondition.push({
			startDate: {
				[Op.ne]: null,
			},
		});

		if (selectedDate.startDate != null && selectedDate.endDate != null) {
			dateCondition.push({
				startDate: {
					[Op.between]: [selectedDate.startDate, selectedDate.endDate],
				},
			});
		}

		if (filterColumn.indexOf('name') > -1 || filterColumn.indexOf('client_id') > -1) {
			if (filterColumn.indexOf('name') > -1) {
				whereConditionForClient.push({
					name: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				});
			}
			if (filterColumn.indexOf('client_id') > -1) {
				whereConditionForClient.push({
					client_id: {
						[sequelize.Op.iLike]: '%' + searchKey + '%',
					},
				});
			}

			[err, clientDetail] = await to(
				Client.findAll({
					where: {
						[sequelize.Op.or]: whereConditionForClient,
					},
					order: [['createdAt', 'desc']],
				})
			);

			if (clientDetail && clientDetail.length > 0) {
				for (let client of clientDetail) {
					client_Id.push(client.id);
				}
			}

			if (err) return ResponseError(res, err, 500, true);
		}

		if (filterColumn.indexOf('title') > -1) {
			whereCondition.push({
				title: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('dripVolume') > -1) {
			whereCondition.push({
				dripVolume: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('diwoVolume') > -1) {
			whereCondition.push({
				diwoVolume: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('learnerCount') > -1) {
				let searchKeys = parseInt(searchKey);
				whereCondition.push({
					learnerCount: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('status') > -1) {
			whereCondition.push({
				status: {
					[sequelize.Op.iLike]: '%' + searchKey + '%',
				},
			});
		}
		if (type == 'drip') {
			if (clientDetail && clientDetail.length > 0) {
				[err, clientLicenseDetail] = await to(
					License.findAll({
						where: {
							ClientId: client_Id,
							[Op.and]: dateCondition,
						},
						include: [
							{
								model: Client,
							},
						],
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (whereCondition && whereCondition.length > 0) {
				[err, LicenseDetail] = await to(
					License.findAll({
						where: {
							[sequelize.Op.or]: whereCondition,
							[Op.and]: dateCondition,
						},
						include: [
							{
								model: Client,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else {
			if (clientDetail && clientDetail.length > 0) {
				[err, clientLicenseDetail] = await to(
					DiwoLicense.findAll({
						where: {
							ClientId: client_Id,
							[Op.and]: dateCondition,
						},
						include: [
							{
								model: Client,
							},
						],
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (whereCondition && whereCondition.length > 0) {
				[err, LicenseDetail] = await to(
					DiwoLicense.findAll({
						where: {
							[sequelize.Op.or]: whereCondition,
							[Op.and]: dateCondition,
						},
						include: [
							{
								model: Client,
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let list = [];
		if (clientLicenseDetail && clientLicenseDetail.length > 0) {
			for (let clientLinces of clientLicenseDetail) {
				let flag = true;
				for (let data of list) {
					if (data.id == clientLinces.id) {
						flag = false;
					}
				}
				if (flag) {
					list.push(clientLinces);
				}
			}
		}

		if (LicenseDetail && LicenseDetail.length > 0) {
			for (let licence of LicenseDetail) {
				let flag = true;
				for (let data of list) {
					if (data.id == licence.id) {
						flag = false;
					}
				}
				if (flag) {
					list.push(licence);
				}
			}
		}

		for (let item of list) {
			let item_ = item.convertToJSON();
			UpdatedLicenseId.push(item_.id);
		}

		if (type == 'drip') {
			if (UpdatedLicenseId && UpdatedLicenseId.length > 0) {
				[err, UpdatedLicenses] = await to(
					License.findAndCountAll({
						distinct: true,
						where: {
							id: UpdatedLicenseId,
						},
						include: [
							{
								model: Client,
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else {
			if (UpdatedLicenseId && UpdatedLicenseId.length > 0) {
				[err, UpdatedLicenses] = await to(
					DiwoLicense.findAndCountAll({
						distinct: true,
						where: {
							id: UpdatedLicenseId,
						},
						include: [
							{
								model: Client,
							},
						],
						offset: offset,
						limit: limit,
						order: [['createdAt', 'desc']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let newList = [];
		if (UpdatedLicenses && UpdatedLicenses.rows && UpdatedLicenses.rows.length > 0) {
			for (let License of UpdatedLicenses.rows) {
				let license_ = License.convertToJSON();
				newList.push(license_);
			}
		}

		let count;
		if (UpdatedLicenses != undefined) {
			count = UpdatedLicenses.count;
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
module.exports.getAllSearchLicenseByClientId = getAllSearchLicenseByClientId;
