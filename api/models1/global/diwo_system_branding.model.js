module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoSystemBranding', {
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
		welcomeBody: DataTypes.STRING,
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

		spotRegistration: DataTypes.TEXT,

		addLearnerForDrip: DataTypes.BOOLEAN, //false
		allSocialMediaData: DataTypes.TEXT,

		//PWA Coursel Details
		CarouselData: DataTypes.TEXT,		

	});
	Model.associate = function (models) {
		this.Client = this.hasMany(models.Client);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
