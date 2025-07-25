import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { routerTransition } from '../router.animations';
import { ManageLearnerGroupsService } from './manage-learner-groups.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-learner-groups',
	templateUrl: './manage-learner-groups.component.html',
	styleUrls: ['./manage-learner-groups.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageLearnerGroupsComponent implements OnInit, AfterViewChecked {
	CampaignData: any[] = [];
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index: any;
	searchStr: any;
	disableInputField: boolean = false;
	writePermission: any;
	LearnerGroupsData: any = [];
	userClient: any;
	userDetails: any;
	userRoleId: any;
	selectedLearnerGroupIdForDelete: any;
	FilterLearnerGroupColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Group Id', value: 'id' },
		{ label: 'Group Name', value: 'title' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
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
	selectedLearnerGroupIds: any = [];
	selectAllFlag: boolean;
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	selectedClientId: any;
	userId: any;
	client_List = [];
	ownUserRoleList = [
		{ RoleId: 6, name: 'Client Admin' },
		{ RoleId: 7, name: 'Branch Admin' },
	];
	ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
	userListForOwnList = [];
	learnerGroupId: any;
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
		private learnerGroupsService: ManageLearnerGroupsService,
		public appService: AppService,
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user || null;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.type = this.learnerGroupsService.type;
		if (JSON.parse(localStorage.getItem('learnerGroupPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('learnerGroupPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.createForm();
		this.FilterLearnerGroupColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();
		let searchKeyData: any = JSON.parse(localStorage.getItem('searchLearnerGroups'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterLearnerGroupColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getLearnerGroupsByFilter(this.inputSearchTxt);
		} else {
			this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
		}
		localStorage.removeItem('learnerGroupPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [9],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	createForm() {
		this.FilterLearnerGroupColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	getLearnerGroupByUserId(userId, clientId, userRoleId, page, limit) {
		this.spinnerService.show();
		this.learnerGroupsService
			.getLearnerGroupByUserId(userId, clientId, userRoleId, page, limit)
			.subscribe((res: any) => {
				if (res.success) {
					this.LearnerGroupsData = [];
					this.LearnerGroupsData = res.data;
					this.totalCount = res.count;
				}
				this.isApiCall = false;
				this.isDataLoaded = true;
				this.spinnerService.hide();
			});
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.LearnerGroupsData.forEach((element, index) => {
				if (!this.selectedLearnerGroupIds.includes(element.id)) this.selectedLearnerGroupIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.LearnerGroupsData.forEach((element, index) => {
				this.selectedLearnerGroupIds.push(element.id);
				let indexof = this.selectedLearnerGroupIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedLearnerGroupIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedLearnerGroupIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedLearnerGroupIds.indexOf(item.id) > -1) {
			this.selectedLearnerGroupIds.splice(this.selectedLearnerGroupIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedLearnerGroupIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedLearnerGroupIds.length == this.LearnerGroupsData.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedLearnerGroupIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	fetchActivity() {}

	// getCampaignData(pageCount, limit) {
	//     return
	//     this.spinnerService.show();
	//     this.learnerGroupsService.getCampaignData(pageCount, limit).subscribe((res: any) => {
	//         setTimeout(() => {
	//             this.spinnerService.hide();
	//         }, 300);
	//         if (res.success) {
	//             this.CampaignData = res.data;
	//             this.totalCount = res.count;
	//         } else {
	//             this.toastr.error(res.error, 'Error');
	//         }
	//     });
	// }

	// getCampaignByFilter(eve) {
	//     this.searchStr = eve
	//     if (this.searchStr.length == 0) {
	//         this.getCampaignData(this.page, this.limit)
	//     }
	//     if (this.searchStr.length > 2) {
	//         this.spinnerService.show();
	//         this.learnerGroupsService.getCampaignDataBySearch(this.searchStr).subscribe((res: any) => {
	//             setTimeout(() => {
	//                 this.spinnerService.hide();
	//             }, 300);
	//             if (res.success) {
	//                 this.CampaignData = res.data;
	//                 this.totalCount = res.count;
	//             }
	//         });
	//     }
	// }

	openCampaignModal() {
		// if (!this.writePermission) {
		//     this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
		//     return;
		// }
		$('#addCampaignModal').modal('show');
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getLearnerGroupsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getLearnerGroupsByFilter(this.inputSearchTxt);
		} else {
			this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt != undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getLearnerGroupsByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getLearnerGroupsByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getLearnerGroupsByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
			}
		}
	}

	cancel() {
		$('#deleteLearnerGroupModal').modal('hide');
		this.disableInputField = false;
	}

	addLearnerGroup() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (this.type == 'drip') {
				this.router.navigate(['/contact-groups/add-or-edit-contact-group']);
			} else if (this.type == 'diwo') {
				this.router.navigate(['/learner-groups/add-or-edit-learner-group']);
			}
		}
	}

	onEdit(data) {
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
			localStorage.setItem('learnerGroupPageNo', JSON.stringify(payload));
			if (this.type == 'drip') {
				this.router.navigate(['/contact-groups/add-or-edit-contact-group', { GroupId: data.id, type: 'edit' }]);
			} else if (this.type == 'diwo') {
				this.router.navigate(['/learner-groups/add-or-edit-learner-group', { GroupId: data.id, type: 'edit' }]);
			}
		}
	}

	onCopy(data) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (this.type == 'drip') {
				this.router.navigate(['/contact-groups/add-or-edit-contact-group', { GroupId: data.id, type: 'copy' }]);
			} else if (this.type == 'diwo') {
				this.router.navigate(['/learner-groups/add-or-edit-learner-group', { GroupId: data.id, type: 'copy' }]);
			}
		}
	}

	onDelete() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			$('#deleteLearnerGroupModal').modal('show');
			this.selectedLearnerGroupIdForDelete = this.selectedLearnerGroupIds;
		}
	}

	deleteGroup() {
		this.spinnerService.show();
		this.learnerGroupsService
			.deleteLearnerUserGroup(this.userDetails.id, this.selectedLearnerGroupIdForDelete)
			.subscribe((res: any) => {
				if (res.success) {
					$('#deleteLearnerGroupModal').modal('hide');
					this.spinnerService.hide();
					this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
					this.selectedLearnerGroupIds = [];
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.LearnerGroup.Home.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						if (this.type === 'drip') {
							this.toastr.success(
								this.appService.getTranslation('Pages.LearnerGroup.Home.Toaster.contactgroupdeleted'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.LearnerGroup.Home.Toaster.learnergroupdeleted'),
								this.appService.getTranslation('Utils.success')
							);
						}
					}
					this.appService.checkNotifcation = true;
				} else {
					$('#deleteLearnerGroupModal').modal('hide');
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					this.selectedLearnerGroupIds = [];
				}
			});
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getLearnerGroupsByFilter(eve) {
		this.inputSearchTxt = eve;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = eve;

		let chars;
		if (eve) {
			if (this.isNumber(eve)) {
				chars = 0;
			} else {
				chars = 2;
			}
		}

		if (this.FilterLearnerGroupColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterLearnerGroupColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterLearnerGroupColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: eve,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterLearnerGroupColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: eve,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterLearnerGroupColumnForm.value.FilterColumn == null) {
			this.payload = {
				searchKey: eve,
				filterColumn: [],
				selectedDate: this.selectedDate,
			};
		} else {
			this.payload = {
				searchKey: eve,
				filterColumn: [],
				selectedDate: { startDate: null, endDate: null },
			};
		}
		localStorage.setItem('searchLearnerGroups', JSON.stringify(this.payload));
		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.learnerGroupsService
					.getLearnerGroupsBySearch(this.payload, this.page, this.limit)
					.subscribe((res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.LearnerGroupsData = res.data;
							this.totalCount = res.count;
						}
					});
			}, this.appService.timeout);
		}
	}

	transferLearnerGroup(item) {
		this.learnerGroupId = item.id;
		this.learnerGroupsService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				// this.selectedClientId = null;
				this.client_List = [];
				this.client_List = res.data;
				$('#selecteClientList').modal('show');
			}
		});
	}

	selctedClient(event) {
		this.userListForOwnList = [];
		if (event) {
			this.ownerClient.name = event.name;
			this.ownerClient.UserId = null;
			this.ownerClient.RoleId = null;
			this.ownerClient.fullName = null;
		}
	}

	selectRole(event) {
		if (event && this.ownerClient.id) {
			this.ownerClient.RoleId = event.RoleId;
			this.learnerGroupsService
				.getSelctedClientAdminUserList(this.ownerClient.id, event.RoleId)
				.subscribe((res: any) => {
					if (res.success) {
						this.userListForOwnList = [];
						this.userListForOwnList = res.data;
					}
				});
		}
	}

	selctedUser(event) {
		if (event) {
			this.ownerClient.UserId = event.id;
			this.ownerClient.fullName = event.fullName;
		}
	}

	transferLearnerGrouptoAnotherUser() {
		if (this.ownerClient.id && this.ownerClient.UserId && this.ownerClient.RoleId) {
			let payload = {
				clientId: this.ownerClient.id,
				userId: this.ownerClient.UserId,
				roleId: this.ownerClient.RoleId,
				groupId: this.learnerGroupId,
			};
			this.learnerGroupsService.transferLearnerGroupToUser(payload).subscribe((res: any) => {
				if (res.success) {
					$('#selecteClientList').modal('hide');
					this.getLearnerGroupByUserId(this.userDetails.id, this.userClient.id, this.userRoleId, this.page, this.limit);
					setTimeout(() => {
						this.ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
					}, 200);
				}
			});
		}
	}

	cancelClientlistPopUp() {
		$('#selecteClientList').modal('hide');
		setTimeout(() => {
			this.ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
		}, 200);
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getLearnerGroupsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getLearnerGroupsByFilter(this.inputSearchTxt);
		}
	}
}
