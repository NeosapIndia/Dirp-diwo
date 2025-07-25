module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Campaign_drip_camp_mapping', {
        DripCampId: DataTypes.INTEGER,
        CampaignId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        this.Campaign = this.belongsTo(models.Campaign);
        this.Drip_camp = this.belongsTo(models.Drip_camp);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};
