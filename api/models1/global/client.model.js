module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define(
		'Client',
		{
			name: DataTypes.STRING,
			details: DataTypes.TEXT,
			is_deleted: DataTypes.BOOLEAN,
			Associate_client_id: DataTypes.INTEGER,
			share_flag: DataTypes.BOOLEAN,
			client_id: DataTypes.STRING,
			avatar: DataTypes.STRING,
			avatar_file_name: DataTypes.STRING,
			avatar_path: DataTypes.TEXT,
			category: DataTypes.STRING,
			folderId: DataTypes.STRING,
			drip_share_flag: DataTypes.BOOLEAN,
			status: DataTypes.STRING,
			DiwoFolderId: DataTypes.STRING,
			DripAccess: DataTypes.BOOLEAN,
			DiwoAccess: DataTypes.BOOLEAN,
			workbookshareflag: DataTypes.BOOLEAN,
			openAISecretKey: DataTypes.TEXT,
			assistantId: DataTypes.TEXT,
			customFields: DataTypes.JSONB,
			defaultGroupForDrip: DataTypes.BOOLEAN,
			defaultGroupForDiwo: DataTypes.BOOLEAN,
			enableChatBot: DataTypes.BOOLEAN,
			useSendGrid: DataTypes.BOOLEAN, // Default True Value

			documentCustomFields: DataTypes.JSONB,
			pipelineType: DataTypes.STRING,
			pipelineOption: DataTypes.STRING,
			AIApiKey: DataTypes.TEXT,
			chunkSize: DataTypes.INTEGER,
			chunkOverlap: DataTypes.INTEGER,
			EmbeddingProvider: DataTypes.STRING,
			EmbeddingModel: DataTypes.STRING,
			LlamaParams: DataTypes.JSONB,

			videoComplition: DataTypes.BOOLEAN,
			percentage: DataTypes.INTEGER,

			isQuizCompletion: DataTypes.BOOLEAN,
			quizPercentage: DataTypes.INTEGER,
			maxReAttemptsAllowed: DataTypes.INTEGER,
		},
		{
			indexes: [{ name: 'Clients_index_1', fields: ['client_id'] }],
		}
	);
	Model.associate = function (models) {
		this.Alert_popup = this.hasMany(models.Alert_popup);
		this.Client_job_role = this.hasMany(models.Client_job_role);
		// this.User = this.hasMany(models.User);
		this.Custom_email = this.hasMany(models.Custom_email);
		this.Promotional_banner = this.hasMany(models.Promotional_banner);
		this.sign_in_message = this.hasMany(models.sign_in_message);
		this.Asset = this.hasMany(models.Asset);
		this.Campaign = this.hasMany(models.Campaign);
		this.User_group = this.hasMany(models.User_group);
		this.Post = this.hasMany(models.Post);
		this.CustomerPolicyLog = this.hasMany(models.CustomerPolicyLog);
		this.PolicyChangeLog = this.hasMany(models.PolicyChangeLog);
		this.Outbound_message = this.hasMany(models.Outbound_message);
		this.System_branding = this.belongsTo(models.System_branding);
		this.ClientCustomReport = this.hasMany(models.ClientCustomReport);
		this.Client_Package = this.belongsTo(models.Client_Package);
		this.User = this.belongsToMany(models.User, { through: 'User_role_client_mapping' });
		this.Role = this.belongsToMany(models.Role, { through: 'User_role_client_mapping' });
		// this.User = this.belongsToMany(models.User, { through: 'User_client_mappings' });
		this.Country = this.belongsToMany(models.Country, { through: 'Client_country_mapping' });
		// Drip Other Type
		this.DripOption = this.hasMany(models.DripOption);
		this.DripQuestion = this.hasMany(models.DripQuestion);
		this.License = this.hasMany(models.License);
		this.CampTakeAction = this.hasMany(models.CampTakeAction);
		this.VimeoCredential = this.belongsTo(models.VimeoCredential);
		this.Customer_ticket = this.hasMany(models.Customer_ticket);

		//Workbook
		this.Option = this.hasMany(models.Option);
		this.Worksheet = this.hasMany(models.Worksheet);
		this.Workbook = this.hasMany(models.Workbook);
		this.DiwoAsset = this.hasMany(models.DiwoAsset);
		this.Question = this.hasMany(models.Question);
		this.Course = this.hasMany(models.Course);
		this.SessionUser = this.hasMany(models.SessionUser);
		this.SessionWorksheet = this.hasMany(models.SessionWorksheet);
		this.SessionQuestion = this.hasMany(models.SessionQuestion);
		this.SessionOption = this.hasMany(models.SessionOption);
		this.SessionAsset = this.hasMany(models.SessionAsset);
		this.WorkbookTrainerMapping = this.hasMany(models.WorkbookTrainerMapping);
		this.DiwoSystemBranding = this.belongsTo(models.DiwoSystemBranding);
		this.DiwoLicense = this.hasMany(models.DiwoLicense);
		this.DiwoVimeoCredential = this.belongsTo(models.DiwoVimeoCredential);

		//For WhatsApp Steup
		this.ClientWhatsAppSetup = this.hasMany(models.ClientWhatsAppSetup);

		this.Bot_message = this.hasMany(models.Bot_message);
		this.BotFunctionDetail = this.hasMany(models.BotFunctionDetail);

		this.User_log = this.hasMany(models.User_log);

		//Zoom App Details
		this.ZoomAppDetail = this.hasMany(models.ZoomAppDetail);
		this.ZoomUserToken = this.hasMany(models.ZoomUserToken);

		this.TeamSetup = this.hasMany(models.TeamSetup);

		this.TeamChatDetail = this.hasMany(models.TeamChatDetail);

		this.ClientTeamSetup = this.hasMany(models.ClientTeamSetup);

		this.CustomTemplate = this.hasMany(models.CustomTemplate);
		this.Pathway = this.hasMany(models.Pathway);
		this.ClientAgentMapping = this.hasMany(models.ClientAgentMapping);

		this.DiwoAssignment = this.hasMany(models.DiwoAssignment);

		this.Document = this.hasMany(models.Document);
		this.LearnerAssignment = this.hasMany(models.LearnerAssignment);
		this.LearnerAchievement = this.hasMany(models.LearnerAchievement);
	};
	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
