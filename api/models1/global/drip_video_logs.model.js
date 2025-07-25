module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripVideoLog', {
		seconds: DataTypes.FLOAT,
		percent: DataTypes.FLOAT,
		duration: DataTypes.FLOAT,
	});

	Model.associate = function (models) {
		this.Asset_detail = this.belongsTo(models.Asset_detail);
		this.User = this.belongsTo(models.User);
		this.UserBriefFile = this.belongsTo(models.UserBriefFile);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
