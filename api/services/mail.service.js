const mailTransport = require('@sendgrid/mail');

let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];

mailTransport.setApiKey(CONFIG.sendgrid_api_key);

/* To send the mail */
// returns Promise
const sendMail = async function (msg) {
	// if(env == 'development' || env == 'dev'){
	//     console.log('mail service bypassed');
	//     return Promise.resolve('Bypassed');
	// } else
	try {
		if (msg && msg.personalizations) {
			for (let item of msg.personalizations) {
				item.to = [item.to];
				
			}
		}
		if (msg && msg.to) {
			msg.to = [msg.to];
			
		}
		return mailTransport.send(msg);
	} catch (error) {
		console.log('---Send Mail Error--', error);
		return;
	}
};
module.exports.sendMail = sendMail;

/* To set defaults for deferent type of senders */
const setSender = async function (sender, options) {
	return new Promise((resolve, reject) => {
		/*  To use different from address for different emails */
		switch (sender) {
			case 'Support':
				options.from = `Bablr Team <${CONFIG.mail_username}>`;
				break;
			case 'Promotions':
				options.from = `Bablr team <${CONFIG.mail_username}>`;
				break;
			case 'Invoices':
				options.from = `Bablr Team <${CONFIG.mail_username}>`;
				break;
			default:
				options.from = `Bablr Team <${CONFIG.mail_username}>`;
				break;
		}
		if (env == 'dev' || env == 'development' || env == 'Staging') {
			options.sandbox_mode = { enable: true };
		}

		if (env != 'production') {
			options.from = `${env} Environment <${CONFIG.mail_username}>`;
		}

		resolve(options);
	});
};
module.exports.setSender = setSender;
