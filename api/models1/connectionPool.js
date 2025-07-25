const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const basename = path.basename(__filename);
const env = process.env.API_APP || 'local';
const db = {};
const CONFIG = require('../config/config')[env];

let logging = CONFIG.db_logging == 'true' || CONFIG.db_logging == true ? console.log : false;
let benchmark = CONFIG.db_logging == 'true' || CONFIG.db_logging == true ? true : false;

const dBase = CONFIG.databases;
const databases = Object.keys(dBase);

databases.forEach((element) => {
	db[element] = new Sequelize(dBase[element].db_name, dBase[element].db_user, dBase[element].db_password, {
		host: dBase[element].db_host,
		dialect: dBase[element].db_dialect,
		port: dBase[element].db_port,
		operatorsAlelementases: false,
		// logging database queries
		logging: logging,
		benchmark: benchmark,
		pool: {
			// Maximum connections of the pool
			max: CONFIG.db_pool_max,
			// Minimum connections of the pool
			min: CONFIG.db_pool_min,
			// The maximum time, in ms, that a connection can be idle before being released.
			idle: CONFIG.db_pool_idle,
			// The maximum time, in ms, that pool will try to get connection before throwing error
			acquire: CONFIG.db_pool_acquire,
		},
	});

	let filePath = path.join(__dirname, './' + dBase[element].db_modelPath);
	fs.readdirSync(filePath)
		.filter((file) => {
			return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
		})
		.forEach((file) => {
			let dbInstance = db[element];
			let model = require(path.join(filePath, file))(dbInstance, Sequelize);
			db[element][model.name] = model;
		});
	Object.keys(db[element]).forEach((modelName) => {
		if (db[element][modelName].associate) {
			db[element][modelName].associate(db[element]);
		}
	});
	db[element].Op = Op;
	db[element].sequelize = db[element];
	db[element].Sequelize = Sequelize;
});

module.exports = db;
