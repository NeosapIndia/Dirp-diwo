module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('market_province_mapping', {
        ProvinceId: DataTypes.INTEGER,
        MarketId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Market = this.belongsTo(models.Market);
        this.Province = this.belongsTo(models.Province);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};