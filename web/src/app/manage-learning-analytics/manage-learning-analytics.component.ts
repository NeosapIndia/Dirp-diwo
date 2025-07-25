import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { routerTransition } from '../router.animations';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { LearningAnalyticsService } from './learning-analytics.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { environment } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from '../app.service';
import { zip } from 'fflate';

declare var $: any;

@Component({
	selector: 'app-manage-learning-analytics',
	templateUrl: './manage-learning-analytics.component.html',
	styleUrls: ['./manage-learning-analytics.component.scss'],
	animations: [routerTransition()],
})
export class ManageLearningAnalyticsComponent implements OnInit {
	pageResultCount = environment.pageResultsCount;
	@ViewChild('container') container: ElementRef;
	@ViewChild('sub_container') sub_container: ElementRef;
	selectedDate;
	verticalGraphResult: any[] = [];
	lineGraphResult: any[] = [];
	invalidDates: moment.Moment[] = [];
	allSubClientList = [];
	selectedClientId;
	maxLearnerCountForShowResult = 10;
	selectedOfflineTaskDetails;
	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};
	assetBasePath = environment.imageHost + environment.imagePath;
	ranges: any = {
		Today: [moment(), moment()],
		// Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(7, 'days'), moment()],
		'Last Week': [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
		'This Week': [moment().startOf('week'), moment().endOf('week')],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		'Year To Date': [moment().startOf('year')],
	};

	totalQuestionCount = 0;
	totalResponses = 0;
	maxPossibleScore = 0;
	avaregeScore: any = 0;
	topScore = 0;
	gradedCount = 0;
	totalGradedableCount = 0;
	DripAppwithsharingonWhatsApp = [];

	//for Vertical chart
	view: any[] = [1500, 500];
	viewHorizontalBar: any[] = [400, 210];
	viewHorizontalBar2: any[] = [400, 150];
	horizontalView: any[] = [1000, 250];
	showXAxis = true;
	showYAxis = true;
	gradient = false;
	// showLegend = true;
	showXAxisLabel = true;
	showYAxisLabel = true;

	colorScheme = {
		domain: ['#5271FF', '#215968', '#01BFBD', '#FF66C4'],
	};

	//for line chart
	legend: boolean = true;
	showLabels: boolean = true;
	animations: boolean = true;
	xAxis: boolean = true;
	yAxis: boolean = true;
	timeline: boolean = true;

	selectedMonthForDripActivity = 11;
	selectedMonthForDripType = 11;
	seletcedDripActivityType = 'Drip Sent';
	months = 2;
	dripActivityMonths = 11;
	DripSendByTypeMonths = 11;
	selectedReportName: any;

	Reportdata = [
		{ id: 1, name: 'Whatsapp Delivery Report' },
		{ id: 2, name: 'Email Delivery Report' },
		{ id: 3, name: 'Microsoft Teams Delivery Report' },
		{ id: 4, name: 'Whatsapp Opt-in Status Report' },
		{ id: 5, name: 'Incoming Messages Report' },
		{ id: 6, name: 'Channel Wise Activity Reports' },
		{ id: 7, name: 'Custom Reports' },
		{ id: 8, name: 'Ticket Reports' },
		{ id: 9, name: 'Contactwise Report' },
	];

	branchList = [];

	countryList = [];

	jobRoleList = [];

	dripActivityType = [
		{ id: 1, name: 'Drip Scheduled', value: 'Drip Scheduled' },
		{ id: 2, name: 'Drip Sent', value: 'Drip Sent' },
		{ id: 3, name: 'Drip Delivered', value: 'Drip Delivered' },
		{ id: 4, name: 'Drip Engaged', value: 'Drip Engaged' },
	];

	DripFlow = [];

	dripTypes = [];
	dripTypesWithoutTeams = [];
	selectedDripType: any;
	AllCount: any[];
	AllCampaign: any[];
	AllCampaignDrip = [];
	selectedClientName: any;
	userClient: any;
	roleId: any;
	userId: any;
	CampaignData: any;
	dripCount: any;
	TotalDrip_Camps: any = [];
	isDripsExpaded: boolean = true;
	AllDripActivity: any[];
	learnerCount: any;
	selectedDripDetails: any = null;
	selectedDripAllData: any[];
	seeResultData: any = [];
	toppers: any;
	allQuestion: any[];
	hideLineGraph: boolean = false;
	hideVerticalGraph: boolean = false;
	selectedCampaign: any;
	verticalGraphFlag: boolean = true;
	lineGraphFlag: boolean = true;
	isdateRangeSelected: boolean = false;
	questionUploadedAsset = [];
	elemHeight: number;
	isediGraded: boolean = false;
	activeIndex = null;
	allOfflineTaskData = [];
	questionList = [];
	selectedQuestionText = '';
	briefText: any;
	page: number = 1;
	limit: any = 12;
	totalCount: any;
	showDownloadButton: boolean = false;
	offlineTaskSearchText: string = '';
	selectedDripScheduledTab: boolean = true;
	seletedDripSentTab: boolean = true;
	seletedDripDeliveredTab: boolean = true;
	seletedDripEngagedTab: boolean = true;
	selectedDataToShow: any = [];
	engadgedDataInPersentage: any = [];
	totalDripScheduled = 0;
	totalDripSent = 0;
	totalDripDelivered = 0;
	totalDripEngaged = 0;
	selectedFilterType: any;
	selectedFilterDate: { startDate: any; endDate: any };
	filterArrayData: any = [];
	payload: { filterType: any; selectedData: any[]; searchByText: any };
	seletedFilterType: any;
	selectedFilter: any;
	maxDate: any;
	totalAnayticsData: any = [];
	finalSearchData: any = [
		{ filterType: 'Account', selectedData: [], searchByText: '' },
		{ filterType: 'Country', selectedData: [], searchByText: '' },
		{ filterType: 'Job Role', selectedData: [], searchByText: '' },
		{ filterType: 'Tags', selectedData: [], searchByText: '' },
	];
	dripList: any = [];
	campaignList: any = [];
	isApiCall: boolean = false;
	isDataLoaded: boolean = false;
	branchSelectedList: null;
	countrySelectedList: null;
	jobRoleSelectedList: null;
	dripTypesSelectedList: null;
	campaignSelectedList: null;
	dripSelectedList: null;
	allInOneFilterData: any = [];
	dripTypeList = [];
	selectedCustomReportName: any;
	customReportNameList = [];
	type = 'drip';
	successMetrics = [];

	questionUploadOnVimeo = false;
	haveMicrosoftTeamsAccess: boolean = false;

	iconObject = {
		groups: null,
		family_history: null,
		water_drop: null,
		perm_media: null,
		info_icon_anlytics: null,
		node_view: null,
		'No Results': null,
		refresh_icon: null,
		image_thumbnail: null,
		pdf_thumbnail: null,
		video_thumbnail: null,
	};

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private analyticsService: LearningAnalyticsService,
		private router: Router,
		public appService: AppService,
		public sanitizer: DomSanitizer
	) {
		Object.assign(this.verticalGraphResult);
		Object.assign(this.AllCampaignDrip);
		this.dripTypes = [];

		// this.dripTypeList = this.dripTypes;

		this.dripTypes = [
			{
				id: 1,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp'),
			},
			{
				id: 2,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp'),
			},
			{
				id: 7,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail'),
			},
			{
				id: 3,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail'),
			},
			{
				id: 4,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp'),
			},
			{
				id: 5,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyTeams'),
			},
			{
				id: 6,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonTeams'),
			},
		];

		this.dripTypesWithoutTeams = [
			{
				id: 1,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp'),
			},
			{
				id: 2,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp'),
			},
			{
				id: 7,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail'),
			},
			{
				id: 3,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail'),
			},
			{
				id: 4,
				name: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp'),
			},
		];

		// this.Reportdata = [
		// 	{ id: 1, name: 'Whatsapp Delivery Report' },
		// 	{ id: 2, name: 'Email Delivery Report' },
		// 	{ id: 3, name: 'Microsoft Teams Delivery Report' },
		// 	{ id: 4, name: 'Whatsapp Opt-in Status Report' },
		// 	{ id: 5, name: 'Incoming Messages Report' },
		// 	{ id: 6, name: 'Channel Wise Activity Reports' },
		// 	{ id: 7, name: 'Custom Reports' },
		// 	{ id: 8, name: 'Ticket Reports' },
		// 	{ id: 9, name: 'Contactwise Report' },
		// ];

		///////////////////////////////////////////////////////////////////////////////////////////
		//Remove Team and Whats App Type Drip From the Drip Types Array
		if (!this.appService?.configurable_feature?.teams) {
			[6, 5].forEach((index) => this.dripTypeList.splice(index, 1));
			[2].forEach((index) => this.Reportdata.splice(index, 1));
		}
		if (!this.appService?.configurable_feature?.whatsApp) {
			[1, 0].forEach((index) => this.dripTypeList.splice(index, 1));
			[1, 0].forEach((index) => this.dripTypesWithoutTeams.splice(index, 1));

			let array = [4, 3, 0];
			if (!this.appService?.configurable_feature?.teams) {
				array = [3, 2, 0];
			}
			array.forEach((index) => this.Reportdata.splice(index, 1));
		}
		///////////////////////////////////////////////////////////////////////////////////////////
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	ngOnInit() {
		this.type = this.appService.type;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.selectedClientId = this.userClient.id;
		// this.getFilterListData();
		this.getAllCampaignAndAccounts(this.selectedClientId);
		// this.getAllSubClientList();

		this.selectedFilterDate = {
			startDate: moment().subtract(29, 'days'),
			endDate: moment(),
		};
		this.getAllCount(this.selectedClientId);
		this.selectedCustomReport(this.selectedClientId);
		this.checkTeamsAccessToken(this.selectedClientId);
	}

	getFilterListData() {
		this.analyticsService.getFilterListData().subscribe((res: any) => {
			if (res.success) {
				// console.log('------res.data------', res.data);
				this.allInOneFilterData = res.data;
				this.branchList = res.data.BranchList;
				this.countryList = res.data.CountryList;
				this.jobRoleList = res.data.JobRoleList;
				this.dripList = res.data.DripList;
				this.campaignList = res.data.CampaignList;

				// this.AllCampaign = res.data;

				if (this.campaignList.length > 0) {
					this.selectedCampaign = this.campaignList[0].id;
					this.selectedDripFlow(this.campaignList[0]);
				}
			}
		});
	}

	getAllSubClientList() {
		this.analyticsService.getAllSubClientList(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.allSubClientList = [];
				this.allSubClientList = res.data;
				if (this.allSubClientList.length > 0) {
					this.selectedClientId = this.allSubClientList[0].id;
					this.getAllCount(this.selectedClientId);
					this.getAllCampaignAndAccounts(this.selectedClientId);
					this.getAllDripActivityForGraph(this.selectedClientId, 'All Graph');
					this.selectedCustomReport(this.selectedClientId);
				}
			}
		});
	}
	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
		this.isdateRangeSelected = false;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
		this.isdateRangeSelected = false;
	}

	onReportDateChange() {
		this.isdateRangeSelected = false;
	}

	getAllDripActivityForGraph(clientId, type) {
		this.spinnerService.show();
		let month;
		if (type == 'All Graph') {
			month = 11;
			this.hideLineGraph = true;
			this.hideVerticalGraph = true;
		} else if (type == 'Vertical Graph') {
			month = this.dripActivityMonths;
			this.hideVerticalGraph = true;
		} else if (type == 'Line Graph') {
			this.hideLineGraph = true;
			month = this.DripSendByTypeMonths;
		}
		let finalList = [];
		this.analyticsService.getAllDripActivity(clientId, month, this.seletcedDripActivityType).subscribe((res: any) => {
			if (res.success) {
				finalList = [];
				let verticalGraphFlag_ = true;
				let lineGraphFlag_ = true;
				for (let item of res.vertical_graph_data) {
					// if (item.dripScheduled != 0) {
					// 	verticalGraphFlag_ = false;
					// }
					if (item.dripSend != 0) {
						verticalGraphFlag_ = false;
					}
					if (item.dripDelivered != 0) {
						verticalGraphFlag_ = false;
					}
					if (item.dripEngaged != 0) {
						verticalGraphFlag_ = false;
					}

					finalList.push({
						name: item.month,
						series: [
							// {
							// 	name: 'Drip Scheduled',
							// 	value: parseInt(item.dripScheduled),
							// },
							{
								name: 'Drip Sent',
								value: parseInt(item.dripSend),
							},
							{
								name: 'Drip Delivered',
								value: parseInt(item.dripDelivered),
							},
							{
								name: 'Drip Engaged',
								value: parseInt(item.dripEngaged),
							},
						],
					});
				}

				for (let item of res.line_graph_data) {
					for (let type of item.series) {
						if (type.value != 0) {
							lineGraphFlag_ = false;
							break;
						}
					}
				}

				if (type == 'All Graph') {
					this.verticalGraphFlag = verticalGraphFlag_;
					this.lineGraphFlag = lineGraphFlag_;
					this.verticalGraphResult = [];
					this.verticalGraphResult = finalList;
					this.lineGraphResult = [];
					this.lineGraphResult = res.line_graph_data;
				} else if (type == 'Vertical Graph') {
					this.verticalGraphFlag = verticalGraphFlag_;
					this.verticalGraphResult = [];
					this.verticalGraphResult = finalList;
				} else if (type == 'Line Graph') {
					this.lineGraphFlag = lineGraphFlag_;
					this.lineGraphResult = [];
					this.lineGraphResult = res.line_graph_data;
				}
				setTimeout(() => {
					this.hideLineGraph = false;
					this.hideVerticalGraph = false;
					this.view = [this.container.nativeElement.offsetWidth - 40, 500];
				}, 10);
			}
			this.spinnerService.hide();
		});
	}

	getAllCount(clientId) {
		this.spinnerService.show();
		this.analyticsService.getAllCount(clientId).subscribe((res: any) => {
			if (res.success) {
				this.AllCount = [];
				for (let count of res.data) {
					this.AllCount.push(count);
				}
			}
			this.spinnerService.hide();
		});
	}

	getAllCampaignAndAccounts(clientId) {
		this.spinnerService.show();
		this.analyticsService.getAllCampaignAndAccounts(clientId).subscribe((res: any) => {
			if (res.success) {
				this.branchList = res.data.BranchList;
				this.campaignList = res.data.CampaignList;
				if (this.campaignList.length > 0) {
					this.selectedCampaign = this.campaignList[0].id;
					this.selectedDripFlow(this.campaignList[0]);
				}
			}
			this.spinnerService.hide();
		});
	}

	selectedDripFlow($event) {
		this.spinnerService.show();
		this.AllCampaignDrip = [];
		this.CampaignData = null;
		let payload = {
			campaignId: [$event.id],
		};
		this.analyticsService.getAllCampaignDripTitle(payload).subscribe((res: any) => {
			if (res.success) {
				this.spinnerService.hide();
				this.learnerCount = res.data.totalLearnerCount;
				// this.dripCount = res.data.length;
				// this.TotalDrip_Camps = res.data;
				// for (let item of res.data) {
				// 	if (this.AllCampaignDrip.length < 4) {
				// 		this.AllCampaignDrip.push(item);
				// 	}
				// }

				// setTimeout(() => {
				// 	this.viewHorizontalBar2 = [this.sub_container.nativeElement.offsetWidth - 100, 150];
				// }, 200);
				this.CampaignData = res.data.campaignDetails[0];
				if (res.data.lernerGroupNames.length > 0) {
					this.CampaignData.leranerGroupName = res.data.lernerGroupNames.join(', ');
				}
				this.successMetrics = [];
				this.successMetrics = res.data.successMetrics;
				if (this.successMetrics && this.successMetrics.length > 0) {
					for (let item of this.successMetrics) {
						if (item.metrics.includes('Rate')) {
							if (
								item.value != null &&
								item.value != 'NaN' &&
								Number.isNaN(item.value) == false &&
								item.value != 'null' &&
								item.value != undefined
							) {
								item.value = parseFloat(item.value).toFixed(2) + ' %';
							} else {
								item.value = '0 %';
							}
						} else if (item.metrics.includes('Average')) {
							if (
								item.value != null &&
								item.value != 'NaN' &&
								Number.isNaN(item.value) == false &&
								item.value != 'null' &&
								item.value != undefined
							) {
								item.value = parseFloat(item.value).toFixed(2);
							} else {
								item.value = '0';
							}
						}
					}
				}
				let totalData = {
					node_name: 'Total',
					node_status: ' ',
					node_send_date: ' ',
					scheduled: 0,
					sent: 0,
					delivered: 0,
					read_on_every_day_channel: 0,
					read_rate_on_every_day_channel: 0,
					read_on_drip_app: 0,
					read_rate_on_drip_app: 0,
					action_intent_displayed: 0,
					action_taken: 0,
					rate_action_taken: 0,
					average_action_score: 0,
					total_action_score: 0,
					isTotal: true,
				};

				for (let data of res.data.campaignDripData) {
					let payload = data;
					payload.isTotal = false;

					for (let key in totalData) {
						if (
							data[key] &&
							[
								'total_action_score',
								'node_name',
								'node_status',
								'node_send_date',
								'isTotal',
								'read_rate_on_every_day_channel',
								'read_rate_on_drip_app',
								'rate_action_taken',
								'average_action_score',
							].indexOf(key) === -1
						) {
							totalData[key] = parseInt(data[key]) + parseInt(totalData[key]);
						}

						//All Decimal Check
						if (
							['read_rate_on_every_day_channel', 'read_rate_on_drip_app', 'rate_action_taken'].indexOf(key) > -1 &&
							data[key]
						) {
							payload[key] = parseInt(data[key]).toFixed(0);
						}

						if (key === 'total_action_score' && data.average_action_score > 0) {
							totalData.total_action_score = totalData.total_action_score + parseInt(data.average_action_score);
						}

						if (['average_action_score'].indexOf(key) > -1 && data[key]) {
							payload[key] = parseFloat(data[key]).toFixed(0);
							totalData.average_action_score = totalData.average_action_score + parseFloat(data[key]);
						}

						if (key === 'node_send_date') {
							if (data[key]) {
								payload[key] = moment(data[key]).format('YYYY-MM-DD HH:mm:ss');
							} else {
								payload[key] = ' ';
							}
						}
					}

					this.AllCampaignDrip.push(payload);
				}

				// console.log('---totalData---', totalData);
				//Add empty object in the end of the array
				//Calculate average_action_score
				if (totalData.total_action_score > 0) {
					totalData.average_action_score = parseFloat(
						(totalData.total_action_score / res.data.campaignDripData.length).toFixed(0)
					);
				}

				//Calculate read_rate_on_every_day_channel
				if (totalData.read_on_every_day_channel > 0 && totalData.delivered > 0) {
					totalData.read_rate_on_every_day_channel = parseInt(
						Math.floor((totalData.read_on_every_day_channel / totalData.delivered) * 100).toFixed(0)
					);
				}

				//Calculate rate_action_taken
				if (totalData.action_taken > 0 && totalData.delivered > 0) {
					totalData.rate_action_taken = parseInt(
						Math.floor((totalData.action_taken / totalData.delivered) * 100).toFixed(0)
					);
				}

				//Calculate read_rate_on_drip_app
				if (totalData.read_on_drip_app > 0 && totalData.delivered > 0) {
					totalData.read_rate_on_drip_app = parseInt(
						Math.floor((totalData.read_on_drip_app / totalData.delivered) * 100).toFixed(0)
					);
				}

				// if (totalData.average_action_score > -1) {
				// 	totalData.average_action_score = parseFloat(
				// 		Math.floor(totalData.average_action_score / res.data.campaignDripData.length).toFixed(0)
				// 	);
				// }

				this.AllCampaignDrip.push(totalData);

				if (this.CampaignData.campaign_start_date) {
					this.CampaignData.campaign_start_date = moment(this.CampaignData.campaign_start_date)
						.local()
						.format('YYYY-MM-DD HH:mm:ss');
				}
				if (this.CampaignData.campaign_end_date) {
					this.CampaignData.campaign_end_date = moment(this.CampaignData.campaign_end_date)
						.local()
						.format('YYYY-MM-DD HH:mm:ss');
				}
			}
			this.isDataLoaded = true;
			this.spinnerService.hide();
		});
	}

	// openExpandadDrips() {
	// 	this.isDripsExpaded = false;
	// 	this.AllCampaignDrip = [];
	// 	setTimeout(() => {
	// 		for (let item of this.TotalDrip_Camps) {
	// 			this.AllCampaignDrip.push(item);
	// 		}
	// 	}, 10);
	// }

	// closeExpandadDrips() {
	// 	this.isDripsExpaded = true;
	// 	this.AllCampaignDrip = [];
	// 	setTimeout(() => {
	// 		for (let item of this.TotalDrip_Camps) {
	// 			if (this.AllCampaignDrip.length < 4) {
	// 				this.AllCampaignDrip.push(item);
	// 			}
	// 		}
	// 	}, 10);
	// }

	// selectClient($event) {
	// 	console.log('---selectedClient------', this.selectedClientId);
	// 	// setTimeout(()=>{
	// 	this.dripActivityMonths = 2;
	// 	this.DripSendByTypeMonths = 2;
	// 	this.getAllCount(this.selectedClientId);
	// 	this.getAllCampaign(this.selectedClientId);
	// 	this.getAllDripActivityForGraph(this.selectedClientId, 'All Graph');
	// 	// },200)
	// }

	selectedReport($event) {}
	cancelshowResultPopUp() {
		$('#showResultModel').modal('hide');
	}

	ShowPopup(data) {
		this.selectedDripDetails = data.otherDetails;
		this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				setTimeout(() => {
					this.setQuestion(false);
				}, 200);
			}
		});
	}

	cancelshowResultPopUpForQuiz() {
		$('#showResultForQuizModel').modal('hide');
	}
	ShowPopupForQuiz(data) {
		// console.log('---item---', data);
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};
		this.selectedDripDetails = payload;
		// console.log('---selectedDripDetails---', this.selectedDripDetails);
		this.analyticsService.getAllQuizDataForReport(this.selectedDripDetails).subscribe(async (res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				// $("#showResultForQuizModel").modal('show');
				// setTimeout(() => {
				// 	this.showResultPopUp(false);
				// 	setTimeout(() => {
				// 		$('#showResultForQuizModel').modal('show');
				// 	}, 200);
				// }, 200);
				let headers = [];
				if (res.data.length > 0) {
					headers = Object.keys(res.data[0]);
				}
				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: true,
					showTitle: false,
					title: `${data.template_type} Drip Report`,
					useBom: false,
					noDownload: false,
					headers: headers,
				};
				this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
				const fileInfo = new ngxCsv(this.selectedDripAllData, `${data.template_type} Drip Report`, option);
			}
		});
	}

	downloadSpinTheWheelReport(data) {
		// console.log('---item---', data);
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};
		this.selectedDripDetails = payload;
		// console.log('---selectedDripDetails---', this.selectedDripDetails);
		this.analyticsService.getAllSpinTheWheelDataForReport(this.selectedDripDetails).subscribe(async (res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;

				let headers = [];
				if (res.data.length > 0) {
					headers = Object.keys(res.data[0]);
				}
				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: true,
					showTitle: false,
					title: `${data.template_type} Drip Report`,
					useBom: false,
					noDownload: false,
					headers: headers,
				};
				this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
				const fileInfo = new ngxCsv(this.selectedDripAllData, `${data.template_type} Drip Report`, option);
			}
		});
	}

	downloadCustomTemplateReport(data) {
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};

		this.selectedDripDetails = payload;
		// console.log('---selectedDripDetails---', this.selectedDripDetails);
		this.analyticsService.getAllCustomTemplateDataForReport(this.selectedDripDetails).subscribe(async (res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;

				let headers = [];
				if (res.data.length > 0) {
					headers = Object.keys(res.data[0]);
				}
				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: true,
					showTitle: false,
					title: `${data.template_type} Drip Report`,
					useBom: false,
					noDownload: false,
					headers: headers,
				};
				this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
				const fileInfo = new ngxCsv(this.selectedDripAllData, `${data.template_type} Drip Report`, option);
			}
		});
	}

	getOfflineTask() {
		this.analyticsService
			.getOfflineTaskAllDataFor(
				{
					details: this.selectedOfflineTaskDetails,
					selectedQuestion: this.selectedQuestionText,
					searchKey: this.offlineTaskSearchText,
				},
				this.limit,
				this.page
			)
			.subscribe((res: any) => {
				if (res.success) {
					this.allOfflineTaskData = [];
					this.allOfflineTaskData = res.questionData;
					this.questionUploadOnVimeo = res.uploadedOnVimeo;
					// if (this.allOfflineTaskData && this.allOfflineTaskData.length > 0) {
					let count = 1;
					if (this.questionList.length == 0) {
						for (let question of res.allQuestions) {
							let payload = {
								title: `Question ${count}: ${question.question} ${
									question.allowFileTypes ? '(' + question.allowFileTypes + ')' : ''
								}`,
								question: question.question,
								fileType: question.allowFileTypes,
							};
							this.questionList.push(payload);
							count++;
						}
					}
					if (this.selectedQuestionText == '' || this.selectedQuestionText == null) {
						this.selectedQuestionText = this.questionList[0].question;
						if (['Image', 'PDF'].indexOf(this.questionList[0].allowFileTypes) > -1) {
							this.showDownloadButton = true;
						} else {
							this.showDownloadButton = false;
						}
					}
					this.questionUploadedAsset = this.allOfflineTaskData;
					this.gradedCount = res.gradeCount;
					this.totalGradedableCount = res.totalGradedableCount;
					this.totalCount = res.totalQuestionDataCount;
					this.activeIndex = 0;
					this.briefText = res.brief;
					// } else {
					// 	this.questionList = [];
					// }
				}
				this.spinnerService.hide();
			});
	}

	ShowPopupForViewuplaods(item, showPopup) {
		this.spinnerService.show();
		this.selectedOfflineTaskDetails = item.otherDetails;
		if (showPopup) {
			this.page = 1;
			this.offlineTaskSearchText = '';
			this.questionUploadedAsset = [];
			this.gradedCount = 0;
			this.totalGradedableCount = 0;
			this.totalCount = 0;
			this.activeIndex = 0;
			this.briefText = '';
			this.selectedQuestionText = '';
			this.questionList = [];
		}
		this.getOfflineTask();
		if (showPopup) {
			$('#viewuploadsmodel').modal('show');
		}
	}

	async showResultPopUp(download) {
		if (this.selectedDripAllData.length > 0) {
			this.totalQuestionCount = this.selectedDripAllData[0].DripUserQuestions.length;
			this.totalResponses = 0;

			this.maxPossibleScore = this.totalQuestionCount * 2;
			this.avaregeScore = 0;
			this.topScore = 0;
			let forAvrageScore = [];
			this.seeResultData = [];

			for (let userDrip of this.selectedDripAllData) {
				let data = { fullName: '', accountId: '', total: 0, questions: [], PostId: null, CampaignId: null };
				data.fullName = userDrip && userDrip.User && userDrip.User.fullName ? userDrip.User.fullName : '';
				data.total = 0;
				data.accountId = userDrip && userDrip.User && userDrip.User.account_id ? userDrip.User.account_id : '';
				data.PostId = userDrip.PostId;
				data.CampaignId = userDrip.CampaignId;
				let question = [];
				let response = false;

				question = userDrip.DripUserQuestions.sort((a, b) => {
					if (a.id < b.id) {
						return -1;
					}
				});

				for (let que of question) {
					if (que.questionType == 'MCQ') {
						let currectAnswer = [];
						let userAnswer = [];
						let count = 1;
						let options = [];

						options = que.DripUserOptions.sort((a, b) => {
							if (a.id < b.id) {
								return -1;
							}
						});

						for (let option of options) {
							if (option.correctAns) {
								currectAnswer.push(count);
							}
							if (option.selectedAns) {
								response = true;
								userAnswer.push(count);
							}
							count++;
						}
						let correctAns = false;
						let wrongAns = false;

						if (currectAnswer.length >= userAnswer.length) {
							for (let currect of currectAnswer) {
								if (userAnswer.indexOf(currect) > -1) {
									correctAns = true;
								} else {
									wrongAns = true;
								}
							}
						} else if (currectAnswer.length > userAnswer.length) {
							for (let userAns of userAnswer) {
								if (currectAnswer.indexOf(userAns) > -1) {
									correctAns = true;
								} else {
									wrongAns = true;
								}
							}
						}

						let mark = 0;
						if (correctAns && wrongAns && userDrip.submit) {
							mark = 1;
							data.total = data.total + 1;
						} else if (correctAns && !wrongAns && userDrip.submit) {
							mark = 2;
							data.total = data.total + 2;
						}
						if (userDrip.submit) {
							forAvrageScore.push(mark);
							data.questions.push({ question: que.question, mark: mark, userAnswer: userAnswer });
						} else {
							data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
						}
					} else if (que.questionType == 'Drag and Drop') {
						let isCorrectAnswer = true;
						if (que.DripUserOptions && que.DripUserOptions[0].userSeq) {
							response = true;
							for (let option of que.DripUserOptions) {
								if (option.sr_no != option.userSeq) {
									isCorrectAnswer = false;
								}
							}

							let userAnswer = [];

							let userSequency = que.DripUserOptions.sort((a, b) => {
								if (a.userSeq < b.userSeq) {
									return -1;
								}
							});

							for (let i = 0; i < userSequency.length; i++) {
								userAnswer.push(userSequency[i].sr_no);
							}
							if (isCorrectAnswer) {
								if (userDrip.submit) {
									forAvrageScore.push(2);
									data.questions.push({ question: que.question, mark: 2, userAnswer: userAnswer });
									data.total = data.total + 2;
								} else {
									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
								}
							} else {
								if (userDrip.submit) {
									forAvrageScore.push(0);
									data.questions.push({ question: que.question, mark: 0, userAnswer: userAnswer });
								} else {
									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
								}
							}
						} else {
							if (userDrip.submit) {
								forAvrageScore.push(0);
								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
							} else {
								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
							}
						}
					}
				}

				if (response) {
					this.totalResponses++;
				}
				this.seeResultData.push(data);
			}

			this.seeResultData = this.seeResultData.sort((a, b) => {
				if (a.total > b.total) {
					return -1;
				}
			});
			let total = 0;
			for (let mark of forAvrageScore) {
				total = total + mark;
			}
			this.avaregeScore = (total / this.selectedDripAllData.length).toFixed(2);
			this.topScore = this.seeResultData[0].total;
		}
		let rank = 0;
		let accountId = [];
		for (let i = 0; i < this.seeResultData.length; i++) {
			if (i == 0) {
				rank++;
				this.seeResultData[i].rank = rank;
			} else if (this.seeResultData[i - 1].total != this.seeResultData[i].total) {
				rank++;
				this.seeResultData[i].rank = rank;
			} else {
				this.seeResultData[i].rank = rank;
			}
			if (i < this.maxLearnerCountForShowResult) accountId.push(this.seeResultData[i].accountId);
		}
		this.toppers = [];
		this.toppers = this.seeResultData;

		if (download) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			let finalData = [];
			let headers = [];
			if (this.seeResultData && this.seeResultData.length > 0) {
				let srNo = 1;
				for (let item of this.seeResultData) {
					let payload = {
						'SR NO': srNo,
						'CONTACT ID': item.accountId,
						'DRIP ID': item.PostId,
						'DRIP FLOW ID': item.CampaignId,
						// 'FULL NAME': item.fullName,
					};
					let count = 1;
					for (let question of item.questions) {
						payload[`QUESTION ${count} - ${question.question}`.replaceAll(',', ' ')] = question.userAnswer.toString();
						payload[`Q ${count} SCORE`] = question.mark;
						count++;
					}
					payload['MAXIMUM POSSIBLE SCORE'] = item.questions.length * 2;
					payload['TOTAL SCORE'] = item.total;
					finalData.push(payload);
					srNo++;
				}
			}

			for (let key in finalData[0]) {
				headers.push(key);
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: true,
				showTitle: false,
				title: 'Quiz (Randomised) Drip Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Quiz (Randomised) Drip Report', option);
		} else if (this.toppers.length > this.maxLearnerCountForShowResult) {
			this.toppers.splice(this.maxLearnerCountForShowResult, this.toppers.length - this.maxLearnerCountForShowResult);
		}
		if (accountId.length > 0 && this.toppers.length > 0 && this.toppers.length === accountId.length) {
			this.analyticsService.getTopperUserData({ userIds: accountId }).subscribe((res: any) => {
				if (res.success) {
					let data = res.data;
					for (let value of this.toppers) {
						for (let user of data) {
							if (user.account_id === value.accountId) {
								value.fullName = user.fullName;
								break;
							}
						}
					}
					this.spinnerService.hide();
				}
			});
		}
	}

	async showResultQuizRandomPopUp(download) {
		if (this.selectedDripAllData.length > 0) {
			this.totalQuestionCount = this.selectedDripAllData[0].DripUserQuestions.length;
			this.totalResponses = 0;

			this.maxPossibleScore = this.totalQuestionCount * 2;
			this.avaregeScore = 0;
			this.topScore = 0;
			let forAvrageScore = [];
			this.seeResultData = [];

			for (let userDrip of this.selectedDripAllData) {
				if (userDrip && userDrip.submit) {
					let data = { fullName: '', accountId: '', total: 0, questions: [], PostId: null, CampaignId: null };
					data.fullName = userDrip && userDrip.User && userDrip.User.fullName ? userDrip.User.fullName : '';
					data.total = 0;
					data.accountId = userDrip && userDrip.User && userDrip.User.account_id ? userDrip.User.account_id : '';
					data.PostId = userDrip.PostId;
					data.CampaignId = userDrip.CampaignId;
					let question = [];
					let response = false;

					question = userDrip.DripUserQuestions.sort((a, b) => {
						if (a.id < b.id) {
							return -1;
						}
					});

					for (let que of question) {
						if (que.questionType == 'MCQ') {
							let currectAnswer = [];
							let userAnswer = [];
							let count = 1;
							let options = [];

							options = que.DripUserOptions.sort((a, b) => {
								if (a.id < b.id) {
									return -1;
								}
							});

							for (let option of options) {
								if (option.correctAns) {
									currectAnswer.push(option.sr_no);
								}
								if (option.selectedAns) {
									response = true;
									userAnswer.push(option.sr_no);
								}
								count++;
							}
							let correctAns = false;
							let wrongAns = false;

							if (currectAnswer.length >= userAnswer.length) {
								for (let currect of currectAnswer) {
									if (userAnswer.indexOf(currect) > -1) {
										correctAns = true;
									} else {
										wrongAns = true;
									}
								}
							} else if (currectAnswer.length > userAnswer.length) {
								for (let userAns of userAnswer) {
									if (currectAnswer.indexOf(userAns) > -1) {
										correctAns = true;
									} else {
										wrongAns = true;
									}
								}
							}

							let mark = 0;
							if (correctAns && wrongAns && userDrip.submit) {
								mark = 1;
								data.total = data.total + 1;
							} else if (correctAns && !wrongAns && userDrip.submit) {
								mark = 2;
								data.total = data.total + 2;
							}
							if (userDrip.submit) {
								forAvrageScore.push(mark);
								data.questions.push({ question: que.question, mark: mark, userAnswer: userAnswer });
							} else {
								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
							}
						} else if (que.questionType == 'Drag and Drop') {
							let isCorrectAnswer = true;
							if (que.DripUserOptions && que.DripUserOptions[0].userSeq) {
								response = true;
								for (let option of que.DripUserOptions) {
									if (option.sr_no != option.userSeq) {
										isCorrectAnswer = false;
									}
								}

								let userAnswer = [];

								let userSequency = que.DripUserOptions.sort((a, b) => {
									if (a.userSeq < b.userSeq) {
										return -1;
									}
								});

								for (let i = 0; i < userSequency.length; i++) {
									userAnswer.push(userSequency[i].sr_no);
								}
								if (isCorrectAnswer) {
									if (userDrip.submit) {
										forAvrageScore.push(2);
										data.questions.push({ question: que.question, mark: 2, userAnswer: userAnswer });
										data.total = data.total + 2;
									} else {
										data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
									}
								} else {
									if (userDrip.submit) {
										forAvrageScore.push(0);
										data.questions.push({ question: que.question, mark: 0, userAnswer: userAnswer });
									} else {
										data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
									}
								}
							} else {
								if (userDrip.submit) {
									forAvrageScore.push(0);
									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
								} else {
									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
								}
							}
						}
					}

					if (response) {
						this.totalResponses++;
					}

					//////////////////////////
					this.seeResultData.push(data);
				}
			}

			this.seeResultData = this.seeResultData.sort((a, b) => {
				if (a.total > b.total) {
					return -1;
				}
			});
			let total = 0;
			for (let mark of forAvrageScore) {
				total = total + mark;
			}
			this.avaregeScore = (total / this.selectedDripAllData.length).toFixed(2);
			this.topScore = this.seeResultData[0].total;
		}
		let rank = 0;
		for (let i = 0; i < this.seeResultData.length; i++) {
			if (i == 0) {
				rank++;
				this.seeResultData[i].rank = rank;
			} else if (this.seeResultData[i - 1].total != this.seeResultData[i].total) {
				rank++;
				this.seeResultData[i].rank = rank;
			} else {
				this.seeResultData[i].rank = rank;
			}
		}
		this.toppers = [];
		this.toppers = this.seeResultData;

		if (download) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			let finalData = [];
			let headers = [];
			if (this.seeResultData && this.seeResultData.length > 0) {
				let srNo = 1;
				for (let item of this.seeResultData) {
					let payload = {
						'SR NO': srNo,
						'CONTACT ID': item.accountId,
						'DRIP ID': item.PostId,
						'DRIP FLOW ID': item.CampaignId,
						// 'FULL NAME': item.fullName,
					};
					let count = 1;
					for (let question of item.questions) {
						payload[`Q ${count}`] = question.question.replaceAll(',', ' ');
						payload[`Q ${count} SELECTED ANSWER`] = question.userAnswer.toString();
						payload[`Q ${count} SCORE`] = question.mark;
						count++;
					}
					payload['MAXIMUM POSSIBLE SCORE'] = item.questions.length * 2;
					payload['TOTAL SCORE'] = item.total;
					finalData.push(payload);
					srNo++;
				}
			}

			for (let key in finalData[0]) {
				headers.push(key);
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: true,
				showTitle: false,
				title: 'Quiz (Randomised) Drip Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Quiz (Randomised) Drip Report', option);
		}
		if (this.toppers.length > this.maxLearnerCountForShowResult) {
			this.toppers.splice(this.maxLearnerCountForShowResult, this.toppers.length - this.maxLearnerCountForShowResult);
		}
	}

	async setQuestion(download) {
		this.allQuestion = [];
		for (let question of this.selectedDripAllData[0].DripUserQuestions) {
			let options = [];
			for (let option of question.DripUserOptions) {
				options.push({ name: option.text, value: 0 });
			}
			this.allQuestion.push({ question: question.question, type: question.questionType, options: options });
		}

		for (let data of this.selectedDripAllData) {
			for (let question of data.DripUserQuestions) {
				for (let option of question.DripUserOptions) {
					if (option.selectedAns) {
						for (let qua of this.allQuestion) {
							if (qua.question == question.question) {
								for (let opt of qua.options) {
									if (opt.name == option.text && data.submit) {
										opt.value++;
									}
								}
							}
						}
					}
				}
			}
		}
		if (download) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			let finalData = [];
			let count = 1;
			for (let data of this.selectedDripAllData) {
				let payload = {
					'SR NO': count,
					'CONTACT ID': data.User.account_id,
					'DRIP ID': data.PostId,
					'DRIP FLOW ID': data.CampaignId,
				};
				payload[`Question 1 - ${data.DripUserQuestions[0].question}`.replaceAll(',', ' ')] = '';
				if (data.submit) {
					for (let option of data.DripUserQuestions[0].DripUserOptions) {
						if (option.selectedAns) {
							payload[`Question 1 - ${data.DripUserQuestions[0].question}`.replaceAll(',', ' ')] = data.submit
								? option.text
								: '';
						}
					}
				}
				finalData.push(payload);
			}
			let keyList = [];
			for (let key in finalData[0]) {
				keyList.push(key);
			}
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Poll Drip Report',
				useBom: false,
				noDownload: false,
				headers: [keyList],
			};
			finalData = await this.appService.sanitizedData(finalData);
			const fileInfo = new ngxCsv(finalData, 'Poll Drip Report', option);
		} else {
			$('#showResultModel').modal('show');
		}
	}

	refreshShowResult() {
		this.spinnerService.show();
		if (this.selectedDripDetails.type == 'Poll') {
			this.analyticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					this.allQuestion = [];
					this.allQuestion.push({ question: res.question });
					this.spinnerService.hide();
					// setTimeout(() => {
					// 	$('#showResultModel').modal('show');
					// }, 200);
				}
			});
		} else {
			this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.setQuestion(false);
					}, 200);
					this.spinnerService.hide();
				}
			});
		}
	}

	refreshSeeResult() {
		this.spinnerService.show();
		this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				setTimeout(() => {
					this.showResultPopUp(false);
					setTimeout(() => {
						$('#showResultForQuizModel').modal('show');
					}, 200);
				}, 200);
				this.spinnerService.hide();
			}
		});
	}

	onSelect(data): void {
		// console.log('Item clicked', JSON.parse(JSON.stringify(data)));
	}

	onActivate(data): void {
		// console.log('Activate', JSON.parse(JSON.stringify(data)));
	}

	onDeactivate(data): void {
		// console.log('Deactivate', JSON.parse(JSON.stringify(data)));
	}

	downloadQuizDripReport(data) {
		// console.log('---item---', data);
		this.selectedDripDetails = data.otherDetails;
		// this.toastr.success(
		// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
		// 	this.appService.getTranslation('Utils.success')
		// );
		this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				// $("#showResultForQuizModel").modal('show');
				setTimeout(() => {
					this.showResultPopUp(true);
				}, 200);
			}
		});
	}

	downloadQuizRandamDripReport(data) {
		// console.log('---item---', data);
		this.selectedDripDetails = data.otherDetails;
		// this.toastr.success(
		// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
		// 	this.appService.getTranslation('Utils.success')
		// );
		this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				// $("#showResultForQuizModel").modal('show');
				setTimeout(() => {
					this.showResultQuizRandomPopUp(true);
				}, 200);
			}
		});
	}
	seeResult(data) {}

	async createSurveyReport() {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let header = [];
			for (let key in this.selectedDripAllData[0]) {
				header.push(key);
			}
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Surey Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Surey Report', option);
		}
	}

	downloadSurveyUploadedFiles() {
		//Nedd To Checg the Code
		let finalData = [];
		for (let learnerData of this.selectedDripAllData) {
			if (learnerData.submit) {
				let questionCount = 0;
				for (let question of learnerData.DripUserQuestions) {
					questionCount++;
					if (question.questionType === 'File upload') {
						if (question && question.UserBriefFiles && question.UserBriefFiles.length > 0) {
							let count = 0;
							for (let file of question.UserBriefFiles) {
								let payload = {};
								count++;
								let fileType = file.path.split('.');
								payload['path'] = file.path;
								payload['fileName'] = `${learnerData.User.fullName}_Qno_${questionCount}_${count}.${
									fileType[fileType.length - 1]
								}`;
								finalData.push(payload);
							}
						}
					}
				}
			}
		}

		if (finalData.length > 0) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService
				.downloadLearnerUploadedFileInZipFormat(finalData, this.selectedDripDetails.campaign_id)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);

						link.download = 'Survey_uploaded_files.zip';
						link.click();
						// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
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

	downloadPollDripReport(data) {
		this.selectedDripDetails = data.otherDetails;

		this.analyticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
			if (res.success) {
				this.selectedDripAllData = [];
				this.selectedDripAllData = res.data;
				// $("#showResultForQuizModel").modal('show');
				setTimeout(() => {
					this.setQuestion(true);
				}, 200);
			}
		});
	}

	capitalizeFirstLetter = (str) => {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

	//Download Report
	downloadReport() {
		let payload = {
			startDate: this.selectedDate.startDate,
			endDate: this.selectedDate.endDate,
			clientId: this.selectedClientId,
			selectedCustomReportName: null,
		};
		if (
			(this.selectedDate.startDate == null ||
				this.selectedDate.endDate == null ||
				this.selectedDate.startDate == undefined ||
				this.selectedDate.endDate == undefined) &&
			this.selectedReportName != 4
		) {
			this.isdateRangeSelected = true;
			return;
		}
		if (this.selectedReportName == 6) {
			if (!this.selectedDripType) {
				//Need to Add Toster Message
				return;
			}
		}
		if (this.selectedReportName == 1) {
			//For WhatsAPP Delivery Report

			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getWhatsAppReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					let headers = [
						'SR NO',
						'CONTACT ID',
						'TAGS',
						'JOB ROLE',
						'DRIP ID',
						'DRIP FLOW ID',
						'FLOW CREATED BY',
						'BRANCH ID',
						'WHATSAPP TEMPLATE ID',
						'CATEGORY',
						'PRICING CATEGORY',
						'MESSAGE ID',
						'SYSTEM TRIGGER TIME',
						'MESSAGE TYPE',
						'STATUS',
						'CAUSE (ERROR DESCRIPTION)',
						'NOTIFICATION SENT DATE & TIME',
						'NOTIFICATION DELIVERED DATE & TIME',
						'NOTIFICATION READ DATE & TIME',
						'NOTIFICATION FAILED DATE & TIME',
						'CLICKED EXTERNAL LINK',
						'LINK CLICK DATE & TIME',
						'ERROR DESCRIPTION',
					];
					if (res.enableRetry) {
						headers.push('RETRY ATTEMPTED');
					}
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							let templateId;
							let category;
							let trackablelink;
							let trackablelink2;
							count++;
							if (item.Post && item.Post.Drip_whatsapp_natives && item.Post.Drip_whatsapp_natives.length > 0) {
								templateId = item.Post.Drip_whatsapp_natives[0].templateId;
								category = item.Post.Drip_whatsapp_natives[0].tempCategory;
								trackablelink = item.Post.Drip_whatsapp_natives[0].trackableLink;
								trackablelink2 = item.Post.Drip_whatsapp_natives[0].trackableLink2;
							} else if (
								item.Post &&
								item.Post.Drip_whatsapp_non_natives &&
								item.Post.Drip_whatsapp_non_natives.length > 0
							) {
								templateId = item.Post.Drip_whatsapp_non_natives[0].templateId;
								category = item.Post.Drip_whatsapp_non_natives[0].tempCategory;
							}

							let payload = {
								'SR NO': count,
								'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
								TAGS: item.User && item.User.tags ? item.User.tags : '',
								'JOB ROLE':
									item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
										? item.User.Client_job_roles[0].job_role_name
										: '',
								'DRIP ID': item.PostId,
								'DRIP FLOW ID': item.CampaignId,
								'FLOW CREATED BY':
									item.Campaign && item.Campaign.Client && item.Campaign.Client.name ? item.Campaign.Client.name : '-',
								'BRANCH ID':
									item.User && item.User.Clients && item.User.Clients.length > 0 ? item.User.Clients[0].client_id : '',
								'WHATSAPP TEMPLATE ID': templateId ? templateId : '',
								CATEGORY: category ? category : '',
								'PRICING CATEGORY': category ? category : '',
								'MESSAGE ID': item.WAppTriggerId ? item.WAppTriggerId : '',
								'SYSTEM TRIGGER TIME': item.WTriggerTime
									? ' ' + moment(item.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'MESSAGE TYPE': 'Template',
								STATUS: item.status ? item.status : '',
								'CAUSE (ERROR DESCRIPTION)': item.cause ? item.cause : '',
								'NOTIFICATION SENT DATE & TIME': item.sentDate
									? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',

								'NOTIFICATION DELIVERED DATE & TIME': item.deliveryDate
									? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'NOTIFICATION READ DATE & TIME': item.readDate
									? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'NOTIFICATION FAILED DATE & TIME': item.failDate
									? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'CLICKED EXTERNAL LINK': !trackablelink && !trackablelink2 ? '' : item.clickExternalLink ? 'YES' : 'NO',
								'LINK CLICK DATE & TIME': item.clickExternalLinkDate
									? ' ' + moment(item.clickExternalLinkDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'ERROR DESCRIPTION': item.errorMessage ? item.errorMessage : '',
							};
							if (res.enableRetry) {
								payload['RETRY ATTEMPTED'] = item.retryCount ? item.retryCount : 0;
							}
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'WhatsApp Delivery Report',
						useBom: false,
						noDownload: false,
						headers: headers,
					};
					this.appService.checkNotifcation = true;
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Whats App Delivery Report', option);
				}
			});
		} else if (this.selectedReportName == 2) {
			//For Email Delivery Report
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getEmailReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							count++;
							let subject;
							if (item.Post && item.Post.Drip_only_email && item.Post.Drip_only_email.length > 0) {
								subject = item.Post.Drip_only_email[0].email_subject_line;
							} else if (item.Post && item.Post.Drip_email_non_natives && item.Post.Drip_email_non_natives.length > 0) {
								subject = item.Post.Drip_email_non_natives[0].email_subject_line;
							}

							let payload = {
								'SR NO': count,
								'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'DRIP ID': item.PostId,
								'DRIP FLOW ID': item.CampaignId,
								SUBJECT: subject ? subject : '',
								'TEMPLATE ID': item.templateId ? item.templateId : '',
								'TEMPLATE NAME': item.templateName ? item.templateName : '',
								'MESSAGE ID': item.mailMessageId ? item.mailMessageId : '',
								STATUS: item.status ? item.status : '',
								'EMAIL SENT DATE & TIME': item.sentDate
									? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'EMAIL DELIVERED DATE & TIME': item.deliveryDate
									? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',

								'EMAIL READ DATE & TIME': item.readDate
									? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'EMAIL CLICKED DATE & TIME': item.clickDate
									? ' ' + moment(item.clickDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'EMAIL FAILED DATE & TIME': item.failDate
									? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'ERROR DESCRIPTION': item.errorMessage ? item.errorMessage : '',
							};
							if (item.status == 'Click') {
								payload.STATUS = 'Clicked';
							} else if (item.status == 'Open') {
								payload.STATUS = 'Read';
							}
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Email Delivery Report',
						useBom: false,
						noDownload: false,
						headers: [
							'SR NO',
							'CONTACT ID',
							'DRIP ID',
							'DRIP FLOW ID',
							'SUBJECT',
							'TEMPLATE ID',
							'TEMPLATE NAME',
							'MESSAGE ID',
							'STATUS',
							'EMAIL SENT DATE & TIME',
							'EMAIL DELIVERED DATE & TIME',
							'EMAIL READ DATE & TIME',
							'EMAIL CLICKED DATE & TIME',
							'EMAIL FAILED DATE & TIME',
							'ERROR DESCRIPTION',
						],
					};
					this.appService.checkNotifcation = true;
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Email Delivery Report', option);
				}
			});
		} else if (this.selectedReportName == 3) {
			//For Teams Delivery Report
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getTeamsDelievryReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							let templateId;
							let category;
							let trackablelink;
							let trackablelink2;
							count++;

							let payload = {
								'SR NO': count,
								'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
								TAGS: item.User && item.User.tags ? item.User.tags : '',
								'JOB ROLE':
									item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
										? item.User.Client_job_roles[0].job_role_name
										: '',
								'DRIP ID': item.PostId,
								'DRIP FLOW ID': item.CampaignId,
								'BRANCH ID':
									item.User && item.User.Clients && item.User.Clients.length > 0 ? item.User.Clients[0].client_id : '',

								'MESSAGE ID': item.TeamTiggerId ? item.TeamTiggerId : '',
								'SYSTEM TRIGGER TIME': item.WTriggerTime
									? ' ' + moment(item.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
									: '',

								// STATUS: item.status ? item.status : '',
								// 'CAUSE (ERROR DESCRIPTION)': item.cause ? item.cause : '',
								// 'NOTIFICATION SENT DATE & TIME': item.sentDate
								// 	? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss')
								// 	: '',v

								// 'NOTIFICATION DELIVERED DATE & TIME': item.deliveryDate
								// 	? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
								// 	: '',
								// 'NOTIFICATION READ DATE & TIME': item.readDate
								// 	? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss')
								// 	: '',
								// 'NOTIFICATION FAILED DATE & TIME': item.failDate
								// 	? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss')
								// 	: '',
								// 'CLICKED EXTERNAL LINK': !trackablelink && !trackablelink2 ? '' : item.clickExternalLink ? 'YES' : 'NO',
								// 'LINK CLICK DATE & TIME': item.clickExternalLinkDate
								// 	? ' ' + moment(item.clickExternalLinkDate).local().format('YYYY-MM-DD HH:mm:ss')
								// 	: '',
								'ERROR DESCRIPTION': item.errorMessage ? item.errorMessage : '',
							};
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Microsoft Teams Delivery Report',
						useBom: false,
						noDownload: false,
						headers: [
							'SR NO',
							'CONTACT ID',
							'TAGS',
							'JOB ROLE',
							'DRIP ID',
							'DRIP FLOW ID',
							'BRANCH ID',
							'MESSAGE ID',
							'SYSTEM TRIGGER TIME',
							// 'STATUS',
							// 'CAUSE (ERROR DESCRIPTION)',
							// 'NOTIFICATION SENT DATE & TIME',
							// 'NOTIFICATION DELIVERED DATE & TIME',
							// 'NOTIFICATION READ DATE & TIME',
							// 'NOTIFICATION FAILED DATE & TIME',
							// 'CLICKED EXTERNAL LINK',
							// 'LINK CLICK DATE & TIME',
							'ERROR DESCRIPTION',
						],
					};
					this.appService.checkNotifcation = true;
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Microsoft Teams Delivery Report', option);
				}
			});
		} else if (this.selectedReportName == 4) {
			//For Whats App OPT-IN Report
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getWhatsAppOPTINReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							count++;
							let status = '';
							if (item.User && item.User.opt_in) {
								status = 'Opted In';
							} else if (item.User && item.User.opt_out) {
								status = 'Opted Out';
							} else if (item.haveWhatsAppOptIn) {
								status = 'Pending';
							} else {
								status = 'NA';
							}

							let payload = {
								'SR NO': count,
								'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'CONTACT CREATION DATE': item.User.createdAt
									? ' ' + moment(item.User.createdAt).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'OPT-IN SENT TO WHATSAPP': item.User.otp_update_at
									? ' ' + moment(item.User.otp_update_at).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'OPT-IN SENT DATE & TIME': item.User.otp_update_at
									? ' ' + moment(item.User.otp_update_at).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'OPT-OUT DATE & TIME': item.User.otp_out_at
									? ' ' + moment(item.User.otp_out_at).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'OPT-IN STATUS': status,
								'ERROR FROM META': item.User && item.User.optError ? item.User.optError : '',
							};
							finalData.push(payload);
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'WhatsApp opt-in Report',
						useBom: false,
						noDownload: false,
						headers: [
							'SR NO',
							'CONTACT ID',
							'CONTACT CREATION DATE',
							'OPT-IN SENT TO WHATSAPP',
							'OPT-IN SENT DATE & TIME',
							'OPT-OUT DATE & TIME',
							'OPT-IN STATUS',
							'ERROR FROM META',
						],
					};
					this.appService.checkNotifcation = true;
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'WhatsApp opt-in Report', option);
				}
			});
		} else if (this.selectedReportName === 5) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getBotMessageReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							let payload = {
								'Sr No': count,
								'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'Message Type': item.msgType ? this.capitalizeFirstLetter(item.msgType) : 'Bot Drip',
								'Message ID': item.messageId ? item.messageId : '',
								Time: item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
								Message: item.data ? item.data : '',
								Url: item.url ? item.url : '',
								Type: item.type ? this.capitalizeFirstLetter(item.type) : '',
								'Drip ID': item.Post && item.Post.id ? item.Post.id : '',
								'Drip Title': item.Post && item.Post.drip_title ? item.Post.drip_title : '',
								Status: item.status ? this.capitalizeFirstLetter(item.status) : '',
								Cause: item.cause ? this.capitalizeFirstLetter(item.cause) : '',
								'Delivery Code': item.deliveryCode ? item.deliveryCode : '',
								Channel: item.channel ? item.channel : '',
								'Sent Date': item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								'Delivery Date': item.deliveryDate
									? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'Read Date': item.readDate ? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								'Fail Date': item.failDate ? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								'Error Message': item.errorMessage ? item.errorMessage : '',
							};
							finalData.push(payload);
							count++;
						}
					}

					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Incoming Messages Report',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr No',
							'CONTACT ID',
							'Message Type',
							'Message ID',
							'Time',
							'Message',
							'Url',
							'Type',
							'Drip ID',
							'Drip Title',
							'Status',
							'Cause',
							'Delivery Code',
							'Channel',
							'Sent Date',
							'Delivery Date',
							'Read Date',
							'Fail Date',
							'Error Message',
						],
					};
					this.appService.checkNotifcation = true;
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Incoming Messages Report', option);
				}
			});
		} else if (this.selectedReportName == 6) {
			if (this.selectedDripType == 1) {
				//For Only WhatsApp getOnlyWhatsAppReport
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getOnlyWhatsAppReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'WHATSAPP TEMPLATE STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'TOTAL DRIPS READ ON WHATSAPP',
							'TOTAL DRIPS ENGAGED',
							// 'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
							'TOTAL LINK CLICKS ON WHATSAPP',
							// 'DRIP AVERAGE ACTION SCORE',
						];

						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp') + ' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						this.appService.checkNotifcation = true;
						finalData = await this.appService.sanitizedData(finalData);
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp') + ' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 2) {
				//For WhatsApp with Drip getWhatsAppWithdripReport
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getWhatsAppWithdripReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'WHATSAPP TEMPLATE STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'TOTAL DRIPS READ ON WHATSAPP',
							'TOTAL DRIPS READ ON DRIP APP',
							'TOTAL DRIPS ENGAGED',
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
							'ACTION INTENT VALUES',
							'ACTION TAKEN',
							'TOTAL LINK CLICKS ON WHATSAPP',
							//'TOTAL BUTTON CLICKS ON DRIP APP',
							'DRIP AVERAGE ACTION SCORE',
							'EXTERNAL LINK BUTTON CLICKS 1',
							'EXTERNAL LINK BUTTON CLICKS 2',
							'EXTERNAL LINK BUTTON CLICKS 3',
							'EXTERNAL LINK BUTTON CLICKS 4',
							'EXTERNAL LINK BUTTON CLICKS 5',
							'EXTERNAL LINK BUTTON CLICKS 6',
							'EXTERNAL LINK BUTTON CLICKS 7',
							'EXTERNAL LINK BUTTON CLICKS 8',
							'EXTERNAL LINK BUTTON CLICKS 9',
							'EXTERNAL LINK BUTTON CLICKS 10',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title:
								this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp') +
								' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						this.appService.checkNotifcation = true;
						finalData = await this.appService.sanitizedData(finalData);
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp') +
								' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 3) {
				//For Email With Drip getEmailWithdripReport
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getEmailWithdripReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'DRIPS READ ON EMAIL',
							'TOTAL DRIPS READ ON DRIP APP',
							'TOTAL DRIPS ENGAGED',
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
							'ACTION INTENT VALUES',
							'ACTION TAKEN',
							//'TOTAL BUTTON CLICKS ON DRIP APP',
							'DRIP AVERAGE ACTION SCORE',
							'EXTERNAL LINK BUTTON CLICKS 1',
							'EXTERNAL LINK BUTTON CLICKS 2',
							'EXTERNAL LINK BUTTON CLICKS 3',
							'EXTERNAL LINK BUTTON CLICKS 4',
							'EXTERNAL LINK BUTTON CLICKS 5',
							'EXTERNAL LINK BUTTON CLICKS 6',
							'EXTERNAL LINK BUTTON CLICKS 7',
							'EXTERNAL LINK BUTTON CLICKS 8',
							'EXTERNAL LINK BUTTON CLICKS 9',
							'EXTERNAL LINK BUTTON CLICKS 10',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title:
								this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail') +
								' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						this.appService.checkNotifcation = true;
						finalData = await this.appService.sanitizedData(finalData);
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail') +
								' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 4) {
				//For Only Drip App getOnlyDripAppReport
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getOnlyDripAppReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'TOTAL DRIPS READ ON HOME FEED',
							'TOTAL DRIPS READ ON DRIP APP',
							'TOTAL DRIPS ENGAGED',
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
							'ACTION INTENT VALUES',
							'ACTION TAKEN',
							//'TOTAL BUTTON CLICKS ON DRIP APP',
							'DRIP AVERAGE ACTION SCORE',
							'EXTERNAL LINK BUTTON CLICKS 1',
							'EXTERNAL LINK BUTTON CLICKS 2',
							'EXTERNAL LINK BUTTON CLICKS 3',
							'EXTERNAL LINK BUTTON CLICKS 4',
							'EXTERNAL LINK BUTTON CLICKS 5',
							'EXTERNAL LINK BUTTON CLICKS 6',
							'EXTERNAL LINK BUTTON CLICKS 7',
							'EXTERNAL LINK BUTTON CLICKS 8',
							'EXTERNAL LINK BUTTON CLICKS 9',
							'EXTERNAL LINK BUTTON CLICKS 10',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp') + ' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalData = await this.appService.sanitizedData(finalData);
						this.appService.checkNotifcation = true;
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp') + ' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 5) {
				//For ONly Teams Report
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getOnlyTeamsReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'DRIPS READ ON TEAMS',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyTeams') + ' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalData = await this.appService.sanitizedData(finalData);
						this.appService.checkNotifcation = true;
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyTeams') + ' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 6) {
				//For Teams with Drip Report
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getTeamsWithdripReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'DRIPS READ ON TEAMS',
							'TOTAL DRIPS READ ON DRIP APP',
							'TOTAL DRIPS ENGAGED',
							'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
							'ACTION INTENT VALUES',
							'ACTION TAKEN',
							'DRIP AVERAGE ACTION SCORE',
							'EXTERNAL LINK BUTTON CLICKS 1',
							'EXTERNAL LINK BUTTON CLICKS 2',
							'EXTERNAL LINK BUTTON CLICKS 3',
							'EXTERNAL LINK BUTTON CLICKS 4',
							'EXTERNAL LINK BUTTON CLICKS 5',
							'EXTERNAL LINK BUTTON CLICKS 6',
							'EXTERNAL LINK BUTTON CLICKS 7',
							'EXTERNAL LINK BUTTON CLICKS 8',
							'EXTERNAL LINK BUTTON CLICKS 9',
							'EXTERNAL LINK BUTTON CLICKS 10',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title:
								this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonTeams') +
								' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalData = await this.appService.sanitizedData(finalData);
						this.appService.checkNotifcation = true;
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonTeams') +
								' Report',
							option
						);
					}
				});
			} else if (this.selectedDripType == 7) {
				//For Email With Drip getEmailWithdripReport
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.analyticsService.getOnlyEmailReport(payload).subscribe(async (res: any) => {
					if (res.success) {
						let finalData = [];
						let headers = [
							'SR NO',
							'DRIP ID',
							'DRIP NAME',
							'DRIP STATUS',
							'DRIP CREATED BY',
							'DRIP CREATED DATE',
							'DRIP FLOW ID',
							'DRIP FLOW NAME',
							'DRIP FLOW CREATED BY',
							'DRIP FLOW CREATED DATE',
							'CONTACTS TARGETED IN DRIP FLOW',
							'DRIP FLOW STATUS',
							'TOTAL DRIPS SCHEDULED',
							'TOTAL DRIPS SENT',
							'TOTAL DRIPS DELIVERED',
							'DRIPS READ ON EMAIL',
						];
						if (res.data && res.data.length > 0) {
							headers = [];
							for (let key in res.data[0]) {
								headers.push(key);
							}
							finalData = res.data;
						}
						var option = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail') + ' Report',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalData = await this.appService.sanitizedData(finalData);
						this.appService.checkNotifcation = true;
						const fileInfo = new ngxCsv(
							finalData,
							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.onlyOnEmail') + ' Report',
							option
						);
					}
				});
			}
		} else if (this.selectedReportName == 7) {
			//For Custom  Report
			payload.selectedCustomReportName = this.selectedCustomReportName;

			if (
				payload.selectedCustomReportName != null &&
				payload.selectedCustomReportName != '' &&
				payload.selectedCustomReportName != undefined
			) {
				this.toastr.success(
					this.appService.getTranslation('Utils.reportDownloadMessage'),
					this.appService.getTranslation('Utils.success')
				);

				this.analyticsService
					.getCustomReport(payload)
					.toPromise()
					.then(
						(res: any) => {
							let link = document.createElement('a');
							link.href = window.URL.createObjectURL(res);
							link.download = 'Custom_Report.xlsx';
							link.click();
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
		} else if (this.selectedReportName == 8) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getTicketReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					let headers = [
						'SR NO',
						'TICKET ID',
						'FUNCTION NAME',
						'STATUS',
						'CREATED DATE',
						'ADMIN USER ID',
						'CONTACT ID',
						'QUERY',
						'COMMENT',
					];

					if (res.data && res.data.length > 0) {
						headers = [];
						for (let key in res.data[0]) {
							headers.push(key);
						}
						finalData = res.data;
					}
					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Ticket Report',
						useBom: false,
						noDownload: false,
						headers: headers,
					};
					finalData = await this.appService.sanitizedData(finalData);
					this.appService.checkNotifcation = true;
					const fileInfo = new ngxCsv(finalData, 'Ticket Report', option);
				}
			});
		} else if (this.selectedReportName == 9) {
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.analyticsService.getContactWiseReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					let headers = ['Contact ID', 'Drip ID', 'Drip Flow ID', 'Read On Drip App', 'Action Intent', 'Action Taken'];

					if (res.data && res.data.length > 0) {
						headers = [];
						for (let key in res.data[0]) {
							headers.push(key);
						}
						finalData = res.data;
					}
					var option = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'ContactWise Report',
						useBom: false,
						noDownload: false,
						headers: headers,
					};
					finalData = await this.appService.sanitizedData(finalData);
					this.appService.checkNotifcation = true;

					const fileInfo = new ngxCsv(finalData, 'ContactWise Report', option);
				}
			});
		}
	}

	submitGraded() {
		this.isediGraded = false;
		this.updateLearnerOfflineTaskAssetGrade();
	}

	editGraded() {
		this.isediGraded = true;
	}

	getAssetsFilter(text) {
		// console.log('--text--', text);
		if (text.length > 2) {
			this.offlineTaskSearchText = text;
			this.getOfflineTask();
		} else if (text.length == 0) {
			this.offlineTaskSearchText = '';
			this.getOfflineTask();
		} else {
			this.offlineTaskSearchText = '';
		}
	}

	selectedQuestion(item, index) {
		this.activeIndex = index;
		this.selectedQuestionText = item.question;
		if (['Image', 'PDF'].indexOf(item.fileType) > -1) {
			this.showDownloadButton = true;
		} else {
			this.showDownloadButton = false;
		}
		this.page = 1;
		this.getOfflineTask();
		// this.questionUploadedAsset = this.allOfflineTaskData[index].data;
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	updateLearnerOfflineTaskAssetGrade() {
		this.analyticsService
			.updateLearnerOfflineTaskAssetGrade({
				data: this.selectedOfflineTaskDetails,
				details: this.allOfflineTaskData,
			})
			.subscribe((res: any) => {
				if (res.success) {
					this.gradedCount = res.gradeCount;
					this.totalGradedableCount = res.totalGradedableCount;
				}
			});
	}

	downloadLearnerUploadedFile(item, index) {
		if (!item.UploadedOnS3) {
			this.analyticsService
				.downloadLearnerUploadedFiles({ path: item.path })
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);
						link.download = `${item.fileName}`;
						link.click();
						// this.toastr.success();
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
		} else {
			this.toastr.success(
				this.appService.getTranslation('Utils.fileDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			let payload = { files: [item.fileName] };
			this.analyticsService.getAllPreSignedUrlForDownload(payload).subscribe((res: any) => {
				if (res.success) {
					this.analyticsService.downloadAwsS3File(res.urls[0].url).subscribe(
						(blob) => {
							const url = window.URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = item.fileName; // replace with the desired file name
							a.click();
							window.URL.revokeObjectURL(url);
						},
						(error) => {
							console.error('Download failed', error);
						}
					);
				}
			});
		}
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		this.getOfflineTask();
	}
	changeResult(count) {
		console.log(count);
	}

	downloadLearnerUploadedFileInZipFormat() {
		this.analyticsService
			.downloadLearnerUploadedFileInZipFormat(this.questionUploadedAsset, this.selectedOfflineTaskDetails.campaign_id)
			.toPromise()
			.then(
				(res: any) => {
					let link = document.createElement('a');
					link.href = window.URL.createObjectURL(res);

					link.download = 'page_' + this.page + '_files.zip';
					link.click();
					// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
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

	downloadOfflineTaskDripReport(data) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.analyticsService.getOfflineTaskAllDataForReport({ details: data.otherDetails }).subscribe(async (res: any) => {
			if (res.success) {
				let finalData = [];
				if (res.data && res.data.length > 0) {
					let count = 0;
					finalData = res.data;
				}
				let headers = [];
				for (let key in finalData[0]) {
					headers.push(key);
				}

				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: false,
					showTitle: false,
					title: 'Offline Task Report',
					useBom: false,
					noDownload: false,
					headers: headers,
				};
				finalData = await this.appService.sanitizedData(finalData);
				const fileInfo = new ngxCsv(finalData, 'Offline Task Report', option);
			}
		});
	}

	downloadOnlyEmailReport(data) {
		this.analyticsService.getOnlyEmailReportDownload({ details: data.otherDetails }).subscribe((res: any) => {
			if (res.success) {
				// let finalData = [];
				// let headers = ['SR NO', 'TRIGGER TIME', 'CONTACT ID', 'SELECTED QUICK REPLY'];
				// let count = 1;
				// for (let data of res.data) {
				// 	let quickReplyData = data.quickReplyResponse ? data.quickReplyResponse.split(',') : [];
				// 	if (quickReplyData && quickReplyData.length > 0) {
				// 		for (let reply of quickReplyData) {
				// 			let payload = {
				// 				'SR NO': count,
				// 				// 'DRIP ID': data.PostId,
				// 				// 'DRIP FLOW ID': data.CampaignId,
				// 				'TRIGGER TIME': data.WTriggerTime
				// 					? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
				// 					: '',
				// 				'CONTACT ID': data.User.account_id,
				// 			};
				// 			finalData.push(payload);
				// 			count++;
				// 		}
				// 	} else {
				// 		let payload = {
				// 			'SR NO': count,
				// 			// 'DRIP ID': data.PostId,
				// 			// 'DRIP FLOW ID': data.CampaignId,
				// 			'TRIGGER TIME': data.WTriggerTime
				// 				? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
				// 				: '',
				// 			'CONTACT ID': data.User.account_id,
				// 		};
				// 		finalData.push(payload);
				// 		count++;
				// 	}
				// }
				// var option = {
				// 	fieldSeparator: ',',
				// 	quoteStrings: '"',
				// 	decimalseparator: '.',
				// 	showLabels: false,
				// 	showTitle: false,
				// 	title: 'Only_Email_report',
				// 	useBom: false,
				// 	noDownload: false,
				// 	headers: headers,
				// };
				// const fileInfo = new ngxCsv(finalData, 'Only_Email_report', option);
			}
		});

		//Show Note PopUp
		$('#viewuonlywhatsappquickreplaynotes').modal('show');
	}

	downloadOnlyWhatsAppReport(data) {
		this.analyticsService.getOnlyWhatsAppReportDownload({ details: data.otherDetails }).subscribe(async (res: any) => {
			if (res.success) {
				let finalData = [];
				let headers = ['SR NO', 'TRIGGER TIME', 'CONTACT ID', 'SELECTED QUICK REPLY'];

				let count = 1;
				for (let data of res.data) {
					let quickReplyData = data.quickReplyResponse ? data.quickReplyResponse.split(',') : [];
					if (quickReplyData && quickReplyData.length > 0) {
						for (let reply of quickReplyData) {
							let payload = {
								'SR NO': count,
								// 'DRIP ID': data.PostId,
								// 'DRIP FLOW ID': data.CampaignId,
								'TRIGGER TIME': data.WTriggerTime
									? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'CONTACT ID': data.User.account_id,
								'SELECTED QUICK REPLY': reply,
							};
							finalData.push(payload);
							count++;
						}
					} else {
						let payload = {
							'SR NO': count,
							// 'DRIP ID': data.PostId,
							// 'DRIP FLOW ID': data.CampaignId,
							'TRIGGER TIME': data.WTriggerTime
								? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
								: '',
							'CONTACT ID': data.User.account_id,
							'SELECTED QUICK REPLY': '',
						};
						finalData.push(payload);
						count++;
					}
				}

				var option = {
					fieldSeparator: ',',
					quoteStrings: '"',
					decimalseparator: '.',
					showLabels: false,
					showTitle: false,
					title: 'Quick_reply_report',
					useBom: false,
					noDownload: false,
					headers: headers,
				};
				finalData = await this.appService.sanitizedData(finalData);
				const fileInfo = new ngxCsv(finalData, 'Quick_reply_report', option);
			}
		});

		//Show Note PopUp
		$('#viewuonlywhatsappquickreplaynotes').modal('show');
	}

	cancelNotePopUp() {
		$('#viewuonlywhatsappquickreplaynotes').modal('hide');
	}

	downloadSurveyReport(data, flag) {
		// console.log('---item---', data);
		// this.selectedDripDetails = data.otherDetails;
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};
		this.selectedDripDetails = payload;
		// this.toastr.success(
		// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
		// 	this.appService.getTranslation('Utils.success')
		// );
		if (flag) {
			this.analyticsService.getAllSuervyDataForReport(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createSurveyReport();
					}, 200);
				}
			});
		} else {
			this.analyticsService
				.downloadLearnerUploadedSurvey(this.selectedDripDetails)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);

						link.download = 'Survey_uploaded_files.zip';
						link.click();
						// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
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
			// this.analyticsService.getAllSuervyDataForReport(this.selectedDripDetails).subscribe((res: any) => {
			// 	if (res.success) {
			// 		this.selectedDripAllData = [];
			// 		this.selectedDripAllData = res.data;
			// 		setTimeout(() => {
			// 			this.downloadSurveyUploadedFiles();
			// 		}, 200);
			// 	}
			// });
		}
	}

	async createPollReport() {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let header = [];
			for (let key in this.selectedDripAllData[0]) {
				header.push(key);
			}
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Poll Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Poll Report', option);
		}
	}

	async createOfflineTaskReport() {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let headers = [];
			for (let key in this.selectedDripAllData[0]) {
				headers.push(key);
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Offline Task Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			this.selectedDripAllData = await this.appService.sanitizedData(this.selectedDripAllData);
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Offline Task Report', option);
		}
	}

	downloadPollReport(data, flag) {
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};
		this.selectedDripDetails = payload;

		if (flag) {
			this.analyticsService.getAllPollDataForReport(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createPollReport();
					}, 200);
				}
			});
		} else {
			this.analyticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					this.allQuestion = [];
					this.allQuestion.push({ question: res.question });
					setTimeout(() => {
						$('#showResultModel').modal('show');
					}, 200);
				}
			});
		}
	}

	downloadOfflienTaskReport(data, flag) {
		let payload = {
			campaign_id: data.campaign_id,
			drip_camp_id: data.drip_camp_id,
			drip_camp_Index: data.drip_camp_index,
			post_id: data.post_id,
			type: data.template_type,
		};
		this.selectedDripDetails = payload;

		if (flag) {
			this.analyticsService.getOfflineTaskAllDataForReport(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createOfflineTaskReport();
					}, 200);
				}
			});
		} else {
			this.analyticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					this.allQuestion = [];
					this.allQuestion.push({ question: res.question });
					// setTimeout(() => {
					// 	$('#showResultModel').modal('show');
					// }, 200);
				}
			});
		}
	}

	downloadSingleImageReport(data, flag) {
		if (flag) {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.analyticsService.getSingleImageAllDataForReport(payload).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createSingleImageReport(res.haveExternalLink);
					}, 200);
				}
			});
		}
	}

	downloadCarouselReport(data, flag) {
		if (flag) {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.analyticsService.getCarouselAllDataForReport(payload).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createCarouselReport(res.haveExternalLink);
					}, 200);
				}
			});
		}
	}

	createSingleImageReport(externalLinkData) {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let headers = ['SR NO', 'CONTACT ID', 'DRIP ID', 'DRIP FLOW ID'];
			let removeKey = [];
			if (externalLinkData) {
				for (let i = 1; i <= 10; i++) {
					if (externalLinkData['externalLink' + i]) {
						headers.push('EXTERNAL LINK BUTTON CLICK ' + i);
					} else {
						removeKey.push('EXTERNAL LINK BUTTON CLICK ' + i);
					}
				}
			}
			let haveHyperLink = false;
			for (let data of this.selectedDripAllData) {
				if (data['HYPERLINK CLICK'] != null) {
					haveHyperLink = true;
					headers.push('HYPERLINK CLICK');
					break;
				}
			}

			for (let data of this.selectedDripAllData) {
				for (let key of removeKey) {
					delete data[key];
				}
				if (!haveHyperLink) {
					delete data['HYPERLINK CLICK'];
				} else {
					if (data['HYPERLINK CLICK'] == null) {
						data['HYPERLINK CLICK'] = '';
					}
				}
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Single Image Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Single Image Report', option);
		}
	}

	createCarouselReport(externalLinkData) {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let headers = [
				'SR NO',
				'CONTACT ID',
				'DRIP ID',
				'DRIP FLOW ID',
				'TOTAL SWIPE COUNT',
				'TOTAL SWIPED',
				'SWIPED PERCENTAGE',
			];
			let removeKey = [];
			if (externalLinkData) {
				for (let i = 1; i <= 10; i++) {
					if (externalLinkData['externalLink' + i]) {
						headers.push('EXTERNAL LINK BUTTON CLICK ' + i);
					} else {
						removeKey.push('EXTERNAL LINK BUTTON CLICK ' + i);
					}
				}
			}
			let haveHyperLink = false;
			for (let data of this.selectedDripAllData) {
				if (data['HYPERLINK CLICK'] != null) {
					haveHyperLink = true;
					headers.push('HYPERLINK CLICK');
					break;
				}
			}

			for (let data of this.selectedDripAllData) {
				for (let key of removeKey) {
					delete data[key];
				}
				if (!haveHyperLink) {
					delete data['HYPERLINK CLICK'];
				} else {
					if (data['HYPERLINK CLICK'] == null) {
						data['HYPERLINK CLICK'] = '';
					}
				}
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Carousel Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Carousel Report', option);
		}
	}
	downloadVideoReport(data, flag) {
		if (flag) {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.analyticsService.getVideoAllDataForReport(payload).subscribe((res: any) => {
				if (res.success) {
					this.selectedDripAllData = [];
					this.selectedDripAllData = res.data;
					setTimeout(() => {
						this.createVideoReport(res.haveExternalLink);
					}, 200);
				}
			});
		}
	}

	createVideoReport(externalLinkData) {
		if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
			let headers = [
				'SR NO',
				'CONTACT ID',
				'DRIP ID',
				'DRIP FLOW ID',
				'TOTAL DURATION IN SEC',
				'WATCH TIME IN SEC',
				'WATCH TIME IN PERCENTAGE',
			];
			let removeKey = [];
			let haveHyperLink = false;
			if (externalLinkData) {
				for (let i = 1; i <= 10; i++) {
					if (externalLinkData['externalLink' + i]) {
						headers.push('EXTERNAL LINK BUTTON CLICK ' + i);
					} else {
						removeKey.push('EXTERNAL LINK BUTTON CLICK ' + i);
					}
				}
			}
			for (let data of this.selectedDripAllData) {
				if (data['HYPERLINK CLICK'] != null) {
					haveHyperLink = true;
					headers.push('HYPERLINK CLICK');
					break;
				}
			}
			for (let data of this.selectedDripAllData) {
				for (let key of removeKey) {
					delete data[key];
				}
				if (!haveHyperLink) {
					delete data['HYPERLINK CLICK'];
				} else {
					if (data['HYPERLINK CLICK'] == null) {
						data['HYPERLINK CLICK'] = '';
					}
				}
			}

			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Video Report',
				useBom: false,
				noDownload: false,
				headers: headers,
			};
			const fileInfo = new ngxCsv(this.selectedDripAllData, 'Video Report', option);
		}
	}

	reportDownload(data) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		if (data.drip_type == 'Only WhatsApp') {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.selectedDripDetails = payload;
			this.downloadOnlyWhatsAppReport({ otherDetails: this.selectedDripDetails });
		} else if (data.drip_type == 'Only Email') {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.selectedDripDetails = payload;
			this.downloadOnlyEmailReport(payload);
		} else if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
			this.ShowPopupForQuiz(data);
		} else if (data.template_type == 'Survey') {
			this.downloadSurveyReport(data, true);
		} else if (data.template_type == 'Poll') {
			this.downloadPollReport(data, true);
		} else if (data.template_type == 'Offline Task') {
			this.downloadOfflienTaskReport(data, true);
		} else if (data.template_type == 'Video') {
			this.downloadVideoReport(data, true);
		} else if (data.template_type == 'Carousel') {
			this.downloadCarouselReport(data, true);
		} else if (data.template_type == 'Single Image') {
			this.downloadSingleImageReport(data, true);
		} else if (data.template_type == 'Spin The Wheel') {
			this.downloadSpinTheWheelReport(data);
		} else if (data.template_type == 'Custom Template') {
			this.downloadCustomTemplateReport(data);
		}
		return;
	}

	filesDownload(data) {
		if (data.template_type == 'Offline Task' && !data?.downloadFileForOfflineTask) {
			return;
		}
		if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
			// this.ShowPopupForQuiz(data);
		}
		// if (data.template_type == 'Survey') {
		// 	this.downloadSurveyReport(data, false);
		// } else
		else if (data.template_type == 'Poll') {
			this.downloadPollReport(data, false);
		} else if (data.template_type == 'Offline Task' || data.template_type == 'Survey') {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.selectedDripDetails = payload;
			this.ShowPopupForViewuplaods({ otherDetails: this.selectedDripDetails }, true);
		}
		return;
	}

	filesDownloadFromNodeView(data) {
		if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
			// this.ShowPopupForQuiz(data);
		}
		// else if (data.template_type == 'Survey') {
		// 	this.downloadSurveyReport(data, false);
		// }
		else if (data.template_type == 'Poll') {
			this.downloadPollReport(data, false);
		} else if (data.template_type == 'Offline Task') {
			let payload = {
				campaign_id: data.campaign_id,
				drip_camp_id: data.drip_camp_id,
				drip_camp_Index: data.drip_camp_index,
				post_id: data.post_id,
				type: data.template_type,
			};
			this.selectedDripDetails = payload;
			this.ShowPopupForViewuplaods({ otherDetails: this.selectedDripDetails }, true);
		}
		return;
	}

	exportToCsv() {
		if (this.AllCampaignDrip && this.AllCampaignDrip.length > 0) {
			let header = [
				'DRIP NODE NAME',
				'DRIP NODE STATUS',
				'SENDING DATE & TIME',
				'SCHEDULED',
				'SENT',
				'DELIVERED',
				'READ ON CHANNEL',
				'READ RATE ON CHANNEL',
				'READ ON DRIP APP',
				'READ RATE ON DRIPAPP',
				'ACTION INTENT DISPLAYED',
				'ACTION TAKEN',
				'ACTION TAKEN RATE',
				'AVERAGE ACTION SCORE',
			];
			let exportdata = [];
			for (let data of this.AllCampaignDrip) {
				let payload = {
					'DRIP NODE NAME': data.node_name,
					'DRIP NODE STATUS': data.node_status,
					'SENDING DATE & TIME': data.node_send_date ? data.node_send_date : '-',
					SCHEDULED: data.scheduled,
					SENT: data.sent,
					DELIVERED: data.delivered,
					'READ ON CHANNEL': data.read_on_every_day_channel ? data.read_on_every_day_channel : 0,
					// 'READ RATE ON WHATSAPP':
					// 	data.read_rate_on_every_day_channel && !data.isTotal ? data.read_rate_on_every_day_channel + `%` : `0%`,
					// 'READ ON DRIP APP': data.read_on_drip_app ? data.read_on_drip_app : 0,
					// 'READ RATE ON DRIPAPP': data.read_rate_on_drip_app && !data.isTotal ? data.read_rate_on_drip_app + `%` : `0%`,
					// 'ACTION INTENT DISPLAYED': data.action_intent_displayed ? data.action_intent_displayed : 0,
					// 'ACTION TAKEN': data.action_taken ? data.action_taken : 0,
					// 'ACTION TAKEN RATE': data.rate_action_taken && !data.isTotal ? data.rate_action_taken + `%` : `0%`,
					// 'AVERAGE ACTION SCORE': data.average_action_score ? data.average_action_score : 0,
				};

				payload['READ RATE ON CHANNEL'] = data.read_rate_on_every_day_channel
					? data.read_rate_on_every_day_channel + `%`
					: `0%`;

				payload['READ ON DRIP APP'] = data.read_on_drip_app ? data.read_on_drip_app : 0;

				payload['READ RATE ON DRIPAPP'] = data.read_rate_on_drip_app ? data.read_rate_on_drip_app + `%` : `0%`;

				payload['ACTION INTENT DISPLAYED'] = data.action_intent_displayed ? data.action_intent_displayed : 0;
				payload['ACTION TAKEN'] = data.action_taken ? data.action_taken : 0;

				payload['ACTION TAKEN RATE'] = data.rate_action_taken ? data.rate_action_taken + `%` : `0%`;

				payload['AVERAGE ACTION SCORE'] = data.average_action_score ? data.average_action_score : 0;
				exportdata.push(payload);
			}
			var option = {
				fieldSeparator: ',',
				quoteStrings: '"',
				decimalseparator: '.',
				showLabels: false,
				showTitle: false,
				title: 'Export Report',
				useBom: false,
				noDownload: false,
				headers: header,
			};
			const fileInfo = new ngxCsv(exportdata, 'Export Report', option);
		}
	}

	onChnageClient(client) {
		this.selectedCustomReport(client.id);
		this.checkTeamsAccessToken(client.id);
	}

	selectedCustomReport(clientId) {
		this.analyticsService.getAllCustomReportUsingClientId(clientId).subscribe((res: any) => {
			if (res.success) {
				if (res && res.data) {
					this.customReportNameList = [];
					this.customReportNameList = res.data.ClientCustomReports;
				}
			}
		});
	}

	//Download AWS S3
	downLoadAwsS3Data() {
		//Show Toster Message
		this.toastr.success(
			this.appService.getTranslation('Utils.fileDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		//Get Pre SignURLS

		let payload = { files: [] };

		for (let file of this.questionUploadedAsset) {
			if (file?.UploadedOnS3) {
				payload.files.push(file.fileName);
			} else {
				this.downloadLearnerUploadedFile(file, null);
			}
		}
		if (payload.files.length > 0) {
			this.analyticsService.getAllPreSignedUrlForDownload(payload).subscribe(async (res: any) => {
				if (res.success) {
					if (res && res.urls) {
						let files;

						// let count = 0;
						for (let data of res.urls) {
							// const response = await this.fetchBlob(url.url);
							// files[url.fileName] = new Uint8Array(await response.arrayBuffer());
							// this.downloadBlob(new Blob([files]), 'offline_task_uploaded_files.zip');
							// count++;
							// if (count === res.urls.length) {
							// 	try {
							// 		zip(files, (err, zipped) => {
							// 			if (err) {
							// 				console.error('Error generating zip file:', err);
							// 			} else {
							// 				this.downloadBlob(new Blob([zipped]), 'offline_task_uploaded_files.zip');
							// 			}
							// 		});
							// 	} catch (zipError) {
							// 		console.error('Error generating zip file:', zipError);
							// 	}
							// }
							this.analyticsService.downloadAwsS3File(data.url).subscribe(
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
	}

	// Function to download the generated ZIP file
	downloadBlob(blob: Blob, filename: string) {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url); // Clean up
	}
	async fetchBlob(url: string): Promise<Blob> {
		const response = await fetch(url);
		return response.blob();
	}

	checkTeamsAccessToken(ClientId) {
		this.appService.checkTeamAccessTokenByClientId(ClientId).subscribe((res: any) => {
			if (res.success && res.data && res.data.TeamSetup && res.data.TeamSetup.id) {
				this.haveMicrosoftTeamsAccess = true;
			} else {
				this.haveMicrosoftTeamsAccess = false;
			}
		});
	}
}
