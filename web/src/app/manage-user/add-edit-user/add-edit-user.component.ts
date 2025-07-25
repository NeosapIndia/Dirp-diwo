import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from '../../../app/app.service';
import { ManageClientsService } from '../../../app/manage-clients/manage-clients.service';
import { ManageUserService } from '../manage-user.service';
import { isValidPhoneNumber } from 'libphonenumber-js';
const zipcodeRegex = require('../../../assets/zipcodeValidation.json');
declare var $: any;

@Component({
	selector: 'app-add-edit-user',
	templateUrl: './add-edit-user.component.html',
	styleUrls: ['./add-edit-user.component.css'],
})
export class AddEditUserComponent implements OnInit {
	userForm: FormGroup;
	allCountryList: any = [];
	provinces: any;
	selectedCountry: any;
	userClientRoleForm: any = [];
	userClient: any;
	modalCssConfig = {
		animated: true,
		class: 'addUserModalCSS',
	};
	clientListForLearnerRole: any = [];
	subClientListForForm = [];
	phoneFlag: boolean = false;
	emailFlag: boolean = false;
	email = null;
	phone = null;
	allRoles: any[];
	tempUnificationAllRoles: any = [];
	clientListForForm = [];
	tempclientListForForm = [];
	clientAllUsers = [];
	userClientId: any;
	editUserData: any;
	editUserId: any;
	index: any;
	// restricted_roles = ['Product Owner Super Admin' , 'Product Owner Admin' , 'Partner Super Admin' , 'Partner Admin' , 'Client Admin' , 'Branch Admin' , 'Learning Admin' , 'Content Author' , 'Business Manager' , 'Trainer'];
	writePermission: boolean = false;
	roleId: any;
	isMobRequired: boolean = false;
	isMobileCompulsory: boolean;
	isEmailCompulsory: boolean;
	emailError: boolean = false;
	pageDetails: any;
	selectedRoleForUser: any[];
	isShowUseExistingUser: boolean = true;
	allowedRoles = [
		{
			type: 'Product Owner Account',
			roles: ['Product Owner Super Admin', 'Product Owner Admin'],
		},
		{
			type: 'Partner Account',
			roles: ['Partner Super Admin', 'Partner Admin'],
		},
		{
			type: 'Client Account',
			roles: ['Client Admin', 'Branch Admin', 'Analyst', 'Content Author', 'Business Manager'],
		},
		{
			type: 'Branch Account',
			roles: ['Client Admin', 'Branch Admin', 'Analyst', 'Content Author', 'Business Manager'],
		},
	];
	type = 'drip';

	phoneCode = null;
	selectedLearnerId = null;

	iconObject = {
		add_icon_30: null,
	};
	color: any = `#6513e1`;

	constructor(
		private formBuilder: FormBuilder,
		public appService: AppService,
		private toastr: ToastrService,
		private clientsService: ManageClientsService,
		private manageUserService: ManageUserService,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private route: ActivatedRoute
	) {
		// this.index = this.restricted_roles.indexOf(this.user_role);
		// let global_roles = ['Product Owner Super Admin' , 'Product Owner Admin' , 'Partner Super Admin' , 'Partner Admin' , 'Client Admin' , 'Branch Admin' , 'Learning Admin' , 'Content Author' , 'Business Manager' , 'Trainer'];
	}

