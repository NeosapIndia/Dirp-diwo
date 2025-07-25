module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('PolicyChangeLog', {
        policyChangeDate: DataTypes.DATE,
        ipAddress: DataTypes.STRING,
        macAddress: DataTypes.STRING,
        policyTitle: DataTypes.STRING,
        filePath: DataTypes.STRING,
        activeUserCount: DataTypes.INTEGER,
        acceptedPolicyCount: DataTypes.INTEGER,
        forDrip: DataTypes.BOOLEAN,
        forDiwo: DataTypes.BOOLEAN
    });
    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
        this.Role = this.belongsTo(models.Role);
        this.User = this.belongsTo(models.User);
        this.Market = this.belongsTo(models.Market);
        this.CustomerPolicyLog = this.hasMany(models.CustomerPolicyLog);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};