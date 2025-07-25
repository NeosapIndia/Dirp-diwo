module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoAssignUserGroupMapping', {
		DiwoAssignmentId: DataTypes.INTEGER,
		UserGroupId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.DiwoAssignment = this.belongsTo(models.DiwoAssignment);
		this.User_group = this.belongsTo(models.User_group);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
