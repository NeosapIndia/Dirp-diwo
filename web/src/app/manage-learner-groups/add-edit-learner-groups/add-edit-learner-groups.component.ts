import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationCancel, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from '../../../app/app.service';
import { environment } from '../../../environments/environment';
import { ManageLearnerGroupsService } from '../manage-learner-groups.service';
declare var $: any;

@Component({
	selector: 'app-add-edit-learner-groups',
	templateUrl: './add-edit-learner-groups.component.html',
	styleUrls: ['./add-edit-learner-groups.component.css'],
})
export class AddEditLearnerGroupsComponent implements OnInit {
	notOwnAnyAssetRoleId = [2, 3, 4, 5];
	client_List = [];
	ownUserRoleList = [
		{ RoleId: 6, name: 'Client Admin' },
		{ RoleId: 7, name: 'Branch Admin' },
	];
	ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
	showAddToGroupButton = true;
	writePermission: boolean = false;
	index: any;
	settings = {
		bigBanner: true,
		timePicker: true,
		format: 'dd-MM-yyyy hh:mm',
		defaultOpen: false,
		closeOnSelect: false,
	};
	changesInTheGroup = false;
	learnerGroupForm: FormGroup;
	ClientList: any[];
	jobRoleList: any[];
	tagsList: any[];
	learnerList: any = [];
	selectedUserIds: any = [];
	finalSelectedList = [];
	finalSelectedUserAllDetailsList = [];
	selectedClientId: any;
	lastLevelClientList: any = [];
	userId: any;
	editLearnerGroup: any;
	showSelectAllOption: boolean = false;
	selectAllFlag: boolean;
	userRoleId;
	limit: any = 25;
	page: number = 1;
	totalLearnerCount: any;
	pageResultCount = environment.pageResultsCount;
	allLearnerList: any = [];
	editLearnerGroupFlag = false;
	showLearnecount = false;
	searchStr1 = '';
	editLearnerGroupId: any;
	allParamsData: any;
	scrollToTop: HTMLElement;
	scrollToDown: HTMLElement;
	userListForOwnList = [];
	type: string;
	isAddLearnerToGroup = true;
	showlistLearner: boolean = false;
	inputSearchTxt: any;
	pageDetails: any;
	tableLoade = false;
	FilterGroupList = [];
	selectdFilter: any;
	customFieldList = [];
	selectCustomFieldsForFilter = [];
	tempCustField: any = [];
	finalFilter: any = [];
	isFilterEmpty: boolean = false;
	isSearchGroup: boolean = false;

	iconObject = {
		info_icon_20: null,
		expand_less_icon_25_t_m: null,
		search_loader: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private learnerGroupsService: ManageLearnerGroupsService,
		private router: Router,
		private route: ActivatedRoute,
		public appService: AppService
	) {}

