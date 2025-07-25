import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppService } from '../app.service';
import { ngxCsv } from 'ngx-csv';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-manage-notification',
	templateUrl: './manage-notification.component.html',
	styleUrls: ['./manage-notification.component.scss'],
})
export class ManageNotificationComponent implements OnInit {
	pageResultCount = environment.pageResultsCount;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	notifcationList = [];
	downloadUploadFile = false;
	downloadUpdateFile = false;
	downloadWhatsAppWithDrip = false;
	downloademailWithDrip = false;
	downloadonlyDrip = false;
	downloadonlyWhatsApp = false;
	downloadLinks = false;
	roleId: any;
	userId: any;
	userClientId: any;
	formula: string = 'Learner Report';
	formulaOnlyOnWhatsApp: string = 'Only On WhatsApp';
	formulaDripAppwithWhatsApp: string = 'On Drip App with sharing on WhatsApp';
	formulaDripAppwithEmail: string = 'On Drip App with sharing on Email';
	formulaOnlyOnDripApp: string = 'Only On Drip App';
	formulaLinkAssets: string = 'Link Assets Report';
	isDataLoaded: boolean = false;
	type = 'drip';

	constructor(public appService: AppService, private toastr: ToastrService) {}

	iconObject = {
		bell_noticiation_icon_30: null,
	};

