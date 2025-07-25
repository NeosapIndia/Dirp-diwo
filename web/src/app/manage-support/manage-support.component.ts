import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from '../app.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { environment } from 'src/environments/environment';
import { ManageSupportService } from './manage-support.service';

@Component({
	selector: 'app-manage-support',
	templateUrl: './manage-support.component.html',
	styleUrls: ['./manage-support.component.scss'],
})
export class ManageSupportComponent implements OnInit {
	marketList: any = [];
	FilterClientColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'User Name', value: 'name' },
		{ label: 'User Email', value: 'email' },
		{ label: 'TicketId', value: 'ticketId' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	isSelectAll: boolean = false;
	payload: { searchKey: any; filterColumn: any };
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	formula: string = 'Acceptance log report';

	supportTicketList: any = [];
	user_emailid: any;
	user_phonenumber: any;
	userInfo: any;
	supportTicketOpen: any = [];
	supportTicketClosed: any = [];
	responseFlag: boolean = false;
	userClientId: any;
	isDataLoaded: boolean = false;

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private supportService: ManageSupportService,
		public appService: AppService
	) {}

	ngOnInit(): void {
		this.userInfo = JSON.parse(localStorage.getItem('user')).user;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.getSupportTicket(this.userInfo.id, this.page, this.limit);
	}

	addTicket() {
		this.router.navigate(['/support/add-edit-support']);
	}

	getSupportTicket(userInfoId, page, limit) {
		this.spinnerService.show();
		this.supportService.getSupportTicket(userInfoId, this.userClientId, page, limit).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.supportTicketList = res.data;
					this.totalCount = res.count;
					this.user_emailid = this.userInfo.email;
					this.user_phonenumber = this.userInfo.phone;
					if (this.supportTicketList) {
						for (let status of this.supportTicketList) {
							if (
								status.status == 1 ||
								status.status == '1' ||
								status.status == 2 ||
								status.status == '2' ||
								status.status == 3 ||
								status.status == '3'
							) {
								this.supportTicketOpen.push(status);
							} else if (status.status == 4 || status.status == '4') {
								this.supportTicketClosed.push(status);
							} else {
								this.supportTicketOpen.length = 0;
								this.supportTicketClosed.length = 0;
							}
						}
					}
					this.responseFlag = true;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
				this.isDataLoaded = true;
			},
			(error) => {}
		);
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		this.getSupportTicket(this.userInfo.id, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getSupportTicket(this.userInfo.id, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getSupportTicket(this.userInfo.id, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getSupportTicket(this.userInfo.id, this.page, this.limit);
		}
	}
}
