module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'EmailDeliveryStatus',
		{
			statusData: DataTypes.TEXT,
			isProcessed: DataTypes.BOOLEAN,
			status: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'EmailDeliveryStatus_index_1', //Webhook.controller
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
