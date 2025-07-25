module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Post_header_mapping', {
        PostId: DataTypes.INTEGER,
        PostHeaderId: DataTypes.INTEGER,
        post_type: DataTypes.STRING
    });

    Model.associate = function (models) {
        this.Post = this.belongsTo(models.Post);
        this.Post_header = this.belongsTo(models.Post_header);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};