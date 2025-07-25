import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { ManageAppBrandingService } from '../manage-app-branding.service';
import { AppService } from 'src/app/app.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
declare var $: any;

@Component({
	selector: 'app-add-edit-app-branding',
	templateUrl: './add-edit-app-branding.component.html',
	styleUrls: ['./add-edit-app-branding.component.scss'],
})
export class AddEditAppBrandingComponent implements OnInit {
	assetBasePath = environment.imageHost;
	assetBasePath2 = environment.imagePath;
	appBrandingForm: FormGroup;
	clientList = [];
	clientListForForm = [];
	userClient: any;
	roleId: any;
	appBranding: any;
	appbrandingDataList: any;
	writePermission: any;
	characterRemains: any;
	characterRemainsForDescription: any;
	characterRemainsForTitle: any;
	pageDetails: any;
	color: '#6513e1';
	disableEmailCompulsory = false;
	allSpotRegistarionData = [
		{
			type: 'FirstName',
			labelText: 'First Name',
			linkTo: 'First Name',
			isRequired: true,
			isDisabled: true,
			sectedJobRoleDetails: [],
			selectedBranchAccount: [],
		},
		{
			type: 'LastName',
			labelText: 'Last Name',
			linkTo: 'Last Name',
			isRequired: true,
			isDisabled: true,
			sectedJobRoleDetails: [],
			selectedBranchAccount: [],
		},
		{
			type: 'Branch',
			labelText: 'Branch',
			linkTo: 'Branch',
			isRequired: true,
			isDisabled: true,
			sectedJobRoleDetails: [],
			selectedBranchAccount: [],
		},
	];
	AllSpotRegTypes = [
		{
			id: 1,
			label: 'Email',
			value: 'email',
		},
		{
			id: 2,
			label: 'Phone',
			value: 'phone',
		},

		{
			id: 3,
			label: 'State',
			value: 'state',
		},
		{
			id: 4,
			label: 'City',
			value: 'city',
		},
		{
			id: 5,
			label: 'Zip Code',
			value: 'zipCode',
		},

		{
			id: 6,
			label: 'Job Role',
			value: 'jobrole',
		},
		{
			id: 7,
			label: 'Tags',
			value: 'tags',
		},
	];

	clientListForSpotRegistration: any[] = [];
	// allTags: any = [];
	selectedLinkToType: any;
	selectedClientId: any;
	selectedAccountType: any;
	parentClientJobRoleList: any = [];

	GotoHomeButtonList = [
		{ value: 'Show buttons', label: 'Show buttons' },
		{ value: 'Do not show button', label: 'Do not show button' },
	];
	allWhatsAppPost: any;
	custkeywords = "Stop, Unsubscribe, Opt Out, Discontinue, No Message, Don't Send, Not Interested, Stop Messages";
	customReportList = [];
	type = 'drip';
	isZoomSignUp = null;
	isTeamSignUp = null;
	zoomUserTokenId: any;
	teamUserTokenId: any;

	allMediaProfile = [
		{
			id: 1,
			label: 'Facebook',
			value: 'facebook',
		},
		{
			id: 2,
			label: 'YouTube',
			value: 'youtube',
		},

		{
			id: 3,
			label: 'Instagram',
			value: 'instagram',
		},
		{
			id: 4,
			label: 'WhatsApp',
			value: 'whatsapp',
		},
		{
			id: 5,
			label: 'TikTok',
			value: 'tiktok',
		},
		{
			id: 6,
			label: 'Reddit',
			value: 'reddit',
		},
		{
			id: 7,
			label: 'LinkedIn',
			value: 'linkedin',
		},
		{
			id: 8,
			label: 'Medium',
			value: 'medium',
		},
		{
			id: 9,
			label: 'telegram',
			value: 'telegram',
		},
		{
			id: 10,
			label: 'X',
			value: 'x',
		},
		{
			id: 11,
			label: 'Thread',
			value: 'thread',
		},
	];
	isDripAccess: boolean = false;
	allSocialMediaData = [];
	isValidWhatsAppOTPTemp: any;
	showOTPTemplateError: boolean = false;
	whatsAppOTPTempStatus: any;
	CarouselData = [];

	iconObject = {
		add_icon_30: null,
		info_icon_25: null,
		check: null,
	};

