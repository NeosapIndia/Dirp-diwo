import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';

@Component({
	selector: 'app-all-workbooks',
	templateUrl: './all-workbooks.page.html',
	styleUrls: ['./all-workbooks.page.scss'],
})
export class AllWorkbooksPage implements OnInit {
	backToTop: boolean = false;
	@ViewChild(IonContent) content: IonContent;
	page = 0;
	workbookLists: any = [];
	isTabletOrIpad: boolean = false;
	portraitFlag: boolean = true;
	clientId: any;
	wbListData: any;
	firstName = null;
	userId: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	userDetails: any;
	sessionExpired: boolean = false;
	appBrandingInfo: any;
	selectedsArray = 'SortByDate';
	sessionStatusInterval: any;
	isCheckSessionPlanned: boolean = false;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService
	) {}

	ngOnInit() {
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			let element = document.documentElement;
			let color =
				this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		if (this.userDetails && this.userDetails.acceptPolicy == false) {
			this.router.navigate(['policy-notification']);
		}
		if (localStorage.getItem('show_workbook_to_trainer')) {
			let navigationExtras: NavigationExtras = {
				queryParams: JSON.parse(localStorage.getItem('show_workbook_to_trainer')),
			};
			localStorage.removeItem('show_workbook_to_trainer');
			this.navCtrl.navigateForward(['/all-worksheets'], navigationExtras);
		}
		// first check session code in local storage

		this.getAllworkbookLists();

		this.isTabletOrIpad = this.platform.is('tablet') || this.platform.is('ipad');
		this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		// this.firstName = JSON.parse(localStorage.getItem('user')).user.first || null;
		this.firstName = this.appService?.userPersonalData?.first ? this.appService.userPersonalData.first : null;
		setTimeout(() => {
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		}, 300);
	}

	getAllworkbookLists() {
		this.appService.getAllWorkbookList(this.selectedsArray).subscribe((res: any) => {
			if (res.success) {
				this.wbListData = res.data;
				this.wbListData.forEach((element) => {
					if (element && element.SessionAssets && element.SessionAssets.length > 0 && element.SessionAssets[0].path) {
						element.imagePath = ENV.imageHost + ENV.imagePath + element.SessionAssets[0].path;
					}
					if (element && element.Session && element.Session.SessionStartDate) {
						element.Session.SessionStartDate = moment(element.Session.SessionStartDate).format('Do MMMM  YYYY');
					}

					if (element && element.Session && element.expiryDate) {
						let currentDate: any = moment();
						let expiryDate_: any = moment(element.expiryDate);
						let curDate = currentDate._d;
						let endDate = expiryDate_._d;
						if (curDate > endDate) {
							element.expStatus = 'Expired';
						} else {
							element.expStatus = 'Active';
						}
					}

					if (element.Session) {
						if (element.Session.status == 'Planned' && element.attendanceStatus == 'Present') {
							this.isCheckSessionPlanned = true;
							this.checkSessionStatusInterval();
						}
					}
				});
			}
		});
	}

	checkSessionStatusInterval() {
		let count = 0;
		// console.log('--------isCheckSessionPlanned-------', this.isCheckSessionPlanned);
		if (this.isCheckSessionPlanned) {
			// console.log('------sessionStatusInterval--------', this.appService.sessionStatusInterval);
			if (this.appService.sessionStatusInterval) {
				clearInterval(this.appService.sessionStatusInterval);
			}
			this.appService.sessionStatusInterval = setInterval(() => {
				this.appService.getAllWorkbookList(this.selectedsArray).subscribe((res: any) => {
					if (res.success) {
						this.wbListData = res.data;
						let flag = false;
						this.wbListData.forEach((element) => {
							if (
								element &&
								element.SessionAssets &&
								element.SessionAssets.length > 0 &&
								element.SessionAssets[0].path
							) {
								element.imagePath = ENV.imageHost + ENV.imagePath + element.SessionAssets[0].path;
							}
							if (element && element.Session && element.Session.SessionStartDate) {
								element.Session.SessionStartDate = moment(element.Session.SessionStartDate).format('Do MMMM  YYYY');
							}

							if (element && element.Session && element.expiryDate) {
								let currentDate: any = moment();
								let expiryDate_: any = moment(element.expiryDate);
								let curDate = currentDate._d;
								let endDate = expiryDate_._d;
								if (curDate > endDate) {
									element.expStatus = 'Expired';
								} else {
									element.expStatus = 'Active';
								}
							}

							if (element.Session) {
								// console.log('---status--', element.Session.status);
								if (element.Session.status == 'Planned' && element.attendanceStatus == 'Present') {
									flag = true;
									return;
								}
							}
						});

						if (!flag) {
							// console.log('---flag--', flag);
							clearInterval(this.appService.sessionStatusInterval);
							// console.log('----clearInterval----');
						}
					}
				});

				// console.log('-------------Interval Statrted--------------');
				if (count > 120) {
					clearInterval(this.appService.sessionStatusInterval);
				}
				count++;
			}, 30000);
		} else {
			if (this.appService.sessionStatusInterval) {
				clearInterval(this.appService.sessionStatusInterval);
			}
		}
	}

	gotToTop() {
		this.content.scrollToTop(1000);
	}

	doRefresh(e) {
		// this.postId = 1;
		this.workbookLists = [];
		this.page = 0;
		this.appService.pauseVideo(true);
		this.getAllworkbookLists();
		e.target.complete();
	}

	getScrollPos(pos: any) {
		pos = pos.detail.scrollTop;
		if (pos > this.platform.height()) {
			this.backToTop = true;
		} else {
			this.backToTop = false;
		}
	}

	redirectToSingle(item) {
		if (
			item &&
			item.Session &&
			['Live', 'Closed'].indexOf(item.Session.status) != -1 &&
			item.attendanceStatus == 'Present' &&
			item.expStatus != 'Expired'
		) {
			this.appService.checkUserHaveSessionAccess(item.id, null).subscribe(
				(res: any) => {
					if (res.success) {
						let navigationExtras: NavigationExtras = {
							queryParams: {
								workbookId: item.id,
							},
						};
						this.navCtrl.navigateForward(['all-worksheets'], navigationExtras);
					}
				},
				(err) => {
					const key = this.appService.GetLanguageKey(err.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			);
		}
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	onChangeDropdown(event: any) {
		this.selectedsArray = event.target.value;
		this.getAllworkbookLists();
	}
}
