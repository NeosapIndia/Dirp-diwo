module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Currency', {
    name: DataTypes.STRING,
    currencySymbol: DataTypes.STRING,
    currencyCode: DataTypes.STRING,
  });

  Model.associate = function (models) {
    this.Country = this.belongsTo(models.Country);
  };

  Model.prototype.convertToJSON = function () {
    let json = this.toJSON();
    return json;
  };
  return Model;
};