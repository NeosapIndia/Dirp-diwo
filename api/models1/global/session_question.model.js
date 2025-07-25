module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'SessionQuestion',
		{
			question: DataTypes.TEXT,
			questionType: DataTypes.STRING,
			answerCount: DataTypes.INTEGER,
			allowFileTypes: DataTypes.STRING,
			fileSize: DataTypes.STRING,
			numberOfFiles: DataTypes.INTEGER,
			isTextResponse: DataTypes.BOOLEAN,
			isFileSubmission: DataTypes.BOOLEAN,
			surveyNote: DataTypes.TEXT,
			offlineTaskNote: DataTypes.TEXT,
			multipleOption: DataTypes.BOOLEAN,
			surveyCharLimit: DataTypes.INTEGER,
			queGroupIndex: DataTypes.INTEGER,
			queGroupName: DataTypes.TEXT,

			//spin the wheel
			spinCatIndex: DataTypes.INTEGER,
			spinCatName: DataTypes.STRING,
			spinQueScore: DataTypes.INTEGER, //Default 0

			latitude: DataTypes.STRING,
			longitude: DataTypes.STRING,
			geoLocation: DataTypes.TEXT,

			seconds: DataTypes.FLOAT,
			percent: DataTypes.FLOAT,
			duration: DataTypes.FLOAT,
			uploadOnVimeo: DataTypes.BOOLEAN,
			
			SurveyRatingType: DataTypes.STRING,
			ratingMinLabel: DataTypes.STRING,
			ratingMaxLabel: DataTypes.STRING,
			userRatingArray: DataTypes.TEXT,
			surveyUserRating: DataTypes.INTEGER, //Default 0
			surveyMinScale: DataTypes.INTEGER,
			surveyMaxScale: DataTypes.INTEGER,

			grade: DataTypes.INTEGER,
		},
		{
			indexes: [
				{
					name: 'SessionQuestion_index_1',
					fields: ['SessionWorksheetId'],
				},
				{
					name: 'SessionQuestion_index_2',
					fields: ['QuestionId', 'SessionWorksheetId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.SessionWorksheet = this.belongsTo(models.SessionWorksheet);
		this.SessionOption = this.hasMany(models.SessionOption);
		this.SessionAsset = this.hasMany(models.SessionAsset);
		this.SessionQuestionSubmission = this.hasMany(models.SessionQuestionSubmission);

		this.Question = this.belongsTo(models.Question);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
