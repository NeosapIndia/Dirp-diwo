module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('TeamCredential', {
		client_id: DataTypes.STRING,
		client_secret: DataTypes.STRING,
		tenant_id: DataTypes.STRING,
	});
	Model.associate = function (models) {};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
