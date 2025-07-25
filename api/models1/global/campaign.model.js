module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Campaign',
		{
			title: DataTypes.STRING,
			description: DataTypes.TEXT,

			startDate: DataTypes.DATE,
			startRule: DataTypes.STRING,
			startAfter: DataTypes.INTEGER,
			operator: DataTypes.STRING,

			status: DataTypes.STRING,
			isDeleted: DataTypes.BOOLEAN,
			UserId: DataTypes.INTEGER,
			RoleId: DataTypes.INTEGER,
			ClientId: DataTypes.INTEGER,
			endDate: DataTypes.DATE,

			successMetrics: DataTypes.BOOLEAN,
			successMetricsList: DataTypes.JSONB,
			flowType: DataTypes.STRING, // Need to Current Campaign Record to set 'Campaign'

			forTest: DataTypes.BOOLEAN   //Defatult false

		},
		{
			indexes: [
				{
					name: 'Campaign_index_1', //Campaign.service
					fields: ['status'],
				},
				{
					name: 'Campaign_index_2', //Campaign.service
					fields: ['startRule', 'isDeleted', 'status', 'endDate', 'ClientId'],
				},
				{
					name: 'Campaign_index_3', //Campaign.service
					fields: ['id', 'isDeleted', 'status'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		this.Role = this.belongsTo(models.Role);
		this.User_group = this.belongsToMany(models.User_group, { through: 'Campaign_user_group_mapping' });
		this.User_group = this.belongsToMany(models.User_group, { through: 'CampUserGroupStartRule' });
		this.Drip_camp = this.belongsToMany(models.Drip_camp, { through: 'Campaign_drip_camp_mapping' });
		this.Assigned_post_to_user = this.hasMany(models.Assigned_post_to_user);
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);
		this.CampaignTagMapping = this.hasMany(models.CampaignTagMapping);
		this.CampTakeAction = this.hasMany(models.CampTakeAction);
		this.UserBriefFile = this.hasMany(models.UserBriefFile);

		this.ZoomRegistration = this.hasMany(models.ZoomRegistration);
		this.CampChannelMapping = this.hasMany(models.CampChannelMapping);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
