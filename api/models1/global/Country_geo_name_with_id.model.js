module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Country_geo_name_with_id', {
        country_name: DataTypes.STRING,
        geoname_id: DataTypes.INTEGER,

    });

    Model.associate = function (models) { };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};