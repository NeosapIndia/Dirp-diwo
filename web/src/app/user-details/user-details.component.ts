import { Component, OnInit, Input } from '@angular/core';
import { UserDetailsService } from './user-details.service';
import { ManageUserService } from '../manage-user/manage-user.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppService } from '../app.service';
import { environment } from '../../environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
// import { IMyDpOptions } from 'mydatepicker';
import { UserMoreInfoService } from '../user-more-info/user-more-info.service';
declare var $: any;

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  providers: [UserDetailsService, ConfirmationService]

})

export class UserDetailsComponent implements OnInit {
  addBabyFlag: boolean = false;
  birthDay = '';
  birthMonth = '';
  birthYear = '';
  index: any;
  writePermission: boolean = false;
  public addressForm: FormGroup;
  reasonForm: FormGroup;
  @Input() userId: any;
  @Input() showMoreInfo: any;
  routeHome: boolean = false;
  user: any = {};
  questionNumber: any = 0;
  firstAns: any;
  secondAns: any;
  thirdAns: any;
  uId: any
  saveValue: boolean = false;
  questionRequired: any = false;
  saveResponseChildId: any;
  addressId: any;
  phoneFlag: boolean = false;
  emailFlag: boolean = false;
  formFlag: boolean = false;
  disableButton: boolean = true;
  defaultAddressFlage: boolean = true;
  countryId: any;
  provinces: any;
  country: any;
  countryName: any;
  radioBtnValue: any;
  setDefaultAdd: any;
  babyId: any;
  packageId: any;
  activeBaby: any = false;
  lateralQuestionContentsInfo: any;
  weeks: number;
  responseFlag: boolean = false;
  certificateNameChildId: number;
  deleteAddressId: any;
  hideMobileField = false;
  showBaby = false;

  optionArray = [
    { quetion: 'first', value: false, option: 1 },
    { quetion: 'first', value: false, option: 2 },
    { quetion: 'first', value: false, option: 3 },
    { quetion: 'first', value: false, option: 4 },
    { quetion: 'secound', value: false, option: 1 },
    { quetion: 'secound', value: false, option: 2 },
    { quetion: 'secound', value: false, option: 3 },
    { quetion: 'secound', value: false, option: 4 },
    { quetion: 'third', value: false, option: 1 },
    { quetion: 'third', value: false, option: 2 },
    { quetion: 'third', value: false, option: 3 },
    { quetion: 'third', value: false, option: 4 },
  ];
  public role: any;
  public userInfo: any = {};
  public userAddressInfo: any = [];
  public languageList = [];
  public userInfoForm: FormGroup;
  public file: any;
  showCard_display: any;
  key: any;
  item: any;
  // public dateOfBirthOptions: IMyDpOptions = {
  //   dateFormat: environment.dateFormat
  // };
  // public plannedOptions: IMyDpOptions = {
  //   dateFormat: environment.dateFormat,

  // };
  editAddress: boolean = false;
  editPhone: boolean = false;
  mobileFlag: boolean = false;
  updateAddressParam: any;
  countryList: any = [];
  editUserForm: any = false;
  minDate = new Date();
  maxDate = new Date();
  indicateInvalidDate = true;
  changeAddressFlag: boolean = false;
  addAddressParam: any;
  disabledBtn1: boolean = true;
  previousdBtn1: boolean = false;
  responseFlag1: boolean = false;
  showShowCardToggle: boolean = true;
  temprefresherToggle: boolean = true;
  permrefresherToggle: boolean = true;
  regionalLanguage: any;
  regionalLanguageList: any;
  usertype: boolean = false;
  userIsCustomer: boolean = false
  callingCode = "+91";
  adminRole;
  userMarketName: string;
  restricted_roles = ['Super Admin', 'Admin'];
  user_role = localStorage.getItem('role');
  daycountfromBirthDay: number = 0;

  constructor(private confirmationService: ConfirmationService,
    private manageUserService: ManageUserService,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public appService: AppService,
    private userMoreInfo: UserMoreInfoService,
  ) { }

