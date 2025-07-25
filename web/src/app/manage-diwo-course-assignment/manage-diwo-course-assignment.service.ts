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

	//get Course Deatils for assingment
	getCourseByIdForAssignment(courseId) {
		return this.http.get(`${this.apiHostUrl}/${courseId}/get-diwo-course-by-id-for-assignment`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//get Course List for assingment
	getCourseAssignmentList(courseId, page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-diwo-assignment-list?courseId=${courseId}&page=${page}&limit=${limit}`)
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

	createDiwoCourseAssignment(courseId, data) {
		return this.http.post(`${this.apiHostUrl}/${courseId}/Course/create-diwo-assignment`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDiwoCourseAssignment(AssignmentId, CourseId, data) {
		return this.http.post(`${this.apiHostUrl}/${AssignmentId}/${CourseId}/Course/update-diwo-assignment`, data).pipe(
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

	upgradeCourseAssignment(payload) {
		return this.http.post(`${this.apiHostUrl}/upgrade-diwo-course-assignments`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
