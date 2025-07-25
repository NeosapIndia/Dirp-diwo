module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Course_workbook_mapping', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true, // Set primary key here
			autoIncrement: true, // Optional if you want this field to auto-increment
			allowNull: false,
		},
		CourseId: DataTypes.INTEGER,
		WorkbookId: DataTypes.INTEGER,
		DiwoModuleId: DataTypes.INTEGER,
		ModuleName: DataTypes.STRING,
		ModuleIndex: DataTypes.INTEGER,
		ModuleTypeName: DataTypes.STRING,
		ModuleLastUpdated: DataTypes.DATE,
		isCertificationModule: DataTypes.BOOLEAN, // Default False
	});

	Model.associate = function (models) {
		this.Course = this.belongsTo(models.Course);
		this.Workbook = this.belongsTo(models.Workbook);
		this.DiwoModule = this.belongsTo(models.DiwoModule);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
