module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('CampaignTagMapping', {
        tag: DataTypes.STRING,
        CampaignId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Campaign = this.belongsTo(models.Campaign);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};