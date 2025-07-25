import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
// import { CookieService } from 'ngx-cookie-service';

@Component({
	selector: 'app-otp',
	templateUrl: './otp.page.html',
	styleUrls: ['./otp.page.scss'],
})
export class OtpPage {
	form: FormGroup;
	loading: any;
	mobile: any;
	email: any;
	selectedCountry: any;
	otp: any;
	user: any;
	pasteOtp: any;
	pasteValue = 'otp1';
	@ViewChild('otp4') otp4;
	deleteButton: boolean = false;
	customerRollData = [];
	showCustomerRolls = false;
	objectData = {};
	ipAddress = '';
	otpSendText = 'OTP is sent on your Registered ' + localStorage.getItem('verify_using');
	otpFlage = false;
	otpMSG: any;
	device = 'android';
	projectName: string;
	clientList: any = [];
	showClientList: boolean = false;
	sendingPlatform: any;

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
		public config: AppConfig,
		// private cookieService: CookieService
	) {
		this.form = new FormGroup({
			otp1: new FormControl('', [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp2: new FormControl('', [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp3: new FormControl('', [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
			otp4: new FormControl('', [Validators.required, Validators.maxLength(1), Validators.minLength(1)]),
		});

		this.projectName = localStorage.getItem('projectName') ? localStorage.getItem('projectName') : 'drip';

		this.route.queryParams.subscribe((params) => {
			if (this.router.getCurrentNavigation().extras.state) {
				this.otp = this.router.getCurrentNavigation().extras.state.otp;
				this.sendingPlatform = this.router.getCurrentNavigation().extras.state.plateform;
				if (this.otp.includes('New Otp:')) {
					this.otpFlage = true;
				}

				if (this.sendingPlatform && this.sendingPlatform !== null && this.sendingPlatform !== '') {
					if (this.sendingPlatform == 'WhatsApp') {
						this.otpSendText = this.appService.getTranslation('Utils.whatsappOTP');
					}
				}
				this.selectedCountry = this.router.getCurrentNavigation().extras.state.country;
				if (this.router.getCurrentNavigation().extras.state && this.router.getCurrentNavigation().extras.state.mobile) {
					this.mobile = this.router.getCurrentNavigation().extras.state.mobile;
				}
				if (this.router.getCurrentNavigation().extras.state && this.router.getCurrentNavigation().extras.state.email) {
					this.email = this.router.getCurrentNavigation().extras.state.email;
				}
			}
		});
	}

	ionViewWillEnter() {
		setTimeout(() => {
			let data = document.getElementById('otp4');
			data.focus();
			// this.touch();
		}, 750);
	}

	otpValue(val) {
		val = val.target.value;
		if (val.length === 4) this.submit(val);
		if (val.length > 4) return false;
	}

	submit(value) {
		let data = {};
		if (this.mobile && this.mobile != null && this.mobile != '') {
			data['phone'] = this.mobile;
		} else if (this.email && this.email != null && this.email != '') {
			data['email'] = this.email;
		}
		data['country'] = this.selectedCountry;
		data['momentDate'] = moment().format('DD-MM-YYYY HH:mm');
		// data['otp'] = this.form.value.otp1 + this.form.value.otp2 + this.form.value.otp3 + this.form.value.otp4;
		data['otp'] = value;
		this.objectData = data;
		this.doLogin(data);
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
		if(res?.user){
			res.user = this.appService.removePersonalData(res.user);
		}
		localStorage.setItem('user', JSON.stringify(res));
		localStorage.setItem('user_type', res.user.type);
		localStorage.setItem('user_id', res.user.id);
		await this.appService.setUserPersonalData();
		// localStorage.setItem('session_token', res.token);
		if(Array.isArray(res.user)){
			localStorage.setItem('user_client', JSON.stringify(res.user[0].Client));
		}else if(res?.user?.client){
			localStorage.setItem('user_client', JSON.stringify(res.user.client));

		}
		// for (let role of res.user.roles) {
		// 	// 1==>> Learner
		// 	// 11==>> Trainer
		// 	if (role.roleId == 1 || role.roleId == 11) {
		// 		localStorage.setItem('user_client', JSON.stringify(role.client));
		// 		if (role.roleId == 11) {
		// 			localStorage.setItem('isTrainer', 'true');
		// 		}
		// 		this.appService.getAppBranding(role.client.id).subscribe((res: any) => {
		// 			if (res.success) {
		// 				localStorage.setItem('app_branding', JSON.stringify(res.data));
		// 			}
		// 		});
		// 	}
		// }
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
			// 	// if (useData.user.isReg_Completed == false) {
			// 	// 	console.log('useData');
			// 	// 	this.navCtrl.navigateRoot('register-user');
			// 	// } else {
			// 	this.navCtrl.navigateRoot('tabs/all-modules');
			// 	// }
			// });
		}
	}

	selecteClient(data) {
		this.showClientList = false;
		this.getToken(data);
	}
	//  Login
	doLogin(data) {
		this.appService.showLoader(5000);
		this.appService.login(data).subscribe(
			(res: any) => {
				if (res.success === true) {
					if (res?.user && !Array.isArray(res.user)) {
						this.saveTokenAndGotHomePage(res);
					} else if (res.user && res.user.length == 1) {
						this.getToken(res.user[0]);
					} else {
						localStorage.setItem('otherClientList', JSON.stringify(res.user));
						setTimeout(() => {
							this.navCtrl.navigateForward('switch-account');
						}, 300);
						// this.clientList = res.user;
						// this.showClientList = true;
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
					this.presentToast(error.error.error);
					this.form.controls['otp1'].setValue('');
					this.form.controls['otp2'].setValue('');
					this.form.controls['otp3'].setValue('');
					this.form.controls['otp4'].setValue('');
					document.getElementById('otp4').style.textIndent = '0px';
				}
			}
		);
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
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
					this.otp = res.message;

					if (res.sendingPlatform && res.sendingPlatform == 'WhatsApp') {
						// this.otpSendText = 'OTP is sent to your Registered Mobile Number on WhatsApp';
						this.otpSendText = this.appService.getTranslation('Utils.whatsappOTP');
					}

					this.form.controls['otp1'].setValue('');
					this.form.controls['otp2'].setValue('');
					this.form.controls['otp3'].setValue('');
					this.form.controls['otp4'].setValue('');
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
					this.form.controls['otp1'].setValue('');
					this.form.controls['otp2'].setValue('');
					this.form.controls['otp3'].setValue('');
					this.form.controls['otp4'].setValue('');
					document.getElementById('otp4').style.textIndent = '0px';
				}
			}
		);
	}
	back() {}

	checkUserType(user) {}
}
