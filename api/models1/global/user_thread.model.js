module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('UserThread', {
		threadId: DataTypes.STRING,
		AgentType: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
