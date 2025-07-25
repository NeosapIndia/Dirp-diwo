module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('UserBriefFile', {
		DripCampIndex: DataTypes.INTEGER,
		fileType: DataTypes.STRING,
		path: DataTypes.TEXT,
		grade: DataTypes.STRING,
		fileName: DataTypes.TEXT,
		fileSize: DataTypes.STRING,
		videoId: DataTypes.STRING,
		isTranscoding: DataTypes.STRING,
		thumbnail: DataTypes.TEXT,
		errorMessage: DataTypes.TEXT,
		UploadedOnS3: DataTypes.BOOLEAN,
		transcript: DataTypes.TEXT,
		AIReview: DataTypes.TEXT,
		cmsVideoId: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Post = this.belongsTo(models.Post);
		this.Campaign = this.belongsTo(models.Campaign);
		this.DripUserQuestion = this.belongsTo(models.DripUserQuestion);
		this.DripVideoLog = this.hasMany(models.DripVideoLog);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
