import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
// import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'app-forgot-password',
	templateUrl: './forgot-password.page.html',
	styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {
	isTabletOrIpad = false;
	projectName: string;
	imageHost = ENV.imageHost + ENV.imagePath;

	loginInput = null;
	configurable_feature: any;

	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
	iconObject = {
		emailIcon: null,
	};
	isEmailSend: boolean = false;
	emailSendTo = null;

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
			localStorage.setItem('projectName', 'drip');
		}
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit(): void {
		setTimeout(() => {
			this.configurable_feature = this.appService.configurable_feature;

			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		this.checkWindowSize();

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getPlaceholder(): string {
		if (!this.configurable_feature) {
			return 'Email';
		}

		const { pwa_email, pwa_phone, pwa_username } = this.configurable_feature;

		if (pwa_email && pwa_phone && pwa_username) {
			return this.appService.getTranslation('Utils.email_phone_username');
		}
		if (pwa_email && pwa_phone) {
			return this.appService.getTranslation('Utils.email_phone');
		}
		if (pwa_email && pwa_username) {
			return this.appService.getTranslation('Utils.email_username');
		}
		if (pwa_phone && pwa_username) {
			return this.appService.getTranslation('Utils.phone_username');
		}
		if (pwa_email) {
			return this.appService.getTranslation('Utils.email');
		}
		if (pwa_phone) {
			return this.appService.getTranslation('Utils.phone');
		}
		if (pwa_username) {
			return this.appService.getTranslation('Utils.username');
		}
		return this.appService.getTranslation('Utils.login');
	}

	onClickRequestLink() {
		const { pwa_email, pwa_phone, pwa_username } = this.configurable_feature;

		let validInput = false;
		let errorMessage = '';
		const loginInputValue = this.loginInput;

		if (loginInputValue == null || loginInputValue == '' || loginInputValue == undefined) {
			if (pwa_email && pwa_phone && pwa_username) {
				errorMessage = this.appService.getTranslation('Utils.enteremailphoneusername');
				validInput = true;
			} else if (pwa_email && pwa_phone && !pwa_username) {
				errorMessage = this.appService.getTranslation('Utils.enteremailphone');
				validInput = true;
			} else if (pwa_email) {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectEmail');
				validInput = true;
			} else if (pwa_phone) {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
				validInput = true;
			} else if (pwa_username) {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectUsername');
				validInput = true;
			}
		}

		if (validInput) {
			this.presentToast(errorMessage);
			return;
		}

		this.loginInput = loginInputValue;
		this.requestLink();
	}

	async requestLink() {
		const { pwa_email, pwa_phone, pwa_username } = this.configurable_feature;
		await this.appService.showLoader();
		let data: any = {};

		// Assign the correct key based on allowed configurations
		if (pwa_email && this.isEmail(this.loginInput)) {
			data.email = this.loginInput;
		} else if (pwa_phone && this.isPhone(this.loginInput)) {
			data.phone = this.loginInput;
		} else if (pwa_username) {
			data.username = this.loginInput;
		}

		this.appService.forgotpassword(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					this.emailSendTo = res.data.email;
					this.isEmailSend = true;
				} else {
					this.isEmailSend = false;
					this.appService.hideLoader();
					const key = this.appService.GetLanguageKey(res.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			},
			(error) => {
				this.isEmailSend = false;
				this.appService.hideLoader();
				const key = this.appService.GetLanguageKey(error.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
			}
		);
	}

	backtoLogin() {
		this.loginInput = null;
		this.isEmailSend = false;
		this.navCtrl.navigateForward(['/login']);
	}

	isEmail(input) {
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailPattern.test(input);
	}

	isPhone(input) {
		return /^[0-9]{10}$/.test(input);
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

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}
}
