module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Course', {
		title: DataTypes.STRING,
		subtitle: DataTypes.STRING,
		description: DataTypes.TEXT,
		e_duration: DataTypes.INTEGER,
		l_outcomes: DataTypes.STRING,
		avatar: DataTypes.STRING,
		avatar_file_name: DataTypes.STRING,
		avatar_path: DataTypes.TEXT,
		customFields: DataTypes.JSONB,
		totalModules: DataTypes.INTEGER,
		status: DataTypes.STRING,
		isDeleted: DataTypes.BOOLEAN,
		haveCertification: DataTypes.BOOLEAN, //Default False
		version: DataTypes.INTEGER, //Default 0
	});

	Model.associate = function (models) {
		this.Workbook = this.belongsToMany(models.Workbook, { through: 'Course_workbook_mapping' });
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Pathway = this.belongsToMany(models.Pathway, { through: 'PathwayCourseMapping' });
		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);
		this.DiwoModuleAssign = this.hasMany(models.DiwoModuleAssign);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
