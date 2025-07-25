import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-post-detail',
	templateUrl: './post-detail.page.html',
	styleUrls: ['./post-detail.page.scss'],
})
export class PostDetailPage implements OnInit {
	commentForm: FormGroup;
	post: any;
	config = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	isLiked = false;
	isBookmarked = false;
	incomingPostId: any;
	imageHost = ENV.imageHost + ENV.imagePath;

	showSingalPost = false;
	userDetails: any;
	id: any;
	iconObject = {};

	constructor(
		private fb: FormBuilder,
		public sanitizer: DomSanitizer,
		private router: Router,
		private route: ActivatedRoute,
		public appService: AppService,
		public navCtrl: NavController
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit() {
		if (JSON.parse(localStorage.getItem('user'))) {
			this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		}
		this.commentForm = this.fb.group({
			comment: [null],
		});

		if (!this.incomingPostId) {
			this.route.queryParams.subscribe((params: any) => {
				this.incomingPostId = params.postId;
				if (params && params.showSingalPost) {
					this.showSingalPost = params.showSingalPost;
					this.incomingPostId = parseInt(this.incomingPostId.split('-')[1]);
					this.getPostData();
				} else {
					if (params && params.id) {
						this.id = params.id;
						this.getPostByUserId();
					}
				}
			});
		}
		if (!this.userDetails) {
		} else {
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getPostData() {
		this.appService.getDripData(this.incomingPostId).subscribe((res: any) => {
			if (res.success) {
				if (res.data.Assets) {
					let payload = {
						avatar: res.data.Client.avatar_path,
						name: res.data.Client.name,
						date: res.data.createdAt,
						images: [],
						likes: 2310,
						comments: 450,
						title: res.data.drip_native_title,
						description: res.data.drip_native_description,
						asset_details: [],
						isLiked: res.data.isLiked,
						isBookmarked: res.data.isBookmarked,
					};

					for (let asset of res.data.Assets) {
						for (let assetDetail of asset.Asset_details) {
							if (assetDetail.displayType == 'Image') {
								payload.asset_details.push(assetDetail);
							}
							if (assetDetail.displayType == 'Video') {
								payload.asset_details.push(assetDetail);
							}
						}
					}
					this.post = payload;
				}
			}
		});
	}

	getPostByUserId() {
		this.appService.getDripDataByUId(this.incomingPostId, this.id).subscribe((res: any) => {
			if (res.success) {
				if (res.data.Post) {
					let payload = {
						id: res.data.id,
						avatar:
							'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=124&q=80',
						name: res.data.Post.Client.name,
						date: res.data.Post.createdAt,
						images: [],
						likes: 2310,
						comments: 450,
						description: res.data.Post.drip_native_description,
						asset_details: [],
						isLiked: res.data.isLiked,
						isBookmarked: res.data.isBookmarked,
					};

					for (let asset of res.data.Post.Assets) {
						for (let assetDetail of asset.Asset_details) {
							if (assetDetail.displayType == 'Image') {
								payload.asset_details.push(assetDetail);
							}
							if (assetDetail.displayType == 'Video') {
								payload.asset_details.push(assetDetail);
							}
						}
					}
					this.post = payload;
				}
			}
		});
	}

	onLike() {
		this.post.isLiked = !this.post.isLiked;
		let payload = {};
		if (!this.showSingalPost) {
			payload = {
				isLiked: this.post.isLiked,
				userId: this.userDetails.id,
				id: this.post.id,
			};
		} else {
			payload = {
				isLiked: this.post.isLiked,
			};
		}
		this.appService.updateLike(this.incomingPostId, payload).subscribe((res: any) => {});
	}

	onBookmark() {
		this.post.isBookmarked = !this.post.isBookmarked;
		let payload = {};
		if (!this.showSingalPost) {
			payload = {
				isBookmarked: this.post.isBookmarked,
				userId: this.userDetails.id,
				id: this.post.id,
			};
		} else {
			payload = {
				isBookmarked: this.post.isBookmarked,
			};
		}
		this.appService.updateBookmark(this.incomingPostId, payload).subscribe((res: any) => {});
	}

	submitComment() {
		this.commentForm.reset();
	}

	navigateToComments() {
		this.router.navigate(['/comments']);
	}
	back() {
		if (this.showSingalPost) {
			this.navCtrl.navigateRoot('login');
		} else {
			this.navCtrl.pop();
		}
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
}
