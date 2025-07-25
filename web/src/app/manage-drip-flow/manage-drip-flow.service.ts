import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ManageDripFlowsService {
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

	getAllCampaignListByClientId(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-campaign-by-client-id?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchCampaignData(payload, userId, roleId, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/search/campaign?userId=${userId}&roleId=${roleId}&page=${page}&limit=${limit}`, payload)
			.pipe(
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

	createCampaign(payload, clientId, userId, roleId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-campaign?userId=${userId}&roleId=${roleId}`, payload);
	}

	updateCampaign(campaignId, payload, clientId, userId, roleId) {
		return this.http.put(
			`${this.apiHostUrl}/${clientId}/${campaignId}/update-campaign?userId=${userId}&roleId=${roleId}`,
			payload
		);
	}

	// deleteCampaign(campaignId, userId, roleId) {
	//     if (this.index >= 0) {
	//         this.raise = true;
	//     }
	//     return this.http
	//         .delete(
	//             `${this.apiHostUrl}/delete-campaign?campaignId=${campaignId}&userId=${userId}&roleId=${roleId}&raise=${this.raise}&approver=${this.approverRole}`
	//         )
	//         .pipe(
	//             map((data) => {
	//                 return data;
	//             })
	//         );
	// }

	deleteCampaign(clientId, campaignId, userId, roleId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(`${this.apiHostUrl}/delete-campaign?clientId=${clientId}&userId=${userId}&roleId=${roleId}`, campaignId)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	pausedCampaign(payload, userId, roleId, clientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(
				`${this.apiHostUrl}/${clientId}/paused-campaign?&userId=${userId}&roleId=${roleId}&raise=${this.raise}&approver=${this.approverRole}`,
				payload
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	resumeCampaign(payload, userId, roleId, clientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(
				`${this.apiHostUrl}/${clientId}/resume-campaign?&userId=${userId}&roleId=${roleId}&raise=${this.raise}&approver=${this.approverRole}`,
				payload
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	resumeBulkCampaign(payload, userId, roleId, clientId) {
		if (this.index >= 0) {
			this.raise = true;
		}
		return this.http
			.put(
				`${this.apiHostUrl}/${clientId}/resume-campaign?&userId=${userId}&roleId=${roleId}&raise=${this.raise}&approver=${this.approverRole}`,
				payload
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getCampaignById(campaignId, clientId, userId, RoleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-campaign-by-id?campaignId=${campaignId}&userId=${userId}&clientId=${clientId}&roleId=${RoleId}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getDripByDripId(dripId) {
		return this.http.get(`${this.apiHostUrl}/get-drip-by-drip-id/${dripId}`).pipe(
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

	getLearnerGroupByUserId(userId, clientId, roleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-by-user-id?userId=${userId}&clientId=${clientId}&roleId=${roleId}&page=1&limit=250`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getOnlyLearnerGroupByUserId(userId, clientId, roleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-by-user-id-for-campaign?userId=${userId}&clientId=${clientId}&roleId=${roleId}&page=1&limit=250`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getOnlyLearnerGroupByUserIdForTestingFlow(userId, clientId, roleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-by-user-id-for-campaign?userId=${userId}&clientId=${clientId}&roleId=${roleId}&page=1&limit=250&forCampaignTest=true`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	transferDripFlowToUser(payload) {
		return this.http.post(`${this.apiHostUrl}/transefer-drip-flow-to-user`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCustomFieldsByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-custom-field-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkTagsIsUseOrNotInConversationalFlow(payload, clientId) {
		return this.http.post(`${this.apiHostUrl}/check-reserve-tags/${clientId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	testDripFlow(payload) {
		return this.http.post(`${this.apiHostUrl}/test-drip-flow`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
