import { HttpClient } from '@angular/common/http';
import { Component, HostListener, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { CookieService } from 'ngx-cookie-service';

@Component({
	selector: 'app-switch-account',
	templateUrl: './switch-account.page.html',
	styleUrls: ['./switch-account.page.scss'],
})
export class SwitchAccountPage {
	aboutUsInfo;
	imageHost = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	appVersion;
	clientList: any = [];
	projectName: string;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;

	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
	iconObject = {};

	constructor(
		public http: HttpClient,
		public platform: Platform,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public appService: AppService,
		public plt: Platform,
		private route: ActivatedRoute,
		private router: Router,
		public config: AppConfig // private cookieService: CookieService
	) {
		this.projectName = localStorage.getItem('projectName') ? localStorage.getItem('projectName') : 'drip';
		this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.appVersion = ENV.appVersion;
		if (localStorage.getItem('otherClientList')) {
			this.clientList = JSON.parse(localStorage.getItem('otherClientList'));
		} else {
			this.navCtrl.navigateRoot('login');
		}
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);

		this.checkWindowSize();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getAppBrancding() {
		if (localStorage.getItem('appBrandingAboutUsPage') == 'True') {
			localStorage.setItem('appBrandingAboutUsPage', 'false');
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		}
	}

	ionViewWillEnter() {}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	selecteClient(data) {
		this.getToken(data);
	}

	getToken(data) {
		const payload = {
			UserId: data.UserId,
			RoleId: data.RoleId,
			ClientId: data.ClientId,
		};
		this.appService.getToken(payload).subscribe((res: any) => {
			if (res.success) {
				// console.log('----------Login SuccessFully---------');
				this.saveTokenAndGotHomePage(res);
			}
		});
	}

	async saveTokenAndGotHomePage(res) {
		localStorage.setItem('getUserData', 'true');
		localStorage.setItem('appBrandingAboutUsPage', 'true');
		localStorage.setItem('appBrandingAllPostPage', 'true');

		if (res?.user) {
			res.user = this.appService.removePersonalData(res.user);
		}

		localStorage.setItem('user', JSON.stringify(res));
		localStorage.setItem('user_type', res.user.type);
		localStorage.setItem('user_id', res.user.id);
		// localStorage.setItem('session_token', res.token);
		await this.appService.setUserPersonalData();
		for (let role of res.user.roles) {
			// 1==>> Learner
			// 11==>> Trainer
			if (role.roleId == 1 || role.roleId == 11) {
				localStorage.setItem('user_client', JSON.stringify(role.client));
				if (role.roleId == 11) {
					localStorage.setItem('isTrainer', 'true');
				}
				this.appService.getAppBranding(role.client.id).subscribe((res: any) => {
					if (res.success) {
						localStorage.setItem('app_branding', JSON.stringify(res.data));
					}
				});
			}
		}
		if (this.projectName == 'drip') {
			this.navCtrl.navigateRoot('tabs/all-drips');

			// let oldCookie = this.cookieService.get('cookies');
			// let token = this.appService.generateCookieURL();

			// this.cookieService.set('cookies', token);
			// if (oldCookie) {
			// 	this.cookieService.set('oldCookies', oldCookie);
			// }

			// this.appService.verifyCookie(res.user.id).subscribe((res: any) => {
			// 	this.cookieService.delete('oldCookies');
			// 	this.navCtrl.navigateRoot('tabs/all-drips');
			// });
		} else if (this.projectName == 'diwo') {
			this.navCtrl.navigateRoot('mark-present');
			// let oldCookie = this.cookieService.get('cookies');
			// let token = this.appService.generateCookieURL();

			// this.cookieService.set('cookies', token);
			// if (oldCookie) {
			// 	this.cookieService.set('oldCookies', oldCookie);
			// }

			// this.appService.verifyCookie(res.user.id).subscribe((res: any) => {
			// 	this.cookieService.delete('oldCookies');
			// 	let useData: any = JSON.parse(localStorage.getItem('user'));
			// 	// if (useData.user.isReg_Completed == false) {
			// 	// 	console.log('useData');
			// 	this.navCtrl.navigateRoot('mark-present');
			// 	// } else {
			// 	// this.navCtrl.navigateRoot('tabs/all-modules');
			// 	// }
			// });
		}
	}

	getBackgroundStyle() {
		if (this.isMobile || this.isMobileView || this.isTabletPortraitView) {
			return { backgroundColor: '#f4f5f3' };
		} else {
			return {
				backgroundImage: `url('${this.appService.loginBackgroundImage}')`,
			};
		}
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isMobileView = window.innerWidth < 767;
	}
}
