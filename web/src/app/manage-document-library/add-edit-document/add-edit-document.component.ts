import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageDocumentLibraryService } from '../manage-document-library.service';
import { map, switchMap } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from 'src/app/app.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Model, SurveyNG, StylesManager } from 'survey-angular';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-add-edit-document',
	templateUrl: './add-edit-document.component.html',
	styleUrls: ['./add-edit-document.component.css'],
})
export class AddEditDocumentComponent implements OnInit {
	showAssetAtATime = 4;
	showAssetLimit = 5;
	notOwnAnyAssetRoleId = [2, 3, 4, 5];
	clientList = [];
	assetBasePath = environment.imageHost + environment.imagePath;
	assetCategory = [{ name: 'Document' }, { name: 'Link' }];
	selectedDocumentCategory: string;
	selectedMediaAssetDetails: any = [];
	selectedClientId: any;
	AssetLinks: any = [];
	userId;
	linkDetails: any;
	updateDocuments: any;
	isEdit: boolean = false;
	private data: any;
	public uploadPercent;
	vimeoToken: any;
	vimeoDetails: any;
	notOwnClientDetails: boolean = false;
	FilterLearnerColumnForm: FormGroup;
	vimeoVideoId: any;
	isMultipleSelected: boolean = false;
	userClient;
	isAssetCategorySelected: boolean = false;
	imageSrc: any[] = [];
	ownerClient: { name: any; client_id: any };
	userRoleId: number;
	pageDetails: any;
	type = 'drip';
	iconObject = {
		add_icon_35: null,
		info_icon_20: null,
	};
	allLength: any;
	newUploadFile: boolean = false;
	surveyObject = {
		elements: [
			// {
			// 	name: 'FirstName',
			// 	title: 'Enter your first name',
			// 	type: 'text',
			// 	//   inputType: "text",
			// },
			// {
			// 	name: 'LastName',
			// 	title: 'Enter your last name',
			// 	type: 'text',
			// },
			// {
			// 	name: 'Email',
			// 	title: 'Enter your email address',
			// 	type: 'text',
			// 	//   inputType: "text",
			// },
			// {
			// 	name: 'Phone',
			// 	title: 'Enter your phone number',
			// 	type: 'text',
			// },
		],
	};
	surveyModel: Model;
	checkSurveyValidation = false;
	customField = [];
	piplineDetails;

	ETLConfigForm: FormGroup;
	llamaParseModeList = [{ name: 'Accurate Mode' }, { name: 'Premium Mode' }, { name: '3rd Party multi-modal model' }];

	constructor(
		private DocumentService: ManageDocumentLibraryService,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private route: ActivatedRoute,
		private toastr: ToastrService,
		public appService: AppService,
		public sanitizer: DomSanitizer,
		private formBuilder: FormBuilder
	) {}

