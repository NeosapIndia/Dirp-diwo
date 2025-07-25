import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { AppService } from 'src/app/app.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ManageCustomTempService } from './manage-custom-temp.service';

declare var $: any;

@Component({
	selector: 'app-manage-custom-temp',
	templateUrl: './manage-custom-temp.component.html',
	styleUrls: ['./manage-custom-temp.component.scss'],
})
export class ManageCustomTempComponent implements OnInit {
	type = 'drip';
	template: any;
	templateName: any;
	customTempPlaceholderArray: { [key: string]: any } = [];
	keys: string[] = [];

	allCustomTemplateList: any[];
	isDataLoaded: boolean = false;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	editTemplateId = null;

	inputTypeList = [
		{ label: 'Text', value: 'text' },
		{ label: 'Text Area', value: 'textarea' },
	];

	@Input() ClientId: any;
	@Input() isEdit: boolean;
	selectedTempIds: any = [];
	selectAllFlag: boolean;
	showSelectAllOption: boolean;
	selectedTempFordelete: any;

	constructor(
		private ManageCustomTempService: ManageCustomTempService,
		private spinnerService: NgxSpinnerService,
		private confirmationService: ConfirmationService,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private router: Router,
		private route: ActivatedRoute
	) {}
	ngOnInit() {
		if (this.isEdit) {
			this.getCustomTemplateList(this.ClientId, this.page, this.limit);
		}
		// console.log('ClientId', this.ClientId);
		// console.log('isEdit', this.isEdit);
	}

	// readTemplate() {
	// 	this.customTempPlaceholderArray = [];
	// 	this.keys = [];
	// 	const regex = /{{(.*?)}}/g;
	// 	let match;

	// 	while ((match = regex.exec(this.template)) !== null) {
	// 		const key = match[1].trim();
	// 		if (!this.keys.includes(key)) {
	// 			this.keys.push(key);
	// 			// this.customTempPlaceholderArray.push({ [key]: '' });
	// 			// Regex to check if this specific placeholder is inside an img tag
	// 			// const srcRegex = /src\s*=\s*"([^"]*)"/g;
	// 			// const isSrcPresent = srcRegex.test(this.template); // Check if any img tag with src is present
	// 			const imgTagRegex = new RegExp(`<img[^>]*src=["'][^"']*["'][^>]*placeholder=["']{{${key}}}["']`, 'i');
	// 			const isSrc = imgTagRegex.test(this.template); // Check if the placeholder is in an img tag
	// 			console.log('--isSrc---', isSrc);
	// 			this.customTempPlaceholderArray.push({
	// 				templatePlaceholdeName: key,
	// 				paceholderHeaderName: null,
	// 				inputBoxPlaceholder: null,
	// 				inputType: null,
	// 				isSrc: isSrc,
	// 			});
	// 		}
	// 	}
	// 	console.log(this.customTempPlaceholderArray);
	// }

	readTemplate() {
		this.customTempPlaceholderArray = [];
		this.keys = [];
		const regex = /{{(.*?)}}/g;
		let match;

		const imgTagRegex = /<img[^>]*src=["'][^"']*["'][^>]*>/g;
		const imgMatches = this.template.match(imgTagRegex); // Find all <img src="..."> tags

		const anchorTagRegex = /<a[^>]*href=["'][^"']*["'][^>]*>[^<]*<\/a>/g;
		const anchorMatches = this.template.match(anchorTagRegex); // Find all <a href="...">{{LinkText}}</a> tags

		const iframeTagRegex = /<iframe[^>]*src=["'][^"']*["'][^>]*>/g; // Regex for <iframe> tags
		const iframeMatches = this.template.match(iframeTagRegex); // Find all <iframe src="..."> tags

		while ((match = regex.exec(this.template)) !== null) {
			const key = match[1].trim();
			if (!this.keys.includes(key)) {
				this.keys.push(key);

				let isSrc = false;
				if (imgMatches) {
					for (let i = 0; i < imgMatches.length; i++) {
						if (imgMatches[i].includes(key)) {
							isSrc = true;
							break;
						}
					}
				}

				// Check for <a href="...">{{LinkText}}</a> tag
				let isHref = false;
				if (anchorMatches) {
					for (let i = 0; i < anchorMatches.length; i++) {
						if (anchorMatches[i].includes(key)) {
							isHref = true;
							break;
						}
					}
				}

				// Check for <iframe src="..."> tag
				let isIframe = false;
				if (iframeMatches) {
					for (let i = 0; i < iframeMatches.length; i++) {
						if (iframeMatches[i].includes(key)) {
							isIframe = true;
							break;
						}
					}
				}

				this.customTempPlaceholderArray.push({
					templatePlaceholdeName: key,
					placeholderHeaderName: null,
					inputBoxPlaceholder: null,
					inputType: null,
					isImage: isSrc,
					isAnchorTag: isHref,
					isIframe: isIframe,
				});
			}
		}

		// console.log(this.customTempPlaceholderArray);
	}

	getCustomTemplateList(clientId, page, limit) {
		this.ManageCustomTempService.getCustomTemplateDetails(clientId, page, limit).subscribe((res: any) => {
			if (res.success) {
				this.allCustomTemplateList = [];
				for (let data of res.data) {
					this.allCustomTemplateList.push(data);
				}
				// console.log('-allCustomTemplateList-', this.allCustomTemplateList);
				this.totalCount = res.count;
				this.isDataLoaded = true;
			}
		});
	}

