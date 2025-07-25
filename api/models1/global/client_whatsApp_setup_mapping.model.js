module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ClientWhatsAppSetup', {
		WhatsAppSetupId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		mainClient: DataTypes.BOOLEAN,
		forDrip: DataTypes.BOOLEAN, // Default true
		forDiwo: DataTypes.BOOLEAN, //default false
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.WhatsAppSetup = this.belongsTo(models.WhatsAppSetup);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
