module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Promotional_banner', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        venue: DataTypes.TEXT,
        image_tab: DataTypes.TEXT,
        image_extra: DataTypes.TEXT,
        image_mobile: DataTypes.TEXT,
        scenario: DataTypes.STRING,
        price: DataTypes.STRING,
        is_published: DataTypes.BOOLEAN,
        display_devices: DataTypes.STRING,
        internal_link_tag: DataTypes.STRING,
        mobile_location: DataTypes.STRING,
        publish_date: DataTypes.DATE,
        is_delete: DataTypes.BOOLEAN,
        squency: DataTypes.INTEGER,
        external_link: DataTypes.TEXT
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