module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_whatsapp_non_native', {
		body: DataTypes.TEXT,
		callToActionText: DataTypes.TEXT,
		caption: DataTypes.TEXT,
		OtherDripType: DataTypes.BOOLEAN,
		existingDripId: DataTypes.INTEGER,
		footer: DataTypes.TEXT,
		AssetId: DataTypes.INTEGER,
		header_text: DataTypes.TEXT,
		header_type: DataTypes.STRING,
		hyper_link: DataTypes.TEXT,
		contentType: DataTypes.STRING,
		templateId: DataTypes.STRING,
		templateStatus: DataTypes.STRING,
		headerPath: DataTypes.TEXT,
		headerFileName: DataTypes.STRING,
		templateType: DataTypes.STRING,
		tempCategory: DataTypes.STRING,
		tempLang: DataTypes.STRING,
		tempName: DataTypes.STRING,
		interaction: DataTypes.STRING,
		errorMsg: DataTypes.TEXT,
		showCorrectAns: DataTypes.BOOLEAN,
		type: DataTypes.STRING,
		brief: DataTypes.TEXT,
		quizResultType: DataTypes.STRING,
		timehours: DataTypes.STRING,
		quizRandCount: DataTypes.INTEGER,
		pollResultType: DataTypes.STRING,
		longitude: DataTypes.STRING,
		latitude: DataTypes.STRING,
		locName: DataTypes.STRING,
		address: DataTypes.TEXT,
		pwaheadtxt: DataTypes.TEXT,
		isZoomMeeting: DataTypes.BOOLEAN, // Default false
		zoomMeetLink: DataTypes.TEXT,
		ZoomMeetText: DataTypes.STRING,
		ZoomMeetId: DataTypes.STRING,
		htmlstring: DataTypes.TEXT,
		noOfTimeSpin: DataTypes.INTEGER, //Default 1
		noOfQueForCat: DataTypes.INTEGER, //Default 0
		submitText: DataTypes.STRING,
		quality: DataTypes.STRING,
		custTempId: DataTypes.INTEGER,

		mediaId: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
		this.WhatsAppSetup = this.belongsTo(models.WhatsAppSetup);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
