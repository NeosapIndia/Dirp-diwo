module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'CampTakeAction',
		{
			actionType: DataTypes.STRING,
			tagsForAction: DataTypes.TEXT,
			dependencyDripIndex: DataTypes.INTEGER,
			UserId: DataTypes.INTEGER,
			DripCampIndex: DataTypes.INTEGER,
			DripCampId: DataTypes.INTEGER,
			CampaignId: DataTypes.INTEGER,
			isTriggered: DataTypes.BOOLEAN,
			takeActionOn: DataTypes.DATE,
			ClientId: DataTypes.INTEGER,
			campaignPaused: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'CampTakeAction_index_1',
					fields: ['isTriggered', 'campaignPaused', 'takeActionOn', 'actionType'],
				},
				{
					name: 'CampTakeAction_index_2',
					fields: ['UserId', 'CampaignId', 'DripCampIndex', 'actionType', 'tagsForAction', 'DripCampId'],
				},
				{
					name: 'CampTakeAction_index_3',
					fields: ['UserId', 'CampaignId', 'DripCampIndex'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Campaign = this.belongsTo(models.Campaign);
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
		this.Drip_camp = this.belongsTo(models.Drip_camp);
		this.Ticket = this.belongsTo(models.Ticket);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
