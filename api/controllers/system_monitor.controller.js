const { Op, sequelize, User, Market, User_role_client_mapping, SystemHealthNotification } =
	require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
let imagePath = 'uploads/SessionPhotographs/';
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const targetBaseUrl = CONFIG.web_host + '/#/';
const Sequelize = require('sequelize');
const config_feature = require('../config/SiteConfig.json');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const schedule = require('node-schedule');
const si = require('systeminformation');

const { systemAlertEmail } = require('../services/mailer.service');

let trrigerSystemAlertTime;

const getSystemMonitorDetails = async function (req, res) {
	try {
		const systemData = await checkedSystemHealth();

		return ResponseSuccess(res, {
			data: systemData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getSystemMonitorDetails = getSystemMonitorDetails;

const checkedSystemHealth = async function () {
	try {
		const [cpu, mem, disk, temp, uptime, networkStats] = await Promise.all([
			si.currentLoad(),
			si.mem(),
			si.fsSize(),
			si.cpuTemperature(),
			si.time(),
			si.networkStats(),
			// si.osInfo(),
			// si.services('postgresql-x64-13'), // Add your service names here
		]);

		let totalSpace = 0;
		let usedSpace = 0;
		let freeSpace = 0;

		disk.forEach((disk) => {
			totalSpace += disk.size;
			usedSpace += disk.used;
			freeSpace += disk.size - disk.used;
		});

		const usedPercentage = (usedSpace / totalSpace) * 100;

		const systemData = {
			CPU_load: cpu.currentLoad.toFixed(2), //🔧 CPU Load (%)
			RAM_usage_in_percentage: ((mem.used / mem.total) * 100).toFixed(2), //'💾 RAM Usage (%)
			RAM_used: (mem.used / 1024 ** 3).toFixed(2), //  💾 RAM Usage GB
			RAM_total_size: (mem.total / 1024 ** 3).toFixed(2), //💾 Total RAM GB
			Disk_usage_in_percentage: usedPercentage, //📀 Disk Usage (%)
			Disk_used: (usedSpace / 1024 ** 3).toFixed(2), //📀 Disk Use GB
			Disk_total_size: (totalSpace / 1024 ** 3).toFixed(2), // //📀 Totle Disk size in GB
			CPU_temp: temp.main || 'Not available', //🌡️ CPU Temp (°C)
			System_uptime: uptime.uptime, //⏱️ System Uptime (sec)
			Network_received_per_sec: (networkStats[0].rx_sec / 1024 / 1024).toFixed(2), // 📡 Network Received (MB)
			Network_Sent_per_sec: (networkStats[0].tx_sec / 1024 / 1024).toFixed(2), // 📡 Network Sent (MB)
			// services: services,
			// OsInformation: OsInformation,

			diskInfo: disk.map((d) => ({
				fs: d.fs,
				mount: d.mount,
				type: d.type,
				readWrite: d.rw,
				total_GB: (d.size / 1024 ** 3).toFixed(2),
				used_GB: (d.used / 1024 ** 3).toFixed(2),
				free_GB: (d.available / 1024 ** 3).toFixed(2),
				used_percentage: ((d.used / d.size) * 100).toFixed(2),
			})),
		};
		return systemData;
	} catch (error) {
		return null;
	}
};

function isValidDate(date) {
	const d = new Date(date);
	return d instanceof Date && !isNaN(d.getTime());
}

let checkSystemHealth = schedule.scheduleJob('*/30 * * * *', async function () {
	try {
		let flag = true;
		if (!trrigerSystemAlertTime) {
		} else if (isValidDate(trrigerSystemAlertTime)) {
			let currrentDateAndTime = moment();
			let lastTrrigerTime = moment(new Date(trrigerSystemAlertTime));
			if (currrentDateAndTime.diff(lastTrrigerTime, 'hours', true) < 1) {
				flag = false;
			}
		}
		if (flag) {
			await checkSystemHealth_();
		}
	} catch (error) {
		console.log('-----------Error-----', error);
	}
});

const checkSystemHealth_ = async function () {
	try {
		const systemHealth = await checkedSystemHealth();

		console.log('--------systemHealth------', systemHealth);

		let CPUDetails = { Color: 'Green', value: '0%', requiredTrriger: false };
		let DiskDetails = { Color: 'Green', value: '0%', requiredTrriger: false };
		let MemoryDetails = { Color: 'Green', value: '0%', requiredTrriger: false };
		let systemHealthNotificationdetails;
		[err, systemHealthNotificationdetails] = await to(
			SystemHealthNotification.findOne({
				where: {
					id: 1,
				},
				attributes: ['CPUNotification', 'DiskNotification', 'MemoryNotification'],
			})
		);
		if (err) {
			console.log('------ERROR---', err);
		}
		// 85% ==>> Red
		// 70% ==>> Amber
		// <70% ==>> Green

		if (systemHealth) {
			// for CPU
			if (systemHealth?.CPU_load && parseFloat(systemHealth.CPU_load) && !isNaN(parseFloat(systemHealth.CPU_load))) {
				const CPU_load = parseFloat(systemHealth.CPU_load);
				CPUDetails.value = CPU_load + '%';
				if (CPU_load > 85) {
					CPUDetails.Color = 'Red';
					CPUDetails.requiredTrriger = true;
				} else if (CPU_load > 70) {
					CPUDetails.Color = 'Amber';
					CPUDetails.requiredTrriger = true;
				}
			}

			// For Disk
			if (
				systemHealth?.Disk_usage_in_percentage &&
				parseFloat(systemHealth.Disk_usage_in_percentage) &&
				!isNaN(parseFloat(systemHealth.Disk_usage_in_percentage))
			) {
				const Disk_usage = parseFloat(systemHealth.Disk_usage_in_percentage);
				DiskDetails.value = Disk_usage + '%';
				if (Disk_usage > 85) {
					DiskDetails.Color = 'Red';
					DiskDetails.requiredTrriger = true;
				} else if (Disk_usage > 70) {
					DiskDetails.Color = 'Amber';
					DiskDetails.requiredTrriger = true;
				}
			}

			//For Memory

			if (
				systemHealth?.RAM_usage_in_percentage &&
				parseFloat(systemHealth.RAM_usage_in_percentage) &&
				!isNaN(parseFloat(systemHealth.RAM_usage_in_percentage))
			) {
				const RAM_usage = parseFloat(systemHealth.RAM_usage_in_percentage);
				MemoryDetails.value = RAM_usage + '%';
				if (RAM_usage > 85) {
					MemoryDetails.Color = 'Red';
					MemoryDetails.requiredTrriger = true;
				} else if (RAM_usage > 70) {
					MemoryDetails.Color = 'Amber';
					MemoryDetails.requiredTrriger = true;
				}
			}

			if (CPUDetails.requiredTrriger || DiskDetails.requiredTrriger || MemoryDetails.requiredTrriger) {
				trrigerSystemAlertTime = new Date(moment().add(-5, 'minutes'));

				let Metrics_message = [];

				if (CPUDetails.requiredTrriger && systemHealthNotificationdetails?.CPUNotification) {
					Metrics_message.push(`\u2022 CPU Usage: ${CPUDetails.value} `);
				}

				if (DiskDetails.requiredTrriger && systemHealthNotificationdetails?.DiskNotification) {
					Metrics_message.push(`\u2022 Disk Usage: ${DiskDetails.value} `);
				}

				if (MemoryDetails.requiredTrriger && systemHealthNotificationdetails?.MemoryNotification) {
					Metrics_message.push(`\u2022 Memory Usage: ${MemoryDetails.value} `);
				}

				if (Metrics_message.length == 0) {
					return;
				}

				Metrics_message = Metrics_message.toString().replaceAll(',', '    ');

				// Required Trriger Email;
				// Find All Production Ower Adin USer

				[err, allProductionOwnerUser] = await to(
					User_role_client_mapping.findAll({
						where: {
							RoleId: [2, 3],
						},
						include: [
							{
								model: User,
								where: {
									type: 'Admin',
									status: true,
									is_deleted: false,
									cStatus: 'Active',
								},
								attributes: ['id', 'local_user_id', 'MarketId', 'type', 'status', 'is_deleted', 'cStatus'],
								include: [{ model: Market, attributes: ['id', 'db_name'] }],
							},
						],
					})
				);
				if (err) {
					console.log('-------error Get All Product Owner Admin User---', err);
				}

				if (allProductionOwnerUser?.length > 0) {
					//Get All Users Email Id by using Market DB_name
					let allUsersEmailIds = [];
					let emailData = [];
					for (let adminUser of allProductionOwnerUser) {
						if (adminUser?.User?.Market?.db_name) {
							[err, localUser] = await to(
								dbInstance[adminUser.User.Market.db_name].User_master.findOne({
									where: {
										id: adminUser.User.local_user_id,
									},
									attributes: ['first', 'email', 'last', 'phone'],
								})
							);
							if (err) {
								console.log('---------------Error--------------------', err);
							}

							if (localUser?.email) {
								if (allUsersEmailIds.indexOf(localUser.email) == -1) {
									allUsersEmailIds.push(localUser.email);
								}
							}
						}
					}

					if (allUsersEmailIds?.length > 0) {
						// console.log('-----allUsersEmailIds------', allUsersEmailIds);
						for (let userEmail of allUsersEmailIds) {
							let personalisations = {};
							personalisations.dynamic_template_data = {
								date_time: moment.utc().add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY HH:mm:ss'), // convert UTC to IST
								metrics_usage: Metrics_message,
							};
							personalisations.to = userEmail;
							emailData.push(personalisations);
						}
						if (env !== 'local') {
							systemAlertEmail(emailData);
						}
					}
				}
			}
		}
	} catch (error) {
		console.log('------Check System Health Schedular error-----', error);
	}
};

const updateNotificationFlag = async function (req, res) {
	try {
		const Schema = Joi.object({
			CPUNotification: Joi.boolean().required(),
			DiskNotification: Joi.boolean().required(),
			MemoryNotification: Joi.boolean().required(),
		});

		const { error, value } = Schema.validate(req.body);
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		[err, updateFlag] = await to(
			SystemHealthNotification.update(value, {
				where: {
					id: 1,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			messgae: 'Update Successfully',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateNotificationFlag = updateNotificationFlag;

const getNotificationFlag = async function (req, res) {
	try {
		[err, details] = await to(
			SystemHealthNotification.findOne({
				where: {
					id: 1,
				},
				attributes: ['CPUNotification', 'DiskNotification', 'MemoryNotification'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: details,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getNotificationFlag = getNotificationFlag;