  async ngOnInit() {
    let varebale = document.getElementById("reve-chat-container-div");
    if (varebale) {
      varebale.style.display = 'none';
    }
    let global_roles = ['Expert', 'Finance', 'Supply Chain Manager', 'Supply Chain Partner', 'Advisor', 'Support Admin', 'Support Partner', 'Support Manager', 'Admin', 'Super Admin', 'Customer', 'Care Giver', 'Operations', 'Global Supply Chain'];
    let write_Permission = ['Global Super Admin', 'Global Admin', 'Super Admin', 'Admin', 'Customer', 'Care Giver'];
    let admin_user_role = localStorage.getItem('adminrole');
    if (admin_user_role != null && admin_user_role != '') {
      for (let per of write_Permission) {
        if (admin_user_role == per) {
          this.writePermission = true;
        }
      }
    } else if (localStorage.getItem('role')) {
      admin_user_role = localStorage.getItem('role');
      for (let per of write_Permission) {
        if (admin_user_role == per) {
          this.writePermission = true;
        }
      }
    } else {
      this.writePermission = true;
    }
    if (admin_user_role) {
      this.index = this.restricted_roles.indexOf(admin_user_role);
    } else if (localStorage.getItem('role')) {
      this.index = this.restricted_roles.indexOf(localStorage.getItem('role'));
    }
    if (localStorage.getItem('showShowCardToggle')) {
      this.showShowCardToggle = false;
    }
    this.spinnerService.show();
    this.user = JSON.parse(localStorage.getItem('user')).user || null;
    if (localStorage.getItem('adminrole')) {
      this.adminRole = localStorage.getItem('adminrole');
    }
    if (this.user.roles.find(role => ['Global Super Admin', 'Global Admin', 'Admin', 'Support Admin', 'Super Admin'].includes(role))) {
      this.editPhone = true;
    }

    if (localStorage.getItem('role') != 'Customer' && localStorage.getItem('role') != 'null' && localStorage.getItem('role') != null) {
      this.usertype = true;
    }
    if (localStorage.getItem('role') == 'Customer') {
      this.userIsCustomer = true;
    } else {
      this.userIsCustomer = false;
    }
    this.formUserInfo();
    this.formAddress();

    if (this.userId != null) {
      this.spinnerService.show();
      await this.getUserInfo(this.userId);
      this.getUserAddress(this.userId);
    }

    this.route.queryParamMap.subscribe(params => {
      this.addAddressParam = params.get('addAddress');
      if (params.get('route')) {
        this.routeHome = true;
      }
      if (params.get('updateAddress')) {
        this.editAddress = true;
        this.updateAddressParam = params.get('updateAddress');
      }
    })

    this.countries();
  }

