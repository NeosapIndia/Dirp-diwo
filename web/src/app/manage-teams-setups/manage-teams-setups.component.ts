import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ManageTeamSetupService } from './manage-teams-setups.service';
import { AppService } from '../app.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
declare var $: any;

@Component({
	selector: 'app-manage-teams-setups',
	templateUrl: './manage-teams-setups.component.html',
	styleUrls: ['./manage-teams-setups.component.scss'],
	animations: [routerTransition()],
})
export class ManageTeamSetupComponent implements OnInit {
	teamSetupData: any[] = [];
	selectedTeamSetupId: any;
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

	FilterTeamSetupColumnForm: FormGroup;
	projectType = 'drip';
	FilterColumnArray = [
		{ label: 'Account Id', value: 'client_id' },
		{ label: 'Account Name', value: 'name' },
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
	showAddTeamSetup: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private TeamSetupService: ManageTeamSetupService,
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
		if (JSON.parse(localStorage.getItem('TeamSetupPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('TeamSetupPageNo'));
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
		this.FilterTeamSetupColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchTeamSetups'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterTeamSetupColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			// this.getTeamSetupByFilter(this.inputSearchTxt);
		} else {
			this.getteamSetupData(this.userClient.id, this.page, this.limit);
		}

		this.TeamSetupService.checkTeamSetupExist().subscribe((res: any) => {
			if (res.success) {
				this.showAddTeamSetup = res.showSignInButton;
			}
		});

		localStorage.removeItem('TeamSetupPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterTeamSetupColumnForm = this.fb.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [30],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	addTeamSetup() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['/teams-setup/add-or-edit-teams-setup']);
		}
	}

	getteamSetupData(clientid, page, limit) {
		this.spinnerService.show();
		this.TeamSetupService.getAllTeamSetup(clientid, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.teamSetupData = [];
				for (let client of res.data) {
					this.teamSetupData.push(client);
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

	editTeamSetup(setupId) {
		if (this.writePermission) {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('TeamSetupPageNo', JSON.stringify(payload));
			this.router.navigate(['/teams-setup/add-or-edit-teams-setup'], {
				queryParams: { teamSetupId: setupId },
			});
		}
	}

	deleteTeamSetup(teamSetup) {
		if (this.writePermission) {
			if (teamSetup && teamSetup.status != 'Deleted') {
				this.selectedTeamSetupId = teamSetup.teamSetupId;
				$('#teamSetupDeleteModel').modal('show');
			}
		}
	}

	onDeleteFormSubmit() {
		this.spinnerService.show();
	}

	cancelDeleteModal() {
		$('#teamSetupDeleteModel').modal('hide');
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getTeamSetupByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getTeamSetupByFilter(this.inputSearchTxt);
		} else {
			this.getteamSetupData(this.userClient.id, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt != undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getteamSetupData(this.userClient.id, this.page, this.limit);
			}
		}
	}
	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getTeamSetupByFilter(key) {
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

		if (this.FilterTeamSetupColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterTeamSetupColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}
		if (this.FilterTeamSetupColumnForm.value.FilterColumn != null) {
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
		localStorage.setItem('searchTeamSetups', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getteamSetupData(this.userClient.id, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.TeamSetupService.getSearchTeamSetup(this.userClient.id, this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.teamSetupData = [];
							for (let client of res.data) {
								this.teamSetupData.push(client);
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
