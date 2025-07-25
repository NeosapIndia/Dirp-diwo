module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User_client_mappings', {
        ClientId: DataTypes.INTEGER,
        UserId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
        this.User = this.belongsTo(models.User);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};