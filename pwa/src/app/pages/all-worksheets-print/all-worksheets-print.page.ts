import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { IonContent, NavController, Platform } from '@ionic/angular';
import {
	AdvancedPieChartComponent,
	BarHorizontalComponent,
	BarVerticalComponent,
	PieChartComponent,
} from '@swimlane/ngx-charts';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { OverlayEventDetail } from '@ionic/core/components';
import { curveLinear, curveNatural } from 'd3-shape';

@Component({
	selector: 'app-all-worksheets-print',
	templateUrl: './all-worksheets-print.page.html',
	styleUrls: ['./all-worksheets-print.page.scss'],
})
export class AllWorksheetPage {
	wsData: any;
	noteInput = null;
	page = 0;
	@ViewChild(IonContent) content: IonContent;
	backToTop: boolean = false;
	isShowTrainerNote = false;
	showNotesInput = false;
	@ViewChild('swiper', { static: true }) learnerNoteInput: ElementRef<HTMLInputElement>;
	userId: any;
	sessionUserId: any;
	sessionWorksheetId = 0;
	clientId: any;
	userNote;
	imageHost = ENV.imageHost + ENV.imagePath;
	isTrainer = false;
	WorkbookData: any;
	workbooktitle: any;

	@ViewChild(BarHorizontalComponent) chartInstance?: BarHorizontalComponent;
	@ViewChild(BarVerticalComponent) chartInstance2?: BarVerticalComponent;
	@ViewChild(AdvancedPieChartComponent) chartInstance3?: AdvancedPieChartComponent;
	@ViewChild(PieChartComponent) chartInstance4?: PieChartComponent;
	pollChartType: any;
	colorScheme: any = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};

	ChartOptions: any = {};

	userDetails: any;

	ChartData = [];
	wbId: any;
	allSessionData: any;
	worcloudAnswers: any = [];
	userAswers: any;
	appBrandingInfo: any;
	iconObject = {};

	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public route: ActivatedRoute
	) {
		this.userDetails = JSON.parse(localStorage.getItem('user'));
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
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
		}, 100);

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	ionViewWillEnter() {
		this.userId = parseInt(localStorage.getItem('user_id'));
		this.sessionUserId = this.route.snapshot.queryParams['workbookId'];
		if (this.route.snapshot.queryParams['view_workbook']) {
			this.isTrainer = true;
			localStorage.setItem('isTrainer', 'true');
		} else {
			localStorage.setItem('isTrainer', 'false');
			this.userId = parseInt(localStorage.getItem('user_id'));
			this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		}
		this.getAllworksheets();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getAllworksheets() {
		this.appService.getUsersAllWorksheetsForPrint(this.sessionUserId).subscribe((res: any) => {
			if (res.success) {
				this.wsData = res.data[0].SessionWorksheets;
				this.WorkbookData = res.data[0];
				this.workbooktitle = res.data[0].title;

				// this.wsData.forEach(element => {
				//   element.imagePath = ENV.imageHost + ENV.imagePath + element.SessionAssets[0].path
				// });

				for (let item of this.wsData) {
					if (item.description) {
						setTimeout(() => {
							this.displayTextOrHyperLink(item.description, item.id);
						}, 100);
					}

					if (item && item.activityTemplate) {
						const key = this.appService.GetLanguageKey(item.activityTemplate);
						if (key) {
							item.activityTemplate = this.appService.getTranslation(`Utils.Database.${key}`);
						}
					}

					if (item.type == 'Poll') {
						this.wbId = item.id;
						this.getsessionDetailsForGraph();
					}

					if (item.type == 'Word Cloud') {
						for (let op of item.SessionQuestions[0].SessionOptions) {
							this.worcloudAnswers.push(op.userAnswer);
						}
						this.userAswers = this.worcloudAnswers.toString();
					}
				}
			}
		});
	}

	getsessionDetailsForGraph() {
		this.appService.getsessionDetailsForGraph(this.wbId).subscribe((res: any) => {
			if (res.success) {
				this.allSessionData = res.data;
				let data = [];
				let currentWorksheetIndex = 0;
				for (let item of this.allSessionData) {
					if (item.UserId == this.userId) {
						for (let worksheet of item.SessionWorksheets) {
							if (worksheet.id == this.wbId) {
								this.pollChartType = worksheet.chart;
								for (let question of worksheet.SessionQuestions) {
									for (let item of this.wsData) {
										if (question.question == item.SessionQuestions[0].question) {
											for (let option of question.SessionOptions) {
												let payload = { name: option.text, value: 0 };
												data.push(payload);
											}
										}
									}
								}
							}
						}
					}
				}

				for (let item of this.allSessionData) {
					for (let worksheet of item.SessionWorksheets) {
						for (let question of worksheet.SessionQuestions) {
							for (let item of this.wsData) {
								if (question.question == item.SessionQuestions[0].question) {
									for (let option of question.SessionOptions) {
										if (option.selectedAns) {
											for (let data_ of data) {
												if (option.text == data_.name) {
													data_.value = data_.value + 1;
												}
											}
										}
									}
								}
							}
						}
					}
				}

				this.ChartData = [];
				this.ChartData = data;
			}
		});
	}

	back() {
		this.navCtrl.pop();
	}

	enterLearnerNotes(i) {
		if (this.noteInput == '' || this.noteInput == null) {
			return;
		}
		this.wsData[i].userNote = this.noteInput;
		this.noteInput = null;
	}

	doRefresh(e) {
		this.page = 0;
		this.appService.pauseVideo(true);
		this.getAllworksheets();
		e.target.complete();
	}

	paginateArray() {
		this.page++;
		this.wsData.push({
			id: 3,
			imagePath: 'assets/images/demo3.jpeg',
			wsDescription: 'This is the description of worksheet, enter by author',
			userNote: 'This is the learner note',
			trainerNote: 'This is the trainer note',
			isBookmark: true,
			isFlag2: true,
			isFlag3: true,
		});
	}

	// loadMore(event) {
	//   setTimeout(() => {
	//     this.paginateArray();
	//     event.target.complete();
	//     // if (this.feeds?.length < this.perPage) {
	//     // event.target.disabled = true; //disable the infinite scroll
	//     // };
	//   }, 1000);
	// }

	getScrollPos(pos: any) {
		pos = pos.detail.scrollTop;
		if (pos > this.platform.height()) {
			this.backToTop = true;
		} else {
			this.backToTop = false;
		}
	}

	gotToTop() {
		this.content.scrollToTop(1000);
	}

	navigateToWorksheet(id) {
		let navigationExtras: NavigationExtras = { queryParams: { worksheetId: id } };
		// this.navCtrl.navigateForward(['worksheet'], navigationExtras);
	}

	showTrainerNote(index) {
		this.wsData[index].isShowTrainerNote = !this.wsData[index].isShowTrainerNote;
	}

	addEditLearnerNote(item, index) {
		// this.showNotesInput = true;
		// this.sessionWorksheetId = item.id;
		// this.userNote = item.userNote;
	}

	cancel() {
		this.showNotesInput = false;
	}

	saveLearnerNote() {
		// let payload = {
		//   userNote: this.userNote
		// };
		// this.appService.updateUserNote(this.sessionWorksheetId, payload)
		//   .subscribe((res: any) => {
		//     this.wsData = [];
		//     this.getAllworksheets();
		//     this.showNotesInput = false;
		//   });
	}

	changeFlag(index, type) {
		if (type == 'Fav') {
			this.wsData[index].isFav = !this.wsData[index].isFav;
		} else if (type == 'Bookmark') {
			this.wsData[index].isBookmark = !this.wsData[index].isBookmark;
		} else if (type == 'Imp') {
			this.wsData[index].isImp = !this.wsData[index].isImp;
		} else if (type == 'Group Activty') {
			this.wsData[index].isGroupActivty = !this.wsData[index].isGroupActivty;
		}
		// let payload = {
		//   isFav: this.wsData[index].isFav,
		//   isImp: this.wsData[index].isImp,
		//   isGroupActivty: this.wsData[index].isGroupActivty,
		//   isBookmark: this.wsData[index].isBookmark
		// }
		// this.appService.updateUserDiwoFlag(this.wsData[index].id, payload).subscribe((res: any) => {

		// })
	}

	displayTextOrHyperLink(input, id) {
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		const contentDiv = document.getElementById(`module_print_description${id}`);
		let htmlContent = '';
		let linkIdCounter = 0;

		htmlContent = input.replace(urlPattern, (url) => {
			linkIdCounter++;
			return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}" style="cursor: pointer;">${url}</a>`;
		});

		if (contentDiv) {
			contentDiv.innerHTML = htmlContent;

			contentDiv.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;
				if (target.tagName !== 'A') {
					this.navigateToWorksheet(id);
				}
			});
		}

		for (let i = 1; i <= linkIdCounter; i++) {
			const linkElement = document.getElementById(`dynamic-hyper-link-${i}`);
			if (linkElement) {
				linkElement.onclick = (event) => {
					event.preventDefault();
					const url = linkElement.getAttribute('href');
					if (url) {
						window.open(url, '_blank');
					}
				};
			}
		}
	}
}