	ngOnInit() {
		this.getAppBranding();
		this.type = this.appService.type;
		this.pageDetails = JSON.parse(localStorage.getItem('userPageNo')) || null;
		this.createUserForm();
		this.countries();
		this.addMoreClient();
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.getChildClientList(this.userClient.id);
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		if (JSON.parse(localStorage.getItem('app_branding'))) {
			this.isMobileCompulsory = JSON.parse(localStorage.getItem('app_branding')).compMobNo || false;
			this.isEmailCompulsory = JSON.parse(localStorage.getItem('app_branding')).compEmail || false;
		}
		this.getAllRoles();
		if (this.route.snapshot.queryParams.userId) {
			this.editUserId = null;
			this.editUserId = this.route.snapshot.queryParams.userId;
			this.isShowUseExistingUser = false;
			this.getUserDataById();
		}

		if (this.isMobileCompulsory == true) {
			this.userForm.get('phone').setValidators([Validators.required, Validators.pattern('[6-9]\\d{9}')]);
		} else {
			this.userForm.get('phone').clearValidators();
		}

		if (!this.isEmailCompulsory) this.userForm.get('email').clearValidators();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createUserForm() {
		this.userForm = this.formBuilder.group({
			id: null,
			first: ['', Validators.required],
			last: ['', Validators.required],
			email: ['', Validators.required],
			phone: [''],
			country: [null, Validators.required],
			CountryId: [null, Validators.required],
			state: [null],
			city: [''],
			zipCode: [''],
			role: [''],
			parentClientId: [''],
			parentSubClientId: [''],
			clientIdForLearnerRole: [''],
		});
	}
	get f() {
		return this.userForm.controls;
	}
	markAsTouched(group: FormGroup) {
		Object.keys(group.controls).map((field) => {
			const control = group.get(field);
			if (control instanceof FormControl) {
				control.markAsTouched({ onlySelf: true });
			} else if (control instanceof FormGroup) {
				this.markAsTouched(control);
			}
		});
	}

	getUserDataById() {
		this.manageUserService.getSingleUserByUserId(this.userClientId, this.editUserId).subscribe((res: any) => {
			if (res.success) {
				this.editUserData = res.data;
				this.userForm.patchValue(res.User);
				this.changeCountry(res.User.country);
				this.userForm.controls['id'].setValue(parseInt(this.editUserId));
				this.clientListForLearnerRole = res.LearnerClientList;
				this.userClientRoleForm = [];
				if (res && res.UserLearnerClient) {
					this.userForm.controls['clientIdForLearnerRole'].setValue(parseInt(res.UserLearnerClient.id));
				}
				for (let clientRole of res.data) {
					if (clientRole && clientRole.parentClient) {
						let payload = {
							role: [],
							clientId: clientRole.Client.id,
							branchClientId: null,
							parentSubClientList: [],
							showAccess: false,
							isAccess: clientRole.isAccess,
						};
						//for learner role
						for (let role of clientRole.Roles) {
							if (role != 1) {
								payload.role.push(role);
							}
						}
						if (clientRole.Client.DiwoAccess && clientRole.Client.DripAccess) {
							payload.showAccess = true;
						}
						this.userClientRoleForm.push(payload);
					} else {
						let payload = {
							role: [],
							clientId: clientRole.Client.id,
							branchClientId: null,
							parentSubClientList: [],
							showAccess: false,
							isAccess: clientRole.isAccess,
						};
						if (clientRole.Client.DiwoAccess && clientRole.Client.DripAccess) {
							payload.showAccess = true;
						}

						//for learner role
						for (let role of clientRole.Roles) {
							if (role != 1) {
								payload.role.push(role);
							}
						}

						this.userClientRoleForm.push(payload);
					}
				}

				let flag = true;
				if (flag && this.type == 'drip') {
					for (let item of this.userClientRoleForm) {
						if (item.isAccess) {
							this.onChangeDiwoAdminAccess(true);
							flag = false;
						}
					}
				}
				this.getAllLastClientList();
			}
		});
	}

	countries() {
		this.appService.getCountries().subscribe((res: any) => {
			if (res.success) {
				// if (!this.route.snapshot.queryParams.userData) {
				// 	this.userForm.reset();
				// }
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
				this.userForm.controls['CountryId'].setValue(country.id);
				this.mobilePost(false);
				break;
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

	getChildClientList(parentClientId) {
		this.clientsService.getAllChildClientForAdmin(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.tempclientListForForm = [];
				this.clientListForForm.push(this.userClient);
				this.tempclientListForForm.push(this.userClient);
				for (let client of res.data) {
					this.clientListForForm.push(client);
					this.tempclientListForForm.push(client);
				}
			}
		});
	}

	addMoreClient() {
		if (this.userClientRoleForm.length <= 5) {
			let flag = false;
			for (let item of this.userClientRoleForm) {
				if (item.clientId == '' || item.clientId == null) {
					flag = true;
					item.isParentError = true;
				}
				if (item.role.length <= 0) {
					flag = true;
					item.isRoleError = true;
				}
			}
			if (!flag) {
				let payload = {
					role: [],
					clientId: null,
					branchClientId: null,
					parentSubClientList: [],
					isParentError: false,
					isRoleError: false,
					showAccess: false,
					isAccess: false,
				};
				this.userClientRoleForm.push(payload);
			}
		}
	}

	removeClient(index) {
		this.userClientRoleForm.splice(index, 1);
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
			role: [],
			clientId: null,
			branchClientId: null,
			parentSubClientList: [],
			showAccess: false,
			isAccess: false,
		};
		this.userClientRoleForm.push(payload);
		// this.userForm.reset();
		$('#addUserModal').modal('show', this.modalCssConfig);
	}

	// selectedChildClient(selectedClient, index) {
	//   if (selectedClient.id != this.userClient.id) {
	//     // this.selectedClientAsParentClient = selectedClient;
	//     this.userClientRoleForm[index].clientId = selectedClient.id;
	//     this.userClientRoleForm[index].parentSubClientList = [];
	//     this.getAllLastClientList();
	//     this.getSubChildClientList(selectedClient.id, index);
	//   } else {
	//     // this.selectedClientAsParentClient = selectedClient;
	//     this.userClientRoleForm[index].clientId = selectedClient.id;
	//     this.getAllLastClientList();
	//     this.subClientListForForm = [];
	//   }
	// }

	selectedSubChildClient(selectedSubClient, index) {
		if (selectedSubClient) {
			// this.userClientRoleForm[index].clientId = selectedSubClient.id;
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

	cancel() {
		// this.phoneFlag = false;
		// this.emailFlag = false;
		// $('#addUserModal').modal('hide');
		// this.userForm.reset();
		this.userClientRoleForm = [];
		//this.userForm.controls['country'].setValue(environment.countryName);
		this.userForm.controls['state'].setValue('');
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['user']);
			}, 100);
		} else {
			this.router.navigate(['user']);
		}
	}

