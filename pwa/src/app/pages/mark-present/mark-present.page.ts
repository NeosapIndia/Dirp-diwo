import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
var country = '';

@Component({
	selector: 'app-marker-present',
	templateUrl: './mark-present.page.html',
	styleUrls: ['./mark-present.page.scss'],
})
export class MarkPresentPage {
	form: FormGroup;
	isTabletOrIpad = false;
	projectName: string;
	sessionData: any;
	userData: any;
	appBrandingInfo: any;
	avatar: any;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	appBranding: any;
	sessionUserImg: string | null = null;
	loginAppBranding: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	backgroundImageUrl: any;
	logoImage: any;
	iconObject = {};

	constructor(
		public config: AppConfig,
		public sanitizer: DomSanitizer,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public plt: Platform,
		private router: Router,
		public http: HttpClient,
		public appService: AppService,
		private route: ActivatedRoute
	) {
		this.loginAppBranding = JSON.parse(localStorage.getItem('loginAppBrading'));

		this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.isTabletOrIpad = this.plt.is('tablet') || this.plt.is('ipad');

		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(ENV.dripHostPlacholder)) {
			this.projectName = 'drip';
		} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
			this.projectName = 'diwo';
		}
		if (this.projectName) {
			localStorage.setItem('projectName', this.projectName);
		} else if (localStorage.getItem('projectName') && localStorage.getItem('projectName') !== 'null') {
			this.projectName = localStorage.getItem('projectName');
		} else {
			localStorage.setItem('projectName', 'diwo');
		}

		this.userData = JSON.parse(localStorage.getItem('user')).user;

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);

		if (this.loginAppBranding) {
			this.setBrandingImages();
		}

		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);
		let sessionCode = localStorage.getItem('sessionCode');

		if (sessionCode && sessionCode != null && sessionCode != undefined) {
			this.getSessionDetails(sessionCode);
		} else {
			this.redirectToHomePage();
		}

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	async getSessionDetails(sessionCode) {
		await this.appService.showLoader();
		let userId = null;
		if (localStorage.getItem('user')) {
			userId = JSON.parse(localStorage.getItem('user')).user.id;
		}
		this.appService.getSessionDetailsBySessionCode(sessionCode).subscribe(
			(res: any) => {
				if (res.success) {
					setTimeout(() => {
						if (res.data) {
							this.sessionData = res.data;
							let sessionUser = this.sessionData?.SessionUsers;

							if (sessionUser?.SessionAssets?.length > 0) {
								this.sessionUserImg = ENV.imageHost + ENV.imagePath + sessionUser.SessionAssets[0].path;
							}

							this.appBranding = this.sessionData.appBranding;
							this.appService.hideLoader();
						} else {
							this.sessionData = null;
							const key = this.appService.GetLanguageKey(res.message);
							if (key) {
								this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
							} else {
								this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
							}
							this.appService.hideLoader();
							this.redirectToHomePage();
						}
					}, 1000);
				} else {
					this.appService.hideLoader();
				}
			},
			(error) => {
				if (error.status == 422) {
					this.appService.hideLoader();
					const key = this.appService.GetLanguageKey(error.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				} else if (error.status === 401) {
					this.appService.hideLoader();
					this.presentToast(this.appService.getTranslation('Utils.unauthorized_access'));
					this.redirectToHomePage();
				} else {
					this.appService.hideLoader();
					const key = this.appService.GetLanguageKey(error.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
					this.redirectToHomePage();
				}
			}
		);
	}

	async submit() {
		await this.appService.showLoader();
		let code = localStorage.getItem('sessionCode');
		let userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.appService.assignSessionWorksheet(code).subscribe(
			(res: any) => {
				if (res.success) {
					this.appService.hideLoader();
					this.presentToast(this.appService.getTranslation('Utils.allsetforsession'));
					this.redirectToHomePage();
				} else {
					this.appService.hideLoader();
				}
			},
			(error) => {
				if (error.status == 422) {
					this.appService.hideLoader();
					const key = this.appService.GetLanguageKey(error.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				} else if (error.status === 401) {
					this.appService.hideLoader();
					this.presentToast(this.appService.getTranslation('Utils.unauthorized_access'));
				} else {
					this.appService.hideLoader();
					const key = this.appService.GetLanguageKey(error.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			}
		);
	}

	redirectToHomePage() {
		this.appService.hideLoader();
		localStorage.removeItem('sessionCode');
		let userDetails = JSON.parse(localStorage.getItem('user')).user;
		if (userDetails && userDetails?.acceptPolicy == false) {
			this.router.navigate(['policy-notification']);
		} else {
			this.navCtrl.navigateRoot('tabs/all-modules');
		}
	}

	setBrandingImages() {
		this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustStyle(
			`url(${this.imageBaseURL + this.loginAppBranding.diwoPWALoginPath})`
		);
		let diwoURL = this.imageBaseURL + this.loginAppBranding.diwoPwaPath;
		this.logoImage = this.sanitizer.bypassSecurityTrustResourceUrl(diwoURL);
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}
}
