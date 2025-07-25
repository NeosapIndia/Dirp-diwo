import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { IonContent, IonInfiniteScroll, NavController, Platform } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-all-post',
	templateUrl: './all-post.page.html',
	styleUrls: ['./all-post.page.scss'],
})
export class AllPostPage implements OnInit {
	@ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
	@ViewChild(IonContent) content: IonContent;
	imageBaseURL = ENV.imageHost + ENV.imagePath;

	userPolicy;
	articles: any;
	users: any;
	stories: any;
	follow: any;
	events: any;
	storiesConfig = {
		initialSlide: 0,
		spaceBetween: 10,
		slidesPerView: 2.8,
	};
	usersConfig = {
		initialSlide: 0,
		spaceBetween: 2,
		slidesPerView: 5,
	};
	followConfig = {
		initialSlide: 0,
		spaceBetween: 10,
		slidesPerView: 2.6,
	};
	userId;
	data = []; //store server incoming data here
	feeds: any = [];
	lists: any = []; //after paginate the data will store here by infinite scroll
	posts = [];
	userDetails: any;
	page = 0;
	perPage = 5;
	postId = 1;
	backToTop: boolean = false;
	isLiked = false;
	post: any;
	isBookmarked = false;
	clientBranding: any;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;

	iconObject = {};

	constructor(
		private router: Router,
		public appService: AppService,
		private platform: Platform,
		private navCtrl: NavController
	) {
		if (localStorage.getItem('singleDripWithLogin')) {
			let drip_code;
			if (localStorage.getItem('singleDripWithLoginDripCode')) {
				drip_code = localStorage.getItem('singleDripWithLoginDripCode');
			}
			let navigationExtras: NavigationExtras = {
				queryParams: {
					dripId: parseInt(localStorage.getItem('singleDripWithLogin')),
					showSingalPost: true,
					drip_code: drip_code,
					// cookieAcceptance:false
				},
			};
			this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
		}

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	ngOnInit() {
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		if (this.userDetails && this.userDetails.acceptPolicy == false) {
			this.router.navigate(['policy-notification']);
		}
		this.userId = parseInt(localStorage.getItem('user_id'));
		this.getAllDripData();
		setTimeout(() => {
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			if (localStorage.getItem('redirect_opt_in') && localStorage.getItem('redirect_opt_in') == 'true') {
				if (this.userDetails.acceptOptInByUser == false || this.userDetails.acceptOptInByUser == 'false') {
					this.router.navigate(['whatsapp-opt-in']);
				} else {
					localStorage.removeItem('redirect_opt_in');
				}
			}
		}, 300);
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	forReloadData() {
		this.data = [];
		this.feeds = [];
		this.lists = [];
		this.page = 0;
		this.getAllDripData();
		this.appService.allDripReloadPage = false;
	}

	getAllDripData() {
		this.appService.getAllDripPageData(this.userId, this.perPage, this.page).subscribe((res: any) => {
			if (res.success) {
				if (res.data.length > 0) {
					for (let postData of res.data) {
						let asset_details = [];
						let temp = postData.Post.Assets.sort((a, b) => {
							if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
								return -1;
							}
						});
						for (let asset of temp) {
							for (let asset_detail of asset.Asset_details) {
								asset_details.push(asset_detail);
							}
						}
						let payload = {
							id: postData.id,
							postId: postData.Post.id,
							avatar: postData.Post.Client.avatar_path,
							name: postData.Post.Client.name,
							title: postData.Post.Client.name,
							description: postData.Post.caption,
							asset_details: asset_details,
							isLiked: postData.isLiked,
							isBookmarked: postData.isBookmarked,
							createdAt: postData.publishOn,
							tempType: postData.Post.tempType,
							score: postData.score,
							externalLink: postData.Post.externalLink,
							externalLinkLabel: postData.Post.externalLinkLabel,
							clickExternalLink: postData.clickExternalLink,
							consumed: postData.consumed,
							isDripClickAction: postData.isDripClickAction,
						};
						// this.postId++;
						this.data.push(payload);
					}
					this.feeds = [];
					this.feeds = this.data;
					this.lists = this.lists.concat(this.feeds);
				}
			}
		});
	}

	doRefresh(e) {
		// this.postId = 1;
		this.data = [];
		this.feeds = [];
		this.lists = [];
		this.page = 0;
		this.appService.pauseVideo();
		this.getAllDripData();
		e.target.complete();
	}

	paginateArray() {
		this.page++;
		this.data = [];
		this.getAllDripData();
	}

	loadMore(event) {
		setTimeout(() => {
			this.paginateArray();
			event.target.complete();
			// if (this.feeds?.length < this.perPage) {
			// event.target.disabled = true; //disable the infinite scroll
			// };
		}, 1000);
	}

	goToNotifications() {
		this.router.navigate(['notifications']);
	}

	eventDetail(item) {
		let navigationExtras: NavigationExtras = {
			state: {
				event: item,
			},
		};
		this.router.navigate(['event-detail'], navigationExtras);
	}

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

	async navigateToDetail(item) {
		await this.appService.pauseVideo();
		let navigationExtras: NavigationExtras = {
			queryParams: {
				postId: item.postId,
				id: item.id,
			},
		};
		this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
	}
}
