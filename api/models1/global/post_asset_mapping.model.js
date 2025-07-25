module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Post_asset_mapping', {
        PostId: DataTypes.INTEGER,
        AssetId: DataTypes.INTEGER,
        index: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Post = this.belongsTo(models.Post);
        this.Asset = this.belongsTo(models.Asset);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};