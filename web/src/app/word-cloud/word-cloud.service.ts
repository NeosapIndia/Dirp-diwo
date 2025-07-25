import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class WordCloudService {
	apiHostUrl: string;

	constructor(private http: HttpClient) {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
	}

	getSessionAllUsersAllData(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-all-detail/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