  formAddress() {
    this.addressForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{10}$')]],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      pinCode: ['', [Validators.required]],
      state: ['', Validators.required],
      CountryId: ['', Validators.required],
      isDefault: false,
      isBilling: false
    });
  }


  isNotNumber(value) {
    return isNaN(+value);
  }

  ChangedefaultAddress() {
    this.changeAddressFlag = true;
  }

  formUserInfo() {
    this.userInfoForm = this.formBuilder.group({
      id: null,
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^\w+([\.-]?\w+.*\.*)*@\w+([\.-]?\w+)*(\.\w{2,})+$/)]],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      // regional_language: ['', Validators.required]
    });
  }

  get f() { return this.userInfoForm.controls; }
  get f3() { return this.addressForm.controls; }

  closeModule() {
    $('#addCertificateNameModel').modal('hide');
  }

  temprefresher() {
    this.temprefresherToggle = !this.temprefresherToggle;
    this.spinnerService.show();
    this.spinnerService.hide();
  }

  async getUserInfo(userId) {
    await this.manageUserService.getUser(this.userId).toPromise().then((res: any) => {
      this.spinnerService.hide();
      if (res.success) {
        this.userInfo = res.data.user;
        this.userInfo.name = this.userInfo.first + ' ' + this.userInfo.last;
        this.userInfoForm.patchValue(res.data.user);
        this.userInfoForm.controls['name'].setValue(this.userInfo.name);
        this.regionalLanguage = res.data.user.regional_language;
        var user = JSON.parse(localStorage.getItem('user')) || null;
        let showToggle = false;
        if (showToggle) {
          localStorage.setItem('showShowCardToggle', 'true');
        } else {
          if (localStorage.getItem('showShowCardToggle')) {
            localStorage.removeItem('showShowCardToggle');
          }
        }
        this.showShowCardToggle = true;
        if (localStorage.getItem('showShowCardToggle')) {
          this.showShowCardToggle = false;
        }
        user.user = { ...user.user, ...res.data.user };
        this.role = localStorage.getItem('role') || user.user.roles[0];
        this.responseFlag = true;
      } else {
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
    });
  }

  getUserAddress(userId) {
    this.manageUserService.getAddress(userId).subscribe((res: any) => {
      this.spinnerService.hide();
      if (res.success) {
        this.userAddressInfo = res.data;
        this.responseFlag1 = true;
      } else {
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
    }, error => {
    });
  }

  checkzipcode(zipcode, cnt) {
    zipcode = zipcode + "";
    let Regex;
    let country = this.countryList.find(country => country.name == cnt);
    // for (let i in zipcodeRegex) {
    //   if (zipcodeRegex[i].ISO == country.countryCode) {
    //     Regex = zipcodeRegex[i].Regex;
    //     break;
    //   }
    // }
    if (Regex.length > 0) {
      if (zipcode.match(Regex))
        return true;
      else
        return false;
    } else {
      return true;
    }
  }

  saveUserInfo() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    if (this.userInfoForm.invalid) {
      this.markAsTouched(this.userInfoForm);
      return;
    }
    if (this.phoneFlag || this.emailFlag) {
      return;
    }
    if ((this.userInfoForm.value.phone.toString().length != 10 && this.user.country == "India") || (this.userInfoForm.value.phone.toString().length < 5 && this.user.country != "India")) {
      // this.toastr.error("Please Enter Valid Phone number", 'Error');
      this.userInfoForm.controls['phone'].setErrors({ 'incorrect': true });
      return;
    } else {
      this.userInfoForm.controls['phone'].setErrors({ 'incorrect': false });
    }
    let zipvalidation = this.checkzipcode(this.userInfoForm.value.zipCode, this.userInfoForm.value.country);

    if (!zipvalidation) {
      this.toastr.error("Zip Code is Invalid", 'Error');
      return;
    }

    this.spinnerService.show();
    let data = this.userInfoForm.value;
    let name = this.userInfoForm.value.name;
    data.first = name.split(' ')[0];
    if (name.includes(' ')) {
      data.last = name.slice(name.indexOf(" ") + 1);
    } else {
      data.last = '';
    }
    this.manageUserService.updateUser(data).subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message, this.appService.getTranslation('Utils.success'));
        this.editUserForm = false;
        this.getUserInfo(this.userId);
        if (this.updateAddressParam == 'updateAddress') {
          this.router.navigate(['/consumer/cart']);
        }
      } else {
        this.spinnerService.hide();
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
    }, error => {
    });
  }

  cancelUserEdit() {
    this.phoneFlag = false;
    this.emailFlag = false;
    this.editUserForm = false;
    return;
  }

  monthDiff(d1, d2) {
    d2.setMonth(d2.getMonth() + 6);
    return d2 < d1;
  }

  getLateralContents() {
    this.spinnerService.show();
    this.appService.getLateralQuestionContents().subscribe((res: any) => {
      if (res.success) {
        this.lateralQuestionContentsInfo = res.data;
      } else {
        this.spinnerService.hide();
        this.toastr.error(res.error, "Error");
      }
    }, error => {
    });
  }

  changeSelection() {
    this.disableButton = false;
    this.questionRequired = false;
    this.disabledBtn1 = false;
  }

  clickOnOptions(index) {
    this.optionArray[index].value = !this.optionArray[index].value;
  }

  backpageName() {
    this.questionNumber--;
  }

  nextpageName() {
    this.questionNumber++;
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

  getDate(date1): any {
    let date = new Date(date1);
    return {
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    };
  }


  fileChangeEvent(event) {
    if ((event.target.files[0].type).includes("image")) {
      this.file = event.target.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#baby_img').attr('src', e.target.result);
      }
      reader.readAsDataURL(event.target.files[0]);
    } else {
      $('#baby-image').val(null);
      this.toastr.warning(this.appService.getTranslation('Utils.fileNotSupport'), this.appService.getTranslation('Utils.alert'));;
    }
  }

  imageRemove() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    $('#baby-image').val(null);
    this.file = null;
    $('#baby_img').attr('src', 'assets/images/customer/add_a_photo2.png');
  }


  cancelDelete() {
    $('#userChildDeleteConfModal').modal('hide');
    $('#primaryChildDeleteConfModal').modal('hide');
    $('#activePackageChildDeletedConfModal').modal('hide');
    $('#userCaregiverDeleteConfModal').modal('hide');
  }

  getFormatedDate(date) {
    return date ? date.year + "-" + date.month + "-" + date.day : '';
  }

  updateUserProfilePic(event) {
    var file = event.target.files[0];
    if (file != null && file.type.includes("image")) {
      this.spinnerService.show();
      const uploadData = new FormData();
      uploadData.append('picture', file);
      this.manageUserService.updateUserProfilePic(this.userId, uploadData).subscribe((res: any) => {
        if (res.success) {
          this.toastr.success(this.appService.getTranslation('Account.Manage.Profile.Babies.profileUpdated'), this.appService.getTranslation('Utils.success'));
          this.getUserInfo(null);
        } else {
          this.spinnerService.hide();
          this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
        }
      }, error => {
      });
    } else {
      $('#profilePic').val(null);
      this.toastr.warning(this.appService.getTranslation('Utils.fileNotSupport'), this.appService.getTranslation('Utils.alert'))
    }
  }

  removeUserProfilePic() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    let confirmMsg = this.appService.getTranslation('Confirm.userDetail.profilePic.deleteMsg');
    let confirmationHeader = this.appService.getTranslation('Confirm.userDetail.profilePic.confirmationHeader');
    let successMessage = this.appService.getTranslation('Confirm.userDetail.profilePic.successMessage');
    this.confirmationService.confirm({
      message: confirmMsg,
      header: confirmationHeader,
      icon: 'fa fa-trash',
      accept: () => {
        this.spinnerService.show();
        const uploadData = new FormData();
        uploadData.append('picture', null);
        this.manageUserService.updateUserProfilePic(this.userId, uploadData).subscribe((res: any) => {
          if (res.success) {
            this.toastr.success(successMessage, 'Success!');
            $('#profilePic').val(null);
            this.getUserInfo(null);
          } else {
            this.spinnerService.hide();
            this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
          }
        }, error => {
        });
      }
    });
  }

  countries() {
    this.appService.getCountries().toPromise().then((res: any) => {
      if (res.success) {
        this.countryList = res.data;
        this.country = this.countryList.find(country => country.name == this.userInfo.country);
        this.countryId = this.country.id;
        this.callingCode = this.country.callingCode;
        this.countryName = this.country.name;
        this.provinces = this.country.Provinces;
      } else {
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
    }, error => {
    });
  }

  addAddressPopup() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    if (this.userAddressInfo.length == 0) {
      this.defaultAddressFlage = false;
    } else {
      this.defaultAddressFlage = true;
    }
    if (this.userAddressInfo.length < 4) {
      this.saveValue = false;
      this.addressForm.reset();
      this.addressForm.controls['CountryId'].setValue(this.countryId);
      $('#addAddressModal').modal('show');
    } else {
      $('#addAddressModal').modal('hide');
      this.toastr.error(this.appService.getTranslation('UserAddress.addressErrorMessage'), this.appService.getTranslation('Utils.error'));
    }
  }

  editUserPopup(item) {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    this.formFlag = true;
    this.addressId = item.id;
    this.uId = item.UserId
    this.saveValue = true;
    this.addressForm.patchValue(item);
    $("#addAddressModal").modal('show');
    this.saveValue = true;
  }

  deletAddress(item) {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    this.deleteAddressId = item.id;
    $("#deleteAddressModel").modal('show');
  }

  cancelAddress() {
    this.changeAddressFlag = false;
    this.setDefaultAdd = null;
    this.addressForm.reset();
    this.formFlag = false;
    $('#addAddressModal').modal('hide');
  }

  setDefault() {
    this.spinnerService.show();
    this.manageUserService.updateAddress(this.userId, this.setDefaultAdd, { isDefault: true }).subscribe((res: any) => {
      if (res.success) {
        if (this.index >= 0) {
          this.toastr.success("Thank You! Request raised.", "Success!");
        } else {
          this.toastr.success(this.appService.getTranslation('UserAddress.addressUpdatedMessage'), this.appService.getTranslation('Utils.success'));
        }
        this.getUserAddress(this.userId);
        this.addressForm.reset();
        $('#addAddressModal').modal('hide');
      } else {
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
      setTimeout(() => {
        this.spinnerService.hide();
      }, 500);
    }, error => {
    });
    this.setDefaultAdd = null;
    this.changeAddressFlag = false;
  }


  deleteUserAddress(uId, userAddId) {
    $("#deleteAddressModel").modal('hide');
    let confirmMsg = this.appService.getTranslation('Confirm.userDetail.address.deleteMsg');
    let confirmationHeader = this.appService.getTranslation('Confirm.userDetail.address.confirmationHeader');
    let successMessage = this.appService.getTranslation('Confirm.userDetail.address.successMessage');
    this.confirmationService.confirm({
      message: confirmMsg,
      header: confirmationHeader,
      icon: 'fa fa-trash',
      accept: () => {
        this.spinnerService.show();
        this.manageUserService.deleteAddress(uId, userAddId).subscribe((res: any) => {
          if (res.success) {
            this.toastr.success(successMessage, this.appService.getTranslation('Utils.success'));
            this.getUserAddress(uId);
            this.addressForm.reset();
          } else {
            this.spinnerService.hide();
            this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
          }
        }, error => {
        });
      }
    });
  }


  updateAddress(item) {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    this.formFlag = false;
    delete this.addressForm.value.id;
    this.manageUserService.updateAddress(this.uId, this.addressId, this.addressForm.value).subscribe((res: any) => {
      if (res.success) {
        if (this.index >= 0) {
          this.toastr.success("Thank You! Request raised.", "Success!");
        } else {
          this.toastr.success(this.appService.getTranslation('UserAddress.addressUpdatedMessage'), this.appService.getTranslation('Utils.success'));
        }
        this.getUserAddress(this.uId);
        this.addressForm.reset();
        $('#addAddressModal').modal('hide');
      } else {
        this.spinnerService.hide();
        this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
      }
    }, error => {
    });
  }

  numberOnly(event) {
    if ((event.which != 8 && event.which != 0 && (event.which < 48 || event.which > 57)) && !(event.which >= 96 && event.which <= 105)) {
      return false;
    }
    return true;
  }

  getImage(url) {
    // return environment.imageUrl + "" + url
  }

  saveAddress() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    if (this.addressForm.valid) {
      let zipvalidation = this.checkzipcode(this.addressForm.value.pinCode, this.countryName);

      if (!zipvalidation) {
        this.toastr.error("Zip Code is Invalid", 'Error');
        return;
      }
      if (this.userInfo.id != null) {
        if (this.addressForm.value.isDefault == null) {
          this.addressForm.value.isDefault = false;
        }
        if (!this.userAddressInfo.length) {
          this.addressForm.value.isDefault = true;
        }
        this.manageUserService.saveAddress(this.userInfo.id, this.addressForm.value).subscribe((res: any) => {
          if (res.success) {
            if (this.index >= 0) {
              this.toastr.success("Thank You! Request raised.", "Success!");
            } else {
              this.toastr.success(this.appService.getTranslation('UserAddress.addressAddedMessage'), this.appService.getTranslation('Utils.success'));
            }
            this.getUserAddress(this.userId);
            this.addressForm.reset();
            if (this.addAddressParam == 'addAddress') {
              this.router.navigate(['/consumer/cart']);
            }
            $('#addAddressModal').modal('hide');
          } else {
            this.spinnerService.hide();
            this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
          }
        }, error => {
        });
      }
    }
    else {
      this.markAsTouched(this.addressForm);
    }
  }

  openPopup() {
    $("#screen-modal").modal('show');
  }

  closePopup() {
    $("#screen-modal").modal('hide');
  }
  openModal(key: string, item) {
    this.key = key;
    this.item = item;
    const data = {
      country_id: this.countryId
    };
    this.appService.getCountryShowCard(data).subscribe((res: any) => {
      if (res.data) {
        if (res.data.show_card == false) {
          $('#openModal_2').modal('show');
        } else {
          $('#openModal').modal('show');
        }
        this.showCard_display = this.item;
      }
    })
  }

  cancelModal() {
    $('#openModal').modal('hide');
    $('#openModal_2').modal('hide');
    this.showCard_display = !this.showCard_display;
    this.item = !this.item;
  }

  editUserInformation() {
    if (!this.writePermission) {
      this.toastr.error('Sorry! You are not authorised to view this content.', "Error");
      return;
    }
    this.editUserForm = !this.editUserForm;
  }

  changeDate(event) { }

  changeMonth(event) {
  }

  changeYear(event) {
  }

  numberOnly2(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  mobilePost() {

  }
}
