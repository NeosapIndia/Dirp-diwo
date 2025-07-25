module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('UplodedLinkAsset', {
		title: DataTypes.STRING,
		description: DataTypes.TEXT,
		tags: DataTypes.TEXT,
		link: DataTypes.TEXT,
		errorMsg: DataTypes.TEXT,
		isError: DataTypes.BOOLEAN,
		isCreated: DataTypes.BOOLEAN,
		UserId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		srNo: DataTypes.INTEGER,
		selfHostedVideo: DataTypes.BOOLEAN,
	});

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};