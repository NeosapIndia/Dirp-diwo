module.exports = (sequelize, DataTypes) => {
	var Model = sequelize.define('LoginAppBranding', {
		// Drip Fields
		dripWeb_Login_LogoPath: DataTypes.TEXT,
		dripWeb_Login_LogoFileName: DataTypes.STRING,
		dripWeb_LogoPath: DataTypes.TEXT,
		dripWeb_LogoFileName: DataTypes.STRING,
		dripWeb_About_LogoPath: DataTypes.TEXT,
		dripWeb_About_LogoFileName: DataTypes.STRING,
		dripWeb_About_Text: DataTypes.TEXT,
		drip_accent_color: DataTypes.STRING,
		dripPWA_LoginImagePath: DataTypes.TEXT,
		dripPWA_LoginImageFileName: DataTypes.STRING,
		dripPWA_LoginLogoPath: DataTypes.TEXT,
		dripPWA_LoginLogoFileName: DataTypes.STRING,
		dripPwa_LogoPath: DataTypes.TEXT,
		dripPwa_LogoFileName: DataTypes.STRING,
		dripPWA_Login_Text: DataTypes.TEXT,

		// Diwo Fields
		diwoWeb_Login_LogoPath: DataTypes.TEXT,
		diwoWeb_Login_LogoFileName: DataTypes.STRING,
		diwo_certificate_LogoPath: DataTypes.TEXT,
		diwo_certificate_LogoFileName: DataTypes.STRING,
		diwoWeb_LogoPath: DataTypes.TEXT,
		diwoWeb_LogoFileName: DataTypes.STRING,
		diwoWeb_About_LogoPath: DataTypes.TEXT,
		diwoWeb_About_LogoFileName: DataTypes.STRING,
		diwoWeb_About_Text: DataTypes.TEXT,
		diwoPWA_LoginImagePath: DataTypes.TEXT,
		diwo_accent_color: DataTypes.STRING,
		diwoPWA_LoginImageFileName: DataTypes.STRING,
		diwoPWA_LoginLogoPath: DataTypes.TEXT,
		diwoPWA_LoginLogoFileName: DataTypes.STRING,
		diwoPwa_LogoPath: DataTypes.TEXT,
		diwoPwa_LogoFileName: DataTypes.STRING,
		diwoPWA_Login_Text: DataTypes.TEXT,
	});

	Model.associate = function (models) {};

	Model.prototype.convertToJSON = function () {
		let json = this.toJSON();
		return json;
	};
	return Model;
};
