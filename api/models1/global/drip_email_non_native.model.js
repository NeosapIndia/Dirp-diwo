module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_email_non_native', {
		callToActionText: DataTypes.TEXT,
		caption: DataTypes.TEXT,
		OtherDripType: DataTypes.BOOLEAN,
		email_body: DataTypes.TEXT,
		email_subject_line: DataTypes.TEXT,
		existingDripId: DataTypes.INTEGER,
		hyper_link: DataTypes.TEXT,
		contentType: DataTypes.STRING,
		templateType: DataTypes.STRING,
		showCorrectAns: DataTypes.BOOLEAN,
		brief: DataTypes.TEXT,
		quizResultType: DataTypes.STRING,
		timehours: DataTypes.STRING,
		quizRandCount: DataTypes.INTEGER,
		pollResultType: DataTypes.STRING,
		pwaheadtxt: DataTypes.TEXT,
		isSendGridTemplate: DataTypes.BOOLEAN, //Default is True
		htmlstring: DataTypes.TEXT,
		brodEmailAssetPath: DataTypes.JSONB,
		brodEmailTemplatePath: DataTypes.STRING,
		brodEmailAttachmentPath: DataTypes.JSONB,
		brod_attach_type: DataTypes.STRING,
		noOfTimeSpin: DataTypes.INTEGER, //Default 1
		noOfQueForCat: DataTypes.INTEGER, //Default 0
		submitText: DataTypes.STRING,
		custTempId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
