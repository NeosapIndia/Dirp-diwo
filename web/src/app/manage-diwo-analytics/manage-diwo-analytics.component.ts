import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageDiwoAnalyticsService } from './manage-diwo-analytics.service';
import { ngxCsv } from 'ngx-csv';
import { AppService } from '../app.service';

@Component({
	selector: 'app-manage-diwo-analytics',
	templateUrl: './manage-diwo-analytics.component.html',
	styleUrls: ['./manage-diwo-analytics.component.scss'],
})
export class ManageDiwoAnalyticsComponent implements OnInit {
	selectedDate;

	selectedMonthForDiwoActivity = 2;
	months = 11;

	hideLineGraph = false;
	// view: any[] = [1000, 400];
	chartWidth: number = 1200; // Initial width
	chartHeight: number = 400; // Set an appropriate height

	Monthdata = [
		{ id: 1, name: 'Last 12 Months', value: 11 },
		{ id: 2, name: 'Last 6 Months', value: 5 },
		{ id: 3, name: 'Last 3 Months', value: 2 },
	];

	Reportdata = [
		{ lable: 'Modulewise Activity Report', name: 'Modulewise_Activity_Report' },
		{ lable: 'Learner Performance Report', name: 'Learner_Performance_Report' },
		{ lable: 'Pathwaywise Report', name: 'Pathwaywise_Report' },
		{ lable: 'Coursewise Report', name: 'Coursewise_Report' },
		{ lable: 'Learnerwise Badges & Certificates Report', name: 'Learnerwise_Badges_&_Certificates_Report' },
		{ lable: 'SCORM Report', name: 'SCORM_Report' },
	];

	scormSubReports = [
		{ label: 'Interaction Report', value: 'Interaction_Report' },
		{ label: 'Summary Report', value: 'Summary_Report' }
	];


	viewedByList = [
		{ id: 1, name: 'Modules', value: 'Modules' },
		{ id: 2, name: 'Courses', value: 'Courses' },
		{ id: 3, name: 'Pathways', value: 'Pathways' },
	];

	selectedScormReportType: string;
	selectedReportName: any;
	diwosendFlag: boolean = true;

