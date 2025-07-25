module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('UplodedDripAppWhatsapp', {
		dripType: DataTypes.STRING,
		dripName: DataTypes.TEXT,
		description: DataTypes.TEXT,
		language: DataTypes.STRING,
		loginRequired: DataTypes.BOOLEAN,
		headerType: DataTypes.STRING,
		headerText: DataTypes.STRING,
		body: DataTypes.TEXT,
		footer: DataTypes.STRING,
		callToAction: DataTypes.STRING,
		cta_link: DataTypes.TEXT,
		errorMsg: DataTypes.STRING,
		isError: DataTypes.BOOLEAN,
		isCreated: DataTypes.BOOLEAN,
		RoleId: DataTypes.INTEGER,
		UserId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		account_id: DataTypes.STRING,
		whatsappTemplateCategory: DataTypes.STRING,
		templateType: DataTypes.STRING,
		caption: DataTypes.TEXT,
		Questions: DataTypes.TEXT,
		WhatsAppSetupId: DataTypes.INTEGER,
		srNo: DataTypes.INTEGER,

		pollResultType: DataTypes.STRING,
		showCorrectAns: DataTypes.BOOLEAN,
		quizResultType: DataTypes.STRING,
		brief: DataTypes.TEXT,
		quizRandCount: DataTypes.STRING,
	});

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};