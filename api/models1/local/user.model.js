'use strict';
const bcrypt = require('bcrypt');
const bcrypt_p = require('bcrypt-promise');
const jwt = require('jsonwebtoken');
const { to } = require('../../services/util.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../../config/config')[env];

module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'User_master',
		{
			first: DataTypes.STRING,
			last: DataTypes.STRING,
			email: { type: DataTypes.STRING, allowNull: true },
			phone: { type: DataTypes.STRING, allowNull: true },
			otp: DataTypes.STRING,
			type: DataTypes.STRING,
			imagePath: DataTypes.STRING,
			country: DataTypes.STRING,
			city: DataTypes.STRING,
			state: DataTypes.STRING,
			status: DataTypes.BOOLEAN,
			zipCode: DataTypes.STRING,
			isDeleted: DataTypes.BOOLEAN,
			username: DataTypes.STRING,
			password: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'User_masters_index_1',
					fields: ['email', 'phone'],
				},
				{
					name: 'User_masters_index_2',
					fields: ['phone'],
				},
				{
					name: 'User_masters_index_3',
					fields: ['email'],
				},
				{
					name: 'User_masters_index_4',
					fields: ['email', 'status'],
				},
				{
					name: 'User_masters_index_5',
					fields: ['phone', 'status'],
				},
				{
					name: 'User_masters_index_6',
					fields: ['email', 'isDeleted'],
				},
				{
					name: 'User_masters_index_7',
					fields: ['phone', 'isDeleted'],
				},
				{
					name: 'User_masters_index_8',
					fields: ['isDeleted', 'status', 'email'],
				},
				{
					name: 'User_masters_index_9',
					fields: ['isDeleted', 'status', 'phone'],
				},
			],
		}
	);
	Model.associate = function (models) {
		// this.User_address = this.hasMany(models.User_address_master);
	};
	Model.beforeSave(async (user, options) => {
		let err;
		if (user.changed('otp')) {
			let salt, hash;
			[err, salt] = await to(bcrypt.genSalt(10));
			if (err) TE(err.message, true);
			if (user.otp) {
				[err, hash] = await to(bcrypt.hash(user.otp, salt));
				if (err) TE(err.message, true);
				user.otp = hash;
			}
		}
	});
	Model.prototype.comparePassword = async function (pw) {
		let err, pass;
		if (!this.otp) TE('otp not set');
		[err, pass] = await to(bcrypt_p.compare(pw, this.otp));
		if (err) TE(err);
		if (!pass) TE('invalid otp');
		return this;
	};
	Model.prototype.getJWT = function () {
		let expiration_time = parseInt(CONFIG.jwt_expiration);
		return jwt.sign({ user_id: this.id, type: this.type, associated_acc: this.associated_acc }, CONFIG.jwt_encryption, {
			expiresIn: expiration_time,
		});
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
