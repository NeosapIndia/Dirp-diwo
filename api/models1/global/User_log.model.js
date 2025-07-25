module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('User_log', {
		description: DataTypes.TEXT,
		browser: DataTypes.STRING,
		version: DataTypes.STRING,
		osType: DataTypes.STRING,
		geoIp: DataTypes.STRING,
		source: DataTypes.STRING,
		ip: DataTypes.STRING,
		count: DataTypes.INTEGER,
		deviceType: DataTypes.STRING,
		ProjectName: DataTypes.STRING,
		referenceIds: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
		this.Role = this.belongsTo(models.Role);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
