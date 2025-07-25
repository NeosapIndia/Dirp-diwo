import { Component, OnInit, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../app.service';
import { environment } from '../../environments/environment';
import { ManageUserService } from './manage-user-group.service';
// import { IMyDpOptions } from 'mydatepicker';
// import { ValueTransformer } from '@angular/compiler/src/util';
import { UserService } from '../shared';
declare var SelectFx: any;
declare var jquery: any;
declare var $: any;
import { first } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// const zipcodeRegex = require('../../assets/zipcodeValidation.json');

@Component({
	selector: 'manage-user-group',
	templateUrl: './manage-user-group.component.html',
	styleUrls: ['./manage-user-group.component.css'],
	providers: [ManageUserService],
})
export class ManageUserGroupComponent implements OnInit, AfterViewInit, OnDestroy {
	// public dateofShippingOptions: IMyDpOptions = {
	//     dateFormat: environment.dateFormat,
	//     disableSince: {
	//         year: new Date().getFullYear(),
	//         month: new Date().getMonth() + 1,
	//         day: new Date().getDate() + 1
	//     },
	//     disableUntil: {
	//         year: new Date().getFullYear(),
	//         month: new Date().getMonth() + 1,
	//         day: new Date().getDate() - 4
	//     }
	// };
	public updateShippingData: FormGroup;

	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;
	clientsAllUsers = [];

	userClientId;

	constructor(
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private manageUserService: ManageUserService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private userService: UserService,
		private route: ActivatedRoute,
		private http: HttpClient
	) {}

	ngOnInit() {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;

		this.getAllClientList(this.userClientId);
	}

	getAllClientList(userClientId) {
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.length > 0) {
					for (let client of res.data) {
						this.clientListNames.push(client.name);
					}
					this.clientList = res.data;
					if (res.data && res.data.length > 0) {
						this.selectedClientName = res.data[0].name;
						this.selectedClient = res.data[0];
						this.getClientAllUser(this.selectedClientName);
					}
				}
			}
			this.spinnerService.hide();
		});
	}

	getClientAllUser(clientName) {
		this.manageUserService.getClientAllUsers(clientName).subscribe((res: any) => {
			if (res.success) {
				this.clientsAllUsers = res.data;
			}
		});
	}

	ngAfterViewInit() {
		$('.detailInfo').hide();
		$('.ti-minus').hide();
		$('.ti-plus').show();

		this.spinnerService.show();
	}

	changeBuyer(client) {
		this.getClientAllUser(client.name);
	}

	ngOnDestroy() {
		this.spinnerService.hide();
	}

	changeClient($event) {}
}
