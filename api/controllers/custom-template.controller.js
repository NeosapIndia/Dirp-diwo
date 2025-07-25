const { Market, Country, Op, Currency, Province, sequelize, Role, CustomTemplate } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const { createlog } = require('../services/log.service');
const { getUpperLevelAccountDetailsUptoClientAccount } = require('../services/client.service');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Sequelize = require('sequelize');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
//Create Custom Template
const createCustomTemplate = async function (req, res) {
	try {
		let err, create_template;
		let templateDetails = req.body;
		let ClientId = req.params.clientId;
		let type = req.user.type;

		templateDetails.ClientId = ClientId;
		// console.log('--Create Template Details--', templateDetails);

		[err, create_template] = await to(CustomTemplate.create(templateDetails));
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Custom Template`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					TemplateId: create_template.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: create_template,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createCustomTemplate = createCustomTemplate;

//Update Custom Template
const updateCustomTemplate = async function (req, res) {
	try {
		let err, update_template;
		let templateDetails = req.body;
		let temp_id = req.params.id;

		// console.log('--Update Template Details--', templateDetails);

		[err, update_template] = await to(
			CustomTemplate.update(templateDetails, {
				where: {
					id: temp_id,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Custom Template`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					TemplateId: update_template.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: update_template,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateCustomTemplate = updateCustomTemplate;

//get all custom template data
const getAllCustomTemplateByUsingClientId = async function (req, res) {
	try {
		let err, templateData;
		let parentClientId = req.params.clientId;
		let finalTemplateList = [];

		let offset = 0;
		let limit = req.query.limit;

		if (limit == 'all') {
			offset = undefined;
			limit = undefined;
		} else {
			if (req.query.page != NaN && req.query.page >= 1) offset = (parseInt(req.query.page) - 1) * limit;
		}

		[err, templateData] = await to(
			CustomTemplate.findAndCountAll({
				where: {
					ClientId: parentClientId,
				},
				order: [['createdAt', 'DESC']],
				offset: offset,
				limit: limit,
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		for (let template of templateData.rows) {
			let templateDetail = template.convertToJSON();
			finalTemplateList.push(templateDetail);
		}

		return ResponseSuccess(res, {
			data: finalTemplateList,
			count: templateData.count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllCustomTemplateByUsingClientId = getAllCustomTemplateByUsingClientId;

//get  Custom Template By Using Client Id
const getCustomTemplateByClientId = async function (req, res) {
	try {
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

		let err, templateData;
		// let clientId = req.params.clientId;
		let parentClient = await getUpperLevelAccountDetailsUptoClientAccount(clientId);

		[err, templateData] = await to(
			CustomTemplate.findAll({
				where: {
					ClientId: parentClient,
				},
				attributes: ['id', 'templateName', 'ClientId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: templateData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomTemplateByClientId = getCustomTemplateByClientId;

//get  Custom Template By Using Id
const getCustomTemplateByUsingTempId = async function (req, res) {
	try {
		let err, templateData;
		let tempId = req.params.tempId;

		[err, templateData] = await to(
			CustomTemplate.findOne({
				where: {
					id: tempId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: templateData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getCustomTemplateByUsingTempId = getCustomTemplateByUsingTempId;

const deleteCustomTemplate = async function (req, res) {
	try {
		let err;
		let clientId = req.params.clientId;
		let tempId = req.body;
		let type = req.query.type;

		[err, templateData] = await to(
			CustomTemplate.destroy({
				where: {
					id: tempId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Custom Template`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					TemplateId: tempId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.CUSTOM_TEMPLATE_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteCustomTemplate = deleteCustomTemplate;
