import {
	Component,
	OnInit,
	AfterViewChecked,
	ChangeDetectorRef,
	AfterViewInit,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { routerTransition } from '../router.animations';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import * as moment from 'moment';
import { AppService } from '../app.service';
import { ManagePostsLibraryService } from './manage-posts-library.service';
import { ManageAssetsLibraryService } from '../manage-assets-library/manage-assets-library.service';
import { Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
declare var $: any;
import Hls from 'hls.js';

@Component({
	selector: 'app-manage-posts-library',
	templateUrl: './manage-posts-library.component.html',
	styleUrls: ['./manage-posts-library.component.scss'],
	animations: [routerTransition()],
	providers: [ConfirmationService],
})
export class ManagePostsLibraryComponent implements OnInit, AfterViewChecked {
	postForm: FormGroup;
	allPostList = [];
	clientListNames = [];
	clientList = [];
	selectedClientName;
	selectedClient;
	allAsset = [];
	allAssetsForPost = [];
	selectedAssetForThePost = [];
	postTypeList = [
		{ name: 'WhatsApp Native Post', type: 1 },
		{ name: 'WhatsApp with Non Native Post', type: 2 },
		{ name: 'Email with Non Native Post', type: 3 },
		{ name: 'Only DripApp Post', type: 4 },
	];
	image_asset_details: any[];
	selectedPostType: number;
	userClientId;
	editPostFlag: boolean = false;
	copyFlag: boolean = false;
	copyHyperLinkData;

	seletedDripIdForDelete;
	searchFilter: any;

	FilterDripsColumnForm: FormGroup;
	FilterColumnArray = [
		{ label: 'Drip Name', value: 'title' },
		{ label: 'Type', value: 'driptype' },
		{ label: 'Added By', value: 'first' },
		{ label: 'Drip Id', value: 'id' },
		{ label: 'Template Status', value: 'templatestatus' },
		{ label: 'Drip Status', value: 'drip_status' },
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
	selectedDripsIds: any = [];
	selectAllFlag: boolean;

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	inputSearchTxt: any;
	prevSearchKey: any;
	roleId: any;
	writePermission: any;
	notOwnDripByUser: any = [];
	dripUsedData: any[];
	userId: any;
	excelDripsUpload: any;
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
		private postService: ManagePostsLibraryService,
		private assetService: ManageAssetsLibraryService,
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		// setTimeout(() => {
		// 	const iframe = document.getElementById('videoFrame') as HTMLIFrameElement;
		// 	iframe.contentWindow?.postMessage({ action: 'track-time' }, '*');
		// 	window.addEventListener('message', (event) => {
		// 		console.log('Watched time:', event.data.watchedTime);
		// 	});
		// }, 1000);

		if (JSON.parse(localStorage.getItem('dripPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('dripPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}

		this.formClass();
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.createAssetArray();
		this.createForm();
		this.FilterDripsColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchDrips'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterDripsColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getPostsByFilter(this.inputSearchTxt);
		} else {
			this.getAllPostByClient(this.userClientId, this.page, this.limit);
		}
		this.getAllClientList(this.userClientId);
		this.getRollPermission();
		localStorage.removeItem('dripPageNo');
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
			menuId: [11],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	createForm() {
		this.FilterDripsColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	formClass() {
		this.postForm = this.formBuilder.group({
			id: null,
			post_title: ['', [Validators.required]],
			post_description: [''],
			tag_name: [null],
			post_type: ['', [Validators.required]],
			status: [null],
			post_sub_type: [null],
			postLink: [null],
			// Post Header
			header_type: [null],
			header_body: [null],
			header_footer: [null],
			header_text: [null],
			AssetId: [],
			header_id: [],
			Asset_details_sr_no: [null],

			//Only DripApp Post
			drip_native_title: [null],
			drip_native_description: [null],

			//Email
			email_post_subject: [null],
			email_post_body: [null],
		});
	}

	get f1() {
		return this.postForm.controls;
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

	cancel() {
		$('#postForm1').modal('hide');
		this.postForm.reset();
	}

	getAllAssetByType(clientId, type) {
		this.assetService.getAllAssetsByType(clientId, type).subscribe((res: any) => {
			if (res.success) {
				this.allAsset = [];
				this.allAsset = res.data;
			}
		});
	}

	getAllAssetByClient(clientId) {
		this.assetService.getAllAssetsByBuyerForPost(clientId).subscribe((res: any) => {
			if (res.success) {
				this.allAssetsForPost = [];
				this.allAssetsForPost = res.data;
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
		// this.getAllPostByClient(this.selectedClient.id, this.page, this.limit);
		this.getAllAssetByClient(this.selectedClient.id);
	}

	getAllClientList(userClientId) {
		//this.spinnerService.show();
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let client of res.data) {
					this.clientListNames.push(client.name);
				}
				this.addClientList(res.data);
			}
			//this.spinnerService.hide();
		});
	}

	changeBuyer(client) {
		this.selectedClient = client;
		this.selectedClientName = client.name;
		this.getAllPostByClient(this.selectedClient.id, this.page, this.limit);
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getPostsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getPostsByFilter(this.inputSearchTxt);
		} else {
			this.getAllPostByClient(this.userClientId, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getPostsByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getPostsByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getPostsByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllPostByClient(this.userClientId, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllPostByClient(this.userClientId, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllPostByClient(this.userClientId, this.page, this.limit);
			}
		}
	}

	getPostsByFilter(key) {
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

		if (this.FilterDripsColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterDripsColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterDripsColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterDripsColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterDripsColumnForm.value.FilterColumn == null) {
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
		localStorage.setItem('searchDrips', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllPostByClient(this.userClientId, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.postService.getDripBySearch(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.allPostList = [];
							this.totalCount = res.count;
							for (let drip of res.data) {
								let tem = drip;
								tem.templateStatus = '';
								if (drip && drip.Drip_whatsapp_non_natives && drip.Drip_whatsapp_non_natives.length > 0) {
									tem.templateStatus = drip.Drip_whatsapp_non_natives[0].templateStatus;
								}
								if (drip && drip.Drip_whatsapp_natives && drip.Drip_whatsapp_natives.length > 0) {
									tem.templateStatus = drip.Drip_whatsapp_natives[0].templateStatus;
								}
								if (tem.templateStatus == '') {
									tem.templateStatus = 'NA';
								}
								this.allPostList.push(tem);
							}
							// this.totalLearnerCount = res.count;
						} else {
							this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	addPostPopup() {
		this.editPostFlag = false;
		$('#postForm1').modal('show');
	}

	getAllPostByClient(clientId, page, limit) {
		this.spinnerService.show();
		this.postService.getAllPostsByClient(clientId, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.allPostList = [];
				for (let drip of res.data) {
					let tem = drip;
					tem.templateStatus = '';
					if (drip && drip.Drip_whatsapp_non_natives && drip.Drip_whatsapp_non_natives.length > 0) {
						tem.templateStatus = drip.Drip_whatsapp_non_natives[0].templateStatus;
					}
					if (drip && drip.Drip_whatsapp_natives && drip.Drip_whatsapp_natives.length > 0) {
						tem.templateStatus = drip.Drip_whatsapp_natives[0].templateStatus;
					}
					if (tem.templateStatus == '') {
						tem.templateStatus = 'NA';
					}
					this.allPostList.push(tem);
				}
				this.isDataLoaded = true;
				this.isApiCall = false;
				this.totalCount = res.count;
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
			} else {
				this.isDataLoaded = true;
				this.isApiCall = false;
				this.spinnerService.hide();
			}
		});
	}

	addDrips() {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.router.navigate(['drips-library/add-or-edit-drip']);
		}
	}

	editPost(drip) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (
				drip.drip_status !== 'Deleted' &&
				(drip.drip_status !== 'PFA' || drip.templateStatus == 'Not Created' || drip.templateStatus == 'Rejected')
			) {
				let payload = {
					dripIds: [drip.id],
				};
				this.postService.checkDripIsUsedOrNot(payload).subscribe((res: any) => {
					if (res.success) {
						if (res.data && res.data.length == 0) {
							let payload = {
								pageNo: this.page,
								isPageChange: false,
							};
							localStorage.setItem('dripPageNo', JSON.stringify(payload));
							let dripId = drip.id;
							this.router.navigate(['drips-library/add-or-edit-drip', { dripId: dripId, type: 'edit' }]);
						} else {
							$('#editDripModal').modal('show');
						}
					}
				});
			}
		}
	}

	cancelDripEditPopUp() {
		$('#editDripModal').modal('hide');
	}

	copyDrip(drip) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			if (drip.drip_status !== 'Deleted') {
				let dripId = drip.id;
				this.router.navigate([
					'drips-library/add-or-edit-drip',
					{ dripId: dripId, type: 'copy', copyClientId: drip.ClientId },
				]);
			}
		}
	}

	selectHeaderType() {
		let type = this.postForm.controls['header_type'].value;
		if (type != 'None' && type != 'Text') {
			this.getAllAssetByType(this.selectedClient.id, type);
		}
	}

	changeImageAsset() {
		this.image_asset_details = [];
		if (this.postForm.controls['AssetId'].value) {
			for (let asset_ of this.allAsset) {
				if (asset_.id == this.postForm.controls['AssetId'].value) {
					this.image_asset_details = asset_.Asset_details;
				}
			}
		}
	}

	createAssetArray() {
		this.selectedAssetForThePost = [];
		for (let i = 1; i <= 1; i++) {
			let payload = {
				AssetId: null,
				caption: '',
			};
			this.selectedAssetForThePost.push(payload);
		}
	}

	selectAssetForPost(asset, index) {
		this.selectedAssetForThePost[index].AssetId = asset.id;
	}

	selectPostType(type) {
		this.selectedPostType = type.type;
	}

	addMoreAsset() {
		if (this.selectedAssetForThePost.length < 5) {
			let payload = {
				AssetId: null,
				caption: '',
			};
			this.selectedAssetForThePost.push(payload);
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Utils.cantAddMore'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	removeAsset(index) {
		this.selectedAssetForThePost.splice(index, 1);
	}

	removePost(drip) {
		// if (drip.drip_status !== 'Deleted') {
		//     this.seletedDripIdForDelete = drip.id;
		//     $("#deleteDripModal").modal('show');
		// }
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.seletedDripIdForDelete = [];
			this.notOwnDripByUser = [];
			let record = this.allPostList.filter((obj1) => this.selectedDripsIds.find((obj2) => obj1.id === obj2));
			for (let data of record) {
				if (data.drip_status == 'Deleted') {
					// return false;
				} else {
					this.seletedDripIdForDelete.push(data.id);
					if (data.ClientId != this.userClientId) {
						this.notOwnDripByUser.push(data.id);
					}
					// console.log(data);
				}
			}
			if (this.seletedDripIdForDelete && this.seletedDripIdForDelete.length > 0) {
				let payload = {
					dripIds: this.seletedDripIdForDelete,
				};
				this.dripUsedData = [];
				this.postService.checkDripIsUsedOrNot(payload).subscribe((res: any) => {
					if (res.success) {
						// console.log('----', res.data);
						this.dripUsedData = res.data;
					}
				});
				$('#deleteDripModal').modal('show');
			}
		}
	}

	deleteDrip() {
		this.spinnerService.show();
		this.postService.deletePostsByClient(this.seletedDripIdForDelete, this.selectedClient.id).subscribe((res: any) => {
			if (res.success) {
				$('#deleteDripModal').modal('hide');
				this.spinnerService.hide();
				this.appService.checkNotifcation = true;
				if (this.notOwnDripByUser.length > 0) {
					this.toastr.warning(
						this.appService.getTranslation('Pages.Drips.Home.Toaster.dripNotOwnByUser'),
						this.appService.getTranslation('Utils.warning')
					);
				} else {
					this.toastr.success(
						this.appService.getTranslation('Pages.Drips.Home.Toaster.dripdeleted'),
						this.appService.getTranslation('Utils.success')
					);
				}

				this.getAllPostByClient(this.selectedClient.id, this.page, this.limit);
				this.selectedDripsIds = [];
			}
		});
	}

	cancelDripDeletePopUp() {
		this.seletedDripIdForDelete = null;
		$('#deleteDripModal').modal('hide');
	}

	copyText(drip) {
		if (drip.drip_status == 'Published') {
			this.copyHyperLinkData = drip.hyper_link;
			this.copyFlag = true;
			setTimeout(() => {
				let textBox = document.querySelector('#hyper_link') as HTMLInputElement;
				if (!textBox) return;
				textBox.select();
				document.execCommand('copy');
				this.copyFlag = false;
				this.toastr.success(
					this.appService.getTranslation('Pages.Drips.Home.Toaster.driplinkcopied'),
					this.appService.getTranslation('Utils.success')
				);
			}, 100);
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allPostList.forEach((element, index) => {
				if (!this.selectedDripsIds.includes(element.id)) this.selectedDripsIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allPostList.forEach((element, index) => {
				this.selectedDripsIds.push(element.id);
				let indexof = this.selectedDripsIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedDripsIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedDripsIds = [];
		}
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedDripsIds.indexOf(item.id) > -1) {
			this.selectedDripsIds.splice(this.selectedDripsIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedDripsIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedDripsIds.length == this.allPostList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	placeholder() {
		this.selectedDripsIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	uploadDripExcel(event) {
		if (!this.writePermission) {
			this.toastr.error(
				this.appService.getTranslation('Utils.unauthorised'),
				this.appService.getTranslation('Utils.error')
			);
		} else {
			this.excelDripsUpload = undefined;
			let file = event.target.files[0];
			if (file) {
				this.spinnerService.show();
				const uploadData = new FormData();
				uploadData.append('file', file);
				this.appService
					.uploadDripInBulk(uploadData, this.roleId, this.userId, this.userClientId)
					.toPromise()
					.then(
						(res: any) => {
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation('Pages.Drips.Home.Toaster.bulkdripcreated'),
								this.appService.getTranslation('Utils.success')
							);
							setTimeout(() => {
								this.appService.checkNotifcation = true;
							}, 5000);
						},
						(failed) => {
							this.toastr.error(
								this.appService.getTranslation('Utils.somthingwentwrong'),
								this.appService.getTranslation('Utils.error')
							);
							// console.log('Rejected', failed);
							this.spinnerService.hide();
						}
					)
					.catch((err) => {
						// console.log('Caught error', err);
						this.spinnerService.hide();
					});
			} else {
				this.toastr.error(this.appService.getTranslation('Utils.invalidfile'));
			}
		}
	}

	notPermission() {
		this.toastr.error(
			this.appService.getTranslation('Utils.unauthorised'),
			this.appService.getTranslation('Utils.error')
		);
	}

	goLogin() {
		this.postService.getLoginToGoogleApi().subscribe((res) => {
			// console.log(res);
		});
	}
	gmailLogin() {
		const USER_ID = JSON.stringify({ UserId: JSON.parse(localStorage.getItem('user')).user.id });
		const redirectUrl = environment.authRedirectUrl;
		const clientId = environment.googleClientId;
		// const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&state=%7B%22UserId%22%3A${USER_ID}%7D&response_type=code&client_id=300693115665-3ij3n2n2hsjg0hj67snpl9c884jjhpm2.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3587%2Fv1%2Fsession%2Foauth%2Fgoogle`;
		const url = ` https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&access_type=offline&redirect_uri=${redirectUrl}&client_id=${clientId}&state=${USER_ID}`;
		window.open(url, '_self');
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getPostsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getPostsByFilter(this.inputSearchTxt);
		}
	}
}
