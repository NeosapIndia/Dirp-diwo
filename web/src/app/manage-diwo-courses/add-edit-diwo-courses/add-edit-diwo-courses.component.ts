import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { ManagetDiwoCoursesService } from '../manage-diwo-courses.service';
import { environment } from 'src/environments/environment';
import { Model, SurveyNG } from 'survey-angular';
import * as moment from 'moment';
import { DragulaService } from 'ng2-dragula';
declare var $: any;

@Component({
	selector: 'app-add-edit-diwo-courses',
	templateUrl: './add-edit-diwo-courses.component.html',
	styleUrls: ['./add-edit-diwo-courses.component.css'],
	viewProviders: [DragulaService],
})
export class AddEditDiwoCoursesComponent implements OnInit, OnDestroy {
	courseForm: FormGroup;
	courseModuleForm: FormGroup;
	userClientId: any;
	pageDetails: any;
	projectType = 'drip';
	isViewMode: boolean = false;
	assetBasePath = environment.imageHost + environment.imagePath + 'uploads/diwo_course_thumbnail/';

	finalModulesforCourse: any = [];
	allModuleTypeList: any = [];
	allModuleList: any = [];
	duplicateallModuleList: any = [];

	editModuleIndex: any = null;
	versionOfModule = { selectedModule: null, newModule: null };
	iconObject = {
		add_icon_35: null,
		info_icon_1_6_rem: null,
		drag_drop_indicator: null,
		info_icon_20: null,
		info_icon: null,
	};
	editCourse: any;
	showModuleAddScreen: boolean = false;

	surveyModel: Model;
	surveyObject = {
		elements: [],
	};
	checkSurveyValidation = false;
	viewWorkBookUrl: string;
	MANY_ITEMS = 'MANY_ITEMS';
	addCertificationModule: boolean = false;

	courseCerticationModuleDetails = {
		WorkbookId: null,
		DiwoModuleId: null,
	};
	selectedCerticationModule: any;
	allCertificateModuleList: any = [];
	courseCertificationDetails: any[] = [];
	isEditModule: boolean = false;

	currentEditModuleId = null;

	maxLengthForCourseTitle = 72;
	characterRemainsForCourseTitle = null;

	maxLengthForCourseDescription = 430;
	characterRemainsForCourseDescription = null;

