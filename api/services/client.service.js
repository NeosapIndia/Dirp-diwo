const { Client, System_branding, DiwoSystemBranding, ClientTeamSetup } = require('../models1/connectionPool')['global'];
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports.getAllSubChildClientIds = async function (clientId) {
	try {
		let err, ClientsDetail, totalClientCount;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		childClientId.push(parentClientId);

		let count = 0;
		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					attributes: ['id'],
				})
			);

			childClientId = [];

			if (!ClientsDetail || (ClientsDetail && ClientsDetail.length <= 0)) flag = false;

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				//let client = ClientsDetail[i];
				let client_ = ClientsDetail[i].convertToJSON();
				// [err, parentClientsDetail] = await to(
				// 	Client.findOne({
				// 		where: {
				// 			is_deleted: false,
				// 			id: client_.Associate_client_id,
				// 		},
				// 	})
				// );
				// client_.Parent_client = parentClientsDetail.convertToJSON();
				// client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				finalArrayOfClient.push(client_.id);
			}
			if (childClientId.length <= 0) flag = false;
		}
		return finalArrayOfClient;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

module.exports.getAllSubBranchClientIds = async function (clientId, type) {
	try {
		let err, ClientsDetail;
		let parentClientIds = clientId;
		let flag = true;
		let ArrayOfLastClient = [];

		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: parentClientIds,
					},
					include: [{ model: ClientTeamSetup, attributes: ['id'] }],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			parentClientIds = [];

			if (!ClientsDetail || (ClientsDetail && ClientsDetail.length <= 0)) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				parentClientIds.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				let client_ = client.convertToJSON();
				[err, parentClientsDetail] = await to(
					Client.findOne({
						where: {
							is_deleted: false,
							id: client_.Associate_client_id,
						},
						include: [{ model: ClientTeamSetup, attributes: ['id'] }],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				client_.Parent_client = parentClientsDetail ? parentClientsDetail.convertToJSON() : null;
				client_.clientIdWithName = client_.client_id + ' - ' + client_.name;
				if (client_.category == 'Branch Account') {
					if (type == 'drip' && client_.DripAccess) {
						ArrayOfLastClient.push(client_);
					} else if (type == 'diwo' && client_.DiwoAccess) {
						ArrayOfLastClient.push(client_);
					}
				}
			}
			if (parentClientIds.length <= 0) {
				flag = false;
			}
		}
		return ArrayOfLastClient;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

module.exports.getAllSubChildClientIdsForAssets = async function (clientId) {
	try {
		let err, client, totalClientCount;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['id', 'Associate_client_id'],
			})
		);
		if (client && client.Associate_client_id) {
			parentClientId = client.Associate_client_id;
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
						attributes: ['id', 'share_flag', 'Associate_client_id'],
					})
				);
				if (parentClient) {
					if (parentClient.share_flag === true) finalArrayOfClient.push(parentClient.id);
				} else {
					flag = false;
				}
				if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
		return finalArrayOfClient;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

module.exports.getAllSubChildClientIdsForDrip = async function (clientId) {
	try {
		let err, client;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['Associate_client_id'],
			})
		);
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
						attributes: ['Associate_client_id', 'id'],
					})
				);
				if (parentClient) {
					if (parentClient.drip_share_flag == true && parentClient.DripAccess == true) {
						finalArrayOfClient.push(parentClient.id);
					}
				} else {
					flag = false;
				}
				if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
		return finalArrayOfClient;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

module.exports.getAllSubChildClientIdsForDiwo = async function (clientId) {
	try {
		let err, client;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		let parentClient;
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['Associate_client_id'],
			})
		);
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
						attributes: ['id', 'Associate_client_id', 'workbookshareflag', 'DiwoAccess'],
					})
				);
				if (parentClient) {
					if (parentClient.workbookshareflag == true && parentClient.DiwoAccess == true) {
						finalArrayOfClient.push(parentClient.id);
					}
				} else {
					flag = false;
				}
				if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}
		return finalArrayOfClient;
	} catch (error) {
		return ResponseError(error, 500, true);
	}
};

