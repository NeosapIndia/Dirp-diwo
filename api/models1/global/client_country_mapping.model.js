module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Client_country_mapping', {
        CountryId: DataTypes.INTEGER,
        ClientId: DataTypes.INTEGER,
    });

    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
        this.Country = this.belongsTo(models.Country);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};