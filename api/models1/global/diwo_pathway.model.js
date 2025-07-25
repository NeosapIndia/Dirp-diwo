module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Pathway', {
		title: DataTypes.STRING,
		subtitle: DataTypes.STRING,
		description: DataTypes.TEXT,
		e_duration: DataTypes.INTEGER,
		l_outcomes: DataTypes.STRING,
		avatar: DataTypes.STRING,
		avatar_file_name: DataTypes.STRING,
		avatar_path: DataTypes.TEXT,
		customFields: DataTypes.JSONB,
		status: DataTypes.STRING,
		isDeleted: DataTypes.BOOLEAN,
		totalModules: DataTypes.INTEGER,
		totalCourses: DataTypes.INTEGER,
		haveCertification: DataTypes.BOOLEAN,
		version: DataTypes.INTEGER, //Default 1
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Course = this.belongsToMany(models.Course, { through: 'PathwayCourseMapping' });
		this.Workbook = this.belongsToMany(models.Workbook, { through: 'PathwayCourseMapping' });
		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
