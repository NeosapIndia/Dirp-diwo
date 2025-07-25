import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { routerTransition } from '../router.animations';
import { WhatsAppTemplateService } from './manage-whatsapp-template.service';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppService } from '../app.service';

declare var $: any;
@Component({
	selector: 'app-manage-whatsapp-template',
	templateUrl: './manage-whatsapp-template.component.html',
	styleUrls: ['./manage-whatsapp-template.component.scss'],
	animations: [routerTransition()],
})
export class ManageWhatsappTemplateComponent implements OnInit {
	private setting = {
		element: {
			dynamicDownload: null as HTMLElement,
		},
	};

	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;

	userClientId: any;
	userDetails: any;
	userRoleId: number;
	whatsAppTemplateData: any = [];
	whatsappStatus = [
		{ name: 'Pending' },
		{ name: 'Enabled' },
		{ name: 'Flagged' },
		{ name: 'Rejected' },
		{ name: 'Disabled' },
	];
	statusForm: FormGroup;
	selectedClient: any;
	editWhatsAppTemplateData: any;
	searchFilter: any;
	FilterWhatsappTemplateColumnForm: FormGroup;

	FilterColumnArray = [
		{ label: 'Drip Name', value: 'drip_title' },
		// { label: "Template Type", value: "temptype", },
		{ label: 'Media Type', value: 'mediatype' },
		{ label: 'Drip Id', value: 'dripId' },
		{ label: 'Template Id', value: 'templateId' },
		{ label: 'Status', value: 'templateStatus' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};
	filterColumn: any;
	payload: { searchKey: any; filterColumn: any };

	selectedDate: any;
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
	inputSearchTxt: any;
	prevSearchKey: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private spinnerService: NgxSpinnerService,
		private whatsAppTemplateService: WhatsAppTemplateService,
		private toastr: ToastrService,
		private router: Router,
		private fb: FormBuilder,
		public appService: AppService
	) {}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user || null;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.selectedClient = JSON.parse(localStorage.getItem('client')) || null;

