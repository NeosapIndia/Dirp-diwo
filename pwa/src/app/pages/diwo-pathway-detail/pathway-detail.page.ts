import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';
import { LanguageService } from 'src/app/services/language.service';

@Component({
	selector: 'app-pathway-detail',
	templateUrl: './pathway-detail.page.html',
	styleUrls: ['./pathway-detail.page.scss'],
})
export class PathwayDetailPage implements OnInit {
	backToTop: boolean = false;
	@ViewChild(IonContent) content: IonContent;

	isRtl: boolean = false;
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

	pathwayData: any;
	pathwaId: any;
	coursesforPathways: any = [];
	courseAssetBasePath = ENV.imageHost + ENV.imagePath + 'uploads/diwo_course_thumbnail/';
	pathwayAssetBasePath = ENV.imageHost + ENV.imagePath + 'uploads/diwo_pathway_thumbnail/';

	pathwayCourseList = [];
	pathwayList;
	DiwoAssignmentId: any;
	showHeaderText = false; // Initially hide the header text

	iconObject = {
		workbook_image: null,
		eduration_image: null,
		course_image: null,
	};
	pathwayStatus = null;
	totalModules = 0;

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService,
		private route: ActivatedRoute,
		private languageService: LanguageService
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	ngOnInit() {
		this.route.queryParams.subscribe((params: any) => {
			if (params && params.pathwaId) {
				this.pathwaId = params.pathwaId;
			}

			if (params && params.DiwoAssignmentId) {
				this.DiwoAssignmentId = params.DiwoAssignmentId;
			}
		});

		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;

			this.isdesktopDetectedView = this.appService.isdesktopView;
			this.isTabletLandscapeDetectedView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;

			let element = document.documentElement;
			// let color =
			// 	this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			// element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);

		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;

		const lang = this.languageService.getCurrentLang();
		this.isRtl = lang === 'ar' ? true : false;

		this.isTabletOrIpad = this.platform.is('tablet') || this.platform.is('ipad');
		this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		setTimeout(() => {
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		}, 300);

		this.route.params.subscribe((params) => {
			this.getPathwayDetails();
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
		this.pathwayData = [];
		this.page = 0;
		this.getPathwayDetails();
		e.target.complete();
	}

	getScrollPos(pos: any) {
		pos = pos.detail.scrollTop;
		if (pos > this.platform.height()) {
			this.backToTop = true;
		} else {
			this.backToTop = false;
		}

		if (pos > 60) {
			this.showHeaderText = true;
		} else if (pos <= 60) {
			this.showHeaderText = false;
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

	getPathwayDetails() {
		this.appService.getPathwayDetailsById(this.pathwaId, this.DiwoAssignmentId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.pathwayList) {
					this.pathwayList = res.data.pathwayList;
					if (this.pathwayList) {
						this.totalModules = this.pathwayList.totalModules;
						if (
							this.pathwayList &&
							this.pathwayList.l_outcomes &&
							this.pathwayList.l_outcomes !== null &&
							this.pathwayList.l_outcomes != ''
						) {
							this.pathwayList.outcomesArray = this.pathwayList.l_outcomes.split(',');
						} else {
							this.pathwayList.outcomesArray = [];
						}
					}
				}

				if (res?.data?.courseList) {
					this.pathwayCourseList = [];
					this.pathwayCourseList = res.data.courseList;

					if (this.pathwayCourseList.length > 0) {
						for (let item of this.pathwayCourseList) {
							if (item?.SessionUsers[0]?.expiryDate) {
								let currentDate: any = moment();
								let expiryDate_: any = moment(item.SessionUsers.expiryDate);
								let curDate = currentDate._d;
								let endDate = expiryDate_._d;
								if (curDate > endDate) {
									item.SessionUsers.expStatus = 'Expired';
								} else {
									item.SessionUsers.expStatus = 'Active';
								}

								if (item?.SessionUsers[0]?.CS && item.SessionUsers[0].CS.status) {
									// item.courseStatus = item.SessionUsers[0].CS.status;
									const key = this.appService.GetLanguageKey(item.SessionUsers[0].CS.status);
									if (key) {
										item.courseStatus = this.appService.getTranslation(`Utils.Database.${key}`);
									}
								}

								if (item?.SessionUsers[0]?.PS && item.SessionUsers[0].PS.status) {
									// this.pathwayStatus = item.SessionUsers[0].PS.status;

									const key = this.appService.GetLanguageKey(item.SessionUsers[0].PS.status);
									if (key) {
										this.pathwayStatus = this.appService.getTranslation(`Utils.Database.${key}`);
									}
								}

								if (item?.SessionUsers[0]?.ModuleStatus) {
									// item.ModuleStatus = item.SessionUsers[0].ModuleStatus;

									const key = this.appService.GetLanguageKey(item.SessionUsers[0].ModuleStatus);
									if (key) {
										item.ModuleStatus = this.appService.getTranslation(`Utils.Database.${key}`);
									}
								}

								// console.log('---------------------item.courseStatus-------------------------', item);
							}

							if (item.isAssignmentCertification) {
								this.totalModules = this.totalModules + 1;
							}

							if (item.CourseId) {
								if (item && item.Course && item.Course.l_outcomes !== null && item.Course.l_outcomes != '') {
									item.Course.outcomesArray = item.Course.l_outcomes.split(',');
								} else {
									item.Course.outcomesArray = [];
								}
							} else {
								if (item && item.Workbook && item.Workbook.l_outcomes !== null && item.Workbook.l_outcomes != '') {
									item.Workbook.outcomesArray = item.Workbook.l_outcomes.split(',');
								} else {
									item.Workbook.outcomesArray = [];
								}
							}
						}
					}
				}
			}
		});
	}

	courseReadMore(item) {
		let navigationExtras: NavigationExtras = {
			queryParams: {
				courseId: item.CourseId,
				DiwoAssignmentId: this.DiwoAssignmentId,
			},

			state: {
				totalCourses: this.pathwayCourseList.length,
			},
		};
		this.navCtrl.navigateForward(['tabs/course-detail'], navigationExtras);
	}

	workbookReadMore(item) {
		// console.log('-item-', item);
		if (
			item &&
			item.SessionUsers[0] &&
			item.SessionUsers[0].Session &&
			['Live', 'Closed'].indexOf(item.SessionUsers[0].Session.status) != -1 &&
			item.SessionUsers[0].Session.id != null &&
			item.SessionUsers[0].attendanceStatus == 'Present' &&
			item.SessionUsers[0].isAccess
			// &&
			// item.Workbook.Sessions[0].SessionUsers[0].expStatus != 'Expired'
		) {
			this.appService.checkUserHaveSessionAccess(item.SessionUsers[0].id, null).subscribe(
				(res: any) => {
					if (res.success) {
						let navigationExtras: NavigationExtras = {
							queryParams: {
								workbookId: item.SessionUsers[0].id,
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
		} else if (
			item &&
			item.SessionUsers[0] &&
			item.SessionUsers[0].Session &&
			['Live', 'Closed'].indexOf(item.SessionUsers[0].Session.status) != -1 &&
			item.SessionUsers[0].Session.id != null &&
			item.SessionUsers[0].attendanceStatus == 'Present' &&
			!item.SessionUsers[0].isAccess
		) {
			//Get Dependency Module details;
			//SessionUserId, ModuleDepedencyIndex
			this.appService
				.getDependenceyModuleDetails(item.SessionUsers[0].id, {
					dependencyIndex: item.SessionUsers[0].ModuleDepedencyIndex,
				})
				.subscribe((res: any) => {
					if (res.success) {
						this.presentToast(res.message);
					}
				});
		}
	}

	// isDescriptionTruncated(description: string): boolean {

	// 	const maxVisibleLines = 3;
	// 	let maxCharactersPerLine: number; // Adjust based on your font size and width
	// 	if (this.isdesktopView) {
	// 		// Desktop: wider containers and larger font size
	// 		maxCharactersPerLine = 100;
	// 	} else if (this.isTabletLandscapeView) {
	// 		// Tablet in landscape mode: medium-width containers and medium font size
	// 		maxCharactersPerLine = 80; // Adjust this value based on the container and font size
	// 	} else {
	// 		// Default to smaller mobile devices
	// 		maxCharactersPerLine = 42; // Smallest width and font size
	// 	}
	// 	const maxCharacters = maxVisibleLines * maxCharactersPerLine;
	// 	return description.length > maxCharacters;
	// }

	isDescriptionTruncated(description: string): boolean {
		if (!description) {
			return false;
		}

		let maxCharacters: number;

		if (this.isdesktopView) {
			maxCharacters = 485; // Desktop view limit
		} else if (this.isTabletLandscapeView) {
			maxCharacters = 169; // Tablet landscape limit
		} else {
			maxCharacters = 118; // Mobile view limit
		}

		return description.length > maxCharacters;
	}

	//breadcumb
	goToHome() {
		this.navCtrl.navigateForward(['tabs/all-modules']);
	}

	goToAllPathways() {
		this.navCtrl.navigateForward(['tabs/all-pathways']);
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

	expandedItems: { [key: string]: boolean } = {}; // Track expanded state for each item
	maxCharacters = 126; // Adjust based on your needs

	toggleReadMore(item: any, type: string): void {
		const itemId = type === 'Workbook' ? item.WorkbookId : item.CourseId;
		this.expandedItems[itemId] = !this.expandedItems[itemId]; // Toggle state
	}
}
