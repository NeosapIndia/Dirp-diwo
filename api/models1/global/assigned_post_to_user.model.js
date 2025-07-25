module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Assigned_post_to_user',
		{
			UserId: DataTypes.INTEGER,
			PostId: DataTypes.INTEGER,
			CampaignId: DataTypes.INTEGER,
			is_deleted: DataTypes.BOOLEAN,
			isBookmarked: DataTypes.BOOLEAN,
			isLiked: DataTypes.BOOLEAN,
			submit: DataTypes.BOOLEAN,
			score: DataTypes.FLOAT,
			DripCampIndex: DataTypes.INTEGER,
			publishOn: DataTypes.DATE,
			isPublished: DataTypes.BOOLEAN,
			dependencyDripIndex: DataTypes.INTEGER,
			isRead: DataTypes.BOOLEAN,
			isLinkClick: DataTypes.BOOLEAN,
			isDripClickAction: DataTypes.BOOLEAN,
			expiredOn: DataTypes.DATE,
			campaignPaused: DataTypes.BOOLEAN,
			isLoadOnHome: DataTypes.BOOLEAN,
			code: DataTypes.STRING,
			actionStatus: DataTypes.STRING,
			DripCampId: DataTypes.INTEGER,
			option: DataTypes.TEXT,
			clickExternalLink: DataTypes.BOOLEAN,
			clickExternalLinkDate: DataTypes.DATE,
			consumed: DataTypes.FLOAT,
			percent: DataTypes.FLOAT,
			max: DataTypes.FLOAT,
			isZoomMeeting: DataTypes.BOOLEAN, //default false
			actionIntent: DataTypes.STRING,
			externalLink: DataTypes.JSONB,
			hyperlink: DataTypes.TEXT,
			noOfTimeSpin: DataTypes.INTEGER, //Default 0
			assignSpinQue: DataTypes.TEXT,
			custTempPageViewed: DataTypes.JSONB,
		},
		{
			indexes: [
				{
					name: 'Assigned_post_to_user_index_1',
					fields: ['CampaignId', 'DripCampIndex', 'PostId'],
				},
				{
					name: 'Assigned_post_to_user_index_2',
					fields: ['CampaignId', 'DripCampIndex', 'UserId'],
				},
				{
					name: 'Assigned_post_to_user_index_3',
					fields: ['CampaignId', 'DripCampIndex', 'publishOn'],
				},
				{
					name: 'Assigned_post_to_user_index_4',
					fields: ['code'],
				},
				{
					name: 'Assigned_post_to_user_index_5',
					fields: ['CampaignId', 'DripCampIndex', 'publishOn', 'isRead'],
				},
				{
					name: 'Assigned_post_to_user_index_6',
					fields: ['code', 'isPublished', 'publishOn'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Post = this.belongsTo(models.Post);
		this.Campaign = this.belongsTo(models.Campaign);
		this.Drip_camp = this.belongsTo(models.Drip_camp);
		this.DripUserQuestion = this.hasMany(models.DripUserQuestion);
		this.Cookie = this.belongsTo(models.Cookie);
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);

		this.ZoomRegistration = this.hasMany(models.ZoomRegistration);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
