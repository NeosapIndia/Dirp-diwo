import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ManageHomeService {
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

	getAllCount(ClientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-drip-anylysis-count/${ClientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllDripActivity(ClientId, Months) {
		return this.http.get(`${this.apiHostUrl}/${ClientId}/${Months}/null/get-all-drip-activity-for-analytics`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientViewSubscriptionById(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-client-view-subscription-by-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	acceptPolicyByUser(userId, clientId, payload) {
		return this.http.put(`${this.apiHostUrl}/${this.type}/accept-policy-by-user/${clientId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserNotification() {
		return this.http.get(`${this.apiHostUrl}/get-user-pop-up-notifcation`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkUserIsExistingOrNot(userId) {
		return this.http.get(`${this.apiHostUrl}/${userId}/${this.type}/check-user-is-existing-or-new-for-policy`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getEmailReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-email-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppOPTINReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-opt-in-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTeamsDelievryReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-teams-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
