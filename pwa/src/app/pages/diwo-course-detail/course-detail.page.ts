import { HostListener, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV, environment } from 'src/environments/environment';
import * as moment from 'moment';
import { LanguageService } from 'src/app/services/language.service';

@Component({
	selector: 'app-course-detail',
	templateUrl: './course-detail.page.html',
	styleUrls: ['./course-detail.page.scss'],
})
export class CourseDetailPage implements OnInit {
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

	courseData: any;
	courseId: any;
	courseIndex: any;
	modulesforCourses: any = [];
	courseAssetBasePath = ENV.imageHost + ENV.imagePath + 'uploads/diwo_course_thumbnail/';
	courseList: any = [];
	DiwoAssignmentId: any;
	workbookList = [];
	allData: any = [];
	pathwayData: any;

	selectedCourseIndex = 0;
	totalCourses = null;

	iconObject = {
		workbook_image: null,
		eduration_image: null,
		course_image: null,
		info_icon_20: null,
	};
	courseStatus = null;
	totalModules = 0;

	constructor(
		private platform: Platform,
		private router: Router,
		private navCtrl: NavController,
		public toastCtrl: ToastController,
		public appService: AppService,
		private route: ActivatedRoute,
		private languageService: LanguageService
	) {}

	ngOnInit() {
		this.route.queryParams.subscribe((params: any) => {
			if (params && params.courseId) {
				this.courseId = params.courseId;
				this.courseIndex = params.courseIndex ? params.courseIndex : 0;
			}
			if (params && params.DiwoAssignmentId) {
				this.DiwoAssignmentId = params.DiwoAssignmentId;
			}
		});

		const navigation = this.router.getCurrentNavigation();
		if (navigation?.extras?.state?.totalCourses) {
			this.totalCourses = navigation.extras.state.totalCourses;
		}

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

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);

