module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ClientAgentMapping', {
		AgentId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		mainClient: DataTypes.BOOLEAN,
		forDrip: DataTypes.BOOLEAN, // Default true
		forDiwo: DataTypes.BOOLEAN, //default false
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.Agent = this.belongsTo(models.Agent);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
