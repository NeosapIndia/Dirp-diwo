module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'BotFunctionDetail',
		{
			msg: DataTypes.STRING,
			header: DataTypes.STRING,
			type: DataTypes.STRING,
			tag: DataTypes.STRING,
			option: DataTypes.TEXT,
			number: DataTypes.STRING,
			isDrip: DataTypes.BOOLEAN,
			status: DataTypes.BOOLEAN,
			ClientId: DataTypes.INTEGER,
			PostId: DataTypes.INTEGER,
			lastQuestion: DataTypes.INTEGER,
			isDripFlow: DataTypes.BOOLEAN,
			/////////////////////////////////
			tagForContact: DataTypes.STRING, // Rename from tagForDripFlow to tagForContact
			/////////////////////////////////
			startIngId: DataTypes.INTEGER,

			isTicket: DataTypes.BOOLEAN, // Default is false
			tagForAdmin: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'BotFunctionDetail_index_1',
					fields: ['status', 'number', 'tag'],
				},
				{
					name: 'BotFunctionDetail_index_2',
					fields: ['lastQuestion'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.Post = this.belongsTo(models.Post);
		this.User = this.belongsTo(models.User);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
