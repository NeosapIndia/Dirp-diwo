import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class ManageWorkbookService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
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

	getAllWorkbookByClients(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-workbook-by-client-id?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteWorkbookByClient(workbookId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-workbook`, workbookId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	assignmentWorkbook(payload, clientId, workbookId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/assign-workbook/${workbookId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLearnerGroupForWorkbookByUserId(userId, clientId, roleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-for-workbook-by-user-id?userId=${userId}&clientId=${clientId}&roleId=${roleId}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getLearnerGroupByUserId(userId, clientId, roleId, page, limit) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-by-user-id?userId=${userId}&clientId=${clientId}&roleId=${roleId}&page=${page}&limit=${limit}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getTrainerList(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-trainer-list-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchWorkBook(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/workbooks?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
