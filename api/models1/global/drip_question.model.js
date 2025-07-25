module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripQuestion', {
		question: DataTypes.TEXT,
		questionType: DataTypes.STRING,
		answerCount: DataTypes.INTEGER,
		fileName: DataTypes.STRING,
		filePath: DataTypes.TEXT,
		fileType: DataTypes.STRING,
		allowFileTypes: DataTypes.STRING,
		fileSize: DataTypes.STRING,
		numberOfFiles: DataTypes.INTEGER,
		isTextResponse: DataTypes.BOOLEAN,
		isFileSubmission: DataTypes.BOOLEAN,
		surveyCharLimit: DataTypes.INTEGER,
		multipleOption: DataTypes.BOOLEAN,
		ratingScaleMinCount: DataTypes.INTEGER, //Default 0
		ratingScaleMaxCount: DataTypes.INTEGER, //Default 0
		skipQuestion: DataTypes.BOOLEAN, // default false
		isQuesRequired: DataTypes.BOOLEAN, //default true
		zoomLinkTo: DataTypes.STRING,
		UploadOnVimeo: DataTypes.BOOLEAN, //default true
		showTranscript: DataTypes.BOOLEAN, //default false
		aiReview: DataTypes.BOOLEAN, //default false
		expectedAnswer: DataTypes.JSONB,
		spinCatIndex: DataTypes.INTEGER,
		spinQueScore: DataTypes.INTEGER, //Default 0
		ratingType: DataTypes.STRING,
		ratingMinLabel: DataTypes.STRING,
		ratingMaxLabel: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.DripOption = this.hasMany(models.DripOption);
		this.Client = this.belongsTo(models.Client);
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
		this.Drip_camp = this.hasMany(models.Drip_camp);
		this.DripUserQuestion = this.hasMany(models.DripUserQuestion);
		///////////////////////////////////////////////////////////////
		// Also Need to add Column in the Query ( DripSpinWheelCatId )
		///////////////////////////////////////////////////////////////
		this.DripSpinWheelCat = this.belongsTo(models.DripSpinWheelCat);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
