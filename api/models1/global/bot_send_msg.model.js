module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Bot_send_msg',
		{
			messageId: DataTypes.STRING, // Varchar(50) == Varchar(255)
			UserId: DataTypes.INTEGER,
			type: DataTypes.STRING,
			data: DataTypes.TEXT,
			PostId: DataTypes.INTEGER,
			msgType: DataTypes.STRING,
			ClientId: DataTypes.INTEGER,
			url: DataTypes.TEXT,
			status: DataTypes.STRING,
			cause: DataTypes.STRING,
			deliveryCode: DataTypes.INTEGER,
			channel: DataTypes.STRING,
			sentDate: DataTypes.DATE,
			deliveryDate: DataTypes.DATE,
			readDate: DataTypes.DATE,
			failDate: DataTypes.DATE,
			errorMessage: DataTypes.TEXT,
			openAIMessageId: DataTypes.TEXT,
			threadId: DataTypes.TEXT,
			runId: DataTypes.TEXT,
			isChat: DataTypes.BOOLEAN,
			isQuickReply: DataTypes.BOOLEAN, //false
			isReplied: DataTypes.BOOLEAN, //false
			respStatus: DataTypes.STRING,
			isMeta: DataTypes.BOOLEAN,
			WABANumber: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'Bot_send_msg_index_1',
					fields: ['createdAt', 'ClientId'],
				},
				{
					name: 'Bot_send_msg_index_2',
					fields: ['messageId'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.User = this.belongsTo(models.User);
		this.Post = this.belongsTo(models.Post);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
