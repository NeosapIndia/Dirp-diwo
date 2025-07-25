import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ManageMasterSettingsService {
	apiHostUrl: string;
	type: string = null;
	constructor(private http: HttpClient) {
		const httpOptions = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				Authorization: 'my-auth-token',
			}),
		};
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

	getMarketForPolicyURLDetails() {
		return this.http.get(`${this.apiHostUrl}/get-market-policy-url-details`);
	}

	updateMarketPolicyURL(marketId, payload) {
		return this.http.put(`${this.apiHostUrl}/update-market-policy-url-details/${marketId}`, payload);
	}

	createVimeoCredential(payload) {
		return this.http.post(`${this.apiHostUrl}/create-vimeo-credential`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateVimeoCredential(payload, vimeoId) {
		return this.http.put(`${this.apiHostUrl}/update-vimeo-credential/${vimeoId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createZoomAppCredential(payload) {
		return this.http.post(`${this.apiHostUrl}/create-zoom-app-credential?type=${this.type}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateZoomAppCredential(payload, vimeoId) {
		return this.http.put(`${this.apiHostUrl}/update-zoom-app-credential/${vimeoId}?type=${this.type}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientListOfWithoutVimeoCredentail(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-vimeo-credential/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getClientListOfWithoutZoomAppCredentail(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-zoom-app-credential/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getClientListOfWithouAssistantAPICredentail(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-assistant-api-credential/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getClientListOfWithoutETlConfi(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-etl-config/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}
	vimeoCredentialDetails(page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-vimeo-credential-list?page=${page}&limit=${limit}&type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	zoomAppCredentialDetails(page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-zoom-app-credential-list?page=${page}&limit=${limit}&type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	assistantAPICredentialDetails(page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-assistant-api-credential-list?page=${page}&limit=${limit}&type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllETLChoice(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-etl-choice/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createUpdateAssistantAPICredential(payload) {
		return this.http.post(`${this.apiHostUrl}/create-update-assistant-api-credential?type=${this.type}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createUpdateETLCredential(payload) {
		return this.http.post(`${this.apiHostUrl}/create-update-etl-credential`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteVimeoCredentail(assetId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-vimeoCredential?type=${this.type}`, assetId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTeamsCredential() {
		return this.http.get(`${this.apiHostUrl}/get-microsoft-teams-credential`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateTeamsCredential(payload) {
		return this.http.post(`${this.apiHostUrl}/microsoft-teams/update-app-credential`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadSystemBranding(data) {
		return this.http.post(`${this.apiHostUrl}/upload-system-branding?type=${this.type}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}
	uploadLoginAppBrading(data) {
		return this.http.post(`${this.apiHostUrl}/update-login-app-branding`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}
	getLoginAppBradingData() {
		return this.http.get(`${this.apiHostUrl}/get-login-app-branding`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
