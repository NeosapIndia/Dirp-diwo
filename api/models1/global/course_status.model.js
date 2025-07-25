module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('CourseStatus', {
		status: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.SessionUser = this.hasMany(models.SessionUser, { as: 'CS', foreignKey: 'CourseStatusId' });
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
