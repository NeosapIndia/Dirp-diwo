const Request = require('request');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const MESSAGE = require('../config/message');
const { to } = require('../services/util.service');
const crypto = require('node:crypto');
const https = require('https');
const axios = require('axios');
const { WhatsAppSetup, ClientWhatsAppSetup } = require('../models1/connectionPool')['global'];
const Sequelize = require('sequelize');
//Send OTP SMS for both Drip and Diwo
const sendMessage = function (number, message, otp, clientId, type) {
	return new Promise(async (resolve, reject) => {
		let userId = CONFIG.gupshup_user_id;
		let password = CONFIG.gupshup_password;
		let msg = `Your Drip App verification code is: ${otp}`;

		if (type === 'diwo') {
			msg = `Your Diwo App verification code is: ${otp}`;
		}

		////////////////////////////////////////////// Need to Check this///////////////////////////////////////////////
		////////////////////////////////////////////// Need to Check this///////////////////////////////////////////////
		////////////////////////////////////////////// Need to Check this///////////////////////////////////////////////

		// if (clientId) {
		// 	let whereCondition = {
		// 		ClientId: clientId,
		// 	};

		// 	if (type === 'drip') {
		// 		whereCondition.forDrip = true;
		// 		whereCondition.forDiwo = false;
		// 	} else if (type === 'diwo') {
		// 		whereCondition.forDrip = false;
		// 		whereCondition.forDiwo = true;
		// 	}

		// 	[err, getWhatsAppSetup] = await to(
		// 		ClientWhatsAppSetup.findOne({
		// 			where: whereCondition,
		// 			include: [
		// 				{
		// 					model: WhatsAppSetup,
		// 					where: {
		// 						status: 'Active',
		// 					},
		// 				},
		// 			],
		// 		})
		// 	);

		// 	if (getWhatsAppSetup && getWhatsAppSetup.WhatsAppSetup) {
		// 		if (getWhatsAppSetup.WhatsAppSetup.messenger_id) {
		// 			userId = getWhatsAppSetup.WhatsAppSetup.messenger_id;
		// 		}
		// 		if (getWhatsAppSetup.WhatsAppSetup.messenger_password) {
		// 			password = getWhatsAppSetup.WhatsAppSetup.messenger_password;
		// 		}
		// 		if (getWhatsAppSetup.WhatsAppSetup.messenger_template) {
		// 			msg = getWhatsAppSetup.WhatsAppSetup.messenger_template;
		// 			msg = msg.replace('{#var#}', otp);
		// 		}
		// 	}
		// }

		let payload = {
			method: 'sendMessage',
			send_to: number,
			msg: msg,
			msg_type: 'TEXT',
			userid: userId,
			auth_scheme: 'PLAIN',
			password: password,
			format: 'JSON',
			v: '1.1',
		};

		console.log('--payload_MESSAGESENDING-', payload);

		const myaxios = {
			get: axios.create({
				httpsAgent: new https.Agent({
					secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
				}),
			}),
		};

		try {
			let response_1 = await myaxios.get(
				'https://enterprise.smsgupshup.com/GatewayAPI/rest?' + new URLSearchParams(payload).toString()
			);

			if (
				response_1 &&
				response_1.data &&
				response_1.data.response &&
				response_1.data.response.status.toLowerCase() == 'success'
			) {
				resolve(response_1.data.response);
			} else {
				reject({ error: 'Unable to Send One Time Password message', message: MESSAGE.OTP_GENERATE_FAIL });
			}
		} catch (error) {
			console.log('----Catch Error--', error);
			reject(error);
		}
	});
};
module.exports.sendMessage = sendMessage;
