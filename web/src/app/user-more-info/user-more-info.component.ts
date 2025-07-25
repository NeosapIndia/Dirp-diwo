import { Component, OnInit, Input } from '@angular/core';
import { UserMoreInfoService } from './user-more-info.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { AppService } from '../app.service';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
declare var $: any;
declare var moment: any;
// import { IMyDpOptions } from 'mydatepicker';
import { ManageUserService } from '../manage-user/manage-user.service';

@Component({
	selector: 'app-user-more-info',
	templateUrl: './user-more-info.component.html',
	styleUrls: ['./user-more-info.component.css'],
})
export class UserMoreInfoComponent implements OnInit {
	materialSetList = [];
	selectedRole: any = [];
	currentRole: any = [];
	selectedRole3: any = [];
	selectedRole4: any = [];
	selectedRole5: any = [];
	is_internals = false;
	reasonForm: FormGroup;
	roleForm: FormGroup;
	userId: any;
	firstName: any;
	purchaseHistoryForUser: any;
	userExpertCallHistory: any;
	userActivityLogHistory: any;
	notifications: any;
	userSupportCallHistory: any;
	packageList: any;
	symbol: any;
	deductions: any = [];
	total_deductions: any = 0;
	total_refunds: any = 0;
	total_cost: any = 0;
	currency: any;
	courierList: any;
	userAddress: any = [];
	boxDetails: any;
	allRoles: any = [];
	childList: any = [];
	childId = 0;
	settingPackageData: any;
	settingPackageFlage = false;
	roleSetFlage = false;
	public updateShippingData: FormGroup;
	packageEntityDetails: any;
	// public dateOfShippingOptions: IMyDpOptions = {
	//   dateFormat: environment.dateFormat
	// };
	// public dateofShippingOptions: IMyDpOptions = {
	//   dateFormat: environment.dateFormat,
	//   disableSince: {
	//     year: new Date().getFullYear(),
	//     month: new Date().getMonth() + 1,
	//     day: new Date().getDate() + 1
	//   },
	//   disableUntil: {
	//     year: new Date().getFullYear(),
	//     month: new Date().getMonth() + 1,
	//     day: new Date().getDate() - 4
	//   }
	// };
	selectedMarket: any;
	constructor(
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private userMoreInfo: UserMoreInfoService,
		private route: ActivatedRoute,
		public appService: AppService,
		private formBuilder: FormBuilder,
		private manageUserService: ManageUserService
	) {}

	ngOnInit() {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		this.selectedMarket = JSON.parse(localStorage.getItem('user')).user.Market.name || null;

		this.userId = JSON.parse(localStorage.getItem('activeProfileId')) || null;
		let role = localStorage.getItem('role');
		if (role == 'Super Admin' || role == 'Global Super Admin' || role == 'Global Admin') {
			this.roleSetFlage = true;
		}
		if (this.userId == null) {
			this.userId = this.route.params['value'].id;
		}
		this.route.queryParams.subscribe((params) => {
			this.packageList = params['packageList'];
			this.firstName = params['first'];
		});
		if (this.packageList == 'packageList') {
			this.getPurchaseHistoryForUser();
			$('#subscrictionHistory').modal('show');
		}
		this.reasonForm = this.formBuilder.group({
			id: null,
			reason: null,
			userId: null,
			userName: null,
		});

		this.updateShippingData = this.formBuilder.group({
			dateofshipping: [null, Validators.required],
			couriername: [null, Validators.required],
			bill_no: [null, Validators.required],
			material_set: [null, Validators.required],
		});
		this.getRoles(this.userId);
		this.getCourier();
		this.getUserBaby();
		this.getMaterialSetName();
	}
	get f1() {
		return this.updateShippingData.controls;
	}

	async getRoles(userId: any) {
		// this.consumerService.getRoles(userId).toPromise().then((res: any) => {
		//   if (res.success) {
		//     this.currentRole = [];
		//     if (res.data.userdata.is_internal != null) {
		//       this.is_internals = res.data.userdata.is_internal;
		//     }
		//     this.allRoles = res.data.roles[0];
		//     for (const id in res.data.userrole) {
		//       this.currentRole.push(res.data.userrole[id].id);
		//     }
		//     this.selectedRole = this.currentRole;
		//   } else {
		//     this.spinnerService.hide();
		//     this.toastr.error(res.error, "Alert");
		//   }
		// }, failed => {
		//   console.log('Rejected', failed);
		// });
	}

