import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable()
export class ManageClientsService {
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

	getClientData(page, limit) {
		return this.http.get(`${this.apiHostUrl}/Clients?page=` + page + `&limit=` + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientDataBySearch(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/client-search?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteClients(ClientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http.delete(`${this.apiHostUrl}/${this.type}/Clients/` + ClientId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createClient(ClientData, clientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http.post(`${this.apiHostUrl}/${this.type}/${clientId}/create-client`, ClientData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateClients(Clientid, ClientData) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http.put(`${this.apiHostUrl}/${this.type}/update-client/${Clientid}`, ClientData).pipe(
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

	getAllBranchClient(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-branch-client-list`).pipe(
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

	getAllSubChildClient(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-sub-child-client-list?page=` + page + '&limit=' + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllSubChildClientForEditUser(parentClientId) {
		return this.http
			.get(`${this.apiHostUrl}/${this.type}/${parentClientId}/get-all-sub-child-client-list-for-edit-user`)
			.pipe(
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

	getAllChildClientForAdmin(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-child-client-list-for-admin`).pipe(
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

	uploadAvatar(data) {
		return this.http.post(`${this.apiHostUrl}/upload-avatar`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSingleClientByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/get-single-client-by-clientId/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAccountListByUserRoleId(roleId) {
		return this.http.get(`${this.apiHostUrl}/get-account-type-by-using-user-role-id/${roleId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	suspendAccount(data, isSuspend) {
		return this.http.put(`${this.apiHostUrl}/${this.type}/account-suspend/${isSuspend}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTimeZoneData() {
		return this.http.get(`/assets/file/time_zone.json`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changeToggleValue(clientId) {
		return this.http.post(`${this.apiHostUrl}/turn-off-whatsapp-default-reply-toggle/${clientId}`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
