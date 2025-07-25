module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('sign_in_message', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        image_tab: DataTypes.TEXT,
        image_mobile: DataTypes.TEXT,
        is_delete: DataTypes.BOOLEAN,
        is_popup: DataTypes.BOOLEAN,
        external_link: DataTypes.TEXT,
        is_published: DataTypes.BOOLEAN,
        type: DataTypes.STRING,
        publish_date: DataTypes.DATE,
        image_extra: DataTypes.TEXT,
        cardType: DataTypes.TEXT,
        from_display_on: DataTypes.TEXT,
        to_display_on: DataTypes.TEXT,
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