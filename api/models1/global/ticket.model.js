module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Ticket', {
		ContactId: DataTypes.INTEGER,
		UserId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		functionName: DataTypes.STRING,
		status: DataTypes.STRING,
		query: DataTypes.TEXT,
		comment: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		// this.Client = this.belongsTo(models.Client);
		// this.Post = this.belongsTo(models.Post);
		this.User = this.belongsTo(models.User);
		this.TicketConversation = this.hasMany(models.TicketConversation);
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);
		this.CampTakeAction = this.hasMany(models.CampTakeAction);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