	changeAccount(selectedClient, index) {
		this.userClientRoleForm[index].isParentError = false;
		this.clientListForForm = [];
		for (let tempClient of this.tempclientListForForm) {
			let flag = true;
			for (let selctedClient of this.userClientRoleForm) {
				if (selctedClient.clientId == tempClient.id) {
					flag = false;
				}

				//unification
				if (this.type == 'diwo') {
					if (selectedClient.DripAccess) {
						this.userClientRoleForm[index].showAccess = true;
					} else {
						this.userClientRoleForm[index].showAccess = false;
						this.userClientRoleForm[index].isAccess = false;
					}
				} else if (this.type == 'drip') {
					if (selectedClient.DiwoAccess) {
						this.userClientRoleForm[index].showAccess = true;
					} else {
						this.userClientRoleForm[index].showAccess = false;
						this.userClientRoleForm[index].isAccess = false;
					}
				}
			}
			if (flag) {
				this.clientListForForm.push(tempClient);
			}
		}
		this.getAllLastClientList();
		// if ($event.category == 'Product Owner Account') {
		// 	this.selectedRoleForUser = [];
		// 	for (let role of this.allRoles) {
		// 		if (this.allowedRoles[0].roles.indexOf(role.name) != -1) {
		// 			this.selectedRoleForUser.push(role);
		// 		}
		// 	}
		// 	console.log('selectedRoleForUser', this.selectedRoleForUser);
		// } else if ($event.category == 'Partner Account') {
		// 	this.selectedRoleForUser = [];
		// 	for (let role of this.allRoles) {
		// 		if (this.allowedRoles[1].roles.indexOf(role.name) != -1) {
		// 			this.selectedRoleForUser.push(role);
		// 		}
		// 	}
		// 	console.log('selectedRoleForUser', this.selectedRoleForUser);
		// } else if ($event.category == 'Client Account') {
		// 	this.selectedRoleForUser = [];
		// 	for (let role of this.allRoles) {
		// 		if (this.allowedRoles[2].roles.indexOf(role.name) != -1) {
		// 			this.selectedRoleForUser.push(role);
		// 		}
		// 	}
		// 	console.log('selectedRoleForUser', this.selectedRoleForUser);
		// } else if ($event.category == 'Branch Account') {
		// 	this.selectedRoleForUser = [];
		// 	for (let role of this.allRoles) {
		// 		if (this.allowedRoles[3].roles.indexOf(role.name) != -1) {
		// 			this.selectedRoleForUser.push(role);
		// 		}
		// 	}
		// 	console.log('selectedRoleForUser', this.selectedRoleForUser);
		// }
	}

	changeRole(role, index) {
		// this.userClientRoleForm[index].role = role;
		this.userClientRoleForm[index].isRoleError = false;
	}

	onChangeDiwoAdminAccess(flag: any) {
		if (this.type == 'drip') {
			if (flag) {
				let payload = {
					id: 11,
					name: 'Trainer',
				};
				setTimeout(() => {
					let found = this.tempUnificationAllRoles.find((role) => role.name === 'Trainer');
					if (!found) {
						this.tempUnificationAllRoles.push(payload);
						this.tempUnificationAllRoles = [...this.tempUnificationAllRoles];
					}
				}, 200);
			}
			// else if (!flag) {
			// 	let newArray = this.tempUnificationAllRoles.filter((role) => role.name !== 'Trainer');
			// 	this.tempUnificationAllRoles = [];
			// 	this.tempUnificationAllRoles = newArray;
			// 	this.tempUnificationAllRoles = [...this.tempUnificationAllRoles];
			// }
			// this.userClientRoleForm = [...this.userClientRoleForm];
		}
	}

