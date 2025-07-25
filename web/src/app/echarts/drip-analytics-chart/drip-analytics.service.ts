import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class DripAnalyticsChartService {
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

	getAllCount(ClientId) {
		return this.http.get(`${this.apiHostUrl}/get-all-drip-anylysis-count/${ClientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCampaign(ClientId) {
		return this.http.get(`${this.apiHostUrl}/${ClientId}/get-all-campaign-and-account-list-for-analytics`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCampaignDripTitle(payload) {
		return this.http.post(`${this.apiHostUrl}/get-drip-analytics-data-by-using-campaign-id`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllCampaignDripGraphData(campaignId) {
		return this.http
			.get(`${this.apiHostUrl}/${campaignId}/get-all-drip-camp--graph-data-by-campaign-for-analytics`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllDripActivity(ClientId, Months, type) {
		return this.http.get(`${this.apiHostUrl}/${ClientId}/${Months}/${type}/get-all-drip-activity-for-analytics`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getEmailReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-email-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppOPTINReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-opt-in-delivery-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getBotMessageReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-bot-message-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOnlyWhatsAppReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-only-whats-app-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getWhatsAppWithdripReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-with-drip-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getEmailWithdripReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-email-with-drip-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOnlyDripAppReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-only-drip-app-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSingleDripDataOfCampaign(payload) {
		return this.http.post(`${this.apiHostUrl}/get-campaign-drip-analytic-data`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllQuizDataForReport(payload) {
		return this.http
			.post(`${this.apiHostUrl}/get-quiz-drip-analytics-data-by-using-campaign-id-drip-camp-index`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllSuervyDataForReport(payload) {
		return this.http
			.post(`${this.apiHostUrl}/get-survey-report-data-by-using-campaign-id-drip-camp-index`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getAllPollDataForReport(payload) {
		return this.http.post(`${this.apiHostUrl}/get-poll-report-data-by-using-campaign-id-drip-camp-index`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPollGrapgData(payload) {
		return this.http.post(`${this.apiHostUrl}/get-poll-graph-data-by-using-campaign-id-drip-camp-index`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadLearnerUploadedSurvey(payload) {
		return this.http
			.post(`${this.apiHostUrl}/get-survey-uploaded-data-by-user-in-zip-format`, payload, { responseType: 'blob' })
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getTopperUserData(payload) {
		return this.http.post(`${this.apiHostUrl}/get-topper-user-data`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllSubClientList(parentClient) {
		return this.http.get(`${this.apiHostUrl}/${parentClient}/get-all-sub-client-and-branch-account-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOfflineTaskAllDataFor(payload, limit, page) {
		return this.http.post(`${this.apiHostUrl}/get-offline-task-data?limit=${limit}&page=${page}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getOfflineTaskAllDataForReport(payload) {
		return this.http
			.post(`${this.apiHostUrl}/get-offline-task-report-data-by-using-campaign-id-drip-camp-index`, payload)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getOnlyWhatsAppReportDownload(payload) {
		return this.http.post(`${this.apiHostUrl}/get-whats-app-drip-data-for-report`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateLearnerOfflineTaskAssetGrade(payload) {
		return this.http.post(`${this.apiHostUrl}/update-learner-offline-task-asset-grade`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadLearnerUploadedFiles(payload) {
		return this.http.post(`${this.apiHostUrl}/download-file`, payload, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadLearnerUploadedFileInZipFormat(payload, sessionCode) {
		return this.http
			.post(`${this.apiHostUrl}/download-all-files-in-zip-format/${sessionCode}`, payload, { responseType: 'blob' })
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getFilterListData() {
		return this.http.get(`${this.apiHostUrl}/get-filtered-list-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAnalyticsData(payload) {
		return this.http.post(`${this.apiHostUrl}/get-drip-analytics-data`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
