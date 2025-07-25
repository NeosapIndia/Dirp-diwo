module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('WhatsAppSetup', {
		user_id: DataTypes.TEXT,
		password: DataTypes.TEXT,
		status: DataTypes.STRING,
		canSelectTempType: DataTypes.BOOLEAN,
		canChangeTempCat: DataTypes.BOOLEAN,
		category: DataTypes.STRING,
		sendNtOptIn: DataTypes.BOOLEAN,
		optInMsg: DataTypes.TEXT,
		optInRedirectUrl: DataTypes.TEXT,
		messenger_id: DataTypes.TEXT,
		messenger_password: DataTypes.TEXT,
		messenger_template: DataTypes.TEXT,
		waNumber: DataTypes.STRING,
		otpTempStatus: DataTypes.TEXT,
		otpTempId: DataTypes.STRING,
		messageLimit: DataTypes.STRING,
		enableRetry: DataTypes.BOOLEAN,
		retryInterval: DataTypes.INTEGER,
		retryFrequency: DataTypes.INTEGER,
		isMeta: DataTypes.BOOLEAN, //Default false
		MTPNoId: DataTypes.STRING, // Meta Buisiness Phone Id
		MTToken: DataTypes.TEXT, //Meta Access Token
		templateName: DataTypes.STRING,
		MTAccId: DataTypes.STRING, //Meta WABA Account Id
		MTAppId: DataTypes.STRING, //Meta App Id
	});

	Model.associate = function (models) {
		this.ClientWhatsAppSetup = this.hasMany(models.ClientWhatsAppSetup);
		this.Drip_whatsapp_native = this.hasMany(models.Drip_whatsapp_native);
		this.Drip_whatsapp_non_native = this.hasMany(models.Drip_whatsapp_non_native);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
