import { Component, HostListener, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-notification',
	templateUrl: './notification.page.html',
	styleUrls: ['./notification.page.scss'],
})
export class NotificationPage implements OnInit {
	notificationList: any = [];
	responseFlag = true;
	userId: any;
	appBrandingInfo: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	projectType = null;
	perPage = 25;
	page = 1;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	constructor(public appService: AppService) {}

	ngOnInit() {
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}

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

				await this.appService.setSiteBranding(this.projectType);
			}
		}, 300);
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.getNotifcation();
		this.checkWindowSize();
	}

	getNotifcation() {
		this.appService.getUserNotification(this.perPage, this.page).subscribe((res: any) => {
			if (res.success) {
				this.notificationList = [];
				this.notificationList = res.data;
				this.appService.getUserReadNotification().subscribe((res: any) => {});
			}
		});
	}

	ionViewWillEnter() {
		this.getNotifcation();
	}

	paginateArray() {
		this.page++;
		this.notificationList = [];
		this.getNotifcation();
	}

	loadMore(event) {
		setTimeout(() => {
			this.paginateArray();
			event.target.complete();
		}, 1000);
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
