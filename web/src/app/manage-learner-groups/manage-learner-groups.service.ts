import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable()
export class ManageLearnerGroupsService {
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

	getCampaignData(page, limit) {
		return this.http.get(`${this.apiHostUrl}/offers?page=` + page + `&limit=` + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCampaignDataBySearch(key) {
		return this.http.get(`${this.apiHostUrl}/offers/${key}/filteredSearch`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOfferCriteria() {
		return this.http.get(`${this.apiHostUrl}/offerCriteria`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteOffers(offerId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.delete(`${this.apiHostUrl}/offers/` + offerId + `?raise=${this.raise}&approver=${this.approverRole}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	postOffers(offerData) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.post(`${this.apiHostUrl}/offers?raise=${this.raise}&approver=${this.approverRole}`, offerData)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	updateOffers(offerid, offerData) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(`${this.apiHostUrl}/offers/${offerid}?raise=${this.raise}&approver=${this.approverRole}`, offerData)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllLastClientList(parentClientId) {
		return this.http
			.post(`${this.apiHostUrl}/${this.type}/get-last-client-list-by-parent-client-id`, parentClientId)
			.pipe(
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

	getLearnerByClientIdAndJobROle(payload, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/get-all-learner-users-by-client-and-job-role?page=${page}&limit=${limit}`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	createLearnerUserGroup(payload) {
		return this.http.post(`${this.apiHostUrl}/create-learner-user-group`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateLearnerUserGroup(groupId, payload) {
		return this.http.put(`${this.apiHostUrl}/${groupId}/update-learner-user-group`, payload).pipe(
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

	deleteLearnerUserGroup(userId, learnerGroupId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(
				`${this.apiHostUrl}/${userId}/delete-learner-user-group?raise=${this.raise}&approver=${this.approverRole}`,
				learnerGroupId
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getLearnerGroupById(userId, learnerGroupId) {
		return this.http.get(`${this.apiHostUrl}/${userId}/${learnerGroupId}/get-learner-user-group`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLearnerGroupDetailsById(userId, learnerGroupId) {
		return this.http.get(`${this.apiHostUrl}/${userId}/${learnerGroupId}/get-learner-group-details`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLearnerGroupsBySearch(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/learnerGroup-search/?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllClientAndBranchAccountList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-sub-client-and-branch-account-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSelctedClientAdminUserList(clientId, roleId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/${roleId}/get-all-client-and-branch-admin-user-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllLearnerGroupsLearnerBySearch(payload, searchKey, page, limit) {
		return this.http
			.post(
				`${this.apiHostUrl}/search/get-search-all-learner-users-by-client-and-job-role/${searchKey}/?page=${page}&limit=${limit}`,
				payload
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	transferLearnerGroupToUser(payload) {
		return this.http.post(`${this.apiHostUrl}/transefer-learner-group`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
