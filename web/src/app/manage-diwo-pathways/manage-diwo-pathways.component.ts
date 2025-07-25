import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { AppService } from '../app.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ManagetDiwoPathwaysService } from './manage-diwo-pathways.service';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-diwo-pathways',
	templateUrl: './manage-diwo-pathways.component.html',
	styleUrls: ['./manage-diwo-pathways.component.scss'],
	animations: [routerTransition()],
})
export class ManageDiwoPathwayComponent implements OnInit {
	pathwaysList: any[] = [];
	userClient: any;
	roleId: any;
	writePermission: any;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	inputSearchTxt: any;

	FilterPathwayColumnForm: FormGroup;
	projectType = 'drip';

	FilterColumnArray = [
		{ label: 'Pathway Title', value: 'title' },
		{ label: 'Author', value: 'author' },
		{ label: 'Total Courses', value: 'totalcourses' },
		{ label: 'Total Modules', value: 'totalmodules' },
		{ label: 'Estimate Duration', value: 'estimateduration' },
		{ label: 'Pathway Id', value: 'pathwayId' },
		{ label: 'Status', value: 'status' },
	];

	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};

	filterColumn: any;
	prevSearchKey: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;

	payload: { searchKey: any; filterColumn: any; selectedDate: any };
	selectedDate: { startDate: any; endDate: any };
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

	iconObject = {
		search_loader: null,
		module_certificate_12: null,
	};

	selectedPathwayIds: any = [];
	selectAllFlag: boolean;
	showSelectAllOption: boolean;
	selectedPathwayFordelete: any;

	clientListNames = [];
	clientList = [];
	selectedClientName: any;
	selectedClient: any;

	constructor(
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private pathwayService: ManagetDiwoPathwaysService,
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
		this.getAllClientList(this.userClient.id);
		if (JSON.parse(localStorage.getItem('diwoPathwayPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('diwoPathwayPageNo'));
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
		this.FilterPathwayColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchDiwoPathway'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterPathwayColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getDiwoPathwaysByFilter(this.inputSearchTxt);
		} else {
			this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
		}
		localStorage.removeItem('diwoPathwayPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterPathwayColumnForm = this.fb.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [34],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getAllPathwaysData(clientid, page, limit) {
		this.spinnerService.show();
		this.pathwayService.getAllDiwoPathways(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.pathwaysList = [];
				for (let pathway of res.data) {
					this.pathwaysList.push(pathway);
				}
				this.totalCount = res.count;
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

	addDiwoPathways() {
		if (this.writePermission) {
			this.router.navigate(['/diwo-pathways/add-or-edit-diwo-pathway']);
		}
	}

	editPathway(item) {
		if (this.writePermission && item.status != 'Deleted') {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
			this.router.navigate(['/diwo-pathways/add-or-edit-diwo-pathway', { pathwayId: item.id, type: 'edit' }]);
		}
	}

	copyPathway(item) {
		if (this.writePermission && item.status != 'Deleted') {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
			this.router.navigate(['/diwo-pathways/add-or-edit-diwo-pathway', { pathwayId: item.id, type: 'copy' }]);
		}
	}

	assignPathway(item) {
		if (this.writePermission && item.status != 'Deleted' && item.status != 'Draft') {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
			this.router.navigate(['/diwo-pathway-assignment', { pathwayId: item.id }]);
		}
	}

	viewPathway(item) {
		if (item.status != 'Deleted') {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
			this.router.navigate(['/diwo-pathways/add-or-edit-diwo-pathway', { pathwayId: item.id, type: 'view' }]);
		}
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getDiwoPathwaysByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getDiwoPathwaysByFilter(this.inputSearchTxt);
		} else {
			this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt != undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			}
		}
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getDiwoPathwaysByFilter(key) {
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

		if (this.FilterPathwayColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterPathwayColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterPathwayColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterPathwayColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterPathwayColumnForm.value.FilterColumn == null) {
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

		localStorage.setItem('searchDiwoPathway', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.pathwayService.getSearchDiwoPathway(this.userClient.id, this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.pathwaysList = [];
							for (let pathway of res.data) {
								this.pathwaysList.push(pathway);
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

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getDiwoPathwaysByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getDiwoPathwaysByFilter(this.inputSearchTxt);
		}
	}

	placeholder() {
		this.selectedPathwayIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedPathwayIds.indexOf(item.id) > -1) {
			this.selectedPathwayIds.splice(this.selectedPathwayIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedPathwayIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedPathwayIds.length == this.pathwaysList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.pathwaysList.forEach((element, index) => {
				if (!this.selectedPathwayIds.includes(element.id)) this.selectedPathwayIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.pathwaysList.forEach((element, index) => {
				this.selectedPathwayIds.push(element.id);
				let indexof = this.selectedPathwayIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedPathwayIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedPathwayIds = [];
		}
	}

	deletePathways() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let record = this.pathwaysList.filter((obj1) => this.selectedPathwayIds.find((obj2) => obj1.id === obj2));
			for (let data of record) {
				if (data.status == 'Deleted') {
					return false;
				} else {
					this.selectedPathwayFordelete = this.selectedPathwayIds;
					$('#deletePathwayModal').modal('show');
				}
			}
		}
	}

	cancelDeletePathwayPopUp() {
		$('#deletePathwayModal').modal('hide');
		this.selectedPathwayFordelete = null;
	}

	removePathway() {
		this.spinnerService.show();
		this.pathwayService.deletePathways(this.userClient.id, this.selectedPathwayFordelete).subscribe((res: any) => {
			if (res.success) {
				$('#deletePathwayModal').modal('hide');
				this.selectedPathwayFordelete = null;
				this.spinnerService.hide();
				this.toastr.success(
					this.appService.getTranslation('Pages.DiwoPathways.Home.Toaster.pathwaysdeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.appService.checkNotifcation = true;
				this.selectedPathwayIds = [];
				this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
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
		}
	}

	getAllClientList(userClientId) {
		this.spinnerService.show();
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let client of res.data) {
					this.clientListNames.push(client.name);
				}
				this.addClientList(res.data);
			}
			this.spinnerService.hide();
		});
	}

	changeBuyer(client) {
		this.selectedClient = client;
		this.selectedClientName = client.name;
		this.getAllPathwaysData(this.userClient.id, this.page, this.limit);
	}
}
