import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import { AppService } from '../app.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { ManageOptInsService } from './manage-opt-ins.service';
import * as moment from 'moment';

declare var $: any;
@Component({
	selector: 'app-manage-opt-ins',
	templateUrl: './manage-opt-ins.component.html',
	styleUrls: ['./manage-opt-ins.component.scss'],
})
export class ManageOptInsComponent implements OnInit {
	marketList: any = [];
	FilterOptInColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'User Name', value: 'name' },
		{ label: 'Market', value: 'market' },
		{ label: 'Policy Type', value: 'policyType' },
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
	OptInsData: any[] = [];
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	formula: string = 'Acceptance log report';
	roleId: any;
	writePermission: any;
	ClientId: any;
	clientAccountList = [];
	selectedClientIdForDownload;
	inputSearchTxt: any;
	prevSearchKey: any;
	typingTimer = null;
	isApiCall: boolean = false;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private spinnerService: NgxSpinnerService,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private optInsService: ManageOptInsService
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.ClientId = JSON.parse(localStorage.getItem('client')).id;
		this.createForm();
		this.FilterOptInColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();
		this.getAllClientAccountList();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchOptIn'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterOptInColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getOptInByFilter(this.inputSearchTxt);
		} else {
			this.getAllPolicyLogs();
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getAllPolicyLogs() {
		this.optInsService.getAllPolicyLogs().subscribe((res: any) => {
			if (res.success) {
				this.OptInsData = [];
				this.OptInsData = res.data;
			}
			this.isDataLoaded = true;
			this.isApiCall = false;
		});
	}

	getAllClientAccountList() {
		this.spinnerService.show();
		this.optInsService.getAllClientAccount(this.ClientId).subscribe((res: any) => {
			if (res.success) {
				this.clientAccountList = [];
				this.clientAccountList = res.data;
			}
			this.spinnerService.hide();
		});
	}

	createForm() {
		this.FilterOptInColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [22],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	cancel() {
		$('#addAcceptanceLogModal').modal('hide');
	}

	selectClientAccount(event) {
		this.selectedClientIdForDownload = event.id;
	}

	openAcceptanceLog() {
		$('#addAcceptanceLogModal').modal('show');
	}

	addPolicy() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/opt-ins/add-or-edit-opt-ins']);
		}
	}

	downloadAcceptanceLogData() {
		this.optInsService.getAcceptanceLogData(this.selectedClientIdForDownload).subscribe(async (res: any) => {
			if (res.success) {
				let finalData = [];
				for (let list of res.data) {
					let payload = {
						'User Id': list.User.account_id,
						'User Type': list.User.type,
						'Client Account Name': list.Client.name,
						'Account Id': list.Client.client_id,
						'Acceptance Event': list.type,
						'Items Accepted': list && list.policyType ? list.policyType : '',
						'Acceptance Date': ' ' + moment(list.acceptDate).local().format('YYYY-MM-DD HH:mm:ss'),
						'Acceptance Type': list.acceptanceType,
					};
					finalData.push(payload);
				}

				var options = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: false,
					showTitle: false,
					title: 'Acceptance log CSV',
					useBom: false,
					noDownload: false,
					headers: [
						'User Id',
						'User Type',
						'Client Account Name',
						'Account Id',
						'Acceptance Event',
						'Items Accepted',
						'Acceptance Date',
						'Acceptance Type',
					],
				};
				finalData = await this.appService.sanitizedData(finalData);
				const fileInfo = new ngxCsv(finalData, this.formula, options);
			}
		});
	}

	download(item) {
		let payload = {
			path: item.filePath,
		};
		this.optInsService
			.downloadOPtIn(payload)
			.toPromise()
			.then((res: any) => {
				let link = document.createElement('a');
				link.href = window.URL.createObjectURL(res);
				let name = item.filePath.split('/');
				let fileName = name[name.length - 1];
				link.download = `${fileName}`;
				link.click();
				this.toastr.success(
					this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'),
					this.appService.getTranslation('Utils.success')
				);
			});
	}

	getOptInByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		if (this.FilterOptInColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterOptInColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}
		if (this.FilterOptInColumnForm.value.FilterColumn != null) {
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
		localStorage.setItem('searchOptIn', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllPolicyLogs();
			clearTimeout(this.typingTimer);
			return;
		}

		if (this.inputSearchTxt && this.inputSearchTxt.length > 2) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.optInsService.getFilteredOptIn(this.payload).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.OptInsData = res.data;
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

	cancelPopUp() {
		$('#addAcceptanceLogModal').modal('hide');
	}
}
