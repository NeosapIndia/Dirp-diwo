module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Campaign_user_group_mapping', {
        UserGroupId: DataTypes.INTEGER,
        CampaignId: DataTypes.INTEGER,
    });

    Model.associate = function (models) {
        this.Campaign = this.belongsTo(models.Campaign);
        this.User_group = this.belongsTo(models.User_group);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};