module.exports.getClientAppBrandingByClientId = async function (clientId) {
	let appBranding;
	let flag = true;
	[err, client] = await to(
		Client.findOne({
			where: {
				id: clientId,
			},
			include: [
				{
					model: System_branding,
				},
			],
			attributes: ['SystemBrandingId', 'Associate_client_id'],
		})
	);
	if (err) console.log('-----Error 01 Get Client App Branding By Client Id--', err);

	if (client && client.SystemBrandingId) {
		appBranding = client.System_branding;
	} else if (client && client.Associate_client_id) {
		let parentClientId = client.Associate_client_id;
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
							model: System_branding,
						},
					],
					attributes: ['SystemBrandingId', 'Associate_client_id'],
				})
			);
			if (err) console.log('-----Error 02 Get Client App Branding By Client Id--', err);
			if (parentClient && parentClient.SystemBrandingId) {
				appBranding = parentClient.System_branding;
				flag = false;
			} else if (parentClient && parentClient.Associate_client_id) {
				parentClientId = parentClient.Associate_client_id;
			} else {
				flag = false;
			}
		}
	}

	if (appBranding && appBranding != null) {
		return appBranding;
	} else {
		return false;
	}
};

module.exports.getDiwoClientAppBrandingByClientId = async function (clientId) {
	let appBranding;
	let flag = true;
	[err, client] = await to(
		Client.findOne({
			where: {
				id: clientId,
			},
			include: [
				{
					model: DiwoSystemBranding,
				},
			],
			attributes: ['DiwoSystemBrandingId', 'Associate_client_id'],
		})
	);
	if (err) {
		console.log('-----Error 01 Get Client App Branding By Client Id--', err);
	}

	if (client && client.DiwoSystemBrandingId) {
		appBranding = client.DiwoSystemBranding.convertToJSON();
	} else {
		let parentClientId = client.Associate_client_id;
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
							model: DiwoSystemBranding,
						},
					],
					attributes: ['DiwoSystemBrandingId', 'Associate_client_id'],
				})
			);
			if (err) {
				console.log('-----Error 02 Get Client App Branding By Client Id--', err);
			}
			if (parentClient && parentClient.DiwoSystemBrandingId) {
				appBranding = parentClient.DiwoSystemBranding.convertToJSON();
				flag = false;
			} else if (parentClient && parentClient.Associate_client_id) {
				parentClientId = parentClient.Associate_client_id;
			} else {
				flag = false;
			}
		}
	}

	if (appBranding && appBranding != null) {
		return appBranding;
	} else {
		return false;
	}
};
const getAllSubClientAndBranchAccountLists = async function (clientId, details) {
	try {
		let err, ClientsDetail;
		const parentClientId = parseInt(clientId);
		let flag = true;
		let finalArrayOfClients = [];
		let finalClientIdsArray = [];
		let childClientId = [];
		childClientId.push(parentClientId);

		[err, parentClient] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
			})
		);
		if (err) console.log('--Error Parent Client Details---', err);

		if (parentClient && (parentClient.category == 'Client Account' || parentClient.category == 'Branch Account')) {
			let client = parentClient.convertToJSON();
			client.nameWithClientId = client.client_id + '-' + client.name;
			finalArrayOfClients.push(client);
			finalClientIdsArray.push(client.id);
		}

		let totalClientCount;
		let count = 0;
		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) console.log('--Error Get All Client List ---', err);

			childClientId = [];

			if (!ClientsDetail || (ClientsDetail && ClientsDetail.length <= 0)) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				if (ClientsDetail[i].category == 'Client Account' || ClientsDetail[i].category == 'Branch Account') {
					let client = ClientsDetail[i].convertToJSON();
					client.nameWithClientId = ClientsDetail[i].client_id + '-' + ClientsDetail[i].name;
					finalArrayOfClients.push(client);
					finalClientIdsArray.push(client.id);
				}
			}
			if (childClientId.length <= 0) flag = false;
		}
		if (details) {
			return finalArrayOfClients;
		} else {
			return finalClientIdsArray;
		}
	} catch (error) {
		// return ResponseError(res, error, 500, true);
		console.log('----ERROR While Fetching Client And Branch Account Ids', error);
	}
};
module.exports.getAllSubClientAndBranchAccountLists = getAllSubClientAndBranchAccountLists;

