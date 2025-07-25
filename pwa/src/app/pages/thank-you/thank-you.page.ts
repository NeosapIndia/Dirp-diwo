import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ModalController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-thank-you',
	templateUrl: './thank-you.page.html',
	styleUrls: ['./thank-you.page.scss'],
})
export class ThankYouPage implements OnInit {
	notificationList: any = [];
	responseFlag = true;
	userId: any;
	appBrandingInfo: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	projectType = null;
	perPage = 25;
	page = 1;
	type = 'drip';
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	isApiLoad: boolean = false;
	iconObject = {};

	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public toastCtrl: ToastController,
		public route: ActivatedRoute,
		public sanitizer: DomSanitizer
	) {}

	ngOnInit(): void {
		setTimeout(() => {
			this.type = this.appService.type;
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
		setTimeout(async () => {
			if (!this.appBrandingInfo) {
				//for staging and prodction
				let hostName = window.location.origin.toLowerCase();
				if (hostName.endsWith(ENV.dripHostPlacholder)) {
					this.projectType = 'drip';
				} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
					this.projectType = 'diwo';
				}
				//for dev
				if (!this.projectType) {
					this.projectType = localStorage.getItem('projectName');
				}

				await this.appService.setSiteBranding();
			}
		}, 100);
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	back() {
		this.appService.pauseVideo(true);

		this.navCtrl.pop();
	}

	doRefresh(e) {
		this.page = 0;
		e.target.complete();
	}
}
