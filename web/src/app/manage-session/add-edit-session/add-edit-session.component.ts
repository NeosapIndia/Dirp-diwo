import { Component, OnInit, AfterViewChecked, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppService } from '../../../app/app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageAddEditSessionService } from './add-edit-session.service';
import * as moment from 'moment';

declare var $: any;

@Component({
	selector: 'app-add-edit-session',
	templateUrl: './add-edit-session.component.html',
	styleUrls: ['./add-edit-session.component.css'],
})
export class ManageAddEditSessionComponent implements OnInit, AfterViewChecked {
	@ViewChild('qrCodeElement') qrCodeElement: any;

	timePicker: any = [];
	selectedDate = null;
	date;
	sessionForm: FormGroup;
	sessionDate;
	sessionTime;
	editSessionFlag: boolean = false;
	userId: any;
	sessionUserId: any;
	userClientId: any;
	copyLink: boolean = false;
	editSession: any;
	allParticipants = [];
	approvedCount = 0;
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

	workbookList;

	status = [1, 2, 3, 4, 5, 6];
	stepCount = 1;
	course_List: any;
	Workbook_List: any;
	WorkbookId: string;
	next30MinDate: any;

	iconObject = {
		arrow_icon: null,
		arrow_icon_rotate: null,
	};
	selectedDiwoModuleId: any;

