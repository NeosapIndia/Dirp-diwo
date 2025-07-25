module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('LearnerAssignment', {
		StartDate: DataTypes.DATE,
		EndDate: DataTypes.DATE,
		status: DataTypes.STRING,
		eligibleForCertification: DataTypes.BOOLEAN, //Default False
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
