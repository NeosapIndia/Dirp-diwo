module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Upload_learner',
		{
			first: DataTypes.STRING,
			last: DataTypes.STRING,
			email: DataTypes.STRING,
			phone: DataTypes.STRING,
			country: DataTypes.STRING,
			state: DataTypes.STRING,
			city: DataTypes.STRING,
			zipCode: DataTypes.STRING,
			Client_Id: DataTypes.STRING,
			jobrole: DataTypes.STRING,
			MarketId: DataTypes.INTEGER,
			CountryId: DataTypes.INTEGER,
			status: DataTypes.BOOLEAN,
			is_verified: DataTypes.BOOLEAN,
			is_deleted: DataTypes.BOOLEAN,
			type: DataTypes.STRING,
			isEmail_invalid: DataTypes.BOOLEAN,
			isPhone_invalid: DataTypes.BOOLEAN,
			RoleId: DataTypes.INTEGER,
			UserId: DataTypes.INTEGER,
			ClientId: DataTypes.INTEGER,
			isEmail_exits: DataTypes.BOOLEAN,
			isPhone_exits: DataTypes.BOOLEAN,
			db_name: DataTypes.STRING,
			isCreated: DataTypes.BOOLEAN,
			errorMsg: DataTypes.TEXT,
			isError: DataTypes.BOOLEAN,
			jobRoleErr: DataTypes.STRING,
			haveWhatsAppOptIn: DataTypes.BOOLEAN,
			triggerOptInMsg: DataTypes.BOOLEAN,
			haveEmailPer: DataTypes.BOOLEAN,
			PhoneError: DataTypes.TEXT,
			emailError: DataTypes.TEXT,
			tags: DataTypes.TEXT,
			forDrip: DataTypes.BOOLEAN,
			forDiwo: DataTypes.BOOLEAN,
			srNo: DataTypes.STRING,
			customFields: DataTypes.JSON,
			username: DataTypes.STRING,
			isUseraname_exits: DataTypes.BOOLEAN,
			UsernameError: DataTypes.TEXT,
		},
		{
			indexes: [
				{
					name: 'Upload_learners_index_1',
					fields: [
						'isEmail_invalid',
						'isPhone_invalid',
						'isEmail_exits',
						'isPhone_exits',
						'RoleId',
						'UserId',
						'ClientId',
						'isCreated',
						'isError',
					],
				},
				{
					name: 'Upload_learners_index_2',
					fields: ['phone', 'isCreated'],
				},
				{
					name: 'Upload_learners_index_3',
					fields: ['RoleId', 'UserId', 'ClientId', 'isEmail_invalid', 'isPhone_invalid', 'isCreated', 'isError'],
				},
			],
		}
	);
	Model.associate = function (models) {
		this.Market = this.belongsTo(models.Market);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
