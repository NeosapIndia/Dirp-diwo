module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Drip_only_email', {
		email_body: DataTypes.TEXT,
		email_subject_line: DataTypes.TEXT,
		templateType: DataTypes.STRING,
		contentType: DataTypes.STRING,
		caption: DataTypes.TEXT,
		isSendGridTemplate: DataTypes.BOOLEAN, //Default is True
		brodEmailAssetPath: DataTypes.JSONB,
		brodEmailTemplatePath: DataTypes.STRING,
		brodEmailAttachmentPath: DataTypes.JSONB,
		brod_attach_type: DataTypes.STRING,
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
