module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_camp', {
		dripName: DataTypes.STRING,
		dripType: DataTypes.STRING,
		PostId: DataTypes.INTEGER,
		dripTriggerRule: DataTypes.STRING,
		dripTriggerDate: DataTypes.DATE,
		actionType: DataTypes.STRING,
		actionTriggerRule: DataTypes.STRING,
		dependencyDripIndex: DataTypes.INTEGER,
		sendAfter: DataTypes.INTEGER,
		userAction: DataTypes.STRING,
		dripFlowType: DataTypes.STRING,
		status: DataTypes.STRING,
		index: DataTypes.INTEGER,
		published: DataTypes.BOOLEAN,
		activityScoreType: DataTypes.STRING,
		score: DataTypes.INTEGER,
		tagsForAction: DataTypes.TEXT,
		systemActionType: DataTypes.STRING,
		tagsForSystemAction: DataTypes.STRING,
		unAssignDayCount: DataTypes.INTEGER,
		dripActionEndDate: DataTypes.DATE,
		within: DataTypes.INTEGER,
		pollOption: DataTypes.TEXT,
		quickReply: DataTypes.STRING,
		milestoneField: DataTypes.STRING,
		recurAnnually: DataTypes.BOOLEAN,

		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		// questionOptions: DataTypes.JSONB,
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.Campaign = this.belongsToMany(models.Campaign, { through: 'Campaign_drip_camp_mapping' });
		this.User_group = this.belongsToMany(models.User_group, { through: 'DripCampUserGroupAction' });
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);
		this.Assigned_post_to_user = this.hasMany(models.Assigned_post_to_user);
		this.CampTakeAction = this.hasMany(models.CampTakeAction);
		this.DripQuestion = this.belongsTo(models.DripQuestion);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
