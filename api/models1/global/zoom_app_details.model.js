module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ZoomAppDetail', {
		zoom_client_id: DataTypes.STRING,
		zoom_client_secret_id: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
