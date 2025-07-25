module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('DripCampUserGroupAction', {
        UserGroupId: DataTypes.INTEGER,
        DripCampId: DataTypes.INTEGER,
    });

    Model.associate = function (models) {
        this.User_group = this.belongsTo(models.User_group);
        this.Drip_camp = this.belongsTo(models.Drip_camp);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};