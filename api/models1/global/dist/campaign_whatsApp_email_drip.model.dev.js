"use strict";

module.exports = function (sequelize, DataTypes) {
  var Model = sequelize.define('CampWhatsAppEmailDrip', {
    dripType: DataTypes.STRING,
    CampaignId: DataTypes.INTEGER,
    DripCampId: DataTypes.INTEGER,
    PostId: DataTypes.INTEGER,
    DripCampIndex: DataTypes.INTEGER,
    publishOn: DataTypes.DATE,
    UserId: DataTypes.INTEGER,
    isTriggered: DataTypes.BOOLEAN,
    dependencyDripIndex: DataTypes.INTEGER,
    errorMessage: DataTypes.TEXT,
    WAppTriggerId: DataTypes.TEXT,
    EmailTriggerId: DataTypes.TEXT,
    status: DataTypes.STRING,
    cause: DataTypes.STRING,
    deliveryCode: DataTypes.INTEGER,
    sentDate: DataTypes.DATE,
    deliveryDate: DataTypes.DATE,
    readDate: DataTypes.DATE,
    channel: DataTypes.STRING,
    clickDate: DataTypes.DATE,
    templateId: DataTypes.TEXT,
    templateName: DataTypes.TEXT,
    mailMessageId: DataTypes.TEXT,
    emailEventId: DataTypes.TEXT,
    failDate: DataTypes.DATE,
    campaignPaused: DataTypes.BOOLEAN
  });

  Model.associate = function (models) {
    this.User = this.belongsTo(models.User);
    this.Post = this.belongsTo(models.Post);
    this.Campaign = this.belongsTo(models.Campaign);
    this.Drip_camp = this.belongsTo(models.Drip_camp);
  };

  Model.prototype.convertToJSON = function () {
    var json = this.toJSON();
    return json;
  };

  return Model;
};