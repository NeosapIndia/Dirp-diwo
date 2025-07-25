import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class DiwoAnalyticsChartService {
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

	getDiwoFilterListData() {
		return this.http.get(`${this.apiHostUrl}/get-diwo-filtered-list-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDiwoFilterAssignmentIdsListData(type) {
		return this.http.get(`${this.apiHostUrl}/${type}/get-diwo-filtered-assignmentIds-list-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDiwoAnalyticsData(payload) {
		return this.http.post(`${this.apiHostUrl}/get-diwo-analytics-data`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
