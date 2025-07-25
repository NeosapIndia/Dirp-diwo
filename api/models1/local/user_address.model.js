module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User_address_master', {
        fullName: DataTypes.STRING,
        phone: DataTypes.STRING,
        addressLine1: DataTypes.STRING,
        addressLine2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        pinCode: DataTypes.STRING,
        // isDefault : DataTypes.BOOLEAN,      
        // isBilling : DataTypes.BOOLEAN, 
        CountryId: DataTypes.INTEGER,
        isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        UserId: DataTypes.INTEGER
    });

    Model.associate = function (models) {
        // this.UserId = this.belongsTo(models.User_master);
    };

    Model.prototype.convertToJSON = function () {
        let json = this.toJSON();
        return json;
    };
    return Model;
};