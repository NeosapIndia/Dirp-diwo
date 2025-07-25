import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';

@Component({
	selector: 'app-all-pathways',
	templateUrl: './all-pathways.page.html',
	styleUrls: ['./all-pathways.page.scss'],
})
export class AllPathwaysPage implements OnInit {
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

	assignPathwayListData: any = [];

	filteredAssignPathwayListData: any = [];
	searchQuery: string = '';

	iconObject = {};

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService,
		private route: ActivatedRoute
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	ngOnInit() {
		const navigation = this.router.getCurrentNavigation();
		// if (navigation?.extras?.state?.data) {
		// 	this.assignPathwayListData = navigation.extras.state.data;
		// 	console.log('assignPathwayListData', this.assignPathwayListData);
		// }
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
		}, 100);

		this.route.params.subscribe((params) => {
			this.getUserAssignPathwayList();
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
		this.assignPathwayListData = [];
		this.getUserAssignPathwayList();
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

	back() {
		this.navCtrl.pop();
	}

	getUserAssignPathwayList() {
		this.appService.getUserAssignAllPathwayList().subscribe((res: any) => {
			if (res.success && res.data?.pathwayList) {
				this.assignPathwayListData = []; // Reset the array

				for (let item of res.data.pathwayList) {
					let courseIds = [];
					item.completedCount = 0;
					item.totalModules = 0;
					if (item.DiwoModuleAssign && item.DiwoModuleAssign.length > 0) {
						item.totalModules += item.DiwoModuleAssign.length;
						for (let data of item.DiwoModuleAssign) {
							if (data.SessionUsers && data.SessionUsers.length > 0) {
								for (let session_user of data.SessionUsers) {
									if (
										session_user?.CS &&
										courseIds.indexOf(session_user.CS.id) == -1 &&
										session_user.CS.status !== 'In Progress' &&
										session_user.CS.status !== 'Not Started'
									) {
										courseIds.push(session_user.CS.id);
										item.completedCount++;
									}
								}
							}
						}

						if (item && item.pathwayStatus) {
							const key = this.appService.GetLanguageKey(item.pathwayStatus);
							if (key) {
								item.pathwayStatus = this.appService.getTranslation(`Utils.Database.${key}`);
							}
						}

						this.assignPathwayListData.push(item);
					}
					this.filteredAssignPathwayListData = [...this.assignPathwayListData];

					// Restore previous search filter if it exists
					const savedQuery = localStorage.getItem('searchPathwayQuery');
					if (savedQuery) {
						this.searchQuery = savedQuery;
						this.filterData(); // Apply the saved filter
					}
				}
			}
		});
	}

	filterData() {
		const query = this.searchQuery.toLowerCase().trim();
		localStorage.setItem('searchPathwayQuery', this.searchQuery); // Save query

		if (!query) {
			this.filteredAssignPathwayListData = [...this.assignPathwayListData];
			return;
		}

		this.filteredAssignPathwayListData = this.assignPathwayListData.filter(
			(item) => item.title.toLowerCase().includes(query) || (item.pathwayStatus && item.pathwayStatus.toLowerCase().includes(query))
		);
	}

	showPathwayDetail(item) {
		let navigationExtras: NavigationExtras = {
			queryParams: {
				pathwaId: item.id,
				DiwoAssignmentId: item.DiwoAssignmentId,
			},
		};
		this.navCtrl.navigateForward(['tabs/pathway-detail'], navigationExtras);
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
