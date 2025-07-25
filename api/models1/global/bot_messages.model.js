module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Bot_message',
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
		},
		{
			indexes: [
				{
					name: 'Bot_message_index_1',
					fields: ['status', 'number', 'tag'],
				},
				{
					name: 'Bot_message_index_2',
					fields: ['lastQuestion'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.Post = this.belongsTo(models.Post);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
