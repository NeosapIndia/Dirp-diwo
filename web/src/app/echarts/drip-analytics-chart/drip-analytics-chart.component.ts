import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { routerTransition } from 'src/app/router.animations';
import * as echarts from 'echarts';
import * as moment from 'moment';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import { DripAnalyticsChartService } from './drip-analytics.service';
import { environment } from 'src/environments/environment';
import { ngxCsv } from 'ngx-csv/ngx-csv';
declare var $: any;
@Component({
	selector: 'app-drip-analytics-chart',
	templateUrl: './drip-analytics-chart.component.html',
	styleUrls: ['./drip-analytics-chart.component.scss'],
	animations: [routerTransition()],
})
export class DripAnalyticsChartComponent implements OnInit {
	pageResultCount = environment.pageResultsCount;
	loadingCompleted = false;
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

	// totalQuestionCount = 0;
	// totalResponses = 0;
	// maxPossibleScore = 0;
	// avaregeScore: any = 0;
	// topScore = 0;
	// gradedCount = 0;
	// totalGradedableCount = 0;
	// DripAppwithsharingonWhatsApp = [];

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
	colorArray = ['#5271FF', '#215968', '#01BFBD', '#FF66C4'];

	colorScheme = {
		domain: ['#5271FF', '#215968', '#01BFBD', '#FF66C4'],
	};

	scheduleColor = '#5271FF';
	sentColor = '#215968';
	deliveredColor = '#01BFBD';
	engagedColor = '#FF66C4';

	//for line chart
	// legend: boolean = true;
	// showLabels: boolean = true;
	// animations: boolean = true;
	// xAxis: boolean = true;
	// yAxis: boolean = true;
	// timeline: boolean = true;

	filterData = [
		{ id: 1, name: 'Account', value: 'Account', option: [], isCustomField: false },
		{ id: 2, name: 'Country', value: 'Country', option: [], isCustomField: false },
		{ id: 3, name: 'Job Role', value: 'Job Role', option: [], isCustomField: false },
		{ id: 4, name: 'Tags', value: 'Tags', option: [], isCustomField: false },
		{ id: 5, name: 'Channel', value: 'Channel', option: [], isCustomField: false },
		{ id: 6, name: 'Drip Flows', value: 'Drip Flows', option: [], isCustomField: false },
		{ id: 7, name: 'Drips', value: 'Drips', option: [], isCustomField: false },
	];

	branchList = [];

	countryList = [];

	jobRoleList = [];

	DripFlow = [];

	dripTypes = [];
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
	selectedRateOfEngagedTab: boolean = true;
	seletedDripSentTab: boolean = true;
	seletedDripDeliveredTab: boolean = true;
	seletedDripEngagedTab: boolean = true;
	selectedDataToShow: any = [];
	engadgedDataInPersentage: any = [];
	totalRateOfEngaged = 0;
	totalDripSent = 0;
	totalDripDelivered = 0;
	totalDripEngaged = 0;
	selectedFilterType: any;
	selectedFilterDate: { startDate: any; endDate: any };
	filterArrayData: any = [];
	payload: { filterType: any; selectedData: any[]; searchByText: any; isCustomField: boolean };
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
	customFieldSelectedList: null;
	allInOneFilterData: any = [];
	dripTypeList = [];

	showNoData = false;
	customFieldList: any[];
	customFieldOptions = [];
	customFieldLabelList: any[] = [];

