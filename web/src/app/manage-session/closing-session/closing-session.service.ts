import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageClosingSessionService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
	apiHostUrl: string;
	apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json`;

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

	getParticipantList(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-participant-list/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changeParticipantAttendanceStatus(status, id) {
		return this.http.put(`${this.apiHostUrl}/change-participant-attendance-status/${id}/${status}`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	addUserNote(data, id) {
		return this.http.put(`${this.apiHostUrl}/add-user-note-by-trainer/${id}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	closeSession(data, id) {
		return this.http.put(`${this.apiHostUrl}/close-session-by-trainer/${id}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	endSession(data, id) {
		return this.http.put(`${this.apiHostUrl}/end-session-by-trainer/${id}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadSessionPhotgraphs(data, sessionId) {
		return this.http.post(`${this.apiHostUrl}/upload-session-photographs/${sessionId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteSessionPhotographs(removesessionPhotograph) {
		return this.http.delete(`${this.apiHostUrl}/delete-session-photographs/${removesessionPhotograph}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLocationName(latitude: number, longitude: number) {
		const url = `${this.apiUrl}&lat=${latitude}&lon=${longitude}&addressdetails=1`;
		// console.log('url', url);
		// const url =
		// 	'https://nominatim.openstreetmap.org/reverse?format=json&lat=20.903037094083274&lon=74.77760140149199&addressdetails=1';
		return this.http.get(url).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