	ngOnInit(): void {
		this.type = this.appService.type;
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id || null;
		this.userClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.getBellNotifcation(1, 25);
		this.checkUploadFile();
		if (this.type === 'drip') {
			this.formula = 'Contact Report';
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	checkUploadFile() {
		this.appService
			.checkUploadLearnerData(parseInt(this.roleId), this.userId, this.userClientId)
			.subscribe((res: any) => {
				if (res.success) {
					if (res.data) {
						this.downloadUploadFile = res.data.uploadLearner;
						this.downloadUpdateFile = res.data.updateLearner;
						this.downloadWhatsAppWithDrip = res.data.WhatsAppWithDrip;
						this.downloademailWithDrip = res.data.emailWithDrip;
						this.downloadonlyDrip = res.data.onlyDrip;
						this.downloadonlyWhatsApp = res.data.onlyWhatsApp;
						this.downloadLinks = res.data.uploadedLink;
					}
				}
			});
	}

	getBellNotifcation(page, offset) {
		this.appService.getUserBellNotifcation(page, offset).subscribe((res: any) => {
			if (res.success) {
				this.notifcationList = [];
				this.notifcationList = res.data;
				this.totalCount = res.count;
				if (this.notifcationList.length > 0) {
					let flag = false;
					for (let notification of this.notifcationList) {
						if (notification.message.indexOf('{{date}}') != -1) {
							notification.message = notification.message.replace(
								'{{date}}',
								moment(notification.createdAt).local().format('YYYY-MM-DD HH:mm')
							);
						}
						if (!notification.isRead) {
							flag = true;
						}
					}
					if (flag) {
						this.appService.readAllBellNotification().subscribe((res: any) => {});
					}
				}
				this.isDataLoaded = true;
			}
		});
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		// this.getClientData(this.page, this.limit);
		this.getBellNotifcation(this.page, this.limit);
	}

	changeResult(count) {
		this.page = 1;
		if (count == 'all') {
			this.limit = count;
			this.getBellNotifcation(this.page, this.limit);
		}
		if (typeof this.limit == 'string') {
			this.limit = count;
			this.getBellNotifcation(this.page, this.limit);
		}
		if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
			this.limit = +count;
			this.getBellNotifcation(this.page, this.limit);
		}
	}

	downloadReport() {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadLearnerData(this.roleId, this.userId, this.userClientId).subscribe(
			(res: any) => {
				if (res.success) {
					let finalData = [];
					let customFields = [];
					let headers = [
						'Sr. No',
						'First Name',
						'Last Name',
						'Email',
						'Mobile',
						...(this.appService?.configurable_feature?.pwa_username ? ['Username'] : []),
						'Country',
						'State',
						'City',
						'Zip Code',
						'Branch Id',
						'Job Role',
						'IsCreated',
						'Error Message',
						'Email Error',
						'Phone Error',
						...(this.appService?.configurable_feature?.pwa_username ? ['Username Error'] : []),
						'Created At',
					];
					if (res.data && res.data.length > 0) {
						//Add Custom Field Headers
						if (
							res.data &&
							res.data[0].customFields &&
							res.data[0].customFields != null &&
							res.data[0].customFields != ''
						) {
							for (let key in res.data[0].customFields) {
								headers.push(key);
								customFields.push(key);
							}
						}
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								'First Name': item.first ? item.first : '',
								'Last Name': item.last ? item.last : '',
								Email: item.email ? item.email : '',
								Mobile: item.phone ? item.phone : '',
								...(this.appService?.configurable_feature?.pwa_username && {
									username: item.username ? item.username : '',
								}),
								// Username: item.username ? item.username : '',
								Country: item.country ? item.country : '',
								State: item.state ? item.state : '',
								City: item.city ? item.city : '',
								'Zip Code': item.zipCode ? item.zipCode : '',
								'Branch Id': item.Client_Id ? item.Client_Id : '',
								'Job Role': item.jobrole ? item.jobrole : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								'Email Error': item.emailError ? item.emailError : '',
								'Phone Error': item.PhoneError ? item.PhoneError : '',
								...(this.appService?.configurable_feature?.pwa_username && {
									'Username Error': item.UsernameError ? item.UsernameError : '',
								}),
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							if (customFields.length > 0) {
								for (let key of customFields) {
									payload[key] = item && item.customFields && item.customFields[key] ? item.customFields[key] : ' ';
								}
							}
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Leraner Users CSV',
						useBom: false,
						noDownload: false,
						headers: headers,
					};
					const fileInfo = new ngxCsv(finalData, this.formula, options);
				}
			},
			(error) => {}
		);
	}

	downloadLearnerUpdateReport() {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUpdateLearnerData(this.roleId, this.userId, this.userClientId).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalDataDiwo = [];
					let finalDataDrip = [];
					let customFields = [];
					let headers = [];
					if (this.type == 'drip') {
						headers = [
							'Sr. No',
							'Contact Id',
							'First Name',
							'Last Name',
							'Email',
							'Mobile',
							'Country',
							'State',
							'City',
							'Zip Code',
							'Branch Id',
							'Branch Name',
							'Job Role',
							'Tags',
							'Contact Group Id',
							'isUpdated',
							'Error Message',
							'Updated At',
							'Status',
							'Action',
						];
					} else {
						if (this.type == 'diwo') {
							headers = [
								'Sr. No',
								'Learner Id',
								'First Name',
								'Last Name',
								'Email',
								'Mobile',
								'Country',
								'State',
								'City',
								'Zip Code',
								'Branch Id',
								'Branch Name',
								'Job Role',
								'Tags',
								'Learner Group Id',
								'isUpdated',
								'Error Message',
								'Updated At',
							];
						}
					}
					if (res.data && res.data.length > 0) {
						if (
							res.data &&
							res.data[0].customFields &&
							res.data[0].customFields != null &&
							res.data[0].customFields != ''
						) {
							for (let key in res.data[0].customFields) {
								headers.push(key);
								customFields.push(key);
							}
						}
						for (let item of res.data) {
							let payloadDrip = {
								'Sr. No': item.srNo,
								'Contact Id': item.learnerId ? item.learnerId : '',
								'First Name': item.first ? item.first : '',
								'Last Name': item.last ? item.last : '',
								Email: item.email ? item.email : '',
								Mobile: item.mobile ? item.mobile : '',
								Country: item.country ? item.country : '',
								State: item.state ? item.state : '',
								City: item.city ? item.city : '',
								'Zip Code': item.zipCode ? item.zipCode : '',
								'Branch Id': item.client_id ? item.client_id : '',
								'Branch Name': item.clientName ? item.clientName : '',
								'Job Role': item.jobRole ? item.jobRole : '',
								Tags: item.tags ? item.tags : '',
								'Contact Group Id':
									item.learnerGroupIds && item.learnerGroupIds.length > 0 ? item.learnerGroupIds.toString() : '',
								isUpdated: item.isUpdated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								'Updated At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
								Status: item.status ? item.status : '',
								Action: item.action ? item.action : '',
							};

							let payloadDiwo = {
								'Sr. No': item.srNo,
								'Learner Id': item.learnerId ? item.learnerId : '',
								'First Name': item.first ? item.first : '',
								'Last Name': item.last ? item.last : '',
								Email: item.email ? item.email : '',
								Mobile: item.mobile ? item.mobile : '',
								Country: item.country ? item.country : '',
								State: item.state ? item.state : '',
								City: item.city ? item.city : '',
								'Zip Code': item.zipCode ? item.zipCode : '',
								'Branch Id': item.client_id ? item.client_id : '',
								'Branch Name': item.clientName ? item.clientName : '',
								'Job Role': item.jobRole ? item.jobRole : '',
								Tags: item.tags ? item.tags : '',
								'Learner Group Id':
									item.learnerGroupIds && item.learnerGroupIds.length > 0 ? item.learnerGroupIds.toString() : '',
								isUpdated: item.isUpdated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								'Updated At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
								Status: item.status ? item.status : '',
								Action: item.action ? item.action : '',
							};

							if (customFields.length > 0) {
								for (let key of customFields) {
									payloadDrip[key] = item && item.customFields && item.customFields[key] ? item.customFields[key] : ' ';
									payloadDiwo[key] = item && item.customFields && item.customFields[key] ? item.customFields[key] : ' ';
								}
							}
							finalDataDrip.push(payloadDrip);
							finalDataDiwo.push(payloadDiwo);
						}
					}

					if (this.type === 'drip') {
						var optionsDrip = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: 'Contact Update CSV',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalDataDrip = await this.appService.sanitizedData(finalDataDrip);
						const fileInfo = new ngxCsv(finalDataDrip, 'Contact Update Report', optionsDrip);
					} else {
						var optionsDiwo = {
							fieldSeparator: ',',
							quoteStrings: '"',
							decimalseparator: '.',
							showLabels: false,
							showTitle: false,
							title: 'Learner Update CSV',
							useBom: false,
							noDownload: false,
							headers: headers,
						};
						finalDataDiwo = await this.appService.sanitizedData(finalDataDiwo);
						const fileInfo = new ngxCsv(finalDataDiwo, 'Learner Update Report', optionsDiwo);
					}
				}
			},
			(error) => {}
		);
	}
	downloadOnlyOnWhatsAppReport(type) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadOnlyOnWhatsAppData(this.roleId, this.userId, this.userClientId, type).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								'Account Id': item.account_id ? item.account_id : '',
								'Drip Name': item.dripName ? item.dripName : '',
								Description: item.description ? item.description : '',
								Language: item.language ? item.language : '',
								'Whatsapp Template Category': item.whatsappTemplateCategory ? item.whatsappTemplateCategory : '',
								'Header Type': item.headerType ? item.headerType : '',
								'Header Text': item.headerText ? item.headerText : '',
								Body: item.body ? item.body : '',
								Footer: item.footer ? item.footer : '',
								Interaction: item.interaction ? item.interaction : '',
								'Quick Reply1': item.quickReply1 ? item.quickReply1 : '',
								'Quick Reply2': item.quickReply2 ? item.quickReply2 : '',
								'Quick Reply3': item.quickReply3 ? item.quickReply3 : '',
								'Call to Action': item.callToAction ? item.callToAction : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								IsError: item.isError,
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Only on Whatsapp CSV',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr. No, Account Id',
							'Drip Name',
							'Description',
							'Language',
							'Whatsapp Template Category',
							'Header Type',
							'Header Text',
							'Body',
							'Footer',
							'Interaction',
							'Quick Reply1',
							'Quick Reply2',
							'Quick Reply3',
							'Call to Action',
							'IsCreated',
							'Error Message',
							'IsError',
							'Created At',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, this.formulaOnlyOnWhatsApp, options);
				}
			},
			(error) => {}
		);
	}

	downloadDripAppWithWhatsAppReport(type) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadOnlyOnWhatsAppData(this.roleId, this.userId, this.userClientId, type).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								'Account Id': item.account_id ? item.account_id : '',
								'Drip Name': item.dripName ? item.dripName : '',
								Description: item.description ? item.description : '',
								Language: item.language ? item.language : '',
								'Login Required': item.loginRequired,
								'Whatsapp Template Category': item.whatsappTemplateCategory ? item.whatsappTemplateCategory : '',
								'Header Type': item.headerType ? item.headerType : '',
								'Header Text': item.headerText ? item.headerText : '',
								Body: item.body ? item.body : '',
								Footer: item.footer ? item.footer : '',
								'Call to Action': item.callToAction ? item.callToAction : '',
								'Template Type': item.templateType ? item.templateType : '',
								Caption: item.caption ? item.caption : '',
								Questions: item.Questions ? item.Questions : '',
								'Poll Result Type': item.pollResultType ? item.pollResultType : '',
								'Show Correct Answer': item.showCorrectAns ? item.showCorrectAns : '',
								'Quiz Result Type': item.quizResultType ? item.quizResultType : '',
								Brief: item.brief ? item.brief : '',
								'Quiz Rand Count': item.quizRandCount ? item.quizRandCount : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								IsError: item.isError,
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'On Drip App with sharing on WhatsApp',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr. No, Account Id',
							'Drip Name',
							'Description',
							'Language',
							'Login Required',
							'Whatsapp Template Category',
							'Header Type',
							'Header Text',
							'Body',
							'Footer',
							'Call to Action',
							'Template Type',
							'Caption',
							'Questions',
							'Poll Result Type',
							'Show Correct Answer',
							'Quiz Result Type',
							'Brief',
							'Quiz Rand Count',
							'IsCreated',
							'Error Message',
							'IsError',
							'Created At',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, this.formulaDripAppwithWhatsApp, options);
				}
			},
			(error) => {}
		);
	}

	downloadDripAppWithEmailReport(type) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadOnlyOnWhatsAppData(this.roleId, this.userId, this.userClientId, type).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								'Account Id': item.account_id ? item.account_id : '',
								'Drip Name': item.dripName ? item.dripName : '',
								Description: item.description ? item.description : '',
								'Login Required': item.loginRequired,
								'Subject Line': item.subjectline ? item.subjectline : '',
								'Body Copy': item.bodycopy ? item.bodycopy : '',
								'Call to Action': item.callToAction ? item.callToAction : '',
								'Template Type': item.templateType ? item.templateType : '',
								Caption: item.caption ? item.caption : '',
								Questions: item.Questions ? item.Questions : '',
								'Poll Result Type': item.pollResultType ? item.pollResultType : '',
								'Show Correct Answer': item.showCorrectAns ? item.showCorrectAns : '',
								'Quiz Result Type': item.quizResultType ? item.quizResultType : '',
								Brief: item.brief ? item.brief : '',
								'Quiz Rand Count': item.quizRandCount ? item.quizRandCount : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								IsError: item.isError,
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'On Drip App with sharing on Email',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr. No, Account Id',
							'Drip Name',
							'Description',
							'Login Required',
							'Subject Line',
							'Body Copy',
							'Call to Action',
							'Template Type',
							'Caption',
							'Questions',
							'Poll Result Type',
							'Show Correct Answer',
							'Quiz Result Type',
							'Brief',
							'Quiz Rand Count',
							'IsCreated',
							'Error Message',
							'IsError',
							'Created At',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, this.formulaDripAppwithEmail, options);
				}
			},
			(error) => {}
		);
	}

	downloadOnDripAppReport(type) {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadOnlyOnWhatsAppData(this.roleId, this.userId, this.userClientId, type).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								'Account Id': item.account_id ? item.account_id : '',
								'Drip Name': item.dripName ? item.dripName : '',
								Description: item.description ? item.description : '',
								'Login Required': item.loginRequired,
								'Template Type': item.templateType ? item.templateType : '',
								Caption: item.caption ? item.caption : '',
								Questions: item.Questions ? item.Questions : '',
								'Poll Result Type': item.pollResultType ? item.pollResultType : '',
								'Show Correct Answer': item.showCorrectAns ? item.showCorrectAns : '',
								'Quiz Result Type': item.quizResultType ? item.quizResultType : '',
								Brief: item.brief ? item.brief : '',
								'Quiz Rand Count': item.quizRandCount ? item.quizRandCount : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								IsError: item.isError,
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Only On Drip App',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr. No, Account Id',
							'Drip Name',
							'Description',
							'Login Required',
							'Template Type',
							'Caption',
							'Questions',
							'Poll Result Type',
							'Show Correct Answer',
							'Quiz Result Type',
							'Brief',
							'Quiz Rand Count',
							'IsCreated',
							'Error Message',
							'IsError',
							'Created At',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, this.formulaOnlyOnDripApp, options);
				}
			},
			(error) => {}
		);
	}

	downloadLinkAssetReport() {
		this.toastr.success(
			this.appService.getTranslation('Utils.reportDownloadMessage'),
			this.appService.getTranslation('Utils.success')
		);
		this.appService.getUploadLinkAssetData(this.userId, this.userClientId).subscribe(
			async (res: any) => {
				if (res.success) {
					let finalData = [];
					if (res.data && res.data.length > 0) {
						for (let item of res.data) {
							let payload = {
								'Sr. No': item.srNo,
								Title: item.title ? item.title : '',
								Description: item.description ? item.description : '',
								Tags: item.tags ? item.tags : '',
								Link: item.link ? item.link : '',
								IsCreated: item.isCreated,
								'Error Message': item.errorMsg ? item.errorMsg : '',
								IsError: item.isError,
								'Created At': item.createdAt ? ' ' + moment(item.createdAt).local().format('YYYY-MM-DD HH:mm:ss') : '',
							};
							finalData.push(payload);
						}
					}

					var options = {
						fieldSeparator: ',',
						quoteStrings: '"',
						decimalseparator: '.',
						showLabels: false,
						showTitle: false,
						title: 'Link Assets CSV',
						useBom: false,
						noDownload: false,
						headers: [
							'Sr. No, Title',
							'Description',
							'Tags',
							'Link',
							'IsCreated',
							'Error Message',
							'IsError',
							'Created At',
						],
					};
					finalData = await this.appService.sanitizedData(finalData);
					const fileInfo = new ngxCsv(finalData, this.formulaLinkAssets, options);
				}
			},
			(error) => {}
		);
	}
}
