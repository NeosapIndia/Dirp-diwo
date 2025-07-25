const {
	Client,
	License,
	DiwoLicense,
	Op,
	Campaign,
	sequelize,
	CampWhatsAppEmailDrip,
	User_role_client_mapping,
	User,
	Market,
	User_master,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const moment = require('moment');
const { to, ResponseError } = require('../services/util.service');
const schedule = require('node-schedule');
const { getAllSubClientAndBranchAccountLists } = require('./client.service');
const { sendDripWhatsAppLicenseEmail, sendDripEmailLicenseEmail } = require('./mailer.service');
const Sequelize = require('sequelize');

let License_status_schedulor = schedule.scheduleJob('5 0 * * *', async function (fireDate) {
	console.log('Run Scheduler --->>>-->>> License Status', fireDate);
	checkLicenseStatusForDrip();
	checkLicenseStatusForDiwo();
});
module.exports.License_status_schedulor = License_status_schedulor;

const checkLicenseStatusForDrip = async function () {
	const today = moment(new Date());
	[err, license_details] = await to(
		License.findAll({
			where: {
				endDate: {
					[Op.lt]: today,
				},
				status: {
					[Op.eq]: 'Active',
				},
			},
			attributes: ['ClientId'],
		})
	);
	if (err) {
		console.log('-----Updated License Status---', err);
	}

	let license_Id = [];
	if (license_details && license_details.length > 0) {
		for (let license of license_details) {
			license_Id.push(license.ClientId);
		}
	}

	[err, useLearnerCount] = await to(
		License.update(
			{
				status: 'Expired',
			},
			{
				where: {
					ClientId: license_Id,
				},
			}
		)
	);

	if (err) return ResponseError(res, err, 500, true);
};

const checkLicenseStatusForDiwo = async function () {
	const today = moment(new Date());
	[err, license_details] = await to(
		DiwoLicense.findAll({
			where: {
				endDate: {
					[Op.lt]: today,
				},
				status: {
					[Op.eq]: 'Active',
				},
			},
			attributes: ['ClientId'],
		})
	);
	if (err) {
		console.log('-----Updated License Status---', err);
	}

	let license_Id = [];
	if (license_details && license_details.length > 0) {
		for (let license of license_details) {
			license_Id.push(license.ClientId);
		}
	}

	[err, useLearnerCount] = await to(
		DiwoLicense.update(
			{
				status: 'Expired',
			},
			{
				where: {
					ClientId: license_Id,
				},
			}
		)
	);
	if (err) {
		console.log('---------Error-----checkLicenseStatusForDiwo-------', err);
	}
};
const getLearnerValidaionByClientId = async function (clientId) {
	const clientIds = clientId;
	let Licenses_;
	let parentClientId;
	let flag = true;

	[err, client] = await to(
		Client.findOne({
			where: {
				id: clientIds,
			},
			include: [
				{
					model: License,
					required: false,
				},
			],
			attributes: ['Associate_client_id'],
		})
	);

	if (client && client.Licenses.length > 0) {
		Licenses_ = client.Licenses[0].convertToJSON();
	} else {
		if (client && client.Associate_client_id) {
			parentClientId = client.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
						include: [
							{
								model: License,
							},
						],
						attributes: ['Associate_client_id'],
					})
				);
				if (parentClient && parentClient.Licenses.length > 0) {
					Licenses_ = parentClient.Licenses[0].convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
	}
	if (Licenses_) {
		return Licenses_;
	} else {
		return false;
	}
};
module.exports.getLearnerValidaionByClientId = getLearnerValidaionByClientId;

const getLearnerValidaionByClientIdForDiwo = async function (clientId) {
	const clientIds = clientId;
	let DiwoLicenses_;
	let parentClientId;
	let flag = true;

	[err, client] = await to(
		Client.findOne({
			where: {
				id: clientIds,
			},
			include: [
				{
					model: DiwoLicense,
					required: false,
				},
			],
			attributes: ['Associate_client_id'],
		})
	);

	if (client && client.DiwoLicenses.length > 0) {
		DiwoLicenses_ = client.DiwoLicenses[0].convertToJSON();
	} else {
		if (client && client.Associate_client_id) {
			parentClientId = client.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
						include: [
							{
								model: DiwoLicense,
							},
						],
						attributes: ['Associate_client_id'],
					})
				);
				if (parentClient && parentClient.DiwoLicenses.length > 0) {
					DiwoLicenses_ = parentClient.DiwoLicenses[0].convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
	}
	if (DiwoLicenses_) {
		return DiwoLicenses_;
	} else {
		return false;
	}
};
module.exports.getLearnerValidaionByClientIdForDiwo = getLearnerValidaionByClientIdForDiwo;

