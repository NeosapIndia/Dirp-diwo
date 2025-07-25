module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripSharingOnTeam', {
		onlyTeamMsgType: DataTypes.STRING,
		header_type: DataTypes.STRING,
		header_text: DataTypes.TEXT,
		cardTitle: DataTypes.TEXT,
		cardSubTitle: DataTypes.TEXT,
		body: DataTypes.TEXT,
		AssetId: DataTypes.INTEGER,
		headerPath: DataTypes.TEXT,
		headerFileName: DataTypes.STRING,
		callToActionText: DataTypes.STRING,
		hyper_link: DataTypes.TEXT,
		type: DataTypes.STRING,

		contentType: DataTypes.STRING,
		pwaheadtxt: DataTypes.TEXT,
		caption: DataTypes.TEXT,
		existingDripId: DataTypes.INTEGER,
		templateType: DataTypes.STRING,
		showCorrectAns: DataTypes.BOOLEAN,
		brief: DataTypes.TEXT,
		quizResultType: DataTypes.STRING,
		timehours: DataTypes.STRING,
		quizRandCount: DataTypes.INTEGER,
		pollResultType: DataTypes.STRING,
		htmlstring: DataTypes.TEXT,

		//spin the wheel
		noOfTimeSpin: DataTypes.INTEGER, //Default 1
		noOfQueForCat: DataTypes.INTEGER, //Default 0
		submitText: DataTypes.STRING,
		custTempId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
		this.TeamSetup = this.belongsTo(models.TeamSetup);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
