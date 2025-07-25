import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ManageAddEditWorkbookService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
	apiHostUrl: string;
	type: string = null;

	vimeoObsShare: Observable<string>;
	vimeoResult: string;

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

	uploadDiwoMedia(data) {
		return this.http.post(`${this.apiHostUrl}/upload-diwo-asset`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	convertPDFToImages(data) {
		return this.http.post(`${this.apiHostUrl}/convert-pdf-to-image`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createWorkbook(data, clientId) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/create-workbook`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateWorkbook(data, clientId, workbookId) {
		return this.http.put(`${this.apiHostUrl}/${clientId}/update-workbook/${workbookId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteWorkbookByClient(workbookId, clientId) {
		return this.http.delete(`${this.apiHostUrl}/${clientId}/delete-workbook/${workbookId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWorkbookById(clientId, workbookId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-workbook-by-id/${workbookId}`).pipe(
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

	getLearnerGroupByUserId(userId, clientId, roleId) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-all-learner-user-group-by-user-id?userId=${userId}&clientId=${clientId}&roleId=${roleId}`
			)
			.pipe(
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

	uploadVideoOnMediaCMS(data: FormData, clientId: number): Observable<HttpEvent<any>> {
		return this.http.post<any>(`${this.apiHostUrl}/${clientId}/upload-diwo-video-on-mediacms`, data, {
			reportProgress: true,
			observe: 'events',
		});
	}
	canUploadVideoOnMediaCMS() {
		return this.http.post(`${this.apiHostUrl}/check-video-can-upload-or-not`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	MoveAssetToFolder(vimeoVideoId, clientId) {
		return this.http.get(`${this.apiHostUrl}/${vimeoVideoId}/move-vimeo-video-to-folder/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCourseList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-course-list-by-client-id-for-workbook`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// createCourse(clientId, payload) {
	// 	return this.http.post(`${this.apiHostUrl}/${clientId}/create-course`, payload).pipe(
	// 		map((data) => {
	// 			return data;
	// 		})
	// 	);
	// }

	getAllClientAndBranchAccountList(clientId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/get-all-sub-client-and-branch-account-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkVimeoVideoTranscodingStatus(videoId, options) {
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		return this.http
			.get(`https://api.vimeo.com/videos/${videoId}?fields=uri,upload.status,transcode.status`, {
				headers: initHeaders,
			})
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	checkMediaCMSVideoTranscodingStatus(payload) {
		return this.http.post(`${this.apiHostUrl}/check-diwo-mediaCMS-transcoding-status`, payload).pipe(
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

	logoutGoogleAccount() {
		return this.http.post(`${this.apiHostUrl}/logout-google-drive-account`, null).pipe(
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

	bulkUploadWorksheet(data, moduleType) {
		return this.http.post(`${this.apiHostUrl}/create-worksheet-in-bulk/${moduleType}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	// ---------------------------MOdules-----------------------
	getAllModulesTypes() {
		return this.http.get(`${this.apiHostUrl}/get-all-diwo-modules-type-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllBadgeAndCertificate() {
		return this.http.get(`${this.apiHostUrl}/get-all-badges-and-certifications-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getGuideList() {
		return this.http.post(`${this.apiHostUrl}/get-guide-list`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
