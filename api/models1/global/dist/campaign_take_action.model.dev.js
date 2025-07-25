"use strict";

module.exports = function (sequelize, DataTypes) {
  var Model = sequelize.define('CampTakeAction', {
    actionType: DataTypes.STRING,
    tagsForAction: DataTypes.TEXT,
    dependencyDripIndex: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    DripCampIndex: DataTypes.INTEGER,
    DripCampId: DataTypes.INTEGER,
    CampaignId: DataTypes.INTEGER,
    isTriggered: DataTypes.BOOLEAN,
    takeActionOn: DataTypes.DATE,
    ClientId: DataTypes.INTEGER,
    campaignPaused: DataTypes.BOOLEAN
  });

  Model.associate = function (models) {
    this.Campaign = this.belongsTo(models.Campaign);
    this.User = this.belongsTo(models.User);
    this.Client = this.belongsTo(models.Client);
    this.Drip_camp = this.belongsTo(models.Drip_camp);
  };

  Model.prototype.convertToJSON = function () {
    var json = this.toJSON();
    return json;
  };

  return Model;
};