	getAllRoles() {
		this.manageUserService.getAllRoles(this.roleId).subscribe((res: any) => {
			if (res.success) {
				this.allRoles = [];
				this.tempUnificationAllRoles = [];

				for (let role of res.data) {
					if (role.id != 1) {
						this.allRoles.push(role);
						this.tempUnificationAllRoles.push(role);
					}
				}
			}
		});
	}

	getClientAllUser(clientId) {
		this.manageUserService.getClientAllUsersForEdit(clientId).subscribe((res: any) => {
			if (res.success) {
				this.clientAllUsers = [];
				this.clientAllUsers = res.data;
			}
		});
	}

	changeClientforLearnerRole(client) {}

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

	saveUser() {
		if (this.userForm.invalid) {
			this.markAsTouched(this.userForm);
			return;
		}

		if (!this.mobilePost(false)) {
			console.log('----------InValid Mobile Number----------');
			return;
		}

		let email = (<HTMLInputElement>document.getElementById('email')).value;
		if (email && !this.addEmail(email.trim())) {
			return;
		}

		// let zipvalidation = this.checkzipcode(this.userForm.value.zipCode, this.userForm.value.country);
		// if (!zipvalidation) {
		//   this.toastr.error(this.appService.getTranslation('Utils.zipcode'), this.appService.getTranslation('Utils.error'));
		//   return;
		// }
		let dripAccessFlag = false;
		let diwoAccessFlag = false;
		for (let client of this.userClientRoleForm) {
			// if (client.role.length <= 0 || client.clientId == '' || client.clientId == null) {
			//   this.toastr.error(this.appService.getTranslation('Pages.AdminUsers.AddEdit.Toaster.parentclient'), this.appService.getTranslation('Utils.error'));
			//   return;
			// }
			if (client.clientId == '' || client.clientId == null || client.role.length <= 0) {
				if (client.clientId == '' || client.clientId == null) {
					client.isParentError = true;
				}
				if (client.role.length <= 0) {
					client.isRoleError = true;
				}
				return;
			}

			//unification
			if (this.type == 'drip' && client.isAccess == true) {
				diwoAccessFlag = true;
			} else if (this.type == 'diwo' && client.isAccess == true) {
				dripAccessFlag = true;
			}
		}

		for (let client of this.userClientRoleForm) {
			if (client?.isParentError != null) {
				delete client.isParentError;
			}
			if (client?.isRoleError != null) {
				delete client.isRoleError;
			}
		}

		let payload = {
			userDetails: {
				first: this.userForm.controls['first'].value,
				last: this.userForm.controls['last'].value,
				email: this.userForm.controls['email'].value,
				phone: this.userForm.controls['phone'].value,
				// type:'Admin',
				city: this.userForm.controls['city'].value,
				state: this.userForm.controls['state'].value,
				zipCode: this.userForm.controls['zipCode'].value,
				country: this.userForm.controls['country'].value,
				CountryId: this.userForm.controls['CountryId'].value,
				forDrip: false,
				forDiwo: false,
			},
			clientDetails: this.userClientRoleForm,
			clientIdForLearnerRole: this.userForm.controls['clientIdForLearnerRole'].value,
		};

		//unification
		if (dripAccessFlag) {
			payload.userDetails.forDrip = true;
		} else if (diwoAccessFlag) {
			payload.userDetails.forDiwo = true;
		}

		if (this.type == 'drip') {
			payload.userDetails.forDrip = true;
		} else if (this.type == 'diwo') {
			payload.userDetails.forDiwo = true;
		}

		for (let client of payload.clientDetails) {
			if (client.branchClientId) {
				client.clientId = client.branchClientId;
			}
		}

		this.spinnerService.show();
		if (this.editUserId == null) {
			this.manageUserService.createUser(payload).subscribe(
				(res: any) => {
					this.spinnerService.hide();
					if (res.success) {
						this.appService.checkNotifcation = true;
						// if (localStorage.getItem('role') == 'Global Super Admin' || localStorage.getItem('role') == 'Global Admin') {

						// this.toastr.success(this.appService.getTranslation('Pages.AdminUsers.AddEdit.Toaster.raiserequest'),this.appService.getTranslation('Utils.success'));
						// } else {

						// }
						// this.userForm.reset();
						this.userClientRoleForm = [];
						if (res.errorMessage) {
							this.toastr.warning(res.errorMessage, this.appService.getTranslation('Utils.warning'));
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.AdminUsers.AddEdit.Toaster.usercreated'),
								this.appService.getTranslation('Utils.success')
							);
						}
						this.router.navigate(['/user']);
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				},
				(error) => {
					this.spinnerService.hide();
				}
			);
		} else {
			if (this.pageDetails != null || this.pageDetails != undefined) {
				this.savePagination();
			}
			this.manageUserService.updateAdminUser(this.editUserId, payload).subscribe(
				(res: any) => {
					this.spinnerService.hide();
					if (res.success) {
						this.appService.checkNotifcation = true;
						if (res.errorMessage) {
							this.toastr.warning(res.errorMessage, this.appService.getTranslation('Utils.warning'));
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.AdminUsers.AddEdit.Toaster.userupdated'),
								this.appService.getTranslation('Utils.success')
							);
						}
						this.userClientRoleForm = [];
						setTimeout(() => {
							this.router.navigate(['/user']);
						}, 100);
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

	mobilePost(flag) {
		console.log('-------Flag--', flag);
		// if (this.isMobileCompulsory == false) {
		// 	var pattern = /^[6,7,8,9][0-9]{9}$/;
		// 	let mob: any = parseInt(event.target.value);
		// 	if (event.target.value.length != 0) {
		// 		if (!pattern.test(mob)) {
		// 			this.userForm.controls['phone'].setErrors({ invalid: true });
		// 			this.isMobRequired = true;
		// 		} else {
		// 			this.userForm.controls['phone'].markAsTouched({ onlySelf: true });
		// 			this.isMobRequired = false;
		// 		}
		// 	} else {
		// 		this.userForm.controls['phone'].markAsTouched({ onlySelf: true });
		// 		this.isMobRequired = false;
		// 	}
		// }

		if (
			(this.userForm.controls['country'].value && flag == true) ||
			(flag == false && this.userForm.controls['phone'].value)
		) {
			var pattern = /^[6,7,8,9][0-9]{9}$/;
			let mob: any = parseInt(this.userForm.controls['phone'].value);
			let userPhone = '';
			let CountryCode;
			for (let country of this.allCountryList) {
				if (country.name == this.userForm.controls['country'].value) {
					userPhone = country.callingCode + this.userForm.controls['phone'].value;
					CountryCode = country.countryCode;
					break;
				}
			}
			if (isValidPhoneNumber(userPhone, CountryCode) === false || (CountryCode == 'IN' && !pattern.test(mob))) {
				if (this.userForm.controls['phone'].value.length == 0 && this.isMobileCompulsory === false) {
					this.userForm.controls['phone'].setErrors(null);
					return true;
				} else {
					this.userForm.controls['phone'].setErrors({ invalid: true });
					return false;
				}
			} else {
				this.userForm.controls['phone'].setErrors(null);
				return true;
			}
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
					this.userForm.controls['email'].setValue(email.trim());
					this.emailError = false;
					return true;
				} else {
					this.userForm.controls['email'].setErrors({ pattern: true });
					this.emailError = true;
					return false;
				}
			} else {
				this.userForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.userForm.controls['email'].markAsTouched({ onlySelf: true });
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
				this.userForm.controls['email'].setValue(email.trim());
				this.emailError = false;
				return true;
			} else {
				this.userForm.controls['email'].setErrors({ pattern: true });
				this.emailError = true;
				return false;
			}
		} else {
			this.userForm.controls['email'].setErrors({ pattern: true });
			this.emailError = true;
			return false;
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('userPageNo', JSON.stringify(payload));
	}

	//Add Learner as a Admin User
	addLearnerAsAdminPopUp() {
		this.selectedLearnerId = null;
		$('#addLearnerAsAdminModal').modal('show');
	}

	canceladdLearnerAsAdminPopUp() {
		$('#addLearnerAsAdminModal').modal('hide');
	}

	addLearnerAsAdminUser() {
		this.spinnerService.show();
		this.manageUserService.getLearnerDataForAdminUser(this.selectedLearnerId).subscribe((res: any) => {
			if (res.success && res.data) {
				this.spinnerService.hide();
				$('#addLearnerAsAdminModal').modal('hide');
				// this.selectedLearnerId = null;
				this.editUserId = res.data.UserId;
				if (this.editUserId) {
					this.getUserDataById();
					this.userForm.controls['email'].disable();
					this.userForm.controls['phone'].disable();
					this.userForm.controls['clientIdForLearnerRole'].disable();
				}
			}
		});
	}
}
