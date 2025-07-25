import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageWhatsAppSetupService } from '../manage-whatsapp-setups.service';
import { AppService } from 'src/app/app.service';

@Component({
	selector: 'app-add-edit-whatsapp-setups',
	templateUrl: './add-edit-whatsapp-setups.component.html',
	styleUrls: ['./add-edit-whatsapp-setups.component.css'],
})
export class AddEditWhatsAppSetupsComponent implements OnInit {
	whatsAppSetupDetailsForm: FormGroup;
	userClient: any;
	ClientList: any;
	timePicker: any = [];
	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};
	setupId: any;
	clientId: any;
	editClientData: any;
	islicenseEdit: boolean = false;
	selecteAllChildClient = false;
	template_Category = [{ name: 'Utility' }, { name: 'Marketing' }, { name: 'Authentication' }];
	retryFrequency = [{ name: 1 }, { name: 2 }, { name: 3 }, { name: 4 }, { name: 5 }];
	childClientList = [];
	pageDetails: any;
	projectType = 'drip';
	WhatsAppSetup: any;
	isViewMode: boolean = false;
	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private WhatsAppSetupService: ManageWhatsAppSetupService,
		private router: Router,
		private route: ActivatedRoute
	) {
		if (localStorage.getItem('projectName') && localStorage.getItem('projectName') == 'diwo') {
			this.projectType = 'diwo';
		}
	}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.pageDetails = JSON.parse(localStorage.getItem('WhatsappSetupPageNo')) || null;
		this.createWhatsAppSetupDetailsForm();
		// this.setupId = this.route.snapshot.queryParams.whatsAppSetupId;
		this.WhatsAppSetup = this.route.params['_value'];

		if (this.WhatsAppSetup && this.WhatsAppSetup.whatsAppSetupId) {
			this.WhatsAppSetupService.getWhatsAppSetUpById(this.WhatsAppSetup.whatsAppSetupId).subscribe((res: any) => {
				if (res.success) {
					this.whatsAppSetupDetailsForm.patchValue(res.data);
					this.whatsAppSetupDetailsForm.controls['messageLimit'].disable();
					this.ClientList = [];
					this.childClientList = [];
					for (let client of res.data.ClientWhatsAppSetups) {
						if (client.mainClient) {
							this.ClientList.push(client.Client);
							this.whatsAppSetupDetailsForm.controls['ClientId'].setValue(client.ClientId);
						} else {
							this.childClientList.push({
								client_id: client.Client.client_id,
								name: client.Client.name,
								isSelected: true,
								id: client.Client.id,
							});
						}
					}
					this.whatsAppSetupDetailsForm.controls['ClientId'].disable();

					if (this.WhatsAppSetup && this.WhatsAppSetup.whatsAppSetupId && this.WhatsAppSetup.type == 'view') {
						this.whatsAppSetupDetailsForm.disable();
						this.isViewMode = true;
					}
				}
			});
		} else {
			this.whatsAppSetupDetailsForm.controls['messageLimit'].disable();
			this.WhatsAppSetupService.getAllClientWithoutLicenseById(this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					this.ClientList = res.data;
				}
			});
		}
	}

	selectClient() {
		let selectedClientId = this.whatsAppSetupDetailsForm.controls['ClientId'].value;
		if (selectedClientId) {
			this.WhatsAppSetupService.getAllChildClientNotHaveWhatsAppSetup(selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.childClientList = [];
					this.childClientList = res.data;
				}
			});
		}
	}

	// createWhatsAppSetupDetailsForm() {
	// 	this.whatsAppSetupDetailsForm = this.formBuilder.group({
	// 		id: null,
	// 		ClientId: [null, Validators.required],

	// 		//gupshup
	// 		user_id: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 		password: this.projectType == 'drip' ? [null, Validators.required] : [null],

	// 		//common
	// 		status: ['Active'],
	// 		canSelectTempType: this.projectType == 'drip' ? [false, Validators.required] : [false],
	// 		canChangeTempCat: this.projectType == 'drip' ? [false, Validators.required] : [false],
	// 		category: this.projectType == 'drip' ? ['Utility', Validators.required] : [null],
	// 		//common end

	// 		sendNtOptIn: [false],
	// 		optInRedirectUrl: [null],
	// 		optInMsg: [null],
	// 		messenger_id: [null, Validators.required],
	// 		messenger_password: [null, Validators.required],
	// 		messenger_template: [null, Validators.required],
	// 		waNumber: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 		otpTempId: [null],
	// 		otpTempStatus: [null],
	// 		messageLimit: ['TIER_1K'],
	// 		enableRetry: [false],
	// 		retryInterval: [null],
	// 		retryFrequency: [null],

	// 		//Meta
	// 		isMeta: [false],
	// 		MTPNoId: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 		MTToken: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 		MTAccId: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 		MTAppId: this.projectType == 'drip' ? [null, Validators.required] : [null],
	// 	});
	// }

	createWhatsAppSetupDetailsForm() {
		this.whatsAppSetupDetailsForm = this.formBuilder.group({
			id: null,
			ClientId: [null, Validators.required],

			// Gupshup
			user_id: [null],
			password: [null],
			waNumber: [null],

			// Common (conditionally required if drip)
			status: ['Active'],
			canSelectTempType: [false],
			canChangeTempCat: [false],
			category: ['Utility'],

			sendNtOptIn: [false],
			optInRedirectUrl: [null],
			optInMsg: [null],
			messenger_id: [null, Validators.required],
			messenger_password: [null, Validators.required],
			messenger_template: [null, Validators.required],
			otpTempId: [null],
			otpTempStatus: [null],
			messageLimit: ['TIER_1K'],
			enableRetry: [false],
			retryInterval: [null],
			retryFrequency: [null],

			// Meta
			isMeta: [false],
			MTPNoId: [null],
			MTToken: [null],
			MTAccId: [null],
			MTAppId: [null],
		});

		// Handle toggle changes for isMeta
		this.whatsAppSetupDetailsForm.get('isMeta')?.valueChanges.subscribe((isMeta: boolean) => {
			const metaFields = ['MTPNoId', 'MTToken', 'MTAccId', 'MTAppId'];
			const gupshupFields = ['user_id', 'password'];

			// Reset fields of the opposite platform
			const fieldsToReset = isMeta ? gupshupFields : metaFields;
			// fieldsToReset.forEach((field) => {
			// 	this.whatsAppSetupDetailsForm.get(field)?.reset(null, { emitEvent: false });
			// });

			// Apply validators based on toggle
			this.updateValidatorsBasedOnMeta(isMeta);
		});

		// Initial validator setup
		const initialIsMeta = this.whatsAppSetupDetailsForm.get('isMeta')?.value;
		this.updateValidatorsBasedOnMeta(initialIsMeta);
	}

	updateValidatorsBasedOnMeta(isMeta: boolean) {
		const form = this.whatsAppSetupDetailsForm;
		const isDrip = this.projectType === 'drip';

		const gupshupFields = ['user_id', 'password'];
		const metaFields = ['MTPNoId', 'MTToken', 'MTAccId', 'MTAppId'];
		const commonDripFields = ['canSelectTempType', 'canChangeTempCat', 'category'];

		// Gupshup validation
		gupshupFields.forEach((field) => {
			const control = form.get(field);
			if (!control) return;
			if (!isMeta && isDrip) {
				control.setValidators(Validators.required);
			} else {
				control.clearValidators();
			}
			control.updateValueAndValidity();
		});

		// Meta validation
		metaFields.forEach((field) => {
			const control = form.get(field);
			if (!control) return;
			if (isMeta && isDrip) {
				control.setValidators(Validators.required);
			} else {
				control.clearValidators();
			}
			control.updateValueAndValidity();
		});

		// Common fields: required only for drip
		commonDripFields.forEach((field) => {
			const control = form.get(field);
			if (!control) return;
			if (isDrip) {
				control.setValidators(Validators.required);
			} else {
				control.clearValidators();
			}
			control.updateValueAndValidity();
		});
	}

	get f() {
		return this.whatsAppSetupDetailsForm.controls;
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

	onEnableMeta() {}

	saveWhatsAppSetup() {
		this.whatsAppSetupDetailsForm.enable();

		// Re-apply validators dynamically before checking validity
		const isMeta = this.whatsAppSetupDetailsForm.get('isMeta')?.value;
		this.updateValidatorsBasedOnMeta(isMeta);

		// Force form controls to re-evaluate their validity
		Object.keys(this.whatsAppSetupDetailsForm.controls).forEach((field) => {
			const control = this.whatsAppSetupDetailsForm.get(field);
			control?.updateValueAndValidity();
		});

		if (this.whatsAppSetupDetailsForm.invalid) {
			this.markAsTouched(this.whatsAppSetupDetailsForm);
			return;
		}
		let flag = false;
		if (this.whatsAppSetupDetailsForm.controls['enableRetry'].value) {
			if (
				this.whatsAppSetupDetailsForm.controls['retryInterval'].value == null ||
				this.whatsAppSetupDetailsForm.controls['retryInterval'].value == ''
			) {
				this.whatsAppSetupDetailsForm.controls['retryInterval'].setErrors({ required: true });
				flag = true;
			} else if (this.whatsAppSetupDetailsForm.controls['retryInterval'].value <= 0) {
				this.whatsAppSetupDetailsForm.controls['retryInterval'].setValue(null);
				//Toster error
				this.toastr.error(
					this.appService.getTranslation('Pages.WhatsAppSetups.AddEdit.Toaster.retryIntervalError'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}
			if (this.whatsAppSetupDetailsForm.controls['retryFrequency'].value == null) {
				this.whatsAppSetupDetailsForm.controls['retryFrequency'].setErrors({ required: true });
				flag = true;
			}
		}
		if (flag) {
			return;
		}
		let payload = {
			whatsAppSetupDetails: this.whatsAppSetupDetailsForm.value,
			selectedChildClient: this.childClientList,
		};

		console.log('-payload-', payload);

		// return;

		this.spinnerService.show();
		if (this.whatsAppSetupDetailsForm.value.id == null) {
			this.WhatsAppSetupService.createWhatsAppSetup(payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.WhatsAppSetups.AddEdit.Toaster.setupcreated'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/whatsapp-setup']);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/whatsapp-setup']);
				}
			});
		} else {
			this.savePagination();
			this.WhatsAppSetupService.updateWhatsAppSetup(
				payload,
				payload.whatsAppSetupDetails.id,
				this.userClient.id
			).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.WhatsAppSetups.AddEdit.Toaster.setupupdated'),
						this.appService.getTranslation('Utils.success')
					);
					setTimeout(() => {
						this.router.navigate(['/whatsapp-setup']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					setTimeout(() => {
						this.router.navigate(['/whatsapp-setup']);
					}, 100);
				}
			});
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/whatsapp-setup']);
			}, 100);
		} else {
			this.router.navigate(['/whatsapp-setup']);
		}
	}

	selectAllChildClient() {
		for (let client of this.childClientList) {
			if (this.selecteAllChildClient) {
				client.isSelected = true;
			} else {
				client.isSelected = false;
			}
		}
	}

	changeOneToggle(flag) {
		if (flag == false) {
			this.selecteAllChildClient = false;
		}
		if (flag == true) {
			let flag_ = true;
			for (let client of this.childClientList) {
				if (!client.isSelected) {
					flag_ = false;
				}
			}
			this.selecteAllChildClient = flag_;
		}
	}
	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('WhatsappSetupPageNo', JSON.stringify(payload));
	}

	createOtpTemplate() {
		this.spinnerService.show();
		let selectedClientId = this.whatsAppSetupDetailsForm.controls['ClientId'].value;
		this.WhatsAppSetupService.createWhatsAppOTPTemplate(selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				this.whatsAppSetupDetailsForm.controls['otpTempStatus'].setValue('Pending');
				this.toastr.success(
					this.appService.getTranslation('Pages.WhatsAppSetups.AddEdit.Toaster.otptemplatecreated'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
	}

	startEmbeddedSignup() {
		const appId = '2528606894137998';
		const redirectUri = 'https://5936f67a76fc.ngrok-free.app/v1/meta/onboard/callback'; // your server endpoint
		const state = '1001';

		const url = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
			redirectUri
		)}&state=${state}&scope=whatsapp_business_management,whatsapp_business_messaging,business_management`;

		console.log('---url-------', url);

		window.open(url, '_blank', 'width=600,height=700');
	}
}
