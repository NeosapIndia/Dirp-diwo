module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Post', {
		drip_status: DataTypes.STRING,
		is_deleted: DataTypes.BOOLEAN,
		isLikedCount: DataTypes.INTEGER,
		isBookmarkCount: DataTypes.INTEGER,
		drip_description: DataTypes.TEXT,
		drip_title: DataTypes.TEXT,
		drip_type: DataTypes.STRING,
		hyper_link: DataTypes.TEXT,
		caption: DataTypes.TEXT,
		tempType: DataTypes.STRING,
		UserId: DataTypes.INTEGER,
		requiredLogging: DataTypes.BOOLEAN,
		showCorrectAns: DataTypes.BOOLEAN,
		brief: DataTypes.TEXT,
		quizResultType: DataTypes.STRING,
		timehours: DataTypes.STRING,
		quizRandCount: DataTypes.INTEGER,
		pollResultType: DataTypes.STRING,
		externalLinkFlag: DataTypes.BOOLEAN,
		externalLink1: DataTypes.TEXT,
		externalLinkLabel1: DataTypes.STRING,
		showBackButton: DataTypes.BOOLEAN, //default true
		pwaheadtxt: DataTypes.TEXT,
		isZoomMeeting: DataTypes.BOOLEAN, //default false
		externalLink2: DataTypes.TEXT,
		externalLinkLabel2: DataTypes.STRING,
		externalLink3: DataTypes.TEXT,
		externalLinkLabel3: DataTypes.STRING,
		externalLink4: DataTypes.TEXT,
		externalLinkLabel4: DataTypes.STRING,
		externalLink5: DataTypes.TEXT,
		externalLinkLabel5: DataTypes.STRING,
		externalLink6: DataTypes.TEXT,
		externalLinkLabel6: DataTypes.STRING,
		externalLink7: DataTypes.TEXT,
		externalLinkLabel7: DataTypes.STRING,
		externalLink8: DataTypes.TEXT,
		externalLinkLabel8: DataTypes.STRING,
		externalLink9: DataTypes.TEXT,
		externalLinkLabel9: DataTypes.STRING,
		externalLink10: DataTypes.TEXT,
		externalLinkLabel10: DataTypes.STRING,
		htmlstring: DataTypes.TEXT,
		submitText: DataTypes.STRING,
		custTempPlaceholders: DataTypes.JSONB,
		customTemplate: DataTypes.TEXT,
	});
	Model.associate = function (models) {
		// this.Campaigns = this.belongsToMany(models.Campaign, { through: 'Campaign_post_mapping' });
		this.Asset = this.belongsToMany(models.Asset, { through: 'Post_asset_mapping' });
		this.Post_header = this.belongsToMany(models.Post_header, { through: 'Post_header_mapping' });
		this.Assigned_post_to_user = this.hasMany(models.Assigned_post_to_user);
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
		// New Drip Mapping
		this.Drip_native = this.hasMany(models.Drip_native);
		this.Drip_whatsapp_native = this.hasMany(models.Drip_whatsapp_native);
		this.Drip_only_email = this.hasMany(models.Drip_only_email);
		this.Drip_email_non_native = this.hasMany(models.Drip_email_non_native);
		this.Drip_whatsapp_non_native = this.hasMany(models.Drip_whatsapp_non_native);
		this.Drip_camp = this.hasMany(models.Drip_camp);
		this.DripOption = this.hasMany(models.DripOption);
		this.DripQuestion = this.hasMany(models.DripQuestion);
		this.DripUserQuestion = this.hasMany(models.DripUserQuestion);
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);

		this.Bot_message = this.hasMany(models.Bot_message);
		this.BotFunctionDetail = this.hasMany(models.BotFunctionDetail);

		this.Bot_send_msg = this.hasMany(models.Bot_send_msg);

		this.Asset = this.belongsToMany(models.Asset, { through: 'PostBriefAsset', as: 'Post_brief_assets' });
		this.UserBriefFile = this.hasMany(models.UserBriefFile);
		this.System_branding = this.belongsTo(models.System_branding);

		this.ZoomRegistration = this.hasMany(models.ZoomRegistration);

		this.DripOnlyTeam = this.hasMany(models.DripOnlyTeam);
		this.DripSharingOnTeam = this.hasMany(models.DripSharingOnTeam);
		this.DripSpinWheelCat = this.hasMany(models.DripSpinWheelCat);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
