import { Component, ElementRef, Input, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import Vimeo from '@vimeo/player';

@Component({
	selector: 'app-vimeo-video',
	templateUrl: './vimeo-video.component.html',
	styleUrls: ['./vimeo-video.component.scss'],
})
export class VimeoVideoComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('vimeo_video') vimeoPlayer: ElementRef;
	@ViewChild('vimeo_video_container') maincontainer: ElementRef;
	@Input() video_asset: any;
	@Input() UserId: any;
	@Input() videoType: any;
	@Input() assignPostId: any;
	@Input() isDripClickAction: any;
	@Input() currentPlayTime: any;
	@Input() updateTime: any;
	@Input() WorksheetId: any;

	observer: IntersectionObserver | undefined;

	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	isMobileView: boolean = false;

	imageHost = ENV.imageHost + ENV.imagePath;
	private player: Vimeo.Player;
	checkInterval;
	constructor(private navCtrl: NavController, private appService: AppService, public sanitizer: DomSanitizer) {
		this.checkWindowSize();
	}

	ngOnDestroy() {
		if (this.player) {
			this.player.destroy();
		}
		if (this.observer) {
			this.observer.disconnect();
		}
	}

	ngAfterViewInit() {
		// Create Intersection Observer to detect visibility

		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(async (entry) => {
					if (!entry.isIntersecting) {
						// Pause video when out of view
						if (this.player) {
							await this.player.pause();
						}
					}
				});
			},
			{ threshold: 0.3 } // Trigger when 30% of video is visible
		);

		// Start observing the video element
		if (this.maincontainer?.nativeElement) {
			this.observer.observe(this.maincontainer.nativeElement);
		}

		document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
	}

	async handleVisibilityChange() {
		if (document.hidden) {
			await this.appService.pauseVideo();
		}
	}

	ngOnInit() {
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		this.appService.pauseVideo();
		if (this.video_asset) {
			this.checkCode();
		}

		if (this.updateTime) {
			this.updateTime = JSON.parse(this.updateTime);
		} else {
			this.updateTime = false;
		}
		if (this.currentPlayTime) {
			this.currentPlayTime = parseFloat(this.currentPlayTime);
		}
	}

	// Function: Check and wait for container width to be available before playing the video
	checkCode() {
		// Check if the video path exists
		// console.log("----------In CheckCode-----------")
		if (this.video_asset?.path) {
			let count = 0;
			this.checkInterval = setInterval(() => {
				count++;

				// Stop interval after 50 attempts
				if (count > 50) {
					clearInterval(this.checkInterval);
				}

				// Check if the main container's width is not 0
				if (this.maincontainer?.nativeElement?.offsetWidth != 0 || this.videoType == 'Preview_Asset') {
					// If conditions met, play the video and clear the interval
					this.playVideo();
					clearInterval(this.checkInterval);
				}
			}, 100);
		}
	}

	// Function: Play the video and handle related events
	playVideo() {
		// console.log('--this.video_asset-1', this.video_asset);
		// Create a new Vimeo player instance
		// let height = 499;
		// let minusWidth = 0;
		// console.log(
		// 	'this.maincontainer.nativeElement',
		// 	this.maincontainer.nativeElement.offsetWidth,
		// 	this.maincontainer.nativeElement.offsetHeight
		// );

		// // if (this.isMobileView || this.isTabletLandscapeView) {
		// // 	height = 0;
		// // }

		// // if (!this.isdesktopView) {
		// // 	minusWidth = 0;
		// // } else {
		// // 	minusWidth = 10;
		// // }

		// // console.log('-minusWidth-', minusWidth);

		// this.player = new Vimeo(this.vimeoPlayer.nativeElement, {
		// 	id: this.video_asset.path,
		// 	width: this.maincontainer.nativeElement.offsetWidth
		// 		? this.maincontainer.nativeElement.offsetWidth - minusWidth
		// 		: 50,
		// 	height: height,
		// });

		const containerWidth = this.maincontainer.nativeElement.offsetWidth || 320;

		// 16:9 aspect ratio
		const aspectRatio = 9 / 16;
		let height = Math.floor(containerWidth * aspectRatio);

		console.log('height:', height);

		// Optional: Clamp height if needed
		const screenHeight = window.innerHeight;

		console.log('screenHeight:', screenHeight);

		if (height > screenHeight * 0.8) {
			height = Math.floor(screenHeight * 0.8); // Max 80% of screen height
		}

		console.log('height22:', height);

		if (this.videoType === 'Module_Asset_Preview') {
			height = Math.floor(screenHeight * 0.7);
		}

		console.log('Final Width:', containerWidth);
		console.log('Final Height:', height);

		this.player = new Vimeo(this.vimeoPlayer.nativeElement, {
			id: this.video_asset.path,
			width: containerWidth,
			height: height,
		});

		// Check for existing video logs
		if (this.currentPlayTime > -1) {
			// Set video log ID and current time if logs exist
			this.appService.videoLogId = this.assignPostId;
			// console.log('---this.assignPostId---', this.assignPostId);
			this.player
				.setCurrentTime(this.currentPlayTime)
				.then(function (ids) {})
				.catch(function (error) {});
		}

		// Event listener for when the video starts playing
		this.player.on('play', async (data) => {
			// console.log('--this.video_asset-2', this.video_asset);
			// Set the current playing video in the service
			if (this.appService.videoLogId != this.assignPostId) {
				// await this.appService.pauseVideo();
			}

			// if (this.appService.currentYoutubePlayingVideo) {
			// 	this.appService.currentYoutubePlayingVideo.pauseVideo();
			// }
			this.appService.videoLogId = this.assignPostId;
			this.appService.currentVimeoPlayingVideo = this.player;
			// console.log('Video is playing', data);

			this.player.on('timeupdate', (data) => {
				this.appService.videoPlayInPercentage = data.percent;
				this.appService.videoPlayTimeDuration = data.seconds;
				this.appService.videoTotalTimeDuration = data.duration;
				this.currentPlayTime = data.seconds;
			});

			if (this.isDripClickAction === false) {
				this.appService.updateDripClickAction(this.assignPostId).subscribe((res: any) => {
					if (res.success) {
						this.isDripClickAction = true;
					}
				});
			}

			// // Check for existing video logs
			// if (this.currentPlayTime > -1 && this.currentPlayTime < data.duration) {
			// 	// Set video log ID and current time if logs exist
			// 	this.appService.videoLogId = this.assignPostId;
			// 	// console.log('---this.assignPostId---', this.assignPostId);
			// 	this.player
			// 		.setCurrentTime(this.currentPlayTime)
			// 		.then(function (ids) {})
			// 		.catch(function (error) {});
			// }

			// else if (this.video_asset?.DripVideoLogs?.length > 0) {
			// 	// Set drip video log ID and current time if logs exist

			// 	// Need to Change This Code
			// 	this.appService.videoLogId = this.video_asset.DripVideoLogs[0].id;
			// 	this.player
			// 		.setCurrentTime(this.video_asset.DripVideoLogs[0].seconds)
			// 		.then(function (ids) {})
			// 		.catch(function (error) {});
			// } else if (this.video_asset?.DiwoVideoLogs?.length > 0) {

			// 	// Need to Change This Code
			// 	this.appService.videoLogId = this.video_asset.DiwoVideoLogs[0].id;
			// 	this.player
			// 		.setCurrentTime(this.video_asset.DiwoVideoLogs[0].seconds)
			// 		.then(function (ids) {})
			// 		.catch(function (error) {});
			// } else if (this.UserId) {
			// 	// Create new video watch log if no existing logs

			// 	// Need to Change This Code
			// 	let payload = {
			// 		UserId: this.UserId,
			// 		AssetDetailId: null,
			// 		UserBriefFileId: null,
			// 		SessionAssetId: null,
			// 		DiwoAssetId: null,
			// 	};
			// 	if (this.videoType === 'Asset' || this.videoType === 'Preview_Asset') {
			// 		payload.AssetDetailId = this.video_asset.id;
			// 	} else if (this.videoType == 'Brief_Asset') {
			// 		payload.UserBriefFileId = this.video_asset.id;
			// 	} else if (this.videoType == 'Session_Asset') {
			// 		payload.SessionAssetId = this.video_asset.id;
			// 	} else if (this.videoType == 'Diwo_Asset') {
			// 		payload.DiwoAssetId = this.video_asset.id;
			// 	}
			// 	this.appService.createVideoWatchIngLog(payload).subscribe((res: any) => {
			// 		if (res.success) {
			// 			this.appService.videoLogId = res.data.id;
			// 			if (this.appService.type == 'drip') {
			// 				this.video_asset.DripVideoLogs = [res.data];
			// 			} else if (this.appService.type == 'diwo') {
			// 				this.video_asset.DiwoVideoLogs = [res.data];
			// 			}
			// 		}
			// 	});
			// }
			// Check and update video playing time
			if (this.UserId) {
				this.checkVideoPlayingTime();
			}
		});

		this.player.on('pause', async (data) => {
			this.currentPlayTime = data.seconds;
			await this.appService.pauseVideo(false, this.updateTime, this.videoType);
			// console.log('--Pause Vimeo Video---', data);
		});

		this.player.on('seeked', async (data) => {
			if (data.seconds > this.appService.videoPlayTimeDuration + 1) {
				this.player
					.setCurrentTime(this.currentPlayTime)
					.then(function (ids) {})
					.catch(function (error) {});
			}
		});
	}

	// Function: Check video playing time and update the log if necessary
	checkVideoPlayingTime() {
		this.player.on('timeupdate', (data) => {
			if (data.seconds > this.appService.videoPlayTimeDuration + 1) {
				this.player
					.setCurrentTime(this.currentPlayTime)
					.then(function (ids) {})
					.catch(function (error) {});
			} else {
				this.appService.videoPlayInPercentage = data.percent;
				this.appService.videoPlayTimeDuration = data.seconds;
				this.appService.videoTotalTimeDuration = data.duration;
				this.currentPlayTime = data.seconds;
			}

			// if (this.appService.type == 'drip' && this.video_asset?.DripVideoLogs?.length > 0) {
			// 	this.video_asset.DripVideoLogs[0].seconds = data.seconds;
			// } else if (this.appService.type == 'diwo' && this.video_asset?.DiwoVideoLogs?.length > 0) {
			// 	this.video_asset.DiwoVideoLogs[0].seconds = data.seconds;
			// }
		});
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024;
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Adjusted to include 768
		this.isMobileView = window.innerWidth < 767; // Strictly less than 768
	}
}
