module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('WorkbookUserGroupMapping', {
        WorkbookId: DataTypes.INTEGER,
        UserGroupId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Workbook = this.belongsTo(models.Workbook);
        this.User_group = this.belongsTo(models.User_group);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};