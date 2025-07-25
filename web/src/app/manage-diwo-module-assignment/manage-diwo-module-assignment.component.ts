import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagetDiwoAssignmentService } from './manage-diwo-module-assignment.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../app.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-diwo-module-assignment',
	templateUrl: './manage-diwo-module-assignment.component.html',
	styleUrls: ['./manage-diwo-module-assignment.component.scss'],
	animations: [routerTransition()],
})
export class ManageDiwoModuleAssignmentComponent implements OnInit {
	assetBasePath = environment.imageHost + environment.imagePath;
	userClientId: any;
	userDetails: any;
	userRoleId: string;

	assignModule: any;
	moduleDetail: any = [];

	AllLearnerGroupsDropDownList = [];
	trainerList = [];

	iconObject = {
		add_icon_35: null,
		module_wise_assignment: null,
		info_icon_25: null,
	};

	assignmentAddScreen: boolean = false;

	timePicker: any = [];
	modulesList: any = [];
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
		TrainerId: any;
		id: any;
	}[];
	editAssignmentId = null;
	isViewedMode: boolean = false;
	selectedAssignmentIdForRemove: null;

	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	viewChanges = false;
	differentsDetectedInPathwayAndAssignment = false;
	ModuleDetailsChanges = false;
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
		this.assignModule = this.route.params['_value'];
		if (this.assignModule && this.assignModule.moduleId) {
			this.getModuleForAssignment(parseInt(this.assignModule.moduleId));
			this.getModuleAssignmentList(parseInt(this.assignModule.moduleId), this.page, this.limit);
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
				TrainerId: null,
				id: null,
			},
		];
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
			this.assignAssignmentDatesToModules();
		}
	}

	onSelectAssignmentStartTime(event) {
		if (event) {
			this.checkStartDateAndTimeValidation();
			this.assignAssignmentDatesToModules();
		}
	}

	onSelectAssignmentEndDate(event) {
		if (event.startDate && event.endDate) {
			this.checkEndDateAndTimeValidation();
			this.assignAssignmentDatesToModules();
		}
	}

	onSelectAssignmentEndTime(event) {
		if (event) {
			this.checkEndDateAndTimeValidation();
			this.assignAssignmentDatesToModules();
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
				return;
			}

			if (
				new Date(this.assignmentDetails[0].assignmentStartDateTime) >
				new Date(this.assignmentDetails[0].assignmentEndDateTime)
			) {
				this.assignmentDetails[0] = {
					...this.assignmentDetails[0],
					assignmentEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
					assignmentEndDate: {
						startDate: moment(this.assignmentDetails[0].assignmentStartDateTime).add(1, 'days'),
						endDate: null,
					},
					assignmentEndDateTime: null,
				};
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
					assignmentEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
					assignmentEndDate: {
						startDate: moment().subtract(0, 'days').add(1, 'days'),
						endDate: null,
					},
					assignmentEndDateTime: null,
				};
				return;
			}
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getModuleForAssignment(pathwayId) {
		this.assignmentService.getModuleByIdForAssignment(pathwayId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					if (res.data) {
						this.moduleDetail = res.data._workbook;
					}
					if (this.moduleDetail) {
						this.modulesList = [];
						let payload = {
							id: null,
							WorkbookId: this.moduleDetail.id,
							ModuleName: this.moduleDetail.title,
							DiwoModuleId: this.moduleDetail.DiwoModuleId,
							ModuleTypeName: this.moduleDetail?.DiwoModule?.type,
							ModuleStartDate: { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null },
							ModuleStartTime: this.getTimePikerIdByDate(this.next30MinDate.toISOString()),
							ModuleEndDate: { startDate: moment().subtract(0, 'days').add(1, 'days'), endDate: null },
							ModuleEndTime: this.getTimePikerIdByDate(this.next60MinDate.toISOString()),
							isPublish: false,
						};
						this.modulesList.push(payload);
					}
				}
			}
		});
	}

	showAssignmentAddFlow() {
		this.isViewedMode = false;
		this.assignmentAddScreen = true;
		if (this.editAssignmentId != null) {
			this.getModuleForAssignment(parseInt(this.assignModule.moduleId));
			this.getModuleAssignmentList(parseInt(this.assignModule.moduleId), this.page, this.limit);
		}
		this.initialiseAssignmentDetails();
	}

	assignAssignmentDatesToModules() {
		if (!this.isViewedMode) {
			for (let item of this.modulesList) {
				item.ModuleStartDate = this.assignmentDetails[0].assignmentStartDate;
				item.ModuleStartTime = this.assignmentDetails[0].assignmentStartTime;
				item.ModuleEndDate = this.assignmentDetails[0].assignmentEndDate;
				item.ModuleEndTime = this.assignmentDetails[0].assignmentEndTime;
			}
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

	onSelectTrainer(event) {}

	saveAssignModule(Published) {
		if (!this.isViewedMode) {
			let flag = false;
			if (this.assignmentDetails[0].selectedLearnerGroup.length == 0) {
				this.assignmentDetails[0].isLearnerGroupNotSelected = true;
				flag = true;
			}

			let payload = {
				assignmentDetails: this.assignmentDetails,
				selectedModuleList: this.modulesList,
				updateNewVersion: this.viewChanges,
			};

			payload.selectedModuleList[0].TrainerId = this.assignmentDetails[0].TrainerId;
			if (this.editAssignmentId != null) {
				payload.selectedModuleList[0].id = this.assignmentDetails[0].id;
			}

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
				this.assignmentService.createDiwoModuleAssignment(this.assignModule.moduleId, payload).subscribe((res: any) => {
					if (res.success) {
						this.spinnerService.hide();
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoModuleAssignment.Toaster.createAssignment'),
							this.appService.getTranslation('Utils.success')
						);
						this.assignmentAddScreen = false;
						this.appService.checkNotifcation = true;
						this.getModuleForAssignment(parseInt(this.assignModule.moduleId));
						this.getModuleAssignmentList(parseInt(this.assignModule.moduleId), this.page, this.limit);
						this.scrollToAssignmentTable();
						this.initialiseAssignmentDetails();
						// this.router.navigate(['/workbook']);
					} else {
						this.spinnerService.hide();
						this.toastr.error(res.error, 'Error');
					}
				});
			} else {
				this.assignmentService
					.updateDiwoModuleAssignment(this.editAssignmentId, this.assignModule.moduleId, payload)
					.subscribe((res: any) => {
						if (res.success) {
							this.differentsDetectedInPathwayAndAssignment = false;
							this.ModuleDetailsChanges = false;
							this.viewChanges = false;
							this.spinnerService.hide();
							this.toastr.success(
								this.appService.getTranslation('Pages.DiwoModuleAssignment.Toaster.createAssignment'),
								this.appService.getTranslation('Utils.success')
							);
							this.assignmentAddScreen = false;
							this.appService.checkNotifcation = true;
							this.getModuleForAssignment(parseInt(this.assignModule.moduleId));
							this.getModuleAssignmentList(parseInt(this.assignModule.moduleId), this.page, this.limit);
							this.scrollToAssignmentTable();
							this.initialiseAssignmentDetails();
							// this.router.navigate(['/workbook']);
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

	cancelAssignModule() {
		this.router.navigate(['/module']);
	}

	editAssignment(item, isViewed) {
		this.isViewedMode = isViewed;
		this.assignmentAddScreen = true;
		this.editAssignmentId = item.assignmentId;
		this.assignmentService.getDiwoAssimentByAssignmentId(item.assignmentId).subscribe((res: any) => {
			if (res.success) {
				this.differentsDetectedInPathwayAndAssignment = false;
				this.ModuleDetailsChanges = false;
				const assignmentData = res.data?.assignmentData?.[0];
				if (assignmentData) {
					if (assignmentData?.status == 'Scheduled' && assignmentData?.DiwoModuleAssigns[0]?.isPublish == false) {
						if (assignmentData?.DiwoModuleAssigns[0]?.Workbook.default == false) {
							this.differentsDetectedInPathwayAndAssignment = true;
						}

						if (assignmentData?.DiwoModuleAssigns[0]?.ModuleName !== this.moduleDetail.title) {
							this.ModuleDetailsChanges = true;
						}
					}
					this.assignmentDetails = [];
					let learnerGroups = [];
					if (assignmentData.DiwoAssignUserGroupMappings && assignmentData.DiwoAssignUserGroupMappings.length > 0) {
						for (const group of assignmentData.DiwoAssignUserGroupMappings) {
							learnerGroups.push(group.UserGroupId);
						}
					}

					let TrainerId = null;
					let id = null;
					if (assignmentData.DiwoModuleAssigns && assignmentData.DiwoModuleAssigns.length > 0) {
						for (const module of assignmentData.DiwoModuleAssigns) {
							TrainerId = module.TrainerId;
							id = module.id;
						}
					}

					const payload = {
						id: id,
						selectedLearnerGroup: [...learnerGroups],
						assignmentStartDate: assignmentData.StartDate,
						assignmentStartTime: this.getTimePikerIdByDate(assignmentData.StartDate),
						assignmentEndDate: assignmentData.EndDate,
						assignmentEndTime: this.getTimePikerIdByDate(assignmentData.EndDate),
						assignmentStartDateTime: null,
						assignmentEndDateTime: null,
						isLearnerGroupNotSelected: false,
						status: assignmentData.status,
						TrainerId: TrainerId,
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

				this.assignAssignmentDatesToModules();
			}
		});
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
				this.getModuleForAssignment(parseInt(this.assignModule.moduleId));
				this.getModuleAssignmentList(parseInt(this.assignModule.moduleId), this.page, this.limit);
				$('#assignmentDeleteModel').modal('hide');
				this.toastr.success(
					this.appService.getTranslation('Pages.DiwoModuleAssignment.Toaster.assignmentdeleted'),
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

	getModuleAssignmentList(moduleId, page, limit) {
		this.assignmentService.getModuleAssignmentList(moduleId, page, limit).subscribe((res: any) => {
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
		this.getModuleAssignmentList(this.assignModule.moduleId, this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getModuleAssignmentList(this.assignModule.moduleId, this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getModuleAssignmentList(this.assignModule.moduleId, this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getModuleAssignmentList(this.assignModule.moduleId, this.page, this.limit);
		}
	}
}
