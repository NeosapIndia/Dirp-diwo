module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'SessionWorksheet',
		{
			description: DataTypes.TEXT,
			chart: DataTypes.STRING,
			trainerInst: DataTypes.TEXT,
			flgFav: DataTypes.BOOLEAN,
			flgBookmark: DataTypes.BOOLEAN,
			type: DataTypes.STRING,
			userNote: DataTypes.TEXT,
			isBookmark: DataTypes.BOOLEAN,
			isFav: DataTypes.BOOLEAN,
			submit: DataTypes.BOOLEAN,
			// score: DataTypes.INTEGER,
			score: DataTypes.FLOAT,
			flgImp: DataTypes.BOOLEAN,
			flgGroupActivty: DataTypes.BOOLEAN,
			isRead: DataTypes.BOOLEAN,
			isGraded: DataTypes.BOOLEAN,
			brief: DataTypes.TEXT,
			anonymous: DataTypes.BOOLEAN,
			publishResult: DataTypes.BOOLEAN,
			sessionFeedBackMinCount: DataTypes.INTEGER,
			sessionFeedBackMaxCount: DataTypes.INTEGER,
			sessionFeedback: DataTypes.BOOLEAN,
			trainerSurvey: DataTypes.BOOLEAN, // false
			trainerSurveyComp: DataTypes.BOOLEAN, // false
			activityTemplate: DataTypes.STRING,
			seconds: DataTypes.FLOAT,
			percent: DataTypes.FLOAT,
			duration: DataTypes.FLOAT,

			//spin the wheel
			noOfTimeSpinWheel: DataTypes.INTEGER, //Default 0
			assignSpinQue: DataTypes.TEXT,

			index: DataTypes.INTEGER,

			keepSurveyOn: DataTypes.BOOLEAN, // false
			keepSurveyOnDays: DataTypes.INTEGER,

			mediaWorkSheet: DataTypes.BOOLEAN, //false
			mediaProfilesData: DataTypes.JSONB,

			isAssessment: DataTypes.BOOLEAN, //False
			certificateData: DataTypes.JSONB,
			isLearnerPassed: DataTypes.BOOLEAN,

			worksheetStatus: DataTypes.STRING,

			videoComplition: DataTypes.BOOLEAN,

			isShowScore: DataTypes.BOOLEAN,
			isPdf: DataTypes.BOOLEAN,
			isAttachFile: DataTypes.BOOLEAN,
			timeToShowOption: DataTypes.STRING,
			GuideId: DataTypes.INTEGER,
			isGuideWorksheet: DataTypes.BOOLEAN,
			attendGuide: DataTypes.BOOLEAN, //Default false
			isQuizCompletion: DataTypes.BOOLEAN,
			reAttemptsCount: DataTypes.INTEGER,
			isReattemptLocked: DataTypes.BOOLEAN,
			isQuizAttempted: DataTypes.BOOLEAN,
			maxReAttemptsAllowed: DataTypes.INTEGER,
			isQuizRetryDisabled: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					///Need to add One Column in this index
					name: 'SessionWorksheets_index_1',
					fields: ['SessionUserId', 'type', 'worksheetStatus', 'videoComplition'],
				},
				{
					name: 'SessionWorksheets_index_2',
					fields: ['SessionUserId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.SessionUser = this.belongsTo(models.SessionUser);
		this.Client = this.belongsTo(models.Client);
		this.SessionQuestion = this.hasMany(models.SessionQuestion);

		this.SessionAsset = this.hasMany(models.SessionAsset);
		this.SessionQuestionSubmission = this.hasMany(models.SessionQuestionSubmission);
		this.Session = this.belongsTo(models.Session);
		this.Worksheet = this.belongsTo(models.Worksheet);

		this.SessionOption = this.hasMany(models.SessionOption);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
