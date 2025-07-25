module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('AgentVersion', {
		version: DataTypes.INTEGER,
		config: DataTypes.JSONB,
		default: DataTypes.BOOLEAN,
		created_at: DataTypes.DATE,
		graph_id: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.Agent = this.belongsTo(models.Agent);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
