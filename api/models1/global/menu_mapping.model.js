module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('menu_mappings', {
        permission: DataTypes.STRING
    });
    Model.associate = function (models) {
        this.Roles = this.belongsTo(models.Role);
        this.Menus = this.belongsTo(models.Menu);
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};