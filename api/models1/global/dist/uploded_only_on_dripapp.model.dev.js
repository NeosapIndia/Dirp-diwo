"use strict";

module.exports = function (sequelize, DataTypes) {
  var Model = sequelize.define('UplodedOnlyOnDripApp', {
    dripType: DataTypes.STRING,
    dripName: DataTypes.TEXT,
    description: DataTypes.TEXT,
    loginRequired: DataTypes.BOOLEAN,
    errorMsg: DataTypes.STRING,
    isError: DataTypes.BOOLEAN,
    isCreated: DataTypes.BOOLEAN,
    RoleId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    ClientId: DataTypes.INTEGER,
    account_id: DataTypes.STRING,
    templateType: DataTypes.STRING,
    caption: DataTypes.TEXT,
    Questions: DataTypes.TEXT
  });

  Model.prototype.convertToJSON = function () {
    var json = this.toJSON();
    return json;
  };

  return Model;
};