const getAllSubBranchAccountLists = async function (clientId, details) {
	try {
		let err, ClientsDetail;
		const parentClientId = parseInt(clientId);
		let flag = true;
		let finalArrayOfClients = [];
		let finalClientIdsArray = [];
		let childClientId = [];
		childClientId.push(parentClientId);

		[err, parentClient] = await to(
			Client.findOne({
				where: {
					id: parentClientId,
				},
				attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
			})
		);
		if (err) console.log('--Error Parent Client Details---', err);

		if (parentClient.category == 'Branch Account') {
			let client = parentClient.convertToJSON();
			client.nameWithClientId = client.client_id + '-' + client.name;
			finalArrayOfClients.push(client);
			finalClientIdsArray.push(client.id);
		}

		let totalClientCount;
		let count = 0;
		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					attributes: ['id', 'name', 'client_id', 'category', 'DripAccess', 'DiwoAccess'],
				})
			);
			if (err) console.log('--Error Get All Client List ---', err);

			childClientId = [];

			if (!ClientsDetail || (ClientsDetail && ClientsDetail.length <= 0)) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				if (ClientsDetail[i].category == 'Branch Account') {
					let client = ClientsDetail[i].convertToJSON();
					client.nameWithClientId = ClientsDetail[i].client_id + '-' + ClientsDetail[i].name;
					finalArrayOfClients.push(client);
					finalClientIdsArray.push(client.id);
				}
			}
			if (childClientId.length <= 0) flag = false;
		}
		if (details) {
			return finalArrayOfClients;
		} else {
			return finalClientIdsArray;
		}
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSubBranchAccountLists = getAllSubBranchAccountLists;

const getAccountCustomField = async function (clientId, type) {
	try {
		let err;
		let clientDetails;
		let customField = [];
		let count = 0;
		let flag = true;
		let clientCount = 0;
		[err, clientCount] = await to(Client.count());

		while (flag) {
			count++;

			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: clientId,
					},
					attributes: ['id', 'category', 'customFields', 'Associate_client_id'],
				})
			);
			if (err) console.log('getAccountCustomField Get Account Error', err);

			if (clientDetails && clientDetails.category == 'Client Account') {
				if (clientDetails.customFields && clientDetails.customFields !== null && clientDetails.customFields !== '') {
					customField = clientDetails.customFields;
				} else {
					customField = [];
				}
				flag = false;
			} else if (clientDetails && clientDetails.category == 'Branch Account') {
				clientId = clientDetails.Associate_client_id;
			} else {
				flag = false;
			}

			if (count > clientCount) {
				flag = false;
			}
		}
		return customField;
	} catch (error) {
		console.log('getAccountCustomField Error', error);
		return [];
	}
};
module.exports.getAccountCustomField = getAccountCustomField;

const getUpperLevelAccountDetailsUptoClientAccount = async function (clientId) {
	try {
		let flag = true;
		let count = 0;
		let maxCount = 0;
		let parentClientId = clientId;
		let accountIds = [];

		[err, maxCount] = await to(Client.count());
		while (flag) {
			count++;

			[err, clientDetails] = await to(
				Client.findOne({
					where: {
						id: parentClientId,
					},
					attributes: ['id', 'Associate_client_id', 'category', 'name'],
				})
			);

			if (!clientDetails) {
				flag = false;
				break;
			} else if (clientDetails.category == 'Client Account') {
				accountIds.push(clientDetails.id);
				flag = false;
				break;
			} else if (clientDetails.category == 'Branch Account') {
				accountIds.push(clientDetails.id);
				parentClientId = clientDetails.Associate_client_id;
			} else {
				flag = false;
				break;
			}

			if (err) {
				console.log('getUpperLevelAccountDetailsUptoClientAccount Get Account Error', err);
				return [];
			}

			if (count > maxCount) {
				flag = false;
				break;
			}
		}
		console.log('-----------------------------------', accountIds);
		return accountIds;
	} catch (error) {
		console.log('getUpperLevelAccountDetailsUptoClientAccount Error', error);
		return [];
	}
};
module.exports.getUpperLevelAccountDetailsUptoClientAccount = getUpperLevelAccountDetailsUptoClientAccount;
