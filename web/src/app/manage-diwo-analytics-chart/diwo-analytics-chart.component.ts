import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { routerTransition } from 'src/app/router.animations';
import * as echarts from 'echarts';
import * as moment from 'moment';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import { DiwoAnalyticsChartService } from './diwo-analytics.service';
import { environment } from 'src/environments/environment';
import { ngxCsv } from 'ngx-csv/ngx-csv';
declare var $: any;
@Component({
	selector: 'app-diwo-analytics-chart',
	templateUrl: './diwo-analytics-chart.component.html',
	styleUrls: ['./diwo-analytics-chart.component.scss'],
	animations: [routerTransition()],
})
export class DiwoAnalyticsChartComponent implements OnInit {
	pageResultCount = environment.pageResultsCount;
	loadingCompleted = false;
	selectedDate;
	verticalGraphResult: any[] = [];

	invalidDates: moment.Moment[] = [];
	allSubClientList = [];
	selectedClientId;

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

	filterData = [
		{ id: 1, name: 'Assignment ID', value: 'Assignment ID', option: [], isCustomField: false },
		{ id: 2, name: 'Account', value: 'Account', option: [], isCustomField: false },
		{ id: 3, name: 'Country', value: 'Country', option: [], isCustomField: false },
		{ id: 4, name: 'Job Role', value: 'Job Role', option: [], isCustomField: false },
		{ id: 5, name: 'Tags', value: 'Tags', option: [], isCustomField: false },
	];

	viewedByList = [
		{ id: 1, name: 'Modules', value: 'Modules' },
		{ id: 2, name: 'Courses', value: 'Courses' },
		{ id: 3, name: 'Pathways', value: 'Pathways' },
	];

	branchList = [];
	countryList = [];
	jobRoleList = [];

	moduleList: any = [];
	courseList = [];
	pathwayList: any = [];
	assignmentIdsList: any = [];
	backupAssignmentId: any = [];
	selectedClientName: any;
	userClient: any;
	roleId: any;
	userId: any;

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
	anayticsData: any = [];
	ILTAnayticsData: any = [];
	finalSearchData: any = [
		{ filterType: 'Account', selectedData: [], searchByText: '' },
		{ filterType: 'Country', selectedData: [], searchByText: '' },
		{ filterType: 'Job Role', selectedData: [], searchByText: '' },
		{ filterType: 'Tags', selectedData: [], searchByText: '' },
	];

	isApiCall: boolean = false;
	isDataLoaded: boolean = false;
	branchSelectedList: null;
	countrySelectedList: null;
	jobRoleSelectedList: null;
	moduleSelectedList: null;
	courseSelectedList: null;
	pathwaySelectedList: null;
	assignmentIdSelectedList: null;

	customFieldSelectedList: null;
	allInOneFilterData: any = [];

	showNoData = false;
	customFieldList: any[];
	customFieldOptions = [];
	customFieldLabelList: any[] = [];

	iconObject = {
		expand_more_icon_diwo: null,
	};
	color: any = `#6513e1`;

