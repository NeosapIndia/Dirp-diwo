module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'License',
		{
			title: DataTypes.TEXT,
			description: DataTypes.TEXT,
			ClientId: DataTypes.INTEGER,
			startDate: DataTypes.DATE,
			endDate: DataTypes.DATE,
			learnerCount: DataTypes.INTEGER,
			unlLearner: DataTypes.BOOLEAN,
			whatsAppCount: DataTypes.INTEGER,
			whatsAppUnl: DataTypes.BOOLEAN,
			sharWhatsAppCount: DataTypes.INTEGER,
			sharWhatsAppUnl: DataTypes.BOOLEAN,
			emailCount: DataTypes.INTEGER,
			emailUnl: DataTypes.BOOLEAN,
			dripappCount: DataTypes.INTEGER,
			dripappUnl: DataTypes.BOOLEAN,
			status: DataTypes.STRING,
			isSuspended: DataTypes.BOOLEAN,
			useLearnerCount: DataTypes.INTEGER,
			useWhatsAppCount: DataTypes.INTEGER,
			useSharWhatsAppCount: DataTypes.INTEGER,
			useEmailCount: DataTypes.INTEGER,
			useDripappCount: DataTypes.INTEGER,
			dripVolume: DataTypes.STRING,
			serverStrgCount: DataTypes.INTEGER,
			serverStorageUnl: DataTypes.BOOLEAN,
			dataTransferCount: DataTypes.INTEGER,
			dataTransferUnl: DataTypes.BOOLEAN,

			onlyTeamCount: DataTypes.INTEGER, //Default 0
			dripWithTeamCount: DataTypes.INTEGER, //Default 0

			onlyTeamUnl: DataTypes.BOOLEAN, //Default false
			dripWithTeamUnl: DataTypes.BOOLEAN, //Default false

			useOnlyTeamCount: DataTypes.INTEGER, //Default 0
			useDripWithTeamCount: DataTypes.INTEGER, //Default 0

			//Only Email
			onlyEmailCount: DataTypes.INTEGER, //Default 0
			onlyEmailUnl: DataTypes.BOOLEAN, //Default false
			useOnlyEmailCount: DataTypes.INTEGER, //Default 0
		},
		{
			indexes: [
				{
					name: 'License_index_1',
					fields: ['endDate', 'status'],
				},
				{
					name: 'License_index_2',
					fields: ['ClientId'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.Client = this.belongsTo(models.Client);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
