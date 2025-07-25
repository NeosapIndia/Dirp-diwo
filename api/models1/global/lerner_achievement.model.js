module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('LearnerAchievement', {
		data: DataTypes.JSONB,
		isAssignmentCertification: DataTypes.BOOLEAN, //Default False
		filePath: DataTypes.TEXT,
		isBadge: DataTypes.BOOLEAN,
		isCertificate: DataTypes.BOOLEAN,
	});

	Model.associate = function (models) {
		// this.Certificate = this.belongsTo(models.Certificate);
		this.Badge = this.belongsTo(models.Badge);
		this.SessionUser = this.belongsTo(models.SessionUser);
		this.Workbook = this.belongsTo(models.Workbook);
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
		this.Session = this.belongsTo(models.Session);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.Notification = this.hasMany(models.Notification);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
