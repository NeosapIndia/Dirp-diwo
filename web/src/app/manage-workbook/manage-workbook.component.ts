import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { routerTransition } from '../router.animations';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
// import { IMyDpOptions } from 'mydatepicker';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import * as moment from 'moment';
import { AppService } from '../app.service';
import { ManageWorkbookService } from './manage-workbook.service';
import { ManageAssetsLibraryService } from '../manage-assets-library/manage-assets-library.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { environment } from 'src/environments/environment';
declare var $: any;

@Component({
	selector: 'app-manage-workbook',
	templateUrl: './manage-workbook.component.html',
	styleUrls: ['./manage-workbook.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageWorkbookComponent implements OnInit, AfterViewChecked {
	FilterWorkBookColumnForm: FormGroup;

	postForm: FormGroup;
	allWorkbookList = [];
	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;

	assignWorkbookForm: any;

	userClientId;
	copyHyperLinkData;

	seletedWorkbookIdForDelete;
	copyFlag: boolean = false;
	userDetails: any;
	userRoleId: any;
	assignWorkbookId: any;
	usersList: any;

	trainerList;
	learnerGroupList;
	learnerGroupListForWorkbook;

	showAssignLearner: boolean = true;
	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;

	FilterColumnArray = [
		{ label: 'Module Title', value: 'title' },
		{ label: 'Module Type', value: 'moduletype' },
		{ label: 'Course Title', value: 'courseName' },
		{ label: 'Author', value: 'first' },
		{ label: ' Module Id', value: 'moduleId' },
		{ label: 'Include Certification', value: 'include_certification' },

		{ label: 'Status', value: 'status' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
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
	filterColumn: any;
	showSelectAllOption: boolean = false;
	selectedWorkbookIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	writePermission: any;
	viewWorkBookUrl: string;
	typingTimer = null;
	isApiCall: boolean = false;
	userRole: string;
	isDataLoaded: boolean = false;
	latitude: number;
	longitude: number;
	locationName: any;
	iconObject = {
		search_loader: null,
		certificate: null,
		module_certificate_12: null,
	};

	isModuleAssigneToFacilator: boolean = false;
	isPerAssignSubmitted: boolean = false;

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		public appService: AppService,
		private workbookService: ManageWorkbookService,
		private assetService: ManageAssetsLibraryService,
		private router: Router,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.getAllClientList(this.userClientId);
		this.userDetails = JSON.parse(localStorage.getItem('user')).user || null;
		this.userRoleId = localStorage.getItem('roleId');
		this.userRole = localStorage.getItem('role') || null;
		// this.getLearnerGroupByUserId(this.userDetails.id, this.userClientId, this.userRoleId,this.page,this.limit);
		this.getLearnerGroupForWorkbookByUserId(this.userDetails.id, this.userClientId, this.userRoleId);

		this.createAssignWorkbookForm();
		this.getTrainerList(this.userClientId);
		this.createForm();
		this.FilterWorkBookColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchCourseBooks'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterWorkBookColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getWorkbookByFilter(this.inputSearchTxt);
		} else {
			this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
		}
		this.getAppBranding();
	}

	assinmentComingFromAssigmentPage() {
		let data = this.route.params['_value'];
		// console.log('-data-', data);
		if (data.comingfrom == 'assignment') {
			setTimeout(() => {
				// console.log('-workbookResult-', this.allWorkbookList);
				const Workbook = this.allWorkbookList.find((item) => item.id === parseInt(data.WorkbookId));
				// console.log('-workbookResult2-', Workbook);
				this.showAssignLearner = false;
				this.showAssignmentpopUP(Workbook);
			}, 800);
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getRollPermission() {
		let payload = {
			roleId: parseInt(this.userRoleId),
			permission: 'RW',
			menuId: [28],
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
		this.FilterWorkBookColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getWorkbookByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getWorkbookByFilter(this.inputSearchTxt);
		} else {
			this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getWorkbookByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getWorkbookByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getWorkbookByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
			}
		}
	}

	getTrainerList(clientId) {
		this.workbookService.getTrainerList(clientId).subscribe((res: any) => {
			if (res.success) {
				this.trainerList = [];
				this.trainerList = res.data;
			}
		});
	}

	// getLearnerGroupByUserId(userId, clientId, userRoleId,page,limit) {
	//     this.workbookService.getLearnerGroupByUserId(userId, clientId, userRoleId,page,limit).subscribe((res: any) => {
	//         if (res.success) {
	//             this.learnerGroupList = [];
	//             this.learnerGroupList = res.data;
	//         }
	//     })
	// }

	getLearnerGroupForWorkbookByUserId(userId, clientId, userRoleId) {
		this.workbookService.getLearnerGroupForWorkbookByUserId(userId, clientId, userRoleId).subscribe((res: any) => {
			if (res.success) {
				this.learnerGroupListForWorkbook = [];
				this.learnerGroupListForWorkbook = res.data;
			}
		});
	}

	createAssignWorkbookForm() {
		this.assignWorkbookForm = this.formBuilder.group(
			{
				learnerGroupIds: [null],
				trainerIds: [null],
			},
			{ validators: [this.atLeastOneSelectedValidator] }
		);
	}

	get f1() {
		return this.assignWorkbookForm.controls;
	}

	atLeastOneSelectedValidator(form: FormGroup) {
		const learnerGroupIds = form.get('learnerGroupIds')?.value;
		const trainerIds = form.get('trainerIds')?.value;

		if ((learnerGroupIds && learnerGroupIds.length) || (trainerIds && trainerIds.length)) {
			return null; // No error
		}

		return { atLeastOneRequired: true }; // Error if both are empty
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allWorkbookList.forEach((element, index) => {
				if (!this.selectedWorkbookIds.includes(element.id)) this.selectedWorkbookIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allWorkbookList.forEach((element, index) => {
				this.selectedWorkbookIds.push(element.id);
				let indexof = this.selectedWorkbookIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedWorkbookIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedWorkbookIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedWorkbookIds.indexOf(item.id) > -1) {
			this.selectedWorkbookIds.splice(this.selectedWorkbookIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedWorkbookIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedWorkbookIds.length == this.allWorkbookList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedWorkbookIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
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
		this.getAllWorkbookByClient(this.selectedClient.id, this.page, this.limit);
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getWorkbookByFilter(key) {
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

		if (this.FilterWorkBookColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterWorkBookColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterWorkBookColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterWorkBookColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterWorkBookColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchCourseBooks', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllWorkbookByClient(this.userClientId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.workbookService.getSearchWorkBook(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.allWorkbookList = res.data;
							this.totalCount = res.count;
							if (!this.isModuleAssigneToFacilator) {
								this.assinmentComingFromAssigmentPage();
							}
						} else {
							this.toastr.error(this.appService.getTranslation('Utils.error'));
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	copyWorkbook(data: any) {

		if (this.writePermission && data.DiwoModuleId != 5) {
			this.router.navigate(['add-edit-module', { moduleId: data.id, type: 'copy', copyClientId: data.ClientId }]);		
		} else if (this.writePermission && data.DiwoModuleId === 5) {
			this.router.navigate(['add-edit-scorm-module', { moduleId: data.id, type: 'copy', copyClientId: data.ClientId }]);
		}
	}

	// previewWorkbook(item: any) {
	// 	if (item.status !== 'Deleted') {
	// 		this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${item.id}`;			
	// 	}
	// }

	previewWorkbook(item: any) {
		if (item.status !== 'Deleted' && item.moduleType !== 'SCORM') {
			this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${item.id}`;
		}
	}

	getAllWorkbookByClient(clientId, page, limit) {
		this.workbookService.getAllWorkbookByClients(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.allWorkbookList = [];
				this.allWorkbookList = res.data;
				this.totalCount = res.count;
			}
			this.isDataLoaded = true;
			this.isApiCall = false;
		});

		if (!this.isModuleAssigneToFacilator) {
			this.assinmentComingFromAssigmentPage();
		}
	}

	editworkbook(workbook) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (workbook.status !== 'Deleted' && workbook.DiwoModuleId != 5) {
				let workbookId = workbook.id;
				this.router.navigate(['add-edit-module', { moduleId: workbookId, type: 'edit' }]);
			} else if (workbook.status !== 'Deleted' && workbook.DiwoModuleId === 5) {				
				let workbookId = workbook.id;
				this.router.navigate(['add-edit-scorm-module', { moduleId: workbookId, type: 'edit' }]);
			}
		}
	}

	viewWorkbook(workbook) {
		if (workbook.status !== 'Deleted') {
			let workbookId = workbook.id;
			this.router.navigate(['add-edit-module', { moduleId: workbookId, type: 'view' }]);
		}
	}

	assignModule(item) {
		if (this.writePermission && item.status != 'Deleted' && this.userRoleId != 2 && this.userRoleId != 3) {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			// localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
			this.router.navigate([
				'/diwo-module-assignment',
				{ moduleId: item?.BaseWorkbookId ? item?.BaseWorkbookId : item.id },
			]);
		}
	}

	createWorkBook() {
		if (this.writePermission) {
			this.router.navigate(['add-edit-module']);
			// this.toastr.error(this.appService.getTranslation('Utils.unauthorised'), this.appService.getTranslation('Utils.error'));
		}
	}

	cancelDripDeletePopUp() {
		this.seletedWorkbookIdForDelete = null;
		$('#deleteWorkbookModal').modal('hide');
	}

	copyText(workbook) {
		if (workbook.status == 'Published') {
			this.copyHyperLinkData = workbook.hyperLink;
			this.copyFlag = true;
			setTimeout(() => {
				let textBox = document.querySelector('#hyperLink') as HTMLInputElement;
				if (!textBox) return;
				textBox.select();
				document.execCommand('copy');
				this.copyFlag = false;
				this.toastr.success(
					this.appService.getTranslation('Pages.Workbook.Home.Toaster.wblinkcopied'),
					this.appService.getTranslation('Utils.success')
				);
			}, 100);
		}
	}

	deleteworkbook() {
		let record = this.allWorkbookList.filter((obj1) => this.selectedWorkbookIds.find((obj2) => obj1.id === obj2));
		for (let data of record) {
			if (data.status == 'Deleted') {
				return false;
			} else {
				this.seletedWorkbookIdForDelete = this.selectedWorkbookIds;
				$('#deleteWorkbookModal').modal('show');
			}
		}
	}

	removeWorkbook() {
		this.spinnerService.show();
		this.workbookService
			.deleteWorkbookByClient(this.seletedWorkbookIdForDelete, this.selectedClient.id)
			.subscribe((res: any) => {
				if (res.success) {
					$('#deleteWorkbookModal').modal('hide');
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.Workbook.Home.Toaster.wbdeleted'),
						this.appService.getTranslation('Utils.success')
					);
					this.getAllWorkbookByClient(this.selectedClient.id, this.page, this.limit);
					this.selectedWorkbookIds = [];
					this.appService.checkNotifcation = true;
				}
			});
	}

	showAssignmentpopUP(workbook) {
		if (workbook.status != 'Deleted' && this.userRoleId != 2 && this.userRoleId != 3) {
			this.assignWorkbookId = workbook.id;
			if (workbook && workbook.trainerList.length > 0) {
				let list = [];
				for (let trainer of workbook.trainerList) {
					list.push(trainer.id);
				}
				if (this.trainerList && this.trainerList.length > 0) {
					this.assignWorkbookForm.controls['trainerIds'].setValue(list);
				} else {
					this.assignWorkbookForm.controls['trainerIds'].setValue(null);
				}
			} else {
				this.assignWorkbookForm.controls['trainerIds'].setValue(null);
			}
			if (workbook && workbook.User_groups.length > 0) {
				let list = [];
				for (let group of workbook.User_groups) {
					list.push(group.id);
				}
				if (this.learnerGroupListForWorkbook && this.learnerGroupListForWorkbook.length > 0) {
					this.assignWorkbookForm.controls['learnerGroupIds'].setValue(list);
				} else {
					this.assignWorkbookForm.controls['learnerGroupIds'].setValue(null);
				}
			} else {
				this.assignWorkbookForm.controls['learnerGroupIds'].setValue(null);
			}
			$('#preAssignModel').modal('show');
		}
	}

	cancelPreAssignPopUp() {
		$('#preAssignModel').modal('hide');
		this.isPerAssignSubmitted = false;
	}

	onassignedWoorkbookFormSubmit() {
		this.isPerAssignSubmitted = true;
		if (this.assignWorkbookForm.invalid) {
			this.markAsTouched(this.assignWorkbookForm);
			return;
		}

		this.spinnerService.show();
		this.workbookService
			.assignmentWorkbook(this.assignWorkbookForm.value, this.userClientId, this.assignWorkbookId)
			.subscribe((res: any) => {
				if (res.success) {
					this.assignWorkbookId = null;
					this.appService.checkNotifcation = true;
					this.assignWorkbookForm.reset();
					this.isModuleAssigneToFacilator = true;
					//toster Message
					this.toastr.success(
						this.appService.getTranslation('Pages.Workbook.Home.Toaster.assigned'),
						this.appService.getTranslation('Utils.success')
					);
					this.getAllWorkbookByClient(this.selectedClient.id, this.page, this.limit);
					$('#preAssignModel').modal('hide');
				}
				this.isPerAssignSubmitted = false;
				this.spinnerService.hide();
			});
	}

	changeAssignTab() {
		this.showAssignLearner = !this.showAssignLearner;
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getWorkbookByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getWorkbookByFilter(this.inputSearchTxt);
		}
	}
}
