module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('SessionUser', {
		title: DataTypes.STRING,
		descrip: DataTypes.TEXT,
		allowWithoutPreAssign: DataTypes.BOOLEAN,
		allowNewLearner: DataTypes.BOOLEAN,
		newRegProvisional: DataTypes.BOOLEAN,
		status: DataTypes.STRING,
		isDeleted: DataTypes.BOOLEAN,
		SessionStatus: DataTypes.STRING,
		attendanceStatus: DataTypes.STRING,
		trainerNote: DataTypes.TEXT,
		forTrainer: DataTypes.BOOLEAN,
		expiryDate: DataTypes.DATE,
		isPreAssigned: DataTypes.BOOLEAN,
		newRegister: DataTypes.BOOLEAN,

		isAppliedBadge: DataTypes.BOOLEAN, //false
		isAppliedCertificate: DataTypes.BOOLEAN, //false
		haveCertificate: DataTypes.BOOLEAN, //false
		certificateData: DataTypes.JSONB,
		CertificateLine1: DataTypes.STRING,
		CertificateLine2: DataTypes.STRING,
		CertificateLine3: DataTypes.STRING,
		condition: DataTypes.STRING,
		eligibleForCertification: DataTypes.BOOLEAN, //Default False
		ModuleStatus: DataTypes.STRING,
		ModuleIndex: DataTypes.INTEGER,
		ModuleDepedencyIndex: DataTypes.TEXT,
		isAccess: DataTypes.BOOLEAN, //Default True
		ModuleOperation: DataTypes.STRING,
		isAllowedPDF: DataTypes.BOOLEAN, //false
		markMePresentDate: DataTypes.DATE,

		isPublish: DataTypes.BOOLEAN, //False
		isAddSignature: DataTypes.BOOLEAN,

		signatureName1: DataTypes.STRING,
		signatureDesignation1: DataTypes.STRING,
		signaturePath1: DataTypes.TEXT,
		signaturePathName1: DataTypes.STRING,

		signatureName2: DataTypes.STRING,
		signatureDesignation2: DataTypes.STRING,
		signaturePath2: DataTypes.TEXT,
		signaturePathName2: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Workbook = this.belongsTo(models.Workbook);
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Session = this.belongsTo(models.Session);
		this.SessionWorksheet = this.hasMany(models.SessionWorksheet);
		this.SessionAsset = this.hasMany(models.SessionAsset);
		this.Badge = this.belongsTo(models.Badge);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
		this.DiwoModuleAssign = this.belongsTo(models.DiwoModuleAssign);
		this.LearnerAchievement = this.belongsTo(models.LearnerAchievement);
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
		this.CourseStatus = this.belongsTo(models.CourseStatus, { as: 'CS', foreignKey: 'CourseStatusId' });
		this.PathwayStatus = this.belongsTo(models.PathwayStatus, { as: 'PS', foreignKey: 'PathwayStatusId' });
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
