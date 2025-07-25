module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Province', {
        name: DataTypes.STRING
    });
    Model.associate = function (models) {
        this.Country = this.belongsTo(models.Country);
        this.Markets = this.belongsToMany(models.Market, { through: 'market_province_mapping' });
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};