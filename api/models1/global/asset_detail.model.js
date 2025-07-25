module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Asset_detail', {
		path: DataTypes.TEXT,
		text: DataTypes.TEXT,
		fieldname: DataTypes.STRING,
		name: DataTypes.STRING,
		displayType: DataTypes.STRING,
		language: DataTypes.STRING,
		sr_no: DataTypes.INTEGER,
		title: DataTypes.STRING,
		vimeoLink: DataTypes.TEXT,
		isTranscoding: DataTypes.BOOLEAN,
		videoUri: DataTypes.TEXT,
		size: DataTypes.STRING,
		vmoVideoId: DataTypes.STRING,
		selfHostedVideo: DataTypes.BOOLEAN,
		errorMessage: DataTypes.TEXT,
		cmsVideoId: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Asset = this.belongsTo(models.Asset);
		this.DripVideoLog = this.hasMany(models.DripVideoLog);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
