import { Component, HostListener, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-tabs',
	templateUrl: 'tabs.page.html',
	styleUrls: ['tabs.page.scss'],
})
export class TabsPage implements OnInit {
	isClicked = false;
	projectName;
	appBrandingInfo: any;
	isdesktopView: boolean = true;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	isTabletLandscapeView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isdesktopDetectedView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
	iconObject = {};
	constructor(public appService: AppService, public platform: Platform) {
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));

			this.isdesktopDetectedView = this.appService.isdesktopView;
			this.isTabletLandscapeDetectedView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;

			// let element = document.documentElement;
			// let color =
			// 	this.appBrandingInfo && this.appBrandingInfo.accent_color ? this.appBrandingInfo.accent_color : '#6513e1';
			// element.style.setProperty('--ion-dynamic-color', `${color}`);
		}, 100);

		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(ENV.dripHostPlacholder)) {
			this.projectName = 'drip';
		} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
			this.projectName = 'diwo';
		}

		if (!this.projectName && localStorage.getItem('projectName') && localStorage.getItem('projectName') != 'null') {
			this.projectName = localStorage.getItem('projectName');
		} else {
			localStorage.setItem('projectName', 'drip');
		}
		this.appService.setIconWhiteBranding(this.iconObject, '#6513e1');
	}
	onClick($event) {
		this.isClicked = !this.isClicked;
	}

	//Screen Responsive Code
	ngOnInit() {
		this.checkWindowSize();
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024; // Adjust the width as needed
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Adjust the width as needed
	}
}
