import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { IonContent, NavController, Platform } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-all-worksheets-preview',
	templateUrl: './all-worksheets-preview.page.html',
	styleUrls: ['./all-worksheets-preview.page.scss'],
})
export class allworksheetsPreview {
	WorkBookData;
	wsData: any;
	noteInput = null;
	page = 0;
	@ViewChild(IonContent) content: IonContent;
	@ViewChild(IonContent) WorksheetContent: IonContent;
	scrollPosition: any = 0;

	backToTop: boolean = false;
	isShowTrainerNote = false;
	showNotesInput = false;
	@ViewChild('swiper', { static: true }) learnerNoteInput: ElementRef<HTMLInputElement>;
	userId: any;
	workbookId: any;
	sessionWorksheetId = 0;
	clientId: any;
	userNote;
	imageHost = ENV.imageHost + ENV.imagePath;
	isTrainer = false;
	appBrandingInfo: any;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;

	iconObject = {};

	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public route: ActivatedRoute
	) {
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);
	}

	ionViewWillEnter() {
		this.userId = parseInt(localStorage.getItem('user_id'));
		if (this.route.snapshot.queryParams['workbookId']) {
			this.workbookId = this.route.snapshot.queryParams['workbookId'];
		} else if (this.route.snapshot.queryParams['moduleId']) {
			this.workbookId = this.route.snapshot.queryParams['moduleId'];
		}

		if (this.route.snapshot.queryParams['author_preview']) {
			// this.isTrainer = true;
			// localStorage.setItem('isTrainer', 'true');
		} else {
			// localStorage.setItem('isTrainer', 'false');
			this.userId = parseInt(localStorage.getItem('user_id'));
			this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		}
		this.getAllworksheets();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	hasVideo(assets: any[]): boolean {
		for (const asset of assets) {
			if (asset.type === 'Video') {
				return true;
			}
		}
		return false;
	}

	getAllworksheets() {
		this.appService.getUsersWorkBookPreview(this.workbookId).subscribe((res: any) => {
			if (res.success) {
				this.WorkBookData = res.data;
				this.wsData = res.data.Worksheets;
				if (this.WorkBookData && this.WorkBookData.app_branding) {
					this.appBrandingInfo = this.WorkBookData.app_branding;
				}
				let index = 0;
				for (let item of this.wsData) {
					if (item.description) {
						setTimeout(() => {
							this.displayTextOrHyperLink(item.description, item.id, index);
							index++;
						}, 100);
					}

					if (item && item.activityTemplate) {
						const key = this.appService.GetLanguageKey(item.activityTemplate);
						if (key) {
							item.activityTemplate = this.appService.getTranslation(`Utils.Database.${key}`);
						}
					}
				}
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

	navigateToWorksheet(id, index) {
		this.appService.pauseVideo(true);
		let navigationExtras: NavigationExtras = { queryParams: { worksheetId: id, index: index } };
		this.navCtrl.navigateForward(['worksheet-preview'], navigationExtras);
	}

	showTrainerNote(index) {
		this.wsData[index].isShowTrainerNote = !this.wsData[index].isShowTrainerNote;
	}

	// addEditLearnerNote(item, index) {
	// 	this.showNotesInput = true;
	// 	// this.sessionWorksheetId = item.id;
	// 	// this.userNote = item.userNote;
	// }

	addEditLearnerNote(item, index) {
		this.WorksheetContent.getScrollElement().then((scrollElement) => {
			this.scrollPosition = scrollElement.scrollTop;
			// console.log('--this.scrollPosition---addd--,', this.scrollPosition);
			this.showNotesInput = true;
			this.sessionWorksheetId = item.id;
			this.userNote = item.userNote;
		});
	}

	cancel() {
		let index = 0;
		for (let item of this.wsData) {
			if (item.description) {
				setTimeout(() => {
					this.displayTextOrHyperLink(item.description, item.id, index);
					index++;
				}, 100);
			}
		}

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

	displayTextOrHyperLink(input, id, index) {
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		const contentDiv = document.getElementById(`All_Module_Preview_description${id}`);
		let htmlContent = '';
		let linkIdCounter = 0;

		htmlContent = input.replace(urlPattern, (url) => {
			linkIdCounter++;
			return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}">${url}</a>`;
		});

		if (contentDiv) {
			contentDiv.innerHTML = htmlContent;

			contentDiv.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;
				if (target.tagName !== 'A') {
					this.navigateToWorksheet(id, index);
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
