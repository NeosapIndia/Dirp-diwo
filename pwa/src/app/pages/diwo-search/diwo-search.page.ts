import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import * as moment from 'moment';

@Component({
	selector: 'app-diwo-search',
	templateUrl: './diwo-search.page.html',
	styleUrls: ['./diwo-search.page.scss'],
})
export class DiwoSearchPage implements OnInit {
	userId;
	postId = 1;
	incomingData = [];
	imageHost = ENV.imageHost + ENV.imagePath;
	setOf5: any[] = [];
	feeds: any = [];
	perPage = 2;
	page = 1;
	lists: any = []; //after paginate the data will store here by infinite scroll
	selectedsArray: any[] = [];
	filterArray = [];
	payload: any;
	imgConfig = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	wbListData: any;
	selectedSearchText: any;
	appBrandingInfo: any;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;

	constructor(
		private router: Router,
		public appService: AppService,
		private navCtrl: NavController,
		public toastCtrl: ToastController
	) {}

	ionViewWillEnter() {
		this.filterArray = [
			{ name: 'All Workbook', label: this.appService.getTranslation('Utils.allworkbooks'), value: true },
			{ name: 'Liked', label: this.appService.getTranslation('Utils.likedworksheets'), value: true },
			{ name: 'My Note', label: this.appService.getTranslation('Utils.mynotes'), value: true },
		];
	}

	ngOnInit() {
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		this.userId = parseInt(localStorage.getItem('user_id'));
		if (this.selectedsArray.length <= 0) {
			this.selectedsArray.push({ name: 'All Workbook', value: true });
		}
		this.getAllworkbookLists();
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			let element = document.documentElement;
			let color =
				this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);
		this.checkWindowSize();
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	compareWith(o1, o2) {
		if (!o1 || !o2) {
			return o1 === o2;
		}
		if (Array.isArray(o2)) {
			return o2.some((o) => o.name === o1.name);
		}
		return o1.name === o2.name;
	}

	commonPyload() {
		let flag = false;
		this.payload = {
			isLikes: null,
			Note: null,
		};
		for (let item of this.selectedsArray) {
			if (item.name == 'All Workbook') {
				flag = true;
			} else if (item.name == 'Liked') {
				this.payload.isLikes = true;
			} else if (item.name == 'My Note') {
				this.payload.Note = true;
			}
		}
		if (flag == true) {
			this.payload.isLikes = false;
			this.payload.Note = false;
		}
	}

	onSearch(event) {
		this.selectedSearchText = event.target.value;
		if (this.selectedSearchText.length == 0) {
			this.getAllworkbookLists();
		}

		this.commonPyload();

		if (this.selectedSearchText.length > 2) {
			this.appService.getAllWorkbookDataSearch(this.selectedSearchText, this.payload).subscribe((res: any) => {
				this.wbListData = [];
				if (res.success) {
					this.wbListData = res.data;
					this.wbListData.forEach((element) => {
						if (element.SessionAssets && element.SessionAssets.length > 0 && element.SessionAssets[0].path) {
							element.imagePath = ENV.imageHost + ENV.imagePath + element.SessionAssets[0].path;
						}
					});
				}
			});
		} else {
			this.wbListData = [];
		}
	}

	onChangeDropdown(event: any) {
		this.selectedSearchText = null;
		this.getAllworkbookLists();
	}

	getAllworkbookLists() {
		this.commonPyload();
		this.appService.getAllWorkbookListForSearch(this.payload).subscribe((res: any) => {
			if (res.success) {
				this.wbListData = res.data;
				this.wbListData.forEach((item) => {
					if (item.SessionAssets && item.SessionAssets.length > 0 && item.SessionAssets[0].path) {
						item.imagePath = ENV.imageHost + ENV.imagePath + item.SessionAssets[0].path;
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
				});
			}
		});
	}

	doRefresh(e) {
		this.wbListData = [];
		this.appService.pauseVideo(true);
		this.ngOnInit();
		e.target.complete();
	}

	navigateToDetail(item) {
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
			this.appService
				.getDependenceyModuleDetails(item.id, { dependencyIndex: item.ModuleDepedencyIndex })
				.subscribe((res: any) => {
					if (res.success) {
						this.presentToast(res.message);
					}
				});
		} else {
			this.presentToast(this.appService.getTranslation('Utils.nopermission'));
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

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024; // Adjust the width as needed
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Adjust the width as needed
	}
}
