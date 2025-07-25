import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
	providedIn: 'root',
})
export class ManagePostsLibraryService {
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

	uploadPost(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/upload-post`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createDrip(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-post`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDrip(data, clientId, dripId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-drip/${dripId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPostsByClient(clientId, page, limit) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-post-by-client?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPostsByClientForPost(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-post-by-client-for-post`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPostsByClientForUseExsitingPost(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-post-by-client-for-use-exsiting-post`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllDripsByClientForUseExsitingPost(clientId, templateType) {
		return this.http
			.get(`${this.apiHostUrl}/${clientId}/get-all-drip-by-client-for-use-exsiting-drip/${templateType}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}
	deletePostsByClient(postId, clientId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/delete-post`, postId).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPostsByClientAndPostType(clientId, postType, isChannelFlow) {
		return this.http
			.get(
				`${this.apiHostUrl}/${clientId}/get-all-post-by-client-and-post-type/${postType}?isChannelFlow=${isChannelFlow}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getDripByDripId(dripId) {
		return this.http.get(`${this.apiHostUrl}/get-drip-by-drip-id/${dripId}`).pipe(
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

	uploadDripMedia(data) {
		return this.http.post(`${this.apiHostUrl}/upload-drip-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadAndCreateAsset(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/upload-and-create-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createAsset(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDripBySearch(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/drip?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppSetupByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-whatsapp-setup-and-team-setup-by-client-id`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkTemplateName(templateName, clientId) {
		return this.http.get(`${this.apiHostUrl}/check-template-name/${clientId}/${templateName}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkDripIsUsedOrNot(payload) {
		return this.http.post(`${this.apiHostUrl}/check-drip-is-used-or-not`, payload).pipe(
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

	getvimeoToken(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/assets/get-vimeo-token`).pipe(
			map((data) => {
				return data;
			})
		);
	}

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

	applyEmbedPreset(options): Observable<any> {
		// CUSTOM HEADERS FOR A FIRST INIT CALL
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		// CUSTOM INIT BODY

		return this.http
			.put(`${options.url}/${options.videoId}/presets/${options.presetId}`, null, { headers: initHeaders })
			.pipe(
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

	getLoginToGoogleApi() {
		return this.http.get(`${this.apiHostUrl}/auth/google`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkAddDonwloadAssetFormGoogleDrive(payload) {
		return this.http.post(`${this.apiHostUrl}/check-and-download-from-google-drive`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	logoutGoogleAccount() {
		return this.http.post(`${this.apiHostUrl}/logout-google-drive-account`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPWABackButtonByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-pwa-back-button-by-clientId`).pipe(
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

	getZoomMeetingsByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-zoom-meetings/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkZoomMeetingData(payload, clientId) {
		return this.http.post(`${this.apiHostUrl}/check-zoom-meeting-list-data/${clientId}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createEmailAssetOnBroadSide(payload) {
		return this.http.post(`${this.apiHostUrl}/create-email-asset-on-broadside`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllOneDriveFileForTeamsByType(type) {
		return this.http.get(`${this.apiHostUrl}/get-all-onedrive-files-for-teams/${type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCustomTemplatesByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-custom-template-by-clientId`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCustomTemplateDetailsByUsingTempId(tempId) {
		return this.http.get(`${this.apiHostUrl}/${tempId}/get-custom-template-using-tempId`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadVideoOnMediaCMS(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/upload-video-on-mediacms`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}
	canUploadVideoOnMediaCMS() {
		return this.http.post(`${this.apiHostUrl}/check-video-can-upload-or-not`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
