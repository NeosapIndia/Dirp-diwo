module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Worksheet', {
		description: DataTypes.TEXT,
		chart: DataTypes.STRING,
		trainerInst: DataTypes.TEXT,
		flgFav: DataTypes.BOOLEAN,
		flgBookmark: DataTypes.BOOLEAN,
		type: DataTypes.STRING,
		flgImp: DataTypes.BOOLEAN,
		flgGroupActivty: DataTypes.BOOLEAN,
		isGraded: DataTypes.BOOLEAN,
		anonymous: DataTypes.BOOLEAN,
		brief: DataTypes.TEXT,
		publishResult: DataTypes.BOOLEAN,
		sessionFeedBackMinCount: DataTypes.INTEGER,
		sessionFeedBackMaxCount: DataTypes.INTEGER,
		sessionFeedback: DataTypes.BOOLEAN,
		question_Group: DataTypes.BOOLEAN, // false
		trainerSurvey: DataTypes.BOOLEAN, // false
		trainerSurveyComp: DataTypes.BOOLEAN, // false
		quizRandCount: DataTypes.INTEGER,
		activityTemplate: DataTypes.STRING,
		noOfTimeSpinWheel: DataTypes.INTEGER, //Default 0
		noOfQuesForCategory: DataTypes.INTEGER, //Default 0
		keepSurveyOn: DataTypes.BOOLEAN, // false
		keepSurveyOnDays: DataTypes.INTEGER,
		mediaWorkSheet: DataTypes.BOOLEAN, //false
		mediaProfilesData: DataTypes.JSONB,

		isAssessment: DataTypes.BOOLEAN, //False
		certificateData: DataTypes.JSONB,
		isShowScore: DataTypes.BOOLEAN,
		timeToShowOption: DataTypes.STRING,

		videoComplition: DataTypes.BOOLEAN,
		isPdf: DataTypes.BOOLEAN,
		isAttachFile: DataTypes.BOOLEAN,
		GuideId: DataTypes.INTEGER,
		isGuideWorksheet: DataTypes.BOOLEAN,
		isQuizCompletion: DataTypes.BOOLEAN,
		maxReAttemptsAllowed: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Option = this.hasMany(models.Option);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Client = this.belongsTo(models.Client);
		this.DiwoAsset = this.hasMany(models.DiwoAsset);

		this.Question = this.hasMany(models.Question);
		this.SurveyQueGroup = this.hasMany(models.SurveyQueGroup);
		this.SessionWorksheet = this.hasMany(models.SessionWorksheet);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
