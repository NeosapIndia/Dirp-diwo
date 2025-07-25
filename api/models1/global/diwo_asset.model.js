module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoAsset', {
		path: DataTypes.TEXT,
		fileName: DataTypes.STRING,
		type: DataTypes.STRING,
		vmoVideoId: DataTypes.STRING,
		isTranscoding: DataTypes.BOOLEAN,
		forBrief: DataTypes.BOOLEAN,
		errorMessage: DataTypes.TEXT,
		cmsVideoId: DataTypes.STRING,
		MediaCMSUploadQueueId: DataTypes.INTEGER,
		MediaUploadStatus: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Workbook = this.belongsTo(models.Workbook);
		this.Worksheet = this.belongsTo(models.Worksheet);
		this.Question = this.belongsTo(models.Question);
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
