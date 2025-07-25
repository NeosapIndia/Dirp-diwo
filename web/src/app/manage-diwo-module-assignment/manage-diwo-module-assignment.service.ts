import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManagetDiwoAssignmentService {
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

	//get Module Deatils for assingment
	getModuleByIdForAssignment(moduleId) {
		return this.http.get(`${this.apiHostUrl}/${moduleId}/get-diwo-module-by-id-for-assignment`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//get Module Deatils for assingment
	getModuleAssignmentList(moduleId, page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-diwo-assignment-list?moduleId=${moduleId}&page=${page}&limit=${limit}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getLearnerGroupForWorkbookByUserId(userId, clientId, roleId) {
		return this.http
			.get(`${this.apiHostUrl}/get-learner-group-for-assignment?userId=${userId}&clientId=${clientId}&roleId=${roleId}`)
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

	createDiwoModuleAssignment(moduleId, data) {
		return this.http.post(`${this.apiHostUrl}/${moduleId}/Module/create-diwo-assignment`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDiwoModuleAssignment(AssignmentId, ModuleId, data) {
		return this.http.post(`${this.apiHostUrl}/${AssignmentId}/${ModuleId}/Module/update-diwo-assignment`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDiwoAssimentByAssignmentId(AssignmentId) {
		return this.http.get(`${this.apiHostUrl}/${AssignmentId}/get-diwo-assignment-by-assignmentId`).pipe(
			map((data) => {
				return data;
			})
		);
	}
	deleteAssignment(assignmentId) {
		let payload = {
			assignmentId: assignmentId,
		};
		return this.http.put(`${this.apiHostUrl}/delete-assignment`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