	ngOnInit() {
		this.type = this.appService.type;
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.pageDetails = JSON.parse(localStorage.getItem('assetPageNo')) || null;
		this.updateDocuments = this.route.params['_value'];
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.getCustomField();
		this.createETLConfigForm();
		if (this.updateDocuments && this.updateDocuments.documentId) {
			this.isEdit = true;
			// this.getDocumentById(this.updateDocuments.documentId);
		} else {
			if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
				this.DocumentService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
					if (res.success) {
						this.selectedClientId = null;
						this.clientList = [];
						this.clientList = res.data;
						$('#selecteClientList').modal('show');
					}
				});
			}
		}
		this.addMoreLinks();
		this.getVimeoToken();
		this.getAppBranding();
	}

	createETLConfigForm() {
		this.ETLConfigForm = this.formBuilder.group({
			mode: [null],
			language: ['en'], //==== pending
			parsingInstruction: [null], // ? present
			skipDiagonalText: [false], // ?  Present
			invalidateCache: [false], // ? Present
			doNotCache: [false], // ?  Present
			doNotUnrollColumns: [false], // ?  Present
			pageSeparator: [null], // ? Present
			pagePrefix: [null], // ? Present
			pageSuffix: [null], // ? Present
			boundingBox: [null], // ? Present
			targetPages: [null], // ? Present
			takeScreenshot: [false], // ?  Present
			disableOcr: [false], // ?  Present
			isFormattingInstruction: [false], // ? Present
			annotateLinks: [false], // ?  Presnt
		});
	}

	get f6() {
		return this.ETLConfigForm.controls;
	}
	createFilterLearnerColumnForm() {
		this.FilterLearnerColumnForm = this.formBuilder.group({
			FilterColumn: [null],
		});
	}

	setCustiomFieldValidation(data, editFlag = false, customData = {}) {
		if (data.length > 0) {
			let customFields = [];

			for (let field of data) {
				let fieldObj = {
					name: field.label,
					title: field.label,
					isRequired: field.isRequired,
					requiredErrorText: field.label + ' is required',
				};

				if (editFlag && customData != null && customData != '' && field.label in customData) {
					fieldObj['defaultValue'] = customData[field.label];
				}
				if (field.isHide) {
					continue;
				}
				if (['Single-line text', 'Multi-line text'].indexOf(field.dataType) > -1) {
					// ------------------------------------------------Custom Type :- SINGLE LINE TEXT------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['inputType'] = 'text';

					if (field.maxCharLimit && field.maxCharLimit != '' && field.maxCharLimit != null) {
						fieldObj['maxLength'] = parseInt(field.maxCharLimit);
					}

					fieldObj['validators'] = [];

					if (field.minCharLimit && field.minCharLimit != '' && field.minCharLimit != null) {
						fieldObj['validators'].push({
							type: 'text',
							minLength: parseInt(field.minCharLimit),
						});
						// fieldObj['minLength'] = parseInt(field.minCharLimit);
					}

					if (field.restrictNumber && field.restrictSpecialChar) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^0-9!@#$%^&*(),.?":{}|<>]*$',
						});
					} else if (field.restrictNumber) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^0-9]*$',
						});
					} else if (field.restrictSpecialChar) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^!@#$%^&*(),.?":{}|<>]*$',
						});
					}

					if (field.dataType === 'Multi-line text') {
						// fieldObj['inputType'] = 'textarea';
						delete fieldObj['inputType'];
						fieldObj['type'] = 'comment';
						fieldObj['rows'] = 2;
						fieldObj['autoGrow'] = true;
						fieldObj['allowResize'] = false;
					}
				} else if (['Number', 'Percentage'].indexOf(field.dataType) > -1) {
					// ------------------------------------------------Custom Type :- NUMBER------------------------------------------------

					fieldObj['type'] = 'text';

					fieldObj['validators'] = [
						{
							type: 'numeric',
							minValue: field.setMinValue ? parseInt(field.setMinValue) : 0,
							maxValue: field.setMaxValue ? parseInt(field.setMaxValue) : 100,
						},
					];

					//Add Validation Decimal
					if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
						fieldObj['maskType'] = 'numeric';
						fieldObj['maskSettings'] = {
							precision: parseInt(field.decimalLimit),
						};
					}
				} else if (field.dataType === 'Percentage') {
					// ------------------------------------------------Custom Type :- PERCENTAGE------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['inputType'] = 'percentage';
					if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
						fieldObj['maskType'] = 'numeric';
						fieldObj['maskSettings'] = {
							precision: parseInt(field.decimalLimit),
						};
					}
				} else if (field.dataType === 'Currency') {
					// ------------------------------------------------Custom Type :- CURRENCY------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['maskType'] = 'currency';
					fieldObj['maskSettings'] = {
						prefix: field.currencySymbol ? field.currencySymbol : '$',
					};
				} else if (field.dataType === 'Date picker') {
					// ------------------------------------------------Custom Type :- DATE PICKER------------------------------------------------

					// datePickerCustomFieldValidationList = [
					// 	{ id: 1, value: 'Any Date' },
					// 	{ id: 2, value: 'Future Date Only' },
					// 	{ id: 3, value: 'Past Date Only' },
					// 	{ id: 4, value: 'Specific Date Range' },
					// ];
					// customFieldEditIndex = 0;

					// futureDateValidationList = [
					// 	{ id: 1, value: 'Any future date' },
					// 	{ id: 2, value: 'Any date after buffer time' },
					// 	{ id: 2, value: 'Any date in a rolling date range' },
					// ];

					if (field.datePickerValidationType == 'Any Date') {
						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
					} else if (field.datePickerValidationType == 'Future Date Only') {
						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';

						let today = moment();
						let maxDate = moment('9999-12-31');
						let maxDateCount = maxDate.diff(today, 'days');

						if (field.futureDateValidationType == 'Any future date') {
							fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
							fieldObj['minValueExpression'] = 'today(1)';
						} else if (field.futureDateValidationType == 'Any date after buffer time') {
							let minValuedate = moment().add(parseInt(field.dayCount), 'days');
							let minValueCount = minValuedate.diff(moment(), 'days');

							fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
							fieldObj['minValueExpression'] = `today(${minValueCount})`;
						} else if (field.futureDateValidationType == 'Any date in a rolling date range') {
							let maxValuedate = moment().add(parseInt(field.dayCount), 'days');
							let maxValueCount = maxValuedate.diff(moment(), 'days');

							fieldObj['maxValueExpression'] = `today(${maxValueCount})`;
							fieldObj['minValueExpression'] = `today(1)`;
						}
					} else if (field.datePickerValidationType == 'Past Date Only') {
						let today = moment();
						let minDate = moment('1800-01-1');
						let minDateCount = minDate.diff(today, 'days');

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
						fieldObj['minValueExpression'] = `today(${minDateCount})`;
						fieldObj['maxValueExpression'] = 'today()';
					} else if (field.datePickerValidationType == 'Specific Date Range') {
						let date = moment();
						let minDate = moment(field.startDate);
						let maxDate = moment(field.endDate);

						let minDateCount = minDate.diff(date, 'days');
						let maxDateCount = maxDate.diff(date, 'days');

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
						fieldObj['minValueExpression'] = `today(${minDateCount})`;
						fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
					}
				} else if (field.dataType === 'Radio select') {
					fieldObj['type'] = 'radiogroup';
					fieldObj['showNoneItem'] = false;
					fieldObj['showOtherItem'] = false;
					fieldObj['colCount'] = 1;
					fieldObj['choices'] = [];
					for (let option of field.options) {
						fieldObj['choices'].push(option.label);
					}
				} else if (field.dataType === 'Dropdown select') {
					fieldObj['type'] = 'dropdown';
					fieldObj['showNoneItem'] = false;
					fieldObj['showOtherItem'] = false;
					// fieldObj['colCount'] = 1;
					fieldObj['choices'] = [];
					for (let option of field.options) {
						if (!option.isHide) {
							fieldObj['choices'].push(option.label);
						}
					}
				}

				customFields.push(fieldObj);
			}
			// console.log('customData', customFields);

			this.surveyObject = {
				elements: customFields,
			};
			// console.log('------1------');
			setTimeout(() => {
				this.showCustomFields();
			}, 500);
		} else {
			this.surveyObject = {
				elements: [],
			};
			// console.log('------2------');

			setTimeout(() => {
				this.showCustomFields();
			}, 500);
		}
	}

	showCustomFields() {
		this.surveyModel = new Model(this.surveyObject);
		this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
		// console.log('-------------------showCustomFields-------------------------');
	}

	entryCustomField(survey = null, options = null) {
		if (this.checkSurveyValidation) {
			this.surveyModel.validatePage();
		}
	}

	clearSurveyForm() {
		this.surveyObject = {
			elements: [],
		};
		this.surveyModel = new Model(this.surveyObject);
		// this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		// this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}

	getCustomField(editFlag = false, customData = {}) {
		this.DocumentService.getCustomFieldByClientId(this.selectedClientId).subscribe((res: any) => {
			this.customField = res?.data?.customFieldData ? res?.data?.customFieldData : [];
			this.piplineDetails = res.data.forPipelinedetails;
			if (this.updateDocuments && this.updateDocuments.documentId) {
				this.isEdit = true;
				this.getDocumentById(this.updateDocuments.documentId);
			}
		});
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}
	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
	getDocumentById(assetId) {
		this.DocumentService.getDocumentById(assetId).subscribe((res: any) => {
			if (res.success) {
				if (res.data.type == 'Link') {
					this.selectedDocumentCategory = 'Link';
					let payload = {
						title: res.data.title,
						type: 'Link',
						path: res.data.path,
					};
					this.AssetLinks = [];
					this.AssetLinks.push(payload);
				} else {
					this.selectedDocumentCategory = 'Document';

					//Check Backend Params is Present or Not
					if (res?.data?.LlamaParams) {
						this.ETLConfigForm.patchValue(res.data.LlamaParams);
						if (res?.data?.LlamaParams?.premiumMode) {
							this.ETLConfigForm.controls['mode'].setValue('Premium Mode');
						} else if (res?.data?.LlamaParams?.useVendorMultimodalModel) {
							this.ETLConfigForm.controls['mode'].setValue('3rd Party multi-modal model');
						} else {
							this.ETLConfigForm.controls['mode'].setValue('Accurate Mode');
						}
					}

					let payload;

					payload = {
						title: res.data.title,
						type: res.data.type,
						path: res.data.path,
						advancedDocParsing: res.data.advancedDocParsing,
					};
					this.selectedMediaAssetDetails.push(payload);
				}

				if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
					this.DocumentService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((_res: any) => {
						if (_res.success) {
							this.selectedClientId = res.data.ClientId;
							this.selectedClientId = null;
							for (let client of _res.data) {
								if (client.id == res.data.ClientId) {
									this.ownerClient = { client_id: client.client_id, name: client.name };
								}
							}
						}
					});
				}
				// setTimeout(() => {
				this.setCustiomFieldValidation(this.customField, true, res.data.customFields);
				// }, 500);
			}
		});
	}
	changeAssetCategory(event) {
		this.isAssetCategorySelected = false;
		this.selectedDocumentCategory = event.name;
		if (this.selectedDocumentCategory == 'Link') {
			this.linkDetails = {
				title: null,
				description: null,
				type: 'Link',
				path: null,
			};
			this.setCustiomFieldValidation(this.customField);
		}
	}

	uploadMedia(event, assetType) {
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.selectedMediaAssetDetails = [];
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				// console.log('---media---', media);
				fileName = fileName
					.replace('.pdf', '')
					.replace('.png', '')
					.replace('.jpg', '')
					.replace('.mp4', '')
					.replace('.pptx', '')
					.replace('.docx', '');
				if (mediaType.includes('pdf')) {
					mediaType = 'PDF';
				} else if (mediaType.includes('image')) {
					mediaType = 'Image';
				} else if (mediaType.includes('video') && assetType == 'thumbnail') {
					mediaType = 'Video';
				} else if (mediaType.includes('presentation')) {
					mediaType = 'Presentation';
				} else if (mediaType.includes('document')) {
					mediaType = 'Document';
				}

				let payload = {
					title: fileName,
					description: '',
					type: mediaType,
					otherDetails: media,
					AssetTitleError: false,
					Preview: [],
					isTranscoding: false,
					advancedDocParsing: false,
				};
				// if (this.updateDocuments && this.updateDocuments.documentId) {
				// 	if (this.selectedMediaAssetDetails[0].type == 'Video') {
				// 		this.selectedMediaAssetDetails = [];
				// 	}
				// }

				const file = media;
				const reader = new FileReader();
				reader.onload = (e) => payload.Preview.push(reader.result);
				reader.readAsDataURL(file);

				// if (mediaType == 'Image' && media.size >= 2097152) {
				// 	this.toastr.error(
				// 		this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.maximage2MB'),
				// 		this.appService.getTranslation('Utils.error')
				// 	);
				// } else if (mediaType == 'PDF' && media.size >= 5242880) {
				// 	this.toastr.error(
				// 		this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.maximage5MB'),
				// 		this.appService.getTranslation('Utils.error')
				// 	);
				// } else if (mediaType == 'WhatsappVideo' && media.size >= 15938355.2) {
				// 	this.toastr.error(
				// 		this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maxvideo15.2MB'),
				// 		this.appService.getTranslation('Utils.error')
				// 	);
				// } else {
				// 	this.selectedMediaAssetDetails.push(payload);
				// }
				this.selectedMediaAssetDetails.push(payload);
				this.newUploadFile = true;
			}
			if (!this.isEdit) {
				this.setCustiomFieldValidation(this.customField);
			}
		}
	}

	addMoreLinks() {
		let flag = false;
		for (let item of this.AssetLinks) {
			if (item.title == '' || item.title == null) {
				flag = true;
				item.AssetTitleError = true;
			}
			if (item.path == '' || item.path == null) {
				flag = true;
				item.UploadLinkError = true;
			}
		}
		if (!flag) {
			let payload = {
				id: null,
				title: null,
				description: null,
				path: null,
				originalname: null,
				type: 'Link',
				AssetTitleError: false,
				UploadValidLinkError: false,
				UploadLinkError: false,
				selfHostedVideo: false,
			};
			this.AssetLinks.push(payload);
		}
	}

	removeAssetLinks(index) {
		this.AssetLinks.splice(index, 1);
	}

	getVimeoToken() {
		this.DocumentService.getvimeoToken(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.vimeoDetails = res.data;
			}
		});
	}

	checkMediaAssetTitle(index, char) {
		if (char.length == 0) {
			this.selectedMediaAssetDetails[index].AssetTitleError = true;
		} else {
			this.selectedMediaAssetDetails[index].AssetTitleError = false;
		}
	}

	checkLinkAssetTitle(index, char) {
		if (char.length == 0) {
			this.AssetLinks[index].AssetTitleError = true;
		} else {
			this.AssetLinks[index].AssetTitleError = false;
		}
	}

	checkUploadlink(index, char) {
		if (char.length == 0) {
			this.AssetLinks[index].UploadLinkError = true;
		} else {
			this.AssetLinks[index].UploadLinkError = false;
		}
		if (char.toLowerCase().indexOf('http') == 0) {
			this.AssetLinks[index].uploadValidLinkError = false;
		} else {
			this.AssetLinks[index].uploadValidLinkError = true;
		}

		if (this.AssetLinks[index].selfHostedVideo == true) {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);
			if (!char.match(youtubeRegEx)) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}
	}

	generateRandomString(length) {
		const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charset.length);
			result += charset[randomIndex];
		}
		return result;
	}

	async fileUploadonS3(file) {
		const parts = file.name.split('.');
		const extension = parts[parts.length - 1];
		let payload = {
			fileName: `${this.selectedClientId}_${this.generateRandomString(20)}_${Date.now()}.${extension}`,
			fileType: file.type,
		};
		// console.log('---------S3 Payload------', payload);
		this.DocumentService.getPreSignedUrl(payload).subscribe((res: any) => {
			if (res.success) {
				this.DocumentService.uploadFileToS3(res.presignedUrl, file).subscribe((res: any) => {
					// return payload.fileName;
				});
			}
		});
		return payload.fileName;
	}

	async saveDocument() {
		if (this.selectedDocumentCategory === undefined || this.selectedDocumentCategory === null) {
			this.isAssetCategorySelected = true;
			this.spinnerService.hide();
			return;
		}
		this.checkSurveyValidation = true;
		if (!this.surveyModel.validatePage()) {
			return;
		}
		this.checkSurveyValidation = false;
		if (this.selectedDocumentCategory == 'Document') {
			if (
				this.selectedMediaAssetDetails == null ||
				this.selectedMediaAssetDetails == undefined ||
				this.selectedMediaAssetDetails.length == 0
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadassests'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		if (this.selectedDocumentCategory == 'Document') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.title == '' || asset.title == null) {
					asset.AssetTitleError = true;
					return;
				}
			}
		}

		if (this.selectedDocumentCategory == 'Link') {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);

			for (let link of this.AssetLinks) {
				if (
					link.title == '' ||
					link.title == null ||
					link.path == '' ||
					link.path == null ||
					link.path.toLowerCase().indexOf('http') != 0 ||
					(link.selfHostedVideo == true && !link.path.match(youtubeRegEx))
				) {
					if (link.title == '' || link.title == null) {
						link.AssetTitleError = true;
					}
					if (link.path.toLowerCase().indexOf('http') != 0) {
						link.UploadValidLinkError = true;
					}
					if (link.path == '' || link.path == null) {
						link.UploadLinkError = true;
					}

					if (link.selfHostedVideo == true && !link.path.match(youtubeRegEx)) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
							this.appService.getTranslation('Utils.error')
						);
					}

					return;
				}
			}
		}

		if (this.selectedDocumentCategory == 'Document') {
			let index = 0;
			let errorFlag = false;
			this.spinnerService.show();
			for (let asset of this.selectedMediaAssetDetails) {
				// if (asset.type == 'Video') {
				const uploadData = new FormData();
				for (var key in asset) {
					if (key == 'otherDetails') {
						uploadData.append(asset.type, asset[key]);
					} else {
						if (key != 'Preview') {
							uploadData.append(key, asset[key]);
						}
					}
				}
				uploadData.append('ClientId', this.selectedClientId);
				uploadData.append('customFields', JSON.stringify(this.surveyModel.data));
				if (asset?.advancedDocParsing) {
					let payload = this.ETLConfigForm.value;
					if (payload.mode) {
						if (payload.mode == 'Accurate Mode') {
							delete payload.premiumMode;
							delete payload.useVendorMultimodalModel;
						} else if (payload.mode == 'Premium Mode') {
							payload.premiumMode = true;
							delete payload.useVendorMultimodalModel;
						} else if (payload.mode == '3rd Party multi-modal model') {
							payload.useVendorMultimodalModel = true;
							delete payload.premiumMode;
						}
					}

					delete payload.mode;

					if (!payload.parsingInstruction || payload.parsingInstruction == '') {
						delete payload.parsingInstruction;
					}
					if (!payload.targetPages || payload.targetPages == '') {
						delete payload.targetPages;
					}

					if (!payload.boundingBox || payload.boundingBox == '') {
						delete payload.boundingBox;
					}
					if (!payload.pageSeparator || payload.pageSeparator == '') {
						delete payload.pageSeparator;
					}
					if (!payload.pagePrefix || payload.pagePrefix == '') {
						delete payload.pagePrefix;
					}
					if (!payload.pageSuffix || payload.pageSuffix == '') {
						delete payload.pageSuffix;
					}
					uploadData.append('LlamaParams', JSON.stringify(payload));
				} else {
					uploadData.append('LlamaParams', '{}');
				}

				this.spinnerService.show();

				//Save in the S3 Drive
				//Get Drive Token Link
				if (this.newUploadFile) {
					let fileName = await this.fileUploadonS3(asset.otherDetails);
					uploadData.append('s3Path', fileName);
				}

				let count = 0;
				if (index == this.selectedMediaAssetDetails.length - 1) {
					count = this.selectedMediaAssetDetails.length;
				}
				if (!this.isEdit) {
					this.DocumentService.createDocument(uploadData, this.selectedClientId, count).subscribe((res: any) => {
						if (res.success) {
							if (count) {
								this.spinnerService.hide();
							}
							this.checkSurveyValidation = false;

							this.toastr.success(
								this.appService.getTranslation('Pages.Document.AddEdit.Toaster.documentscreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							errorFlag = true;
							this.spinnerService.hide();
						}
					});
				} else {
					this.DocumentService.updateDocument(uploadData, this.updateDocuments.documentId, count).subscribe(
						(res: any) => {
							if (res.success) {
								if (count) {
									this.spinnerService.hide();
								}
								this.checkSurveyValidation = false;

								this.toastr.success(
									this.appService.getTranslation('Pages.Document.AddEdit.Toaster.documentsupdated'),
									this.appService.getTranslation('Utils.success')
								);
							} else {
								errorFlag = true;
								this.spinnerService.hide();
							}
						}
					);
				}
				// }
				// else if (asset.type == 'Video') {
				// 	asset.data = null;
				// 	const options = {
				// 		token: this.vimeoDetails.vToken,
				// 		url: environment.VimeoUploadApi,
				// 		videoName: asset.title,
				// 		videoDescription: asset.description,
				// 	};
				// 	if (this.vimeoDetails == false) {
				// 		this.toastr.error(
				// 			this.appService.getTranslation('Utils.novimeocredentials'),
				// 			this.appService.getTranslation('Utils.error')
				// 		);
				// 		return;
				// 	}
				// 	this.spinnerService.show();
				// 	this.DocumentService.createVimeo(options, asset.otherDetails.size)
				// 		.pipe(
				// 			map((data) => (asset.data = data)),
				// 			switchMap(() => {
				// 				this.appService.checkNotifcation = true;
				// 				this.DocumentService.updateVimeoLink(asset.data.link);
				// 				if (asset.data.upload.size === asset.otherDetails.size) {
				// 					return this.DocumentService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
				// 				}
				// 			})
				// 		)
				// 		.subscribe(
				// 			(event) => {
				// 				if (event.type === HttpEventType.UploadProgress) {
				// 					this.uploadPercent = Math.round((100 * event.loaded) / event.total);
				// 				} else if (event instanceof HttpResponse) {
				// 					let vmoVideoId = this.getVimeoUserIdFromUrl(asset.data.uri);
				// 					asset.vimeoPath = asset.data.player_embed_url;
				// 					asset.vmoVideoId = vmoVideoId;
				// 					asset.size = asset.otherDetails.size;
				// 					const uploadData = new FormData();
				// 					for (var key in asset) {
				// 						if (key == 'otherDetails') {
				// 							if (asset.type != 'Video') {
				// 								uploadData.append(asset.type, asset[key]);
				// 							}
				// 						} else {
				// 							if (key != 'Preview') {
				// 								uploadData.append(key, asset[key]);
				// 							}
				// 						}
				// 					}

				// 					this.DocumentService.createAsset(uploadData, this.selectedClientId, 1).subscribe((res: any) => {
				// 						if (res.success) {
				// 							//Call Preset APi
				// 							const options = {
				// 								token: this.vimeoDetails.vToken,
				// 								url: environment.VimeoPresetApi,
				// 								presetId: this.vimeoDetails.presetId,
				// 								videoId: asset.vmoVideoId,
				// 							};
				// 							this.DocumentService.applyEmbedPreset(options).subscribe((res: any) => {
				// 								console.log('---Res---', res.data);
				// 							});
				// 							this.appService.checkNotifcation = true;
				// 							// this.spinnerService.hide();
				// 						} else {
				// 							errorFlag = true;
				// 							// this.spinnerService.hide();
				// 						}
				// 					});
				// 				}
				// 			},
				// 			(error) => {
				// 				console.log('Upload Error:', error);
				// 			},
				// 			() => {
				// 				console.log('Upload done');
				// 			}
				// 		);
				// }
				// else {
				// 	const uploadData = new FormData();
				// 	for (var key in asset) {
				// 		if (key == 'otherDetails') {
				// 			if (asset.type != 'Video') {
				// 				uploadData.append(asset.type, asset[key]);
				// 			}
				// 		} else {
				// 			if (key != 'Preview') {
				// 				uploadData.append(key, asset[key]);
				// 			}
				// 		}
				// 	}
				// 	this.spinnerService.show();

				// 	let count = 0;
				// 	if (index == this.selectedMediaAssetDetails.length - 1) {
				// 		count = this.selectedMediaAssetDetails.length;
				// 	}
				// 	this.DocumentService.createAsset(uploadData, this.selectedClientId, count).subscribe((res: any) => {
				// 		if (res.success) {
				// 			if (count) {
				// 				this.spinnerService.hide();
				// 			}
				// 		} else {
				// 			errorFlag = true;
				// 			this.spinnerService.hide();
				// 		}
				// 	});
				// }
				index++;
				// if (index >= this.selectedMediaAssetDetails.length) {
				// 	if (!errorFlag) {
				// 		this.spinnerService.hide();
				// 		this.appService.checkNotifcation = true;

				// 		if (asset.type == 'Video') {
				// 			this.toastr.success(
				// 				this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.videoassetscreated'),
				// 				this.appService.getTranslation('Utils.success')
				// 			);
				// 		} else {
				// 			this.toastr.success(
				// 				this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
				// 				this.appService.getTranslation('Utils.success')
				// 			);
				// 		}

				// 	}
				// }
			}
		} else if (this.selectedDocumentCategory == 'Link') {
			for (let asset of this.AssetLinks) {
				this.spinnerService.show();
				asset.ClientId = this.selectedClientId;
				asset.customFields = JSON.stringify(this.surveyModel.data);
				if (!this.isEdit) {
					this.DocumentService.createDocument(asset, this.selectedClientId, 1).subscribe((res: any) => {
						if (res.success) {
							this.checkSurveyValidation = false;
							this.toastr.success(
								this.appService.getTranslation('Pages.Document.AddEdit.Toaster.documentscreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.spinnerService.hide();
						}
					});
				} else {
					this.DocumentService.updateDocument(asset, this.updateDocuments.documentId, 1).subscribe((res: any) => {
						if (res.success) {
							this.checkSurveyValidation = false;
							this.toastr.success(
								this.appService.getTranslation('Pages.Document.AddEdit.Toaster.documentsupdated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.spinnerService.hide();
						}
					});
				}
			}
			this.appService.checkNotifcation = true;
			this.spinnerService.hide();
		}
		this.router.navigate(['document-library']);
	}

	getVimeoUserIdFromUrl(url) {
		const parts = url.split('/');
		return parts.at(-1);
	}

	updateAsset() {
		this.savePagination();
		if (this.selectedDocumentCategory == 'Document') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.title == '' || asset.title == null) {
					asset.AssetTitleError = true;
					return;
				}
			}
		}

		if (this.selectedDocumentCategory == 'Link') {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);

			for (let link of this.AssetLinks) {
				if (
					link.title == '' ||
					link.title == null ||
					link.path == '' ||
					link.path == null ||
					(link.selfHostedVideo == true && !link.path.match(youtubeRegEx))
				) {
					if (link.title == '' || link.title == null) {
						link.AssetTitleError = true;
					}
					if (link.path == '' || link.path == null) {
						link.UploadLinkError = true;
					}

					if (link.selfHostedVideo == true && !link.path.match(youtubeRegEx)) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
							this.appService.getTranslation('Utils.error')
						);
					}

					return;
				}
			}
		}

		this.spinnerService.show();
		if (this.selectedDocumentCategory == 'Document') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.type == 'Video') {
					this.spinnerService.show();
					if (asset && asset.otherDetails) {
						this.spinnerService.show();

						if (this.appService?.configurable_feature?.mediaCMS) {
							////////////////////////////////////////////////////////////////////////////////////////
							const uploadData = new FormData();
							for (var key in asset) {
								if (key == 'otherDetails') {
									uploadData.append(asset.type, asset[key]);
								} else {
									if (key != 'Preview') {
										uploadData.append(key, asset[key]);
									}
								}
							}

							this.DocumentService.canUploadVideoOnMediaCMS().subscribe((res: any) => {
								if (res.success) {
									if (res.canUpload) {
										this.DocumentService.uploadVideoOnMediaCMS(uploadData, this.selectedClientId).subscribe(
											(res: any) => {
												if (res) {
													asset.cmsVideoId = res.data.videoId;
													asset.size = res.data.size;

													const uploadData2 = new FormData();
													for (var key in asset) {
														if (key == 'otherDetails') {
															if (asset.type != 'Video') {
																uploadData2.append(asset.type, asset[key]);
															}
														} else {
															if (key != 'Preview') {
																uploadData2.append(key, asset[key]);
															}
														}
													}

													this.DocumentService.updateDocument(
														uploadData2,
														this.updateDocuments.documentId,
														this.selectedClientId
													).subscribe((res: any) => {
														if (res.success) {
															this.appService.checkNotifcation = true;
															if (asset.type == 'Video') {
																this.toastr.success(
																	this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.videoassetscreated'),
																	this.appService.getTranslation('Utils.success')
																);
															} else {
																this.toastr.success(
																	this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
																	this.appService.getTranslation('Utils.success')
																);
															}

															this.spinnerService.hide();
															setTimeout(() => {
																this.router.navigate(['document-library']);
															}, 100);
														} else {
															this.spinnerService.hide();
														}
													});

													this.spinnerService.hide();
												}
											}
										);
									} else {
										this.toastr.error(
											this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
											this.appService.getTranslation('Utils.error')
										);
									}
								} else {
									this.toastr.error(
										this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
										this.appService.getTranslation('Utils.error')
									);
								}
							});
						} else if (this.appService?.configurable_feature?.vimeo) {
							asset.data = null;
							const options = {
								token: this.vimeoDetails.vToken,
								url: environment.VimeoUploadApi,
								videoName: asset.title,
								videoDescription: asset.description,
							};
							if (this.vimeoDetails == false) {
								this.toastr.error(
									this.appService.getTranslation('Utils.novimeocredentials'),
									this.appService.getTranslation('Utils.error')
								);
								return;
							}

							this.DocumentService.createVimeo(options, asset.otherDetails.size)
								.pipe(
									map((data) => (asset.data = data)),
									switchMap(() => {
										this.DocumentService.updateVimeoLink(asset.data.link);
										if (asset.data.upload.size === asset.otherDetails.size) {
											return this.DocumentService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
										}
									})
								)
								.subscribe(
									(event) => {
										if (event.type === HttpEventType.UploadProgress) {
											this.uploadPercent = Math.round((100 * event.loaded) / event.total);
										} else if (event instanceof HttpResponse) {
											let vmoVideoId = this.getVimeoUserIdFromUrl(asset.data.uri);
											asset.vimeoPath = asset.data.player_embed_url;
											asset.vmoVideoId = vmoVideoId;
											asset.size = asset.otherDetails.size;
											const uploadData = new FormData();
											for (var key in asset) {
												if (key == 'otherDetails') {
													if (asset.type != 'Video') {
														uploadData.append(asset.type, asset[key]);
													}
												} else {
													if (key != 'Preview') {
														uploadData.append(key, asset[key]);
													}
												}
											}
											this.DocumentService.updateDocument(
												uploadData,
												this.updateDocuments.documentId,
												this.selectedClientId
											).subscribe((res: any) => {
												if (res.success) {
													this.appService.checkNotifcation = true;
													if (asset.type == 'Video') {
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.videoassetscreated'),
															this.appService.getTranslation('Utils.success')
														);
													} else {
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
															this.appService.getTranslation('Utils.success')
														);
													}

													this.spinnerService.hide();
													setTimeout(() => {
														this.router.navigate(['document-library']);
													}, 100);
												} else {
													this.spinnerService.hide();
												}
											});
										}
									},
									(error) => {
										console.log('Upload Error:', error);
									},
									() => {
										console.log('Upload done');
									}
								);
						}
					} else {
						const uploadData = new FormData();
						for (var key in asset) {
							if (key != 'otherDetails') {
								uploadData.append(key, asset[key]);
							}
						}
						this.DocumentService.updateDocument(
							uploadData,
							this.updateDocuments.documentId,
							this.selectedClientId
						).subscribe((res: any) => {
							if (res.success) {
								this.appService.checkNotifcation = true;
								this.toastr.success(
									this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
									this.appService.getTranslation('Utils.success')
								);
								this.spinnerService.hide();
								setTimeout(() => {
									this.router.navigate(['document-library']);
								}, 100);
							} else {
								this.spinnerService.hide();
							}
						});
					}
				} else {
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							if (asset.type != 'Video') {
								uploadData.append(asset.type, asset[key]);
							}
						} else {
							if (key != 'Preview') {
								uploadData.append(key, asset[key]);
							}
						}
					}
					this.DocumentService.updateDocument(
						uploadData,
						this.updateDocuments.documentId,
						this.selectedClientId
					).subscribe((res: any) => {
						if (res.success) {
							this.appService.checkNotifcation = true;
							this.toastr.success(
								this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
								this.appService.getTranslation('Utils.success')
							);
							this.spinnerService.hide();
							setTimeout(() => {
								this.router.navigate(['document-library']);
							}, 100);
						} else {
							this.spinnerService.hide();
						}
					});
				}
			}
		} else if (this.selectedDocumentCategory == 'Link') {
			for (let asset of this.AssetLinks) {
				this.DocumentService.updateDocument(asset, this.updateDocuments.documentId, this.selectedClientId).subscribe(
					(res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							this.appService.checkNotifcation = true;
							this.toastr.success(
								this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
								this.appService.getTranslation('Utils.success')
							);
							setTimeout(() => {
								this.router.navigate(['document-library']);
							}, 100);
						} else {
							this.spinnerService.hide();
						}
					}
				);
			}
		}
		// else {
		//   const uploadData = new FormData();
		//   for (var key in this.linkDetails) {
		//     uploadData.append(key, this.linkDetails[key]);
		//   }
		//   this.DocumentService.updateAsset(uploadData, this.updateDocuments.documentId).subscribe((res: any) => {
		//     if (res.success) {
		//       this.spinnerService.hide();
		//       this.toastr.success('Asset Successfully Updated!', "Success!");
		//       this.router.navigate(['document-library']);
		//     } else {
		//       this.spinnerService.hide();
		//     }
		//   })
		// }
	}

	removeAsset(index) {
		this.selectedMediaAssetDetails.splice(index, 1);
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails?.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('dcoumentPageNo', JSON.stringify(payload));
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['document-library']);
			}, 100);
		} else {
			this.router.navigate(['document-library']);
		}
	}

	pathExcel(event) {
		let file = event.target.files[0];
		if (file) {
			this.spinnerService.show();
			const uploadData = new FormData();
			uploadData.append('file', file);
			this.appService
				.uploadLinkAssetInBulk(uploadData, this.userId, this.selectedClientId)
				.toPromise()
				.then(
					(res: any) => {
						this.spinnerService.hide();
						this.toastr.success(
							this.appService.getTranslation('Pages.Assets.AddEdit.UploadYourLink.bulkcreatedlinkAsset'),
							this.appService.getTranslation('Utils.success')
						);
						// this.getClientAllLearner(this.userClientId, this.page, this.limit);
						this.router.navigate(['document-library']);
						setTimeout(() => {
							this.appService.checkNotifcation = true;
						}, 5000);
					},
					(failed) => {
						this.toastr.error(
							this.appService.getTranslation('Utils.somthingwentwrong'),
							this.appService.getTranslation('Utils.error')
						);
						console.log('Rejected', failed);
						this.spinnerService.hide();
						this.router.navigate(['document-library']);
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		} else {
			this.toastr.error(this.appService.getTranslation('Utils.invalidfile'));
		}
	}

	addAssetFile() {}

	selectClient() {
		if (this.selectedClientId) {
			$('#selecteClientList').modal('hide');
		}
	}
	selctedClient(event) {
		this.ownerClient = {
			name: event.name,
			client_id: event.client_id,
		};
		this.getVimeoToken();
	}

	showMore() {
		this.showAssetAtATime = this.showAssetAtATime + this.showAssetLimit;
	}

	cancelClientlistPopUp() {
		this.router.navigate(['document-library']);
	}
}