const getLearnerValidaionOnCreateLearner = async function (clientId) {
	let learnerCount = 0;
	let useLearnerCount = 0;
	let Licenses_;
	let status;
	Licenses_ = await getLearnerValidaionByClientId(clientId);

	if (Licenses_) {
		status = Licenses_.status;
		if (status == 'Active') {
			if (Licenses_.unlLearner == false || Licenses_.unlLearner == null) {
				learnerCount = Licenses_.learnerCount;
				useLearnerCount = Licenses_.useLearnerCount;
				if (learnerCount > useLearnerCount) {
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		} else {
			return false;
		}
	} else {
		return false;
	}
};
module.exports.getLearnerValidaionOnCreateLearner = getLearnerValidaionOnCreateLearner;

const getLearnerValidaionOnCreateLearnerForDiwo = async function (clientId) {
	let learnerCount = 0;
	let liveLearnerCount = 0;
	let Licenses_;
	let status;
	Licenses_ = await getLearnerValidaionByClientIdForDiwo(clientId);

	if (Licenses_) {
		status = Licenses_.status;
		if (status == 'Active') {
			if (Licenses_.unlimitedLearner == false || Licenses_.unlimitedLearner == null) {
				learnerCount = Licenses_.learnerCount;
				liveLearnerCount = Licenses_.liveLearnerCount;
				if (learnerCount > liveLearnerCount) {
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		} else {
			return false;
		}
	} else {
		return false;
	}
};
module.exports.getLearnerValidaionOnCreateLearnerForDiwo = getLearnerValidaionOnCreateLearnerForDiwo;

const getLearnerValidaionCount = async function (clientId, type) {
	try {
		let Licenses_;
		let status;
		let payload = {
			flag: false,
			count: 0,
		};
		Licenses_ = await getLearnerValidaionByClientId(clientId);
		if (Licenses_) {
			status = Licenses_.status;
			if (status == 'Active') {
				if (Licenses_.unlLearner == false || Licenses_.unlLearner == null) {
					learnerCount = Licenses_.learnerCount;
					useLearnerCount = Licenses_.useLearnerCount;
					if (learnerCount > useLearnerCount) {
						payload.count = learnerCount - useLearnerCount;
						return payload;
					} else {
						return payload;
					}
				} else {
					payload.flag = true;
					return payload;
				}
			} else {
				return payload;
			}
		} else {
			return payload;
		}
	} catch (error) {
		console.log('--Error get Validation For Send Drip-', error);
		return false;
	}
};
module.exports.getLearnerValidaionCount = getLearnerValidaionCount;

const getLearnerValidaionCountForDiwo = async function (clientId) {
	let learnerCount = 0;
	let liveLearnerCount = 0;
	let Licenses_;
	let status;
	let payload = {
		flag: false,
		count: 0,
	};
	Licenses_ = await getLearnerValidaionByClientIdForDiwo(clientId);

	if (Licenses_) {
		status = Licenses_.status;
		if (status == 'Active') {
			if (Licenses_.unlimitedLearner == false || Licenses_.unlimitedLearner == null) {
				learnerCount = Licenses_.learnerCount;
				liveLearnerCount = Licenses_.liveLearnerCount;
				if (learnerCount > liveLearnerCount) {
					payload.count = learnerCount - liveLearnerCount;
					return payload;
				} else {
					return payload;
				}
			} else {
				payload.flag = true;
				return payload;
			}
		} else {
			return payload;
		}
	} else {
		return payload;
	}
};
module.exports.getLearnerValidaionCountForDiwo = getLearnerValidaionCountForDiwo;

const getValidationForSendDrip = async function (clientId, type) {
	try {
		let Licenses_;
		let status;
		Licenses_ = await getLearnerValidaionByClientId(clientId);
		let flag = false;
		if (Licenses_) {
			status = Licenses_.status;
			if (status == 'Active' && type == 'Only WhatsApp') {
				if (Licenses_.whatsAppUnl == true) {
					flag = true;
				} else {
					if (Licenses_.whatsAppCount > Licenses_.useWhatsAppCount) {
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'DripApp with sharing on WhatsApp') {
				if (Licenses_.sharWhatsAppUnl == true) {
					flag = true;
				} else {
					if (Licenses_.sharWhatsAppCount > Licenses_.useSharWhatsAppCount) {
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'Only Email') {
				if (Licenses_.onlyEmailUnl == true) {
					flag = true;
				} else {
					if (Licenses_.onlyEmailCount > Licenses_.useOnlyEmailCount) {
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'DripApp with sharing on Email') {
				if (Licenses_.emailUnl == true) {
					flag = true;
				} else {
					if (Licenses_.emailCount > Licenses_.useEmailCount) {
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'Only DripApp') {
				if (Licenses_.dripappUnl == true) {
					flag = true;
				} else {
					if (Licenses_.dripappCount > Licenses_.useDripappCount) {
						flag = true;
					} else {
						flag = false;
					}
				}
			} else {
				flag = false;
			}
		} else {
			flag = false;
		}
		return flag;
	} catch (error) {
		console.log('--Error get Validation For Send Drip-', error);
	}
};
module.exports.getValidationForSendDrip = getValidationForSendDrip;

const getValidationForSendDripWithCount = async function (clientId, type) {
	try {
		let Licenses_;
		let status;
		Licenses_ = await getLearnerValidaionByClientId(clientId);
		let flag = false;
		let count = 0;
		let unlimited = false;
		if (Licenses_) {
			status = Licenses_.status;
			if (status == 'Active' && type == 'Only WhatsApp') {
				if (Licenses_.whatsAppUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.whatsAppCount > Licenses_.useWhatsAppCount) {
						count = Licenses_.whatsAppCount - Licenses_.useWhatsAppCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'DripApp with sharing on WhatsApp') {
				if (Licenses_.sharWhatsAppUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.sharWhatsAppCount > Licenses_.useSharWhatsAppCount) {
						count = Licenses_.sharWhatsAppCount - Licenses_.useSharWhatsAppCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'Only Email') {
				if (Licenses_.onlyEmailUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.onlyEmailCount > Licenses_.useOnlyEmailCount) {
						count = Licenses_.onlyEmailCount - Licenses_.useOnlyEmailCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'DripApp with sharing on Email') {
				if (Licenses_.emailUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.emailCount > Licenses_.useEmailCount) {
						count = Licenses_.emailCount - Licenses_.useEmailCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'Only DripApp') {
				if (Licenses_.dripappUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.dripappCount > Licenses_.useDripappCount) {
						count = Licenses_.dripappCount - Licenses_.useDripappCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'Only Teams') {
				// Need to Add New Column into License Table
				if (Licenses_.onlyTeamUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.onlyTeamCount > Licenses_.useOnlyTeamCount) {
						count = Licenses_.onlyTeamCount - Licenses_.useOnlyTeamCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else if (status == 'Active' && type == 'DripApp with sharing on Teams') {
				// Need to Add New Column into License Table
				if (Licenses_.dripWithTeamUnl == true) {
					flag = true;
					unlimited = true;
				} else {
					if (Licenses_.dripWithTeamCount > Licenses_.useDripWithTeamCount) {
						count = Licenses_.dripWithTeamCount - Licenses_.useDripWithTeamCount;
						flag = true;
					} else {
						flag = false;
					}
				}
			} else {
				flag = false;
			}
		} else {
			flag = false;
		}
		return {
			flag,
			count: count > 0 ? count : 0,
			unlimited,
		};
	} catch (error) {
		console.log('--Error get Validation For Send Drip-', error);
	}
};
module.exports.getValidationForSendDripWithCount = getValidationForSendDripWithCount;

const getValidationForAssignWorkbook = async function (clientId, type) {
	try {
		let Licenses_;
		let status;
		let payload = {
			flag: false,
			count: 0,
		};
		Licenses_ = await getLearnerValidaionByClientIdForDiwo(clientId);
		if (Licenses_) {
			status = Licenses_.status;
			if (status == 'Active') {
				if (Licenses_.unlimitedWorkbook == true) {
					payload.flag = true;
					payload.count = 5;
					return payload;
				} else {
					if (Licenses_.workbookCount > Licenses_.liveWorkbookCount) {
						payload.flag = true;
						payload.count = Licenses_.workbookCount - Licenses_.liveWorkbookCount;
						return payload;
					} else {
						return payload;
					}
				}
			} else {
				return payload;
			}
		} else {
			return payload;
		}
	} catch (error) {
		console.log('--Error get Validation For Send Drip-', error);
		return false;
	}
};
module.exports.getValidationForAssignWorkbook = getValidationForAssignWorkbook;

const updateDripCountInLicense = async function (clientId, type) {
	try {
		let Licenses = await getLearnerValidaionByClientId(clientId);
		if (Licenses) {
			if (type == 'Only WhatsApp') {
				if (Licenses.whatsAppCount > Licenses.useWhatsAppCount || Licenses.whatsAppUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useWhatsAppCount: Licenses.useWhatsAppCount + 1,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only WhatsApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only WhatsApp Client Id', clientId);
				}
			} else if (type == 'DripApp with sharing on WhatsApp') {
				if (Licenses.sharWhatsAppCount > Licenses.useSharWhatsAppCount || Licenses.sharWhatsAppUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useSharWhatsAppCount: Licenses.useSharWhatsAppCount + 1,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on WhatsApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on WhatsApp Client Id', clientId);
				}
			} else if (type == 'Only Email') {
				if (Licenses.onlyEmailCount > Licenses.useOnlyEmailCount || Licenses.onlyEmailUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useOnlyEmailCount: Licenses.useOnlyEmailCount + 1,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on Email Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on Email Client Id', clientId);
				}
			} else if (type == 'DripApp with sharing on Email') {
				if (Licenses.emailCount > Licenses.useEmailCount || Licenses.emailUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useEmailCount: Licenses.useEmailCount + 1,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on Email Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on Email Client Id', clientId);
				}
			} else if (type == 'Only DripApp') {
				if (Licenses.dripappCount > Licenses.useDripappCount || Licenses.dripappUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useDripappCount: Licenses.useDripappCount + 1,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only DripApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only DripApp Client Id', clientId);
				}
			}
		}
	} catch (error) {
		console.log('--Error update Drip Count In License----', error);
	}
};
module.exports.updateDripCountInLicense = updateDripCountInLicense;

const updateDripMultipleCountInLicense = async function (clientId, type, count) {
	try {
		let Licenses = await getLearnerValidaionByClientId(clientId);
		if (Licenses) {
			if (type == 'Only WhatsApp') {
				if (Licenses.whatsAppCount > Licenses.useWhatsAppCount || Licenses.whatsAppUnl) {
					let response = await licenseConsumeTriggerMail(Licenses, type, count);
					[err, updateCount] = await to(
						License.update(
							{
								useWhatsAppCount: Licenses.useWhatsAppCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only WhatsApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only WhatsApp Client Id', clientId);
				}
			} else if (type == 'DripApp with sharing on WhatsApp') {
				if (Licenses.sharWhatsAppCount > Licenses.useSharWhatsAppCount || Licenses.sharWhatsAppUnl) {
					let response = await licenseConsumeTriggerMail(Licenses, type, count);
					[err, updateCount] = await to(
						License.update(
							{
								useSharWhatsAppCount: Licenses.useSharWhatsAppCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on WhatsApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on WhatsApp Client Id', clientId);
				}
			} else if (type == 'Only Email') {
				if (Licenses.onlyEmailCount > Licenses.useOnlyEmailCount || Licenses.onlyEmailUnl) {
					let response = await licenseConsumeTriggerMail(Licenses, type, count);
					[err, updateCount] = await to(
						License.update(
							{
								useOnlyEmailCount: Licenses.useOnlyEmailCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on Email Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on Email Client Id', clientId);
				}
			} else if (type == 'DripApp with sharing on Email') {
				if (Licenses.emailCount > Licenses.useEmailCount || Licenses.emailUnl) {
					let response = await licenseConsumeTriggerMail(Licenses, type, count);
					[err, updateCount] = await to(
						License.update(
							{
								useEmailCount: Licenses.useEmailCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update DripApp with sharing on Email Count--', err);
					}
				} else {
					console.log('--Not Valid License for DripApp with sharing on Email Client Id', clientId);
				}
			} else if (type == 'Only DripApp') {
				if (Licenses.dripappCount > Licenses.useDripappCount || Licenses.dripappUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useDripappCount: Licenses.useDripappCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only DripApp Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only DripApp Client Id', clientId);
				}
			} else if (type === 'Only Teams') {
				//Need to Add Update Code here
				if (Licenses.onlyTeamCount > Licenses.useOnlyTeamCount || Licenses.onlyTeamUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useOnlyTeamCount: Licenses.useOnlyTeamCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only Teams Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only Teams Client Id', clientId);
				}
			} else if (type === 'DripApp with sharing on Teams') {
				//Need to Add Update Code here
				if (Licenses.dripWithTeamCount > Licenses.useDripWithTeamCount || Licenses.dripWithTeamUnl) {
					[err, updateCount] = await to(
						License.update(
							{
								useDripWithTeamCount: Licenses.useDripWithTeamCount + count,
							},
							{
								where: {
									id: Licenses.id,
								},
							}
						)
					);
					if (err) {
						console.log('--Error at update Only Teams Count--', err);
					}
				} else {
					console.log('--Not Valid License for Only Teams Client Id', clientId);
				}
			}
		}
	} catch (error) {
		console.log('--Error update Drip Count In License----', error);
	}
};
module.exports.updateDripMultipleCountInLicense = updateDripMultipleCountInLicense;

//For 80% 90% license count consume Trigger for drip
const licenseConsumeTriggerMail = async function (license, driptype, count) {
	let useCount = 0;
	let totalCount = 0;
	let finalUseCount;
	let emailData = [];

	[err, user_details] = await to(
		User_role_client_mapping.findAll({
			where: {
				ClientId: 1,
				RoleId: [2, 3],
				forDrip: true,
			},
			include: [
				{
					model: User,
					where: {
						status: true,
						is_deleted: false,
						forDrip: true,
					},
					attributes: ['local_user_id'],
					include: [
						{
							model: Market,
							attributes: ['db_name'],
						},
					],
				},
				{
					model: Client,
					where: {
						DripAccess: true,
					},
					attributes: ['name'],
				},
			],
		})
	);

	let allUserList = [];
	if (user_details && user_details && user_details.length > 0) {
		for (let userdetail of user_details) {
			let user = userdetail.convertToJSON();
			allUserList.push(user);
		}
	}

	let allEmailRecords = [];
	let uniqueEmailRecords = [];
	let emailSet = new Set();

	if (allUserList && allUserList.length > 0) {
		for (let allUser of allUserList) {
			let userDetail = allUser;
			[err, localUser] = await to(
				dbInstance[allUser.User.Market.db_name].User_master.findOne({
					where: {
						id: allUser.User.local_user_id,
					},
					attributes: ['first', 'email'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			if (localUser) {
				userDetail.User.first = localUser.first;
				userDetail.User.email = localUser.email;
			}
			allEmailRecords.push(userDetail);
		}

		//Remove duplicate Email
		allEmailRecords.forEach((record) => {
			if (!emailSet.has(record.User.email)) {
				emailSet.add(record.User.email);
				uniqueEmailRecords.push(record);
			}
		});
	}

	[err, license_client] = await to(
		Client.findOne({
			where: {
				id: license.ClientId,
				is_deleted: false,
				DripAccess: true,
			},
			attributes: ['id', 'name'],
		})
	);
	if (err) {
		console.log('-----Updated License Status---', err);
	}

	if (driptype == 'Only WhatsApp' || driptype == 'DripApp with sharing on WhatsApp') {
		// trigget whatsapp mail
		totalCount = license.whatsAppCount + license.sharWhatsAppCount;
		useCount = license.useWhatsAppCount + license.useSharWhatsAppCount;
		finalUseCount = useCount + count;
		let percentage = (finalUseCount / totalCount) * 100;
		if (totalCount - 20000 > useCount && totalCount - 20000 <= finalUseCount) {
			for (let item of uniqueEmailRecords) {
				let personalisations = {};
				personalisations.to = item.User.email;
				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: item.User.first,
						client_name: license_client.name,
						percent: percentage + '%',
						total_messages: finalUseCount,
					};
					emailData.push(personalisations);
				}
			}
			sendDripWhatsAppLicenseEmail(emailData);
		} else if (totalCount - 10000 > useCount && totalCount - 10000 <= finalUseCount) {
			// trigget whatsapp mail
			for (let item of uniqueEmailRecords) {
				let personalisations = {};
				personalisations.to = item.User.email;
				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: item.User.first,
						client_name: license_client.name,
						percent: percentage + '%',
						total_messages: finalUseCount,
					};
					emailData.push(personalisations);
				}
			}
			sendDripWhatsAppLicenseEmail(emailData);
		}
	} else if (driptype == 'DripApp with sharing on Email' || driptype == 'Only Email') {
		totalCount = license.emailCount;
		useCount = license.useEmailCount;
		finalUseCount = useCount + count;
		let percentage = (finalUseCount / totalCount) * 100;
		if (totalCount - 20000 > useCount && totalCount - 20000 <= finalUseCount) {
			// trigget Email mail
			for (let item of uniqueEmailRecords) {
				let personalisations = {};
				personalisations.to = item.User.email;
				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: item.User.first,
						client_name: license_client.name,
						percent: percentage + '%',
						total_messages: finalUseCount,
					};
					emailData.push(personalisations);
				}
			}
			sendDripEmailLicenseEmail(emailData);
		} else if (totalCount - 10000 > useCount && totalCount - 10000 <= finalUseCount) {
			// trigget Email mail
			for (let item of uniqueEmailRecords) {
				let personalisations = {};
				personalisations.to = item.User.email;
				if (personalisations.to != '') {
					personalisations.dynamic_template_data = {
						first_name: item.User.first,
						client_name: license_client.name,
						percent: percentage + '%',
						total_messages: finalUseCount,
					};
					emailData.push(personalisations);
				}
			}
			sendDripEmailLicenseEmail(emailData);
		}
	}
};

const getAddOneLearnerCount = async function (clientId) {
	let licence_useLearnerCount;
	let addoneclientLicense = await getLearnerValidaionByClientId(clientId);
	if (addoneclientLicense.status == 'Active') {
		licence_useLearnerCount = addoneclientLicense.useLearnerCount;
		[err, useLearnerCount] = await to(
			License.update(
				{
					useLearnerCount: licence_useLearnerCount + 1,
				},
				{
					where: {
						id: addoneclientLicense.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getAddOneLearnerCount = getAddOneLearnerCount;

const getAddMultipalLearnerCount = async function (clientId, count) {
	let licence_useLearnerCount;
	let addoneclientLicense = await getLearnerValidaionByClientId(clientId);
	if (addoneclientLicense.status == 'Active') {
		licence_useLearnerCount = addoneclientLicense.useLearnerCount;
		[err, useLearnerCount] = await to(
			License.update(
				{
					useLearnerCount: licence_useLearnerCount + count,
				},
				{
					where: {
						id: addoneclientLicense.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getAddMultipalLearnerCount = getAddMultipalLearnerCount;

const getAddOneLearnerCountForDiwo = async function (clientId) {
	let licence_useLearnerCount;
	let addoneclientLicense = await getLearnerValidaionByClientIdForDiwo(clientId);
	if (addoneclientLicense.status == 'Active') {
		licence_useLearnerCount = addoneclientLicense.liveLearnerCount;
		[err, useLearnerCount] = await to(
			DiwoLicense.update(
				{
					liveLearnerCount: licence_useLearnerCount + 1,
				},
				{
					where: {
						id: addoneclientLicense.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getAddOneLearnerCountForDiwo = getAddOneLearnerCountForDiwo;

const getAddMultipalLearnerCountForDiwo = async function (clientId, count) {
	let licence_useLearnerCount;
	let addoneclientLicense = await getLearnerValidaionByClientIdForDiwo(clientId);
	if (addoneclientLicense.status == 'Active') {
		licence_useLearnerCount = addoneclientLicense.liveLearnerCount;
		[err, useLearnerCount] = await to(
			DiwoLicense.update(
				{
					liveLearnerCount: licence_useLearnerCount + count,
				},
				{
					where: {
						id: addoneclientLicense.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getAddMultipalLearnerCountForDiwo = getAddMultipalLearnerCountForDiwo;

const getRemoveOneLearnerCount = async function (clientId) {
	let licence_useLearnerCount;
	let removeoneCount = await getLearnerValidaionByClientId(clientId);
	if (removeoneCount.status == 'Active') {
		licence_useLearnerCount = removeoneCount.useLearnerCount;
		[err, useLearnerCount] = await to(
			License.update(
				{
					useLearnerCount: licence_useLearnerCount - 1,
				},
				{
					where: {
						id: removeoneCount.id,
					},
				}
			)
		);

		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getRemoveOneLearnerCount = getRemoveOneLearnerCount;

const removeLearnerCount = async function (clientId, count) {
	let licence_useLearnerCount;
	let removeoneCount = await getLearnerValidaionByClientId(clientId);
	if (removeoneCount.status == 'Active') {
		licence_useLearnerCount = removeoneCount.useLearnerCount;
		[err, useLearnerCount] = await to(
			License.update(
				{
					useLearnerCount: licence_useLearnerCount - count,
				},
				{
					where: {
						id: removeoneCount.id,
					},
				}
			)
		);

		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.removeLearnerCount = removeLearnerCount;

const getRemoveWorkbookByCount = async function (clientId, worksheetCount) {
	let licence_useLearnerCount;
	let removeoneCount = await getLearnerValidaionByClientIdForDiwo(clientId);
	if (removeoneCount.status == 'Active') {
		licence_useLearnerCount = removeoneCount.liveWorkbookCount;
		let decrimaintalCount = 0.0;
		if (worksheetCount <= 20) {
			decrimaintalCount = 0.5;
		} else if (worksheetCount > 20 && worksheetCount <= 100) {
			decrimaintalCount = 1.0;
		} else if (worksheetCount > 100) {
			decrimaintalCount = 2.0;
		}
		[err, useLearnerCount] = await to(
			DiwoLicense.update(
				{
					liveWorkbookCount: licence_useLearnerCount - decrimaintalCount,
				},
				{
					where: {
						id: removeoneCount.id,
					},
				}
			)
		);

		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getRemoveWorkbookByCount = getRemoveWorkbookByCount;

// Increase Workbook Credit
const getAddOneWorkbookInLicense = async function (clientId, worksheetCount) {
	let licence_liveWorkbook_count;
	let addoneclientLicense = await getLearnerValidaionByClientIdForDiwo(clientId);
	if (addoneclientLicense.status == 'Active') {
		licence_liveWorkbook_count = addoneclientLicense.liveWorkbookCount;
		let incremaintalCount = 0.0;
		if (worksheetCount <= 20) {
			incremaintalCount = 0.5;
		} else if (worksheetCount > 20 && worksheetCount <= 100) {
			incremaintalCount = 1.0;
		} else if (worksheetCount > 100) {
			incremaintalCount = 2.0;
		}
		[err, liveWorkbookCount] = await to(
			DiwoLicense.update(
				{
					liveWorkbookCount: licence_liveWorkbook_count + incremaintalCount,
				},
				{
					where: {
						id: addoneclientLicense.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};

module.exports.getAddOneWorkbookInLicense = getAddOneWorkbookInLicense;

const getRemoveOneLearnerCountForDiwo = async function (clientId) {
	let licence_useLearnerCount;
	let removeoneCount = await getLearnerValidaionByClientIdForDiwo(clientId);
	if (removeoneCount.status == 'Active') {
		licence_useLearnerCount = removeoneCount.liveLearnerCount;
		[err, useLearnerCount] = await to(
			DiwoLicense.update(
				{
					liveLearnerCount: licence_useLearnerCount - 1,
				},
				{
					where: {
						id: removeoneCount.id,
					},
				}
			)
		);

		if (err) return ResponseError(res, err, 500, true);
	} else {
		return false;
	}
};
module.exports.getRemoveOneLearnerCountForDiwo = getRemoveOneLearnerCountForDiwo;

const getClientChildVilidation = async function (clientDetails) {
	try {
		[err, client] = await to(
			Client.findOne({
				where: {
					Associate_client_id: clientDetails.id,
				},
				attributes: ['id'],
			})
		);

		//Selected Account is a Branch Account
		if (client) {
			return true;
		} else {
			if (clientDetails.category == 'Branch Account') {
				return false;
			} else {
				return true;
			}
		}
	} catch (error) {}
};
module.exports.getClientChildVilidation = getClientChildVilidation;