	ManageRole() {
		this.selectedRole = this.currentRole;
		$('#RoleModal').modal('show');
	}

	checkList() {
		var length = this.selectedRole.length;
		var obj = {
			userId: this.userId,
			data: this.selectedRole,
		};
		if (length == 0) {
			this.toastr.error('Any one role should be assigned');
		} else if (this.selectedRole.includes(2)) {
			// this.consumerService.updateRoles(obj).subscribe((res: any) => {
			//   if (res.success) {
			//     $('#RoleModal').modal('hide');
			//     this.getRoles(this.userId);
			//     this.toastr.success("Updated Roles successfully");
			//   } else {
			//     this.spinnerService.hide();
			//     this.toastr.error(res.error, "Alert");
			//   }
			// }, error => {
			// });
		} else {
			this.toastr.error('You can not remove Customer Role');
		}
	}

	isInternal(is_internal: any) {
		this.is_internals = is_internal;
		// this.consumerService.is_internal(this.userId, this.is_internals).subscribe((res: any) => {
		//   if (res.success) {
		//     this.toastr.success(res.message, this.appService.getTranslation('Utils.success'));
		//   } else {
		//     this.spinnerService.hide();
		//     this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
		//   }
		// }, error => {
		// }
		// );
	}

	cancelReason() {
		$('#reasonModal').modal('hide');
	}

	downloadInvoice(item: any) {
		this.spinnerService.show();
		setTimeout(() => {
			this.spinnerService.hide();
		}, 500);
		// this.consumerService.downloadInvoice(item.id).toPromise().then(res => {
		//   let link = document.createElement('a');
		//   link.href = window.URL.createObjectURL(res);
		//   let suff = item.orderId;
		//   if (item.package.is_gst) {
		//     link.download = `Invoice-${suff}.pdf`;
		//   } else {
		//     link.download = `Receipt-${suff}.pdf`;
		//   }
		//   link.click();
		// }, failed => {
		//   console.log('Rejected', failed);
		// }).catch(err => {
		//   console.log('Caught error', err);
		// });
		// window.open(`${environment.apiUrl}/downloadRefundReceipt?id=${item.id}`,'_blank');
	}

	downloadRefund(item: any) {
		this.spinnerService.show();
		setTimeout(() => {
			this.spinnerService.hide();
		}, 500);
		// this.consumerService.downloadRefund(item.id).toPromise().then(res => {
		//   let link = document.createElement('a');
		//   link.href = window.URL.createObjectURL(res);
		//   let suff = item.orderId;
		//   link.download = `Refund-${suff}.pdf`;
		//   link.click();
		// }, failed => {
		//   console.log('Rejected', failed);
		// }).catch(err => {
		//   console.log('Caught error', err);
		// });
		// window.open(`${environment.apiUrl}/downloadRefundReceipt?id=${item.id}`,'_blank');
	}

