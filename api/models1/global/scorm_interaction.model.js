module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Scorm_interaction', {
        
	UserId: DataTypes.INTEGER,
	WorkbookId: DataTypes.INTEGER,
	sessionUserId: DataTypes.INTEGER,
	interaction_id: DataTypes.STRING,
	result: DataTypes.TEXT,
	learner_response: DataTypes.TEXT,
	timestamp: DataTypes.STRING,
	latency: DataTypes.STRING,
	question_type: DataTypes.TEXT,
	correct_response: DataTypes.TEXT,
	description: DataTypes.TEXT,

	});

	Model.associate = function (models) {
		// this.SessionUser = this.belongsTo(models.SessionUser);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};