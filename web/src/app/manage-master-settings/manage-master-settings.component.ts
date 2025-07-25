import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { environment } from 'src/environments/environment';
import { ManageMasterSettingsService } from './manage-master-settings.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppService } from '../app.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

declare var $: any;
@Component({
	selector: 'app-manage-master-settings',
	templateUrl: './manage-master-settings.component.html',
	styleUrls: ['./manage-master-settings.component.scss'],
	animations: [routerTransition()],
})
export class ManageMasterSettingsComponent implements OnInit {
	assetBasePath = environment.imageHost;
	assetBasePath2 = environment.imagePath;
	aboutUsInfo: any;
	marketList: any = [];
	loginAllBranding = [];
	imageHost = environment.imageHost + environment.imagePath;
	appVerion = environment.appVersion;
	marketIdForEdit;
	marketUrlForm: FormGroup;
	writePermission: any;
	roleId: any;
	clientListForForm: any[];
	userClient: any;
	vimeoCredentialList: any[] = [];
	zoomAppCredentialList: any[] = [];
	AssistantAPICredentialList: any[] = [];
	vimeoCredentialForm: FormGroup;
	loginAppBrandingForm: FormGroup;
	zoomAppCredentialForm: FormGroup;
	assistanceAPICredentialForm: FormGroup;
	temasCredentialForm: FormGroup;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	showSelectAllOption: boolean = false;
	selectedVimeoIds: any = [];
	selectAllFlag: boolean;
	selectedVimeoIdFordelete: any;
	isDataLoaded: boolean = false;
	totalZoomAppCount: any = 0;
	assistanceAPICount: any = 0;
	editAssistance: boolean = false;
	teamsCredentialList: any[] = [];
	ETLConfigration: any[] = [];
	iconObject = {
		info_icon_20: null,
		search_loader: null,
	};
	pipelineType = [{ name: 'Text Embeddings Pipeline' }, { name: 'Multimodal Embedding Pipeline' }];
	textEmeddingsPipelineOption = [
		{ name: 'Use LlamaParse' },
		{ name: 'Use Contextual Retrieval' },
		{ name: 'Use Hybrid Search' },
	];

	llamaParseModeList = [{ name: 'Accurate Mode' }, { name: 'Premium Mode' }, { name: '3rd Party multi-modal model' }];
	multimodalEmbeddingPipelineOption = [{ name: 'Use LlamaParse' }];
	EmbeddingProvider = [{ name: 'OpenAI' }];
	editETL: boolean = false;
	ETLConfigForm: FormGroup;

	maxLengthForPWALoginText = 140;
	characterRemainsForPWALoginText = null;

	maxLengthForWebAboutText = 480;
	characterRemainsForWebAboutText = null;

