import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { CookieService } from 'ngx-cookie-service';
import { isValidPhoneNumber } from 'libphonenumber-js';

var country = '';

@Component({
	selector: 'app-login-otp',
	templateUrl: './login-otp.page.html',
	styleUrls: ['./login-otp.page.scss'],
})
export class LoginOtpPage {
	form: FormGroup;

	isTabletOrIpad = false;
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
	projectName: string;

	//FOr OTP SECTION
	formOTP: FormGroup;
	mobile: any;
	email: any;
	selectedCountry: any;
	otp: any;
	objectData = {};

	otpFlage = false;
	recievedOTPData: { [k: string]: any };
	isOptForm: boolean = false;
	sessionData: any = null;
	loginInputText: any;
	otpSendText: any;
	selectedsArray: any;
	clientList = [];
	showClientList = false;
	alert: HTMLIonAlertElement;
	loginType: any;
	isComingFromSpotRegister: boolean = false;
	constructor(
		public config: AppConfig,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public plt: Platform,
		private router: Router,
		public http: HttpClient,
		public appService: AppService,
		private route: ActivatedRoute
	) // private cookieService: CookieService
	{
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

		this.getAllCountryName();
		this.form = new FormGroup({
			country: new FormControl(null, [Validators.required]),
			mobile: new FormControl(null, [Validators.required]),
			email: new FormControl(null, [Validators.required]),
		});
		setTimeout(() => {
			this.forLoginUser();
		}, 500);

		this.formOTP = new FormGroup({
			otp1: new FormControl(null, [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp2: new FormControl(null, [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp3: new FormControl(null, [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp4: new FormControl(null, [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
		});

		this.getSessionDetailsForClosedSession();

		if (localStorage.getItem('newUserSpotData')) {
			const navigation = this.router.getCurrentNavigation();
			if (navigation?.extras?.state) {
				const state = navigation.extras.state;
				// console.log('-state-', state);
				if (state.isComingFromSpotRegister) {
					this.isComingFromSpotRegister = true;
					this.selectedCountry = state.country;
					this.mobile = state.mobile;
					this.email = state.email;

					setTimeout(() => {
						this.getResentlogin_otp();
					}, 200);
				}
			}
		}
	}

	getAllCountryName() {
		this.appService.getCountry().subscribe((res: any) => {
			this.countryList = res.data;
			for (let i in this.countryList) {
				this.countryList[i].countryCode = this.countryList[i].countryCode.toLowerCase();
			}
			this.filterCountryData = this.countryList;
			this.getIPAddress();
		});
	}

	changeCountry() {
		// if (this.sessionData && this.sessionData.state != 'Closed') {
		this.showModal = true;
		this.editCountry = true;
		this.getAllCountryName();
		// }
	}

	compareWith(o1, o2) {
		if (!o1 || !o2) {
			return o1 === o2;
		}
		if (Array.isArray(o2)) {
			return o2.some((o) => o.name === o1.name);
		}
		return o1.name === o2.name;
	}

	selectcountry(country, data) {
		this.selectedCountryName = country;
		this.selectedCountryCode = data.countryCode.toLowerCase();
		this.modelBack();
		this.afterSelectingCountry();
		this.mobilePost(false);
	}

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			this.ipAddress = res.ip;
			this.getCountryName();
		});
	}

	getCountryName() {
		this.appService.getCountryName(this.ipAddress).subscribe((res: any) => (country = res.countryName));
		// this.afterSelectingCountry();
	}

	afterSelectingCountry() {
		this.appService.getMarket(this.selectedCountryName).subscribe(
			(res: any) => {
				let varebale = document.getElementById('reve-chat-container-div');
				if (varebale) {
					varebale.style.display = 'none';
				}
				if (res.success) {
					if (res.data.pwaverifyUsing === 'Phone') {
						localStorage.setItem('verify_using', 'Mobile Number');
						this.verifyUseingPhone = true;
					} else {
						localStorage.setItem('verify_using', 'Email');
						this.verifyUseingPhone = false;
					}
				}
			},
			(error) => {
				const key = this.appService.GetLanguageKey(error.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
				this.selectedCountryName = null;
			}
		);
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
		this.getIPAddress();
		setTimeout(() => {
			if (country != '') {
				this.selectedCountryName = country;
				for (let i in this.countryList) {
					if (this.countryList[i].name == this.selectedCountryName) {
						this.selectedCountryCode = this.countryList[i].countryCode.toLowerCase();
					}
				}
				if (this.selectedCountryCode != '') {
					this.afterSelectingCountry();
				}
			} else {
				this.getIPAddress();
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
						if (this.selectedCountryCode != '') {
							this.afterSelectingCountry();
						}
					}
				}, 2000);
			}
		}, 2000);
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	// get otp
	submit(value) {
		let flag = false;
		if (this.selectedCountryName == '' || this.selectedCountryName == null || this.selectedCountryName == undefined) {
			// console.log('----------InValid Country----------');
			this.presentToast(this.appService.getTranslation('Utils.selectCountry'));
			flag = true;
			return;
		}

		if (
			!this.verifyUseingPhone &&
			(this.form.value.email == undefined || this.form.value.email == '' || this.form.value.email == null)
		) {
			this.presentToast(this.appService.getTranslation('Utils.enterCorrectEmail'));
			flag = true;
		} else if (
			this.verifyUseingPhone &&
			(this.form.value.email == undefined || this.form.value.email == '' || this.form.value.email == null)
		) {
			this.presentToast(this.appService.getTranslation('Utils.enterCorrectMobileNumber'));
			flag = true;
		}

		if (flag) {
			return;
		}

		if (this.loginType == 'email') {
			if (this.form.controls['email'].valid) {
				localStorage.setItem('verify_using', 'Email');
				localStorage.setItem('loginId', this.form.value.email);
				this.getlogin_otp();
			} else {
				this.presentToast(this.appService.getTranslation('Utils.enterCorrectEmail'));
			}
		} else if (this.loginType == 'phone') {
			if (!this.mobilePost(false)) {
				// console.log('----------InValid Mobile Number----------');
				this.presentToast(this.appService.getTranslation('Utils.enterCorrectMobileNumber'));
				return;
			} else {
				this.form.controls['mobile'].setValue(this.form.value.email);
				localStorage.setItem('verify_using', 'Mobile Number');
				localStorage.setItem('loginId', this.form.value.email);
				// this.form.controls['email'].setValue('');
				this.getlogin_otp();
			}
		}
	}

	getlogin_otp() {
		this.otpSendText = 'OTP is sent on your Registered ' + localStorage.getItem('verify_using');
		let data = {};
		let navigationExtras: NavigationExtras;

		if (this.loginType == 'phone') {
			data['phone'] = this.form.value.mobile;
		}
		if (this.loginType == 'email') {
			data['email'] = this.form.value.email;
		}
		data['country'] = this.selectedCountryName;
		data['app'] = true;
		data['app_version'] = this.config.getAppVersion();
		if (localStorage.getItem('sessionCode')) {
			data['sessioncode'] = localStorage.getItem('sessionCode');
		}

		let data_: any = data;
		localStorage.setItem('newUserSpotData', JSON.stringify(data_));

		this.appService.showLoader(1000);
		this.appService.getOtp(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					navigationExtras = {
						state: {
							email: this.form.value.email ? this.form.value.email : '',
							mobile: this.form.value.mobile ? this.form.value.mobile : '',
							otp: res.message,
							country: this.selectedCountryName,
						},
					};
					this.isOptForm = true;
					this.recievedOTPData = navigationExtras.state;
					if (this.recievedOTPData) {
						this.otp = this.recievedOTPData.otp;
						if (this.otp.includes('New Otp:')) {
							this.otpFlage = true;
						}
						this.selectedCountry = this.recievedOTPData.country;
						if (this.recievedOTPData && this.recievedOTPData.mobile) {
							this.mobile = this.recievedOTPData.mobile;
						}
						if (this.recievedOTPData && this.recievedOTPData.email) {
							this.email = this.recievedOTPData.email;
						}
					}
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
				if (
					this.projectName == 'diwo' &&
					localStorage.getItem('sessionCode') &&
					error.status == 400 &&
					!this.otpFlage
				) {
					this.navCtrl.navigateRoot('register-user');
					return;
				}

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

	logoutUser() {
		if (localStorage.getItem('logout') == 'true') {
			window.location.reload();
			localStorage.clear();
		}
	}

	otpValue(val) {
		val = val.target.value;
		if (val.length === 4) this.submit2(val);
		if (val.length > 4) return false;
	}

	submit2(value) {
		let data = {};
		if (this.mobile && this.mobile != null && this.mobile != '') {
			data['phone'] = this.mobile;
		} else if (this.email && this.email != null && this.email != '') {
			data['email'] = this.email;
		}
		data['country'] = this.selectedCountry;
		data['momentDate'] = moment().format('DD-MM-YYYY HH:mm');
		data['otp'] = value;
		this.objectData = data;
		this.doLogin(data);
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
			// let oldCookie = this.cookieService.get('cookies');
			// let token = this.appService.generateCookieURL();

			// this.cookieService.set('cookies', token);
			// if (oldCookie) {
			// 	this.cookieService.set('oldCookies', oldCookie);
			// }

			// this.appService.verifyCookie(payload.user.id).subscribe((res: any) => {
			// 	this.cookieService.delete('oldCookies');
			// 	// let useData: any = JSON.parse(localStorage.getItem('user'));
			// 	// if (useData.user.isReg_Completed == false) {
			// 	// 	this.navCtrl.navigateRoot('register-user');
			// 	// } else {
			// 	this.navCtrl.navigateRoot('mark-present');
			// 	// }
			// });
		}
	}

	selecteClient(data) {
		this.showClientList = false;
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

	doLogin(data) {
		this.appService.showLoader(5000);
		this.appService.login(data).subscribe(
			(res: any) => {
				if (res.success === true) {
					if (res?.token && res?.user) {
						this.saveTokenAndGotHomePage(res);
					} else if (res.user && res.user.length == 1) {
						this.getToken(res.user[0]);
					} else {
						localStorage.setItem('otherClientList', JSON.stringify(res.user));
						setTimeout(() => {
							this.navCtrl.navigateForward('switch-account');
						}, 300);
					}

					this.appService.hideLoader();
				} else {
					this.presentToast(res.error);
				}
			},
			(error) => {
				if (error.status == 422) {
					this.presentToast(error.error.error);
				} else {
					this.formOTP.controls['otp1'].setValue(null);
					this.formOTP.controls['otp2'].setValue(null);
					this.formOTP.controls['otp3'].setValue(null);
					this.formOTP.controls['otp4'].setValue(null);
					document.getElementById('otp4').style.textIndent = '0px';
					this.presentToast(error.error.error);
				}
			}
		);
	}

	getResentlogin_otp() {
		let data = {};
		data['country'] = this.selectedCountry;
		if (this.mobile) {
			data['phone'] = this.mobile;
		} else if (this.email) {
			data['email'] = this.email;
		}
		data['app'] = true;
		this.appService.getOtp(data).subscribe(
			(res: any) => {
				if (res.success === true) {
					if (res.message.includes('New Otp:')) {
						this.otpFlage = true;
					}

					if (this.isComingFromSpotRegister) {
						this.clearLocalStorage();
					}

					this.otp = res.message;
					this.formOTP.controls['otp1'].setValue(null);
					this.formOTP.controls['otp2'].setValue(null);
					this.formOTP.controls['otp3'].setValue(null);
					this.formOTP.controls['otp4'].setValue(null);
					document.getElementById('otp4').style.textIndent = '0px';
				} else {
					this.presentToast(res.error);
				}
			},
			(error) => {
				if (error.status == 422) {
					this.presentToast(this.appService.getTranslation('Utils.invalidOperation'));
				} else {
					this.presentToast(error.error.error);
					this.formOTP.controls['otp1'].setValue(null);
					this.formOTP.controls['otp2'].setValue(null);
					this.formOTP.controls['otp3'].setValue(null);
					this.formOTP.controls['otp4'].setValue(null);
					document.getElementById('otp4').style.textIndent = '0px';
				}
			}
		);
	}

	clearLocalStorage() {
		this.isOptForm = true;
		localStorage.removeItem('newUserSpotData');
		localStorage.removeItem('loginId');
	}

	checkUserType(user) {}

	getSessionDetailsForClosedSession() {
		this.appService.showLoader();
		let sessionCode = localStorage.getItem('sessionCode');
		let userId = null;
		if (localStorage.getItem('user')) {
			userId = JSON.parse(localStorage.getItem('user')).user.id;
		}
		if (sessionCode) {
			this.appService.checkSessionClosedBySessionCode(sessionCode).subscribe(
				(res: any) => {
					if (res.success) {
						// this.sessionData = res.data;
						// if (this.sessionData.status == 'Closed') {
						// 	localStorage.removeItem('sessionCode');
						// 	this.presentToast(this.appService.getTranslation('Utils.sessionClosed'));
						// }
						// this.appService.hideLoader();

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
								// this.presentToast(res.message);
								this.appService.hideLoader();
							}
						}, 1000);
					} else {
						this.appService.showLoader();
					}
				},
				(error) => {
					if (error.status == 422) {
						this.appService.hideLoader();
						this.presentToast(error.error.error);
					} else {
						this.appService.hideLoader();
						this.presentToast(error.error.error);
					}
				}
			);
		}
	}

	checkEmailOrMobile(email, type) {
		this.loginInputText = email.target.value;
		email = email.target.value;
		email = email.replace(' ', '');
		this.loginType = type;
		if (this.loginType == 'email') {
			let array = [
				'[',
				']',
				'{',
				'}',
				'#',
				'$',
				'%',
				'^',
				'&',
				'*',
				'(',
				')',
				'!',
				'`',
				'~',
				'/',
				',',
				'|',
				'<',
				'>',
				'?',
				'+',
				';',
				':',
				'"',
				"'",
			];
			if (
				email.indexOf('@') >= 1 &&
				email.lastIndexOf('.') > email.indexOf('@') + 1 &&
				email.length >= email.lastIndexOf('.') + 3 &&
				email.indexOf('@') == email.lastIndexOf('@')
			) {
				let invalide = false;
				for (let char of array) {
					if (email.indexOf(char) != -1) {
						invalide = true;
					}
				}
				if (!invalide) {
					this.form.controls['email'].setValue(email.trim());
					this.emailError = false;
					return true;
				} else {
					this.form.controls['email'].setErrors({ pattern: true });
					this.emailError = true;
					return false;
				}
			} else {
				this.form.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else if (this.loginType == 'phone') {
			this.form.controls['email'].setValue(email.trim());
			this.emailError = false;
			this.mobilePost(true);
		}
	}

	switchLogin(type) {
		// if (this.sessionData && this.sessionData.state != 'Closed') {
		if (type == 'Email') {
			this.loginInputText = null;
			this.verifyUseingPhone = false;
			this.loginType == 'email';
		} else if (type == 'Phone') {
			this.loginInputText = null;
			this.verifyUseingPhone = true;
			this.loginType == 'phone';
		}
		// }
	}

	mobilePost(flag) {
		// console.log('-------flag--', flag);
		if (
			(this.selectedCountryName && flag == true) ||
			(flag == false && this.form.controls['email'].value && this.form.controls['email'].value != '')
		) {
			var pattern = /^[6,7,8,9][0-9]{9}$/;
			let mob: any = parseInt(this.form.controls['email'].value);
			let userPhone = '';
			let CountryCode;
			for (let country of this.countryList) {
				if (country.name == this.selectedCountryName) {
					userPhone = country.callingCode + this.form.controls['email'].value;
					CountryCode = country.countryCode;
					break;
				}
			}
			console.log('----validNumber----', isValidPhoneNumber(userPhone, CountryCode));
			if (isValidPhoneNumber(userPhone, CountryCode) === false || (CountryCode == 'in' && !pattern.test(mob))) {
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}
	}
}
