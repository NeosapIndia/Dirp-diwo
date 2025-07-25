module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Outbound_message', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        message: DataTypes.TEXT
    });
    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
        this.Asset = this.belongsTo(models.Asset);
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};