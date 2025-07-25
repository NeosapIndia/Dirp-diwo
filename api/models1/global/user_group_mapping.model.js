module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User_group_mapping', {
        UserGroupId: DataTypes.INTEGER,
        UserId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.User = this.belongsTo(models.User);
        this.User_group = this.belongsTo(models.User_group);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};