module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ClientCustomReport', {
		report_name: DataTypes.TEXT,
	});
	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.System_branding = this.belongsTo(models.System_branding);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
