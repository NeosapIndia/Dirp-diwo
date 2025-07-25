import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import {
	AdvancedPieChartComponent,
	BarHorizontalComponent,
	BarVerticalComponent,
	LineChartComponent,
	PieChartComponent,
} from '@swimlane/ngx-charts';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { curveLinear, curveNatural } from 'd3-shape';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgxWheelComponent } from 'ngx-wheel';
import moment from 'moment';

@Component({
	selector: 'app-worksheet-preview',
	templateUrl: './worksheet-preview.page.html',
	styleUrls: ['./worksheet-preview.page.scss'],
})
export class WorksheetPreviewPage {
	@ViewChild(BarHorizontalComponent) chartInstance?: BarHorizontalComponent;
	@ViewChild(BarVerticalComponent) chartInstance2?: BarVerticalComponent;
	@ViewChild(AdvancedPieChartComponent) chartInstance3?: AdvancedPieChartComponent;
	@ViewChild(PieChartComponent) chartInstance4?: PieChartComponent;
	@ViewChild(NgxWheelComponent, { static: false }) wheel;
	@ViewChild('maincontainer', { static: false }) maincontainer!: ElementRef;

	ChartOptions: any = {};
	aboutUsInfo;
	imageHost = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	MANY_ITEMS = 'MANY_ITEMS';
	subs = new Subscription();
	config = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	isShowTrainerNote = false;
	wbId: any;
	showNotesInput = false;
	clientId: any;
	showSurveyNote: boolean = false;
	showOfflineNote: boolean = false;
	workSheetData: any;
	currentWorksheetIndex = null;
	DiwoModuleId = null;
	isLoading: boolean = false;
	WorkBookData;
	wsData: any;
	wordCloudAnsInex = [];
	selectedAnswer = '';
	selectedAnsArr = [];
	userNote;
	WorkbookId: number | null;
	isTrainer: boolean = false;
	isAnswerCorrected: boolean;
	isCorrectSequence: boolean;
	isParticalCorrect: boolean;
	appBrandingInfo: any;
	sessionStatus: any;
	briefAssets: any[];
	Wsthumbnail: any[];
	allOptions: any[];
	allWorksheetData = [];
	userId;

	//Spin The Wheel
	idToLandOn: any;
	// width = 335;
	// height = 370;
	screenWidth: number;
	screenHeight: number;
	spinDuration = 8;
	spinCategoryArray: any = [];
	showSpinCategoryQuestion: boolean = false;
	selectCategoryName: any;
	spinResult: any;
	assignUserSpinCategoryArray: any = [];
	noOfTimeUserCanSpinWheel = 0;
	showSpinWheel: boolean = false;
	spinColorArray = ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4'];
	isdesktopView: boolean = false;
	maxCharCount: any;

	isdesktopView2: boolean = true;
	isTabletLandscapeView: boolean = false;
	iconObject = {};

