module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Menu', {
    name: DataTypes.STRING,
    code: DataTypes.STRING
  });
  Model.associate = function (models) {
    this.Roles = this.belongsToMany(models.Role, { through: 'menu_mappings' });
  };
  Model.prototype.convertToJSON = function () {
    let json = this.toJSON();
    return json;
  };
  return Model;
};