	DeletePakagePopup(item) {
		let role = JSON.parse(localStorage.getItem('user')).user.roles[0] || null;
		if (role == 'Support') {
			this.toastr.warning('Sorry! You are not authorised to delete package.', 'Alert!');
			return;
		}

		this.userMoreInfo.getDeductionsDetails(item.id).subscribe(
			(res: any) => {
				if (res.success) {
					this.spinnerService.hide();
					this.deductions = res.data.deductions;
					this.total_deductions = res.data.total_deductions;
					this.total_refunds = res.data.amount_to_be_refunded;
					this.total_cost = res.data.total_paid;
					this.reasonForm.controls['id'].setValue(item.id);
					this.reasonForm.controls['userId'].setValue(JSON.parse(this.userId));
					this.reasonForm.controls['userName'].setValue(JSON.parse(localStorage.getItem('user')).user.first);
					$('#reasonModal').modal('show');
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, 'Alert');
				}
			},
			(error) => {}
		);
	}

	onCancelPackage() {
		this.userMoreInfo.deleteBuyItem(this.reasonForm.value.id, this.reasonForm.value).subscribe(
			(res: any) => {
				if (res.success) {
					if (localStorage.getItem('role') == 'Global Super Admin' || localStorage.getItem('role') == 'Global Admin') {
						this.toastr.success('Package successfully cancelled!', 'Success');
					} else {
						this.toastr.success('Thank You! Request raised.', 'Success!');
					}
					this.reasonForm.reset();
					$('#reasonModal').modal('hide');
					$('#subscrictionHistory').modal('hide');
					this.getPurchaseHistoryForUser();
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, 'Alert');
				}
			},
			(error) => {}
		);
	}

	getPurchaseHistoryForUser() {
		this.spinnerService.show();
		this.userMoreInfo.getPackagePuchaseHistoryById(this.userId).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.purchaseHistoryForUser = res.data;
					for (let i in res.data) {
						if (res.data[i].User_box_deliveries.length > 0) {
							let boxs = res.data[i].User_box_deliveries.sort((a, b) => {
								return <any>new Date(a.box_shipping_date) - <any>new Date(b.box_shipping_date);
							});
							this.purchaseHistoryForUser[i].User_box_deliveries = boxs;
						}
					}
					if (this.purchaseHistoryForUser.length > 0) {
						this.getCurrencies(this.purchaseHistoryForUser[0].CurrencyId);
					}
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	getCurrencies(CurrencyId) {
		this.appService.getCurrencies().subscribe(
			(res: any) => {
				if (res.success) {
					let currencyInfo = res.data;
					let currency = currencyInfo.find((currency) => currency.id == CurrencyId);
					this.symbol = currency.currencySymbol;
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	getExpertCallHistory() {
		this.spinnerService.show();
		this.userMoreInfo.getExpertCallHistory(this.userId).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.userExpertCallHistory = res.data;
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	getSupportTicketHistory() {
		this.spinnerService.show();
		this.userMoreInfo.getSupportTicketHistory(this.userId).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.userSupportCallHistory = res.data;
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	getActivityLogHistory() {
		this.spinnerService.show();
		this.userMoreInfo.getActivityLogHistory(this.userId).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.userActivityLogHistory = res.data;
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	getNotifications() {
		this.spinnerService.show();
		this.userMoreInfo.getNotifications(this.userId).subscribe(
			(res: any) => {
				this.spinnerService.hide();
				if (res.success) {
					this.notifications = res.data;
				} else {
					this.toastr.error(res.error, 'Error');
				}
			},
			(error) => {}
		);
	}

	boxStatusPopup(data: any) {
		this.updateShippingData.reset();
		this.packageEntityDetails = data;
		$('#updateDeliveryDate').modal('show');
	}

	addressInfoModal(item, box) {
		this.userAddress = box.User.User_addresses[0];
		this.boxDetails = box.box_details;
		$('#addressInfoModal').modal('show');
	}

	cancelAddressInfoModal() {
		$('#addressInfoModal').modal('hide');
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

	updateShippingDateById() {
		if (this.updateShippingData.invalid) {
			this.markAsTouched(this.updateShippingData);
			return;
		}
		this.spinnerService.show();
		var validate = this.updateShippingData.controls['dateofshipping'].value;

		var couriername = this.updateShippingData.controls['couriername'].value;
		var bill_no = this.updateShippingData.controls['bill_no'].value;
		if (validate != null) {
			if (validate.date.month < 10) {
				validate.date.month = 0 + '' + validate.date.month;
			}
			if (validate.date.day < 10) {
				validate.date.day = 0 + '' + validate.date.day;
			}
			var formattedDate = validate.date.year + '-' + validate.date.month + '-' + validate.date.day;
			var obj = {
				id: this.packageEntityDetails.id,
				actual_shipping_date: formattedDate,
				courier: couriername,
				bill_no: bill_no,
				material_set: this.updateShippingData.controls['material_set'].value,
			};
			// this.consumerService.updateDeliveryDate(obj).subscribe((res: any) => {
			//   if (res.success) {
			//     $('#updateDeliveryDate').modal("hide");
			//     this.getPurchaseHistoryForUser();
			//   } else {
			//     this.spinnerService.hide();
			//     this.toastr.error(res.error, "Error");
			//   }
			// }, error => {
			// })
		}
	}

	getCourier() {
		// this.courierService.getAllCourierInfo(0, 100, this.selectedMarket).subscribe((res: any) => {
		//   this.spinnerService.hide();
		//   if (res.success) {
		//     this.courierList = res.data;
		//   } else {
		//     this.toastr.error(res.error, "Error");
		//   }
		// }, error => {
		// });
	}

	getUserBaby() {
		this.manageUserService.getChilds(this.userId).subscribe(
			(res: any) => {
				if (res.success) {
					this.childList = res.data;
				} else {
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
			},
			(error) => {}
		);
	}

	pakageSetting(item: any) {
		this.settingPackageFlage = true;
		this.settingPackageData = item;
		$('#packageSettingModel').modal('show');
	}

	cancelpackageSettingModel() {
		$('#packageSettingModel').modal('hide');
	}

	changeResult(event: any) {
		this.childId = parseInt(event);
	}

	clickOnAssignPackage(packageId: any, childId: any, packageData: any) {
		if (this.childId == 0) {
			this.toastr.error('No child selected', 'Error');
		} else {
			if (this.settingPackageData.cancellation_date != null) {
				this.toastr.error('This package is cancelled', 'Error');
			} else if (
				this.settingPackageData.renewal_date != null &&
				!moment(this.settingPackageData.renewal_date).isAfter(moment().format('YYYY-MM-DD') + 'T00:00:00.000z')
			) {
				this.toastr.error('This package is expired you can not assign to any baby', 'Error');
			} else if (packageData.package.is_payment_colection) {
				this.toastr.error('This package is collection package you can not perform this action', 'Error');
			} else {
				if (this.settingPackageData.reserved_for != null) {
					this.toastr.error('This package is all ready reserved for baby', 'Error');
				} else {
					let pacakgeAssignFlage = true;
					let allReadypacakge = false;
					for (let i in this.childList) {
						if (this.childList[i].PackageId == packageId) {
							pacakgeAssignFlage = false;
						}
						if (this.childList[i].id == childId) {
							if (this.childList[i].PackageId != null) {
								pacakgeAssignFlage = false;
								allReadypacakge = true;
							}
						}
					}
					if (pacakgeAssignFlage) {
						this.spinnerService.show();
						this.manageUserService.assignPackageToBaby({ childId, packageId }).subscribe(
							(res: any) => {
								this.spinnerService.hide();
								if (res.success) {
									this.toastr.success(
										this.appService.getTranslation('Account.Manage.Account.packageAssigned'),
										this.appService.getTranslation('Utils.success')
									);
									this.childId = 0;
									this.getPurchaseHistoryForUser();
									this.getUserBaby();
								} else {
									let error = res.error;
									if (res.message) error = res.message;
									this.toastr.error(error, this.appService.getTranslation('Utils.error'));
								}
								this.getUserBaby();
								$('#packageSettingModel').modal('hide');
							},
							(error) => {
								this.spinnerService.hide();
							}
						);
					} else {
						if (allReadypacakge) {
							this.toastr.error('This baby already has a package assigned', 'Error');
						} else {
							this.toastr.error('This package is already assigned to other baby', 'Error');
						}
					}
				}
			}
		}
	}

	clickOnRemovePackage(packageId: any, childId: any, packageData: any) {
		if (this.childId == 0) {
			this.toastr.error('No child selected', 'Error');
		} else {
			if (this.settingPackageData.cancellation_date != null) {
				this.toastr.error('This package is cancelled', 'Error');
			} else if (packageData.package.is_payment_colection) {
				this.toastr.error('This package is collection package you can not perform this action', 'Error');
			} else {
				if (this.settingPackageData.reserved_for != null) {
					this.toastr.error('This package is already reserved for baby', 'Error');
				} else {
					let pacakgeAssignFlage = false;
					for (let i in this.childList) {
						if (this.childList[i].id == childId) {
							if (this.childList[i].PackageId == packageId) {
								pacakgeAssignFlage = true;
							}
						}
					}
					if (pacakgeAssignFlage) {
						this.spinnerService.show();
						this.manageUserService.removeAssignPackageFromBaby({ childId, packageId }).subscribe(
							(res: any) => {
								this.spinnerService.hide();
								if (res.success) {
									this.toastr.success('Package Remove Successfully', this.appService.getTranslation('Utils.success'));
									this.childId = 0;
									this.getPurchaseHistoryForUser();
									this.getUserBaby();
								} else {
									this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
								}
								$('#packageSettingModel').modal('hide');
							},
							(error) => {
								this.spinnerService.hide();
							}
						);
					} else {
						this.toastr.error('This package is not connected to this baby', 'Error');
					}
				}
			}
		}
	}

	clickOnReservePackage(packageId: any, childId: any, packageData: any) {
		if (this.childId == 0) {
			this.toastr.error('No child selected', 'Error');
		} else if (packageData.package.is_payment_colection) {
			this.toastr.error('This package is collection package you can not perform this action', 'Error');
		} else {
			if (this.settingPackageData.cancellation_date != null) {
				this.toastr.error('This package is cancelled', 'Error');
			} else {
				if (
					this.settingPackageData.renewal_date != null &&
					!moment(this.settingPackageData.renewal_date).isAfter(moment().format('YYYY-MM-DD') + 'T00:00:00.000z')
				) {
					this.toastr.error('This package is expired you can not assign to any baby', 'Error');
				} else {
					let pacakgeAssignFlage = true;
					for (let i in this.childList) {
						if (this.childList[i].id == childId) {
							if (this.childList[i].PackageId == packageId) {
								pacakgeAssignFlage = false;
							}
						}
					}
					if (pacakgeAssignFlage) {
						if (packageData.reserved_for) {
							this.toastr.error('This package is all ready reserved for baby', 'Error');
						} else {
							this.spinnerService.show();
							this.manageUserService.assignPackageToChild({ childId, packageId }).subscribe(
								(res: any) => {
									setTimeout(() => {
										this.spinnerService.hide();
										if (res.success) {
											this.toastr.success(
												'Package Reserved For Baby Successfully',
												this.appService.getTranslation('Utils.success')
											);
											this.childId = 0;
											this.getPurchaseHistoryForUser();
											this.getUserBaby();
										} else {
											this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
										}
									}, 500);
									$('#packageSettingModel').modal('hide');
								},
								(error) => {
									this.spinnerService.hide();
								}
							);
						}
					} else {
						this.toastr.error('This package is already assigned to another baby', 'Error');
					}
				}
			}
		}
	}

	clickOnRemoveReservePackage(packageId: any, childId: any, packageData: any) {
		if (this.childId == 0) {
			this.toastr.error('No child selected', 'Error');
		} else if (packageData.package.is_payment_colection) {
			this.toastr.error('This package is collection package you can not perform this action', 'Error');
		} else {
			if (this.settingPackageData.cancellation_date != null) {
				this.toastr.error('This package is cancelled', 'Error');
			} else {
				if (this.settingPackageData.reserved_for != null) {
					this.spinnerService.show();
					this.manageUserService.removeResevedPackageFromBaby({ childId, packageId }).subscribe(
						(res: any) => {
							this.spinnerService.hide();
							if (res.success) {
								this.toastr.success(
									'Remove Reserved Package Form Baby Successfully',
									this.appService.getTranslation('Utils.success')
								);
								this.childId = 0;
								this.getPurchaseHistoryForUser();
								this.getUserBaby();
							} else {
								this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
							}
							$('#packageSettingModel').modal('hide');
						},
						(error) => {
							this.spinnerService.hide();
						}
					);
				} else {
					this.toastr.error('This package is not reserved for any baby', 'Error');
				}
			}
		}
	}

	getMaterialSetName() {
		this.userMoreInfo.getMaterialBoxSetName(this.selectedMarket).subscribe((res: any) => {
			this.materialSetList = res.data.setName;
		});
	}
}
