module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'DripUserOption',
		{
			text: DataTypes.TEXT,
			correctAns: DataTypes.BOOLEAN,
			userAnswer: DataTypes.TEXT,
			selectedAns: DataTypes.BOOLEAN,
			sr_no: DataTypes.INTEGER,
			userSeq: DataTypes.INTEGER,
			AssignedPostToUserId: DataTypes.INTEGER,
			DripOptionId: DataTypes.INTEGER,
			skipQueType: DataTypes.STRING,
		},
		{
			indexes: [
				{
					name: 'DripUserOptions_index_1',
					fields: ['AssignedPostToUserId', 'DripOptionId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.DripUserQuestion = this.belongsTo(models.DripUserQuestion);
		this.Asset = this.belongsTo(models.Asset);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};