module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('CustomerPolicyLog', {
        acceptDate: DataTypes.DATE,
        type: DataTypes.STRING,
        policyType: DataTypes.STRING,
        ipAddress: DataTypes.STRING,
        macAddress: DataTypes.STRING,
        otherDetails: DataTypes.TEXT,
        acceptanceType: DataTypes.STRING,
        forDrip: DataTypes.BOOLEAN,
        forDiwo: DataTypes.BOOLEAN
    });

    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
        this.User = this.belongsTo(models.User);
        this.PolicyChangeLog = this.belongsTo(models.PolicyChangeLog);
        this.Cookie = this.belongsTo(models.Cookie);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};