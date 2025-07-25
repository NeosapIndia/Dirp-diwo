import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
// import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import * as ko from 'knockout';
import * as owasp from 'owasp-password-strength-test';
import { Model, SurveyNG, StylesManager } from 'survey-angular';
import moment from 'moment';

StylesManager.applyTheme('modern');

@Component({
	selector: 'app-register-user',
	templateUrl: './register-user.page.html',
	styleUrls: ['./register-user.page.scss'],
})
export class RegisterUserPage implements OnInit {
	userform: FormGroup;
	isTabletOrIpad = false;
	projectName: string;
	appBrandingInfo: any;
	sessionCode: any;
	appBrandingForSpotReg: any;
	spotRegData: any = [];
	labelText: any;

	firstNameData = null;
	lastNameData = null;
	branchData = null;
	cityData = null;
	stateData = null;
	phoneData = null;
	emailData = null;
	zipCodeData = null;
	jobRoleData = null;
	tagsData = null;
	branchClientData: any = [];
	loginWith: string;
	verify_using: string;
	loginId: string;
	emailError: boolean = false;
	tagsArray: any[] = [];
	userSelecteTags: any[] = [];
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	avatar: any;
	surveyObject = {
		elements: [],
	};

	surveyModel: Model;
	checkSurveyValidation: boolean = false;
	isDripAccess: boolean = false;
	newUserSpotData: any;

