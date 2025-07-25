import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { AppService } from 'src/app/app.service';
import { ManageAssetsLibraryService } from 'src/app/manage-assets-library/manage-assets-library.service';
import { ManagePostsLibraryService } from '../manage-posts-library.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';

declare var $: any;

@Component({
	selector: 'app-add-edit-post',
	templateUrl: './add-edit-post.component.html',
	styleUrls: ['./add-edit-post.component.css'],
})
export class AddEditPostComponent implements OnInit {
	haveTeamAccessToken: boolean = true;
	disableHyperLink = true;
	selectedTab = '';
	private setting = {
		element: {
			dynamicDownload: null as HTMLElement,
		},
	};
	public uploadPercent;
	ownerClient: { name: any; client_id: any };
	notOwnAnyAssetRoleId = [2, 3, 4, 5];
	waMediaType;
	assetTypeForLibaray;
	dripMediaType: any;
	assetBasePath = environment.imageHost + environment.imagePath;
	DripQuestions = [
		{
			question: null,
			characterRemainsForQuestion: null,
			characterRemainsForGeoTag: null,
			characterRemainsForMinLable: null,
			characterRemainsForMaxLable: null,
			AssetId: null,
			fileName: null,
			filePath: null,
			fileType: null,
			questionType: 'MCQ',
			selectAnswer: false,
			isTranscoding: false,
			selfHostedVideo: false,
			answerCount: 1,
			isQuestionSelected: false,
			isTextResponse: true,
			isFileSubmission: false,
			showTranscript: false,
			aiReview: false,
			expectedAnswer: null,
			cmsVideoId: null,
			allowFileTypes: null,
			numberOfFiles: 1,
			isAnswerSelected: false,
			surveyCharLimit: null,
			multipleOption: false,
			ratingScaleMinCount: 1,
			ratingScaleMaxCount: 2,
			isQuesRequired: true,
			UploadOnVimeo: true,
			zoomLinkTo: null,
			spinCatIndex: null,
			spinQueScore: 0,
			isSpinQueScore: false,
			ratingMinLabel: null,
			ratingMaxLabel: null,
			ratingType: 'Box',
			userRatingArray: [],
			DripOptions: [
				{
					text: null,
					AssetId: null,
					fileName: null,
					fileType: null,
					filePath: null,
					isCorrectAnswer: false,
					characterRemainsForOption: null,
					isOptionSelected: false,
					skipQueType: 'Continue to the next question',
				},
				{
					text: null,
					AssetId: null,
					fileName: null,
					fileType: null,
					filePath: null,
					isCorrectAnswer: false,
					characterRemainsForOption: null,
					isOptionSelected: false,
					skipQueType: 'Continue to the next question',
				},
			],
		},
	];

	quizTypeList = [
		{
			no: 1,
			type: 'MCQ',
		},
		{
			no: 2,
			type: 'Drag and Drop',
		},
	];

	offlineTaskTypeList = [
		{
			no: 1,
			type: 'Text and File Input',
		},
		{
			no: 2,
			type: 'Voice Input',
		},
	];

	fileTypes = [
		{ label: 'PDF', name: 'PDF' },
		// { label: 'Audio', name: 'Audio' },
		{ label: 'Video', name: 'Video' },
		{ label: 'Image', name: 'Image' },
	];

	numberOfFiles = [
		{ label: 1, name: 1 },
		{ label: 2, name: 2 },
		{ label: 3, name: 3 },
		{ label: 4, name: 4 },
		{ label: 5, name: 5 },
	];

	fileSize = [
		{ label: '1 MB', name: '1 MB' },
		{ label: '2 MB', name: '2 MB' },
		{ label: '5 MB', name: '5 MB' },
		{ label: '10 MB', name: '10 MB' },
	];

	survayTypeList = [
		{
			no: 1,
			type: 'Short answer',
		},
		{
			no: 2,
			type: 'Long answer',
		},
		{
			no: 3,
			type: 'MCQ',
		},
		{
			no: 4,
			type: 'Rating scale',
		},
		{
			no: 5,
			type: 'File upload',
		},

		{
			no: 6,
			type: 'Drop Down',
		},
		{
			no: 7,
			type: 'Date',
		},
		{
			no: 8,
			type: 'Date Time',
		},
		{
			no: 9,
			type: 'Mobile No',
		},
		{
			no: 10,
			type: 'Email',
		},
		{
			no: 11,
			type: 'Geo Tag',
		},
	];

	//check survey geo tag type selected or not
	survayTypeListWithoutGeoTag = [
		{
			no: 1,
			type: 'Short answer',
		},
		{
			no: 2,
			type: 'Long answer',
		},
		{
			no: 3,
			type: 'MCQ',
		},
		{
			no: 4,
			type: 'Rating scale',
		},
		{
			no: 5,
			type: 'File upload',
		},

		{
			no: 6,
			type: 'Drop Down',
		},
		{
			no: 7,
			type: 'Date',
		},
		{
			no: 8,
			type: 'Date Time',
		},
		{
			no: 9,
			type: 'Mobile No',
		},
		{
			no: 10,
			type: 'Email',
		},
	];

	zoomLinkToList = [{ type: 'Mobile Number', name: 'Mobile Number' }];

	zoomQuestionTypeList = [
		// {
		// 	no: 1,
		// 	type: 'First Name',
		// },
		// {
		// 	no: 2,
		// 	type: 'Last Name',
		// },
		// {
		// 	no: 3,
		// 	type: 'Email',
		// },
		{
			no: 4,
			type: 'Mobile No',
		},
	];
	caption: any;
	existingDripId: any;

	dripForm: any;
	whatsUpNativeForm: any;
	whatsUpNonNativeForm: any;
	emailNoneNativeForm: any;
	onlyEmailForm: any;
	dripNativeForm: any;
	dripOnlyTeamsForm: any;
	dripSharingOnTeamsForm: any;
	selectedAssetForTheDrip = [];
	selectedClient;
	allPostList = [];

	interactionType = [
		{ name: 'Call to Action', label: 'Visit Websites' },
		{ name: 'Quick Replies', label: 'Quick Replies' },
		{ name: 'Call Phone Number', label: 'Call Phone Number' },
	];
	callphoneTypeList = [
		{ name: 'Work', label: 'Work' },
		{ name: 'Home', label: 'Home' },
	];

	callToActionList = [
		{ name: 'Visit Websites', label: 'Visit Websites (Max - 2)' },
		{ name: 'Call Phone Number', label: 'Call Phone Number (Max - 1)' },
		{ name: 'Visit Zoom Meeting Link', label: 'Visit Zoom Meeting Link (Max-2)' },
	];

	callToActionListWithOutZoomMeeting = [
		{ name: 'Visit Websites', label: 'Visit Websites (Max - 2)' },
		{ name: 'Call Phone Number', label: 'Call Phone Number (Max - 1)' },
	];
	skipQuestionOptionList: any = [
		{ label: 'Continue to the next question', value: 'Continue to the next question' },
		{ label: 'Submit Form', value: 'Submit Form' },
	];

	selectedDripType: number;
	fileValue: any;
	allAssetsForDrip = [];
	allDripListForUseExisting = [];
	userClient: any;
	allAsset: any[];
	templateType = [
		{ name: 'Single Image', label: 'Single Image' },
		{ name: 'Carousel', label: 'Carousel' },
		{ name: 'Video', label: 'Video' },
		{ name: 'Poll', label: 'Poll' },
		{ name: 'Quiz', label: 'Quiz' },
		{ name: 'Offline Task', label: 'Offline Task' },
		{ name: 'Survey', label: 'Form' },
		// { name: 'Quiz (Randomised)', label: 'Quiz (Randomised)' },
		// { name: 'HTML', label: 'HTML' },
		{ name: 'Spin The Wheel', label: 'Spin The Wheel' },
	];

	templateTypeWithCustomTemplate = [
		{ name: 'Single Image', label: 'Single Image' },
		{ name: 'Carousel', label: 'Carousel' },
		{ name: 'Video', label: 'Video' },
		{ name: 'Poll', label: 'Poll' },
		{ name: 'Quiz', label: 'Quiz' },
		{ name: 'Offline Task', label: 'Offline Task' },
		{ name: 'Survey', label: 'Form' },
		// { name: 'Quiz (Randomised)', label: 'Quiz (Randomised)' },
		// { name: 'HTML', label: 'HTML' },
		{ name: 'Spin The Wheel', label: 'Spin The Wheel' },
		{ name: 'Custom Template', label: 'Custom Template' },
	];

	quizshowAnswerTime = [
		{
			label: 'Upon Submission',
			name: 'Upon Submission',
		},
		{
			label: 'After the Deadline',
			name: 'After the Deadline',
		},
	];

	pollResultChartType = [
		{
			label: 'Scale Chart',
			name: 'Scale Chart',
		},
		{
			label: 'Bar Chart',
			name: 'Bar Chart',
		},
		{
			label: 'Pie Chart',
			name: 'Pie Chart',
		},
	];

	surveyRatingType = [
		{
			label: 'Box',
			name: 'Box',
		},
		{
			label: 'Star',
			name: 'Star',
		},
		{
			label: 'Heart',
			name: 'Heart',
		},
		{
			label: 'Thumbs Up',
			name: 'Thumbs-Up',
		},
	];

	templateLanguageList = [{ name: 'English', key: 'en' }];
	templateCategory = [{ name: 'Utility' }, { name: 'Marketing' }, { name: 'Authentication' }];
	whatsAppHeaderAssetList = [];
	whatsAppHeaderAssetListByGoogleDrive = [];
	editDrip: any;
	templateAssetList = [];
	imgQuestionIndex: any;
	imgOptionIndex: any;
	imgIsquestion: any;
	selectedTemplateType: any;
	selectedExitingDrip: any;
	externalLinkFlag: boolean = false;
	externalLink;
	externalLinkLabel;
	selectedCreateDrip = 'Create New Drip';
	showUploadTab: boolean = true;
	showAssetTab = 1;
	showMobPreview = '';
	linkDetails = {
		title: null,
		tagName: null,
		description: null,
		type: 'Link',
		path: null,
	};
	maxLengthForQuestion = 25;
	maxLengthForOption = 25;
	maxLengthForBody = 1024;
	maxLengthForHeaderAndFooter = 60;
	maxLengthForQuickReplies = 25;
	maxLengthForCalltoAction = 25;
	maxLengthForCallPhoneNo = 20;
	maxLengthForCallPhoneText = 25;
	maxLengthForGeoTag = 25;
	maxLengthForMinMaxLabel = 24;
	whatsAppSetupData;
	showTemplateCategoryDD = false;
	haveWhatsAppSetup: boolean = false;
	showWhatsAppTemplatePublish: boolean = false;
	typeForSearch: any;
	allParamsData: any;
	dripTypeList: { name: string; type: number; label: any }[];
	dripTypeListWithoutTeams: { name: string; type: number; label: any }[];
	characterRemainsForBody: number;
	characterRemainsForHeader: number;
	characterRemainsForFooter: number;
	characterRemainsForCalltoAction: number;
	characterRemainsForCalltoAction2: number;
	characterRemainsForCalltoAction3: number;

	characterRemainsForZoomLink: number;
	characterRemainsForZoomLink2: number;

	characterRemainsForCalltoActionEmail: number;
	characterRemainsForCallPhoneText: number;
	characterRemainsForCallPhoneNo: number;
	characterRemainsForQuickReplies: number;
	characterRemainsForQuickReplies2: number;
	characterRemainsForQuickReplies3: number;
	characterRemainsForQuickReplies4: number;
	characterRemainsForQuickReplies5: number;
	characterRemainsForQuickReplies6: number;
	characterRemainsForQuickReplies7: number;
	characterRemainsForQuickReplies8: number;
	characterRemainsForQuickReplies9: number;
	characterRemainsForQuickReplies10: number;
	characterRemainsForGeoTag: number;
	characterRemainsForMinLable: number;
	characterRemainsForMaxLable: number;
	vimeoDetails: any;
	selectedClientId: any;
	clientList: any[];
	userRoleId: number;
	scrollList: HTMLElement | any;
	pageDetails: any;
	selectAssetForTaskBrief: boolean = false;
	selectedAssetForOfflineTaskBrief: any = [];
	forBriefPreview: any = false;
	apiLoaded: boolean = false;
	quickReplyIndex = 0;
	callToActionIndex = 0;
	callToPhoneIndex = 0;
	zoomMeetingIndex = 0;
	selectedCTALinkIndex = 1;

	showQuickReplyTab: boolean = true;
	showCallToActionTab: boolean = false;

	showVisitWebsiteTab: boolean = false;
	showCallPhoneTab: boolean = false;
	totalInteractionCount = 0;
	showInteraction: boolean = false;
	selectedInteractionArrayData = [];
	finalInteractionSquList: any = [];
	interactionSeqNoList = [];
	showTypeOfAction: boolean = false;
	combineActionIndex = 0;
	quickReplyFirst: boolean = true;
	hideBackBtnToggle: boolean = false;
	defaultbackval: any;
	appBranding: any;
	temp: any;
	type = 'drip';
	quickReplyIndexArrays = [];
	callToactionArrays = [];
	zoomMeetingArrays = [];
	personalizationList = [
		'{{First Name}}',
		'{{Last Name}}',
		'{{Country}}',
		'{{State}}',
		'{{City}}',
		'{{Job Role}}',
		'{{Tag 1}} to {{Tag 20}}',
	];

	personalizationMessage = `Personalize messages using dynamic variables: {{personalizationTag}}. Example: Start with 'Hello {{First Name}},' for customized greetings. Ensure variables are enclosed correctly.`;
	requiredRegistrationZoomMeeting = [];
	notRequiredRegistrationZoomMeeting = [];
	zoomMeetingList = [];
	checkZoomMeeting = false;
	showZoomMeetingLoader: boolean = false;

	onlyTeamMsgTypeList = [
		{ name: 'Send Message', label: 'Send Message' },
		{ name: 'Send Card', label: 'Send Card' },
	];
	selectedInteractionCTTeamsArrayData: any = [];
	isGeoTagSelected: boolean = false;
	formattedText: any;
	externalLinkCount = 1;
	allDyanamicPages = [];
	dynamicImgSrcValues: any = [];
	dynamicVideoSrcValues: any = [];
	selectDyanamicAssetId: any;
	useSendGrid: boolean = true;
	brodSideEmailImgSrcValues: any[] = [];
	brodSideEmailImgFilePaths: any = [];
	UserId: any;
	brodSideAssetUpload: any;
	brodSideSendingEMailType: any;
	isImageInEmailTemplate: boolean = false;
	brodSideEmailAttachments: any = [];
	allowFileFormat: string;
	teamOneDriveDocumentFilesList = [];
	oneDriveDocumentFiles = [];
	teamOneDriveVideoFilesList = [];
	oneDriveVideoFiles = [];
	onedrivefilefetch: boolean = false;

	//spin the wheel
	spinWheelQueCategory: any[] = [];
	maxLengthForCatQue = 15;
	isZeroSpinQuesCategory: boolean = false;
	spinCatCountGreaterThanWheelCount: boolean = false;
	noOfTimeSpinWheelError: boolean = false;
	addMinTwoSpinCategory: boolean = false;
	allCustomTemplateList: any[];
	customTempPlaceholderArray: any = [];
	selectCustomTemplateAssetId: any;
	customTemplate: any;
	selectedCustomTemplateMediaType: any;
	pwaHeaderCaptionRequired: boolean = false;
	captionImageRequired: boolean = false;

	iconObject = {
		info_icon_1_6_rem: null,
		info_icon_25: null,
		add_icon: null,
		add_icon_30: null,
		logout_icon: null,
		sync: null,
		vimeo_hosted_video_icon: null,
		link_self_hosted_video_icon: null,
		pdf_thumbnail: null,
		cloud_thumbnail: null,
		link_icon: null,
		search_loader: null,
		location_preview: null,
		heart_preview: null,
		thumb_preview: null,
		start_preview: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		private route: ActivatedRoute,
		public appService: AppService,
		private dripService: ManagePostsLibraryService,
		private router: Router,
		private assetService: ManageAssetsLibraryService,
		public sanitizer: DomSanitizer,
		private elementRef: ElementRef
	) {
		this.dripTypeList = [
			{
				name: 'Only WhatsApp',
				type: 1,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp'),
			},
			{
				name: 'DripApp with sharing on WhatsApp',
				type: 2,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp'),
			},
			{
				name: 'Only Email',
				type: 7,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail'),
			},
			{
				name: 'DripApp with sharing on Email',
				type: 3,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail'),
			},
			{
				name: 'Only DripApp',
				type: 4,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp'),
			},
			{
				name: 'Only Teams',
				type: 5,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyTeams'),
			},
			{
				name: 'DripApp with sharing on Teams',
				type: 6,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonTeams'),
			},
		];

		this.dripTypeListWithoutTeams = [
			{
				name: 'Only WhatsApp',
				type: 1,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp'),
			},
			{
				name: 'DripApp with sharing on WhatsApp',
				type: 2,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp'),
			},
			{
				name: 'Only Email',
				type: 7,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail'),
			},
			{
				name: 'DripApp with sharing on Email',
				type: 3,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail'),
			},
			{
				name: 'Only DripApp',
				type: 4,
				label: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp'),
			},
		];
		///////////////////////////////////////////////////////////////////////////////////////////
		//Remove Team and Whats App Type Drip From the Drip Types Array
		if (!this.appService?.configurable_feature?.teams) {
			[6, 5].forEach((index) => this.dripTypeList.splice(index, 1));
		}
		if (!this.appService?.configurable_feature?.whatsApp) {
			[1, 0].forEach((index) => this.dripTypeList.splice(index, 1));
			[1, 0].forEach((index) => this.dripTypeListWithoutTeams.splice(index, 1));
		}
		///////////////////////////////////////////////////////////////////////////////////////////
	}

