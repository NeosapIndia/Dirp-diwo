import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageProductsAndPackagesService } from '../manage-products-and-packages.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { AppService } from 'src/app/app.service';

@Component({
	selector: 'app-add-edit-product-and-packages',
	templateUrl: './add-edit-product-and-packages.component.html',
	styleUrls: ['./add-edit-product-and-packages.component.css'],
})
export class AddEditProductAndPackagesComponent implements OnInit, AfterViewChecked {
	licenseDetailsForm: FormGroup;
	userClient: any;
	ClientList: any;
	timePicker: any = [];
	selectedDate = null;
	selectedendDate = null;
	clientId: any;
	editClientData: any;
	islicenseEdit: boolean = false;
	idEdit = false;
	pageDetails: any;
	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private LicenseService: ManageProductsAndPackagesService,
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.pageDetails = JSON.parse(localStorage.getItem('driplicensePageNo')) || null;

		this.createLicenseDetailsForm();
		this.clientId = this.route.snapshot.queryParams.clientId;
		if (this.clientId) {
			this.getAllClientWithLicenseById();
		} else {
			this.getAllClientWithoutLicenseById();
		}
		if (this.clientId) {
			this.LicenseService.getSingleClientbyClientId(this.clientId).subscribe((res: any) => {
				if (res.success) {
					this.islicenseEdit = true;
					this.editClientData = res.data;
					let start_date = this.editClientData.startDate;
					let end_date = this.editClientData.endDate;
					this.licenseDetailsForm.patchValue(this.editClientData);
					this.selectedDate = {
						startDate: moment(start_date).subtract(0, 'days').startOf('day'),
						endDate: moment(start_date).subtract(0, 'days').startOf('day'),
					};
					this.selectedendDate = {
						startDate: moment(end_date).subtract(0, 'days').startOf('day'),
						endDate: moment(end_date).subtract(0, 'days').startOf('day'),
					};
					this.licenseDetailsForm.controls['ClientId'].disable();
					this.licenseDetailsForm.controls['startDate'].disable();
					if (this.licenseDetailsForm.controls['unlLearner'].value == true) {
						this.licenseDetailsForm.controls['learnerCount'].disable();
					}
					if (this.licenseDetailsForm.controls['whatsAppUnl'].value == true) {
						this.licenseDetailsForm.controls['whatsAppCount'].disable();
					}
					if (this.licenseDetailsForm.controls['sharWhatsAppUnl'].value == true) {
						this.licenseDetailsForm.controls['sharWhatsAppCount'].disable();
					}
					if (this.licenseDetailsForm.controls['emailUnl'].value == true) {
						this.licenseDetailsForm.controls['emailCount'].disable();
					}
					if (this.licenseDetailsForm.controls['dripappUnl'].value == true) {
						this.licenseDetailsForm.controls['dripappCount'].disable();
					}
					if (this.licenseDetailsForm.controls['serverStorageUnl'].value == true) {
						this.licenseDetailsForm.controls['serverStrgCount'].disable();
					}
					if (this.licenseDetailsForm.controls['dataTransferUnl'].value == true) {
						this.licenseDetailsForm.controls['dataTransferCount'].disable();
					}

					if (this.licenseDetailsForm.controls['onlyTeamUnl'].value == true) {
						this.licenseDetailsForm.controls['onlyTeamCount'].disable();
					}

					if (this.licenseDetailsForm.controls['dripWithTeamUnl'].value == true) {
						this.licenseDetailsForm.controls['dripWithTeamCount'].disable();
					}
					this.idEdit = true;
				}
			});
		} else {
			this.selectedDate = { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null };
			this.selectedendDate = { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null };
			this.idEdit = true;
		}
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	createLicenseDetailsForm() {
		this.licenseDetailsForm = this.formBuilder.group({
			id: null,
			title: ['', Validators.required],
			description: [''],
			ClientId: [null, Validators.required],
			startDate: [null, Validators.required],
			endDate: [null, Validators.required],
			learnerCount: [0, Validators.required],
			unlLearner: [null],
			whatsAppCount: [0, this.appService?.configurable_feature?.whatsApp ? Validators.required : null],
			whatsAppUnl: [false],
			sharWhatsAppCount: [0, this.appService?.configurable_feature?.whatsApp ? Validators.required : null],
			sharWhatsAppUnl: [false],
			onlyEmailCount: [0, Validators.required],
			onlyEmailUnl: [false],
			emailCount: [0, Validators.required],
			emailUnl: [false],
			dripappCount: [0, Validators.required],
			dripappUnl: [false],
			serverStrgCount: [0, Validators.required],
			serverStorageUnl: [false],
			dataTransferCount: [0, Validators.required],
			dataTransferUnl: [false],
			onlyTeamCount: [0, this.appService?.configurable_feature?.teams ? Validators.required : null],
			dripWithTeamCount: [0, this.appService?.configurable_feature?.teams ? Validators.required : null],
			onlyTeamUnl: [false],
			dripWithTeamUnl: [false],
		});
	}
	get f() {
		return this.licenseDetailsForm.controls;
	}

