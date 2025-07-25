import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { ManageClientsService } from '../manage-clients/manage-clients.service';
import { routerTransition } from '../router.animations';
import { UserService } from '../shared';
import { ManageLearnerService } from './manage-learners.service';

import { ngxCsv } from 'ngx-csv/ngx-csv';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';
import { Model, SurveyNG, StylesManager } from 'survey-angular';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

StylesManager.applyTheme('modern');
const zipcodeRegex = require('../../assets/zipcodeValidation.json');
declare var SelectFx: any;
declare var jquery: any;
declare var $: any;

@Component({
	selector: 'app-manage-learners',
	templateUrl: './manage-learners.component.html',
	styleUrls: ['./manage-learners.component.scss'],
	animations: [routerTransition()],
})
export class ManageLearnersComponent implements OnInit {
	@ViewChild('pathFile') pathFileInput: ElementRef;

	learnerForm: FormGroup;
	broadcastNotifier: FormGroup;
	learnersList: any = [];
	selectedLearner: any;
	languageList = [];
	searchFilter: any = '';
	filterStatus: any;
	countryList: any;
	packageEntityDetails: any;
	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: number = 25;
	totalLearnerCount: any;
	phoneFlag: boolean = false;
	emailFlag: boolean = false;
	selectedMarket: any;
	courierList: any;
	provinces: any;
	productInfo: any = [];
	MarketList: any = [];
	addLearnerCountry: any = [];
	regionalLanguageList: any = [];
	learnerId: number;
	policyGroupList = [
		{ name: 'Cookie Policy' },
		{ name: 'Terms and Conditions' },
		{ name: 'Replacement Policy' },
		{ name: 'Refund Cancellation' },
		{ name: 'Shipping Policy' },
		{ name: 'Privacy Policy' },
	];
	learnerData: any;
	allowWrite: boolean;
	allowRead: boolean;
	marketPermission: boolean = false;
	marketHasRMode: boolean = false;
	writePermission: any;
	ip_address: string;
	learnerListNames = [];
	learnerList = [];
	learnerListForDownload = [];
	learnerLimt = 10000;
	selectedLearnerName;
	clientAllLearners = [];
	userClientId: any;
	userClient: any;
	allCountryList: any = [];
	selectedCountry: any;
	job_role = [];
	branchClientList = [];
	moveLearners: any;
	userLearner: any;
	userLearnerRoleForm: any = [];
	lastLevelClientList: any = [];
	selectedLearnerIdForDelete: any;
	selectedLearnerIdForCreate: any;
	selectedLearnerIdForOptIn: any;
	selectedLearnerIdForTeamSync: any;
	selectedLearnerIdForarchive: any;
	selectedLearnerIdForMove: any;
	checkCount: any;
	archiveUser: any;
	isArchive: any;
	userId: any;
	roleId: string;
	isDownload: boolean = false;
	formula: string = 'Learner Report';
	email: any;
	phone: any;
	FilterLearnerColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Learner Name', value: 'first' },
		{ label: 'Phone Number', value: 'phone' },
		{ label: 'Email', value: 'email' },
		{ label: 'Parent Account', value: 'parentname' },
		{ label: 'Job Role', value: 'jobrole' },
		{ label: 'Learner Id', value: 'account_id' },
		{ label: 'Status', value: 'cStatus' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	payload: { searchKey: any; filterColumn: any; selectedDate: any };

	selectedDate: any;
	ranges: any = {
		Today: [moment(), moment()],
		Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	};
	invalidDates: moment.Moment[] = [];
	phoneCode: any = '';
	rangeMarks = {
		0: '0',
		10: '10',
		20: '20',
		30: '30',
		40: '40',
		50: '50',
		60: '60',
		70: '70',
		80: '80',
		90: '90',
		100: '100',
	};

	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};
	showSelectAllOption: boolean = false;
	selectedLearnerIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	isMobileCompulsory: any;
	isEmailCompulsory: boolean;
	selectedBranchClientId: any;
	noWhastAppSetup: boolean = null;
	type = 'drip';
	emailError: boolean = false;
	excelLearnerUpload: any;
	excelLearnerUpdate: any;
	fileToUpdateLearner: any;
	isFileSelecteToUpdate: boolean = false;
	projectName: string;
	isApiCall: boolean = false;
	typingTimer = null;

	isDataLoaded: boolean = false;

	surveyObject = {
		elements: [
			// {
			// 	name: 'FirstName',
			// 	title: 'Enter your first name',
			// 	type: 'text',
			// 	//   inputType: "text",
			// },
			// {
			// 	name: 'LastName',
			// 	title: 'Enter your last name',
			// 	type: 'text',
			// },
			// {
			// 	name: 'Email',
			// 	title: 'Enter your email address',
			// 	type: 'text',
			// 	//   inputType: "text",
			// },
			// {
			// 	name: 'Phone',
			// 	title: 'Enter your phone number',
			// 	type: 'text',
			// },
		],
	};

	surveyModel: Model;
	checkSurveyValidation = false;
	canAddEditLearner: boolean = false;
	allLength: any;
	isDripAccess: boolean = false;
	isDiwoAccess: boolean = false;
	learnerGroupsList: any[];
	searchKeyData: any;
	haveTeamSetup: boolean = false;
	showTeamId = false;
	holdUploadLearner: any = false;

	iconObject = {
		info_icon_20: null,
		search_loader: null,
	};

	color = `#6513e1`;
	isLearnerLockout: any;

	constructor(
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private learnerService: ManageLearnerService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private userService: UserService,
		private clientsService: ManageClientsService,
		private route: ActivatedRoute,
		private http: HttpClient
	) {
		if (JSON.parse(localStorage.getItem('app_branding'))) {
			this.isMobileCompulsory = JSON.parse(localStorage.getItem('app_branding')).compMobNo || false;
			this.isEmailCompulsory = JSON.parse(localStorage.getItem('app_branding')).compEmail || false;
		}
	}

