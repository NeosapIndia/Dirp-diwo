module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('UplodedDripAppEmail', {
		dripType: DataTypes.STRING,
		dripName: DataTypes.TEXT,
		description: DataTypes.TEXT,
		loginRequired: DataTypes.BOOLEAN,
		subjectline: DataTypes.STRING,
		bodycopy: DataTypes.TEXT,
		callToAction: DataTypes.STRING,
		cta_link: DataTypes.STRING,
		errorMsg: DataTypes.STRING,
		isError: DataTypes.BOOLEAN,
		isCreated: DataTypes.BOOLEAN,
		RoleId: DataTypes.INTEGER,
		UserId: DataTypes.INTEGER,
		ClientId: DataTypes.INTEGER,
		account_id: DataTypes.STRING,
		templateType: DataTypes.STRING,
		caption: DataTypes.TEXT,
		Questions: DataTypes.TEXT,
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