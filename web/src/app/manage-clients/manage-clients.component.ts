import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { routerTransition } from '../router.animations';
import { ManageClientsService } from './manage-clients.service';
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-clients',
	templateUrl: './manage-clients.component.html',
	styleUrls: ['./manage-clients.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageClientsComponent implements OnInit {
	ClientData: any[] = [];
	ClientForm: FormGroup;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index: any;
	writePermission: boolean = false;
	searchStr: any;
	disableInputField: boolean = false;
	selectedClient;
	selectedClientName;
	clientList = [];
	selectedClientAsParentClient;
	userClient;
	subClientListForForm = [];
	seletedClientForEdit: any;
	share_flag = false;
	countryNameList = [];
	showJobRoleCopyButton: boolean = false;
	parentClientJobRoleList: any;
	clientListForForm = [];
	FilterClientColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Account Name', value: 'name' },
		{ label: 'Category', value: 'category' },
		{ label: 'Parent Account', value: 'parentclient' },
		{ label: 'Country', value: 'country' },
		{ label: 'Account Id', value: 'client_id' },
		{ label: 'Status', value: 'is_deleted' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	isSelectAll: boolean = false;
	payload: { searchKey: any; filterColumn: any };

	showSelectAllOption: boolean = false;
	selectedClientIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	userRoleId;
	selectedLearnerIds: any[];
	selectedAccountIdForSuspend: any;
	isSuspended: any;
	isDripDiwoAccess: boolean = false;
	type = 'drip';
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};
	constructor(
		private spinnerService: NgxSpinnerService,
		private confirmationService: ConfirmationService,
		private clientsService: ManageClientsService,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router
	) {}

	ngOnInit() {
		this.getAppBranding();
		this.type = this.appService.type;
		this.userRoleId = localStorage.getItem('roleId');
		if (this.userRoleId == 2 || this.userRoleId == 3) {
			this.isDripDiwoAccess = true;
		}
		this.index = this.restricted_roles.indexOf(this.user_role);
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		if (JSON.parse(localStorage.getItem('accountPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('accountPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.createForm();
		this.FilterClientColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchAccounts'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterClientColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getClientByFilter(this.inputSearchTxt);
		} else {
			this.getClientData(this.page, this.limit);
		}
		localStorage.removeItem('accountPageNo');
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getRollPermission() {
		let payload = {
			roleId: this.userRoleId,
			permission: 'RW',
			menuId: [],
		};
		if (this.userClient.category == 'Product Owner Account') {
			payload.menuId.push(2);
		} else if (this.userClient.category == 'Partner Account') {
			payload.menuId.push(3);
		} else if (this.userClient.category == 'Client Account') {
			payload.menuId.push(4);
		} else if (this.userClient.category == 'Branch Account') {
			payload.menuId.push(5);
		}

		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	createForm() {
		this.FilterClientColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	getClientData(page, limit) {
		// this.clientsService.getClientData(pageCount, limit).subscribe((res: any) => {
		//     setTimeout(() => {
		//         this.spinnerService.hide();
		//     }, 300);
		//     if (res.success) {
		//         this.ClientData = res.data;
		//         this.totalCount = res.count;
		//     } else {
		//         this.toastr.error(res.error, 'Error');
		//     }
		// });

		this.spinnerService.show();
		this.clientsService.getAllSubChildClient(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.ClientData = [];
				for (let client of res.data) {
					let _client = client;
					let countryList = [];
					for (let country of client.Countries) {
						countryList.push(country.name);
					}
					_client.countryNameList = countryList.toString().replace(/\,/g, ', ');
					this.ClientData.push(_client);
				}
				this.totalCount = res.count;
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
			}
			this.isApiCall = false;
			this.isDataLoaded = true;
			this.spinnerService.hide();
		});
	}

	changeClient(client) {
		this.selectedClient = client;
		this.selectedClientName = client.name;
	}

	getSubChildClientList(parentClientId) {
		this.clientsService.getSubChildClient(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.subClientListForForm = [];
				if (this.seletedClientForEdit) {
					for (let client of res.data) {
						if (client.id != this.seletedClientForEdit.id) {
							this.subClientListForForm.push(client);
						}
					}
				} else {
					this.subClientListForForm = res.data;
				}
			}
		});
	}

	selectedSubChildClient(selectedSubClient) {
		if (selectedSubClient) {
			this.selectedClientAsParentClient = selectedSubClient;
			this.getJobRoleOfParentClient(selectedSubClient.id);
		}
	}

	getJobRoleOfParentClient(clientId) {
		let payload = {
			ClientId: [clientId],
		};
		this.clientsService.getJobRoleByClientId(payload).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.length > 0) {
					this.showJobRoleCopyButton = true;
					this.parentClientJobRoleList = res.data;
				} else {
					this.showJobRoleCopyButton = false;
				}
			}
		});
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.ClientData.forEach((element, index) => {
				if (!this.selectedClientIds.includes(element.id)) this.selectedClientIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.ClientData.forEach((element, index) => {
				this.selectedClientIds.push(element.id);
				let indexof = this.selectedClientIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedClientIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedClientIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedClientIds.indexOf(item.id) > -1) {
			this.selectedClientIds.splice(this.selectedClientIds.indexOf(item.id), 1);
			let value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedClientIds.push(item.id);
			let value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedClientIds.length == this.ClientData.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedClientIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	getClientByFilter(eve) {
		this.inputSearchTxt = eve;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = eve;

		if (this.FilterClientColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterClientColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterClientColumnForm.value.FilterColumn != null) {
			this.payload = {
				searchKey: eve,
				filterColumn: this.filterColumn,
			};
		} else {
			this.payload = {
				searchKey: eve,
				filterColumn: [],
			};
		}

		localStorage.setItem('searchAccounts', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getClientData(this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > 2) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.clientsService.getClientDataBySearch(this.payload, this.page, this.limit).subscribe((res: any) => {
					setTimeout(() => {
						this.spinnerService.hide();
					}, 300);
					this.isApiCall = false;
					this.isDataLoaded = true;
					if (res.success) {
						this.ClientData = [];
						this.totalCount = res.count;
						for (let client of res.data) {
							let _client = client;
							let countryList = [];
							for (let country of client.Countries) {
								countryList.push(country.name);
							}
							_client.countryNameList = countryList.toString().replace(/\,/g, ', ');
							this.ClientData.push(_client);
						}
					}
				});
			}, this.appService.timeout);
		}
	}

	getCampaignByFilter($event) {}

	openClientModal() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}
		this.ClientForm.reset();
		this.ClientForm.value.status = false;
		$('#addClientModal').modal('show');
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getClientByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getClientByFilter(this.inputSearchTxt);
		} else {
			this.getClientData(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getClientByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getClientByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getClientByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getClientData(this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getClientData(this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getClientData(this.page, this.limit);
			}
		}
	}

	cancel() {
		$('#addClientModal').modal('hide');
		this.disableInputField = false;
		this.ClientForm.reset();
		this.subClientListForForm = [];
		this.seletedClientForEdit = null;
	}

	addAccount() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/clients/add-or-edit-client']);
		}
	}

	editClient(editClientData) {
		let payload = {
			pageNo: this.page,
			isPageChange: false,
		};
		localStorage.setItem('accountPageNo', JSON.stringify(payload));
		this.router.navigate(['/clients/add-or-edit-client'], { queryParams: { clientId: editClientData.id } });
		// console.log(editClientData);
		// if (!this.writePermission) {
		//     this.toastr.error(this.appService.getTranslation('Utils.unauthorised'), this.appService.getTranslation('Utils.error'));
		// } else {
		// }

		// this.router.navigate(['/clients/add-or-edit-client'], {queryParams: {clientData:JSON.stringify(data)}});

		// if (!this.writePermission) {
		//     this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
		//     return;
		// }
		// this.seletedClientForEdit = data;
		// let parentId = data.Parent_client.id;

		// This code is used when client record is editing
		// if (data.Client_job_roles.length > 0) {
		//     this.jobRoleForm = data.Client_job_roles;
		// } else {
		//     this.addOneJobRoleInForm();
		// }

		// this.ClientForm.reset();
		// this.ClientForm.patchValue(data);
		// console.log("---data---", data);
		// if(data && data.System_branding){
		//     this.ClientForm.controls['avatar'].setValue(data.System_branding.avatar);
		//     this.ClientForm.controls['avatar_file_name'].setValue(data.System_branding.avatar_file_name);
		// }
		// let flag = false;
		// for (let client of this.clientListForForm) {
		//     if (client.id == parentId) {
		//         flag = true;
		//         this.ClientForm.controls['parentClientId'].setValue(parentId);
		//         this.selectedClientAsParentClient = client;
		//         if (client.id != this.userClient.id) {
		//             this.clientsService.getSubChildClient(client.id).subscribe((res: any) => {
		//                 for (let _client of res.data) {
		//                     if (_client.id != data.id) {
		//                         this.subClientListForForm.push(_client);
		//                     }
		//                 }
		//             })
		//         }
		//     }
		// }
		// if (!flag) {
		//     for (let client of this.clientListForForm) {
		//         if (client.id != this.userClient.id) {
		//             this.clientsService.getSubChildClient(client.id).subscribe((res: any) => {
		//                 if (res.success) {
		//                     for (let subClient of res.data) {
		//                         if (subClient.id == parentId) {
		//                             this.ClientForm.controls['parentClientId'].setValue(client.id);
		//                             this.ClientForm.controls['parentSubClientId'].setValue(subClient.id);
		//                             this.selectedClientAsParentClient = subClient;
		//                             this.subClientListForForm = [];
		//                             for (let _client of res.data) {
		//                                 if (_client.id != data.id) {
		//                                     this.subClientListForForm.push(_client);
		//                                 }
		//                             }
		//                             // this.subClientListForForm = res.data;
		//                             break;
		//                         }
		//                     }
		//                 }
		//             })
		//         }
		//     }
		// }
	}

	viewClient(editClientData) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/licenses/view-license'], { queryParams: { clientId: editClientData.id } });
		}
	}

	onDelete(id) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}
		let confirmMsg = this.appService.getTranslation('Confirm.Client.deleteMsg');
		let confirmationHeader = this.appService.getTranslation('Confirm.Client.confirmationHeader');
		let successMessage = this.appService.getTranslation('Confirm.Client.successMessage');
		this.confirmationService.confirm({
			message: confirmMsg,
			header: confirmationHeader,
			icon: 'fa fa-trash',
			accept: () => {
				this.spinnerService.show();
				this.clientsService.deleteClients(id).subscribe((res: any) => {
					if (res.success) {
						this.getClientData(this.page, this.limit);
						if (this.index >= 0) {
							this.toastr.success('Thank You! Request raised.', this.appService.getTranslation('Utils.success'));
						} else {
							this.toastr.success(successMessage, this.appService.getTranslation('Utils.success'));
						}
					} else {
						this.spinnerService.hide();
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				});
			},
		});
	}

	supendAccount(status) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.isSuspended = status;
			this.selectedAccountIdForSuspend = this.selectedClientIds;
			if (this.selectedAccountIdForSuspend) {
				$('#deleteClientModal').modal('show');
			}
		}
	}

	cancelSuspend() {
		$('#deleteClientModal').modal('hide');
	}

	onSuspendAccount() {
		this.spinnerService.show();
		this.clientsService.suspendAccount(this.selectedAccountIdForSuspend, this.isSuspended).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				this.selectedAccountIdForSuspend = null;
				this.getClientData(this.page, this.limit);
				$('#deleteClientModal').modal('hide');
				this.selectedClientIds = [];
			} else {
				this.spinnerService.hide();
			}
		});
	}
}
