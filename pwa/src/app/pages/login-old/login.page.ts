import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
var country = '';
import { isValidPhoneNumber } from 'libphonenumber-js';

@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
	styleUrls: ['./login.page.scss'],
})
export class LoginPage {
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
	loginInputText: any;
	loginType: any;

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

		this.getAllCountryName();
		this.form = new FormGroup({
			country: new FormControl('', [Validators.required]),
			mobile: new FormControl('', [Validators.required]),
			email: new FormControl('', [Validators.required]),
		});
		setTimeout(() => {
			this.forLoginUser();
		}, 500);
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
		this.showModal = true;
		this.editCountry = true;
		this.getAllCountryName();
	}

	selectcountry(country, data) {
		this.selectedCountryName = country;
		this.selectedCountryCode = data.countryCode.toLowerCase();
		this.modelBack();
		this.afterSelectingCountry();
		this.form.controls['email'].patchValue(this.loginInputText);
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
		let user = JSON.parse(localStorage.getItem('user'));
		if (user && user != '' && user != null && user != 'null') {
			this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
				this.ipAddress = res.ip;
				// this.appUsageDataTracking();
				//If Already user is Login
				if (this.projectName == 'drip') {
					this.navCtrl.navigateRoot('tabs/all-drips');
				} else if (this.projectName == 'diwo') {
					this.navCtrl.navigateRoot('tabs/all-modules');
				}
			});
		} else {
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
				this.form.controls['mobile'].setValue('');
				localStorage.setItem('verify_using', 'Email');
				this.getlogin_otp();
			} else {
				this.presentToast(this.appService.getTranslation('Utils.enterCorrectEmail'));
			}
		} else if (this.loginType == 'phone') {
			// const re = new RegExp(/^[0-9]{5,15}$/);
			// if (re.test(this.form.value.email)) {
			// 	this.form.controls['mobile'].setValue(this.form.value.email);
			// 	this.form.controls['email'].setValue('');
			// 	localStorage.setItem('verify_using', 'Mobile Number');
			// 	this.getlogin_otp();
			// } else {
			// 	this.presentToast(this.appService.getTranslation('Utils.enterCorrectMobileNumber'));
			// }
			if (!this.mobilePost(false)) {
				// console.log('----------InValid Mobile Number----------');
				this.presentToast(this.appService.getTranslation('Utils.enterCorrectMobileNumber'));
				return;
			} else {
				this.form.controls['mobile'].setValue(this.form.value.email);
				// this.form.controls['email'].setValue('');
				localStorage.setItem('verify_using', 'Mobile Number');
				this.getlogin_otp();
			}
		}
	}

	getlogin_otp() {
		let data = {};
		let navigationExtras: NavigationExtras;
		// this.form.value.mobile
		if (this.loginType == 'phone') {
			data['phone'] = this.form.value.mobile;
		}
		// this.form.value.email
		if (this.loginType == 'email') {
			data['email'] = this.form.value.email;
		}
		data['country'] = this.selectedCountryName;
		data['app'] = true;
		data['app_version'] = this.config.getAppVersion();
		if (localStorage.getItem('sessionCode')) {
			data['sessioncode'] = localStorage.getItem('sessionCode');
		}

		// console.log('--data-', data);
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
							plateform: res.sendingPlatform ? res.sendingPlatform : '',
						},
					};

					this.router.navigate(['otp'], navigationExtras);
				} else {
					this.presentToast(this.appService.getTranslation('Utils.invalidRequest'));
				}
			},
			(error) => {
				this.appService.hideLoader();
				console.log(error);
				if (error.status == 422) {
					this.presentToast(error.error.error);
					// this.presentToast(this.appService.getTranslation('Utils.invalidRequest'));
				} else {
					this.presentToast(error.error.error);
					// this.presentToast(this.appService.getTranslation('Utils.invalidRequest'));
				}
			}
		);
	}

	switchLogin(type) {
		if (type == 'Email') {
			this.loginInputText = null;
			this.verifyUseingPhone = false;
			this.loginType == 'email';
		} else if (type == 'Phone') {
			this.loginInputText = null;
			this.verifyUseingPhone = true;
			this.loginType == 'phone';
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

	logoutUser() {
		if (localStorage.getItem('logout') == 'true') {
			window.location.reload();
			localStorage.clear();
		}
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
