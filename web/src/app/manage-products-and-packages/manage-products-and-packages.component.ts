import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ManageProductsAndPackagesService } from './manage-products-and-packages.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { AppService } from '../app.service';
declare var $: any;

@Component({
	selector: 'app-manage-products-and-packages',
	templateUrl: './manage-products-and-packages.component.html',
	styleUrls: ['./manage-products-and-packages.component.scss'],
	animations: [routerTransition()],
})
export class ManageProductsAndPackagesComponent implements OnInit, AfterViewChecked {
	ClientData: any[] = [];
	selectedClientForSuspend: any;
	selectedClientForActivate: any;
	FilterColumnForm: FormGroup;
	filterColumn: any;
	selectedDate: { startDate: any; endDate: any };
	payload: { searchKey: any; filterColumn: any; selectedDate: any };
	FilterColumnArray = [
		{ label: 'Account Name', value: 'name' },
		{ label: 'License Name', value: 'title' },
		{ label: 'Contact Count', value: 'learnerCount' },
		{ label: 'Drip Volume', value: 'dripVolume' },
		{ label: 'Account Id', value: 'client_id' },
		{ label: 'Status', value: 'status' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	userClient: any;

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;

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
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	writePermission: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private LicenseService: ManageProductsAndPackagesService,
		private router: Router,
		private cdr: ChangeDetectorRef,
		public appService: AppService
	) {}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		if (JSON.parse(localStorage.getItem('driplicensePageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('driplicensePageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.createForm();
		this.FilterColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchDripLicenses'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getLicenseByFilter(this.inputSearchTxt);
		} else {
			this.getClientData(this.page, this.limit);
		}
		localStorage.removeItem('driplicensePageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [19],
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
		this.FilterColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	getClientData(page, limit) {
		this.spinnerService.show();
		this.LicenseService.getAllClientWithLicense(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.ClientData = [];
				for (let client of res.data) {
					this.ClientData.push(client);
				}
				this.totalCount = res.count;
				this.isApiCall = false;
				this.isDataLoaded = true;
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

	addLicense() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/licenses/add-or-edit-license']);
		}
	}

	editClient(editClientData) {
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
			localStorage.setItem('driplicensePageNo', JSON.stringify(payload));
			this.router.navigate(['/licenses/add-or-edit-license'], { queryParams: { clientId: editClientData.id } });
		}
	}

	viewClient(editClientData) {
		this.router.navigate(['/licenses/view-license'], { queryParams: { clientId: editClientData.ClientId } });
	}

	suspendClient(suspendClientId) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedClientForSuspend = suspendClientId;
			if (this.selectedClientForSuspend) {
				$('#suspedClientModal').modal('show');
			}
		}
	}

	ActivatesuspendClient(ActivatesuspendClientId) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedClientForActivate = ActivatesuspendClientId;
			if (this.selectedClientForActivate) {
				$('#ActivatesuspedClientModal').modal('show');
			}
		}
	}

	onSuspendFormSubmit() {
		this.spinnerService.show();
		this.LicenseService.suspendClient(this.selectedClientForSuspend).subscribe((res: any) => {
			if (res.success) {
				this.selectedClientForSuspend = null;
				this.getClientData(this.page, this.limit);
				$('#suspedClientModal').modal('hide');
				this.toastr.success(
					this.appService.getTranslation('Pages.License.Home.Toaster.suspendlicense'),
					this.appService.getTranslation('Utils.success')
				);
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	cancelSuspedClientModal() {
		$('#suspedClientModal').modal('hide');
	}

	ActivatedSuspendFormSubmit() {
		this.spinnerService.show();
		this.LicenseService.activateSuspendClient(this.selectedClientForActivate).subscribe((res: any) => {
			if (res.success) {
				this.selectedClientForActivate = null;
				this.getClientData(this.page, this.limit);
				$('#ActivatesuspedClientModal').modal('hide');
				if (res.message == 'License expired!') {
					this.toastr.success(
						this.appService.getTranslation('Pages.License.Home.Toaster.expirelicense'),
						this.appService.getTranslation('Utils.success')
					);
				} else {
					this.toastr.success(
						this.appService.getTranslation('Pages.License.Home.Toaster.activatelicense'),
						this.appService.getTranslation('Utils.success')
					);
				}
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	cancelActivateSuspedClientModal() {
		$('#ActivatesuspedClientModal').modal('hide');
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getLicenseByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getLicenseByFilter(this.inputSearchTxt);
		} else {
			this.getClientData(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getLicenseByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getLicenseByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getLicenseByFilter(this.inputSearchTxt);
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

	getLicenseByFilter(key) {
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

		if (this.FilterColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchDripLicenses', JSON.stringify(this.payload));

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
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.LicenseService.getFilteredLicense(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						if (res.success) {
							this.ClientData = [];
							this.totalCount = res.count;
							for (let client of res.data) {
								this.ClientData.push(client);
							}
							setTimeout(() => {
								this.spinnerService.hide();
							}, 300);
							this.isApiCall = false;
							this.isDataLoaded = true;
						} else {
							this.spinnerService.hide();
							this.isApiCall = false;
							this.isDataLoaded = true;
							this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getLicenseByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getLicenseByFilter(this.inputSearchTxt);
		}
	}
}
