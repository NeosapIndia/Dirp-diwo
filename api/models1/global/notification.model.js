module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Notification', {
		isBell: DataTypes.BOOLEAN,
		isPopup: DataTypes.BOOLEAN,
		isEmail: DataTypes.BOOLEAN,
		message: DataTypes.TEXT,
		isRead: DataTypes.BOOLEAN,
		UserId: DataTypes.INTEGER,
		forDrip: DataTypes.BOOLEAN,
		forDiwo: DataTypes.BOOLEAN,
	});

	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.LearnerAchievement = this.belongsTo(models.LearnerAchievement);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
