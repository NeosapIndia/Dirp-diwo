module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Post_header', {
        header_type: DataTypes.STRING,
        header_body: DataTypes.TEXT,
        header_footer: DataTypes.TEXT,
        header_text: DataTypes.TEXT,
        details: DataTypes.TEXT,
        Asset_details_sr_no: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Asset = this.belongsTo(models.Asset);
        this.Post = this.belongsToMany(models.Post, { through: 'Post_header_mapping' });

    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};