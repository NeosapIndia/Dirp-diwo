import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class ManageSystemHealthService {
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

	getSystemHealthDetails() {
		return this.http.post(`${this.apiHostUrl}/get-system-monitor-details`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSystemHealthNotificationDetails() {
		return this.http.post(`${this.apiHostUrl}/get-system-monitor-notification-flag`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateSystemHealthNotificationDetails(flagData) {
		return this.http.post(`${this.apiHostUrl}/update-system-monitor-notification-flag`, flagData).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
