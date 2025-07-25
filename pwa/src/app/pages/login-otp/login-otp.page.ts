import { HttpClient } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { CookieService } from 'ngx-cookie-service';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from 'src/app/services/language.service';

var country = '';

@Component({
	selector: 'app-login-otp',
	templateUrl: './login-otp.page.html',
	styleUrls: ['./login-otp.page.scss'],
})
export class LoginOtpPage {
	languages = [
		{ code: 'en', label: 'English (India)' },
		{ code: 'fr', label: 'Français' },
		{ code: 'ar', label: 'العربية' },
	];

	selectedLang = null;
	isLangOpen = false;

	form: FormGroup;

	isTabletOrIpad = false;
	countryList: any;
	filterCountryData: any;
	showModal: boolean;
	editCountry: boolean;
	searhValue: any;
	selectedCountryName: any;
	selectedCountryCode: any;
	ipAddress: any;
	emailError: boolean = false;
	projectName: string;

	//FOr OTP SECTION
	formOTP: FormGroup;
	mobile: any;
	email: any;
	selectedCountry: any;
	objectData = {};

	otpFlage = false;

	sessionData: any = null;
	otpSendText: any;
	selectedsArray: any;
	clientList = [];

	isComingFromSpotRegister: boolean = false;

	isOtpStep: boolean;
	loginInputText: any;
	password: any;
	otp: any;
	configurable_feature: any;
	showPassword: boolean = false;

	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
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
		// private cookieService: CookieService,
		private formBuilder: FormBuilder,
		public langService: LanguageService
	) {
		this.otpSendText = 'OTP is sent on your Registered ' + localStorage.getItem('verify_using');
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

		if (localStorage.getItem('lang')) {
			this.selectedLang = localStorage.getItem('lang');
		}

		setTimeout(() => {
			this.configurable_feature = this.appService.configurable_feature;

			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);
		this.getConfigFeature();

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

	getConfigFeature() {
		this.appService.getconfigurableFeature().subscribe((res: any) => {
			if (res.success) {
				this.configurable_feature = res.data;
			}
		});
	}

	ngOnInit(): void {
		this.appService.setIconWhiteBranding(this.iconObject, '#6513e1');
		this.getSessionDetailsForClosedSession();

		if (localStorage.getItem('newUserSpotData')) {
			const navigation = this.router.getCurrentNavigation();
			if (navigation?.extras?.state) {
				const state = navigation.extras.state;
				if (state.isComingFromSpotRegister) {
					this.isComingFromSpotRegister = true;
					this.selectedCountryName = state.country;
					if (state.mobile && state.mobile !== '' && state.mobile != null) {
						this.loginInputText = state.mobile;
					} else if (state.email && state.email !== '' && state.email != null) {
						this.loginInputText = state.email;
					} else if (state.username && state.username !== '' && state.username != null) {
						this.loginInputText = state.username;
					}

					this.form.controls['loginInput'].setValue(this.loginInputText);

					if (this.configurable_feature && this.configurable_feature.pwa_otp) {
						setTimeout(() => {
							this.getlogin_otp();
						}, 500);
					}
				}
			}
		}
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
		this.mobilePost(false);
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
		if (this.appService.configurable_feature && this.appService.configurable_feature.ipAddress_api) {
			this.getIPAddress();
		} else {
			country = 'India';
		}
		setTimeout(() => {
			if (country != '') {
				this.selectedCountryName = country;
				for (let i in this.countryList) {
					if (this.countryList[i].name == this.selectedCountryName) {
						this.selectedCountryCode = this.countryList[i].countryCode.toLowerCase();
					}
				}
			} else {
				if (this.appService.configurable_feature && this.appService.configurable_feature.ipAddress_api) {
					this.getIPAddress();
				} else {
					country = 'India';
				}
				setTimeout(() => {
					let varebale = document.getElementById('reve-chat-container-div');
					if (varebale) {
						varebale.style.display = 'none';
					}
					if (country != '') {
						this.selectedCountryName = country;
						for (let i in this.countryList) {
							if (this.countryList[i].name == this.selectedCountryName) {
								this.selectedCountryCode = this.countryList[i].countryCode.toLowerCase();
							}
						}
					}
				}, 2000);
			}
		}, 2000);
	}

	getPlaceholder(): string {
		if (!this.configurable_feature) {
			return 'Login';
		}

		const { pwa_email, pwa_phone, pwa_username } = this.configurable_feature;

		if (pwa_email && pwa_phone && pwa_username) {
			return 'Email, Phone or Username';
		}
		if (pwa_email && pwa_phone) {
			return 'Email, Phone';
		}
		if (pwa_email && pwa_username) {
			return 'Email, Username';
		}
		if (pwa_phone && pwa_username) {
			return 'Phone, Username';
		}
		if (pwa_email) {
			return 'Email';
		}
		if (pwa_phone) {
			return 'Phone';
		}
		if (pwa_username) {
			return 'Username';
		}

		return 'Login';
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

		if (pwa_password && this.password) {
			data['password'] = this.password;
		}

		if (!this.isComingFromSpotRegister) {
			if (localStorage.getItem('sessionCode')) {
				data['sessioncode'] = localStorage.getItem('sessionCode');
			}
			let data_: any = data;
			localStorage.setItem('newUserSpotData', JSON.stringify(data_));
		}

		// this.appService.showLoader(1000);
		this.appService.pwaGetLoginOtp(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					this.isOtpStep = true;

					if (this.isComingFromSpotRegister) {
						this.clearLocalStorage();
					}

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
				console.log('-error-', error);
				if (!this.isComingFromSpotRegister) {
					let notRegistertext =
						'It looks like your account is not yet registered. Please contact your administrator for access.';
					if (
						this.projectName == 'diwo' &&
						localStorage.getItem('sessionCode') &&
						error.status == 500 &&
						error.error.error == notRegistertext
					) {
						this.navCtrl.navigateRoot('register-user');
						return;
					} else {
						this.appService.hideLoader();
						const key = this.appService.GetLanguageKey(error.error.error);
						if (key) {
							this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
						} else {
							this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
						}
					}
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

		if (!this.isComingFromSpotRegister) {
			if (localStorage.getItem('sessionCode')) {
				data['sessioncode'] = localStorage.getItem('sessionCode');
			}
			let data_: any = data;
			localStorage.setItem('newUserSpotData', JSON.stringify(data_));
		}

		// this.appService.showLoader(1000);
		this.appService.newPwaLogin(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					localStorage.setItem('isLoggedin', 'true');

					if (this.isComingFromSpotRegister) {
						this.clearLocalStorage();
					}

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

					// if (res?.token && res?.user) {
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
				console.log('-error-', error);
				if (!this.isComingFromSpotRegister) {
					let notRegistertext =
						'It looks like your account is not yet registered. Please contact your administrator for access.';
					if (
						this.projectName == 'diwo' &&
						localStorage.getItem('sessionCode') &&
						error.status == 500 &&
						error.error.error == notRegistertext
					) {
						this.navCtrl.navigateRoot('register-user');
						return;
					} else {
						this.appService.hideLoader();
						const key = this.appService.GetLanguageKey(error.error.error);
						if (key) {
							this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
						} else {
							this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
						}
					}
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

	async saveTokenAndGotHomePage(payload) {
		localStorage.setItem('getUserData', 'true');
		localStorage.setItem('appBrandingAboutUsPage', 'true');
		localStorage.setItem('appBrandingAllPostPage', 'true');

		if (payload?.user) {
			payload.user = this.appService.removePersonalData(payload.user);
		}

		localStorage.setItem('user', JSON.stringify(payload));
		localStorage.setItem('user_type', payload.user.type);
		localStorage.setItem('user_id', payload.user.id);
		// localStorage.setItem('session_token', payload.token);
		await this.appService.setUserPersonalData();
		for (let role of payload.user.roles) {
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

			// this.appService.verifyCookie(payload.user.id).subscribe((res: any) => {
			// 	this.cookieService.delete('oldCookies');
			// 	this.navCtrl.navigateRoot('tabs/all-drips');
			// });
		} else if (this.projectName == 'diwo') {
			this.navCtrl.navigateRoot('mark-present');
		}
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

	clearLocalStorage() {
		localStorage.removeItem('newUserSpotData');
		localStorage.removeItem('loginId');
	}

	getSessionDetailsForClosedSession() {
		// this.appService.showLoader();
		let sessionCode = localStorage.getItem('sessionCode');
		let userId = null;
		if (localStorage.getItem('user')) {
			userId = JSON.parse(localStorage.getItem('user')).user.id;
		}
		if (sessionCode) {
			this.appService.checkSessionClosedBySessionCode(sessionCode).subscribe(
				(res: any) => {
					if (res.success) {
						setTimeout(() => {
							if (res.data) {
								this.sessionData = res.data;
								if (this.sessionData.status == 'Closed') {
									this.appService.hideLoader();
									localStorage.removeItem('sessionCode');
									this.presentToast(this.appService.getTranslation('Utils.sessionClosed'));
								} else {
									this.appService.hideLoader();
								}
							} else {
								this.sessionData = null;
								this.appService.hideLoader();
							}
						}, 1000);
					} else {
						// this.appService.showLoader();
					}
				},
				(error) => {
					const key = this.appService.GetLanguageKey(error.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
				}
			);
		}
	}

	switchLogin(type) {
		if (type == 'Email') {
			this.loginInputText = null;
		} else if (type == 'Phone') {
			this.loginInputText = null;
		}
	}

	resetPassword() {
		this.navCtrl.navigateForward(['/forgot-password']);
	}

	checkEmailOrMobile(event, type) {
		let inputValue = event.target.value.trim();

		// When all three are enabled
		if (
			this.configurable_feature &&
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
			this.configurable_feature &&
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
			this.configurable_feature &&
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
			this.configurable_feature &&
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
		if (this.configurable_feature && this.configurable_feature.pwa_phone && this.configurable_feature.pwa_email) {
			if (/^\d{10}$/.test(inputValue)) {
				return this.mobilePost(true);
			} else if (this.isEmail(inputValue)) {
				return true;
			}
		}

		if (this.configurable_feature && this.configurable_feature.pwa_phone && this.configurable_feature.pwa_username) {
			if (/^\d{10}$/.test(inputValue)) {
				return this.mobilePost(true);
			} else if (/^[a-zA-Z0-9_.-]+$/.test(inputValue)) {
				return true;
			}
		}

		if (this.configurable_feature && this.configurable_feature.pwa_email && this.configurable_feature.pwa_username) {
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

		// console.log('Inside mobilePost:', flag);
		// console.log('loginInputText:', username);
		// console.log('this.selectedCountryName:', this.selectedCountryName);

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