	newPassword: string = '';
	confirmPassword: string = '';
	showPassword: boolean = false;
	showConfirmPassword: boolean = false;
	passwordFeedback: string;
	iconObject = {};

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
		private route: ActivatedRoute,
		private formBuilder: FormBuilder
	) {
		this.sessionCode = localStorage.getItem('sessionCode');
		this.newUserSpotData = JSON.parse(localStorage.getItem('newUserSpotData'));
		this.loginId = localStorage.getItem('loginId');
		this.verify_using = localStorage.getItem('verify_using');
		// this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
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

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit(): void {
		this.createForm();
		this.getClientAppBrandingForSpotRegistration();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.userform = this.formBuilder.group({
			firstName: [null, [Validators.required]],
			lastName: [null, [Validators.required]],
			newPassword: [null, [Validators.required]],
			confirmPassword: [null, [Validators.required, this.matchPasswordValidator.bind(this)]],
			Email: [null],
			Phone: [null],
			State: [null],
			City: [null],
			zipCode: [null],
			Branch: [null],
			jobRole: [null],
			Tags: [null],
			addForDrip: [false],
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

	get f1() {
		return this.userform.controls;
	}

	matchPasswordValidator(control: FormControl) {
		if (this.userform) {
			return control.value === this.userform.get('newPassword').value ? null : { mismatch: true };
		}
		return null;
	}

	getClientAppBrandingForSpotRegistration() {
		this.appService.getAppBrandingForSpotRegBySessionCode(this.sessionCode).subscribe((res: any) => {
			this.appBrandingForSpotReg = res.data;
			this.spotRegData = res.data && res.data.spotRegistration ? JSON.parse(res.data.spotRegistration) : [];
			this.avatar = res.data.Client.avatar_path;
			this.tagsArray = [];
			let addForDrip = this.appBrandingForSpotReg ? this.appBrandingForSpotReg.addLearnerForDrip : false;
			this.userform.controls['addForDrip'].setValue(addForDrip);
			for (let item of this.spotRegData) {
				if (item.type == 'FirstName') {
					this.firstNameData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'LastName') {
					this.lastNameData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'Email') {
					this.emailData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'Phone') {
					this.phoneData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'State') {
					this.stateData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'City') {
					this.cityData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'Zip Code') {
					this.zipCodeData = {
						label: item.labelText,
						required: item.isRequired,
					};
				} else if (item.type == 'Branch') {
					this.branchData = {
						label: item.labelText,
						required: item.isRequired,
						selectedBranchAccount: [],
					};
					this.branchData.selectedBranchAccount.push(item.selectedBranchAccount);
				} else if (item.type == 'Job Role') {
					this.jobRoleData = {
						label: item.labelText,
						required: item.isRequired,
						sectedJobRoleDetails: item.sectedJobRoleDetails,
					};
				} else if (item.type == 'Tags') {
					this.tagsData = {
						label: item.labelText,
						required: item.isRequired,
						selectedTagArray: item.selectedTags ? item.selectedTags.split(',') : [],
						tagRequired: false,
					};
					this.tagsArray.push(this.tagsData);
				}
			}

			let assignCustomFields = [];
			if (
				this.appBrandingForSpotReg &&
				this.appBrandingForSpotReg.customFields &&
				this.appBrandingForSpotReg.customFields.length > 0
			) {
				for (let i = 0; i < this.appBrandingForSpotReg.customFields.length; i++) {
					for (let item of this.spotRegData) {
						if (i == item.linkTo) {
							let payload = this.appBrandingForSpotReg.customFields[i];
							payload.label_ = item.labelText;
							payload.isRequired = item.isRequired;
							assignCustomFields.push(payload);
						}
					}
				}
			}

			if (assignCustomFields.length > 0) {
				let customFields = [];

				for (let field of assignCustomFields) {
					let fieldObj = {
						name: field.label,
						title: field.label_,
						isRequired: field.isRequired,
						requiredErrorText: field.label + ' is required',
					};

					if (field.isHide) {
						continue;
					}
					if (['Single-line text', 'Multi-line text'].indexOf(field.dataType) > -1) {
						// ------------------------------------------------Custom Type :- SINGLE LINE TEXT------------------------------------------------

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'text';

						if (field.maxCharLimit && field.maxCharLimit != '' && field.maxCharLimit != null) {
							fieldObj['maxLength'] = parseInt(field.maxCharLimit);
						}

						fieldObj['validators'] = [];

						if (field.minCharLimit && field.minCharLimit != '' && field.minCharLimit != null) {
							fieldObj['validators'].push({
								type: 'text',
								minLength: parseInt(field.minCharLimit),
							});
						}

						if (field.restrictNumber && field.restrictSpecialChar) {
							fieldObj['validators'].push({
								type: 'regex',
								text: 'Please enter only letters',
								regex: '^[^0-9!@#$%^&*(),.?":{}|<>]*$',
							});
						} else if (field.restrictNumber) {
							fieldObj['validators'].push({
								type: 'regex',
								text: 'Please enter only letters',
								regex: '^[^0-9]*$',
							});
						} else if (field.restrictSpecialChar) {
							fieldObj['validators'].push({
								type: 'regex',
								text: 'Please enter only letters',
								regex: '^[^!@#$%^&*(),.?":{}|<>]*$',
							});
						}

						if (field.dataType === 'Multi-line text') {
							delete fieldObj['inputType'];
							fieldObj['type'] = 'comment';
							fieldObj['rows'] = 2;
							fieldObj['autoGrow'] = true;
							fieldObj['allowResize'] = false;
						}
					} else if (['Number', 'Percentage'].indexOf(field.dataType) > -1) {
						// ------------------------------------------------Custom Type :- NUMBER------------------------------------------------

						fieldObj['type'] = 'text';

						fieldObj['validators'] = [
							{
								type: 'numeric',
								minValue: field.setMinValue ? parseInt(field.setMinValue) : 0,
								maxValue: field.setMaxValue ? parseInt(field.setMaxValue) : 100,
							},
						];

						//Add Validation Decimal
						if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
							fieldObj['maskType'] = 'numeric';
							fieldObj['maskSettings'] = {
								precision: parseInt(field.decimalLimit),
							};
						}
					} else if (field.dataType === 'Percentage') {
						// ------------------------------------------------Custom Type :- PERCENTAGE------------------------------------------------

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'percentage';
						if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
							fieldObj['maskType'] = 'numeric';
							fieldObj['maskSettings'] = {
								precision: parseInt(field.decimalLimit),
							};
						}
					} else if (field.dataType === 'Currency') {
						// ------------------------------------------------Custom Type :- CURRENCY------------------------------------------------

						fieldObj['type'] = 'text';
						fieldObj['maskType'] = 'currency';
						fieldObj['maskSettings'] = {
							prefix: field.currencySymbol ? field.currencySymbol : '$',
						};
					} else if (field.dataType === 'Date picker') {
						// ------------------------------------------------Custom Type :- DATE PICKER------------------------------------------------
						if (field.datePickerValidationType == 'Any Date') {
							fieldObj['type'] = 'text';
							fieldObj['inputType'] = 'date';
						} else if (field.datePickerValidationType == 'Future Date Only') {
							fieldObj['type'] = 'text';
							fieldObj['inputType'] = 'date';

							let today = moment();
							let maxDate = moment('9999-12-31');
							let maxDateCount = maxDate.diff(today, 'days');

							if (field.futureDateValidationType == 'Any future date') {
								fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
								fieldObj['minValueExpression'] = 'today(1)';
							} else if (field.futureDateValidationType == 'Any date after buffer time') {
								let minValuedate = moment().add(parseInt(field.dayCount), 'days');
								let minValueCount = minValuedate.diff(moment(), 'days');

								fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
								fieldObj['minValueExpression'] = `today(${minValueCount})`;
							} else if (field.futureDateValidationType == 'Any date in a rolling date range') {
								let maxValuedate = moment().add(parseInt(field.dayCount), 'days');
								let maxValueCount = maxValuedate.diff(moment(), 'days');

								fieldObj['maxValueExpression'] = `today(${maxValueCount})`;
								fieldObj['minValueExpression'] = `today(1)`;
							}
						} else if (field.datePickerValidationType == 'Past Date Only') {
							let today = moment();
							let minDate = moment('1800-01-1');
							let minDateCount = minDate.diff(today, 'days');

							fieldObj['type'] = 'text';
							fieldObj['inputType'] = 'date';
							fieldObj['minValueExpression'] = `today(${minDateCount})`;
							fieldObj['maxValueExpression'] = 'today()';
						} else if (field.datePickerValidationType == 'Specific Date Range') {
							let date = moment();
							let minDate = moment(field.startDate);
							let maxDate = moment(field.endDate);

							let minDateCount = minDate.diff(date, 'days');
							let maxDateCount = maxDate.diff(date, 'days');

							fieldObj['type'] = 'text';
							fieldObj['inputType'] = 'date';
							fieldObj['minValueExpression'] = `today(${minDateCount})`;
							fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
						}
					} else if (field.dataType === 'Radio select') {
						// ------------------------------------------------Custom Type :- RADIO SELECT------------------------------------------------
						fieldObj['type'] = 'radiogroup';
						fieldObj['showNoneItem'] = false;
						fieldObj['showOtherItem'] = false;
						fieldObj['colCount'] = 1;
						fieldObj['choices'] = [];
						for (let option of field.options) {
							fieldObj['choices'].push(option.label);
						}
					} else if (field.dataType === 'Dropdown select') {
						fieldObj['type'] = 'dropdown';
						fieldObj['showNoneItem'] = false;
						fieldObj['showOtherItem'] = false;
						fieldObj['choices'] = [];
						for (let option of field.options) {
							if (!option.isHide) {
								fieldObj['choices'].push(option.label);
							}
						}
					}

					customFields.push(fieldObj);
				}

				this.surveyObject = {
					elements: customFields,
				};

				this.showCustomFields();
			} else {
				this.surveyObject = {
					elements: [],
				};
				this.showCustomFields();
			}
		});
	}

	showCustomFields() {
		this.surveyModel = new Model(this.surveyObject);
		this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}

	entryCustomField(survey = null, options = null) {
		if (this.checkSurveyValidation) {
			this.surveyModel.validatePage();
		}
	}

	onSelectTags(index, event: any) {
		if (this.userSelecteTags[index]) {
			this.userSelecteTags[index] = event.target.value;
		} else {
			this.userSelecteTags.push(event.target.value);
		}
		this.tagsArray[index].tagRequired = false;
		this.tagsArray[index].required = false;
	}

	submit(value) {
		let data = {};
		let flag = false;
		data['first'] = this.userform.value.firstName;
		data['password'] = this.userform.value.newPassword;
		data['last'] = this.userform.value.lastName;
		data['email'] = this.userform.value.Email;
		data['phone'] = this.userform.value.Phone;
		data['state'] = this.userform.value.State;
		data['city'] = this.userform.value.City;
		data['zipCode'] = this.userform.value.zipCode;
		data['branch'] = this.userform.value.Branch;
		data['jobRole'] = this.userform.value.jobRole;
		data['tags'] = this.userSelecteTags;
		data['addForDrip'] = this.userform.value.addForDrip;
		data['customFields'] = this.surveyModel?.data ? this.surveyModel.data : {};
		data['sessioncode'] = this.sessionCode;
		data['country'] = this.newUserSpotData.country;

		if (this.newUserSpotData && this.newUserSpotData.email) {
			data['email'] = this.newUserSpotData.email;
		} else if (this.newUserSpotData && this.newUserSpotData.phone) {
			data['phone'] = this.newUserSpotData.phone;
		} else if (this.newUserSpotData && this.newUserSpotData.username) {
			data['username'] = this.newUserSpotData.username;
		}

		if (this.userform.value.newPassword != this.userform.value.confirmPassword) {
			this.presentToast(this.appService.getTranslation('Utils.passwordnotmatch'));
			flag = true;
		}

		this.checkSurveyValidation = true;
		if (this.userform.invalid || !this.surveyModel?.validatePage()) {
			this.markAsTouched(this.userform);
			flag = true;
		}

		this.checkSurveyValidation = false;

		if (
			this.phoneData &&
			this.phoneData.required &&
			this.verify_using == 'Email' &&
			(data['phone'] == null || data['phone'] == '')
		) {
			this.userform.controls['Phone'].setErrors({ required: true });
			this.userform.controls['Phone'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (
			this.emailData &&
			this.emailData.required &&
			this.verify_using == 'Mobile Number' &&
			(data['email'] == null || data['email'] == '')
		) {
			this.userform.controls['Email'].setErrors({ required: true });
			this.userform.controls['Email'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (this.stateData && this.stateData.required && (data['state'] == null || data['state'] == '')) {
			this.userform.controls['State'].setErrors({ required: true });
			this.userform.controls['State'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (this.cityData && this.cityData.required && (data['city'] == null || data['city'] == '')) {
			this.userform.controls['City'].setErrors({ required: true });
			this.userform.controls['City'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (this.zipCodeData && this.zipCodeData.required && (data['zipCode'] == null || data['zipCode'] == '')) {
			this.userform.controls['zipCode'].setErrors({ required: true });
			this.userform.controls['zipCode'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (this.branchData && this.branchData.required && (data['branch'] == null || data['branch'] == '')) {
			this.userform.controls['Branch'].setErrors({ required: true });
			this.userform.controls['Branch'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		if (this.jobRoleData && this.jobRoleData.required && (data['jobRole'] == null || data['jobRole'] == '')) {
			this.userform.controls['jobRole'].setErrors({ required: true });
			this.userform.controls['jobRole'].markAsTouched({ onlySelf: true });
			flag = true;
		}

		for (let item of this.tagsArray) {
			if (item.required) {
				item.tagRequired = true;
				flag = true;
			}
		}

		if (
			this.userform.value.Phone !== null &&
			this.userform.value.Phone !== undefined &&
			this.userform.value.Phone !== ''
		) {
			const re = new RegExp(/^[0-9]{10}$/);
			if (re.test(this.userform.value.Phone)) {
				this.userform.controls['Phone'].setValue(this.userform.value.Phone);
			} else {
				this.presentToast(this.appService.getTranslation('Utils.enterCorrectMobileNumber'));
				return;
			}
		}

		// console.log('--data-', data);
		if (flag) {
			return;
		}

		this.appService.showLoader(1000);
		this.appService.registerUser(data).subscribe(
			(res: any) => {
				this.appService.hideLoader();
				if (res.success === true) {
					let userData = JSON.parse(localStorage.getItem('user'));
					if (res.isCreated) {
						let navigationExtras: NavigationExtras = {
							state: {
								email: this.newUserSpotData.email || '',
								mobile: this.newUserSpotData.phone || '',
								username: this.newUserSpotData.username || '',
								country: this.newUserSpotData.country,
								isComingFromSpotRegister: true,
							},
						};
						this.navCtrl.navigateForward(['login-otp'], navigationExtras);
					}
				} else {
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
				console.log('-err-', error);
				this.appService.hideLoader();
				const key = this.appService.GetLanguageKey(error.error.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
			}
		);
	}

	addEmail(email_) {
		let email = email_.target.value;
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
				this.userform.controls['Email'].setValue(email.trim());
				this.emailError = false;
				return true;
			} else {
				this.userform.controls['Email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.userform.controls['Email'].setErrors({ pattern: true });
			this.emailError = true;
			return false;
		}
	}

	togglePassword() {
		this.showPassword = !this.showPassword;
	}

	toggleConfirmPassword() {
		this.showConfirmPassword = !this.showConfirmPassword;
	}

	checkPasswordStrength() {
		const result = owasp.test(this.userform.controls['newPassword'].value);
		if (result.errors.length > 0) {
			this.passwordFeedback = result.errors.join(' ');
		} else {
			this.passwordFeedback = 'Password is strong.';
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
}
