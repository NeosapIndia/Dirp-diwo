import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { ManageDiwoLicenseService } from '../manage-diwo-license.service';

@Component({
	selector: 'app-view-diwo-license',
	templateUrl: './view-diwo-license.component.html',
	styleUrls: ['./view-diwo-license.component.css'],
})
export class ViewDiwoLicenseComponent implements OnInit {
	SubscriptionData: any;
	clientId: any;
	clientData: any;

	constructor(
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private LicenseService: ManageDiwoLicenseService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit() {
		this.clientId = this.route.snapshot.queryParams.clientId;
		this.getClientSubscriptionForView();
	}

	getClientSubscriptionForView() {
		this.LicenseService.getClientViewSubscriptionById(this.clientId).subscribe((res: any) => {
			if (res.success) {
				this.SubscriptionData = res.data.license;
				this.clientData = res.data.client[0];
			}
		});
	}
}
