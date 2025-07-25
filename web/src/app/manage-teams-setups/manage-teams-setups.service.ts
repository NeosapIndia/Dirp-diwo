import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageTeamSetupService {
	apiHostUrl: string;
	type: string = null;

	constructor(private http: HttpClient) {
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

	checkTeamSetupExist() {
		return this.http.get(`${this.apiHostUrl}/check-team-setup-exist`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllTeamSetup(clientId, page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-team-setup-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTeamsAppSetUpById(teamSetupId) {
		return this.http.get(`${this.apiHostUrl}/get-teams-setup-by-id/${teamSetupId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchTeamSetup(clientId, payload, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/${clientId}/${this.type}/search/teamSetup?page=${page}&limit=${limit}`, payload)
			.pipe(
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

	updateTeamSetupChildClient(teamSetupId, payload) {
		return this.http.post(`${this.apiHostUrl}/update-teams-setup-by-id/${teamSetupId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	syncTeamChannel(teamSetupId) {
		return this.http.get(`${this.apiHostUrl}/sync-teams-channel-details/${teamSetupId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
