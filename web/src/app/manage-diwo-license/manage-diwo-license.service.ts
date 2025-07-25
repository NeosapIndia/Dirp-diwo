import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageDiwoLicenseService {
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

	getAllClientWithoutLicenseById(parentClientId) {
		return this.http
			.get(`${this.apiHostUrl}/${parentClientId}/get-all-client-without-License-by-id?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllClientWithLicenseById(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-client-for-dropdowns?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createLicence(data) {
		return this.http.post(`${this.apiHostUrl}/create-license`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateLicence(ClientId, data) {
		return this.http.post(`${this.apiHostUrl}/update-license/${ClientId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllClientWithLicense(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-client-with-license?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSingleClientbyClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-single-client-by-id?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	suspendClient(ClientId) {
		return this.http.delete(`${this.apiHostUrl}/suspend-client/${ClientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	activateSuspendClient(ClientId) {
		return this.http.delete(`${this.apiHostUrl}/active-client/${ClientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientViewSubscriptionById(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-client-view-subscription-by-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getFilteredLicense(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/license?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