	constructor(
		public http: HttpClient,
		public platform: Platform,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public appService: AppService,
		public dragulaService: DragulaService,
		public activatedRoute: ActivatedRoute
	) {
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));

		this.activatedRoute.queryParams.subscribe((params) => {
			if (params.worksheetId) {
				this.wbId = JSON.parse(params.worksheetId);
			}

			if (params.index > -1) {
				this.currentWorksheetIndex = JSON.parse(params.index);
			}
		});

		this.ChartOptions = {
			showXAxis: true,
			showYAxis: true,
			showLegend: false,
			showGridLines: true,
			showXAxisLabel: false,
			showYAxisLabel: false,
			legendPosition: 'right',
			autoScale: false,
			curve: curveLinear,
			roundDomains: true,
			xAxisLabel: '',
			yAxisLabel: '',
			gradient: false,
			showLabels: true,
			isDoughnut: false,
		};
		setTimeout(() => {
			this.isdesktopView2 = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);

		if (!this.platform.is('desktop')) {
			this.setWidthAndHeight();
		} else {
			this.screenWidth = 335;
			this.screenHeight = 370;
			this.showSpinWheel = true;
			this.isdesktopView = true;
		}
	}

	ionViewWillEnter() {
		if (localStorage.getItem('isTrainer') == 'true') {
			this.isTrainer = true;
		}
		if (this.activatedRoute.snapshot.queryParams['workbookId']) {
			this.WorkbookId = this.activatedRoute.snapshot.queryParams['workbookId'];
		} else if (this.activatedRoute.snapshot.queryParams['moduleId']) {
			this.WorkbookId = this.activatedRoute.snapshot.queryParams['moduleId'];
		}
		this.getWSdetails();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	async findMaxQuesCharCount(AllQuestions) {
		let charCount = 0;
		for (let question of AllQuestions) {
			if (question.DiwoSpinWheelCat.category_name.length > charCount) {
				charCount = question.DiwoSpinWheelCat.category_name.length;
			}
		}
		return charCount;
	}

	workSheetTypesArray = [
		'Learning Content',
		'Discussion',
		'Follow Us',
		'Quiz',
		'Quiz (Randomised)',
		'Poll',
		'Survey',
		'Offline Task',
		'Spin The Wheel',
		'Word Cloud',
	];

	setWidthAndHeight() {
		let checkIntervel = setInterval(() => {
			if (this.maincontainer && this.maincontainer.nativeElement && this.maincontainer.nativeElement.offsetWidth != 0) {
				let percentage = 0.1 * this.maincontainer.nativeElement.offsetWidth;
				this.screenWidth = this.maincontainer.nativeElement.offsetWidth + percentage;
				this.screenHeight = this.maincontainer.nativeElement.offsetWidth;
				this.showSpinWheel = true;
				this.isdesktopView = false;
				clearInterval(checkIntervel);
			}
		}, 10);
	}

	getWSdetails() {
		this.appService.getUserslWorksheetDetailsForPreview(this.wbId).subscribe(async (res: any) => {
			if (res.success) {
				this.workSheetData = [];
				this.workSheetData = res.data;

				if (this.workSheetData && this.workSheetData.activityTemplate) {
					const key = this.appService.GetLanguageKey(this.workSheetData.activityTemplate);
					if (key) {
						this.workSheetData.activityTemplate = this.appService.getTranslation(`Utils.Database.${key}`);
					}
				}

				if (this.workSheetData && this.workSheetData.app_branding) {
					this.appBrandingInfo = this.workSheetData.app_branding;
				}

				this.WorkbookId = this.workSheetData?.WorkbookId ? this.workSheetData.WorkbookId : null;
				this.appService.getWorksheetDetails({ id: this.WorkbookId }).subscribe((res: any) => {
					if (res.success) {
						this.allWorksheetData = res.data;
						if (this.currentWorksheetIndex == null) {
							for (let i = 0; i < this.allWorksheetData.length; i++) {
								if (this.allWorksheetData[i]?.id == this.wbId) {
									this.currentWorksheetIndex = i;
									this.DiwoModuleId = this.allWorksheetData[i].DiwoModuleId;
									break;
								}
							}
						} else {
							this.DiwoModuleId = this.allWorksheetData[this.currentWorksheetIndex].DiwoModuleId;
						}
					}
				});

				this.sessionStatus =
					this.workSheetData.Workbook &&
					this.workSheetData.Workbook.SessionUsers[0] &&
					this.workSheetData.Workbook.SessionUsers[0].Session &&
					this.workSheetData.Workbook.SessionUsers[0].Session.status
						? this.workSheetData.Workbook.SessionUsers[0].Session.status
						: null;

				//check for keepSurveyOn
				if (
					this.workSheetData &&
					this.workSheetData.sessionFeedback &&
					this.workSheetData.keepSurveyOn &&
					this.workSheetData.keepSurveyOnDays &&
					this.sessionStatus == 'Closed'
				) {
					let SessionEndDate_: any = moment(this.workSheetData.Workbook.SessionUsers[0].Session.SessionEndDate).format(
						'YYYY-MM-DD HH:mm:ss'
					);
					if (this.workSheetData.Workbook.SessionUsers[0] && this.workSheetData.Workbook.SessionUsers[0].Session) {
						let currentDate: any = moment().format('YYYY-MM-DD HH:mm:ss');
						let fDate = moment(SessionEndDate_).add(this.workSheetData.keepSurveyOnDays, 'days');
						let futureDate: any = moment(fDate).format('YYYY-MM-DD HH:mm:ss');

						if (currentDate <= futureDate) {
							this.sessionStatus = 'Active';
						} else {
							this.sessionStatus = 'Closed';
						}
					}
				}

				if (this.workSheetData.DiwoAssets && this.workSheetData.DiwoAssets.length > 0) {
					this.workSheetData.imgPath = ENV.imageHost + ENV.imagePath + this.workSheetData.DiwoAssets[0].path;
				}
				this.briefAssets = [];
				if (this.workSheetData.type == 'Offline Task' || this.workSheetData.type == 'Learning Content') {
					for (let assets of this.workSheetData.DiwoAssets) {
						if (assets.forBrief == true) {
							this.briefAssets.push(assets);
						}
					}
				}

				this.Wsthumbnail = [];
				// if (this.workSheetData.type == 'Offline Task' || this.workSheetData.type == 'Learning Content') {
				for (let assets of this.workSheetData.DiwoAssets) {
					if (assets.forBrief == false && assets.type == 'Image') {
						this.Wsthumbnail.push(assets);
						this.workSheetData.imgPath = ENV.imageHost + ENV.imagePath + assets.path;
						console.log('this.workSheetData.imgPath', this.workSheetData.imgPath);
						break;
					} else if (assets.forBrief == false && assets.type == 'Video') {
						this.Wsthumbnail.push(assets);
						console.log('this.Wsthumbnail.video', this.Wsthumbnail);
						break;
					}
					// }

					console.log('this.Wsthumbnail', this.Wsthumbnail);
				}

				this.userNote = this.workSheetData.userNote;
				let categoryList = [];
				let totalSpinScore = 0;
				this.workSheetData.spinTheQuestionCount = 0;
				let spinCatCount = 0;

				if (this.workSheetData.type == 'Spin The Wheel') {
					this.maxCharCount = await this.findMaxQuesCharCount(this.workSheetData.Questions);
				}

				for (let question of this.workSheetData.Questions) {
					let count = 0;
					let answer = '';
					let que = question;
					question.answerStatus = '';
					let iscorrect = false;
					let iswrong = false;
					let str_name = question.allowFileTypes.toString();
					question.allowFileTypes = this.removeLastComma(str_name);
					this.allOptions = [];

					////Spin The Wheel
					if (
						this.workSheetData.type == 'Spin The Wheel' &&
						question &&
						(question.questionType == 'MCQ' || question.questionType == 'Drag and Drop')
					) {
						let spinCategoryPayload = {
							id: question.spinCatIndex,
							text: question.DiwoSpinWheelCat.category_name,
							fillStyle: '',
							textDirection: 'reversed',
							textFillStyle: '#FFFFFF',
							spinCatIndex: question.spinCatIndex,
							spinQueScore: 0,
							spinCatName: question.DiwoSpinWheelCat.category_name,
							textFontSize: 0,
							textOrientation: 'horizontal',
							textAlignment: 'outer',
							textMargin: 13,
						};

						if (this.maxCharCount == 15) {
							spinCategoryPayload.textFontSize = 12;
						} else if (this.maxCharCount < 15 && this.maxCharCount > 10) {
							spinCategoryPayload.textFontSize = 13;
						} else {
							spinCategoryPayload.textFontSize = 16;
						}

						if (categoryList.indexOf(question.spinCatIndex) == -1) {
							if (this.spinCategoryArray.length < 4) {
								spinCategoryPayload.fillStyle = this.spinColorArray[this.spinCategoryArray.length];
							} else {
								spinCategoryPayload.fillStyle = this.spinColorArray[this.spinCategoryArray.length - 3];
							}

							spinCatCount++;

							this.spinCategoryArray.push(spinCategoryPayload);
							categoryList.push(question.spinCatIndex);
						}
					}

					for (let option of que.Options) {
						if (question.questionType == 'MCQ') {
							if (option.selectedAns == true && option.correctAns == true) {
								iscorrect = true;
							} else if (option.selectedAns == false && option.correctAns == true) {
								iswrong = true;
							} else if (option.selectedAns == true && option.correctAns == false) {
								iswrong = true;
							}
						} else if (question.questionType == 'Drag and Drop') {
							this.allOptions.push(option);
							if (option.userSeq == option.sr_no) {
								iscorrect = true;
							} else {
								iswrong = true;
							}
						}

						if (option.isCorrectAnswer == true) {
							count++;
						}
						if (option.selectedAns) {
							answer = option.text;
						}
						if (this.workSheetData.type == 'Poll' && option.selectedAns) {
							question.selectedAnswer = option.text;
						}
					}

					if (iscorrect && !iswrong) {
						question.answerStatus = 'Correct';
					} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
						question.answerStatus = 'Partially Correct';
					} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
						question.answerStatus = 'Incorrect';
					} else if (!iscorrect && iswrong) {
						question.answerStatus = 'Incorrect';
					}
					if (count > 1) {
						question.questionType = 'multiCorrectAns';
					} else if (count == 1) {
						question.selectedAnswer = answer;
					}

					if (this.workSheetData.type == 'Survey' && question.multipleOption) {
						question.questionType = 'multiCorrectAns';
					}
				}

				if (this.workSheetData.description) {
					setTimeout(() => {
						this.displayTextOrHyperLink(this.workSheetData.description);
					}, 100);
				}
			}
		});
	}

	prevItem() {
		if (this.currentWorksheetIndex > 0) {
			this.currentWorksheetIndex--;
			this.wbId = this.allWorksheetData[this.currentWorksheetIndex].id;
			this.workSheetData = null;
			this.getWSdetails();
		}
	}

	nextItem() {
		if (this.currentWorksheetIndex < this.allWorksheetData.length - 1) {
			this.currentWorksheetIndex++;
			this.wbId = this.allWorksheetData[this.currentWorksheetIndex].id;
			this.workSheetData = null;
			this.getWSdetails();
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

	getAppBrancding() {
		if (localStorage.getItem('appBrandingAboutUsPage') == 'True') {
			localStorage.setItem('appBrandingAboutUsPage', 'false');
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		}
	}

	back() {
		this.appService.pauseVideo(true);
		if (this.showSurveyNote || this.showNotesInput || this.showOfflineNote) {
			this.showSurveyNote = false;
			this.showNotesInput = false;
			this.showOfflineNote = false;
		} else {
			this.navCtrl.pop();
		}
	}

	async doRefresh(e) {
		await this.appService.pauseVideo(true);
		setTimeout(() => {
			localStorage.removeItem(this.wbId.toString());
			this.workSheetData = [];
			this.getWSdetails();
			e.target.complete();
		}, 500);
	}

	async showLoading(message?: string) {
		this.isLoading = true;
		if (message) {
			const loading = await this.loadingCtrl.create({
				message: message,
			});
			loading.present();
			return;
		} else {
			const loading = await this.loadingCtrl.create({});
			loading.present();
			return;
		}
	}

	async dismiss() {
		setTimeout(async () => {
			this.isLoading = false;
			return await this.loadingCtrl.dismiss();
		}, 100);
		return;
	}

	checkedOption(i, j, event) {}

	multiCheckedOption(i, id) {}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	submitWordCloud(i, j) {}

	submitQuiz(payload) {}

	showTrainerNote() {
		this.isShowTrainerNote = !this.isShowTrainerNote;
	}

	addEditLearnerNote() {
		this.showNotesInput = true;
	}

	cancel() {
		if (this.workSheetData.description) {
			setTimeout(() => {
				this.displayTextOrHyperLink(this.workSheetData.description);
			}, 100);
		}

		this.showNotesInput = false;
		this.showSurveyNote = false;
		this.showOfflineNote = false;
	}

	saveLearnerNote() {}

	clearForm() {}

	changeFlag(type) {
		if (type == 'Fav') {
			this.workSheetData.isFav = !this.workSheetData.isFav;
		} else if (type == 'Bookmark') {
			this.workSheetData.isBookmark = !this.workSheetData.isBookmark;
		} else if (type == 'Imp') {
			this.workSheetData.isImp = !this.workSheetData.isImp;
		} else if (type == 'Group Activty') {
			this.workSheetData.isGroupActivty = !this.workSheetData.isGroupActivty;
		}
	}

	submitForm() {}
	drop($event: CdkDragDrop<string[]>) {
		moveItemInArray(this.allOptions, $event.previousIndex, $event.currentIndex);
	}

	onSpinStart() {}

	onSpinStop() {
		this.showSpinCategoryQuestion = true;
		this.assignUserSpinCategoryArray.push(this.spinResult.spinCatIndex);
	}

	onClickSpinStart() {
		this.onSpinReset();
		setTimeout(() => {
			this.wheel.spin();
		}, 200);
	}

	onSpinReset() {
		this.showSpinCategoryQuestion = false;
		setTimeout(() => {
			this.wheel.reset();
		}, 200);
		this.spinResult = this.spinCategoryArray[Math.floor(Math.random() * this.spinCategoryArray.length)];
		this.selectCategoryName = this.spinResult.spinCatName;
		this.idToLandOn = this.spinResult.id;
	}

	displayTextOrHyperLink(input) {
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		const contentDiv = document.getElementById('module_preview_description');
		let htmlContent = '';
		let linkIdCounter = 0;
		htmlContent = input.replace(urlPattern, (url) => {
			linkIdCounter++;
			return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}" style="cursor: pointer;">${url}</a>`;
		});

		if (contentDiv) {
			contentDiv.innerHTML = htmlContent;
		}

		for (let i = 1; i <= linkIdCounter; i++) {
			const linkElement = document.getElementById(`dynamic-hyper-link-${i}`);
			if (!linkElement) {
				continue;
			}
			linkElement.addEventListener('click', (event) => {
				event.preventDefault();
				const url = linkElement.getAttribute('href');
				window.open(url, '_blank');
			});
		}
	}
}
