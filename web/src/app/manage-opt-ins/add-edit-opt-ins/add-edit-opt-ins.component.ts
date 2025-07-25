import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import { ManageOptInsService } from '../manage-opt-ins.service';

declare var $: any;
@Component({
	selector: 'app-add-edit-opt-ins',
	templateUrl: './add-edit-opt-ins.component.html',
	styleUrls: ['./add-edit-opt-ins.component.scss'],
})
export class AddEditOptInsComponent implements OnInit {
	marketList: any = [
		{ name: 'India', value: 'India' },
		{ name: 'International', value: 'International' },
		{ name: 'UK', value: 'UK' },
	];
	PolicyList: any = [
		{ label: 'Cookie Policy', value: 'Cookie Policy' },
		{ label: 'Terms and Conditions', value: 'Terms and Conditions' },
		{ label: 'Data Processing Agreement', value: 'Data Processing Agreement' },
		{ label: 'Privacy Policy', value: 'Privacy Policy' },
	];
	optInsForm: FormGroup;
	selectedPolicyType: any = [];
	selectedMarketName: any;

	CookiePolicyAcceptTerms: boolean = false;
	TermsandConditionsAcceptTerms: boolean = false;
	DataProcessingAgreementAcceptTerms: boolean = false;
	PrivacyPolicyAcceptTerms: boolean = false;
	ip_address: any;
	userId: any;
	roleId: any;
	ClientId: any;

	constructor(
		private formBuilder: FormBuilder,
		public appService: AppService,
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private route: ActivatedRoute,
		private http: HttpClient,
		private optInsService: ManageOptInsService
	) {}

	ngOnInit(): void {
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.ClientId = JSON.parse(localStorage.getItem('client')).id;
		this.createOptInsForm();
		// this.getIPAddress();
		this.getMarketList();
	}

	getMarketList() {
		this.optInsService.getAllMarketList().subscribe((res: any) => {
			if (res.success) {
				this.marketList = [];
				this.marketList = res.data;
			}
		});
	}

	createOptInsForm() {
		this.optInsForm = this.formBuilder.group({
			id: null,
			MarketId: [null, Validators.required],
			policy_type: [''],
			CookiePolicy_file: [''],
			TermsandConditions_file: [''],
			PrivacyPolicy_file: [''],
			DataProcessingAgreement_file: [''],
		});
	}

	get f() {
		return this.optInsForm.controls;
	}

	markAsTouched(group: FormGroup) {
		Object.keys(group.controls).map((field) => {
			const control = group.get(field);
			if (control instanceof FormControl) {
				control.markAsTouched({ onlySelf: true });
			} else if (control instanceof FormGroup) {
				this.markAsTouched(control);
			}
		});
	}

