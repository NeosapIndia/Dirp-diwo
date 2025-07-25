module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('ZoomRegistration', {
		registrant_id: DataTypes.STRING,
		zoomMeetId: DataTypes.STRING,
		topic: DataTypes.STRING,
		start_time: DataTypes.DATE,
		join_url: DataTypes.TEXT,
	});

	Model.associate = function (models) {
		this.Post = this.belongsTo(models.Post);
		this.User = this.belongsTo(models.User);
		this.Assigned_post_to_user = this.belongsTo(models.Assigned_post_to_user);
		this.Campaign = this.belongsTo(models.Campaign);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
