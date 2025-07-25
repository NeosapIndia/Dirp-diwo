import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ManageDocumentLibraryService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
	apiHostUrl: string;

	vimeoObsShare: Observable<string>;
	vimeoResult: string;

	type: string = null;

	private vimeoLink = new BehaviorSubject('');
	vimeoLinkObs = this.vimeoLink.asObservable();

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

	uploadAsset(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/upload-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createDocument(data, clientId, count) {
		return this.http.post(`${this.apiHostUrl}/create-document`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateDocument(data, documentId, clientId) {
		return this.http.post(`${this.apiHostUrl}/update-document/${documentId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDocumentById(documentId) {
		return this.http.get(`${this.apiHostUrl}/get-document-by-id/${documentId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllDocumentByClientId(clientId, page, limit) {
		return this.http
			.get(`${this.apiHostUrl}/get-all-document-by-using-client-id/${clientId}?page=${page}&limit=${limit}`)
			.pipe(
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

	deleteDocumentsByBuyer(assetId, clientId) {
		return this.http.post(`${this.apiHostUrl}/delete-document`, assetId).pipe(
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

	getFilteredDocuments(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/documents?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPreSignedUrl(payload) {
		return this.http.post(`${this.apiHostUrl}/generate-presigned-url`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadFileToS3(url: string, file: File) {
		const headers = new HttpHeaders({
			'Content-Type': file.type,
		});

		return this.http.put(url, file, {
			headers: headers,
		});
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

	getCustomFieldByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-document-custom-field/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPreSignedUrlForDownload(payload) {
		return this.http.post(`${this.apiHostUrl}/generate-presigned-urls-for-download`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadAwsS3File(url) {
		return this.http.get(url, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