	colorScheme = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};
	lineGraphResult: any[] = [];

	AllCount = {
		pathwayCount: 0,
		courseCount: 0,
		activeLearer: 0,
		workbookCount: 0,
		sessionCount: 0,
		certifiedLearners: 0,
		assignWorkbookCount: 0,
		assignedCertificateCount: 0,
		assignedBadgeCount: 0,
	};
	invalidDates: moment.Moment[] = [];
	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};
	ranges: any = {
		Today: [moment(), moment()],
		Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	};
	userDetails: any;
	roleId: any;
	userId: any;
	userClient: any;
	SubscriptionData: any;

	showXAxisLabel = true;
	showYAxisLabel = true;

	xAxis: boolean = true;
	yAxis: boolean = true;
	timeline: boolean = true;

	allSubClientList = [];
	selectedClientId;
	isApiCall: boolean = false;

	iconObject = {
		groups: null,
		menu_book: null,
		assignment_add: null,
		co_present: null,
		search_loader: null,
		course_icon: null,
		pathway_icon: null,
	};

	selectedModuleCoursePathway: any;
	AllModuleCoursePathwayList: any = [];
	learningDeepDiveData: any = [];
	isDataLoaded: boolean = false;

	selectedViewedBy = 'Modules';

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		public appService: AppService,
		private diwoanalyticsService: ManageDiwoAnalyticsService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		this.getAllSubClientList();

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	showReport() {
		this.router.navigate(['/session', { from: 'Analytics' }]);
	}

	getAllSubClientList() {
		this.diwoanalyticsService.getAllSubClientList(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.allSubClientList = [];
				this.allSubClientList = res.data;
				if (this.allSubClientList.length > 0) {
					this.selectedClientId = this.allSubClientList[0].id;
					this.getAllCount();
					this.getAllModuleCoursePathways();
				}
			}
		});
	}

	selectClient($event) {
		// console.log('---selectedClient------', this.selectedClientId);
		setTimeout(() => {
			this.getAllCount();
		}, 50);
	}

	getAllCount() {
		this.diwoanalyticsService.getAllCount(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.AllCount = res.data;
			}
		});
	}

	onChangeViewedBy(event) {
		if (
			(event && event.value == 'Modules') ||
			(event && event.value == 'Courses') ||
			(event && event.value == 'Pathways') ||
			event == 'Modules' ||
			event == 'Courses' ||
			event == 'Pathways'
		) {
			this.getAllModuleCoursePathways();
		}
	}

	getAllModuleCoursePathways() {
		this.diwoanalyticsService
			.getAllModuleCoursePathwaysForAnalytics(this.userClient.id, this.selectedViewedBy)
			.subscribe((res: any) => {
				if (res.success) {
					this.AllModuleCoursePathwayList = res.data;
					if (this.AllModuleCoursePathwayList.length > 0) {
						this.selectedModuleCoursePathway = this.AllModuleCoursePathwayList[0].id;
						this.selecteModuleCoursePathway(this.AllModuleCoursePathwayList[0]);
					} else {
						this.selectedModuleCoursePathway = null;
						this.learningDeepDiveData = [];
					}
				}
			});
	}

	selecteModuleCoursePathway(event) {
		let payload = {
			id: event.id,
		};
		if (event.type == 'Module') {
			this.diwoanalyticsService.getModuleAnalyticsDataByModuleId(payload, this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					this.learningDeepDiveData = res.data;
				}
			});
		} else if (event.type == 'Course') {
			this.diwoanalyticsService.getCourseAnalyticsDataByCourseId(payload, this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					this.learningDeepDiveData = res.data[0];
				}
			});
		} else if (event.type == 'Pathway') {
			this.diwoanalyticsService
				.getPathwaysAnalyticsDataByPathwayId(payload, this.userClient.id)
				.subscribe((res: any) => {
					if (res.success) {
						this.learningDeepDiveData = res.data[0];
					}
				});
		}
		this.isDataLoaded = true;
	}

	getFilterAssignmentIdListData(type) {}

	exportToCsv() {
		if (this.learningDeepDiveData && this.learningDeepDiveData.length > 0) {
			let header = [
				'Sr No',
				'Assignment Id',
				'Status',
				'Learner Group',
				'Start Date',
				'End Date',
				'Assign',
				'In Progress',
				'Completed',
				'Certified',
				'Badges Earned',
			];
			let exportdata = [];
			let count = 0;
			for (let item of this.learningDeepDiveData) {
				count++;
				let payload = {
					'Sr No': count,
					'Assignment Id': item.DiwoAssignmentId,
					Status: item.status,
					'Learner Group': item.userGroupTitle ? item.userGroupTitle : '',
					'Start Date': item.StartDate ? ' ' + moment(item.StartDate).format('YYYY-MM-DD HH:mm') : '',
					'End Date': item.EndDate ? ' ' + moment(item.EndDate).format('YYYY-MM-DD HH:mm') : '',
					Assign: item.nominatedlearnercount,
					'In Progress': item.learnerinprogresscount,
					Completed: item.learnercompletedcount,
					Certified: item.learnercertifiedcount,
					'Badges Earned': item.badgeCount ? item.badgeCount : '',
				};

				exportdata.push(payload);
			}
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Export Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			const fileInfo = new ngxCsv(exportdata, 'Export Report', option);
		}
	}

	startDateClicked(value: any) {
		// console.log('-1-', this.selectedDate.startDate);
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		// console.log('2--', this.selectedDate.endDate);
		this.selectedDate.endDate = value.endDate.$d;
	}

	downloadReport() {
		// console.log('--downloadReport---', this.selectedReportName);

		let payload = {
			startDate: this.selectedDate.startDate,
			endDate: this.selectedDate.endDate,
			clientId: this.userClient.id,
		};
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		if (this.selectedReportName == 'Modulewise_Activity_Report' && this.selectedDate) {
			this.diwoanalyticsService.getActivityReport(payload).subscribe((res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let session of res.data) {
							count++;
							let latitude = session.latitude ? session.latitude : '-';
							let longitude = session.longitude ? session.longitude : '-';
							let cordinates = latitude + ' , ' + longitude;
							let payload = {
								'Sr No': count,
								'Module ID':
									session.Workbook?.BaseWorkbookId && session.Workbook?.version > 0
										? `${session.Workbook.BaseWorkbookId}.${session.Workbook.version}`
										: session.Workbook.id,
								'Module Title': session.Workbook.title,
								'Module Type': session && session.DiwoModule && session.DiwoModule.type ? session.DiwoModule.type : '-',
								'Course Title':
									session &&
									session.DiwoModuleAssign &&
									session.DiwoModuleAssign.Course &&
									session.DiwoModuleAssign.Course.title
										? session.DiwoModuleAssign.Course.title
										: '-',
								'Pathway Title':
									session &&
									session.DiwoAssignment &&
									session.DiwoAssignment.Pathway &&
									session.DiwoAssignment.Pathway.title
										? session.DiwoAssignment.Pathway.title
										: '-',
								'Assignment ID': session && session.DiwoAssignment ? session.DiwoAssignment.id : '-',
								'Session ID': session.id,
								'Session Title': session.title,
								'Session Location': session && session.location ? session.location : '-',
								'Session Start Date(System)': session.SessionStartDate
									? ' ' + moment(session.SessionStartDate).format('YYYY-MM-DD')
									: '-',
								'Session Start Time(System)': session.SessionStartDate
									? ' ' + moment(session.SessionStartDate).format('HH:mm')
									: '-',
								'Session End Date(System)': session.SessionEndDate
									? ' ' + moment(session.SessionEndDate).format('YYYY-MM-DD')
									: '-',
								'Session End Time(System)': session.SessionEndDate
									? ' ' + moment(session.SessionEndDate).format('HH:mm')
									: '-',
								'Session Start Date': session.dateWithTime
									? ' ' + moment(session.dateWithTime).format('YYYY-MM-DD')
									: '-',
								'Session Start Time': session.dateWithTime ? ' ' + moment(session.dateWithTime).format('HH:mm') : '-',
								'Session End Date': session.enddateWithTime
									? ' ' + moment(session.enddateWithTime).format('YYYY-MM-DD')
									: '-',
								'Session End Time': session.enddateWithTime
									? ' ' + moment(session.enddateWithTime).format('HH:mm')
									: '-',
								'Facilitator Name': session.faciltiatorName,
								'Learners Assigned': session.nominatedCount,
								'Learners Attended':
									session.Workbook && session.Workbook.DiwoModuleId == 1 ? session.attendedCount : '-',
								'Learners Not Started': session.learnerNotStarted,
								'Learners In Progress': session.learnerInProgress,
								'Learners Completed': session.learnerCompleted,
								'Learners Certified': session.learnerCertified,
								'Average Feedback': session.sessionScore,
								'Facilitator Feedback': session.trainerNote && session.trainerNote != null ? session.trainerNote : '-',
								'Facilitator Location': session.geoLocation && session.geoLocation != null ? session.geoLocation : '-',
								'Facilitator Coordinates': cordinates,
							};
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Modulewise_Activity_Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'Module ID',
							'Module Title',
							'Module Type',
							'Course Title',
							'Pathway Title',
							'Assignment ID',
							'Session ID',
							'Session Title',
							'Session Location',
							'Session Start Date(System)',
							'Session Start Time(System)',
							'Session End Date(System)',
							'Session End Time(System)',
							'Session Start Date',
							'Session Start Time',
							'Session End Date',
							'Session End Time',
							'Facilitator Name',
							'Learners Assigned',
							'Learners Attended',
							'Learners Not Started',
							'Learners In Progress',
							'Learners Completed',
							'Learners Certified',
							'Average Feedback',
							'Facilitator Feedback',
							'Facilitator Location',
							'Facilitator Coordinates',
						],
					};
					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Modulewise_Activity_Report', option);
				}
			});
		} else if (this.selectedReportName == 'Learner_Performance_Report') {
			this.diwoanalyticsService.getLearnerPerformanceReport(payload).subscribe((res: any) => {
				let QuizScoreArray = [];
				let quizMaxAvailabelCount = 0;
				for (let i = 1; i <= 40; i++) {
					let payload: any = { [`Quiz ${i} Max`]: false, name: `Quiz ${i} Max`, score: `Quiz ${i} Score` };
					QuizScoreArray.push(payload);
				}

				let OfflineTaskScoreArray = [
					{ 'Offline Task 1 Max': false, name: 'Offline Task 1 Max', score: 'Offline Task 1 Score' },
					{ 'Offline Task 2 Max': false, name: 'Offline Task 2 Max', score: 'Offline Task 2 Score' },
					{ 'Offline Task 3 Max': false, name: 'Offline Task 3 Max', score: 'Offline Task 3 Score' },
					{ 'Offline Task 4 Max': false, name: 'Offline Task 4 Max', score: 'Offline Task 4 Score' },
					{ 'Offline Task 5 Max': false, name: 'Offline Task 5 Max', score: 'Offline Task 5 Score' },
				];

				for (let session of res.data) {
					let flag = true;
					for (let i = 0; i < QuizScoreArray.length; i++) {
						if (session[`Quiz ${i + 1} Max`]) {
							QuizScoreArray[i][`Quiz ${i + 1} Max`] = true;
						}

						if (!QuizScoreArray[i][`Quiz ${i + 1} Max`]) {
							flag = false;
							break;
						}
					}
					if (flag) {
						break;
					}

					if (session['Offline Task 1 Max']) {
						OfflineTaskScoreArray[0]['Offline Task 1 Max'] = true;
					}
					if (session['Offline Task 2 Max']) {
						OfflineTaskScoreArray[1]['Offline Task 2 Max'] = true;
					}
					if (session['Offline Task 3 Max']) {
						OfflineTaskScoreArray[2]['Offline Task 3 Max'] = true;
					}
					if (session['Offline Task 4 Max']) {
						OfflineTaskScoreArray[3]['Offline Task 4 Max'] = true;
					}
					if (session['Offline Task 5 Max']) {
						OfflineTaskScoreArray[4]['Offline Task 5 Max'] = true;
					}

					let offflag = true;
					for (let i = 0; i < OfflineTaskScoreArray.length; i++) {
						if (!OfflineTaskScoreArray[i][`Offline Task ${i + 1} Max`]) {
							offflag = false;
							break;
						}
					}
					if (offflag) {
						break;
					}
				}

				let payloadBlueprint = {
					'Sr No': null,
					'Learner ID': null,
					'Learner First Name': null,
					'Learner Last Name': null,
					'Parent Account': null,
					'Learner Job Role': null,
					'Learner Added Date': null,
					'Assignment ID': null,
					'Module Title': null,
					'Course Title': null,
					'Pathway Title': null,
					'Certification Required': null,
					Status: null,
					'Session ID': null,
					'Session Title': null,
					'Session Language': null,
					'Attendance Mode': null,
					'Facilitator Name': null,
					'Session Start Date': null,
					'Session End Date': null,
					'Attendance Time': null,
					'Facilitator Feedback': null,
				};

				for (let i = 0; i < QuizScoreArray.length; i++) {
					if (QuizScoreArray[i][`Quiz ${i + 1} Max`]) {
						quizMaxAvailabelCount++;
						payloadBlueprint[`Quiz ${i + 1} Max`] = null;
						payloadBlueprint[`Quiz ${i + 1} Score`] = null;
					}
				}

				for (let i = 0; i < OfflineTaskScoreArray.length; i++) {
					if (OfflineTaskScoreArray[i][`Offline Task ${i + 1} Max`]) {
						payloadBlueprint[`Offline Task ${i + 1} Max`] = null;
						payloadBlueprint[`Offline Task ${i + 1} Score`] = null;
					}
				}

				if (res.customFields && res.customFields.length > 0) {
					for (let customField of res.customFields) {
						if (!customField.isHide) {
							payloadBlueprint[`${customField.label}`] = null;
						}
					}
				}

				let headers = [];
				for (let key in payloadBlueprint) {
					headers.push(key);
				}

				let finalData = [];
				if (res.data && res.data.length > 0) {
					let count = 0;

					for (let session of res.data) {
						count++;
						let payload = {
							'Sr No': count,
							'Learner ID': session.account_id,
							'Learner First Name': session.firstName,
							'Learner Last Name': session.lastName,
							'Parent Account': session.parentAccount,
							'Learner Job Role': session.jobRole,
							'Learner Added Date': ' ' + moment(session.learnerAddedDate).format('YYYY-MM-DD HH:mm'),
							'Assignment ID': session.DiwoAssignment,
							'Module Title': session.workbookTitle,
							'Course Title': session.courseTitle,
							'Pathway Title': session.pathwayTitle,
							'Certification Required': session.haveCertificate == true ? 'Yes' : 'No',
							Status: session.ModuleStatus,
							'Session ID': session.sessionId,
							'Session Title': session.sessionTitle,
							'Session Language': session.sessionLanguage,
							'Attendance Mode': session.attendanceMode,
							'Facilitator Name': session.facilitatorName,
							'Session Start Date': session.sessionStartDate
								? ' ' + moment(session.sessionStartDate).format('YYYY-MM-DD HH:mm')
								: '',
							'Session End Date': session.sessionEndDate
								? ' ' + moment(session.sessionEndDate).format('YYYY-MM-DD HH:mm')
								: '',
							'Attendance Time': session.markMePresentDate
								? ' ' + moment(session.markMePresentDate).format('YYYY-MM-DD HH:mm')
								: '',

							'Facilitator Feedback': session.trainerNote,
						};

						//-----------------------------------------Quiz----------------------------------

						// console.log('--quizMaxAvailabelCount--', quizMaxAvailabelCount);

						// Dynamically handle up to 40 quizzes
						for (let i = 1; i <= quizMaxAvailabelCount; i++) {
							if (session[`Quiz ${i} Max`]) {
								payload[`Quiz ${i} Max`] = session[`Quiz ${i} Max`] ? session[`Quiz ${i} Max`] : '-';
								payload[`Quiz ${i} Score`] = session[`Quiz ${i} Score`] ? session[`Quiz ${i} Score`] : '-';
							} else if (QuizScoreArray[i][`Quiz ${i} Max`] == true) {
								payload[`Quiz ${i} Max`] = '-';
								payload[`Quiz ${i} Score`] = '-';
							} else {
								payload[`Quiz ${i} Max`] = '-';
								payload[`Quiz ${i} Score`] = '-';
							}
						}

						//--------------------------------------Offline Task---------------------------
						if (session['Offline Task 1 Max']) {
							OfflineTaskScoreArray[0]['Offline Task 1 Max'] = true;
							payload['Offline Task 1 Max'] =
								session && session['Offline Task 1 Max'] ? session['Offline Task 1 Max'] : '-';
							payload['Offline Task 1 Score'] =
								session && session['Offline Task 1 Score'] ? session['Offline Task 1 Score'] : '-';
						} else if (OfflineTaskScoreArray[0]['Offline Task 1 Max'] == true) {
							payload['Offline Task 1 Max'] = '-';
							payload['Offline Task 1 Score'] = '-';
						}

						if (session['Offline Task 2 Max']) {
							OfflineTaskScoreArray[1]['Offline Task 2 Max'] = true;
							payload['Offline Task 2 Max'] =
								session && session['Offline Task 2 Max'] ? session['Offline Task 2 Max'] : '-';
							payload['Offline Task 2 Score'] =
								session && session['Offline Task 2 Score'] ? session['Offline Task 2 Score'] : '-';
						} else if (OfflineTaskScoreArray[1]['Offline Task 2 Max'] == true) {
							payload['Offline Task 2 Max'] = '-';
							payload['Offline Task 2 Score'] = '-';
						}

						if (session['Offline Task 3 Max']) {
							OfflineTaskScoreArray[2]['Offline Task 3 Max'] = true;
							payload['Offline Task 3 Max'] =
								session && session['Offline Task 3 Max'] ? session['Offline Task 3 Max'] : '-';
							payload['Offline Task 3 Score'] =
								session && session['Offline Task 3 Score'] ? session['Offline Task 3 Score'] : '-';
						} else if (OfflineTaskScoreArray[2]['Offline Task 3 Max'] == true) {
							payload['Offline Task 3 Max'] = '-';
							payload['Offline Task 3 Score'] = '-';
						}

						if (session['Offline Task 4 Max']) {
							OfflineTaskScoreArray[3]['Offline Task 4 Max'] = true;
							payload['Offline Task 4 Max'] =
								session && session['Offline Task 4 Max'] ? session['Offline Task 4 Max'] : '-';
							payload['Offline Task 4 Score'] =
								session && session['Offline Task 4 Score'] ? session['Offline Task 4 Score'] : '-';
						} else if (OfflineTaskScoreArray[3]['Offline Task 4 Max'] == true) {
							payload['Offline Task 4 Max'] = '-';
							payload['Offline Task 4 Score'] = '-';
						}

						if (session['Offline Task 5 Max']) {
							OfflineTaskScoreArray[4]['Offline Task 5 Max'] = true;
							payload['Offline Task 5 Max'] =
								session && session['Offline Task 5 Max'] ? session['Offline Task 5 Max'] : '-';
							payload['Offline Task 5 Score'] =
								session && session['Offline Task 5 Score'] ? session['Offline Task 5 Score'] : '-';
						} else if (OfflineTaskScoreArray[4]['Offline Task 5 Max'] == true) {
							payload['Offline Task 5 Max'] = '-';
							payload['Offline Task 5 Score'] = '-';
						}

						// Handle custom fields

						for (let customField of res.customFields) {
							if (
								!customField.isHide &&
								typeof session.customFields === 'object' &&
								session.customFields[`${customField.label}`]
							) {
								payload[`${customField.label}`] = session.customFields[customField.label];
							} else {
								payload[`${customField.label}`] = '-';
							}
						}

						let temp = payloadBlueprint;
						temp = { ...payload };

						finalData.push(temp);
					}
				}

				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: false,
					showTitle: false,
					title: 'Learner_Performance_Report',
					useBom: false,
					noDownload: false,
					headers: headers,
				};

				this.appService.checkNotifcation = true;
				const fileInfo = new ngxCsv(finalData, 'Learner_Performance_Report', option);
				// console.log(payloadBlueprint);
			});
		} else if (this.selectedReportName == 'Pathwaywise_Report') {
			this.diwoanalyticsService.getPathwayWiseReport(payload).subscribe((res: any) => {
				if (res.success) {
					let finalData = [];

					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let pathway of res.data) {
							count++;
							let payload = {
								'Sr No': count,
								'Pathway Id': pathway.id,
								'Pathway Title': pathway && pathway.title ? pathway.title : '-',
								'Learners Assigned': pathway.nominatedCount,
								'Not Started Learners': pathway.learnerNotStarted,
								'In Progress Learners': pathway.learnerInProgress,
								'Completed Learners': pathway.learnerCompleted,
								'Certified  Learners': pathway.learnerCertified,
								// 'Completion Percentage': pathway.completedPercentage ? pathway.completedPercentage : '-',
							};

							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Pathwaywise_Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'Pathway Id',
							'Pathway Title',
							'Learners Assigned',
							'Not Started Learners',
							'In Progress Learners',
							'Completed Learners',
							'Certified  Learners',
							// 'Completion Percentage',
						],
					};

					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Pathwaywise_Report', option);
				}
			});
		} else if (this.selectedReportName == 'Coursewise_Report') {
			this.diwoanalyticsService.getCourseWiseReport(payload).subscribe((res: any) => {
				if (res.success) {
					let finalData = [];

					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let course of res.data) {
							count++;
							let payload = {
								'Sr No': count,
								'Course Id': course.id,
								'Course Title': course && course.title ? course.title : '-',
								'Learners Assigned': course.nominatedCount,
								'Not Started Learners': course.learnerNotStarted,
								'In Progress Learners': course.learnerInProgress,
								'Completed Learners': course.learnerCompleted,
								'Certified  Learners': course.learnerCertified,
								// 'Completion Percentage': course.completedPercentage ? course.completedPercentage : '-',
							};

							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Coursewise_Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'Course Id',
							'Course Title',
							'Learners Assigned',
							'Not Started Learners',
							'In Progress Learners',
							'Completed Learners',
							'Certified  Learners',
							// 'Completion Percentage',
						],
					};

					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Coursewise_Report', option);
				}
			});
		} else if (this.selectedReportName == 'Learnerwise_Badges_&_Certificates_Report') {
			let payload1 = {
				clientId: this.userClient.id,
			};
			this.diwoanalyticsService.getLearnerwisBadgesCertificatesReport(payload1).subscribe((res: any) => {
				if (res.success) {
					let finalData = [];

					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let allUser of res.data) {
							count++;
							let payload = {
								'Sr No': count,
								'Learner Id': allUser.UserId,
								'Learner Name': allUser.LearnerName,
								'Badges Earned': allUser.badgeEarned,
								'Certificates Earned': allUser.certificateEarned,
							};

							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: ' Learnerwise_Badges_&_Certificates_Report',
						useBom: false,
						noDownload: false,
						headers: ['Sr No', 'Learner Id', 'Learner Name', 'Badges Earned', 'Certificates Earned'],
					};

					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Learnerwise_Badges_&_Certificates_Report', option);
				}
			});
		} else if (this.selectedReportName == 'Learnerwise_Report1') {
			this.diwoanalyticsService.getLearnerPerformanceReport(payload).subscribe((res: any) => {
				let QuizScoreArray = [
					{ 'Quiz 1 Max': false, name: 'Quiz 1 Max', score: 'Quiz 1 Score' },
					{ 'Quiz 2 Max': false, name: 'Quiz 2 Max', score: 'Quiz 2 Score' },
					{ 'Quiz 3 Max': false, name: 'Quiz 3 Max', score: 'Quiz 3 Score' },
					{ 'Quiz 4 Max': false, name: 'Quiz 4 Max', score: 'Quiz 4 Score' },
					{ 'Quiz 5 Max': false, name: 'Quiz 5 Max', score: 'Quiz 5 Score' },
				];

				for (let session of res.data) {
					if (session['Quiz 1 Max']) {
						QuizScoreArray[0]['Quiz 1 Max'] = true;
					}
					if (session['Quiz 2 Max']) {
						QuizScoreArray[1]['Quiz 2 Max'] = true;
					}
					if (session['Quiz 3 Max']) {
						QuizScoreArray[2]['Quiz 3 Max'] = true;
					}
					if (session['Quiz 4 Max']) {
						QuizScoreArray[3]['Quiz 4 Max'] = true;
					}
					if (session['Quiz 5 Max']) {
						QuizScoreArray[4]['Quiz 5 Max'] = true;
					}

					let flag = true;
					for (let i = 0; i < QuizScoreArray.length; i++) {
						if (!QuizScoreArray[i][`Quiz ${i + 1} Max`]) {
							flag = false;
							break;
						}
					}
					if (flag) {
						break;
					}
				}

				let payloadBlueprint = {
					'Learner ID': null,
					'Learner First Name': null,
					'Learner Last Name': null,
					'Parent Account': null,
					'Learner Job Role': null,
					'Learner Added Date': null,
					'Course Title': null,
					'Module Title': null,
					'Session ID': null,
					'Session Title': null,
					'Session Language': null,
					'Attendance Mode': null,
					'Facilitator Name': null,
					'Session Start Date': null,
					'Session End Date': null,
					'Facilitator Feedback': null,
				};

				for (let i = 0; i < QuizScoreArray.length; i++) {
					if (QuizScoreArray[i][`Quiz ${i + 1} Max`]) {
						payloadBlueprint[`Quiz ${i + 1} Max`] = null;
						payloadBlueprint[`Quiz ${i + 1} Score`] = null;
					}
				}

				if (res.customFields && res.customFields.length > 0) {
					for (let customField of res.customFields) {
						if (!customField.isHide) {
							payloadBlueprint[`${customField.label}`] = null;
						}
					}
				}

				let headers = [];
				for (let key in payloadBlueprint) {
					headers.push(key);
				}

				let finalData = [];
				if (res.data && res.data.length > 0) {
					let count = 0;

					for (let session of res.data) {
						count++;
						let payload = {
							'Learner ID': session.account_id,
							'Learner First Name': session.firstName,
							'Learner Last Name': session.lastName,
							'Parent Account': session.parentAccount,
							'Learner Job Role': session.jobRole,
							'Learner Added Date': ' ' + moment(session.learnerAddedDate).format('YYYY-MM-DD HH:mm'),
							'Course Title': session.courseTitle,
							'Module Title': session.workbookTitle,
							'Session ID': session.sessionId,
							'Session Title': session.sessionTitle,
							'Session Language': session.sessionLanguage,
							'Attendance Mode': session.attendanceMode,
							'Facilitator Name': session.facilitatorName,
							'Session Start Date': session.sessionStartDate
								? ' ' + moment(session.sessionStartDate).format('YYYY-MM-DD HH:mm')
								: '',
							'Session End Date': session.sessionEndDate
								? ' ' + moment(session.sessionEndDate).format('YYYY-MM-DD HH:mm')
								: '',
							'Facilitator Feedback': session.trainerNote,
						};

						if (session['Quiz 1 Max']) {
							QuizScoreArray[0]['Quiz 1 Max'] = true;
							payload['Quiz 1 Max'] = session && session['Quiz 1 Max'] ? session['Quiz 1 Max'] : '-';
							payload['Quiz 1 Score'] = session && session['Quiz 1 Score'] ? session['Quiz 1 Score'] : '-';
						} else if (QuizScoreArray[0]['Quiz 1 Max'] == true) {
							payload['Quiz 1 Max'] = '-';
							payload['Quiz 1 Score'] = '-';
						}

						if (session['Quiz 2 Max']) {
							QuizScoreArray[1]['Quiz 2 Max'] = true;
							payload['Quiz 2 Max'] = session && session['Quiz 2 Max'] ? session['Quiz 2 Max'] : '-';
							payload['Quiz 2 Score'] = session && session['Quiz 2 Score'] ? session['Quiz 2 Score'] : '-';
						} else if (QuizScoreArray[1]['Quiz 2 Max'] == true) {
							payload['Quiz 2 Max'] = '-';
							payload['Quiz 2 Score'] = '-';
						}

						if (session['Quiz 3 Max']) {
							QuizScoreArray[2]['Quiz 3 Max'] = true;
							payload['Quiz 3 Max'] = session && session['Quiz 3 Max'] ? session['Quiz 3 Max'] : '-';
							payload['Quiz 3 Score'] = session && session['Quiz 3 Score'] ? session['Quiz 3 Score'] : '-';
						} else if (QuizScoreArray[2]['Quiz 3 Max'] == true) {
							payload['Quiz 3 Max'] = '-';
							payload['Quiz 3 Score'] = '-';
						}

						if (session['Quiz 4 Max']) {
							QuizScoreArray[3]['Quiz 4 Max'] = true;
							payload['Quiz 4 Max'] = session && session['Quiz 4 Max'] ? session['Quiz 4 Max'] : '-';
							payload['Quiz 4 Score'] = session && session['Quiz 4 Score'] ? session['Quiz 4 Score'] : '-';
						} else if (QuizScoreArray[3]['Quiz 4 Max'] == true) {
							payload['Quiz 4 Max'] = '-';
							payload['Quiz 4 Score'] = '-';
						}

						if (session['Quiz 5 Max']) {
							QuizScoreArray[4]['Quiz 5 Max'] = true;
							payload['Quiz 5 Max'] = session && session['Quiz 5 Max'] ? session['Quiz 5 Max'] : '-';
							payload['Quiz 5 Score'] = session && session['Quiz 5 Score'] ? session['Quiz 5 Score'] : '-';
						} else if (QuizScoreArray[4]['Quiz 5 Max'] == true) {
							payload['Quiz 5 Max'] = '-';
							payload['Quiz 5 Score'] = '-';
						}

						// Handle custom fields

						for (let customField of res.customFields) {
							if (
								!customField.isHide &&
								typeof session.customFields === 'object' &&
								session.customFields[`${customField.label}`]
							) {
								payload[`${customField.label}`] = session.customFields[customField.label];
							} else {
								payload[`${customField.label}`] = '-';
							}
						}

						let temp = payloadBlueprint;
						temp = { ...payload };

						finalData.push(temp);
					}
				}

				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: false,
					showTitle: false,
					title: 'Learnerwise_Report',
					useBom: false,
					noDownload: false,
					headers: headers,
				};

				this.appService.checkNotifcation = true;
				const fileInfo = new ngxCsv(finalData, 'Learnerwise_Report', option);
				// console.log(payloadBlueprint);
			});
		} else if (this.selectedReportName === 'SCORM_Report' && this.selectedScormReportType === 'Interaction_Report') {
			this.diwoanalyticsService.getInteractionReport(payload).subscribe((res: any) => {
				if (res.success) {

					console.log('res.data', res.data);

					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let session of res.data) {
							count++;
							
							let payload = {
								'Sr No': count,
								'Learner ID': session && session.UserId ? session.UserId : '-',
								'Module ID': session && session.WorkbookId ? session.WorkbookId : '-',
								'Interaction ID': session && session.interaction_id ? session.interaction_id : '-',
								'Description': session && session.description ? session.description : '-',								
								'Question Type': session && session.question_type ? session.question_type : '-',
								'Learner Response': session && session.learner_response ? session.learner_response : '-',
								'Correct Response': session && session.correct_response ? session.correct_response : '-',
								'Result': session && session.result ? session.result : '-',
								'Interaction Timestamp': session && session.timestamp ? session.timestamp : '-',
								'Latency': session && session.latency ? session.latency : '-',
							};
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Interaction_Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'Learner ID',
							'Module ID',
							'Interaction ID',
							'Description',
							'Question Type',
							'Learner Response',
							'Correct Response',
							'Result',
							'Interaction Timestamp',
							'Latency',							
						],
					};
					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Interaction_Report', option);
				}
			});			
			console.log('Downloading SCORM report:', this.selectedScormReportType);
		} else if (this.selectedReportName === 'SCORM_Report' && this.selectedScormReportType === 'Summary_Report') {
			this.diwoanalyticsService.getScormSummaryReport(payload).subscribe((res: any) => {
				if (res.success) {

					console.log('res.data', res.data);

					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let session of res.data) {
							count++;

							// Convert initialLaunchDate to IST and format
							let launchDateIST = '-';
							if (session && session.initialLaunchDate) {
								const date = new Date(session.initialLaunchDate);

								// Convert to IST using locale string
								const istString = date.toLocaleString('en-IN', {
									timeZone: 'Asia/Kolkata',
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									hour12: false,
								});

								// Format the string from DD/MM/YYYY, HH:MM to YYYY-MM-DD HH:MM
								const [datePart, timePart] = istString.split(', ');
								const [day, month, year] = datePart.split('/');
								launchDateIST = `${year}-${month}-${day} ${timePart}`;
							}
							
							let payload = {
								'Sr No': count,
								'Learner ID': session && session.AccountId ? session.AccountId : '-',
								'Learner Name': session && session.UserFirstName ? session.UserFirstName + ' ' + session.UserLastName : '-',
								'Module ID': session && session.WorkbookId ? session.WorkbookId : '-',
								'Module Title': session && session.WorkbookTitle ? session.WorkbookTitle : '-',
								// 'Launch Date':  session && session.launchDate ? session.launchDate : '-',
								'Initial Launch Date':  launchDateIST ? launchDateIST : '-',
								'Completition Status': session && session.completion_status ? session.completion_status : '-',
								// 'Completition Date': session && session.completion_time ? session.completion_time : '-',
								'Success Status': session && session.success_status ? session.success_status : '-',								
								'Total Time in Second': session && session.total_time ? session.total_time : '-',
								'Raw Score': session && session.score_raw ? session.score_raw : '-',
								'Min Score': session && session.min_score ? session.min_score : '-',
								'Max Score': session && session.max_score ? session.max_score : '-',
								
							};
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Summary_Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'Learner ID',
							'Learner Name',
							'Module ID',
							'Module Title',
							'Initial Launch Date',
							'Completition Status',
							// 'Completition Date',
							'Success Status',							
							'Total Time in Second',
							'Raw Score',
							'Min Score',
							'Max Score'							
						],
					};
					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Summary_report', option);
				}
			});			
			console.log('Downloading SCORM report:', this.selectedScormReportType);
		}
	}
}
