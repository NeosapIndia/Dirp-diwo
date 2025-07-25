module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripSpinWheelCat', {
		category_index: DataTypes.INTEGER,
		category_name: DataTypes.STRING,
		totalquestion: DataTypes.INTEGER,
		totalscore: DataTypes.INTEGER,
		characterRemain: DataTypes.INTEGER, //default 0
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.DripQuestion = this.hasMany(models.DripQuestion);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
