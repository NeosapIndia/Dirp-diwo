module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_native', {
		caption: DataTypes.TEXT,
		OtherDripType: DataTypes.BOOLEAN,
		existingDripId: DataTypes.INTEGER,
		contentType: DataTypes.STRING,
		templateType: DataTypes.STRING,
		showCorrectAns: DataTypes.BOOLEAN,
		brief: DataTypes.TEXT,
		quizResultType: DataTypes.STRING,
		timehours: DataTypes.STRING,
		quizRandCount: DataTypes.INTEGER,
		pollResultType: DataTypes.STRING,
		pwaheadtxt: DataTypes.TEXT,
		htmlstring: DataTypes.TEXT,
		//spin the wheel
		noOfTimeSpin: DataTypes.INTEGER, //Default 1
		noOfQueForCat: DataTypes.INTEGER, //Default 0
		submitText: DataTypes.STRING,
		custTempId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
