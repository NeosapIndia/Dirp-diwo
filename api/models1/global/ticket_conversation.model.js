module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('TicketConversation', {
		UserId: DataTypes.INTEGER,
		isAdminUser: DataTypes.BOOLEAN,
		message: DataTypes.TEXT,
		status: DataTypes.STRING,
		TicketId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		// this.Client = this.belongsTo(models.Client);
		// this.Post = this.belongsTo(models.Post);
		this.Ticket = this.belongsTo(models.Ticket);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
