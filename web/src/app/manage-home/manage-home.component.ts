import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ManageHomeService } from './manage-home.service';
import * as moment from 'moment';
import { ngxCsv } from 'ngx-csv';
import { AppService } from '../app.service';
declare var $: any;

@Component({
	selector: 'app-manage-home',
	templateUrl: './manage-home.component.html',
	styleUrls: ['./manage-home.component.scss'],
	animations: [routerTransition()],
})
export class ManageHomeComponent implements OnInit {
	verticalGraphResult: any[] = [];
	showDownloadReport = true;
	allowReportDownloadRoleId = [6, 7, 8];
	//for Vertical chart
	view: any[] = [1000, 400];
	viewHorizontalBar: any[] = [400, 210];
	viewHorizontalBar2: any[] = [400, 150];
	showXAxis = true;
	showYAxis = true;
	gradient = false;
	showLegend = true;
	showXAxisLabel = true;
	showYAxisLabel = true;
	invalidDates: moment.Moment[] = [];
	colorScheme = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};

	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};
	selectedMonthForDripActivity = 11;
	months = 11;
	selectedReportName: any;

	Monthdata = [
		{ id: 1, name: 'Last 12 Months', value: 11 },
		{ id: 2, name: 'Last 6 Months', value: 5 },
		{ id: 3, name: 'Last 3 Months', value: 2 },
	];

	Reportdata = [
		{ id: 1, name: 'WhatsApp Delivery Report' },
		{ id: 2, name: 'Email Delivery Report' },
		{ id: 3, name: 'WhatsApp Opt In Status Report' },
		{ id: 4, name: 'Microsoft Teams Delivery Report' },
	];

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

	AllCount: any[];
	selectedClientName: any;
	userClient: any;
	roleId: any;
	userId: any;
	dripCount: any;
	AllDripActivity: any[];
	SubscriptionData: any;
	clientId: any;
	clientData: any;
	userDetails;
	defaultPolicyName = ['Terms and Conditions', 'Privacy Policy', 'Cookie Policy'];
	policyNames = [];
	newUser: boolean = true;
	userName: string;
	notificationList = [];
	selectedNotifcationIndex;
	selectedDate;
	dripsendFlag: boolean = false;
	policies: string;
	isExistingUser: boolean;
	isdateRangeSelected: boolean = false;
	isApiCall: boolean = false;
	type = 'drip';

	iconObject = {
		groups: null,
		family_history: null,
		water_drop: null,
		perm_media: null,
	};

	constructor(
		private toastr: ToastrService,
		private formBuilder: FormBuilder,
		private spinnerService: NgxSpinnerService,
		private homeService: ManageHomeService,
		private router: Router,
		public appService: AppService
	) {
		Object.assign(this.verticalGraphResult);
	}
	ngOnInit() {
		this.type = this.appService.type;
		this.userClient = JSON.parse(localStorage.getItem('client')) || null;
		this.userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).user.id : null;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.checkUserIsExistingOrNot();
		if (this.allowReportDownloadRoleId.indexOf(this.roleId) <= -1) {
			this.showDownloadReport = false;
		}
		this.getAllCount();
		// this.getAllDripActivityForGraph();
		this.getClientSubscriptionForView();
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		if (this.userDetails) {
			if (
				this.userDetails.acceptPolicy == false &&
				this.userDetails.userPolicyDetails != null &&
				this.userDetails.userPolicyDetails != ''
			) {
				this.newUser = false;
				let policyNotificationData = JSON.parse(this.userDetails.userPolicyDetails);
				this.userName = this.userDetails.first + ' ' + this.userDetails.last;
				if (policyNotificationData && policyNotificationData.length > 0) {
					for (let policy of policyNotificationData) {
						for (let key in policy) {
							if (!policy[key].acceptedByUser && policy[key].PolicyChangeLogId) {
								this.policyNames.push(key);
								const str_policy_name = this.policyNames.toString();
								this.policies = this.removeLastComma(str_policy_name);
							}
						}
					}
					$('#policyModel').modal('show');
				}
			} else if (this.userDetails.acceptPolicy == false) {
				this.newUser = true;
				this.policyNames = this.defaultPolicyName;
				const str_policy_name = this.policyNames.toString();
				this.policies = this.removeLastComma(str_policy_name);
				$('#policyModel').modal('show');
			}
		}
		this.getuserNotification();
		this.appService.checkGoogleDriveDetails();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	checkUserIsExistingOrNot() {
		this.homeService.checkUserIsExistingOrNot(this.userId).subscribe((res: any) => {
			if (res.success) {
				if (res.message == 'Existing User') {
					this.isExistingUser = true;
				} else {
					this.isExistingUser = false;
				}
			}
		});
	}

	removeLastComma(str) {
		let string = str;
		const lastIndex = str.lastIndexOf(',');
		if (lastIndex !== -1) {
			let string = str.slice(0, lastIndex) + ' ' + 'and' + ' ' + str.slice(lastIndex + 1);
			return string;
		}
		return string;
	}

	getuserNotification() {
		this.homeService.getUserNotification().subscribe((res: any) => {
			if (res.success) {
				if (res && res.data) {
					this.notificationList = [];
					this.notificationList = res.data;
					for (let item of this.notificationList) {
						item.message = item.message.replace('{{Tag_Learner_Updated}}', '');
						item.message = item.message.replace('{{Tag_Learner_Created}}', '');
					}
					if (this.notificationList.length > 0) {
						this.selectedNotifcationIndex = 0;
						$('#notificationModel').modal('show');
					} else {
						this.selectedNotifcationIndex = null;
					}
				}
			}
		});
	}

	getAllCount() {
		this.spinnerService.show();
		this.homeService.getAllCount(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.AllCount = [];
				for (let count of res.data) {
					this.AllCount.push(count);
				}
			}
			this.spinnerService.hide();
		});
	}

	// getAllDripActivityForGraph() {
	// 	this.spinnerService.show();
	// 	this.isApiCall = true;
	// 	this.homeService.getAllDripActivity(this.userClient.id, this.months).subscribe((res: any) => {
	// 		if (res.success) {
	// 			this.verticalGraphResult = [];
	// 			for (let item of res.vertical_graph_data) {
	// 				// if (item.dripScheduled != 0) {
	// 				// 	this.dripsendFlag = false;
	// 				// }
	// 				// if (item.dripSend != 0) {
	// 				// 	this.dripsendFlag = false;
	// 				// }
	// 				// if (item.dripDelivered != 0) {
	// 				// 	this.dripsendFlag = false;
	// 				// }
	// 				// if (item.dripEngaged != 0) {
	// 				// 	this.dripsendFlag = false;
	// 				// }
	// 				this.verticalGraphResult.push({
	// 					name: item.month,
	// 					series: [
	// 						// {
	// 						// 	name: 'Drip Scheduled',
	// 						// 	value: parseInt(item.dripScheduled),
	// 						// },
	// 						{
	// 							name: 'Drip Sent',
	// 							value: parseInt(item.dripSend),
	// 						},
	// 						{
	// 							name: 'Drip Delivered',
	// 							value: parseInt(item.dripDelivered),
	// 						},
	// 						{
	// 							name: 'Drip Engaged',
	// 							value: parseInt(item.dripEngaged),
	// 						},
	// 					],
	// 				});
	// 			}
	// 			// this.view = [this.container.nativeElement.offsetWidth - 40, 400];
	// 		}
	// 		this.isApiCall = false;
	// 		this.spinnerService.hide();
	// 	});
	// }

	// selectedMonthsForVerticalChart($event) {
	// 	this.months = $event.value;
	// 	this.getAllDripActivityForGraph();
	// }

	selectedReport($event) {}

	refreshShowResult() {}

	onSelect(data): void {}

	onActivate(data): void {}

	onDeactivate(data): void {}

	getClientSubscriptionForView() {
		this.homeService.getClientViewSubscriptionById(this.userClient.id).subscribe((res: any) => {
			if (res.success) {
				this.SubscriptionData = res.data.license;
			}
		});
	}

	acceptPolicy() {
		let payload = {
			list: this.policyNames,
		};
		this.homeService.acceptPolicyByUser(this.userDetails.id, this.userClient.id, payload).subscribe((res: any) => {
			if (res.success) {
				$('#policyModel').modal('hide');
				let userDetails = JSON.parse(localStorage.getItem('user'));
				userDetails.user.acceptPolicy = true;
				userDetails.user = this.appService.removePersonalData(userDetails.user);

				localStorage.setItem('user', JSON.stringify(userDetails));
				this.appService.setUserPersonalData();
				this.appService.checkGoogleDriveDetails();
			}
		});
	}
	cancel() {}

	redirctToURL(policyName) {
		let policyURLs = JSON.parse(localStorage.getItem('user')).user.Market;
		if (policyName == 'Terms and Conditions') {
			window.open(`${policyURLs.tosUrl}`, '_blank');
		} else if (policyName == 'Privacy Policy') {
			window.open(`${policyURLs.privacyPolicyUrl}`, '_blank');
		} else if (policyName == 'Cookie Policy') {
			window.open(`${policyURLs.cookiePolicyUrl}`, '_blank');
		} else if (policyName == 'Data Processing Agreement') {
			window.open(`${policyURLs.dpaUrl}`, '_blank');
		}
	}

	nextNotification() {
		if (this.selectedNotifcationIndex < this.notificationList.length - 1) {
			$('#notificationModel').modal('hide');
			this.selectedNotifcationIndex = this.selectedNotifcationIndex + 1;
			setTimeout(() => {
				$('#notificationModel').modal('show');
			}, 500);
		} else {
			$('#notificationModel').modal('hide');
		}
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

	//Download Report
	downloadReport() {
		let payload = {
			startDate: this.selectedDate.startDate,
			endDate: this.selectedDate.endDate,
			clientId: this.userClient.id,
		};

		if (
			(this.selectedDate.startDate == null ||
				this.selectedDate.endDate == null ||
				this.selectedDate.startDate == undefined ||
				this.selectedDate.endDate == undefined) &&
			this.selectedReportName != 3
		) {
			this.isdateRangeSelected = true;
			return;
		}

		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		if (this.selectedReportName == 1) {
			//For WhatsAPP Delivery Report
			this.homeService.getWhatsAppReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							let templateId;
							let category;
							count++;
							if (item.Post && item.Post.Drip_whatsapp_natives && item.Post.Drip_whatsapp_natives.length > 0) {
								templateId = item.Post.Drip_whatsapp_natives[0].templateId;
								category = item.Post.Drip_whatsapp_natives[0].tempCategory;
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
								'ACCOUNT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'MESSAGE ID': item.WAppTriggerId,
								TYPE: 'Template',
								SENT: item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								DELIVERED: item.deliveryDate
									? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								READ: item.readDate ? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								FAIL: item.failDate ? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								STATUS: item.status ? item.status : '',
								CAUSE: item.cause ? item.cause : '',
								CHANNEL: 'WHATSAPP',
								'TEMPLATE ID': templateId ? templateId : '',
								'DELIVERY CODE': item.deliveryCode ? item.deliveryCode : '',
								CATEGORY: category ? category : '',
								'PRICING CATEGORY': category ? category : '',
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
						title: 'WhatsApp Delivery Report',
						useBom: false,
						noDownload: false,
						headers: [
							'SR NO',
							'ACCOUNT ID',
							'MESSAGE ID',
							'TYPE',
							'SENT',
							'DELIVERED',
							'READ',
							'FAIL',
							'STATUS',
							'CAUSE',
							'CHANNEL',
							'TEMPLATE ID',
							'DELIVERY CODE',
							'CATEGORY',
							'PRICING CATEGORY',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Whats App Delivery Report', option);
				}
			});
		} else if (this.selectedReportName == 2) {
			//For Email Delivery Report
			this.homeService.getEmailReport(payload).subscribe(async (res: any) => {
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
								'ACCOUNT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'MESSAGE ID': item.mailMessageId ? item.mailMessageId : '',
								'RECEIVED MESSAGE ID': item.emailEventId ? item.emailEventId : '',
								SENT: item.sentDate ? ' ' + moment(item.sentDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								DELIVERED: item.deliveryDate
									? ' ' + moment(item.deliveryDate).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								READ: item.readDate ? ' ' + moment(item.readDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								CLICK: item.clickDate ? ' ' + moment(item.clickDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								FAIL: item.failDate ? ' ' + moment(item.failDate).local().format('YYYY-MM-DD HH:mm:ss') : '',
								STATUS: item.status ? item.status : '',
								SUBJECT: subject ? subject : '',
								'TEMPLATE Id': item.templateId ? item.templateId : '',
								'TEMPLATE NAME': item.templateName ? item.templateName : '',
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
						title: 'Email Delivery Report',
						useBom: false,
						noDownload: false,
						headers: [
							'SR NO',
							'ACCOUNT ID',
							'MESSAGE ID',
							'RECEIVED MESSAGE ID',
							'SENT',
							'DELIVERED',
							'READ',
							'CLICK',
							'FAIL',
							'STATUS',
							'SUBJECT',
							'TEMPLATE Id',
							'TEMPLATE NAME',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'Email Delivery Report', option);
				}
			});
		} else if (this.selectedReportName == 3) {
			//For Whats App OPT-IN Report
			this.homeService.getWhatsAppOPTINReport(payload).subscribe(async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						let count = 0;
						for (let item of res.data) {
							count++;
							let status = '';
							if (item.User && item.User.opt_in) {
								status = 'OPT-IN';
							} else if (item.User && item.User.opt_out) {
								status = 'OPT-OUT';
							}

							let payload = {
								'SR NO': count,
								'ACCOUNT ID': item.User && item.User.account_id ? item.User.account_id : '',
								'OPT ID': item.User && item.User.opt_id ? item.User.opt_id : '',
								'OPT STATUS': status,
								DATE: item.User.otp_update_at
									? ' ' + moment(item.User.otp_update_at).local().format('YYYY-MM-DD HH:mm:ss')
									: '',
								'IS TRIGGER': item.User && item.User.optTrigger ? item.User.optTrigger : '',
								'ERROR MESSAGE': item.User && item.User.optError ? item.User.optError : '',
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
						headers: ['SR NO', 'ACCOUNT ID', 'OPT ID', 'OPT STATUS', 'DATE', 'IS TRIGGER', 'ERROR MESSAGE'],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, 'WhatsApp opt-in Report', option);
				}
			});
		} else if (this.selectedReportName == 4) {
			//For Teams Delivery Report
			this.toastr.success(
				this.appService.getTranslation('Utils.reportDownloadMessage'),
				this.appService.getTranslation('Utils.success')
			);
			this.homeService.getTeamsDelievryReport(payload).subscribe(async (res: any) => {
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
		}
	}
}
