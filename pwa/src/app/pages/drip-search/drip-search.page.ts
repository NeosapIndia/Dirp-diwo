import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-drip-search',
	templateUrl: './drip-search.page.html',
	styleUrls: ['./drip-search.page.scss'],
})
export class DripSearchPage implements OnInit {
	userId;
	postId = 1;
	incomingData = [];
	imageHost = ENV.imageHost + ENV.imagePath;
	setOf5: any[] = [];
	feeds: any = [];
	perPage = 2;
	page = 1;
	selectedsArray: any[] = [];
	lists: any = []; //after paginate the data will store here by infinite scroll

	filterArray = [];

	imgConfig = {
		spaceBetween: 0,
		slidesPerView: 1,
		centeredSlides: false,
		onlyExternal: false,
	};
	payload: any;
	data: any = [];
	selectedSearchText: any;
	appBrandingInfo: any;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	iconObject = {};

	constructor(
		private router: Router,
		public appService: AppService,
		public sanitizer: DomSanitizer,
		private navCtrl: NavController,
		public toastCtrl: ToastController
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ionViewWillEnter() {
		this.filterArray = [
			{ name: 'All Drips', label: this.appService.getTranslation('Utils.alldrips'), value: true },
			{ name: 'Liked', label: this.appService.getTranslation('Utils.likedrip'), value: true },
			{ name: 'Bookmarked', label: this.appService.getTranslation('Utils.bookmarkdrip'), value: true },
		];
	}

	ngOnInit() {
		// this.selectedsArray = [];
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			let element = document.documentElement;
			let color =
				this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);
		this.userId = parseInt(localStorage.getItem('user_id'));
		if (this.selectedsArray.length <= 0) {
			this.selectedsArray.push({ name: 'All Drips', value: true });
		}
		this.getAllDripData();

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	loadMore(event) {
		setTimeout(() => {
			const array = this.paginateArray();
			this.setOf5 = this.setOf5.concat(array);
			event.target.complete();
			if (array?.length < this.perPage) {
				event.target.disabled = true; //disable the infinite scroll
			}
		}, 1000);
	}

	paginateArray() {
		this.page++;
		return this.feeds.filter((x) => x.id > this.page * this.perPage - this.perPage && x.id <= this.page * this.perPage);
	}

	navigateToDetail(item) {
		let navigationExtras: NavigationExtras = {
			queryParams: {
				dripId: item.postId,
				id: item.id,
			},
		};
		this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
	}

	navigateToContacts() {
		this.router.navigate(['contacts']);
	}

	navigateToChat(item) {
		let navigationExtras: NavigationExtras = {
			state: {
				user: item,
			},
		};
		this.router.navigate(['chat'], navigationExtras);
	}

	doRefresh(e) {
		this.incomingData = [];
		this.feeds = [];
		this.lists = [];
		this.setOf5 = [];
		this.selectedSearchText = null;
		this.appService.pauseVideo();

		this.ngOnInit();
		e.target.complete();
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

	onChangeDropdown(event: any) {
		if (this.selectedsArray.length === 0) {
			this.selectedsArray.push(this.filterArray[0]);
			this.presentToast(this.appService.getTranslation('Utils.selectatleaseonecheckbox'));
		}

		this.selectedSearchText = null;
		this.getAllDripData();
	}

	commonPyload() {
		let flag = false;
		this.payload = {
			isLikes: null,
			isBookmark: null,
		};
		for (let item of this.selectedsArray) {
			if (item.name == 'All Drips') {
				flag = true;
			} else if (item.name == 'Liked') {
				this.payload.isLikes = true;
			} else if (item.name == 'Bookmarked') {
				this.payload.isBookmark = true;
			}
		}
		if (flag == true) {
			this.payload.isLikes = false;
			this.payload.isBookmark = false;
		}
	}

	onSearch(event) {
		this.selectedSearchText = event.target.value;
		if (this.selectedSearchText.length == 0) {
			this.getAllDripData();
		}

		this.commonPyload();

		if (this.selectedSearchText.length > 2) {
			this.appService.getAllDripDataSearch(this.selectedSearchText, this.payload).subscribe((res: any) => {
				this.setOf5 = [];
				this.feeds = [];
				this.lists = [];
				this.incomingData = [];
				if (res.success) {
					if (res.data.length > 0) {
						for (let postData of res.data) {
							let asset_details = [];
							for (let asset of postData.Post.Assets) {
								for (let asset_detail of asset.Asset_details) {
									if (asset.Post_asset_mapping.index == 1) {
										asset_details.push(asset_detail);
									}
								}
							}

							let payload = {
								id: postData.id,
								postId: postData.Post.id,
								title: postData.Post.title,
								description: postData.Post.description,
								asset_details: asset_details,
							};
							this.postId++;
							this.incomingData.push(payload);
						}
					}
				}
			});
		} else {
			this.setOf5 = [];
			this.feeds = [];
			this.lists = [];
			// this.incomingData = [];
		}
	}

	getAllDripData() {
		this.commonPyload();
		this.appService.getAllDripDataForSearch(this.payload).subscribe((res: any) => {
			this.setOf5 = [];
			this.feeds = [];
			this.lists = [];
			this.incomingData = [];
			if (res.success) {
				if (res.data.length > 0) {
					for (let postData of res.data) {
						let asset_details = [];
						for (let asset of postData.Post.Assets) {
							for (let asset_detail of asset.Asset_details) {
								if (asset.Post_asset_mapping.index == 1) {
									asset_details.push(asset_detail);
								}
							}
						}

						let payload = {
							id: postData.id,
							postId: postData.Post.id,
							title: postData.Post.title,
							description: postData.Post.description,

							asset_details: asset_details,
						};
						this.postId++;
						this.incomingData.push(payload);
					}
				}
			}
		});
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}
}
