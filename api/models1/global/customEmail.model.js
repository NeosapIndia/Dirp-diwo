module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Custom_email', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        type: DataTypes.STRING,
        singleBlastPublishDate: DataTypes.DATE,
        is_active: DataTypes.BOOLEAN,
        scenario: DataTypes.STRING,
        template_id: DataTypes.TEXT,
        simpleBlastDateCount: DataTypes.INTEGER,
        simpleBlastDate1: DataTypes.DATE,
        simpleBlastDate2: DataTypes.DATE,
        simpleBlastDate3: DataTypes.DATE,
        simpleBlastDate4: DataTypes.DATE,
        simpleBlastDate5: DataTypes.DATE,
        simpleBlastTemp1: DataTypes.TEXT,
        simpleBlastTemp2: DataTypes.TEXT,
        simpleBlastTemp3: DataTypes.TEXT,
        simpleBlastTemp4: DataTypes.TEXT,
        simpleBlastTemp5: DataTypes.TEXT,
        is_delete: DataTypes.BOOLEAN
    });

    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};