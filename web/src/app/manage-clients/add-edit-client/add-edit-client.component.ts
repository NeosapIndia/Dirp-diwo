import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from '../../../app/app.service';
import { ManageClientsService } from '../manage-clients.service';
import * as moment from 'moment';
import { ManageProductsAndPackagesService } from 'src/app/manage-products-and-packages/manage-products-and-packages.service';
declare var $: any;
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
@Component({
	selector: 'app-add-edit-client',
	templateUrl: './add-edit-client.component.html',
	styleUrls: ['./add-edit-client.component.css'],
})
export class AddEditClientComponent implements OnInit {
	ClientForm: any;
	jobRoleForm = [];
	clientListForForm = [];
	userClient;
	countryNameList = [];
	subClientListForForm = [];
	seletedClientForEdit: any;
	selectedClientAsParentClient;
	index: any;
	user_role = localStorage.getItem('role');
	restricted_roles = ['Admin', 'Operations'];
	parentClientJobRoleList: any;
	showJobRoleCopyButton: boolean = false;
	editClientData = null;
	clientId: any;
	categoryList = [];
	UserRoleId;
	isViewMode: boolean = false;
	isEdit: boolean = false;
	writePermission: boolean = false;
	SubscriptionData: any;
	clientData: any;
	avtarPath = environment.imageHost + environment.imagePath + 'uploads/client_avatar/';
	pageDetails: any;
	projectName: string;
	type = 'drip';
	//Custom Field
	pageResultCount = [10, 20, 30];
	customFields = [];
	customFieldTypes = [
		{ id: 1, value: 'Single-line text' },
		{ id: 2, value: 'Multi-line text' },
		{ id: 4, value: 'Dropdown select' },
		{ id: 5, value: 'Date picker' },
		{ id: 6, value: 'Number' },
		{ id: 7, value: 'Percentage' },
		{ id: 8, value: 'Currency' },
	];

	datePickerCustomFieldValidationList = [
		{ id: 1, value: 'Any Date' },
		{ id: 2, value: 'Future Date Only' },
		{ id: 3, value: 'Past Date Only' },
		{ id: 4, value: 'Specific Date Range' },
	];
	customFieldEditIndex = 0;

	futureDateValidationList = [
		{ id: 1, value: 'Any future date' },
		{ id: 2, value: 'Any date after buffer time' },
		{ id: 2, value: 'Any date in a rolling date range' },
	];

	loadOptionList = [
		{ id: 1, value: 'State (India)' },
		{ id: 2, value: 'Country' },
		{ id: 3, value: 'TimeZone' },
		{ id: 4, value: 'Days of the week' },
		{ id: 5, value: 'Month of the year' },
	];

	ranges: any = {
		// Today: [moment(), moment()],
		// Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(7, 'days'), moment()],
		'Last Week': [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
		'This Week': [moment().startOf('week'), moment().endOf('week')],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		'Year To Date': [moment().startOf('year')],
	};
	invalidDates: moment.Moment[] = [];
	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};
	selectedLoadOption: any;

	page: number = 1;
	limit: any = 10;
	totalCount: any;
	beforeEditCustomFieldData: any;

	notAllowedLabelName = [
		'Sr. No',
		'First Name',
		'Last Name',
		'Mobile',
		'Email',
		'Country',
		'State',
		'City',
		'Zip Code',
		'Branch Id',
		'Tags',
		'Job Role',
		'Have the OPT-IN permission (yes/no)',
		'Have Email Permission (yes/no)',
	];

	Timezones_List = [];
	isDripAccess: boolean = false;
	isDiwoAccess: boolean = false;

	iconObject = {
		info_icon: null,
		add_icon_30: null,
		info_icon_25: null,
		cancel_icon_26: null,
		'edit_icon-gray_25': null,
		edit_icon_25: null,
	};

	color = `#6513e1`;
	documentCustomFields = [];
	documentCustomFieldEditIndex = 0;
	percentageDropDown = [];

	quizPercentageDropDown = [];
	MaxReattemptsAllowedList = [
		{ label: '1', value: 1 },
		{ label: '2', value: 2 },
		{ label: '3', value: 3 },
		{ label: '4', value: 4 },
		{ label: '5', value: 5 },
	];

