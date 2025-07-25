import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageDiwoHomeService } from './manage-diwo-home.service';
import { ngxCsv } from 'ngx-csv';
import { AppService } from '../app.service';

declare var $: any;

@Component({
	selector: 'app-manage-diwo-home',
	templateUrl: './manage-diwo-home.component.html',
	styleUrls: ['./manage-diwo-home.component.scss'],
})
export class ManageDiwoHomeComponent implements OnInit {
	selectedMonthForDiwoActivity = 2;
	months = 2;
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
	];

	selectedReportName: any;
	diwosendFlag: boolean = true;
	colorScheme = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};
	lineGraphResult: any[] = [];

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
	newUser: boolean = true;
	userName: string;
	policyNames = [];
	defaultPolicyName = ['Terms and Conditions', 'Privacy Policy', 'Cookie Policy'];
	selectedDate: any;
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
	hideLineGraph = false;
	// view: any[] = [1000, 400];
	chartWidth: number = 1200; // Initial width
	chartHeight: number = 400; // Set an appropriate height
	isExistingUser: boolean = false;
	policies: any;
	isApiCall: boolean = false;
	isDataLoaded: boolean = false;

	iconObject = {
		groups: null,
		menu_book: null,
		assignment_add: null,
		co_present: null,
		search_loader: null,
		course_icon: null,
		pathway_icon: null,
	};

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		public appService: AppService,
		private diwoHomeService: ManageDiwoHomeService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		if (this.userDetails) {
			if (
				this.userDetails.acceptPolicy == false &&
				this.userDetails.userPolicyDetails != null &&
				this.userDetails.userPolicyDetails != ''
			) {
				this.newUser = false;
				let policyNotificationData = JSON.parse(this.userDetails.userPolicyDetails);
				this.userName = this.userDetails.first + ' ' + this.userDetails.last;
				if (policyNotificationData && policyNotificationData.length > 0) {
					for (let policy of policyNotificationData) {
						for (let key in policy) {
							if (!policy[key].acceptedByUser && policy[key].PolicyChangeLogId) {
								this.policyNames.push(key);
								const str_policy_name = this.policyNames.toString();
								this.policies = this.removeLastComma(str_policy_name);
							}
						}
					}
					$('#policyModel').modal('show');
				}
			} else if (this.userDetails.acceptPolicy == false) {
				this.newUser = true;
				this.policyNames = this.defaultPolicyName;
				const str_policy_name = this.policyNames.toString();
				this.policies = this.removeLastComma(str_policy_name);
				$('#policyModel').modal('show');
			}
		}
		this.getAllCount();
		this.getClientSubscriptionForView();
		this.checkUserIsExistingOrNot();
		this.appService.checkGoogleDriveDetails();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	redirctToURL(policyName) {
		let policyURLs = JSON.parse(localStorage.getItem('user')).user.Market;
		if (policyName == 'Terms and Conditions') {
			window.open(`${policyURLs.tosUrl}`, '_blank');
		} else if (policyName == 'Privacy Policy') {
			window.open(`${policyURLs.privacyPolicyUrl}`, '_blank');
		} else if (policyName == 'Cookie Policy') {
			window.open(`${policyURLs.cookiePolicyUrl}`, '_blank');
		} else if (policyName == 'Data Processing Agreement') {
			window.open(`${policyURLs.dpaUrl}`, '_blank');
		}
	}

	removeLastComma(str) {
		let string = str;
		const lastIndex = str.lastIndexOf(',');
		if (lastIndex !== -1) {
			let string = str.slice(0, lastIndex) + ' ' + 'and' + ' ' + str.slice(lastIndex + 1);
			return string;
		}
		return string;
	}

	getClientSubscriptionForView() {
		this.diwoHomeService.getClientViewSubscriptionById(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.SubscriptionData = res.data.license;
			}
		});
	}

	acceptPolicy() {
		let payload = {
			list: this.policyNames,
		};
		this.diwoHomeService.acceptPolicyByUser(this.userDetails.id, this.userClient.id, payload).subscribe((res: any) => {
			if (res.success) {
				$('#policyModel').modal('hide');
				let userDetails = JSON.parse(localStorage.getItem('user'));
				userDetails.user.acceptPolicy = true;
				userDetails.user = this.appService.removePersonalData(userDetails.user);
				localStorage.setItem('user', JSON.stringify(userDetails));
				this.appService.setUserPersonalData();
				this.appService.checkGoogleDriveDetails();
			}
		});
	}

	getAllCount() {
		this.diwoHomeService.getAllCount(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.AllCount = res.data;
			}
		});
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
			this.diwoHomeService.getActivityReport(payload).subscribe((res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;

						for (let session of res.data) {
							count++;

							let latitude = session.latitude ? session.latitude : '-';
							let longitude = session.longitude ? session.longitude : '-';
							let cordinates = latitude + ' , ' + longitude;
							// let payload = {
							// 	'Sr No': count,
							// 	'Course Title': session.Workbook.Courses[0].title,
							// 	'Course Book Title': session.Workbook.title,
							// 	'Session ID': session.id,
							// 	'Session Title': session.title,
							// 	'Session Location': session.location,
							// 	'Session Start Date': ' ' + moment(session.SessionStartDate).format('YYYY-MM-DD'),
							// 	'Session Start Time': ' ' + moment(session.SessionStartDate).format('HH:mm'),
							// 	'Session End Date': ' ' + moment(session.SessionEndDate).format('YYYY-MM-DD'),
							// 	'Session End Time': ' ' + moment(session.SessionEndDate).format('HH:mm'),
							// 	'Faciltiator Name': session.faciltiatorName,
							// 	'Participants Nominated': '-',
							// 	'Participants Attended': '-',
							// 	'Average Feedback': '-',
							// 	'Trainer Feedback': session.trainerNote ? session.trainerNote : '-',
							// };

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
							// 'Sr No',
							// 'Course Title',
							// 'Course Book Title',
							// 'Session ID',
							// 'Session Title',
							// 'Session Location',
							// 'Session Start Date',
							// 'Session Start Time',
							// 'Session End Date',
							// 'Session End Time',
							// 'Faciltiator Name',
							// 'Participants Nominated',
							// 'Participants Attended',
							// 'Average Feedback',
							// 'Trainer Feedback',
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
			this.diwoHomeService.getLearnerPerformanceReport(payload).subscribe((res: any) => {
				// let QuizScoreArray = [
				// 	{ 'Quiz 1 Max': false, name: 'Quiz 1 Max', score: 'Quiz 1 Score' },
				// 	{ 'Quiz 2 Max': false, name: 'Quiz 2 Max', score: 'Quiz 2 Score' },
				// 	{ 'Quiz 3 Max': false, name: 'Quiz 3 Max', score: 'Quiz 3 Score' },
				// 	{ 'Quiz 4 Max': false, name: 'Quiz 4 Max', score: 'Quiz 4 Score' },
				// 	{ 'Quiz 5 Max': false, name: 'Quiz 5 Max', score: 'Quiz 5 Score' },
				// ];

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
					// if (session['Quiz 1 Max']) {
					// 	QuizScoreArray[0]['Quiz 1 Max'] = true;
					// }
					// if (session['Quiz 2 Max']) {
					// 	QuizScoreArray[1]['Quiz 2 Max'] = true;
					// }
					// if (session['Quiz 3 Max']) {
					// 	QuizScoreArray[2]['Quiz 3 Max'] = true;
					// }
					// if (session['Quiz 4 Max']) {
					// 	QuizScoreArray[3]['Quiz 4 Max'] = true;
					// }
					// if (session['Quiz 5 Max']) {
					// 	QuizScoreArray[4]['Quiz 5 Max'] = true;
					// }

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

						// if (session['Quiz 1 Max']) {
						// 	QuizScoreArray[0]['Quiz 1 Max'] = true;
						// 	payload['Quiz 1 Max'] = session && session['Quiz 1 Max'] ? session['Quiz 1 Max'] : '-';
						// 	payload['Quiz 1 Score'] = session && session['Quiz 1 Score'] ? session['Quiz 1 Score'] : '-';
						// } else if (QuizScoreArray[0]['Quiz 1 Max'] == true) {
						// 	payload['Quiz 1 Max'] = '-';
						// 	payload['Quiz 1 Score'] = '-';
						// }

						// if (session['Quiz 2 Max']) {
						// 	QuizScoreArray[1]['Quiz 2 Max'] = true;
						// 	payload['Quiz 2 Max'] = session && session['Quiz 2 Max'] ? session['Quiz 2 Max'] : '-';
						// 	payload['Quiz 2 Score'] = session && session['Quiz 2 Score'] ? session['Quiz 2 Score'] : '-';
						// } else if (QuizScoreArray[1]['Quiz 2 Max'] == true) {
						// 	payload['Quiz 2 Max'] = '-';
						// 	payload['Quiz 2 Score'] = '-';
						// }

						// if (session['Quiz 3 Max']) {
						// 	QuizScoreArray[2]['Quiz 3 Max'] = true;
						// 	payload['Quiz 3 Max'] = session && session['Quiz 3 Max'] ? session['Quiz 3 Max'] : '-';
						// 	payload['Quiz 3 Score'] = session && session['Quiz 3 Score'] ? session['Quiz 3 Score'] : '-';
						// } else if (QuizScoreArray[2]['Quiz 3 Max'] == true) {
						// 	payload['Quiz 3 Max'] = '-';
						// 	payload['Quiz 3 Score'] = '-';
						// }

						// if (session['Quiz 4 Max']) {
						// 	QuizScoreArray[3]['Quiz 4 Max'] = true;
						// 	payload['Quiz 4 Max'] = session && session['Quiz 4 Max'] ? session['Quiz 4 Max'] : '-';
						// 	payload['Quiz 4 Score'] = session && session['Quiz 4 Score'] ? session['Quiz 4 Score'] : '-';
						// } else if (QuizScoreArray[3]['Quiz 4 Max'] == true) {
						// 	payload['Quiz 4 Max'] = '-';
						// 	payload['Quiz 4 Score'] = '-';
						// }

						// if (session['Quiz 5 Max']) {
						// 	QuizScoreArray[4]['Quiz 5 Max'] = true;
						// 	payload['Quiz 5 Max'] = session && session['Quiz 5 Max'] ? session['Quiz 5 Max'] : '-';
						// 	payload['Quiz 5 Score'] = session && session['Quiz 5 Score'] ? session['Quiz 5 Score'] : '-';
						// } else if (QuizScoreArray[4]['Quiz 5 Max'] == true) {
						// 	payload['Quiz 5 Max'] = '-';
						// 	payload['Quiz 5 Score'] = '-';
						// }

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
			this.diwoHomeService.getPathwayWiseReport(payload).subscribe((res: any) => {
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
			this.diwoHomeService.getCourseWiseReport(payload).subscribe((res: any) => {
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
			this.diwoHomeService.getLearnerwisBadgesCertificatesReport(payload1).subscribe((res: any) => {
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
						title: 'Learnerwise_Badges_&_Certificates_Report',
						useBom: false,
						noDownload: false,
						headers: ['Sr No', 'Learner Id', 'Learner Name', 'Badges Earned', 'Certificates Earned'],
					};

					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Learnerwise_Badges_&_Certificates_Report', option);
				}
			});
		}
	}

	checkUserIsExistingOrNot() {
		this.diwoHomeService.checkUserIsExistingOrNot(this.userId).subscribe((res: any) => {
			if (res.success) {
				if (res.message == 'Existing User') {
					this.isExistingUser = true;
				} else {
					this.isExistingUser = false;
				}
			}
		});
	}
}
