module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Client_job_role',
		{
			job_role_name: DataTypes.STRING,
			details: DataTypes.TEXT,
			is_deleted: DataTypes.BOOLEAN,
			forDrip: DataTypes.BOOLEAN,
			forDiwo: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'Client_job_roles_index_1',
					fields: ['job_role_name', 'ClientId'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsToMany(models.User, { through: 'User_job_role_mapping' });
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
