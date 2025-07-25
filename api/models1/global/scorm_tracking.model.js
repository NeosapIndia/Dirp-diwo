module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('Scorm_tracking', {
        
	UserId: DataTypes.INTEGER,
	WorkbookId: DataTypes.INTEGER,
	sessionUserId: DataTypes.INTEGER,
	lesson_status: DataTypes.STRING,
	score_raw: DataTypes.STRING,
	total_time: DataTypes.STRING,
	suspend_data: DataTypes.TEXT,	
	completion_time: DataTypes.STRING,
	completion_status: DataTypes.STRING,
	success_status: DataTypes.STRING,
	exit_mode: DataTypes.STRING,
	min_score: DataTypes.STRING,
	max_score: DataTypes.STRING,
	scaled_score: DataTypes.STRING,
	lesson_location: DataTypes.STRING,
	initialLaunchDate: DataTypes.TEXT,
	recentLaunchDate: DataTypes.TEXT

	});

	Model.associate = function (models) {
		// this.SessionUser = this.belongsTo(models.SessionUser);
		this.Workbook = this.belongsTo(models.Workbook);
	};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};