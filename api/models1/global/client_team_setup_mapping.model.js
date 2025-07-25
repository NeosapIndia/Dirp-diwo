module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ClientTeamSetup', {
		mainClient: DataTypes.BOOLEAN,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.TeamSetup = this.belongsTo(models.TeamSetup);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
