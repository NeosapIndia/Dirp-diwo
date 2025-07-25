module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('WorkbookTrainerMapping', {
        WorkbookId: DataTypes.INTEGER,
        UserId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Workbook = this.belongsTo(models.Workbook);
        this.User = this.belongsTo(models.User);
        this.Client = this.belongsTo(models.Client);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};