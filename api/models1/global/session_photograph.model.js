module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('SessionPhotograph', {
        path: DataTypes.TEXT,
        fieldname: DataTypes.STRING,
        filename : DataTypes.TEXT

    });

    Model.associate = function (models) {
        this.Session = this.belongsTo(models.Session);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};