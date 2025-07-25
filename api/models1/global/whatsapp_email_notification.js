module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('WhatsAppEmailNotifications', {
		ClientId: DataTypes.INTEGER,
		type: DataTypes.STRING,
	});

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
