import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { first } from 'rxjs/operators';
import { routerTransition } from '../router.animations';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthenticationService } from '../shared/index';
import { ToastrService } from 'ngx-toastr';
import { NgxPermissionsService } from 'ngx-permissions';
import { AppService } from '../app.service';
import { HttpClient } from '@angular/common/http';
declare var $: any;
var country = '';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	animations: [routerTransition()],
})
export class LoginComponent implements OnInit, OnDestroy {
	loginBy: string = '';
	loginForm: FormGroup;
	otpForm: FormGroup;
	submitted: boolean = false;
	loading = false;
	invalidLogin: boolean = false;
	returnUrl: string;
	comingFrom: string;
	otp: any;
	userOtp: '';
	permissionObject: any;
	userRoles: any;
	userInfo: any;
	countryList: any;
	searchCountryList: any;
	countryCode: any;
	isMobileLogin: boolean = true;
	isCountrySelected: boolean = false;
	ipAddress = '';
	redirectUrlToCheck = '';
	countryDroupDownShow = false;
	selectedCountry = null;
	searchText = '';
	selectedCountryCode = '';
	countrySelected = false;
	messageBoard = false;
	messageBoardList = [];
	signInMessage: any;
	displayMessage = false;
	loginAllowedFlag = true;
	emailError: boolean = false;
	projectName: any;
	loginAppBrading: any;
	showPassword: boolean = false;

	iconObject = {
		visibilityon: null,
		visibilityoff: null,
	};

	passwordRequired: boolean;

	constructor(
		private formBuilder: FormBuilder,
		public appService: AppService,
		private router: Router,
		private spinnerService: NgxSpinnerService,
		private route: ActivatedRoute,
		private authenticationService: AuthenticationService,
		public toastr: ToastrService,
		private http: HttpClient,
		private permissionsService: NgxPermissionsService
	) {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.projectName = 'drip';
			localStorage.setItem('projectName', this.projectName);
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.projectName = 'diwo';
			localStorage.setItem('projectName', this.projectName);
		}

		//For Dev Server
		if (!this.projectName) {
			let projectName = this.route.snapshot.queryParams['project']
				? this.route.snapshot.queryParams['project'].toLowerCase()
				: null;
			if (projectName == 'drip') {
				this.projectName = projectName;
				localStorage.setItem('projectName', this.projectName);
			} else if (projectName == 'diwo') {
				this.projectName = projectName;
				localStorage.setItem('projectName', this.projectName);
			}
			if (!this.projectName) {
				this.projectName = localStorage.getItem('projectName');
				if (!this.projectName) {
					this.projectName = 'drip';
					localStorage.setItem('projectName', this.projectName);
				}
			}
		}

		if (!localStorage.getItem('loginAppBrading')) {
			this.appService.getLoginAppBrading().subscribe((res: any) => {
				if (res.success) {
					(this.loginAppBrading = res.data), localStorage.setItem('loginAppBrading', JSON.stringify(res.data));
				}
			});
		} else {
			this.loginAppBrading = JSON.parse(localStorage.getItem('loginAppBrading'));
		}

