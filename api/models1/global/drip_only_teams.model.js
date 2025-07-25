module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DripOnlyTeam', {
		onlyTeamMsgType: DataTypes.STRING,
		header_type: DataTypes.STRING,
		header_text: DataTypes.TEXT,
		cardTitle: DataTypes.TEXT,
		cardSubTitle: DataTypes.TEXT,
		body: DataTypes.TEXT,
		AssetId: DataTypes.INTEGER,
		headerPath: DataTypes.TEXT,
		headerFileName: DataTypes.STRING,
		callToActionText1: DataTypes.STRING,
		hyper_link1: DataTypes.TEXT,
		trackableLink1: DataTypes.BOOLEAN,
		callToActionText2: DataTypes.STRING,
		hyper_link2: DataTypes.TEXT,
		trackableLink2: DataTypes.BOOLEAN,
		callToActionText3: DataTypes.STRING,
		hyper_link3: DataTypes.TEXT,
		trackableLink3: DataTypes.BOOLEAN,
		type: DataTypes.STRING,
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