	AddTemplatePopUpModel() {
		this.customTempPlaceholderArray = [];
		this.keys = [];
		this.template = undefined;
		this.editTemplateId = null;
		$('#addTemplateModel').modal('show');
	}

	cancelTemplatePopUpModel() {
		this.customTempPlaceholderArray = [];
		this.keys = [];
		this.template = undefined;
		this.templateName = undefined;
		this.editTemplateId = null;
		$('#addTemplateModel').modal('hide');
	}

	editCustomTemplate(item) {
		this.editTemplateId = item.id;
		this.customTempPlaceholderArray = [];
		this.keys = [];
		this.template = undefined;
		this.templateName = undefined;

		this.template = item.template;
		this.templateName = item.templateName;
		for (let placeholder of item.templatePlaceholders) {
			this.customTempPlaceholderArray.push(placeholder);
		}

		const regex = /{{(.*?)}}/g;
		let match;
		while ((match = regex.exec(this.template)) !== null) {
			const key = match[1].trim();
			if (!this.keys.includes(key)) {
				this.keys.push(key);
			}
		}

		// console.log('--Edit Array-', this.customTempPlaceholderArray);
		$('#addTemplateModel').modal('show');
	}

	markFormAsTouched(form: NgForm) {
		Object.keys(form.controls).forEach((field) => {
			const control = form.controls[field];
			control.markAsTouched({ onlySelf: true });
		});
	}

	saveTemplate(form: NgForm) {
		if (this.customTempPlaceholderArray.length === 0) {
			// console.log('Please add at least one placeholder before saving.');
			return;
		}

		let payload = {
			template: this.template,
			templateName: this.templateName,
			templatePlaceholders: this.customTempPlaceholderArray,
		};

		if (form.invalid) {
			// console.log('Form is invalid');
			this.markFormAsTouched(form);
			return;
		} else {
			// console.log('Form Submitted!', form.value);
			if (this.editTemplateId == null) {
				this.ManageCustomTempService.saveCustomTemplate(payload, this.ClientId).subscribe((res: any) => {
					if (res.success) {
						this.toastr.success(
							this.appService.getTranslation('Pages.CustomTemplate.AddEdit.Toaster.createTemplate'),
							this.appService.getTranslation('Utils.success')
						);
						$('#addTemplateModel').modal('hide');
						this.getCustomTemplateList(this.ClientId, this.page, this.limit);
					}
				});
			} else {
				this.ManageCustomTempService.updateCustomTemplate(payload, this.editTemplateId).subscribe((res: any) => {
					if (res.success) {
						this.toastr.success(
							this.appService.getTranslation('Pages.CustomTemplate.AddEdit.Toaster.updateTemplate'),
							this.appService.getTranslation('Utils.success')
						);
						$('#addTemplateModel').modal('hide');
						this.getCustomTemplateList(this.ClientId, this.page, this.limit);
					}
				});
			}
		}

		return;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		this.getCustomTemplateList(this.ClientId, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getCustomTemplateList(this.ClientId, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getCustomTemplateList(this.ClientId, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getCustomTemplateList(this.ClientId, this.page, this.limit);
		}
	}

	placeholder() {
		this.selectedTempIds.forEach((element, index) => {
			if (document.getElementById('checkbox-' + element)) {
				let value = <any>document.getElementById('checkbox-' + element);
				value.checked = true;
			}
		});
	}

	onCheck(value, item, index) {
		this.showSelectAllOption = false;
		this.selectAllFlag = false;
		if (this.selectedTempIds.indexOf(item.id) > -1) {
			this.selectedTempIds.splice(this.selectedTempIds.indexOf(item.id), 1);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = false;
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = false;
		} else {
			this.selectedTempIds.push(item.id);
			value = <any>document.getElementById('checkbox-' + item.id);
			value.checked = true;
		}
		if (this.selectedTempIds.length == this.allCustomTemplateList.length) {
			let value_ = <any>document.getElementById('selectBoxId');
			value_.checked = true;
		}
	}

	selectDeselct(value) {
		if (value == true) {
			this.showSelectAllOption = true;
			this.allCustomTemplateList.forEach((element, index) => {
				if (!this.selectedTempIds.includes(element.id)) this.selectedTempIds.push(element.id);
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = true;
			});
		} else if (value == false) {
			this.showSelectAllOption = false;
			this.selectAllFlag = false;
			this.allCustomTemplateList.forEach((element, index) => {
				this.selectedTempIds.push(element.id);
				let indexof = this.selectedTempIds.indexOf(element.id);
				if (indexof > -1) {
					this.selectedTempIds.splice(indexof, 1);
				}
				let value = <any>document.getElementById('checkbox-' + element.id);
				value.checked = false;
			});
			this.selectedTempIds = [];
		}
	}

	deleteCustomTemplate() {
		this.selectedTempFordelete = this.selectedTempIds;
		$('#deleteTempModal').modal('show');
	}

	cancelDeletePopUp() {
		$('#deleteTempModal').modal('hide');
		this.selectedTempFordelete = null;
	}

	removeCustomTemplate() {
		this.spinnerService.show();
		this.ManageCustomTempService.deleteCustomTemplate(this.ClientId, this.selectedTempFordelete).subscribe(
			(res: any) => {
				if (res.success) {
					$('#deleteTempModal').modal('hide');
					this.selectedTempFordelete = null;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.DiwoCourses.Home.Toaster.coursesdeleted'),
						this.appService.getTranslation('Utils.success')
					);
					this.selectedTempIds = [];
					this.getCustomTemplateList(this.ClientId, this.page, this.limit);
				}
			}
		);
	}
}
