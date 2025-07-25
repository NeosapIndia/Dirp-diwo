import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppService } from '../../../app/app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageClosingSessionService } from './closing-session.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-closing-session',
	templateUrl: './closing-session.component.html',
	styleUrls: ['./closing-session.component.css'],
})
export class ManageClosingSessionComponent implements OnInit {
	assetBasePath = environment.imageHost + environment.imagePath;
	selectedDate = null;
	selectedEndDate = null;
	maxImageCount = 10;
	timePicker: any = [];
	date;
	allParticipants = [];
	sessionFeedback;
	uploadMediaModel: any;
	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};

	courseList = [
		{
			title: 'Course 1',
			id: 1,
		},
		{
			title: 'Course 2',
			id: 2,
		},
		{
			title: 'Course 3',
			id: 3,
		},
	];

	workbookList = [
		{
			title: 'Course 1',
			id: 1,
		},
		{
			title: 'Course 2',
			id: 2,
		},
		{
			title: 'Course 3',
			id: 3,
		},
	];

	status = [];
	stepCount = 1;
	editSession: any;
	sessionForm: FormGroup;
	userClientId: any;
	totalPresent: number;
	selectedMediaAssetDetails: any = [];
	data: string;
	showImagepreviews: any = [];
	maxCount = 10;
	sessionData: any;
	takeSurveyUrl: string;
	checkTrainerSurveySubmision: any;
	locationName: string;
	geoTag: boolean = false;
	next30MinDate: any;

	iconObject = {
		info_icon_25: null,
		arrow_icon_rotate: null,
		arrow_icon: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		private route: ActivatedRoute,
		public appService: AppService,
		private closingSessionService: ManageClosingSessionService,
		private router: Router
	) {}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.createsessionForm();
		this.createTimerPicker();

		this.next30MinDate = new Date();
		let minutes = this.next30MinDate.getMinutes();
		minutes = minutes < 30 ? 30 : 60;
		this.next30MinDate.setMinutes(minutes, 0, 0);

		this.editSession = this.route.params['_value'];
		if (this.editSession && this.editSession.sessionId) {
			this.getParticipantList();
			this.closingSessionService.getSessionById(this.editSession.sessionId).subscribe((res: any) => {
				if (res.success) {
					this.sessionData = res.data;
					if (this.sessionData && this.sessionData.Workbook) {
						this.geoTag = this.sessionData.Workbook.geoTag;
						// console.log('---geoTag--', this.geoTag);
					}

					if (this.sessionData.trainerSurvey) {
						this.status = [1, 2, 3, 4, 5];
					} else {
						this.status = [1, 2, 3, 4];
					}
					for (let item of res.data.SessionPhotographs) {
						this.showImagepreviews.push(item);
					}
					this.sessionForm.patchValue(res.data);
					let date = res.data.dateWithTime;
					let date2 = moment(date).format('YYYY-MM-DD');
					let date3 = moment().format('YYYY-MM-DD');
					this.sessionForm.controls['time'].setValue(this.getTimePikerIdByDate(res.data.dateWithTime));
					// this.selectedDate = { startDate: moment(date).subtract(0, 'days').startOf('day'), endDate: moment(date).subtract(0, 'days').startOf('day') }
					this.selectedDate = { startDate: moment(date2).subtract(0, 'days').startOf('day'), endDate: null };
					this.selectedEndDate = {
						startDate: moment(date3).subtract(0, 'days').startOf('day'),
						endDate: moment(date3).subtract(0, 'days').startOf('day'),
					};
					this.sessionForm.controls['date'].setValue(res.data.dateWithTime);
					this.sessionForm.controls['endtime'].setValue(this.getTimePikerIdByDate(this.next30MinDate.toISOString()));
				}
			});
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getParticipantList() {
		this.closingSessionService.getParticipantList(this.editSession.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.allParticipants = [];
				this.allParticipants = res.data;
				this.totalPresent = 0;
				for (let participant of this.allParticipants) {
					if (participant.attendanceStatus == 'Present') {
						this.totalPresent++;
					}
				}
			}
		});
	}

	createsessionForm() {
		this.sessionForm = this.formBuilder.group({
			id: [null],
			title: [null, Validators.required],
			location: [null],
			date: [null, Validators.required],
			time: [null, Validators.required],
			dateWithTime: [null, Validators.required],
			enddate: [null, Validators.required],
			endtime: [null, Validators.required],
			enddateWithTime: [null, Validators.required],
			language: [null, Validators.required],
			latitude: [null],
			longitude: [null],
			geoLocation: [null],
		});
	}
	get f1() {
		return this.sessionForm.controls;
	}

	createTimerPicker() {
		let timerId = 0;
		for (let HH = 0; HH <= 23; HH++) {
			for (let MM = 0; MM <= 45; MM = MM + 30) {
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

	forwardStep() {
		let flag = false;
		if (this.stepCount == 1) {
			this.sessionForm.controls['dateWithTime'].setValue(
				this.getDateByDateAndTimePickerId(
					this.selectedDate.startDate.format('YYYY-MM-DD'),
					this.sessionForm.controls['time'].value
				)
			);

			this.sessionForm.controls['enddateWithTime'].setValue(
				this.getDateByDateAndTimePickerId(
					this.selectedEndDate.startDate.format('YYYY-MM-DD'),
					this.sessionForm.controls['endtime'].value
				)
			);

			if (this.sessionForm.invalid) {
				this.markAsTouched(this.sessionForm);
				return;
			}
		}

		if (this.sessionData.trainerSurvey && this.stepCount == 3) {
			this.closingSessionService.getSessionById(this.editSession.sessionId).subscribe((res: any) => {
				if (res.success) {
					this.sessionData = res.data;

					for (let worksheet of this.sessionData.SessionWorksheets) {
						if (
							worksheet.trainerSurvey &&
							worksheet.trainerSurveyComp &&
							(!worksheet.submit || worksheet.submit == null)
						) {
							flag = true;
						}
					}

					if (flag) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Session.CloseSession.Toaster.pleasesubmitsurvey'),
							this.appService.getTranslation('Utils.error')
						);
						return;
					}
				}
			});
		}

		if (
			(this.sessionData.trainerSurvey && this.stepCount == 3) ||
			(!this.sessionData.trainerSurvey && this.stepCount == 3)
		) {
			let isSessionClosed = true;
			this.sessionForm.value.isSessionClosed = isSessionClosed;
			this.sessionForm.value.stepCount = this.stepCount;
			this.closingSessionService
				.updateSession(this.sessionForm.value, this.userClientId, this.editSession.sessionId)
				.subscribe((res: any) => {
					if (res.success) {
						this.sessionForm.patchValue(res.data);
						this.sessionFeedback = res.data.trainerNote;
					}
				});
		}

		setTimeout(() => {
			if (this.sessionData.trainerSurvey) {
				if (this.stepCount <= 4 && !flag) {
					this.stepCount++;
				}
			} else {
				if (this.stepCount <= 3 && !flag) {
					this.stepCount++;
				}
			}
		}, 100);

		// if (this.sessionData.trainerSurvey && this.stepCount !== 2) {
		// 	clearInterval(this.checkTrainerSurveySubmision);
		// }
	}

	backStep() {
		if (this.stepCount > 1) {
			this.stepCount--;
		}

		// if (this.sessionData.trainerSurvey && this.stepCount !== 2) {
		// 	clearInterval(this.checkTrainerSurveySubmision);
		// }
	}

	editAttendance(status, id) {
		this.closingSessionService.changeParticipantAttendanceStatus(status, id).subscribe((res: any) => {
			this.getParticipantList();
		});
	}

	addUserNote(note, id) {
		if (note != null && note != '') {
			let payload = {
				trainerNote: note,
			};
			this.closingSessionService.addUserNote(payload, id).subscribe((res: any) => {});
		}
	}

	closeSession() {
		let payload = {
			trainerNote: this.sessionFeedback,
		};
		this.closingSessionService.closeSession(payload, this.sessionForm.value.id).subscribe((res: any) => {
			if (res.success) {
				this.router.navigate(['session']);
			}
		});
	}

	uploadMedia(event) {
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.uploadMediaModel = undefined;
			let flag = false;
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;
				// console.log('-mediaType-', mediaType);
				fileName = fileName
					.replace('.pdf', '')
					.replace('.png', '')
					.replace('.jpg', '')
					.replace('.mp4', '')
					.replace('.pptx', '');
				if (mediaType.includes('image')) {
					mediaType = 'Image';
				} else if (mediaType.includes('pdf')) {
					mediaType = 'PDF';
				} else if (mediaType.includes('video')) {
					mediaType = 'Video';
				} else if (mediaType.includes('vnd.openxmlformats-officedocument.presentationml.presentation')) {
					mediaType = 'PPT';
				}
				let payload = {
					fileType: mediaType,
					otherDetails: media,
				};
				if (mediaType == 'Image' && media.size >= 5242880) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Session.CloseSession.Toaster.maxImageSize'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (mediaType == 'PDF' && media.size >= 10485760) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Session.CloseSession.Toaster.maxPDFSize'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (mediaType == 'Video' && media.size >= 104857600) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Session.CloseSession.Toaster.maxVideoSize'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (mediaType == 'PPT' && media.size >= 52428800) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Session.CloseSession.Toaster.maxPPTSize'),
						this.appService.getTranslation('Utils.error')
					);
				} else {
					if (this.selectedMediaAssetDetails.length + this.showImagepreviews.length < this.maxImageCount) {
						this.selectedMediaAssetDetails.push(payload);
					} else {
						flag = true;
					}
				}
			}

			if (flag) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Session.CloseSession.Toaster.maxMediaAddlimit'),
					this.appService.getTranslation('Utils.error')
				);
			}

			for (let asset of this.selectedMediaAssetDetails) {
				const uploadData = new FormData();
				uploadData.append(asset.fileType, asset.otherDetails);
				this.spinnerService.show();
				this.selectedMediaAssetDetails = [];
				this.closingSessionService
					.uploadSessionPhotgraphs(uploadData, this.editSession.sessionId)
					.subscribe((res: any) => {
						this.spinnerService.hide();
						this.selectedMediaAssetDetails = [];
						if (res.success) {
							this.showImagepreviews.push(res.data);
							this.spinnerService.hide();
						}
					});
			}
		}
	}

	cancelImage(index, item) {
		this.closingSessionService.deleteSessionPhotographs(item.id).subscribe((res: any) => {
			if (res.success) {
				this.toastr.success(
					this.appService.getTranslation('Pages.Session.CloseSession.Toaster.sessionphotographdeleted'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
		this.showImagepreviews.splice(index, 1);
	}

	DateChange(value) {
		this.sessionForm.controls['date'].setValue(value);
	}

	EndDateChange(value) {
		this.sessionForm.controls['enddate'].setValue(value);
	}

	takeSurvey(worksheet) {
		this.takeSurveyUrl = `${environment.diwoAppUrl}?trainer_survey=true&worksheetId=${worksheet.id}`;
	}

	getUserLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					this.sessionForm.controls['latitude'].setValue(position.coords.latitude);
					this.sessionForm.controls['longitude'].setValue(position.coords.longitude);
					this.getGeocodedLocation(position.coords.latitude, position.coords.longitude);
				},
				(error) => {
					alert('Error obtaining location');
				}
			);
		} else {
			alert('Geolocation is not supported by this browser.');
		}
	}

	getGeocodedLocation(latitude: number, longitude: number) {
		this.closingSessionService.getLocationName(latitude, longitude).subscribe(
			(response: any) => {
				// console.log('---response', response);
				if (response && response.display_name) {
					this.sessionForm.controls['geoLocation'].setValue(response.display_name);
					// console.log('---location', this.sessionForm.value);
				} else {
					this.locationName = 'Location not found';
				}
			},
			(error) => {
				console.error('Error reverse geocoding location', error);
				this.locationName = 'Error retrieving location';
			}
		);
	}

	endSession() {
		let payload = {
			status: 'Ended',
			trainerNote: this.sessionFeedback,
		};
		this.closingSessionService.endSession(payload, this.sessionForm.value.id).subscribe((res: any) => {
			if (res.success) {
				this.router.navigate(['session-timeline', { sessionId: this.editSession.sessionId }]);
			}
		});
	}
}
