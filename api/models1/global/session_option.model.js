module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'SessionOption',
		{
			text: DataTypes.TEXT,
			correctAns: DataTypes.BOOLEAN,
			assetPath: DataTypes.TEXT,
			assetName: DataTypes.STRING,
			assetType: DataTypes.STRING,
			userAnswer: DataTypes.TEXT,
			selectedAns: DataTypes.BOOLEAN,
			sr_no: DataTypes.INTEGER,
			userSeq: DataTypes.INTEGER,
		},
		{
			indexes: [
				{
					name: 'SessionOptions_index_1',
					fields: ['OptionId', 'SessionWorksheetId'],
				},
			],
		}
	);

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.SessionQuestion = this.belongsTo(models.SessionQuestion);
		this.Option = this.belongsTo(models.Option);
		this.SessionWorksheet = this.belongsTo(models.SessionWorksheet);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
