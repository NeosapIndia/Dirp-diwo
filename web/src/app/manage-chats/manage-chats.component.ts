import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ManageChatsService } from './manage-chats.service';
import { AppService } from '../app.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import * as moment from 'moment';
declare var $: any;

@Component({
	selector: 'app-manage-chats',
	templateUrl: './manage-chats.component.html',
	styleUrls: ['./manage-chats.component.scss'],
	animations: [routerTransition()],
})
export class ManageChatsComponent implements OnInit {
	chatsData: any[] = [];
	userChatsData: any[];
	selectedMessagePayload: any;
	searchFilter: any;
	userClient: any;
	roleId: any;
	writePermission: any;
	totalCount: any;
	page: number = 1;
	limit: any = 25;
	pageResultCount = environment.pageResultsCount;
	inputSearchTxt: any;

	FilterChatsColumnForm: FormGroup;
	projectType = 'drip';
	FilterColumnArray = [
		{ label: 'Contact Name', value: 'first' },
		{ label: 'Message Preview', value: 'messagepreview' },
		{ label: 'Status', value: 'status' },
		{ label: 'Response Status', value: 'responsestatus' },
	];
	dropdownSettings: IDropdownSettings = {
		idField: 'value',
		textField: 'label',
		itemsShowLimit: 2,
		unSelectAllText: 'Unselect All',
	};

	prevSearchKey: any;
	isApiCall: boolean = false;
	typingTimer = null;
	isDataLoaded: boolean = false;
	sendReplyMessage: any;

	filterColumn: any;
	payload: { searchKey: any; filterColumn: any; selectedDate: any };
	selectedDate: { startDate: any; endDate: any };
	ranges: any = {
		Today: [moment(), moment()],
		Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	};
	invalidDates: moment.Moment[] = [];

	rangeMarks = {
		0: '0',
		10: '10',
		20: '20',
		30: '30',
		40: '40',
		50: '50',
		60: '60',
		70: '70',
		80: '80',
		90: '90',
		100: '100',
	};

	isInvalidDate = (m: moment.Moment) => {
		return this.invalidDates.some((d) => d.isSame(m, 'day'));
	};

	selectedMessageData: any;
	iconObject = {
		search_loader: null,
	};