		this.route.params.subscribe((params) => {
			this.getCourseDetails();
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
		this.courseData = [];
		this.page = 0;
		this.getCourseDetails();
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

	getCourseDetails() {
		this.appService
			.getCourseDetailsById(this.courseId, this.DiwoAssignmentId, this.courseIndex)
			.subscribe((res: any) => {
				if (res.success) {
					if (res.data && res.data.diwoAssignments) {
						this.allData = [];
						this.courseList = [];
						const diwoAssignments = res.data.diwoAssignments;
						if (diwoAssignments && diwoAssignments.DiwoModuleAssigns && diwoAssignments.DiwoModuleAssigns.length > 0) {
							let flag = false;
							this.totalModules = diwoAssignments.DiwoModuleAssigns.length;
							for (const moduleAssign of diwoAssignments.DiwoModuleAssigns) {
								if (this.courseId == moduleAssign.Course.id && !flag) {
									this.selectedCourseIndex = moduleAssign.CourseIndex;
									flag = true;
								}

								// Add course data to courseList
								if (moduleAssign.Course) {
									let payload = {
										id: moduleAssign.Course.id,
										title: moduleAssign.Course.title,
										subtitle: moduleAssign.Course.subtitle,
										description: moduleAssign.Course.description,
										status: moduleAssign.Course.status,
										e_duration: moduleAssign.Course.e_duration,
										l_outcomes: moduleAssign.Course?.l_outcomes,
										// totalModules: moduleAssign.Course.totalModules,
										outcomesArray: [],
										avatar_file_name: moduleAssign.Course.avatar_file_name,
									};

									if (payload && payload.l_outcomes !== null && payload.l_outcomes != '') {
										payload.outcomesArray = payload.l_outcomes.split(',');
									} else {
										payload.outcomesArray = [];
									}

									this.courseList.push(payload);
								}

								let payload = {
									id: moduleAssign.id,
									CourseIndex: moduleAssign.CourseIndex,
									Workbook: moduleAssign.Workbook,
									SessionUsers: moduleAssign.SessionUsers,
									worksheetTypes: [],
									showFullDescription: false,
									worksheetTypesCountSum: 0, // Add this line
								};

								if (
									payload &&
									payload.Workbook &&
									payload.Workbook.l_outcomes !== null &&
									payload.Workbook.l_outcomes != ''
								) {
									payload.Workbook.outcomesArray = payload.Workbook.l_outcomes.split(',');
								} else {
									payload.Workbook.outcomesArray = [];
								}

								const worksheetTypes = [];
								for (const sessionUser of moduleAssign.SessionUsers) {
									if (sessionUser && sessionUser.Session && sessionUser.Session.SessionStartDate) {
										sessionUser.Session.SessionStartDate = moment(sessionUser.Session.SessionStartDate).format(
											'Do MMMM  YYYY'
										);
									}

									if (sessionUser && sessionUser.Session && sessionUser.expiryDate) {
										let currentDate: any = moment();
										let expiryDate_: any = moment(sessionUser.expiryDate);
										let curDate = currentDate._d;
										let endDate = expiryDate_._d;
										if (curDate > endDate) {
											sessionUser.expStatus = 'Expired';
										} else {
											sessionUser.expStatus = 'Active';
										}
									}

									if (sessionUser && sessionUser.Session && sessionUser.Session.enddateWithTime) {
										sessionUser.Session.enddateWithTime = moment(sessionUser.Session.enddateWithTime).format(
											'Do MMMM  YYYY'
										);
									}

									if (sessionUser && sessionUser.CS && sessionUser.CS.status) {
										// this.courseStatus = sessionUser.CS.status;
										const key = this.appService.GetLanguageKey(sessionUser.CS.status);
										if (key) {
											this.courseStatus = this.appService.getTranslation(`Utils.Database.${key}`);
										}
									}

									for (const worksheet of sessionUser.SessionWorksheets) {
										let found = false;
										for (const countItem of worksheetTypes) {
											if (
												(worksheet.type === 'Quiz' || worksheet.type === 'Quiz (Randomised)') &&
												countItem.type === 'Quiz'
											) {
												countItem.count++;
												found = true;
												break;
											} else if (worksheet.type === countItem.type) {
												countItem.count++;
												found = true;
												break;
											}
										}

										if (!found) {
											if (worksheet.type === 'Quiz' || worksheet.type === 'Quiz (Randomised)') {
												worksheetTypes.push({ type: 'Quiz', count: 1 });
											} else {
												worksheetTypes.push({ type: worksheet.type, count: 1 });
											}
										}
									}
								}

								payload.worksheetTypes = worksheetTypes;
								payload.worksheetTypesCountSum = this.getWorksheetTypesCountSum(worksheetTypes); // Add this line
								this.allData.push(payload);
							}
						}

						if (res.data && res.data.diwoAssignments && res.data.diwoAssignments.Pathway) {
							this.pathwayData = res.data.diwoAssignments.Pathway;
						}
					}
				}
			});
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
			item.SessionUsers[0].isAccess &&
			!(item.SessionUsers[0].Session.status == 'Closed' && item.SessionUsers[0].ModuleStatus == 'Not Started')

			//  &&
			// item.Sessions[0].SessionUsers[0].expStatus != 'Expired'
		) {
			this.appService.checkUserHaveSessionAccess(item.SessionUsers[0].id, null).subscribe(
				(res: any) => {
					if (res.success) {
						console.log('item in course details', item);
						let navigationExtras: NavigationExtras = {
							queryParams: {
								workbookId: item.SessionUsers[0].id,
								moduleType: item.Workbook.DiwoModule.type 
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
			!item.SessionUsers[0].isAccess &&
			!(item.SessionUsers[0].Session.status == 'Closed' && item.SessionUsers[0].ModuleStatus == 'Not Started')
		) {
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

	showPathwayDetail(item) {
		let navigationExtras: NavigationExtras = {
			queryParams: {
				pathwaId: item.id,
				DiwoAssignmentId: this.DiwoAssignmentId,
			},
		};
		this.navCtrl.navigateForward(['tabs/pathway-detail'], navigationExtras);
	}

	isDescriptionTruncated(description: string, showFullDescription: boolean): boolean {
		if (showFullDescription || !description) {
			return false;
		}

		let maxCharacters: number;

		if (this.isdesktopView) {
			maxCharacters = 487; // Desktop limit
		} else if (this.isTabletLandscapeView) {
			maxCharacters = 169; // Tablet landscape limit
		} else {
			maxCharacters = 118; // Mobile limit
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

	goToAllCourses() {
		this.navCtrl.navigateForward(['tabs/all-courses']);
	}

	getWorksheetTypesCountSum(worksheetTypes: any[]): number {
		return worksheetTypes.reduce((sum, wtype) => sum + wtype.count, 0);
	}

	moduleReadMore(item: any) {
		item.showFullDescription = !item.showFullDescription;
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024;
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Adjusted to include 768
		this.isMobileView = window.innerWidth < 767; // Strictly less than 768
	}
}
