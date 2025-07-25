module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Ip_address_with_country_geoname_id', {
        ip_address: DataTypes.STRING,
        country_geoname_id: DataTypes.INTEGER,
        limit_start: DataTypes.DOUBLE,
        limit_end: DataTypes.DOUBLE,
    });

    Model.associate = function (models) { };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};