import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { ManagetDiwoPathwaysService } from '../manage-diwo-pathways.service';
import { environment } from 'src/environments/environment';
import { Model, SurveyNG } from 'survey-angular';
import * as moment from 'moment';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';

declare var $: any;

@Component({
	selector: 'app-add-edit-diwo-pathways',
	templateUrl: './add-edit-diwo-pathways.component.html',
	styleUrls: ['./add-edit-diwo-pathways.component.css'],
	viewProviders: [DragulaService],
})
export class AddEditDiwoPathwaysComponent implements OnInit, OnDestroy {
	pathwayForm: FormGroup;
	pathwayCourseForm: FormGroup;
	userClientId: any;
	pageDetails: any;
	projectType = 'drip';
	isViewMode: boolean = false;
	assetBasePathPathway = environment.imageHost + environment.imagePath + 'uploads/diwo_pathway_thumbnail/';
	assetBasePath = environment.imageHost + environment.imagePath;

	finalCoursesforPathways: any = [];
	courseModuleArrayForTable: any = [];

	duplicateallCourseList: any = [];

	allCourseList: any = [];

	allDepedencyModuleList: any = [];

	editCourseIndex: any = null;

	iconObject = {
		add_icon_35: null,
		info_icon_20: null,
		expand_more_icon: null,
		right_arrow_new: null,
		drag_drop_indicator: null,
	};

	editPathway: any;
	showCourseAddScreen: boolean = false;

	surveyModel: Model;
	surveyObject = {
		elements: [],
	};
	checkSurveyValidation = false;

	operatorList = [
		{ label: 'Learner to complete all selected modules', value: 'AND' },
		{
			label: 'Learner to complete any of the selected modules',
			value: 'OR',
		},
	];

	// operatorList = [
	// 	{ label: 'Learner to complete all selected modules', value: 'AND' },
	// 	{ label: 'Learner to complete any of the selected modules', value: 'OR' },
	// 	{ label: 'Learner to certified all selected modules', value: 'CertifiedAND', disabled: true },
	// 	{ label: 'Learner to certified any of the selected modules', value: 'CertifiedOR', disabled: true },
	// ];

	// operatorCompletedList = [
	// 	{ label: 'Learner to completed selected modules', value: 'Completed' },
	// 	{ label: 'Learner to certified selected modules', value: 'Certified', disabled: true },
	// ];

	// operatorCertifiedList = [
	// 	{ label: 'Learner to completed selected modules', value: 'Completed' },
	// 	{ label: 'Learner to certified selected modules', value: 'Certified' },
	// ];

	// operatorAllList = [
	// 	{ label: 'Learner to complete all selected modules', value: 'AND' },
	// 	{ label: 'Learner to complete any of the selected modules', value: 'OR' },
	// 	{ label: 'Learner to certified all selected modules', value: 'CertifiedAND' },
	// 	{ label: 'Learner to certified any of the selected modules', value: 'CertifiedOR' },
	// ];

	viewWorkBookUrl: string;
	coursesforPathways = [];
	MANY_ITEMS = 'MANY_ITEMS';
	subs = new Subscription();
	isopen: boolean = false;
	selectedCourseIndexforEdit: any;
	isEditCourse: boolean = false;
	allModuleTypeList = [];
	allModuleList = [];
	addCertificationModule: boolean = false;

	pathwayCerticationModuleDetails = {
		WorkbookId: null,
		DiwoModuleId: null,
	};
	selectedCerticationModule: any;
	pathwayCertificationDetails: any = [];
	nextCourseIndexCount = 0;

	maxLengthForPathwayTitle = 72;
	characterRemainsForPathwayTitle = null;

	maxLengthForPathwayDescription = 430;
	characterRemainsForPathwayDescription = null;
	updateCourseData;
	updateCourseIndex;
	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private pathwayService: ManagetDiwoPathwaysService,
		private router: Router,
		private route: ActivatedRoute,
		public dragulaService: DragulaService,
		private cdr: ChangeDetectorRef
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
		this.pageDetails = JSON.parse(localStorage.getItem('diwoPathwayPageNo')) || null;
		this.createDiwoPathwaysForm();
		this.createDiwoPathwayCourseForm();
		this.editPathway = this.route.params['_value'];
		if (this.editPathway && this.editPathway.pathwayId) {
			this.getPathwayById(parseInt(this.editPathway.pathwayId));
		} else {
			this.getCustomFieldByClientId();
		}
		this.getCourseListByClientIdForPathway();
		this.getAppBranding();
		this.getModulesList();

