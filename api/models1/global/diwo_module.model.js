module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoModule', {
		type: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Workbook = this.hasMany(models.Workbook);
		this.Course_workbook_mapping = this.hasMany(models.Course_workbook_mapping);
		this.PathwayCourseMapping = this.hasMany(models.PathwayCourseMapping);
		this.Session = this.hasMany(models.Session);
		this.DiwoModuleAssign = this.hasMany(models.DiwoModuleAssign);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
