module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Badge', {
		title: DataTypes.STRING,
		description: DataTypes.STRING,
		path: DataTypes.TEXT,
		code: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.Workbook = this.hasMany(models.Workbook);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