		this.dragulaService
			.dropModel(this.MANY_ITEMS)
			.subscribe(({ name, el, target, source, sibling, item, sourceModel, targetModel, sourceIndex, targetIndex }) => {
				// console.log('Item moved:', item);
				// console.log('Source Index:', sourceIndex);
				// console.log('Target Index:', targetIndex);
				// console.log('coursesforPathways---', this.coursesforPathways);
				// console.log('coursesforPathways---sourceIndex:', this.coursesforPathways[sourceIndex]);
				// console.log('coursesforPathways---targetIndex:', this.coursesforPathways[targetIndex]);

				this.isopen = false;
				let courseCount = 0;
				let openCourseIndex = 0;
				let openModelCount = 1;

				for (let item of this.coursesforPathways) {
					if (item.isOpen) {
						if (!this.isopen) {
							openCourseIndex = item.CourseIndex;
						} else {
							openModelCount++;
						}
						this.isopen = true;
					}

					if (courseCount < item.CourseIndex) {
						courseCount = item.CourseIndex;
					}
				}

				// console.log('-openModelCount-', openModelCount);
				// console.log('-openCourseIndex-', openCourseIndex);

				if (
					this.isopen &&
					targetIndex < openCourseIndex &&
					openCourseIndex < sourceIndex &&
					targetIndex < sourceIndex
				) {
					sourceIndex = sourceIndex - openModelCount;
					// console.log('---1----:');
				}

				if (
					this.isopen &&
					targetIndex > openCourseIndex &&
					openCourseIndex > sourceIndex &&
					targetIndex > sourceIndex
				) {
					targetIndex = targetIndex - openModelCount;
					// console.log('---2----:');
				}

				if (this.isopen && targetIndex > openCourseIndex && openCourseIndex < sourceIndex) {
					sourceIndex = sourceIndex - openModelCount;
					targetIndex = targetIndex - openModelCount;
					// console.log('---3----:');
				}

				// console.log('Source Index---1:', sourceIndex);
				// console.log('Target Index---1:', targetIndex);

				// if (this.isopen && sourceIndex > openCourseIndex && sourceIndex >= openModelCount) {
				// 	sourceIndex = sourceIndex - openModelCount;
				// }

				for (let item of this.coursesforPathways) {
					if (item.CourseIndex == sourceIndex) {
						item.CourseIndex = targetIndex;
					} else if (item.CourseIndex == targetIndex) {
						item.CourseIndex = sourceIndex;
					}
				}

				// if ((isopen && openCourseIndex > targetIndex) || !isopen) {
				// 	if (sourceIndex > openCourseIndex) {
				// 		sourceIndex = sourceIndex - openCourseIndex;
				// 	}
				// 	for (let item of this.coursesforPathways) {
				// 		if (item.CourseIndex == sourceIndex) {
				// 			item.CourseIndex = targetIndex;
				// 		} else if (item.CourseIndex == targetIndex) {
				// 			item.CourseIndex = sourceIndex;
				// 		}
				// 	}
				// } else {
				// 	targetIndex = targetIndex - openModelCount;
				// 	for (let item of this.coursesforPathways) {
				// 		if (item.CourseIndex == sourceIndex) {
				// 			item.CourseIndex = targetIndex;
				// 		} else if (item.CourseIndex == targetIndex) {
				// 			item.CourseIndex = sourceIndex;
				// 		}
				// 	}
				// }

				let tempArray = [];
				tempArray = this.coursesforPathways.sort((a, b) => a.CourseIndex - b.CourseIndex);

				let index = 0;
				let ModuleIndexArray = [];
				for (let temp of tempArray) {
					ModuleIndexArray.push({ oldModuleIndex: temp.ModuleIndex, newModuleIndex: index });
					temp.ModuleIndex = index;
					index++;
				}

				index = 0;

				for (let temp of tempArray) {
					if (temp.ModuleDepedencyIndex.length > 0 && temp.ModuleDepedencyIndex.indexOf('No Dependency') == -1) {
						let removeIndexArray = [];
						for (let moduleIndex of temp.ModuleDepedencyIndex) {
							for (let index of ModuleIndexArray) {
								if (moduleIndex == index.oldModuleIndex) {
									moduleIndex = index.newModuleIndex;
									break;
								}
							}

							if (index == 0) {
								temp.ModuleDepedencyIndex = ['No Dependency'];
							}

							if (moduleIndex >= index) {
								removeIndexArray.push(moduleIndex);
							}
						}

						if (removeIndexArray.length > 0) {
							for (let removeIndex of removeIndexArray) {
								temp.ModuleDepedencyIndex.splice(temp.ModuleDepedencyIndex.indexOf(removeIndex), 1);
							}
						}

						// if (temp.ModuleDepedencyIndex.length == 0) {
						temp.ModuleDepedencyIndex = ['No Dependency'];
						// }
					}
					index++;
				}

				this.coursesforPathways = [];
				this.finalCoursesforPathways = [];
				setTimeout(() => {
					this.finalCoursesforPathways = [...tempArray];
					this.coursesforPathways = [...tempArray];
					// console.log('coursesforPathways---2---', this.coursesforPathways);
					this.dependecyFunction();
				}, 10);
			});
	}

	ngOnDestroy() {
		this.dragulaService.destroy('MANY_ITEMS');
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	createDiwoPathwaysForm() {
		this.pathwayForm = this.formBuilder.group({
			id: [null],
			title: [null, Validators.required],
			subtitle: [null],
			description: [null],
			l_outcomes: [null],
			avatar: [null, Validators.required],
			avatar_file_name: [null],
			haveCertification: [false],
		});
	}
	get f() {
		return this.pathwayForm.controls;
	}

	createDiwoPathwayCourseForm() {
		this.pathwayCourseForm = this.formBuilder.group({
			id: [null],
			courseName: [null, Validators.required],
		});
	}
	get f2() {
		return this.pathwayCourseForm.controls;
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

	getPathwayById(pathwayId) {
		this.pathwayService.getPathwayByPathwayId(pathwayId).subscribe(async (res: any) => {
			if (res.success) {
				if (res.data) {
					this.pathwayForm.patchValue(res.data.pathwayData);
					this.getCustomFieldByClientId(res.data.pathwayData.customFields);
					if (this.editPathway && this.editPathway.type == 'copy') {
						this.pathwayForm.controls['title'].setValue('Copy of - ' + res.data.pathwayData.title);
						this.pathwayForm.controls['id'].setValue(null);
						if (res.data && res.data.pathwayCourseModuleData && res.data.pathwayCourseModuleData.length > 0) {
							for (let item of res.data.pathwayCourseModuleData) {
								let payload = {
									id: null,
									CourseId: item.CourseId,
									CourseIndex: item.CourseIndex,
									CourseName: item.CourseName,
									isPartCourse: item.isPartCourse,
									WorkbookId: item.WorkbookId,
									ModuleIndex: item.ModuleIndex,
									ModuleName: item.ModuleName,
									ModuleTypeName: item.ModuleTypeName,
									DiwoModuleId: item.DiwoModuleId,
									ModuleDepedencyIndex: item.ModuleDepedencyIndex
										? item.ModuleDepedencyIndex === 'No Dependency'
											? item.ModuleDepedencyIndex.split(',')
											: item.ModuleDepedencyIndex.split(',').map(Number)
										: [],
									Dependency: item.Dependency,
									ModuleOperation: item.ModuleOperation,
									Added: true,
									isOpen: false,
									isDepedencyError: false,
									isDepedencyOperationError: false,
									ModuleAsset: item.Workbook?.DiwoAssets[0]?.path,
									ModulePublishDate: item.Workbook?.createdAt,
									haveCertificate: item.Workbook?.haveCertificate ? item.Workbook?.haveCertificate : false,
									isShowCertifiedDropDown: item.isShowCertifiedDropDown,
									isCertificationModule: item?.isCertificationModule ? item?.isCertificationModule : false,
									CourseVersion: item.CourseVersion,
								};

								if (item.isCertificationModule) {
									this.pathwayCertificationDetails.push(payload);
									this.pathwayCerticationModuleDetails.DiwoModuleId = item.DiwoModuleId;
									this.pathwayCerticationModuleDetails.WorkbookId = item.WorkbookId;
									this.getModule(item.DiwoModuleId, true);
								} else {
									this.finalCoursesforPathways.push(payload);
								}
							}
						}
					} else {
						if (res.data && res.data.pathwayCourseModuleData && res.data.pathwayCourseModuleData.length > 0) {
							for (let item of res.data.pathwayCourseModuleData) {
								let payload = {
									id: item.id,
									CourseId: item.CourseId,
									CourseIndex: item.CourseIndex,
									CourseName: item.CourseName,
									isPartCourse: item.isPartCourse,
									WorkbookId: item.WorkbookId,
									ModuleIndex: item.ModuleIndex,
									ModuleName: item.ModuleName,
									ModuleTypeName: item.ModuleTypeName,
									DiwoModuleId: item.DiwoModuleId,
									ModuleDepedencyIndex: item.ModuleDepedencyIndex
										? item.ModuleDepedencyIndex === 'No Dependency'
											? item.ModuleDepedencyIndex.split(',')
											: item.ModuleDepedencyIndex.split(',').map(Number)
										: [],
									Dependency: item.Dependency,
									ModuleOperation: item.ModuleOperation,
									Added: true,
									isOpen: false,
									isDepedencyError: false,
									isDepedencyOperationError: false,
									ModuleAsset: item.Workbook?.DiwoAssets[0]?.path,
									ModulePublishDate: item.Workbook?.createdAt,
									haveCertificate: item.Workbook?.haveCertificate ? item.Workbook?.haveCertificate : false,
									isShowCertifiedDropDown: item.isShowCertifiedDropDown,
									isCertificationModule: item?.isCertificationModule ? item?.isCertificationModule : false,
									CourseVersion: item.CourseVersion,
								};
								if (item.isCertificationModule) {
									this.pathwayCertificationDetails.push(payload);
									this.pathwayCerticationModuleDetails.DiwoModuleId = item.DiwoModuleId;
									this.pathwayCerticationModuleDetails.WorkbookId = item.WorkbookId;
									this.getModule(item.DiwoModuleId, true);
								} else {
									this.finalCoursesforPathways.push(payload);
								}
							}
						}
					}

					if (this.editPathway && this.editPathway.type == 'view') {
						this.pathwayForm.disable();
						this.pathwayCourseForm.disable();
						this.isViewMode = true;
					}
					await this.addCourrentCourseVersion();
					this.checkCharacterLimitForPathwayTitle();
					this.checkCharacterLimitForPathwayDescription();

					// console.log('-this.finalCoursesforPathways-', this.finalCoursesforPathways);
					this.dependecyFunction();
					await this.checkSelectedDependecyType();
					this.copyDupliateArrayObject();

					//add Current Course Version in the coursesforPathways
				}
			}
		});
	}

	addCourrentCourseVersion() {
		if (this.coursesforPathways.length > 0 && this.allCourseList.length > 0) {
			for (let item of this.coursesforPathways) {
				for (let course of this.allCourseList) {
					if (item.CourseId == course.id) {
						item.CurrentCourseVersion = course.version;
					}
				}
			}
		}

		if (this.finalCoursesforPathways.length > 0 && this.allCourseList.length > 0) {
			for (let item of this.finalCoursesforPathways) {
				for (let course of this.allCourseList) {
					if (item.CourseId == course.id) {
						item.CurrentCourseVersion = course.version;
					}
				}
			}
		}

		console.log('this.coursesforPathways---', this.coursesforPathways);
		return;
	}

	getCustomFieldByClientId(customData?) {
		this.pathwayService.getCustomFieldsByClientId(this.userClientId).subscribe((res: any) => {
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

	uploadImage(event) {
		this.spinnerService.show();
		this.getImgResolution(event, 'check for horizontal').then((res) => {
			if (res == true) {
				if (event.target.files[0].type.includes('image')) {
					this.pathwayForm.controls['avatar'].patchValue(event.target.files[0].name);
					let assetUpload = event.target.files[0];
					const uploadData = new FormData();
					uploadData.append('image', assetUpload);
					this.pathwayService.uploadPathwayThumbnail(uploadData).subscribe((res: any) => {
						this.spinnerService.hide();
						if (res.success) {
							this.pathwayForm.controls['avatar_file_name'].patchValue(res.data.image[0].filename);
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
			this.pathwayForm.patchValue({ avatar: null });
		}
	}

	//add a course
	showCourseSelectionScreen() {
		if (!this.isViewMode) {
			this.editCourseIndex = null;
			this.showCourseAddScreen = true;
			this.nextCourseIndexCount = this.getNextCourseIndex();

			this.allCourseList = [];
			for (let item of this.duplicateallCourseList) {
				this.allCourseList.push(Object.assign({}, item));
			}

			if (this.finalCoursesforPathways.length > 0) {
				for (let item of this.finalCoursesforPathways) {
					for (let i = this.allCourseList.length - 1; i >= 0; i--) {
						if (item.CourseId === this.allCourseList[i].id) {
							this.allCourseList.splice(i, 1);
						}
					}
				}
			}
		}
	}

	async getCourseListByClientIdForPathway() {
		await this.pathwayService.getAllCourseListForPathway(this.userClientId).subscribe(async (res: any) => {
			if (res.success) {
				this.allCourseList = [];
				this.allCourseList = res.data;
				for (let item of this.allCourseList) {
					this.duplicateallCourseList.push(Object.assign({}, item));
				}
				await this.addCourrentCourseVersion();
			}
		});
	}

	async onSelectCourse(event: any, updateCourse = false) {
		if (event.id) {
			await this.pathwayService.getAllModuleListForPathway(event.id).subscribe(async (res: any) => {
				if (res.success) {
					let indexData = await this.removeCourse(this.nextCourseIndexCount, true);
					let count = this.getModelIndex();
					let CourseIdexCount = this.getNextCourseIndex();
					let temp = [];
					if (indexData && indexData.removeCourseIndex != null && this.isEditCourse) {
						count = indexData.removeModuleIndex;
						CourseIdexCount = this.nextCourseIndexCount;
					}
					for (let item of res.data) {
						let payload = {
							CourseId: item.CourseId,
							CourseIndex: CourseIdexCount,
							CourseName: item.CourseName,
							isPartCourse: item.isPartCourse,
							WorkbookId: item.WorkbookId,
							ModuleIndex: count,
							ModuleName: item.ModuleName,
							ModuleTypeName: item.ModuleTypeName,
							DiwoModuleId: item.DiwoModuleId,
							ModuleDepedencyIndex: ['No Dependency'],
							Dependency: false,
							ModuleOperation: null,
							Added: false,
							isOpen: false,
							isDepedencyError: false,
							isDepedencyOperationError: false,
							ModuleAsset: item.Workbook?.DiwoAssets[0]?.path,
							ModulePublishDate: item.Workbook?.createdAt,
							haveCertificate: item.Workbook?.haveCertificate ? item.Workbook?.haveCertificate : false,
							isShowCertifiedDropDown: false,
							isCertificationModule: false,
							CourseVersion: event.version,
							CurrentCourseVersion: event.version,
						};

						if (count == 0) {
							payload.ModuleDepedencyIndex = ['No Dependency'];
						}

						temp.push(payload);
						count++;
					}
					if (indexData && indexData.removeCourseIndex != null && this.isEditCourse) {
						this.finalCoursesforPathways.splice(indexData.removeCourseIndex, 0, ...temp);
						await this.adjustModuleIndex();
						await this.dependecyFunction();
					} else {
						this.finalCoursesforPathways = [...this.finalCoursesforPathways, ...temp];
						await this.dependecyFunction();
						this.isEditCourse = false;
						this.selectedCourseIndexforEdit =
							this.finalCoursesforPathways[this.finalCoursesforPathways.length - 1].CourseIndex;
					}
					if (updateCourse) {
						await this.addCourseToPathway();
						this.spinnerService.hide();
					}

					console.log('-this.finalCoursesforPathways-', this.finalCoursesforPathways);
				}
			});
		}
	}

	toggleAccordion(CourseIndex: any) {
		this.isopen = false;
		for (let item of this.finalCoursesforPathways) {
			if (item.CourseIndex === CourseIndex) {
				item.isOpen = !item.isOpen;
				if (item.isOpen) {
					this.isopen = true;
				}
			}
		}

		this.copyDupliateArrayObject();
	}

	async addCourseToPathway() {
		if (this.pathwayCourseForm.invalid) {
			this.markAsTouched(this.pathwayCourseForm);
			return;
		}
		let CourseIndex;
		if (this.editCourseIndex == null) {
			CourseIndex = this.finalCoursesforPathways[this.finalCoursesforPathways.length - 1].CourseIndex;
		} else {
			CourseIndex = this.finalCoursesforPathways[this.editCourseIndex].CourseIndex;
		}

		let flag = false;
		for (let item of this.finalCoursesforPathways) {
			item.Added = true;
			if (item.CourseIndex == CourseIndex) {
				if (item.ModuleDepedencyIndex.length == 0) {
					item.isDepedencyError = true;
					flag = true;
				} else if (item.ModuleDepedencyIndex.length > 1) {
					if (item.ModuleOperation == null || item.ModuleOperation == '' || item.ModuleOperation == undefined) {
						item.isDepedencyOperationError = true;
						flag = true;
					} else {
						item.isDepedencyOperationError = false;
					}
				}

				// if (this.editCourseIndex == null) {
				// item.Added = true;
				// }
			}
		}
		if (flag) {
			return;
		}

		await this.copyDupliateArrayObject();

		this.showCourseAddScreen = false;
		this.isEditCourse = false;
		this.pathwayCourseForm.reset();
	}

	cancelCourseToPathway() {
		if (this.editCourseIndex == null) {
			for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
				if (!this.finalCoursesforPathways[i].Added) {
					this.finalCoursesforPathways.splice(i, 1);
					i--;
				}
			}
		} else if (this.editCourseIndex >= 0) {
			this.createMainArrayObject();
			for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
				if (!this.finalCoursesforPathways[i].Added) {
					this.finalCoursesforPathways.splice(i, 1);
					i--;
				}
			}
		}
		this.showCourseAddScreen = false;
		this.isEditCourse = false;
		this.pathwayCourseForm.reset();
		this.editCourseIndex = null;
	}

	removeCommonElements(arr1, arr2) {
		const uniqueArr1 = arr1.filter((item) => !arr2.includes(item));
		return uniqueArr1;
	}

	removeCourse(i, isComingFromEdit = false) {
		let CourseIndex = !isComingFromEdit ? this.finalCoursesforPathways[i].CourseIndex : i;
		let NumberOfModule = 0;
		let HighestIndexOfModule = 0;
		let ModuleIndexArray = [];
		let removeCourseIndex = null;
		let removeModuleIndex = null;

		if (this.finalCoursesforPathways.length == 0) {
			return;
		}

		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			//Basic Detail of remove course
			if (this.finalCoursesforPathways[i].CourseIndex == CourseIndex) {
				NumberOfModule++;
				HighestIndexOfModule = this.finalCoursesforPathways[i].ModuleIndex;
				ModuleIndexArray.push(this.finalCoursesforPathways[i].ModuleIndex);
			}
		}

		// find starting index of Course which will removed
		if (this.isEditCourse && isComingFromEdit) {
			removeCourseIndex = this.finalCoursesforPathways.findIndex((item) => item.CourseIndex === CourseIndex);
			if (removeCourseIndex > -1) {
				removeModuleIndex = this.finalCoursesforPathways[removeCourseIndex].ModuleIndex;
			}
		}

		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			if (this.finalCoursesforPathways && this.finalCoursesforPathways[i]) {
				//Actual Delete of Course
				if (
					ModuleIndexArray.indexOf(this.finalCoursesforPathways[i].ModuleIndex) > -1 ||
					this.finalCoursesforPathways[i].CourseIndex == CourseIndex
				) {
					this.finalCoursesforPathways.splice(i, 1);
					i--;
					continue;
				}

				//Descrease Module Index by no of modules present in removed course
				if (this.finalCoursesforPathways[i].ModuleIndex > HighestIndexOfModule) {
					this.finalCoursesforPathways[i].ModuleIndex = this.finalCoursesforPathways[i].ModuleIndex - NumberOfModule;
				}

				//Shift Course Index by 1
				if (!this.isEditCourse || !isComingFromEdit) {
					if (this.finalCoursesforPathways[i].CourseIndex > CourseIndex) {
						this.finalCoursesforPathways[i].CourseIndex = this.finalCoursesforPathways[i].CourseIndex - 1;
					}
				}

				//Removed  Module Index From Dependecy Array
				if (this.finalCoursesforPathways[i].ModuleDepedencyIndex.length > 0) {
					this.finalCoursesforPathways[i].ModuleDepedencyIndex = this.removeCommonElements(
						this.finalCoursesforPathways[i].ModuleDepedencyIndex,
						ModuleIndexArray
					);
				}

				if (this.finalCoursesforPathways[i].ModuleDepedencyIndex.length == 0) {
					this.finalCoursesforPathways[i].ModuleDepedencyIndex = ['No Dependency'];
				}

				//Descrease ModuleIndex In Depedency array by no of modules present in removed course
				for (let j = 0; j < this.finalCoursesforPathways[i].ModuleDepedencyIndex.length; j++) {
					if (this.finalCoursesforPathways[i].ModuleDepedencyIndex[j] > HighestIndexOfModule) {
						this.finalCoursesforPathways[i].ModuleDepedencyIndex[j] =
							this.finalCoursesforPathways[i].ModuleDepedencyIndex[j] - NumberOfModule;
					}
				}

				if (this.finalCoursesforPathways[i].ModuleIndex == 0) {
					this.finalCoursesforPathways[i].Dependency = false;
					this.finalCoursesforPathways[i].ModuleOperation = null;
					this.finalCoursesforPathways[i].ModuleDepedencyIndex = ['No Dependency'];
				}

				if (this.finalCoursesforPathways[i].ModuleDepedencyIndex.length == 0) {
					this.finalCoursesforPathways[i].Dependency = false;
					this.finalCoursesforPathways[i].ModuleOperation = null;
				}
			}
		}

		if (!isComingFromEdit) {
			this.copyDupliateArrayObject();
			this.pathwayCourseForm.reset();
		}

		this.dependecyFunction();
		// console.log('-AfterRemove-', this.finalCoursesforPathways);

		return {
			removeCourseIndex,
			removeModuleIndex,
		};
	}

	updateCourseVersion(courseData, index) {
		this.updateCourseData = courseData;
		this.updateCourseIndex = index;
		$('#update_Course_Version').modal('show');
		// this.spinnerService.show();

		// await this.editCourse(index);
		// await this.onSelectCourse({ id: courseData.CourseId, version: courseData.CurrentCourseVersion }, true);
	}

	closeUpdateCOursePopup() {
		$('#update_Course_Version').modal('hide');
		this.updateCourseData = null;
		this.updateCourseIndex = null;
	}

	async updateCourseNewVersion() {
		this.spinnerService.show();
		await this.editCourse(this.updateCourseIndex);
		await this.onSelectCourse(
			{ id: this.updateCourseData.CourseId, version: this.updateCourseData.CurrentCourseVersion },
			true
		);
		this.closeUpdateCOursePopup();
		this.isViewMode = false;
		this.isopen = false;
		setTimeout(() => {
			this.isEditCourse = false;
		}, 500);
	}

	adjustModuleIndex() {
		let ModuleIndex = 0;
		let temp2Array = [];

		for (let item of this.finalCoursesforPathways) {
			let payload = {
				ModuleIndex: item.ModuleIndex,
				CourseIndex: item.CourseIndex,
				UpdatedModuleIndex: ModuleIndex,
			};
			temp2Array.push(payload);
			item.ModuleIndex = ModuleIndex;
			ModuleIndex++;
		}

		for (let item of this.finalCoursesforPathways) {
			if (item.ModuleDepedencyIndex.indexOf('No Dependency') == -1) {
				for (let j = 0; j < item.ModuleDepedencyIndex.length; j++) {
					for (let i = temp2Array.length - 1; i >= 0; i--) {
						if (item.ModuleDepedencyIndex[j] == temp2Array[i].ModuleIndex) {
							item.ModuleDepedencyIndex[j] = temp2Array[i].UpdatedModuleIndex;
							break;
						}
					}
				}
			}
		}
	}

	copyDupliateArrayObject() {
		this.coursesforPathways = [];
		for (let item of this.finalCoursesforPathways) {
			this.coursesforPathways.push(Object.assign({}, item));
		}
	}

	createMainArrayObject() {
		this.finalCoursesforPathways = [];
		for (let item of this.coursesforPathways) {
			this.finalCoursesforPathways.push(Object.assign({}, item));
		}
	}

	onSelectModuleDepedency(event, i) {
		// console.log('-event-', event);
		// console.log('-i-', i);
		this.finalCoursesforPathways[i].isDepedencyError = false;

		if (event[event.length - 1].ModuleIndex == 'No Dependency') {
			this.finalCoursesforPathways[i].ModuleDepedencyIndex = ['No Dependency'];
			this.finalCoursesforPathways[i].ModuleOperation = null;
		} else if (this.finalCoursesforPathways[i].ModuleDepedencyIndex.indexOf('No Dependency') > -1) {
			let temp = [...this.finalCoursesforPathways[i].ModuleDepedencyIndex];
			temp.splice(temp.indexOf('No Dependency'), 1);
			this.finalCoursesforPathways[i].ModuleDepedencyIndex = temp;
		}

		// check for certificate
		// this.finalCoursesforPathways[i].isShowCertifiedDropDown = false;

		// let allHaveCertificate = true;
		// let hasAtLeastOneValidModule = false;

		// for (const module of event) {
		// 	if (module.ModuleIndex !== 'No Dependency') {
		// 		hasAtLeastOneValidModule = true;

		// 		if (!module.haveCertificate) {
		// 			allHaveCertificate = false;
		// 			break;
		// 		}
		// 	}
		// }

		// //Only update to true if all non-"No Dependency" modules have certificates
		// if (hasAtLeastOneValidModule && allHaveCertificate) {
		// 	this.finalCoursesforPathways[i].isShowCertifiedDropDown = true;
		// }

		this.checkSelectedDependecyType();

		// console.log('-event-', event);
		// console.log('-i-', i);
		// console.log('-this.finalCoursesforPathways-', this.finalCoursesforPathways);
	}

	checkSelectedDependecyType() {
		let Index = 0;
		for (let course of this.finalCoursesforPathways) {
			course.moduleDependecyName = [];
			for (let module of course.ModuleDepedencyIndex) {
				if (module != 'No Dependency') {
					for (let item of this.allDepedencyModuleList[Index]) {
						if (item.ModuleIndex === module) {
							course.moduleDependecyName.push(item.ModuleName);
						}
					}
				}
			}
			Index++;
			course.moduleDependecyName = course.moduleDependecyName.toString();
		}
		return;
	}

	onSelectModuleDepedencyOperator(event, i) {
		this.finalCoursesforPathways[i].isDepedencyOperationError = false;
	}

	async editCourse(i) {
		this.showCourseAddScreen = true;
		let data = this.finalCoursesforPathways[i];
		this.selectedCourseIndexforEdit = data.CourseIndex;
		this.isEditCourse = true;
		this.editCourseIndex = i;
		this.pathwayCourseForm.patchValue({
			courseName: data.CourseId,
		});
		this.nextCourseIndexCount = data.CourseIndex;

		this.allCourseList = [];
		for (let item of this.duplicateallCourseList) {
			this.allCourseList.push(Object.assign({}, item));
		}

		if (this.finalCoursesforPathways.length > 0) {
			const currentEditingCourseId = data.CourseId;
			for (let item of this.finalCoursesforPathways) {
				for (let i = this.allCourseList.length - 1; i >= 0; i--) {
					if (item.CourseId === this.allCourseList[i].id && item.CourseId != currentEditingCourseId) {
						this.allCourseList.splice(i, 1);
					}
				}
			}
		}

		await this.checkSelectedDependecyType();
		await this.copyDupliateArrayObject();
		return;
	}

	removeIndividualModule(ModuleIndex, CourseIndex) {
		// Step 1: Remove the module with the specified ModuleIndex
		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			if (this.finalCoursesforPathways[i].ModuleIndex === ModuleIndex) {
				this.finalCoursesforPathways.splice(i, 1);
				break;
			}
		}

		// Step 2: Adjust ModuleIndex values for modules after the removed one
		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			if (this.finalCoursesforPathways[i].ModuleIndex > ModuleIndex) {
				this.finalCoursesforPathways[i].ModuleIndex -= 1;
			}
		}

		// Step 3: Update ModuleDepedencyIndex arrays for remaining modules
		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			let dependencies = this.finalCoursesforPathways[i].ModuleDepedencyIndex;
			// Filter out the removed ModuleIndex and adjust subsequent indices
			let updatedDependencies = [];
			for (let j = 0; j < dependencies.length; j++) {
				if (dependencies[j] !== ModuleIndex) {
					updatedDependencies.push(dependencies[j] > ModuleIndex ? dependencies[j] - 1 : dependencies[j]);
				}
			}

			// Assign the updated dependencies
			this.finalCoursesforPathways[i].ModuleDepedencyIndex = updatedDependencies;

			if (this.finalCoursesforPathways[i].ModuleIndex == 0) {
				this.finalCoursesforPathways[i].Dependency = false;
				this.finalCoursesforPathways[i].ModuleOperation = null;
			}

			if (this.finalCoursesforPathways[i].ModuleDepedencyIndex.length == 0) {
				this.finalCoursesforPathways[i].Dependency = false;
				this.finalCoursesforPathways[i].ModuleOperation = null;
			}
		}

		let courseModuleCount = 0;
		for (let item of this.finalCoursesforPathways) {
			if (CourseIndex == item.CourseIndex) {
				item.isPartCourse = true;
				courseModuleCount++;
			}
		}

		if (courseModuleCount == 0) {
			this.pathwayCourseForm.reset();
		}

		// Step 4: Refresh allDepedencyModuleList based on updated finalCoursesforPathways
		this.dependecyFunction();

		// Force ng-select to refresh by updating the reference to finalCoursesforPathways
		this.finalCoursesforPathways = [...this.finalCoursesforPathways];

		// console.log('--afterRemovefinalCoursesforPathways--', this.finalCoursesforPathways);

		if (this.finalCoursesforPathways.length == 0) {
			this.pathwayCourseForm.reset();
		}

		this.copyDupliateArrayObject();
	}

	previewModule(item: any) {
		this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${item.WorkbookId}`;
	}

	getModelIndex() {
		let index = 0;
		for (let item of this.finalCoursesforPathways) {
			// for (let data of item.CourseModule) {
			index++;
			// }
		}
		return index;
	}

	getNextCourseIndex() {
		let lastCourseIndex = -1;
		for (let module of this.finalCoursesforPathways) {
			if (module.CourseIndex > lastCourseIndex) {
				lastCourseIndex = module.CourseIndex;
			}
		}
		return lastCourseIndex + 1;
	}

	dependecyFunction() {
		this.allDepedencyModuleList = [];
		for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
			let payload = {
				CourseId: null,
				CourseIndex: null,
				WorkbookId: null,
				ModuleIndex: 'No Dependency',
				ModuleName: 'No Dependency',
				ModuleDepedencyIndex: ['No Dependency'],
				Dependency: false,
				ModuleOperation: null,
				Added: false,
				isOpen: false,
				isDepedencyError: false,
				isDepedencyOperationError: false,
				ModuleAsset: null,
				ModulePublishDate: null,
				haveCertificate: false,
				isShowCertifiedDropDown: false,
			};
			let temp = [payload];
			for (let j = 0; j < i; j++) {
				temp.push(this.finalCoursesforPathways[j]);
			}
			this.allDepedencyModuleList.push(temp);
		}
	}

	checkCharacterLimitForPathwayTitle() {
		let title = this.pathwayForm.controls['title'].value;
		this.characterRemainsForPathwayTitle = title
			? this.maxLengthForPathwayTitle - title.length
			: this.maxLengthForPathwayTitle;
	}

	checkCharacterLimitForPathwayDescription() {
		let descrip = this.pathwayForm.controls['description'].value;
		this.characterRemainsForPathwayDescription = descrip
			? this.maxLengthForPathwayDescription - descrip.length
			: this.maxLengthForPathwayDescription;
	}

	savePathways(Published) {
		let payload = {
			pathwaysData: this.pathwayForm.value,
			pathwayCourseModuleData: this.finalCoursesforPathways,
			pathwayCertificationDetails: this.pathwayCertificationDetails,
		};

		if (Published) {
			payload.pathwaysData.status = 'Published';
		} else {
			payload.pathwaysData.status = 'Draft';
		}

		payload.pathwaysData['customFields'] = this.surveyModel.data;

		this.checkSurveyValidation = true;

		if (this.pathwayForm.invalid || !this.surveyModel.validatePage()) {
			this.markAsTouched(this.pathwayForm);
			return;
		}

		if (this.showCourseAddScreen && this.pathwayCourseForm.invalid) {
			this.markAsTouched(this.pathwayCourseForm);
			return;
		}

		if (this.finalCoursesforPathways.length == 0) {
			this.showCourseAddScreen = true;
			this.markAsTouched(this.pathwayCourseForm);
			console.log('----------------Return---------1-------------------');
			return;
		} else {
			for (let i = 0; i < this.finalCoursesforPathways.length; i++) {
				if (!this.finalCoursesforPathways[i].Added) {
					console.log('----------------Return---------2-------------------');
					return;
				}
			}
		}
		console.log('----------------Return---------3-------------------');
		this.checkSurveyValidation = false;

		// console.log('-payload-', payload);
		// return;
		this.spinnerService.show();
		if (this.pathwayForm.value.id == null) {
			this.pathwayService.createDiwoPathway(payload).subscribe((res: any) => {
				if (res.success) {
					this.toastr.success(
						this.appService.getTranslation('Pages.DiwoPathways.AddEdit.Toaster.pathwaycreated'),
						this.appService.getTranslation('Utils.success')
					);

					this.spinnerService.hide();

					this.appService.checkNotifcation = true;
					this.router.navigate(['/diwo-pathways']);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, 'Error');
				}
			});
		} else {
			this.savePagination();
			this.pathwayService.updateDiwoPathway(payload).subscribe((res: any) => {
				if (res.success) {
					this.toastr.success(
						this.appService.getTranslation('Pages.DiwoPathways.AddEdit.Toaster.pathwayupdated'),
						this.appService.getTranslation('Utils.success')
					);

					this.spinnerService.hide();
					this.appService.checkNotifcation = true;
					setTimeout(() => {
						this.router.navigate(['/diwo-pathways']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.error(res.error, this.appService.getTranslation('Utils.error'));
				}
				this.spinnerService.hide();
			});
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/diwo-pathways']);
			}, 100);
		} else {
			this.router.navigate(['/diwo-pathways']);
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('diwoPathwayPageNo', JSON.stringify(payload));
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

	addCertification() {
		//Show Popup With Module Type and List
		this.addCertificationModule = true;
	}

	getModulesList() {
		this.pathwayService.getAllModulesTypes().subscribe((res: any) => {
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
		// this.courseModuleForm.controls['ModuleTypeName'].setValue(event.type);
		// this.courseModuleForm.controls['ModuleId'].setValue(null);
		this.getModule(event.id);
	}

	getModule(ModuleTypeId, isEdit = false) {
		this.pathwayService.getAllModulesByModuleType(this.userClientId, ModuleTypeId).subscribe((res: any) => {
			if (res.success) {
				this.allModuleList = [];
				this.allModuleList = res.data;

				if (isEdit) {
					// console.log('---------', res.data);
					for (let item of res.data) {
						if (item.id === this.pathwayCerticationModuleDetails.WorkbookId) {
							this.selectedCerticationModule = item;
							// console.log('------1111---', this.selectedCerticationModule);

							break;
						}
					}
				}
			}
		});
	}

	cancelCertificationModules() {
		this.addCertificationModule = false;
		if (this.pathwayCerticationModuleDetails.WorkbookId) {
			return;
		}
		this.pathwayForm.controls['haveCertification'].setValue(false);
	}

	selectCertificationModule(event) {
		if (!this.pathwayCerticationModuleDetails.DiwoModuleId || !this.pathwayCerticationModuleDetails.WorkbookId) {
			//Add tosterMessage
			return;
		}

		let payload = this.selectedCerticationModule;
		payload.WorkbookId = payload.id;
		payload.ModuleIndex = this.finalCoursesforPathways.length;
		payload.ModuleName = payload.title;

		let temp = this.allModuleTypeList.filter((item: any) => {
			return item.id == this.pathwayCerticationModuleDetails.DiwoModuleId;
		});
		payload.ModuleTypeName = temp[0].type;
		payload.DiwoModuleId = this.pathwayCerticationModuleDetails.DiwoModuleId;
		// payload.ModuleDepedencyIndex = [];
		// payload.Added;
		payload.isOpen = false;
		// payload.isDepedencyError = false;
		// payload.isDepedencyOperationError = false;
		// payload.isDepedencyOperationError = false;
		// payload.ModuleAsset;
		payload.ModulePublishDate = payload.createdAt;
		payload.isCertificationModule = true;
		payload.id = null;
		delete payload.title;
		delete payload.descrip;

		this.pathwayCertificationDetails = [payload];

		// console.log('--Payload--', this.pathwayCertificationDetails);
		this.pathwayForm.controls['haveCertification'].setValue(true);
		this.addCertificationModule = false;
	}

	onPickModule(event) {
		this.selectedCerticationModule = event;
		// console.log('-----Event----', event);
	}

	toggleAccordionForCertification() {
		// this.isopen = !this.isopen;
		this.pathwayCertificationDetails[0].isOpen = !this.pathwayCertificationDetails[0].isOpen;
	}

	removeCertifcationModule() {
		this.pathwayForm.controls['haveCertification'].setValue(false);
		this.addCertificationModule = false;
		this.pathwayCertificationDetails = [];
		this.pathwayCerticationModuleDetails.DiwoModuleId = null;
		this.pathwayCerticationModuleDetails.WorkbookId = null;
	}

	editCetificationModule() {
		this.addCertificationModule = true;
	}
}
