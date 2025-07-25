import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ManageAgentsService {
	apiHostUrl: string;
	type: string = null;

	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';

	vimeoObsShare: Observable<string>;
	vimeoResult: string;

	private vimeoLink = new BehaviorSubject('');
	vimeoLinkObs = this.vimeoLink.asObservable();

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

	getAllClientWithoutAgentById(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-client-name-list-of-without-agent/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllChildClientNotHaveWhatsAppSetup(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-child-client-list-not-have-whatsapp-setup/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllWhatsAppSetupById(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-client-for-dropdowns`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createAgent(data) {
		return this.http.post(`${this.apiHostUrl}/create-agent`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllETLChoice(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-etl-choice/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientListOfWithoutETlConfi(clientId) {
		return this.http
			.get(`${this.apiHostUrl}/get-client-name-list-of-without-etl-config/${clientId}?type=${this.type}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	createUpdateETLCredential(payload) {
		return this.http.post(`${this.apiHostUrl}/create-update-etl-credential`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateAgent(data, whatsAppSetupId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-agent/${whatsAppSetupId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllWhatsAppSetup(clientId, page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-whatsapp-setup/${clientId}/${this.type}?page=${page}&limit=${limit}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAgentById(agentId) {
		return this.http.get(`${this.apiHostUrl}/get-agent-by-id/${agentId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteWhatsAppSetup(whstaAppSetupId) {
		return this.http.delete(`${this.apiHostUrl}/delete-whatsapp-setup/${whstaAppSetupId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	activateSuspendClient(ClientId) {
		return this.http.delete(`${this.apiHostUrl}/active-client/${ClientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getClientViewSubscriptionById(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-client-view-subscription-by-id}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getFilteredLicense(searchKey) {
		return this.http.get(`${this.apiHostUrl}/search/license/${searchKey}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchWhatsAppSetup(clientId, payload, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/${clientId}/search/whatsAppsetup?page=${page}&limit=${limit}`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}
	createWhatsAppOTPTemplate(clientId) {
		return this.http.get(`${this.apiHostUrl}/create-whatsapp-template-for-otp/${clientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadAsset(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/upload-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createAsset(data, clientId, count) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-asset?count=${count}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateAsset(data, assetId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-asset/${assetId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAssetByAssetId(assetId) {
		return this.http.get(`${this.apiHostUrl}/get-asset-by-asset-id/${assetId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllAgents(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-agents?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllAssetsByBuyerForPost(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-asset-by-client-for-post`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllAssetsByType(clientId, type) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-asset-by-type/${type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllAssetsByTypeFromGooleDrive(payload) {
		return this.http.post(`${this.apiHostUrl}/get-google-drive-asset-list`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteAgents(assetId) {
		return this.http.put(`${this.apiHostUrl}/delete-agent`, assetId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadAssetByAssetId(payload) {
		return this.http.post(`${this.apiHostUrl}/download-file`, payload, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getFilteredAssets(clientId, payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/search/assets?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//////////////////////////------------vimeo -----------//////////////////

	updateVimeoLink(val) {
		this.vimeoLink.next(val);
	}

	updateVimeo;

	createVimeo(options, fileSize): Observable<any> {
		// CUSTOM HEADERS FOR A FIRST INIT CALL
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		// CUSTOM INIT BODY
		const initBody = {
			upload: {
				approach: 'tus',
				size: fileSize,
			},
			name: options.videoName,
			description: options.videoDescription,
		};
		if (this.vimeoResult) {
			return new Observable<any>((observer) => {
				observer.next(this.vimeoResult);
				observer.complete();
			});
		} else if (this.vimeoObsShare) {
			return this.vimeoObsShare;
		} else {
			return this.http.post(options.url, initBody, { headers: initHeaders });
		}
	}

	applyEmbedPreset(options): Observable<any> {
		// CUSTOM HEADERS FOR A FIRST INIT CALL
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		// CUSTOM INIT BODY
		if (options && options.presetId) {
			return this.http
				.put(`${options.url}/${options.videoId}/presets/${options.presetId}`, null, { headers: initHeaders })
				.pipe(
					map((data) => {
						return data;
					})
				);
		}
		return;
	}

	vimeoUpload(url, file: File): Observable<HttpEvent<any>> {
		const headers = new HttpHeaders({
			'Tus-Resumable': '1.0.0',
			'Upload-Offset': '0',
			'Content-Type': 'application/offset+octet-stream',
		});
		const params = new HttpParams();
		const options = {
			params: params,
			reportProgress: true,
			headers: headers,
		};
		const req = new HttpRequest('PATCH', url, file, options);
		return this.http.request(req);
	}

	getvimeoToken(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/assets/get-vimeo-token`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllAssetsSearchByType(clientId, type, searchKey) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-search-asset-by-type/${type}/${searchKey}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllClientAndBranchAccountList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-sub-client-and-branch-account-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createAssistant(payload) {
		return this.http.post(`${this.apiHostUrl}/create-assistant-and-get-id`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateAssistant(payload) {
		return this.http.post(`${this.apiHostUrl}/update-assistant`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAssistantDetailsAndAllVersion(payload) {
		return this.http.post(`${this.apiHostUrl}/get-assistant-details-and-all-version`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	setDefaultAssistantVersion(payload) {
		return this.http.post(`${this.apiHostUrl}/set-default-assistant-version`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
