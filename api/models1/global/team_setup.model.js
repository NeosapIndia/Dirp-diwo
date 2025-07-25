module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('TeamSetup', {
		access_token: DataTypes.TEXT,
		refresh_token: DataTypes.TEXT,
		scope: DataTypes.TEXT,
		expires_in: DataTypes.INTEGER,
		team_id: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
		this.DripSharingOnTeam = this.hasMany(models.DripSharingOnTeam);
		this.DripOnlyTeam = this.hasMany(models.DripOnlyTeam);

		this.TeamChatDetail = this.hasMany(models.TeamChatDetail);

		this.ClientTeamSetup = this.hasMany(models.ClientTeamSetup);
		this.TeamChannel = this.hasMany(models.TeamChannel);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
