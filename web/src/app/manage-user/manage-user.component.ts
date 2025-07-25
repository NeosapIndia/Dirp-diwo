import {
	Component,
	OnInit,
	ElementRef,
	AfterViewInit,
	OnDestroy,
	AfterViewChecked,
	ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../app.service';
import { environment } from '../../environments/environment';
import { ManageUserService } from './manage-user.service';
// import { IMyDpOptions } from 'mydatepicker';
import { UserService } from '../shared';
import { first } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ManageClientsService } from '../manage-clients/manage-clients.service';
const zipcodeRegex = require('../../assets/zipcodeValidation.json');
declare var SelectFx: any;
declare var jquery: any;
declare var $: any;

import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';

@Component({
	selector: 'manage-user',
	templateUrl: './manage-user.component.html',
	styleUrls: ['./manage-user.component.scss'],
	providers: [ManageUserService],
})
export class ManageUserComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked {
	userForm: FormGroup;
	policyForm: FormGroup;
	broadcastNotifier: FormGroup;
	usersList: any = [];
	selectedUser: any;
	public languageList = [];
	searchFilter: any = '';
	filterStatus: any;
	countryList: any;
	packageEntityDetails: any;
	totalUserCount: any;
	page: number = 1;
	limit: any = 25;
	totalCount: any;
	pageResultCount = environment.pageResultsCount;
	phoneFlag: boolean = false;
	emailFlag: boolean = false;
	selectedMarket: any;
	courierList: any;
	provinces: any;
	productInfo: any = [];
	MarketList: any = [];
	addUserCountry: any = [];
	regionalLanguageList: any = [];
	userId: number;
	policyGroupList = [
		{ name: 'Cookie Policy' },
		{ name: 'Terms and Conditions' },
		{ name: 'Replacement Policy' },
		{ name: 'Refund Cancellation' },
		{ name: 'Shipping Policy' },
		{ name: 'Privacy Policy' },
	];
	selectedPolicyType: any = [];
	phone: any;
	email: any;
	// public dateofShippingOptions: IMyDpOptions = {
	//     dateFormat: environment.dateFormat,
	//     disableSince: {
	//         year: new Date().getFullYear(),
	//         month: new Date().getMonth() + 1,
	//         day: new Date().getDate() + 1
	//     },
	//     disableUntil: {
	//         year: new Date().getFullYear(),
	//         month: new Date().getMonth() + 1,
	//         day: new Date().getDate() - 4
	//     }
	// };
	public updateShippingData: FormGroup;
	userData: any;
	allowWrite: boolean;
	allowRead: boolean;
	marketPermission: boolean = false;
	marketHasRMode: boolean = false;
	writePermission: any;
	ip_address: string;
	acceptterms: boolean = false;
	CookiePolicy_Acceptterms: boolean = false;
	TermsandConditions_Acceptterms: boolean = false;
	ReplacementPolicy_Acceptterms: boolean = false;
	RefundCancellation_Acceptterms: boolean = false;
	ShippingPolicy_Acceptterms: boolean = false;
	PrivacyPolicy_Acceptterms: boolean = false;
	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;
	clientAllUsers = [];
	userClientId: any;
	allCountryList: any = [];
	selectedCountry: any;
	allRoles: any[];
	clientListForForm = [];
	subClientListForForm = [];
	userClient: any;
	userClientRoleForm: any = [];
	clientListForLearnerRole: any = [];
	modalCssConfig = {
		animated: true,
		class: 'addUserModalCSS',
	};
	FilterUserColumnForm: FormGroup;
	selectedUserIdForDelete: any;
	user_Id: any;
	FilterColumnArray = [
		{ label: 'User Name', value: 'first' },
		{ label: 'Country', value: 'country' },
		{ label: 'Account', value: 'parentname' },
		{ label: 'Account Role', value: 'role' },
		{ label: 'User Id', value: 'account_id' },
		{ label: 'Status', value: 'is_deleted' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	selectedDate: { startDate: any; endDate: any };
	payload: { searchKey: any; filterColumn: any; selectedDate: any };
	ranges: any = {
		Today: [moment(), moment()],
		Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	};
	invalidDates: moment.Moment[] = [];

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
	selectedUsersIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	type = 'drip';
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};
	constructor(
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private manageUserService: ManageUserService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private userService: UserService,
		private clientsService: ManageClientsService,
		private route: ActivatedRoute,
		private http: HttpClient,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.type = this.appService.type;
		this.spinnerService.show();
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}

		if (JSON.parse(localStorage.getItem('userPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('userPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}

		// if (localStorage.getItem('AdminSelectedMarket')) {
		//     this.selectedMarket = JSON.parse(localStorage.getItem('AdminSelectedMarket')).name;
		// } else if (localStorage.getItem('userMarket')) {
		//     this.selectedMarket = JSON.parse(localStorage.getItem('userMarket')).name;
		// } else {
		//     this.selectedMarket = JSON.parse(localStorage.getItem('user')).user.Market.name;
		// }

		// this.getUsersMarket();
		// this.marketHasRMode = JSON.parse(localStorage.getItem('user')).user.Market.is_rmode;
		// if (this.marketHasRMode) {
		//     let rmode_laguage = JSON.parse(localStorage.getItem('user')).user.Market.regional_languages;
		//     this.regionalLanguageList = JSON.parse(rmode_laguage);
		// }
		this.userForm = this.formBuilder.group({
			id: null,
			first: ['', Validators.required],
			last: ['', Validators.required],
			email: ['', [Validators.required, Validators.pattern(/^\w+([\.-]?\w+.*\.*)*@\w+([\.-]?\w+)*(\.\w{2,})+$/)]],
			phone: [''],
			country: ['', Validators.required],
			CountryId: ['', Validators.required],
			state: [''],
			city: [''],
			zipCode: [''],
			role: [''],
			parentClientId: [''],
			parentSubClientId: [''],
			clientIdForLearnerRole: ['', Validators.required],
		});

		this.policyForm = this.formBuilder.group({
			CookiePolicy_file: [''],
			TermsandConditions_file: [''],
			ReplacementPolicy_file: [''],
			RefundCancellation_file: [''],
			ShippingPolicy_file: [''],
			PrivacyPolicy_file: [''],
			policy_type: [null],
		});

		this.broadcastNotifier = this.formBuilder.group({
			templateId: ['', Validators.required],
		});

		this.updateShippingData = this.formBuilder.group({
			dateofshipping: [null, Validators.required],
			couriername: [null, Validators.required],
			bill_no: [null, Validators.required],
		});
		this.filterStatus = true;
		// this.getMarketList();
		// this.countries();
		// this.languages();
		// this.getCourier();
		// this.getAllUsers(this.page, this.limit);
		//this.userForm.controls['country'].setValue(environment.countryName);
		//this.userForm.controls['CountryId'].setValue(environment.countryId);
		if (localStorage.getItem('adminuser')) {
			localStorage.removeItem('adminuser');
			localStorage.removeItem('adminmenupermission');
			localStorage.removeItem('adminrole');
		}
		// this.getIPAddress();
		setTimeout(() => {
			let varebale = document.getElementById('reve-chat-container-div');
			if (varebale) {
				varebale.style.display = 'none';
			}
		}, 3000);

		// ///////////////////////////////////////////////////////////////
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;

		this.getAllClientList(this.userClientId);
		this.countries();
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.getChildClientList(this.userClient.id);

		/////////////////////////////////////////////////////////////////
		this.createForm();
		this.FilterUserColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.getRollPermission();
		this.getAllRoles();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchUsers'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterUserColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getUserByFilter(this.inputSearchTxt);
		} else {
			this.getClientAllUser(this.userClientId, this.page, this.limit);
		}
		localStorage.removeItem('userPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [6],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	createForm() {
		this.FilterUserColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.selectedUsersIds = [];
			this.clientAllUsers.forEach((element, index) => {
				// if (!this.selectedUsersIds.includes(element.User.id))
				this.selectedUsersIds.push({
					UserId: element.UserId,
					RoleId: element.RoleId,
					ClientId: element.ClientId,
				});
				let value = <any>(
					document.getElementById('checkbox-' + element.UserId + '-' + element.RoleId + '-' + element.ClientId)
				);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.clientAllUsers.forEach((element, index) => {
				// this.selectedUsersIds.push(element.User.id);
				// let indexof = this.selectedUsersIds.indexOf(element.User.id);
				// if (indexof > -1) {
				//     this.selectedUsersIds.splice(indexof, 1);
				// }
				let value = <any>(
					document.getElementById('checkbox-' + element.UserId + '-' + element.RoleId + '-' + element.ClientId)
				);
				value.checked = false;
			});
			this.selectedUsersIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		let indexNo = -1;
		for (let i = 0; i < this.selectedUsersIds.length; i++) {
			if (
				this.selectedUsersIds[i].UserId == item.UserId &&
				this.selectedUsersIds[i].RoleId == item.RoleId &&
				this.selectedUsersIds[i].ClientId == item.ClientId
			) {
				indexNo = i;
			}
		}
		if (indexNo > -1) {
			this.selectedUsersIds.splice(indexNo, 1);
			let value = <any>document.getElementById('checkbox-' + item.UserId + '-' + item.RoleId + '-' + item.ClientId);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedUsersIds.push({
				UserId: item.UserId,
				RoleId: item.RoleId,
				ClientId: item.ClientId,
			});
			let value = <any>document.getElementById('checkbox-' + item.UserId + '-' + item.RoleId + '-' + item.ClientId);
			value.checked = true;
		}
		if (this.selectedUsersIds.length == this.clientAllUsers.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedUsersIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	addClientList(clientList) {
		this.clientList = [];
		let userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.clientList.push(userClient);
		for (let client of clientList) {
			this.clientList.push(client);
		}
		this.selectedClient = this.clientList[0];
		if (this.clientList && this.clientList.length > 0) {
			this.selectedClientName = this.clientList[0].name;
			// this.getClientAllUser(this.selectedClient.id);
		}
	}

	getAllClientList(userClientId) {
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let buyer of res.data) {
					this.clientListNames.push(buyer.name);
				}
				this.addClientList(res.data);
			}
			this.spinnerService.hide();
		});
	}

	getClientAllUser(clientId, page, limit) {
		this.spinnerService.show();
		this.manageUserService.getClientAllUsers(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.clientAllUsers = [];
				this.clientAllUsers = res.data;
				this.totalCount = res.count;
			}
			this.isApiCall = false;
			this.isDataLoaded = true;
			this.spinnerService.hide();
		});
	}

