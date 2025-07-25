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
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ManageAgentsService } from './manage-agents.service';
declare var $: any;

@Component({
	selector: 'app-manage-agents',
	templateUrl: './manage-agents.component.html',
	styleUrls: ['./manage-agents.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManageAgentsComponent implements OnInit, AfterViewChecked {
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
	ETLConfigration: any[] = [];
	selectedClientName;
	selectedClient;
	userClientId;
	projectName;
	asset_details = [];
	selectedAssetIdFordelete;
	searchFilter: any;
	FilterAssetsColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Asset Name', value: 'title' },
		{ label: 'Type', value: 'type' },
		{ label: 'Owner', value: 'owner' },
		{ label: 'Added By', value: 'first' },
		{ label: 'Tags', value: 'tags' },
		{ label: 'Size', value: 'size' },
		{ label: 'Asset ID', value: 'id' },
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
	selectedAssetsIds: any = [];
	selectAllFlag: boolean;

	editETL: boolean = false;
	ETLConfigForm: FormGroup;
	clientListForForm: any[];
	pipelineType = [{ name: 'Text Embeddings Pipeline' }, { name: 'Multimodal Embedding Pipeline' }];
	EmbeddingProvider = [{ name: 'OpenAI' }];
	textEmeddingsPipelineOption = [
		{ name: 'Use LlamaParse' },
		{ name: 'Use Contextual Retrieval' },
		{ name: 'Use Hybrid Search' },
	];

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
		private manageAssetLibService: ManageAgentsService,
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		let user_role = localStorage.getItem('role');
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.projectName = localStorage.getItem('projectName');

		if (JSON.parse(localStorage.getItem('agentsPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('agentsPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		// let searchKeyData: any = JSON.parse(localStorage.getItem('searchAssetsLibrary'));
		// if (searchKeyData) {
		// 	this.inputSearchTxt = searchKeyData.searchKey;
		// 	this.FilterAssetsColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
		// 	if (searchKeyData.selectedDate.startDate != null) {
		// 		this.selectedDate = {
		// 			startDate: moment(searchKeyData.selectedDate.startDate),
		// 			endDate: moment(searchKeyData.selectedDate.endDate),
		// 		};
		// 	} else {
		// 		this.selectedDate = null;
		// 	}
		// 	this.getAssetsByFilter(this.inputSearchTxt);
		// }
		// else {
		this.getAllAgents(this.page, this.limit);
		// }
		// this.getAllClientList(this.userClientId);
		this.getRollPermission();
		localStorage.removeItem('agentsPageNo');
		this.getAppBranding();
		this.createETLConfigForm();

		if (this.projectName == 'drip') {
			this.getETLConfigration();
		}
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
		// this.getAllAgents(this.selectedClient.id, this.page, this.limit);
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

		this.manageAssetLibService.createUpdateETLCredential(this.ETLConfigForm.value).subscribe((res: any) => {
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

	ETLConfigurationPopUp() {
		this.editETL = false;
		this.getClientListOfWithoutETlConfi();
		this.ETLConfigForm.controls['ClientId'].enable();
		this.ETLConfigForm.reset();
		$('#addETLConfigModel').modal('show');
	}

	getClientListOfWithoutETlConfi() {
		this.manageAssetLibService.getClientListOfWithoutETlConfi(this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.clientListForForm = [];
				this.clientListForForm = res.data;
			}
		});
	}

	getETLConfigration() {
		this.manageAssetLibService.getAllETLChoice(this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.ETLConfigration = res.data;
				// console.log(res.data);
			}
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
		// this.getAllAgents(this.selectedClient.id, this.page, this.limit);
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
		$('#deleteAgentModal').modal('hide');
		this.selectedAssetIdFordelete = null;
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

	getAllAgents(page, limit) {
		this.spinnerService.show();
		this.manageAssetLibService.getAllAgents(page, limit).subscribe((res: any) => {
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

	addAgent() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['agents/add-or-edit-agents']);
		}
	}

	editAgent(agent) {
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
			localStorage.setItem('agentsPageNo', JSON.stringify(payload));
			let agentId = agent.Agent.id;
			this.router.navigate(['agents/add-or-edit-agents', { AgentId: agentId }]);
		}
	}

	deleteAgent() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.selectedAssetIdFordelete = this.selectedAssetsIds;
			$('#deleteAgentModal').modal('show');
		}
	}

	uploadImage(event, index) {
		this.spinnerService.show();

		if (event.target.files[0].type.includes('image')) {
			this.assetForm.controls[`imgFile${index + 1}`].patchValue(event.target.files[0]);
			let assetUpload = this.assetForm.controls[`imgFile${index + 1}`].value;
			const uploadData = new FormData();
			uploadData.append('image', assetUpload);
			this.manageAssetLibService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
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
			this.manageAssetLibService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
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
			this.manageAssetLibService.uploadAsset(uploadData, this.selectedClient.id).subscribe((res: any) => {
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

	ondeleteAgentDetails(index) {
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

	onDownload(asset) {
		if (asset && asset.field_name == 'Link') {
			this.setting.element.dynamicDownload = document.createElement('a');
			let value = this.createAssetLinkTemplate(asset);
			const element = this.setting.element.dynamicDownload;
			element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
			element.setAttribute('download', 'asset_link.txt');
			var event = new MouseEvent('click');
			element.dispatchEvent(event);
			this.toastr.success(
				this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'),
				this.appService.getTranslation('Utils.success')
			);
		} else {
			let payload = {
				path: asset.Asset_details[0].path,
			};
			this.manageAssetLibService
				.downloadAssetByAssetId(payload)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);
						link.download = `${asset.Asset_details[0].name}`;
						link.click();
						this.toastr.success(
							this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'),
							this.appService.getTranslation('Utils.success')
						);
					},
					(failed) => {
						console.log('Rejected', failed);
						this.spinnerService.hide();
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		}
	}

	createAssetLinkTemplate(template) {
		let webSiteURL = `${template.Asset_details[0].path}`;
		let print = ``;
		print = print + `Website URL:- ${webSiteURL}\n\n`;
		return print;
	}

	removeAgents() {
		this.spinnerService.show();
		this.manageAssetLibService.deleteAgents(this.selectedAssetIdFordelete).subscribe((res: any) => {
			if (res.success) {
				$('#deleteAgentModal').modal('hide');
				this.selectedAssetIdFordelete = null;
				this.spinnerService.hide();
				this.appService.checkNotifcation = true;
				this.toastr.success(
					this.appService.getTranslation('Pages.Agents.Home.Toaster.agentsdeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.selectedAssetsIds = [];
				this.getAllAgents(this.page, this.limit);
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
			// this.getAssetsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			// this.getAssetsByFilter(this.inputSearchTxt);
		} else {
			// this.getAllAgents(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				// this.getAssetsByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				// this.getAssetsByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				// this.getAssetsByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllAgents(this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllAgents(this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllAgents(this.page, this.limit);
			}
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allAssetList.forEach((element, index) => {
				if (!this.selectedAssetsIds.includes(element.id)) this.selectedAssetsIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allAssetList.forEach((element, index) => {
				this.selectedAssetsIds.push(element.id);
				let indexof = this.selectedAssetsIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedAssetsIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedAssetsIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedAssetsIds.indexOf(item.Agent.id) > -1) {
			this.selectedAssetsIds.splice(this.selectedAssetsIds.indexOf(item.Agent.id), 1);
			value = <any>document.getElementById('checkbox-' + item.Agent.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedAssetsIds.push(item.Agent.id);
			value = <any>document.getElementById('checkbox-' + item.Agent.id);
			value.checked = true;
		}
		if (this.selectedAssetsIds.length == this.allAssetList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedAssetsIds.forEach((element, index) => {
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
			// this.getAssetsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			// this.getAssetsByFilter(this.inputSearchTxt);
		}
	}
}
