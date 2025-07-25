module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripOption', {
		text: DataTypes.TEXT,
		isCorrectAnswer: DataTypes.BOOLEAN,
		sr_no: DataTypes.INTEGER,
		fileName: DataTypes.STRING,
		filePath: DataTypes.TEXT,
		fileType: DataTypes.STRING,
		skipQueType: DataTypes.STRING,
	});

	Model.associate = function (models) {
		this.DripQuestion = this.belongsTo(models.DripQuestion);
		this.Client = this.belongsTo(models.Client);
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};