	constructor(
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private chatService: ManageChatsService,
		private router: Router,
		public appService: AppService,
		private fb: FormBuilder
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.userClient = JSON.parse(localStorage.getItem('client'));
		if (JSON.parse(localStorage.getItem('chatsPageNo'))) {
			let pageDetails = JSON.parse(localStorage.getItem('chatsPageNo'));
			if (pageDetails.isPageChange == true) {
				this.page = pageDetails.pageNo;
			} else {
				this.page = 1;
			}
		} else {
			this.page = 1;
		}
		this.getRollPermission();
		this.createForm();
		this.FilterChatsColumnForm.controls['FilterColumn'].setValue(this.FilterColumnArray);

		let searchKeyData: any = JSON.parse(localStorage.getItem('searchChats'));
		if (searchKeyData) {
			this.inputSearchTxt = searchKeyData.searchKey;
			this.FilterChatsColumnForm.controls['FilterColumn'].setValue(searchKeyData.filterColumn);
			if (searchKeyData.selectedDate.startDate != null) {
				this.selectedDate = {
					startDate: moment(searchKeyData.selectedDate.startDate),
					endDate: moment(searchKeyData.selectedDate.endDate),
				};
			} else {
				this.selectedDate = null;
			}
			this.getChatsByFilter(this.inputSearchTxt);
		} else {
			this.getChatsData(this.userClient.id, this.page, this.limit);
		}
		localStorage.removeItem('chatsPageNo');
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createForm() {
		this.FilterChatsColumnForm = this.fb.group({
			FilterColumn: [null],
		});
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'RW',
			menuId: [31],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
			}
		});
	}

	getChatsData(clientid, page, limit) {
		this.spinnerService.show();
		this.chatService.getAllChatData(page, limit).subscribe((res: any) => {
			if (res.success) {
				this.chatsData = [];
				for (let chat of res.data) {
					let createdTime = moment(chat.createdAt);
					let currentTime = moment();
					let timeDifferenceInHours = currentTime.diff(createdTime, 'hours');

					if (timeDifferenceInHours > 24) {
						chat.status = 'Inactive';
					} else {
						chat.status = 'Active';
					}

					if (chat.respStatus == null || chat.respStatus == undefined || chat.respStatus == '') {
						chat.respStatus = 'Unread';
					}

					this.chatsData.push(chat);
					this.totalCount = res.count;
				}
				this.isDataLoaded = true;
				this.isApiCall = false;
				setTimeout(() => {
					this.spinnerService.hide();
				}, 300);
			} else {
				this.isDataLoaded = true;
				this.isApiCall = false;
				this.spinnerService.hide();
			}
		});
	}

	replyMessagePopup(message) {
		// console.log('-message-', message);
		this.selectedMessageData = {
			messageStatus: message.status,
			selectedLearnerName: message.first + ' ' + message.last,
		};
		this.selectedMessagePayload = {
			UserId: message.UserId,
			bot_id: message.id,
			selectedPhoneNo: message.phone,
		};
		this.getSingleUserChat(this.userClient.id, message.UserId);

		if (message.respStatus != 'Read' && message.respStatus != 'Replied') {
			this.markAsRead(message, false);
		}

		setTimeout(() => {
			$('#whatsAppMessageReplyModel').modal('show');
		}, 200);
	}

	onSendReply() {
		this.spinnerService.show();
		this.selectedMessagePayload.sendReplyMessage = this.sendReplyMessage;
		this.chatService.sendWhatsAppMesReply(this.userClient.id, this.selectedMessagePayload).subscribe((res: any) => {
			if (res.success) {
				this.sendReplyMessage = null;
				this.getChatsData(this.userClient.id, this.page, this.limit);
				$('#whatsAppMessageReplyModel').modal('hide');
				this.toastr.success(
					this.appService.getTranslation('Pages.Chats.Home.Toaster.sendMessage'),
					this.appService.getTranslation('Utils.success')
				);
				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	markAsRead(item, comingfrom) {
		this.spinnerService.show();
		this.chatService.chatMarkAsRead(this.userClient.id, item.id).subscribe((res: any) => {
			if (res.success) {
				this.getChatsData(this.userClient.id, this.page, this.limit);
				if (comingfrom) {
					this.toastr.success(
						this.appService.getTranslation('Pages.Chats.Home.Toaster.markasread'),
						this.appService.getTranslation('Utils.success')
					);
				}

				this.spinnerService.hide();
			} else {
				this.spinnerService.hide();
			}
		});
	}

	getSingleUserChat(clientid, UserId) {
		this.chatService.getSingleUserChat(clientid, UserId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.userChatsData = [];

					for (let item of res.data) {
						item.createdAt = this.formatDateTime(item.createdAt);
						this.userChatsData.push(item);
					}
				}
			}
		});
	}

	formatDateTime(createdAt) {
		let date = new Date(createdAt);
		let formattedDate = date.toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD format
		let options: any = { hour: 'numeric', minute: 'numeric', hour12: true }; // Format time in 12-hour clock with am/pm
		let formattedTime = date.toLocaleTimeString('en-US', options);

		return `${formattedDate} ${formattedTime}`;
	}

	cancelReplyModal() {
		$('#whatsAppMessageReplyModel').modal('hide');
		this.sendReplyMessage = null;
	}

	onPageChangeEvent(evnt) {
		this.page = evnt;
		if (this.inputSearchTxt && this.inputSearchTxt == this.prevSearchKey) {
			this.getChatsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt && this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
			this.getChatsByFilter(this.inputSearchTxt);
		} else {
			this.getChatsData(this.userClient.id, this.page, this.limit);
		}
	}

	changeResult(count) {
		this.page = 1;
		if (this.inputSearchTxt != undefined) {
			if (count == 'all') {
				this.limit = count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
		} else {
			if (count == 'all') {
				this.limit = count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
			if (typeof this.limit == 'string') {
				this.limit = count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
			if ((this.totalCount > this.limit || +count < this.limit) && this.limit != +count) {
				this.limit = +count;
				this.getChatsData(this.userClient.id, this.page, this.limit);
			}
		}
	}

	isNumber(s) {
		for (let i = 0; i < s.length; i++) if (s[i] < '0' || s[i] > '9') return false;
		return true;
	}

	getChatsByFilter(key) {
		this.inputSearchTxt = key;
		if (this.inputSearchTxt !== this.prevSearchKey) {
			this.page = 1;
		}
		this.prevSearchKey = key;

		let chars;

		if (key !== null && key !== undefined && key !== '') {
			if (this.isNumber(key)) {
				chars = 0;
			} else {
				chars = 2;
			}
		}

		if (this.FilterChatsColumnForm.value.FilterColumn != null) {
			this.filterColumn = this.FilterChatsColumnForm.value.FilterColumn.map((item: any) => {
				return item;
			});
		}

		if (this.FilterChatsColumnForm.value.FilterColumn != null && this.selectedDate != null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: this.selectedDate,
			};
		} else if (this.FilterChatsColumnForm.value.FilterColumn != null && this.selectedDate == null) {
			this.payload = {
				searchKey: key,
				filterColumn: this.filterColumn,
				selectedDate: { startDate: null, endDate: null },
			};
		} else if (this.selectedDate != null && this.FilterChatsColumnForm.value.FilterColumn == null) {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: this.selectedDate,
			};
		} else {
			this.payload = {
				searchKey: key,
				filterColumn: [],
				selectedDate: { startDate: null, endDate: null },
			};
		}

		localStorage.setItem('searchChats', JSON.stringify(this.payload));

		if (
			(this.inputSearchTxt && this.inputSearchTxt.length == 0) ||
			this.inputSearchTxt == null ||
			this.inputSearchTxt == undefined ||
			this.inputSearchTxt == ''
		) {
			this.getChatsData(this.userClient.id, this.page, this.limit);
			clearTimeout(this.typingTimer);
			return;
		}
		if (this.inputSearchTxt && this.inputSearchTxt.length > chars && this.inputSearchTxt.length !== 0) {
			this.isApiCall = true;
			clearTimeout(this.typingTimer);
			this.typingTimer = setTimeout(() => {
				this.chatService.getSearchWhatsAppChats(this.payload, this.page, this.limit).subscribe(
					(res: any) => {
						setTimeout(() => {
							this.spinnerService.hide();
						}, 300);
						this.isApiCall = false;
						this.isDataLoaded = true;
						if (res.success) {
							this.chatsData = [];
							for (let chat of res.data) {
								let createdTime = moment(chat.createdAt);
								let currentTime = moment();
								let timeDifferenceInHours = currentTime.diff(createdTime, 'hours');

								if (timeDifferenceInHours > 24) {
									chat.status = 'Inactive';
								} else {
									chat.status = 'Active';
								}

								if (chat.respStatus == null || chat.respStatus == undefined || chat.respStatus == '') {
									chat.respStatus = 'Unread';
								}

								// if (!chat.isReplied) {

								// } else {
								// 	chat.status = 'Resolved';
								// }

								this.chatsData.push(chat);
								this.totalCount = res.count;
							}
						} else {
							this.toastr.error(res.error, 'Error');
						}
					},
					(error) => {}
				);
			}, this.appService.timeout);
		}
	}

	startDateClicked(value: any) {
		this.selectedDate.startDate = value.startDate.$d;
	}
	endDateClicked(value: any) {
		this.selectedDate.endDate = value.endDate.$d;
	}

	onSelectFilterDate(value: any) {
		if (value.startDate && value.endDate && this.inputSearchTxt) {
			this.selectedDate.startDate = moment(value.startDate.$d).format('YYYY-MM-DD');
			this.selectedDate.endDate = moment(value.endDate.$d).subtract(1, 'day').format('YYYY-MM-DD');
			this.getChatsByFilter(this.inputSearchTxt);
		} else if (this.inputSearchTxt) {
			this.getChatsByFilter(this.inputSearchTxt);
		}
	}
}
