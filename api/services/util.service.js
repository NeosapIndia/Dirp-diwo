const { to } = require('await-to-js');
const pe = require('parse-error');
const MESSAGE = require('../config/message');

module.exports.to = async (promise) => {
	let err, res;
	[err, res] = await to(promise);
	if (err) return [pe(err)];
	return [null, res];
};
module.exports.ResponseError = function (res, err, code, log) {
	let send_data = { success: false };
	if (typeof code !== 'undefined') res.statusCode = code;
	else res.statusCode = 500;
	send_data.error = err;
	if (typeof err == 'object' && typeof err.message != 'undefined') {
		send_data.error = err.message;
	}
	if (log == 'send') {
		send_data.error = err.message;
	} else if (log) {
		console.log('--Server Error--', err);
		send_data.error = MESSAGE.UNHANDLED_ERROR;
		if (err && err.message == MESSAGE.INVALID_USER_SIGN_UP) {
			send_data.error = err.message;
		}
	}
	return res.json(send_data);
};
module.exports.ResponseSuccess = function (res, data, code) {
	let send_data = { success: true };
	if (typeof data == 'object') {
		send_data = Object.assign(send_data, data);
	}
	if (typeof code !== 'undefined') res.statusCode = code;
	return res.json(send_data);
};
module.exports.ThrowException = TE = function (err_message, log) {
	if (log === true) {
		console.error(err_message);
	}

	throw new Error(err_message);
};