	getAllClientWithoutLicenseById() {
		this.LicenseService.getAllClientWithoutLicenseById(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.ClientList = [];
				for (let client of res.data) {
					this.ClientList.push(client);
				}
			}
			this.spinnerService.hide();
		});
	}

	getAllClientWithLicenseById() {
		this.LicenseService.getAllClientWithLicenseById(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.ClientList = [];
				for (let client of res.data) {
					this.ClientList.push(client);
				}
			}
			this.spinnerService.hide();
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

	getDateByDateAndTimePickerId(date) {
		return new Date(date).setHours(0, 0, 0, 0);
	}

	toggleUnlimited(unlCount, type) {
		if (unlCount == true) {
			this.licenseDetailsForm.controls[type].disable();
		} else {
			this.licenseDetailsForm.controls[type].enable();
		}
	}

	saveLicense() {
		this.licenseDetailsForm.enable();
		if (this.licenseDetailsForm.invalid) {
			this.markAsTouched(this.licenseDetailsForm);
			return;
		}

		if (this.licenseDetailsForm.value.id == null) {
			this.licenseDetailsForm.value.startDate = this.selectedDate.startDate;
			this.licenseDetailsForm.value.endDate = this.selectedendDate.startDate;
			if (this.licenseDetailsForm.value.startDate > this.licenseDetailsForm.value.endDate) {
				this.toastr.error(
					this.appService.getTranslation('Pages.License.AddEdit.Toaster.endDateafterstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else {
			this.licenseDetailsForm.value.startDate = this.selectedDate.startDate['_i'];
			if (
				this.licenseDetailsForm.value.endDate &&
				this.licenseDetailsForm.value.endDate.startDate &&
				this.licenseDetailsForm.value.endDate.startDate['_i']
			) {
				this.licenseDetailsForm.value.endDate = this.licenseDetailsForm.value.endDate.startDate['_i'];
			} else {
				this.licenseDetailsForm.value.endDate = this.selectedendDate.startDate;
			}
			if (
				this.licenseDetailsForm.value.startDate >
				moment(new Date(this.licenseDetailsForm.value.endDate)).format('YYYY-MM-DD')
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.License.AddEdit.Toaster.endDateafterstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		let payload = {
			LicenseDetails: this.licenseDetailsForm.value,
		};

		this.spinnerService.show();
		if (this.licenseDetailsForm.value.id == null) {
			this.LicenseService.createLicence(payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.License.AddEdit.Toaster.licensecreated'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/licenses']);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/licenses']);
				}
			});
		} else {
			this.savePagination();
			this.licenseDetailsForm.value.isSuspended = this.editClientData.isSuspended;
			this.LicenseService.updateLicence(this.licenseDetailsForm.value.id, payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.License.AddEdit.Toaster.licenslupdated'),
						this.appService.getTranslation('Utils.success')
					);
					setTimeout(() => {
						this.router.navigate(['/licenses']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					setTimeout(() => {
						this.router.navigate(['/licenses']);
					}, 100);
				}
			});
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/licenses']);
			}, 100);
		} else {
			this.router.navigate(['/licenses']);
		}
	}

	DateChange(value) {
		this.licenseDetailsForm.controls['startDate'].setValue(value);
	}

	endDateDateChange(value) {
		this.licenseDetailsForm.controls['endDate'].setValue(value);
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('driplicensePageNo', JSON.stringify(payload));
	}
}