	iconObject = {
		expand_more_icon: null,
	};
	color: any = `#6513e1`;

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private dripAnalyaticsService: DripAnalyticsChartService,
		private router: Router,
		public appService: AppService,
		public sanitizer: DomSanitizer
	) {
		Object.assign(this.verticalGraphResult);
		Object.assign(this.AllCampaignDrip);
		this.dripTypes = [];

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

		///////////////////////////////////////////////////////////////////////////////////////////
		//Remove Team and Whats App Type Drip From the Drip Types Array
		if (!this.appService?.configurable_feature?.teams) {
			[6, 5].forEach((index) => this.dripTypes.splice(index, 1));
		}
		if (!this.appService?.configurable_feature?.whatsApp) {
			[1, 0].forEach((index) => this.dripTypes.splice(index, 1));
		}
		///////////////////////////////////////////////////////////////////////////////////////////
		this.dripTypeList = this.dripTypes;

		//Check Filter Data on Local Storage

		if (localStorage.getItem('selectedDripAnlyaticTabs')) {
			let data = JSON.parse(localStorage.getItem('selectedDripAnlyaticTabs'));
			this.selectedRateOfEngagedTab = data.selectedRateOfEngagedTab;
			this.seletedDripSentTab = data.seletedDripSentTab;
			this.seletedDripDeliveredTab = data.seletedDripDeliveredTab;
			this.seletedDripEngagedTab = data.seletedDripEngagedTab;
		}

		if (
			localStorage.getItem('selectedAnalyaticsFilterData') &&
			localStorage.getItem('selectedAnalyaticsFilterData') != '[]'
		) {
			this.filterArrayData = JSON.parse(localStorage.getItem('selectedAnalyaticsFilterData'));
		}

		if (localStorage.getItem('selectedAnalyaticsFilterDate')) {
			let data = JSON.parse(localStorage.getItem('selectedAnalyaticsFilterDate'));
			this.selectedFilterDate = {
				startDate: moment(data.startDate),
				endDate: moment(data.endDate),
			};
		} else {
			this.selectedFilterDate = {
				startDate: moment().subtract(29, 'days'),
				endDate: moment(),
			};
		}
	}

	ngOnInit() {
		this.getAppBranding();
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.selectedClientId = this.userClient.id;
		this.getFilterListData();
		// this.getAllSubClientList();
		this.getAllAnylyticsData();

		// this.getAllCount(this.selectedClientId);
		// this.createChart();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getFilterListData() {
		this.dripAnalyaticsService.getFilterListData().subscribe((res: any) => {
			if (res.success) {
				this.allInOneFilterData = res.data;
				this.branchList = res.data.BranchList;
				this.countryList = res.data.CountryList;
				this.jobRoleList = res.data.JobRoleList;
				this.dripList = res.data.DripList;
				this.campaignList = res.data.CampaignList;
				this.customFieldList = res.data.customFields;
				// if (this.campaignList.length > 0) {
				// 	this.selectedCampaign = this.campaignList[0].id;
				// 	this.selectedDripFlow(this.campaignList[0]);
				// }
				this.customFieldLabelList = [];
				if (this.customFieldList.length > 0) {
					let id = this.filterData.length;
					for (let field of this.customFieldList) {
						id = id + 1;
						this.customFieldLabelList.push(field.label);
						this.filterData.push({
							id: id,
							name: field.label,
							value: field.label,
							option: field.options,
							isCustomField: true,
						});
					}
				}
				if (this.filterArrayData.length > 0) {
					this.filterArrayData = JSON.parse(localStorage.getItem('selectedAnalyaticsFilterData'));
					this.updateFilterListForFirstTime();
				}
				this.loadingCompleted = true;
			}
		});
	}

	savelocalStorageData() {
		let date = {
			startDate: this.selectedFilterDate.startDate,
			endDate: this.selectedFilterDate.endDate,
		};
		localStorage.setItem('selectedAnalyaticsFilterData', JSON.stringify(this.filterArrayData));
		localStorage.setItem('selectedAnalyaticsFilterDate', JSON.stringify(date));
	}

	getAllAnylyticsData() {
		this.savelocalStorageData();
		let date = {
			startDate: moment(this.selectedFilterDate.startDate).format('YYYY-MM-DD'),
			endDate: moment(this.selectedFilterDate.endDate).format('YYYY-MM-DD'),
		};
		this.isApiCall = true;

		this.dripAnalyaticsService
			.getAnalyticsData({ filterData: this.filterArrayData, date: date })
			.subscribe((res: any) => {
				if (res.success) {
					this.totalAnayticsData = res.data;
					this.totalDripSent = res.data[1].data.reduce((a, b) => a + b, 0);
					this.totalDripDelivered = res.data[2].data.reduce((a, b) => a + b, 0);
					this.totalDripEngaged = res.data[3].data.reduce((a, b) => a + b, 0);
					if (this.totalDripDelivered > 0) {
						this.totalRateOfEngaged = parseFloat(((this.totalDripEngaged / this.totalDripDelivered) * 100).toFixed(2));
					} else {
						this.totalRateOfEngaged = 0;
					}
					this.isApiCall = false;
					this.createChart(this.totalAnayticsData);
				}
			});
	}

	// getAllDripActivityForGraph(clientId, type) {
	// 	this.spinnerService.show();
	// 	let month;
	// 	if (type == 'All Graph') {
	// 		month = 11;
	// 		this.hideLineGraph = true;
	// 		this.hideVerticalGraph = true;
	// 	} else if (type == 'Vertical Graph') {
	// 		month = this.dripActivityMonths;
	// 		this.hideVerticalGraph = true;
	// 	} else if (type == 'Line Graph') {
	// 		this.hideLineGraph = true;
	// 		month = this.DripSendByTypeMonths;
	// 	}
	// 	let finalList = [];
	// 	this.dripAnalyaticsService
	// 		.getAllDripActivity(clientId, month, this.seletcedDripActivityType)
	// 		.subscribe((res: any) => {
	// 			if (res.success) {
	// 				finalList = [];
	// 				let verticalGraphFlag_ = true;
	// 				let lineGraphFlag_ = true;
	// 				for (let item of res.vertical_graph_data) {
	// 					// if (item.dripScheduled != 0) {
	// 					// 	verticalGraphFlag_ = false;
	// 					// }
	// 					if (item.dripSend != 0) {
	// 						verticalGraphFlag_ = false;
	// 					}
	// 					if (item.dripDelivered != 0) {
	// 						verticalGraphFlag_ = false;
	// 					}
	// 					if (item.dripEngaged != 0) {
	// 						verticalGraphFlag_ = false;
	// 					}

	// 					finalList.push({
	// 						name: item.month,
	// 						series: [
	// 							// {
	// 							// 	name: 'Drip Scheduled',
	// 							// 	value: parseInt(item.dripScheduled),
	// 							// },
	// 							{
	// 								name: 'Drip Sent',
	// 								value: parseInt(item.dripSend),
	// 							},
	// 							{
	// 								name: 'Drip Delivered',
	// 								value: parseInt(item.dripDelivered),
	// 							},
	// 							{
	// 								name: 'Drip Engaged',
	// 								value: parseInt(item.dripEngaged),
	// 							},
	// 						],
	// 					});
	// 				}

	// 				for (let item of res.line_graph_data) {
	// 					for (let type of item.series) {
	// 						if (type.value != 0) {
	// 							lineGraphFlag_ = false;
	// 							break;
	// 						}
	// 					}
	// 				}

	// 				if (type == 'All Graph') {
	// 					this.verticalGraphFlag = verticalGraphFlag_;
	// 					this.lineGraphFlag = lineGraphFlag_;
	// 					this.verticalGraphResult = [];
	// 					this.verticalGraphResult = finalList;
	// 					this.lineGraphResult = [];
	// 					this.lineGraphResult = res.line_graph_data;
	// 				} else if (type == 'Vertical Graph') {
	// 					this.verticalGraphFlag = verticalGraphFlag_;
	// 					this.verticalGraphResult = [];
	// 					this.verticalGraphResult = finalList;
	// 				} else if (type == 'Line Graph') {
	// 					this.lineGraphFlag = lineGraphFlag_;
	// 					this.lineGraphResult = [];
	// 					this.lineGraphResult = res.line_graph_data;
	// 				}
	// 				setTimeout(() => {
	// 					this.hideLineGraph = false;
	// 					this.hideVerticalGraph = false;
	// 					this.view = [this.container.nativeElement.offsetWidth - 40, 500];
	// 				}, 10);
	// 			}
	// 			this.spinnerService.hide();
	// 		});
	// }

	// getAllCount(clientId) {
	// 	this.spinnerService.show();
	// 	this.dripAnalyaticsService.getAllCount(clientId).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.AllCount = [];
	// 			for (let count of res.data) {
	// 				this.AllCount.push(count);
	// 			}
	// 		}
	// 		this.spinnerService.hide();
	// 	});
	// }

	// getAllCampaign(clientId) {
	// 	this.spinnerService.show();
	// 	this.dripAnalyaticsService.getAllCampaign(clientId).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.AllCampaign = res.data;
	// 			if (this.AllCampaign.length > 0) {
	// 				for (let camp of this.AllCampaign) {
	// 					camp.titleWithId = camp.id + ' - ' + camp.title;
	// 				}
	// 			}
	// 			if (this.AllCampaign.length > 0) {
	// 				this.selectedCampaign = res.data[0].id;
	// 				this.selectedDripFlow(res.data[0]);
	// 			} else {
	// 				this.selectedCampaign = null;
	// 				this.learnerCount = 0;
	// 				this.dripCount = 0;
	// 				this.TotalDrip_Camps = 0;
	// 				this.AllCampaignDrip = [];
	// 				this.CampaignData = null;
	// 			}
	// 		}
	// 		this.isDataLoaded = true;
	// 		this.spinnerService.hide();
	// 	});
	// }

	// selectedDripFlow($event) {
	// 	this.spinnerService.show();
	// 	this.AllCampaignDrip = [];
	// 	this.CampaignData = null;
	// 	let payload = {
	// 		campaignId: [$event.id],
	// 	};
	// 	this.dripAnalyaticsService.getAllCampaignDripTitle(payload).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.spinnerService.hide();
	// 			this.learnerCount = res.data.totalLearnerCount;
	// 			// this.dripCount = res.data.length;
	// 			// this.TotalDrip_Camps = res.data;
	// 			// for (let item of res.data) {
	// 			// 	if (this.AllCampaignDrip.length < 4) {
	// 			// 		this.AllCampaignDrip.push(item);
	// 			// 	}
	// 			// }

	// 			// setTimeout(() => {
	// 			// 	this.viewHorizontalBar2 = [this.sub_container.nativeElement.offsetWidth - 100, 150];
	// 			// }, 200);
	// 			this.CampaignData = res.data.campaignDetails[0];
	// 			this.CampaignData.leranerGroupName = res.data.lernerGroupNames.join(', ');

	// 			let totalData = {
	// 				node_name: 'Total',
	// 				node_status: ' ',
	// 				node_send_date: ' ',
	// 				scheduled: 0,
	// 				sent: 0,
	// 				delivered: 0,
	// 				read_on_every_day_channel: 0,
	// 				read_rate_on_every_day_channel: null,
	// 				read_on_drip_app: 0,
	// 				read_rate_on_drip_app: null,
	// 				action_intent_displayed: 0,
	// 				action_taken: 0,
	// 				rate_action_taken: null,
	// 				average_action_score: null,
	// 				total_action_score: 0,
	// 				isTotal: true,
	// 			};

	// 			for (let data of res.data.campaignDripData) {
	// 				let payload = data;
	// 				payload.isTotal = false;

	// 				totalData.scheduled = totalData.scheduled + parseInt(data.scheduled);
	// 				totalData.sent = totalData.sent + parseInt(data.sent);
	// 				totalData.delivered = totalData.delivered + parseInt(data.delivered);
	// 				totalData.read_on_every_day_channel =
	// 					totalData.read_on_every_day_channel + parseInt(data.read_on_every_day_channel);
	// 				totalData.read_on_drip_app = totalData.read_on_drip_app + parseInt(data.read_on_drip_app);
	// 				totalData.action_intent_displayed =
	// 					totalData.action_intent_displayed + parseInt(data.action_intent_displayed);
	// 				totalData.action_taken = totalData.action_taken + parseInt(data.action_taken);
	// 				if (data.average_action_score) {
	// 					totalData.total_action_score = totalData.total_action_score + parseInt(data.average_action_score);
	// 				}
	// 				if (payload.read_rate_on_every_day_channel) {
	// 					payload.read_rate_on_every_day_channel = Number(parseInt(payload.read_rate_on_every_day_channel)).toFixed(
	// 						2
	// 					);
	// 				}

	// 				if (payload.read_rate_on_drip_app) {
	// 					payload.read_rate_on_drip_app = Number(parseInt(payload.read_rate_on_drip_app)).toFixed(2);
	// 				}

	// 				if (payload.rate_action_taken) {
	// 					payload.rate_action_taken = parseFloat(parseInt(payload.rate_action_taken).toFixed(2));
	// 				}
	// 				if (data.node_send_date) {
	// 					payload.node_send_date = moment(data.node_send_date).format('YYYY-MM-DD HH:mm:ss');
	// 				}
	// 				this.AllCampaignDrip.push(payload);
	// 			}
	// 			//Add empty object in the end of the array
	// 			//Calculate average_action_score
	// 			if (totalData.total_action_score > 0) {
	// 				totalData.average_action_score = (totalData.total_action_score / res.data.campaignDripData.length).toFixed(2);
	// 			}
	// 			this.AllCampaignDrip.push(totalData);
	// 			// this.AllCampaignDrip = res.data.campaignDripData;
	// 			// if (camp.campaign_status == 'Scheduled') {
	// 			// 	if (moment().isAfter(camp.campaign_start_date) && moment().isBefore(camp.campaign_end_date)) {
	// 			// 		camp.campaign_status = 'Running';
	// 			// 	} else if (moment().isAfter(camp.campaign_end_date)) {
	// 			// 		//For Loop For Check All Drip
	// 			// 		let flag = false;
	// 			// 		for (let drip of res.data) {
	// 			// 			if (drip.dripPost.status == 'PFA' || drip.dripPost.status == 'Scheduled') {
	// 			// 				flag = true;
	// 			// 			}
	// 			// 		}
	// 			// 		if (flag) {
	// 			// 			camp.status = 'Expired';
	// 			// 		} else {
	// 			// 			camp.status = 'Finished';
	// 			// 		}
	// 			// 	}
	// 			// }
	// 			// if (status == 'Draft' || status == 'Paused') {
	// 			// 	if (moment().isAfter(camp.campaign_end_date)) {
	// 			// 		camp.status = 'Expired';
	// 			// 	}
	// 			// }
	// 			if (this.CampaignData.campaign_start_date) {
	// 				this.CampaignData.campaign_start_date = moment(this.CampaignData.campaign_start_date)
	// 					.local()
	// 					.format('YYYY-MM-DD HH:mm:ss');
	// 			}
	// 			if (this.CampaignData.campaign_end_date) {
	// 				this.CampaignData.campaign_end_date = moment(this.CampaignData.campaign_end_date)
	// 					.local()
	// 					.format('YYYY-MM-DD HH:mm:ss');
	// 			}
	// 		}
	// 		this.isDataLoaded = true;
	// 		this.spinnerService.hide();
	// 	});
	// }

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
	// 	// this.getAllCount(this.selectedClientId);
	// 	this.getAllCampaign(this.selectedClientId);
	// 	this.getAllDripActivityForGraph(this.selectedClientId, 'All Graph');
	// 	// },200)
	// }

	// cancelshowResultPopUp() {
	// 	$('#showResultModel').modal('hide');
	// }

	// ShowPopup(data) {
	// 	this.selectedDripDetails = data.otherDetails;
	// 	this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			setTimeout(() => {
	// 				this.setQuestion(false);
	// 			}, 200);
	// 		}
	// 	});
	// }

	// ShowPopupForQuiz(data) {
	// 	console.log('---item---', data);
	// 	let payload = {
	// 		campaign_id: data.campaign_id,
	// 		drip_camp_id: data.drip_camp_id,
	// 		drip_camp_Index: data.drip_camp_index,
	// 		post_id: data.post_id,
	// 		type: data.template_type,
	// 	};
	// 	this.selectedDripDetails = payload;
	// 	console.log('---selectedDripDetails---', this.selectedDripDetails);
	// 	this.dripAnalyaticsService.getAllQuizDataForReport(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			// $("#showResultForQuizModel").modal('show');
	// 			// setTimeout(() => {
	// 			// 	this.showResultPopUp(false);
	// 			// 	setTimeout(() => {
	// 			// 		$('#showResultForQuizModel').modal('show');
	// 			// 	}, 200);
	// 			// }, 200);
	// 			let headers = [];
	// 			if (res.data.length > 0) {
	// 				headers = Object.keys(res.data[0]);
	// 			}
	// 			var option = {
	// 				fieldSeparator: ',',
	// 				quoteStrings: '"',
	// 				decimalseparator: '.',
	// 				showLabels: true,
	// 				showTitle: false,
	// 				title: `${data.template_type} Drip Report`,
	// 				useBom: false,
	// 				noDownload: false,
	// 				headers: headers,
	// 			};
	// 			const fileInfo = new ngxCsv(this.selectedDripAllData, `${data.template_type} Drip Report`, option);
	// 		}
	// 	});
	// }

	// getOfflineTask() {
	// 	this.dripAnalyaticsService
	// 		.getOfflineTaskAllDataFor(
	// 			{
	// 				details: this.selectedOfflineTaskDetails,
	// 				selectedQuestion: this.selectedQuestionText,
	// 				searchKey: this.offlineTaskSearchText,
	// 			},
	// 			this.limit,
	// 			this.page
	// 		)
	// 		.subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.allOfflineTaskData = [];
	// 				this.allOfflineTaskData = res.questionData;

	// 				// if (this.allOfflineTaskData && this.allOfflineTaskData.length > 0) {
	// 				let count = 1;
	// 				if (this.questionList.length == 0) {
	// 					for (let question of res.allQuestions) {
	// 						let payload = {
	// 							title: `Question ${count}: ${question.question} ${
	// 								question.allowFileTypes ? '(' + question.allowFileTypes + ')' : ''
	// 							}`,
	// 							question: question.question,
	// 							fileType: question.allowFileTypes,
	// 						};
	// 						this.questionList.push(payload);
	// 						count++;
	// 					}
	// 				}
	// 				if (this.selectedQuestionText == '' || this.selectedQuestionText == null) {
	// 					this.selectedQuestionText = this.questionList[0].question;
	// 					if (['Image', 'PDF'].indexOf(this.questionList[0].allowFileTypes) > -1) {
	// 						this.showDownloadButton = true;
	// 					} else {
	// 						this.showDownloadButton = false;
	// 					}
	// 				}
	// 				this.questionUploadedAsset = this.allOfflineTaskData;
	// 				this.gradedCount = res.gradeCount;
	// 				this.totalGradedableCount = res.totalGradedableCount;
	// 				this.totalCount = res.totalQuestionDataCount;
	// 				this.activeIndex = 0;
	// 				this.briefText = res.brief;
	// 				// } else {
	// 				// 	this.questionList = [];
	// 				// }
	// 			}
	// 			this.spinnerService.hide();
	// 		});
	// }

	// ShowPopupForViewuplaods(item, showPopup) {
	// 	this.spinnerService.show();
	// 	this.selectedOfflineTaskDetails = item.otherDetails;
	// 	if (showPopup) {
	// 		this.page = 1;
	// 		this.offlineTaskSearchText = '';
	// 		this.questionUploadedAsset = [];
	// 		this.gradedCount = 0;
	// 		this.totalGradedableCount = 0;
	// 		this.totalCount = 0;
	// 		this.activeIndex = 0;
	// 		this.briefText = '';
	// 		this.selectedQuestionText = '';
	// 		this.questionList = [];
	// 	}
	// 	this.getOfflineTask();
	// 	if (showPopup) {
	// 		$('#viewuploadsmodel').modal('show');
	// 	}
	// }

	// showResultPopUp(download) {
	// 	if (this.selectedDripAllData.length > 0) {
	// 		this.totalQuestionCount = this.selectedDripAllData[0].DripUserQuestions.length;
	// 		this.totalResponses = 0;

	// 		this.maxPossibleScore = this.totalQuestionCount * 2;
	// 		this.avaregeScore = 0;
	// 		this.topScore = 0;
	// 		let forAvrageScore = [];
	// 		this.seeResultData = [];

	// 		for (let userDrip of this.selectedDripAllData) {
	// 			let data = { fullName: '', accountId: '', total: 0, questions: [], PostId: null, CampaignId: null };
	// 			data.fullName = userDrip && userDrip.User && userDrip.User.fullName ? userDrip.User.fullName : '';
	// 			data.total = 0;
	// 			data.accountId = userDrip && userDrip.User && userDrip.User.account_id ? userDrip.User.account_id : '';
	// 			data.PostId = userDrip.PostId;
	// 			data.CampaignId = userDrip.CampaignId;
	// 			let question = [];
	// 			let response = false;

	// 			question = userDrip.DripUserQuestions.sort((a, b) => {
	// 				if (a.id < b.id) {
	// 					return -1;
	// 				}
	// 			});

	// 			for (let que of question) {
	// 				if (que.questionType == 'MCQ') {
	// 					let currectAnswer = [];
	// 					let userAnswer = [];
	// 					let count = 1;
	// 					let options = [];

	// 					options = que.DripUserOptions.sort((a, b) => {
	// 						if (a.id < b.id) {
	// 							return -1;
	// 						}
	// 					});

	// 					for (let option of options) {
	// 						if (option.correctAns) {
	// 							currectAnswer.push(count);
	// 						}
	// 						if (option.selectedAns) {
	// 							response = true;
	// 							userAnswer.push(count);
	// 						}
	// 						count++;
	// 					}
	// 					let correctAns = false;
	// 					let wrongAns = false;

	// 					if (currectAnswer.length >= userAnswer.length) {
	// 						for (let currect of currectAnswer) {
	// 							if (userAnswer.indexOf(currect) > -1) {
	// 								correctAns = true;
	// 							} else {
	// 								wrongAns = true;
	// 							}
	// 						}
	// 					} else if (currectAnswer.length > userAnswer.length) {
	// 						for (let userAns of userAnswer) {
	// 							if (currectAnswer.indexOf(userAns) > -1) {
	// 								correctAns = true;
	// 							} else {
	// 								wrongAns = true;
	// 							}
	// 						}
	// 					}

	// 					let mark = 0;
	// 					if (correctAns && wrongAns && userDrip.submit) {
	// 						mark = 1;
	// 						data.total = data.total + 1;
	// 					} else if (correctAns && !wrongAns && userDrip.submit) {
	// 						mark = 2;
	// 						data.total = data.total + 2;
	// 					}
	// 					if (userDrip.submit) {
	// 						forAvrageScore.push(mark);
	// 						data.questions.push({ question: que.question, mark: mark, userAnswer: userAnswer });
	// 					} else {
	// 						data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 					}
	// 				} else if (que.questionType == 'Drag and Drop') {
	// 					let isCorrectAnswer = true;
	// 					if (que.DripUserOptions && que.DripUserOptions[0].userSeq) {
	// 						response = true;
	// 						for (let option of que.DripUserOptions) {
	// 							if (option.sr_no != option.userSeq) {
	// 								isCorrectAnswer = false;
	// 							}
	// 						}

	// 						let userAnswer = [];

	// 						let userSequency = que.DripUserOptions.sort((a, b) => {
	// 							if (a.userSeq < b.userSeq) {
	// 								return -1;
	// 							}
	// 						});

	// 						for (let i = 0; i < userSequency.length; i++) {
	// 							userAnswer.push(userSequency[i].sr_no);
	// 						}
	// 						if (isCorrectAnswer) {
	// 							if (userDrip.submit) {
	// 								forAvrageScore.push(2);
	// 								data.questions.push({ question: que.question, mark: 2, userAnswer: userAnswer });
	// 								data.total = data.total + 2;
	// 							} else {
	// 								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 							}
	// 						} else {
	// 							if (userDrip.submit) {
	// 								forAvrageScore.push(0);
	// 								data.questions.push({ question: que.question, mark: 0, userAnswer: userAnswer });
	// 							} else {
	// 								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 							}
	// 						}
	// 					} else {
	// 						if (userDrip.submit) {
	// 							forAvrageScore.push(0);
	// 							data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 						} else {
	// 							data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 						}
	// 					}
	// 				}
	// 			}

	// 			if (response) {
	// 				this.totalResponses++;
	// 			}
	// 			this.seeResultData.push(data);
	// 		}

	// 		this.seeResultData = this.seeResultData.sort((a, b) => {
	// 			if (a.total > b.total) {
	// 				return -1;
	// 			}
	// 		});
	// 		let total = 0;
	// 		for (let mark of forAvrageScore) {
	// 			total = total + mark;
	// 		}
	// 		this.avaregeScore = (total / this.selectedDripAllData.length).toFixed(2);
	// 		this.topScore = this.seeResultData[0].total;
	// 	}
	// 	let rank = 0;
	// 	let accountId = [];
	// 	for (let i = 0; i < this.seeResultData.length; i++) {
	// 		if (i == 0) {
	// 			rank++;
	// 			this.seeResultData[i].rank = rank;
	// 		} else if (this.seeResultData[i - 1].total != this.seeResultData[i].total) {
	// 			rank++;
	// 			this.seeResultData[i].rank = rank;
	// 		} else {
	// 			this.seeResultData[i].rank = rank;
	// 		}
	// 		if (i < this.maxLearnerCountForShowResult) accountId.push(this.seeResultData[i].accountId);
	// 	}
	// 	this.toppers = [];
	// 	this.toppers = this.seeResultData;

	// 	if (download) {
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		let finalData = [];
	// 		let headers = [];
	// 		if (this.seeResultData && this.seeResultData.length > 0) {
	// 			let srNo = 1;
	// 			for (let item of this.seeResultData) {
	// 				let payload = {
	// 					'SR NO': srNo,
	// 					'LEARNER ID': item.accountId,
	// 					'DRIP ID': item.PostId,
	// 					'DRIP FLOW ID': item.CampaignId,
	// 					// 'FULL NAME': item.fullName,
	// 				};
	// 				let count = 1;
	// 				for (let question of item.questions) {
	// 					payload[`QUESTION ${count} - ${question.question}`.replaceAll(',', ' ')] = question.userAnswer.toString();
	// 					payload[`Q ${count} SCORE`] = question.mark;
	// 					count++;
	// 				}
	// 				payload['MAXIMUM POSSIBLE SCORE'] = item.questions.length * 2;
	// 				payload['TOTAL SCORE'] = item.total;
	// 				finalData.push(payload);
	// 				srNo++;
	// 			}
	// 		}

	// 		for (let key in finalData[0]) {
	// 			headers.push(key);
	// 		}

	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: true,
	// 			showTitle: false,
	// 			title: 'Quiz (Randomised) Drip Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: headers,
	// 		};
	// 		const fileInfo = new ngxCsv(finalData, 'Quiz (Randomised) Drip Report', option);
	// 	} else if (this.toppers.length > this.maxLearnerCountForShowResult) {
	// 		this.toppers.splice(this.maxLearnerCountForShowResult, this.toppers.length - this.maxLearnerCountForShowResult);
	// 	}
	// 	if (accountId.length > 0 && this.toppers.length > 0 && this.toppers.length === accountId.length) {
	// 		this.dripAnalyaticsService.getTopperUserData({ userIds: accountId }).subscribe((res: any) => {
	// 			if (res.success) {
	// 				let data = res.data;
	// 				for (let value of this.toppers) {
	// 					for (let user of data) {
	// 						if (user.account_id === value.accountId) {
	// 							value.fullName = user.fullName;
	// 							break;
	// 						}
	// 					}
	// 				}
	// 				this.spinnerService.hide();
	// 			}
	// 		});
	// 	}
	// }

	// showResultQuizRandomPopUp(download) {
	// 	if (this.selectedDripAllData.length > 0) {
	// 		this.totalQuestionCount = this.selectedDripAllData[0].DripUserQuestions.length;
	// 		this.totalResponses = 0;

	// 		this.maxPossibleScore = this.totalQuestionCount * 2;
	// 		this.avaregeScore = 0;
	// 		this.topScore = 0;
	// 		let forAvrageScore = [];
	// 		this.seeResultData = [];

	// 		for (let userDrip of this.selectedDripAllData) {
	// 			if (userDrip && userDrip.submit) {
	// 				let data = { fullName: '', accountId: '', total: 0, questions: [], PostId: null, CampaignId: null };
	// 				data.fullName = userDrip && userDrip.User && userDrip.User.fullName ? userDrip.User.fullName : '';
	// 				data.total = 0;
	// 				data.accountId = userDrip && userDrip.User && userDrip.User.account_id ? userDrip.User.account_id : '';
	// 				data.PostId = userDrip.PostId;
	// 				data.CampaignId = userDrip.CampaignId;
	// 				let question = [];
	// 				let response = false;

	// 				question = userDrip.DripUserQuestions.sort((a, b) => {
	// 					if (a.id < b.id) {
	// 						return -1;
	// 					}
	// 				});

	// 				for (let que of question) {
	// 					if (que.questionType == 'MCQ') {
	// 						let currectAnswer = [];
	// 						let userAnswer = [];
	// 						let count = 1;
	// 						let options = [];

	// 						options = que.DripUserOptions.sort((a, b) => {
	// 							if (a.id < b.id) {
	// 								return -1;
	// 							}
	// 						});

	// 						for (let option of options) {
	// 							if (option.correctAns) {
	// 								currectAnswer.push(option.sr_no);
	// 							}
	// 							if (option.selectedAns) {
	// 								response = true;
	// 								userAnswer.push(option.sr_no);
	// 							}
	// 							count++;
	// 						}
	// 						let correctAns = false;
	// 						let wrongAns = false;

	// 						if (currectAnswer.length >= userAnswer.length) {
	// 							for (let currect of currectAnswer) {
	// 								if (userAnswer.indexOf(currect) > -1) {
	// 									correctAns = true;
	// 								} else {
	// 									wrongAns = true;
	// 								}
	// 							}
	// 						} else if (currectAnswer.length > userAnswer.length) {
	// 							for (let userAns of userAnswer) {
	// 								if (currectAnswer.indexOf(userAns) > -1) {
	// 									correctAns = true;
	// 								} else {
	// 									wrongAns = true;
	// 								}
	// 							}
	// 						}

	// 						let mark = 0;
	// 						if (correctAns && wrongAns && userDrip.submit) {
	// 							mark = 1;
	// 							data.total = data.total + 1;
	// 						} else if (correctAns && !wrongAns && userDrip.submit) {
	// 							mark = 2;
	// 							data.total = data.total + 2;
	// 						}
	// 						if (userDrip.submit) {
	// 							forAvrageScore.push(mark);
	// 							data.questions.push({ question: que.question, mark: mark, userAnswer: userAnswer });
	// 						} else {
	// 							data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 						}
	// 					} else if (que.questionType == 'Drag and Drop') {
	// 						let isCorrectAnswer = true;
	// 						if (que.DripUserOptions && que.DripUserOptions[0].userSeq) {
	// 							response = true;
	// 							for (let option of que.DripUserOptions) {
	// 								if (option.sr_no != option.userSeq) {
	// 									isCorrectAnswer = false;
	// 								}
	// 							}

	// 							let userAnswer = [];

	// 							let userSequency = que.DripUserOptions.sort((a, b) => {
	// 								if (a.userSeq < b.userSeq) {
	// 									return -1;
	// 								}
	// 							});

	// 							for (let i = 0; i < userSequency.length; i++) {
	// 								userAnswer.push(userSequency[i].sr_no);
	// 							}
	// 							if (isCorrectAnswer) {
	// 								if (userDrip.submit) {
	// 									forAvrageScore.push(2);
	// 									data.questions.push({ question: que.question, mark: 2, userAnswer: userAnswer });
	// 									data.total = data.total + 2;
	// 								} else {
	// 									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 								}
	// 							} else {
	// 								if (userDrip.submit) {
	// 									forAvrageScore.push(0);
	// 									data.questions.push({ question: que.question, mark: 0, userAnswer: userAnswer });
	// 								} else {
	// 									data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 								}
	// 							}
	// 						} else {
	// 							if (userDrip.submit) {
	// 								forAvrageScore.push(0);
	// 								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 							} else {
	// 								data.questions.push({ question: que.question, mark: 0, userAnswer: [] });
	// 							}
	// 						}
	// 					}
	// 				}

	// 				if (response) {
	// 					this.totalResponses++;
	// 				}

	// 				//////////////////////////
	// 				this.seeResultData.push(data);
	// 			}
	// 		}

	// 		this.seeResultData = this.seeResultData.sort((a, b) => {
	// 			if (a.total > b.total) {
	// 				return -1;
	// 			}
	// 		});
	// 		let total = 0;
	// 		for (let mark of forAvrageScore) {
	// 			total = total + mark;
	// 		}
	// 		this.avaregeScore = (total / this.selectedDripAllData.length).toFixed(2);
	// 		this.topScore = this.seeResultData[0].total;
	// 	}
	// 	let rank = 0;
	// 	for (let i = 0; i < this.seeResultData.length; i++) {
	// 		if (i == 0) {
	// 			rank++;
	// 			this.seeResultData[i].rank = rank;
	// 		} else if (this.seeResultData[i - 1].total != this.seeResultData[i].total) {
	// 			rank++;
	// 			this.seeResultData[i].rank = rank;
	// 		} else {
	// 			this.seeResultData[i].rank = rank;
	// 		}
	// 	}
	// 	this.toppers = [];
	// 	this.toppers = this.seeResultData;

	// 	if (download) {
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		let finalData = [];
	// 		let headers = [];
	// 		if (this.seeResultData && this.seeResultData.length > 0) {
	// 			let srNo = 1;
	// 			for (let item of this.seeResultData) {
	// 				let payload = {
	// 					'SR NO': srNo,
	// 					'LEARNER ID': item.accountId,
	// 					'DRIP ID': item.PostId,
	// 					'DRIP FLOW ID': item.CampaignId,
	// 					// 'FULL NAME': item.fullName,
	// 				};
	// 				let count = 1;
	// 				for (let question of item.questions) {
	// 					payload[`Q ${count}`] = question.question.replaceAll(',', ' ');
	// 					payload[`Q ${count} SELECTED ANSWER`] = question.userAnswer.toString();
	// 					payload[`Q ${count} SCORE`] = question.mark;
	// 					count++;
	// 				}
	// 				payload['MAXIMUM POSSIBLE SCORE'] = item.questions.length * 2;
	// 				payload['TOTAL SCORE'] = item.total;
	// 				finalData.push(payload);
	// 				srNo++;
	// 			}
	// 		}

	// 		for (let key in finalData[0]) {
	// 			headers.push(key);
	// 		}

	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: true,
	// 			showTitle: false,
	// 			title: 'Quiz (Randomised) Drip Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: headers,
	// 		};
	// 		const fileInfo = new ngxCsv(finalData, 'Quiz (Randomised) Drip Report', option);
	// 	}
	// 	if (this.toppers.length > this.maxLearnerCountForShowResult) {
	// 		this.toppers.splice(this.maxLearnerCountForShowResult, this.toppers.length - this.maxLearnerCountForShowResult);
	// 	}
	// }

	// setQuestion(download) {
	// 	this.allQuestion = [];
	// 	for (let question of this.selectedDripAllData[0].DripUserQuestions) {
	// 		let options = [];
	// 		for (let option of question.DripUserOptions) {
	// 			options.push({ name: option.text, value: 0 });
	// 		}
	// 		this.allQuestion.push({ question: question.question, type: question.questionType, options: options });
	// 	}

	// 	for (let data of this.selectedDripAllData) {
	// 		for (let question of data.DripUserQuestions) {
	// 			for (let option of question.DripUserOptions) {
	// 				if (option.selectedAns) {
	// 					for (let qua of this.allQuestion) {
	// 						if (qua.question == question.question) {
	// 							for (let opt of qua.options) {
	// 								if (opt.name == option.text && data.submit) {
	// 									opt.value++;
	// 								}
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// 	if (download) {
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		let finalData = [];
	// 		let count = 1;
	// 		for (let data of this.selectedDripAllData) {
	// 			let payload = {
	// 				'SR NO': count,
	// 				'LEARNER ID': data.User.account_id,
	// 				'DRIP ID': data.PostId,
	// 				'DRIP FLOW ID': data.CampaignId,
	// 			};
	// 			payload[`Question 1 - ${data.DripUserQuestions[0].question}`.replaceAll(',', ' ')] = '';
	// 			if (data.submit) {
	// 				for (let option of data.DripUserQuestions[0].DripUserOptions) {
	// 					if (option.selectedAns) {
	// 						payload[`Question 1 - ${data.DripUserQuestions[0].question}`.replaceAll(',', ' ')] = data.submit
	// 							? option.text
	// 							: '';
	// 					}
	// 				}
	// 			}
	// 			finalData.push(payload);
	// 		}
	// 		let keyList = [];
	// 		for (let key in finalData[0]) {
	// 			keyList.push(key);
	// 		}
	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: false,
	// 			showTitle: false,
	// 			title: 'Poll Drip Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: [keyList],
	// 		};
	// 		const fileInfo = new ngxCsv(finalData, 'Poll Drip Report', option);
	// 	} else {
	// 		$('#showResultModel').modal('show');
	// 	}
	// }

	// refreshShowResult() {
	// 	this.spinnerService.show();
	// 	if (this.selectedDripDetails.type == 'Poll') {
	// 		this.dripAnalyaticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				this.allQuestion = [];
	// 				this.allQuestion.push({ question: res.question });
	// 				this.spinnerService.hide();
	// 				// setTimeout(() => {
	// 				// 	$('#showResultModel').modal('show');
	// 				// }, 200);
	// 			}
	// 		});
	// 	} else {
	// 		this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				setTimeout(() => {
	// 					this.setQuestion(false);
	// 				}, 200);
	// 				this.spinnerService.hide();
	// 			}
	// 		});
	// 	}
	// }

	// refreshSeeResult() {
	// 	this.spinnerService.show();
	// 	this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			setTimeout(() => {
	// 				this.showResultPopUp(false);
	// 				setTimeout(() => {
	// 					$('#showResultForQuizModel').modal('show');
	// 				}, 200);
	// 			}, 200);
	// 			this.spinnerService.hide();
	// 		}
	// 	});
	// }

	// onSelect(data): void {
	// 	// console.log('Item clicked', JSON.parse(JSON.stringify(data)));
	// }

	// onActivate(data): void {
	// 	// console.log('Activate', JSON.parse(JSON.stringify(data)));
	// }

	// onDeactivate(data): void {
	// 	// console.log('Deactivate', JSON.parse(JSON.stringify(data)));
	// }

	// downloadQuizDripReport(data) {
	// 	console.log('---item---', data);
	// 	this.selectedDripDetails = data.otherDetails;
	// 	// this.toastr.success(
	// 	// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 	// 	this.appService.getTranslation('Utils.success')
	// 	// );
	// 	this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			// $("#showResultForQuizModel").modal('show');
	// 			setTimeout(() => {
	// 				this.showResultPopUp(true);
	// 			}, 200);
	// 		}
	// 	});
	// }

	// downloadQuizRandamDripReport(data) {
	// 	console.log('---item---', data);
	// 	this.selectedDripDetails = data.otherDetails;
	// 	// this.toastr.success(
	// 	// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 	// 	this.appService.getTranslation('Utils.success')
	// 	// );
	// 	this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			// $("#showResultForQuizModel").modal('show');
	// 			setTimeout(() => {
	// 				this.showResultQuizRandomPopUp(true);
	// 			}, 200);
	// 		}
	// 	});
	// }
	// seeResult(data) {}

	// createSurveyReport() {
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
	// 		let header = [];
	// 		for (let key in this.selectedDripAllData[0]) {
	// 			header.push(key);
	// 		}
	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: false,
	// 			showTitle: false,
	// 			title: 'Surey Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: header,
	// 		};
	// 		const fileInfo = new ngxCsv(this.selectedDripAllData, 'Surey Report', option);
	// 	}
	// }

	// downloadSurveyUploadedFiles() {
	// 	//Nedd To Checg the Code
	// 	let finalData = [];
	// 	for (let learnerData of this.selectedDripAllData) {
	// 		if (learnerData.submit) {
	// 			let questionCount = 0;
	// 			for (let question of learnerData.DripUserQuestions) {
	// 				questionCount++;
	// 				if (question.questionType === 'File upload') {
	// 					if (question && question.UserBriefFiles && question.UserBriefFiles.length > 0) {
	// 						let count = 0;
	// 						for (let file of question.UserBriefFiles) {
	// 							let payload = {};
	// 							count++;
	// 							let fileType = file.path.split('.');
	// 							payload['path'] = file.path;
	// 							payload['fileName'] = `${learnerData.User.fullName}_Qno_${questionCount}_${count}.${
	// 								fileType[fileType.length - 1]
	// 							}`;
	// 							finalData.push(payload);
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}

	// 	if (finalData.length > 0) {
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		this.dripAnalyaticsService
	// 			.downloadLearnerUploadedFileInZipFormat(finalData, this.selectedDripDetails.campaign_id)
	// 			.toPromise()
	// 			.then(
	// 				(res: any) => {
	// 					let link = document.createElement('a');
	// 					link.href = window.URL.createObjectURL(res);

	// 					link.download = 'Survey_uploaded_files.zip';
	// 					link.click();
	// 					// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
	// 				},
	// 				(failed) => {
	// 					console.log('Rejected', failed);
	// 					this.spinnerService.hide();
	// 				}
	// 			)
	// 			.catch((err) => {
	// 				console.log('Caught error', err);
	// 				this.spinnerService.hide();
	// 			});
	// 	}
	// }

	// downloadPollDripReport(data) {
	// 	this.selectedDripDetails = data.otherDetails;

	// 	this.dripAnalyaticsService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.selectedDripAllData = [];
	// 			this.selectedDripAllData = res.data;
	// 			// $("#showResultForQuizModel").modal('show');
	// 			setTimeout(() => {
	// 				this.setQuestion(true);
	// 			}, 200);
	// 		}
	// 	});
	// }
	//Download Report
	// downloadReport() {
	// 	let payload = {
	// 		startDate: this.selectedDate.startDate,
	// 		endDate: this.selectedDate.endDate,
	// 		clientId: this.selectedClientId,
	// 	};
	// 	if (
	// 		(this.selectedDate.startDate == null ||
	// 			this.selectedDate.endDate == null ||
	// 			this.selectedDate.startDate == undefined ||
	// 			this.selectedDate.endDate == undefined) &&
	// 		this.selectedReportName != 3
	// 	) {
	// 		this.isdateRangeSelected = true;
	// 		return;
	// 	}
	// 	if (this.selectedReportName == 5) {
	// 		if (!this.selectedDripType) {
	// 			//Need to Add Toster Message
	// 			return;
	// 		}
	// 	}
	// 	if (this.selectedReportName == 1) {
	// 		//For WhatsAPP Delivery Report

	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		this.dripAnalyaticsService.getWhatsAppReport(payload).subscribe((res: any) => {
	// 			if (res.success) {
	// 				let finalData = [];
	// 				if (res.data && res.data.length > 0) {
	// 					let count = 0;
	// 					for (let item of res.data) {
	// 						let templateId;
	// 						let category;
	// 						count++;
	// 						if (item.Post && item.Post.Drip_whatsapp_natives && item.Post.Drip_whatsapp_natives.length > 0) {
	// 							templateId = item.Post.Drip_whatsapp_natives[0].templateId;
	// 							category = item.Post.Drip_whatsapp_natives[0].tempCategory;
	// 						} else if (
	// 							item.Post &&
	// 							item.Post.Drip_whatsapp_non_natives &&
	// 							item.Post.Drip_whatsapp_non_natives.length > 0
	// 						) {
	// 							templateId = item.Post.Drip_whatsapp_non_natives[0].templateId;
	// 							category = item.Post.Drip_whatsapp_non_natives[0].tempCategory;
	// 						}

	// 						let payload = {
	// 							'SR NO': count,
	// 							'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
	// 							TAGS: item.User && item.User.tags ? item.User.tags : '',
	// 							'JOB ROLE':
	// 								item.User && item.User.Client_job_roles && item.User.Client_job_roles.length > 0
	// 									? item.User.Client_job_roles[0].job_role_name
	// 									: '',
	// 							'DRIP ID': item.PostId,
	// 							'DRIP FLOW ID': item.CampaignId,
	// 							'BRANCH ID':
	// 								item.User && item.User.Clients && item.User.Clients.length > 0 ? item.User.Clients[0].client_id : '',
	// 							'WHATSAPP TEMPLATE ID': templateId ? templateId : '',
	// 							CATEGORY: category ? category : '',
	// 							'PRICING CATEGORY': category ? category : '',
	// 							'MESSAGE ID': item.WAppTriggerId ? item.WAppTriggerId : '',
	// 							'SYSTEM TRIGGER TIME': item.WTriggerTime
	// 								? ' ' + moment(item.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'MESSAGE TYPE': 'Template',
	// 							STATUS: item.status ? item.status : '',
	// 							'CAUSE (ERROR DESCRIPTION)': item.cause ? item.cause : '',
	// 							'NOTIFICATION SENT DATE & TIME': item.sentDate
	// 								? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',

	// 							'NOTIFICATION DELIVERED DATE & TIME': item.deliveryDate
	// 								? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'NOTIFICATION READ DATE & TIME': item.readDate
	// 								? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'NOTIFICATION FAILED DATE & TIME': item.failDate
	// 								? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'CLICKED EXTERNAL LINK': item.clickExternalLink ? 'YES' : 'NO',
	// 							'LINK CLICK DATE & TIME': item.clickExternalLinkDate
	// 								? ' ' + moment(item.clickExternalLinkDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'ERROR DESCRIPTION': item.errorMessage ? item.errorMessage : '',
	// 						};
	// 						finalData.push(payload);
	// 					}
	// 				}

	// 				var option = {
	// 					fieldSeparator: ',',
	// 					quoteStrings: '"',
	// 					decimalseparator: '.',
	// 					showLabels: false,
	// 					showTitle: false,
	// 					title: 'WhatsApp Delivery Report',
	// 					useBom: false,
	// 					noDownload: false,
	// 					headers: [
	// 						'SR NO',
	// 						'CONTACT ID',
	// 						'TAGS',
	// 						'JOB ROLE',
	// 						'DRIP ID',
	// 						'DRIP FLOW ID',
	// 						'BRANCH ID',
	// 						'WHATSAPP TEMPLATE ID',
	// 						'CATEGORY',
	// 						'PRICING CATEGORY',
	// 						'MESSAGE ID',
	// 						'SYSTEM TRIGGER TIME',
	// 						'MESSAGE TYPE',
	// 						'STATUS',
	// 						'CAUSE (ERROR DESCRIPTION)',
	// 						'NOTIFICATION SENT DATE & TIME',
	// 						'NOTIFICATION DELIVERED DATE & TIME',
	// 						'NOTIFICATION READ DATE & TIME',
	// 						'NOTIFICATION FAILED DATE & TIME',
	// 						'CLICKED EXTERNAL LINK',
	// 						'LINK CLICK DATE & TIME',
	// 						'ERROR DESCRIPTION',
	// 					],
	// 				};
	// 				this.appService.checkNotifcation = true;
	// 				const fileInfo = new ngxCsv(finalData, 'Whats App Delivery Report', option);
	// 			}
	// 		});
	// 	} else if (this.selectedReportName == 2) {
	// 		//For Email Delivery Report
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		this.dripAnalyaticsService.getEmailReport(payload).subscribe((res: any) => {
	// 			if (res.success) {
	// 				let finalData = [];
	// 				if (res.data && res.data.length > 0) {
	// 					let count = 0;
	// 					for (let item of res.data) {
	// 						count++;

	// 						let payload = {
	// 							'SR NO': count,
	// 							'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
	// 							'DRIP ID': item.PostId,
	// 							'DRIP FLOW ID': item.CampaignId,
	// 							SUBJECT: item.Post.Drip_email_non_natives ? item.Post.Drip_email_non_natives[0].email_subject_line : '',
	// 							'TEMPLATE ID': item.templateId ? item.templateId : '',
	// 							'TEMPLATE NAME': item.templateName ? item.templateName : '',
	// 							'MESSAGE ID': item.mailMessageId ? item.mailMessageId : '',
	// 							STATUS: item.status ? item.status : '',
	// 							'EMAIL SENT DATE & TIME': item.sentDate
	// 								? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'EMAIL DELIVERED DATE & TIME': item.deliveryDate
	// 								? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',

	// 							'EMAIL READ DATE & TIME': item.readDate
	// 								? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'EMAIL CLICKED DATE & TIME': item.clickDate
	// 								? ' ' + moment(item.clickDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'EMAIL FAILED DATE & TIME': item.failDate
	// 								? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'ERROR DESCRIPTION': item.errorMessage ? item.errorMessage : '',
	// 						};
	// 						if (item.status == 'Click') {
	// 							payload.STATUS = 'Clicked';
	// 						} else if (item.status == 'Open') {
	// 							payload.STATUS = 'Read';
	// 						}
	// 						finalData.push(payload);
	// 					}
	// 				}

	// 				var option = {
	// 					fieldSeparator: ',',
	// 					quoteStrings: '"',
	// 					decimalseparator: '.',
	// 					showLabels: false,
	// 					showTitle: false,
	// 					title: 'Email Delivery Report',
	// 					useBom: false,
	// 					noDownload: false,
	// 					headers: [
	// 						'SR NO',
	// 						'CONTACT ID',
	// 						'DRIP ID',
	// 						'DRIP FLOW ID',
	// 						'SUBJECT',
	// 						'TEMPLATE ID',
	// 						'TEMPLATE NAME',
	// 						'MESSAGE ID',
	// 						'STATUS',
	// 						'EMAIL SENT DATE & TIME',
	// 						'EMAIL DELIVERED DATE & TIME',
	// 						'EMAIL READ DATE & TIME',
	// 						'EMAIL CLICKED DATE & TIME',
	// 						'EMAIL FAILED DATE & TIME',
	// 						'ERROR DESCRIPTION',
	// 					],
	// 				};
	// 				this.appService.checkNotifcation = true;
	// 				const fileInfo = new ngxCsv(finalData, 'Email Delivery Report', option);
	// 			}
	// 		});
	// 	} else if (this.selectedReportName == 3) {
	// 		//For Whats App OPT-IN Report
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		this.dripAnalyaticsService.getWhatsAppOPTINReport(payload).subscribe((res: any) => {
	// 			if (res.success) {
	// 				let finalData = [];
	// 				if (res.data && res.data.length > 0) {
	// 					let count = 0;
	// 					for (let item of res.data) {
	// 						count++;
	// 						let status = '';
	// 						if (item.User && item.User.opt_in) {
	// 							status = 'Opted In';
	// 						} else if (item.User && item.User.opt_out) {
	// 							status = 'Opted Out';
	// 						} else if (item.haveWhatsAppOptIn) {
	// 							status = 'Pending';
	// 						} else {
	// 							status = 'NA';
	// 						}

	// 						let payload = {
	// 							'SR NO': count,
	// 							'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
	// 							'LEARNER CREATION DATE': item.User.createdAt
	// 								? ' ' + moment(item.User.createdAt).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'OPT-IN SENT TO WHATSAPP': item.User.otp_update_at
	// 								? ' ' + moment(item.User.otp_update_at).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'OPT-IN SENT DATE & TIME': item.User.otp_update_at
	// 								? ' ' + moment(item.User.otp_update_at).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'OPT-IN STATUS': status,
	// 							'ERROR FROM META': item.User && item.User.optError ? item.User.optError : '',
	// 						};
	// 						finalData.push(payload);
	// 					}
	// 				}

	// 				var option = {
	// 					fieldSeparator: ',',
	// 					quoteStrings: '"',
	// 					decimalseparator: '.',
	// 					showLabels: false,
	// 					showTitle: false,
	// 					title: 'WhatsApp opt-in Report',
	// 					useBom: false,
	// 					noDownload: false,
	// 					headers: [
	// 						'SR NO',
	// 						'CONTACT ID',
	// 						'LEARNER CREATION DATE',
	// 						'OPT-IN SENT TO WHATSAPP',
	// 						'OPT-IN SENT DATE & TIME',
	// 						'OPT-IN STATUS',
	// 						'ERROR FROM META',
	// 					],
	// 				};
	// 				this.appService.checkNotifcation = true;
	// 				const fileInfo = new ngxCsv(finalData, 'WhatsApp opt-in Report', option);
	// 			}
	// 		});
	// 	} else if (this.selectedReportName === 4) {
	// 		this.toastr.success(
	// 			this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 			this.appService.getTranslation('Utils.success')
	// 		);
	// 		this.dripAnalyaticsService.getBotMessageReport(payload).subscribe((res: any) => {
	// 			if (res.success) {
	// 				let finalData = [];
	// 				if (res.data && res.data.length > 0) {
	// 					let count = 0;
	// 					for (let item of res.data) {
	// 						let payload = {
	// 							'Sr No': count,
	// 							'CONTACT ID': item.User && item.User.account_id ? item.User.account_id : '',
	// 							'Message Type': item.msgType,
	// 							'Message ID': item.messageId ? item.messageId : '',
	// 							Time: item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
	// 							Message: item.data ? item.data : '',
	// 							Url: item.url ? item.url : '',
	// 							Type: item.type,
	// 							'Drip ID': item.Post && item.Post.id ? item.Post.id : '',
	// 							'Drip Title': item.Post && item.Post.drip_title ? item.Post.drip_title : '',
	// 							Status: item.status ? item.status : '',
	// 							Cause: item.cause ? item.cause : '',
	// 							'Delivery Code': item.deliveryCode ? item.deliveryCode : '',
	// 							Channel: item.channel ? item.channel : '',
	// 							'Sent Date': item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
	// 							'Delivery Date': item.deliveryDate
	// 								? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'Read Date': item.readDate ? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
	// 							'Fail Date': item.failDate ? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
	// 							'Error Message': item.errorMessage ? item.errorMessage : '',
	// 						};
	// 						finalData.push(payload);
	// 						count++;
	// 					}
	// 				}

	// 				var option = {
	// 					fieldSeparator: ',',
	// 					quoteStrings: '"',
	// 					decimalseparator: '.',
	// 					showLabels: false,
	// 					showTitle: false,
	// 					title: 'Incoming Messages Report',
	// 					useBom: false,
	// 					noDownload: false,
	// 					headers: [
	// 						'Sr No',
	// 						'CONTACT ID',
	// 						'Message Type',
	// 						'Message ID',
	// 						'Time',
	// 						'Message',
	// 						'Url',
	// 						'Type',
	// 						'Drip ID',
	// 						'Drip Title',
	// 						'Status',
	// 						'Cause',
	// 						'Delivery Code',
	// 						'Channel',
	// 						'Sent Date',
	// 						'Delivery Date',
	// 						'Read Date',
	// 						'Fail Date',
	// 						'Error Message',
	// 					],
	// 				};
	// 				this.appService.checkNotifcation = true;
	// 				const fileInfo = new ngxCsv(finalData, 'Incoming Messages Report', option);
	// 			}
	// 		});
	// 	} else if (this.selectedReportName == 5) {
	// 		if (this.selectedDripType == 1) {
	// 			//For Only WhatsApp getOnlyWhatsAppReport
	// 			this.toastr.success(
	// 				this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 				this.appService.getTranslation('Utils.success')
	// 			);
	// 			this.dripAnalyaticsService.getOnlyWhatsAppReport(payload).subscribe((res: any) => {
	// 				if (res.success) {
	// 					let finalData = [];
	// 					let headers = [
	// 						'SR NO',
	// 						'DRIP ID',
	// 						'DRIP NAME',
	// 						'DRIP STATUS',
	// 						'WHATSAPP TEMPLATE STATUS',
	// 						'DRIP CREATED BY',
	// 						'DRIP CREATED DATE',
	// 						'DRIP FLOW ID',
	// 						'DRIP FLOW NAME',
	// 						'DRIP FLOW CREATED BY',
	// 						'DRIP FLOW CREATED DATE',
	// 						'CONTACTS TARGETED IN DRIP FLOW',
	// 						'DRIP FLOW STATUS',
	// 						'TOTAL DRIPS SCHEDULED',
	// 						'TOTAL DRIPS SENT',
	// 						'TOTAL DRIPS DELIVERED',
	// 						'TOTAL DRIPS READ ON WHATSAPP',
	// 						'TOTAL DRIPS ENGAGED',
	// 						// 'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
	// 						'TOTAL LINK CLICKS ON WHATSAPP',
	// 						// 'DRIP AVARAGE ACTION SCORE',
	// 					];

	// 					if (res.data && res.data.length > 0) {
	// 						headers = [];
	// 						for (let key in res.data[0]) {
	// 							headers.push(key);
	// 						}
	// 						finalData = res.data;
	// 					}
	// 					var option = {
	// 						fieldSeparator: ',',
	// 						quoteStrings: '"',
	// 						decimalseparator: '.',
	// 						showLabels: false,
	// 						showTitle: false,
	// 						title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp') + ' Report',
	// 						useBom: false,
	// 						noDownload: false,
	// 						headers: headers,
	// 					};
	// 					this.appService.checkNotifcation = true;
	// 					const fileInfo = new ngxCsv(
	// 						finalData,
	// 						this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyWhatsApp') + ' Report',
	// 						option
	// 					);
	// 				}
	// 			});
	// 		} else if (this.selectedDripType == 2) {
	// 			//For WhatsApp with Drip getWhatsAppWithdripReport
	// 			this.toastr.success(
	// 				this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 				this.appService.getTranslation('Utils.success')
	// 			);
	// 			this.dripAnalyaticsService.getWhatsAppWithdripReport(payload).subscribe((res: any) => {
	// 				if (res.success) {
	// 					let finalData = [];
	// 					let headers = [
	// 						'SR NO',
	// 						'DRIP ID',
	// 						'DRIP NAME',
	// 						'DRIP STATUS',
	// 						'WHATSAPP TEMPLATE STATUS',
	// 						'DRIP CREATED BY',
	// 						'DRIP CREATED DATE',
	// 						'DRIP FLOW ID',
	// 						'DRIP FLOW NAME',
	// 						'DRIP FLOW CREATED BY',
	// 						'DRIP FLOW CREATED DATE',
	// 						'CONTACTS TARGETED IN DRIP FLOW',
	// 						'DRIP FLOW STATUS',
	// 						'TOTAL DRIPS SCHEDULED',
	// 						'TOTAL DRIPS SENT',
	// 						'TOTAL DRIPS DELIVERED',
	// 						'TOTAL DRIPS READ ON WHATSAPP',
	// 						'TOTAL DRIPS READ ON DRIP APP',
	// 						'TOTAL DRIPS ENGAGED',
	// 						'ACTION TAKEN',
	// 						'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
	// 						'TOTAL LINK CLICKS ON WHATSAPP',
	// 						'TOTAL BUTTON CLICKS ON DRIP APP',
	// 						'DRIP AVARAGE ACTION SCORE',
	// 					];
	// 					if (res.data && res.data.length > 0) {
	// 						headers = [];
	// 						for (let key in res.data[0]) {
	// 							headers.push(key);
	// 						}
	// 						finalData = res.data;
	// 					}
	// 					var option = {
	// 						fieldSeparator: ',',
	// 						quoteStrings: '"',
	// 						decimalseparator: '.',
	// 						showLabels: false,
	// 						showTitle: false,
	// 						title:
	// 							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp') +
	// 							' Report',
	// 						useBom: false,
	// 						noDownload: false,
	// 						headers: headers,
	// 					};
	// 					this.appService.checkNotifcation = true;
	// 					const fileInfo = new ngxCsv(
	// 						finalData,
	// 						this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonWhatsApp') +
	// 							' Report',
	// 						option
	// 					);
	// 				}
	// 			});
	// 		} else if (this.selectedDripType == 3) {
	// 			//For Email With Drip getEmailWithdripReport
	// 			this.toastr.success(
	// 				this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 				this.appService.getTranslation('Utils.success')
	// 			);
	// 			this.dripAnalyaticsService.getEmailWithdripReport(payload).subscribe((res: any) => {
	// 				if (res.success) {
	// 					let finalData = [];
	// 					let headers = [
	// 						'SR NO',
	// 						'DRIP ID',
	// 						'DRIP NAME',
	// 						'DRIP STATUS',
	// 						'DRIP CREATED BY',
	// 						'DRIP CREATED DATE',
	// 						'DRIP FLOW ID',
	// 						'DRIP FLOW NAME',
	// 						'DRIP FLOW CREATED BY',
	// 						'DRIP FLOW CREATED DATE',
	// 						'CONTACTS TARGETED IN DRIP FLOW',
	// 						'DRIP FLOW STATUS',
	// 						'TOTAL DRIPS SCHEDULED',
	// 						'TOTAL DRIPS SENT',
	// 						'TOTAL DRIPS DELIVERED',
	// 						'DRIPS READ ON EMAIL',
	// 						'TOTAL DRIPS READ ON DRIP APP',
	// 						'TOTAL DRIPS ENGAGED',
	// 						'ACTION TAKEN',
	// 						'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
	// 						'TOTAL BUTTON CLICKS ON DRIP APP',
	// 						'DRIP AVARAGE ACTION SCORE',
	// 					];
	// 					if (res.data && res.data.length > 0) {
	// 						headers = [];
	// 						for (let key in res.data[0]) {
	// 							headers.push(key);
	// 						}
	// 						finalData = res.data;
	// 					}
	// 					var option = {
	// 						fieldSeparator: ',',
	// 						quoteStrings: '"',
	// 						decimalseparator: '.',
	// 						showLabels: false,
	// 						showTitle: false,
	// 						title:
	// 							this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail') +
	// 							' Report',
	// 						useBom: false,
	// 						noDownload: false,
	// 						headers: headers,
	// 					};
	// 					this.appService.checkNotifcation = true;
	// 					const fileInfo = new ngxCsv(
	// 						finalData,
	// 						this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.DripAppwithsharingonEmail') +
	// 							' Report',
	// 						option
	// 					);
	// 				}
	// 			});
	// 		} else if (this.selectedDripType == 4) {
	// 			//For Only Drip App getOnlyDripAppReport
	// 			this.toastr.success(
	// 				this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 				this.appService.getTranslation('Utils.success')
	// 			);
	// 			this.dripAnalyaticsService.getOnlyDripAppReport(payload).subscribe((res: any) => {
	// 				if (res.success) {
	// 					let finalData = [];
	// 					let headers = [
	// 						'SR NO',
	// 						'DRIP ID',
	// 						'DRIP NAME',
	// 						'DRIP STATUS',
	// 						'DRIP CREATED BY',
	// 						'DRIP CREATED DATE',
	// 						'DRIP FLOW ID',
	// 						'DRIP FLOW NAME',
	// 						'DRIP FLOW CREATED BY',
	// 						'DRIP FLOW CREATED DATE',
	// 						'CONTACTS TARGETED IN DRIP FLOW',
	// 						'DRIP FLOW STATUS',
	// 						'TOTAL DRIPS SCHEDULED',
	// 						'TOTAL DRIPS SENT',
	// 						'TOTAL DRIPS DELIVERED',
	// 						'TOTAL DRIPS READ ON HOME FEED',
	// 						'TOTAL DRIPS READ ON DRIP APP',
	// 						'TOTAL DRIPS ENGAGED',
	// 						'ACTION TAKEN',
	// 						'TOTAL DRIPS WHERE ACTION INTENT DISPLAYED',
	// 						'TOTAL BUTTON CLICKS ON DRIP APP',
	// 						'DRIP AVARAGE ACTION SCORE',
	// 					];
	// 					if (res.data && res.data.length > 0) {
	// 						headers = [];
	// 						for (let key in res.data[0]) {
	// 							headers.push(key);
	// 						}
	// 						finalData = res.data;
	// 					}
	// 					var option = {
	// 						fieldSeparator: ',',
	// 						quoteStrings: '"',
	// 						decimalseparator: '.',
	// 						showLabels: false,
	// 						showTitle: false,
	// 						title: this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp') + ' Report',
	// 						useBom: false,
	// 						noDownload: false,
	// 						headers: headers,
	// 					};
	// 					this.appService.checkNotifcation = true;
	// 					const fileInfo = new ngxCsv(
	// 						finalData,
	// 						this.appService.getTranslation('Pages.Drips.AddEdit.DriptypeDropDown.OnlyDripApp') + ' Report',
	// 						option
	// 					);
	// 				}
	// 			});
	// 		}
	// 	}
	// }

	// submitGraded() {
	// 	this.isediGraded = false;
	// 	this.updateLearnerOfflineTaskAssetGrade();
	// }

	// editGraded() {
	// 	this.isediGraded = true;
	// }

	// getAssetsFilter(text) {
	// 	console.log('--text--', text);
	// 	if (text.length > 2) {
	// 		this.offlineTaskSearchText = text;
	// 		this.getOfflineTask();
	// 	} else if (text.length == 0) {
	// 		this.offlineTaskSearchText = '';
	// 		this.getOfflineTask();
	// 	} else {
	// 		this.offlineTaskSearchText = '';
	// 	}
	// }

	// selectedQuestion(item, index) {
	// 	this.activeIndex = index;
	// 	this.selectedQuestionText = item.question;
	// 	if (['Image', 'PDF'].indexOf(item.fileType) > -1) {
	// 		this.showDownloadButton = true;
	// 	} else {
	// 		this.showDownloadButton = false;
	// 	}
	// 	this.page = 1;
	// 	this.getOfflineTask();
	// 	// this.questionUploadedAsset = this.allOfflineTaskData[index].data;
	// }

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	// updateLearnerOfflineTaskAssetGrade() {
	// 	this.dripAnalyaticsService
	// 		.updateLearnerOfflineTaskAssetGrade({
	// 			data: this.selectedOfflineTaskDetails,
	// 			details: this.allOfflineTaskData,
	// 		})
	// 		.subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.gradedCount = res.gradeCount;
	// 				this.totalGradedableCount = res.totalGradedableCount;
	// 			}
	// 		});
	// }

	// downloadLearnerUploadedFile(item, index) {
	// 	this.dripAnalyaticsService
	// 		.downloadLearnerUploadedFiles({ path: item.path })
	// 		.toPromise()
	// 		.then(
	// 			(res: any) => {
	// 				let link = document.createElement('a');
	// 				link.href = window.URL.createObjectURL(res);
	// 				link.download = `${item.fileName}`;
	// 				link.click();
	// 				// this.toastr.success();
	// 			},
	// 			(failed) => {
	// 				console.log('Rejected', failed);
	// 				this.spinnerService.hide();
	// 			}
	// 		)
	// 		.catch((err) => {
	// 			console.log('Caught error', err);
	// 			this.spinnerService.hide();
	// 		});
	// }

	// onPageChangeEvent(evnt) {
	// 	this.page = evnt;
	// 	this.getOfflineTask();
	// }
	// changeResult(count) {
	// 	console.log(count);
	// }

	// downloadLearnerUploadedFileInZipFormat() {
	// 	this.dripAnalyaticsService
	// 		.downloadLearnerUploadedFileInZipFormat(this.questionUploadedAsset, this.selectedOfflineTaskDetails.campaign_id)
	// 		.toPromise()
	// 		.then(
	// 			(res: any) => {
	// 				let link = document.createElement('a');
	// 				link.href = window.URL.createObjectURL(res);

	// 				link.download = 'page_' + this.page + '_files.zip';
	// 				link.click();
	// 				// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
	// 			},
	// 			(failed) => {
	// 				console.log('Rejected', failed);
	// 				this.spinnerService.hide();
	// 			}
	// 		)
	// 		.catch((err) => {
	// 			console.log('Caught error', err);
	// 			this.spinnerService.hide();
	// 		});
	// }

	// downloadOfflineTaskDripReport(data) {
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	this.dripAnalyaticsService.getOfflineTaskAllDataForReport({ details: data.otherDetails }).subscribe((res: any) => {
	// 		if (res.success) {
	// 			let finalData = [];
	// 			if (res.data && res.data.length > 0) {
	// 				let count = 0;
	// 				finalData = res.data;
	// 			}
	// 			let headers = [];
	// 			for (let key in finalData[0]) {
	// 				headers.push(key);
	// 			}

	// 			var option = {
	// 				fieldSeparator: ',',
	// 				quoteStrings: '"',
	// 				decimalseparator: '.',
	// 				showLabels: false,
	// 				showTitle: false,
	// 				title: 'Offline Task Report',
	// 				useBom: false,
	// 				noDownload: false,
	// 				headers: headers,
	// 			};
	// 			const fileInfo = new ngxCsv(finalData, 'Offline Task Report', option);
	// 		}
	// 	});
	// }

	// downloadOnlyWhatsAppReport(data) {
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	this.dripAnalyaticsService.getOnlyWhatsAppReportDownload({ details: data.otherDetails }).subscribe((res: any) => {
	// 		if (res.success) {
	// 			let finalData = [];
	// 			let headers = ['SR NO', 'TRIGGER TIME', 'LEARNER ID', 'SELECTED QUICK REPLY'];

	// 			let count = 1;
	// 			for (let data of res.data) {
	// 				let quickReplyData = data.quickReplyResponse ? data.quickReplyResponse.split(',') : [];
	// 				if (quickReplyData && quickReplyData.length > 0) {
	// 					for (let reply of quickReplyData) {
	// 						let payload = {
	// 							'SR NO': count,
	// 							// 'DRIP ID': data.PostId,
	// 							// 'DRIP FLOW ID': data.CampaignId,
	// 							'TRIGGER TIME': data.WTriggerTime
	// 								? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
	// 								: '',
	// 							'LEARNER ID': data.User.account_id,
	// 							'SELECTED QUICK REPLY': reply,
	// 						};
	// 						finalData.push(payload);
	// 						count++;
	// 					}
	// 				} else {
	// 					let payload = {
	// 						'SR NO': count,
	// 						// 'DRIP ID': data.PostId,
	// 						// 'DRIP FLOW ID': data.CampaignId,
	// 						'TRIGGER TIME': data.WTriggerTime
	// 							? ' ' + moment(data.WTriggerTime).local().format('YYYY-MM-DD HH:mm:ss')
	// 							: '',
	// 						'LEARNER ID': data.User.account_id,
	// 						'SELECTED QUICK REPLY': '',
	// 					};
	// 					finalData.push(payload);
	// 					count++;
	// 				}
	// 			}

	// 			var option = {
	// 				fieldSeparator: ',',
	// 				quoteStrings: '"',
	// 				decimalseparator: '.',
	// 				showLabels: false,
	// 				showTitle: false,
	// 				title: 'Quick_reply_report',
	// 				useBom: false,
	// 				noDownload: false,
	// 				headers: headers,
	// 			};
	// 			const fileInfo = new ngxCsv(finalData, 'Quick_reply_report', option);
	// 		}
	// 	});

	// 	//Show Note PopUp
	// 	$('#viewuonlywhatsappquickreplaynotes').modal('show');
	// }

	cancelNotePopUp() {
		$('#viewuonlywhatsappquickreplaynotes').modal('hide');
	}

	dripTab(type, flag) {
		if (type == 'Rate of Engagement') {
			this.selectedRateOfEngagedTab = !this.selectedRateOfEngagedTab;
		} else if (type == 'Drips Sent') {
			this.seletedDripSentTab = !this.seletedDripSentTab;
		} else if (type == 'Drips Delivered') {
			this.seletedDripDeliveredTab = !this.seletedDripDeliveredTab;
		} else if (type == 'Drips Engaged') {
			this.seletedDripEngagedTab = !this.seletedDripEngagedTab;
		}

		// if (!flag) {
		// 	let temp = this.selectedDataToShow;
		// 	this.selectedDataToShow = [];
		// 	for (let item of this.totalAnayticsData) {
		// 		if (item.name == type) {
		// 			this.selectedDataToShow.push(item);
		// 		}
		// 	}
		// 	for (let item of temp) {
		// 		this.selectedDataToShow.push(item);
		// 	}
		// } else {
		// 	let temp = this.selectedDataToShow;
		// 	this.selectedDataToShow = [];
		// 	for (let item of temp) {
		// 		if (item.name != type) {
		// 			this.selectedDataToShow.push(item);
		// 		}
		// 	}
		// }
		localStorage.setItem(
			'selectedDripAnlyaticTabs',
			JSON.stringify({
				selectedRateOfEngagedTab: this.selectedRateOfEngagedTab,
				seletedDripSentTab: this.seletedDripSentTab,
				seletedDripDeliveredTab: this.seletedDripDeliveredTab,
				seletedDripEngagedTab: this.seletedDripEngagedTab,
			})
		);
		this.createChart(this.totalAnayticsData);
		// this.colorArray = [];
		// for (let data of this.selectedDataToShow) {
		// 	if (data.name == 'Drips Scheduled') {
		// 		this.colorArray.push(this.scheduleColor);
		// 	} else if (data.name == 'Drips Sent') {
		// 		this.colorArray.push(this.sentColor);
		// 	} else if (data.name == 'Drips Delivered') {
		// 		this.colorArray.push(this.deliveredColor);
		// 	} else if (data.name == 'Drips Engaged') {
		// 		this.colorArray.push(this.engagedColor);
		// 	}
		// }

		//save on localstorage
	}

	//Filter Part

	onclickFilterDropDownModal() {
		$('#filterDropDownModal').modal('show');
	}

	cancelFilterDropDownModal() {
		$('#filterDropDownModal').modal('hide');
	}

	async filterDropDownModalOk() {
		if (this.selectedFilterType) {
			// console.log('--Selected Filter Type--', this.selectedFilterType);
			// console.log('--customFieldLabelList--', this.customFieldLabelList);
			if (this.customFieldLabelList.indexOf(this.selectedFilterType) > -1) {
				await this.updateFilterListData(this.seletedFilterType);
				$('#filterDropDownModal').modal('hide');
				$('#filterModal').modal('show');
			} else {
				$('#filterDropDownModal').modal('hide');
				$('#filterModal').modal('show');
			}
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Utils.seleteFilterMessage'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	onSelectFilterType(data: any) {
		this.seletedFilterType = data.name;
		if (data.isCustomField) {
			this.customFieldOptions = [];
			this.customFieldOptions = data.option;
		}
	}

	onselctedFilterData(data: any, type: any, isCustomField = false) {
		this.payload = {
			filterType: type,
			isCustomField: isCustomField,
			selectedData: [],
			searchByText: null,
		};

		if (this.selectedFilterDate !== null) {
		}
		this.payload.selectedData.push(...data);
	}

	onSearchFilter(value: any, type, isCustomField = false) {
		this.payload = {
			filterType: type,
			isCustomField: isCustomField,
			selectedData: [],
			searchByText: value,
		};
	}

	cancelFilterModal() {
		$('#filterModal').modal('hide');
	}

	backToFilterList() {
		$('#filterModal').modal('hide');
		$('#filterDropDownModal').modal('show');
	}
	async selectedFilterOk() {
		if (this.payload?.searchByText || this.payload?.selectedData.length > 0) {
			this.filterArrayData.push(this.payload);
			this.getAllAnylyticsData();
			this.branchSelectedList = null;
			this.countrySelectedList = null;
			this.jobRoleSelectedList = null;
			this.dripTypesSelectedList = null;
			this.campaignSelectedList = null;
			this.dripSelectedList = null;
			this.customFieldSelectedList = null;
			this.customFieldOptions = [];
			this.payload = null;

			$('#filterModal').modal('hide');
			await this.updateFilterListData(this.seletedFilterType);
			this.selectedFilterType = null;
		} else {
		}
	}

	updateFilterListForFirstTime() {
		for (let selectedData_ of this.filterArrayData) {
			if (selectedData_.filterType === 'Account') {
				this.branchList = [];
				for (let item of this.allInOneFilterData.BranchList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.branchList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Country') {
				this.countryList = [];
				for (let item of this.allInOneFilterData.CountryList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.countryList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Job Role') {
				this.jobRoleList = [];
				for (let item of this.allInOneFilterData.JobRoleList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.jobRoleList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Channel') {
				this.dripTypes = [];
				for (let item of this.dripTypeList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.dripTypes.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Drip Flows') {
				this.campaignList = [];
				for (let item of this.allInOneFilterData.CampaignList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.campaignList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Drips') {
				this.dripList = [];
				for (let item of this.allInOneFilterData.DripList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.dripList.push(item);
					}
				}
			}
		}
	}

	async updateFilterListData(filterType?) {
		if (!filterType) {
			this.branchList = this.allInOneFilterData.BranchList;
			this.countryList = this.allInOneFilterData.CountryList;
			this.jobRoleList = this.allInOneFilterData.JobRoleList;
			this.dripList = this.allInOneFilterData.DripList;
			this.campaignList = this.allInOneFilterData.CampaignList;
			this.dripTypes = this.allInOneFilterData.DripList;
			return;
		}
		let selectedData = [];
		for (let selectedData_ of this.filterArrayData) {
			if (selectedData_.filterType === filterType || selectedData_.filterType === this.seletedFilterType) {
				selectedData = [...selectedData, ...selectedData_.selectedData];
			}
		}

		// console.log('---selectedData--', selectedData);
		// console.log('---filterArrayData--', this.filterArrayData);
		if (this.seletedFilterType === 'Account' || filterType === 'Account') {
			this.branchList = [];
			for (let item of this.allInOneFilterData.BranchList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.branchList.push(item);
				}
			}
		}
		if (this.seletedFilterType === 'Country' || filterType === 'Country') {
			this.countryList = [];
			for (let item of this.allInOneFilterData.CountryList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.countryList.push(item);
				}
			}
		}

		if (this.seletedFilterType === 'Job Role' || filterType === 'Job Role') {
			this.jobRoleList = [];
			for (let item of this.allInOneFilterData.JobRoleList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.jobRoleList.push(item);
				}
			}
		}
		if (this.seletedFilterType === 'Channel' || filterType === 'Channel') {
			this.dripTypes = [];
			for (let item of this.dripTypeList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.dripTypes.push(item);
				}
			}
		}
		if (this.seletedFilterType === 'Drip Flows' || filterType === 'Drip Flows') {
			this.campaignList = [];
			for (let item of this.allInOneFilterData.CampaignList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.campaignList.push(item);
				}
			}
		}
		if (this.seletedFilterType === 'Drips' || filterType === 'Drips') {
			this.dripList = [];
			for (let item of this.allInOneFilterData.DripList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.dripList.push(item);
				}
			}
		}
		if (
			this.customFieldLabelList.indexOf(this.seletedFilterType) > -1 ||
			this.customFieldLabelList.indexOf(filterType) > -1
		) {
			this.customFieldOptions = [];
			for (let item of this.allInOneFilterData.customFields) {
				if (item.label === this.seletedFilterType || item.label === filterType) {
					for (let option of item.options) {
						let flag = true;
						for (let selectedItem of selectedData) {
							if (option.label === selectedItem.label) {
								flag = false;
							}
						}
						if (flag) {
							this.customFieldOptions.push(option);
						}
					}
				}
			}
		}

		return;
	}

	startFilterDateClicked(value: any) {
		// this.selectedFilterDate.startDate = value.startDate.$d;
		this.maxDate = moment(value.startDate.$d).add(1, 'month').format('MM-DD-YYYY');
	}

	endFilterDateClicked(value: any) {
		// this.selectedFilterDate.endDate = value.endDate.$d;
		this.maxDate = null;
	}

	async clearFilter(index, jIndex?) {
		let deletedFilterType = this.filterArrayData[index].filterType;
		if (jIndex || jIndex === 0) {
			this.filterArrayData[index].selectedData.splice(jIndex, 1);
			if (this.filterArrayData[index].selectedData.length === 0) {
				this.filterArrayData.splice(index, 1);
			}
			await this.updateFilterListData(deletedFilterType);
			this.selectedFilterType = null;
			this.getAllAnylyticsData();
		} else {
			this.filterArrayData.splice(index, 1);
			if (this.filterArrayData.length > 0) {
				await this.updateFilterListData(deletedFilterType);
				this.selectedFilterType = null;
			} else {
				await this.updateFilterListData();
				this.selectedFilterType = null;
			}
			this.getAllAnylyticsData();
		}
		this.selectedFilterType = null;
	}

	async clearAllFilter() {
		this.selectedFilterType = null;
		this.filterArrayData = [];
		this.getAllAnylyticsData();
		await this.updateFilterListData();
		this.selectedFilterType = null;
	}

	onDateChange(value: any) {
		if (value?.startDate?.$d && value?.endDate?.$d) {
			this.selectedFilterDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedFilterDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getAllAnylyticsData();
		}
	}

	// downloadSurveyReport(data, flag) {
	// 	console.log('---item---', data);
	// 	// this.selectedDripDetails = data.otherDetails;
	// 	let payload = {
	// 		campaign_id: data.campaign_id,
	// 		drip_camp_id: data.drip_camp_id,
	// 		drip_camp_Index: data.drip_camp_index,
	// 		post_id: data.post_id,
	// 		type: data.template_type,
	// 	};
	// 	this.selectedDripDetails = payload;
	// 	// this.toastr.success(
	// 	// 	this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 	// 	this.appService.getTranslation('Utils.success')
	// 	// );
	// 	if (flag) {
	// 		this.dripAnalyaticsService.getAllSuervyDataForReport(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				setTimeout(() => {
	// 					this.createSurveyReport();
	// 				}, 200);
	// 			}
	// 		});
	// 	} else {
	// 		this.dripAnalyaticsService
	// 			.downloadLearnerUploadedSurvey(this.selectedDripDetails)
	// 			.toPromise()
	// 			.then(
	// 				(res: any) => {
	// 					let link = document.createElement('a');
	// 					link.href = window.URL.createObjectURL(res);

	// 					link.download = 'Survey_uploaded_files.zip';
	// 					link.click();
	// 					// this.toastr.success(this.appService.getTranslation('Pages.Assets.Home.Toaster.assetsdownload'), this.appService.getTranslation('Utils.success'));
	// 				},
	// 				(failed) => {
	// 					console.log('Rejected', failed);
	// 					this.spinnerService.hide();
	// 				}
	// 			)
	// 			.catch((err) => {
	// 				console.log('Caught error', err);
	// 				this.spinnerService.hide();
	// 			});
	// 		// this.dripAnalyaticsService.getAllSuervyDataForReport(this.selectedDripDetails).subscribe((res: any) => {
	// 		// 	if (res.success) {
	// 		// 		this.selectedDripAllData = [];
	// 		// 		this.selectedDripAllData = res.data;
	// 		// 		setTimeout(() => {
	// 		// 			this.downloadSurveyUploadedFiles();
	// 		// 		}, 200);
	// 		// 	}
	// 		// });
	// 	}
	// }

	// createPollReport() {
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
	// 		let header = [];
	// 		for (let key in this.selectedDripAllData[0]) {
	// 			header.push(key);
	// 		}
	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: false,
	// 			showTitle: false,
	// 			title: 'Poll Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: header,
	// 		};
	// 		const fileInfo = new ngxCsv(this.selectedDripAllData, 'Poll Report', option);
	// 	}
	// }

	// createOfflineTaskReport() {
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Utils.reportDownloadMessage'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	if (this.selectedDripAllData && this.selectedDripAllData.length > 0) {
	// 		let headers = [];
	// 		for (let key in this.selectedDripAllData[0]) {
	// 			headers.push(key);
	// 		}

	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: false,
	// 			showTitle: false,
	// 			title: 'Offline Task Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: headers,
	// 		};
	// 		const fileInfo = new ngxCsv(this.selectedDripAllData, 'Offline Task Report', option);
	// 	}
	// }

	// downloadPollReport(data, flag) {
	// 	let payload = {
	// 		campaign_id: data.campaign_id,
	// 		drip_camp_id: data.drip_camp_id,
	// 		drip_camp_Index: data.drip_camp_index,
	// 		post_id: data.post_id,
	// 		type: data.template_type,
	// 	};
	// 	this.selectedDripDetails = payload;

	// 	if (flag) {
	// 		this.dripAnalyaticsService.getAllPollDataForReport(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				setTimeout(() => {
	// 					this.createPollReport();
	// 				}, 200);
	// 			}
	// 		});
	// 	} else {
	// 		this.dripAnalyaticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				this.allQuestion = [];
	// 				this.allQuestion.push({ question: res.question });
	// 				setTimeout(() => {
	// 					$('#showResultModel').modal('show');
	// 				}, 200);
	// 			}
	// 		});
	// 	}
	// }

	// downloadOfflienTaskReport(data, flag) {
	// 	let payload = {
	// 		campaign_id: data.campaign_id,
	// 		drip_camp_id: data.drip_camp_id,
	// 		drip_camp_Index: data.drip_camp_index,
	// 		post_id: data.post_id,
	// 		type: data.template_type,
	// 	};
	// 	this.selectedDripDetails = payload;

	// 	if (flag) {
	// 		this.dripAnalyaticsService.getOfflineTaskAllDataForReport(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				setTimeout(() => {
	// 					this.createOfflineTaskReport();
	// 				}, 200);
	// 			}
	// 		});
	// 	} else {
	// 		this.dripAnalyaticsService.getAllPollGrapgData(this.selectedDripDetails).subscribe((res: any) => {
	// 			if (res.success) {
	// 				this.selectedDripAllData = [];
	// 				this.selectedDripAllData = res.data;
	// 				this.allQuestion = [];
	// 				this.allQuestion.push({ question: res.question });
	// 				// setTimeout(() => {
	// 				// 	$('#showResultModel').modal('show');
	// 				// }, 200);
	// 			}
	// 		});
	// 	}
	// }

	// reportDownload(data) {
	// 	if (data.drip_type == 'Only WhatsApp') {
	// 		let payload = {
	// 			campaign_id: data.campaign_id,
	// 			drip_camp_id: data.drip_camp_id,
	// 			drip_camp_Index: data.drip_camp_index,
	// 			post_id: data.post_id,
	// 			type: data.template_type,
	// 		};
	// 		this.selectedDripDetails = payload;
	// 		this.downloadOnlyWhatsAppReport({ otherDetails: this.selectedDripDetails });
	// 	} else if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
	// 		this.ShowPopupForQuiz(data);
	// 	} else if (data.template_type == 'Survey') {
	// 		this.downloadSurveyReport(data, true);
	// 	} else if (data.template_type == 'Poll') {
	// 		this.downloadPollReport(data, true);
	// 	} else if (data.template_type == 'Offline Task') {
	// 		this.downloadOfflienTaskReport(data, true);
	// 	}
	// 	return;
	// }

	// filesDownload(data) {
	// 	if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
	// 		// this.ShowPopupForQuiz(data);
	// 	} else if (data.template_type == 'Survey') {
	// 		this.downloadSurveyReport(data, false);
	// 	} else if (data.template_type == 'Poll') {
	// 		this.downloadPollReport(data, false);
	// 	} else if (data.template_type == 'Offline Task') {
	// 		let payload = {
	// 			campaign_id: data.campaign_id,
	// 			drip_camp_id: data.drip_camp_id,
	// 			drip_camp_Index: data.drip_camp_index,
	// 			post_id: data.post_id,
	// 			type: data.template_type,
	// 		};
	// 		this.selectedDripDetails = payload;
	// 		this.ShowPopupForViewuplaods({ otherDetails: this.selectedDripDetails }, true);
	// 	}
	// 	return;
	// }

	// filesDownloadFromNodeView(data) {
	// 	if (['Quiz', 'Quiz (Randomised)'].indexOf(data.template_type) != -1) {
	// 		// this.ShowPopupForQuiz(data);
	// 	}
	// 	// else if (data.template_type == 'Survey') {
	// 	// 	this.downloadSurveyReport(data, false);
	// 	// }
	// 	else if (data.template_type == 'Poll') {
	// 		this.downloadPollReport(data, false);
	// 	} else if (data.template_type == 'Offline Task') {
	// 		let payload = {
	// 			campaign_id: data.campaign_id,
	// 			drip_camp_id: data.drip_camp_id,
	// 			drip_camp_Index: data.drip_camp_index,
	// 			post_id: data.post_id,
	// 			type: data.template_type,
	// 		};
	// 		this.selectedDripDetails = payload;
	// 		this.ShowPopupForViewuplaods({ otherDetails: this.selectedDripDetails }, true);
	// 	}
	// 	return;
	// }

	// exportToCsv() {
	// 	if (this.AllCampaignDrip && this.AllCampaignDrip.length > 0) {
	// 		let header = [
	// 			'DRIP NODE NAME',
	// 			'DRIP NODE STATUS',
	// 			'SENDING DATE & TIME',
	// 			'SCHEDULED',
	// 			'SENT',
	// 			'DELIVERED',
	// 			'READ ON WHATSAPP',
	// 			'READ RATE ON WHATSAPP',
	// 			'READ ON DRIP APP',
	// 			'READ RATE ON DRIPAPP',
	// 			'ACTION INTENT DISPLAYED',
	// 			'ACTION TAKEN',
	// 			'ACTION TAKEN RATE',
	// 			'AVERAGE ACTION SCORE',
	// 		];
	// 		let exportdata = [];
	// 		for (let data of this.AllCampaignDrip) {
	// 			let payload = {
	// 				'DRIP NODE NAME': data.node_name,
	// 				'DRIP NODE STATUS': data.node_status,
	// 				'SENDING DATE & TIME': data.node_send_date ? data.node_send_date : '-',
	// 				SCHEDULED: data.scheduled,
	// 				SENT: data.sent,
	// 				DELIVERED: data.delivered,
	// 				'READ ON WHATSAPP': data.read_on_every_day_channel ? data.read_on_every_day_channel : 0,
	// 				// 'READ RATE ON WHATSAPP':
	// 				// 	data.read_rate_on_every_day_channel && !data.isTotal ? data.read_rate_on_every_day_channel + `%` : `0%`,
	// 				// 'READ ON DRIP APP': data.read_on_drip_app ? data.read_on_drip_app : 0,
	// 				// 'READ RATE ON DRIPAPP': data.read_rate_on_drip_app && !data.isTotal ? data.read_rate_on_drip_app + `%` : `0%`,
	// 				// 'ACTION INTENT DISPLAYED': data.action_intent_displayed ? data.action_intent_displayed : 0,
	// 				// 'ACTION TAKEN': data.action_taken ? data.action_taken : 0,
	// 				// 'ACTION TAKEN RATE': data.rate_action_taken && !data.isTotal ? data.rate_action_taken + `%` : `0%`,
	// 				// 'AVERAGE ACTION SCORE': data.average_action_score ? data.average_action_score : 0,
	// 			};
	// 			if (!data.isTotal) {
	// 				payload['READ RATE ON WHATSAPP'] = data.read_rate_on_every_day_channel
	// 					? data.read_rate_on_every_day_channel + `%`
	// 					: `0%`;
	// 			} else {
	// 				payload['READ RATE ON WHATSAPP'] = ' ';
	// 			}

	// 			payload['READ ON DRIP APP'] = data.read_on_drip_app ? data.read_on_drip_app : 0;

	// 			if (!data.isTotal) {
	// 				payload['READ RATE ON DRIPAPP'] = data.read_rate_on_drip_app ? data.read_rate_on_drip_app + `%` : `0%`;
	// 			} else {
	// 				payload['READ RATE ON DRIPAPP'] = ' ';
	// 			}

	// 			payload['ACTION INTENT DISPLAYED'] = data.action_intent_displayed ? data.action_intent_displayed : 0;
	// 			payload['ACTION TAKEN'] = data.action_taken ? data.action_taken : 0;

	// 			if (!data.isTotal) {
	// 				payload['ACTION TAKEN RATE'] = data.rate_action_taken ? data.rate_action_taken + `%` : `0%`;
	// 			} else {
	// 				payload['ACTION TAKEN RATE'] = ' ';
	// 			}

	// 			payload['AVERAGE ACTION SCORE'] = data.average_action_score ? data.average_action_score : 0;
	// 			exportdata.push(payload);
	// 		}
	// 		var option = {
	// 			fieldSeparator: ',',
	// 			quoteStrings: '"',
	// 			decimalseparator: '.',
	// 			showLabels: false,
	// 			showTitle: false,
	// 			title: 'Export Report',
	// 			useBom: false,
	// 			noDownload: false,
	// 			headers: header,
	// 		};
	// 		const fileInfo = new ngxCsv(exportdata, 'Export Report', option);
	// 	}
	// }

	createChart(data) {
		type EChartsOption = echarts.EChartsOption;

		let chartDom = document.getElementById('drip_chart')!;
		let myChart = echarts.init(chartDom);
		let option: EChartsOption;

		let seriesData = [];
		let yAxis = [];
		if (this.seletedDripSentTab) {
			seriesData.push({
				name: 'Drips Sent',
				type: 'line',

				tooltip: {
					valueFormatter: function (value) {
						return (value as number) + '';
					},
				},
				data: data[1].data,
				color: [this.sentColor],
			});
		}

		if (this.seletedDripDeliveredTab) {
			seriesData.push({
				name: 'Drips Delivered',
				type: 'line',
				tooltip: {
					valueFormatter: function (value) {
						return (value as number) + '';
					},
				},
				data: data[2].data,
				color: [this.deliveredColor],
			});
		}

		if (this.seletedDripEngagedTab) {
			seriesData.push({
				name: 'Drips Engaged',
				type: 'line',
				tooltip: {
					valueFormatter: function (value) {
						return (value as number) + '';
					},
				},
				data: data[3].data,
				color: [this.engagedColor],
			});
		}

		if (this.selectedRateOfEngagedTab) {
			seriesData.push({
				name: 'Rate Of Engagement',
				type: 'line',
				yAxisIndex: 1,
				tooltip: {
					valueFormatter: function (value) {
						return (value as number) + ' %';
					},
				},
				data: data[4].data,
			});
		}

		if (this.seletedDripSentTab || this.seletedDripDeliveredTab || this.seletedDripEngagedTab) {
			yAxis.push({
				type: 'value',
				name: 'Count',
				axisLabel: {
					formatter: '{value}',
				},
			});
		}

		if (
			this.selectedRateOfEngagedTab &&
			!this.seletedDripSentTab &&
			!this.seletedDripDeliveredTab &&
			!this.seletedDripEngagedTab
		) {
			yAxis.push({
				type: 'value',
				name: '',
				axisLabel: {
					formatter: '{value}',
				},
			});
		}

		if (this.selectedRateOfEngagedTab) {
			yAxis.push({
				type: 'value',
				name: 'Percentage',
				min: 0,
				max: 100,
				interval: 20,
				axisLabel: {
					formatter: '{value} %',
				},
			});
		}

		// console.log('---seriesData---', seriesData);
		// console.log('---yAxis---', yAxis);
		option = {
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					crossStyle: {
						color: '#999',
					},
				},
			},
			// toolbox: {
			// 	feature: {
			// 		saveAsImage: { show: false },
			// 		dataView: { show: false, readOnly: false },
			// 		magicType: { show: false, type: ['line', 'line'] },
			// 		restore: { show: false },
			// 	},
			// },
			// legend: {
			// 	data: ['Evaporation', 'Precipitation', 'Temperature'],
			// },
			xAxis: [
				{
					type: 'category',
					data: data[5].data,
					axisPointer: {
						type: 'shadow',
					},
				},
			],
			yAxis: yAxis,
			series: seriesData,
		};

		option && myChart.setOption(option, true, true);

		if (yAxis.length == 0) {
			this.showNoData = true;
		} else {
			this.showNoData = false;
		}
	}
}
