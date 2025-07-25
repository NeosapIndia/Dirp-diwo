module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('market_country_mapping', {
        CountryId: DataTypes.INTEGER,
        MarketId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Country = this.belongsTo(models.Country);
        this.Market = this.belongsTo(models.Market);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};