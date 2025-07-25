module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Market', {
		name: DataTypes.STRING,
		status: DataTypes.BOOLEAN,
		verify_using: DataTypes.STRING,
		db_name: DataTypes.STRING,
		market_short_name: DataTypes.STRING,
		marketing_site_language: DataTypes.STRING,
		marketing_site_country: DataTypes.STRING,
		support_HubStop_key: DataTypes.STRING,
		support_number: DataTypes.STRING,

		review_url: DataTypes.STRING,

		tosUrl: DataTypes.TEXT,
		privacyPolicyUrl: DataTypes.TEXT,
		dpaUrl: DataTypes.TEXT,
		cookiePolicyUrl: DataTypes.TEXT,
		pwaverifyUsing: DataTypes.STRING,
	});
	Model.associate = function (models) {
		this.Countries = this.belongsToMany(models.Country, { through: 'market_country_mapping' });
		this.Provinces = this.belongsToMany(models.Province, { through: 'market_province_mapping' });
		this.Currency = this.belongsTo(models.Currency);
		this.User = this.hasMany(models.User);
		this.Upload_learner = this.hasMany(models.Upload_learner);
		this.PolicyChangeLog = this.hasMany(models.PolicyChangeLog);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};