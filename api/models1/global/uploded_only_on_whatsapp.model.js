module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('UplodedOnlyOnWhatsapp', {
        dripType: DataTypes.STRING,
        dripName: DataTypes.TEXT,
        description: DataTypes.TEXT,
        language: DataTypes.STRING,
        loginRequired: DataTypes.BOOLEAN,
        whatsappTemplateCategory: DataTypes.STRING,
        headerType: DataTypes.STRING,
        headerText : DataTypes.STRING,
        body: DataTypes.TEXT,
        footer: DataTypes.STRING,
        interaction: DataTypes.STRING,
        callToAction: DataTypes.STRING,
        cta_link: DataTypes.TEXT,
        quickReply1: DataTypes.STRING,
        quickReply2: DataTypes.STRING,
        quickReply3: DataTypes.STRING,
        errorMsg: DataTypes.STRING,
        isError: DataTypes.BOOLEAN,
        isCreated: DataTypes.BOOLEAN,
        RoleId: DataTypes.INTEGER,
        UserId: DataTypes.INTEGER,
        ClientId: DataTypes.INTEGER,
        account_id: DataTypes.STRING,
        WhatsAppSetupId: DataTypes.INTEGER,
        srNo: DataTypes.INTEGER

    });

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};