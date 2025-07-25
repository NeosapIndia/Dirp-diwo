import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageUserService {
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
	getUser(userId) {
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

	saveUser(data) {
		return this.http.post(`${this.apiHostUrl}/users`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	saveUserByAdmin(data) {
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

	updateUser(data) {
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
		return this.http.put(`${this.apiHostUrl}/web/users?raise=${raise}&approver=${this.approverRole}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateAdminUser(userId, data) {
		return this.http.put(`${this.apiHostUrl}/update-user/${userId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateUserProfilePic(userId, data) {
		return this.http.post(`${this.apiHostUrl}/users/${userId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateChildProfilePic(childId, data) {
		return this.http.post(`${this.apiHostUrl}/child/${childId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUsers(page, limit, market) {
		return this.http.get(`${this.apiHostUrl}/users?page=` + page + '&limit=' + limit + '&market=' + market).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteUser(userId) {
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
		return this.http
			.delete(`${this.apiHostUrl}/users/` + userId + `?raise=${raise}&approver=${this.approverRole}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseDeleteUser(userId) {
		let raise = false;
		return this.http
			.delete(`${this.apiHostUrl}/users/` + userId + `?raise=${raise}&approver=${this.approverRole}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	suspendUser(userId, status) {
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

	/*CHILD APIS*/

	saveChild(userId, data) {
		let is_Premium = localStorage.getItem('is_Premium') == 'true' ? true : false;
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

		return this.http
			.post(
				`${this.apiHostUrl}/web/users/${userId}/child` +
					`?raise=${raise}&approver=${this.approverRole}&is_Premium=${is_Premium}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseSaveChild(userId, data) {
		let is_Premium = localStorage.getItem('is_Premium') == 'true' ? true : false;
		let raise = false;

		return this.http
			.post(
				`${this.apiHostUrl}/web/users/${userId}/child` +
					`?raise=${raise}&approver=${this.approverRole}&is_Premium=${is_Premium}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	updateChild(userId, childId, data) {
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
		return this.http
			.put(
				`${this.apiHostUrl}/web/users/${userId}/child/${childId}` + `?raise=${raise}&approver=${this.approverRole}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseUpdateChild(userId, childId, data) {
		let raise = false;
		return this.http
			.put(
				`${this.apiHostUrl}/web/users/${userId}/child/${childId}` + `?raise=${raise}&approver=${this.approverRole}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getChilds(userId) {
		return this.http.get(`${this.apiHostUrl}/users/${userId}/children`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	assignPackageToChild(data) {
		return this.http.put(`${this.apiHostUrl}/child/${data.childId}/package`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	removeResevedPackageFromBaby(data) {
		return this.http.post(`${this.apiHostUrl}/child/remove/reserved/package`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	removeAssignPackageFromBaby(data) {
		return this.http.post(`${this.apiHostUrl}/child/remove/package`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	assignPackageToBaby(data) {
		return this.http.post(`${this.apiHostUrl}/child/assign/package`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteChild(childId, userId) {
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
		return this.http
			.delete(
				`${this.apiHostUrl}/child/${childId}` + `?userId=${userId}` + `&raise=${raise}&approver=${this.approverRole}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseDeleteChild(childId, userId) {
		let raise = false;
		return this.http
			.delete(
				`${this.apiHostUrl}/child/${childId}` + `?userId=${userId}` + `&raise=${raise}&approver=${this.approverRole}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	/*CHILD APIS END */

	/*CAAREGIVER APIS END */

	saveCaregiver(userId, data) {
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
		return this.http
			.post(`${this.apiHostUrl}/web/users/${userId}/caregiver` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseSaveCaregiver(userId, data) {
		let raise = false;
		return this.http
			.post(`${this.apiHostUrl}/web/users/${userId}/caregiver` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	updateCaregiver(childId, data) {
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
		return this.http
			.put(`${this.apiHostUrl}/caregivers/${childId}` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseUpdateCaregiver(childId, data) {
		let raise = false;
		return this.http
			.put(`${this.apiHostUrl}/caregivers/${childId}` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllCaregiver() {
		return this.http.get(`${this.apiHostUrl}/caregivers`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteCaregiver(caregiverId) {
		return this.http.delete(`${this.apiHostUrl}/caregivers/` + caregiverId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	/*CAAREGIVER APIS END */

	/*Exposure Question  */
	saveQuestion(data) {
		return this.http.post(`${this.apiHostUrl}/calculate/child/exposure`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAddress(userId) {
		return this.http.get(`${this.apiHostUrl}/user/${userId}/address`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCertificationData(userId) {
		return this.http.get(`${this.apiHostUrl}/get/certification/${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateTemprefresher(childId) {
		return this.http.get(`${this.apiHostUrl}/tempref/${childId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updatepermrefresher(childId, flage) {
		return this.http.get(`${this.apiHostUrl}/permanentRefresher/${childId}/${flage}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	saveAddress(userId, data) {
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
		return this.http
			.post(`${this.apiHostUrl}/user/${userId}/address` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	saveGiftedUserAddress(userId, data) {
		return this.http.post(`${this.apiHostUrl}/gift-user/${userId}/address`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	raiseSaveAddress(userId, data) {
		let raise = false;

		return this.http
			.post(`${this.apiHostUrl}/user/${userId}/address` + `?raise=${raise}&approver=${this.approverRole}`, data)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	updateAddress(userId, addressid, data) {
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
		return this.http
			.put(
				`${this.apiHostUrl}/user/${userId}/address/${addressid}` + `?raise=${raise}&approver=${this.approverRole}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	raiseUpdateAddress(userId, addressid, data) {
		let raise = false;

		return this.http
			.put(
				`${this.apiHostUrl}/user/${userId}/address/${addressid}` + `?raise=${raise}&approver=${this.approverRole}`,
				data
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}
	deleteAddress(userId, addressid) {
		return this.http.delete(`${this.apiHostUrl}/user/${userId}/address/${addressid}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateGraduatuon(data) {
		return this.http.put(`${this.apiHostUrl}/users/graduation`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchUsers(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/admin-user?page=${page}&limit=${limit}`, payload).pipe(
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

	changePolicyOfallUser(userId, marketName, uploadData) {
		uploadData.mac_address = this.mac_address;
		return this.http.post(`${this.apiHostUrl}/change-policy-of-all-user/${userId}/${marketName}`, uploadData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	changePolicyOfUser(userId, ip_address) {
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

	getClientAllUsers(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-admin-user-by-client?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientAllUsersForEdit(client) {
		return this.http.get(`${this.apiHostUrl}/${client}/get-all-admin-user-by-client-for-edit`).pipe(
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

	createUser(userData) {
		return this.http.post(`${this.apiHostUrl}/create-user`, userData).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllRoles(roleId) {
		return this.http.get(`${this.apiHostUrl}/get-all-roles/${roleId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOneLevelDownUserRole(roleId) {
		let projectName = localStorage.getItem('projectName');
		if (!projectName) {
			let hostName = window.location.origin.toLowerCase();
			if (hostName.endsWith(environment.dripHostPlacholder)) {
				projectName = 'drip';
			} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
				projectName = 'diwo';
			}
		}

		return this.http.get(`${this.apiHostUrl}/get-one-level-down-role-list/${roleId}?projectName=${projectName}`).pipe(
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

	deleteAdminUser(userIds) {
		return this.http.put(`${this.apiHostUrl}/delete-admin-user`, userIds).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSingleUserByUserId(clientId, userId) {
		return this.http
			.get(`${this.apiHostUrl}/get-single-user-data-by-user-id/${clientId}/${userId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	//Add Learner as a Admin User
	getLearnerDataForAdminUser(learnerId) {
		return this.http.get(`${this.apiHostUrl}/get-learner-data-by-learner-id-for-adminUser/${learnerId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
