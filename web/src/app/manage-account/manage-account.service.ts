import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable()
export class ManageAccountService {
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

	getClientById(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-client-by-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientSubscriptionById(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-client-view-subscription-by-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
