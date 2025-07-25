module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('TeamChannel', {
		team_id: DataTypes.STRING,
		channel_id: DataTypes.STRING,
		title: DataTypes.STRING,
		count: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.TeamSetup = this.belongsTo(models.TeamSetup);
		this.CampWhatsAppEmailDrip = this.hasMany(models.CampWhatsAppEmailDrip);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