	ngOnInit() {
		this.projectName = localStorage.getItem('projectName');
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.type = this.learnerService.type;
		if (this.type === 'drip') {
			this.FilterColumnArray = [
				{ label: 'Contact Name', value: 'first' },
				{ label: 'Phone Number', value: 'phone' },
				{ label: 'Email', value: 'email' },
				{ label: 'Parent Account', value: 'parentname' },
				{ label: 'Job Role', value: 'jobrole' },
				{ label: 'Contact Id', value: 'account_id' },
				{ label: 'Status', value: 'cStatus' },
				{ label: 'Whatsapp Opt In', value: 'opt_in' },
			];
		}

		this.learnerForm = this.formBuilder.group({
			id: [null],
			first: ['', Validators.required],
			last: ['', Validators.required],
			email: ['', Validators.required],
			phone: [''],
			country: ['', Validators.required],
			CountryId: ['', Validators.required],
			CalligCode: ['', Validators.required],
			state: [''],
			city: [''],
			zipCode: [''],
			clientIdForLearnerRole: ['', Validators.required],
			job_role_id: [''],
			tags: [''],
			haveWhatsAppOptIn: [false],
			triggerOptInMsg: [false],
			haveEmailPer: [false],
			forDrip: [this.projectName == 'drip' ? true : false],
			forDiwo: [this.projectName == 'diwo' ? true : false],
			groupId: [null],
			team_id: [null],
			username: [null],
		});

		//Disable Team User Id
		this.learnerForm.controls['team_id'].disable();
		if (this.isMobileCompulsory == true) {
			this.learnerForm.get('phone').setValidators([Validators.required, Validators.pattern('[6-9]\\d{9}')]);
		} else {
			this.learnerForm.get('phone').clearValidators();
		}

		if (!this.isEmailCompulsory) this.learnerForm.get('email').clearValidators();

		this.filterStatus = true;
		if (localStorage.getItem('adminuser')) {
			localStorage.removeItem('adminuser');
			localStorage.removeItem('adminmenupermission');
			localStorage.removeItem('adminrole');
		}
		setTimeout(() => {
			let varebale = document.getElementById('reve-chat-container-div');
			if (varebale) {
				varebale.style.display = 'none';
			}
		}, 3000);
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		if (this.userClient && ['Client Account', 'Branch Account'].indexOf(this.userClient.category) > -1) {
			this.canAddEditLearner = true;
		}
		this.getAllClientList(this.userClientId);
		this.countries();
		this.userLearner = JSON.parse(localStorage.getItem('client')) || null;
		// this.getChildClientList(this.userLearner.id);
		this.getAllLastClientList();
		this.checkUploadLearnerData();
		this.createFilterLearnerColumnForm();
		this.FilterLearnerColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		setTimeout(() => {
			this.getCustomFieldByClient();
		}, 200);

		this.getRollPermission();
		this.getBranchClientList();

		this.searchKeyData = JSON.parse(localStorage.getItem('searchLearners'));
		if (this.searchKeyData) {
			this.inputSearchTxt = this.searchKeyData.searchKey;
			this.FilterLearnerColumnForm.controls['FilterColumn'].setValue(this.searchKeyData.filterColumn);
			this.getLearnerByFilter(this.inputSearchTxt);
		} else {
			this.getClientAllLearner(this.userClientId, this.page, this.limit);
		}
		this.getLearnerGroupByUserId(this.userId, this.userClientId, this.roleId);

		if (this.type == 'diwo') {
			if (this.userClient.DripAccess) {
				this.isDripAccess = true;
			} else {
				this.isDripAccess = false;
			}
		} else if (this.type == 'drip') {
			if (this.userClient.DiwoAccess) {
				this.isDiwoAccess = true;
			} else {
				this.isDiwoAccess = false;
			}
		}

		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}
	createFilterLearnerColumnForm() {
		this.FilterLearnerColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	get f() {
		return this.learnerForm.controls;
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

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [7],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getAllClientList(userClientId) {
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let buyer of res.data) {
					this.learnerListNames.push(buyer.name);
				}
				this.addClientList(res.data);
			}
			this.spinnerService.hide();
		});
	}

	getClientAllLearner(clientId, page, limit) {
		this.spinnerService.show();
		this.learnerService.getClientAllLearners(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.haveTeamSetup = res.haveTeamSetup;

				this.clientAllLearners = [];
				this.clientAllLearners = res.data;
				this.totalCount = res.count;
				for (let learner of res.data) {
					let payload = learner;
					let jobrole = [];
					if (learner.User.Client_job_roles.length > 0) {
						for (let role of learner.User.Client_job_roles) {
							jobrole.push(role.job_role_name);
						}
						payload.job_role = jobrole.toString();
					} else {
						payload.job_role = '-';
					}
				}
				this.isDataLoaded = true;
				this.isApiCall = false;
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
			} else {
				this.isDataLoaded = true;
				this.isApiCall = false;
				this.spinnerService.hide();
			}
		});
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.selectedLearnerIds = [];
			this.clientAllLearners.forEach((element, index) => {
				// if (!this.selectedLearnerIds.includes(element.User.id))
				this.selectedLearnerIds.push({
					UserId: element.UserId,
					RoleId: element.RoleId,
					ClientId: element.ClientId,
					Status: element.User.cStatus,
					forDrip: element.User.forDrip,
					forDiwo: element.User.forDiwo,
				});
				let value = <any>(
					document.getElementById('checkbox-' + element.UserId + '-' + element.RoleId + '-' + element.ClientId)
				);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.clientAllLearners.forEach((element, index) => {
				// this.selectedLearnerIds.push(element.User.id);
				// let indexof = this.selectedLearnerIds.indexOf(element.User.id);
				// if (indexof > -1) {
				//     this.selectedLearnerIds.splice(indexof, 1);
				// }
				let value = <any>(
					document.getElementById('checkbox-' + element.UserId + '-' + element.RoleId + '-' + element.ClientId)
				);
				value.checked = false;
			});
			this.selectedLearnerIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		let indexNo = -1;
		for (let i = 0; i < this.selectedLearnerIds.length; i++) {
			if (
				this.selectedLearnerIds[i].UserId == item.UserId &&
				this.selectedLearnerIds[i].RoleId == item.RoleId &&
				this.selectedLearnerIds[i].ClientId == item.ClientId
			) {
				indexNo = i;
			}
		}
		if (indexNo > -1) {
			this.selectedLearnerIds.splice(indexNo, 1);
			let value = <any>document.getElementById('checkbox-' + item.UserId + '-' + item.RoleId + '-' + item.ClientId);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedLearnerIds.push({
				UserId: item.UserId,
				RoleId: item.RoleId,
				ClientId: item.ClientId,
				Status: item.User.cStatus,
				forDrip: item.User.forDrip,
				forDiwo: item.User.forDiwo,
			});
			let value = <any>document.getElementById('checkbox-' + item.UserId + '-' + item.RoleId + '-' + item.ClientId);
			value.checked = true;
		}
		if (this.selectedLearnerIds.length == this.clientAllLearners.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedLearnerIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	addClientList(learnerList) {
		this.learnerList = [];
		let userLearner = JSON.parse(localStorage.getItem('client')) || null;
		this.learnerList.push(userLearner);
		for (let client of learnerList) {
			this.learnerList.push(client);
		}
		this.selectedLearner = this.learnerList[0];
		if (this.learnerList && this.learnerList.length > 0) {
			this.selectedLearnerName = this.learnerList[0].name;
			// this.getClientAllLearner(this.selectedLearner.id);
		}
	}

	getChildClientList(parentClientId) {
		this.clientsService.getAllChildClient(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.job_role = [];
				this.job_role.push(this.userLearner);
				for (let client of res.data) {
					this.job_role.push(client);
				}
			}
		});
	}

	// selectedChildClient(selectedLearner, index) {
	//   if (selectedLearner.id != this.userLearner.id) {
	//     this.userLearnerRoleForm[index].clientId = selectedLearner.id;
	//     this.getAllLastClientList();
	//   } else {
	//     this.userLearnerRoleForm[index].clientId = selectedLearner.id;
	//     this.getAllLastClientList();
	//   }
	// }

	getCustomFieldByClient() {
		this.learnerService.getCustomFieldsByClientId(this.userClientId).subscribe((res: any) => {
			if (res.data.length > 0) {
				for (let i = 0; i < res.data.length; i++) {
					let item = res.data[i];
					if (item.dataType == 'Dropdown select' && !item.isHide) {
						this.FilterColumnArray = [...this.FilterColumnArray, { label: item.label, value: item.label }];
					}
				}

				this.FilterLearnerColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
				this.allLength = this.FilterLearnerColumnForm.value.FilterColumn.length;
			}
		});
	}

	changeClientForLearnerRole(event, editFlag = false, customData = {}) {
		let payload = {
			ClientId: [this.learnerForm.controls['clientIdForLearnerRole'].value],
		};
		if (event?.ClientTeamSetups?.length > 0) {
			this.showTeamId = true;
		} else {
			if (!editFlag) {
				this.learnerForm.controls['team_id'].setValue(null);
			}
			this.showTeamId = false;
		}
		if (payload.ClientId) {
			this.learnerService.getJobRoleByClientId(payload).subscribe((res: any) => {
				if (res.success) {
					this.job_role = [];
					this.job_role = res.data;
				}
			});
			this.checkWhatsAppSetupStatus(payload.ClientId[0]);

			//get Custom Fields
			this.learnerService.getCustomFieldsByClientId(payload.ClientId).subscribe((res: any) => {
				if (res.success) {
					this.setCustiomFieldValidation(res, editFlag, customData);
				}
			});
		}

		let data;
		if (event && event[0]) {
			data = event[0];
		} else {
			data = event;
		}

		//unification
		if (this.type == 'diwo') {
			if (event && data.DripAccess) {
				this.isDripAccess = true;
			} else {
				this.isDripAccess = false;
			}
		} else if (this.type == 'drip') {
			if (event && data.DiwoAccess) {
				this.isDiwoAccess = true;
			} else {
				this.isDiwoAccess = false;
			}
		}
	}

	setCustiomFieldValidation(data, editFlag = false, customData = {}) {
		if (data.data.length > 0) {
			let customFields = [];

			for (let field of data.data) {
				let fieldObj = {
					name: field.label,
					title: field.label,
					isRequired: field.isRequired,
					requiredErrorText: field.label + ' is required',
				};

				if (editFlag && customData != null && customData != '' && field.label in customData) {
					fieldObj['defaultValue'] = customData[field.label];
				}
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
						// fieldObj['minLength'] = parseInt(field.minCharLimit);
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
						// fieldObj['inputType'] = 'textarea';
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

					// datePickerCustomFieldValidationList = [
					// 	{ id: 1, value: 'Any Date' },
					// 	{ id: 2, value: 'Future Date Only' },
					// 	{ id: 3, value: 'Past Date Only' },
					// 	{ id: 4, value: 'Specific Date Range' },
					// ];
					// customFieldEditIndex = 0;

					// futureDateValidationList = [
					// 	{ id: 1, value: 'Any future date' },
					// 	{ id: 2, value: 'Any date after buffer time' },
					// 	{ id: 2, value: 'Any date in a rolling date range' },
					// ];

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
					// options
					// "showNoneItem": true,
					// "showOtherItem": true,
					// "colCount": 1,
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
					// fieldObj['colCount'] = 1;
					fieldObj['choices'] = [];
					for (let option of field.options) {
						if (!option.isHide) {
							fieldObj['choices'].push(option.label);
						}
					}
				}

				customFields.push(fieldObj);
			}
			// console.log('customData', customFields);

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
	}

	showCustomFields() {
		this.surveyModel = new Model(this.surveyObject);
		this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}

	clearSurveyForm() {
		this.surveyObject = {
			elements: [],
		};
		this.surveyModel = new Model(this.surveyObject);
		// this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		// this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}
	entryCustomField(survey = null, options = null) {
		if (this.checkSurveyValidation) {
			this.surveyModel.validatePage();
		}
	}
	checkWhatsAppSetupStatus(clientId) {
		this.learnerService.getWhatsAppSetupByclientId(clientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.noWhastAppSetup = true;
				} else {
					this.noWhastAppSetup = false;
					this.learnerForm.controls['haveWhatsAppOptIn'].setValue(false);
				}
			}
		});
	}

	getAllLastClientList() {
		let parentClientId = [];
		parentClientId.push(this.userClientId);
		let payload = {
			parentClientId: parentClientId,
		};
		this.learnerService.getAllLastClientList(payload).subscribe((res: any) => {
			if (res.success) {
				this.lastLevelClientList = [];
				this.lastLevelClientList = res.data;
			}
		});
	}

	getMarketList() {
		this.appService.getAllMarket().subscribe(
			(res: any) => {
				if (res.success) {
					this.MarketList = res.data;
				}
			},
			(error) => {}
		);
	}

	getLearnersMarket() {
		let country = JSON.parse(localStorage.getItem('user')).user.country;
		this.appService.getUsersMarket(country).subscribe(
			(res: any) => {
				if (res.success) {
					localStorage.setItem('userMarket', JSON.stringify(res.data));
				}
			},
			(error) => {}
		);
	}

	ngAfterViewInit() {
		$('.detailInfo').hide();
		$('.ti-minus').hide();
		$('.ti-plus').show();

		this.spinnerService.show();
		this.getLearnerMenu();
	}

	openInfo(fa) {
		$('.detailInfo').toggle();
		$('.ti-plus').toggle();
		$('.ti-minus').toggle();
	}

	goLearnerProfile(learnerId, toRoute) {
		localStorage.setItem('activeLearnerProfileId', learnerId);
		// if (toRoute) {
		//   this.router.navigate(['learner-user/', learnerId])
		// }
	}

	redirctToAddAccountPage() {
		this.router.navigate(['clients/add-or-edit-client']);
	}

	languages() {
		this.appService.getLanguages().subscribe((res: any) => {
			if (res.success) {
				this.languageList = res.data;
			} else {
				this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
			}
		});
	}

	countries() {
		this.appService.getCountries().subscribe((res: any) => {
			if (res.success) {
				this.allCountryList = res.data;
			} else {
				this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
			}
		});
	}

	changeCountry(countryName) {
		for (let country of this.allCountryList) {
			if (country.name == countryName) {
				this.selectedCountry = country;
				this.provinces = country.Provinces;
				this.phoneCode = country.callingCode;
				this.learnerForm.controls['CountryId'].setValue(country.id);
				this.learnerForm.controls['CalligCode'].setValue(country.callingCode);
				this.mobilePost(false);
				break;
			}
		}
	}

	checkzipcode(zipcode, cnt) {
		zipcode = zipcode + '';
		let Regex;
		let country = this.allCountryList.find((country) => country.name == cnt);
		for (let i in zipcodeRegex) {
			if (zipcodeRegex[i].ISO == country.countryCode) {
				Regex = zipcodeRegex[i].Regex;
				break;
			}
		}
		if (Regex.length > 0) {
			if (zipcode.match(Regex)) return true;
			else {
				return false;
			}
		} else {
			return true;
		}
	}

	saveLearner() {
		this.checkSurveyValidation = true;
		if (this.learnerForm.invalid || !this.surveyModel.validatePage()) {
			this.markAsTouched(this.learnerForm);
			return;
		}
		this.checkSurveyValidation = false;

		if (!this.mobilePost(false)) {
			console.log('----------InValid Mobile Number----------');
			return;
		}

		// let zipvalidation = this.checkzipcode(this.learnerForm.value.zipCode, this.learnerForm.value.country);
		// if (!zipvalidation) {
		//   this.toastr.error(this.appService.getTranslation('Utils.zipcode'),this.appService.getTranslation('Utils.error'));
		//   return;
		// }

		// for (let client of this.userLearnerRoleForm) {
		//   if (client.role.length <= 0 || client.clientId == '' || client.clientId == null) {
		//     this.toastr.error("Please select Parent Client and Learner Role.", this.appService.getTranslation('Utils.error'));
		//     return;
		//   }
		// }

		let payload = {
			userDetails: {
				first: this.learnerForm.controls['first'].value,
				last: this.learnerForm.controls['last'].value,
				email: this.learnerForm.controls['email'].value,
				phone: this.learnerForm.controls['phone'].value,
				// type:'Admin',
				city: this.learnerForm.controls['city'].value,
				state: this.learnerForm.controls['state'].value,
				zipCode: this.learnerForm.controls['zipCode'].value,
				country: this.learnerForm.controls['country'].value,
				CountryId: this.learnerForm.controls['CountryId'].value,
				job_role_id: this.learnerForm.controls['job_role_id'].value,
				clientId: this.learnerForm.controls['clientIdForLearnerRole'].value,
				tags: this.learnerForm.controls['tags'].value,
				username: this.learnerForm.controls['username'].value,
				haveWhatsAppOptIn: this.learnerForm.controls['haveWhatsAppOptIn'].value,
				triggerOptInMsg: this.learnerForm.controls['triggerOptInMsg'].value,
				haveEmailPer: this.learnerForm.controls['haveEmailPer'].value,
				forDrip: this.type == 'drip' ? true : false,
				forDiwo: this.type == 'diwo' ? true : false,
				groupId: this.learnerForm.controls['groupId'].value,
				team_id: this.learnerForm.controls['team_id'].value,
			},

			// clientDetails: this.userLearnerRoleForm,
			// clientIdForLearnerRole: this.learnerForm.controls['clientIdForLearnerRole'].value
		};

		// if(this.surveyObject.elements.length > 0){
		payload.userDetails['customFields'] = this.surveyModel.data;
		// }

		this.spinnerService.show();
		if (this.learnerForm.value.id == null) {
			this.learnerService.createLearner(payload).subscribe(
				(res: any) => {
					this.spinnerService.hide();
					if (res.success) {
						this.appService.checkNotifcation = true;
						// if (localStorage.getItem('role') == 'Global Super Admin' || localStorage.getItem('role') == 'Global Admin') {
						//   this.toastr.success('New user successfully created!', "Success!");
						// } else {
						//   this.toastr.success("Thank You! Request raised.", "Success!");
						// }
						this.toastr.success(
							this.appService.getTranslation(
								this.type === 'drip'
									? 'Pages.Learners.AddEdit.Toaster.Contactcreated'
									: 'Pages.Learners.AddEdit.Toaster.learnercreated'
							),
							this.appService.getTranslation('Utils.success')
						);
						if (res && res.validlicenseForUnification == false) {
							this.toastr.warning(
								this.appService.getTranslation(
									this.type === 'drip'
										? 'Pages.Learners.Home.Toaster.validlicenseContact'
										: 'Pages.Learners.Home.Toaster.validlicense'
								),
								this.appService.getTranslation('Utils.warning')
							);
						}

						this.learnerForm.reset();
						this.getClientAllLearner(this.userClientId, this.page, this.limit);
						this.userLearnerRoleForm = [];
						this.checkSurveyValidation = false;
						$('#addLearnerModal').modal('hide');
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				},
				(error) => {
					this.spinnerService.hide();
				}
			);
		} else {
			this.learnerService.updateLearner(this.learnerForm.value.id, payload).subscribe(
				(res: any) => {
					this.spinnerService.hide();
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.toastr.success(
							this.appService.getTranslation(
								this.type === 'drip'
									? 'Pages.Learners.AddEdit.Toaster.Contactupdated'
									: 'Pages.Learners.AddEdit.Toaster.learnerupdated'
							),
							this.appService.getTranslation('Utils.success')
						);
						if (res && res.validlicenseForUnification == false) {
							this.toastr.warning(
								this.appService.getTranslation(
									this.type === 'drip'
										? 'Pages.Learners.Home.Toaster.validlicenseContact'
										: 'Pages.Learners.Home.Toaster.validlicense'
								),
								this.appService.getTranslation('Utils.warning')
							);
						}
						// this.getClientAllLearner(this.userClientId, this.page, this.limit);
						if (this.searchKeyData) {
							this.getLearnerByFilter(this.inputSearchTxt);
						} else {
							this.getClientAllLearner(this.userClientId, this.page, this.limit);
						}
						this.learnerForm.reset();
						this.checkSurveyValidation = false;
						$('#addLearnerModal').modal('hide');
					} else {
						this.spinnerService.hide();
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				},
				(error) => {
					this.spinnerService.hide();
				}
			);
		}
	}

	editLearner(editLearner) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.learnerForm.reset();
			this.learnerForm.patchValue(editLearner.User);
			this.isLearnerLockout = editLearner && editLearner.User.isLockout;
			this.changeCountry(editLearner.User.country);
			// this.learnerForm.controls['haveWhatsAppOptIn'].disable();
			this.learnerForm.controls['triggerOptInMsg'].disable();
			this.learnerForm.controls['country'].disable();
			this.learnerForm.controls['clientIdForLearnerRole'].disable();
			// this.learnerForm.controls['username'].disable();
			$('#addLearnerModal').modal('show');
			this.changeCountry(this.learnerForm.controls['country'].value);
			this.learnerForm.controls['clientIdForLearnerRole'].setValue(editLearner.ClientId);
			this.checkSurveyValidation = true;
			this.changeClientForLearnerRole(editLearner.Client, true, editLearner.User.customFields);

			if (editLearner.User.Client_job_roles && editLearner.User.Client_job_roles.length > 0) {
				this.learnerForm.controls['job_role_id'].setValue(
					editLearner.User.Client_job_roles[0].User_job_role_mapping.ClientJobRoleId
				);
			}
			this.checkWhatsAppSetupStatus(editLearner.ClientId);
			this.getLearnerGroupByLearnerId(editLearner.User.id, editLearner.ClientId);
		}
	}

	getBranchClientList() {
		this.clientsService.getAllBranchClient(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.branchClientList = [];
				// this.job_role.push(this.userLearner);
				for (let client of res.data) {
					this.branchClientList.push(client);
				}
			}
		});
	}

	changeLearner(item: any) {
		this.selectedBranchClientId = item.id;
	}

	moveLearner(data: any) {
		this.selectedLearnerIdForMove = this.selectedLearnerIds;
		if (this.selectedLearnerIdForMove) {
			$('#moveLearnerModal').modal('show');
		}
	}

	optin() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedLearnerIdForOptIn = this.selectedLearnerIds;
			if (this.selectedLearnerIdForOptIn) {
				this.onOptInSubmit();
			}
		}
	}

	onOptInSubmit() {
		let payload_ = {
			Users: this.selectedLearnerIdForOptIn,
		};
		let clientIds = [];
		for (let learner of this.selectedLearnerIdForOptIn) {
			clientIds.push(learner.ClientId);
		}
		if (clientIds.length > 0) {
			let payload = {
				ClientIds: clientIds,
			};
			this.learnerService.checkWhatsAppSetup(payload).subscribe((res: any) => {
				if (res.success) {
					if (res.canOptIn) {
						this.learnerService.optinSelectedUser(payload_).subscribe((res: any) => {
							if (res.success) {
								this.selectedLearnerIds = [];
								this.toastr.success(
									this.appService.getTranslation(
										this.type === 'drip'
											? 'Pages.Learners.Home.Toaster.optinContact'
											: 'Pages.Learners.Home.Toaster.optin'
									),
									this.appService.getTranslation('Utils.success')
								);
								this.getClientAllLearner(this.userClientId, this.page, this.limit);
							}
						});
					} else {
						$('#OptInLearnerModal').modal('show');
					}
				}
			});
		}
	}
	onSubmitMoveLearner() {
		this.learnerService
			.moveLearnerToBranchAccount(this.selectedLearnerIdForMove, this.selectedBranchClientId, this.userClientId)
			.subscribe(
				(res: any) => {
					setTimeout(() => {
						this.spinnerService.hide();
					}, 300);
					if (res.success) {
						this.selectedLearnerIdForMove = null;
						this.appService.checkNotifcation = true;
						this.toastr.success(
							this.appService.getTranslation(
								this.type === 'drip' ? 'Pages.Learners.Home.Toaster.movedContact' : 'Pages.Learners.Home.Toaster.moved'
							),
							this.appService.getTranslation('Utils.success')
						);
						this.selectedLearnerIds = [];
						$('#moveLearnerModal').modal('hide');
						this.getClientAllLearner(this.userClientId, this.page, this.limit);
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
						$('#moveLearnerModal').modal('hide');
					}
				},
				(error) => {}
			);
	}

	cancelMoveLearnerModal() {
		$('#moveLearnerModal').modal('hide');
	}

	addLearner() {
		// this.learnerService.getLearnerCountRestrict(this.userClientId).subscribe((res: any) => {
		//   if (res.success) {
		//     this.checkCount = res.data
		//   }
		//   if (this.checkCount == false) {
		//     this.toastr.warning('You do not have valid license for additional leaners. Please archive existing learners or upgrade your license.!', "Warning!");
		//   } else {
		//     this.userLearnerRoleForm = [];
		//     let payload = {
		//       role: null,
		//       clientId: null
		//     }
		//     this.userLearnerRoleForm.push(payload);
		//     this.learnerForm.reset();
		//     $('#addLearnerModal').modal('show');
		//   }
		// });

		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.userLearnerRoleForm = [];
			let payload = {
				role: null,
				clientId: null,
			};
			this.userLearnerRoleForm.push(payload);
			this.learnerForm.controls['country'].enable();
			this.learnerForm.controls['clientIdForLearnerRole'].enable();
			// this.learnerForm.controls['username'].enable();
			this.learnerForm.reset();
			this.phoneCode = null;
			$('#addLearnerModal').modal('show');
			this.clearSurveyForm();
			setTimeout(() => {
				if (this.lastLevelClientList.length == 1) {
					this.learnerForm.controls['clientIdForLearnerRole'].setValue(this.lastLevelClientList[0].id);
					this.changeClientForLearnerRole(this.lastLevelClientList, false, {});
				}
			}, 100);
		}
	}

	cancel() {
		this.phoneFlag = false;
		this.emailFlag = false;
		this.checkSurveyValidation = false;
		$('#addLearnerModal').modal('hide');
		this.learnerForm.reset();
		this.userLearnerRoleForm = [];
		//this.learnerForm.controls['country'].setValue(environment.countryName);
		this.learnerForm.controls['state'].setValue('');
	}

	cancelArchiveLearnerModal() {
		$('#archiveLearnerModal').modal('hide');
	}
	canceldeleteLearnerModal() {
		$('#deleteLearnerModal').modal('hide');
	}

	cancelOptInLearnerModal() {
		$('#OptInLearnerModal').modal('hide');
	}

	canceldripdiwoLearnerModal() {
		$('#createDripDiwoLearner').modal('hide');
	}

	getLearnerMenu() {
		if (localStorage.getItem('user')) {
			this.learnerData = JSON.parse(localStorage.getItem('user')).user;
			try {
				this.allowWrite = false;
				this.allowRead = false;
				var res = JSON.parse(localStorage.getItem('menupermission')) || null;
				res.forEach((d) => {
					if (d.permission == 'RW' && d.module_code == 'MU') {
						this.allowWrite = true;
						this.allowRead = true;
					} else if (d.permission == 'R' && d.module_code == 'MU') {
						this.allowWrite = false;
						this.allowRead = true;
					}
				});
			} catch (error) {}
		}
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getLearnerByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getLearnerByFilter(this.inputSearchTxt);
		} else {
			this.getClientAllLearner(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getLearnerByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getLearnerByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getLearnerByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
			}
		}
	}

	getAllLearners(pageCount, limit) {
		this.spinnerService.show();
		this.learnerService.getLearners(pageCount, limit, this.selectedMarket).subscribe(
			(res: any) => {
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
				let varebale = document.getElementById('reve-chat-container-div');
				if (varebale) {
					varebale.style.display = 'none';
				}
				if (res.success) {
					this.learnersList = res.data;
					this.totalLearnerCount = res.count;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			},
			(error) => {}
		);
	}

	changeMarket(market) {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		localStorage.setItem('userMarket', JSON.stringify(market));
		localStorage.setItem('AdminSelectedMarket', JSON.stringify(market));
		this.marketHasRMode = market.is_rmode;
		if (this.marketHasRMode && this.marketHasRMode == true) {
			this.regionalLanguageList = market.regional_languages;
		}
		let userMarket = market;
		let user = JSON.parse(localStorage.getItem('user')).user;
		this.learnerForm.controls['country'].setValue(userMarket.Countries[0].name);
		this.learnerForm.controls['CountryId'].setValue(userMarket.Currency.CountryId);
		this.addLearnerCountry = userMarket.Countries;
		let country = this.countryList.find((country) => country.name == userMarket.Countries[0].name);
		let countryName = country.name;
		this.provinces = country.Provinces;
		this.getAllLearners(this.page, this.limit);
	}

	changeClient(client) {
		// this.getClientAllLearner(client.id);
	}

	deleteLearner() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedLearnerIdForDelete = this.selectedLearnerIds;
			if (this.selectedLearnerIdForDelete) {
				$('#deleteLearnerModal').modal('show');
			}
		}
	}

	archiveLearner(type) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			// this.archiveUser = data;
			this.isArchive = type;
			this.selectedLearnerIdForarchive = this.selectedLearnerIds;
			if (this.selectedLearnerIdForarchive) {
				$('#archiveLearnerModal').modal('show');
			}
		}
	}

	cretedDripDiwoLearner(type) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedLearnerIdForCreate = this.selectedLearnerIds;
			if (this.selectedLearnerIdForCreate) {
				$('#createDripDiwoLearner').modal('show');
			}
		}
	}

	createDripDiwoLearner;

	getLearnerByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		if (this.FilterLearnerColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterLearnerColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterLearnerColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterLearnerColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterLearnerColumnForm.value.FilterColumn == null) {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: this.selectedDate,
			};
		} else {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: { startDate: null, endDate: null },
			};
		}
		localStorage.setItem('searchLearners', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getClientAllLearner(this.userClientId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > 2) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.learnerService.getFilteredLearners(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						if (res.success) {
							this.haveTeamSetup = res.haveTeamSetup;
							this.clientAllLearners = res.data;
							this.totalCount = res.count;
							for (let learner of res.data) {
								let payload = learner;
								let jobrole = [];
								if (learner.User.Client_job_roles.length > 0) {
									for (let role of learner.User.Client_job_roles) {
										jobrole.push(role.job_role_name);
									}
									payload.job_role = jobrole.toString();
								} else {
									payload.job_role = '-';
								}
							}
							this.isApiCall = false;
							this.isDataLoaded = true;
							setTimeout(() => {
								this.spinnerService.hide();
							}, 300);
						} else {
							this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
							this.spinnerService.hide();
							this.isApiCall = false;
							this.isDataLoaded = true;
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			this.ip_address = JSON.parse(res._body).ip;
		});
	}

	changeRole(role, index) {
		this.userLearnerRoleForm[index].role = role;
	}

	addMoreClient() {
		let payload = {
			role: null,
			clientId: null,
		};
		this.userLearnerRoleForm.push(payload);
	}

	ngOnDestroy() {
		this.spinnerService.hide();
	}

	//Upload Excel Sheet of Learners List

	notPermission() {
		return;
		this.toastr.error(
			this.appService.getTranslation('Utils.unauthorised'),
			this.appService.getTranslation('Utils.error')
		);
	}

	pathExcel(event) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.excelLearnerUpload = undefined;
			let file = event.target.files[0];
			if (file) {
				this.spinnerService.show();
				const uploadData = new FormData();
				uploadData.append('file', file);
				this.appService
					.uploadLearnerUserInBulk(uploadData)
					.toPromise()
					.then(
						(res: any) => {
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation(
									this.type === 'drip'
										? 'Pages.Learners.Home.Toaster.bulkcreatedContact'
										: 'Pages.Learners.Home.Toaster.bulkcreatedlearner'
								),
								this.appService.getTranslation('Utils.success')
							);
							this.holdUploadLearner = true;
							setTimeout(() => {
								this.appService.checkNotifcation = true;
								this.holdUploadLearner = false;
							}, 5000);
							this.getClientAllLearner(this.userClientId, this.page, this.limit);
						},
						(failed) => {
							this.toastr.error(
								this.appService.getTranslation('Utils.somthingwentwrong'),
								this.appService.getTranslation('Utils.error')
							);
							console.log('Rejected', failed);
							this.spinnerService.hide();
						}
					)
					.catch((err) => {
						console.log('Caught error', err);
						this.spinnerService.hide();
					});
			} else {
				this.toastr.error(this.appService.getTranslation('Utils.invalidfile'));
			}
		}
	}

	downloadTemplete() {}

	onStatusFormSubmit() {
		this.spinnerService.show();
		this.learnerService.deleteLearner(this.selectedLearnerIdForDelete, this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.selectedLearnerIdForDelete = null;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
				$('#deleteLearnerModal').modal('hide');
				this.toastr.success(
					this.appService.getTranslation(
						this.type === 'drip'
							? 'Pages.Learners.Home.Toaster.Contactdeleted'
							: 'Pages.Learners.Home.Toaster.learnerdeleted'
					),
					this.appService.getTranslation('Utils.success')
				);
				this.selectedLearnerIds = [];
				this.appService.checkNotifcation = true;
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	onArchiveFormSubmit() {
		this.spinnerService.show();
		let payload = [];
		for (let user of this.selectedLearnerIdForarchive) {
			if (this.isArchive == 'active' && user.Status == 'Unlicensed') {
				payload.push(user);
			} else if (this.isArchive == 'unlicensed' && user.Status == 'Active') {
				payload.push(user);
			}
		}

		this.learnerService.archiveLearner(payload, this.isArchive, this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				this.selectedLearnerIdForarchive = null;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
				$('#archiveLearnerModal').modal('hide');
				if (res.data == 'You do not have valid license!') {
					this.toastr.warning(
						this.appService.getTranslation(
							this.type === 'drip'
								? 'Pages.Learners.Home.Toaster.validlicenseContact'
								: 'Pages.Learners.Home.Toaster.validlicense'
						),
						this.appService.getTranslation('Utils.warning')
					);
				} else if (res.data == 'Learner Successfully Archived!') {
					this.toastr.success(
						this.appService.getTranslation(
							this.type === 'drip'
								? 'Pages.Learners.Home.Toaster.Contactarchived'
								: 'Pages.Learners.Home.Toaster.learnerarchived'
						),
						this.appService.getTranslation('Utils.success')
					);
				} else if (res.data == 'Learner Successfully Activated!') {
					this.toastr.success(
						this.appService.getTranslation(
							this.type === 'drip'
								? 'Pages.Learners.Home.Toaster.Contactactivated'
								: 'Pages.Learners.Home.Toaster.learneractivated'
						),
						this.appService.getTranslation('Utils.success')
					);
				}
				if (this.isArchive === 'unlicensed') this.appService.checkNotifcation = true;
				this.selectedLearnerIds = [];
			} else {
				this.spinnerService.hide();
			}
		});
	}

	mobilePost(flag) {
		console.log('-------Flag--', flag);
		// if (this.isMobileCompulsory == false) {
		// var pattern = /^[6,7,8,9][0-9]{9}$/;
		// let mob: any = parseInt(event.target.value);
		// 	if (event.target.value.length != 0) {
		// 		if (!pattern.test(mob)) {
		// 			this.learnerForm.controls['phone'].setErrors({ invalid: true });
		// 		} else {
		// 			this.learnerForm.controls['phone'].markAsTouched({ onlySelf: true });
		// 		}
		// 	} else {
		// 		this.learnerForm.controls['phone'].markAsTouched({ onlySelf: true });
		// 	}
		// }

		// console.log('mobilePost', event);
		// console.log('User Phone', this.learnerForm.controls['phone'].value);
		// console.log('User Country', this.learnerForm.controls['country'].value);
		// console.log(this.learnerForm.controls['CalligCode'].value);
		// let userPhone = this.learnerForm.controls['CalligCode'].value + this.learnerForm.controls['phone'].value;
		// console.log('userPhone', userPhone);

		//Need to Find the Callinf Code by using country
		//flag == false
		if (
			(this.learnerForm.controls['country'].value && flag == true) ||
			(flag == false && this.learnerForm.controls['phone'].value)
		) {
			var pattern = /^[6,7,8,9][0-9]{9}$/;
			let mob: any = parseInt(this.learnerForm.controls['phone'].value);
			let userPhone = '';
			let CountryCode;
			for (let country of this.allCountryList) {
				if (country.name == this.learnerForm.controls['country'].value) {
					userPhone = country.callingCode + this.learnerForm.controls['phone'].value;
					CountryCode = country.countryCode;
					break;
				}
			}
			if (isValidPhoneNumber(userPhone, CountryCode) === false || (CountryCode == 'IN' && !pattern.test(mob))) {
				if (this.learnerForm.controls['phone'].value.length == 0 && this.isMobileCompulsory === false) {
					this.learnerForm.controls['phone'].setErrors(null);
					return true;
				} else {
					this.learnerForm.controls['phone'].setErrors({ invalid: true });
					return false;
				}
			} else {
				this.learnerForm.controls['phone'].setErrors(null);
				return true;
			}
		} else {
			return true;
		}
	}

	onCreateDripDiwoSubmit() {
		this.spinnerService.show();

		let payload = [];
		for (let user of this.selectedLearnerIdForCreate) {
			if (this.type == 'drip' && user.forDiwo == false) {
				payload.push(user);
			} else if (this.type == 'diwo' && user.forDrip == false) {
				payload.push(user);
			}
		}

		this.learnerService.createDripDiwoLearner(payload, this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.selectedLearnerIdForCreate = null;
				this.getClientAllLearner(this.userClientId, this.page, this.limit);
				$('#createDripDiwoLearner').modal('hide');
				this.toastr.success(
					this.appService.getTranslation(
						this.type === 'drip'
							? 'Pages.Learners.Home.Toaster.contactcreated'
							: 'Pages.Learners.Home.Toaster.learnercreated'
					),
					this.appService.getTranslation('Utils.success')
				);
				if (res && res.validlicenseForUnification == false) {
					this.toastr.warning(
						this.appService.getTranslation(
							this.type === 'drip'
								? 'Pages.Learners.Home.Toaster.validlicenseContact'
								: 'Pages.Learners.Home.Toaster.validlicense'
						),
						this.appService.getTranslation('Utils.warning')
					);
				} else {
					this.appService.checkNotifcation = true;
				}

				this.selectedLearnerIds = [];
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	checkUploadLearnerData() {
		this.learnerService.checkUploadLearnerData(this.roleId, this.userId, this.userClientId).subscribe(
			(res: any) => {
				if (res.success) {
					if (res.status == true) {
						this.isDownload = true;
					} else {
						this.isDownload = false;
					}
				}
			},
			(error) => {}
		);
	}

	downloadUploadedLearnerData() {
		this.learnerService.getUploadLearnerData(this.roleId, this.userId, this.userClientId).subscribe(
			async (res: any) => {
				if (res.success) {
					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Leraner Users CSV',
						useBom: false,
						noDownload: false,
						headers: [
							'First Name',
							'Last Name',
							'Email',
							'Mobile',
							'Country',
							'State',
							'City',
							'Zip Code',
							'Branch Id',
							'Job Role',
							'EmailInvalid',
							'PhoneInvalid',
							'EmailExits',
							'PhoneExits',
							'ErrorMessage',
							'Error',
							'jobRoleErr',
						],
					};
					res.data = await this.appService.sanitizedData(res.data);
					const fileInfo = new ngxCsv(res.data, this.formula, options);
				}
			},
			(error) => {}
		);
	}

	canceldnotFooundWhatsAppSetupModal() {
		$('#notFooundWhatsAppSetupModal').modal('hide');
	}

	changeToggleValue() {
		// console.log('-changeToggleValue--');
		if (!this.noWhastAppSetup) {
			$('#notFooundWhatsAppSetupModal').modal('show');
			this.learnerForm.controls['triggerOptInMsg'].setValue(false);
			this.learnerForm.controls['haveWhatsAppOptIn'].setValue(false);
		}
	}

	emailValidation($event) {
		if (this.isEmailCompulsory == false) {
			this.emailWhenNotCompulsory($event);
		} else {
			this.addEmail($event.target.value);
		}
	}

	emailWhenNotCompulsory($event) {
		let email = $event.target.value;
		if ($event.target.value.length != 0) {
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
					this.learnerForm.controls['email'].setValue(email.trim());
					this.emailError = false;
					return true;
				} else {
					this.learnerForm.controls['email'].setErrors({ pattern: true });
					this.emailError = true;
					return false;
				}
			} else {
				this.learnerForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.learnerForm.controls['email'].markAsTouched({ onlySelf: true });
			this.emailError = false;
			return true;
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
				this.learnerForm.controls['email'].setValue(email.trim());
				this.emailError = false;
				return true;
			} else {
				this.learnerForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.learnerForm.controls['email'].setErrors({ pattern: true });
			this.emailError = true;
			return false;
		}
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	downloadLearners() {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.downloadLearnersWithLimit(1, this.learnerLimt);
	}

	downloadLearnersWithLimit(page, limit) {
		this.learnerService.downloadallLearners(page, limit).subscribe(async (res: any) => {
			if (res.success) {
				if (res.data && res.data.length > 0) {
					this.learnerListForDownload = this.learnerListForDownload.concat(res.data);
					this.downloadLearnersWithLimit(page + 1, limit);
				} else {
					let hearder = [];
					let customField = [];
					if (this.type === 'drip') {
						hearder = [
							'Sr. No',
							'First Name',
							'Last Name',
							'Email',
							'Mobile',
							...(this.appService?.configurable_feature?.pwa_username ? ['Username'] : []),
							'Country',
							'State',
							'City',
							'Zip Code',
							'Tags',
							'Parent Id',
							'Parent Account',
							'Job Role',
							'Contact Id',
							'WhatApp Opt In',
							'WhatsApp Permission',
							'Email Permission',
							'Status(Licensed/Unlicensed)',
							'Added Date',
							'Contact Group Id',
							'Team User Id',
							'First Login',
							'Last Login',
							'Action(Edit/Delete/Unchange)',
						];
					} else {
						hearder = [
							'Sr. No',
							'First Name',
							'Last Name',
							'Email',
							'Mobile',
							...(this.appService?.configurable_feature?.pwa_username ? ['Username'] : []),
							'Country',
							'State',
							'City',
							'Zip Code',
							'Tags',
							'Parent Id',
							'Parent Account',
							'Job Role',
							'Learner Id',
							// 'WhatApp Opt In',
							// 'WhatsApp Permission',
							// 'Email Permission',
							'Status(Licensed/Unlicensed)',
							'Added Date',
							'Learner Group Id',
							'First Login',
							'Last Login',
							'Spot Registration',
							'Provisionally Registered',
							'Action(Edit/Delete/Unchange)',
						];
					}

					if (this.learnerListForDownload.length > 0 && this.learnerListForDownload[0].User.customFields) {
						for (let key in this.learnerListForDownload[0].User.customFields) {
							hearder.push(key);
							customField.push(key);
						}
					}

					let finalDataDiwo = [];
					let finalDataDrip = [];
					if (this.learnerListForDownload.length > 0) {
						let count = 0;
						for (let learner of this.learnerListForDownload) {
							let item = learner;
							let jobrole = [];
							if (item.User.Client_job_roles.length > 0) {
								for (let role of item.User.Client_job_roles) {
									jobrole.push(role.job_role_name);
								}
								item.job_role = jobrole.toString();
							} else {
								item.job_role = ' ';
							}

							if (!item.User.opt_in && !item.User.opt_out) {
								item.optinstatus = 'Pending';
							} else if (item.User.opt_in && !item.User.opt_out) {
								item.optinstatus = 'Opted In';
							} else if (!item.User.opt_in && item.User.opt_out) {
								item.optinstatus = 'Opted Out';
							}

							count++;
							let payloadDiwo = {
								'Sr. No': count,
								'First Name': item.User.first ? item.User.first : '',
								'Last Name': item.User.last ? item.User.last : '',
								Email: item.User.email ? item.User.email : '',
								Mobile: item.User.phone ? item.User.phone : '',
								...(this.appService?.configurable_feature?.pwa_username && {
									username: item.User.username ? item.User.username : '',
								}),
								Country: item.User.country ? item.User.country : '',
								State: item.User.state ? item.User.state : '',
								City: item.User.city ? item.User.city : '',
								'Zip Code': item.User.zipCode ? item.User.zipCode : '',
								Tags: item.User.tags ? item.User.tags : ' ',
								'Parent Id': item && item.Client && item.Client.client_id ? item.Client.client_id : '',
								'Parent Account': item.Client.name ? item.Client.name : '',
								'Job Role': item.job_role,
								'Learner Id': item.User.account_id ? item.User.account_id : '',
								// 'WhatApp Opt In': item.optinstatus,
								// 'WhatsApp Permission': item.User.haveWhatsAppOptIn != null ? item.User.haveWhatsAppOptIn : '',
								// 'Email Permission': item.User.haveEmailPer != null ? item.User.haveEmailPer : '',
								'Status(Licensed/Unlicensed)':
									item.User.cStatus == 'Active' ? 'Licensed' : item.User.cStatus == 'Unlicensed' ? 'Unlicensed' : '',
								'Added Date': item.createdAt ? ' ' + moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
								'Learner Group Id': item.learnerGroupIds ? item.learnerGroupIds : '',
								'First Login': item.User.firstLogin
									? ' ' + moment(item.User.firstLogin).format('YYYY-MM-DD HH:mm:ss')
									: '',
								'Last Login': item.User.lastLogin
									? ' ' + moment(item.User.lastLogin).format('YYYY-MM-DD HH:mm:ss')
									: '',
								'Spot Registration': item.User.spotReg ? item.User.spotReg : '',
								'Provisionally Registered': item.User.isLeanerSpotReg,

								'Action(Edit/Delete/Unchange)': 'Unchange',
							};

							// payloadDiwo = { ...payloadDiwo, ...item.User.customFields };

							let payloadDrip = {
								'Sr. No': count,
								'First Name': item.User.first ? item.User.first : '',
								'Last Name': item.User.last ? item.User.last : '',
								Email: item.User.email ? item.User.email : '',
								Mobile: item.User.phone ? item.User.phone : '',
								...(this.appService?.configurable_feature?.pwa_username && {
									username: item.User.username ? item.User.username : '',
								}),
								Country: item.User.country ? item.User.country : '',
								State: item.User.state ? item.User.state : '',
								City: item.User.city ? item.User.city : '',
								'Zip Code': item.User.zipCode ? item.User.zipCode : '',
								Tags: item.User.tags ? item.User.tags : ' ',
								'Parent Id': item && item.Client && item.Client.client_id ? item.Client.client_id : '',
								'Parent Account': item.Client.name ? item.Client.name : '',
								'Job Role': item.job_role,
								'Contact Id': item.User.account_id ? item.User.account_id : '',
								'WhatApp Opt In': item.optinstatus,
								'WhatsApp Permission': item.User.haveWhatsAppOptIn != null ? item.User.haveWhatsAppOptIn : '',
								'Email Permission': item.User.haveEmailPer != null ? item.User.haveEmailPer : '',
								'Status(Licensed/Unlicensed)':
									item.User.cStatus == 'Active' ? 'Licensed' : item.User.cStatus == 'Unlicensed' ? 'Unlicensed' : '',
								'Added Date': item.createdAt ? ' ' + moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
								'Contact Group Id': item.learnerGroupIds ? item.learnerGroupIds.toString() : '',
								'Team User Id': item.User.team_id ? item.User.team_id : '',
								'First Login': item.User.firstLogin
									? ' ' + moment(item.User.firstLogin).format('YYYY-MM-DD HH:mm:ss')
									: '',
								'Last Login': item.User.lastLogin
									? ' ' + moment(item.User.lastLogin).format('YYYY-MM-DD HH:mm:ss')
									: '',

								'Action(Edit/Delete/Unchange)': 'Unchange',
							};
							// payloadDrip = { ...payloadDrip, ...item.User.customFields };
							for (let key of customField) {
								if (
									item.User.customFields[key] == null ||
									item.User.customFields[key] == undefined ||
									item.User.customFields[key] == ''
								) {
									payloadDiwo[key] = ' ';
									payloadDrip[key] = ' ';
								} else {
									payloadDiwo[key] = item.User.customFields[key];
									payloadDrip[key] = item.User.customFields[key];
								}
							}
							finalDataDrip.push(payloadDrip);
							finalDataDiwo.push(payloadDiwo);
						}
					}

					let optionsDrip = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Contact Download Report',
						useBom: false,
						noDownload: false,
						headers: hearder,
					};

					let optionsDiwo = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Learner Download Report',
						useBom: false,
						noDownload: false,
						headers: hearder,
					};
					if (this.type === 'drip') {
						finalDataDrip = await this.appService.sanitizedData(finalDataDrip);
						const fileInfo = new ngxCsv(finalDataDrip, 'Contact Download Report', optionsDrip);
					} else {
						finalDataDiwo = await this.appService.sanitizedData(finalDataDiwo);
						const fileInfo = new ngxCsv(finalDataDiwo, 'Learner Download Report', optionsDiwo);
					}
				}
			}
		});
	}

	bulkUpdateLearnerPopup() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			$('#LernerbulkUploadpopup').modal('show');
		}
	}

	cancelLernerbulkUploadModal() {
		$('#LernerbulkUploadpopup').modal('hide');
		setTimeout(() => {
			this.isFileSelecteToUpdate = false;
		}, 200);
	}

	SelectFileToUpdateLearner(event) {
		this.excelLearnerUpdate = undefined;
		this.fileToUpdateLearner = event.target.files[0];
		if (this.fileToUpdateLearner) {
			this.isFileSelecteToUpdate = true;
		} else {
			this.toastr.error(this.appService.getTranslation('Utils.invalidfile'));
		}
	}

	bulkUpdateLearner() {
		let file = this.fileToUpdateLearner;
		this.spinnerService.show();
		const uploadData = new FormData();
		uploadData.append('file', file);
		this.appService
			.upLearnerUserInBulk(uploadData)
			.toPromise()
			.then(
				(res: any) => {
					this.spinnerService.hide();
					$('#LernerbulkUploadpopup').modal('hide');
					setTimeout(() => {
						this.isFileSelecteToUpdate = false;
					}, 200);
					this.toastr.success(
						this.appService.getTranslation(
							this.type === 'drip'
								? 'Pages.Learners.Home.Toaster.bulkupdateContact'
								: 'Pages.Learners.Home.Toaster.bulkupdatelearner'
						),
						this.appService.getTranslation('Utils.success')
					);

					setTimeout(() => {
						this.appService.checkNotifcation = true;
					}, 5000);
					this.getClientAllLearner(this.userClientId, this.page, this.limit);
				},
				(failed) => {
					this.toastr.error(
						this.appService.getTranslation('Utils.somthingwentwrong'),
						this.appService.getTranslation('Utils.error')
					);
					console.log('Rejected', failed);
					this.spinnerService.hide();
				}
			)
			.catch((err) => {
				console.log('Caught error', err);
				this.spinnerService.hide();
			});
	}

	downloadUploadTemplate() {
		this.learnerService
			.downloadUploadTemplate()
			.toPromise()
			.then(
				(res: any) => {
					let link = document.createElement('a');
					link.href = window.URL.createObjectURL(res);
					if (this.type == 'drip') {
						link.download = `Contact_Upload_Template.csv`;
					} else if (this.type == 'diwo') {
						link.download = `Learner_Upload_Template.csv`;
					}
					link.click();
					this.toastr.success(
						this.appService.getTranslation('Pages.Learners.Home.Toaster.templateDownload'),
						this.appService.getTranslation('Utils.success')
					);
				},
				(failed) => {
					console.log('Rejected', failed);
					this.spinnerService.hide();
				}
			)
			.catch((err) => {
				console.log('Caught error', err);
				this.spinnerService.hide();
			});
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getLearnerByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getLearnerByFilter(this.inputSearchTxt);
		}
	}

	getLearnerGroupByUserId(userId, clientId, userRoleId) {
		this.learnerService.getLearnerGroupByUserId(userId, clientId, userRoleId, 1, 250).subscribe((res: any) => {
			if (res.success) {
				this.learnerGroupsList = [];
				this.learnerGroupsList = res.data;
				this.learnerGroupsList = [...this.learnerGroupsList];
			}
		});
	}

	getLearnerGroupByLearnerId(LearnerId, clientId) {
		this.learnerService.getLearnerGroupByLearnerId(LearnerId, clientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					const userGroupIds = res.data.map((item) => item.UserGroupId);
					this.learnerForm.controls['groupId'].setValue(userGroupIds);
				}
			}
		});
	}

	checkReserveTagsAndSave() {
		if ([null, '', undefined].indexOf(this.f.tags.value) == -1) {
			this.learnerService
				.checkTagsIsUseOrNotInConversationalFlow({ tags: this.f.tags.value }, this.userClientId)
				.subscribe((res: any) => {
					if (res.success) {
						if (!res.canUse) {
							this.learnerForm.controls['tags'].setValue(res.notUseTags.toString());
							this.toastr.error(res.message);
							return;
						} else {
							this.saveLearner();
						}
					}
				});
		} else {
			this.saveLearner();
		}
	}

	syncTeamSetup() {
		if (this.f.id.value == null) {
			const payload = {
				ClientId: this.f.clientIdForLearnerRole.value,
				email: this.f.email.value,
			};
			this.learnerService.checkAndGetTeamUserIdByUsingEmail(payload).subscribe((res: any) => {
				if (res.success) {
					this.learnerForm.controls['team_id'].enable();
					if (res?.teamUserId) {
						this.learnerForm.controls['team_id'].setValue(res.teamUserId);
					} else if (res?.message) {
						this.learnerForm.controls['team_id'].setValue(res.message);
					}
					this.learnerForm.controls['team_id'].disable();
				}
			});
		}
	}

	teamSync() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedLearnerIdForTeamSync = this.selectedLearnerIds;
			if (this.selectedLearnerIdForTeamSync) {
				this.learnerService.teamSync(this.selectedLearnerIdForTeamSync).subscribe((res: any) => {
					if (res.success) {
						this.toastr.success(
							this.appService.getTranslation('Pages.Learners.Home.Toaster.teamSync'),
							this.appService.getTranslation('Utils.success')
						);
						this.selectedLearnerIds = [];
						this.selectedLearnerIdForTeamSync = [];
						this.appService.checkNotifcation = true;
						this.getClientAllLearner(this.userClientId, this.page, this.limit);
					}
				});
			}
		}
	}

	triggerFileInput() {
		//Check Before Trigger
		if (this.holdUploadLearner) {
			this.toastr.warning(this.appService.getTranslation('Pages.Learners.Home.Toaster.waitForPreviousProcess'));
			return;
		}
		this.learnerService.checkPreviousLearnerUploadStatus().subscribe((res: any) => {
			if (res.success) {
				if (res.canUploadLearner) {
					this.pathFileInput.nativeElement.click();
				} else {
					//Toster Message
					this.toastr.warning(this.appService.getTranslation('Pages.Learners.Home.Toaster.waitForPreviousProcess'));
				}
			}
		});
	}

	resetLearnerLockOutFlag() {
		let payload = {
			learnerId: this.learnerForm.value.id,
			clientId: this.learnerForm.controls['clientIdForLearnerRole'].value,
			type: this.type,
		};
		this.spinnerService.show();
		this.learnerService.resetLearnerLockOut(payload).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				if (this.searchKeyData) {
					this.getLearnerByFilter(this.inputSearchTxt);
				} else {
					this.getClientAllLearner(this.userClientId, this.page, this.limit);
				}
				this.toastr.success(
					this.appService.getTranslation('Pages.Learners.Home.Toaster.lockoutflagreset'),
					this.appService.getTranslation('Utils.success')
				);
				$('#addLearnerModal').modal('hide');
			}
		});
	}
}
