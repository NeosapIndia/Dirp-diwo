module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Document', {
		title: DataTypes.STRING,
		name: DataTypes.STRING,
		path: DataTypes.TEXT,
		s3Path: DataTypes.TEXT,
		is_deleted: DataTypes.BOOLEAN,
		type: DataTypes.STRING,
		size: DataTypes.STRING,
		customFields: DataTypes.JSONB,
		vectorIds: DataTypes.TEXT,
		LlamaParams: DataTypes.JSONB,
		advancedDocParsing: DataTypes.BOOLEAN,
		imageDetails: DataTypes.JSONB,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
		this.User = this.belongsTo(models.User);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