	cancel() {
		this.router.navigate(['opt-ins']);
	}

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			this.ip_address = res.ip;
		});
	}

	selectedMarket($event) {
		this.selectedMarketName = this.optInsForm.value['MarketId'];
	}

	changePolicySelection() {
		this.selectedPolicyType = this.optInsForm.value['policy_type'];
		if (this.selectedPolicyType.indexOf('Cookie Policy') < 0) {
			this.onDeleteImage_CookiePolicy();
		}
		if (this.selectedPolicyType.indexOf('Terms and Conditions') < 0) {
			this.onDeleteImage_TermsandConditions();
		}

		if (this.selectedPolicyType.indexOf('Data Processing Agreement') < 0) {
			this.onDeleteImage_DataProcessingAgreement();
		}

		if (this.selectedPolicyType.indexOf('Privacy Policy') < 0) {
			this.onDeleteImage_PrivacyPolicy();
		}
	}

	onDeleteImage_CookiePolicy() {
		$('#media_CookiePolicy').val('');
		this.optInsForm.patchValue({ CookiePolicy_file: '' });
	}

	onDeleteImage_TermsandConditions() {
		$('#media_TermsandConditions').val('');
		this.optInsForm.patchValue({ TermsandConditions_file: '' });
	}

	onDeleteImage_DataProcessingAgreement() {
		$('#media_DataProcessingAgreement').val('');
		this.optInsForm.patchValue({ DataProcessingAgreement_file: '' });
	}

	onDeleteImage_PrivacyPolicy() {
		$('#media_PrivacyPolicy').val('');
		this.optInsForm.patchValue({ PrivacyPolicy_file: '' });
	}

	CookiePolicy_uploadFile(event) {
		if (event.target.files[0].type.includes('application/pdf')) {
			this.optInsForm.patchValue({ CookiePolicy_file: event.target.files[0] });
		} else {
			$('#media_CookiePolicy').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	TermsandConditions_uploadFile(event) {
		if (event.target.files[0].type.includes('application/pdf')) {
			this.optInsForm.patchValue({ TermsandConditions_file: event.target.files[0] });
		} else {
			$('#media_TermsandConditions').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	DataProcessingAgreement_uploadFile(event) {
		if (event.target.files[0].type.includes('application/pdf')) {
			this.optInsForm.patchValue({ DataProcessingAgreement_file: event.target.files[0] });
		} else {
			$('#media_DataProcessingAgreement').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	PrivacyPolicy_uploadFile(event) {
		if (event.target.files[0].type.includes('application/pdf')) {
			this.optInsForm.patchValue({ PrivacyPolicy_file: event.target.files[0] });
		} else {
			$('#media_PrivacyPolicy').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	onCheck_CookiePolicy() {
		this.CookiePolicyAcceptTerms = !this.CookiePolicyAcceptTerms;
	}

	onCheck_TermsandConditions() {
		this.TermsandConditionsAcceptTerms = !this.TermsandConditionsAcceptTerms;
	}

	onCheck_DataProcessingAgreement() {
		this.DataProcessingAgreementAcceptTerms = !this.DataProcessingAgreementAcceptTerms;
	}

	onCheck_PrivacyPolicy() {
		this.PrivacyPolicyAcceptTerms = !this.PrivacyPolicyAcceptTerms;
	}

	save() {
		if (this.optInsForm.invalid) {
			this.markAsTouched(this.optInsForm);
			return;
		}
		if (
			(this.selectedPolicyType.indexOf('Cookie Policy') >= 0 && this.optInsForm.value.CookiePolicy_file == '') ||
			(this.selectedPolicyType.indexOf('Terms and Conditions') >= 0 &&
				this.optInsForm.value.TermsandConditions_file == '') ||
			(this.selectedPolicyType.indexOf('Data Processing Agreement') >= 0 &&
				this.optInsForm.value.DataProcessingAgreement_file == '') ||
			(this.selectedPolicyType.indexOf('Privacy Policy') >= 0 && this.optInsForm.value.PrivacyPolicy_file == '')
		) {
			this.toastr.error(
				this.appService.getTranslation('Utils.pleaseselectfile'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		} else {
			let payload = {
				userId: this.userId,
				RoleId: this.roleId,
				ClientId: this.ClientId,
				ip_address: this.ip_address,
				CookiePolicyAcceptTerms: this.CookiePolicyAcceptTerms,
				TermsandConditionsAcceptTerms: this.TermsandConditionsAcceptTerms,
				DataProcessingAgreementAcceptTerms: this.DataProcessingAgreementAcceptTerms,
				PrivacyPolicyAcceptTerms: this.PrivacyPolicyAcceptTerms,
			};

			const uploadData = new FormData();
			for (var key in payload) {
				uploadData.append(key, payload[key]);
			}
			for (var key in this.optInsForm.value) {
				uploadData.append(key, this.optInsForm.value[key]);
			}

			this.spinnerService.show();
			this.optInsService.changePolicyOfallUser(uploadData).subscribe((res: any) => {
				this.appService.checkNotifcation = true;
				this.toastr.success(res.message, this.appService.getTranslation('Utils.success'));
				this.router.navigate(['opt-ins']);
				this.spinnerService.hide();
			});
		}
	}
}
