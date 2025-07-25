module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('PathwayStatus', {
		status: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.SessionUser = this.hasMany(models.SessionUser, { as: 'PS', foreignKey: 'PathwayStatusId' });
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
