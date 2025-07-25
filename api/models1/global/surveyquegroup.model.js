module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('SurveyQueGroup', {
		index: DataTypes.INTEGER,
		group_name: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Worksheet = this.belongsTo(models.Worksheet);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Question = this.hasMany(models.Question);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