		this.createStatusForm();
		this.createForm();
		this.FilterWhatsappTemplateColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchWhatsappTemplates'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterWhatsappTemplateColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			this.getWTByFilter(this.inputSearchTxt);
		} else {
			this.getAllWhatsAppTemplateData(this.page, this.limit);
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterWhatsappTemplateColumnForm = this.fb.group({
			FilterColumn: [null],
		});
	}

	getAllWhatsAppTemplateData(page, limit) {
		this.spinnerService.show();
		this.whatsAppTemplateService.getWhatsAppTemplate(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.whatsAppTemplateData = [];
				this.whatsAppTemplateData = res.data;
				this.totalCount = res.count;
			} else {
				this.toastr.error(res.error, 'Error');
			}
			this.isDataLoaded = true;
			this.isApiCall = false;
			this.spinnerService.hide();
		});
	}

	createStatusForm() {
		this.statusForm = this.fb.group({
			templateId: [null, [Validators.required]],
			templateStatus: [null, [Validators.required]],
		});
	}
	get f1() {
		return this.statusForm.controls;
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getWTByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getWTByFilter(this.inputSearchTxt);
		} else {
			this.getAllWhatsAppTemplateData(this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt !== undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getWTByFilter(this.inputSearchTxt);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getWTByFilter(this.inputSearchTxt);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getWTByFilter(this.inputSearchTxt);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getAllWhatsAppTemplateData(this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getAllWhatsAppTemplateData(this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getAllWhatsAppTemplateData(this.page, this.limit);
			}
		}
	}

	getWTByFilter(key) {
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

		if (this.FilterWhatsappTemplateColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterWhatsappTemplateColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}
		if (this.FilterWhatsappTemplateColumnForm.value.FilterColumn != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
			};
		} else {
			this.payload = {
				searchKey: key,
				filterColumn: [],
			};
		}
		localStorage.setItem('searchWhatsappTemplates', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getAllWhatsAppTemplateData(this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			// this.spinnerService.show();
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.whatsAppTemplateService.getSearchWhatsAppTemplate(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						if (res.success) {
							this.whatsAppTemplateData = res.data;
							this.totalCount = res.count;
							setTimeout(() => {
								this.spinnerService.hide();
							}, 300);
							this.isApiCall = false;
							this.isDataLoaded = true;
						} else {
							this.spinnerService.hide();
							this.isApiCall = false;
							this.isDataLoaded = true;
							this.toastr.error(res.error, 'Error');
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	onPrintTemplete(item) {
		if (item.whatsApp_template_data.templateStatus != 'Disabled') {
			if (!this.setting.element.dynamicDownload) {
				this.setting.element.dynamicDownload = document.createElement('a');
			}
			let value = this.createPrintWhastAppTemplate(item);

			const element = this.setting.element.dynamicDownload;
			// const fileType = arg.fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
			element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
			element.setAttribute('download', 'whatsApp_Template.txt');

			var event = new MouseEvent('click');
			element.dispatchEvent(event);
		}
	}

	createPrintWhastAppTemplate(template) {
		// Template Type
		let headerAssetURL;
		let templateType;
		let mediaType;
		if (
			template.whatsApp_template_data.header_type == 'Image' ||
			template.whatsApp_template_data.header_type == 'Video' ||
			template.whatsApp_template_data.header_type == 'Document'
		) {
			templateType = 'Media';
			mediaType = template.whatsApp_template_data.header_type;
			if (template.whatsApp_template_data.header_type == 'PDF') {
				mediaType = 'Document';
			}
		} else {
			templateType = 'Text';
		}

		if (template.whatsApp_template_data && template.whatsApp_template_data.Asset) {
			headerAssetURL =
				environment.imageHost + environment.imagePath + template.whatsApp_template_data.Asset.Asset_details[0].path;
		}

		// Botton
		let typeOfAction = `Visit Website`;
		let callToActionText = `${template.whatsApp_template_data.callToActionText}`;
		let buttonType = `Static`;
		let webSiteURL = `${template.whatsApp_template_data.hyper_link}`;

		// For WhatsApp ANtive Drip Only
		let quickReply1 = `${
			template.whatsApp_template_data && template.whatsApp_template_data.quickReply1
				? template.whatsApp_template_data.quickReply1
				: ''
		}`;
		let quickReply2 = `${
			template.whatsApp_template_data && template.whatsApp_template_data.quickReply2
				? template.whatsApp_template_data.quickReply2
				: ''
		}`;
		let quickReply3 = `${
			template.whatsApp_template_data && template.whatsApp_template_data.quickReply3
				? template.whatsApp_template_data.quickReply3
				: ''
		}`;

		//Header
		let header = `${template.whatsApp_template_data.header_text}`;

		//Footer
		let footer = `${template.whatsApp_template_data.footer}`;

		//Body
		let body = `${template.whatsApp_template_data.body}`;

		let print = ``;

		print = print + `Template Type:- `;
		print = print + `${templateType}\n\n`;

		if (templateType == 'Media') {
			print = print + `Media Type:- `;
			print = print + `${mediaType}\n\n`;
			if (headerAssetURL) {
				print = print + `Header Asset URL:-\n`;
				print = print + `${headerAssetURL}\n\n`;
			}
		} else if (templateType == 'Text') {
			print = print + `Header Text:-\n`;
			print = print + `${header != null && header != 'null' ? header : ''}\n\n`;
		}

		// print = print + `\n------------------------------------------------\n\n`;

		print = print + `Body:-\n`;
		print = print + `${body}\n\n`;
		// print = print + `\n------------------------------------------------\n\n`;

		if (footer) {
			print = print + `Footer:-\n`;
			print = print + `${footer}\n\n`;
		}
		// print = print + `\n------------------------------------------------\n\n`;

		if (template.drip_type == 'Only WhatsApp') {
			if (quickReply1) {
				print = print + `Quick Reply:-\n`;
				print = print + `1:-`;
				print = print + `${quickReply1}\n`;
			}
			if (quickReply2) {
				print = print + `2:-`;
				print = print + `${quickReply2}\n`;
			}
			if (quickReply3) {
				print = print + `3:-`;
				print = print + `${quickReply3}\n`;
			}
		} else if (template.drip_type == 'DripApp with sharing on WhatsApp') {
			print = print + `Button Type :- Call To Action\n\n`;
			print = print + `Type Of Action :- ${typeOfAction}\n\n`;
			print = print + `Button Text:- ${callToActionText}\n\n`;
			print = print + `Button Type:- ${buttonType}\n\n`;
			print = print + `Website URL:- ${webSiteURL}\n\n`;
		}

		return print;
	}

	onEditDrip(drip) {
		if (drip.whatsApp_template_data.templateStatus != 'Disabled') {
			let dripId = drip.id;
			this.router.navigate(['drips-library/add-or-edit-drip', { dripId: dripId }]);
		}
	}

	// onEditstatus(item) {
	//   if (item.whatsApp_template_data.templateStatus != "Disabled") {
	//     this.editWhatsAppTemplateData = item;
	//     this.statusForm.patchValue(item.whatsApp_template_data);
	//     $("#editStatusModal").modal('show');
	//   }
	// }

	cancel() {
		$('#editStatusModal').modal('hide');
		this.statusForm.reset();
	}

	onStatusFormSubmit() {
		if (!this.statusForm.valid) {
			return;
		}

		this.editWhatsAppTemplateData.whatsApp_template_data.templateId = this.statusForm.controls['templateId'].value;
		this.editWhatsAppTemplateData.whatsApp_template_data.templateStatus =
			this.statusForm.controls['templateStatus'].value;

		if (this.editWhatsAppTemplateData.whatsApp_template_data.templateStatus == 'Not Created') {
			return;
		}
		this.whatsAppTemplateService
			.updateWhatsAppTemplateStatus(this.editWhatsAppTemplateData.id, this.editWhatsAppTemplateData)
			.subscribe((res: any) => {
				if (res.success) {
					this.toastr.success('WhataApp Template Status Successfully Updated!', 'Success!');
					this.getAllWhatsAppTemplateData(this.page, this.limit);
					this.cancel();
				}
			});
	}
}
