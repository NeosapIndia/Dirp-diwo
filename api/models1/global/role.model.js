module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Role', {
		name: DataTypes.STRING,
		details: DataTypes.TEXT,
		dripRole: DataTypes.BOOLEAN,
		diwoRole: DataTypes.BOOLEAN,
	});
	Model.associate = function (models) {
		this.User = this.belongsToMany(models.User, { through: 'User_role_client_mapping' });
		this.Menus = this.belongsToMany(models.Menu, { through: 'menu_mappings' });
		this.Client = this.belongsToMany(models.Client, { through: 'User_role_client_mapping' });
		this.PolicyChangeLog = this.hasMany(models.PolicyChangeLog);

		this.User_group = this.hasMany(models.User_group);
		this.Campaign = this.hasMany(models.Campaign);
		this.Workbook = this.hasMany(models.Workbook);

		this.User_log = this.hasMany(models.User_log);
		this.ZoomUserToken = this.hasMany(models.ZoomUserToken);

		this.TeamSetup = this.hasMany(models.TeamSetup);
		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
