const { Notification } = require('../models1/connectionPool')['global'];
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');

const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const Sequelize = require('sequelize');

const getPopupNotification = async function (req, res) {
	try {
		const userId = req.user.id;
		[err, allnotification] = await to(
			Notification.findAll({
				where: {
					isRead: false,
					UserId: userId,
					isPopup: true,
				},
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let finalList = [];
		if (allnotification && allnotification.length > 0) {
			for (let list of allnotification) {
				finalList.push(list.convertToJSON());
			}
		}

		[err, updateAllnotification] = await to(
			Notification.update(
				{
					isRead: true,
				},
				{
					where: {
						isRead: false,
						UserId: userId,
						isPopup: true,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: finalList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getPopupNotification = getPopupNotification;

const getAllBellNotification = async function (req, res) {
	try {
		const schema = Joi.object({
			type: Joi.string().min(4).max(4).required(),
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
			type: req.user.type,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { type, limit, page } = value;

		// Check project type validity
		if (!checkProjectNameByType(type)) {
			return ResponseError(res, { message: 'Invalid project type parameter.' }, 400);
		}

		let userId;
		// const type = req.params.type;
		let finalList = [];
		let allnotification = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		if (req && req.user && req.user.id) {
			userId = req.user.id;
		} else if (req && req.query && req.query.userId) {
			userId = req.query.userId;
		}
		if (userId) {
			if (type == 'drip') {
				[err, allnotification] = await to(
					Notification.findAndCountAll({
						where: {
							UserId: userId,
							isBell: true,
							forDrip: true,
						},
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (type == 'diwo') {
				[err, allnotification] = await to(
					Notification.findAndCountAll({
						where: {
							UserId: userId,
							isBell: true,
							forDiwo: true,
						},
						offset: offset,
						limit: limit,
						order: [['createdAt', 'DESC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}

			if (allnotification && allnotification?.rows?.length > 0) {
				for (let list of allnotification.rows) {
					finalList.push(list.convertToJSON());
				}
			}
		}

		return ResponseSuccess(res, {
			data: finalList,
			count: allnotification.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllBellNotification = getAllBellNotification;

const checkBellNotification = async function (req, res) {
	try {
		const userId = req.user.id;
		let finalList = [];

		if (userId) {
			[err, allnotification] = await to(
				Notification.count({
					where: {
						UserId: userId,
						isBell: true,
						isRead: false,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: allnotification,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkBellNotification = checkBellNotification;

const readAllBellNotification = async function (req, res) {
	try {
		let userId;
		const type = req.params.type;
		if (req && req.user && req.user.id) {
			userId = req.user.id;
		} else if (req && req.query && req.query.userId) {
			userId = req.query.userId;
		}
		if (type == 'drip') {
			[err, updateAllnotification] = await to(
				Notification.update(
					{
						isRead: true,
					},
					{
						where: {
							isRead: false,
							UserId: userId,
							forDrip: true,
							isBell: true,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		} else if (type == 'diwo') {
			[err, updateAllnotification] = await to(
				Notification.update(
					{
						isRead: true,
					},
					{
						where: {
							isRead: false,
							UserId: userId,
							forDiwo: true,
							isBell: true,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.readAllBellNotification = readAllBellNotification;
