const schedule = require('node-schedule');
const fs = require('fs');
const env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
let dirPath = CONFIG.imagePath + '/uploads';
const { Activity_image, Package, Offer, Child, Blog, User } = require('../models1/connectionPool')['global'];
const { to } = require('../services/util.service');
const Sequelize = require('sequelize');

const fileCleaner = async function (dirPath, logStream) {
	let dirs = fs.readdirSync(dirPath);
	let files;
	for (dir of dirs) {
		files = fs.readdirSync(dirPath + '/' + dir);
		switch (dir) {
			case 'activityImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						Activity_image.findAll({
							where: { path: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			case 'offerImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						Offer.findAll({
							where: { image_path: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			case 'blogImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						Blog.findAll({
							where: { image_path: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			case 'childImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						Child.findAll({
							where: { imagePath: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			case 'packageImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						Package.findAll({
							where: { image_path: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			case 'userImage':
				for (file of files) {
					let path = 'uploads/' + dir + '/' + file;
					[err, isUsed] = await to(
						User.findAll({
							where: { imagePath: path },
							attributes: ['id'],
						})
					);
					if (isUsed.length < 1) {
						removeFile(dirPath + '/' + dir + '/' + file, logStream);
					}
				}
				break;
			default:
				break;
		}
	}
};

const removeFile = (filename, logStream) => {
	fs.unlink(filename, (err) => {
		logStream.write('\n **Deleted file ' + filename);
		if (err) logStream.write('\n ***** ERROR ***** \n ** Could not delete file ' + err);
	});
};

let job = schedule.scheduleJob('00 23 * * *', function (fireDate) {
	const logTime = new Date(fireDate).toJSON();
	const logStream = fs.createWriteStream('./public/logs/file-Cleaner(' + logTime + ').txt');
	logStream.write('Running file cleaner ' + fireDate);
	fileCleaner(dirPath, logStream);
});
module.exports.job = job;
