module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Asset', {
		title: DataTypes.TEXT,
		description: DataTypes.TEXT,
		language: DataTypes.STRING,
		is_deleted: DataTypes.BOOLEAN,
		tagName: DataTypes.TEXT,
		image_count: DataTypes.INTEGER,
		field_name: DataTypes.STRING,
		UserId: DataTypes.INTEGER,
		selfHostedVideo: DataTypes.BOOLEAN,
		driveId: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.CreatedUser = this.belongsTo(models.User, { as: 'createdUser' });
		this.UpdatedUser = this.belongsTo(models.User, { as: 'updatedUser' });
		this.Client = this.belongsTo(models.Client);
		this.Asset_detail = this.hasMany(models.Asset_detail);
		this.Outbound_message = this.hasMany(models.Outbound_message);
		this.Drip_whatsapp_native = this.hasMany(models.Drip_whatsapp_native);
		this.Drip_whatsapp_non_native = this.hasMany(models.Drip_whatsapp_non_native);
		// this.Post_header = this.hasMany(models.Post_header);
		this.Post = this.belongsToMany(models.Post, { through: 'Post_asset_mapping' });
		this.Post = this.belongsToMany(models.Post, { through: 'PostBriefAsset', as: 'Post_brief_assets' });
		this.DripQuestion = this.hasMany(models.DripQuestion);
		this.DripOption = this.hasMany(models.DripOption);
		this.DripUserQuestion = this.hasMany(models.DripUserQuestion);
		this.DripUserOption = this.hasMany(models.DripUserOption);
		this.User = this.belongsTo(models.User);

		this.DripOnlyTeam = this.hasMany(models.DripOnlyTeam);
		this.DripSharingOnTeam = this.hasMany(models.DripSharingOnTeam);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
