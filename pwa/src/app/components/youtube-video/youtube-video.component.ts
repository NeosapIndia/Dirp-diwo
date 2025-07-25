import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayer } from '@angular/youtube-player';
import { AppService } from 'src/app/app.service';
@Component({
	selector: 'app-youtube-video',
	templateUrl: './youtube-video.component.html',
	styleUrls: ['./youtube-video.component.scss'],
})
export class YoutubeVideoComponent implements OnInit {
	apiLoaded = false;
	@ViewChild('youtubePlayer') youtubePlayer: YouTubePlayer;
	@ViewChild('youtube_video_container') maincontainer: ElementRef;

	@Input() video_asset: any;
	@Input() UserId: any;
	@Input() videoType: any;
	@Input() assignPostId: any;
	@Input() isDripClickAction: any;
	@Input() currentPlayTime: any;
	@Input() updateTime: any;
	screenWidth: number;
	screenHeight: number;
	startSeconds: any;
	endSeconds: number;
	trustedVideoUrl: SafeResourceUrl;
	youtubeVideoId: any;

	constructor(public sanitizer: DomSanitizer, private appService: AppService) {}
	player;
	ngOnInit() {
		if (!this.apiLoaded) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.body.appendChild(tag);
			this.apiLoaded = true;
		}
		this.youtubeVideoId = this.getVideoIdFromUrl(this.video_asset.path);
		if (!this.youtubeVideoId) {
			this.youtubeVideoId = this.getVideoIdFromEmbedUrl(this.video_asset.path);
		}
		if (this.currentPlayTime) {
			this.currentPlayTime = parseFloat(this.currentPlayTime);
		}

		if (this.updateTime) {
			this.updateTime = JSON.parse(this.updateTime);
		} else {
			this.updateTime = false;
		}
		// if (this.video_asset?.DripVideoLogs?.length > 0) {
		// 	this.appService.videoLogId = this.video_asset.DripVideoLogs[0].id;
		// 	this.startSeconds = this.video_asset.DripVideoLogs[0].seconds;
		// } else if (this.video_asset?.DiwoVideoLogs?.length > 0) {
		// 	this.appService.videoLogId = this.video_asset.DiwoVideoLogs[0].id;
		// 	this.startSeconds = this.video_asset.DiwoVideoLogs[0].seconds;
		// }

		this.setWidthAndHeight();
	}

	setWidthAndHeight() {
		let checkIntervel = setInterval(() => {
			if (this.maincontainer?.nativeElement?.offsetWidth != 0) {
				this.screenWidth = this.maincontainer.nativeElement.offsetWidth;
				this.screenHeight = this.screenWidth * (9 / 16);
				clearInterval(checkIntervel);
			}
		}, 10);
	}
	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	async stateChange(event) {
		if (!this.isDripClickAction && event.data == 3) {
			this.appService.updateDripClickAction(this.assignPostId).subscribe((res: any) => {
				if (res.success) {
					this.isDripClickAction = true;
				}
			});
		}
		if (event.data == 1) {
			await this.appService.pauseVideo();

			this.appService.currentYoutubePlayingVideo = this.youtubePlayer;
			// if (
			// 	((this.appService.type == 'drip' && this.video_asset.DripVideoLogs.length == 0) ||
			// 		(this.appService.type == 'diwo' && this.video_asset.DiwoVideoLogs.length == 0)) &&
			// 	this.UserId
			// ) {
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
			// 			} else if (this.appService.type === 'diwo') {
			// 				this.video_asset.DiwoVideoLogs = [res.data];
			// 			}
			// 		}
			// 	});
			// }
			// else {
			// 	this.appService.videoLogId = this.assignPostId;
			// 	// if (this.video_asset?.DripVideoLogs?.length > 0) {
			// 	// 	this.appService.videoLogId = this.video_asset.DripVideoLogs[0].id;
			// 	// } else if (this.video_asset?.DiwoVideoLogs?.length > 0) {
			// 	// 	this.appService.videoLogId = this.video_asset.DiwoVideoLogs[0].id;
			// 	// }
			// }
			this.appService.videoLogId = this.assignPostId;

			if (this.UserId && !this.appService.youtubeVideoCheckTimeIntervel) {
				this.checkVideoPlayingTime();
			}
		} else if (event.data == 2) {
			clearInterval(this.appService.youtubeVideoCheckTimeIntervel);
			this.appService.youtubeVideoCheckTimeIntervel = 0;
			this.appService.pauseVideo(this.updateTime);
		}
	}

	checkVideoPlayingTime() {
		this.appService.youtubeVideoCheckTimeIntervel = setInterval(() => {
			if (this.appService.videoLogId) {
				this.appService.videoPlayTimeDuration = this.youtubePlayer.getCurrentTime().toFixed(2);
				this.appService.videoTotalTimeDuration = this.youtubePlayer.getDuration().toFixed(2);
				this.appService.videoPlayInPercentage = (
					this.appService.videoPlayTimeDuration / this.appService.videoTotalTimeDuration
				).toFixed(2);
				this.currentPlayTime = this.appService.videoPlayTimeDuration;
				// if (this.appService.type == 'drip' && this.video_asset?.DripVideoLogs?.length > 0) {
				// 	this.video_asset.DripVideoLogs[0].seconds = this.appService.videoPlayTimeDuration;
				// } else if (this.appService.type == 'diwo' && this.video_asset?.DiwoVideoLogs?.length > 0) {
				// 	this.video_asset.DiwoVideoLogs[0].seconds = this.appService.videoPlayTimeDuration;
				// }
			}
		}, 1000);
	}

	getVideoIdFromUrl(url) {
		const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = url.match(regExp);

		if (match && match[2].length === 11) {
			return match[2];
		} else {
			// Handle invalid URL or no match
			return null;
		}
	}

	getVideoIdFromEmbedUrl(url) {
		const regExp = /^.*(?:youtu\.be\/|\/embed\/)([^#\&\?]*).*/;
		const match = url.match(regExp);

		if (match && match[1].length === 11) {
			return match[1];
		} else {
			// Handle invalid URL or no match
			return null;
		}
	}
}
