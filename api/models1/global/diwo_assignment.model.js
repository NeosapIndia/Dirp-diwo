module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoAssignment', {
		StartDate: DataTypes.DATE,
		EndDate: DataTypes.DATE,
		status: DataTypes.STRING,
		version: DataTypes.INTEGER,
		assignmentCopy: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.Pathway = this.belongsTo(models.Pathway);
		this.Course = this.belongsTo(models.Course);
		this.Workbook = this.belongsTo(models.Workbook);
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
		this.Role = this.belongsTo(models.Role);

		this.DiwoAssignUserGroupMapping = this.hasMany(models.DiwoAssignUserGroupMapping);
		this.Session = this.hasMany(models.Session);
		this.LearnerAssignment = this.hasMany(models.LearnerAssignment);
		this.DiwoModuleAssign = this.hasMany(models.DiwoModuleAssign);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
		this.SessionUser = this.hasMany(models.SessionUser);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
