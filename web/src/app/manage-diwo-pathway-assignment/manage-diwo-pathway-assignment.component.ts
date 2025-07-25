import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagetDiwoAssignmentService } from './manage-diwo-pathway-assignment.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../app.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';

declare var $: any;

@Component({
	selector: 'app-manage-diwo-pathway-assignment',
	templateUrl: './manage-diwo-pathway-assignment.component.html',
	styleUrls: ['./manage-diwo-pathway-assignment.component.scss'],
	animations: [routerTransition()],
})
export class ManageDiwoPathwayAssignmentComponent implements OnInit {
	pathwayDetailsChanges = false;
	viewChanges: boolean = false;
	assetBasePath = environment.imageHost + environment.imagePath;
	userClientId: any;
	userDetails: any;
	userRoleId: string;
	updateNewVersion: boolean = false;
	assignPathway: any;
	pathwaysDetail: any = [];

	AllLearnerGroupsDropDownList = [];
	trainerList = [];

	iconObject = {
		add_icon_35: null,
		module_wise_assignment: null,
		info_icon_25: null,
	};

	assignmentAddScreen: boolean = false;
	showModuleListScreen: boolean = false;

	timePicker: any = [];
	courseModulesList: any = [];
	finalAssignmentList = [];
	next30MinDate: any;
	next60MinDate: any;
	pathwayModuleList: any = [];
	assignmentDetails: {
		selectedLearnerGroup: any[];
		assignmentStartDate: { startDate: moment.Moment; endDate: any };
		assignmentStartTime: any;
		assignmentEndDate: { startDate: moment.Moment; endDate: any };
		assignmentEndTime: any;
		assignmentStartDateTime: any;
		assignmentEndDateTime: any;
		isLearnerGroupNotSelected: boolean;
		status: any;
		version: number;
	}[];
	editAssignmentId = null;
	isViewedMode: boolean = false;
	selectedAssignmentIdForRemove: any;

	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	differentsDetectedInPathwayAndAssignment: boolean = false;
	beforeViewCourse: any = [];
	beforeViewCourseModuleList: any[];
	afterViewChangesCourseModuleList = [];
	deletedModuleCount = 0;
	constructor(
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private assignmentService: ManagetDiwoAssignmentService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.userDetails = JSON.parse(localStorage.getItem('user')).user || null;
		this.userRoleId = localStorage.getItem('roleId');
		this.createTimerPicker();
		this.assignPathway = this.route.params['_value'];
		if (this.assignPathway && this.assignPathway.pathwayId) {
			this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
			this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
			this.getLearnerGroupForWorkbookByUserId(this.userDetails.id, this.userClientId, this.userRoleId);
			this.getTrainerList(this.userClientId);
		}
		this.getAppBranding();
		// Calculate the minutes for the next 30-minute mark
		this.next30MinDate = new Date();
		let minutes = this.next30MinDate.getMinutes();
		minutes = minutes < 30 ? 30 : 60;
		this.next30MinDate.setMinutes(minutes, 0, 0);

		// Calculate the minutes for the next 60-minute mark
		this.next60MinDate = new Date();
		let next60Min = 60;
		this.next60MinDate.setMinutes(next60Min, 0, 0);

		this.initialiseAssignmentDetails();
	}

	initialiseAssignmentDetails() {
		this.editAssignmentId = null;
		this.assignmentDetails = [];
		this.assignmentDetails = [
			{
				selectedLearnerGroup: [],
				assignmentStartDate: { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null },
				assignmentStartTime: this.getTimePikerIdByDate(this.next30MinDate.toISOString()),
				assignmentEndDate: { startDate: moment().subtract(0, 'days').add(1, 'days'), endDate: null },
				assignmentEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
				assignmentStartDateTime: null,
				assignmentEndDateTime: null,
				isLearnerGroupNotSelected: false,
				status: null,
				version: null,
			},
		];
		this.showModuleListScreen = false;
	}

	createTimerPicker() {
		let timerId = 0;
		for (let HH = 0; HH <= 23; HH++) {
			for (let MM = 0; MM <= 45; MM = MM + 30) {
				// for (let MM = 0; MM <= 55; MM = MM + 5) {
				let hours = HH.toString().length == 1 ? '0' + HH.toString() : HH.toString();
				let minutes = MM.toString().length == 1 ? '0' + MM.toString() : MM.toString();

				this.timePicker.push({
					id: timerId,
					time: `${hours}:${minutes}`,
					hours: hours,
					minutes: minutes,
				});
				timerId++;
			}
		}
	}

	getTimePikerIdByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.id;
			}
		}
	}

	getActculTimeByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.time;
			}
		}
	}

	getDateByDateAndTimePickerId(date, id) {
		let timePickerData;
		for (let time of this.timePicker) {
			if (time.id == id) {
				timePickerData = time;
			}
		}
		return new Date(date).setHours(parseInt(timePickerData.hours), parseInt(timePickerData.minutes), 0, 0);
	}

	onSelectAssignmentStartDate(event) {
		if (event.startDate && event.endDate) {
			this.checkStartDateAndTimeValidation();
			this.assignAssignmentDatesToModules('Start');
		}
	}

	onSelectAssignmentStartTime(event) {
		if (event) {
			this.checkStartDateAndTimeValidation();
			this.assignAssignmentDatesToModules('Start');
		}
	}

	onSelectAssignmentEndDate(event) {
		if (event.startDate && event.endDate) {
			this.checkEndDateAndTimeValidation();
			this.assignAssignmentDatesToModules('End');
		}
	}

	onSelectAssignmentEndTime(event) {
		// console.log('-event-', event);
		if (event) {
			this.checkEndDateAndTimeValidation();
			this.assignAssignmentDatesToModules('End');
		}
	}

	checkStartDateAndTimeValidation() {
		if (
			this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD') &&
			this.assignmentDetails[0].assignmentStartTime
		) {
			this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
				this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
				this.assignmentDetails[0].assignmentStartTime
			);

			if (new Date(this.assignmentDetails[0].assignmentStartDateTime) < new Date()) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
					this.appService.getTranslation('Utils.error')
				);

				this.assignmentDetails[0] = {
					...this.assignmentDetails[0],
					assignmentStartTime: this.getTimePikerIdByDate(this.next30MinDate.toISOString()),
					assignmentStartDate: {
						startDate: moment().startOf('day'),
						endDate: null,
					},
					assignmentStartDateTime: null,
				};
				this.assignAssignmentDatesToModules('Start');
				// return;
			}

			if (
				new Date(this.assignmentDetails[0].assignmentStartDateTime) >
				new Date(this.assignmentDetails[0].assignmentEndDateTime)
			) {
				this.assignmentDetails[0] = {
					...this.assignmentDetails[0],
					assignmentEndTime: this.assignmentDetails[0].assignmentStartTime,
					assignmentEndDate: {
						startDate: moment(this.assignmentDetails[0].assignmentStartDateTime).add(1, 'days'),
						endDate: null,
					},
					assignmentEndDateTime: null,
				};
				this.assignAssignmentDatesToModules('End');
				// return;
			}
		}
	}

	checkEndDateAndTimeValidation() {
		if (
			this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD') &&
			this.assignmentDetails[0].assignmentEndTime
		) {
			this.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
				this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
				this.assignmentDetails[0].assignmentEndTime
			);

			if (
				new Date(this.assignmentDetails[0].assignmentEndDateTime) <
					new Date(this.assignmentDetails[0].assignmentStartDateTime) ||
				new Date(this.assignmentDetails[0].assignmentEndDateTime) < new Date()
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectendDate'),
					this.appService.getTranslation('Utils.error')
				);

				this.assignmentDetails[0] = {
					...this.assignmentDetails[0],
					assignmentEndTime: this.assignmentDetails[0].assignmentStartTime,
					assignmentEndDate: {
						startDate: moment(this.assignmentDetails[0].assignmentStartDateTime).add(1, 'days'),
						endDate: null,
					},
					assignmentEndDateTime: null,
				};
				this.assignAssignmentDatesToModules('End');
				return;
			}
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getPathwayForAssignment(pathwayId) {
		this.assignmentService.getPathwayByIdForAssignment(pathwayId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					if (res.data.pathwaysDetail) {
						this.pathwaysDetail = res.data.pathwaysDetail;
					}
					if (res.data && res.data.pathwayCourseModuleData && res.data.pathwayCourseModuleData.length > 0) {
						this.courseModulesList = [];
						for (let item of res.data.pathwayCourseModuleData) {
							let isCertificate = false;
							if (item.isAssignmentCertification != undefined) {
								isCertificate = item.isAssignmentCertification;
							} else if (item.isCertificationModule != undefined) {
								isCertificate = item.isCertificationModule;
							} else {
								isCertificate = false;
							}

							let payload = {
								CourseId: item.CourseId,
								CourseIndex: item.CourseIndex,
								CourseName: item.CourseName,
								WorkbookId: item.WorkbookId,
								ModuleName: item.ModuleName,
								ModuleIndex: item.ModuleIndex,
								ModuleTypeName: item.ModuleTypeName,
								DiwoModuleId: item.DiwoModuleId,
								ModuleStartDate: { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null },
								ModuleStartTime: this.getTimePikerIdByDate(this.next30MinDate.toISOString()),
								ModuleStartDateTime: null,
								ModuleEndDate: { startDate: moment().subtract(0, 'days').add(1, 'days'), endDate: null },
								ModuleEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
								ModuleEndtDateTime: null,
								ModuleOperation: item.ModuleOperation,
								TrainerId: null,
								isCertificationModule: isCertificate,
								ModuleDepedencyIndex: this.setDependencyIndexs(item.ModuleDepedencyIndex),
								//item.ModuleDepedencyIndex
								// ? item.ModuleDepedencyIndex === 'No Dependency'
								// 	? item.ModuleDepedencyIndex.split(',')
								// 	: item.ModuleDepedencyIndex.split(',').map(Number)
								// : [],

								CourseVersion: item.CourseVersion,
								isAssignmentCertification: isCertificate,
								isPublish: false,
							};
							this.courseModulesList.push(payload);
						}
						this.pathwayModuleList = [];
						this.pathwayModuleList = [...this.courseModulesList];
						console.log('pathwayModuleList', this.pathwayModuleList);
					}
				}
			}
		});
	}

	showAssignmentAddFlow() {
		this.isViewedMode = false;
		this.assignmentAddScreen = true;
		this.pathwayDetailsChanges = false;
		this.differentsDetectedInPathwayAndAssignment = false;
		this.viewChanges = false;
		if (this.editAssignmentId != null) {
			this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
			this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
		}
		this.initialiseAssignmentDetails();
	}

	showModuleList() {
		this.showModuleListScreen = !this.showModuleListScreen;
		console.log('-----courseModulesList---', this.courseModulesList);
	}

	// assignAssignmentDatesToModules() {
	// 	if (!this.isViewedMode) {
	// 		for (let item of this.courseModulesList) {
	// 			if (item?.isPublish == false) {
	// 				item.ModuleStartDate = this.assignmentDetails[0].assignmentStartDate;
	// 				item.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
	// 				item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
	// 				item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
	// 			}
	// 		}
	// 	}
	// }

	assignAssignmentDatesToModules(type) {
		if (!this.isViewedMode) {
			if (type == 'Start') {
				this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
					this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
					this.assignmentDetails[0].assignmentStartTime
				);
			} else if (type == 'End') {
				this.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
					this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
					this.assignmentDetails[0].assignmentEndTime
				);
			}

			for (let item of this.courseModulesList) {
				if (!item.isPublish) {
					if (type == 'Start') {
						item.ModuleStartDate = this.assignmentDetails[0].assignmentStartDate;
						item.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
						item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
							item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
							item.ModuleStartTime
						);
					} else if (type == 'End') {
						item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
						item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
						item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
							item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
							item.ModuleEndTime
						);
					}
				}
			}

			// for (let item of this.courseModulesList) {
			// 	if (!item.isPublish) {
			// 		//Check Start Date and End Date
			// 		//For Start Date
			// 		item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
			// 			item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
			// 			item.ModuleStartTime
			// 		);
			// 		if (item.ModuleStartDate?.startDate?.format('YYYY-MM-DD') && item.ModuleStartTime) {
			// 			if (
			// 				item.ModuleStartDateTime &&
			// 				this.assignmentDetails[0].assignmentStartDateTime &&
			// 				new Date(item.ModuleStartDateTime) < new Date(this.assignmentDetails[0].assignmentStartDateTime)
			// 			) {
			// 				item.ModuleStartDate = this.assignmentDetails[0].assignmentStartDate;
			// 				item.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
			// 				item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
			// 					item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
			// 					item.ModuleStartTime
			// 				);
			// 			}
			// 		}
			// 		//for End Date
			// 		item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
			// 			item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
			// 			item.ModuleEndTime
			// 		);
			// 		if (item.ModuleEndDate?.startDate?.format('YYYY-MM-DD') && item.ModuleEndTime) {
			// 			if (
			// 				item.ModuleEndDateTime &&
			// 				this.assignmentDetails[0].assignmentEndDateTime &&
			// 				new Date(item.ModuleEndDateTime) > new Date(this.assignmentDetails[0].assignmentEndDateTime)
			// 			) {
			// 				item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
			// 				item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
			// 				item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
			// 					item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
			// 					item.ModuleEndTime
			// 				);
			// 			}
			// 		}

			// 		if (item.ModuleStartDateTime && item.ModuleEndDateTime) {
			// 			if (new Date(item.ModuleStartDateTime) > new Date(item.ModuleEndDateTime)) {
			// 				item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
			// 				item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
			// 				item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
			// 					item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
			// 					item.ModuleEndTime
			// 				);
			// 			}
			// 		}
			// 	}
			// }
		}
	}

	getLearnerGroupForWorkbookByUserId(userId, clientId, userRoleId) {
		this.assignmentService.getLearnerGroupForWorkbookByUserId(userId, clientId, userRoleId).subscribe((res: any) => {
			if (res.success) {
				this.AllLearnerGroupsDropDownList = [];
				this.AllLearnerGroupsDropDownList = res.data;
			}
		});
	}

	getTrainerList(clientId) {
		this.assignmentService.getTrainerList(clientId).subscribe((res: any) => {
			if (res.success) {
				this.trainerList = [];
				this.trainerList = res.data;
			}
		});
	}

	onSelectLearnerGroup(event) {
		this.assignmentDetails[0].isLearnerGroupNotSelected = false;
	}

	onSelectTrainer(i) {}

	saveAssignPathway(Published) {
		if (!this.isViewedMode) {
			let flag = false;

			if (this.assignmentDetails[0].selectedLearnerGroup.length == 0) {
				this.assignmentDetails[0].isLearnerGroupNotSelected = true;
				flag = true;
			}

			if (flag) {
				return;
			}

			let payload = {
				assignmentDetails: this.assignmentDetails,
				selectedModuleList: this.courseModulesList,
				updateNewVersion: this.updateNewVersion,
			};

			if (Published) {
				payload.assignmentDetails[0].status = 'Scheduled';
			} else {
				payload.assignmentDetails[0].status = 'Draft';
			}

			if (
				payload.assignmentDetails &&
				payload.assignmentDetails[0].assignmentStartDate &&
				payload.assignmentDetails[0].assignmentStartTime
			) {
				payload.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
					payload.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
					payload.assignmentDetails[0].assignmentStartTime
				);
			}

			if (
				payload.assignmentDetails &&
				payload.assignmentDetails[0].assignmentEndDate &&
				payload.assignmentDetails[0].assignmentEndTime
			) {
				payload.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
					payload.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
					payload.assignmentDetails[0].assignmentEndTime
				);
			}

			if (payload.selectedModuleList && payload.selectedModuleList.length > 0) {
				for (let item of payload.selectedModuleList) {
					if (
						item.ModuleStartDate == null ||
						item.ModuleStartTime == null ||
						item.ModuleEndDate == null ||
						item.ModuleEndTime == null
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectValidDate'),
							this.appService.getTranslation('Utils.error')
						);
						return;
					}
					item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
						item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
						item.ModuleStartTime
					);
					item.ModuleEndtDateTime = this.getDateByDateAndTimePickerId(
						item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
						item.ModuleEndTime
					);

					if (
						item.ModuleStartDateTime &&
						item.ModuleEndtDateTime &&
						new Date(item.ModuleEndtDateTime) <= new Date(item.ModuleStartDateTime)
					) {
						this.toastr.error(
							this.appService.getTranslation('Pages.DiwoAssignment.Toaster.endDateGreaterThanStartDate'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}

					if (Array.isArray(item.ModuleDepedencyIndex) && item?.ModuleDepedencyIndex?.length == 0) {
						item.ModuleDepedencyIndex = 'No Dependency';
					} else if (Array.isArray(item.ModuleDepedencyIndex)) {
						item.ModuleDepedencyIndex = item.ModuleDepedencyIndex.toString();
					}
				}
			}

			// Check if assignmentEndDateTime is greater than assignmentStartDateTime
			if (
				new Date(payload.assignmentDetails[0].assignmentEndDateTime) <=
				new Date(payload.assignmentDetails[0].assignmentStartDateTime)
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.endDateGreaterThanStartDate'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}

			if (flag) {
				return;
			}

			// console.log('-payload-', payload);
			// return;

			this.spinnerService.show();
			if (this.editAssignmentId == null) {
				this.assignmentService
					.createDiwoPathwayAssignment(this.assignPathway.pathwayId, payload)
					.subscribe((res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation('Pages.DiwoAssignment.Toaster.createAssignment'),
								this.appService.getTranslation('Utils.success')
							);
							this.assignmentAddScreen = false;
							this.appService.checkNotifcation = true;
							this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
							this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
							this.scrollToAssignmentTable();
							this.initialiseAssignmentDetails();
						} else {
							this.spinnerService.hide();
							this.toastr.error(res.error, 'Error');
						}
					});
			} else {
				this.assignmentService
					.updateDiwoPathwayAssignment(this.editAssignmentId, this.assignPathway.pathwayId, payload)
					.subscribe((res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation('Pages.DiwoAssignment.Toaster.createAssignment'),
								this.appService.getTranslation('Utils.success')
							);
							this.assignmentAddScreen = false;
							this.appService.checkNotifcation = true;
							this.differentsDetectedInPathwayAndAssignment = false;
							this.viewChanges = false;
							this.pathwayDetailsChanges = false;
							this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
							this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
							this.scrollToAssignmentTable();
							this.initialiseAssignmentDetails();
						} else {
							this.spinnerService.hide();
							this.toastr.error(res.error, 'Error');
						}
					});
			}
		}
	}

	scrollToAssignmentTable() {
		const scrollList = document.getElementById('Assignment_Table');
		if (scrollList) {
			window.scrollTo({ top: 0, behavior: 'auto' });
			scrollList.scrollIntoView({ behavior: 'smooth' });
		}
	}

	cancelAssignPathway() {
		this.router.navigate(['/diwo-pathways']);
	}

	editAssignment(item, isViewed) {
		this.isViewedMode = isViewed;
		this.assignmentAddScreen = true;
		this.editAssignmentId = item.assignmentId;
		this.updateNewVersion = false;
		this.assignmentService.getDiwoAssimentByAssignmentId(item.assignmentId).subscribe((res: any) => {
			if (res.success) {
				const assignmentData = res.data?.assignmentData?.[0];
				if (assignmentData?.assignmentCopy) {
					this.checkPathwayDetailsChanges(assignmentData?.assignmentCopy);
				}
				if (assignmentData) {
					if (assignmentData.DiwoModuleAssigns && assignmentData.DiwoModuleAssigns.length > 0) {
						this.courseModulesList = [];
						for (const module of assignmentData.DiwoModuleAssigns) {
							let isCertificate = false;
							if (module.isAssignmentCertification != undefined) {
								isCertificate = module.isAssignmentCertification;
							} else if (module.isCertificationModule != undefined) {
								isCertificate = module.isCertificationModule;
							} else {
								isCertificate = false;
							}
							const payload = {
								// DiwoAssignmentId: module.DiwoAssignmentId,
								id: module.id,
								WorkbookId: module.WorkbookId,
								ModuleName: module.ModuleName,
								ModuleTypeName: module.ModuleTypeName,
								DiwoModuleId: module.DiwoModuleId,
								ModuleStartDate: module.ModuleStartDate,
								ModuleStartTime: this.getTimePikerIdByDate(module.ModuleStartDate),
								ModuleEndDate: module.ModuleEndDate,
								ModuleEndTime: this.getTimePikerIdByDate(module.ModuleEndDate),
								ModuleIndex: module.ModuleIndex,
								CourseId: module.CourseId,
								CourseIndex: module.CourseIndex,
								CourseName: module.CourseName,
								TrainerId: module.TrainerId,
								isCertificationModule: isCertificate,
								ModuleDepedencyIndex: this.setDependencyIndexs(module.ModuleDepedencyIndex),
								// item.ModuleDepedencyIndex
								// ? item.ModuleDepedencyIndex === 'No Dependency'
								// 	? item.ModuleDepedencyIndex.split(',')
								// 	: item.ModuleDepedencyIndex.split(',').map(Number)
								// : []

								CourseVersion: module.CourseVersion,
								isPublish: module.isPublish,
								isAssignmentCertification: isCertificate,
								Workbook: module.Workbook,
							};

							let date1 = moment(module.ModuleStartDate).format('YYYY-MM-DD');
							let date2 = moment(module.ModuleEndDate).format('YYYY-MM-DD');
							payload.ModuleStartDate = { startDate: moment(date1).subtract(0, 'days').startOf('day'), endDate: null };
							payload.ModuleEndDate = { startDate: moment(date2).subtract(0, 'days').startOf('day'), endDate: null };

							this.courseModulesList.push(payload);
						}
						console.log('courseModulesList--11--', this.courseModulesList);
						this.beforeViewCourseModuleList = [];
						this.beforeViewCourseModuleList = [...this.courseModulesList];
						this.upgradePathwayAssignment();
					}

					this.assignmentDetails = [];
					let learnerGroups = [];
					if (assignmentData.DiwoAssignUserGroupMappings && assignmentData.DiwoAssignUserGroupMappings.length > 0) {
						for (const group of assignmentData.DiwoAssignUserGroupMappings) {
							learnerGroups.push(group.UserGroupId);
						}
					}

					const payload = {
						selectedLearnerGroup: [...learnerGroups],
						assignmentStartDate: assignmentData.StartDate,
						assignmentStartTime: this.getTimePikerIdByDate(assignmentData.StartDate),
						assignmentEndDate: assignmentData.EndDate,
						assignmentEndTime: this.getTimePikerIdByDate(assignmentData.EndDate),
						assignmentStartDateTime: null,
						assignmentEndDateTime: null,
						isLearnerGroupNotSelected: false,
						status: assignmentData.status,
						version: assignmentData.version,
					};

					let date1 = moment(assignmentData.StartDate).format('YYYY-MM-DD');
					let date2 = moment(assignmentData.EndDate).format('YYYY-MM-DD');
					payload.assignmentStartDate = {
						startDate: moment(date1).subtract(0, 'days').startOf('day'),
						endDate: null,
					};
					payload.assignmentEndDate = {
						startDate: moment(date2).subtract(0, 'days').startOf('day'),
						endDate: null,
					};

					this.assignmentDetails.push(payload);
				}
				// this.checkAnyDifferentInThePathwayAndAssignment();
			}
		});
	}

	checkPathwayDetailsChanges(assignmentPathwayData) {
		this.pathwayDetailsChanges = false;
		if (assignmentPathwayData && JSON.parse(assignmentPathwayData)?.Pathway) {
			const assignmentPathwayDetails = JSON.parse(assignmentPathwayData).Pathway;
			if (assignmentPathwayDetails?.title && assignmentPathwayDetails.title != this.pathwaysDetail.title) {
				this.pathwayDetailsChanges = true;
			}
			if (
				assignmentPathwayDetails?.l_outcomes &&
				assignmentPathwayDetails.l_outcomes != this.pathwaysDetail.l_outcomes
			) {
				this.pathwayDetailsChanges = true;
			}
			if (
				assignmentPathwayDetails?.e_duration &&
				assignmentPathwayDetails.e_duration != this.pathwaysDetail.e_duration
			) {
				this.pathwayDetailsChanges = true;
			}
		}
	}

	checkAnyDifferentInThePathwayAndAssignment() {
		//clear the previous value
		this.differentsDetectedInPathwayAndAssignment = false;
		this.viewChanges = false;
		if (
			this.assignmentDetails[0].status == 'Finished' ||
			this.pathwaysDetail.version == this.assignmentDetails[0].version
		) {
			return;
		}
		if (this.courseModulesList.length > 0 && this.pathwayModuleList.length > 0) {
			if (this.courseModulesList.length != this.pathwayModuleList.length) {
				this.differentsDetectedInPathwayAndAssignment = true;
			} else {
				for (let i = 0; i < this.courseModulesList.length; i++) {
					if (this.courseModulesList[i].isPublish == false) {
						if (
							this.courseModulesList[i] &&
							this.pathwayModuleList[i] &&
							(this.courseModulesList[i].CourseVersion != this.pathwayModuleList[i].CourseVersion ||
								this.courseModulesList[i].CourseId != this.pathwayModuleList[i].CourseId)
						) {
							this.differentsDetectedInPathwayAndAssignment = true;
							break;
						} else if (this.courseModulesList[i] == undefined || this.pathwayModuleList[i] == undefined) {
							this.differentsDetectedInPathwayAndAssignment = true;
							break;
						}
					}
				}
			}
		}
		console.log('-----differentsDetectedInPathwayAndAssignment', this.differentsDetectedInPathwayAndAssignment);
	}

	updateAssignmentAsPerPathway() {
		//First Check if any changes are detected in the assignment and pathway
		// Then Check which Module is isPublish or not
		// If isPublish is false then check if the CourseVersion is same or not
		// If CourseVersion is not same then update the assignment with the pathway module list
	}

	removeAssignment(item) {
		this.selectedAssignmentIdForRemove = item.assignmentId;
		$('#assignmentDeleteModel').modal('show');
	}

	onDeleteSubmit() {
		this.spinnerService.show();
		this.assignmentService.deleteAssignment(this.selectedAssignmentIdForRemove).subscribe((res: any) => {
			if (res.success) {
				this.selectedAssignmentIdForRemove = null;
				this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
				this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
				$('#assignmentDeleteModel').modal('hide');
				this.toastr.success(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.assignmentdeleted'),
					this.appService.getTranslation('Utils.success')
				);
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	cancelDeleteModal() {
		$('#assignmentDeleteModel').modal('hide');
	}

	ILTPreassignModuleToFacilitator(module) {
		this.router.navigate(['/module', { WorkbookId: module.WorkbookId, comingfrom: 'assignment' }]);
	}

	getPathwayAssignmentList(pathwayId, page, limit) {
		this.assignmentService.getPathwayAssignmentList(pathwayId, page, limit).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.finalAssignmentList = [];
					for (let item of res.data) {
						let payload = {
							assignmentId: item.id,
							learnerGroupName: item.learnerGroupName,
							createdAt: item.createdAt,
							author: item.author,
							updatedAt: item.updatedAt,
							PathwayId: item.PathwayId,
							CourseId: item.CourseId,
							WorkbookId: item.WorkbookId,
							status: item.status,
						};
						this.finalAssignmentList.push(payload);
						this.totalCount = res.count;
					}
				}
			}
		});
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		this.getPathwayAssignmentList(this.assignPathway.pathwayId, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getPathwayAssignmentList(this.assignPathway.pathwayId, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getPathwayAssignmentList(this.assignPathway.pathwayId, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getPathwayAssignmentList(this.assignPathway.pathwayId, this.page, this.limit);
		}
	}

	onSelectModuleStartDate(event, i) {
		console.log('-event-Date', event);
		console.log('-i---Date', i);
		if (event.startDate && event.endDate && i >= 0) {
			this.checkValidationForModuleWiseStartDateTime(i);
		}
	}

	onSelectModuleStartTime(event, i) {
		console.log('-event---Time', event);
		console.log('-i--Time', i);
		if (event && i >= 0) {
			this.checkValidationForModuleWiseStartDateTime(i);
		}
	}

	onSelectModuleEndDate(event, i) {
		if (event.startDate && event.endDate && i >= 0) {
			this.checkValidationForModuleWiseEndDateTime(i);
		}
	}

	onSelectModuleEndTime(event, i) {
		if (event && i >= 0) {
			this.checkValidationForModuleWiseEndDateTime(i);
		}
	}

	// checkValidationForModuleWiseStartDateTime(i) {
	// 	if (
	// 		this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD') &&
	// 		this.courseModulesList[i].ModuleStartTime
	// 	) {
	// 		this.courseModulesList[i].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
	// 			this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD'),
	// 			this.courseModulesList[i].ModuleStartTime
	// 		);

	// 		let flag = false;
	// 		console.log('Selected Start Date', new Date(this.courseModulesList[i].ModuleStartDateTime));

	// 		if (i > 0) {
	// 			if (
	// 				this.courseModulesList[i - 1].ModuleStartDate.startDate.format('YYYY-MM-DD') &&
	// 				this.courseModulesList[i - 1].ModuleStartTime
	// 			) {
	// 				const previousModuleStartDateTime = this.getDateByDateAndTimePickerId(
	// 					this.courseModulesList[i - 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
	// 					this.courseModulesList[i - 1].ModuleStartTime
	// 				);

	// 				if (new Date(this.courseModulesList[i].ModuleStartDateTime) < new Date(previousModuleStartDateTime)) {
	// 					this.toastr.error(
	// 						this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
	// 						this.appService.getTranslation('Utils.error')
	// 					);
	// 					flag = true;
	// 				}
	// 			}
	// 		} else if (i == 0) {
	// 			if (
	// 				this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD') &&
	// 				this.assignmentDetails[0].assignmentStartTime
	// 			) {
	// 				this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
	// 					this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
	// 					this.assignmentDetails[0].assignmentStartTime
	// 				);

	// 				if (
	// 					new Date(this.assignmentDetails[0].assignmentStartDateTime) >
	// 					new Date(this.courseModulesList[i].ModuleStartDateTime)
	// 				) {
	// 					this.toastr.error(
	// 						this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
	// 						this.appService.getTranslation('Utils.error')
	// 					);
	// 					flag = true;
	// 				}
	// 			}
	// 		}

	// 		if (new Date(this.courseModulesList[i].ModuleStartDateTime) < new Date()) {
	// 			this.toastr.error(
	// 				this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
	// 				this.appService.getTranslation('Utils.error')
	// 			);

	// 			flag = true;
	// 		}

	// 		if (
	// 			new Date(this.courseModulesList[i].ModuleStartDateTime) > new Date(this.courseModulesList[i].ModuleEndDateTime)
	// 		) {
	// 			this.toastr.error(
	// 				this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
	// 				this.appService.getTranslation('Utils.error')
	// 			);
	// 			flag = true;
	// 		}

	// 		if (flag) {
	// 			if (i > 0) {
	// 				this.courseModulesList[i] = {
	// 					...this.courseModulesList[i],
	// 					ModuleStartTime: this.courseModulesList[i - 1].ModuleStartTime,
	// 					ModuleStartDate: {
	// 						startDate: this.courseModulesList[i - 1].ModuleStartDate.startDate,
	// 						endDate: null,
	// 					},
	// 					ModuleStartDateTime: null,

	// 					ModuleEndTime: this.assignmentDetails[0].assignmentEndTime,
	// 					ModuleEndDate: {
	// 						startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
	// 						endDate: null,
	// 					},
	// 					ModuleEndDateTime: null,
	// 				};
	// 			} else {
	// 				this.courseModulesList[i] = {
	// 					...this.courseModulesList[i],
	// 					ModuleStartTime: this.assignmentDetails[0].assignmentStartTime,
	// 					ModuleStartDate: {
	// 						startDate: this.assignmentDetails[0].assignmentStartDate.startDate,
	// 						endDate: null,
	// 					},
	// 					ModuleStartDateTime: null,

	// 					ModuleEndTime: this.assignmentDetails[0].assignmentEndTime,
	// 					ModuleEndDate: {
	// 						startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
	// 						endDate: null,
	// 					},
	// 					ModuleEndDateTime: null,
	// 				};
	// 			}
	// 		}

	// 		///Check next Module Time and Date
	// 		if (i < this.courseModulesList.length - 1) {
	// 			this.courseModulesList[i + 1].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
	// 				this.courseModulesList[i + 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
	// 				this.courseModulesList[i + 1].ModuleStartTime
	// 			);

	// 			if (
	// 				new Date(this.courseModulesList[i].ModuleStartDateTime) >
	// 				new Date(this.courseModulesList[i + 1].ModuleStartDateTime)
	// 			) {
	// 				//need to check all new Moduel date and Time
	// 				this.courseModulesList = this.courseModulesList.map((data, index) => {
	// 					if (index > i && data.isPublish == false) {
	// 						data.ModuleStartTime = this.courseModulesList[i].ModuleStartTime;
	// 						data.ModuleStartDate = {
	// 							startDate: this.courseModulesList[i].ModuleStartDate.startDate,
	// 							endDate: null,
	// 						};
	// 						data.ModuleStartDateTime = null;
	// 					}

	// 					return data;
	// 				});
	// 			}
	// 		}
	// 	}
	// }

	checkValidationForModuleWiseStartDateTime(i) {
		if (
			this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD') &&
			this.courseModulesList[i].ModuleStartTime
		) {
			this.courseModulesList[i].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleStartTime
			);

			this.courseModulesList[i].ModuleEndDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleEndTime
			);

			let flag = false;

			if (i > 0) {
				if (
					this.courseModulesList[i - 1].ModuleStartDate.startDate.format('YYYY-MM-DD') &&
					this.courseModulesList[i - 1].ModuleStartTime
				) {
					const previousModuleStartDateTime = this.getDateByDateAndTimePickerId(
						this.courseModulesList[i - 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
						this.courseModulesList[i - 1].ModuleStartTime
					);

					if (new Date(this.courseModulesList[i].ModuleStartDateTime) < new Date(previousModuleStartDateTime)) {
						console.log('-------------1---');
						this.toastr.error(
							this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
							this.appService.getTranslation('Utils.error')
						);

						flag = true;
					}
				}
			} else if (i == 0) {
				if (
					this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD') &&
					this.assignmentDetails[0].assignmentStartTime
				) {
					this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
						this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
						this.assignmentDetails[0].assignmentStartTime
					);

					if (
						new Date(this.assignmentDetails[0].assignmentStartDateTime) >
						new Date(this.courseModulesList[i].ModuleStartDateTime)
					) {
						console.log('-------------2---');

						this.toastr.error(
							this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}
				}
			}

			if (new Date(this.courseModulesList[i].ModuleStartDateTime) < new Date()) {
				console.log('-------------3---');

				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}

			if (
				this.courseModulesList[i].ModuleEndDateTime &&
				this.courseModulesList[i].ModuleStartDateTime &&
				new Date(this.courseModulesList[i].ModuleStartDateTime) >= new Date(this.courseModulesList[i].ModuleEndDateTime)
			) {
				console.log('-------------4---');
				console.log(
					'-------------4--new Date(this.courseModulesList[i].ModuleStartDateTime)-',
					new Date(this.courseModulesList[i].ModuleStartDateTime)
				);
				console.log(
					'-------------4--new Date(this.courseModulesList[i].ModuleEndDateTime)-',
					new Date(this.courseModulesList[i].ModuleEndDateTime)
				);
				console.log('-------------4---');

				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}

			if (flag) {
				if (i > 0) {
					this.courseModulesList[i] = {
						...this.courseModulesList[i],
						ModuleStartTime: this.courseModulesList[i - 1].ModuleStartTime,
						ModuleStartDate: {
							startDate: this.courseModulesList[i - 1].ModuleStartDate.startDate,
							endDate: null,
						},
						ModuleStartDateTime: null,
						ModuleEndTime: this.assignmentDetails[0].assignmentEndTime,
						ModuleEndDate: {
							startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
							endDate: null,
						},
						ModuleEndDateTime: null,
					};
				} else if (i == 0) {
					this.courseModulesList[i] = {
						...this.courseModulesList[i],
						ModuleStartTime: this.assignmentDetails[0].assignmentStartTime,
						ModuleStartDate: {
							startDate: this.assignmentDetails[0].assignmentStartDate.startDate,
							endDate: null,
						},
						ModuleStartDateTime: null,
						ModuleEndTime: this.assignmentDetails[0].assignmentEndTime,
						ModuleEndDate: {
							startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
							endDate: null,
						},
						ModuleEndDateTime: null,
					};
				}
			}

			///Check next Module Time and Date
			if (i < this.courseModulesList.length - 1) {
				this.courseModulesList[i + 1].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
					this.courseModulesList[i + 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
					this.courseModulesList[i + 1].ModuleStartTime
				);
				this.courseModulesList[i].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
					this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD'),
					this.courseModulesList[i].ModuleStartTime
				);
				console.log('------------1--------i--', this.courseModulesList[i].ModuleStartDateTime);
				console.log('------------1------i + 1----', this.courseModulesList[i + 1].ModuleStartDateTime);
				if (
					new Date(this.courseModulesList[i].ModuleStartDateTime) >
					new Date(this.courseModulesList[i + 1].ModuleStartDateTime)
				) {
					console.log('------------2----------');
					//need to check all new Moduel date and Time
					this.courseModulesList = this.courseModulesList.map((data, index) => {
						if (index > i && data.isPublish == false) {
							data.ModuleStartTime = this.courseModulesList[i].ModuleStartTime;
							data.ModuleStartDate = {
								startDate: this.courseModulesList[i].ModuleStartDate.startDate,
								endDate: null,
							};
							data.ModuleStartDateTime = null;
							data.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
							data.ModuleEndDate = {
								startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
								endDate: null,
							};
							data.ModuleEndDateTime = null;
						}

						return data;
					});
				}
			}
		}
	}

	checkValidationForModuleWiseEndDateTime(i) {
		if (
			this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD') &&
			this.courseModulesList[i].ModuleEndTime
		) {
			this.courseModulesList[i].ModuleEndDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleEndTime
			);

			this.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
				this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
				this.assignmentDetails[0].assignmentEndTime
			);

			if (
				new Date(this.courseModulesList[i].ModuleEndDateTime) <
					new Date(this.courseModulesList[i].ModuleStartDateTime) ||
				new Date(this.courseModulesList[i].ModuleEndDateTime) < new Date() ||
				new Date(this.courseModulesList[i].ModuleEndDateTime) >
					new Date(this.assignmentDetails[0].assignmentEndDateTime)
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectendDate'),
					this.appService.getTranslation('Utils.error')
				);

				this.courseModulesList[i] = {
					...this.courseModulesList[i],
					// ModuleStartTime: this.courseModulesList[i - 1].ModuleStartTime,
					// ModuleStartDate: {
					// 	startDate: this.courseModulesList[i - 1].ModuleStartDate.startDate,
					// 	endDate: null,
					// },
					// ModuleStartDateTime: null,
					ModuleEndTime: this.assignmentDetails[0].assignmentEndTime,
					ModuleEndDate: {
						startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
						endDate: null,
					},
					ModuleEndDateTime: null,
				};
				return;
			}
		}
	}

	upgradePathwayAssignment() {
		console.log('----this.editAssignmentId--', this.editAssignmentId);
		console.log('----this.assignPathway.pathwayId--', this.assignPathway.pathwayId);
		let payload = {
			PathwayId: parseInt(this.assignPathway.pathwayId),
			DiwoAssignmentId: this.editAssignmentId,
		};

		this.assignmentService.upgradePathwayAssignment(payload).subscribe((res: any) => {
			if (res.success) {
				if (res?.data?.length > 0) {
					let temp = this.beforeViewCourseModuleList;
					this.differentsDetectedInPathwayAndAssignment = false;
					this.viewChanges = false;
					this.deletedModuleCount = 0;
					this.afterViewChangesCourseModuleList = [];
					this.updateNewVersion = true;
					for (const module of res.data) {
						let isCertificate = false;
						if (module.isAssignmentCertification != undefined) {
							isCertificate = module.isAssignmentCertification;
						} else if (module.isCertificationModule != undefined) {
							isCertificate = module.isCertificationModule;
						} else {
							isCertificate = false;
						}
						let payload = {
							id: module.id ? module.id : null,
							DiwoAssignmentId: module.DiwoAssignmentId,
							WorkbookId: module.WorkbookId,
							ModuleName: module.ModuleName,
							ModuleTypeName: module.ModuleTypeName,
							DiwoModuleId: module.DiwoModuleId,
							ModuleStartDate: module.ModuleStartDate ? module.ModuleStartDate : null,
							ModuleStartTime: module.ModuleStartDate ? this.getTimePikerIdByDate(module.ModuleStartDate) : null,
							ModuleEndDate: module.ModuleEndDate ? module.ModuleEndDate : null,
							ModuleEndTime: module.ModuleEndDate ? this.getTimePikerIdByDate(module.ModuleEndDate) : null,
							ModuleIndex: module.ModuleIndex,
							CourseId: module.CourseId,
							CourseIndex: module.CourseIndex,
							CourseName: module.CourseName,
							TrainerId: module.TrainerId,
							isCertificationModule: isCertificate,
							ModuleDepedencyIndex: this.setDependencyIndexs(module.ModuleDepedencyIndex),
							CourseVersion: module.CourseVersion,
							isPublish: module.isPublish,
							isAssignmentCertification: isCertificate,
							Workbook: module.Workbook,
							newModule: false,
							changeSequency: false,
							isCourseModified: false,
							isUpdated: false,
							isnewCourse: false,
							isChangeDependency: false,
						};
						if (module.ModuleStartDate && module.ModuleEndDate) {
							let date1 = moment(module.ModuleStartDate).format('YYYY-MM-DD');
							let date2 = moment(module.ModuleEndDate).format('YYYY-MM-DD');
							payload.ModuleStartDate = { startDate: moment(date1).subtract(0, 'days').startOf('day'), endDate: null };
							payload.ModuleEndDate = { startDate: moment(date2).subtract(0, 'days').startOf('day'), endDate: null };
						}
						// Need to check New Module, New Course, Sequency, COurse Modifiy or not
						let newModule = true;
						let isnewCourse = true;
						let changeSequency = true;
						let isUpdate = false;
						let isChangeDependency = false;
						for (let module of temp) {
							//For Dependency
							if (module.WorkbookId == payload.WorkbookId && module.CourseId == payload.CourseId) {
								if (module.ModuleDepedencyIndex.length != payload.ModuleDepedencyIndex.length) {
									isChangeDependency = true;
								} else {
									for (let temp of module.ModuleDepedencyIndex) {
										if (payload.ModuleDepedencyIndex.indexOf(temp) == -1) {
											isChangeDependency = true;
											break;
										}
									}
								}
							}

							if (
								module.WorkbookId != payload.WorkbookId &&
								module?.Workbook?.BaseWorkbookId == payload?.Workbook?.BaseWorkbookId &&
								module.CourseId == payload.CourseId &&
								module.isPublish == false
							) {
								isUpdate = true;
								changeSequency = false;
								newModule = false;
								isnewCourse = false;
							} else if (module.WorkbookId == payload.WorkbookId && module.CourseId == payload.CourseId) {
								newModule = false;
								isnewCourse = false;
								if (module.ModuleIndex == payload.ModuleIndex) {
									changeSequency = false;
								}
							} else if (
								module.WorkbookId == payload.WorkbookId &&
								module.CourseId == null &&
								payload.CourseId == null
							) {
								newModule = false;
								isnewCourse = false;
							}
							if (module.CourseId == payload.CourseId) {
								isnewCourse = false;
							}
						}
						payload.newModule = newModule;
						payload.changeSequency = changeSequency;
						payload.isUpdated = isUpdate;
						payload.isnewCourse = isnewCourse;
						payload.isChangeDependency = isChangeDependency;
						payload.isCourseModified = newModule == true || changeSequency == true || isUpdate == true ? true : false;
						if (newModule == true || changeSequency == true || isUpdate == true || isChangeDependency == true) {
							this.differentsDetectedInPathwayAndAssignment = true;
							this.afterViewChangesCourseModuleList = this.afterViewChangesCourseModuleList.map((data) => {
								if (data.CourseId == payload.CourseId) {
									data.isCourseModified = true;
									return data;
								} else {
									return data;
								}
							});
						}

						this.afterViewChangesCourseModuleList.push(payload);

						if (isnewCourse) {
							this.afterViewChangesCourseModuleList = this.afterViewChangesCourseModuleList.map((data) => {
								if (data.CourseId == payload.CourseId) {
									data.isnewCourse = true;
									return data;
								} else {
									return data;
								}
							});
						}
					}
					if (this.afterViewChangesCourseModuleList.length != this.beforeViewCourseModuleList.length) {
						this.differentsDetectedInPathwayAndAssignment = true;
					}
					console.log('===============', temp);
					console.log('========= this.afterViewChangesCourseModuleList======', this.afterViewChangesCourseModuleList);
					for (let data of this.courseModulesList) {
						let flag = true;
						for (let _data of this.afterViewChangesCourseModuleList) {
							if (
								(_data?.WorkbookId == data?.WorkbookId ||
									_data?.Workbook?.BaseWorkbookId == data?.Workbook?.BaseWorkbookId) &&
								_data.CourseId == data.CourseId
							) {
								flag = false;
								break;
							}
						}
						if (flag) {
							this.deletedModuleCount++;
						}
					}
					console.log('=------this.deletedModuleCount-----', this.deletedModuleCount);
				}
				console.log('-----this.afterViewChangesCourseModuleList-------', this.afterViewChangesCourseModuleList);
				//Check Have any upde present in the new Assignment

				// this.toastr.success(
				// 	this.appService.getTranslation('Pages.DiwoAssignment.Toaster.upgradePathwayAssignment'),
				// 	this.appService.getTranslation('Utils.success')
				// );

				// this.getPathwayForAssignment(parseInt(this.assignPathway.pathwayId));
				// this.getPathwayAssignmentList(parseInt(this.assignPathway.pathwayId), this.page, this.limit);
			} else {
				this.toastr.error(res.error, 'Error');
			}
		});
	}
	viewChange() {
		if (this.viewChanges) {
			this.courseModulesList = this.afterViewChangesCourseModuleList;
		} else {
			this.courseModulesList = this.beforeViewCourseModuleList;
		}

		let index = 0;
		for (let data of this.courseModulesList) {
			if (
				data.ModuleDepedencyIndex == null ||
				data.ModuleDepedencyIndex == '' ||
				data.ModuleDepedencyIndex.length == 0
			) {
				data.ModuleDepedencyIndex = 'No Dependency';
			}
			if (
				data?.ModuleStartDate == null ||
				data?.ModuleStartTime == null ||
				data?.ModuleEndDate == null ||
				data?.ModuleEndTime == null
			) {
				if (index == 0) {
					data.ModuleStartDate = {
						startDate: this.assignmentDetails[0].assignmentStartDate.startDate,
						endDate: null,
					};
					data.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
					data.ModuleEndDate = {
						startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
						endDate: null,
					};
					data.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
					data.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
						this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
						this.assignmentDetails[0].assignmentStartTime
					);
					data.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
						this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
						this.assignmentDetails[0].assignmentEndTime
					);
				} else {
					data.ModuleStartDate = {
						startDate: this.courseModulesList[index - 1].ModuleStartDate.startDate,
						endDate: null,
					};
					data.ModuleStartTime = this.courseModulesList[index - 1].ModuleStartTime;
					data.ModuleEndDate = {
						startDate: this.courseModulesList[index - 1].ModuleEndDate.startDate,
						endDate: null,
					};
					data.ModuleEndTime = this.courseModulesList[index - 1].ModuleEndTime;
					data.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
						this.courseModulesList[index - 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
						this.courseModulesList[index - 1].ModuleStartTime
					);
					data.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
						this.courseModulesList[index - 1].ModuleEndDate.startDate.format('YYYY-MM-DD'),
						this.courseModulesList[index - 1].ModuleEndTime
					);
				}
			}
			index++;
		}
	}

	setDependencyIndexs(data) {
		if (data == 'No Dependency' || data == null || data == '') {
			return [];
		} else {
			return data.split(',').map(Number);
		}
	}
}
