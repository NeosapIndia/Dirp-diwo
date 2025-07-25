module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Session', {
		title: DataTypes.STRING,
		location: DataTypes.STRING,
		dateWithTime: DataTypes.DATE,
		link: DataTypes.TEXT,
		status: DataTypes.STRING,
		isDeleted: DataTypes.BOOLEAN,
		workbookData: DataTypes.TEXT,
		trainerNote: DataTypes.TEXT,
		step: DataTypes.INTEGER,
		SessionStartDate: DataTypes.DATE,
		SessionEndDate: DataTypes.DATE,
		language: DataTypes.STRING,
		code: DataTypes.STRING,
		adminLink: DataTypes.STRING,
		password: DataTypes.STRING,
		enddateWithTime: DataTypes.DATE,
		trainerSurvey: DataTypes.BOOLEAN,
		latitude: DataTypes.STRING,
		longitude: DataTypes.STRING,
		geoLocation: DataTypes.TEXT,
		DiwoModuleId: DataTypes.INTEGER,
		isAssignmentCertification: DataTypes.BOOLEAN,
		CreatedBy: DataTypes.INTEGER,
		ClosedBy: DataTypes.INTEGER,
		recordedLink: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.Workbook = this.belongsTo(models.Workbook);
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.SessionPhotograph = this.hasMany(models.SessionPhotograph);
		this.SessionWorksheet = this.hasMany(models.SessionWorksheet);
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
		this.DiwoModule = this.belongsTo(models.DiwoModule);
		this.DiwoModuleAssign = this.belongsTo(models.DiwoModuleAssign);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
