import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, IonSlides, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';
import { ElementRef, AfterViewInit, QueryList, ViewChildren, AfterViewChecked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/services/language.service';

@Component({
	selector: 'app-all-workbooks',
	templateUrl: './all-workbooks.page.html',
	styleUrls: ['./all-workbooks.page.scss'],
})
export class AllWorkbooksPage implements OnInit {
	// coursel
	@ViewChild('carouselContainer', { static: false }) carouselContainer!: ElementRef;
	@ViewChild('slides', { static: false }) slides: IonSlides;

	backToTop: boolean = false;
	@ViewChild(IonContent) content: IonContent;

	isRtl: boolean = false;
	learnerFirstName: string;
	isReadMoreActive: boolean = false;
	page = 0;
	workbookLists: any = [];
	// Carousel items
	carouselItems: any = [];
	currentSlideIndex = 0;
	isTabletOrIpad: boolean = false;
	toDOListCount = 0;
	portraitFlag: boolean = true;
	clientId: any;
	wbListData: any;
	firstName = null;
	pagerValue = 'true';
	config = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	isDripClickAction = false;
	userId: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	userDetails: any;
	sessionExpired: boolean = false;
	selectedsArray = 'SortByDate';
	sessionStatusInterval: any;
	WorkbooksCoursesPathwaysCertisBadgesCountListData: any = [];
	isCheckSessionPlanned: boolean = false;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isResizeTabLandScapView: boolean = false;
	isMobileLandscapeView: boolean = false;

	deviceType: string = '';
	osType: string = '';

	//NEW LMS CODE

	isMobileView: boolean = false;

	assignToDosListData: any = [];
	assignPathwayListData: any = [];
	assignCourseListData: any = [];
	assignWorkBookListData: any = [];

	assignToDosCount = 6;
	assignPathwayCount = 6;
	assignCourseCount = 6;
	assignWorkbookCount = 6;

	iconObject = {
		assignment_icon: null,	
		no_modules_icon: null,	
	};
	sessionStatusCheckCount = 0;
	PlannedSessionIds: any = [];	

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService,
		private route: ActivatedRoute,
		private translate: TranslateService,	
		private languageService: LanguageService,
	) {}

	ngOnInit() {
		this.appService.getScreenViewMode();
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
			this.isMobileLandscapeView = this.appService.isMobileLandscapeView;

			if (this.isdesktopView == false && this.isTabletLandscapeView == false && this.isMobileLandscapeView == false) {
				this.assignToDosCount = 4;
				this.assignPathwayCount = 4;
				this.assignCourseCount = 4;
				this.assignWorkbookCount = 4;
			}

			let element = document.documentElement;
		}, 100);
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;

		if (this.userDetails !== null) {
			this.learnerFirstName = this.appService?.userPersonalData?.first ? this.appService.userPersonalData.first : null;
		}

		if (localStorage.getItem('show_workbook_to_trainer')) {
			let navigationExtras: NavigationExtras = {
				queryParams: JSON.parse(localStorage.getItem('show_workbook_to_trainer')),
			};
			localStorage.removeItem('show_workbook_to_trainer');
			this.navCtrl.navigateForward(['/all-worksheets'], navigationExtras);
		}

		if (this.slides) {
			this.slides.getActiveIndex().then((index) => {
				this.currentSlideIndex = index;
			});

			this.slides.ionSlideDidChange.subscribe(() => {
				this.updateSlideIndex();
			});
		}

		const lang = this.languageService.getCurrentLang();
		this.isRtl = lang === 'ar' ? true : false;

		console.log('isRtl', this.isRtl);
	
		this.isTabletOrIpad = this.platform.is('tablet') || this.platform.is('ipad');
		this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		// this.firstName = JSON.parse(localStorage.getItem('user')).user.first || null;
		this.firstName = this.appService?.userPersonalData?.first ? this.appService.userPersonalData.first : null;
		setTimeout(() => {
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			this.getAppBranding();
		}, 300);

		//New COde ////
		setTimeout(() => {
			this.route.params.subscribe((params) => {
				this.getWorkbooksCoursesPathwaysCertificatesBadgesCount();
				this.getUserAssignPathwayCourseWBookList();
			});
		}, 100);
		this.checkWindowSize();
	}

	ionViewDidEnter() {
		this.slides?.update(); // Ensure Swiper updates after page entry
	  }

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);

		if (localStorage.getItem('app_branding') && JSON.parse(localStorage.getItem('app_branding')).CarouselData) {
			let data = JSON.parse(localStorage.getItem('app_branding')).CarouselData;
			this.carouselItems = JSON.parse(data);

			setTimeout(() => {
				this.slides?.update(); // Update the slides after setting the items
			  }, 300);

		} else {
			setTimeout(() => {
				if (localStorage.getItem('app_branding') && JSON.parse(localStorage.getItem('app_branding')).CarouselData) {
					let data = JSON.parse(localStorage.getItem('app_branding')).CarouselData;
					this.carouselItems = JSON.parse(data);

					setTimeout(() => {
						this.slides?.update(); // Update the slides after setting the items
					  }, 300);
				}
			}, 1000);
		}
	}

	gotToTop() {
		this.content.scrollToTop(1000);
	}

	doRefresh(e) {
		this.workbookLists = [];
		this.assignToDosListData = [];
		this.assignPathwayListData = [];
		this.assignCourseListData = [];
		this.assignWorkBookListData = [];
		this.PlannedSessionIds = [];

		this.page = 0;
		this.appService.pauseVideo(true);
		this.appService.getScreenViewMode();

		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
			this.isMobileLandscapeView = this.appService.isMobileLandscapeView;

			// console.log('----------this.isdesktopView--- in refesh', this.isdesktopView);
			// console.log('----------isTabletLandscapeView---- in refesh', this.isTabletLandscapeView);
		}, 100);

		this.getWorkbooksCoursesPathwaysCertificatesBadgesCount();
		this.getUserAssignPathwayCourseWBookList();
		e.target.complete();
	}

	ionViewWillEnter(){
		setTimeout(() => {
			this.slides?.update(); // Forces layout update
		}, 300); // Small delay to ensure view is fully rendered
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
			item.Session &&
			['Live', 'Closed', 'Ended'].indexOf(item.Session.status) != -1 &&
			item.attendanceStatus == 'Present' &&
			item.expStatus != 'Expired' &&
			!item.isAccess &&
			!(item.Session.status == 'Closed' && item.ModuleStatus == 'Not Started')
		) {
			//Get Dependency Module details;
			//SessionUserId, ModuleDepedencyIndex
			this.appService
				.getDependenceyModuleDetails(item.id, { dependencyIndex: item.ModuleDepedencyIndex })
				.subscribe((res: any) => {
					if (res.success) {
						this.presentToast(res.message);
					}
				});
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
	}

	/////////////////////////////NEW PWA LMS CODE//////////////////////

	getUserAssignPathwayCourseWBookList() {
		let limit = 4;
		this.isCheckSessionPlanned = false;
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}

		this.appService.getUserAssignPathwayCourseWBookList(limit).subscribe((res: any) => {
			if (res.success) {
				this.assignToDosListData = [];
				this.assignPathwayListData = [];
				this.assignCourseListData = [];
				this.assignWorkBookListData = [];
				this.PlannedSessionIds = [];
				this.toDOListCount = res.data.toDOListCount;

				if (res.data && res.data.toDosList) {
					for (let item of res.data.toDosList) {
						if (item && item.SessionAssets && item.SessionAssets.length > 0 && item.SessionAssets[0].path) {
							item.imagePath = ENV.imageHost + ENV.imagePath + item.SessionAssets[0].path;
						}
						if (item && item.Session && item.Session.SessionStartDate) {
							item.Session.SessionStartDate = moment(item.Session.SessionStartDate).format('Do MMMM  YYYY');
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

						if (item.Session) {
							if (item.Session?.status == 'Planned' && item?.attendanceStatus == 'Present') {
								this.isCheckSessionPlanned = true;
								this.PlannedSessionIds.push(item.Session.id);
							}
						}

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

						if (this.assignToDosListData.length < this.assignToDosCount) {
							this.assignToDosListData.push(item);
						} else {
							break;
						}
					}

					this.sessionStatusCheckCount++;
					if (this.isCheckSessionPlanned && this.sessionStatusCheckCount < 60) {
						this.checkSessionStatusInterval();
					}
				}

				if (res.data && res.data.pathwayList) {
					for (let item of res.data.pathwayList) {
						let courseIds = [];
						item.completedCount = 0;
						item.totalModules = 0;
						if (this.assignPathwayListData.length < this.assignPathwayCount) {
							item.totalModules += item.DiwoModuleAssign.length;
							for (let data of item.DiwoModuleAssign) {
								for (let session_user of data.SessionUsers) {
									if (
										session_user?.CS &&
										courseIds.indexOf(session_user.CS.id) == -1 &&
										session_user.CS.status != 'In Progress' &&
										session_user.CS.status != 'Not Started'
									) {
										courseIds.push(session_user.CS.id);
										item.completedCount++;
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
					}
				}

				if (res.data && res.data.courseList) {
					for (let item of res.data.courseList) {
						item.completedCount = 0;
						item.totalModules = 0;
						if (this.assignCourseListData.length < this.assignCourseCount) {
							item.totalModules += item.DiwoModuleAssign.length;

							for (let data of item.DiwoModuleAssign) {
								for (let session_user of data.SessionUsers) {
									if (
										session_user &&
										session_user.ModuleStatus != 'In Progress' &&
										session_user.ModuleStatus != 'Not Started'
									) {
										item.completedCount++;
										// console.log('session_user', session_user);
									}
								}
							}

							if (item && item.courseStatus) {
								const key = this.appService.GetLanguageKey(item.courseStatus);
								if (key) {
									item.courseStatus = this.appService.getTranslation(`Utils.Database.${key}`);
								}
							}

							this.assignCourseListData.push(item);
						}
					}
				}

				if (res.data && res.data.allModuleList) {
					for (let item of res.data.allModuleList) {
						if (item && item.SessionAssets && item.SessionAssets.length > 0 && item.SessionAssets[0].path) {
							item.imagePath = ENV.imageHost + ENV.imagePath + item.SessionAssets[0].path;
						}

						if (item && item.Session && item.Session.SessionStartDate) {
							item.Session.SessionStartDate = moment(item.Session.SessionStartDate).format('Do MMMM  YYYY');
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

						if (item.Session) {
							if (item.Session?.status == 'Planned' && item?.attendanceStatus == 'Present') {
								this.isCheckSessionPlanned = true;
								this.PlannedSessionIds.push(item.Session.id);
							}
						}

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

						if (this.assignWorkBookListData.length < this.assignWorkbookCount) {
							this.assignWorkBookListData.push(item);
						} else {
							break;
						}
					}

					this.sessionStatusCheckCount++;
					if (this.isCheckSessionPlanned && this.sessionStatusCheckCount < 60) {
						this.checkSessionStatusInterval();
					}
				}
				this.appService.hideLoader();
			} else {
				this.appService.hideLoader();
			}
		});
	}

	getWorkbooksCoursesPathwaysCertificatesBadgesCount() {
		this.appService.getWorkbooksCoursesPathwaysCertificatesBadgesCount().subscribe((res: any) => {
			if (res.success && res.data) {
				this.WorkbooksCoursesPathwaysCertisBadgesCountListData = res.data;
			}
		});
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
						let flag = false;
						if (res.data && res.data.SessionDetails) {
							for (let item of res.data.SessionDetails) {
								if (item.status == 'Planned') {
									this.isCheckSessionPlanned = true;
								} else {
									for (let data of this.assignWorkBookListData) {
										if (data && data.Session && data.Session.id == item.id) {
											data.Session.status = item.status;
											flag = true;
										}
									}

									for (let data of this.assignToDosListData) {
										if (data && data.Session && data.Session.id == item.id) {
											data.Session.status = item.status;
											flag = true;
										}
									}
								}
							}
						}

						if (flag) {
							this.getUpdatedSessionWorkbook();
						}

						if (this.isCheckSessionPlanned == false) {
							clearInterval(this.appService.sessionStatusInterval);
						}
						this.appService.hideLoader();
					}
				});
				count++;
				if (count > 60) {
					clearInterval(this.appService.sessionStatusInterval);
				}

				// console.log('-------------Interval Statrted--------------');
			}, 30000);
		} else {
			if (this.appService.sessionStatusInterval) {
				clearInterval(this.appService.sessionStatusInterval);
			}
		}
	}

	getUpdatedSessionWorkbook() {
		let limit = 4;
		this.appService.getUserAssignPathwayCourseWBookList(limit).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.toDosList) {
					const updatedList = [];
					for (let newItem of res.data.toDosList) {
						if (newItem && newItem.SessionAssets && newItem.SessionAssets.length > 0 && newItem.SessionAssets[0].path) {
							newItem.imagePath = ENV.imageHost + ENV.imagePath + newItem.SessionAssets[0].path;
						}
						if (newItem && newItem.Session && newItem.Session.SessionStartDate) {
							newItem.Session.SessionStartDate = moment(newItem.Session.SessionStartDate).format('Do MMMM  YYYY');
						}

						if (newItem && newItem.Session && newItem.expiryDate) {
							let currentDate: any = moment();
							let expiryDate_: any = moment(newItem.expiryDate);
							let curDate = currentDate._d;
							let endDate = expiryDate_._d;
							if (curDate > endDate) {
								newItem.expStatus = 'Expired';
							} else {
								newItem.expStatus = 'Active';
							}
						}

						if (newItem && newItem.Session && newItem.Session.enddateWithTime) {
							newItem.Session.enddateWithTime = moment(newItem.Session.enddateWithTime).format('Do MMMM  YYYY');
						}

						let isDuplicate = false;
						for (let existingItem of this.assignToDosListData) {
							if (newItem.id === existingItem.id) {
								isDuplicate = true;
								updatedList.push(existingItem);
								break;
							}
						}

						if (!isDuplicate) {
							updatedList.push(newItem);
						}
					}
					this.assignToDosListData = updatedList;
				}
				this.appService.hideLoader();
			} else {
				this.appService.hideLoader();
			}
		});
	}

	seeAllPathways() {
		this.appService.clearSessionStatusInterval();
		this.navCtrl.navigateForward(['tabs/all-pathways']);
	}

	seeAllCourses() {
		this.appService.clearSessionStatusInterval();
		this.navCtrl.navigateForward(['tabs/all-courses']);
	}

	seeAllModules(comingfrom: string) {
		this.appService.clearSessionStatusInterval();
		this.navCtrl.navigateForward(['tabs/see-all-workbooks']);
	}

	seeAllTodos() {
		this.appService.clearSessionStatusInterval();
		this.navCtrl.navigateForward(['tabs/see-all-todos']);
	}

	showPathwayDetail(item) {
		this.appService.clearSessionStatusInterval();
		let navigationExtras: NavigationExtras = {
			queryParams: {
				pathwaId: item.id,
				DiwoAssignmentId: item.DiwoAssignmentId,
			},
		};
		this.navCtrl.navigateForward(['tabs/pathway-detail'], navigationExtras);
	}

	showCourseDetail(item) {
		this.appService.clearSessionStatusInterval();
		let navigationExtras: NavigationExtras = {
			queryParams: {
				courseId: item.id,
				DiwoAssignmentId: item.DiwoAssignmentId,
			},
		};
		this.navCtrl.navigateForward(['tabs/course-detail'], navigationExtras);
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();

		setTimeout(() => {
			this.slides?.update();
		}, 300);
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024; // Desktop: 1024px and above
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Tablet: 768px - 1023px
		this.isMobileView = window.innerWidth < 767; // Mobile: 767px and below
		this.isResizeTabLandScapView = window.innerWidth >= 1024;
	}

	prevSlide() {
		this.slides?.slidePrev().then(() => this.updateSlideIndex());
	}

	nextSlide() {
		this.slides?.slideNext().then(() => this.updateSlideIndex());
	}

	updateSlideIndex() {
		this.slides?.getActiveIndex().then((index) => {
			this.currentSlideIndex = index;
		});
	}

	toggleReadMore() {
		this.isReadMoreActive = !this.isReadMoreActive;
	}

	limitedCarouselItems = this.carouselItems.slice(0, 4);
}
