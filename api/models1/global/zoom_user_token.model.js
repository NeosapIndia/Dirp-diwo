module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ZoomUserToken', {
		access_token: DataTypes.TEXT,
		refresh_token: DataTypes.TEXT,
		scope: DataTypes.TEXT,
		expires_in: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