	ngOnInit() {
		this.type = this.appService.type;
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.UserId = JSON.parse(localStorage.getItem('user')).user.id;
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;

		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.editDrip = this.route.params['_value'];
		this.pageDetails = JSON.parse(localStorage.getItem('dripPageNo')) || null;

		//Set useSendGrid Value
		if (this.userClient) {
			this.useSendGrid = this.userClient.useSendGrid != undefined ? this.userClient.useSendGrid : true;
		}
		console.log('--this.useSendGrid--', this.useSendGrid);

		this.createDripForm();
		this.createWhatsUpNativeForm();
		this.createWhatsUpNonNativeForm();
		this.createOnlyEmailForm();
		this.createEmailNonNativeForm();
		this.createDripNativeForm();
		this.createdripOnlyTeamsForm();
		this.createdripSharingOnTeamsForm();

		this.getCustomFields();
		if (this.editDrip && this.editDrip.dripId) {
			this.getDripDetailsByDripId(this.editDrip.dripId);
		} else if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
			this.dripService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.selectedClientId = null;
					this.clientList = [];
					this.clientList = res.data;
					this.selectedClient = this.selectedClientId;
					$('#selecteClientList').modal('show');
				}
			});
		} else {
			this.addOneSpinQuestionCategory();
		}
		this.allParamsData = this.route.params['_value'];
		if (this.allParamsData) {
			this.dripForm.controls['drip_type'].patchValue(this.allParamsData.type);
			if (this.allParamsData.type == 'Only WhatsApp') {
				this.selectedDripType = 1;
			} else if (this.allParamsData.type == 'DripApp with sharing on WhatsApp') {
				this.selectedDripType = 2;
			} else if (this.allParamsData.type == 'DripApp with sharing on Email') {
				this.selectedDripType = 3;
			} else if (this.allParamsData.type == 'Only DripApp') {
				this.selectedDripType = 4;
			} else if (this.allParamsData.type == 'Only Teams') {
				this.selectedDripType = 5;
			} else if (this.allParamsData.type == 'DripApp with sharing on Teams') {
				this.selectedDripType = 6;
			}
		}
		this.whatsUpNativeForm.controls['hyper_link'].disable();
		this.whatsUpNativeForm.controls['hyper_link2'].disable();

		this.whatsUpNonNativeForm.controls['hyper_link'].disable();
		this.emailNoneNativeForm.controls['hyper_link'].disable();
		this.dripSharingOnTeamsForm.controls['hyper_link'].disable();

		this.getvimeoToken();
		if (!this.apiLoaded) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.body.appendChild(tag);
			this.apiLoaded = true;
		}

		this.appBranding = JSON.parse(localStorage.getItem('app_branding'));
		this.hideBackBtnToggle = this.appBranding && this.appBranding.hideBackBtnToggle;
		this.defaultbackval = this.appBranding.defaultbackval;

		if (this.appBranding && !this.hideBackBtnToggle) {
			if (this.defaultbackval == 'Show buttons') {
				this.dripForm.controls['showBackButton'].patchValue(true);
			} else if (this.defaultbackval == 'Do not show button') {
				this.dripForm.controls['showBackButton'].patchValue(false);
			}
		} else if (this.appBranding && this.hideBackBtnToggle) {
			this.dripForm.controls['showBackButton'].patchValue(false);
		}
		this.getZoomMeetingLinks();
		this.getWhatsAppSetup();
		this.getCustomTemplatesByClientId();
		this.addOneDyanamicPage();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getCustomFields() {
		this.dripService.getCustomFieldsByClientId(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				// this.customFields = res.data;
				if (res.data && res.data.length > 0) {
					for (let customField of res.data) {
						if (!customField.isHide) {
							this.personalizationList.push(`{{${customField.label}}}`);
						}
					}
				}
				this.personalizationMessage = this.personalizationMessage.replace(
					'{{personalizationTag}}',
					this.personalizationList.join(', ')
				);
			}
		});
	}

	getvimeoToken() {
		this.dripService.getvimeoToken(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.vimeoDetails = res.data;
			}
		});
	}

	getZoomMeetingLinks() {
		this.dripService.getZoomMeetingsByClientId(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.zoomMeetingList = res.data.meetings;
				if (this.editDrip && this.editDrip.dripId && this.zoomMeetingList.length > 0) {
					this.checkZoomMeetings();
				}
			}
		});
	}

	checkCharacterLimitForBody(val) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}
		this.characterRemainsForBody = this.maxLengthForBody - len;
		let output;
		setTimeout(() => {
			output = this.boldWordsBetweenAsterisks(val);
			const contentDiv = document.getElementById('body-bold-preview-content');
			if (contentDiv) {
				contentDiv.innerHTML = output;
			}
		}, 300);
	}

	checkCharacterLimitForHeader(val) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}
		this.characterRemainsForHeader = this.maxLengthForHeaderAndFooter - len;
	}

	checkCharacterLimitForFooter(val) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}
		this.characterRemainsForFooter = this.maxLengthForHeaderAndFooter - len;
	}

	checkCharacterLimitForGeoTag(questionIndex) {
		if (questionIndex != null) {
			//for question
			this.DripQuestions[questionIndex].characterRemainsForGeoTag =
				this.maxLengthForGeoTag - this.DripQuestions[questionIndex].question.length;
		}
	}

	checkCharacterLimitForMin(questionIndex) {
		if (questionIndex != null) {
			this.DripQuestions[questionIndex].characterRemainsForMinLable =
				this.maxLengthForMinMaxLabel - this.DripQuestions[questionIndex].ratingMinLabel.length;
		}
	}

	checkCharacterLimitForMax(questionIndex) {
		if (questionIndex != null) {
			this.DripQuestions[questionIndex].characterRemainsForMaxLable =
				this.maxLengthForMinMaxLabel - this.DripQuestions[questionIndex].ratingMaxLabel.length;
		}
	}

	charLimitForQuickRepliesOnlyWApp(val, type) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}
		if (type == 'quickReply1') {
			this.characterRemainsForQuickReplies = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply2') {
			this.characterRemainsForQuickReplies2 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply3') {
			this.characterRemainsForQuickReplies3 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply4') {
			this.characterRemainsForQuickReplies4 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply5') {
			this.characterRemainsForQuickReplies5 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply6') {
			this.characterRemainsForQuickReplies6 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply7') {
			this.characterRemainsForQuickReplies7 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply8') {
			this.characterRemainsForQuickReplies8 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply9') {
			this.characterRemainsForQuickReplies9 = this.maxLengthForQuickReplies - len;
		} else if (type == 'quickReply10') {
			this.characterRemainsForQuickReplies10 = this.maxLengthForQuickReplies - len;
		}
	}

	charLimitForCalltoAction(val, type) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}

		if (type == 'callToActionText') {
			this.characterRemainsForCalltoAction = this.maxLengthForCalltoAction - len;
		} else if (type == 'callToActionText1') {
			this.characterRemainsForCalltoAction = this.maxLengthForCalltoAction - len;
		} else if (type == 'callToActionText2') {
			this.characterRemainsForCalltoAction2 = this.maxLengthForCalltoAction - len;
		} else if (type == 'callToActionText3') {
			this.characterRemainsForCalltoAction3 = this.maxLengthForCalltoAction - len;
		} else if (type == 'callToActionTextEmail') {
			this.characterRemainsForCalltoActionEmail = this.maxLengthForCalltoAction - len;
		} else if (type == 'callToActionTextWithWApp') {
			this.characterRemainsForCalltoAction = this.maxLengthForCalltoAction - len;
		} else if (type == 'zoomMeetLink') {
			this.characterRemainsForZoomLink = this.maxLengthForCalltoAction - len;
		} else if (type == 'zoomMeetLink2') {
			this.characterRemainsForZoomLink2 = this.maxLengthForCalltoAction - len;
		}
	}

	checkCharLimitForCallPhone(val, type) {
		let len;
		if (val != null) {
			len = val.length;
		} else {
			len = 0;
		}

		if (type == 'callphonetext') {
			this.characterRemainsForCallPhoneText = this.maxLengthForCallPhoneText - len;
		} else if (type == 'callphoneno') {
			this.characterRemainsForCallPhoneNo = this.maxLengthForCallPhoneNo - len;
		}
	}

	// checkcharacterlimitForQuestion(questionIndex, optionIndex) {
	//     if (questionIndex != null && optionIndex != null) {
	//         this.DripQuestions[questionIndex].DripOptions[
	//             optionIndex
	//         ].characterRemainsForOption =
	//             this.maxLengthForOption -
	//             this.DripQuestions[questionIndex].DripOptions[optionIndex].text
	//                 .length;
	//         //for option
	//     } else if (questionIndex != null) {
	//         //for question
	//         this.DripQuestions[questionIndex].characterRemainsForQuestion =
	//             this.maxLengthForQuestion -
	//             this.DripQuestions[questionIndex].question.length;
	//     }
	// }

	getWhatsAppSetup() {
		this.dripService.getWhatsAppSetupByClientId(this.selectedClientId).subscribe((res: any) => {
			if (res.success && res.data) {
				this.whatsAppSetupData = res.data;
				this.haveWhatsAppSetup = true;
				if (res && res.haveTeamAccessToken && res.haveTeamAccessToken.id) {
					this.haveTeamAccessToken = true;
					this.dripSharingOnTeamsForm.controls['TeamSetupId'].setValue(res.haveTeamAccessToken.id);
					this.dripOnlyTeamsForm.controls['TeamSetupId'].setValue(res.haveTeamAccessToken.id);
				} else {
					this.haveTeamAccessToken = false;
				}
				if (this.whatsAppSetupData.canSelectTempType) {
					this.showTemplateCategoryDD = true;
				} else {
					this.showTemplateCategoryDD = false;
				}
			}
		});
	}

	selectShowMobPreview(val) {
		this.showMobPreview = val;
		this.selectedTab = val;
		if (val == 'drip') {
			if (this.whatsUpNonNativeForm.controls['caption'].value && this.selectedDripType == 2) {
				this.captionTextOrLink(this.whatsUpNonNativeForm.controls['caption'].value, 'post_description-2');
			} else if (this.emailNoneNativeForm.controls['caption'].value && this.selectedDripType == 3) {
				this.captionTextOrLink(this.emailNoneNativeForm.controls['caption'].value, 'post_description-3');
			}
			if (this.dripNativeForm.controls['caption'].value && this.selectedDripType == 4) {
				this.captionTextOrLink(this.dripNativeForm.controls['caption'].value, 'post_description-4');
			} else if (this.dripSharingOnTeamsForm.controls['caption'].value && this.selectedDripType == 6) {
				this.captionTextOrLink(this.dripSharingOnTeamsForm.controls['caption'].value, 'post_description-6');
			}
		}
	}

	getDripDetailsByDripId(dripId) {
		this.dripService.getDripByDripId(dripId).subscribe((res: any) => {
			if (res.success) {
				this.selectedClientId = res.data.ClientId;
				this.dripForm.patchValue(res.data);
				if (res.data?.externalLink10) {
					this.externalLinkCount = 10;
				} else if (res.data?.externalLink9) {
					this.externalLinkCount = 9;
				} else if (res.data?.externalLink8) {
					this.externalLinkCount = 8;
				} else if (res.data?.externalLink7) {
					this.externalLinkCount = 7;
				} else if (res.data?.externalLink6) {
					this.externalLinkCount = 6;
				} else if (res.data?.externalLink5) {
					this.externalLinkCount = 5;
				} else if (res.data?.externalLink4) {
					this.externalLinkCount = 4;
				} else if (res.data?.externalLink3) {
					this.externalLinkCount = 3;
				} else if (res.data?.externalLink2) {
					this.externalLinkCount = 2;
				} else if (res.data?.externalLink1) {
					this.externalLinkCount = 1;
				}

				if (res.data?.custTempPlaceholders && res.data.custTempPlaceholders.length > 0) {
					this.customTempPlaceholderArray = [];
					for (let item of res.data.custTempPlaceholders) {
						this.customTempPlaceholderArray.push(item);
					}
				}

				if (res.data?.customTemplate) {
					this.customTemplate = res.data.customTemplate;
				}

				this.getAllAssetByClient(this.selectedClientId);

				if (res.data.DripQuestions && res.data.DripQuestions.length > 0) {
					this.DripQuestions = [];
					for (let question of res.data.DripQuestions) {
						let que = {
							question: null,
							characterRemainsForQuestion: null,
							characterRemainsForGeoTag: null,
							characterRemainsForMinLable: null,
							characterRemainsForMaxLable: null,
							AssetId: null,
							fileName: null,
							fileType: null,
							filePath: null,
							questionType: null,
							selectAnswer: false,
							answerCount: 1,
							DripOptions: [],
							isTranscoding: false,
							isQuestionSelected: false,
							isTextResponse: true,
							isFileSubmission: false,
							showTranscript: false,
							aiReview: false,
							expectedAnswer: null,

							allowFileTypes: null,
							numberOfFiles: 1,
							isAnswerSelected: false,
							surveyCharLimit: null,
							multipleOption: false,
							ratingScaleMinCount: 1,
							ratingScaleMaxCount: 2,
							selfHostedVideo: false,
							isQuesRequired: true,
							UploadOnVimeo: true,
							zoomLinkTo: null,
							spinCatIndex: null,
							spinQueScore: 0,
							isSpinQueScore: false,
							ratingMinLabel: null,
							ratingMaxLabel: null,
							ratingType: 'Box',
							userRatingArray: [],
							cmsVideoId: null,
						};
						que.question = question.question;
						que.characterRemainsForQuestion =
							this.maxLengthForQuestion - question && question.question ? question.question.length : 0;
						que.characterRemainsForGeoTag =
							this.maxLengthForGeoTag - question && question.question ? question.question.length : 0;
						que.AssetId = question.AssetId;
						que.fileName =
							question && question.Asset && question.Asset.Asset_details[0].name
								? question.Asset.Asset_details[0].name
								: null;
						que.fileType =
							question && question.Asset && question.Asset.Asset_details[0].fieldname
								? question.Asset.Asset_details[0].fieldname
								: null;
						que.filePath =
							question && question.Asset && question.Asset.Asset_details[0].path
								? question.Asset.Asset_details[0].path
								: null;
						que.isTranscoding =
							question && question.Asset && question.Asset.Asset_details[0].isTranscoding
								? question.Asset.Asset_details[0].isTranscoding
								: false;
						que.selfHostedVideo =
							question && question.Asset && question.Asset.Asset_details[0].selfHostedVideo
								? question.Asset.Asset_details[0].selfHostedVideo
								: false;
						(que.cmsVideoId =
							question && question.Asset && question.Asset.Asset_details[0].cmsVideoId
								? question.Asset.Asset_details[0].cmsVideoId
								: null),
							(que.questionType = question.questionType);
						que.selectAnswer = false;
						que.answerCount = question.answerCount;
						que.isTextResponse = question && question.isTextResponse ? question.isTextResponse : false;
						que.isFileSubmission = question && question.isFileSubmission ? question.isFileSubmission : false;
						que.showTranscript = question && question.showTranscript ? question.showTranscript : false;
						que.aiReview = question && question.aiReview ? question.aiReview : false;
						que.expectedAnswer = question && question.expectedAnswer ? question.expectedAnswer : false;

						que.allowFileTypes = question.allowFileTypes;
						que.numberOfFiles = question && question.numberOfFiles ? question.numberOfFiles : 1;
						que.surveyCharLimit = question && question.surveyCharLimit ? question.surveyCharLimit : null;
						que.multipleOption = question && question.multipleOption ? question.multipleOption : false;
						que.ratingScaleMinCount = question && question.ratingScaleMinCount;
						que.ratingScaleMaxCount = question && question.ratingScaleMaxCount;
						que.isQuesRequired = question && question.isQuesRequired;
						que.UploadOnVimeo = question && question.UploadOnVimeo;
						que.spinCatIndex = question && question.spinCatIndex;
						que.spinQueScore = question && question.spinQueScore;
						que.zoomLinkTo = question && question.zoomLinkTo;
						que.ratingMinLabel = question && question.ratingMinLabel ? question && question.ratingMinLabel : null;
						que.ratingMaxLabel = question && question.ratingMaxLabel ? question && question.ratingMaxLabel : null;
						que.ratingType = question && question.ratingType ? question && question.ratingType : 'Box';

						if (question.questionType === 'Rating scale') {
							que.userRatingArray = question.userRatingArray || [];
							for (let i = 1; i <= question.ratingScaleMaxCount; i++) {
								que.userRatingArray.push(i);
							}
						}

						for (let option of question.DripOptions) {
							let option_ = {
								text: null,
								filePath: null,
								fileName: null,
								fileType: null,
								AssetId: null,
								isCorrectAnswer: false,
								characterRemainsForOption: null,
								skipQueType: null,
								cmsVideoId: null,
							};
							option_.text = option.text;
							option_.characterRemainsForOption =
								this.maxLengthForOption - option && option.text ? option.text.length : 0;
							option_.filePath =
								option && option.Asset && option.Asset.Asset_details[0].path
									? option.Asset.Asset_details[0].path
									: null;
							option_.fileName =
								option && option.Asset && option.Asset.Asset_details[0].name
									? option.Asset.Asset_details[0].name
									: null;
							option_.fileType =
								option && option.Asset && option.Asset.Asset_details[0].fieldname
									? option.Asset.Asset_details[0].fieldname
									: null;
							option_.cmsVideoId =
								option && option.Asset && option.Asset.Asset_details[0].cmsVideoId
									? option.Asset.Asset_details[0].cmsVideoId
									: null;
							option_.AssetId = option.AssetId;
							option_.isCorrectAnswer = option.isCorrectAnswer;
							option_.skipQueType = option.skipQueType;
							que.DripOptions.push(option_);
						}

						this.DripQuestions.push(que);
						console.log('-this.DripQuestions-', this.DripQuestions);

						//check survey geo tag type selected or not
						if (que && que.questionType == 'Geo Tag') {
							this.isGeoTagSelected = true;
						} else {
							this.isGeoTagSelected = false;
						}
					}
				}

				//common for all drip
				if (
					res.data.htmlstring &&
					res.data.htmlstring !== 'null' &&
					res.data.htmlstring !== '' &&
					res.data.htmlstring !== undefined
				) {
					this.allDyanamicPages = [];
					this.allDyanamicPages = JSON.parse(res.data.htmlstring);
				}

				if (res.data.drip_type == 'Only WhatsApp') {
					this.whatsUpNativeForm.patchValue(res.data.Drip_whatsapp_natives[0]);
					if (res.data.Drip_whatsapp_natives[0].cta_sequence != null) {
						this.finalInteractionSquList = JSON.parse(res.data.Drip_whatsapp_natives[0].cta_sequence);
					}

					this.checkCharacterLimitForBody(res.data.Drip_whatsapp_natives[0].body);
					this.checkCharacterLimitForHeader(res.data.Drip_whatsapp_natives[0].header_text);
					this.checkCharacterLimitForFooter(res.data.Drip_whatsapp_natives[0].footer);

					this.charLimitForCalltoAction(res.data.Drip_whatsapp_natives[0].callToActionText, 'callToActionText');
					this.charLimitForCalltoAction(res.data.Drip_whatsapp_natives[0].callToActionText2, 'callToActionText2');
					//Need to Add For Zoom Meeting
					this.charLimitForCalltoAction(res.data.Drip_whatsapp_natives[0].callToActionZoomText, 'zoomMeetLink');
					this.charLimitForCalltoAction(res.data.Drip_whatsapp_natives[0].callToActionZoomText2, 'zoomMeetLink2');

					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply1, 'quickReply1');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply2, 'quickReply2');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply3, 'quickReply3');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply4, 'quickReply4');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply5, 'quickReply5');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply6, 'quickReply6');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply7, 'quickReply7');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply8, 'quickReply8');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply9, 'quickReply9');
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_natives[0].quickReply10, 'quickReply10');

					this.checkCharLimitForCallPhone(res.data.Drip_whatsapp_natives[0].callphonetext, 'callphonetext');
					this.checkCharLimitForCallPhone(res.data.Drip_whatsapp_natives[0].callphoneno, 'callphoneno');
					this.selectedDripType = 1;
					this.getEditDripWhatsAppHeader(res.data.Drip_whatsapp_natives[0].header_type);
					this.selectShowMobPreview('whatsapp');
					this.addCallToAction();
					// quick reply
					if (res.data.Drip_whatsapp_natives[0].quickReply10) {
						this.quickReplyIndex = 10;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply9) {
						this.quickReplyIndex = 9;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply8) {
						this.quickReplyIndex = 8;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply7) {
						this.quickReplyIndex = 7;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply6) {
						this.quickReplyIndex = 6;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply5) {
						this.quickReplyIndex = 5;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply4) {
						this.quickReplyIndex = 4;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply3) {
						this.quickReplyIndex = 3;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply2) {
						this.quickReplyIndex = 2;
					} else if (res.data.Drip_whatsapp_natives[0].quickReply1) {
						this.quickReplyIndex = 1;
					}

					// call to action
					if (res.data.Drip_whatsapp_natives[0].callToActionText) {
						this.callToActionIndex = 1;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					if (res.data.Drip_whatsapp_natives[0].callToActionText2) {
						this.callToActionIndex = 2;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					//Zoom Meeting Call to Action
					if (res.data.Drip_whatsapp_natives[0].callToActionZoomText) {
						this.zoomMeetingIndex = 1;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					if (res.data.Drip_whatsapp_natives[0].callToActionZoomText2) {
						this.zoomMeetingIndex = 2;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					// call to phone
					if (res.data.Drip_whatsapp_natives[0].callphoneno) {
						this.callToPhoneIndex = 1;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					// quick reply
					if (res.data.Drip_whatsapp_natives[0].quickReply1) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply1');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply2) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply2');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply3) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply3');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply4) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply4');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply5) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply5');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply6) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply6');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply7) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply7');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply8) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply8');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply9) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply9');
					}
					if (res.data.Drip_whatsapp_natives[0].quickReply10) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('quickReply10');
					}

					// call to action
					if (res.data.Drip_whatsapp_natives[0].callToActionText) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('callToActionText');
					}
					if (res.data.Drip_whatsapp_natives[0].callToActionText2) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('callToActionText2');
					}

					// Zoom Meeting caal to Action
					if (res.data.Drip_whatsapp_natives[0].callToActionZoomText) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('zoomMeetLink');
					}
					if (res.data.Drip_whatsapp_natives[0].callToActionZoomText2) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('zoomMeetLink2');
					}

					// call to phone
					if (res.data.Drip_whatsapp_natives[0].callphonetext) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionArrayData.push('callphonetext');
					}

					if (this.totalInteractionCount > 0) {
						this.showInteraction = true;
					}

					this.quickReplyFirst = res.data.Drip_whatsapp_natives[0].quickReplyFirst;

					this.quickReplyIndexArrays = [];
					this.callToactionArrays = [];
					this.zoomMeetingArrays = [];
					for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
						if (this.selectedInteractionArrayData[i].includes('quickReply')) {
							this.quickReplyIndexArrays.push(i);
						} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
							this.zoomMeetingArrays.push(i);
						} else {
							this.callToactionArrays.push(i);
						}
					}

					console.log('this.this.whatsUpNativeForm.---1', this.whatsUpNativeForm.value);
				} else if (res.data.drip_type == 'DripApp with sharing on WhatsApp') {
					this.whatsUpNonNativeForm.patchValue(res.data.Drip_whatsapp_non_natives[0]);
					this.checkCharacterLimitForBody(res.data.Drip_whatsapp_non_natives[0].body);
					this.checkCharacterLimitForHeader(res.data.Drip_whatsapp_non_natives[0].header_text);
					this.checkCharacterLimitForFooter(res.data.Drip_whatsapp_non_natives[0].footer);
					this.charLimitForCalltoAction(
						res.data.Drip_whatsapp_non_natives[0].callToActionText,
						'callToActionTextWithWApp'
					);
					this.charLimitForQuickRepliesOnlyWApp(res.data.Drip_whatsapp_non_natives[0].quickReply1, 'quickReply1');
					this.selectedDripType = 2;
					this.selectedTemplateType = res.data.Drip_whatsapp_non_natives[0].templateType;

					this.getEditDripWhatsAppHeader(res.data.Drip_whatsapp_non_natives[0].header_type);

					if (
						res.data.Drip_whatsapp_non_natives &&
						res.data.Drip_whatsapp_non_natives.length > 0 &&
						res.data.Drip_whatsapp_non_natives[0].OtherDripType
					) {
						this.emailNoneNativeForm.patchValue(res.data.Drip_email_non_natives[0]);
					}

					// if (
					//     res.data.Drip_whatsapp_non_natives &&
					//     res.data.Drip_whatsapp_non_natives.length > 0 &&
					//     res.data.Drip_whatsapp_non_natives[0].existingDripId
					// ) {
					//     this.getAllDripList(null, true);
					// }

					this.setCreateNewDrip(this.whatsUpNonNativeForm.controls['contentType'].value);
					this.selectShowMobPreview('whatsapp');
				} else if (res.data.drip_type == 'Only Email') {
					this.onlyEmailForm.patchValue(res.data.Drip_only_emails[0]);
					this.checkCharacterLimitForBody(res.data.Drip_only_emails[0].email_body);
					this.selectedDripType = 7;
					this.selectShowMobPreview('email');
					if (res.data.Drip_only_emails[0].brodEmailAssetPath) {
						for (let item of res.data.Drip_only_emails[0].brodEmailAssetPath) {
							const fileName = item.filePath.replace('/var/warehouse/data/', '');
							this.brodSideEmailImgSrcValues.push(fileName);
							this.brodSideEmailImgFilePaths.push(item);
						}
					}

					if (res.data.Drip_only_emails[0].brodEmailAttachmentPath) {
						for (let item of res.data.Drip_only_emails[0].brodEmailAttachmentPath) {
							// const fileName = item.filePath.replace('/var/warehouse/data/', '');
							this.brodSideEmailAttachments.push(item);
						}
					}
				} else if (res.data.drip_type == 'DripApp with sharing on Email') {
					this.emailNoneNativeForm.patchValue(res.data.Drip_email_non_natives[0]);
					this.checkCharacterLimitForBody(res.data.Drip_email_non_natives[0].email_body);
					this.charLimitForCalltoAction(res.data.Drip_email_non_natives[0].callToActionText, 'callToActionTextEmail');
					this.selectedDripType = 3;
					this.selectedTemplateType = res.data.Drip_email_non_natives[0].templateType;
					if (
						res.data.Drip_email_non_natives &&
						res.data.Drip_email_non_natives.length > 0 &&
						res.data.Drip_email_non_natives[0].OtherDripType
					) {
						this.getEditDripWhatsAppHeader(res.data.Drip_whatsapp_non_natives[0].header_type);

						this.whatsUpNonNativeForm.patchValue(res.data.Drip_whatsapp_non_natives[0]);
					}
					if (res.data.Drip_email_non_natives[0].brodEmailAssetPath) {
						for (let item of res.data.Drip_email_non_natives[0].brodEmailAssetPath) {
							const fileName = item.filePath.replace('/var/warehouse/data/', '');
							this.brodSideEmailImgSrcValues.push(fileName);
							this.brodSideEmailImgFilePaths.push(item);
						}
					}
					if (res.data.Drip_email_non_natives[0].brodEmailAttachmentPath) {
						for (let item of res.data.Drip_email_non_natives[0].brodEmailAttachmentPath) {
							this.brodSideEmailAttachments.push(item);
						}
					}

					this.setCreateNewDrip(this.emailNoneNativeForm.controls['contentType'].value);
					this.selectShowMobPreview('email');
				} else if (res.data.drip_type == 'Only DripApp') {
					this.dripNativeForm.patchValue(res.data.Drip_natives[0]);
					this.selectedDripType = 4;
					this.selectedTemplateType = res.data.Drip_natives[0].templateType;

					if (res.data.Drip_natives && res.data.Drip_natives.length > 0 && res.data.Drip_natives[0].OtherDripType) {
						this.getEditDripWhatsAppHeader(res.data.Drip_natives[0].header_type);

						this.whatsUpNonNativeForm.patchValue(res.data.Drip_whatsapp_non_natives[0]);
						this.emailNoneNativeForm.patchValue(res.data.Drip_email_non_natives[0]);
					}
					this.selectShowMobPreview('drip');
				} else if (res.data.drip_type == 'Only Teams') {
					this.dripOnlyTeamsForm.patchValue(res.data.DripOnlyTeams[0]);
					this.checkCharacterLimitForHeader(res.data.DripOnlyTeams[0].header_text);
					this.checkCharacterLimitForBody(res.data.DripOnlyTeams[0].body);
					this.charLimitForCalltoAction(res.data.DripOnlyTeams[0].callToActionText1, 'callToActionText1');
					this.charLimitForCalltoAction(res.data.DripOnlyTeams[0].callToActionText2, 'callToActionText2');
					this.charLimitForCalltoAction(res.data.DripOnlyTeams[0].callToActionText3, 'callToActionText3');

					this.selectedDripType = 5;
					this.getEditDripWhatsAppHeader(res.data.DripOnlyTeams[0].header_type);
					this.selectShowMobPreview('teams');

					// call to action
					if (res.data.DripOnlyTeams[0].callToActionText1) {
						this.callToActionIndex = 1;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					if (res.data.DripOnlyTeams[0].callToActionText2) {
						this.callToActionIndex = 2;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					if (res.data.DripOnlyTeams[0].callToActionText3) {
						this.callToActionIndex = 3;
						this.combineActionIndex = this.combineActionIndex + 1;
					}

					// call to action
					if (res.data.DripOnlyTeams[0].callToActionText1) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionCTTeamsArrayData.push('callToActionText1');
					}
					if (res.data.DripOnlyTeams[0].callToActionText2) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionCTTeamsArrayData.push('callToActionText2');
					}
					if (res.data.DripOnlyTeams[0].callToActionText3) {
						this.totalInteractionCount = this.totalInteractionCount + 1;
						this.selectedInteractionCTTeamsArrayData.push('callToActionText3');
					}

					if (this.totalInteractionCount > 0) {
						this.showInteraction = true;
					}

					this.callToactionArrays = [];
					for (let i = 0; i < this.selectedInteractionCTTeamsArrayData.length; i++) {
						if (this.selectedInteractionCTTeamsArrayData[i].includes('callToActionText')) {
							this.callToactionArrays.push(i);
						}
					}
				} else if (res.data.drip_type == 'DripApp with sharing on Teams') {
					this.dripSharingOnTeamsForm.patchValue(res.data.DripSharingOnTeams[0]);
					this.checkCharacterLimitForHeader(res.data.DripSharingOnTeams[0].header_text);
					this.checkCharacterLimitForBody(res.data.DripSharingOnTeams[0].body);
					this.charLimitForCalltoAction(res.data.DripSharingOnTeams[0].callToActionText, 'callToActionText');
					this.getEditDripWhatsAppHeader(res.data.DripSharingOnTeams[0].header_type);

					this.selectedDripType = 6;
					this.selectedTemplateType = res.data.DripSharingOnTeams[0].templateType;
					this.setCreateNewDrip(res.data.DripSharingOnTeams[0].contentType);
					this.selectShowMobPreview('teams');
				}

				if (res.data && res.data.Assets && res.data.Assets.length) {
					let temp = res.data.Assets.sort((a, b) => {
						if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
							return -1;
						}
					});
					for (let asset of temp) {
						let payload = {
							title: asset.title,
							AssetId: asset.id,
							assetType: asset.field_name,
							path: asset.Asset_details[0].path,
							fileName: asset.Asset_details[0].name,
							isTranscoding: asset.Asset_details[0].isTranscoding,
							selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
							youtubeVideoId: null,
							cmsVideoId: asset.Asset_details[0].cmsVideoId,
						};

						if (asset.Asset_details[0] && asset.Asset_details[0].selfHostedVideo) {
							payload.youtubeVideoId = this.getVideoIdFromUrl(asset.Asset_details[0].path);
							if (!payload.youtubeVideoId) {
								payload.youtubeVideoId = this.getVideoIdFromEmbedUrl(asset.Asset_details[0].path);
							}
						}

						this.selectedAssetForTheDrip.push(payload);
					}
				}

				if (res.data && res.data.Post_brief_assets && res.data.Post_brief_assets.length) {
					let temp = res.data.Post_brief_assets.sort((a, b) => {
						if (a.PostBriefAsset.index < b.PostBriefAsset.index) {
							return -1;
						}
					});
					for (let asset of temp) {
						let payload = {
							title: asset.title,
							AssetId: asset.id,
							assetType: asset.field_name,
							path: asset.Asset_details[0].path,
							fileName: asset.Asset_details[0].name,
							isTranscoding: asset.Asset_details[0].isTranscoding,
							selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
							forPreview: asset.PostBriefAsset.forPreview,
							cmsVideoId: asset.Asset_details[0].cmsVideoId,
						};
						this.selectedAssetForOfflineTaskBrief.push(payload);
					}
				}

				//for spin the wheel template
				if (res.data.DripSpinWheelCats.length == 0) {
					this.spinWheelQueCategory = [
						...res.data.DripSpinWheelCats,
						{
							category_index: 1,
							category_name: null,
							totalquestion: 0,
							totalscore: 0,
							characterRemain: 0,
						},
					];
				} else {
					for (let cat of res.data.DripSpinWheelCats) {
						let payload = {
							category_index: cat.category_index,
							category_name: cat.category_name,
							totalquestion: cat.totalquestion,
							totalscore: cat.totalscore,
							characterRemain: cat.characterRemain,
						};
						this.spinWheelQueCategory.push(payload);
					}
				}

				if (
					this.selectedTemplateType &&
					(this.selectedTemplateType == 'Single Image' ||
						this.selectedTemplateType == 'Carousel' ||
						this.selectedTemplateType == 'Poll' ||
						this.selectedTemplateType == 'Quiz' ||
						this.selectedTemplateType == 'Quiz (Randomised)' ||
						this.selectedTemplateType == 'Offline Task' ||
						this.selectedTemplateType == 'Survey')
				) {
					this.getAllAssetByType(this.selectedClientId, 'Image');
					// this.getAssetsFilter(this.selectedClientId, 'Image');
					this.typeForSearch = 'Image';
				} else if (this.selectedTemplateType && this.selectedTemplateType == 'Video') {
					this.getAllAssetByType(this.selectedClientId, 'Video');
					// this.getAssetsFilter(this.selectedClientId, 'Video');
					this.typeForSearch = 'Video';
				}
				this.dripForm.controls['drip_type'].disable();
				this.whatsUpNativeForm.controls['tempCategory'].disable();
				this.whatsUpNonNativeForm.controls['tempCategory'].disable();
				if (this.editDrip && this.editDrip.dripId && this.editDrip.type == 'copy') {
					this.dripForm.controls['drip_title'].setValue('Copy of - ' + res.data.drip_title);
					this.dripForm.controls['id'].setValue(null);
					this.dripForm.controls['drip_status'].setValue('Published');
					this.whatsUpNativeForm.controls['id'].setValue(null);
					this.whatsUpNonNativeForm.controls['id'].setValue(null);
					this.emailNoneNativeForm.controls['id'].setValue(null);
					this.dripNativeForm.controls['id'].setValue(null);
					this.dripOnlyTeamsForm.controls['id'].setValue(null);
					this.dripSharingOnTeamsForm.controls['id'].setValue(null);
					this.onlyEmailForm.controls['id'].setValue(null);

					this.whatsUpNativeForm.controls['tempName'].setValue(null);
					this.whatsUpNonNativeForm.controls['tempName'].setValue(null);

					this.whatsUpNativeForm.controls['templateId'].setValue(null);
					this.whatsUpNonNativeForm.controls['templateId'].setValue(null);

					this.whatsUpNativeForm.controls['templateStatus'].setValue(null);
					this.whatsUpNonNativeForm.controls['templateStatus'].setValue(null);

					//Zoom Meeting Call to Action

					this.whatsUpNativeForm.controls['zoomMeetLink'].setValue(null);
					this.whatsUpNativeForm.controls['zoomMeetLink2'].setValue(null);

					//Zoom Meeting For Drip With Whats
					this.whatsUpNonNativeForm.controls['zoomMeetLink'].setValue(null);
					this.whatsUpNonNativeForm.controls['ZoomMeetId'].setValue(null);

					this.whatsUpNativeForm.controls['hyper_link'].setValue(null);
					this.whatsUpNativeForm.controls['hyper_link2'].setValue(null);

					this.whatsUpNonNativeForm.controls['hyper_link'].setValue(null);
					this.emailNoneNativeForm.controls['hyper_link'].setValue(null);

					this.dripOnlyTeamsForm.controls['hyper_link1'].setValue(null);
					this.dripOnlyTeamsForm.controls['hyper_link2'].setValue(null);
					this.dripOnlyTeamsForm.controls['hyper_link3'].setValue(null);

					this.dripSharingOnTeamsForm.controls['hyper_link'].setValue(null);

					this.dripForm.controls['drip_type'].enable();
					this.whatsUpNativeForm.controls['tempCategory'].enable();
					this.whatsUpNonNativeForm.controls['tempCategory'].enable();

					this.whatsUpNonNativeForm.controls['templateType'].setValue(res.data.tempType);
					this.emailNoneNativeForm.controls['templateType'].setValue(res.data.tempType);
					this.dripNativeForm.controls['templateType'].setValue(res.data.tempType);
					this.dripSharingOnTeamsForm.controls['templateType'].setValue(res.data.tempType);

					this.whatsUpNonNativeForm.controls['brief'].setValue(res.data.brief);
					this.emailNoneNativeForm.controls['brief'].setValue(res.data.brief);
					this.dripNativeForm.controls['brief'].setValue(res.data.brief);
					this.dripSharingOnTeamsForm.controls['brief'].setValue(res.data.brief);

					this.whatsUpNonNativeForm.controls['caption'].setValue(res.data.caption);
					this.emailNoneNativeForm.controls['caption'].setValue(res.data.caption);
					this.dripNativeForm.controls['caption'].setValue(res.data.caption);
					this.dripSharingOnTeamsForm.controls['caption'].setValue(res.data.caption);

					this.whatsUpNonNativeForm.controls['pwaheadtxt'].setValue(res.data.pwaheadtxt);
					this.emailNoneNativeForm.controls['pwaheadtxt'].setValue(res.data.pwaheadtxt);
					this.dripNativeForm.controls['pwaheadtxt'].setValue(res.data.pwaheadtxt);
					this.dripSharingOnTeamsForm.controls['pwaheadtxt'].setValue(res.data.pwaheadtxt);

					this.whatsUpNonNativeForm.controls['submitText'].setValue(res.data.submitText);
					this.emailNoneNativeForm.controls['submitText'].setValue(res.data.submitText);
					this.dripNativeForm.controls['submitText'].setValue(res.data.submitText);
					this.dripSharingOnTeamsForm.controls['submitText'].setValue(res.data.submitText);

					this.dripService.getWhatsAppSetupByClientId(this.selectedClientId).subscribe((res: any) => {
						if (res.success && res.data) {
							this.whatsAppSetupData = res.data;
							this.haveWhatsAppSetup = true;
							if (this.selectedDripType == 1 && this.whatsAppSetupData) {
								this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
								this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(null);
							} else if (this.selectedDripType == 2 && this.whatsAppSetupData) {
								this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(null);
								this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
							}
							if (this.whatsAppSetupData.canSelectTempType) {
								this.showTemplateCategoryDD = true;
							} else {
								this.showTemplateCategoryDD = false;
							}
						}
					});

					this.appService.getAppBranding(this.selectedClientId).subscribe((res: any) => {
						if (res.success && res.data) {
							this.hideBackBtnToggle = res.data.hideBackBtnToggle;
							this.defaultbackval = res.data.defaultbackval;
						}

						if (!this.hideBackBtnToggle) {
							if (this.defaultbackval == 'Show buttons') {
								this.dripForm.controls['showBackButton'].patchValue(true);
							} else if (this.defaultbackval == 'Do not show button') {
								this.dripForm.controls['showBackButton'].patchValue(false);
							}
						} else if (this.hideBackBtnToggle) {
							this.dripForm.controls['showBackButton'].patchValue(false);
						}
					});

					if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
						this.dripService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
							if (res.success) {
								this.selectedClientId = null;
								this.clientList = [];
								this.clientList = res.data;

								for (let client of res.data) {
									if (client.id == parseInt(this.editDrip.copyClientId)) {
										this.selectedClientId = client.id;
									}
								}
								$('#selecteClientList').modal('show');
							}
						});
					}
				}
				this.addTotalQuestionToSkipList();
			}
		});
	}

	getEditDripWhatsAppHeader(type) {
		this.getAllAssetByType(this.selectedClientId, type);
		this.typeForSearch = type;
	}

	createDripForm() {
		this.dripForm = this.formBuilder.group({
			id: null,
			drip_title: ['', [Validators.required]],
			drip_type: [null, [Validators.required]],
			drip_description: [''],
			drip_status: ['Published', [Validators.required]],
			requiredLogging: [false, [Validators.required]],
			externalLinkFlag: [false],
			externalLinkLabel1: [null],
			externalLink1: [null],
			externalLinkLabel2: [null],
			externalLink2: [null],
			externalLinkLabel3: [null],
			externalLink3: [null],
			externalLinkLabel4: [null],
			externalLink4: [null],

			externalLinkLabel5: [null],
			externalLink5: [null],

			externalLinkLabel6: [null],
			externalLink6: [null],

			externalLinkLabel7: [null],
			externalLink7: [null],

			externalLinkLabel8: [null],
			externalLink8: [null],

			externalLinkLabel9: [null],
			externalLink9: [null],

			externalLinkLabel10: [null],
			externalLink10: [null],

			showBackButton: [true],
		});
	}
	get dripF() {
		return this.dripForm.controls;
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

	cancelWhatsAppSetupPop() {
		$('#whatsAppSetupWarningPopup').modal('hide');
	}

	selectDripType(type) {
		if (type) {
			this.selectedDripType = type.type;
			if (this.selectedDripType == 1) {
				this.selectAssetForTaskBrief = false;
				this.selectedTab = 'whatsapp';
				this.selectShowMobPreview('whatsapp');
				if (!this.haveWhatsAppSetup) {
					this.dripForm.controls['drip_type'].setValue(null);
					this.selectedDripType = null;
					$('#whatsAppSetupWarningPopup').modal('show');
					return;
				} else {
					this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
					this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(null);
				}

				if (this.whatsAppSetupData) {
					this.whatsUpNativeForm.controls['tempCategory'].setValue(this.whatsAppSetupData.category);
				}
			} else if (this.selectedDripType == 2) {
				this.selectedTab = 'whatsapp';
				this.selectShowMobPreview('whatsapp');
				if (!this.haveWhatsAppSetup) {
					this.dripForm.controls['drip_type'].setValue(null);
					this.selectedDripType = null;
					$('#whatsAppSetupWarningPopup').modal('show');
					return;
				} else {
					this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(null);
					this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
				}

				if (this.whatsAppSetupData) {
					this.whatsUpNonNativeForm.controls['tempCategory'].setValue(this.whatsAppSetupData.category);
				}
				this.getAllAssetByClient(this.selectedClientId);
				this.createAssetArray();
			} else if (this.selectedDripType == 7) {
				this.selectedTab = 'email';
				this.selectShowMobPreview('email');
				// this.createEmailNonNativeForm();
				// this.getAllAssetByClient(this.selectedClientId);
				// this.createAssetArray();
			} else if (this.selectedDripType == 3) {
				this.selectedTab = 'email';
				this.selectShowMobPreview('email');
				// this.createEmailNonNativeForm();
				this.getAllAssetByClient(this.selectedClientId);
				this.createAssetArray();
			} else if (this.selectedDripType == 4) {
				this.selectedTab = 'drip';
				this.selectShowMobPreview('drip');
				// this.createDripNativeForm();
				this.getAllAssetByClient(this.selectedClientId);
				this.createAssetArray();
			} else if (this.selectedDripType == 5) {
				this.selectAssetForTaskBrief = false;
				this.selectedTab = 'teams';
				this.selectShowMobPreview('teams');
			} else if (this.selectedDripType == 6) {
				this.selectAssetForTaskBrief = false;
				this.selectedTab = 'teams';
				this.selectShowMobPreview('teams');
			}

			this.whatsUpNonNativeForm.controls['custTempId'].setValue(null);
			this.emailNoneNativeForm.controls['custTempId'].setValue(null);
			this.dripNativeForm.controls['custTempId'].setValue(null);
			this.dripSharingOnTeamsForm.controls['custTempId'].setValue(null);
			this.customTempPlaceholderArray = [];
			this.pwaHeaderCaptionRequired = false;
			this.captionImageRequired = false;
		}
	}

	addMoreAsset() {
		if (this.selectedAssetForTheDrip.length < 5) {
			let payload = {
				AssetId: null,
				// caption: '',
				assetType: '',
			};
			// this.selectedAssetForTheDrip.push(payload);
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Utils.cantAddMore'),
				this.appService.getTranslation('Utils.warning')
			);
		}

		if (this.selectedAssetForTheDrip.length == 2) {
			this.assetTypeForLibaray = 'Image';
			this.assetService.getAllAssetsByType(this.selectedClientId, 'Image').subscribe((res: any) => {
				if (res.success) {
					this.allAssetsForDrip = [];
					this.allAssetsForDrip = res.data;
				}
			});
		}
	}

	selectEmptyAsset() {
		let payload = {
			AssetId: null,
			// caption: '',
			assetType: '',
		};
		this.selectedAssetForTheDrip = [];
		// this.selectedAssetForTheDrip.push(payload);
	}

	removeAsset(index, assetId) {
		this.selectedAssetForTheDrip.splice(index, 1);
		for (let asset of this.templateAssetList) {
			if (assetId == asset.id) {
				asset.selected = false;
			}
		}
	}

	createWhatsUpNativeForm() {
		this.whatsUpNativeForm = this.formBuilder.group({
			id: null,
			header_type: ['None', Validators.required],
			header_text: [null],
			body: [null, Validators.required],
			footer: [null],
			AssetId: [null],
			quickReply1: [null],
			quickReply2: [null],
			quickReply3: [null],

			quickReply4: [null],
			quickReply5: [null],
			quickReply6: [null],
			quickReply7: [null],
			quickReply8: [null],
			quickReply9: [null],
			quickReply10: [null],

			templateStatus: [null],
			templateId: [null],
			headerPath: [null],
			headerFileName: [null],
			interaction: [null],

			callToActionText: [null],
			hyper_link: [null],

			callToActionText2: [null],
			hyper_link2: [null],

			tempCategory: ['Utility', Validators.required],
			tempLang: ['en'],
			WhatsAppSetupId: [null, Validators.required],
			tempName: [null, Validators.required],
			trackableLink: [false],
			trackableLink2: [false],
			longitude: [null],
			latitude: [null],
			locName: [null],
			address: [null],

			callphonetext: [null],
			callphoneno: [null],
			callphonetype: ['Work'],

			//Zoom Meeting
			zoomMeetLink: [null],
			callToActionZoomText: [null],
			zoomTrackable: [false],
			ZoomMeetId: [null],

			zoomMeetLink2: [null],
			callToActionZoomText2: [null],
			zoomTrackable2: [false],
			ZoomMeetId2: [null],

			quality: ['Green'],
		});
	}
	get f1() {
		return this.whatsUpNativeForm.controls;
	}

	createWhatsUpNonNativeForm() {
		this.whatsUpNonNativeForm = this.formBuilder.group({
			id: null,
			header_type: ['None', Validators.required],
			header_text: [null],
			AssetId: [null],
			body: [null, Validators.required],
			footer: [null],
			contentType: ['Create New Drip', Validators.required],
			interaction: ['Call to Action'],
			callToActionText: [null, Validators.required],
			hyper_link: [null],
			OtherDripType: [false],
			pwaheadtxt: [null],
			caption: [null],
			existingDripId: [null],
			templateStatus: [null],
			templateId: [null],
			templateType: [null],
			headerPath: [null],
			headerFileName: [null],
			tempCategory: ['Utility', Validators.required],
			tempLang: ['en', Validators.required],
			WhatsAppSetupId: [null, Validators.required],
			tempName: [null, Validators.required],
			showCorrectAns: [false],
			brief: [null],
			quizResultType: ['Upon Submission'],
			timehours: [null],
			quizRandCount: [null],
			pollResultType: ['Scale Chart'],

			longitude: [null],
			latitude: [null],
			locName: [null],
			address: [null],

			isZoomMeeting: [false],
			zoomMeetLink: [null],
			ZoomMeetText: [null],
			ZoomMeetId: [null],
			noOfTimeSpin: [null],
			noOfQueForCat: [null],
			quality: ['Green'],
			submitText: ['Submit'],
			custTempId: [null],
		});
	}
	get f2() {
		return this.whatsUpNonNativeForm.controls;
	}

	createOnlyEmailForm() {
		this.onlyEmailForm = this.formBuilder.group({
			id: null,
			email_subject_line: [null, Validators.required],
			email_body: [null, Validators.required],
			// callToActionText: [null, Validators.required],
			// hyper_link: [null],
			contentType: ['Create New Drip', Validators.required],
			// OtherDripType: [false],
			// pwaheadtxt: [null],
			caption: [null],
			// existingDripId: [null],
			templateType: [null],
			isSendGridTemplate: [this.useSendGrid],
			brod_attach_type: ['None'],
			brod_attach_path: [null],
			// showCorrectAns: [false],
			// brief: [null],
			// quizResultType: ['Upon Submission'],
			// timehours: [null],
			// quizRandCount: [null],
			// pollResultType: ['Scale Chart'],
		});
	}
	get f7() {
		return this.onlyEmailForm.controls;
	}

	createEmailNonNativeForm() {
		this.emailNoneNativeForm = this.formBuilder.group({
			id: null,
			email_subject_line: [null, Validators.required],
			email_body: [null, Validators.required],
			callToActionText: [null, Validators.required],
			hyper_link: [null],
			contentType: ['Create New Drip', Validators.required],
			OtherDripType: [false],
			pwaheadtxt: [null],
			caption: [null],
			existingDripId: [null],
			templateType: [null],
			showCorrectAns: [false],
			brief: [null],
			quizResultType: ['Upon Submission'],
			timehours: [null],
			quizRandCount: [null],
			pollResultType: ['Scale Chart'],
			isSendGridTemplate: [this.useSendGrid],
			brod_attach_type: ['None'],
			brod_attach_path: [null],
			noOfTimeSpin: [null],
			noOfQueForCat: [null],
			submitText: ['Submit'],
			custTempId: [null],
		});
	}
	get f3() {
		return this.emailNoneNativeForm.controls;
	}

	createDripNativeForm() {
		this.dripNativeForm = this.formBuilder.group({
			id: null,
			// title: ['', [Validators.required]],
			// description: ['', [Validators.required]],
			pwaheadtxt: [null],
			caption: [null],
			contentType: ['Create New Drip', Validators.required],
			OtherDripType: [false],
			existingDripId: [null],
			templateType: [null],
			showCorrectAns: [false],
			brief: [null],
			quizResultType: ['Upon Submission'],
			timehours: [null],
			quizRandCount: [null],
			pollResultType: ['Scale Chart'],
			noOfTimeSpin: [null],
			noOfQueForCat: [null],
			submitText: ['Submit'],
			custTempId: [null],
		});
	}
	get f4() {
		return this.dripNativeForm.controls;
	}

	createdripOnlyTeamsForm() {
		this.dripOnlyTeamsForm = this.formBuilder.group({
			id: null,
			onlyTeamMsgType: ['Send Message'],
			header_type: ['None'],
			header_text: [null],
			body: [null, Validators.required],
			AssetId: [null],
			headerPath: [null],
			headerFileName: [null],
			callToActionText1: [null],
			hyper_link1: [null],
			trackableLink1: [false],
			callToActionText2: [null],
			hyper_link2: [null],
			trackableLink2: [false],
			callToActionText3: [null],
			hyper_link3: [null],
			trackableLink3: [false],
			cardTitle: [null],
			cardSubTitle: [null],
			TeamSetupId: [null, Validators.required],
		});
	}
	get f5() {
		return this.dripOnlyTeamsForm.controls;
	}

	createdripSharingOnTeamsForm() {
		this.dripSharingOnTeamsForm = this.formBuilder.group({
			id: null,
			onlyTeamMsgType: ['Send Message'],
			header_type: ['None'],
			header_text: [null],
			body: [null, Validators.required],
			AssetId: [null],
			headerPath: [null],
			headerFileName: [null],
			callToActionText: [null],
			hyper_link: [null],
			cardTitle: [null],
			cardSubTitle: [null],
			contentType: ['Create New Drip'],
			OtherDripType: [false],
			pwaheadtxt: [null],
			caption: [null],
			existingDripId: [null],
			templateType: [null],
			showCorrectAns: [false],
			brief: [null],
			quizResultType: ['Upon Submission'],
			timehours: [null],
			quizRandCount: [null],
			pollResultType: ['Scale Chart'],
			TeamSetupId: [null, Validators.required],
			noOfTimeSpin: [null],
			noOfQueForCat: [null],
			submitText: ['Submit'],
			custTempId: [null],
		});
	}
	get f6() {
		return this.dripSharingOnTeamsForm.controls;
	}

	createAssetArray() {
		this.selectedAssetForTheDrip = [];
		// for (let i = 1; i <= 1; i++) {
		let payload = {
			AssetId: null,
			// caption: '',
			assetType: '',
		};
		// this.selectedAssetForTheDrip.push(payload);
		// }
	}

	getAllAssetByType(clientId, type) {
		this.assetTypeForLibaray = type;

		this.assetService.getAllAssetsByType(clientId, type).subscribe((res: any) => {
			if (res.success) {
				this.whatsAppHeaderAssetList = [];
				this.whatsAppHeaderAssetList = res.data;
				this.templateAssetList = [];
				this.templateAssetList = res.data;
				for (let asset of this.templateAssetList) {
					asset.selected = false;
				}
			}
		});

		//<!--------------------------- Google Workspace Code ---------------------->

		// this.assetService.getAllAssetsByTypeFromGooleDrive({ assetType: [type] }).subscribe((res: any) => {
		// 	if (res.success) {
		// 		this.whatsAppHeaderAssetListByGoogleDrive = [];
		// 		if (res?.data) {
		// 			this.appService.googleDriveLogin = true;
		// 			this.whatsAppHeaderAssetListByGoogleDrive = res.data.files;
		// 			for (let asset of this.whatsAppHeaderAssetListByGoogleDrive) {
		// 				asset.selected = false;
		// 			}
		// 		} else {
		// 			this.appService.googleDriveLogin = false;
		// 		}
		// 	}
		// });

		//<!--------------------------- Google Workspace Code ---------------------->
	}

	getAllDripList(templateType) {
		if (templateType) {
			this.dripService
				.getAllDripsByClientForUseExsitingPost(this.selectedClientId, templateType)
				.subscribe((res: any) => {
					if (res.success) {
						this.allDripListForUseExisting = [];
						this.allDripListForUseExisting = res.data;
					}
				});
		}
	}

	selectAssetForDrip(asset, index) {
		if (asset && asset.field_name) {
			this.selectedAssetForTheDrip[index].assetType = asset.field_name;
		}
	}

	selectAsset(asset, index) {
		if (this.selectedAssetForTheDrip.length > 0) {
			let temp = null;
			for (let i = 0; i < this.selectedAssetForTheDrip.length; i++) {
				if (this.selectedAssetForTheDrip[i].AssetId == asset.id) {
					temp = i;
				}
			}
			if (temp >= 0 && temp != null) {
				this.selectedAssetForTheDrip.splice(temp, 1);
				this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
			} else {
				let payload = {
					title: asset.title,
					AssetId: asset.id,
					assetType: asset.field_name,
					path: asset.Asset_details[0].path,
					fileName: asset.Asset_details[0].name,
					isTranscoding: asset.Asset_details[0].isTranscoding,
					selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
					youtubeVideoId: null,
					cmsVideoId: asset.Asset_details[0].cmsVideoId,
					cmsVideoPath: null,
				};

				if (
					payload.assetType == 'Video' &&
					payload.cmsVideoId &&
					this.appService.configurable_feature.mediaCMS &&
					this.appService.configurable_feature.CMSUrl
				) {
					payload.cmsVideoPath = this.transform(
						this.appService.configurable_feature.CMSUrl + '/embed?m=' + payload.cmsVideoId
					);
				}

				if (asset.Asset_details[0] && asset.Asset_details[0].selfHostedVideo) {
					payload.youtubeVideoId = this.getVideoIdFromUrl(asset.Asset_details[0].path);
					if (!payload.youtubeVideoId) {
						payload.youtubeVideoId = this.getVideoIdFromEmbedUrl(asset.Asset_details[0].path);
					}
				}

				if (this.selectedAssetForTheDrip.length < 10) {
					this.selectedAssetForTheDrip.push(payload);
				} else {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notselectmorethanTen'),
						this.appService.getTranslation('Utils.error')
					);
					return;
				}
				this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
			}
		} else {
			let payload = {
				title: asset.title,
				AssetId: asset.id,
				assetType: asset.field_name,
				path: asset.Asset_details[0].path,
				fileName: asset.Asset_details[0].name,
				isTranscoding: asset.Asset_details[0].isTranscoding,
				selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
				youtubeVideoId: null,
				cmsVideoId: asset.Asset_details[0].cmsVideoId,
				cmsVideoPath: null,
			};

			if (asset.Asset_details[0] && asset.Asset_details[0].selfHostedVideo) {
				payload.youtubeVideoId = this.getVideoIdFromUrl(asset.Asset_details[0].path);
				if (!payload.youtubeVideoId) {
					payload.youtubeVideoId = this.getVideoIdFromEmbedUrl(asset.Asset_details[0].path);
				}
			} else if (
				payload.assetType == 'Video' &&
				payload.cmsVideoId &&
				this.appService.configurable_feature.mediaCMS &&
				this.appService.configurable_feature.CMSUrl
			) {
				payload.cmsVideoPath = this.transform(
					this.appService.configurable_feature.CMSUrl + '/embed?m=' + payload.cmsVideoId
				);
			}

			this.selectedAssetForTheDrip.push(payload);
			console.log('-------------', this.selectedAssetForTheDrip);
			this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
		}
		this.cancelMediaPopUp();
		// if (
		// 	this.selectedTemplateType == 'Single Image' ||
		// 	this.selectedTemplateType == 'Video' ||
		// 	this.selectedTemplateType == 'Quiz' ||
		// 	this.selectedTemplateType == 'Quiz (Randomised)' ||
		// 	this.selectedTemplateType == 'Poll' ||
		// 	this.selectedTemplateType == 'Offline Task' ||
		// 	this.selectedTemplateType == 'Survey' ||
		// 	this.selectedTemplateType == 'HTML'
		// ) {

		// }
	}

	getVideoIdFromUrl(url) {
		console.log('url', url);
		const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = url.match(regExp);

		if (match && match[2].length === 11) {
			console.log('match[2]', match[2]);
			return match[2];
		} else {
			// Handle invalid URL or no match
			return null;
		}
	}

	getVideoIdFromEmbedUrl(url) {
		console.log('url2', url);
		const regExp = /^.*(?:youtu\.be\/|\/embed\/)([^#\&\?]*).*/;
		const match = url.match(regExp);

		if (match && match[1].length === 11) {
			console.log('match[2]', match[1]);
			return match[1];
		} else {
			// Handle invalid URL or no match
			return null;
		}
	}

	selecteAssetAndDownloadFromGoogle(whatsAppAsset, index) {
		let asset;
		let payload = {
			fileId: whatsAppAsset.id,
			name: whatsAppAsset.name,
			assetType: this.assetTypeForLibaray,
		};
		this.spinnerService.show();
		this.dripService.checkAddDonwloadAssetFormGoogleDrive(payload).subscribe((res: any) => {
			if (res.success) {
				asset = res.data;
				if (this.selectedAssetForTheDrip.length > 0) {
					let temp = null;
					for (let i = 0; i < this.selectedAssetForTheDrip.length; i++) {
						if (this.selectedAssetForTheDrip[i].AssetId == asset.id) {
							temp = i;
						}
					}
					if (temp >= 0 && temp != null) {
						this.selectedAssetForTheDrip.splice(temp, 1);
						this.whatsAppHeaderAssetListByGoogleDrive[index].selected =
							!this.whatsAppHeaderAssetListByGoogleDrive[index].selected;
					} else {
						let payload = {
							title: asset.title,
							AssetId: asset.id,
							assetType: asset.field_name,
							path: asset.Asset_details[0].path,
							fileName: asset.Asset_details[0].name,
							isTranscoding: asset.Asset_details[0].isTranscoding,
							selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
							cmsVideoId: asset.Asset_details[0].cmsVideoId,
						};
						if (this.selectedAssetForTheDrip.length < 10) {
							this.selectedAssetForTheDrip.push(payload);
						} else {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notselectmorethanTen'),
								this.appService.getTranslation('Utils.error')
							);
							return;
						}
						this.whatsAppHeaderAssetListByGoogleDrive[index].selected =
							!this.whatsAppHeaderAssetListByGoogleDrive[index].selected;
					}
				} else {
					let payload = {
						title: asset.title,
						AssetId: asset.id,
						assetType: asset.field_name,
						path: asset.Asset_details[0].path,
						fileName: asset.Asset_details[0].name,
						isTranscoding: asset.Asset_details[0].isTranscoding,
						selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
						cmsVideoId: asset.Asset_details[0].cmsVideoId,
					};
					this.selectedAssetForTheDrip.push(payload);
					this.whatsAppHeaderAssetListByGoogleDrive[index].selected =
						!this.whatsAppHeaderAssetListByGoogleDrive[index].selected;
				}

				if (
					this.selectedTemplateType == 'Single Image' ||
					this.selectedTemplateType == 'Video' ||
					this.selectedTemplateType == 'Quiz' ||
					this.selectedTemplateType == 'Quiz (Randomised)' ||
					this.selectedTemplateType == 'Poll' ||
					this.selectedTemplateType == 'Offline Task' ||
					this.selectedTemplateType == 'Survey'
				) {
					this.cancelMediaPopUp();
				}
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	selectExistingDrip(drip) {
		// let selectedDripId;
		// selectedDripId = this.existingDripId;
		this.DripQuestions = [];
		if (this.selectedDripType == 2) {
			this.whatsUpNonNativeForm.controls['caption'].setValue(drip.caption);
			this.whatsUpNonNativeForm.controls['brief'].setValue(drip.brief);
			this.whatsUpNonNativeForm.controls['pwaheadtxt'].setValue(drip.pwaheadtxt);
			this.whatsUpNonNativeForm.controls['submitText'].setValue(drip.submitText);
		} else if (this.selectedDripType == 3) {
			this.emailNoneNativeForm.controls['caption'].setValue(drip.caption);
			this.emailNoneNativeForm.controls['brief'].setValue(drip.brief);
			this.emailNoneNativeForm.controls['pwaheadtxt'].setValue(drip.pwaheadtxt);
			this.emailNoneNativeForm.controls['submitText'].setValue(drip.submitText);
		} else if (this.selectedDripType == 4) {
			this.dripNativeForm.controls['caption'].setValue(drip.caption);
			this.dripNativeForm.controls['brief'].setValue(drip.brief);
			this.dripNativeForm.controls['pwaheadtxt'].setValue(drip.pwaheadtxt);
			this.dripNativeForm.controls['submitText'].setValue(drip.submitText);
		} else if (this.selectedDripType == 6) {
			this.dripSharingOnTeamsForm.controls['caption'].setValue(drip.caption);
			this.dripSharingOnTeamsForm.controls['brief'].setValue(drip.brief);
			this.dripSharingOnTeamsForm.controls['pwaheadtxt'].setValue(drip.pwaheadtxt);
			this.dripSharingOnTeamsForm.controls['submitText'].setValue(drip.submitText);
		}

		if (drip.Assets && drip.Assets.length > 0) {
			this.selectedAssetForTheDrip = [];
			for (let asset of drip.Assets) {
				let payload = {
					title: asset.title,
					AssetId: asset.id,
					assetType: asset.Asset_details[0].fieldname,
					path: asset.Asset_details[0].path,
					fileName: asset.Asset_details[0].name,
					isTranscoding: asset.Asset_details[0].isTranscoding,
					selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
					cmsVideoId: asset.Asset_details[0].cmsVideoId,
				};
				this.selectedAssetForTheDrip.push(payload);
			}
		}

		if (drip.Post_brief_assets && drip.Post_brief_assets.length > 0) {
			this.selectedAssetForTheDrip = [];
			for (let asset of drip.Post_brief_assets) {
				let payload = {
					title: asset.title,
					AssetId: asset.id,
					assetType: asset.Asset_details[0].fieldname,
					path: asset.Asset_details[0].path,
					fileName: asset.Asset_details[0].name,
					isTranscoding: asset.Asset_details[0].isTranscoding,
					selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
					forPreview: this.forBriefPreview,
					cmsVideoId: asset.Asset_details[0].cmsVideoId,
				};
				this.selectedAssetForOfflineTaskBrief.push(payload);
			}
			console.log(
				'--selectedAssetForOfflineTaskBrief----selectedAssetForOfflineTaskBrief--',
				this.selectedAssetForOfflineTaskBrief
			);
		}

		if (drip && drip.DripQuestions && drip.DripQuestions.length > 0) {
			this.DripQuestions = [];
			for (let question of drip.DripQuestions) {
				let payload = {
					question: question.question,
					characterRemainsForQuestion: null,
					characterRemainsForGeoTag: null,
					characterRemainsForMinLable: null,
					characterRemainsForMaxLable: null,
					AssetId: question.AssetId,
					filePath:
						question && question.Asset && question.Asset.Asset_details && question.Asset.Asset_details[0].path
							? question.Asset.Asset_details[0].path
							: null,
					fileName:
						question && question.Asset && question.Asset.Asset_details && question.Asset.Asset_details[0].name
							? question.Asset.Asset_details[0].name
							: null,
					fileType:
						question && question.Asset && question.Asset.Asset_details && question.Asset.Asset_details[0].fieldname
							? question.Asset.Asset_details[0].fieldname
							: null,
					cmsVideoId: question?.Asset?.Asset_details[0]?.cmsVideoId ? question.Asset.Asset_details[0].cmsVideoId : null,
					questionType: question.questionType,
					selectAnswer: false,
					answerCount: 1,
					isTranscoding: false,
					selfHostedVideo: false,
					isQuestionSelected: false,
					DripOptions: [],
					isTextResponse: true,
					isFileSubmission: false,
					showTranscript: false,
					aiReview: false,
					expectedAnswer: null,
					allowFileTypes: null,
					numberOfFiles: 1,
					isAnswerSelected: false,
					surveyCharLimit: null,
					multipleOption: false,
					ratingScaleMinCount: 1,
					ratingScaleMaxCount: 2,
					isQuesRequired: true,
					UploadOnVimeo: true,
					zoomLinkTo: null,
					spinCatIndex: null,
					spinQueScore: 0,
					isSpinQueScore: false,
					ratingMinLabel: null,
					ratingMaxLabel: null,
					ratingType: 'Box',
					userRatingArray: [],
				};

				//Question Video Transcoding
				if (question && question.Asset && question.Asset.Asset_details && question.Asset.Asset_details.length > 0) {
					payload.isTranscoding = question.Asset.Asset_details[0].isTranscoding;
					payload.selfHostedVideo = question.Asset.Asset_details[0].selfHostedVideo;
				}
				if (question && question.DripOptions && question.DripOptions.length > 0) {
					for (let option of question.DripOptions) {
						let optionPayload = {
							text: option.text,
							filePath:
								option && option.Asset && option.Asset.Asset_details && option.Asset.Asset_details[0].path
									? option.Asset.Asset_details[0].path
									: null,
							fileName:
								option && option.Asset && option.Asset.Asset_details && option.Asset.Asset_details[0].name
									? option.Asset.Asset_details[0].name
									: null,
							fileType:
								option && option.Asset && option.Asset.Asset_details && option.Asset.Asset_details[0].fieldname
									? option.Asset.Asset_details[0].fieldname
									: null,
							cmsVideoId: option?.Asset?.Asset_details[0]?.cmsVideoId ? option.Asset.Asset_details[0].cmsVideoId : null,
							AssetId: option.AssetId,
							isCorrectAnswer: option.isCorrectAnswer,
							characterRemainsForOption: null,
						};
						payload.DripOptions.push(optionPayload);
					}
				}

				this.DripQuestions.push(payload);
			}
		}

		// if (dripType == 2) {
		//     this.whatsUpNonNativeForm.controls['existingDripId'].setValue(this.existingDripId);
		// } else if (dripType == 3) {
		//     this.emailNoneNativeForm.controls['existingDripId'].setValue(this.existingDripId);
		// } else if (dripType == 4) {
		//     this.dripNativeForm.controls['existingDripId'].setValue(this.existingDripId);
		// }

		// for (let drip of this.allDripListForUseExisting) {
		//     if (drip.id == selectedDripId) {
		//         flag = true;
		//         hyper_link = `${environment.appUrl}?dripId=${drip.Client.client_id + '-' + drip.id
		//             }`;
		//     }
		// }
		// if (!flag) {
		//     hyper_link = null;
		// }
		// if (dripType == 2) {
		//     this.whatsUpNonNativeForm.controls['hyper_link'].setValue(hyper_link);
		// } else if (dripType == 3) {
		//     this.emailNoneNativeForm.controls['hyper_link'].setValue(hyper_link);
		// } else if (dripType == 4) {
		//     if (this.dripNativeForm.controls['contentType'].value == 'Use Existing Drip' ) {
		//         this.whatsUpNonNativeForm.controls['hyper_link'].setValue( hyper_link );
		//         this.emailNoneNativeForm.controls['hyper_link'].setValue( hyper_link );
		//     }
		// }
	}

	clearHyperLink(dripType) {
		if (dripType == 2) {
			this.whatsUpNonNativeForm.controls['hyper_link'].setValue(null);
		} else if (dripType == 3) {
			this.emailNoneNativeForm.controls['hyper_link'].setValue(null);
		} else if (dripType == 4) {
			this.dripNativeForm.controls['hyper_link'].setValue(null);
		}
	}

	setOtherDripType(dripType) {
		if (dripType == 2) {
			if (this.whatsUpNonNativeForm.invalid) {
				this.whatsUpNonNativeForm.controls['OtherDripType'].setValue(false);
				this.toastr.warning(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.requiredError'),
					this.appService.getTranslation('Utils.warning')
				);
			} else {
				// this.createEmailNonNativeForm();
			}
		} else if (dripType == 3) {
			if (this.emailNoneNativeForm.invalid) {
				this.toastr.warning(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.requiredError'),
					this.appService.getTranslation('Utils.warning')
				);
				this.emailNoneNativeForm.controls['OtherDripType'].setValue(false);
			} else {
				if (this.whatsAppSetupData) {
					this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(null);
					this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
				} else {
					$('#whatsAppSetupWarningPopup').modal('show');
					this.emailNoneNativeForm.controls['OtherDripType'].setValue(false);
				}
			}
		} else if (dripType == 4) {
			if (this.dripNativeForm.invalid) {
				this.toastr.warning(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.requiredError'),
					this.appService.getTranslation('Utils.warning')
				);
				this.dripNativeForm.controls['OtherDripType'].setValue(false);
			} else {
				if (this.whatsAppSetupData) {
					this.whatsUpNativeForm.controls['WhatsAppSetupId'].setValue(null);
					this.whatsUpNonNativeForm.controls['WhatsAppSetupId'].setValue(this.whatsAppSetupData.id);
				} else {
					$('#whatsAppSetupWarningPopup').modal('show');
					this.dripNativeForm.controls['OtherDripType'].setValue(false);
				}
			}
		}
	}

	selectHeaderType(type, dripType) {
		if (dripType == 'Native') {
			this.whatsUpNativeForm.controls['AssetId'].setValue(null);
			this.whatsUpNativeForm.controls['headerFileName'].setValue(null);
			this.whatsUpNativeForm.controls['headerPath'].setValue(null);
			this.whatsUpNonNativeForm.controls['header_type'].setValue(null);
		} else {
			this.whatsUpNonNativeForm.controls['AssetId'].setValue(null);
			this.whatsUpNonNativeForm.controls['headerFileName'].setValue(null);
			this.whatsUpNonNativeForm.controls['headerPath'].setValue(null);
			this.whatsUpNativeForm.controls['header_type'].setValue(null);
		}
		if (type != 'None' && type != 'Text') {
			// this.getAllAssetByType(this.selectedClientId, type);
			// this.getAssetsFilter(this.selectedClientId, type);
			this.typeForSearch = type;
		}
	}

	getAllAssetByClient(clientId) {
		this.assetService.getAllAssetsByBuyerForPost(clientId).subscribe((res: any) => {
			if (res.success) {
				this.allAssetsForDrip = [];
				this.allAssetsForDrip = res.data;
			}
		});
	}

	onFileSelect(input) {
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			reader.onload = (e: any) => {
				this.fileValue = e.target.result;
			};
			reader.readAsDataURL(input.files[0]);
		}
	}

	getAllPostByClient(clientId) {
		this.dripService.getAllPostsByClientForUseExsitingPost(clientId).subscribe((res: any) => {
			if (res.success) {
				this.allPostList = [];
				this.allPostList = res.data;
			}
		});
	}

	saveDrip(isPublish) {
		// Add Validation First
		// Add Status of Drip And WhatsApp Templete

		if (this.selectedDripType == 1) {
			this.whatsUpNonNativeForm.reset();
			// this.dripNativeForm.reset();
			this.emailNoneNativeForm.reset();
			this.dripOnlyTeamsForm.reset();
			this.dripSharingOnTeamsForm.reset();
			this.onlyEmailForm.reset();
		} else if (this.selectedDripType == 2) {
			if (this.whatsUpNonNativeForm.controls['OtherDripType'].value == true) {
				this.emailNoneNativeForm.patchValue(this.whatsUpNonNativeForm.value);
				this.emailNoneNativeForm.controls['OtherDripType'].setValue(null);
				this.whatsUpNativeForm.reset();
				// this.dripNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			} else {
				this.whatsUpNativeForm.reset();
				// this.dripNativeForm.reset();
				this.emailNoneNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			}
		} else if (this.selectedDripType == 7) {
			this.whatsUpNonNativeForm.reset();
			this.whatsUpNativeForm.reset();
			// this.dripNativeForm.reset();
			this.dripOnlyTeamsForm.reset();
			this.dripSharingOnTeamsForm.reset();
			this.emailNoneNativeForm.reset();
		} else if (this.selectedDripType == 3) {
			if (this.emailNoneNativeForm.controls['OtherDripType'].value == true) {
				this.whatsUpNonNativeForm.patchValue(this.emailNoneNativeForm.value);
				this.whatsUpNonNativeForm.controls['OtherDripType'].setValue(null);
				this.whatsUpNativeForm.reset();
				// this.dripNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			} else {
				// this.whatsUpNonNativeForm.reset();
				this.whatsUpNativeForm.reset();
				// this.dripNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			}
		} else if (this.selectedDripType == 4) {
			if (this.dripNativeForm.controls['OtherDripType'].value == true) {
				this.emailNoneNativeForm.patchValue(this.dripNativeForm.value);
				this.whatsUpNonNativeForm.patchValue(this.dripNativeForm.value);
				this.emailNoneNativeForm.controls['OtherDripType'].setValue(null);
				this.whatsUpNonNativeForm.controls['OtherDripType'].setValue(null);
				this.whatsUpNativeForm.reset();
				this.emailNoneNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			} else {
				this.whatsUpNativeForm.reset();
				this.emailNoneNativeForm.reset();
				this.whatsUpNonNativeForm.reset();
				this.dripOnlyTeamsForm.reset();
				this.dripSharingOnTeamsForm.reset();
				this.onlyEmailForm.reset();
			}
		} else if (this.selectedDripType == 5) {
			this.whatsUpNativeForm.reset();
			this.whatsUpNonNativeForm.reset();
			// this.dripNativeForm.reset();
			this.emailNoneNativeForm.reset();
			this.dripSharingOnTeamsForm.reset();
			this.onlyEmailForm.reset();
		} else if (this.selectedDripType == 6) {
			this.whatsUpNativeForm.reset();
			// this.whatsUpNonNativeForm.reset();
			// this.emailNoneNativeForm.reset();
			// this.dripNativeForm.reset();
			this.dripOnlyTeamsForm.reset();
			this.onlyEmailForm.reset();
		}

		if (isPublish) {
			// For Publish Drip
			if (this.selectedDripType == 1 || this.selectedDripType == 2) {
				this.dripForm.controls['drip_status'].setValue('PFA');
			} else if (this.selectedDripType == 3 || this.selectedDripType == 4) {
				if (
					this.emailNoneNativeForm.controls['OtherDripType'].value == true ||
					this.dripNativeForm.controls['OtherDripType'].value == true
				) {
					this.dripForm.controls['drip_status'].setValue('PFA');
				} else {
					this.dripForm.controls['drip_status'].setValue('Published');
				}
			}

			if (this.selectedDripType == 5 || this.selectedDripType == 6 || this.selectedDripType == 7) {
				this.dripForm.controls['drip_status'].setValue('Published');
			}

			if (!this.dripForm.controls['id'].value) {
				this.whatsUpNativeForm.controls['templateStatus'].setValue('Not Created');
				this.whatsUpNonNativeForm.controls['templateStatus'].setValue('Not Created');
			}
			if (!this.dripForm.controls['id'].value) {
				this.whatsUpNativeForm.controls['templateId'].setValue(null);
				this.whatsUpNonNativeForm.controls['templateId'].setValue(null);
			}

			// Need to thinking about WhatsApp Templete Status when create and Edit
		} else {
			// For Draft Drip
			this.dripForm.controls['drip_status'].setValue('Draft');
			if (!this.dripForm.controls['id'].value) {
				this.whatsUpNativeForm.controls['templateStatus'].setValue('Not Created');
				this.whatsUpNonNativeForm.controls['templateStatus'].setValue('Not Created');
			}
			if (!this.dripForm.controls['id'].value) {
				this.whatsUpNativeForm.controls['templateId'].setValue(null);
				this.whatsUpNonNativeForm.controls['templateId'].setValue(null);
			}
		}

		//Check For asset is Not Seleted or Not
		if (this.selectedDripType == 2 && this.whatsUpNonNativeForm.controls['contentType'].value == 'Create New Drip') {
			if (
				this.selectedAssetForTheDrip &&
				this.selectedAssetForTheDrip[0] &&
				this.selectedAssetForTheDrip[0].AssetId == null
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.assetnotselected'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else if (
			this.selectedDripType == 3 &&
			this.emailNoneNativeForm.controls['contentType'].value == 'Create New Drip'
		) {
			if (
				this.selectedAssetForTheDrip &&
				this.selectedAssetForTheDrip[0] &&
				this.selectedAssetForTheDrip[0].AssetId == null
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.assetnotselected'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else if (this.selectedDripType == 4 && this.dripNativeForm.controls['contentType'].value == 'Create New Drip') {
			if (
				this.selectedAssetForTheDrip &&
				this.selectedAssetForTheDrip[0] &&
				this.selectedAssetForTheDrip[0].AssetId == null
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.assetnotselected'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else if (
			this.selectedDripType == 6 &&
			this.dripSharingOnTeamsForm.controls['contentType'].value == 'Create New Drip'
		) {
			if (
				this.selectedAssetForTheDrip &&
				this.selectedAssetForTheDrip[0] &&
				this.selectedAssetForTheDrip[0].AssetId == null
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.assetnotselected'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		if (this.selectedAssetForTheDrip && this.selectedAssetForTheDrip.length > 0) {
			for (let i in this.selectedAssetForTheDrip) {
				for (let j in this.selectedAssetForTheDrip) {
					if (this.selectedAssetForTheDrip[j].AssetId == this.selectedAssetForTheDrip[i].AssetId && i != j) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.duplicateassetdetected'),
							this.appService.getTranslation('Utils.error')
						);
						return;
					}
				}
			}
		}

		if (this.whatsUpNonNativeForm.controls['contentType'].value == 'Use Existing Drip') {
			this.selectedAssetForTheDrip = [];
		}
		if (this.emailNoneNativeForm.controls['contentType'].value == 'Use Existing Drip') {
			this.selectedAssetForTheDrip = [];
		}
		if (this.dripSharingOnTeamsForm.controls['contentType'].value == 'Use Existing Drip') {
			this.selectedAssetForTheDrip = [];
		}
		// if (this.dripNativeForm.controls["contentType"].value == "Use Existing Drip") {
		//     console.log('---3---',this.dripNativeForm.controls["contentType"].value);
		//     this.selectedAssetForTheDrip = [];
		// }
		this.whatsUpNativeForm.controls['hyper_link'].enable();
		this.whatsUpNativeForm.controls['hyper_link2'].enable();
		this.whatsUpNativeForm.controls['zoomMeetLink'].enable();
		this.whatsUpNativeForm.controls['zoomMeetLink2'].enable();

		this.whatsUpNonNativeForm.controls['hyper_link'].enable();
		this.emailNoneNativeForm.controls['hyper_link'].enable();
		this.dripForm.controls['drip_type'].enable();
		this.whatsUpNativeForm.controls['tempCategory'].enable();
		this.whatsUpNonNativeForm.controls['tempCategory'].enable();

		this.dripSharingOnTeamsForm.controls['hyper_link'].enable();

		// Validation
		let flag = false;
		if (this.dripForm.invalid) {
			this.markAsTouched(this.dripForm);

			flag = true;
		}
		if (this.selectedDripType == 1) {
			if (this.whatsUpNativeForm.invalid) {
				this.markAsTouched(this.whatsUpNativeForm);

				flag = true;
			}

			for (let item of this.selectedInteractionArrayData) {
				if (this.whatsUpNativeForm.controls[item].value == null || this.whatsUpNativeForm.controls[item].value == '') {
					this.whatsUpNativeForm.controls[item].setErrors({ required: true });
					this.whatsUpNativeForm.controls[item].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if (item === 'callToActionText') {
					if (
						this.whatsUpNativeForm.controls['hyper_link'].value == null ||
						this.whatsUpNativeForm.controls['hyper_link'].value == ''
					) {
						flag = true;
					}
				}

				if (item === 'callToActionText2') {
					if (
						this.whatsUpNativeForm.controls['hyper_link2'].value == null ||
						this.whatsUpNativeForm.controls['hyper_link2'].value == ''
					) {
						flag = true;
					}
				}

				if (item === 'callphonetext') {
					if (
						this.whatsUpNativeForm.controls['callphoneno'].value == null ||
						this.whatsUpNativeForm.controls['callphoneno'].value == ''
					) {
						this.whatsUpNativeForm.controls['callphoneno'].setErrors({ required: true });
						this.whatsUpNativeForm.controls['callphoneno'].markAsTouched({ onlySelf: true });
						flag = true;
					}
				}

				if (item === 'zoomMeetLink') {
					if (
						this.whatsUpNativeForm.controls['zoomMeetLink'].value == null ||
						this.whatsUpNativeForm.controls['zoomMeetLink'].value == '' ||
						this.whatsUpNativeForm.controls['callToActionZoomText'].value == null ||
						this.whatsUpNativeForm.controls['callToActionZoomText'].value == ''
					) {
						flag = true;
					}
				}

				if (item === 'zoomMeetLink2') {
					if (
						this.whatsUpNativeForm.controls['zoomMeetLink2'].value == null ||
						this.whatsUpNativeForm.controls['zoomMeetLink2'].value == '' ||
						this.whatsUpNativeForm.controls['callToActionZoomText2'].value == null ||
						this.whatsUpNativeForm.controls['callToActionZoomText2'].value == ''
					) {
						flag = true;
					}
				}
			}

			//Hearder Type
			if (
				this.whatsUpNativeForm.controls['header_type'].value == 'Image' ||
				this.whatsUpNativeForm.controls['header_type'].value == 'Video' ||
				this.whatsUpNativeForm.controls['header_type'].value == 'Document'
			) {
				if (
					this.whatsUpNativeForm.controls['headerPath'].value == null ||
					this.whatsUpNativeForm.controls['headerPath'].value == '' ||
					this.whatsUpNativeForm.controls['headerFileName'].value == '' ||
					this.whatsUpNativeForm.controls['headerFileName'].value == ''
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.headerTypeAsset'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
				}
			} else if (this.whatsUpNativeForm.controls['header_type'].value == 'Text') {
				if (
					this.whatsUpNativeForm.controls['header_text'].value == null ||
					this.whatsUpNativeForm.controls['header_text'].value == ''
				) {
					this.whatsUpNativeForm.controls['header_text'].setErrors({ required: true });
					this.whatsUpNativeForm.controls['header_text'].markAsTouched({ onlySelf: true });
				}
			}

			//location validation
			if (this.whatsUpNativeForm.controls['header_type'].value == 'Location') {
				if (
					this.whatsUpNativeForm.controls['longitude'].value == null ||
					this.whatsUpNativeForm.controls['longitude'].value == ''
				) {
					this.whatsUpNativeForm.controls['longitude'].setErrors({ required: true });
					this.whatsUpNativeForm.controls['longitude'].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if (
					this.whatsUpNativeForm.controls['latitude'].value == null ||
					this.whatsUpNativeForm.controls['latitude'].value == ''
				) {
					this.whatsUpNativeForm.controls['latitude'].setErrors({ required: true });
					this.whatsUpNativeForm.controls['latitude'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNativeForm.controls['locName'].value == null ||
					this.whatsUpNativeForm.controls['locName'].value == ''
				) {
					this.whatsUpNativeForm.controls['locName'].setErrors({ required: true });
					this.whatsUpNativeForm.controls['locName'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNativeForm.controls['address'].value == null ||
					this.whatsUpNativeForm.controls['address'].value == ''
				) {
					this.whatsUpNativeForm.controls['address'].setErrors({ required: true });
					this.whatsUpNativeForm.controls['address'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}
		} else if (this.selectedDripType == 2) {
			if (this.whatsUpNonNativeForm.invalid) {
				this.markAsTouched(this.whatsUpNonNativeForm);
				flag = true;
			}
			if (this.whatsUpNonNativeForm.controls['interaction'].value == 'Call to Action') {
				if (
					this.whatsUpNonNativeForm.controls['callToActionText'].value == null ||
					this.whatsUpNonNativeForm.controls['callToActionText'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['callToActionText'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['callToActionText'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			} else {
				flag = false;
			}

			//Hearder Type
			if (
				this.whatsUpNonNativeForm.controls['header_type'].value == 'Image' ||
				this.whatsUpNonNativeForm.controls['header_type'].value == 'Video' ||
				this.whatsUpNonNativeForm.controls['header_type'].value == 'Document'
			) {
				if (
					this.whatsUpNonNativeForm.controls['headerPath'].value == null ||
					this.whatsUpNonNativeForm.controls['headerPath'].value == '' ||
					this.whatsUpNonNativeForm.controls['headerFileName'].value == '' ||
					this.whatsUpNonNativeForm.controls['headerFileName'].value == null
				) {
					// Please select Image / Video / Document File
					flag = true;
				}
			} else if (this.whatsUpNonNativeForm.controls['header_type'].value == 'Text') {
				if (
					this.whatsUpNonNativeForm.controls['header_text'].value == null ||
					this.whatsUpNonNativeForm.controls['header_text'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['header_text'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['header_text'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}

			//location validation
			if (this.whatsUpNonNativeForm.controls['header_type'].value == 'Location') {
				if (
					this.whatsUpNonNativeForm.controls['longitude'].value == null ||
					this.whatsUpNonNativeForm.controls['longitude'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['longitude'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['longitude'].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if (
					this.whatsUpNonNativeForm.controls['latitude'].value == null ||
					this.whatsUpNonNativeForm.controls['latitude'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['latitude'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['latitude'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['locName'].value == null ||
					this.whatsUpNonNativeForm.controls['locName'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['locName'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['locName'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['address'].value == null ||
					this.whatsUpNonNativeForm.controls['address'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['address'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['address'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}

			//drip Nativ Validation
			if (
				this.whatsUpNonNativeForm.controls['contentType'].value == '' ||
				this.whatsUpNonNativeForm.controls['contentType'].value == null
			) {
				flag = true;
			} else if (this.whatsUpNonNativeForm.controls['contentType'].value == 'Create New Drip') {
				if (
					this.whatsUpNonNativeForm.controls['templateType'].value == '' ||
					this.whatsUpNonNativeForm.controls['templateType'].value == null
				) {
					this.whatsUpNonNativeForm.controls['templateType'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['templateType'].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Single Image') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						this.captionImageRequired = true;
						//Please Select One Image Asset
						flag = true;
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Carousel') {
					if (this.selectedAssetForTheDrip.length <= 1) {
						//Please Select 2 more More Images for Carousel
						flag = true;
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Video') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						this.captionImageRequired = true;
						//Please Select One Video Asset
						flag = true;
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Poll') {
					// if (this.DripQuestions.length <= 0) {
					//     //Please Add Poll Question
					//     flag = true;
					// } else {
					//     for (let poll of this.DripQuestions) {
					//         if (poll.DripOptions.length <= 1) {
					//             flag = true;
					//         } else {
					//             for (let option of poll.DripOptions) {
					//                 if (option.text == null || option.text == '') {
					//                     flag = true;
					//                 }
					//             }
					//         }
					//     }
					// }

					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}
						}
					}
				} else if (
					this.whatsUpNonNativeForm.controls['templateType'].value == 'Quiz' ||
					this.whatsUpNonNativeForm.controls['templateType'].value == 'Quiz (Randomised)'
				) {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (this.whatsUpNonNativeForm.controls['showCorrectAns'].value == true) {
						if (
							this.whatsUpNonNativeForm.controls['quizResultType'].value == '' ||
							this.whatsUpNonNativeForm.controls['quizResultType'].value == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizResultType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						} else if (
							this.whatsUpNonNativeForm.controls['quizResultType'].value == 'After the Deadline' &&
							(this.whatsUpNonNativeForm.controls['timehours'].value == '' ||
								this.whatsUpNonNativeForm.controls['timehours'].value == null)
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizAfterDeadlineTime'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						let answerIsPresent = false;

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}

							if (option.isCorrectAnswer) {
								answerIsPresent = true;
							}
						}

						if (!answerIsPresent && question.questionType == 'MCQ') {
							// this.toastr.error(
							// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectAnswer'),
							// 	this.appService.getTranslation('Utils.error')
							// );
							if ((question.isAnswerSelected = true)) {
								flag = true;
							}
						}
					}

					if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Quiz (Randomised)') {
						if (
							this.whatsUpNonNativeForm.controls['quizRandCount'].value == '' ||
							this.whatsUpNonNativeForm.controls['quizRandCount'].value == null ||
							this.whatsUpNonNativeForm.controls['quizRandCount'].value == undefined
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.randmonQuestionCount'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}

						if (this.whatsUpNonNativeForm.controls['quizRandCount'].value > this.DripQuestions.length) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.addTotalRandomQuestion'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Offline Task') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (
						this.whatsUpNonNativeForm.controls['brief'].value == '' ||
						this.whatsUpNonNativeForm.controls['brief'].value == null ||
						this.whatsUpNonNativeForm.controls['brief'].value == undefined
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectTaskBrief'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (!question.isTextResponse && !question.isFileSubmission) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.textOrfileSubmission'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}

						if (
							question.isFileSubmission &&
							question.questionType == 'Text and File Input' &&
							question.allowFileTypes == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Survey') {
					// if (this.selectedAssetForTheDrip.length <= 0) {
					// 	this.toastr.error(
					// 		this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 		this.appService.getTranslation('Utils.error')
					// 	);
					// 	flag = true;
					// }

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (question.questionType == 'MCQ' || question.questionType == 'Drop Down') {
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}
							}
						}

						if (question.questionType == 'File upload') {
							if (question.allowFileTypes == null || question.allowFileTypes == '') {
								{
									this.toastr.error(
										this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
										this.appService.getTranslation('Utils.error')
									);
									flag = true;
								}
							}
						}
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Spin The Wheel') {
					if (this.spinWheelQueCategory && this.spinWheelQueCategory.length > 0) {
						let noOfQuesForCategory = this.whatsUpNonNativeForm.controls['noOfQueForCat'].value;
						let noOfTimeSpinWheel = this.whatsUpNonNativeForm.controls['noOfTimeSpin'].value;

						for (let spinCat of this.spinWheelQueCategory) {
							let spinCategory = spinCat;

							if (
								spinCategory.category_name == null ||
								spinCategory.category_name == undefined ||
								spinCategory.category_name == ''
							) {
								flag = true;
							}

							if (spinCategory.totalquestion < noOfQuesForCategory) {
								spinCategory.isError = true;
								spinCategory.remainQuestionToAdd = noOfQuesForCategory - spinCategory.totalquestion;
								this.toastr.error(
									this.appService.getTranslation('Pages.Workbook.AddEdit.Toaster.noOfQuestionForEachCat'),
									this.appService.getTranslation('Utils.error')
								);
								flag = true;
							} else {
								spinCategory.isError = false;
								spinCategory.remainQuestionToAdd = 0;
							}
						}

						for (let question of this.DripQuestions) {
							if (
								this.whatsUpNonNativeForm.controls['templateType'].value == 'Spin The Wheel' &&
								question.spinQueScore <= 0
							) {
								question.isSpinQueScore = true;
								flag = true;
							}

							if (!question.questionType || !question.question) {
								question.isQuestionSelected = true;
								flag = true;
							}

							let answerIsPresent = false;
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}

								if (option.isCorrectAnswer) {
									answerIsPresent = true;
								}
							}
							if (!answerIsPresent && question.questionType == 'MCQ') {
								if ((question.isAnswerSelected = true)) {
									flag = true;
								}
							}
						}

						//check for spin wheel template type
						if (
							noOfQuesForCategory == 0 ||
							noOfQuesForCategory == '' ||
							noOfQuesForCategory == null ||
							noOfQuesForCategory == undefined
						) {
							this.isZeroSpinQuesCategory = true;
							flag = true;
						}

						if (
							noOfTimeSpinWheel == 0 ||
							noOfTimeSpinWheel == '' ||
							noOfTimeSpinWheel == null ||
							noOfTimeSpinWheel == undefined
						) {
							this.noOfTimeSpinWheelError = true;
							flag = true;
						}

						if (this.spinWheelQueCategory.length < 2) {
							this.addMinTwoSpinCategory = true;
							flag = true;
						}

						if (noOfTimeSpinWheel + 2 > this.spinWheelQueCategory.length) {
							this.spinCatCountGreaterThanWheelCount = true;
							flag = true;
						}
					}
				} else if (this.whatsUpNonNativeForm.controls['templateType'].value == 'Custom Template') {
					for (let item of this.customTempPlaceholderArray) {
						if (item.inputText == null || item.inputText == '' || item.inputText == undefined) {
							item.isRequired = true;
							flag = true;
						}
					}
				}

				if (
					this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == '' ||
					this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == null ||
					this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == undefined
				) {
					if (
						this.whatsUpNonNativeForm.controls['caption'].value == '' ||
						this.whatsUpNonNativeForm.controls['caption'].value == null ||
						this.whatsUpNonNativeForm.controls['caption'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectcaption'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				} else if (
					this.whatsUpNonNativeForm.controls['caption'].value == '' ||
					this.whatsUpNonNativeForm.controls['caption'].value == null ||
					this.whatsUpNonNativeForm.controls['caption'].value == undefined
				) {
					if (
						this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == '' ||
						this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == null ||
						this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectheader'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				}
			} else if (this.whatsUpNonNativeForm.controls['contentType'].value == 'Use Existing Drip') {
				if (
					this.whatsUpNonNativeForm.controls['existingDripId'].value == null ||
					this.whatsUpNonNativeForm.controls['existingDripId'].value == ''
				) {
					this.whatsUpNonNativeForm.controls['existingDripId'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['existingDripId'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}

			// Toggle Validation
			if (this.whatsUpNonNativeForm.controls['OtherDripType'].value == true) {
				if (
					this.emailNoneNativeForm.controls['email_subject_line'].value == null ||
					this.emailNoneNativeForm.controls['email_subject_line'].value == ''
				) {
					this.emailNoneNativeForm.controls['email_subject_line'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['email_subject_line'].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if (
					this.emailNoneNativeForm.controls['email_body'].value == '' ||
					this.emailNoneNativeForm.controls['email_body'].value == null
				) {
					this.emailNoneNativeForm.controls['email_body'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['email_body'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}
		} else if (this.selectedDripType == 7) {
			if (this.onlyEmailForm.invalid) {
				this.markAsTouched(this.onlyEmailForm);
				flag = true;
			}
		} else if (this.selectedDripType == 3) {
			if (this.emailNoneNativeForm.invalid) {
				this.markAsTouched(this.emailNoneNativeForm);
				flag = true;
			}

			//drip Nativ Validation
			if (
				this.emailNoneNativeForm.controls['contentType'].value == '' ||
				this.emailNoneNativeForm.controls['contentType'].value == null
			) {
				flag = true;
			} else if (this.emailNoneNativeForm.controls['contentType'].value == 'Create New Drip') {
				if (
					this.emailNoneNativeForm.controls['templateType'].value == '' ||
					this.emailNoneNativeForm.controls['templateType'].value == null
				) {
					this.emailNoneNativeForm.controls['templateType'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['templateType'].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Single Image') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						this.captionImageRequired = true;
						//Please Select One Image Asset
						flag = true;
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Carousel') {
					if (this.selectedAssetForTheDrip.length <= 1) {
						//Please Select 2 more More Images for Carousel
						flag = true;
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Video') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						this.captionImageRequired = true;
						//Please Select One Video Asset
						flag = true;
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Poll') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}
						}
					}
				} else if (
					this.emailNoneNativeForm.controls['templateType'].value == 'Quiz' ||
					this.emailNoneNativeForm.controls['templateType'].value == 'Quiz (Randomised)'
				) {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (this.emailNoneNativeForm.controls['showCorrectAns'].value == true) {
						if (
							this.emailNoneNativeForm.controls['quizResultType'].value == '' ||
							this.emailNoneNativeForm.controls['quizResultType'].value == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizResultType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						} else if (
							this.emailNoneNativeForm.controls['quizResultType'].value == 'After the Deadline' &&
							(this.emailNoneNativeForm.controls['timehours'].value == '' ||
								this.emailNoneNativeForm.controls['timehours'].value == null)
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizAfterDeadlineTime'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						let answerIsPresent = false;

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}

							if (option.isCorrectAnswer) {
								answerIsPresent = true;
							}
						}

						if (!answerIsPresent && question.questionType == 'MCQ') {
							if ((question.isAnswerSelected = true)) {
								flag = true;
							}
						}
					}

					if (this.emailNoneNativeForm.controls['templateType'].value == 'Quiz (Randomised)') {
						if (
							this.emailNoneNativeForm.controls['quizRandCount'].value == '' ||
							this.emailNoneNativeForm.controls['quizRandCount'].value == null ||
							this.emailNoneNativeForm.controls['quizRandCount'].value == undefined
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.randmonQuestionCount'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}

						if (this.emailNoneNativeForm.controls['quizRandCount'].value > this.DripQuestions.length) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.addTotalRandomQuestion'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Offline Task') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (
						this.emailNoneNativeForm.controls['brief'].value == '' ||
						this.emailNoneNativeForm.controls['brief'].value == null ||
						this.emailNoneNativeForm.controls['brief'].value == undefined
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectTaskBrief'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (!question.isTextResponse && !question.isFileSubmission) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.textOrfileSubmission'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}

						if (
							question.isFileSubmission &&
							question.questionType == 'Text and File Input' &&
							question.allowFileTypes == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Survey') {
					// if (this.selectedAssetForTheDrip.length <= 0) {
					// 	this.toastr.error(
					// 		this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 		this.appService.getTranslation('Utils.error')
					// 	);
					// 	flag = true;
					// }

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (question.questionType == 'MCQ' || question.questionType == 'Drop Down') {
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}
							}
						}

						if (question.questionType == 'File upload') {
							if (question.allowFileTypes == null || question.allowFileTypes == '') {
								{
									this.toastr.error(
										this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
										this.appService.getTranslation('Utils.error')
									);
									flag = true;
								}
							}
						}
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Spin The Wheel') {
					if (this.spinWheelQueCategory && this.spinWheelQueCategory.length > 0) {
						let noOfQuesForCategory = this.emailNoneNativeForm.controls['noOfQueForCat'].value;
						let noOfTimeSpinWheel = this.emailNoneNativeForm.controls['noOfTimeSpin'].value;

						for (let spinCat of this.spinWheelQueCategory) {
							let spinCategory = spinCat;

							if (
								spinCategory.category_name == null ||
								spinCategory.category_name == undefined ||
								spinCategory.category_name == ''
							) {
								flag = true;
							}
							if (spinCategory.totalquestion < noOfQuesForCategory) {
								spinCategory.isError = true;
								spinCategory.remainQuestionToAdd = noOfQuesForCategory - spinCategory.totalquestion;
								this.toastr.error(
									this.appService.getTranslation('Pages.Workbook.AddEdit.Toaster.noOfQuestionForEachCat'),
									this.appService.getTranslation('Utils.error')
								);
								flag = true;
							} else {
								spinCategory.isError = false;
								spinCategory.remainQuestionToAdd = 0;
							}
						}

						for (let question of this.DripQuestions) {
							if (
								this.emailNoneNativeForm.controls['templateType'].value == 'Spin The Wheel' &&
								question.spinQueScore <= 0
							) {
								question.isSpinQueScore = true;
								flag = true;
							}

							if (!question.questionType || !question.question) {
								question.isQuestionSelected = true;
								flag = true;
							}

							let answerIsPresent = false;
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}

								if (option.isCorrectAnswer) {
									answerIsPresent = true;
								}
							}
							if (!answerIsPresent && question.questionType == 'MCQ') {
								if ((question.isAnswerSelected = true)) {
									flag = true;
								}
							}
						}

						//check for spin wheel template type
						if (
							noOfQuesForCategory == 0 ||
							noOfQuesForCategory == '' ||
							noOfQuesForCategory == null ||
							noOfQuesForCategory == undefined
						) {
							this.isZeroSpinQuesCategory = true;
							flag = true;
						}

						if (
							noOfTimeSpinWheel == 0 ||
							noOfTimeSpinWheel == '' ||
							noOfTimeSpinWheel == null ||
							noOfTimeSpinWheel == undefined
						) {
							this.noOfTimeSpinWheelError = true;
							flag = true;
						}

						if (this.spinWheelQueCategory.length < 2) {
							this.addMinTwoSpinCategory = true;
							flag = true;
						}

						if (noOfTimeSpinWheel + 2 > this.spinWheelQueCategory.length) {
							this.spinCatCountGreaterThanWheelCount = true;
							flag = true;
						}
					}
				} else if (this.emailNoneNativeForm.controls['templateType'].value == 'Custom Template') {
					for (let item of this.customTempPlaceholderArray) {
						if (item.inputText == null || item.inputText == '' || item.inputText == undefined) {
							item.isRequired = true;
							flag = true;
						}
					}
				}

				if (
					this.emailNoneNativeForm.controls['pwaheadtxt'].value == '' ||
					this.emailNoneNativeForm.controls['pwaheadtxt'].value == null ||
					this.emailNoneNativeForm.controls['pwaheadtxt'].value == undefined
				) {
					if (
						this.emailNoneNativeForm.controls['caption'].value == '' ||
						this.emailNoneNativeForm.controls['caption'].value == null ||
						this.emailNoneNativeForm.controls['caption'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectcaption'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				} else if (
					this.emailNoneNativeForm.controls['caption'].value == '' ||
					this.emailNoneNativeForm.controls['caption'].value == null ||
					this.emailNoneNativeForm.controls['caption'].value == undefined
				) {
					if (
						this.emailNoneNativeForm.controls['pwaheadtxt'].value == '' ||
						this.emailNoneNativeForm.controls['pwaheadtxt'].value == null ||
						this.emailNoneNativeForm.controls['pwaheadtxt'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectheader'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				}
			} else if (this.emailNoneNativeForm.controls['contentType'].value == 'Use Existing Drip') {
				if (
					this.emailNoneNativeForm.controls['existingDripId'].value == null ||
					this.emailNoneNativeForm.controls['existingDripId'].value == ''
				) {
					this.emailNoneNativeForm.controls['existingDripId'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['existingDripId'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}

			//If Toggle Is No
			// Toggle Validation
			if (this.emailNoneNativeForm.controls['OtherDripType'].value == true) {
				if (
					this.whatsUpNonNativeForm.controls['header_type'].value == '' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == null
				) {
					this.whatsUpNonNativeForm.controls['header_type'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['header_type'].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Image' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Video' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Document'
				) {
					if (
						this.whatsUpNonNativeForm.controls['headerPath'].value == null ||
						this.whatsUpNonNativeForm.controls['headerPath'].value == '' ||
						this.whatsUpNonNativeForm.controls['headerFileName'].value == '' ||
						this.whatsUpNonNativeForm.controls['headerFileName'].value == null
					) {
						// Please select Image / Video / Document File
						flag = true;
					}
				} else if (this.whatsUpNonNativeForm.controls['header_type'].value == 'Text') {
					if (
						this.whatsUpNonNativeForm.controls['header_text'].value == null ||
						this.whatsUpNonNativeForm.controls['header_text'].value == ''
					) {
						this.whatsUpNonNativeForm.controls['header_text'].setErrors({ required: true });
						this.whatsUpNonNativeForm.controls['header_text'].markAsTouched({ onlySelf: true });
						flag = true;
					}
				}

				if (
					this.whatsUpNonNativeForm.controls['tempCategory'].value == '' ||
					this.whatsUpNonNativeForm.controls['tempCategory'].value == null
				) {
					this.whatsUpNonNativeForm.controls['tempCategory'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['tempCategory'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['tempName'].value == '' ||
					this.whatsUpNonNativeForm.controls['tempName'].value == null
				) {
					this.whatsUpNonNativeForm.controls['tempName'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['tempName'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['body'].value == '' ||
					this.whatsUpNonNativeForm.controls['body'].value == null
				) {
					this.whatsUpNonNativeForm.controls['body'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['body'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}
		} else if (this.selectedDripType == 4) {
			if (this.dripNativeForm.invalid) {
				this.markAsTouched(this.dripNativeForm);
				flag = true;
			}

			if (
				this.dripNativeForm.controls['templateType'].value == '' ||
				this.dripNativeForm.controls['templateType'].value == null
			) {
				this.dripNativeForm.controls['templateType'].setErrors({ required: true });
				this.dripNativeForm.controls['templateType'].markAsTouched({ onlySelf: true });
				flag = true;
			} else if (this.dripNativeForm.controls['templateType'].value == 'Single Image') {
				if (this.selectedAssetForTheDrip.length <= 0) {
					//Please Select One Image Asset
					this.captionImageRequired = true;
					flag = true;
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Carousel') {
				if (this.selectedAssetForTheDrip.length <= 1) {
					//Please Select 2 more More Images for Carousel
					flag = true;
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Video') {
				if (this.selectedAssetForTheDrip.length <= 0) {
					//Please Select One Video Asset
					this.captionImageRequired = true;
					flag = true;
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Poll') {
				if (this.selectedAssetForTheDrip.length <= 0) {
					// this.toastr.error(
					// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 	this.appService.getTranslation('Utils.error')
					// );
					this.captionImageRequired = true;
					flag = true;
				}

				for (let question of this.DripQuestions) {
					if (!question.questionType || !question.question) {
						question.isQuestionSelected = true;
						flag = true;
					}

					for (let option of question.DripOptions) {
						if (option.text == null || option.text == '') {
							option.isOptionSelected = true;
							flag = true;
						}
					}
				}
			} else if (
				this.dripNativeForm.controls['templateType'].value == 'Quiz' ||
				this.dripNativeForm.controls['templateType'].value == 'Quiz (Randomised)'
			) {
				if (this.selectedAssetForTheDrip.length <= 0) {
					// this.toastr.error(
					// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 	this.appService.getTranslation('Utils.error')
					// );
					this.captionImageRequired = true;
					flag = true;
				}

				if (this.dripNativeForm.controls['showCorrectAns'].value == true) {
					if (
						this.dripNativeForm.controls['quizResultType'].value == '' ||
						this.dripNativeForm.controls['quizResultType'].value == null
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizResultType'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					} else if (
						this.dripNativeForm.controls['quizResultType'].value == 'After the Deadline' &&
						(this.dripNativeForm.controls['timehours'].value == '' ||
							this.dripNativeForm.controls['timehours'].value == null)
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizAfterDeadlineTime'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}
				}

				for (let question of this.DripQuestions) {
					if (!question.questionType || !question.question) {
						question.isQuestionSelected = true;
						flag = true;
					}

					let answerIsPresent = false;

					for (let option of question.DripOptions) {
						if (option.text == null || option.text == '') {
							option.isOptionSelected = true;
							flag = true;
						}

						if (option.isCorrectAnswer) {
							answerIsPresent = true;
						}
					}

					if (!answerIsPresent && question.questionType == 'MCQ') {
						if ((question.isAnswerSelected = true)) {
							flag = true;
						}
					}
				}

				if (this.dripNativeForm.controls['templateType'].value == 'Quiz (Randomised)') {
					if (
						this.dripNativeForm.controls['quizRandCount'].value == '' ||
						this.dripNativeForm.controls['quizRandCount'].value == null ||
						this.dripNativeForm.controls['quizRandCount'].value == undefined
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.randmonQuestionCount'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}

					if (this.dripNativeForm.controls['quizRandCount'].value > this.DripQuestions.length) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.addTotalRandomQuestion'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Offline Task') {
				if (this.selectedAssetForTheDrip.length <= 0) {
					// this.toastr.error(
					// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 	this.appService.getTranslation('Utils.error')
					// );
					this.captionImageRequired = true;
					flag = true;
				}

				if (
					this.dripNativeForm.controls['brief'].value == '' ||
					this.dripNativeForm.controls['brief'].value == null ||
					this.dripNativeForm.controls['brief'].value == undefined
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectTaskBrief'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
				}

				for (let question of this.DripQuestions) {
					if (!question.questionType || !question.question) {
						question.isQuestionSelected = true;
						flag = true;
					}

					if (!question.isTextResponse && !question.isFileSubmission) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.textOrfileSubmission'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
						break;
					}

					if (
						question.isFileSubmission &&
						question.questionType == 'Text and File Input' &&
						question.allowFileTypes == null
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
						break;
					}
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Survey') {
				// if (this.selectedAssetForTheDrip.length <= 0) {
				// 	this.toastr.error(
				// 		this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
				// 		this.appService.getTranslation('Utils.error')
				// 	);
				// 	flag = true;
				// }

				for (let question of this.DripQuestions) {
					if (!question.questionType || !question.question) {
						question.isQuestionSelected = true;
						flag = true;
					}

					if (question.questionType == 'MCQ' || question.questionType == 'Drop Down') {
						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}
						}
					}

					if (question.questionType == 'File upload') {
						if (question.allowFileTypes == null || question.allowFileTypes == '') {
							{
								this.toastr.error(
									this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
									this.appService.getTranslation('Utils.error')
								);
								flag = true;
							}
						}
					}
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Spin The Wheel') {
				if (this.spinWheelQueCategory && this.spinWheelQueCategory.length > 0) {
					let noOfQuesForCategory = this.dripNativeForm.controls['noOfQueForCat'].value;
					let noOfTimeSpinWheel = this.dripNativeForm.controls['noOfTimeSpin'].value;

					for (let spinCat of this.spinWheelQueCategory) {
						let spinCategory = spinCat;

						if (
							spinCategory.category_name == null ||
							spinCategory.category_name == undefined ||
							spinCategory.category_name == ''
						) {
							flag = true;
						}

						if (spinCategory.totalquestion < noOfQuesForCategory) {
							spinCategory.isError = true;
							spinCategory.remainQuestionToAdd = noOfQuesForCategory - spinCategory.totalquestion;
							this.toastr.error(
								this.appService.getTranslation('Pages.Workbook.AddEdit.Toaster.noOfQuestionForEachCat'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						} else {
							spinCategory.isError = false;
							spinCategory.remainQuestionToAdd = 0;
						}
					}

					for (let question of this.DripQuestions) {
						if (this.dripNativeForm.controls['templateType'].value == 'Spin The Wheel' && question.spinQueScore <= 0) {
							question.isSpinQueScore = true;
							flag = true;
						}

						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						let answerIsPresent = false;
						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}

							if (option.isCorrectAnswer) {
								answerIsPresent = true;
							}
						}
						if (!answerIsPresent && question.questionType == 'MCQ') {
							if ((question.isAnswerSelected = true)) {
								flag = true;
							}
						}
					}

					//check for spin wheel template type
					if (
						noOfQuesForCategory == 0 ||
						noOfQuesForCategory == '' ||
						noOfQuesForCategory == null ||
						noOfQuesForCategory == undefined
					) {
						this.isZeroSpinQuesCategory = true;
						flag = true;
					}

					if (
						noOfTimeSpinWheel == 0 ||
						noOfTimeSpinWheel == '' ||
						noOfTimeSpinWheel == null ||
						noOfTimeSpinWheel == undefined
					) {
						this.noOfTimeSpinWheelError = true;
						flag = true;
					}

					if (this.spinWheelQueCategory.length < 2) {
						this.addMinTwoSpinCategory = true;
						flag = true;
					}

					if (noOfTimeSpinWheel + 2 > this.spinWheelQueCategory.length) {
						this.spinCatCountGreaterThanWheelCount = true;
						flag = true;
					}
				}
			} else if (this.dripNativeForm.controls['templateType'].value == 'Custom Template') {
				for (let item of this.customTempPlaceholderArray) {
					if (item.inputText == null || item.inputText == '' || item.inputText == undefined) {
						item.isRequired = true;
						flag = true;
					}
				}
			}

			if (
				this.dripNativeForm.controls['pwaheadtxt'].value == '' ||
				this.dripNativeForm.controls['pwaheadtxt'].value == null ||
				this.dripNativeForm.controls['pwaheadtxt'].value == undefined
			) {
				if (
					this.dripNativeForm.controls['caption'].value == '' ||
					this.dripNativeForm.controls['caption'].value == null ||
					this.dripNativeForm.controls['caption'].value == undefined
				) {
					// this.toastr.error(
					// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectcaption'),
					// 	this.appService.getTranslation('Utils.error')
					// );
					this.pwaHeaderCaptionRequired = true;
					flag = true;
				}
			} else if (
				this.dripNativeForm.controls['caption'].value == '' ||
				this.dripNativeForm.controls['caption'].value == null ||
				this.dripNativeForm.controls['caption'].value == undefined
			) {
				if (
					this.dripNativeForm.controls['pwaheadtxt'].value == '' ||
					this.dripNativeForm.controls['pwaheadtxt'].value == null ||
					this.dripNativeForm.controls['pwaheadtxt'].value == undefined
				) {
					// this.toastr.error(
					// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectheader'),
					// 	this.appService.getTranslation('Utils.error')
					// );
					this.pwaHeaderCaptionRequired = true;
					flag = true;
				}
			}

			//If Toggel Is On
			if (this.dripNativeForm.controls['OtherDripType'].value == true) {
				//For WhatsApp
				if (
					this.whatsUpNonNativeForm.controls['header_type'].value == '' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == null
				) {
					this.whatsUpNonNativeForm.controls['header_type'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['header_type'].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Image' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Video' ||
					this.whatsUpNonNativeForm.controls['header_type'].value == 'Document'
				) {
					if (
						this.whatsUpNonNativeForm.controls['headerPath'].value == null ||
						this.whatsUpNonNativeForm.controls['headerPath'].value == '' ||
						this.whatsUpNonNativeForm.controls['headerFileName'].value == '' ||
						this.whatsUpNonNativeForm.controls['headerFileName'].value == null
					) {
						// Please select Image / Video / Document File
						flag = true;
					}
				} else if (this.whatsUpNonNativeForm.controls['header_type'].value == 'Text') {
					if (
						this.whatsUpNonNativeForm.controls['header_text'].value == null ||
						this.whatsUpNonNativeForm.controls['header_text'].value == ''
					) {
						this.whatsUpNonNativeForm.controls['header_text'].setErrors({ required: true });
						this.whatsUpNonNativeForm.controls['header_text'].markAsTouched({ onlySelf: true });
						flag = true;
					}
				}

				if (
					this.whatsUpNonNativeForm.controls['tempCategory'].value == '' ||
					this.whatsUpNonNativeForm.controls['tempCategory'].value == null
				) {
					this.whatsUpNonNativeForm.controls['tempCategory'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['tempCategory'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['tempName'].value == '' ||
					this.whatsUpNonNativeForm.controls['tempName'].value == null
				) {
					this.whatsUpNonNativeForm.controls['tempName'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['tempName'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['body'].value == '' ||
					this.whatsUpNonNativeForm.controls['body'].value == null
				) {
					this.whatsUpNonNativeForm.controls['body'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['body'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.whatsUpNonNativeForm.controls['callToActionText'].value == '' ||
					this.whatsUpNonNativeForm.controls['callToActionText'].value == null
				) {
					this.whatsUpNonNativeForm.controls['callToActionText'].setErrors({ required: true });
					this.whatsUpNonNativeForm.controls['callToActionText'].markAsTouched({ onlySelf: true });
					flag = true;
				}

				//For Email
				if (
					this.emailNoneNativeForm.controls['email_subject_line'].value == null ||
					this.emailNoneNativeForm.controls['email_subject_line'].value == ''
				) {
					this.emailNoneNativeForm.controls['email_subject_line'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['email_subject_line'].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if (
					this.emailNoneNativeForm.controls['email_body'].value == '' ||
					this.emailNoneNativeForm.controls['email_body'].value == null
				) {
					this.emailNoneNativeForm.controls['email_body'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['email_body'].markAsTouched({ onlySelf: true });
					flag = true;
				}
				if (
					this.emailNoneNativeForm.controls['callToActionText'].value == '' ||
					this.emailNoneNativeForm.controls['callToActionText'].value == null
				) {
					this.emailNoneNativeForm.controls['callToActionText'].setErrors({ required: true });
					this.emailNoneNativeForm.controls['callToActionText'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}
		} else if (this.selectedDripType == 5) {
			if (this.dripOnlyTeamsForm.invalid) {
				this.markAsTouched(this.dripOnlyTeamsForm);

				flag = true;
			}

			//Hearder Type
			if (
				this.dripOnlyTeamsForm.controls['onlyTeamMsgType'].value == 'Send Message' &&
				(this.dripOnlyTeamsForm.controls['header_type'].value == 'Image' ||
					this.dripOnlyTeamsForm.controls['header_type'].value == 'Video' ||
					this.dripOnlyTeamsForm.controls['header_type'].value == 'Document')
			) {
				if (
					this.dripOnlyTeamsForm.controls['headerPath'].value == null ||
					this.dripOnlyTeamsForm.controls['headerPath'].value == '' ||
					this.dripOnlyTeamsForm.controls['headerFileName'].value == '' ||
					this.dripOnlyTeamsForm.controls['headerFileName'].value == ''
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.attachmentAsset'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
				}
			}
		} else if (this.selectedDripType == 6) {
			if (this.dripSharingOnTeamsForm.invalid) {
				this.markAsTouched(this.dripSharingOnTeamsForm);
				flag = true;
			}

			//Hearder Type
			if (
				this.dripSharingOnTeamsForm.controls['onlyTeamMsgType'].value == 'Send Message' &&
				(this.dripSharingOnTeamsForm.controls['header_type'].value == 'Image' ||
					this.dripSharingOnTeamsForm.controls['header_type'].value == 'Video' ||
					this.dripSharingOnTeamsForm.controls['header_type'].value == 'Document')
			) {
				if (
					this.dripSharingOnTeamsForm.controls['headerPath'].value == null ||
					this.dripSharingOnTeamsForm.controls['headerPath'].value == '' ||
					this.dripSharingOnTeamsForm.controls['headerFileName'].value == '' ||
					this.dripSharingOnTeamsForm.controls['headerFileName'].value == null
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.attachmentAsset'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
				}
			}

			//drip Nativ Validation
			if (
				this.dripSharingOnTeamsForm.controls['contentType'].value == '' ||
				this.dripSharingOnTeamsForm.controls['contentType'].value == null
			) {
				flag = true;
			} else if (this.dripSharingOnTeamsForm.controls['contentType'].value == 'Create New Drip') {
				if (
					this.dripSharingOnTeamsForm.controls['templateType'].value == '' ||
					this.dripSharingOnTeamsForm.controls['templateType'].value == null
				) {
					this.dripSharingOnTeamsForm.controls['templateType'].setErrors({ required: true });
					this.dripSharingOnTeamsForm.controls['templateType'].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Single Image') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						//Please Select One Image Asset
						this.captionImageRequired = true;
						flag = true;
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Carousel') {
					if (this.selectedAssetForTheDrip.length <= 1) {
						//Please Select 2 more More Images for Carousel
						flag = true;
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Video') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						//Please Select One Video Asset
						this.captionImageRequired = true;
						flag = true;
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Poll') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}
						}
					}
				} else if (
					this.dripSharingOnTeamsForm.controls['templateType'].value == 'Quiz' ||
					this.dripSharingOnTeamsForm.controls['templateType'].value == 'Quiz (Randomised)'
				) {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (this.dripSharingOnTeamsForm.controls['showCorrectAns'].value == true) {
						if (
							this.dripSharingOnTeamsForm.controls['quizResultType'].value == '' ||
							this.dripSharingOnTeamsForm.controls['quizResultType'].value == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizResultType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						} else if (
							this.dripSharingOnTeamsForm.controls['quizResultType'].value == 'After the Deadline' &&
							(this.dripSharingOnTeamsForm.controls['timehours'].value == '' ||
								this.dripSharingOnTeamsForm.controls['timehours'].value == null)
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectQuizAfterDeadlineTime'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						let answerIsPresent = false;

						for (let option of question.DripOptions) {
							if (option.text == null || option.text == '') {
								option.isOptionSelected = true;
								flag = true;
							}

							if (option.isCorrectAnswer) {
								answerIsPresent = true;
							}
						}

						if (!answerIsPresent && question.questionType == 'MCQ') {
							if ((question.isAnswerSelected = true)) {
								flag = true;
							}
						}
					}

					if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Quiz (Randomised)') {
						if (
							this.dripSharingOnTeamsForm.controls['quizRandCount'].value == '' ||
							this.dripSharingOnTeamsForm.controls['quizRandCount'].value == null ||
							this.dripSharingOnTeamsForm.controls['quizRandCount'].value == undefined
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.randmonQuestionCount'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}

						if (this.dripSharingOnTeamsForm.controls['quizRandCount'].value > this.DripQuestions.length) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.addTotalRandomQuestion'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
						}
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Offline Task') {
					if (this.selectedAssetForTheDrip.length <= 0) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.captionImageRequired = true;
						flag = true;
					}

					if (
						this.dripSharingOnTeamsForm.controls['brief'].value == '' ||
						this.dripSharingOnTeamsForm.controls['brief'].value == null ||
						this.dripSharingOnTeamsForm.controls['brief'].value == undefined
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectTaskBrief'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (!question.isTextResponse && !question.isFileSubmission) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.textOrfileSubmission'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}

						if (
							question.isFileSubmission &&
							question.questionType == 'Text and File Input' &&
							question.allowFileTypes == null
						) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
								this.appService.getTranslation('Utils.error')
							);
							flag = true;
							break;
						}
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Survey') {
					// if (this.selectedAssetForTheDrip.length <= 0) {
					// 	this.toastr.error(
					// 		this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectCaptionImage'),
					// 		this.appService.getTranslation('Utils.error')
					// 	);
					// 	flag = true;
					// }

					for (let question of this.DripQuestions) {
						if (!question.questionType || !question.question) {
							question.isQuestionSelected = true;
							flag = true;
						}

						if (question.questionType == 'MCQ' || question.questionType == 'Drop Down') {
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}
							}
						}

						if (question.questionType == 'File upload') {
							if (question.allowFileTypes == null || question.allowFileTypes == '') {
								{
									this.toastr.error(
										this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectFileType'),
										this.appService.getTranslation('Utils.error')
									);
									flag = true;
								}
							}
						}
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Spin The Wheel') {
					if (this.spinWheelQueCategory && this.spinWheelQueCategory.length > 0) {
						let noOfQuesForCategory = this.dripSharingOnTeamsForm.controls['noOfQueForCat'].value;
						let noOfTimeSpinWheel = this.dripSharingOnTeamsForm.controls['noOfTimeSpin'].value;

						for (let spinCat of this.spinWheelQueCategory) {
							let spinCategory = spinCat;

							if (
								spinCategory.category_name == null ||
								spinCategory.category_name == undefined ||
								spinCategory.category_name == ''
							) {
								flag = true;
							}
							if (spinCategory.totalquestion < noOfQuesForCategory) {
								spinCategory.isError = true;
								spinCategory.remainQuestionToAdd = noOfQuesForCategory - spinCategory.totalquestion;
								this.toastr.error(
									this.appService.getTranslation('Pages.Workbook.AddEdit.Toaster.noOfQuestionForEachCat'),
									this.appService.getTranslation('Utils.error')
								);
								flag = true;
							} else {
								spinCategory.isError = false;
								spinCategory.remainQuestionToAdd = 0;
							}
						}

						for (let question of this.DripQuestions) {
							if (
								this.dripSharingOnTeamsForm.controls['templateType'].value == 'Spin The Wheel' &&
								question.spinQueScore <= 0
							) {
								question.isSpinQueScore = true;
								flag = true;
							}

							if (!question.questionType || !question.question) {
								question.isQuestionSelected = true;
								flag = true;
							}

							let answerIsPresent = false;
							for (let option of question.DripOptions) {
								if (option.text == null || option.text == '') {
									option.isOptionSelected = true;
									flag = true;
								}

								if (option.isCorrectAnswer) {
									answerIsPresent = true;
								}
							}
							if (!answerIsPresent && question.questionType == 'MCQ') {
								if ((question.isAnswerSelected = true)) {
									flag = true;
								}
							}
						}

						//check for spin wheel template type
						if (
							noOfQuesForCategory == 0 ||
							noOfQuesForCategory == '' ||
							noOfQuesForCategory == null ||
							noOfQuesForCategory == undefined
						) {
							this.isZeroSpinQuesCategory = true;
							flag = true;
						}

						if (
							noOfTimeSpinWheel == 0 ||
							noOfTimeSpinWheel == '' ||
							noOfTimeSpinWheel == null ||
							noOfTimeSpinWheel == undefined
						) {
							this.noOfTimeSpinWheelError = true;
							flag = true;
						}

						if (this.spinWheelQueCategory.length < 2) {
							this.addMinTwoSpinCategory = true;
							flag = true;
						}

						if (noOfTimeSpinWheel + 2 > this.spinWheelQueCategory.length) {
							this.spinCatCountGreaterThanWheelCount = true;
							flag = true;
						}
					}
				} else if (this.dripSharingOnTeamsForm.controls['templateType'].value == 'Custom Template') {
					for (let item of this.customTempPlaceholderArray) {
						if (item.inputText == null || item.inputText == '' || item.inputText == undefined) {
							item.isRequired = true;
							flag = true;
						}
					}
				}

				if (
					this.dripSharingOnTeamsForm.controls['pwaheadtxt'].value == '' ||
					this.dripSharingOnTeamsForm.controls['pwaheadtxt'].value == null ||
					this.dripSharingOnTeamsForm.controls['pwaheadtxt'].value == undefined
				) {
					if (
						this.dripSharingOnTeamsForm.controls['caption'].value == '' ||
						this.dripSharingOnTeamsForm.controls['caption'].value == null ||
						this.dripSharingOnTeamsForm.controls['caption'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectcaption'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				} else if (
					this.dripSharingOnTeamsForm.controls['caption'].value == '' ||
					this.dripSharingOnTeamsForm.controls['caption'].value == null ||
					this.dripSharingOnTeamsForm.controls['caption'].value == undefined
				) {
					if (
						this.dripSharingOnTeamsForm.controls['pwaheadtxt'].value == '' ||
						this.dripSharingOnTeamsForm.controls['pwaheadtxt'].value == null ||
						this.whatsUpNonNativeForm.controls['pwaheadtxt'].value == undefined
					) {
						// this.toastr.error(
						// 	this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.selectheader'),
						// 	this.appService.getTranslation('Utils.error')
						// );
						this.pwaHeaderCaptionRequired = true;
						flag = true;
					}
				}
			} else if (this.dripSharingOnTeamsForm.controls['contentType'].value == 'Use Existing Drip') {
				if (
					this.dripSharingOnTeamsForm.controls['existingDripId'].value == null ||
					this.dripSharingOnTeamsForm.controls['existingDripId'].value == ''
				) {
					this.dripSharingOnTeamsForm.controls['existingDripId'].setErrors({ required: true });
					this.dripSharingOnTeamsForm.controls['existingDripId'].markAsTouched({ onlySelf: true });
					flag = true;
				}
			}
		}

		if (this.dripForm.controls['externalLinkFlag'].value) {
			// Add Validation for External Link
			for (let i = 1; i <= this.externalLinkCount; i++) {
				if ([null, ''].indexOf(this.dripForm.controls[`externalLinkLabel${i}`].value) != -1) {
					this.dripForm.controls[`externalLinkLabel${i}`].setErrors({ required: true });
					this.dripForm.controls[`externalLinkLabel${i}`].markAsTouched({ onlySelf: true });
					flag = true;
				}

				if ([null, ''].indexOf(this.dripForm.controls[`externalLink${i}`].value) != -1) {
					this.dripForm.controls[`externalLink${i}`].setErrors({ required: true });
					this.dripForm.controls[`externalLink${i}`].markAsTouched({ onlySelf: true });
					flag = true;
				} else if (
					this.dripForm.controls[`externalLink${i}`].value.indexOf('https://') == -1 &&
					this.dripForm.controls[`externalLink${i}`].value.indexOf('http://') == -1
				) {
					console.log('--------Invlaid Ecxternal Link-----');
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.pleaseaddvalidexternalurl'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
					// return;
				}
			}
			if (flag) {
				return;
			}
		} else {
			for (let i = 1; i <= 4; i++) {
				this.dripForm.controls[`externalLinkLabel${i}`].setValue(null);
				this.dripForm.controls[`externalLink${i}`].setValue(null);
			}
		}

		//check asset upload in brodside for only email type
		if ((this.selectedDripType == 3 || this.selectedDripType == 7) && !this.useSendGrid) {
			if (this.isImageInEmailTemplate) {
				const invalidIndices = [];
				for (const [index, item] of this.brodSideEmailImgFilePaths.entries()) {
					if (!item.filePath.includes('/var/warehouse/data/')) {
						invalidIndices.push(index);
						console.log('--invalidIndices--', invalidIndices);
					}
				}

				if (
					invalidIndices.length > 0 ||
					(this.brodSideEmailImgFilePaths && this.brodSideEmailImgFilePaths.length == 0)
				) {
					flag = true;
					let text = this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.uploadbrodsideemailasset');
					this.toastr.error(text), this.appService.getTranslation('Utils.error');
					return;
				}
			}

			//Attachment Type
			if (
				this.onlyEmailForm.controls['brod_attach_type'].value == 'Image' ||
				this.onlyEmailForm.controls['brod_attach_type'].value == 'Document' ||
				this.emailNoneNativeForm.controls['brod_attach_type'].value == 'Image' ||
				this.emailNoneNativeForm.controls['brod_attach_type'].value == 'Document'
			) {
				if (this.brodSideEmailAttachments && this.brodSideEmailAttachments.length == 0) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.attachmentAsset'),
						this.appService.getTranslation('Utils.error')
					);
					flag = true;
				}
			}
		}

		if (flag) {
			this.toastr.error(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.fillallrequiredfields'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}
		let payload = {
			drip_data: this.dripForm.value,
			selected_asset_for_drip: this.selectedAssetForTheDrip,
			whatsApp_native_drip_data: this.whatsUpNativeForm.value,
			whatsApp_non_native_drip_data: this.whatsUpNonNativeForm.value,
			only_email_drip_data: this.onlyEmailForm.value,
			email_non_native_drip_data: this.emailNoneNativeForm.value,
			native_drip_data: this.dripNativeForm.value,
			only_teams_drip_data: this.dripOnlyTeamsForm.value,
			sharing_on_teams_drip_data: this.dripSharingOnTeamsForm.value,
			DripQuestions: this.DripQuestions,
			PostBriefAsset: this.selectedAssetForOfflineTaskBrief,
			spinWheelQueCategory: this.spinWheelQueCategory,
		};

		payload.whatsApp_native_drip_data.cta_sequence = JSON.stringify(this.finalInteractionSquList);
		payload.whatsApp_native_drip_data.quickReplyFirst = this.quickReplyFirst;

		//brodside email file path store
		if (this.selectedDripType == 3) {
			payload.email_non_native_drip_data.brodEmailAssetPath = this.brodSideEmailImgFilePaths;
			payload.email_non_native_drip_data.brodEmailAttachmentPath = this.brodSideEmailAttachments;
		} else if (this.selectedDripType == 7) {
			payload.only_email_drip_data.brodEmailAssetPath = this.brodSideEmailImgFilePaths;
			payload.only_email_drip_data.brodEmailAttachmentPath = this.brodSideEmailAttachments;
		}

		if (this.selectedDripType == 2) {
			payload.whatsApp_native_drip_data.htmlstring = JSON.stringify(this.allDyanamicPages);
		} else if (this.selectedDripType == 3) {
			payload.email_non_native_drip_data.htmlstring = JSON.stringify(this.allDyanamicPages);
		} else if (this.selectedDripType == 4) {
			payload.native_drip_data.htmlstring = JSON.stringify(this.allDyanamicPages);
		} else if (this.selectedDripType == 6) {
			payload.sharing_on_teams_drip_data.htmlstring = JSON.stringify(this.allDyanamicPages);
		}

		if (
			this.customTempPlaceholderArray.length > 0 &&
			this.customTemplate &&
			(this.whatsUpNonNativeForm.controls['templateType'].value == 'Custom Template' ||
				this.emailNoneNativeForm.controls['templateType'].value == 'Custom Template' ||
				this.dripNativeForm.controls['templateType'].value == 'Custom Template' ||
				this.dripSharingOnTeamsForm.controls['templateType'].value == 'Custom Template')
		) {
			payload.drip_data.custTempPlaceholders = this.customTempPlaceholderArray;
			payload.drip_data.customTemplate = this.customTemplate;
		}

		if (
			this.selectedDripType == 1 ||
			this.selectedDripType == 2 ||
			(this.selectedDripType == 3 && this.emailNoneNativeForm.controls['OtherDripType'].value == true) ||
			(this.selectedDripType == 4 && this.dripNativeForm.controls['OtherDripType'].value == true)
		) {
			if (isPublish && !this.showWhatsAppTemplatePublish) {
				this.showWhatsAppTemplatePublish = true;
				$('#publishWhatsAppTemplateModel').modal('show');
				return;
			}
		}
		if ((this.selectedDripType == 1 || this.selectedDripType == 2) && isPublish) {
			this.toastr.warning(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.dripCreateStart'),
				this.appService.getTranslation('Utils.warning')
			);
		}

		console.log('----------payload----------', payload);
		// return;

		this.spinnerService.show();
		if (!this.dripForm.controls['id'].value) {
			this.dripService.createDrip(payload, this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					if (res.TemplateErrorMsg) {
						this.toastr.error(res.TemplateErrorMsg, this.appService.getTranslation('Utils.error'));
					} else {
						if (isPublish) {
							this.toastr.success(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.dripcreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.dripsavedraft'),
								this.appService.getTranslation('Utils.success')
							);
						}
					}
					if (this.allParamsData && this.allParamsData.redictfrom == 'drip-flow') {
						this.router.navigate(['drip-flows/add-or-edit-drip-flow', { redictfrom: 'drip' }]);
					} else {
						this.router.navigate(['drips-library']);
					}
					this.spinnerService.hide();
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					if (this.allParamsData && this.allParamsData.redictfrom == 'drip-flow') {
						this.router.navigate(['drip-flows/add-or-edit-drip-flow', { redictfrom: 'drip' }]);
					} else {
						this.router.navigate(['drips-library']);
					}
				}
			});
		} else {
			this.savePagination();
			this.dripService
				.updateDrip(payload, this.selectedClientId, this.dripForm.controls['id'].value)
				.subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						if (res.TemplateErrorMsg) {
							this.toastr.success(res.TemplateErrorMsg, this.appService.getTranslation('Utils.error'));
						} else {
							if (isPublish) {
								this.toastr.success(
									this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.dripcreated'),
									this.appService.getTranslation('Utils.success')
								);
							} else {
								this.toastr.success(
									this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.dripsavedraft'),
									this.appService.getTranslation('Utils.success')
								);
							}
						}
						this.router.navigate(['drips-library']);
						this.spinnerService.hide();
					} else {
						this.spinnerService.hide();
						this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
						this.router.navigate(['drips-library']);
					}
				});
		}
	}

	changeMobPreview(event) {
		console.log('event', event);
	}

	downloadWhatsAppTemplate(type) {
		let item;
		let value;
		if (type == 'Only WhatsApp') {
			item = this.whatsUpNativeForm.value;
		} else if (type == 'DripApp with sharing on WhatsApp') {
			item = this.whatsUpNonNativeForm.value;
		}
		if (item.templateStatus != 'Disabled') {
			if (!this.setting.element.dynamicDownload) {
				this.setting.element.dynamicDownload = document.createElement('a');
			}
			if (item.AssetId) {
				this.dripService.getAssetByAssetId(item.AssetId).subscribe((res: any) => {
					if (res.success) {
						item.headerAssetURL = environment.imageHost + environment.imagePath + res.data.Asset_details[0].path;
						value = this.createWhatsAppTemplate(item, type);
						const element = this.setting.element.dynamicDownload;
						element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
						element.setAttribute('download', 'whatsApp_Template.txt');

						var event = new MouseEvent('click');
						element.dispatchEvent(event);
						this.toastr.success(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.whatstemplateDownload'),
							this.appService.getTranslation('Utils.success')
						);
					}
				});
			} else {
				value = this.createWhatsAppTemplate(item, type);
				const element = this.setting.element.dynamicDownload;
				element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
				element.setAttribute('download', 'whatsApp_Template.txt');

				var event = new MouseEvent('click');
				element.dispatchEvent(event);
				this.toastr.success(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.whatstemplateDownload'),
					this.appService.getTranslation('Utils.success')
				);
			}
		}
	}

	createWhatsAppTemplate(template, drip_type) {
		let headerAssetURL = template.headerAssetURL;
		let templateType;
		let mediaType;
		if (template.header_type == 'Image' || template.header_type == 'Video' || template.header_type == 'Document') {
			templateType = 'Media';
			mediaType = template.header_type;
			if (template.header_type == 'PDF') {
				mediaType = 'Document';
			}
		} else {
			templateType = 'Text';
		}

		// Botton
		let typeOfAction = `Visit Website`;
		let callToActionText = `${template.callToActionText}`;
		let buttonType = `Static`;
		let webSiteURL = `${template.hyper_link}`;

		// For WhatsApp ANtive Drip Only
		let quickReply1 = `${template && template.quickReply1 ? template.quickReply1 : ''}`;
		let quickReply2 = `${template && template.quickReply2 ? template.quickReply2 : ''}`;
		let quickReply3 = `${template && template.quickReply3 ? template.quickReply3 : ''}`;
		//Header
		let header = `${template.header_text}`;

		//Footer
		let footer = `${template.footer}`;

		//Body
		let body = `${template.body}`;

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

		if (footer && footer != 'null' && footer != null) {
			print = print + `Footer:-\n`;
			print = print + `${footer}\n\n`;
		}
		// print = print + `\n------------------------------------------------\n\n`;

		if (drip_type == 'Only WhatsApp') {
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
		} else if (drip_type == 'DripApp with sharing on WhatsApp') {
			print = print + `Button Type :- Call To Action\n\n`;
			print = print + `Type Of Action :- ${typeOfAction}\n\n`;
			print = print + `Button Text:- ${callToActionText}\n\n`;
			print = print + `Button Type:- ${buttonType}\n\n`;
			print = print + `Website URL:- ${webSiteURL}\n\n`;
		}

		return print;
	}

	showSelectMediaPopup() {
		let type;
		if (this.selectedDripType == 2) {
			type = this.whatsUpNonNativeForm.value.templateType;
		} else if (this.selectedDripType == 3) {
			type = this.emailNoneNativeForm.value.templateType;
		} else if (this.selectedDripType == 4) {
			type = this.dripNativeForm.value.templateType;
		}

		if (type == 'Single Image' || type == 'Carousel') {
			type = 'Image';
		}

		this.getAllAssetByType(this.selectedClientId, this.selectedTemplateType);
		setTimeout(() => {
			$('#selectMediaModel').modal('show');
		}, 300);
	}

	selectTemplate(event) {
		if (this.selectedTemplateType == 'Single Image' || this.selectedTemplateType == 'Carousel') {
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Image');
			// this.getAssetsFilter(this.selectedClientId, "Image");
			this.typeForSearch = 'Image';
		} else if (this.selectedTemplateType == 'Video') {
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Video');
			// this.getAssetsFilter(this.selectedClientId, "Video");
			this.typeForSearch = 'Video';
		}
		if (
			this.selectedTemplateType == 'Poll' ||
			this.selectedTemplateType == 'Quiz' ||
			this.selectedTemplateType == 'Quiz (Randomised)'
		) {
			this.DripQuestions = [];
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Image');
			// this.getAssetsFilter(this.selectedClientId, "Image");
			this.typeForSearch = 'Image';
			this.addQuestion();
		} else if (this.selectedTemplateType == 'Offline Task') {
			this.selectedAssetForOfflineTaskBrief = [];
			this.typeForSearch = 'Image';
			this.DripQuestions = [];
			this.selectedAssetForTheDrip = [];
			this.addQuestion('Text and File Input');
		}
		if (this.selectedDripType == 2) {
			this.whatsUpNonNativeForm.controls['templateType'].setValue(this.selectedTemplateType);
		} else if (this.selectedDripType == 3) {
			this.emailNoneNativeForm.controls['templateType'].setValue(this.selectedTemplateType);
		} else if (this.selectedDripType == 4) {
			this.whatsUpNonNativeForm.controls['templateType'].setValue(this.selectedTemplateType);
			this.emailNoneNativeForm.controls['templateType'].setValue(this.selectedTemplateType);
			this.dripSharingOnTeamsForm.controls['templateType'].setValue(this.selectedTemplateType);
		} else if (this.selectedDripType == 6) {
			this.dripSharingOnTeamsForm.controls['templateType'].setValue(this.selectedTemplateType);
		}
		this.selectedExitingDrip = null;
		this.getAllDripList(this.selectedTemplateType);
		// this.selectedTemplateType = event.name;
		// this.selectedTemplateType = event.name;

		this.brodSideEmailAttachments = [];
		this.brodSideEmailImgSrcValues = [];
		this.brodSideEmailImgFilePaths = [];

		this.whatsUpNonNativeForm.controls['custTempId'].setValue(null);
		this.emailNoneNativeForm.controls['custTempId'].setValue(null);
		this.dripSharingOnTeamsForm.controls['custTempId'].setValue(null);
		this.customTempPlaceholderArray = [];
		this.pwaHeaderCaptionRequired = false;
		this.captionImageRequired = false;
	}

	selectTemplateForDripNative() {
		this.selectedTemplateType = this.dripNativeForm.value.templateType;
		if (
			this.dripNativeForm.value.templateType == 'Single Image' ||
			this.dripNativeForm.value.templateType == 'Carousel'
		) {
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Image');
			// this.getAssetsFilter(this.selectedClientId, "Image");
			this.typeForSearch = 'Image';
		} else if (this.dripNativeForm.value.templateType == 'Video') {
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Video');
			this.typeForSearch = 'Video';
			// this.getAssetsFilter(this.selectedClientId, "Video");
		}
		if (
			this.dripNativeForm.value.templateType == 'Poll' ||
			this.dripNativeForm.value.templateType == 'Quiz' ||
			this.dripNativeForm.value.templateType == 'Quiz (Randomised)'
		) {
			this.DripQuestions = [];
			this.selectedAssetForTheDrip = [];
			// this.getAllAssetByType(this.selectedClientId, 'Image');
			this.typeForSearch = 'Image';
			// this.getAssetsFilter(this.selectedClientId, "Image");
			this.addQuestion();
		} else if (this.dripNativeForm.value.templateType == 'Offline Task') {
			this.selectedAssetForOfflineTaskBrief = [];
			// this.getAllAssetByType(this.selectedClientId, 'Image');
			this.typeForSearch = 'Image';
			// this.getAssetsFilter(this.selectedClientId, "Image");
			this.DripQuestions = [];
			this.selectedAssetForTheDrip = [];
			this.addQuestion('Text and File Input');
		}

		this.selectedExitingDrip = null;
		this.getAllDripList(this.selectedTemplateType);

		this.dripNativeForm.controls['custTempId'].setValue(null);
		this.customTempPlaceholderArray = [];
		this.pwaHeaderCaptionRequired = false;
		this.captionImageRequired = false;
	}

	showUploadImagePopup(questionIndex, optionIndex, isQuestion, type) {
		this.imgQuestionIndex = questionIndex;
		this.imgOptionIndex = optionIndex;
		this.imgIsquestion = isQuestion;
		this.getAllAssetByType(this.selectedClientId, type);
		this.typeForSearch = type;
		// this.getAssetsFilter(this.selectedClientId, type);
		$('#selectForQuestionAndOptionMediaModel').modal('show');
	}

	cancelMediaPopUp() {
		$('#selectForQuestionAndOptionMediaModel').modal('hide');
		$('#selectWhatsupHeaderMediaModel').modal('hide');
		$('#linkAssetModel').modal('hide');
		$('#selectForOfflineTaskBriefMediaModel').modal('hide');
		$('#selectMediaModelForDyanamicPages').modal('hide');
		$('#selectBrodSideEmailUploadAssetModel').modal('hide');
		$('#selectBrodSideEmailAttachmentModel').modal('hide');
		$('#selectTeamsDriveMediaModel').modal('hide');
		$('#selectMediaModelForCustomTemplate').modal('hide');

		if (this.selectedTemplateType == 'Carousel') {
			if (this.selectedAssetForTheDrip.length > 1) {
				$('#selectMediaModel').modal('hide');
			} else {
				this.toastr.error(
					this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.atleasttwoassetRequired'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else {
			$('#selectMediaModel').modal('hide');
		}
		this.captionImageRequired = false;
	}

	closedMediaPopUp() {
		$('#selectForQuestionAndOptionMediaModel').modal('hide');
		$('#selectWhatsupHeaderMediaModel').modal('hide');
		$('#linkAssetModel').modal('hide');
		$('#selectMediaModel').modal('hide');
		$('#selectForOfflineTaskBriefMediaModel').modal('hide');
		$('#selectMediaModelForDyanamicPages').modal('hide');
		$('#selectBrodSideEmailUploadAssetModel').modal('hide');
		$('#selectBrodSideEmailAttachmentModel').modal('hide');
		$('#selectMediaModelForCustomTemplate').modal('hide');
		this.captionImageRequired = false;
	}

	selectAssetForQuestion(asset, index) {
		if (this.imgIsquestion) {
			this.DripQuestions[this.imgQuestionIndex].AssetId = asset.id;
			this.DripQuestions[this.imgQuestionIndex].filePath = asset.Asset_details[0].path;
			this.DripQuestions[this.imgQuestionIndex].fileType = asset.Asset_details[0].fieldname;
			this.DripQuestions[this.imgQuestionIndex].fileName = asset.Asset_details[0].name;
			this.DripQuestions[this.imgQuestionIndex].isTranscoding = asset.Asset_details[0].isTranscoding;
			this.DripQuestions[this.imgQuestionIndex].selfHostedVideo = asset.Asset_details[0].selfHostedVideo;
			this.DripQuestions[this.imgQuestionIndex].cmsVideoId = asset.Asset_details[0].cmsVideoId;
		} else {
			this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].AssetId = asset.id;
			this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].filePath = asset.Asset_details[0].path;
			this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileName = asset.Asset_details[0].name;
			this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileType =
				asset.Asset_details[0].fieldname;
			this.DripQuestions[this.imgQuestionIndex].cmsVideoId = asset.Asset_details[0].cmsVideoId;
		}
		this.imgQuestionIndex = null;
		this.imgOptionIndex = null;
		this.imgIsquestion = null;
		this.cancelMediaPopUp();
	}

	selectAssetForQuestionFromGoogle(whatsAppAsset, index) {
		let asset;
		let payload = {
			fileId: whatsAppAsset.id,
			name: whatsAppAsset.name,
			assetType: this.assetTypeForLibaray,
		};
		this.spinnerService.show();
		this.dripService.checkAddDonwloadAssetFormGoogleDrive(payload).subscribe((res: any) => {
			if (res.success) {
				asset = res.data;
				if (this.imgIsquestion) {
					this.DripQuestions[this.imgQuestionIndex].AssetId = asset.id;
					this.DripQuestions[this.imgQuestionIndex].filePath = asset.Asset_details[0].path;
					this.DripQuestions[this.imgQuestionIndex].fileType = asset.Asset_details[0].fieldname;
					this.DripQuestions[this.imgQuestionIndex].fileName = asset.Asset_details[0].name;
					this.DripQuestions[this.imgQuestionIndex].isTranscoding = asset.Asset_details[0].isTranscoding;
					this.DripQuestions[this.imgQuestionIndex].selfHostedVideo = asset.Asset_details[0].selfHostedVideo;
					this.DripQuestions[this.imgQuestionIndex].cmsVideoId = asset.Asset_details[0].cmsVideoId;
				} else {
					this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].AssetId = asset.id;
					this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].filePath =
						asset.Asset_details[0].path;
					this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileName =
						asset.Asset_details[0].name;
					this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileType =
						asset.Asset_details[0].fieldname;
					this.DripQuestions[this.imgQuestionIndex].cmsVideoId = asset.Asset_details[0].cmsVideoId;
				}
				this.imgQuestionIndex = null;
				this.imgOptionIndex = null;
				this.imgIsquestion = null;
				this.cancelMediaPopUp();
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	selectlinkAsset(asset, index) {
		if (asset && !this.selectAssetForTaskBrief) {
			if (this.selectedCTALinkIndex == 1) {
				this.whatsUpNativeForm.controls['hyper_link'].setValue(asset.Asset_details[0].path);
				this.dripOnlyTeamsForm.controls['hyper_link1'].setValue(asset.Asset_details[0].path);
			} else if (this.selectedCTALinkIndex == 2) {
				this.whatsUpNativeForm.controls['hyper_link2'].setValue(asset.Asset_details[0].path);
				this.dripOnlyTeamsForm.controls['hyper_link2'].setValue(asset.Asset_details[0].path);
			} else {
				this.dripOnlyTeamsForm.controls['hyper_link3'].setValue(asset.Asset_details[0].path);
			}
			this.cancelMediaPopUp();
		} else if (this.selectAssetForTaskBrief) {
			if (this.selectedAssetForOfflineTaskBrief.length > 0) {
				let temp = null;
				for (let i = 0; i < this.selectedAssetForOfflineTaskBrief.length; i++) {
					if (this.selectedAssetForOfflineTaskBrief[i].AssetId == asset.id) {
						temp = i;
					}
				}
				if (temp >= 0 && temp != null) {
					this.selectedAssetForOfflineTaskBrief.splice(temp, 1);
					this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
				} else {
					let payload = {
						title: asset.title,
						AssetId: asset.id,
						assetType: asset.field_name,
						path: asset.Asset_details[0].path,
						fileName: asset.Asset_details[0].name,
						isTranscoding: asset.Asset_details[0].isTranscoding,
						selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
						cmsVideoId: asset.Asset_details[0].cmsVideoId,
						forPreview: this.forBriefPreview,
					};
					if (this.selectedAssetForOfflineTaskBrief.length < 10) {
						this.selectedAssetForOfflineTaskBrief.push(payload);
					} else {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notselectmorethanTen'),
							this.appService.getTranslation('Utils.error')
						);
						return;
					}
					this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
				}
			} else {
				let payload = {
					title: asset.title,
					AssetId: asset.id,
					assetType: asset.field_name,
					path: asset.Asset_details[0].path,
					fileName: asset.Asset_details[0].name,
					isTranscoding: asset.Asset_details[0].isTranscoding,
					selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
					cmsVideoId: asset.Asset_details[0].cmsVideoId,
					forPreview: this.forBriefPreview,
				};
				this.selectedAssetForOfflineTaskBrief.push(payload);
				this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
			}
			if (this.forBriefPreview) {
				$('#linkAssetModel').modal('hide');
			}
		}
	}

	uploadAssetMedia(event, type, templateType?) {
		let selectedMediaAssetDetails = [];
		let uploadedAssets = [];
		if (event.target && event.target.files && event.target.files.length > 0) {
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				fileName = fileName.replace('.pdf', '').replace('.png', '').replace('.jpg', '').replace('.mp4', '');
				if (mediaType.includes('pdf')) {
					mediaType = 'PDF';
				} else if (mediaType.includes('image')) {
					mediaType = 'Image';
				} else if (mediaType.includes('video') && type != 'WhatsApp') {
					mediaType = 'Video';
				}

				console.log('--type', type);
				if (mediaType.includes('video') && type == 'WhatsApp') {
					mediaType = 'WhatsappVideo';
				}

				let payload = {
					title: fileName,
					tagName: null,
					description: null,
					type: mediaType,
					otherDetails: media,
					size: media.size,
				};

				if (mediaType == 'WhatsappVideo' && media.size >= 15938355.2) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maxvideo15.2MB'),
						this.appService.getTranslation('Utils.error')
					);
				} else {
					// console.log('-selectedMediaAssetDetails-', selectedMediaAssetDetails);
					if (templateType == 'Carousel' && selectedMediaAssetDetails.length == 10) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notuploadmorethanTen'),
							this.appService.getTranslation('Utils.error')
						);
					} else {
						selectedMediaAssetDetails.push(payload);
					}
				}
			}

			for (let asset of selectedMediaAssetDetails) {
				const uploadData = new FormData();
				// For WhatsApp Video
				if (asset.type == 'WhatsappVideo' && type == 'WhatsApp') {
					//UPLOAD VIDEO
					const uploadData = new FormData();

					for (var key in asset) {
						if (key == 'otherDetails') {
							uploadData.append(asset.type, asset[key]);
						} else {
							uploadData.append(key, asset[key]);
						}
					}
					this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							// if (this.selectedDripType == 1) {
							// 	this.whatsUpNativeForm.controls['headerPath'].setValue('uploads/assets/' + res.data.Video[0].filename);
							// 	this.whatsUpNativeForm.controls['headerFileName'].setValue(res.data.Video[0].originalname);
							// } else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
							// 	this.whatsUpNonNativeForm.controls['headerPath'].setValue(
							// 		'uploads/assets/' + res.data.Video[0].filename
							// 	);
							// 	this.whatsUpNonNativeForm.controls['headerFileName'].setValue(res.data.Video[0].originalname);
							// } else if (this.selectedDripType == 5) {
							// 	this.dripOnlyTeamsForm.controls['headerPath'].setValue('uploads/assets/' + res.data.Video[0].filename);
							// 	this.dripOnlyTeamsForm.controls['headerFileName'].setValue(res.data.Video[0].originalname);
							// } else if (this.selectedDripType == 6) {
							// 	this.dripSharingOnTeamsForm.controls['headerPath'].setValue(
							// 		'uploads/assets/' + res.data.Video[0].filename
							// 	);
							// 	this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(res.data.Video[0].originalname);
							// }
							if (this.selectedDripType == 1) {
								this.whatsUpNativeForm.controls['AssetId'].setValue(res.data.id);
								this.whatsUpNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
								this.whatsUpNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
							} else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
								this.whatsUpNonNativeForm.controls['AssetId'].setValue(res.data.id);
								this.whatsUpNonNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
								this.whatsUpNonNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
							} else if (this.selectedDripType == 5) {
								this.dripOnlyTeamsForm.controls['AssetId'].setValue(res.data.id);
								this.dripOnlyTeamsForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
								this.dripOnlyTeamsForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
							} else if (this.selectedDripType == 6) {
								this.dripSharingOnTeamsForm.controls['AssetId'].setValue(res.data.id);
								this.dripSharingOnTeamsForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
								this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
							}
							this.cancelMediaPopUp();
						}
					});
				}
				// For Drip Video
				else if (
					asset.type == 'Video' &&
					(type == 'Video' || type == 'Question-Option' || type == 'Offline-Task-Brief')
				) {
					if (this.appService?.configurable_feature?.vimeo) {
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
							this.spinnerService.hide();
							return;
						}
						this.spinnerService.show();

						this.dripService
							.createVimeo(options, asset.otherDetails.size)
							.pipe(
								map((data) => (asset.data = data)),
								switchMap(() => {
									this.appService.checkNotifcation = true;
									this.dripService.updateVimeoLink(asset.data.link);
									if (asset.data.upload.size === asset.otherDetails.size) {
										return this.dripService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
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

										this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
											if (res.success) {
												const options = {
													token: this.vimeoDetails.vToken,
													url: environment.VimeoPresetApi,
													presetId: this.vimeoDetails.presetId,
													videoId: asset.vmoVideoId,
												};
												this.dripService.applyEmbedPreset(options).subscribe((res: any) => {});

												console.log('-----2---');

												this.appService.checkNotifcation = true;
												this.spinnerService.hide();
												if (type == 'Video') {
													this.dripMediaType = res.data.field_name;

													let payload = {
														title: res.data.title,
														AssetId: res.data.id,
														assetType: res.data.Asset_details[0].fieldname,
														path: res.data.Asset_details[0].path,
														fileName: res.data.Asset_details[0].name,
														isTranscoding: res.data.Asset_details[0].isTranscoding,
														selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
														cmsVideoId: res.data.Asset_details[0].cmsVideoId,
													};
													this.selectedAssetForTheDrip.push(payload);
													this.toastr.success(
														this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
														this.appService.getTranslation('Utils.success')
													);
													this.cancelMediaPopUp();
												}

												if (type == 'Question-Option') {
													if (this.imgIsquestion) {
														this.DripQuestions[this.imgQuestionIndex].AssetId = res.data.id;
														this.DripQuestions[this.imgQuestionIndex].filePath = res.data.Asset_details[0].path;
														this.DripQuestions[this.imgQuestionIndex].fileType = res.data.Asset_details[0].fieldname;
														this.DripQuestions[this.imgQuestionIndex].fileName = res.data.Asset_details[0].name;
														this.DripQuestions[this.imgQuestionIndex].isTranscoding =
															res.data.Asset_details[0].isTranscoding;
														this.DripQuestions[this.imgQuestionIndex].selfHostedVideo =
															res.data.Asset_details[0].selfHostedVideo;
														this.DripQuestions[this.imgQuestionIndex].cmsVideoId = res.data.Asset_details[0].cmsVideoId;
													} else if (!this.imgIsquestion) {
														this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].AssetId =
															res.data.id;
														this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].filePath =
															res.data.Asset_details[0].path;
														this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileName =
															res.data.Asset_details[0].fieldname;
														this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileType =
															res.data.Asset_details[0].name;
														this.DripQuestions[this.imgQuestionIndex].cmsVideoId = res.data.Asset_details[0].cmsVideoId;
													}
													this.cancelMediaPopUp();
												}
												console.log('-----3---');
												if (type == 'Offline-Task-Brief') {
													let payload = {
														title: res.data.title,
														AssetId: res.data.id,
														assetType: res.data.Asset_details[0].fieldname,
														path: res.data.Asset_details[0].path,
														fileName: res.data.Asset_details[0].name,
														isTranscoding: res.data.Asset_details[0].isTranscoding,
														selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
														cmsVideoId: res.data.Asset_details[0].cmsVideoId,
														forPreview: this.forBriefPreview,
													};
													this.selectedAssetForOfflineTaskBrief.push(payload);
													console.log('---Hello-2-', this.selectedAssetForOfflineTaskBrief);
													this.cancelMediaPopUp();
												}
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
					} else if (this.appService?.configurable_feature?.mediaCMS) {
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
						this.dripService.canUploadVideoOnMediaCMS().subscribe((res: any) => {
							if (res.success) {
								if (res.canUpload) {
									this.dripService.uploadVideoOnMediaCMS(uploadData, this.selectedClientId).subscribe((res: any) => {
										if (res) {
											asset.cmsVideoId = res.data.videoId;
											asset.size = res.data.size;
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
											this.spinnerService.show();
											this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
												if (res.success) {
													this.appService.checkNotifcation = true;
													this.spinnerService.hide();
													if (type == 'Video') {
														this.dripMediaType = res.data.field_name;

														let payload = {
															title: res.data.title,
															AssetId: res.data.id,
															assetType: res.data.Asset_details[0].fieldname,
															path: res.data.Asset_details[0].path,
															fileName: res.data.Asset_details[0].name,
															isTranscoding: res.data.Asset_details[0].isTranscoding,
															selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
															cmsVideoId: res.data.Asset_details[0].cmsVideoId,
														};
														this.selectedAssetForTheDrip.push(payload);
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
															this.appService.getTranslation('Utils.success')
														);
														this.cancelMediaPopUp();
													}

													if (type == 'Question-Option') {
														if (this.imgIsquestion) {
															this.DripQuestions[this.imgQuestionIndex].AssetId = res.data.id;
															this.DripQuestions[this.imgQuestionIndex].filePath = res.data.Asset_details[0].path;
															this.DripQuestions[this.imgQuestionIndex].fileType = res.data.Asset_details[0].fieldname;
															this.DripQuestions[this.imgQuestionIndex].fileName = res.data.Asset_details[0].name;
															this.DripQuestions[this.imgQuestionIndex].isTranscoding =
																res.data.Asset_details[0].isTranscoding;
															this.DripQuestions[this.imgQuestionIndex].selfHostedVideo =
																res.data.Asset_details[0].selfHostedVideo;
															this.DripQuestions[this.imgQuestionIndex].cmsVideoId =
																res.data.Asset_details[0].cmsVideoId;
														} else if (!this.imgIsquestion) {
															this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].AssetId =
																res.data.id;
															this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].filePath =
																res.data.Asset_details[0].path;
															this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileName =
																res.data.Asset_details[0].fieldname;
															this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileType =
																res.data.Asset_details[0].name;
															this.DripQuestions[this.imgQuestionIndex].cmsVideoId =
																res.data.Asset_details[0].cmsVideoId;
														}
														this.cancelMediaPopUp();
													}

													if (type == 'Offline-Task-Brief') {
														let payload = {
															title: res.data.title,
															AssetId: res.data.id,
															assetType: res.data.Asset_details[0].fieldname,
															path: res.data.Asset_details[0].path,
															fileName: res.data.Asset_details[0].name,
															isTranscoding: res.data.Asset_details[0].isTranscoding,
															selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
															cmsVideoId: res.data.Asset_details[0].cmsVideoId,
															forPreview: this.forBriefPreview,
														};
														this.selectedAssetForOfflineTaskBrief.push(payload);
														this.cancelMediaPopUp();
													}
												} else {
													this.spinnerService.hide();
												}
											});
										}
									});
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
					}
				} else {
					for (var key in asset) {
						if (key == 'otherDetails') {
							uploadData.append(asset.type, asset[key]);
						} else {
							uploadData.append(key, asset[key]);
						}
					}
					if (asset.type == 'Image') {
						if (asset.size >= 2097152) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maximage2MB'),
								this.appService.getTranslation('Utils.error')
							);
							return;
						}
					} else if (asset.type == 'PDF') {
						if (asset.size >= 5242880) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maxdocument5MB'),
								this.appService.getTranslation('Utils.error')
							);
							return;
						}
					}

					this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
						if (res.success) {
							if (type == 'Question-Option') {
								if (this.imgIsquestion) {
									this.DripQuestions[this.imgQuestionIndex].AssetId = res.data.id;
									this.DripQuestions[this.imgQuestionIndex].filePath = res.data.Asset_details[0].path;
									this.DripQuestions[this.imgQuestionIndex].fileType = res.data.Asset_details[0].fieldname;
									this.DripQuestions[this.imgQuestionIndex].fileName = res.data.Asset_details[0].name;
									this.DripQuestions[this.imgQuestionIndex].fileName = res.data.Asset_details[0].cmsVideoId;
									this.DripQuestions[this.imgQuestionIndex].isTranscoding = res.data.Asset_details[0].isTranscoding;
								} else if (!this.imgIsquestion) {
									this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].AssetId = res.data.id;
									this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].filePath =
										res.data.Asset_details[0].path;
									this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileName =
										res.data.Asset_details[0].fieldname;
									this.DripQuestions[this.imgQuestionIndex].DripOptions[this.imgOptionIndex].fileType =
										res.data.Asset_details[0].name;
									this.DripQuestions[this.imgQuestionIndex].fileName = res.data.Asset_details[0].cmsVideoId;
								}
								this.cancelMediaPopUp();
							} else if (type == 'WhatsApp') {
								this.waMediaType = res.data.field_name;
								if (this.selectedDripType == 1) {
									this.whatsUpNativeForm.controls['AssetId'].setValue(res.data.id);
									this.whatsUpNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
									this.whatsUpNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
								} else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
									this.whatsUpNonNativeForm.controls['AssetId'].setValue(res.data.id);
									this.whatsUpNonNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
									this.whatsUpNonNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
								} else if (this.selectedDripType == 5) {
									this.dripOnlyTeamsForm.controls['AssetId'].setValue(res.data.id);
									this.dripOnlyTeamsForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
									this.dripOnlyTeamsForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
								} else if (this.selectedDripType == 6) {
									this.dripSharingOnTeamsForm.controls['AssetId'].setValue(res.data.id);
									this.dripSharingOnTeamsForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
									this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
								}
							} else if (type == 'Thambnail') {
								this.dripMediaType = res.data.field_name;
								let payload = {
									title: res.data.title,
									AssetId: res.data.id,
									assetType: res.data.Asset_details[0].fieldname,
									path: res.data.Asset_details[0].path,
									fileName: res.data.Asset_details[0].name,
									isTranscoding: res.data.Asset_details[0].isTranscoding,
									selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
									cmsVideoId: res.data.Asset_details[0].cmsVideoId,
								};
								this.selectedAssetForTheDrip.push(payload);
							} else if (type == 'Offline-Task-Brief') {
								this.dripMediaType = res.data.field_name;
								let payload = {
									title: res.data.title,
									AssetId: res.data.id,
									assetType: res.data.Asset_details[0].fieldname,
									path: res.data.Asset_details[0].path,
									fileName: res.data.Asset_details[0].name,
									isTranscoding: res.data.Asset_details[0].isTranscoding,
									selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
									cmsVideoId: res.data.Asset_details[0].cmsVideoId,
									forPreview: this.forBriefPreview,
								};
								this.selectedAssetForOfflineTaskBrief.push(payload);
								console.log('---this.selectedAssetForOfflineTaskBrief--', this.selectedAssetForOfflineTaskBrief);
							}
							if (
								(asset.type == 'Image' || asset.type == 'PDF') &&
								(type == 'WhatsApp' || type == 'Offline-Task-Brief')
							) {
								this.cancelMediaPopUp();
							}
							if (selectedMediaAssetDetails.length == this.selectedAssetForTheDrip.length) {
								this.cancelMediaPopUp();
							}
						}
					});
				}
			}
		}
	}

	getVimeoUserIdFromUrl(url) {
		const parts = url.split('/');
		return parts.at(-1);
	}

	cancelImage(questionIndex, OptionIndex, isQuestion) {
		if (isQuestion) {
			this.DripQuestions[questionIndex].AssetId = null;
			this.DripQuestions[questionIndex].filePath = null;
			this.DripQuestions[questionIndex].fileType = null;
			this.DripQuestions[questionIndex].fileName = null;
		} else {
			this.DripQuestions[questionIndex].DripOptions[OptionIndex].AssetId = null;
			this.DripQuestions[questionIndex].DripOptions[OptionIndex].filePath = null;
			this.DripQuestions[questionIndex].DripOptions[OptionIndex].fileName = null;
			this.DripQuestions[questionIndex].DripOptions[OptionIndex].fileType = null;
		}
	}

	removeQuizQuestionOption(questionIndex, optionIndex) {
		this.DripQuestions[questionIndex].DripOptions.splice(optionIndex, 1);
	}

	selectCorrectAnser(questionIndex, OptionIndex) {
		this.DripQuestions[questionIndex].DripOptions[OptionIndex].isCorrectAnswer =
			!this.DripQuestions[questionIndex].DripOptions[OptionIndex].isCorrectAnswer;

		this.DripQuestions[questionIndex].isAnswerSelected = false;
		// for (let question of this.DripQuestions) {
		// 	for (let option of question.DripOptions) {
		// 		option.isAnswerSelected = false;
		// 	}
		// }
	}
	addQuizQuestionOption(index) {
		this.DripQuestions[index].DripOptions.push({
			text: null,
			AssetId: null,
			filePath: null,
			fileName: null,
			fileType: null,
			isCorrectAnswer: false,
			characterRemainsForOption: null,
			isOptionSelected: false,
			skipQueType: 'Continue to the next question',
		});
	}

	removeQuizQuestionOptionSurvey(questionIndex, optionIndex) {
		this.DripQuestions[questionIndex].ratingScaleMaxCount[optionIndex].DripOptions.splice(optionIndex, 1);
	}

	addQuizQuestionOptionSurvey(index) {
		this.DripQuestions[index].DripOptions = [];
		for (let i = 0; i < this.DripQuestions[index].ratingScaleMaxCount; i++) {
			this.DripQuestions[index].DripOptions.push({
				text: null,
				AssetId: null,
				filePath: null,
				fileName: null,
				fileType: null,
				isCorrectAnswer: false,
				characterRemainsForOption: null,
				isOptionSelected: false,
				skipQueType: 'Continue to the next question',
			});
		}
	}

	deleteQuestion(index) {
		let spinindex = this.DripQuestions[index].spinCatIndex;
		let spinQueScore = this.DripQuestions[index].spinQueScore;
		this.DripQuestions.splice(index, 1);
		if (this.selectedTemplateType == 'Spin The Wheel' && this.spinWheelQueCategory.length > 0) {
			this.spinWheelQueCategory = this.spinWheelQueCategory.map((item) => {
				if (item.category_index === spinindex) {
					return {
						...item,
						totalquestion: item.totalquestion > 0 ? item.totalquestion - 1 : 0,
						totalscore: item.totalscore - spinQueScore > 0 ? item.totalscore - spinQueScore : 0,
						disabled: false,
					};
				}
				return item;
			});
		}

		console.log('--this.spinWheelQueCategory-delete--', this.spinWheelQueCategory);

		this.addTotalQuestionToSkipList();
	}

	addQuestion(questionType = 'MCQ') {
		if (
			this.selectedTemplateType == 'Spin The Wheel' &&
			this.spinWheelQueCategory &&
			this.spinWheelQueCategory.length > 0
		) {
			let noOfQuesForCategory = 0;
			if (this.selectedDripType == 2) {
				noOfQuesForCategory = this.whatsUpNonNativeForm.controls['noOfQueForCat'].value;
			} else if (this.selectedDripType == 3) {
				noOfQuesForCategory = this.emailNoneNativeForm.controls['noOfQueForCat'].value;
			} else if (this.selectedDripType == 4) {
				noOfQuesForCategory = this.dripNativeForm.controls['noOfQueForCat'].value;
			} else if (this.selectedDripType == 6) {
				noOfQuesForCategory = this.dripSharingOnTeamsForm.controls['noOfQueForCat'].value;
			}

			this.spinWheelQueCategory = this.spinWheelQueCategory.map((item) => ({
				...item,
				disabled: false,
			}));

			this.spinWheelQueCategory = this.spinWheelQueCategory.map((item) =>
				item.totalquestion < noOfQuesForCategory ? item : { ...item, disabled: true }
			);

			console.log('--this.spinWheelQueCategory-add--', this.spinWheelQueCategory);
		}

		this.DripQuestions.push({
			question: null,
			characterRemainsForQuestion: null,
			characterRemainsForGeoTag: null,
			characterRemainsForMinLable: null,
			characterRemainsForMaxLable: null,
			AssetId: null,
			fileName: null,
			fileType: null,
			filePath: null,
			questionType: questionType,
			selectAnswer: false,
			answerCount: 1,
			isTranscoding: false,
			selfHostedVideo: false,
			isQuestionSelected: false,
			isTextResponse: true,
			isFileSubmission: false,
			showTranscript: false,
			aiReview: false,
			expectedAnswer: null,
			allowFileTypes: null,
			numberOfFiles: 1,
			isAnswerSelected: false,
			surveyCharLimit: null,
			multipleOption: false,
			cmsVideoId: null,
			ratingScaleMinCount: 1,
			ratingScaleMaxCount: 2,
			isQuesRequired: true,
			UploadOnVimeo: true,
			zoomLinkTo: null,
			spinCatIndex: null,
			spinQueScore: 0,
			isSpinQueScore: false,
			ratingMinLabel: null,
			ratingMaxLabel: null,
			ratingType: 'Box',
			userRatingArray: [],
			DripOptions: [
				{
					text: null,
					filePath: null,
					fileName: null,
					fileType: null,
					AssetId: null,
					isCorrectAnswer: false,
					characterRemainsForOption: null,
					isOptionSelected: false,
					skipQueType: 'Continue to the next question',
				},
				{
					text: null,
					filePath: null,
					fileName: null,
					fileType: null,
					AssetId: null,
					isCorrectAnswer: false,
					characterRemainsForOption: null,
					isOptionSelected: false,
					skipQueType: 'Continue to the next question',
				},
			],
		});

		this.addTotalQuestionToSkipList();
	}

	addTotalQuestionToSkipList() {
		if (this.selectedTemplateType == 'Survey') {
			if (this.DripQuestions.length > 0) {
				this.skipQuestionOptionList = [];
				this.skipQuestionOptionList = [
					{ label: 'Continue to the next question', value: 'Continue to the next question' },
					{ label: 'Submit Form', value: 'Submit Form' },
				];
				for (let i = 1; i < this.DripQuestions.length; i++) {
					let payload = {
						label: `Go to question${i + 1}`,
						value: `${i}`,
					};
					this.skipQuestionOptionList = [...this.skipQuestionOptionList, payload];
				}
			}
		}
	}

	selctedSkipQueDropDown(index) {
		this.skipQuestionOptionList = [];
		this.skipQuestionOptionList = [
			{ label: 'Continue to the next question', value: 'Continue to the next question' },
			{ label: 'Submit Form', value: 'Submit Form' },
		];
		for (let i = index + 1; i < this.DripQuestions.length; i++) {
			let payload = {
				label: `Go to question${i + 1}`,
				value: `${i}`,
			};
			this.skipQuestionOptionList = [...this.skipQuestionOptionList, payload];
		}
	}

	setCreateNewDrip(type) {
		this.selectedCreateDrip = type;
		if (type == 'Use Existing Drip') {
			this.selectedAssetForTheDrip = [];
		}
	}

	showWhatsHeaderMediaPopup() {
		this.showUploadTab = true;

		let type;
		this.showAssetTab = 1;
		if (this.selectedDripType == 1) {
			type = this.whatsUpNativeForm.value.header_type;
			if (type === 'Video') {
				type = 'Whatsapp Video';
			}
			// if (type === 'Video') {
			// 	this.showAssetTab = 4;
			// } else {
			// 	this.showAssetTab = 1;
			// }
		} else if (this.selectedDripType == 2) {
			type = this.whatsUpNonNativeForm.value.header_type;
			if (type === 'Video') {
				type = 'Whatsapp Video';
			}
		} else if (this.selectedDripType == 5) {
			type = this.dripOnlyTeamsForm.value.header_type;
		} else if (this.selectedDripType == 6) {
			type = this.dripSharingOnTeamsForm.value.header_type;
		}
		this.getAllAssetByType(this.selectedClientId, type);
		this.typeForSearch = type;
		setTimeout(() => {
			$('#selectWhatsupHeaderMediaModel').modal('show');
		}, 300);
	}

	cancelSelectWhatsAppHeaderMediaPopup() {
		$('#selectWhatsupHeaderMediaModel').modal('hide');
	}

	selectWhatsUpHeader(asset, index) {
		if (this.selectedDripType == 1) {
			this.whatsUpNativeForm.controls['AssetId'].setValue(asset.id);
			this.whatsUpNativeForm.controls['headerPath'].setValue(asset.Asset_details[0].path);
			this.whatsUpNativeForm.controls['headerFileName'].setValue(asset.Asset_details[0].name);
		} else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
			this.whatsUpNonNativeForm.controls['AssetId'].setValue(asset.id);
			this.whatsUpNonNativeForm.controls['headerPath'].setValue(asset.Asset_details[0].path);
			this.whatsUpNonNativeForm.controls['headerFileName'].setValue(asset.Asset_details[0].name);
		} else if (this.selectedDripType == 5) {
			this.dripOnlyTeamsForm.controls['AssetId'].setValue(asset.id);
			this.dripOnlyTeamsForm.controls['headerPath'].setValue(asset.Asset_details[0].path);
			this.dripOnlyTeamsForm.controls['headerFileName'].setValue(asset.Asset_details[0].name);
		} else if (this.selectedDripType == 6) {
			this.dripSharingOnTeamsForm.controls['AssetId'].setValue(asset.id);
			this.dripSharingOnTeamsForm.controls['headerPath'].setValue(asset.Asset_details[0].path);
			this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(asset.Asset_details[0].name);
		}
		this.cancelSelectWhatsAppHeaderMediaPopup();
	}

	downloadAndSelectWhatsUpHeader(asset, index) {
		console.log('---asset---', asset.id, asset.name);
		this.whatsAppHeaderAssetListByGoogleDrive[index].selected =
			!this.whatsAppHeaderAssetListByGoogleDrive[index].selected;
		if (this.whatsAppHeaderAssetListByGoogleDrive[index].selected) {
			let payload = {
				fileId: asset.id,
				name: asset.name,
				assetType: this.assetTypeForLibaray,
			};
			this.spinnerService.show();
			this.dripService.checkAddDonwloadAssetFormGoogleDrive(payload).subscribe((res: any) => {
				if (res.success) {
					console.log('----res----', res.data);
					if (this.selectedDripType == 1) {
						this.whatsUpNativeForm.controls['AssetId'].setValue(res.data.id);
						this.whatsUpNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
						this.whatsUpNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
					} else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
						this.whatsUpNonNativeForm.controls['AssetId'].setValue(res.data.id);
						this.whatsUpNonNativeForm.controls['headerPath'].setValue(res.data.Asset_details[0].path);
						this.whatsUpNonNativeForm.controls['headerFileName'].setValue(res.data.Asset_details[0].name);
					}
					this.cancelSelectWhatsAppHeaderMediaPopup();
					this.spinnerService.hide();
				}
			});
		}
	}

	removeSelectedHeaderAsset() {
		if (this.selectedDripType == 1) {
			this.whatsUpNativeForm.controls['AssetId'].setValue(null);
			this.whatsUpNativeForm.controls['headerPath'].setValue(null);
			this.whatsUpNativeForm.controls['headerFileName'].setValue(null);
		} else if (this.selectedDripType == 2 || this.selectedDripType == 3 || this.selectedDripType == 4) {
			this.whatsUpNonNativeForm.controls['AssetId'].setValue(null);
			this.whatsUpNonNativeForm.controls['headerPath'].setValue(null);
			this.whatsUpNonNativeForm.controls['headerFileName'].setValue(null);
		} else if (this.selectedDripType == 5) {
			this.dripOnlyTeamsForm.controls['AssetId'].setValue(null);
			this.dripOnlyTeamsForm.controls['headerPath'].setValue(null);
			this.dripOnlyTeamsForm.controls['headerFileName'].setValue(null);
		} else if (this.selectedDripType == 6) {
			this.dripSharingOnTeamsForm.controls['AssetId'].setValue(null);
			this.dripSharingOnTeamsForm.controls['headerPath'].setValue(null);
			this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(null);
		}
	}

	changeAssignTab() {
		this.showUploadTab = !this.showUploadTab;
	}

	changeAssetLibareTab(tab) {
		this.showAssetTab = tab;
	}

	showLinkMediaPopup(index: any) {
		this.getAllAssetByType(this.selectedClientId, 'Link');
		$('#linkAssetModel').modal('show');
		this.selectedCTALinkIndex = index;
	}

	saveAsset() {
		if (this.linkDetails.path && this.linkDetails.title) {
			this.spinnerService.show();
			const uploadData = new FormData();
			for (var key in this.linkDetails) {
				uploadData.append(key, this.linkDetails[key]);
			}
			this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					if (!this.selectAssetForTaskBrief) {
						if (this.selectedCTALinkIndex == 1) {
							this.whatsUpNativeForm.controls['hyper_link'].setValue(res.data.Asset_details[0].path);
							this.dripOnlyTeamsForm.controls['hyper_link1'].setValue(res.data.Asset_details[0].path);
						} else if (this.selectedCTALinkIndex == 2) {
							this.whatsUpNativeForm.controls['hyper_link2'].setValue(res.data.Asset_details[0].path);
							this.dripOnlyTeamsForm.controls['hyper_link2'].setValue(res.data.Asset_details[0].path);
						} else {
							this.dripOnlyTeamsForm.controls['hyper_link3'].setValue(res.data.Asset_details[0].path);
						}
					} else {
						let payload = {
							title: res.data.title,
							AssetId: res.data.id,
							assetType: res.data.field_name,
							path: res.data.Asset_details[0].path,
							fileName: res.data.Asset_details[0].name,
							isTranscoding: res.data.Asset_details[0].isTranscoding,
							selfHostedVideo: res.data.Asset_details[0].selfHostedVideo,
							cmsVideoId: res.data.Asset_details[0].cmsVideoId,
							forPreview: this.forBriefPreview,
						};
						this.selectedAssetForOfflineTaskBrief.push(payload);
					}
					this.cancelMediaPopUp();
					this.spinnerService.hide();
				} else {
					this.spinnerService.hide();
				}
			});
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.addRquiredData'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	cancelpublishWhatsAppTemplateModel() {
		$('#publishWhatsAppTemplateModel').modal('hide');
	}

	publishWhatsAppDrip() {}

	changeTemplateName(type) {
		if (!this.whatsAppSetupData.isMeta) {
			if (type == 1) {
				let templateName = this.whatsUpNativeForm.controls['tempName'].value;
				if (templateName) {
					templateName = templateName.replaceAll(' ', '');
				}
				this.whatsUpNativeForm.controls['tempName'].setValue(templateName);
			} else if (type == 2) {
				let templateName = this.whatsUpNonNativeForm.controls['tempName'].value;
				if (templateName) {
					templateName = templateName.replaceAll(' ', '');
				}
				this.whatsUpNonNativeForm.controls['tempName'].setValue(templateName);
			}
		} else {
			let control = null;
			if (type == 1) {
				control = this.whatsUpNativeForm.get('tempName');
			} else if (type == 2) {
				control = this.whatsUpNonNativeForm.get('tempName');
			}
			let name = control.value;

			if (type == 1) {
				if (name) {
					name = name.replaceAll(' ', '');
				}
				this.whatsUpNativeForm.controls['tempName'].setValue(name);
			} else if (type == 2) {
				if (name) {
					name = name.replaceAll(' ', '');
				}
				this.whatsUpNonNativeForm.controls['tempName'].setValue(name);
			}

			// Pattern: lowercase, numbers, underscores. No starting/ending underscore.
			const validFormat = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/.test(name);
			const isTooLong = name.length > 512;

			if (isTooLong) {
				control.setErrors({ maxLength: true });
			} else if (!validFormat && name.length > 0) {
				control.setErrors({ invalidFormat: true });
			} else {
				control.setErrors(null);
			}
		}
	}

	checkTemplateName(type) {
		let templateName;
		if (type == 1) {
			templateName = this.whatsUpNativeForm.controls['tempName'].value;
		} else if (type == 2) {
			templateName = this.whatsUpNonNativeForm.controls['tempName'].value;
		}

		if (templateName.length >= 3 && templateName.length <= 250) {
			this.dripService.checkTemplateName(templateName, this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					if (!res.data.valid) {
						if (type == 1) {
							$('#DuplicateTemplateNameModel').modal('show');
							this.whatsUpNativeForm.controls['tempName'].setValue('');
						} else if (type == 2) {
							$('#DuplicateTemplateNameModel').modal('show');
							this.whatsUpNonNativeForm.controls['tempName'].setValue('');
						}
					}
				}
			});
		} else {
			if (type == 1) {
				$('#InvalidTemplateNameModel').modal('show');
				this.whatsUpNativeForm.controls['tempName'].setValue('');
			} else if (type == 2) {
				$('#InvalidTemplateNameModel').modal('show');
				this.whatsUpNonNativeForm.controls['tempName'].setValue('');
			}
		}
	}

	cancelDupliTemplate() {
		$('#DuplicateTemplateNameModel').modal('hide');
		$('#InvalidTemplateNameModel').modal('hide');
	}

	getAssetsFilter(key) {
		if (key.length == 0) {
			this.getAllAssetByType(this.selectedClientId, this.typeForSearch);
		}
		if (key.length > 2) {
			this.spinnerService.show();
			this.assetService.getAllAssetsSearchByType(this.selectedClientId, this.typeForSearch, key).subscribe(
				(res: any) => {
					setTimeout(() => {
						this.spinnerService.hide();
					}, 300);
					if (res.success) {
						if (res.success) {
							this.whatsAppHeaderAssetList = [];
							this.whatsAppHeaderAssetList = res.data;
							this.templateAssetList = [];
							this.templateAssetList = res.data;
							for (let asset of this.templateAssetList) {
								asset.selected = false;
							}
						}
					} else {
						this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
					}
				},
				(error) => {}
			);
		}
	}

	transform(url) {
		console.log('---url---', url);
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	selectClient() {
		if (this.selectedClientId) {
			this.getWhatsAppSetup();
			this.getCustomTemplatesByClientId();
			$('#selecteClientList').modal('hide');
		}
	}

	selctedClient(event) {
		this.ownerClient = {
			name: event.name,
			client_id: event.client_id,
		};

		this.appService.getAppBranding(this.selectedClientId).subscribe((res: any) => {
			if (res.success && res.data) {
				this.hideBackBtnToggle = res.data.hideBackBtnToggle;
				this.defaultbackval = res.data.defaultbackval;
			}
		});

		if (!this.hideBackBtnToggle) {
			if (this.defaultbackval == 'Show buttons') {
				this.dripForm.controls['showBackButton'].patchValue(true);
			} else {
				this.dripForm.controls['showBackButton'].patchValue(false);
			}
		} else if (this.appBranding && this.hideBackBtnToggle) {
			this.dripForm.controls['showBackButton'].patchValue(false);
		}
	}

	cancelClientlistPopUp() {
		this.router.navigate(['drips-library']);
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['drips-library']);
			}, 100);
		} else {
			this.router.navigate(['drips-library']);
		}
	}

	checkQuestionValidation(index) {
		this.DripQuestions[index].isQuestionSelected = false;
	}

	checkOptionSelected(questionIndex, optionIndex) {
		this.DripQuestions[questionIndex].DripOptions[optionIndex].isOptionSelected = false;
	}

	onSelectAnswer(questionIndex) {
		this.DripQuestions[questionIndex].selectAnswer = true;
		this.scrollList = document.getElementById('Question_scroll_Index' + questionIndex);
		this.scrollList.scrollIntoView({ behavior: 'smooth' });
	}
	// question.selectAnswer=true;

	selcteInteraction() {
		// console.log("---------------",this.whatsUpNativeForm.controls['interaction'].value);
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('dripPageNo', JSON.stringify(payload));
	}

	uploadOfflineTaskBriefAsset(type) {
		let flag = true;
		setTimeout(() => {
			if (this.selectedAssetForOfflineTaskBrief.length > 0 && this.forBriefPreview) {
				for (let data of this.selectedAssetForOfflineTaskBrief) {
					if (data.forPreview) {
						flag = false;
					}
				}
			}
			// if (flag) {
			this.selectAssetForTaskBrief = true;
			this.typeForSearch = type;
			this.getAllAssetByType(this.selectedClientId, type);
			this.showUploadTab = false;
			if (type == 'Link') {
				$('#linkAssetModel').modal('show');
			} else {
				$('#selectForOfflineTaskBriefMediaModel').modal('show');
			}
			// }
		}, 100);
	}

	selectAssetTaskBrief(asset, index) {
		if (this.selectedAssetForOfflineTaskBrief.length > 0) {
			let temp = null;
			for (let i = 0; i < this.selectedAssetForOfflineTaskBrief.length; i++) {
				if (this.selectedAssetForOfflineTaskBrief[i].AssetId == asset.id) {
					temp = i;
				}
			}
			if (temp >= 0 && temp != null) {
				this.selectedAssetForOfflineTaskBrief.splice(temp, 1);
				this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
			} else {
				let payload = {
					title: asset.title,
					AssetId: asset.id,
					assetType: asset.field_name,
					path: asset.Asset_details[0].path,
					fileName: asset.Asset_details[0].name,
					isTranscoding: asset.Asset_details[0].isTranscoding,
					selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
					cmsVideoId: asset.Asset_details[0].cmsVideoId,
					forPreview: this.forBriefPreview,
				};
				if (this.selectedAssetForOfflineTaskBrief.length < 10) {
					this.selectedAssetForOfflineTaskBrief.push(payload);
				} else {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notselectmorethanTen'),
						this.appService.getTranslation('Utils.error')
					);
					return;
				}
				this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
			}
		} else {
			let payload = {
				title: asset.title,
				AssetId: asset.id,
				assetType: asset.field_name,
				path: asset.Asset_details[0].path,
				fileName: asset.Asset_details[0].name,
				isTranscoding: asset.Asset_details[0].isTranscoding,
				selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
				cmsVideoId: asset.Asset_details[0].cmsVideoId,
				forPreview: this.forBriefPreview,
			};
			this.selectedAssetForOfflineTaskBrief.push(payload);
			this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
		}
		if (this.forBriefPreview) {
			$('#selectForOfflineTaskBriefMediaModel').modal('hide');
		}
		console.log('---Hello--', this.selectedAssetForOfflineTaskBrief);
	}

	selectAssetTaskBriefFromGoogle(whatsAppAsset, index) {
		let asset;
		let payload = {
			fileId: whatsAppAsset.id,
			name: whatsAppAsset.name,
			assetType: this.assetTypeForLibaray,
		};
		this.spinnerService.show();
		this.dripService.checkAddDonwloadAssetFormGoogleDrive(payload).subscribe((res: any) => {
			if (res.success) {
				asset = res.data;
				if (this.selectedAssetForOfflineTaskBrief.length > 0) {
					let temp = null;
					for (let i = 0; i < this.selectedAssetForOfflineTaskBrief.length; i++) {
						if (this.selectedAssetForOfflineTaskBrief[i].AssetId == asset.id) {
							temp = i;
						}
					}
					if (temp >= 0 && temp != null) {
						this.selectedAssetForOfflineTaskBrief.splice(temp, 1);
						this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
					} else {
						let payload = {
							title: asset.title,
							AssetId: asset.id,
							assetType: asset.field_name,
							path: asset.Asset_details[0].path,
							fileName: asset.Asset_details[0].name,
							isTranscoding: asset.Asset_details[0].isTranscoding,
							selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
							cmsVideoId: asset.Asset_details[0].cmsVideoId,
							forPreview: this.forBriefPreview,
						};
						if (this.selectedAssetForOfflineTaskBrief.length < 10) {
							this.selectedAssetForOfflineTaskBrief.push(payload);
						} else {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.notselectmorethanTen'),
								this.appService.getTranslation('Utils.error')
							);
							return;
						}
						this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
					}
				} else {
					let payload = {
						title: asset.title,
						AssetId: asset.id,
						assetType: asset.field_name,
						path: asset.Asset_details[0].path,
						fileName: asset.Asset_details[0].name,
						isTranscoding: asset.Asset_details[0].isTranscoding,
						selfHostedVideo: asset.Asset_details[0].selfHostedVideo,
						cmsVideoId: asset.Asset_details[0].cmsVideoId,
						forPreview: this.forBriefPreview,
					};
					this.selectedAssetForOfflineTaskBrief.push(payload);
					this.templateAssetList[index].selected = !this.templateAssetList[index].selected;
				}
				if (this.forBriefPreview) {
					$('#selectForOfflineTaskBriefMediaModel').modal('hide');
				}
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	cancelBrief(index) {
		this.selectedAssetForOfflineTaskBrief.splice(index, 1);
	}

	forPreviewOrNot(flag) {
		this.forBriefPreview = flag;
	}

	filterPreview(asset) {
		if (!asset.forPreview) {
			return;
		}
	}

	openLink(asset) {
		window.open(`${asset.path}`, '_blank');
	}

	selectAnswerTimeType(type) {}
	selectPollResultType(type) {}

	decreaseCount(index) {}

	increaseCount(index) {
		this.DripQuestions[index].userRatingArray = [];
		for (let i = 1; i <= this.DripQuestions[index].ratingScaleMaxCount; i++) {
			this.DripQuestions[index].userRatingArray.push(i);
		}
	}

	gmailLogin() {
		const USER_ID = JSON.stringify({ UserId: JSON.parse(localStorage.getItem('user')).user.id });
		const redirectUrl = environment.authRedirectUrl;
		const clientId = environment.googleClientId;
		// const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&state=%7B%22UserId%22%3A${USER_ID}%7D&response_type=code&client_id=300693115665-3ij3n2n2hsjg0hj67snpl9c884jjhpm2.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3587%2Fv1%2Fsession%2Foauth%2Fgoogle`;
		const url = ` https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&access_type=offline&redirect_uri=${redirectUrl}&client_id=${clientId}&state=${USER_ID}`;
		window.open(url, '_self');
	}

	logoutGoogleAccount() {
		this.dripService.logoutGoogleAccount().subscribe((res: any) => {
			if (res.success) {
				this.appService.googleDriveLogin = false;
				this.toastr.success(
					this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.googlelogoutsuccessfully'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
	}

	onChangeSurveyQueType(data: any, questionIndex) {
		if (data.type == 'Short answer') {
			this.DripQuestions[questionIndex].surveyCharLimit = 225;
		} else if (data.type == 'Long answer') {
			this.DripQuestions[questionIndex].surveyCharLimit = 700;
		} else if (data.type == 'File upload') {
			this.DripQuestions[questionIndex].UploadOnVimeo = true;
		} else {
			this.DripQuestions[questionIndex].UploadOnVimeo = true;
		}

		//check survey geo tag type selected or not
		if (this.DripQuestions.length > 0) {
			for (let question of this.DripQuestions) {
				if (question.questionType == 'Geo Tag') {
					this.isGeoTagSelected = true;
				} else {
					this.isGeoTagSelected = false;
				}
			}
		}

		if (data.type == 'Rating scale') {
			this.DripQuestions[questionIndex].userRatingArray = [];
			for (let i = 1; i <= this.DripQuestions[questionIndex].ratingScaleMaxCount; i++) {
				this.DripQuestions[questionIndex].userRatingArray.push(i);
			}
		}
	}

	validateLatLongInput(e) {
		let theEvent = e || window.event;
		let key = theEvent.keyCode || theEvent.which;
		key = String.fromCharCode(key);
		let regex = /^(\+|-)?(\d*\.?\d*)$/;
		if (!regex.test(key)) {
			theEvent.preventDefault();
		}
	}

	addInteraction() {
		this.showInteraction = !this.showInteraction;
	}

	// QuickReplyStart
	addQuickReply() {
		if (this.totalInteractionCount < 10) {
			this.quickReplyIndex = this.quickReplyIndex + 1;
			this.totalInteractionCount = this.totalInteractionCount + 1;
			this.selectedInteractionArrayData.push('quickReply1');
			this.quickReplyIndexArrays.push(0);
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.onlyselectupto10Interaction'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	addMoreQuickReplies(index: any, value) {
		if (this.quickReplyIndex < 10) {
			this.quickReplyIndex++;
			this.totalInteractionCount = this.totalInteractionCount + 1;
			this.selectedInteractionArrayData.push(value);
			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}
		}
	}

	cancelQuickReply(index: any, name: any) {
		if (index !== null && index > 0 && index < 11) {
			for (let i = index; i <= 10; i++) {
				if (this.selectedInteractionArrayData.indexOf(`quickReply${i}`) > -1) {
					this.selectedInteractionArrayData.splice(this.selectedInteractionArrayData.indexOf(`quickReply${i}`), 1);
				}
			}

			for (let i = index; i <= this.quickReplyIndex; i++) {
				if (i == this.quickReplyIndex) {
					this.whatsUpNativeForm.controls[`quickReply${i}`].setValue(null);
				} else {
					this.whatsUpNativeForm.controls[`quickReply${i}`].setValue(
						this.whatsUpNativeForm.controls[`quickReply${i + 1}`].value
					);
					this.selectedInteractionArrayData.push(`quickReply${i}`);
				}
			}

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}

			this.quickReplyIndex = this.quickReplyIndex - 1;
			this.totalInteractionCount = this.totalInteractionCount - 1;
			this.interactionSeqNoList = [];
		}
	}

	// callTOActionStart
	addCallToAction() {
		this.showTypeOfAction = true;
	}

	addMoreCallToAction(value) {
		if (value === 'callToActionText2' && this.callToActionIndex < 2) {
			this.callToActionIndex++;
			this.combineActionIndex = this.combineActionIndex + 1;
			this.totalInteractionCount = this.totalInteractionCount + 1;
			this.selectedInteractionArrayData.push(value);
			this.onSelectSequence(this.combineActionIndex, 'callToActionText2');

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}
		} else if (value === 'zoomMeetLink2' && this.zoomMeetingIndex < 2) {
			this.zoomMeetingIndex++;
			this.combineActionIndex = this.combineActionIndex + 1;
			this.totalInteractionCount = this.totalInteractionCount + 1;
			this.selectedInteractionArrayData.push(value);
			this.onSelectSequence(this.combineActionIndex, 'zoomMeetLink2');

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}
		}
	}

	cancelCallToAction(index: any, name: any) {
		let temp = [];
		if (index !== null && index > 0 && index < 3) {
			let flag = false;

			for (let i = 0; i < this.finalInteractionSquList.length; i++) {
				let item = this.finalInteractionSquList[i];
				if (item.value == name) {
					flag = true;
				} else {
					if (!flag) {
						temp.push(item);
					} else {
						if (name == 'callToActionText2' || name == 'callToActionText') {
							if (item.value.includes('callToActionText')) {
								temp.push({ sequenceNo: item.sequenceNo - 1, value: `callToActionText` });
							} else {
								temp.push({ sequenceNo: item.sequenceNo - 1, value: item.value });
							}
						} else {
							if (item.value.includes('zoomMeetLink')) {
								temp.push({ sequenceNo: item.sequenceNo - 1, value: `zoomMeetLink` });
							} else {
								temp.push({ sequenceNo: item.sequenceNo - 1, value: item.value });
							}
						}
					}
				}
			}

			this.finalInteractionSquList = temp;
			console.log('----------finalInteractionSquList', this.finalInteractionSquList);
			if (name === 'callToActionText2' || name === 'callToActionText') {
				for (let i = index; i < 10; i++) {
					if (this.selectedInteractionArrayData.indexOf(`callToActionText${i}`) > -1 && i > 1) {
						this.selectedInteractionArrayData.splice(
							this.selectedInteractionArrayData.indexOf(`callToActionText${i}`),
							1
						);
					} else if (this.selectedInteractionArrayData.indexOf(`callToActionText`) > -1 && i <= 1) {
						this.selectedInteractionArrayData.splice(this.selectedInteractionArrayData.indexOf(`callToActionText`), 1);
					}
				}
			} else {
				for (let i = index; i < 10; i++) {
					if (this.selectedInteractionArrayData.indexOf(`callToActionZoomText${i}`) > -1 && i > 1) {
						this.selectedInteractionArrayData.splice(
							this.selectedInteractionArrayData.indexOf(`callToActionZoomText${i}`),
							1
						);
					} else if (this.selectedInteractionArrayData.indexOf(`callToActionZoomText`) > -1 && i <= 1) {
						this.selectedInteractionArrayData.splice(
							this.selectedInteractionArrayData.indexOf(`callToActionZoomText`),
							1
						);
					}
				}
			}
			if (name === 'callToActionText2' || name === 'callToActionText') {
				for (let i = index; i <= this.callToActionIndex; i++) {
					if (i == this.callToActionIndex && i > 1) {
						this.whatsUpNativeForm.controls[`callToActionText${i}`].setValue(null);
						this.whatsUpNativeForm.controls[`hyper_link${i}`].setValue(null);
						this.whatsUpNativeForm.controls[`trackableLink${i}`].setValue(false);
					} else if (i == this.callToActionIndex && i <= 1) {
						this.whatsUpNativeForm.controls[`callToActionText`].setValue(null);
						this.whatsUpNativeForm.controls[`hyper_link`].setValue(null);
						this.whatsUpNativeForm.controls[`trackableLink`].setValue(true);
					} else {
						this.whatsUpNativeForm.controls[`callToActionText`].setValue(
							this.whatsUpNativeForm.controls[`callToActionText${i + 1}`].value
						);
						this.whatsUpNativeForm.controls[`hyper_link`].setValue(
							this.whatsUpNativeForm.controls[`hyper_link${i + 1}`].value
						);
						this.whatsUpNativeForm.controls[`trackableLink`].setValue(
							this.whatsUpNativeForm.controls[`trackableLink${i + 1}`].value
						);
						this.selectedInteractionArrayData.push(`callToActionText`);
					}
				}
			} else {
				for (let i = index; i <= this.zoomMeetingIndex; i++) {
					if (i == this.zoomMeetingIndex && i > 1) {
						this.whatsUpNativeForm.controls[`callToActionZoomText${i}`].setValue(null);
						this.whatsUpNativeForm.controls[`zoomMeetLink${i}`].setValue(null);
						this.whatsUpNativeForm.controls[`zoomTrackable${i}`].setValue(false);
					} else if (i == this.zoomMeetingIndex && i <= 1) {
						this.whatsUpNativeForm.controls[`callToActionZoomText`].setValue(null);
						this.whatsUpNativeForm.controls[`zoomMeetLink`].setValue(null);
						this.whatsUpNativeForm.controls[`zoomTrackable`].setValue(true);
					} else {
						this.whatsUpNativeForm.controls[`callToActionZoomText`].setValue(
							this.whatsUpNativeForm.controls[`callToActionZoomText${i + 1}`].value
						);
						this.whatsUpNativeForm.controls[`zoomMeetLink`].setValue(
							this.whatsUpNativeForm.controls[`zoomMeetLink${i + 1}`].value
						);
						this.whatsUpNativeForm.controls[`zoomTrackable`].setValue(
							this.whatsUpNativeForm.controls[`zoomTrackable${i + 1}`].value
						);
						this.selectedInteractionArrayData.push(`zoomMeetLink`);
					}
				}
			}

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}

			if (name === 'callToActionText2' || name === 'callToActionText') {
				this.callToActionIndex = this.callToActionIndex - 1;
			} else {
				this.zoomMeetingIndex = this.zoomMeetingIndex - 1;
			}
			this.combineActionIndex = this.combineActionIndex - 1;

			this.totalInteractionCount = this.totalInteractionCount - 1;
			this.interactionSeqNoList = [];
		}
	}

	cancelCallToPhone(index: any, name: any) {
		let temp = [];
		if (index !== null && index > 0 && index < 2) {
			let flag = false;
			for (let i = 0; i < this.finalInteractionSquList.length; i++) {
				let item = this.finalInteractionSquList[i];
				if (item.value == name) {
					flag = true;
				} else {
					if (!flag) {
						temp.push(item);
					} else {
						if (item.value.includes('callphonetext')) {
							temp.push({ sequenceNo: item.sequenceNo - 1, value: `callphonetext` });
						} else {
							temp.push({ sequenceNo: item.sequenceNo - 1, value: item.value });
						}
					}
				}
			}

			this.finalInteractionSquList = temp;

			for (let i = index; i < 10; i++) {
				if (this.selectedInteractionArrayData.indexOf(`callphonetext`) > -1) {
					this.selectedInteractionArrayData.splice(this.selectedInteractionArrayData.indexOf(`callphonetext`), 1);
				}
			}

			for (let i = index; i <= this.callToPhoneIndex; i++) {
				if (i == this.callToPhoneIndex) {
					this.whatsUpNativeForm.controls[`callphonetext`].setValue(null);
					this.whatsUpNativeForm.controls[`callphoneno`].setValue(null);
				} else {
					this.whatsUpNativeForm.controls[`callphonetext`].setValue(
						this.whatsUpNativeForm.controls[`callphonetext`].value
					);
					this.whatsUpNativeForm.controls[`callphoneno`].setValue(this.whatsUpNativeForm.controls[`callphoneno`].value);
					this.selectedInteractionArrayData.push(`callphonetext`);
				}
			}

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}

			this.callToPhoneIndex = this.callToPhoneIndex - 1;
			this.combineActionIndex = this.combineActionIndex - 1;
			this.totalInteractionCount = this.totalInteractionCount - 1;
			this.interactionSeqNoList = [];
		}
	}

	changeInteractionTab(type: any) {
		if (type == 'showQuickReplyTab') {
			this.showQuickReplyTab = true;
			this.showCallToActionTab = false;
		} else if (type == 'showCallToActionTab') {
			this.showQuickReplyTab = false;
			this.showCallToActionTab = true;
		}
	}

	checkToggleTrackableLink(link, type) {
		if (type == 'callToActionText' || type == 'callToActionText2') {
			this.whatsUpNativeForm.controls['zoomTrackable'].setValue(false);
			this.whatsUpNativeForm.controls['zoomTrackable2'].setValue(false);
			if (link == '1') {
				this.whatsUpNativeForm.controls['trackableLink2'].setValue(false);
			} else {
				this.whatsUpNativeForm.controls['trackableLink'].setValue(false);
			}
		} else {
			this.whatsUpNativeForm.controls['trackableLink'].setValue(false);
			this.whatsUpNativeForm.controls['trackableLink2'].setValue(false);

			if (link == '1') {
				this.whatsUpNativeForm.controls['zoomTrackable2'].setValue(false);
			} else {
				this.whatsUpNativeForm.controls['zoomTrackable'].setValue(false);
			}
		}
	}

	checkZoomMeetings() {
		//Send All Zoom Meeeting Data
		this.showZoomMeetingLoader = true;
		if (this.zoomMeetingList.length > 0) {
			this.dripService
				.checkZoomMeetingData({ meetingList: this.zoomMeetingList }, this.selectedClientId)
				.subscribe((res: any) => {
					if (res.success) {
						this.checkZoomMeeting = true;
						this.requiredRegistrationZoomMeeting = [];
						this.notRequiredRegistrationZoomMeeting = [];
						if (
							res.data &&
							(res.data.withRegistrationZoomMeeting?.length > 0 || res.data.withOutRegistrationZoomMeeting?.length > 0)
						) {
							this.requiredRegistrationZoomMeeting = res.data.withRegistrationZoomMeeting;
							this.notRequiredRegistrationZoomMeeting = res.data.withOutRegistrationZoomMeeting;
						} else if (res.data.error) {
							this.toastr.error(res.data.error, 'Error');
						}
						//Stop Loader

						this.showZoomMeetingLoader = false;

						//If any type not have Zoom Meeting the clear the selected data
						if (this.selectedDripType == 1 && this.notRequiredRegistrationZoomMeeting.length == 0) {
							this.whatsUpNativeForm.controls['zoomMeetLink'].setValue(null);
							this.whatsUpNativeForm.controls['callToActionZoomText'].setValue(null);
							this.whatsUpNativeForm.controls['ZoomMeetId'].setValue(null);
							this.whatsUpNativeForm.controls['zoomMeetLink2'].setValue(null);
							this.whatsUpNativeForm.controls['callToActionZoomText2'].setValue(null);
							this.whatsUpNativeForm.controls['ZoomMeetId2'].setValue(null);
							this.whatsUpNativeForm.controls['zoomTrackable'].setValue(false);
							this.whatsUpNativeForm.controls['zoomTrackable2'].setValue(false);

							if (this.selectedInteractionArrayData.indexOf('zoomMeetLink') != -1) {
								this.totalInteractionCount = this.totalInteractionCount - 1;
								this.zoomMeetingIndex = this.zoomMeetingIndex - 1;
								this.combineActionIndex = this.combineActionIndex - 1;
								this.selectedInteractionArrayData.splice(this.selectedInteractionArrayData.indexOf('zoomMeetLink'), 1);
								this.finalInteractionSquList.splice(this.finalInteractionSquList.length - 1, 1);
							}

							this.toastr.warning('No Zoom Meeting Found', 'Warning');
							//Show Toaster Message
							return false;
						} else if (this.selectedDripType == 2 && this.requiredRegistrationZoomMeeting.length == 0) {
							this.whatsUpNonNativeForm.controls['isZoomMeeting'].setValue(false);
							this.whatsUpNonNativeForm.controls['zoomMeetLink'].setValue(null);
							this.whatsUpNonNativeForm.controls['ZoomMeetText'].setValue(null);
							this.whatsUpNonNativeForm.controls['ZoomMeetId'].setValue(null);
							this.whatsUpNonNativeForm.controls['templateType'].setValue(null);
							this.selectedTemplateType = null;
							this.toastr.warning('No Zoom Meeting Found', 'Warning');

							//Show Toaster Message
							return false;
						}

						return true;
					}
				});
		} else {
			this.checkZoomMeeting = true;
			return true;
		}
	}

	async onTypeOfAction(action) {
		if (this.totalInteractionCount < 10) {
			if (action.name == 'Visit Websites') {
				if (this.selectedInteractionArrayData.indexOf(`callToActionText`) == -1) {
					this.totalInteractionCount = this.totalInteractionCount + 1;
					this.callToActionIndex = this.callToActionIndex + 1;
					this.combineActionIndex = this.combineActionIndex + 1;
					this.selectedInteractionArrayData.push('callToActionText');
					this.onSelectSequence(this.combineActionIndex, 'callToActionText');
				}
			} else if (action.name == 'Call Phone Number') {
				if (this.selectedInteractionArrayData.indexOf(`callphonetext`) == -1) {
					this.totalInteractionCount = this.totalInteractionCount + 1;
					this.callToPhoneIndex = this.callToPhoneIndex + 1;
					this.combineActionIndex = this.combineActionIndex + 1;
					this.selectedInteractionArrayData.push('callphonetext');
					this.onSelectSequence(this.combineActionIndex, 'callphonetext');
				}
			} else if (action.name == 'Visit Zoom Meeting Link') {
				//Get Zoom meeting links
				if (!this.checkZoomMeeting) {
					await this.checkZoomMeetings();
				}
				if (this.selectedInteractionArrayData.indexOf('zoomMeetLink') == -1) {
					this.totalInteractionCount = this.totalInteractionCount + 1;
					this.zoomMeetingIndex = this.zoomMeetingIndex + 1;
					this.combineActionIndex = this.combineActionIndex + 1;
					this.selectedInteractionArrayData.push('zoomMeetLink');
					this.onSelectSequence(this.combineActionIndex, 'zoomMeetLink');
				}
			}

			this.quickReplyIndexArrays = [];
			this.callToactionArrays = [];
			this.zoomMeetingArrays = [];
			for (let i = 0; i < this.selectedInteractionArrayData.length; i++) {
				if (this.selectedInteractionArrayData[i].includes('quickReply')) {
					this.quickReplyIndexArrays.push(i);
				} else if (this.selectedInteractionArrayData[i].includes('zoomMeetLink')) {
					this.zoomMeetingArrays.push(i);
				} else {
					this.callToactionArrays.push(i);
				}
			}
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.onlyselectupto10Interaction'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	onSelectSequence(index: any, value: any) {
		let payload = {
			sequenceNo: index,
			value: value,
		};
		this.finalInteractionSquList.push(payload);
	}

	switchTabs() {
		this.quickReplyFirst = !this.quickReplyFirst;
	}

	selectZoomMeeting(data) {
		console.log('----data--', data);
		if (this.f2.isZoomMeeting.value) {
			// Default data
			this.DripQuestions = [];
			if (!this.checkZoomMeeting) {
				this.checkZoomMeetings();
			}
		} else {
			//Add MCq Data
			this.DripQuestions = [];
			this.addQuestion();
		}
	}

	addZoomQuestion(question?, isRequired?, questionType?, zoomLinkTo?) {
		this.DripQuestions.push({
			question: question ? question : null,
			characterRemainsForQuestion: null,
			characterRemainsForGeoTag: null,
			characterRemainsForMinLable: null,
			characterRemainsForMaxLable: null,
			AssetId: null,
			fileName: null,
			fileType: null,
			filePath: null,
			questionType: questionType ? questionType : null,
			selectAnswer: false,
			answerCount: 1,
			isTranscoding: false,
			selfHostedVideo: false,
			isQuestionSelected: false,
			isTextResponse: true,
			cmsVideoId: null,
			isFileSubmission: false,
			showTranscript: false,
			aiReview: false,
			expectedAnswer: null,
			allowFileTypes: null,
			numberOfFiles: 1,
			isAnswerSelected: false,
			surveyCharLimit: null,
			multipleOption: false,
			ratingScaleMinCount: 1,
			ratingScaleMaxCount: 2,
			isQuesRequired: isRequired != null && isRequired == false ? isRequired : true,
			zoomLinkTo: zoomLinkTo ? zoomLinkTo : null,
			UploadOnVimeo: true,
			spinCatIndex: null,
			spinQueScore: 0,
			isSpinQueScore: false,
			ratingMinLabel: null,
			ratingMaxLabel: null,
			ratingType: 'Box',
			userRatingArray: [],
			DripOptions: [],
		});
	}

	selectRegistorZoomMeeting(event) {
		console.log('------selectRegistorZoomMeeting', event);
		this.DripQuestions = [];
		this.addZoomQuestion('First Name', true, 'Short answer', 'First Name');
		this.addZoomQuestion('Last Name', true, 'Short answer', 'Last Name');
		this.addZoomQuestion('Email', true, 'Email', 'Email');
		if (event && event.registrationData && Object.keys(event.registrationData).length > 0) {
			this.whatsUpNonNativeForm.controls['ZoomMeetId'].setValue(event.id);
			if (event.registrationData?.questions?.length > 0) {
				//Adding Default First Name, Last Name, Email
				for (let field of event.registrationData.questions) {
					let label;
					let isRequired = false;
					let questionType;
					isRequired = field.required;
					if (field.field_name === 'address') {
						label = 'Address';
						questionType = 'Short answer';
					} else if (field.field_name === 'phone') {
						label = 'Phone';
						questionType = 'Mobile No';
					} else if (field.field_name === 'comments') {
						label = 'Questions And Comments';
						questionType = 'Short answer';
					} else if (field.field_name === 'city') {
						label = 'City';
						questionType = 'Short answer';
					} else if (field.field_name === 'zip') {
						label = 'Zip Code';
						questionType = 'Short answer';
					} else if (field.field_name === 'org') {
						label = 'Organization';
						questionType = 'Short answer';
					}

					// Adding Label As Question
					if (label && label != null && label != '') {
						this.addZoomQuestion(label, isRequired, questionType, label);
					}
				}
			}

			if (event.registrationData?.custom_questions?.length > 0) {
				for (let field of event.registrationData.custom_questions) {
					let label;
					let isRequired = false;
					let questionType = 'Short answer';
					isRequired = field.required;
					if (field.title) {
						label = field.title;
					}
					// Adding Label As Question
					if (label && label != null && label != '') {
						if (field.type === 'short' || field.type === 'long') {
							//Adding Short Answer
							this.addZoomQuestion(label, isRequired, questionType, label);
						} else {
							//Adding MCQ
						}
					}
				}
			}
		}
	}

	selectZoomMeet(data, number) {
		if (number === 1 && data) {
			this.whatsUpNativeForm.controls['ZoomMeetId'].setValue(data.id);
		} else if (number === 2 && data) {
			this.whatsUpNativeForm.controls['ZoomMeetId2'].setValue(data.id);
		}
	}

	// ------microsoft Teams----------
	addCTATeams() {
		if (this.totalInteractionCount < 3) {
			this.callToActionIndex = this.callToActionIndex + 1;
			this.totalInteractionCount = this.totalInteractionCount + 1;
			this.selectedInteractionCTTeamsArrayData.push('callToActionText1');
			this.callToactionArrays.push(0);
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.onlyselectupto10Interaction'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	addMoreCallToActionTeams(value) {
		this.callToActionIndex++;
		this.combineActionIndex = this.combineActionIndex + 1;
		this.selectedInteractionCTTeamsArrayData.push(value);

		this.callToactionArrays = [];

		for (let i = 0; i < this.selectedInteractionCTTeamsArrayData.length; i++) {
			this.callToactionArrays.push(i);
		}
	}

	cancelCallToActionTeams(index: any, name: any) {
		if (index !== null && index > 0 && index < 4) {
			for (let i = index; i <= 3; i++) {
				if (this.selectedInteractionCTTeamsArrayData.indexOf(`callToActionText${i}`) > -1) {
					this.selectedInteractionCTTeamsArrayData.splice(
						this.selectedInteractionCTTeamsArrayData.indexOf(`callToActionText${i}`),
						1
					);
				}
			}

			for (let i = index; i <= this.callToActionIndex; i++) {
				if (i == this.callToActionIndex) {
					this.dripOnlyTeamsForm.controls[`callToActionText${i}`].setValue(null);
					this.dripOnlyTeamsForm.controls[`hyper_link${i}`].setValue(null);
					this.dripOnlyTeamsForm.controls[`trackableLink${i}`].setValue(false);
				} else {
					this.dripOnlyTeamsForm.controls[`callToActionText${i}`].setValue(
						this.dripOnlyTeamsForm.controls[`callToActionText${i + 1}`].value
					);
					this.dripOnlyTeamsForm.controls[`hyper_link${i + 1}`].setValue(
						this.dripOnlyTeamsForm.controls[`hyper_link${i + 1}`].value
					);
					this.dripOnlyTeamsForm.controls[`trackableLink${i + 1}`].setValue(
						this.dripOnlyTeamsForm.controls[`trackableLink${i + 1}`].value
					);
					this.selectedInteractionCTTeamsArrayData.push(`callToActionText${i}`);
				}
			}

			this.callToactionArrays = [];
			for (let i = 0; i < this.selectedInteractionCTTeamsArrayData.length; i++) {
				if (this.selectedInteractionCTTeamsArrayData[i].includes('callToActionText')) {
					this.callToactionArrays.push(i);
				}
			}

			this.callToActionIndex = this.callToActionIndex - 1;
			this.totalInteractionCount = this.totalInteractionCount - 1;
			this.interactionSeqNoList = [];
		}
	}

	selectTeamsAttachmentType(type, dripType) {
		if (dripType == 'onlyTeams') {
			this.dripOnlyTeamsForm.controls['AssetId'].setValue(null);
			this.dripOnlyTeamsForm.controls['headerFileName'].setValue(null);
			this.dripOnlyTeamsForm.controls['headerPath'].setValue(null);
			this.dripSharingOnTeamsForm.controls['header_type'].setValue(null);
		} else {
			this.dripSharingOnTeamsForm.controls['AssetId'].setValue(null);
			this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(null);
			this.dripSharingOnTeamsForm.controls['headerPath'].setValue(null);
			this.dripOnlyTeamsForm.controls['header_type'].setValue(null);
		}
		if (type != 'None' && type != 'Text') {
			this.typeForSearch = type;
		}
	}

	checkToggleTrackableLinkTeam(link, type) {
		if (link == '1') {
			this.dripOnlyTeamsForm.controls['trackableLink2'].setValue(false);
			this.dripOnlyTeamsForm.controls['trackableLink3'].setValue(false);
		} else if (link == '2') {
			this.dripOnlyTeamsForm.controls['trackableLink1'].setValue(false);
			this.dripOnlyTeamsForm.controls['trackableLink3'].setValue(false);
		} else if (link == '3') {
			this.dripOnlyTeamsForm.controls['trackableLink1'].setValue(false);
			this.dripOnlyTeamsForm.controls['trackableLink2'].setValue(false);
		}
	}

	addExternalLink() {
		if (this.externalLinkCount < 10) {
			this.externalLinkCount++;
		}
	}

	cancelExternalLink(index) {
		if (this.externalLinkCount > 1) {
			this.externalLinkCount--;
		}
		//get all data into one Array
		let temp = [];
		for (let i = 1; i <= 10; i++) {
			temp.push({
				externalLink: this.dripForm.controls[`externalLink${i}`].value,
				externalLinkLable: this.dripForm.controls[`externalLinkLabel${i}`].value,
			});
		}
		temp.splice(index - 1, 1);

		//set all data into form
		for (let i = 1; i <= 10; i++) {
			if (temp.length >= i) {
				this.dripForm.controls[`externalLink${i}`].setValue(temp[i - 1].externalLink);
				this.dripForm.controls[`externalLinkLabel${i}`].setValue(temp[i - 1].externalLinkLable);
			} else {
				this.dripForm.controls[`externalLink${i}`].setValue(null);
				this.dripForm.controls[`externalLinkLabel${i}`].setValue(null);
			}
		}
	}

	//HTML Dyanamic Pages
	addOneDyanamicPage() {
		let payload = {
			pageString: null,
		};
		this.allDyanamicPages.push(payload);
	}

	removeSocialMedia(index) {
		this.allDyanamicPages.splice(index, 1);
	}

	readHTMLCode(i) {
		// let match;
		const srcRegex = /src\s*=\s*"([^"]*)"/g;
		// while ((match = srcRegex.exec(this.allDyanamicPages[i].pageString)) !== null) {
		// 	this.dyanamicSrcValues.push(match[1]);
		// }
		// const imgSrcRegex = /<img\s[^>]*src\s*=\s*"([^"]*)"/g;
		// const videoSrcRegex = /<video\s[^>]*src\s*=\s*"([^"]*)"/g;

		let imgMatch;
		let videoMatch;

		this.dynamicImgSrcValues = [];
		this.dynamicVideoSrcValues = [];

		// Extract all img src values
		while ((imgMatch = srcRegex.exec(this.allDyanamicPages[i].pageString)) !== null) {
			this.dynamicImgSrcValues.push(imgMatch[1]);
		}

		// Extract all video src values
		// while ((videoMatch = videoSrcRegex.exec(this.allDyanamicPages[i].pageString)) !== null) {
		// 	this.dynamicVideoSrcValues.push(videoMatch[1]);
		// }
	}

	showSelectDyanamicMediaPopup(index, type) {
		// let type;
		// type = 'Image';
		this.selectDyanamicAssetId = index;
		this.getAllAssetByType(this.selectedClientId, type);
		setTimeout(() => {
			$('#selectMediaModelForDyanamicPages').modal('show');
		}, 300);
	}

	selectAssetForDyanamicPages(asset, type) {
		const srcRegex = /src\s*=\s*"([^"]*)"/g;
		// const imgSrcRegex = /<img\s[^>]*src\s*=\s*"([^"]*)"/g;
		// const videoSrcRegex = /<video\s[^>]*src\s*=\s*"([^"]*)"/g;
		let newPageString;
		// if (type == 'Image') {
		let matchImageCount = 0;
		newPageString = this.allDyanamicPages[0].pageString.replace(srcRegex, (match, p1) => {
			console.log('-match', match);
			if (matchImageCount === this.selectDyanamicAssetId) {
				const newSrc = asset.Asset_details[0].path;
				this.dynamicImgSrcValues[this.selectDyanamicAssetId] = newSrc;
				matchImageCount++;
				return `src="${this.assetBasePath + newSrc}"`;
			}
			matchImageCount++;
			return match;
		});
		// }
		// else if (type == 'Video') {
		// 	let matchVideoCount = 0;
		// 	newPageString = this.allDyanamicPages[0].pageString.replace(videoSrcRegex, (match, p1) => {
		// 		if (matchVideoCount === this.selectDyanamicAssetId) {
		// 			const newSrc = asset.Asset_details[0].path;
		// 			this.dynamicVideoSrcValues[this.selectDyanamicAssetId] = newSrc;
		// 			matchVideoCount++;
		// 			return `src="${newSrc}"`;
		// 		}
		// 		matchVideoCount++;
		// 		return match;
		// 	});
		// }

		this.allDyanamicPages[0].pageString = newPageString;
		this.cancelMediaPopUp();
	}

	uploadAssetForDyanamicPages(event, type) {
		let selectedMediaAssetDetails = [];
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.spinnerService.show();
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				fileName = fileName.replace('.png', '').replace('.jpg', '');
				if (mediaType.includes('image')) {
					mediaType = 'Image';
				}

				let payload = {
					title: fileName,
					tagName: null,
					description: null,
					type: mediaType,
					otherDetails: media,
					size: media.size,
				};

				selectedMediaAssetDetails.push(payload);
			}

			for (let asset of selectedMediaAssetDetails) {
				const uploadData = new FormData();
				for (var key in asset) {
					if (key == 'otherDetails') {
						uploadData.append(asset.type, asset[key]);
					} else {
						uploadData.append(key, asset[key]);
					}
				}
				if (asset.type == 'Image') {
					if (asset.size >= 2097152) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maximage2MB'),
							this.appService.getTranslation('Utils.error')
						);
						return;
					}
				}

				this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
					if (res.success) {
						this.spinnerService.hide();
						if (type == 'Thambnail') {
							const srcRegex = /src\s*=\s*"([^"]*)"/g;
							let matchCount = 0;
							let newPageString = this.allDyanamicPages[0].pageString.replace(srcRegex, (match, p1) => {
								if (matchCount === this.selectDyanamicAssetId) {
									const newSrc = res.data.Asset_details[0].path;
									this.dynamicImgSrcValues[this.selectDyanamicAssetId] = newSrc;
									matchCount++;
									return `src="${this.assetBasePath + newSrc}"`;
								}
								matchCount++;
								return match;
							});

							this.allDyanamicPages[0].pageString = newPageString;
						}
						this.cancelMediaPopUp();
					}
				});
			}
		}
	}

	boldWordsBetweenAsterisks(input) {
		const boldRegex = /\*([^*]+)\*/g;
		const italicRegex = /_([^_]+)_/g;
		const strikethroughRegex = /~([^~]+)~/g;
		const monospaceRegex = /```([^`]+)```/g;
		const inlinemonospace = /`([^`]+)`/g;
		const bulletListRegex = /(^|\n)(\*|-)\s+(.+?)(?=\n|$)/g;
		const blockquoteRegex = /(^|\n)>\s*(.+)/g;

		// Apply formatting
		let result = input.replace(boldRegex, '<b>$1</b>');
		result = result.replace(italicRegex, '<i>$1</i>');
		result = result.replace(strikethroughRegex, '<s>$1</s>');
		result = result.replace(monospaceRegex, '<code class="monospace">$1</code>');
		result = result.replace(inlinemonospace, '<code class="inline-monospace">$1</code>');
		result = result.replace(bulletListRegex, (match, p1, p2, p3) => `${p1}<li>${p3}</li>`);
		result = result.replace(blockquoteRegex, (match, p1, p2) => `${p1}| ${p2}`);
		result = result.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
		return result;
	}

	captionTextOrLink(input, id) {
		setTimeout(() => {
			const output = this.textLink(input);
			const contentDiv = document.getElementById(`${id}`);
			if (contentDiv) {
				contentDiv.innerHTML = output;
			}
		}, 100);
		this.pwaHeaderCaptionRequired = false;
	}

	textLink(text) {
		if (!text) return '';
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		return text.replace(urlPattern, (match) => {
			const url = match.startsWith('http') ? match : `http://${match}`;
			return `<a href="${url}" target="_blank">${match}</a>`;
		});
	}

	readbrodSideEmailHTMLCode(type) {
		this.brodSideSendingEMailType = type;
		const srcRegex = /src\s*=\s*"([^"]*)"/g;
		let imgMatch;
		this.brodSideEmailImgSrcValues = [];
		this.brodSideEmailImgFilePaths = [];
		// Extract all img src values
		if (type == 'onlyEmail') {
			while ((imgMatch = srcRegex.exec(this.onlyEmailForm.controls['email_body'].value)) !== null) {
				this.isImageInEmailTemplate = true;
				this.brodSideEmailImgSrcValues.push(imgMatch[1]);
				let payload = {
					filePath: imgMatch[1],
				};
				this.brodSideEmailImgFilePaths.push(payload);
			}
		} else if (type == 'dripWithEmail') {
			while ((imgMatch = srcRegex.exec(this.emailNoneNativeForm.controls['email_body'].value)) !== null) {
				this.isImageInEmailTemplate = true;
				this.brodSideEmailImgSrcValues.push(imgMatch[1]);
				let payload = {
					filePath: imgMatch[1],
				};
				this.brodSideEmailImgFilePaths.push(payload);
			}
		}
	}

	showBrodSideEmailUploadAssetPopup(index) {
		this.selectDyanamicAssetId = index;
		setTimeout(() => {
			$('#selectBrodSideEmailUploadAssetModel').modal('show');
		}, 300);
	}

	uploadBrodSideEmailTemplateAsset(event, type) {
		let selectedAssetDetails = [];
		this.brodSideAssetUpload = undefined;
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.spinnerService.show();
			for (let media of event.target.files) {
				let mediaType = media.type;
				let content;
				if (mediaType.includes('image')) {
					mediaType = 'Image';
				}
				const reader = new FileReader();
				reader.onload = () => {
					let data: any = reader.result;
					content = data.split(',')[1];
				};
				reader.readAsDataURL(media);

				const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
				let randomRefId = '';
				const charactersLength = characters.length;
				for (let i = 0; i < 5; i++) {
					randomRefId += characters.charAt(Math.floor(Math.random() * charactersLength));
				}

				let fileName = media.name;
				setTimeout(() => {
					let payload = {
						refId: randomRefId + '-' + this.UserId,
						fileName: fileName,
						content: content,
						purpose: {
							type: 'CID',
						},
						description: null,
					};

					selectedAssetDetails.push(payload);
					for (let asset of selectedAssetDetails) {
						this.dripService.createEmailAssetOnBroadSide(asset).subscribe((res: any) => {
							if (res.success) {
								this.spinnerService.hide();
								const srcRegex = /src\s*=\s*"([^"]*)"/g;
								let string;

								if (this.brodSideSendingEMailType == 'onlyEmail') {
									string = this.onlyEmailForm.controls['email_body'].value;
								} else if (this.brodSideSendingEMailType == 'dripWithEmail') {
									string = this.emailNoneNativeForm.controls['email_body'].value;
								}

								let matchCount = 0;
								let newPageString = string.replace(srcRegex, (match, p1) => {
									if (matchCount === this.selectDyanamicAssetId) {
										const newSrc = `/var/warehouse/data/${fileName}`;
										this.brodSideEmailImgSrcValues[this.selectDyanamicAssetId] = fileName;
										this.brodSideEmailImgFilePaths[this.selectDyanamicAssetId].filePath = newSrc;
										console.log('-this.brodSideEmailImgFilePaths-', this.brodSideEmailImgFilePaths);
										matchCount++;
										return `src="${newSrc}"`;
									}
									matchCount++;
									return match;
								});

								if (this.brodSideSendingEMailType == 'onlyEmail') {
									this.onlyEmailForm.controls['email_body'].setValue(newPageString);
								} else if (this.brodSideSendingEMailType == 'dripWithEmail') {
									this.emailNoneNativeForm.controls['email_body'].setValue(newPageString);
								}

								this.cancelMediaPopUp();
								this.toastr.success(res.data.messages, this.appService.getTranslation('Utils.success'));
							} else {
								this.spinnerService.hide();
								this.toastr.error(res.data.messages, this.appService.getTranslation('Utils.error'));
							}
						});
					}
				}, 200);
			}
		}
	}

	selectBrodSideEmailAttachmentType(type, dripType) {
		if (type == 'Image') {
			this.allowFileFormat = '.jpg, .png';
		} else {
			this.allowFileFormat = '.pdf';
		}

		if (dripType == 'onlyEmail') {
			this.emailNoneNativeForm.controls['brod_attach_type'].setValue(null);
		} else {
			this.onlyEmailForm.controls['brod_attach_type'].setValue(null);
		}
	}

	showBrodSideEmailAttachmentPopup() {
		setTimeout(() => {
			$('#selectBrodSideEmailAttachmentModel').modal('show');
		}, 300);
	}

	removeBrodSideEmailAttachment(index) {
		this.brodSideEmailAttachments.splice(index, 1);
	}

	uploadBrodSideEmailTemplateAttachment(event) {
		let selectedAssetDetails = [];
		this.brodSideAssetUpload = undefined;
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.spinnerService.show();
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				let content;

				if (mediaType.includes('pdf')) {
					mediaType = 'PDF';
				} else if (mediaType.includes('image')) {
					mediaType = 'Image';
				}

				if (this.allowFileFormat == '.pdf' && mediaType != 'PDF') {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.uploadselectedAttachmentType'),
						this.appService.getTranslation('Utils.error')
					);
					this.spinnerService.hide();
					return;
				} else if (this.allowFileFormat == '.jpg, .png' && mediaType != 'Image') {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.uploadselectedAttachmentType'),
						this.appService.getTranslation('Utils.error')
					);
					this.spinnerService.hide();
					return;
				}

				const reader = new FileReader();
				reader.onload = () => {
					let data: any = reader.result;
					content = data.split(',')[1];
				};
				reader.readAsDataURL(media);

				const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
				let randomRefId = '';
				const charactersLength = characters.length;
				for (let i = 0; i < 5; i++) {
					randomRefId += characters.charAt(Math.floor(Math.random() * charactersLength));
				}

				setTimeout(() => {
					let payload = {
						refId: randomRefId + '-' + this.UserId,
						fileName: fileName,
						content: content,
						purpose: {
							type: 'attachment',
						},
						description: null,
					};

					selectedAssetDetails.push(payload);
					for (let asset of selectedAssetDetails) {
						this.dripService.createEmailAssetOnBroadSide(asset).subscribe((res: any) => {
							if (res.success) {
								this.spinnerService.hide();
								const newSrc = `/var/warehouse/data/${fileName}`;
								let payload = {
									filePath: newSrc,
								};
								this.brodSideEmailAttachments.push(payload);
								console.log('-broadSideEmailAttachments-', this.brodSideEmailAttachments);
								this.cancelMediaPopUp();
								this.toastr.success(res.data.messages, this.appService.getTranslation('Utils.success'));
							} else {
								this.spinnerService.hide();
								this.toastr.error(res.data.messages, this.appService.getTranslation('Utils.error'));
							}
						});
					}
				}, 200);
			}
		}
	}

	showTeamsDriveMediaPopup() {
		let type;
		if (this.selectedDripType == 5) {
			type = this.dripOnlyTeamsForm.value.header_type;
		} else if (this.selectedDripType == 6) {
			type = this.dripSharingOnTeamsForm.value.header_type;
		}
		if (type == 'Video') {
			if (this.teamOneDriveVideoFilesList && this.teamOneDriveVideoFilesList.length == 0) {
				this.getOneDriveFilesForTeams(type);
			}
		} else if (type == 'Document') {
			if (this.teamOneDriveDocumentFilesList && this.teamOneDriveDocumentFilesList.length == 0) {
				this.getOneDriveFilesForTeams(type);
			}
		}
		this.showAssetTab = 2;
		setTimeout(() => {
			$('#selectTeamsDriveMediaModel').modal('show');
		}, 300);
	}

	getOneDriveFilesForTeams(type) {
		this.onedrivefilefetch = false;
		this.dripService.getAllOneDriveFileForTeamsByType(type).subscribe((res: any) => {
			if (res.success) {
				if (type == 'Video') {
					this.oneDriveVideoFiles = [];
					this.teamOneDriveVideoFilesList = [];
					this.teamOneDriveVideoFilesList = res.data;
					this.oneDriveVideoFiles = res.data;
					console.log('--teamOneDriveVideoFilesList-', this.teamOneDriveVideoFilesList);
				} else if (type == 'Document') {
					this.oneDriveDocumentFiles = [];
					this.teamOneDriveDocumentFilesList = [];
					this.teamOneDriveDocumentFilesList = res.data;
					this.oneDriveDocumentFiles = res.data;
					console.log('--teamOneDriveDocumentFilesList-', this.teamOneDriveDocumentFilesList);
				}
				this.onedrivefilefetch = true;
			} else {
				this.onedrivefilefetch = false;
			}
		});
	}

	selectOneDriveFiles(asset, index) {
		if (this.selectedDripType == 5) {
			this.dripOnlyTeamsForm.controls['AssetId'].setValue(null);
			this.dripOnlyTeamsForm.controls['headerPath'].setValue(asset.url);
			this.dripOnlyTeamsForm.controls['headerFileName'].setValue(asset.name);
		} else if (this.selectedDripType == 6) {
			this.dripSharingOnTeamsForm.controls['AssetId'].setValue(null);
			this.dripSharingOnTeamsForm.controls['headerPath'].setValue(asset.url);
			this.dripSharingOnTeamsForm.controls['headerFileName'].setValue(asset.name);
		}
		this.cancelMediaPopUp();
	}

	searchOneDriveFiles(text) {
		let type;
		if (this.selectedDripType == 5) {
			type = this.dripOnlyTeamsForm.value.header_type;
		} else if (this.selectedDripType == 6) {
			type = this.dripSharingOnTeamsForm.value.header_type;
		}
		if (type == 'Video') {
			if (text.length > 0) {
				this.teamOneDriveVideoFilesList = [];
				for (let item of this.oneDriveVideoFiles) {
					// ||item.submit_status.toLowerCase().includes(text.toLowerCase())
					if (item.name.toLowerCase().includes(text.toLowerCase())) {
						this.teamOneDriveVideoFilesList.push(item);
					}
				}
			} else {
				this.teamOneDriveVideoFilesList = [];
				this.teamOneDriveVideoFilesList = this.oneDriveVideoFiles;
			}
		} else if (type == 'Document') {
			if (text.length > 0) {
				this.teamOneDriveDocumentFilesList = [];
				for (let item of this.oneDriveDocumentFiles) {
					if (item.name.toLowerCase().includes(text.toLowerCase())) {
						this.teamOneDriveDocumentFilesList.push(item);
					}
				}
			} else {
				this.teamOneDriveDocumentFilesList = [];
				this.teamOneDriveDocumentFilesList = this.oneDriveDocumentFiles;
			}
		}
	}

	//Spin The Wheel
	addOneSpinQuestionCategory() {
		this.spinWheelQueCategory = [
			...this.spinWheelQueCategory,
			{
				category_index: 1,
				category_name: null,
				totalquestion: 0,
				totalscore: 0,
				characterRemain: 0,
			},
		];
		this.increaseCountForSpinQuestionCategry();
		this.addMinTwoSpinCategory = false;
		this.spinCatCountGreaterThanWheelCount = false;
	}

	removeSpinQuestionCategory(index) {
		this.spinWheelQueCategory.splice(index, 1);
		this.spinWheelQueCategory = [...this.spinWheelQueCategory];
		this.increaseCountForSpinQuestionCategry();
	}

	increaseCountForSpinQuestionCategry() {
		let count = 0;
		if (this.spinWheelQueCategory.length > 1) {
			for (let item of this.spinWheelQueCategory) {
				count++;
				item.category_index = count;
			}
		}
	}

	selectSpinWheeelQuestionCat() {
		if (this.spinWheelQueCategory.length > 0) {
			for (let item of this.spinWheelQueCategory) {
				item.totalscore = 0;
				item.totalquestion = 0;
				for (let que of this.DripQuestions) {
					if (que.spinCatIndex == item.category_index) {
						item.totalscore = item.totalscore + Number(que.spinQueScore);
						item.totalquestion = item.totalquestion + 1;
					}
				}
			}
		}
		let noOfQuesForCategory = 0;
		if (this.selectedDripType == 2) {
			noOfQuesForCategory = this.whatsUpNonNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 3) {
			noOfQuesForCategory = this.emailNoneNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 4) {
			noOfQuesForCategory = this.dripNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 6) {
			noOfQuesForCategory = this.dripSharingOnTeamsForm.controls['noOfQueForCat'].value;
		}
		this.spinWheelQueCategory = this.spinWheelQueCategory.map((item) => ({
			...item,
			disabled: false,
		}));
		this.spinWheelQueCategory = this.spinWheelQueCategory.map((item) =>
			item.totalquestion < noOfQuesForCategory ? item : { ...item, disabled: true }
		);
	}

	onEnterSpinTheWheelQuestion(catIndex) {
		this.spinWheelQueCategory = [...this.spinWheelQueCategory];
		this.charcterRemainForQueCategory(catIndex);

		let noOfQuesForCategory = 0;
		if (this.selectedDripType == 2) {
			noOfQuesForCategory = this.whatsUpNonNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 3) {
			noOfQuesForCategory = this.emailNoneNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 4) {
			noOfQuesForCategory = this.dripNativeForm.controls['noOfQueForCat'].value;
		} else if (this.selectedDripType == 6) {
			noOfQuesForCategory = this.dripSharingOnTeamsForm.controls['noOfQueForCat'].value;
		}

		if (noOfQuesForCategory <= 0) {
			this.isZeroSpinQuesCategory = true;
		}
	}

	charcterRemainForQueCategory(catIndex) {
		if (catIndex != null) {
			this.spinWheelQueCategory[catIndex].characterRemain =
				this.spinWheelQueCategory[catIndex] && this.spinWheelQueCategory[catIndex].category_name
					? this.maxLengthForCatQue - Number(this.spinWheelQueCategory[catIndex].category_name.length)
					: this.maxLengthForCatQue;
		}
	}

	checknoOfQuesForCategoryCount() {
		this.isZeroSpinQuesCategory = false;
	}

	checknoOfTimeSpinWheelCount() {
		this.noOfTimeSpinWheelError = false;
	}

	openSpinWheeelQuestionCat() {
		if (this.spinWheelQueCategory && this.spinWheelQueCategory.length < 2) {
			this.addMinTwoSpinCategory = true;
		}

		let noOfTimeSpinWheel = 0;
		if (this.selectedDripType == 2) {
			noOfTimeSpinWheel = this.whatsUpNativeForm.controls['noOfTimeSpin'].value;
		} else if (this.selectedDripType == 3) {
			noOfTimeSpinWheel = this.emailNoneNativeForm.controls['noOfTimeSpin'].value;
		} else if (this.selectedDripType == 4) {
			noOfTimeSpinWheel = this.dripNativeForm.controls['noOfTimeSpin'].value;
		} else if (this.selectedDripType == 6) {
			noOfTimeSpinWheel = this.dripSharingOnTeamsForm.controls['noOfTimeSpin'].value;
		}

		if (noOfTimeSpinWheel + 2 > this.spinWheelQueCategory.length) {
			this.spinCatCountGreaterThanWheelCount = true;
		}
	}

	onEnterSpinQuesScore(index) {
		this.DripQuestions[index].isSpinQueScore = false;
	}

	changeOfflineTaskQuestionType(questionIndex) {
		if (this.DripQuestions[questionIndex].questionType == 'Voice Input') {
			this.DripQuestions[questionIndex].isFileSubmission = true;
		} else {
			this.DripQuestions[questionIndex].isFileSubmission = false;
		}
		console.log('--this.DripQuestions--', this.DripQuestions[questionIndex]);
	}

	getCustomTemplatesByClientId() {
		this.dripService.getCustomTemplatesByClientId(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.allCustomTemplateList = [];
				for (let data of res.data) {
					this.allCustomTemplateList.push(data);
				}
			}
		});
	}

	onSelectCustomTemplate(event: any) {
		this.dripService.getCustomTemplateDetailsByUsingTempId(event.id).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.customTempPlaceholderArray = [];
					this.customTemplate = null;
					this.customTemplate = res.data.template;
					for (let item of res.data.templatePlaceholders) {
						let payload = {
							templatePlaceholdeName: item.templatePlaceholdeName,
							placeholderHeaderName: item.placeholderHeaderName,
							inputBoxPlaceholder: item.inputBoxPlaceholder,
							inputType: item.inputType,
							inputText: null,
							isImage: item.isImage,
							isAnchorTag: item.isAnchorTag,
							isVideo: item.isIframe,
							imageTitle: null,
						};
						this.customTempPlaceholderArray.push(payload);
					}
				}
				console.log('-customTempPlaceholderArray-', this.customTempPlaceholderArray);
			}
		});
	}

	showSelectMediaCustomTemplatePopup(index, mediaType?) {
		this.selectedCustomTemplateMediaType = mediaType;
		this.selectCustomTemplateAssetId = index;
		this.getAllAssetByType(this.selectedClientId, this.selectedCustomTemplateMediaType);
		setTimeout(() => {
			$('#selectMediaModelForCustomTemplate').modal('show');
		}, 300);
	}

	selectAssetForCustomTemplate(asset, type) {
		this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].isRequired = false;
		const srcPath = asset.Asset_details[0].path;
		this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].imageTitle = asset.title;
		if (type == 'Image') {
			this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].inputText = this.assetBasePath + srcPath;
		} else if (type == 'Video') {
			this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].inputText = srcPath;
		}
		$('#selectMediaModelForCustomTemplate').modal('hide');
		console.log('-----customTemp------', this.customTempPlaceholderArray);
	}

	uploadAssetForCustomTemplate(event, type) {
		let selectedMediaAssetDetails = [];
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.spinnerService.show();
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				// fileName = fileName.replace('.png', '').replace('.jpg', '');
				fileName = fileName.replace('.png', '').replace('.jpg', '').replace('.mp4', '');
				if (mediaType.includes('image')) {
					mediaType = 'Image';
				} else if (mediaType.includes('video')) {
					mediaType = 'Video';
				}

				let payload = {
					title: fileName,
					tagName: null,
					description: null,
					type: mediaType,
					otherDetails: media,
					size: media.size,
				};

				selectedMediaAssetDetails.push(payload);
			}

			for (let asset of selectedMediaAssetDetails) {
				if (asset.type == 'Video' && type == 'Video') {
					if (this.appService?.configurable_feature?.vimeo) {
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
							this.spinnerService.hide();
							return;
						}
						this.spinnerService.show();
						this.dripService
							.createVimeo(options, asset.otherDetails.size)
							.pipe(
								map((data) => (asset.data = data)),
								switchMap(() => {
									this.appService.checkNotifcation = true;
									this.dripService.updateVimeoLink(asset.data.link);
									if (asset.data.upload.size === asset.otherDetails.size) {
										return this.dripService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
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

										this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
											if (res.success) {
												const options = {
													token: this.vimeoDetails.vToken,
													url: environment.VimeoPresetApi,
													presetId: this.vimeoDetails.presetId,
													videoId: asset.vmoVideoId,
												};
												this.dripService.applyEmbedPreset(options).subscribe((res: any) => {});

												this.appService.checkNotifcation = true;
												this.spinnerService.hide();
												if (type == 'Video') {
													const srcPath = res.data.Asset_details[0].path;
													this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].imageTitle = res.data.title;
													this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].inputText = srcPath;
													this.toastr.success(
														this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
														this.appService.getTranslation('Utils.success')
													);
													this.cancelMediaPopUp();
												}
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
					} else if (this.appService?.configurable_feature?.mediaCMS) {
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

						this.dripService.canUploadVideoOnMediaCMS().subscribe((res: any) => {
							if (res.success) {
								if (res.canUpload) {
									this.dripService.uploadVideoOnMediaCMS(uploadData, this.selectedClientId).subscribe((res: any) => {
										if (res) {
											asset.cmsVideoId = res.data.videoId;
											asset.size = res.data.size;
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
											this.spinnerService.show();
											this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
												if (res.success) {
													this.appService.checkNotifcation = true;
													this.spinnerService.hide();
													if (type == 'Video') {
														const srcPath = res.data.Asset_details[0].path;
														this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].imageTitle =
															res.data.title;
														this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].inputText = srcPath;
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
															this.appService.getTranslation('Utils.success')
														);
														this.cancelMediaPopUp();
													}
												} else {
													this.spinnerService.hide();
												}
											});
										}
									});
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
					}
				} else {
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							uploadData.append(asset.type, asset[key]);
						} else {
							uploadData.append(key, asset[key]);
						}
					}
					if (asset.type == 'Image') {
						if (asset.size >= 2097152) {
							this.toastr.error(
								this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maximage2MB'),
								this.appService.getTranslation('Utils.error')
							);
							this.spinnerService.hide();
							return;
						}
					}

					this.dripService.createAsset(uploadData, this.selectedClientId).subscribe((res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							if (type == 'Thambnail') {
								const srcPath = res.data.Asset_details[0].path;
								this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].imageTitle =
									res.data.Asset_details[0].name;
								this.customTempPlaceholderArray[this.selectCustomTemplateAssetId].inputText =
									this.assetBasePath + srcPath;
							}
							this.cancelMediaPopUp();
						} else {
							this.spinnerService.hide();
						}
					});
				}
			}
		}
	}

	removeCustomTemplateAsset(i) {
		this.customTempPlaceholderArray[i].inputText = null;
	}

	onChangeCustomTempInput(i) {
		this.customTempPlaceholderArray[i].isRequired = false;
	}

	validatePWAheader(type) {
		this.pwaHeaderCaptionRequired = false;
	}
}
