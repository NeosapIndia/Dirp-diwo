import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageDiwoAnalyticsService {
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

	getAllSubClientList(parentClient) {
		return this.http.get(`${this.apiHostUrl}/${parentClient}/get-all-sub-client-and-branch-account-list`).pipe(
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

	getAllModuleCoursePathwaysForAnalytics(ClientId, selectedViewedBy) {
		return this.http
			.get(`${this.apiHostUrl}/${ClientId}/get-all-diwo-modules-courses-pathway-for-analytics/${selectedViewedBy}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getModuleAnalyticsDataByModuleId(payload, ClientId) {
		return this.http
			.post(`${this.apiHostUrl}/${ClientId}/get-diwo-module-data-for-analytics-by-moduleId`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getCourseAnalyticsDataByCourseId(payload, ClientId) {
		return this.http
			.post(`${this.apiHostUrl}/${ClientId}/get-diwo-course-data-for-analytics-by-courseId`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getPathwaysAnalyticsDataByPathwayId(payload, ClientId) {
		return this.http
			.post(`${this.apiHostUrl}/${ClientId}/get-diwo-pathway-data-for-analytics-by-pathwayId`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getSessionListByUsingClientId(ClientId) {
		return this.http.get(`${this.apiHostUrl}/${ClientId}/get-all-session-list-by-using-client-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionCardData(sesisonId) {
		return this.http.get(`${this.apiHostUrl}/${sesisonId}/get-sesstion-data-by-using-session-id`).pipe(
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

	getInteractionReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-scrom-interaction-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getScormSummaryReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-scrom-summary-report`, payload).pipe(
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
