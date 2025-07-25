module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('System_branding', {
		//PWA About page Data
		theme_image_original_name: DataTypes.STRING,
		theme_image_name: DataTypes.STRING,
		theme_image_path: DataTypes.TEXT,

		about_text: DataTypes.TEXT,

		// PWA Header Icon
		learner_app_icon_original_name: DataTypes.STRING,
		learner_app_icon_name: DataTypes.STRING,
		learner_app_icon_path: DataTypes.TEXT,

		// PWA Header Icon
		admin_side_header_logo_original_name: DataTypes.STRING,
		admin_side_header_logo_name: DataTypes.STRING,
		admin_side_header_logo_path: DataTypes.TEXT,

		//Email Branding
		EmailSenderName: DataTypes.STRING,
		EmailSignatureText: DataTypes.STRING,
		EmailSenderId: DataTypes.STRING,
		EmailTemplateId: DataTypes.TEXT,
		welcomeEmail: DataTypes.BOOLEAN,
		welcomeSubject: DataTypes.STRING,
		welcomeBody: DataTypes.TEXT,
		welcomeButton: DataTypes.STRING,

		compMobNo: DataTypes.BOOLEAN,
		compEmail: DataTypes.BOOLEAN,
		ContactEmailForLearner: DataTypes.STRING,
		ContactPhoneForLearner: DataTypes.STRING,

		//Signature Image Data
		signature_image_original_name: DataTypes.STRING,
		signature_image_name: DataTypes.STRING,
		signature_image_path: DataTypes.TEXT,
		accent_color: DataTypes.STRING,

		hideBackBtnToggle: DataTypes.BOOLEAN, //default false
		defaultbackval: DataTypes.STRING,

		sendoptinconfm: DataTypes.BOOLEAN, //default false
		optinconfmdrip: DataTypes.INTEGER,
		custkeywords: DataTypes.TEXT,
		sendoptoutconfm: DataTypes.BOOLEAN, //default false
		optoutconfmdrip: DataTypes.INTEGER,
		isWhatsAppOTP: DataTypes.BOOLEAN, //default false

		OnlyEmailTemplateId: DataTypes.TEXT,

		//WhatsApp default Reply
		setDefaultReply: DataTypes.BOOLEAN, //default false
		dripIdForDefaultReply: DataTypes.INTEGER,
	});
	Model.associate = function (models) {
		this.Client = this.hasMany(models.Client);
		this.ClientCustomReport = this.hasMany(models.ClientCustomReport);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
