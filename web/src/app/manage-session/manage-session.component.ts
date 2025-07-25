import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { routerTransition } from '../router.animations';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
// import { IMyDpOptions } from 'mydatepicker';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import * as moment from 'moment';
import { AppService } from '../app.service';

import { ManageAssetsLibraryService } from '../manage-assets-library/manage-assets-library.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageSessionService } from './manage-session.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
declare var $: any;

@Component({
	selector: 'app-manage-session',
	templateUrl: './manage-session.component.html',
	styleUrls: ['./manage-session.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageSessionComponent implements OnInit, AfterViewChecked {
	postForm: FormGroup;
	allSessionList = [];
	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;
	userClientId;
	copyHyperLinkData;
	seletedWorkbookIdForDelete;
	copyFlag: boolean = false;
	deleteSessionId: any;
	searchFilter: any;

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;

	FilterSessionColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Session Title', value: 'title' },
		{ label: 'Course Title', value: 'course' },
		{ label: 'Session Type', value: 'sessionType' },
		{ label: 'Facilitator', value: 'first' },
		// { label: 'Location', value: 'location' },
		{ label: 'Pathway Title', value: 'pathway' },
		{ label: 'Assignment Id', value: 'assignmentId' },
		{ label: 'Session Id', value: 'id' },
		{ label: 'Status', value: 'status' },
	];

	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};

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

	selectedDate: { startDate: any; endDate: any };
	payload: { searchKey: any; filterColumn: any; selectedDate: any };
	filterColumn: any;

	showSelectAllOption: boolean = false;
	selectedSessionIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	writePermission: any;
	userRoleId;
	userRoleName: string;
	userId: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		public appService: AppService,
		private sessionService: ManageSessionService,
		private assetService: ManageAssetsLibraryService,
		private router: Router,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.userRoleId = localStorage.getItem('roleId');
		this.userRoleName = localStorage.getItem('role');
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.getAllClientList(this.userClientId);
		let session = this.route.params['_value'];
		if (session && session.from && session.from == 'Analytics') {
			this.spinnerService.show();
			setTimeout(() => {
				this.getSessionByFilter('Closed');
			}, 400);
			let test: any = document.getElementById('search') as HTMLInputElement | null;
			test.value = 'Closed';
		}
		// else {
		// 	this.getSessionList(this.userClientId, this.page, this.limit);
		// }
		this.createForm();
		this.FilterSessionColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchSessions'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterSessionColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getSessionByFilter(this.inputSearchTxt);
		} else {
			this.getSessionList(this.userClientId, this.page, this.limit);
		}
		this.getRollPermission();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	createForm() {
		this.FilterSessionColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	getRollPermission() {
		let payload = {
			roleId: parseInt(this.userRoleId),
			permission: 'RW',
			menuId: [29],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getSessionList(clientId, page, limit) {
		this.sessionService.getAllSessionByClient(clientId, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.allSessionList = [];
				this.allSessionList = res.data;

				this.totalCount = res.count;
			}
			this.isApiCall = false;
			this.isDataLoaded = true;
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
		// this.getAllWorkbookByClient(this.selectedClient.id);
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
		this.getSessionList(this.selectedClient.id, this.page, this.limit);
	}

	showDeletePopUp() {
		// let record = this.allSessionList.filter(elem => elem.id == this.selectedSessionIds);
		let record = this.allSessionList.filter((obj1) => this.selectedSessionIds.find((obj2) => obj1.id === obj2));
		for (let data of record) {
			if (data.status == 'Deleted') {
				return false;
			} else {
				this.deleteSessionId = this.selectedSessionIds;
				$('#deleteSessionModal').modal('show');
			}
		}
	}

	cancelSessionDeletePopup() {
		$('#deleteSessionModal').modal('hide');
		this.deleteSessionId = null;
	}

	deleteSession() {
		$('#deleteSessionModal').modal('hide');
		this.sessionService.deleteSession(this.deleteSessionId).subscribe((res: any) => {
			if (res.success) {
				this.toastr.success(
					this.appService.getTranslation('Pages.Session.Home.Toaster.sessiondeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.deleteSessionId = null;
				this.getSessionList(this.userClientId, this.page, this.limit);
				this.selectedSessionIds = [];
			}
		});
	}

	editSeesion(session) {
		if (session.status !== 'Deleted') {
			if (
				(session.status == 'Closed' && this.userRoleName == 'Business Manager') ||
				(session.status == 'Planned' && this.userRoleId != 11)
			) {
				return;
			} else {
				if (session.status == 'Planned') {
					let sessionId = session.id;
					this.router.navigate(['add-edit-session', { sessionId: sessionId }]);
				} else if (session.status == 'Live' || session.status == 'Closed' || session.status == 'Ended') {
					let sessionId = session.id;
					this.router.navigate(['session-timeline', { sessionId: sessionId }]);
				}
			}
		}
	}

	sessionReport(session) {
		if (session.status !== 'Deleted' && session.status !== 'Planned') {
			let sessionId = session.id;
			this.router.navigate(['session-timeline', { sessionId: sessionId }]);
		}
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getSessionByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getSessionByFilter(this.inputSearchTxt);
		} else {
			this.getSessionList(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getSessionByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getSessionByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getSessionByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getSessionList(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getSessionList(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getSessionList(this.userClientId, this.page, this.limit);
			}
		}
	}

	getSessionByFilter(key) {
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

		if (this.FilterSessionColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterSessionColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterSessionColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterSessionColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterSessionColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchSessions', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getSessionList(this.userClientId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}

		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.sessionService.getSearchSession(this.userClientId, this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.allSessionList = res.data;
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

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allSessionList.forEach((element, index) => {
				if (!this.selectedSessionIds.includes(element.id)) this.selectedSessionIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allSessionList.forEach((element, index) => {
				this.selectedSessionIds.push(element.id);
				let indexof = this.selectedSessionIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedSessionIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedSessionIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedSessionIds.indexOf(item.id) > -1) {
			this.selectedSessionIds.splice(this.selectedSessionIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedSessionIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedSessionIds.length == this.allSessionList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedSessionIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	addSession() {
		if (this.writePermission) {
			this.router.navigate(['add-edit-session']);
			// this.toastr.error(this.appService.getTranslation('Utils.unauthorised'), this.appService.getTranslation('Utils.error'));
		}
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getSessionByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getSessionByFilter(this.inputSearchTxt);
		}
	}
}
