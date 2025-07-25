module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('DiwoLicense', {
        title: DataTypes.TEXT,
        description: DataTypes.TEXT,
        ClientId: DataTypes.INTEGER,
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        status: DataTypes.STRING,
        isSuspended: DataTypes.BOOLEAN,
        diwoVolume: DataTypes.STRING,
        //Learner Count
        learnerCount: DataTypes.INTEGER,
        unlimitedLearner: DataTypes.BOOLEAN,
        liveLearnerCount: DataTypes.INTEGER,

        //Workbook Count
        workbookCount: DataTypes.INTEGER,
        unlimitedWorkbook: DataTypes.BOOLEAN,
        liveWorkbookCount: DataTypes.FLOAT,

        //Data Storage Count
        serverStorageCount: DataTypes.INTEGER,
        UnlimitedServerStor: DataTypes.BOOLEAN,
        liveServerStorage: DataTypes.INTEGER,

        //Data Transfer Count
        DataTransferCount: DataTypes.INTEGER,
        unlimitedDataTransfer: DataTypes.BOOLEAN,
        liveDataTransfer: DataTypes.INTEGER,

    });
    Model.associate = function (models) {
        this.Client = this.belongsTo(models.Client);
    };
    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};