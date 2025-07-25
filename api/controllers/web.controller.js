const { Op, Ip_address_with_country_geoname_id, Country_geo_name_with_id, User, Market, Country } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
const geoip = require('geoip-lite');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');

const getCountryUsingIPAdd = async function (req, res) {
	try {
		// countryIPAdd = req.params.ip;
		// let A = parseInt(countryIPAdd.split('.')[0]);
		// let B = parseInt(countryIPAdd.split('.')[1]);
		// let C = parseInt(countryIPAdd.split('.')[2]);
		// let D = parseInt(countryIPAdd.split('.')[3]);
		// let calculation = D + C * 256 + B * 256 * 256 + A * 256 * 256 * 256;
		let result, result2, err;
		let ip = req.params.ip;
		let geo = geoip.lookup(ip);
		if (geo && geo.country) {
			const countryCode = geo.country;
			console.log(`Country Code: ${countryCode}`);
			[err, result] = await to(Country.findOne({ where: { countryCode: countryCode } }));
			if (err) return ResponseError(res, err, 500, true);

			if (result) {
				console.log(`Country Name: ${result.name}`);
				return ResponseSuccess(res, { message: MESSAGE.GOT_THE_IP, countryName: result.name });
			} else {
				console.log('Country name not found for code:', countryCode);
				return ResponseSuccess(res, { message: MESSAGE.NO_COUNTRY_FOUND, countryName: '' });
			}
		} else {
			console.log('Location not found for IP address:', ip);
			return ResponseSuccess(res, { message: MESSAGE.NO_COUNTRY_FOUND, countryName: '' });
		}

		// [err, result] = await to(
		// 	Ip_address_with_country_geoname_id.findOne({
		// 		where: {
		// 			limit_start: {
		// 				[Op.lte]: calculation,
		// 			},
		// 			limit_end: {
		// 				[Op.gte]: calculation,
		// 			},
		// 		},
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		// if (!result) {
		// 	return ResponseSuccess(res, { message: MESSAGE.NO_COUNTRY_FOUND, countryName: '' });
		// }
		// let country_geoname_id = result.country_geoname_id;

		// [err, result2] = await to(
		// 	Country_geo_name_with_id.findOne({
		// 		where: { geoname_id: country_geoname_id },
		// 	})
		// );
		// if (err) {
		// 	// console.log('err', err);
		// 	return ResponseError(res, err, 500, true);
		// }
		// let ans = result2.country_name;
		// return ResponseSuccess(res, { message: MESSAGE.GOT_THE_IP, countryName: ans });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCountryUsingIPAdd = getCountryUsingIPAdd;

// /admin/users/1?status=suspend
// API to suspend or active account
const suspendUser = async function (req, res) {
	try {
		let user, err, suspendToggle, localUser;
		if (req.query.status == 'suspend') {
			suspendToggle = false;
		} else if (req.query.status == 'active') {
			suspendToggle = true;
		}
		let isUpdated = false;

		[err, user] = await to(
			User.findOne({
				where: {
					id: req.params.userId,
				},
				include: [{ model: Market }],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (user) {
			[err, isUpdated] = await to(User.update({ status: suspendToggle }, { where: { id: req.params.userId } }));
			if (err) return ResponseError(res, err, 500, true);

			[err, localUser] = await to(
				dbInstance[user.Market.db_name].User_master.findOne({ where: { id: isUpdated.local_user_id } })
			);
			if (err) return ResponseError(res, err, 500, true);

			// [err, newLog] = await to(createlog(req.params.userId, `${localUser.first} changed user status to - '${req.query.status}'`, true));
			// if (err) return ResponseError(res, err, 500, true);

			if (isUpdated) return ResponseSuccess(res, { message: MESSAGE.UPDATE_SUCCESS });
		} else {
			ResponseError(res, MESSAGE.UPDATE_FAIL);
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.suspendUser = suspendUser;
