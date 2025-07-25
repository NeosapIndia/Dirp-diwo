import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageProductsAndPackagesService } from '../manage-products-and-packages.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';

@Component({
	selector: 'app-view-product-and-packages',
	templateUrl: './view-product-and-packages.component.html',
	styleUrls: ['./view-product-and-packages.component.css'],
})
export class ViewProductAndPackagesComponent implements OnInit {
	SubscriptionData: any;
	clientId: any;
	clientData: any;

	constructor(
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private LicenseService: ManageProductsAndPackagesService,
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
