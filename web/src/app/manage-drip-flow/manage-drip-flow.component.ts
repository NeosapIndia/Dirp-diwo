import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { routerTransition } from '../router.animations';
import { ManageDripFlowsService } from './manage-drip-flow.service';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { FormBuilder, FormGroup } from '@angular/forms';
declare var $: any;

@Component({
	selector: 'app-manage-drip-flow',
	templateUrl: './manage-drip-flow.component.html',
	styleUrls: ['./manage-drip-flow.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageDripFlowsComponent implements OnInit, AfterViewChecked {
	dripFlowData: any = [];
	selectedDripFlowsIds: any = [];
	page: number = 1;
	totalCount: any;
	limit: number = 25;
	pageResultCount = environment.pageResultsCount;
	restricted_roles = ['Admin', 'Operations'];
	user_role = localStorage.getItem('role');
	index: any;
	searchStr: any;
	disableInputField: boolean = false;
	writePermission: any;
	userClientId: any;
	userDetails: any;
	userRoleId: number;
	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};
	selectedCampIdForDelete: any = [];
	selectedCampIdForPause: any = [];
	selectedCampIdForResume: any = [];
	marketPermission: boolean = false;
	showSelectAllOption: boolean = false;
	selectAllFlag: boolean;
	FilterDripFLowColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Drip Flow Name', value: 'title' },
		{ label: 'Channels', value: 'channels' },
		{ label: 'Learner Groups', value: 'learnerGroup' },
		{ label: 'Drip Flow Id', value: 'id' },
		{ label: 'Status', value: 'status' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
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
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;

	userId: any;
	client_List = [];
	ownUserRoleList = [
		{ RoleId: 6, name: 'Client Admin' },
		{ RoleId: 7, name: 'Branch Admin' },
	];
	ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
	userListForOwnList = [];
	dripFlowId: any;
	type = 'drip';
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	learnerGroupList = [];
	learnerGroupIdsForTesting = [];

	learnerGroupListSelected = false;
	selectedFlowForTestId: any;
	testDone: boolean = false;
	selfTest: boolean = false;
	groupTest: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private spinnerService: NgxSpinnerService,
		private confirmationService: ConfirmationService,
		private dripFlowsService: ManageDripFlowsService,
		public appService: AppService,
		private toastr: ToastrService,
		private router: Router,
		private formBuilder: FormBuilder,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.spinnerService.show();
		this.type = this.dripFlowsService.type;
		if (this.type === 'drip') {
			this.FilterColumnArray = [
				{ label: 'Drip Flow Name', value: 'title' },
				{ label: 'Channels', value: 'channels' },
				{ label: 'Contact Groups', value: 'learnerGroup' },
				{ label: 'Drip Flow Id', value: 'id' },
				{ label: 'Status', value: 'status' },
			];
		}
		if (JSON.parse(localStorage.getItem('dripflowPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('dripflowPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}

		this.createForm();
		this.FilterDripFLowColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);
		this.getRollPermission();

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchDripFlows'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterDripFLowColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getDripFlowByFilter(this.inputSearchTxt);
		} else {
			this.getdripFlowData(this.page, this.limit);
		}

		localStorage.removeItem('dripflowPageNo');
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
			menuId: [12],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	createForm() {
		this.FilterDripFLowColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	getdripFlowData(pageCount, limit) {
		this.spinnerService.show();
		this.dripFlowsService.getAllCampaignListByClientId(pageCount, limit).subscribe((res: any) => {
			if (res.success) {
				this.dripFlowData = [];
				for (let camp of res.data) {
					// camp.startDate = moment(camp.startDate).format('lll');
					// camp.endDate = moment(camp.endDate).format('lll');
					camp.showViewbutton = false;
					camp.channelData = [];
					camp.tooltip = ``;
					let count = 0;
					for (let i = 0; i < camp.Drip_camps.length; i++) {
						if (camp.Drip_camps[i].status == 'Delivered') {
							count++;
						}
						if (
							(camp.Drip_camps[i].dripType == 'DripApp with sharing on WhatsApp' ||
								camp.Drip_camps[i].dripType == 'Only WhatsApp') &&
							camp.channelData.indexOf('WhatsApp') == -1
						) {
							camp.channelData.push('WhatsApp');
						} else if (
							camp.Drip_camps[i].dripType == 'DripApp with sharing on Email' &&
							camp.channelData.indexOf('Email') == -1
						) {
							camp.channelData.push('Email');
						} else if (camp.Drip_camps[i].dripType == 'Only DripApp' && camp.channelData.indexOf('Drip') == -1) {
							camp.channelData.push('Drip');
						}
					}
					camp.tooltip = `Shared ${count} of ${camp.Drip_camps.length}`;
					camp.channelData = camp.channelData.toString();

					camp.userGroupData = [];
					for (let group of camp.User_groups) {
						camp.userGroupData.push(group.title);
					}

					for (let channel of camp.CampChannelMappings) {
						if (channel?.TeamChannel) {
							camp.userGroupData.push(channel.TeamChannel.title);
						}
					}
					camp.userGroupData = camp.userGroupData.join(', ');
					// for (let i = 0; i < camp.User_groups.length; i++) {
					// 	camp.userGroupData = camp.userGroupData + camp.User_groups[i].title;
					// 	if (i != camp.User_groups.length - 1) {
					// 		camp.userGroupData = camp.userGroupData + ', ';
					// 	}
					// }

					// Campaign Status
					// let status = camp.status;
					// if (status == 'Scheduled') {
					//     if (moment().isAfter(camp.startDate) && moment().isBefore(camp.endDate)) {
					//         camp.status = 'Running';
					//     } else if (moment().isAfter(camp.endDate)) {

					//         //For Loop For Check All Drip
					//         let flag = false;
					//         for (let drip of camp.Drip_camps) {
					//             if (drip.status == 'PFA' || drip.status == 'Scheduled') {
					//                 flag = true;
					//             }
					//         }
					//         if (flag) {

					//             camp.status = 'Expired';
					//         } else {

					//             camp.status = 'Finished';
					//         }
					//     }
					// } if (status == 'Draft' || status == 'Paused') {

					//     if (moment().isAfter(camp.endDate)) {
					//         camp.status = 'Expired';
					//     }
					// }

					if (camp.ClientId == this.userClientId && camp.UserId == this.userDetails.id) {
						camp.showViewbutton = false;
					} else {
						camp.showViewbutton = true;
					}
					this.dripFlowData.push(camp);
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
				this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
			}
		});
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getDripFlowByFilter(eve) {
		this.inputSearchTxt = eve;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = eve;

		let chars;
		if (this.isNumber(eve)) {
			chars = 0;
		} else {
			chars = 2;
		}

		if (this.FilterDripFLowColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterDripFLowColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterDripFLowColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: eve,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterDripFLowColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: eve,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterDripFLowColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchDripFlows', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getdripFlowData(this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.dripFlowsService
					.getSearchCampaignData(this.payload, this.userDetails.id, this.userRoleId, this.page, this.limit)
					.subscribe((res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							if (res.success) {
								this.dripFlowData = [];
								for (let camp of res.data) {
									camp.startDate = moment(new Date(camp.startDate)).format('lll');
									camp.endDate = moment(new Date(camp.endDate)).format('lll');
									camp.showViewbutton = false;
									camp.channelData = [];
									for (let i = 0; i < camp.Drip_camps.length; i++) {
										if (
											(camp.Drip_camps[i].dripType == 'DripApp with sharing on WhatsApp' ||
												camp.Drip_camps[i].dripType == 'Only WhatsApp') &&
											camp.channelData.indexOf('WhatsApp') == -1
										) {
											camp.channelData.push('WhatsApp');
										} else if (
											camp.Drip_camps[i].dripType == 'DripApp with sharing on Email' &&
											camp.channelData.indexOf('Email') == -1
										) {
											camp.channelData.push('Email');
										} else if (
											camp.Drip_camps[i].dripType == 'Only DripApp' &&
											camp.channelData.indexOf('Drip') == -1
										) {
											camp.channelData.push('Drip');
										}
									}
									camp.channelData = camp.channelData.toString();

									camp.userGroupData = '';
									for (let i = 0; i < camp.User_groups.length; i++) {
										camp.userGroupData = camp.userGroupData + camp.User_groups[i].title;
										if (i != camp.User_groups.length - 1) {
											camp.userGroupData = camp.userGroupData + ', ';
										}
									}
									// Campaign Status
									// let today = moment();
									// let status = camp.status;
									// if (status == 'Scheduled') {
									// 	if (moment().isAfter(camp.startDate) && moment().isBefore(camp.endDate)) {
									// 		camp.status = 'Running';
									// 	} else if (moment().isAfter(camp.endDate)) {
									// 		//For Loop For Check All Drip
									// 		let flag = false;
									// 		for (let drip of camp.Drip_camps) {
									// 			if (drip.status == 'PFA' || drip.status == 'Scheduled') {
									// 				flag = true;
									// 			}
									// 		}
									// 		if (flag) {
									// 			camp.status = 'Expired';
									// 		} else {
									// 			camp.status = 'Finished';
									// 		}
									// 	}
									// }
									// if (status == 'Draft' || status == 'Paused') {
									// 	if (moment().isAfter(camp.endDate)) {
									// 		camp.status = 'Expired';
									// 	}
									// }

									if (camp.ClientId == this.userClientId && camp.UserId == this.userDetails.id) {
										camp.showViewbutton = false;
									} else {
										camp.showViewbutton = true;
									}

									this.dripFlowData.push(camp);
								}
								this.totalCount = res.count;
							}
							this.totalCount = res.count;
						}
					});
			}, this.appService.timeout);
		}
	}

	openDripFlowModal() {
		// if (!this.writePermission) {
		//     this.toastr.error(this.appService.getTranslation('Utils.unauthorised'), this.appService.getTranslation('Utils.error'));
		//     return;
		// }
		// $("#addCampaignModal").modal('show');
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['drip-flows/add-or-edit-drip-flow']);
		}
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getDripFlowByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getDripFlowByFilter(this.inputSearchTxt);
		} else {
			this.getdripFlowData(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getDripFlowByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getDripFlowByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getDripFlowByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getdripFlowData(this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getdripFlowData(this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getdripFlowData(this.page, this.limit);
			}
		}
	}

	cancel() {
		$('#addCampaignModal').modal('hide');
		this.disableInputField = false;
	}

	onEdit(data) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if ((data.status != 'Finished' && data.status != 'Deleted') || !data.showViewbutton) {
				let payload = {
					pageNo: this.page,
					isPageChange: false,
				};
				localStorage.setItem('dripflowPageNo', JSON.stringify(payload));
				this.router.navigate(['drip-flows/add-or-edit-drip-flow', { campaignId: data.id, type: 'edit' }]);
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
			if (data.status != 'Deleted' && !data.showViewbutton) {
				this.router.navigate(['drip-flows/add-or-edit-drip-flow', { campaignId: data.id, type: 'copy' }]);
			}
		}
	}

	onView(data) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if ((data.status == 'Finished' && data.status != 'Deleted') || data.showViewbutton) {
				this.router.navigate([
					'drip-flows/add-or-edit-drip-flow',
					{ campaignId: data.id, clientId: data.ClientId, roleId: data.RoleId, userId: data.UserId, type: 'view' },
				]);
			}
		}
	}

	onDelete() {
		this.dripFlowsService
			.deleteCampaign(this.userClientId, this.selectedCampIdForDelete, this.userDetails.id, this.userRoleId)
			.subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.getdripFlowData(this.page, this.limit);
					this.cancelDeleteCampPopUp();
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.dripflowdeleted'),
							this.appService.getTranslation('Utils.success')
						);
					}
					this.selectedDripFlowsIds = [];
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			});
	}

	deleteCamp() {
		// if( drip.status != 'Finished' && drip.status != 'Deleted'){
		//     this.selectedCampIdForDelete = drip.id;
		//     $("#deleteCampaignModal").modal('show');
		// }
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let record = this.dripFlowData.filter((obj1) => this.selectedDripFlowsIds.find((obj2) => obj1.id === obj2));
			for (let data of record) {
				if (data.drip_status == 'Finished') {
					return false;
				} else {
					this.selectedCampIdForDelete = this.selectedDripFlowsIds;
					$('#deleteCampaignModal').modal('show');
				}
			}
		}
	}

	pauseCamp() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let record = this.dripFlowData.filter((obj1) => this.selectedDripFlowsIds.find((obj2) => obj1.id === obj2));
			for (let data of record) {
				if (data.drip_status == 'Finished') {
					return false;
				} else {
					this.selectedCampIdForPause = this.selectedDripFlowsIds;
					$('#pauseCampaignModal').modal('show');
				}
			}
		}
	}

	resumedCamp() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let record = this.dripFlowData.filter((obj1) => this.selectedDripFlowsIds.find((obj2) => obj1.id === obj2));
			for (let data of record) {
				if (data.drip_status == 'Finished') {
					return false;
				} else {
					this.selectedCampIdForResume = this.selectedDripFlowsIds;
					$('#resumeCampaignModal').modal('show');
				}
			}
		}
	}

	cancelDeleteCampPopUp() {
		$('#deleteCampaignModal').modal('hide');
		this.selectedCampIdForDelete = [];
	}

	onPause() {
		this.spinnerService.show();
		let payload = {
			dripFlowIds: this.selectedCampIdForPause,
		};
		this.dripFlowsService
			.pausedCampaign(payload, this.userDetails.id, this.userRoleId, this.userClientId)
			.subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.getdripFlowData(this.page, this.limit);
					this.cancelPauseCampPopUp();
					this.spinnerService.hide();
					this.selectedDripFlowsIds = [];
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.dripflowpaused'),
							this.appService.getTranslation('Utils.success')
						);
					}
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			});
	}

	onResume() {
		let payload = {
			dripFlowIds: this.selectedCampIdForResume,
		};
		this.dripFlowsService
			.resumeCampaign(payload, this.userDetails.id, this.userRoleId, this.userClientId)
			.subscribe((res: any) => {
				if (res.success) {
					this.getdripFlowData(this.page, this.limit);
					this.cancelresumeCampPopUp();
					this.spinnerService.hide();
					this.selectedDripFlowsIds = [];
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.DripFlow.Home.Toaster.dripflowresumed'),
							this.appService.getTranslation('Utils.success')
						);
					}
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			});
	}

	pausedCamp(drip) {
		if (
			drip.status != 'Paused' &&
			drip.status != 'Deleted' &&
			drip.status != 'Finished' &&
			drip.status != 'Expired' &&
			drip.status != 'Draft' &&
			!drip.showViewbutton
		) {
			this.selectedCampIdForPause = [drip.id];
			$('#pauseCampaignModal').modal('show');
		}
	}

	resumeCamp(drip) {
		if (drip.status == 'Paused' && !drip.showViewbutton) {
			this.selectedCampIdForResume = [drip.id];
			$('#resumeCampaignModal').modal('show');
		}
	}
	cancelPauseCampPopUp() {
		$('#pauseCampaignModal').modal('hide');
		this.selectedCampIdForPause = [];
	}

	cancelresumeCampPopUp() {
		$('#resumeCampaignModal').modal('hide');
		this.selectedCampIdForResume = null;
	}
	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.dripFlowData.forEach((element, index) => {
				if (!this.selectedDripFlowsIds.includes(element.id)) this.selectedDripFlowsIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.dripFlowData.forEach((element, index) => {
				this.selectedDripFlowsIds.push(element.id);
				let indexof = this.selectedDripFlowsIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedDripFlowsIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedDripFlowsIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedDripFlowsIds.indexOf(item.id) > -1) {
			this.selectedDripFlowsIds.splice(this.selectedDripFlowsIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedDripFlowsIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedDripFlowsIds.length == this.dripFlowData.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedDripFlowsIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	transferDripFlow(item) {
		if (!item.showViewbutton) {
			this.dripFlowId = item.id;
			// if (item.status == 'Finished' || item.status == 'Deleted') {
			// 	return false;
			// } else {

			// }
			this.dripFlowsService.getAllClientAndBranchAccountList(this.userClientId).subscribe((res: any) => {
				if (res.success) {
					// this.userClientId = null;
					this.client_List = [];
					this.client_List = res.data;
					$('#selecteClientList').modal('show');
				}
			});
		}
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
			this.dripFlowsService.getSelctedClientAdminUserList(this.ownerClient.id, event.RoleId).subscribe((res: any) => {
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
				dripflowId: this.dripFlowId,
			};
			this.dripFlowsService.transferDripFlowToUser(payload).subscribe((res: any) => {
				if (res.success) {
					$('#selecteClientList').modal('hide');
					this.getdripFlowData(this.page, this.limit);
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
			this.getDripFlowByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getDripFlowByFilter(this.inputSearchTxt);
		}
	}

	sendTestPopUp(data) {
		if (data.status == 'Running' || data.status == 'Scheduled' || data.status == 'Draft') {
			//Get Learner Groups By using forCampaignTest flag
			//Show Pop Up
			this.selectedFlowForTestId = data.id;
			if (this.learnerGroupList.length == 0) {
				this.dripFlowsService
					.getOnlyLearnerGroupByUserIdForTestingFlow(this.userDetails.id, this.userClientId, this.userRoleId)
					.subscribe((res: any) => {
						if (res.success) {
							this.learnerGroupList = res.data;
							$('#testDripFlowModal').modal('show');
							this.testDone = false;
						}
					});
			} else {
				$('#testDripFlowModal').modal('show');
			}
		}
		return;
	}

	cancelTestDripFlowModalPopUp() {
		$('#testDripFlowModal').modal('hide');
		this.testDone = false;
		this.groupTest = false;
		this.selfTest = false;
	}

	changeLearnerGroup(event) {
		if (this.learnerGroupIdsForTesting.length == 0) {
			this.learnerGroupListSelected = true;
		} else {
			this.learnerGroupListSelected = false;
		}
	}

	sendToGroup() {
		if (this.learnerGroupIdsForTesting.length == 0 || this.testDone) {
			return;
		} else {
			this.groupTest = true;
			this.selfTest = false;
			let payload = {
				CampaignId: this.selectedFlowForTestId,
				groupId: this.learnerGroupIdsForTesting,
				UserId: null,
			};
			this.testDone = false;
			this.dripFlowsService.testDripFlow(payload).subscribe((res: any) => {
				if (res.success) {
					// this.learnerGroupIdsForTesting = null;
					this.testDone = true;
				}
			});
		}
	}

	sendToSelf() {
		if (this.testDone) {
			return;
		}
		this.selfTest = true;
		this.groupTest = false;
		let payload = {
			CampaignId: this.selectedFlowForTestId,
			groupId: null,
			UserId: this.userDetails.id,
		};
		this.testDone = false;
		this.dripFlowsService.testDripFlow(payload).subscribe((res: any) => {
			if (res.success) {
				// this.learnerGroupIdsForTesting = null;
				this.testDone = true;
			}
		});
	}
}
