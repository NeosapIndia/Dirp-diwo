module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Cookie', {
        cookie: DataTypes.TEXT,
        guestUser: DataTypes.BOOLEAN,
        Wthoutlgnuser: DataTypes.BOOLEAN,
    });

    Model.associate = function (models) {
        this.User = this.hasMany(models.User);
        this.Assigned_post_to_user = this.hasMany(models.Assigned_post_to_user);
        this.CustomerPolicyLog = this.hasMany(models.CustomerPolicyLog);

    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};