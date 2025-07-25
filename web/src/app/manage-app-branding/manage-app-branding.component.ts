import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { routerTransition } from '../router.animations';
import { ManageAppBrandingService } from './manage-app-branding.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Router } from '@angular/router';
declare var $: any;
@Component({
	selector: 'app-manage-app-branding',
	templateUrl: './manage-app-branding.component.html',
	styleUrls: ['./manage-app-branding.component.scss'],
	animations: [routerTransition()],
})
export class ManageAppBrandingComponent implements OnInit {
	appBrandingData: any[] = [];
	appBrandingForm: FormGroup;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index: any;
	writePermission: any;
	searchStr: any;
	disableInputField: boolean = false;
	selectedClient;
	selectedClientName;
	clientList = [];

	selectedClientAsParentClient;
	userClient;

	clientListForForm = [];
	subClientListForForm = [];
	seletedClientForEdit: any;
	share_flag = false;
	jobRoleForm = [];
	countryNameList = [];
	showJobRoleCopyButton: boolean = false;
	parentClientJobRoleList: any;

	FilterAppBrandingColumnForm: FormGroup;

	FilterColumnArray = [
		{ label: 'Account Name', value: 'name' },
		{ label: 'Account Id', value: 'client_id' },
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
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private spinnerService: NgxSpinnerService,
		private confirmationService: ConfirmationService,
		private appBrandingService: ManageAppBrandingService,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		if (JSON.parse(localStorage.getItem('generalSettingsPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('generalSettingsPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.createForm();
		this.FilterAppBrandingColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchGeneralSettings'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterAppBrandingColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getAllSearchAppBranding(this.inputSearchTxt);
		} else {
			this.getAllAppBranding(this.page, this.limit);
		}
		localStorage.removeItem('generalSettingsPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterAppBrandingColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [15],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getAllAppBranding(page, limit) {
		this.spinnerService.show();
		this.appBrandingService.getAllAppBranding(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.appBrandingData = [];
				this.appBrandingData = res.data;
				this.totalCount = res.count;
			}
			this.isDataLoaded = true;
			this.isApiCall = false;
			this.spinnerService.hide();
		});
	}

	addAppBranding() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['general-settings/add-edit-general-settings']);
		}
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getAllSearchAppBranding(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getAllSearchAppBranding(this.inputSearchTxt);
		} else {
			this.getAllAppBranding(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getAllSearchAppBranding(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllSearchAppBranding(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllSearchAppBranding(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllAppBranding(this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllAppBranding(this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllAppBranding(this.page, this.limit);
			}
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
		let confirmMsg = this.appService.getTranslation('Confirm.appBranding.deleteMsg');
		let confirmationHeader = this.appService.getTranslation('Confirm.appBranding.confirmationHeader');
		let successMessage = this.appService.getTranslation('Confirm.appBranding.successMessage');
		this.confirmationService.confirm({
			message: confirmMsg,
			header: confirmationHeader,
			icon: 'fa fa-trash',
			accept: () => {
				this.spinnerService.show();
				this.appBrandingService.deleteClients(id).subscribe((res: any) => {
					if (res.success) {
						//   this.getClientData(this.page, this.limit);
						if (this.index >= 0) {
							this.toastr.success('Thank You! Request raised.', 'Success!');
						} else {
							this.toastr.success(successMessage, 'Success');
						}
					} else {
						this.spinnerService.hide();
						this.toastr.error(res.error, 'Error');
					}
				});
			},
		});
	}

	editAppBranding(item) {
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
			localStorage.setItem('generalSettingsPageNo', JSON.stringify(payload));
			if (item && item.System_branding && item.System_branding.id) {
				this.router.navigate([
					'general-settings/add-edit-general-settings',
					{ appBrandingId: item.System_branding.id },
				]);
			} else if (item && item.DiwoSystemBranding && item.DiwoSystemBranding.id) {
				this.router.navigate([
					'general-settings/add-edit-general-settings',
					{ appBrandingId: item.DiwoSystemBranding.id },
				]);
			}
		}
	}

	getAppbranding() {
		let userClient = JSON.parse(localStorage.getItem('client'));
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
			}
		});
	}

	cancel() {
		this.appBrandingForm.reset();
		$('#addAppBrandingModal').modal('hide');
	}

	getAllSearchAppBranding(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		if (this.FilterAppBrandingColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterAppBrandingColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterAppBrandingColumnForm.value.FilterColumn != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
			};
		} else {
			this.payload = {
				searchKey: key,
				filterColumn: [],
			};
		}

		localStorage.setItem('searchGeneralSettings', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllAppBranding(this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}

		if (this.inputSearchTxt && this.inputSearchTxt.length > 2) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.appBrandingService.getAllSearchAppBranding(this.payload, this.page, this.limit).subscribe((res: any) => {
					this.isApiCall = false;
					this.isDataLoaded = true;
					if (res.success) {
						this.appBrandingData = [];
						this.appBrandingData = res.data;
						this.totalCount = res.count;
					}
					setTimeout(() => {
						this.spinnerService.hide();
					}, 300);
				});
			}, this.appService.timeout);
		}
	}

	getTeamsAuthUrl() {
		this.appBrandingService.getTeamsAuthUrl().subscribe((res: any) => {
			if (res.success) {
				window.open(res.redirectUrl, '_self');
			}
		});
	}
}
