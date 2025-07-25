import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageOptInsService {
	ip_address: string;
	mac_address: string;
	apiHostUrl: string;
	type: any = null;

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

	changePolicyOfallUser(uploadData) {
		uploadData.mac_address = this.mac_address;
		return this.http.post(`${this.apiHostUrl}/change-policy-of-all-user`, uploadData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAcceptanceLogData(clientId) {
		return this.http.get(`${this.apiHostUrl}/opt-ins/download-acceptance-log-data/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllMarketList() {
		return this.http.get(`${this.apiHostUrl}/get-all-market-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}
	getAllPolicyLogs() {
		return this.http.get(`${this.apiHostUrl}/get-all-policy-logs`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllClientAccount(clientId) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/get-all-client-account-list/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadOPtIn(payload) {
		return this.http.post(`${this.apiHostUrl}/download-file`, payload, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getFilteredOptIn(payload) {
		return this.http.post(`${this.apiHostUrl}/search/optIn`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
