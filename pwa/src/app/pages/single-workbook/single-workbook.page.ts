import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { IonContent, NavController, Platform } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { OverlayEventDetail } from '@ionic/core/components';

@Component({
	selector: 'app-single-workbook',
	templateUrl: './single-workbook.page.html',
	styleUrls: ['./single-workbook.page.scss'],
})
export class SingleWorkbookPage {
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
	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public route: ActivatedRoute
	) {}

	ionViewWillEnter() {
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
	}

	getAllworksheets() {
		this.appService.getUsersAllWorksheets(this.sessionUserId,null,null).subscribe((res: any) => {
			if (res.success) {
				this.wsData = res.data;

				// this.wsData.forEach(element => {
				//   element.imagePath = ENV.imageHost + ENV.imagePath + element.SessionAssets[0].path
				// });
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
		this.navCtrl.navigateForward(['worksheet'], navigationExtras);
	}

	showTrainerNote(index) {
		this.wsData[index].isShowTrainerNote = !this.wsData[index].isShowTrainerNote;
	}

	addEditLearnerNote(item, index) {
		this.showNotesInput = true;
		this.sessionWorksheetId = item.id;
		this.userNote = item.userNote;
	}

	cancel() {
		this.showNotesInput = false;
	}

	saveLearnerNote() {
		let payload = {
			userNote: this.userNote,
		};

		this.appService.updateUserNote(this.sessionWorksheetId, payload).subscribe((res: any) => {
			this.wsData = [];
			this.getAllworksheets();
			this.showNotesInput = false;
		});
	}

	changeFlag(index) {
		this.wsData[index].isFav = !this.wsData[index].isFav;
		let payload = {
			isFav: this.wsData[index].isFav,
		};
	}

	changeBookmark(index) {
		this.wsData[index].isBookmark = !this.wsData[index].isBookmark;
		let payload = {
			isBookmark: this.wsData[index].isBookmark,
		};
	}
}
