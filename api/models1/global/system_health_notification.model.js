module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('SystemHealthNotification', {
		CPUNotification: DataTypes.BOOLEAN, // Default true
		DiskNotification: DataTypes.BOOLEAN, // Default true
		MemoryNotification: DataTypes.BOOLEAN, // Default true
	});
	Model.associate = function (models) {};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
