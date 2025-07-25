import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageAddEditSessionService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
	apiHostUrl: string;

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
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
	}

	createSession(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-session`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAssignedWorkbookList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-assigned-workbook-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	startSession(sessionId) {
		return this.http.put(`${this.apiHostUrl}/start-session/${sessionId}`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getParticipantList(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-participant-list/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changeParticipantStatus(status, id) {
		return this.http.put(`${this.apiHostUrl}/change-participant-workbook-access-status/${id}/${status}`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionById(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-by-id/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateSession(data, clientId, sessionId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-session/${sessionId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateSessionStep(data, sessionId) {
		return this.http.put(`${this.apiHostUrl}/update-session-step/${sessionId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionCourseList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-course-list-by-client-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWorkbookCourseList(courseId) {
		return this.http.get(`${this.apiHostUrl}/${courseId}/get-workbook-list-by-courseId`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