	constructor(
		private formBuilder: FormBuilder,
		private clientsService: ManageClientsService,
		public appService: AppService,
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private route: ActivatedRoute,
		private LicenseService: ManageProductsAndPackagesService
	) {
		for (let i = 5; i <= 100; i = i + 5) {
			this.percentageDropDown.push({ value: i, label: i + '%' });
		}

		for (let i = 5; i <= 100; i = i + 5) {
			this.quizPercentageDropDown.push({ label: i + '%', value: i });
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngOnInit() {
		this.getAppBranding();
		this.jobRoleForm = [];
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.pageDetails = JSON.parse(localStorage.getItem('accountPageNo')) || null;
		this.type = this.clientsService.type;
		this.createClientForm();
		this.getChildClientList(this.userClient.id);
		this.getAllCountryList();
		this.index = this.restricted_roles.indexOf(this.user_role);
		this.UserRoleId = localStorage.getItem('roleId');
		this.projectName = localStorage.getItem('projectName');

		// if(this.route.snapshot.queryParams.clientData){
		//   this.editClientData = JSON.parse(this.route.snapshot.queryParams.clientData);
		//   this.ClientForm.patchValue(this.editClientData);
		//   this.ClientForm.controls['parentClientId'].setValue(this.editClientData.Parent_client.id);
		//   this.ClientForm.controls['parentSubClientId'].setValue(null);
		//   this.jobRoleForm.push(...this.editClientData.Client_job_roles);
		//   this.selectedClientAsParentClient = this.editClientData.Parent_client;
		// } else {
		//   this.addOneJobRoleInForm();
		// }

		if (this.projectName == 'drip') {
			this.ClientForm.get('avatar').setValidators([Validators.required]);
			this.ClientForm.get('avatar_file_name').setValidators([Validators.required]);
		} else {
			this.ClientForm.get('avatar').clearValidators();
			this.ClientForm.get('avatar_file_name').clearValidators();
		}

		this.clientId = this.route.snapshot.queryParams.clientId;
		if (this.clientId) {
			this.isEdit = true;
			this.getClientSubscriptionForView();
			this.clientsService.getSingleClientByClientId(this.clientId).subscribe((res: any) => {
				if (res.success) {
					this.editClientData = res.data;
					this.ClientForm.patchValue(this.editClientData);
					this.ClientForm.controls['parentClientId'].setValue(
						this.editClientData.Parent_client && this.editClientData.Parent_client.id
							? this.editClientData.Parent_client.id
							: null
					);
					this.ClientForm.controls['client_country'].setValue(this.editClientData.Countries[0].id);
					this.jobRoleForm.push(...this.editClientData.Client_job_roles);
					this.selectedClientAsParentClient = this.editClientData.Parent_client;
					this.ClientForm.controls['client_country'].disable();
					this.ClientForm.controls['parentClientId'].disable();
					this.ClientForm.controls['percentage'].disable();
					this.ClientForm.controls['videoComplition'].disable();

					this.ClientForm.controls['name'].disable();
					this.ClientForm.controls['category'].disable();
					this.ClientForm.controls['share_flag'].disable();
					this.ClientForm.controls['drip_share_flag'].disable();
					this.ClientForm.controls['workbookshareflag'].disable();
					this.ClientForm.controls['DripAccess'].disable();
					this.ClientForm.controls['DiwoAccess'].disable();

					if (
						this.ClientForm.controls['defaultGroupForDrip'].value ||
						this.ClientForm.controls['defaultGroupForDiwo'].value
					) {
						this.ClientForm.controls['defaultGroupForDrip'].disable();
						this.ClientForm.controls['defaultGroupForDiwo'].disable();
					}

					this.isViewMode = true;
					if (res.data.customFields && res.data.customFields.length > 0) {
						this.customFields = [];
						for (let field of res.data.customFields) {
							let payload = field;
							payload.isCreated = true;
							payload.lableDuplicateError = false;
							payload.lableRequiredError = false;
							payload.lableNameNotAllowed = false;
							if (field['dateRange'] != undefined && field['dateRange'] != null) {
								payload.dateRange = {
									startDate: moment(payload.dateRange.startDate),
									endDate: moment.utc(payload.dateRange.endDate).hours(10),
								};
							}

							if (payload.options && payload.options.length > 0) {
								for (let option of payload.options) {
									option.isCreated = true;
								}
							}

							this.customFields.push(payload);
						}
					} else {
						this.customFields = [];
					}

					if (res.data.documentCustomFields && res.data.documentCustomFields.length > 0) {
						this.documentCustomFields = [];
						for (let field of res.data.documentCustomFields) {
							let payload = field;
							payload.isCreated = true;
							payload.lableDuplicateError = false;
							payload.lableRequiredError = false;
							payload.lableNameNotAllowed = false;
							if (field['dateRange'] != undefined && field['dateRange'] != null) {
								payload.dateRange = {
									startDate: moment(payload.dateRange.startDate),
									endDate: moment.utc(payload.dateRange.endDate).hours(10),
								};
							}

							if (payload.options && payload.options.length > 0) {
								for (let option of payload.options) {
									option.isCreated = true;
								}
							}

							this.documentCustomFields.push(payload);
						}
					} else {
						this.documentCustomFields = [];
					}
					if (this.jobRoleForm.length == 0) {
						this.jobRoleForm.push({
							id: null,
							job_role_name: null,
							details: null,
						});
					}
					this.getJobRoleOfParentClient(
						this.editClientData.Parent_client && this.editClientData.Parent_client.id
							? this.editClientData.Parent_client.id
							: null
					);
				}
			});
		} else {
			this.addOneJobRoleInForm();
		}
		this.clientsService.getAccountListByUserRoleId(this.UserRoleId).subscribe((res: any) => {
			if (res.success) {
				let roleIds = [3, 4, 5, 6, 7]; // Can't add same Level Account
				this.categoryList = [];
				if (roleIds.indexOf(parseInt(this.UserRoleId)) > -1) {
					res.data.filter((item: any) => {
						if (item.name != this.userClient.category) {
							this.categoryList.push(item);
						}
					});
				} else {
					this.categoryList = res.data;
				}
			}
		});

		this.getRollPermission();

		//unification
		if (
			this.type == 'diwo' &&
			(this.UserRoleId == 4 || this.UserRoleId == 5 || this.UserRoleId == 6 || this.UserRoleId == 7)
		) {
			if (this.userClient.DripAccess) {
				this.isDripAccess = true;
			} else {
				this.isDripAccess = false;
			}
		} else if (
			this.type == 'drip' &&
			(this.UserRoleId == 4 || this.UserRoleId == 5 || this.UserRoleId == 6 || this.UserRoleId == 7)
		) {
			if (this.userClient.DiwoAccess) {
				this.isDiwoAccess = true;
			} else {
				this.isDiwoAccess = false;
			}
		}
	}

	createClientForm() {
		this.ClientForm = this.formBuilder.group({
			id: null,
			name: ['', Validators.required],
			details: [''],
			parentClientId: [null, Validators.required],
			parentSubClientId: [null],
			share_flag: [false],
			client_share_flag: [false],
			client_country: [null, Validators.required],
			avatar: [null],
			avatar_file_name: [null],
			category: [null],
			drip_share_flag: [false],
			workbookshareflag: [false],
			DripAccess: [false],
			DiwoAccess: [false],
			defaultGroupForDrip: [false],
			defaultGroupForDiwo: [false],
			enableChatBot: [false],
			useSendGrid: [true],
			percentage: [50],
			videoComplition: [false],
			isQuizCompletion: [false],
			quizPercentage: [50],
			maxReAttemptsAllowed: [2],
		});
	}
	get f() {
		return this.ClientForm.controls;
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

	getRollPermission() {
		let payload = {
			roleId: this.UserRoleId,
			permission: 'RW',
			menuId: [],
		};
		if (this.userClient.category == 'Product Owner Account') {
			payload.menuId.push(2);
		} else if (this.userClient.category == 'Partner Account') {
			payload.menuId.push(3);
		} else if (this.userClient.category == 'Client Account') {
			payload.menuId.push(4);
		} else if (this.userClient.category == 'Branch Account') {
			payload.menuId.push(5);
		}

		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getClientSubscriptionForView() {
		this.LicenseService.getClientViewSubscriptionById(this.clientId).subscribe((res: any) => {
			if (res.success) {
				this.SubscriptionData = res.data.license;
				// this.clientData = res.data.client;
			}
		});
	}

	editAccount() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.ClientForm.controls['name'].enable();
			this.ClientForm.controls['share_flag'].enable();
			this.ClientForm.controls['drip_share_flag'].enable();
			this.ClientForm.controls['workbookshareflag'].enable();
			this.ClientForm.controls['DripAccess'].enable();
			this.ClientForm.controls['DiwoAccess'].enable();
			this.ClientForm.controls['percentage'].enable();
			this.ClientForm.controls['videoComplition'].enable();
			this.ClientForm.controls['defaultGroupForDrip'].enable();
			this.ClientForm.controls['defaultGroupForDiwo'].enable();

			this.isViewMode = false;
		}
	}

	getAllCountryList() {
		this.appService.getCountries().subscribe(
			(res: any) => {
				if (res.success) {
					this.countryNameList = res.data;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			},
			(error) => {}
		);
	}

	getChildClientList(parentClientId) {
		this.clientsService.getChildClientWithParentClient(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				// this.clientListForForm.push(this.userClient);
				for (let client of res.data) {
					this.clientListForForm.push(client);
				}
			}
		});
	}

	getSubChildClientList(parentClientId) {
		this.clientsService.getSubChildClient(parentClientId).subscribe((res: any) => {
			if (res.success) {
				this.subClientListForForm = [];
				if (this.seletedClientForEdit) {
					for (let client of res.data) {
						if (client.id != this.seletedClientForEdit.id) {
							this.subClientListForForm.push(client);
						}
					}
				} else {
					this.subClientListForForm = res.data;
				}
			}
		});
	}

	addOneJobRoleInForm() {
		if (this.isViewMode == false) {
			let payload = {
				id: null,
				job_role_name: null,
				details: null,
			};
			this.jobRoleForm.push(payload);
		}
	}
	removeJobRole(index) {
		if (this.isViewMode == false) {
			this.jobRoleForm.splice(index, 1);
		}
	}

	uploadImage(event) {
		// if ((event.target.files[0].type).includes("image")) {
		//   this.ClientForm.controls['avatar'].patchValue(event.target.files[0].name);
		//   let assetUpload = event.target.files[0];
		//   const uploadData = new FormData();
		//   uploadData.append('image', assetUpload);
		//   this.clientsService.uploadAvatar(uploadData).subscribe((res: any) => {
		//     this.spinnerService.hide();
		//     if (res.success) {
		//       this.ClientForm.controls['avatar_file_name'].patchValue(res.data.image[0].filename);
		//       // this.asset_details[index].name = res.data.image[0].originalname;
		//       // this.asset_details[index].path = res.data.image[0].filename;
		//       // this.asset_details[index].size = (Math.round(res.data.image[0].size) / 1048576).toString() + 'MB';
		//     }
		//   })
		// } else {
		//   $('#mediaWeb').val('');
		//   this.toastr.warning(this.appService.getTranslation('Utils.fileNotSupport'), this.appService.getTranslation('Utils.alert'));
		// }
		this.getImgResolution(event).then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					this.ClientForm.controls['avatar'].patchValue(event.target.files[0].name);
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.clientsService.uploadAvatar(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							this.ClientForm.controls['avatar_file_name'].patchValue(res.data.image[0].filename);
						}
					});
				}
			} else {
				this.toastr.warning(
					this.appService.getTranslation('Pages.Account.AddEdit.Toaster.thumbnailwarn'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}

	getImgResolution(evt: any) {
		let p = new Promise(function (resolve, reject) {
			let image: any = evt.target.files[0];
			let fr = new FileReader();
			fr.onload = () => {
				var img = new Image();
				img.onload = () => {
					let imgMode = false;
					if (img.height / img.width == 1) {
						imgMode = true;
					}
					resolve(imgMode);
				};
				img.src = fr.result + '';
			};
			fr.readAsDataURL(image);
		});
		return p;
	}

	selectedChildClient(selectedClient) {
		if (selectedClient.id != this.userClient.id) {
			this.selectedClientAsParentClient = selectedClient;
			this.ClientForm.controls['parentSubClientId'].setValue(null);
			this.getSubChildClientList(selectedClient.id);
		} else {
			this.selectedClientAsParentClient = selectedClient;
			this.ClientForm.controls['parentSubClientId'].setValue(null);
			this.subClientListForForm = [];
		}
		this.getJobRoleOfParentClient(selectedClient.id);

		//unification
		if (
			this.type == 'diwo' &&
			(this.UserRoleId == 4 || this.UserRoleId == 5 || this.UserRoleId == 6 || this.UserRoleId == 7)
		) {
			if (selectedClient.DripAccess) {
				this.isDripAccess = true;
			} else {
				this.isDripAccess = false;
			}
		} else if (
			this.type == 'drip' &&
			(this.UserRoleId == 4 || this.UserRoleId == 5 || this.UserRoleId == 6 || this.UserRoleId == 7)
		) {
			if (selectedClient.DiwoAccess) {
				this.isDiwoAccess = true;
			} else {
				this.isDiwoAccess = false;
			}
		}
	}

	getJobRoleOfParentClient(clientId) {
		let payload = {
			ClientId: [clientId],
		};
		this.clientsService.getJobRoleByClientId(payload).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.length > 0) {
					this.showJobRoleCopyButton = true;
					this.parentClientJobRoleList = res.data;
				} else {
					this.showJobRoleCopyButton = false;
				}
			}
		});
	}

	changeShare() {}

	onDeleteImage() {
		if (this.isViewMode == false) {
			$('#mediaWeb').val('');
			this.ClientForm.patchValue({ avatar: null });
		}
	}

	copyJobRoleFromParentClient() {
		if (this.isViewMode == false) {
			this.showJobRoleCopyButton = false;
			for (let role of this.parentClientJobRoleList) {
				let flag = true;

				for (let existingRole of this.jobRoleForm) {
					if (existingRole.job_role_name !== null) {
						if (role.job_role_name.toLowerCase() == existingRole.job_role_name.toLowerCase()) {
							flag = false;
						}
					}
				}
				if (flag) {
					let payload = {
						id: null,
						job_role_name: role.job_role_name,
						details: role.details,
					};
					this.jobRoleForm.push(payload);
				}
			}
		}
	}

	save() {
		// Custion Fields
		if (this.customFields.length > 0) {
			let flag = false;

			for (let data of this.customFields) {
				// Validation for Custom Field Label and Data Type
				if (data.label == null || data.label == '') {
					data.lableRequiredError = true;
					flag = true;
				} else {
					data.lableRequiredError = false;
					data.label = data.label.trim(); // Trim the Label;
					if (data.options && data.options.length > 0) {
						for (let option of data.options) {
							if (option.label != null && option.label != '') {
								option.label = option.label.trim(); // Trim the Label
							}
						}
					}
				}

				if (data.dataType == null) {
					data.dataTypeError = true;
					flag = true;
				} else {
					data.dataTypeError = false;
				}
			}
			for (let j = 0; j < this.customFields.length; j++) {
				this.customFields[j].lableDuplicateError = false;
				for (let i = 0; i < this.customFields.length; i++) {
					if (i != j && this.customFields[i].label == this.customFields[j].label) {
						//Add Error Message
						this.customFields[j].lableDuplicateError = true;
						this.customFields[j].label = null;
						flag = true;
					}
				}
			}
			if (flag) {
				return;
			}
		}

		// Custion Fields
		if (this.documentCustomFields.length > 0) {
			let flag = false;

			for (let data of this.documentCustomFields) {
				// Validation for Custom Field Label and Data Type
				if (data.label == null || data.label == '') {
					data.lableRequiredError = true;
					flag = true;
				} else {
					data.lableRequiredError = false;
					data.label = data.label.trim(); // Trim the Label;
					if (data.options && data.options.length > 0) {
						for (let option of data.options) {
							if (option.label != null && option.label != '') {
								option.label = option.label.trim(); // Trim the Label
							}
						}
					}
				}

				if (data.dataType == null) {
					data.dataTypeError = true;
					flag = true;
				} else {
					data.dataTypeError = false;
				}
			}
			for (let j = 0; j < this.documentCustomFields.length; j++) {
				this.documentCustomFields[j].lableDuplicateError = false;
				for (let i = 0; i < this.documentCustomFields.length; i++) {
					if (i != j && this.documentCustomFields[i].label == this.documentCustomFields[j].label) {
						//Add Error Message
						this.documentCustomFields[j].lableDuplicateError = true;
						this.documentCustomFields[j].label = null;
						flag = true;
					}
				}
			}
			if (flag) {
				return;
			}
		}

		if (this.ClientForm.invalid) {
			this.markAsTouched(this.ClientForm);
			return;
		}

		this.ClientForm.controls['client_country'].enable();
		this.spinnerService.show();
		let ClientData = this.ClientForm.value;
		ClientData.Associate_client_id = this.selectedClientAsParentClient.id;
		ClientData.share_flag = ClientData.share_flag == true ? ClientData.share_flag : false;
		ClientData.drip_share_flag = ClientData.drip_share_flag ? ClientData.drip_share_flag : false;
		ClientData.defaultGroupForDrip = ClientData.defaultGroupForDrip == true ? ClientData.defaultGroupForDrip : false;
		ClientData.defaultGroupForDiwo = ClientData.defaultGroupForDiwo ? ClientData.defaultGroupForDiwo : false;
		let newJobRoleArray = [];
		for (let item of this.jobRoleForm) {
			if (item.job_role_name !== null && item.job_role_name !== '') {
				newJobRoleArray.push(item);
			}
		}

		if (this.jobRoleForm.length == 1) {
			ClientData.Client_job_roles = this.jobRoleForm;
		} else {
			ClientData.Client_job_roles = newJobRoleArray;
		}

		if (this.customFields.length > 0) {
			ClientData.customFields = this.customFields;
		} else {
			ClientData.customFields = [];
		}

		if (this.documentCustomFields.length > 0) {
			ClientData.documentCustomFields = this.documentCustomFields;
		} else {
			ClientData.documentCustomFields = [];
		}

		ClientData.createdDate = moment().format('DD-MM-YYYY HH:mm');

		if (this.ClientForm.value.id == null) {
			this.clientsService.createClient(ClientData, this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.Account.AddEdit.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.Account.AddEdit.Toaster.acccreated'),
							this.appService.getTranslation('Utils.success')
						);
					}
					$('#addClientModal').modal('hide');
					this.spinnerService.hide();
					this.ClientForm.reset();
					this.appService.checkNotifcation = true;
					this.router.navigate(['/clients']);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, 'Error');
				}
				this.selectedClientAsParentClient = null;
				this.seletedClientForEdit = null;
			});
		} else {
			this.savePagination();
			this.clientsService.updateClients(this.userClient.id, ClientData).subscribe((res: any) => {
				if (res.success) {
					if (this.index >= 0) {
						this.toastr.success(
							this.appService.getTranslation('Pages.Account.AddEdit.Toaster.raiserequest'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.Account.AddEdit.Toaster.accupdated'),
							this.appService.getTranslation('Utils.success')
						);
					}
					this.ClientForm.reset();
					this.spinnerService.hide();
					this.appService.checkNotifcation = true;
					setTimeout(() => {
						this.router.navigate(['/clients']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
				this.spinnerService.hide();

				this.selectedClientAsParentClient = null;
				this.seletedClientForEdit = null;
			});
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['clients']);
			}, 100);
		} else {
			this.router.navigate(['clients']);
		}
	}

	RestrictComma(e) {
		let theEvent = e || window.event;
		let key = theEvent.keyCode || theEvent.which;
		key = String.fromCharCode(key);
		let regex = /[^,]+$/;
		if (!regex.test(key)) {
			theEvent.returnValue = false;
			if (theEvent.preventDefault) {
				theEvent.preventDefault();
			}
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('accountPageNo', JSON.stringify(payload));
	}

	removeCustomField(index) {
		this.customFields.splice(index, 1);

		for (let i = index; i < this.customFields.length; i++) {
			this.customFields[i].fieldIndex = i;
		}

		// console.log('---customFields', this.customFields);
	}

	removeDocumentCustomField(index) {
		this.documentCustomFields.splice(index, 1);

		for (let i = index; i < this.documentCustomFields.length; i++) {
			this.documentCustomFields[i].fieldIndex = i;
		}

		// console.log('---documentCustomFields', this.documentCustomFields);
	}

	addCustomField() {
		let count = this.customFields.length;
		if (this.customFields.length < 20 && !this.isViewMode) {
			let payload = {
				label: '',
				dataType: null,
				isRequired: false,
				isHide: false,
				isCreated: false,
				lableRequiredError: false,
				lableDuplicateError: false,
				lableNameNotAllowed: false,
				dataTypeError: false,
				fieldIndex: count,
			};
			this.customFields.push(payload);
			count++;
		}
	}

	addDocumentCustomField() {
		let count = this.documentCustomFields.length;
		if (this.documentCustomFields.length < 20 && !this.isViewMode) {
			let payload = {
				label: '',
				dataType: null,
				isRequired: false,
				isHide: false,
				isCreated: false,
				lableRequiredError: false,
				lableDuplicateError: false,
				lableNameNotAllowed: false,
				dataTypeError: false,
				fieldIndex: count,
			};
			this.documentCustomFields.push(payload);
			count++;
		}
	}

	checkInputField(index) {
		if (this.customFields[index].label == '' || this.customFields[index].label == null) {
			this.customFields[index].lableRequiredError = true;
			this.customFields[index].lableDuplicateError = false;
		} else {
			this.customFields[index].lableRequiredError = false;
			this.customFields[index].lableDuplicateError = false;
		}

		if (this.customFields[index].dataType == null) {
			this.customFields[index].dataTypeError = false;
		} else {
			this.customFields[index].dataTypeError = false;
		}

		//check Not Allowed Label Name
		this.checkLableNameNotAllowed(index);

		this.customFields[index].lableDuplicateError = false;
		for (let i = 0; i < this.customFields.length; i++) {
			if (i != index && this.customFields[i].label == this.customFields[index].label) {
				//Add Error Message
				this.customFields[index].lableDuplicateError = true;
				this.customFields[index].label = null;
				return;
			}
		}
	}

	checkDocumentInputField(index) {
		if (this.documentCustomFields[index].label == '' || this.documentCustomFields[index].label == null) {
			this.documentCustomFields[index].lableRequiredError = true;
			this.documentCustomFields[index].lableDuplicateError = false;
		} else {
			this.documentCustomFields[index].lableRequiredError = false;
			this.documentCustomFields[index].lableDuplicateError = false;
		}

		if (this.documentCustomFields[index].dataType == null) {
			this.documentCustomFields[index].dataTypeError = false;
		} else {
			this.documentCustomFields[index].dataTypeError = false;
		}

		//check Not Allowed Label Name
		this.checkDocumentLableNameNotAllowed(index);

		this.documentCustomFields[index].lableDuplicateError = false;
		for (let i = 0; i < this.documentCustomFields.length; i++) {
			if (i != index && this.documentCustomFields[i].label == this.documentCustomFields[index].label) {
				//Add Error Message
				this.documentCustomFields[index].lableDuplicateError = true;
				this.documentCustomFields[index].label = null;
				return;
			}
		}
	}

	checkLableNameNotAllowed(index) {
		for (let item of this.notAllowedLabelName) {
			if (this.customFields[index].label.toLowerCase() == item.toLowerCase()) {
				this.customFields[index].lableNameNotAllowed = true;
				this.customFields[index].label = null;
				return;
			}
		}
		this.customFields[index].lableNameNotAllowed = false;
	}

	checkDocumentLableNameNotAllowed(index) {
		for (let item of this.notAllowedLabelName) {
			if (this.documentCustomFields[index].label.toLowerCase() == item.toLowerCase()) {
				this.documentCustomFields[index].lableNameNotAllowed = true;
				this.documentCustomFields[index].label = null;
				return;
			}
		}
		this.documentCustomFields[index].lableNameNotAllowed = false;
	}

	//After Selecting Custom Field Type
	selectCustomFieldType(index) {
		this.beforeEditCustomFieldData = null;
		this.customFieldEditIndex = index;

		if (['Single-line text', 'Multi-line text'].indexOf(this.customFields[index].dataType) > -1) {
			this.customFields[index].minCharLimit = 1;
			this.customFields[index].maxCharLimit = 100;
			this.customFields[index].restrictNumber = false;
			this.customFields[index].restrictSpecialChar = false;
			this.customFields[index].isCreated = false;
		} else if (['Number', 'Percentage'].indexOf(this.customFields[index].dataType) > -1) {
			this.customFields[index].setMinValue = null;
			this.customFields[index].setMaxValue = null;
			this.customFields[index].decimalLimit = null;
		} else if (this.customFields[index].dataType == 'Currency') {
			this.customFields[index].countryName = null;
			this.customFields[index].countryId = null;
			this.customFields[index].currencySymbol = null;
		} else if (this.customFields[index].dataType == 'Date picker') {
			this.customFields[index].datePickerValidationType = 'Any Date';
			this.customFields[index].dateRange = null;
			this.customFields[index].dayCount = null;
		} else if (['Radio select', 'Dropdown select'].indexOf(this.customFields[index].dataType) > -1) {
			this.customFields[index].options = [
				{ label: null, isCreated: false, isHide: false, requiredError: false },
				{ label: null, isCreated: false, isHide: false, requiredError: false },
			];
		}
		this.customFields[index].isCreated = false;

		this.uploadLabelTotleCount();
		$('#customFieldValidationPopup').modal('show');
	}

	//After Selecting Custom Field Type
	selectDocumentCustomFieldType(index) {
		this.beforeEditCustomFieldData = null;
		this.documentCustomFieldEditIndex = index;

		if (['Single-line text', 'Multi-line text'].indexOf(this.documentCustomFields[index].dataType) > -1) {
			this.documentCustomFields[index].minCharLimit = 1;
			this.documentCustomFields[index].maxCharLimit = 100;
			this.documentCustomFields[index].restrictNumber = false;
			this.documentCustomFields[index].restrictSpecialChar = false;
			this.documentCustomFields[index].isCreated = false;
		} else if (['Number', 'Percentage'].indexOf(this.documentCustomFields[index].dataType) > -1) {
			this.documentCustomFields[index].setMinValue = null;
			this.documentCustomFields[index].setMaxValue = null;
			this.documentCustomFields[index].decimalLimit = null;
		} else if (this.documentCustomFields[index].dataType == 'Currency') {
			this.documentCustomFields[index].countryName = null;
			this.documentCustomFields[index].countryId = null;
			this.documentCustomFields[index].currencySymbol = null;
		} else if (this.documentCustomFields[index].dataType == 'Date picker') {
			this.documentCustomFields[index].datePickerValidationType = 'Any Date';
			this.documentCustomFields[index].dateRange = null;
			this.documentCustomFields[index].dayCount = null;
		} else if (['Radio select', 'Dropdown select'].indexOf(this.documentCustomFields[index].dataType) > -1) {
			this.documentCustomFields[index].options = [
				{ label: null, isCreated: false, isHide: false, requiredError: false },
				{ label: null, isCreated: false, isHide: false, requiredError: false },
			];
		}
		this.documentCustomFields[index].isCreated = false;

		this.uploadDocumentLabelTotleCount();
		$('#documentCustomFieldValidationPopup').modal('show');
	}

	closeValidationPopup() {
		$('#customFieldValidationPopup').modal('hide');
		$('#documentCustomFieldValidationPopup').modal('hide');
	}

	async setCusomFieldValidation() {
		// Need to Validation Before Closeing Popup
		if (['Radio select', 'Dropdown select'].indexOf(this.customFields[this.customFieldEditIndex].dataType) > -1) {
			let flag = false;
			for (let data of this.customFields[this.customFieldEditIndex].options) {
				if (data.label == null || data.label == '') {
					flag = true;
					data.requiredError = true;
				} else {
					data.requiredError = false;
				}
			}
			if (flag) {
				return;
			}
		}

		if (await this.checkAnyChageInCustomField()) {
			this.showWarningPopup();
		} else {
			this.closeValidationPopup();
		}
	}

	async setDocmentCusomFieldValidation() {
		// Need to Validation Before Closeing Popup
		if (
			['Radio select', 'Dropdown select'].indexOf(
				this.documentCustomFields[this.documentCustomFieldEditIndex].dataType
			) > -1
		) {
			let flag = false;
			for (let data of this.documentCustomFields[this.documentCustomFieldEditIndex].options) {
				if (data.label == null || data.label == '') {
					flag = true;
					data.requiredError = true;
				} else {
					data.requiredError = false;
				}
			}
			if (flag) {
				return;
			}
		}

		if (await this.checkAnyChageInDocumentCustomField()) {
			this.showWarningPopup();
		} else {
			this.closeValidationPopup();
		}
	}

	showWarningPopup() {
		this.closeValidationPopup();
		$('#customFieldWarningPopUp').modal('show');
	}

	closeWarningPopup() {
		$('#customFieldWarningPopUp').modal('hide');
	}
	async checkAnyChageInCustomField() {
		let flag = false;
		if (this.beforeEditCustomFieldData && this.beforeEditCustomFieldData.isCreated) {
			for (let key in this.beforeEditCustomFieldData) {
				if (key === 'options') {
					if (this.beforeEditCustomFieldData[key].length != this.customFields[this.customFieldEditIndex][key].length) {
						flag = true;
						break;
					}
					for (let i = 0; i < this.beforeEditCustomFieldData[key].length; i++) {
						if (
							this.beforeEditCustomFieldData[key][i].label != this.customFields[this.customFieldEditIndex][key][i].label
						) {
							flag = true;
							break;
						}
					}
				} else {
					if (this.beforeEditCustomFieldData[key] != this.customFields[this.customFieldEditIndex][key]) {
						flag = true;
						break;
					}
				}
			}
		} else {
			return false;
		}

		return flag;
	}

	async checkAnyChageInDocumentCustomField() {
		let flag = false;
		if (this.beforeEditCustomFieldData && this.beforeEditCustomFieldData.isCreated) {
			for (let key in this.beforeEditCustomFieldData) {
				if (key === 'options') {
					if (
						this.beforeEditCustomFieldData[key].length !=
						this.documentCustomFields[this.documentCustomFieldEditIndex][key].length
					) {
						flag = true;
						break;
					}
					for (let i = 0; i < this.beforeEditCustomFieldData[key].length; i++) {
						if (
							this.beforeEditCustomFieldData[key][i].label !=
							this.documentCustomFields[this.documentCustomFieldEditIndex][key][i].label
						) {
							flag = true;
							break;
						}
					}
				} else {
					if (
						this.beforeEditCustomFieldData[key] != this.documentCustomFields[this.documentCustomFieldEditIndex][key]
					) {
						flag = true;
						break;
					}
				}
			}
		} else {
			return false;
		}

		return flag;
	}

	checkOptionField(index) {
		if (index >= 0) {
			if (
				this.customFields[this.customFieldEditIndex].options[index].label == '' ||
				this.customFields[this.customFieldEditIndex].options[index].label == null
			) {
				this.customFields[this.customFieldEditIndex].options[index].requiredError = true;
			} else {
				this.customFields[this.customFieldEditIndex].options[index].requiredError = false;
			}
		}
	}

	checkDocumentOptionField(index) {
		if (index >= 0) {
			if (
				this.documentCustomFields[this.documentCustomFieldEditIndex].options[index].label == '' ||
				this.documentCustomFields[this.documentCustomFieldEditIndex].options[index].label == null
			) {
				this.documentCustomFields[this.documentCustomFieldEditIndex].options[index].requiredError = true;
			} else {
				this.documentCustomFields[this.documentCustomFieldEditIndex].options[index].requiredError = false;
			}
		}
	}

	selectCountryForCurrency(data) {
		if (data) {
			this.customFields[this.customFieldEditIndex].countryId = data.id;
			this.customFields[this.customFieldEditIndex].currencySymbol =
				data.Currencies && data.Currencies[0] ? data.Currencies[0].currencySymbol : null;
		}
	}

	selectDocumentCountryForCurrency(data) {
		if (data) {
			this.documentCustomFields[this.documentCustomFieldEditIndex].countryId = data.id;
			this.documentCustomFields[this.documentCustomFieldEditIndex].currencySymbol =
				data.Currencies && data.Currencies[0] ? data.Currencies[0].currencySymbol : null;
		}
	}

	selecDatePickerValidation(data) {
		if (data) {
			this.customFields[this.customFieldEditIndex].futureDateValidationType = null;
			this.customFields[this.customFieldEditIndex].dayCount = null;
			if (data.value == 'Specific Date Range') {
			} else if (data.value == 'Any Date') {
				// this.customFields[this.customFieldEditIndex].futureDateValidationType = null;
			} else if (data.value == 'Future Date Only') {
				this.customFields[this.customFieldEditIndex].futureDateValidationType = 'Any future date';
			} else if (data.value == 'Past Date Only') {
				// this.customFields[this.customFieldEditIndex].futureDateValidationType = null;
			}
		}
	}

	selecDocumentDatePickerValidation(data) {
		if (data) {
			this.documentCustomFields[this.documentCustomFieldEditIndex].futureDateValidationType = null;
			this.documentCustomFields[this.documentCustomFieldEditIndex].dayCount = null;
			if (data.value == 'Specific Date Range') {
			} else if (data.value == 'Any Date') {
				// this.documentCustomFields[this.documentCustomFieldEditIndex].futureDateValidationType = null;
			} else if (data.value == 'Future Date Only') {
				this.documentCustomFields[this.documentCustomFieldEditIndex].futureDateValidationType = 'Any future date';
			} else if (data.value == 'Past Date Only') {
				// this.documentCustomFields[this.documentCustomFieldEditIndex].futureDateValidationType = null;
			}
		}
	}

	onDateChange(value) {
		if (value && value.startDate) {
			this.customFields[this.customFieldEditIndex].startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
		}
		if (value && value.endDate) {
			this.customFields[this.customFieldEditIndex].endDate = moment(value.endDate.$d)
				.subtract(1, 'day')
				.format('YYYY-MM-DD');
		}
	}

	onDocumentDateChange(value) {
		if (value && value.startDate) {
			this.documentCustomFields[this.documentCustomFieldEditIndex].startDate = moment(value.startDate.$d).format(
				'YYYY-MM-DD'
			);
		}
		if (value && value.endDate) {
			this.documentCustomFields[this.documentCustomFieldEditIndex].endDate = moment(value.endDate.$d)
				.subtract(1, 'day')
				.format('YYYY-MM-DD');
		}
	}

	deleteOption(optionIndex) {
		this.customFields[this.customFieldEditIndex].options.splice(optionIndex, 1);
		this.uploadLabelTotleCount();
	}

	deleteDcoumentOption(optionIndex) {
		this.documentCustomFields[this.documentCustomFieldEditIndex].options.splice(optionIndex, 1);
		this.uploadDocumentLabelTotleCount();
	}

	addOption() {
		this.customFields[this.customFieldEditIndex].options.push({
			label: null,
			isHide: false,
			isCreated: false,
			requiredError: false,
		});
		this.uploadLabelTotleCount();
	}

	addDocumentOption() {
		this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
			label: null,
			isHide: false,
			isCreated: false,
			requiredError: false,
		});
		this.uploadDocumentLabelTotleCount();
	}

	pathExcel() {}

	showLoadOptionPopup() {
		$('#customFieldValidationPopup').modal('hide');
		$('#documentCustomFieldValidationPopup').modal('hide');
		setTimeout(() => {
			$('#loadOptionModel').modal('show');
		}, 500);
	}

	selectLoadOptions(data) {
		if (data && data.value) {
			this.selectedLoadOption = data.value;
			if (this.selectedLoadOption == 'TimeZone') {
				this.clientsService.getTimeZoneData().subscribe((res: any) => {
					this.Timezones_List = res;
				});
			}
		}
	}

	loadOptions() {
		if (this.selectedLoadOption) {
			this.customFields[this.customFieldEditIndex].options = this.customFields[
				this.customFieldEditIndex
			].options.filter((item) => item.label != null && item.label != '');

			if (this.selectedLoadOption == 'State (India)') {
				if (this.countryNameList && this.countryNameList.length > 0) {
					for (let data of this.countryNameList[99].Provinces) {
						this.customFields[this.customFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'Country') {
				if (this.countryNameList && this.countryNameList.length > 0) {
					for (let data of this.countryNameList) {
						this.customFields[this.customFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'TimeZone') {
				if (this.Timezones_List && this.Timezones_List.length > 0) {
					for (let data of this.Timezones_List) {
						this.customFields[this.customFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'Days of the week') {
				let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				for (let data of days) {
					this.customFields[this.customFieldEditIndex].options.push({
						label: data,
						isCreated: false,
						isHide: false,
						requiredError: false,
					});
				}
			} else if (this.selectedLoadOption == 'Month of the year') {
				let months = [
					'January',
					'February',
					'March',
					'April',
					'May',
					'June',
					'July',
					'August',
					'September',
					'October',
					'November',
					'December',
				];
				for (let data of months) {
					this.customFields[this.customFieldEditIndex].options.push({
						label: data,
						isCreated: false,
						isHide: false,
						requiredError: false,
					});
				}
			}
			this.uploadLabelTotleCount();
			this.selectedLoadOption = null;

			$('#loadOptionModel').modal('hide');

			setTimeout(() => {
				$('#customFieldValidationPopup').modal('show');
			}, 500);
		}
	}

	DocumentloadOptions() {
		if (this.selectedLoadOption) {
			this.documentCustomFields[this.documentCustomFieldEditIndex].options = this.documentCustomFields[
				this.documentCustomFieldEditIndex
			].options.filter((item) => item.label != null && item.label != '');

			if (this.selectedLoadOption == 'State (India)') {
				if (this.countryNameList && this.countryNameList.length > 0) {
					for (let data of this.countryNameList[99].Provinces) {
						this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'Country') {
				if (this.countryNameList && this.countryNameList.length > 0) {
					for (let data of this.countryNameList) {
						this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'TimeZone') {
				if (this.Timezones_List && this.Timezones_List.length > 0) {
					for (let data of this.Timezones_List) {
						this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
							label: data.name,
							isCreated: false,
							isHide: false,
							requiredError: false,
						});
					}
				}
			} else if (this.selectedLoadOption == 'Days of the week') {
				let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				for (let data of days) {
					this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
						label: data,
						isCreated: false,
						isHide: false,
						requiredError: false,
					});
				}
			} else if (this.selectedLoadOption == 'Month of the year') {
				let months = [
					'January',
					'February',
					'March',
					'April',
					'May',
					'June',
					'July',
					'August',
					'September',
					'October',
					'November',
					'December',
				];
				for (let data of months) {
					this.documentCustomFields[this.documentCustomFieldEditIndex].options.push({
						label: data,
						isCreated: false,
						isHide: false,
						requiredError: false,
					});
				}
			}
			this.uploadLabelTotleCount();
			this.selectedLoadOption = null;

			$('#documentCustomFieldValidationPopup').modal('hide');

			setTimeout(() => {
				$('#customFieldValidationPopup').modal('show');
			}, 500);
		}
	}

	cancelOptionpopup() {
		$('#loadOptionModel').modal('hide');
		setTimeout(() => {
			$('#customFieldValidationPopup').modal('show');
		}, 500);
	}

	uploadLabels(evt: any) {
		const target: DataTransfer = <DataTransfer>evt.target;
		if (target.files.length !== 1) throw new Error('Cannot use multiple files');
		const reader: FileReader = new FileReader();
		reader.onload = (e: any) => {
			/* read workbook */
			const bstr: string = e.target.result;
			const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

			/* grab first sheet */
			const wsname: string = wb.SheetNames[0];
			const ws: XLSX.WorkSheet = wb.Sheets[wsname];

			/* save data */
			const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
			// console.log(data); // You can now use this data for further processing

			if (data.length > 1) {
				let excelLabelData = data;
				excelLabelData.splice(0, 1);
				this.customFields[this.customFieldEditIndex].options = this.customFields[
					this.customFieldEditIndex
				].options.filter((item) => item != null && item != '');
				for (let data of excelLabelData) {
					this.customFields[this.customFieldEditIndex].options.push({
						label: data[1],
						isCreated: false,
						requiredError: false,
					});
				}
				this.uploadLabelTotleCount();
			}
		};
		reader.readAsBinaryString(target.files[0]);
	}

	clearLabelList() {
		this.customFields[this.customFieldEditIndex].options = [
			{ label: null, isCreated: false, isHide: false, requiredError: false },
			{ label: null, isCreated: false, isHide: false, requiredError: false },
		];
		this.totalCount = 2;
		this.changeResult(this.pageResultCount[0]);
	}

	clearDocumentLabelList() {
		this.documentCustomFields[this.documentCustomFieldEditIndex].options = [
			{ label: null, isCreated: false, isHide: false, requiredError: false },
			{ label: null, isCreated: false, isHide: false, requiredError: false },
		];
		this.totalCount = 2;
		this.changeResult(this.pageResultCount[0]);
	}

	editCustomField(index) {
		this.beforeEditCustomFieldData = JSON.parse(JSON.stringify(this.customFields[index]));
		if (this.customFields[index].dataType != null) {
			this.customFieldEditIndex = index;

			$('#customFieldValidationPopup').modal('show');
		}
	}

	editDocumentCustomField(index) {
		this.beforeEditCustomFieldData = JSON.parse(JSON.stringify(this.documentCustomFields[index]));
		if (this.documentCustomFields[index].dataType != null) {
			this.customFieldEditIndex = index;

			$('#documentCustomFieldValidationPopup').modal('show');
		}
	}

	cancelCustomFilter() {
		this.closeValidationPopup();
		this.closeWarningPopup();
		// this.customFields[this.customFieldEditIndex].dataType = null;

		this.customFields[this.customFieldEditIndex].options = [
			{ label: null, isCreated: false, isHide: false, requiredError: false },
			{ label: null, isCreated: false, isHide: false, requiredError: false },
		];
		this.customFields[this.customFieldEditIndex].minCharLimit = 1;
		this.customFields[this.customFieldEditIndex].maxCharLimit = 100;
		this.customFields[this.customFieldEditIndex].restrictNumber = false;
		this.customFields[this.customFieldEditIndex].restrictSpecialChar = false;

		this.customFields[this.customFieldEditIndex].setMinValue = null;
		this.customFields[this.customFieldEditIndex].setMaxValue = null;
		this.customFields[this.customFieldEditIndex].decimalLimit = null;

		this.customFields[this.customFieldEditIndex].countryName = null;
		this.customFields[this.customFieldEditIndex].countryId = null;
		this.customFields[this.customFieldEditIndex].currencySymbol = null;

		this.customFields[this.customFieldEditIndex].datePickerValidationType = 'Any Date';
		this.customFields[this.customFieldEditIndex].dateRange = null;

		if (this.beforeEditCustomFieldData) {
			this.customFields[this.customFieldEditIndex] = this.beforeEditCustomFieldData;
		}
	}

	cancelDocumentCustomFilter() {
		this.closeValidationPopup();
		this.closeWarningPopup();
		// this.customFields[this.customFieldEditIndex].dataType = null;

		this.documentCustomFields[this.documentCustomFieldEditIndex].options = [
			{ label: null, isCreated: false, isHide: false, requiredError: false },
			{ label: null, isCreated: false, isHide: false, requiredError: false },
		];
		this.documentCustomFields[this.documentCustomFieldEditIndex].minCharLimit = 1;
		this.documentCustomFields[this.documentCustomFieldEditIndex].maxCharLimit = 100;
		this.documentCustomFields[this.documentCustomFieldEditIndex].restrictNumber = false;
		this.documentCustomFields[this.documentCustomFieldEditIndex].restrictSpecialChar = false;

		this.documentCustomFields[this.documentCustomFieldEditIndex].setMinValue = null;
		this.documentCustomFields[this.documentCustomFieldEditIndex].setMaxValue = null;
		this.documentCustomFields[this.documentCustomFieldEditIndex].decimalLimit = null;

		this.documentCustomFields[this.documentCustomFieldEditIndex].countryName = null;
		this.documentCustomFields[this.documentCustomFieldEditIndex].countryId = null;
		this.documentCustomFields[this.documentCustomFieldEditIndex].currencySymbol = null;

		this.documentCustomFields[this.documentCustomFieldEditIndex].datePickerValidationType = 'Any Date';
		this.documentCustomFields[this.documentCustomFieldEditIndex].dateRange = null;

		if (this.beforeEditCustomFieldData) {
			this.documentCustomFields[this.documentCustomFieldEditIndex] = this.beforeEditCustomFieldData;
		}
	}

	changeResult(count) {
		this.page = 1;
		this.limit = count;
	}

	onPageChangeEvent(data) {
		this.page = data;
	}

	uploadLabelTotleCount() {
		if (
			this.customFields[this.customFieldEditIndex].dataType == 'Radio select' ||
			this.customFields[this.customFieldEditIndex].dataType == 'Dropdown select'
		) {
			this.totalCount = this.customFields[this.customFieldEditIndex].options.length;
		}
	}

	uploadDocumentLabelTotleCount() {
		if (
			this.documentCustomFields[this.documentCustomFieldEditIndex].dataType == 'Radio select' ||
			this.documentCustomFields[this.documentCustomFieldEditIndex].dataType == 'Dropdown select'
		) {
			this.totalCount = this.documentCustomFields[this.documentCustomFieldEditIndex].options.length;
		}
	}

	showWhatsAppDefaultReplyPopUp() {
		if (this.ClientForm.controls['enableChatBot'].value == true) {
			$('#whatsappDefaultReplyPopUp').modal('show');
		} else {
			$('#whatsappDefaultReplyPopUp').modal('hide');
		}
	}

	cancelWhatsAppDefaultReplyPopUp(flag) {
		$('#whatsappDefaultReplyPopUp').modal('hide');
		if (flag) {
			this.ClientForm.controls['enableChatBot'].setValue(false);
		}
	}

	changeWhatsAppDefaultReplyToggleValueInGenralSetting() {
		//Need to Call API to Update the Value
		this.clientsService.changeToggleValue(this.ClientForm.controls['parentClientId'].value).subscribe((res: any) => {
			if (res.success) {
				this.toastr.success(res.message, this.appService.getTranslation('Utils.success'));
			}
			this.cancelWhatsAppDefaultReplyPopUp(false);
		});
	}
}
