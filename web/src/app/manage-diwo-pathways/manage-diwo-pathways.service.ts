import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManagetDiwoPathwaysService {
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

	getAllDiwoPathways(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-diwo-pathway-by-clientId?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchDiwoPathway(clientId, payload, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/${clientId}/search/diwopathway?page=${page}&limit=${limit}`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	createDiwoPathway(data) {
		return this.http.post(`${this.apiHostUrl}/create-diwo-pathway`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDiwoPathway(data) {
		return this.http.post(`${this.apiHostUrl}/update-diwo-pathway`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deletePathways(clientId, tempId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-diwo-pathway`, tempId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPathwayByPathwayId(pathwayId) {
		return this.http.get(`${this.apiHostUrl}/${pathwayId}/get-diwo-pathway-by-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// ---------------------------AddEdit ----------

	getCustomFieldsByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-custom-field-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCourseListForPathway(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-diwo-courses-for-pathway`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllModuleListForPathway(courseId) {
		return this.http.get(`${this.apiHostUrl}/${courseId}/get-diwo-module-for-pathway-by-courseId`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadPathwayThumbnail(data) {
		return this.http.post(`${this.apiHostUrl}/upload-diwo-pathway-thumbnail`, data).pipe(
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
		return this.http.get(`${this.apiHostUrl}/get-certificate-module-by-module-id/${clientId}/${moduletype}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
