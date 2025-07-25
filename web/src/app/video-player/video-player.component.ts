import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import Hls from 'hls.js';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
	selector: 'app-video-player',
	templateUrl: './video-player.component.html',
	styleUrls: ['./video-player.component.scss'],
})
export class MediaCMSPlayerComponent implements OnInit, AfterViewInit {
	@Input() VideoPath: string;
	@ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;
	hlsVideo: any;

	vimeoVideoUrl: any;

	constructor(public appService: AppService, public sanitizer: DomSanitizer) {}

	ngAfterViewInit() {
		if (this.appService?.configurable_feature?.mediaCMS) {
			this.hlsVideo = this.videoPlayer.nativeElement;
			if (Hls.isSupported()) {
				const hls = new Hls();
				hls.loadSource(this.VideoPath);
				hls.attachMedia(this.hlsVideo);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					// this.seekToLastWatched();
					// this.hlsVideo.currentTime = 15;
				});
			} else if (this.hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
				// For Safari
				this.hlsVideo.src = this.VideoPath;
				this.hlsVideo.addEventListener('loadedmetadata', () => {
					this.seekToLastWatched();
				});
			} else {
				console.error('HLS is not supported in this browser.');
			}

			// Playback Events
			this.hlsVideo.addEventListener('play', () => {
				console.log('📽️ Video started playing');
				//Before Play we need to check and stop another plying video
				if (this.appService.cmsVideoPlayer) {
					this.appService.cmsVideoPlayer.pause();
				}
				this.appService.cmsVideoPlayer = this.hlsVideo;
				this.hlsVideo.addEventListener('timeupdate', () => this.trackWatchedTime());
			});

			this.hlsVideo.addEventListener('pause', () => {
				console.log('⏸️ Video paused');
				this.appService.cmsVideoPlayer = null;
			});

			this.hlsVideo.addEventListener('ended', () => {
				console.log('✅ Video ended');
				this.appService.cmsVideoPlayer = null;
			});
		} else if (this.appService?.configurable_feature?.vimeo) {
			this.vimeoVideoUrl = this.transform(this.VideoPath);
		}
	}

	trackWatchedTime() {
		const video = this.videoPlayer.nativeElement;
		const currentSecond = Math.floor(video.currentTime);
		console.log('---- Current second:', currentSecond);
	}

	seekToLastWatched() {
		const video = this.videoPlayer.nativeElement;
		const lastWatched = '0';
		if (lastWatched) {
			const time = parseInt(lastWatched, 10);
			if (!isNaN(time) && time < video.duration) {
				video.currentTime = time;
				console.log('Resuming from:', time, 'seconds');
			}
		}
	}

	ngOnInit() {
		console.log('---------- VideoPath:', this.VideoPath);
	}

	transform(url) {
		console.log('---url---', url);
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
}
