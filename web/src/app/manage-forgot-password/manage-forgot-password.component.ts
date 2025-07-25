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
	selector: 'app-manage-forgot-password',
	templateUrl: './manage-forgot-password.component.html',
	styleUrls: ['./manage-forgot-password.component.scss'],
	animations: [routerTransition()],
})
export class ManageForgotPasswordComponent implements OnInit, OnDestroy {
	forgotForm: FormGroup;
	loading = false;

	emailError: boolean = false;
	projectName: any;
	loginAppBrading: any;
	showPassword: boolean = false;

	iconObject = {
		emailIcon: null,
	};

	isEmailSend: boolean = false;

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
		this.getAppBranding2();
	}

	getAppBranding2() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngOnInit() {
		this.appService.setProjectName();

		this.forgotForm = this.formBuilder.group({
			email: ['', [Validators.required, Validators.pattern(/^\w+([\.-]?\w+.*\.*)*@\w+([\.-]?\w+)*(\.\w{2,})+$/)]],
		});

		window.addEventListener('popstate', this.onBackButtonEvent);
	}

	onBackButtonEvent = (e: any) => {
		e.preventDefault();
	};

	get f() {
		return this.forgotForm.controls;
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

	getLogin() {
		this.generateOtp();
	}

	generateOtp() {
		let email: any;
		email = (<HTMLInputElement>document.getElementById('email')).value;
		if (email && !this.addEmail(email.trim())) {
			return;
		}
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}

		if (this.forgotForm.invalid) {
			this.markAsTouched(this.forgotForm);
			return;
		}

		this.spinnerService.show();
		let verificationMedium = { email: this.f.email.value.toString() };
		let payload = {
			...verificationMedium,
		};

		this.authenticationService
			.forgotPassword(payload)
			.pipe(first())
			.subscribe(
				(data) => {
					this.spinnerService.hide();
					if (data.success) {
						this.isEmailSend = true;
						// this.toastr.success(
						// 	this.appService.getTranslation('Pages.ForgotPassword.forgotlinksent'),
						// 	this.appService.getTranslation('Utils.success')
						// );
					} else {
						this.forgotForm.reset();
						this.isEmailSend = false;
						this.toastr.warning(data.error, this.appService.getTranslation('Utils.warning'));
					}
				},
				(error) => {
					this.forgotForm.reset();
					this.loading = false;
					this.isEmailSend = false;
				}
			);
	}

	cancel() {
		this.forgotForm.reset();
		localStorage.clear();
	}

	ngOnDestroy() {
		this.spinnerService.hide();
		window.removeEventListener('popstate', this.onBackButtonEvent);
	}

	async getAppBranding(userClient, data) {
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
				this.appService.whiteBrandingColor = res?.data?.accent_color ? res.data.accent_color : '#6513e1';
				this.appService.setPaginationWhiteBranding();
			}
		});
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
				this.forgotForm.controls['email'].setValue(email.trim());
				this.emailError = false;
				return true;
			} else {
				this.forgotForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.forgotForm.controls['email'].setErrors({ pattern: true });
			this.emailError = true;
			return false;
		}
	}

	backtoLogin() {
		this.isEmailSend = false;
		this.router.navigate(['/login']);
	}
}
