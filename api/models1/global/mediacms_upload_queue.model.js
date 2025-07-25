module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('MediaCMSUploadQueue', {
		fileName: DataTypes.STRING,
		filePath: DataTypes.TEXT,
		description: DataTypes.TEXT,
		UserId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		status: DataTypes.STRING,
		isUploaded: DataTypes.BOOLEAN, // default false,
		isUploading: DataTypes.BOOLEAN, // default false,
		isTranscoding: DataTypes.BOOLEAN, // default false,
		isUploadError: DataTypes.BOOLEAN, // default false,
		isTransodingError: DataTypes.BOOLEAN, // default false,
		errorMessage: DataTypes.TEXT,
		retryCount: DataTypes.INTEGER, // default 0,
		path: DataTypes.TEXT,
		cmsVideoId: DataTypes.STRING,
		isPhysicalFileDeleted: DataTypes.BOOLEAN, //default false
	});

	Model.associate = function (models) {
		this.DiwoAsset = this.hasMany(models.DiwoAsset);
		this.SessionAsset = this.hasMany(models.SessionAsset);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
