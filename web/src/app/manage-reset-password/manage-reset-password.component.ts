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

import { Injectable } from '@angular/core';
import * as owasp from 'owasp-password-strength-test';

owasp.config({
	minLength: 8,
	maxLength: 64,
	minOptionalTestsToPass: 4,
});

@Injectable({
	providedIn: 'root',
})
@Component({
	selector: 'app-manage-reset-password',
	templateUrl: './manage-reset-password.component.html',
	styleUrls: ['./manage-reset-password.component.scss'],
	animations: [routerTransition()],
})
export class ManageResetPasswordComponent implements OnInit, OnDestroy {
	resetForm: FormGroup;
	loading = false;

	emailError: boolean = false;
	projectName: any;
	loginAppBrading: any;
	newshowPassword: boolean = false;
	confirmshowPassword: boolean = false;

	iconObject = {
		visibilityon: null,
		visibilityoff: null,
	};

	pageMode: any;
	incomingData: any;
	isTokenExpired: boolean = false;
	passwordFeedback: any = [];

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
	}

	ngOnInit() {
		this.checkResetPasswordTokenValidity();
		this.incomingData = this.route.params['_value'];
		if (this.incomingData && this.incomingData.pageMode == 'Reset') {
			this.pageMode = 'Reset';
		} else {
			this.pageMode = 'Create';
		}

		this.appService.setProjectName();

		this.resetForm = this.formBuilder.group({
			newpassword: ['', [Validators.required]],
			confirmpassword: ['', [Validators.required, this.matchPasswordValidator.bind(this)]],
		});

		window.addEventListener('popstate', this.onBackButtonEvent);
	}

	onBackButtonEvent = (e: any) => {
		e.preventDefault();
	};

	get f() {
		return this.resetForm.controls;
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

	matchPasswordValidator(control: FormControl) {
		if (this.resetForm) {
			return control.value === this.resetForm.get('newpassword').value ? null : { mismatch: true };
		}
		return null;
	}

	checkResetPasswordTokenValidity() {
		this.authenticationService.checkresetpasswordtokenValidity().subscribe(
			(res: any) => {
				if (res.success === true) {
					this.isTokenExpired = false;
				} else {
					this.isTokenExpired = true;
				}
			},
			(error) => {
				this.isTokenExpired = true;
			}
		);
	}

	checkPasswordStrength() {
		const result = owasp.test(this.f.newpassword.value.toString());
		console.log('-result-', result);
		this.passwordFeedback = [];
		if (result.errors.length > 0) {
			this.passwordFeedback.push(...result.errors.map((error) => ({ message: error, valid: false })));
		}
		if (result.strong) {
			this.passwordFeedback.push({ message: 'Password is strong.', valid: true });
		}
	}

	resetPassword() {
		const result = owasp.test(this.f.newpassword.value.toString());

		if (result.errors.length > 0 || this.resetForm.invalid) {
			this.markAsTouched(this.resetForm);
			return;
		}

		console.log('-this.f.newpassword.value.toString()-', this.f.newpassword.value.toString());
		console.log('-this.f.confirmpassword.value.toString()-', this.f.confirmpassword.value.toString());

		if (this.f.newpassword.value.toString() === this.f.confirmpassword.value.toString()) {
			this.spinnerService.show();
			let verificationMedium = { pass: this.f.newpassword.value.toString() };
			const token = localStorage.getItem('token');
			let payload = {
				...verificationMedium,
				token: token,
			};

			localStorage.removeItem('token');
			this.authenticationService
				.resetPassword(payload)
				.pipe(first())
				.subscribe(
					(data) => {
						this.spinnerService.hide();
						if (data.success) {
							this.toastr.success(
								this.appService.getTranslation('Pages.ResetPassword.passwordchnagetoaster'),
								this.appService.getTranslation('Utils.success')
							);
							this.router.navigate(['/login']);
							this.resetForm.reset();
						} else {
							this.toastr.warning(data.error, this.appService.getTranslation('Utils.warning'));
						}
					},
					(error) => {
						this.loading = false;
					}
				);
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.ResetPassword.passwordnotmatch'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	cancel() {
		this.resetForm.reset();
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

	toggleNewPassword() {
		if (!this.isTokenExpired) {
			this.newshowPassword = !this.newshowPassword;
		}
	}

	toggleConfirmPassword() {
		if (!this.isTokenExpired) {
			this.confirmshowPassword = !this.confirmshowPassword;
		}
	}
}
