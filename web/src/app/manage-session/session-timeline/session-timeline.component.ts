import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { FormBuilder } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppService } from '../../../app/app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionTimelineService } from './session-timeline.service';
import { environment } from '../../../environments/environment';
import * as moment from 'moment';
import { ngxCsv } from 'ngx-csv';
import { DomSanitizer } from '@angular/platform-browser';

declare var $: any;

@Component({
	selector: 'app-session-timeline',
	templateUrl: './session-timeline.component.html',
	styleUrls: ['./session-timeline.component.css'],
	animations: [routerTransition()],
})
export class SessionTimelineComponent implements OnInit, OnDestroy {
	private isPieChartInitialized = false;
	pieChartOptions: any;
	private isBarChartInitialized = false;
	barChartOptions: any;
	chartData: any[] = [];

	wordCloudFlag = true;
	showMoreCount = 1;
	assetBasePath = environment.imageHost + environment.imagePath;
	sessionId;
	code: any;
	password;
	allWorksheets = [];

	showChartNo = 0;
	trainerInstruction;

	colorScheme = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};
	gradient: boolean = false;
	showLegend: boolean = false;

	viewPiechart: any[] = [1200, 550];
	Donutview: any[] = [1000, 400];
	verticalBarview: any[] = [1200, 500];
	horizontalView: any[] = [1200, 500];

	showViewWorkbookButton = false;

	viewWorkBookUrl;
	multi: any[];
	startRefresh = false;
	showXAxis = true;
	showYAxis = true;
	showXAxisLabel = true;
	xAxisLabel = '';
	showYAxisLabel = true;
	yAxisLabel = '';
	chartType: any;
	worksheetType: any;
	sessionData: any;
	seeResultQuestionCount = [];
	sessionAllData = [];
	seeResultData = [];
	showResultQuestionCount: any;
	showResultMaximunPossibleNo: number = 0;
	showResultAvrageScore: number;
	seeResultTotalResponses: number;
	showResultAverageScore: any;
	showResultTopScroe: any;
	allQuestion = [];
	toppers = [];
	showWordCloudFlag: boolean = false;
	timeInterval;
	refreshSeeResultIndex: any;
	refreshSeeResultOrderResult: any;
	refeshShowResultTimeline: any;
	refreshShowResultIndex: any;
	description: any;
	workseetIndex: any;
	showResultdescription: any;
	activityLabel: any;
	showResultworkseetIndex: any;
	surveyData = [];
	totalSurveyRespose = 0;
	offlineTaskData = [];
	sessionUserId;
	userId;
	surveyOnlyTrainerData: any;
	totalAttendeaParticipant: any;
	totalWorksheetPaticipantSubmited = 0;
	totalAttendeaParticipantPercantage = 0;
	learnerResponsesData: any;
	afterFinalLearnerResponsesData: any = [];
	afterfinalseeResultData: any = [];
	afterFinalLearnerPassedData: any = [];
	inputSearchTxt;
	pollChartType: any;
	inputQuizSearchTxt = null;
	inputSearchPassTxt: any;
	isSurveyInProgress: boolean = false;
	sessionFeedback: boolean = false;
	keepSurveyOn: boolean = false;
	keepSurveyOnDays: any;
	showTimeLinePage: boolean = true;
	showWBackWorksheetButton: boolean = false;
	DiwoModuleId: any;
	briefText: any;
	selectedQuestionText;
	selectedQuestionIndex;
	offlineTaskSearchText: any = null;
	backupquestionUploadedAsset: any[] = [];
	passedLearnerList: any = [];
	UserRoleId: any;
	originalSeeResultData: any;
	scrollPosition = 0;
	RecordSessionLinkError: boolean = false;
	RecordSessionValidLinkError: boolean = false;
	isQuizCompletion: boolean = false;
	showFullscreenLoader: boolean = false;
	showUnloackAllReattempts: boolean = false;

	onSelect(event: any) {
		console.log('Selected Slice:', event);
	}

	allParticipants = [];

	showLabels: boolean = true;
	isDoughnut: boolean = false;
	legendPosition: string = 'below';
	showDownloadButton = false;
	sessionCardData = {
		ParticipantsApprovedCount: 0,
		ParticipantsAttendCount: 0,
		ParticipantsEngagementCount: 0,
		sessionFeedbackScore: 0,
		sessionFeedbackTotalCount: 0,
	};

	fullscreenToast = {
		show: false,
		message: '',
		type: 'success', // success | error | info | warning
	};

	yAxisTickFormatting(val) {
		if (val % 1 > 0) {
			return '';
		} else {
			return val;
		}
	}

	selectedQuestion(item, index) {
		this.selectedQuestionIndex = index;
		this.selectedQuestionText = item.question;
		this.offlineTaskSearchText = null;
		this.setUploadedDataByUser();
		// if (['Image', 'PDF'].indexOf(item.fileType) > -1) {
		// 	this.showDownloadButton = true;
		// } else {
		// 	this.showDownloadButton = false;
		// }
		// this.page = 1;
		// this.getOfflineTask();
		// this.questionUploadedAsset = this.allOfflineTaskData[index].data;
	}
	onActivate(data): void {
		console.log('Activate', JSON.parse(JSON.stringify(data)));
	}

	onDeactivate(data): void {
		console.log('Deactivate', JSON.parse(JSON.stringify(data)));
	}

	donutView: any[] = [1100, 600];

	timePicker: any = [];
	date;

	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};

	alternateSide: boolean = false;
	firstContentSide = 'right';

	/////////////WordCloud//////////

	// Create Work Cloud Data Array
	// Array<AgWordCloudData>
	//word_cloud: any = [{ size: 1500, text: '' }];
	// Word Cloud Options
	// options = {
	// 	settings: {
	// 		minFontSize: 200,
	// 		maxFontSize: 2000,
	// 	},
	// 	margin: {
	// 		top: 0,
	// 		right: 0,
	// 		bottom: 0,
	// 		left: 0,
	// 	},
	// 	labels: true, // false to hide hover labels
	// };

	////////////Temp Variable////

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	sessionTitle: any;
	//full screen view
	fullScreenMedia = [];
	currentIndex = 0;
	isFullscreen: boolean = false;

	iconObject = {
		info_50_60: null,
		see_result_50_60: null,
		show_result_50_60: null,
		download_fill: null,
		task_alt: null,
		person_raised_hand: null,
		sentiment_very_satisfied: null,
		diversity_4: null,
		pdf_thumbnail: null,
		image_thumbnail: null,
		video_thumbnail: null,
		gold_icon: null,
		silver_icon: null,
		bronze_icon: null,
		quiz_leaderboard: null,
		search_loader: null,
	};

	isediGraded: boolean = false;
	questionUploadOnVimeo = false;
	gradedCount: any = 0;
	totalGradedableCount: any = 0;
	questionUploadedAsset = [];

	questionList = [];
	recordedSessionLink = null;
	showViewRecordButton = false;
	showNextVideo = true;

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		private route: ActivatedRoute,
		public appService: AppService,
		private sessionTimelineService: SessionTimelineService,
		private router: Router,
		public sanitizer: DomSanitizer
	) {
		// add Dummy Data
		for (let parti of this.allParticipants) {
			parti.question = [];
			for (let i = 1; i <= 20; i++) {
				let temp = Math.random();
				if (temp >= 0.6) {
					parti.question.push({ answer: 'Correct' });
				} else if (temp <= 0.4) {
					parti.question.push({ answer: 'Wrong' });
				} else {
					parti.question.push({ answer: 'Half-Correct' });
				}
			}
			for (let count of parti.question) {
				if (count.answer == 'Correct') {
					parti.correctAnswer = parti.correctAnswer + 1;
				} else if (count.answer == 'Half-Correct') {
					parti.correctAnswer = parti.correctAnswer + 0.5;
				}
			}
		}

		if (localStorage.getItem('user')) {
			this.userId = JSON.parse(localStorage.getItem('user')).user.id;
			// console.log('--this.userId--', this.userId);
		}
	}

	async ngOnInit() {
		let code = this.route.snapshot.paramMap.get('code');
		if (code) {
			this.sessionTimelineService.getSessionDetails(code).subscribe((res: any) => {
				this.sessionId = res.data.id;
				this.code = code;
				let data = JSON.parse(localStorage.getItem('user')) || null;
				if (data) {
					this.processData();
				} else {
					$('#viewPasswordModel').modal('show');
				}
			});
		} else {
			this.processData();
		}

		//full screen view
		document.addEventListener('fullscreenchange', this.fullscreenChangeHandler.bind(this));
		this.getAppBranding();
		this.UserRoleId = localStorage.getItem('roleId');
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	save() {
		if (this.password) {
			this.sessionTimelineService
				.checkPassword({
					password: this.password,
					sessionId: this.sessionId,
				})
				.subscribe((res: any) => {
					if (res.success) {
						this.cancelPasswordPopUp();
						this.processData();
					}
				});
		}
	}

	passwordFiledChange(value) {
		this.password = value;
	}

	showCopyLinkPopup() {
		$('#viewCopyLinkModel').modal('show');
	}

	cancelCopyLinkPopup() {
		$('#viewCopyLinkModel').modal('hide');
	}

	saveLink() {
		setTimeout(() => {
			let textBox = document.querySelector('#hyper_link') as HTMLInputElement;
			if (!textBox) return;
			textBox.select();
			document.execCommand('copy');
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.AddEdit.Toaster.sessionlinkcopied'),
				this.appService.getTranslation('Utils.success')
			);
		}, 100);
	}

	savePassword() {
		setTimeout(() => {
			let textBox = document.querySelector('#hyper_link2') as HTMLInputElement;
			if (!textBox) return;
			textBox.select();
			document.execCommand('copy');
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.AddEdit.Toaster.sessionlinkcopied'),
				this.appService.getTranslation('Utils.success')
			);
		}, 100);
	}

	processData() {
		let session = this.route.params['_value'];
		if ((session && session.sessionId) || (this.code && this.sessionId)) {
			if (session && session.sessionId) this.sessionId = session.sessionId;
			this.getSessionAllUsersData(this.sessionId);

			this.sessionTimelineService.getSessionWorksheets(this.sessionId).subscribe((res: any) => {
				this.allWorksheets = [];
				this.fullScreenMedia = [];
				let count = 0;
				for (let worksheet of res.data) {
					this.sessionFeedback = worksheet.sessionFeedback;
					this.keepSurveyOn = worksheet.keepSurveyOn;
					this.keepSurveyOnDays = worksheet.keepSurveyOnDays;
					if (!worksheet.trainerSurvey) {
						this.allWorksheets.push(worksheet);
					}

					// full screen view
					let payload = {
						isTranscoding: worksheet.DiwoAssets[0].isTranscoding,
						path: worksheet.DiwoAssets[0].path,
						type: worksheet.DiwoAssets[0].type,
						worksheet: worksheet,
						id: count,
					};
					this.fullScreenMedia.push(payload);
					count++;
				}

				// console.log('-this.fullScreenMedia-', this.fullScreenMedia);
			});
			this.sessionTimelineService.getSessionById(this.sessionId).subscribe((res: any) => {
				if (res.success) {
					this.sessionData = res.data;
					this.recordedSessionLink = this.sessionData.recordedLink;
					this.sessionUserId = res.data.UserId;
					this.sessionTitle = res.data.title;
					this.DiwoModuleId = res.data.Workbook?.DiwoModuleId;
					if (this.sessionData.status == 'Closed') {
						//Convert Session Start date And End Date In Moment

						this.sessionData.dateWithTime = moment(this.sessionData.dateWithTime).format('YYYY-MM-DD, hh:mm a');
						this.sessionData.enddateWithTime = moment(this.sessionData.enddateWithTime).format('YYYY-MM-DD, hh:mm a');
						this.sessionData.SessionStartDate = moment(this.sessionData.SessionStartDate).format('YYYY-MM-DD, hh:mm a');
						this.sessionData.SessionEndDate = moment(this.sessionData.SessionEndDate).format('YYYY-MM-DD, hh:mm a');
						this.getSeesionCardData(this.sessionData.id);
						this.sessionTimelineService.getParticipantList(this.sessionId).subscribe((res: any) => {
							if (res.success) {
								this.allParticipants = [];
								this.allParticipants = res.data;
							}
						});

						//check for keepSurveyOn
						if (this.sessionFeedback && this.keepSurveyOn && this.sessionData.status == 'Closed') {
							let SessionEndDate_: any = moment(this.sessionData.SessionEndDate).format('YYYY-MM-DD HH:mm:ss');
							let currentDate: any = moment().format('YYYY-MM-DD HH:mm:ss');
							let fDate = moment(SessionEndDate_).add(this.keepSurveyOnDays, 'days');
							let futureDate: any = moment(fDate).format('YYYY-MM-DD HH:mm:ss');
							// console.log('-currentDate-', currentDate);
							// console.log('-SessionEndDate-', SessionEndDate_);
							// console.log('-futureDate-', futureDate);
							if (currentDate <= futureDate) {
								this.isSurveyInProgress = true;
							} else {
								this.isSurveyInProgress = false;
							}
						}
					}
					else if(this.DiwoModuleId === 5) {
						this.getSeesionCardData(this.sessionData.id);
					} else {
						if (res.data && res.data.WorkbookId) {
							this.sessionTimelineService.getTrainerMasterSession(res.data.WorkbookId).subscribe((res: any) => {
								if (res.success) {
									if (res.data) {
										this.viewWorkBookUrl = `${environment.appUrl}?view_workbook=true&workbookId=${res.data.id}&userId=${res.data.UserId}`;
										this.showViewWorkbookButton = true;
									}
								}
							});
						}
					}
				}
			});
		}
		this.createTimerPicker();
		// this.refreshData();
	}

	getSessionAllUsersData(sessionId) {
		this.sessionTimelineService.getSessionAllUsersAllData(sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionAllData = [];
				this.sessionAllData = res.data;
			}
		});
	}

	createTimerPicker() {
		let timerId = 0;
		for (let HH = 0; HH <= 23; HH++) {
			for (let MM = 0; MM <= 45; MM = MM + 15) {
				let hours = HH.toString().length == 1 ? '0' + HH.toString() : HH.toString();
				let minutes = MM.toString().length == 1 ? '0' + MM.toString() : MM.toString();

				this.timePicker.push({
					id: timerId,
					time: `${hours}:${minutes}`,
					hours: hours,
					minutes: minutes,
				});
				timerId++;
			}
		}
	}

	getTimePikerIdByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.id;
			}
		}
	}

	getActculTimeByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.time;
			}
		}
	}

	getDateByDateAndTimePickerId(date, id) {
		let timePickerData;
		for (let time of this.timePicker) {
			if (time.id == id) {
				timePickerData = time;
			}
		}
		return new Date(date).setHours(parseInt(timePickerData.hours), parseInt(timePickerData.minutes), 0, 0);
	}

	selectTimeIntoDrip() {}

	cancelViewGuide() {
		$('#viewGuideModel').modal('hide');
	}

	viewGuidePopUp(trainerInstruction) {
		this.trainerInstruction = trainerInstruction;
		$('#viewGuideModel').modal('show');
	}

	setQuestion(index) {
		this.allQuestion = [];
		for (let question of this.sessionAllData[0].SessionWorksheets[index].SessionQuestions) {
			let options = [];
			for (let option of question.SessionOptions) {
				options.push({ name: option.text, value: 0 });
			}

			console.log('question in setQuestion', question);

			this.allQuestion.push({
				question: question.question,
				type: question.questionType,
				options: options,
			});
		}

		for (let sessionUser of this.sessionAllData) {
			if (sessionUser.SessionWorksheets.length > 0) {
				for (let question of sessionUser.SessionWorksheets[index].SessionQuestions) {
					for (let option of question.SessionOptions) {
						if (option.selectedAns) {
							for (let qua of this.allQuestion) {
								// if(qua.type == 'MCQ'){
								if (qua.question == question.question) {
									for (let opt of qua.options) {
										if (opt.name == option.text) {
											opt.value++;
										}
									}
								}
								// }
							}
						}
					}
				}
			}
		}

		for (let question of this.allQuestion) {
			console.log('question.options--01', question.options);

			// Pie chart for session options
			// if (this.chartType == 'Pie' && question.options && question.options.length > 0) {
			// 	this.pieChartOptions = JSON.parse(JSON.stringify(this.getPieOptions(question.options || [])));
			// }

			if (
				this.chartType === 'Pie' &&
				Array.isArray(question.options) &&
				question.options.length > 0 &&
				question.options.some((opt) => opt.value > 0)
			) {
				this.pieChartOptions = this.getPieOptions(question.options);
			}

			// bar chart for session options
			if (this.chartType == 'Bar') {
				this.barChartOptions = JSON.parse(JSON.stringify(this.setBarChartOptions(question.options || [])));
			}
		}
	}

	refreshShowResult() {
		this.spinnerService.show();
		this.showWordCloudFlag = false;
		this.wordCloudFlag = false;
		this.sessionTimelineService.getSessionAllUsersAllData(this.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionAllData = [];
				this.sessionAllData = res.data;
				setTimeout(() => {
					this.showResultPopUp(this.refeshShowResultTimeline, this.refreshShowResultIndex, null, true, false);
				}, 200);
				this.spinnerService.hide();
			}
		});
	}

	showResultPopUp(timeline, index, showResultContainer?, comingfromRefreshButton?, ishideFirstScreen?) {
		if (ishideFirstScreen) {
			this.showWBackWorksheetButton = true;
			this.isFullscreen = false;
			this.showFullscreenLoader = false;
		} else if (comingfromRefreshButton) {
			if (this.showWBackWorksheetButton) {
				this.showWBackWorksheetButton = true;
			}
		} else {
			this.showWBackWorksheetButton = false;
		}
		this.chartType = timeline.chart;

		this.worksheetType = timeline.type;
		setTimeout(() => {
			this.seeResultPopUp(index, true);
		}, 200);
		this.surveyData = [];

		this.totalAttendeaParticipant = 0;
		this.totalWorksheetPaticipantSubmited = 0;
		this.totalAttendeaParticipantPercantage = 0;

		this.showWordCloudFlag = false;
		if (this.sessionAllData && this.sessionAllData.length > 0) {
			this.totalAttendeaParticipant = this.sessionAllData.length;

			for (let sessionUser of this.sessionAllData) {
				if (sessionUser.SessionWorksheets.length > 0) {
					if (
						sessionUser.SessionWorksheets[index].submit ||
						(sessionUser.SessionWorksheets[index].isQuizCompletion &&
							sessionUser.SessionWorksheets[index].isQuizAttempted)
					) {
						this.totalWorksheetPaticipantSubmited = this.totalWorksheetPaticipantSubmited + 1;
					}
				}
			}

			if (this.totalAttendeaParticipant && this.totalWorksheetPaticipantSubmited > 0) {
				let percantage: any = (this.totalWorksheetPaticipantSubmited / this.totalAttendeaParticipant) * 100;
				percantage = parseFloat(percantage);
				this.totalAttendeaParticipantPercantage = Math.round(percantage);
				// console.log('totalAttendeaParticipantPercantage', this.totalAttendeaParticipantPercantage);
			}

			this.refeshShowResultTimeline = timeline;
			this.refreshShowResultIndex = index;
			this.showResultworkseetIndex = index + 1;
			this.showResultdescription =
				this.sessionAllData[0].SessionWorksheets.length > 0
					? this.sessionAllData[0].SessionWorksheets[index].description
					: '';

			this.activityLabel =
				this.sessionAllData[0].SessionWorksheets.length > 0 &&
				this.sessionAllData[0].SessionWorksheets[index].activityTemplate
					? this.sessionAllData[0].SessionWorksheets[index].activityTemplate
					: '';

			this.showResultQuestionCount =
				this.sessionAllData[0].SessionWorksheets.length > 0
					? this.sessionAllData[0].SessionWorksheets[index].SessionQuestions.length
					: 0;
			if (this.sessionAllData[0].SessionWorksheets.length > 0) {
				this.setQuestion(index);
			}
			this.showResultMaximunPossibleNo = 0;
			this.showResultAvrageScore = 0;
			this.seeResultData = [];
			this.seeResultTotalResponses = 0;
			let forAvrageScore = [];
			//this.word_cloud = [];
			if (
				this.worksheetType == 'Quiz' ||
				this.worksheetType == 'Quiz (Randomised)' ||
				this.worksheetType == 'Poll' ||
				this.worksheetType == 'Word Cloud' ||
				this.worksheetType == 'Spin The Wheel'
			) {
				let count = 0;
				let questions = [];
				let submitedCount = 0;
				for (let workbook of this.sessionAllData) {
					count++;
					let data = { account_id: '', fullName: '', response: '', total: 0, questions: [] };
					data.fullName = workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '';
					data.account_id = workbook && workbook.User && workbook.User.account_id ? workbook.User.account_id : '';
					data.total = 0;
					let worksheet = workbook.SessionWorksheets.length > 0 ? workbook.SessionWorksheets[index] : null;
					if (!worksheet) {
						continue;
					}
					data.response = worksheet && worksheet.submit ? 'Submitted' : 'Not Submitted';
					let response = false;
					questions = [];
					if (worksheet.submit === false && !worksheet.isQuizCompletion && !worksheet.isQuizAttempted) {
						continue;
					} else {
						submitedCount++;
					}
					if (worksheet && worksheet.SessionQuestions && worksheet.SessionQuestions.length > 0) {
						questions = worksheet.SessionQuestions.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});
					}
					data.total = worksheet.score;
					forAvrageScore.push(worksheet.score);
					for (let que of questions) {
						if (
							(worksheet.type == 'Quiz' ||
								worksheet.type == 'Quiz (Randomised)' ||
								this.worksheetType == 'Spin The Wheel') &&
							que.questionType == 'MCQ'
						) {
							let currectAnswer = [];
							let userAnswer = [];
							let count = 1;
							let options = [];
							let correctAns = false;
							let wrongAns = false;

							for (let option of que.SessionOptions) {
								if (option.correctAns == option.selectedAns) {
									correctAns = true;
								} else {
									wrongAns = true;
								}
								if (option.selectedAns) {
									response = true;
									userAnswer.push(option.sr_no);
								}
							}
							data.questions.push({ userAnswer: userAnswer, correctAns, wrongAns });
						} else if (
							(worksheet.type == 'Quiz' ||
								worksheet.type == 'Quiz (Randomised)' ||
								this.worksheetType == 'Spin The Wheel') &&
							que.questionType == 'Drag and Drop'
						) {
							let isCorrectAnswer = true;
							if (que.SessionOptions && que.SessionOptions[0].userSeq) {
								response = true;
								for (let option of que.SessionOptions) {
									if (option.sr_no != option.userSeq) {
										isCorrectAnswer = false;
										break;
									}
								}
								let userAnswer = [];

								let userSequency = que.SessionOptions.sort((a, b) => {
									if (a.userSeq < b.userSeq) {
										return -1;
									}
								});
								for (let i = 0; i < userSequency.length; i++) {
									userAnswer.push(userSequency[i].sr_no);
								}
								let mark = 0.0;
								if (this.worksheetType == 'Spin The Wheel') {
									if (isCorrectAnswer) {
										// mark = que.spinQueScore;
										// data.total = data.total + mark;
										// forAvrageScore.push(que.spinQueScore);
										data.questions.push({
											mark: mark,
											userAnswer: userAnswer,
											correctAns: true,
											wrongAns: false,
										});
									} else {
										// mark = 0;
										// data.total = data.total + mark;
										// forAvrageScore.push(0);
										data.questions.push({ userAnswer: userAnswer, correctAns: false, wrongAns: true });
									}
								} else {
									if (isCorrectAnswer) {
										// mark = que.spinQueScore;
										// data.total = data.total + mark;
										// forAvrageScore.push(que.spinQueScore);
										data.questions.push({ userAnswer: userAnswer, correctAns: true, wrongAns: false });
									} else {
										mark = 0;
										// data.total = data.total + mark;
										// forAvrageScore.push(0);
										data.questions.push({ userAnswer: userAnswer, correctAns: false, wrongAns: true });
									}
								}
							} else {
								// forAvrageScore.push(0);
								data.questions.push({ userAnswer: [], correctAns: false, wrongAns: false });
							}
						} else if (worksheet.type == 'Word Cloud') {
							// for (let option of que.SessionOptions) {
							// 	if (option.userAnswer !== null && option.userAnswer !== '') {
							// 		//this.word_cloud.push({ size: this.getFontSize(), text: option.userAnswer });
							// 		let list = option.userAnswer.split(' ');
							// 		for (let word of list) {
							// 			if (!this.wordsToEliminate.includes(word.toLowerCase())) this.word_cloud.push(word.toLowerCase());
							// 		}
							// 	}
							// }
							if (count == 1) {
								// console.log('----Word Cloud Popup Click-----');
								// let url = document.location.href.split('#')[0];
								// url = url + `#/word-cloud/${this.sessionId}/${index}`;
								// window.open(url, '_blank');
							}
						}
					}

					if (response) {
						this.seeResultTotalResponses++;
					}
					this.seeResultData.push(data);
				}

				for (let que of questions) {
					if (que.spinQueScore > 0) {
						this.showResultMaximunPossibleNo = this.showResultMaximunPossibleNo + que.spinQueScore;
					}
				}
				if (this.showResultMaximunPossibleNo == 0) {
					this.showResultMaximunPossibleNo = this.showResultQuestionCount;
				}

				this.seeResultData = this.seeResultData.sort((a, b) => {
					if (a.total > b.total) {
						return -1;
					}
				});
				let total = 0;

				for (let mark of forAvrageScore) {
					total = total + mark;
				}

				this.showWordCloudFlag = true;
				this.showResultAverageScore = (total / submitedCount).toFixed(1);

				if (this.seeResultData.length > 0) {
					this.showResultTopScroe = this.seeResultData[0].total;
				} else {
					this.toastr.warning(
						this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.noparticipant'),
						this.appService.getTranslation('Utils.warning')
					);
				}
				// if (this.worksheetType !== 'Word Cloud') {
				// 	$('#showResultModel').modal('show');
				// }
			} else if (this.worksheetType == 'Survey') {
				this.surveyData = [];
				for (let data of timeline.Questions) {
					if (data && data.questionType && data.questionType == 'Short answer') {
						let payload = {
							type: 'Short answer',
							shortAnswer: [],
							question: data.question,
							showMore: false,
						};

						this.surveyData.push(payload);
					} else if (data && data.questionType && data.questionType == 'Long answer') {
						let payload = {
							type: 'Long answer',
							longAnswer: [],
							question: data.question,
							showMore: false,
						};

						this.surveyData.push(payload);
					} else if (data && data.questionType && data.questionType == 'MCQ') {
						let payload = {
							type: 'MCQ',
							question: data.question,
							option: [],
							responses: 0,
						};
						let options = [];
						options = data.Options.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});
						for (let option of options) {
							payload.option.push({ name: option.text, value: 0 });
						}
						this.surveyData.push(payload);
					} else if (data && data.questionType && data.questionType == 'Rating scale') {
						let payload = {
							type: 'Rating scale',
							question: data.question,
							option: [],
							responses: 0,
						};
						let options = [];
						options = data.Options.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});
						for (let option of options) {
							payload.option.push({ name: option.text, value: 0 });
						}
						this.surveyData.push(payload);
					} else if (data && data.questionType && data.questionType == 'File upload') {
						let payload = {
							type: 'File upload',
							question: data.question,
							uploadedFiles: [],
							responses: 0,
						};
						this.surveyData.push(payload);
					}
				}
				this.totalSurveyRespose = 0;
				for (let workbook of this.sessionAllData) {
					let flag = true;
					let data = { fullName: '', total: 0, questions: [] };
					data.fullName = workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '';
					data.total = 0;
					let worksheet = workbook.SessionWorksheets[index];
					let questions = [];
					if (worksheet && worksheet.SessionQuestions.length > 0) {
						questions = worksheet.SessionQuestions.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});
					}
					for (let que of questions) {
						for (let survey of this.surveyData) {
							if (survey.type == que.questionType && survey.question == que.question) {
								if (survey.type == 'Short answer') {
									if (que.surveyNote) {
										if (flag) {
											this.totalSurveyRespose++;
											flag = false;
										}
										survey.shortAnswer.push(que.surveyNote);
									}
								} else if (survey.type == 'Long answer') {
									if (que.surveyNote) {
										if (flag) {
											this.totalSurveyRespose++;
											flag = false;
										}
										survey.longAnswer.push(que.surveyNote);
									}
								} else if (survey.type == 'MCQ' || survey.type == 'Rating scale') {
									for (let userOption of que.SessionOptions) {
										if (userOption.selectedAns) {
											for (let dataOption of survey.option) {
												if (dataOption.name == userOption.text) {
													if (flag) {
														this.totalSurveyRespose++;
														flag = false;
													}
													dataOption.value = dataOption.value + 1;
													survey.responses = survey.responses + 1;
												}
											}
										}
									}
								} else if (survey.type == 'File upload') {
									if (que.SessionQuestionSubmissions && que.SessionQuestionSubmissions.length > 0) {
										if (flag) {
											this.totalSurveyRespose++;
											flag = false;
										}
										let payload = {
											fullName: workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '',
											files: [],
										};
										for (let file of que.SessionQuestionSubmissions) {
											if (flag) {
												this.totalSurveyRespose++;
												flag = false;
											}
											payload.files.push(file);
										}
										survey.responses = survey.responses + 1;
										survey.uploadedFiles.push(payload);
									}
								}
							}
						}
					}
				}
				// $('#showResultModel').modal('show');
				// console.log('--this.surveyData--', this.surveyData);
			} else if (this.worksheetType == 'Offline Task') {
				//Get Data From BackEnd
				this.sessionTimelineService.getSessionOfflineTaskData(this.sessionId, index).subscribe((res: any) => {
					if (res.success) {
						this.briefText = res.data.taskBrief;
						this.offlineTaskData = res.data.finalList;
						this.questionList = [];
						this.selectedQuestionIndex = 0;
						if (this.offlineTaskData[0]?.SessionQuestions) {
							for (let data of this.offlineTaskData[0].SessionQuestions) {
								this.questionList.push({ title: data.question });
							}
							// console.log('--this.offlineTaskData--', this.offlineTaskData);
							this.setUploadedDataByUser();

							$('#viewuploadsmodel').modal('show');
						}
					}
				});

				// this.offlineTaskData = [];
				// for (let data of timeline.Questions) {
				// 	if (data && data.isFileSubmission && data.isTextResponse) {
				// 		let payload = {
				// 			question: data.question,
				// 			uploadedFiles: [],
				// 			textNote: [],
				// 			responses: 0,
				// 			showMore: false,
				// 		};
				// 		this.offlineTaskData.push(payload);
				// 	} else if (data && data.isFileSubmission) {
				// 		let payload = {
				// 			question: data.question,
				// 			uploadedFiles: [],
				// 			responses: 0,
				// 		};
				// 		this.offlineTaskData.push(payload);
				// 	} else if (data && data.isTextResponse) {
				// 		let payload = {
				// 			question: data.question,
				// 			textNote: [],
				// 			responses: 0,
				// 			showMore: false,
				// 		};
				// 		this.offlineTaskData.push(payload);
				// 	}
				// }
				// this.totalSurveyRespose = 0;
				// for (let workbook of this.sessionAllData) {
				// 	let flag = true;
				// 	let data = { fullName: '', total: 0, questions: [] };
				// 	data.fullName = workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '';
				// 	data.total = 0;
				// 	let worksheet = workbook.SessionWorksheets[index];
				// 	let questions = [];
				// 	if (worksheet && worksheet.SessionQuestions.length > 0) {
				// 		questions = worksheet.SessionQuestions.sort((a, b) => {
				// 			if (a.id < b.id) {
				// 				return -1;
				// 			}
				// 		});
				// 	}
				// 	for (let que of questions) {
				// 		for (let offlineTask of this.offlineTaskData) {
				// 			if (offlineTask.question == que.question) {
				// 				let flag_ = false;
				// 				let payload = {
				// 					fullName: workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '',
				// 					files: [],
				// 				};
				// 				if (
				// 					que.isFileSubmission &&
				// 					que.SessionQuestionSubmissions &&
				// 					que.SessionQuestionSubmissions.length > 0
				// 				) {
				// 					if (flag) {
				// 						this.totalSurveyRespose++;
				// 						flag = false;
				// 						flag_ = true;
				// 					}
				// 					for (let file of que.SessionQuestionSubmissions) {
				// 						if (flag) {
				// 							this.totalSurveyRespose++;
				// 							flag = false;
				// 							flag_ = true;
				// 						}
				// 						payload.files.push(file);
				// 					}
				// 				}
				// 				if (que.isTextResponse && que.offlineTaskNote) {
				// 					offlineTask.textNote.push(que.offlineTaskNote);
				// 					flag_ = true;
				// 				}
				// 				if (flag_) {
				// 					offlineTask.responses = offlineTask.responses + 1;
				// 				}
				// 				offlineTask.uploadedFiles.push(payload);
				// 			}
				// 		}
				// 	}
				// }
				// $('#showResultModel').modal('show');
			}
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.noparticipant'),
				this.appService.getTranslation('Utils.warning')
			);
		}

		if (!comingfromRefreshButton && this.worksheetType !== 'Offline Task') {
			if (this.seeResultData && this.seeResultData.length != 0) {
				this.toggleFullscreen(showResultContainer, index);
			}
		}
		if (!this.wordCloudFlag) {
			this.wordCloudFlag = true;
		}
	}

	setUploadedDataByUser() {
		this.questionUploadedAsset = [];
		this.backupquestionUploadedAsset = [];
		// console.log('----------this.selectedQuestionIndex-------', this.selectedQuestionIndex);
		this.gradedCount = 0;
		this.totalGradedableCount = 0;

		for (let userData of this.offlineTaskData) {
			for (let submisstion of userData.SessionQuestions[this.selectedQuestionIndex].SessionQuestionSubmissions) {
				let payload = submisstion;
				payload.account_id = userData && userData.User && userData.User.account_id ? userData.User.account_id : '';
				payload.fullName = userData && userData.User && userData.User.fullName ? userData.User.fullName : '';
				payload.isFileSubmission = true;
				payload.isTextResponse = false;
				this.questionUploadedAsset.push(payload);

				if (payload.grade != null && payload.grade != '') {
					this.gradedCount++;
				}
				this.totalGradedableCount++;
			}

			if (userData.SessionQuestions[this.selectedQuestionIndex].isTextResponse) {
				let payload = {
					account_id: userData && userData.User && userData.User.account_id ? userData.User.account_id : '',
					fullName: userData && userData.User && userData.User.fullName ? userData.User.fullName : '',
					grade: userData.SessionQuestions[this.selectedQuestionIndex].grade,
					offlineTaskNote: userData.SessionQuestions[this.selectedQuestionIndex].offlineTaskNote,
					isTextResponse: true,
					isFileSubmission: false,
					id: userData.SessionQuestions[this.selectedQuestionIndex].id,
				};
				this.questionUploadedAsset.push(payload);
				if (payload.grade != null && payload.grade != '') {
					this.gradedCount++;
				}
				this.totalGradedableCount++;
			}
		}

		// console.log('------questionUploadedAsset-------', this.questionUploadedAsset);
		this.backupquestionUploadedAsset = [...this.questionUploadedAsset];
	}

	getFontSize() {
		let min = 500;
		let max = 3000;
		let randomNum = Math.floor(Math.random() * (max - min + 1) + min);
		return randomNum;
	}

	cancelshowResultPopUp() {
		$('#showResultModel').modal('hide');
	}

	cancelPasswordPopUp() {
		$('#viewPasswordModel').modal('hide');
	}

	refreshSeeResult() {
		this.spinnerService.show();
		this.sessionTimelineService.getSessionAllUsersAllData(this.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionAllData = [];
				this.sessionAllData = res.data;
				setTimeout(() => {
					this.seeResultPopUp(this.refreshSeeResultIndex, this.refreshSeeResultOrderResult, null, true);
				}, 200);
				this.spinnerService.hide();
			}
		});
	}

	async downloadSpinTheWheelSeeResult(index, flag) {
		let data: any = [];
		let header = [];
		let finalData = [];
		let minScore = 1;

		if (!flag) {
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
				this.appService.getTranslation('Utils.success')
			);
		}

		//Add Question
		let question = this.sessionAllData[0].SessionWorksheets[index].SessionQuestions;

		header.push('Sr. No');
		header.push('LearnerId');

		let count = 0;
		for (let que of question) {
			count++;
			let questionText;
			if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
				questionText = ' (' + que.spinCatName + ')' + ' - ' + que.question;
			} else {
				questionText = que.question;
			}
			header.push('Q' + count + questionText.replaceAll(',', ' '));
			header.push('Q' + count + ' ' + 'Score');
		}

		header.push('Total Score');
		header.push('Max Score');

		if (this.sessionAllData && this.sessionAllData.length > 0) {
			for (let sessionData of this.sessionAllData) {
				if (sessionData && sessionData.SessionWorksheets && sessionData.SessionWorksheets.length > 0) {
					let question = sessionData.SessionWorksheets[index];
					question.account_id = sessionData.User.account_id;
					data.push(question);
				}
			}
		}

		if (data.length > 0 && data[0].SessionQuestions && data[0].SessionQuestions.length > 0) {
			let srNo = 0;

			for (let userData of data) {
				srNo++;
				let payload = {};
				payload['Sr. No'] = srNo;
				payload['LearnerId'] = userData.account_id;
				let questionCount = 0;
				let totalScore = userData.score;
				let maxQueScore = 0;
				let mark = 0;

				for (let que of userData.SessionQuestions) {
					questionCount++;
					if (JSON.parse(userData.assignSpinQue) && JSON.parse(userData.assignSpinQue).indexOf(que.spinCatIndex) > -1) {
						let isNotSelected = true;
						let userAnswer = [];
						let multiQueTemp = [];

						let userSequency = que.SessionOptions.sort((a, b) => {
							if (a.userSeq < b.userSeq) {
								return -1;
							}
						});

						for (let i = 0; i < userSequency.length; i++) {
							userAnswer.push(userSequency[i].sr_no);
						}

						for (let option of que.SessionOptions) {
							if (option.selectedAns) {
								multiQueTemp.push(option.text);
								// console.log('---multiQueTemp----', multiQueTemp);
							}
						}

						for (let option of que.SessionOptions) {
							if (que.questionType == 'MCQ') {
								if (option.selectedAns) {
									isNotSelected = false;
									if (
										payload[que.question] ||
										payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question]
									) {
										let temp;
										if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
											temp = payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question].replaceAll(
												',',
												', '
											);
										} else {
											temp = payload[que.question].replaceAll(',', ', ');
										}

										// if (option.text == null || option.text == '') {
										// 	if (minScore == 0) {
										// 		temp.push(option.sr_no - 1);
										// 	} else {
										// 		temp.push(option.sr_no);
										// 	}
										// } else {
										// 	temp.push(option.text);
										// }

										if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
											payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = temp.toString();
										} else {
											payload[que.question] = temp.toString();
										}
									} else {
										if (option.text == null || option.text == '') {
											if (minScore == 0) {
												if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
													payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = option.sr_no - 1;
												} else {
													payload[que.question] = option.sr_no - 1;
												}
											} else {
												if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
													payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = option.sr_no;
												} else {
													payload[que.question] = option.sr_no;
												}
											}
										} else {
											if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
												payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] =
													multiQueTemp.toString();
											} else {
												payload[que.question] = multiQueTemp.toString();
											}
										}
									}
								}
							} else if (que.questionType == 'Drag and Drop') {
								if (
									payload[que.question] ||
									payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question]
								) {
									let temp;
									// if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
									// 	temp = payload[' (' + que.spinCatName + ')' + ' - ' + que.question].replaceAll(',', ' ');
									// } else {
									// 	temp = payload[que.question].replaceAll(',', ' ');
									// }

									// if (option.text == null || option.text == '') {
									// 	if (minScore == 0) {
									// 		temp.push(option.sr_no - 1);
									// 	} else {
									// 		temp.push(option.sr_no);
									// 	}
									// } else {
									// 	temp.push(option.text);
									// }

									// if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
									// 	payload[' (' + que.spinCatName + ')' + ' - ' + que.question] = temp.toString();
									// } else {
									// 	payload[que.question] = temp.toString();
									// }
								} else {
									if (option.text == null || option.text == '') {
										if (minScore == 0) {
											if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
												payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = option.sr_no - 1;
											} else {
												payload[que.question] = option.sr_no - 1;
											}
										} else {
											if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
												payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = option.sr_no;
											} else {
												payload[que.question] = option.sr_no;
											}
										}
									} else {
										if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
											payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = userAnswer.toString();
										} else {
											payload[que.question] = userAnswer.toString();
										}
									}
								}
							}
						}

						if (que.questionType == 'MCQ') {
							if (isNotSelected) {
								if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
									payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = 'NA';
									payload['Q' + questionCount + ' ' + 'Score'] = 'NA';
								} else {
									payload[que.question] = 'NA';
									payload['Q' + questionCount + ' ' + 'Score'] = 'NA';
								}
							} else {
								let quescore = que.spinQueScore;
								maxQueScore = maxQueScore + quescore;

								let currectAnswer = [];
								let userAnswer = [];
								let count = 1;
								let options = [];
								let correctAns = false;
								let wrongAns = false;
								options = que.SessionOptions;
								// .sort((a, b) => {
								// 	if (a.id < b.id) {
								// 		return -1;
								// 	}
								// });

								for (let option of options) {
									if (option.correctAns == option.selectedAns && option.selectedAns == true) {
										correctAns = true;
									} else if (option.selectedAns != option.correctAns) {
										wrongAns = true;
									}
									if (option.selectedAns) {
										userAnswer.push(option.sr_no);
									}
								}

								// for (let option of options) {
								// 	if (option.correctAns) {
								// 		currectAnswer.push(count);
								// 	}
								// 	if (option.selectedAns) {
								// 		userAnswer.push(count);
								// 	}
								// 	count++;
								// }

								// if (currectAnswer.length >= userAnswer.length) {
								// 	for (let currect of currectAnswer) {
								// 		if (userAnswer.indexOf(currect) > -1) {
								// 			correctAns = true;
								// 		} else {
								// 			wrongAns = true;
								// 		}
								// 	}
								// } else if (currectAnswer.length > userAnswer.length) {
								// 	for (let userAns of userAnswer) {
								// 		if (currectAnswer.indexOf(userAns) > -1) {
								// 			correctAns = true;
								// 		} else {
								// 			wrongAns = true;
								// 		}
								// 	}
								// }

								if (correctAns && wrongAns) {
									mark = que.spinQueScore / 2;
									// totalScore = totalScore + mark;
								} else if (correctAns) {
									mark = que.spinQueScore;
									// totalScore = totalScore + mark;
								}

								payload['Q' + questionCount + ' ' + 'Score'] = mark;
							}
						} else if (que.questionType == 'Drag and Drop') {
							let quescore = que.spinQueScore;
							maxQueScore = maxQueScore + quescore;
							let isCorrectAnswer = true;
							if (que.SessionOptions && que.SessionOptions[0].userSeq) {
								for (let option of que.SessionOptions) {
									if (option.sr_no != option.userSeq) {
										isCorrectAnswer = false;
									}
								}
								// let userAnswer = [];
								// let userSequency = que.SessionOptions.sort((a, b) => {
								// 	if (a.userSeq < b.userSeq) {
								// 		return -1;
								// 	}
								// });

								// for (let i = 0; i < userSequency.length; i++) {
								// 	userAnswer.push(userSequency[i].sr_no);
								// }

								if (isCorrectAnswer) {
									mark = que.spinQueScore;
									// totalScore = totalScore + mark;
								} else {
									mark = 0;
									// totalScore = totalScore + mark;
								}
							} else {
								mark = 0;
								// totalScore = totalScore + mark;
							}
							payload['Q' + questionCount + ' ' + 'Score'] = mark;
						}
					} else {
						if (que && que.spinCatName !== null && que.spinCatName !== undefined) {
							payload['Q' + count + '(' + que.spinCatName + ')' + ' - ' + que.question] = 'NA';
							payload['Q' + questionCount + ' ' + 'Score'] = 'NA';
						} else {
							payload[que.question] = 'NA';
							payload['Q' + questionCount + ' ' + 'Score'] = 'NA';
						}
					}
				}

				payload['Total Score'] = totalScore;
				payload['Max Score'] = maxQueScore;
				finalData.push(payload);
			}

			// console.log('---finalData--', finalData);
		}

		if (flag) {
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Spin The Wheel Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Spin The Wheel Report', option);
		}
	}

	async downloadSurveySeeResult(index, flag) {
		let data: any = [];
		let header = [];
		let finalData = [];
		let downloadData = [];
		let sessionFeedBackScore = false;
		let minScore = 1;
		let questionSessionFeedbackScore = {};
		let questionGroupSessionFeedbackScore = [];
		let anonymous = false;

		if (!flag) {
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
				this.appService.getTranslation('Utils.success')
			);
		}

		//Add Question
		let question = this.sessionAllData[0].SessionWorksheets[index].SessionQuestions;
		anonymous = this.sessionAllData[0].SessionWorksheets[index].anonymous;

		header.push('Sr. No');
		if (!anonymous) {
			header.push('Learner');
		}

		// header.push('Task Response');
		let count = 0;
		for (let que of question) {
			let questionText;
			if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
				questionText = que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')';
			} else {
				questionText = que.question + ' (' + que.questionType + ')';
			}
			header.push(questionText.replaceAll(',', ''));
			questionSessionFeedbackScore[questionText.replaceAll(',', '')] = 0;
			count++;
			if (que && que.questionType == 'Geo Tag') {
				header.push(que.question + ' (' + 'Coordinates' + ')');
			}
		}

		for (let que of question) {
			if (
				que &&
				que.queGroupName !== null &&
				que.queGroupIndex !== null &&
				que.queGroupName !== undefined &&
				que.questionType == 'Rating scale'
			) {
				header.push('Session Feedback Score' + ' (' + que.queGroupName + ')');
				let payload_ = {};
				payload_['index'] = que.queGroupIndex;
				payload_[`Session Feedback Score (${que.queGroupName})`] = 0;
				questionGroupSessionFeedbackScore.push(payload_);
				// console.log('questionGroupSessionFeedbackScore1', questionGroupSessionFeedbackScore);
			}
		}

		if (this.sessionAllData[0].SessionWorksheets[index].sessionFeedback) {
			sessionFeedBackScore = true;
			header.push('Session Feedback Score (Total)');
			minScore = this.sessionAllData[0].SessionWorksheets[index].sessionFeedBackMinCount;
		}

		for (let sessionData of this.sessionAllData) {
			if (sessionData && sessionData.SessionWorksheets && sessionData.SessionWorksheets[index]) {
				let question = sessionData.SessionWorksheets[index];
				question.fullName =
					sessionData && sessionData.User && sessionData.User.fullName ? sessionData.User.fullName : '';
				data.push(question);
			}
		}	

		let questionSurveyUserRatingTotal = {}; 

		if (data && data.length > 0 && data[0].SessionQuestions && data[0].SessionQuestions.length > 0) {
			let srNo = 0;
			for (let userData of data) {
				srNo++;
				let payload = {};
				payload['Sr. No'] = srNo;
				if (!anonymous) {
					payload['Learner'] = userData.fullName ? userData.fullName : '';
				}
				let userName = userData.fullName ? userData.fullName : '';
				let sessionFeedbackScorePerUser = 0;
				let questionCount = 0;
				// if (userData.submit) {
				// 	payload['Task Response'] = 'Submitted';
				// } else {
				// 	payload['Task Response'] = 'Not Submitted';
				// }

				console.log('userData.SessionQuestions', userData.SessionQuestions);

				for (let que of userData.SessionQuestions) {
					questionCount++;
					if (
						que.questionType == 'Short answer' ||
						que.questionType == 'Long answer' ||
						que.questionType == 'Date' ||
						que.questionType == 'Date Time' ||
						que.questionType == 'Email' ||
						que.questionType == 'Mobile No'
					) {
						if (que.surveyNote) {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = que.surveyNote;
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = que.surveyNote;
							}
						}
					} else if (que.questionType == 'Geo Tag') {
						let latitude = que.latitude ? que.latitude : '-';
						let longitude = que.longitude ? que.longitude : '-';
						let cordinates = latitude + ' , ' + longitude;
						if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
							payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = que.geoLocation;
						} else {
							payload[que.question + ' (' + que.questionType + ')'] = que.geoLocation;
						}
						payload[que.question + ' (' + 'Coordinates' + ')'] = cordinates;
					} else if (que.questionType == 'File upload') {
						if (question && que.SessionQuestionSubmissions && que.SessionQuestionSubmissions.length > 0) {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = 'Yes';
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = 'Yes';
							}
							let count = 0;
							for (let file of que.SessionQuestionSubmissions) {
								count++;
								let fileType = file.fileName.split('.');
								let fileName;
								if (anonymous) {
									fileName = 'QNo_' + questionCount + '_' + count;
								} else {
									fileName = userName + '_QNo_' + questionCount + '_' + count;
								}
								let payload = {
									path: file.path,
									fileName: fileName + '.' + fileType[fileType.length - 1],
								};
								downloadData.push(payload);
							}
						} else {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = 'No';
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = 'No';
							}
						}
					} else if (que.questionType === 'Rating scale' && que.SurveyRatingType !== 'Text') {
						const key = `${que.question} (${que.questionType})`;

						if (que.surveyUserRating !== undefined && que.surveyUserRating !== null) {
							payload[key] = que.surveyUserRating.toString(); // safe for Excel
						}

						if (!questionSurveyUserRatingTotal[key]) {
							questionSurveyUserRatingTotal[key] = 0;
						}
						questionSurveyUserRatingTotal[key] += que.surveyUserRating;

						// 3. Add to per-user total score
						if (!sessionFeedbackScorePerUser) {
							sessionFeedbackScorePerUser = 0;
						}
						sessionFeedbackScorePerUser += que.surveyUserRating;

					} else {
						let index_ = null;
						for (let i = 0; i < questionGroupSessionFeedbackScore.length; i++) {
							if (questionGroupSessionFeedbackScore[i].index == que.queGroupIndex) {
								index_ = i;
							}
						}
						for (let option of que.SessionOptions) {
							if (option.selectedAns) {
								if (sessionFeedBackScore && que.questionType == 'Rating scale') {
									if (minScore == 0) {
										sessionFeedbackScorePerUser = sessionFeedbackScorePerUser + option.sr_no - 1;

										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											questionSessionFeedbackScore[
												que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
											] =
												questionSessionFeedbackScore[
													que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
												] +
												option.sr_no -
												1;

											for (let key in questionGroupSessionFeedbackScore[index_]) {
												if (key != 'index') {
													questionGroupSessionFeedbackScore[index_][key] =
														questionGroupSessionFeedbackScore[index_][key] + option.sr_no - 1;
												}
											}
										} else {
											questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] =
												questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] + option.sr_no - 1;
										}
									} else {
										sessionFeedbackScorePerUser = sessionFeedbackScorePerUser + option.sr_no;

										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											questionSessionFeedbackScore[
												que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
											] =
												questionSessionFeedbackScore[
													que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
												] + option.sr_no;

											for (let key in questionGroupSessionFeedbackScore[index_]) {
												if (key != 'index') {
													questionGroupSessionFeedbackScore[index_][key] =
														questionGroupSessionFeedbackScore[index_][key] + option.sr_no;
												}
											}
										} else {
											questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] =
												questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] + option.sr_no;
										}
									}
								}
								if (
									payload[que.question + ' (' + que.questionType + ')'] ||
									payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')']
								) {
									let temp;
									if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
										temp = payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'].split(',');
									} else {
										temp = payload[que.question + ' (' + que.questionType + ')'].split(',');
									}

									if (option.text == null || option.text == '') {
										if (minScore == 0) {
											temp.push(option.sr_no - 1);
										} else {
											temp.push(option.sr_no);
										}
									} else {
										temp.push(option.text);
									}

									if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
										payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = temp.toString();
									} else {
										payload[que.question + ' (' + que.questionType + ')'] = temp.toString();
									}
								} else {
									if (option.text == null || option.text == '') {
										if (minScore == 0) {
											if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
												payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] =
													option.sr_no - 1;
											} else {
												payload[que.question + ' (' + que.questionType + ')'] = option.sr_no - 1;
											}
										} else {
											if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
												payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = option.sr_no;
											} else {
												payload[que.question + ' (' + que.questionType + ')'] = option.sr_no;
											}
										}
									} else {
										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = option.text;
										} else {
											payload[que.question + ' (' + que.questionType + ')'] = option.text;
										}
									}
								}
							}
						}
					}
				}
				if (sessionFeedBackScore) {
					payload['Session Feedback Score (Total)'] = sessionFeedbackScorePerUser;
				}

				if (questionGroupSessionFeedbackScore.length > 0) {
					for (let item of questionGroupSessionFeedbackScore) {
						for (let key in item) {
							if (key != 'index') {
								payload[key] = item[key];
							}
						}
					}
				}

				finalData.push(payload);

				console.log('finalData', finalData);

			}

			if (sessionFeedBackScore || questionSurveyUserRatingTotal) {
				let emptyPayload = {};
				let scoredata = {};	
				let totalData;

				for (let key of header) {
					emptyPayload[key] = '';
					if (key === 'Learner' || key === 'Rating scale') {
						scoredata[key] = '';
					} else if (key === 'Sr. No') {
						scoredata[key] = 'Total';
					} else {
						// console.log('--data--', data);
						// console.log('-[key]-', key);
						// console.log('-questionSessionFeedbackScore-', questionSessionFeedbackScore);
						// console.log('-questionSessionFeedbackScore[key]-', questionSessionFeedbackScore[key]);
						if (questionSessionFeedbackScore[key]) {
							totalData = Number(questionSessionFeedbackScore[key] / data.length).toFixed(2);
							const data2 = totalData.toString().replace(/\.00$/, '');
							scoredata[key] = data2;
						} else if (questionSurveyUserRatingTotal[key]) {
							totalData = Number(questionSurveyUserRatingTotal[key] / data.length).toFixed(2);
							scoredata[key] = totalData.toString().replace(/\.00$/, '');
						} else {
							scoredata[key] = '';
						}
					}
				}
				finalData.push(emptyPayload);
				finalData.push(scoredata);
			}

			// console.log('---finalData--', finalData);
		}

		if (downloadData && downloadData.length > 0 && !flag) {
			let fileName = 'survey_' + this.sessionData.code;

			this.sessionTimelineService
				.downloadSubmissionAssetByAssetId(downloadData, fileName)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);

						link.download = 'survey_' + this.sessionData.code + '_report.zip';
						link.click();
					},
					(failed) => {
						console.log('Rejected', failed);
						this.spinnerService.hide();
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		} else if (flag) {
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Survey Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Survey Report', option);
		}
	}

	async downloadOfflineTaskSeeResult(index, flag) {
		let data: any = [];
		let header = [];
		let finalData = [];
		let downloadData = [];
		header.push('Sr. No');
		header.push('Learner Id');

		if (!flag) {
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
				this.appService.getTranslation('Utils.success')
			);
		}

		for (let sessionData of this.sessionAllData) {
			if (sessionData && sessionData.SessionWorksheets) {
				let question = sessionData.SessionWorksheets[index];
				question.fullName =
					sessionData && sessionData.User && sessionData.User.fullName ? sessionData.User.fullName : '';
				question.learnerId =
					sessionData && sessionData.User && sessionData.User.account_id ? sessionData.User.account_id : '';
				data.push(question);
			}
		}

		let count = 0;
		header.push('Task Response');
		for (let question of data[0].SessionQuestions) {
			count++;
			header.push(`Q${count} Text Response`);
			header.push(`Q${count} Media Response`);
			header.push(`Q${count} Grade`);
		}

		if (data.length > 0 && data[0].SessionQuestions && data[0].SessionQuestions.length > 0) {
			let srNo = 0;
			for (let ws of data) {
				let dataPayload = {};
				let questionCount = 0;
				srNo++;
				dataPayload['Sr. No'] = srNo;
				dataPayload['Learner Id'] = ws.learnerId;
				if (ws.submit) {
					dataPayload['Task Response'] = 'Submitted';
				} else {
					dataPayload['Task Response'] = 'Not Submitted';
				}
				for (let question of ws.SessionQuestions) {
					// console.log('question', question);
					//Learner Id
					questionCount++;
					let grade = 0;
					if (question.isTextResponse) {
						dataPayload[`Q${questionCount} Text Response`] = question.offlineTaskNote;
						if (question?.grade && parseInt(question.grade) > 0) {
							grade = grade + parseInt(question.grade);
						}
					} else {
						dataPayload[`Q${questionCount} Text Response`] = '';
					}

					if (question.isFileSubmission || question?.SessionQuestionSubmissions.length > 0) {
						if (question && question.SessionQuestionSubmissions && question.SessionQuestionSubmissions.length > 0) {
							dataPayload[`Q${questionCount} Media Response`] = 'Yes';
							let count = 0;

							for (let file of question.SessionQuestionSubmissions) {
								count++;
								if (file?.grade && parseInt(file.grade) > 0) {
									grade = grade + parseInt(file.grade);
								}
								let fileType = file.fileName.split('.');
								let downloadPayload = {
									path: file.path,
									fileName: ws.fullName + '_QNo_' + questionCount + '_' + count + '.' + fileType[fileType.length - 1],
									UploadedOnS3: file.UploadedOnS3,
								};
								downloadData.push(downloadPayload);
							}
						} else {
							dataPayload[`Q${questionCount} Media Response`] = 'No';
						}
					} else {
						dataPayload[`Q${questionCount} Media Response`] = 'No';
					}

					//For Grade grade
					dataPayload[`Q${questionCount} Grade`] = grade;
				}
				finalData.push(dataPayload);
			}
		}

		if (downloadData && downloadData.length > 0 && !flag) {
			let fileName = 'offline_task_' + this.sessionData.code;

			//get PreSignUrl
			//Then Download in the Zip File
			// console.log('------------------111-------------------');
			this.downLoadAwsS3Data(downloadData);
			// this.sessionTimelineService
			// 	.downloadSubmissionAssetByAssetId(downloadData, fileName)
			// 	.toPromise()
			// 	.then(
			// 		(res: any) => {
			// 			let link = document.createElement('a');
			// 			link.href = window.URL.createObjectURL(res);
			// 			link.download = 'offline_task_' + this.sessionData.code + '_report.zip';
			// 			link.click();
			// 		},
			// 		(failed) => {
			// 			console.log('Rejected', failed);
			// 			this.spinnerService.hide();
			// 		}
			// 	)
			// 	.catch((err) => {
			// 		console.log('Caught error', err);
			// 		this.spinnerService.hide();
			// 	});
		} else if (flag) {
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Offline Task Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Offline Task Report', option);
		}
	}

	async downloadLearnerContentDiscussionSeeResult(index, flag) {
		let data: any = [];
		let header = [];
		let finalData = [];
		header.push('Sr. No');
		header.push('Learner Id');
		header.push('Session Id');
		header.push('Workbook Id');
		header.push('Total Duration in Second');
		header.push('Watch Time in Second');
		header.push('Watch Time in Percentage');

		if (!flag) {
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
				this.appService.getTranslation('Utils.success')
			);
		}

		for (let sessionData of this.sessionAllData) {
			if (sessionData && sessionData.SessionWorksheets && sessionData.SessionWorksheets[index]) {
				let percentage = sessionData.SessionWorksheets[index].percent;
				let payload = {
					fullName: sessionData && sessionData.User && sessionData.User.fullName ? sessionData.User.fullName : '',
					learnerId: sessionData && sessionData.User && sessionData.User.account_id ? sessionData.User.account_id : '',
					SessionId: sessionData.SessionId,
					WorkbookId: sessionData.WorkbookId,
					duration: sessionData.SessionWorksheets[index].duration,
					seconds: sessionData.SessionWorksheets[index].seconds,
					percent: percentage ? percentage : 0 + '%',
				};

				data.push(payload);
			}
		}

		if (data.length > 0) {
			let srNo = 0;
			for (let ws of data) {
				let dataPayload = {};
				srNo++;
				dataPayload['Sr. No'] = srNo;
				dataPayload['Learner Id'] = ws.learnerId;
				dataPayload['Session Id'] = ws.SessionId;
				dataPayload['Workbook Id'] = ws.WorkbookId;
				dataPayload['Total Duration in Second'] = ws.duration ? ws.duration : 0;
				dataPayload['Watch Time in Second'] = ws.seconds ? ws.seconds : 0.0;
				dataPayload['Watch Time in Percentage'] = ws.percent ? ws.percent : 0;

				finalData.push(dataPayload);
			}
		}

		if (flag) {
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Video  Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Video Report', option);
		}
	}

	downloadLoadReport() {
		if (this.refreshSeeResultIndex != null) {
			let worksheetType =
				this.sessionAllData[0].SessionWorksheets.length > 0
					? this.sessionAllData[0].SessionWorksheets[this.refreshSeeResultIndex].type
					: '';
			if (worksheetType == 'Survey') {
				this.downloadSurveySeeResult(this.refreshSeeResultIndex, true);
			} else if (worksheetType == 'Offline Task') {
				this.downloadOfflineTaskSeeResult(this.refreshSeeResultIndex, true);
			} else if (worksheetType == 'Spin The Wheel') {
				this.downloadSpinTheWheelSeeResult(this.refreshSeeResultIndex, true);
			} else if (worksheetType == 'Learning Content' || worksheetType == 'Discussion') {
				this.downloadLearnerContentDiscussionSeeResult(this.refreshSeeResultIndex, true);
			}
		}
	}

	downloadUpaloedFile() {
		if (this.refreshSeeResultIndex != null) {
			let worksheetType =
				this.sessionAllData[0].SessionWorksheets.length > 0
					? this.sessionAllData[0].SessionWorksheets[this.refreshSeeResultIndex].type
					: '';
			// if (worksheetType == 'Survey') {
			// 	this.downloadSurveySeeResult(this.refreshSeeResultIndex, false);
			// } else
			if (worksheetType == 'Offline Task' || worksheetType == 'Survey') {
				this.downloadOfflineTaskSeeResult(this.refreshSeeResultIndex, false);
			}
		}
	}

	showUploadedData(showResultContainer) {
		this.showResultPopUp(
			this.allWorksheets[this.refreshSeeResultIndex],
			this.refreshSeeResultIndex,
			showResultContainer,
			false
		);
	}

	seeResultPopUp(index, orderResult, seeResultContainer?, comingfromRefreshButton?) {
		if (this.sessionAllData && this.sessionAllData.length > 0) {
			this.refreshSeeResultIndex = index;
			this.refreshSeeResultOrderResult = orderResult;
			this.workseetIndex = index + 1;
			this.description =
				this.sessionAllData[0].SessionWorksheets.length > 0
					? this.sessionAllData[0].SessionWorksheets[index].description
					: '';
			let worksheetType =
				this.sessionAllData[0].SessionWorksheets.length > 0 ? this.sessionAllData[0].SessionWorksheets[index].type : '';
			if ((worksheetType == 'Word Cloud' || worksheetType == 'Poll') && !orderResult) {
				this.worksheetType = worksheetType;
				this.showLearnerResponses(null, this.page, this.limit, seeResultContainer);
				return;
			}
			if (!orderResult) {
				this.worksheetType = worksheetType;
				if (
					worksheetType == 'Survey' ||
					worksheetType == 'Offline Task' ||
					worksheetType == 'Spin The Wheel' ||
					worksheetType == 'Learning Content' ||
					worksheetType == 'Discussion'
				) {
					this.spinnerService.show();
					this.sessionTimelineService.getSessionAllUsersAllData(this.sessionId).subscribe((res: any) => {
						if (res.success) {
							this.sessionAllData = [];
							this.sessionAllData = res.data;
							if (
								worksheetType == 'Survey' ||
								worksheetType == 'Offline Task' ||
								worksheetType == 'Spin The Wheel' ||
								worksheetType == 'Learning Content' ||
								worksheetType == 'Discussion'
							) {
								$('#downloadReportAndUploadedFiles').modal('show');
							}
							this.spinnerService.hide();
						}
					});

					return;
				}
			}

			if (worksheetType == 'Quiz (Randomised)') {
				this.seeResultQuestionCount = [];
				for (let sessionData of this.sessionAllData) {
					for (let question of sessionData.SessionWorksheets[index].SessionQuestions) {
						let flag = true;
						for (let que of this.seeResultQuestionCount) {
							if (que.question == question.question) {
								flag = false;
							}
						}
						if (flag) {
							this.seeResultQuestionCount.push({ question: question.question });
						}
					}
				}
			} else {
				this.seeResultQuestionCount =
					this.sessionAllData[0].SessionWorksheets.length > 0
						? this.sessionAllData[0].SessionWorksheets[index].SessionQuestions
						: [];
			}

			this.seeResultData = [];
			let correctResponse = {};
			let submited_Count = 0;

			let unlockflag = false;
			for (let workbook of this.sessionAllData) {
				let data = {
					account_id: '',
					fullName: '',
					total: 0,
					response: '',
					questions: [],
					rank: 0,
					status: null,
					attempt: null,
					action: null,
					worksheetId: null,
					SessionUserId: null,
					maxReAttemptsAllowed: 0,
				};
				data.fullName = workbook && workbook.User && workbook.User.fullName ? workbook.User.fullName : '';
				data.account_id = workbook && workbook.User && workbook.User.account_id ? workbook.User.account_id : '';
				data.total = 0;
				let worksheet = workbook.SessionWorksheets[index];
				if (!worksheet) {
					continue;
				}
				data.response = worksheet && worksheet.submit ? 'Submitted' : 'Not Submitted';

				if (worksheet && worksheet.submit) {
					submited_Count++;
				}

				let questions = [];
				if (orderResult && worksheet.submit === false && !worksheet.isQuizCompletion && !worksheet.isQuizAttempted) {
					continue;
				}
				if (worksheet && worksheet.SessionQuestions.length > 0) {
					if (worksheetType == 'Quiz (Randomised)') {
						for (let allquestion of this.seeResultQuestionCount) {
							let flag = true;
							for (let question of worksheet.SessionQuestions) {
								if (question.question == allquestion.question) {
									questions.push(question);
									flag = false;
								}
							}

							if (flag) {
								questions.push({ mark: null, userAnswer: '-', notfound: true });
							}
						}
					} else {
						questions = worksheet.SessionQuestions.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});
					}
				}
				data.total = worksheet?.score ? worksheet.score : 0;

				for (let que of questions) {
					// let outOffScore = que.spinQueScore;
					// // if (outOffScore <= 0 || !outOffScore) {
					// // 	outOffScore = 1;
					// // }
					if (que?.notfound) {
						data.questions.push({ userAnswer: '-', correctAns: false, wrongAns: false, QuestionId: que.QuestionId });
						if (!correctResponse.hasOwnProperty(que.QuestionId)) {
							correctResponse[que.QuestionId] = 0;
						}
					} else {
						if (que.questionType == 'MCQ') {
							let currectAnswer = [];
							let userAnswer = [];
							let count = 1;
							let options = [];
							let correctAns = false;
							let wrongAns = false;
							options = que.SessionOptions;
							// .sort((a, b) => {
							// 	if (a.id < b.id) {
							// 		return -1;
							// 	}
							// });

							// for (let option of options) {
							// 	if (option.correctAns) {
							// 		currectAnswer.push(count);
							// 	}
							// 	if (option.selectedAns) {
							// 		userAnswer.push(count);
							// 	}
							// 	count++;
							// }
							for (let option of options) {
								if (option.correctAns == option.selectedAns && option.selectedAns == true) {
									correctAns = true;
								} else if (option.selectedAns != option.correctAns) {
									wrongAns = true;
								}
								if (option.selectedAns) {
									userAnswer.push(option.sr_no);
								}
							}
							// if (currectAnswer.length >= userAnswer.length) {
							// 	for (let currect of currectAnswer) {
							// 		if (userAnswer.indexOf(currect) > -1) {
							// 			correctAns = true;
							// 		} else {
							// 			wrongAns = true;
							// 		}
							// 	}
							// } else if (currectAnswer.length > userAnswer.length) {
							// 	for (let userAns of userAnswer) {
							// 		if (currectAnswer.indexOf(userAns) > -1) {
							// 			correctAns = true;
							// 		} else {
							// 			wrongAns = true;
							// 		}
							// 	}
							// }
							// let mark = 0;
							// if (this.worksheetType == 'Spin The Wheel') {
							// if (correctAns && wrongAns) {
							// 	mark = que.spinQueScore / 2;
							// 	data.total = data.total + mark;
							// } else if (correctAns && !wrongAns) {
							// 	mark = que.spinQueScore;
							// 	data.total = data.total + mark;
							// }
							// data.total = worksheet.score;
							// } else {
							// if (correctAns && wrongAns) {
							// mark = outOffScore / 2;
							// data.total = data.total + mark;
							// } else if (correctAns && !wrongAns) {
							// mark = outOffScore;
							// data.total = data.total + outOffScore;
							// }
							// }

							data.questions.push({ userAnswer: userAnswer, correctAns, wrongAns, QuestionId: que.QuestionId });
							if (!correctResponse.hasOwnProperty(que.QuestionId)) {
								correctResponse[que.QuestionId] = 0;
							}

							if (correctAns) {
								correctResponse[que.QuestionId] = correctResponse[que.QuestionId] + 1;
							}
						} else if (que.questionType == 'Drag and Drop') {
							let isCorrectAnswer = true;
							if (que.SessionOptions && que.SessionOptions[0].userSeq) {
								for (let option of que.SessionOptions) {
									if (option.sr_no != option.userSeq) {
										isCorrectAnswer = false;
									}
								}
								let userAnswer = [];
								let userSequency = que.SessionOptions.sort((a, b) => {
									if (a.userSeq < b.userSeq) {
										return -1;
									}
								});

								for (let i = 0; i < userSequency.length; i++) {
									userAnswer.push(userSequency[i].sr_no);
								}

								// if (this.worksheetType == 'Spin The Wheel') {
								// 	// data.total = worksheet.score;
								// 	// console.log('----data.total--1----', data.total);
								// } else {
								// 	if (isCorrectAnswer) {
								// 		// data.total = data.total + outOffScore;
								// 		data.questions.push({
								// 			// mark: outOffScore,
								// 			userAnswer: userAnswer,
								// 			correctAns: true,
								// 			wrongAns: false,
								// 		});
								// 	} else {
								// 		// data.total = data.total + 0;
								// 		data.questions.push({ userAnswer: userAnswer, correctAns: false, wrongAns: true });
								// 	}
								// }

								if (isCorrectAnswer) {
									// data.total = data.total + outOffScore;
									data.questions.push({
										// mark: outOffScore,
										userAnswer: userAnswer,
										correctAns: true,
										wrongAns: false,
										QuestionId: que.QuestionId,
									});
									if (!correctResponse.hasOwnProperty(que.QuestionId)) {
										correctResponse[que.QuestionId] = 0;
									}

									correctResponse[que.QuestionId] = correctResponse[que.QuestionId] + 1;
								} else {
									// data.total = data.total + 0;
									data.questions.push({
										userAnswer: userAnswer,
										correctAns: false,
										wrongAns: true,
										QuestionId: que.QuestionId,
									});
									if (!correctResponse.hasOwnProperty(que.QuestionId)) {
										correctResponse[que.QuestionId] = 0;
									}
								}
							} else {
								// data.total = data.total + 0;
								data.questions.push({ userAnswer: [], correctAns: false, wrongAns: false, QuestionId: que.QuestionId });
								if (!correctResponse.hasOwnProperty(que.QuestionId)) {
									correctResponse[que.QuestionId] = 0;
								}
							}
						}
					}
				}

				if (worksheetType == 'Quiz') {
					if (worksheet.isQuizCompletion) {
						this.isQuizCompletion = true;
						if (!worksheet.submit && worksheet.isQuizAttempted) {
							data.status = 'Fail';
						} else if (!worksheet.submit && !worksheet.isQuizAttempted) {
							data.status = '-';
						} else {
							data.status = 'Pass';
						}

						data.attempt = worksheet.reAttemptsCount + '/' + worksheet.maxReAttemptsAllowed;
						data.action = worksheet.isReattemptLocked && data.status != 'Pass' ? 'Unlock Reattempts' : '-';
						data.worksheetId = worksheet.worksheetId;
						data.SessionUserId = worksheet.SessionUserId;
						data.maxReAttemptsAllowed = worksheet.maxReAttemptsAllowed;

						if (data.action == 'Unlock Reattempts') {
							unlockflag = true;
						} else {
							unlockflag = false;
						}
					}
				}

				this.seeResultData.push(data);
			}

			if (unlockflag) {
				this.showUnloackAllReattempts = true;
			} else {
				this.showUnloackAllReattempts = false;
			}

			console.log('-seeResultData-', this.seeResultData);

			for (let question of this.seeResultQuestionCount) {
				if (correctResponse.hasOwnProperty(question.QuestionId) && submited_Count > 0) {
					question.correctResponse = ((correctResponse[question.QuestionId] / submited_Count) * 100).toFixed(2);
				} else {
					question.correctResponse = '0.00';
				}
			}

			if (orderResult) {
				this.seeResultData = this.seeResultData.sort((a, b) => {
					if (a.total > b.total) {
						return -1;
					}
				});
				let rank = 0;
				for (let i = 0; i < this.seeResultData.length; i++) {
					if (i == 0) {
						rank++;
						this.seeResultData[i].rank = rank;
					} else if (this.seeResultData[i - 1].total != this.seeResultData[i].total) {
						rank++;
						this.seeResultData[i].rank = rank;
					} else {
						this.seeResultData[i].rank = rank;
					}
				}
				this.toppers = this.seeResultData;
			} else {
				// $('#seeResultModel').modal('show');
				if (!comingfromRefreshButton) {
					this.toggleFullscreen(seeResultContainer, index);
				}
			}
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.noparticipant'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	cancelSeeResultPopUp() {
		$('#seeResultModel').modal('hide');
	}

	showAttendancePopup() {
		$('#seeAttendanceModel').modal('show');
	}

	cancelAttendancePopup() {
		$('#seeAttendanceModel').modal('hide');
	}

	closingSeesion() {
		if (this.sessionUserId == this.userId || this.UserRoleId == 6 || this.UserRoleId == 7) {
			let sessionId = this.sessionId;
			this.router.navigate(['closing-session', { sessionId: sessionId }]);
		}
	}

	refreshSessioData() {
		if (this.startRefresh) {
			this.sessionTimelineService.getSessionWorksheets(this.sessionId).subscribe((res: any) => {
				this.allWorksheets = [];
				for (let worksheet of res.data) {
					if (!worksheet.trainerSurvey) {
						this.allWorksheets.push(worksheet);
					}
				}
			});
		}
	}

	formatting(event) {
		console.log(event);
	}

	getSeesionCardData(sessionId) {
		this.sessionTimelineService.getSessionCardData(sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionCardData = res.data;
				console.log('this.sessionCardData', this.sessionCardData);
			}
		});
	}

	downloadPhoto(item) {
		// console.log('---------item--------', item);
		let payload = {
			path: item.path,
		};
		this.sessionTimelineService
			.downloadAssetByAssetId(payload)
			.toPromise()
			.then(
				(res: any) => {
					let link = document.createElement('a');
					link.href = window.URL.createObjectURL(res);

					link.download = item.filename;
					link.click();
					this.toastr.success(
						this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
						this.appService.getTranslation('Utils.success')
					);
				},
				(failed) => {
					console.log('Rejected', failed);
					this.spinnerService.hide();
				}
			)
			.catch((err) => {
				console.log('Caught error', err);
				this.spinnerService.hide();
			});
	}

	downloadAllFile(data) {
		if (data && data.uploadedFiles && data.uploadedFiles.length > 0) {
			let payloadData = [];
			let count = 0;
			for (let uploadData of data.uploadedFiles) {
				let learnerName = uploadData.fullName ? uploadData.fullName : '';
				if (uploadData && uploadData.files && uploadData.files.length > 0) {
					for (let file of uploadData.files) {
						count++;
						let fileType = file.fileName.split('.');
						let payload = {
							path: file.path,
							fileName: learnerName + '_' + count + '.' + fileType[fileType.length - 1],
						};
						payloadData.push(payload);
					}
				}
			}

			this.sessionTimelineService
				.downloadSubmissionAssetByAssetId(payloadData, this.sessionData.code)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);
						link.download = this.sessionData.code + '_report.zip';
						link.click();
						this.toastr.success(
							this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
							this.appService.getTranslation('Utils.success')
						);
					},
					(failed) => {
						console.log('Rejected', failed);
						this.spinnerService.hide();
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		}
	}

	gotoSessionStepPage() {
		if (this.sessionUserId == this.userId || this.UserRoleId == 6 || this.UserRoleId == 7) {
			let sessionId = this.sessionId;
			this.router.navigate(['add-edit-session', { sessionId: sessionId, step: 4 }]);
		}
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	cancel() {
		this.router.navigate(['session']);
	}

	TrainerOnlyResponse() {
		this.sessionTimelineService.getTrainerOnlyReport(this.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.surveyOnlyTrainerData = res.data;
				$('#downloadTrainerSurveyReport').modal('show');
			}
		});
	}

	async downloadLoadTrainerOnlyReport(item, flag) {
		let data: any = [];
		let header = [];
		let finalData = [];
		let downloadData = [];
		let sessionFeedBackScore = false;
		let minScore = 1;
		let questionSessionFeedbackScore = {};
		let questionGroupSessionFeedbackScore = [];
		let anonymous = false;

		if (!flag) {
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.reportdownload'),
				this.appService.getTranslation('Utils.success')
			);
		}

		//Add Question
		let question = item.SessionQuestions;
		anonymous = item.anonymous;

		header.push('Sr. No');
		if (!anonymous) {
			header.push('Trainer');
		}
		// header.push('Task Response');
		for (let que of question) {
			let questionText;
			if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
				questionText = que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')';
			} else {
				questionText = que.question + ' (' + que.questionType + ')';
			}
			header.push(questionText.replaceAll(',', ''));
			questionSessionFeedbackScore[questionText.replaceAll(',', '')] = 0;
		}

		if (item.sessionFeedback) {
			sessionFeedBackScore = true;
			header.push('Session Feedback Score (Total)');
			minScore = item.sessionFeedBackMinCount;
		}

		for (let que of question) {
			if (
				que &&
				que.queGroupName !== null &&
				que.queGroupIndex !== null &&
				que.queGroupName !== undefined &&
				que.questionType == 'Rating scale'
			) {
				header.push('Session Feedback Score' + ' (' + que.queGroupName + ')');
				let payload_ = {};
				payload_['index'] = que.queGroupIndex;
				payload_[`Session Feedback Score (${que.queGroupName})`] = 0;
				questionGroupSessionFeedbackScore.push(payload_);
				// console.log('questionGroupSessionFeedbackScore1', questionGroupSessionFeedbackScore);
			}
		}

		if (this.surveyOnlyTrainerData && this.surveyOnlyTrainerData.SessionWorksheets) {
			let question = item;
			question.fullName =
				this.surveyOnlyTrainerData && this.surveyOnlyTrainerData.User && this.surveyOnlyTrainerData.User.fullName
					? this.surveyOnlyTrainerData.User.fullName
					: '';
			data.push(question);
		}

		if (data.length > 0 && data[0].SessionQuestions && data[0].SessionQuestions.length > 0) {
			let srNo = 0;
			for (let userData of data) {
				srNo++;
				let payload = {};
				payload['Sr. No'] = srNo;
				if (!anonymous) {
					payload['Trainer'] = userData.fullName ? userData.fullName : '';
				}
				let userName = userData.fullName ? userData.fullName : '';
				let sessionFeedbackScorePerUser = 0;
				let questionCount = 0;

				for (let que of userData.SessionQuestions) {
					questionCount++;
					if (que.questionType == 'Short answer' || que.questionType == 'Long answer') {
						if (que.surveyNote) {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = que.surveyNote;
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = que.surveyNote;
							}
						}
					} else if (que.questionType == 'File upload') {
						if (question && que.SessionQuestionSubmissions && que.SessionQuestionSubmissions.length > 0) {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = 'Yes';
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = 'Yes';
							}
							let count = 0;
							for (let file of que.SessionQuestionSubmissions) {
								count++;
								let fileType = file.fileName.split('.');
								let fileName;
								if (anonymous) {
									fileName = 'QNo_' + questionCount + '_' + count;
								} else {
									fileName = userName + '_QNo_' + questionCount + '_' + count;
								}
								let payload = {
									path: file.path,
									fileName: fileName + '.' + fileType[fileType.length - 1],
								};
								downloadData.push(payload);
							}
						} else {
							if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
								payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = 'No';
							} else {
								payload[que.question + ' (' + que.questionType + ')'] = 'No';
							}
						}
					} else {
						let index_ = null;
						for (let i = 0; i < questionGroupSessionFeedbackScore.length; i++) {
							if (questionGroupSessionFeedbackScore[i].index == que.queGroupIndex) {
								index_ = i;
							}
						}
						for (let option of que.SessionOptions) {
							if (option.selectedAns) {
								if (sessionFeedBackScore && que.questionType == 'Rating scale') {
									if (minScore == 0) {
										sessionFeedbackScorePerUser = sessionFeedbackScorePerUser + option.sr_no - 1;

										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											questionSessionFeedbackScore[
												que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
											] =
												questionSessionFeedbackScore[
													que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
												] +
												option.sr_no -
												1;

											for (let key in questionGroupSessionFeedbackScore[index_]) {
												if (key != 'index') {
													questionGroupSessionFeedbackScore[index_][key] =
														questionGroupSessionFeedbackScore[index_][key] + option.sr_no - 1;
												}
											}
										} else {
											questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] =
												questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] + option.sr_no - 1;
										}
									} else {
										sessionFeedbackScorePerUser = sessionFeedbackScorePerUser + option.sr_no;

										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											questionSessionFeedbackScore[
												que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
											] =
												questionSessionFeedbackScore[
													que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'
												] + option.sr_no;

											for (let key in questionGroupSessionFeedbackScore[index_]) {
												if (key != 'index') {
													questionGroupSessionFeedbackScore[index_][key] =
														questionGroupSessionFeedbackScore[index_][key] + option.sr_no;
												}
											}
										} else {
											questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] =
												questionSessionFeedbackScore[que.question + ' (' + que.questionType + ')'] + option.sr_no;
										}
									}
								}
								if (
									payload[que.question + ' (' + que.questionType + ')'] ||
									payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')']
								) {
									let temp;
									if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
										temp = payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'].split(',');
									} else {
										temp = payload[que.question + ' (' + que.questionType + ')'].split(',');
									}

									if (option.text == null || option.text == '') {
										if (minScore == 0) {
											temp.push(option.sr_no - 1);
										} else {
											temp.push(option.sr_no);
										}
									} else {
										temp.push(option.text);
									}

									if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
										payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = temp.toString();
									} else {
										payload[que.question + ' (' + que.questionType + ')'] = temp.toString();
									}
								} else {
									if (option.text == null || option.text == '') {
										if (minScore == 0) {
											if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
												payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] =
													option.sr_no - 1;
											} else {
												payload[que.question + ' (' + que.questionType + ')'] = option.sr_no - 1;
											}
										} else {
											if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
												payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = option.sr_no;
											} else {
												payload[que.question + ' (' + que.questionType + ')'] = option.sr_no;
											}
										}
									} else {
										if (que && que.queGroupName !== null && que.queGroupName !== undefined) {
											payload[que.queGroupName + ': ' + que.question + ' (' + que.questionType + ')'] = option.text;
										} else {
											payload[que.question + ' (' + que.questionType + ')'] = option.text;
										}
									}
								}
							}
						}
					}
				}

				if (sessionFeedBackScore) {
					payload['Session Feedback Score (Total)'] = sessionFeedbackScorePerUser;
				}

				if (questionGroupSessionFeedbackScore.length > 0) {
					for (let item of questionGroupSessionFeedbackScore) {
						for (let key in item) {
							if (key != 'index') {
								payload[key] = item[key];
							}
						}
					}
				}

				finalData.push(payload);
			}

			if (sessionFeedBackScore) {
				let emptyPayload = {};
				let scoredata = {};
				for (let key of header) {
					emptyPayload[key] = '';
					if (['Sr. No', 'Trainer'].indexOf(key) > -1 || key.indexOf('Rating scale') == -1) {
						scoredata[key] = '';
					} else {
						scoredata[key] = Number(questionSessionFeedbackScore[key] / data.length).toFixed(2);
					}
				}
				finalData.push(emptyPayload);
				finalData.push(scoredata);
			}
			// console.log('---finalData--', finalData);
		}

		if (downloadData && downloadData.length > 0 && !flag) {
			let fileName = 'survey_' + this.sessionData.code;

			this.sessionTimelineService
				.downloadSubmissionAssetByAssetId(downloadData, fileName)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);

						link.download = 'survey_' + this.sessionData.code + '_report.zip';
						link.click();
					},
					(failed) => {
						console.log('Rejected', failed);
						this.spinnerService.hide();
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		} else if (flag) {
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Trainer Only Survey Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Trainer Only Survey Report', option);
		}
	}

	showLearnerResponses(type = null, page, limit, seeSubmissionContainer?, comingfromRefreshButton?) {
		//Hide Current Modal
		if (type) {
			this.worksheetType = type;
		}
		$('#downloadReportAndUploadedFiles').modal('hide');
		//show Learner Responses Modal

		this.spinnerService.show();
		//Get User Data
		let payload = { sessionId: this.sessionId, index: this.refreshSeeResultIndex };
		this.learnerResponsesData = [];
		this.inputSearchTxt = null;
		this.sessionTimelineService.getSessionWorksheetLearnerResponse(payload, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				this.learnerResponsesData = res.data;
				this.afterFinalLearnerResponsesData = res.data;
				this.totalCount = res.count;
				if (this.learnerResponsesData && this.learnerResponsesData.length > 0) {
					// $('#learnerResponses').modal('show');
					if (!comingfromRefreshButton) {
						this.toggleFullscreen(seeSubmissionContainer, this.currentIndex);
					}
				} else {
					//Show Learner Count 0 tostor Message
					this.toastr.warning(
						this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.noparticipant'),
						this.appService.getTranslation('Utils.warning')
					);
					$('#learnerResponses').modal('hide');
					this.page = 1;
				}
			}
		});
	}

	getLearnerByFilter(text) {
		if (text.length > 0) {
			this.afterFinalLearnerResponsesData = [];
			for (let item of this.learnerResponsesData) {
				if (
					item.account_id.toLowerCase().includes(text.toLowerCase()) ||
					item.fullName.toLowerCase().includes(text.toLowerCase()) ||
					item.submit_status.toLowerCase().includes(text.toLowerCase())
				) {
					this.afterFinalLearnerResponsesData.push(item);
				}
			}
		} else {
			this.afterFinalLearnerResponsesData = [];
			this.afterFinalLearnerResponsesData = this.learnerResponsesData;
		}
	}

	getQuizLearnerByFilter(text: string) {
		if (!this.originalSeeResultData) {
			this.originalSeeResultData = [...this.seeResultData];
		}

		if (text.length > 0) {
			const filteredData = [];

			for (let item of this.originalSeeResultData) {
				const matchesBasic =
					item.account_id?.toLowerCase().includes(text.toLowerCase()) ||
					item.fullName?.toLowerCase().includes(text.toLowerCase()) ||
					item.response?.toLowerCase().includes(text.toLowerCase());

				let matchesExtra = false;
				if (this.isQuizCompletion) {
					matchesExtra =
						item.status?.toString().toLowerCase().includes(text.toLowerCase()) ||
						// item.attempt?.toString().toLowerCase().includes(text.toLowerCase()) ||
						item.action?.toString().toLowerCase().includes(text.toLowerCase());
				}

				if (matchesBasic || matchesExtra) {
					filteredData.push(item);
				}
			}

			this.seeResultData = filteredData;
		} else {
			this.seeResultData = [...this.originalSeeResultData];
		}
	}

	//Download AWS S3
	downLoadAwsS3Data(data) {
		//Get Pre SignURLS
		let payload = { files: [] };
		for (let file of data) {
			if (file?.UploadedOnS3) {
				payload.files.push(file.path);
			} else if (file.path) {
				let data = file;
				if (!data.fileName) {
					data.filename = data.path.replace('uploads/learner_submission', '');
				}
				this.downloadPhoto(data);
			}
		}
		this.sessionTimelineService.getAllPreSignedUrlForDownload(payload).subscribe(async (res: any) => {
			if (res.success) {
				if (res && res.urls) {
					// const files = {};

					// let count = 0;
					for (let data of res.urls) {
						// const response = await this.fetchBlob(url.url);
						// files[url.fileName] = new Uint8Array(await response.arrayBuffer());
						// count++;
						// if (count === res.urls.length) {
						// 	try {
						// 		zip(files, (err, zipped) => {
						// 			if (err) {
						// 				console.error('Error generating zip file:', err);
						// 			} else {
						// 				this.downloadBlob(new Blob([zipped]), 'offline_task_' + this.sessionData.code + '_report.zip');
						// 			}
						// 		});
						// 	} catch (zipError) {
						// 		console.error('Error generating zip file:', zipError);
						// 	}
						// }
						this.sessionTimelineService.downloadAwsS3File(data.url).subscribe(
							(blob) => {
								const url = window.URL.createObjectURL(blob);
								const a = document.createElement('a');
								a.href = url;
								a.download = data.fileName; // replace with the desired file name
								a.click();
								window.URL.revokeObjectURL(url);
							},
							(error) => {
								console.error('Download failed', error);
							}
						);
					}
				}
			}
		});
	}
	// Function to download the generated ZIP file
	downloadBlob(blob: Blob, filename: string) {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url); // Clean up
	}
	async fetchBlob(url: string): Promise<Blob> {
		const response = await fetch(url);
		return response.blob();
	}

	onPageChangeEvent(evnt, seeSubmissionContainer) {
		this.page = evnt;
		this.showLearnerResponses(null, this.page, this.limit, seeSubmissionContainer, true);
	}

	changeResult(count, seeSubmissionContainer) {
		if (count == 'all') {
			this.limit = count;
			this.showLearnerResponses(null, this.page, this.limit, seeSubmissionContainer, true);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.showLearnerResponses(null, this.page, this.limit, seeSubmissionContainer, true);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.showLearnerResponses(null, this.page, this.limit, seeSubmissionContainer, true);
		}
	}

	cancelLearnerResponsePopup() {
		$('#learnerResponses').modal('hide');
		this.page = 1;
	}

	//full screen view
	get currentMedia() {
		return this.fullScreenMedia[this.currentIndex];
	}

	showNextMedia() {
		if (this.currentIndex < this.fullScreenMedia.length - 1) {
			this.currentIndex++;
			this.showNextVideo = false;
			setTimeout(() => {
				this.showNextVideo = true;
			}, 500);
		}
	}

	showPrevMedia() {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			this.showNextVideo = false;
			setTimeout(() => {
				this.showNextVideo = true;
			}, 500);
		}
	}

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			this.showNextMedia();
		} else if (event.key === 'ArrowLeft') {
			this.showPrevMedia();
		}
	}

	ngOnDestroy() {
		document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler.bind(this));
	}

	fullscreenChangeHandler() {
		this.isFullscreen = !!document.fullscreenElement;
		if (!this.isFullscreen) {
			this.closeEntireFullscreen();
		}
	}

	toggleFullscreen(element: HTMLElement, i?) {
		this.scrollPosition = window.scrollY;
		this.currentIndex = i;
		if (!this.isFullscreen) {
			this.isFullscreen = true;
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if ((element as any).webkitRequestFullscreen) {
				(element as any).webkitRequestFullscreen();
			} else if ((element as any).msRequestFullscreen) {
				(element as any).msRequestFullscreen();
			}
		} else {
			setTimeout(() => {
				this.isFullscreen = false;
				if (document.fullscreenElement) {
					if (document.exitFullscreen) {
						document.exitFullscreen();
						document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler.bind(this));
					}
				}
				this.showFullscreenLoader = false;
			}, 100);
		}
	}

	closeEntireFullscreen() {
		setTimeout(() => {
			this.showTimeLinePage = false;
		}, 1);

		setTimeout(() => {
			this.showTimeLinePage = true;
		}, 1);

		window.scrollTo(0, this.scrollPosition);
		this.page = 1;
		this.showFullscreenLoader = false;
	}

	backToWorksheet() {
		// console.log('-escape-');
		this.isFullscreen = false;
		this.showFullscreenLoader = false;
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	//offlien task grade
	submitGraded() {
		this.isediGraded = false;
		this.updateLearnerOfflineTaskAssetGrade();
	}

	editGraded() {
		this.isediGraded = true;
	}

	updateLearnerOfflineTaskAssetGrade() {
		let payload = [];
		this.gradedCount = 0;
		let temp = {};
		for (let data of this.questionUploadedAsset) {
			if (data.grade != null && data.grade != '') {
				this.gradedCount++;
			}

			let grade = data.grade ? parseInt(data.grade) : 0;
			if (data.SessionQuestionId && data.grade) {
				if (temp.hasOwnProperty(data.SessionQuestionId)) {
					temp[data.SessionQuestionId] = temp[data.SessionQuestionId] + grade;
				} else {
					temp[data.SessionQuestionId] = grade;
				}
			} else if (data.id && data.grade) {
				if (temp.hasOwnProperty(data.id)) {
					temp[data.id] = temp[data.id] + grade;
				} else {
					temp[data.id] = grade;
				}
			}

			payload.push({
				id: data.id,
				grade: data.grade,
				isFileSubmission: data.isFileSubmission,
				isTextResponse: data.isTextResponse,
			});
		}
		let flag = false;
		let tempArray = [];

		for (let key in temp) {
			if (temp[key] > 5) {
				flag = true;
				tempArray.push(parseInt(key));
			}
		}
		// console.log('tempArray', tempArray);
		if (flag) {
			for (let item of this.questionUploadedAsset) {
				if (
					(item.SessionQuestionId && tempArray.indexOf(item.SessionQuestionId) > -1) ||
					(item.id && tempArray.indexOf(item.id) > -1)
				) {
					item.grade = null;
				}
			}
			this.toastr.error(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.gradeError'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}

		this.sessionTimelineService.updateOfflineGrade({ gradeData: payload }).subscribe((res: any) => {
			if (res.success) {
				// console.log('-------res-----', res.message);
			}
		});
		// this.analyticsService
		// 	.updateLearnerOfflineTaskAssetGrade({
		// 		data: this.selectedOfflineTaskDetails,
		// 		details: this.allOfflineTaskData,
		// 	})
		// 	.subscribe((res: any) => {
		// 		if (res.success) {
		// 			this.gradedCount = res.gradeCount;
		// 			this.totalGradedableCount = res.totalGradedableCount;
		// 		}
		// 	});
	}

	getAssetsFilter(text) {
		if (text.length > 2) {
			this.questionUploadedAsset = [];
			for (let userData of this.backupquestionUploadedAsset) {
				if (userData.account_id.indexOf(text) > -1) {
					this.questionUploadedAsset.push(userData);
				}
			}
		} else if (text.length == 0) {
			this.offlineTaskSearchText = null;
			this.questionUploadedAsset = [...this.backupquestionUploadedAsset];
		}
	}

	downloadLearnerUploadedFile(item, index) {
		this.toastr.success(
			this.appService.getTranslation('Utils.fileDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		let payload = { files: [item.fileName] };

		// console.log('------------------item---------------', item);
		if (item.UploadedOnS3) {
			this.sessionTimelineService.getAllPreSignedUrlForDownload(payload).subscribe((res: any) => {
				if (res.success) {
					this.sessionTimelineService.downloadAwsS3File(res.urls[0].url).subscribe(
						(blob) => {
							const url = window.URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = item.fileName; // replace with the desired file name
							a.click();
							window.URL.revokeObjectURL(url);
						},
						(error) => {
							console.error('Download failed', error);
						}
					);
				}
			});
		} else {
			let data = item;
			data.filename = data.path.replace('uploads/learner_submission', '');
			this.downloadPhoto(data);
		}
	}

	downloadLearnerUploadedFileInZipFormat() {}

	getPassingUserData(SessionId) {
		this.sessionTimelineService.getPassedUserData(SessionId).subscribe((res: any) => {
			if (res.success) {
				// console.log('---------req.data', res.data);
				$('#learnerPassed').modal('show');
				this.passedLearnerList = res.data;
				this.afterFinalLearnerPassedData = res.data;
			}
		});
	}

	updatePassingUserData(SessionId) {
		this.toastr.success(
			this.appService.getTranslation('Pages.Session.AddEdit.Toaster.assigncertificatetolearners'),
			this.appService.getTranslation('Utils.success')
		);
		this.sessionTimelineService.confirmPassedUserData(SessionId).subscribe((res: any) => {
			if (res.success) {
				// console.log('---------req.data', res.data);
				$('#learnerPassed').modal('hide');
			}
		});
	}

	cancelLearnerPassPopup() {
		$('#learnerPassed').modal('hide');
	}

	getPassLearnerByFilter(text) {
		if (text.length > 0) {
			this.afterFinalLearnerPassedData = [];
			for (let item of this.passedLearnerList) {
				if (item) {
					const firstName = item.first ? item.first.trim() : '';
					const lastName = item.last ? item.last.trim() : '';
					const fullName = `${firstName} ${lastName}`.trim();
					const id = item.id ? item.id.toString() : '';

					if (
						firstName.toLowerCase().includes(text.toLowerCase()) ||
						lastName.toLowerCase().includes(text.toLowerCase()) ||
						fullName.toLowerCase().includes(text.toLowerCase()) ||
						id.includes(text.toLowerCase())
					) {
						// Add a fullName property to the item for consistency
						this.afterFinalLearnerPassedData.push({ ...item, fullName });
					}
				}
			}
		} else {
			this.afterFinalLearnerPassedData = [...this.passedLearnerList];
		}
	}

	async exportViewAttendanceToCsv() {
		let finalData = [];
		if (this.allParticipants && this.allParticipants.length > 0) {
			let count = 0;
			for (let item of this.allParticipants) {
				count++;
				let payload = {
					'Sr No': count,
					'Learner Id': item && item.User ? item.User.account_id : '',
					'Learner Name': item && item.User ? item.User.fullName : '',
					'Attendance Status': item.attendanceStatus,
					'Trainer Note': item.trainerNote ? item.trainerNote : '',
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
			title: 'Export Report',
			useBom: false,
			noDownload: false,
			headers: ['Sr No', 'Learner Id', 'Learner Name', 'Attendance Status', 'Trainer Note'],
		};
		finalData = await this.appService.sanitizedData(finalData);
		this.appService.checkNotifcation = true;
		const fileInfo = new ngxCsv(finalData, 'Export Report', option);
	}

	async exportLearnerSubmissionToCsv() {
		let finalData = [];
		if (this.afterFinalLearnerResponsesData && this.afterFinalLearnerResponsesData.length > 0) {
			let count = 0;
			for (let item of this.afterFinalLearnerResponsesData) {
				count++;
				let payload = {
					'Sr No': count,
					'Learner Id': item && item.account_id ? item.account_id : '',
					'Learner Name': item && item.fullName ? item.fullName : '',
					[`${this.worksheetType} Responses`]: item.submit_status,
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
			title: 'Export Report',
			useBom: false,
			noDownload: false,
			headers: ['Sr No', 'Learner Id', 'Learner Name', [`${this.worksheetType} Responses`]],
		};
		finalData = await this.appService.sanitizedData(finalData);
		this.appService.checkNotifcation = true;
		const fileInfo = new ngxCsv(finalData, 'Export Report', option);
	}

	async exportLearnerQuizSubmissionToCsv() {
		let finalData = [];
		let headers = ['Sr No', 'Learner Id', 'Learner Name', 'Quiz Responses', 'Total Marks'];

		// Conditionally add additional headers
		if (this.isQuizCompletion) {
			headers.push('Status');
		}

		if (this.seeResultData && this.seeResultData.length > 0) {
			let count = 0;
			if (this.seeResultQuestionCount && this.seeResultQuestionCount.length > 0) {
				this.seeResultQuestionCount.forEach((qus, index) => {
					const sanitizedQuestion = qus.question ? qus.question.replace(/,/g, ' ') : '';
					headers.push(`Q ${index + 1}: ${sanitizedQuestion} (Correct Responses : ${qus.correctResponse}%)`);
				});
			}

			for (let participant of this.seeResultData) {
				count++;
				let payload = {
					'Sr No': count,
					'Learner Id': participant && participant.account_id ? participant.account_id : '',
					'Learner Name': participant && participant.fullName ? participant.fullName : '',
					'Quiz Responses': participant && participant.response ? participant.response : '',
					'Total Marks': participant.total,
				};

				// Add conditional fields
				if (this.isQuizCompletion) {
					payload['Status'] = participant.status || '-';
					// payload['Attempt'] = participant.attempt || '';
					// payload['Action'] = participant.action || '-';
				}

				if (participant.questions && participant.questions.length > 0) {
					let index = 0;
					for (let answer of participant.questions) {
						const question = this.seeResultQuestionCount[index]?.question || '';
						const sanitizedQuestion = question ? question.replace(/,/g, ' ') : '';
						const userAnswer = answer.userAnswer || '';
						payload[
							`Q ${index + 1}: ${sanitizedQuestion} (Correct Responses : ${
								this.seeResultQuestionCount[index].correctResponse
							}%)`
						] = userAnswer ? userAnswer.toString() : '';
						index++;
					}
				}
				finalData.push(payload);
			}
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
			headers: headers,
		};
		finalData = await this.appService.sanitizedData(finalData);
		this.appService.checkNotifcation = true;
		const fileInfo = new ngxCsv(finalData, 'Export Report', option);
	}

	AddRecodSessionLink() {
		if (this.sessionUserId == this.userId || this.UserRoleId == 6 || this.UserRoleId == 7) {
			this.RecordSessionLinkError = false;
			this.RecordSessionValidLinkError = false;
			if (this.recordedSessionLink != null && this.recordedSessionLink != '') {
				this.showViewRecordButton = true;
			}
			$('#recordSessionLinkModel').modal('show');
		}
	}

	cancelRecordSessionLinkPopUp() {
		this.RecordSessionLinkError = false;
		this.RecordSessionValidLinkError = false;
		this.showViewRecordButton = false;
		$('#recordSessionLinkModel').modal('hide');
	}

	saveRecordSessionLink(flag) {
		if (flag && (this.RecordSessionLinkError || this.RecordSessionValidLinkError)) {
			return;
		}

		let payload = {
			sessionId: this.sessionId,
			recordedSessionLink: this.recordedSessionLink,
		};

		if (this.recordedSessionLink != null && this.recordedSessionLink != '') {
			if (!flag) {
				payload.recordedSessionLink = null;
			}

			this.sessionTimelineService.addRecordedSessionLink(payload).subscribe((res: any) => {
				if (res.success) {
					this.recordedSessionLink = res.data;
					$('#recordSessionLinkModel').modal('hide');
					if (flag) {
						this.showViewRecordButton = true;
						this.toastr.success(
							this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.recodedLink'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.showViewRecordButton = false;
						this.toastr.success(
							this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.deleterecodedLink'),
							this.appService.getTranslation('Utils.success')
						);
					}
				}
			});
		}
	}

	checkSessionRecordLink(char: string) {
		if (char.length === 0) {
			this.RecordSessionLinkError = true;
			this.RecordSessionValidLinkError = false; // Reset valid link error
			return;
		} else {
			this.RecordSessionLinkError = false;
		}

		// Ensure input starts with http:// or https://
		if (!/^https?:\/\//i.test(char)) {
			this.RecordSessionValidLinkError = true;
			return;
		}

		try {
			const url = new URL(char);
			const validProtocol = url.protocol === 'http:' || url.protocol === 'https:';

			// Extract hostname (without subdomains like www)
			const hostname = url.hostname.replace(/^www\./, '');

			// Ensure the domain has at least one dot (SLD.TLD)
			if (!hostname.includes('.')) {
				this.RecordSessionValidLinkError = true;
				return;
			}

			const hostnameParts = hostname.split('.');
			const sld = hostnameParts[hostnameParts.length - 2]; // Second-Level Domain
			const tld = hostnameParts[hostnameParts.length - 1]; // Top-Level Domain

			// Ensure SLD is at least 2 characters and only alphanumeric
			const validSLD = /^[a-zA-Z0-9-]{2,}$/.test(sld);

			// Ensure TLD is at least 2 characters and only alphabetic
			const validTLD = /^[a-zA-Z]{2,}$/.test(tld) && tld.length >= 2;

			// Ensure both SLD and TLD are valid
			const validHostname = validSLD && validTLD;

			this.RecordSessionValidLinkError = !(validProtocol && validHostname);
		} catch (_) {
			this.RecordSessionValidLinkError = true;
		}
	}

	viewRecordSessionLink() {
		if (this.recordedSessionLink != null && this.recordedSessionLink != '') {
			window.open(`${this.recordedSessionLink}`, '_blank');
		}
	}

	setBarChartOptions(data: any[]): any {
		const customColors = ['#215968', '#01bfbd', '#ff66c4', '#5271ff'];
		const maxLabelLength = 34;

		const coloredData = data.map((item, index) => {
			const color = customColors[index] || undefined;
			return {
				name: item.name,
				value: item.value,
				itemStyle: color ? { color } : {},
			};
		});

		return {
			tooltip: {
				trigger: 'axis',
				textStyle: {
					fontSize: 18,
				},
				axisPointer: {
					type: 'shadow',
				},
				extraCssText: 'width:15.625rem; white-space:pre-wrap;',
				formatter: function (params: any) {
					const label = params[0].name; // Full label
					const value = params[0].value;
					return `<b>${label}</b><br/>Votes: ${value}`;
				},
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: 50,
				containLabel: true,
			},
			xAxis: {
				type: 'category',
				data: data.map((item) => item.name),
				extraCssText: 'width:200px; white-space:pre-wrap;',
				axisLabel: {
					interval: 0,
					rotate: 0,
					width: 100,
					fontSize: 18,
					overflow: 'truncate',
					formatter: function (value: string) {
						const displayText = value.length > maxLabelLength ? value.slice(0, maxLabelLength) + '…' : value;
						return `{tooltipStyle|${displayText}}`;
					},
					rich: {
						tooltipStyle: {
							width: 100,
							overflow: 'truncate',
							lineHeight: 18,
							align: 'center',
						},
					},
				},
				axisTick: {
					alignWithLabel: true,
				},
			},
			yAxis: {
				type: 'value',
			},
			series: [
				{
					name: 'Votes',
					type: 'bar',
					barWidth: '60%',
					data: coloredData,
				},
			],
		};
	}

	getPieOptions(data: any[]): any {
		const maxLabelLength = 29;
		const filteredData = data.filter((item) => item.value > 0);

		let showSelectedOption: string[] = [];

		const customColors = ['#215968', '#01bfbd', '#ff66c4', '#5271ff'];

		const coloredData = filteredData.map((item, index) => {
			if (item.value > 0) {
				showSelectedOption.push(item.name);
			}
			return {
				...item,
				itemStyle: index < customColors.length ? { color: customColors[index] } : {},
			};
		});

		return {
			tooltip: {
				trigger: 'item',
				extraCssText: 'width:15.625rem; white-space:pre-wrap;',
				formatter: function (params: any) {
					const fullName = params.name;
					const value = params.value;
					const percent = params.percent;
					return `<b>${fullName}</b><br/>Votes: ${value} (${percent}%)`;
				},
			},

			legend: {
				type: 'scroll',
				orient: 'horizontal',
				left: 'center',
				// align: 'center',
				bottom: '10%',
				selected: showSelectedOption,				
				itemWidth: 14,
				itemHeight: 14,
				textStyle: {					
					width: 160,
					overflow: 'truncate',					
					fontSize: 18,
					lineHeight: 18,																		
				},
				formatter: function (name: string) {
					const truncatedName = name.length > maxLabelLength ? name.slice(0, maxLabelLength) + '…' : name;
					return `${truncatedName}`;
				},
				
			},
			series: [
				{
					name: 'Votes',
					type: 'pie',
					radius: '76%',
					center: ['50%', '40%'],
					data: coloredData,
					label: {
						show: true,
						fontSize: 20,
					},
					// data: coloredData.map(item => ({
					// 	...item,
					// 	name: item.name.length > maxLabelLength
					// 		? item.name.slice(0, maxLabelLength) + '…'
					// 		: item.name
					// })),
					// label: {
					// 	show: true,
					// 	formatter: function (param: any) {
					// 		const name = param.name || '';
					// 		const shortName = name.length > maxLabelLength
					// 			? name.slice(0, maxLabelLength) + '…'
					// 			: name;
					// 		return shortName;
					// 	}
					// },
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)',
						},
					},
				},
			],
		};
	}

	unlockreAttemptsOfLearner(data?) {
		let payload = {
			sessionId: this.sessionId,
			index: this.refreshSeeResultIndex,
			worksheetId: data && data.worksheetId ? data.worksheetId : null,
			SessionUserId: data && data.SessionUserId ? data.SessionUserId : null,
		};

		// show custom loader after fullscreen active
		this.showFullscreenLoader = true;
		this.sessionTimelineService.unlockQuizreAttemptsOfLearner(payload).subscribe((res: any) => {
			if (res.success) {
				this.showFullscreenLoader = false;
				this.reloadSeeResultData();
				this.showFullscreenToast(
					this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.leanerunlock'),
					'success'
				);
			}
		});
	}

	reloadSeeResultData() {
		this.sessionTimelineService.getSessionAllUsersAllData(this.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionAllData = [];
				this.sessionAllData = res.data;
				setTimeout(() => {
					this.seeResultPopUp(this.refreshSeeResultIndex, this.refreshSeeResultOrderResult, null, true);
				}, 200);
				this.spinnerService.hide();
			}
		});
	}

	showFullscreenToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
		this.fullscreenToast.message = message;
		this.fullscreenToast.type = type;
		this.fullscreenToast.show = true;

		setTimeout(() => {
			this.fullscreenToast.show = false;
		}, 10000);
	}

	getToastIcon(type: string): string {
		switch (type) {
			case 'success':
				return '✔️';
			case 'error':
				return '❌';
			case 'info':
				return 'ℹ️';
			case 'warning':
				return '⚠️';
			default:
				return '';
		}
	}

	getToastTitle(type: string): string {
		switch (type) {
			case 'success':
				return 'Success!';
			case 'error':
				return 'Error!';
			case 'info':
				return 'Info!';
			case 'warning':
				return 'Warning!';
			default:
				return '';
		}
	}
}
