import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import * as ko from 'knockout';
import moment from 'moment';
// import { CookieService } from 'ngx-cookie-service';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { LanguageService } from 'src/app/services/language.service';
var country = '';

@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
	styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
	languages = [
		{ code: 'en', label: 'English (India)' },
		{ code: 'fr', label: 'Français' },
		{ code: 'ar', label: 'العربية' },
	];

	selectedLang = null;
	isLangOpen = false;

	isTabletOrIpad = false;
	projectName: string;
	imageHost = ENV.imageHost + ENV.imagePath;

	isOtpStep: boolean;
	loginInputText: any;
	password: any;
	otp: any;

	form: FormGroup;
	countryList: any;
	filterCountryData: any;
	showModal: boolean;
	editCountry: boolean;
	searhValue: any;
	selectedCountryName: any;
	selectedCountryCode: any;
	verifyUseingPhone: boolean = true;
	ipAddress: any;
	emailError: boolean = false;
	loginType: any;

	configurable_feature: any;
	showPassword: boolean = false;

	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
	otpSendText: any;
	iconObject = {
		language: null,
	};

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
		private formBuilder: FormBuilder,
		public platform: Platform,
		public langService: LanguageService
	) {
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

		if (localStorage.getItem('lang')) {
			this.selectedLang = localStorage.getItem('lang');
		}

		setTimeout(async () => {
			if (this.projectName) {
				await this.appService.setSiteBranding(this.projectName);
			}
			await this.appService.setIconWhiteBranding(this.iconObject);
		}, 100);

		this.isTabletOrIpad = this.plt.is('tablet') || this.plt.is('ipad');

		setTimeout(() => {
			this.configurable_feature = this.appService.configurable_feature;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		this.form = this.formBuilder.group({
			loginInput: ['', Validators.required],
			password: ['', Validators.required],
			otp: ['', Validators.required],
		});

		this.getAllCountryName();
		setTimeout(() => {
			this.forLoginUser();
		}, 500);
	}

	ngOnInit(): void {
		this.checkWindowSize();
	}

	getAllCountryName() {
		this.appService.getCountry().subscribe((res: any) => {
			this.countryList = res.data;
			for (let i in this.countryList) {
				this.countryList[i].countryCode = this.countryList[i].countryCode.toLowerCase();
			}
			this.filterCountryData = this.countryList;
			if (this.appService.configurable_feature && this.appService.configurable_feature.ipAddress_api) {
				this.getIPAddress();
			} else {
				country = 'India';
			}
		});
	}

	changeCountry() {
		this.showModal = true;
		this.editCountry = true;
		this.getAllCountryName();
	}

	selectcountry(country, data) {
		this.selectedCountryName = country;
		this.selectedCountryCode = data.countryCode.toLowerCase();
		this.modelBack();
	}

	get isRtl(): boolean {
		return this.langService.getCurrentLang() === 'ar';
	}

	changeLang($event) {
		let lang = $event.target.value;
		this.langService.setLanguage(lang);
		this.isLangOpen = false;
	}

	onLangOpen() {
		this.isLangOpen = true;
	}

	onLangClose() {
		setTimeout(() => {
			this.isLangOpen = false;
		}, 100);
	}

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			this.ipAddress = res.ip;
			this.getCountryName();
		});
	}

	getCountryName() {
		this.appService.getCountryName(this.ipAddress).subscribe((res: any) => (country = res.countryName));
	}

	back() {
		this.showModal = false;
	}

	_filter(value: string) {
		const filterValue = value.toLowerCase();
		if (filterValue == '' || filterValue == null) {
			this.filterCountryData = this.countryList;
		} else {
			this.filterCountryData = this.countryList.filter((option) => option.name.toLowerCase().includes(filterValue));
		}
	}

	modelBack() {
		this.showModal = false;
		this.editCountry = false;
		this.filterCountryData = [];
		this.searhValue = '';
	}

	forLoginUser() {
		let user = JSON.parse(localStorage.getItem('user'));
		if (user && user != '' && user != null && user != 'null') {
			this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
				this.ipAddress = res.ip;
				if (this.projectName == 'drip') {
					this.navCtrl.navigateRoot('tabs/all-drips');
				} else if (this.projectName == 'diwo') {
					this.navCtrl.navigateRoot('tabs/all-modules');
				}
			});
		} else {
			setTimeout(() => {
				if (country != '') {
					this.selectedCountryName = country;
					for (let i in this.countryList) {
						if (this.countryList[i].name == this.selectedCountryName) {
							this.selectedCountryCode = this.countryList[i].countryCode.toLowerCase();
						}
					}
					if (this.selectedCountryCode != '') {
					}
				} else {
					if (this.appService.configurable_feature && this.appService.configurable_feature.ipAddress_api) {
						this.getIPAddress();
					} else {
						country = 'India';
					}
				}
			}, 2000);
		}
	}

	getPlaceholder(): string {
		if (!this.configurable_feature) {
			return 'Login';
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

	getInputType(): string {
		if (this.configurable_feature && this.configurable_feature.pwa_email) {
			return 'email';
		} else if (this.configurable_feature && this.configurable_feature.pwa_phone) {
			return 'tel';
		} else if (this.configurable_feature && this.configurable_feature.pwa_username) {
			return 'text';
		}
		return 'text';
	}

	nextStep() {
		const { pwa_email, pwa_phone, pwa_username, pwa_password, pwa_otp } = this.configurable_feature;

		let validInput = false;
		let errorMessage = '';
		const loginInputValue = this.form.controls['loginInput'].value.trim();

		if (pwa_email && pwa_phone && pwa_username) {
			if (loginInputValue.includes('@')) {
				// Consider email if input contains '@'
				validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'email');
				if (!validInput) {
					errorMessage = this.appService.getTranslation('Utils.enterCorrectEmail');
				}
			} else if (/^\d+$/.test(loginInputValue)) {
				// If input is all numbers
				if (loginInputValue.length === 10) {
					// Consider as phone number if exactly 10 digits
					validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'phone');
					// console.log('--------validInput----------', validInput);
					if (!validInput) {
						errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
					}
				} else {
					// Show error if number is less than 10 digits
					// console.log('------------------', validInput);
					errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
				}
			} else if (/[_]/.test(loginInputValue) || /^[a-zA-Z0-9_.-]+$/.test(loginInputValue)) {
				// Consider as username if it contains '_' or is a valid username pattern
				validInput = true;
			} else {
				errorMessage = this.appService.getTranslation('Utils.enteremailphoneusername');
			}
		} else if (pwa_email && pwa_phone && !pwa_username) {
			if (loginInputValue.includes('@')) {
				// Consider email if input contains '@'
				validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'email');
				if (!validInput) {
					errorMessage = this.appService.getTranslation('Utils.enterCorrectEmail');
				}
			} else if (/^\d+$/.test(loginInputValue)) {
				// If input is all numbers
				if (loginInputValue.length === 10) {
					// Consider as phone number if exactly 10 digits
					validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'phone');
					// console.log('--------validInput----------', validInput);
					if (!validInput) {
						errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
					}
				} else {
					// Show error if number is less than 10 digits
					// console.log('------------------', validInput);
					errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
				}
			} else {
				errorMessage = this.appService.getTranslation('Utils.enteremailphone');
			}
		} else if (pwa_email && loginInputValue.includes('@')) {
			validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'email');
			if (!validInput) {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectEmail');
			}
		} else if (pwa_phone && /^\d+$/.test(loginInputValue)) {
			if (loginInputValue.length === 10) {
				validInput = this.checkEmailOrMobile({ target: { value: loginInputValue } }, 'phone');
				if (!validInput) {
					errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
				}
			} else {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectMobileNumber');
			}
		} else if (pwa_username) {
			validInput = /^[a-zA-Z0-9_.-]+$/.test(loginInputValue);
			if (!validInput) {
				errorMessage = this.appService.getTranslation('Utils.enterCorrectUsername');
			}
		} else {
			errorMessage = this.appService.getTranslation('Utils.enterValidInput');
		}

		if (!validInput) {
			this.presentToast(errorMessage);
			return;
		}

		if (pwa_password && this.form.controls['password'].valid) {
			this.password = this.form.controls['password'].value;
		} else if (pwa_password && (this.password == null || this.password == '')) {
			this.presentToast(this.appService.getTranslation('Utils.enterpassword'));
			return;
		}

		this.loginInputText = loginInputValue;

		if (pwa_otp) {
			this.getlogin_otp();
		} else {
			this.signIn();
		}
	}

	signIn() {
		const { pwa_password, pwa_otp } = this.configurable_feature;

		if (pwa_password && !this.isOtpStep) {
			this.getlogin();
		} else if (this.isOtpStep && !this.form.controls['otp'].valid) {
			alert('Please enter a valid OTP');
			return;
		} else if (this.isOtpStep) {
			this.getlogin();
		} else if (pwa_otp) {
			this.getlogin_otp();
		} else {
			this.getlogin();
		}
	}

	//first api call if otp is config
	getlogin_otp() {
		const { pwa_email, pwa_phone, pwa_username, pwa_password } = this.configurable_feature;

		let data: any = {
			country: this.selectedCountryName,
			app: true,
			app_version: this.config.getAppVersion(),
		};

		// Assign the correct key based on allowed configurations
		if (pwa_email && this.isEmail(this.loginInputText)) {
			data.email = this.loginInputText;
		} else if (pwa_phone && this.isPhone(this.loginInputText)) {
			data.phone = this.loginInputText;
		} else if (pwa_username) {
			data.username = this.loginInputText;
		}

		if (pwa_password && this.password) {
			data['password'] = this.password;
		}

		if (localStorage.getItem('sessionCode')) {
			data['sessioncode'] = localStorage.getItem('sessionCode');
		}

		this.appService.showLoader(1000);
		this.appService.pwaGetLoginOtp(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					// if (res.message.includes('New Otp:')) {
					this.isOtpStep = true;
					// }

					const message = res.message;

					let otpMatch = message.match(/\d+/);

					if (otpMatch) {
						this.otp = otpMatch[0];
					} else {
						this.otp = null;
					}

					if (res.sendingPlatform && res.sendingPlatform == 'WhatsApp') {
						this.otpSendText = this.appService.getTranslation('Utils.whatsappOTP');
					} else if (res.sendingPlatform && res.sendingPlatform == 'SMS') {
						this.otpSendText = this.appService.getTranslation('Utils.SMS');
					} else if (res.sendingPlatform && res.sendingPlatform == 'Email') {
						this.otpSendText = this.appService.getTranslation('Utils.EMAIL');
					}
				} else {
					this.presentToast(this.appService.getTranslation('Utils.invalidRequest'));
				}
			},
			(error) => {
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

	getlogin() {
		const { pwa_email, pwa_phone, pwa_username, pwa_password, pwa_otp } = this.configurable_feature;

		let data: any = {
			country: this.selectedCountryName,
			app: true,
			app_version: this.config.getAppVersion(),
			momentDate: moment().format('DD-MM-YYYY HH:mm'),
		};

		// Assign the correct key based on allowed configurations
		if (pwa_email && this.isEmail(this.loginInputText)) {
			data.email = this.loginInputText;
		} else if (pwa_phone && this.isPhone(this.loginInputText)) {
			data.phone = this.loginInputText;
		} else if (pwa_username) {
			data.username = this.loginInputText;
		}

		if (pwa_otp) {
			data.otp = this.form.controls['otp'].value;
		}

		if (pwa_password && this.password) {
			data['password'] = this.password;
		}

		if (localStorage.getItem('sessionCode')) {
			data['sessioncode'] = localStorage.getItem('sessionCode');
		}

		this.appService.showLoader(1000);
		this.appService.newPwaLogin(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				// console.log('------1-----');
				if (res.success === true) {
					localStorage.setItem('isLoggedin', 'true');
					if (res?.user && !Array.isArray(res.user)) {
						this.saveTokenAndGotHomePage(res);
					} else if (res.user && res.user.length == 1) {
						this.getToken(res.user[0]);
					} else {
						localStorage.setItem('otherClientList', JSON.stringify(res.user));
						setTimeout(() => {
							this.navCtrl.navigateForward('switch-account');
						}, 300);
					}

					// if (res?.user) {
					// 	this.saveTokenAndGotHomePage(res);
					// } else if (res.user && res.user.length == 1) {
					// 	this.getToken(res.user[0]);
					// } else {
					// 	localStorage.setItem('otherClientList', JSON.stringify(res.user));
					// 	setTimeout(() => {
					// 		this.navCtrl.navigateForward('switch-account');
					// 	}, 300);
					// }
				} else {
					const key = this.appService.GetLanguageKey(res.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			},
			(error) => {
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
			this.navCtrl.navigateRoot('tabs/all-modules');
			// let oldCookie = this.cookieService.get('cookies');
			// let token = this.appService.generateCookieURL();

			// this.cookieService.set('cookies', token);
			// if (oldCookie) {
			// 	this.cookieService.set('oldCookies', oldCookie);
			// }

			// this.appService.verifyCookie(res.user.id).subscribe((res: any) => {
			// 	this.cookieService.delete('oldCookies');
			// 	let useData: any = JSON.parse(localStorage.getItem('user'));
			// 	this.navCtrl.navigateRoot('tabs/all-modules');
			// });
		}
	}

	resetPassword() {
		this.navCtrl.navigateForward(['/forgot-password']);
	}

	checkEmailOrMobile(event, type) {
		let inputValue = event.target.value.trim();

		// When all three are enabled
		if (
			this.configurable_feature.pwa_email &&
			this.configurable_feature.pwa_phone &&
			this.configurable_feature.pwa_username
		) {
			if (/^\d{10}$/.test(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				this.emailError = false;
				return this.mobilePost(true);
			} else if (this.isEmail(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				this.emailError = false;
				return true;
			} else if (/^[a-zA-Z0-9_.-]+$/.test(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				this.emailError = false;
				return true;
			}
		}

		// When only phone is enabled
		if (
			this.configurable_feature.pwa_phone &&
			!this.configurable_feature.pwa_email &&
			!this.configurable_feature.pwa_username
		) {
			if (/^\d{10}$/.test(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				return this.mobilePost(true);
			} else {
				this.form.controls['loginInput'].setErrors({ pattern: true });
				return false;
			}
		}

		// When only email is enabled
		if (
			this.configurable_feature.pwa_email &&
			!this.configurable_feature.pwa_phone &&
			!this.configurable_feature.pwa_username
		) {
			if (this.isEmail(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				return true;
			} else {
				this.form.controls['loginInput'].setErrors({ pattern: true });
				return false;
			}
		}

		// When only username is enabled
		if (
			this.configurable_feature.pwa_username &&
			!this.configurable_feature.pwa_phone &&
			!this.configurable_feature.pwa_email
		) {
			if (/^[a-zA-Z0-9_.-]+$/.test(inputValue)) {
				this.form.controls['loginInput'].setValue(inputValue);
				return true;
			} else {
				this.form.controls['loginInput'].setErrors({ pattern: true });
				return false;
			}
		}

		// When a combination of two are enabled
		if (this.configurable_feature.pwa_phone && this.configurable_feature.pwa_email) {
			if (/^\d{10}$/.test(inputValue)) {
				return this.mobilePost(true);
			} else if (this.isEmail(inputValue)) {
				return true;
			}
		}

		if (this.configurable_feature.pwa_phone && this.configurable_feature.pwa_username) {
			if (/^\d{10}$/.test(inputValue)) {
				return this.mobilePost(true);
			} else if (/^[a-zA-Z0-9_.-]+$/.test(inputValue)) {
				return true;
			}
		}

		if (this.configurable_feature.pwa_email && this.configurable_feature.pwa_username) {
			if (this.isEmail(inputValue)) {
				return true;
			} else if (/^[a-zA-Z0-9_.-]+$/.test(inputValue)) {
				return true;
			}
		}

		// If none match, show error
		this.form.controls['loginInput'].setErrors({ pattern: true });
		return false;
	}

	// Mobile number validation
	mobilePost(flag) {
		let username = this.form.controls['loginInput'].value;

		if ((this.selectedCountryName && flag) || (flag === false && username)) {
			const pattern = /^[6-9][0-9]{9}$/; // Indian phone number validation
			let userPhone = '';
			let countryCode;

			for (let country of this.countryList) {
				if (country.name === this.selectedCountryName) {
					userPhone = country.callingCode + username;
					countryCode = country.countryCode;
					break;
				}
			}

			// console.log('userPhone:', userPhone);
			// console.log('countryCode:', countryCode);

			if (!isValidPhoneNumber(userPhone, countryCode) || (countryCode === 'in' && !pattern.test(username))) {
				console.log('Invalid phone number detected.');
				return false;
			}
			console.log('Phone number is valid.');
			return true;
		}
		return true;
	}

	isEmail(input) {
		// const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
		return emailPattern.test(input);
	}

	isPhone(input) {
		return /^[0-9]{10}$/.test(input);
	}

	togglePassword() {
		this.showPassword = !this.showPassword;
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
		this.isMobileView = window.innerWidth < 768;
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
