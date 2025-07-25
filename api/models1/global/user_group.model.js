module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'User_group',
		{
			title: DataTypes.STRING,
			description: DataTypes.TEXT,
			UserId: DataTypes.INTEGER,
			is_deleted: DataTypes.BOOLEAN,
			forDrip: DataTypes.BOOLEAN,
			forDiwo: DataTypes.BOOLEAN,
			userCount: DataTypes.INTEGER,
			defaultGroupForDrip: DataTypes.BOOLEAN,
			defaultGroupForDiwo: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'User_groups_index_1',
					fields: ['UserId', 'is_deleted', 'RoleId', 'ClientId', 'forDrip'],
				},
				{
					name: 'User_groups_index_2',
					fields: ['UserId', 'is_deleted', 'RoleId', 'ClientId', 'forDiwo'],
				},
				{
					name: 'User_groups_index_3',
					fields: ['is_deleted', 'ClientId', 'forDrip'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsToMany(models.User, { through: 'User_group_mapping' });
		this.Campaign = this.belongsToMany(models.Campaign, { through: 'Campaign_user_group_mapping' });
		this.Campaign = this.belongsToMany(models.Campaign, { through: 'CampUserGroupStartRule' });
		this.Role = this.belongsTo(models.Role);
		this.Workbook = this.belongsToMany(models.Workbook, { through: 'WorkbookUserGroupMapping' });
		this.Drip_camp = this.belongsToMany(models.Drip_camp, { through: 'DripCampUserGroupAction' });
		this.DiwoAssignUserGroupMapping = this.hasMany(models.DiwoAssignUserGroupMapping);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
