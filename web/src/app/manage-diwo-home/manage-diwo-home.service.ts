import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageDiwoHomeService {
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

	getAllCount(ClientId) {
		return this.http.get(`${this.apiHostUrl}/${ClientId}/get-all-diwo-anylysis-count`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getActivityReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-activity-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLearnerPerformanceReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-learner-performance-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPathwayWiseReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-pathwaywise-report`, payload).pipe(
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

	getCourseWiseReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-coursewise-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLearnerwisBadgesCertificatesReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-LearnerwisBadges-Certificates-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
