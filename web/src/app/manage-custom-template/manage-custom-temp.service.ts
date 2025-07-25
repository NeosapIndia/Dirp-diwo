import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ManageCustomTempService {
	vimeoObsShare: Observable<string>;
	vimeoResult: string;
	private vimeoLink = new BehaviorSubject('');
	vimeoLinkObs = this.vimeoLink.asObservable();

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

	saveCustomTemplate(payload, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-custom-template`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateCustomTemplate(payload, editTemplateId) {
		return this.http.post(`${this.apiHostUrl}/update-custom-template/${editTemplateId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCustomTemplateDetails(clientId, page, limit) {
		return this.http
			.get(
				`${this.apiHostUrl}/${clientId}/get-all-custom-template-using-clientId?page=${page}&limit=${limit}&type=${this.type}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	deleteCustomTemplate(clientId, tempId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-custom-template`, tempId).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
