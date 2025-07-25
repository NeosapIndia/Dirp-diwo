module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoModuleAssign', {
		WorkbookId: DataTypes.INTEGER,
		ModuleName: DataTypes.TEXT,
		ModuleTypeName: DataTypes.STRING,
		ModuleStartDate: DataTypes.DATE,
		ModuleEndDate: DataTypes.DATE,
		ModuleIndex: DataTypes.INTEGER,
		CourseId: DataTypes.INTEGER,
		CourseIndex: DataTypes.INTEGER,
		CourseName: DataTypes.TEXT,
		DiwoModuleId: DataTypes.INTEGER,
		TrainerId: DataTypes.INTEGER,
		isAssignmentCertification: DataTypes.BOOLEAN, // Default False
		ModuleDepedencyIndex: DataTypes.TEXT,
		ModuleOperation: DataTypes.STRING,
		isPublish: DataTypes.BOOLEAN, //UPDATE  "DiwoModuleAssigns" SET "isPublish" = true where "isPublish" = false;
		CourseVersion: DataTypes.INTEGER, // Default 0
	});

	Model.associate = function (models) {
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Course = this.belongsTo(models.Course);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.DiwoModule = this.belongsTo(models.DiwoModule);
		this.Session = this.hasMany(models.Session);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