		this.appService.setSiteBranding(this.projectName);
		this.appService.setIconWhiteBranding(this.iconObject, '#6513e1');
		if (this.appService.configurable_feature && this.appService.configurable_feature.web_password) {
			this.passwordRequired = true;
		}
	}

	ngOnInit() {
		this.appService.setProjectName();

		this.loginForm = this.formBuilder.group({
			phone: ['', this.isMobileLogin ? Validators.required : null],
			email: [
				'',
				!this.isMobileLogin ? [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)] : null,
			],
			password: ['', this.passwordRequired ? [Validators.required] : null],
			country: ['', Validators.required],
		});

		this.otpForm = this.formBuilder.group({
			otp1: ['', Validators.required],
			otp2: ['', Validators.required],
			otp3: ['', Validators.required],
			otp4: ['', Validators.required],
		});

		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
		this.comingFrom = this.route.snapshot.queryParams['comingFrom'] || '/';

		localStorage.setItem('comingFrom', this.comingFrom);
		this.checkLoggedIn();
		this.getCountryList();

		if (localStorage.getItem('isLoggedin') != 'true') {
			if (this.appService.configurable_feature && this.appService.configurable_feature.ipAddress_api) {
				this.getIPAddress();
			} else {
				country = 'India';
			}
		}

		$(document).ready(function () {
			$('#otp1').bind('input', function (e) {
				if ($(this).val() != '') {
					$('#otp2').focus();
				}
			});

			$('#otp2').bind('input', function (e) {
				if ($(this).val() != '') {
					$('#otp3').focus();
				} else {
					$('#otp2').focus();
				}
			});
			$('#otp3').bind('input', function (e) {
				if ($(this).val() != '') {
					$('#otp4').focus();
				} else {
					$('#otp3').focus();
				}
			});
			$('#otp4').bind('input', function (e) {
				if ($(this).val() == '') {
					$('#otp4').focus();
				}
			});
			$('#otp2').on('keydown', function (e) {
				if ((e.which == 8 || e.which == 46) && $(this).val() == '') {
					setTimeout(() => $('#otp1').focus(), 0);
					return true;
				}
				return true;
			});
			$('#otp3').on('keydown', function (e) {
				if ((e.which == 8 || e.which == 46) && $(this).val() == '') {
					setTimeout(() => $('#otp2').focus(), 0);
					return true;
				}
				return true;
			});
			$('#otp4').on('keydown', function (e) {
				if ((e.which == 8 || e.which == 46) && $(this).val() == '') {
					setTimeout(() => $('#otp3').focus(), 0);
					return true;
				}
				return true;
			});
		});

		if (localStorage.getItem('isLoggedin') != 'true') {
			setTimeout(() => {
				let varebale = document.getElementById('reve-chat-container-div');
				if (varebale) {
					varebale.style.display = 'none';
				}
				if (country.length > 0) {
					this.changeCountry(country);
				} else {
					setTimeout(() => {
						if (country.length > 0) {
							this.changeCountry(country);
						}
					}, 2000);
				}
			}, 2000);
		}

		if (localStorage.getItem('user')) {
			let user = JSON.parse(localStorage.getItem('user'));
		}

		window.addEventListener('popstate', this.onBackButtonEvent);
	}

	onBackButtonEvent = (e: any) => {
		e.preventDefault();
		$('#screen2').hide();
		$('#screen1').show();
	};

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			let varebale = document.getElementById('reve-chat-container-div');
			if (varebale) {
				varebale.style.display = 'none';
			}
			this.ipAddress = res.ip;
			this.getCountryName();
		});
	}

	getCountryName() {
		this.appService.getCountryName(this.ipAddress).subscribe((res) => (country = res.countryName));
	}

	changeCountry(country) {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		this.selectedCountry = country;
		for (let i in this.countryList) {
			if (this.countryList[i].name == country) {
				this.selectedCountryCode = this.countryList[i].countryCode.toLowerCase();
			}
		}
		this.countryDroupDownShow = false;
		this.countrySelected = true;

		this.loginForm = this.formBuilder.group({
			phone: ['', this.isMobileLogin ? Validators.required : null],
			email: [
				'',
				!this.isMobileLogin ? [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)] : null,
			],
			password: ['', this.passwordRequired ? [Validators.required] : null],
			country: [country + '', Validators.required],
		});

		if (country && country.length > 0) {
			this.changeCountryCode(country);
		}
	}

	get f() {
		return this.loginForm.controls;
	}
	get o() {
		return this.otpForm.controls;
	}

	checkLoggedIn() {
		let data = JSON.parse(localStorage.getItem('user')) || null;
		if (data) {
			this.spinnerService.show();
			this.validate(data);
		}
	}

	getCountryList() {
		this.appService.getCountries().subscribe(
			(res: any) => {
				this.countryList = res.data;
				for (let i in this.countryList) {
					this.countryList[i].countryCode = this.countryList[i].countryCode.toLowerCase();
				}
				this.searchCountryList = res.data;
			},
			(err) => {}
		);
	}

	changeCountryCode(val) {
		this.appService.getMarket(val).subscribe(
			(res: any) => {
				if (res.data.verify_using == 'Phone') {
					this.isMobileLogin = true;
					this.loginForm = this.formBuilder.group({
						phone: ['', this.isMobileLogin ? Validators.required : null],
						email: [
							'',
							!this.isMobileLogin ? [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)] : null,
						],
						password: ['', this.passwordRequired ? [Validators.required] : null],
						country: [val, Validators.required],
					});
				} else {
					this.isMobileLogin = false;
					this.loginForm = this.formBuilder.group({
						phone: ['', this.isMobileLogin ? Validators.required : null],
						email: [
							'',
							!this.isMobileLogin ? [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)] : null,
						],
						password: ['', this.passwordRequired ? [Validators.required] : null],
						country: [val, Validators.required],
					});
				}
				this.isCountrySelected = true;
				let varebale = document.getElementById('reve-chat-container-div');
				if (varebale) {
					varebale.style.display = 'none';
				}
			},
			(err) => {
				this.isCountrySelected = false;
			}
		);
		this.countryList.forEach((element) => {
			if (element.name == val) {
				this.countryCode = element.callingCode;
			}
		});
	}

	markAsTouched(group: FormGroup | FormArray) {
		Object.keys(group.controls).map((field) => {
			const control = group.get(field);
			if (control instanceof FormControl) {
				control.markAsTouched({ onlySelf: true });
			} else if (control instanceof FormGroup) {
				this.markAsTouched(control);
			}
		});
	}

	resendOtp() {
		this.otpForm.reset();
		this.generateOtp();
	}

	numberOnly(event, prevEle: HTMLInputElement, currentEle: HTMLInputElement, nextEle?: HTMLInputElement) {
		if ((event.keyCode == 46 || event.keyCode == 8) && currentEle.value != undefined) {
			currentEle.value = '';
			prevEle.focus();
			false;
		}
		if (currentEle && currentEle.value.length > 0) {
			if (nextEle) nextEle.focus();
		}
		if (
			(event.which != 0 && (event.which < 48 || event.which > 57) && !(event.which >= 96 && event.which <= 105)) ||
			(currentEle && currentEle.value.length > 0)
		) {
			return false;
		}
		return true;
	}

	getLogin() {
		if (this.appService.configurable_feature && this.appService.configurable_feature.web_otp) {
			this.generateOtp();
		} else {
			this.onSubmit();
		}
	}

	generateOtp() {
		let email: any;

		if (!this.isMobileLogin) {
			email = (<HTMLInputElement>document.getElementById('email')).value;
		}
		if (!this.isMobileLogin && email && !this.addEmail(email.trim())) {
			return;
		}

		if (this.loginForm.invalid) {
			this.markAsTouched(this.loginForm);
			return;
		}

		let country = this.selectedCountry;
		this.spinnerService.show();
		let verificationMedium =
			this.f.phone.value.toString() == 'null' || this.f.phone.value.toString() == ''
				? { email: this.f.email.value.toString() }
				: { phone: this.f.phone.value.toString() };

		let payload = {
			...verificationMedium,
			password: this.f.password.value,
			country: country,
			registration: false,
		};

		this.authenticationService
			.generateOtp(payload)
			.pipe(first())
			.subscribe(
				(data) => {
					this.spinnerService.hide();
					this.loginBy = '';
					if (data.success) {
						if (Object.keys(verificationMedium)[0] == 'phone') {
							this.loginBy = 'Mobile Number';
						} else {
							this.loginBy = 'Email ID';
						}
						this.otp = data.message;
						if (data.message && data.message.includes('New Otp:')) {
							this.userOtp = data.message;
						}
						$('#screen1').hide();
						$('#screen2').show();
						$('#otp1').focus();
						if (this.f.phone.value.toString() == 'null' || this.f.phone.value.toString() == '') {
							this.toastr.success(
								this.appService.getTranslation('Pages.Login.sentOnEmail'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.Login.otpSent'),
								this.appService.getTranslation('Utils.success')
							);
						}
					} else {
						this.toastr.warning(data.error, this.appService.getTranslation('Utils.warning'));
					}
				},
				(error) => {
					this.invalidLogin = true;
					this.loading = false;
				}
			);
	}

	onSubmit() {
		let email: any;

		if (!this.isMobileLogin) {
			email = (<HTMLInputElement>document.getElementById('email')).value;
		}
		if (!this.isMobileLogin && email && !this.addEmail(email.trim())) {
			return;
		}

		if (this.loginForm.invalid) {
			this.markAsTouched(this.loginForm);
			return;
		}

		this.submitted = true;
		let otp = null;

		if (this.appService.configurable_feature && this.appService.configurable_feature.web_otp) {
			// Check if any OTP field is empty
			if (!this.o.otp1.value || !this.o.otp2.value || !this.o.otp3.value || !this.o.otp4.value) {
				return;
			}

			otp = this.o.otp1.value + '' + this.o.otp2.value + '' + this.o.otp3.value + '' + this.o.otp4.value;
		}

		let country = this.selectedCountry;
		this.spinnerService.show();
		this.loading = true;

		let verificationMedium =
			this.f.phone.value.toString() == 'null' || this.f.phone.value.toString() == ''
				? { email: this.f.email.value.toString() }
				: { phone: this.f.phone.value.toString() };

		let payload = {
			...verificationMedium,
			password: this.f.password.value,
			otp: otp,
			country: country,
			momentDate: moment().format('DD-MM-YYYY HH:mm'),
		};

		this.authenticationService
			.login(payload)
			.pipe(first())
			.subscribe(
				(res) => {
					if (res.success) {
						let subscription = this.router.events.subscribe((event) => {
							if (event instanceof NavigationEnd) {
								let data = JSON.parse(localStorage.getItem('user')) || null;
								this.toastr.success(
									this.appService.getTranslation('Utils.welcome') + ' ' + this.appService.userPersonalData?.first,
									this.appService.getTranslation('Utils.success')
								);
								subscription.unsubscribe();
							}
						});

						this.validate(res);
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				},
				(error) => {
					this.submitted = false;
					this.otpForm.reset();
					this.loading = false;
					$('#otp1').focus();
				}
			);
	}

	cancel() {
		this.otpForm.reset();
		this.loginForm.reset();
		this.submitted = false;
		$('#screen2').hide();
		$('#screen1').show();
		$('#loginAs').modal('hide');
		localStorage.clear();
	}

	ngOnDestroy() {
		this.spinnerService.hide();
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		window.removeEventListener('popstate', this.onBackButtonEvent);
	}

	loginAs(role) {
		$('#loginAs').modal('hide');

		let roles = [];
		roles[0] = role;
		delete this.userInfo.user.roles;
		this.userInfo.user['roles'] = roles;

		localStorage.setItem('role', role.role);
		localStorage.setItem('roleId', role.roleId);
		localStorage.setItem('client', JSON.stringify(role.client));

		this.appService.setUserPersonalData();
		localStorage.setItem('user_raiserequest_name', this.userInfo.user.first + ' ' + this.userInfo.user.last);

		if (role) {
			this.authenticationService.updateUserToken(role.roleId, role.client.id).subscribe((res: any) => {
				if (res && res.success) {
					this.spinnerService.show();
					this.setMenuPermissions(roles[0].role);
					this.validate(this.userInfo);
					localStorage.setItem('isLoggedin', 'true');
				}
			});
		}
	}

	validate(data) {
		this.userInfo = data;
		var redirectUrl = localStorage.getItem('redirectUrl');
		let isMobile = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
		let admin_roles = [
			'Product Owner Super Admin',
			'Product Owner Admin',
			'Partner Super Admin',
			'Partner Admin',
			'Client Admin',
			'Branch Admin',
			'Analyst',
			'Content Author',
			'Business Manager',
			'Facilitator',
		];
		let admin_roles_uppercase = [
			'PRODUCT OWNER SUPER ADMIN',
			'PRODUCT OWNER ADMIN',
			'PARTNER SUPER ADMIN',
			'PARTNER ADMIN',
			'CLIENT ADMIN',
			'BRANCH ADMIN',
			'ANALYST',
			'CONTENT AUTHOR',
			'BUSINESS MANAGER',
			'FACILITATOR',
		];
		let flag = false;
		data.user.roles.forEach((item) => {
			if (admin_roles.indexOf(item.role) > -1) flag = true;
		});

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//.role
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if (data.user && (flag || admin_roles.indexOf(data.user.roles[0].role) > -1)) {
			this.userRoles = [];
			let allRoles = [];
			for (let role of data.user.roles) {
				if (role.roleId != 1) {
					allRoles.push(role);
					this.userRoles.push(role);
				}
			}
			// this.userRoles = data.user.roles;
			this.spinnerService.hide();
			data.user.roles = [];
			data.user.roles = allRoles;
			if (this.userRoles.length > 1) {
				setTimeout(() => {
					$('#loginAs').modal('show');
				}, 500);
			} else {
				localStorage.setItem('role', data.user.roles[0].role);
				localStorage.setItem('roleId', data.user.roles[0].roleId);
				localStorage.setItem('client', JSON.stringify(data.user.roles[0].client));
				this.appService.setProjectName();
				//Need to Get App Branding
				this.getAppBranding(data.user.roles[0].client, data);
			}
		} else {
			this.customerLogin(data, redirectUrl, isMobile);
		}
	}

	async getAppBranding(userClient, data) {
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
				this.appService.whiteBrandingColor = res?.data?.accent_color ? res.data.accent_color : '#6513e1';
				this.appService.setPaginationWhiteBranding();
				setTimeout(() => {
					this.loginByRole(data);
				}, 300);
			}
		});
	}

	loginByRole(data) {
		let admin_roles = [
			'Product Owner Super Admin',
			'Product Owner Admin',
			'Partner Super Admin',
			'Partner Admin',
			'Client Admin',
			'Branch Admin',
			'Analyst',
			'Content Author',
			'Business Manager',
			'Facilitator',
		];
		let admin_roles_uppercase = [
			'PRODUCT OWNER SUPER ADMIN',
			'PRODUCT OWNER ADMIN',
			'PARTNER SUPER ADMIN',
			'PARTNER ADMIN',
			'CLIENT ADMIN',
			'BRANCH ADMIN',
			'ANALYST',
			'CONTENT AUTHOR',
			'BUSINESS MANAGER',
			'FACILITATOR',
		];
		if (data.user && admin_roles.indexOf(data.user.roles[0].role) > -1) {
			let index = admin_roles.indexOf(data.user.roles[0].role);
			const perm = [admin_roles_uppercase[index]];
			this.permissionsService.loadPermissions(perm);
		}
		this.setMenuPermissions(data.user.roles[0].role);
		localStorage.setItem('isLoggedin', 'true');
		if (this.projectName == 'drip') {
			this.spinnerService.show();

			this.router.navigate(['/home']);
		} else {
			this.spinnerService.show();

			this.router.navigate(['/diwo-home']);
		}
	}

	customerLogin(data, redirectUrl, isMobile) {
		if (isMobile) {
			localStorage.setItem('isLoggedin', 'true');

			return;
		}
		let marketId;
		if (data && data.user && data.user.MarketId) {
			marketId = data.user.MarketId;
		} else if (data.user.Market) {
			marketId = data.user.Market.id;
		}

		this.setMenuPermissions(data.user.roles);
		localStorage.setItem('isLoggedin', 'true');
	}

	setMenuPermissions(roles) {
		this.appService.getUserMenu(roles).subscribe(
			(res: any) => {
				localStorage.setItem('menupermission', JSON.stringify(res.menu));
			},
			(error) => {}
		);
	}

	openCountyDropDown() {
		this.selectedCountry = null;
		this.selectedCountryCode = null;
		this.countrySelected = false;
		this.countryDroupDownShow = true;
		this.searchText = '';
		this.searchCountryList = this.countryList;
	}

	onTypeCountry(event: any) {
		this.searchText = event.toLowerCase();
		if (this.searchText.length == 0) {
			this.searchText = '';
			this.searchCountryList = this.countryList;
		} else {
			let countryArray = [];
			for (let i in this.countryList) {
				if (this.countryList[i].name.toLowerCase().includes(this.searchText)) {
					countryArray.push(this.countryList[i]);
				}
			}
			this.searchCountryList = countryArray;
		}
	}

	onCountrySelect(item) {
		this.selectedCountry = item.name;
		this.selectedCountryCode = item.countryCode.toLowerCase();
		this.countryDroupDownShow = false;
		this.countrySelected = true;
		this.changeCountryCode(item.name);
	}

	clickOnNextButton() {
		this.spinnerService.show();
		this.router.navigate(['/consumer/home/activities/today']);
	}

	ClickOnPendingAction() {
		this.router.navigate(['/pending-action']);
	}

	ClickOnMessage(item) {
		if (item.internal_tags) {
			localStorage.setItem('internal_tags', item.internal_tags);
			this.router.navigate(['/consumer/home/activities/today']);
		} else if (item.external_link) {
			let sendData = JSON.stringify(item);
			localStorage.setItem('messageBoardVdo', sendData);
			this.router.navigate(['/video-guides']);
		}
	}

	goToMore() {
		if (this.signInMessage.external_link && this.signInMessage.external_link != null) {
			window.open(this.signInMessage.external_link, '_blank');
		}
	}
	addEmail(email) {
		email = email.replace(' ', '');
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
				this.loginForm.controls['email'].setValue(email.trim());
				this.emailError = false;
				return true;
			} else {
				this.loginForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.loginForm.controls['email'].setErrors({ pattern: true });
			this.emailError = true;
			return false;
		}
	}

	togglePassword() {
		this.showPassword = !this.showPassword;
	}

	forgotPassword() {
		this.router.navigate(['/forgot-password']);
	}
}
