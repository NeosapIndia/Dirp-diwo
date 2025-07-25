import { Component, ElementRef, Input, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import Hls from 'hls.js';

@Component({
	selector: 'app-cms-video',
	templateUrl: './cms-video.component.html',
	styleUrls: ['./cms-video.component.scss'],
})
export class CMSVideoComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;
	hlsVideo: any;
	videoSrc: any;

	@ViewChild('cms_video_container') maincontainer: ElementRef;
	@Input() video_asset: any;
	@Input() UserId: any;
	@Input() videoType: any;
	@Input() assignPostId: any;
	@Input() isDripClickAction: any;
	@Input() currentPlayTime: any;
	@Input() updateTime: any;
	@Input() WorksheetId: any;
	@Input() isWorksheetPage: boolean = false;

	observer: IntersectionObserver | undefined;

	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	isMobileView: boolean = false;

	imageHost = ENV.imageHost + ENV.imagePath;
	checkInterval;
	isPaused: boolean = false;
	showMobileButton: boolean = true;

	constructor(private navCtrl: NavController, private appService: AppService, public sanitizer: DomSanitizer) {
		this.checkWindowSize();
	}

	ngOnDestroy() {
		if (this.observer) {
			this.observer.disconnect();
		}
		if (this.videoPlayer) {
			this.videoPlayer.nativeElement.pause();
		}
	}

	ngAfterViewInit() {
		if (this.video_asset?.path) {
			this.videoSrc = this.video_asset.path;
			this.hlsVideo = this.videoPlayer.nativeElement;

			if (this.currentPlayTime == null || this.currentPlayTime == '' || this.currentPlayTime < 0) {
				this.currentPlayTime = 0;
			}
			if (Hls.isSupported()) {
				const hls = new Hls();
				hls.loadSource(this.videoSrc);
				hls.attachMedia(this.hlsVideo);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					if (this.currentPlayTime > -1) {
						this.hlsVideo.currentTime = this.currentPlayTime;
					} else {
						this.hlsVideo.currentTime = 0;
					}
				});
			} else if (this.hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
				// For Safari
				this.hlsVideo.src = this.videoSrc;
				this.hlsVideo.addEventListener('loadedmetadata', () => {
					if (this.currentPlayTime > -1) {
						this.hlsVideo.currentTime = this.currentPlayTime;
					} else {
						this.hlsVideo.currentTime = 0;
					}
				});
			} else {
				console.error('HLS is not supported in this browser.');
			}

			this.hlsVideo.addEventListener('play', async (data) => {
				console.log('📽️ Video started playing');
				this.isPaused = true;
				await this.appService.pauseVideo();
				this.appService.videoLogId = this.assignPostId;
				this.appService.currentMediaCMSPlayingVideo = this.videoPlayer;

				this.hlsVideo.addEventListener('timeupdate', () => this.trackWatchedTime());

				if (this.isDripClickAction === false) {
					this.appService.updateDripClickAction(this.assignPostId).subscribe((res: any) => {
						if (res.success) {
							this.isDripClickAction = true;
						}
					});
				}
			});

			this.hlsVideo.addEventListener('pause', async (data) => {
				console.log('⏸️ Video paused');
				// console.log('this.updateTime', this.updateTime);
				// console.log('this.videoType', this.videoType);
				// console.log('this.videoLogId', this.assignPostId);
				this.isPaused = false;
				await this.appService.pauseVideo(false, this.updateTime, this.videoType);
				// this.hlsVideo.currentTime = this.currentPlayTime;
			});

			this.hlsVideo.addEventListener('seeking', async (data) => {
				// console.log("-----seeking------");
				if (this.hlsVideo.currentTime > this.currentPlayTime + 1) {
					this.hlsVideo.currentTime = this.currentPlayTime;
				}
			});

			this.hlsVideo.addEventListener('seeked', async (data) => {
				// console.log("----------seeked------------");
			});

			this.hlsVideo.addEventListener('ended', async (data) => {
				console.log('✅ Video ended');
				await this.appService.pauseVideo(false, this.updateTime, this.videoType);
				// this.hlsVideo.currentTime = this.currentPlayTime;
			});
			// Pause when tab is hidden

			document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
		}

		/////////////////////////////

		// Create Intersection Observer to detect visibility

		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(async (entry) => {
					if (!entry.isIntersecting) {
						// Pause video when out of view
						if (this.videoPlayer) {
							await this.videoPlayer.nativeElement.pause();
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
	}

	async handleVisibilityChange() {
		if (document.hidden && this.hlsVideo && !this.hlsVideo.paused) {
			await this.appService.pauseVideo(false, this.updateTime, this.videoType);
		}
	}

	trackWatchedTime() {
		const video = this.videoPlayer.nativeElement;
		const currentSecond = Math.floor(video.currentTime);
		const duration = Math.floor(video.duration);
		const percentageWatched = (currentSecond / duration).toFixed(2); // Calculate percentage watched

		// console.log('-**video**-', video);
		// console.log('-**currentSecond**-', currentSecond);
		// console.log('-**duration**-', duration);
		// console.log('-**percentageWatched**-', percentageWatched);
		// console.log('-**videoPlayTimeDuration**-', this.appService.videoPlayTimeDuration);

		if (currentSecond > this.currentPlayTime + 1) {
			this.hlsVideo.currentTime = this.currentPlayTime;
		} else {
			this.currentPlayTime = currentSecond;
			this.appService.videoPlayInPercentage = percentageWatched;
			this.appService.videoPlayTimeDuration = currentSecond;
			this.appService.videoTotalTimeDuration = duration;
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
					// this.playVideo();
					clearInterval(this.checkInterval);
				}
			}, 100);
		}
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024;
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024;
		this.isMobileView = window.innerWidth < 767;
	}

	togglePlayPause() {
		const video = this.videoPlayer.nativeElement;
		if (video.paused) {
			video.play();
		} else {
			video.pause();
		}

		if (!this.isdesktopView) {
			this.showMobileButton = true;

			setTimeout(() => {
				this.showMobileButton = false;
			}, 1000);
		}
	}
}
