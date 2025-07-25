module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'CampWhatsAppEmailDrip',
		{
			dripType: DataTypes.STRING,
			CampaignId: DataTypes.INTEGER,
			DripCampId: DataTypes.INTEGER,
			PostId: DataTypes.INTEGER,
			DripCampIndex: DataTypes.INTEGER,
			publishOn: DataTypes.DATE,
			UserId: DataTypes.INTEGER,
			isTriggered: DataTypes.BOOLEAN,
			dependencyDripIndex: DataTypes.INTEGER,
			errorMessage: DataTypes.TEXT,
			WAppTriggerId: DataTypes.TEXT,
			EmailTriggerId: DataTypes.TEXT,
			status: DataTypes.STRING,
			cause: DataTypes.STRING,
			deliveryCode: DataTypes.INTEGER,
			sentDate: DataTypes.DATE,
			deliveryDate: DataTypes.DATE,
			readDate: DataTypes.DATE,
			channel: DataTypes.STRING,
			clickDate: DataTypes.DATE,
			templateId: DataTypes.TEXT,
			templateName: DataTypes.TEXT,
			mailMessageId: DataTypes.TEXT,
			emailEventId: DataTypes.TEXT,
			failDate: DataTypes.DATE,
			campaignPaused: DataTypes.BOOLEAN,
			code: DataTypes.STRING,
			quickReplyResponse: DataTypes.TEXT,
			retryCount: DataTypes.INTEGER, //Default zero (0)
			clickExternalLink: DataTypes.BOOLEAN,
			clickExternalLinkDate: DataTypes.DATE,
			WTriggerTime: DataTypes.DATE,
			isZoomMeeting: DataTypes.BOOLEAN, //default false
			TeamTiggerId: DataTypes.STRING,
			isChannelMsg: DataTypes.BOOLEAN,
			isMeta: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'CampWhatsAppEmailDrips_index_1', //Campaign.service
					fields: ['CampaignId', 'PostId', 'DripCampIndex', 'UserId'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_2', //Campaign.service
					fields: ['UserId', 'CampaignId', 'DripCampIndex', 'DripCampId', 'PostId'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_3', //Report.controller
					fields: ['PostId', 'isTriggered', 'WAppTriggerId', 'dripType', 'publishOn'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_4', //Webhook.controller
					fields: ['WAppTriggerId'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_5', //Webhook.controller
					fields: ['EmailTriggerId'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_6', //Report.controller
					fields: ['publishOn', 'dripType'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_7', //Report.controller
					fields: ['publishOn', 'DripCampIndex', 'DripCampId', 'CampaignId'],
				},
				{
					name: 'CampWhatsAppEmailDrips_index_8', //pwa.controller
					fields: ['code'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Post = this.belongsTo(models.Post);
		this.Campaign = this.belongsTo(models.Campaign);
		this.Drip_camp = this.belongsTo(models.Drip_camp);
		this.Assigned_post_to_user = this.belongsTo(models.Assigned_post_to_user);
		this.TeamChannel = this.belongsTo(models.TeamChannel);
		this.Ticket = this.belongsTo(models.Ticket);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