	constructor(
		private spinnerService: NgxSpinnerService,
		private confirmationService: ConfirmationService,
		private appBrandingService: ManageAppBrandingService,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.getAppBranding();
		this.type = this.appBrandingService.type;
		this.pageDetails = JSON.parse(localStorage.getItem('generalSettingsPageNo')) || null;

		this.createClientForm();
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.getRollPermission();
		this.appBranding = this.route.params['_value'];
		if (this.appBranding && this.appBranding.appBrandingId) {
			this.getAppBrandingDataById();
			this.getClientList();
		} else {
			this.getClientListOfWithoutAppBranding();
			setTimeout(() => {
				this.addOneMoreReport();
				this.addOneSocialMedia();
			}, 100);
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getZoomSignInDetails(clientId) {
		this.isZoomSignUp = false;
		this.appBrandingService.getZoomSignInDetails(clientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data != null && res.data != undefined) {
					this.isZoomSignUp = true;
					this.zoomUserTokenId = res.data.id;
				} else if (res?.zoomAppNotFound == true) {
					this.isZoomSignUp = null;
				}
				// console.log('-----this.zoomUserTokenId----', this.zoomUserTokenId);
				// console.log('-----this.isZoomSignUp----', this.isZoomSignUp);
			}
		});
	}
	getTeamSignInDetails(clientId) {
		this.isTeamSignUp = false;
		this.appBrandingService.getTeamSignInDetails(clientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data != null && res.data != undefined) {
					this.isTeamSignUp = true;
					this.teamUserTokenId = res.data.id;
				} else if (res?.teamAppNotFound == true) {
					this.isTeamSignUp = null;
				}
				// console.log('-----this.TeamUserTokenId----', this.teamUserTokenId);
				// console.log('-----this.isTeamSignUp----', this.isTeamSignUp);
			}
		});
	}
	createClientForm() {
		this.appBrandingForm = this.formBuilder.group({
			id: null,

			clientId: [null, Validators.required],

			theme_image_original_name: [null],
			theme_image_name: [null],
			theme_image_path: [null],

			about_text: [null, Validators.required],

			learner_app_icon_original_name: [null],
			learner_app_icon_name: [null],
			learner_app_icon_path: [null],

			admin_side_header_logo_original_name: [null],
			admin_side_header_logo_name: [null],
			admin_side_header_logo_path: [null],

			//Email
			EmailSenderName: [null],
			EmailSignatureText: [null],
			EmailSenderId: [null, Validators.required],
			EmailTemplateId: [null],
			welcomeEmail: [false],
			welcomeSubject: [null],
			welcomeBody: [null],
			welcomeButton: [null],

			//Mobile Compulsory
			compMobNo: [false],
			compEmail: [true],
			ContactEmailForLearner: [null],
			ContactPhoneForLearner: [null],
			signature_image_original_name: [null],
			signature_image_name: [null],
			signature_image_path: [null],
			accent_color: ['#6513e1'],
			hideBackBtnToggle: [false],
			defaultbackval: ['Show buttons'],

			sendoptinconfm: [false],
			optinconfmdrip: [null],
			custkeywords: [this.custkeywords, Validators.required],
			sendoptoutconfm: [false],
			optoutconfmdrip: [null],
			addLearnerForDrip: [false],
			isWhatsAppOTP: [false],

			OnlyEmailTemplateId: [null],

			//WhastApp Default reply
			setDefaultReply: [false],
			dripIdForDefaultReply: [null],
		});
	}

	get f() {
		return this.appBrandingForm.controls;
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

	getAppBrandingDataById() {
		this.appBrandingService
			.getAppBrandingDataById(this.userClient.id, this.appBranding.appBrandingId)
			.subscribe((res: any) => {
				if (res.success) {
					if (res.data?.Clients?.length > 0 && res.data?.Clients[0]?.ClientTeamSetups?.length > 0) {
						this.disableEmailCompulsory = true;
						// console.log('disableEmailCompulsory', this.disableEmailCompulsory);
					}
					this.appbrandingDataList = res.data;
					this.appBrandingForm.patchValue(res.data);
					if ((res.data && res.data.custkeywords == null) || res.data.custkeywords == '') {
						this.appBrandingForm.controls['custkeywords'].setValue(this.custkeywords);
					}
					this.color = this.appBrandingForm.value.accent_color;
					this.appBrandingForm.controls['clientId'].setValue(
						res.data && res.data.Clients ? res.data.Clients[0].id : null
					);
					this.appBrandingForm.controls['clientId'].setValue(res.data.Clients[0].id);

					this.appBrandingForm.controls['clientId'].disable();
					if (
						this.writePermission &&
						this.writePermission.ispermission == true &&
						(this.writePermission.menuPermission.MenuId == 15 || this.writePermission.menuPermission.MenuId == '15') &&
						(this.writePermission.menuPermission.RoleId == 6 || this.writePermission.menuPermission.RoleId == '6')
					) {
						this.appBrandingForm.controls['EmailTemplateId'].disable();
					}
					if (res.data.theme_image_path) {
						this.appBrandingForm.controls['theme_image_path'].setValue(
							this.assetBasePath + this.assetBasePath2 + res.data.theme_image_path
						);
					}
					if (res.data.learner_app_icon_path) {
						this.appBrandingForm.controls['learner_app_icon_path'].setValue(
							this.assetBasePath + this.assetBasePath2 + res.data.learner_app_icon_path
						);
					}
					if (res.data.admin_side_header_logo_path) {
						this.appBrandingForm.controls['admin_side_header_logo_path'].setValue(
							this.assetBasePath + this.assetBasePath2 + res.data.admin_side_header_logo_path
						);
					}
					if (res.data.signature_image_path) {
						this.appBrandingForm.controls['signature_image_path'].setValue(
							this.assetBasePath + this.assetBasePath2 + res.data.signature_image_path
						);
					}
					this.onClientSelect(this.appBrandingForm.controls['clientId'].value);
					if (res.data.about_text !== null && res.data.about_text !== '' && res.data.about_text !== undefined) {
						this.checkCharacterLimit(res.data.about_text);
					}
					if (
						res.data.spotRegistration &&
						res.data.spotRegistration !== 'null' &&
						res.data.spotRegistration !== '' &&
						res.data.spotRegistration !== undefined
					) {
						this.allSpotRegistarionData = [];
						this.allSpotRegistarionData = JSON.parse(res.data.spotRegistration);
					}

					if (
						res.data.allSocialMediaData &&
						res.data.allSocialMediaData !== 'null' &&
						res.data.allSocialMediaData !== '' &&
						res.data.allSocialMediaData !== undefined
					) {
						this.allSocialMediaData = [];
						this.allSocialMediaData = JSON.parse(res.data.allSocialMediaData);
					} else {
						this.addOneSocialMedia();
					}

					if (res.data.CarouselData) {
						this.CarouselData = JSON.parse(res.data.CarouselData);
					}

					this.selectedAccountType = res.data && res.data.Clients ? res.data.Clients[0].category : null;

					if (
						res.data &&
						res.data.Clients &&
						res.data.Clients[0].ClientCustomReports &&
						res.data.Clients[0].ClientCustomReports.length > 0
					) {
						this.customReportList = [];
						for (let item of res.data.Clients[0].ClientCustomReports) {
							this.customReportList.push(item);
						}
					} else {
						this.addOneMoreReport();
					}

					if (res.data && res.data.Clients && res.data.Clients[0].DripAccess && res.data.Clients[0].DiwoAccess) {
						this.isDripAccess = true;
					} else {
						this.isDripAccess = false;
					}
				}
			});
	}

	getAppbranding() {
		let userClient = JSON.parse(localStorage.getItem('client'));
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
			}
		});
	}

	getAllWhatsAppPost(clientId: any) {
		this.appBrandingService.getAllWhatsAppPostForOptIn(clientId).subscribe((res: any) => {
			if (res.success) {
				this.allWhatsAppPost = [];
				this.allWhatsAppPost = res.data;
			}
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [15],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	checkToggleMobileEmail(event, type) {
		if (type === 'email' && this.disableEmailCompulsory) {
			this.appBrandingForm.controls['compEmail'].setValue(true);
		} else {
			let appBrandingData = this.appBrandingForm.value;
			if (appBrandingData.compMobNo == false && appBrandingData.compEmail == false && type == 'mobile') {
				this.appBrandingForm.controls['compEmail'].setValue(true);
			} else if (appBrandingData.compMobNo == false && appBrandingData.compEmail == false && type == 'email') {
				this.appBrandingForm.controls['compMobNo'].setValue(true);
			}

			if (appBrandingData.compEmail == false) {
				this.appBrandingForm.controls['welcomeEmail'].setValue(false);
			}
		}
	}

	checkWelcomeEmailToggle(event) {
		let appBrandingData = this.appBrandingForm.value;
		if (appBrandingData.compEmail == false) {
			this.appBrandingForm.controls['welcomeEmail'].setValue(false);
		}
	}

	save() {
		if (this.appBrandingForm.invalid) {
			this.markAsTouched(this.appBrandingForm);
			return;
		}

		if (!this.validateCarousel()) {
			//Add Error Message
			this.toastr.warning(
				this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.pleaseFillAllRequiredDetails'),
				this.appService.getTranslation('Utils.warning')
			);
			return;
		}
		let appBrandingData = this.appBrandingForm.value;
		appBrandingData.spotRegistration = JSON.stringify(this.allSpotRegistarionData);
		appBrandingData.clientCustomReports = this.customReportList;
		appBrandingData.allSocialMediaData = JSON.stringify(this.allSocialMediaData);
		appBrandingData.CarouselData = JSON.stringify(this.CarouselData);

		if (!appBrandingData.compEmail && !appBrandingData.compMobNo) {
			this.toastr.error(
				this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.emailOrMobileRequred'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}

		if (
			this.appBrandingForm.controls['setDefaultReply'].value == true &&
			(this.appBrandingForm.controls['dripIdForDefaultReply'].value == null ||
				this.appBrandingForm.controls['dripIdForDefaultReply'].value == '')
		) {
			this.appBrandingForm.controls['dripIdForDefaultReply'].setErrors({ required: true });
			this.appBrandingForm.controls['dripIdForDefaultReply'].markAsTouched();
			return;
		}
		// if (this.allSocialMediaData && this.allSocialMediaData.length > 0) {
		// 	let flag = true;
		// 	for (let item of this.allSocialMediaData) {
		// 		if (item.mediaName == '' || item.mediaName == null) {
		// 			flag = false;
		// 			item.ismediaNameError = true;
		// 		}
		// 		if (item.mediaLink == '' || item.mediaLink == null) {
		// 			flag = false;
		// 			item.ismediaLinkError = true;
		// 		}

		// 		if (item.isDuplicatePlateForm || item.isMediaLinkValidError) {
		// 			flag = false;
		// 		}
		// 	}

		// 	if (!flag) {
		// 		return;
		// 	}
		// }

		// console.log('--alll-', appBrandingData);
		// return;
		this.spinnerService.show();
		// if (this.appBrandingForm.value.theme_image_name[0].filename != null ||
		//     this.appBrandingForm.value.theme_image_name[0].filename != undefined) {
		//     appBrandingData.theme_image_name = this.appBrandingForm.value.theme_image_name[0].filename;
		// } else {
		//     appBrandingData.theme_image_name = this.appbrandingDataList.theme_image_name;
		// }

		// if (this.appBrandingForm.value.learner_app_icon_name[0].filename != null ||
		//     this.appBrandingForm.value.learner_app_icon_name[0].filename != undefined) {
		//     appBrandingData.learner_app_icon_name = this.appBrandingForm.value.learner_app_icon_name[0].filename;

		// } else {
		//     appBrandingData.learner_app_icon_name = this.appbrandingDataList.learner_app_icon_name;
		// }

		// if (this.appBrandingForm.value.admin_side_header_logo_name[0].filename != null ||
		//     this.appBrandingForm.value.admin_side_header_logo_name[0].filename != undefined) {
		//     appBrandingData.admin_side_header_logo_name = this.appBrandingForm.value.admin_side_header_logo_name[0].filename;
		// } else {
		//     appBrandingData.admin_side_header_logo_name = this.appbrandingDataList.admin_side_header_logo_name;
		// }

		if (this.appBrandingForm.value.id == null) {
			// Create New App Branding
			this.appBrandingService.createAppBranding(appBrandingData.clientId, appBrandingData).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.appBrandingForm.reset();
					this.router.navigate(['/general-settings']);
					$('#addAppBrandingModal').modal('hide');
					this.toastr.success(
						this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.gsettingscreated'),
						this.appService.getTranslation('Utils.success')
					);
					this.spinnerService.hide();
					// this.getAppbranding();
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					this.spinnerService.hide();
					this.router.navigate(['/general-settings']);
				}
			});
		} else {
			// Update App Branding
			appBrandingData.clientId = this.selectedClientId;
			this.savePagination();
			this.appBrandingService
				.updateAppBranding(this.appBrandingForm.value.id, appBrandingData, this.userClient.id)
				.subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.appBrandingForm.reset();
						this.router.navigate(['/general-settings']);
						$('#addAppBrandingModal').modal('hide');
						this.toastr.success(
							this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.gsettingsupdated'),
							this.appService.getTranslation('Utils.success')
						);
						this.spinnerService.hide();
						// this.getAppbranding();
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
						this.spinnerService.hide();
						setTimeout(() => {
							this.router.navigate(['/general-settings']);
						}, 100);
					}
				});
			this.spinnerService.hide();
		}
	}

	getClientListOfWithoutAppBranding() {
		this.appBrandingService.getClientListOfWithoutAppBranding(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	getClientList() {
		this.appBrandingService.getAllClientListForDropdowns(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/general-settings']);
			}, 100);
		} else {
			this.router.navigate(['/general-settings']);
		}
	}

	checkCharacterLimit(val) {
		var max = 1150;
		var len = val.length;
		this.characterRemains = max - len;
	}

	validateCharacterLimitForTitle(val: string, index: number) {
		const max = 86;
		this.CarouselData[index].characterRemainsForTitle = max - (val?.length || 0);
	}

	validateCharacterLimitForDescription(val: string, index: number) {
		const max = 180;
		this.CarouselData[index].characterRemainsForDescription = max - (val?.length || 0);
	}

	uploadThemeImage(event) {
		if (event.target.files[0].type.includes('image')) {
			this.appBrandingForm.controls['theme_image_original_name'].patchValue(event.target.files[0].name);
			let assetUpload = event.target.files[0];
			const uploadData = new FormData();
			uploadData.append('image', assetUpload);
			this.appBrandingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.appBrandingForm.controls['theme_image_name'].setValue(res.data.image[0].filename);
					this.appBrandingForm.controls['theme_image_path'].setValue(
						this.assetBasePath + this.assetBasePath2 + 'uploads/system_branding/' + res.data.image[0].filename
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

	uploadSignatureImage(event) {
		if (event.target.files[0].type.includes('image')) {
			this.appBrandingForm.controls['signature_image_original_name'].patchValue(event.target.files[0].name);
			let assetUpload = event.target.files[0];
			const uploadData = new FormData();
			uploadData.append('image', assetUpload);
			this.appBrandingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.appBrandingForm.controls['signature_image_name'].setValue(res.data.image[0].filename);
					this.appBrandingForm.controls['signature_image_path'].setValue(
						this.assetBasePath + this.assetBasePath2 + 'uploads/system_branding/' + res.data.image[0].filename
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

	deleteSignatureImage() {
		$('#mediaWeb').val('');
		this.appBrandingForm.patchValue({ signature_image_original_name: null });
		this.appBrandingForm.patchValue({ signature_image_name: null });
		this.appBrandingForm.patchValue({ signature_image_path: null });
	}

	deleteThemeImage() {
		$('#mediaWeb').val('');
		this.appBrandingForm.patchValue({ theme_image_original_name: null });
		this.appBrandingForm.patchValue({ theme_image_name: null });
		this.appBrandingForm.patchValue({ theme_image_path: null });
	}

	uploadLearnerAppIcon(event) {
		this.getImgResolution(event, 'learnerAppIcon').then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					this.appBrandingForm.controls['learner_app_icon_original_name'].patchValue(event.target.files[0].name);
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.appBrandingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							// this.appBrandingForm.controls['learner_app_icon_name'].patchValue(res.data.image[0].filename);
							this.appBrandingForm.controls['learner_app_icon_name'].patchValue(res.data.image[0].filename);
							this.appBrandingForm.controls['learner_app_icon_path'].patchValue(
								this.assetBasePath + this.assetBasePath2 + 'uploads/system_branding/' + res.data.image[0].filename
							);
						}
					});
				}
			} else {
				this.toastr.warning(
					this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.learnerAppIconthumbanilwarn'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}

	deleteLearnerAppIcon() {
		$('#mediaWeb').val('');
		this.appBrandingForm.patchValue({
			learner_app_icon_original_name: null,
		});
		this.appBrandingForm.patchValue({ learner_app_icon_name: null });
		this.appBrandingForm.patchValue({ learner_app_icon_path: null });
	}

	uploadAdminAppHeaderLogo(event) {
		this.getImgResolution(event, 'AdminAppHeaderLogo').then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					this.appBrandingForm.controls['admin_side_header_logo_original_name'].patchValue(event.target.files[0].name);
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.appBrandingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							this.appBrandingForm.controls['admin_side_header_logo_name'].patchValue(res.data.image[0].filename);
							this.appBrandingForm.controls['admin_side_header_logo_path'].patchValue(
								this.assetBasePath + this.assetBasePath2 + 'uploads/system_branding/' + res.data.image[0].filename
							);
						}
					});
				}
			} else {
				this.toastr.warning(
					this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.adminAppHeaderthumbanilwarn'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}

	deleteAdminAppHeaderLogo() {
		$('#mediaWeb').val('');
		this.appBrandingForm.patchValue({
			admin_side_header_logo_original_name: null,
		});
		this.appBrandingForm.patchValue({ admin_side_header_logo_name: null });
		this.appBrandingForm.patchValue({ admin_side_header_logo_path: null });
	}

	getImgResolution(evt: any, type) {
		let p = new Promise(function (resolve, reject) {
			let image: any = evt.target.files[0];
			let fr = new FileReader();
			fr.onload = () => {
				var img = new Image();
				img.onload = () => {
					let imgMode = false;
					if (type == 'learnerAppIcon') {
						if (img.height == 45) {
							imgMode = true;
						}
					}
					if (type == 'AdminAppHeaderLogo') {
						if (img.height == 74) {
							imgMode = true;
						}
					}

					if (type == 'check for 14:5') {
						if (img.width / img.height > 2.79 && img.width / img.height < 2.81) {
							imgMode = true; // 14:5 ratio (14 / 5 = 2.8)
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

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('generalSettingsPageNo', JSON.stringify(payload));
	}

	onEventLog(type, event) {
		this.appBrandingForm.controls['accent_color'].setValue(event && event.color ? event.color : event);
		this.appBrandingForm.value.accent_color = event && event.color ? event.color : event;
	}

	//Spot Registration
	addOneSpotRegistration() {
		let payload = {
			type: null,
			labelText: null,
			linkTo: null,
			isRequired: false,
			isDisabled: false,
			selectedTags: [],
			sectedJobRole: [],
			sectedJobRoleDetails: [],
			selectedBranchAccount: [],
		};
		this.allSpotRegistarionData.push(payload);
	}

	removeSpotRegistration(index) {
		this.allSpotRegistarionData.splice(index, 1);
	}

	onClientSelect(Client) {
		this.selectedAccountType = Client && Client.category ? Client.category : null;
		if (Client && Client.id) {
			this.selectedClientId = Client.id;
		} else {
			this.selectedClientId = Client;
		}
		this.getAllBranchName();
		this.getJobRoleOfParentClient(this.selectedClientId);
		this.getAllWhatsAppPost(this.selectedClientId);
		this.isZoomSignUp = null;
		this.isTeamSignUp = null;
		if (this.type === 'drip') {
			this.getZoomSignInDetails(this.selectedClientId);
			this.getTeamSignInDetails(this.selectedClientId);
		}

		if (Client && Client.DripAccess && Client.DiwoAccess) {
			this.isDripAccess = true;
		} else {
			this.isDripAccess = false;
		}
		//whatsapp otp
		this.checkClientWhatsAppSetupForOTP(this.selectedClientId);
	}

	onChangeSpotRegType(index, data: any) {
		let flag = false;
		for (let item of this.allSpotRegistarionData) {
			if (data.label !== 'Tags') {
				if (item.type == data.label) {
					flag = true;
					this.allSpotRegistarionData.splice(index, 1);
					let text = this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.alreadyadded');
					this.toastr.error(data.label + ' ' + text, this.appService.getTranslation('Utils.error'));
					break;
				}
			}
		}

		if (!flag) {
			this.allSpotRegistarionData[index].linkTo = data.value;
			this.allSpotRegistarionData[index].type = data.label;
		}
	}

	getAllBranchName() {
		this.appBrandingService
			.getAllBranchNameUnderClientForSporRegistarion(this.selectedClientId)
			.subscribe((res: any) => {
				if (res.success) {
					this.clientListForSpotRegistration = [];
					if (res.data.length > 0) {
						this.clientListForSpotRegistration.push({ name: 'Select All', id: 0 });
						this.clientListForSpotRegistration = [...this.clientListForSpotRegistration, ...res.data];
						let count = 8;
						if (res.data && res.data[0].customFields && res.data[0].customFields.length > 0) {
							for (let item of res.data[0].customFields) {
								let payload = {
									id: count,
									label: item.label,
									value: item.fieldIndex,
								};
								count++;
								this.AllSpotRegTypes.push(payload);
							}
						} else {
							if (
								res.data &&
								res.data[0].Parent_client &&
								res.data[0].Parent_client.customFields &&
								res.data[0].Parent_client.customFields.length > 0
							) {
								for (let item of res.data[0].Parent_client.customFields) {
									let payload = {
										id: count,
										label: item.label,
										value: item.fieldIndex,
									};
									count++;
									this.AllSpotRegTypes.push(payload);
									this.AllSpotRegTypes = [...this.AllSpotRegTypes];
								}
							}
						}
					}
				}
			});
	}

	getJobRoleOfParentClient(clientId) {
		let payload = {
			ClientId: [clientId],
		};
		this.appBrandingService.getJobRoleByClientId(payload).subscribe((res: any) => {
			if (res.success) {
				this.parentClientJobRoleList = [];
				this.parentClientJobRoleList = res.data;
			}
		});
	}

	onChangeJobRole(data: any, index) {
		this.allSpotRegistarionData[index].sectedJobRoleDetails = data;
	}

	onChangeBranchName(data: any, index) {
		// this.allSpotRegistarionData[index].selectedBranchAccount = data;
		if (data.length > 0) {
			for (let branch of data) {
				if (branch.id == 0) {
					if (data.length < this.clientListForSpotRegistration.length) {
						let temp = [];
						let linkToIds: any = [];
						for (let client_ of this.clientListForSpotRegistration) {
							if (client_.id != 0) {
								temp.push(client_);
								linkToIds.push(client_.id);
							}
						}
						this.allSpotRegistarionData[index].linkTo = linkToIds;
						this.allSpotRegistarionData[index].selectedBranchAccount = temp;
					} else {
						this.allSpotRegistarionData[index].selectedBranchAccount = [];
					}
				} else {
					this.allSpotRegistarionData[index].selectedBranchAccount = data;
				}
			}
		}
	}

	//Social Media Add
	addOneSocialMedia() {
		let flag = false;
		if (this.allSocialMediaData.length > 0) {
			for (let item of this.allSocialMediaData) {
				if (item.mediaName == '' || item.mediaName == null) {
					flag = true;
					item.ismediaNameError = true;
				}
				if (item.mediaLink == '' || item.mediaLink == null) {
					flag = true;
					item.ismediaLinkError = true;
				}

				if (item.isDuplicatePlateForm || item.isMediaLinkValidError) {
					flag = true;
				}
			}

			this.allSocialMediaData = [...this.allSocialMediaData];
		}
		if (!flag) {
			let payload = {
				mediaName: null,
				mediaLink: null,
				mediaHandle: null,
				ismediaNameError: false,
				ismediaLinkError: false,
				isDuplicatePlateForm: false,
				isMediaLinkValidError: false,
			};
			this.allSocialMediaData.push(payload);
		}
	}

	removeSocialMedia(index) {
		this.allSocialMediaData.splice(index, 1);
	}

	isDuplicatePlateform(index: number, value: any): boolean {
		return this.allSocialMediaData.some((item, i) => item.mediaName === value && i !== index);
	}

	onSelectSocialMediaName(index: number, data: any) {
		this.allSocialMediaData[index].ismediaNameError = false;
		if (this.isDuplicatePlateform(index, data.value)) {
			this.allSocialMediaData[index].isDuplicatePlateForm = true;
		} else {
			this.allSocialMediaData[index].mediaName = data.value;
			this.allSocialMediaData[index].isDuplicatePlateForm = false;
		}
	}

	onEnterSocialMediaLink(index, char) {
		this.allSocialMediaData[index].ismediaLinkError = false;
		if (char.toLowerCase().indexOf('http') == 0) {
			this.allSocialMediaData[index].isMediaLinkValidError = false;
		} else {
			this.allSocialMediaData[index].isMediaLinkValidError = true;
		}
	}

	addOneMoreReport() {
		let payload = {
			report_name: null,
		};
		this.customReportList.push(payload);
	}

	removeReport(index) {
		this.customReportList.splice(index, 1);
	}

	SignUpWithZoom() {
		this.appBrandingService.getZoomRedirectURL(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				if (res?.redirectUrl) {
					window.location.href = res.redirectUrl;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			}
		});
	}

	revokeZoomSignIn() {
		this.appBrandingService.revokeZoomSignIn(this.zoomUserTokenId).subscribe((res: any) => {
			if (res.success) {
				this.isZoomSignUp = false;
				this.toastr.success(
					this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.zoomRevoded'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
	}

	SignUpWithTeams() {
		this.appBrandingService.getTeamsAuthUrl().subscribe((res: any) => {
			if (res.success) {
				window.open(res.redirectUrl, '_self');
			}
		});
	}
	revokeTeamSignIn() {
		this.appBrandingService.revokeTeamSignIn(this.teamUserTokenId).subscribe((res: any) => {
			if (res.success) {
				this.isTeamSignUp = false;
				this.toastr.success(
					this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.teamRevoded'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
	}

	checkClientWhatsAppSetupForOTP(clientId) {
		this.appBrandingService.getClientWhatsappSetupForOTP(clientId).subscribe((res: any) => {
			if (res.success) {
				this.isValidWhatsAppOTPTemp = res.data;
				if (res.message) {
					this.whatsAppOTPTempStatus = res.message;
				}
			}
		});
	}

	checkOTPToggle() {
		let appBrandingData = this.appBrandingForm.value;
		if (appBrandingData.isWhatsAppOTP == true && !this.isValidWhatsAppOTPTemp) {
			this.showOTPTemplateError = true;
			this.appBrandingForm.controls['isWhatsAppOTP'].setValue(false);
		} else if (appBrandingData.isWhatsAppOTP == false && this.isValidWhatsAppOTPTemp == true) {
			this.showOTPTemplateError = false;
			this.appBrandingForm.controls['isWhatsAppOTP'].setValue(false);
		} else if (appBrandingData.isWhatsAppOTP == true && this.isValidWhatsAppOTPTemp == true) {
			this.showOTPTemplateError = false;
			this.appBrandingForm.controls['isWhatsAppOTP'].setValue(true);
		}
	}

	addCarousel() {
		if (!this.validateCarousel()) {
			//Add Error Message
			this.toastr.warning(
				this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.pleaseFillAllRequiredDetails'),
				this.appService.getTranslation('Utils.warning')
			);
			return;
		}

		if (this.CarouselData.length < 4) {
			let payload = {
				imagePath: null,
				imageName: null,
				imageOriginalName: null,
				externalLink: null,
				title: null,
				description: null,
			};
			this.CarouselData.push(payload);
		}

		// console.log('this.CarouselData', this.CarouselData);
	}

	// validateCarousel() {
	// 	if (this.CarouselData.length > 0) {
	// 		for (let item of this.CarouselData) {
	// 			for (let key in item) {
	// 				if (['', ' ', null].includes(item[key]) && key !== 'externalLink') {
	// 					if (key === 'title') item.isTitleValid = false;
	// 					if (key === 'description') item.isDescriptionValid = false;
	// 					if (key === 'imageName' || key === 'imagePath') item.isImageValid = false;

	// 					return false; // Stop validation if any required field is empty
	// 				}
	// 			}
	// 		}
	// 	}
	// 	return true;
	// }

	validateCarousel() {
		let isValid = true;

		if (this.CarouselData.length > 0) {
			for (let item of this.CarouselData) {
				// Reset validation flags first
				item.isTitleValid = true;
				item.isDescriptionValid = true;
				item.isImageValid = true;

				// Check for empty values
				if (!item.title || item.title.trim() === '') {
					item.isTitleValid = false;
					isValid = false;
				}

				if (!item.description || item.description.trim() === '') {
					item.isDescriptionValid = false;
					isValid = false;
				}

				if (!item.imageName || !item.imagePath) {
					item.isImageValid = false;
					isValid = false;
				}

				this.validateExternalLink(item);
				if (item.isExternalLinkValid === false) {
					isValid = false;
				}
			}
		}

		return isValid;
	}

	validateExternalLink(item: any) {
		if (item.externalLink && !item.externalLink.toLowerCase().startsWith('http')) {
			item.isExternalLinkValid = false;
		} else {
			item.isExternalLinkValid = true;
		}
	}

	deleteCoursealImage(index: number) {
		this.CarouselData[index]['imagePath'] = null; // Remove image
		this.CarouselData[index]['previewImage'] = null; // Remove preview if exists
		this.CarouselData[index]['imageOriginalName'] = null; // Remove name
	}

	deleteCarousel(index: number) {
		this.CarouselData.splice(index, 1); // Remove entire carousel entry
	}

	uploadCarouselImage(index, event) {
		this.getImgResolution(event, 'check for 14:5').then((res) => {
			if (res == true) {
				// console.log('index', index);
				// console.log('event', event);

				this.CarouselData[index]['imageOriginalName'] = event.target.files[0].name;
				let assetUpload = event.target.files[0];
				const uploadData = new FormData();
				uploadData.append('image', assetUpload);
				this.appBrandingService.uploadSystemBranding(uploadData).subscribe((res: any) => {
					this.spinnerService.hide();
					if (res.success) {
						// this.appBrandingForm.controls['learner_app_icon_name'].patchValue(res.data.image[0].filename);
						this.CarouselData[index]['imageName'] = res.data.image[0].filename;
						// this.CarouselData[index]['imagePath'] = this.assetBasePath + this.assetBasePath2 + 'uploads/system_branding/' + res.data.image[0].filename;
						this.CarouselData[index]['imagePath'] = 'uploads/system_branding/' + res.data.image[0].filename;
					}
				});
			} else {
				this.toastr.warning(
					this.appService.getTranslation('Pages.GeneralSettings.AddEdit.Toaster.spotlightBannerthumbanilwarn'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}
}
