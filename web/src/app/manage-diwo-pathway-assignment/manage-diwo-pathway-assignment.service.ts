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

	//get pathway Deatils for assingment
	getPathwayByIdForAssignment(pathwayId) {
		return this.http.get(`${this.apiHostUrl}/${pathwayId}/get-diwo-pathway-by-id-for-assignment`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//get pathway Deatils for assingment
	getPathwayAssignmentList(pathwayId, page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-diwo-assignment-list?pathwayId=${pathwayId}&page=${page}&limit=${limit}`)
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

	createDiwoPathwayAssignment(pathwayId, data) {
		return this.http.post(`${this.apiHostUrl}/${pathwayId}/Pathway/create-diwo-assignment`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDiwoPathwayAssignment(AssignmentId, pathwayId, data) {
		return this.http.post(`${this.apiHostUrl}/${AssignmentId}/${pathwayId}/Pathway/update-diwo-assignment`, data).pipe(
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

	upgradePathwayAssignment(payload) {
		return this.http.post(`${this.apiHostUrl}/upgrade-diwo-pathway-assignments`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
