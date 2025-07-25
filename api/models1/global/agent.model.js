module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Agent', {
		openAISecretKey: DataTypes.TEXT,
		assistantId: DataTypes.TEXT,
		type: DataTypes.STRING,
		endPointURL: DataTypes.TEXT,
		customAssistantId: DataTypes.TEXT,
		customApiKey: DataTypes.TEXT,
		assistantName: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.ClientAgentMapping = this.hasMany(models.ClientAgentMapping);
		this.AgentVersion = this.hasMany(models.AgentVersion);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
