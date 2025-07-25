import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageLearnerService {
	restricted_roles = ['Super Admin', 'Admin'];
	approverRole = 'Global Super Admin';
	ip_address: string;
	mac_address: string;
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
	getLearner(userId) {
		let usertype = false;
		if (
			localStorage.getItem('role') != 'Customer' &&
			localStorage.getItem('role') != 'Care Giver' &&
			localStorage.getItem('role') != 'null' &&
			localStorage.getItem('role') != null
		) {
			usertype = true;
		}
		return this.http.get(`${this.apiHostUrl}/web/users/${userId}?adminRole=${usertype}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	saveLearner(data) {
		return this.http.post(`${this.apiHostUrl}/users`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	saveLearnerByAdmin(data) {
		let user_role;
		if (localStorage.getItem('role')) {
			user_role = localStorage.getItem('role');
		}
		if (!user_role) {
			user_role = localStorage.getItem('adminrole');
		}
		let index = this.restricted_roles.indexOf(user_role);
		let raise = false;
		if (index >= 0) {
			raise = true;
		}
		return this.http.post(`${this.apiHostUrl}/usersbyadmin?raise=${raise}&approver=${this.approverRole}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// updateLearner(data) {
	//   let user_role
	//   if (localStorage.getItem("role")) {
	//     user_role = localStorage.getItem("role");
	//   }
	//   if (!user_role) {
	//     user_role = localStorage.getItem("adminrole");
	//   }
	//   let index = this.restricted_roles.indexOf(user_role);
	//   let raise = false;
	//   if (index >= 0) {
	//     raise = true;
	//   }
	//   return this.http.put(`${this.apiHostUrl}/web/users?raise=${raise}&approver=${this.approverRole}`, data)
	//     .pipe(map((data) => {
	//       return data;
	//     }));
	// }

	getLearners(page, limit, market) {
		return this.http.get(`${this.apiHostUrl}/users?page=` + page + '&limit=' + limit + '&market=' + market).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// deleteLearner(userId) {
	//   let user_role
	//   if (localStorage.getItem("role")) {
	//     user_role = localStorage.getItem("role");
	//   }
	//   if (!user_role) {
	//     user_role = localStorage.getItem("adminrole");
	//   }
	//   let index = this.restricted_roles.indexOf(user_role);
	//   let raise = false;
	//   if (index >= 0) {
	//     raise = true;
	//   }
	//   return this.http.delete(`${this.apiHostUrl}/users/` + userId + `?raise=${raise}&approver=${this.approverRole}`)
	//     .pipe(map((data) => {
	//       return data;
	//     }));
	// }

	raiseDeleteLearner(userId) {
		let raise = false;
		return this.http
			.delete(`${this.apiHostUrl}/users/` + userId + `?raise=${raise}&approver=${this.approverRole}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	suspendLearner(userId, status) {
		let user_role = localStorage.getItem('role');
		let index = this.restricted_roles.indexOf(user_role);
		let raise = false;
		if (index >= 0) {
			raise = true;
		}
		return this.http
			.put(
				`${this.apiHostUrl}/web/users/` +
					userId +
					'?status=' +
					status +
					'&raise=' +
					raise +
					'&approver=' +
					this.approverRole,
				{}
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	/*CHILD APIS END */

	getFilteredLearners(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/learner?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateSixMounthPackage() {
		return this.http.get(`${this.apiHostUrl}/get/six/mounth/package`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changePolicyOfallLearner(userId, marketName, uploadData) {
		uploadData.mac_address = this.mac_address;
		return this.http.post(`${this.apiHostUrl}/change-policy-of-all-user/${userId}/${marketName}`, uploadData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changePolicyOfLearner(userId, ip_address) {
		let payload = {
			ip_address: ip_address,
			mac_address: this.mac_address,
		};
		return this.http.post(`${this.apiHostUrl}/change-policy-of-user/${userId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getAllClientList() {
		return this.http.get(`${this.apiHostUrl}/get-all-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientAllLearners(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-learner-user-by-client?page=` + page + '&limit=' + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCountrys() {
		return this.http.get(`${this.apiHostUrl}/get-all-countries`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createLearner(learnerData) {
		return this.http.post(`${this.apiHostUrl}/create-learner-user`, learnerData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateLearner(learnerId, learnerData) {
		return this.http.put(`${this.apiHostUrl}/update-learner-user/${learnerId}`, learnerData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteLearner(learnerId, clientId) {
		return this.http.put(`${this.apiHostUrl}/delete-learner-user/${clientId}`, learnerId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createDripDiwoLearner(learnerId, clientId) {
		return this.http.put(`${this.apiHostUrl}/create-drip-diwo-learner-user/${clientId}`, learnerId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	archiveLearner(data, btnstatus, clientId) {
		return this.http.put(`${this.apiHostUrl}/archive-learner-user/${btnstatus}/${clientId}`, data).pipe(
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

	getCustomFieldsByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-custom-field-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
	getLearnerCountRestrict(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-restrict-learner-subscription`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkUploadLearnerData(roleId, userId, clientId) {
		return this.http.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/learner/check-uploaded-learner-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUploadLearnerData(roleId, userId, clientId) {
		return this.http
			.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/learner/download-uploaded-learner-data`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getWhatsAppSetupByclientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/client-whats-app-setup-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	moveLearnerToBranchAccount(data, branchAccId, clientId) {
		// return this.http.get(`${this.apiHostUrl}/move-learner-user-update/${learnerId}/${branchAccId}`).pipe(map((data) => {
		//   return data;
		// }))

		return this.http.put(`${this.apiHostUrl}/move-learner-user-update/${branchAccId}/${clientId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	optinSelectedUser(users) {
		return this.http.put(`${this.apiHostUrl}/opt-in-selected-user`, users).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkWhatsAppSetup(payload) {
		return this.http.post(`${this.apiHostUrl}/check-client-whatsapp-setup-is-present-or-not`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadallLearners(page, limit) {
		return this.http.get(`${this.apiHostUrl}/download-all-learner-user-by-client?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadUploadTemplate() {
		return this.http.get(`${this.apiHostUrl}/dowload-learner-upload-template`, { responseType: 'blob' }).pipe(
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

	getLearnerGroupByLearnerId(userId, clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-user-group-for-learner-update/${userId}`).pipe(
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

	checkAndGetTeamUserIdByUsingEmail(payload) {
		return this.http.post(`${this.apiHostUrl}/get-team-user-id-by-using-client-id`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	teamSync(payload) {
		return this.http.post(`${this.apiHostUrl}/microsoft-team-sync`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkPreviousLearnerUploadStatus() {
		return this.http.get(`${this.apiHostUrl}/check-previous-learner-upload-process-status`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	resetLearnerLockOut(payload) {
		return this.http.post(`${this.apiHostUrl}/reset-learner-lockout-flag`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