	selectedViewedBy: any;

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private diwoAnalyaticsService: DiwoAnalyticsChartService,
		private router: Router,
		public appService: AppService,
		public sanitizer: DomSanitizer
	) {
		Object.assign(this.verticalGraphResult);

		//Check Filter Data on Local Storage
		if (
			localStorage.getItem('selectedDiwoAnalyaticsFilterData') &&
			localStorage.getItem('selectedDiwoAnalyaticsFilterData') != '[]'
		) {
			this.filterArrayData = JSON.parse(localStorage.getItem('selectedDiwoAnalyaticsFilterData'));
		}

		if (localStorage.getItem('selectedDiwoAnalyaticsFilterDate')) {
			let data = JSON.parse(localStorage.getItem('selectedDiwoAnalyaticsFilterDate'));
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

		if (localStorage.getItem('selectedDiwoAnalyaticsViewdBy')) {
			let data = JSON.parse(localStorage.getItem('selectedDiwoAnalyaticsViewdBy'));
			this.selectedViewedBy = data;
		} else {
			this.selectedViewedBy = 'Modules';
		}
	}

	ngOnInit() {
		this.getAppBranding();
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.selectedClientId = this.userClient.id;
		this.getFilterListData();
		this.getAllDiwoAnalyticsData();
		this.onChangeViewedBy(this.selectedViewedBy);
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getFilterListData() {
		this.diwoAnalyaticsService.getDiwoFilterListData().subscribe((res: any) => {
			if (res.success) {
				this.allInOneFilterData = res.data;
				this.allInOneFilterData.AssignmentIdsList = [];
				this.branchList = res.data.BranchList;
				this.countryList = res.data.CountryList;
				this.jobRoleList = res.data.JobRoleList;
				this.moduleList = res.data.ModuleList;
				this.courseList = res.data.CourseList;
				this.pathwayList = res.data.PathwayList;
				this.customFieldList = res.data.customFields;

				let payload1 = {
					id: 0,
					ModuleIdTitle: 'All modules with certifications',
					title: 'All modules with certifications',
				};
				this.moduleList.unshift(payload1);

				let payload2 = {
					id: 0,
					CourseIdTitle: 'All courses with certifications',
					title: 'All courses with certifications',
				};
				this.courseList.unshift(payload2);

				let payload3 = {
					id: 0,
					PathwayIdTitle: 'All pathways with certifications',
					title: 'All pathways with certifications',
				};
				this.pathwayList.unshift(payload3);

				this.moduleList = [...this.moduleList];
				this.courseList = [...this.courseList];
				this.pathwayList = [...this.pathwayList];

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
					this.filterArrayData = JSON.parse(localStorage.getItem('selectedDiwoAnalyaticsFilterData'));
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
		localStorage.setItem('selectedDiwoAnalyaticsFilterData', JSON.stringify(this.filterArrayData));
		localStorage.setItem('selectedDiwoAnalyaticsFilterDate', JSON.stringify(date));
		localStorage.setItem('selectedDiwoAnalyaticsViewdBy', JSON.stringify(this.selectedViewedBy));
	}

	getAllDiwoAnalyticsData() {
		this.savelocalStorageData();
		let date = {
			startDate: moment(this.selectedFilterDate.startDate).format('YYYY-MM-DD'),
			endDate: moment(this.selectedFilterDate.endDate).format('YYYY-MM-DD'),
		};
		this.isApiCall = true;

		this.diwoAnalyaticsService
			.getDiwoAnalyticsData({ filterData: this.filterArrayData, date: date, viewedBy: this.selectedViewedBy })
			.subscribe((res: any) => {
				if (res.success) {
					this.anayticsData = [];
					this.ILTAnayticsData = [];
					this.anayticsData = res.data.analyticsData[0];
					this.ILTAnayticsData = res.data.ILTAnalyticsData[0];
					this.isApiCall = false;
					if (
						(this.anayticsData.AssignCount == null || this.anayticsData.AssignCount == '0') &&
						(this.anayticsData.InProgressCount == null || this.anayticsData.InProgressCount == '0') &&
						(this.anayticsData.CompletedCount == null || this.anayticsData.CompletedCount == '0') &&
						(this.anayticsData.CertifiedCount == null || this.anayticsData.CompletedCount == '0')
					) {
						this.showNoData = true;
					} else {
						this.showNoData = false;
					}
					setTimeout(() => {
						this.createChart(this.anayticsData);
					}, 100);
				}
			});
	}

	cancelNotePopUp() {
		$('#viewuonlywhatsappquickreplaynotes').modal('hide');
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
			this.getAllDiwoAnalyticsData();
			this.branchSelectedList = null;
			this.countrySelectedList = null;
			this.jobRoleSelectedList = null;
			this.moduleSelectedList = null;
			this.courseSelectedList = null;
			this.pathwaySelectedList = null;
			this.assignmentIdSelectedList = null;
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
			} else if (selectedData_.filterType === 'Modules') {
				this.moduleList = [];
				for (let item of this.allInOneFilterData.ModuleList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.moduleList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Courses') {
				this.courseList = [];
				for (let item of this.allInOneFilterData.CourseList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.courseList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'Pathways') {
				this.pathwayList = [];
				for (let item of this.allInOneFilterData.PathwayList) {
					let flag = true;
					for (let selectedItem of selectedData_.selectedData) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.pathwayList.push(item);
					}
				}
			} else if (selectedData_.filterType === 'AssignmentId') {
				this.assignmentIdsList = [];
				for (let item of this.backupAssignmentId) {
					let flag = true;
					for (let selectedItem of selectedData_) {
						if (item.id === selectedItem.id) {
							flag = false;
						}
					}
					if (flag) {
						this.assignmentIdsList.push(item);
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
			this.moduleList = this.allInOneFilterData.ModuleList;
			this.courseList = this.allInOneFilterData.CourseList;
			this.pathwayList = this.allInOneFilterData.PathwayList;
			this.assignmentIdsList = this.backupAssignmentId;
			return;
		}
		let selectedData = [];
		for (let selectedData_ of this.filterArrayData) {
			if (selectedData_.filterType === filterType || selectedData_.filterType === this.seletedFilterType) {
				selectedData = [...selectedData, ...selectedData_.selectedData];
			}
		}

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

		if (this.seletedFilterType === 'Modules' || filterType === 'Modules') {
			this.moduleList = [];
			for (let item of this.allInOneFilterData.ModuleList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.moduleList.push(item);
				}
			}
		}

		if (this.seletedFilterType === 'Courses' || filterType === 'Courses') {
			this.courseList = [];
			for (let item of this.allInOneFilterData.CourseList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.courseList.push(item);
				}
			}
		}

		if (this.seletedFilterType === 'Pathways' || filterType === 'Pathways') {
			this.pathwayList = [];
			for (let item of this.allInOneFilterData.PathwayList) {
				let flag = true;
				for (let selectedItem of selectedData) {
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.pathwayList.push(item);
				}
			}
		}

		if (this.seletedFilterType === 'AssignmentId' || filterType === 'AssignmentId') {
			this.assignmentIdsList = [];
			for (let item of this.backupAssignmentId) {
				let flag = true;
				for (let selectedItem of selectedData) {
					// console.log('--selectedItem--', selectedItem);
					// console.log('--item888--', item);
					if (item.id === selectedItem.id) {
						flag = false;
					}
				}
				if (flag) {
					this.assignmentIdsList.push(item);
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
		this.maxDate = moment(value.startDate.$d).add(1, 'month').format('MM-DD-YYYY');
	}

	endFilterDateClicked(value: any) {
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
			this.getAllDiwoAnalyticsData();
		} else {
			this.filterArrayData.splice(index, 1);
			if (this.filterArrayData.length > 0) {
				await this.updateFilterListData(deletedFilterType);
				this.selectedFilterType = null;
			} else {
				await this.updateFilterListData();
				this.selectedFilterType = null;
			}
			this.getAllDiwoAnalyticsData();
		}
		this.selectedFilterType = null;
	}

	async clearAllFilter() {
		this.selectedFilterType = null;
		this.filterArrayData = [];
		this.getAllDiwoAnalyticsData();
		await this.updateFilterListData();
		this.selectedFilterType = null;
	}

	onDateChange(value: any) {
		if (value?.startDate?.$d && value?.endDate?.$d) {
			this.selectedFilterDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedFilterDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getAllDiwoAnalyticsData();
		}
	}

	onChangeViewedBy(event) {
		if (
			(event && event.value == 'Modules') ||
			(event && event.value == 'Courses') ||
			(event && event.value == 'Pathways') ||
			event == 'Modules' ||
			event == 'Courses' ||
			event == 'Pathways'
		) {
			this.filterData = this.filterData.filter(
				(item) => item.name !== 'Modules' && item.name !== 'Courses' && item.name !== 'Pathways'
			);
			let payload;
			if (event && event.value) {
				payload = { id: 0, name: event.value, value: event.value, option: [], isCustomField: false };
			} else if (event) {
				payload = { id: 0, name: event, value: event, option: [], isCustomField: false };
			}
			this.filterData.unshift(payload);
			this.getFilterAssignmentIdListData(payload.name);
		}
		this.filterData = [...this.filterData];

		if (event && event.value) {
			this.clearAllFilter();
		}
	}

	getFilterAssignmentIdListData(type) {
		this.diwoAnalyaticsService.getDiwoFilterAssignmentIdsListData(type).subscribe((res: any) => {
			if (res.success) {
				this.assignmentIdsList = [];
				this.allInOneFilterData.AssignmentIdsList = res.data.AssignmentIdsList;
				this.backupAssignmentId = res.data.AssignmentIdsList;
				let payload1 = {
					id: 'All assignment with certifications',
					ModuleIdTitle: 'All assignment with certifications',
					title: 'All assignment with certifications',
				};
				this.backupAssignmentId.unshift(payload1);
				this.assignmentIdsList = this.backupAssignmentId;
				this.loadingCompleted = true;
			}
		});
	}

	createChart(data) {
		type EChartsOption = echarts.EChartsOption;

		let chartDom = document.getElementById('diwo_chart')!;
		let myChart = echarts.init(chartDom);
		let option: EChartsOption;

		let seriesData = [];
		let yAxis = [];
		seriesData.push({
			type: 'bar',
			data: [data.AssignCount, data.InProgressCount, data.CompletedCount, data.CertifiedCount],
			color: [this.engagedColor],
		});

		yAxis.push({
			type: 'value',
			name: 'Count',
			axisLabel: {
				formatter: '{value}',
			},
			tooltip: {
				valueFormatter: function (value) {
					return (value as number) + '';
				},
			},
		});

		option = {
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
				},
			},
			grid: {
				left: '5%',
				right: '5%',
				bottom: '5%',
				containLabel: true,
			},
			xAxis: {
				type: 'category',
				data: ['Assigned', 'In Progress', 'Completed', 'Certified'],
			},
			yAxis: yAxis,
			series: seriesData,
		};

		if (this.showNoData) {
			option.graphic = {
				type: 'text',
				left: 'center',
				top: 'middle',
				style: {
					text: 'No data to show',
					fontSize: 18,
					fill: '#939393',
				},
			};
		}

		option && myChart.setOption(option, true, true);
	}
}
