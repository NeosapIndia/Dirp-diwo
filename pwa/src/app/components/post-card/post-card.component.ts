import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationExtras } from '@angular/router';
import { IonSlides, NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import Vimeo from '@vimeo/player';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-post-card',
	templateUrl: './post-card.component.html',
	styleUrls: ['./post-card.component.scss'],
})
export class PostCardComponent implements OnInit {
	@ViewChild('vimeo_video') vimeoPlayer: ElementRef;
	@ViewChild('main_container') maincontainer: ElementRef;
	@ViewChild('slides', { static: false }) slides: IonSlides;

	private player: Vimeo.Player;

	@Input() avatar: string;
	@Input() name: string;
	@Input() date: string;
	@Input() images: string[];
	@Input() videos: string[];
	@Input() links: string[];
	@Input() htmlPage: string[];
	@Input() pdfs: string[];
	@Input() description: string;
	@Input() comments: number;
	@Input() asset_details: any[];
	@Input() createdAt;
	@Input() isLiked: boolean;
	@Input() isBookmarked: boolean;
	@Input() postId: any;
	@Input() id: any;
	@Input() title: any;
	@Input() tempType: any;
	@Input() score: any;
	@Input() userId: any;
	@Input() externalLink: any;
	@Input() externalLinkLabel: any;
	@Input() clickExternalLink: any;
	@Input() isDripClickAction: any;
	@Input() consumed: any;

	safeUrl;
	imageHost = ENV.imageHost + ENV.imagePath;
	imgConfig = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	userDetails: any;
	pagerValue: any;
	checkInterval: any;
	appBrandingInfo: any;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	iconObject = {};

	constructor(private navCtrl: NavController, public appService: AppService, public sanitizer: DomSanitizer) {}

	ngOnInit() {
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		// if(this.asset_details[0].displayType == 'Video' && this.asset_details[0].isTranscoding){
		//   this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.asset_details[0].vimeoLink);
		// } else if(this.asset_details[0].displayType == 'Video' && !this.asset_details[0].isTranscoding){
		//   this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageHost + this.asset_details[0].path);
		// }
		if (this.tempType == 'Carousel') {
			this.pagerValue = 'true';
		} else {
			this.pagerValue = 'false';
		}
		if (this.tempType == 'Video') {
		}

		if (this.tempType == 'Survey' && this.asset_details.length == 0) {
			this.asset_details = [
				{
					id: 0,
					path: 'assets/images/workbook/form-default-img.png',
					text: 'null',
					fieldname: 'Image',
					name: 'Form.png',
					displayType: 'Default Image',
				},
			];
		}

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ionViewWillLeave() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}
	}

	ionViewDidLeave() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}
	}
	showVideo() {
		if (
			this.asset_details &&
			this.asset_details.length > 0 &&
			this.asset_details[0].displayType == 'Video' &&
			this.asset_details[0].path
		) {
			let count = 0;
			this.checkInterval = setInterval(() => {
				if (this.maincontainer && this.vimeoPlayer) {
					this.playVimeoVideo();
					clearInterval(this.checkInterval);
				}
				if (count > 50) {
					clearInterval(this.checkInterval);
				}
				// console.log('---', count);
			}, 100);
		}
	}

	playVimeoVideo() {
		if (this.vimeoPlayer) {
			let videoLink =
				this.asset_details &&
				this.asset_details.length > 0 &&
				this.asset_details[0].displayType == 'Video' &&
				this.asset_details[0].path
					? this.asset_details[0].path
					: null;

			if (videoLink) {
				if (this.maincontainer) {
					this.player = new Vimeo(this.vimeoPlayer.nativeElement, {
						id: videoLink,
						width: this.maincontainer.nativeElement.offsetWidth,
					});
					this.player.on('play', async (data) => {
						// if (this.appService.currentYoutubePlayingVideo) {
						// 	this.appService.currentYoutubePlayingVideo.pauseVideo();
						// }
						await this.appService.pauseVideo();

						this.appService.currentVimeoPlayingVideo = this.player;
						// console.log('Video is playing', data);

						if (this.asset_details[0]?.DripVideoLogs?.length > 0) {
							this.appService.videoLogId = this.asset_details[0].DripVideoLogs[0].id;
							this.player
								.setCurrentTime(this.asset_details[0].DripVideoLogs[0].consumed)
								.then(function (ids) {})
								.catch(function (error) {});
						} else {
							let payload = {
								UserId: this.userDetails.id,
								AssetDetailId: this.asset_details[0].id,
							};
							this.appService.createVideoWatchIngLog(payload).subscribe((res: any) => {
								if (res.success) {
									this.appService.videoLogId = res.data.id;
									this.asset_details[0].DripVideoLogs = [res.data];
								}
							});
						}
						this.checkVideoPlayingTime();
					});

					this.player.on('pause', async (data) => {
						await this.appService.pauseVideo();
						// console.log('--Pause Vimeo Video..---');
					});

					if (this.checkInterval) {
						clearInterval(this.checkInterval);
					}
				}
			}
		}
	}

	onLike() {
		this.isLiked = !this.isLiked;
		let payload = {
			isLiked: this.isLiked,
			userId: this.userDetails.id,
			id: this.id,
		};
		this.appService.updateLike(this.postId, payload).subscribe((res: any) => {});
	}

	checkVideoPlayingTime() {
		this.player.on('timeupdate', (data) => {
			// console.log('---data--', data);
			this.appService.videoPlayInPercentage = data.percent;
			this.appService.videoPlayTimeDuration = data.consumed;
			this.appService.videoTotalTimeDuration = data.max;
			this.asset_details[0].DripVideoLogs[0].consumed = data.consumed;
		});
	}

	onBookmark() {
		this.isBookmarked = !this.isBookmarked;
		let payload = {
			isBookmarked: this.isBookmarked,
			userId: this.userDetails.id,
			id: this.id,
		};
		this.appService.updateBookmark(this.postId, payload).subscribe((res: any) => {});
	}

	navigateToDetail(dripId) {
		this.appService.pauseVideo();

		let navigationExtras: NavigationExtras = {
			queryParams: {
				dripId: dripId,
				id: this.id,
			},
		};
		this.appService.allDripReloadPage = true;
		if (this.tempType == 'Custom Template') {
			this.navCtrl.navigateForward(['custom-template'], navigationExtras);
		} else {
			this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
		}
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	ionSlideDidChange() {
		let max = 0;
		if (this.asset_details.length > 0) {
			max = this.asset_details.length;
		}
		if (this.consumed < this.asset_details.length) {
			this.appService.updateDripSwipCount(this.id, this.consumed, max).subscribe((res: any) => {
				if (res.success) {
					this.consumed = res.score;
				}
			});
		}
	}

	goToexternalLink() {
		if (!this.clickExternalLink) {
			this.appService.updateClickExternalLink(this.id, null).subscribe((res: any) => {
				this.clickExternalLink = true;
			});
		}
		if (this.externalLink) {
			window.open(`${this.externalLink}`, '_blank');
		}
	}

	async nextSlide() {
		await this.slides.slideNext();
	}

	async prevSlide() {
		await this.slides.slidePrev();
	}
}
