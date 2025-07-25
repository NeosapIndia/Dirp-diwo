import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageWhatsAppSetupService {
	apiHostUrl: string;
	type: string = null;

	constructor(private http: HttpClient) {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.type = 'drip';
			this.apiHostUrl = hostName + '/v1';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.type = 'diwo';
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
		if (!this.type) {
			this.type = localStorage.getItem('projectName');
		}
	}

	getAllClientWithoutLicenseById(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-client-name-list-of-without-whatsapp-setup/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllChildClientNotHaveWhatsAppSetup(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-child-client-list-not-have-whatsapp-setup/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllWhatsAppSetupById(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-client-for-dropdowns`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createWhatsAppSetup(data) {
		return this.http.post(`${this.apiHostUrl}/create-whatsapp-setup`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateWhatsAppSetup(data, whatsAppSetupId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-whatsapp-setup/${whatsAppSetupId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllWhatsAppSetup(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-whatsapp-setup?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppSetUpById(whatsAppSetup) {
		return this.http.get(`${this.apiHostUrl}/get-whatsapp-setup-by-id/${whatsAppSetup}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteWhatsAppSetup(whstaAppSetupId) {
		return this.http.delete(`${this.apiHostUrl}/delete-whatsapp-setup/${whstaAppSetupId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	activateSuspendClient(ClientId) {
		return this.http.delete(`${this.apiHostUrl}/active-client/${ClientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientViewSubscriptionById(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-client-view-subscription-by-id}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getFilteredLicense(searchKey) {
		return this.http.get(`${this.apiHostUrl}/search/license/${searchKey}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchWhatsAppSetup(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/whatsAppsetup?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
	createWhatsAppOTPTemplate(clientId) {
		return this.http.get(`${this.apiHostUrl}/create-whatsapp-template-for-otp/${clientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
