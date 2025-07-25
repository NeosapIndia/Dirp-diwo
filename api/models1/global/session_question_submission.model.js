module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('SessionQuestionSubmission', {
		type: DataTypes.STRING,
		path: DataTypes.TEXT,
		size: DataTypes.STRING,
		fileName: DataTypes.TEXT,
		thumnail: DataTypes.TEXT,
		UploadedOnS3: DataTypes.BOOLEAN,
		grade: DataTypes.STRING,
		isTranscoding: DataTypes.BOOLEAN,
		vmoVideoId: DataTypes.STRING,
		vimeoPath: DataTypes.TEXT,
		cmsVideoId: DataTypes.STRING,
		errorMessage: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.SessionWorksheet = this.belongsTo(models.SessionWorksheet);
		this.SessionQuestion = this.belongsTo(models.SessionQuestion);
		this.DiwoVimeoCredential = this.belongsTo(models.DiwoVimeoCredential);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
