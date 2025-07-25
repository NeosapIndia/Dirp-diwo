import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManagetDiwoCoursesService {
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

	getAllDiwoCourses(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-diwo-coures-using-clientId?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchDiwoCourses(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/diwocourse?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createDiwoCourse(data) {
		return this.http.post(`${this.apiHostUrl}/create-diwo-course`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDiwoCourse(data) {
		return this.http.post(`${this.apiHostUrl}/update-diwo-course`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCourseByCourseId(courseId) {
		return this.http.get(`${this.apiHostUrl}/${courseId}/get-diwo-course-by-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllModulesTypes() {
		return this.http.get(`${this.apiHostUrl}/get-all-diwo-modules-type-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllModulesByModuleType(clientId, moduletype) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/${moduletype}/get-all-module-list-by-module-type`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCertificateModulesByModuleType(clientId, moduletype) {
		return this.http.get(`${this.apiHostUrl}/get-certificate-module-by-module-id/${clientId}/${moduletype}`).pipe(
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

	uploadAvatar(data) {
		return this.http.post(`${this.apiHostUrl}/upload-diwo-course-avatar`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteCourse(clientId, tempId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-diwo-courses`, tempId).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
