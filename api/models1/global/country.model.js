module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Country',
		{
			name: DataTypes.STRING,
			countryCode: DataTypes.STRING,
			callingCode: DataTypes.STRING,
			utcOffset: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'Country_index_1',
					fields: ['name'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.Markets = this.belongsToMany(models.Market, { through: 'market_country_mapping' });
		this.Provinces = this.hasMany(models.Province);
		this.Currencies = this.hasMany(models.Currency);
		this.User = this.hasMany(models.User);
		this.Campaign = this.belongsToMany(models.Campaign, { through: 'Campaign_country_mapping' });
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
