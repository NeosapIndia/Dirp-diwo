import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable()
export class ManageAppBrandingService {
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index = this.restricted_roles.indexOf(this.user_role);
	raise = false;
	approverRole = 'Super Admin';
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
			this.apiHostUrl = hostName + '/v1';
			this.type = 'drip';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
			this.type = 'diwo';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
		if (!this.type) {
			this.type = localStorage.getItem('projectName');
		}
	}

	getClientData(page, limit) {
		return this.http.get(`${this.apiHostUrl}/Clients?page=` + page + `&limit=` + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientDataBySearch(key) {
		return this.http.get(`${this.apiHostUrl}/Clients/${key}/filteredSearch`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteClients(ClientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.delete(`${this.apiHostUrl}/Clients/` + ClientId + `?raise=${this.raise}&approver=${this.approverRole}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getSubChildClient(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/${parentClientId}/get-sub-child-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getChildClient(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/${parentClientId}/get-child-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getChildClientWithParentClient(parentClientId) {
		return this.http
			.get(`${this.apiHostUrl}/${this.type}/${parentClientId}/get-child-client-list-with-parent-client`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllSubChildClient(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-sub-child-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllChildClient(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-child-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getJobRoleByClientId(clientIds) {
		return this.http.post(`${this.apiHostUrl}/${this.type}/get-all-job-role-by-client`, clientIds).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	uploadSystemBranding(data) {
		return this.http.post(`${this.apiHostUrl}/upload-system-branding?type=${this.type}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createAppBranding(Clientid, appBrandingData) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.post(`${this.apiHostUrl}/create-system-branding/${Clientid}?type=${this.type}`, appBrandingData)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	updateAppBranding(id, appBrandingData, clientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(`${this.apiHostUrl}/${clientId}/update-system-branding/${id}?type=${this.type}`, appBrandingData)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getClientListOfWithoutAppBranding(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-app-branding/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllAppBranding(page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-system-branding-list-by-parent-client-id?page=${page}&limit=${limit}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllSearchAppBranding(payload, page, limit) {
		return this.http
			.post(
				`${this.apiHostUrl}/get-all-search-system-branding-list-by-parent-client-id?page=${page}&limit=${limit}`,
				payload
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}
	getAppBrandingDataById(clientId, appBrandingId) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/${clientId}/get-app-branding-by-id/${appBrandingId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllClientListForDropdowns(parentClientId) {
		return this.http
			.get(`${this.apiHostUrl}/${this.type}/get-client-name-list-for-app-branding/${parentClientId}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllBranchNameUnderClientForSporRegistarion(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-branch-name-list-under-client-for-spot-registration/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllWhatsAppPostForOptIn(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-only-whatsapp-post-by-client-for-optIn/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	///////////////////////////////////////////////////For testing
	getZoomRedirectURL(clientId) {
		let payload = {
			host: this.apiHostUrl,
		};
		return this.http.post(`${this.apiHostUrl}/get-zoom-redirect-url/${clientId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	revokeZoomSignIn(zoomUserTokenId) {
		let payload = {
			host: this.apiHostUrl,
		};
		return this.http.post(`${this.apiHostUrl}/revoke-zoom-sign-in/${zoomUserTokenId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	revokeTeamSignIn(teamUserTokenId) {
		let payload = {
			host: this.apiHostUrl,
		};
		return this.http.post(`${this.apiHostUrl}/revoke-user-microsoft-teams-tokens/${teamUserTokenId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getZoomSignInDetails(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-zoom-sign-in-details-by-using-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTeamSignInDetails(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-user-microsoft-teams-tokens/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTeamsAuthUrl() {
		let payload = {
			redirectUrl: this.apiHostUrl,
		};
		return this.http.post(`${this.apiHostUrl}/microsoft-teams/authenticate`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//get client Whatsapp setup for OTP
	getClientWhatsappSetupForOTP(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-client-whatsapp-setup-for-otp/${clientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
