"use strict";

module.exports = function (sequelize, DataTypes) {
  var Model = sequelize.define('Assigned_post_to_user', {
    UserId: DataTypes.INTEGER,
    PostId: DataTypes.INTEGER,
    CampaignId: DataTypes.INTEGER,
    is_deleted: DataTypes.BOOLEAN,
    isBookmarked: DataTypes.BOOLEAN,
    isLiked: DataTypes.BOOLEAN,
    submit: DataTypes.BOOLEAN,
    score: DataTypes.INTEGER,
    DripCampIndex: DataTypes.INTEGER,
    publishOn: DataTypes.DATE,
    isPublished: DataTypes.BOOLEAN,
    dependencyDripIndex: DataTypes.INTEGER,
    isRead: DataTypes.BOOLEAN,
    isLinkClick: DataTypes.BOOLEAN,
    isDripClickAction: DataTypes.BOOLEAN,
    expiredOn: DataTypes.DATE,
    campaignPaused: DataTypes.BOOLEAN
  });

  Model.associate = function (models) {
    this.User = this.belongsTo(models.User);
    this.Post = this.belongsTo(models.Post);
    this.Campaign = this.belongsTo(models.Campaign);
    this.DripUserQuestion = this.hasMany(models.DripUserQuestion);
    this.Cookie = this.belongsTo(models.Cookie);
  };

  Model.prototype.convertToJSON = function () {
    var json = this.toJSON();
    return json;
  };

  return Model;
};