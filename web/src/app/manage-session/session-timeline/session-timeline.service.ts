import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class SessionTimelineService {
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	user_role = localStorage.getItem('role');
	raise = false;
	approvedByGlobalSuperAdmin = ['Super Admin', 'Admin'];
	approvedBySuperAdmin = ['Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	approverRole = 'Global Super Admin';
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

	getSessionWorksheets(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-worksheet-of-session-by-id/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionDetails(code) {
		return this.http.get(`${this.apiHostUrl}/get-session-by-code/${code}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkPassword(data) {
		return this.http.post(`${this.apiHostUrl}/check-session-password`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionById(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-by-id/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getParticipantList(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-participant-list/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionAllUsersAllData(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-session-all-detail/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTrainerSessionUserId(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-trainer-session-user-id/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionCardData(sesisonId) {
		return this.http.get(`${this.apiHostUrl}/${sesisonId}/get-sesstion-data-by-using-session-id`).pipe(
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

	downloadSubmissionAssetByAssetId(payload, sessionCode) {
		return this.http
			.post(`${this.apiHostUrl}/download-all-files-in-zip-format/${sessionCode}`, payload, { responseType: 'blob' })
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getTrainerMasterSession(workbookId) {
		return this.http.get(`${this.apiHostUrl}/get-trainer-master-session/${workbookId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTrainerOnlyReport(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-trainer-only-session-report/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSessionWorksheetLearnerResponse(payload, page, limit) {
		return this.http
			.post(`${this.apiHostUrl}/get-session-worksheet-learner-response-data?page=${page}&limit=${limit}`, payload)
			.pipe(
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

	getSessionOfflineTaskData(sessionId, index) {
		return this.http.get(`${this.apiHostUrl}/get-session-offline-task-data/${sessionId}/${index}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateOfflineGrade(payload) {
		return this.http.post(`${this.apiHostUrl}/update-offline-task-grade`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPassedUserData(sessionId) {
		return this.http.get(`${this.apiHostUrl}/get-all-data-user-how-passed-in-this-session/${sessionId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	confirmPassedUserData(sessionId) {
		return this.http.get(`${this.apiHostUrl}/update-passing-learner-data-by-using-session-id/${sessionId}`).pipe(
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

	addRecordedSessionLink(data) {
		return this.http.post(`${this.apiHostUrl}/add-recorded-session-link`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	unlockQuizreAttemptsOfLearner(data) {
		return this.http.post(`${this.apiHostUrl}/unlock-learner-quiz-reattempts`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
