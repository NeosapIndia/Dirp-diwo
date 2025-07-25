module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_whatsapp_native', {
		body: DataTypes.TEXT,
		footer: DataTypes.TEXT,
		AssetId: DataTypes.INTEGER,
		header_text: DataTypes.TEXT,
		header_type: DataTypes.STRING,
		quickReply1: DataTypes.TEXT,
		quickReply2: DataTypes.TEXT,
		quickReply3: DataTypes.TEXT,
		quickReply4: DataTypes.TEXT,
		quickReply5: DataTypes.TEXT,
		quickReply6: DataTypes.TEXT,
		quickReply7: DataTypes.TEXT,
		quickReply8: DataTypes.TEXT,
		quickReply9: DataTypes.TEXT,
		quickReply10: DataTypes.TEXT,
		templateId: DataTypes.STRING,
		templateStatus: DataTypes.STRING,
		headerPath: DataTypes.TEXT,
		headerFileName: DataTypes.STRING,
		interaction: DataTypes.STRING,
		callToActionText: DataTypes.STRING,
		hyper_link: DataTypes.TEXT,
		tempCategory: DataTypes.STRING,
		tempLang: DataTypes.STRING,
		tempName: DataTypes.STRING,
		errorMsg: DataTypes.TEXT,
		type: DataTypes.STRING,
		trackableLink: DataTypes.BOOLEAN,
		trackableLink2: DataTypes.BOOLEAN,
		longitude: DataTypes.STRING,
		latitude: DataTypes.STRING,
		locName: DataTypes.STRING,
		address: DataTypes.TEXT,
		callphonetext: DataTypes.STRING,
		callphoneno: DataTypes.STRING,
		callphonetype: DataTypes.STRING,
		callToActionText2: DataTypes.STRING,
		hyper_link2: DataTypes.TEXT,
		cta_sequence: DataTypes.TEXT,
		quickReplyFirst: DataTypes.BOOLEAN, //default true
		zoomMeetLink: DataTypes.TEXT,
		callToActionZoomText: DataTypes.STRING,
		zoomTrackable: DataTypes.BOOLEAN,
		ZoomMeetId: DataTypes.STRING,
		zoomMeetLink2: DataTypes.TEXT,
		callToActionZoomText2: DataTypes.STRING,
		zoomTrackable2: DataTypes.BOOLEAN,
		ZoomMeetId2: DataTypes.STRING,

		quality: DataTypes.STRING,
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
