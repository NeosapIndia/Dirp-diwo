import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import * as owasp from 'owasp-password-strength-test';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'app-reset-password',
	templateUrl: './reset-password.page.html',
	styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
	isTabletOrIpad = false;
	projectName: string;
	form: FormGroup;
	passwordFeedback: any = [];
	pageMode: any;

	showPassword: boolean = false;
	showConfirmPassword: boolean = false;
	isTokenExpired: boolean = false;

	configurable_feature: any;

	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
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
		private route: ActivatedRoute,
		private formBuilder: FormBuilder
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

		owasp.config({
			minLength: 8,
			maxLength: 64,
			minOptionalTestsToPass: 4,
		});

		this.checkResetPasswordTokenValidity();

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit(): void {
		this.form = this.formBuilder.group({
			newPassword: ['', [Validators.required]],
			confirmPassword: ['', [Validators.required, this.matchPasswordValidator.bind(this)]],
		});

		setTimeout(() => {
			this.configurable_feature = this.appService.configurable_feature;

			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		const navigation = this.router.getCurrentNavigation();
		if (navigation?.extras?.state) {
			const state = navigation.extras.state;
			if (state.pageMode && state.pageMode !== '' && state.pageMode != null) {
				this.pageMode = state.pageMode;
			} else {
				state.pageMode = 'Reset';
			}
		}

		this.checkWindowSize();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	matchPasswordValidator(control: FormControl) {
		if (this.form) {
			return control.value === this.form.get('newPassword').value ? null : { mismatch: true };
		}
		return null;
	}

	checkPasswordStrength() {
		const result = owasp.test(this.form.get('newPassword').value);
		this.passwordFeedback = [];

		if (result.errors.length > 0) {
			this.passwordFeedback.push(...result.errors.map((error) => ({ message: error, valid: false })));
		}

		if (result.strong) {
			this.passwordFeedback.push({ message: 'Password is strong.', valid: true });
		}
	}

	togglePassword() {
		if (!this.isTokenExpired) {
			this.showPassword = !this.showPassword;
		}
	}

	toggleConfirmPassword() {
		if (!this.isTokenExpired) {
			this.showConfirmPassword = !this.showConfirmPassword;
		}
	}

	checkResetPasswordTokenValidity() {
		this.appService.checkResetPasswordTokenValidity().subscribe(
			(res: any) => {
				if (res.success === true) {
					this.isTokenExpired = false;
				} else {
					this.isTokenExpired = true;
					const key = this.appService.GetLanguageKey(res.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			},
			(error) => {
				this.isTokenExpired = true;
				const key = this.appService.GetLanguageKey(error.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
			}
		);
	}

	async resetPassword() {
		const result = owasp.test(this.form.get('newPassword').value);

		if (result.errors.length > 0 || this.form.invalid) {
			this.markFormControlsAsTouched();
			return;
		}

		if (this.form.get('newPassword').value === this.form.get('confirmPassword').value) {
			await this.appService.showLoader();
			let payload = {
				pass: this.form.get('newPassword').value,
			};

			this.appService.resetpassword(payload).subscribe(
				(res: any) => {
					if (res.success === true) {
						this.presentToast(this.appService.getTranslation('Utils.passwordchnagetoaster'));
						this.navCtrl.navigateForward(['/login']);
						localStorage.clear();
						localStorage.setItem('projectName', 'diwo');
						this.appService.hideLoader();
					} else {
						this.presentToast(res.error);
						this.appService.hideLoader();
					}
				},
				(error) => {
					if (error.status == 422) {
						this.presentToast(error.error.error);
					} else {
						this.presentToast(error.error.error);
					}

					this.appService.hideLoader();
				}
			);
		} else {
			this.presentToast(this.appService.getTranslation('Utils.passwordnotmatch'));
		}
	}

	markFormControlsAsTouched() {
		Object.keys(this.form.controls).forEach((field) => {
			const control = this.form.get(field);
			control.markAsTouched({ onlySelf: true });
		});
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
