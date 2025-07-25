import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ManageAccountService } from './manage-account.service';
import * as moment from 'moment';
import { AppService } from '../app.service';

@Component({
	selector: 'app-manage-account',
	templateUrl: './manage-account.component.html',
	styleUrls: ['./manage-account.component.scss'],
	animations: [routerTransition()],
})
export class ManageAccountComponent implements OnInit {
	user: any;
	client: any;
	userRole: any;
	clientStatus = null;
	clientCountries: any = [];
	parentClient;
	SubscriptionData: any = [];
	constructor(private accountService: ManageAccountService, public appService: AppService) {}

	ngOnInit() {
		let lsUser = JSON.parse(localStorage.getItem('user')) || null;
		this.user = lsUser.user;
		this.userRole = localStorage.getItem('role');
		this.client = JSON.parse(localStorage.getItem('client'));
		this.getClientSubscription();
		if (this.client && this.client.Associate_client_id) {
			this.getPrentClient();
		}
		this.clientStatus = this.client.is_deleted == false ? 'Active' : 'Inactive';
		let countries = this.client.Countries;
		for (let c of countries) {
			this.clientCountries.push(c.name);
		}
	}

	getPrentClient() {
		this.accountService.getClientById(this.client.Associate_client_id).subscribe((res: any) => {
			if (res.success) {
				this.parentClient = res.data;
			}
		});
	}

	getClientSubscription() {
		this.accountService.getClientSubscriptionById(this.client.id).subscribe((res: any) => {
			if (res.success) {
				this.SubscriptionData = res.data;
			}
		});
	}
}
