import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageSupportService } from '../manage-support.service';
import { AppService } from 'src/app/app.service';

@Component({
	selector: 'app-add-edit-support',
	templateUrl: './add-edit-support.component.html',
	styleUrls: ['./add-edit-support.component.scss'],
})
export class AddEditSupportComponent implements OnInit {
	subjectList: any[] = [
		{ name: 'Product Information', id: 'Product Information' },
		{ name: 'Product Usage', id: 'Product Usage' },
		{ name: 'Purchase / Renewal', id: 'Purchase / Renewal' },
		{ name: 'General Information', id: 'General Information' },
	];
	supportTicketForm: FormGroup;
	userInfo: any;
	userClientId: any;

	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private supportService: ManageSupportService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.userInfo = JSON.parse(localStorage.getItem('user')).user;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;

		this.createLicenseDetailsForm();
		this.supportTicketForm.controls['email'].setValue(this.userInfo.email);
		this.supportTicketForm.controls['phone'].setValue(this.userInfo.phone);
	}

	createLicenseDetailsForm() {
		this.supportTicketForm = this.formBuilder.group({
			id: null,
			description: ['', Validators.required],
			email: [''],
			phone: [''],
			subject: [null, Validators.required],
		});
	}
	get f() {
		return this.supportTicketForm.controls;
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

	saveTicket() {
		if (this.supportTicketForm.invalid) {
			this.markAsTouched(this.supportTicketForm);
			return;
		}
		this.spinnerService.show();
		if (this.supportTicketForm.value.id == null) {
			this.supportService.createTicket(this.supportTicketForm.value, this.userClientId).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.toastr.success(
						this.appService.getTranslation('Pages.Support.AddEdit.Toaster.ticketraised'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/support']);
					this.spinnerService.hide();
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/support']);
				}
			});
		}
	}

	cancel() {
		this.router.navigate(['/support']);
	}
}
