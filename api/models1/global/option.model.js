module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Option', {
		text: DataTypes.TEXT,
		isCorrectAnswer: DataTypes.BOOLEAN,
		assetPath: DataTypes.TEXT,
		assetName: DataTypes.STRING,
		assetType: DataTypes.STRING,
		sr_no: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Worksheet = this.belongsTo(models.Worksheet);
		this.Question = this.belongsTo(models.Question);
		this.SessionOption = this.hasMany(models.SessionOption);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