	updateCertificateModule = false;

	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private courseService: ManagetDiwoCoursesService,
		private router: Router,
		private route: ActivatedRoute,
		public dragulaService: DragulaService
	) {
		if (localStorage.getItem('projectName') && localStorage.getItem('projectName') == 'diwo') {
			this.projectType = 'diwo';
		}

		// Initialize Dragula
		this.dragulaService.createGroup('MANY_ITEMS', {
			moves: (el, container, handle) => true, // Allow all elements to be draggable
			accepts: (el, target, source, sibling) => true, // Allow all drops
		});
	}

	ngOnInit() {
		this.userClientId = JSON.parse(localStorage.getItem('client')).id;
		this.pageDetails = JSON.parse(localStorage.getItem('diwoCoursesPageNo')) || null;
		this.createDiwoCourseForm();
		this.createDiwoCourseModuleForm();
		this.editCourse = this.route.params['_value'];
		if (this.editCourse && this.editCourse.courseId) {
			this.getCourseById(parseInt(this.editCourse.courseId));
		} else {
			this.getCustomFieldByClientId();
		}

		this.getModulesList();
		this.getAppBranding();

		this.dragulaService.dropModel('MANY_ITEMS').subscribe(({ sourceIndex, targetIndex, item }) => {
			// console.log('Item moved:', item);
			// console.log('Source Index:', sourceIndex);
			// console.log('Target Index:', targetIndex);
			// Adjust ModuleIndex for each item based on the new order
		});
	}

	ngOnDestroy() {
		this.dragulaService.destroy('MANY_ITEMS');
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createDiwoCourseForm() {
		this.courseForm = this.formBuilder.group({
			id: [null],
			title: [null, Validators.required],
			subtitle: [null],
			description: [null],
			l_outcomes: [null],
			avatar: [null, Validators.required],
			avatar_file_name: [null],
			haveCertification: [false],
			version: [null],
		});
	}
	get f() {
		return this.courseForm.controls;
	}

	createDiwoCourseModuleForm() {
		this.courseModuleForm = this.formBuilder.group({
			id: [null],
			ModuleTypeId: [null, Validators.required],
			ModuleId: [null, Validators.required],
			ModuleName: [null],
			ModuleTypeName: [null],
			ModuleIndex: [this.finalModulesforCourse.length],
			ModuleLastUpdated: [null],
			default: [null],
			BaseWorkbookId: [null],
			version: [null],
		});
	}
	get f2() {
		return this.courseModuleForm.controls;
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

	getCourseById(courseId) {
		this.courseService.getCourseByCourseId(courseId).subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.courseForm.patchValue(res.data.courseData);
					this.getCustomFieldByClientId(res.data.courseData.customFields);
					if (this.editCourse && this.editCourse.type == 'copy') {
						this.courseForm.controls['title'].setValue('Copy of - ' + res.data.courseData.title);
						this.courseForm.controls['id'].setValue(null);
						if (res.data && res.data.courseModuleData && res.data.courseModuleData.length > 0) {
							for (let item of res.data.courseModuleData) {
								let payload = {
									id: null,
									ModuleTypeId: item.DiwoModuleId,
									ModuleId: item.WorkbookId,
									ModuleTypeName: item.ModuleTypeName,
									DiwoModuleId: item.DiwoModuleId,
									ModuleName: item.ModuleName,
									ModuleIndex: item.ModuleIndex,
									ModuleLastUpdated: item.ModuleLastUpdated,
									default: item.Workbook.default,
									BaseWorkbookId: item?.Workbook?.BaseWorkbookId ? item.Workbook.BaseWorkbookId : item.WorkbookId,
									version: item?.Workbook?.version ? item.Workbook.version : 1,
								};
								if (!item.isCertificationModule) {
									this.finalModulesforCourse.push(payload);
								} else {
									this.courseCertificationDetails.push(payload);
									this.courseCerticationModuleDetails.DiwoModuleId = item.DiwoModuleId;
									this.courseCerticationModuleDetails.WorkbookId = item.WorkbookId;
									this.getCertificateModule(item.DiwoModuleId, true);
								}
							}
						}
					} else {
						if (res.data && res.data.courseModuleData && res.data.courseModuleData.length > 0) {
							for (let item of res.data.courseModuleData) {
								let payload = {
									id: item.id,
									ModuleTypeId: item.DiwoModuleId,
									ModuleId: item.WorkbookId,
									ModuleTypeName: item.ModuleTypeName,
									DiwoModuleId: item.DiwoModuleId,
									ModuleName: item.ModuleName,
									ModuleIndex: item.ModuleIndex,
									ModuleLastUpdated: item.ModuleLastUpdated,
									default: item.Workbook.default,
									BaseWorkbookId: item?.Workbook?.BaseWorkbookId ? item.Workbook.BaseWorkbookId : item.WorkbookId,
									version: item?.Workbook?.version ? item.Workbook.version : 1,
								};
								if (!item.isCertificationModule) {
									this.finalModulesforCourse.push(payload);
								} else {
									this.courseCertificationDetails.push(payload);
									this.courseCerticationModuleDetails.DiwoModuleId = item.DiwoModuleId;
									this.courseCerticationModuleDetails.WorkbookId = item.WorkbookId;
									this.getCertificateModule(item.DiwoModuleId, true);
								}
							}
						}
					}

					if (this.editCourse && this.editCourse.type == 'view') {
						this.courseForm.disable();
						this.courseModuleForm.disable();
						this.isViewMode = true;
					}

					this.checkCharacterLimitForCourseTitle();
					this.checkCharacterLimitForCourseDescription();
				}
			}
		});
	}

	getCustomFieldByClientId(customData?) {
		this.courseService.getCustomFieldsByClientId(this.userClientId).subscribe((res: any) => {
			if (res.success) {
				this.setCustiomFieldValidation(res, customData);
			}
		});
	}

	setCustiomFieldValidation(data, customData = {}) {
		if (data.data.length > 0) {
			let customFields = [];

			for (let field of data.data) {
				let fieldObj = {
					name: field.label,
					title: field.label,
					isRequired: field.isRequired,
					requiredErrorText: field.label + ' is required',
				};

				if (customData != null && customData != '' && field.label in customData) {
					fieldObj['defaultValue'] = customData[field.label];
				}

				if (field.isHide) {
					continue;
				}
				if (['Single-line text', 'Multi-line text'].indexOf(field.dataType) > -1) {
					// ------------------------------------------------Custom Type :- SINGLE LINE TEXT------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['inputType'] = 'text';

					if (field.maxCharLimit && field.maxCharLimit != '' && field.maxCharLimit != null) {
						fieldObj['maxLength'] = parseInt(field.maxCharLimit);
					}

					fieldObj['validators'] = [];

					if (field.minCharLimit && field.minCharLimit != '' && field.minCharLimit != null) {
						fieldObj['validators'].push({
							type: 'text',
							minLength: parseInt(field.minCharLimit),
						});
						// fieldObj['minLength'] = parseInt(field.minCharLimit);
					}

					if (field.restrictNumber && field.restrictSpecialChar) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^0-9!@#$%^&*(),.?":{}|<>]*$',
						});
					} else if (field.restrictNumber) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^0-9]*$',
						});
					} else if (field.restrictSpecialChar) {
						fieldObj['validators'].push({
							type: 'regex',
							text: 'Please enter only letters',
							regex: '^[^!@#$%^&*(),.?":{}|<>]*$',
						});
					}

					if (field.dataType === 'Multi-line text') {
						// fieldObj['inputType'] = 'textarea';
						delete fieldObj['inputType'];
						fieldObj['type'] = 'comment';
						fieldObj['rows'] = 2;
						fieldObj['autoGrow'] = true;
						fieldObj['allowResize'] = false;
					}
				} else if (['Number', 'Percentage'].indexOf(field.dataType) > -1) {
					// ------------------------------------------------Custom Type :- NUMBER------------------------------------------------

					fieldObj['type'] = 'text';

					fieldObj['validators'] = [
						{
							type: 'numeric',
							minValue: field.setMinValue ? parseInt(field.setMinValue) : 0,
							maxValue: field.setMaxValue ? parseInt(field.setMaxValue) : 100,
						},
					];

					//Add Validation Decimal
					if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
						fieldObj['maskType'] = 'numeric';
						fieldObj['maskSettings'] = {
							precision: parseInt(field.decimalLimit),
						};
					}
				} else if (field.dataType === 'Percentage') {
					// ------------------------------------------------Custom Type :- PERCENTAGE------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['inputType'] = 'percentage';
					if (field.decimalLimit && field.decimalLimit != '' && field.decimalLimit != null) {
						fieldObj['maskType'] = 'numeric';
						fieldObj['maskSettings'] = {
							precision: parseInt(field.decimalLimit),
						};
					}
				} else if (field.dataType === 'Currency') {
					// ------------------------------------------------Custom Type :- CURRENCY------------------------------------------------

					fieldObj['type'] = 'text';
					fieldObj['maskType'] = 'currency';
					fieldObj['maskSettings'] = {
						prefix: field.currencySymbol ? field.currencySymbol : '$',
					};
				} else if (field.dataType === 'Date picker') {
					// ------------------------------------------------Custom Type :- DATE PICKER------------------------------------------------

					if (field.datePickerValidationType == 'Any Date') {
						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
					} else if (field.datePickerValidationType == 'Future Date Only') {
						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';

						let today = moment();
						let maxDate = moment('9999-12-31');
						let maxDateCount = maxDate.diff(today, 'days');

						if (field.futureDateValidationType == 'Any future date') {
							fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
							fieldObj['minValueExpression'] = 'today(1)';
						} else if (field.futureDateValidationType == 'Any date after buffer time') {
							let minValuedate = moment().add(parseInt(field.dayCount), 'days');
							let minValueCount = minValuedate.diff(moment(), 'days');

							fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
							fieldObj['minValueExpression'] = `today(${minValueCount})`;
						} else if (field.futureDateValidationType == 'Any date in a rolling date range') {
							let maxValuedate = moment().add(parseInt(field.dayCount), 'days');
							let maxValueCount = maxValuedate.diff(moment(), 'days');

							fieldObj['maxValueExpression'] = `today(${maxValueCount})`;
							fieldObj['minValueExpression'] = `today(1)`;
						}
					} else if (field.datePickerValidationType == 'Past Date Only') {
						let today = moment();
						let minDate = moment('1800-01-1');
						let minDateCount = minDate.diff(today, 'days');

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
						fieldObj['minValueExpression'] = `today(${minDateCount})`;
						fieldObj['maxValueExpression'] = 'today()';
					} else if (field.datePickerValidationType == 'Specific Date Range') {
						let date = moment();
						let minDate = moment(field.startDate);
						let maxDate = moment(field.endDate);

						let minDateCount = minDate.diff(date, 'days');
						let maxDateCount = maxDate.diff(date, 'days');

						fieldObj['type'] = 'text';
						fieldObj['inputType'] = 'date';
						fieldObj['minValueExpression'] = `today(${minDateCount})`;
						fieldObj['maxValueExpression'] = `today(${maxDateCount})`;
					}
				} else if (field.dataType === 'Radio select') {
					// ------------------------------------------------Custom Type :- RADIO SELECT------------------------------------------------

					fieldObj['type'] = 'radiogroup';
					fieldObj['showNoneItem'] = false;
					fieldObj['showOtherItem'] = false;
					fieldObj['colCount'] = 1;
					fieldObj['choices'] = [];
					for (let option of field.options) {
						fieldObj['choices'].push(option.label);
					}
				} else if (field.dataType === 'Dropdown select') {
					fieldObj['type'] = 'dropdown';
					fieldObj['showNoneItem'] = false;
					fieldObj['showOtherItem'] = false;

					fieldObj['choices'] = [];
					for (let option of field.options) {
						if (!option.isHide) {
							fieldObj['choices'].push(option.label);
						}
					}
				}

				customFields.push(fieldObj);
			}
			// console.log('customData', customFields);

			this.surveyObject = {
				elements: customFields,
			};
			this.showCustomFields();
		} else {
			this.surveyObject = {
				elements: [],
			};
			this.showCustomFields();
		}
	}

	showCustomFields() {
		this.surveyModel = new Model(this.surveyObject);
		this.surveyModel.onProgressText.add(this.entryCustomField.bind(this));
		this.surveyModel.questionErrorLocation = 'bottom';
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}

	clearSurveyForm() {
		this.surveyObject = {
			elements: [],
		};
		this.surveyModel = new Model(this.surveyObject);
		SurveyNG.render('surveyForm', { model: this.surveyModel });
	}
	entryCustomField(survey = null, options = null) {
		if (this.checkSurveyValidation) {
			this.surveyModel.validatePage();
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/diwo-courses']);
			}, 100);
		} else {
			this.router.navigate(['/diwo-courses']);
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('diwoCoursesPageNo', JSON.stringify(payload));
	}

	uploadImage(event) {
		this.spinnerService.show();
		this.getImgResolution(event, 'check for horizontal').then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					this.courseForm.controls['avatar'].patchValue(event.target.files[0].name);
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.courseService.uploadAvatar(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							this.courseForm.controls['avatar_file_name'].patchValue(res.data.image[0].filename);
						}
					});
				}
			} else {
				this.spinnerService.hide();
				this.toastr.warning(
					this.appService.getTranslation('Pages.DiwoCourses.AddEdit.Toaster.uploadthumbnail16:9'),
					this.appService.getTranslation('Utils.warning')
				);
			}
		});
	}

	onDeleteThumnail() {
		if (!this.isViewMode) {
			$('#mediaWeb').val('');
			this.courseForm.patchValue({ avatar: null });
		}
	}

	showModeleSelectionScreen() {
		if (!this.isViewMode) {
			this.showModuleAddScreen = true;
			this.addCertificationModule = false;
		}
	}

	getModulesList() {
		this.courseService.getAllModulesTypes().subscribe((res: any) => {
			if (res.success) {
				this.allModuleTypeList = [];
				// this.allModuleTypeList = res.data;
				for (let item of res.data) {
					if (item.id != 3) {
						this.allModuleTypeList.push(item);
					}
				}
			}
		});
	}

	getModuleListByModuleType(event: any) {
		// console.log('-event-', event);
		this.courseModuleForm.controls['ModuleTypeName'].setValue(event.type);
		this.courseModuleForm.controls['ModuleId'].setValue(null);
		this.getModule(event.id);
	}

	onPickModule(event: any) {
		console.log('-moduleevent-', event);
		//check BaseWorkbookId of the Selected Workbook
		for (let module of this.finalModulesforCourse) {
			if (module.BaseWorkbookId == event.BaseWorkbookId) {
				this.versionOfModule.newModule = event;
				this.versionOfModule.selectedModule = module;
				console.log('--------this.versionOfModule------', this.versionOfModule);
				$('#updateModuleVersion').modal('show');
				return;
			}
		}
		//Show Pop For select new Verion of Module
		this.courseModuleForm.controls['ModuleName'].setValue(event.title);
		this.courseModuleForm.controls['ModuleLastUpdated'].setValue(event.updatedAt);
		this.courseModuleForm.controls['BaseWorkbookId'].setValue(event.BaseWorkbookId);
		this.courseModuleForm.controls['version'].setValue(event.version);
	}

	getModule(ModuleTypeId, flag = false, module = null) {
		this.courseService.getAllModulesByModuleType(this.userClientId, ModuleTypeId).subscribe((res: any) => {
			if (res.success) {
				this.allModuleList = [];
				// this.allModuleList = res.data;

				for (let item of res.data) {
					if (item.id != 3) {
						this.allModuleList.push(item);
					}
				}

				if (this.isEditModule) {
					if (this.finalModulesforCourse.length > 0) {
						for (let item of this.finalModulesforCourse) {
							for (let i = this.allModuleList.length - 1; i >= 0; i--) {
								if (item.ModuleId === this.allModuleList[i].id && item.ModuleId != this.currentEditModuleId) {
									this.allModuleList.splice(i, 1);
								}
							}
						}
					}
				} else {
					if (this.finalModulesforCourse.length > 0) {
						for (let item of this.finalModulesforCourse) {
							for (let i = this.allModuleList.length - 1; i >= 0; i--) {
								if (item.ModuleId === this.allModuleList[i].id) {
									this.allModuleList.splice(i, 1);
								}
							}
						}
					}
				}
				console.log('-----2--------', this.allModuleList);
				if (flag) {
					this.updateModule(module, true);
				}
				return;
			}
		});
	}

	addModulesToCourse() {
		if (this.courseModuleForm.invalid) {
			this.markAsTouched(this.courseModuleForm);
			return;
		}

		if (this.editModuleIndex !== null) {
			this.finalModulesforCourse[this.editModuleIndex] = this.courseModuleForm.value;
			this.courseModuleForm.reset();
			this.createDiwoCourseModuleForm();
			this.editModuleIndex = null;
			// console.log('--this.finalModulesforCourse--REPLACE--', this.finalModulesforCourse);
		} else {
			// let payload = this.courseModuleForm.value;
			// this.finalModulesforCourse.push(payload);
			// this.createDiwoCourseModuleForm();
			// console.log('--this.finalModulesforCourse--', this.finalModulesforCourse);
			let payload = this.courseModuleForm.value;
			payload.ModuleIndex = this.finalModulesforCourse.length;
			// this.createDiwoCourseModuleForm();
			this.finalModulesforCourse.push(payload);
			this.courseModuleForm.reset();
			// console.log('--this.finalModulesforCourse--', this.finalModulesforCourse);
		}
		this.showModuleAddScreen = false;
		this.isEditModule = false;
	}

	cancelModulesToCourse() {
		this.showModuleAddScreen = false;
		this.courseModuleForm.reset();
		this.editModuleIndex = null;
		this.isEditModule = false;
	}

	removeCoureModule(i, ModuleIndex) {
		this.finalModulesforCourse.splice(i, 1);
		for (let i = 0; i < this.finalModulesforCourse.length; i++) {
			if (this.finalModulesforCourse[i].ModuleIndex > ModuleIndex) {
				this.finalModulesforCourse[i].ModuleIndex = this.finalModulesforCourse[i].ModuleIndex - 1;
			}
		}
	}

	replaceCoureModule(i) {
		this.showModuleAddScreen = true;
		this.addCertificationModule = false;
		let data = this.finalModulesforCourse[i];
		this.currentEditModuleId = data.ModuleId;
		this.editModuleIndex = i;
		this.courseModuleForm.patchValue(data);
		this.getModule(data.ModuleTypeId);
		this.isEditModule = true;
	}

	previewModule(item: any) {
		this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${item.ModuleId}`;
	}

	checkCharacterLimitForCourseTitle() {
		let title = this.courseForm.controls['title'].value;
		this.characterRemainsForCourseTitle = title
			? this.maxLengthForCourseTitle - title.length
			: this.maxLengthForCourseTitle;
	}

	checkCharacterLimitForCourseDescription() {
		let descrip = this.courseForm.controls['description'].value;
		this.characterRemainsForCourseDescription = descrip
			? this.maxLengthForCourseDescription - descrip.length
			: this.maxLengthForCourseDescription;
	}

	saveCourse(Published) {
		this.finalModulesforCourse.forEach((module, index) => {
			module.ModuleIndex = index;
		});

		let payload = {
			courseData: this.courseForm.value,
			courseModuleData: this.finalModulesforCourse,
			courseCertificationDetails: this.courseCertificationDetails,
		};

		if (Published) {
			payload.courseData.status = 'Published';
		} else {
			payload.courseData.status = 'Draft';
		}

		payload.courseData['customFields'] = this.surveyModel.data;

		this.checkSurveyValidation = true;

		if (this.courseForm.invalid || !this.surveyModel.validatePage()) {
			this.markAsTouched(this.courseForm);
			return;
		}

		if (this.showModuleAddScreen && this.courseModuleForm.invalid) {
			this.markAsTouched(this.courseModuleForm);
			return;
		}

		if (this.finalModulesforCourse.length == 0) {
			this.showModuleAddScreen = true;
			this.addCertificationModule = false;
			this.markAsTouched(this.courseModuleForm);
			return;
		}

		this.checkSurveyValidation = false;

		this.spinnerService.show();
		if (this.courseForm.value.id == null) {
			this.courseService.createDiwoCourse(payload).subscribe((res: any) => {
				if (res.success) {
					if (Published) {
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoCourses.AddEdit.Toaster.coursecreated'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoCourses.AddEdit.Toaster.coursedraft'),
							this.appService.getTranslation('Utils.success')
						);
					}

					this.spinnerService.hide();

					this.appService.checkNotifcation = true;
					this.router.navigate(['/diwo-courses']);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, 'Error');
				}
			});
		} else {
			this.savePagination();
			this.courseService.updateDiwoCourse(payload).subscribe((res: any) => {
				if (res.success) {
					if (Published) {
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoCourses.AddEdit.Toaster.coursecreated'),
							this.appService.getTranslation('Utils.success')
						);
					} else {
						this.toastr.success(
							this.appService.getTranslation('Pages.DiwoCourses.AddEdit.Toaster.coursedraft'),
							this.appService.getTranslation('Utils.success')
						);
					}

					this.spinnerService.hide();
					this.appService.checkNotifcation = true;
					setTimeout(() => {
						this.router.navigate(['/diwo-courses']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
				this.spinnerService.hide();
			});
		}
	}

	getImgResolution(evt: any, checkCondition) {
		let p = new Promise(function (resolve, reject) {
			let image: any = evt.target.files[0];
			let fr = new FileReader();
			fr.onload = () => {
				var img = new Image();
				img.onload = () => {
					let imgMode = false;

					//a perfect vertical / horizontal img will have 1.77 as ans
					if (checkCondition == 'check for vertical') {
						if (img.height / img.width > 1.33 && img.height / img.width < 1.34) {
							imgMode = true;
						}
					}

					if (checkCondition == 'check for horizontal') {
						if (img.width / img.height > 1.7 && img.width / img.height < 1.8) {
							imgMode = true;
						}
					}
					resolve(imgMode);
				};
				img.src = fr.result + '';
			};
			fr.readAsDataURL(image);
		});
		return p;
	}

	//  Certification Code////////////////////////////////

	addCertification() {
		//Show Popup With Module Type and List
		this.addCertificationModule = true;
		this.showModuleAddScreen = false;
	}

	getCertificateModuleListByModuleType(event) {
		this.getCertificateModule(event.id);
	}

	getCertificateModule(ModuleTypeId, isEdit = false, module = null) {
		this.courseService.getAllCertificateModulesByModuleType(this.userClientId, ModuleTypeId).subscribe((res: any) => {
			if (res.success) {
				this.allCertificateModuleList = [];
				this.allCertificateModuleList = res.data;
				if (isEdit) {
					for (let item of res.data) {
						if (item.id === this.courseCerticationModuleDetails.WorkbookId) {
							this.selectedCerticationModule = item;
							// console.log('------1111---', this.selectedCerticationModule);
							break;
						}
					}
				}
				this.updateModule(module, true, 'Certificate Module');
			}
		});
	}

	onPickCertificateModule(event) {
		this.selectedCerticationModule = event;
		// console.log('-----Event----', event);
	}

	addCertificationModulesToCourse() {
		if (!this.courseCerticationModuleDetails.DiwoModuleId || !this.courseCerticationModuleDetails.WorkbookId) {
			//Add tosterMessage
			return;
		}

		let payload = this.selectedCerticationModule;
		payload.WorkbookId = payload.id;
		payload.ModuleId = payload.id;
		payload.ModuleIndex = null;
		payload.ModuleName = payload.title;

		let temp = this.allModuleTypeList.filter((item: any) => {
			return item.id == this.courseCerticationModuleDetails.DiwoModuleId;
		});
		payload.ModuleTypeName = temp[0].type;
		payload.DiwoModuleId = this.courseCerticationModuleDetails.DiwoModuleId;
		payload.isOpen = false;
		payload.ModulePublishDate = payload.createdAt;
		payload.isCertificationModule = true;
		payload.ModuleLastUpdated = payload.updatedAt;
		payload.BaseWorkbookId = payload.BaseWorkbookId;
		payload.version = payload.version;
		payload.id = null;
		delete payload.title;
		delete payload.descrip;

		this.courseCertificationDetails = [payload];

		// console.log('--Payload--', this.courseCertificationDetails);
		this.courseForm.controls['haveCertification'].setValue(true);
		this.addCertificationModule = false;
	}

	cancelCertificateModulesToCourse() {
		this.addCertificationModule = false;
		if (!this.courseCerticationModuleDetails.WorkbookId) {
			this.courseForm.controls['haveCertification'].setValue(false);
		}
	}

	replaceCoureCertificateModule(data) {
		this.addCertificationModule = true;
		this.showModuleAddScreen = false;
		this.getCertificateModule(data.DiwoModuleId, true);
	}

	removeCoureCertificationModule(index, ModuleIndex) {
		this.courseCertificationDetails = [];
		this.courseForm.controls['haveCertification'].setValue(false);
		this.addCertificationModule = false;
		this.courseCerticationModuleDetails.DiwoModuleId = null;
		this.courseCerticationModuleDetails.DiwoModuleId = null;
	}

	cancelModuleVersionPopUp() {
		$('#updateModuleVersion').modal('hide');
		$('#update_Module_Version').modal('hide');
		this.versionOfModule.newModule = null;
		this.versionOfModule.selectedModule = null;
		this.updateCertificateModule = false;
		this.courseModuleForm.controls['ModuleId'].setValue(null);
	}

	updateToNewVersionOfModule() {
		if (this.updateCertificateModule == false) {
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].ModuleId =
				this.versionOfModule.newModule.id;
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].ModuleName =
				this.versionOfModule.newModule.title;
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].ModuleLastUpdated =
				this.versionOfModule.newModule.updatedAt;
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].default =
				this.versionOfModule.newModule.default;
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].BaseWorkbookId =
				this.versionOfModule.newModule.BaseWorkbookId;
			this.finalModulesforCourse[this.versionOfModule.selectedModule.ModuleIndex].version =
				this.versionOfModule.newModule.version;
			this.showModuleAddScreen = false;
		} else {
			this.updateCertificateModule = false;
			this.showModuleAddScreen = false;
			this.selectedCerticationModule = this.versionOfModule.newModule;
			this.addCertificationModulesToCourse();
		}
		this.cancelModuleVersionPopUp();
	}

	updateModule(event, flag = false, type = 'Normal Module') {
		if (type == 'Normal Module') {
			if (flag == false) {
				this.isEditModule = true;
				this.getModule(event.ModuleTypeId, true, event);
				return;
			}
			this.isEditModule = false;
			for (let module of this.allModuleList) {
				if (module.BaseWorkbookId == event.BaseWorkbookId) {
					this.versionOfModule.newModule = module;
					this.versionOfModule.selectedModule = event;
					$('#update_Module_Version').modal('show');
					return;
				}
			}
		} else if (type == 'Certificate Module') {
			if (flag == false) {
				this.getCertificateModule(event.ModuleTypeId, false, event);
				return;
			}

			for (let module of this.allCertificateModuleList) {
				if (event?.BaseWorkbookId == module?.BaseWorkbookId) {
					this.versionOfModule.newModule = module;
					this.versionOfModule.selectedModule = event;
					this.updateCertificateModule = true;
					$('#update_Module_Version').modal('show');
					return;
				}
			}
		}
	}
}
