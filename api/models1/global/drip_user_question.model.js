module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'DripUserQuestion',
		{
			question: DataTypes.TEXT,
			questionType: DataTypes.STRING,
			answerCount: DataTypes.INTEGER,
			allowFileTypes: DataTypes.STRING,
			fileSize: DataTypes.STRING,
			numberOfFiles: DataTypes.INTEGER,
			isTextResponse: DataTypes.BOOLEAN,
			isFileSubmission: DataTypes.BOOLEAN,
			offlineTaskNote: DataTypes.TEXT,
			surveyCharLimit: DataTypes.INTEGER,
			surveyNote: DataTypes.TEXT,
			multipleOption: DataTypes.BOOLEAN,
			DripQuestionId: DataTypes.INTEGER, // Change The Column Name
			skipQuestion: DataTypes.BOOLEAN, // default false
			isQuesRequired: DataTypes.BOOLEAN, // default true
			zoomLinkTo: DataTypes.STRING,
			latitude: DataTypes.STRING,
			longitude: DataTypes.STRING,
			geoLocation: DataTypes.TEXT,
			UploadOnVimeo: DataTypes.BOOLEAN, //default true
			showTranscript: DataTypes.BOOLEAN, //default false
			aiReview: DataTypes.BOOLEAN, //default false
			spinCatIndex: DataTypes.INTEGER,
			spinCatName: DataTypes.STRING,
			spinQueScore: DataTypes.INTEGER, //Default 0
			country: DataTypes.STRING,
			ratingType: DataTypes.STRING,
			ratingScaleMinCount: DataTypes.INTEGER, //Default 0
			ratingScaleMaxCount: DataTypes.INTEGER, //Default 0
			ratingMinLabel: DataTypes.STRING,
			ratingMaxLabel: DataTypes.STRING,
			surveyUserRating: DataTypes.INTEGER, //Default 0
		},
		{
			indexes: [
				{
					name: 'DripUserQuestions_index_1',
					fields: ['AssignedPostToUserId'],
				},
				{
					name: 'DripUserQuestions_index_2',
					fields: ['AssignedPostToUserId', 'DripQuestionId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Assigned_post_to_user = this.belongsTo(models.Assigned_post_to_user);
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
		this.DripUserOption = this.hasMany(models.DripUserOption);
		this.UserBriefFile = this.hasMany(models.UserBriefFile);
		this.DripQuestion = this.belongsTo(models.DripQuestion);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
