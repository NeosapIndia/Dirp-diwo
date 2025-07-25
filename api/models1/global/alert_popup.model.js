module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Alert_popup', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        image_web: DataTypes.TEXT,
        image_mobile: DataTypes.TEXT,
        is_delete: DataTypes.BOOLEAN,
        PublishedId: DataTypes.INTEGER,
        is_popup: DataTypes.BOOLEAN,
        external_link: DataTypes.TEXT,
        internal_tags: DataTypes.TEXT,
        scenario: DataTypes.STRING,
        is_published: DataTypes.BOOLEAN,
        type: DataTypes.STRING,
        publish_date: DataTypes.DATE,
        image_extra: DataTypes.TEXT,
        ClientId: DataTypes.INTEGER

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