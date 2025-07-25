'use strict';
const bcrypt = require('bcrypt');
const bcrypt_p = require('bcrypt-promise');
const jwt = require('jsonwebtoken');
const { to } = require('../../services/util.service');
let env = process.env.API_APP || 'development';
const CONFIG = require('../../config/config')[env];
module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'User',
		{
			type: DataTypes.STRING,
			country: DataTypes.STRING,
			status: DataTypes.BOOLEAN,
			local_user_id: DataTypes.INTEGER,
			is_verified: DataTypes.BOOLEAN,
			account_id: DataTypes.STRING,
			acceptPolicy: DataTypes.BOOLEAN,
			userPolicyDetails: DataTypes.TEXT,
			is_deleted: DataTypes.BOOLEAN,
			opt_in: DataTypes.BOOLEAN,
			opt_out: DataTypes.BOOLEAN,
			opt_id: DataTypes.STRING,
			otp_update_at: DataTypes.DATE,
			is_archive: DataTypes.BOOLEAN,
			cStatus: DataTypes.STRING,
			tags: DataTypes.TEXT,
			haveWhatsAppOptIn: DataTypes.BOOLEAN,
			triggerOptInMsg: DataTypes.BOOLEAN,
			haveEmailPer: DataTypes.BOOLEAN,
			zoho_id: DataTypes.STRING,
			optTrigger: DataTypes.BOOLEAN,
			optError: DataTypes.TEXT,
			updateOptInByUserAt: DataTypes.DATE,
			acceptOptInByUser: DataTypes.BOOLEAN,
			forDrip: DataTypes.BOOLEAN,
			forDiwo: DataTypes.BOOLEAN,
			isReg_Completed: DataTypes.BOOLEAN, /////////Default True
			access_token: DataTypes.TEXT,
			refresh_token: DataTypes.TEXT,
			tokenCreateDate: DataTypes.DATE,
			firstLogin: DataTypes.DATE,
			lastLogin: DataTypes.DATE,

			threadId: DataTypes.TEXT,
			threadCreatedDate: DataTypes.DATE,
			spotReg: DataTypes.STRING,
			isLeanerSpotReg: DataTypes.BOOLEAN, // Default False

			otp_out_at: DataTypes.DATE,
			opt_out_id: DataTypes.STRING,
			optOutTrigger: DataTypes.BOOLEAN,
			optOutError: DataTypes.TEXT,
			customFields: DataTypes.JSONB,

			team_id: DataTypes.STRING,
			isLockout: DataTypes.BOOLEAN,
			failed_attempts: DataTypes.INTEGER,
		},
		{
			indexes: [
				{
					name: 'Users_index_1',
					fields: ['local_user_id', 'MarketId', 'forDrip', 'cStatus'],
				},
				{
					name: 'Users_index_2',
					fields: ['local_user_id', 'MarketId', 'forDiwo', 'cStatus'],
				},
				{
					name: 'Users_index_3',
					fields: [' account_id'],
				},
				{
					name: 'Users_index_4',
					fields: ['id', 'cStatus', 'is_archive'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.Role = this.belongsToMany(models.Role, { through: 'User_role_client_mapping' });
		this.Client = this.belongsToMany(models.Client, { through: 'User_role_client_mapping' });
		this.Country = this.belongsTo(models.Country);
		this.Market = this.belongsTo(models.Market);
		// this.Client = this.belongsTo(models.Client);
		this.CustomerPolicyLog = this.hasMany(models.CustomerPolicyLog);
		this.Assigned_post_to_user = this.hasMany(models.Assigned_post_to_user);
		this.User_log = this.hasMany(models.User_log);
		// this.User_group = this.hasOne(models.User_group);
		// this.Client = this.belongsToMany(models.Client, { through: 'User_client_mappings' });

		this.User_group = this.belongsToMany(models.User_group, { through: 'User_group_mapping' });
		this.Client_job_role = this.belongsToMany(models.Client_job_role, { through: 'User_job_role_mapping' });

		this.Campaign = this.hasMany(models.Campaign);
		this.Workbook = this.hasMany(models.Workbook);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.Workbook = this.belongsToMany(models.Workbook, { through: 'WorkbookTrainerMapping' });

		//Other Drip Type
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);
		this.CampTakeAction = this.hasMany(models.CampTakeAction);

		//Cookie
		this.Cookie = this.belongsTo(models.Cookie);

		this.Notification = this.hasMany(models.Notification);

		this.Bot_send_msg = this.hasMany(models.Bot_send_msg);
		this.UserBriefFile = this.hasMany(models.UserBriefFile);

		this.DripVideoLog = this.hasMany(models.DripVideoLog);
		this.DiwoVideoLog = this.hasMany(models.DiwoVideoLog);

		//Zoom App Details
		this.ZoomAppDetail = this.hasMany(models.ZoomAppDetail);
		this.ZoomUserToken = this.hasMany(models.ZoomUserToken);
		this.ZoomRegistration = this.hasMany(models.ZoomRegistration);

		this.TeamSetup = this.hasMany(models.TeamSetup);

		this.TeamChatDetail = this.hasMany(models.TeamChatDetail);

		this.ClientTeamSetup = this.hasMany(models.ClientTeamSetup);

		// For Bot Function Details
		this.BotFunctionDetail = this.hasMany(models.BotFunctionDetail);

		this.Ticket = this.hasMany(models.Ticket);
		this.Course = this.hasMany(models.Course);
		this.Pathway = this.hasMany(models.Pathway);
		this.UserThread = this.hasMany(models.UserThread);

		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);
		this.LearnerAssignment = this.hasMany(models.LearnerAssignment);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
	};

	Model.beforeSave(async (user, options) => {
		let err;
		if (user.changed('otp')) {
			let salt, hash;
			[err, salt] = await to(bcrypt.genSalt(10));
			if (err) TE(err.message, true);
			[err, hash] = await to(bcrypt.hash(user.otp, salt));
			if (err) TE(err.message, true);
			user.otp = hash;
		}
	});
	Model.prototype.comparePassword = async function (pw) {
		let err, pass;
		console.log('pw', pw);
		console.log('this.otp', this.otp);
		if (!this.otp) TE('otp not set');
		[err, pass] = await to(bcrypt_p.compare(pw, this.otp));
		if (err) TE(err);
		if (!pass) TE('invalid otp');
		return this;
	};
	Model.prototype.getJWT = function (roleId, clientId, projectType, expiry = null, scope = null) {
		let expiration_time;
		if (expiry) {
			expiration_time = parseInt(expiry);
		} else {
			expiration_time = parseInt(CONFIG.jwt_expiration);
		}
		return jwt.sign(
			{
				user_id: this.id,
				type: projectType,
				RoleId: roleId,
				ClientId: clientId,
				scope: scope ? scope : 'Normal',
				// projectType: projectType,
				// associated_acc: this.associated_acc,
			},
			CONFIG.jwt_encryption,
			{
				expiresIn: expiration_time,
			}
		);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