	constructor(
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private confirmationService: ConfirmationService,
		private route: ActivatedRoute,
		public appService: AppService,
		private sessionService: ManageAddEditSessionService,
		private router: Router,
		private ref: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.getAssignedWorkbookList(this.userClientId);
		this.createsessionForm();
		this.createTimerPicker();
		// this.getCourseList(this.userClientId);

		this.next30MinDate = new Date();
		let minutes = this.next30MinDate.getMinutes();
		minutes = minutes < 30 ? 30 : 60;
		this.next30MinDate.setMinutes(minutes, 0, 0);
		this.editSession = this.route.params['_value'];
		if (this.editSession && this.editSession.sessionId) {
			this.editSessionFlag = true;
			this.sessionService.getSessionById(this.editSession.sessionId).subscribe((res: any) => {
				if (res.success) {
					let date = res.data.dateWithTime;
					this.sessionUserId = res.data.UserId;
					this.sessionForm.patchValue(res.data);
					this.sessionForm.controls['CourseId'].setValue(res.data.Workbook.Courses[0]?.id);
					this.selectedDate = {
						startDate: moment(date).subtract(0, 'days').startOf('day'),
						endDate: moment(date).subtract(0, 'days').startOf('day'),
					};
					this.sessionForm.controls['time'].setValue(this.getTimePikerIdByDate(res.data.dateWithTime));
					this.sessionForm.controls['date'].setValue(res.data.dateWithTime);
					this.OnchangeCourse();
					this.sessionForm.controls['WorkbookId'].setValue(res.data.Workbook.id);
					this.sessionForm.controls['WorkbookId'].disable();
					this.sessionForm.controls['CourseId'].disable();
					if (this.editSession && this.editSession.step) {
						this.stepCount = this.editSession.step;
					} else {
						if (!res.data.step) {
							this.stepCount = 4;
						} else {
							this.stepCount = res.data.step;
						}
						if (this.stepCount == 5) {
							this.getParticipantList();
						}
					}
					if (this.sessionForm.value.status == 'Live' || this.sessionForm.value.status == 'Ended') {
						this.sessionForm.controls['title'].disable();
						this.sessionForm.controls['location'].disable();
						this.sessionForm.controls['date'].disable();
						this.sessionForm.controls['time'].disable();
						this.sessionForm.controls['dateWithTime'].disable();
						// this.sessionForm.controls['link'].disable();
						this.sessionForm.controls['language'].disable();
					}
				}
			});
		} else {
			this.selectedDate = { startDate: moment().subtract(0, 'days').startOf('day'), endDate: null };
			this.sessionForm.controls['time'].setValue(this.getTimePikerIdByDate(this.next30MinDate.toISOString()));
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	startSession(session) {
		// console.log('--', session);
		if (session.status != 'Live' && session.status !== 'Ended') {
			this.sessionService.startSession(session.id).subscribe((res: any) => {
				if (res.success) {
					// this.router.navigate(['session-timeline', { sessionId: session.id }]);
				}
			});
		} else {
			// this.router.navigate(['session-timeline', { sessionId: session.id }]);
		}
		this.router.navigate(['session-timeline', { sessionId: session.id }]);
	}

	createsessionForm() {
		this.sessionForm = this.formBuilder.group({
			id: [null],
			title: [null],
			location: [null],
			date: [null],
			time: [null],
			dateWithTime: [null],
			link: [null],
			status: [null],
			isDeleted: [false],
			WorkbookId: [null],
			CourseId: [null],
			language: [null],
		});
	}
	get f1() {
		return this.sessionForm.controls;
	}

	ngAfterViewChecked() {
		this.ref.detectChanges();
	}

	getAssignedWorkbookList(clientId) {
		this.sessionService.getAssignedWorkbookList(clientId).subscribe((res: any) => {
			if (res.success) {
				this.workbookList = [];
				this.workbookList = res.data;
			}
		});
	}

	createTimerPicker() {
		let timerId = 1;
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

	selectTimeIntoDrip() {}

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

	// copyText() {
	// this.copyLink = true;
	// setTimeout(() => {
	// 	let textBox = document.querySelector('#hyper_link') as HTMLInputElement;
	// 	if (!textBox) return;
	// 	textBox.select();
	// 	document.execCommand('copy');
	// 	this.toastr.success(
	// 		this.appService.getTranslation('Pages.Session.AddEdit.Toaster.sessionlinkcopied'),
	// 		this.appService.getTranslation('Utils.success')
	// 	);
	// 	this.copyLink = false;
	// }, 100);
	// }

	copyText() {
		if (!this.sessionForm.value.link) return;

		// Check if clipboard API is available and running in a secure context
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard
				.writeText(this.sessionForm.value.link)
				.then(() => {
					this.toastr.success(
						this.appService.getTranslation('Pages.Session.AddEdit.Toaster.sessionlinkcopied'),
						this.appService.getTranslation('Utils.success')
					);
				})
				.catch((err) => {
					console.error('Clipboard API failed, using fallback:', err);
					this.fallbackCopyText();
				});
		} else {
			this.fallbackCopyText();
		}
	}

	// Fallback method for HTTP or unsupported environments
	fallbackCopyText() {
		const textArea = document.createElement('textarea');
		textArea.value = this.sessionForm.value.link;
		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			this.toastr.success(
				this.appService.getTranslation('Pages.Session.AddEdit.Toaster.sessionlinkcopied'),
				this.appService.getTranslation('Utils.success')
			);
		} catch (err) {
			console.error('Fallback copy failed:', err);
		} finally {
			document.body.removeChild(textArea);
		}
	}

	refreshParticipantResult() {
		this.getParticipantList();
	}

	getParticipantList() {
		this.sessionService.getParticipantList(this.sessionForm.value.id).subscribe((res: any) => {
			if (res.success) {
				this.allParticipants = [];
				this.allParticipants = res.data;
				this.approvedCount = 0;
				if (this.allParticipants && this.allParticipants.length > 0) {
					for (let participant of this.allParticipants) {
						if (participant.status == 'Approved') {
							this.approvedCount++;
						}
					}
				}
			}
		});
	}

	onDateSelect(event) {
		console.log('event', event);
	}

	forwardStep() {
		// Form Checks
		if (this.stepCount == 1 && !this.sessionForm.controls['WorkbookId'].value) {
			this.sessionForm.controls['WorkbookId'].setErrors({ required: true });
			return;
		} else if (
			this.stepCount == 2 &&
			(!this.sessionForm.controls['location'].value ||
				!this.sessionForm.controls['date'].value ||
				!this.sessionForm.controls['time'].value)
		) {
			if (!this.sessionForm.controls['location'].value) {
				this.sessionForm.controls['location'].setErrors({ required: true });
			}
			if (!this.sessionForm.controls['date'].value) {
				this.sessionForm.controls['date'].setErrors({ required: true });
			}
			if (!this.sessionForm.controls['time'].value) {
				this.sessionForm.controls['time'].setErrors({ required: true });
			}
			return;
		} else if (this.stepCount == 3 && !this.sessionForm.controls['title'].value) {
			this.sessionForm.controls['title'].setErrors({ required: true });
			return;
		} else if (this.stepCount == 4) {
		} else if (this.stepCount == 5) {
		} else if (this.stepCount == 2) {
			if (!this.sessionForm.controls['title'].value && !this.editSessionFlag) {
				for (let workbook of this.workbookList) {
					if (workbook.id == this.sessionForm.controls['WorkbookId'].value) {
						this.sessionForm.controls['title'].setValue(
							`${workbook.title}_${
								this.sessionForm.controls['location'].value
							}_${this.sessionForm.value.date.startDate.format('YYYY-MM-DD')}`
						);
					}
				}
			}
		}

		//Create Session
		if (this.stepCount == 3) {
			if (
				!this.editSessionFlag &&
				!this.sessionForm.value.id &&
				this.sessionForm.value.status !== 'Live' &&
				this.sessionForm.value.status !== 'Ended'
			) {
				this.sessionForm.controls['dateWithTime'].setValue(
					this.getDateByDateAndTimePickerId(
						this.sessionForm.value.date.startDate.format('YYYY-MM-DD'),
						this.sessionForm.controls['time'].value
					)
				);

				let payload = this.sessionForm.value;
				payload.DiwoModuleId = this.selectedDiwoModuleId ? this.selectedDiwoModuleId : 1;

				this.sessionService.createSession(payload, this.userClientId).subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.sessionForm.patchValue(res.data);
					}
				});
			}
		}

		if ((this.stepCount == 2 || this.stepCount == 3) && this.editSessionFlag) {
			this.sessionForm.value.date = this.sessionForm.value.date;
			if (this.sessionForm.value.status !== 'Live' && this.sessionForm.value.status !== 'Ended') {
				this.sessionForm.controls['dateWithTime'].setValue(
					this.getDateByDateAndTimePickerId(
						this.sessionForm.value.date.startDate.format('YYYY-MM-DD'),
						this.sessionForm.controls['time'].value
					)
				);
				let payload = this.sessionForm.value;
				payload.DiwoModuleId = this.selectedDiwoModuleId ? this.selectedDiwoModuleId : 1;
				payload.stepCount = this.stepCount;
				payload.isForwardStep = true;
				if (this.sessionUserId == this.userId) {
					this.sessionService
						.updateSession(payload, this.userClientId, this.editSession.sessionId)
						.subscribe((res: any) => {
							if (res.success) {
								this.sessionForm.patchValue(res.data);
							}
						});
				}
			}
		}

		if (this.stepCount == 4) {
			this.getParticipantList();
		}
		if (this.stepCount <= 5) {
			this.stepCount++;
		}
	}

	backStep() {
		if ((this.stepCount == 2 || this.stepCount == 3) && this.editSessionFlag) {
			this.sessionForm.controls['dateWithTime'].setValue(
				this.getDateByDateAndTimePickerId(
					this.selectedDate.startDate.format('YYYY-MM-DD'),
					this.sessionForm.controls['time'].value
				)
			);
			if (this.sessionUserId == this.userId) {
				this.sessionForm.value.stepCount = this.stepCount;
				this.sessionForm.value.isBackStep = true;
				this.sessionService
					.updateSession(this.sessionForm.value, this.userClientId, this.editSession.sessionId)
					.subscribe((res: any) => {
						if (res.success) {
							this.sessionForm.patchValue(res.data);
						}
					});
			}
		}

		if (this.stepCount == 6) {
			this.getParticipantList();
		}

		if (this.stepCount > 1) {
			this.stepCount--;
		}
	}

	changeStatus(status, id) {
		if (this.sessionUserId == this.userId) {
			this.sessionService.changeParticipantStatus(status, id).subscribe((res: any) => {
				if (res.success) {
					this.getParticipantList();
				}
			});
		}
	}

	updateStep(step) {
		let payload = {
			step: step,
		};
		this.sessionService.updateSessionStep(payload, this.sessionForm.controls['id'].value).subscribe((res: any) => {
			if (res.success) {
				this.router.navigate(['session']);
			}
		});
	}

	// getCourseList(clientId) {
	// 	this.sessionService.getSessionCourseList(clientId).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.course_List = [];
	// 			this.course_List = res.data;
	// 		}
	// 	});
	// }

	OnchangeCourse() {
		this.sessionForm.controls['WorkbookId'].setValue(null);
		let id = this.sessionForm.value.CourseId;
		// this.sessionService.getWorkbookCourseList(id).subscribe((res: any) => {
		// 	if (res.success) {
		// 		this.Workbook_List = [];
		// 		for (let i = 0; i < res.data.length; i++) {
		// 			this.Workbook_List.push(res.data[i].Workbook);
		// 		}
		// 	}
		// });
	}

	onChangeWorkbook(event) {
		this.selectedDiwoModuleId = event.DiwoModuleId;
	}

	DateChange(value) {
		this.sessionForm.controls['date'].setValue(value);
	}
	downloadQRCode() {
		setTimeout(() => {
			const qrcode = this.qrCodeElement.nativeElement.childNodes[0].childNodes[0];
			const link = document.createElement('a');
			link.download = 'session_qr_code.png';
			link.href = qrcode.toDataURL();
			link.click();
		}, 200);
	}
}
