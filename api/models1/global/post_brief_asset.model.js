module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('PostBriefAsset', {
		PostId: DataTypes.INTEGER,
		AssetId: DataTypes.INTEGER,
		index: DataTypes.INTEGER,
		forPreview: DataTypes.BOOLEAN,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.Asset = this.belongsTo(models.Asset);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
