import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagetDiwoAssignmentService } from './manage-diwo-course-assignment.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../app.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-diwo-course-assignment',
	templateUrl: './manage-diwo-course-assignment.component.html',
	styleUrls: ['./manage-diwo-course-assignment.component.scss'],
	animations: [routerTransition()],
})
export class ManageDiwoCourseAssignmentComponent implements OnInit {
	courseDetailsChanges = false;
	differentsDetectedInCourseAndAssignment = false;
	viewChanges = false;
	assetBasePath = environment.imageHost + environment.imagePath;
	userClientId: any;
	userDetails: any;
	userRoleId: string;

	assignCourse: any;
	courseDetail: any = [];

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
	}[];
	editAssignmentId = null;
	isViewedMode: boolean = false;
	scrollList: HTMLElement | any;
	selectedAssignmentIdForRemove: any;

	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	beforeViewChange = [];
	beforeViewCourseModuleList = [];
	afterViewChangesCourseModuleList: any = [];
	deletedModuleCount: number = 0;

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
		this.assignCourse = this.route.params['_value'];
		if (this.assignCourse && this.assignCourse.courseId) {
			this.getCourseForAssignment(parseInt(this.assignCourse.courseId));
			this.getCourseAssignmentList(parseInt(this.assignCourse.courseId), this.page, this.limit);
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
				break;
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
				return;
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
				return;
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
					// assignmentEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
					assignmentEndDate: {
						startDate: moment(this.assignmentDetails[0].assignmentStartDateTime).subtract(0, 'days').add(1, 'days'),
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

	getCourseForAssignment(courseId) {
		this.assignmentService.getCourseByIdForAssignment(courseId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					if (res.data.courseDetail) {
						this.courseDetail = res.data.courseDetail;
					}
					if (res.data && res.data.courseModuleData && res.data.courseModuleData.length > 0) {
						this.courseModulesList = [];
						for (let item of res.data.courseModuleData) {
							let payload = {
								CourseId: item.CourseId,
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
								TrainerId: null,
								isCertificationModule: item.isCertificationModule,
								isPublish: false,
							};
							this.courseModulesList.push(payload);
						}
					}
				}
			}
		});
	}

	showAssignmentAddFlow() {
		this.isViewedMode = false;
		this.assignmentAddScreen = true;
		this.differentsDetectedInCourseAndAssignment = false;
		this.courseDetailsChanges = false;
		if (this.editAssignmentId != null) {
			this.getCourseForAssignment(parseInt(this.assignCourse.courseId));
			this.getCourseAssignmentList(parseInt(this.assignCourse.courseId), this.page, this.limit);
		}
		this.initialiseAssignmentDetails();
	}

	showModuleList() {
		this.showModuleListScreen = !this.showModuleListScreen;
	}

	// assignAssignmentDatesToModules(type) {
	// 	if (!this.isViewedMode) {
	// 		this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
	// 			this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
	// 			this.assignmentDetails[0].assignmentStartTime
	// 		);

	// 		this.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
	// 			this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
	// 			this.assignmentDetails[0].assignmentEndTime
	// 		);

	// 		for (let item of this.courseModulesList) {
	// 			if (!item.isPublish) {
	// 				//Check Start Date and End Date
	// 				//For Start Date
	// 				item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
	// 					item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
	// 					item.ModuleStartTime
	// 				);
	// 				if (item.ModuleStartDate?.startDate?.format('YYYY-MM-DD') && item.ModuleStartTime) {
	// 					if (
	// 						item.ModuleStartDateTime &&
	// 						this.assignmentDetails[0].assignmentStartDateTime &&
	// 						new Date(item.ModuleStartDateTime) < new Date(this.assignmentDetails[0].assignmentStartDateTime)
	// 					) {
	// 						item.ModuleStartDate = this.assignmentDetails[0].assignmentStartDate;
	// 						item.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
	// 						item.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
	// 							item.ModuleStartDate.startDate.format('YYYY-MM-DD'),
	// 							item.ModuleStartTime
	// 						);
	// 					}
	// 				}
	// 				//for End Date
	// 				item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
	// 					item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
	// 					item.ModuleEndTime
	// 				);
	// 				if (item.ModuleEndDate?.startDate?.format('YYYY-MM-DD') && item.ModuleEndTime) {
	// 					if (
	// 						item.ModuleEndDateTime &&
	// 						this.assignmentDetails[0].assignmentEndDateTime &&
	// 						new Date(item.ModuleEndDateTime) > new Date(this.assignmentDetails[0].assignmentEndDateTime)
	// 					) {
	// 						item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
	// 						item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
	// 						item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
	// 							item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
	// 							item.ModuleEndTime
	// 						);
	// 					}
	// 				}

	// 				if (item.ModuleStartDateTime && item.ModuleEndDateTime) {
	// 					if (new Date(item.ModuleStartDateTime) > new Date(item.ModuleEndDateTime)) {
	// 						item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
	// 						item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
	// 						item.ModuleEndDateTime = this.getDateByDateAndTimePickerId(
	// 							item.ModuleEndDate.startDate.format('YYYY-MM-DD'),
	// 							item.ModuleEndTime
	// 						);
	// 					}
	// 				}
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
		console.log('-event-', event);
	}

	onSelectTrainer(i) {}

	saveAssignCourse(Published) {
		if (!this.isViewedMode) {
			let flag = false;
			if (this.assignmentDetails[0].selectedLearnerGroup.length == 0) {
				this.assignmentDetails[0].isLearnerGroupNotSelected = true;
				flag = true;
			}

			let payload = {
				assignmentDetails: this.assignmentDetails,
				selectedModuleList: this.courseModulesList,
				updateNewVersion: this.viewChanges,
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
				this.assignmentService.createDiwoCourseAssignment(this.assignCourse.courseId, payload).subscribe((res: any) => {
					if (res.success) {
						this.spinnerService.hide();
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoCourseAssignment.Toaster.createAssignment'),
							this.appService.getTranslation('Utils.success')
						);
						this.assignmentAddScreen = false;
						this.appService.checkNotifcation = true;
						this.getCourseForAssignment(parseInt(this.assignCourse.courseId));
						this.getCourseAssignmentList(parseInt(this.assignCourse.courseId), this.page, this.limit);
						this.scrollToAssignmentTable();
						this.initialiseAssignmentDetails();
					} else {
						this.spinnerService.hide();
					}
				});
			} else {
				this.assignmentService
					.updateDiwoCourseAssignment(this.editAssignmentId, this.assignCourse.courseId, payload)
					.subscribe((res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation('Pages.DiwoCourseAssignment.Toaster.createAssignment'),
								this.appService.getTranslation('Utils.success')
							);
							this.assignmentAddScreen = false;
							this.appService.checkNotifcation = true;
							this.differentsDetectedInCourseAndAssignment = false;
							this.courseDetailsChanges = false;
							this.viewChanges = false;
							this.getCourseForAssignment(parseInt(this.assignCourse.courseId));
							this.getCourseAssignmentList(parseInt(this.assignCourse.courseId), this.page, this.limit);
							this.scrollToAssignmentTable();
							this.initialiseAssignmentDetails();
						} else {
							this.spinnerService.hide();
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

	cancelAssignCourse() {
		this.router.navigate(['/diwo-courses']);
	}

	editAssignment(item, isViewed) {
		this.isViewedMode = isViewed;
		this.assignmentAddScreen = true;
		this.editAssignmentId = item.assignmentId;
		this.assignmentService.getDiwoAssimentByAssignmentId(item.assignmentId).subscribe((res: any) => {
			if (res.success) {
				const assignmentData = res.data?.assignmentData?.[0];
				if (assignmentData?.assignmentCopy) {
					this.checkCourseDetailsChange(assignmentData.assignmentCopy);
				}
				if (assignmentData) {
					if (assignmentData.DiwoModuleAssigns && assignmentData.DiwoModuleAssigns.length > 0) {
						this.courseModulesList = [];
						for (const module of assignmentData.DiwoModuleAssigns) {
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
								TrainerId: module.TrainerId,
								isPublish: module.isPublish,
								Workbook: module.Workbook,
							};

							let date1 = moment(module.ModuleStartDate).format('YYYY-MM-DD');
							let date2 = moment(module.ModuleEndDate).format('YYYY-MM-DD');
							payload.ModuleStartDate = { startDate: moment(date1).subtract(0, 'days').startOf('day'), endDate: null };
							payload.ModuleEndDate = { startDate: moment(date2).subtract(0, 'days').startOf('day'), endDate: null };

							this.courseModulesList.push(payload);
						}
						this.beforeViewCourseModuleList = [...this.courseModulesList];
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

				this.upgradeCourseAssignment();
			}
		});
	}

	checkCourseDetailsChange(assigmentCourseDetails) {
		this.courseDetailsChanges = false;
		if (assigmentCourseDetails && JSON.parse(assigmentCourseDetails)?.Course) {
			const courseDetails = JSON.parse(assigmentCourseDetails).Course;
			if (courseDetails?.title && courseDetails.title !== this.courseDetail.title) {
				this.courseDetailsChanges = true;
			}
			if (courseDetails?.learningoutcomes && courseDetails.learningoutcomes !== this.courseDetail.learningoutcomes) {
				this.courseDetailsChanges = true;
			}
			if (courseDetails?.l_outcomes && courseDetails.l_outcomes !== this.courseDetail.l_outcomes) {
				this.courseDetailsChanges = true;
			}
			if (courseDetails?.e_duration && courseDetails.e_duration !== this.courseDetail.e_duration) {
				this.courseDetailsChanges = true;
			}
		}
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
				$('#assignmentDeleteModel').modal('hide');
				this.getCourseForAssignment(parseInt(this.assignCourse.courseId));
				this.getCourseAssignmentList(parseInt(this.assignCourse.courseId), this.page, this.limit);
				this.toastr.success(
					this.appService.getTranslation('Pages.DiwoCourseAssignment.Toaster.assignmentdeleted'),
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

	getCourseAssignmentList(moduleId, page, limit) {
		this.assignmentService.getCourseAssignmentList(moduleId, page, limit).subscribe((res: any) => {
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
		this.getCourseAssignmentList(this.assignCourse.courseId, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getCourseAssignmentList(this.assignCourse.courseId, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getCourseAssignmentList(this.assignCourse.courseId, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getCourseAssignmentList(this.assignCourse.courseId, this.page, this.limit);
		}
	}

	upgradeCourseAssignment() {
		console.log('----this.editAssignmentId--', this.editAssignmentId);
		console.log('----this.assignPathway.pathwayId--', this.assignCourse.courseId);
		let payload = {
			CourseId: parseInt(this.assignCourse.courseId),
			DiwoAssignmentId: this.editAssignmentId,
		};
		this.assignmentService.upgradeCourseAssignment(payload).subscribe((res: any) => {
			console.log('---RES---', res);
			if (res.success) {
				this.afterViewChangesCourseModuleList = [];
				this.deletedModuleCount = 0;
				for (const module of res.data) {
					const payload = {
						// DiwoAssignmentId: module.DiwoAssignmentId,
						id: module?.id ? module.id : null,
						WorkbookId: module.WorkbookId,
						ModuleName: module.ModuleName,
						ModuleTypeName: module.ModuleTypeName,
						DiwoModuleId: module.DiwoModuleId,

						// ModuleStartDate: module.ModuleStartDate,
						// ModuleStartTime: this.getTimePikerIdByDate(module.ModuleStartDate),
						// ModuleEndDate: module.ModuleEndDate,
						// ModuleEndTime: this.getTimePikerIdByDate(module.ModuleEndDate),

						ModuleStartDate: module?.ModuleStartDate ? module.ModuleStartDate : null,
						ModuleStartTime: module?.ModuleStartDate ? this.getTimePikerIdByDate(module.ModuleStartDate) : null,
						ModuleEndDate: module?.ModuleEndDate ? module.ModuleEndDate : null,
						ModuleEndTime: module?.ModuleEndDate ? this.getTimePikerIdByDate(module.ModuleEndDate) : null,

						ModuleIndex: module.ModuleIndex,
						CourseId: module.CourseId,
						TrainerId: module?.TrainerId ? module.TrainerId : null,
						isPublish: module.isPublish,
						Workbook: module.Workbook,
						isAssignmentCertification: module?.isAssignmentCertification
							? module.isAssignmentCertification
							: module?.isCertificationModule
							? module.CertificationModule
							: false,
						isCertificationModule: module?.isAssignmentCertification
							? module.isAssignmentCertification
							: module?.isCertificationModule
							? module.CertificationModule
							: false,
					};

					if (module.ModuleStartDate && module.ModuleEndDate) {
						let date1 = moment(module.ModuleStartDate).format('YYYY-MM-DD');
						let date2 = moment(module.ModuleEndDate).format('YYYY-MM-DD');
						payload.ModuleStartDate = { startDate: moment(date1).subtract(0, 'days').startOf('day'), endDate: null };
						payload.ModuleEndDate = { startDate: moment(date2).subtract(0, 'days').startOf('day'), endDate: null };
					}

					this.afterViewChangesCourseModuleList.push(payload);
				}
				this.differentsDetectedInCourseAndAssignment = false;
				this.viewChanges = false;
				if (this.afterViewChangesCourseModuleList.length != this.beforeViewCourseModuleList.length) {
					this.differentsDetectedInCourseAndAssignment = true;
				}
				for (let module of this.afterViewChangesCourseModuleList) {
					module.isNew = false;
					module.isUpdated = false;
					module.isSequencyChange = false;
					let flag = true;
					for (let _module of this.beforeViewCourseModuleList) {
						if (
							module.WorkbookId != _module.WorkbookId &&
							module?.Workbook?.BaseWorkbookId == _module?.Workbook?.BaseWorkbookId
						) {
							console.log('-0---------------------');
							module.isUpdated = true;
							flag = false;
							this.differentsDetectedInCourseAndAssignment = true;
						} else if (module.WorkbookId == _module.WorkbookId) {
							flag = false;
							if (module.ModuleIndex != _module.ModuleIndex) {
								this.differentsDetectedInCourseAndAssignment = true;
								module.isSequencyChange = true;
							}
						}
					}
					if (flag) {
						module.isNew = true;
						this.differentsDetectedInCourseAndAssignment = true;
					}
				}
				console.log('---this.beforeViewCourseModuleList---', this.beforeViewCourseModuleList);
				console.log('---this.afterViewChangesCourseModuleList---', this.afterViewChangesCourseModuleList);
				console.log('---this.differentsDetectedInCourseAndAssignment---', this.differentsDetectedInCourseAndAssignment);

				//Check How mnay module deleted in this new Update
				for (let module of this.beforeViewCourseModuleList) {
					let flag = true;
					for (let _module of this.afterViewChangesCourseModuleList) {
						if (
							_module.WorkbookId == module.WorkbookId ||
							_module.Workbook.BaseWorkbookId == module.Workbook.BaseWorkbookId
						) {
							flag = false;
							break;
						}
					}
					if (flag) {
						this.deletedModuleCount++;
					}
				}

				console.log('---deletedModuleCount---', this.deletedModuleCount);
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

		// this.courseModulesList = this.courseModulesList.map((data, index) => {
		// 	if (
		// 		data.ModuleDepedencyIndex == null ||
		// 		data.ModuleDepedencyIndex == '' ||
		// 		data.ModuleDepedencyIndex.length == 0
		// 	) {
		// 		data.ModuleDepedencyIndex = 'No Dependency';
		// 	}

		// 	if (
		// 		data?.ModuleStartDate == null ||
		// 		data?.ModuleStartTime == null ||
		// 		data?.ModuleEndDate == null ||
		// 		data?.ModuleEndTime == null
		// 	) {
		// 		if (index == 0) {
		// 			data.ModuleStartDate = {
		// 				startDate: this.assignmentDetails[0].assignmentStartDate.startDate,
		// 				endDate: null,
		// 			};
		// 			data.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
		// 			data.ModuleEndDate = {
		// 				startDate: this.assignmentDetails[0].assignmentEndDate.startDate,
		// 				endDate: null,
		// 			};
		// 			data.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
		// 		} else {
		// 			data.ModuleStartDate = {
		// 				startDate: this.courseModulesList[index - 1].ModuleStartDate.startDate,
		// 				endDate: null,
		// 			};
		// 			data.ModuleStartTime = this.courseModulesList[index - 1].ModuleStartTime;
		// 			data.ModuleEndDate = {
		// 				startDate: this.courseModulesList[index - 1].ModuleEndDate.startDate,
		// 				endDate: null,
		// 			};
		// 			data.ModuleEndTime = this.courseModulesList[index - 1].ModuleEndTime;
		// 			data.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
		// 				this.courseModulesList[index - 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
		// 				this.courseModulesList[index - 1].ModuleStartTime
		// 			);
		// 			data.ModuleStartDateTime = this.getDateByDateAndTimePickerId(
		// 				this.courseModulesList[index - 1].ModuleStartDate.startDate.format('YYYY-MM-DD'),
		// 				this.courseModulesList[index - 1].ModuleStartTime
		// 			);
		// 		}
		// 	}
		// 	return data;
		// });
	}

	onSelectModuleStartDate(event, i) {
		if (event.startDate && event.endDate && i >= 0) {
			this.checkValidationForModuleWiseStartDateTime(i);
		}
	}

	onSelectModuleStartTime(event, i) {
		if (event && i >= 0) {
			this.checkValidationForModuleWiseStartDateTime(i);
		}
	}

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
						this.toastr.error(
							this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
							this.appService.getTranslation('Utils.error')
						);
						flag = true;
					}
				}
			}

			if (new Date(this.courseModulesList[i].ModuleStartDateTime) < new Date()) {
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
				console.log('------------1----------');
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

	onSelectModuleEndTime(event, i) {
		if (event && i >= 0) {
			this.checkValidiationForModuleEndDateTime(i);
		}
	}

	checkValidiationForModuleEndDateTime(i) {
		if (
			this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD') &&
			this.courseModulesList[i].ModuleEndTime
		) {
			this.courseModulesList[i].ModuleEndDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleEndTime
			);
		}
		if (
			this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD') &&
			this.courseModulesList[i].ModuleStartTime
		) {
			this.courseModulesList[i].ModuleStartDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleStartDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleStartTime
			);
		}
		if (
			this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD') &&
			this.assignmentDetails[0].assignmentStartTime
		) {
			this.assignmentDetails[0].assignmentStartDateTime = this.getDateByDateAndTimePickerId(
				this.assignmentDetails[0].assignmentStartDate.startDate.format('YYYY-MM-DD'),
				this.assignmentDetails[0].assignmentStartTime
			);
		}
		if (
			this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD') &&
			this.assignmentDetails[0].assignmentEndTime
		) {
			this.assignmentDetails[0].assignmentEndDateTime = this.getDateByDateAndTimePickerId(
				this.assignmentDetails[0].assignmentEndDate.startDate.format('YYYY-MM-DD'),
				this.assignmentDetails[0].assignmentEndTime
			);
		}

		let flag = false;
		if (this.courseModulesList[i].ModuleEndDateTime && this.courseModulesList[i].ModuleStartDateTime) {
			if (this.courseModulesList[i].ModuleEndDateTime <= this.courseModulesList[i].ModuleStartDateTime) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}
		}
		if (this.assignmentDetails[0].assignmentEndDateTime && this.courseModulesList[i].ModuleEndDateTime) {
			if (this.assignmentDetails[0].assignmentEndDateTime < this.courseModulesList[i].ModuleEndDateTime) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DiwoAssignment.Toaster.selectstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				flag = true;
			}
		}

		if (flag) {
			this.courseModulesList[i] = {
				...this.courseModulesList[i],
				// ModuleStartTime: this.assignmentDetails[0].assignmentStartTime,
				// ModuleStartDate: {
				// 	startDate: this.assignmentDetails[0].assignmentStartDate.startDate,
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

			this.courseModulesList[i].ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
			this.courseModulesList[i].ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;

			this.courseModulesList[i].ModuleEndDateTime = this.getDateByDateAndTimePickerId(
				this.courseModulesList[i].ModuleEndDate.startDate.format('YYYY-MM-DD'),
				this.courseModulesList[i].ModuleEndTime
			);
		}
	}
}
