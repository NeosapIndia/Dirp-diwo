module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Customer_ticket', {
        userId: DataTypes.INTEGER,
        ticketId: DataTypes.STRING,
        projType: DataTypes.STRING

    });
    Model.associate = function (models) {
        this.user = this.belongsTo(models.User, { as: 'user' });
        this.Client = this.belongsTo(models.Client);
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};