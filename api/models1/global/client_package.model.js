module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Client_Package', {
        max_user_limit: DataTypes.INTEGER,
    });
    Model.associate = function (models) {
        this.Client = this.hasMany(models.Client);
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};