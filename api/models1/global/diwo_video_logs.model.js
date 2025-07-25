module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoVideoLog', {
		seconds: DataTypes.FLOAT,
		percent: DataTypes.FLOAT,
		duration: DataTypes.FLOAT,
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.SessionAsset = this.belongsTo(models.SessionAsset);
		this.DiwoAsset = this.belongsTo(models.DiwoAsset);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
