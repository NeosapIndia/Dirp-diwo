module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Workbook', {
		title: DataTypes.STRING,
		descrip: DataTypes.TEXT,
		allowWithoutPreAssign: DataTypes.BOOLEAN,
		allowNewLearner: DataTypes.BOOLEAN,
		newRegProvisional: DataTypes.BOOLEAN,
		status: DataTypes.STRING,
		isDeleted: DataTypes.BOOLEAN,
		geoTag: DataTypes.BOOLEAN, //false
		isMediaWorksheet: DataTypes.BOOLEAN, //false
		certificateData: DataTypes.JSONB,
		condition: DataTypes.STRING,
		isAppliedBadge: DataTypes.BOOLEAN, //false
		isAppliedCertificate: DataTypes.BOOLEAN, //false
		haveCertificate: DataTypes.BOOLEAN, //false
		CertificateLine1: DataTypes.STRING,
		CertificateLine2: DataTypes.STRING,
		CertificateLine3: DataTypes.STRING,
		e_duration: DataTypes.INTEGER,
		l_outcomes: DataTypes.STRING,
		isAllowedPDF: DataTypes.BOOLEAN, //false
		default: DataTypes.BOOLEAN, //true
		version: DataTypes.INTEGER, // default 0
		isAddSignature: DataTypes.BOOLEAN,

		signatureName1: DataTypes.STRING,
		signatureDesignation1: DataTypes.STRING,
		signaturePath1: DataTypes.TEXT,
		signaturePathName1: DataTypes.STRING,

		signatureName2: DataTypes.STRING,
		signatureDesignation2: DataTypes.STRING,
		signaturePath2: DataTypes.TEXT,
		signaturePathName2: DataTypes.STRING,

		// scorm model
		fileName: DataTypes.STRING,
		type: DataTypes.STRING,
		isSCORM: DataTypes.BOOLEAN,
		extractedZipFilePath: DataTypes.TEXT,
		launchFile: DataTypes.TEXT,
		masteryScore: DataTypes.INTEGER, // default 0
		IsMasteryScore: DataTypes.BOOLEAN,
	});

	Model.associate = function (models) {
		this.Course = this.belongsToMany(models.Course, { through: 'Course_workbook_mapping' });
		this.Option = this.hasMany(models.Option);
		this.Worksheet = this.hasMany(models.Worksheet);
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
		this.DiwoAsset = this.hasMany(models.DiwoAsset);
		this.Question = this.hasMany(models.Question);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.User_group = this.belongsToMany(models.User_group, { through: 'WorkbookUserGroupMapping' });
		this.User = this.belongsToMany(models.User, { through: 'WorkbookTrainerMapping' });
		this.SurveyQueGroup = this.hasMany(models.SurveyQueGroup);
		this.DiwoModule = this.belongsTo(models.DiwoModule);
		this.Pathway = this.belongsToMany(models.Pathway, { through: 'PathwayCourseMapping' });
		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);
		this.DiwoModuleAssign = this.hasMany(models.DiwoModuleAssign);

		// this.Certificate = this.belongsTo(models.Certificate);
		this.Badge = this.belongsTo(models.Badge);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);

		this.Workbook = this.hasMany(models.Workbook, { as: 'SubWorkbooks', foreignKey: 'BaseWorkbookId' });
		this.Workbook = this.belongsTo(models.Workbook, { as: 'ParentWorkbook', foreignKey: 'BaseWorkbookId' });

		this.Scorm_tracking = this.hasMany(models.Scorm_tracking);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
