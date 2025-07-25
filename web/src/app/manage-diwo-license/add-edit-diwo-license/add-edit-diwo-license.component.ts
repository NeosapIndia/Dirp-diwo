import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { AppService } from 'src/app/app.service';
import { ManageDiwoLicenseService } from '../manage-diwo-license.service';

@Component({
	selector: 'app-add-edit-diwo-license',
	templateUrl: './add-edit-diwo-license.component.html',
	styleUrls: ['./add-edit-diwo-license.component.css'],
})
export class AddEditDiwoLicenseComponent implements OnInit, AfterViewChecked {
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
	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private LicenseService: ManageDiwoLicenseService,
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
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

					if (this.licenseDetailsForm.controls['unlimitedLearner'].value == true) {
						this.licenseDetailsForm.controls['learnerCount'].disable();
					}
					if (this.licenseDetailsForm.controls['unlimitedWorkbook'].value == true) {
						this.licenseDetailsForm.controls['workbookCount'].disable();
					}

					if (this.licenseDetailsForm.controls['UnlimitedServerStor'].value == true) {
						this.licenseDetailsForm.controls['serverStorageCount'].disable();
					}
					if (this.licenseDetailsForm.controls['unlimitedDataTransfer'].value == true) {
						this.licenseDetailsForm.controls['DataTransferCount'].disable();
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
			unlimitedLearner: [false],

			workbookCount: [0, Validators.required],
			unlimitedWorkbook: [false],

			serverStorageCount: [0, Validators.required],
			UnlimitedServerStor: [false],

			DataTransferCount: [0, Validators.required],
			unlimitedDataTransfer: [false],
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
					this.appService.getTranslation('Pages.DiwoLicense.AddEdit.Toaster.endDateafterstartDate'),
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
					this.appService.getTranslation('Pages.DiwoLicense.AddEdit.Toaster.endDateafterstartDate'),
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
						this.appService.getTranslation('Pages.DiwoLicense.AddEdit.Toaster.licensecreated'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/diwo-licenses']);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/diwo-licenses']);
				}
			});
		} else {
			this.licenseDetailsForm.value.isSuspended = this.editClientData.isSuspended;
			this.LicenseService.updateLicence(this.licenseDetailsForm.value.id, payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.DiwoLicense.AddEdit.Toaster.licenslupdated'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/diwo-licenses']);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/diwo-licenses']);
				}
			});
		}
	}

	cancel() {
		this.router.navigate(['/diwo-licenses']);
	}

	DateChange(value) {
		this.licenseDetailsForm.controls['startDate'].setValue(value);
	}

	endDateDateChange(value) {
		this.licenseDetailsForm.controls['endDate'].setValue(value);
	}
}