	ngOnInit() {
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.pageDetails = JSON.parse(localStorage.getItem('learnerGroupPageNo')) || null;

		this.learnerGroupForm = this.formBuilder.group({
			id: [null],
			title: [null, Validators.required],
			description: [null],
			selectedClient: [[]],
			jobRole: [null],
			tagsWithClientId: [[]],
			tags: [[]],
			RoleId: [this.userRoleId],
		});
		this.editLearnerGroup = this.route.params['_value'];
		this.allParamsData = this.route.params['_value'];

		if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
			this.learnerGroupsService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.selectedClientId = null;
					this.client_List = [];
					this.client_List = res.data;
					$('#selecteClientList').modal('show');
				}
			});
		} else {
			this.getJobRoleList();
			this.getAllLastClientList();
		}

		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.type = 'drip';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.type = 'diwo';
		}

		//For Dev and Local
		if (!this.type) {
			this.type = localStorage.getItem('projectName');
		}

		if (this.editLearnerGroup && this.editLearnerGroup.GroupId) {
			this.editLearnerGroupFlag = true;
			this.showAddToGroupButton = false;
			this.spinnerService.show();
			this.learnerGroupsService
				.getLearnerGroupDetailsById(this.userId, this.editLearnerGroup.GroupId)
				.subscribe((res: any) => {
					if (res.success) {
						this.totalLearnerCount = res.data.userCount;
						this.learnerGroupForm.reset();
						this.learnerGroupForm.patchValue(res.data);

						if (this.editLearnerGroup && this.editLearnerGroup.GroupId && this.editLearnerGroup.type == 'copy') {
							this.learnerGroupForm.controls['title'].setValue('Copy of - ' + res.data.title);
							this.learnerGroupForm.controls['id'].setValue(null);
						}
						this.spinnerService.hide();
						this.tableLoade = true;
						this.learnerGroupsService
							.getLearnerGroupById(this.userId, this.editLearnerGroup.GroupId)
							.subscribe((res: any) => {
								if (res.success) {
									this.learnerList = [];
									this.finalSelectedList = [];
									for (let learner of res.data.Users) {
										this.finalSelectedList.push(learner.id);
									}
									this.finalSelectedUserAllDetailsList = res.data.Users;
									this.isAddLearnerToGroup = false;
									this.learnerList = res.data.Users;
									this.allLearnerList = res.data.Users;
									this.showLearnerList();
								}
							});
					} else {
						this.spinnerService.hide();
					}
				});
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	get f() {
		return this.learnerGroupForm.controls;
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

	getAllLastClientList() {
		let parentClientId = [];
		parentClientId.push(this.selectedClientId);
		let payload = {
			parentClientId: parentClientId,
		};
		this.learnerGroupsService.getAllLastClientList(payload).subscribe((res: any) => {
			if (res.success) {
				this.lastLevelClientList = [];
				this.lastLevelClientList = res.data;
			}
		});
	}

	changeClientForLearnerRole() {
		if (this.learnerGroupForm.controls['selectedClient'].value.length > 0) {
			this.showlistLearner = true;
		} else {
			this.showlistLearner = false;
		}
		let payload = {
			ClientId: this.learnerGroupForm.controls['selectedClient'].value,
		};
		this.learnerGroupsService.getJobRoleByClientId(payload).subscribe((res: any) => {
			if (res.success) {
				this.jobRoleList = [];
				this.FilterGroupList = [];
				if (res.data.length > 0) {
					this.jobRoleList.push({ nameWithClientId: 'Select All', id: 0 });
					this.jobRoleList = [...this.jobRoleList, ...res.data];
					this.FilterGroupList.push({
						label: 'Job Role',
						value: 'jobrole',
						isCustomField: false,
						options: [],
						selectedOptions: [],
					});
					this.FilterGroupList = [...this.FilterGroupList];
				}
				this.tagsList = [];
				if (res.tagData.length > 0) {
					this.tagsList.push({ nameWithClientId: 'Select All', tagName: 0 });
					this.tagsList = [...this.tagsList, ...res.tagData];
					this.FilterGroupList.push({
						label: 'Tags',
						value: 'tags',
						isCustomField: false,
						options: [],
						selectedOptions: [],
					});
					this.FilterGroupList = [...this.FilterGroupList];
				}
				this.customFieldList = [];

				if (res.customFieldData.length > 0) {
					for (let i = 0; i < res.customFieldData.length; i++) {
						let item = res.customFieldData[i];
						if (item.dataType == 'Dropdown select' && !item.isHide) {
							this.customFieldList.push(item);

							if (item.options) {
								this.customFieldList[this.customFieldList.length - 1].options = item.options.filter(
									(option) => !option.isHide
								);
								this.FilterGroupList.push({
									label: item.label,
									value: item.label,
									isCustomField: true,
									options: this.customFieldList[this.customFieldList.length - 1].options,
									selectedOptions: [],
								});
							}
						}
					}

					this.customFieldList = [...this.customFieldList];
					// for (let item of this.customFieldList) {
					// 	this.FilterGroupList.push({ label: item.label, value: item.label, isCustomField: true ,options : item.options});
					// }
					this.FilterGroupList = [...this.FilterGroupList];
				}
			}
		});
	}

	onChangeFilter(data: any) {
		this.finalFilter.forEach((field) => {
			if (!this.selectdFilter.includes(field.label)) {
				field.selectedOptions = [];
			}
		});

		this.finalFilter = data;

		this.selectCustomFieldsForFilter = this.selectCustomFieldsForFilter.filter((item) =>
			this.selectdFilter.includes(item.label)
		);

		if (!this.selectdFilter.includes('jobrole')) {
			this.learnerGroupForm.controls['jobRole'].setValue(null);
		}

		if (!this.selectdFilter.includes('tags')) {
			this.learnerGroupForm.controls['tagsWithClientId'].setValue(null);
		}
	}

	getJobRoleList() {}

	fetchLearner(page, limit) {
		let payload = {
			clientIds: this.learnerGroupForm.controls['selectedClient'].value,
			jobRoleIds:
				this.learnerGroupForm.controls['jobRole'].value == null ? [] : this.learnerGroupForm.controls['jobRole'].value,
			tags: [],
			customField: [],
		};

		if (
			this.learnerGroupForm.controls['tagsWithClientId'].value &&
			this.learnerGroupForm.controls['tagsWithClientId'].value.length > 0
		) {
			for (let tags of this.learnerGroupForm.controls['tagsWithClientId'].value) {
				let temp = tags.split(' - ');
				payload.tags.push(temp[1]);
			}
		}

		if (this.selectCustomFieldsForFilter && this.selectCustomFieldsForFilter.length > 0) {
			payload.customField = this.selectCustomFieldsForFilter;
		}

		if (this.editLearnerGroupFlag) {
			this.showAddToGroupButton = true;
		}
		this.isFilterEmpty = false;
		this.spinnerService.show();
		this.learnerGroupsService.getLearnerByClientIdAndJobROle(payload, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.clearPaginationAndCheckBook();
				this.isAddLearnerToGroup = true;
				this.learnerList = [];
				this.allLearnerList = [];
				this.allLearnerList = res.data;
				this.showLearnerList();
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
			}
		});
	}

	showLearnerList() {
		let startIndex = this.page * this.limit - this.limit;
		let lastIndex = this.page * this.limit;
		this.learnerList = [];
		this.selectedUserIds = [];
		if (this.isAddLearnerToGroup) {
			let temp = [];
			for (let i = 0; i < this.allLearnerList.length; i++) {
				if (this.finalSelectedList.indexOf(this.allLearnerList[i].id) == -1) {
					temp.push(this.allLearnerList[i]);
				}
			}
			for (let i = startIndex; i < lastIndex; i++) {
				if (temp[i]) {
					this.learnerList.push(temp[i]);
				}
			}
			this.totalLearnerCount = temp.length;
		} else {
			for (let i = startIndex; i < lastIndex; i++) {
				if (i < this.finalSelectedUserAllDetailsList.length) {
					this.learnerList.push(this.finalSelectedUserAllDetailsList[i]);
				}
			}
			this.totalLearnerCount = this.finalSelectedUserAllDetailsList.length;
		}

		setTimeout(() => {
			this.learnerList.forEach((element, index) => {
				if (element.opt_in == false && element.opt_out == false) {
					element['whatsAppStatus'] = 'Pending';
				} else if (element.opt_in == true && element.opt_out == false) {
					element['whatsAppStatus'] = 'OptedIn';
				} else if (element.opt_in == false && element.opt_out == true) {
					element['whatsAppStatus'] = 'OptedOut';
				}
			});
		}, 100);
		// }
		this.tableLoade = false;
		this.isSearchGroup = false;
		if (this.learnerList && this.learnerList.length == 0) {
			this.isFilterEmpty = true;
		}
	}

	placeholder() {
		this.selectedUserIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.selectedUserIds = [];
			for (let learner of this.learnerList) {
				if (this.selectedUserIds.indexOf(learner.id) == -1) {
					this.selectedUserIds.push(learner.id);
				}
				if (document.getElementById('checkbox-' + learner.id)) {
					let value = <any>document.getElementById('checkbox-' + learner.id);
					value.checked = true;
				}
			}
			// this.learnerList.forEach((element, index) => {
			//   if (this.selectedUserIds.includes(element.id) == -1){
			//     this.selectedUserIds.push(element.id);
			//   }
			//   if(document.getElementById('checkbox-' + element.id)){
			//     let value = <any>document.getElementById('checkbox-' + element.id);
			//     value.checked = true;
			//   }
			// });
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.learnerList.forEach((element, index) => {
				this.selectedUserIds.push(element.id);
				let indexof = this.selectedUserIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedUserIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedUserIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;

		if (value) {
			let exist = this.selectedUserIds.find((element) => element.id == item.id);
			if (!exist) this.selectedUserIds.push(item.id);
			let value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		} else {
			let index = this.selectedUserIds.indexOf(item.id);
			if (index > -1) {
				this.selectedUserIds.splice(index, 1);
			}
			let value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
		}
	}

	saveLearnerGroup() {
		if (this.learnerGroupForm.invalid) {
			this.markAsTouched(this.learnerGroupForm);
			return;
		}

		let leanerGroupData = this.learnerGroupForm.value;
		let clientIds = this.learnerGroupForm.controls['selectedClient'].value;
		if (this.selectAllFlag && (clientIds == '' || clientIds == null || clientIds.length == 0)) {
			this.learnerGroupForm.controls['selectedClient'].setErrors({ required: true });
			return;
		}
		let payload = {
			learnerGroupInfo: leanerGroupData,
			selectedUserIds: this.finalSelectedList,
			clientIds: this.learnerGroupForm.controls['selectedClient'].value
				? this.learnerGroupForm.controls['selectedClient'].value
				: [],
			jobRoleIds:
				this.learnerGroupForm.controls['jobRole'].value == null ? [] : this.learnerGroupForm.controls['jobRole'].value,
			selectAllFlag: this.selectAllFlag,
		};
		payload.learnerGroupInfo.ClientId = this.selectedClientId;
		payload.learnerGroupInfo.UserId = this.userId;
		this.spinnerService.show();
		if (this.learnerGroupForm.value.id == null) {
			this.learnerGroupsService.createLearnerUserGroup(payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.LearnerGroup.AddEdit.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation(
								this.type === 'drip'
									? 'Pages.LearnerGroup.AddEdit.Toaster.Contactgroupcreated'
									: 'Pages.LearnerGroup.AddEdit.Toaster.learnergroupcreated'
							),
							this.appService.getTranslation('Utils.success')
						);
					}
					$('#addCampaignModal').modal('hide');
					this.learnerGroupForm.reset();
					this.spinnerService.hide();
					if (this.allParamsData && this.allParamsData.redictfrom == 'drip-flow') {
						if (this.type == 'drip') {
							this.router.navigate(['drip-flows/add-or-edit-drip-flow', { redictfrom: 'contactGroup' }]);
						} else if (this.type == 'diwo') {
							this.router.navigate(['drip-flows/add-or-edit-drip-flow', { redictfrom: 'learnerGroup' }]);
						}
					} else {
						if (this.type == 'drip') {
							this.router.navigate(['/contact-groups']);
						} else if (this.type == 'diwo') {
							this.router.navigate(['/learner-groups']);
						}
					}
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			});
		} else {
			this.savePagination();
			this.learnerGroupsService
				.updateLearnerUserGroup(this.learnerGroupForm.value.id, payload)
				.subscribe((res: any) => {
					if (res.success) {
						if (this.index >= 0) {
							this.toastr.success(
								this.appService.getTranslation('Pages.LearnerGroup.AddEdit.Toaster.raiserequest'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation(
									this.type === 'drip'
										? 'Pages.LearnerGroup.AddEdit.Toaster.Contactgroupupdated'
										: 'Pages.LearnerGroup.AddEdit.Toaster.learnergroupupdated'
								),
								this.appService.getTranslation('Utils.success')
							);
						}
						$('#addCampaignModal').modal('hide');
						this.learnerGroupForm.reset();
						this.spinnerService.hide();
						this.appService.checkNotifcation = true;
						if (this.allParamsData && this.allParamsData.redictfrom == 'drip-flow') {
							this.router.navigate(['drip-flows/add-or-edit-drip-flow', { redictfrom: 'learnerGroup' }]);
						} else {
							setTimeout(() => {
								if (this.type == 'drip') {
									this.router.navigate(['/contact-groups']);
								} else if (this.type == 'diwo') {
									this.router.navigate(['/learner-groups']);
								}
							}, 100);
						}
					} else {
						this.spinnerService.hide();
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				});
		}
	}

	selectAllLearner(value) {
		this.selectAllFlag = value;
		if (value == false) {
			this.selectDeselct(false);
			if (document.getElementById('selectBoxId')) {
				let value = <any>document.getElementById('selectBoxId');
				value.checked = false;
			}
		} else {
		}
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
				this.getLearnerGroupsLearnerByFilter(this.inputSearchTxt, false);
			} else {
				this.showLearnerList();
			}
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
				this.getLearnerGroupsLearnerByFilter(this.inputSearchTxt, false);
			} else {
				this.showLearnerList();
			}
			// this.showLearnerList();
		}
		if ((this.totalLearnerCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
				this.getLearnerGroupsLearnerByFilter(this.inputSearchTxt, false);
			} else {
				this.showLearnerList();
			}
		}
	}

	onPageChangeEvent(page: number) {
		this.page = page;
		if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
			this.getLearnerGroupsLearnerByFilter(this.inputSearchTxt, false);
		} else {
			this.showLearnerList();
		}
	}

	search(searchKey) {
		let searchText = searchKey.toLowerCase();
		if (searchText == '') {
			this.learnerList = this.allLearnerList;
		} else {
			let contents = [];
			for (let singalContent of this.allLearnerList) {
				if (
					(singalContent.account_id &&
						singalContent.account_id !== null &&
						singalContent.account_id.toLowerCase().includes(searchText)) ||
					(singalContent.first &&
						singalContent.first !== null &&
						singalContent.first.toLowerCase().includes(searchText)) ||
					(singalContent.last &&
						singalContent.last.name &&
						singalContent.last.name !== null &&
						singalContent.Market.name.toLowerCase().includes(searchText)) ||
					(singalContent.email &&
						singalContent.email !== null &&
						singalContent.email.toString().toLowerCase().includes(searchText)) ||
					(singalContent.phone &&
						singalContent.phone !== null &&
						singalContent.phone.toString().toLowerCase().includes(searchText)) ||
					(singalContent.Clients[0].name &&
						singalContent.Clients[0].name !== null &&
						singalContent.Clients[0].name.toString().toLowerCase().includes(searchText))
				) {
					contents.push(singalContent);
				}
			}
			this.learnerList = contents;
		}
	}

	addLearnersToGroup() {
		this.clearPaginationAndCheckBook();
		if (this.selectedUserIds.length == 0) {
			this.toastr.warning(
				this.appService.getTranslation(
					this.type === 'drip'
						? 'Pages.LearnerGroup.AddEdit.Toaster.atleastoneContact'
						: 'Pages.LearnerGroup.AddEdit.Toaster.atleastonelearner'
				),
				this.appService.getTranslation('Utils.warning')
			);
			return;
		}
		if (this.selectedUserIds.length > 0) {
			if (this.selectAllFlag) {
				if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
					for (let i = 0; i < this.allLearnerList.length; i++) {
						if (this.checkSearchDataPresentOrNot(this.allLearnerList[i])) {
							if (this.finalSelectedList.indexOf(this.allLearnerList[i].id) < 0) {
								this.finalSelectedUserAllDetailsList.push(this.allLearnerList[i]);
							}
						}
					}
					this.finalSelectedList = [];
					for (let i = 0; i < this.finalSelectedUserAllDetailsList.length; i++) {
						this.finalSelectedList.push(this.finalSelectedUserAllDetailsList[i].id);
					}
				} else {
					for (let data of this.allLearnerList) {
						if (this.finalSelectedList.indexOf(data.id) < 0) {
							this.finalSelectedUserAllDetailsList.push(data);
							this.finalSelectedList.push(data.id);
						}
					}
					// this.finalSelectedUserAllDetailsList = [...this.finalSelectedUserAllDetailsList, ...this.allLearnerList];
					// this.finalSelectedList = [];
					// for (let i = 0; i < this.finalSelectedUserAllDetailsList.length; i++) {
					// 	this.finalSelectedList.push(this.finalSelectedUserAllDetailsList[i].id);
					// }
				}
				this.selectAllFlag = false;
				this.showSelectAllOption = false;
			} else {
				let temp = [...this.finalSelectedList, ...this.selectedUserIds];

				this.finalSelectedList = [...new Set(temp)];

				for (let i = 0; i < this.learnerList.length; i++) {
					if (
						this.finalSelectedList.indexOf(this.learnerList[i].id != -1) &&
						this.selectedUserIds.indexOf(this.learnerList[i].id) != -1
					) {
						this.finalSelectedUserAllDetailsList.push(this.learnerList[i]);
					}
				}
			}

			this.selectedUserIds = [];
			if (document.getElementById('selectBoxId')) {
				let value = <any>document.getElementById('selectBoxId');
				value.checked = false;
			}
			this.changesInTheGroup = true;
			this.showLearnerList();
			this.toastr.success(
				this.appService.getTranslation(
					this.type === 'drip'
						? 'Pages.LearnerGroup.AddEdit.Toaster.addToContactgroup'
						: 'Pages.LearnerGroup.AddEdit.Toaster.addTolearnergroup'
				),
				this.appService.getTranslation('Utils.success')
			);
		}
		this.scrollToTop = document.getElementById('container');
		this.scrollToTop.scrollIntoView({ behavior: 'smooth' });
		this.showLearnecount = true;
		this.inputSearchTxt = null;
		// console.log('----', this.finalSelectedList);
	}

	selectClient() {
		if (this.ownerClient.id && this.ownerClient.UserId && this.ownerClient.RoleId) {
			this.selectedClientId = this.ownerClient.id;
			this.userId = this.ownerClient.UserId;
			this.userRoleId = this.ownerClient.RoleId;
			this.learnerGroupForm.controls['RoleId'].setValue(this.userRoleId);
			$('#selecteClientList').modal('hide');
			this.getJobRoleList();
			this.getAllLastClientList();
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

	cancelClientlistPopUp() {
		if (this.type == 'drip') {
			this.router.navigate(['/contact-groups']);
		} else if (this.type == 'diwo') {
			this.router.navigate(['/learner-groups']);
		}
	}

	checkSearchDataPresentOrNot(data) {
		if (data && data != undefined) {
			//FOr CUstom Field Search
			if (
				data &&
				data.customFields &&
				Object.keys(data.customFields).length > 0 &&
				data.customFields != undefined &&
				data.customFields != null
			) {
				let flag = false;
				for (const key in data.customFields) {
					if (
						data.customFields &&
						data.customFields[key] &&
						data.customFields[key] != null &&
						data.customFields[key].toString()?.toLowerCase()?.indexOf(this.inputSearchTxt.toLowerCase()) != -1
					) {
						flag = true;
					}
				}
				if (flag) {
					return true;
				}
			}

			//FOr Other Search
			let fullName;
			if (data && data.first !== null && data && data.last !== null) {
				fullName = data.first.trimStart().trimEnd() + ' ' + data.last.trimStart().trimEnd();
			}
			let status = '';

			if (data && data.whatsAppStatus !== null && data.whatsAppStatus !== undefined) {
				if (data.whatsAppStatus == 'OptedIn') {
					status = 'Opted In';
				} else if (data.whatsAppStatus == 'Pending') {
					status = 'Pending';
				} else if (data.whatsAppStatus == 'OptedOut') {
					status = 'Opted Out';
				}
			}

			if (
				// this.inputSearchTxt.toLowerCase().indexOf(data.first.toLowerCase()) != -1 ||
				// this.inputSearchTxt.toLowerCase().indexOf(data.last.toLowerCase()) != -1 ||
				(data && data.first !== null && data.first.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1) ||
				(data && data.last !== null && data.last.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1) ||
				(fullName && fullName !== null && fullName.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1) ||
				(data && data.email !== null && data.email.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1) ||
				(data && data.account_id !== null && data.account_id.indexOf(this.inputSearchTxt) != -1) ||
				(data && data.phone !== null && data.phone.indexOf(this.inputSearchTxt) != -1) ||
				(data &&
					data.Clients &&
					data.Clients.length > 0 &&
					data.Clients[0].name.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1) ||
				(status &&
					status !== null &&
					status !== '' &&
					status.toLowerCase().indexOf(this.inputSearchTxt.toLowerCase()) != -1)
			) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	removeFromLearnersToGroup() {
		this.clearPaginationAndCheckBook();

		if (this.selectAllFlag) {
			if (this.inputSearchTxt && this.inputSearchTxt.length > 3) {
				let length = this.finalSelectedUserAllDetailsList.length;
				let temp = [];
				this.finalSelectedList = [];
				for (let i = 0; i < length; i++) {
					if (this.finalSelectedUserAllDetailsList[i] && this.finalSelectedUserAllDetailsList[i] != undefined) {
						if (!this.checkSearchDataPresentOrNot(this.finalSelectedUserAllDetailsList[i])) {
							temp.push(this.finalSelectedUserAllDetailsList[i]);
							this.finalSelectedList.push(this.finalSelectedUserAllDetailsList[i].id);
						}
					}
				}
				this.finalSelectedUserAllDetailsList = [];
				this.finalSelectedUserAllDetailsList = temp;
				this.selectAllFlag = false;
				this.showSelectAllOption = false;
				this.inputSearchTxt = null;
			} else {
				this.finalSelectedUserAllDetailsList = [];
				this.finalSelectedList = [];
				this.selectAllFlag = false;
				this.showSelectAllOption = false;
			}
		} else {
			for (let learnerId of this.selectedUserIds) {
				if (this.finalSelectedList.indexOf(learnerId) != -1) {
					this.finalSelectedList.splice(this.finalSelectedList.indexOf(learnerId), 1);
				}
			}

			let temp = [];

			for (let i = 0; i < this.finalSelectedUserAllDetailsList.length; i++) {
				if (this.finalSelectedList.indexOf(this.finalSelectedUserAllDetailsList[i].id) != -1) {
					temp.push(this.finalSelectedUserAllDetailsList[i]);
				}
			}
			this.finalSelectedUserAllDetailsList = [];
			this.finalSelectedUserAllDetailsList = temp;
		}

		if (this.selectedUserIds.length > 0) {
			this.toastr.warning(
				this.appService.getTranslation(
					this.type === 'drip'
						? 'Pages.LearnerGroup.AddEdit.Toaster.removeContactfromgroup'
						: 'Pages.LearnerGroup.AddEdit.Toaster.removelearnerfromgroup'
				),
				this.appService.getTranslation('Utils.warning')
			);
		}
		this.changesInTheGroup = true;
		this.scrollToTop = document.getElementById('container');
		this.scrollToTop.scrollIntoView({ behavior: 'smooth' });
		this.showLearnerList();
		this.selectedUserIds = [];
		this.inputSearchTxt = null;
	}

	seeLearnerGroup() {
		this.isAddLearnerToGroup = false;
		this.selectAllFlag = false;
		this.showSelectAllOption = false;
		this.learnerGroupForm.controls['selectedClient'].setValue(null);
		this.learnerGroupForm.controls['jobRole'].setValue(null);
		this.scrollToDown = document.getElementById('learnerList');
		this.scrollToDown.scrollIntoView({ behavior: 'smooth' });
		this.showLearnerList();
	}

	clearPaginationAndCheckBook() {
		this.page = 1;
		if (document.getElementById('selectBoxId')) {
			let value = <any>document.getElementById('selectBoxId');
			value.checked = false;
		}
	}

	selectJobRole(event) {
		if (event.length > 0) {
			for (let role of event) {
				if (role.id == 0) {
					if (event.length < this.jobRoleList.length) {
						let tem = [];
						for (let job of this.jobRoleList) {
							if (job.id != 0) {
								tem.push(job.id);
							}
						}
						this.learnerGroupForm.controls['jobRole'].setValue(tem);
					} else {
						this.learnerGroupForm.controls['jobRole'].setValue([]);
					}
				}
			}
		}
	}

	selectTag(event) {
		if (event.length > 0) {
			for (let tag of event) {
				if (tag.tagName == 0) {
					if (event.length < this.tagsList.length) {
						let tem = [];
						let temp = [];
						for (let tags of this.tagsList) {
							if (tags.tagName != 0) {
								temp.push(tags.tagName);
								tem.push(tags.nameWithClientId);
							}
						}
						this.learnerGroupForm.controls['tagsWithClientId'].setValue(tem);
						this.learnerGroupForm.controls['tags'].setValue(temp);
					} else {
						this.learnerGroupForm.controls['tagsWithClientId'].setValue([]);
						this.learnerGroupForm.controls['tags'].setValue([]);
					}
				}
			}
		}
		// console.log("--this.learnerGroupForm.controls['tags']-", this.learnerGroupForm.controls['tags'].value);
	}

	onSelectCustomField(event, mainLabel) {
		this.tempCustField = this.tempCustField.filter((item) => item.label !== mainLabel);

		for (let item of event) {
			let payload = {
				label: mainLabel,
				option: [],
			};
			payload.option.push(item.label);
			this.tempCustField.push(payload);
		}

		this.selectCustomFieldsForFilter = this.tempCustField.reduce((data, item) => {
			const { label, option } = item;
			let existingObject = data.find((obj) => obj.label === label);
			if (!existingObject) {
				existingObject = { label, option: [] };
				data.push(existingObject);
			}
			// Check for duplicates before pushing
			option.forEach((opt) => {
				if (!existingObject.option.includes(opt)) {
					existingObject.option.push(opt);
				}
			});
			return data;
		}, []);
	}

	getLearnerGroupsLearnerByFilter(searchKey, flag) {
		this.inputSearchTxt = searchKey;
		if (this.inputSearchTxt.length > 3) {
			this.isSearchGroup = true;
			this.learnerList = [];
			if (flag) {
				this.page = 1;
			}
			let count = 1;
			let flagCount = 0;
			let startIndex = this.page * this.limit - this.limit + 1;
			let lastIndex = this.page * this.limit;
			// console.log('----startIndex--', startIndex);
			// console.log('----lastIndex--', lastIndex);
			for (let i = 0; i < this.allLearnerList.length; i++) {
				// console.log('----', this.allLearnerList[i]);
				if (this.checkSearchDataPresentOrNot(this.allLearnerList[i])) {
					if (
						startIndex <= count &&
						lastIndex >= count &&
						((this.isAddLearnerToGroup && this.finalSelectedList.indexOf(this.allLearnerList[i].id) < 0) ||
							(!this.isAddLearnerToGroup && this.finalSelectedList.indexOf(this.allLearnerList[i].id) != -1))
					) {
						// flagCount++;
						this.learnerList.push(this.allLearnerList[i]);
					}
					if (
						(this.isAddLearnerToGroup && this.finalSelectedList.indexOf(this.allLearnerList[i].id) < 0) ||
						(!this.isAddLearnerToGroup && this.finalSelectedList.indexOf(this.allLearnerList[i].id) != -1)
					) {
						count++;
					}
				}
			}
			setTimeout(() => {
				this.learnerList.forEach((element, index) => {
					if (element.opt_in == false && element.opt_out == false) {
						element['whatsAppStatus'] = 'Pending';
					} else if (element.opt_in == true && element.opt_out == false) {
						element['whatsAppStatus'] = 'OptedIn';
					} else if (element.opt_in == false && element.opt_out == true) {
						element['whatsAppStatus'] = 'OptedOut';
					}
				});
			}, 100);
			this.totalLearnerCount = count - 1;
			// console.log('---totalLearnerCount------', this.totalLearnerCount);
		} else if (this.inputSearchTxt.length == 0) {
			this.page = 1;
			this.showLearnerList();
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('learnerGroupPageNo', JSON.stringify(payload));
	}

	gotoGroupHomePage() {
		if (this.type == 'drip') {
			this.router.navigate(['/contact-groups']);
		} else if (this.type == 'diwo') {
			this.router.navigate(['/learner-groups']);
		}
	}
}
