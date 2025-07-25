module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('CampChannelMapping', {
		CampaignId: DataTypes.INTEGER,
		TeamChannelId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Campaign = this.belongsTo(models.Campaign);
		this.TeamChannel = this.belongsTo(models.TeamChannel);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
