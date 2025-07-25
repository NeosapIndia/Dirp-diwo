module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'WhatsAppDeliveryStatus',
		{
			statusData: DataTypes.TEXT,
			isProcessed: DataTypes.BOOLEAN,
			status: DataTypes.STRING,
			isMeta: DataTypes.BOOLEAN,
		},
		{
			indexes: [
				{
					name: 'WhatsAppDeliveryStatus_index_1', //Webhook.controller
					fields: ['isProcessed'],
				},
			],
		}
	);

	Model.associate = function (models) {};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
