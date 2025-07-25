module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User_job_role_mapping', {
        UserId: DataTypes.INTEGER,
        ClientJobRoleId: DataTypes.INTEGER,
        forDrip: DataTypes.BOOLEAN,
        forDiwo: DataTypes.BOOLEAN
    });

    Model.associate = function (models) {
        this.User = this.belongsTo(models.User);
        this.Client_job_role = this.belongsTo(models.Client_job_role);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};