const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('./../config/message');
const { Raise_Request, role_mapping, User, Market } = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { raiseReqstMail } = require('../services/mailer.service');

module.exports = function (discription, operation_on) {
	return async function (req, res, next) {
		if (req.query.raise == 'true' || req.query.raise == true) {
			let err, data;
			let aprovedByAdmin = true;
			if (req.query.aprovedByAdmin) {
				aprovedByAdmin = req.query.aprovedByAdmin;
			}
			let info = {
				data: JSON.stringify(req.body),
				raised_by_name: req.headers.user_raiserequest_name,
				url: req.url,
				discription: discription,
				raised_by: req.headers.role,
				raised_id: req.user.id,
				req_method: req.method,
				req_query_params: req.query ? JSON.stringify(req.query) : null,
				req_params: req.query ? JSON.stringify(req.params) : null,
				status: 'pending',
				operation_on: operation_on,
				MarketId: req.user.MarketId,
				approver: req.query.approver,
				aproved_by_admin: aprovedByAdmin,
				file: req.file ? JSON.stringify(req.file) : null,
				files: req.files ? JSON.stringify(req.files) : null,
			};
			[err, data] = await to(Raise_Request.create(info));
			if (err) {
				return ResponseError(res, err, 500, true);
			}
			[err, markets] = await to(Market.findById(req.user.MarketId));
			if (err) return ResponseError(res, err, 500, true);
			let personalisations = {};
			personalisations.dynamic_template_data = {
				raised_by: req.headers.role,
				user_name2: req.headers.user_raiserequest_name,
				market_name: markets.name,
				discription: discription,
				operation_on: operation_on,
				user_name: '',
			};

			if (req.query.approver == 'Super Admin') {
				[err, aRoles] = await to(
					role_mapping.findAll({
						where: { RoleId: 6 },
						attributes: ['RoleId', 'UserId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (aRoles && aRoles.length > 0) {
					let userIds = [];
					for (let role of aRoles) {
						userIds.push(role.UserId);
					}
					[err, globalUser] = await to(
						User.findOne({
							where: { id: userIds, MarketId: req.user.MarketId },
							include: [{ model: Market }],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					if (globalUser) {
						[err, admin] = await to(
							dbInstance[globalUser.Market.db_name].User_master.findOne({ where: { id: globalUser.local_user_id } })
						);
						if (err) return ResponseError(res, err, 500, true);
						if (admin) {
							personalisations.to = admin.email;
							personalisations.dynamic_template_data.user_name = admin.first;
							[err, response] = await to(raiseReqstMail(personalisations));
							if (err) console.log('Error while sending package suggestion', err);
						}
					}
				}
			} else {
				[err, aRoles] = await to(
					role_mapping.findOne({
						where: { RoleId: 16 },
						attributes: ['RoleId', 'UserId'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (aRoles) {
					[err, globalUser] = await to(
						User.findOne({
							where: { id: aRoles.UserId },
							include: [{ model: Market }],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					if (globalUser) {
						[err, admin] = await to(
							dbInstance[globalUser.Market.db_name].User_master.findOne({ where: { id: globalUser.local_user_id } })
						);
						if (err) return ResponseError(res, err, 500, true);

						if (admin) {
							personalisations.to = admin.email;
							personalisations.dynamic_template_data.user_name = admin.first;
							[err, response] = await to(raiseReqstMail(personalisations));
							if (err) console.log('Error while sending package suggestion', err);
						}
					}
				}
			}

			return ResponseSuccess(res, { message: MESSAGE.REQUEST_RAISED }, 201);
		} else {
			return next();
		}
	};
};
