import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ManageWhatsAppSetupService } from './manage-whatsapp-setups.service';
import { AppService } from '../app.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
declare var $: any;

@Component({
	selector: 'app-manage-whatsapp-setups',
	templateUrl: './manage-whatsapp-setups.component.html',
	styleUrls: ['./manage-whatsapp-setups.component.scss'],
	animations: [routerTransition()],
})
export class ManageWhatsAppSetupComponent implements OnInit {
	whatsAppSetupData: any[] = [];
	selectedWhataAppSetupId: any;
	selectedClientForActivate: any;
	searchFilter: any;
	userClient: any;
	roleId: any;
	writePermission: any;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	inputSearchTxt: any;

	FilterWhatsappSetupColumnForm: FormGroup;
	projectType = 'drip';
	FilterColumnArray = [
		{ label: 'Account Id', value: 'client_id' },
		{ label: 'Account Name', value: 'name' },
		// { label: "Parent Account Name", value: "parentname", },
		// { label: "Parent Account Id", value: 'parentId', },
		{ label: 'Status', value: 'status' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	payload: { searchKey: any; filterColumn: any };
	prevSearchKey: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private WhatsappSetupService: ManageWhatsAppSetupService,
		private router: Router,
		public appService: AppService,
		private fb: FormBuilder
	) {
		if (localStorage.getItem('projectName') && localStorage.getItem('projectName') == 'diwo') {
			this.projectType = 'diwo';
		}
	}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClient = JSON.parse(localStorage.getItem('client'));
		if (JSON.parse(localStorage.getItem('WhatsappSetupPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('WhatsappSetupPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.getRollPermission();
		this.createForm();
		this.FilterWhatsappSetupColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchWhatsappSetups'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterWhatsappSetupColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getWhatsSetupByFilter(this.inputSearchTxt);
		} else {
			this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
		}
		localStorage.removeItem('WhatsappSetupPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterWhatsappSetupColumnForm = this.fb.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [16],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	addWhatsappSetup() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/whatsapp-setup/add-or-edit-whatsapp-setup']);
		}
	}

	getWhatsAppSetupData(clientid, page, limit) {
		this.spinnerService.show();
		this.WhatsappSetupService.getAllWhatsAppSetup(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.whatsAppSetupData = [];
				for (let client of res.data) {
					this.whatsAppSetupData.push(client);
					this.totalCount = res.count;
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

	editWhatsAppSetup(setupId) {
		if (this.writePermission) {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('WhatsappSetupPageNo', JSON.stringify(payload));
			// this.router.navigate(['/whatsapp-setup/add-or-edit-whatsapp-setup'], {
			// 	queryParams: { whatsAppSetupId: setupId },
			// });
			this.router.navigate(['/whatsapp-setup/add-or-edit-whatsapp-setup', { whatsAppSetupId: setupId, type: 'edit' }]);
		}
	}

	deleteWhatsAppSetup(whatsAppSetup) {
		if (this.writePermission) {
			if (whatsAppSetup && whatsAppSetup.status != 'Deleted') {
				this.selectedWhataAppSetupId = whatsAppSetup.WhatsAppSetupId;
				$('#whatsAppSetupDeleteModel').modal('show');
			}
		}
	}

	viewWhatsAppSetup(setupId) {
		let payload = {
			pageNo: this.page,
			isPageChange: false,
		};
		localStorage.setItem('WhatsappSetupPageNo', JSON.stringify(payload));
		this.router.navigate(['/whatsapp-setup/add-or-edit-whatsapp-setup', { whatsAppSetupId: setupId, type: 'view' }]);
	}

	onDeleteFormSubmit() {
		this.spinnerService.show();
		this.WhatsappSetupService.deleteWhatsAppSetup(this.selectedWhataAppSetupId).subscribe((res: any) => {
			if (res.success) {
				this.selectedWhataAppSetupId = null;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
				$('#whatsAppSetupDeleteModel').modal('hide');
				this.toastr.success(
					this.appService.getTranslation('Pages.WhatsAppSetups.Home.Toaster.setupdeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	cancelDeleteModal() {
		$('#whatsAppSetupDeleteModel').modal('hide');
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getWhatsSetupByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getWhatsSetupByFilter(this.inputSearchTxt);
		} else {
			this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt != undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			}
		}
	}
	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getWhatsSetupByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		let chars;

		if (key !== null && key !== undefined && key !== '') {
			if (this.isNumber(key)) {
				chars = 0;
			} else {
				chars = 2;
			}
		}

		if (this.FilterWhatsappSetupColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterWhatsappSetupColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}
		if (this.FilterWhatsappSetupColumnForm.value.FilterColumn != null) {
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
		localStorage.setItem('searchWhatsappSetups', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getWhatsAppSetupData(this.userClient.id, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.WhatsappSetupService.getSearchWhatsAppSetup(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.whatsAppSetupData = [];
							for (let client of res.data) {
								this.whatsAppSetupData.push(client);
							}
							this.totalCount = res.count;
						} else {
							this.toastr.error(res.error, 'Error');
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}
}
