import { Component, OnInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
// import { IMyDpOptions } from 'mydatepicker';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { routerTransition } from '../router.animations';
import * as moment from 'moment';
import { AppService } from '../app.service';
import { ManageDocumentLibraryService } from './manage-document-library.service';
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
declare var $: any;

@Component({
	selector: 'app-manage-document-library',
	templateUrl: './manage-document-library.component.html',
	styleUrls: ['./manage-document-library.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageDocumentLibraryComponent implements OnInit, AfterViewChecked {
	isSHowdiv: boolean = false;
	private setting = {
		element: {
			dynamicDownload: null as HTMLElement,
		},
	};
	assetBasePath = environment.imageHost + environment.imagePath;
	filedNameList = [{ name: 'Image' }, { name: 'Video' }, { name: 'PDF' }, { name: 'Link' }];
	numOfImgList = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];
	pageRequerdToggleFlag: false;
	// myDatePickerOptions: IMyDpOptions = {
	//     dateFormat: environment.dateFormat,
	// };
	alertOrPopup: boolean = false;
	restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Support Partner', 'Support Manager', 'Operations'];
	index: any;
	searchStr: any;
	assetForm: FormGroup;
	allAssetList: any = [];
	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;
	userClientId;
	asset_details = [];
	selectedDocumentIdFordelete;
	searchFilter: any;
	FilterAssetsColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Document Name', value: 'title' },
		{ label: 'Type', value: 'type' },
		{ label: 'Added By', value: 'first' },
		{ label: 'Document ID', value: 'id' },
	];

	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	selectedDate: { startDate: any; endDate: any };
	payload: { searchKey: any; filterColumn: any; selectedDate: any };

	ranges: any = {
		Today: [moment(), moment()],
		Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	};
	invalidDates: moment.Moment[] = [];

	rangeMarks = {
		0: '0',
		10: '10',
		20: '20',
		30: '30',
		40: '40',
		50: '50',
		60: '60',
		70: '70',
		80: '80',
		90: '90',
		100: '100',
	};

	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};

	showSelectAllOption: boolean = false;
	selectedDocumentsIds: any = [];
	selectAllFlag: boolean;

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	writePermission: any;
	assetindex: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		public appService: AppService,
		private manageDocumentService: ManageDocumentLibraryService,
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		let user_role = localStorage.getItem('role');
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		if (JSON.parse(localStorage.getItem('documentPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('documentPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.createForm();
		this.FilterAssetsColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchAssetsLibrary'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterAssetsColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getAssetsByFilter(this.inputSearchTxt);
		} else {
			this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
		}
		this.getAllClientList(this.userClientId);
		this.getRollPermission();
		localStorage.removeItem('documentPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [10],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	createForm() {
		this.FilterAssetsColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	getCampaignByFilter(event) {
		console.log(event);
	}

	changeClient(client) {
		this.selectedClient = client;
		this.selectedClientName = client.name;
		this.getAllAssetByBuyer(this.selectedClient.id, this.page, this.limit);
	}

	getAllClientList(userClientId) {
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let client of res.data) {
					this.clientListNames.push(client.name);
				}
				this.addClientList(res.data);
			}
			this.spinnerService.hide();
		});
	}

	addClientList(clientList) {
		this.clientList = [];
		let userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.clientList.push(userClient);
		for (let client of clientList) {
			this.clientList.push(client);
		}
		this.selectedClient = this.clientList[0];
		if (this.clientList && this.clientList.length > 0) {
			this.selectedClientName = this.clientList[0].name;
		}
		// this.getAllAssetByBuyer(this.selectedClient.id, this.page, this.limit);
	}

	changeAssetType(type) {
		this.asset_details = [];
		let payload = {
			path: '',
			fieldname: '',
			name: '',
			displayType: '',
			title: '',
		};
		if (type.name == 'Video') {
			payload.fieldname = 'Video';
			payload.displayType = 'Video';
			this.asset_details.push(payload);
		} else if (type.name == 'PDF') {
			payload.fieldname = 'Document';
			payload.displayType = 'PDF';
			this.asset_details.push(payload);
		} else if (type.name == 'Link') {
			payload.fieldname = 'Link';
			payload.displayType = 'Link';
			this.asset_details.push(payload);
		}
		this.assetForm.controls['image_count'].setValue(null);
	}

	cancel() {
		this.assetForm.reset();
		$('#assetForm1').modal('hide');
		this.assetForm.reset();
		this.asset_details = [];
	}

	cancelDeletePopUp() {
		$('#deleteDocumentModal').modal('hide');
		this.selectedDocumentIdFordelete = null;
	}

	getDate(date1): any {
		let date = new Date(date1);
		return {
			date: {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
			},
		};
	}

	getAllAssetByBuyer(clientId, page, limit) {
		this.spinnerService.show();
		this.manageDocumentService.getAllDocumentByClientId(clientId, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.allAssetList = [];
				this.allAssetList = res.data;
				this.totalCount = res.count;
			}

			this.isApiCall = false;
			this.isDataLoaded = true;
			setTimeout(() => {
				this.spinnerService.hide();
			}, 300);
		});
	}

	addAssets() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['document-library/add-or-edit-document']);
		}
	}

	editDocument(asset) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			let payload = {
				pageNo: this.page,
				isPageChange: false,
			};
			localStorage.setItem('documentPageNo', JSON.stringify(payload));
			let documentId = asset.id;
			this.router.navigate(['document-library/add-or-edit-document', { documentId: documentId }]);
		}
	}

	deleteDocument(item = null) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (item) {
				this.selectedDocumentsIds.push(item.id);
			}
			this.selectedDocumentIdFordelete = this.selectedDocumentsIds;
			$('#deleteDocumentModal').modal('show');
		}
	}

	uploadImage(event, index) {
		this.spinnerService.show();

		if (event.target.files[0].type.includes('image')) {
			this.assetForm.controls[`imgFile${index + 1}`].patchValue(event.target.files[0]);
			let assetUpload = this.assetForm.controls[`imgFile${index + 1}`].value;
			const uploadData = new FormData();
			uploadData.append('image', assetUpload);
			this.manageDocumentService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.asset_details[index].name = res.data.image[0].originalname;
					this.asset_details[index].path = res.data.image[0].filename;
					this.asset_details[index].size = (Math.round(res.data.image[0].size) / 1048576).toString() + 'MB';
				}
			});
		} else {
			$('#mediaWeb').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
			this.spinnerService.hide();
		}
	}

	uploadVideo(event, index) {
		this.spinnerService.show();

		if (event.target.files[0].type.includes('video')) {
			this.assetForm.controls['vdoFile'].patchValue(event.target.files[0]);
			let assetUpload = this.assetForm.controls['vdoFile'].value;
			const uploadData = new FormData();
			uploadData.append('video', assetUpload);
			this.manageDocumentService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.asset_details[index].name = res.data.video[0].originalname;
					this.asset_details[index].path = res.data.video[0].filename;
					this.asset_details[index].size = (Math.round(res.data.video[0].size) / 1048576).toString() + 'MB';
				}
			});
		} else {
			$('#mediaWeb').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
			this.spinnerService.hide();
		}
	}

	uploadDoc(event, index) {
		this.spinnerService.show();

		if (event.target.files[0].type.includes('application/pdf')) {
			this.assetForm.controls['pdfFile'].patchValue(event.target.files[0]);
			let assetUpload = this.assetForm.controls['pdfFile'].value;
			const uploadData = new FormData();
			uploadData.append('document', assetUpload);
			this.manageDocumentService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.asset_details[index].name = res.data.document[0].originalname;
					this.asset_details[index].path = res.data.document[0].filename;
					this.asset_details[index].size = Math.ceil(res.data.document[0].size / 1048576).toString() + 'MB';
				}
			});
		} else {
			$('#mediaWeb').val('');
			this.toastr.warning(
				this.appService.getTranslation('Utils.fileNotSupport'),
				this.appService.getTranslation('Utils.warning')
			);
			this.spinnerService.hide();
		}
	}

	ondeleteDocumentDetails(index) {
		$('#mediaWeb').val('');
		this.asset_details[index].name = '';
		this.asset_details[index].path = '';
		this.asset_details[index].size = 0;
	}

	changeNumberOfImage(number) {
		this.asset_details = [];
		for (let i = 1; i <= number.value; i++) {
			let payload = {
				path: '',
				fieldname: 'Image',
				name: '',
				displayType: 'Image',
				title: '',
			};
			this.asset_details.push(payload);
		}
	}

	//Download AWS S3
	onDownload(item) {
		//Show Toster Message
		this.toastr.success(
			this.appService.getTranslation('Utils.fileDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		//Get Pre SignURLS
		// console.log('-item-', item);
		let payload = { files: [] };
		payload.files.push(item.s3Path);
		this.manageDocumentService.getAllPreSignedUrlForDownload(payload).subscribe(async (res: any) => {
			if (res.success) {
				if (res && res.urls) {
					let files;

					for (let data of res.urls) {
						this.manageDocumentService.downloadAwsS3File(data.url).subscribe(
							(blob) => {
								const url = window.URL.createObjectURL(blob);
								const a = document.createElement('a');
								a.href = url;
								a.download = data.fileName; // replace with the desired file name
								a.click();
								window.URL.revokeObjectURL(url);
							},
							(error) => {
								console.error('Download failed', error);
							}
						);
					}
				}
			}
		});
	}

	createAssetLinkTemplate(template) {
		let webSiteURL = `${template.Asset_details[0].path}`;
		let print = ``;
		print = print + `Website URL:- ${webSiteURL}\n\n`;
		return print;
	}

	removeAsset() {
		this.spinnerService.show();
		this.manageDocumentService
			.deleteDocumentsByBuyer(this.selectedDocumentIdFordelete, this.selectedClient.id)
			.subscribe((res: any) => {
				if (res.success) {
					$('#deleteDocumentModal').modal('hide');
					this.selectedDocumentIdFordelete = null;
					this.spinnerService.hide();
					this.appService.checkNotifcation = true;
					this.toastr.success(
						this.appService.getTranslation('Pages.Document.Home.Toaster.documentDeleted'),
						this.appService.getTranslation('Utils.success')
					);
					this.selectedDocumentsIds = [];
					this.getAllAssetByBuyer(this.selectedClient.id, this.page, this.limit);
				}
			});
	}

	showasset(i) {
		this.isSHowdiv = true;
		this.assetindex = i;
	}

	hideAsset() {
		this.isSHowdiv = false;
		this.assetindex = -1;
	}

	addImageTitle(title) {}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getAssetsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getAssetsByFilter(this.inputSearchTxt);
		} else {
			this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getAssetsByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAssetsByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAssetsByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
			}
		}
	}

	getAssetsByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		let chars;

		if (key !== null && key !== undefined && key !== '') {
			if (this.isNumber(key)) {
				chars = 0;
			} else {
				chars = 2;
			}
		}

		if (this.FilterAssetsColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterAssetsColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterAssetsColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterAssetsColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterAssetsColumnForm.value.FilterColumn == null) {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: this.selectedDate,
			};
		} else {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: { startDate: null, endDate: null },
			};
		}
		localStorage.setItem('searchAssetsLibrary', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllAssetByBuyer(this.userClientId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}

		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.manageDocumentService.getFilteredDocuments(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.allAssetList = res.data;
							this.totalCount = res.count;
						} else {
							this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
						}
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
					},
					(error) => {
						this.spinnerService.hide();
					}
				);
			}, this.appService.timeout);
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allAssetList.forEach((element, index) => {
				if (!this.selectedDocumentsIds.includes(element.id)) this.selectedDocumentsIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allAssetList.forEach((element, index) => {
				this.selectedDocumentsIds.push(element.id);
				let indexof = this.selectedDocumentsIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedDocumentsIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedDocumentsIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedDocumentsIds.indexOf(item.id) > -1) {
			this.selectedDocumentsIds.splice(this.selectedDocumentsIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedDocumentsIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedDocumentsIds.length == this.allAssetList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedDocumentsIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getAssetsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getAssetsByFilter(this.inputSearchTxt);
		}
	}
}
