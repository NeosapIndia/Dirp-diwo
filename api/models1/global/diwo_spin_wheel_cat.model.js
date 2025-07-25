module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoSpinWheelCat', {
		category_index: DataTypes.INTEGER,
		category_name: DataTypes.STRING,
		totalquestion: DataTypes.INTEGER,
		totalscore: DataTypes.INTEGER,
		characterRemain: DataTypes.INTEGER, //default 0
	});

	Model.associate = function (models) {
		this.Worksheet = this.belongsTo(models.Worksheet);
		this.Workbook = this.belongsTo(models.Workbook);
		this.Question = this.hasMany(models.Question);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