	constructor(
		public masterSettingService: ManageMasterSettingsService,
		private formBuilder: FormBuilder,
		public appService: AppService,
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService
	) {}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.getAllMarketURL();
		this.createForm();
		this.getRollPermission();
		this.createVimeoCredentialForm();
		this.createZoomAppCredentialForm();
		this.createAssistantAPICredentialForm();
		this.createTeamsForm();
		this.getLoginAppBrandingData();
		this.createETLConfigForm();
		this.createLoginAppBradingForm();
		this.getAppBranding();
		this.getClientListOfWithoutVimeoCredentail();
		this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
		this.getZoomAppCredentialList(this.userClient.id, this.page, this.limit);
		this.getAssistantAPICredentialList(this.userClient.id, this.page, this.limit);
		this.getTeamsCredential();
		if (this.masterSettingService?.type == 'drip') {
			this.getETLConfigration();
		}
	}

	getAllMarketURL() {
		this.masterSettingService.getMarketForPolicyURLDetails().subscribe((res: any) => {
			if (res.success) {
				this.marketList = [];
				this.marketList = res.data;
			}
			this.isDataLoaded = true;
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [12],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	editMarketUrl(item) {
		this.marketIdForEdit = item.id;
		this.marketUrlForm.patchValue(item);
		$('#editMArketPolicyURlModel').modal('show');
	}

	createForm() {
		this.marketUrlForm = this.formBuilder.group({
			tosUrl: ['', Validators.required],
			privacyPolicyUrl: ['', Validators.required],
			dpaUrl: ['', Validators.required],
			cookiePolicyUrl: ['', Validators.required],
			name: ['', Validators.required],
		});
	}
	get f() {
		return this.marketUrlForm.controls;
	}

	createTeamsForm() {
		this.temasCredentialForm = this.formBuilder.group({
			id: [Validators.required],
			client_id: [Validators.required],
			client_secret: [Validators.required],
			tenant_id: [Validators.required],
		});
	}
	get f5() {
		return this.temasCredentialForm.controls;
	}

	cancelModel() {
		$('#editMArketPolicyURlModel').modal('hide');
	}

	updateMArketURL() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (this.marketUrlForm.invalid) {
				this.markAsTouched(this.marketUrlForm);
				return;
			}
			let payload = {
				marketPolicyURLDetails: this.marketUrlForm.value,
			};
			this.masterSettingService.updateMarketPolicyURL(this.marketIdForEdit, payload).subscribe((res: any) => {
				if (res.success) {
					this.toastr.success(
						this.appService.getTranslation('Pages.MasterSettings.Toaster.updatemarketpolicy'),
						this.appService.getTranslation('Utils.success')
					);
					this.marketIdForEdit = null;
					$('#editMArketPolicyURlModel').modal('hide');
					this.getAllMarketURL();
					this.marketUrlForm.reset();
				}
			});
		}
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

	createVimeoCredentialForm() {
		this.vimeoCredentialForm = this.formBuilder.group({
			id: null,
			clientId: [null, Validators.required],
			// For Vimeo
			vimeoUserId: [null, this.appService?.configurable_feature?.vimeo ? Validators.required : null],
			vimeoClientId: [null, this.appService?.configurable_feature?.vimeo ? Validators.required : null],
			vimeoToken: [null, this.appService?.configurable_feature?.vimeo ? Validators.required : null],
			vimeoClientSecretKey: [null, this.appService?.configurable_feature?.vimeo ? Validators.required : null],

			//For MediaCms
			CMSUserName: [null, this.appService?.configurable_feature?.mediaCMS ? Validators.required : null],
			CMSPassword: [null, this.appService?.configurable_feature?.mediaCMS ? Validators.required : null],
		});
	}
	get f2() {
		return this.vimeoCredentialForm.controls;
	}

	createZoomAppCredentialForm() {
		this.zoomAppCredentialForm = this.formBuilder.group({
			id: null,
			ClientId: [null, Validators.required],
			zoom_client_id: [null, Validators.required],
			zoom_client_secret_id: [null, Validators.required],
		});
	}

	get f3() {
		return this.zoomAppCredentialForm.controls;
	}

	createETLConfigForm() {
		this.ETLConfigForm = this.formBuilder.group({
			ClientId: [null, Validators.required],
			pipelineType: [null, Validators.required],
			pipelineOption: [null, Validators.required],
			chunkSize: [1000, Validators.required],
			chunkOverlap: [200, Validators.required],
			AIApiKey: [null, Validators.required],
			EmbeddingModel: ['text-embedding-3-small', Validators.required],
			EmbeddingProvider: ['OpenAI', Validators.required],
		});
	}

	get f6() {
		return this.ETLConfigForm.controls;
	}

	createAssistantAPICredentialForm() {
		this.assistanceAPICredentialForm = this.formBuilder.group({
			id: null,
			openAISecretKey: [null, Validators.required],
			assistantId: [null],
		});
	}
	get f4() {
		return this.assistanceAPICredentialForm.controls;
	}

	getClientListOfWithoutVimeoCredentail() {
		this.masterSettingService.getClientListOfWithoutVimeoCredentail(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	getClientListOfWithoutZoomAppCredentail() {
		this.masterSettingService.getClientListOfWithoutZoomAppCredentail(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	getClientListOfWithoutAssistantAPICredentail() {
		this.masterSettingService.getClientListOfWithouAssistantAPICredentail(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	getClientListOfWithoutETlConfi() {
		this.masterSettingService.getClientListOfWithoutETlConfi(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	editVimeoCredential(item) {
		console.log('----item---', item);
		let payload = {
			id: item.id,
			vimeoUserId: item.vUserId,
			vimeoClientId: item.vClientId,
			vimeoToken: item.vToken,
			vimeoClientSecretKey: item.vClientSecKey,
			clientId: item.client__Id,
			CMSUserName: item.CMSUserName,
			CMSPassword: item.CMSPassword,
		};
		this.vimeoCredentialForm.reset();
		this.vimeoCredentialForm.patchValue(payload);
		this.clientListForForm = [];
		this.clientListForForm.push({ clientIdWithName: item.clientIdWithName, id: item.client__Id });
		this.vimeoCredentialForm.controls['clientId'].disable();
		$('#addVimeoCredentialModel').modal('show');
	}

	editZoomAppCredential(item) {
		item.ClientId = item.id;
		this.zoomAppCredentialForm.reset();
		this.zoomAppCredentialForm.patchValue(item);
		this.clientListForForm = [];
		this.clientListForForm.push({ clientIdWithName: item.client_id + ' - ' + item.name, id: item.id });
		this.zoomAppCredentialForm.controls['ClientId'].disable();
		$('#addZoomCredentialModel').modal('show');
	}

	createVimeoCredential() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (this.vimeoCredentialForm.invalid) {
				this.markAsTouched(this.vimeoCredentialForm);
				return;
			}
			this.vimeoCredentialForm.controls['clientId'].enable();
			let payload = {
				vimeoCredentialDetails: this.vimeoCredentialForm.value,
			};
			this.spinnerService.show();
			if (this.vimeoCredentialForm.value.id == null) {
				this.masterSettingService.createVimeoCredential(payload).subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						if (this.appService?.configurable_feature?.vimeo) {
							this.toastr.success(
								this.appService.getTranslation('Pages.MasterSettings.Toaster.addvimeocredentail'),
								this.appService.getTranslation('Utils.success')
							);
						}

						if (this.appService?.configurable_feature?.mediaCMS) {
							this.toastr.success(
								this.appService.getTranslation('Pages.MasterSettings.Toaster.addmediacmscredentail'),
								this.appService.getTranslation('Utils.success')
							);
						}

						$('#addVimeoCredentialModel').modal('hide');
						this.vimeoCredentialForm.reset();
						this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
						this.spinnerService.hide();
					} else {
						this.spinnerService.hide();
					}
				});
			} else {
				this.masterSettingService
					.updateVimeoCredential(payload, this.vimeoCredentialForm.value.id)
					.subscribe((res: any) => {
						if (res.success) {
							this.appService.checkNotifcation = true;
							if (this.appService?.configurable_feature?.vimeo) {
								this.toastr.success(
									this.appService.getTranslation('Pages.MasterSettings.Toaster.updatevimeocredentail'),
									this.appService.getTranslation('Utils.success')
								);
							}

							if (this.appService?.configurable_feature?.mediaCMS) {
								this.toastr.success(
									this.appService.getTranslation('Pages.MasterSettings.Toaster.updatemediacmscredentail'),
									this.appService.getTranslation('Utils.success')
								);
							}
							$('#addVimeoCredentialModel').modal('hide');
							this.vimeoCredentialForm.controls['clientId'].enable();
							this.vimeoCredentialForm.reset();
							this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
							this.spinnerService.hide();
						} else {
							this.spinnerService.hide();
						}
					});
			}
		}
	}

	createZoomAppCredential() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (this.zoomAppCredentialForm.invalid) {
				this.markAsTouched(this.zoomAppCredentialForm);
				return;
			}
			this.zoomAppCredentialForm.controls['ClientId'].enable();
			let payload = {
				zoomAppCredentialDetails: this.zoomAppCredentialForm.value,
			};
			if (this.zoomAppCredentialForm.value.id == null) {
				this.masterSettingService.createZoomAppCredential(payload).subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.toastr.success(
							this.appService.getTranslation('Pages.MasterSettings.Toaster.addzoomAppredentail'),
							this.appService.getTranslation('Utils.success')
						);
						$('#addZoomCredentialModel').modal('hide');
						this.zoomAppCredentialForm.reset();
						this.getZoomAppCredentialList(this.userClient.id, this.page, this.limit);
					}
				});
			} else {
				this.masterSettingService
					.updateZoomAppCredential(payload, this.zoomAppCredentialForm.value.id)
					.subscribe((res: any) => {
						if (res.success) {
							this.appService.checkNotifcation = true;
							this.toastr.success(
								this.appService.getTranslation('Pages.MasterSettings.Toaster.updatezoomAppredentail'),
								this.appService.getTranslation('Utils.success')
							);
							$('#addZoomCredentialModel').modal('hide');
							this.zoomAppCredentialForm.controls['ClientId'].enable();
							this.zoomAppCredentialForm.reset();
							this.getZoomAppCredentialList(this.userClient.id, this.page, this.limit);
						}
					});
			}
		}
	}

	getVimeoCredentialList(clientId, page, limit) {
		this.masterSettingService.vimeoCredentialDetails(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.vimeoCredentialList = [];
				let payload;
				for (let data of res.data) {
					if (data && data.VimeoCredential && data.VimeoCredential != null && data.VimeoCredential != undefined) {
						payload = {
							clientIdWithName: data.clientIdWithName,
							id: data.VimeoCredential.id,
							client_id: data.client_id,
							clientName: data.name,
							client__Id: data.id,
							vUserId: data.VimeoCredential.vUserId,
							vClientId: data.VimeoCredential.vClientId,
							vToken: data.VimeoCredential.vToken,
							vClientSecKey: data.VimeoCredential.vClientSecKey,
							CMSUserName: data.VimeoCredential.CMSUserName,
							CMSPassword: data.VimeoCredential.CMSPassword,
						};
						this.vimeoCredentialList.push(payload);
					} else if (
						data &&
						data.DiwoVimeoCredential &&
						data.DiwoVimeoCredential != null &&
						data.DiwoVimeoCredential != undefined
					) {
						payload = {
							clientIdWithName: data.clientIdWithName,
							id: data.DiwoVimeoCredential.id,
							client_id: data.client_id,
							clientName: data.name,
							client__Id: data.id,
							vUserId: data.DiwoVimeoCredential.vUserId,
							vClientId: data.DiwoVimeoCredential.vClientId,
							vToken: data.DiwoVimeoCredential.vToken,
							vClientSecKey: data.DiwoVimeoCredential.vClientSecKey,
							CMSUserName: data.DiwoVimeoCredential.CMSUserName,
							CMSPassword: data.DiwoVimeoCredential.CMSPassword,
						};
						this.vimeoCredentialList.push(payload);
					}
				}
				this.totalCount = res.count;
				this.isDataLoaded = true;
			}
		});
	}

	getZoomAppCredentialList(clientId, page, limit) {
		this.masterSettingService.zoomAppCredentialDetails(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.zoomAppCredentialList = [];

				for (let data of res.data) {
					if (data && data.ZoomAppDetails && data.ZoomAppDetails.length > 0) {
						data.zoom_client_id = data.ZoomAppDetails[0].zoom_client_id;
						data.zoom_client_secret_id = data.ZoomAppDetails[0].zoom_client_secret_id;
						data.ClientId = data.id;
						data.id = data.ZoomAppDetails[0].id;
						this.zoomAppCredentialList.push(data);
					}
				}
				this.totalZoomAppCount = res.count;
				this.isDataLoaded = true;
			}
		});
	}

	getAssistantAPICredentialList(clientId, page, limit) {
		this.masterSettingService.assistantAPICredentialDetails(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.AssistantAPICredentialList = [];

				for (let data of res.data) {
					this.AssistantAPICredentialList.push(data);
				}
				this.assistanceAPICount = res.count;
				this.isDataLoaded = true;
			}
		});
	}

	openVimeoCredentialPopUp() {
		this.getClientListOfWithoutVimeoCredentail();
		this.vimeoCredentialForm.reset();
		$('#addVimeoCredentialModel').modal('show');
	}

	openZoomAppCredentialPopUp() {
		this.getClientListOfWithoutZoomAppCredentail();
		this.zoomAppCredentialForm.reset();
		$('#addZoomCredentialModel').modal('show');
	}

	cancelVimeoCredentialPopUpModel() {
		this.vimeoCredentialForm.reset();
		$('#addVimeoCredentialModel').modal('hide');
		this.vimeoCredentialForm.controls['clientId'].enable();
	}

	cancelETLCongigPopUpModel() {
		this.ETLConfigForm.reset();
		$('#addETLConfigModel').modal('hide');
		this.ETLConfigForm.controls['clientId'].enable();
	}

	cancelZoomAppCredentialPopUpModel() {
		this.zoomAppCredentialForm.reset();
		$('#addZoomCredentialModel').modal('hide');
		this.zoomAppCredentialForm.controls['ClientId'].enable();
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.vimeoCredentialList.forEach((element, index) => {
				if (!this.selectedVimeoIds.includes(element.id)) this.selectedVimeoIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.vimeoCredentialList.forEach((element, index) => {
				this.selectedVimeoIds.push(element.id);
				let indexof = this.selectedVimeoIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedVimeoIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedVimeoIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedVimeoIds.indexOf(item.id) > -1) {
			this.selectedVimeoIds.splice(this.selectedVimeoIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedVimeoIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedVimeoIds.length == this.vimeoCredentialList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedVimeoIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	deleteVimeoCred() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedVimeoIdFordelete = this.selectedVimeoIds;
			$('#deleteVimeoModal').modal('show');
		}
	}

	cancelDeletePopUp() {
		$('#deleteVimeoModal').modal('hide');
		this.selectedVimeoIdFordelete = null;
	}

	removeVimeoCred() {
		this.spinnerService.show();
		this.masterSettingService
			.deleteVimeoCredentail(this.selectedVimeoIdFordelete, this.userClient.id)
			.subscribe((res: any) => {
				if (res.success) {
					$('#deleteVimeoModal').modal('hide');
					this.selectedVimeoIdFordelete = null;
					this.spinnerService.hide();

					if (this.appService?.configurable_feature?.vimeo) {
						this.toastr.success(
							this.appService.getTranslation('Pages.MasterSettings.Toaster.vimeoCredentaildeleted'),
							this.appService.getTranslation('Utils.success')
						);
					}

					if (this.appService?.configurable_feature?.mediaCMS) {
						this.toastr.success(
							this.appService.getTranslation('Pages.MasterSettings.Toaster.mediacmsCredentaildeleted'),
							this.appService.getTranslation('Utils.success')
						);
					}

					this.selectedVimeoIds = [];
					this.getVimeoCredentialList(this.userClient.id, this.page, this.limit);
				}
			});
	}

	editAssistantAPICredential(item) {
		this.editAssistance = true;
		this.assistanceAPICredentialForm.reset();
		this.assistanceAPICredentialForm.patchValue(item);
		this.clientListForForm = [];
		this.clientListForForm.push({ clientIdWithName: item.client_id + ' - ' + item.name, id: item.id });
		$('#addAssistantAPICredentialModel').modal('show');
	}

	openAssistantAPICredentialPopUp() {
		this.editAssistance = false;
		this.getClientListOfWithoutAssistantAPICredentail();
		this.assistanceAPICredentialForm.reset();
		$('#addAssistantAPICredentialModel').modal('show');
	}

	ETLConfigurationPopUp() {
		this.editETL = false;
		this.getClientListOfWithoutETlConfi();
		this.ETLConfigForm.controls['ClientId'].enable();
		this.ETLConfigForm.reset();
		$('#addETLConfigModel').modal('show');
	}

	cancelAssistantAPICredentialPopUpModel() {
		this.assistanceAPICredentialForm.reset();
		$('#addAssistantAPICredentialModel').modal('hide');
	}

	createAssistantAPICredential() {
		//Check Create or Update
		this.masterSettingService
			.createUpdateAssistantAPICredential(this.assistanceAPICredentialForm.value)
			.subscribe((res: any) => {
				if (res.success) {
					if (this.editAssistance) {
						this.toastr.success(
							this.appService.getTranslation('Pages.MasterSettings.Toaster.updateAssistanteAPIcredentail'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.MasterSettings.Toaster.addAssistantAPIcredentail'),
							this.appService.getTranslation('Utils.success')
						);
					}
					this.getAssistantAPICredentialList(this.userClient.id, this.page, this.limit);
					this.cancelAssistantAPICredentialPopUpModel();
				}
			});
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createETLConfigCredential() {
		//Create Params Object
		let payload = this.ETLConfigForm.value;
		payload.LlamaParams = {
			parsingInstruction: this.ETLConfigForm.value.parsingInstruction,
			skipDiagonalText: this.ETLConfigForm.value.skipDiagonalText,
			invalidateCache: this.ETLConfigForm.value.invalidateCache,
			doNotCache: this.ETLConfigForm.value.doNotCache,
			// fastMode: this.ETLConfigForm.value.fastMode,
			doNotUnrollColumns: this.ETLConfigForm.value.doNotUnrollColumns,
			pageSeparator: this.ETLConfigForm.value.pageSeparator,
			pagePrefix: this.ETLConfigForm.value.pagePrefix,
			pageSuffix: this.ETLConfigForm.value.pageSuffix,
			boundingBox: this.ETLConfigForm.value.boundingBox,
			targetPages: this.ETLConfigForm.value.targetPages,
			takeScreenshot: this.ETLConfigForm.value.takeScreenshot,
			disableOcr: this.ETLConfigForm.value.disableOcr,
			continuousMode: this.ETLConfigForm.value.continuousMode,
			isFormattingInstruction: this.ETLConfigForm.value.isFormattingInstruction,
			annotateLinks: this.ETLConfigForm.value.annotateLinks,
		};

		if (this.ETLConfigForm.value.mode) {
			if (this.ETLConfigForm.value.mode == 'Accurate Mode') {
			} else if (this.ETLConfigForm.value.mode == 'Premium Mode') {
				payload.LlamaParams.premiumMode = true;
				payload.LlamaParams.useVendorMultimodalModel = false;
			} else if (this.ETLConfigForm.value.mode == '3rd Party multi-modal model') {
				payload.LlamaParams.useVendorMultimodalModel = true;
				payload.LlamaParams.premiumMode = false;
			}
		}

		if (!payload.LlamaParams.parsingInstruction || payload.LlamaParams.parsingInstruction == '') {
			delete payload.LlamaParams.parsingInstruction;
		}
		if (!payload.LlamaParams.targetPages || payload.LlamaParams.targetPages == '') {
			delete payload.LlamaParams.targetPages;
		}

		if (!payload.LlamaParams.boundingBox || payload.LlamaParams.boundingBox == '') {
			delete payload.LlamaParams.boundingBox;
		}
		if (!payload.LlamaParams.pageSeparator || payload.LlamaParams.pageSeparator == '') {
			delete payload.LlamaParams.pageSeparator;
		}
		if (!payload.LlamaParams.pagePrefix || payload.LlamaParams.pagePrefix == '') {
			delete payload.LlamaParams.pagePrefix;
		}
		if (!payload.LlamaParams.pageSuffix || payload.LlamaParams.pageSuffix == '') {
			delete payload.LlamaParams.pageSuffix;
		}

		this.ETLConfigForm.controls['ClientId'].enable();

		this.masterSettingService.createUpdateETLCredential(this.ETLConfigForm.value).subscribe((res: any) => {
			if (res.success) {
				if (this.editETL) {
					this.toastr.success(
						this.appService.getTranslation('Pages.MasterSettings.Toaster.updateETLConfiguration'),
						this.appService.getTranslation('Utils.success')
					);
				} else {
					this.toastr.success(
						this.appService.getTranslation('Pages.MasterSettings.Toaster.addETLConfigurationcredentail'),
						this.appService.getTranslation('Utils.success')
					);
				}
				this.getETLConfigration();
				this.cancelETlConfigurationPopUpModel();
			}
		});
	}

	getTeamsCredential() {
		this.masterSettingService.getTeamsCredential().subscribe((res: any) => {
			if (res.success) {
				this.teamsCredentialList = [res.data];
				// console.log('teamsCredentialList', this.teamsCredentialList);
			}
		});
	}

	getETLConfigration() {
		this.masterSettingService.getAllETLChoice(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.ETLConfigration = res.data;
				// console.log(res.data);
			}
		});
	}

	editTeamsAPICredential(data) {
		this.temasCredentialForm.patchValue(data);
		$('#addTeamsCredentialModel').modal('show');
	}

	editETlConfigurationCredential(data) {
		this.ETLConfigForm.patchValue(data);
		this.clientListForForm = [];
		this.clientListForForm.push({ id: data.id, clientIdWithName: data.client_id + ' - ' + data.name });
		// this.ETLConfigForm.controls['ClientId'].enable();
		this.ETLConfigForm.controls['ClientId'].setValue(data.id);
		this.ETLConfigForm.controls['ClientId'].disable();
		$('#addETLConfigModel').modal('show');
	}
	cancelETlConfigurationPopUpModel() {
		this.ETLConfigForm.reset();
		$('#addETLConfigModel').modal('hide');
	}
	cancelTeamsCredentialPopUpModel() {
		$('#addTeamsCredentialModel').modal('hide');
	}

	updateTeamAPICredential() {
		if (this.temasCredentialForm.invalid) {
			this.markAsTouched(this.temasCredentialForm);
			return;
		}
		this.masterSettingService.updateTeamsCredential(this.temasCredentialForm.value).subscribe((res: any) => {
			if (res.success) {
				this.toastr.success(
					this.appService.getTranslation('Pages.MasterSettings.Toaster.updateTeamsCredential'),
					this.appService.getTranslation('Utils.success')
				);
				this.getTeamsCredential();
				this.cancelTeamsCredentialPopUpModel();
			}
		});
	}

	// ////////////////////////////////////////Login App Bradin////////////////////////////

	createLoginAppBradingForm() {
		// Retrieve branding type from localStorage
		const type = this.masterSettingService?.type;

		this.loginAppBrandingForm = this.formBuilder.group({
			id: null,

			// Drip Fields
			dripWeb_Login_LogoPath: [null],
			dripWeb_Login_LogoFileName: [null],
			dripWeb_LogoPath: [null],
			dripWeb_LogoFileName: [null],
			dripWeb_About_LogoPath: [null],
			dripWeb_About_LogoFileName: [null],
			dripWeb_About_Text: [null],
			drip_accent_color: ['#6513e1'],
			dripPWA_LoginImagePath: [null],
			dripPWA_LoginImageFileName: [null],
			dripPWA_LoginLogoPath: [null],
			dripPWA_LoginLogoFileName: [null],
			dripPwa_LogoPath: [null],
			dripPwa_LogoFileName: [null],
			dripPWA_Login_Text: [null],

			// Diwo Fields
			diwoWeb_Login_LogoPath: [null],
			diwoWeb_Login_LogoFileName: [null],
			diwo_certificate_LogoPath: [null],
			diwo_certificate_LogoFileName: [null],
			diwoWeb_LogoPath: [null],
			diwoWeb_LogoFileName: [null],
			diwoWeb_About_LogoPath: [null],
			diwoWeb_About_LogoFileName: [null],
			diwoWeb_About_Text: [null],
			diwo_accent_color: ['#6513e1'],
			diwoPWA_LoginImagePath: [null],
			diwoPWA_LoginImageFileName: [null],
			diwoPWA_LoginLogoPath: [null],
			diwoPWA_LoginLogoFileName: [null],
			diwoPwa_LogoPath: [null],
			diwoPwa_LogoFileName: [null],
			diwoPWA_Login_Text: [null],
		});

		// Apply validation based on branding type
		this.updateValidation(type);
	}

	get f8() {
		return this.loginAppBrandingForm.controls;
	}

	// Function to update validation dynamically
	updateValidation(brandingType: string) {
		const dripFields = [
			'dripWeb_Login_LogoPath',
			'dripWeb_Login_LogoFileName',
			'dripWeb_LogoPath',
			'dripWeb_LogoFileName',
			'dripWeb_About_LogoPath',
			'dripWeb_About_LogoFileName',
			'dripWeb_About_Text',
			'dripPWA_LoginImagePath',
			'dripPWA_LoginImageFileName',
			'dripPWA_LoginLogoPath',
			'dripPWA_LoginLogoFileName',
			'dripPwa_LogoPath',
			'dripPwa_LogoFileName',
			'dripPWA_Login_Text',
		];

		const diwoFields = [
			'diwoWeb_Login_LogoPath',
			'diwoWeb_Login_LogoFileName',
			'diwo_certificate_LogoPath',
			'diwo_certificate_LogoFileName',
			'diwoWeb_LogoPath',
			'diwoWeb_LogoFileName',
			'diwoWeb_About_LogoPath',
			'diwoWeb_About_LogoFileName',
			'diwoWeb_About_Text',
			'diwoPWA_LoginImagePath',
			'diwoPWA_LoginImageFileName',
			'diwoPWA_LoginLogoPath',
			'diwoPWA_LoginLogoFileName',
			'diwoPwa_LogoPath',
			'diwoPwa_LogoFileName',
			'diwoPWA_Login_Text',
		];

		const form = this.loginAppBrandingForm;
		const allFields = [...dripFields, ...diwoFields];
		const activeFields = brandingType === 'drip' ? dripFields : diwoFields;

		// Reset all validations first
		for (let i = 0; i < allFields.length; i++) {
			const field = allFields[i];
			form.get(field)?.clearValidators();
			form.get(field)?.updateValueAndValidity();
		}

		// Apply required validation only to the selected branding type
		for (let i = 0; i < activeFields.length; i++) {
			const field = activeFields[i];
			form.get(field)?.setValidators([Validators.required]);
			form.get(field)?.updateValueAndValidity();
		}
	}

	openLoginAppBrandingPopUp() {
		$('#loginAppBranding').modal('show');
	}
	cancelLoginPopUpModel() {
		$('#loginAppBranding').modal('hide');
	}

	uploadThemeImage(event, path, name) {
		this.getImgResolution(event, path).then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.masterSettingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {

							console.log('res from uploadThemeImage', res.data);

							this.loginAppBrandingForm.controls[name].setValue(res.data.image[0].filename);
							this.loginAppBrandingForm.controls[path].setValue(
								'uploads/system_branding/' + res.data.image[0].filename
							);
						}
					});
				} else {
					$('#mediaWeb').val('');
					this.toastr.warning(
						this.appService.getTranslation('Utils.fileNotSupport'),
						this.appService.getTranslation('Utils.warning')
					);
				}
			} else {
				this.toastr.warning(
					this.appService.getTranslation('Pages.MasterSettings.Toaster.invalidimagesize'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}

	uploadDiwoCertificateImage(event, path, name){
		if (event.target.files[0].type.includes('image')) {
			let assetUpload = event.target.files[0];
			const uploadData = new FormData();
			uploadData.append('image', assetUpload);
			this.masterSettingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {

					console.log('res from uploadDiwoCertificateImage', res.data);

					this.loginAppBrandingForm.controls[name].setValue(res.data.image[0].filename);
					this.loginAppBrandingForm.controls[path].setValue(
						'uploads/system_branding/' + res.data.image[0].filename
					);
				}
			});
		} else {
			$('#mediaWeb').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	updateLoginAppBrading() {
		if (this.loginAppBrandingForm.invalid) {
			this.markAsTouched(this.loginAppBrandingForm);
			return;
		}

		this.masterSettingService.uploadLoginAppBrading(this.loginAppBrandingForm.value).subscribe((res: any) => {
			if (res.success) {
				this.cancelLoginPopUpModel();
				this.getLoginAppBrandingData();
			}
		});
	}

	getLoginAppBrandingData() {
		this.masterSettingService.getLoginAppBradingData().subscribe((res: any) => {
			if (res.success) {
				this.loginAllBranding = [];
				if (res.data) {
					this.loginAllBranding.push(res.data);
				}
			}
		});
	}

	deleteUploadedImage(path, name) {
		this.loginAppBrandingForm.controls[path].setValue(null);
		this.loginAppBrandingForm.controls[name].setValue(null);
	}

	editLoginAppBrading(item) {
		if (item) {
			this.loginAppBrandingForm.patchValue(item);
			this.openLoginAppBrandingPopUp();
			this.checkCharacterLimitForPWALoginText();
			this.checkCharacterLimitForWebAboutText();
		}
	}

	getImgResolution(evt: any, type) {
		let p = new Promise(function (resolve, reject) {
			let image: any = evt.target.files[0];
			let fr = new FileReader();
			fr.onload = () => {
				var img = new Image();
				img.onload = () => {
					let imgMode = false;
					// console.log('-type-', type);
					// console.log('-img.height-', img.height);

					if (type == 'dripPWA_LoginImagePath' || type == 'diwoPWA_LoginImagePath') {
						imgMode = true;
					}

					if (type == 'dripWeb_Login_LogoPath' || type == 'diwoWeb_Login_LogoPath') {
						if (img.height == 114) {
							imgMode = true;
						}
					}

					if (type == 'dripWeb_LogoPath' || type == 'diwoWeb_LogoPath') {
						if (img.height == 74) {
							imgMode = true;
						}
					}

					if (type == 'dripWeb_About_LogoPath' || type == 'diwoWeb_About_LogoPath') {
						if (img.height == 40) {
							imgMode = true;
						}
					}

					if (type == 'dripPWA_LoginLogoPath' || type == 'diwoPWA_LoginLogoPath') {
						if (img.height == 112) {
							imgMode = true;
						}
					}

					if (type == 'dripPwa_LogoPath' || type == 'diwoPwa_LogoPath') {
						if (img.height == 45) {
							imgMode = true;
						}
					}

					resolve(imgMode);
				};
				img.src = fr.result + '';
			};
			fr.readAsDataURL(image);
		});
		return p;
	}

	checkCharacterLimitForPWALoginText() {
		let PWA_Login_Text = '';
		if (this.masterSettingService.type == 'drip') {
			PWA_Login_Text = this.loginAppBrandingForm.controls['dripPWA_Login_Text'].value;
		} else if (this.masterSettingService.type == 'diwo') {
			PWA_Login_Text = this.loginAppBrandingForm.controls['diwoPWA_Login_Text'].value;
		}

		this.characterRemainsForPWALoginText = PWA_Login_Text
			? this.maxLengthForPWALoginText - PWA_Login_Text.length
			: this.maxLengthForPWALoginText;
	}

	checkCharacterLimitForWebAboutText() {
		let Web_About_Text = '';
		if (this.masterSettingService.type == 'drip') {
			Web_About_Text = this.loginAppBrandingForm.controls['dripWeb_About_Text'].value;
		} else if (this.masterSettingService.type == 'diwo') {
			Web_About_Text = this.loginAppBrandingForm.controls['diwoWeb_About_Text'].value;
		}
		this.characterRemainsForWebAboutText = Web_About_Text
			? this.maxLengthForWebAboutText - Web_About_Text.length
			: this.maxLengthForWebAboutText;
	}
}
