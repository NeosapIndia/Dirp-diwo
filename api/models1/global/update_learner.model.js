module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Update_learner', {
		srNo: DataTypes.STRING,
		first: DataTypes.STRING,
		last: DataTypes.STRING,
		email: DataTypes.STRING,
		mobile: DataTypes.STRING,
		country: DataTypes.STRING,
		state: DataTypes.STRING,
		city: DataTypes.STRING,
		zipCode: DataTypes.STRING,
		tags: DataTypes.TEXT,
		client_id: DataTypes.STRING,
		clientName: DataTypes.STRING,
		jobRole: DataTypes.STRING,
		learnerId: DataTypes.STRING,
		whatappOptIn: DataTypes.STRING,
		whatsappPermission: DataTypes.BOOLEAN,
		emailPermission: DataTypes.BOOLEAN,
		isError: DataTypes.BOOLEAN,
		errorMsg: DataTypes.TEXT,
		isUpdated: DataTypes.BOOLEAN,
		forDrip: DataTypes.BOOLEAN,
		forDiwo: DataTypes.BOOLEAN,
		groupIds: DataTypes.STRING,
		customFields: DataTypes.JSON,
		team_id: DataTypes.STRING,
		status: DataTypes.STRING,
		action: DataTypes.STRING,
	});
	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
		this.Client = this.belongsTo(models.Client);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
