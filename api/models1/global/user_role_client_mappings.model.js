module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'User_role_client_mapping',
		{
			RoleId: DataTypes.INTEGER,
			UserId: DataTypes.INTEGER,
			ClientId: DataTypes.INTEGER,
			forDrip: DataTypes.BOOLEAN,
			forDiwo: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'User_role_client_mappings_index_1',
					fields: ['RoleId', 'UserId', 'forDrip'],
				},
				{
					name: 'User_role_client_mappings_index_2',
					fields: ['ClientId', 'UserId', 'forDiwo', 'RoleId'],
				},
				{
					name: 'User_role_client_mappings_index_3',
					fields: ['UserId', 'RoleId', 'ClientId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Role = this.belongsTo(models.Role);
		this.User = this.belongsTo(models.User);
		this.Client = this.belongsTo(models.Client);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
