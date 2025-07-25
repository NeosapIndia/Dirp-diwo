module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('SessionAsset', {
		path: DataTypes.TEXT,
		fileName: DataTypes.STRING,
		type: DataTypes.STRING,
		forBrief: DataTypes.BOOLEAN,
		isTranscoding: DataTypes.BOOLEAN,
		vmoVideoId: DataTypes.STRING,
		cmsVideoId: DataTypes.STRING,
		errorMessage: DataTypes.TEXT,
		MediaCMSUploadQueueId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.SessionUser = this.belongsTo(models.SessionUser);
		this.SessionWorksheet = this.belongsTo(models.SessionWorksheet);
		this.SessionQuestion = this.belongsTo(models.SessionQuestion);
		this.Client = this.belongsTo(models.Client);
		this.DiwoVideoLog = this.hasMany(models.DiwoVideoLog);
		this.MediaCMSUploadQueue = this.belongsTo(models.MediaCMSUploadQueue);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
