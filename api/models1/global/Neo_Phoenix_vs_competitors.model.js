module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Neo_Phoenix_vs_competitor', {
		feature: DataTypes.TEXT,
		feature_category: DataTypes.TEXT,
		neo_phoenix_g_mt: DataTypes.TEXT,
		neo_phoenix_gx_at: DataTypes.TEXT,
		neo_phoenix_vx_mt: DataTypes.TEXT,
		neo_phoenix_zx_mt: DataTypes.TEXT,
		neo_phoenix_zx_at: DataTypes.TEXT,
		neo_phoenix_gx_mt: DataTypes.TEXT,
		kia_carnival_s: DataTypes.TEXT,
		kia_carnival_si: DataTypes.TEXT,
		kia_carnival_sli: DataTypes.TEXT,
		kia_carnival_platinum_sxl: DataTypes.TEXT,
	});
	Model.associate = function (models) {
		//   this.Roles = this.belongsToMany(models.Role, { through: 'menu_mappings' });
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
