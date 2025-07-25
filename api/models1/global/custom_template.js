module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('CustomTemplate', {
		template: DataTypes.TEXT,
		templateName: DataTypes.STRING,
		templatePlaceholders: DataTypes.JSONB,
		ClientId: DataTypes.INTEGER,
	});

	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
