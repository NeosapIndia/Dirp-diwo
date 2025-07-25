module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('DiwoVimeoCredential', {
		vUserId: DataTypes.STRING,
		vClientId: DataTypes.STRING,
		vToken: DataTypes.STRING,
		vClientSecKey: DataTypes.TEXT,
		presetId: DataTypes.STRING,
		presetName: DataTypes.STRING,
		CMSUserName: DataTypes.STRING,
		CMSPassword: DataTypes.STRING,
		CMSPlaylistId: DataTypes.STRING,
		playListCount: DataTypes.INTEGER, //Default 0
		playListVideoCount: DataTypes.INTEGER, //Default 0
	});

	Model.associate = function (models) {
		this.Client = this.hasMany(models.Client);
		this.SessionQuestionSubmission = this.hasMany(models.SessionQuestionSubmission);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
