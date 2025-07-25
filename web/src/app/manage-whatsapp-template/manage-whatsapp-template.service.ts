import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class WhatsAppTemplateService {
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index = this.restricted_roles.indexOf(this.user_role);
	raise = false;
	approverRole = 'Super Admin';
	apiHostUrl: string;

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
			this.apiHostUrl = hostName + '/v1';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
	}

	getWhatsAppTemplate(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-whatsapp-template?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateWhatsAppTemplateStatus(dripId, data) {
		return this.http.put(`${this.apiHostUrl}/update-whatsapp-template-status/${dripId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchWhatsAppTemplate(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/whatsApptemplate?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
