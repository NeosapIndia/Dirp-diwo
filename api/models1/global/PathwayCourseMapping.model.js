module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('PathwayCourseMapping', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true, // Set primary key here
			autoIncrement: true, // Optional if you want this field to auto-increment
			allowNull: false,
		},
		PathwayId: DataTypes.INTEGER,
		CourseId: DataTypes.INTEGER,
		CourseIndex: DataTypes.INTEGER,
		CourseName: DataTypes.TEXT,
		Dependency: DataTypes.BOOLEAN,
		ModuleDepedencyIndex: DataTypes.TEXT,
		ModuleIndex: DataTypes.INTEGER,
		ModuleName: DataTypes.TEXT,
		ModuleOperation: DataTypes.STRING,
		ModuleTypeName: DataTypes.STRING,
		WorkbookId: DataTypes.INTEGER,
		DiwoModuleId: DataTypes.INTEGER,
		isPartCourse: DataTypes.BOOLEAN,
		isCertificationModule: DataTypes.BOOLEAN, // Default False
		CourseVersion: DataTypes.INTEGER, //Default 1
		isShowCertifiedDropDown: DataTypes.BOOLEAN, // Default False
	});

	Model.associate = function (models) {
		this.Course = this.belongsTo(models.Course);
		this.Pathway = this.belongsTo(models.Pathway);
		this.Workbook = this.belongsTo(models.Workbook);
		this.DiwoModule = this.belongsTo(models.DiwoModule);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
