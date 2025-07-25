const hubspot = require('@hubspot/api-client');

// API call to create contact in Zoho and update user with Zoho contact id
const createZohoContact = async function (user, hapikey) {
	return new Promise(async (resolve, reject) => {
		const hubspotClient = new hubspot.Client({ accessToken: hapikey });

		const contactObj = {
			properties: {
				firstname: user.first || '',
				lastname: user.last || '',
				phone: user.phone || '',
				email: user.email || '',
				country: user.country || '',
				city: user.city || '',
				state: user.state || '',
				zip: user.zip || '',
			},
		};

		hubspotClient.crm.contacts.basicApi
			.create(contactObj)
			.then((result) => {
				console.log('-----createContactResponse----', result);
				return resolve(result);
			})
			.catch((error) => {
				console.log('-error--createZohoContact-----', error.body);
				return reject(error);
			});
	});
};
module.exports.createZohoContact = createZohoContact;
