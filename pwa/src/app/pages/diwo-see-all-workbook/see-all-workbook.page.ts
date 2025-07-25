import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';

@Component({
	selector: 'app-see-all-workbook',
	templateUrl: './see-all-workbook.page.html',
	styleUrls: ['./see-all-workbook.page.scss'],
})
export class SeeAllWorkbookPage implements OnInit {
	backToTop: boolean = false;
	@ViewChild(IonContent) content: IonContent;
	page = 0;
	isTabletOrIpad: boolean = false;
	portraitFlag: boolean = true;
	clientId: any;
	wbListData: any;
	userId: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	userDetails: any;
	appBrandingInfo: any;

	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	isMobileView: boolean = false;

	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isdesktopDetectedView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;

	assignToDosWorkbookListData: any = [];
	filteredAssignToDosWorkbookListData: any = [];
	searchQuery: string = '';
	showToDosText: boolean = false;

	iconObject = {
		assignment_icon: null,	
		no_modules_icon: null,	
	};

	sessionStatusInterval: any;
	isCheckSessionPlanned: boolean = false;
	sessionStatusCheckCount = 0;
	PlannedSessionIds: any = [];
	translations: any = {};

	sessionStatusMap = {
		Planned: ['Not started', 'Session starting soon'],
		Ended: ['Open'],
		Live: ['Session is live', 'Session is not live'],
		Closed: ['Attended on', 'Not started'],
	};

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService,
		public route: ActivatedRoute,
		private translate: TranslateService
	) {}

	ngOnInit() {
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			// this.isTabletLandscapeView = this.appService.isTabletLandscapeView;

			this.isdesktopDetectedView = this.appService.isdesktopView;
			this.isTabletLandscapeDetectedView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;

			let element = document.documentElement;
			let color =
				this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;

		this.isTabletOrIpad = this.platform.is('tablet') || this.platform.is('ipad');
		this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		setTimeout(() => {
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		}, 300);

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);

		this.translate
			.get([
				'Utils.sessionNotStarted',
				'Utils.sessionStartingSoon',
				'Utils.sessionOpen',
				'Utils.sessionLive',
				'Utils.sessionnotLive',
				'Utils.sessionAttendedOn',
				'Utils.sessionExpired',
				'Utils.sessiondueOn',
			])
			.subscribe((translations) => {
				this.translations = translations;
			});

		this.route.params.subscribe((params) => {
			this.getUserAssignWBookList();
		});

		this.getAppBranding();
		this.checkWindowSize();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	gotToTop() {
		this.content.scrollToTop(1000);
	}

	doRefresh(e) {
		this.assignToDosWorkbookListData = [];
		this.getUserAssignWBookList();
		this.page = 0;
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

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	/////////////////////////////NEW PWA LMS CODE//////////////////////

	back() {
		this.navCtrl.pop();
		// this.appService.clearSessionStatusInterval();
	}

	redirectToSingle(item) {
		if (
			item &&
			item.Session &&
			['Live', 'Closed', 'Ended'].indexOf(item.Session.status) != -1 &&
			item.attendanceStatus == 'Present' &&
			item.expStatus != 'Expired' &&
			item.isAccess &&
			!(item.Session.status == 'Closed' && item.ModuleStatus == 'Not Started')
		) {
			this.appService.checkUserHaveSessionAccess(item.id, null).subscribe(
				(res: any) => {
					if (res.success) {
						let navigationExtras: NavigationExtras = {
							queryParams: {
								workbookId: item.id,
								moduleType: item.ModuleTypeName
							},							
						};
						this.navCtrl.navigateForward(['all-worksheets'], navigationExtras);
					}
				},
				(err) => {
					this.presentToast(err.error.error);
				}
			);
		} else if (
			item &&
			item.Session &&
			['Live', 'Closed', 'Ended'].indexOf(item.Session.status) != -1 &&
			item.attendanceStatus == 'Present' &&
			item.expStatus != 'Expired' &&
			!item.isAccess &&
			!(item.Session.status == 'Closed' && item.ModuleStatus == 'Not Started')
		) {
			this.appService
				.getDependenceyModuleDetails(item.id, { dependencyIndex: item.ModuleDepedencyIndex })
				.subscribe((res: any) => {
					if (res.success) {
						this.presentToast(res.message);
					}
				});
		}
	}

	getUserAssignWBookList() {
		this.appService.getUserAssignSeeAllBookList().subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.allModuleList) {
					this.assignToDosWorkbookListData = [];
					for (let item of res.data.allModuleList) {
						if (item && item.SessionAssets && item.SessionAssets.length > 0 && item.SessionAssets[0].path) {
							item.imagePath = ENV.imageHost + ENV.imagePath + item.SessionAssets[0].path;
						}

						if (item && item.Session && item.Session.SessionStartDate) {
							item.Session.SessionStartDate = moment(item.Session.SessionStartDate).format('Do MMMM  YYYY');
						}

						if (
							item?.Session?.status == 'Planned' &&
							item.attendanceStatus != 'Present' &&
							item?.expStatus != 'Expired'
						) {
							item.plannedStatus = this.translations['Utils.sessionAttendedOn'];
						}

						if (
							item?.Session?.status == 'Planned' &&
							item.attendanceStatus == 'Present' &&
							item?.expStatus != 'Expired'
						) {
							item.plannedAttendedStatus = this.translations['Utils.sessionStartingSoon'];
						}

						if (
							item?.Session?.status == 'Ended' &&
							item.attendanceStatus == 'Present' &&
							item?.expStatus != 'Expired'
						) {
							item.endedStatus = this.translations['Utils.sessionOpen'];
						}

						if (item?.Session?.status == 'Live' && item.attendanceStatus == 'Present' && item?.expStatus != 'Expired') {
							item.liveAttednedStatus = this.translations['Utils.sessionLive'];
						}

						if (item?.Session?.status == 'Live' && item.attendanceStatus != 'Present' && item?.expStatus != 'Expired') {
							item.liveNotAttendedStatus = this.translations['Utils.sessionnotLive'];
						}

						if (
							item.ModuleStatus != 'Not Started' &&
							item?.Session?.status == 'Closed' &&
							item?.attendanceStatus == 'Present' &&
							item.expStatus != 'Expired'
						) {
							item.closedStatus = this.translations['Utils.sessionAttendedOn'];
						}

						if (
							item?.ModuleStatus == 'Not Started' &&
							item?.Session?.status == 'Closed' &&
							item?.attendanceStatus == 'Present' &&
							item.expStatus != 'Expired'
						) {
							item.closedNotStartedStatus = this.translations['Utils.sessionNotStarted'];
						}

						if (item?.expStatus == 'Expired') {
							item.expStatus = this.translations['Utils.sessionExpired'];
						}

						if (
							item?.Session?.DiwoModuleId != 1 &&
							item?.Session?.status == 'Live' &&
							item?.attendanceStatus == 'Present' &&
							item.expStatus != 'Expired'
						) {
							item.nonVBTLiveStatus = this.translations['Utils.sessiondueOn'];
						}

						if (item && item.Session && item.expiryDate) {
							let currentDate: any = moment();
							let expiryDate_: any = moment(item.expiryDate);
							let curDate = currentDate._d;
							let endDate = expiryDate_._d;
							if (curDate > endDate) {
								item.expStatus = 'Expired';
							} else {
								item.expStatus = 'Active';
							}
						}

						// if (item.Session) {
						// 	if (item.Session?.status == 'Planned' && item?.attendanceStatus == 'Present') {
						// 		this.isCheckSessionPlanned = true;
						// 		this.PlannedSessionIds.push(item.Session.id);
						// 	}
						// }

						if (item && item.Session && item.Session.enddateWithTime) {
							item.Session.enddateWithTime = moment(item.Session.enddateWithTime).format('Do MMMM  YYYY');
						}

						if (item && item.ModuleTypeName) {
							const key = this.appService.GetLanguageKey(item.ModuleTypeName);
							if (key) {
								item.ModuleTypeName = this.appService.getTranslation(`Utils.Database.${key}`);
							}
						}

						if (item && item.ModuleStatus) {
							const key = this.appService.GetLanguageKey(item.ModuleStatus);
							if (key) {
								item.ModuleStatus = this.appService.getTranslation(`Utils.Database.${key}`);
							}
						}

						this.assignToDosWorkbookListData.push(item);
					}

					this.filteredAssignToDosWorkbookListData = [...this.assignToDosWorkbookListData];

					// Restore previous search filter if it exists
					const savedQuery = localStorage.getItem('searchWorkbookQuery');
					if (savedQuery) {
						this.searchQuery = savedQuery;
						this.filterData(); // Apply the saved filter
					}

					this.sessionStatusCheckCount++;
					// if (this.isCheckSessionPlanned && this.sessionStatusCheckCount < 60) {
					// 	this.checkSessionStatusInterval();
					// }
				}
			}
		});
	}

	filterData() {
		const query = this.searchQuery.toLowerCase().trim();
		localStorage.setItem('searchWorkbookQuery', this.searchQuery); // Save query

		if (!query) {
			this.filteredAssignToDosWorkbookListData = [...this.assignToDosWorkbookListData];
			return;
		}

		this.filteredAssignToDosWorkbookListData = this.assignToDosWorkbookListData.filter(
			(item) =>
				(item.title?.toLowerCase() || '').includes(query) ||
				(item.ModuleTypeName?.toLowerCase() || '').includes(query) ||
				(item.ModuleStatus?.toLowerCase() || '').includes(query) ||
				(item.plannedStatus?.toLowerCase() || '').includes(query) ||
				(item.plannedAttendedStatus?.toLowerCase() || '').includes(query) ||
				(item.endedStatus?.toLowerCase() || '').includes(query) ||
				(item.liveAttednedStatus?.toLowerCase() || '').includes(query) ||
				(item.liveNotAttendedStatus?.toLowerCase() || '').includes(query) ||
				(item.closedStatus?.toLowerCase() || '').includes(query) ||
				(item.closedNotStartedStatus?.toLowerCase() || '').includes(query) ||
				(item.expStatus?.toLowerCase() || '').includes(query) ||
				(item.nonVBTLiveStatus?.toLowerCase() || '').includes(query)
		);
	}

	checkSessionStatusInterval() {
		if (this.isCheckSessionPlanned) {
			if (this.appService.sessionStatusInterval) {
				clearInterval(this.appService.sessionStatusInterval);
			}

			let count = 0;
			this.appService.sessionStatusInterval = setInterval(() => {
				this.appService.checkPlannedSessionStatusBySessionId(this.PlannedSessionIds).subscribe((res: any) => {
					if (res.success) {
						this.isCheckSessionPlanned = false;
						for (let item of res.data.SessionDetails) {
							if (item.status == 'Planned') {
								this.isCheckSessionPlanned = true;
							} else {
								for (let data of this.assignToDosWorkbookListData) {
									if (data && data.Session && data.Session.id == item.id) {
										data.Session.status = item.status;
									}
								}
							}
						}

						if (this.isCheckSessionPlanned == false) {
							clearInterval(this.appService.sessionStatusInterval);
						}
					}
				});
				count++;
				if (count > 60) {
					clearInterval(this.appService.sessionStatusInterval);
				}

				// console.log('-------------Interval Statrted in all todos-module page--------------');
			}, 30000);
		} else {
			if (this.appService.sessionStatusInterval) {
				clearInterval(this.appService.sessionStatusInterval);
			}
		}
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024; // Desktop: 1024px and above
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Tablet: 768px - 1023px
		this.isMobileView = window.innerWidth < 767; // Mobile: 767px and below
	}
}