	getChildClientList(parentClientId) {
		this.clientsService.getAllChildClient(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm.push(this.userClient);
				for (let client of res.data) {
					this.clientListForForm.push(client);
				}
			}
		});
	}

	getSubChildClientList(parentClientId, index) {
		this.clientsService.getAllSubChildClientForEditUser(parentClientId).subscribe((res: any) => {
			if (res.success) {
				// this.subClientListForForm = [];
				// this.subClientListForForm = res.data;
				this.userClientRoleForm[index].parentSubClientList = [];
				this.userClientRoleForm[index].parentSubClientList = res.data;
			}
		});
	}

	selectedChildClient(selectedClient, index) {
		if (selectedClient.id != this.userClient.id) {
			// this.selectedClientAsParentClient = selectedClient;
			this.userClientRoleForm[index].clientId = selectedClient.id;
			this.getAllLastClientList();
			this.getSubChildClientList(selectedClient.id, index);
		} else {
			// this.selectedClientAsParentClient = selectedClient;
			this.userClientRoleForm[index].clientId = selectedClient.id;
			this.getAllLastClientList();
			this.subClientListForForm = [];
		}
	}

	selectedSubChildClient(selectedSubClient, index) {
		if (selectedSubClient) {
			this.userClientRoleForm[index].clientId = selectedSubClient.id;
			this.getAllLastClientList();
		}
	}

	getAllLastClientList() {
		let parentClientId = [];
		for (let client of this.userClientRoleForm) {
			if (client.clientId) {
				parentClientId.push(client.clientId);
			}
		}
		let payload = {
			parentClientId: parentClientId,
		};
		this.manageUserService.getAllLastClientList(payload).subscribe((res: any) => {
			if (res.success) {
				this.clientListForLearnerRole = [];
				this.clientListForLearnerRole = res.data;
			}
		});
	}

	changeClientforLearnerRole(client) {}

	deleteUser() {
		this.spinnerService.show();
		this.spinnerService.hide();
		this.manageUserService.deleteAdminUser(this.selectedUserIdForDelete).subscribe((res: any) => {
			if (res.success) {
				this.toastr.success(
					this.appService.getTranslation('Pages.AdminUsers.Home.Toaster.userdeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.cancelUserDeletePopUp();
				this.getClientAllUser(this.userClientId, this.page, this.limit);
				this.selectedUsersIds = [];
			}
		});
	}

	cancelUserDeletePopUp() {
		$('#deleteAdminUserModal').modal('hide');
		this.selectedUserIdForDelete = null;
	}

	deleteUserPop() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedUserIdForDelete = this.selectedUsersIds;
			$('#deleteAdminUserModal').modal('show');
		}
	}

	onEditUser(editUserData) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('userPageNo', JSON.stringify(payload));
			this.router.navigate(['/user/add-or-edit-user'], { queryParams: { userId: editUserData.UserId } });
		}
	}

	addUserClick() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/user/add-or-edit-user']);
		}
	}

	// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

	getUsersMarket() {
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
	get f() {
		return this.userForm.controls;
	}

	get f2() {
		return this.policyForm.controls;
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

	ngAfterViewInit() {
		$('.detailInfo').hide();
		$('.ti-minus').hide();
		$('.ti-plus').show();

		this.spinnerService.show();
		this.getUserMenu();
	}

	openInfo(fa) {
		// this.toaster.pop('success', 'Success!', 'Popup integrated successfully');
		$('.detailInfo').toggle();
		$('.ti-plus').toggle();
		$('.ti-minus').toggle();
	}

	goUserProfile(userId, toRoute) {
		localStorage.setItem('activeProfileId', userId);
		if (toRoute) {
			this.router.navigate(['user/', userId]);
		}
	}

	languages() {
		this.appService.getLanguages().subscribe(
			(res: any) => {
				if (res.success) {
					this.languageList = res.data;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			},
			(error) => {}
		);
	}

	countries() {
		this.appService.getCountries().subscribe(
			(res: any) => {
				if (res.success) {
					// let userMarket = JSON.parse(localStorage.getItem('userMarket'));
					// let user = JSON.parse(localStorage.getItem("user")).user;
					// this.userForm.controls['country'].setValue(user.country);
					// this.userForm.controls['CountryId'].setValue(user.CountryId);
					// // this.addUserCountry = userMarket.Countries;
					// this.countryList = res.data;
					// let country = this.countryList.find(country => country.name == user.country);
					// let countryName = country.name;
					// this.provinces = country.Provinces;
					this.allCountryList = res.data;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			},
			(error) => {}
		);
	}

	changeCountry(countryName) {
		for (let country of this.allCountryList) {
			if (country.name == countryName) {
				this.selectedCountry = country;
				this.provinces = country.Provinces;
				this.userForm.controls['CountryId'].setValue(country.id);
			}
		}

		// let market;
		// for (let i in this.MarketList) {
		//     for (let j in this.MarketList[i].Countries) {
		//         if (this.MarketList[i].Countries[j].name == cnt) {
		//             market = this.MarketList[i];
		//         }
		//     }
		// }
		// let userMarket = market;
		// this.userForm.controls['country'].setValue(cnt);
		// this.addUserCountry = userMarket.Countries;
		// let country = this.countryList.find(country => country.name == cnt);
		// let countryName = country.name;
		// this.provinces = country.Provinces;
		// this.userForm.controls['CountryId'].setValue(country.id);
	}

	getCourier() {
		// this.courierService.getAllCourierInfo(0, 100, this.selectedMarket).subscribe((res: any) => {
		//     this.spinnerService.hide();
		//     if (res.success) {
		//         this.courierList = res.data;
		//     } else {
		//         this.toastr.error(res.error, "Error");
		//     }
		// }, error => {
		// });
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

	addUser() {
		// if (!this.writePermission) {
		//     this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
		// } else {
		//     let user = JSON.parse(localStorage.getItem("user")).user;
		//     this.userForm.controls['country'].setValue(user.country);
		//     let country = this.countryList.find(country => country.name == this.userForm.controls['country'].value);
		//     this.userForm.controls['CountryId'].setValue(country.id);
		//     $('#addUserModal').modal('show');
		// }
		this.userClientRoleForm = [];
		let payload = {
			role: null,
			clientId: null,
			parentSubClientList: [],
		};
		this.userClientRoleForm.push(payload);
		this.userForm.reset();
		$('#addUserModal').modal('show', this.modalCssConfig);
	}

	getAllRoles() {
		this.manageUserService.getAllRoles(this.roleId).subscribe((res: any) => {
			if (res.success) {
				this.allRoles = [];

				for (let role of res.data) {
					if (role.id != 1) {
						this.allRoles.push(role);
					}
				}
			}
		});
	}

	cancel() {
		this.phoneFlag = false;
		this.emailFlag = false;
		$('#addUserModal').modal('hide');
		this.userForm.reset();
		this.userClientRoleForm = [];
		//this.userForm.controls['country'].setValue(environment.countryName);
		this.userForm.controls['state'].setValue('');
	}

	getUserMenu() {
		if (localStorage.getItem('user')) {
			this.userData = JSON.parse(localStorage.getItem('user')).user;
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

	showProductInfo(item) {
		this.productInfo = item;
		$('#productInfo').modal('show');
	}

	cancelProductInfo() {
		$('#productInfo').modal('hide');
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getUserByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getUserByFilter(this.inputSearchTxt);
		} else {
			this.getClientAllUser(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getUserByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getUserByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getUserByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getClientAllUser(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getClientAllUser(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getClientAllUser(this.userClientId, this.page, this.limit);
			}
		}
	}

	getAllUsers(pageCount, limit) {
		this.spinnerService.show();
		this.manageUserService.getUsers(pageCount, limit, this.selectedMarket).subscribe(
			(res: any) => {
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
				let varebale = document.getElementById('reve-chat-container-div');
				if (varebale) {
					varebale.style.display = 'none';
				}
				if (res.success) {
					this.usersList = res.data;
					this.totalUserCount = res.count;
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
		this.userForm.controls['country'].setValue(userMarket.Countries[0].name);
		this.userForm.controls['CountryId'].setValue(userMarket.Currency.CountryId);
		this.addUserCountry = userMarket.Countries;
		let country = this.countryList.find((country) => country.name == userMarket.Countries[0].name);
		let countryName = country.name;
		this.provinces = country.Provinces;
		this.getAllUsers(this.page, this.limit);
	}

	changeClient(client) {
		// this.getClientAllUser(client.id);
	}

	suspendUser(id, flag) {
		// this.spinnerService.show();
		// var status = !flag ? 'active' : 'suspend';
		// this.manageUserService.suspendUser(id, status).subscribe((res: any) => {
		//     if (res.success) {
		//         if (localStorage.getItem('role') == 'Global Super Admin' || localStorage.getItem('role') == 'Global Admin') {
		//             if (!flag) {
		//                 this.toastr.success('User successfully Activated!', "Success");
		//             } else {
		//                 this.toastr.success('User successfully suspended!', "Success");
		//             }
		//         } else {
		//             this.toastr.success("Thank You! Request raised.", "Success!");
		//         }
		//         // this.getClientAllUser(this.selectedClient.id);
		//         this.spinnerService.hide();
		//     } else {
		//         this.spinnerService.hide();
		//         this.toastr.error(res.error, 'Error');
		//     }
		// }, error => {
		// });
	}
	get f1() {
		return this.updateShippingData.controls;
	}

	get notifyForm() {
		return this.broadcastNotifier.controls;
	}

	updateShippingDatePopup(data) {
		this.updateShippingData.reset();
		this.packageEntityDetails = data;
		$('#updateDeliveryDate').modal('show');
	}
	updateShippingDateById() {
		if (this.updateShippingData.invalid) {
			this.markAsTouched(this.updateShippingData);
			return;
		}
		this.spinnerService.show();
		var validate = this.updateShippingData.controls['dateofshipping'].value;

		var couriername = this.updateShippingData.controls['couriername'].value;
		var bill_no = this.updateShippingData.controls['bill_no'].value;
		if (validate != null) {
			if (validate.date.month < 10) {
				validate.date.month = 0 + '' + validate.date.month;
			}
			if (validate.date.day < 10) {
				validate.date.day = 0 + '' + validate.date.day;
			}
			var formattedDate = validate.date.year + '-' + validate.date.month + '-' + validate.date.day;
			var obj = {
				id: this.packageEntityDetails.id,
				actual_shipping_date: formattedDate,
				courier: couriername,
				bill_no: bill_no,
			};

			// this.consumerService.updateDeliveryDate(obj).subscribe((res: any) => {
			//     if (res.success) {
			//         $('#updateDeliveryDate').modal("hide");
			//         this.getAllUsers(this.page, this.limit);
			//     } else {
			//         this.spinnerService.hide();
			//         this.toastr.error(res.error, 'Error');
			//     }
			// }, error => {
			// })
		}
	}

	mobilePost(phoneno) {
		// this.phoneFlag = false;
		// var data: any = {
		//   phone: '' + phoneno,
		//   country: this.userForm.value.country
		// };
		// if (phoneno != this.userForm.controls.phone) {
		//   this.userService.postMobile(data).subscribe((res: any) => {
		//     if (res.success) {
		//       this.phoneFlag = res.status;
		//     }
		//   }, error => {
		//   });
		// }
	}

	emailPost(emailId) {
		// this.emailFlag = false;
		// var data: any = {
		//   email: emailId,
		//   country: this.userForm.value.country
		// };
		// if (emailId != this.userForm.controls.email) {
		//   this.userService.postEmail(data).subscribe((res: any) => {
		//     if (res.success) {
		//       this.emailFlag = res.status;
		//     }
		//   }, error => {
		//   });
		// }
	}

	ngOnDestroy() {
		this.spinnerService.hide();
	}

	// my code
	getUserByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		if (this.FilterUserColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterUserColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterUserColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterUserColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterUserColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchUsers', JSON.stringify(this.payload));

		this.searchFilter = key;
		if ((key && key.length == 0) || key == null || key == undefined || key == '') {
			this.getClientAllUser(this.userClientId, this.page, this.limit);
		}
		if (key && key.length > 2) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.manageUserService.getSearchUsers(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.clientAllUsers = res.data;
							this.totalCount = res.count;
						} else {
							this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
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
		this.userClientRoleForm[index].role = role;
	}

	addMoreClient() {
		if (this.userClientRoleForm.length <= 5) {
			let payload = {
				role: null,
				clientId: null,
				parentSubClientList: [],
			};
			this.userClientRoleForm.push(payload);
		}
	}

	cancelDripDeletePopUp() {}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getUserByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getUserByFilter(this.inputSearchTxt);
		}
	}
}
