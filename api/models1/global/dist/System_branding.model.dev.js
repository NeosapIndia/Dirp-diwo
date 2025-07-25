"use strict";

module.exports = function (sequelize, DataTypes) {
  var Model = sequelize.define('System_branding', {
    //PWA About page Data
    theme_image_original_name: DataTypes.STRING,
    theme_image_name: DataTypes.STRING,
    theme_image_path: DataTypes.TEXT,
    about_text: DataTypes.TEXT,
    // PWA Header Icon
    learner_app_icon_original_name: DataTypes.STRING,
    learner_app_icon_name: DataTypes.STRING,
    learner_app_icon_path: DataTypes.TEXT,
    // PWA Header Icon
    admin_side_header_logo_original_name: DataTypes.STRING,
    admin_side_header_logo_name: DataTypes.STRING,
    admin_side_header_logo_path: DataTypes.TEXT,
    //Email Branding
    EmailSenderName: DataTypes.STRING,
    EmailSenderId: DataTypes.STRING,
    EmailTemplateId: DataTypes.TEXT,
    welcomeEmail: DataTypes.BOOLEAN,
    welcomeSubject: DataTypes.STRING,
    welcomeBody: DataTypes.TEXT,
    welcomeButton: DataTypes.STRING,
    compMobNo: DataTypes.BOOLEAN,
    ContactEmailForLearner: DataTypes.STRING,
    ContactPhoneForLearner: DataTypes.STRING
  });

  Model.associate = function (models) {
    this.Client = this.hasMany(models.Client);
  };

  Model.prototype.convertToJSON = function () {
    var json = this.toJSON();
    return json;
  };

  return Model;
};