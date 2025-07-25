module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Question', {
		question: DataTypes.TEXT,
		questionType: DataTypes.STRING,
		answerCount: DataTypes.INTEGER,
		allowFileTypes: DataTypes.STRING,
		fileSize: DataTypes.STRING,
		numberOfFiles: DataTypes.INTEGER,
		isTextResponse: DataTypes.BOOLEAN,
		isFileSubmission: DataTypes.BOOLEAN,
		multipleOption: DataTypes.BOOLEAN,
		surveyCharLimit: DataTypes.INTEGER,
		surveyMinScale: DataTypes.INTEGER,
		surveyMaxScale: DataTypes.INTEGER,
		group_index: DataTypes.INTEGER,

		//spin the wheel
		spinCatIndex: DataTypes.INTEGER,
		spinQueScore: DataTypes.INTEGER, //Default 0

		uploadOnVimeo: DataTypes.BOOLEAN,
		SurveyRatingType: DataTypes.STRING,
		ratingMinLabel: DataTypes.STRING,
		ratingMaxLabel: DataTypes.STRING,
		userRatingArray: DataTypes.TEXT,
		
		surveyUserRating: DataTypes.INTEGER, //Default 0



	});

	Model.associate = function (models) {
		this.Option = this.hasMany(models.Option);
		this.DiwoAsset = this.hasMany(models.DiwoAsset);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Client = this.belongsTo(models.Client);
		this.Worksheet = this.belongsTo(models.Worksheet);
		this.SurveyQueGroup = this.belongsTo(models.SurveyQueGroup);
		this.DiwoSpinWheelCat = this.belongsTo(models.DiwoSpinWheelCat);

		this.SessionQuestion = this.hasMany(models.SessionQuestion);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
