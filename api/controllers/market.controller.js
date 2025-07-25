const { Market, Country, Op, Currency, Province, sequelize, Role, LoginAppBranding } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const config_feature = require('../config/SiteConfig.json');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');

// Get countries list
const getCountries = async function (req, res) {
	try {
		let err, countries;
		[err, countries] = await to(
			Country.findAll({
				include: [
					{
						model: Province,
						attributes: ['id', 'name'],
					},
					{
						model: Currency,
						attributes: ['name', 'currencySymbol'],
					},
				],
				order: [
					['name', 'ASC'],
					[sequelize.col('"Provinces"."name"'), 'ASC'],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let countries_json = [];
		for (let i in countries) {
			let country = countries[i];
			let country_json = country.convertToJSON();
			if (country_json.Currencies.length > 0) {
				country_json.nameWithCurrencySymbol =
					country_json.name + ' (' + country_json.Currencies[0].currencySymbol + ')';
			} else {
				country_json.nameWithCurrencySymbol = country_json.name;
			}
			countries_json.push(country_json);
		}
		return ResponseSuccess(res, {
			data: countries_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCountries = getCountries;

// Get Market Details By using Country Nanme
const getMarketByCountry = async function (req, res) {
	try {
		let err, markets;
		[err, markets] = await to(
			Market.findOne({
				where: {
					status: true,
				},
				include: [
					{
						model: Country,
						attributes: ['id', 'name'],
						where: {
							name: req.params.country,
						},
						required: true,
					},
				],
			})
		);
		if (err)
			return ResponseError(
				res,
				{
					message: MESSAGE.NOT_AVILABLE,
				},
				500,
				true
			);
		if (markets == null)
			return ResponseError(
				res,
				{
					message: MESSAGE.NOT_AVILABLE,
				},
				500,
				false
			);

		return ResponseSuccess(res, {
			data: markets,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getMarketByCountry = getMarketByCountry;

// Get countries list
const getRoles = async function (req, res) {
	try {
		let err, roles;
		let roleId = req.params.roleId;
		let type = req.query.type;
		if (type == 'drip') {
			//for(L-1) in admin roles sheet
			if (roleId == 3 || roleId == 5) {
				[err, roles] = await to(
					Role.findAll({
						where: {
							dripRole: true,
							id: {
								[Op.gt]: roleId,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (roleId == 7) {
				[err, roles] = await to(
					Role.findAll({
						where: {
							dripRole: true,
							id: {
								[Op.gte]: 6,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, roles] = await to(
					Role.findAll({
						where: {
							dripRole: true,
							id: {
								[Op.gte]: roleId,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		} else if (type == 'diwo') {
			//for(L-1) in admin roles sheet
			if (roleId == 3 || roleId == 5) {
				[err, roles] = await to(
					Role.findAll({
						where: {
							diwoRole: true,
							id: {
								[Op.gt]: roleId,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else if (roleId == 7) {
				[err, roles] = await to(
					Role.findAll({
						where: {
							diwoRole: true,
							id: {
								[Op.gte]: 6,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			} else {
				[err, roles] = await to(
					Role.findAll({
						where: {
							diwoRole: true,
							id: {
								[Op.gte]: roleId,
							},
						},
						attributes: ['id', 'name'],
						order: [['id', 'ASC']],
						// logging:true
					})
				);
				if (err) return ResponseError(res, err, 500, true);
			}
		}

		let roles_json = [];
		for (let i in roles) {
			roles_json.push(roles[i].convertToJSON());
		}
		return ResponseSuccess(res, {
			data: roles_json,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getRoles = getRoles;

const getMarketPolicyURLDetails = async function (req, res) {
	try {
		[err, allMarket] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['id', 'tosUrl', 'privacyPolicyUrl', 'dpaUrl', 'cookiePolicyUrl', 'name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: allMarket,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getMarketPolicyURLDetails = getMarketPolicyURLDetails;

const updateMarketPolicyURLDetails = async function (req, res) {
	try {
		let data = req.body.marketPolicyURLDetails;
		let payload = {
			tosUrl: data.tosUrl,
			privacyPolicyUrl: data.privacyPolicyUrl,
			dpaUrl: data.dpaUrl,
			cookiePolicyUrl: data.cookiePolicyUrl,
		};
		[err, allMarket] = await to(
			Market.update(payload, {
				where: {
					id: parseInt(req.params.marketId),
					status: true,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Edit Master Setting`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					MarketId: parseInt(req.params.marketId),
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.URL_UPDATE,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateMarketPolicyURLDetails = updateMarketPolicyURLDetails;

//Get All Market List
const getAllMArket = async function (req, res) {
	try {
		[err, markets] = await to(
			Market.findAll({
				where: {
					status: true,
				},
				attributes: ['id', 'name'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: markets,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllMArket = getAllMArket;

const getLoginAppBranding = async function (req, res) {
	try {
		[err, loginAppBranding] = await to(LoginAppBranding.findOne({ where: { id: 1 } }));
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: loginAppBranding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getLoginAppBranding = getLoginAppBranding;

const updateLoginAppBranding = async function (req, res) {
	try {
		let data = req.body;
		let loginAppBranding;
		if (data.id) {
			[err, loginAppBranding] = await to(LoginAppBranding.update(data, { where: { id: data.id } }));
			if (err) return ResponseError(res, err, 500, true);
		} else {
			[err, loginAppBranding] = await to(LoginAppBranding.create(data));
			if (err) return ResponseError(res, err, 500, true);
		}

		return ResponseSuccess(res, {
			data: loginAppBranding,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateLoginAppBranding = updateLoginAppBranding;

const getConfigurableFeature = async function (req, res) {
	try {
		let data = { ...config_feature.configurable_feature };
		data.CMSUrl = CONFIG.media_cms_url;
		return ResponseSuccess(res, {
			data: data,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getConfigurableFeature = getConfigurableFeature;
